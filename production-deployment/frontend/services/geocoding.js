// Go_BARRY/services/geocoding.js
// Enhanced geocoding service using MapBox API with intelligent fallbacks

import Constants from 'expo-constants';

// Get MapBox token from environment variables
const MAPBOX_TOKEN = Constants.expoConfig?.extra?.EXPO_PUBLIC_MAPBOX_TOKEN || 
                     process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
                     __DEV__ ? 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iZ29hOHJsMDB4djJtc2I5c2trbXA3dSJ9.1WxDF7rvXOycZyC5EwNS0A' : null;

// MapBox Geocoding API endpoint
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// Predefined coordinates for major North East locations (high-speed fallback)
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

// Cache and rate limiting
let geocodeCache = new Map();
let requestQueue = [];
let isProcessingQueue = false;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_SECOND = 10;
const REQUEST_DELAY = 1000 / MAX_REQUESTS_PER_SECOND; // 100ms between requests

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
 * Try to find coordinates from known locations first (instant response)
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
  if (!alert) return null;
  
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
 * Rate-limited queue processor for MapBox requests
 */
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, location, options } = requestQueue.shift();
    
    try {
      const result = await makeMapBoxRequest(location, options);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    
    // Rate limiting delay
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Make actual MapBox API request
 */
async function makeMapBoxRequest(location, options = {}) {
  if (!MAPBOX_TOKEN) {
    throw new Error('MapBox token not configured');
  }
  
  // Enhanced search query for North East England context
  const searchQuery = `${location}, North East England, UK`;
  
  // MapBox request parameters
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    country: 'GB', // Restrict to Great Britain
    proximity: '-1.6178,54.9783', // Near Newcastle for better local results
    types: 'address,poi,postcode,place', // Include various location types
    limit: 1,
    ...options
  });
  
  const url = `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(searchQuery)}.json?${params}`;
  
  console.log(`🗺️ MapBox geocoding: "${location}"`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'BARRY-TrafficWatch/3.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`MapBox API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const feature = data.features[0];
    const [longitude, latitude] = feature.center;
    
    return {
      latitude: latitude,
      longitude: longitude,
      name: feature.place_name,
      confidence: feature.relevance > 0.8 ? 'high' : feature.relevance > 0.5 ? 'medium' : 'low',
      source: 'mapbox',
      relevance: feature.relevance,
      address: feature.place_name
    };
  }
  
  return null;
}

/**
 * Queue a MapBox geocoding request (with rate limiting)
 */
function queueMapBoxRequest(location, options = {}) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, location, options });
    processRequestQueue();
  });
}

/**
 * Check cache for existing geocoded location
 */
function getCachedLocation(location) {
  const cacheKey = normalizeLocation(location);
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  // Remove expired entry
  if (cached) {
    geocodeCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache geocoded location result
 */
function cacheLocation(location, result) {
  const cacheKey = normalizeLocation(location);
  geocodeCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
}

/**
 * Main geocoding function with intelligent fallback strategy
 */
export async function geocodeLocation(location, alert = null) {
  if (!location || typeof location !== 'string') {
    return null;
  }
  
  console.log(`🗺️ Geocoding location: "${location}"`);
  
  // Priority 1: Check cache first
  const cached = getCachedLocation(location);
  if (cached) {
    console.log(`✅ Cache hit for "${location}"`);
    return cached;
  }
  
  // Priority 2: Check if alert already has coordinates from backend
  if (alert) {
    const backendCoords = getAlertCoordinates(alert);
    if (backendCoords) {
      cacheLocation(location, backendCoords);
      return backendCoords;
    }
  }
  
  // Priority 3: Try known locations (instant, high accuracy for common places)
  const knownLocation = getKnownLocationCoords(location);
  if (knownLocation) {
    console.log(`✅ Known location hit for "${location}"`);
    cacheLocation(location, knownLocation);
    return knownLocation;
  }
  
  // Priority 4: Use MapBox API for unknown locations
  let result = null;
  
  try {
    result = await queueMapBoxRequest(location);
    
    if (result) {
      console.log(`✅ MapBox geocoded "${location}" -> ${result.latitude}, ${result.longitude} (confidence: ${result.confidence})`);
      cacheLocation(location, result);
      return result;
    }
  } catch (error) {
    console.warn(`⚠️ MapBox geocoding failed for "${location}":`, error.message);
  }
  
  // Priority 5: Default to Newcastle city center if all else fails
  console.warn(`⚠️ Could not geocode location: ${location}, using Newcastle default`);
  result = {
    latitude: 54.9783,
    longitude: -1.6178,
    name: 'Newcastle upon Tyne (Default)',
    confidence: 'fallback',
    source: 'default'
  };
  
  cacheLocation(location, result);
  return result;
}

/**
 * Batch geocode multiple locations efficiently
 */
export async function batchGeocode(locations, alerts = []) {
  const results = [];
  
  console.log(`🗺️ Batch geocoding ${locations.length} locations...`);
  
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    const correspondingAlert = alerts[i];
    
    try {
      const coords = await geocodeLocation(location, correspondingAlert);
      results.push({
        location: location,
        coords: coords,
        error: null
      });
    } catch (error) {
      console.error(`❌ Geocoding failed for "${location}":`, error);
      results.push({
        location: location,
        coords: null,
        error: error.message
      });
    }
  }
  
  console.log(`✅ Batch geocoding complete: ${results.filter(r => r.coords).length}/${results.length} successful`);
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
  geocodeCache.clear();
  console.log('🗑️ Geocoding cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const total = geocodeCache.size;
  const expired = Array.from(geocodeCache.values())
    .filter(entry => (Date.now() - entry.timestamp) >= CACHE_DURATION).length;
  
  return {
    total,
    active: total - expired,
    expired,
    requestsQueued: requestQueue.length,
    mapboxConfigured: !!MAPBOX_TOKEN
  };
}

/**
 * Test geocoding functionality
 */
export async function testGeocoding() {
  console.log('🧪 Testing geocoding functionality...');
  
  const testLocations = [
    'A1 Newcastle',
    'Tyne Tunnel',
    'MetroCentre Gateshead',
    'Durham City Centre',
    'A19 Silverlink'
  ];
  
  for (const location of testLocations) {
    try {
      const result = await geocodeLocation(location);
      console.log(`✅ ${location} -> ${result.latitude}, ${result.longitude} (${result.source})`);
    } catch (error) {
      console.error(`❌ ${location} -> Error: ${error.message}`);
    }
  }
  
  const stats = getCacheStats();
  console.log('📊 Cache stats:', stats);
}
