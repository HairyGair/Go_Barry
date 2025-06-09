// backend/location-enhancer.js
// Free reverse geocoding using OpenStreetMap Nominatim

import axios from 'axios';

console.log('🗺️ Location Enhancer Loading (OpenStreetMap Nominatim)...');

// Cache to avoid hitting the free API too much
const locationCache = new Map();
const CACHE_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting - be respectful to free API
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// Main reverse geocoding function
export async function enhanceLocationWithNames(lat, lng, originalLocation = '') {
  try {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    
    // Check cache first
    const cached = locationCache.get(cacheKey);
    if (cached) {
      console.log(`📋 Using cached location: ${cached}`);
      return cached;
    }
    
    console.log(`🗺️ Reverse geocoding: ${lat}, ${lng}`);
    
    // Rate limiting
    await waitForRateLimit();
    
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        zoom: 18 // High detail level
      },
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0 (traffic monitoring for Go North East)',
        'Accept': 'application/json'
      },
      timeout: 8000
    });
    
    let enhancedLocation = originalLocation;
    
    if (response.data && response.data.address) {
      const addr = response.data.address;
      const displayName = response.data.display_name;
      
      console.log(`📍 OSM response for ${lat}, ${lng}:`, {
        road: addr.road,
        neighbourhood: addr.neighbourhood,
        suburb: addr.suburb,
        town: addr.town,
        city: addr.city
      });
      
      // Build enhanced location description
      let locationParts = [];
      
      // Primary road/street name
      if (addr.road) {
        locationParts.push(addr.road);
      } else if (addr.pedestrian) {
        locationParts.push(addr.pedestrian);
      } else if (addr.footway) {
        locationParts.push(addr.footway);
      }
      
      // Area context
      if (addr.neighbourhood && !locationParts.join(' ').includes(addr.neighbourhood)) {
        locationParts.push(addr.neighbourhood);
      } else if (addr.suburb && !locationParts.join(' ').includes(addr.suburb)) {
        locationParts.push(addr.suburb);
      } else if (addr.town && !locationParts.join(' ').includes(addr.town)) {
        locationParts.push(addr.town);
      } else if (addr.city && !locationParts.join(' ').includes(addr.city)) {
        locationParts.push(addr.city);
      }
      
      // Clean up location parts
      if (locationParts.length > 0) {
        enhancedLocation = locationParts.slice(0, 2).join(', '); // Max 2 parts
      } else {
        // Fallback to first part of display name
        const firstPart = displayName.split(',')[0];
        if (firstPart && firstPart.length > 3) {
          enhancedLocation = firstPart;
        }
      }
      
      console.log(`✅ Enhanced location: ${enhancedLocation}`);
    }
    
    // Cache the result
    locationCache.set(cacheKey, enhancedLocation);
    
    return enhancedLocation || originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
  } catch (error) {
    console.warn(`⚠️ Location enhancement failed for ${lat}, ${lng}:`, error.message);
    return originalLocation || `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// Batch processing for multiple coordinates
export async function enhanceMultipleLocations(coordinates) {
  const enhanced = [];

  for (const { lat, lng, originalLocation } of coordinates) {
    const location = await enhanceLocationWithNames(lat, lng, originalLocation);
    enhanced.push({ lat, lng, location });

    // Small delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return enhanced;
}

// Get cache statistics
export function getLocationCacheStats() {
  return {
    cacheSize: locationCache.size(),
    // Not exposing keys to avoid leaking data
  };
}

export default enhanceLocationWithNames;