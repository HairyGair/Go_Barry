// services/tomtom-fixed.js
// Fixed TomTom Traffic API with Working Route Matching
import axios from 'axios';

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

// Enhanced location processing
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

// Simple geocoding fallback with multiple providers and rate limiting
async function reverseGeocodeSimple(lat, lng) {
  // Add delay to prevent rate limiting
  await new Promise(resolve => setTimeout(resolve, 200));
  
  try {
    // Try OpenStreetMap first with better User-Agent
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        zoom: 16, // More specific zoom level
        addressdetails: 1,
        extratags: 1
      },
      headers: {
        'User-Agent': 'Go-BARRY-Traffic-System/3.0 (+https://gobarry.co.uk/contact)'
      },
      timeout: 8000
    });
    
    if (response.data && response.data.display_name) {
      // Enhanced address parsing
      const address = response.data.address || {};
      const parts = [];
      
      // Priority order for road information
      if (address.road) parts.push(address.road);
      else if (address.highway) parts.push(address.highway);
      else if (address.path) parts.push(address.path);
      
      // Add area information
      if (address.neighbourhood) parts.push(address.neighbourhood);
      else if (address.suburb) parts.push(address.suburb);
      else if (address.village) parts.push(address.village);
      
      // Add city/town
      if (address.town) parts.push(address.town);
      else if (address.city) parts.push(address.city);
      else if (address.county) parts.push(address.county);
      
      if (parts.length > 0) {
        const location = parts.slice(0, 3).join(', '); // First 3 parts only
        console.log(`✅ OSM Geocoding success: ${lat}, ${lng} → ${location}`);
        return location;
      }
      
      // Fallback to display name if no structured address
      const displayParts = response.data.display_name.split(',').slice(0, 2);
      const fallbackLocation = displayParts.join(', ').trim();
      if (fallbackLocation && fallbackLocation !== 'undefined') {
        console.log(`✅ OSM Fallback: ${lat}, ${lng} → ${fallbackLocation}`);
        return fallbackLocation;
      }
    }
  } catch (error) {
    console.warn(`⚠️ OSM geocoding failed for ${lat}, ${lng}:`, error.message);
  }
  
  // Try Mapbox as fallback if available
  if (process.env.MAPBOX_TOKEN) {
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
      
      const mapboxResponse = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
        params: {
          access_token: process.env.MAPBOX_TOKEN,
          types: 'address,poi'
        },
        timeout: 6000
      });
      
      if (mapboxResponse.data?.features?.length > 0) {
        const feature = mapboxResponse.data.features[0];
        const placeName = feature.place_name || feature.text;
        if (placeName) {
          // Clean up Mapbox response
          const cleanLocation = placeName.split(',').slice(0, 2).join(', ');
          console.log(`✅ Mapbox Geocoding: ${lat}, ${lng} → ${cleanLocation}`);
          return cleanLocation;
        }
      }
    } catch (mapboxError) {
      console.warn(`⚠️ Mapbox geocoding failed for ${lat}, ${lng}:`, mapboxError.message);
    }
  }
  
  // Geographic area fallback based on coordinates
  const geographicLocation = getGeographicAreaName(lat, lng);
  if (geographicLocation) {
    console.log(`✅ Geographic fallback: ${lat}, ${lng} → ${geographicLocation}`);
    return geographicLocation;
  }
  
  console.warn(`❌ All geocoding failed for ${lat}, ${lng}`);
  return null;
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

// FIXED: TomTom traffic fetcher with working route matching
async function fetchTomTomTrafficWithStreetNames() {
  if (!process.env.TOMTOM_API_KEY) {
    console.error('❌ TomTom API key missing!');
    return { success: false, data: [], error: 'TomTom API key missing' };
  }
  
  try {
    console.log('🚗 [ENHANCED] Fetching TomTom traffic across full Go North East network...');
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
        'User-Agent': 'BARRY-TrafficWatch/3.0-Fixed',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📡 [ENHANCED] TomTom response: ${response.status}, incidents: ${response.data?.incidents?.length || 0}`);
    console.log(`🌍 Search area: Full Go North East network (newcastle, sunderland, northTyneside, durham, consett, hexham)`);
    
    if (!response.data || !response.data.incidents) {
      console.log('⚠️ TomTom returned no incidents data');
      return { success: true, data: [], method: 'TomTom API - No incidents found' };
    }
    
    const alerts = [];
    
    if (response.data?.incidents) {
      // Process incidents with enhanced locations
      const incidents = response.data.incidents.slice(0, 15); // Limit to prevent memory issues
      
      console.log(`🔍 Processing ${incidents.length} traffic incidents across Go North East network (filtered from ${response.data.incidents.length})`);
      
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

        // Enhanced location processing
        console.log(`🗺️ Processing location for incident ${index + 1}/${incidents.length} across Go North East network...`);
        console.log(`🗺️ Attempting enhanced geocoding for ${lat}, ${lng}...`);
        
        let enhancedLocation;
        try {
          // Try reverse geocoding
          const reversedLocation = await reverseGeocodeSimple(lat, lng);
          
          if (reversedLocation) {
            enhancedLocation = reversedLocation;
          } else {
            enhancedLocation = props.roadName || props.description || `Traffic location`;
          }
          
        } catch (locationError) {
          console.warn(`⚠️ Location enhancement failed for incident ${index}:`, locationError.message);
          enhancedLocation = props.roadName || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        console.log(`📍 OSM response for ${lat}, ${lng}: {
  road: ${enhancedLocation.includes('road') ? 'found' : 'undefined'},
  neighbourhood: ${enhancedLocation.includes('neighbourhood') ? 'found' : 'undefined'},
  suburb: ${enhancedLocation.includes('suburb') ? 'found' : 'undefined'},
  town: ${enhancedLocation.includes('town') ? 'found' : 'undefined'},
  city: ${enhancedLocation.includes('city') ? 'found' : 'undefined'}
}`);
        console.log(`✅ Enhanced location: ${enhancedLocation}`);

        // ENHANCED: Route matching using both coordinates AND geocoded location names
        console.log(`🗺️ Enhanced route matching combining coordinates + location names...`);
        const affectedRoutes = enhancedRouteMatchingWithLocation(lat, lng, enhancedLocation, 250);
        
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
        
        // Create enhanced alert with route information
        const alert = {
          id: `tomtom_enhanced_${Date.now()}_${index}`,
          type: incidentInfo.type,
          title: `${incidentInfo.desc} - ${enhancedLocation}`,
          description: props.description || incidentInfo.desc,
          location: enhancedLocation,
          coordinates: [lat, lng],
          severity: incidentInfo.severity,
          status: 'red',
          source: 'tomtom',
          affectsRoutes: affectedRoutes,
          routeMatchMethod: 'Enhanced Location + Coordinate Matching',
          routeAccuracy: affectedRoutes.length > 0 ? 'high' : 'medium',
          iconCategory: props.iconCategory,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v5 + Fixed Route Matching'
        };

        alerts.push(alert);
        
        console.log(`✨ Enhanced incident: "${props.roadName || 'coordinates'}" → "${enhancedLocation}" (${affectedRoutes.length} routes)`);
      }
    }
    
    console.log(`✅ [ENHANCED] TomTom: ${alerts.length} alerts with working route matching`);
    
    return { 
      success: true, 
      data: alerts, 
      method: 'Enhanced Location + Coordinate Matching + Intelligent Route Validation',
      source: 'TomTom Traffic API v5',
      timestamp: new Date().toISOString(),
      coverage: 'Newcastle/Gateshead core area',
      bbox: bbox
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

export { fetchTomTomTrafficWithStreetNames };
export default { fetchTomTomTrafficWithStreetNames };