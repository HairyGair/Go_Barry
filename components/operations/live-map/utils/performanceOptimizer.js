/*
 * Go Barry - Performance Optimizer for Live Map
 * Memory management, caching, and rendering optimizations
 * Phase 4: Performance & Integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Native JavaScript implementations to replace lodash
const throttle = (func, limit) => {
  let inThrottle;
  let timeoutId;
  let lastArgs;
  
  const throttled = function(...args) {
    lastArgs = args;
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      timeoutId = setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          throttled.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
  
  throttled.cancel = () => {
    clearTimeout(timeoutId);
    inThrottle = false;
    lastArgs = null;
  };
  
  throttled.flush = () => {
    clearTimeout(timeoutId);
    if (lastArgs) {
      func.apply(this, lastArgs);
    }
    inThrottle = false;
    lastArgs = null;
  };
  
  return throttled;
};

const debounce = (func, delay) => {
  let timeoutId;
  const debounced = function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  debounced.flush = () => {
    clearTimeout(timeoutId);
    func.apply(this, arguments);
  };
  
  return debounced;
};

/**
 * Cache implementation with TTL and memory limits
 */
class PerformanceCache {
  constructor(maxSize = 1000, ttlMs = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.accessTimes = new Map();
  }

  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      timestamp: now,
      lastAccess: now
    });
    this.accessTimes.set(key, now);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    
    // Check if entry has expired
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time
    entry.lastAccess = now;
    this.accessTimes.set(key, now);
    
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  size() {
    return this.cache.size;
  }

  _evictOldest() {
    // Remove least recently used entries
    const sortedByAccess = Array.from(this.accessTimes.entries())
      .sort((a, b) => a[1] - b[1]);
    
    const toRemove = Math.ceil(this.maxSize * 0.1); // Remove 10% when full
    for (let i = 0; i < toRemove && i < sortedByAccess.length; i++) {
      const [key] = sortedByAccess[i];
      this.cache.delete(key);
      this.accessTimes.delete(key);
    }
  }
}

/**
 * Global performance cache instances
 */
export const alertCache = new PerformanceCache(500, 300000); // 5 minutes for alerts
export const busCache = new PerformanceCache(1000, 30000);   // 30 seconds for buses
export const routeCache = new PerformanceCache(100, 600000); // 10 minutes for routes

/**
 * Viewport-based loading with caching
 */
export class ViewportLoader {
  constructor(options = {}) {
    this.cache = new PerformanceCache(options.cacheSize || 200, options.cacheTtl || 120000);
    this.loadingStates = new Map();
    this.viewportHistory = [];
    this.maxHistorySize = 5;
  }

  /**
   * Filter items by viewport with caching
   */
  filterByViewport(items, viewport, cacheKey = null) {
    if (!viewport || !items?.length) return items || [];

    // Generate cache key
    const key = cacheKey || this._generateViewportKey(viewport, items.length);
    
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Filter items
    const filtered = items.filter(item => this._isInViewport(item, viewport));
    
    // Cache result
    this.cache.set(key, filtered);
    
    return filtered;
  }

  /**
   * Load items with progressive enhancement based on zoom level
   */
  loadByImportance(items, viewport, options = {}) {
    const { maxItems = 100, priorityField = 'severity' } = options;
    
    if (!items?.length) return [];

    // First filter by viewport
    const viewportItems = this.filterByViewport(items, viewport);
    
    // If we have too many items, prioritize by importance
    if (viewportItems.length > maxItems) {
      return viewportItems
        .sort((a, b) => this._comparePriority(a, b, priorityField))
        .slice(0, maxItems);
    }
    
    return viewportItems;
  }

  /**
   * Preload adjacent viewport areas
   */
  preloadAdjacent(items, viewport, expansionFactor = 1.5) {
    const expandedViewport = this._expandViewport(viewport, expansionFactor);
    const key = this._generateViewportKey(expandedViewport, items.length);
    
    // Only preload if not already cached
    if (!this.cache.has(key)) {
      setTimeout(() => {
        this.filterByViewport(items, expandedViewport, key);
      }, 100); // Delay to not block main thread
    }
  }

  _isInViewport(item, viewport) {
    if (!item.coordinates || !Array.isArray(item.coordinates)) return false;
    
    const [lat, lng] = item.coordinates;
    return (
      lat >= viewport.south &&
      lat <= viewport.north &&
      lng >= viewport.west &&
      lng <= viewport.east
    );
  }

  _generateViewportKey(viewport, itemCount) {
    const precision = 3; // 3 decimal places for viewport bounds
    return `viewport_${viewport.north.toFixed(precision)}_${viewport.south.toFixed(precision)}_${viewport.east.toFixed(precision)}_${viewport.west.toFixed(precision)}_${itemCount}`;
  }

  _expandViewport(viewport, factor) {
    const latRange = viewport.north - viewport.south;
    const lngRange = viewport.east - viewport.west;
    const latExpansion = (latRange * factor - latRange) / 2;
    const lngExpansion = (lngRange * factor - lngRange) / 2;

    return {
      north: viewport.north + latExpansion,
      south: viewport.south - latExpansion,
      east: viewport.east + lngExpansion,
      west: viewport.west - lngExpansion,
    };
  }

  _comparePriority(a, b, field) {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const aPriority = priorityOrder[a[field]] || 1;
    const bPriority = priorityOrder[b[field]] || 1;
    return bPriority - aPriority; // High priority first
  }
}

/**
 * Marker pool for efficient DOM manipulation
 */
export class MarkerPool {
  constructor(createFn, maxSize = 200) {
    this.createMarker = createFn;
    this.pool = [];
    this.active = new Map();
    this.maxSize = maxSize;
  }

  getMarker(id, data) {
    // Return existing marker if already active
    if (this.active.has(id)) {
      return this.active.get(id);
    }

    // Get marker from pool or create new one
    let marker;
    if (this.pool.length > 0) {
      marker = this.pool.pop();
      marker.update(data); // Update with new data
    } else {
      marker = this.createMarker(data);
    }

    this.active.set(id, marker);
    return marker;
  }

  releaseMarker(id) {
    const marker = this.active.get(id);
    if (marker) {
      this.active.delete(id);
      
      // Return to pool if not at capacity
      if (this.pool.length < this.maxSize) {
        marker.reset(); // Clean up for reuse
        this.pool.push(marker);
      } else {
        marker.destroy(); // Permanently remove
      }
    }
  }

  releaseAll() {
    for (const [id, marker] of this.active) {
      this.releaseMarker(id);
    }
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.active.size,
      totalCapacity: this.maxSize
    };
  }
}

/**
 * Optimized data update patterns
 */
export const createDataUpdateManager = (updateInterval = 1000) => {
  const updateQueue = new Map();
  const batchUpdateFn = throttle(() => {
    const updates = Array.from(updateQueue.values());
    updateQueue.clear();
    
    // Batch process all updates
    if (updates.length > 0) {
      console.log(`[PerformanceOptimizer] Processing ${updates.length} batched updates`);
      updates.forEach(update => update());
    }
  }, updateInterval);

  return {
    queueUpdate: (key, updateFn) => {
      updateQueue.set(key, updateFn);
      batchUpdateFn();
    },
    
    forceUpdate: () => {
      batchUpdateFn.flush();
    },
    
    clear: () => {
      updateQueue.clear();
      batchUpdateFn.cancel();
    }
  };
};

/**
 * Memory usage monitoring
 */
export const memoryMonitor = {
  getUsage: () => {
    if (typeof window !== 'undefined' && window.performance?.memory) {
      return {
        used: window.performance.memory.usedJSHeapSize,
        total: window.performance.memory.totalJSHeapSize,
        limit: window.performance.memory.jsHeapSizeLimit,
        percentage: (window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  },
  
  logUsage: (context = '') => {
    const usage = memoryMonitor.getUsage();
    if (usage) {
      const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
      console.log(`[Memory${context ? ` ${context}` : ''}] Used: ${mb(usage.used)}MB / Total: ${mb(usage.total)}MB (${usage.percentage.toFixed(1)}%)`);
    }
  },
  
  isHighUsage: (threshold = 70) => {
    const usage = memoryMonitor.getUsage();
    return usage ? usage.percentage > threshold : false;
  }
};

/**
 * Optimized event handlers with cleanup
 */
export const createOptimizedEventHandler = (handler, options = {}) => {
  const { throttleMs = 100, debounceMs = null, maxCalls = null } = options;
  
  let callCount = 0;
  let cleanup = null;
  
  let optimizedHandler = handler;
  
  // Apply throttling if specified
  if (throttleMs > 0) {
    optimizedHandler = throttle(optimizedHandler, throttleMs);
    cleanup = () => optimizedHandler.cancel();
  }
  
  // Apply debouncing if specified
  if (debounceMs > 0) {
    optimizedHandler = debounce(optimizedHandler, debounceMs);
    if (cleanup) {
      const prevCleanup = cleanup;
      cleanup = () => {
        prevCleanup();
        optimizedHandler.cancel();
      };
    } else {
      cleanup = () => optimizedHandler.cancel();
    }
  }
  
  // Apply call limiting if specified
  if (maxCalls > 0) {
    const limitedHandler = optimizedHandler;
    optimizedHandler = (...args) => {
      if (callCount < maxCalls) {
        callCount++;
        return limitedHandler(...args);
      }
    };
  }
  
  return {
    handler: optimizedHandler,
    cleanup: cleanup || (() => {}),
    getCallCount: () => callCount,
    reset: () => { callCount = 0; }
  };
};

// useViewportLoading hook is available as a separate file in ../hooks/useViewportLoading.js

export default {
  ViewportLoader,
  MarkerPool,
  createDataUpdateManager,
  memoryMonitor,
  createOptimizedEventHandler,
  alertCache,
  busCache,
  routeCache
};
