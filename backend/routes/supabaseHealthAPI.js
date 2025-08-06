// backend/routes/supabaseHealthAPI.js
// API endpoints for monitoring Supabase connection health and statistics

import express from 'express';
import { getConnectionHealth, getConnectionStats, testSupabaseConnection } from '../services/supabaseHelper.js';
import supabaseService from '../services/supabaseService.js';

const router = express.Router();

/**
 * GET /api/supabase-health/status
 * Get comprehensive Supabase connection status
 */
router.get('/status', async (req, res) => {
  try {
    const health = await getConnectionHealth();
    const stats = await getConnectionStats();
    
    const status = {
      health,
      stats,
      timestamp: new Date().toISOString()
    };

    const statusCode = health.connectionManager?.status === 'healthy' ? 200 : 
                      health.connectionManager?.status === 'unhealthy' ? 503 : 207;

    res.status(statusCode).json({
      success: true,
      status,
      recommendations: generateRecommendations(health, stats)
    });

  } catch (error) {
    console.error('❌ Supabase health status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/supabase-health/test
 * Test Supabase connection with diagnostics
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const testResult = await testSupabaseConnection();
    
    res.json({
      success: testResult.success,
      test: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/supabase-health/stats
 * Get detailed connection statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getConnectionStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Supabase stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/supabase-health/reset-pool
 * Emergency connection pool reset (admin only)
 */
router.post('/reset-pool', async (req, res) => {
  try {
    console.log('🔄 Connection pool reset requested');
    
    // Only allow if enhanced mode is active
    if (supabaseService.isInitialized) {
      await supabaseService.connectionManager.resetConnectionPool();
      
      res.json({
        success: true,
        message: 'Connection pool reset completed',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Enhanced connection manager not active'
      });
    }

  } catch (error) {
    console.error('❌ Connection pool reset error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/supabase-health/pool-stats
 * Get detailed connection pool statistics
 */
router.get('/pool-stats', async (req, res) => {
  try {
    if (supabaseService.isInitialized) {
      const poolStats = supabaseService.connectionManager.getStats();
      
      res.json({
        success: true,
        poolStats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        poolStats: {
          mode: 'basic-client',
          message: 'Connection pooling not active'
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Pool stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/supabase-health/health-check
 * Force immediate health check
 */
router.post('/health-check', async (req, res) => {
  try {
    console.log('💗 Manual health check requested');
    
    if (supabaseService.isInitialized) {
      await supabaseService.connectionManager.performHealthCheck();
      const health = supabaseService.connectionManager.getHealth();
      
      res.json({
        success: true,
        message: 'Health check completed',
        health,
        timestamp: new Date().toISOString()
      });
    } else {
      // Basic health check
      const testResult = await testSupabaseConnection();
      
      res.json({
        success: true,
        message: 'Basic health check completed',
        health: {
          status: testResult.success ? 'healthy' : 'unhealthy',
          mode: 'basic',
          details: testResult
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/supabase-health/connection-info
 * Get connection configuration information
 */
router.get('/connection-info', (req, res) => {
  try {
    const info = {
      enhanced: supabaseService.isInitialized,
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      anonKey: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
      serviceKey: (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'configured' : 'missing',
      connectionPooling: supabaseService.isInitialized ? 'enabled' : 'disabled',
      retryMechanism: supabaseService.isInitialized ? 'enabled' : 'disabled',
      healthMonitoring: supabaseService.isInitialized ? 'enabled' : 'disabled'
    };

    res.json({
      success: true,
      info,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Connection info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate recommendations based on health and stats
 */
function generateRecommendations(health, stats) {
  const recommendations = [];

  if (!health.connectionManager || health.connectionManager.status !== 'healthy') {
    recommendations.push('CRITICAL: Supabase connection unhealthy - check network and credentials');
  }

  if (!stats.service?.initialized) {
    recommendations.push('WARNING: Enhanced connection manager not initialized - limited reliability');
  }

  if (stats.connectionManager?.pool?.active > (stats.connectionManager?.pool?.maxConcurrent * 0.8)) {
    recommendations.push('HIGH LOAD: Connection pool utilization above 80% - consider scaling');
  }

  if (stats.connectionManager?.pool?.stats?.errors > 10) {
    recommendations.push('ERRORS: High error count detected - investigate connection issues');
  }

  if (health.connectionManager?.details?.consecutiveFailures > 2) {
    recommendations.push('INSTABILITY: Multiple consecutive health check failures detected');
  }

  if (recommendations.length === 0) {
    recommendations.push('HEALTHY: All Supabase connection systems operating normally');
  }

  return recommendations;
}

export default router;
