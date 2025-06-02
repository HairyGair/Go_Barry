// Enhanced TomTom processor for backend/fetch-traffic-flow.js
// Integration with GTFS location enhancer for accurate descriptions

import enhanceLocationWithGTFS, { 
  initializeGTFS, 
  findNearbyStops, 
  findIntersectingRoutes,
  getGTFSStats 
} from './gtfs-location-enhancer.js';

// Enhanced TomTom data processing with GTFS integration
function processTomTomDataWithGTFS(data) {
  const alerts = [];

  if (data.tm && data.tm.poi) {
    data.tm.poi.forEach(incident => {
      // Extract coordinates
      const lat = incident.p?.y;
      const lng = incident.p?.x;
      
      if (!lat || !lng) {
        console.warn('⚠️ TomTom incident missing coordinates:', incident.id);
        return;
      }
      
      // Build basic location from TomTom data
      let basicLocation = "";
      if (incident.rdN && incident.f) {
        basicLocation = `${incident.rdN} - ${incident.f}`;
      } else if (incident.rdN) {
        basicLocation = incident.rdN;
      } else if (incident.f) {
        basicLocation = incident.f;
      }
      
      // ENHANCED: Use GTFS to create much more accurate location
      const enhancedLocation = enhanceLocationWithGTFS(
        lat, lng, basicLocation, incident.rdN
      );
      
      // ENHANCED: Find specific affected routes using GTFS
      const affectedRoutes = findIntersectingRoutes(lat, lng, 100);
      const routeShortNames = affectedRoutes.map(r => r.shortName);
      
      // ENHANCED: Get nearby stops for additional context
      const nearbyStops = findNearbyStops(lat, lng, 200);
      
      // Build comprehensive description
      let description = incident.d || 'Traffic incident reported';
      
      // Add stop context if very close
      if (nearbyStops.length > 0 && nearbyStops[0].distance <= 100) {
        description += ` Location is ${nearbyStops[0].distance}m from ${nearbyStops[0].name} bus stop.`;
      }
      
      // Add route impact detail
      if (affectedRoutes.length > 0) {
        description += ` This incident may impact Go North East services: ${routeShortNames.slice(0, 5).join(', ')}`;
        if (routeShortNames.length > 5) {
          description += ` and ${routeShortNames.length - 5} other routes`;
        }
        description += '.';
      }

      const alert = {
        id: `tomtom_${incident.id}`,
        type: getIncidentType(incident.ic),
        title: `${incident.ty || 'Traffic Incident'} - ${incident.rdN || 'Road Network'}`,
        description: description,
        location: enhancedLocation, // ENHANCED: Much more precise location
        coordinates: [lat, lng],
        severity: mapTomTomSeverity(incident.ic),
        status: 'red',
        source: 'tomtom',
        
        // Enhanced route information from GTFS
        affectsRoutes: routeShortNames,
        affectedRouteDetails: affectedRoutes.slice(0, 10), // Detailed route info
        nearbyStops: nearbyStops.slice(0, 3), // Nearby landmark stops
        
        // TomTom specific data
        incidentType: incident.ty,
        delay: incident.dl || 0,
        length: incident.l || 0,
        startTime: incident.sd ? new Date(incident.sd).toISOString() : null,
        endTime: incident.ed ? new Date(incident.ed).toISOString() : null,
        
        // Additional GTFS-enhanced metadata
        locationAccuracy: nearbyStops.length > 0 ? 'high' : 'medium',
        routeImpactConfidence: affectedRoutes.length > 0 ? 'high' : 'low',
        
        lastUpdated: new Date().toISOString(),
        dataSource: 'TomTom Traffic API + GTFS Route Data'
      };

      alerts.push(alert);
    });
  }

  return alerts;
}

// Enhanced TomTom fetcher with GTFS integration
export async function fetchTomTomTrafficWithGTFS() {
  // Ensure GTFS is loaded
  const gtfsStats = getGTFSStats();
  if (!gtfsStats.isLoaded) {
    console.log('🔄 GTFS not loaded - initializing for enhanced locations...');
    const initSuccess = await initializeGTFS();
    if (!initSuccess) {
      console.warn('⚠️ GTFS initialization failed - falling back to basic TomTom processing');
      return await fetchTomTomTrafficBasic(); // Fallback to original function
    }
  }
  
  if (!process.env.TOMTOM_API_KEY) {
    console.warn('⚠️ TomTom API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }
  
  try {
    console.log('🚗 Fetching TomTom traffic with GTFS enhancement...');
    
    // North East England bounding box
    const boundingBox = '54.5,-2.0,55.5,-1.0'; // minLat,minLng,maxLat,maxLng
    
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/5/incidentDetails/s4/${boundingBox}/10/1364226111`,
      {
        params: { key: process.env.TOMTOM_API_KEY },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-TrafficWatch/3.0-GTFS',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`📡 TomTom API response: ${response.status}, incidents: ${response.data?.tm?.poi?.length || 0}`);
    
    // ENHANCED: Use GTFS-enhanced processing
    const alerts = processTomTomDataWithGTFS(response.data);
    
    // Log sample enhanced alerts
    if (alerts.length > 0) {
      console.log('✨ Sample enhanced TomTom alert:');
      console.log(`   Location: ${alerts[0].location}`);
      console.log(`   Routes: ${alerts[0].affectsRoutes.join(', ')}`);
      console.log(`   Nearby stops: ${alerts[0].nearbyStops.map(s => s.name).join(', ')}`);
    }
    
    console.log(`✅ TomTom + GTFS: ${alerts.length} enhanced traffic alerts processed`);
    
    return { 
      success: true, 
      data: alerts, 
      source: 'TomTom Traffic API + GTFS Enhanced',
      enhancement: {
        gtfsLoaded: true,
        gtfsStats: gtfsStats,
        averageRoutesPerAlert: alerts.length > 0 ? 
          (alerts.reduce((sum, a) => sum + a.affectsRoutes.length, 0) / alerts.length).toFixed(1) : 0,
        alertsWithNearbyStops: alerts.filter(a => a.nearbyStops.length > 0).length
      }
    };
    
  } catch (error) {
    console.error('❌ Enhanced TomTom traffic fetch failed:', error.message);
    if (error.response) {
      console.error(`📡 TomTom API error: ${error.response.status} - ${error.response.statusText}`);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Fallback basic TomTom processing (original function)
async function fetchTomTomTrafficBasic() {
  // Your original TomTom function here as fallback
  console.log('📡 Using basic TomTom processing (GTFS not available)');
  // ... original implementation
}

// Helper functions (enhanced versions)
function getIncidentType(tomtomCode) {
  const incidentTypes = {
    0: 'incident',  // Unknown
    1: 'incident',  // Accident  
    2: 'incident',  // Fog
    3: 'incident',  // Dangerous conditions
    4: 'incident',  // Rain
    5: 'incident',  // Ice
    6: 'incident',  // Snow
    7: 'incident',  // Wind
    8: 'roadwork',  // Construction
    14: 'incident', // Broken down vehicle
    // Add more TomTom incident codes as needed
  };
  return incidentTypes[tomtomCode] || 'incident';
}

function mapTomTomSeverity(incidentCode) {
  // Enhanced severity mapping based on TomTom incident codes
  if (incidentCode === 1 || incidentCode === 8) return 'High';    // Accidents, Construction
  if (incidentCode >= 2 && incidentCode <= 7) return 'Medium';   // Weather conditions
  if (incidentCode === 14) return 'Medium';                     // Breakdown
  return 'Low';
}

// Usage instructions for integration
export const integrationInstructions = {
  description: "Enhanced TomTom processor with GTFS location accuracy",
  setup: [
    "1. Place gtfs-location-enhancer.js in backend/ directory",
    "2. Replace processTomTomData function in fetch-traffic-flow.js",
    "3. Call initializeGTFS() on server startup",
    "4. Use fetchTomTomTrafficWithGTFS() instead of original function"
  ],
  benefits: [
    "Precise location descriptions using actual bus route data",
    "Automatic identification of affected Go North East routes", 
    "Nearby bus stop landmarks for better context",
    "Enhanced route impact analysis",
    "Fallback to original processing if GTFS fails"
  ],
  example_output: {
    before: "A1",
    after: "A1 Northbound (near Team Valley Shopping Centre) [45m] - affects routes: 21, 25, 28, 29"
  }
};

export default fetchTomTomTrafficWithGTFS;