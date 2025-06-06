// backend/enhanced-gtfs-route-matcher.js
// Unified, accurate GTFS route matching system combining coordinate and text-based matching
// Designed for maximum accuracy across all BARRY platforms (Browser, Mobile, Display Screen)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ Enhanced GTFS Route Matcher Loading...');

// Enhanced configuration for improved accuracy
const SEARCH_CONFIG = {
  // Progressive search radii for coordinate-based matching
  COORDINATE_SEARCH_RADII: [75, 150, 300, 500], // Start smaller for better precision
  
  // Maximum number of routes to return
  MAX_ROUTES_RETURNED: 12,
  
  // Confidence scoring thresholds
  HIGH_CONFIDENCE: 0.8,
  MEDIUM_CONFIDENCE: 0.5,
  
  // Cache settings
  CACHE_DURATION: 15 * 60 * 1000, // 15 minutes
};

// Expanded North East England bounds for comprehensive coverage
const NORTH_EAST_BOUNDS = {
  north: 56.5,   // Covers all of Northumberland
  south: 53.0,   // Covers Teesside
  east: 0.5,     // Covers coast
  west: -3.5     // Covers Cumbria border
};

// Comprehensive Go North East route mapping to roads and areas
const ENHANCED_ROUTE_MAPPING = {
  // Major A-roads with detailed coverage
  'A1': {
    routes: ['X9', 'X10', '10', '11', '21', 'X21', '35', '36'],
    confidence: 0.9,
    description: 'A1 Western Bypass and central sections'
  },
  'A19': {
    routes: ['1', '2', '308', '309', '311', '317', '19'],
    confidence: 0.9,
    description: 'A19 Coast Road and Tyne Tunnel approaches'
  },
  'A167': {
    routes: ['21', '22', 'X21', '6', '7', '13', '14'],
    confidence: 0.9,
    description: 'A167 Durham Road corridor'
  },
  'A1058': {
    routes: ['1', '2', '306', '307', '308', '309', '311', '317'],
    confidence: 0.9,
    description: 'A1058 Coast Road'
  },
  'A184': {
    routes: ['25', '28', '29', '93', '94', 'X66'],
    confidence: 0.9,
    description: 'A184 Gateshead to South Shields'
  },
  'A690': {
    routes: ['61', '62', '63', '64', '65', 'X1'],
    confidence: 0.9,
    description: 'A690 Durham to Washington'
  },
  'A69': {
    routes: ['X84', 'X85', '602', '685', '74'],
    confidence: 0.9,
    description: 'A69 Hexham corridor'
  },
  'A183': {
    routes: ['16', '18', '20', '61', '62', 'E1', 'E2', 'E6'],
    confidence: 0.9,
    description: 'A183 Chester Road and Sunderland'
  },

  // Newcastle City Centre (very precise)
  'Grey Street': {
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },
  'Grainger Street': {
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },
  'Collingwood Street': {
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },
  'Northumberland Street': {
    routes: ['10', '11', '12', '39', '40', '62', '63'],
    confidence: 1.0,
    description: 'Newcastle main shopping street'
  },
  'Clayton Street': {
    routes: ['Q1', 'Q2', 'Q3', '10', '11'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },
  'Pilgrim Street': {
    routes: ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },
  'Blackett Street': {
    routes: ['10', '11', '12', '39', '40', 'Q1', 'Q2'],
    confidence: 1.0,
    description: 'Newcastle city centre'
  },

  // Gateshead
  'High Street Gateshead': {
    routes: ['21', '25', '28', '29', '53', '54', '56'],
    confidence: 0.95,
    description: 'Gateshead town centre'
  },
  'West Street': {
    routes: ['21', '25', '28', '29', '53', '54'],
    confidence: 0.9,
    description: 'Gateshead'
  },
  'Jackson Street': {
    routes: ['21', '25', '28', '29'],
    confidence: 0.9,
    description: 'Gateshead'
  },

  // Durham area
  'Durham Road': {
    routes: ['21', '22', 'X21', '6', '7', '13', '14'],
    confidence: 0.9,
    description: 'Durham Road corridor'
  },
  'Front Street': {
    routes: ['21', '22', 'X21', '25', '28'],
    confidence: 0.8,
    description: 'Various Front Streets in region'
  },

  // Coast Road areas
  'Coast Road': {
    routes: ['1', '2', '306', '307', '308', '309', '311', '317'],
    confidence: 0.95,
    description: 'A1058 Coast Road'
  },
  'Tynemouth Road': {
    routes: ['1', '2', '308', '309', '311'],
    confidence: 0.9,
    description: 'Tynemouth area'
  },

  // Sunderland area
  'High Street West': {
    routes: ['16', '18', '20', '61', '62', 'E1', 'E2'],
    confidence: 0.95,
    description: 'Sunderland city centre'
  },
  'Fawcett Street': {
    routes: ['16', '18', '20', '61', '62', 'E1'],
    confidence: 0.95,
    description: 'Sunderland city centre'
  },
  'John Street': {
    routes: ['16', '18', '20', 'E1', 'E2'],
    confidence: 0.9,
    description: 'Sunderland'
  },

  // Washington and surrounding areas
  'Washington Highway': {
    routes: ['61', '62', '63', '64', '65', 'X1'],
    confidence: 0.95,
    description: 'Washington area'
  },
  'Wessington Way': {
    routes: ['61', '62', '63', '64', '65'],
    confidence: 0.9,
    description: 'Washington area'
  },

  // Specific local areas
  'Wrekenton': {
    routes: ['25', '28', '29', '53', '54'],
    confidence: 0.9,
    description: 'Wrekenton area'
  },
  'Team Valley': {
    routes: ['21', '25', '28', '29', '93', '94'],
    confidence: 0.9,
    description: 'Team Valley Trading Estate'
  },
  'MetroCentre': {
    routes: ['21', '25', '28', '29', '100'],
    confidence: 0.9,
    description: 'MetroCentre shopping area'
  },
  'Blaydon': {
    routes: ['X84', 'X85', '602'],
    confidence: 0.9,
    description: 'Blaydon area'
  },
  'Prudhoe': {
    routes: ['X84', 'X85', '74'],
    confidence: 0.9,
    description: 'Prudhoe area'
  },
  'Hexham': {
    routes: ['X84', 'X85', '602', '685', '74'],
    confidence: 0.9,
    description: 'Hexham area'
  },

  // Bus stations and major interchanges
  'Newcastle Central Station': {
    routes: ['Q1', 'Q2', 'Q3', '10', '11', '12', '21', '36'],
    confidence: 1.0,
    description: 'Newcastle Central Station interchange'
  },
  'Gateshead Interchange': {
    routes: ['21', '25', '28', '29', '53', '54', '56', '57', '58'],
    confidence: 1.0,
    description: 'Gateshead bus interchange'
  },
  'Sunderland Interchange': {
    routes: ['16', '18', '20', '61', '62', 'E1', 'E2', 'E6'],
    confidence: 1.0,
    description: 'Sunderland bus interchange'
  },
  'Durham Bus Station': {
    routes: ['21', '22', 'X21', '6', '7', '13', '14', 'X12'],
    confidence: 1.0,
    description: 'Durham bus station'
  },

  // Area-based matching
  'Newcastle': {
    routes: ['Q1', 'Q2', 'Q3', '10', '11', '12', '21', '36', '39', '40'],
    confidence: 0.7,
    description: 'Newcastle general area'
  },
  'Gateshead': {
    routes: ['21', '25', '28', '29', '53', '54', '56', '57', '58'],
    confidence: 0.7,
    description: 'Gateshead general area'
  },
  'Sunderland': {
    routes: ['16', '18', '20', '61', '62', 'E1', 'E2', 'E6'],
    confidence: 0.7,
    description: 'Sunderland general area'
  },
  'Durham': {
    routes: ['21', '22', 'X21', '6', '7', '13', '14', 'X12'],
    confidence: 0.7,
    description: 'Durham general area'
  }
};

// Precise coordinate zones for major interchanges/transport hubs
const COORDINATE_ZONES = {
  // Newcastle City Centre (very precise boundaries)
  newcastle_city_centre: {
    bounds: { north: 54.9800, south: 54.9650, east: -1.6000, west: -1.6250 },
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '21', '36'],
    confidence: 1.0,
    description: 'Newcastle city centre core'
  },
  
  // Newcastle Central Station area
  central_station: {
    bounds: { north: 54.9690, south: 54.9650, east: -1.6120, west: -1.6180 },
    routes: ['Q1', 'Q2', 'Q3', '10', '11', '12', '21', '36'],
    confidence: 1.0,
    description: 'Newcastle Central Station'
  },
  
  // Gateshead Interchange
  gateshead_interchange: {
    bounds: { north: 54.9650, south: 54.9550, east: -1.5950, west: -1.6100 },
    routes: ['21', '25', '28', '29', '53', '54', '56', '57', '58'],
    confidence: 1.0,
    description: 'Gateshead bus interchange'
  },
  
  // Tyne Tunnel Plaza
  tyne_tunnel: {
    bounds: { north: 54.9900, south: 54.9800, east: -1.4550, west: -1.4700 },
    routes: ['1', '2', '308', '309', '311'],
    confidence: 0.95,
    description: 'Tyne Tunnel approach'
  },
  
  // MetroCentre area
  metro_centre: {
    bounds: { north: 54.9600, south: 54.9500, east: -1.6700, west: -1.6850 },
    routes: ['21', '25', '28', '29', '100'],
    confidence: 0.95,
    description: 'MetroCentre shopping area'
  },
  
  // Team Valley
  team_valley: {
    bounds: { north: 54.9500, south: 54.9400, east: -1.6650, west: -1.6800 },
    routes: ['21', '25', '28', '29', '93', '94'],
    confidence: 0.95,
    description: 'Team Valley Trading Estate'
  },
  
  // Sunderland City Centre
  sunderland_city_centre: {
    bounds: { north: 54.9100, south: 54.9000, east: -1.3800, west: -1.3900 },
    routes: ['16', '18', '20', '61', '62', 'E1', 'E2', 'E6'],
    confidence: 0.95,
    description: 'Sunderland city centre'
  },
  
  // Durham city
  durham_city: {
    bounds: { north: 54.7800, south: 54.7750, east: -1.5700, west: -1.5800 },
    routes: ['21', '22', 'X21', '6', '7', '13', '14', 'X12'],
    confidence: 0.95,
    description: 'Durham city centre'
  }
};

// Cache for loaded GTFS data
let gtfsCache = {
  stops: new Map(),
  routes: new Map(),
  trips: new Map(),
  shapes: new Map(),
  isLoaded: false,
  lastLoaded: null
};

// Haversine distance calculation (optimized)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check if coordinates are within North East England
function isInNorthEast(lat, lng) {
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

// Load GTFS data with improved error handling
async function loadGTFSData() {
  if (gtfsCache.isLoaded && 
      gtfsCache.lastLoaded && 
      (Date.now() - gtfsCache.lastLoaded) < SEARCH_CONFIG.CACHE_DURATION) {
    return true;
  }

  console.log('📊 Loading enhanced GTFS data...');
  const startTime = Date.now();

  try {
    // Load routes
    await loadRoutes();
    // Load stops (essential for coordinate matching)
    await loadStops();
    // Load trips (for route-shape mapping)
    await loadTrips();
    
    gtfsCache.isLoaded = true;
    gtfsCache.lastLoaded = Date.now();
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Enhanced GTFS data loaded in ${(loadTime/1000).toFixed(2)}s`);
    console.log(`📊 Loaded: ${gtfsCache.stops.size} stops, ${gtfsCache.routes.size} routes, ${gtfsCache.trips.size} trips`);
    
    return true;
  } catch (error) {
    console.error('❌ Enhanced GTFS loading failed:', error);
    return false;
  }
}

// Load routes data
async function loadRoutes() {
  try {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const routesData = await fs.readFile(routesPath, 'utf8');
    
    const parsed = Papa.parse(routesData, {
      header: true,
      skipEmptyLines: true
    });
    
    parsed.data.forEach(route => {
      if (route.route_id && route.route_short_name) {
        gtfsCache.routes.set(route.route_id, {
          id: route.route_id,
          shortName: route.route_short_name.trim(),
          longName: route.route_long_name?.trim() || '',
          color: route.route_color || null
        });
      }
    });
    
    console.log(`✅ Loaded ${gtfsCache.routes.size} routes`);
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    throw error;
  }
}

// Load stops data (essential for coordinate matching)
async function loadStops() {
  try {
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const stopsData = await fs.readFile(stopsPath, 'utf8');
    
    const parsed = Papa.parse(stopsData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    let processedCount = 0;
    
    for (const stop of parsed.data) {
      if (stop.stop_id && stop.stop_lat && stop.stop_lng && stop.stop_name) {
        const lat = parseFloat(stop.stop_lat);
        const lng = parseFloat(stop.stop_lng);
        
        if (isInNorthEast(lat, lng)) {
          gtfsCache.stops.set(stop.stop_id, {
            id: stop.stop_id,
            name: stop.stop_name.trim(),
            lat: lat,
            lng: lng,
            code: stop.stop_code || null
          });
          processedCount++;
        }
      }
    }
    
    console.log(`✅ Loaded ${processedCount} North East bus stops`);
  } catch (error) {
    console.error('❌ Failed to load stops:', error);
    throw error;
  }
}

// Load trips data (for route-shape relationships)
async function loadTrips() {
  try {
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    const tripsData = await fs.readFile(tripsPath, 'utf8');
    
    const parsed = Papa.parse(tripsData, {
      header: true,
      skipEmptyLines: true
    });
    
    parsed.data.forEach(trip => {
      if (trip.route_id && trip.trip_id) {
        gtfsCache.trips.set(trip.trip_id, {
          id: trip.trip_id,
          routeId: trip.route_id,
          shapeId: trip.shape_id || null,
          headsign: trip.trip_headsign?.trim() || null
        });
      }
    });
    
    console.log(`✅ Loaded ${gtfsCache.trips.size} trips`);
  } catch (error) {
    console.error('❌ Failed to load trips:', error);
    throw error;
  }
}

// Enhanced coordinate-based route matching
async function findRoutesNearCoordinate(lat, lng, maxRadius = 500) {
  if (!gtfsCache.isLoaded) {
    const loaded = await loadGTFSData();
    if (!loaded) {
      return { routes: [], confidence: 0, method: 'coordinate', radius: 0 };
    }
  }

  console.log(`🎯 Enhanced coordinate search for ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

  // First, check precise coordinate zones
  const zoneResult = checkCoordinateZones(lat, lng);
  if (zoneResult.routes.length > 0) {
    console.log(`📍 Found ${zoneResult.routes.length} routes in zone: ${zoneResult.description}`);
    return {
      routes: zoneResult.routes,
      confidence: zoneResult.confidence,
      method: 'coordinate_zone',
      radius: 0,
      description: zoneResult.description
    };
  }

  // Then, progressive radius search through bus stops
  for (const radius of SEARCH_CONFIG.COORDINATE_SEARCH_RADII) {
    if (radius > maxRadius) break;
    
    const stopRoutes = await findRoutesNearStops(lat, lng, radius);
    if (stopRoutes.length > 0) {
      console.log(`🚌 Found ${stopRoutes.length} routes within ${radius}m: ${stopRoutes.slice(0, 5).join(', ')}${stopRoutes.length > 5 ? '...' : ''}`);
      
      // Calculate confidence based on radius (closer = higher confidence)
      const confidence = Math.max(0.4, 1 - (radius / 1000));
      
      return {
        routes: stopRoutes.slice(0, SEARCH_CONFIG.MAX_ROUTES_RETURNED),
        confidence: confidence,
        method: 'coordinate_stops',
        radius: radius
      };
    }
  }

  console.log(`❌ No routes found within ${maxRadius}m`);
  return { routes: [], confidence: 0, method: 'coordinate', radius: maxRadius };
}

// Check precise coordinate zones
function checkCoordinateZones(lat, lng) {
  for (const [zoneName, zone] of Object.entries(COORDINATE_ZONES)) {
    if (lat >= zone.bounds.south && lat <= zone.bounds.north &&
        lng >= zone.bounds.west && lng <= zone.bounds.east) {
      return {
        routes: zone.routes,
        confidence: zone.confidence,
        description: zone.description
      };
    }
  }
  return { routes: [], confidence: 0 };
}

// Find routes near bus stops within radius
async function findRoutesNearStops(lat, lng, radius) {
  const nearbyStops = [];
  
  // Find stops within radius
  for (const stop of gtfsCache.stops.values()) {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance <= radius) {
      nearbyStops.push({ ...stop, distance });
    }
  }

  if (nearbyStops.length === 0) {
    return [];
  }

  // Sort by distance
  nearbyStops.sort((a, b) => a.distance - b.distance);

  // Find routes serving these stops
  const routeSet = new Set();
  
  // For now, use stop name patterns to infer routes
  // This could be enhanced with stop_times.txt processing
  for (const stop of nearbyStops.slice(0, 10)) { // Limit to closest 10 stops
    const inferredRoutes = inferRoutesFromStopName(stop.name);
    inferredRoutes.forEach(route => routeSet.add(route));
  }

  return Array.from(routeSet).sort();
}

// Infer routes from stop name patterns (enhanced)
function inferRoutesFromStopName(stopName) {
  const name = stopName.toLowerCase();
  const routes = new Set();

  // Enhanced stop name patterns
  const stopPatterns = {
    'central station': ['Q1', 'Q2', 'Q3', '10', '11', '12', '21', '36'],
    'monument': ['Q1', 'Q2', 'Q3', '10', '11', '12'],
    'gateshead interchange': ['21', '25', '28', '29', '53', '54', '56'],
    'metrocentre': ['21', '25', '28', '29', '100'],
    'coast road': ['1', '2', '306', '307', '308', '309', '311'],
    'sunderland interchange': ['16', '18', '20', '61', '62', 'E1', 'E2'],
    'durham bus station': ['21', '22', 'X21', '6', '7', '13', '14'],
    'washington': ['61', '62', '63', '64', '65', 'X1'],
    'team valley': ['21', '25', '28', '29', '93', '94']
  };

  for (const [pattern, routeList] of Object.entries(stopPatterns)) {
    if (name.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  }

  return Array.from(routes);
}

// Enhanced text-based route matching
function findRoutesFromText(locationText, description = '') {
  const text = `${locationText} ${description}`.toLowerCase();
  const matches = [];

  console.log(`📝 Enhanced text search for: "${text}"`);

  // Check against enhanced route mapping
  for (const [pattern, mapping] of Object.entries(ENHANCED_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      matches.push({
        routes: mapping.routes,
        confidence: mapping.confidence,
        description: mapping.description,
        pattern: pattern
      });
    }
  }

  if (matches.length === 0) {
    console.log(`❌ No text patterns matched`);
    return { routes: [], confidence: 0, method: 'text' };
  }

  // Sort by confidence and combine routes
  matches.sort((a, b) => b.confidence - a.confidence);
  const allRoutes = new Set();
  let maxConfidence = 0;

  matches.forEach(match => {
    match.routes.forEach(route => allRoutes.add(route));
    maxConfidence = Math.max(maxConfidence, match.confidence);
  });

  const finalRoutes = Array.from(allRoutes).sort().slice(0, SEARCH_CONFIG.MAX_ROUTES_RETURNED);
  
  console.log(`✅ Found ${finalRoutes.length} routes from text: ${finalRoutes.join(', ')}`);
  console.log(`🎯 Best match: "${matches[0].pattern}" (confidence: ${matches[0].confidence})`);

  return {
    routes: finalRoutes,
    confidence: maxConfidence,
    method: 'text',
    bestMatch: matches[0].pattern,
    allMatches: matches.map(m => ({ pattern: m.pattern, confidence: m.confidence }))
  };
}

// Main enhanced route matching function
export async function enhancedRouteMatching(location, coordinates = null, description = '') {
  console.log(`🧠 Enhanced route matching for: "${location}"`);
  console.log(`📍 Coordinates: ${coordinates ? `${coordinates[0]}, ${coordinates[1]}` : 'None'}`);

  let results = [];

  // 1. Coordinate-based matching (if coordinates available)
  if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lat, lng] = coordinates;
    if (!isNaN(lat) && !isNaN(lng) && isInNorthEast(lat, lng)) {
      const coordResult = await findRoutesNearCoordinate(lat, lng);
      if (coordResult.routes.length > 0) {
        results.push(coordResult);
      }
    }
  }

  // 2. Text-based matching
  if (location && location.trim() !== '' && location !== 'Location not specified') {
    const textResult = findRoutesFromText(location, description);
    if (textResult.routes.length > 0) {
      results.push(textResult);
    }
  }

  // 3. Combine and rank results
  if (results.length === 0) {
    console.log(`❌ No routes found for: "${location}"`);
    return {
      success: true,
      routes: [],
      confidence: 0,
      method: 'none',
      accuracy: 'none'
    };
  }

  // Sort by confidence and combine
  results.sort((a, b) => b.confidence - a.confidence);
  const bestResult = results[0];
  
  // Combine unique routes from all results
  const allRoutes = new Set();
  results.forEach(result => {
    result.routes.forEach(route => allRoutes.add(route));
  });

  const finalRoutes = Array.from(allRoutes).sort().slice(0, SEARCH_CONFIG.MAX_ROUTES_RETURNED);
  
  // Determine overall accuracy
  let accuracy = 'low';
  if (bestResult.confidence >= SEARCH_CONFIG.HIGH_CONFIDENCE) {
    accuracy = 'high';
  } else if (bestResult.confidence >= SEARCH_CONFIG.MEDIUM_CONFIDENCE) {
    accuracy = 'medium';
  }

  console.log(`🎯 Final result: ${finalRoutes.length} routes, confidence: ${bestResult.confidence.toFixed(2)}, accuracy: ${accuracy}`);
  console.log(`🚌 Routes: ${finalRoutes.join(', ')}`);

  return {
    success: true,
    routes: finalRoutes,
    confidence: bestResult.confidence,
    method: bestResult.method,
    accuracy: accuracy,
    methodDetails: {
      primaryMethod: bestResult.method,
      allMethods: results.map(r => r.method),
      radius: bestResult.radius || null,
      bestMatch: bestResult.bestMatch || null
    }
  };
}

// Initialize the enhanced GTFS system
export async function initializeEnhancedGTFS() {
  console.log('🚀 Initializing Enhanced GTFS Route Matcher...');
  
  const success = await loadGTFSData();
  
  if (success) {
    console.log('✅ Enhanced GTFS Route Matcher ready');
    console.log(`📊 Coverage: ${Object.keys(ENHANCED_ROUTE_MAPPING).length} text patterns, ${Object.keys(COORDINATE_ZONES).length} coordinate zones`);
  } else {
    console.log('❌ Enhanced GTFS Route Matcher initialization failed');
  }
  
  return success;
}

// Get enhanced GTFS statistics
export function getEnhancedGTFSStats() {
  return {
    isLoaded: gtfsCache.isLoaded,
    lastLoaded: gtfsCache.lastLoaded ? new Date(gtfsCache.lastLoaded).toISOString() : null,
    data: {
      stops: gtfsCache.stops.size,
      routes: gtfsCache.routes.size,
      trips: gtfsCache.trips.size
    },
    configuration: {
      textPatterns: Object.keys(ENHANCED_ROUTE_MAPPING).length,
      coordinateZones: Object.keys(COORDINATE_ZONES).length,
      searchRadii: SEARCH_CONFIG.COORDINATE_SEARCH_RADII,
      maxRoutes: SEARCH_CONFIG.MAX_ROUTES_RETURNED
    },
    coverage: {
      bounds: NORTH_EAST_BOUNDS,
      version: 'enhanced'
    }
  };
}

export default {
  enhancedRouteMatching,
  initializeEnhancedGTFS,
  getEnhancedGTFSStats
};
