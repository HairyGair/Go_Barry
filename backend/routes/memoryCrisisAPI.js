// backend/routes/memoryCrisisAPI.js
// API endpoints for monitoring and managing memory crisis solutions

import express from 'express';
import redisCache from '../services/redisCache.js';
import requestQueue from '../services/requestQueue.js';
import StreamingResponseService from '../services/streamingResponse.js';

const router = express.Router();

/**
 * GET /api/memory-crisis/status
 * Get comprehensive status of all memory crisis systems
 */
router.get('/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const utilization = (rssMB / 2048) * 100;

    const status = {
      system: {
        memoryUsage: {
          rss: rssMB + 'MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
          utilization: utilization.toFixed(1) + '%'
        },
        status: utilization >= 90 ? 'critical' : 
                utilization >= 80 ? 'warning' : 
                utilization >= 70 ? 'elevated' : 'healthy'
      },
      redisCache: redisCache.getStats(),
      requestQueue: requestQueue.getStats(),
      streaming: {
        available: true,
        middleware: 'active'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status,
      recommendations: generateRecommendations(utilization, status)
    });

  } catch (error) {
    console.error('❌ Memory crisis status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/memory-crisis/health
 * Quick health check for memory crisis systems
 */
router.get('/health', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const utilization = (memUsage.rss / (2048 * 1024 * 1024)) * 100;
    
    const health = {
      status: utilization >= 90 ? 'critical' : 
              utilization >= 80 ? 'warning' : 'healthy',
      memoryUtilization: utilization.toFixed(1) + '%',
      cacheHealth: redisCache.getStats(),
      queueHealth: requestQueue.getHealth(),
      timestamp: new Date().toISOString()
    };

    const statusCode = health.status === 'critical' ? 503 : 
                      health.status === 'warning' ? 207 : 200;

    res.status(statusCode).json({
      success: true,
      health
    });

  } catch (error) {
    console.error('❌ Memory crisis health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/memory-crisis/clear-cache
 * Emergency cache clearing
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('🧹 Emergency cache clear requested');
    
    const results = {
      redisCache: await redisCache.clearAll(),
      timestamp: new Date().toISOString()
    };

    // Force garbage collection
    if (global.gc) {
      global.gc();
      results.garbageCollection = 'triggered';
    }

    res.json({
      success: true,
      message: 'Emergency cache clear completed',
      results
    });

  } catch (error) {
    console.error('❌ Emergency cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/memory-crisis/clear-queues
 * Emergency queue clearing
 */
router.post('/clear-queues', (req, res) => {
  try {
    console.log('🚨 Emergency queue clear requested');
    
    requestQueue.clearAllQueues();

    res.json({
      success: true,
      message: 'Emergency queue clear completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Emergency queue clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/memory-crisis/test-cache
 * Test cache functionality
 */
router.post('/test-cache', async (req, res) => {
  try {
    console.log('🧪 Testing cache functionality...');
    
    const testResult = await redisCache.test();
    
    res.json({
      success: true,
      message: 'Cache test completed',
      testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cache test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/memory-crisis/stats
 * Detailed statistics for monitoring
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      cache: redisCache.getStats(),
      queues: requestQueue.getStats(),
      memory: {
        usage: process.memoryUsage(),
        uptime: Math.round(process.uptime()),
        platform: process.platform,
        nodeVersion: process.version
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Memory crisis stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate recommendations based on current system status
 */
function generateRecommendations(utilization, status) {
  const recommendations = [];

  if (utilization >= 90) {
    recommendations.push('CRITICAL: Consider emergency cache clearing and request queue reset');
    recommendations.push('Scale up server or implement aggressive data pagination');
  } else if (utilization >= 80) {
    recommendations.push('WARNING: Monitor memory usage closely');
    recommendations.push('Consider enabling streaming responses for large datasets');
  } else if (utilization >= 70) {
    recommendations.push('ELEVATED: Proactive memory optimization recommended');
  } else {
    recommendations.push('HEALTHY: All systems operating normally');
  }

  if (!status.redisCache.redisAvailable) {
    recommendations.push('Install Redis package for enhanced caching: npm install redis');
  } else if (!status.redisCache.redisConnected && status.redisCache.fallbackCacheSize > 50) {
    recommendations.push('Consider configuring Redis URL for better caching performance');
  }

  if (status.requestQueue.totalQueued > 5) {
    recommendations.push('High queue load detected - consider scaling resources');
  }

  return recommendations;
}

export default router;
