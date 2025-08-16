// backend/services/memoryEfficientDataCache.js
// Memory-efficient data cache with automatic cleanup and size limits

class MemoryEfficientDataCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // Maximum items per cache
    this.maxAge = options.maxAge || 600000; // 10 minutes default TTL
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes cleanup
    this.maxMemoryMB = options.maxMemoryMB || 100; // 100MB per cache max
    
    // Cache stores
    this.caches = new Map();
    this.accessTimes = new Map();
    this.creationTimes = new Map();
    
    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      cleanups: 0,
      memoryCleanups: 0
    };
    
    // Start cleanup interval
    this.startCleanup();
    
    console.log('🗄️ Memory-efficient data cache initialized');
  }

  // Create or get a named cache
  getCache(name) {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
      this.accessTimes.set(name, new Map());
      this.creationTimes.set(name, new Map());
      console.log(`📦 Created cache: ${name}`);
    }
    return {
      cache: this.caches.get(name),
      accessTimes: this.accessTimes.get(name),
      creationTimes: this.creationTimes.get(name)
    };
  }

  // Set value in cache with automatic size management
  set(cacheName, key, value, ttl = this.maxAge) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    const now = Date.now();
    
    // Check memory usage before adding
    if (this.shouldRejectForMemory(value)) {
      console.warn(`⚠️ Rejecting cache entry for ${cacheName}:${key} - too large`);
      return false;
    }
    
    // Evict old items if at capacity
    if (cache.size >= this.maxSize) {
      this.evictLRU(cacheName);
    }
    
    // Store the value
    cache.set(key, value);
    accessTimes.set(key, now);
    creationTimes.set(key, now);
    
    // Set TTL cleanup
    if (ttl > 0) {
      setTimeout(() => {
        this.delete(cacheName, key);
      }, ttl);
    }
    
    return true;
  }

  // Get value from cache
  get(cacheName, key) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    
    if (!cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    const creationTime = creationTimes.get(key);
    if (creationTime && (Date.now() - creationTime) > this.maxAge) {
      this.delete(cacheName, key);
      this.stats.misses++;
      return null;
    }
    
    // Update access time for LRU
    accessTimes.set(key, Date.now());
    this.stats.hits++;
    
    return cache.get(key);
  }

  // Delete from cache
  delete(cacheName, key) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    
    const deleted = cache.delete(key);
    accessTimes.delete(key);
    creationTimes.delete(key);
    
    return deleted;
  }

  // Clear entire cache
  clear(cacheName) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    
    const size = cache.size;
    cache.clear();
    accessTimes.clear();
    creationTimes.clear();
    
    console.log(`🗑️ Cleared cache ${cacheName}: ${size} items removed`);
    return size;
  }

  // Evict least recently used item
  evictLRU(cacheName) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    
    if (cache.size === 0) return;
    
    // Find least recently used key
    let lruKey = null;
    let lruTime = Date.now();
    
    for (const [key, time] of accessTimes) {
      if (time < lruTime) {
        lruTime = time;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.delete(cacheName, lruKey);
      this.stats.evictions++;
      console.log(`⏰ Evicted LRU item from ${cacheName}: ${lruKey}`);
    }
  }

  // Check if value is too large for memory
  shouldRejectForMemory(value) {
    try {
      const serialized = JSON.stringify(value);
      const sizeKB = serialized.length / 1024;
      
      // Reject items larger than 1MB
      if (sizeKB > 1024) {
        return true;
      }
      
      // Check total estimated memory usage
      const estimatedMemoryMB = this.getEstimatedMemoryUsage();
      return estimatedMemoryMB > this.maxMemoryMB;
    } catch (error) {
      // If can't serialize, probably too complex
      return true;
    }
  }

  // Estimate total memory usage
  getEstimatedMemoryUsage() {
    let totalSizeKB = 0;
    
    for (const [name, cache] of this.caches) {
      for (const [key, value] of cache) {
        try {
          const serialized = JSON.stringify({ key, value });
          totalSizeKB += serialized.length / 1024;
        } catch (error) {
          // Estimate 1KB for non-serializable items
          totalSizeKB += 1;
        }
      }
    }
    
    return totalSizeKB / 1024; // Convert to MB
  }

  // Cleanup expired items
  cleanup() {
    const now = Date.now();
    let totalCleaned = 0;
    
    for (const [cacheName, cache] of this.caches) {
      const creationTimes = this.creationTimes.get(cacheName);
      const accessTimes = this.accessTimes.get(cacheName);
      
      const keysToDelete = [];
      
      for (const [key, creationTime] of creationTimes) {
        if ((now - creationTime) > this.maxAge) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        cache.delete(key);
        creationTimes.delete(key);
        accessTimes.delete(key);
        totalCleaned++;
      }
      
      if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned ${keysToDelete.length} expired items from ${cacheName}`);
      }
    }
    
    this.stats.cleanups++;
    return totalCleaned;
  }

  // Memory pressure cleanup - more aggressive
  memoryPressureCleanup() {
    console.log('🚨 Memory pressure cleanup started');
    
    let totalCleaned = 0;
    const now = Date.now();
    
    // Clean up caches starting with least recently used
    for (const [cacheName, cache] of this.caches) {
      const accessTimes = this.accessTimes.get(cacheName);
      const creationTimes = this.creationTimes.get(cacheName);
      
      // Sort by access time and remove bottom 50%
      const sortedKeys = Array.from(accessTimes.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([key]) => key);
      
      const toRemove = Math.ceil(sortedKeys.length * 0.5);
      const keysToDelete = sortedKeys.slice(0, toRemove);
      
      for (const key of keysToDelete) {
        cache.delete(key);
        accessTimes.delete(key);
        creationTimes.delete(key);
        totalCleaned++;
      }
      
      console.log(`🗑️ Memory pressure: removed ${keysToDelete.length} items from ${cacheName}`);
    }
    
    this.stats.memoryCleanups++;
    console.log(`✅ Memory pressure cleanup completed: ${totalCleaned} items removed`);
    
    return totalCleaned;
  }

  // Start automatic cleanup
  startCleanup() {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
      
      // Check memory usage and trigger pressure cleanup if needed
      const memoryUsageMB = this.getEstimatedMemoryUsage();
      if (memoryUsageMB > this.maxMemoryMB * 0.8) {
        console.warn(`⚠️ Cache memory usage high: ${memoryUsageMB.toFixed(1)}MB`);
        this.memoryPressureCleanup();
      }
    }, this.cleanupInterval);
    
    console.log(`⏰ Cache cleanup scheduled every ${this.cleanupInterval / 1000}s`);
  }

  // Stop cleanup
  stopCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
      console.log('⏹️ Cache cleanup stopped');
    }
  }

  // Get cache statistics
  getStats() {
    const totalItems = Array.from(this.caches.values())
      .reduce((sum, cache) => sum + cache.size, 0);
    
    return {
      ...this.stats,
      totalItems,
      totalCaches: this.caches.size,
      estimatedMemoryMB: this.getEstimatedMemoryUsage().toFixed(2),
      hitRate: this.stats.hits > 0 ? 
        ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%' : 
        '0%'
    };
  }

  // Get detailed cache info
  getCacheInfo(cacheName) {
    const { cache, accessTimes, creationTimes } = this.getCache(cacheName);
    
    return {
      name: cacheName,
      size: cache.size,
      maxSize: this.maxSize,
      oldestItem: creationTimes.size > 0 ? 
        Math.min(...Array.from(creationTimes.values())) : null,
      newestItem: creationTimes.size > 0 ? 
        Math.max(...Array.from(creationTimes.values())) : null,
      averageAge: this.getAverageAge(cacheName)
    };
  }

  // Get average age of items in cache
  getAverageAge(cacheName) {
    const creationTimes = this.creationTimes.get(cacheName);
    if (!creationTimes || creationTimes.size === 0) return 0;
    
    const now = Date.now();
    const totalAge = Array.from(creationTimes.values())
      .reduce((sum, time) => sum + (now - time), 0);
    
    return Math.round(totalAge / creationTimes.size / 1000); // Return in seconds
  }

  // Shutdown and cleanup
  shutdown() {
    this.stopCleanup();
    
    // Clear all caches
    let totalCleared = 0;
    for (const [name, cache] of this.caches) {
      totalCleared += cache.size;
      this.clear(name);
    }
    
    this.caches.clear();
    this.accessTimes.clear();
    this.creationTimes.clear();
    
    console.log(`🏁 Memory-efficient cache shutdown: ${totalCleared} items cleared`);
  }
}

// Create singleton instance
const dataCache = new MemoryEfficientDataCache({
  maxSize: 500, // Reduced for memory efficiency
  maxAge: 300000, // 5 minutes for faster turnover
  cleanupInterval: 60000, // Clean every minute
  maxMemoryMB: 50 // Only 50MB for data cache
});

export default dataCache;
export { MemoryEfficientDataCache };