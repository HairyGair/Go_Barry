// backend/services/memoryMonitor.js
// Memory monitoring and optimization service for Render.com 2GB limit

class MemoryMonitor {
  constructor() {
    this.memoryLimit = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    this.warningThreshold = 0.7; // 70% of limit (more aggressive)
    this.criticalThreshold = 0.85; // 85% of limit (more headroom)
    this.monitoringInterval = null;
    this.cleanupCallbacks = new Set();
    this.lastMemoryCheck = 0;
    this.emergencyGCThreshold = 0.8; // Force GC at 80%
  }

  start() {
    // Monitor memory every 15 seconds for better response time
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 15000);

    // Also check immediately
    this.checkMemoryUsage();
    
    console.log('📊 Memory Monitor started (2GB limit, checking every 15s)');
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('📊 Memory Monitor stopped');
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMemoryMB = Math.round(memUsage.rss / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    
    const usagePercentage = memUsage.rss / this.memoryLimit;
    
    // Store for later reference
    this.lastMemoryCheck = {
      heapUsedMB,
      heapTotalMB,
      rssMemoryMB,
      externalMB,
      usagePercentage: Math.round(usagePercentage * 100),
      timestamp: new Date().toISOString()
    };

    // Log current status
    console.log(`📊 Memory: ${rssMemoryMB}MB RSS (${Math.round(usagePercentage * 100)}%), ${heapUsedMB}MB heap`);

    // Take action based on usage level
    if (usagePercentage >= this.criticalThreshold) {
      console.warn(`🚨 CRITICAL: Memory usage at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
      this.performEmergencyCleanup();
    } else if (usagePercentage >= this.emergencyGCThreshold) {
      console.warn(`⚠️ HIGH MEMORY: Forcing GC at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
      if (global.gc) {
        global.gc();
        console.log('🗑️ Emergency garbage collection completed');
      }
    } else if (usagePercentage >= this.warningThreshold) {
      console.warn(`⚠️ WARNING: Memory usage at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
      this.performPreventiveCleanup();
    }
  }

  performPreventiveCleanup() {
    console.log('🧹 Performing preventive memory cleanup...');
    
    // Run registered cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback('preventive');
      } catch (error) {
        console.error('❌ Cleanup callback failed:', error);
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
  }

  performEmergencyCleanup() {
    console.log('🚨 Performing EMERGENCY memory cleanup...');
    
    // Run registered cleanup callbacks with emergency flag
    for (const callback of this.cleanupCallbacks) {
      try {
        callback('emergency');
      } catch (error) {
        console.error('❌ Emergency cleanup callback failed:', error);
      }
    }

    // Force multiple garbage collection cycles
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
      console.log('🗑️ Forced multiple garbage collection cycles');
    }

    // Check memory again after cleanup
    setTimeout(() => {
      const memUsage = process.memoryUsage();
      const newUsagePercentage = memUsage.rss / this.memoryLimit;
      console.log(`📊 Post-cleanup memory: ${Math.round(memUsage.rss / 1024 / 1024)}MB (${Math.round(newUsagePercentage * 100)}%)`);
    }, 1000);
  }

  // Register cleanup callback
  registerCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  // Unregister cleanup callback
  unregisterCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  // Get current memory status
  getMemoryStatus() {
    return this.lastMemoryCheck || this.checkMemoryUsage();
  }

  // Check if memory usage is healthy
  isMemoryHealthy() {
    const memUsage = process.memoryUsage();
    const usagePercentage = memUsage.rss / this.memoryLimit;
    return usagePercentage < this.warningThreshold;
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

export default memoryMonitor;