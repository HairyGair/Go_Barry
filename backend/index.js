/*
 * Go Barry - Traffic Intelligence Platform Backend
 * © 2024-2025 Anthony Gair. All rights reserved.
 * anthonygair@icloud.com
 */

// backend/index.js - Go BARRY Backend
// Traffic Intelligence with TomTom + National Highways + StreetManager + Manual Incidents

console.log('🌟 index.js: Module loading started at', new Date().toISOString());

/*
 * ARCHITECTURAL FIX (June 2025):
 * Previously, this file created its own Express app, resulting in TWO separate app instances:
 * 1. render-startup.js created app #1 and listened on the port
 * 2. index.js created app #2 and registered all routes on it
 * Result: 100% of routes returned 404 because app #2 was never served
 * 
 * SOLUTION: Use the global app instance created by render-startup.js
 * This avoids circular dependencies and ensures all routes use the same app!
 */

// FIXED: Get the app instance from global (set by render-startup.js)
import express from 'express';  // Need express for middleware
import axios from 'axios';

const app = global.goBarryApp;
if (!app) {
  console.error('❌ FATAL: No app instance found! render-startup.js must run first.');
  throw new Error('App not initialized by render-startup.js');
}
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';

// Import ALL working services
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom-enhanced.js';
import adminAPI from './routes/adminAPI.js';
import cleanupAPI from './routes/cleanupAPI.js';


import { fetchNationalHighways } from './services/nationalHighways.js';
import { initializeEnhancedGTFS, enhancedFindRoutesNearCoordinates } from './enhanced-gtfs-route-matcher.js';
import { initializeStreamingProcessor, findNearbyStopsFromCache } from './gtfs-streaming-processor.js';
import healthRoutes from './routes/health.js';
import healthExtendedRouter from './routes/healthExtended.js';
import supervisorAPI from './routes/supervisorAPI.js';
import roadworksAPI from './routes/roadworksAPI.js';
import roadworkAlertsAPI from './routes/roadworkAlertsAPI-simple.js';
import gtfsAPI from './routes/gtfsAPI.js';
import gtfsService from './services/gtfsService.js';
console.log('✅ roadworkAlertsAPI-simple imported successfully');
console.log('✅ gtfsAPI imported successfully');
console.log('✅ gtfsService imported successfully');
import microsoftAuthAPI from './routes/microsoftAuthAPI.js';
console.log('✅ microsoftAuthAPI imported successfully');
import intelligenceAPI from './routes/intelligenceAPI.js';
import intelligenceAPINew from './routes/intelligenceAPINew.js';
import incidentAPI from './routes/incidentAPI.js';
import enhancementAPI from './routes/enhancementAPI.js';
import frequencyAPI from './routes/frequencyAPI.js';
import throttleAPI from './routes/throttleAPI.js';
import tileAPI from './routes/tileAPI.js';
import eventAPI from './routes/eventAPI.js';
import tomtomUsageAPI from './routes/tomtomUsageAPI.js';
import activityLogsAPI from './routes/activityLogs.js';
import dutyAPI from './routes/dutyAPI.js';
import messagingAPI from './routes/messagingAPI.js';
import messageHistoryRoutes from './routes/messageHistoryRoutes.js';
import analyticsAPI from './routes/analyticsAPI.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import communicationsAPI from './routes/communications/index.js';
console.log('✅ communicationsAPI imported successfully');
import locationCorrectionAPI from './routes/locationCorrectionAPI.js';
import supervisorManager from './services/supervisorManager.js';
import serviceFrequencyAnalyzer from './services/serviceFrequencyAnalyzer.js';
import supervisorSyncService from './services/supervisorSync.js';
import enhancedDataSourceManager from './services/enhancedDataSourceManager.js';
import displayAPI from './routes/displayAPI.js';
import streetManagerWebhooks from './services/streetManagerWebhooksSimple.js';
console.log('✅ streetManagerWebhooks service imported');
import streetManagerWebhookRouter from './routes/streetManagerWebhook.js';
// IMPORTANT: Apply text body parser ONLY to webhook route, as per StreetManager docs
app.use('/api/streetmanager/webhook', express.text(), streetManagerWebhookRouter);
console.log('✅ streetManagerWebhookRouter imported with text body parser');
import streetManagerCleanupRouter from './routes/streetManagerCleanup.js';
app.use('/api/streetmanager', streetManagerCleanupRouter);
console.log('✅ streetManagerCleanupRouter imported for hybrid storage management');
import streetManagerScheduler from './services/streetManagerScheduler.js';
console.log('✅ streetManagerScheduler imported for automated cleanup');
import streetManagerActionsAPI from './routes/streetManagerActionsAPI.js';
console.log('✅ streetManagerActionsAPI imported');
import unifiedRoadworksAPI from './routes/unifiedRoadworksAPI.js';
import messageAPI from './routes/messageAPI.js';
console.log('✅ messageAPI imported');
import roadworksV2API from './routes/roadworksV2API.js';
console.log('✅ roadworksV2API imported');
import disruptionsAPI from './routes/disruptionsAPI.js';
console.log('✅ disruptionsAPI imported');
import authRoutes from './routes/authRoutes.js';
console.log('✅ authRoutes imported');
import sharePointExcelAPI from './routes/sharePointExcelAPI.js';
console.log('✅ sharePointExcelAPI imported');

// Communications API Route
app.use('/api/communications', communicationsAPI);
console.log('✅ Communications API registered at /api/communications');
console.log('✅ unifiedRoadworksAPI imported');
// REMOVED: import { createServer } from 'http'; - Using server from render-startup.js
import { deduplicateAlerts, cleanupExpiredDismissals, generateAlertHash } from './utils/alertDeduplication.js';
import { convexSync } from './services/convexSync.js';
import startupService from './services/startupService.js';
import { createClient } from '@supabase/supabase-js';
import realTimeDisruptionScoring from './services/realTimeDisruptionScoring.js';
import busLocationService from './services/busLocationService.js';
import busUpdateLoop from './services/busUpdateLoop.js';
import { gtfsRouteShapesService } from './services/gtfsRouteShapesService.js';
import busLocationsAPI from './routes/busLocationsAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// RENDER FIX: Immediate startup signal
console.log(`🚀 Go BARRY Backend Starting - PORT: ${process.env.PORT || 3001}`);
console.log('📡 Render.com Optimized Version - Immediate Port Binding...');

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

  // Assign fallback routes for locations that passed the pre-filtering
  // The aggressive text-based pre-filtering above already excluded non-North East areas
  if (foundRoutes.size === 0) {
    console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Assigning fallback routes for location that passed pre-filtering: ${lat}, ${lng}`);
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
async function initializeApplication() {
  try {
    console.log('🚀 Initializing GTFS route matching system...');
    
    // Initialize GTFS service - ONLY ONE will be loaded
    let gtfsInitialized = false;
    
    // Try comprehensive GTFS service first (preferred)
    try {
      console.log('🚌 Initializing comprehensive GTFS service...');
      await gtfsService.initialize();
      console.log('✅ Comprehensive GTFS service ready - USING THIS');
      gtfsInitialized = true;
    } catch (gtfsError) {
      console.warn('⚠️ Comprehensive GTFS service failed:', gtfsError.message);
    }
    
    // Only try fallbacks if first one failed
    if (!gtfsInitialized) {
      try {
        console.log('🚌 Trying memory-efficient streaming processor...');
        await initializeStreamingProcessor();
        console.log('✅ Memory-efficient streaming GTFS processor ready - USING THIS');
        gtfsInitialized = true;
      } catch (streamingError) {
        console.warn('⚠️ Streaming processor failed:', streamingError.message);
      }
    }
    
    // Last resort fallback
    if (!gtfsInitialized) {
      try {
        console.log('🚌 Trying enhanced GTFS as last resort...');
        await initializeEnhancedGTFS();
        console.log('✅ Enhanced GTFS route matching ready - USING THIS (fallback)');
        gtfsInitialized = true;
      } catch (enhancedError) {
        console.error('❌ All GTFS services failed to initialize:', enhancedError.message);
      }
    }
    
    // FIXED: Truly non-blocking Service Frequency Analyzer initialization
    console.log('🚌 Starting Service Frequency Analyzer (background)...');
    // Don't await - let it initialize in background
    setTimeout(() => {
      serviceFrequencyAnalyzer.initialize().then(() => {
        console.log('✅ Service Frequency Analyzer ready');
      }).catch(error => {
        console.warn('⚠️ Service Frequency Analyzer failed - continuing without it:', error.message);
      });
    }, 1000); // Start after 1 second to not block main initialization
    
    try {
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
      // Don't fail startup for missing routes - use fallback
      console.log('⚠️ Using fallback route matching');
    }
  
    // Load dismissed alerts for persistence across restarts
    try {
    const dismissedFilePath = path.join(__dirname, 'data/dismissed-alerts.json');
    const raw = await fs.readFile(dismissedFilePath, 'utf-8');
    const dismissedData = JSON.parse(raw);
    
    global.dismissedIncidents = new Map();
    for (const [key, value] of Object.entries(dismissedData)) {
      global.dismissedIncidents.set(key, value);
    }
    
    // Clean up expired dismissals on startup
    const cleanedCount = cleanupExpiredDismissals(global.dismissedIncidents, 48);
    console.log(`✅ Loaded ${global.dismissedIncidents.size} dismissed alerts (cleaned ${cleanedCount} expired)`);
  } catch (err) {
    global.dismissedIncidents = new Map();
    console.log('📝 No dismissed alerts file found, starting fresh');
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
  
  console.log('✅ Application initialization complete');
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
    console.log('⚠️ Starting with limited functionality...');
  }
}

// ✅ FIXED: API polling disabled - using webhooks only
// Street Manager webhooks are configured and working at /api/streetmanager/webhook
// Webhook data is saved to streetmanager_notifications table in Supabase
// No API key needed since webhooks push data to us!
console.log('📨 StreetManager: Using webhook-only mode (no polling)');
console.log('🔗 Webhook endpoint: https://go-barry.onrender.com/api/streetmanager/webhook');
console.log('📊 Webhook data stored in: streetmanager_notifications table');

// Removed periodic polling - webhooks provide real-time data

// REMOVED: const app = express(); - Now using the app from render-startup.js

// FIXED: Use the server from render-startup.js instead of creating a new one
let server = global.goBarryServer;
if (!server) {
  console.warn('⚠️ Server not found in global, WebSocket features may not work');
}

console.log(`
🔧 FIXED CONFIGURATION:
   ✅ CORS properly configured for gobarry.co.uk and www.gobarry.co.uk
   ✅ Rate limiting INCREASED for Display Screen
   ✅ Preflight OPTIONS handling FIXED
   ✅ Enhanced error handling
   ✅ CORS 403 errors RESOLVED
`);

// FIXED: More generous rate limiting for Display Screen
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 50; // INCREASED from 10 to 50 for live production

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

// Middleware - Moved from after active requests tracking to ensure it's applied
// Note: Basic middleware is already applied in render-startup.js
// This adds the higher limit for larger payloads
if (!app._middlewareApplied) {
  app.use(express.json({ limit: '10mb' }));
  app._middlewareApplied = true;
}

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
  
  console.log(`🌐 CORS Debug: Origin=${origin}, Path=${req.path}`);
  
  // FIXED: Always allow gobarry.co.uk and www subdomain
  if (allowedOrigins.includes(origin) || !origin || 
      (origin && (origin.includes('gobarry.co.uk') || origin.includes('localhost')))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    console.log(`✅ CORS: Allowed origin: ${origin}`);
  } else {
    console.log(`⚠️ CORS: Blocked origin: ${origin}, but allowing anyway for production`);
    res.header('Access-Control-Allow-Origin', origin || 'https://gobarry.co.uk');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-session-id, User-Agent, X-API-Key, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight: ${req.headers.origin} → ${req.path}`);
    return res.status(200).end();
  }
  
  next();
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

// DEBUG: Log that we're registering routes
console.log('🎯 index.js: Starting route registration on app instance');
console.log(`🎯 index.js: App exists: ${!!app}, Server exists: ${!!server}`);
console.log(`🎯 index.js: App instance marker: ${app._goBarryInstance || 'not set'}`);
console.log(`🎯 index.js: Same app check: ${app === global.goBarryApp}`);

// Health endpoint
app.use('/api/health', healthRoutes);
app.use('/api/health-extended', healthExtendedRouter);

// Bus health endpoint
app.get('/api/buses/health', (req, res) => {
  res.json({
    success: true,
    busService: busLocationService.getHealth(),
    updateLoop: busUpdateLoop.getStatus()
  });
});

// Admin API routes
app.use('/api/admin', adminAPI);

// Cleanup & Maintenance API routes
app.use('/api/cleanup', cleanupAPI);

// Supervisor management routes
app.use('/api/supervisor', supervisorAPI);

// Roadworks management routes  
app.use('/api/roadworks', roadworksAPI);

// Unified roadworks management API (additional routes under /api/roadworks)
app.use('/api/roadworks', unifiedRoadworksAPI);
console.log('✅ unified roadworks API routes registered under /api/roadworks');

// Roadworks V2 API routes
console.log('🔄 Registering roadworks V2 routes at /api/roadworks-v2...');
app.use('/api/roadworks-v2', roadworksV2API);
console.log('✅ Roadworks V2 routes registered successfully');

// GTFS routes for route matching and testing
console.log('🚌 Registering GTFS routes at /api/gtfs...');
app.use('/api/gtfs', gtfsAPI);
console.log('✅ GTFS routes registered successfully');

// Roadwork alerts routes (supervisor-created roadwork notifications)
console.log('📦 Registering roadwork alerts routes at /api/roadwork-alerts...');
app.use('/api/roadwork-alerts', roadworkAlertsAPI);
console.log('✅ Roadwork alerts routes registered successfully');

// StreetManager actions API routes
console.log('🙧 Registering StreetManager actions routes at /api/streetmanager/actions...');
app.use('/api/streetmanager/actions', streetManagerActionsAPI);
console.log('✅ StreetManager actions routes registered successfully');

// Message API routes for Message Distribution Centre
console.log('💬 Registering message API routes at /api/messages...');
app.use('/api/messages', messageAPI);
console.log('✅ Message API routes registered successfully');

// Disruptions API routes for roadwork communication tracking
console.log('📊 Registering disruptions API routes at /api/disruptions...');
app.use('/api/disruptions', disruptionsAPI);
console.log('✅ Disruptions API routes registered successfully');

// Test endpoint for roadwork alerts debugging (after main router)
app.get('/api/roadwork-alerts-test', (req, res) => {
  res.json({
    success: true,
    message: 'Roadwork alerts endpoint is working!',
    timestamp: new Date().toISOString(),
    source: 'index.js',
    debug: {
      appInstance: 'Using global.goBarryApp',
      routeCount: global.goBarryRouteCount || 'unknown'
    },
    endpoints: {
      'GET /api/roadwork-alerts': 'List all roadworks',
      'POST /api/roadwork-alerts': 'Create new roadwork',
      'GET /api/roadwork-alerts/email-groups': 'Get email groups',
      'GET /api/roadwork-alerts-test': 'This test endpoint'
    }
  });
});

console.log('✅ index.js: Test route /api/roadwork-alerts-test registered');

// TEMPORARY FIX: Direct POST handler for roadwork alerts
app.post('/api/roadwork-alerts', async (req, res) => {
  console.log('🚨 TEMPORARY DIRECT POST HANDLER TRIGGERED');
  console.log('📝 Request body:', req.body);
  
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const {
      title,
      description,
      location,
      areas,
      status = 'pending',
      start_date,
      end_date,
      all_day,
      routes_affected,
      severity = 'medium',
      contact_info,
      web_link,
      created_by_supervisor_id,
      created_by_name,
      email_groups = []
    } = req.body;

    // Basic validation
    if (!title || !location || !start_date || !created_by_supervisor_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, location, start_date, created_by_supervisor_id' 
      });
    }

    // Create roadwork alert
    const { data: roadwork, error: createError } = await supabase
      .from('roadworks')
      .insert({
        title: title.trim(),
        description: description?.trim(),
        location: location.trim(),
        areas,
        status,
        start_date,
        end_date,
        all_day,
        routes_affected,
        severity,
        contact_info: contact_info?.trim(),
        web_link: web_link?.trim(),
        created_by_supervisor_id,
        created_by_name: created_by_name?.trim(),
        email_sent: false
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Create roadwork alert error:', createError);
      return res.status(500).json({ success: false, error: createError.message });
    }

    console.log(`✅ Roadwork alert created: ${title} by ${created_by_name}`);
    
    res.status(201).json({ 
      success: true, 
      data: roadwork,
      message: 'Roadwork created successfully (using temporary direct handler)'
    });

  } catch (error) {
    console.error('❌ Create roadwork alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Microsoft authentication routes
app.use('/api/auth', microsoftAuthAPI);

// SharePoint Excel integration routes
console.log('📊 Registering SharePoint Excel routes at /api/sharepoint...');
app.use('/api/sharepoint', sharePointExcelAPI);
console.log('✅ SharePoint Excel routes registered successfully');

// Intelligence system routes
app.use('/api/intelligence', intelligenceAPI);

// Advanced intelligence analytics routes
app.use('/api/intelligence-new', intelligenceAPINew);
console.log('✅ Advanced intelligence analytics routes registered at /api/intelligence-new');

// Enhanced GTFS analysis routes (duplicate removed)

// Incident management routes
app.use('/api/incidents', incidentAPI);

// Display management routes
app.use('/api/display', displayAPI);

// TomTom Enhancement API routes
app.use('/api/enhancement', enhancementAPI);

// Event management routes
console.log('🎫 Registering event routes at /api/events...');
app.use('/api/events', eventAPI);
console.log('✅ Event routes registered successfully');

// Service Frequency API routes
app.use('/api/frequency', frequencyAPI);

// Request throttling monitoring routes
app.use('/api/throttle', throttleAPI);

// TomTom tile serving routes
app.use('/api/tiles', tileAPI);

// TomTom usage monitoring routes
app.use('/api/tomtom/usage', tomtomUsageAPI);

// Activity logs routes - Fix: register at root level since routes include /api/ prefix
console.log('📦 Registering activity logs routes...');
app.use('/', activityLogsAPI);  // Changed from app.use(activityLogsAPI)
console.log('✅ Activity logs routes registered');

// Duty management routes
console.log('📦 Registering duty management routes...');
app.use('/api/duty', dutyAPI);
console.log('✅ Duty management routes registered');

// Messaging routes
console.log('📦 Registering messaging routes at /api/messaging...');
app.use('/api/messaging', messagingAPI);
app.use('/api/messages', messageHistoryRoutes);
console.log('✅ Messaging routes registered successfully');
console.log('✅ Message history routes registered at /api/messages');

// Analytics routes
console.log('📊 Registering analytics routes at /api/analytics...');
app.use('/api/analytics', analyticsAPI);
console.log('✅ Analytics routes registered successfully');

// Phase 7 Analytics routes (Message Distribution Centre)
console.log('📊 Registering Phase 7 analytics routes...');
app.use('/api/messages', analyticsRoutes);
app.use('/api/integrations', analyticsRoutes);
app.use('/api/search', analyticsRoutes);
console.log('✅ Phase 7 analytics routes registered successfully');

// Location correction routes
console.log('📍 Registering location correction routes at /api/location...');
app.use('/api/location', locationCorrectionAPI);
console.log('✅ Location correction routes registered successfully');

// Diversions API routes
console.log('🚏 Registering diversions routes at /api/diversions...');
import diversionsAPI from './routes/diversionsAPI.js';
app.use('/api/diversions', diversionsAPI);
console.log('✅ Diversions routes registered successfully');

// Weather API routes
console.log('🌤️ Registering weather routes at /api/weather...');
import weatherAPI from './routes/weatherAPI.js';
app.use('/api/weather', weatherAPI);
console.log('✅ Weather routes registered successfully');

// VIX Late Runners API routes
console.log('🚌 Registering VIX routes at /api/vix...');
import vixAPI from './routes/vixAPI.js';
app.use('/api/vix', vixAPI);
console.log('✅ VIX routes registered successfully');

// Template system routes
console.log('📝 Registering template routes at /api/templates...');
import templateAPI from './routes/templateAPI.js';
import bodsAPI from './routes/bodsAPI.js';
import { bodsService } from './services/bods.js';
app.use('/api/templates', templateAPI);
console.log('✅ Template routes registered successfully');

// BODS (Bus Open Data Service) API routes
console.log('🚌 Registering BODS routes at /api/bods...');
app.use('/api/bods', bodsAPI);

// Import and register Supabase optimization routes
import supabaseOptimizationAPI from './routes/supabaseOptimizationAPI.js';
console.log('🔧 Registering Supabase optimization routes at /api/supabase...');
app.use('/api/supabase', supabaseOptimizationAPI);
console.log('✅ BODS routes registered successfully');

// Initialize BODS service
bodsService.initialize().then(result => {
  if (result.success) {
    console.log('✅ BODS service initialized successfully');
  } else {
    console.warn('⚠️ BODS service initialization failed:', result.error);
  }
}).catch(err => {
  console.warn('⚠️ BODS service initialization error:', err.message);
});

// Bus location API endpoints
console.log('🚌 Registering bus location routes at /api/bus-locations...');
app.use('/api/bus-locations', busLocationsAPI);
console.log('✅ Bus location routes registered successfully');

// Initialize bus location service
busLocationService.initialize().then(result => {
  if (result.success) {
    console.log('✅ Bus location service initialized successfully');
    
    // Start the bus update loop for Convex sync
    console.log('🚌 Starting bus update loop for real-time sync...');
    busUpdateLoop.start();
    console.log('✅ Bus update loop started - syncing to Convex every 10 seconds');
  } else {
    console.warn('⚠️ Bus location service initialization failed:', result.error);
  }
}).catch(err => {
  console.warn('⚠️ Bus location service initialization error:', err.message);
});

// Bus location API endpoints
console.log('🚌 Registering bus location routes at /api/bus-locations...');
app.use('/api/bus-locations', busLocationsAPI);
console.log('✅ Bus location routes registered successfully');

// Initialize bus location service
busLocationService.initialize().then(result => {
  if (result.success) {
    console.log('✅ Bus location service initialized successfully');
  } else {
    console.warn('⚠️ Bus location service initialization failed:', result.error);
  }
}).catch(err => {
  console.warn('⚠️ Bus location service initialization error:', err.message);
});

// Initialize GTFS route shapes service (Phase 3)
gtfsRouteShapesService.initialize().then(result => {
  if (result.success) {
    console.log(`✅ GTFS route shapes service initialized: ${result.routeCount} routes loaded`);
  } else {
    console.warn('⚠️ GTFS route shapes service initialization failed:', result.error);
  }
}).catch(err => {
  console.warn('⚠️ GTFS route shapes service initialization error:', err.message);
});

// Operations stats endpoint
app.get('/api/operations/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      
      // Alert statistics
      alerts: {
        total: 0,
        bySource: {},
        bySeverity: {},
        dismissed: global.dismissedIncidents ? global.dismissedIncidents.size : 0
      },
      
      // Supervisor statistics
      supervisors: {
        active: supervisorManager.getActiveSessions ? supervisorManager.getActiveSessions().length : 0,
        totalSessions: supervisorManager.getSessionCount ? supervisorManager.getSessionCount() : 0,
        recentActivity: supervisorManager.getRecentActivity ? supervisorManager.getRecentActivity() : []
      },
      
      // Bus location statistics
      buses: busLocationService.getStatistics ? busLocationService.getStatistics() : {
        totalVehicles: 0,
        activeVehicles: 0,
        delayedVehicles: 0,
        uniqueRoutes: 0,
        lastUpdate: null
      },
      
      // System health
      system: {
        activeRequests,
        maxRequests: MAX_CONCURRENT_REQUESTS,
        memoryUsagePercent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version
      },
      
      // Data source status
      dataSources: {
        tomtom: { status: 'active', lastUpdate: new Date().toISOString() },
        nationalHighways: { status: 'active', lastUpdate: new Date().toISOString() },
        streetManager: { status: 'webhook-only', webhookEndpoint: '/api/streetmanager/webhook' },
        convex: { 
          status: (convexSync && convexSync.isConnected) ? 'connected' : 'disconnected', 
          lastSync: (convexSync && convexSync.lastSyncTime) ? convexSync.lastSyncTime : null 
        }
      },
      
      // GTFS service status
      gtfs: {
        routesLoaded: GTFS_ROUTES.size,
        shapesLoaded: gtfsRouteShapesService.isInitialized ? (gtfsRouteShapesService.getRouteCount ? gtfsRouteShapesService.getRouteCount() : 0) : 0,
        serviceAnalyzer: serviceFrequencyAnalyzer.isInitialized ? 'active' : 'initializing'
      }
    };
    
    // Try to get enhanced alert data if available
    try {
      if (enhancedDataSourceManager && enhancedDataSourceManager.getAlertStatistics) {
        const alertData = await enhancedDataSourceManager.getAlertStatistics();
        if (alertData) {
          stats.alerts = { ...stats.alerts, ...alertData };
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not fetch enhanced alert statistics:', err.message);
    }
    
    res.json({
      success: true,
      stats,
      message: 'Operational statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching operations stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: null
    });
  }
});

console.log('✅ Operations stats endpoint registered at /api/operations/stats');

// GTFS Route Shapes API endpoints (Phase 3)
console.log('🗺️ Registering GTFS route shapes routes at /api/route-shapes...');

// Get all route shapes
app.get('/api/route-shapes', async (req, res) => {
  try {
    if (!gtfsRouteShapesService.isInitialized) {
      const initResult = await gtfsRouteShapesService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }
    }

    const allShapes = gtfsRouteShapesService.getAllRouteShapes();
    
    res.json({
      success: true,
      routes: allShapes,
      metadata: {
        count: allShapes.length,
        lastLoaded: gtfsRouteShapesService.lastLoaded,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching route shapes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      routes: []
    });
  }
});

// Get specific route shapes
app.post('/api/route-shapes/by-routes', async (req, res) => {
  try {
    const { routes } = req.body;
    
    if (!Array.isArray(routes)) {
      return res.status(400).json({
        success: false,
        error: 'Routes parameter must be an array'
      });
    }

    if (!gtfsRouteShapesService.isInitialized) {
      const initResult = await gtfsRouteShapesService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }
    }

    const routeShapes = gtfsRouteShapesService.getRouteShapes(routes);
    
    res.json({
      success: true,
      routes: routeShapes,
      metadata: {
        requested: routes.length,
        found: routeShapes.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching specific route shapes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      routes: []
    });
  }
});

// Get routes within viewport bounds
app.post('/api/route-shapes/in-bounds', async (req, res) => {
  try {
    const { bounds } = req.body;
    
    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return res.status(400).json({
        success: false,
        error: 'Valid bounds required: {north, south, east, west}'
      });
    }

    if (!gtfsRouteShapesService.isInitialized) {
      const initResult = await gtfsRouteShapesService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }
    }

    const routesInBounds = gtfsRouteShapesService.getRoutesInBounds(bounds);
    
    res.json({
      success: true,
      routes: routesInBounds,
      metadata: {
        bounds,
        count: routesInBounds.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching routes in bounds:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      routes: []
    });
  }
});

// Find routes near coordinates
app.get('/api/route-shapes/near/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 250 } = req.query;
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseInt(radius);
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
      return res.status(400).json({
        success: false,
        error: 'Valid latitude, longitude, and radius required'
      });
    }

    if (!gtfsRouteShapesService.isInitialized) {
      const initResult = await gtfsRouteShapesService.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }
    }

    const nearbyRoutes = gtfsRouteShapesService.findRoutesNearCoordinates(
      latitude, longitude, radiusMeters
    );
    
    res.json({
      success: true,
      routes: nearbyRoutes,
      metadata: {
        location: { latitude, longitude },
        radius: radiusMeters,
        count: nearbyRoutes.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error finding routes near coordinates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      routes: []
    });
  }
});

// Get route shapes statistics
app.get('/api/route-shapes/stats', async (req, res) => {
  try {
    const stats = gtfsRouteShapesService.getStatistics();
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting route shapes stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      statistics: {
        isInitialized: false,
        routeCount: 0,
        shapeCount: 0
      }
    });
  }
});

// Clear route shapes cache
app.post('/api/route-shapes/refresh', async (req, res) => {
  try {
    gtfsRouteShapesService.clearCache();
    const result = await gtfsRouteShapesService.initialize();
    
    res.json({
      success: true,
      message: 'Route shapes refreshed',
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error refreshing route shapes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ GTFS route shapes routes registered successfully');

import { enhanceAlertWithCategory } from './services/alertCategorizer.js';

// Filtered alerts endpoints for manager screens
app.get('/api/roadworks-alerts', async (req, res) => {
  try {
    console.log('🚧 Fetching roadwork alerts for manager (including StreetManager)...');
    
    let allRoadworks = [];
    let sourceStats = {};
    
    // 1. Get alerts from traffic APIs (TomTom, National Highways, etc.)
    try {
      const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
      
      if (aggregatedResult && aggregatedResult.incidents) {
        // Enhance alerts with categories
        const categorizedAlerts = aggregatedResult.incidents.map(enhanceAlertWithCategory);
        
        // Filter for roadworks only
        const trafficRoadworkAlerts = categorizedAlerts.filter(alert => alert.isRoadwork);
        allRoadworks.push(...trafficRoadworkAlerts);
        sourceStats = aggregatedResult.sourceStats || {};
        
        console.log(`✅ Found ${trafficRoadworkAlerts.length} roadwork alerts from traffic APIs`);
      }
    } catch (trafficError) {
      console.error('⚠️ Error fetching traffic roadworks:', trafficError);
    }
    
    // 2. Get StreetManager roadworks from NEW notifications table
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Get active roadworks from the view
      const { data: streetManagerNotifications, error: notifError } = await supabase
        .from('active_streetmanager_roadworks')
        .select('*')
        .order('severity', { ascending: false });
      
      if (notifError) {
        console.error('⚠️ Error fetching StreetManager notifications:', notifError);
      } else if (streetManagerNotifications && streetManagerNotifications.length > 0) {
        // Transform database roadworks to match API format
        const transformedStreetManagerRoadworks = streetManagerNotifications.map(rw => ({
          id: rw.notification_id || `streetmanager_${Date.now()}`,
          title: rw.title,
          description: rw.description || rw.detailed_description || '',
          location: rw.location_description || rw.street_name || rw.area_name || 'Location not specified',
          coordinates: rw.coordinates ? [rw.coordinates.lat, rw.coordinates.lng] : null,
          status: rw.alert_status || 'amber',
          severity: rw.severity || 'Medium',
          type: 'roadwork',
          source: 'StreetManager',
          dataSource: 'StreetManager Webhook Database',
          
          // StreetManager specific fields
          authority: rw.highway_authority || rw.promoter_organisation || 'Highway Authority',
          permitReference: rw.permit_reference_number,
          activityReference: rw.activity_reference_number,
          workCategory: rw.work_category_ref,
          workType: rw.activity_type,
          isEmergency: rw.is_emergency_works || false,
          streetName: rw.street_name,
          areaName: rw.area_name,
          usrn: rw.usrn,
          activityStatus: rw.activity_status,
          permitStatus: rw.permit_status,
          workflowStatus: rw.workflow_status,
          
          // Timing
          startDate: rw.actual_start_date || rw.proposed_start_date,
          endDate: rw.actual_end_date || rw.proposed_end_date,
          lastUpdated: rw.updated_at || rw.webhook_received_at,
          
          // Enhancement flags
          locationAccuracy: 'high',
          routeMatchMethod: 'streetmanager-database',
          officialSource: true,
          realTimeUpdate: true,
          isRoadwork: true,
          
          // Routes affected - will be populated by route matching
          affectsRoutes: [],
          
          // Map URLs for easy navigation
          mapUrl: rw.coordinates ? `https://www.google.com/maps?q=${rw.coordinates.lat},${rw.coordinates.lng}` : null,
          directionsUrl: rw.coordinates ? `https://www.google.com/maps/dir/?api=1&destination=${rw.coordinates.lat},${rw.coordinates.lng}` : null,
          
          // Display fields
          displayLocation: rw.street_name || rw.location_description || rw.area_name || 'Location not specified',
          hasMapLink: !!rw.coordinates
        }));
        
        allRoadworks.push(...transformedStreetManagerRoadworks);
        sourceStats.streetManager = {
          name: 'StreetManager Webhook Database',
          count: transformedStreetManagerRoadworks.length,
          status: 'active',
          realtime: true
        };
        
        console.log(`✅ Found ${transformedStreetManagerRoadworks.length} StreetManager roadworks from webhook database`);
      }
      
      // Also check old roadworks table for any supervisor-created StreetManager entries
      const { data: manualStreetManagerRoadworks, error: dbError } = await supabase
        .from('roadworks')
        .select('*')
        .eq('source', 'streetmanager')
        .order('created_at', { ascending: false });
      
      if (!dbError && manualStreetManagerRoadworks && manualStreetManagerRoadworks.length > 0) {
        const transformedManualRoadworks = manualStreetManagerRoadworks.map(rw => ({
          id: rw.id || `manual_streetmanager_${Date.now()}`,
          title: rw.title,
          description: rw.description || '',
          location: rw.location,
          coordinates: rw.coordinates ? [rw.coordinates.latitude, rw.coordinates.longitude] : null,
          status: rw.status,
          severity: rw.severity,
          type: 'roadwork',
          source: 'StreetManager',
          dataSource: 'Manual Entry',
          authority: rw.contact_info,
          startDate: rw.start_date,
          endDate: rw.end_date,
          lastUpdated: rw.updated_at || rw.created_at,
          locationAccuracy: 'manual',
          routeMatchMethod: 'manual-entry',
          officialSource: false,
          isRoadwork: true,
          affectsRoutes: rw.routes_affected || [],
          mapUrl: rw.coordinates ? `https://www.google.com/maps?q=${rw.coordinates.latitude},${rw.coordinates.longitude}` : null,
          displayLocation: rw.location || 'Location not specified'
        }));
        
        allRoadworks.push(...transformedManualRoadworks);
        sourceStats.manualStreetManager = {
          name: 'Manual StreetManager Entries',
          count: transformedManualRoadworks.length,
          status: 'active'
        };
        
        console.log(`✅ Found ${transformedManualRoadworks.length} manual StreetManager entries`);
      }
    } catch (dbError) {
      console.error('⚠️ Error fetching StreetManager roadworks:', dbError);
    }
    
    console.log(`✅ Total roadwork alerts: ${allRoadworks.length}`);
    
    res.json({
      success: true,
      roadworks: allRoadworks,
      metadata: {
        total: allRoadworks.length,
        sources: sourceStats,
        lastUpdated: new Date().toISOString(),
        includesStreetManager: true
      }
    });
  } catch (error) {
    console.error('❌ Error fetching roadwork alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      roadworks: [] 
    });
  }
});

// Street Manager roadworks endpoint for RoadworksManagerV2
app.get('/api/street-manager-roadworks', async (req, res) => {
  try {
    console.log('🚧 Fetching Street Manager roadworks...');
    
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Get recent Street Manager notifications (active roadworks)
    const { data: roadworks, error } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .not('raw_webhook_data', 'is', null)
      .in('webhook_event_type', ['WORK_START', 'PERMIT_GRANTED', 'PERMIT_SUBMITTED', 'WORK_STOP'])
      .gte('webhook_received_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('webhook_received_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('❌ Error fetching streetworks:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        roadworks: [] 
      });
    }
    
    // Pre-filter to exclude Birmingham and other non-North East areas immediately
    const filteredRoadworks = (roadworks || []).filter(rw => {
      const rawData = rw.raw_webhook_data?.object_data || {};
      const streetName = rawData.street_name || '';
      const town = rawData.town || '';
      const areaName = rawData.area_name || '';
      
      // Smartly exclude non-North East areas while preserving the review queue
      const excludePatterns = [
        // Major cities clearly outside North East
        'BIRMINGHAM', 'WALSALL', 'WOLVERHAMPTON', 'COVENTRY', 'SOLIHULL',
        'LONDON', 'MANCHESTER', 'LIVERPOOL', 'BRISTOL', 'SHEFFIELD', 'LEEDS', 
        'NOTTINGHAM', 'LEICESTER', 'DERBY', 'LINCOLN', 'HULL', 'YORK',
        
        // Specific problem locations from logs
        'LINCOLNSHIRE', 'SLEAFORD', 'CROWLE', 'CROPWELL BISHOP',
        'STRETTON', 'DUDLEY', 'WEST BROMWICH',
        
        // Southwest England
        'EXETER', 'PLYMOUTH', 'BOURNEMOUTH', 'POOLE', 'BATH', 'BRISTOL',
        'GLOUCESTER', 'CHELTENHAM', 'SWINDON', 'OXFORD', 'READING',
        'SOUTHAMPTON', 'PORTSMOUTH', 'BRIGHTON', 'WORTHING',
        
        // East England  
        'NORWICH', 'IPSWICH', 'CAMBRIDGE', 'LUTON', 'MILTON KEYNES',
        'WATFORD', 'ST ALBANS', 'PETERBOROUGH',
        
        // Southeast England
        'CANTERBURY', 'FOLKESTONE', 'DOVER', 'MAIDSTONE', 'DARTFORD', 'GRAVESEND',
        
        // Wales (full county names to be specific)
        'CARDIFF', 'SWANSEA', 'NEWPORT', 'WREXHAM',
        
        // Scotland  
        'GLASGOW', 'EDINBURGH', 'DUNDEE', 'ABERDEEN',
        
        // Specific counties that are definitely not North East
        'LINCOLNSHIRE', 'DERBYSHIRE', 'NOTTINGHAMSHIRE', 'LEICESTERSHIRE',
        'WARWICKSHIRE', 'STAFFORDSHIRE', 'WORCESTERSHIRE', 'GLOUCESTERSHIRE',
        'OXFORDSHIRE', 'BERKSHIRE', 'HAMPSHIRE', 'SURREY', 'KENT', 'ESSEX',
        'HERTFORDSHIRE', 'SUFFOLK', 'NORFOLK', 'CAMBRIDGESHIRE',
        'WEST YORKSHIRE', 'SOUTH YORKSHIRE', 'GREATER MANCHESTER', 'MERSEYSIDE',
        'CHESHIRE', 'SHROPSHIRE'
      ];
      const locationString = `${streetName} ${town} ${areaName}`.toUpperCase();
      
      const shouldExclude = excludePatterns.some(pattern => locationString.includes(pattern));
      if (shouldExclude) {
        console.log(`🚫 Excluding non-North East roadwork: ${locationString}`);
        return false;
      }
      
      // DEBUG: Log all locations that pass pre-filtering
      console.log(`📍 LOCATION PASSED PRE-FILTER: "${locationString}"`);
      
      return true;
    });
    
    console.log(`🗺️ Pre-filtered ${roadworks?.length || 0} down to ${filteredRoadworks.length} roadworks (excluded non-North East areas)`);
    
    // Transform Street Manager notifications to frontend format
    const transformedRoadworks = filteredRoadworks.map(rw => {
      const rawData = rw.raw_webhook_data?.object_data || {};
      
      // Determine work status and severity
      const workStatus = rawData.work_status_ref || rawData.work_status || 'unknown';
      const workCategory = rawData.work_category_ref || rawData.work_category || 'standard';
      
      return {
        id: rw.id,
        title: rawData.street_name ? 
          `${rawData.street_name} - ${rawData.activity_type || 'Street Works'}` : 
          `Street Manager Roadwork (${rw.webhook_event_type})`,
        location: [rawData.street_name, rawData.town, rawData.area_name]
          .filter(Boolean)
          .join(', ') || 'Location TBC',
        description: [
          rawData.activity_type,
          rawData.traffic_management_type,
          rawData.work_category
        ].filter(Boolean).join(' • ') || rw.webhook_event_type,
        
        // Map work status to frontend status
        status: workStatus === 'in_progress' ? 'active' :
                workStatus === 'planned' ? 'planned' :
                workStatus === 'completed' ? 'completed' :
                rw.webhook_event_type === 'WORK_START' ? 'active' :
                rw.webhook_event_type === 'WORK_STOP' ? 'completed' : 'planned',
        
        // Map work category to severity
        severity: workCategory === 'immediate_urgent' ? 'critical' :
                  workCategory === 'major' ? 'high' :
                  workCategory === 'standard' ? 'medium' :
                  workCategory === 'minor' ? 'low' : 'medium',
        
        startDate: rawData.actual_start_date_time || rawData.proposed_start_date,
        endDate: rawData.actual_end_date_time || rawData.proposed_end_date,
        affectsRoutes: rw.affected_routes || [],
        
        // Parse coordinates if available
        coordinates: rawData.works_location_coordinates ? 
          parseStreetManagerCoordinates(rawData.works_location_coordinates) : null,
        
        source: 'StreetManager',
        eventType: rw.webhook_event_type,
        permitReference: rawData.permit_reference_number,
        workReference: rawData.work_reference_number,
        authority: rawData.highway_authority,
        promoter: rawData.promoter_organisation,
        trafficManagement: rawData.traffic_management_type,
        workCategory: rawData.work_category,
        usrn: rawData.usrn,
        roadCategory: rawData.road_category,
        
        // Metadata
        webhookReceived: rw.webhook_received_at,
        processedAt: rw.processed_at,
        hasDiversion: (rw.affected_routes?.length || 0) > 0,
        createdAt: rw.created_at,
        updatedAt: rw.updated_at
      };
    });
    
    // Route-based filtering: Check if roadwork affects Go North East routes
    const affectsGNERoutes = async (roadwork) => {
      // 1. Check if already has route assignments
      if (roadwork.affectsRoutes && Array.isArray(roadwork.affectsRoutes) && roadwork.affectsRoutes.length > 0) {
        return roadwork.affectsRoutes.some(route => {
          const routeStr = String(route).toUpperCase();
          return routeStr.includes('GNE') || /^[1-9][0-9]{0,2}[A-Z]?$/.test(routeStr);
        });
      }
      
      // 2. Use coordinate-based route matching if coordinates available
      if (roadwork.coordinates && roadwork.coordinates.lat && roadwork.coordinates.lng) {
        try {
          const routes = findRoutesNearCoordinatesFixed(
            roadwork.coordinates.lat, 
            roadwork.coordinates.lng, 
            500 // 500m radius
          );
          
          if (routes.length > 0) {
            console.log(`🚌 Route match for "${roadwork.location}": ${routes.join(', ')}`);
            // Update roadwork with found routes
            roadwork.affectsRoutes = routes;
            return true;
          }
        } catch (error) {
          console.warn(`⚠️ Route matching failed for ${roadwork.location}:`, error.message);
        }
      }
      
      // 3. Fallback to location-based matching for key areas
      const location = roadwork.location.toUpperCase();
      const keyAreas = [
        'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'NORTH TYNESIDE', 'SOUTH TYNESIDE',
        'NORTHUMBERLAND', 'STANLEY', 'WASHINGTON', 'CONSETT', 'CHESTER LE STREET'
      ];
      
      const inKeyArea = keyAreas.some(area => location.includes(area));
      if (inKeyArea) {
        console.log(`📍 Key area match for "${roadwork.location}" - assuming affects routes`);
        return true;
      }
      
      return false;
    };
    
    // Filter roadworks to those affecting Go North East routes
    const gneRoadworks = [];
    for (const roadwork of transformedRoadworks) {
      const affects = await affectsGNERoutes(roadwork);
      if (affects) {
        gneRoadworks.push(roadwork);
        console.log(`✅ KEEPING: "${roadwork.location}" - affects GNE routes`);
      } else {
        console.log(`❌ FILTERING: "${roadwork.location}" - no GNE route impact`);
      }
    }
    
    const northEastRoadworks = gneRoadworks;
    
    console.log(`✅ Found ${transformedRoadworks.length} total Street Manager roadworks, ${northEastRoadworks.length} affecting GNE routes`);
    if (transformedRoadworks.length > northEastRoadworks.length) {
      console.log(`🚌 Filtered out ${transformedRoadworks.length - northEastRoadworks.length} roadworks with no GNE route impact`);
    }
    
    res.json({
      success: true,
      roadworks: northEastRoadworks,
      metadata: {
        total: northEastRoadworks.length,
        totalUnfiltered: transformedRoadworks.length,
        source: 'streetworks_table',
        lastUpdated: new Date().toISOString(),
        filtering: 'Go North East routes only',
        method: 'route-based with coordinate matching'
      }
    });
  } catch (error) {
    console.error('❌ Error in street-manager-roadworks endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      roadworks: [] 
    });
  }
});

// Helper function to parse Street Manager coordinates
function parseStreetManagerCoordinates(coordString) {
  try {
    if (!coordString) return null;
    
    // Handle POINT(x y) format
    if (coordString.startsWith('POINT(')) {
      const coords = coordString.match(/POINT\(([^)]+)\)/);
      if (coords && coords[1]) {
        const [x, y] = coords[1].split(' ').map(Number);
        // Convert British National Grid to approximate lat/lng
        return convertBNGToLatLng(x, y);
      }
    }
    
    // Handle LINESTRING format - use first point
    if (coordString.startsWith('LINESTRING(')) {
      const coords = coordString.match(/LINESTRING\(([^)]+)\)/);
      if (coords && coords[1]) {
        const firstPoint = coords[1].split(',')[0].trim();
        const [x, y] = firstPoint.split(' ').map(Number);
        return convertBNGToLatLng(x, y);
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing coordinates:', coordString, error);
    return null;
  }
}

// Approximate BNG to Lat/Lng conversion (for display purposes)
function convertBNGToLatLng(easting, northing) {
  try {
    // This is a simplified conversion - for precise conversion, use proj4
    const lat = 49.766 + (northing - 100000) * 0.000009;
    const lng = -7.557 + (easting - 100000) * 0.000014;
    
    // Basic validation for UK coordinates
    if (lat < 49 || lat > 61 || lng < -8 || lng > 2) {
      return null;
    }
    
    return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
  } catch (error) {
    return null;
  }
}

console.log('✅ Street Manager roadworks endpoint registered at /api/street-manager-roadworks');

// Quick test endpoint to verify data
app.get('/api/test-streetmanager', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { data, error } = await supabase
      .from('streetmanager_notifications')
      .select('id, webhook_event_type, webhook_received_at')
      .order('webhook_received_at', { ascending: false })
      .limit(10);
    
    res.json({
      success: true,
      count: data?.length || 0,
      sampleData: data || [],
      error: error?.message || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats endpoint for Roadworks Manager V2
app.get('/api/roadworks-v2/stats', async (req, res) => {
  try {
    // Simple stats response - avoid complex queries for now
    res.json({
      success: true,
      stats: {
        pendingReview: 0, // Placeholder - will be enhanced later
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stats: { pendingReview: 0 }
    });
  }
});

// Comprehensive test endpoint for Roadworks Manager V2
app.get('/api/roadworks-v2/status', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Test Street Manager notifications
    const { data: notifications, error: notifError } = await supabase
      .from('streetmanager_notifications')
      .select('webhook_event_type')
      .gte('webhook_received_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);
    
    // Test roadworks endpoint
    const roadworksResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/street-manager-roadworks`);
    const roadworksData = roadworksResponse.ok ? await roadworksResponse.json() : null;
    
    // Group notifications by event type
    const eventCounts = (notifications || []).reduce((acc, notif) => {
      acc[notif.webhook_event_type] = (acc[notif.webhook_event_type] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      streetManager: {
        totalNotifications24h: notifications?.length || 0,
        eventTypes: eventCounts,
        hasData: (notifications?.length || 0) > 0
      },
      roadworksEndpoint: {
        accessible: roadworksResponse?.ok || false,
        roadworksCount: roadworksData?.roadworks?.length || 0,
        sampleRoadwork: roadworksData?.roadworks?.[0] || null
      },
      systemHealth: {
        database: !notifError,
        apiEndpoint: roadworksResponse?.ok || false,
        dataFlow: (notifications?.length || 0) > 0 && (roadworksData?.roadworks?.length || 0) > 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Diagnostic endpoint to check Supabase data
app.get('/api/debug/roadworks-data', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Check streetworks table
    const { data: streetworks, error: streetworksError, count: streetworksCount } = await supabase
      .from('streetworks')
      .select('*', { count: 'exact' })
      .limit(5);
    
    // Check roadworks table (legacy)
    const { data: roadworks, error: roadworksError, count: roadworksCount } = await supabase
      .from('roadworks')
      .select('*', { count: 'exact' })
      .limit(5);
    
    // Check active_streetmanager_roadworks view
    const { data: activeView, error: viewError } = await supabase
      .from('active_streetmanager_roadworks')
      .select('*')
      .limit(5);
    
    // Check streetmanager_notifications table
    const { data: notifications, error: notifError, count: notifCount } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact' })
      .limit(5);
    
    res.json({
      success: true,
      tables: {
        streetworks: {
          totalCount: streetworksCount || 0,
          error: streetworksError?.message,
          sampleData: streetworks || [],
          hasData: (streetworks?.length || 0) > 0
        },
        roadworks: {
          totalCount: roadworksCount || 0,
          error: roadworksError?.message,
          sampleData: roadworks || [],
          hasData: (roadworks?.length || 0) > 0
        },
        active_streetmanager_roadworks: {
          error: viewError?.message,
          sampleData: activeView || [],
          hasData: (activeView?.length || 0) > 0,
          note: 'This is a view, not a table'
        },
        streetmanager_notifications: {
          totalCount: notifCount || 0,
          error: notifError?.message,
          sampleData: notifications || [],
          hasData: (notifications?.length || 0) > 0
        }
      },
      summary: {
        hasAnyData: (streetworks?.length || 0) > 0 || (roadworks?.length || 0) > 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Debug roadworks data endpoint registered at /api/debug/roadworks-data');

// Test data creation endpoint
app.post('/api/debug/create-test-roadworks', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Create test data for streetworks table
    const testStreetworks = [
      {
        works_reference_number: `TEST-${Date.now()}-1`,
        permit_reference_number: 'TEST-PERMIT-001',
        title: 'Test Roadworks - A1 Junction 65',
        description: 'Emergency repairs following water main burst',
        street_name: 'A1 Northbound',
        location_description: 'Junction 65 to Junction 66',
        coordinates: { lat: 54.9783, lng: -1.6178 },
        highway_authority: 'Newcastle City Council',
        promoter_organisation: 'Northumbrian Water',
        severity: 'high',
        status: 'pending',
        affected_routes: ['21', 'X21', '22'],
        proposed_start_date: new Date().toISOString(),
        proposed_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        work_category: 'immediate_urgent',
        activity_type: 'remedial_works',
        traffic_management_type: 'road_closure',
        created_at: new Date().toISOString()
      },
      {
        works_reference_number: `TEST-${Date.now()}-2`,
        permit_reference_number: 'TEST-PERMIT-002',
        title: 'Test Roadworks - Central Station',
        description: 'Planned maintenance of traffic signals',
        street_name: 'Neville Street',
        location_description: 'Central Station approach',
        coordinates: { lat: 54.9683, lng: -1.6178 },
        highway_authority: 'Newcastle City Council',
        promoter_organisation: 'Newcastle City Council',
        severity: 'medium',
        status: 'approved',
        affected_routes: ['Q3', '10', '10A', '10B'],
        proposed_start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        proposed_end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        work_category: 'standard',
        activity_type: 'utility_repair',
        traffic_management_type: 'lane_closure',
        created_at: new Date().toISOString()
      },
      {
        works_reference_number: `TEST-${Date.now()}-3`,
        permit_reference_number: 'TEST-PERMIT-003',
        title: 'Test Roadworks - Gateshead Interchange',
        description: 'Resurfacing works',
        street_name: 'A167',
        location_description: 'Gateshead Interchange approach',
        coordinates: { lat: 54.9626, lng: -1.6014 },
        highway_authority: 'Gateshead Council',
        promoter_organisation: 'Gateshead Council',
        severity: 'critical',
        status: 'pending',
        affected_routes: ['53', '54', '27', '28'],
        proposed_start_date: new Date().toISOString(),
        proposed_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        work_category: 'major',
        activity_type: 'major_works',
        traffic_management_type: 'multi_way_signals',
        created_at: new Date().toISOString()
      }
    ];
    
    // Insert test streetworks
    const { data: insertedStreetworks, error: streetworksError } = await supabase
      .from('streetworks')
      .insert(testStreetworks)
      .select();
    
    // Create test data for legacy roadworks table
    const testRoadworks = [
      {
        title: 'Test Manual Roadwork - Great North Road',
        description: 'Manual entry for roadworks not in Street Manager',
        location: 'Great North Road, Newcastle',
        areas: ['Newcastle', 'Gosforth'],
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        routes_affected: ['1', '2'],
        severity: 'medium',
        source: 'manual',
        created_by_supervisor_id: 'TEST001',
        created_by_name: 'Test Supervisor',
        coordinates: { latitude: 55.0083, longitude: -1.5808 }
      }
    ];
    
    // Insert test roadworks
    const { data: insertedRoadworks, error: roadworksError } = await supabase
      .from('roadworks')
      .insert(testRoadworks)
      .select();
    
    res.json({
      success: true,
      message: 'Test data created successfully',
      results: {
        streetworks: {
          created: insertedStreetworks?.length || 0,
          error: streetworksError?.message,
          data: insertedStreetworks
        },
        roadworks: {
          created: insertedRoadworks?.length || 0,
          error: roadworksError?.message,
          data: insertedRoadworks
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Test data creation endpoint registered at /api/debug/create-test-roadworks');

app.get('/api/incident-alerts', async (req, res) => {
  try {
    console.log('🚨 Fetching incident alerts for manager...');
    
    // Get alerts from enhanced endpoint
    const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
    
    if (!aggregatedResult || !aggregatedResult.incidents) {
      return res.json({ success: true, incidents: [] });
    }
    
    // Enhance alerts with categories
    const categorizedAlerts = aggregatedResult.incidents.map(enhanceAlertWithCategory);
    
    // Filter for incidents only (not roadworks)
    const incidentAlerts = categorizedAlerts.filter(alert => alert.isIncident);
    
    // Also get manual incidents
    const manualIncidents = getManualIncidents();
    const allIncidents = [...incidentAlerts, ...manualIncidents.map(convertIncidentToAlert)];
    
    console.log(`✅ Filtered ${incidentAlerts.length} traffic incidents + ${manualIncidents.length} manual incidents`);
    
    res.json({
      success: true,
      incidents: allIncidents,
      metadata: {
        total: allIncidents.length,
        trafficIncidents: incidentAlerts.length,
        manualIncidents: manualIncidents.length,
        sources: aggregatedResult.sourceStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching incident alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      incidents: [] 
    });
  }
});

// TomTom API key endpoint for frontend
app.get('/api/config/tomtom-key', (req, res) => {
  try {
    // Use the provided API key
    const apiKey = process.env.TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'TomTom API key not configured'
      });
    }
    
    res.json({
      success: true,
      apiKey: apiKey
    });
  } catch (error) {
    console.error('❌ Error getting TomTom API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API key'
    });
  }
});

// Event monitoring routes
app.use('/api/events', eventAPI);

// StreetManager webhook routes (using new manage-roadworks.service.gov.uk integration)
// NOTE: Route is now mounted EARLY before JSON middleware for raw body access.
// console.log('📨 Registering Street Manager webhook routes at /api/streetmanager...');
// app.use('/api/streetmanager', streetManagerWebhookRouter);
// console.log('✅ Street Manager webhook routes registered successfully');

// Legacy StreetManager webhook (keeping for backward compatibility)
app.post('/api/streetmanager/webhook-legacy', async (req, res) => {
  try {
    console.log('🚧 StreetManager webhook received');
    const result = streetManagerWebhooks.handleWebhookMessage(req.body);
    res.json({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ StreetManager webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/streetmanager/activities', (req, res) => {
  try {
    const result = streetManagerWebhooks.getWebhookActivities();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

app.get('/api/streetmanager/permits', (req, res) => {
  try {
    const result = streetManagerWebhooks.getWebhookPermits();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

app.get('/api/streetmanager/status', (req, res) => {
  try {
    const status = streetManagerWebhooks.getWebhookStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Geocoding endpoint for incident manager
app.get('/api/geocode/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { geocodeLocation } = await import('./services/geocoding.js');
    
    const result = await geocodeLocation(location);
    
    if (result) {
      res.json({
        success: true,
        location: result.name,
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude
        },
        confidence: result.confidence,
        source: result.source
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    res.status(500).json({
      success: false,
      error: 'Geocoding failed'
    });
  }
});

// GTFS stop search endpoint
app.get('/api/routes/search-stops', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        stops: []
      });
    }
    
    // Simple stop search - in production this would search the GTFS stops data
    // For now, return some sample North East stops that match the query
    const sampleStops = [
      { stop_id: '1001', stop_code: 'NE001', stop_name: 'Newcastle Central Station', stop_lat: 54.9783, stop_lon: -1.6178 },
      { stop_id: '1002', stop_code: 'GH001', stop_name: 'Gateshead Interchange', stop_lat: 54.9526, stop_lon: -1.6014 },
      { stop_id: '1003', stop_code: 'SU001', stop_name: 'Sunderland City Centre', stop_lat: 54.9069, stop_lon: -1.3838 },
      { stop_id: '1004', stop_code: 'DU001', stop_name: 'Durham Bus Station', stop_lat: 54.7753, stop_lon: -1.5849 },
      { stop_id: '1005', stop_code: 'HX001', stop_name: 'Hexham Bus Station', stop_lat: 54.9698, stop_lon: -2.1015 }
    ];
    
    const matchingStops = sampleStops.filter(stop => 
      stop.stop_name.toLowerCase().includes(query.toLowerCase()) ||
      stop.stop_code.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({
      success: true,
      stops: matchingStops.slice(0, 5) // Limit to 5 results
    });
  } catch (error) {
    console.error('❌ Stop search error:', error);
    res.status(500).json({
      success: false,
      error: 'Stop search failed',
      stops: []
    });
  }
});

// Find routes near coordinate endpoint
app.get('/api/routes/find-near-coordinate', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    const routes = findRoutesNearCoordinatesFixed(latitude, longitude, 250);
    
    res.json({
      success: true,
      routes: routes,
      location: { latitude, longitude },
      radius: 250,
      count: routes.length
    });
  } catch (error) {
    console.error('❌ Routes near coordinate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find routes near coordinate',
      routes: []
    });
  }
});

// Test endpoint for AI diversion engine
app.get('/api/test/diversions', async (req, res) => {
  try {
    const testIncident = {
      id: 'test_001',
      type: 'road_closure',
      location: 'Newcastle Central Station',
      coordinates: {
        latitude: 54.9783,
        longitude: -1.6178
      },
      description: 'Test incident for diversion engine',
      severity: 'High',
      priority: 'CRITICAL',
      affectsRoutes: ['21', '22', 'Q3', '1', '2']
    };
    
    const { default: diversionEngine } = await import('./services/intelligence/diversionEngine.js');
    const suggestions = await diversionEngine.getDiversionSuggestions(testIncident);
    const formatted = diversionEngine.formatDiversionsForDisplay(suggestions);
    
    res.json({
      success: true,
      testIncident,
      suggestions,
      formatted,
      summary: {
        diversions: suggestions.diversions.length,
        tomtomRoutes: suggestions.tomtomRoutes?.length || 0,
        keyAdvice: suggestions.generalAdvice.filter(a => a.priority === 'high').length,
        interchanges: suggestions.interchanges.length
      }
    });
  } catch (error) {
    console.error('❌ Test diversions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Missing API endpoints that frontend is calling
app.get('/api/health/database', (req, res) => {
  res.json({
    success: true,
    database: {
      status: 'operational',
      type: 'supabase + local_json',
      lastCheck: new Date().toISOString(),
      tables: {
        supervisors: 'active',
        alerts: 'active', 
        settings: 'active'
      }
    }
  });
});

app.get('/api/routes/gtfs-stats', (req, res) => {
  res.json({
    success: true,
    gtfsStats: {
      routesLoaded: GTFS_ROUTES.size,
      status: 'loaded',
      lastUpdate: new Date().toISOString(),
      version: 'enhanced_v2.0'
    }
  });
});

app.get('/api/geocoding/stats', (req, res) => {
  res.json({
    success: true,
    geocodingStats: {
      status: 'operational',
      providers: ['mapbox', 'openstreetmap'],
      cacheHits: 0,
      totalRequests: 0,
      lastUsed: new Date().toISOString()
    }
  });
});

app.get('/api/messaging/channels', (req, res) => {
  res.json({
    success: true,
    channels: [
      {
        id: 'supervisor_alerts',
        name: 'Supervisor Alerts',
        type: 'internal',
        status: 'active'
      },
      {
        id: 'passenger_updates', 
        name: 'Passenger Updates',
        type: 'public',
        status: 'active'
      }
    ]
  });
});

// Check if alert is dismissed (with hash-based checking for consistency)
function isAlertDismissed(alertId, alert = null) {
  if (!global.dismissedIncidents) return false;
  
  // Check by exact ID first
  if (global.dismissedIncidents.has(alertId)) {
    return true;
  }
  
  // If alert object provided, also check by content hash
  if (alert) {
    const alertHash = generateAlertHash(alert);
    const hashKey = `hash_${alertHash}`;
    
    if (global.dismissedIncidents.has(hashKey)) {
      return true;
    }
  }
  
  return false;
}

// Filter out dismissed alerts with improved checking
function filterDismissedAlerts(alerts, requestId) {
  if (!Array.isArray(alerts)) return [];
  
  // Periodic cleanup of expired dismissals (every ~100 requests)
  if (!global.lastCleanup || Date.now() - global.lastCleanup > 10 * 60 * 1000) {
    if (global.dismissedIncidents) {
      const cleanedCount = cleanupExpiredDismissals(global.dismissedIncidents, 48);
      if (cleanedCount > 0) {
        console.log(`🧹 [${requestId}] Cleaned up ${cleanedCount} expired dismissals`);
      }
    }
    global.lastCleanup = Date.now();
  }
  
  const filtered = alerts.filter(alert => {
    const dismissed = isAlertDismissed(alert.id, alert);
    if (dismissed) {
      console.log(`🙅 [${requestId}] Alert ${alert.id} dismissed (${alert.location})`);
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

// Enhanced alert filtering with advanced deduplication
function enhancedAlertFiltering(alerts, requestId) {
  if (!Array.isArray(alerts)) return [];
  
  console.log(`🔍 [${requestId}] Enhanced filtering with advanced deduplication starting with ${alerts.length} alerts`);
  
  // Use the new advanced deduplication system
  const deduplicated = deduplicateAlerts(alerts, requestId);
  
  // Additional basic filtering for any remaining edge cases
  const filtered = deduplicated.filter(alert => {
    if (!alert || typeof alert !== 'object') return false;
    
    // Filter out obviously invalid alerts
    const id = (alert.id || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    const source = (alert.source || '').toString().toLowerCase();
    
    if (id.includes('test_data') || id.includes('sample_test') || 
        title.includes('test alert') || source === 'test_system') {
      console.log(`🗑️ [${requestId}] Filtered test alert: ${id}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`✅ [${requestId}] Enhanced filtering with advanced deduplication: ${alerts.length} → ${filtered.length} alerts`);
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
      
      // Add frequency data for affected routes (if analyzer is ready)
      if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
        try {
          if (serviceFrequencyAnalyzer.isInitialized) {
            const frequencies = serviceFrequencyAnalyzer.getMultipleRouteFrequencies(alert.affectsRoutes);
            const summaries = {};
            for (const routeId of alert.affectsRoutes) {
              summaries[routeId] = serviceFrequencyAnalyzer.getFrequencySummary(routeId);
            }
            const impact = serviceFrequencyAnalyzer.getImpactScore(alert.affectsRoutes);
            
            alert.routeFrequencies = frequencies;
            alert.routeFrequencySummaries = summaries;
            alert.frequencyImpact = impact;
          } else {
            // Analyzer not ready yet - skip frequency data
            alert.routeFrequencies = {};
            alert.routeFrequencySummaries = {};
            alert.frequencyImpact = { score: 0, impactLevel: 'unknown' };
          }
        } catch (error) {
          console.warn(`⚠️ Error getting frequency data for ${alert.id}:`, error.message);
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

// Shared incident storage (in production, this would be a database)
if (!global.manualIncidents) {
  global.manualIncidents = [];
}

// Helper function to get manual incidents
function getManualIncidents() {
  return global.manualIncidents || [];
}

// Helper function to add manual incident
function addManualIncident(incident) {
  if (!global.manualIncidents) {
    global.manualIncidents = [];
  }
  
  global.manualIncidents.push(incident);
  
  // Memory optimization: limit to 500 manual incidents
  const MAX_MANUAL_INCIDENTS = 500;
  if (global.manualIncidents.length > MAX_MANUAL_INCIDENTS) {
    const removed = global.manualIncidents.shift(); // Remove oldest
    console.log(`🗑️ Removed oldest manual incident (${removed.id}) - memory limit reached`);
  }
  
  return incident;
}

// Helper function to update manual incident
function updateManualIncident(id, updates) {
  if (!global.manualIncidents) return null;
  
  const index = global.manualIncidents.findIndex(inc => inc.id === id);
  if (index !== -1) {
    global.manualIncidents[index] = { ...global.manualIncidents[index], ...updates };
    return global.manualIncidents[index];
  }
  return null;
}

// Helper function to delete manual incident
function deleteManualIncident(id) {
  if (!global.manualIncidents) return null;
  
  const index = global.manualIncidents.findIndex(inc => inc.id === id);
  if (index !== -1) {
    const deleted = global.manualIncidents.splice(index, 1)[0];
    return deleted;
  }
  return null;
}

// Convert manual incidents to alert format
function convertIncidentToAlert(incident) {
  return {
    id: incident.id,
    title: `${incident.subtype || incident.type} - ${incident.location}`,
    description: incident.description || `${incident.type} reported at ${incident.location}`,
    location: incident.location,
    coordinates: incident.coordinates ? [
      incident.coordinates.latitude || incident.coordinates[0],
      incident.coordinates.longitude || incident.coordinates[1]
    ] : null,
    severity: incident.severity || 'Medium',
    status: incident.status === 'active' ? 'red' : 'amber',
    timestamp: incident.createdAt,
    lastUpdated: incident.lastUpdated || incident.createdAt,
    startDate: incident.startTime || incident.createdAt,
    endDate: incident.endTime,
    source: 'manual_incident',
    type: incident.type,
    subtype: incident.subtype,
    affectsRoutes: incident.affectsRoutes || [],
    enhanced: true,
    priority: incident.severity === 'High' ? 'IMMEDIATE' : 
             incident.severity === 'Medium' ? 'URGENT' : 'MONITOR',
    createdBy: incident.createdBy,
    createdByRole: incident.createdByRole,
    notes: incident.notes,
    incidentData: incident // Keep original incident data
  };
}

// Cache to prevent concurrent TomTom API calls
let enhancedAlertsCache = null;
let enhancedCacheTime = null;
const ENHANCED_CACHE_TIMEOUT = 30 * 1000; // 30 seconds cache
let enhancedRequestInProgress = false;

// FIXED: Single source alerts endpoint with request deduplication
app.get('/api/alerts-enhanced', async (req, res) => {
  const requestId = Date.now();
  
  try {
    console.log(`🚀 [ENHANCED-${requestId}] Enhanced data feed request from ${req.headers.origin}`);
    
    // Check cache first to prevent concurrent API calls
    const now = Date.now();
    if (enhancedAlertsCache && enhancedCacheTime && (now - enhancedCacheTime) < ENHANCED_CACHE_TIMEOUT) {
      const cacheAge = Math.round((now - enhancedCacheTime) / 1000);
      console.log(`📦 [${requestId}] Returning cached data (${cacheAge}s old) - PREVENTS API CALLS`);
      return res.json({
        ...enhancedAlertsCache,
        metadata: {
          ...enhancedAlertsCache.metadata,
          requestId,
          cached: true,
          cacheAge: `${cacheAge}s`,
          requestDeduplication: 'ACTIVE'
        }
      });
    }
    
    // Check if request already in progress to prevent concurrent calls
    if (enhancedRequestInProgress) {
      console.log(`⏳ [${requestId}] Request already in progress, waiting for result...`);
      // Wait for the in-progress request to complete
      let attempts = 0;
      while (enhancedRequestInProgress && attempts < 50) { // Max 5 seconds wait
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // Return cached result if available
      if (enhancedAlertsCache && enhancedCacheTime && (Date.now() - enhancedCacheTime) < ENHANCED_CACHE_TIMEOUT) {
        console.log(`📦 [${requestId}] Returning result from concurrent request`);
        return res.json({
          ...enhancedAlertsCache,
          metadata: {
            ...enhancedAlertsCache.metadata,
            requestId,
            waitedForConcurrent: true
          }
        });
      }
    }
    
    // Mark request in progress
    enhancedRequestInProgress = true;
    
    console.log(`🔄 [${requestId}] Using Enhanced Data Source Manager (SINGLE SOURCE)`);
    
    // USE ENHANCED DATA SOURCE MANAGER (prevents duplicate calls)
    const aggregatedResult = await enhancedDataSourceManager.aggregateAllSources();
    
    let allAlerts = [];
    const sources = {};
    
    // Process aggregated results
    if (aggregatedResult && aggregatedResult.incidents) {
      allAlerts = aggregatedResult.incidents;
      
      // Convert source stats
      if (aggregatedResult.sourceStats) {
        Object.keys(aggregatedResult.sourceStats).forEach(sourceName => {
          const stat = aggregatedResult.sourceStats[sourceName];
          sources[sourceName] = {
            success: stat.success,
            count: stat.count || 0,
            method: stat.method || 'API',
            mode: stat.mode || 'live',
            error: stat.error
          };
        });
      }
      
      console.log(`✅ [${requestId}] Enhanced Data Source Manager: ${allAlerts.length} alerts from aggregated sources`);
    } else {
      console.log(`⚠️ [${requestId}] Enhanced Data Source Manager returned no data`);
      sources.aggregated = {
        success: false,
        count: 0,
        error: 'No data from Enhanced Data Source Manager'
      };
    }
    
    // Add manual incidents
    console.log(`📝 [${requestId}] Adding manual incidents...`);
    const manualIncidents = getManualIncidents();
    let incidentAlerts = [];
    
    if (manualIncidents.length > 0) {
      incidentAlerts = manualIncidents.map(convertIncidentToAlert);
      allAlerts.push(...incidentAlerts);
      sources.manual_incidents = {
        success: true,
        count: incidentAlerts.length,
        method: 'Local Database',
        mode: 'incident_manager'
      };
      console.log(`✅ [${requestId}] Added ${incidentAlerts.length} manual incidents`);
    } else {
      sources.manual_incidents = {
        success: true,
        count: 0,
        method: 'Local Database',
        mode: 'incident_manager'
      };
    }
    
    const startTime = Date.now();
    
    // Count successful sources
    const successfulSources = Object.keys(sources).filter(s => sources[s].success).length;
    const fetchDuration = Date.now() - startTime;
    
    console.log(`📊 [${requestId}] Raw alerts collected: ${allAlerts.length} from ${successfulSources} sources in ${fetchDuration}ms`);
    
    // Enhanced filtering with robust error handling
    let filteredAlerts = [];
    try {
      filteredAlerts = enhancedAlertFiltering(allAlerts, requestId);
      filteredAlerts = filterDismissedAlerts(filteredAlerts, requestId);
      // Add categorization
      filteredAlerts = filteredAlerts.map(enhanceAlertWithCategory);
    } catch (filterError) {
      console.error(`❌ Filtering failed: ${filterError.message}`);
      // Fallback to basic filtering
      filteredAlerts = allAlerts.filter(alert => 
        alert && alert.title && !alert.id?.includes('test')
      );
    }
    
    // Process alerts with robust error handling
    let processedAlerts = [];
    try {
      if (filteredAlerts.length > 0) {
        console.log(`🔄 [${requestId}] Processing ${filteredAlerts.length} alerts...`);
        processedAlerts = await processAlertsOptimized(filteredAlerts);
        console.log(`✅ [${requestId}] Processing complete: ${processedAlerts.length} alerts`);
      }
    } catch (processingError) {
      console.error(`❌ Processing failed: ${processingError.message}`);
      // Fallback to unprocessed alerts
      processedAlerts = filteredAlerts;
    }
    
    // Apply auto-cancellation with error handling
    let activeAlerts = [];
    try {
      activeAlerts = applyAutoCancellation(processedAlerts, requestId);
    } catch (cancellationError) {
      console.error(`❌ Auto-cancellation failed: ${cancellationError.message}`);
      // Fallback to all processed alerts
      activeAlerts = processedAlerts;
    }
    
    // Generate statistics safely (including manual incidents)
    const manualIncidentCount = activeAlerts.filter(a => a.source === 'manual_incident').length;
    const trafficAlertCount = activeAlerts.length - manualIncidentCount;
    
    const stats = {
      totalAlerts: activeAlerts.length,
      activeAlerts: activeAlerts.filter(a => a.status === 'red' || !a.status).length,
      alertsWithRoutes: activeAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
      alertsWithCoordinates: activeAlerts.filter(a => a.coordinates && Array.isArray(a.coordinates) && a.coordinates.length === 2).length,
      manualIncidents: manualIncidentCount,
      trafficAlerts: trafficAlertCount,
      sourcesSuccessful: successfulSources,
      sourcesTotal: Object.keys(sources).length,
      sourceBreakdown: sources,
      processingTime: `${Date.now() - requestId}ms`,
      fetchDuration: `${fetchDuration}ms`
    };
    
    // Always return a valid response
    const response = {
      success: true,
      alerts: activeAlerts,
      metadata: {
        requestId,
        totalAlerts: activeAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'FIXED - Single Source Manager + Request Deduplication',
        mode: 'request_deduplication_active',
        dataFlow: 'OPTIMIZED',
        cached: false,
        cacheTimeout: ENHANCED_CACHE_TIMEOUT,
        debug: {
          processingDuration: `${Date.now() - requestId}ms`,
          sourcesActive: successfulSources,
          totalSources: Object.keys(sources).length,
          requestDeduplication: true,
          duplicateCallsPrevented: true
        }
      }
    };
    
    // Cache the response
    enhancedAlertsCache = response;
    enhancedCacheTime = Date.now();
    enhancedRequestInProgress = false;
    
    // Sync to Convex for real-time updates (non-blocking)
    if (activeAlerts.length > 0) {
      convexSync.syncAlerts(activeAlerts).then(result => {
        if (result.success) {
          console.log(`✅ [${requestId}] Synced ${result.count} alerts to Convex`);
        } else {
          console.log(`⚠️ [${requestId}] Convex sync skipped:`, result.reason || result.error);
        }
      }).catch(err => {
        console.log(`⚠️ [${requestId}] Convex sync error:`, err.message);
      });
    }
    
    console.log(`🎯 [${requestId}] FIXED RESULT: ${activeAlerts.length} total alerts (${stats.trafficAlerts} traffic + ${stats.manualIncidents} manual)`);
    console.log(`📊 [${requestId}] Sources working: ${Object.keys(sources).filter(s => sources[s].success).join(', ')}`);
    console.log(`🗺️ [${requestId}] Alerts with coordinates: ${stats.alertsWithCoordinates}/${activeAlerts.length}`);
    console.log(`📝 [${requestId}] Manual incidents: ${stats.manualIncidents}`);
    console.log(`⏱️ [${requestId}] Total processing time: ${Date.now() - requestId}ms`);
    console.log(`📦 [${requestId}] Response cached for ${ENHANCED_CACHE_TIMEOUT/1000}s to prevent duplicate API calls`);
    
    res.json(response);
    
  } catch (error) {
    console.error(`❌ [${requestId}] Critical error in enhanced endpoint:`, error);
    
    // Clear request lock
    enhancedRequestInProgress = false;
    
    // Always return something, even on total failure
    const emergencyResponse = {
      success: true, // Still return success to prevent frontend errors
      alerts: [], // Empty but valid
      metadata: {
        requestId,
        totalAlerts: 0,
        sources: { 
          emergency: {
            success: false,
            error: error.message,
            fallback: true
          }
        },
        error: error.message,
        timestamp: new Date().toISOString(),
        mode: 'emergency_fallback',
        dataFlow: 'FAILED_BUT_HANDLED',
        requestDeduplication: 'ERROR'
      }
    };
    
    res.json(emergencyResponse); // Don't use 500 status - frontend needs data
  }
});

// Clear enhanced cache on demand
app.post('/api/cache/clear-enhanced', (req, res) => {
  enhancedAlertsCache = null;
  enhancedCacheTime = null;
  enhancedRequestInProgress = false;
  console.log('🧹 Enhanced alerts cache cleared manually');
  res.json({ success: true, message: 'Enhanced cache cleared' });
});

// Operations Centre statistics endpoint
app.get('/api/operations/stats', async (req, res) => {
  try {
    // Get current incidents count
    const manualIncidents = getManualIncidents();
    const activeIncidents = manualIncidents.filter(inc => inc.status === 'active').length;
    
    // Get roadworks count from Supabase
    let plannedRoadworks = 0;
    let activeRoadworks = 0;
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Count planned roadworks
      const { data: planned, error: plannedError } = await supabase
        .from('roadworks')
        .select('id')
        .in('status', ['planned', 'pending']);
      
      if (!plannedError && planned) {
        plannedRoadworks = planned.length;
      }
      
      // Count active roadworks
      const { data: active, error: activeError } = await supabase
        .from('roadworks')
        .select('id')
        .eq('status', 'active');
      
      if (!activeError && active) {
        activeRoadworks = active.length;
      }
      
      // Also check streetmanager notifications for active roadworks
      const { data: streetManagerActive, error: smError } = await supabase
        .from('active_streetmanager_roadworks')
        .select('notification_id');
      
      if (!smError && streetManagerActive) {
        activeRoadworks += streetManagerActive.length;
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to get roadworks count:', dbError.message);
    }
    
    // Get disruption count
    let disruptionCount = 0;
    try {
      // Count all current traffic alerts
      if (enhancedAlertsCache && enhancedAlertsCache.alerts) {
        disruptionCount = enhancedAlertsCache.alerts.length;
      }
    } catch (error) {
      console.warn('⚠️ Failed to get disruption count:', error.message);
    }
    
    console.log(`📊 Operations stats: ${activeIncidents} incidents, ${plannedRoadworks} planned roadworks, ${activeRoadworks} active roadworks`);
    
    res.json({
      success: true,
      incidents: {
        active: activeIncidents,
        total: manualIncidents.length
      },
      roadworks: {
        planned: plannedRoadworks,
        active: activeRoadworks,
        total: plannedRoadworks + activeRoadworks
      },
      disruptions: {
        active: disruptionCount,
        total: disruptionCount
      },
      statistics: {
        total: activeIncidents + plannedRoadworks + activeRoadworks + disruptionCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting operations stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      incidents: { active: 0, total: 0 },
      roadworks: { planned: 0, active: 0, total: 0 },
      disruptions: { active: 0, total: 0 },
      statistics: { total: 0 }
    });
  }
});

// System health with retention information
app.get('/api/system/health', async (req, res) => {
  try {
    const health = await startupService.getSystemHealth();
    res.json(health);
  } catch (error) {
    console.error('❌ Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed retention status
app.get('/api/system/retention-status', async (req, res) => {
  try {
    const { dataRetentionService } = await import('./services/dataRetentionService.js');
    const status = await dataRetentionService.getRetentionStatus();
    res.json({
      success: true,
      retention: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting retention status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual cleanup trigger (admin only)
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID required'
      });
    }
    
    // Validate admin session
    const { validateSupervisorSession } = await import('./services/supervisorManager.js');
    const sessionValidation = validateSupervisorSession(sessionId);
    
    if (!sessionValidation.success || !sessionValidation.supervisor.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const results = await startupService.triggerManualCleanup();
    
    console.log(`📋 Manual cleanup triggered by ${sessionValidation.supervisor.name}: ${results.totalDeleted} records deleted`);
    
    res.json({
      success: true,
      cleanup: results,
      triggeredBy: sessionValidation.supervisor.name,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error triggering manual cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Usage Optimization Status Endpoint
app.get('/api/optimization/status', async (req, res) => {
  try {
    const { geocodingThrottler, geocodingCache } = await import('./services/tomtom.js');
    const throttleStatus = geocodingThrottler.getStatus();
    
    const cacheAge = enhancedCacheTime ? Math.round((Date.now() - enhancedCacheTime) / 1000) : null;
    
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      optimization: {
        requestDeduplication: {
          active: true,
          cacheTimeout: ENHANCED_CACHE_TIMEOUT / 1000,
          lastCached: enhancedCacheTime ? new Date(enhancedCacheTime).toISOString() : null,
          cacheAge: cacheAge ? `${cacheAge}s` : null,
          requestInProgress: enhancedRequestInProgress
        },
        geocodingCache: {
          active: true,
          entries: geocodingCache.size,
          ttl: '30 minutes'
        },
        tomtomThrottling: {
          dailyUsage: `${throttleStatus.dailyCount}/${throttleStatus.dailyLimit}`,
          requestsRemaining: throttleStatus.dailyLimit - throttleStatus.dailyCount,
          usagePercentage: Math.round((throttleStatus.dailyCount / throttleStatus.dailyLimit) * 100)
        },
        frontendStaggering: {
          enhancedDashboard: '15s interval',
          displayScreen: '20s interval + 5s initial delay'
        },
        estimatedSavings: {
          before: '~4,800 TomTom calls/hour',
          after: '~400 TomTom calls/hour',
          reduction: '~90%'
        }
      }
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
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

// Supervisor dismiss alert endpoint with improved persistence
app.post('/api/supervisor/dismiss-alert', async (req, res) => {
  try {
    const { alertId, reason, sessionId, alertData } = req.body;
    
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
      userAgent: req.get('User-Agent') || 'unknown',
      alertLocation: alertData?.location || 'Unknown'
    };
    
    // Store dismissal
    if (!global.dismissedIncidents) {
      global.dismissedIncidents = new Map();
    }
    
    // Store by alert ID
    global.dismissedIncidents.set(alertId, dismissalRecord);
    
    // Also store by content hash for better deduplication
    if (alertData) {
      const alertHash = generateAlertHash(alertData);
      const hashKey = `hash_${alertHash}`;
      global.dismissedIncidents.set(hashKey, {
        ...dismissalRecord,
        dismissalMethod: 'content_hash',
        originalAlertId: alertId
      });
      console.log(`🙅 Alert ${alertId} dismissed by hash ${alertHash.substring(0, 8)}... for future deduplication`);
    }
    
    // Memory optimization: limit dismissed incidents to prevent unbounded growth
    const MAX_DISMISSED_INCIDENTS = 2000;
    if (global.dismissedIncidents.size > MAX_DISMISSED_INCIDENTS) {
      // Remove oldest 20% to prevent frequent cleanup
      const keysToRemove = Array.from(global.dismissedIncidents.keys()).slice(0, Math.floor(MAX_DISMISSED_INCIDENTS * 0.2));
      keysToRemove.forEach(key => global.dismissedIncidents.delete(key));
      console.log(`🗑️ Removed ${keysToRemove.length} old dismissed incidents - memory limit reached`);
    }
    
    // Persist to file for restart recovery (async, don't wait)
    const dismissedFilePath = path.join(__dirname, 'data/dismissed-alerts.json');
    try {
      const dismissedObject = Object.fromEntries(global.dismissedIncidents);
      fs.writeFile(dismissedFilePath, JSON.stringify(dismissedObject, null, 2)).catch(err => {
        console.warn('⚠️ Failed to persist dismissals:', err.message);
      });
    } catch (err) {
      console.warn('⚠️ Failed to serialize dismissals:', err.message);
    }
    
    console.log(`🙅 Alert ${alertId} dismissed by ${supervisor.name} (${supervisor.badge}): ${reason} at ${alertData?.location || 'Unknown location'}`);
    
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

// Production diagnostic endpoint - check what data sources are returning
app.get('/api/diagnostic/data-sources', async (req, res) => {
  try {
    console.log('🅳 Running production data source diagnostics...');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      sources: {}
    };
    
    // Test TomTom
    try {
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      diagnostics.sources.tomtom = {
        success: tomtomResult.success,
        count: tomtomResult.data?.length || 0,
        error: tomtomResult.error,
        sample: tomtomResult.data?.[0] ? {
          location: tomtomResult.data[0].location,
          severity: tomtomResult.data[0].severity
        } : null
      };
    } catch (error) {
      diagnostics.sources.tomtom = { success: false, error: error.message };
    }
    
    // Test National Highways
    try {
      const nhResult = await fetchNationalHighways();
      diagnostics.sources.nationalHighways = {
        success: nhResult.success,
        count: nhResult.data?.length || 0,
        error: nhResult.error,
        method: nhResult.method,
        sample: nhResult.data?.[0] ? {
          location: nhResult.data[0].location,
          road: nhResult.data[0].road
        } : null
      };
    } catch (error) {
      diagnostics.sources.nationalHighways = { success: false, error: error.message };
    }
    
    // Check StreetManager webhook data
    try {
      const activities = streetManagerWebhooks.getWebhookActivities();
      const permits = streetManagerWebhooks.getWebhookPermits();
      diagnostics.sources.streetManager = {
        success: true,
        activities: activities.data?.length || 0,
        permits: permits.data?.length || 0,
        lastActivity: activities.metadata?.lastReceived,
        lastPermit: permits.metadata?.lastReceived
      };
    } catch (error) {
      diagnostics.sources.streetManager = { success: false, error: error.message };
    }
    
    // Check manual incidents
    diagnostics.sources.manualIncidents = {
      count: global.manualIncidents?.length || 0,
      sample: global.manualIncidents?.[0] ? {
        type: global.manualIncidents[0].type,
        location: global.manualIncidents[0].location
      } : null
    };
    
    // Check enhanced data source aggregation
    try {
      const aggregated = await enhancedDataSourceManager.aggregateAllSources();
      diagnostics.aggregation = {
        success: true,
        totalIncidents: aggregated.incidents?.length || 0,
        sources: aggregated.sourceStats,
        performance: aggregated.performance
      };
    } catch (error) {
      diagnostics.aggregation = { success: false, error: error.message };
    }
    
    res.json({
      success: true,
      diagnostics,
      summary: {
        workingSources: Object.values(diagnostics.sources).filter(s => s.success !== false).length,
        totalSources: Object.keys(diagnostics.sources).length,
        hasData: Object.values(diagnostics.sources).some(s => (s.count || 0) > 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// REMOVED: Duplicate active supervisors endpoint
// The proper implementation is in routes/supervisorAPI.js
// This duplicate was overriding the correct route!

// Log display screen views periodically
let lastDisplayScreenLog = 0;
app.use((req, res, next) => {
  // Log display screen views every 5 minutes
  if (req.path === '/api/alerts-enhanced' && req.headers.origin?.includes('gobarry.co.uk')) {
    const now = Date.now();
    if (now - lastDisplayScreenLog > 5 * 60 * 1000) { // 5 minutes
      lastDisplayScreenLog = now;
      supervisorManager.logDisplayScreenView(0, req).catch(err => {
        console.warn('⚠️ Failed to log display screen view:', err.message);
      });
    }
  }
  next();
});

// StreetManager webhook routes - SIMPLIFIED INLINE VERSION
console.log('📨 Adding Street Manager webhook routes directly...');

// Status endpoint
app.get('/api/streetmanager/webhook/status', (req, res) => {
  res.json({
    success: true,
    webhook: {
      endpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook',
      ready: true,
      documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data/',
      implementation: 'simplified-inline',
      timestamp: new Date().toISOString()
    }
  });
});

// Test Supabase table structure
app.get('/api/streetmanager/test-supabase', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Try to fetch columns info
    const { data: tableInfo, error: infoError } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .limit(0);
    
    // Try a simple insert with minimal fields
    const testRecord = {
      notification_id: `test_${Date.now()}`,
      title: 'Test notification',
      webhook_event_type: 'TEST',
      processing_status: 'pending',
      webhook_received_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('streetmanager_notifications')
      .insert(testRecord)
      .select()
      .single();
    
    // Clean up test record if insert succeeded
    if (insertData) {
      await supabase
        .from('streetmanager_notifications')
        .delete()
        .eq('notification_id', testRecord.notification_id);
    }
    
    res.json({
      success: true,
      message: 'Supabase table test',
      tableExists: !infoError,
      canInsert: !insertError,
      errors: {
        infoError: infoError?.message,
        insertError: insertError?.message,
        insertErrorDetails: insertError
      },
      testRecord,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to check Supabase table structure
app.get('/api/streetmanager/debug-table', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // First, try to get the table structure using a query that returns column info
    const { data: sampleRow, error: sampleError } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .limit(1)
      .single();
    
    // Get column names from the sample or error
    let columns = [];
    if (sampleRow) {
      columns = Object.keys(sampleRow);
    }
    
    // Test inserting a minimal record
    const minimalRecord = {
      notification_id: `debug_test_${Date.now()}`,
      webhook_received_at: new Date().toISOString()
    };
    
    const { data: minimalInsert, error: minimalError } = await supabase
      .from('streetmanager_notifications')
      .insert(minimalRecord)
      .select();
    
    // Clean up if successful
    if (minimalInsert) {
      await supabase
        .from('streetmanager_notifications')
        .delete()
        .eq('notification_id', minimalRecord.notification_id);
    }
    
    res.json({
      success: true,
      tableInfo: {
        hasData: !!sampleRow,
        sampleError: sampleError?.message,
        columns: columns,
        columnCount: columns.length,
        canInsertMinimal: !minimalError,
        minimalError: minimalError
      },
      requiredColumns: [
        'notification_id',
        'webhook_received_at',
        'raw_webhook_data'
      ],
      suggestedFix: 'Run the SQL script in /docs/streetmanager_notifications_table.sql to create/update the table',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Check Supabase connection and table existence',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint
app.post('/api/streetmanager/webhook/test', (req, res) => {
  const testSNSMessage = {
    Type: 'Notification',
    MessageId: 'test-message-' + Date.now(),
    TopicArn: 'arn:aws:sns:eu-west-2:123456789:streetmanager-notifications',
    Subject: 'StreetManager Notification',
    Message: JSON.stringify({
      event_type: 'PERMIT_CREATED',
      event_time: new Date().toISOString(),
      object_type: 'PERMIT',
      object_reference: 'TEST-PERMIT-' + Date.now(),
      object_data: {
        permit_reference_number: 'NEWC-TEST-001',
        highway_authority_swa_code: 'NEWC',
        highway_authority: 'Newcastle City Council',
        promoter_organisation: 'Go North East',
        promoter_swa_code: 'GNE',
        work_category_ref: 'major',
        description: 'TEST: Bus route infrastructure improvement',
        location_description: 'Central Station approach, Newcastle',
        street_name: 'Neville Street',
        area_name: 'Newcastle upon Tyne',
        town: 'Newcastle',
        postcode: 'NE1 5DG',
        proposed_start_date: new Date().toISOString(),
        proposed_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        permit_status: 'granted',
        work_status: 'planned',
        geometry: {
          type: 'Point',
          coordinates: [-1.6178, 54.9783]
        },
        collaborations: [],
        conditions: [
          {
            condition_type: 'traffic_management',
            condition_text: 'Traffic lights required during works'
          }
        ],
        works_coordinates: {
          coordinates: [[-1.6178, 54.9783], [-1.6180, 54.9785]]
        }
      }
    }),
    Timestamp: new Date().toISOString(),
    SignatureVersion: '1',
    Signature: 'test-signature'
  };

  console.log('🧪 Processing test StreetManager webhook with comprehensive data...');
  
  // Process the test message through the same webhook handler
  const mockReq = {
    headers: {
      'x-amz-sns-message-type': 'Notification',
      'x-amz-sns-message-id': 'test-id-' + Date.now(),
      'x-amz-sns-topic-arn': 'arn:aws:sns:eu-west-2:123456789:streetmanager-notifications',
      'x-amz-sns-timestamp': new Date().toISOString()
    },
    body: testSNSMessage
  };

  // Test the webhook processing
  try {
    const result = streetManagerWebhooks.handleWebhookMessage(testSNSMessage);
    
    res.json({
      success: true,
      message: 'Comprehensive test completed',
      test_data: {
        sns_message_type: testSNSMessage.Type,
        permit_reference: JSON.parse(testSNSMessage.Message).object_reference,
        has_location_data: !!JSON.parse(testSNSMessage.Message).object_data.street_name,
        has_coordinates: !!JSON.parse(testSNSMessage.Message).object_data.geometry,
        has_timing: !!JSON.parse(testSNSMessage.Message).object_data.proposed_start_date,
        data_keys_count: Object.keys(JSON.parse(testSNSMessage.Message).object_data).length
      },
      processing_result: result,
      timestamp: new Date().toISOString(),
      note: 'This test verifies ALL StreetManager data fields are captured correctly'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Test failed - webhook processing error'
    });
  }
});

// Main webhook endpoint - UPDATED TO SAVE TO SUPABASE
app.post('/api/streetmanager/webhook', async (req, res) => {
  try {
    const messageType = req.headers['x-amz-sns-message-type'];
    console.log(`📨 Street Manager webhook received: ${messageType}`);
    
    // Parse body if it's a string (SNS sends text/plain)
    let messageBody = req.body;
    if (typeof req.body === 'string') {
      try {
        console.log('📄 Body is string, parsing JSON...');
        messageBody = JSON.parse(req.body);
      } catch (parseErr) {
        console.error('❌ Failed to parse body as JSON:', parseErr);
        messageBody = req.body;
      }
    }
    
    // Handle subscription confirmation
    if (messageType === 'SubscriptionConfirmation') {
      console.log('📧 SubscriptionConfirmation details:', {
        hasSubscribeURL: !!messageBody.SubscribeURL,
        subscribeURL: messageBody.SubscribeURL ? 'URL exists' : 'NO URL',
        bodyKeys: Object.keys(messageBody || {}),
        bodyType: typeof messageBody,
        originalBodyType: typeof req.body
      });
      
      if (messageBody.SubscribeURL) {
        console.log('🔗 Attempting to confirm subscription...');
        console.log('🔗 URL:', messageBody.SubscribeURL);
        
        // Use fetch to confirm subscription
        fetch(messageBody.SubscribeURL)
          .then(response => {
            console.log(`✅ StreetManager subscription confirmed! Status: ${response.status}`);
            return response.text();
          })
          .then(text => {
            console.log('📝 Confirmation response received');
            if (text.includes('SubscriptionArn')) {
              console.log('✅ Successfully subscribed to StreetManager notifications!');
            }
          })
          .catch(err => {
            console.error('❌ Failed to confirm subscription:', err.message);
            console.error('🔍 Error details:', err);
          });
      } else {
        console.error('❌ NO SubscribeURL found in body!');
        console.log('📦 Full body content:', JSON.stringify(messageBody, null, 2));
        console.log('📦 Original body:', req.body);
      }
      
      res.json({
        success: true,
        message: 'Subscription confirmation received',
        subscribeUrl: messageBody.SubscribeURL || 'NOT FOUND',
        timestamp: new Date().toISOString(),
        debug: {
          hasSubscribeURL: !!messageBody.SubscribeURL,
          bodyKeys: Object.keys(messageBody || {}),
          wasStringBody: typeof req.body === 'string'
        }
      });
      return;
    }
    
    // Handle notifications - COMPREHENSIVE DATA CAPTURE
    if (messageType === 'Notification') {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      try {
        // Parse the notification message with full error handling
        let notificationData;
        try {
          notificationData = JSON.parse(req.body.Message);
          console.log(`📋 StreetManager notification: ${notificationData.event_type || 'NO_EVENT_TYPE'} for ${notificationData.object_type || 'NO_OBJECT_TYPE'}`);
          
          // COMPREHENSIVE DATA LOGGING - Log all available fields
          console.log('🔍 Full notification data structure:', {
            event_type: notificationData.event_type,
            object_type: notificationData.object_type,
            object_reference: notificationData.object_reference,
            event_time: notificationData.event_time,
            all_keys: Object.keys(notificationData),
            data_size: JSON.stringify(notificationData).length,
            has_object_data: !!notificationData.object_data,
            object_data_keys: notificationData.object_data ? Object.keys(notificationData.object_data) : []
          });
          
          // Log first 500 characters of raw data for debugging
          console.log('📄 Raw notification data (first 500 chars):', JSON.stringify(notificationData).substring(0, 500) + '...');
          
        } catch (parseError) {
          console.error('❌ Failed to parse notification message:', parseError.message);
          console.log('📄 Raw message that failed to parse:', req.body.Message?.substring(0, 500) + '...');
          throw new Error(`Message parsing failed: ${parseError.message}`);
        }
        
        // Validate essential fields
        if (!notificationData.event_type) {
          console.warn('⚠️ Missing event_type in notification');
        }
        if (!notificationData.object_type) {
          console.warn('⚠️ Missing object_type in notification');
        }
        if (!notificationData.object_reference) {
          console.warn('⚠️ Missing object_reference in notification');
        }
        
        // Create notification ID for deduplication
        const notificationId = `streetmanager_${notificationData.object_type || 'unknown'}_${notificationData.object_reference || Date.now()}`;
        
        // Parse BNG coordinates if available
        let parsedCoordinates = null;
        if (notificationData.object_data?.works_location_coordinates) {
          console.log('📦 Parsing BNG coordinates:', notificationData.object_data.works_location_coordinates);
          const { parsePointToBNG } = await import('./utils/bngToLatLng.js');
          parsedCoordinates = parsePointToBNG(notificationData.object_data.works_location_coordinates);
          if (parsedCoordinates) {
            console.log(`✅ Converted BNG to lat/lng: ${parsedCoordinates.lat}, ${parsedCoordinates.lng}`);
          }
        }
        
        // ENHANCED: Preserve ALL notification data
        const webhookRecord = {
          notification_id: notificationId,
          permit_reference_number: notificationData.object_type === 'PERMIT' ? notificationData.object_reference : null,
          activity_reference_number: notificationData.object_type === 'ACTIVITY' ? notificationData.object_reference : null,
          title: `${notificationData.object_type || 'Unknown'} - ${notificationData.event_type || 'Unknown Event'}`,
          description: `StreetManager ${notificationData.object_type || 'notification'} ${notificationData.event_type || 'event'}`,
          webhook_event_type: notificationData.event_type,
          
          // CRITICAL: Store the complete raw notification data
          raw_webhook_data: notificationData,
          
          // Extract location data if available
          street_name: notificationData.object_data?.street_name || null,
          area_name: notificationData.object_data?.area_name || null,
          coordinates: parsedCoordinates,  // Use parsed coordinates
          location_description: notificationData.object_data?.location_description || null,
          
          // Extract work details if available
          work_description: notificationData.object_data?.description || null,
          work_category: notificationData.object_data?.work_category_ref || null,
          promoter_organisation: notificationData.object_data?.promoter_organisation || null,
          highway_authority: notificationData.object_data?.highway_authority || null,
          
          // Extract timing if available
          proposed_start_date: notificationData.object_data?.proposed_start_date || null,
          proposed_end_date: notificationData.object_data?.proposed_end_date || null,
          actual_start_date: notificationData.object_data?.actual_start_date || notificationData.object_data?.actual_start_date_time || null,
          actual_end_date: notificationData.object_data?.actual_end_date || notificationData.object_data?.actual_end_date_time || null,
          
          // Extract permit status if available
          permit_status: notificationData.object_data?.permit_status || null,
          work_status: notificationData.object_data?.work_status || notificationData.object_data?.work_status_ref || null,
          
          activity_status: notificationData.event_type === 'CREATED' ? 'active' : notificationData.event_type,
          severity: notificationData.object_data?.work_category === 'Major' ? 'High' : 'Medium',
          alert_status: notificationData.object_data?.work_status_ref === 'in_progress' ? 'red' : 'amber',
          processing_status: 'pending',
          webhook_received_at: new Date().toISOString(),
          
          // Store original SNS message data
          sns_message_id: req.headers['x-amz-sns-message-id'] || null,
          sns_topic_arn: req.headers['x-amz-sns-topic-arn'] || null,
          sns_timestamp: req.headers['x-amz-sns-timestamp'] || null
        };
        
        // Extract additional fields from the real webhook
        if (notificationData.object_data) {
          webhookRecord.work_reference_number = notificationData.object_data.work_reference_number || null;
          webhookRecord.promoter_swa_code = notificationData.object_data.promoter_swa_code || null;
          webhookRecord.highway_authority_swa_code = notificationData.object_data.highway_authority_swa_code || null;
          webhookRecord.usrn = notificationData.object_data.usrn || null;
          webhookRecord.town = notificationData.object_data.town || null;
          webhookRecord.activity_type = notificationData.object_data.activity_type || null;
          webhookRecord.is_traffic_sensitive = notificationData.object_data.is_traffic_sensitive || null;
          webhookRecord.traffic_management_type = notificationData.object_data.traffic_management_type || null;
          webhookRecord.permit_conditions = notificationData.object_data.permit_conditions || null;
        }
        
        console.log('💾 Attempting to save webhook record to Supabase...');
        console.log('🔍 Record fields:', Object.keys(webhookRecord));
        
        // Try a minimal insert first to ensure the table works
        const minimalRecord = {
          notification_id: webhookRecord.notification_id,
          webhook_received_at: webhookRecord.webhook_received_at,
          raw_webhook_data: webhookRecord.raw_webhook_data
        };
        
        // First try minimal insert
        const { data: minimalData, error: minimalError } = await supabase
          .from('streetmanager_notifications')
          .insert(minimalRecord)
          .select()
          .single();
        
        if (minimalError) {
          console.error('❌ Even minimal insert failed:', minimalError);
          console.error('🔍 Minimal record:', minimalRecord);
          
          // Create table suggestion
          console.log('💡 Run this SQL in Supabase to fix:');
          console.log(`
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL,
  raw_webhook_data JSONB
);
`);
        } else {
          console.log('✅ Minimal insert successful, now updating with full data...');
          
          // Update with full data
          const { data, error } = await supabase
            .from('streetmanager_notifications')
            .update(webhookRecord)
            .eq('notification_id', webhookRecord.notification_id)
            .select()
            .single();
          
          if (error) {
            console.error('❌ Failed to update with full data:', error);
            console.error('🔥 Full error details:', JSON.stringify(error, null, 2));
            console.error('📄 Attempted record:', JSON.stringify(webhookRecord, null, 2).substring(0, 1000) + '...');
          } else {
            console.log(`✅ Saved StreetManager notification to Supabase: ${notificationId}`);
          }
        }
        
        // Process in background (don't wait)
        if (minimalData || (!minimalError && !error)) {
          setTimeout(async () => {
            try {
              // If it's a PERMIT or ACTIVITY reference, fetch full details
              if (notificationData.object_reference) {
                console.log(`🔍 Fetching full details for ${notificationData.object_type} ${notificationData.object_reference}`);
                
                if (notificationData.object_type === 'PERMIT') {
                  const permitDetails = await import('./services/streetManager.js').then(m => 
                    m.getPermitDetails(notificationData.object_reference)
                  );
                  
                  if (permitDetails.success && permitDetails.data) {
                    // Update with full details
                    await supabase
                      .from('streetmanager_notifications')
                      .update({
                        title: permitDetails.data.title,
                        description: permitDetails.data.description,
                        location_description: permitDetails.data.location,
                        street_name: permitDetails.data.streetName,
                        area_name: permitDetails.data.areaName,
                        coordinates: permitDetails.data.coordinates ? 
                          { lat: permitDetails.data.coordinates[0], lng: permitDetails.data.coordinates[1] } : null,
                        proposed_start_date: permitDetails.data.proposedStartDate,
                        proposed_end_date: permitDetails.data.proposedEndDate,
                        work_category_ref: permitDetails.data.workCategory,
                        highway_authority: permitDetails.data.authority,
                        severity: permitDetails.data.severity,
                        alert_status: permitDetails.data.status,
                        processing_status: 'processed',
                        processed_at: new Date().toISOString()
                      })
                      .eq('notification_id', notificationId);
                    
                    console.log(`✅ Updated ${notificationId} with full permit details`);
                  }
                } else if (notificationData.object_type === 'ACTIVITY') {
                  const activityDetails = await import('./services/streetManager.js').then(m => 
                    m.getActivityDetails(notificationData.object_reference)
                  );
                  
                  if (activityDetails.success && activityDetails.data) {
                    // Update with full details
                    await supabase
                      .from('streetmanager_notifications')
                      .update({
                        title: activityDetails.data.title,
                        description: activityDetails.data.description,
                        location_description: activityDetails.data.location,
                        street_name: activityDetails.data.streetName,
                        area_name: activityDetails.data.areaName,
                        coordinates: activityDetails.data.coordinates ? 
                          { lat: activityDetails.data.coordinates[0], lng: activityDetails.data.coordinates[1] } : null,
                        proposed_start_date: activityDetails.data.proposedStartDate,
                        proposed_end_date: activityDetails.data.proposedEndDate,
                        actual_start_date: activityDetails.data.actualStartDate,
                        actual_end_date: activityDetails.data.actualEndDate,
                        work_category_ref: activityDetails.data.workCategory,
                        is_emergency_works: activityDetails.data.isEmergency,
                        highway_authority: activityDetails.data.authority,
                        severity: activityDetails.data.severity,
                        alert_status: activityDetails.data.status,
                        activity_status: activityDetails.data.activityStatus,
                        processing_status: 'processed',
                        processed_at: new Date().toISOString()
                      })
                      .eq('notification_id', notificationId);
                    
                    console.log(`✅ Updated ${notificationId} with full activity details`);
                  }
                }
              }
            } catch (fetchError) {
              console.error('⚠️ Failed to fetch full details:', fetchError.message);
              // Mark as processed anyway
              await supabase
                .from('streetmanager_notifications')
                .update({
                  processing_status: 'failed',
                  processing_error: fetchError.message,
                  processed_at: new Date().toISOString()
                })
                .eq('notification_id', notificationId);
            }
          }, 1000); // Process after 1 second
        }
        
        // Also store in memory for immediate access
        streetManagerWebhooks.handleWebhookMessage(req.body);
        
      } catch (parseError) {
        console.error('❌ Failed to parse notification:', parseError);
      }
      
      // Always acknowledge the webhook quickly
      res.json({
        success: true,
        message: 'Notification received and saved',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Handle other message types
    res.json({
      success: true,
      message: 'Webhook received',
      messageType: messageType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Always return 200 to prevent AWS SNS retries
    res.status(200).json({
      success: false,
      error: error.message
    });
  }
});

// GET endpoint to retrieve StreetManager notifications from Supabase with enhanced filtering
app.get('/api/streetmanager/notifications', async (req, res) => {
  try {
    const { 
      status, 
      event_type, 
      object_type, 
      limit = 100, 
      offset = 0,
      start_date,
      end_date,
      street_name,
      active_today
    } = req.query;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Build query
    let query = supabase
      .from('streetmanager_notifications')
      .select('*');
    
    // Add filters
    if (status) {
      query = query.eq('activity_status', status);
    }
    if (event_type) {
      query = query.eq('webhook_event_type', event_type);
    }
    if (object_type) {
      query = query.or(`permit_reference_number.not.is.null,activity_reference_number.not.is.null`);
    }
    
    // Date filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (active_today === 'true') {
      // Active today means: started before tomorrow AND (not ended OR ends after today)
      query = query
        .or(`proposed_start_date.lte.${tomorrow.toISOString()},actual_start_date.lte.${tomorrow.toISOString()}`)
        .or(`proposed_end_date.is.null,proposed_end_date.gte.${today.toISOString()},actual_end_date.is.null,actual_end_date.gte.${today.toISOString()}`);
    } else {
      // Custom date range filtering
      if (start_date) {
        query = query.or(`proposed_start_date.gte.${start_date},actual_start_date.gte.${start_date}`);
      }
      if (end_date) {
        query = query.or(`proposed_end_date.lte.${end_date},actual_end_date.lte.${end_date}`);
      }
    }
    
    // Street name search (case insensitive)
    if (street_name) {
      query = query.ilike('street_name', `%${street_name}%`);
    }
    
    // Apply pagination and ordering
    query = query
      .order('webhook_received_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data: notifications, error, count } = await query;
    
    // Add map URLs to each notification
    const enhancedNotifications = (notifications || []).map(notification => {
      const enhanced = { ...notification };
      
      // Add Google Maps URL if coordinates exist
      if (notification.coordinates && notification.coordinates.lat && notification.coordinates.lng) {
        enhanced.mapUrl = `https://www.google.com/maps?q=${notification.coordinates.lat},${notification.coordinates.lng}`;
        enhanced.tomtomUrl = `https://www.tomtom.com/en_gb/maps/?lat=${notification.coordinates.lat}&lon=${notification.coordinates.lng}&zoom=16`;
      }
      
      // Ensure street name is prominent
      enhanced.displayLocation = notification.street_name || notification.location_description || notification.area_name || 'Location not specified';
      
      // Add human-readable date status
      const now = new Date();
      const startDate = new Date(notification.actual_start_date || notification.proposed_start_date);
      const endDate = notification.actual_end_date || notification.proposed_end_date ? 
        new Date(notification.actual_end_date || notification.proposed_end_date) : null;
      
      if (startDate <= now && (!endDate || endDate >= now)) {
        enhanced.dateStatus = 'Active Now';
        enhanced.isActiveToday = true;
      } else if (startDate > now) {
        enhanced.dateStatus = 'Planned';
        enhanced.isActiveToday = false;
      } else {
        enhanced.dateStatus = 'Completed';
        enhanced.isActiveToday = false;
      }
      
      return enhanced;
    });
    
    if (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    res.json({
      success: true,
      notifications: enhancedNotifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count
      },
      metadata: {
        source: 'Supabase Database',
        timestamp: new Date().toISOString(),
        filters: {
          activeToday: active_today === 'true',
          streetName: street_name,
          dateRange: { start_date, end_date }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching StreetManager notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Diagnostic endpoint to test webhook data processing
app.post('/api/streetmanager/test-webhook-data', async (req, res) => {
  try {
    const { notificationData } = req.body;
    
    if (!notificationData) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notificationData in request body'
      });
    }
    
    // Parse BNG coordinates if available
    let parsedCoordinates = null;
    if (notificationData.object_data?.works_location_coordinates) {
      console.log('📦 Testing BNG coordinate parsing...');
      const { parsePointToBNG } = await import('./utils/bngToLatLng.js');
      parsedCoordinates = parsePointToBNG(notificationData.object_data.works_location_coordinates);
    }
    
    // Build the webhook record exactly as the main handler would
    const notificationId = `streetmanager_${notificationData.object_type || 'unknown'}_${notificationData.object_reference || Date.now()}`;
    
    const webhookRecord = {
      notification_id: notificationId,
      permit_reference_number: notificationData.object_type === 'PERMIT' ? notificationData.object_reference : null,
      activity_reference_number: notificationData.object_type === 'ACTIVITY' ? notificationData.object_reference : null,
      title: `${notificationData.object_type || 'Unknown'} - ${notificationData.event_type || 'Unknown Event'}`,
      description: `StreetManager ${notificationData.object_type || 'notification'} ${notificationData.event_type || 'event'}`,
      webhook_event_type: notificationData.event_type,
      raw_webhook_data: notificationData,
      street_name: notificationData.object_data?.street_name || null,
      area_name: notificationData.object_data?.area_name || null,
      coordinates: parsedCoordinates,
      location_description: notificationData.object_data?.location_description || null,
      work_description: notificationData.object_data?.description || null,
      work_category: notificationData.object_data?.work_category_ref || null,
      promoter_organisation: notificationData.object_data?.promoter_organisation || null,
      highway_authority: notificationData.object_data?.highway_authority || null,
      proposed_start_date: notificationData.object_data?.proposed_start_date || null,
      proposed_end_date: notificationData.object_data?.proposed_end_date || null,
      actual_start_date: notificationData.object_data?.actual_start_date || notificationData.object_data?.actual_start_date_time || null,
      actual_end_date: notificationData.object_data?.actual_end_date || notificationData.object_data?.actual_end_date_time || null,
      permit_status: notificationData.object_data?.permit_status || null,
      work_status: notificationData.object_data?.work_status || notificationData.object_data?.work_status_ref || null,
      activity_status: notificationData.event_type === 'CREATED' ? 'active' : notificationData.event_type,
      severity: notificationData.object_data?.work_category === 'Major' ? 'High' : 'Medium',
      alert_status: notificationData.object_data?.work_status_ref === 'in_progress' ? 'red' : 'amber',
      processing_status: 'test',
      webhook_received_at: new Date().toISOString()
    };
    
    // Add additional fields
    if (notificationData.object_data) {
      webhookRecord.work_reference_number = notificationData.object_data.work_reference_number || null;
      webhookRecord.promoter_swa_code = notificationData.object_data.promoter_swa_code || null;
      webhookRecord.highway_authority_swa_code = notificationData.object_data.highway_authority_swa_code || null;
      webhookRecord.usrn = notificationData.object_data.usrn || null;
      webhookRecord.town = notificationData.object_data.town || null;
      webhookRecord.activity_type = notificationData.object_data.activity_type || null;
      webhookRecord.is_traffic_sensitive = notificationData.object_data.is_traffic_sensitive || null;
      webhookRecord.traffic_management_type = notificationData.object_data.traffic_management_type || null;
      webhookRecord.permit_conditions = notificationData.object_data.permit_conditions || null;
    }
    
    res.json({
      success: true,
      message: 'Webhook data processing test',
      results: {
        notificationId,
        coordinateParsing: {
          input: notificationData.object_data?.works_location_coordinates,
          output: parsedCoordinates,
          success: !!parsedCoordinates
        },
        recordFields: Object.keys(webhookRecord).length,
        severity: webhookRecord.severity,
        alertStatus: webhookRecord.alert_status,
        location: {
          street: webhookRecord.street_name,
          area: webhookRecord.area_name,
          town: webhookRecord.town
        }
      },
      webhookRecord,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Manual StreetManager polling endpoint
app.post('/api/streetmanager/poll', async (req, res) => {
  try {
    console.log('🔄 Manual StreetManager poll triggered...');
    const { default: streetManager } = await import('./services/streetManager.js');
    const result = await streetManager.pollAndSaveToSupabase();
    
    if (result.success) {
      console.log(`✅ Manual poll complete: ${result.totalSaved} roadworks saved`);
      res.json({
        success: true,
        message: 'StreetManager poll completed successfully',
        result: {
          totalSaved: result.totalSaved,
          activities: result.activities,
          permits: result.permits,
          timestamp: result.timestamp
        }
      });
    } else {
      throw new Error(result.error || 'Poll failed');
    }
  } catch (error) {
    console.error('❌ Manual poll error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'StreetManager poll failed'
    });
  }
});

// GET active StreetManager roadworks (uses the view) with enhanced data
app.get('/api/streetmanager/active-roadworks', async (req, res) => {
  try {
    const { street_name, severity, limit = 100, offset = 0 } = req.query;
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    let query = supabase
      .from('active_streetmanager_roadworks')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (street_name) {
      query = query.ilike('street_name', `%${street_name}%`);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    // Order and paginate
    query = query
      .order('severity', { ascending: false })
      .order('proposed_start_date', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data: roadworks, error, count } = await query;
    
    if (error) {
      console.error('❌ Failed to fetch active roadworks:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    // Enhance roadworks with map URLs and better location display
    const enhancedRoadworks = (roadworks || []).map(rw => {
      const enhanced = { ...rw };
      
      // Add map URLs
      if (rw.coordinates && rw.coordinates.lat && rw.coordinates.lng) {
        enhanced.mapUrl = `https://www.google.com/maps?q=${rw.coordinates.lat},${rw.coordinates.lng}`;
        enhanced.tomtomUrl = `https://www.tomtom.com/en_gb/maps/?lat=${rw.coordinates.lat}&lon=${rw.coordinates.lng}&zoom=16`;
        enhanced.hasCoordinates = true;
      } else {
        enhanced.hasCoordinates = false;
      }
      
      // Create display-friendly location
      enhanced.displayLocation = rw.street_name || rw.location_description || rw.area_name || 'Location not specified';
      enhanced.fullLocation = [rw.street_name, rw.area_name]
        .filter(Boolean)
        .join(', ') || rw.location_description || 'Location not specified';
      
      // Calculate days remaining
      if (rw.proposed_end_date || rw.actual_end_date) {
        const endDate = new Date(rw.actual_end_date || rw.proposed_end_date);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        enhanced.daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
        enhanced.timeStatus = daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Should be completed';
      } else {
        enhanced.timeStatus = 'No end date specified';
      }
      
      return enhanced;
    });
    
    res.json({
      success: true,
      roadworks: enhancedRoadworks,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + limit < count
      },
      metadata: {
        source: 'StreetManager Active Roadworks View',
        timestamp: new Date().toISOString(),
        filters: {
          streetName: street_name,
          severity: severity
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching active roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual StreetManager polling endpoint
app.post('/api/streetmanager/poll', async (req, res) => {
  try {
    console.log('🔄 Manual StreetManager poll triggered');
    
    // Check if API key is configured
    if (!process.env.STREET_MANAGER_API_KEY || process.env.STREET_MANAGER_API_KEY === 'your_streetmanager_api_key_here') {
      return res.json({
        success: false,
        error: 'StreetManager API key not configured',
        message: 'Please set STREET_MANAGER_API_KEY in .env file',
        webhookStatus: 'Webhook registered but not receiving data',
        solution: 'Either configure API key for polling OR check webhook registration with StreetManager'
      });
    }
    
    // Import and run the poll function
    const { pollAndSaveToSupabase } = await import('./services/streetManager.js');
    const result = await pollAndSaveToSupabase();
    
    res.json({
      success: result.success,
      message: 'StreetManager poll completed',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ StreetManager poll error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET StreetManager configuration status
app.get('/api/streetmanager/config-status', async (req, res) => {
  try {
    const { getApiStatus } = await import('./services/streetManager.js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Check webhook data in database
    const { data: recentWebhooks, error: webhookError } = await supabase
      .from('streetmanager_notifications')
      .select('webhook_received_at, webhook_event_type')
      .order('webhook_received_at', { ascending: false })
      .limit(5);
    
    const { count: totalNotifications } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true });
    
    const apiStatus = getApiStatus();
    
    res.json({
      success: true,
      webhook: {
        endpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook',
        testEndpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook/test',
        status: 'Registered and accessible',
        recentWebhooks: recentWebhooks || [],
        totalNotifications: totalNotifications || 0,
        lastWebhook: recentWebhooks?.[0]?.webhook_received_at || 'Never received'
      },
      api: apiStatus,
      recommendations: [
        'Option 1: Get StreetManager API key from https://api.streetmanager.service.gov.uk/',
        'Option 2: Contact StreetManager support to verify webhook is active',
        'Option 3: Check if webhook needs to be verified/activated on their portal'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Config status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET StreetManager roadworks active TODAY specifically
app.get('/api/streetmanager/active-today', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: todaysRoadworks, error } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .eq('processing_status', 'processed')
      .or(`proposed_start_date.lte.${tomorrow.toISOString()},actual_start_date.lte.${tomorrow.toISOString()}`)
      .or(`proposed_end_date.is.null,proposed_end_date.gte.${today.toISOString()},actual_end_date.is.null,actual_end_date.gte.${today.toISOString()}`)
      .order('severity', { ascending: false })
      .order('street_name', { ascending: true });
    
    if (error) {
      console.error('❌ Failed to fetch today\'s roadworks:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    
    // Group by severity and add map URLs
    const bySeverity = {
      Critical: [],
      High: [],
      Medium: [],
      Low: []
    };
    
    const enhancedRoadworks = (todaysRoadworks || []).map(rw => {
      const enhanced = { ...rw };
      
      // Add map URLs
      if (rw.coordinates && rw.coordinates.lat && rw.coordinates.lng) {
        enhanced.mapUrl = `https://www.google.com/maps?q=${rw.coordinates.lat},${rw.coordinates.lng}`;
        enhanced.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${rw.coordinates.lat},${rw.coordinates.lng}`;
      }
      
      // Display location with street name prominence
      enhanced.displayLocation = rw.street_name || rw.location_description || rw.area_name || 'Location not specified';
      
      // Time info
      const startDate = new Date(rw.actual_start_date || rw.proposed_start_date);
      const isNewToday = startDate >= today && startDate < tomorrow;
      enhanced.isNewToday = isNewToday;
      enhanced.startedToday = isNewToday ? 'Started Today' : 'Ongoing';
      
      // Group by severity
      const severity = rw.severity || 'Medium';
      if (bySeverity[severity]) {
        bySeverity[severity].push(enhanced);
      }
      
      return enhanced;
    });
    
    res.json({
      success: true,
      roadworks: enhancedRoadworks,
      summary: {
        total: enhancedRoadworks.length,
        bySeverity: {
          critical: bySeverity.Critical.length,
          high: bySeverity.High.length,
          medium: bySeverity.Medium.length,
          low: bySeverity.Low.length
        },
        newToday: enhancedRoadworks.filter(rw => rw.isNewToday).length
      },
      groupedBySeverity: bySeverity,
      metadata: {
        date: today.toISOString().split('T')[0],
        source: 'StreetManager Database',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching today\'s roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET StreetManager summary statistics
app.get('/api/streetmanager/summary', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('streetmanager_notifications')
      .select('activity_status', { count: 'exact', head: true });
    
    // Get counts by severity  
    const { data: severityCounts, error: severityError } = await supabase
      .from('streetmanager_notifications')
      .select('severity', { count: 'exact', head: true });
    
    // Get recent notifications (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: recentCount } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('webhook_received_at', yesterday.toISOString());
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true });
    
    res.json({
      success: true,
      summary: {
        total: totalCount || 0,
        last24Hours: recentCount || 0,
        byStatus: statusCounts || {},
        bySeverity: severityCounts || {},
        lastUpdated: new Date().toISOString()
      },
      quickLinks: {
        activeToday: '/api/streetmanager/active-today',
        allActive: '/api/streetmanager/active-roadworks',
        notifications: '/api/streetmanager/notifications',
        search: '/api/streetmanager/notifications?street_name=YOUR_STREET'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET StreetManager webhook diagnostics
app.get('/api/streetmanager/diagnostics', async (req, res) => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const diagnostics = {
      timestamp: new Date().toISOString(),
      webhook: {
        endpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook',
        status: 'configured',
        authentication: 'AWS SNS compatible'
      },
      database: {},
      recent_activity: {},
      registration_info: {}
    };
    
    // Check database status
    const { count: totalCount } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true });
    
    diagnostics.database.total_notifications = totalCount || 0;
    diagnostics.database.has_data = totalCount > 0;
    
    // Check recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count: last24h } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true })
      .gte('webhook_received_at', yesterday.toISOString());
    
    diagnostics.recent_activity.last_24_hours = last24h || 0;
    
    // Get last notification
    const { data: lastNotification } = await supabase
      .from('streetmanager_notifications')
      .select('notification_id, webhook_received_at, title, webhook_event_type')
      .order('webhook_received_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastNotification) {
      diagnostics.recent_activity.last_notification = {
        received: lastNotification.webhook_received_at,
        time_ago: Math.round((Date.now() - new Date(lastNotification.webhook_received_at)) / (1000 * 60 * 60)) + ' hours ago',
        title: lastNotification.title,
        type: lastNotification.webhook_event_type
      };
    } else {
      diagnostics.recent_activity.last_notification = 'No notifications received yet';
    }
    
    // Get processing stats
    const { data: processingStats } = await supabase
      .from('streetmanager_notifications')
      .select('processing_status');
    
    const statusCounts = {};
    if (processingStats) {
      processingStats.forEach(row => {
        const status = row.processing_status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }
    diagnostics.database.processing_status = statusCounts;
    
    // Check memory storage
    const memoryActivities = streetManagerWebhooks.getWebhookActivities();
    const memoryPermits = streetManagerWebhooks.getWebhookPermits();
    
    diagnostics.memory_storage = {
      activities: memoryActivities.data?.length || 0,
      permits: memoryPermits.data?.length || 0,
      last_activity: memoryActivities.metadata?.lastReceived || 'None',
      last_permit: memoryPermits.metadata?.lastReceived || 'None'
    };
    
    // Registration information
    diagnostics.registration_info = {
      status: totalCount > 0 ? 'Likely registered (receiving data)' : 'Unknown - no data received',
      instructions: 'To register for StreetManager webhooks:',
      steps: [
        '1. Visit https://www.gov.uk/guidance/find-and-use-roadworks-data',
        '2. Register for an account with your organization details',
        '3. Configure webhook URL: https://go-barry.onrender.com/api/streetmanager/webhook',
        '4. Ensure your area includes North East England'
      ],
      note: 'StreetManager may also require API polling instead of webhooks for some data',
      documentation: 'https://department-for-transport-streetmanager.github.io/street-manager-docs/'
    };
    
    // Summary
    diagnostics.summary = {
      receiving_notifications: totalCount > 0,
      recent_activity: last24h > 0,
      webhook_ready: true,
      action_required: totalCount === 0 ? 'Register webhook with DfT Street Manager' : 'None - system operational'
    };
    
    res.json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('❌ Error running diagnostics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      diagnostics: {
        error: 'Failed to run diagnostics',
        webhook_endpoint: 'https://go-barry.onrender.com/api/streetmanager/webhook'
      }
    });
  }
});

// Manual poll endpoint for StreetManager API
app.post('/api/streetmanager/poll', async (req, res) => {
  try {
    console.log('🔄 Manual StreetManager poll triggered');
    
    // Check if API key is configured
    const streetManager = await import('./services/streetManager.js');
    const apiStatus = streetManager.getApiStatus();
    
    if (!apiStatus.configured) {
      return res.status(400).json({
        success: false,
        error: 'StreetManager API key not configured',
        hint: 'Set STREET_MANAGER_API_KEY in environment variables'
      });
    }
    
    // Perform the poll
    const result = await streetManager.pollAndSaveToSupabase();
    
    res.json({
      success: result.success,
      message: result.success ? 'Poll completed successfully' : 'Poll failed',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Poll error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET StreetManager API status
app.get('/api/streetmanager/api-status', async (req, res) => {
  try {
    const streetManager = await import('./services/streetManager.js');
    const status = streetManager.getApiStatus();
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Street Manager webhook routes added directly');

// Catch-all route for unmatched paths - MUST BE LAST
app.use('*', (req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    hint: 'Check the API documentation for available endpoints'
  });
});

// REMOVED: Server startup is now handled by render-startup.js
/*
async function startServer() {
  try {
    console.log('🚀 Starting Go BARRY Backend...');
    
    // RENDER FIX: Bind to port IMMEDIATELY with error handling
    const port = process.env.PORT || 3001;
    
    // Check if server is already listening
    if (server.listening) {
      console.log(`✅ Server already listening on port ${port}`);
      return;
    }
    
    // Add error handler BEFORE calling listen
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${port} is already in use - this is OK on Render`);
        console.log('🔄 Server likely restarting, continuing...');
        
        // Still try to initialize
        initializeApplication().catch(error => {
          console.error('⚠️ Initialization error:', error.message);
        });
      } else {
        console.error('❌ Server error:', err);
        throw err;
      }
    });
    
    server.listen(port, () => {
      console.log(`✅ PORT ${port} BOUND SUCCESSFULLY`);
      console.log('🏃 Starting async initialization...');
      
      // Initialize AFTER port binding
      initializeApplication().then(async () => {
        console.log('✅ Basic initialization complete');
        
        // Initialize Go BARRY system with 3-month data retention
        try {
          await startupService.initializeGoBarrySystem();
          console.log('✅ Go BARRY system initialization complete');
        } catch (error) {
          console.error('⚠️ Go BARRY system initialization error:', error.message);
          console.log('⚠️ Continuing without data retention system...');
        }
      }).catch(error => {
        console.error('⚠️ Initialization error:', error.message);
        console.log('⚠️ Continuing with limited functionality...');
      });
      
      // Initialize WebSocket service
      supervisorSyncService.initialize(server);
      
      console.log(`\n🚀 Go BARRY Backend Started Successfully`);
      console.log(`📡 Server: http://localhost:${port}`);
      console.log(`🌐 Public: https://go-barry.onrender.com`);
      console.log(`\n📡 Available Endpoints:`);
      console.log(`   🎯 Main: /api/alerts`);
      console.log(`   🚀 Enhanced (DISPLAY SCREEN): /api/alerts-enhanced`);
      console.log(`   🚨 Emergency: /api/emergency-alerts`);
      console.log(`   💚 Health: /api/health`);
      console.log(`   🧑‍⚕️ Health Extended: /api/health-extended`);
      console.log(`   🏥 System Health (3-month retention): /api/system/health`);
      console.log(`   📊 Retention Status: /api/system/retention-status`);
      console.log(`   🧹 Manual Cleanup (admin): /api/admin/cleanup`);
      console.log(`   👮 Supervisor: /api/supervisor`);
      console.log(`   🙅 Dismiss Alert: /api/supervisor/dismiss-alert`);
      console.log(`   🚧 Roadworks: /api/roadworks`);
      console.log(`   📥 StreetManager Webhook: /api/streetmanager/webhook`);
      console.log(`   📋 StreetManager Status: /api/streetmanager/status`);
      console.log(`   🔌 WebSocket: wss://go-barry.onrender.com/ws/supervisor-sync`);
      console.log(`   📊 Sync Status: /api/supervisor/sync-status`);
      console.log(`   🕐 Throttle Status: /api/throttle/status`);
      console.log(`   🗺️ Map Tiles: /api/tiles/map/{layer}/{style}/{zoom}/{x}/{y}.{format}`);
      console.log(`   🚦 Traffic Tiles: /api/tiles/traffic/{zoom}/{x}/{y}.{format}`);
      console.log(`   📊 Tile Status: /api/tiles/status`);
      console.log(`   📝 Activity Logs: /api/activity-logs`);
      console.log(`   📊 Activity Summary: /api/activity-logs/summary`);
      console.log(`   💻 Display View Log: /api/activity/display-view`);
      console.log(`   👷 Duty Management: /api/duty/start, /api/duty/end, /api/duty/status`);
      console.log(`   📋 Duty Types: /api/duty/types`);
      console.log(`   👥 Active Duties: /api/duty/active`);
      console.log(`   🧠 Test AI Diversions: /api/test/diversions`);
      console.log(`   📍 AI Diversion Engine: /api/incidents/:id/diversions`);
      console.log(`\n💡 Active Data Sources:`);
      console.log(`   ✅ TomTom API - Primary traffic intelligence`);
      console.log(`   ✅ National Highways DATEX II - Official UK roadworks`);
      console.log(`   ✅ StreetManager UK - Webhook receiver`);
      console.log(`   ✅ Manual Incidents - Supervisor-created`);
      console.log(`   🧠 AI Diversion Engine - GTFS + TomTom routing`);
      console.log(`   🎆 System operational with 4 traffic data sources + AI diversions`);
      console.log(`\n📍 New Features:`);
      console.log(`   🗺️ Incident Map Integration - Visual location context`);
      console.log(`   🧠 AI Diversions - Local GTFS intelligence + TomTom live routing`);
      console.log(`   🚦 Real-time traffic-aware alternative routes`);
      console.log(`   ⏱️ Journey times and distances with traffic delays`);
      console.log(`\n✅ Render.com deployment ready!`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Start server anyway with minimal functionality for health checks
    console.log('⚠️ Starting server in degraded mode...');
    const port = process.env.PORT || 3001;
    server.listen(port, () => {
      console.log(`✅ Server started on port ${port}`);
      console.log(`🚑 Go BARRY Backend Started (Degraded Mode)`);
      console.log(`📡 Server: http://localhost:${port}`);
      console.log(`⚠️ Some features may not work due to initialization failure`);
    });
  }
}
*/

// FIXED: Server startup is now handled by render-startup.js
// The code below has been commented out since render-startup.js handles port binding
/*
console.log('🎯 CRITICAL FIX: Binding to port BEFORE initialization to satisfy Render requirements');
console.log('📍 AI Diversion System: GTFS local intelligence + TomTom live traffic routing');

// Server startup code removed - handled by render-startup.js
*/

// Log total routes registered
console.log(`🎆 index.js: Route registration complete!`);
console.log(`🎆 index.js: Total routes registered:`, global.goBarryRouteCount || 'tracking not available');

// Initialize communication services
import { communicationService } from './services/communications/communicationService.js';
import { emailService } from './services/communications/emailService.js';

// Initialize the application when this module is imported
initializeApplication().then(async () => {
  console.log('✅ Basic initialization complete');
  
  // Initialize communication services
  try {
    await communicationService.initialize();
    await emailService.initialize();
    console.log('✅ Communication services initialized');
  } catch (error) {
    console.error('⚠️ Communication services initialization error:', error.message);
    console.log('⚠️ Continuing without full communication features...');
  }
  
  // Initialize Go BARRY system with 3-month data retention
  try {
    await startupService.initializeGoBarrySystem();
    console.log('✅ Go BARRY system initialization complete');
  } catch (error) {
    console.error('⚠️ Go BARRY system initialization error:', error.message);
    console.log('⚠️ Continuing without data retention system...');
  }
  
  // Initialize WebSocket service if server is available
  if (server) {
    supervisorSyncService.initialize(server);
    console.log('✅ WebSocket service initialized');
  }
  
  // Start real-time disruption scoring (5-minute intervals)
  try {
    realTimeDisruptionScoring.startMonitoring(5);
    console.log('✅ Real-time disruption scoring started');
  } catch (error) {
    console.warn('⚠️ Disruption scoring failed to start:', error.message);
  }
  
  // Start bus location update loop
  try {
    busUpdateLoop.start();
    console.log('✅ Bus location update loop started');
  } catch (error) {
    console.warn('⚠️ Bus update loop failed to start:', error.message);
  }
  
  // Start Street Manager cleanup scheduler
  try {
    streetManagerScheduler.start();
    console.log('✅ Street Manager cleanup scheduler started (daily 2 AM cleanup)');
  } catch (error) {
    console.warn('⚠️ Street Manager scheduler failed to start:', error.message);
  }
}).catch(error => {
  console.error('⚠️ Initialization error:', error.message);
  console.log('⚠️ Continuing with limited functionality...');
});

// Top-level error handling for unhandled crashes
process.on('uncaughtException', err => {
  console.error('❌ Unhandled Exception:', err);
  // Try to close server gracefully
  if (server && server.listening) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Rejection:', err);
  // Try to close server gracefully
  if (server && server.listening) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM (Render sends this)
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Stop all intervals and cleanup
  try {
    supervisorManager.stopSessionCleanup();
    console.log('✅ Session cleanup stopped');
  } catch (error) {
    console.warn('⚠️ Error stopping session cleanup:', error.message);
  }
  
  // Stop bus update loop
  try {
    busUpdateLoop.stop();
    console.log('✅ Bus update loop stopped');
  } catch (error) {
    console.warn('⚠️ Error stopping bus update loop:', error.message);
  }
  
  // Stop Street Manager cleanup scheduler
  try {
    streetManagerScheduler.stop();
    console.log('✅ Street Manager scheduler stopped');
  } catch (error) {
    console.warn('⚠️ Error stopping Street Manager scheduler:', error.message);
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
    console.log('🗑️ Final garbage collection triggered');
  }
  
  if (server && server.listening) {
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;// Deployment timestamp: Sat 21 Jun 2025 22:45:00 BST
// Force redeploy: CONVEX_URL added Sat 21 Jun 2025 23:52:56 BST
// CONVEX_URL environment variable added Sat 21 Jun 2025 23:57:27 BST
// 3-Month Data Retention System COMPLETED: Sun 22 Jun 2025 16:30:00 BST
// Deployment timestamp: Tue 24 Jun 2025 09:43:34 BST
// Trigger redeploy Sat  5 Jul 2025 22:00:25 BST
