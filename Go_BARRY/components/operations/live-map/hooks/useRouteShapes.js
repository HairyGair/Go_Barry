/*
 * useRouteShapes.js
 * Phase 3: GTFS Route Shapes Integration Hook
 * 
 * React hook for managing GTFS route shape data
 * Provides accurate route geometry for Live Map visualization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// Use production backend for both dev and production
const BACKEND_URL = 'https://go-barry.onrender.com';
const CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds

export const useRouteShapes = () => {
  const [routeShapes, setRouteShapes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statistics, setStatistics] = useState({
    routeCount: 0,
    shapeCount: 0,
    isInitialized: false,
    routeTypes: {}
  });

  const retryCountRef = useRef(0);
  const cacheRef = useRef({ data: null, timestamp: null });

  // Fetch all route shapes from backend
  const fetchAllRouteShapes = useCallback(async (forceRefresh = false) => {
    if (Platform.OS !== 'web') return { success: false, error: 'Not supported on mobile' };

    // Check cache
    const now = Date.now();
    if (!forceRefresh && cacheRef.current.data && cacheRef.current.timestamp) {
      const cacheAge = now - cacheRef.current.timestamp;
      if (cacheAge < CACHE_TIMEOUT) {
        console.log(`🗺️ Using cached route shapes (${Math.round(cacheAge/1000)}s old)`);
        return cacheRef.current.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🗺️ Fetching GTFS route shapes from backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/route-shapes`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 20000 // 20 second timeout for large GTFS data
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const routes = result.routes || [];
        console.log(`✅ Fetched ${routes.length} GTFS route shapes`);
        
        // Update cache
        cacheRef.current = {
          data: result,
          timestamp: now
        };
        
        // Reset retry count on success
        retryCountRef.current = 0;
        
        setRouteShapes(routes);
        setLastUpdated(result.metadata?.timestamp || now);
        
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch route shapes');
      }
    } catch (fetchError) {
      console.error('❌ Route shapes fetch error:', fetchError);
      setError(fetchError.message);
      
      // Use cached data if available
      if (cacheRef.current.data) {
        console.warn('🗺️ Using stale cached route shapes due to fetch error');
        setRouteShapes(cacheRef.current.data.routes || []);
        return cacheRef.current.data;
      }
      
      return { success: false, error: fetchError.message, routes: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch specific route shapes
  const fetchRouteShapes = useCallback(async (routeNames) => {
    if (Platform.OS !== 'web' || !Array.isArray(routeNames) || routeNames.length === 0) {
      return { success: false, error: 'Invalid parameters', routes: [] };
    }

    try {
      console.log(`🗺️ Fetching shapes for routes: ${routeNames.join(', ')}`);
      
      const response = await fetch(`${BACKEND_URL}/api/route-shapes/by-routes`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routes: routeNames }),
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Fetched ${result.routes.length}/${routeNames.length} route shapes`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch specific route shapes');
      }
    } catch (error) {
      console.error('❌ Specific route shapes fetch error:', error);
      return { success: false, error: error.message, routes: [] };
    }
  }, []);

  // Fetch routes within viewport bounds
  const fetchRoutesInBounds = useCallback(async (bounds) => {
    if (Platform.OS !== 'web' || !bounds) {
      return { success: false, error: 'Invalid bounds', routes: [] };
    }

    try {
      console.log('🗺️ Fetching routes in viewport bounds...');
      
      const response = await fetch(`${BACKEND_URL}/api/route-shapes/in-bounds`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bounds }),
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Found ${result.routes.length} routes in viewport`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to fetch routes in bounds');
      }
    } catch (error) {
      console.error('❌ Routes in bounds fetch error:', error);
      return { success: false, error: error.message, routes: [] };
    }
  }, []);

  // Find routes near coordinates
  const findRoutesNear = useCallback(async (lat, lng, radius = 250) => {
    if (Platform.OS !== 'web' || isNaN(lat) || isNaN(lng)) {
      return { success: false, error: 'Invalid coordinates', routes: [] };
    }

    try {
      console.log(`🗺️ Finding routes near ${lat.toFixed(4)}, ${lng.toFixed(4)}...`);
      
      const response = await fetch(`${BACKEND_URL}/api/route-shapes/near/${lat}/${lng}?radius=${radius}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Found ${result.routes.length} routes near coordinates`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to find routes near coordinates');
      }
    } catch (error) {
      console.error('❌ Routes near coordinates fetch error:', error);
      return { success: false, error: error.message, routes: [] };
    }
  }, []);

  // Fetch route shapes statistics
  const fetchStatistics = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/route-shapes/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatistics(result.statistics);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch route shapes statistics:', error.message);
    }
  }, []);

  // Refresh route shapes
  const refreshRouteShapes = useCallback(async () => {
    console.log('🔄 Manually refreshing route shapes...');
    return await fetchAllRouteShapes(true);
  }, [fetchAllRouteShapes]);

  // Get route shape by name
  const getRouteShape = useCallback((routeName) => {
    return routeShapes.find(route => 
      route.routeName === routeName || 
      route.routeId === routeName
    );
  }, [routeShapes]);

  // Get multiple route shapes
  const getRouteShapes = useCallback((routeNames) => {
    if (!Array.isArray(routeNames)) return [];
    
    return routeNames
      .map(routeName => getRouteShape(routeName))
      .filter(route => route !== undefined);
  }, [getRouteShape]);

  // Filter routes by type
  const getRoutesByType = useCallback((routeType) => {
    return routeShapes.filter(route => route.type === routeType);
  }, [routeShapes]);

  // Filter routes by color pattern
  const getRoutesByColor = useCallback((colorPattern) => {
    return routeShapes.filter(route => 
      route.color && route.color.toLowerCase().includes(colorPattern.toLowerCase())
    );
  }, [routeShapes]);

  // Calculate route statistics
  const getRouteStats = useCallback(() => {
    const stats = {
      total: routeShapes.length,
      byType: {},
      byColor: {},
      hasCoordinates: 0,
      avgCoordinatesPerRoute: 0
    };

    let totalCoordinates = 0;

    routeShapes.forEach(route => {
      // Count by type
      const type = route.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by color
      const color = route.color || 'unknown';
      stats.byColor[color] = (stats.byColor[color] || 0) + 1;

      // Count coordinates
      if (route.coordinates && route.coordinates.length > 0) {
        stats.hasCoordinates++;
        totalCoordinates += route.coordinates.length;
      }
    });

    stats.avgCoordinatesPerRoute = stats.hasCoordinates > 0 
      ? Math.round(totalCoordinates / stats.hasCoordinates) 
      : 0;

    return stats;
  }, [routeShapes]);

  // Initial load
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    fetchAllRouteShapes(false);
    fetchStatistics();
  }, [fetchAllRouteShapes, fetchStatistics]);

  return {
    // Data
    routeShapes,
    statistics,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    fetchAllRouteShapes,
    fetchRouteShapes,
    fetchRoutesInBounds,
    findRoutesNear,
    refreshRouteShapes,
    
    // Utilities
    getRouteShape,
    getRouteShapes,
    getRoutesByType,
    getRoutesByColor,
    getRouteStats,
    
    // Meta
    hasData: routeShapes.length > 0,
    cacheAge: lastUpdated ? Date.now() - lastUpdated : null
  };
};

export default useRouteShapes;
