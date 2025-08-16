// backend/middleware/memoryGuard.js
// Memory monitoring and request throttling for 2GB RAM constraint

import { EventEmitter } from 'events';

/**
 * Memory Guard System - Prevents memory exhaustion on Render.com 2GB limit
 */
class MemoryGuard extends EventEmitter {
  constructor() {
    super();
    
    // Memory thresholds (in MB)
    this.CRITICAL_THRESHOLD = 1800;  // 1.8GB - Emergency shutdown
    this.HIGH_THRESHOLD = 1600;      // 1.6GB - Aggressive throttling
    this.MODERATE_THRESHOLD = 1400;  // 1.4GB - Start throttling
    this.WARNING_THRESHOLD = 1200;   // 1.2GB - Monitor closely
    
    // Request throttling state
    this.isThrottling = false;
    this.throttleLevel = 0; // 0-3 (none, light, moderate, aggressive)
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.maxConcurrentRequests = 10;
    this.memoryHistory = [];
    this.maxHistorySize = 60; // 1 minute of history at 1s intervals
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      deniedRequests: 0,
      memoryCleanups: 0,
      emergencyShutdowns: 0
    };
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Start continuous memory monitoring
   */
  startMemoryMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 1000); // Check every second

    console.log('🛡️ MemoryGuard: Started continuous monitoring');
  }

  /**
   * Check current memory usage and adjust throttling
   */
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Add to history
    this.memoryHistory.push({
      timestamp: Date.now(),
      heapUsed: heapUsedMB,
      rss: rssMB,
      external: Math.round(memUsage.external / 1024 / 1024)
    });
    
    // Maintain history size
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Determine throttling level based on RSS (resident set size)
    const currentMemory = rssMB;
    let newThrottleLevel = 0;
    
    if (currentMemory >= this.CRITICAL_THRESHOLD) {
      newThrottleLevel = 4; // Emergency
      this.handleCriticalMemory(currentMemory);
    } else if (currentMemory >= this.HIGH_THRESHOLD) {
      newThrottleLevel = 3; // Aggressive throttling
    } else if (currentMemory >= this.MODERATE_THRESHOLD) {
      newThrottleLevel = 2; // Moderate throttling
    } else if (currentMemory >= this.WARNING_THRESHOLD) {
      newThrottleLevel = 1; // Light throttling
    }

    // Update throttling if changed
    if (newThrottleLevel !== this.throttleLevel) {
      this.updateThrottling(newThrottleLevel, currentMemory);
    }
  }

  /**
   * Handle critical memory situation
   */
  handleCriticalMemory(currentMemory) {
    console.error(`🚨 CRITICAL MEMORY: ${currentMemory}MB / 2048MB`);
    this.stats.emergencyShutdowns++;
    
    // Emergency cleanup
    this.performEmergencyCleanup();
    
    // Emit critical event
    this.emit('critical-memory', { currentMemory });
    
    // Consider process restart if memory doesn't drop
    setTimeout(() => {
      const newMemory = Math.round(process.memoryUsage().rss / 1024 / 1024);
      if (newMemory >= this.CRITICAL_THRESHOLD) {
        console.error('🚨 EMERGENCY: Memory still critical after cleanup, process needs restart');
        this.emit('emergency-restart-needed');
      }
    }, 5000);
  }

  /**
   * Update throttling level
   */
  updateThrottling(newLevel, currentMemory) {
    const oldLevel = this.throttleLevel;
    this.throttleLevel = newLevel;
    this.isThrottling = newLevel > 0;
    
    // Adjust concurrent request limit based on throttle level
    switch (newLevel) {
      case 0: // Normal
        this.maxConcurrentRequests = 10;
        break;
      case 1: // Light throttling
        this.maxConcurrentRequests = 8;
        break;
      case 2: // Moderate throttling
        this.maxConcurrentRequests = 5;
        break;
      case 3: // Aggressive throttling
        this.maxConcurrentRequests = 2;
        break;
      case 4: // Emergency
        this.maxConcurrentRequests = 1;
        break;
    }

    if (newLevel !== oldLevel) {
      const levels = ['NORMAL', 'LIGHT', 'MODERATE', 'AGGRESSIVE', 'EMERGENCY'];
      console.log(`🛡️ Memory Guard: ${levels[oldLevel]} → ${levels[newLevel]} (${currentMemory}MB)`);
      
      if (newLevel > 1 && oldLevel <= 1) {
        this.performMemoryCleanup();
      }
    }
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    this.stats.memoryCleanups++;
    console.log('🧹 MemoryGuard: Performing memory cleanup...');
    
    // Clear any temporary caches
    if (global.app && global.app.locals) {
      global.app.locals.tempCache = {};
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
    
    // Emit cleanup event for other modules
    this.emit('memory-cleanup', { level: this.throttleLevel });
  }

  /**
   * Emergency cleanup - more aggressive
   */
  performEmergencyCleanup() {
    console.log('🚨 MemoryGuard: EMERGENCY CLEANUP');
    
    // Clear all possible caches and temporary data
    this.performMemoryCleanup();
    
    // Clear active request references
    this.activeRequests.clear();
    this.requestQueue.length = 0;
    
    // Clear memory history except recent entries
    this.memoryHistory = this.memoryHistory.slice(-10);
    
    // Multiple forced GC passes
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => global.gc(), i * 100);
      }
    }
  }

  /**
   * Check if request should be allowed
   */
  shouldAllowRequest(req) {
    this.stats.totalRequests++;
    
    // Always allow health checks
    if (req.path === '/api/health' || req.path === '/api/memory') {
      return { allowed: true };
    }
    
    // Emergency mode - very restrictive
    if (this.throttleLevel >= 4) {
      if (this.activeRequests.size >= 1) {
        this.stats.deniedRequests++;
        return { 
          allowed: false, 
          reason: 'Emergency memory protection - server overloaded',
          retryAfter: 30 
        };
      }
    }
    
    // Normal throttling
    if (this.activeRequests.size >= this.maxConcurrentRequests) {
      this.stats.throttledRequests++;
      return { 
        allowed: false, 
        reason: 'Server temporarily overloaded - too many concurrent requests',
        retryAfter: this.getRetryAfter() 
      };
    }
    
    return { allowed: true };
  }

  /**
   * Calculate retry-after delay based on throttle level
   */
  getRetryAfter() {
    switch (this.throttleLevel) {
      case 1: return 5;   // 5 seconds
      case 2: return 10;  // 10 seconds  
      case 3: return 20;  // 20 seconds
      case 4: return 60;  // 1 minute
      default: return 2;  // 2 seconds
    }
  }

  /**
   * Register active request
   */
  registerRequest(req, res) {
    const requestId = `${req.method}-${req.path}-${Date.now()}`;
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    this.activeRequests.set(requestId, {
      method: req.method,
      path: req.path,
      startTime,
      startMemory
    });
    
    // Auto-cleanup on response finish
    res.on('finish', () => {
      this.unregisterRequest(requestId, startTime, startMemory);
    });
    
    return requestId;
  }

  /**
   * Unregister completed request
   */
  unregisterRequest(requestId, startTime, startMemory) {
    this.activeRequests.delete(requestId);
    
    const duration = Date.now() - startTime;
    const memoryDelta = (process.memoryUsage().heapUsed - startMemory) / 1024 / 1024;
    
    // Log slow or memory-heavy requests
    if (duration > 10000 || memoryDelta > 100) {
      console.warn(`⚠️ Heavy request completed: ${requestId}`, {
        duration: `${duration}ms`,
        memoryDelta: `${memoryDelta.toFixed(2)}MB`
      });
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const currentMemory = process.memoryUsage();
    const recentMemory = this.memoryHistory.slice(-5);
    
    return {
      memory: {
        current: Math.round(currentMemory.rss / 1024 / 1024) + 'MB',
        heap: Math.round(currentMemory.heapUsed / 1024 / 1024) + 'MB',
        limit: '2048MB',
        utilization: Math.round((currentMemory.rss / (2048 * 1024 * 1024)) * 100) + '%'
      },
      throttling: {
        level: this.throttleLevel,
        isActive: this.isThrottling,
        maxConcurrent: this.maxConcurrentRequests,
        activeRequests: this.activeRequests.size
      },
      stats: this.stats,
      recentMemory: recentMemory.map(m => ({
        time: new Date(m.timestamp).toISOString(),
        rss: m.rss + 'MB',
        heap: m.heapUsed + 'MB'
      }))
    };
  }

  /**
   * Shutdown monitoring
   */
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.removeAllListeners();
    console.log('🛡️ MemoryGuard: Shutdown complete');
  }
}

// Singleton instance
const memoryGuard = new MemoryGuard();

/**
 * Express middleware for memory-based request throttling
 */
export const memoryThrottleMiddleware = (req, res, next) => {
  const check = memoryGuard.shouldAllowRequest(req);
  
  if (!check.allowed) {
    return res.status(503).json({
      success: false,
      error: check.reason,
      retryAfter: check.retryAfter,
      memoryStatus: memoryGuard.getStats().memory
    });
  }
  
  // Register request for monitoring
  memoryGuard.registerRequest(req, res);
  
  next();
};

/**
 * Memory status endpoint middleware
 */
export const memoryStatusEndpoint = (req, res) => {
  const stats = memoryGuard.getStats();
  
  res.json({
    success: true,
    ...stats,
    timestamp: new Date().toISOString()
  });
};

export default memoryGuard;