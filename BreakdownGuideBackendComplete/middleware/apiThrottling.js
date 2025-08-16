// backend/middleware/apiThrottling.js
// Intelligent API throttling and request management for 2GB memory constraint

import memoryMonitor from '../services/memoryMonitor.js';

/**
 * API Throttling Manager for memory-aware request limiting
 * Designed for Go Barry's 2GB RAM constraint on Render.com
 */
class APIThrottling {
  constructor() {
    this.requestLimits = {
      global: { requests: 100, window: 60000, current: 0, resetTime: Date.now() }, // 100 req/min
      ip: new Map(), // IP-based limiting
      heavy: { requests: 10, window: 60000, current: 0, resetTime: Date.now() }, // Heavy endpoints
      burst: { requests: 20, window: 10000, current: 0, resetTime: Date.now() } // Burst protection
    };
    
    this.memoryThresholds = {
      normal: 0.6,   // 60% - normal operation
      limited: 0.75, // 75% - start limiting
      strict: 0.85,  // 85% - strict limiting
      emergency: 0.95 // 95% - emergency shutdown
    };
    
    this.endpointCategories = {
      heavy: [
        '/api/gtfs/match',
        '/api/roadworks/unified',
        '/api/alerts',
        '/api/incidents',
        '/api/streetworks',
        '/api/analytics'
      ],
      light: [
        '/api/health',
        '/api/supervisor',
        '/api/memory'
      ],
      admin: [
        '/api/admin'
      ]
    };
    
    this.queuedRequests = [];
    this.maxQueueSize = 50;
    this.processingQueue = false;
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      queuedRequests: 0,
      memoryRejections: 0,
      burstRejections: 0
    };
    
    // Start queue processor
    this.startQueueProcessor();
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Main throttling middleware
   */
  throttleMiddleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const clientIP = this.getClientIP(req);
      const endpoint = req.path;
      const requestId = `${clientIP}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      req.throttleId = requestId;
      this.stats.totalRequests++;
      
      try {
        // Check memory pressure first
        const memoryStatus = memoryMonitor.getMemoryStatus();
        const memoryUsage = memoryStatus.usagePercentage / 100;
        
        if (memoryUsage > this.memoryThresholds.emergency) {
          this.stats.memoryRejections++;
          return this.sendThrottleResponse(res, {
            code: 'MEMORY_EMERGENCY',
            message: 'System under extreme memory pressure',
            retryAfter: 120,
            memoryUsage: Math.round(memoryUsage * 100)
          });
        }
        
        // Apply memory-based throttling
        const throttleLevel = this.getThrottleLevel(memoryUsage);
        const limits = this.getAdjustedLimits(throttleLevel);
        
        // Check global rate limit
        if (!this.checkGlobalLimit(limits.global)) {
          this.stats.throttledRequests++;
          return this.sendThrottleResponse(res, {
            code: 'GLOBAL_RATE_LIMIT',
            message: 'Global rate limit exceeded',
            retryAfter: 60
          });
        }
        
        // Check IP-based rate limit
        if (!this.checkIPLimit(clientIP, limits.ip)) {
          this.stats.throttledRequests++;
          return this.sendThrottleResponse(res, {
            code: 'IP_RATE_LIMIT',
            message: 'IP rate limit exceeded',
            retryAfter: 30
          });
        }
        
        // Check endpoint-specific limits
        const endpointCategory = this.categorizeEndpoint(endpoint);
        if (endpointCategory === 'heavy') {
          if (memoryUsage > this.memoryThresholds.limited) {
            // Queue heavy requests during high memory usage
            if (this.queuedRequests.length >= this.maxQueueSize) {
              this.stats.throttledRequests++;
              return this.sendThrottleResponse(res, {
                code: 'QUEUE_FULL',
                message: 'Request queue is full',
                retryAfter: 30
              });
            }
            
            return this.queueRequest(req, res, next);
          }
          
          if (!this.checkHeavyEndpointLimit(limits.heavy)) {
            this.stats.throttledRequests++;
            return this.sendThrottleResponse(res, {
              code: 'HEAVY_ENDPOINT_LIMIT',
              message: 'Heavy endpoint rate limit exceeded',
              retryAfter: 60
            });
          }
        }
        
        // Check burst protection
        if (!this.checkBurstLimit()) {
          this.stats.burstRejections++;
          return this.sendThrottleResponse(res, {
            code: 'BURST_PROTECTION',
            message: 'Too many requests in short time',
            retryAfter: 10
          });
        }
        
        // Update counters
        this.updateCounters(clientIP, endpointCategory);
        
        // Add throttling info to request
        req.throttleInfo = {
          level: throttleLevel,
          category: endpointCategory,
          memoryUsage: Math.round(memoryUsage * 100),
          processingTime: Date.now() - startTime
        };
        
        // Add response headers
        res.set({
          'X-RateLimit-Limit': limits.global.toString(),
          'X-RateLimit-Remaining': Math.max(0, limits.global - this.requestLimits.global.current).toString(),
          'X-RateLimit-Reset': Math.ceil(this.requestLimits.global.resetTime / 1000).toString(),
          'X-Memory-Usage': `${Math.round(memoryUsage * 100)}%`,
          'X-Throttle-Level': throttleLevel
        });
        
        next();
        
      } catch (error) {
        console.error(`❌ Throttling middleware error for ${requestId}:`, error);
        next(); // Continue on throttling errors
      }
    };
  }

  /**
   * Get current throttle level based on memory usage
   */
  getThrottleLevel(memoryUsage) {
    if (memoryUsage > this.memoryThresholds.strict) return 'strict';
    if (memoryUsage > this.memoryThresholds.limited) return 'limited';
    if (memoryUsage > this.memoryThresholds.normal) return 'moderate';
    return 'normal';
  }

  /**
   * Get adjusted limits based on throttle level
   */
  getAdjustedLimits(level) {
    const baseLimits = {
      global: 100,
      ip: 50,
      heavy: 10
    };
    
    const adjustments = {
      normal: 1.0,
      moderate: 0.8,
      limited: 0.5,
      strict: 0.2
    };
    
    const multiplier = adjustments[level] || 1.0;
    
    return {
      global: Math.floor(baseLimits.global * multiplier),
      ip: Math.floor(baseLimits.ip * multiplier),
      heavy: Math.floor(baseLimits.heavy * multiplier)
    };
  }

  /**
   * Check global rate limit
   */
  checkGlobalLimit(limit) {
    const now = Date.now();
    
    if (now > this.requestLimits.global.resetTime) {
      this.requestLimits.global.current = 0;
      this.requestLimits.global.resetTime = now + this.requestLimits.global.window;
    }
    
    return this.requestLimits.global.current < limit;
  }

  /**
   * Check IP-based rate limit
   */
  checkIPLimit(ip, limit) {
    const now = Date.now();
    
    if (!this.requestLimits.ip.has(ip)) {
      this.requestLimits.ip.set(ip, {
        current: 0,
        resetTime: now + 60000 // 1 minute window
      });
    }
    
    const ipLimit = this.requestLimits.ip.get(ip);
    
    if (now > ipLimit.resetTime) {
      ipLimit.current = 0;
      ipLimit.resetTime = now + 60000;
    }
    
    return ipLimit.current < limit;
  }

  /**
   * Check heavy endpoint limit
   */
  checkHeavyEndpointLimit(limit) {
    const now = Date.now();
    
    if (now > this.requestLimits.heavy.resetTime) {
      this.requestLimits.heavy.current = 0;
      this.requestLimits.heavy.resetTime = now + this.requestLimits.heavy.window;
    }
    
    return this.requestLimits.heavy.current < limit;
  }

  /**
   * Check burst protection
   */
  checkBurstLimit() {
    const now = Date.now();
    
    if (now > this.requestLimits.burst.resetTime) {
      this.requestLimits.burst.current = 0;
      this.requestLimits.burst.resetTime = now + this.requestLimits.burst.window;
    }
    
    return this.requestLimits.burst.current < this.requestLimits.burst.requests;
  }

  /**
   * Update request counters
   */
  updateCounters(ip, category) {
    this.requestLimits.global.current++;
    this.requestLimits.burst.current++;
    
    if (this.requestLimits.ip.has(ip)) {
      this.requestLimits.ip.get(ip).current++;
    }
    
    if (category === 'heavy') {
      this.requestLimits.heavy.current++;
    }
  }

  /**
   * Categorize endpoint by resource usage
   */
  categorizeEndpoint(path) {
    for (const [category, endpoints] of Object.entries(this.endpointCategories)) {
      if (endpoints.some(endpoint => path.startsWith(endpoint))) {
        return category;
      }
    }
    return 'normal';
  }

  /**
   * Queue request for later processing
   */
  queueRequest(req, res, next) {
    const queueItem = {
      req,
      res,
      next,
      timestamp: Date.now(),
      timeout: setTimeout(() => {
        this.removeFromQueue(queueItem);
        this.sendThrottleResponse(res, {
          code: 'QUEUE_TIMEOUT',
          message: 'Request timed out in queue',
          retryAfter: 30
        });
      }, 30000) // 30 second timeout
    };
    
    this.queuedRequests.push(queueItem);
    this.stats.queuedRequests++;
    
    console.log(`⏳ Request queued: ${this.queuedRequests.length}/${this.maxQueueSize}`);
  }

  /**
   * Start queue processor
   */
  startQueueProcessor() {
    if (this.processingQueue) return;
    
    this.processingQueue = true;
    
    const processQueue = async () => {
      if (this.queuedRequests.length === 0) {
        setTimeout(processQueue, 1000);
        return;
      }
      
      const memoryStatus = memoryMonitor.getMemoryStatus();
      const memoryUsage = memoryStatus.usagePercentage / 100;
      
      // Only process queue if memory usage is acceptable
      if (memoryUsage < this.memoryThresholds.limited) {
        const queueItem = this.queuedRequests.shift();
        if (queueItem) {
          clearTimeout(queueItem.timeout);
          
          console.log(`▶️ Processing queued request: ${this.queuedRequests.length} remaining`);
          
          try {
            queueItem.next();
          } catch (error) {
            console.error('❌ Error processing queued request:', error);
          }
        }
      }
      
      setTimeout(processQueue, 100);
    };
    
    processQueue();
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(queueItem) {
    const index = this.queuedRequests.indexOf(queueItem);
    if (index > -1) {
      this.queuedRequests.splice(index, 1);
      clearTimeout(queueItem.timeout);
    }
  }

  /**
   * Send throttle response
   */
  sendThrottleResponse(res, options) {
    const { code, message, retryAfter, memoryUsage } = options;
    
    res.status(429).set({
      'Retry-After': retryAfter?.toString() || '60',
      'X-Throttle-Code': code,
      'Content-Type': 'application/json'
    }).json({
      success: false,
      error: message,
      code,
      retryAfter,
      memoryUsage,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredLimits();
    }, 60000); // Clean up every minute
  }

  /**
   * Clean up expired rate limits
   */
  cleanupExpiredLimits() {
    const now = Date.now();
    
    // Clean up IP limits
    for (const [ip, limit] of this.requestLimits.ip.entries()) {
      if (now > limit.resetTime + 300000) { // 5 minutes after reset
        this.requestLimits.ip.delete(ip);
      }
    }
    
    // Clean up expired queue items
    this.queuedRequests = this.queuedRequests.filter(item => {
      if (now - item.timestamp > 60000) { // 1 minute timeout
        clearTimeout(item.timeout);
        this.sendThrottleResponse(item.res, {
          code: 'REQUEST_EXPIRED',
          message: 'Request expired in queue',
          retryAfter: 30
        });
        return false;
      }
      return true;
    });
  }

  /**
   * Get throttling statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.queuedRequests.length,
      activeIPLimits: this.requestLimits.ip.size,
      currentLimits: {
        global: this.requestLimits.global.current,
        heavy: this.requestLimits.heavy.current,
        burst: this.requestLimits.burst.current
      },
      throttleRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.throttledRequests / this.stats.totalRequests) * 100) 
        : 0
    };
  }

  /**
   * Emergency cleanup
   */
  emergencyCleanup() {
    console.log(`🚨 APIThrottling: Emergency cleanup - clearing ${this.queuedRequests.length} queued requests`);
    
    // Clear all queued requests
    for (const queueItem of this.queuedRequests) {
      clearTimeout(queueItem.timeout);
      this.sendThrottleResponse(queueItem.res, {
        code: 'EMERGENCY_CLEANUP',
        message: 'System emergency cleanup',
        retryAfter: 120
      });
    }
    
    this.queuedRequests.length = 0;
    
    // Clear IP limits
    this.requestLimits.ip.clear();
    
    // Reset counters
    this.requestLimits.global.current = 0;
    this.requestLimits.heavy.current = 0;
    this.requestLimits.burst.current = 0;
    
    console.log('✅ APIThrottling: Emergency cleanup completed');
  }

  /**
   * Health check
   */
  getHealthStatus() {
    const memoryStatus = memoryMonitor.getMemoryStatus();
    const memoryUsage = memoryStatus.usagePercentage / 100;
    const throttleLevel = this.getThrottleLevel(memoryUsage);
    
    return {
      healthy: throttleLevel !== 'strict',
      throttleLevel,
      memoryUsage: Math.round(memoryUsage * 100),
      queueLength: this.queuedRequests.length,
      stats: this.getStats()
    };
  }
}

// Create singleton instance
const apiThrottling = new APIThrottling();

// Register with memory monitor
memoryMonitor.registerCleanupCallback((type) => {
  if (type === 'emergency' || type === 'emergency_shutdown') {
    apiThrottling.emergencyCleanup();
  }
});

export default apiThrottling;
export { APIThrottling };