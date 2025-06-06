// utils/routeMatching.js
// Route matching utilities for BARRY
// Matches traffic incidents to Go North East bus routes

// Route mapping data - maps location keywords to bus routes
const LOCATION_ROUTE_MAPPING = {
  'a1': ['21', 'X21', '43', '44', '45'], // Current A1 routes - removed outdated X9, X10, 11
  'a19': ['1', '2', '35', '36', '307', '309'], // Current A19 routes - removed outdated X7, X8, 19
  'a167': ['21', '22', 'X21', '50', '6'], // Current A167 routes - removed 7
  'a1058': ['1', '2', '307', '309', '317'], // Current Coast Road routes - removed 308, 311
  'a184': ['25', '28', '29'], // Current A184 routes - removed 93, 94
  'a690': ['61', '62', '63'], // Current A690 routes - removed 64, 65
  'a69': ['X85', '684'], // Current A69 routes - removed X84, 602, 685
  'a183': ['16', '20', '61', '62'], // Current A183 routes - removed 18
  'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47'], // CURRENT Newcastle routes only
  'gateshead': ['21', '27', '28', '29', '51', '52', '53', '54', '56', '57', '58'], // CURRENT Gateshead routes
  'sunderland': ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9'], // CURRENT Sunderland routes
  'durham': ['21', '22', 'X21', '50', '6'], // CURRENT Durham routes - removed 13, 14
  'tyne tunnel': ['1', '2', '307', '309'], // CURRENT tunnel routes - removed 308, 311
  'coast road': ['1', '2', '307', '309', '317'], // CURRENT coast routes - removed 308, 311
  'central motorway': ['Q3', 'Q3X', '10', '12', '21', '22'] // CURRENT city routes - removed Q1, Q2, QUAYSIDE
};

// Text-based route matching using location keywords
function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  for (const [pattern, routeList] of Object.entries(LOCATION_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  return Array.from(routes).sort();
}

// Coordinate-based route matching using geographic boundaries
function getCurrentRoutesFromCoordinates(lat, lng) {
  const routes = [];
  
  // A1 Corridor
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    routes.push('21', 'X21', '43', '44', '45');
  }
  
  // A19 Corridor
  if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    routes.push('1', '2', '307', '309');
  }
  
  // Newcastle City Centre
  if (lng >= -1.65 && lng <= -1.55 && lat >= 54.95 && lat <= 55.0) {
    routes.push('Q3', 'Q3X', '10', '10A', '10B', '12');
  }
  
  // Coast Road Area
  if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0 && lat <= 55.1) {
    routes.push('1', '2', '307', '309', '317');
  }
  
  // A167 Corridor
  if (lng >= -1.65 && lng <= -1.45 && lat >= 54.85 && lat <= 54.95) {
    routes.push('21', '22', 'X21', '6');
  }
  
  // Sunderland Area
  if (lng >= -1.5 && lng <= -1.2 && lat >= 54.85 && lat <= 54.95) {
    routes.push('16', '20', '24', '35', '36', '61', '62', '63');
  }
  
  // Western Routes (Hexham/Consett area)
  if (lng >= -2.0 && lng <= -1.6 && lat >= 54.8 && lat <= 55.1) {
    routes.push('X30', 'X31', 'X70', 'X71', 'X85');
  }
  
  return [...new Set(routes)].sort();
}

// Filter function to check if location is in North East England
function isInNorthEast(location, description = '') {
  // If no location info at all, assume it's relevant
  if (!location && !description) return true;
  
  const text = `${location} ${description}`.toUpperCase();
  
  // If it mentions coordinates or lat/lng, accept it
  if (text.includes('LAT') || text.includes('LNG') || text.includes('54.') || text.includes('55.')) {
    return true;
  }
  
  // Simplified keyword list - just major identifiers
  const keywords = [
    'A1', 'A19', 'A69', 'A167', 'A184', 'A690', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM',
    'NORTHUMBERLAND', 'TYNE', 'WEAR'
  ];
  
  // If ANY keyword matches, include it
  const hasKeyword = keywords.some(keyword => text.includes(keyword));
  
  // If we already filtered by bounding box (MapQuest), trust that filtering
  if (!hasKeyword && description.includes('MAPQUEST')) {
    return true; // Trust MapQuest's geographic filtering
  }
  
  return hasKeyword;
}

// Enhanced route matching that combines location and coordinates
function matchRoutesToLocation(location, lat, lng) {
  const routes = new Set();
  
  // Get routes from text-based matching
  const textRoutes = matchRoutes(location);
  textRoutes.forEach(route => routes.add(route));
  
  // Get routes from coordinate-based matching
  const coordRoutes = getCurrentRoutesFromCoordinates(lat, lng);
  coordRoutes.forEach(route => routes.add(route));
  
  return Array.from(routes).sort();
}

// Wrapper functions for backward compatibility

// Simple wrapper for getCurrentRoutesFromCoordinates
function getRoutesFromCoordinates(lat, lng) {
  return getCurrentRoutesFromCoordinates(lat, lng);
}

// TomTom-specific wrapper (currently identical to base function)
function getTomTomRoutesFromCoordinates(lat, lng) {
  return getCurrentRoutesFromCoordinates(lat, lng);
}

// Text-based route matching with regional context
function getCurrentRoutesFromText(text, region) {
  const routes = matchRoutes(text);
  return routes;
}

// Regional route matching helper
function getRegionalRoutes(lat, lng, region) {
  const coordRoutes = getCurrentRoutesFromCoordinates(lat, lng);
  return coordRoutes;
}

// Regional text-based route matching
function getRegionalRoutesFromText(text, region) {
  const routes = getCurrentRoutesFromText(text, region);
  return routes;
}

export {
  LOCATION_ROUTE_MAPPING,
  matchRoutes,
  getCurrentRoutesFromCoordinates,
  isInNorthEast,
  matchRoutesToLocation,
  getRoutesFromCoordinates,
  getTomTomRoutesFromCoordinates,
  getCurrentRoutesFromText,
  getRegionalRoutes,
  getRegionalRoutesFromText
};

export default {
  LOCATION_ROUTE_MAPPING,
  matchRoutes,
  getCurrentRoutesFromCoordinates,
  isInNorthEast,
  matchRoutesToLocation,
  getRoutesFromCoordinates,
  getTomTomRoutesFromCoordinates,
  getCurrentRoutesFromText,
  getRegionalRoutes,
  getRegionalRoutesFromText
};