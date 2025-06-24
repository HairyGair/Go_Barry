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
 * Enhanced route matching combining coordinates and text
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationText - Location description
 * @param {number} radius - Search radius in meters
 * @returns {string[]} Array of affected route names
 */
export async function findAffectedRoutesEnhanced(lat, lng, locationText, radius = 250) {
  try {
    const routes = new Set();
    
    // Get routes from coordinates
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const coordRoutes = await findAffectedRoutes(lat, lng, radius);
      coordRoutes.forEach(route => routes.add(route));
    }
    
    // Get routes from text
    if (locationText) {
      const textRoutes = findRoutesByLocation(locationText);
      textRoutes.forEach(route => routes.add(route));
    }
    
    return Array.from(routes).sort();
  } catch (error) {
    console.error('Error in enhanced route matching:', error);
    return [];
  }
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