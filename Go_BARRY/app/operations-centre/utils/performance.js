/**
 * Performance optimization utilities for Operations Centre
 * Phase 7 - Performance & Memory Management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (Platform.OS === 'web' && typeof performance !== 'undefined' && performance.memory) {
    return {
      usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Debounce hook for performance
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

// Lazy loading helper
export const useLazyLoad = (importFn, dependencies = []) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    importFn()
      .then(module => {
        if (mounted) {
          setComponent(() => module.default || module);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { component, loading, error };
};

// Performance metrics collector
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startMeasure(name) {
    if (Platform.OS === 'web' && typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
    this.metrics.set(name, { start: Date.now() });
  }

  endMeasure(name) {
    const metric = this.metrics.get(name);
    if (!metric) return;

    const duration = Date.now() - metric.start;
    metric.end = Date.now();
    metric.duration = duration;

    if (Platform.OS === 'web' && typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    this.notifyObservers(name, metric);
    return duration;
  }

  addObserver(callback) {
    this.observers.push(callback);
  }

  notifyObservers(name, metric) {
    this.observers.forEach(callback => callback(name, metric));
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// Cache manager with memory limits
export class CacheManager {
  constructor(maxSize = 50 * 1024 * 1024) { // 50MB default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  set(key, value) {
    const size = this.getSize(value);
    
    // If this item would exceed our limit, clear oldest items
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      size,
      timestamp: Date.now(),
    });
    this.currentSize += size;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Update timestamp on access (LRU)
    item.timestamp = Date.now();
    return item.value;
  }

  delete(key) {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.currentSize = 0;
  }

  getSize(obj) {
    // Rough estimation of object size
    const str = JSON.stringify(obj);
    return str.length * 2; // 2 bytes per character
  }

  getStats() {
    return {
      itemCount: this.cache.size,
      currentSize: Math.round(this.currentSize / 1024), // KB
      maxSize: Math.round(this.maxSize / 1024), // KB
      usage: Math.round((this.currentSize / this.maxSize) * 100), // %
    };
  }
}

// Request batching for API calls
export class RequestBatcher {
  constructor(batchFn, delay = 50, maxBatchSize = 10) {
    this.batchFn = batchFn;
    this.delay = delay;
    this.maxBatchSize = maxBatchSize;
    this.queue = [];
    this.timeout = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);
    const requests = batch.map(item => item.request);

    try {
      const results = await this.batchFn(requests);
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
}

// Optimize re-renders with memo comparison
export const deepMemoCompare = (prev, next) => {
  return JSON.stringify(prev) === JSON.stringify(next);
};

// Export performance utilities
export default {
  getMemoryUsage,
  useDebounce,
  useThrottle,
  useLazyLoad,
  PerformanceMonitor,
  CacheManager,
  RequestBatcher,
  deepMemoCompare,
};
