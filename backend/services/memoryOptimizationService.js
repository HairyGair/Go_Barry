// backend/services/memoryOptimizationService.js
// Comprehensive memory optimization service for Render.com 2GB limit

import memoryMonitor from './memoryMonitor.js';
import dataCache from './memoryEfficientDataCache.js';

class MemoryOptimizationService {
  constructor() {
    this.optimizationStrategies = new Map();
    this.activeOptimizations = new Set();
    this.historicalData = [];
    this.lastOptimization = null;
    this.emergencyModeActive = false;
    
    // Register default optimization strategies
    this.registerOptimizationStrategies();
    
    console.log('🎯 Memory Optimization Service initialized');
  }

  // Register various optimization strategies
  registerOptimizationStrategies() {
    // Strategy 1: Clear import cache
    this.optimizationStrategies.set('clear_import_cache', {
      name: 'Clear Import Cache',
      priority: 1,
      memoryThreshold: 0.6,
      execute: () => this.clearImportCache(),
      estimatedSavings: '50-100MB'
    });

    // Strategy 2: Compress data structures
    this.optimizationStrategies.set('compress_data', {
      name: 'Compress Data Structures',
      priority: 2,
      memoryThreshold: 0.65,
      execute: () => this.compressDataStructures(),
      estimatedSavings: '20-50MB'
    });

    // Strategy 3: Clear data cache
    this.optimizationStrategies.set('clear_data_cache', {
      name: 'Clear Data Cache',
      priority: 3,
      memoryThreshold: 0.7,
      execute: () => this.clearDataCache(),
      estimatedSavings: '30-80MB'
    });

    // Strategy 4: Clear historical data
    this.optimizationStrategies.set('clear_historical', {
      name: 'Clear Historical Data',
      priority: 4,
      memoryThreshold: 0.75,
      execute: () => this.clearHistoricalData(),
      estimatedSavings: '10-30MB'
    });

    // Strategy 5: Emergency cleanup
    this.optimizationStrategies.set('emergency_cleanup', {
      name: 'Emergency Full Cleanup',
      priority: 5,
      memoryThreshold: 0.85,
      execute: () => this.emergencyCleanup(),
      estimatedSavings: '100-200MB'
    });
  }

  // Main optimization method called by memory monitor
  async optimizeMemory(type = 'preventive') {
    const memoryStatus = memoryMonitor.getMemoryStatus();
    const usagePercentage = memoryStatus.usagePercentage / 100;
    
    console.log(`🎯 Starting ${type} memory optimization at ${memoryStatus.usagePercentage}% usage`);
    
    // Track optimization
    this.lastOptimization = {
      type,
      timestamp: new Date().toISOString(),
      memoryBefore: memoryStatus,
      strategiesApplied: []
    };

    let totalSaved = 0;
    let strategiesApplied = 0;

    // Apply strategies based on memory usage level
    const applicableStrategies = Array.from(this.optimizationStrategies.entries())
      .filter(([key, strategy]) => usagePercentage >= strategy.memoryThreshold)
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [key, strategy] of applicableStrategies) {
      if (this.activeOptimizations.has(key)) {
        console.log(`⏭️ Skipping ${strategy.name} - already active`);
        continue;
      }

      try {
        this.activeOptimizations.add(key);
        console.log(`🔧 Applying optimization: ${strategy.name}`);
        
        const memBefore = process.memoryUsage().heapUsed;
        await strategy.execute();
        const memAfter = process.memoryUsage().heapUsed;
        
        const saved = Math.round((memBefore - memAfter) / 1024 / 1024);
        totalSaved += saved;
        strategiesApplied++;
        
        this.lastOptimization.strategiesApplied.push({
          name: strategy.name,
          saved: saved + 'MB',
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${strategy.name} completed - saved ${saved}MB`);
        
        // Check if we've saved enough memory
        const currentUsage = process.memoryUsage().rss / (2 * 1024 * 1024 * 1024);
        if (currentUsage < 0.6) {
          console.log('🎯 Memory usage now healthy, stopping optimization');
          break;
        }
        
      } catch (error) {
        console.error(`❌ Optimization ${strategy.name} failed:`, error.message);
      } finally {
        this.activeOptimizations.delete(key);
      }
    }

    // Record results
    const memoryAfter = memoryMonitor.getMemoryStatus();
    this.lastOptimization.memoryAfter = memoryAfter;
    this.lastOptimization.totalSaved = totalSaved + 'MB';
    this.lastOptimization.strategiesApplied = strategiesApplied;

    // Add to historical data
    this.historicalData.push(this.lastOptimization);
    if (this.historicalData.length > 50) {
      this.historicalData.shift();
    }

    console.log(`🎯 Memory optimization complete: ${strategiesApplied} strategies applied, ${totalSaved}MB saved`);
    console.log(`📊 Memory usage: ${memoryStatus.usagePercentage}% → ${memoryAfter.usagePercentage}%`);

    return {
      success: true,
      strategiesApplied,
      totalSaved: totalSaved + 'MB',
      memoryBefore: memoryStatus.usagePercentage + '%',
      memoryAfter: memoryAfter.usagePercentage + '%'
    };
  }

  // Strategy implementations
  async clearImportCache() {
    if (global.lazyImportCache) {
      const size = global.lazyImportCache.size;
      global.lazyImportCache.clear();
      console.log(`🗑️ Cleared ${size} cached imports`);
    }
    
    // Clear Node.js module cache for non-essential modules
    const moduleCache = require.cache || {};
    let cleared = 0;
    
    Object.keys(moduleCache).forEach(key => {
      // Only clear non-essential modules
      if (key.includes('node_modules') && 
          !key.includes('/express/') && 
          !key.includes('/dotenv/')) {
        delete moduleCache[key];
        cleared++;
      }
    });
    
    console.log(`🗑️ Cleared ${cleared} cached modules`);
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  async compressDataStructures() {
    // Compress large data structures by converting to more efficient formats
    let compressed = 0;
    
    // Look for large Maps and Sets in global scope
    if (global.streamingCache) {
      const cache = global.streamingCache;
      
      // Convert Maps to compressed objects if large
      if (cache.stops && cache.stops.size > 500) {
        const stopsArray = Array.from(cache.stops.entries()).slice(0, 300);
        cache.stops.clear();
        stopsArray.forEach(([key, value]) => cache.stops.set(key, value));
        compressed++;
        console.log('🗜️ Compressed stops cache');
      }
      
      if (cache.routes && cache.routes.size > 100) {
        const routesArray = Array.from(cache.routes.entries()).slice(0, 50);
        cache.routes.clear();
        routesArray.forEach(([key, value]) => cache.routes.set(key, value));
        compressed++;
        console.log('🗜️ Compressed routes cache');
      }
    }
    
    console.log(`🗜️ Compressed ${compressed} data structures`);
  }

  async clearDataCache() {
    const stats = dataCache.getStats();
    
    // Clear all caches
    for (const [name] of dataCache.caches.entries()) {
      dataCache.clear(name);
    }
    
    console.log(`🗑️ Cleared data cache: ${stats.totalItems} items, ${stats.estimatedMemoryMB}MB`);
  }

  async clearHistoricalData() {
    let cleared = 0;
    
    // Clear historical optimization data
    if (this.historicalData.length > 10) {
      const toKeep = this.historicalData.slice(-10);
      this.historicalData = toKeep;
      cleared++;
    }
    
    // Clear memory monitor history
    if (memoryMonitor.memoryHistory && memoryMonitor.memoryHistory.length > 20) {
      const toKeep = memoryMonitor.memoryHistory.slice(-20);
      memoryMonitor.memoryHistory = toKeep;
      cleared++;
    }
    
    console.log(`🗑️ Cleared ${cleared} historical data sets`);
  }

  async emergencyCleanup() {
    console.log('🚨 EMERGENCY MEMORY CLEANUP INITIATED');
    
    this.emergencyModeActive = true;
    
    try {
      // Apply all strategies aggressively
      await this.clearImportCache();
      await this.compressDataStructures();
      await this.clearDataCache();
      await this.clearHistoricalData();
      
      // Additional emergency measures
      // Clear all temporary variables
      if (global.gc) {
        for (let i = 0; i < 5; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Clear console history if available
      if (console.clear) {
        console.clear();
      }
      
      console.log('🚨 Emergency cleanup completed');
      
    } finally {
      this.emergencyModeActive = false;
    }
  }

  // Initialize integration with memory monitor
  integrateWithMemoryMonitor() {
    memoryMonitor.registerCleanupCallback((type) => {
      if (type === 'preventive') {
        this.optimizeMemory('preventive').catch(error => {
          console.error('❌ Preventive optimization failed:', error);
        });
      } else if (type === 'emergency' || type === 'emergency_shutdown') {
        this.optimizeMemory('emergency').catch(error => {
          console.error('❌ Emergency optimization failed:', error);
        });
      }
    });
    
    console.log('🔗 Integrated with memory monitor');
  }

  // Get optimization statistics
  getStats() {
    return {
      totalOptimizations: this.historicalData.length,
      lastOptimization: this.lastOptimization,
      emergencyModeActive: this.emergencyModeActive,
      availableStrategies: Array.from(this.optimizationStrategies.keys()),
      currentMemoryUsage: memoryMonitor.getMemoryStatus(),
      historicalData: this.historicalData.slice(-5) // Last 5 optimizations
    };
  }

  // Get detailed analysis
  getDetailedAnalysis() {
    const memoryStatus = memoryMonitor.getMemoryStatus();
    const recommendations = [];
    
    // Analyze current memory usage and provide recommendations
    if (memoryStatus.usagePercentage > 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Immediate optimization required',
        strategy: 'emergency_cleanup'
      });
    } else if (memoryStatus.usagePercentage > 70) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Preventive cleanup recommended',
        strategy: 'clear_data_cache'
      });
    } else if (memoryStatus.usagePercentage > 60) {
      recommendations.push({
        priority: 'LOW',
        action: 'Consider clearing import cache',
        strategy: 'clear_import_cache'
      });
    }
    
    return {
      currentStatus: memoryStatus,
      recommendations,
      optimizationHistory: this.historicalData,
      availableStrategies: Array.from(this.optimizationStrategies.entries()).map(([key, strategy]) => ({
        key,
        name: strategy.name,
        priority: strategy.priority,
        threshold: (strategy.memoryThreshold * 100).toFixed(0) + '%',
        estimatedSavings: strategy.estimatedSavings
      }))
    };
  }

  // Shutdown cleanup
  shutdown() {
    console.log('🏁 Memory Optimization Service shutting down...');
    
    // Clear all data
    this.historicalData = [];
    this.activeOptimizations.clear();
    this.optimizationStrategies.clear();
    
    console.log('✅ Memory Optimization Service shutdown complete');
  }
}

// Create singleton instance
const memoryOptimizationService = new MemoryOptimizationService();

// Integrate with memory monitor
memoryOptimizationService.integrateWithMemoryMonitor();

export default memoryOptimizationService;