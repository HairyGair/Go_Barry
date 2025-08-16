// backend/middleware/compressionAndCaching.js
// Response compression and intelligent caching for memory optimization

import { createGzip, createDeflate } from 'zlib';
import { createHash } from 'crypto';

/**
 * Intelligent Compression and Caching System
 * Optimizes responses while maintaining memory efficiency
 */
class CompressionAndCaching {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 200; // Limit cache entries
    this.maxCacheItemSize = 5 * 1024 * 1024; // 5MB max per item
    this.defaultCacheTTL = 300000; // 5 minutes
    this.compressionThreshold = 1024; // Compress responses > 1KB
    
    this.stats = {
      compressionRequests: 0,
      compressionBytesSaved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheEvictions: 0
    };

    // Periodic cache cleanup
    this.startCacheCleanup();
    
    console.log('🗜️ Compression and Caching system initialized');
  }

  /**
   * Start periodic cache cleanup to prevent memory buildup
   */
  startCacheCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.performCacheCleanup();
    }, 60000); // Every minute
  }

  /**
   * Perform cache cleanup - remove expired entries and enforce size limits
   */
  performCacheCleanup() {
    const now = Date.now();
    let removedCount = 0;
    let totalSize = 0;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
        this.stats.cacheEvictions++;
      } else {
        totalSize += entry.size || 0;
      }
    }

    // If still over size limit, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
        removedCount++;
        this.stats.cacheEvictions++;
      });
    }

    if (removedCount > 0) {
      console.log(`🧹 Cache cleanup: removed ${removedCount} expired/excess entries`);
    }
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(req) {
    const keyData = {
      method: req.method,
      path: req.path,
      query: req.query,
      // Include relevant headers that affect response
      accept: req.headers.accept,
      acceptEncoding: req.headers['accept-encoding']
    };
    
    const keyString = JSON.stringify(keyData);
    return createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Check if response should be cached
   */
  shouldCache(req, res, data) {
    // Don't cache errors
    if (res.statusCode >= 400) return false;
    
    // Don't cache if cache-control header says no
    const cacheControl = res.getHeader('cache-control');
    if (cacheControl && cacheControl.includes('no-cache')) return false;
    
    // Don't cache POST, PUT, DELETE requests
    if (!['GET', 'HEAD'].includes(req.method)) return false;
    
    // Don't cache responses that are too large
    const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(JSON.stringify(data));
    if (dataSize > this.maxCacheItemSize) return false;
    
    // Don't cache real-time data endpoints
    const realtimePaths = ['/api/alerts', '/api/live', '/api/supervisor/state'];
    if (realtimePaths.some(path => req.path.includes(path))) return false;
    
    return true;
  }

  /**
   * Determine optimal compression method
   */
  getCompressionMethod(req, data) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(JSON.stringify(data));
    
    // Don't compress small responses
    if (dataSize < this.compressionThreshold) return null;
    
    // Prefer gzip for better compression ratio on larger data
    if (acceptEncoding.includes('gzip')) {
      return dataSize > 10000 ? { method: 'gzip', level: 6 } : { method: 'gzip', level: 9 };
    }
    
    // Fallback to deflate
    if (acceptEncoding.includes('deflate')) {
      return { method: 'deflate', level: 6 };
    }
    
    return null;
  }

  /**
   * Compress data with specified method
   */
  async compressData(data, compression) {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
      const originalSize = buffer.length;
      
      let compressor;
      if (compression.method === 'gzip') {
        compressor = createGzip({ level: compression.level });
      } else if (compression.method === 'deflate') {
        compressor = createDeflate({ level: compression.level });
      } else {
        return resolve({ compressed: buffer, originalSize, compressedSize: originalSize });
      }

      const chunks = [];
      
      compressor.on('data', chunk => chunks.push(chunk));
      compressor.on('end', () => {
        const compressed = Buffer.concat(chunks);
        const compressedSize = compressed.length;
        const savings = originalSize - compressedSize;
        
        this.stats.compressionRequests++;
        this.stats.compressionBytesSaved += savings;
        
        resolve({
          compressed,
          originalSize,
          compressedSize,
          savings,
          method: compression.method
        });
      });
      compressor.on('error', reject);
      
      compressor.end(buffer);
    });
  }

  /**
   * Get cached response
   */
  getCachedResponse(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      this.stats.cacheMisses++;
      return null;
    }
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey);
      this.stats.cacheMisses++;
      this.stats.cacheEvictions++;
      return null;
    }
    
    this.stats.cacheHits++;
    return cached;
  }

  /**
   * Store response in cache
   */
  setCachedResponse(cacheKey, data, headers, ttl = this.defaultCacheTTL) {
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(JSON.stringify(data));
    
    // Don't cache if too large
    if (size > this.maxCacheItemSize) return false;
    
    // Clean cache if at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.cacheEvictions++;
    }
    
    this.cache.set(cacheKey, {
      data,
      headers,
      size,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl
    });
    
    return true;
  }

  /**
   * Get cache and compression statistics
   */
  getStats() {
    const cacheSize = this.cache.size;
    const cacheMemoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + (entry.size || 0), 0);
    
    return {
      cache: {
        entries: cacheSize,
        memoryUsage: `${Math.round(cacheMemoryUsage / 1024)}KB`,
        maxEntries: this.maxCacheSize,
        hitRate: this.stats.cacheHits + this.stats.cacheMisses > 0 
          ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) + '%'
          : '0%'
      },
      compression: {
        requests: this.stats.compressionRequests,
        bytesSaved: `${Math.round(this.stats.compressionBytesSaved / 1024)}KB`,
        threshold: `${this.compressionThreshold}B`
      },
      stats: this.stats
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cleared ${size} cached responses`);
    return size;
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clearCache();
    console.log('✅ Compression and Caching system shutdown');
  }
}

// Singleton instance
const compressionAndCaching = new CompressionAndCaching();

/**
 * Express middleware for intelligent compression and caching
 */
export const compressionCachingMiddleware = (options = {}) => {
  const {
    enableCompression = true,
    enableCaching = true,
    cacheTTL = 300000, // 5 minutes
    compressionThreshold = 1024
  } = options;

  return async (req, res, next) => {
    // Skip if disabled
    if (!enableCompression && !enableCaching) {
      return next();
    }

    const cacheKey = enableCaching ? compressionAndCaching.generateCacheKey(req) : null;
    
    // Check cache first
    if (enableCaching && cacheKey) {
      const cached = compressionAndCaching.getCachedResponse(cacheKey);
      if (cached) {
        // Restore headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        res.setHeader('X-Cache', 'HIT');
        
        return res.end(cached.data);
      }
    }

    // Override res.json and res.send to intercept responses
    const originalJson = res.json;
    const originalSend = res.send;
    
    const handleResponse = async (data) => {
      try {
        let responseData = data;
        let headers = {};
        
        // Copy current headers
        const currentHeaders = res.getHeaders();
        Object.entries(currentHeaders).forEach(([key, value]) => {
          headers[key] = value;
        });

        // Apply compression if enabled and beneficial
        if (enableCompression) {
          const compression = compressionAndCaching.getCompressionMethod(req, data);
          if (compression) {
            const compressed = await compressionAndCaching.compressData(data, compression);
            if (compressed.savings > 0) {
              responseData = compressed.compressed;
              headers['content-encoding'] = compression.method;
              headers['content-length'] = compressed.compressedSize;
              headers['x-compression-ratio'] = `${(compressed.savings / compressed.originalSize * 100).toFixed(1)}%`;
            }
          }
        }

        // Cache response if applicable
        if (enableCaching && cacheKey && compressionAndCaching.shouldCache(req, res, data)) {
          compressionAndCaching.setCachedResponse(cacheKey, responseData, headers, cacheTTL);
          headers['X-Cache'] = 'MISS';
        }

        // Set final headers
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        return responseData;

      } catch (error) {
        console.error('❌ Compression/caching error:', error);
        return data; // Fallback to original data
      }
    };

    // Override res.json
    res.json = async function(data) {
      try {
        const processedData = await handleResponse(data);
        if (Buffer.isBuffer(processedData)) {
          res.setHeader('Content-Type', 'application/json');
          return res.end(processedData);
        } else {
          return originalJson.call(this, processedData);
        }
      } catch (error) {
        return originalJson.call(this, data);
      }
    };

    // Override res.send
    res.send = async function(data) {
      try {
        const processedData = await handleResponse(data);
        return originalSend.call(this, processedData);
      } catch (error) {
        return originalSend.call(this, data);
      }
    };

    next();
  };
};

/**
 * Middleware to add cache control headers
 */
export const cacheControlMiddleware = (maxAge = 300) => {
  return (req, res, next) => {
    // Set appropriate cache control headers
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      res.setHeader('ETag', createHash('md5').update(req.originalUrl).digest('hex'));
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    next();
  };
};

/**
 * Memory-efficient ETags middleware
 */
export const etagMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    const etag = createHash('md5').update(JSON.stringify(data)).digest('hex');
    res.setHeader('ETag', `"${etag}"`);
    
    // Check if client has current version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === `"${etag}"`) {
      return res.status(304).end();
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default compressionAndCaching;