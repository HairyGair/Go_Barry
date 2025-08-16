/*
 * Go Barry - GTFS Route Shapes Service
 * Processes GTFS shapes.txt for accurate route visualization on Live Map
 * Phase 3: Route geometry integration
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GTFSRouteShapesService {
  constructor() {
    this.isInitialized = false;
    this.routeShapes = new Map(); // route_short_name -> shape coordinates
    this.shapeData = new Map(); // shape_id -> coordinates array
    this.routeToShapeMap = new Map(); // route_id -> shape_ids
    this.routeColors = new Map(); // route_short_name -> color
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.lastLoaded = null;
  }

  /**
   * Initialize the service by loading GTFS data
   */
  async initialize() {
    if (this.isInitialized && this.lastLoaded && (Date.now() - this.lastLoaded) < this.cacheTimeout) {
      console.log('[GTFSShapes] Using cached route shapes data');
      return { success: true, cached: true };
    }

    console.log('[GTFSShapes] Loading GTFS route shapes data...');
    
    try {
      const startTime = Date.now();
      
      // Load route data first
      await this.loadRoutes();
      console.log(`✅ Loaded ${this.routeColors.size} routes`);
      
      // Load trip to shape mappings
      await this.loadTrips();
      console.log(`✅ Loaded ${this.routeToShapeMap.size} route-to-shape mappings`);
      
      // Load shape coordinates
      await this.loadShapes();
      console.log(`✅ Loaded ${this.shapeData.size} shape geometries`);
      
      // Build final route shapes
      this.buildRouteShapes();
      console.log(`✅ Built ${this.routeShapes.size} route shapes`);
      
      this.isInitialized = true;
      this.lastLoaded = Date.now();
      
      const loadTime = Date.now() - startTime;
      console.log(`🎯 GTFS route shapes loaded successfully in ${loadTime}ms`);
      
      return { 
        success: true, 
        routeCount: this.routeShapes.size,
        shapeCount: this.shapeData.size,
        loadTime 
      };
    } catch (error) {
      console.error('❌ Failed to load GTFS route shapes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load routes.txt to get route definitions and colors
   */
  async loadRoutes() {
    const routesPath = path.join(__dirname, '../data/routes.txt');
    const routesData = await fs.readFile(routesPath, 'utf-8');
    
    const routes = parse(routesData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    for (const route of routes) {
      const routeName = route.route_short_name;
      if (routeName) {
        // Store route colors (use GTFS color or generate based on route type)
        const color = route.route_color && route.route_color !== 'FFFFFF' 
          ? `#${route.route_color}` 
          : this.getDefaultRouteColor(routeName);
        
        this.routeColors.set(routeName, {
          color,
          textColor: route.route_text_color ? `#${route.route_text_color}` : '#000000',
          routeId: route.route_id,
          longName: route.route_long_name
        });
      }
    }
  }

  /**
   * Load trips.txt to map routes to shapes
   */
  async loadTrips() {
    const tripsPath = path.join(__dirname, '../data/trips.txt');
    const tripsData = await fs.readFile(tripsPath, 'utf-8');
    
    const trips = parse(tripsData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    for (const trip of trips) {
      if (trip.route_id && trip.shape_id) {
        if (!this.routeToShapeMap.has(trip.route_id)) {
          this.routeToShapeMap.set(trip.route_id, new Set());
        }
        this.routeToShapeMap.get(trip.route_id).add(trip.shape_id);
      }
    }
  }

  /**
   * Load shapes.txt with memory-efficient streaming
   */
  async loadShapes() {
    const shapesPath = path.join(__dirname, '../data/shapes.txt');
    const shapesData = await fs.readFile(shapesPath, 'utf-8');
    
    console.log('[GTFSShapes] Processing shape coordinates...');
    
    // Parse shapes data efficiently
    const shapes = parse(shapesData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Group shape points by shape_id
    const shapePoints = new Map();
    
    for (const point of shapes) {
      const shapeId = point.shape_id;
      const lat = parseFloat(point.shape_pt_lat);
      const lng = parseFloat(point.shape_pt_lon);
      const sequence = parseInt(point.shape_pt_sequence);
      
      if (isNaN(lat) || isNaN(lng) || isNaN(sequence)) {
        continue; // Skip invalid coordinates
      }
      
      if (!shapePoints.has(shapeId)) {
        shapePoints.set(shapeId, []);
      }
      
      shapePoints.get(shapeId).push({
        lat,
        lng,
        sequence
      });
    }
    
    // Sort points by sequence and convert to coordinate arrays
    for (const [shapeId, points] of shapePoints) {
      // Sort by sequence to ensure correct order
      points.sort((a, b) => a.sequence - b.sequence);
      
      // Convert to [lat, lng] coordinate pairs
      const coordinates = points.map(p => [p.lat, p.lng]);
      
      // Only store shapes with multiple points
      if (coordinates.length > 1) {
        this.shapeData.set(shapeId, coordinates);
      }
    }
    
    console.log(`[GTFSShapes] Processed ${this.shapeData.size} shape geometries from ${shapes.length} points`);
  }

  /**
   * Build final route shapes by combining route and shape data
   */
  buildRouteShapes() {
    for (const [routeName, routeInfo] of this.routeColors) {
      const routeId = routeInfo.routeId;
      const shapeIds = this.routeToShapeMap.get(routeId);
      
      if (shapeIds && shapeIds.size > 0) {
        // Use the first shape for now (routes may have multiple shapes for different directions)
        const primaryShapeId = Array.from(shapeIds)[0];
        const coordinates = this.shapeData.get(primaryShapeId);
        
        if (coordinates && coordinates.length > 1) {
          this.routeShapes.set(routeName, {
            routeName,
            routeId,
            shapeId: primaryShapeId,
            coordinates,
            color: routeInfo.color,
            textColor: routeInfo.textColor,
            longName: routeInfo.longName,
            type: this.getRouteType(routeName)
          });
        }
      }
    }
  }

  /**
   * Get default color for route based on Go North East branding
   */
  getDefaultRouteColor(routeName) {
    const route = String(routeName).toLowerCase();
    
    // Go North East route color scheme
    if (route.startsWith('x')) {
      return '#e11d48'; // Red for express routes
    } else if (route.startsWith('q')) {
      return '#7c3aed'; // Purple for Quayside routes
    } else if (['21', '22'].includes(route)) {
      return '#dc2626'; // Dark red for Angel routes (21/22)
    } else if (['1', '2', '3', '4', '5'].includes(route)) {
      return '#059669'; // Green for main city routes
    } else if (route.startsWith('30') || route.startsWith('31') || route.startsWith('32')) {
      return '#2563eb'; // Blue for 300 series
    } else if (route.includes('n') || route.includes('night')) {
      return '#6b46c1'; // Purple for night services
    } else {
      return '#06b6d4'; // Default cyan
    }
  }

  /**
   * Get route type for categorization
   */
  getRouteType(routeName) {
    const route = String(routeName).toLowerCase();
    
    if (route.startsWith('x')) {
      return 'express';
    } else if (route.startsWith('q')) {
      return 'quayside';
    } else if (['21', '22'].includes(route)) {
      return 'angel';
    } else if (route.includes('n') || route.includes('night')) {
      return 'night';
    } else {
      return 'standard';
    }
  }

  /**
   * Get route shape by route name
   */
  getRouteShape(routeName) {
    if (!this.isInitialized) {
      throw new Error('GTFS service not initialized');
    }
    
    return this.routeShapes.get(routeName) || null;
  }

  /**
   * Get all route shapes
   */
  getAllRouteShapes() {
    if (!this.isInitialized) {
      throw new Error('GTFS service not initialized');
    }
    
    return Array.from(this.routeShapes.values());
  }

  /**
   * Get route shapes for specific route list
   */
  getRouteShapes(routeNames) {
    if (!this.isInitialized) {
      throw new Error('GTFS service not initialized');
    }
    
    if (!Array.isArray(routeNames)) {
      return [];
    }
    
    return routeNames
      .map(routeName => this.getRouteShape(routeName))
      .filter(shape => shape !== null);
  }

  /**
   * Get routes within bounding box (for viewport filtering)
   */
  getRoutesInBounds(bounds) {
    if (!this.isInitialized) {
      throw new Error('GTFS service not initialized');
    }
    
    const { north, south, east, west } = bounds;
    const routesInBounds = [];
    
    for (const route of this.routeShapes.values()) {
      // Check if any coordinate is within bounds
      const isInBounds = route.coordinates.some(([lat, lng]) => {
        return lat >= south && lat <= north && lng >= west && lng <= east;
      });
      
      if (isInBounds) {
        routesInBounds.push(route);
      }
    }
    
    return routesInBounds;
  }

  /**
   * Find routes near coordinates
   */
  findRoutesNearCoordinates(lat, lng, radiusMeters = 250) {
    if (!this.isInitialized) {
      throw new Error('GTFS service not initialized');
    }
    
    const nearbyRoutes = [];
    
    for (const route of this.routeShapes.values()) {
      // Check if any point on the route is within radius
      const isNearby = route.coordinates.some(([routeLat, routeLng]) => {
        const distance = this.calculateDistance(lat, lng, routeLat, routeLng);
        return distance <= radiusMeters;
      });
      
      if (isNearby) {
        nearbyRoutes.push({
          routeName: route.routeName,
          distance: this.getMinDistanceToRoute(lat, lng, route.coordinates)
        });
      }
    }
    
    // Sort by distance
    return nearbyRoutes
      .sort((a, b) => a.distance - b.distance)
      .map(r => r.routeName);
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get minimum distance from point to route
   */
  getMinDistanceToRoute(lat, lng, routeCoordinates) {
    let minDistance = Infinity;
    
    for (const [routeLat, routeLng] of routeCoordinates) {
      const distance = this.calculateDistance(lat, lng, routeLat, routeLng);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    return minDistance;
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      isInitialized: this.isInitialized,
      routeCount: this.routeShapes.size,
      shapeCount: this.shapeData.size,
      routeTypes: {
        express: Array.from(this.routeShapes.values()).filter(r => r.type === 'express').length,
        quayside: Array.from(this.routeShapes.values()).filter(r => r.type === 'quayside').length,
        angel: Array.from(this.routeShapes.values()).filter(r => r.type === 'angel').length,
        standard: Array.from(this.routeShapes.values()).filter(r => r.type === 'standard').length,
        night: Array.from(this.routeShapes.values()).filter(r => r.type === 'night').length,
      },
      lastLoaded: this.lastLoaded,
      cacheAge: this.lastLoaded ? Date.now() - this.lastLoaded : null
    };
  }

  /**
   * Clear cache and force reload
   */
  clearCache() {
    console.log('[GTFSShapes] Clearing cache');
    this.isInitialized = false;
    this.routeShapes.clear();
    this.shapeData.clear();
    this.routeToShapeMap.clear();
    this.routeColors.clear();
    this.lastLoaded = null;
  }
}

// Export singleton instance
export const gtfsRouteShapesService = new GTFSRouteShapesService();

export default gtfsRouteShapesService;
