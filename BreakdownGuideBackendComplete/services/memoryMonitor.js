// backend/services/memoryMonitor.js
// Memory monitoring and optimization service for Render.com 2GB limit

class MemoryMonitor {
  constructor() {
    this.memoryLimit = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    this.warningThreshold = 0.6; // 60% of limit (more aggressive for Render)
    this.criticalThreshold = 0.75; // 75% of limit (more headroom)
    this.emergencyThreshold = 0.9; // 90% emergency shutdown
    this.monitoringInterval = null;
    this.cleanupCallbacks = new Set();
    this.lastMemoryCheck = 0;
    this.emergencyGCThreshold = 0.65; // Force GC at 65%
    this.memoryHistory = [];
    this.maxHistorySize = 100;
    this.leakDetectionEnabled = true;
    this.lastGCTime = Date.now();
    this.gcFrequencyLimit = 10000; // Min 10s between forced GC
    this.alertCooldown = new Map(); // Prevent alert spam
  }

  startMonitoring() {
    // More aggressive monitoring for Render.com
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Check every 10 seconds

    // Immediate check
    this.checkMemoryUsage();
    
    // Memory leak detection every 2 minutes
    this.leakDetectionInterval = setInterval(() => {
      if (this.leakDetectionEnabled) {
        this.detectMemoryLeaks();
      }
    }, 120000);
    
    console.log('📊 Enhanced Memory Monitor started (2GB limit, 10s intervals, leak detection)');
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval);
      this.leakDetectionInterval = null;
    }
    
    // Clear all data
    this.memoryHistory = [];
    this.alertCooldown.clear();
    
    console.log('📊 Enhanced Memory Monitor stopped and cleaned up');
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMemoryMB = Math.round(memUsage.rss / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    
    const usagePercentage = memUsage.rss / this.memoryLimit;
    const currentTime = Date.now();
    
    // Store memory check data
    this.lastMemoryCheck = {
      heapUsedMB,
      heapTotalMB,
      rssMemoryMB,
      externalMB,
      usagePercentage: Math.round(usagePercentage * 100),
      timestamp: new Date().toISOString(),
      pid: process.pid
    };
    
    // Store in history for leak detection
    this.memoryHistory.push({
      rss: rssMemoryMB,
      heap: heapUsedMB,
      timestamp: currentTime
    });
    
    // Trim history to prevent memory leak in monitor itself
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }

    // Enhanced logging with more context
    const memoryTrend = this.getMemoryTrend();
    console.log(`📊 Memory: ${rssMemoryMB}MB RSS (${Math.round(usagePercentage * 100)}%), ${heapUsedMB}MB heap, ${memoryTrend}`);

    // EMERGENCY SHUTDOWN to prevent Render restart
    if (usagePercentage >= this.emergencyThreshold) {
      console.error(`🔥 EMERGENCY: Memory at ${Math.round(usagePercentage * 100)}% - triggering emergency cleanup`);
      this.performEmergencyShutdown();
      return;
    }
    
    // Take action based on usage level with cooldowns to prevent spam
    if (usagePercentage >= this.criticalThreshold) {
      if (!this.isInCooldown('critical')) {
        console.warn(`🚨 CRITICAL: Memory usage at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
        this.performEmergencyCleanup();
        this.setCooldown('critical', 30000); // 30s cooldown
      }
    } else if (usagePercentage >= this.emergencyGCThreshold) {
      if (!this.isInCooldown('emergency_gc') && (currentTime - this.lastGCTime) > this.gcFrequencyLimit) {
        console.warn(`⚠️ HIGH MEMORY: Forcing GC at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
        this.performEmergencyGC();
        this.setCooldown('emergency_gc', 15000); // 15s cooldown
      }
    } else if (usagePercentage >= this.warningThreshold) {
      if (!this.isInCooldown('warning')) {
        console.warn(`⚠️ WARNING: Memory usage at ${Math.round(usagePercentage * 100)}% (${rssMemoryMB}MB/2048MB)`);
        this.performPreventiveCleanup();
        this.setCooldown('warning', 60000); // 60s cooldown
      }
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

  // Enhanced memory leak detection
  detectMemoryLeaks() {
    if (this.memoryHistory.length < 10) return;
    
    const recentMemory = this.memoryHistory.slice(-10);
    const oldMemory = this.memoryHistory.slice(-20, -10);
    
    if (oldMemory.length === 0) return;
    
    const recentAvg = recentMemory.reduce((sum, m) => sum + m.rss, 0) / recentMemory.length;
    const oldAvg = oldMemory.reduce((sum, m) => sum + m.rss, 0) / oldMemory.length;
    
    const growthRate = (recentAvg - oldAvg) / oldAvg;
    
    if (growthRate > 0.1) { // 10% growth indicates potential leak
      console.warn(`🔍 MEMORY LEAK DETECTED: ${Math.round(growthRate * 100)}% growth over last 20 checks`);
      console.warn(`   Old average: ${Math.round(oldAvg)}MB, Recent average: ${Math.round(recentAvg)}MB`);
      
      // Trigger aggressive cleanup
      this.performEmergencyCleanup();
    }
  }
  
  // Cooldown management
  isInCooldown(type) {
    const cooldownEnd = this.alertCooldown.get(type);
    return cooldownEnd && Date.now() < cooldownEnd;
  }
  
  setCooldown(type, duration) {
    this.alertCooldown.set(type, Date.now() + duration);
  }
  
  // Memory trend analysis
  getMemoryTrend() {
    if (this.memoryHistory.length < 5) return 'stabilizing';
    
    const recent = this.memoryHistory.slice(-5);
    const trend = recent[recent.length - 1].rss - recent[0].rss;
    
    if (trend > 50) return '📈 increasing';
    if (trend < -50) return '📉 decreasing';
    return '➡️ stable';
  }
  
  // Enhanced emergency GC
  performEmergencyGC() {
    if (global.gc && (Date.now() - this.lastGCTime) > this.gcFrequencyLimit) {
      const beforeMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      
      // Multiple GC cycles for maximum effect
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
      
      const afterMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const saved = beforeMem - afterMem;
      
      console.log(`🗑️ Emergency GC completed: ${beforeMem}MB -> ${afterMem}MB (saved ${saved}MB)`);
      this.lastGCTime = Date.now();
    }
  }
  
  // Emergency shutdown to prevent Render restart
  performEmergencyShutdown() {
    console.error('🔥 EMERGENCY SHUTDOWN: Memory usage critical, preventing restart...');
    
    // Run all cleanup callbacks immediately
    for (const callback of this.cleanupCallbacks) {
      try {
        callback('emergency_shutdown');
      } catch (error) {
        console.error('❌ Emergency shutdown callback failed:', error);
      }
    }
    
    // Force multiple GC cycles
    if (global.gc) {
      for (let i = 0; i < 5; i++) {
        global.gc();
      }
    }
    
    // Clear all monitoring data
    this.memoryHistory = [];
    this.alertCooldown.clear();
    
    console.log('✅ Emergency shutdown cleanup completed');
  }
  
  // Register cleanup callback
  registerCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  // Unregister cleanup callback
  unregisterCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  // Get current memory status with enhanced info
  getMemoryStatus() {
    return {
      ...this.lastMemoryCheck,
      trend: this.getMemoryTrend(),
      historySize: this.memoryHistory.length,
      isHealthy: this.isMemoryHealthy(),
      lastGC: new Date(this.lastGCTime).toISOString()
    };
  }

  // Check if memory usage is healthy
  isMemoryHealthy() {
    const memUsage = process.memoryUsage();
    const usagePercentage = memUsage.rss / this.memoryLimit;
    return usagePercentage < this.warningThreshold;
  }
  
  // Get detailed memory statistics
  getDetailedStats() {
    const memUsage = process.memoryUsage();
    return {
      current: this.lastMemoryCheck,
      limits: {
        total: Math.round(this.memoryLimit / 1024 / 1024),
        warning: Math.round(this.warningThreshold * 100),
        critical: Math.round(this.criticalThreshold * 100),
        emergency: Math.round(this.emergencyThreshold * 100)
      },
      history: {
        size: this.memoryHistory.length,
        trend: this.getMemoryTrend(),
        recentAverage: this.memoryHistory.length > 0 
          ? Math.round(this.memoryHistory.slice(-5).reduce((sum, m) => sum + m.rss, 0) / Math.min(5, this.memoryHistory.length))
          : 0
      },
      gc: {
        lastGC: new Date(this.lastGCTime).toISOString(),
        timeSinceLastGC: Math.round((Date.now() - this.lastGCTime) / 1000)
      },
      cleanupCallbacks: this.cleanupCallbacks.size
    };
  }
}

// Create singleton instance
const memoryMonitor = new MemoryMonitor();

export default memoryMonitor;