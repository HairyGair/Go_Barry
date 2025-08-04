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

    // Check database cache (disabled for now as fields don't exist)
    /*
    if (roadwork.converted_coordinates && roadwork.coordinate_metadata) {
      const cached = roadwork.converted_coordinates;
      const metadata = roadwork.coordinate_metadata;
      
      if (this.isCacheValid(metadata.converted_at)) {
        // Store in memory cache for faster future access
        this.memoryCache.set(cacheKey, {
          lat: cached.lat,
          lng: cached.lng,
          source: metadata.source,
          accuracy: cached.accuracy,
          timestamp: metadata.converted_at
        });

        return {
          coordinates: [cached.lat, cached.lng],
          source: metadata.source || 'cached',
          accuracy: cached.accuracy || 'high',
          cacheHit: 'database'
        };
      }
    }
    */

    return null;
  }

  /**
   * Store coordinates in cache
   */
  async storeCachedCoordinates(roadworkId, coordinates, metadata) {
    try {
      // DISABLED: The streetworks table doesn't have converted_coordinates/coordinate_metadata fields
      // This was causing 400 errors. Keeping memory cache only.
      
      // Store in memory cache only
      const cacheKey = `id:${roadworkId}`;
      this.memoryCache.set(cacheKey, {
        lat: coordinates[0],
        lng: coordinates[1],
        source: metadata.source || 'processed',
        accuracy: metadata.accuracy || 'high',
        timestamp: new Date().toISOString()
      });
      
      // Comment out Supabase update to prevent 400 errors
      /*
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Cannot store coordinates: Supabase config missing');
        return;
      }

      const cacheData = {
        converted_coordinates: {
          lat: coordinates[0],
          lng: coordinates[1],
          accuracy: metadata.accuracy || 'high'
        },
        coordinate_metadata: {
          ...metadata,
          converted_at: new Date().toISOString(),
          cached: true
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
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      */

    } catch (error) {
      console.error('Failed to store cached coordinates:', error.message);
    }
  }

  /**
   * Batch update coordinates for multiple roadworks
   */
  async batchStoreCachedCoordinates(roadworksWithCoordinates) {
    // DISABLED: Batch storage to Supabase disabled due to missing table columns
    // Only using memory cache now
    console.log('📦 Batch coordinate storage skipped (using memory cache only)');
    
    // Store all in memory cache
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
    
    /* Original batch storage disabled
    const batches = this.createBatches(roadworksWithCoordinates, this.batchSize);
    
    for (const batch of batches) {
      try {
        await this.processBatch(batch);
      } catch (error) {
        console.error('Batch storage failed:', error.message);
      }
    }
    */
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

    const updates = batch.map(item => ({
      id: item.id,
      converted_coordinates: {
        lat: item.coordinates[0],
        lng: item.coordinates[1],
        accuracy: item.accuracy || 'high'
      },
      coordinate_metadata: {
        ...item.metadata,
        converted_at: new Date().toISOString(),
        batch_processed: true
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
          'Prefer': 'resolution=merge-duplicates'
        },
        timeout: 10000
      }
    );
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