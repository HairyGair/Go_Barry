// utils/helpers.js
// Helper utility functions

// Calculate distance between two coordinates in meters
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // Distance in meters
  return distance;
}

// Format coordinates for display
export function formatCoordinates(lat, lng, precision = 4) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return 'Invalid coordinates';
  }
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

// Check if coordinates are within a bounding box
export function isWithinBounds(lat, lng, bounds) {
  if (!lat || !lng || !bounds) return false;
  
  const { north, south, east, west } = bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

// Convert degrees to radians
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

export default {
  calculateDistance,
  formatCoordinates,
  isWithinBounds,
  toRadians,
  toDegrees
};
