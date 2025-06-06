// utils/location.js
// Location processing and geocoding utilities
import axios from 'axios';

// OpenStreetMap with timeout control
async function getLocationNameWithTimeout(lat, lng, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: timeout,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.data && response.data.address) {
      const addr = response.data.address;
      console.log(`📍 OSM response for ${lat}, ${lng}:`, {
        road: addr.road,
        neighbourhood: addr.neighbourhood,
        suburb: addr.suburb,
        town: addr.town,
        city: addr.city
      });
      let location = '';
      if (addr.road) {
        location = addr.road;
      } else if (addr.pedestrian) {
        location = addr.pedestrian;
      } else if (addr.neighbourhood) {
        location = addr.neighbourhood;
      }
      if (addr.suburb) {
        location += location ? `, ${addr.suburb}` : addr.suburb;
      } else if (addr.neighbourhood && !location.includes(addr.neighbourhood)) {
        location += location ? `, ${addr.neighbourhood}` : addr.neighbourhood;
      }
      if (addr.town) {
        location += location ? `, ${addr.town}` : addr.town;
      } else if (addr.city) {
        location += location ? `, ${addr.city}` : addr.city;
      }
      return location || response.data.display_name?.split(',')[0] || null;
    }
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`⚠️ Geocoding timeout after ${timeout}ms`);
    } else {
      console.warn(`⚠️ Geocoding error: ${error.message}`);
    }
    return null;
  }
}

// Geographic region detection from coordinates
function getRegionFromCoordinates(lat, lng) {
  if (lat >= 54.9 && lat <= 55.1 && lng >= -1.7 && lng <= -1.4) {
    if (lat >= 54.95 && lng >= -1.65 && lng <= -1.55) {
      return 'Newcastle City Centre';
    } else if (lng >= -1.5 && lng <= -1.3 && lat >= 55.0) {
      return 'Newcastle Coast Road Area';
    } else if (lat <= 54.97 && lng >= -1.65) {
      return 'Gateshead Area';
    }
    return 'Newcastle upon Tyne Area';
  }
  if (lat >= 54.85 && lat <= 54.95 && lng >= -1.5 && lng <= -1.2) {
    return 'Sunderland Area';
  }
  if (lat >= 54.7 && lat <= 54.85 && lng >= -1.7 && lng <= -1.4) {
    return 'Durham Area';
  }
  if (lat >= 55.1 && lat <= 55.5 && lng >= -2.0 && lng <= -1.0) {
    return 'Northumberland';
  }
  if (lat >= 54.5 && lat <= 55.5 && lng >= -2.5 && lng <= -1.0) {
    return 'North East England';
  }
  return null;
}

// Coordinate description with road detection
function getCoordinateDescription(lat, lng) {
  const region = getRegionFromCoordinates(lat, lng) || 'North East England';
  let roadHint = '';
  if (lng >= -1.7 && lng <= -1.5 && lat >= 54.8 && lat <= 55.2) {
    roadHint = ' (A1 Corridor)';
  }
  else if (lng >= -1.5 && lng <= -1.3 && lat >= 54.9 && lat <= 55.1) {
    roadHint = ' (A19 Corridor)';
  }
  else if (lng >= -1.65 && lng <= -1.45 && lat >= 54.8 && lat <= 54.95) {
    roadHint = ' (A167 Corridor)';
  }
  return `${region}${roadHint} (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
}

// Simple reverse geocoding without timeout control
async function getLocationName(lat, lng) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.display_name) {
      const addr = response.data.address || {};
      // Build a nice location description
      let location = '';
      if (addr.road) {
        location = addr.road;
      } else if (addr.pedestrian) {
        location = addr.pedestrian;
      } else if (addr.neighbourhood) {
        location = addr.neighbourhood;
      }
      if (addr.suburb || addr.town || addr.city) {
        location += `, ${addr.suburb || addr.town || addr.city}`;
      }
      return location || response.data.display_name.split(',')[0];
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Reverse geocoding failed:', error.message);
    return null;
  }
}

// Enhanced location fallback with multiple strategies
async function getEnhancedLocationWithFallbacks(lat, lng, originalLocation = '', context = '') {
  if (originalLocation && originalLocation.trim() && 
      !originalLocation.includes('coordinate') && 
      !originalLocation.includes('54.') && 
      !originalLocation.includes('55.') &&
      originalLocation.length > 5) {
    console.log(`🎯 Using original location: ${originalLocation}`);
    return originalLocation;
  }
  if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
    try {
      console.log(`🗺️ Attempting enhanced geocoding for ${lat}, ${lng}...`);
      const enhancedLocation = await getLocationNameWithTimeout(lat, lng, 3000);
      if (enhancedLocation && enhancedLocation.length > 3) {
        console.log(`✅ Enhanced location: ${enhancedLocation}`);
        return enhancedLocation;
      }
    } catch (error) {
      console.warn(`⚠️ Geocoding failed: ${error.message}`);
    }
    const regionLocation = getRegionFromCoordinates(lat, lng);
    if (regionLocation) {
      console.log(`📍 Using region detection: ${regionLocation}`);
      return regionLocation;
    }
    const coordLocation = getCoordinateDescription(lat, lng);
    console.log(`📐 Using coordinate description: ${coordLocation}`);
    return coordLocation;
  }
  if (context && context.trim() && context.length > 3) {
    console.log(`📄 Using context: ${context}`);
    return context;
  }
  console.log(`⚠️ Using generic fallback location`);
  return 'North East England - Location being determined';
}

export {
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
};

export default {
  getLocationNameWithTimeout,
  getRegionFromCoordinates,
  getCoordinateDescription,
  getEnhancedLocationWithFallbacks,
  getLocationName
};