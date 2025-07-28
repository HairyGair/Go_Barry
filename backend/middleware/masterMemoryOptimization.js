// backend/middleware/masterMemoryOptimization.js
// Master memory optimization integration for Go BARRY backend 2GB constraint

import { memoryOptimizedMiddleware, requestMemoryMonitor } from './memoryOptimizedResponse.js';
import { memoryThrottleMiddleware } from './memoryGuard.js';
import { requestMemoryCleanupMiddleware } from './requestMemoryCleanup.js';
import { compressionCachingMiddleware, cacheControlMiddleware, etagMiddleware } from './compressionAndCaching.js';
import memoryGuard from './memoryGuard.js';
import requestMemoryCleanup from './requestMemoryCleanup.js';
import compressionAndCaching from './compressionAndCaching.js';
import optimizedDb from '../services/optimizedDatabaseService.js';

/**
 * Master Memory Optimization System
 * Coordinates all memory optimization components for 2GB RAM constraint
 */
class MasterMemoryOptimization {
  constructor() {
    this.components = {
      memoryGuard,
      requestMemoryCleanup,
      compressionAndCaching,
      optimizedDb
    };
    
    this.isInitialized = false;
    this.integrationStats = {
      requestsProcessed: 0,
      memoryOptimizations: 0,
      cachingEvents: 0,
      cleanupEvents: 0,
      throttlingEvents: 0
    };
    
    console.log('🎯 Master Memory Optimization System initializing...');
  }

  /**
   * Initialize all memory optimization components
   */
  async initialize(app) {
    try {
      console.log('🚀 Initializing comprehensive memory optimization...');

      // Set up global memory monitoring
      this.setupGlobalMemoryMonitoring();
      
      // Register emergency cleanup handlers
      this.setupEmergencyHandlers();
      
      // Initialize component integrations
      this.setupComponentIntegrations();
      
      // Apply middleware in optimal order
      this.applyOptimizationMiddleware(app);
      
      this.isInitialized = true;
      console.log('✅ Master Memory Optimization System initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Master Memory Optimization:', error);
      return false;
    }
  }

  /**
   * Set up global memory monitoring with proactive optimization
   */
  setupGlobalMemoryMonitoring() {
    console.log('📊 Setting up global memory monitoring...');
    
    // Monitor memory usage every 30 seconds
    this.memoryMonitoringInterval = setInterval(() => {
      this.performMemoryHealthCheck();
    }, 30000);
    
    // Listen for memory guard events
    memoryGuard.on('critical-memory', (data) => {
      console.error('🚨 CRITICAL MEMORY EVENT:', data);
      this.handleCriticalMemory(data);
    });
    
    memoryGuard.on('memory-cleanup', (data) => {
      console.log('🧹 Memory cleanup triggered:', data);
      this.integrationStats.cleanupEvents++;
    });
  }

  /**
   * Perform comprehensive memory health check
   */
  performMemoryHealthCheck() {
    const memUsage = process.memoryUsage();
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // Log memory status periodically
    if (rssMB > 1000) { // Only log if using significant memory
      console.log(`📊 Memory Health Check: RSS=${rssMB}MB, Heap=${heapUsedMB}MB/2048MB`);
    }
    
    // Proactive optimization based on memory usage
    if (rssMB > 1200 && rssMB < 1600) {
      // Moderate memory usage - perform preventive cleanup
      this.performPreventiveOptimization();
    } else if (rssMB >= 1600) {
      // High memory usage - aggressive optimization
      this.performAggressiveOptimization();
    }
  }

  /**
   * Handle critical memory situations
   */
  async handleCriticalMemory(data) {
    console.error('🚨 HANDLING CRITICAL MEMORY SITUATION');
    
    try {
      // 1. Force cleanup of all pending requests
      requestMemoryCleanup.forceCleanupAll();
      
      // 2. Clear all caches
      compressionAndCaching.clearCache();
      optimizedDb.clearCache();
      
      // 3. Force multiple garbage collections
      if (global.gc) {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => global.gc(), i * 100);
        }
      }
      
      // 4. Log emergency state
      const memUsage = process.memoryUsage();
      console.error('🚨 Emergency cleanup completed:', {
        memoryAfter: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error during critical memory handling:', error);
    }
  }

  /**
   * Perform preventive memory optimization
   */
  performPreventiveOptimization() {
    console.log('🔧 Performing preventive memory optimization...');
    
    // Light cleanup to prevent memory buildup
    if (global.gc && Math.random() < 0.3) { // 30% chance
      global.gc();
    }
    
    // Trim caches if they're getting large
    const compressionStats = compressionAndCaching.getStats();
    if (compressionStats.cache.entries > 150) {
      console.log('🗑️ Trimming compression cache...');
      // Cache will auto-trim on next cleanup cycle
    }
    
    this.integrationStats.memoryOptimizations++;
  }

  /**
   * Perform aggressive memory optimization
   */
  performAggressiveOptimization() {
    console.log('⚡ Performing aggressive memory optimization...');
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    // Clear partial caches
    compressionAndCaching.clearCache();
    
    // Request cleanup of pending operations
    requestMemoryCleanup.forceCleanupAll();
    
    this.integrationStats.memoryOptimizations++;
    console.log('✅ Aggressive optimization completed');
  }

  /**
   * Set up emergency handlers for system shutdown scenarios
   */
  setupEmergencyHandlers() {
    console.log('🛡️ Setting up emergency handlers...');
    
    // Handle process exit
    process.on('SIGTERM', () => {
      console.log('🚪 SIGTERM received - performing emergency cleanup...');
      this.emergencyShutdown();
    });
    
    process.on('SIGINT', () => {
      console.log('🚪 SIGINT received - performing emergency cleanup...');
      this.emergencyShutdown();
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.handleCriticalMemory({ error: error.message });
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection:', reason);
      this.performAggressiveOptimization();
    });
  }

  /**
   * Set up component integrations
   */
  setupComponentIntegrations() {
    console.log('🔗 Setting up component integrations...');
    
    // Register cleanup callbacks across components
    requestMemoryCleanup.registerCleanupCallback((requestId, context) => {
      // Integrated cleanup logic can go here
      this.integrationStats.cleanupEvents++;
    });
    
    // Cross-component optimization triggers
    memoryGuard.on('throttling-level-changed', (level) => {
      if (level >= 2) {
        this.performPreventiveOptimization();
      }
    });
  }

  /**
   * Apply all optimization middleware in correct order
   */
  applyOptimizationMiddleware(app) {
    console.log('🌐 Applying optimization middleware stack...');
    
    // 1. Request memory monitoring (first to track all requests)
    app.use(requestMemoryMonitor);
    
    // 2. Request cleanup tracking
    app.use(requestMemoryCleanupMiddleware);
    
    // 3. Memory-based throttling (early to reject overload)
    app.use(memoryThrottleMiddleware);
    
    // 4. Cache control headers
    app.use(cacheControlMiddleware(300)); // 5 minutes default
    
    // 5. ETag support for efficient caching
    app.use(etagMiddleware);
    
    // 6. Compression and caching (optimize responses)
    app.use(compressionCachingMiddleware({
      enableCompression: true,
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      compressionThreshold: 1024
    }));
    
    // 7. Memory-optimized response handling
    app.use(memoryOptimizedMiddleware);
    
    console.log('✅ Optimization middleware stack applied');
  }

  /**
   * Get comprehensive system statistics
   */
  getComprehensiveStats() {
    const memUsage = process.memoryUsage();
    
    return {
      system: {
        memoryUsage: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
          utilization: ((memUsage.rss / (2048 * 1024 * 1024)) * 100).toFixed(1) + '%'
        },
        uptime: Math.round(process.uptime()) + 's',
        initialized: this.isInitialized
      },
      components: {
        memoryGuard: memoryGuard.getStats(),
        requestCleanup: requestMemoryCleanup.getStats(),
        compressionCaching: compressionAndCaching.getStats(),
        database: optimizedDb.getStats()
      },
      integration: {
        ...this.integrationStats,
        optimizationRate: this.integrationStats.requestsProcessed > 0 
          ? (this.integrationStats.memoryOptimizations / this.integrationStats.requestsProcessed * 100).toFixed(2) + '%'
          : '0%'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Middleware to track requests through the optimization system
   */
  getRequestTrackingMiddleware() {
    return (req, res, next) => {
      this.integrationStats.requestsProcessed++;
      
      // Add optimization context to request
      req.memoryOptimization = {
        startTime: Date.now(),
        startMemory: process.memoryUsage().heapUsed
      };
      
      // Track completion
      res.on('finish', () => {
        const duration = Date.now() - req.memoryOptimization.startTime;
        const memoryDelta = process.memoryUsage().heapUsed - req.memoryOptimization.startMemory;
        
        // Log high-impact requests
        if (duration > 5000 || memoryDelta > 50 * 1024 * 1024) { // >5s or >50MB
          console.warn('⚠️ High-impact request:', {
            path: req.path,
            method: req.method,
            duration: duration + 'ms',
            memoryDelta: Math.round(memoryDelta / 1024 / 1024) + 'MB'
          });
        }
      });
      
      next();
    };
  }

  /**
   * Emergency shutdown with cleanup
   */
  emergencyShutdown() {
    console.log('🚨 Emergency shutdown initiated...');
    
    try {
      // Stop monitoring
      if (this.memoryMonitoringInterval) {
        clearInterval(this.memoryMonitoringInterval);
      }
      
      // Cleanup all components
      Object.values(this.components).forEach(component => {
        if (component && typeof component.cleanup === 'function') {
          component.cleanup();
        } else if (component && typeof component.shutdown === 'function') {
          component.shutdown();
        }
      });
      
      // Final memory cleanup
      if (global.gc) {
        global.gc();
      }
      
      console.log('✅ Emergency shutdown completed');
      
    } catch (error) {
      console.error('❌ Error during emergency shutdown:', error);
    }
  }

  /**
   * Health check endpoint data
   */
  getHealthCheck() {
    const memUsage = process.memoryUsage();
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const utilization = (rssMB / 2048) * 100;
    
    let status = 'healthy';
    let message = 'All memory optimization systems operational';
    
    if (utilization >= 90) {
      status = 'critical';
      message = 'Memory usage critical - system under extreme pressure';
    } else if (utilization >= 80) {
      status = 'warning';
      message = 'Memory usage high - aggressive optimization active';
    } else if (utilization >= 70) {
      status = 'elevated';
      message = 'Memory usage elevated - preventive optimization active';
    }
    
    return {
      status,
      message,
      memoryUtilization: utilization.toFixed(1) + '%',
      componentsActive: Object.keys(this.components).length,
      optimizationsActive: this.integrationStats.memoryOptimizations,
      isInitialized: this.isInitialized
    };
  }
}

// Singleton instance
const masterMemoryOptimization = new MasterMemoryOptimization();

/**
 * Express middleware factory for master memory optimization
 */
export const masterMemoryOptimizationMiddleware = (app) => {
  // Initialize the system
  masterMemoryOptimization.initialize(app);
  
  // Return request tracking middleware
  return masterMemoryOptimization.getRequestTrackingMiddleware();
};

/**
 * Get comprehensive stats
 */
export const getOptimizationStats = () => {
  return masterMemoryOptimization.getComprehensiveStats();
};

/**
 * Get health check data
 */
export const getOptimizationHealth = () => {
  return masterMemoryOptimization.getHealthCheck();
};

/**
 * Force optimization (emergency use)
 */
export const forceOptimization = (level = 'preventive') => {
  if (level === 'aggressive') {
    masterMemoryOptimization.performAggressiveOptimization();
  } else {
    masterMemoryOptimization.performPreventiveOptimization();
  }
};

export default masterMemoryOptimization;