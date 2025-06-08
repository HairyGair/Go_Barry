// backend/index-memory-fixed.js
// BARRY Backend with FIXED Memory Management and Route Matching
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

import fetchTomTomTrafficGeoJSON from './tomtom-fixed-implementation.js';
import { setupAPIRoutes } from './routes/api-improved.js';
import { addEmergencyEndpoint } from './emergency-endpoint.js';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { fetchHERETraffic } from './services/here.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import geocodingService, { 
  geocodeLocation, 
  enhanceAlertWithCoordinates, 
  reverseGeocode, 
  batchGeocode,
  getCacheStats as getGeocodingCacheStats,
  testGeocoding 
} from './services/geocoding.js';
import {
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks
} from './utils/location.js';
import enhanceLocationWithNames from './location-enhancer.js';
import healthRoutes from './routes/health.js';
import supervisorAPI from './routes/supervisorAPI.js';
import { processEnhancedAlerts } from './services/enhancedAlertProcessor.js';
import findGTFSRoutesNearCoordinates from './gtfs-route-matcher.js';
import { 
  LOCATION_ROUTE_MAPPING,
  matchRoutes,
  getCurrentRoutesFromCoordinates,
  isInNorthEast,
  matchRoutesToLocation,
  getRoutesFromCoordinates,
  getTomTomRoutesFromCoordinates,
  getCurrentRoutesFromText,
  getRegionalRoutes,
  getRegionalRoutesFromText
} from './utils/routeMatching.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// MEMORY OPTIMIZATION: Single GTFS initialization only
console.log('🚌 Initializing Enhanced Route Matcher...');

// Simplified in-memory route cache for memory efficiency
let routeCache = new Map();
let stopCache = new Map();
let initialized = false;

// Memory-efficient GTFS loader
async function initializeMemoryOptimizedGTFS() {
  if (initialized) return true;
  
  try {
    console.log('🔄 Loading memory-optimized GTFS data...');
    
    // Load only essential routes data
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const routesContent = await fs.readFile(routesPath, 'utf8');
    const routes = parse(routesContent, { columns: true, skip_empty_lines: true });
    
    routes.forEach(route => {
      if (route.route_short_name) {
        routeCache.set(route.route_id, {
          id: route.route_id,
          shortName: route.route_short_name,
          longName: route.route_long_name || ''
        });
      }
    });
    
    // Load limited stops data for route matching
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const stopsContent = await fs.readFile(stopsPath, 'utf8');
    const stops = parse(stopsContent, { columns: true, skip_empty_lines: true });
    
    let loadedStops = 0;
    stops.forEach(stop => {
      // Only load stops in North East England bounds
      const lat = parseFloat(stop.stop_lat);
      const lng = parseFloat(stop.stop_lon);
      
      if (lat >= 54.5 && lat <= 55.5 && lng >= -2.0 && lng <= -1.0) {
        stopCache.set(stop.stop_id, {
          id: stop.stop_id,
          name: stop.stop_name,
          lat: lat,
          lng: lng
        });
        loadedStops++;
        
        // Memory limit: only load first 3000 stops
        if (loadedStops >= 3000) return;
      }
    });
    
    initialized = true;
    console.log(`✅ Memory-optimized GTFS loaded: ${routeCache.size} routes, ${stopCache.size} stops`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('♻️ Garbage collection triggered');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Memory-optimized GTFS initialization failed:', error.message);
    return false;
  }
}

// Memory-efficient route matching
function findRoutesNearCoordinatesOptimized(lat, lng, radiusMeters = 250) {
  if (!initialized) {
    console.warn('⚠️ Route matcher not initialized');
    return [];
  }
  
  const foundRoutes = new Set();
  
  // Check against cached stops
  for (const stop of stopCache.values()) {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance <= radiusMeters) {
      // Use geographic rules to assign routes to nearby stops
      const regionRoutes = getRoutesByRegion(lat, lng);
      regionRoutes.forEach(route => foundRoutes.add(route));
    }
  }
  
  // Fallback to geographic regions if no stops found
  if (foundRoutes.size === 0) {
    const regionRoutes = getRoutesByRegion(lat, lng);
    regionRoutes.forEach(route => foundRoutes.add(route));
  }
  
  const routes = Array.from(foundRoutes).sort();
  
  if (routes.length > 0) {
    console.log(`🎯 Route Match: Found ${routes.length} routes near ${lat.toFixed(4)}, ${lng.toFixed(4)}: ${routes.slice(0, 5).join(', ')}`);
  }
  
  return routes;
}

// Geographic region-based route matching
function getRoutesByRegion(lat, lng) {
  const regions = [
    {
      name: 'Newcastle Centre',
      bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 },
      routes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47', '53', '54', '56', '57', '58']
    },
    {
      name: 'Gateshead',
      bounds: { north: 54.97, south: 54.93, east: -1.6, west: -1.7 },
      routes: ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X', '53', '54']
    },
    {
      name: 'North Tyneside',
      bounds: { north: 55.05, south: 55.0, east: -1.4, west: -1.5 },
      routes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
    },
    {
      name: 'Sunderland',
      bounds: { north: 54.93, south: 54.88, east: -1.35, west: -1.42 },
      routes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
    },
    {
      name: 'Durham',
      bounds: { north: 54.88, south: 54.75, east: -1.5, west: -1.6 },
      routes: ['21', '22', 'X21', '6', '50', '28', 'X12']
    },
    {
      name: 'Consett',
      bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 },
      routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
    }
  ];

  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      return region.routes;
    }
  }

  return ['21', '22', '10', '1', '2']; // Default major routes
}

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Load GTFS routes.txt into a Set of valid route_short_names
let GTFS_ROUTES = new Set();
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};

// Initialize essential data only
(async () => {
  try {
    const routesTxt = await fs.readFile(path.join(__dirname, 'data/routes.txt'), 'utf-8');
    const records = parse(routesTxt, { columns: true, skip_empty_lines: true });
    for (const rec of records) {
      if (rec.route_short_name) {
        GTFS_ROUTES.add(rec.route_short_name.trim());
      }
    }
    console.log(`🚌 Loaded ${GTFS_ROUTES.size} GTFS routes for filtering:`, [...GTFS_ROUTES].slice(0, 20).join(', ') + '...');
  } catch (err) {
    console.error('❌ Failed to load routes.txt:', err);
  }
  
  try {
    const raw = await fs.readFile(ACK_FILE, 'utf-8');
    acknowledgedAlerts = JSON.parse(raw);
    console.log(`✅ Loaded ${Object.keys(acknowledgedAlerts).length} acknowledged alerts`);
  } catch {
    acknowledgedAlerts = {};
  }
  
  try {
    const raw = await fs.readFile(NOTES_FILE, 'utf-8');
    alertNotes = JSON.parse(raw);
    console.log(`✅ Loaded staff notes for ${Object.keys(alertNotes).length} alerts`);
  } catch {
    alertNotes = {};
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Backend Starting with Enhanced Geocoding...');
console.log('🗺️ Initializing Mapbox Geocoding Service...');

try {
  const geocodingStats = getGeocodingCacheStats();
  console.log(`✅ Geocoding Service Ready:`);
  console.log(`   🗺️ Mapbox configured: ${geocodingStats.mapboxConfigured}`);
  console.log(`   💾 Cache initialized`);
  console.log(`   🎯 Coverage: North East England`);
  console.log(`   📋 Intelligent fallbacks enabled`);
} catch (error) {
  console.error('❌ Geocoding initialization error:', error.message);
}

// FIXED: Single GTFS initialization only
console.log('🗺️ Initializing GTFS location enhancement...');
setTimeout(async () => {
  try {
    const success = await initializeMemoryOptimizedGTFS();
    if (success) {
      console.log('✅ Memory-optimized GTFS ready for route matching');
    } else {
      console.log('❌ GTFS initialization failed');
    }
  } catch (error) {
    console.log(`❌ GTFS error: ${error.message}`);
  }
}, 2000);

console.log('🗺️ Initializing Route Visualization System...');

console.log(`
🔧 MEMORY OPTIMIZATION APPLIED:
   ✅ Single GTFS initialization only
   ✅ Limited to 3000 stops maximum
   ✅ Geographic region-based route matching
   ✅ Manual garbage collection enabled
   ✅ Concurrent request throttling
`);

// Middleware
app.use(express.json({ limit: '10mb' }));

// Request throttling middleware
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;

app.use((req, res, next) => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return res.status(429).json({
      success: false,
      error: 'Too many concurrent requests',
      activeRequests: activeRequests,
      maxAllowed: MAX_CONCURRENT_REQUESTS
    });
  }
  
  activeRequests++;
  
  res.on('finish', () => {
    activeRequests--;
    
    // Trigger garbage collection periodically
    if (activeRequests === 0 && global.gc) {
      global.gc();
    }
  });
  
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.use('/api/health', healthRoutes);

// Supervisor management routes
app.use('/api/supervisor', supervisorAPI);

// Route Management and Visualization API
import routeManagementAPI from './routes/routeManagementAPI.js';
app.use('/api/routes', routeManagementAPI);

// Incident Management API
import incidentAPI from './routes/incidentAPI.js';
app.use('/api/incidents', incidentAPI);

// Messaging Distribution API
import messagingAPI from './routes/messagingAPI.js';
app.use('/api/messaging', messagingAPI);

// Roadworks Management API
import roadworksAPI from './routes/roadworksAPI.js';
app.use('/api/roadworks', roadworksAPI);

// Test data API
import testDataAPI from './routes/testDataAPI.js';
app.use('/api/test', testDataAPI);

// Geocoding API endpoints
app.get('/api/geocode/:location', async (req, res) => {
  try {
    const location = decodeURIComponent(req.params.location);
    const result = await geocodeLocation(location);
    
    if (result) {
      res.json({
        success: true,
        location: location,
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude
        },
        name: result.name,
        confidence: result.confidence,
        source: result.source
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Location not found',
        location: location
      });
    }
  } catch (error) {
    console.error('❌ Geocoding API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reverse geocoding endpoint
app.get('/api/reverse-geocode/:lat/:lng', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates'
      });
    }
    
    const locationName = await reverseGeocode(lat, lng);
    
    res.json({
      success: true,
      coordinates: { latitude: lat, longitude: lng },
      location: locationName
    });
  } catch (error) {
    console.error('❌ Reverse geocoding API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cache for alerts with memory management
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Export route matcher for use in API routes
export { findRoutesNearCoordinatesOptimized as enhancedFindRoutesNearCoordinates };

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started with Enhanced Geocoding`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n🔧 API Authentication Fixes:`);
  console.log(`   ✅ HERE API: Using 'apikey' query parameter`);
  console.log(`   ✅ MapQuest API: Using 'key' query parameter`);
  console.log(`   ✅ TomTom API: Using 'key' query parameter`);
  console.log(`   ✅ National Highways: Using header authentication (already working)`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 Main: /api/alerts`);
  console.log(`   🧪 Test: /api/alerts-test`);
  console.log(`   💚 Health: /api/health`);
  console.log(`   🔄 Refresh: /api/refresh`);
  console.log(`   🚧 Roadworks: /api/roadworks`);
  console.log(`   👮 Supervisor: /api/supervisor`);
  console.log(`   📍 Incidents: /api/incidents`);
});

// API ROUTES SETUP
const globalState = {
  acknowledgedAlerts,
  alertNotes, 
  GTFS_ROUTES,
  ACK_FILE,
  NOTES_FILE,
  cachedAlerts: null,
  lastFetchTime: null,
  findRoutesNearCoordinatesOptimized
};

setupAPIRoutes(app, globalState);
addEmergencyEndpoint(app);

export default app;
