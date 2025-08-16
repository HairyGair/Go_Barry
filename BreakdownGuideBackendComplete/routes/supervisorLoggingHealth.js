// backend/routes/supervisorLoggingHealth.js
// Health check endpoints for supervisor logging system

import express from 'express';
import { getSupervisorLoggingHealth } from '../scripts/productionStartupLogging.js';
import enhancedSupervisorActivityService from '../services/enhancedSupervisorActivityService.js';

const router = express.Router();

/**
 * Comprehensive health check endpoint for supervisor logging system
 * GET /api/supervisor-logging/health
 */
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get comprehensive health status
    const healthData = getSupervisorLoggingHealth();
    const serviceHealth = enhancedSupervisorActivityService.getHealthStatus();
    
    // Perform basic functionality test
    let functionalityTest = { status: 'unknown', error: null };
    try {
      // Test logging a simple activity (this should be very fast)
      const testStart = Date.now();
      await enhancedSupervisorActivityService.logActivity(
        { id: 'health_check', name: 'System Health Check', badge: 'SYS' },
        'health_check_test',
        { 
          testId: `health_${Date.now()}`,
          purpose: 'system_health_verification'
        },
        req,
        { immediate: false, priority: 'low' }
      );
      
      functionalityTest = {
        status: 'operational',
        testDuration: Date.now() - testStart,
        error: null
      };
    } catch (testError) {
      functionalityTest = {
        status: 'error',
        error: testError.message,
        testDuration: Date.now() - testStart
      };
    }

    // Determine overall health status
    let overallStatus = 'healthy';
    let statusReasons = [];

    if (!healthData.manager.initialized) {
      overallStatus = 'warning';
      statusReasons.push('Logging system not initialized');
    }

    if (healthData.manager.activationStatus === 'failed') {
      overallStatus = 'error';
      statusReasons.push('Logging activation failed');
    }

    if (functionalityTest.status === 'error') {
      overallStatus = 'error';
      statusReasons.push('Functionality test failed');
    }

    if (healthData.memory.heapUsed > 150) { // 150MB threshold
      overallStatus = overallStatus === 'healthy' ? 'warning' : overallStatus;
      statusReasons.push('High memory usage');
    }

    if (serviceHealth.batchBufferSize > 50) { // Large buffer might indicate issues
      overallStatus = overallStatus === 'healthy' ? 'warning' : overallStatus;
      statusReasons.push('Large batch buffer size');
    }

    const response = {
      status: overallStatus,
      statusReasons,
      timestamp: new Date().toISOString(),
      checkDuration: Date.now() - startTime,
      
      // Core health information
      logging: {
        initialized: healthData.manager.initialized,
        activationStatus: healthData.manager.activationStatus,
        health: healthData.manager.health,
        config: healthData.manager.config
      },

      // Service health
      service: serviceHealth,

      // Functionality test results
      functionalityTest,

      // System information
      system: {
        environment: healthData.environment,
        memory: healthData.memory,
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version
      },

      // Performance metrics
      performance: {
        batchProcessing: {
          bufferSize: serviceHealth.batchBufferSize,
          timerActive: serviceHealth.batchTimerActive
        },
        memoryEfficiency: {
          heapUsed: healthData.memory.heapUsed,
          heapTotal: healthData.memory.heapTotal,
          efficiency: Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100)
        }
      }
    };

    // Set appropriate HTTP status code
    let httpStatus = 200;
    if (overallStatus === 'warning') httpStatus = 200; // Still OK but with warnings
    if (overallStatus === 'error') httpStatus = 503; // Service unavailable

    res.status(httpStatus).json(response);

  } catch (error) {
    console.error('❌ Supervisor logging health check failed:', error);
    
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Quick status endpoint for monitoring systems
 * GET /api/supervisor-logging/status
 */
router.get('/status', (req, res) => {
  try {
    const healthData = getSupervisorLoggingHealth();
    const serviceHealth = enhancedSupervisorActivityService.getHealthStatus();

    const status = {
      initialized: healthData.manager.initialized,
      status: healthData.manager.activationStatus,
      healthy: healthData.manager.health.status === 'healthy',
      memoryUsage: healthData.memory.heapUsed,
      batchBufferSize: serviceHealth.batchBufferSize,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      initialized: false,
      status: 'error',
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed metrics endpoint for performance monitoring
 * GET /api/supervisor-logging/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const healthData = getSupervisorLoggingHealth();
    const serviceHealth = enhancedSupervisorActivityService.getHealthStatus();

    // Get recent activity statistics
    let activityStats = null;
    try {
      activityStats = await enhancedSupervisorActivityService.getActivityStats(null, '1h');
    } catch (statsError) {
      console.warn('⚠️ Could not fetch activity stats:', statsError.message);
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      
      // System metrics
      system: {
        memory: {
          heapUsed: healthData.memory.heapUsed,
          heapTotal: healthData.memory.heapTotal,
          external: healthData.memory.external,
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        },
        uptime: Math.round(process.uptime()),
        cpu: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version
        }
      },

      // Logging service metrics
      logging: {
        initialized: healthData.manager.initialized,
        activationStatus: healthData.manager.activationStatus,
        health: healthData.manager.health.status,
        batchBuffer: {
          size: serviceHealth.batchBufferSize,
          timerActive: serviceHealth.batchTimerActive
        },
        configuration: {
          batchSize: healthData.manager.config?.batchSize || 'unknown',
          batchTimeout: healthData.manager.config?.batchTimeout || 'unknown',
          maxMemoryUsage: healthData.manager.config?.maxMemoryUsage || 'unknown'
        }
      },

      // Activity statistics (last hour)
      activities: activityStats ? {
        total: activityStats.totalActivities,
        categories: activityStats.categoryBreakdown,
        critical: activityStats.criticalActions,
        hourlyDistribution: activityStats.hourlyDistribution
      } : null,

      // Performance indicators
      performance: {
        memoryEfficiency: Math.round((healthData.memory.heapUsed / healthData.memory.heapTotal) * 100),
        batchingEfficiency: serviceHealth.batchBufferSize < 10 ? 'good' : 
                          serviceHealth.batchBufferSize < 25 ? 'moderate' : 'poor',
        overallHealth: healthData.manager.health.status
      }
    };

    res.json(metrics);

  } catch (error) {
    console.error('❌ Failed to generate logging metrics:', error);
    
    res.status(500).json({
      error: 'Failed to generate metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Force garbage collection endpoint (development/debugging only)
 * POST /api/supervisor-logging/gc
 */
router.post('/gc', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Garbage collection endpoint disabled in production',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const beforeGC = process.memoryUsage();
    
    if (global.gc) {
      global.gc();
      const afterGC = process.memoryUsage();
      
      res.json({
        success: true,
        message: 'Garbage collection triggered',
        memoryBefore: {
          heapUsed: Math.round(beforeGC.heapUsed / 1024 / 1024),
          heapTotal: Math.round(beforeGC.heapTotal / 1024 / 1024)
        },
        memoryAfter: {
          heapUsed: Math.round(afterGC.heapUsed / 1024 / 1024),
          heapTotal: Math.round(afterGC.heapTotal / 1024 / 1024)
        },
        freed: Math.round((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024),
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        error: 'Garbage collection not available',
        message: 'Node.js was not started with --expose-gc flag',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Garbage collection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Recent activities endpoint for debugging
 * GET /api/supervisor-logging/activities/recent
 */
router.get('/activities/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const supervisorId = req.query.supervisorId || null;

    const activities = await enhancedSupervisorActivityService.getRecentActivities(limit, supervisorId);

    res.json({
      success: true,
      activities,
      count: activities.length,
      limit,
      supervisorId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch recent activities:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;