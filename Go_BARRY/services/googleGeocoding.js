// Google Maps Geocoding Service for Go BARRY
// Enhanced geocoding using Google Maps API for maximum accuracy

// Google Maps API key (should be set in environment variables)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 
                           process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                           // Fallback key for development
                           'AIzaSyBhBN_kVOnIRTKXYhzrDwpr8kvb0Uy0IY8';

// Google Maps Geocoding API endpoint
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

// Cache for geocoded results
let geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
let requestQueue = [];
let isProcessingQueue = false;
const REQUEST_DELAY = 200; // 200ms between requests (Google allows more than Nominatim)

/**
 * Process the request queue with rate limiting
 */
async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const { resolve, reject, location, options } = requestQueue.shift();
    
    try {
      const result = await makeGoogleRequest(location, options);
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
 * Make actual Google Maps API request
 */
async function makeGoogleRequest(location, options = {}) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }
  
  // Build query parameters
  const params = new URLSearchParams({
    address: location,
    key: GOOGLE_MAPS_API_KEY,
    region: 'uk', // Bias towards UK results
    bounds: '54.5,-2.5|55.3,-1.0', // North East England bounds
    ...options
  });
  
  const url = `${GOOGLE_GEOCODING_URL}?${params}`;
  
  console.log(`🌍 Google geocoding: "${location}"`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'BARRY-TrafficWatch/3.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.status === 'OK' && data.results && data.results.length > 0) {
    const result = data.results[0];
    const { lat, lng } = result.geometry.location;
    
    // Assess confidence based on location type
    const confidence = assessGoogleResultConfidence(result);
    
    return {
      latitude: lat,
      longitude: lng,
      name: result.formatted_address,
      confidence: confidence,
      source: 'google_maps',
      address: result.formatted_address,
      types: result.types,
      place_id: result.place_id
    };
  } else {
    console.warn(`⚠️ Google geocoding failed: ${data.status} - ${data.error_message || 'No results'}`);
    return null;
  }
}

/**
 * Assess confidence based on Google result types
 */
function assessGoogleResultConfidence(result) {
  const types = result.types || [];
  
  // High confidence for specific locations
  if (types.includes('street_address') || 
      types.includes('route') || 
      types.includes('intersection')) {
    return 'high';
  }
  
  // Medium confidence for neighborhoods and districts
  if (types.includes('sublocality') || 
      types.includes('neighborhood') || 
      types.includes('political')) {
    return 'medium';
  }
  
  // Lower confidence for general areas
  return 'low';
}

/**
 * Queue a Google geocoding request
 */
function queueGoogleRequest(location, options = {}) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ resolve, reject, location, options });
    processRequestQueue();
  });
}

/**
 * Check cache for existing results
 */
function getCachedLocation(location) {
  const cacheKey = location.toLowerCase().trim();
  const cached = geocodeCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  if (cached) {
    geocodeCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Cache geocoding result
 */
function cacheLocation(location, result) {
  const cacheKey = location.toLowerCase().trim();
  geocodeCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
}

/**
 * Main Google geocoding function
 */
export async function geocodeWithGoogle(location) {
  if (!location || typeof location !== 'string') {
    return null;
  }
  
  console.log(`🌍 Google geocoding: "${location}"`);
  
  // Check cache first
  const cached = getCachedLocation(location);
  if (cached) {
    console.log(`✅ Cache hit for "${location}"`);
    return cached;
  }
  
  try {
    const result = await queueGoogleRequest(location);
    
    if (result) {
      console.log(`✅ Google geocoded "${location}" -> ${result.latitude}, ${result.longitude} (confidence: ${result.confidence})`);
      cacheLocation(location, result);
      return result;
    }
  } catch (error) {
    console.error(`❌ Google geocoding failed for "${location}":`, error.message);
  }
  
  return null;
}

/**
 * Enhanced location string builder for better geocoding results
 */
export function buildGeocodingAddress(roadwork) {
  const parts = [];
  
  // Primary location
  if (roadwork.sm_street_name) {
    parts.push(roadwork.sm_street_name);
  } else if (roadwork.street_name) {
    parts.push(roadwork.street_name);
  }
  
  // Additional context
  if (roadwork.sm_town && !parts.some(p => p.includes(roadwork.sm_town))) {
    parts.push(roadwork.sm_town);
  }
  
  // Use location description if no street name
  if (parts.length === 0 && roadwork.sm_location_description) {
    // Clean up the description
    const cleaned = roadwork.sm_location_description
      .replace(/from .+ to .+/gi, '') // Remove "from X to Y"
      .replace(/junction with .+/gi, '') // Remove junction details
      .replace(/[()]/g, '') // Remove parentheses
      .trim();
    if (cleaned) parts.push(cleaned);
  }
  
  // Add authority context (but clean it up)
  if (roadwork.sm_highway_authority) {
    const authority = roadwork.sm_highway_authority
      .replace(/COUNCIL$|CITY$/gi, '') // Remove "COUNCIL" or "CITY"
      .trim();
    
    // Only add if it looks like a useful place name
    if (authority && !parts.some(p => p.toLowerCase().includes(authority.toLowerCase()))) {
      parts.push(authority);
    }
  }
  
  // Add UK context (helps Google understand region)
  parts.push('UK');
  
  return parts.join(', ');
}

/**
 * Batch geocode multiple locations
 */
export async function batchGeocodeWithGoogle(locations) {
  const results = [];
  
  console.log(`🌍 Batch geocoding ${locations.length} locations with Google...`);
  
  for (const location of locations) {
    try {
      const coords = await geocodeWithGoogle(location);
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
 * Clear the cache
 */
export function clearGoogleGeocodeCache() {
  geocodeCache.clear();
  console.log('🗑️ Google geocoding cache cleared');
}

/**
 * Get cache stats
 */
export function getGoogleCacheStats() {
  const total = geocodeCache.size;
  const expired = Array.from(geocodeCache.values())
    .filter(entry => (Date.now() - entry.timestamp) >= CACHE_DURATION).length;
  
  return {
    total,
    active: total - expired,
    expired,
    requestsQueued: requestQueue.length,
    googleConfigured: !!GOOGLE_MAPS_API_KEY
  };
}

export default {
  geocodeWithGoogle,
  buildGeocodingAddress,
  batchGeocodeWithGoogle,
  clearGoogleGeocodeCache,
  getGoogleCacheStats
};
