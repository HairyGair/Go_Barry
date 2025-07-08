/*
 * useBusLocations.js
 * Phase 3: Bus Location Integration Hook
 * 
 * React hook for managing real-time bus location data
 * Integrates with backend bus location service and optional Convex sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// FIXED: Make Convex imports optional to prevent module resolution errors
let useQuery, api;
try {
  const convexReact = require('convex/react');
  useQuery = convexReact.useQuery;
  
  // Try multiple import paths for the API from this component's location
  try {
    // First try the calculated relative path
    const convexApi = require('../../../convex/_generated/api');
    api = convexApi.api;
  } catch (apiError1) {
    try {
      // Try with .js extension
      const convexApi = require('../../../convex/_generated/api.js');
      api = convexApi.api;
    } catch (apiError2) {
      try {
        // Try alternative relative path
        const convexApi = require('../../../../convex/_generated/api');
        api = convexApi.api;
      } catch (apiError3) {
        console.log('⚠️ Convex API not found at any expected path - using backend API only');
        console.log('  Tried paths:', {
          path1: '../../../convex/_generated/api',
          path2: '../../../convex/_generated/api.js',
          path3: '../../../../convex/_generated/api'
        });
        api = null;
      }
    }
  }
  
  if (api) {
    console.log('🎯 Convex integration available for bus locations');
  }
} catch (convexError) {
  console.log('⚠️ Convex not available - using backend API only');
  useQuery = null;
  api = null;
}

// Use production backend for both dev and production
const BACKEND_URL = 'https://go-barry.onrender.com';

const CACHE_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Generate mock bus data for development
const generateMockBusData = () => {
  const routes = ['21', 'X21', '1', '56', '57', '58', 'Q3', '307'];
  const mockBuses = [];
  
  // Newcastle/Gateshead area bounds
  const bounds = {
    north: 55.0184,
    south: 54.9045,
    east: -1.4876,
    west: -1.7297
  };
  
  for (let i = 0; i < 15; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    const delay = Math.random() < 0.7 ? Math.floor(Math.random() * 300) : 0; // 70% have some delay
    const bearing = Math.floor(Math.random() * 360);
    
    mockBuses.push({
      id: `mock-bus-${i}`,
      vehicleRef: `GNE-${1000 + i}`,
      routeName: route,
      lineRef: route,
      coordinates: [lat, lng],
      heading: bearing,
      bearing: bearing, // Add bearing for rotation
      delay: delay,
      status: delay > 180 ? 'delayed' : delay > 60 ? 'minor-delay' : 'on-time',
      lastUpdate: Date.now() - Math.floor(Math.random() * 60000), // Within last minute
      operatorRef: 'GONE',
      destination: `${route} Destination`,
      occupancy: Math.random() < 0.5 ? 'seatsAvailable' : 'standingAvailable'
    });
  }
  
  return mockBuses;
};

export const useBusLocations = () => {
  const [busLocations, setBusLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [statistics, setStatistics] = useState({
    totalBuses: 0,
    activeBuses: 0,
    delayedBuses: 0,
    uniqueRoutes: 0,
    lastUpdate: null
  });

  const retryCountRef = useRef(0);
  const intervalRef = useRef(null);
  const cacheRef = useRef({ data: null, timestamp: null });

  // Get bus locations from Convex (real-time) - OPTIONAL
  let convexBusLocations = null;
  let convexBusStats = null;
  
  try {
    if (useQuery && api?.sync?.getBusLocations) {
      convexBusLocations = useQuery(api.sync.getBusLocations);
      console.log('📡 Convex bus locations query active');
    }
  } catch (convexError) {
    console.log('⚠️ Convex bus locations query failed:', convexError.message);
  }
  
  try {
    if (useQuery && api?.sync?.getBusLocationStats) {
      convexBusStats = useQuery(api.sync.getBusLocationStats);
    }
  } catch (convexError) {
    console.log('⚠️ Convex bus stats query failed:', convexError.message);
  }

  // Fetch bus locations from backend API
  const fetchBusLocations = useCallback(async (forceRefresh = false) => {
    if (Platform.OS !== 'web') return { success: false, error: 'Not supported on mobile' };
    
    // TEMPORARY: Use mock data if backend fails
    const USE_MOCK_DATA = false;

    // Check cache
    const now = Date.now();
    if (!forceRefresh && cacheRef.current.data && cacheRef.current.timestamp) {
      const cacheAge = now - cacheRef.current.timestamp;
      if (cacheAge < CACHE_TIMEOUT) {
        console.log(`🚌 Using cached bus data (${Math.round(cacheAge/1000)}s old)`);
        return cacheRef.current.data;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚌 Fetching bus locations from backend...');
      
      const response = await fetch(`${BACKEND_URL}/api/bus-locations?forceRefresh=${forceRefresh}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const rawBuses = result.buses || [];
        console.log(`✅ Fetched ${rawBuses.length} bus locations from backend`);
        
        // Transform backend format to frontend format
        const buses = rawBuses.map(bus => ({
          id: bus.id,
          busId: bus.id,
          vehicleRef: bus.id,
          operatorRef: bus.operatorRef,
          routeName: bus.lineName || bus.lineRef,
          lineRef: bus.lineRef,
          coordinates: bus.location ? [bus.location.lat, bus.location.lon] : [0, 0],
          bearing: bus.bearing || 0,
          heading: bus.bearing || 0,
          delay: bus.delay || 0,
          status: bus.status || 'unknown',
          lastUpdate: Date.now(),
          destination: bus.destinationName || 'Unknown',
          directionName: bus.directionRef,
          occupancy: bus.occupancy
        }));
        
        console.log(`🔄 Transformed ${buses.length} buses for map display`);
        
        // Update cache
        cacheRef.current = {
          data: { ...result, buses },
          timestamp: now
        };
        
        // Reset retry count on success
        retryCountRef.current = 0;
        
        setBusLocations(buses);
        setLastUpdated(result.metadata?.timestamp || now);
        
        return { ...result, buses };
      } else {
        throw new Error(result.error || 'Failed to fetch bus locations');
      }
    } catch (fetchError) {
      console.error('❌ Bus locations fetch error:', fetchError);
      setError(fetchError.message);
      
      // Use cached data if available
      if (cacheRef.current.data) {
        console.warn('🚌 Using stale cached bus data due to fetch error');
        setBusLocations(cacheRef.current.data.buses || []);
        return cacheRef.current.data;
      }
      
      // Fallback to mock data if enabled or in development
      if (USE_MOCK_DATA || process.env.NODE_ENV === 'development') {
        console.warn('🚌 Using mock bus data (backend failed)');
        const mockBuses = generateMockBusData();
        setBusLocations(mockBuses);
        setLastUpdated(Date.now());
        
        // Update statistics for mock data
        const mockStats = {
          totalBuses: mockBuses.length,
          activeBuses: mockBuses.length,
          delayedBuses: mockBuses.filter(b => b.status === 'delayed').length,
          uniqueRoutes: new Set(mockBuses.map(b => b.routeName)).size,
          lastUpdate: Date.now()
        };
        setStatistics(mockStats);
        
        return { success: true, buses: mockBuses, cached: false, timestamp: Date.now() };
      }
      
      return { success: false, error: fetchError.message, buses: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bus statistics
  const fetchBusStatistics = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/bus-locations/stats`, {
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
      console.warn('⚠️ Failed to fetch bus statistics:', error.message);
    }
  }, []);

  // Refresh bus locations
  const refreshBusLocations = useCallback(async () => {
    console.log('🔄 Manually refreshing bus locations...');
    return await fetchBusLocations(true);
  }, [fetchBusLocations]);

  // Retry logic
  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++;
      console.log(`🔄 Scheduling bus location retry ${retryCountRef.current}/${MAX_RETRIES} in ${RETRY_DELAY/1000}s...`);
      
      setTimeout(() => {
        fetchBusLocations(false);
      }, RETRY_DELAY);
    } else {
      console.warn('❌ Max retries reached for bus locations');
    }
  }, [fetchBusLocations]);

  // Use Convex data if available (preferred for real-time updates)
  useEffect(() => {
    if (convexBusLocations && Array.isArray(convexBusLocations)) {
      console.log(`🎯 Using Convex bus locations: ${convexBusLocations.length} buses`);
      setBusLocations(convexBusLocations);
      setLastUpdated(Date.now());
      setError(null);
    }
  }, [convexBusLocations]);

  // Use Convex statistics if available
  useEffect(() => {
    if (convexBusStats) {
      console.log('📊 Using Convex bus statistics');
      setStatistics(convexBusStats);
    }
  }, [convexBusStats]);

  // Initial load and periodic updates
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('[useBusLocations] Initializing bus location updates...');
    console.log('[useBusLocations] Convex available:', !!convexBusLocations);

    // Initial load (only if no Convex data)
    if (!convexBusLocations) {
      console.log('[useBusLocations] No Convex data, fetching from backend/mock...');
      fetchBusLocations(false);
      fetchBusStatistics();
    } else {
      console.log('[useBusLocations] Using Convex bus data');
    }

    // Set up periodic updates (backup to Convex)
    intervalRef.current = setInterval(() => {
      if (!convexBusLocations) {
        fetchBusLocations(false);
        fetchBusStatistics();
      }
    }, CACHE_TIMEOUT);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchBusLocations, fetchBusStatistics, convexBusLocations]);

  // Filter buses by route
  const getBusesByRoute = useCallback((routeIds) => {
    if (!Array.isArray(routeIds)) return [];
    
    return busLocations.filter(bus => {
      const busRoute = bus.routeName || bus.lineRef;
      return routeIds.some(route => 
        busRoute === route || 
        busRoute === String(route)
      );
    });
  }, [busLocations]);

  // Get buses within viewport bounds
  const getBusesInViewport = useCallback((bounds) => {
    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return busLocations;
    }

    return busLocations.filter(bus => {
      const coordinates = bus.coordinates;
      if (!coordinates || coordinates.length < 2) return false;
      
      const [lat, lng] = coordinates;
      return lat >= bounds.south && lat <= bounds.north &&
             lng >= bounds.west && lng <= bounds.east;
    });
  }, [busLocations]);

  // Get bus by ID
  const getBusById = useCallback((busId) => {
    return busLocations.find(bus => 
      (bus.id || bus.busId) === busId || 
      bus.vehicleRef === busId
    );
  }, [busLocations]);

  // Calculate derived statistics
  const derivedStats = {
    dataSource: convexBusLocations ? 'Convex (Real-time)' : 'Backend API',
    isRealTime: !!convexBusLocations,
    convexAvailable: !!(useQuery && api),
    cacheAge: lastUpdated ? Date.now() - lastUpdated : null,
    hasData: busLocations.length > 0,
    routeBreakdown: busLocations.reduce((acc, bus) => {
      const route = bus.routeName || bus.lineRef || 'Unknown';
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {}),
    delayDistribution: {
      onTime: busLocations.filter(b => (b.delay || 0) <= 60).length,
      delayed: busLocations.filter(b => (b.delay || 0) > 60 && (b.delay || 0) <= 300).length,
      severelyDelayed: busLocations.filter(b => (b.delay || 0) > 300).length,
    }
  };

  return {
    // Data
    busLocations,
    statistics: { ...statistics, ...derivedStats },
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshBusLocations,
    
    // Utilities
    getBusesByRoute,
    getBusesInViewport,
    getBusById,
    
    // Meta
    isRealTime: !!convexBusLocations,
    dataSource: convexBusLocations ? 'Convex' : 'Backend',
    convexAvailable: !!(useQuery && api)
  };
};

export default useBusLocations;
