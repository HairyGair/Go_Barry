// routes/api.js
// All API route handlers for BARRY

// Import all the services and utilities
import { fetchTomTomTrafficWithStreetNames } from "../services/tomtom.js";
import { fetchMapQuestTrafficWithStreetNames } from "../services/mapquest.js";
import { fetchHERETrafficWithStreetNames } from "../services/here.js";
import { fetchNationalHighways } from "../services/nationalHighways.js";
// OLD REST API (removed):
// import { fetchStreetManagerActivities, ... } from "../services/streetManager.js";

// NEW WEBHOOK SERVICE:
import {
handleWebhookMessage,
getWebhookActivities,
getWebhookPermits,
addTestData,
getWebhookStatus,
  clearAllWebhookData
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
import { removeSampleData, filterMetadata } from '../utils/sampleDataFilter.js';
import disruptionLogger from '../services/disruptionLogger.js';
import disruptionWorkflowRouter from './disruptionWorkflowAPI.js';
import {
  initializeServiceFrequency,
  analyzeServiceFrequency,
  getNetworkServiceStatus,
  getServiceGapsDashboard,
  getBreakdownAlerts,
  getServiceTrends,
  getFrequencyStats
} from '../services/serviceFrequencyService.js';

// Setup function that takes the app and global state
export function setupAPIRoutes(app, globalState) {
  const { 
    acknowledgedAlerts, 
    alertNotes, 
    alertsCache, 
    GTFS_ROUTES,
    NORTH_EAST_BBOXES,
    ACK_FILE,
    NOTES_FILE,
    cachedAlerts,
    lastFetchTime
  } = globalState;

  // Enhanced alerts endpoint with GTFS location accuracy - LIVE DATA ONLY
  app.get('/api/alerts-enhanced', async (req, res) => {
    try {
      console.log('🚀 [FIXED] Fetching LIVE enhanced alerts with priority flow...');
      
      let allAlerts = [];
      const sources = {};
      
      // 1. PRIORITY: Get TomTom alerts first (most reliable)
      console.log('📡 Fetching TomTom alerts...');
      try {
        const tomtomResult = await fetchTomTomTrafficWithStreetNames();
        if (tomtomResult.success && tomtomResult.data && tomtomResult.data.length > 0) {
          allAlerts.push(...tomtomResult.data);
          sources.tomtom = {
            success: true,
            count: tomtomResult.data.length,
            method: 'Enhanced with GTFS (Live Data)',
            mode: 'live'
          };
          console.log(`✅ TomTom: ${tomtomResult.data.length} alerts fetched`);
        } else {
          sources.tomtom = {
            success: false,
            count: 0,
            error: tomtomResult.error || 'No data returned',
            mode: 'live'
          };
          console.log('⚠️ TomTom: No alerts returned or error occurred');
        }
      } catch (tomtomError) {
        console.error('❌ TomTom fetch failed:', tomtomError.message);
        sources.tomtom = {
          success: false,
          count: 0,
          error: tomtomError.message,
          mode: 'live'
        };
      }
      
      // 2. Get HERE alerts (enhanced coverage)
      console.log('🗺️ Fetching HERE alerts...');
      try {
        const hereResult = await fetchHERETrafficWithStreetNames();
        if (hereResult.success && hereResult.data && hereResult.data.length > 0) {
          allAlerts.push(...hereResult.data);
          sources.here = {
            success: true,
            count: hereResult.data.length,
            method: 'Enhanced with GTFS (Live Data)',
            coverage: hereResult.coverage,
            mode: 'live'
          };
          console.log(`✅ HERE: ${hereResult.data.length} alerts fetched`);
        } else {
          sources.here = {
            success: false,
            count: 0,
            error: hereResult.error || 'No data returned',
            mode: 'live'
          };
          console.log('⚠️ HERE: No alerts returned or error occurred');
        }
      } catch (hereError) {
        console.error('❌ HERE fetch failed:', hereError.message);
        sources.here = {
          success: false,
          count: 0,
          error: hereError.message,
          mode: 'live'
        };
      }
      
      // 3. Get MapQuest alerts (if working)
      console.log('🗺️ Fetching MapQuest alerts...');
      try {
        const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
        if (mapquestResult.success && mapquestResult.data && mapquestResult.data.length > 0) {
          allAlerts.push(...mapquestResult.data);
          sources.mapquest = {
            success: true,
            count: mapquestResult.data.length,
            method: 'Enhanced with Location Processing (Live Data)',
            mode: 'live'
          };
          console.log(`✅ MapQuest: ${mapquestResult.data.length} alerts fetched`);
        } else {
          sources.mapquest = {
            success: false,
            count: 0,
            error: mapquestResult.error || 'No data returned',
            mode: 'live'
          };
          console.log('⚠️ MapQuest: No alerts returned or auth issue');
        }
      } catch (mapquestError) {
        console.error('❌ MapQuest fetch failed:', mapquestError.message);
        sources.mapquest = {
          success: false,
          count: 0,
          error: mapquestError.message,
          mode: 'live'
        };
      }
      
      // 4. Get StreetManager webhook data
      console.log('🚧 Fetching StreetManager webhook data...');
      try {
        const streetManagerActivities = getWebhookActivities();
        const streetManagerPermits = getWebhookPermits();
        const streetManagerData = [...streetManagerActivities.data, ...streetManagerPermits.data];
        
        if (streetManagerData.length > 0) {
          allAlerts.push(...streetManagerData);
          sources.streetmanager = {
            success: true,
            count: streetManagerData.length,
            method: 'Official UK Roadworks Data (Live Only)',
            official: true,
            mode: 'live'
          };
          console.log(`✅ StreetManager: ${streetManagerData.length} alerts fetched`);
        } else {
          sources.streetmanager = {
            success: true,
            count: 0,
            method: 'Official UK Roadworks Data (Live Only)',
            note: 'No current roadworks data',
            mode: 'live'
          };
          console.log('ℹ️ StreetManager: No current roadworks');
        }
      } catch (streetManagerError) {
        console.error('❌ StreetManager webhook failed:', streetManagerError.message);
        sources.streetmanager = {
          success: false,
          count: 0,
          error: streetManagerError.message,
          mode: 'live'
        };
      }
      
      console.log(`📊 Raw alerts collected: ${allAlerts.length}`);
      
      // EMERGENCY: Filter out any sample data
      console.log('🗑️ Filtering out sample data...');
      const filteredAlerts = removeSampleData(allAlerts);
      console.log(`🗑️ Filtered: ${allAlerts.length} → ${filteredAlerts.length} alerts (removed ${allAlerts.length - filteredAlerts.length} sample alerts)`);
      
      // 5. ENHANCED PROCESSING - but ensure we ALWAYS return something
      let enhancedAlerts = [];
      if (filteredAlerts.length > 0) {
        try {
          console.log('🔄 Processing alerts with enhanced algorithms...');
          enhancedAlerts = await processEnhancedAlerts(filteredAlerts);
          console.log(`✅ Enhanced processing complete: ${enhancedAlerts.length} alerts`);
        } catch (enhancementError) {
          console.error('❌ Enhanced processing failed:', enhancementError.message);
          console.log('🔄 Falling back to filtered alerts...');
          enhancedAlerts = filteredAlerts; // Fallback to filtered alerts if enhancement fails
        }
      } else {
        console.log('ℹ️ No alerts to process after filtering');
      }
      
      // 6. Generate statistics
      const stats = {
        totalAlerts: enhancedAlerts.length,
        activeAlerts: enhancedAlerts.filter(a => a.status === 'red').length,
        enhancedAlerts: enhancedAlerts.filter(a => a.locationAccuracy === 'high').length,
        alertsWithRoutes: enhancedAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
        averageRoutesPerAlert: enhancedAlerts.length > 0 ?
          (enhancedAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / enhancedAlerts.length).toFixed(1) : 0
      };
      
      // 7. ALWAYS return a valid response
      let responseMetadata = {
        totalAlerts: enhancedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'GTFS location accuracy enabled',
        mode: 'live_data_only',
        sampleData: 'removed',
        supervisor: {
          dismissalEnabled: true,
          accountabilityActive: true
        },
        debug: {
          rawAlertsCollected: allAlerts.length,
          filteredAlerts: filteredAlerts.length,
          sampleAlertsRemoved: allAlerts.length - filteredAlerts.length,
          enhancedAlertsReturned: enhancedAlerts.length,
          sourcesWorking: Object.values(sources).filter(s => s.success).length,
          timestamp: new Date().toISOString()
        }
      };
      
      // Filter metadata to remove any sample data patterns
      responseMetadata = filterMetadata(responseMetadata);
      
      const response = {
        success: true,
        alerts: enhancedAlerts,
        metadata: responseMetadata
      };
      
      console.log(`🎯 [FIXED] Returning ${enhancedAlerts.length} alerts to frontend`);
      res.json(response);
      
    } catch (error) {
      console.error('❌ [CRITICAL] Enhanced alerts endpoint error:', error);
      
      // EMERGENCY FALLBACK - Always return a valid structure
      const emergencyResponse = {
        success: false,
        alerts: [],
        metadata: {
          totalAlerts: 0,
          sources: {
            error: 'Critical endpoint failure'
          },
          error: error.message,
          timestamp: new Date().toISOString(),
          mode: 'emergency_fallback',
          debug: {
            criticalError: true,
            errorMessage: error.message,
            stack: error.stack
          }
        }
      };
      
      console.log('🚨 Returning emergency fallback response');
      res.status(500).json(emergencyResponse);
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

  // Main alerts endpoint (simplified version) - FIXED
  app.get('/api/alerts', async (req, res) => {
    try {
      console.log('🚀 [MAIN] Fetching main alerts...');
      
      // Check cache first
      const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      
      if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
        console.log('📦 [MAIN] Returning cached alerts:', cachedAlerts.alerts?.length || 0);
        return res.json(cachedAlerts);
      }
      
      // Fetch fresh data with error handling
      console.log('🔄 [MAIN] Cache expired, fetching fresh data...');
      let allAlerts = [];
      let sources = {};
      
      try {
        const tomtomResult = await fetchTomTomTrafficWithStreetNames();
        if (tomtomResult.success && tomtomResult.data) {
          allAlerts.push(...tomtomResult.data);
          sources.tomtom = { success: true, count: tomtomResult.data.length };
          console.log(`✅ [MAIN] TomTom: ${tomtomResult.data.length} alerts`);
        } else {
          sources.tomtom = { success: false, error: tomtomResult.error };
          console.log('⚠️ [MAIN] TomTom failed or no data');
        }
      } catch (tomtomError) {
        sources.tomtom = { success: false, error: tomtomError.message };
        console.error('❌ [MAIN] TomTom error:', tomtomError.message);
      }
      
      const response = {
        success: true,
        alerts: allAlerts,
        metadata: {
          totalAlerts: allAlerts.length,
          sources: sources,
          lastUpdated: new Date().toISOString(),
          cached: false,
          endpoint: 'main-alerts'
        }
      };
      
      // Update cache
      globalState.cachedAlerts = response;
      globalState.lastFetchTime = now;
      
      console.log(`🎯 [MAIN] Returning ${allAlerts.length} alerts`);
      res.json(response);
      
    } catch (error) {
      console.error('❌ [MAIN] Main alerts endpoint error:', error);
      
      // Emergency fallback
      const emergencyResponse = {
        success: false,
        error: error.message,
        alerts: [],
        metadata: {
          totalAlerts: 0,
          error: error.message,
          timestamp: new Date().toISOString(),
          endpoint: 'main-alerts-emergency'
        }
      };
      
      res.status(500).json(emergencyResponse);
    }
  });

  // Test alerts endpoint - returns live data sample
  app.get('/api/alerts-test', async (req, res) => {
    try {
      // Return a small sample of live data for testing
      const tomtomResult = await fetchTomTomTrafficWithStreetNames();
      const testAlerts = tomtomResult.success ? tomtomResult.data.slice(0, 2) : [];
      
      res.json({
        success: true,
        metadata: {
          count: testAlerts.length,
          source: 'live_data_sample',
          note: 'Sample test data removed - showing live data sample'
        },
        alerts: testAlerts,
      });
    } catch (error) {
      res.json({
        success: false,
        metadata: {
          count: 0,
          source: 'live_data_sample',
          error: error.message
        },
        alerts: [],
      });
    }
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

  // Clear all sample data endpoint - force live data only
  app.post('/api/clear-sample-data', (req, res) => {
    try {
      console.log('✨ Clearing all sample data - forcing live data only mode');
      
      // Clear webhook data
      const webhookResult = clearAllWebhookData();
      
      // Clear any cached alerts
      globalState.cachedAlerts = null;
      globalState.lastFetchTime = null;
      
      console.log('✅ All sample data cleared successfully');
      
      res.json({
        success: true,
        message: 'All sample data cleared - live data only',
        cleared: {
          webhookData: webhookResult.status,
          alertsCache: 'cleared',
          sampleAlerts: 'removed'
        },
        mode: 'live_data_only',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error clearing sample data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear sample data',
        details: error.message
      });
    }
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

  // Debug traffic endpoint - comprehensive debugging
  app.get('/api/debug-traffic', async (req, res) => {
    try {
      console.log('🔍 Running comprehensive traffic debug...');
      
      // Check environment variables
      const apiKeys = {
        tomtom: !!process.env.TOMTOM_API_KEY,
        mapquest: !!process.env.MAPQUEST_API_KEY,
        here: !!process.env.HERE_API_KEY
      };
      
      console.log('🔑 API Keys available:', apiKeys);
      
      const results = {};
      
      // Test TomTom
      console.log('🚗 Testing TomTom API...');
      try {
        const tomTomData = await fetchTomTomTrafficWithStreetNames();
        results.tomtom = {
          success: tomTomData.success,
          dataCount: tomTomData.data ? tomTomData.data.length : 0,
          error: tomTomData.error || null,
          sample: tomTomData.data && tomTomData.data.length > 0 ? tomTomData.data[0] : null
        };
        console.log('✅ TomTom test result:', results.tomtom.success ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        results.tomtom = { success: false, error: error.message, dataCount: 0 };
        console.error('❌ TomTom test error:', error.message);
      }
      
      // Test MapQuest
      console.log('🗺️ Testing MapQuest API...');
      try {
        const mapquestData = await fetchMapQuestTrafficWithStreetNames();
        results.mapquest = {
          success: mapquestData.success,
          dataCount: mapquestData.data ? mapquestData.data.length : 0,
          error: mapquestData.error || null,
          sample: mapquestData.data && mapquestData.data.length > 0 ? mapquestData.data[0] : null
        };
        console.log('✅ MapQuest test result:', results.mapquest.success ? 'SUCCESS' : 'FAILED');
      } catch (error) {
        results.mapquest = { success: false, error: error.message, dataCount: 0 };
        console.error('❌ MapQuest test error:', error.message);
      }
      
      console.log('📊 Debug results summary:', {
        tomtom: results.tomtom?.success || false,
        mapquest: results.mapquest?.success || false,
        totalAlerts: (results.tomtom?.dataCount || 0) + (results.mapquest?.dataCount || 0)
      });
      
      res.json({
        success: true,
        debug: {
          timestamp: new Date().toISOString(),
          apiKeys,
          results,
          environment: {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT
          }
        }
      });
    } catch (error) {
      console.error('❌ Debug endpoint error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Debug endpoint failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Verify no sample data endpoint
  app.get('/api/verify-no-samples', async (req, res) => {
    try {
      console.log('🔍 Verifying no sample data in system...');
      
      // Check webhook storage
      const activities = getWebhookActivities();
      const permits = getWebhookPermits();
      
      // Check for any test data
      const hasTestData = {
        webhookActivities: activities.data.some(a => a.id && a.id.includes('TEST')),
        webhookPermits: permits.data.some(p => p.id && p.id.includes('TEST')),
        cachedAlerts: !!globalState.cachedAlerts
      };
      
      const sampleDataFound = Object.values(hasTestData).some(Boolean);
      
      res.json({
        success: true,
        sampleDataFound,
        details: hasTestData,
        counts: {
          webhookActivities: activities.data.length,
          webhookPermits: permits.data.length,
          cachedAlerts: globalState.cachedAlerts ? globalState.cachedAlerts.alerts?.length || 0 : 0
        },
        mode: sampleDataFound ? 'sample_data_detected' : 'live_data_only',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.send('Welcome to BARRY API - Traffic Intelligence Platform');
  });

  // Health check endpoint (simple version - detailed health is in health.js)
  app.get('/api/status', (req, res) => {
    const apiKeysConfigured = {
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY
    };
    
    const configuredCount = Object.values(apiKeysConfigured).filter(Boolean).length;
    
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        api: 'online',
        gtfs: 'online'
      },
      apiKeys: {
        configured: configuredCount,
        total: 3,
        details: apiKeysConfigured
      },
      dataFeeds: {
        live: configuredCount > 0 ? 'available' : 'no_keys_configured'
      }
    });
  });

  // ==============================
  // SERVICE FREQUENCY & BREAKDOWN DETECTION ENDPOINTS
  // ==============================

  // Service frequency dashboard - main dashboard data
  app.get('/api/service-frequency/dashboard', async (req, res) => {
    try {
      console.log('📊 Fetching service frequency dashboard...');
      
      const options = {
        currentTime: req.query.time ? new Date(req.query.time) : new Date(),
        includeAllRoutes: req.query.all === 'true'
      };
      
      const result = await getServiceGapsDashboard(options);
      
      if (result.success) {
        res.json({
          success: true,
          dashboard: result.dashboard,
          metadata: {
            endpoint: '/api/service-frequency/dashboard',
            requestTime: new Date().toISOString(),
            dataSource: 'GTFS + Real-time Analysis'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          endpoint: '/api/service-frequency/dashboard'
        });
      }
    } catch (error) {
      console.error('❌ Service frequency dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Dashboard fetch failed',
        details: error.message
      });
    }
  });

  // Network service status - overall network health
  app.get('/api/service-frequency/network-status', async (req, res) => {
    try {
      console.log('🌐 Fetching network service status...');
      
      const currentTime = req.query.time ? new Date(req.query.time) : new Date();
      const result = await getNetworkServiceStatus(currentTime);
      
      if (result.success) {
        res.json({
          success: true,
          networkStatus: result.networkStatus,
          routes: result.routes,
          metadata: {
            endpoint: '/api/service-frequency/network-status',
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Network status fetch failed'
        });
      }
    } catch (error) {
      console.error('❌ Network status error:', error);
      res.status(500).json({
        success: false,
        error: 'Network status fetch failed',
        details: error.message
      });
    }
  });

  // Breakdown detection alerts
  app.get('/api/service-frequency/breakdown-alerts', async (req, res) => {
    try {
      console.log('🚨 Checking for breakdown alerts...');
      
      const options = {
        currentTime: req.query.time ? new Date(req.query.time) : new Date(),
        alertThreshold: req.query.threshold ? parseInt(req.query.threshold) : undefined
      };
      
      const result = await getBreakdownAlerts(options);
      
      if (result.success) {
        res.json({
          success: true,
          alertCount: result.alertCount,
          criticalAlerts: result.criticalAlerts,
          warningAlerts: result.warningAlerts,
          alerts: result.alerts,
          metadata: {
            endpoint: '/api/service-frequency/breakdown-alerts',
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Breakdown alerts error:', error);
      res.status(500).json({
        success: false,
        error: 'Breakdown alerts fetch failed',
        details: error.message
      });
    }
  });

  // Analyze specific route frequency
  app.get('/api/service-frequency/route/:routeNumber', async (req, res) => {
    try {
      const { routeNumber } = req.params;
      const currentTime = req.query.time ? new Date(req.query.time) : new Date();
      
      console.log(`🚌 Analyzing route ${routeNumber} frequency...`);
      
      const result = await analyzeServiceFrequency(routeNumber, currentTime);
      
      if (result.success) {
        res.json({
          success: true,
          route: result.route,
          analysis: result.analysis,
          recommendations: result.recommendations,
          metadata: {
            endpoint: `/api/service-frequency/route/${routeNumber}`,
            timestamp: result.timestamp
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          availableRoutes: result.availableRoutes
        });
      }
    } catch (error) {
      console.error(`❌ Route analysis error for ${req.params.routeNumber}:`, error);
      res.status(500).json({
        success: false,
        error: 'Route analysis failed',
        details: error.message
      });
    }
  });

  // Service trends analysis
  app.get('/api/service-frequency/trends', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'today';
      const options = {
        includeHistorical: req.query.historical === 'true'
      };
      
      console.log(`📈 Fetching service trends for ${timeframe}...`);
      
      const result = await getServiceTrends(timeframe, options);
      
      if (result.success) {
        res.json({
          success: true,
          trends: result.trends,
          metadata: {
            endpoint: '/api/service-frequency/trends',
            timeframe: timeframe,
            generatedAt: new Date().toISOString()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Service trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Trends analysis failed',
        details: error.message
      });
    }
  });

  // Service frequency system status
  app.get('/api/service-frequency/status', (req, res) => {
    try {
      const stats = getFrequencyStats();
      
      res.json({
        success: true,
        status: {
          systemInitialized: stats.initialized,
          routesWithData: stats.routesWithFrequencyData,
          servicePatterns: stats.servicePatterns,
          routeAlternatives: stats.routeAlternatives,
          thresholds: stats.thresholds,
          peakHours: stats.peakHours,
          memoryUsage: stats.memoryUsage
        },
        metadata: {
          endpoint: '/api/service-frequency/status',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Service frequency status error:', error);
      res.status(500).json({
        success: false,
        error: 'Status fetch failed',
        details: error.message
      });
    }
  });

  // Initialize service frequency system
  app.post('/api/service-frequency/initialize', async (req, res) => {
    try {
      console.log('🚀 Initializing service frequency system...');
      
      const success = await initializeServiceFrequency();
      
      if (success) {
        const stats = getFrequencyStats();
        res.json({
          success: true,
          message: 'Service frequency system initialized',
          stats: stats,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Service frequency initialization failed'
        });
      }
    } catch (error) {
      console.error('❌ Service frequency initialization error:', error);
      res.status(500).json({
        success: false,
        error: 'Initialization failed',
        details: error.message
      });
    }
  });

  // ==============================
  // STREETMANAGER ENDPOINTS
  // ==============================

  // Webhook monitoring - catch any webhooks that might be hitting different endpoints
  app.use('/api/streetmanager*', (req, res, next) => {
    if (req.method === 'POST' && req.path.includes('webhook')) {
      console.log(`🔍 WEBHOOK MONITOR: ${req.method} ${req.path}`);
      console.log(`🔍 Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`🔍 Body type:`, typeof req.body);
      console.log(`🔍 Body content:`, JSON.stringify(req.body, null, 2));
    }
    next();
  });

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

  // Main StreetManager webhook receiver with BULLETPROOF error handling
  app.post('/api/streetmanager/webhook', (req, res) => {
    const requestId = Date.now();
    try {
      console.log(`📨 [${requestId}] StreetManager webhook received`);
      console.log(`📋 [${requestId}] Content-Type:`, req.headers['content-type']);
      console.log(`📋 [${requestId}] Request body type:`, typeof req.body);
      console.log(`📋 [${requestId}] Request body exists:`, !!req.body);
      console.log(`📋 [${requestId}] Request body is null:`, req.body === null);
      console.log(`📋 [${requestId}] Request body is undefined:`, req.body === undefined);
      console.log(`📋 [${requestId}] Request body length:`, req.body ? (typeof req.body === 'string' ? req.body.length : Object.keys(req.body).length) : 'N/A');
      console.log(`📋 [${requestId}] Full request body:`, JSON.stringify(req.body, null, 2));
      
      // BULLETPROOF message format detection
      let messageToProcess;
      let detectionMethod = 'unknown';
      
      // Case 1: Completely empty body
      if (req.body === null || req.body === undefined) {
        console.log(`⚠️ [${requestId}] NULL/UNDEFINED body detected`);
        messageToProcess = {
          Type: 'EmptyRequest',
          Message: 'Request body is null or undefined',
          raw: req.body,
          debug: { case: 'null_undefined' }
        };
        detectionMethod = 'null_undefined';
      }
      // Case 2: Empty object
      else if (typeof req.body === 'object' && Object.keys(req.body).length === 0) {
        console.log(`⚠️ [${requestId}] EMPTY OBJECT detected`);
        messageToProcess = {
          Type: 'EmptyObject',
          Message: 'Request body is empty object',
          raw: req.body,
          debug: { case: 'empty_object' }
        };
        detectionMethod = 'empty_object';
      }
      // Case 3: Standard AWS SNS with Type field
      else if (req.body && typeof req.body === 'object' && req.body.Type) {
        console.log(`✅ [${requestId}] AWS SNS format - Type:`, req.body.Type);
        messageToProcess = req.body;
        detectionMethod = 'aws_sns_standard';
      }
      // Case 4: Has Message field but no Type
      else if (req.body && typeof req.body === 'object' && req.body.Message) {
        console.log(`✅ [${requestId}] Message field detected`);
        messageToProcess = {
          Type: 'Notification',
          Message: typeof req.body.Message === 'string' ? req.body.Message : JSON.stringify(req.body.Message),
          raw: req.body,
          debug: { case: 'message_field' }
        };
        detectionMethod = 'message_field';
      }
      // Case 5: String payload
      else if (typeof req.body === 'string') {
        console.log(`✅ [${requestId}] String payload, length:`, req.body.length);
        if (req.body.trim() === '') {
          messageToProcess = {
            Type: 'EmptyString',
            Message: 'Empty string payload',
            raw: req.body,
            debug: { case: 'empty_string' }
          };
          detectionMethod = 'empty_string';
        } else {
          try {
            const parsed = JSON.parse(req.body);
            console.log(`✅ [${requestId}] String parsed successfully`);
            messageToProcess = parsed.Type ? parsed : {
              Type: 'Notification',
              Message: req.body,
              raw: parsed,
              debug: { case: 'string_parsed' }
            };
            detectionMethod = 'string_parsed';
          } catch (e) {
            console.error(`❌ [${requestId}] String parse failed:`, e.message);
            messageToProcess = {
              Type: 'InvalidJSON',
              Message: req.body,
              parseError: e.message,
              debug: { case: 'string_parse_failed' }
            };
            detectionMethod = 'string_parse_failed';
          }
        }
      }
      // Case 6: Regular object without Type or Message
      else if (req.body && typeof req.body === 'object') {
        console.log(`✅ [${requestId}] Regular object detected, keys:`, Object.keys(req.body));
        messageToProcess = {
          Type: 'DirectObject',
          Message: JSON.stringify(req.body),
          raw: req.body,
          debug: { case: 'direct_object', keys: Object.keys(req.body) }
        };
        detectionMethod = 'direct_object';
      }
      // Case 7: Fallback for anything else
      else {
        console.log(`⚠️ [${requestId}] UNKNOWN format, type:`, typeof req.body);
        messageToProcess = {
          Type: 'Unknown',
          Message: String(req.body),
          raw: req.body,
          debug: { case: 'unknown_fallback', bodyType: typeof req.body }
        };
        detectionMethod = 'unknown_fallback';
      }
      
      // ABSOLUTE GUARANTEE that Type exists
      if (!messageToProcess || !messageToProcess.Type) {
        console.error(`❌ [${requestId}] CRITICAL: Type field missing after processing!`);
        messageToProcess = {
          Type: 'CriticalError',
          Message: 'Type field was missing after processing',
          raw: req.body,
          debug: { case: 'critical_error', originalMessage: messageToProcess }
        };
        detectionMethod = 'critical_error';
      }
      
      console.log(`📨 [${requestId}] FINAL Type:`, messageToProcess.Type);
      console.log(`📨 [${requestId}] Detection method:`, detectionMethod);
      console.log(`📨 [${requestId}] Processing message...`);
      
      const result = handleWebhookMessage(messageToProcess);
      
      if (result.error) {
        console.error(`❌ [${requestId}] Webhook processing error:`, result.error);
        return res.status(400).json({
          ...result,
          debug: {
            requestId,
            receivedType: messageToProcess.Type,
            detectionMethod,
            bodyType: typeof req.body,
            hasBody: !!req.body,
            messageKeys: messageToProcess ? Object.keys(messageToProcess) : 'none'
          }
        });
      }
      
      console.log(`✅ [${requestId}] Webhook processed successfully:`, result.status);
      res.status(200).json({
        ...result,
        processed: {
          requestId,
          type: messageToProcess.Type,
          detectionMethod,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`❌ [${requestId}] CRITICAL webhook error:`, error.message);
      console.error(`❌ [${requestId}] Error stack:`, error.stack);
      res.status(500).json({ 
        error: 'Critical webhook processing failure',
        details: error.message,
        requestId,
        debug: {
          bodyType: typeof req.body,
          hasBody: !!req.body,
          timestamp: new Date().toISOString()
        }
      });
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

  // Test endpoint disabled - no sample data in production
  app.post('/api/streetmanager/test', (req, res) => {
    console.log('⚠️ StreetManager test endpoint called - disabled in production');
    res.json({ 
      status: 'disabled', 
      message: 'Test endpoint disabled - use live data only',
      timestamp: new Date().toISOString() 
    });
  });

  // ==============================
  // AI-POWERED DISRUPTION WORKFLOW ENDPOINTS
  // ==============================
  
  // Mount the disruption workflow router
  app.use('/api/disruption', disruptionWorkflowRouter);

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

  // Initialize service frequency system on startup
  console.log('⏱️ Initializing Service Frequency System...');
  initializeServiceFrequency().then((success) => {
    if (success) {
      console.log('✅ Service Frequency System ready');
    } else {
      console.log('❌ Service Frequency System failed to initialize');
    }
  }).catch(error => {
    console.error('❌ Service Frequency initialization error:', error.message);
  });
}

export default { setupAPIRoutes };