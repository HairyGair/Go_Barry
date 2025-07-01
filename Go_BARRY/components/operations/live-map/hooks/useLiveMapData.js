/*
 * Go Barry - Live Map Data Hook
 * Handles Convex real-time sync and viewport-based filtering
 * Phase 4: Performance Optimized - Enhanced caching and memory management
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBusLocations } from './useBusLocations';
import { ViewportLoader, alertCache, busCache, memoryMonitor } from '../utils/performanceOptimizer';

// FIXED: Safe import of useConvexSync with fallback
let useConvexSync;
try {
  const convexSyncModule = require('../../../../hooks/useConvexSync');
  useConvexSync = convexSyncModule.useConvexSync;
  console.log('✅ useConvexSync imported successfully in useLiveMapData');
} catch (convexError) {
  console.warn('⚠️ useConvexSync not available - using fallback data');
  useConvexSync = () => ({
    activeAlerts: [],
    dismissedAlerts: [],
    activeSupervisors: [],
    syncState: null
  });
}

/**
 * Custom hook for Live Map data management
 * Integrates with Convex for real-time alerts and applies viewport-based filtering
 * Phase 3: UPDATED - Now includes bus locations and route data
 */
export const useLiveMapData = (mapViewport = null) => {
  // Convex real-time data - SAFE with fallback
  const { 
    activeAlerts: rawActiveAlerts,
    dismissedAlerts,
    activeSupervisors,
    syncState 
  } = useConvexSync();
  
  // Bus location data (Phase 3)
  const {
    busLocations: rawBusLocations,
    statistics: busStats,
    loading: busLoading,
    error: busError,
    getBusesByRoute,
    getBusesInViewport,
    getBusById,
    refreshBusLocations,
    isRealTime: busDataIsRealTime
  } = useBusLocations();

  // Local state
  const [alertStates, setAlertStates] = useState(new Map());
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [highlightedRoutes, setHighlightedRoutes] = useState(new Set());
  const [routeData, setRouteData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance optimization instances (Phase 4)
  const [viewportLoader] = useState(() => new ViewportLoader({ cacheSize: 300, cacheTtl: 180000 })); // 3 minutes
  const [lastMemoryCheck, setLastMemoryCheck] = useState(Date.now());

  // Process raw alerts to include supervisor interaction states
  const processedAlerts = useMemo(() => {
    if (!rawActiveAlerts || !Array.isArray(rawActiveAlerts)) {
      return [];
    }

    return rawActiveAlerts.map(alert => {
      // Determine alert state based on supervisor interactions
      let alertState = 'new';
      let acknowledgedBy = null;

      // Check if alert has been acknowledged
      if (alert.acknowledgedBy) {
        alertState = 'acknowledged';
        acknowledgedBy = alert.acknowledgedBy;
      }

      // Check if alert has been escalated (has incident/roadwork reference)
      if (alert.escalatedTo || alert.incidentId || alert.roadworkId) {
        alertState = 'escalated';
      }

      // Get supervisor interaction from local state if available
      const localState = alertStates.get(alert.id);
      if (localState) {
        alertState = localState.state;
        acknowledgedBy = localState.acknowledgedBy || acknowledgedBy;
      }

      return {
        ...alert,
        alertState,
        acknowledgedBy,
        isWorkedOn: alertState !== 'new', // Has supervisor interaction
        coordinates: alert.coordinates || [54.9783, -1.6178], // Default to Newcastle
      };
    });
  }, [rawActiveAlerts, alertStates]);

  // Filter alerts that have been worked on by supervisors
  const workedOnAlerts = useMemo(() => {
    return processedAlerts.filter(alert => alert.isWorkedOn);
  }, [processedAlerts]);

  // Include StreetManager alerts (always show regardless of supervisor interaction)
  const streetManagerAlerts = useMemo(() => {
    return processedAlerts.filter(alert => 
      alert.source === 'StreetManager' || alert.source === 'streetmanager'
    );
  }, [processedAlerts]);

  // Combine worked-on alerts and StreetManager alerts (deduplicate)
  const allAlerts = useMemo(() => {
    const alertMap = new Map();
    
    // Add worked-on alerts
    workedOnAlerts.forEach(alert => {
      alertMap.set(alert.id, alert);
    });
    
    // Add StreetManager alerts (may override worked-on state)
    streetManagerAlerts.forEach(alert => {
      alertMap.set(alert.id, alert);
    });
    
    return Array.from(alertMap.values());
  }, [workedOnAlerts, streetManagerAlerts]);

  // Apply viewport-based filtering for performance (Phase 4: Optimized with caching)
  const visibleAlerts = useMemo(() => {
    if (!mapViewport || !allAlerts.length) {
      return allAlerts;
    }

    // Use performance-optimized viewport loader with caching
    const cacheKey = `alerts_${allAlerts.length}_${mapViewport.zoom.toFixed(1)}`;
    const filtered = viewportLoader.filterByViewport(allAlerts, mapViewport, cacheKey);
    
    // Preload adjacent areas for smooth panning
    if (filtered.length > 0 && filtered.length < 50) {
      viewportLoader.preloadAdjacent(allAlerts, mapViewport, 1.3);
    }
    
    return filtered;
  }, [allAlerts, mapViewport, viewportLoader]);

  // Calculate alert statistics
  const alertStats = useMemo(() => {
    const stats = {
      total: allAlerts.length,
      new: 0,
      acknowledged: 0,
      escalated: 0,
      streetManager: 0,
      visible: visibleAlerts.length,
      bySource: new Map(),
      bySeverity: new Map(),
    };

    allAlerts.forEach(alert => {
      // Count by state
      switch (alert.alertState) {
        case 'new':
          stats.new++;
          break;
        case 'acknowledged':
          stats.acknowledged++;
          break;
        case 'escalated':
          stats.escalated++;
          break;
      }

      // Count StreetManager alerts
      if (alert.source === 'StreetManager' || alert.source === 'streetmanager') {
        stats.streetManager++;
      }

      // Count by source
      const source = alert.source || 'unknown';
      stats.bySource.set(source, (stats.bySource.get(source) || 0) + 1);

      // Count by severity
      const severity = alert.severity || 'medium';
      stats.bySeverity.set(severity, (stats.bySeverity.get(severity) || 0) + 1);
    });

    return stats;
  }, [allAlerts, visibleAlerts.length]);

  // Update alert state locally (optimistic updates)
  const updateAlertState = useCallback((alertId, newState, supervisorName = null) => {
    setAlertStates(prev => {
      const updated = new Map(prev);
      updated.set(alertId, {
        state: newState,
        acknowledgedBy: supervisorName,
        timestamp: Date.now(),
      });
      return updated;
    });
  }, []);

  // Process bus locations with viewport filtering (Phase 4: Performance optimized)
  const visibleBuses = useMemo(() => {
    if (!rawBusLocations || !Array.isArray(rawBusLocations)) {
      return [];
    }

    // Apply viewport filtering with performance optimization
    if (mapViewport) {
      // Use cached viewport filtering for better performance
      const cacheKey = `buses_${rawBusLocations.length}_${mapViewport.zoom.toFixed(1)}`;
      const filtered = viewportLoader.filterByViewport(rawBusLocations, mapViewport, cacheKey);
      
      // If too many buses, prioritize by importance (route type, delay status)
      if (filtered.length > 100) {
        return viewportLoader.loadByImportance(filtered, mapViewport, {
          maxItems: 100,
          priorityField: 'status' // Prioritize delayed buses
        });
      }
      
      return filtered;
    }

    return rawBusLocations;
  }, [rawBusLocations, mapViewport, viewportLoader]);

  // Extract unique routes from bus data and alerts
  const allRoutes = useMemo(() => {
    const routeSet = new Set();
    
    // Routes from bus locations
    visibleBuses.forEach(bus => {
      const route = bus.routeName || bus.lineRef;
      if (route) {
        routeSet.add(route);
      }
    });
    
    // Routes from alerts
    allAlerts.forEach(alert => {
      if (alert.affectsRoutes && Array.isArray(alert.affectsRoutes)) {
        alert.affectsRoutes.forEach(route => routeSet.add(route));
      }
    });
    
    return Array.from(routeSet).sort();
  }, [visibleBuses, allAlerts]);

  // Bus interaction handlers (Phase 3)
  const selectBus = useCallback((busId) => {
    console.log(`🚌 Selected bus: ${busId}`);
    setSelectedBusId(busId);
    
    // Highlight the route of the selected bus
    const bus = getBusById(busId);
    if (bus) {
      const route = bus.routeName || bus.lineRef;
      if (route) {
        setHighlightedRoutes(new Set([route]));
      }
    }
  }, [getBusById]);

  const deselectBus = useCallback(() => {
    setSelectedBusId(null);
    setHighlightedRoutes(new Set());
  }, []);

  // Route interaction handlers (Phase 3)
  const highlightRoute = useCallback((routeId) => {
    setHighlightedRoutes(prev => new Set([...prev, routeId]));
  }, []);

  const unhighlightRoute = useCallback((routeId) => {
    setHighlightedRoutes(prev => {
      const updated = new Set(prev);
      updated.delete(routeId);
      return updated;
    });
  }, []);

  const clearHighlightedRoutes = useCallback(() => {
    setHighlightedRoutes(new Set());
  }, []);

  // Get buses for specific routes
  const getBusesForRoutes = useCallback((routeIds) => {
    if (!routeIds || !Array.isArray(routeIds)) return [];
    return getBusesByRoute(routeIds);
  }, [getBusesByRoute]);

  // Combined statistics (Phase 3)
  const combinedStats = useMemo(() => {
    return {
      alerts: alertStats,
      buses: {
        ...busStats,
        visible: visibleBuses.length,
        routesWithBuses: new Set(visibleBuses.map(b => b.routeName || b.lineRef)).size,
      },
      routes: {
        total: allRoutes.length,
        highlighted: highlightedRoutes.size,
        withBuses: allRoutes.filter(route => 
          visibleBuses.some(bus => 
            (bus.routeName || bus.lineRef) === route
          )
        ).length,
        withAlerts: allRoutes.filter(route => 
          allAlerts.some(alert => 
            alert.affectsRoutes && alert.affectsRoutes.includes(route)
          )
        ).length,
      },
      dataHealth: {
        alertsLoaded: !loading && !error,
        busesLoaded: !busLoading && !busError,
        realTimeBuses: busDataIsRealTime,
        viewport: !!mapViewport,
      }
    };
  }, [alertStats, busStats, visibleBuses, allRoutes, highlightedRoutes, allAlerts, loading, error, busLoading, busError, busDataIsRealTime, mapViewport]);

  // Handle loading and error states
  useEffect(() => {
    if (rawActiveAlerts !== undefined) {
      setLoading(false);
      setError(null);
    }
  }, [rawActiveAlerts]);

  // Performance monitoring (Phase 4)
  useEffect(() => {
    const now = Date.now();
    
    // Check memory usage every 30 seconds
    if (now - lastMemoryCheck > 30000) {
      setLastMemoryCheck(now);
      
      if (memoryMonitor.isHighUsage(75)) {
        console.warn('[useLiveMapData] High memory usage detected:', memoryMonitor.getUsage());
        
        // Clear old cache entries if memory is high
        alertCache.clear();
        busCache.clear();
      }
    }
  }, [allAlerts.length, visibleBuses.length, lastMemoryCheck]);

  // Log data changes for debugging (Phase 4: Enhanced with performance metrics)
  useEffect(() => {
    console.log('[useLiveMapData] Data updated (Phase 4 - Performance Optimized):', {
      alerts: {
        total: allAlerts.length,
        visible: visibleAlerts.length,
        workedOn: workedOnAlerts.length,
        streetManager: streetManagerAlerts.length,
      },
      buses: {
        total: rawBusLocations?.length || 0,
        visible: visibleBuses.length,
        selected: selectedBusId,
        realTime: busDataIsRealTime,
      },
      routes: {
        total: allRoutes.length,
        highlighted: highlightedRoutes.size,
      },
      viewport: {
        active: !!mapViewport,
        bounds: mapViewport ? `${mapViewport.north.toFixed(3)}, ${mapViewport.south.toFixed(3)}` : 'none',
      },
      performance: {
        viewportCacheSize: viewportLoader.cache.size(),
        alertCacheSize: alertCache.size(),
        busCacheSize: busCache.size(),
        memoryUsage: memoryMonitor.getUsage()?.percentage.toFixed(1) + '%' || 'unknown',
      },
      dataHealth: {
        alertsLoaded: !loading && !error,
        busesLoaded: !busLoading && !busError,
      }
    });
  }, [allAlerts.length, visibleAlerts.length, workedOnAlerts.length, streetManagerAlerts.length, rawBusLocations?.length, visibleBuses.length, selectedBusId, busDataIsRealTime, allRoutes.length, highlightedRoutes.size, mapViewport, loading, error, busLoading, busError, viewportLoader]);

  return {
    // Alert data
    visibleAlerts,
    allAlerts,
    workedOnAlerts,
    streetManagerAlerts,
    
    // Bus data (Phase 3)
    visibleBuses,
    allBuses: rawBusLocations,
    selectedBusId,
    
    // Route data (Phase 3)
    allRoutes,
    highlightedRoutes: Array.from(highlightedRoutes),
    routeData,
    
    // Combined statistics (Phase 3)
    statistics: combinedStats,
    alertStats, // Legacy compatibility
    busStats,
    
    // Alert state management
    updateAlertState,
    
    // Bus interactions (Phase 3)
    selectBus,
    deselectBus,
    getBusById,
    getBusesForRoutes,
    refreshBusLocations,
    
    // Route interactions (Phase 3)
    highlightRoute,
    unhighlightRoute,
    clearHighlightedRoutes,
    
    // Raw data
    rawActiveAlerts,
    rawBusLocations,
    dismissedAlerts,
    activeSupervisors,
    syncState,
    
    // Status
    loading: loading || busLoading,
    error: error || busError,
    busDataIsRealTime,
    
    // Alert helpers (legacy compatibility)
    getAlertById: useCallback((id) => allAlerts.find(alert => alert.id === id), [allAlerts]),
    getAlertsByState: useCallback((state) => allAlerts.filter(alert => alert.alertState === state), [allAlerts]),
    getAlertsBySource: useCallback((source) => allAlerts.filter(alert => alert.source === source), [allAlerts]),
  };
};

/**
 * Hook for viewport-based filtering utilities
 */
export const useViewportFilter = () => {
  const filterByViewport = useCallback((items, viewport) => {
    if (!viewport || !items || !Array.isArray(items)) {
      return items || [];
    }

    return items.filter(item => {
      if (!item.coordinates || !Array.isArray(item.coordinates)) {
        return false;
      }

      const [lat, lng] = item.coordinates;
      
      return (
        lat >= viewport.south &&
        lat <= viewport.north &&
        lng >= viewport.west &&
        lng <= viewport.east
      );
    });
  }, []);

  const isInViewport = useCallback((coordinates, viewport) => {
    if (!viewport || !coordinates || !Array.isArray(coordinates)) {
      return false;
    }

    const [lat, lng] = coordinates;
    
    return (
      lat >= viewport.south &&
      lat <= viewport.north &&
      lng >= viewport.west &&
      lng <= viewport.east
    );
  }, []);

  const expandViewport = useCallback((viewport, factor = 1.1) => {
    if (!viewport) return null;

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
  }, []);

  return {
    filterByViewport,
    isInViewport,
    expandViewport,
  };
};

export default useLiveMapData;
