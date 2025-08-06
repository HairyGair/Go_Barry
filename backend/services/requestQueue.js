// backend/services/requestQueue.js
// Request queuing system to prevent concurrent memory spikes

class RequestQueueManager {
  constructor() {
    this.queues = new Map(); // Different queues for different endpoint types
    this.activeRequests = new Map(); // Track active requests
    this.stats = {
      totalQueued: 0,
      totalProcessed: 0,
      currentActive: 0,
      averageWaitTime: 0
    };
    
    // Configuration
    this.limits = {
      'roadworks': { max: 2, timeout: 30000 }, // Max 2 concurrent roadworks requests
      'alerts': { max: 3, timeout: 20000 },
      'default': { max: 5, timeout: 15000 }
    };
  }

  // Queue middleware factory
  middleware(queueType = 'default') {
    return (req, res, next) => {
      const queueConfig = this.limits[queueType] || this.limits.default;
      const requestId = this.generateRequestId(req);
      
      // Check if we can process immediately
      if (this.canProcessImmediately(queueType, queueConfig)) {
        this.trackRequest(queueType, requestId, req);
        this.setupCleanup(res, queueType, requestId);
        return next();
      }

      // Queue the request
      this.queueRequest(queueType, requestId, req, res, next, queueConfig);
    };
  }

  canProcessImmediately(queueType, config) {
    const activeCount = this.getActiveCount(queueType);
    return activeCount < config.max;
  }

  trackRequest(queueType, requestId, req) {
    if (!this.activeRequests.has(queueType)) {
      this.activeRequests.set(queueType, new Set());
    }
    
    this.activeRequests.get(queueType).add({
      id: requestId,
      startTime: Date.now(),
      path: req.path,
      method: req.method
    });
    
    this.stats.currentActive++;
    console.log(`🚦 Request ${requestId} active (${queueType}): ${this.getActiveCount(queueType)}/${this.limits[queueType]?.max || this.limits.default.max}`);
  }

  setupCleanup(res, queueType, requestId) {
    const cleanup = () => {
      this.removeActiveRequest(queueType, requestId);
      this.processQueue(queueType); // Process next queued request
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
  }

  queueRequest(queueType, requestId, req, res, next, config) {
    if (!this.queues.has(queueType)) {
      this.queues.set(queueType, []);
    }

    const queuedRequest = {
      id: requestId,
      req,
      res,
      next,
      queuedAt: Date.now(),
      timeout: setTimeout(() => {
        this.timeoutRequest(queueType, requestId);
      }, config.timeout)
    };

    this.queues.get(queueType).push(queuedRequest);
    this.stats.totalQueued++;
    
    console.log(`⏳ Request ${requestId} queued (${queueType}): position ${this.queues.get(queueType).length}`);

    // Set queue headers
    res.set('X-Queue-Position', this.queues.get(queueType).length);
    res.set('X-Queue-Type', queueType);
  }

  processQueue(queueType) {
    const queue = this.queues.get(queueType);
    if (!queue || queue.length === 0) return;

    const config = this.limits[queueType] || this.limits.default;
    const activeCount = this.getActiveCount(queueType);

    if (activeCount < config.max) {
      const queuedRequest = queue.shift();
      clearTimeout(queuedRequest.timeout);

      // Calculate wait time for stats
      const waitTime = Date.now() - queuedRequest.queuedAt;
      this.updateAverageWaitTime(waitTime);

      console.log(`✅ Processing queued request ${queuedRequest.id} after ${waitTime}ms wait`);

      // Track the request
      this.trackRequest(queueType, queuedRequest.id, queuedRequest.req);
      this.setupCleanup(queuedRequest.res, queueType, queuedRequest.id);

      // Process the request
      this.stats.totalProcessed++;
      queuedRequest.next();
    }
  }

  timeoutRequest(queueType, requestId) {
    const queue = this.queues.get(queueType);
    if (!queue) return;

    const requestIndex = queue.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return;

    const timedOutRequest = queue.splice(requestIndex, 1)[0];
    
    console.warn(`⏰ Request ${requestId} timed out in queue`);
    
    timedOutRequest.res.status(503).json({
      success: false,
      error: 'Request timed out in queue',
      message: 'Server is currently overloaded. Please try again in a few moments.',
      queueType
    });
  }

  removeActiveRequest(queueType, requestId) {
    const activeSet = this.activeRequests.get(queueType);
    if (!activeSet) return;

    for (const request of activeSet) {
      if (request.id === requestId) {
        activeSet.delete(request);
        this.stats.currentActive--;
        
        const duration = Date.now() - request.startTime;
        console.log(`✅ Request ${requestId} completed in ${duration}ms`);
        break;
      }
    }
  }

  getActiveCount(queueType) {
    return this.activeRequests.get(queueType)?.size || 0;
  }

  generateRequestId(req) {
    return `${req.method}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  updateAverageWaitTime(waitTime) {
    if (this.stats.totalProcessed === 0) {
      this.stats.averageWaitTime = waitTime;
    } else {
      this.stats.averageWaitTime = (this.stats.averageWaitTime + waitTime) / 2;
    }
  }

  // Get comprehensive stats
  getStats() {
    const queueStats = {};
    for (const [queueType, queue] of this.queues) {
      queueStats[queueType] = {
        queued: queue.length,
        active: this.getActiveCount(queueType),
        maxConcurrent: this.limits[queueType]?.max || this.limits.default.max
      };
    }

    return {
      ...this.stats,
      queues: queueStats,
      timestamp: new Date().toISOString()
    };
  }

  // Health check
  getHealth() {
    const totalQueued = Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0);
    const totalActive = this.stats.currentActive;

    let status = 'healthy';
    if (totalQueued > 10 || totalActive > 15) {
      status = 'overloaded';
    } else if (totalQueued > 5 || totalActive > 10) {
      status = 'busy';
    }

    return {
      status,
      totalQueued,
      totalActive,
      averageWaitTime: Math.round(this.stats.averageWaitTime),
      message: status === 'healthy' ? 'Request processing normal' : 
               status === 'busy' ? 'High request volume' : 
               'Server overloaded - requests being queued'
    };
  }

  // Clear all queues (emergency)
  clearAllQueues() {
    for (const [queueType, queue] of this.queues) {
      queue.forEach(req => {
        clearTimeout(req.timeout);
        req.res.status(503).json({
          success: false,
          error: 'Server restart - request cancelled',
          queueType
        });
      });
      queue.length = 0;
    }
    
    this.activeRequests.clear();
    this.stats.currentActive = 0;
    console.log('🧹 All request queues cleared');
  }
}

// Singleton instance
const requestQueue = new RequestQueueManager();

export default requestQueue;
