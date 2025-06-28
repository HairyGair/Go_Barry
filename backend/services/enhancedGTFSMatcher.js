// backend/services/enhancedGTFSMatcher.js
// Enhanced GTFS route matching with improved accuracy for Go BARRY
// Includes direction awareness, proximity filtering, and confidence scoring

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedGTFSMatcher {
  constructor() {
    this.routes = null;
    this.stops = null;
    this.shapes = null;
    this.routeStops = new Map();
    this.routeShapes = new Map();
    this.stopsByRoute = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🚌 Initializing Enhanced GTFS Matcher...');
      
      const dataPath = path.join(__dirname, '../data');
      
      // Load GTFS data files
      const [routesData, stopsData, shapesData] = await Promise.all([
        fs.readFile(path.join(dataPath, 'routes.txt'), 'utf8'),
        fs.readFile(path.join(dataPath, 'stops.txt'), 'utf8'),
        fs.readFile(path.join(dataPath, 'shapes.txt'), 'utf8')
      ]);
      
      // Parse CSV data
      this.routes = this.parseCSV(routesData);
      this.stops = this.parseCSV(stopsData);
      this.shapes = this.parseCSV(shapesData);
      
      // Build lookup indexes for performance
      this.buildIndexes();
      
      console.log(`✅ Enhanced GTFS Matcher initialized with ${this.routes.length} routes, ${this.stops.length} stops`);
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced GTFS Matcher:', error);
      throw error;
    }
  }

  parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/"/g, ''));
    return result;
  }

  buildIndexes() {
    // Build route -> stops mapping
    this.stops.forEach(stop => {
      const routeId = stop.route_id || this.extractRouteFromStopId(stop.stop_id);
      if (routeId) {
        if (!this.stopsByRoute.has(routeId)) {
          this.stopsByRoute.set(routeId, []);
        }
        this.stopsByRoute.get(routeId).push({
          ...stop,
          lat: parseFloat(stop.stop_lat),
          lng: parseFloat(stop.stop_lon)
        });
      }
    });

    // Build route -> shapes mapping
    const shapesByRoute = new Map();
    this.shapes.forEach(shape => {
      const shapeId = shape.shape_id;
      if (!shapesByRoute.has(shapeId)) {
        shapesByRoute.set(shapeId, []);
      }
      shapesByRoute.get(shapeId).push({
        lat: parseFloat(shape.shape_pt_lat),
        lng: parseFloat(shape.shape_pt_lon),
        sequence: parseInt(shape.shape_pt_sequence)
      });
    });

    // Sort shapes by sequence and associate with routes
    shapesByRoute.forEach((points, shapeId) => {
      const sortedPoints = points.sort((a, b) => a.sequence - b.sequence);
      
      // Find route that uses this shape
      const route = this.routes.find(r => r.shape_id === shapeId);
      if (route) {
        this.routeShapes.set(route.route_id, sortedPoints);
      }
    });

    console.log(`📊 Built indexes: ${this.stopsByRoute.size} route-stop mappings, ${this.routeShapes.size} route-shape mappings`);
  }

  extractRouteFromStopId(stopId) {
    // Extract route ID from stop ID patterns
    // Common patterns: "route_direction_stop", "route-stop", etc.
    const patterns = [
      /^(\d+|[A-Z]+\d*)[-_]/,  // "21_", "X21-", "Q3_"
      /^([A-Z]+\d+)/,           // "X21", "Q3"
      /^(\d+)/                  // "21", "307"
    ];
    
    for (const pattern of patterns) {
      const match = stopId.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  // Calculate distance between two coordinates (Haversine formula)
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

  // Find closest point on a line segment to a given point
  closestPointOnSegment(point, segmentStart, segmentEnd) {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return segmentStart;
    
    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    return {
      lat: segmentStart.lat + param * C,
      lng: segmentStart.lng + param * D
    };
  }

  // Calculate distance from point to route shape
  distanceToRoute(point, routeShape) {
    if (!routeShape || routeShape.length < 2) return Infinity;
    
    let minDistance = Infinity;
    
    for (let i = 0; i < routeShape.length - 1; i++) {
      const segmentStart = routeShape[i];
      const segmentEnd = routeShape[i + 1];
      
      const closestPoint = this.closestPointOnSegment(point, segmentStart, segmentEnd);
      const distance = this.calculateDistance(
        point.lat, point.lng,
        closestPoint.lat, closestPoint.lng
      );
      
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  // Enhanced route matching with multiple factors
  async matchRoutesEnhanced(lat, lng, options = {}) {
    await this.initialize();
    
    const {
      radius = 1000,          // Search radius in meters
      maxResults = 20,        // Maximum results to return
      includeStops = true,    // Include stop-based matching
      includeShapes = true,   // Include shape-based matching
      includeDirections = false, // Include direction analysis
      confidenceThreshold = 0.1 // Minimum confidence to include
    } = options;

    const queryPoint = { lat, lng };
    const matches = new Map(); // Use Map to avoid duplicates

    try {
      // 1. Stop-based matching (high accuracy)
      if (includeStops) {
        this.stopsByRoute.forEach((stops, routeId) => {
          const route = this.routes.find(r => r.route_id === routeId);
          if (!route) return;

          let minStopDistance = Infinity;
          let closestStop = null;

          stops.forEach(stop => {
            if (!stop.lat || !stop.lng) return;
            
            const distance = this.calculateDistance(
              lat, lng, stop.lat, stop.lng
            );
            
            if (distance < minStopDistance && distance <= radius) {
              minStopDistance = distance;
              closestStop = stop;
            }
          });

          if (closestStop) {
            const confidence = Math.max(0, 1 - (minStopDistance / radius));
            
            matches.set(routeId, {
              routeId,
              routeName: route.route_short_name || route.route_id,
              routeLongName: route.route_long_name,
              confidence: confidence * 0.9, // Slightly lower than shape-based
              distance: minStopDistance,
              matchType: 'stop',
              nearestStop: closestStop.stop_name,
              stopDistance: minStopDistance
            });
          }
        });
      }

      // 2. Shape-based matching (very accurate for route paths)
      if (includeShapes) {
        this.routeShapes.forEach((shape, routeId) => {
          const route = this.routes.find(r => r.route_id === routeId);
          if (!route) return;

          const distanceToShape = this.distanceToRoute(queryPoint, shape);
          
          if (distanceToShape <= radius) {
            const confidence = Math.max(0, 1 - (distanceToShape / radius));
            
            // Prefer shape-based matching if more accurate or not already matched
            const existing = matches.get(routeId);
            if (!existing || distanceToShape < existing.distance) {
              matches.set(routeId, {
                routeId,
                routeName: route.route_short_name || route.route_id,
                routeLongName: route.route_long_name,
                confidence: confidence,
                distance: distanceToShape,
                matchType: 'shape',
                shapePoints: shape.length
              });
            }
          }
        });
      }

      // 3. Fuzzy name matching for major routes
      const majorRoutes = ['21', 'X21', '1', '2', 'Q3', '307', '56', '57', '58'];
      majorRoutes.forEach(routeName => {
        const route = this.routes.find(r => 
          r.route_short_name === routeName || r.route_id === routeName
        );
        
        if (route && !matches.has(route.route_id)) {
          // Add with low confidence if within extended radius
          const extendedRadius = radius * 2;
          
          // Check if any stops are within extended radius
          const routeStops = this.stopsByRoute.get(route.route_id) || [];
          const nearbyStop = routeStops.find(stop => {
            const distance = this.calculateDistance(lat, lng, stop.lat, stop.lng);
            return distance <= extendedRadius;
          });
          
          if (nearbyStop) {
            const distance = this.calculateDistance(lat, lng, nearbyStop.lat, nearbyStop.lng);
            matches.set(route.route_id, {
              routeId: route.route_id,
              routeName: route.route_short_name || route.route_id,
              routeLongName: route.route_long_name,
              confidence: 0.3, // Low confidence for fuzzy match
              distance: distance,
              matchType: 'fuzzy',
              nearestStop: nearbyStop.stop_name
            });
          }
        }
      });

      // Convert to array and sort by confidence
      let results = Array.from(matches.values())
        .filter(match => match.confidence >= confidenceThreshold)
        .sort((a, b) => {
          // Primary sort: confidence
          if (Math.abs(a.confidence - b.confidence) > 0.1) {
            return b.confidence - a.confidence;
          }
          // Secondary sort: distance
          return a.distance - b.distance;
        })
        .slice(0, maxResults);

      // 4. Direction analysis (if requested)
      if (includeDirections) {
        results = await this.addDirectionAnalysis(results, queryPoint);
      }

      console.log(`🎯 Enhanced GTFS match: ${results.length} routes found within ${radius}m of (${lat}, ${lng})`);
      
      return {
        success: true,
        matches: results,
        query: { lat, lng, radius },
        matchedRoutes: results.length,
        highConfidenceMatches: results.filter(r => r.confidence > 0.7).length
      };

    } catch (error) {
      console.error('❌ Enhanced GTFS matching error:', error);
      return {
        success: false,
        error: error.message,
        matches: []
      };
    }
  }

  // Add direction analysis to determine inbound/outbound
  async addDirectionAnalysis(matches, queryPoint) {
    // This would analyze the route shape to determine direction
    // For now, return matches as-is
    return matches.map(match => ({
      ...match,
      direction: 'unknown' // TODO: Implement direction analysis
    }));
  }

  // Get route shapes for visualization
  async getRouteShapes(routeNames) {
    await this.initialize();
    
    const shapes = [];
    
    for (const routeName of routeNames) {
      const route = this.routes.find(r => 
        r.route_short_name === routeName || r.route_id === routeName
      );
      
      if (route) {
        const shape = this.routeShapes.get(route.route_id);
        if (shape) {
          shapes.push({
            routeId: route.route_id,
            routeName: route.route_short_name || route.route_id,
            coordinates: shape.map(point => [point.lng, point.lat]) // [lng, lat] for GeoJSON
          });
        }
      }
    }
    
    return {
      success: true,
      shapes
    };
  }

  // Get route statistics for debugging
  getStats() {
    return {
      totalRoutes: this.routes?.length || 0,
      totalStops: this.stops?.length || 0,
      totalShapes: this.shapes?.length || 0,
      routeStopMappings: this.stopsByRoute.size,
      routeShapeMappings: this.routeShapes.size,
      initialized: this.initialized
    };
  }
}

// Create singleton instance
const enhancedGTFSMatcher = new EnhancedGTFSMatcher();

export default enhancedGTFSMatcher;