// Go_BARRY/services/geocoding.js
// Simplified geocoding service that leverages BARRY backend capabilities

const BACKEND_BASE_URL = 'https://go-barry.onrender.com';

// Predefined coordinates for major North East locations (fallback)
const KNOWN_LOCATIONS = {
  // Major Roads
  'a1': { latitude: 54.9783, longitude: -1.6178, name: 'A1 (General)' },
  'a19': { latitude: 54.9460, longitude: -1.4230, name: 'A19 (General)' },
  'a69': { latitude: 54.9720, longitude: -2.0000, name: 'A69 (General)' },
  'a167': { latitude: 54.8985, longitude: -1.5510, name: 'A167 (General)' },
  'a1058': { latitude: 55.0140, longitude: -1.4920, name: 'A1058 Coast Road' },
  'a184': { latitude: 54.9280, longitude: -1.5970, name: 'A184 (General)' },
  'a690': { latitude: 54.9050, longitude: -1.4670, name: 'A690 (General)' },
  
  // Cities
  'newcastle': { latitude: 54.9783, longitude: -1.6178, name: 'Newcastle upon Tyne' },
  'gateshead': { latitude: 54.9530, longitude: -1.6030, name: 'Gateshead' },
  'sunderland': { latitude: 54.9069, longitude: -1.3838, name: 'Sunderland' },
  'durham': { latitude: 54.7761, longitude: -1.5733, name: 'Durham' },
  'hexham': { latitude: 54.9698, longitude: -2.1015, name: 'Hexham' },
  'cramlington': { latitude: 55.0869, longitude: -1.5874, name: 'Cramlington' },
  'washington': { latitude: 54.9000, longitude: -1.5200, name: 'Washington' },
  'seaham': { latitude: 54.8387, longitude: -1.3467, name: 'Seaham' },
  'chester-le-street': { latitude: 54.8567, longitude: -1.5713, name: 'Chester-le-Street' },
  'birtley': { latitude: 54.9000, longitude: -1.5850, name: 'Birtley' },
  
  // Specific Locations
  'tyne tunnel': { latitude: 54.9830, longitude: -1.4600, name: 'Tyne Tunnel' },
  'coast road': { latitude: 55.0140, longitude: -1.4920, name: 'Coast Road' },
  'central motorway': { latitude: 54.9720, longitude: -1.6100, name: 'Central Motorway' },
  'metrocentre': { latitude: 54.9530, longitude: -1.6720, name: 'MetroCentre' },
  'team valley': { latitude: 54.9230, longitude: -1.6330, name: 'Team Valley' },
  'quayside': { latitude: 54.9699, longitude: -1.6006, name: 'Newcastle Quayside' },
  
  // A1 Junctions (major ones in North East)
  'a1 j65': { latitude: 54.8800, longitude: -1.5800, name: 'A1 Junction 65 (Birtley)' },
  'a1 j66': { latitude: 54.9200, longitude: -1.5650, name: 'A1 Junction 66 (Team Valley)' },
  'a1 j67': { latitude: 54.9500, longitude: -1.5500, name: 'A1 Junction 67 (MetroCentre)' },
  'a1 j68': { latitude: 54.9800, longitude: -1.5350, name: 'A1 Junction 68 (Consett)' },
  'a1 j69': { latitude: 55.0100, longitude: -1.5200, name: 'A1 Junction 69 (Wansbeck)' },
  
  // A19 Key Points
  'a19 tyne tunnel': { latitude: 54.9830, longitude: -1.4600, name: 'A19 Tyne Tunnel' },
  'a19 silverlink': { latitude: 55.0300, longitude: -1.4800, name: 'A19 Silverlink' },
  'a19 cobalt': { latitude: 55.0450, longitude: -1.4750, name: 'A19 Cobalt Business Park' }
};

// Cache for geocoded locations
let geocodeCache = {};

/**
 * Clean and normalize location string for better matching
 */
function normalizeLocation(location) {
  if (!location) return '';
  
  return location
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters except letters, numbers, spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Extract key location identifiers from a location string
 */
function extractLocationKeys(location) {
  const normalized = normalizeLocation(location);
  const keys = [];
  
  // Check for road patterns
  const roadPattern = /\b(a\d+|m\d+|b\d+)\b/g;
  let match;
  while ((match = roadPattern.exec(normalized)) !== null) {
    keys.push(match[1]);
  }
  
  // Check for junction patterns
  const junctionPattern = /\b(j\d+|junction\s*\d+)\b/g;
  while ((match = junctionPattern.exec(normalized)) !== null) {
    if (keys.length > 0) {
      keys.push(`${keys[keys.length - 1]} ${match[1].replace(/\s+/g, '')}`);
    }
  }
  
  // Check for city names
  const cities = ['newcastle', 'gateshead', 'sunderland', 'durham', 'hexham', 
                  'cramlington', 'washington', 'seaham', 'birtley'];
  cities.forEach(city => {
    if (normalized.includes(city)) {
      keys.push(city);
    }
  });
  
  // Check for specific locations
  if (normalized.includes('tyne tunnel')) keys.push('tyne tunnel');
  if (normalized.includes('coast road')) keys.push('coast road');
  if (normalized.includes('central motorway')) keys.push('central motorway');
  if (normalized.includes('metrocentre') || normalized.includes('metro centre')) keys.push('metrocentre');
  
  return keys;
}

/**
 * Try to find coordinates from known locations first
 */
function getKnownLocationCoords(location) {
  const keys = extractLocationKeys(location);
  
  // Try exact matches first
  for (const key of keys) {
    if (KNOWN_LOCATIONS[key]) {
      return {
        ...KNOWN_LOCATIONS[key],
        confidence: 'high',
        source: 'known_location'
      };
    }
  }
  
  // Try partial matches
  for (const key of keys) {
    for (const [knownKey, coords] of Object.entries(KNOWN_LOCATIONS)) {
      if (knownKey.includes(key) || key.includes(knownKey)) {
        return {
          ...coords,
          confidence: 'medium',
          source: 'known_location'
        };
      }
    }
  }
  
  return null;
}

/**
 * Check if alert already has coordinates from backend
 */
function getAlertCoordinates(alert) {
  // Check if the alert already has coordinates from backend processing
  if (alert.coordinates) {
    if (Array.isArray(alert.coordinates) && alert.coordinates.length >= 2) {
      return {
        latitude: alert.coordinates[0],
        longitude: alert.coordinates[1],
        name: alert.location || 'Traffic Location',
        confidence: 'high',
        source: 'backend_processing'
      };
    } else if (alert.coordinates.lat && alert.coordinates.lng) {
      return {
        latitude: alert.coordinates.lat,
        longitude: alert.coordinates.lng,
        name: alert.location || 'Traffic Location',
        confidence: 'high',
        source: 'backend_processing'
      };
    }
  }
  
  return null;
}

/**
 * Use OpenStreetMap Nominatim API as fallback (simplified)
 */
async function fallbackGeocode(location) {
  try {
    // Enhance the search with UK context
    const enhancedLocation = `${location}, North East England, UK`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(enhancedLocation)}&format=json&limit=1&countrycodes=gb`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        name: result.display_name,
        confidence: 'low',
        source: 'nominatim'
      };
    }
    
    return null;
    
  } catch (error) {
    console.warn('⚠️ Fallback geocoding failed:', error.message);
    return null;
  }
}

/**
 * Main geocoding function - leverages backend where possible
 */
export async function geocodeLocation(location, alert = null) {
  if (!location || typeof location !== 'string') {
    return null;
  }
  
  // Check cache first
  const cacheKey = normalizeLocation(location);
  if (geocodeCache[cacheKey]) {
    return geocodeCache[cacheKey];
  }
  
  console.log(`🗺️ Geocoding location: "${location}"`);
  
  // First priority: Check if alert already has coordinates from backend
  if (alert) {
    const backendCoords = getAlertCoordinates(alert);
    if (backendCoords) {
      geocodeCache[cacheKey] = backendCoords;
      return backendCoords;
    }
  }
  
  // Second priority: Try known locations (fast and accurate for North East)
  let result = getKnownLocationCoords(location);
  
  // Third priority: Fallback to Nominatim if needed
  if (!result) {
    result = await fallbackGeocode(location);
  }
  
  // Default to Newcastle city center if all else fails
  if (!result) {
    console.warn(`⚠️ Could not geocode location: ${location}, using default`);
    result = {
      latitude: 54.9783,
      longitude: -1.6178,
      name: 'Newcastle upon Tyne (Default)',
      confidence: 'fallback',
      source: 'default'
    };
  }
  
  // Cache the result
  geocodeCache[cacheKey] = result;
  
  console.log(`✅ Geocoded "${location}" -> ${result.latitude}, ${result.longitude} (${result.confidence})`);
  return result;
}

/**
 * Batch geocode multiple locations - enhanced for BARRY alerts
 */
export async function batchGeocode(locations, alerts = []) {
  const results = [];
  
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const correspondingAlert = alerts[i]; // Alert that matches this location
    
    try {
      const coords = await geocodeLocation(location, correspondingAlert);
      results.push({
        location: location,
        coords: coords,
        error: null
      });
    } catch (error) {
      results.push({
        location: location,
        coords: null,
        error: error
      });
    }
  }
  
  return results;
}

/**
 * Get the default map region for North East England
 */
export function getNorthEastRegion() {
  return {
    latitude: 54.9783, // Newcastle center
    longitude: -1.6178,
    latitudeDelta: 0.8, // Show roughly from Hexham to Sunderland
    longitudeDelta: 0.8
  };
}

/**
 * Check if coordinates are within North East region
 */
export function isInNorthEastRegion(latitude, longitude) {
  // Rough bounding box for North East England
  const bounds = {
    north: 55.3,
    south: 54.5,
    east: -1.0,
    west: -2.5
  };
  
  return latitude >= bounds.south && 
         latitude <= bounds.north && 
         longitude >= bounds.west && 
         longitude <= bounds.east;
}

/**
 * Clear the geocoding cache (useful for testing or memory management)
 */
export function clearGeocodeCache() {
  geocodeCache = {};
  console.log('🗑️ Geocoding cache cleared');
}