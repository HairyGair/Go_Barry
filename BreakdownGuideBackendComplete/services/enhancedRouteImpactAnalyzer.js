// Enhanced Route Impact Analyzer for StreetManager Webhooks
// Provides intelligent geographical matching and severity classification
// Memory-optimized for 2GB RAM constraint on Render.com

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Enhanced Route Impact Analyzer
 * Intelligent geographical matching between StreetManager alerts and GTFS bus routes
 */
class EnhancedRouteImpactAnalyzer {
  constructor() {
    this.gtfsRoutes = new Map(); // Route geometries and metadata
    this.gtfsStops = new Map();  // Stop locations and route associations
    this.severityRules = new Map(); // Classification rules cache
    this.routeCache = new Map(); // Geographic proximity cache (LRU)
    this.cacheMaxSize = 100; // Limit cache size for memory management
    this.initialized = false;
    
    // North East England geographic bounds for filtering
    this.bounds = {
      north: 55.811,  // Berwick-upon-Tweed
      south: 54.400,  // Bishop Auckland  
      east: -1.200,   // Coast
      west: -2.800    // Pennines
    };
  }

  /**
   * Initialize the analyzer with GTFS data and severity rules
   */
  async initialize() {
    try {
      console.log('🚌 Initializing Enhanced Route Impact Analyzer...');
      
      // Load essential GTFS data (memory-optimized)
      await this.loadGTFSDataOptimized();
      
      // Load severity classification rules
      await this.loadSeverityRules();
      
      this.initialized = true;
      console.log(`✅ Route Impact Analyzer ready: ${this.gtfsRoutes.size} routes, ${this.gtfsStops.size} stops`);
      
      return true;
    } catch (error) {
      console.error('❌ Route Impact Analyzer initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Load optimized GTFS data focusing on North East routes only
   */
  async loadGTFSDataOptimized() {
    // Load routes first
    await this.loadRoutes();
    
    // Load stops within geographic bounds
    await this.loadStopsInBounds();
    
    // Load stop-route relationships from stop_times (sample only for memory efficiency)
    await this.loadStopRouteRelationships();
  }

  /**
   * Load bus routes from GTFS routes.txt
   */
  async loadRoutes() {
    try {
      const routesPath = path.join(__dirname, '../data', 'routes.txt');
      const content = await fs.readFile(routesPath, 'utf8');
      const lines = content.split('\n');
      
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim());
      const routeIdIndex = headers.indexOf('route_id');
      const routeShortNameIndex = headers.indexOf('route_short_name');
      const routeLongNameIndex = headers.indexOf('route_long_name');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const routeId = values[routeIdIndex];
          const shortName = values[routeShortNameIndex];
          const longName = values[routeLongNameIndex];
          
          if (routeId && shortName) {
            this.gtfsRoutes.set(routeId, {
              id: routeId,
              shortName: shortName,
              longName: longName,
              stops: new Set(),
              coordinates: [] // Will be populated from stops
            });
          }
        }
      }
      
      console.log(`📍 Loaded ${this.gtfsRoutes.size} bus routes`);
    } catch (error) {
      console.warn('⚠️ Could not load routes.txt:', error.message);
    }
  }

  /**
   * Load bus stops within North East England bounds
   */
  async loadStopsInBounds() {
    try {
      const stopsPath = path.join(__dirname, '../data', 'stops.txt');
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
          
          // Only include stops within North East bounds
          if (stopId && !isNaN(lat) && !isNaN(lon) && this.isInNorthEast(lat, lon)) {
            this.gtfsStops.set(stopId, {
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
      
      console.log(`📍 Loaded ${validStops} North East bus stops`);
    } catch (error) {
      console.warn('⚠️ Could not load stops.txt:', error.message);
    }
  }

  /**
   * Load stop-route relationships (memory-efficient sampling)
   */
  async loadStopRouteRelationships() {
    try {
      const stopTimesPath = path.join(__dirname, '../data', 'stop_times.txt');
      const content = await fs.readFile(stopTimesPath, 'utf8');
      const lines = content.split('\n');
      
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim());
      const tripIdIndex = headers.indexOf('trip_id');
      const stopIdIndex = headers.indexOf('stop_id');
      
      // Load trips to route mapping
      const tripToRoute = await this.loadTripRouteMapping();
      
      let processedLines = 0;
      const maxLines = Math.min(50000, lines.length); // Limit for memory efficiency
      
      for (let i = 1; i < maxLines; i++) {
        if (lines[i].trim() && processedLines % 10 === 0) { // Sample every 10th line
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const tripId = values[tripIdIndex];
          const stopId = values[stopIdIndex];
          
          if (tripId && stopId && tripToRoute.has(tripId) && this.gtfsStops.has(stopId)) {
            const routeId = tripToRoute.get(tripId);
            
            // Add stop to route
            if (this.gtfsRoutes.has(routeId)) {
              this.gtfsRoutes.get(routeId).stops.add(stopId);
              this.gtfsStops.get(stopId).routes.add(routeId);
            }
          }
        }
        processedLines++;
      }
      
      console.log(`🔗 Processed ${processedLines} stop-route relationships (sampled)`);
    } catch (error) {
      console.warn('⚠️ Could not load stop_times.txt:', error.message);
    }
  }

  /**
   * Load trip to route mapping from trips.txt
   */
  async loadTripRouteMapping() {
    const tripToRoute = new Map();
    
    try {
      const tripsPath = path.join(__dirname, '../data', 'trips.txt');
      const content = await fs.readFile(tripsPath, 'utf8');
      const lines = content.split('\n');
      
      if (lines.length < 2) return tripToRoute;
      
      const headers = lines[0].split(',').map(h => h.trim());
      const routeIdIndex = headers.indexOf('route_id');
      const tripIdIndex = headers.indexOf('trip_id');
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const routeId = values[routeIdIndex];
          const tripId = values[tripIdIndex];
          
          if (routeId && tripId) {
            tripToRoute.set(tripId, routeId);
          }
        }
      }
      
      console.log(`🗺️ Loaded ${tripToRoute.size} trip-route mappings`);
    } catch (error) {
      console.warn('⚠️ Could not load trips.txt:', error.message);
    }
    
    return tripToRoute;
  }

  /**
   * Load severity classification rules from database
   */
  async loadSeverityRules() {
    try {
      const { data: rules, error } = await supabase
        .from('severity_classification_rules')
        .select('*')
        .eq('active', true)
        .order('priority');
      
      if (error) throw error;
      
      rules.forEach(rule => {
        this.severityRules.set(rule.rule_name, rule);
      });
      
      console.log(`📋 Loaded ${this.severityRules.size} severity classification rules`);
    } catch (error) {
      console.warn('⚠️ Could not load severity rules from database:', error.message);
      // Use default rules if database fails
      this.loadDefaultSeverityRules();
    }
  }

  /**
   * Load default severity rules as fallback
   */
  loadDefaultSeverityRules() {
    const defaultRules = [
      {
        rule_name: 'emergency_works',
        conditions: { is_emergency_works: 'Yes' },
        base_severity: 'CRITICAL',
        impact_radius_meters: 1000,
        requires_notification: true,
        advance_notice_hours: 0
      },
      {
        rule_name: 'road_closure',
        conditions: { traffic_management_type: 'road_closure' },
        base_severity: 'CRITICAL',
        impact_radius_meters: 800,
        requires_notification: true,
        advance_notice_hours: 24
      },
      {
        rule_name: 'major_works',
        conditions: { work_category: 'major' },
        base_severity: 'HIGH',
        impact_radius_meters: 600,
        requires_notification: true,
        advance_notice_hours: 12
      }
    ];
    
    defaultRules.forEach(rule => {
      this.severityRules.set(rule.rule_name, rule);
    });
    
    console.log('📋 Loaded default severity rules');
  }

  /**
   * Analyze route impacts for a StreetManager alert
   */
  async analyzeRouteImpacts(streetworkData) {
    if (!this.initialized) {
      console.warn('⚠️ Route Impact Analyzer not initialized');
      return this.createEmptyAnalysis(streetworkData);
    }

    const analysisStart = Date.now();
    
    try {
      // Extract coordinates from the streetwork data
      const coordinates = this.extractCoordinates(streetworkData);
      if (!coordinates) {
        console.warn('⚠️ No valid coordinates found for streetwork');
        return this.createEmptyAnalysis(streetworkData);
      }

      // Check if coordinates are within North East bounds
      if (!this.isInNorthEast(coordinates.lat, coordinates.lon)) {
        console.log('📍 Streetwork outside North East England - skipping analysis');
        return this.createEmptyAnalysis(streetworkData);
      }

      // Classify severity based on work type
      const severityAnalysis = this.classifySeverity(streetworkData);
      
      // Find nearby routes using geographical analysis
      const nearbyRoutes = await this.findNearbyRoutes(coordinates, severityAnalysis.impact_radius_meters);
      
      // Analyze specific route impacts
      const routeImpacts = this.analyzeSpecificRouteImpacts(coordinates, nearbyRoutes, severityAnalysis);
      
      // Build comprehensive analysis result
      const analysis = {
        streetwork_id: streetworkData.permit_reference_number || streetworkData.activity_reference_number,
        coordinates: coordinates,
        
        // Severity classification
        impact_severity: severityAnalysis.base_severity,
        impact_radius_meters: severityAnalysis.impact_radius_meters,
        requires_supervisor_notification: severityAnalysis.requires_notification,
        advance_notice_hours: severityAnalysis.advance_notice_hours,
        
        // Route impacts
        affected_routes: routeImpacts.map(r => r.route_number),
        affected_route_count: routeImpacts.length,
        route_impacts: routeImpacts,
        
        // Confidence scoring
        route_matching_confidence: this.calculateOverallConfidence(routeImpacts),
        geographical_accuracy: coordinates.accuracy,
        
        // Performance metadata
        analysis_time_ms: Date.now() - analysisStart,
        analyzed_at: new Date().toISOString()
      };

      console.log(`✅ Route analysis complete: ${analysis.affected_route_count} routes affected (${analysis.analysis_time_ms}ms)`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Route impact analysis failed:', error.message);
      return this.createEmptyAnalysis(streetworkData, error.message);
    }
  }

  /**
   * Extract and validate coordinates from StreetManager data
   */
  extractCoordinates(data) {
    let lat, lon, accuracy = 'estimated';
    
    // Try different coordinate fields from StreetManager
    if (data.geometry) {
      const coords = this.parseWKTGeometry(data.geometry);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
        accuracy = 'exact';
      }
    }
    
    if (!lat && data.latitude && data.longitude) {
      lat = parseFloat(data.latitude);
      lon = parseFloat(data.longitude);
      accuracy = 'exact';
    }
    
    // Fallback to location description geocoding (would need geocoding service)
    if (!lat && data.location_description) {
      // This would require geocoding service integration
      console.log('📍 Would need geocoding for:', data.location_description);
      accuracy = 'approximate';
    }
    
    if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
      return { lat, lon, accuracy };
    }
    
    return null;
  }

  /**
   * Parse WKT geometry strings from StreetManager
   */
  parseWKTGeometry(wktString) {
    if (!wktString) return null;
    
    try {
      // Handle POINT format
      if (wktString.startsWith('POINT')) {
        const match = wktString.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
        if (match) {
          return {
            lon: parseFloat(match[1]),
            lat: parseFloat(match[2])
          };
        }
      }
      
      // Handle LINESTRING format (take midpoint)
      if (wktString.startsWith('LINESTRING')) {
        const coordsMatch = wktString.match(/LINESTRING\((.*)\)/);
        if (coordsMatch) {
          const coords = coordsMatch[1].split(',')[0].trim().split(' ');
          return {
            lon: parseFloat(coords[0]),
            lat: parseFloat(coords[1])
          };
        }
      }
      
    } catch (error) {
      console.error('Failed to parse WKT geometry:', error);
    }
    
    return null;
  }

  /**
   * Classify severity based on work characteristics
   */
  classifySeverity(data) {
    // Default classification
    let result = {
      base_severity: 'LOW',
      impact_radius_meters: 150,
      requires_notification: false,
      advance_notice_hours: 2,
      matched_rule: 'default'
    };
    
    // Apply rules in priority order
    for (const [ruleName, rule] of this.severityRules) {
      if (this.matchesRule(data, rule.conditions)) {
        result = {
          base_severity: rule.base_severity,
          impact_radius_meters: rule.impact_radius_meters,
          requires_notification: rule.requires_notification,
          advance_notice_hours: rule.advance_notice_hours,
          matched_rule: ruleName
        };
        break; // Use first matching rule (highest priority)
      }
    }
    
    console.log(`📊 Severity classified as ${result.base_severity} (rule: ${result.matched_rule})`);
    return result;
  }

  /**
   * Check if streetwork data matches rule conditions
   */
  matchesRule(data, conditions) {
    for (const [field, expectedValue] of Object.entries(conditions)) {
      const actualValue = data[field];
      if (actualValue !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Find nearby bus routes using geographical proximity
   */
  async findNearbyRoutes(coordinates, radiusMeters) {
    const cacheKey = `${coordinates.lat.toFixed(4)}_${coordinates.lon.toFixed(4)}_${radiusMeters}`;
    
    // Check cache first
    if (this.routeCache.has(cacheKey)) {
      this.routeCache.get(cacheKey).lastAccessed = Date.now();
      return this.routeCache.get(cacheKey).routes;
    }
    
    const nearbyRoutes = [];
    
    // Find stops within radius
    for (const [stopId, stop] of this.gtfsStops) {
      const distance = this.calculateDistance(coordinates.lat, coordinates.lon, stop.lat, stop.lon);
      
      if (distance <= radiusMeters) {
        // Add all routes serving this stop
        for (const routeId of stop.routes) {
          const route = this.gtfsRoutes.get(routeId);
          if (route) {
            const existingRoute = nearbyRoutes.find(r => r.route_id === routeId);
            if (existingRoute) {
              existingRoute.stop_distances.push(distance);
              existingRoute.closest_distance = Math.min(existingRoute.closest_distance, distance);
            } else {
              nearbyRoutes.push({
                route_id: routeId,
                route_number: route.shortName,
                route_name: route.longName,
                closest_stop_id: stopId,
                closest_stop_name: stop.name,
                closest_distance: distance,
                stop_distances: [distance]
              });
            }
          }
        }
      }
    }
    
    // Sort by closest distance
    nearbyRoutes.sort((a, b) => a.closest_distance - b.closest_distance);
    
    // Cache result (with LRU eviction)
    if (this.routeCache.size >= this.cacheMaxSize) {
      const oldestKey = [...this.routeCache.entries()]
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0][0];
      this.routeCache.delete(oldestKey);
    }
    
    this.routeCache.set(cacheKey, {
      routes: nearbyRoutes,
      lastAccessed: Date.now()
    });
    
    console.log(`🔍 Found ${nearbyRoutes.length} routes within ${radiusMeters}m`);
    return nearbyRoutes;
  }

  /**
   * Analyze specific impacts on individual routes
   */
  analyzeSpecificRouteImpacts(coordinates, nearbyRoutes, severityAnalysis) {
    return nearbyRoutes.map(route => {
      const routeImpact = this.determineRouteImpactType(route, severityAnalysis);
      const confidence = this.calculateRouteConfidence(route, coordinates);
      
      return {
        route_number: route.route_number,
        route_id: route.route_id,
        impact_type: routeImpact.type,
        route_impact_severity: routeImpact.severity,
        distance_meters: Math.round(route.closest_distance),
        closest_stop_id: route.closest_stop_id,
        closest_stop_name: route.closest_stop_name,
        closest_stop_distance: Math.round(route.closest_distance),
        estimated_delay_minutes: routeImpact.estimated_delay,
        requires_diversion: routeImpact.requires_diversion,
        passenger_impact_level: routeImpact.passenger_impact,
        matching_confidence: confidence,
        matching_method: 'proximity_analysis'
      };
    });
  }

  /**
   * Determine specific impact type for a route
   */
  determineRouteImpactType(route, severityAnalysis) {
    const distance = route.closest_distance;
    
    if (distance <= 50) {
      return {
        type: 'DIRECT_BLOCKAGE',
        severity: severityAnalysis.base_severity,
        estimated_delay: 15,
        requires_diversion: true,
        passenger_impact: 'severe'
      };
    } else if (distance <= 100) {
      return {
        type: 'STOP_AFFECTED',
        severity: this.reduceSeverity(severityAnalysis.base_severity),
        estimated_delay: 8,
        requires_diversion: false,
        passenger_impact: 'significant'
      };
    } else if (distance <= 200) {
      return {
        type: 'DELAY_RISK',
        severity: this.reduceSeverity(severityAnalysis.base_severity, 2),
        estimated_delay: 3,
        requires_diversion: false,
        passenger_impact: 'moderate'
      };
    } else {
      return {
        type: 'TIMING_IMPACT',
        severity: 'LOW',
        estimated_delay: 1,
        requires_diversion: false,
        passenger_impact: 'minimal'
      };
    }
  }

  /**
   * Calculate confidence score for route matching
   */
  calculateRouteConfidence(route, coordinates) {
    const distance = route.closest_distance;
    
    if (distance <= 50) return 95;
    if (distance <= 100) return 85;
    if (distance <= 200) return 70;
    if (distance <= 400) return 50;
    return 30;
  }

  /**
   * Calculate overall confidence across all route matches
   */
  calculateOverallConfidence(routeImpacts) {
    if (routeImpacts.length === 0) return 0;
    
    const totalConfidence = routeImpacts.reduce((sum, impact) => sum + impact.matching_confidence, 0);
    return Math.round(totalConfidence / routeImpacts.length);
  }

  /**
   * Helper function to reduce severity level
   */
  reduceSeverity(severity, levels = 1) {
    const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = severityOrder.indexOf(severity);
    const newIndex = Math.max(0, currentIndex - levels);
    return severityOrder[newIndex];
  }

  /**
   * Calculate distance between two points in meters
   */
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

  /**
   * Check if coordinates are within North East England bounds
   */
  isInNorthEast(lat, lon) {
    return lat >= this.bounds.south && 
           lat <= this.bounds.north && 
           lon >= this.bounds.west && 
           lon <= this.bounds.east;
  }

  /**
   * Create empty analysis result for non-applicable streetworks
   */
  createEmptyAnalysis(streetworkData, error = null) {
    return {
      streetwork_id: streetworkData.permit_reference_number || streetworkData.activity_reference_number,
      coordinates: null,
      impact_severity: 'LOW',
      impact_radius_meters: 0,
      requires_supervisor_notification: false,
      advance_notice_hours: 0,
      affected_routes: [],
      affected_route_count: 0,
      route_impacts: [],
      route_matching_confidence: 0,
      geographical_accuracy: 'none',
      analysis_time_ms: 0,
      analyzed_at: new Date().toISOString(),
      error: error
    };
  }

  /**
   * Get analyzer status and statistics
   */
  getStatus() {
    return {
      initialized: this.initialized,
      routes_loaded: this.gtfsRoutes.size,
      stops_loaded: this.gtfsStops.size,
      severity_rules: this.severityRules.size,
      cache_size: this.routeCache.size,
      cache_max_size: this.cacheMaxSize,
      geographic_bounds: this.bounds
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.routeCache.clear();
    console.log('🧹 Route analysis cache cleared');
  }
}

// Export singleton instance
const routeImpactAnalyzer = new EnhancedRouteImpactAnalyzer();

export default routeImpactAnalyzer;
export { EnhancedRouteImpactAnalyzer };