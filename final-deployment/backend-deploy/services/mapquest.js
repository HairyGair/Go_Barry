// services/mapquest.js
// Enhanced MapQuest Traffic API Integration with Location Processing
import axios from 'axios';
import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';

// Helper function to enhance alerts with timing and location data
function enhanceAlertWithTimesAndLocation(alert, incident) {
  // Add timing information if available
  if (incident.startTime) {
    alert.startTime = incident.startTime;
  }
  if (incident.endTime) {
    alert.endTime = incident.endTime;
  }
  if (incident.duration) {
    alert.estimatedDuration = incident.duration;
  }
  
  // Add additional location context
  if (incident.street && !alert.location.includes(incident.street)) {
    alert.location = `${incident.street} - ${alert.location}`;
  }
  
  return alert;
}

// Helper function to find routes near coordinates
async function findRoutesNearCoordinate(lat, lng, maxDistanceMeters = 150) {
  // This is a placeholder - should integrate with actual GTFS route matching
  try {
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
  
  // Sunderland area
  if (text.includes('sunderland') || text.includes('washington')) {
    routes.push('16', '20', '56', '700');
  }
  
  return routes;
}

// Enhanced MapQuest traffic fetcher with improved location handling and timing
async function fetchMapQuestTrafficWithStreetNames() {
  try {
    console.log('🗺️ Fetching MapQuest traffic with enhanced location processing...');
    
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: `55.0,-2.0,54.5,-1.0`, // North East bounding box
        filters: 'incidents,construction'
      },
      timeout: 20000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 MapQuest: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced location handling
      const incidentsToProcess = response.data.incidents.slice(0, 12); // Increased to 12
      
      for (const [index, incident] of incidentsToProcess.entries()) {
        const lat = incident.lat;
        const lng = incident.lng;
        
        // ENHANCED: Process even incidents without coordinates
        console.log(`🗺️ Processing MapQuest incident ${index + 1}/${incidentsToProcess.length}...`);
        
        let enhancedLocation;
        try {
          // Use enhanced location processing with multiple fallbacks
          enhancedLocation = await getEnhancedLocationWithFallbacks(
            lat,
            lng,
            incident.street || incident.shortDesc || '',
            `MapQuest ${incident.type === 1 ? 'roadwork' : 'incident'}`
          );
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for MapQuest incident ${index}:`, locationError.message);
          // Fallback to available data
          enhancedLocation = incident.street || incident.shortDesc || 'North East England - Location being determined';
        }
        
        // Enhanced GTFS route matching
        let affectedRoutes = [];
        try {
          if (lat && lng) {
            console.log(`🗺️ Finding GTFS routes for MapQuest incident at ${lat}, ${lng}...`);
            affectedRoutes = await findRoutesNearCoordinate(lat, lng, 150);
          }
          
          // Fallback to text-based matching if coordinate matching failed
          if (affectedRoutes.length === 0) {
            affectedRoutes = matchRoutes(enhancedLocation, incident.fullDesc || incident.shortDesc || '');
          }
        } catch (routeError) {
          console.warn(`⚠️ Route matching failed for MapQuest incident ${index}:`, routeError.message);
          affectedRoutes = [];
        }
        
        // Create base alert
        let alert = {
          id: `mapquest_enhanced_${incident.id || Date.now()}_${index}`,
          type: incident.type === 1 ? 'roadwork' : 'incident',
          title: incident.shortDesc || 'Traffic Incident',
          description: incident.fullDesc || incident.shortDesc || 'Traffic incident reported',
          location: enhancedLocation,
          authority: 'MapQuest Traffic',
          source: 'mapquest',
          severity: incident.severity >= 3 ? 'High' : incident.severity >= 2 ? 'Medium' : 'Low',
          status: 'red',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: affectedRoutes.length > 0 ? 'GTFS Shapes' : 'Text Pattern',
          coordinates: lat && lng ? { lat, lng } : null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'MapQuest Traffic API + Enhanced Location Processing'
        };

        // ENHANCED: Add start and end times
        alert = enhanceAlertWithTimesAndLocation(alert, incident);
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced MapQuest: "${incident.street || 'no location'}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
      }
    }
    
    console.log(`✅ MapQuest enhanced: ${alerts.length} alerts with locations and timing`);
    return { success: true, data: alerts, method: 'Enhanced with Location Fallbacks' };
    
  } catch (error) {
    console.error('❌ Enhanced MapQuest fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

export { fetchMapQuestTrafficWithStreetNames };
export default { fetchMapQuestTrafficWithStreetNames };