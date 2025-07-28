// backend/middleware/requestMemoryCleanup.js
// Request-level memory cleanup and garbage collection optimization

import { EventEmitter } from 'events';

/**
 * Request Memory Cleanup Manager
 * Handles memory cleanup at the request level to prevent memory leaks
 */
class RequestMemoryCleanup extends EventEmitter {
  constructor() {
    super();
    
    this.pendingCleanups = new Map();
    this.gcScheduled = false;
    this.cleanupCallbacks = new Set();
    this.stats = {
      totalRequests: 0,
      cleanedRequests: 0,
      forcedGCCount: 0,
      avgCleanupTime: 0
    };
    
    console.log('🧹 Request Memory Cleanup Manager initialized');
  }

  /**
   * Register a request for memory tracking and cleanup
   */
  registerRequest(req, res) {
    const requestId = `${req.method}-${req.originalUrl}-${Date.now()}`;
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    this.stats.totalRequests++;

    // Create request cleanup context
    const cleanupContext = {
      requestId,
      startTime,
      startMemory: startMemory.heapUsed,
      tempData: new Map(),
      eventListeners: new Set(),
      timers: new Set(),
      streams: new Set(),
      dbConnections: new Set()
    };

    // Add cleanup tracking methods to request object
    req.memoryCleanup = {
      // Track temporary data that should be cleaned up
      addTempData: (key, data) => {
        cleanupContext.tempData.set(key, data);
      },
      
      // Track event listeners for cleanup
      trackEventListener: (emitter, event, listener) => {
        cleanupContext.eventListeners.add({ emitter, event, listener });
      },
      
      // Track timers for cleanup
      trackTimer: (timerId) => {
        cleanupContext.timers.add(timerId);
      },
      
      // Track streams for cleanup
      trackStream: (stream) => {
        cleanupContext.streams.add(stream);
      },
      
      // Track database connections
      trackConnection: (connection) => {
        cleanupContext.dbConnections.add(connection);
      },
      
      // Manual cleanup trigger
      cleanup: () => {
        this.performRequestCleanup(requestId);
      }
    };

    // Store cleanup context
    this.pendingCleanups.set(requestId, cleanupContext);

    // Set up automatic cleanup on response finish
    res.on('finish', () => {
      this.performRequestCleanup(requestId);
    });

    // Set up cleanup on response close (for aborted requests)
    res.on('close', () => {
      this.performRequestCleanup(requestId);
    });

    // Emergency cleanup timeout (prevent zombie requests)
    const emergencyTimeout = setTimeout(() => {
      console.warn(`⚠️ Emergency cleanup for request ${requestId} (timeout)`);
      this.performRequestCleanup(requestId);
    }, 300000); // 5 minutes timeout

    cleanupContext.emergencyTimeout = emergencyTimeout;

    return requestId;
  }

  /**
   * Perform comprehensive cleanup for a specific request
   */
  performRequestCleanup(requestId) {
    const cleanupStart = Date.now();
    const context = this.pendingCleanups.get(requestId);
    
    if (!context) {
      return; // Already cleaned up
    }

    try {
      // Clear emergency timeout
      if (context.emergencyTimeout) {
        clearTimeout(context.emergencyTimeout);
      }

      // Clean up temporary data
      if (context.tempData.size > 0) {
        for (const [key, data] of context.tempData) {
          try {
            // If data has cleanup method, call it
            if (data && typeof data.cleanup === 'function') {
              data.cleanup();
            }
            // Clear array references
            if (Array.isArray(data)) {
              data.length = 0;
            }
            // Clear object references
            if (data && typeof data === 'object') {
              Object.keys(data).forEach(k => delete data[k]);
            }
          } catch (error) {
            console.warn(`⚠️ Error cleaning temp data ${key}:`, error.message);
          }
        }
        context.tempData.clear();
      }

      // Clean up event listeners
      if (context.eventListeners.size > 0) {
        for (const { emitter, event, listener } of context.eventListeners) {
          try {
            if (emitter && typeof emitter.removeListener === 'function') {
              emitter.removeListener(event, listener);
            }
          } catch (error) {
            console.warn(`⚠️ Error removing event listener:`, error.message);
          }
        }
        context.eventListeners.clear();
      }

      // Clear timers
      if (context.timers.size > 0) {
        for (const timerId of context.timers) {
          try {
            clearTimeout(timerId);
            clearInterval(timerId);
          } catch (error) {
            console.warn(`⚠️ Error clearing timer:`, error.message);
          }
        }
        context.timers.clear();
      }

      // Clean up streams
      if (context.streams.size > 0) {
        for (const stream of context.streams) {
          try {
            if (stream && typeof stream.destroy === 'function') {
              stream.destroy();
            } else if (stream && typeof stream.end === 'function') {
              stream.end();
            }
          } catch (error) {
            console.warn(`⚠️ Error cleaning stream:`, error.message);
          }
        }
        context.streams.clear();
      }

      // Clean up database connections
      if (context.dbConnections.size > 0) {
        for (const connection of context.dbConnections) {
          try {
            if (connection && typeof connection.end === 'function') {
              connection.end();
            } else if (connection && typeof connection.close === 'function') {
              connection.close();
            }
          } catch (error) {
            console.warn(`⚠️ Error closing connection:`, error.message);
          }
        }
        context.dbConnections.clear();
      }

      // Call registered cleanup callbacks
      for (const callback of this.cleanupCallbacks) {
        try {
          callback(requestId, context);
        } catch (error) {
          console.warn(`⚠️ Error in cleanup callback:`, error.message);
        }
      }

      // Remove from pending cleanups
      this.pendingCleanups.delete(requestId);
      this.stats.cleanedRequests++;

      // Calculate cleanup time
      const cleanupTime = Date.now() - cleanupStart;
      this.stats.avgCleanupTime = (this.stats.avgCleanupTime + cleanupTime) / 2;

      // Log long cleanups
      if (cleanupTime > 100) {
        console.warn(`⚠️ Slow request cleanup: ${requestId} took ${cleanupTime}ms`);
      }

      // Calculate memory delta
      const memoryDelta = (process.memoryUsage().heapUsed - context.startMemory) / 1024 / 1024;
      const duration = Date.now() - context.startTime;

      // Log memory-heavy requests
      if (memoryDelta > 100 || duration > 10000) {
        console.warn(`📊 Memory-heavy request cleaned up:`, {
          requestId: requestId.substring(0, 50) + '...',
          memoryDelta: `${memoryDelta.toFixed(2)}MB`,
          duration: `${duration}ms`,
          cleanupTime: `${cleanupTime}ms`
        });
      }

      // Schedule garbage collection if needed
      this.scheduleGarbageCollection();

    } catch (error) {
      console.error(`❌ Error during request cleanup for ${requestId}:`, error);
    }
  }

  /**
   * Schedule garbage collection to run periodically
   */
  scheduleGarbageCollection() {
    if (this.gcScheduled || !global.gc) {
      return;
    }

    this.gcScheduled = true;
    
    // Use different strategies based on memory pressure
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    let gcDelay = 1000; // Default 1 second
    
    if (heapUsedMB > 1400) {
      gcDelay = 100; // Immediate for high memory
    } else if (heapUsedMB > 1000) {
      gcDelay = 500; // Quick for moderate memory
    }

    setTimeout(() => {
      try {
        const beforeGC = process.memoryUsage().heapUsed;
        global.gc();
        const afterGC = process.memoryUsage().heapUsed;
        const freedMB = (beforeGC - afterGC) / 1024 / 1024;
        
        this.stats.forcedGCCount++;
        
        if (freedMB > 10) {
          console.log(`🗑️ GC freed ${freedMB.toFixed(2)}MB of memory`);
        }
        
      } catch (error) {
        console.warn('⚠️ Garbage collection error:', error.message);
      } finally {
        this.gcScheduled = false;
      }
    }, gcDelay);
  }

  /**
   * Register a cleanup callback
   */
  registerCleanupCallback(callback) {
    if (typeof callback === 'function') {
      this.cleanupCallbacks.add(callback);
    }
  }

  /**
   * Unregister a cleanup callback
   */
  unregisterCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Force cleanup of all pending requests (emergency use)
   */
  forceCleanupAll() {
    console.warn('🚨 Force cleaning up all pending requests');
    
    const requestIds = Array.from(this.pendingCleanups.keys());
    let cleanedCount = 0;
    
    for (const requestId of requestIds) {
      try {
        this.performRequestCleanup(requestId);
        cleanedCount++;
      } catch (error) {
        console.error(`❌ Error force cleaning ${requestId}:`, error);
      }
    }
    
    console.log(`✅ Force cleaned ${cleanedCount} pending requests`);
    
    // Force garbage collection after emergency cleanup
    if (global.gc) {
      global.gc();
      this.stats.forcedGCCount++;
    }
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    const memUsage = process.memoryUsage();
    
    return {
      requests: {
        total: this.stats.totalRequests,
        cleaned: this.stats.cleanedRequests,
        pending: this.pendingCleanups.size
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
      },
      performance: {
        avgCleanupTime: Math.round(this.stats.avgCleanupTime) + 'ms',
        forcedGCCount: this.stats.forcedGCCount,
        gcScheduled: this.gcScheduled
      },
      cleanupCallbacks: this.cleanupCallbacks.size
    };
  }

  /**
   * Shutdown cleanup manager
   */
  shutdown() {
    console.log('🧹 Shutting down Request Memory Cleanup Manager...');
    
    // Clean up all pending requests
    this.forceCleanupAll();
    
    // Clear callbacks
    this.cleanupCallbacks.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    console.log('✅ Request Memory Cleanup Manager shutdown complete');
  }
}

// Singleton instance
const requestMemoryCleanup = new RequestMemoryCleanup();

/**
 * Express middleware for request-level memory cleanup
 */
export const requestMemoryCleanupMiddleware = (req, res, next) => {
  // Register request for cleanup tracking
  const requestId = requestMemoryCleanup.registerRequest(req, res);
  
  // Add request ID to logs for tracking
  req.memoryRequestId = requestId;
  
  // Continue to next middleware
  next();
};

/**
 * Memory cleanup status endpoint
 */
export const memoryCleanupStatusEndpoint = (req, res) => {
  const stats = requestMemoryCleanup.getStats();
  
  res.json({
    success: true,
    cleanup: stats,
    timestamp: new Date().toISOString()
  });
};

/**
 * Force cleanup endpoint (emergency use)
 */
export const forceCleanupEndpoint = (req, res) => {
  try {
    requestMemoryCleanup.forceCleanupAll();
    
    res.json({
      success: true,
      message: 'Force cleanup completed',
      stats: requestMemoryCleanup.getStats()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export default requestMemoryCleanup;