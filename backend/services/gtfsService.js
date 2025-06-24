// backend/services/gtfsService.js
// Centralized GTFS service for route matching and data management
// Provides accurate route identification for alerts and roadworks

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GTFSService {
  constructor() {
    // Core GTFS data
    this.routes = new Map();
    this.stops = new Map();
    this.shapes = new Map();
    this.trips = new Map();
    this.stopTimes = new Map();
    
    // Derived data for efficient matching
    this.routesByName = new Map(); // short_name -> route data
    this.stopsByRoute = new Map(); // route_id -> Set of stop_ids
    this.routeShapes = new Map(); // route_id -> array of shape points
    this.spatialIndex = new Map(); // grid_key -> Set of route_ids
    
    // Route corridor mapping for major roads
    this.corridorRoutes = new Map();
    
    // Configuration
    this.gridSize = 0.002; // ~200m grid cells
    this.searchRadius = 300; // meters
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🚌 Initializing GTFS Service...');
      
      await this.loadGTFSData();
      await this.buildIndices();
      await this.buildCorridorMappings();
      
      this.initialized = true;
      console.log(`✅ GTFS Service ready: ${this.routes.size} routes, ${this.stops.size} stops`);
      
      return true;
    } catch (error) {
      console.error('❌ GTFS Service initialization failed:', error);
      return false;
    }
  }

  async loadGTFSData() {
    const dataPath = path.join(__dirname, '../data');
    
    // Load routes
    try {
      const routesData = await fs.readFile(path.join(dataPath, 'routes.txt'), 'utf-8');
      const routesRecords = parse(routesData, { columns: true, skip_empty_lines: true });
      
      for (const route of routesRecords) {
        const routeData = {
          id: route.route_id,
          shortName: route.route_short_name,
          longName: route.route_long_name || '',
          type: parseInt(route.route_type) || 3,
          color: route.route_color || 'FFFFFF',
          agency: route.agency_id
        };
        
        this.routes.set(route.route_id, routeData);
        
        // Index by short name for quick lookup
        if (route.route_short_name) {
          this.routesByName.set(route.route_short_name, routeData);
        }
      }
      console.log(`  ✅ Loaded ${this.routes.size} routes`);
    } catch (error) {
      console.error('  ❌ Failed to load routes:', error.message);
    }
    
    // Load stops
    try {
      const stopsData = await fs.readFile(path.join(dataPath, 'stops.txt'), 'utf-8');
      const stopsRecords = parse(stopsData, { columns: true, skip_empty_lines: true });
      
      for (const stop of stopsRecords) {
        const lat = parseFloat(stop.stop_lat);
        const lng = parseFloat(stop.stop_lon);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          this.stops.set(stop.stop_id, {
            id: stop.stop_id,
            name: stop.stop_name,
            lat: lat,
            lng: lng,
            code: stop.stop_code || ''
          });
        }
      }
      console.log(`  ✅ Loaded ${this.stops.size} stops`);
    } catch (error) {
      console.error('  ❌ Failed to load stops:', error.message);
    }
    
    // Load shapes for route geometry
    try {
      const shapesData = await fs.readFile(path.join(dataPath, 'shapes.txt'), 'utf-8');
      const shapesRecords = parse(shapesData, { columns: true, skip_empty_lines: true });
      
      for (const shape of shapesRecords) {
        const shapeId = shape.shape_id;
        const lat = parseFloat(shape.shape_pt_lat);
        const lng = parseFloat(shape.shape_pt_lon);
        const sequence = parseInt(shape.shape_pt_sequence);
        
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(sequence)) {
          if (!this.shapes.has(shapeId)) {
            this.shapes.set(shapeId, []);
          }
          
          this.shapes.get(shapeId).push({
            lat: lat,
            lng: lng,
            sequence: sequence
          });
        }
      }
      
      // Sort shape points by sequence
      for (const [shapeId, points] of this.shapes.entries()) {
        points.sort((a, b) => a.sequence - b.sequence);
      }
      
      console.log(`  ✅ Loaded ${this.shapes.size} route shapes`);
    } catch (error) {
      console.error('  ❌ Failed to load shapes:', error.message);
    }
    
    // Load trips to link routes and shapes
    try {
      const tripsData = await fs.readFile(path.join(dataPath, 'trips.txt'), 'utf-8');
      const tripsRecords = parse(tripsData, { columns: true, skip_empty_lines: true });
      
      for (const trip of tripsRecords) {
        this.trips.set(trip.trip_id, {
          id: trip.trip_id,
          routeId: trip.route_id,
          shapeId: trip.shape_id,
          headsign: trip.trip_headsign || ''
        });
        
        // Link routes to shapes
        if (trip.route_id && trip.shape_id && this.shapes.has(trip.shape_id)) {
          if (!this.routeShapes.has(trip.route_id)) {
            this.routeShapes.set(trip.route_id, new Set());
          }
          this.routeShapes.get(trip.route_id).add(trip.shape_id);
        }
      }
      console.log(`  ✅ Loaded ${this.trips.size} trips`);
    } catch (error) {
      console.error('  ❌ Failed to load trips:', error.message);
    }
    
    // Load stop times to build route-stop relationships
    try {
      const stopTimesData = await fs.readFile(path.join(dataPath, 'stop_times.txt'), 'utf-8');
      const stopTimesRecords = parse(stopTimesData, { 
        columns: true, 
        skip_empty_lines: true,
        relax_quotes: true 
      });
      
      const routeStopMap = new Map();
      
      for (const stopTime of stopTimesRecords) {
        const trip = this.trips.get(stopTime.trip_id);
        if (trip && trip.routeId) {
          if (!routeStopMap.has(trip.routeId)) {
            routeStopMap.set(trip.routeId, new Set());
          }
          routeStopMap.get(trip.routeId).add(stopTime.stop_id);
        }
      }
      
      // Convert to final structure
      for (const [routeId, stopSet] of routeStopMap.entries()) {
        this.stopsByRoute.set(routeId, stopSet);
      }
      
      console.log(`  ✅ Built route-stop relationships for ${this.stopsByRoute.size} routes`);
    } catch (error) {
      console.error('  ❌ Failed to load stop times:', error.message);
    }
  }

  async buildIndices() {
    console.log('📊 Building spatial indices...');
    
    // Build spatial index for route shapes
    for (const [routeId, shapeIds] of this.routeShapes.entries()) {
      for (const shapeId of shapeIds) {
        const shapePoints = this.shapes.get(shapeId);
        if (shapePoints) {
          for (const point of shapePoints) {
            const gridKey = this.getGridKey(point.lat, point.lng);
            if (!this.spatialIndex.has(gridKey)) {
              this.spatialIndex.set(gridKey, new Set());
            }
            this.spatialIndex.get(gridKey).add(routeId);
          }
        }
      }
    }
    
    // Also index stops
    for (const [stopId, stop] of this.stops.entries()) {
      const gridKey = this.getGridKey(stop.lat, stop.lng);
      
      // Find routes that use this stop
      for (const [routeId, stopSet] of this.stopsByRoute.entries()) {
        if (stopSet.has(stopId)) {
          if (!this.spatialIndex.has(gridKey)) {
            this.spatialIndex.set(gridKey, new Set());
          }
          this.spatialIndex.get(gridKey).add(routeId);
        }
      }
    }
    
    console.log(`  ✅ Built spatial index with ${this.spatialIndex.size} grid cells`);
  }

  async buildCorridorMappings() {
    // Map major corridors to routes based on GTFS data analysis
    this.corridorRoutes.set('A1', ['21', 'X21', '43', '44', '45']);
    this.corridorRoutes.set('A19', ['1', '35', '36', '307', '309']);
    this.corridorRoutes.set('A167', ['21', '22', 'X21', '50', '6']);
    this.corridorRoutes.set('A1058', ['1', '307', '309', '317']);
    this.corridorRoutes.set('A184', ['25', '28', '29']);
    this.corridorRoutes.set('A690', ['61', '62', '63']);
    this.corridorRoutes.set('A69', ['X85', '684']);
    this.corridorRoutes.set('A183', ['16', '20', '61', '62']);
    
    console.log(`  ✅ Built corridor mappings for ${this.corridorRoutes.size} major roads`);
  }

  // Get grid key for spatial indexing
  getGridKey(lat, lng) {
    const gridLat = Math.floor(lat / this.gridSize) * this.gridSize;
    const gridLng = Math.floor(lng / this.gridSize) * this.gridSize;
    return `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
  }

  // Get adjacent grid keys for search
  getAdjacentGridKeys(lat, lng, radius = 1) {
    const keys = [];
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        const gridLat = Math.floor(lat / this.gridSize) * this.gridSize + (i * this.gridSize);
        const gridLng = Math.floor(lng / this.gridSize) * this.gridSize + (j * this.gridSize);
        keys.push(`${gridLat.toFixed(4)},${gridLng.toFixed(4)}`);
      }
    }
    return keys;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  // Main method: Find routes affected by an incident/roadwork
  async findAffectedRoutes(lat, lng, radius = null) {
    if (!this.initialized) {
      console.warn('⚠️ GTFS Service not initialized');
      return [];
    }
    
    const searchRadius = radius || this.searchRadius;
    
    // Check for major interchanges/stations first
    const interchangeRoutes = this.getInterchangeRoutes(lat, lng);
    if (interchangeRoutes.length > 0) {
      console.log(`🚌 Major interchange detected: ${interchangeRoutes.length} routes`);
      return interchangeRoutes;
    }
    
    const affectedRoutes = new Map(); // route_shortName -> score
    
    // Use smaller grid search for better precision
    const gridKeys = this.getAdjacentGridKeys(lat, lng, 1); // Reduced from 2 to 1
    const candidateRoutes = new Set();
    
    for (const gridKey of gridKeys) {
      const routes = this.spatialIndex.get(gridKey);
      if (routes) {
        routes.forEach(routeId => candidateRoutes.add(routeId));
      }
    }
    
    // Check each candidate route with enhanced scoring
    for (const routeId of candidateRoutes) {
      const route = this.routes.get(routeId);
      if (!route || !route.shortName) continue;
      
      let minDistance = Infinity;
      let nearStopCount = 0;
      
      // Check distance to route shapes
      const shapeIds = this.routeShapes.get(routeId);
      if (shapeIds) {
        for (const shapeId of shapeIds) {
          const shapePoints = this.shapes.get(shapeId);
          if (shapePoints) {
            for (const point of shapePoints) {
              const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
              if (distance < minDistance) {
                minDistance = distance;
              }
              if (distance < searchRadius) {
                break; // Found within radius, no need to check more
              }
            }
          }
        }
      }
      
      // Check distance to stops (prioritize stop proximity)
      const stopIds = this.stopsByRoute.get(routeId);
      if (stopIds) {
        for (const stopId of stopIds) {
          const stop = this.stops.get(stopId);
          if (stop) {
            const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
            if (distance < minDistance) {
              minDistance = distance;
            }
            if (distance <= searchRadius * 0.5) { // Count nearby stops
              nearStopCount++;
            }
          }
        }
      }
      
      // Enhanced scoring: distance + stop proximity + route importance
      if (minDistance <= searchRadius) {
        let score = 1 - (minDistance / searchRadius);
        
        // Boost score for routes with multiple nearby stops
        score += nearStopCount * 0.1;
        
        // Boost score for major routes
        const routeImportance = this.getRouteImportance(route.shortName);
        score *= routeImportance;
        
        // Apply geographic filtering
        if (this.isWithinOperatingArea(lat, lng, route.shortName)) {
          affectedRoutes.set(route.shortName, score);
        }
      }
    }
    
    // Sort by score and return top routes only
    const sortedRoutes = Array.from(affectedRoutes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Limit to top 15 most relevant routes
      .map(([routeName]) => routeName);
    
    return sortedRoutes;
  }
  
  // Check for major interchanges/stations with known route patterns
  getInterchangeRoutes(lat, lng) {
    const interchanges = [
      {
        name: 'Newcastle Central Station',
        lat: 54.9689, lng: -1.6174,
        radius: 200,
        routes: ['Q3', 'Q3X', '10', '21', '22', '1', '12', '47', '53', '54']
      },
      {
        name: 'Gateshead Interchange', 
        lat: 54.9526, lng: -1.6031,
        radius: 150,
        routes: ['10', '21', '27', '28', 'Q3', '53', '54', '28B']
      },
      {
        name: 'Metro Centre',
        lat: 54.9561, lng: -1.6751,
        radius: 300,
        routes: ['10', '27', '28', '49', '49A', '6']
      },
      {
        name: 'Durham Bus Station',
        lat: 54.7762, lng: -1.5747,
        radius: 200,
        routes: ['21', '22', 'X21', '6', '50', '16', '20', '25']
      },
      {
        name: 'Sunderland Interchange',
        lat: 54.9053, lng: -1.3826,
        radius: 200,
        routes: ['16', '20', '61', '62', '35', '36', '56', '57']
      }
    ];
    
    for (const interchange of interchanges) {
      const distance = this.calculateDistance(lat, lng, interchange.lat, interchange.lng);
      if (distance <= interchange.radius) {
        return interchange.routes;
      }
    }
    
    return [];
  }
  
  // Get route importance multiplier
  getRouteImportance(routeShortName) {
    // Major frequent routes get higher importance
    const majorRoutes = {
      'Q3': 1.5, 'Q3X': 1.5,
      '10': 1.4, '10A': 1.3, '10B': 1.3,
      '21': 1.4, '22': 1.4, 'X21': 1.3,
      '1': 1.3, '27': 1.2, '28': 1.2,
      '12': 1.2, '47': 1.1, '56': 1.1, '57': 1.1
    };
    
    return majorRoutes[routeShortName] || 1.0;
  }
  
  // Check if coordinate is within expected operating area for route
  isWithinOperatingArea(lat, lng, routeShortName) {
    // Go North East operating area bounds
    const gneArea = {
      north: 55.2, south: 54.6,
      east: -1.0, west: -2.2
    };
    
    // Basic geographic filtering
    if (lat < gneArea.south || lat > gneArea.north || 
        lng < gneArea.west || lng > gneArea.east) {
      return false;
    }
    
    // Route-specific geographic filtering
    const routeAreas = {
      // Newcastle city center routes
      'Q3': { north: 55.1, south: 54.9, east: -1.4, west: -1.8 },
      'Q3X': { north: 55.1, south: 54.9, east: -1.4, west: -1.8 },
      'TOON': { north: 55.0, south: 54.95, east: -1.5, west: -1.7 },
      
      // Sunderland area routes  
      '16': { north: 55.0, south: 54.8, east: -1.2, west: -1.5 },
      '20': { north: 55.0, south: 54.8, east: -1.2, west: -1.5 },
      '61': { north: 55.0, south: 54.8, east: -1.2, west: -1.5 },
      '62': { north: 55.0, south: 54.8, east: -1.2, west: -1.5 }
    };
    
    const area = routeAreas[routeShortName];
    if (area) {
      return lat >= area.south && lat <= area.north && 
             lng >= area.west && lng <= area.east;
    }
    
    return true; // Allow if no specific area defined
  }

  // Find routes by text matching (location names, road names)
  findRoutesByText(text) {
    if (!this.initialized) {
      return [];
    }
    
    const routes = new Map(); // route -> score
    const lowerText = text.toLowerCase();
    
    // Check major location patterns first
    const locationPatterns = {
      'newcastle central': ['Q3', 'Q3X', '10', '21', '22', '1', '12'],
      'newcastle': ['Q3', 'Q3X', '10', '21', '22', '1', '12', '47', '53', '54'],
      'gateshead': ['10', '21', '27', '28', 'Q3', '53', '54', '28B', '29'],
      'durham': ['21', '22', 'X21', '6', '50', '16', '20'],
      'sunderland': ['16', '20', '61', '62', '35', '36', '56', '57'],
      'metro centre': ['10', '27', '28', '49', '49A', '6'],
      'angel of the north': ['21', '28', '93', '94'],
      'tyne bridge': ['Q3', 'Q3X', '1', '10', '21', '22', '27'],
      'shields': ['1', '307', '309', '317', '327'],
      'washington': ['4', '8', '50', '78', 'X1'],
      'stanley': ['6', '45', '47', 'X30', 'X31']
    };
    
    for (const [pattern, patternRoutes] of Object.entries(locationPatterns)) {
      if (lowerText.includes(pattern)) {
        patternRoutes.forEach(route => {
          const score = (routes.get(route) || 0) + 2.0; // High score for exact matches
          routes.set(route, score);
        });
      }
    }
    
    // Check corridor mappings with enhanced scoring
    for (const [corridor, corridorRoutes] of this.corridorRoutes.entries()) {
      if (lowerText.includes(corridor.toLowerCase())) {
        corridorRoutes.forEach(route => {
          const score = (routes.get(route) || 0) + 1.5;
          routes.set(route, score);
        });
      }
    }
    
    // Check stop names with fuzzy matching
    for (const [stopId, stop] of this.stops.entries()) {
      const stopNameLower = stop.name.toLowerCase();
      let matchScore = 0;
      
      // Exact substring match
      if (stopNameLower.includes(lowerText)) {
        matchScore = 1.0;
      }
      // Word boundary matches
      else if (this.hasWordBoundaryMatch(stopNameLower, lowerText)) {
        matchScore = 0.8;
      }
      // Partial word matches
      else if (this.hasPartialWordMatch(stopNameLower, lowerText)) {
        matchScore = 0.4;
      }
      
      if (matchScore > 0) {
        // Find routes that use this stop
        for (const [routeId, stopSet] of this.stopsByRoute.entries()) {
          if (stopSet.has(stopId)) {
            const route = this.routes.get(routeId);
            if (route && route.shortName) {
              const score = (routes.get(route.shortName) || 0) + matchScore;
              routes.set(route.shortName, score);
            }
          }
        }
      }
    }
    
    // Sort by score and return top routes
    const sortedRoutes = Array.from(routes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Limit results
      .map(([route]) => route);
    
    return sortedRoutes;
  }
  
  // Helper: Check for word boundary matches
  hasWordBoundaryMatch(text, searchTerm) {
    const words = searchTerm.split(/\s+/);
    return words.some(word => {
      if (word.length < 3) return false;
      const regex = new RegExp(`\\b${word}`, 'i');
      return regex.test(text);
    });
  }
  
  // Helper: Check for partial word matches
  hasPartialWordMatch(text, searchTerm) {
    const words = searchTerm.split(/\s+/);
    return words.some(word => {
      if (word.length < 4) return false;
      return text.includes(word.slice(0, -1)); // Match partial word
    });
  }

  // Get route details
  getRouteDetails(routeShortName) {
    const route = this.routesByName.get(routeShortName);
    if (!route) return null;
    
    const stops = [];
    const stopIds = this.stopsByRoute.get(route.id);
    if (stopIds) {
      for (const stopId of stopIds) {
        const stop = this.stops.get(stopId);
        if (stop) {
          stops.push(stop);
        }
      }
    }
    
    return {
      ...route,
      stopCount: stops.length,
      stops: stops.slice(0, 10) // Return first 10 stops as sample
    };
  }

  // Get statistics
  getStats() {
    return {
      routes: this.routes.size,
      stops: this.stops.size,
      shapes: this.shapes.size,
      trips: this.trips.size,
      spatialIndexCells: this.spatialIndex.size,
      corridors: this.corridorRoutes.size,
      initialized: this.initialized
    };
  }
}

// Create singleton instance
const gtfsService = new GTFSService();

// Initialize on module load
gtfsService.initialize().catch(error => {
  console.error('Failed to initialize GTFS Service:', error);
});

export default gtfsService;