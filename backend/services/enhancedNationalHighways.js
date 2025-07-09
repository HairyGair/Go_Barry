// services/enhancedNationalHighways.js
// Enhanced National Highways Integration with Advanced Incident Classification
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { findAffectedRoutesEnhanced } from '../utils/gtfsRouteMatching.js';
import { getEnhancedLocationWithFallbacks } from '../utils/productionLocation.js';

// Enhanced incident classification
const INCIDENT_CLASSIFICATIONS = {
  // Critical incidents requiring immediate attention
  CRITICAL: {
    keywords: ['closure', 'closed', 'blocked', 'serious accident', 'collision', 'overturned', 'jackknifed'],
    severity: 'High',
    status: 'red',
    priority: 1
  },
  
  // High impact incidents
  HIGH: {
    keywords: ['accident', 'incident', 'breakdown', 'emergency', 'rescue', 'fire', 'police'],
    severity: 'High', 
    status: 'red',
    priority: 2
  },
  
  // Medium impact incidents
  MEDIUM: {
    keywords: ['obstruction', 'debris', 'spillage', 'congestion', 'slow traffic', 'delays'],
    severity: 'Medium',
    status: 'amber',
    priority: 3
  },
  
  // Roadworks and planned works
  ROADWORKS: {
    keywords: ['roadworks', 'maintenance', 'resurfacing', 'construction', 'works', 'lane closure'],
    severity: 'Medium',
    status: 'amber',
    priority: 4
  },
  
  // Weather-related incidents
  WEATHER: {
    keywords: ['weather', 'snow', 'ice', 'fog', 'wind', 'flooding', 'rain'],
    severity: 'Medium',
    status: 'amber',
    priority: 3
  },
  
  // Low priority incidents
  LOW: {
    keywords: ['cleared', 'normal', 'reopened', 'information'],
    severity: 'Low',
    status: 'green',
    priority: 5
  }
};

// Strategic road priorities for Go North East
const STRATEGIC_ROAD_PRIORITIES = {
  'A1': { priority: 'critical', routes: ['21', 'X21', '25', '28', '28B', 'X25'] },
  'A1(M)': { priority: 'critical', routes: ['21', 'X21', '25', '28', '28B'] },
  'A19': { priority: 'critical', routes: ['1', '2', '307', '309', '317', '56', '9'] },
  'A167': { priority: 'high', routes: ['21', '22', 'X21', '6', '50'] },
  'A184': { priority: 'high', routes: ['1', '2', '307', '309', '327'] },
  'A1058': { priority: 'high', routes: ['1', '2', '307', '309', '311'] },
  'A690': { priority: 'medium', routes: ['20', '21', '22', '50'] },
  'A693': { priority: 'medium', routes: ['X30', 'X31', '74', '84'] },
  'A696': { priority: 'medium', routes: ['74', '43', '44'] },
  'M1': { priority: 'high', routes: ['21', 'X21', '25'] },
  'M62': { priority: 'low', routes: ['10', '10A', '10B'] },
  'A66': { priority: 'low', routes: ['X9', 'X10'] },
  'A69': { priority: 'medium', routes: ['X84', 'X85'] }
};

export class EnhancedNationalHighwaysProcessor {
  constructor() {
    this.baseUrl = 'https://m.highwaysengland.co.uk/feeds/rss/AllEvents.xml';
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch and process National Highways incidents with enhanced classification
   */
  async fetchEnhancedIncidents() {
    console.log('🛣️ Fetching enhanced National Highways incidents...');
    
    try {
      // Get raw RSS data
      const rawData = await this.fetchRSSData();
      
      // Parse and classify incidents
      const incidents = await this.parseAndClassifyIncidents(rawData);
      
      // Filter for Go North East operational area
      const filteredIncidents = this.filterByOperationalArea(incidents);
      
      // Enhance with route matching and location data
      const enhancedIncidents = await this.enhanceIncidents(filteredIncidents);
      
      // Sort by priority
      const sortedIncidents = this.sortByPriority(enhancedIncidents);
      
      console.log(`✅ National Highways: ${sortedIncidents.length} enhanced incidents processed`);
      
      return {
        success: true,
        data: sortedIncidents,
        metadata: {
          totalIncidents: sortedIncidents.length,
          critical: sortedIncidents.filter(i => i.classification === 'CRITICAL').length,
          high: sortedIncidents.filter(i => i.classification === 'HIGH').length,
          medium: sortedIncidents.filter(i => i.classification === 'MEDIUM').length,
          roadworks: sortedIncidents.filter(i => i.classification === 'ROADWORKS').length,
          lastUpdated: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('❌ Enhanced National Highways fetch failed:', error.message);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch RSS data with caching
   */
  async fetchRSSData() {
    const cacheKey = 'nh-rss-data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('📦 Using cached National Highways data');
      return cached.data;
    }
    
    console.log('🚀 Fetching National Highways RSS feed...');
    
    const response = await axios.get(this.baseUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-NationalHighways/1.0'
      }
    });
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    return response.data;
  }

  /**
   * Parse RSS XML and classify incidents
   */
  async parseAndClassifyIncidents(xmlData) {
    const parsedData = await parseStringPromise(xmlData);
    const items = parsedData.rss?.channel?.[0]?.item || [];
    
    console.log(`📋 Parsing ${items.length} National Highways incidents...`);
    
    const incidents = [];
    
    for (const item of items) {
      try {
        const incident = this.parseIncidentItem(item);
        if (incident) {
          incidents.push(incident);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse incident:', error.message);
      }
    }
    
    return incidents;
  }

  /**
   * Parse individual incident item
   */
  parseIncidentItem(item) {
    const title = item.title?.[0] || '';
    const description = item.description?.[0] || '';
    const pubDate = item.pubDate?.[0] || '';
    const guid = item.guid?.[0]?._ || item.guid?.[0] || '';
    
    // Extract location and road information
    const locationInfo = this.extractLocationInfo(title, description);
    if (!locationInfo) return null;
    
    // Classify incident based on content
    const classification = this.classifyIncident(title, description);
    
    // Extract coordinates if available
    const coordinates = this.extractCoordinates(description);
    
    return {
      id: `nh_${this.generateId(guid, title)}`,
      title: title.trim(),
      description: description.trim(),
      location: locationInfo.location,
      roadName: locationInfo.roadName,
      coordinates: coordinates,
      classification: classification.type,
      severity: classification.severity,
      status: classification.status,
      priority: classification.priority,
      pubDate: pubDate,
      source: 'national_highways',
      type: this.mapClassificationToType(classification.type),
      lastUpdated: new Date().toISOString(),
      startDate: this.parseDate(pubDate)
    };
  }

  /**
   * Extract location and road information from incident text
   */
  extractLocationInfo(title, description) {
    const fullText = `${title} ${description}`.toUpperCase();
    
    // Extract road name
    const roadMatch = fullText.match(/\b(M\d+|A\d+(?:\([M]\))?|B\d+)\b/);
    if (!roadMatch) return null;
    
    const roadName = roadMatch[0];
    
    // Extract more detailed location
    const locationPatterns = [
      /BETWEEN\s+([^,]+)\s+AND\s+([^,]+)/i,
      /AT\s+([^,]+)/i,
      /NEAR\s+([^,]+)/i,
      /JUNCTION\s+(\d+[A-Z]?)/i,
      /J(\d+[A-Z]?)/i
    ];
    
    let location = roadName;
    for (const pattern of locationPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        location = `${roadName} ${match[1]}${match[2] ? ' to ' + match[2] : ''}`;
        break;
      }
    }
    
    return {
      roadName: roadName,
      location: location.trim()
    };
  }

  /**
   * Classify incident based on content analysis
   */
  classifyIncident(title, description) {
    const fullText = `${title} ${description}`.toLowerCase();
    
    // Check each classification in priority order
    for (const [type, config] of Object.entries(INCIDENT_CLASSIFICATIONS)) {
      for (const keyword of config.keywords) {
        if (fullText.includes(keyword)) {
          return {
            type: type,
            severity: config.severity,
            status: config.status,
            priority: config.priority
          };
        }
      }
    }
    
    // Default classification
    return {
      type: 'MEDIUM',
      severity: 'Medium',
      status: 'amber',
      priority: 3
    };
  }

  /**
   * Extract coordinates from description if available
   */
  extractCoordinates(description) {
    // National Highways sometimes includes coordinates in descriptions
    const coordPattern = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = description.match(coordPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinates are in UK
      if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
        return [lat, lng];
      }
    }
    
    return null;
  }

  /**
   * Generate unique ID for incident
   */
  generateId(guid, title) {
    if (guid) {
      return guid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    }
    
    return title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16) + '_' + Date.now();
  }

  /**
   * Map classification to alert type
   */
  mapClassificationToType(classification) {
    switch (classification) {
      case 'CRITICAL':
      case 'HIGH':
        return 'incident';
      case 'ROADWORKS':
        return 'roadwork';
      case 'WEATHER':
        return 'incident';
      default:
        return 'incident';
    }
  }

  /**
   * Parse date from RSS pubDate
   */
  parseDate(pubDate) {
    try {
      return new Date(pubDate).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  /**
   * Filter incidents by Go North East operational area
   */
  filterByOperationalArea(incidents) {
    return incidents.filter(incident => {
      const roadName = incident.roadName;
      
      // Check if road is in our strategic road priorities
      const roadPriority = STRATEGIC_ROAD_PRIORITIES[roadName];
      if (roadPriority) {
        incident.roadPriority = roadPriority.priority;
        incident.potentialRoutes = roadPriority.routes;
        return true;
      }
      
      // Check if location mentions areas within our operational zone
      const location = incident.location.toLowerCase();
      const operationalAreas = [
        'newcastle', 'gateshead', 'sunderland', 'durham', 'consett',
        'stanley', 'washington', 'hebburn', 'jarrow', 'south shields',
        'whitley bay', 'cramlington', 'blyth', 'ashington', 'morpeth'
      ];
      
      return operationalAreas.some(area => location.includes(area));
    });
  }

  /**
   * Enhance incidents with route matching and location data
   */
  async enhanceIncidents(incidents) {
    console.log(`🔍 Enhancing ${incidents.length} incidents with route matching...`);
    
    const enhanced = [];
    
    for (const incident of incidents) {
      try {
        // Get precise coordinates if not available
        if (!incident.coordinates) {
          incident.coordinates = await this.geocodeLocation(incident.location);
        }
        
        // Match to affected routes
        if (incident.coordinates) {
          const [lat, lng] = incident.coordinates;
          const affectedRoutes = await findAffectedRoutesEnhanced(
            lat, lng, incident.location, 500
          );
          
          incident.affectsRoutes = affectedRoutes.length > 0 
            ? affectedRoutes 
            : incident.potentialRoutes || [];
        } else {
          incident.affectsRoutes = incident.potentialRoutes || [];
        }
        
        // Calculate impact score
        incident.impactScore = this.calculateImpactScore(incident);
        
        enhanced.push(incident);
        
      } catch (error) {
        console.warn(`⚠️ Failed to enhance incident ${incident.id}:`, error.message);
        // Add incident without enhancement
        incident.affectsRoutes = incident.potentialRoutes || [];
        incident.impactScore = 50; // Default score
        enhanced.push(incident);
      }
    }
    
    return enhanced;
  }

  /**
   * Geocode location if coordinates not available
   */
  async geocodeLocation(location) {
    try {
      // Use a basic geocoding approach for UK locations
      // This is a simplified version - you might want to use a proper geocoding service
      const ukCenters = {
        'A1': [54.9, -1.6],
        'A19': [54.9, -1.4],
        'A167': [54.85, -1.55],
        'M1': [54.8, -1.5]
      };
      
      for (const [road, coords] of Object.entries(ukCenters)) {
        if (location.includes(road)) {
          return coords;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Geocoding failed:', error.message);
      return null;
    }
  }

  /**
   * Calculate impact score for incident
   */
  calculateImpactScore(incident) {
    let score = 0;
    
    // Priority weight
    score += (6 - incident.priority) * 20;
    
    // Road priority weight
    const roadPriorityScores = {
      'critical': 30,
      'high': 20,
      'medium': 10,
      'low': 5
    };
    score += roadPriorityScores[incident.roadPriority] || 0;
    
    // Route count weight
    score += (incident.affectsRoutes?.length || 0) * 2;
    
    // Classification weight
    const classificationScores = {
      'CRITICAL': 25,
      'HIGH': 20,
      'MEDIUM': 15,
      'ROADWORKS': 10,
      'WEATHER': 12,
      'LOW': 5
    };
    score += classificationScores[incident.classification] || 0;
    
    return Math.min(100, score);
  }

  /**
   * Sort incidents by priority and impact
   */
  sortByPriority(incidents) {
    return incidents.sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Then by impact score
      return (b.impactScore || 0) - (a.impactScore || 0);
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ National Highways cache cleared');
  }
}

// Export singleton instance
export const nhProcessor = new EnhancedNationalHighwaysProcessor();
export default nhProcessor;