// backend/index.js
// BARRY Backend with Memory Optimization and Fixed Route Matching
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

// Import working services
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import healthRoutes from './routes/health.js';
import supervisorAPI from './routes/supervisorAPI.js';
import roadworksAPI from './routes/roadworksAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY Backend Starting with Memory Optimization...');

// Simple working route matching function
function findRoutesNearCoordinatesFixed(lat, lng, radiusMeters = 250) {
  const foundRoutes = new Set();
  
  // Geographic region-based route matching for Go North East
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
      routes: ['21', '22', 'X21', '6', '50', '28']
    },
    {
      name: 'Consett',
      bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 },
      routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
    }
  ];

  // Find matching region
  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      region.routes.forEach(route => foundRoutes.add(route));
      break;
    }
  }

  // If no specific region, use major routes as fallback
  if (foundRoutes.size === 0) {
    ['21', '22', '10', '1', '2', 'Q3'].forEach(route => foundRoutes.add(route));
  }

  const routes = Array.from(foundRoutes).sort();
  
  if (routes.length > 0) {
    console.log(`🎯 Route Match: Found ${routes.length} routes near ${lat.toFixed(4)}, ${lng.toFixed(4)}: ${routes.slice(0, 5).join(', ')}`);
  }
  
  return routes;
}

// Load GTFS routes data
let GTFS_ROUTES = new Set();
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};

// Initialize essential data
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

console.log(`
🔧 MEMORY OPTIMIZATION APPLIED:
   ✅ Single GTFS initialization only
   ✅ Request throttling enabled
   ✅ Geographic region-based route matching
   ✅ Manual garbage collection enabled
   ✅ Reduced memory footprint
`);

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
      setTimeout(() => {
        if (global.gc) {
          global.gc();
          console.log('♻️ Garbage collection triggered');
        }
      }, 1000);
    }
  });
  
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));

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

// Roadworks management routes
app.use('/api/roadworks', roadworksAPI);

// Memory-optimized sample data filter
function optimizedSampleDataFilter(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  console.log(`🔍 [OPTIMIZED] Starting filter with ${alerts.length} alerts`);
  
  const filtered = alerts.filter(alert => {
    if (!alert || typeof alert !== 'object') return false;
    
    // Only filter out obvious test data
    const id = (alert.id || '').toString().toLowerCase();
    const source = (alert.source || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    
    const isTestData = (
      id.includes('test_data') ||
      id.includes('sample_test') ||
      title.includes('test alert') ||
      source === 'test_system'
    );
    
    if (isTestData) {
      console.log(`🗑️ [OPTIMIZED] Filtered test alert: ${id}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`✅ [OPTIMIZED] Filter result: ${alerts.length} → ${filtered.length} alerts`);
  return filtered;
}

// Memory-optimized alert processing
async function processAlertsOptimized(alerts) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return [];
  }
  
  const processed = [];
  
  for (const alert of alerts) {
    try {
      // Ensure alert has route matching
      if (!alert.affectsRoutes || alert.affectsRoutes.length === 0) {
        if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
          const [lat, lng] = alert.coordinates;
          alert.affectsRoutes = findRoutesNearCoordinatesFixed(lat, lng);
          alert.routeMatchMethod = 'Post-processed';
        }
      }
      
      // Ensure alert has basic properties
      alert.lastUpdated = alert.lastUpdated || new Date().toISOString();
      alert.status = alert.status || 'red';
      alert.severity = alert.severity || 'Medium';
      
      processed.push(alert);
    } catch (error) {
      console.warn(`⚠️ Error processing alert ${alert.id}:`, error.message);
      processed.push(alert);
    }
  }
  
  return processed;
}

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Main alerts endpoint with memory optimization
app.get('/api/alerts-enhanced', async (req, res) => {
  const requestId = Date.now();
  
  try {
    console.log(`🚀 [OPTIMIZED-${requestId}] Starting memory-optimized alerts fetch...`);
    
    let allAlerts = [];
    const sources = {};
    
    // Fetch TomTom data with memory optimization
    console.log(`🚗 [OPTIMIZED-${requestId}] Testing TomTom API...`);
    console.log(`🔑 [OPTIMIZED-${requestId}] TomTom API Key configured: ${process.env.TOMTOM_API_KEY ? 'YES' : 'NO'}`);
    
    try {
      const startTime = Date.now();
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      const duration = Date.now() - startTime;
      
      console.log(`📊 [OPTIMIZED-${requestId}] TomTom Result:`, {
        success: tomtomResult.success,
        dataCount: tomtomResult.data ? tomtomResult.data.length : 0,
        error: tomtomResult.error,
        duration: `${duration}ms`
      });
      
      if (tomtomResult.success && tomtomResult.data && tomtomResult.data.length > 0) {
        allAlerts.push(...tomtomResult.data);
        sources.tomtom = {
          success: true,
          count: tomtomResult.data.length,
          method: 'Memory-optimized with route matching',
          mode: 'live',
          duration: `${duration}ms`
        };
        console.log(`✅ [OPTIMIZED-${requestId}] TomTom: ${tomtomResult.data.length} alerts fetched successfully`);
      } else {
        sources.tomtom = {
          success: false,
          count: 0,
          error: tomtomResult.error || 'No data returned',
          mode: 'live',
          duration: `${duration}ms`
        };
        console.log(`⚠️ [OPTIMIZED-${requestId}] TomTom: No alerts returned`);
      }
    } catch (tomtomError) {
      console.error(`❌ [OPTIMIZED-${requestId}] TomTom fetch failed:`, tomtomError.message);
      sources.tomtom = {
        success: false,
        count: 0,
        error: tomtomError.message,
        mode: 'live'
      };
    }
    
    console.log(`📊 [OPTIMIZED-${requestId}] Raw alerts collected: ${allAlerts.length}`);
    
    // Optimized filtering
    const filteredAlerts = optimizedSampleDataFilter(allAlerts);
    
    // Memory-optimized processing
    let enhancedAlerts = [];
    if (filteredAlerts.length > 0) {
      try {
        console.log(`🔄 [OPTIMIZED-${requestId}] Processing alerts with memory optimization...`);
        enhancedAlerts = await processAlertsOptimized(filteredAlerts);
        console.log(`✅ [OPTIMIZED-${requestId}] Processing complete: ${enhancedAlerts.length} alerts`);
      } catch (enhancementError) {
        console.error(`❌ [OPTIMIZED-${requestId}] Processing failed:`, enhancementError.message);
        enhancedAlerts = filteredAlerts;
      }
    }
    
    // Generate statistics
    const stats = {
      totalAlerts: enhancedAlerts.length,
      activeAlerts: enhancedAlerts.filter(a => a.status === 'red').length,
      alertsWithRoutes: enhancedAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
      averageRoutesPerAlert: enhancedAlerts.length > 0 ?
        (enhancedAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / enhancedAlerts.length).toFixed(1) : 0
    };
    
    const response = {
      success: true,
      alerts: enhancedAlerts,
      metadata: {
        requestId,
        totalAlerts: enhancedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'Memory-optimized with working route matching',
        mode: 'memory_optimized_fixed',
        debug: {
          processingDuration: `${Date.now() - requestId}ms`,
          memoryOptimized: true,
          routeMatchingFixed: true
        }
      }
    };
    
    console.log(`🎯 [OPTIMIZED-${requestId}] FINAL RESULT: Returning ${enhancedAlerts.length} alerts`);
    console.log(`📊 [OPTIMIZED-${requestId}] Alerts with routes: ${stats.alertsWithRoutes}/${enhancedAlerts.length}`);
    console.log(`⏱️ [OPTIMIZED-${requestId}] Total processing time: ${Date.now() - requestId}ms`);
    
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [OPTIMIZED-${requestId}] Critical error:`, error);
    
    const emergencyResponse = {
      success: false,
      alerts: [],
      metadata: {
        requestId,
        totalAlerts: 0,
        sources: { error: 'Critical endpoint failure' },
        error: error.message,
        timestamp: new Date().toISOString(),
        mode: 'emergency_fallback'
      }
    };
    
    res.status(500).json(emergencyResponse);
  }
});

// Simplified main alerts endpoint
app.get('/api/alerts', async (req, res) => {
  const requestId = Date.now();
  
  try {
    console.log(`🚀 [MAIN-${requestId}] Fetching main alerts...`);
    
    // Check cache first
    const now = Date.now();
    
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      const cacheAge = Math.round((now - lastFetchTime) / 1000);
      console.log(`📦 [MAIN-${requestId}] Returning cached alerts (${cacheAge}s old)`);
      return res.json(cachedAlerts);
    }
    
    // Fetch fresh data
    let allAlerts = [];
    let sources = {};
    
    try {
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      
      if (tomtomResult.success && tomtomResult.data) {
        allAlerts.push(...tomtomResult.data);
        sources.tomtom = { 
          success: true, 
          count: tomtomResult.data.length
        };
      } else {
        sources.tomtom = { 
          success: false, 
          error: tomtomResult.error
        };
      }
    } catch (error) {
      sources.tomtom = { success: false, error: error.message };
    }
    
    const filteredAlerts = optimizedSampleDataFilter(allAlerts);
    
    const response = {
      success: true,
      alerts: filteredAlerts,
      metadata: {
        requestId,
        totalAlerts: filteredAlerts.length,
        sources: sources,
        lastUpdated: new Date().toISOString(),
        cached: false,
        endpoint: 'main-alerts-optimized'
      }
    };
    
    // Update cache
    cachedAlerts = response;
    lastFetchTime = now;
    
    console.log(`🎯 [MAIN-${requestId}] Returning ${filteredAlerts.length} alerts`);
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [MAIN-${requestId}] Error:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        requestId,
        totalAlerts: 0,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Emergency alerts endpoint (built-in instead of imported)
app.get('/api/emergency-alerts', async (req, res) => {
  console.log('🚨 Emergency alerts endpoint called');
  
  try {
    console.log('🚗 Testing TomTom directly...');
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();
    
    console.log('📊 TomTom emergency result:', {
      success: tomtomResult.success,
      dataCount: tomtomResult.data ? tomtomResult.data.length : 0,
      error: tomtomResult.error
    });
    
    if (tomtomResult.success && tomtomResult.data) {
      res.json({
        success: true,
        alerts: tomtomResult.data,
        metadata: {
          source: 'emergency_tomtom_direct',
          count: tomtomResult.data.length,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: false,
        alerts: [],
        error: tomtomResult.error,
        metadata: {
          source: 'emergency_tomtom_direct',
          count: 0,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Emergency endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: []
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started with Memory Optimization`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 Main: /api/alerts`);
  console.log(`   🚀 Enhanced: /api/alerts-enhanced`);
  console.log(`   🚨 Emergency: /api/emergency-alerts`);
  console.log(`   💚 Health: /api/health`);
  console.log(`   👮 Supervisor: /api/supervisor`);
  console.log(`   🚧 Roadworks: /api/roadworks`);
});

export default app;