/**
 * Geocoding Cache Service
 * Provides cached reverse geocoding with multiple provider fallbacks
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';
import memoryMonitor from './memoryMonitor.js';

// Initialize Supabase client for caching
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// In-memory cache for frequently accessed locations with size limits
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DB_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_MEMORY_CACHE_SIZE = 500; // Reduced from 1000 to be more memory-friendly

// Memory cleanup callback for emergency situations
function geocodingMemoryCleanup(level) {
  console.log(`🧹 Geocoding Cache: ${level} memory cleanup triggered`);
  
  if (level === 'emergency') {
    // Emergency: Clear most of the cache
    memoryCache.clear();
    console.log(`🚨 Emergency cleanup: Cleared geocoding memory cache`);
  } else {
    // Preventive: Remove expired entries and oldest 50%
    const now = Date.now();
    const cutoff = now - MEMORY_CACHE_TTL;
    const entries = Array.from(memoryCache.entries());
    
    // Remove expired entries
    for (const [key, value] of entries) {
      if (value.timestamp < cutoff) {
        memoryCache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (memoryCache.size > MAX_MEMORY_CACHE_SIZE / 2) {
      const remainingEntries = Array.from(memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = remainingEntries.slice(0, remainingEntries.length / 2);
      for (const [key] of toRemove) {
        memoryCache.delete(key);
      }
    }
    
    console.log(`🧹 Preventive cleanup: Geocoding cache now has ${memoryCache.size} entries`);
  }
}

// Register memory cleanup callback
if (typeof memoryMonitor?.registerCleanupCallback === 'function') {
  memoryMonitor.registerCleanupCallback(geocodingMemoryCleanup);
  console.log('📊 Registered geocoding cache memory cleanup callback');
}

/**
 * Reverse geocode coordinates with caching
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Geocoding options
 * @returns {string} Location description
 */
export async function reverseGeocodeWithCache(lat, lng, options = {}) {
  try {
    const { precision = 6, forceRefresh = false } = options;
    
    // Create cache key with precision
    const cacheKey = `${lat.toFixed(precision)},${lng.toFixed(precision)}`;
    
    // Check memory cache first (fastest)
    if (!forceRefresh) {
      const memoryResult = getFromMemoryCache(cacheKey);
      if (memoryResult) {
        console.log(`🎯 Geocoding cache hit (memory): ${cacheKey}`);
        return memoryResult;
      }
    }
    
    // Check database cache
    if (!forceRefresh) {
      const dbResult = await getFromDatabaseCache(cacheKey);
      if (dbResult) {
        console.log(`🎯 Geocoding cache hit (database): ${cacheKey}`);
        // Store in memory for faster future access
        setMemoryCache(cacheKey, dbResult);
        return dbResult;
      }
    }
    
    // No cache hit - perform actual geocoding
    console.log(`🌍 Reverse geocoding: ${lat}, ${lng}`);
    const geocodedLocation = await performReverseGeocode(lat, lng, options);
    
    // Cache the result
    if (geocodedLocation && geocodedLocation !== 'Location unknown') {
      await cacheGeocodingResult(cacheKey, lat, lng, geocodedLocation);
      setMemoryCache(cacheKey, geocodedLocation);
    }
    
    return geocodedLocation;
    
  } catch (error) {
    console.error('Error in reverse geocoding with cache:', error);
    return generateFallbackLocation(lat, lng);
  }
}

/**
 * Perform actual reverse geocoding using multiple providers
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Geocoding options
 * @returns {string} Location description
 */
async function performReverseGeocode(lat, lng, options = {}) {
  const providers = ['tomtom', 'nominatim', 'coordinates'];
  
  for (const provider of providers) {
    try {
      const result = await geocodeWithProvider(provider, lat, lng, options);
      if (result && result !== 'Location unknown') {
        console.log(`✅ Geocoding successful with ${provider}: ${result}`);
        return result;
      }
    } catch (error) {
      console.warn(`⚠️ Geocoding failed with ${provider}:`, error.message);
    }
  }
  
  // All providers failed
  return generateFallbackLocation(lat, lng);
}

/**
 * Geocode using specific provider
 * @param {string} provider - Provider name
 * @param {number} lat - Latitude  
 * @param {number} lng - Longitude
 * @param {Object} options - Options
 * @returns {string} Location description
 */
async function geocodeWithProvider(provider, lat, lng, options = {}) {
  switch (provider) {
    case 'tomtom':
      return await geocodeWithTomTom(lat, lng, options);
    case 'nominatim':
      return await geocodeWithNominatim(lat, lng, options);
    case 'coordinates':
      return generateCoordinateLocation(lat, lng);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Geocode using TomTom API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Options
 * @returns {string} Location description
 */
async function geocodeWithTomTom(lat, lng, options = {}) {
  if (!process.env.TOMTOM_API_KEY) {
    throw new Error('TomTom API key not configured');
  }
  
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${process.env.TOMTOM_API_KEY}&radius=100`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GoBarry/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const address = result.address;
      
      // Build comprehensive location string
      const parts = [];
      
      if (address.streetName) {
        parts.push(address.streetName);
      }
      
      if (address.municipality || address.localName) {
        parts.push(address.municipality || address.localName);
      } else if (address.adminDistricts?.length > 0) {
        parts.push(address.adminDistricts[0].name);
      }
      
      if (parts.length === 0 && address.freeformAddress) {
        return address.freeformAddress;
      }
      
      return parts.length > 0 ? parts.join(', ') : null;
    }
    
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('TomTom request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Geocode using OpenStreetMap Nominatim API (free fallback)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} options - Options
 * @returns {string} Location description
 */
async function geocodeWithNominatim(lat, lng, options = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GoBarry/1.0 (traffic management system)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      const parts = [];
      
      // Build location from most specific to least specific
      if (address.road || address.pedestrian) {
        parts.push(address.road || address.pedestrian);
      } else if (address.amenity) {
        parts.push(address.amenity);
      }
      
      if (address.suburb || address.neighbourhood) {
        parts.push(address.suburb || address.neighbourhood);
      } else if (address.village || address.town || address.city) {
        parts.push(address.village || address.town || address.city);
      }
      
      if (parts.length === 0 && data.display_name) {
        // Use first part of display name if no structured address
        const displayParts = data.display_name.split(',');
        return displayParts.slice(0, 2).join(', ');
      }
      
      return parts.length > 0 ? parts.join(', ') : null;
    }
    
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Nominatim request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate coordinate-based location description
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Coordinate location
 */
function generateCoordinateLocation(lat, lng) {
  // Determine general area based on coordinate ranges
  const area = determineGeneralArea(lat, lng);
  return `${area} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Determine general area from coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude  
 * @returns {string} General area name
 */
function determineGeneralArea(lat, lng) {
  // North East England coordinate ranges (approximate)
  if (lat >= 54.8 && lat <= 55.5 && lng >= -2.5 && lng <= -1.3) {
    if (lat >= 55.0) return 'Northumberland';
    if (lng <= -1.8) return 'Newcastle area';
    if (lat >= 54.95) return 'Gateshead area';
    if (lat <= 54.85) return 'Durham area';
    return 'Tyneside area';
  }
  
  if (lat >= 54.5 && lat <= 55.0 && lng >= -1.8 && lng <= -1.2) {
    if (lat >= 54.8) return 'Sunderland area';
    return 'County Durham';
  }
  
  return 'North East England';
}

/**
 * Generate fallback location when all geocoding fails
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string} Fallback location
 */
function generateFallbackLocation(lat, lng) {
  const area = determineGeneralArea(lat, lng);
  return `Location in ${area}`;
}

/**
 * Get result from memory cache
 * @param {string} cacheKey - Cache key
 * @returns {string|null} Cached result or null
 */
function getFromMemoryCache(cacheKey) {
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.timestamp > Date.now() - MEMORY_CACHE_TTL) {
    return cached.data;
  }
  
  // Remove expired cache entry
  if (cached) {
    memoryCache.delete(cacheKey);
  }
  
  return null;
}

/**
 * Set result in memory cache
 * @param {string} cacheKey - Cache key
 * @param {string} data - Data to cache
 */
function setMemoryCache(cacheKey, data) {
  memoryCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup old entries if cache gets too large (using new limit)
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const oldestEntries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100);
    
    oldestEntries.forEach(([key]) => memoryCache.delete(key));
  }
}

/**
 * Get result from database cache
 * @param {string} cacheKey - Cache key
 * @returns {string|null} Cached result or null
 */
async function getFromDatabaseCache(cacheKey) {
  try {
    const cutoffTime = new Date(Date.now() - DB_CACHE_TTL).toISOString();
    
    const { data, error } = await supabase
      .from('geocoding_cache')
      .select('location_description')
      .eq('cache_key', cacheKey)
      .gte('cached_at', cutoffTime)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn('Database cache lookup error:', error);
      return null;
    }
    
    return data?.location_description || null;
    
  } catch (error) {
    console.warn('Error getting from database cache:', error);
    return null;
  }
}

/**
 * Cache geocoding result in database
 * @param {string} cacheKey - Cache key
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} locationDescription - Location description
 */
async function cacheGeocodingResult(cacheKey, lat, lng, locationDescription) {
  try {
    const { error } = await supabase
      .from('geocoding_cache')
      .upsert({
        cache_key: cacheKey,
        latitude: lat,
        longitude: lng,
        location_description: locationDescription,
        cached_at: new Date().toISOString()
      }, {
        onConflict: 'cache_key'
      });
    
    if (error) {
      console.warn('Failed to cache geocoding result:', error);
    }
    
  } catch (error) {
    console.warn('Error caching geocoding result:', error);
    // Don't throw - caching failure shouldn't break the main flow
  }
}

/**
 * Cleanup old cache entries
 * Should be called periodically (e.g., daily)
 */
export async function cleanupGeocodingCache() {
  try {
    const cutoffTime = new Date(Date.now() - DB_CACHE_TTL).toISOString();
    
    const { error } = await supabase
      .from('geocoding_cache')
      .delete()
      .lt('cached_at', cutoffTime);
    
    if (error) {
      console.error('Error cleaning up geocoding cache:', error);
    } else {
      console.log('✅ Geocoding cache cleanup completed');
    }
    
  } catch (error) {
    console.error('Error in geocoding cache cleanup:', error);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export async function getGeocodingCacheStats() {
  try {
    const { data, error } = await supabase
      .from('geocoding_cache')
      .select('cached_at')
      .order('cached_at', { ascending: false });
    
    if (error) throw error;
    
    const total = data?.length || 0;
    const recentEntries = data?.filter(entry => 
      new Date(entry.cached_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length || 0;
    
    return {
      success: true,
      stats: {
        totalEntries: total,
        recentEntries,
        memoryCacheSize: memoryCache.size,
        cacheHitRate: 'N/A' // Would need request tracking to calculate
      }
    };
    
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      success: false,
      error: error.message,
      stats: {
        totalEntries: 0,
        recentEntries: 0,
        memoryCacheSize: memoryCache.size,
        cacheHitRate: 'N/A'
      }
    };
  }
}

/**
 * Bulk geocode multiple coordinates
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @param {Object} options - Geocoding options
 * @returns {Array} Array of geocoded results
 */
export async function bulkReverseGeocode(coordinates, options = {}) {
  const { batchSize = 10, delayBetweenBatches = 1000 } = options;
  const results = [];
  
  // Process in batches to avoid overwhelming APIs
  for (let i = 0; i < coordinates.length; i += batchSize) {
    const batch = coordinates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (coord, index) => {
      try {
        const location = await reverseGeocodeWithCache(coord.lat, coord.lng, options);
        return {
          ...coord,
          location,
          success: true,
          index: i + index
        };
      } catch (error) {
        return {
          ...coord,
          location: generateFallbackLocation(coord.lat, coord.lng),
          success: false,
          error: error.message,
          index: i + index
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay between batches (except for last batch)
    if (i + batchSize < coordinates.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  // Sort by original index
  return results.sort((a, b) => a.index - b.index);
}

export default {
  reverseGeocodeWithCache,
  cleanupGeocodingCache,
  getGeocodingCacheStats,
  bulkReverseGeocode
};