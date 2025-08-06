// backend/services/redisCache.js
// Redis caching layer for Go BARRY memory optimization

class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.redisAvailable = false;
    this.fallbackCache = new Map(); // In-memory fallback
    this.maxFallbackSize = 100;
  }

  async initialize() {
    try {
      // Try to import Redis dynamically
      let createClient;
      try {
        const redisModule = await import('redis');
        createClient = redisModule.createClient;
        this.redisAvailable = true;
        console.log('✅ Redis package found');
      } catch (importError) {
        console.warn('⚠️ Redis package not installed - using memory-only cache');
        console.warn('   To enable Redis caching: npm install redis');
        this.redisAvailable = false;
        return;
      }

      // Use Redis if available (production), fallback to memory cache
      const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
      
      if (redisUrl) {
        console.log('🔴 Initializing Redis cache...');
        this.client = createClient({ url: redisUrl });
        
        this.client.on('error', (err) => {
          console.warn('⚠️ Redis error, falling back to memory cache:', err.message);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.log('💾 Using memory cache (Redis URL not configured)');
      }
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, using memory cache:', error.message);
      this.isConnected = false;
      this.redisAvailable = false;
    }
  }

  // Get from cache
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      }
      
      // Fallback to memory cache
      return this.fallbackCache.get(key) || null;
    } catch (error) {
      console.warn(`⚠️ Cache get failed for key ${key}:`, error.message);
      return this.fallbackCache.get(key) || null;
    }
  }

  // Set in cache
  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
        return true;
      }
      
      // Fallback to memory cache with TTL
      this.manageFallbackCache();
      this.fallbackCache.set(key, value);
      
      // Auto-expire in memory
      setTimeout(() => {
        this.fallbackCache.delete(key);
      }, ttlSeconds * 1000);
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache set failed for key ${key}:`, error.message);
      // Always try fallback cache as last resort
      this.manageFallbackCache();
      this.fallbackCache.set(key, value);
      setTimeout(() => this.fallbackCache.delete(key), ttlSeconds * 1000);
      return false;
    }
  }

  // Delete from cache
  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
      this.fallbackCache.delete(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ Cache delete failed for key ${key}:`, error.message);
      this.fallbackCache.delete(key);
      return false;
    }
  }

  // Cache middleware for Express routes
  middleware(defaultTTL = 300) {
    return async (req, res, next) => {
      // Skip caching for POST/PUT/DELETE
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);
      
      try {
        const cachedData = await this.get(cacheKey);
        if (cachedData) {
          console.log(`🎯 Cache HIT: ${cacheKey}`);
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Mode', this.getCacheMode());
          return res.json(cachedData);
        }

        console.log(`💥 Cache MISS: ${cacheKey}`);
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Mode', this.getCacheMode());

        // Intercept response to cache result
        const originalJson = res.json;
        res.json = (data) => {
          // Cache successful responses only
          if (res.statusCode === 200) {
            this.set(cacheKey, data, defaultTTL).catch(err => {
              console.warn('⚠️ Failed to cache response:', err.message);
            });
          }
          return originalJson.call(res, data);
        };

        next();
      } catch (error) {
        console.warn('⚠️ Cache middleware error:', error.message);
        res.set('X-Cache', 'ERROR');
        next();
      }
    };
  }

  // Generate cache key from request
  generateCacheKey(req) {
    const params = new URLSearchParams(req.query).toString();
    return `barry:${req.path}:${params}`;
  }

  // Get current cache mode
  getCacheMode() {
    if (!this.redisAvailable) return 'memory-only';
    if (this.isConnected) return 'redis';
    return 'memory-fallback';
  }

  // Manage fallback cache size
  manageFallbackCache() {
    if (this.fallbackCache.size >= this.maxFallbackSize) {
      // Remove oldest entries (FIFO)
      const firstKey = this.fallbackCache.keys().next().value;
      this.fallbackCache.delete(firstKey);
    }
  }

  // Get cache stats
  getStats() {
    return {
      redisAvailable: this.redisAvailable,
      redisConnected: this.isConnected,
      fallbackCacheSize: this.fallbackCache.size,
      maxFallbackSize: this.maxFallbackSize,
      mode: this.getCacheMode(),
      timestamp: new Date().toISOString()
    };
  }

  // Clear all cache
  async clearAll() {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushAll();
      }
      this.fallbackCache.clear();
      console.log('🧹 Cache cleared');
      return true;
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error.message);
      this.fallbackCache.clear();
      return false;
    }
  }

  // Test cache functionality
  async test() {
    const testKey = 'test:cache:' + Date.now();
    const testValue = { test: true, timestamp: Date.now() };
    
    try {
      // Test set
      await this.set(testKey, testValue, 60);
      
      // Test get
      const retrieved = await this.get(testKey);
      const success = retrieved && retrieved.test === true;
      
      // Cleanup
      await this.del(testKey);
      
      return {
        success,
        mode: this.getCacheMode(),
        redisAvailable: this.redisAvailable,
        redisConnected: this.isConnected
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        mode: this.getCacheMode()
      };
    }
  }
}

// Singleton instance
const redisCache = new RedisCacheService();

export default redisCache;
