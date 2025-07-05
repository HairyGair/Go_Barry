/**
 * Geographic Utilities
 * Helper functions for geographic calculations and location processing
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Find nearby locations within a radius
 * @param {Object} center - Center point {lat, lng}
 * @param {Array} locations - Array of locations with lat/lng
 * @param {number} radius - Search radius in meters
 * @returns {Array} Array of nearby locations with distances
 */
export function findNearbyLocations(center, locations, radius = 1000) {
  return locations
    .map(location => ({
      ...location,
      distance: calculateDistance(
        center.lat, center.lng,
        location.lat, location.lng
      )
    }))
    .filter(location => location.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Radians to convert
 * @returns {number} Degrees
 */
export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Check if a point is within a bounding box
 * @param {Object} point - Point {lat, lng}
 * @param {Object} bounds - Bounding box {north, south, east, west}
 * @returns {boolean} True if point is within bounds
 */
export function isPointInBounds(point, bounds) {
  return point.lat >= bounds.south &&
         point.lat <= bounds.north &&
         point.lng >= bounds.west &&
         point.lng <= bounds.east;
}

/**
 * Calculate bounding box for a center point and radius
 * @param {Object} center - Center point {lat, lng}
 * @param {number} radius - Radius in meters
 * @returns {Object} Bounding box {north, south, east, west}
 */
export function getBoundingBox(center, radius) {
  const latDelta = radius / 111320; // Approximate meters per degree latitude
  const lngDelta = radius / (111320 * Math.cos(toRadians(center.lat)));
  
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta
  };
}

/**
 * Calculate bearing from one point to another
 * @param {Object} from - Starting point {lat, lng}
 * @param {Object} to - Ending point {lat, lng}
 * @returns {number} Bearing in degrees (0-360)
 */
export function calculateBearing(from, to) {
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Check if coordinates are valid
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export function isValidCoordinate(lat, lng) {
  return typeof lat === 'number' && 
         typeof lng === 'number' &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180 &&
         !isNaN(lat) && !isNaN(lng);
}

/**
 * Check if location is in North East England (Go North East service area)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if in service area
 */
export function isNorthEastLocation(lat, lng) {
  // Approximate bounds for North East England
  const bounds = {
    north: 55.5,   // Northumberland border
    south: 54.5,   // County Durham border
    east: -1.2,    // North Sea coast
    west: -2.5     // Pennines
  };
  
  return isPointInBounds({ lat, lng }, bounds);
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places
 * @returns {string} Formatted coordinates
 */
export function formatCoordinates(lat, lng, precision = 4) {
  if (!isValidCoordinate(lat, lng)) {
    return 'Invalid coordinates';
  }
  
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Calculate midpoint between two coordinates
 * @param {Object} point1 - First point {lat, lng}
 * @param {Object} point2 - Second point {lat, lng}
 * @returns {Object} Midpoint {lat, lng}
 */
export function calculateMidpoint(point1, point2) {
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const Bx = Math.cos(lat2) * Math.cos(dLng);
  const By = Math.cos(lat2) * Math.sin(dLng);
  
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );
  
  const lng3 = toRadians(point1.lng) + Math.atan2(By, Math.cos(lat1) + Bx);
  
  return {
    lat: toDegrees(lat3),
    lng: toDegrees(lng3)
  };
}

export default {
  calculateDistance,
  findNearbyLocations,
  isPointInBounds,
  getBoundingBox,
  calculateBearing,
  isValidCoordinate,
  isNorthEastLocation,
  formatCoordinates,
  calculateMidpoint
};