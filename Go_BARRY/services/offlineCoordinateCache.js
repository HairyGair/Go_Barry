// Go_BARRY/services/offlineCoordinateCache.js
// Offline coordinate caching for critical roadworks
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'offline_critical_coordinates';
const CACHE_EXPIRY_DAYS = 7;

/**
 * Cache critical roadwork coordinates for offline access
 * @param {Array} roadworks - Array of roadwork objects
 * @returns {Object} Cache result
 */
export async function cacheOfflineCoordinates(roadworks) {
  try {
    // Filter critical roadworks (high impact)
    const criticalRoadworks = roadworks.filter(r => {
      return (
        r.coordinates && // Has coordinates
        r.affectedRoutes && r.affectedRoutes.length > 3 && // Affects multiple routes
        (r.sm_works_state === 'Works in progress' || // Active works
         r.sm_works_state === 'Works planned') // Or upcoming
      );
    });

    // Prepare minimal data for storage
    const cacheData = criticalRoadworks.map(r => ({
      id: r.id,
      reference: r.sm_reference,
      coordinates: r.coordinates,
      street: r.sm_street_name,
      location: r.sm_location_description,
      state: r.sm_works_state,
      startDate: r.sm_start_date,
      endDate: r.sm_end_date,
      impact: r.affectedRoutes.length,
      what3words: r.what3words?.words,
      verified: r.coordinateMetadata?.verified || false
    }));

    // Store with timestamp
    const cacheEntry = {
      timestamp: new Date().toISOString(),
      count: cacheData.length,
      data: cacheData
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    
    console.log(`💾 Cached ${cacheData.length} critical roadwork coordinates offline`);
    
    return {
      success: true,
      cached: cacheData.length,
      sizeKB: Math.round(JSON.stringify(cacheEntry).length / 1024)
    };
  } catch (error) {
    console.error('❌ Offline cache error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Retrieve offline coordinates
 * @returns {Object} Cached coordinates or empty array
 */
export async function getOfflineCoordinates() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!cached) {
      return {
        success: true,
        data: [],
        source: 'empty_cache'
      };
    }

    const cacheEntry = JSON.parse(cached);
    
    // Check cache age
    const cacheAge = (Date.now() - new Date(cacheEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    if (cacheAge > CACHE_EXPIRY_DAYS) {
      console.warn(`⚠️ Offline cache expired (${Math.round(cacheAge)} days old)`);
      return {
        success: true,
        data: cacheEntry.data,
        source: 'expired_cache',
        ageInDays: Math.round(cacheAge)
      };
    }

    return {
      success: true,
      data: cacheEntry.data,
      source: 'cache',
      cachedAt: cacheEntry.timestamp,
      ageInDays: Math.round(cacheAge)
    };
  } catch (error) {
    console.error('❌ Offline retrieval error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

/**
 * Search offline coordinates by location
 * @param {string} searchTerm - Street name or location
 * @returns {Array} Matching roadworks
 */
export async function searchOfflineCoordinates(searchTerm) {
  const cached = await getOfflineCoordinates();
  
  if (!cached.success || !cached.data) {
    return [];
  }

  const normalizedSearch = searchTerm.toLowerCase();
  
  return cached.data.filter(roadwork => {
    const streetMatch = roadwork.street?.toLowerCase().includes(normalizedSearch);
    const locationMatch = roadwork.location?.toLowerCase().includes(normalizedSearch);
    const referenceMatch = roadwork.reference?.toLowerCase().includes(normalizedSearch);
    const w3wMatch = roadwork.what3words?.toLowerCase().includes(normalizedSearch);
    
    return streetMatch || locationMatch || referenceMatch || w3wMatch;
  });
}

/**
 * Clear offline cache
 */
export async function clearOfflineCache() {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Offline coordinate cache cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Clear cache error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!cached) {
      return {
        exists: false,
        count: 0,
        sizeKB: 0
      };
    }

    const cacheEntry = JSON.parse(cached);
    const cacheAge = (Date.now() - new Date(cacheEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      exists: true,
      count: cacheEntry.data.length,
      sizeKB: Math.round(cached.length / 1024),
      cachedAt: cacheEntry.timestamp,
      ageInDays: Math.round(cacheAge),
      expired: cacheAge > CACHE_EXPIRY_DAYS
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

/**
 * Auto-sync offline cache with online data
 * @param {Array} onlineRoadworks - Current online roadworks
 */
export async function syncOfflineCache(onlineRoadworks) {
  const stats = await getCacheStats();
  
  // Only update if online data is available and cache is old
  if (onlineRoadworks && onlineRoadworks.length > 0 && 
      (!stats.exists || stats.ageInDays > 1)) {
    const result = await cacheOfflineCoordinates(onlineRoadworks);
    console.log(`🔄 Auto-synced offline cache: ${result.cached} roadworks`);
    return result;
  }
  
  return { success: false, reason: 'No sync needed' };
}

export default {
  cacheOfflineCoordinates,
  getOfflineCoordinates,
  searchOfflineCoordinates,
  clearOfflineCache,
  getCacheStats,
  syncOfflineCache
};
