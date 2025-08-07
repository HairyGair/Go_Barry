// Request Pool Management
// Prevents memory spikes by limiting concurrent heavy requests

class Semaphore {
  constructor(max) {
    this.max = max;
    this.count = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.count < this.max) {
      this.count++;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release() {
    this.count--;
    
    if (this.queue.length > 0) {
      this.count++;
      const resolve = this.queue.shift();
      resolve();
    }
  }

  getStatus() {
    return {
      active: this.count,
      queued: this.queue.length,
      max: this.max
    };
  }
}

class RequestPoolManager {
  constructor() {
    this.pools = new Map();
    this.metrics = new Map();
  }

  createPool(name, maxConcurrent) {
    const pool = new Semaphore(maxConcurrent);
    this.pools.set(name, pool);
    this.metrics.set(name, {
      total: 0,
      completed: 0,
      failed: 0,
      totalTime: 0
    });
    return pool;
  }

  getPool(name) {
    return this.pools.get(name);
  }

  async execute(poolName, fn) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const startTime = Date.now();
    const metric = this.metrics.get(poolName);
    metric.total++;

    await pool.acquire();
    
    try {
      const result = await fn();
      metric.completed++;
      metric.totalTime += Date.now() - startTime;
      return result;
    } catch (error) {
      metric.failed++;
      throw error;
    } finally {
      pool.release();
    }
  }

  // Express middleware factory
  middleware(poolName, maxConcurrent = 3) {
    if (!this.pools.has(poolName)) {
      this.createPool(poolName, maxConcurrent);
    }

    return async (req, res, next) => {
      const pool = this.pools.get(poolName);
      
      // Add pool status to request
      req.poolStatus = pool.getStatus();
      
      await pool.acquire();
      
      // Release on response finish
      res.on('finish', () => {
        pool.release();
      });
      
      // Also release on error
      res.on('error', () => {
        pool.release();
      });
      
      next();
    };
  }

  getMetrics() {
    const result = {};
    
    for (const [name, metric] of this.metrics) {
      const pool = this.pools.get(name);
      result[name] = {
        ...metric,
        avgTime: metric.completed > 0 ? Math.round(metric.totalTime / metric.completed) : 0,
        successRate: metric.total > 0 ? (metric.completed / metric.total * 100).toFixed(2) + '%' : '0%',
        current: pool.getStatus()
      };
    }
    
    return result;
  }

  reset(poolName) {
    if (this.metrics.has(poolName)) {
      this.metrics.set(poolName, {
        total: 0,
        completed: 0,
        failed: 0,
        totalTime: 0
      });
    }
  }
}

// Create singleton instance
const requestPoolManager = new RequestPoolManager();

// Create default pools
requestPoolManager.createPool('heavy', 3);
requestPoolManager.createPool('roadworks', 2);
requestPoolManager.createPool('alerts', 5);
requestPoolManager.createPool('gtfs', 2);

export default requestPoolManager;
export { Semaphore };
