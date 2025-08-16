// Enhanced Cache Manager
// Implements multi-layer caching with Redis and memory

import NodeCache from 'node-cache';
import crypto from 'crypto';

class CacheManager {
  constructor() {
    // In-memory cache for ultra-fast access
    this.memoryCache = new NodeCache({
      stdTTL: 60,
      checkperiod: 120,
      maxKeys: 1000
    });
    
    this.redisClient = null;
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      redisHits: 0
    };
  }

  async initialize(redisClient) {
    this.redisClient = redisClient;
    console.log('✅ Cache manager initialized with Redis support');
  }

  // Generate cache key from request parameters
  generateKey(prefix, params) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 8);
    return `${prefix}:${hash}`;
  }

  // Multi-layer get with fallback
  async get(key) {
    // Try memory cache first
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== undefined) {
      this.stats.hits++;
      this.stats.memoryHits++;
      return { value: memoryValue, source: 'memory' };
    }

    // Try Redis if available
    if (this.redisClient && this.redisClient.isReady) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          this.stats.hits++;
          this.stats.redisHits++;
          const parsed = JSON.parse(redisValue);
          
          // Populate memory cache for next access
          this.memoryCache.set(key, parsed, 60);
          
          return { value: parsed, source: 'redis' };
        }
      } catch (error) {
        console.warn(`Redis get error for ${key}:`, error.message);
      }
    }

    this.stats.misses++;
    return null;
  }

  // Multi-layer set
  async set(key, value, ttl = 300) {
    // Always set in memory cache
    this.memoryCache.set(key, value, Math.min(ttl, 300));

    // Set in Redis if available
    if (this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.warn(`Redis set error for ${key}:`, error.message);
      }
    }

    return true;
  }

  // Delete from all layers
  async delete(key) {
    this.memoryCache.del(key);
    
    if (this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.warn(`Redis delete error for ${key}:`, error.message);
      }
    }
  }

  // Clear all caches
  async flush() {
    this.memoryCache.flushAll();
    
    if (this.redisClient && this.redisClient.isReady) {
      try {
        await this.redisClient.flushdb();
      } catch (error) {
        console.warn('Redis flush error:', error.message);
      }
    }
  }

  // Cache middleware for Express routes
  middleware(keyPrefix, ttl = 300) {
    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Generate cache key from request
      const cacheKey = this.generateKey(keyPrefix, {
        path: req.path,
        query: req.query
      });

      // Try to get from cache
      const cached = await this.get(cacheKey);
      if (cached) {
        res.set('X-Cache', `HIT from ${cached.source}`);
        return res.json(cached.value);
      }

      // Cache miss - modify res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        res.set('X-Cache', 'MISS');
        
        // Only cache successful responses
        if (res.statusCode === 200 && body.success !== false) {
          this.set(cacheKey, body, ttl).catch(err => {
            console.warn('Cache set error:', err);
          });
        }
        
        return originalJson(body);
      };

      next();
    };
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.stats.hits > 0 
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memoryKeys: this.memoryCache.keys().length,
      redisConnected: this.redisClient?.isReady || false
    };
  }

  // Cache warming for critical data
  async warmCache() {
    console.log('🔥 Warming cache...');
    
    // Add your cache warming logic here
    // Example: Pre-cache common routes, supervisor data, etc.
    
    console.log('✅ Cache warming complete');
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Preset cache strategies
export const CacheStrategies = {
  NONE: { ttl: 0 },
  SHORT: { ttl: 60 },        // 1 minute
  MEDIUM: { ttl: 300 },       // 5 minutes
  LONG: { ttl: 3600 },        // 1 hour
  DAILY: { ttl: 86400 },      // 24 hours
  WEEKLY: { ttl: 604800 }     // 7 days
};

export default cacheManager;
