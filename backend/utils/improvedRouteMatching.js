// utils/improvedRouteMatching.js
// Improved route matching with coordinate-based logic

// Go North East route data with coordinate coverage areas
const GO_NORTH_EAST_ROUTES = {
  // Major Bus Routes with Geographic Coverage Areas
  'Q3': {
    name: 'Quayside - City Centre',
    coordinates: { lat: 54.9783, lng: -1.6178 },
    radius: 5000, // 5km
    keywords: ['quayside', 'newcastle', 'city centre', 'central station', 'grainger street']
  },
  'Q3X': {
    name: 'Quayside Express',
    coordinates: { lat: 54.9783, lng: -1.6178 },
    radius: 5000,
    keywords: ['quayside', 'newcastle', 'city centre', 'express']
  },
  '21': {
    name: 'Newcastle - Durham',
    coordinates: { lat: 54.9140, lng: -1.5830 },
    radius: 15000, // 15km along A167
    keywords: ['a167', 'chester le street', 'birtley', 'durham', 'gateshead', 'newcastle', 'angel of the north']
  },
  'X21': {
    name: 'Newcastle - Durham Express',
    coordinates: { lat: 54.9140, lng: -1.5830 },
    radius: 15000,
    keywords: ['a167', 'chester le street', 'birtley', 'durham', 'express']
  },
  '10': {
    name: 'Gateshead - Newcastle',
    coordinates: { lat: 54.9627, lng: -1.6039 },
    radius: 8000,
    keywords: ['gateshead', 'newcastle', 'metrocentre', 'sage', 'baltic']
  },
  '10A': {
    name: 'Gateshead - Newcastle via Teams',
    coordinates: { lat: 54.9627, lng: -1.6039 },
    radius: 8000,
    keywords: ['gateshead', 'newcastle', 'teams', 'metrocentre']
  },
  '10B': {
    name: 'Gateshead - Newcastle via Lobley Hill',
    coordinates: { lat: 54.9627, lng: -1.6039 },
    radius: 10000,
    keywords: ['gateshead', 'newcastle', 'lobley hill', 'metrocentre']
  },
  '1': {
    name: 'Whitley Bay - Newcastle',
    coordinates: { lat: 55.0423, lng: -1.4432 },
    radius: 20000,
    keywords: ['whitley bay', 'newcastle', 'a19', 'coast road', 'blyth', 'wansbeck']
  },
  '2': {
    name: 'Wansbeck - Newcastle',
    coordinates: { lat: 55.1500, lng: -1.5000 },
    radius: 25000,
    keywords: ['wansbeck', 'newcastle', 'a19', 'cramlington', 'blyth']
  },
  '56': {
    name: 'Sunderland - Newcastle',
    coordinates: { lat: 54.9400, lng: -1.4500 },
    radius: 18000,
    keywords: ['sunderland', 'newcastle', 'a19', 'washington', 'heworth']
  },
  '16': {
    name: 'Sunderland City Services',
    coordinates: { lat: 54.9069, lng: -1.3838 },
    radius: 8000,
    keywords: ['sunderland', 'park lane', 'city centre', 'roker', 'seaburn']
  },
  '20': {
    name: 'Sunderland - Houghton',
    coordinates: { lat: 54.9069, lng: -1.3838 },
    radius: 12000,
    keywords: ['sunderland', 'houghton', 'hetton', 'easington lane']
  },
  'X30': {
    name: 'Newcastle - Consett',
    coordinates: { lat: 54.8500, lng: -1.8300 },
    radius: 20000,
    keywords: ['consett', 'newcastle', 'a693', 'stanley', 'burnopfield']
  },
  'X31': {
    name: 'Newcastle - Consett Express',
    coordinates: { lat: 54.8500, lng: -1.8300 },
    radius: 20000,
    keywords: ['consett', 'newcastle', 'express', 'stanley']
  },
  '307': {
    name: 'Newcastle - Tynemouth',
    coordinates: { lat: 55.0174, lng: -1.4234 },
    radius: 15000,
    keywords: ['tynemouth', 'newcastle', 'north shields', 'fish quay', 'coast road']
  },
  '309': {
    name: 'Newcastle - Blyth',
    coordinates: { lat: 55.1267, lng: -1.5085 },
    radius: 25000,
    keywords: ['blyth', 'newcastle', 'cramlington', 'wansbeck', 'a19']
  }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

// Improved coordinate-based route matching
export function findRoutesNearCoordinates(lat, lng, maxRadius = 500) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.log('🚌 Invalid coordinates for route matching');
    return [];
  }
  
  const matchedRoutes = [];
  
  console.log(`🚌 Finding routes near ${lat}, ${lng} within ${maxRadius}m...`);
  
  for (const [routeNumber, routeData] of Object.entries(GO_NORTH_EAST_ROUTES)) {
    const distance = calculateDistance(
      lat, lng,
      routeData.coordinates.lat, routeData.coordinates.lng
    );
    
    // Check if coordinate is within route's service area
    if (distance <= routeData.radius) {
      matchedRoutes.push({
        route: routeNumber,
        distance: Math.round(distance),
        method: 'coordinate_proximity',
        routeName: routeData.name
      });
      console.log(`✅ Route ${routeNumber} matches (${Math.round(distance)}m from route center)`);
    }
  }
  
  // Sort by distance and return just route numbers
  const sortedRoutes = matchedRoutes
    .sort((a, b) => a.distance - b.distance)
    .map(match => match.route);
  
  console.log(`🎯 Found ${sortedRoutes.length} routes: ${sortedRoutes.join(', ')}`);
  return sortedRoutes;
}

// Enhanced text-based route matching
export function findRoutesFromText(location, description = '') {
  const text = `${location} ${description}`.toLowerCase();
  const matchedRoutes = [];
  
  console.log(`🔍 Text-based route matching for: "${text}"`);
  
  for (const [routeNumber, routeData] of Object.entries(GO_NORTH_EAST_ROUTES)) {
    const keywords = routeData.keywords;
    
    // Check if any keywords match
    const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    
    if (matches.length > 0) {
      matchedRoutes.push({
        route: routeNumber,
        matches: matches,
        method: 'text_keyword',
        routeName: routeData.name
      });
      console.log(`✅ Route ${routeNumber} matches keywords: ${matches.join(', ')}`);
    }
  }
  
  const routes = matchedRoutes.map(match => match.route);
  console.log(`🎯 Text matching found ${routes.length} routes: ${routes.join(', ')}`);
  return routes;
}

// Combined route matching - try coordinates first, then text
export function findAffectedRoutes(location, coordinates = null, description = '') {
  let routes = [];
  let method = 'none';
  
  // Try coordinate-based matching first
  if (coordinates && coordinates.lat && coordinates.lng) {
    routes = findRoutesNearCoordinates(coordinates.lat, coordinates.lng, 1000);
    if (routes.length > 0) {
      method = 'coordinate_based';
    }
  }
  
  // Fall back to text-based matching if no coordinate matches
  if (routes.length === 0 && location) {
    routes = findRoutesFromText(location, description);
    if (routes.length > 0) {
      method = 'text_based';
    }
  }
  
  console.log(`🚌 Route matching complete: ${routes.length} routes found using ${method} method`);
  
  return {
    routes: routes,
    method: method,
    count: routes.length
  };
}

export default {
  findRoutesNearCoordinates,
  findRoutesFromText,
  findAffectedRoutes
};