// routes/api-improved.js
// IMPROVED API route handlers for BARRY with better logging and reduced filtering

// Import all the services and utilities
import { fetchTomTomTrafficWithStreetNames } from "../services/tomtom.js";
import { fetchMapQuestTrafficWithStreetNames } from "../services/mapquest.js";
import { fetchHERETrafficWithStreetNames } from "../services/here.js";
import { fetchNationalHighways } from "../services/nationalHighways.js";
import { fetchSCOOTTrafficData } from "../services/scoot.js";

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

// IMPROVED sample data filter - much less aggressive
function improvedSampleDataFilter(alerts) {
  if (!Array.isArray(alerts)) return [];
  
  console.log(`🔍 [IMPROVED] Starting filter with ${alerts.length} alerts`);
  
  const filtered = alerts.filter(alert => {
    if (!alert || typeof alert !== 'object') return false;
    
    // Only filter out obvious test/sample data - be much more permissive
    const id = (alert.id || '').toString().toLowerCase();
    const source = (alert.source || '').toString().toLowerCase();
    const title = (alert.title || '').toString().toLowerCase();
    
    // ONLY filter these obvious test patterns
    const isObviousTestData = (
      id.includes('test_data') ||
      id.includes('sample_test') ||
      id.includes('demo_') ||
      title.includes('test alert') ||
      title.includes('sample alert') ||
      title.includes('demo alert') ||
      source === 'test_system'
    );
    
    if (isObviousTestData) {
      console.log(`🗑️ [IMPROVED] Filtered obvious test alert: ${id}`);
      return false;
    }
    
    // Keep everything else, including:
    // - alerts with 'enhanced' properties
    // - alerts with 'barry' in the ID
    // - alerts from legitimate sources
    return true;
  });
  
  console.log(`✅ [IMPROVED] Filter result: ${alerts.length} → ${filtered.length} (kept ${filtered.length}, removed ${alerts.length - filtered.length})`);
  return filtered;
}

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

  // IMPROVED Enhanced alerts endpoint with detailed logging and reduced filtering
  app.get('/api/alerts-enhanced', async (req, res) => {
    const requestId = Date.now();
    try {
      console.log(`🚀 [IMPROVED-${requestId}] Starting enhanced alerts fetch with detailed logging...`);
      
      let allAlerts = [];
      const sources = {};
      const apiCallResults = {};
      
      // 1. Test TomTom API with detailed logging
      console.log(`🚗 [IMPROVED-${requestId}] Testing TomTom API...`);
      console.log(`🔑 [IMPROVED-${requestId}] TomTom API Key configured: ${process.env.TOMTOM_API_KEY ? 'YES' : 'NO'}`);
      try {
        const startTime = Date.now();
        const tomtomResult = await fetchTomTomTrafficWithStreetNames();
        const duration = Date.now() - startTime;
        
        apiCallResults.tomtom = {
          duration: `${duration}ms`,
          success: tomtomResult.success,
          dataReturned: tomtomResult.data ? tomtomResult.data.length : 0,
          error: tomtomResult.error || null,
          rawResponse: tomtomResult
        };
        
        console.log(`📊 [IMPROVED-${requestId}] TomTom Result:`, {
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
            method: 'Enhanced with GTFS (Live Data)',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`✅ [IMPROVED-${requestId}] TomTom: ${tomtomResult.data.length} alerts fetched successfully`);
          
          // Log sample alert
          if (tomtomResult.data.length > 0) {
            console.log(`📝 [IMPROVED-${requestId}] TomTom Sample Alert:`, JSON.stringify(tomtomResult.data[0], null, 2));
          }
        } else {
          sources.tomtom = {
            success: false,
            count: 0,
            error: tomtomResult.error || 'No data returned',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`⚠️ [IMPROVED-${requestId}] TomTom: No alerts returned`);
          console.log(`🔍 [IMPROVED-${requestId}] TomTom Full Response:`, JSON.stringify(tomtomResult, null, 2));
        }
      } catch (tomtomError) {
        console.error(`❌ [IMPROVED-${requestId}] TomTom fetch failed:`, tomtomError.message);
        console.error(`❌ [IMPROVED-${requestId}] TomTom Error Stack:`, tomtomError.stack);
        sources.tomtom = {
          success: false,
          count: 0,
          error: tomtomError.message,
          mode: 'live'
        };
        apiCallResults.tomtom = {
          success: false,
          error: tomtomError.message,
          stack: tomtomError.stack
        };
      }
      
      // 2. Test HERE API with detailed logging
      console.log(`🗺️ [IMPROVED-${requestId}] Testing HERE API...`);
      console.log(`🔑 [IMPROVED-${requestId}] HERE API Key configured: ${process.env.HERE_API_KEY ? 'YES' : 'NO'}`);
      try {
        const startTime = Date.now();
        const hereResult = await fetchHERETrafficWithStreetNames();
        const duration = Date.now() - startTime;
        
        apiCallResults.here = {
          duration: `${duration}ms`,
          success: hereResult.success,
          dataReturned: hereResult.data ? hereResult.data.length : 0,
          error: hereResult.error || null,
          rawResponse: hereResult
        };
        
        console.log(`📊 [IMPROVED-${requestId}] HERE Result:`, {
          success: hereResult.success,
          dataCount: hereResult.data ? hereResult.data.length : 0,
          error: hereResult.error,
          duration: `${duration}ms`
        });
        
        if (hereResult.success && hereResult.data && hereResult.data.length > 0) {
          allAlerts.push(...hereResult.data);
          sources.here = {
            success: true,
            count: hereResult.data.length,
            method: 'Enhanced with GTFS (Live Data)',
            coverage: hereResult.coverage,
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`✅ [IMPROVED-${requestId}] HERE: ${hereResult.data.length} alerts fetched successfully`);
          
          // Log sample alert
          if (hereResult.data.length > 0) {
            console.log(`📝 [IMPROVED-${requestId}] HERE Sample Alert:`, JSON.stringify(hereResult.data[0], null, 2));
          }
        } else {
          sources.here = {
            success: false,
            count: 0,
            error: hereResult.error || 'No data returned',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`⚠️ [IMPROVED-${requestId}] HERE: No alerts returned`);
          console.log(`🔍 [IMPROVED-${requestId}] HERE Full Response:`, JSON.stringify(hereResult, null, 2));
        }
      } catch (hereError) {
        console.error(`❌ [IMPROVED-${requestId}] HERE fetch failed:`, hereError.message);
        console.error(`❌ [IMPROVED-${requestId}] HERE Error Stack:`, hereError.stack);
        sources.here = {
          success: false,
          count: 0,
          error: hereError.message,
          mode: 'live'
        };
        apiCallResults.here = {
          success: false,
          error: hereError.message,
          stack: hereError.stack
        };
      }
      
      // 3. Test MapQuest API with detailed logging
      console.log(`🗺️ [IMPROVED-${requestId}] Testing MapQuest API...`);
      console.log(`🔑 [IMPROVED-${requestId}] MapQuest API Key configured: ${process.env.MAPQUEST_API_KEY ? 'YES' : 'NO'}`);
      try {
        const startTime = Date.now();
        const mapquestResult = await fetchMapQuestTrafficWithStreetNames();
        const duration = Date.now() - startTime;
        
        apiCallResults.mapquest = {
          duration: `${duration}ms`,
          success: mapquestResult.success,
          dataReturned: mapquestResult.data ? mapquestResult.data.length : 0,
          error: mapquestResult.error || null,
          rawResponse: mapquestResult
        };
        
        console.log(`📊 [IMPROVED-${requestId}] MapQuest Result:`, {
          success: mapquestResult.success,
          dataCount: mapquestResult.data ? mapquestResult.data.length : 0,
          error: mapquestResult.error,
          duration: `${duration}ms`
        });
        
        if (mapquestResult.success && mapquestResult.data && mapquestResult.data.length > 0) {
          allAlerts.push(...mapquestResult.data);
          sources.mapquest = {
            success: true,
            count: mapquestResult.data.length,
            method: 'Enhanced with Location Processing (Live Data)',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`✅ [IMPROVED-${requestId}] MapQuest: ${mapquestResult.data.length} alerts fetched successfully`);
          
          // Log sample alert
          if (mapquestResult.data.length > 0) {
            console.log(`📝 [IMPROVED-${requestId}] MapQuest Sample Alert:`, JSON.stringify(mapquestResult.data[0], null, 2));
          }
        } else {
          sources.mapquest = {
            success: false,
            count: 0,
            error: mapquestResult.error || 'No data returned',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`⚠️ [IMPROVED-${requestId}] MapQuest: No alerts returned or auth issue`);
          console.log(`🔍 [IMPROVED-${requestId}] MapQuest Full Response:`, JSON.stringify(mapquestResult, null, 2));
        }
      } catch (mapquestError) {
        console.error(`❌ [IMPROVED-${requestId}] MapQuest fetch failed:`, mapquestError.message);
        console.error(`❌ [IMPROVED-${requestId}] MapQuest Error Stack:`, mapquestError.stack);
        sources.mapquest = {
          success: false,
          count: 0,
          error: mapquestError.message,
          mode: 'live'
        };
        apiCallResults.mapquest = {
          success: false,
          error: mapquestError.message,
          stack: mapquestError.stack
        };
      }
      
      console.log(`📊 [IMPROVED-${requestId}] Raw alerts collected: ${allAlerts.length}`);
      console.log(`📋 [IMPROVED-${requestId}] All alerts summary:`, allAlerts.map(alert => ({ 
        id: alert.id, 
        source: alert.source, 
        title: alert.title?.substring(0, 50) 
      })));
      
      // IMPROVED filtering - much less aggressive
      console.log(`🔍 [IMPROVED-${requestId}] Applying improved sample data filter...`);
      const filteredAlerts = improvedSampleDataFilter(allAlerts);
      console.log(`✅ [IMPROVED-${requestId}] Filter result: ${allAlerts.length} → ${filteredAlerts.length} alerts (kept ${filteredAlerts.length}, removed ${allAlerts.length - filteredAlerts.length})`);
      
      // Enhanced processing with error handling
      let enhancedAlerts = [];
      if (filteredAlerts.length > 0) {
        try {
          console.log(`🔄 [IMPROVED-${requestId}] Processing alerts with enhanced algorithms...`);
          enhancedAlerts = await processEnhancedAlerts(filteredAlerts);
          console.log(`✅ [IMPROVED-${requestId}] Enhanced processing complete: ${enhancedAlerts.length} alerts`);
        } catch (enhancementError) {
          console.error(`❌ [IMPROVED-${requestId}] Enhanced processing failed:`, enhancementError.message);
          console.log(`🔄 [IMPROVED-${requestId}] Falling back to filtered alerts...`);
          enhancedAlerts = filteredAlerts; // Fallback to filtered alerts if enhancement fails
        }
      } else {
        console.log(`ℹ️ [IMPROVED-${requestId}] No alerts to process after filtering`);
      }
      
      // Generate comprehensive statistics
      const stats = {
        totalAlerts: enhancedAlerts.length,
        activeAlerts: enhancedAlerts.filter(a => a.status === 'red').length,
        enhancedAlerts: enhancedAlerts.filter(a => a.locationAccuracy === 'high').length,
        alertsWithRoutes: enhancedAlerts.filter(a => a.affectsRoutes && a.affectsRoutes.length > 0).length,
        averageRoutesPerAlert: enhancedAlerts.length > 0 ?
          (enhancedAlerts.reduce((sum, a) => sum + (a.affectsRoutes?.length || 0), 0) / enhancedAlerts.length).toFixed(1) : 0
      };
      
      // Comprehensive response metadata
      const responseMetadata = {
        requestId,
        totalAlerts: enhancedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'GTFS location accuracy enabled',
        mode: 'improved_logging_reduced_filtering',
        filtering: {
          beforeFilter: allAlerts.length,
          afterFilter: filteredAlerts.length,
          afterEnhancement: enhancedAlerts.length,
          filterMethod: 'improved_less_aggressive'
        },
        apiCallResults,
        debug: {
          rawAlertsCollected: allAlerts.length,
          filteredAlerts: filteredAlerts.length,
          sampleAlertsRemoved: allAlerts.length - filteredAlerts.length,
          enhancedAlertsReturned: enhancedAlerts.length,
          sourcesWorking: Object.values(sources).filter(s => s.success).length,
          sourcesAttempted: Object.keys(sources).length,
          timestamp: new Date().toISOString(),
          processingDuration: `${Date.now() - requestId}ms`
        }
      };
      
      const response = {
        success: true,
        alerts: enhancedAlerts,
        metadata: responseMetadata
      };
      
      console.log(`🎯 [IMPROVED-${requestId}] FINAL RESULT: Returning ${enhancedAlerts.length} alerts to frontend`);
      console.log(`📊 [IMPROVED-${requestId}] Sources working: ${Object.values(sources).filter(s => s.success).length}/${Object.keys(sources).length}`);
      console.log(`⏱️ [IMPROVED-${requestId}] Total processing time: ${Date.now() - requestId}ms`);
      
      res.json(response);
      
    } catch (error) {
      console.error(`❌ [IMPROVED-${requestId}] CRITICAL enhanced alerts endpoint error:`, error);
      console.error(`❌ [IMPROVED-${requestId}] Error stack:`, error.stack);
      
      // Emergency fallback with detailed error info
      const emergencyResponse = {
        success: false,
        alerts: [],
        metadata: {
          requestId,
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
            errorStack: error.stack,
            processingDuration: `${Date.now() - requestId}ms`
          }
        }
      };
      
      console.log(`🚨 [IMPROVED-${requestId}] Returning emergency fallback response`);
      res.status(500).json(emergencyResponse);
    }
  });

  // Improved main alerts endpoint
  app.get('/api/alerts', async (req, res) => {
    const requestId = Date.now();
    try {
      console.log(`🚀 [IMPROVED-MAIN-${requestId}] Fetching main alerts with detailed logging...`);
      
      // Check cache with improved logging
      const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      
      if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
        const cacheAge = Math.round((now - lastFetchTime) / 1000);
        console.log(`📦 [IMPROVED-MAIN-${requestId}] Returning cached alerts (${cachedAlerts.alerts?.length || 0} alerts, ${cacheAge}s old)`);
        return res.json(cachedAlerts);
      }
      
      // Fetch fresh data with comprehensive error handling
      console.log(`🔄 [IMPROVED-MAIN-${requestId}] Cache expired/missing, fetching fresh data...`);
      let allAlerts = [];
      let sources = {};
      
      // Test TomTom with improved logging
      try {
        console.log(`🚗 [IMPROVED-MAIN-${requestId}] Testing TomTom API...`);
        const startTime = Date.now();
        const tomtomResult = await fetchTomTomTrafficWithStreetNames();
        const duration = Date.now() - startTime;
        
        console.log(`📊 [IMPROVED-MAIN-${requestId}] TomTom result: success=${tomtomResult.success}, data=${tomtomResult.data?.length || 0}, duration=${duration}ms`);
        
        if (tomtomResult.success && tomtomResult.data) {
          allAlerts.push(...tomtomResult.data);
          sources.tomtom = { 
            success: true, 
            count: tomtomResult.data.length,
            duration: `${duration}ms`
          };
          console.log(`✅ [IMPROVED-MAIN-${requestId}] TomTom: ${tomtomResult.data.length} alerts fetched`);
        } else {
          sources.tomtom = { 
            success: false, 
            error: tomtomResult.error,
            duration: `${duration}ms`
          };
          console.log(`⚠️ [IMPROVED-MAIN-${requestId}] TomTom failed: ${tomtomResult.error}`);
        }
      } catch (tomtomError) {
        sources.tomtom = { success: false, error: tomtomError.message };
        console.error(`❌ [IMPROVED-MAIN-${requestId}] TomTom error:`, tomtomError.message);
      }
      
      // Apply improved filtering
      const filteredAlerts = improvedSampleDataFilter(allAlerts);
      
      const response = {
        success: true,
        alerts: filteredAlerts,
        metadata: {
          requestId,
          totalAlerts: filteredAlerts.length,
          sources: sources,
          lastUpdated: new Date().toISOString(),
          cached: false,
          endpoint: 'improved-main-alerts',
          filtering: {
            beforeFilter: allAlerts.length,
            afterFilter: filteredAlerts.length,
            filterMethod: 'improved_less_aggressive'
          },
          debug: {
            processingDuration: `${Date.now() - requestId}ms`
          }
        }
      };
      
      // Update cache
      globalState.cachedAlerts = response;
      globalState.lastFetchTime = now;
      
      console.log(`🎯 [IMPROVED-MAIN-${requestId}] Returning ${filteredAlerts.length} alerts (${allAlerts.length} before filtering)`);
      res.json(response);
      
    } catch (error) {
      console.error(`❌ [IMPROVED-MAIN-${requestId}] Main alerts endpoint error:`, error);
      
      // Emergency fallback
      const emergencyResponse = {
        success: false,
        error: error.message,
        alerts: [],
        metadata: {
          requestId,
          totalAlerts: 0,
          error: error.message,
          timestamp: new Date().toISOString(),
          endpoint: 'improved-main-alerts-emergency',
          debug: {
            errorStack: error.stack,
            processingDuration: `${Date.now() - requestId}ms`
          }
        }
      };
      
      res.status(500).json(emergencyResponse);
    }
  });

  // Improved debug endpoint with comprehensive API testing
  app.get('/api/debug-traffic-improved', async (req, res) => {
    const requestId = Date.now();
    try {
      console.log(`🔍 [DEBUG-${requestId}] Running comprehensive improved traffic debug...`);
      
      // Check environment variables
      const apiKeys = {
        tomtom: !!process.env.TOMTOM_API_KEY,
        mapquest: !!process.env.MAPQUEST_API_KEY,
        here: !!process.env.HERE_API_KEY,
        nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY
      };
      
      console.log(`🔑 [DEBUG-${requestId}] API Keys available:`, apiKeys);
      
      const results = {};
      const testStartTime = Date.now();
      
      // Test each API individually with detailed logging
      const apis = [
        { name: 'tomtom', func: fetchTomTomTrafficWithStreetNames },
        { name: 'mapquest', func: fetchMapQuestTrafficWithStreetNames },
        { name: 'here', func: fetchHERETrafficWithStreetNames }
      ];
      
      for (const api of apis) {
        console.log(`🧪 [DEBUG-${requestId}] Testing ${api.name.toUpperCase()} API...`);
        try {
          const startTime = Date.now();
          const result = await api.func();
          const duration = Date.now() - startTime;
          
          results[api.name] = {
            success: result.success,
            dataCount: result.data ? result.data.length : 0,
            error: result.error || null,
            duration: `${duration}ms`,
            sampleData: result.data && result.data.length > 0 ? {
              firstAlert: result.data[0],
              dataStructure: Object.keys(result.data[0] || {})
            } : null,
            fullResponse: result
          };
          
          console.log(`✅ [DEBUG-${requestId}] ${api.name.toUpperCase()} test result: ${result.success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`);
          if (result.data && result.data.length > 0) {
            console.log(`📝 [DEBUG-${requestId}] ${api.name.toUpperCase()} returned ${result.data.length} alerts`);
          }
        } catch (error) {
          results[api.name] = { 
            success: false, 
            error: error.message, 
            dataCount: 0,
            duration: 'failed',
            errorStack: error.stack
          };
          console.error(`❌ [DEBUG-${requestId}] ${api.name.toUpperCase()} test error:`, error.message);
        }
      }
      
      const totalDuration = Date.now() - testStartTime;
      
      console.log(`📊 [DEBUG-${requestId}] Debug results summary:`, {
        apis: Object.keys(results).map(api => ({
          name: api,
          success: results[api]?.success || false,
          dataCount: results[api]?.dataCount || 0
        })),
        totalAlerts: Object.values(results).reduce((sum, r) => sum + (r.dataCount || 0), 0),
        totalDuration: `${totalDuration}ms`
      });
      
      res.json({
        success: true,
        debug: {
          requestId,
          timestamp: new Date().toISOString(),
          apiKeys,
          results,
          summary: {
            totalApisCalled: apis.length,
            successfulApis: Object.values(results).filter(r => r.success).length,
            totalAlerts: Object.values(results).reduce((sum, r) => sum + (r.dataCount || 0), 0),
            totalTestDuration: `${totalDuration}ms`
          },
          environment: {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error(`❌ [DEBUG-${requestId}] Debug endpoint error:`, error);
      res.status(500).json({ 
        success: false,
        error: 'Debug endpoint failed', 
        details: error.message,
        requestId,
        timestamp: new Date().toISOString(),
        stack: error.stack
      });
    }
  });

  // Import existing endpoints (keep all the other functionality)
  // ... (include all the other endpoints from the original file)
  
  console.log('✅ Improved API routes with enhanced logging and reduced filtering loaded');
}

export default { setupAPIRoutes };