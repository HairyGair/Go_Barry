/**
 * Google Reverse Geocoding Service
 * Converts GPS coordinates to real street addresses and place names
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

// Use the existing Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

/**
 * Convert coordinates to a readable address using Google's Reverse Geocoding API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} - Formatted address or location name
 */
const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates provided');
  }

  // Check if API key is configured
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    // Fallback to our local landmark database for now
    console.warn('Google Maps API key not configured, using fallback location service');
    return await fallbackLocationLookup(lat, lng);
  }

  console.log('Using Google Maps API for reverse geocoding');

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return formatGoogleResponse(data.results);
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.warn('Google API quota exceeded, using fallback');
      return await fallbackLocationLookup(lat, lng);
    } else {
      throw new Error(`Geocoding failed: ${data.status}`);
    }
  } catch (error) {
    console.warn('Google geocoding failed, using fallback:', error.message);
    return await fallbackLocationLookup(lat, lng);
  }
};

/**
 * Format Google's geocoding response to get the most relevant address
 * @param {Array} results - Google geocoding results
 * @returns {string} - Formatted location string
 */
const formatGoogleResponse = (results) => {
  // Look for the most specific result first
  for (const result of results) {
    const components = result.address_components;
    const types = result.types;

    // Prioritize specific places, establishments, or points of interest
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      const name = components.find(c => c.types.includes('establishment'))?.long_name;
      if (name) {
        const area = getAreaFromComponents(components);
        return area ? `${name}, ${area}` : name;
      }
    }

    // Look for street addresses
    if (types.includes('street_address') || types.includes('premise')) {
      return formatStreetAddress(components);
    }
  }

  // Fallback to the first result's formatted address
  const firstResult = results[0];

  // Try to get a clean, short version
  const components = firstResult.address_components;
  const road = components.find(c => c.types.includes('route'))?.long_name;
  const area = getAreaFromComponents(components);

  if (road && area) {
    return `${road}, ${area}`;
  }

  // Return formatted address but clean it up
  const formatted = firstResult.formatted_address;
  return cleanFormattedAddress(formatted);
};

/**
 * Extract area information from address components
 */
const getAreaFromComponents = (components) => {
  // Look for areas in order of preference
  const areaTypes = [
    'sublocality_level_1',
    'locality',
    'administrative_area_level_2',
    'administrative_area_level_1'
  ];

  for (const type of areaTypes) {
    const area = components.find(c => c.types.includes(type))?.long_name;
    if (area) return area;
  }

  return null;
};

/**
 * Format street address from components
 */
const formatStreetAddress = (components) => {
  const streetNumber = components.find(c => c.types.includes('street_number'))?.long_name || '';
  const streetName = components.find(c => c.types.includes('route'))?.long_name || '';
  const area = getAreaFromComponents(components);

  let address = '';
  if (streetNumber && streetName) {
    address = `${streetNumber} ${streetName}`;
  } else if (streetName) {
    address = streetName;
  }

  return area ? `${address}, ${area}` : address;
};

/**
 * Clean up Google's formatted address to make it more readable
 */
const cleanFormattedAddress = (address) => {
  // Remove postal codes and country
  let cleaned = address.replace(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}\b/g, ''); // UK postcodes
  cleaned = cleaned.replace(/, UK$/, '');
  cleaned = cleaned.replace(/,\s*$/, ''); // Remove trailing comma

  // Limit to first 2-3 parts for brevity
  const parts = cleaned.split(',').map(p => p.trim()).filter(p => p);
  if (parts.length > 3) {
    return parts.slice(0, 3).join(', ');
  }

  return cleaned;
};

/**
 * Fallback location lookup using local landmark database
 * (Enhanced version of our existing location service)
 */
const fallbackLocationLookup = async (lat, lng) => {
  // Import our existing location service as fallback
  try {
    const { default: locationService } = await import('./locationService.js');
    return await locationService.formatLocation(lat, lng, 'short');
  } catch (error) {
    console.warn('Fallback location service failed:', error);

    // Ultimate fallback - at least show area
    if (lat > 54.5 && lat < 55.5 && lng > -2.0 && lng < -1.0) {
      return 'North East England';
    }

    return 'Unknown Location';
  }
};

/**
 * Get location with caching to reduce API calls
 */
const locationCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getLocationWithCache = async (lat, lng) => {
  // Round coordinates to reduce cache size
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  const cacheKey = `${roundedLat},${roundedLng}`;

  // Check cache first
  const cached = locationCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.location;
  }

  // Get fresh location
  const location = await reverseGeocode(lat, lng);

  // Cache the result
  locationCache.set(cacheKey, {
    location,
    timestamp: Date.now()
  });

  return location;
};

/**
 * Public API
 */
const googleLocationService = {
  /**
   * Get location name from coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} - Location name or address
   */
  getLocation: getLocationWithCache,

  /**
   * Clear the location cache
   */
  clearCache: () => {
    locationCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return {
      size: locationCache.size,
      entries: Array.from(locationCache.keys())
    };
  }
};

export default googleLocationService;