// backend/index-fixed-cors.js
// BARRY Backend with FIXED CORS and Rate Limiting for Display Screen

import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

// Import ALL working services
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchHERETrafficWithStreetNames } from './services/here.js';
import { fetchMapQuestTrafficWithStreetNames } from './services/mapquest.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import { initializeEnhancedGTFS, enhancedFindRoutesNearCoordinates } from './enhanced-gtfs-route-matcher.js';
import healthRoutes from './routes/health.js';
import supervisorAPI from './routes/supervisorAPI.js';
import roadworksAPI from './routes/roadworksAPI.js';
import supervisorSyncService from './services/supervisorSync.js';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY Backend Starting with FIXED CORS and Rate Limiting...');

// Enhanced GTFS route matching function
function findRoutesNearCoordinatesFixed(lat, lng, radiusMeters = 250) {
  try {
    const routes = enhancedFindRoutesNearCoordinates(lat, lng, radiusMeters);
    
    if (routes.length > 0) {
      console.log(`🎯 Enhanced GTFS Match: Found ${routes.length} routes near ${lat.toFixed(4)}, ${lng.toFixed(4)}: ${routes.slice(0, 5).join(', ')}`);
      return routes;
    }
    
    console.log(`⚠️ Enhanced GTFS failed, using geographic fallback...`);
    return basicGeographicRouteMatch(lat, lng);
    
  } catch (error) {
    console.warn(`⚠️ Enhanced GTFS error: ${error.message}, using fallback`);
    return basicGeographicRouteMatch(lat, lng);
  }
}

// Fallback basic geographic route matching
function basicGeographicRouteMatch(lat, lng) {
  const foundRoutes = new Set();
  
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
    }
  ];

  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      region.routes.forEach(route => foundRoutes.add(route));
      break;
    }
  }

  if (foundRoutes.size === 0) {
    ['21', '22', '10', '1', '2', 'Q3'].forEach(route => foundRoutes.add(route));
  }

  const routes = Array.from(foundRoutes).sort();
  
  if (routes.length > 0) {
    console.log(`🗺️ Geographic Match: Found ${routes.length} routes near ${lat.toFixed(4)}, ${lng.toFixed(4)}: ${routes.slice(0, 5).join(', ')}`);
  }
  
  return routes;
}

// Load GTFS routes data
let GTFS_ROUTES = new Set();
const ACK_FILE = path.join(__dirname, 'data/acknowledged.json');
let acknowledgedAlerts = {};
const NOTES_FILE = path.join(__dirname, 'data/notes.json');
let alertNotes = {};

// Initialize essential data and enhanced GTFS
(async () => {
  try {
    console.log('🚀 Initializing Enhanced GTFS route matching system...');
    await initializeEnhancedGTFS();
    console.log('✅ Enhanced GTFS route matching ready');
    
    const routesTxt = await fs.readFile(path.join(__dirname, 'data/routes.txt'), 'utf-8');
    const records = parse(routesTxt, { columns: true, skip_empty_lines: true });
    for (const rec of records) {
      if (rec.route_short_name) {
        GTFS_ROUTES.add(rec.route_short_name.trim());
      }
    }
    console.log(`🚌 Loaded ${GTFS_ROUTES.size} GTFS routes`);
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

// Create HTTP server for WebSocket support
const server = createServer(app);

console.log(`
🔧 FIXED CONFIGURATION:
   ✅ CORS properly configured for gobarry.co.uk and www.gobarry.co.uk
   ✅ Rate limiting INCREASED for Display Screen
   ✅ Preflight OPTIONS handling
   ✅ Enhanced error handling
`);

// FIXED: More generous rate limiting for Display Screen
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 10; // INCREASED from 3 to 10

app.use((req, res, next) => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    console.log(`⚠️ Rate limit hit: ${activeRequests}/${MAX_CONCURRENT_REQUESTS} active requests`);
    return res.status(429).json({
      success: false,
      error: 'Service temporarily busy - please try again in a moment',
      activeRequests: activeRequests,
      maxAllowed: MAX_CONCURRENT_REQUESTS,
      retryAfter: 5
    });
  }
  
  activeRequests++;
  
  res.on('finish', () => {
    activeRequests--;
    
    if (activeRequests === 0 && global.gc && Math.random() < 0.1) {
      setTimeout(() => {
        if (global.gc) {
          global.gc();
          console.log('♻️ Garbage collection triggered');
        }
      }, 2000);
    }
  });
  
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));

// FIXED: Comprehensive CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gobarry.co.uk',
    'https://www.gobarry.co.uk',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000'
  ];
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    console.log(`⚠️ CORS: Blocked origin: ${origin}`);
    res.header('Access-Control-Allow-Origin', 'https://gobarry.co.uk');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight: ${req.headers.origin} → ${req.path}`);
    res.status(200).end();
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    if (status >= 400) {
      console.log(`❌ ${req.method} ${req.path} → ${status} (${duration}ms)`);
    } else if (duration > 5000) {
      console.log(`⚠️ ${req.method} ${req.path} → ${status} (SLOW: ${duration}ms)`);
    }
  });
  
  next();
});

// Health endpoint
app.use('/api/health', healthRoutes);

// Supervisor management routes
app.use('/api/supervisor', supervisorAPI);

// Roadworks management routes  
app.use('/api/roadworks', roadworksAPI);

// Check if alert is dismissed
function isAlertDismissed(alertId) {
  if (!global.dismissedIncidents) return false;
  return global.dismissedIncidents.has(alertId);
}

// Filter out dismissed alerts
function filterDismissedAlerts(alerts, requestId) {
  if (!Array.isArray(alerts)) return [];
  
  const activeDismissals = global.dismissedIncidents || new Map();
  const filtered = alerts.filter(alert => {
    if (activeDismissals.has(alert.id)) {
      const dismissal = activeDismissals.get(alert.id);
      console.log(`🙅 [${requestId}] Alert ${alert.id} dismissed by ${dismissal.dismissedBy.supervisorName}: ${dismissal.reason}`);
      return false;
    }
    return true;
  });
  
  const dismissedCount = alerts.length - filtered.length;
  if (dismissedCount > 0) {
    console.log(`🙅 [${requestId}] Filtered ${dismissedCount} supervisor-dismissed alerts`);
  }
  
  return filtered;
}

// Enhanced alert filtering
function enhancedAlertFiltering(alerts, requestId) {
  if (!Array.isArray(alerts)) return [];
  
  console.log(`🔍 [${requestId}] Enhanced filtering starting with ${alerts.length} alerts`);
  
  const seenAlerts = new Map();
  const filtered = [];
  
  for (const alert of alerts) {
    if (!alert || typeof alert !== 'object') continue;
    
    // Filter out test data
    const id = (alert.id || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    const source = (alert.source || '').toString().toLowerCase();
    
    if (id.includes('test_data') || id.includes('sample_test') || 
        title.includes('test alert') || source === 'test_system') {
      console.log(`🗑️ [${requestId}] Filtered test alert: ${id}`);
      continue;
    }
    
    // Create deduplication key
    const location = alert.location || '';
    const coordinates = alert.coordinates;
    let dedupKey = '';
    
    if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
      const lat = Math.round(coordinates[0] * 1000) / 1000;
      const lng = Math.round(coordinates[1] * 1000) / 1000;
      dedupKey = `${lat},${lng}`;
    } else {
      dedupKey = location.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Check for duplicates
    if (seenAlerts.has(dedupKey)) {
      const existing = seenAlerts.get(dedupKey);
      const sourcePreference = { tomtom: 4, here: 3, mapquest: 2, national_highways: 1 };
      const currentPref = sourcePreference[alert.source] || 0;
      const existingPref = sourcePreference[existing.source] || 0;
      
      if (currentPref > existingPref) {
        const existingIndex = filtered.findIndex(a => a.id === existing.id);
        if (existingIndex !== -1) {
          filtered[existingIndex] = alert;
          seenAlerts.set(dedupKey, alert);
        }
      }
      continue;
    }
    
    seenAlerts.set(dedupKey, alert);
    filtered.push(alert);
  }
  
  console.log(`✅ [${requestId}] Enhanced filtering: ${alerts.length} → ${filtered.length} alerts`);
  return filtered;
}

// Auto-cancellation logic
function applyAutoCancellation(alerts, requestId) {
  if (!Array.isArray(alerts)) return [];
  
  console.log(`🧹 [${requestId}] Applying auto-cancellation to ${alerts.length} alerts`);
  
  const now = new Date();
  const activeAlerts = [];
  let cancelledCount = 0;
  
  for (const alert of alerts) {
    let shouldCancel = false;
    let cancelReason = '';
    
    if (alert.lastUpdated) {
      const alertAge = now - new Date(alert.lastUpdated);
      const maxAge = 4 * 60 * 60 * 1000; // 4 hours
      
      if (alertAge > maxAge) {
        shouldCancel = true;
        cancelReason = 'Incident older than 4 hours, auto-cancelled';
      }
    }
    
    if (alert.endTime) {
      const endTime = new Date(alert.endTime);
      if (now > endTime) {
        shouldCancel = true;
        cancelReason = 'Incident end time passed, auto-cancelled';
      }
    }
    
    if (alert.status === 'green' || alert.status === 'resolved' || alert.status === 'cleared') {
      shouldCancel = true;
      cancelReason = 'Incident marked as resolved/cleared';
    }
    
    if (alert.severity === 'Low' && alert.lastUpdated) {
      const alertAge = now - new Date(alert.lastUpdated);
      const lowSeverityMaxAge = 2 * 60 * 60 * 1000; // 2 hours
      
      if (alertAge > lowSeverityMaxAge) {
        shouldCancel = true;
        cancelReason = 'Low severity incident older than 2 hours, auto-cancelled';
      }
    }
    
    if (shouldCancel) {
      console.log(`🧹 [${requestId}] Auto-cancelled: ${alert.id} - ${cancelReason}`);
      cancelledCount++;
    } else {
      activeAlerts.push(alert);
    }
  }
  
  console.log(`✅ [${requestId}] Auto-cancellation: ${alerts.length} → ${activeAlerts.length} alerts`);
  return activeAlerts;
}

// Memory-optimized alert processing
async function processAlertsOptimized(alerts) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return [];
  }
  
  const processed = [];
  
  for (const alert of alerts) {
    try {
      if (!alert.affectsRoutes || alert.affectsRoutes.length === 0) {
        if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
          const [lat, lng] = alert.coordinates;
          alert.affectsRoutes = findRoutesNearCoordinatesFixed(lat, lng);
          alert.routeMatchMethod = 'Post-processed';
        }
      }
      
      alert.lastUpdated = alert.lastUpdated || new Date().toISOString();
      alert.status = alert.status || 'red';
      alert.severity = alert.severity || 'Medium';
      
      // Ensure start date for Display Screen
      if (!alert.startDate) {
        alert.startDate = alert.lastUpdated || new Date().toISOString();
      }
      
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
const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// DISPLAY SCREEN OPTIMIZED - Multi-source alerts endpoint
app.get('/api/alerts-enhanced', async (req, res) => {
  const requestId = Date.now();
  
  try {
    console.log(`🚀 [DISPLAY-${requestId}] Display Screen alerts request from ${req.headers.origin}`);
    
    let allAlerts = [];
    const sources = {};
    const fetchPromises = [];
    
    // Fetch from all sources
    console.log(`🚗 [${requestId}] Fetching TomTom traffic...`);
    fetchPromises.push(
      fetchTomTomTrafficWithStreetNames()
        .then(result => ({ source: 'tomtom', data: result }))
        .catch(error => ({ source: 'tomtom', data: { success: false, error: error.message, data: [] } }))
    );
    
    console.log(`🗺️ [${requestId}] Fetching HERE traffic...`);
    fetchPromises.push(
      fetchHERETrafficWithStreetNames()
        .then(result => ({ source: 'here', data: result }))
        .catch(error => ({ source: 'here', data: { success: false, error: error.message, data: [] } }))
    );
    
    console.log(`🗺️ [${requestId}] Fetching MapQuest traffic...`);
    fetchPromises.push(
      fetchMapQuestTrafficWithStreetNames()
        .then(result => ({ source: 'mapquest', data: result }))
        .catch(error => ({ source: 'mapquest', data: { success: false, error: error.message, data: [] } }))
    );
    
    console.log(`🛫 [${requestId}] Fetching National Highways...`);
    fetchPromises.push(
      fetchNationalHighways()
        .then(result => ({ source: 'national_highways', data: result }))
        .catch(error => ({ source: 'national_highways', data: { success: false, error: error.message, data: [] } }))
    );
    
    // Fetch with extended timeout for Display Screen
    console.log(`⏱️ [${requestId}] Fetching from ALL 4 traffic sources (Display Screen)...`);
    const startTime = Date.now();
    
    const results = await Promise.allSettled(
      fetchPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Source timeout')), 35000) // 35 seconds
          )
        ])
      )
    );
    
    const fetchDuration = Date.now() - startTime;
    console.log(`⚙️ [${requestId}] All sources completed in ${fetchDuration}ms`);
    
    // Process results
    for (const [index, result] of results.entries()) {
      const sourceNames = ['tomtom', 'here', 'mapquest', 'national_highways'];
      const sourceName = sourceNames[index];
      
      if (result.status === 'fulfilled' && result.value?.data) {
        const sourceResult = result.value.data;
        
        if (sourceResult.success && sourceResult.data && sourceResult.data.length > 0) {
          allAlerts.push(...sourceResult.data);
          sources[sourceName] = {
            success: true,
            count: sourceResult.data.length,
            method: sourceResult.method || 'API',
            mode: 'live'
          };
          console.log(`✅ [${requestId}] ${sourceName.toUpperCase()}: ${sourceResult.data.length} alerts`);
        } else {
          sources[sourceName] = {
            success: false,
            count: 0,
            error: sourceResult.error || 'No data returned',
            mode: 'live'
          };
          console.log(`⚠️ [${requestId}] ${sourceName.toUpperCase()}: No alerts`);
        }
      } else {
        sources[sourceName] = {
          success: false,
          count: 0,
          error: result.reason?.message || 'Fetch failed',
          mode: 'live'
        };
        console.log(`❌ [${requestId}] ${sourceName.toUpperCase()}: Failed - ${result.reason?.message}`);
      }
    }
    
    console.log(`📊 [${requestId}] Raw alerts collected: ${allAlerts.length}`);
    
    // Enhanced filtering
    let filteredAlerts = enhancedAlertFiltering(allAlerts, requestId);
    filteredAlerts = filterDismissedAlerts(filteredAlerts, requestId);
    
    // Process alerts
    let enhancedAlerts = [];
    if (filteredAlerts.length > 0) {
      try {
        console.log(`🔄 [${requestId}] Processing alerts for Display Screen...`);
        enhancedAlerts = await processAlertsOptimized(filteredAlerts);
        console.log(`✅ [${requestId}] Processing complete: ${enhancedAlerts.length} alerts`);
      } catch (enhancementError) {
        console.error(`❌ [${requestId}] Processing failed:`, enhancementError.message);
        enhancedAlerts = filteredAlerts;
      }
    }
    
    // Apply auto-cancellation
    const activeAlerts = applyAutoCancellation(enhancedAlerts, requestId);
    
    // Generate statistics
    const stats = {
      totalAlerts: activeAlerts.length,
      activeAlerts: activeAlerts.filter(a => a.status === 'red').length,
      alertsWithRoutes: activeAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
      alertsWithCoordinates: activeAlerts.filter(a => a.coordinates && a.coordinates.length === 2).length,
      averageRoutesPerAlert: activeAlerts.length > 0 ?
        (activeAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / activeAlerts.length).toFixed(1) : 0,
      sourceBreakdown: sources,
      enhancedGTFS: activeAlerts.filter(a => a.routeMatchMethod?.includes('Enhanced')).length,
      autoCancelled: enhancedAlerts.length - activeAlerts.length
    };
    
    const response = {
      success: true,
      alerts: activeAlerts,
      metadata: {
        requestId,
        totalAlerts: activeAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'Display Screen Optimized with Enhanced GTFS + Auto-cancellation',
        mode: 'display_screen_optimized',
        debug: {
          processingDuration: `${Date.now() - requestId}ms`,
          sourcesActive: Object.keys(sources).filter(s => sources[s].success).length,
          totalSources: 4,
          enhancedGTFS: true,
          autoCancellation: true,
          corsFixed: true
        }
      }
    };
    
    console.log(`🎯 [${requestId}] DISPLAY SCREEN RESULT: ${activeAlerts.length} alerts from ${Object.keys(sources).filter(s => sources[s].success).length}/4 sources`);
    console.log(`📊 [${requestId}] Enhanced GTFS matches: ${stats.enhancedGTFS}/${activeAlerts.length}`);
    console.log(`🗺️ [${requestId}] Alerts with coordinates: ${stats.alertsWithCoordinates}/${activeAlerts.length}`);
    console.log(`🧹 [${requestId}] Auto-cancelled: ${stats.autoCancelled} stale incidents`);
    console.log(`⏱️ [${requestId}] Total processing time: ${Date.now() - requestId}ms`);
    
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [${requestId}] Critical display screen error:`, error);
    
    const emergencyResponse = {
      success: false,
      alerts: [],
      metadata: {
        requestId,
        totalAlerts: 0,
        sources: { error: 'Display screen endpoint failure' },
        error: error.message,
        timestamp: new Date().toISOString(),
        mode: 'emergency_fallback',
        corsFixed: true
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
    
    const response = {
      success: true,
      alerts: allAlerts,
      metadata: {
        requestId,
        totalAlerts: allAlerts.length,
        sources: sources,
        lastUpdated: new Date().toISOString(),
        cached: false,
        endpoint: 'main-alerts-optimized',
        corsFixed: true
      }
    };
    
    // Update cache
    cachedAlerts = response;
    lastFetchTime = now;
    
    console.log(`🎯 [MAIN-${requestId}] Returning ${allAlerts.length} alerts`);
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
        timestamp: new Date().toISOString(),
        corsFixed: true
      }
    });
  }
});

// Emergency alerts endpoint
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
          timestamp: new Date().toISOString(),
          corsFixed: true
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
          timestamp: new Date().toISOString(),
          corsFixed: true
        }
      });
    }
  } catch (error) {
    console.error('❌ Emergency endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      corsFixed: true
    });
  }
});

// Supervisor dismiss alert endpoint
app.post('/api/supervisor/dismiss-alert', async (req, res) => {
  try {
    const { alertId, reason, sessionId } = req.body;
    
    if (!alertId || !reason || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID, reason, and session ID are required'
      });
    }
    
    // Validate supervisor session
    const { validateSupervisorSession } = await import('./services/supervisorManager.js');
    const sessionValidation = validateSupervisorSession(sessionId);
    
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create dismissal record
    const dismissalRecord = {
      alertId,
      dismissedBy: {
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        badge: supervisor.badge || 'N/A',
        role: supervisor.role
      },
      dismissedAt: new Date().toISOString(),
      reason,
      sessionId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };
    
    // Store dismissal
    if (!global.dismissedIncidents) {
      global.dismissedIncidents = new Map();
    }
    global.dismissedIncidents.set(alertId, dismissalRecord);
    
    console.log(`🙅 Alert ${alertId} dismissed by ${supervisor.name} (${supervisor.badge}): ${reason}`);
    
    res.json({
      success: true,
      dismissal: dismissalRecord,
      message: 'Alert dismissed successfully'
    });
    
  } catch (error) {
    console.error('❌ Failed to dismiss alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss alert'
    });
  }
});

// Get dismissed alerts for audit trail
app.get('/api/supervisor/dismissed-alerts', async (req, res) => {
  try {
    const dismissedAlerts = global.dismissedIncidents || new Map();
    const dismissals = Array.from(dismissedAlerts.values())
      .sort((a, b) => new Date(b.dismissedAt) - new Date(a.dismissedAt))
      .slice(0, 100);
    
    res.json({
      success: true,
      dismissals,
      count: dismissals.length
    });
    
  } catch (error) {
    console.error('❌ Failed to get dismissed alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dismissed alerts'
    });
  }
});

// Initialize WebSocket service
supervisorSyncService.initialize(server);

// WebSocket sync endpoint for getting current state
app.get('/api/supervisor/sync-status', (req, res) => {
  const stats = supervisorSyncService.getStats();
  res.json({
    success: true,
    syncStatus: stats,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to update alerts in WebSocket service
app.post('/api/supervisor/sync-alerts', async (req, res) => {
  try {
    const { alerts } = req.body;
    supervisorSyncService.updateAlerts(alerts);
    res.json({
      success: true,
      message: 'Alerts synced to display screens',
      alertCount: alerts.length
    });
  } catch (error) {
    console.error('❌ Failed to sync alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync alerts'
    });
  }
});

// Start server with WebSocket support
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started with FIXED CORS and Rate Limiting`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 Main: /api/alerts`);
  console.log(`   🚀 Enhanced (DISPLAY SCREEN): /api/alerts-enhanced`);
  console.log(`   🚨 Emergency: /api/emergency-alerts`);
  console.log(`   💚 Health: /api/health`);
  console.log(`   👮 Supervisor: /api/supervisor`);
  console.log(`   🙅 Dismiss Alert: /api/supervisor/dismiss-alert`);
  console.log(`   🚧 Roadworks: /api/roadworks`);
  console.log(`   🔌 WebSocket: ws://localhost:${PORT}/ws/supervisor-sync`);
  console.log(`   📊 Sync Status: /api/supervisor/sync-status`);
  console.log(`\n🌟 FIXES APPLIED:`);
  console.log(`   ✅ CORS properly configured for gobarry.co.uk and www.gobarry.co.uk`);
  console.log(`   ✅ Rate limiting increased from 3 to 10 concurrent requests`);
  console.log(`   ✅ Extended timeout for Display Screen (35 seconds)`);
  console.log(`   ✅ Enhanced error handling and logging`);
  console.log(`   ✅ Cache timeout reduced to 2 minutes for better responsiveness`);
  console.log(`   ✅ Proper startDate fields added for Display Screen`);
});

export default app;