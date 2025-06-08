// routes/api-memory-optimized.js
// Memory-optimized API routes with request throttling and route matching fixes

import { fetchTomTomTrafficWithStreetNames } from "../services/tomtom-fixed.js";

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
  
  // Process alerts in small batches to avoid memory spikes
  const batchSize = 5;
  const processed = [];
  
  for (let i = 0; i < alerts.length; i += batchSize) {
    const batch = alerts.slice(i, i + batchSize);
    
    for (const alert of batch) {
      try {
        // Ensure alert has required fields
        if (!alert.affectsRoutes || alert.affectsRoutes.length === 0) {
          // Try to match routes if coordinates available
          if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
            const [lat, lng] = alert.coordinates;
            alert.affectsRoutes = findRoutesNearCoordinatesSimple(lat, lng);
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
        // Still include the alert, just without enhancements
        processed.push(alert);
      }
    }
    
    // Small delay between batches to prevent memory spikes
    if (i + batchSize < alerts.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return processed;
}

// Simple route matching for post-processing
function findRoutesNearCoordinatesSimple(lat, lng) {
  const regions = [
    {
      bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 },
      routes: ['Q3', '10', '21', '22', '27', '28']
    },
    {
      bounds: { north: 54.97, south: 54.93, east: -1.6, west: -1.7 },
      routes: ['10', '27', '28', 'Q3', '53', '54']
    },
    {
      bounds: { north: 55.05, south: 55.0, east: -1.4, west: -1.5 },
      routes: ['1', '2', '307', '309', '317']
    },
    {
      bounds: { north: 54.93, south: 54.88, east: -1.35, west: -1.42 },
      routes: ['16', '20', '24', '35', '36', '56', '61', '62']
    }
  ];

  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      return region.routes;
    }
  }

  return ['21', '22', '10']; // Default routes
}

// Request throttling
let activeApiRequests = 0;
const MAX_API_REQUESTS = 2;

function checkApiThrottle() {
  return activeApiRequests < MAX_API_REQUESTS;
}

// Setup optimized API routes
export function setupAPIRoutes(app, globalState) {
  const { 
    acknowledgedAlerts, 
    alertNotes, 
    GTFS_ROUTES,
    ACK_FILE,
    NOTES_FILE,
    findRoutesNearCoordinatesOptimized
  } = globalState;

  // Memory-optimized alerts endpoint
  app.get('/api/alerts-enhanced', async (req, res) => {
    const requestId = Date.now();
    
    // Check throttling
    if (!checkApiThrottle()) {
      return res.status(429).json({
        success: false,
        error: 'Too many concurrent API requests',
        activeRequests: activeApiRequests,
        maxAllowed: MAX_API_REQUESTS
      });
    }
    
    activeApiRequests++;
    
    try {
      console.log(`🚀 [IMPROVED-${requestId}] Starting enhanced alerts fetch with detailed logging...`);
      
      let allAlerts = [];
      const sources = {};
      
      // Only fetch TomTom to start with (memory optimization)
      console.log(`🚗 [IMPROVED-${requestId}] Testing TomTom API...`);
      console.log(`🔑 [IMPROVED-${requestId}] TomTom API Key configured: ${process.env.TOMTOM_API_KEY ? 'YES' : 'NO'}`);
      
      try {
        const startTime = Date.now();
        const tomtomResult = await fetchTomTomTrafficWithStreetNames();
        const duration = Date.now() - startTime;
        
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
            method: 'Fixed Route Matching',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`✅ [IMPROVED-${requestId}] TomTom: ${tomtomResult.data.length} alerts fetched successfully`);
        } else {
          sources.tomtom = {
            success: false,
            count: 0,
            error: tomtomResult.error || 'No data returned',
            mode: 'live',
            duration: `${duration}ms`
          };
          console.log(`⚠️ [IMPROVED-${requestId}] TomTom: No alerts returned`);
        }
      } catch (tomtomError) {
        console.error(`❌ [IMPROVED-${requestId}] TomTom fetch failed:`, tomtomError.message);
        sources.tomtom = {
          success: false,
          count: 0,
          error: tomtomError.message,
          mode: 'live'
        };
      }
      
      console.log(`📊 [IMPROVED-${requestId}] Raw alerts collected: ${allAlerts.length}`);
      
      // Optimized filtering
      console.log(`🔍 [IMPROVED-${requestId}] Applying optimized sample data filter...`);
      const filteredAlerts = optimizedSampleDataFilter(allAlerts);
      console.log(`✅ [IMPROVED-${requestId}] Filter result: ${allAlerts.length} → ${filteredAlerts.length} alerts`);
      
      // Memory-optimized processing
      let enhancedAlerts = [];
      if (filteredAlerts.length > 0) {
        try {
          console.log(`🔄 [IMPROVED-${requestId}] Processing alerts with memory optimization...`);
          enhancedAlerts = await processAlertsOptimized(filteredAlerts);
          console.log(`✅ [IMPROVED-${requestId}] Optimized processing complete: ${enhancedAlerts.length} alerts`);
        } catch (enhancementError) {
          console.error(`❌ [IMPROVED-${requestId}] Processing failed:`, enhancementError.message);
          enhancedAlerts = filteredAlerts; // Fallback
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
      
      const responseMetadata = {
        requestId,
        totalAlerts: enhancedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        enhancement: 'Memory-optimized with fixed route matching',
        mode: 'memory_optimized',
        filtering: {
          beforeFilter: allAlerts.length,
          afterFilter: filteredAlerts.length,
          afterEnhancement: enhancedAlerts.length,
          filterMethod: 'optimized'
        },
        debug: {
          processingDuration: `${Date.now() - requestId}ms`,
          memoryOptimized: true,
          requestThrottled: false
        }
      };
      
      const response = {
        success: true,
        alerts: enhancedAlerts,
        metadata: responseMetadata
      };
      
      console.log(`🎯 [IMPROVED-${requestId}] FINAL RESULT: Returning ${enhancedAlerts.length} alerts to frontend`);
      console.log(`📊 [IMPROVED-${requestId}] Alerts with routes: ${stats.alertsWithRoutes}/${enhancedAlerts.length}`);
      console.log(`⏱️ [IMPROVED-${requestId}] Total processing time: ${Date.now() - requestId}ms`);
      
      res.json(response);
      
    } catch (error) {
      console.error(`❌ [IMPROVED-${requestId}] Critical error:`, error);
      
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
    } finally {
      activeApiRequests--;
      
      // Trigger garbage collection if available
      if (global.gc && activeApiRequests === 0) {
        setTimeout(() => {
          if (global.gc) {
            global.gc();
            console.log('♻️ Garbage collection triggered after API request');
          }
        }, 1000);
      }
    }
  });

  // Simplified main alerts endpoint
  app.get('/api/alerts', async (req, res) => {
    const requestId = Date.now();
    
    if (!checkApiThrottle()) {
      return res.status(429).json({
        success: false,
        error: 'Too many concurrent requests'
      });
    }
    
    activeApiRequests++;
    
    try {
      console.log(`🚀 [MAIN-${requestId}] Fetching simplified alerts...`);
      
      // Check cache first
      const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      
      if (globalState.cachedAlerts && globalState.lastFetchTime && 
          (now - globalState.lastFetchTime) < CACHE_TIMEOUT) {
        const cacheAge = Math.round((now - globalState.lastFetchTime) / 1000);
        console.log(`📦 [MAIN-${requestId}] Returning cached alerts (${cacheAge}s old)`);
        return res.json(globalState.cachedAlerts);
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
          endpoint: 'simplified-main-alerts'
        }
      };
      
      // Update cache
      globalState.cachedAlerts = response;
      globalState.lastFetchTime = now;
      
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
    } finally {
      activeApiRequests--;
    }
  });

  console.log('✅ Memory-optimized API routes loaded with request throttling');
}

export default { setupAPIRoutes };