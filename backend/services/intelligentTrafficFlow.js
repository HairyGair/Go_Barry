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
    
    // Debug API key
    console.log('🔑 TomTom Flow API Key:', this.apiKey ? 'Present' : 'Missing');
    if (!this.apiKey) {
      console.warn('⚠️ TomTom API key is not configured for traffic flow analysis');
    }
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
      // Define monitoring points across the network
      const monitoringPoints = this.getNetworkMonitoringPoints();
      
      // Fetch flow data for each monitoring point
      const flowData = await this.fetchFlowDataForPoints(monitoringPoints);
      
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
   * Get network monitoring points for traffic flow analysis
   */
  getNetworkMonitoringPoints() {
    return [
      // Major Newcastle corridors
      { name: 'A167 Central Motorway North', lat: 55.0021, lng: -1.6058, routes: ['Q3', '21', '22'] },
      { name: 'A167 Central Motorway South', lat: 54.9456, lng: -1.6098, routes: ['21', '22', 'X21'] },
      { name: 'A1058 Coast Road East', lat: 55.0089, lng: -1.4892, routes: ['1', '307', '309'] },
      { name: 'A1058 Coast Road West', lat: 54.9945, lng: -1.5678, routes: ['1', '307', '309'] },
      
      // Gateshead key points
      { name: 'A184 Felling Bypass', lat: 54.9456, lng: -1.5678, routes: ['27', '28', '56'] },
      { name: 'A167 Durham Road', lat: 54.9234, lng: -1.5896, routes: ['21', '25', '28'] },
      
      // A19 corridor
      { name: 'A19 Tyne Tunnel', lat: 54.9889, lng: -1.4567, routes: ['9', '10', '11'] },
      { name: 'A19 Testos Roundabout', lat: 54.9798, lng: -1.5234, routes: ['1', '35', '36'] },
      { name: 'A19 Silverlink', lat: 55.0234, lng: -1.4678, routes: ['307', '309', '311'] },
      
      // Sunderland approaches
      { name: 'A690 Durham Road', lat: 54.8867, lng: -1.4234, routes: ['61', '62', '63'] },
      { name: 'A183 Chester Road', lat: 54.8945, lng: -1.3876, routes: ['35', '36', '61'] },
      
      // A1 Western Bypass
      { name: 'A1 Kingston Park', lat: 55.0123, lng: -1.6789, routes: ['43', '44', '45'] },
      { name: 'A1 MetroCentre', lat: 54.9567, lng: -1.6543, routes: ['6', '7', '10'] },
      
      // City centres
      { name: 'Newcastle City Centre', lat: 54.9734, lng: -1.6139, routes: ['Q3', '10', '21', '22'] },
      { name: 'Gateshead Town Centre', lat: 54.9629, lng: -1.6026, routes: ['53', '54', 'Q3'] },
      { name: 'Sunderland City Centre', lat: 54.9069, lng: -1.3838, routes: ['16', '20', '61', '62'] }
    ];
  }

  /**
   * Fetch flow data for multiple monitoring points
   */
  async fetchFlowDataForPoints(monitoringPoints) {
    console.log(`🚀 Fetching TomTom flow data for ${monitoringPoints.length} monitoring points...`);
    
    const flowSegments = [];
    const batchSize = 5; // Process 5 points at a time to avoid rate limiting
    
    for (let i = 0; i < monitoringPoints.length; i += batchSize) {
      const batch = monitoringPoints.slice(i, i + batchSize);
      const batchPromises = batch.map(point => this.fetchFlowForPoint(point));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const point = batch[j];
        
        if (result.status === 'fulfilled' && result.value) {
          flowSegments.push({
            ...result.value,
            monitoringPoint: point
          });
        }
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < monitoringPoints.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`📊 Retrieved ${flowSegments.length} flow segments from ${monitoringPoints.length} points`);
    return flowSegments;
  }

  /**
   * Fetch flow data for a single point
   */
  async fetchFlowForPoint(point) {
    const url = `${this.baseUrl}/flowSegmentData/relative/10/json`;
    
    try {
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          point: `${point.lat},${point.lng}`,
          unit: 'KMPH',
          openLr: false
        },
        timeout: 5000
      });
      
      const flowData = response.data.flowSegmentData;
      if (flowData) {
        // Add point information to the flow data
        return {
          ...flowData,
          pointName: point.name,
          pointRoutes: point.routes,
          coordinates: [point.lat, point.lng]
        };
      }
      return null;
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.warn(`⚠️ Invalid coordinates for ${point.name}: ${point.lat},${point.lng}`);
      } else if (error.response?.status !== 403) {
        console.warn(`⚠️ Flow data error for ${point.name}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Process flow segments to identify congestion patterns
   */
  async processCongestionSegments(flowSegments) {
    const congestionAlerts = [];
    
    console.log(`🔍 Analyzing ${flowSegments.length} flow segments for congestion...`);

    for (const [index, segment] of flowSegments.entries()) {
      try {
        // Use coordinates from monitoring point
        const coordinates = segment.coordinates || this.extractSegmentCoordinates(segment);
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
        
        // Use monitoring point routes if available, otherwise match routes
        const affectedRoutes = segment.pointRoutes || await this.matchRoutesToSegment(lat, lng, locationInfo);
        
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
      // Use monitoring point name if available
      if (segment.pointName) {
        return {
          enhancedLocation: segment.pointName,
          roadName: this.extractRoadNameFromLocation(segment.pointName) || segment.roadName,
          functionalRoadClass: segment.frc || 'unknown'
        };
      }
      
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
        enhancedLocation: segment.pointName || `Traffic at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
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