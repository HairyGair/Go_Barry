// backend/middleware/supervisorLoggingPerformance.js
// Performance monitoring and memory optimization for supervisor logging

/**
 * Supervisor Logging Performance Monitor
 * 
 * Optimizes performance for the 2GB RAM constraint on Render.com:
 * - Memory usage tracking and optimization
 * - Automatic cleanup and garbage collection
 * - Performance metrics collection
 * - Resource usage alerts
 * - Adaptive batching based on load
 * - Memory leak detection
 */

class SupervisorLoggingPerformanceMonitor {
  constructor() {
    this.monitoring = false;
    this.metrics = {
      memoryUsage: [],
      performanceTimings: [],
      batchStats: [],
      errorCounts: {}
    };
    
    // Performance thresholds (optimized for 2GB total RAM)
    this.thresholds = {
      maxMemoryMB: parseInt(process.env.LOGGING_MAX_MEMORY_MB) || 100,
      warningMemoryMB: parseInt(process.env.LOGGING_WARNING_MEMORY_MB) || 80,
      maxBatchSize: parseInt(process.env.LOGGING_MAX_BATCH_SIZE) || 25,
      minBatchSize: parseInt(process.env.LOGGING_MIN_BATCH_SIZE) || 5,
      gcTriggerMemoryMB: parseInt(process.env.LOGGING_GC_TRIGGER_MB) || 90
    };

    // Adaptive configuration
    this.adaptiveConfig = {
      currentBatchSize: parseInt(process.env.LOGGING_BATCH_SIZE) || 10,
      currentBatchTimeout: parseInt(process.env.LOGGING_BATCH_TIMEOUT) || 5000,
      lastOptimization: Date.now(),
      optimizationInterval: 5 * 60 * 1000 // 5 minutes
    };

    // Memory management
    this.memoryManagement = {
      lastGCTrigger: null,
      gcCount: 0,
      memoryLeakDetection: {
        baselineMemory: null,
        checkInterval: 60000, // 1 minute
        leakThresholdMB: 50 // 50MB growth without GC
      }
    };

    this.monitoringInterval = null;
    this.optimizationInterval = null;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.monitoring) {
      console.log('📊 Performance monitoring already active');
      return;
    }

    console.log('🚀 Starting supervisor logging performance monitoring...');
    this.monitoring = true;

    // Establish memory baseline
    this.memoryManagement.memoryLeakDetection.baselineMemory = this.getCurrentMemoryUsage();

    // Start monitoring intervals
    this.startMemoryMonitoring();
    this.startPerformanceOptimization();
    this.startMemoryLeakDetection();

    console.log(`✅ Performance monitoring active (thresholds: ${this.thresholds.maxMemoryMB}MB max, ${this.thresholds.warningMemoryMB}MB warning)`);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.monitoring) return;

    console.log('🛑 Stopping performance monitoring...');
    this.monitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    console.log('✅ Performance monitoring stopped');
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectMemoryMetrics();
      this.checkMemoryThresholds();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start performance optimization
   */
  startPerformanceOptimization() {
    this.optimizationInterval = setInterval(() => {
      this.optimizePerformance();
    }, this.adaptiveConfig.optimizationInterval);
  }

  /**
   * Start memory leak detection
   */
  startMemoryLeakDetection() {
    setInterval(() => {
      this.detectMemoryLeaks();
    }, this.memoryManagement.memoryLeakDetection.checkInterval);
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      timestamp: Date.now()
    };
  }

  /**
   * Collect memory metrics
   */
  collectMemoryMetrics() {
    const memoryUsage = this.getCurrentMemoryUsage();
    
    // Keep only recent metrics (last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      metric => metric.timestamp > oneHourAgo
    );
    
    this.metrics.memoryUsage.push(memoryUsage);
  }

  /**
   * Check memory thresholds and take action
   */
  checkMemoryThresholds() {
    const currentMemory = this.getCurrentMemoryUsage();
    
    if (currentMemory.heapUsed > this.thresholds.maxMemoryMB) {
      console.error(`🚨 CRITICAL: Memory usage (${currentMemory.heapUsed}MB) exceeds maximum (${this.thresholds.maxMemoryMB}MB)`);
      this.triggerEmergencyCleanup();
    } else if (currentMemory.heapUsed > this.thresholds.warningMemoryMB) {
      console.warn(`⚠️ WARNING: Memory usage (${currentMemory.heapUsed}MB) exceeds warning threshold (${this.thresholds.warningMemoryMB}MB)`);
      this.triggerPreventiveCleanup();
    } else if (currentMemory.heapUsed > this.thresholds.gcTriggerMemoryMB) {
      this.triggerGarbageCollection('memory_threshold');
    }
  }

  /**
   * Trigger emergency cleanup
   */
  async triggerEmergencyCleanup() {
    console.log('🚨 Executing emergency memory cleanup...');

    try {
      // Clear old metrics
      this.clearOldMetrics();
      
      // Trigger garbage collection
      this.triggerGarbageCollection('emergency');
      
      // Reduce batch sizes temporarily
      this.adaptiveConfig.currentBatchSize = Math.max(
        this.thresholds.minBatchSize,
        Math.floor(this.adaptiveConfig.currentBatchSize * 0.5)
      );
      
      console.log(`📉 Reduced batch size to ${this.adaptiveConfig.currentBatchSize} for memory conservation`);

      // Notify enhanced service if available
      try {
        const enhancedSupervisorActivityService = (await import('../services/enhancedSupervisorActivityService.js')).default;
        if (enhancedSupervisorActivityService.batchSize !== this.adaptiveConfig.currentBatchSize) {
          enhancedSupervisorActivityService.batchSize = this.adaptiveConfig.currentBatchSize;
          console.log('📨 Updated enhanced service batch size');
        }
      } catch (serviceError) {
        console.warn('⚠️ Could not update enhanced service batch size:', serviceError.message);
      }

    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error.message);
    }
  }

  /**
   * Trigger preventive cleanup
   */
  triggerPreventiveCleanup() {
    console.log('🧹 Executing preventive memory cleanup...');
    
    // Clear old metrics
    this.clearOldMetrics();
    
    // Trigger garbage collection if available
    this.triggerGarbageCollection('preventive');
  }

  /**
   * Trigger garbage collection
   */
  triggerGarbageCollection(reason) {
    if (!global.gc) {
      // GC not available
      return false;
    }

    const beforeGC = this.getCurrentMemoryUsage();
    
    try {
      global.gc();
      this.memoryManagement.gcCount++;
      this.memoryManagement.lastGCTrigger = Date.now();
      
      const afterGC = this.getCurrentMemoryUsage();
      const freed = beforeGC.heapUsed - afterGC.heapUsed;
      
      console.log(`🗑️ Garbage collection (${reason}): freed ${freed}MB (${beforeGC.heapUsed}MB → ${afterGC.heapUsed}MB)`);
      
      return true;
    } catch (gcError) {
      console.warn('⚠️ Garbage collection failed:', gcError.message);
      return false;
    }
  }

  /**
   * Clear old metrics to free memory
   */
  clearOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clear old memory usage data
    const oldMemoryCount = this.metrics.memoryUsage.length;
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      metric => metric.timestamp > oneHourAgo
    );
    
    // Clear old performance timings
    const oldTimingCount = this.metrics.performanceTimings.length;
    this.metrics.performanceTimings = this.metrics.performanceTimings.filter(
      timing => timing.timestamp > oneHourAgo
    );
    
    // Clear old batch stats
    const oldBatchCount = this.metrics.batchStats.length;
    this.metrics.batchStats = this.metrics.batchStats.filter(
      stat => stat.timestamp > oneHourAgo
    );

    const freedMetrics = (oldMemoryCount - this.metrics.memoryUsage.length) +
                        (oldTimingCount - this.metrics.performanceTimings.length) +
                        (oldBatchCount - this.metrics.batchStats.length);

    if (freedMetrics > 0) {
      console.log(`🧹 Cleared ${freedMetrics} old metrics entries`);
    }
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks() {
    const current = this.getCurrentMemoryUsage();
    const baseline = this.memoryManagement.memoryLeakDetection.baselineMemory;
    
    if (!baseline) {
      this.memoryManagement.memoryLeakDetection.baselineMemory = current;
      return;
    }

    const growth = current.heapUsed - baseline.heapUsed;
    const threshold = this.memoryManagement.memoryLeakDetection.leakThresholdMB;

    if (growth > threshold) {
      console.warn(`🔍 Potential memory leak detected: ${growth}MB growth from baseline`);
      
      // Trigger garbage collection and re-evaluate
      if (this.triggerGarbageCollection('leak_detection')) {
        // Update baseline after GC
        setTimeout(() => {
          this.memoryManagement.memoryLeakDetection.baselineMemory = this.getCurrentMemoryUsage();
          console.log('📊 Updated memory baseline after garbage collection');
        }, 1000);
      }
    }
  }

  /**
   * Optimize performance based on current metrics
   */
  async optimizePerformance() {
    if (!this.monitoring) return;

    console.log('⚙️ Running performance optimization...');

    try {
      const currentMemory = this.getCurrentMemoryUsage();
      const memoryPressure = currentMemory.heapUsed / this.thresholds.maxMemoryMB;

      // Adaptive batch size optimization
      if (memoryPressure > 0.8) {
        // High memory pressure - reduce batch size
        this.adaptiveConfig.currentBatchSize = Math.max(
          this.thresholds.minBatchSize,
          this.adaptiveConfig.currentBatchSize - 2
        );
      } else if (memoryPressure < 0.4 && this.adaptiveConfig.currentBatchSize < this.thresholds.maxBatchSize) {
        // Low memory pressure - can increase batch size
        this.adaptiveConfig.currentBatchSize = Math.min(
          this.thresholds.maxBatchSize,
          this.adaptiveConfig.currentBatchSize + 1
        );
      }

      // Update enhanced service configuration
      try {
        const enhancedSupervisorActivityService = (await import('../services/enhancedSupervisorActivityService.js')).default;
        if (enhancedSupervisorActivityService.batchSize !== this.adaptiveConfig.currentBatchSize) {
          enhancedSupervisorActivityService.batchSize = this.adaptiveConfig.currentBatchSize;
          console.log(`📈 Optimized batch size to ${this.adaptiveConfig.currentBatchSize} (memory pressure: ${Math.round(memoryPressure * 100)}%)`);
        }
      } catch (serviceError) {
        console.warn('⚠️ Could not update enhanced service configuration:', serviceError.message);
      }

      this.adaptiveConfig.lastOptimization = Date.now();

    } catch (error) {
      console.error('❌ Performance optimization failed:', error.message);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const currentMemory = this.getCurrentMemoryUsage();
    
    return {
      current: {
        memory: currentMemory,
        batchSize: this.adaptiveConfig.currentBatchSize,
        monitoring: this.monitoring
      },
      
      thresholds: this.thresholds,
      
      memoryManagement: {
        gcCount: this.memoryManagement.gcCount,
        lastGCTrigger: this.memoryManagement.lastGCTrigger,
        baselineMemory: this.memoryManagement.memoryLeakDetection.baselineMemory
      },
      
      historical: {
        memoryUsage: this.metrics.memoryUsage.slice(-20), // Last 20 measurements
        performanceTimings: this.metrics.performanceTimings.slice(-10),
        batchStats: this.metrics.batchStats.slice(-10)
      },
      
      performance: {
        memoryEfficiency: Math.round((currentMemory.heapUsed / currentMemory.heapTotal) * 100),
        memoryPressure: Math.round((currentMemory.heapUsed / this.thresholds.maxMemoryMB) * 100),
        adaptiveConfig: this.adaptiveConfig
      }
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const memoryPressure = metrics.performance.memoryPressure;
    
    let status = 'healthy';
    let issues = [];

    if (memoryPressure > 90) {
      status = 'critical';
      issues.push('Critical memory pressure');
    } else if (memoryPressure > 80) {
      status = 'warning';
      issues.push('High memory pressure');
    }

    if (!this.monitoring) {
      status = status === 'healthy' ? 'warning' : status;
      issues.push('Performance monitoring not active');
    }

    return {
      status,
      issues,
      memoryPressure,
      monitoring: this.monitoring,
      lastOptimization: this.adaptiveConfig.lastOptimization
    };
  }

  /**
   * Express middleware for performance monitoring
   */
  middleware() {
    return (req, res, next) => {
      // Add performance metrics to request (for debugging)
      if (process.env.NODE_ENV !== 'production') {
        req.supervisorLoggingPerformance = this.getMetrics();
      }

      next();
    };
  }
}

// Create singleton instance
const supervisorLoggingPerformanceMonitor = new SupervisorLoggingPerformanceMonitor();

export default supervisorLoggingPerformanceMonitor;
export { SupervisorLoggingPerformanceMonitor };