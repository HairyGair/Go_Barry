// Comprehensive Health Check System
// Monitors all aspects of system health

import os from 'os';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';
import ApiResponse from '../utils/ApiResponse.js';

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.thresholds = {
      memory: 0.85, // 85% memory usage warning
      disk: 0.90,    // 90% disk usage warning
      responseTime: 5000, // 5 second response time warning
      errorRate: 0.05 // 5% error rate warning
    };
  }

  // Register a health check
  register(name, checkFn, critical = false) {
    this.checks.set(name, {
      fn: checkFn,
      critical,
      lastCheck: null,
      lastResult: null
    });
  }

  // Check memory health
  async checkMemory() {
    const usage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const processLimit = 2048 * 1024 * 1024; // 2GB
    
    const percentUsed = usage.heapUsed / processLimit;
    const systemPercentUsed = (totalMemory - freeMemory) / totalMemory;
    
    return {
      healthy: percentUsed < this.thresholds.memory,
      status: percentUsed < 0.7 ? 'healthy' : percentUsed < this.thresholds.memory ? 'warning' : 'critical',
      details: {
        process: {
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
          external: Math.round(usage.external / 1024 / 1024),
          percentUsed: (percentUsed * 100).toFixed(2) + '%'
        },
        system: {
          total: Math.round(totalMemory / 1024 / 1024),
          free: Math.round(freeMemory / 1024 / 1024),
          percentUsed: (systemPercentUsed * 100).toFixed(2) + '%'
        }
      }
    };
  }

  // Check database health
  async checkDatabase() {
    try {
      if (!global.supabaseClient) {
        return {
          healthy: false,
          status: 'unavailable',
          details: { error: 'Supabase client not initialized' }
        };
      }

      const start = performance.now();
      
      // Try a simple query
      const { data, error } = await global.supabaseClient
        .from('supervisor_sessions')
        .select('count')
        .limit(1);
      
      const responseTime = performance.now() - start;
      
      if (error) {
        return {
          healthy: false,
          status: 'error',
          details: { error: error.message, responseTime }
        };
      }
      
      return {
        healthy: true,
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        details: { 
          responseTime: Math.round(responseTime),
          connected: true
        }
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: { error: error.message }
      };
    }
  }

  // Check Redis health
  async checkRedis() {
    try {
      if (!global.redisClient || !global.redisClient.isReady) {
        return {
          healthy: false,
          status: 'disconnected',
          details: { connected: false }
        };
      }

      const start = performance.now();
      await global.redisClient.ping();
      const responseTime = performance.now() - start;
      
      return {
        healthy: true,
        status: responseTime < 100 ? 'healthy' : 'degraded',
        details: {
          connected: true,
          responseTime: Math.round(responseTime)
        }
      };
    } catch (error) {
      return {
        healthy: false,
        status: 'error',
        details: { error: error.message }
      };
    }
  }

  // Check disk space
  async checkDiskSpace() {
    try {
      const stats = await fs.statfs('/');
      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedPercent = (totalSpace - freeSpace) / totalSpace;
      
      return {
        healthy: usedPercent < this.thresholds.disk,
        status: usedPercent < 0.7 ? 'healthy' : usedPercent < this.thresholds.disk ? 'warning' : 'critical',
        details: {
          total: Math.round(totalSpace / (1024 * 1024 * 1024)),
          free: Math.round(freeSpace / (1024 * 1024 * 1024)),
          used: Math.round((totalSpace - freeSpace) / (1024 * 1024 * 1024)),
          percentUsed: (usedPercent * 100).toFixed(2) + '%'
        }
      };
    } catch (error) {
      return {
        healthy: true, // Don't fail health check if we can't check disk
        status: 'unknown',
        details: { error: error.message }
      };
    }
  }

  // Check circuit breakers
  async checkCircuitBreakers() {
    try {
      const { circuitBreakers } = await import('./circuitBreakerLite.js');
      const breakers = ['tomtom', 'streetManager', 'nationalHighways', 'weather'];
      const statuses = {};
      let allHealthy = true;
      
      for (const name of breakers) {
        const breaker = circuitBreakers[name];
        if (breaker) {
          const status = breaker.getStatus();
          statuses[name] = status;
          if (status.state === 'OPEN') {
            allHealthy = false;
          }
        }
      }
      
      return {
        healthy: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        details: statuses
      };
    } catch (error) {
      return {
        healthy: true,
        status: 'unknown',
        details: { error: error.message }
      };
    }
  }

  // Check external services
  async checkExternalServices() {
    const services = {
      tomtom: process.env.TOMTOM_API_KEY ? 'configured' : 'not configured',
      streetManager: 'active',
      nationalHighways: 'active'
    };
    
    return {
      healthy: true,
      status: 'healthy',
      details: services
    };
  }

  // Run all health checks
  async runAllChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    // Run built-in checks
    const builtInChecks = [
      ['memory', () => this.checkMemory()],
      ['database', () => this.checkDatabase()],
      ['redis', () => this.checkRedis()],
      ['disk', () => this.checkDiskSpace()],
      ['circuitBreakers', () => this.checkCircuitBreakers()],
      ['externalServices', () => this.checkExternalServices()]
    ];

    for (const [name, checkFn] of builtInChecks) {
      try {
        results.checks[name] = await checkFn();
      } catch (error) {
        results.checks[name] = {
          healthy: false,
          status: 'error',
          details: { error: error.message }
        };
      }
    }

    // Run registered checks
    for (const [name, check] of this.checks) {
      try {
        const result = await check.fn();
        results.checks[name] = result;
        check.lastCheck = new Date();
        check.lastResult = result;
      } catch (error) {
        results.checks[name] = {
          healthy: false,
          status: 'error',
          details: { error: error.message }
        };
      }
    }

    // Determine overall status
    const criticalFailed = Object.entries(results.checks).some(
      ([name, result]) => {
        const check = this.checks.get(name);
        return !result.healthy && check?.critical;
      }
    );

    const anyFailed = Object.values(results.checks).some(c => !c.healthy);
    const anyDegraded = Object.values(results.checks).some(c => c.status === 'degraded');

    if (criticalFailed) {
      results.status = 'critical';
    } else if (anyFailed) {
      results.status = 'unhealthy';
    } else if (anyDegraded) {
      results.status = 'degraded';
    }

    results.uptime = process.uptime();
    results.uptimeHuman = this.formatUptime(process.uptime());

    return results;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ') || '< 1m';
  }

  // Express route handler
  async handleHealthCheck(req, res) {
    const detailed = req.query.detailed === 'true';
    const results = await this.runAllChecks();
    
    const statusCode = 
      results.status === 'critical' ? 503 :
      results.status === 'unhealthy' ? 503 :
      results.status === 'degraded' ? 200 :
      200;
    
    if (!detailed) {
      // Simple health check
      res.status(statusCode).json({
        status: results.status,
        timestamp: results.timestamp
      });
    } else {
      // Detailed health check
      res.status(statusCode).json(results);
    }
  }

  // Liveness probe (is the service running?)
  async handleLiveness(req, res) {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  }

  // Readiness probe (is the service ready to accept traffic?)
  async handleReadiness(req, res) {
    const memory = await this.checkMemory();
    const database = await this.checkDatabase();
    
    const ready = memory.healthy && database.healthy;
    
    res.status(ready ? 200 : 503).json({
      ready,
      timestamp: new Date().toISOString(),
      checks: { memory, database }
    });
  }
}

// Singleton instance
const healthCheckService = new HealthCheckService();
export default healthCheckService;
