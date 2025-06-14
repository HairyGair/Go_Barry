// backend/services/enhancedGTFSMatcher.js
// Enhanced GTFS Route Matching with 2GB Memory Optimization
// Improved spatial algorithms and route shape analysis for Go BARRY

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedGTFSMatcher {
  constructor() {
    this.routes = new Map();
    this.stops = new Map();
    this.shapes = new Map();
    this.trips = new Map();
    this.stopTimes = new Map();
    
    // Enhanced spatial indices
    this.routeShapeIndex = new Map(); // route_id -> array of shape coordinates
    this.spatialGrid = new Map(); // grid cell -> routes
    this.routeStopSequences = new Map(); // route_id -> ordered stops
    this.directionAwareRoutes = new Map(); // route + direction -> shape data
    
    // Performance caches with memory management
    this.coordinateCache = new LRUCache(5000); // Cache coordinate lookups
    this.routeDistanceCache = new LRUCache(10000); // Cache distance calculations
    
    // Configuration
    this.gridSize = 0.001; // ~100m grid cells for spatial indexing
    this.maxSearchRadius = 500; // meters
    this.minConfidenceThreshold = 0.3;
    
    this.isInitialized = false;
    this.initializationProgress = 0;
  }

  async initialize() {
    console.log('🚀 Enhanced GTFS Matcher starting with 2GB memory optimization...');
    
    try {
      await this.loadGTFSData();
      await this.buildSpatialIndices();
      await this.optimizeRouteShapes();
      
      this.isInitialized = true;
      console.log('✅ Enhanced GTFS Matcher ready with improved accuracy algorithms');
      
      // Memory usage report
      this.reportMemoryUsage();
      
    } catch (error) {
      console.error('❌ Enhanced GTFS initialization failed:', error);
      throw error;
    }
  }

  async loadGTFSData() {
    const dataPath = path.join(__dirname, '../data');
    
    console.log('📊 Loading GTFS data files...');
    this.initializationProgress = 10;
    
    // Load routes
    try {
      const routesData = await fs.readFile(path.join(dataPath, 'routes.txt'), 'utf-8');
      const routesRecords = parse(routesData, { columns: true, skip_empty_lines: true });
      
      for (const route of routesRecords) {
        this.routes.set(route.route_id, {
          id: route.route_id,
          shortName: route.route_short_name,
          longName: route.route_long_name,
          type: parseInt(route.route_type) || 3,
          color: route.route_color || 'FFFFFF',
          agency: route.agency_id
        });
      }
      console.log(`✅ Loaded ${this.routes.size} routes`);
    } catch (error) {
      console.error('❌ Failed to load routes.txt:', error);
    }
    
    this.initializationProgress = 25;
    
    // Load stops with enhanced indexing
    try {
      const stopsData = await fs.readFile(path.join(dataPath, 'stops.txt'), 'utf-8');
      const stopsRecords = parse(stopsData, { columns: true, skip_empty_lines: true });
      
      for (const stop of stopsRecords) {
        const lat = parseFloat(stop.stop_lat);
        const lng = parseFloat(stop.stop_lon);
        
        if (lat && lng) {
          this.stops.set(stop.stop_id, {
            id: stop.stop_id,
            name: stop.stop_name,
            lat,
            lng,
            code: stop.stop_code,
            gridCell: this.getGridCell(lat, lng)
          });
        }
      }
      console.log(`✅ Loaded ${this.stops.size} stops with spatial indexing`);
    } catch (error) {
      console.error('❌ Failed to load stops.txt:', error);
    }
    
    this.initializationProgress = 40;
    
    // Load shapes for route geometry
    try {
      const shapesData = await fs.readFile(path.join(dataPath, 'shapes.txt'), 'utf-8');
      const shapesRecords = parse(shapesData, { columns: true, skip_empty_lines: true });
      
      // Group by shape_id and sort by sequence
      const shapeGroups = new Map();
      
      for (const shape of shapesRecords) {
        const shapeId = shape.shape_id;
        const lat = parseFloat(shape.shape_pt_lat);
        const lng = parseFloat(shape.shape_pt_lon);
        const sequence = parseInt(shape.shape_pt_sequence);
        
        if (lat && lng && !isNaN(sequence)) {
          if (!shapeGroups.has(shapeId)) {
            shapeGroups.set(shapeId, []);
          }
          
          shapeGroups.get(shapeId).push({
            lat,
            lng,
            sequence,
            gridCell: this.getGridCell(lat, lng)
          });
        }
      }
      
      // Sort and store shapes
      for (const [shapeId, points] of shapeGroups) {
        const sortedPoints = points.sort((a, b) => a.sequence - b.sequence);
        this.shapes.set(shapeId, sortedPoints);
      }
      
      console.log(`✅ Loaded ${this.shapes.size} route shapes with ${shapesRecords.length} points`);
    } catch (error) {
      console.warn('⚠️ shapes.txt not found or invalid, using stop-based routing');
    }
    
    this.initializationProgress = 60;
    
    // Load trips to connect routes with shapes
    try {
      const tripsData = await fs.readFile(path.join(dataPath, 'trips.txt'), 'utf-8');
      const tripsRecords = parse(tripsData, { columns: true, skip_empty_lines: true });
      
      for (const trip of tripsRecords) {
        this.trips.set(trip.trip_id, {
          routeId: trip.route_id,
          serviceId: trip.service_id,
          shapeId: trip.shape_id,
          direction: parseInt(trip.direction_id) || 0,
          headsign: trip.trip_headsign
        });
        
        // Build route-to-shape mapping
        if (trip.shape_id && this.shapes.has(trip.shape_id)) {
          const key = `${trip.route_id}_${trip.direction_id || 0}`;
          this.directionAwareRoutes.set(key, {
            routeId: trip.route_id,
            shapeId: trip.shape_id,
            direction: parseInt(trip.direction_id) || 0,
            headsign: trip.trip_headsign
          });
        }
      }
      console.log(`✅ Loaded ${this.trips.size} trips with direction mapping`);
    } catch (error) {
      console.error('❌ Failed to load trips.txt:', error);
    }
    
    this.initializationProgress = 80;
    
    // Load stop_times for stop sequences
    try {
      const stopTimesData = await fs.readFile(path.join(dataPath, 'stop_times.txt'), 'utf-8');
      const stopTimesRecords = parse(stopTimesData, { columns: true, skip_empty_lines: true, to: 50000 }); // Limit for memory
      
      // Group by trip and sort by sequence
      const tripStops = new Map();
      
      for (const stopTime of stopTimesRecords) {
        const tripId = stopTime.trip_id;
        const stopId = stopTime.stop_id;
        const sequence = parseInt(stopTime.stop_sequence);
        
        if (!tripStops.has(tripId)) {
          tripStops.set(tripId, []);
        }
        
        tripStops.get(tripId).push({
          stopId,
          sequence,
          arrivalTime: stopTime.arrival_time,
          departureTime: stopTime.departure_time
        });
      }
      
      // Build route stop sequences
      for (const [tripId, stops] of tripStops) {
        const trip = this.trips.get(tripId);
        if (trip) {
          const sortedStops = stops.sort((a, b) => a.sequence - b.sequence);
          const key = `${trip.routeId}_${trip.direction}`;
          
          if (!this.routeStopSequences.has(key)) {
            this.routeStopSequences.set(key, sortedStops.map(s => s.stopId));
          }
        }
      }
      
      console.log(`✅ Processed ${stopTimesRecords.length} stop times, built ${this.routeStopSequences.size} route sequences`);
    } catch (error) {
      console.warn('⚠️ stop_times.txt processing limited due to size');
    }
    
    this.initializationProgress = 100;
  }

  async buildSpatialIndices() {
    console.log('🗺️ Building enhanced spatial indices...');
    
    // Build route shape spatial index
    for (const [routeId, route] of this.routes) {
      const routeShapes = [];
      
      // Find all shapes for this route
      for (const [key, dirRoute] of this.directionAwareRoutes) {
        if (dirRoute.routeId === routeId) {
          const shape = this.shapes.get(dirRoute.shapeId);
          if (shape) {
            routeShapes.push({
              direction: dirRoute.direction,
              points: shape,
              headsign: dirRoute.headsign
            });
          }
        }
      }
      
      this.routeShapeIndex.set(routeId, routeShapes);
      
      // Add to spatial grid
      for (const shapeData of routeShapes) {
        for (const point of shapeData.points) {
          const gridCell = point.gridCell;
          if (!this.spatialGrid.has(gridCell)) {
            this.spatialGrid.set(gridCell, new Set());
          }
          this.spatialGrid.get(gridCell).add(routeId);
        }
      }
    }
    
    console.log(`✅ Built spatial grid with ${this.spatialGrid.size} cells covering ${this.routes.size} routes`);
  }

  async optimizeRouteShapes() {
    console.log('⚡ Optimizing route shapes for faster matching...');
    
    // Pre-calculate route segments for distance calculations
    for (const [routeId, shapes] of this.routeShapeIndex) {
      for (const shapeData of shapes) {
        const segments = [];
        const points = shapeData.points;
        
        for (let i = 0; i < points.length - 1; i++) {
          const start = points[i];
          const end = points[i + 1];
          
          segments.push({
            start,
            end,
            length: this.calculateDistance(start.lat, start.lng, end.lat, end.lng),
            bearing: this.calculateBearing(start.lat, start.lng, end.lat, end.lng)
          });
        }
        
        shapeData.segments = segments;
        shapeData.totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
      }
    }
    
    console.log('✅ Route shape optimization complete');
  }

  // Enhanced coordinate-to-route matching
  findRoutesNearCoordinate(lat, lng, radiusMeters = 250) {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)},${radiusMeters}`;
    
    // Check cache first
    if (this.coordinateCache.has(cacheKey)) {
      const cached = this.coordinateCache.get(cacheKey);
      console.log(`🎯 Cache hit for coordinate ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      return cached;
    }
    
    const results = [];
    const candidateRoutes = this.getSpatialCandidates(lat, lng, radiusMeters);
    
    for (const routeId of candidateRoutes) {
      const route = this.routes.get(routeId);
      const shapes = this.routeShapeIndex.get(routeId) || [];
      
      if (shapes.length === 0) {
        // Fallback to stop-based matching
        const stopDistance = this.findNearestStopsForRoute(routeId, lat, lng, radiusMeters);
        if (stopDistance.distance <= radiusMeters) {
          results.push({
            routeId,
            shortName: route.shortName,
            distance: stopDistance.distance,
            confidence: this.calculateConfidence(stopDistance.distance, radiusMeters, 'stop'),
            matchType: 'stop_proximity',
            direction: null
          });
        }
        continue;
      }
      
      // Enhanced shape-based matching
      for (const shapeData of shapes) {
        const match = this.matchCoordinateToShape(lat, lng, shapeData, radiusMeters);
        
        if (match.distance <= radiusMeters) {
          results.push({
            routeId,
            shortName: route.shortName,
            distance: match.distance,
            confidence: this.calculateConfidence(match.distance, radiusMeters, 'shape'),
            matchType: 'shape_geometry',
            direction: shapeData.direction,
            headsign: shapeData.headsign,
            segmentIndex: match.segmentIndex,
            positionOnSegment: match.positionOnSegment
          });
        }
      }
    }
    
    // Sort by confidence and distance
    results.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
      return a.distance - b.distance;
    });
    
    // Filter and deduplicate
    const filteredResults = this.deduplicateResults(results);
    const topResults = filteredResults.slice(0, 10); // Limit results
    
    // Cache the results
    this.coordinateCache.set(cacheKey, topResults);
    
    console.log(`🎯 Enhanced match: ${lat.toFixed(4)}, ${lng.toFixed(4)} → ${topResults.length} routes (${candidateRoutes.size} candidates checked)`);
    
    return topResults;
  }

  // Get spatial candidates using grid-based search
  getSpatialCandidates(lat, lng, radiusMeters) {
    const candidates = new Set();
    
    // Calculate grid cells to search
    const gridRadius = Math.ceil(radiusMeters / 111000 / this.gridSize); // Convert meters to grid cells
    const centerCell = this.getGridCell(lat, lng);
    const [centerRow, centerCol] = centerCell.split(',').map(Number);
    
    // Search surrounding grid cells
    for (let row = centerRow - gridRadius; row <= centerRow + gridRadius; row++) {
      for (let col = centerCol - gridRadius; col <= centerCol + gridRadius; col++) {
        const cellKey = `${row},${col}`;
        const cellRoutes = this.spatialGrid.get(cellKey);
        
        if (cellRoutes) {
          for (const routeId of cellRoutes) {
            candidates.add(routeId);
          }
        }
      }
    }
    
    return candidates;
  }

  // Match coordinate to route shape with high precision
  matchCoordinateToShape(lat, lng, shapeData, maxDistance) {
    let minDistance = Infinity;
    let bestMatch = {
      distance: Infinity,
      segmentIndex: -1,
      positionOnSegment: 0
    };
    
    const segments = shapeData.segments || [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const distance = this.pointToLineSegmentDistance(
        lat, lng,
        segment.start.lat, segment.start.lng,
        segment.end.lat, segment.end.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = {
          distance: distance * 1000, // Convert to meters
          segmentIndex: i,
          positionOnSegment: this.calculatePositionOnSegment(
            lat, lng, segment.start, segment.end
          )
        };
      }
      
      // Early exit if we found a very close match
      if (distance * 1000 < 50) break;
    }
    
    return bestMatch;
  }

  // Point to line segment distance calculation (Haversine-based)
  pointToLineSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line segment is actually a point
      return this.calculateDistance(px, py, x1, y1);
    }
    
    let param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    return this.calculateDistance(px, py, xx, yy);
  }

  // Calculate position along segment (0 = start, 1 = end)
  calculatePositionOnSegment(px, py, start, end) {
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const t = ((px - start.lng) * dx + (py - start.lat) * dy) / (dx * dx + dy * dy);
    return Math.max(0, Math.min(1, t));
  }

  // Find nearest stops for route (fallback method)
  findNearestStopsForRoute(routeId, lat, lng, maxDistance) {
    const stopSequence = this.routeStopSequences.get(`${routeId}_0`) || 
                        this.routeStopSequences.get(`${routeId}_1`) || [];
    
    let minDistance = Infinity;
    
    for (const stopId of stopSequence) {
      const stop = this.stops.get(stopId);
      if (stop) {
        const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng) * 1000;
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    
    return { distance: minDistance };
  }

  // Enhanced confidence calculation
  calculateConfidence(distance, maxRadius, matchType) {
    let baseConfidence;
    
    if (matchType === 'shape') {
      // Shape-based matching is more accurate
      baseConfidence = Math.max(0, 1 - (distance / maxRadius));
      baseConfidence = Math.pow(baseConfidence, 0.5); // Less aggressive falloff
    } else {
      // Stop-based matching
      baseConfidence = Math.max(0, 1 - (distance / maxRadius));
      baseConfidence = Math.pow(baseConfidence, 1.5); // More aggressive falloff
    }
    
    // Boost confidence for very close matches
    if (distance < 50) baseConfidence = Math.min(1.0, baseConfidence + 0.2);
    if (distance < 25) baseConfidence = Math.min(1.0, baseConfidence + 0.3);
    
    return Math.round(baseConfidence * 100) / 100;
  }

  // Deduplicate results (same route, different directions)
  deduplicateResults(results) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const result of results) {
      const key = result.routeId;
      const existing = seen.get(key);
      
      if (!existing || result.confidence > existing.confidence) {
        seen.set(key, result);
      }
    }
    
    return Array.from(seen.values());
  }

  // Get grid cell for spatial indexing
  getGridCell(lat, lng) {
    const row = Math.floor(lat / this.gridSize);
    const col = Math.floor(lng / this.gridSize);
    return `${row},${col}`;
  }

  // Utility functions
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Memory usage reporting
  reportMemoryUsage() {
    const usage = process.memoryUsage();
    const formatMB = (bytes) => Math.round(bytes / 1024 / 1024);
    
    console.log(`
📊 Enhanced GTFS Memory Usage:
   Routes: ${this.routes.size} (${formatMB(JSON.stringify(Array.from(this.routes.entries())).length)}MB)
   Stops: ${this.stops.size} (${formatMB(JSON.stringify(Array.from(this.stops.entries())).length)}MB)
   Shapes: ${this.shapes.size} (${formatMB(JSON.stringify(Array.from(this.shapes.entries())).length)}MB)
   Spatial Grid: ${this.spatialGrid.size} cells
   Cache Size: ${this.coordinateCache.size}/${this.coordinateCache.maxSize}
   
🧠 System Memory:
   RSS: ${formatMB(usage.rss)}MB
   Heap Used: ${formatMB(usage.heapUsed)}MB
   Heap Total: ${formatMB(usage.heapTotal)}MB
   External: ${formatMB(usage.external)}MB
`);
  }

  // Get enhanced matching statistics
  getMatchingStats() {
    return {
      isInitialized: this.isInitialized,
      totalRoutes: this.routes.size,
      totalStops: this.stops.size,
      totalShapes: this.shapes.size,
      spatialGridCells: this.spatialGrid.size,
      routeShapeIndex: this.routeShapeIndex.size,
      directionAwareRoutes: this.directionAwareRoutes.size,
      cacheHitRate: this.coordinateCache.getHitRate(),
      memoryUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      }
    };
  }
}

// LRU Cache implementation for memory management
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value;
    }
    this.misses++;
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) item
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  get size() {
    return this.cache.size;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? Math.round((this.hits / total) * 100) : 0;
  }
}

// Export singleton instance
const enhancedGTFSMatcher = new EnhancedGTFSMatcher();
export default enhancedGTFSMatcher;

// Main matching function for external use
export async function findRoutesNearCoordinatesEnhanced(lat, lng, radiusMeters = 250) {
  if (!enhancedGTFSMatcher.isInitialized) {
    await enhancedGTFSMatcher.initialize();
  }
  
  const matches = enhancedGTFSMatcher.findRoutesNearCoordinate(lat, lng, radiusMeters);
  return matches.map(match => match.shortName).filter(Boolean);
}

// Get detailed matching information
export async function getDetailedRouteMatches(lat, lng, radiusMeters = 250) {
  if (!enhancedGTFSMatcher.isInitialized) {
    await enhancedGTFSMatcher.initialize();
  }
  
  return enhancedGTFSMatcher.findRoutesNearCoordinate(lat, lng, radiusMeters);
}

// Get matcher statistics
export function getGTFSMatcherStats() {
  return enhancedGTFSMatcher.getMatchingStats();
}