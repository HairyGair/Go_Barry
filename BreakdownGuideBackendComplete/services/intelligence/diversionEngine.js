// backend/services/intelligence/diversionEngine.js
// Local AI-powered diversion suggestions using GTFS data and route knowledge

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TomTom API configuration
const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
const TOMTOM_ROUTING_URL = 'https://api.tomtom.com/routing/1/calculateRoute';

// Key interchange points in the Go North East network
const KEY_INTERCHANGES = {
  'Gateshead Interchange': {
    routes: ['10', '10A', '10B', '27', '28', '28B', 'Q3', 'Q3X', '53', '54', '56', '57', '58'],
    coordinates: [54.9526, -1.6014]
  },
  'Newcastle Central Station': {
    routes: ['Q3', 'Q3X', '10', '10A', '10B', '21', '22', 'X21', '1', '2', '27', '28', '29', '47'],
    coordinates: [54.9783, -1.6178]
  },
  'Haymarket Bus Station': {
    routes: ['1', '2', '22', '22X', '30', '31', '32', '33', '35', '36', '685', 'X77', 'X78', 'X79'],
    coordinates: [54.9785, -1.6142]
  },
  'Four Lane Ends': {
    routes: ['1', '2', '51', '52', '53', '54', '307', '309', '310', '311'],
    coordinates: [55.0140, -1.5820]
  },
  'MetroCentre': {
    routes: ['10', '10A', '10B', '6', '6A', '100'],
    coordinates: [54.9530, -1.6720]
  },
  'Sunderland City Centre': {
    routes: ['2', '2A', '9', '20', '35', '36', '56', '61', '62', '700'],
    coordinates: [54.9069, -1.3838]
  },
  'Durham Bus Station': {
    routes: ['21', '22', 'X21', '6', '7', '20', '20A', '50', '64', '265'],
    coordinates: [54.7753, -1.5849]
  }
};

// Known route corridors and relationships
const ROUTE_CORRIDORS = {
  'Great North Road': {
    routes: ['1', '2', '51', '52'],
    alternative: 'Metro to Four Lane Ends'
  },
  'Coast Road (A1058)': {
    routes: ['307', '309', '310', '311'],
    alternative: 'Metro to coast'
  },
  'Durham Road (A167)': {
    routes: ['21', '22', 'X21', '28', '28A', '29'],
    alternative: 'Train Durham-Newcastle'
  },
  'A1 Western Bypass': {
    routes: ['X21', 'X22', '6', 'X9', 'X10'],
    alternative: 'Local routes via city centers'
  },
  'Scotswood Road': {
    routes: ['12', '22', '22X', '39', '40'],
    alternative: 'Routes via Newcastle Centre'
  }
};

// Common diversion scenarios and templates
const DIVERSION_TEMPLATES = {
  'road_closure': {
    name: 'Road Closure',
    analysis: 'Find parallel routes and nearest interchanges',
    priority: 'immediate'
  },
  'bridge_closed': {
    name: 'Bridge Closure',
    analysis: 'Routes avoiding the bridge, alternative crossings',
    priority: 'immediate'
  },
  'city_centre': {
    name: 'City Centre Disruption',
    analysis: 'Park & Ride options, outer routes',
    priority: 'urgent'
  },
  'motorway': {
    name: 'Motorway Incident',
    analysis: 'Local road alternatives, express service suspension',
    priority: 'high'
  },
  'weather': {
    name: 'Weather Related',
    analysis: 'Safer alternative routes, service suspensions',
    priority: 'safety'
  }
};

// Bridge crossings and alternatives
const BRIDGE_ALTERNATIVES = {
  'Tyne Bridge': {
    avoid: ['Tyne Bridge'],
    alternatives: ['High Level Bridge', 'Redheugh Bridge', 'Metro', 'Tyne Tunnel']
  },
  'High Level Bridge': {
    avoid: ['High Level Bridge'],
    alternatives: ['Tyne Bridge', 'Redheugh Bridge', 'Metro']
  },
  'Redheugh Bridge': {
    avoid: ['Redheugh Bridge'],
    alternatives: ['Tyne Bridge', 'High Level Bridge']
  },
  'Swing Bridge': {
    avoid: ['Swing Bridge'],
    alternatives: ['Tyne Bridge', 'High Level Bridge', 'Millennium Bridge (walking)']
  }
};

class IntelligentDiversionEngine {
  constructor() {
    this.routesData = new Map();
    this.stopsData = new Map();
    this.routeStops = new Map(); // route -> [stops]
    this.stopRoutes = new Map(); // stop -> [routes]
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      console.log('🧠 Initializing Intelligent Diversion Engine...');
      
      // Load GTFS data
      await this.loadGTFSData();
      await this.buildRouteRelationships();
      
      this.initialized = true;
      console.log('✅ Intelligent Diversion Engine ready');
    } catch (error) {
      console.error('❌ Failed to initialize diversion engine:', error);
      throw error;
    }
  }

  async loadGTFSData() {
    try {
      // Load routes
      const routesPath = path.join(__dirname, '../../data/routes.txt');
      const routesContent = await fs.readFile(routesPath, 'utf-8');
      const routes = parse(routesContent, { columns: true, skip_empty_lines: true });
      
      routes.forEach(route => {
        this.routesData.set(route.route_short_name, route);
      });
      
      // Load stops
      const stopsPath = path.join(__dirname, '../../data/stops.txt');
      const stopsContent = await fs.readFile(stopsPath, 'utf-8');
      const stops = parse(stopsContent, { columns: true, skip_empty_lines: true });
      
      stops.forEach(stop => {
        this.stopsData.set(stop.stop_id, stop);
      });
      
      // Load stop times to build route-stop relationships
      const stopTimesPath = path.join(__dirname, '../../data/stop_times.txt');
      const stopTimesContent = await fs.readFile(stopTimesPath, 'utf-8');
      const stopTimes = parse(stopTimesContent, { columns: true, skip_empty_lines: true });
      
      // Build route-stop mappings
      const routeStopsMap = new Map();
      stopTimes.forEach(st => {
        const routeId = st.trip_id.split('_')[0]; // Extract route from trip ID
        if (!routeStopsMap.has(routeId)) {
          routeStopsMap.set(routeId, new Set());
        }
        routeStopsMap.get(routeId).add(st.stop_id);
      });
      
      // Convert sets to arrays
      routeStopsMap.forEach((stops, route) => {
        this.routeStops.set(route, Array.from(stops));
      });
      
      console.log(`📊 Loaded ${this.routesData.size} routes, ${this.stopsData.size} stops`);
    } catch (error) {
      console.warn('⚠️ Could not load full GTFS data, using simplified data');
      // Use simplified fallback data
      this.initializeFallbackData();
    }
  }

  initializeFallbackData() {
    // Simplified route relationships for core routes
    const coreRoutes = {
      '1': { stops: 50, corridor: 'Great North Road', interchanges: ['Newcastle', 'Four Lane Ends'] },
      '2': { stops: 65, corridor: 'Great North Road', interchanges: ['Newcastle', 'Four Lane Ends', 'Sunderland'] },
      '21': { stops: 45, corridor: 'Durham Road', interchanges: ['Newcastle', 'Gateshead', 'Durham'] },
      '22': { stops: 40, corridor: 'Durham Road', interchanges: ['Newcastle', 'Gateshead', 'Durham'] },
      'Q3': { stops: 25, corridor: 'City Link', interchanges: ['Newcastle', 'Gateshead', 'Metro Centre'] },
      '307': { stops: 30, corridor: 'Coast Road', interchanges: ['Newcastle', 'North Shields'] },
      '309': { stops: 35, corridor: 'Coast Road', interchanges: ['Newcastle', 'Whitley Bay'] }
    };
    
    Object.entries(coreRoutes).forEach(([route, data]) => {
      this.routesData.set(route, data);
    });
  }

  async buildRouteRelationships() {
    // Build stop-to-route mappings
    this.routeStops.forEach((stops, route) => {
      stops.forEach(stop => {
        if (!this.stopRoutes.has(stop)) {
          this.stopRoutes.set(stop, []);
        }
        this.stopRoutes.get(stop).push(route);
      });
    });
  }

  /**
   * Get AI-powered diversion suggestions for an incident
   */
  async getDiversionSuggestions(incident) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const suggestions = {
      incidentId: incident.id,
      location: incident.location,
      affectedRoutes: incident.affectsRoutes || [],
      diversions: [],
      interchanges: [],
      generalAdvice: [],
      tomtomRoutes: [], // New: TomTom alternative routes
      severity: this.assessIncidentSeverity(incident),
      timestamp: new Date().toISOString()
    };
    
    // 1. Find affected corridors and interchanges
    const affectedCorridors = this.findAffectedCorridors(incident);
    const nearbyInterchanges = this.findNearbyInterchanges(incident.coordinates);
    
    suggestions.interchanges = nearbyInterchanges;
    
    // 2. Generate route-specific diversions
    if (incident.affectsRoutes && incident.affectsRoutes.length > 0) {
      for (const route of incident.affectsRoutes) {
        const diversion = await this.generateRouteDiversion(route, incident);
        if (diversion) {
          suggestions.diversions.push(diversion);
        }
      }
    }
    
    // 3. Add TomTom traffic-aware routing
    if (incident.coordinates && nearbyInterchanges.length > 0) {
      try {
        const tomtomAlternatives = await this.getTomTomAlternativeRoutes(incident, nearbyInterchanges);
        suggestions.tomtomRoutes = tomtomAlternatives;
        
        // Add TomTom advice to general advice
        if (tomtomAlternatives.length > 0) {
          const fastest = tomtomAlternatives[0];
          suggestions.generalAdvice.push({
            type: 'tomtom',
            advice: `Fastest route: ${fastest.summary} (${fastest.duration} mins, ${fastest.distance} km)`,
            priority: 'high',
            trafficDelay: fastest.trafficDelay
          });
        }
      } catch (error) {
        console.warn('⚠️ TomTom routing failed:', error.message);
      }
    }
    
    // 4. Add corridor-based suggestions
    affectedCorridors.forEach(corridor => {
      if (ROUTE_CORRIDORS[corridor]) {
        suggestions.generalAdvice.push({
          type: 'corridor',
          corridor: corridor,
          advice: `${corridor} affected. Consider ${ROUTE_CORRIDORS[corridor].alternative}`,
          priority: 'high'
        });
      }
    });
    
    // 5. Add template-based advice
    const templateAdvice = this.getTemplateAdvice(incident);
    suggestions.generalAdvice.push(...templateAdvice);
    
    // 6. Add interchange-based diversions
    if (nearbyInterchanges.length > 0) {
      suggestions.generalAdvice.push({
        type: 'interchange',
        advice: `Use ${nearbyInterchanges[0].name} for alternative connections`,
        routes: nearbyInterchanges[0].routes,
        priority: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Get TomTom alternative routes avoiding incident
   */
  async getTomTomAlternativeRoutes(incident, interchanges) {
    if (!incident.coordinates || interchanges.length < 2) {
      return [];
    }
    
    const alternatives = [];
    const incidentLat = incident.coordinates.latitude || incident.coordinates[0];
    const incidentLng = incident.coordinates.longitude || incident.coordinates[1];
    
    // Create avoid box around incident (500m radius)
    const avoidBox = {
      southWest: {
        lat: incidentLat - 0.0045, // ~500m
        lng: incidentLng - 0.0045
      },
      northEast: {
        lat: incidentLat + 0.0045,
        lng: incidentLng + 0.0045
      }
    };
    
    // Calculate routes between major interchanges avoiding incident
    for (let i = 0; i < Math.min(2, interchanges.length - 1); i++) {
      const origin = interchanges[i];
      const destination = interchanges[i + 1];
      
      try {
        // TomTom routing request
        const url = `${TOMTOM_ROUTING_URL}/${origin.coordinates[0]},${origin.coordinates[1]}:${destination.coordinates[0]},${destination.coordinates[1]}/json`;
        
        const response = await axios.get(url, {
          params: {
            key: TOMTOM_API_KEY,
            traffic: true,
            travelMode: 'bus',
            maxAlternatives: 2,
            avoid: 'unpavedRoads',
            computeBestOrder: true,
            routeType: 'fastest',
            departAt: 'now',
            avoidAreas: `${avoidBox.southWest.lng},${avoidBox.southWest.lat},${avoidBox.northEast.lng},${avoidBox.northEast.lat}`
          },
          timeout: 5000
        });
        
        if (response.data && response.data.routes) {
          response.data.routes.forEach((route, idx) => {
            const leg = route.legs[0];
            const summary = route.summary;
            
            alternatives.push({
              type: idx === 0 ? 'primary' : 'alternative',
              from: origin.name,
              to: destination.name,
              summary: `${origin.name} → ${destination.name}`,
              distance: (summary.lengthInMeters / 1000).toFixed(1),
              duration: Math.round(summary.travelTimeInSeconds / 60),
              trafficDelay: Math.round(summary.trafficDelayInSeconds / 60),
              viaPoints: this.extractViaPoints(leg),
              avoidedIncident: true,
              confidence: summary.trafficDelayInSeconds > 0 ? 'live' : 'estimated'
            });
          });
        }
      } catch (error) {
        console.warn(`⚠️ TomTom route calculation failed for ${origin.name} to ${destination.name}:`, error.message);
      }
    }
    
    // Also calculate from incident location to nearest safe interchange
    if (alternatives.length === 0 && interchanges.length > 0) {
      try {
        const safeInterchange = interchanges[0];
        const url = `${TOMTOM_ROUTING_URL}/${incidentLat},${incidentLng}:${safeInterchange.coordinates[0]},${safeInterchange.coordinates[1]}/json`;
        
        const response = await axios.get(url, {
          params: {
            key: TOMTOM_API_KEY,
            traffic: true,
            travelMode: 'car', // Car mode for general traffic
            routeType: 'fastest',
            departAt: 'now'
          },
          timeout: 5000
        });
        
        if (response.data && response.data.routes && response.data.routes[0]) {
          const route = response.data.routes[0];
          const summary = route.summary;
          
          alternatives.push({
            type: 'evacuation',
            from: 'Incident Location',
            to: safeInterchange.name,
            summary: `Exit via ${safeInterchange.name}`,
            distance: (summary.lengthInMeters / 1000).toFixed(1),
            duration: Math.round(summary.travelTimeInSeconds / 60),
            trafficDelay: Math.round(summary.trafficDelayInSeconds / 60),
            viaPoints: [],
            avoidedIncident: false,
            confidence: 'live'
          });
        }
      } catch (error) {
        console.warn('⚠️ TomTom evacuation route failed:', error.message);
      }
    }
    
    return alternatives.sort((a, b) => a.duration - b.duration);
  }
  
  /**
   * Extract major via points from TomTom route
   */
  extractViaPoints(leg) {
    if (!leg.points || leg.points.length < 3) return [];
    
    // Extract major turning points (simplified)
    const viaPoints = [];
    const pointCount = leg.points.length;
    const stepSize = Math.floor(pointCount / 3); // Get 3 via points
    
    for (let i = stepSize; i < pointCount - 1; i += stepSize) {
      const point = leg.points[i];
      if (point.name || point.street) {
        viaPoints.push(point.name || point.street);
      }
    }
    
    return viaPoints.slice(0, 2); // Maximum 2 via points
  }

  /**
   * Generate specific diversion for a route
   */
  async generateRouteDiversion(routeId, incident) {
    const diversion = {
      route: routeId,
      type: 'specific',
      alternatives: [],
      instructions: []
    };
    
    // Find parallel routes
    const parallelRoutes = this.findParallelRoutes(routeId, incident);
    if (parallelRoutes.length > 0) {
      diversion.alternatives.push(...parallelRoutes.map(r => ({
        route: r.route,
        similarity: r.similarity,
        reason: 'Serves similar areas'
      })));
    }
    
    // Find connecting routes at interchanges
    const connections = this.findInterchangeConnections(routeId, incident);
    connections.forEach(conn => {
      diversion.instructions.push({
        type: 'interchange',
        instruction: `At ${conn.interchange}, change to ${conn.routes.join(' or ')}`,
        priority: conn.priority
      });
    });
    
    // Generate natural language instructions
    if (diversion.alternatives.length > 0) {
      const primary = diversion.alternatives[0];
      diversion.instructions.push({
        type: 'primary',
        instruction: `Use ${primary.route} as alternative (${Math.round(primary.similarity * 100)}% route match)`,
        priority: 'high'
      });
    }
    
    return diversion.alternatives.length > 0 || diversion.instructions.length > 0 ? diversion : null;
  }

  /**
   * Find routes that serve similar stops (parallel routes)
   */
  findParallelRoutes(targetRoute, incident) {
    const parallels = [];
    const targetStops = this.routeStops.get(targetRoute) || [];
    
    if (targetStops.length === 0) {
      // Fallback to corridor-based matching
      const corridor = this.getRouteCorridor(targetRoute);
      if (corridor && ROUTE_CORRIDORS[corridor]) {
        return ROUTE_CORRIDORS[corridor].routes
          .filter(r => r !== targetRoute)
          .map(r => ({ route: r, similarity: 0.7 }));
      }
      return [];
    }
    
    // Find routes with overlapping stops
    this.routeStops.forEach((stops, route) => {
      if (route === targetRoute) return;
      
      const overlap = stops.filter(s => targetStops.includes(s)).length;
      const similarity = overlap / Math.max(stops.length, targetStops.length);
      
      if (similarity > 0.3) { // 30% stop overlap
        parallels.push({ route, similarity, overlap });
      }
    });
    
    return parallels.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }

  /**
   * Find interchange connections for diversions
   */
  findInterchangeConnections(routeId, incident) {
    const connections = [];
    
    Object.entries(KEY_INTERCHANGES).forEach(([name, data]) => {
      if (data.routes.includes(routeId)) {
        // This route serves this interchange
        const alternativeRoutes = data.routes.filter(r => 
          r !== routeId && !incident.affectsRoutes?.includes(r)
        );
        
        if (alternativeRoutes.length > 0) {
          connections.push({
            interchange: name,
            routes: alternativeRoutes.slice(0, 3),
            priority: this.getInterchangePriority(name, incident)
          });
        }
      }
    });
    
    return connections.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Find affected corridors based on incident
   */
  findAffectedCorridors(incident) {
    const corridors = [];
    
    if (!incident.affectsRoutes) return corridors;
    
    Object.entries(ROUTE_CORRIDORS).forEach(([corridor, data]) => {
      const affected = incident.affectsRoutes.filter(r => data.routes.includes(r));
      if (affected.length > 0) {
        corridors.push(corridor);
      }
    });
    
    return corridors;
  }

  /**
   * Find nearby interchanges based on coordinates
   */
  findNearbyInterchanges(coordinates) {
    if (!coordinates) return [];
    
    const lat = coordinates.latitude || coordinates[0];
    const lng = coordinates.longitude || coordinates[1];
    
    const interchangesWithDistance = Object.entries(KEY_INTERCHANGES).map(([name, data]) => {
      const distance = this.calculateDistance(lat, lng, data.coordinates[0], data.coordinates[1]);
      return { name, ...data, distance };
    });
    
    return interchangesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }

  /**
   * Get template-based advice for incident type
   */
  getTemplateAdvice(incident) {
    const advice = [];
    
    // Check for bridge incidents
    const bridges = ['Tyne Bridge', 'High Level', 'Redheugh', 'Swing Bridge'];
    const affectedBridge = bridges.find(b => 
      incident.location?.toLowerCase().includes(b.toLowerCase()) ||
      incident.description?.toLowerCase().includes(b.toLowerCase())
    );
    
    if (affectedBridge) {
      const alt = BRIDGE_ALTERNATIVES[affectedBridge];
      if (alt) {
        advice.push({
          type: 'bridge',
          advice: `${affectedBridge} affected. Use ${alt.alternatives.join(', ')}`,
          priority: 'high'
        });
      }
    }
    
    // Weather-related advice
    if (incident.type?.toLowerCase().includes('weather') || 
        incident.description?.toLowerCase().includes('snow') ||
        incident.description?.toLowerCase().includes('flood')) {
      advice.push({
        type: 'weather',
        advice: 'Check service updates. Rural routes may be suspended',
        priority: 'high'
      });
    }
    
    // City centre incidents
    if (incident.location?.toLowerCase().includes('city centre') ||
        incident.location?.toLowerCase().includes('monument') ||
        incident.location?.toLowerCase().includes('central station')) {
      advice.push({
        type: 'city_centre',
        advice: 'Consider Park & Ride services or Metro for city centre access',
        priority: 'medium'
      });
    }
    
    return advice;
  }

  /**
   * Assess incident severity for prioritization
   */
  assessIncidentSeverity(incident) {
    let score = 0;
    
    // Base severity
    if (incident.severity === 'High' || incident.priority === 'CRITICAL') score += 3;
    else if (incident.severity === 'Medium') score += 2;
    else score += 1;
    
    // Number of affected routes
    const routeCount = incident.affectsRoutes?.length || 0;
    if (routeCount > 5) score += 3;
    else if (routeCount > 2) score += 2;
    else if (routeCount > 0) score += 1;
    
    // Key location multiplier
    const keyLocations = ['city centre', 'central station', 'interchange', 'metro centre'];
    if (keyLocations.some(loc => incident.location?.toLowerCase().includes(loc))) {
      score += 2;
    }
    
    return score >= 6 ? 'critical' : score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low';
  }

  /**
   * Get route corridor
   */
  getRouteCorridor(routeId) {
    for (const [corridor, data] of Object.entries(ROUTE_CORRIDORS)) {
      if (data.routes.includes(routeId)) {
        return corridor;
      }
    }
    return null;
  }

  /**
   * Get interchange priority based on incident
   */
  getInterchangePriority(interchange, incident) {
    // Prioritize interchanges away from incident
    const keyLocations = ['Newcastle Central', 'Gateshead Interchange'];
    if (keyLocations.includes(interchange) && 
        !incident.location?.toLowerCase().includes(interchange.toLowerCase())) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Calculate distance between coordinates (km)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Format diversions for display
   */
  formatDiversionsForDisplay(suggestions) {
    const formatted = {
      summary: `Found ${suggestions.diversions.length} route diversions and ${suggestions.generalAdvice.length} general recommendations`,
      priority: suggestions.severity,
      diversions: suggestions.diversions.map(d => ({
        route: d.route,
        primaryAlternative: d.alternatives[0]?.route || 'None',
        instructions: d.instructions.map(i => i.instruction).join('. ')
      })),
      keyAdvice: suggestions.generalAdvice
        .filter(a => a.priority === 'high')
        .map(a => a.advice),
      interchanges: suggestions.interchanges.map(i => ({
        name: i.name,
        distance: `${i.distance.toFixed(1)}km`,
        availableRoutes: i.routes.slice(0, 5).join(', ')
      })),
      tomtomRoutes: suggestions.tomtomRoutes?.map(route => ({
        type: route.type,
        summary: route.summary,
        duration: `${route.duration} mins`,
        distance: `${route.distance} km`,
        trafficDelay: route.trafficDelay > 0 ? `+${route.trafficDelay} mins delay` : 'No delays',
        via: route.viaPoints?.join(' → ') || 'Direct route',
        confidence: route.confidence === 'live' ? 'Live traffic data' : 'Estimated'
      })) || []
    };
    
    return formatted;
  }
}

// Singleton instance
const diversionEngine = new IntelligentDiversionEngine();

export default diversionEngine;
