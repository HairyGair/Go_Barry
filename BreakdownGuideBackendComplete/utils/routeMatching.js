// utils/routeMatching.js
// Enhanced route matching utilities for BARRY
// Now integrates with enhanced route matcher for 75%+ accuracy

import { 
  findRoutesEnhanced, 
  findRoutesNearCoordinateEnhanced, 
  findRoutesByTextEnhanced,
  initializeEnhancedMatcher,
  getEnhancedMatcherStats
} from '../enhanced-route-matcher.js';

// Initialize enhanced matcher on import
let enhancedMatcherInitialized = false;
(async () => {
  try {
    const success = await initializeEnhancedMatcher();
    enhancedMatcherInitialized = success;
    if (success) {
      const stats = getEnhancedMatcherStats();
      console.log(`🚌 Enhanced Route Matcher Ready: ${stats.routes} routes, ${stats.stops} stops`);
    }
  } catch (error) {
    console.warn('⚠️ Enhanced matcher initialization failed, using fallback methods');
  }
})();

// Route mapping data - maps location keywords to bus routes
const LOCATION_ROUTE_MAPPING = {
  'a1': ['21', 'X21', '43', '44', '45'], // Current A1 routes - removed outdated X9, X10, 11
  'a19': ['1', '35', '36', '307', '309'], // FIXED: Removed route '2' - it's Sunderland-Washington via Penshaw, not A19
  'a167': ['21', '22', 'X21', '50', '6'], // Current A167 routes - removed 7
  'a1058': ['1', '307', '309', '317'], // FIXED: Removed route '2' - Coast Road routes corrected
  'a184': ['25', '28', '29'], // Current A184 routes - removed 93, 94
  'a690': ['61', '62', '63'], // Current A690 routes - removed 64, 65
  'a69': ['X85', '684'], // Current A69 routes - removed X84, 602, 685
  'a183': ['16', '20', '61', '62'], // Current A183 routes - removed 18
  'newcastle': ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '29', '47'], // CURRENT Newcastle routes only
  'gateshead': ['21', '27', '28', '29', '51', '52', '53', '54', '56', '57', '58'], // CURRENT Gateshead routes
  'sunderland': ['2', '16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9'], // FIXED: Added route '2' to Sunderland area
  'washington': ['2', '16', '24', '35', '36'], // NEW: Route '2' serves Washington via Penshaw
  'penshaw': ['2'], // NEW: Route '2' specifically serves Penshaw
  'durham': ['21', '22', 'X21', '50', '6'], // CURRENT Durham routes - removed 13, 14
  'tyne tunnel': ['1', '307', '309'], // FIXED: Removed route '2' - tunnel routes corrected
  'coast road': ['1', '307', '309', '317'], // FIXED: Removed route '2' - coast routes corrected
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

// Enhanced coordinate-based route matching with improved accuracy
async function getCurrentRoutesFromCoordinates(lat, lng) {
  // Try enhanced matcher first
  if (enhancedMatcherInitialized) {
    try {
      const enhancedRoutes = await findRoutesNearCoordinateEnhanced(lat, lng, 250);
      if (enhancedRoutes.length > 0) {
        return enhancedRoutes;
      }
    } catch (error) {
      console.warn('⚠️ Enhanced coordinate matching failed, using geographic zones');
    }
  }
  
  // Fallback to geographic zone matching with improved precision
  const routes = [];
  
  // A1 Corridor (more precise bounds)
  if (lng >= -1.75 && lng <= -1.55 && lat >= 54.85 && lat <= 55.15) {
    routes.push('21', 'X21', '43', '44', '45');
  }
  
  // A19 Corridor (tighter bounds) - FIXED: Removed route '2'
  if (lng >= -1.50 && lng <= -1.34 && lat >= 54.94 && lat <= 55.06) {
    routes.push('1', '35', '36', '307', '309');
  }
  
  // Newcastle City Centre (very precise)
  if (lng >= -1.63 && lng <= -1.57 && lat >= 54.96 && lat <= 55.00) {
    routes.push('Q3', 'Q3X', '10', '10A', '10B', '12');
  }
  
  // Coast Road Area (refined) - FIXED: Removed route '2'
  if (lng >= -1.48 && lng <= -1.32 && lat >= 54.99 && lat <= 55.07) {
    routes.push('1', '307', '309', '317');
  }
  
  // A167 Corridor (Gateshead/Durham)
  if (lng >= -1.68 && lng <= -1.48 && lat >= 54.88 && lat <= 54.98) {
    routes.push('21', '22', 'X21', '6', '50');
  }
  
  // Sunderland Area (more precise) - FIXED: Added route '2'
  if (lng >= -1.45 && lng <= -1.25 && lat >= 54.87 && lat <= 54.93) {
    routes.push('2', '16', '20', '24', '35', '36', '61', '62', '63');
  }
  
  // Washington/Penshaw Area (NEW) - Route '2' corridor
  if (lng >= -1.50 && lng <= -1.40 && lat >= 54.88 && lat <= 54.92) {
    routes.push('2', '16', '24', '35', '36');
  }
  
  // Western Routes (Hexham/Consett area)
  if (lng >= -2.0 && lng <= -1.6 && lat >= 54.8 && lat <= 55.1) {
    routes.push('X30', 'X31', 'X70', 'X71', 'X85');
  }
  
  // Cramlington/Blyth area
  if (lng >= -1.65 && lng <= -1.45 && lat >= 55.05 && lat <= 55.15) {
    routes.push('43', '44', '45', '52');
  }
  
  return [...new Set(routes)].sort();
}

// Filter function to check if location is in Go North East operational area
function isInNorthEast(location, description = '', coordinates = null) {
  // Go North East geographic bounds (from geographicBounds.js)
  const GNE_BOUNDS = {
    north: 55.042571,  // Whitley Bay (northernmost stop)
    south: 54.755372,  // Brandon (southernmost stop) 
    east: -1.382834,   // Sunderland area (easternmost)
    west: -2.095787    // Hexham (westernmost stop)
  };
  
  // If coordinates are provided, use strict geographic filtering
  if (coordinates && Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lat, lng] = coordinates;
    if (lat && lng) {
      const withinBounds = lat >= GNE_BOUNDS.south && 
                          lat <= GNE_BOUNDS.north && 
                          lng >= GNE_BOUNDS.west && 
                          lng <= GNE_BOUNDS.east;
      
      console.log(`📍 Coordinate check: ${lat}, ${lng} -> ${withinBounds ? 'INSIDE' : 'OUTSIDE'} GNE bounds`);
      return withinBounds;
    }
  }
  
  // Fallback to text-based filtering with strict keywords
  const text = `${location} ${description}`.toUpperCase();
  
  // STRICT keyword list - only core GNE area identifiers
  const strictKeywords = [
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'WASHINGTON',
    'CONSETT', 'STANLEY', 'CHESTER-LE-STREET', 'HEXHAM', 'CRAMLINGTON',
    'BLYTH', 'ASHINGTON', 'WHITLEY BAY', 'TYNEMOUTH', 'WALLSEND',
    'GOSFORTH', 'JESMOND', 'HEATON', 'BYKER', 'WALKER',
    'TYNE AND WEAR', 'NORTHUMBERLAND', 'COUNTY DURHAM'
  ];
  
  // Major roads in GNE area
  const gneRoads = [
    'A1 NEWCASTLE', 'A19 SUNDERLAND', 'A69 HEXHAM', 'A167 DURHAM',
    'A184 GATESHEAD', 'A690 DURHAM', 'A1058 COAST ROAD'
  ];
  
  // Check strict keywords
  const hasStrictKeyword = strictKeywords.some(keyword => text.includes(keyword));
  const hasGNERoad = gneRoads.some(road => text.includes(road));
  
  if (hasStrictKeyword || hasGNERoad) {
    console.log(`✅ Text match: "${location}" -> ACCEPTED (GNE area)`);
    return true;
  }
  
  console.log(`❌ Text match: "${location}" -> REJECTED (outside GNE area)`);
  return false;
}

// Enhanced route matching that combines multiple techniques for higher accuracy
async function matchRoutesToLocation(location, lat, lng) {
  // Try enhanced matcher first for maximum accuracy
  if (enhancedMatcherInitialized) {
    try {
      const enhancedRoutes = await findRoutesEnhanced(lat, lng, location, '');
      if (enhancedRoutes.length > 0) {
        console.log(`🎯 Enhanced matching found ${enhancedRoutes.length} routes for ${location}`);
        return enhancedRoutes;
      }
    } catch (error) {
      console.warn('⚠️ Enhanced matching failed, falling back to legacy methods:', error.message);
    }
  }
  
  // Fallback to legacy matching
  const routes = new Set();
  
  // Get routes from text-based matching
  const textRoutes = matchRoutes(location);
  textRoutes.forEach(route => routes.add(route));
  
  // Get routes from coordinate-based matching
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    const coordRoutes = getCurrentRoutesFromCoordinates(lat, lng);
    coordRoutes.forEach(route => routes.add(route));
  }
  
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