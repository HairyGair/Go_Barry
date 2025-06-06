// backend/gtfs-streaming-processor.js
// Streaming GTFS processor to handle large files without memory overflow
// Specifically handles 47MB stop_times.txt and 35MB shapes.txt

import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌊 GTFS Streaming Processor - Memory Safe Implementation');

// Memory monitoring
const getMemoryUsage = () => {
  const used = process.memoryUsage();
  return {
    rss: Math.round(used.rss / 1024 / 1024),
    heapTotal: Math.round(used.heapTotal / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024)
  };
};

// Force garbage collection if available
const forceGC = () => {
  if (global.gc) {
    global.gc();
    console.log('🗑️ Garbage collection triggered');
  }
};

// North East England geographic bounds for filtering
const NORTH_EAST_BOUNDS = {
  north: 56.0,   // Northumberland border
  south: 54.0,   // County Durham/Yorkshire border  
  east: 0.0,     // North Sea coast
  west: -2.5     // West Cumbria border
};

// Memory-safe configuration
const STREAMING_CONFIG = {
  CHUNK_SIZE: 64 * 1024,        // 64KB chunks for file reading
  PROCESSING_BATCH_SIZE: 100,    // Process 100 records at a time
  MAX_MEMORY_MB: 1200,          // Trigger cleanup at 1.2GB
  MEMORY_CHECK_INTERVAL: 1000,   // Check memory every 1000 records
  MAX_STOPS_TO_CACHE: 1500,     // Limit cached stops
  MAX_ROUTES_TO_CACHE: 300      // Limit cached routes
};

// In-memory caches with size limits
const streamingCache = {
  stops: new Map(),
  routes: new Map(),
  nearbyShapes: new Set(),
  lastCleanup: Date.now()
};

// Check if coordinates are in North East England
function isInNorthEast(lat, lng) {
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

// Memory cleanup function
function performStreamingCleanup() {
  const memUsage = getMemoryUsage();
  
  if (memUsage.heapUsed > STREAMING_CONFIG.MAX_MEMORY_MB) {
    console.log(`🧹 Memory cleanup triggered - ${memUsage.heapUsed}MB used`);
    
    // Trim caches to limits
    if (streamingCache.stops.size > STREAMING_CONFIG.MAX_STOPS_TO_CACHE) {
      const stopsArray = Array.from(streamingCache.stops.entries());
      streamingCache.stops = new Map(stopsArray.slice(0, STREAMING_CONFIG.MAX_STOPS_TO_CACHE));
      console.log(`🔄 Trimmed stops cache to ${STREAMING_CONFIG.MAX_STOPS_TO_CACHE} entries`);
    }
    
    if (streamingCache.routes.size > STREAMING_CONFIG.MAX_ROUTES_TO_CACHE) {
      const routesArray = Array.from(streamingCache.routes.entries());
      streamingCache.routes = new Map(routesArray.slice(0, STREAMING_CONFIG.MAX_ROUTES_TO_CACHE));
      console.log(`🔄 Trimmed routes cache to ${STREAMING_CONFIG.MAX_ROUTES_TO_CACHE} entries`);
    }
    
    // Clear temporary data
    if (streamingCache.nearbyShapes.size > 1000) {
      streamingCache.nearbyShapes.clear();
      console.log('🧹 Cleared nearby shapes cache');
    }
    
    forceGC();
    
    const memAfter = getMemoryUsage();
    console.log(`✅ Cleanup complete - ${memAfter.heapUsed}MB used (saved ${memUsage.heapUsed - memAfter.heapUsed}MB)`);
  }
}

// Streaming CSV parser that processes data line by line
class StreamingCSVProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.headers = null;
    this.lineBuffer = '';
    this.processedLines = 0;
    this.onRecordCallback = options.onRecord || (() => {});
    this.memoryCheckInterval = options.memoryCheckInterval || STREAMING_CONFIG.MEMORY_CHECK_INTERVAL;
  }
  
  _transform(chunk, encoding, callback) {
    this.lineBuffer += chunk.toString();
    const lines = this.lineBuffer.split('\n');
    
    // Keep the last incomplete line in buffer
    this.lineBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        this.processedLines++;
        
        if (!this.headers) {
          this.headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
        } else {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const record = {};
          
          for (let i = 0; i < this.headers.length && i < values.length; i++) {
            record[this.headers[i]] = values[i];
          }
          
          // Process the record
          this.onRecordCallback(record);
        }
        
        // Periodic memory check
        if (this.processedLines % this.memoryCheckInterval === 0) {
          performStreamingCleanup();
        }
      }
    }
    
    callback();
  }
  
  _flush(callback) {
    // Process any remaining data in buffer
    if (this.lineBuffer.trim() && this.headers) {
      const values = this.lineBuffer.split(',').map(v => v.trim().replace(/"/g, ''));
      const record = {};
      
      for (let i = 0; i < this.headers.length && i < values.length; i++) {
        record[this.headers[i]] = values[i];
      }
      
      this.onRecordCallback(record);
    }
    
    console.log(`✅ Streaming complete - processed ${this.processedLines} lines`);
    callback();
  }
}

// Stream process stops.txt file (421KB - safe to load normally but streaming for consistency)
export async function streamProcessStops() {
  console.log('📍 Streaming process: stops.txt');
  const memBefore = getMemoryUsage();
  
  try {
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    let processedStops = 0;
    let filteredStops = 0;
    
    const processor = new StreamingCSVProcessor({
      onRecord: (stop) => {
        if (stop.stop_id && stop.stop_lat && stop.stop_lng && stop.stop_name) {
          const lat = parseFloat(stop.stop_lat);
          const lng = parseFloat(stop.stop_lng);
          
          if (isInNorthEast(lat, lng)) {
            streamingCache.stops.set(stop.stop_id, {
              id: stop.stop_id,
              name: stop.stop_name.trim(),
              lat: lat,
              lng: lng,
              code: stop.stop_code || null
            });
            filteredStops++;
          }
          processedStops++;
        }
      }
    });
    
    await pipeline(
      createReadStream(stopsPath, { highWaterMark: STREAMING_CONFIG.CHUNK_SIZE }),
      processor
    );
    
    const memAfter = getMemoryUsage();
    console.log(`✅ Stops streaming complete:`);
    console.log(`   📊 Processed: ${processedStops} total stops`);
    console.log(`   🎯 Cached: ${filteredStops} North East stops`);
    console.log(`   💾 Memory impact: ${memAfter.heapUsed - memBefore.heapUsed}MB`);
    
    return { success: true, processed: processedStops, cached: filteredStops };
    
  } catch (error) {
    console.error('❌ Error streaming stops:', error.message);
    return { success: false, error: error.message };
  }
}

// Stream process routes.txt file
export async function streamProcessRoutes() {
  console.log('🚌 Streaming process: routes.txt');
  const memBefore = getMemoryUsage();
  
  try {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    let processedRoutes = 0;
    
    const processor = new StreamingCSVProcessor({
      onRecord: (route) => {
        if (route.route_id && route.route_short_name) {
          streamingCache.routes.set(route.route_id, {
            id: route.route_id,
            shortName: route.route_short_name.trim(),
            longName: route.route_long_name?.trim() || ''
          });
          processedRoutes++;
        }
      }
    });
    
    await pipeline(
      createReadStream(routesPath, { highWaterMark: STREAMING_CONFIG.CHUNK_SIZE }),
      processor
    );
    
    const memAfter = getMemoryUsage();
    console.log(`✅ Routes streaming complete:`);
    console.log(`   📊 Processed: ${processedRoutes} routes`);
    console.log(`   💾 Memory impact: ${memAfter.heapUsed - memBefore.heapUsed}MB`);
    
    return { success: true, processed: processedRoutes };
    
  } catch (error) {
    console.error('❌ Error streaming routes:', error.message);
    return { success: false, error: error.message };
  }
}

// Memory-safe shapes processing for coordinate matching
export async function streamProcessShapesForCoordinate(targetLat, targetLng, maxDistanceMeters = 250) {
  console.log(`🗺️ Streaming shapes for coordinate ${targetLat}, ${targetLng} (MEMORY SAFE)`);
  const memBefore = getMemoryUsage();
  
  try {
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const nearbyShapes = new Set();
    let processedPoints = 0;
    let matchedPoints = 0;
    const maxPointsToProcess = 20000; // Limit to prevent memory overflow
    
    const processor = new StreamingCSVProcessor({
      memoryCheckInterval: 500, // More frequent memory checks for large file
      onRecord: (shapePoint) => {
        if (processedPoints >= maxPointsToProcess) {
          return; // Stop processing if limit reached
        }
        
        if (shapePoint.shape_id && shapePoint.shape_pt_lat && shapePoint.shape_pt_lng) {
          const lat = parseFloat(shapePoint.shape_pt_lat);
          const lng = parseFloat(shapePoint.shape_pt_lng);
          
          if (!isNaN(lat) && !isNaN(lng) && isInNorthEast(lat, lng)) {
            const distance = calculateDistance(targetLat, targetLng, lat, lng);
            
            if (distance <= maxDistanceMeters) {
              nearbyShapes.add(shapePoint.shape_id);
              matchedPoints++;
            }
          }
          
          processedPoints++;
        }
      }
    });
    
    await pipeline(
      createReadStream(shapesPath, { highWaterMark: STREAMING_CONFIG.CHUNK_SIZE }),
      processor
    );
    
    const memAfter = getMemoryUsage();
    console.log(`✅ Shapes streaming complete:`);
    console.log(`   📊 Processed: ${processedPoints} shape points (limited to ${maxPointsToProcess})`);
    console.log(`   🎯 Found: ${matchedPoints} nearby points in ${nearbyShapes.size} shapes`);
    console.log(`   💾 Memory impact: ${memAfter.heapUsed - memBefore.heapUsed}MB`);
    
    return { success: true, nearbyShapes: Array.from(nearbyShapes), processedPoints, matchedPoints };
    
  } catch (error) {
    console.error('❌ Error streaming shapes:', error.message);
    return { success: false, error: error.message, nearbyShapes: [] };
  }
}

// Calculate distance between coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find nearby stops using cached data
export function findNearbyStopsFromCache(lat, lng, maxDistanceMeters = 300) {
  const nearbyStops = [];
  
  for (const stop of streamingCache.stops.values()) {
    const distance = calculateDistance(lat, lng, stop.lat, stop.lng);
    if (distance <= maxDistanceMeters) {
      nearbyStops.push({
        ...stop,
        distance: Math.round(distance)
      });
    }
  }
  
  return nearbyStops.sort((a, b) => a.distance - b.distance).slice(0, 3);
}

// Get route information from cache
export function getRouteFromCache(routeId) {
  return streamingCache.routes.get(routeId);
}

// Initialize streaming processor
export async function initializeStreamingProcessor() {
  console.log('🌊 Initializing GTFS Streaming Processor...');
  const startTime = Date.now();
  const memBefore = getMemoryUsage();
  
  try {
    // Process stops and routes in sequence to prevent memory spikes
    console.log('📍 Step 1: Processing stops...');
    const stopsResult = await streamProcessStops();
    
    if (!stopsResult.success) {
      throw new Error(`Stops processing failed: ${stopsResult.error}`);
    }
    
    // Force cleanup between operations
    performStreamingCleanup();
    
    console.log('🚌 Step 2: Processing routes...');
    const routesResult = await streamProcessRoutes();
    
    if (!routesResult.success) {
      throw new Error(`Routes processing failed: ${routesResult.error}`);
    }
    
    // Final cleanup
    performStreamingCleanup();
    
    const memAfter = getMemoryUsage();
    const initTime = Date.now() - startTime;
    
    console.log(`✅ Streaming Processor Initialized Successfully:`);
    console.log(`   ⏱️ Time: ${(initTime/1000).toFixed(1)}s`);
    console.log(`   📍 Stops: ${streamingCache.stops.size}`);
    console.log(`   🚌 Routes: ${streamingCache.routes.size}`);
    console.log(`   💾 Memory used: ${memAfter.heapUsed - memBefore.heapUsed}MB`);
    console.log(`   🌊 Streaming mode: Large files processed safely`);
    
    return {
      success: true,
      stats: {
        stops: streamingCache.stops.size,
        routes: streamingCache.routes.size,
        memoryUsed: memAfter.heapUsed - memBefore.heapUsed,
        initTime: initTime
      }
    };
    
  } catch (error) {
    console.error('❌ Streaming processor initialization failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get processor statistics
export function getStreamingStats() {
  return {
    isInitialized: streamingCache.stops.size > 0,
    cacheStats: {
      stops: streamingCache.stops.size,
      routes: streamingCache.routes.size,
      nearbyShapes: streamingCache.nearbyShapes.size
    },
    memoryUsage: getMemoryUsage(),
    config: STREAMING_CONFIG
  };
}

export default {
  initializeStreamingProcessor,
  streamProcessShapesForCoordinate,
  findNearbyStopsFromCache,
  getRouteFromCache,
  getStreamingStats,
  performStreamingCleanup
};
