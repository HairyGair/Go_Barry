import axios from 'axios';
// Lazy load p-retry to prevent memory issues
let pRetry = null;

class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.exponentialBackoff = options.exponentialBackoff !== false;
    this.onRetryAttempt = options.onRetryAttempt || (() => {});
    this.retryQueue = [];
    this.processing = false;
  }

  async executeWithRetry(fn, context = {}) {
    // Lazy load p-retry on first use
    if (!pRetry) {
      const module = await import('p-retry');
      pRetry = module.default;
    }
    
    const options = {
      retries: this.maxRetries,
      minTimeout: this.retryDelay,
      maxTimeout: this.retryDelay * 10,
      factor: this.exponentialBackoff ? 2 : 1,
      onFailedAttempt: (error) => {
        console.log(`[RetryManager] Attempt ${error.attemptNumber} failed: ${error.message}`);
        this.onRetryAttempt({
          attempt: error.attemptNumber,
          retriesLeft: error.retriesLeft,
          error: error.message,
          context
        });
      }
    };

    try {
      return await pRetry(fn, options);
    } catch (error) {
      console.error('[RetryManager] All retry attempts failed:', error);
      // Add to retry queue for later processing
      this.addToQueue({ fn, context, error });
      throw error;
    }
  }

  addToQueue(item) {
    this.retryQueue.push({
      ...item,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Limit queue size
    if (this.retryQueue.length > 100) {
      this.retryQueue.shift(); // Remove oldest
    }
  }

  async processQueue() {
    if (this.processing || this.retryQueue.length === 0) return;
    
    this.processing = true;
    const batch = this.retryQueue.splice(0, 10); // Process 10 at a time
    
    for (const item of batch) {
      try {
        await item.fn();
        console.log('[RetryManager] Successfully processed queued item');
      } catch (error) {
        item.retryCount++;
        if (item.retryCount < 5) {
          this.retryQueue.push(item); // Re-queue if not exceeded max
        }
      }
    }
    
    this.processing = false;
  }

  getQueueStatus() {
    return {
      queueSize: this.retryQueue.length,
      processing: this.processing,
      oldestItem: this.retryQueue[0]?.timestamp
    };
  }
}

// Street Manager specific retry logic
export class StreetManagerRetryHandler {
  constructor() {
    this.retryManager = new RetryManager({
      maxRetries: 5,
      retryDelay: 2000,
      exponentialBackoff: true
    });
    
    // Don't start interval on construction - start on first use
    this.intervalStarted = false;
  }
  
  startQueueProcessor() {
    if (!this.intervalStarted) {
      // Process queue every 5 minutes
      setInterval(() => this.retryManager.processQueue(), 300000);
      this.intervalStarted = true;
    }
  }

  async processWebhookWithRetry(payload, headers) {
    this.startQueueProcessor(); // Start queue processor on first use
    return this.retryManager.executeWithRetry(
      async () => {
        // Your existing webhook processing logic
        const response = await this.sendToSupabase(payload);
        if (!response.success) {
          throw new Error('Failed to store in Supabase');
        }
        return response;
      },
      { type: 'webhook', payload: payload.MessageId }
    );
  }

  async sendToSupabase(data) {
    // Simulate Supabase call with circuit breaker
    const { circuitBreakers } = await import('./circuitBreaker.js');
    
    return circuitBreakers.streetManager.execute(
      async () => {
        // Actual Supabase logic here
        const response = await axios.post(
          `${process.env.SUPABASE_URL}/rest/v1/streetworks`,
          data,
          {
            headers: {
              'apikey': process.env.SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return { success: true, data: response.data };
      },
      async () => {
        // Fallback: Store locally
        const fs = await import('fs/promises');
        const path = `./data/streetmanager_fallback_${Date.now()}.json`;
        await fs.writeFile(path, JSON.stringify(data));
        return { success: true, fallback: true, path };
      }
    );
  }
}

export default RetryManager;
