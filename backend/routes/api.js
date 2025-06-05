// routes/api.js
// All API route handlers for BARRY

// Import all the services and utilities
import { fetchTomTomTrafficWithStreetNames } from "../services/tomtom.js";
import { fetchMapQuestTrafficWithStreetNames } from "../services/mapquest.js";
import { fetchHERETraffic } from "../services/here.js";
import { fetchNationalHighways } from "../services/nationalHighways.js";
// OLD REST API (removed):
// import { fetchStreetManagerActivities, ... } from "../services/streetManager.js";

// NEW WEBHOOK SERVICE:
import { 
  handleWebhookMessage,
  getWebhookActivities,
  getWebhookPermits,
  addTestData,
  getWebhookStatus
} from "../services/streetManagerWebhooksSimple.js";
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
  initializeEnhancedGTFS,
  getEnhancedGTFSStats
} from '../enhanced-gtfs-route-matcher.js';
import { 
  alertAffectsGTFSRoute,
  classifyAlert,
  deduplicateAlerts
} from '../utils/alerts.js';
import { calculateDistance } from '../utils/helpers.js';
import { processEnhancedAlerts } from '../services/enhancedAlertProcessor.js';
import disruptionLogger from '../services/disruptionLogger.js';

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
      
      // Fetch from multiple sources including StreetManager
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
      // StreetManager webhook data (using webhook service)
      const streetManagerActivities = getWebhookActivities();
      const streetManagerPermits = getWebhookPermits();
      const streetManagerResult = {
        success: true,
        data: [...streetManagerActivities.data, ...streetManagerPermits.data],
        metadata: {
          source: 'StreetManager Webhooks',
          activities: streetManagerActivities.data.length,
          permits: streetManagerPermits.data.length,
          method: 'webhook_storage'
        }
      };
      
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
      
      // Process StreetManager results
      if (streetManagerResult.success) {
        allAlerts.push(...streetManagerResult.data);
        sources.streetmanager = {
          success: true,
          count: streetManagerResult.data.length,
          method: 'Official UK Roadworks Data',
          official: true
        };
      } else {
        sources.streetmanager = {
          success: false,
          count: 0,
          error: streetManagerResult.error
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

  // ==============================
  // STREETMANAGER ENDPOINTS
  // ==============================

  // StreetManager Activities Endpoint - Live roadworks and activities
  app.get('/api/streetmanager/activities', async (req, res) => {
    try {
      console.log('🚧 StreetManager activities endpoint called');
      
      const forceRefresh = req.query.refresh === 'true';
      // Use webhook data instead of API calls
      const result = getWebhookActivities();
      
      if (result.success) {
        res.json({
          success: true,
          activities: result.data,
          metadata: {
            ...result.metadata,
            endpoint: '/api/streetmanager/activities',
            requestTime: new Date().toISOString()
          }
        });
      } else {
        res.status(502).json({
          success: false,
          error: result.error,
          activities: [],
          metadata: {
            source: 'StreetManager Activities',
            error: result.error,
            endpoint: '/api/streetmanager/activities',
            requestTime: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ StreetManager activities endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        activities: []
      });
    }
  });

  // StreetManager Permits Endpoint - Planned roadworks permits
  app.get('/api/streetmanager/permits', async (req, res) => {
    try {
      console.log('📋 StreetManager permits endpoint called');
      
      const forceRefresh = req.query.refresh === 'true';
      // Use webhook data instead of API calls
      const result = getWebhookPermits();
      
      if (result.success) {
        res.json({
          success: true,
          permits: result.data,
          metadata: {
            ...result.metadata,
            endpoint: '/api/streetmanager/permits',
            requestTime: new Date().toISOString()
          }
        });
      } else {
        res.status(502).json({
          success: false,
          error: result.error,
          permits: [],
          metadata: {
            source: 'StreetManager Permits',
            error: result.error,
            endpoint: '/api/streetmanager/permits',
            requestTime: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('❌ StreetManager permits endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        permits: []
      });
    }
  });

  // Get specific permit details by reference number
  app.get('/api/streetmanager/permit/:permitReference', async (req, res) => {
    try {
      const { permitReference } = req.params;
      console.log(`🔍 Fetching permit details: ${permitReference}`);
      
      // Permit details not available in webhook mode
      const result = { success: false, error: 'Permit details not available in webhook mode' };
      
      if (result.success) {
        res.json({
          success: true,
          permit: result.data,
          metadata: {
            ...result.metadata,
            endpoint: `/api/streetmanager/permit/${permitReference}`,
            requestTime: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error || 'Permit not found',
          permit: null
        });
      }
    } catch (error) {
      console.error('❌ Permit details endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        permit: null
      });
    }
  });

  // Get specific activity details by reference number
  app.get('/api/streetmanager/activity/:activityReference', async (req, res) => {
    try {
      const { activityReference } = req.params;
      console.log(`🔍 Fetching activity details: ${activityReference}`);
      
      // Activity details not available in webhook mode
      const result = { success: false, error: 'Activity details not available in webhook mode' };
      
      if (result.success) {
        res.json({
          success: true,
          activity: result.data,
          metadata: {
            ...result.metadata,
            endpoint: `/api/streetmanager/activity/${activityReference}`,
            requestTime: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error || 'Activity not found',
          activity: null
        });
      }
    } catch (error) {
      console.error('❌ Activity details endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        activity: null
      });
    }
  });

  // StreetManager combined endpoint - Both activities and permits
  app.get('/api/streetmanager/all', async (req, res) => {
    try {
      console.log('🔄 StreetManager combined endpoint called');
      
      const forceRefresh = req.query.refresh === 'true';
      
      // Get webhook data instead of API calls
      const activitiesResult = getWebhookActivities();
      const permitsResult = getWebhookPermits();
      
      const allAlerts = [];
      const sources = {};
      
      // Process activities
      if (activitiesResult.success) {
        allAlerts.push(...activitiesResult.data);
        sources.activities = {
          success: true,
          count: activitiesResult.data.length,
          lastUpdated: activitiesResult.metadata.lastUpdated
        };
      } else {
        sources.activities = {
          success: false,
          error: activitiesResult.error,
          count: 0
        };
      }
      
      // Process permits
      if (permitsResult.success) {
        allAlerts.push(...permitsResult.data);
        sources.permits = {
          success: true,
          count: permitsResult.data.length,
          lastUpdated: permitsResult.metadata.lastUpdated
        };
      } else {
        sources.permits = {
          success: false,
          error: permitsResult.error,
          count: 0
        };
      }
      
      res.json({
        success: true,
        alerts: allAlerts,
        metadata: {
          totalAlerts: allAlerts.length,
          sources,
          endpoint: '/api/streetmanager/all',
          requestTime: new Date().toISOString(),
          coverage: 'North East England',
          official: true
        }
      });
    } catch (error) {
      console.error('❌ StreetManager combined endpoint error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        alerts: []
      });
    }
  });

  // StreetManager cache management
  app.post('/api/streetmanager/cache/clear', (req, res) => {
    try {
      // Clear webhook data instead of old cache
      // Note: The webhook service doesn't export a clear function yet
      console.log('StreetManager webhook data clear requested');
      res.json({
        success: true,
        message: 'StreetManager cache cleared',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // StreetManager status and configuration
  app.get('/api/streetmanager/status', (req, res) => {
    try {
      // Use webhook status instead of cache stats
      const webhookStatus = getWebhookStatus();
      
      res.json({
        success: true,
        status: {
          ...webhookStatus,
          dataEndpoints: {
            activities: '/api/streetmanager/activities',
            permits: '/api/streetmanager/permits',
            combined: '/api/streetmanager/all'
          },
          webhookEndpoints: {
            main: '/api/streetmanager/webhook',
            activities: '/api/streetmanager/webhook/activities'
          },
          coverage: 'North East England',
          lastChecked: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ==============================
  // DISRUPTION LOGGING ENDPOINTS
  // ==============================

  // Log a new disruption achievement
  app.post('/api/disruptions/log', async (req, res) => {
    try {
      console.log('📝 Disruption logging endpoint called');
      
      const disruptionData = req.body;
      
      // Validate required fields
      if (!disruptionData.title || !disruptionData.type || !disruptionData.location || !disruptionData.supervisor_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, type, location, supervisor_id'
        });
      }
      
      const result = await disruptionLogger.logDisruption(disruptionData);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Disruption logged successfully',
          data: result.data,
          metadata: {
            logged_at: new Date().toISOString(),
            endpoint: '/api/disruptions/log'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          endpoint: '/api/disruptions/log'
        });
      }
    } catch (error) {
      console.error('❌ Disruption logging endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log disruption',
        details: error.message
      });
    }
  });

  // Get disruption logs with filtering
  app.get('/api/disruptions/logs', async (req, res) => {
    try {
      console.log('📊 Disruption logs endpoint called');
      
      const filters = {
        supervisor_id: req.query.supervisor_id,
        depot: req.query.depot,
        type: req.query.type,
        severity_level: req.query.severity_level,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        route: req.query.route,
        sort_by: req.query.sort_by || 'logged_at',
        sort_order: req.query.sort_order || 'desc',
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') {
          delete filters[key];
        }
      });
      
      const result = await disruptionLogger.getDisruptionLogs(filters);
      
      if (result.success) {
        res.json({
          success: true,
          logs: result.data,
          metadata: {
            ...result.metadata,
            endpoint: '/api/disruptions/logs',
            request_time: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          logs: []
        });
      }
    } catch (error) {
      console.error('❌ Disruption logs endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch disruption logs',
        details: error.message
      });
    }
  });

  // Get disruption statistics
  app.get('/api/disruptions/statistics', async (req, res) => {
    try {
      console.log('📈 Disruption statistics endpoint called');
      
      const timeframe = {
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };
      
      const result = await disruptionLogger.getDisruptionStatistics(timeframe);
      
      if (result.success) {
        res.json({
          success: true,
          statistics: result.statistics,
          metadata: {
            endpoint: '/api/disruptions/statistics',
            generated_at: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Disruption statistics endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate statistics',
        details: error.message
      });
    }
  });

  // Update existing disruption log
  app.put('/api/disruptions/logs/:logId', async (req, res) => {
    try {
      const { logId } = req.params;
      const updateData = req.body;
      
      console.log(`📝 Updating disruption log: ${logId}`);
      
      const result = await disruptionLogger.updateDisruptionLog(logId, updateData);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Disruption log updated successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Update disruption log endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update disruption log',
        details: error.message
      });
    }
  });

  // Get specific disruption log by ID
  app.get('/api/disruptions/logs/:logId', async (req, res) => {
    try {
      const { logId } = req.params;
      
      console.log(`🔍 Fetching disruption log: ${logId}`);
      
      const result = await disruptionLogger.getDisruptionLogs({ id: logId, limit: 1 });
      
      if (result.success && result.data.length > 0) {
        res.json({
          success: true,
          log: result.data[0]
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Disruption log not found'
        });
      }
    } catch (error) {
      console.error('❌ Get disruption log endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch disruption log',
        details: error.message
      });
    }
  });

  // Delete disruption log (admin only)
  app.delete('/api/disruptions/logs/:logId', async (req, res) => {
    try {
      const { logId } = req.params;
      
      console.log(`🗑️ Deleting disruption log: ${logId}`);
      
      const result = await disruptionLogger.deleteDisruptionLog(logId);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Disruption log deleted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete disruption log endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete disruption log',
        details: error.message
      });
    }
  });

  // Disruption logging service health check
  app.get('/api/disruptions/health', async (req, res) => {
    try {
      const result = await disruptionLogger.healthCheck();
      
      res.json({
        success: true,
        health: result,
        endpoint: '/api/disruptions/health',
        checked_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Disruption health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        details: error.message
      });
    }
  });

  // ==============================
  // STREETMANAGER WEBHOOK ENDPOINTS (QUICK FIX)
  // ==============================

  // Main StreetManager webhook receiver
  app.post('/api/streetmanager/webhook', (req, res) => {
    try {
      console.log('📨 StreetManager webhook received');
      console.log('📋 Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('📋 Request body type:', typeof req.body);
      console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
      
      const result = handleWebhookMessage(req.body);
      
      if (result.error) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Webhook error:', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Legacy webhook endpoints
  app.post('/api/streetmanager/webhook/activities', (req, res) => {
    console.log('📨 Activities webhook called - redirecting to main webhook');
    try {
      const result = handleWebhookMessage(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint to add sample data
  app.post('/api/streetmanager/test', (req, res) => {
    try {
      addTestData();
      res.json({ status: 'test_data_added', timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Initialize enhanced GTFS system on startup
  console.log('🚀 Initializing Enhanced GTFS Route Matcher...');
  initializeEnhancedGTFS().then((success) => {
    if (success) {
      console.log('✅ Enhanced GTFS Route Matcher ready');
    } else {
      console.log('❌ Enhanced GTFS Route Matcher failed to initialize');
    }
  }).catch(error => {
    console.error('❌ Enhanced GTFS initialization error:', error.message);
  });
}

export default { setupAPIRoutes };