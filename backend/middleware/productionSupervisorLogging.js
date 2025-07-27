#!/usr/bin/env node
// backend/middleware/productionSupervisorLogging.js
// Production-ready automatic supervisor logging activation for Go BARRY

import enhancedSupervisorActivityService from '../services/enhancedSupervisorActivityService.js';
import { integrateSupervisorLogging } from '../scripts/integrateSupervisorLogging.js';
import supervisorLoggingFallback from './supervisorLoggingFallback.js';
import supervisorLoggingPerformanceMonitor from './supervisorLoggingPerformance.js';

/**
 * Production Supervisor Logging Middleware
 * 
 * Automatically activates comprehensive supervisor logging in production environments.
 * Features:
 * - Environment-based activation
 * - Graceful fallback handling
 * - Memory optimization for 2GB constraint
 * - Health monitoring integration
 * - Performance tracking
 */

class ProductionSupervisorLoggingManager {
  constructor() {
    this.isInitialized = false;
    this.activationStatus = 'not_started';
    this.loggingHealth = {
      status: 'unknown',
      lastCheck: null,
      errors: [],
      performanceMetrics: {}
    };
    this.config = this.loadConfiguration();
  }

  /**
   * Load logging configuration from environment variables
   */
  loadConfiguration() {
    return {
      // Core activation settings
      enabled: process.env.SUPERVISOR_LOGGING_ENABLED !== 'false', // Default: enabled
      autoActivate: process.env.AUTO_ACTIVATE_LOGGING !== 'false', // Default: auto-activate
      
      // Environment-based behavior
      forceInProduction: process.env.NODE_ENV === 'production',
      enableInDevelopment: process.env.ENABLE_DEV_LOGGING === 'true',
      
      // Performance settings
      batchSize: parseInt(process.env.LOGGING_BATCH_SIZE) || 10,
      batchTimeout: parseInt(process.env.LOGGING_BATCH_TIMEOUT) || 5000,
      maxMemoryUsage: parseInt(process.env.LOGGING_MAX_MEMORY_MB) || 100, // 100MB limit
      
      // Health monitoring
      healthCheckInterval: parseInt(process.env.LOGGING_HEALTH_INTERVAL) || 60000, // 1 minute
      performanceMonitoring: process.env.ENABLE_LOGGING_PERFORMANCE !== 'false',
      
      // Fallback settings
      retryAttempts: parseInt(process.env.LOGGING_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.LOGGING_RETRY_DELAY) || 5000,
      gracefulDegradation: process.env.LOGGING_GRACEFUL_DEGRADATION !== 'false'
    };
  }

  /**
   * Check if logging should be activated based on environment
   */
  shouldActivateLogging() {
    const { enabled, autoActivate, forceInProduction, enableInDevelopment } = this.config;
    
    if (!enabled) {
      console.log('📝 Supervisor logging disabled via SUPERVISOR_LOGGING_ENABLED=false');
      return false;
    }

    if (!autoActivate && process.env.NODE_ENV !== 'production') {
      console.log('📝 Auto-activation disabled via AUTO_ACTIVATE_LOGGING=false');
      return false;
    }

    // Always activate in production (unless explicitly disabled)
    if (process.env.NODE_ENV === 'production' && forceInProduction) {
      console.log('🏭 Production environment detected - forcing supervisor logging activation');
      return true;
    }

    // Activate in development if enabled
    if (process.env.NODE_ENV === 'development' && enableInDevelopment) {
      console.log('🛠️ Development logging enabled via ENABLE_DEV_LOGGING=true');
      return true;
    }

    // Default behavior: activate unless explicitly disabled
    console.log('📝 Using default logging activation behavior');
    return autoActivate;
  }

  /**
   * Initialize production supervisor logging with error handling
   */
  async initializeProductionLogging() {
    if (this.isInitialized) {
      console.log('📝 Supervisor logging already initialized');
      return { success: true, status: 'already_initialized' };
    }

    if (!this.shouldActivateLogging()) {
      console.log('📝 Supervisor logging activation skipped based on configuration');
      this.activationStatus = 'skipped';
      return { success: true, status: 'skipped' };
    }

    console.log('🚀 Starting production supervisor logging activation...');
    this.activationStatus = 'activating';

    let attempt = 1;
    const maxAttempts = this.config.retryAttempts;

    while (attempt <= maxAttempts) {
      try {
        console.log(`📝 Activation attempt ${attempt}/${maxAttempts}...`);

        // Step 1: Verify enhanced service is available
        const serviceHealth = enhancedSupervisorActivityService.getHealthStatus();
        console.log('📊 Enhanced service health:', serviceHealth);

        // Step 2: Configure performance settings
        if (enhancedSupervisorActivityService.batchSize !== this.config.batchSize) {
          enhancedSupervisorActivityService.batchSize = this.config.batchSize;
          console.log(`⚙️ Updated batch size to ${this.config.batchSize}`);
        }

        if (enhancedSupervisorActivityService.batchTimeout !== this.config.batchTimeout) {
          enhancedSupervisorActivityService.batchTimeout = this.config.batchTimeout;
          console.log(`⚙️ Updated batch timeout to ${this.config.batchTimeout}ms`);
        }

        // Step 3: Run integration script (with error handling)
        try {
          await integrateSupervisorLogging();
          console.log('✅ Supervisor logging integration completed successfully');
        } catch (integrationError) {
          if (this.config.gracefulDegradation) {
            console.warn('⚠️ Integration script failed, continuing with basic logging:', integrationError.message);
          } else {
            throw integrationError;
          }
        }

        // Step 4: Initialize performance monitoring
        if (this.config.performanceMonitoring) {
          supervisorLoggingPerformanceMonitor.startMonitoring();
          console.log('📊 Performance monitoring activated');
        }

        // Step 5: Initialize health monitoring
        this.startHealthMonitoring();

        // Step 6: Mark as initialized
        this.isInitialized = true;
        this.activationStatus = 'active';
        this.loggingHealth.status = 'healthy';
        this.loggingHealth.lastCheck = new Date().toISOString();

        console.log('✅ Production supervisor logging activated successfully!');
        console.log(`📊 Configuration: ${JSON.stringify(this.config, null, 2)}`);

        return {
          success: true,
          status: 'activated',
          attempt,
          config: this.config,
          health: this.loggingHealth
        };

      } catch (error) {
        console.error(`❌ Activation attempt ${attempt} failed:`, error.message);
        this.loggingHealth.errors.push({
          attempt,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (attempt < maxAttempts) {
          console.log(`⏳ Retrying in ${this.config.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }

        attempt++;
      }
    }

    // All attempts failed
    this.activationStatus = 'failed';
    this.loggingHealth.status = 'error';

    if (this.config.gracefulDegradation) {
      console.warn('⚠️ Supervisor logging activation failed - activating fallback mode');
      
      // Activate fallback mode
      await supervisorLoggingFallback.activateFallback(
        'main_system_activation_failed',
        new Error(`Failed after ${maxAttempts} attempts`)
      );

      this.activationStatus = 'fallback_mode';
      
      return {
        success: false,
        status: 'failed_graceful',
        attempts: maxAttempts,
        degraded: true,
        fallbackActive: true
      };
    } else {
      console.error('❌ Supervisor logging activation failed - all attempts exhausted');
      throw new Error(`Failed to activate supervisor logging after ${maxAttempts} attempts`);
    }
  }

  /**
   * Start health monitoring for the logging system
   */
  startHealthMonitoring() {
    if (!this.config.performanceMonitoring) {
      console.log('📊 Performance monitoring disabled');
      return;
    }

    console.log(`📊 Starting health monitoring (interval: ${this.config.healthCheckInterval}ms)`);

    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform comprehensive health check of logging system
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage();

    try {
      // Check enhanced service health
      const serviceHealth = enhancedSupervisorActivityService.getHealthStatus();
      
      // Check memory usage
      const memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const memoryLimit = this.config.maxMemoryUsage;

      // Update health status
      this.loggingHealth = {
        status: memoryUsage > memoryLimit ? 'warning' : 'healthy',
        lastCheck: new Date().toISOString(),
        errors: this.loggingHealth.errors.slice(-5), // Keep last 5 errors
        performanceMetrics: {
          memoryUsage,
          memoryLimit,
          batchBufferSize: serviceHealth.batchBufferSize,
          uptime: serviceHealth.uptime,
          lastCheckDuration: Date.now() - startTime
        }
      };

      // Memory warning
      if (memoryUsage > memoryLimit) {
        console.warn(`⚠️ Logging memory usage (${memoryUsage}MB) exceeds limit (${memoryLimit}MB)`);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('🗑️ Triggered garbage collection for logging system');
        }
      }

      // Log health status (occasionally)
      if (Math.random() < 0.1) { // 10% chance to avoid log spam
        console.log(`📊 Logging health: ${this.loggingHealth.status} (${memoryUsage}MB, buffer: ${serviceHealth.batchBufferSize})`);
      }

    } catch (error) {
      this.loggingHealth.status = 'error';
      this.loggingHealth.errors.push({
        error: error.message,
        timestamp: new Date().toISOString(),
        type: 'health_check'
      });
      
      console.error('❌ Logging health check failed:', error.message);
    }
  }

  /**
   * Get current logging system status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      activationStatus: this.activationStatus,
      health: this.loggingHealth,
      config: this.config,
      fallback: supervisorLoggingFallback.getStatus(),
      performance: supervisorLoggingPerformanceMonitor.getMetrics(),
      environmentInfo: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version,
        processUptime: Math.round(process.uptime())
      }
    };
  }

  /**
   * Express middleware for automatic logging activation
   */
  middleware() {
    // Initialize logging on first request if not already done
    let initializationPromise = null;

    return async (req, res, next) => {
      // Only initialize once
      if (!this.isInitialized && this.activationStatus === 'not_started') {
        if (!initializationPromise) {
          initializationPromise = this.initializeProductionLogging();
        }
        
        try {
          await initializationPromise;
        } catch (error) {
          console.error('❌ Middleware initialization failed:', error.message);
          // Continue anyway if graceful degradation is enabled
          if (!this.config.gracefulDegradation) {
            return res.status(500).json({
              error: 'Supervisor logging initialization failed',
              details: error.message
            });
          }
        }
      }

      // Add logging status to response headers (for debugging)
      if (process.env.NODE_ENV !== 'production') {
        res.set('X-Supervisor-Logging-Status', this.activationStatus);
        res.set('X-Supervisor-Logging-Health', this.loggingHealth.status);
      }

      next();
    };
  }

  /**
   * Graceful shutdown handling
   */
  async shutdown() {
    console.log('🛑 Shutting down supervisor logging system...');

    try {
      // Stop performance monitoring
      supervisorLoggingPerformanceMonitor.stopMonitoring();
      console.log('✅ Performance monitoring stopped');

      // Cleanup enhanced service
      if (enhancedSupervisorActivityService && typeof enhancedSupervisorActivityService.cleanup === 'function') {
        await enhancedSupervisorActivityService.cleanup();
        console.log('✅ Enhanced supervisor activity service cleaned up');
      }

      this.isInitialized = false;
      this.activationStatus = 'shutdown';
      console.log('✅ Supervisor logging system shutdown complete');

    } catch (error) {
      console.error('❌ Error during supervisor logging shutdown:', error.message);
    }
  }
}

// Create singleton instance
const productionSupervisorLoggingManager = new ProductionSupervisorLoggingManager();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await productionSupervisorLoggingManager.shutdown();
});

process.on('SIGINT', async () => {
  await productionSupervisorLoggingManager.shutdown();
});

// Export the manager and middleware
export default productionSupervisorLoggingManager;
export { productionSupervisorLoggingManager };