/*
 * Go Barry - Traffic Intelligence Platform Backend
 * © 2024-2025 Anthony Gair. All rights reserved.
 * anthonygair@icloud.com
 */

// backend/index.js - Go BARRY Backend
// Traffic Intelligence with TomTom + National Highways + StreetManager + Manual Incidents

// OPTIMIZED MEMORY-EFFICIENT IMPORTS
// Critical imports loaded immediately for startup
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Core services that must be available immediately
import memoryMonitor from './services/memoryMonitor.js';
import supervisorManager from './services/supervisorManager.js';

// NEW: Memory crisis resolution services
import redisCache from './services/redisCache.js';
import requestQueue from './services/requestQueue.js';
import StreamingResponseService from './services/streamingResponse.js';
import supabaseService from './services/supabaseService.js';
import supabaseConnectionManager from './services/supabaseConnectionManager.js';

// Import comprehensive memory optimization integration
import { masterMemoryOptimizationMiddleware, getOptimizationStats, getOptimizationHealth } from './middleware/masterMemoryOptimization.js';

// Import lightweight error recovery system (memory-optimized)
import errorRecoverySystemLite from './errorRecoverySystemLite.js';

// Lazy import cache to prevent duplicate loading
const lazyImportCache = new Map();

// Memory-efficient lazy import function
async function lazyImport(modulePath) {
  if (lazyImportCache.has(modulePath)) {
    return lazyImportCache.get(modulePath);
  }
  
  try {
    const module = await import(modulePath);
    lazyImportCache.set(modulePath, module);
    
    // Clear import cache periodically to prevent memory buildup
    if (lazyImportCache.size > 50) {
      const firstKey = lazyImportCache.keys().next().value;
      lazyImportCache.delete(firstKey);
    }
    
    return module;
  } catch (error) {
    console.error(`❌ Failed to lazy import ${modulePath}:`, error.message);
    throw error;
  }
}

// Memory-efficient route registrar
class MemoryOptimizedRouteManager {
  constructor() {
    this.registeredRoutes = new Set();
    this.routeCache = new Map();
  }
  
  async registerRoute(app, path, moduleFile, name) {
    if (this.registeredRoutes.has(path)) {
      console.log(`⚠️ Route ${path} already registered, skipping`);
      return;
    }
    
    try {
      console.log(`🔄 Attempting to register ${name} at ${path} from ${moduleFile}`);
      const module = await lazyImport(moduleFile);
      console.log(`📦 Module loaded for ${name}:`, {
        hasDefault: !!module.default,
        hasRouter: !!module.router,
        type: typeof (module.default || module)
      });
      
      const routeHandler = module.default || module;
      
      if (!routeHandler) {
        throw new Error(`No route handler found in ${moduleFile}`);
      }
      
      app.use(path, routeHandler);
      this.registeredRoutes.add(path);
      console.log(`✅ ${name} registered at ${path}`);
      
      // Verify the route was added to the app
      if (app._router && app._router.stack) {
        const routeFound = app._router.stack.some(layer => {
          return layer.regexp && layer.regexp.test(path);
        });
        console.log(`🔍 Route verification for ${path}: ${routeFound ? 'FOUND' : 'NOT FOUND'} in app router`);
      }
      
      // Force garbage collection after route registration
      if (global.gc && this.registeredRoutes.size % 10 === 0) {
        global.gc();
      }
    } catch (error) {
      console.error(`❌ Failed to register ${name} at ${path}:`, error.message);
      console.error(`❌ Error details:`, error);
    }
  }
  
  getStats() {
    return {
      registeredRoutes: this.registeredRoutes.size,
      cachedModules: lazyImportCache.size
    };
  }
}

const routeManager = new MemoryOptimizedRouteManager();

// MEMORY-OPTIMIZED INITIALIZATION
console.log('🌟 index.js: Memory-optimized module loading started at', new Date().toISOString());
console.log(`📊 Initial memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

// Log successful core imports
console.log('✅ Core imports completed successfully (lazy loading enabled)');

// Initialize dotenv
dotenv.config();

// Environment variable compatibility fixes
// Map various Supabase key names to what the code expects
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_KEY');
}

// Also map service key to anon key if anon key is missing
if (!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_KEY to SUPABASE_ANON_KEY');
}

// Try service role key as anon key too
if (!process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_ROLE_KEY to SUPABASE_ANON_KEY');
}

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
const app = global.goBarryApp;
if (!app) {
  console.error('❌ FATAL: No app instance found! render-startup.js must run first.');
  throw new Error('App not initialized by render-startup.js');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RENDER FIX: Immediate startup signal
console.log(`🚀 Go BARRY Backend Starting - PORT: ${process.env.PORT || 3001}`);
console.log('📡 Render.com Optimized Version - Immediate Port Binding...');

// Continue with the rest of the backend initialization...
console.log('✅ Backend initialization complete, applying memory optimizations...');

// APPLY MASTER MEMORY OPTIMIZATION SYSTEM
// This must be done before registering routes to ensure proper middleware order
app.use(masterMemoryOptimizationMiddleware(app));
console.log('🎯 Master memory optimization system applied');

console.log('✅ Proceeding with route registration...');

// MEMORY-OPTIMIZED ROUTE REGISTRATION
// Register core API routes with lazy loading
async function registerRoutes() {
  console.log('🔗 registerRoutes() called - Registering API routes with memory optimization...');
  console.log(`📱 App instance in registerRoutes: ${!!app}`);
  
  // Essential routes - load immediately
  await routeManager.registerRoute(app, '/api/health', './routes/health.js', 'Health API');
  await routeManager.registerRoute(app, '/api/memory', './routes/memoryAPI.js', 'Memory API');
  await routeManager.registerRoute(app, '/api/memory-crisis', './routes/memoryCrisisAPI.js', 'Memory Crisis Management API');
  await routeManager.registerRoute(app, '/api/supabase-health', './routes/supabaseHealthAPI.js', 'Supabase Health Monitoring API');
  await routeManager.registerRoute(app, '/api/supervisor', './routes/supervisorAPI.js', 'Supervisor API');
  await routeManager.registerRoute(app, '/api/password', './routes/passwordManagement.js', 'Password Management');
  await routeManager.registerRoute(app, '/api/auth', './routes/secureAuth.js', 'Secure Authentication (JWT + bcrypt)');
  
  // Core functionality - load next
  await routeManager.registerRoute(app, '/api/admin', './routes/adminAPI.js', 'Admin API');
  await routeManager.registerRoute(app, '/api/shifts', './routes/shiftManagement.js', 'Shift Management');
  await routeManager.registerRoute(app, '/api/incidents', './routes/incidentAPI.js', 'Incident API');
  await routeManager.registerRoute(app, '/api/incident-alerts', './routes/incidentAlertsAPI.js', 'Incident Alerts API');
  await routeManager.registerRoute(app, '/api/roadworks', './routes/roadworksAPI.js', 'Roadworks API');
  console.log('✅ Roadworks API includes unified endpoint at /api/roadworks/unified');
  
  // NEW: Unified coordinate service API
  await routeManager.registerRoute(app, '/api/coordinates', './routes/coordinateAPI.js', 'Unified Coordinate API');
  console.log('✅ Unified Coordinate API registered - single source of truth for all coordinate operations');
  
  // Legacy coordinate enhancement API (will be deprecated)
  await routeManager.registerRoute(app, '/api/coordinates-legacy', './routes/coordinateEnhancementsAPI.js', 'Legacy Coordinate Enhancements API');
  console.log('⚠️ Legacy coordinate enhancements API registered (deprecated - use /api/coordinates instead)');
  await routeManager.registerRoute(app, '/api/coordinate-cache', './routes/coordinateCacheTest.js', 'Coordinate Cache Test API');
  console.log('✅ Coordinate cache test API registered for testing new caching system');
  await routeManager.registerRoute(app, '/api/disruptions', './routes/disruptionAPI.js', 'Disruption API');
  console.log('✅ Disruption API registered for roadworks escalation system');
  await routeManager.registerRoute(app, '/api/escalation', './routes/escalationAPI.js', 'Escalation API');
  console.log('✅ Escalation API registered for comprehensive roadworks escalation workflow');
  await routeManager.registerRoute(app, '/api/alerts', './routes/alerts.js', 'Alerts API');
  console.log('✅ Alerts API registered for alert management and display push');
  
  // CRITICAL: Street Manager webhook must be registered immediately for AWS SNS
  await routeManager.registerRoute(app, '/api/streetmanager', './routes/streetManagerWebhook.js', 'Street Manager Webhook');
  console.log('✅ Street Manager Webhook registered for AWS SNS notifications');
  await routeManager.registerRoute(app, '/api/streetmanager-diagnostics', './routes/streetManagerDiagnostics.js', 'Street Manager Diagnostics');
  console.log('✅ Street Manager Diagnostics registered');
  
  // Memory-optimized streaming routes - high priority
  await routeManager.registerRoute(app, '/api/gtfs-optimized', './routes/optimizedGTFSAPI.js', 'Optimized GTFS API');
  // await routeManager.registerRoute(app, '/api/roadworks-optimized', './routes/optimizedRoadworksAPI.js', 'Optimized Roadworks API'); // Temporarily disabled
  
  // Secondary routes - load on demand  
  await routeManager.registerRoute(app, '/api/health-extended', './routes/healthExtended.js', 'Health Extended API');
  await routeManager.registerRoute(app, '/api/communications', './routes/communications/index.js', 'Communications API');
  await routeManager.registerRoute(app, '/api/file-management', './routes/fileManagementAPI.js', 'File Management API');
  await routeManager.registerRoute(app, '/api/roadwork-alerts', './routes/roadworkAlertsAPI-simple.js', 'Roadwork Alerts API');
  await routeManager.registerRoute(app, '/api/streetworks', './routes/streetworksAPI.js', 'Streetworks API');
  await routeManager.registerRoute(app, '/api/streetmanager-debug', './routes/streetmanagerDebug.js', 'Street Manager Debug API');
  await routeManager.registerRoute(app, '/api/gtfs', './routes/gtfsAPI.js', 'GTFS API');
  await routeManager.registerRoute(app, '/api/events', './routes/eventAPI.js', 'Event API');
  await routeManager.registerRoute(app, '/api/tiles', './routes/tileAPI.js', 'Tile API');
  await routeManager.registerRoute(app, '/api/display', './routes/displayAPI.js', 'Display API');
  await routeManager.registerRoute(app, '/api/analytics', './routes/analyticsAPI.js', 'Analytics API');
  await routeManager.registerRoute(app, '/api/analytics-routes', './routes/analyticsRoutes.js', 'Analytics Routes');
  
  // Error recovery and circuit breaker management
  await routeManager.registerRoute(app, '/api/circuit-breaker', './routes/circuitBreaker.js', 'Circuit Breaker Management');
  console.log('✅ Circuit breaker management API registered');
  
  console.log('✅ Core routes registered with memory optimization');
}

// Add comprehensive optimization status endpoints
app.get('/api/optimization/status', (req, res) => {
  try {
    const stats = getOptimizationStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/optimization/health', (req, res) => {
  try {
    const health = getOptimizationHealth();
    const statusCode = health.status === 'critical' ? 503 : 
                      health.status === 'warning' ? 429 : 200;
    
    res.status(statusCode).json({
      success: health.status !== 'critical',
      ...health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Optimization status endpoints registered');

// Register routes and wait for completion before starting server
async function initializeServer() {
  try {
    console.log('🔄 initializeServer() called - starting route registration...');
    console.log(`📱 Global app available: ${!!global.goBarryApp}`);
    console.log(`📱 Local app available: ${!!app}`);
    
    // Register all routes first
    await registerRoutes();
    console.log('✅ All routes registered successfully');
    
    // Then register direct endpoints
    app.get('/api/config/tomtom-key', (req, res) => {
      res.json({
        success: true,
        apiKey: process.env.TOMTOM_API_KEY || '',
        hasKey: !!process.env.TOMTOM_API_KEY
      });
    });
    console.log('✅ TomTom Config endpoint registered at /api/config/tomtom-key');

    app.get('/api/weather/current', async (req, res) => {
      try {
        // Simple weather endpoint - can be enhanced later
        res.json({
          success: true,
          weather: {
            temperature: 15,
            condition: 'Partly Cloudy',
            location: 'Newcastle, UK'
          },
          message: 'Weather service placeholder - real integration needed'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    console.log('✅ Weather endpoint registered at /api/weather/current');

    // Add a simple test endpoint to verify route registration is working
    app.get('/api/test-route-fix', (req, res) => {
      res.json({
        success: true,
        message: 'Route registration fix is working!',
        timestamp: new Date().toISOString(),
        routes_registered: routeManager.getStats()
      });
    });
    console.log('✅ Test endpoint registered at /api/test-route-fix');
    
  } catch (error) {
    console.error('❌ Route registration failed:', error);
    throw error;
  }
}

// Route initialization is handled by render-startup.js
// Export the initializeServer function for use by render-startup.js
export { initializeServer };

// Incident alerts endpoint is now registered through routeManager above

// MEMORY-OPTIMIZED ALERTS ENDPOINT
app.get('/api/alerts-enhanced', async (req, res) => {
  try {
    console.log('🚨 Fetching enhanced alerts (memory optimized)...');
    
    // Lazy load alert services to save memory
    const [tomtomService, nationalHighwaysService, alertUtils, convexService] = await Promise.all([
      lazyImport('./services/tomtom-enhanced.js'),
      lazyImport('./services/nationalHighways.js'), 
      lazyImport('./utils/alertDeduplication.js'),
      lazyImport('./services/convexSync.js')
    ]);
    
    // Get alerts from various sources with memory management
    const alertPromises = [
      tomtomService.fetchTomTomTrafficWithStreetNames().catch(err => {
        console.error('❌ TomTom error:', err);
        return [];
      }),
      nationalHighwaysService.fetchNationalHighways().catch(err => {
        console.error('❌ National Highways error:', err);
        return [];
      })
    ];
    
    const [tomtomAlerts, nationalHighwaysAlerts] = await Promise.all(alertPromises);
    
    // Combine and deduplicate alerts efficiently
    let allAlerts = [...(tomtomAlerts || []), ...(nationalHighwaysAlerts || [])];
    allAlerts = alertUtils.deduplicateAlerts(allAlerts);
    
    // Apply dismissals
    const activeSupervisorId = req.query.supervisorId;
    if (activeSupervisorId) {
      allAlerts = supervisorManager.filterDismissedAlerts(allAlerts, activeSupervisorId);
    }
    
    // Sync to Convex if available
    if (convexService.convexSync) {
      convexService.convexSync.syncAlerts(allAlerts).catch(err => {
        console.error('❌ Convex sync error:', err);
      });
    }
    
    // Clear references for garbage collection
    tomtomAlerts.length = 0;
    nationalHighwaysAlerts.length = 0;
    
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources: {
          tomtom: tomtomAlerts?.length || 0,
          nationalHighways: nationalHighwaysAlerts?.length || 0
        },
        lastUpdated: new Date().toISOString(),
        memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      }
    });
    
    // Force garbage collection after response
    if (global.gc) {
      setTimeout(() => global.gc(), 100);
    }
    
  } catch (error) {
    console.error('❌ Error in alerts-enhanced:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      alerts: []
    });
  }
});
console.log('✅ Memory-optimized Alerts Enhanced endpoint registered at /api/alerts-enhanced');

// LAZY-LOADED SECONDARY ROUTES
// These routes will be registered on-demand to save memory
async function registerSecondaryRoutes() {
  console.log('🔗 Registering secondary routes on-demand...');
  
  // Messaging and communications
  await routeManager.registerRoute(app, '/api/messaging', './routes/messagingAPI.js', 'Messaging API');
  await routeManager.registerRoute(app, '/api/message', './routes/messageAPI.js', 'Message API');
  await routeManager.registerRoute(app, '/api/message-history', './routes/messageHistoryRoutes.js', 'Message History API');
  
  // Street Manager secondary routes (webhook and diagnostics moved to primary)
  await routeManager.registerRoute(app, '/api/streetmanager-cleanup', './routes/streetManagerCleanup.js', 'Street Manager Cleanup');
  await routeManager.registerRoute(app, '/api/streetmanager-actions', './routes/streetManagerActionsAPI.js', 'Street Manager Actions');
  
  // Intelligence and ML routes
  await routeManager.registerRoute(app, '/api/intelligence', './routes/intelligenceAPI.js', 'Intelligence API');
  
  // Utility routes
  await routeManager.registerRoute(app, '/api/cleanup', './routes/cleanupAPI.js', 'Cleanup API');
  
  console.log('✅ Secondary routes registered on-demand to conserve memory');
}

// Register secondary routes after a delay to stagger memory usage
setTimeout(() => {
  registerSecondaryRoutes().catch(error => {
    console.error('❌ Secondary route registration failed:', error);
  });
}, 5000); // 5 second delay

// COMPREHENSIVE MEMORY-OPTIMIZED SERVICE INITIALIZATION
(async () => {
  try {
    console.log('🎯 Initializing Go BARRY backend with comprehensive memory optimization...');
    
    // Memory optimization integration is auto-initialized
    console.log('✅ Comprehensive memory optimization active');
    
    // Register additional cleanup callbacks for this module
    memoryMonitor.registerCleanupCallback((type) => {
      console.log(`🧹 Index.js performing ${type} cleanup...`);
      
      // Clear import cache
      if (lazyImportCache.size > 20) {
        const toDelete = Math.floor(lazyImportCache.size / 2);
        const keys = Array.from(lazyImportCache.keys()).slice(0, toDelete);
        keys.forEach(key => lazyImportCache.delete(key));
        console.log(`🗑️ Cleared ${toDelete} cached imports`);
      }
      
      // Clear route cache if needed
      if (routeManager.routeCache && routeManager.routeCache.size > 100) {
        routeManager.routeCache.clear();
        console.log('🗑️ Cleared route cache');
      }
    });
    
    // Initialize GTFS with ultra-memory-safe streaming
    const { initializeStreamingProcessor } = await lazyImport('./gtfs-streaming-processor.js');
    await initializeStreamingProcessor();
    console.log('✅ Ultra-memory-safe GTFS processor initialized');
    
    // Use memory-optimized supervisor sync instead of WebSocket-heavy version
    console.log('✅ Memory-optimized supervisor sync active (no WebSocket overhead)');
    
    // Initialize dismissed alerts cleanup scheduler
    try {
      const { cleanupScheduler } = await lazyImport('./services/cleanupScheduler.js');
      const schedulerResult = await cleanupScheduler.startScheduler();
      if (schedulerResult.success) {
        console.log(`✅ Dismissed alerts cleanup scheduler started (${schedulerResult.scheduled_jobs} jobs)`);
        console.log('🧹 Automated cleanup will prevent database bloat and optimize memory usage');
      } else {
        console.warn('⚠️ Cleanup scheduler failed to start:', schedulerResult.error);
      }
    } catch (error) {
      console.warn('⚠️ Could not initialize cleanup scheduler:', error.message);
      console.log('📝 Cleanup can still be triggered manually via API endpoints');
    }
    
    // Initialize memory crisis resolution services
    console.log('🚨 Initializing memory crisis resolution services...');
    
    // Supabase connection manager with pooling and retries
    await supabaseService.initialize();
    console.log('✅ Supabase connection manager with pooling initialized');
    
    // Redis cache service
    await redisCache.initialize();
    console.log('✅ Redis cache service initialized');
    
    // Initialize lightweight error recovery system
    await errorRecoverySystemLite.initialize();
    console.log('✅ Error recovery system (lite) initialized');
    
    // Request queue middleware (apply globally)
    app.use('/api/roadworks', requestQueue.middleware('roadworks'));
    app.use('/api/alerts', requestQueue.middleware('alerts'));
    console.log('✅ Request queuing system active');
    
    // Streaming response middleware
    app.use(StreamingResponseService.streamingMiddleware());
    console.log('✅ Streaming response system ready');
    
    // All other services load on-demand
    console.log('✅ All additional services configured for on-demand loading');
    
    // Display simple initialization summary
    console.log('\n🎆 GO BARRY BACKEND ULTRA-MEMORY-OPTIMIZED READY 🎆');
    console.log('============================================================');
    console.log(`📈 Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB / 2048MB`);
    console.log('\n🌐 API Access:');
    console.log(`   Local: http://localhost:${process.env.PORT || 3001}`);
    console.log('   Production: https://go-barry.onrender.com');
    console.log('\n🛡️ Memory Protection:');
    console.log('   - Lazy loading active for all non-critical modules');
    console.log('   - GTFS streaming with 2GB RAM limits');
    console.log('   - Supabase connection pooling with retry mechanisms');
    console.log('   - Redis caching layer to reduce database queries');
    console.log('   - Request queuing to prevent concurrent memory spikes');
    console.log('   - Streaming responses for large datasets');
    console.log('   - Automatic garbage collection and cleanup');
    console.log('   - Emergency shutdown protocols active');
    console.log('   - Real-time memory monitoring and optimization');
    console.log('   - Dismissed alerts cleanup scheduler (daily/weekly/monthly)');
    console.log('   - Configurable retention periods for dismissed records');
    console.log('   - Circuit breaker pattern for external API resilience');
    console.log('   - Automatic retry with exponential backoff');
    console.log('   - Fallback data system for service outages');
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('❌ Service initialization error:', error);
    console.log('⚠️ Continuing with degraded functionality...');
  }
})();

// Export for testing
// Memory cleanup on exit
process.on('SIGTERM', () => {
  console.log('🗑️ Cleaning up memory before exit...');
  
  // Clear all caches
  lazyImportCache.clear();
  routeManager.routeCache.clear();
  
  // Force final garbage collection
  if (global.gc) {
    global.gc();
  }
  
  console.log('✅ Memory cleanup completed');
});

export default app;
export { lazyImport, routeManager };
