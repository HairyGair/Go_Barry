// routes/api.js
// All API route handlers for BARRY

// Import GTFS functions
import {
  initializeGTFSOptimized as initializeGTFS,
  getGTFSStatsOptimized as getGTFSStats,
  enhanceLocationWithGTFSOptimized
} from '../gtfs-location-enhancer-optimized.js';

// Import all the services and utilities
import { fetchTomTomTrafficWithStreetNames } from '../services/tomtom.js';
import { fetchHERETraffic } from '../services/here.js';
import { fetchNationalHighways } from '../services/nationalHighways.js';
import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';
// import { 
//   findNearbyGTFSRoutes,
//   findGTFSRoutesInRadius,
//   findNearbyGTFSStops
// } from '../gtfs-location-enhancer-optimized.js';
import { 
  alertAffectsGTFSRoute,
  classifyAlert,
  deduplicateAlerts
} from '../utils/alerts.js';
import { calculateDistance } from '../utils/helpers.js';

// Import necessary modules
import fs from 'fs/promises';

// Setup function that takes the app and global state
export function setupAPIRoutes(app, globalState) {
  const { 
    acknowledgedAlerts, 
    alertNotes, 
    sampleTestAlerts,
    GTFS_ROUTES,
    NORTH_EAST_BBOXES,
    ACK_FILE,
    NOTES_FILE,
    // Cache variables will be referenced directly on globalState
  } = globalState;

  // Enhanced alerts endpoint
  app.get('/api/alerts-enhanced', async (req, res) => {
    // Move the entire route handler here from index.js
    // This will be filled in when we copy the actual handlers
  });

  // GTFS status endpoint  
  app.get('/api/gtfs-status', (req, res) => {
    const stats = getGTFSStats();
    res.json({
      status: stats.isLoaded ? 'loaded' : 'not_loaded',
      ...stats,
      enhancement_ready: stats.isLoaded,
      last_load_hours_ago: stats.lastLoaded ?
        Math.round((Date.now() - new Date(stats.lastLoaded)) / (1000 * 60 * 60)) : null
    });
  });

  // Main alerts endpoint (the big one!)
  app.get('/api/alerts', async (req, res) => {
    // Move the massive alerts handler here
  });

  // Test alerts endpoint
  app.get('/api/alerts-test', async (req, res) => {
    console.log('🧪 Serving test alerts data...');
    
    res.json({
      success: true,
      alerts: sampleTestAlerts,
      metadata: {
        totalAlerts: sampleTestAlerts.length,
        sources: {
          testData: { success: true, count: sampleTestAlerts.length, method: 'Sample Data' }
        },
        lastUpdated: new Date().toISOString(),
        testMode: true
      }
    });
  });

  // Configuration endpoint
  app.get('/api/config', (req, res) => {
    res.json({
      mapbox: {
        accessToken: process.env.MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY || null,
        enabled: !!(process.env.MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_API_KEY)
      },
      version: '3.0-enhanced',
      timestamp: new Date().toISOString()
    });
  });

  // Cache refresh endpoint
  app.get('/api/refresh', async (req, res) => {
    try {
      console.log('🔄 Force refresh requested - clearing cache...');
      globalState.cachedAlerts = null;
      globalState.lastFetchTime = null;
      
      res.json({
        success: true,
        message: 'Cache cleared - next request will fetch fresh data',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Alert acknowledgment endpoint
  app.post('/api/acknowledge', async (req, res) => {
    const { alertId, duty } = req.body;
    if (!alertId || !duty) {
      return res.status(400).json({ success: false, error: 'alertId and duty required' });
    }
    const timestamp = new Date().toISOString();
    globalState.acknowledgedAlerts[alertId] = { duty, time: timestamp };
    // Save to disk
    await fs.writeFile(globalState.ACK_FILE, JSON.stringify(globalState.acknowledgedAlerts, null, 2));
    res.json({ success: true });
  });

  // Staff notes endpoint
  app.post('/api/note', async (req, res) => {
    const { alertId, duty, note } = req.body;
    if (!alertId || !duty || !note || !note.trim()) {
      return res.status(400).json({ success: false, error: 'alertId, duty, and note required' });
    }
    const timestamp = new Date().toISOString();
    if (!globalState.alertNotes[alertId]) globalState.alertNotes[alertId] = [];
    globalState.alertNotes[alertId].push({ duty, note, time: timestamp });
    await fs.writeFile(globalState.NOTES_FILE, JSON.stringify(globalState.alertNotes, null, 2));
    res.json({ success: true });
  });

  // Debug traffic endpoint
  app.get('/api/debug-traffic', async (req, res) => {
    console.log('🔍 Running traffic API debug...');
    
    const results = {
      timestamp: new Date().toISOString(),
      apis: {}
    };
    
    // Test each API individually
    console.log('\n--- Testing TomTom ---');
    const tomtom = await fetchTomTomTrafficWithStreetNames();
    results.apis.tomtom = {
      success: tomtom.success,
      count: tomtom.data?.length || 0,
      error: tomtom.error,
      sample: tomtom.data?.[0] || null
    };
    
    console.log('\n--- Testing HERE ---');
    const here = await fetchHERETraffic();
    results.apis.here = {
      success: here.success,
      count: here.data?.length || 0,
      error: here.error,
      sample: here.data?.[0] || null
    };
    
    console.log('\n--- Testing MapQuest ---');
    // Note: MapQuest function needs to be imported if available
    // const mapquest = await fetchMapQuestTraffic();
    // For now, we'll skip MapQuest in the debug route
    results.apis.mapquest = {
      success: false,
      count: 0,
      error: "MapQuest function not available in routes module",
      sample: null
    };
    
    console.log('\n--- Testing National Highways ---');
    const nh = await fetchNationalHighways();
    results.apis.nationalHighways = {
      success: nh.success,
      count: nh.data?.length || 0,
      error: nh.error,
      sample: nh.data?.[0] || null
    };
    
    console.log('\n🔍 Debug complete:', JSON.stringify(results, null, 2));
    res.json(results);
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: '🚦 BARRY Backend with Fixed API Authentication',
      version: '3.0-fixed',
      status: 'healthy',
      endpoints: {
        alerts: '/api/alerts (fixed authentication)',
        'alerts-test': '/api/alerts-test',
        health: '/api/health',
        refresh: '/api/refresh',
        acknowledge: '/api/acknowledge (POST)',
        debugTraffic: '/api/debug-traffic'
      },
      fixes: [
        'HERE API: Using apikey query parameter',
        'MapQuest API: Using key query parameter', 
        'TomTom API: Using key query parameter',
        'Proper error handling and fallbacks'
      ]
    });
  });
}

export default { setupAPIRoutes };