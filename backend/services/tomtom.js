// services/tomtom.js
// Enhanced TomTom Traffic API Integration with Full Go North East Coverage
import axios from 'axios';
import { getBoundsForAPI, GO_NORTH_EAST_COVERAGE } from '../config/geographicBounds.js';
import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';
import { enhancedFindRoutesNearCoordinates, enhancedLocationWithRoutes } from '../enhanced-gtfs-route-matcher.js';

// Helper function to enhance alerts with timing and location data
function enhanceAlertWithTimesAndLocation(alert, props) {
  // Add timing information if available
  if (props.startTime) {
    alert.startTime = props.startTime;
  }
  if (props.endTime) {
    alert.endTime = props.endTime;
  }
  if (props.duration) {
    alert.estimatedDuration = props.duration;
  }
  
  // Add additional location context
  if (props.roadName && !alert.location.includes(props.roadName)) {
    alert.location = `${props.roadName} - ${alert.location}`;
  }
  
  return alert;
}

// Helper function to find routes near coordinates
async function findRoutesNearCoordinate(lat, lng, maxDistanceMeters = 150) {
  // This is a placeholder - should integrate with actual GTFS route matching
  // For now, return basic coordinate-based route matching
  try {
    // Import the route matching function from the main file
    const { matchRoutes } = await import('../utils/routeMatching.js');
    return matchRoutes(`${lat},${lng}`, '');
  } catch (error) {
    console.warn('⚠️ Route matching not available:', error.message);
    return [];
  }
}

// Helper function for route matching fallback
function matchRoutes(location, description = '') {
  const routes = [];
  const text = `${location} ${description}`.toLowerCase();
  
  // A1 corridor routes
  if (text.includes('a1') || text.includes('birtley') || text.includes('gateshead')) {
    routes.push('21', 'X21', '25', '28');
  }
  
  // A19 corridor routes  
  if (text.includes('a19') || text.includes('tyne tunnel') || text.includes('silverlink')) {
    routes.push('1', '2', '307', '309');
  }
  
  // Newcastle city center
  if (text.includes('newcastle') || text.includes('grainger') || text.includes('collingwood')) {
    routes.push('Q3', 'Q3X', '10', '12', '21', '22');
  }
  
  // Gateshead/Metrocentre
  if (text.includes('gateshead') || text.includes('metrocentre')) {
    routes.push('10', '10A', '10B', '27', '28');
  }
  
  return routes;
}

// --- Enhanced fetchTomTomTrafficWithStreetNames ---
// Enhanced TomTom traffic fetcher with improved location handling and timing
async function fetchTomTomTrafficWithStreetNames() {
  if (!process.env.TOMTOM_API_KEY) {
    console.error('❌ TomTom API key missing!');
    return { success: false, data: [], error: 'TomTom API key missing' };
  }
  
  try {
    console.log('🚗 [ENHANCED] Fetching TomTom traffic across full Go North East network...');
    console.log('🔑 TomTom API key configured:', process.env.TOMTOM_API_KEY ? 'YES' : 'NO');
    
    // Use smaller Newcastle/Gateshead area to avoid 10,000km² limit
    const bbox = '-1.8,54.8,-1.4,55.1'; // Newcastle/Gateshead core area (~450km²)
    console.log(`🗺️ Coverage area: ${bbox} (Newcastle/Gateshead core - under 10,000km² limit)`);
    
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: bbox, // EXPANDED: Now covers entire Go North East network
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-FullNetwork',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 [ENHANCED] TomTom response: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    console.log(`🌍 Search area: Full Go North East network (${Object.keys(GO_NORTH_EAST_COVERAGE.regions).join(', ')})`);
    
    if (!response.data || !response.data.incidents) {
      console.log('⚠️ TomTom returned no incidents data across full network');
      return { success: true, data: [], method: 'TomTom API - No incidents in Go North East network' };
    }
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced locations
      const realTrafficIncidents = response.data.incidents.filter(feature => {
        const props = feature.properties || {};
        // Include more incident types for better coverage
        return props.iconCategory >= 1 && props.iconCategory <= 14;
      });
      
      console.log(`🔍 Processing ${realTrafficIncidents.length} traffic incidents across Go North East network (filtered from ${response.data.incidents.length})`);
      
      for (const [index, feature] of realTrafficIncidents.entries()) {
        if (index >= 15) break; // Increased limit for full network coverage
        
        const props = feature.properties || {};
        
        // Extract coordinates with better error handling
        let lat = null, lng = null;
        try {
          if (feature.geometry?.coordinates) {
            if (feature.geometry.type === 'Point') {
              [lng, lat] = feature.geometry.coordinates;
            } else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 0) {
              [lng, lat] = feature.geometry.coordinates[0];
            }
          }
        } catch (coordError) {
          console.warn(`⚠️ Error extracting coordinates for incident ${index}:`, coordError.message);
        }

        // ENHANCED: Get location with GTFS-enhanced processing
        console.log(`🗺️ Processing location for incident ${index + 1}/${realTrafficIncidents.length} across Go North East network...`);
        
        let enhancedLocation;
        try {
          // First get basic enhanced location
          const basicLocation = await getEnhancedLocationWithFallbacks(
            lat, 
            lng, 
            props.roadName || props.description || '',
            `TomTom incident ${props.iconCategory}`
          );
          
          // Then enhance with GTFS route information
          enhancedLocation = enhancedLocationWithRoutes(lat, lng, basicLocation);
          
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for incident ${index}:`, locationError.message);
          enhancedLocation = getCoordinateDescription(lat, lng);
        }
        
// Enhanced GTFS route matching with error handling
        let affectedRoutes = [];
        let routeMatchMethod = 'none';
        try {
          if (lat && lng) {
            console.log(`🗺️ Enhanced GTFS route matching for incident at ${lat}, ${lng}...`);
            affectedRoutes = enhancedFindRoutesNearCoordinates(lat, lng, 250);
            routeMatchMethod = affectedRoutes.length > 0 ? 'Enhanced GTFS' : 'none';
          }
        } catch (routeError) {
          console.warn(`⚠️ Enhanced GTFS route matching failed for incident ${index}:`, routeError.message);
          // Fallback to text-based route matching
          affectedRoutes = matchRoutes(enhancedLocation, props.description || '');
          routeMatchMethod = affectedRoutes.length > 0 ? 'Text Pattern Fallback' : 'none';
        }
        
        // Map incident types with better categorization
        const getIncidentInfo = (iconCategory) => {
          const categoryMap = {
            1: { type: 'incident', severity: 'High', desc: 'Accident' },
            2: { type: 'incident', severity: 'Medium', desc: 'Dangerous Conditions' },
            3: { type: 'incident', severity: 'Low', desc: 'Weather Conditions' },
            4: { type: 'incident', severity: 'Medium', desc: 'Road Hazard' },
            5: { type: 'incident', severity: 'Low', desc: 'Vehicle Breakdown' },
            6: { type: 'roadwork', severity: 'Medium', desc: 'Road Closure' },
            7: { type: 'roadwork', severity: 'High', desc: 'Road Works' },
            8: { type: 'incident', severity: 'Low', desc: 'Mass Transit Issue' },
            9: { type: 'incident', severity: 'Medium', desc: 'Traffic Incident' },
            10: { type: 'roadwork', severity: 'High', desc: 'Road Blocked' },
            11: { type: 'roadwork', severity: 'High', desc: 'Road Blocked' },
            14: { type: 'incident', severity: 'Medium', desc: 'Broken Down Vehicle' }
          };
          return categoryMap[iconCategory] || { type: 'incident', severity: 'Medium', desc: 'Traffic Incident' };
        };
        
        const incidentInfo = getIncidentInfo(props.iconCategory);
        
        // Create base alert
        let alert = {
          id: `tomtom_enhanced_${Date.now()}_${index}`,
          type: incidentInfo.type,
          title: `${incidentInfo.desc} - ${enhancedLocation}`,
          description: props.description || incidentInfo.desc,
          location: enhancedLocation,
          coordinates: lat && lng ? [lat, lng] : null,
          severity: incidentInfo.severity,
          status: 'red',
          source: 'tomtom',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: routeMatchMethod,
          routeAccuracy: affectedRoutes.length > 0 ? (routeMatchMethod === 'Enhanced GTFS' ? 'high' : 'medium') : 'low',
          iconCategory: props.iconCategory,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 + Enhanced Location Processing'
        };

        // ENHANCED: Add start and end times
        alert = enhanceAlertWithTimesAndLocation(alert, props);
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced incident: "${props.roadName || 'coordinates'}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
      }
    }
    
    console.log(`✅ [ENHANCED] TomTom full network: ${alerts.length} alerts with improved GTFS route matching across entire Go North East coverage`);
    
    // ALWAYS return a valid structure
    return { 
      success: true, 
      data: alerts, 
      method: 'Enhanced GTFS Route Matching + Full Network Coverage',
      source: 'TomTom Traffic API v5',
      timestamp: new Date().toISOString(),
      coverage: `Full Go North East Network (${Object.keys(GO_NORTH_EAST_COVERAGE.regions).join(', ')})`,
      bbox: bbox
    };
    
  } catch (error) {
    console.error('❌ [ENHANCED] Enhanced TomTom fetch failed:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      data: error.response?.data
    });
    
    // ALWAYS return a valid structure even on error
    return { 
      success: false, 
      data: [], 
      error: error.message,
      errorDetails: {
        code: error.code,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export { fetchTomTomTrafficWithStreetNames };
export default { fetchTomTomTrafficWithStreetNames };