// backend/routes/memoryAPI.js
// Enhanced memory monitoring and optimization API endpoints with throttling

import express from 'express';
import memoryMonitor from '../services/memoryMonitor.js';
import memoryGuard from '../middleware/memoryGuard.js';
import requestMemoryCleanup from '../middleware/requestMemoryCleanup.js';
import optimizedDb from '../services/optimizedDatabaseService.js';

const router = express.Router();

// Get comprehensive memory status with throttling and optimization info
router.get('/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Get component statistics
    const memoryGuardStats = memoryGuard.getStats();
    const cleanupStats = requestMemoryCleanup.getStats();
    const dbStats = optimizedDb.getStats();
    
    // Calculate memory efficiency metrics
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    
    const memoryUtilization = (rssMB / 2048) * 100; // 2GB limit
    const heapEfficiency = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Determine overall health status
    let healthStatus = 'healthy';
    let healthMessage = 'Memory usage within normal limits';
    
    if (rssMB >= 1800) {
      healthStatus = 'critical';
      healthMessage = 'Memory usage critical - approaching 2GB limit';
    } else if (rssMB >= 1600) {
      healthStatus = 'warning';
      healthMessage = 'Memory usage high - monitoring closely';
    } else if (rssMB >= 1400) {
      healthStatus = 'elevated';
      healthMessage = 'Memory usage elevated - optimization active';
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      health: {
        status: healthStatus,
        message: healthMessage,
        uptime: {
          seconds: Math.round(uptime),
          formatted: formatUptime(uptime)
        }
      },
      memory: {
        usage: {
          rss: `${rssMB}MB`,
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          external: `${externalMB}MB`
        },
        limits: {
          total: '2048MB',
          available: `${2048 - rssMB}MB`,
          utilization: `${memoryUtilization.toFixed(1)}%`
        },
        efficiency: {
          heapEfficiency: `${heapEfficiency.toFixed(1)}%`,
          fragmentation: heapTotalMB - heapUsedMB,
          gcRecommended: memoryUtilization > 70
        }
      },
      throttling: memoryGuardStats.throttling,
      cleanup: cleanupStats,
      database: dbStats,
      optimization: {
        status: 'active',
        features: [
          'Request-level memory cleanup',
          'Garbage collection optimization', 
          'Query result streaming',
          'Database query optimization',
          'Response compression',
          'Memory-based request throttling'
        ]
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Memory status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Trigger manual memory cleanup
router.post('/cleanup', (req, res) => {
  try {
    const { level = 'preventive' } = req.body;
    
    if (level === 'emergency') {
      memoryMonitor.performEmergencyCleanup();
    } else {
      memoryMonitor.performPreventiveCleanup();
    }
    
    // Get memory status after cleanup
    setTimeout(() => {
      const memUsage = process.memoryUsage();
      res.json({
        success: true,
        message: `${level} cleanup completed`,
        memoryAfterCleanup: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        }
      });
    }, 1000);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get memory statistics over time
router.get('/stats', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      stats: {
        currentMemory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        uptime: {
          seconds: Math.round(uptime),
          formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check specifically for memory
router.get('/health', (req, res) => {
  try {
    const isHealthy = memoryMonitor.isMemoryHealthy();
    const memUsage = process.memoryUsage();
    const usagePercentage = Math.round((memUsage.rss / (2 * 1024 * 1024 * 1024)) * 100);
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      health: isHealthy ? 'healthy' : 'warning',
      memory: {
        usage: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        percentage: `${usagePercentage}%`,
        limit: '2048MB'
      },
      recommendation: isHealthy ? 
        'Memory usage is within safe limits' : 
        'Memory usage is high - consider cleanup or optimization'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/memory/history - Get memory usage history
router.get('/history', (req, res) => {
  try {
    const { duration = 300 } = req.query; // Default 5 minutes
    
    const memoryGuardStats = memoryGuard.getStats();
    const recentMemory = memoryGuardStats.recentMemory || [];
    
    // Filter history based on duration
    const cutoffTime = Date.now() - (duration * 1000);
    const filteredHistory = recentMemory.filter(entry => {
      return new Date(entry.time).getTime() >= cutoffTime;
    });

    res.json({
      success: true,
      history: filteredHistory,
      metadata: {
        duration: `${duration}s`,
        dataPoints: filteredHistory.length,
        oldestEntry: filteredHistory.length > 0 ? filteredHistory[0].time : null,
        newestEntry: filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].time : null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Memory history endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/memory/gc - Force garbage collection (admin only)
router.post('/gc', async (req, res) => {
  try {
    // Check if garbage collection is available
    if (!global.gc) {
      return res.status(503).json({
        success: false,
        error: 'Garbage collection not available - Node.js must be started with --expose-gc'
      });
    }

    const beforeGC = process.memoryUsage();
    const beforeTime = Date.now();
    
    // Force garbage collection
    global.gc();
    
    const afterGC = process.memoryUsage();
    const gcTime = Date.now() - beforeTime;
    
    // Calculate memory freed
    const freedHeap = (beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024;
    const freedRSS = (beforeGC.rss - afterGC.rss) / 1024 / 1024;

    res.json({
      success: true,
      garbage_collection: {
        executed: true,
        duration: `${gcTime}ms`,
        memory_freed: {
          heap: `${freedHeap.toFixed(2)}MB`,
          rss: `${freedRSS.toFixed(2)}MB`
        },
        before: {
          heapUsed: `${Math.round(beforeGC.heapUsed / 1024 / 1024)}MB`,
          rss: `${Math.round(beforeGC.rss / 1024 / 1024)}MB`
        },
        after: {
          heapUsed: `${Math.round(afterGC.heapUsed / 1024 / 1024)}MB`,
          rss: `${Math.round(afterGC.rss / 1024 / 1024)}MB`
        }
      },
      timestamp: new Date().toISOString()
    });

    console.log(`🗑️ Manual GC executed: freed ${freedHeap.toFixed(2)}MB heap, ${freedRSS.toFixed(2)}MB RSS`);

  } catch (error) {
    console.error('❌ Manual GC error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/memory/throttle/status - Get request throttling status
router.get('/throttle/status', (req, res) => {
  try {
    const memoryGuardStats = memoryGuard.getStats();
    
    res.json({
      success: true,
      throttling: memoryGuardStats.throttling,
      recommendations: generateThrottleRecommendations(memoryGuardStats),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Throttle status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Generate throttling recommendations
 */
function generateThrottleRecommendations(stats) {
  const recommendations = [];
  
  if (stats.throttling.level >= 3) {
    recommendations.push('System under high memory pressure - consider scaling or optimizing queries');
  }
  
  if (stats.throttling.activeRequests >= stats.throttling.maxConcurrent * 0.8) {
    recommendations.push('High concurrent request load - consider request queuing');
  }
  
  const memoryUtilization = parseInt(stats.memory.utilization);
  if (memoryUtilization > 80) {
    recommendations.push('Memory utilization high - implement additional caching or data cleanup');
  }
  
  return recommendations;
}

export default router;