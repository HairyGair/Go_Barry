// Performance optimization utilities for Go BARRY
import React from 'react';

// Memory-efficient alert processing
export const alertOptimization = {
  // Process alerts in chunks to avoid memory spikes
  processInChunks: async (alerts, chunkSize = 50, processor) => {
    const results = [];
    for (let i = 0; i < alerts.length; i += chunkSize) {
      const chunk = alerts.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Allow garbage collection between chunks
      if (i + chunkSize < alerts.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    return results;
  },

  // Debounce function for reducing API calls
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for rate limiting
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memory-efficient array operations
  filterLarge: async (array, predicate, chunkSize = 1000) => {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const filtered = chunk.filter(predicate);
      results.push(...filtered);
    }
    return results;
  },

  // Lazy loading for components
  lazyWithPreload: (importFunc) => {
    const Component = React.lazy(importFunc);
    Component.preload = importFunc;
    return Component;
  },

  // Image optimization
  optimizeImageUrl: (url, width = 800) => {
    // Add image optimization parameters if using a CDN
    if (url.includes('cloudinary') || url.includes('imgix')) {
      return `${url}?w=${width}&q=auto&f=auto`;
    }
    return url;
  },

  // Memoization helper
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },

  // Request caching
  cacheRequest: (() => {
    const cache = new Map();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    return async (key, fetcher) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < maxAge) {
        return cached.data;
      }

      const data = await fetcher();
      cache.set(key, { data, timestamp: Date.now() });
      
      // Clean old entries
      for (const [k, v] of cache.entries()) {
        if (Date.now() - v.timestamp > maxAge) {
          cache.delete(k);
        }
      }

      return data;
    };
  })(),

  // Performance metrics
  measurePerformance: (name, fn) => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      });
    }
    
    return result;
  },

  // Batch DOM updates
  batchUpdates: (() => {
    let pending = [];
    let rafId = null;

    const flush = () => {
      const updates = pending;
      pending = [];
      rafId = null;
      updates.forEach(fn => fn());
    };

    return (fn) => {
      pending.push(fn);
      if (!rafId) {
        rafId = requestAnimationFrame(flush);
      }
    };
  })()
};

// React Native specific optimizations
export const rnOptimizations = {
  // Optimize FlatList rendering
  getFlatListOptimizations: () => ({
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
    getItemLayout: (data, index) => ({
      length: 100, // Replace with actual item height
      offset: 100 * index,
      index,
    }),
  }),

  // Optimize image loading
  getImageOptimizations: () => ({
    fadeDuration: 0,
    resizeMode: 'cover',
    cache: 'force-cache',
  }),

  // InteractionManager for heavy operations
  runAfterInteractions: (fn) => {
    if (typeof window !== 'undefined') {
      // Web: use requestIdleCallback
      if (window.requestIdleCallback) {
        window.requestIdleCallback(fn);
      } else {
        setTimeout(fn, 0);
      }
    } else {
      // React Native
      const { InteractionManager } = require('react-native');
      InteractionManager.runAfterInteractions(fn);
    }
  },
};

// Export performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    fps: 60,
    memory: 0,
    loadTime: 0,
  });

  React.useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
          memory: performance.memory ? 
            Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);

    // Measure load time
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  return metrics;
};

export default {
  alertOptimization,
  rnOptimizations,
  usePerformanceMonitor,
};
