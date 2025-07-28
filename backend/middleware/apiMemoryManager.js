// backend/middleware/apiMemoryManager.js
// Comprehensive API-level memory management for 2GB Render.com constraint

import memoryMonitor from '../services/memoryMonitor.js';

/**
 * API Memory Manager - Request-level memory optimization middleware
 * Designed for Go Barry's 2GB RAM constraint on Render.com
 */
class APIMemoryManager {
  constructor() {
    this.requestMemoryLimit = 50 * 1024 * 1024; // 50MB per request max
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.maxConcurrentRequests = 10; // Limit concurrent heavy requests
    this.memoryPressureThreshold = 0.7; // 70% of total memory
    this.responseCache = new Map();
    this.maxCacheSize = 100;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.requestCounter = 0;
    this.memoryStats = {
      totalRequests: 0,
      rejectedRequests: 0,
      memoryPressureRejections: 0,
      averageRequestMemory: 0
    };
  }

  /**
   * Memory-aware request middleware
   */
  memoryAwareMiddleware() {
    return (req, res, next) => {
      const requestId = `req_${++this.requestCounter}_${Date.now()}`;
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      req.requestId = requestId;
      req.startTime = startTime;
      req.startMemory = startMemory;
      
      // Check if system is under memory pressure
      const currentMemory = process.memoryUsage();
      const memoryPressure = currentMemory.rss / (2 * 1024 * 1024 * 1024); // 2GB limit
      
      if (memoryPressure > this.memoryPressureThreshold) {
        this.memoryStats.memoryPressureRejections++;
        console.warn(`🚨 Request ${requestId} rejected due to memory pressure: ${Math.round(memoryPressure * 100)}%`);
        
        return res.status(503).json({
          success: false,
          error: 'System under memory pressure',
          code: 'MEMORY_PRESSURE',
          retryAfter: 30
        });
      }
      
      // Limit concurrent requests for memory-heavy endpoints
      if (this.isMemoryHeavyEndpoint(req.path) && this.activeRequests.size >= this.maxConcurrentRequests) {
        this.memoryStats.rejectedRequests++;
        console.warn(`🚨 Request ${requestId} rejected: too many concurrent heavy requests (${this.activeRequests.size})`);
        
        return res.status(429).json({
          success: false,
          error: 'Too many concurrent requests',
          code: 'RATE_LIMITED',
          retryAfter: 10
        });
      }
      
      // Track active request
      this.activeRequests.set(requestId, {
        path: req.path,
        method: req.method,
        startTime,
        startMemory: startMemory.heapUsed
      });
      
      // Set up response cleanup
      const originalEnd = res.end;
      res.end = (...args) => {
        this.cleanupRequest(requestId, req, res);
        return originalEnd.call(res, ...args);
      };
      
      // Set up request timeout for memory cleanup
      const timeoutId = setTimeout(() => {
        if (this.activeRequests.has(requestId)) {
          console.warn(`⏰ Request ${requestId} timed out after 30s - cleaning up memory`);
          this.forceCleanupRequest(requestId);
        }
      }, 30000); // 30 second timeout
      
      req.timeoutId = timeoutId;
      
      this.memoryStats.totalRequests++;
      next();
    };
  }

  /**
   * Response caching middleware for memory efficiency
   */
  responseCache() {
    return (req, res, next) => {
      const cacheKey = this.generateCacheKey(req);
      
      // Check cache for GET requests only
      if (req.method === 'GET' && this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey);
        
        if (Date.now() - cached.timestamp < this.cacheTTL) {
          console.log(`📦 Cache hit for ${req.path}`);
          res.set('X-Cache', 'HIT');
          return res.json(cached.data);
        } else {
          // Remove expired cache entry
          this.responseCache.delete(cacheKey);
        }
      }
      
      // Intercept response for caching
      if (req.method === 'GET' && this.isCacheable(req.path)) {
        const originalJson = res.json;
        res.json = (data) => {
          // Cache successful responses only
          if (res.statusCode === 200 && data) {
            this.cacheResponse(cacheKey, data);
          }
          res.set('X-Cache', 'MISS');
          return originalJson.call(res, data);
        };
      }
      
      next();
    };
  }

  /**
   * Streaming response middleware for large datasets
   */
  streamingResponse() {
    return (req, res, next) => {
      // Add streaming helper to response
      res.streamJSON = (data, chunkSize = 100) => {
        if (!Array.isArray(data)) {
          return res.json(data);
        }
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked',
          'X-Streaming': 'true'
        });
        
        // Start JSON array
        res.write('{"success":true,"data":[');
        
        let first = true;
        const stream = () => {
          const chunk = data.splice(0, chunkSize);
          if (chunk.length === 0) {
            // End JSON array and close response
            res.write(']}');
            res.end();
            
            // Clean up remaining data
            data.length = 0;
            
            // Force garbage collection
            if (global.gc) {
              setTimeout(() => global.gc(), 100);
            }
            return;
          }
          
          // Write chunk
          const chunkJson = chunk.map(item => JSON.stringify(item)).join(',');
          const prefix = first ? '' : ',';
          res.write(prefix + chunkJson);
          first = false;
          
          // Clean up processed chunk
          chunk.length = 0;
          
          // Schedule next chunk
          setImmediate(stream);
        };
        
        stream();
      };
      
      next();
    };
  }

  /**
   * Database query optimization middleware
   */
  queryOptimization() {
    return (req, res, next) => {
      // Add query optimization helpers
      req.optimizeQuery = (options = {}) => {
        const defaults = {
          limit: 100,
          offset: 0,
          fields: '*',
          orderBy: 'created_at',
          order: 'desc'
        };
        
        // Apply memory-conscious defaults
        const optimized = { ...defaults, ...options };
        
        // Enforce maximum limits
        if (optimized.limit > 1000) {
          console.warn(`⚠️ Query limit reduced from ${optimized.limit} to 1000 for memory safety`);
          optimized.limit = 1000;
        }
        
        return optimized;
      };
      
      // Add pagination helper
      req.getPagination = () => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const offset = (page - 1) * limit;
        
        return { page, limit, offset };
      };
      
      next();
    };
  }

  /**
   * Memory pressure detection middleware
   */
  memoryPressureCheck() {
    return (req, res, next) => {
      const memoryStatus = memoryMonitor.getMemoryStatus();
      
      if (!memoryStatus.isHealthy) {
        res.set('X-Memory-Pressure', 'HIGH');
        
        // For heavy endpoints, apply stricter limits
        if (this.isMemoryHeavyEndpoint(req.path)) {
          const usage = memoryStatus.usagePercentage;
          if (usage > 80) {
            return res.status(503).json({
              success: false,
              error: 'System under high memory pressure',
              code: 'HIGH_MEMORY_PRESSURE',
              memoryUsage: `${usage}%`,
              retryAfter: 60
            });
          }
        }
      }
      
      // Add memory info to response headers
      res.set('X-Memory-Usage', `${memoryStatus.usagePercentage}%`);
      res.set('X-Request-Id', req.requestId);
      
      next();
    };
  }

  /**
   * Request cleanup after completion
   */
  cleanupRequest(requestId, req, res) {
    if (req.timeoutId) {
      clearTimeout(req.timeoutId);
    }
    
    const requestInfo = this.activeRequests.get(requestId);
    if (requestInfo) {
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - requestInfo.startMemory;
      const duration = Date.now() - requestInfo.startTime;
      
      // Update stats
      this.updateMemoryStats(memoryDelta);
      
      console.log(`🔄 Request ${requestId} completed: ${duration}ms, ${Math.round(memoryDelta / 1024 / 1024)}MB delta`);
      
      this.activeRequests.delete(requestId);
      
      // Trigger cleanup if memory delta was large
      if (memoryDelta > 10 * 1024 * 1024) { // 10MB
        if (global.gc) {
          setTimeout(() => global.gc(), 100);
        }
      }
    }
  }

  /**
   * Force cleanup for timed out requests
   */
  forceCleanupRequest(requestId) {
    this.activeRequests.delete(requestId);
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Check if endpoint is memory-heavy
   */
  isMemoryHeavyEndpoint(path) {
    const heavyEndpoints = [
      '/api/gtfs',
      '/api/roadworks/unified',
      '/api/alerts',
      '/api/incidents',
      '/api/streetworks',
      '/api/analytics'
    ];
    
    return heavyEndpoints.some(endpoint => path.startsWith(endpoint));
  }

  /**
   * Generate cache key for request
   */
  generateCacheKey(req) {
    const key = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    return Buffer.from(key).toString('base64').substring(0, 50);
  }

  /**
   * Check if response should be cached
   */
  isCacheable(path) {
    const cacheableEndpoints = [
      '/api/gtfs/stats',
      '/api/health',
      '/api/roadworks/sources',
      '/api/gtfs/health'
    ];
    
    return cacheableEndpoints.some(endpoint => path.startsWith(endpoint));
  }

  /**
   * Cache response data
   */
  cacheResponse(key, data) {
    // Prevent cache from growing too large
    if (this.responseCache.size >= this.maxCacheSize) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
    
    this.responseCache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep copy
      timestamp: Date.now()
    });
  }

  /**
   * Update memory statistics
   */
  updateMemoryStats(memoryDelta) {
    const currentAvg = this.memoryStats.averageRequestMemory;
    const totalRequests = this.memoryStats.totalRequests;
    
    this.memoryStats.averageRequestMemory = 
      (currentAvg * (totalRequests - 1) + memoryDelta) / totalRequests;
  }

  /**
   * Get middleware statistics
   */
  getStats() {
    return {
      ...this.memoryStats,
      activeRequests: this.activeRequests.size,
      cacheSize: this.responseCache.size,
      averageRequestMemoryMB: Math.round(this.memoryStats.averageRequestMemory / 1024 / 1024)
    };
  }

  /**
   * Clear all caches and reset
   */
  clearCaches() {
    this.responseCache.clear();
    this.activeRequests.clear();
    console.log('🧹 API Memory Manager caches cleared');
  }

  /**
   * Emergency memory cleanup
   */
  emergencyCleanup() {
    console.log('🚨 API Memory Manager: Emergency cleanup initiated');
    
    // Clear all caches
    this.clearCaches();
    
    // Reset request queue
    this.requestQueue.length = 0;
    
    // Force garbage collection
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
    
    console.log('✅ API Memory Manager: Emergency cleanup completed');
  }
}

// Create singleton instance
const apiMemoryManager = new APIMemoryManager();

// Register with memory monitor for emergency cleanup
memoryMonitor.registerCleanupCallback((type) => {
  if (type === 'emergency' || type === 'emergency_shutdown') {
    apiMemoryManager.emergencyCleanup();
  }
});

export default apiMemoryManager;
export { APIMemoryManager };