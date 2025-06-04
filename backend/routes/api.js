// routes/api.js
// All API route handlers for BARRY

// Import all the services and utilities
import { fetchTomTomTrafficWithStreetNames } from "../services/tomtom.js";
import { fetchMapQuestTrafficWithStreetNames } from "../services/mapquest.js";
import { fetchHERETraffic } from "../services/here.js";
import { fetchNationalHighways } from "../services/nationalHighways.js";
import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';
import { 
  findNearbyStopsOptimized,
  enhanceLocationWithGTFSOptimized,
  getGTFSStatsOptimized,
  initializeGTFSOptimized
} from '../gtfs-location-enhancer-optimized.js';
import { 
  alertAffectsGTFSRoute,
  classifyAlert,
  deduplicateAlerts
} from '../utils/alerts.js';
import { calculateDistance } from '../utils/helpers.js';
import { processEnhancedAlerts } from '../services/enhancedAlertProcessor.js';

// Setup function that takes the app and global state
export function setupAPIRoutes(app, globalState) {
  const { 
    acknowledgedAlerts, 
    alertNotes, 
    alertsCache, 
    GTFS_ROUTES,
    NORTH_EAST_BBOXES,
    sampleTestAlerts,
    ACK_FILE,
    NOTES_FILE,
    cachedAlerts,
    lastFetchTime
  } = globalState;

  // Enhanced alerts endpoint with GTFS location accuracy
  app.get('/api/alerts-enhanced', async (req, res) => {
    try {
      console.log('🚀 Fetching enhanced alerts with GTFS location accuracy...');
      
      // Fetch from multiple sources
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
      
      const allAlerts = [];
      const sources = {};
      
      // Process TomTom results
      if (tomtomResult.success) {
        allAlerts.push(...tomtomResult.data);
        sources.tomtom = {
          success: true,
          count: tomtomResult.data.length,
          method: 'Enhanced with GTFS',
          enhancement: tomtomResult.enhancement
        };
      } else {
        sources.tomtom = {
          success: false,
          count: 0,
          error: tomtomResult.error
        };
      }
      
      // Process MapQuest results
      if (mapquestResult.success) {
        allAlerts.push(...mapquestResult.data);
        sources.mapquest = {
          success: true,
          count: mapquestResult.data.length,
          method: 'Enhanced with Location Processing'
        };
      } else {
        sources.mapquest = {
          success: false,
          count: 0,
          error: mapquestResult.error
        };
      }
      
      // Process with enhanced algorithms
      const enhancedAlerts = await processEnhancedAlerts(allAlerts);
      
      const stats = {
        totalAlerts: enhancedAlerts.length,
        activeAlerts: enhancedAlerts.filter(a => a.status === 'red').length,
        enhancedAlerts: enhancedAlerts.filter(a => a.locationAccuracy === 'high').length,
        alertsWithRoutes: enhancedAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
        averageRoutesPerAlert: enhancedAlerts.length > 0 ?
          (enhancedAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / enhancedAlerts.length).toFixed(1) : 0
      };
      
      res.json({
        success: true,
        alerts: enhancedAlerts,
        metadata: {
          totalAlerts: enhancedAlerts.length,
          sources,
          statistics: stats,
          lastUpdated: new Date().toISOString(),
          enhancement: 'GTFS location accuracy enabled',
          supervisor: {
            dismissalEnabled: true,
            accountabilityActive: true
          }
        }
      });
    } catch (error) {
      console.error('❌ Enhanced alerts endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: [],
        metadata: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // GTFS status endpoint  
  app.get('/api/gtfs-status', (req, res) => {
    try {
      // Import the GTFS stats function
      const stats = getGTFSStatsOptimized();
      
      res.json({
        success: true,
        gtfs: {
          initialized: true,
          stops: stats.stops,
          routes: stats.routes,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      res.json({
        success: false,
        gtfs: {
          initialized: false,
          error: error.message
        }
      });
    }
  });

  // Main alerts endpoint (simplified version)
  app.get('/api/alerts', async (req, res) => {
    try {
      console.log('🚀 Fetching main alerts...');
      
      // Check cache first
      const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      
      if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
        console.log('📦 Returning cached alerts');
        return res.json(cachedAlerts);
      }
      
      // Fetch fresh data
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      const allAlerts = [];
      
      if (tomtomResult.success) {
        allAlerts.push(...tomtomResult.data);
      }
      
      const response = {
        success: true,
        alerts: allAlerts,
        metadata: {
          totalAlerts: allAlerts.length,
          lastUpdated: new Date().toISOString(),
          cached: false
        }
      };
      
      // Update cache
      globalState.cachedAlerts = response;
      globalState.lastFetchTime = now;
      
      res.json(response);
    } catch (error) {
      console.error('❌ Main alerts endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: []
      });
    }
  });

  // Test alerts endpoint
  app.get('/api/alerts-test', async (req, res) => {
    res.json({
      metadata: {
        count: sampleTestAlerts.length,
        source: 'sampleTestAlerts',
      },
      alerts: sampleTestAlerts,
    });
  });

  // Configuration endpoint
  app.get('/api/config', (req, res) => {
    res.json({
      gtfsRoutesCount: GTFS_ROUTES.size || GTFS_ROUTES.length || 0,
      northeastBboxesCount: NORTH_EAST_BBOXES.length,
      cacheEnabled: true,
      enhancedLocationEnabled: true
    });
  });

  // Cache refresh endpoint
  app.get('/api/refresh', async (req, res) => {
    try {
      // Clear cache
      globalState.cachedAlerts = null;
      globalState.lastFetchTime = null;
      
      if (alertsCache && alertsCache.clear) {
        alertsCache.clear();
      }
      
      res.json({ 
        status: 'cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to clear cache',
        details: error.message
      });
    }
  });

  // Alert acknowledgment endpoint
  app.post('/api/acknowledge', async (req, res) => {
    const { alertId } = req.body;
    if (alertId) {
      if (typeof acknowledgedAlerts.add === 'function') {
        acknowledgedAlerts.add(alertId);
      } else {
        acknowledgedAlerts[alertId] = true;
      }
      
      // TODO: Save to ACK_FILE or persist as needed
      res.json({ status: 'acknowledged', alertId });
    } else {
      res.status(400).json({ error: 'alertId is required' });
    }
  });

  // Staff notes endpoint
  app.post('/api/note', async (req, res) => {
    const { alertId, note } = req.body;
    if (alertId && note) {
      alertNotes[alertId] = note;
      // TODO: Save to NOTES_FILE or persist as needed
      res.json({ status: 'note saved', alertId });
    } else {
      res.status(400).json({ error: 'alertId and note are required' });
    }
  });

  // Debug traffic endpoint
  app.get('/api/debug-traffic', async (req, res) => {
    try {
      const tomTomData = await fetchTomTomTrafficWithStreetNames();
      const mapquestData = await fetchMapQuestTrafficWithStreetNames();
      
      console.log('TomTom Traffic Data:', tomTomData);
      console.log('MapQuest Traffic Data:', mapquestData);
      
      res.json({
        tomTom: tomTomData,
        mapquest: mapquestData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      res.status(500).json({ error: 'Failed to fetch traffic data' });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.send('Welcome to BARRY API - Traffic Intelligence Platform');
  });

  // Health check endpoint (simple version - detailed health is in health.js)
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        api: 'online',
        gtfs: 'online'
      }
    });
  });
}

export default { setupAPIRoutes };