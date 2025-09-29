/**
 * Assessment Data Cache Service
 * Implements local caching to reduce API calls and improve performance
 * Features: TTL-based expiration, size limits, compression, and persistence
 */

class AssessmentCacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Maximum number of cache entries
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.compressionThreshold = 1000; // Compress data larger than 1KB
    this.persistenceKey = 'assessment_cache_v1';
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      compressions: 0
    };
    
    // Load persisted cache on initialization
    this.loadPersistedCache();
    
    // Setup periodic cleanup
    this.setupCleanup();
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${endpoint}${sortedParams ? `?${sortedParams}` : ''}`;
  }

  /**
   * Set cache entry with optional TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    try {
      // Check cache size and evict if necessary
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }

      const entry = {
        data: this.compressIfNeeded(data),
        timestamp: Date.now(),
        ttl,
        compressed: this.shouldCompress(data),
        size: this.calculateSize(data)
      };

      this.cache.set(key, entry);
      this.metrics.sets++;

      // Persist to localStorage for session recovery
      this.persistCache();

      console.log(`📦 Cached assessment data: ${key} (TTL: ${ttl}ms)`);
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache entry if valid
   */
  get(key) {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.metrics.misses++;
        return null;
      }

      // Check if entry has expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        this.metrics.misses++;
        console.log(`⏰ Cache entry expired: ${key} (age: ${age}ms)`);
        return null;
      }

      this.metrics.hits++;
      
      // Decompress if needed
      const data = entry.compressed ? this.decompress(entry.data) : entry.data;
      
      console.log(`✅ Cache hit: ${key} (age: ${age}ms)`);
      return {
        data,
        age,
        fromCache: true
      };
    } catch (error) {
      console.error('❌ Cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Check if data exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    return age <= entry.ttl;
  }

  /**
   * Clear specific cache entry
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache entry deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.clearPersistedCache();
    console.log(`🧹 Cache cleared: ${size} entries removed`);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`🔄 Invalidated ${count} cache entries matching: ${pattern}`);
    }
    
    return count;
  }

  /**
   * Evict oldest entry to make room
   */
  evictOldest() {
    if (this.cache.size === 0) return;
    
    let oldestKey = null;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
      console.log(`♻️ Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  /**
   * Compress data if it's large enough
   */
  compressIfNeeded(data) {
    if (this.shouldCompress(data)) {
      this.metrics.compressions++;
      return this.compress(data);
    }
    return data;
  }

  /**
   * Check if data should be compressed
   */
  shouldCompress(data) {
    const size = this.calculateSize(data);
    return size > this.compressionThreshold;
  }

  /**
   * Simple compression using JSON + LZ-like technique
   */
  compress(data) {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression: remove repeated whitespace and common patterns
      const compressed = jsonString
        .replace(/\s+/g, ' ')
        .replace(/,\s*}/g, '}')
        .replace(/{\s*/g, '{')
        .replace(/\[\s*/g, '[')
        .replace(/\s*\]/g, ']');
      
      return {
        compressed: true,
        data: compressed,
        originalSize: jsonString.length,
        compressedSize: compressed.length
      };
    } catch (error) {
      console.warn('⚠️ Compression failed, using original data:', error);
      return data;
    }
  }

  /**
   * Decompress data
   */
  decompress(compressedData) {
    if (!compressedData.compressed) return compressedData;
    
    try {
      return JSON.parse(compressedData.data);
    } catch (error) {
      console.error('❌ Decompression failed:', error);
      return null;
    }
  }

  /**
   * Calculate approximate data size
   */
  calculateSize(data) {
    try {
      return JSON.stringify(data).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const before = this.cache.size;
    const now = Date.now();
    
    for (const [key, entry] of this.cache) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
    
    const removed = before - this.cache.size;
    if (removed > 0) {
      console.log(`🧹 Cleanup removed ${removed} expired cache entries`);
    }
  }

  /**
   * Setup automatic cleanup
   */
  setupCleanup() {
    // Cleanup every 2 minutes
    setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }

  /**
   * Persist cache to localStorage
   */
  persistCache() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        timestamp: Date.now(),
        version: 1
      };
      
      localStorage.setItem(this.persistenceKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ Failed to persist cache:', error);
    }
  }

  /**
   * Load persisted cache from localStorage
   */
  loadPersistedCache() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (!stored) return;
      
      const cacheData = JSON.parse(stored);
      const age = Date.now() - cacheData.timestamp;
      
      // Don't load cache older than 30 minutes
      if (age > 30 * 60 * 1000) {
        this.clearPersistedCache();
        return;
      }
      
      // Restore cache entries that haven't expired
      const now = Date.now();
      let restored = 0;
      
      for (const [key, entry] of cacheData.entries) {
        const entryAge = now - entry.timestamp;
        if (entryAge < entry.ttl) {
          this.cache.set(key, entry);
          restored++;
        }
      }
      
      if (restored > 0) {
        console.log(`📦 Restored ${restored} cache entries from localStorage`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load persisted cache:', error);
      this.clearPersistedCache();
    }
  }

  /**
   * Clear persisted cache
   */
  clearPersistedCache() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.removeItem(this.persistenceKey);
    } catch (error) {
      console.warn('⚠️ Failed to clear persisted cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const averageAge = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length 
      : 0;
    
    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize,
      averageAge: Math.round(averageAge),
      metrics: { ...this.metrics }
    };
  }

  /**
   * Export cache statistics for monitoring
   */
  exportStats() {
    const stats = this.getStats();
    console.table(stats);
    return stats;
  }
}

// Create singleton instance
export const assessmentCache = new AssessmentCacheService();
export default assessmentCache;