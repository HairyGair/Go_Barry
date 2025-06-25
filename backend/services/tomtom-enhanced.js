// services/tomtom-enhanced.js
// Enhanced TomTom Traffic API with improved location accuracy
import axios from 'axios';
import { getEnhancedLocationWithFallbacks } from '../utils/productionLocation.js';
import { geocodingThrottler } from '../utils/requestThrottler.js';
import { findAffectedRoutesEnhanced, isGTFSReady } from '../utils/gtfsRouteMatching.js';
import enhancedLocationMatchingService from './enhancedLocationMatching.js';

// Enhanced route matching using both coordinates AND geocoded location names
function findRoutesNearCoordinatesFixed(lat, lng, radiusMeters = 250) {
  const foundRoutes = new Set();
  
  // Geographic region-based route matching for Go North East
  const regions = [
    {
      name: 'Newcastle Centre',
      bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 },
      routes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47', '53', '54', '56', '57', '58']
    },
    {
      name: 'Gateshead',
      bounds: { north: 54.97, south: 54.93, east: -1.6, west: -1.7 },
      routes: ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X', '53', '54']
    },
    {
      name: 'North Tyneside',
      bounds: { north: 55.05, south: 55.0, east: -1.4, west: -1.5 },
      routes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
    },
    {
      name: 'Sunderland',
      bounds: { north: 54.93, south: 54.88, east: -1.35, west: -1.42 },
      routes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
    },
    {
      name: 'Durham',
      bounds: { north: 54.88, south: 54.75, east: -1.5, west: -1.6 },
      routes: ['21', '22', 'X21', '6', '50', '28']
    },
    {
      name: 'Consett',
      bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 },
      routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
    },
    {
      name: 'A1 Corridor',
      bounds: { north: 55.0, south: 54.8, east: -1.55, west: -1.65 },
      routes: ['21', 'X21', '25', '28', '28B']
    },
    {
      name: 'A19 Corridor', 
      bounds: { north: 55.1, south: 54.9, east: -1.35, west: -1.55 },
      routes: ['1', '2', '9', '307', '309', '56']
    }
  ];

  // Find matching region
  for (const region of regions) {
    if (lat >= region.bounds.south && lat <= region.bounds.north &&
        lng >= region.bounds.west && lng <= region.bounds.east) {
      region.routes.forEach(route => foundRoutes.add(route));
      break;
    }
  }

  // If no specific region, use major routes as fallback
  if (foundRoutes.size === 0) {
    ['21', '22', '10', '1', '2', 'Q3'].forEach(route => foundRoutes.add(route));
  }

  return Array.from(foundRoutes).sort();
}

// NEW: Enhanced route matching using geocoded location names
function enhancedRouteMatchingWithLocation(lat, lng, geocodedLocation, radiusMeters = 250) {
  const foundRoutes = new Set();
  const locationText = (geocodedLocation || '').toLowerCase();
  
  console.log(`🎯 Enhanced route matching for: "${geocodedLocation}" at ${lat}, ${lng}`);
  
  // 1. SPECIFIC ROAD/STREET NAME MATCHING
  const roadMatches = {
    // Major A-roads with specific routes
    'a1': ['21', 'X21', '25', '28', '28B', 'X25'],
    'a19': ['1', '2', '307', '309', '317', '56', '9'],
    'a167': ['21', '22', 'X21', '6', '50'], // Durham Road
    'a184': ['1', '2', '307', '309', '327'], // Coast Road
    'a693': ['X30', 'X31', '74', '84'], // Stanley/Consett
    'a696': ['74', '43', '44'], // Ponteland Road
    
    // Specific major roads
    'central motorway': ['Q3', 'Q3X', '10', '12', '21'],
    'newgate street': ['Q3', 'Q3X', '10', '12'],
    'grainger street': ['Q3', 'Q3X', '10', '12'],
    'collingwood street': ['Q3', 'Q3X', '10', '12'],
    'grey street': ['Q3', 'Q3X', '10', '12'],
    'northumberland street': ['Q3', 'Q3X', '10', '12'],
    
    'durham road': ['21', '22', 'X21', '6'],
    'west road': ['X82', 'X84', 'X85'],
    'gosforth high street': ['1', '2'],
    'coast road': ['1', '2', '307', '309'],
    'shields road': ['27', '28'],
    'saltwell road': ['53', '54'],
    
    // Sunderland roads
    'chester road': ['20', '24', '35'],
    'fawcett street': ['16', '20', '61'],
    'park lane': ['16', '20', '24', '35', '36'],
    
    // Major bridges and landmarks
    'tyne bridge': ['Q3', 'Q3X', '10', '21'],
    'king edward bridge': ['21', '22'],
    'swing bridge': ['Q3', 'Q3X'],
    'millennium bridge': ['Q3', 'Q3X'],
    'redheugh bridge': ['21', '27', '28'],
    'metro centre': ['10', '10A', '10B', '27', '28'],
    'angel of the north': ['21', 'X21', '25'],
    
    // Town centers
    'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29'],
    'gateshead': ['10', '10A', '10B', '21', '27', '28', '28B', 'Q3', 'Q3X', '53', '54'],
    'sunderland': ['16', '18', '20', '24', '35', '36', '56', '61', '62', '63'],
    'durham': ['21', '22', 'X21', '6', '7', '50'],
    'consett': ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85'],
    'stanley': ['X30', 'X31', '8', '78'],
    'chester le street': ['21', '22', 'X21', '25', '28'],
    'washington': ['2A', '2B', '4', '85', '86', 'X1'],
    'hebburn': ['27', '28', '28B'],
    'jarrow': ['27', '28', '526'],
    'south shields': ['1', '2', '11', '17'],
    'whitley bay': ['308', '309', '311'],
    'cramlington': ['43', '44', '45'],
    'blyth': ['1', '2', '308']
  };
  
  // Check for road/location matches
  for (const [keyword, routes] of Object.entries(roadMatches)) {
    if (locationText.includes(keyword)) {
      routes.forEach(route => foundRoutes.add(route));
      console.log(`✅ Location match "${keyword}" → routes: ${routes.join(', ')}`);
    }
  }
  
  // 2. COORDINATE-BASED MATCHING (existing logic)
  const coordinateRoutes = findRoutesNearCoordinatesFixed(lat, lng, radiusMeters);
  coordinateRoutes.forEach(route => foundRoutes.add(route));
  
  // 3. VALIDATION: Remove routes that are geographically impossible
  const finalRoutes = Array.from(foundRoutes);
  const validatedRoutes = validateRoutesGeographically(finalRoutes, lat, lng);
  
  console.log(`✨ Enhanced matching result: ${validatedRoutes.length} routes for "${geocodedLocation}"`);
  console.log(`   📍 Coordinate-based: ${coordinateRoutes.length} routes`);
  console.log(`   🗺️ Location-based: ${finalRoutes.length - coordinateRoutes.length} additional routes`);
  console.log(`   ✅ Final validated: ${validatedRoutes.join(', ')}`);
  
  return validatedRoutes;
}

// Validate routes geographically to remove impossible matches
function validateRoutesGeographically(routes, lat, lng) {
  const impossibleCombinations = {
    // Routes that don't serve certain areas
    sunderland: ['Q3', 'Q3X', '10', '10A', '10B', '12'], // Newcastle city routes don't go to Sunderland
    consett: ['1', '2', '307', '309'], // North Tyneside routes don't go to Consett
    durham: ['1', '2', '307', '309', '43', '44'] // North Tyneside/Cramlington routes don't go to Durham
  };
  
  // Determine general area
  let area = 'general';
  if (lat >= 54.88 && lat <= 54.95 && lng >= -1.42 && lng <= -1.35) area = 'sunderland';
  else if (lat >= 54.82 && lat <= 54.87 && lng >= -1.9 && lng <= -1.8) area = 'consett';
  else if (lat >= 54.75 && lat <= 54.85 && lng >= -1.6 && lng <= -1.5) area = 'durham';
  
  // Filter out impossible routes
  const validRoutes = routes.filter(route => {
    const impossible = impossibleCombinations[area] || [];
    return !impossible.includes(route);
  });
  
  return validRoutes.sort();
}

// Enhanced location processing with accuracy improvements
async function enhanceLocationWithRoutes(lat, lng, originalLocation) {
  const routes = findRoutesNearCoordinatesFixed(lat, lng);
  let enhanced = originalLocation || `Traffic incident at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  
  if (routes.length > 0) {
    enhanced += ` - Affects routes: ${routes.slice(0, 5).join(', ')}`;
    if (routes.length > 5) {
      enhanced += ` +${routes.length - 5} more`;
    }
  }
  
  return enhanced;
}

// Geographic area name fallback
function getGeographicAreaName(lat, lng) {
  const areas = [
    { name: 'Newcastle City Centre', bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 } },
    { name: 'Gateshead Centre', bounds: { north: 54.97, south: 54.94, east: -1.58, west: -1.65 } },
    { name: 'North Tyneside', bounds: { north: 55.08, south: 55.0, east: -1.4, west: -1.5 } },
    { name: 'Sunderland Area', bounds: { north: 54.95, south: 54.88, east: -1.32, west: -1.45 } },
    { name: 'Durham Area', bounds: { north: 54.85, south: 54.75, east: -1.5, west: -1.6 } },
    { name: 'Consett Area', bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 } },
    { name: 'A1 Corridor', bounds: { north: 55.1, south: 54.8, east: -1.55, west: -1.65 } },
    { name: 'A19 Corridor', bounds: { north: 55.1, south: 54.9, east: -1.35, west: -1.55 } }
  ];
  
  for (const area of areas) {
    if (lat >= area.bounds.south && lat <= area.bounds.north &&
        lng >= area.bounds.west && lng <= area.bounds.east) {
      return area.name;
    }
  }
  
  // Final fallback to general area
  if (lat >= 54.7 && lat <= 55.1 && lng >= -1.9 && lng <= -1.3) {
    return 'North East England';
  }
  
  return null;
}

// Geocoding cache to prevent repeated API calls
const geocodingCache = new Map();
const GEOCODING_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ENHANCED: TomTom traffic fetcher with improved location accuracy
async function fetchTomTomTrafficWithStreetNames() {
  if (!process.env.TOMTOM_API_KEY) {
    console.error('❌ TomTom API key missing!');
    return { success: false, data: [], error: 'TomTom API key missing' };
  }
  
  try {
    console.log('🚗 [ENHANCED] Fetching TomTom traffic with improved location accuracy...');
    console.log('🔑 TomTom API key configured:', process.env.TOMTOM_API_KEY ? 'YES' : 'NO');
    
    // Use Newcastle/Gateshead area to stay under 10,000km² limit
    const bbox = '-1.8,54.8,-1.4,55.1'; // Newcastle/Gateshead core area
    console.log(`🗺️ Coverage area: ${bbox} (Newcastle/Gateshead core - under 10,000km² limit)`);
    
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: bbox,
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0-Enhanced',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 [ENHANCED] TomTom response: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    
    if (!response.data || !response.data.incidents) {
      console.log('⚠️ TomTom returned no incidents data');
      return { success: true, data: [], method: 'TomTom API - No incidents found' };
    }
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced location matching
      const incidents = response.data.incidents.slice(0, 50); // Increased to show more incidents
      
      console.log(`🔍 Processing ${incidents.length} traffic incidents with enhanced location matching`);
      
      for (const [index, feature] of incidents.entries()) {
        const props = feature.properties || {};
        
        // Extract coordinates
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

        if (!lat || !lng) {
          console.warn(`⚠️ No valid coordinates for incident ${index}`);
          continue;
        }

        // GEOGRAPHIC FILTER: Check if incident is within Go North East operational area
        const GNE_BOUNDS = {
          north: 55.042571,  // Whitley Bay (northernmost stop)
          south: 54.755372,  // Brandon (southernmost stop) 
          east: -1.382834,   // Sunderland area (easternmost)
          west: -2.095787    // Hexham (westernmost stop)
        };
        
        const withinGNEBounds = lat >= GNE_BOUNDS.south && 
                               lat <= GNE_BOUNDS.north && 
                               lng >= GNE_BOUNDS.west && 
                               lng <= GNE_BOUNDS.east;
        
        if (!withinGNEBounds) {
          console.log(`🚫 Filtering out incident ${index} at ${lat}, ${lng} - outside GNE operational area`);
          continue;
        }
        
        console.log(`✅ Incident ${index} at ${lat}, ${lng} - within GNE bounds`);

        // Use enhanced location matching service
        console.log(`🗺️ Enhancing location for incident ${index + 1}/${incidents.length}...`);
        
        let enhancedResult;
        const originalLocation = props.roadName || props.description || 'Traffic incident';
        
        try {
          // Use the new enhanced location matching service
          enhancedResult = await enhancedLocationMatchingService.enhanceLocation(
            originalLocation,
            [lat, lng],
            'tomtom'
          );
          
          console.log(`📍 Enhanced location result:
  Original: ${originalLocation}
  Corrected: ${enhancedResult.correctedLocation}
  Confidence: ${enhancedResult.confidence}
  Source: ${enhancedResult.source}
  Boundary Validation: ${enhancedResult.boundaryInfo?.isValid ? 'Valid' : 'Invalid'}`);
          
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for incident ${index}:`, locationError.message);
          enhancedResult = {
            correctedLocation: originalLocation,
            correctedCoords: [lat, lng],
            confidence: 0.5,
            source: 'original'
          };
        }

        // GTFS-ENHANCED: Route matching using enhanced location
        console.log(`🗺️ GTFS-enhanced route matching...`);
        let affectedRoutes = [];
        let routeMatchMethod = 'Fallback Location + Coordinate Matching';
        
        if (isGTFSReady()) {
          try {
            affectedRoutes = await findAffectedRoutesEnhanced(
              enhancedResult.correctedCoords[0], 
              enhancedResult.correctedCoords[1], 
              enhancedResult.correctedLocation, 
              250
            );
            routeMatchMethod = 'GTFS + Enhanced Location + Coordinate Matching';
            console.log(`✅ GTFS route matching found ${affectedRoutes.length} routes: ${affectedRoutes.join(', ')}`);
          } catch (gtfsError) {
            console.warn('⚠️ GTFS route matching failed, using fallback:', gtfsError.message);
            affectedRoutes = enhancedRouteMatchingWithLocation(
              enhancedResult.correctedCoords[0], 
              enhancedResult.correctedCoords[1], 
              enhancedResult.correctedLocation, 
              250
            );
          }
        } else {
          console.warn('⚠️ GTFS not ready, using fallback route matching');
          affectedRoutes = enhancedRouteMatchingWithLocation(
            enhancedResult.correctedCoords[0], 
            enhancedResult.correctedCoords[1], 
            enhancedResult.correctedLocation, 
            250
          );
        }
        
        // Map incident types
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
        
        // Create enhanced alert with improved location data
        const alert = {
          id: `tomtom_enhanced_${Date.now()}_${index}`,
          type: incidentInfo.type,
          title: `${incidentInfo.desc} - ${enhancedResult.correctedLocation}`,
          description: props.description || incidentInfo.desc,
          location: enhancedResult.correctedLocation,
          originalLocation: originalLocation,
          coordinates: enhancedResult.correctedCoords,
          originalCoordinates: [lat, lng],
          locationConfidence: enhancedResult.confidence,
          locationSource: enhancedResult.source,
          nearestKnownLocation: enhancedResult.nearestKnownLocation,
          severity: incidentInfo.severity,
          status: 'red',
          source: 'tomtom',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: routeMatchMethod,
          routeAccuracy: affectedRoutes.length > 0 ? (isGTFSReady() ? 'very_high' : 'high') : 'medium',
          iconCategory: props.iconCategory,
          lastUpdated: new Date().toISOString(),
          startDate: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 + Enhanced Location Matching'
        };

        alerts.push(alert);
        
        console.log(`✨ Enhanced incident: "${originalLocation}" → "${enhancedResult.correctedLocation}" (${affectedRoutes.length} routes, ${(enhancedResult.confidence * 100).toFixed(0)}% confidence)`);
      }
    }
    
    // Log location matching statistics
    const locationStats = enhancedLocationMatchingService.getStatistics();
    console.log(`📊 Location matching statistics:
  Total corrections: ${locationStats.totalCorrections}
  Boundaries defined: ${locationStats.boundaries}
  Supervisor corrections: ${Object.keys(locationStats.supervisorStats).length} supervisors`);
    
    console.log(`✅ [ENHANCED] TomTom: ${alerts.length} alerts with improved location accuracy`);
    
    return { 
      success: true, 
      data: alerts, 
      method: 'Enhanced Location Matching + Boundary Validation + Supervisor Corrections',
      source: 'TomTom Traffic API v5',
      timestamp: new Date().toISOString(),
      coverage: 'Newcastle/Gateshead core area',
      bbox: bbox,
      locationStats: locationStats
    };
    
  } catch (error) {
    console.error('❌ [ENHANCED] TomTom fetch failed:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      data: error.response?.data
    });
    
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

// Export services for monitoring and supervisor corrections
export { 
  fetchTomTomTrafficWithStreetNames, 
  geocodingThrottler, 
  geocodingCache,
  enhancedLocationMatchingService 
};

export default { 
  fetchTomTomTrafficWithStreetNames, 
  geocodingThrottler, 
  geocodingCache,
  enhancedLocationMatchingService 
};
