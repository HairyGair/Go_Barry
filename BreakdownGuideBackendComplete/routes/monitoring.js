// System Monitoring Dashboard API
// Provides comprehensive system metrics in one endpoint

import express from 'express';
import ApiResponse from '../utils/ApiResponse.js';
import healthCheckService from '../services/healthCheckService.js';
import cacheManager from '../services/cacheManager.js';
import requestPoolManager from '../services/requestPoolManager.js';
import { cleanupQueue, emailQueue, notificationQueue } from '../services/jobQueue.js';

const router = express.Router();

// Main dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    // Gather all metrics
    const [health, cache, pools, queues, performance] = await Promise.all([
      healthCheckService.runAllChecks(),
      cacheManager.getStats(),
      requestPoolManager.getMetrics(),
      getQueueStats(),
      getPerformanceMetrics()
    ]);

    const dashboard = {
      timestamp: new Date().toISOString(),
      status: health.status,
      uptime: process.uptime(),
      uptimeHuman: formatUptime(process.uptime()),
      
      health: {
        overall: health.status,
        checks: health.checks,
        uptime: health.uptimeHuman
      },
      
      cache: {
        ...cache,
        effectiveness: cache.hitRate
      },
      
      requestPools: pools,
      
      jobQueues: queues,
      
      performance: performance,
      
      system: {
        node: process.version,
        platform: process.platform,
        pid: process.pid,
        memoryUsage: {
          rss: formatBytes(process.memoryUsage().rss),
          heap: formatBytes(process.memoryUsage().heapUsed),
          external: formatBytes(process.memoryUsage().external)
        },
        cpuUsage: process.cpuUsage()
      },
      
      alerts: getSystemAlerts(health, cache, pools, queues)
    };

    res.json(ApiResponse.success(dashboard));
  } catch (error) {
    res.status(500).json(
      ApiResponse.error('Failed to generate dashboard', 500, error.message)
    );
  }
});

// Individual metric endpoints
router.get('/metrics/cache', async (req, res) => {
  const stats = cacheManager.getStats();
  res.json(ApiResponse.success(stats));
});

router.get('/metrics/pools', async (req, res) => {
  const metrics = requestPoolManager.getMetrics();
  res.json(ApiResponse.success(metrics));
});

router.get('/metrics/queues', async (req, res) => {
  const stats = await getQueueStats();
  res.json(ApiResponse.success(stats));
});

router.get('/metrics/performance', async (req, res) => {
  const metrics = await getPerformanceMetrics();
  res.json(ApiResponse.success(metrics));
});

// Circuit breaker metrics
router.get('/metrics/circuit-breakers', async (req, res) => {
  try {
    const { circuitBreakers } = await import('../services/circuitBreakerLite.js');
    const metrics = {};
    
    for (const [name, breaker] of Object.entries(circuitBreakers)) {
      if (breaker && typeof breaker.getStatus === 'function') {
        metrics[name] = breaker.getStatus();
      }
    }
    
    res.json(ApiResponse.success(metrics));
  } catch (error) {
    res.status(500).json(
      ApiResponse.error('Failed to get circuit breaker metrics', 500)
    );
  }
});

// Error rate tracking
let requestCount = 0;
let errorCount = 0;
let requestTimes = [];

router.use((req, res, next) => {
  requestCount++;
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    requestTimes.push(duration);
    
    // Keep only last 100 request times
    if (requestTimes.length > 100) {
      requestTimes.shift();
    }
    
    if (res.statusCode >= 400) {
      errorCount++;
    }
  });
  
  next();
});

// Helper functions
function getQueueStats() {
  return {
    cleanup: cleanupQueue.getStats(),
    email: emailQueue.getStats(),
    notification: notificationQueue.getStats()
  };
}

function getPerformanceMetrics() {
  const avgResponseTime = requestTimes.length > 0
    ? Math.round(requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length)
    : 0;
    
  const p95ResponseTime = requestTimes.length > 0
    ? requestTimes.sort((a, b) => a - b)[Math.floor(requestTimes.length * 0.95)]
    : 0;
    
  return {
    requestCount,
    errorCount,
    errorRate: requestCount > 0 
      ? ((errorCount / requestCount) * 100).toFixed(2) + '%'
      : '0%',
    avgResponseTime: avgResponseTime + 'ms',
    p95ResponseTime: p95ResponseTime + 'ms',
    requestsPerSecond: (requestCount / process.uptime()).toFixed(2)
  };
}

function getSystemAlerts(health, cache, pools, queues) {
  const alerts = [];
  
  // Health alerts
  if (health.status === 'critical') {
    alerts.push({
      level: 'critical',
      message: 'System health is critical',
      details: Object.entries(health.checks)
        .filter(([_, check]) => !check.healthy)
        .map(([name]) => name)
    });
  }
  
  // Memory alerts
  const memCheck = health.checks.memory;
  if (memCheck && memCheck.status === 'warning') {
    alerts.push({
      level: 'warning',
      message: `Memory usage is high: ${memCheck.details.process.percentUsed}`
    });
  }
  
  // Cache effectiveness
  if (cache.hitRate && parseFloat(cache.hitRate) < 50) {
    alerts.push({
      level: 'info',
      message: `Cache hit rate is low: ${cache.hitRate}`
    });
  }
  
  // Queue backlog
  Object.entries(queues).forEach(([name, stats]) => {
    if (stats.pending > 100) {
      alerts.push({
        level: 'warning',
        message: `${name} queue has ${stats.pending} pending jobs`
      });
    }
  });
  
  return alerts;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default router;
