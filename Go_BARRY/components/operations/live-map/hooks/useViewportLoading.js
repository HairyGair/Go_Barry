/*
 * Go Barry - Viewport Loading Hook
 * Performance-optimized viewport-based loading for Live Map
 * Phase 4: Performance & Integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ViewportLoader, createOptimizedEventHandler } from '../utils/performanceOptimizer';

/**
 * Hook for viewport-based loading with performance optimizations
 */
export const useViewportLoading = (mapRef, options = {}) => {
  const [viewport, setViewport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef(null);
  const cleanupRef = useRef(null);

  // Initialize viewport loader
  useEffect(() => {
    if (!loaderRef.current) {
      loaderRef.current = new ViewportLoader(options);
    }
  }, [options]);

  // Setup viewport tracking
  useEffect(() => {
    if (!mapRef?.current) return;

    const map = mapRef.current;
    
    // Create optimized viewport update handler
    const updateViewport = createOptimizedEventHandler(() => {
      if (map.getBounds) {
        const bounds = map.getBounds();
        const newViewport = {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
          center: map.getCenter(),
          zoom: map.getZoom()
        };
        setViewport(newViewport);
      }
    }, { throttleMs: 250 });

    // Store cleanup function
    cleanupRef.current = updateViewport.cleanup;

    // Attach event listeners
    if (map.on) {
      map.on('moveend', updateViewport.handler);
      map.on('zoomend', updateViewport.handler);
    }
    
    // Get initial viewport
    updateViewport.handler();

    // Cleanup function
    return () => {
      updateViewport.cleanup();
      if (map.off) {
        map.off('moveend', updateViewport.handler);
        map.off('zoomend', updateViewport.handler);
      }
    };
  }, [mapRef]);

  // Filter items by viewport with caching
  const filterByViewport = useCallback((items, cacheKey) => {
    if (!loaderRef.current || !viewport || !items) return items || [];
    return loaderRef.current.filterByViewport(items, viewport, cacheKey);
  }, [viewport]);

  // Load items by importance with viewport filtering
  const loadByImportance = useCallback((items, loadOptions = {}) => {
    if (!loaderRef.current || !viewport || !items) return items || [];
    return loaderRef.current.loadByImportance(items, viewport, loadOptions);
  }, [viewport]);

  // Preload adjacent areas
  const preloadAdjacent = useCallback((items, expansionFactor = 1.5) => {
    if (!loaderRef.current || !viewport || !items) return;
    loaderRef.current.preloadAdjacent(items, viewport, expansionFactor);
  }, [viewport]);

  // Get viewport statistics
  const getViewportStats = useCallback(() => {
    return {
      viewport,
      hasViewport: !!viewport,
      loader: loaderRef.current ? {
        cacheSize: loaderRef.current.cache.size(),
        cacheStats: loaderRef.current.cache
      } : null
    };
  }, [viewport]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    viewport,
    isLoading,
    filterByViewport,
    loadByImportance,
    preloadAdjacent,
    getViewportStats,
    loader: loaderRef.current
  };
};

export default useViewportLoading;
