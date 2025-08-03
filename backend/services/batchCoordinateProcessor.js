// backend/services/batchCoordinateProcessor.js
// High-performance batch coordinate processing with parallel execution
import { processStreetManagerCoordinates } from '../utils/coordinateConverterProj4.js';
import { coordinateFallbackProcessor } from '../utils/coordinateFallbackProcessor.js';
import { intelligentCoordinateResolver } from './intelligentCoordinateResolver.js';
import { coordinateValidator } from '../utils/coordinateValidator.js';
import { coordinateCacheService } from './coordinateCacheService.js';

class BatchCoordinateProcessor {
  constructor() {
    this.concurrencyLimit = 10; // Process 10 items in parallel
    this.batchSize = 50; // Process in batches of 50
    this.maxRetries = 2;
    this.processingStats = {
      total: 0,
      processed: 0,
      cached: 0,
      failed: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Process coordinates for a large dataset with optimizations
   */
  async processCoordinatesBatch(roadworks, options = {}) {
    const startTime = Date.now();
    console.log(`🚀 Starting optimized coordinate processing for ${roadworks.length} roadworks`);
    
    this.processingStats = {
      total: roadworks.length,
      processed: 0,
      cached: 0,
      failed: 0,
      startTime
    };

    // Step 1: Check cache and separate items that need processing
    console.log('📦 Checking coordinate cache...');
    const { needsProcessing, alreadyProcessed } = coordinateCacheService.identifyProcessingNeeded(roadworks);
    
    this.processingStats.cached = alreadyProcessed.length;
    console.log(`✅ Cache hit: ${alreadyProcessed.length}/${roadworks.length} (${Math.round(alreadyProcessed.length/roadworks.length*100)}%)`);

    if (needsProcessing.length === 0) {
      console.log('🎉 All coordinates cached! No processing needed.');
      return alreadyProcessed;
    }

    console.log(`⚡ Processing ${needsProcessing.length} items that need coordinate resolution`);

    // Step 2: Process in optimized batches
    const processedItems = await this.processBatches(needsProcessing, options);

    // Step 3: Combine results
    const allResults = [...alreadyProcessed, ...processedItems];
    
    this.processingStats.endTime = Date.now();
    const totalTime = (this.processingStats.endTime - startTime) / 1000;
    
    console.log(`✅ Batch processing complete in ${totalTime.toFixed(2)}s`);
    console.log(`📊 Results: ${this.processingStats.cached} cached, ${this.processingStats.processed} processed, ${this.processingStats.failed} failed`);
    
    return allResults;
  }

  /**
   * Process items in optimized batches with parallel execution
   */
  async processBatches(items, options) {
    const batches = this.createBatches(items, this.batchSize);
    const allResults = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);
      
      try {
        const batchResults = await this.processParallelBatch(batch, options);
        allResults.push(...batchResults);
        
        // Brief pause between batches to avoid overwhelming external APIs
        if (i < batches.length - 1) {
          await this.sleep(100);
        }
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.message);
        // Add failed items as-is
        allResults.push(...batch.map(item => ({
          ...item,
          coordinates: null,
          coordinateSource: 'batch_failed',
          coordinateError: error.message
        })));
      }
    }

    return allResults;
  }

  /**
   * Process a single batch with parallel execution
   */
  async processParallelBatch(batch, options) {
    // Process items in parallel with concurrency limit
    const semaphore = new Semaphore(this.concurrencyLimit);
    
    const promises = batch.map(async (item) => {
      return semaphore.acquire(async () => {
        return this.processIndividualItem(item, options);
      });
    });

    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        this.processingStats.processed++;
        return result.value;
      } else {
        this.processingStats.failed++;
        console.error(`Item ${batch[index].id} failed:`, result.reason?.message);
        return {
          ...batch[index],
          coordinates: null,
          coordinateSource: 'processing_failed',
          coordinateError: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  /**
   * Process a single roadwork item with optimized strategy selection
   */
  async processIndividualItem(roadwork, options) {
    // Fast path: Check if we have OSGB36 coordinates for direct conversion
    if (roadwork.sm_easting && roadwork.sm_northing) {
      const processed = await processStreetManagerCoordinates(roadwork, { forceRecalculate: false });
      if (processed.coordinates) {
        // Cache the result
        if (processed.shouldUpdateCache) {
          coordinateCacheService.storeCachedCoordinates(
            roadwork.id, 
            processed.coordinates, 
            processed.cacheData?.coordinate_metadata || {}
          ).catch(() => {}); // Don't block on cache storage
        }
        return processed;
      }
    }

    // Medium path: Try intelligent resolution (faster than fallback)
    try {
      const intelligent = await intelligentCoordinateResolver.resolveCoordinates(roadwork);
      if (intelligent.coordinates) {
        // Cache the result
        coordinateCacheService.storeCachedCoordinates(
          roadwork.id,
          intelligent.coordinates,
          {
            source: intelligent.coordinateSource,
            accuracy: intelligent.coordinateAccuracy,
            strategy: intelligent.coordinateStrategy,
            confidence: intelligent.coordinateConfidence
          }
        ).catch(() => {}); // Don't block on cache storage
        
        return intelligent;
      }
    } catch (error) {
      console.warn(`Intelligent resolution failed for ${roadwork.id}:`, error.message);
    }

    // Slow path: Use fallback processor only if really needed
    try {
      const fallback = await coordinateFallbackProcessor.processRoadworkWithFallbacks(roadwork);
      if (fallback.coordinates) {
        // Cache the result
        coordinateCacheService.storeCachedCoordinates(
          roadwork.id,
          fallback.coordinates,
          {
            source: fallback.coordinateSource || 'fallback',
            strategy: fallback.coordinateFallbackStrategy,
            accuracy: 'medium'
          }
        ).catch(() => {}); // Don't block on cache storage
        
        return fallback;
      }
    } catch (error) {
      console.warn(`Fallback processing failed for ${roadwork.id}:`, error.message);
    }

    // No coordinates found
    return {
      ...roadwork,
      coordinates: null,
      coordinateSource: 'unresolved',
      coordinateError: 'All coordinate resolution strategies failed'
    };
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    const stats = { ...this.processingStats };
    if (stats.startTime && stats.endTime) {
      stats.totalTimeSeconds = (stats.endTime - stats.startTime) / 1000;
      stats.itemsPerSecond = stats.processed / stats.totalTimeSeconds;
    }
    return stats;
  }

  // Helper methods

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Simple semaphore for concurrency control
 */
class Semaphore {
  constructor(permits) {
    this.permits = permits;
    this.waiting = [];
  }

  async acquire(fn) {
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject, fn });
      this.tryNext();
    });
  }

  tryNext() {
    if (this.permits > 0 && this.waiting.length > 0) {
      this.permits--;
      const { resolve, reject, fn } = this.waiting.shift();
      
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.permits++;
          this.tryNext();
        });
    }
  }
}

export const batchCoordinateProcessor = new BatchCoordinateProcessor();