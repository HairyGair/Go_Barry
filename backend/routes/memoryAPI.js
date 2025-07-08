// backend/routes/memoryAPI.js
// Memory monitoring and optimization API endpoints

import express from 'express';
import memoryMonitor from '../services/memoryMonitor.js';

const router = express.Router();

// Get current memory status
router.get('/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const memStatus = memoryMonitor.getMemoryStatus();
    
    res.json({
      success: true,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      limits: {
        totalLimit: 2048, // 2GB limit on Render
        warningThreshold: Math.round(2048 * 0.8),
        criticalThreshold: Math.round(2048 * 0.9)
      },
      status: memoryMonitor.isMemoryHealthy() ? 'healthy' : 'warning',
      lastCheck: memStatus?.timestamp || new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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

export default router;