// services/intelligentTrafficFlow.js
// Enhanced Traffic Flow Analysis for TomTom Red Congestion Sections
import axios from 'axios';
import { findAffectedRoutesEnhanced } from '../utils/gtfsRouteMatching.js';
import { getEnhancedLocationWithFallbacks } from '../utils/productionLocation.js';

const CONGESTION_THRESHOLDS = {
  SEVERE: { speedReduction: 70, jamFactor: 8, alertLevel: 'red' },
  MAJOR: { speedReduction: 50, jamFactor: 6, alertLevel: 'red' },
  MODERATE: { speedReduction: 30, jamFactor: 4, alertLevel: 'amber' },
  MINOR: { speedReduction: 15, jamFactor: 2, alertLevel: 'green' }
};

const CRITICAL_ROADS = {
  // A-roads with high bus traffic
  'A1': { routes: ['21', 'X21', '25', '28', '28B'], priority: 'critical' },
  'A19': { routes: ['1', '2', '307', '309', '317', '56', '9'], priority: 'critical' },
  'A167': { routes: ['21', '22', 'X21', '6', '50'], priority: 'high' },
  'A184': { routes: ['1', '2', '307', '309', '327'], priority: 'high' },
  'A1058': { routes: ['1', '2', '307', '309', '311'], priority: 'high' },
  'A693': { routes: ['X30', 'X31', '74', '84'], priority: 'medium' },
  'A696': { routes: ['74', '43', '44'], priority: 'medium' }
};

// TomTom Flow API Integration
export class IntelligentTrafficFlowAnalyzer {
  constructor() {
    this.apiKey = process.env.TOMTOM_API_KEY;
    this.baseUrl = 'https://api.tomtom.com/traffic/services/4';
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute cache
  }

  /**
   * Analyze traffic flow for specific route segments
   * This finds the "red" congestion sections that TomTom displays
   */
  async analyzeTrafficFlow(boundingBox = '-1.8,54.8,-1.4,55.1') {
    if (!this.apiKey) {
      throw new Error('TomTom API key not configured');
    }

    console.log('🚦 Analyzing TomTom traffic flow for red congestion sections...');
    
    try {
      // Get flow segment data for the entire area
      const flowData = await this.fetchFlowSegmentData(boundingBox);
      
      // Analyze each flow segment for congestion
      const congestionAlerts = await this.processCongestionSegments(flowData);
      
      // Filter for significant congestion only
      const significantCongestion = congestionAlerts.filter(alert => 
        alert.congestionLevel >= CONGESTION_THRESHOLDS.MODERATE.speedReduction
      );

      console.log(`✅ Found ${significantCongestion.length} congestion alerts from ${flowData.length} flow segments`);
      
      return {
        success: true,
        data: significantCongestion,
        metadata: {
          totalSegments: flowData.length,
          congestionAlerts: significantCongestion.length,
          severeCongestion: significantCongestion.filter(a => a.status === 'red').length,
          lastUpdated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Traffic flow analysis failed:', error.message);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Fetch flow segment data from TomTom Flow API
   */
  async fetchFlowSegmentData(boundingBox) {
    const cacheKey = `flow-${boundingBox}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('📦 Using cached flow data');
      return cached.data;
    }

    console.log('🚀 Fetching TomTom flow segment data...');
    
    const response = await axios.get(
      `${this.baseUrl}/flowSegmentData/absolute/10/json`,
      {
        params: {
          key: this.apiKey,
          bbox: boundingBox,
          unit: 'KMPH'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'BARRY-FlowAnalyzer/1.0'
        }
      }
    );

    const flowSegments = response.data.flowSegmentData || [];
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: flowSegments,
      timestamp: Date.now()
    });

    console.log(`📊 Retrieved ${flowSegments.length} traffic flow segments`);
    return flowSegments;
  }

  /**
   * Process flow segments to identify congestion patterns
   */
  async processCongestionSegments(flowSegments) {
    const congestionAlerts = [];
    
    console.log(`🔍 Analyzing ${flowSegments.length} flow segments for congestion...`);

    for (const [index, segment] of flowSegments.entries()) {
      try {
        // Extract coordinates from segment
        const coordinates = this.extractSegmentCoordinates(segment);
        if (!coordinates) continue;

        const [lat, lng] = coordinates;

        // Calculate congestion metrics
        const congestionMetrics = this.calculateCongestionMetrics(segment);
        
        // Only process significant congestion
        if (congestionMetrics.speedReduction < CONGESTION_THRESHOLDS.MINOR.speedReduction) {
          continue;
        }

        // Enhance location information
        const locationInfo = await this.enhanceSegmentLocation(lat, lng, segment);
        
        // Match to affected bus routes
        const affectedRoutes = await this.matchRoutesToSegment(lat, lng, locationInfo);
        
        // Determine congestion severity
        const severity = this.determineCongestionSeverity(congestionMetrics);
        
        // Create congestion alert
        const alert = {
          id: `tomtom_flow_${segment.frc || index}_${Date.now()}`,
          type: 'congestion',
          title: `Traffic Congestion - ${locationInfo.roadName || 'Road'}`,
          description: this.generateCongestionDescription(congestionMetrics, locationInfo),
          location: locationInfo.enhancedLocation,
          coordinates: [lat, lng],
          severity: severity.severity,
          status: severity.status,
          source: 'tomtom_flow',
          
          // Traffic flow specific data
          congestionLevel: congestionMetrics.speedReduction,
          currentSpeed: congestionMetrics.currentSpeed,
          freeFlowSpeed: congestionMetrics.freeFlowSpeed,
          delayMinutes: congestionMetrics.estimatedDelay,
          confidence: congestionMetrics.confidence,
          
          // Route impact
          affectsRoutes: affectedRoutes,
          roadPriority: this.getRoadPriority(locationInfo.roadName),
          
          // TomTom specific data
          flowSegmentId: segment.frc,
          roadClosure: segment.roadClosure || false,
          confidenceLevel: segment.confidence,
          
          lastUpdated: new Date().toISOString(),
          startDate: new Date().toISOString()
        };

        congestionAlerts.push(alert);

        console.log(`🚨 Congestion detected: ${locationInfo.roadName || 'Unknown road'} - ${congestionMetrics.speedReduction}% speed reduction`);

      } catch (error) {
        console.warn(`⚠️ Failed to process flow segment ${index}:`, error.message);
      }
    }

    return congestionAlerts;
  }

  /**
   * Extract coordinates from TomTom flow segment
   */
  extractSegmentCoordinates(segment) {
    try {
      if (segment.coordinates && segment.coordinates.coordinate) {
        const coords = segment.coordinates.coordinate;
        if (Array.isArray(coords) && coords.length > 0) {
          // Use the first coordinate point
          return [coords[0].latitude, coords[0].longitude];
        }
      }
      
      // Fallback to other possible coordinate formats
      if (segment.coordinates && segment.coordinates.latitude && segment.coordinates.longitude) {
        return [segment.coordinates.latitude, segment.coordinates.longitude];
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Could not extract coordinates from segment:', error.message);
      return null;
    }
  }

  /**
   * Calculate congestion metrics from flow segment
   */
  calculateCongestionMetrics(segment) {
    const currentSpeed = segment.currentSpeed || 0;
    const freeFlowSpeed = segment.freeFlowSpeed || 60; // Default to 60 KMPH
    const confidence = segment.confidence || 0.5;
    
    const speedReduction = freeFlowSpeed > 0 
      ? ((freeFlowSpeed - currentSpeed) / freeFlowSpeed) * 100 
      : 0;
    
    // Estimate delay per kilometer
    const estimatedDelay = this.calculateDelayPerKm(currentSpeed, freeFlowSpeed);
    
    return {
      currentSpeed: Math.round(currentSpeed),
      freeFlowSpeed: Math.round(freeFlowSpeed),
      speedReduction: Math.round(speedReduction),
      estimatedDelay: Math.round(estimatedDelay),
      confidence: confidence
    };
  }

  /**
   * Calculate estimated delay per kilometer
   */
  calculateDelayPerKm(currentSpeed, freeFlowSpeed) {
    if (currentSpeed <= 0 || freeFlowSpeed <= 0) return 0;
    
    const normalTimeMinutes = (1 / freeFlowSpeed) * 60; // minutes per km
    const actualTimeMinutes = (1 / currentSpeed) * 60; // minutes per km
    
    return Math.max(0, actualTimeMinutes - normalTimeMinutes);
  }

  /**
   * Enhance location information for traffic segment
   */
  async enhanceSegmentLocation(lat, lng, segment) {
    try {
      // Get enhanced location with fallbacks
      const enhancedLocation = await getEnhancedLocationWithFallbacks(
        lat, lng, 
        segment.roadName || 'Traffic segment',
        'TomTom Flow'
      );
      
      return {
        enhancedLocation: enhancedLocation || `Traffic at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        roadName: segment.roadName || this.extractRoadNameFromLocation(enhancedLocation),
        functionalRoadClass: segment.frc || 'unknown'
      };
    } catch (error) {
      console.warn('⚠️ Location enhancement failed:', error.message);
      return {
        enhancedLocation: `Traffic at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        roadName: segment.roadName || 'Unknown road',
        functionalRoadClass: segment.frc || 'unknown'
      };
    }
  }

  /**
   * Extract road name from enhanced location
   */
  extractRoadNameFromLocation(location) {
    if (!location) return null;
    
    const roadPatterns = [
      /A\d+/i, // A-roads
      /M\d+/i, // Motorways
      /B\d+/i, // B-roads
      /(\w+\s+Road)/i, // Named roads
      /(\w+\s+Street)/i, // Streets
      /(\w+\s+Avenue)/i // Avenues
    ];
    
    for (const pattern of roadPatterns) {
      const match = location.match(pattern);
      if (match) return match[0];
    }
    
    return null;
  }

  /**
   * Match traffic segment to affected bus routes
   */
  async matchRoutesToSegment(lat, lng, locationInfo) {
    try {
      // Use GTFS enhanced route matching
      const routes = await findAffectedRoutesEnhanced(
        lat, lng, 
        locationInfo.enhancedLocation, 
        300 // 300m radius
      );
      
      // If no GTFS routes found, try road-based matching
      if (routes.length === 0 && locationInfo.roadName) {
        const roadRoutes = this.matchRoutesByRoadName(locationInfo.roadName);
        return roadRoutes;
      }
      
      return routes;
    } catch (error) {
      console.warn('⚠️ Route matching failed:', error.message);
      return [];
    }
  }

  /**
   * Match routes by road name
   */
  matchRoutesByRoadName(roadName) {
    if (!roadName) return [];
    
    const roadUpper = roadName.toUpperCase();
    
    for (const [road, data] of Object.entries(CRITICAL_ROADS)) {
      if (roadUpper.includes(road)) {
        return data.routes;
      }
    }
    
    return [];
  }

  /**
   * Determine congestion severity based on metrics
   */
  determineCongestionSeverity(metrics) {
    const { speedReduction } = metrics;
    
    if (speedReduction >= CONGESTION_THRESHOLDS.SEVERE.speedReduction) {
      return { severity: 'High', status: 'red' };
    } else if (speedReduction >= CONGESTION_THRESHOLDS.MAJOR.speedReduction) {
      return { severity: 'High', status: 'red' };
    } else if (speedReduction >= CONGESTION_THRESHOLDS.MODERATE.speedReduction) {
      return { severity: 'Medium', status: 'amber' };
    } else {
      return { severity: 'Low', status: 'green' };
    }
  }

  /**
   * Generate congestion description
   */
  generateCongestionDescription(metrics, locationInfo) {
    const { currentSpeed, freeFlowSpeed, speedReduction, estimatedDelay } = metrics;
    
    let description = `Traffic moving at ${currentSpeed} km/h (normal: ${freeFlowSpeed} km/h)`;
    
    if (speedReduction > 50) {
      description += ". Severe congestion - expect significant delays";
    } else if (speedReduction > 30) {
      description += ". Heavy traffic - delays likely";
    } else {
      description += ". Moderate traffic - minor delays expected";
    }
    
    if (estimatedDelay > 0) {
      description += `. Estimated delay: ${estimatedDelay} min/km`;
    }
    
    return description;
  }

  /**
   * Get road priority for bus operations
   */
  getRoadPriority(roadName) {
    if (!roadName) return 'low';
    
    const roadUpper = roadName.toUpperCase();
    
    for (const [road, data] of Object.entries(CRITICAL_ROADS)) {
      if (roadUpper.includes(road)) {
        return data.priority;
      }
    }
    
    return 'low';
  }

  /**
   * Clear cache (for testing/debugging)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Traffic flow cache cleared');
  }
}

// Export singleton instance
export const trafficFlowAnalyzer = new IntelligentTrafficFlowAnalyzer();
export default trafficFlowAnalyzer;