// Enhanced GTFS Route Matching System for Go BARRY
// Improved accuracy using coordinate-based matching with GTFS data

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced route matching with GTFS coordinate data
class EnhancedGTFSMatcher {
  constructor() {
    this.routes = new Map();
    this.stops = new Map();
    this.shapes = new Map();
    this.tripToShape = new Map();
    this.routeToShapes = new Map();
    this.stopToRoutes = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🚌 Initializing Enhanced GTFS Route Matcher...');
      
      // Load routes
      await this.loadRoutes();
      
      // Load stops with coordinates
      await this.loadStops();
      
      // Load trips (route to shape mapping)
      await this.loadTrips();
      
      // Load shapes (route geometry) - sample only for memory efficiency
      await this.loadShapesSample();
      
      // Build stop-to-route relationships
      await this.buildStopRouteRelationships();
      
      this.initialized = true;
      console.log('✅ Enhanced GTFS Route Matcher ready');
      console.log(`📊 Coverage: ${this.routes.size} routes, ${this.stops.size} stops`);
      
      return true;
    } catch (error) {
      console.error('❌ Enhanced GTFS initialization failed:', error.message);
      return false;
    }
  }

  async loadRoutes() {
    const routesPath = path.join(__dirname, 'data', 'routes.txt');
    const content = await fs.readFile(routesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const routeShortNameIndex = headers.indexOf('route_short_name');
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shortName = values[routeShortNameIndex];
        
        if (routeId && shortName) {
          this.routes.set(routeId, {
            id: routeId,
            shortName: shortName,
            shapes: new Set(),
            stops: new Set()
          });
        }
      }
    }
    
    console.log(`✅ Loaded ${this.routes.size} routes`);
  }

  async loadStops() {
    const stopsPath = path.join(__dirname, 'data', 'stops.txt');
    const content = await fs.readFile(stopsPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const stopIdIndex = headers.indexOf('stop_id');
    const stopNameIndex = headers.indexOf('stop_name');
    const stopLatIndex = headers.indexOf('stop_lat');
    const stopLonIndex = headers.indexOf('stop_lon');
    
    let validStops = 0;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const stopId = values[stopIdIndex]?.trim().replace(/"/g, '');
        const stopName = values[stopNameIndex]?.trim().replace(/"/g, '');
        const lat = parseFloat(values[stopLatIndex]?.trim());
        const lon = parseFloat(values[stopLonIndex]?.trim());
        
        // Only include stops within North East England bounds
        if (stopId && !isNaN(lat) && !isNaN(lon) && this.isInNorthEast(lat, lon)) {
          this.stops.set(stopId, {
            id: stopId,
            name: stopName,
            lat: lat,
            lon: lon,
            routes: new Set()
          });
          validStops++;
        }
      }
    }
    
    console.log(`✅ Loaded ${validStops} North East bus stops`);
  }

  async loadTrips() {
    const tripsPath = path.join(__dirname, 'data', 'trips.txt');
    const content = await fs.readFile(tripsPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const routeIdIndex = headers.indexOf('route_id');
    const shapeIdIndex = headers.indexOf('shape_id');
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const routeId = values[routeIdIndex];
        const shapeId = values[shapeIdIndex];
        
        if (routeId && shapeId && this.routes.has(routeId)) {
          // Map shape to route
          this.tripToShape.set(shapeId, routeId);
          
          // Add shape to route
          const route = this.routes.get(routeId);
          route.shapes.add(shapeId);
          
          // Build route to shapes mapping
          if (!this.routeToShapes.has(routeId)) {
            this.routeToShapes.set(routeId, new Set());
          }
          this.routeToShapes.get(routeId).add(shapeId);
        }
      }
    }
    
    console.log(`✅ Loaded ${this.tripToShape.size} shape-to-route mappings`);
  }

  async loadShapesSample() {
    const shapesPath = path.join(__dirname, 'data', 'shapes.txt');
    const content = await fs.readFile(shapesPath, 'utf8');
    const lines = content.split('\n');
    
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const shapeIdIndex = headers.indexOf('shape_id');
    const latIndex = headers.indexOf('shape_pt_lat');
    const lonIndex = headers.indexOf('shape_pt_lon');
    const sequenceIndex = headers.indexOf('shape_pt_sequence');
    
    let processedShapes = 0;
    let currentShapeId = null;
    let currentPoints = [];
    
    // Process shapes in chunks to avoid memory issues
    const maxShapes = 1000; // Limit for memory efficiency
    
    for (let i = 1; i < lines.length && processedShapes < maxShapes; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const shapeId = values[shapeIdIndex]?.trim().replace(/"/g, '');
        const lat = parseFloat(values[latIndex]?.trim());
        const lon = parseFloat(values[lonIndex]?.trim());
        const sequence = parseInt(values[sequenceIndex]?.trim());
        
        if (shapeId && !isNaN(lat) && !isNaN(lon) && !isNaN(sequence)) {
          // If we're starting a new shape, save the previous one
          if (currentShapeId && currentShapeId !== shapeId) {
            if (currentPoints.length > 0 && this.tripToShape.has(currentShapeId)) {
              this.shapes.set(currentShapeId, {
                id: currentShapeId,
                points: currentPoints,
                routeId: this.tripToShape.get(currentShapeId)
              });
              processedShapes++;
            }
            currentPoints = [];
          }
          
          currentShapeId = shapeId;
          currentPoints.push({ lat, lon, sequence });
        }
      }
    }
    
    // Save the last shape
    if (currentShapeId && currentPoints.length > 0 && this.tripToShape.has(currentShapeId)) {
      this.shapes.set(currentShapeId, {
        id: currentShapeId,
        points: currentPoints,
        routeId: this.tripToShape.get(currentShapeId)
      });
      processedShapes++;
    }
    
    console.log(`✅ Loaded ${processedShapes} route shapes`);
  }

  async buildStopRouteRelationships() {
    // This would typically use stop_times.txt to map stops to routes
    // For now, we'll use proximity-based matching as a fallback
    console.log('📍 Building stop-route relationships...');
    
    let relationshipCount = 0;
    
    // For each stop, find nearby shapes and associate with routes
    for (const [stopId, stop] of this.stops) {
      const nearbyRoutes = this.findRoutesNearStop(stop.lat, stop.lon, 200); // 200m radius
      
      for (const routeShortName of nearbyRoutes) {
        stop.routes.add(routeShortName);
        
        // Add stop to route
        for (const [routeId, route] of this.routes) {
          if (route.shortName === routeShortName) {
            route.stops.add(stopId);
            relationshipCount++;
            break;
          }
        }
      }
    }
    
    console.log(`✅ Built ${relationshipCount} stop-route relationships`);
  }

  findRoutesNearStop(lat, lon, radiusMeters = 200) {
    const nearbyRoutes = new Set();
    
    // Check against route shapes
    for (const [shapeId, shape] of this.shapes) {
      for (const point of shape.points) {
        const distance = this.calculateDistance(lat, lon, point.lat, point.lon);
        if (distance <= radiusMeters) {
          const route = this.routes.get(shape.routeId);
          if (route) {
            nearbyRoutes.add(route.shortName);
          }
          break; // Found this route, no need to check more points
        }
      }
    }
    
    return Array.from(nearbyRoutes);
  }

  // Main method: Find routes near incident coordinates
  findRoutesNearCoordinates(lat, lon, radiusMeters = 250) {
    if (!this.initialized) {
      console.warn('⚠️ Enhanced GTFS matcher not initialized');
      return [];
    }

    const foundRoutes = new Set();
    let matchMethod = 'none';

    // Method 1: Check against route shapes (most accurate)
    for (const [shapeId, shape] of this.shapes) {
      for (const point of shape.points) {
        const distance = this.calculateDistance(lat, lon, point.lat, point.lon);
        if (distance <= radiusMeters) {
          const route = this.routes.get(shape.routeId);
          if (route) {
            foundRoutes.add(route.shortName);
            matchMethod = 'shape_geometry';
          }
        }
      }
    }

    // Method 2: Check against nearby stops if no shape matches
    if (foundRoutes.size === 0) {
      for (const [stopId, stop] of this.stops) {
        const distance = this.calculateDistance(lat, lon, stop.lat, stop.lon);
        if (distance <= radiusMeters) {
          for (const routeShortName of stop.routes) {
            foundRoutes.add(routeShortName);
            matchMethod = 'stop_proximity';
          }
        }
      }
    }

    // Method 3: Geographic region-based fallback
    if (foundRoutes.size === 0) {
      const regionRoutes = this.getRoutesByRegion(lat, lon);
      regionRoutes.forEach(route => foundRoutes.add(route));
      if (regionRoutes.length > 0) {
        matchMethod = 'geographic_region';
      }
    }

    const routes = Array.from(foundRoutes).sort();
    
    if (routes.length > 0) {
      console.log(`🎯 Enhanced GTFS: Found ${routes.length} routes near ${lat.toFixed(4)}, ${lon.toFixed(4)} using ${matchMethod}`);
      console.log(`   Routes: ${routes.slice(0, 10).join(', ')}${routes.length > 10 ? '...' : ''}`);
    }

    return routes;
  }

  // Enhanced location processing
  enhanceLocationWithRoutes(lat, lon, originalLocation) {
    if (!this.initialized) {
      return originalLocation;
    }

    const nearbyRoutes = this.findRoutesNearCoordinates(lat, lon, 300);
    const nearbyStops = this.findNearbyStops(lat, lon, 150);

    let enhancedLocation = originalLocation;

    // Add nearby stop information
    if (nearbyStops.length > 0) {
      const closestStop = nearbyStops[0];
      enhancedLocation = `${enhancedLocation} (near ${closestStop.name})`;
    }

    // Add route information
    if (nearbyRoutes.length > 0) {
      const routeList = nearbyRoutes.slice(0, 5).join(', ');
      enhancedLocation = `${enhancedLocation} - Routes: ${routeList}`;
    }

    return enhancedLocation;
  }

  findNearbyStops(lat, lon, radiusMeters = 150) {
    const nearbyStops = [];

    for (const [stopId, stop] of this.stops) {
      const distance = this.calculateDistance(lat, lon, stop.lat, stop.lon);
      if (distance <= radiusMeters) {
        nearbyStops.push({
          ...stop,
          distance: distance
        });
      }
    }

    // Sort by distance
    return nearbyStops.sort((a, b) => a.distance - b.distance);
  }

  getRoutesByRegion(lat, lon) {
    // Comprehensive regional route mapping for Go North East
    const regions = [
      {
        name: 'Newcastle City Centre',
        bounds: { north: 55.0, south: 54.96, east: -1.58, west: -1.64 },
        routes: ['Q3', 'Q3X', '10', '10A', '10B', '12', '21', '22', '27', '28', '28B', '29', '47', '53', '54', '56', '57', '58']
      },
      {
        name: 'Gateshead/Metrocentre',
        bounds: { north: 54.97, south: 54.93, east: -1.6, west: -1.7 },
        routes: ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X', '53', '54']
      },
      {
        name: 'North Tyneside Coast',
        bounds: { north: 55.05, south: 55.0, east: -1.4, west: -1.5 },
        routes: ['1', '2', '307', '309', '317', '327', '352', '354', '355', '356']
      },
      {
        name: 'Sunderland',
        bounds: { north: 54.93, south: 54.88, east: -1.35, west: -1.42 },
        routes: ['16', '20', '24', '35', '36', '56', '61', '62', '63', '700', '701', '9']
      },
      {
        name: 'Washington',
        bounds: { north: 54.92, south: 54.89, east: -1.51, west: -1.56 },
        routes: ['2A', '2B', '4', '85', '86', 'X1']
      },
      {
        name: 'Durham/Chester-le-Street',
        bounds: { north: 54.88, south: 54.75, east: -1.5, west: -1.6 },
        routes: ['21', '22', 'X21', '6', '50', '28', 'X12']
      },
      {
        name: 'A1 Corridor',
        bounds: { north: 55.0, south: 54.85, east: -1.55, west: -1.65 },
        routes: ['21', 'X21', '25', '28', '28B', 'X25']
      },
      {
        name: 'A19 Corridor',
        bounds: { north: 55.1, south: 54.9, east: -1.35, west: -1.55 },
        routes: ['1', '2', '9', '307', '309', '56']
      },
      {
        name: 'Consett/West Durham',
        bounds: { north: 54.87, south: 54.82, east: -1.8, west: -1.9 },
        routes: ['X30', 'X31', 'X70', 'X71', 'X71A', '74', '84', '85']
      },
      {
        name: 'Hexham/West Northumberland',
        bounds: { north: 55.0, south: 54.95, east: -2.0, west: -2.15 },
        routes: ['X85', '684', 'AD122']
      }
    ];

    for (const region of regions) {
      if (lat >= region.bounds.south && lat <= region.bounds.north &&
          lon >= region.bounds.west && lon <= region.bounds.east) {
        return region.routes;
      }
    }

    return [];
  }

  isInNorthEast(lat, lon) {
    // North East England bounding box
    return lat >= 54.3 && lat <= 55.5 && lon >= -2.3 && lon <= -0.5;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  getStats() {
    return {
      initialized: this.initialized,
      routes: this.routes.size,
      stops: this.stops.size,
      shapes: this.shapes.size,
      tripMappings: this.tripToShape.size
    };
  }
}

// Singleton instance
const enhancedMatcher = new EnhancedGTFSMatcher();

// Initialize on module load
let initPromise = null;

async function initializeEnhancedGTFS() {
  if (!initPromise) {
    initPromise = enhancedMatcher.initialize();
  }
  return initPromise;
}

function getEnhancedGTFSStats() {
  return enhancedMatcher.getStats();
}

function enhancedFindRoutesNearCoordinates(lat, lon, radiusMeters = 250) {
  return enhancedMatcher.findRoutesNearCoordinates(lat, lon, radiusMeters);
}

function enhancedLocationWithRoutes(lat, lon, originalLocation) {
  return enhancedMatcher.enhanceLocationWithRoutes(lat, lon, originalLocation);
}

export {
  initializeEnhancedGTFS,
  getEnhancedGTFSStats,
  enhancedFindRoutesNearCoordinates,
  enhancedLocationWithRoutes,
  enhancedMatcher
};

export default {
  initializeEnhancedGTFS,
  getEnhancedGTFSStats,
  enhancedFindRoutesNearCoordinates,
  enhancedLocationWithRoutes
};
