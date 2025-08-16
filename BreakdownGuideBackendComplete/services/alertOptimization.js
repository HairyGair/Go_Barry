// Memory-efficient alert processing for Go BARRY backend

export class AlertOptimization {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxConcurrent = 5;
  }

  // Process alerts in batches to avoid memory spikes
  async processAlertsInBatches(alerts, batchSize = 50) {
    console.log(`🔄 Processing ${alerts.length} alerts in batches of ${batchSize}`);
    const results = [];
    
    for (let i = 0; i < alerts.length; i += batchSize) {
      const batch = alerts.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      
      // Allow garbage collection between batches
      if (global.gc && i % 200 === 0) {
        global.gc();
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`✅ Processed ${results.length} alerts successfully`);
    return results;
  }

  // Process a single batch
  async processBatch(batch) {
    return Promise.all(
      batch.map(alert => this.optimizeAlert(alert))
    );
  }

  // Optimize a single alert (remove unnecessary data)
  optimizeAlert(alert) {
    // Keep only essential fields
    const optimized = {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      description: alert.description || alert.title,
      location: {
        lat: alert.location?.lat || alert.latitude,
        lng: alert.location?.lng || alert.longitude,
        road: alert.location?.road || alert.road
      },
      startTime: alert.startTime || alert.start_time,
      endTime: alert.endTime || alert.end_time,
      source: alert.source,
      impactScore: alert.impactScore || alert.impact_score,
      matchedRoutes: alert.matchedRoutes?.slice(0, 5) // Limit to top 5 routes
    };

    // Remove null/undefined values
    Object.keys(optimized).forEach(key => {
      if (optimized[key] === null || optimized[key] === undefined) {
        delete optimized[key];
      }
    });

    return optimized;
  }

  // Cache management
  createCache(ttlMinutes = 5) {
    const cache = new Map();
    const ttl = ttlMinutes * 60 * 1000;

    return {
      get: (key) => {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > ttl) {
          cache.delete(key);
          return null;
        }
        
        return item.data;
      },
      
      set: (key, data) => {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        
        // Limit cache size
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      },
      
      clear: () => cache.clear(),
      
      size: () => cache.size
    };
  }

  // Memory monitoring
  getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024),
      percentage: Math.round((used.heapUsed / used.heapTotal) * 100)
    };
  }

  // Check if we're approaching memory limits
  isMemoryPressure() {
    const usage = this.getMemoryUsage();
    // Render.com has 2GB limit, trigger at 1.5GB
    return usage.rss > 1536; 
  }

  // Cleanup old data
  async cleanup(alerts) {
    if (this.isMemoryPressure()) {
      console.log('⚠️ Memory pressure detected, cleaning up...');
      
      // Sort by importance and keep only top alerts
      const sorted = alerts.sort((a, b) => 
        (b.severity || 0) - (a.severity || 0)
      );
      
      return sorted.slice(0, 1000); // Keep top 1000 alerts
    }
    
    return alerts;
  }

  // Rate limiting
  createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return (key) => {
      const now = Date.now();
      const userRequests = requests.get(key) || [];
      
      // Remove old requests
      const validRequests = userRequests.filter(
        time => now - time < windowMs
      );
      
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      
      // Cleanup old entries
      if (requests.size > 1000) {
        const oldestKey = requests.keys().next().value;
        requests.delete(oldestKey);
      }
      
      return true;
    };
  }

  // Deduplication with hash
  deduplicateAlerts(alerts) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const alert of alerts) {
      const hash = this.generateAlertHash(alert);
      
      if (!seen.has(hash)) {
        seen.set(hash, true);
        deduplicated.push(alert);
      }
    }
    
    console.log(`📊 Deduplication: ${alerts.length} → ${deduplicated.length} alerts`);
    return deduplicated;
  }

  // Generate consistent hash for an alert
  generateAlertHash(alert) {
    const key = `${alert.type}-${alert.location?.lat}-${alert.location?.lng}-${alert.description}`;
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  // Performance metrics
  startMetrics() {
    return {
      startTime: Date.now(),
      startMemory: this.getMemoryUsage()
    };
  }

  endMetrics(metrics, operation) {
    const duration = Date.now() - metrics.startTime;
    const endMemory = this.getMemoryUsage();
    const memoryDelta = endMemory.heapUsed - metrics.startMemory.heapUsed;
    
    console.log(`⏱️ ${operation}: ${duration}ms, Memory Δ: ${memoryDelta}MB`);
    
    return {
      duration,
      memoryDelta,
      endMemory
    };
  }
}

// Singleton instance
export const alertOptimization = new AlertOptimization();

// Middleware for Express routes
export const optimizationMiddleware = (req, res, next) => {
  // Add performance headers
  res.set({
    'X-Response-Time': Date.now(),
    'Cache-Control': 'public, max-age=300', // 5 min cache
  });
  
  // Log memory on each request in development
  if (process.env.NODE_ENV !== 'production') {
    const memory = alertOptimization.getMemoryUsage();
    console.log(`💾 Memory: ${memory.rss}MB RSS, ${memory.percentage}% heap`);
  }
  
  next();
};

export default alertOptimization;
