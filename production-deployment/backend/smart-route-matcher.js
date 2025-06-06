// backend/smart-route-matcher.js
// Accurate route matching using street names and precise coordinates

console.log('🗺️ Smart Route Matcher Loading...');

// Go North East routes mapped to actual roads they use
const ROUTE_TO_ROADS_MAPPING = {
  // Major A-road routes
  'A1': ['21', 'X21', '10', '11'],
  'A19': ['1', '2', '308', '309'],
  'A167': ['21', '22', 'X21', '6', '7'],
  'A1058': ['1', '2', '308', '309', '311', '317'],
  'A184': ['25', '28', '29', '93', '94'],
  'A690': ['61', '62', '63', '64', '65'],
  'A69': ['X84', 'X85', '602', '685'],
  'A183': ['16', '18', '20', '61', '62'],
  
  // Specific streets in Newcastle
  'Grey Street': ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
  'Grainger Street': ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
  'Collingwood Street': ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
  'Northumberland Street': ['10', '11', '12', '39', '40'],
  'Clayton Street': ['Q1', 'Q2', 'Q3'],
  'Pilgrim Street': ['Q1', 'Q2', 'Q3', '10', '11'],
  'Blackett Street': ['10', '11', '12', '39', '40'],
  
  // Gateshead
  'High Street': ['21', '25', '28', '29'], // Gateshead High Street
  'West Street': ['21', '25', '28', '29'],
  'Jackson Street': ['21', '25', '28', '29'],
  
  // Durham Road corridor
  'Durham Road': ['21', '22', 'X21', '6', '7'],
  'Front Street': ['21', '22', 'X21'], // Various Front Streets
  
  // Coast Road
  'Coast Road': ['1', '2', '308', '309', '311', '317'],
  'Tynemouth Road': ['1', '2', '308', '309'],
  
  // Sunderland area
  'High Street West': ['16', '18', '20', '61', '62'],
  'Fawcett Street': ['16', '18', '20', '61', '62'],
  'John Street': ['16', '18', '20'],
  
  // Washington
  'Washington Highway': ['61', '62', '63', '64', '65'],
  'Wessington Way': ['61', '62', '63', '64', '65'],
  
  // Specific local roads
  'Wrekenton': ['25', '28', '29'],
  'Team Valley': ['21', '25', '28', '29'],
  'MetroCentre': ['21', '25', '28', '29'],
  'Blaydon': ['X84', 'X85'],
  'Prudhoe': ['X84', 'X85'],
  'Hexham': ['X84', 'X85', '602', '685']
};

// Precise coordinate zones for major interchanges/areas
const COORDINATE_ZONES = {
  // Newcastle City Centre (very precise)
  newcastle_city_centre: {
    bounds: { north: 54.9800, south: 54.9650, east: -1.6000, west: -1.6250 },
    routes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12']
  },
  
  // Gateshead Interchange
  gateshead_interchange: {
    bounds: { north: 54.9650, south: 54.9550, east: -1.5950, west: -1.6100 },
    routes: ['21', '25', '28', '29', '53', '54', '56']
  },
  
  // Tyne Tunnel Plaza
  tyne_tunnel: {
    bounds: { north: 54.9900, south: 54.9800, east: -1.4550, west: -1.4700 },
    routes: ['1', '2', '308', '309']
  },
  
  // MetroCentre area
  metro_centre: {
    bounds: { north: 54.9600, south: 54.9500, east: -1.6700, west: -1.6850 },
    routes: ['21', '25', '28', '29']
  },
  
  // Team Valley
  team_valley: {
    bounds: { north: 54.9500, south: 54.9400, east: -1.6650, west: -1.6800 },
    routes: ['21', '25', '28', '29']
  }
};

// Smart route matching function
export function getSmartRouteMatching(location, lat, lng) {
  const matchedRoutes = new Set();
  
  console.log(`🧠 Smart route matching for: "${location}" at ${lat}, ${lng}`);
  
  // 1. Street name matching (most accurate)
  const locationUpper = location.toUpperCase();
  
  for (const [roadPattern, routes] of Object.entries(ROUTE_TO_ROADS_MAPPING)) {
    if (locationUpper.includes(roadPattern.toUpperCase())) {
      routes.forEach(route => matchedRoutes.add(route));
      console.log(`✅ Street match: "${roadPattern}" → routes: ${routes.join(', ')}`);
    }
  }
  
  // 2. Precise coordinate zone matching
  if (lat && lng) {
    for (const [zoneName, zone] of Object.entries(COORDINATE_ZONES)) {
      if (lat >= zone.bounds.south && lat <= zone.bounds.north &&
          lng >= zone.bounds.west && lng <= zone.bounds.east) {
        zone.routes.forEach(route => matchedRoutes.add(route));
        console.log(`📍 Zone match: "${zoneName}" → routes: ${zone.routes.join(', ')}`);
      }
    }
  }
  
  // 3. Major road corridor matching (only for A-roads)
  if (lat && lng && matchedRoutes.size === 0) {
    // A1 corridor (very specific)
    if (locationUpper.includes('A1') || 
        (lng >= -1.65 && lng <= -1.55 && lat >= 54.90 && lat <= 55.10)) {
      ['21', 'X21'].forEach(route => matchedRoutes.add(route));
      console.log(`🛣️ A1 corridor match → routes: 21, X21`);
    }
    
    // A19 corridor (very specific)
    if (locationUpper.includes('A19') || 
        (lng >= -1.47 && lng <= -1.45 && lat >= 54.98 && lat <= 55.00)) {
      ['1', '2', '308', '309'].forEach(route => matchedRoutes.add(route));
      console.log(`🛣️ A19 corridor match → routes: 1, 2, 308, 309`);
    }
  }
  
  const finalRoutes = Array.from(matchedRoutes).sort();
  
  if (finalRoutes.length === 0) {
    console.log(`⚠️ No route matches found for: "${location}"`);
  } else {
    console.log(`🎯 Final route matches: ${finalRoutes.join(', ')}`);
  }
  
  return finalRoutes;
}

// Get route confidence score
export function getRouteMatchConfidence(location, routes) {
  if (routes.length === 0) return 'none';
  
  const locationUpper = location.toUpperCase();
  
  // High confidence: exact street/road name match
  for (const roadPattern of Object.keys(ROUTE_TO_ROADS_MAPPING)) {
    if (locationUpper.includes(roadPattern.toUpperCase())) {
      return 'high';
    }
  }
  
  // Medium confidence: coordinate-based match
  if (routes.length > 0) return 'medium';
  
  return 'low';
}

export default getSmartRouteMatching;