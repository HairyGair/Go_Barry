/**
 * Location Service - Converts coordinates to readable location names
 * Provides reverse geocoding and landmark detection for Go North East operations
 *
 * Features:
 * - Landmark proximity detection
 * - Major road/junction identification
 * - Transport hub recognition
 * - Shopping centre and depot location mapping
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

/**
 * Calculate the distance between two coordinate points using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in decimal degrees
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Convert to decimal degrees for easier threshold comparison
  return distance / 111; // Approximately 111km per degree
};

/**
 * Comprehensive landmark database for Go North East operational area
 * Covers Newcastle, Gateshead, Sunderland, Durham, and surrounding areas
 */
const landmarks = [
  // Transport Hubs & Interchanges
  { name: 'Gateshead Interchange', lat: 54.9611, lng: -1.5797, radius: 0.002, type: 'transport_hub' },
  { name: 'Eldon Square Bus Station', lat: 54.9764, lng: -1.6144, radius: 0.002, type: 'transport_hub' },
  { name: 'Central Station', lat: 54.9684, lng: -1.6176, radius: 0.002, type: 'transport_hub' },
  { name: 'Haymarket Bus Station', lat: 54.9743, lng: -1.6103, radius: 0.002, type: 'transport_hub' },
  { name: 'Park Lane Interchange (Sunderland)', lat: 54.9085, lng: -1.3830, radius: 0.003, type: 'transport_hub' },
  { name: 'Durham Bus Station', lat: 54.7761, lng: -1.5733, radius: 0.002, type: 'transport_hub' },
  { name: 'Chester-le-Street Bus Station', lat: 54.8570, lng: -1.5707, radius: 0.002, type: 'transport_hub' },
  { name: 'Washington Galleries', lat: 54.9010, lng: -1.5200, radius: 0.003, type: 'transport_hub' },

  // Shopping Centers & Major Destinations
  { name: 'MetroCentre', lat: 54.9586, lng: -1.6659, radius: 0.004, type: 'shopping_center' },
  { name: 'Team Valley Retail World', lat: 54.9228, lng: -1.5742, radius: 0.003, type: 'shopping_center' },
  { name: 'Newcastle City Centre', lat: 54.9738, lng: -1.6131, radius: 0.005, type: 'city_center' },
  { name: 'Grainger Street', lat: 54.9706, lng: -1.6140, radius: 0.002, type: 'city_center' },
  { name: 'Sunderland City Centre', lat: 54.9069, lng: -1.3838, radius: 0.004, type: 'city_center' },
  { name: 'Durham City Centre', lat: 54.7761, lng: -1.5733, radius: 0.003, type: 'city_center' },
  { name: 'The Galleries Washington', lat: 54.9010, lng: -1.5200, radius: 0.003, type: 'shopping_center' },
  { name: 'Kingston Park', lat: 55.0156, lng: -1.7344, radius: 0.003, type: 'retail_park' },

  // Hospitals & Healthcare
  { name: 'Royal Victoria Infirmary (RVI)', lat: 54.9843, lng: -1.6226, radius: 0.003, type: 'hospital' },
  { name: 'Freeman Hospital', lat: 55.0067, lng: -1.6500, radius: 0.003, type: 'hospital' },
  { name: 'Sunderland Royal Hospital', lat: 54.9186, lng: -1.3678, radius: 0.003, type: 'hospital' },
  { name: 'University Hospital of North Durham', lat: 54.8072, lng: -1.5608, radius: 0.003, type: 'hospital' },
  { name: 'Queen Elizabeth Hospital Gateshead', lat: 54.9458, lng: -1.5964, radius: 0.003, type: 'hospital' },

  // Educational Institutions
  { name: 'Newcastle University', lat: 54.9783, lng: -1.6178, radius: 0.004, type: 'university' },
  { name: 'Northumbria University', lat: 54.9707, lng: -1.6089, radius: 0.003, type: 'university' },
  { name: 'University of Sunderland', lat: 54.9069, lng: -1.3845, radius: 0.003, type: 'university' },
  { name: 'Durham University', lat: 54.7688, lng: -1.5694, radius: 0.004, type: 'university' },

  // Industrial & Business Areas
  { name: 'Team Valley Trading Estate', lat: 54.9200, lng: -1.5800, radius: 0.005, type: 'industrial' },
  { name: 'Quayside Newcastle', lat: 54.9689, lng: -1.6025, radius: 0.003, type: 'business_district' },
  { name: 'Sunderland Enterprise Park', lat: 54.8850, lng: -1.3400, radius: 0.004, type: 'industrial' },
  { name: 'Follingsby Park', lat: 54.9100, lng: -1.4800, radius: 0.004, type: 'industrial' },

  // Major Roads & Junctions
  { name: 'A1 Western Bypass', lat: 54.9500, lng: -1.7000, radius: 0.002, type: 'major_road' },
  { name: 'Tyne Bridge', lat: 54.9692, lng: -1.6028, radius: 0.002, type: 'bridge' },
  { name: 'Redheugh Bridge', lat: 54.9658, lng: -1.6081, radius: 0.002, type: 'bridge' },
  { name: 'Swing Bridge', lat: 54.9703, lng: -1.6019, radius: 0.001, type: 'bridge' },
  { name: 'High Level Bridge', lat: 54.9697, lng: -1.6031, radius: 0.001, type: 'bridge' },
  { name: 'A19 Testo\'s Roundabout', lat: 54.9800, lng: -1.5300, radius: 0.002, type: 'junction' },
  { name: 'A1(M) Junction 65 (Birtley)', lat: 54.9000, lng: -1.5800, radius: 0.002, type: 'junction' },

  // Go North East Depots (Operational Locations) - VERIFIED from OpenStreetMap (December 2025)
  { name: 'Washington Depot', lat: 54.9068, lng: -1.5140, radius: 0.003, type: 'depot' },
  { name: 'Riverside Depot', lat: 54.9586, lng: -1.6579, radius: 0.002, type: 'depot' },
  { name: 'Consett Depot', lat: 54.8403, lng: -1.8380, radius: 0.003, type: 'depot' },
  { name: 'Deptford Depot', lat: 54.9142, lng: -1.3976, radius: 0.003, type: 'depot' },
  { name: 'Percy Main Depot', lat: 55.0041, lng: -1.4774, radius: 0.003, type: 'depot' },
  { name: 'Hexham Depot', lat: 54.9756, lng: -2.0960, radius: 0.003, type: 'depot' },
  { name: 'Chester-le-Street Depot', lat: 54.8543, lng: -1.5740, radius: 0.003, type: 'depot' },

  // Residential Areas & Estates
  { name: 'Byker', lat: 54.9758, lng: -1.5736, radius: 0.003, type: 'residential' },
  { name: 'Gosforth', lat: 55.0097, lng: -1.6167, radius: 0.004, type: 'residential' },
  { name: 'Jesmond', lat: 54.9861, lng: -1.6064, radius: 0.003, type: 'residential' },
  { name: 'Heaton', lat: 54.9844, lng: -1.5700, radius: 0.003, type: 'residential' },
  { name: 'Wallsend', lat: 54.9889, lng: -1.5344, radius: 0.004, type: 'residential' },
  { name: 'Whitley Bay', lat: 55.0458, lng: -1.4472, radius: 0.004, type: 'coastal_town' },
  { name: 'South Shields', lat: 54.9958, lng: -1.4339, radius: 0.004, type: 'coastal_town' },

  // Recreational & Leisure
  { name: 'Sage Gateshead', lat: 54.9692, lng: -1.6014, radius: 0.001, type: 'entertainment' },
  { name: 'Baltic Centre for Contemporary Art', lat: 54.9686, lng: -1.6006, radius: 0.001, type: 'entertainment' },
  { name: 'St. James\' Park (Newcastle United)', lat: 54.9756, lng: -1.6219, radius: 0.002, type: 'stadium' },
  { name: 'Stadium of Light (Sunderland AFC)', lat: 54.9144, lng: -1.3881, radius: 0.002, type: 'stadium' },
  { name: 'Town Moor', lat: 54.9917, lng: -1.6292, radius: 0.005, type: 'park' },
  { name: 'Saltwell Park', lat: 54.9489, lng: -1.6075, radius: 0.003, type: 'park' }
];

/**
 * Get the most appropriate location name for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Human-readable location name
 */
const getLocationName = async (lat, lng) => {
  try {
    // Validate input coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return `${lat || 'Unknown'}, ${lng || 'Unknown'}`;
    }

    // Check if coordinates are within Go North East operational area
    const isInOperationalArea = (lat >= 54.5 && lat <= 55.2) && (lng >= -2.2 && lng <= -1.2);
    if (!isInOperationalArea) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)} (Outside operational area)`;
    }

    let closestLandmark = null;
    let minDistance = Infinity;

    // Find the closest landmark within its radius
    for (const landmark of landmarks) {
      const distance = calculateDistance(lat, lng, landmark.lat, landmark.lng);

      // Check if within landmark's detection radius
      if (distance <= landmark.radius && distance < minDistance) {
        minDistance = distance;
        closestLandmark = landmark;
      }
    }

    // If we found a nearby landmark, return it with context
    if (closestLandmark) {
      const distanceKm = minDistance * 111; // Convert back to km
      const distanceText = distanceKm < 0.1 ? 'at' : `near (${(distanceKm * 1000).toFixed(0)}m from)`;

      // For very close matches, just return the landmark name
      if (distanceKm < 0.05) {
        return closestLandmark.name;
      }

      // For nearby matches, include distance context
      return `${distanceText} ${closestLandmark.name}`;
    }

    // If no landmarks found, try to determine general area
    const generalArea = getGeneralArea(lat, lng);
    if (generalArea) {
      return `${generalArea} area (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }

    // Fallback to coordinates with area context
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  } catch (error) {
    console.error('Error in getLocationName:', error);
    return `${lat}, ${lng}`;
  }
};

/**
 * Determine general area based on coordinate ranges
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string|null} General area name
 */
const getGeneralArea = (lat, lng) => {
  // Newcastle area
  if (lat >= 54.95 && lat <= 55.05 && lng >= -1.65 && lng <= -1.55) {
    return 'Newcastle upon Tyne';
  }

  // Gateshead area
  if (lat >= 54.93 && lat <= 54.98 && lng >= -1.65 && lng <= -1.55) {
    return 'Gateshead';
  }

  // Sunderland area
  if (lat >= 54.85 && lat <= 54.95 && lng >= -1.42 && lng <= -1.35) {
    return 'Sunderland';
  }

  // Durham area
  if (lat >= 54.75 && lat <= 54.85 && lng >= -1.60 && lng <= -1.50) {
    return 'Durham';
  }

  // Washington area
  if (lat >= 54.88 && lat <= 54.92 && lng >= -1.55 && lng <= -1.48) {
    return 'Washington';
  }

  // Chester-le-Street area
  if (lat >= 54.84 && lat <= 54.88 && lng >= -1.58 && lng <= -1.52) {
    return 'Chester-le-Street';
  }

  // Team Valley area
  if (lat >= 54.91 && lat <= 54.94 && lng >= -1.59 && lng <= -1.55) {
    return 'Team Valley';
  }

  // Hexham area
  if (lat >= 54.96 && lat <= 55.00 && lng >= -2.15 && lng <= -2.05) {
    return 'Hexham';
  }

  // North Tyneside
  if (lat >= 55.00 && lat <= 55.08 && lng >= -1.55 && lng <= -1.40) {
    return 'North Tyneside';
  }

  // South Tyneside
  if (lat >= 54.95 && lat <= 55.02 && lng >= -1.50 && lng <= -1.40) {
    return 'South Tyneside';
  }

  return null;
};

/**
 * Enhanced location detection with route context
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} routeNumber - Bus route number for context
 * @returns {Promise<object>} Detailed location information
 */
const getDetailedLocation = async (lat, lng, routeNumber = null) => {
  try {
    const locationName = await getLocationName(lat, lng);
    const generalArea = getGeneralArea(lat, lng);

    // Find closest landmark for additional context
    let closestLandmark = null;
    let minDistance = Infinity;

    for (const landmark of landmarks) {
      const distance = calculateDistance(lat, lng, landmark.lat, landmark.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestLandmark = landmark;
      }
    }

    return {
      displayName: locationName,
      generalArea: generalArea,
      coordinates: { lat, lng },
      coordinatesString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      closestLandmark: closestLandmark ? {
        name: closestLandmark.name,
        distance: (minDistance * 111 * 1000).toFixed(0), // meters
        type: closestLandmark.type
      } : null,
      routeContext: routeNumber,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getDetailedLocation:', error);
    return {
      displayName: `${lat}, ${lng}`,
      generalArea: null,
      coordinates: { lat, lng },
      coordinatesString: `${lat}, ${lng}`,
      closestLandmark: null,
      routeContext: routeNumber,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Format location for different display contexts
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} format - Display format: 'short', 'detailed', 'emergency'
 * @returns {Promise<string>} Formatted location string
 */
const formatLocation = async (lat, lng, format = 'short') => {
  const location = await getDetailedLocation(lat, lng);

  switch (format) {
    case 'short':
      return location.displayName;

    case 'detailed':
      return `${location.displayName}${location.generalArea ? ` (${location.generalArea})` : ''}`;

    case 'emergency':
      return `${location.displayName} | Coordinates: ${location.coordinatesString}${location.closestLandmark ? ` | Near: ${location.closestLandmark.name}` : ''}`;

    case 'coordinates':
      return location.coordinatesString;

    default:
      return location.displayName;
  }
};

/**
 * Check if location is within a specific area type
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} areaType - Type to check: 'depot', 'hospital', 'transport_hub', etc.
 * @returns {boolean} True if within specified area type
 */
const isWithinAreaType = (lat, lng, areaType) => {
  return landmarks.some(landmark => {
    if (landmark.type !== areaType) return false;
    const distance = calculateDistance(lat, lng, landmark.lat, landmark.lng);
    return distance <= landmark.radius;
  });
};

/**
 * Get all landmarks within a certain radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} Array of nearby landmarks
 */
const getNearbyLandmarks = (lat, lng, radiusKm = 1) => {
  const radiusDegrees = radiusKm / 111; // Convert km to degrees

  return landmarks
    .map(landmark => ({
      ...landmark,
      distance: calculateDistance(lat, lng, landmark.lat, landmark.lng) * 111 // Convert to km
    }))
    .filter(landmark => landmark.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

// Export the location service functions
export default {
  getLocationName,
  getDetailedLocation,
  formatLocation,
  isWithinAreaType,
  getNearbyLandmarks,
  calculateDistance
};

export {
  getLocationName,
  getDetailedLocation,
  formatLocation,
  isWithinAreaType,
  getNearbyLandmarks,
  calculateDistance
};