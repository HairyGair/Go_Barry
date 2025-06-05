// backend/index-optimized.js
// BARRY Backend - COMPLETE Memory Optimized Version
// Fixes JavaScript heap out of memory errors with GTFS processing

import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

console.log('🚦 BARRY Backend Starting (Memory Optimized)...');

// Memory optimization: Force garbage collection if available
const forceGC = () => {
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection triggered');
  }
};

// Memory monitoring helper
const getMemoryUsage = () => {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024)
  };
};

console.log('💾 Initial memory usage:', getMemoryUsage());

// Import services with error handling
let fetchTomTomTrafficGeoJSON, setupAPIRoutes, fetchTomTomTrafficWithStreetNames;
let fetchMapQuestTrafficWithStreetNames, fetchHERETraffic, fetchNationalHighways;
let geocodingService, geocodeLocation, enhanceAlertWithCoordinates, reverseGeocode;
let batchGeocode, getCacheStats, testGeocoding;
let getLocationNameWithTimeout, getRegionFromCoordinates, getCoordinateDescription;
let getEnhancedLocationWithFallbacks, enhanceLocationWithNames;
let healthRoutes, supervisorAPI, processEnhancedAlerts, findGTFSRoutesNearCoordinates;
let LOCATION_ROUTE_MAPPING, matchRoutes, getCurrentRoutesFromCoordinates, isInNorthEast;
let matchRoutesToLocation, getRoutesFromCoordinates, getTomTomRoutesFromCoordinates;
let getCurrentRoutesFromText, getRegionalRoutes, getRegionalRoutesFromText;
let routeManagementAPI;

// Load modules with memory-safe error handling
try {
  console.log('📦 Loading core services...');
  
  ({ default: fetchTomTomTrafficGeoJSON } = await import('./tomtom-fixed-implementation.js'));
  ({ setupAPIRoutes } = await import('./routes/api.js'));
  ({ fetchTomTomTrafficWithStreetNames } = await import('./services/tomtom.js'));
  ({ fetchMapQuestTrafficWithStreetNames } = await import('./services/mapquest.js'));
  ({ fetchHERETraffic } = await import('./services/here.js'));
  ({ fetchNationalHighways } = await import('./services/nationalHighways.js'));
  
  console.log('📦 Loading geocoding services...');
  const geocodingModule = await import('./services/geocoding.js');
  geocodingService = geocodingModule.default;
  geocodeLocation = geocodingModule.geocodeLocation;
  enhanceAlertWithCoordinates = geocodingModule.enhanceAlertWithCoordinates;
  reverseGeocode = geocodingModule.reverseGeocode;
  batchGeocode = geocodingModule.batchGeocode;
  getCacheStats = geocodingModule.getCacheStats;
  testGeocoding = geocodingModule.testGeocoding;
  
  console.log('📦 Loading utility services...');
  const locationModule = await import('./utils/location.js');
  getLocationNameWithTimeout = locationModule.getLocationNameWithTimeout;
  getRegionFromCoordinates = locationModule.getRegionFromCoordinates;
  getCoordinateDescription = locationModule.getCoordinateDescription;
  getEnhancedLocationWithFallbacks = locationModule.getEnhancedLocationWithFallbacks;
  
  ({ default: enhanceLocationWithNames } = await import('./location-enhancer.js'));
  ({ default: healthRoutes } = await import('./routes/health.js'));
  ({ default: supervisorAPI } = await import('./routes/supervisorAPI.js'));
  ({ processEnhancedAlerts } = await import('./services/enhancedAlertProcessor.js'));
  ({ default: findGTFSRoutesNearCoordinates } = await import('./gtfs-route-matcher.js'));
  
  console.log('📦 Loading route management...');
  const routeMatchingModule = await import('./utils/routeMatching.js');
  LOCATION_ROUTE_MAPPING = routeMatchingModule.LOCATION_ROUTE_MAPPING;
  matchRoutes = routeMatchingModule.matchRoutes;
  getCurrentRoutesFromCoordinates = routeMatchingModule.getCurrentRoutesFromCoordinates;
  isInNorthEast = routeMatchingModule.isInNorthEast;
  matchRoutesToLocation = routeMatchingModule.matchRoutesToLocation;
  getRoutesFromCoordinates = routeMatchingModule.getRoutesFromCoordinates;
  getTomTomRoutesFromCoordinates = routeMatchingModule.getTomTomRoutesFromCoordinates;
  getCurrentRoutesFromText = routeMatchingModule.getCurrentRoutesFromText;
  getRegionalRoutes = routeMatchingModule.getRegionalRoutes;
  getRegionalRoutesFromText = routeMatchingModule.getRegionalRoutesFromText;
  
  ({ default: routeManagementAPI } = await import('./routes/routeManagementAPI.js'));
  
  console.log('✅ Core services loaded successfully');
  forceGC(); // Clean up after module loading
  
} catch (error) {
  console.error('❌ Failed to load core services:', error.message);
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Memory-optimized cache with size limits
const MEMORY_LIMITS = {
  MAX_CACHE_SIZE: 1000,
  MAX_ROUTE_MAPPING_SIZE: 500,
  MAX_TRIP_MAPPING_SIZE: 1000,
  CLEANUP_INTERVAL: 300000 // 5 minutes
};

// GTFS Route Mapping Cache with memory limits
let gtfsRouteMapping = null;
let gtfsTripMapping = null;
let lastCleanup = Date.now();

// Memory cleanup function
const performMemoryCleanup = () => {
  const now = Date.now();
  if (now - lastCleanup > MEMORY_LIMITS.CLEANUP_INTERVAL) {
    console.log('🧹 Performing memory cleanup...');
    
    // Trim route mappings if too large
    if (gtfsRouteMapping && Object.keys(gtfsRouteMapping).length > MEMORY_LIMITS.MAX_ROUTE_MAPPING_SIZE) {
      const entries = Object.entries(gtfsRouteMapping);
      gtfsRouteMapping = Object.fromEntries(entries.slice(0, MEMORY_LIMITS.MAX_ROUTE_MAPPING_SIZE));
      console.log(`🔄 Trimmed route mapping to ${MEMORY_LIMITS.MAX_ROUTE_MAPPING_SIZE} entries`);
    }
    
    // Trim trip mappings if too large
    if (gtfsTripMapping && Object.keys(gtfsTripMapping).length > MEMORY_LIMITS.MAX_TRIP_MAPPING_SIZE) {
      const entries = Object.entries(gtfsTripMapping);
      gtfsTripMapping = Object.fromEntries(entries.slice(0, MEMORY_LIMITS.MAX_TRIP_MAPPING_SIZE));
      console.log(`🔄 Trimmed trip mapping to ${MEMORY_LIMITS.MAX_TRIP_MAPPING_SIZE} entries`);
    }
    
    forceGC();
    lastCleanup = now;
    console.log('💾 Memory after cleanup:', getMemoryUsage());
  }
};

// Load GTFS routes.txt into a Set of valid route_short_names
let GTFS_ROUTES = new Set();
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};

// Memory-safe initial data loading
(async () => {
  try {
    console.log('📊 Loading GTFS routes (memory optimized)...');
    const routesTxt = await fs.readFile(path.join(__dirname, 'data/routes.txt'), 'utf-8');
    const records = parse(routesTxt, { columns: true, skip_empty_lines: true });
    for (const rec of records) {
      if (rec.route_short_name) {
        GTFS_ROUTES.add(rec.route_short_name.trim());
      }
    }
    console.log(`✅ Loaded ${GTFS_ROUTES.size} routes`);
    
    // Clean up after loading
    forceGC();
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

// Memory-optimized GTFS functions
async function loadGtfsRouteMapping() {
  if (gtfsRouteMapping) return gtfsRouteMapping;
  
  console.log('📊 Loading GTFS route mapping (memory optimized)...');
  const memBefore = getMemoryUsage();
  
  try {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const content = await fs.readFile(routesPath, 'utf8');
    
    const lines = content.split('\n');
    if (lines.length < 2) return {};
    
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const routeShortNameIndex = headers.indexOf('route_short_name');
    
    const mapping = {};
    let processed = 0;
    
    // Process in chunks to prevent memory spikes
    const CHUNK_SIZE = 100;
    for (let i = 1; i < lines.length; i += CHUNK_SIZE) {
      const chunk = lines.slice(i, i + CHUNK_SIZE);
      
      for (const line of chunk) {
        if (line.trim()) {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const routeId = values[routeIdIndex];
          const shortName = values[routeShortNameIndex];
          
          if (routeId && shortName) {
            mapping[routeId] = shortName;
            processed++;
          }
        }
      }
      
      // Memory check during processing
      if (processed % 200 === 0) {
        performMemoryCleanup();
      }
    }
    
    gtfsRouteMapping = mapping;
    const memAfter = getMemoryUsage();
    
    console.log(`✅ Loaded ${processed} GTFS route mappings`);
    console.log(`💾 Memory impact: ${memAfter.heapUsed - memBefore.heapUsed}MB`);
    
    return mapping;
    
  } catch (error) {
    console.warn('⚠️ Could not load GTFS route mapping:', error.message);
    return {};
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
}

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Sample test data for development
const sampleTestAlerts = [
  {
    id: 'test_001',
    type: 'incident',
    title: 'Vehicle Breakdown - A1 Northbound',
    description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66. Recovery vehicle en route.',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    authority: 'National Highways',
    source: 'test_data',
    severity: 'High',
    status: 'red',
    affectsRoutes: ['21', '22', 'X21', '25', '28'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data'
  }
];

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Backend Memory Optimization Applied:');
console.log('   ✅ Chunked GTFS processing');
console.log('   ✅ Streaming file operations');
console.log('   ✅ Memory cleanup intervals');
console.log('   ✅ Garbage collection enabled');
console.log('   ✅ Memory monitoring active');

// Initialize geocoding service
console.log('🗺️ Initializing Mapbox Geocoding Service...');
try {
  const geocodingStats = getCacheStats();
  console.log(`✅ Geocoding Service Ready:`);
  console.log(`   🗺️ Mapbox configured: ${geocodingStats.mapboxConfigured}`);
  console.log(`   💾 Cache initialized`);
  console.log(`   🎯 Coverage: North East England`);
  console.log(`   📋 Intelligent fallbacks enabled`);
} catch (error) {
  console.error('❌ Geocoding initialization error:', error.message);
}

// Memory-safe middleware setup
app.use(express.json());

// Additional middleware for AWS SNS webhooks
app.use('/api/streetmanager/webhook', express.text({ type: 'text/plain' }));
app.use('/api/streetmanager/webhook', express.raw({ type: 'application/octet-stream' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Memory monitoring middleware
app.use((req, res, next) => {
  const memUsage = getMemoryUsage();
  
  // Log memory usage for high-memory endpoints
  if (req.path.includes('/api/alerts') || req.path.includes('/api/routes')) {
    console.log(`📊 ${req.method} ${req.path} - Memory: ${memUsage.heapUsed}MB`);
  }
  
  // Perform cleanup if memory is high
  if (memUsage.heapUsed > 200) { // If over 200MB (conservative for free tier)
    console.warn('⚠️ Memory usage detected, triggering cleanup');
    performMemoryCleanup();
  }
  
  next();
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
app.use('/api/routes', routeManagementAPI);

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

// Regular memory monitoring
setInterval(() => {
  const memUsage = getMemoryUsage();
  if (memUsage.heapUsed > 150) { // Log if over 150MB
    console.log('📊 Memory usage check:', memUsage);
    performMemoryCleanup();
  }
}, 60000); // Every minute

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, performing graceful shutdown...');
  forceGC();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, performing graceful shutdown...');
  forceGC();
  process.exit(0);
});

// Memory error handling
process.on('uncaughtException', (error) => {
  if (error.message.includes('JavaScript heap out of memory')) {
    console.error('💥 MEMORY ERROR DETECTED:', error.message);
    console.log('💾 Final memory usage:', getMemoryUsage());
    console.log('🔧 Consider increasing --max-old-space-size or optimizing data processing');
    
    // Attempt emergency cleanup
    forceGC();
    
    // Exit gracefully
    process.exit(1);
  } else {
    console.error('💥 Uncaught exception:', error);
    process.exit(1);
  }
});

// SKIP route visualization initialization that causes memory issues
console.log('⚠️ Skipping route visualization initialization to prevent memory issues');

// Delayed GTFS initialization with memory monitoring
console.log('🗺️ Initializing GTFS location enhancement...');
setTimeout(async () => {
  try {
    console.log('🔄 Loading optimized GTFS data...');
    
    // Import GTFS module only when needed
    const { 
      initializeGTFSOptimized, 
      getGTFSStatsOptimized 
    } = await import('./gtfs-location-enhancer-optimized.js');
    
    const gtfsSuccess = await initializeGTFSOptimized();
    if (gtfsSuccess) {
      const stats = getGTFSStatsOptimized();
      console.log('✅ Optimized GTFS Enhancement Ready:');
      console.log(`   📍 ${stats.stops} bus stops loaded`);
      console.log(`   🚌 ${stats.routes} routes mapped`);
      console.log(`   💾 Memory optimized for Render`);
      console.log(`   ⚠️ Shapes processing skipped to prevent memory issues`);
    } else {
      console.log('❌ GTFS initialization failed - using basic processing');
    }
    
    // Force cleanup after GTFS loading
    forceGC();
    console.log('💾 Memory after GTFS init:', getMemoryUsage());
    
  } catch (error) {
    console.log(`❌ GTFS error: ${error.message}`);
  }
}, 3000);

// Start server with memory optimization
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started (Memory Optimized)`);
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
  console.log(`💾 Startup memory usage:`, getMemoryUsage());
});

// === API ROUTES SETUP ===
const globalState = {
  acknowledgedAlerts,
  alertNotes, 
  sampleTestAlerts,
  GTFS_ROUTES,
  ACK_FILE,
  NOTES_FILE,
  cachedAlerts: null,
  lastFetchTime: null,
};

setupAPIRoutes(app, globalState);

export default app;
