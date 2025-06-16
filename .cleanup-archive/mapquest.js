// services/mapquest.js
// Enhanced MapQuest Traffic API Integration with Full Go North East Coverage
import axios from 'axios';
import { getBoundsForAPI, GO_NORTH_EAST_COVERAGE } from '../config/geographicBounds.js';
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

// Import improved route matching
import { findAffectedRoutes } from '../utils/improvedRouteMatching.js';

// Helper function to find routes near coordinates using improved matching
function findRoutesNearCoordinate(lat, lng, maxDistanceMeters = 150) {
  try {
    const result = findAffectedRoutes(
      null, // no location text for coordinate-based search
      { lat, lng },
      ''
    );
    console.log(`🚌 Improved route matching found ${result.count} routes using ${result.method} method`);
    return result.routes;
  } catch (error) {
    console.warn('⚠️ Improved route matching not available:', error.message);
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

// Enhanced MapQuest traffic fetcher with improved authentication and location handling
async function fetchMapQuestTrafficWithStreetNames() {
  if (!process.env.MAPQUEST_API_KEY) {
    console.warn('⚠️ MapQuest API key not configured');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🗺️ [ENHANCED] Fetching MapQuest traffic across full Go North East network...');
    
    // Use expanded coverage for Go North East network
    const boundingBox = getBoundsForAPI('mapquest');
    console.log(`🌍 Coverage area: ${boundingBox} (Full Go North East network)`);
    
    // Try multiple endpoint configurations for better compatibility
    const endpoints = [
      {
        url: 'https://www.mapquestapi.com/traffic/v2/incidents',
        params: {
          key: process.env.MAPQUEST_API_KEY,
          boundingBox: boundingBox, // EXPANDED: Full Go North East coverage
          filters: 'incidents,construction',
          format: 'json'
        }
      },
      {
        url: 'https://www.mapquestapi.com/traffic/v2/incidents',
        params: {
          key: process.env.MAPQUEST_API_KEY,
          bbox: boundingBox, // Alternative parameter name
          incidentTypes: 'incidents,construction'
        }
      }
    ];

    let response = null;
    let lastError = null;

    // Try each endpoint configuration
    for (const [index, endpoint] of endpoints.entries()) {
      try {
        console.log(`🔄 Trying MapQuest endpoint configuration ${index + 1}...`);
        
        response = await axios.get(endpoint.url, {
          params: endpoint.params,
          timeout: 20000,
          headers: {
            'User-Agent': 'BARRY-TrafficWatch/3.0-Enhanced',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ MapQuest endpoint ${index + 1} successful!`);
        break;
        
      } catch (endpointError) {
        console.warn(`⚠️ MapQuest endpoint ${index + 1} failed: ${endpointError.message}`);
        lastError = endpointError;
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All MapQuest endpoints failed');
    }
    
    console.log(`📡 MapQuest: ${response.status}, incidents: ${response.data?.incidents?.length || 0} across full Go North East network`);
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced location handling across full network
      const incidentsToProcess = response.data.incidents.slice(0, 15); // Increased for full network
      
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
        
        // Enhanced route matching with improved algorithm
        let affectedRoutes = [];
        let routeMatchMethod = 'none';
        
        try {
          console.log(`🗺️ Finding GTFS routes for MapQuest incident at ${lat}, ${lng}...`);
          
          // Use improved route matching that tries both coordinate and text-based methods
          const routeResult = findAffectedRoutes(
            enhancedLocation,
            lat && lng ? { lat, lng } : null,
            incident.fullDesc || incident.shortDesc || ''
          );
          
          affectedRoutes = routeResult.routes;
          routeMatchMethod = routeResult.method;
          
          console.log(`🎯 Found ${affectedRoutes.length} routes using ${routeMatchMethod} method: ${affectedRoutes.join(', ')}`);
          
        } catch (routeError) {
          console.warn(`⚠️ Route matching failed for MapQuest incident ${index}:`, routeError.message);
          affectedRoutes = [];
          routeMatchMethod = 'failed';
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
          routeMatchMethod: routeMatchMethod,
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
    
    console.log(`✅ MapQuest enhanced: ${alerts.length} alerts with locations across full Go North East network`);
    return { success: true, data: alerts, method: 'Enhanced with Full Network Coverage' };
    
  } catch (error) {
    console.error('❌ Enhanced MapQuest fetch failed:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

export { fetchMapQuestTrafficWithStreetNames };
export default { fetchMapQuestTrafficWithStreetNames };