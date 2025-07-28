// backend/memoryOptimizationIntegration.js
// Comprehensive memory optimization integration for Go BARRY backend

import memoryMonitor from './services/memoryMonitor.js';
import memoryOptimizationService from './services/memoryOptimizationService.js';
import dataCache from './services/memoryEfficientDataCache.js';
import memoryOptimizedSupervisorSync from './services/memoryOptimizedSupervisorSync.js';
import bundleOptimizer from './utils/bundleOptimizer.js';

class MemoryOptimizationIntegration {
  constructor() {
    this.initialized = false;
    this.optimizationActive = false;
    this.stats = {
      totalOptimizations: 0,
      memorySaved: 0,
      averageMemoryUsage: 0,
      lastOptimization: null
    };
    
    console.log('🎯 Memory Optimization Integration starting...');
  }

  // Initialize all memory optimization components
  async initialize() {
    if (this.initialized) {
      console.log('⚠️ Memory optimization already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing comprehensive memory optimization...');
      
      // 1. Start enhanced memory monitoring
      console.log('📊 Starting enhanced memory monitor...');
      memoryMonitor.startMonitoring();
      
      // 2. Initialize memory optimization service
      console.log('🎯 Initializing memory optimization service...');
      // Already integrated via constructor
      
      // 3. Initialize data cache with cleanup callbacks
      console.log('🗄️ Setting up memory-efficient data cache...');
      this.setupDataCacheIntegration();
      
      // 4. Initialize optimized supervisor sync
      console.log('🔌 Initializing memory-optimized supervisor sync...');
      // Already initialized via constructor
      
      // 5. Setup bundle optimization tracking
      console.log('📦 Setting up bundle optimization...');
      this.setupBundleOptimization();
      
      // 6. Setup cross-service integration
      console.log('🔗 Setting up cross-service integration...');
      this.setupCrossServiceIntegration();
      
      // 7. Setup emergency protocols
      console.log('🚨 Setting up emergency memory protocols...');
      this.setupEmergencyProtocols();
      
      this.initialized = true;
      
      const memoryStatus = memoryMonitor.getMemoryStatus();
      console.log('✅ Memory optimization integration complete');
      console.log(`📊 Current memory usage: ${memoryStatus.usagePercentage}% (${memoryStatus.rssMemoryMB}MB)`);
      console.log('🎯 All memory optimization services are active');
      
    } catch (error) {
      console.error('❌ Memory optimization initialization failed:', error);
      throw error;
    }
  }

  // Setup data cache integration with memory monitoring  
  setupDataCacheIntegration() {
    // Register data cache cleanup with memory monitor
    memoryMonitor.registerCleanupCallback((type) => {
      if (type === 'preventive') {
        // Trigger cache memory pressure cleanup
        dataCache.memoryPressureCleanup();
      } else if (type === 'emergency' || type === 'emergency_shutdown') {
        // Clear all caches in emergency
        const stats = dataCache.getStats();
        console.log(`🚨 Emergency: Clearing all data caches (${stats.totalItems} items)`);
        
        for (const [name] of dataCache.caches.entries()) {
          dataCache.clear(name);
        }
      }
    });
    
    console.log('✅ Data cache integrated with memory monitoring');
  }

  // Setup bundle optimization tracking
  setupBundleOptimization() {
    // Track module loads for optimization analysis
    const originalRequire = global.require;
    if (originalRequire) {
      global.require = function(id) {
        const start = Date.now();
        const result = originalRequire.apply(this, arguments);
        const loadTime = Date.now() - start;
        
        bundleOptimizer.trackModuleLoad(id, loadTime);
        return result;
      };
    }
    
    // Periodic bundle analysis
    setInterval(() => {
      const analysis = bundleOptimizer.analyzeImports();
      if (analysis.heavyModules.length > 0) {
        console.log(`📦 Bundle analysis: ${analysis.heavyModules.length} heavy modules detected`);
      }
    }, 300000); // Every 5 minutes
    
    console.log('✅ Bundle optimization tracking active');
  }

  // Setup cross-service integration
  setupCrossServiceIntegration() {
    // Integrate supervisor sync with memory monitoring
    memoryMonitor.registerCleanupCallback((type) => {
      memoryOptimizedSupervisorSync.handleMemoryPressure(type);
    });
    
    // Setup shared memory pressure detection
    const checkMemoryPressure = () => {
      const memoryStatus = memoryMonitor.getMemoryStatus();
      const usagePercentage = memoryStatus.usagePercentage / 100;
      
      if (usagePercentage > 0.8) {
        // Trigger cross-service memory pressure response
        this.handleGlobalMemoryPressure('critical');
      } else if (usagePercentage > 0.7) {
        this.handleGlobalMemoryPressure('warning');
      }
    };
    
    // Check every 30 seconds
    setInterval(checkMemoryPressure, 30000);
    
    console.log('✅ Cross-service integration setup complete');
  }

  // Setup emergency protocols
  setupEmergencyProtocols() {
    // Critical memory threshold monitoring
    const criticalThreshold = 0.9; // 90% of 2GB limit
    
    memoryMonitor.registerCleanupCallback((type) => {
      if (type === 'emergency_shutdown') {
        console.log('🚨 EMERGENCY SHUTDOWN PROTOCOL ACTIVATED');
        this.executeEmergencyShutdownProtocol();
      }
    });
    
    // Process memory monitoring
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning' || 
          warning.message.includes('memory')) {
        console.warn('⚠️ Process warning detected:', warning.message);
        this.handleGlobalMemoryPressure('warning');
      }
    });
    
    // Uncaught exception handling
    process.on('uncaughtException', (error) => {
      if (error.message.includes('out of memory') || 
          error.message.includes('heap')) {
        console.error('🚨 Memory-related uncaught exception:', error.message);
        this.executeEmergencyShutdownProtocol();
      }
    });
    
    console.log('✅ Emergency protocols activated');
  }

  // Handle global memory pressure across all services
  handleGlobalMemoryPressure(level) {
    if (this.optimizationActive) {
      console.log('⏭️ Optimization already active, skipping');
      return;
    }
    
    this.optimizationActive = true;
    
    console.log(`🧹 Global memory pressure response: ${level}`);
    
    try {
      // Coordinate cleanup across all services
      switch (level) {
        case 'warning':
          this.executeWarningLevelCleanup();
          break;
        case 'critical':
          this.executeCriticalLevelCleanup();
          break;
        case 'emergency':
          this.executeEmergencyLevelCleanup();
          break;
      }
      
      this.stats.totalOptimizations++;
      this.stats.lastOptimization = new Date().toISOString();
      
    } catch (error) {
      console.error('❌ Global memory pressure handling failed:', error);
    } finally {
      this.optimizationActive = false;
    }
  }

  // Warning level cleanup (70-80% memory usage)
  executeWarningLevelCleanup() {
    console.log('⚠️ Executing warning level cleanup...');
    
    // Light cleanup across services
    dataCache.cleanup();
    memoryOptimizedSupervisorSync.performNormalCleanup();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    console.log('✅ Warning level cleanup complete');
  }

  // Critical level cleanup (80-90% memory usage)
  executeCriticalLevelCleanup() {
    console.log('🚨 Executing critical level cleanup...');
    
    // Aggressive cleanup
    dataCache.memoryPressureCleanup();
    memoryOptimizedSupervisorSync.performAggressiveCleanup();
    
    // Clear import caches if available
    if (global.lazyImportCache) {
      const size = global.lazyImportCache.size;
      global.lazyImportCache.clear();
      console.log(`🗑️ Cleared ${size} lazy import cache entries`);
    }
    
    // Multiple garbage collection cycles
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
    
    console.log('✅ Critical level cleanup complete');
  }

  // Emergency level cleanup (90%+ memory usage)
  executeEmergencyLevelCleanup() {
    console.log('🚨 EXECUTING EMERGENCY LEVEL CLEANUP...');
    
    // Maximum cleanup - clear everything non-essential
    dataCache.shutdown();
    memoryOptimizedSupervisorSync.performAggressiveCleanup();
    
    // Clear all possible caches
    if (global.lazyImportCache) {
      global.lazyImportCache.clear();
    }
    
    // Clear require cache for non-essential modules
    if (require.cache) {
      const toDelete = [];
      Object.keys(require.cache).forEach(key => {
        if (!key.includes('express') && 
            !key.includes('dotenv') && 
            !key.includes('memoryMonitor')) {
          toDelete.push(key);
        }
      });
      
      toDelete.forEach(key => delete require.cache[key]);
      console.log(`🗑️ Cleared ${toDelete.length} require cache entries`);
    }
    
    // Force maximum garbage collection
    if (global.gc) {
      for (let i = 0; i < 5; i++) {
        global.gc();
      }
    }
    
    console.log('✅ Emergency level cleanup complete');
  }

  // Execute emergency shutdown protocol
  executeEmergencyShutdownProtocol() {
    console.log('🚨 EMERGENCY SHUTDOWN PROTOCOL ACTIVATED');
    console.log('🚨 This is a last resort to prevent process restart');
    
    try {
      // Shutdown all non-essential services
      dataCache.shutdown();
      memoryOptimizedSupervisorSync.shutdown();
      
      // Clear all possible memory
      if (global.lazyImportCache) global.lazyImportCache.clear();
      if (global.routeManager) global.routeManager.routeCache.clear();
      
      // Force aggressive garbage collection
      if (global.gc) {
        for (let i = 0; i < 10; i++) {
          global.gc();
        }
      }
      
      console.log('🚨 Emergency shutdown protocol completed');
      console.log('📊 Current memory:', Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB');
      
    } catch (error) {
      console.error('❌ Emergency shutdown protocol failed:', error);
    }
  }

  // Get comprehensive optimization statistics
  getStats() {
    return {
      integration: {
        initialized: this.initialized,
        optimizationActive: this.optimizationActive,
        ...this.stats
      },
      memoryMonitor: memoryMonitor.getDetailedStats(),
      dataCache: dataCache.getStats(),
      supervisorSync: memoryOptimizedSupervisorSync.getStats(),
      bundleOptimizer: bundleOptimizer.getOptimizationStatus(),
      systemMemory: {
        usage: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      }
    };
  }

  // Get health status
  getHealthStatus() {
    const memoryStatus = memoryMonitor.getMemoryStatus();
    const usagePercentage = memoryStatus.usagePercentage;
    
    let status = 'healthy';
    let message = 'Memory usage is within normal parameters';
    
    if (usagePercentage > 85) {
      status = 'critical';
      message = 'Memory usage is critically high - emergency protocols may activate';
    } else if (usagePercentage > 70) {
      status = 'warning';
      message = 'Memory usage is elevated-  monitoring closely';
    } else if (usagePercentage > 60) {
      status = 'caution';
      message = 'Memory usage is above optimal levels';
    }
    
    return {
      status,
      message,
      memoryUsage: usagePercentage + '%',
      timestamp: new Date().toISOString(),
      optimizationActive: this.optimizationActive,
      recommendations: this.getRecommendations()
    };
  }

  // Get current recommendations
  getRecommendations() {
    const recommendations = [];
    const memoryStatus = memoryMonitor.getMemoryStatus();
    const bundleAnalysis = bundleOptimizer.analyzeBundleSize();
    
    if (memoryStatus.usagePercentage > 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Immediate memory optimization required',
        details: 'Consider implementing emergency cleanup protocols'
      });
    }
    
    if (bundleAnalysis.estimatedBundleSize > 100) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Bundle size optimization needed',
        details: 'Implement lazy loading and code splitting'
      });
    }
    
    return recommendations;
  }

  // Shutdown all optimization services
  shutdown() {
    console.log('🏁 Shutting down memory optimization integration...');
    
    try {
      memoryMonitor.stop();
      dataCache.shutdown();
      memoryOptimizedSupervisorSync.shutdown();
      memoryOptimizationService.shutdown();
      
      this.initialized = false;
      this.optimizationActive = false;
      
      console.log('✅ Memory optimization integration shutdown complete');
      
    } catch (error) {
      console.error('❌ Shutdown error:', error);
    }
  }
}

// Create singleton instance
const memoryOptimizationIntegration = new MemoryOptimizationIntegration();

// Auto-initialize
memoryOptimizationIntegration.initialize().catch(error => {
  console.error('❌ Failed to initialize memory optimization:', error);
});

export default memoryOptimizationIntegration;