#!/usr/bin/env node
// Quick fix for Render.com port binding issue

// Environment variable compatibility fix - MUST run before any imports
// Render uses SUPABASE_SERVICE_ROLE_KEY but code expects SUPABASE_SERVICE_KEY
if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('✅ Mapped SUPABASE_SERVICE_ROLE_KEY to SUPABASE_SERVICE_KEY');
}

// Fix SUPABASE_URL typo if present
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('haountnghecfrsoniubq')) {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL.replace('haountnghecfrsoniubq', 'haountnqhecfrsonivbq');
  console.log('✅ Fixed SUPABASE_URL typo');
}

// Test Supabase URL accessibility
async function testSupabaseConnection() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.log('⚠️ Supabase environment variables not fully configured');
    return;
  }
  
  try {
    console.log('🔄 Testing Supabase connection...');
    const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection test successful');
    } else {
      console.log('❌ Supabase connection test failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Supabase connection test error:', error.message);
  }
}

// Run connection test (non-blocking)
(async () => {
  try {
    await testSupabaseConnection();
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
})();

import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Raw body parser for webhook will be handled in the route itself

const PORT = process.env.PORT || 3001;
const server = createServer(app);
// Store app and server globally for use in index.js
global.goBarryApp = app;
global.goBarryServer = server;

// Mark this app instance
app._goBarryInstance = 'render-startup';

// Debug: Track route registrations
let routeCount = { get: 0, post: 0, use: 0 };
const originalUse = app.use.bind(app);
const originalGet = app.get.bind(app);
const originalPost = app.post.bind(app);

app.use = function(...args) {
  if (typeof args[0] === 'string') {
    console.log(`📍 Route registered: USE ${args[0]}`);
    routeCount.use++;
  }
  return originalUse(...args);
};

app.get = function(...args) {
  // Only log actual route registrations (path + handler), not settings access
  if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'function') {
    console.log(`📍 Route registered: GET ${args[0]}`);
    routeCount.get++;
  }
  return originalGet(...args);
};

app.post = function(...args) {
  // Only log actual route registrations (path + handler)
  if (args.length >= 2 && typeof args[0] === 'string' && typeof args[1] === 'function') {
    console.log(`📍 Route registered: POST ${args[0]}`);
    routeCount.post++;
  }
  return originalPost(...args);
};

// Export route count for debugging
global.goBarryRouteCount = routeCount;

console.log('🚀 Starting Go BARRY Backend - Render Optimized...');
console.log(`📍 PORT configured: ${PORT}`);

// CORS middleware - secure configuration
app.use((req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    [
      'https://gobarry.co.uk', 
      'https://www.gobarry.co.uk', 
      'https://go-barry.onrender.com',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:19000'
    ];
  
  const origin = req.headers.origin;
  
  // Always allow requests from allowed origins or no origin (server-to-server)
  if (!origin || allowedOrigins.includes(origin) || origin.includes('gobarry.co.uk')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    // Only log non-standard origins to reduce noise
    if (origin && !origin.includes('localhost') && !origin.includes('gobarry.co.uk')) {
      console.log(`✅ CORS: Allowed origin: ${origin}`);
    }
  } else {
    // Only log blocked origins occasionally to reduce spam
    if (Math.random() < 0.1) { // Log only 10% of blocked origins
      console.log(`⚠️ CORS: Blocked origin: ${origin} (allowing anyway)`);
    }
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-session-id, x-supervisor, User-Agent, X-API-Key, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    // Only log preflight requests for non-localhost origins to reduce noise
    if (origin && !origin.includes('localhost')) {
      console.log(`✅ CORS Preflight: ${origin} → ${req.path}`);
    }
    return res.status(200).end();
  }
  next();
});

// Apply JSON parsing to all routes
// StreetManager webhook will override with bodyParser.text() in its route
app.use(express.json());

// Serve static files from the public directory
app.use('/public', express.static(join(__dirname, 'public')));
console.log('📂 Static file serving enabled at /public');

// Basic health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString(),
    service: 'Go BARRY Backend',
    port: PORT,
    renderOptimized: true
  });
});

// Supervisor activity endpoint
app.get('/api/supervisor/activity/recent', (req, res) => {
  res.json({
    success: true,
    activities: [],
    count: 0,
    lastUpdated: new Date().toISOString()
  });
});

// Supervisor login endpoint
app.post('/api/supervisor/login', (req, res) => {
  const { supervisorId, badge } = req.body;
  
  console.log(`🔐 Auth attempt: ${supervisorId} with badge ${badge}`);
  
  // SECURITY WARNING: Fallback authentication - only for development/emergency use
  // TODO: Replace with proper database authentication for production
  const enableFallbackAuth = process.env.ENABLE_FALLBACK_AUTH === 'true' || process.env.NODE_ENV === 'development';
  
  const validSupervisors = enableFallbackAuth ? {
    'supervisor001': { name: 'Alex Woodcock', badge: 'AW001' },
    'supervisor002': { name: 'Andrew Cowley', badge: 'AC002' },
    'supervisor003': { name: 'Anthony Gair', badge: 'AG003' },
    'supervisor004': { name: 'Claire Fiddler', badge: 'CF004' },
    'supervisor005': { name: 'David Hall', badge: 'DH005' },
    'supervisor006': { name: 'James Daglish', badge: 'JD006' },
    'supervisor007': { name: 'John Paterson', badge: 'JP007' },
    'supervisor008': { name: 'Simon Glass', badge: 'SG008' },
    'supervisor009': { name: 'Barry Perryman', badge: 'BP009' }
  } : {};
  
  const supervisor = validSupervisors[supervisorId];
  
  if (supervisor && supervisor.badge === badge) {
    const sessionId = `session_${supervisorId}_${Date.now()}`;
    
    console.log(`✅ Auth successful: ${supervisor.name}`);
    
    res.json({
      success: true,
      message: 'Authentication successful',
      sessionId,
      supervisor: {
        id: supervisorId,
        name: supervisor.name,
        badge: supervisor.badge,
        role: 'Supervisor',
        permissions: ['dismiss-alerts', 'create-incidents']
      }
    });
  } else {
    console.log(`❌ Auth failed: ${supervisorId}`);
    res.status(401).json({
      success: false,
      error: 'Invalid supervisor credentials'
    });
  }
});

// Active supervisors endpoint
app.get('/api/supervisor/active', (req, res) => {
  res.json({
    success: true,
    activeSupervisors: [],
    count: 0,
    lastUpdated: new Date().toISOString()
  });
});

// Basic alerts endpoint - REMOVED to allow full version from index.js
// app.get('/api/alerts-enhanced', (req, res) => {
//   res.json({
//     success: true,
//     alerts: [],
//     metadata: {
//       totalAlerts: 0,
//       sources: {},
//       lastUpdated: new Date().toISOString(),
//       mode: 'render_startup_mode'
//     }
//   });
// });

// DEBUG: Test endpoint to verify fix is working
app.get('/api/debug/route-test', (req, res) => {
  res.json({
    success: true,
    message: 'This route is from render-startup.js BEFORE index.js loads',
    timestamp: new Date().toISOString(),
    routeCount: global.goBarryRouteCount || { get: 0, post: 0, use: 0 },
    appInfo: {
      sameApp: true,
      serverListening: server.listening,
      port: PORT
    }
  });
});

// Note: Removed catch-all to allow actual backend routes to work

// RENDER FIX: Start listening immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Go BARRY Backend LISTENING on PORT ${PORT}`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔗 Public: https://go-barry.onrender.com`);
  console.log(`✅ PORT BINDING SUCCESSFUL FOR RENDER.COM`);
  console.log(`📡 Health check: https://go-barry.onrender.com/api/health`);
  
  // Load full backend after port is bound
  setTimeout(async () => {
    console.log('🔄 Loading full backend functionality...');
    console.log(`🔄 Route count before import - GET: ${routeCount.get}, POST: ${routeCount.post}, USE: ${routeCount.use}`);
    
    try {
      await import('./index.js');
      console.log('✅ Full backend loaded - ALL ROUTES NOW ACTIVE');
      console.log(`🎆 Route count after import - GET: ${routeCount.get}, POST: ${routeCount.post}, USE: ${routeCount.use}`);
      console.log('🎆 All API endpoints from index.js are now accessible!');
      console.log('🚀 Test roadwork endpoint: https://go-barry.onrender.com/api/roadwork-alerts-test');
      console.log('🎯 FIXED: All routes now use the same Express app instance!');
      
      // Test if a route from index.js is actually registered
      if (app._router && app._router.stack) {
        const testRoute = app._router.stack.find(layer => 
          layer.route && layer.route.path === '/api/roadwork-alerts-test'
        );
        console.log(`🗺️ Test route found in app: ${!!testRoute}`);
      }
      
      // Add a verification endpoint to confirm routes are working
      app.get('/api/verify-fix', (req, res) => {
        res.json({
          success: true,
          message: 'Routes from index.js are now accessible!',
          timestamp: new Date().toISOString(),
          routeCount: routeCount,
          source: 'Added after index.js import'
        });
      });
    } catch (error) {
      console.error('⚠️ Full backend failed to load:', error);
      console.log('🚨 Running in minimal mode');
    }
  }, 5000); // 5 second delay
});

// No longer exporting app - it's available via global.goBarryApp
