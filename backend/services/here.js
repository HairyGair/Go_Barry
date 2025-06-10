// services/here.js  
// Enhanced HERE Traffic API Integration with Enhanced GTFS Route Matching
import axios from 'axios';
import { 
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
} from '../utils/location.js';
import { enhancedRouteMatchingWithLocation } from '../utils/enhancedRouteMatching.js';

// Enhanced route matching for HERE incidents
function getEnhancedHERERouteMatching(location, description, coordinates) {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  
  // Major A-road corridors
  if (text.includes('a1') || text.includes('a1(m)')) {
    ['21', 'X21', '25', '28', '28B', 'X25'].forEach(route => routes.add(route));
  }
  if (text.includes('a19')) {
    ['1', '2', '307', '309', '317', '56', '9'].forEach(route => routes.add(route));
  }
  if (text.includes('a167')) {
    ['21', '22', 'X21', '6', '50'].forEach(route => routes.add(route));
  }
  if (text.includes('a184') || text.includes('coast road')) {
    ['1', '2', '307', '309', '327'].forEach(route => routes.add(route));
  }
  if (text.includes('a693')) {
    ['X30', 'X31', '74', '84'].forEach(route => routes.add(route));
  }
  
  // Major areas and corridors
  if (text.includes('newcastle') || text.includes('grainger') || text.includes('collingwood')) {
    ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29'].forEach(route => routes.add(route));
  }
  if (text.includes('gateshead') || text.includes('metrocentre')) {
    ['10', '10A', '10B', '21', '27', '28', '28B', 'Q3', 'Q3X'].forEach(route => routes.add(route));
  }
  if (text.includes('sunderland') || text.includes('park lane')) {
    ['16', '18', '20', '24', '35', '36', '56', '61', '62', '63'].forEach(route => routes.add(route));
  }
  if (text.includes('durham') || text.includes('durham city')) {
    ['21', '22', 'X21', '6', '7', '50'].forEach(route => routes.add(route));
  }
  if (text.includes('washington')) {
    ['2A', '2B', '4', '85', '86', 'X1'].forEach(route => routes.add(route));
  }
  if (text.includes('consett') || text.includes('stanley')) {
    ['X30', 'X31', 'X70', 'X71', 'X71A', '6', '7', '8', '78'].forEach(route => routes.add(route));
  }
  
  // Specific road names
  if (text.includes('tyne tunnel') || text.includes('silverlink')) {
    ['1', '2', '307', '309', '317'].forEach(route => routes.add(route));
  }
  if (text.includes('central motorway') || text.includes('claremont road')) {
    ['Q3', 'Q3X', '10', '12'].forEach(route => routes.add(route));
  }
  if (text.includes('birtley') || text.includes('angel of the north')) {
    ['21', 'X21', '25'].forEach(route => routes.add(route));
  }
  
  return Array.from(routes).sort();
}

// Enhanced HERE traffic fetcher with improved location handling and GTFS integration
async function fetchHERETrafficWithStreetNames() {
  if (!process.env.HERE_API_KEY) {
    console.error('❌ HERE API key missing!');
    return { success: false, data: [], error: 'HERE API key missing' };
  }
  
  try {
    console.log('🗺️ [PRIORITY] Fetching HERE traffic with enhanced location processing...');
    console.log('🔑 HERE API key configured:', process.env.HERE_API_KEY ? 'YES' : 'NO');
    
    // North East England focus area (wider coverage than TomTom)
    const lat = 54.9783; // Newcastle city center
    const lng = -1.6178;
    const radius = 25000; // 25km radius for comprehensive coverage
    
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        apikey: process.env.HERE_API_KEY,
        in: `circle:${lat},${lng};r=${radius}`,
        locationReferencing: 'olr',
        criticality: '0,1,2,3' // All criticality levels
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Enhanced',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 [PRIORITY] HERE response: ${response.status}, incidents: ${response.data?.results?.length || 0}`);
    
    if (!response.data || !response.data.results) {
      console.log('⚠️ HERE returned no incidents data');
      return { success: true, data: [], method: 'HERE API - No incidents in area' };
    }
    
    const incidents = response.data.results;
    const alerts = [];
    
    console.log(`🔍 Processing ${incidents.length} HERE incidents...`);
    
    for (const [index, incident] of incidents.entries()) {
      if (index >= 15) break; // Limit to 15 incidents for performance
      
      try {
        // Extract coordinates if available
        let lat = null, lng = null;
        if (incident.location?.shape?.links?.[0]?.points) {
          const points = incident.location.shape.links[0].points;
          if (points.length > 0) {
            lat = points[0].lat;
            lng = points[0].lng;
          }
        } else if (incident.location?.geometry?.coordinates) {
          const coords = incident.location.geometry.coordinates;
          if (Array.isArray(coords) && coords.length >= 2) {
            [lng, lat] = coords;
          }
        }
        
        // ENHANCED: Get location with GTFS-enhanced processing
        console.log(`🗺️ Processing location for HERE incident ${index + 1}/${incidents.length}...`);
        
        let enhancedLocation;
        try {
          // Start with HERE's location data
          let baseLocation = incident.location?.description?.value || 
                            incident.summary?.value || 
                            'HERE traffic incident';
          
          // Clean up generic HERE locations
          if (baseLocation.toLowerCase().includes('reported location') || 
              baseLocation.toLowerCase().includes('unverified') ||
              baseLocation.length < 5) {
            baseLocation = 'North East England';
          }
          
          if (lat && lng) {
            // Enhanced geocoding for precise location
            const geocodedLocation = await getEnhancedLocationWithFallbacks(
              lat, 
              lng, 
              baseLocation,
              `HERE incident ${incident.criticality}`
            );
            
            // Further enhance with GTFS route information
            enhancedLocation = enhancedLocationWithRoutes(lat, lng, geocodedLocation);
          } else {
            enhancedLocation = baseLocation;
          }
          
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for HERE incident ${index}:`, locationError.message);
          enhancedLocation = incident.location?.description?.value || 'North East England';
        }
        
        // ENHANCED: Route matching using both coordinates AND geocoded location names
        let affectedRoutes = [];
        let routeMatchMethod = 'none';
        
        try {
          if (lat && lng) {
            console.log(`🗺️ Enhanced route matching combining coordinates + location names...`);
            affectedRoutes = enhancedRouteMatchingWithLocation(lat, lng, enhancedLocation, 300);
            routeMatchMethod = affectedRoutes.length > 0 ? 'Enhanced Location + Coordinate Matching' : 'none';
          } else {
            // Fallback to text-only matching if no coordinates
            const textRoutes = getEnhancedHERERouteMatching(
              enhancedLocation, 
              incident.description?.value || incident.summary?.value || '',
              null
            );
            if (textRoutes.length > 0) {
              affectedRoutes = textRoutes;
              routeMatchMethod = 'Text-based Pattern Matching';
            }
          }
          
        } catch (routeError) {
          console.warn(`⚠️ Enhanced route matching failed for HERE incident ${index}:`, routeError.message);
          // Final fallback to basic text matching
          affectedRoutes = getEnhancedHERERouteMatching(
            enhancedLocation, 
            incident.description?.value || '',
            null
          );
          routeMatchMethod = affectedRoutes.length > 0 ? 'Basic Text Fallback' : 'none';
        }
        
        // Map HERE criticality to severity
        const getCriticalityInfo = (criticality) => {
          const criticalityMap = {
            0: { severity: 'Low', desc: 'Minor Traffic' },
            1: { severity: 'Medium', desc: 'Moderate Traffic' },
            2: { severity: 'High', desc: 'Major Traffic' },
            3: { severity: 'High', desc: 'Critical Traffic' }
          };
          return criticalityMap[criticality] || { severity: 'Medium', desc: 'Traffic Incident' };
        };
        
        const criticalityInfo = getCriticalityInfo(incident.criticality);
        
        // Extract road information
        const roadInfo = incident.location?.shape?.links?.[0];
        const roadName = roadInfo?.roadName || incident.location?.description?.value || 'Unknown Road';
        
        // Create enhanced alert
        const alert = {
          id: `here_enhanced_${Date.now()}_${index}`,
          type: 'incident',
          title: `${criticalityInfo.desc} - ${enhancedLocation}`,
          description: incident.description?.value || incident.summary?.value || criticalityInfo.desc,
          location: enhancedLocation,
          coordinates: lat && lng ? [lat, lng] : null,
          severity: criticalityInfo.severity,
          status: incident.criticality >= 2 ? 'red' : 'amber',
          source: 'here',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: routeMatchMethod,
          routeAccuracy: affectedRoutes.length > 0 ? 
            (routeMatchMethod === 'Enhanced Location + Coordinate Matching' ? 'high' : 'medium') : 'low',
          criticality: incident.criticality,
          roadName: roadName,
          startTime: incident.startTime,
          endTime: incident.endTime,
          lastUpdated: new Date().toISOString(),
          dataSource: 'HERE Traffic API v7 + Enhanced Location Processing'
        };
        
        alerts.push(alert);
        
        console.log(`✨ Enhanced HERE incident: "${roadName}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
        
      } catch (incidentError) {
        console.error(`❌ Failed to process HERE incident ${index}:`, incidentError.message);
        // Continue processing other incidents
      }
    }
    
    console.log(`✅ [PRIORITY] HERE enhanced: ${alerts.length} alerts with improved GTFS route matching`);
    
    // ALWAYS return a valid structure
    return { 
      success: true, 
      data: alerts, 
      method: 'Enhanced Location + Coordinate Matching + Intelligent Route Validation',
      source: 'HERE Traffic API v7',
      timestamp: new Date().toISOString(),
      coverage: `25km radius from Newcastle (${incidents.length} incidents processed)`
    };
    
  } catch (error) {
    console.error('❌ [PRIORITY] Enhanced HERE fetch failed:', error.message);
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

// Legacy function for backward compatibility
async function fetchHERETraffic() {
  console.log('⚠️ Using legacy HERE function, upgrading to enhanced version...');
  return await fetchHERETrafficWithStreetNames();
}

export { fetchHERETraffic, fetchHERETrafficWithStreetNames };
export default { fetchHERETraffic, fetchHERETrafficWithStreetNames };
