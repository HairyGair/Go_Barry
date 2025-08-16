// backend/utils/rateLimiter.js
// Enhanced rate limiter with queue management and burst handling

class RateLimiter {
  constructor(maxRequests = 1, windowMs = 1000, options = {}) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.queue = [];
    this.processing = false;
    this.requestTimes = [];
    
    // Enhanced options
    this.maxQueueSize = options.maxQueueSize || 100;
    this.timeout = options.timeout || 30000;
    this.burstAllowance = options.burstAllowance || 1;
    this.retryOnTimeout = options.retryOnTimeout || false;
  }

  async throttle(fn, priority = 0) {
    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Rate limiter queue is full');
    }
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Remove from queue
        const index = this.queue.findIndex(item => item.timeoutId === timeoutId);
        if (index > -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Rate limiter timeout'));
      }, this.timeout);
      
      this.queue.push({ 
        fn, 
        resolve, 
        reject, 
        priority,
        timeoutId,
        addedAt: Date.now()
      });
      
      // Sort by priority (higher priority first)
      this.queue.sort((a, b) => b.priority - a.priority);
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    // Check rate limit
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < this.windowMs);
    
    if (this.requestTimes.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = this.windowMs - (now - oldestRequest) + 1;
      
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }
    
    this.processing = true;
    const item = this.queue.shift();
    
    // Clear timeout
    clearTimeout(item.timeoutId);
    
    // Record request time
    this.requestTimes.push(now);
    
    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      // Retry logic for timeouts
      if (this.retryOnTimeout && error.message.includes('timeout')) {
        console.log('🔄 Retrying after timeout...');
        this.queue.unshift({
          ...item,
          priority: item.priority + 1 // Increase priority for retry
        });
      } else {
        item.reject(error);
      }
    }
    
    this.processing = false;
    
    // Process next item after a small delay
    setTimeout(() => this.processQueue(), 10);
  }
  
  getQueueLength() {
    return this.queue.length;
  }
  
  clearQueue() {
    this.queue.forEach(item => {
      clearTimeout(item.timeoutId);
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Create instances for different services with optimized settings
export const nominatimRateLimiter = new RateLimiter(1, 1000, {
  maxQueueSize: 50,
  timeout: 5000,
  burstAllowance: 2,
  retryOnTimeout: false // Don't retry on Nominatim timeouts
});

export const googleRateLimiter = new RateLimiter(10, 1000, {
  maxQueueSize: 100,
  timeout: 3000,
  burstAllowance: 5
});

export const postcodeRateLimiter = new RateLimiter(100, 1000, {
  maxQueueSize: 200,
  timeout: 2000
});

export default RateLimiter;
