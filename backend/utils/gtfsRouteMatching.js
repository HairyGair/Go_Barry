// backend/utils/gtfsRouteMatching.js
// Enhanced route matching using GTFS data
// Provides accurate affected route identification for alerts and roadworks

import gtfsService from '../services/gtfsService.js';

// Cache for performance
const routeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Find routes affected by an incident at given coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Search radius in meters (optional)
 * @returns {string[]} Array of affected route names
 */
export async function findAffectedRoutes(lat, lng, radius = 250) {
  try {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.routes;
    }
    
    // Get routes from GTFS service
    const routes = await gtfsService.findAffectedRoutes(lat, lng, radius);
    
    // Cache the result
    routeCache.set(cacheKey, {
      routes: routes,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (routeCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of routeCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          routeCache.delete(key);
        }
      }
    }
    
    return routes;
  } catch (error) {
    console.error('Error finding affected routes:', error);
    return [];
  }
}

/**
 * Find routes by location text
 * @param {string} locationText - Location description
 * @returns {string[]} Array of route names
 */
export function findRoutesByLocation(locationText) {
  try {
    return gtfsService.findRoutesByText(locationText);
  } catch (error) {
    console.error('Error finding routes by location:', error);
    return [];
  }
}

/**
 * Enhanced route matching combining coordinates and text with intelligent scoring
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationText - Location description
 * @param {number} radius - Search radius in meters
 * @returns {string[]} Array of affected route names
 */
export async function findAffectedRoutesEnhanced(lat, lng, locationText, radius = 250) {
  try {
    const routeScores = new Map(); // route -> combined score
    
    // Get routes from coordinates with confidence scores
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const coordRoutes = await findAffectedRoutes(lat, lng, radius);
      coordRoutes.forEach((route, index) => {
        // Higher score for routes found earlier (more confident)
        const coordScore = 2.0 - (index * 0.1);
        routeScores.set(route, coordScore);
      });
    }
    
    // Get routes from text with scoring
    if (locationText) {
      const textRoutes = findRoutesByLocation(locationText);
      textRoutes.forEach((route, index) => {
        // Combine with coordinate score if exists
        const textScore = 1.5 - (index * 0.05);
        const existingScore = routeScores.get(route) || 0;
        
        // Boost routes that match both coordinate and text
        const combinedScore = existingScore > 0 ? 
          existingScore + textScore + 0.5 : // Bonus for dual match
          textScore;
        
        routeScores.set(route, combinedScore);
      });
    }
    
    // Apply validation filters
    const validatedRoutes = new Map();
    for (const [route, score] of routeScores.entries()) {
      if (isValidRouteForLocation(route, lat, lng, locationText)) {
        validatedRoutes.set(route, score);
      }
    }
    
    // Sort by combined score and return top matches
    const sortedRoutes = Array.from(validatedRoutes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12) // Limit to top 12 most relevant
      .map(([route]) => route);
    
    return sortedRoutes;
  } catch (error) {
    console.error('Error in enhanced route matching:', error);
    return [];
  }
}

/**
 * Validate if a route is reasonable for the given location
 * @param {string} route - Route name
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @param {string} locationText - Location description
 * @returns {boolean} True if route is valid for location
 */
function isValidRouteForLocation(route, lat, lng, locationText) {
  // Remove obviously invalid routes
  const invalidRoutes = ['643', '644', '794', '842', '898']; // School/works services
  if (invalidRoutes.includes(route)) {
    return false;
  }
  
  // Geographic validation
  if (lat && lng) {
    // Newcastle area - expect major Newcastle routes
    if (lat > 54.95 && lat < 55.05 && lng > -1.7 && lng < -1.5) {
      const newcastleRoutes = ['Q3', 'Q3X', '10', '21', '22', '1', '12', '47', '53', '54', '27', '28'];
      if (!newcastleRoutes.includes(route) && !route.startsWith('X')) {
        // Allow X routes and common routes, filter out distant area routes
        const distantRoutes = ['61', '62', '63', '16', '20', '35', '36'];
        if (distantRoutes.includes(route)) return false;
      }
    }
    
    // Sunderland area - expect Sunderland routes
    if (lat > 54.85 && lat < 54.95 && lng > -1.45 && lng < -1.2) {
      const sunderlandRoutes = ['16', '20', '61', '62', '35', '36', '56', '57', '2', '4'];
      if (!sunderlandRoutes.includes(route) && !['X20', 'X21'].includes(route)) {
        return false;
      }
    }
  }
  
  // Text-based validation
  if (locationText) {
    const lowerText = locationText.toLowerCase();
    
    // Metro Centre should not have Sunderland routes
    if (lowerText.includes('metro centre')) {
      const sunderlandRoutes = ['16', '20', '61', '62', '35', '36'];
      if (sunderlandRoutes.includes(route)) return false;
    }
    
    // Durham should not have North Tyneside routes
    if (lowerText.includes('durham')) {
      const northTynesideRoutes = ['307', '309', '317', '327', '352', '353', '354', '355', '356'];
      if (northTynesideRoutes.includes(route)) return false;
    }
  }
  
  return true;
}

/**
 * Get detailed information about a route
 * @param {string} routeName - Route short name (e.g., "21", "X21")
 * @returns {Object|null} Route details including stops
 */
export function getRouteDetails(routeName) {
  try {
    return gtfsService.getRouteDetails(routeName);
  } catch (error) {
    console.error('Error getting route details:', error);
    return null;
  }
}

/**
 * Get GTFS service statistics
 * @returns {Object} Statistics about loaded GTFS data
 */
export function getGTFSStats() {
  return gtfsService.getStats();
}

/**
 * Check if GTFS service is ready
 * @returns {boolean} True if initialized
 */
export function isGTFSReady() {
  return gtfsService.initialized;
}

// Export all functions
export default {
  findAffectedRoutes,
  findRoutesByLocation,
  findAffectedRoutesEnhanced,
  getRouteDetails,
  getGTFSStats,
  isGTFSReady
};