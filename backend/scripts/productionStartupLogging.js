#!/usr/bin/env node
// backend/scripts/productionStartupLogging.js
// Production startup integration for supervisor logging activation

import productionSupervisorLoggingManager from '../middleware/productionSupervisorLogging.js';

/**
 * Production Startup Logging Integration
 * 
 * This script handles supervisor logging activation during production startup.
 * It's designed to be called from render-startup.js after port binding but
 * before full backend loading.
 * 
 * Features:
 * - Automatic activation in production
 * - Environment-based configuration
 * - Non-blocking initialization
 * - Comprehensive error handling
 * - Integration with existing startup process
 */

class ProductionStartupLogger {
  constructor() {
    this.startupStartTime = Date.now();
    this.activationResults = null;
  }

  /**
   * Initialize supervisor logging during production startup
   */
  async initializeForProduction() {
    console.log('🚀 ProductionStartupLogger: Initializing supervisor logging...');
    
    try {
      // Check if we should activate logging
      if (!this.shouldActivateOnStartup()) {
        console.log('📝 Supervisor logging activation skipped based on environment');
        return { success: true, status: 'skipped', reason: 'environment_configuration' };
      }

      console.log('🔧 Starting production supervisor logging activation...');
      
      // Initialize with timeout to prevent blocking startup
      const activationPromise = productionSupervisorLoggingManager.initializeProductionLogging();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Activation timeout')), 30000) // 30 second timeout
      );

      try {
        this.activationResults = await Promise.race([activationPromise, timeoutPromise]);
        
        const duration = Date.now() - this.startupStartTime;
        console.log(`✅ Supervisor logging activated successfully in ${duration}ms`);
        console.log('📊 Activation results:', JSON.stringify(this.activationResults, null, 2));

        return {
          success: true,
          status: 'activated',
          duration,
          results: this.activationResults
        };

      } catch (timeoutError) {
        if (timeoutError.message === 'Activation timeout') {
          console.warn('⏰ Supervisor logging activation timed out - continuing in background');
          
          // Continue activation in background
          activationPromise.then(results => {
            console.log('🔄 Background activation completed:', results);
            this.activationResults = results;
          }).catch(bgError => {
            console.error('❌ Background activation failed:', bgError.message);
          });

          return {
            success: true,
            status: 'background_activation',
            timeout: true,
            message: 'Activation continuing in background'
          };
        }
        throw timeoutError;
      }

    } catch (error) {
      console.error('❌ Production startup logging failed:', error.message);
      
      // Check if graceful degradation is enabled
      const config = productionSupervisorLoggingManager.config;
      if (config.gracefulDegradation) {
        console.warn('⚠️ Continuing startup without enhanced logging (graceful degradation)');
        return {
          success: false,
          status: 'failed_graceful',
          error: error.message,
          degraded: true
        };
      } else {
        throw error; // Re-throw if graceful degradation is disabled
      }
    }
  }

  /**
   * Check if logging should be activated on startup
   */
  shouldActivateOnStartup() {
    const nodeEnv = process.env.NODE_ENV;
    const autoActivate = process.env.AUTO_ACTIVATE_LOGGING !== 'false';
    const forceProduction = nodeEnv === 'production';
    const enableDev = process.env.ENABLE_DEV_LOGGING === 'true';
    const globallyEnabled = process.env.SUPERVISOR_LOGGING_ENABLED !== 'false';

    console.log('🔍 Startup activation check:', {
      nodeEnv,
      autoActivate,
      forceProduction,
      enableDev,
      globallyEnabled
    });

    if (!globallyEnabled) {
      console.log('❌ Globally disabled via SUPERVISOR_LOGGING_ENABLED=false');
      return false;
    }

    if (forceProduction) {
      console.log('✅ Production environment - forcing activation');
      return true;
    }

    if (nodeEnv === 'development' && enableDev) {
      console.log('✅ Development environment with explicit enablement');
      return true;
    }

    if (autoActivate && nodeEnv !== 'development') {
      console.log('✅ Auto-activation enabled for non-development environment');
      return true;
    }

    console.log('❌ Activation not required based on environment configuration');
    return false;
  }

  /**
   * Get startup status and statistics
   */
  getStartupStatus() {
    return {
      startupDuration: Date.now() - this.startupStartTime,
      activationResults: this.activationResults,
      managerStatus: productionSupervisorLoggingManager.getStatus(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        autoActivate: process.env.AUTO_ACTIVATE_LOGGING,
        enabled: process.env.SUPERVISOR_LOGGING_ENABLED
      }
    };
  }

  /**
   * Create Express middleware for startup integration
   */
  createStartupMiddleware() {
    return (req, res, next) => {
      // Add startup status to requests (for debugging)
      req.supervisorLoggingStartup = this.getStartupStatus();
      next();
    };
  }
}

/**
 * Quick startup function for render-startup.js integration
 */
export async function activateSupervisorLoggingForProduction() {
  const startupLogger = new ProductionStartupLogger();
  
  try {
    const result = await startupLogger.initializeForProduction();
    console.log('📝 Supervisor logging startup result:', result);
    return result;
  } catch (error) {
    console.error('❌ Critical supervisor logging startup failure:', error.message);
    throw error;
  }
}

/**
 * Non-blocking activation function for background initialization
 */
export async function activateSupervisorLoggingBackground() {
  console.log('🔄 Starting background supervisor logging activation...');
  
  try {
    const result = await productionSupervisorLoggingManager.initializeProductionLogging();
    console.log('✅ Background supervisor logging activation completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Background supervisor logging activation failed:', error.message);
    return { success: false, error: error.message, background: true };
  }
}

/**
 * Health check function for monitoring
 */
export function getSupervisorLoggingHealth() {
  return {
    manager: productionSupervisorLoggingManager.getStatus(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      uptime: process.uptime()
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };
}

// Create and export singleton instance for render-startup.js
const productionStartupLogger = new ProductionStartupLogger();
export default productionStartupLogger;

// Export manager for direct access
export { productionSupervisorLoggingManager };

// Self-executing activation if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running supervisor logging activation directly...');
  
  activateSupervisorLoggingForProduction()
    .then(result => {
      console.log('✅ Direct activation completed:', result);
      if (result.success) {
        console.log('🎉 Supervisor logging is now active and ready!');
      } else {
        console.log('⚠️ Activation completed with issues - check logs above');
      }
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Direct activation failed:', error);
      process.exit(1);
    });
}