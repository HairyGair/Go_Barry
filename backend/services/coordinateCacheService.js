// backend/services/coordinateCacheService.js
// High-performance coordinate caching service
import axios from 'axios';

class CoordinateCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.batchSize = 100;
  }

  /**
   * Get cached coordinates for a roadwork item
   */
  getCachedCoordinates(roadwork) {
    // Check memory cache first by ID
    const idCacheKey = `id:${roadwork.id}`;
    const memoryCachedById = this.memoryCache.get(idCacheKey);
    
    if (memoryCachedById && this.isCacheValid(memoryCachedById.timestamp)) {
      return {
        coordinates: [memoryCachedById.lat, memoryCachedById.lng],
        source: memoryCachedById.source,
        accuracy: memoryCachedById.accuracy,
        cacheHit: 'memory'
      };
    }
    
    // Also check by generated cache key for backward compatibility
    const cacheKey = this.generateCacheKey(roadwork);
    const memoryCached = this.memoryCache.get(cacheKey);
    
    if (memoryCached && this.isCacheValid(memoryCached.timestamp)) {
      return {
        coordinates: [memoryCached.lat, memoryCached.lng],
        source: memoryCached.source,
        accuracy: memoryCached.accuracy,
        cacheHit: 'memory'
      };
    }

    // Check database cache using new columns
    if (roadwork.cached_lat && roadwork.cached_lng && roadwork.cached_at) {
      if (this.isCacheValid(roadwork.cached_at)) {
        // Store in memory cache for faster future access
        this.memoryCache.set(idCacheKey, {
          lat: roadwork.cached_lat,
          lng: roadwork.cached_lng,
          source: roadwork.cached_coordinate_source || 'cached',
          accuracy: roadwork.cached_coordinate_accuracy || 'high',
          timestamp: roadwork.cached_at
        });

        return {
          coordinates: [parseFloat(roadwork.cached_lat), parseFloat(roadwork.cached_lng)],
          source: roadwork.cached_coordinate_source || 'cached',
          accuracy: roadwork.cached_coordinate_accuracy || 'high',
          cacheHit: 'database'
        };
      }
    }

    return null;
  }

  /**
   * Store coordinates in cache
   */
  async storeCachedCoordinates(roadworkId, coordinates, metadata) {
    try {
      // Store in memory cache first
      const cacheKey = `id:${roadworkId}`;
      this.memoryCache.set(cacheKey, {
        lat: coordinates[0],
        lng: coordinates[1],
        source: metadata.source || 'processed',
        accuracy: metadata.accuracy || 'high',
        timestamp: new Date().toISOString()
      });
      
      // Now store in database with new columns
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Cannot store coordinates: Supabase config missing');
        return;
      }

      const cacheData = {
        cached_lat: coordinates[0],
        cached_lng: coordinates[1],
        cached_coordinate_source: metadata.source || 'processed',
        cached_coordinate_accuracy: metadata.accuracy || 'high',
        cached_at: new Date().toISOString(),
        coordinate_metadata: {
          ...metadata,
          cached: true,
          cache_version: '2.0'
        }
      };

      // Update database asynchronously
      await axios.patch(
        `${supabaseUrl}/rest/v1/streetworks?id=eq.${roadworkId}`,
        cacheData,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          timeout: 5000
        }
      );
      
      console.log(`✅ Cached coordinates for roadwork ${roadworkId}`);

    } catch (error) {
      console.error('Failed to store cached coordinates:', error.message);
      // Don't throw - caching failure shouldn't break coordinate processing
    }
  }

  /**
   * Batch update coordinates for multiple roadworks
   */
  async batchStoreCachedCoordinates(roadworksWithCoordinates) {
    // Store all in memory cache first
    for (const roadwork of roadworksWithCoordinates) {
      if (roadwork.id && roadwork.coordinates) {
        const cacheKey = `id:${roadwork.id}`;
        this.memoryCache.set(cacheKey, {
          lat: roadwork.coordinates[0],
          lng: roadwork.coordinates[1],
          source: roadwork.coordinateSource || 'processed',
          accuracy: roadwork.coordinateAccuracy || 'high',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Now batch update to database
    const batches = this.createBatches(roadworksWithCoordinates, this.batchSize);
    
    for (const batch of batches) {
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('Batch storage failed:', error.message);
        // Continue with other batches even if one fails
      }
    }
  }

  /**
   * Pre-populate cache from existing data
   */
  async preloadCache(roadworks) {
    console.log(`📦 Pre-loading coordinate cache for ${roadworks.length} roadworks`);
    
    let cacheHits = 0;
    const cachedRoadworks = [];

    for (const roadwork of roadworks) {
      const cached = this.getCachedCoordinates(roadwork);
      if (cached) {
        cacheHits++;
        cachedRoadworks.push({
          ...roadwork,
          coordinates: cached.coordinates,
          coordinateSource: cached.source,
          coordinateAccuracy: cached.accuracy,
          cacheHit: cached.cacheHit
        });
      } else {
        cachedRoadworks.push(roadwork);
      }
    }

    console.log(`✅ Cache preload complete: ${cacheHits}/${roadworks.length} hits (${Math.round(cacheHits/roadworks.length*100)}%)`);
    return cachedRoadworks;
  }

  /**
   * Identify roadworks that need coordinate processing
   */
  identifyProcessingNeeded(roadworks) {
    const needsProcessing = [];
    const alreadyProcessed = [];

    for (const roadwork of roadworks) {
      const cached = this.getCachedCoordinates(roadwork);
      if (cached) {
        alreadyProcessed.push({
          ...roadwork,
          coordinates: cached.coordinates,
          coordinateSource: cached.source,
          coordinateAccuracy: cached.accuracy,
          cacheHit: cached.cacheHit
        });
      } else {
        needsProcessing.push(roadwork);
      }
    }

    return { needsProcessing, alreadyProcessed };
  }

  // Helper methods

  generateCacheKey(roadwork) {
    // Generate unique key based on coordinate source data
    const parts = [];
    
    if (roadwork.sm_easting && roadwork.sm_northing) {
      parts.push(`point:${roadwork.sm_easting}:${roadwork.sm_northing}`);
    }
    
    if (roadwork.works_location_coordinates) {
      parts.push(`wkt:${roadwork.works_location_coordinates.substring(0, 50)}`);
    }
    
    if (roadwork.raw_webhook_data?.object_data?.works_location_coordinates) {
      parts.push(`webhook:${roadwork.raw_webhook_data.object_data.works_location_coordinates.substring(0, 50)}`);
    }

    if (parts.length === 0) {
      // Fallback to location-based key for geocoded results
      parts.push(`location:${roadwork.sm_street_name}:${roadwork.sm_town || roadwork.sm_area}`);
    }

    return parts.join('|');
  }

  isCacheValid(timestamp) {
    if (!timestamp) return false;
    
    const age = Date.now() - new Date(timestamp).getTime();
    return age < this.cacheExpiry;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(batch) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Cannot batch store coordinates: Supabase config missing');
      return;
    }

    const updates = batch.map(item => ({
      id: item.id,
      cached_lat: item.coordinates[0],
      cached_lng: item.coordinates[1],
      cached_coordinate_source: item.coordinateSource || 'processed',
      cached_coordinate_accuracy: item.coordinateAccuracy || item.accuracy || 'high',
      cached_at: new Date().toISOString(),
      coordinate_metadata: {
        ...(item.metadata || {}),
        source: item.coordinateSource,
        accuracy: item.coordinateAccuracy || item.accuracy,
        strategy: item.coordinateStrategy,
        confidence: item.coordinateConfidence,
        batch_processed: true,
        cache_version: '2.0'
      }
    }));

    // Use upsert for batch operations
    await axios.post(
      `${supabaseUrl}/rest/v1/streetworks`,
      updates,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        timeout: 10000
      }
    );
    
    console.log(`✅ Batch cached ${updates.length} coordinates`);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (!this.isCacheValid(value.timestamp)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      cacheExpiry: this.cacheExpiry,
      maxAge: '30 days'
    };
  }
}

export const coordinateCacheService = new CoordinateCacheService();