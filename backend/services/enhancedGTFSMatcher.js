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

  // NEW: Compare GTFS scheduled vs actual times using BODS data
  async compareScheduledVsActual(routeId, stopId, currentTime) {
    await this.initialize();
    
    try {
      // Get GTFS scheduled data for the route and stop
      const route = this.routes.find(r => 
        r.route_id === routeId || r.route_short_name === routeId
      );
      
      if (!route) {
        return {
          success: false,
          error: `Route ${routeId} not found in GTFS data`
        };
      }
      
      // Get stops for this route
      const routeStops = this.stopsByRoute.get(route.route_id) || [];
      const targetStop = routeStops.find(stop => 
        stop.stop_id === stopId || stop.stop_name?.includes(stopId)
      );
      
      if (!targetStop) {
        return {
          success: false,
          error: `Stop ${stopId} not found for route ${routeId}`
        };
      }
      
      // For now, return structure that can be enhanced with real-time data
      return {
        success: true,
        routeId: route.route_id,
        routeName: route.route_short_name,
        stopId: targetStop.stop_id,
        stopName: targetStop.stop_name,
        scheduledData: {
          // This would normally come from GTFS stop_times.txt
          note: 'Scheduled times would be loaded from GTFS stop_times.txt'
        },
        actualData: {
          // This would come from BODS live data
          note: 'Actual times would come from BODS/SIRI-VM data'
        },
        comparison: {
          delayMinutes: null,
          status: 'unknown',
          note: 'Full implementation requires GTFS stop_times.txt and live BODS data'
        }
      };
      
    } catch (error) {
      console.error('❌ Scheduled vs actual comparison error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // NEW: Enhanced route matching that supports both GTFS and TransXChange formats
  async matchRoutesWithTransXChange(lat, lng, transXChangeData = null, options = {}) {
    await this.initialize();
    
    // Get GTFS matches first
    const gtfsResult = await this.matchRoutesEnhanced(lat, lng, options);
    
    if (!transXChangeData) {
      // Return GTFS-only results if no TransXChange data provided
      return {
        ...gtfsResult,
        dataSource: 'GTFS-only',
        transXChangeMatches: 0
      };
    }
    
    try {
      // Enhance GTFS matches with TransXChange data
      const enhancedMatches = gtfsResult.matches.map(match => {
        // Look for corresponding TransXChange data
        const txcMatch = this.findTransXChangeMatch(match, transXChangeData);
        
        if (txcMatch) {
          return {
            ...match,
            transXChange: {
              serviceRef: txcMatch.serviceRef,
              operatorRef: txcMatch.operatorRef,
              lineName: txcMatch.lineName,
              direction: txcMatch.direction,
              scheduledStops: txcMatch.stops?.length || 0,
              lastModified: txcMatch.lastModified
            },
            confidence: Math.min(1.0, match.confidence + 0.1), // Boost confidence
            dataSource: 'GTFS+TransXChange'
          };
        }
        
        return {
          ...match,
          dataSource: 'GTFS-only'
        };
      });
      
      // Add any TransXChange-only matches
      const txcOnlyMatches = this.findTransXChangeOnlyMatches(
        lat, lng, transXChangeData, gtfsResult.matches, options
      );
      
      const allMatches = [...enhancedMatches, ...txcOnlyMatches]
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, options.maxResults || 20);
      
      return {
        success: true,
        matches: allMatches,
        query: { lat, lng, radius: options.radius || 1000 },
        matchedRoutes: allMatches.length,
        gtfsMatches: enhancedMatches.length,
        transXChangeMatches: txcOnlyMatches.length,
        dataSource: 'GTFS+TransXChange'
      };
      
    } catch (error) {
      console.error('❌ TransXChange enhanced matching error:', error);
      
      // Fallback to GTFS-only on error
      return {
        ...gtfsResult,
        dataSource: 'GTFS-fallback',
        transXChangeError: error.message
      };
    }
  }
  
  // Helper: Find matching TransXChange data for a GTFS route
  findTransXChangeMatch(gtfsMatch, transXChangeData) {
    if (!transXChangeData || !Array.isArray(transXChangeData)) {
      return null;
    }
    
    // Try to match by route name/number
    const routeName = gtfsMatch.routeName;
    
    return transXChangeData.find(txc => {
      // Various matching strategies
      return (
        txc.lineName === routeName ||
        txc.lineRef === routeName ||
        txc.serviceRef?.includes(routeName) ||
        txc.serviceName?.includes(routeName)
      );
    });
  }
  
  // Helper: Find TransXChange routes that don't have GTFS matches
  findTransXChangeOnlyMatches(lat, lng, transXChangeData, existingMatches, options) {
    if (!transXChangeData || !Array.isArray(transXChangeData)) {
      return [];
    }
    
    const existingRouteNames = new Set(
      existingMatches.map(m => m.routeName)
    );
    
    const txcOnlyMatches = [];
    const radius = options.radius || 1000;
    
    transXChangeData.forEach(txc => {
      const routeName = txc.lineName || txc.lineRef;
      
      // Skip if already matched by GTFS
      if (!routeName || existingRouteNames.has(routeName)) {
        return;
      }
      
      // Check if TransXChange data has stops near the query point
      const nearbyStops = this.findNearbyTransXChangeStops(lat, lng, txc, radius);
      
      if (nearbyStops.length > 0) {
        const closestStop = nearbyStops[0];
        const confidence = Math.max(0, 1 - (closestStop.distance / radius)) * 0.7; // Lower confidence for TXC-only
        
        txcOnlyMatches.push({
          routeId: txc.serviceRef || routeName,
          routeName: routeName,
          routeLongName: txc.serviceName || txc.description,
          confidence: confidence,
          distance: closestStop.distance,
          matchType: 'transxchange-only',
          dataSource: 'TransXChange-only',
          transXChange: {
            serviceRef: txc.serviceRef,
            operatorRef: txc.operatorRef,
            lineName: txc.lineName,
            direction: txc.direction,
            scheduledStops: txc.stops?.length || 0,
            lastModified: txc.lastModified
          },
          nearestStop: closestStop.stopName
        });
      }
    });
    
    return txcOnlyMatches;
  }
  
  // Helper: Find nearby stops in TransXChange data
  findNearbyTransXChangeStops(lat, lng, transXChangeService, radius) {
    if (!transXChangeService.stops || !Array.isArray(transXChangeService.stops)) {
      return [];
    }
    
    const nearbyStops = [];
    
    transXChangeService.stops.forEach(stop => {
      if (stop.latitude && stop.longitude) {
        const distance = this.calculateDistance(
          lat, lng,
          parseFloat(stop.latitude),
          parseFloat(stop.longitude)
        );
        
        if (distance <= radius) {
          nearbyStops.push({
            stopId: stop.stopId || stop.atcoCode,
            stopName: stop.stopName || stop.commonName,
            distance: distance,
            coordinates: {
              lat: parseFloat(stop.latitude),
              lng: parseFloat(stop.longitude)
            }
          });
        }
      }
    });
    
    return nearbyStops.sort((a, b) => a.distance - b.distance);
  }

  // NEW: Enhanced function for Message Distribution Centre - Phase 5
  async getAffectedRoutes(location, radius = 500, options = {}) {
    await this.initialize();
    
    try {
      let matches = [];
      
      // Handle different input types
      if (typeof location === 'string') {
        // Text-based location matching
        matches = await this.matchLocationToRoutes(location, options);
      } else if (location.lat && location.lng) {
        // Coordinate-based matching
        const result = await this.matchRoutesEnhanced(location.lat, location.lng, {
          radius,
          maxResults: 50,
          includeStops: true,
          includeShapes: true,
          confidenceThreshold: 0.1,
          ...options
        });
        matches = result.matches || [];
      } else {
        throw new Error('Invalid location input - must be coordinates {lat, lng} or location string');
      }

      // Enhance matches with route impact analysis
      const enhancedMatches = matches.map(match => {
        const impactLevel = this.calculateRouteImpactLevel(match);
        const diversionSuggestions = this.generateDiversionSuggestions(match);
        
        return {
          routeId: match.routeId || match.routeName,
          routeName: match.routeName || match.routeId,
          routeLongName: match.routeLongName || '',
          confidence: match.confidence || 0,
          distance: match.distance || null,
          impactLevel, // 'high', 'medium', 'low'
          diversionSuggestions,
          stops: this.getRouteStopsInArea(match.routeId, location, radius * 2),
          estimatedPassengers: this.estimatePassengerImpact(match.routeId),
          operationalPriority: this.calculateOperationalPriority(match.routeId),
          matchType: match.matchType || 'standard'
        };
      });

      // Sort by operational impact (high impact routes first)
      const sortedMatches = enhancedMatches.sort((a, b) => {
        // Primary: Impact level (high > medium > low)
        const impactOrder = { high: 3, medium: 2, low: 1 };
        if (impactOrder[a.impactLevel] !== impactOrder[b.impactLevel]) {
          return impactOrder[b.impactLevel] - impactOrder[a.impactLevel];
        }
        
        // Secondary: Confidence
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        
        // Tertiary: Distance
        return (a.distance || Infinity) - (b.distance || Infinity);
      });

      return {
        success: true,
        location: typeof location === 'string' ? location : `${location.lat}, ${location.lng}`,
        totalRoutes: sortedMatches.length,
        highImpactRoutes: sortedMatches.filter(r => r.impactLevel === 'high').length,
        mediumImpactRoutes: sortedMatches.filter(r => r.impactLevel === 'medium').length,
        lowImpactRoutes: sortedMatches.filter(r => r.impactLevel === 'low').length,
        routes: sortedMatches,
        searchRadius: radius,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ getAffectedRoutes error:', error);
      return {
        success: false,
        error: error.message,
        location: typeof location === 'string' ? location : `${location.lat}, ${location.lng}`,
        routes: []
      };
    }
  }

  // Helper: Match location text to routes
  async matchLocationToRoutes(locationText, options = {}) {
    const location = locationText.toLowerCase();
    const matches = [];

    // Enhanced location-to-route mapping for Go North East
    const locationMappings = {
      'high level bridge': {
        routes: ['1', '10', '10A', '10B', '11', '11X', '12', '12A', 'Q3', '21', '28B', '29', '56', '57', '58', '84', '85', '93', '94'],
        confidence: 0.95,
        description: 'Major Tyne crossing - affects most Newcastle-Gateshead services'
      },
      'a1': {
        routes: ['21', 'X21', '309', '310', '311', '685'],
        confidence: 0.90,
        description: 'Main north-south corridor'
      },
      'team valley': {
        routes: ['21', 'X21', '685'],
        confidence: 0.85,
        description: 'Major retail and business area'
      },
      'central station': {
        routes: ['10', '11', '12', '21', '56', '57', '58'],
        confidence: 0.90,
        description: 'Main transport interchange'
      },
      'a19': {
        routes: ['1', '309', '310', '311', '19'],
        confidence: 0.85,
        description: 'Coast road and tunnel approach'
      },
      'grey street': {
        routes: ['1', '12', '21', 'Q3', '56', '57'],
        confidence: 0.80,
        description: 'Newcastle city centre'
      },
      'a167': {
        routes: ['21', 'X21', '25', '28', '28A'],
        confidence: 0.85,
        description: 'Durham Road corridor'
      },
      'a184': {
        routes: ['27', '28', '28A'],
        confidence: 0.80,
        description: 'Felling and Washington corridor'
      },
      'durham': {
        routes: ['21', 'X21', '6', '50'],
        confidence: 0.85,
        description: 'Durham city services'
      },
      'sunderland': {
        routes: ['16', '20', '35', '36', '61', '62'],
        confidence: 0.85,
        description: 'Sunderland city services'
      }
    };

    // Check for direct matches
    for (const [key, mapping] of Object.entries(locationMappings)) {
      if (location.includes(key)) {
        mapping.routes.forEach(routeId => {
          matches.push({
            routeId,
            routeName: routeId,
            confidence: mapping.confidence,
            matchType: 'location_mapping',
            description: mapping.description
          });
        });
        break; // Use first match to avoid duplicates
      }
    }

    // If no direct match, try fuzzy matching
    if (matches.length === 0) {
      // Extract potential route numbers from location text
      const routePattern = /\b(Q\d+|X\d+|\d+[A-Z]*)\b/gi;
      const foundRoutes = locationText.match(routePattern);
      
      if (foundRoutes) {
        foundRoutes.forEach(routeId => {
          matches.push({
            routeId,
            routeName: routeId,
            confidence: 0.7,
            matchType: 'text_extraction',
            description: 'Route extracted from location text'
          });
        });
      }
    }

    return matches;
  }

  // Helper: Calculate route impact level
  calculateRouteImpactLevel(match) {
    const routeId = match.routeId || match.routeName;
    
    // High-frequency/high-importance routes
    const highImpactRoutes = ['21', 'X21', '1', '10', '11', '12', 'Q3'];
    const mediumImpactRoutes = ['56', '57', '58', '309', '310', '311', '25', '28'];
    
    if (highImpactRoutes.includes(routeId)) {
      return 'high';
    } else if (mediumImpactRoutes.includes(routeId)) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Helper: Generate diversion suggestions
  generateDiversionSuggestions(match) {
    const routeId = match.routeId || match.routeName;
    
    // Common diversion patterns for Go North East
    const diversionMap = {
      '21': ['Use X21 for express service', 'Via A167 if A1 affected'],
      'X21': ['Use service 21 for local stops', 'Via Durham if direct route blocked'],
      '1': ['Use Metro for Tyne crossing', 'Services 12/Q3 for city centre'],
      '10': ['Use services 11/12 for similar route', 'Metro for river crossing'],
      '11': ['Use services 10/12 for alternative', 'Central Station for connections'],
      '12': ['Use services 10/11 for similar areas', 'Q3 for city centre'],
      'Q3': ['Use services 12/21 for city centre', 'Metro for Quayside area']
    };

    return diversionMap[routeId] || ['Monitor for alternative routes', 'Check live departures'];
  }

  // Helper: Get route stops in area
  getRouteStopsInArea(routeId, location, radius) {
    const routeStops = this.stopsByRoute.get(routeId) || [];
    
    if (typeof location === 'string') {
      // For text locations, return sample stops
      return routeStops.slice(0, 5).map(stop => ({
        stopId: stop.stop_id,
        stopName: stop.stop_name,
        inArea: true
      }));
    }
    
    // For coordinates, find stops within radius
    return routeStops
      .filter(stop => {
        if (!stop.lat || !stop.lng) return false;
        const distance = this.calculateDistance(
          location.lat, location.lng,
          stop.lat, stop.lng
        );
        return distance <= radius;
      })
      .map(stop => ({
        stopId: stop.stop_id,
        stopName: stop.stop_name,
        distance: this.calculateDistance(
          location.lat, location.lng,
          stop.lat, stop.lng
        ),
        inArea: true
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Limit to 10 closest stops
  }

  // Helper: Estimate passenger impact
  estimatePassengerImpact(routeId) {
    // Based on typical Go North East route frequencies and importance
    const passengerEstimates = {
      '21': 'Very High (800+ daily passengers)',
      'X21': 'High (500+ daily passengers)', 
      '1': 'High (600+ daily passengers)',
      '10': 'Medium (300+ daily passengers)',
      '11': 'Medium (300+ daily passengers)',
      '12': 'Medium (400+ daily passengers)',
      'Q3': 'Medium (350+ daily passengers)',
      '56': 'Medium (250+ daily passengers)',
      '57': 'Medium (250+ daily passengers)',
      '58': 'Medium (200+ daily passengers)'
    };

    return passengerEstimates[routeId] || 'Low-Medium (50-200 daily passengers)';
  }

  // Helper: Calculate operational priority
  calculateOperationalPriority(routeId) {
    const highPriorityRoutes = ['21', 'X21', '1', 'Q3'];
    const mediumPriorityRoutes = ['10', '11', '12', '56', '57', '58'];
    
    if (highPriorityRoutes.includes(routeId)) {
      return 'Critical - Immediate attention required';
    } else if (mediumPriorityRoutes.includes(routeId)) {
      return 'High - Monitor closely';
    } else {
      return 'Standard - Monitor as needed';
    }
  }
}

// Create singleton instance
const enhancedGTFSMatcher = new EnhancedGTFSMatcher();

export default enhancedGTFSMatcher;