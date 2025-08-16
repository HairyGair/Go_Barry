// backend/services/intelligentAnalytics.js
// Advanced analytics and predictive modeling for Go BARRY operations

import { createClient } from '@supabase/supabase-js';
import { enhancedFindRoutesNearCoordinates } from '../enhanced-gtfs-route-matcher.js';
import unifiedRoadworksManager from './unifiedRoadworksManager.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Intelligent Analytics Engine
 * Provides predictive insights and impact analysis for transportation operations
 */
class IntelligentAnalytics {
  constructor() {
    this.routeNetworkCache = new Map();
    this.disruptionPatterns = new Map();
    this.historicalData = new Map();
    this.lastAnalysisUpdate = null;
  }

  /**
   * ROUTE IMPACT ANALYSIS
   * Analyzes how roadworks affect specific bus routes
   */
  async analyzeRouteImpact(options = {}) {
    try {
      console.log('🧠 Starting route impact analysis...');
      
      const {
        includeHistorical = true,
        radiusMeters = 500,
        timeHorizon = '30d'
      } = options;

      // Get all active roadworks
      const roadworksResult = await unifiedRoadworksManager.getAllRoadworks();
      if (!roadworksResult.success) {
        throw new Error('Failed to fetch roadworks data');
      }

      const analysis = {
        timestamp: new Date().toISOString(),
        totalRoadworks: roadworksResult.combined.length,
        routeImpacts: [],
        severityDistribution: {},
        geographicHotspots: [],
        predictedDisruptions: [],
        recommendations: []
      };

      // Analyze each roadwork's route impact
      for (const roadwork of roadworksResult.combined) {
        const impact = await this.analyzeIndividualRoadworkImpact(roadwork, radiusMeters);
        if (impact.affectedRoutes.length > 0) {
          analysis.routeImpacts.push(impact);
        }
      }

      // Calculate severity distribution
      analysis.severityDistribution = this.calculateSeverityDistribution(analysis.routeImpacts);

      // Identify geographic hotspots
      analysis.geographicHotspots = this.identifyGeographicHotspots(analysis.routeImpacts);

      // Generate predictive disruptions
      analysis.predictedDisruptions = await this.generateDisruptionPredictions(analysis.routeImpacts);

      // Generate recommendations
      analysis.recommendations = this.generateIntelligentRecommendations(analysis);

      console.log(`✅ Route impact analysis complete: ${analysis.routeImpacts.length} impacts identified`);
      
      return {
        success: true,
        analysis
      };

    } catch (error) {
      console.error('❌ Route impact analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze impact of individual roadwork on routes
   */
  async analyzeIndividualRoadworkImpact(roadwork, radiusMeters = 500) {
    const impact = {
      roadworkId: roadwork.id,
      title: roadwork.title,
      location: roadwork.location,
      coordinates: roadwork.coordinates,
      source: roadwork.source,
      affectedRoutes: [],
      impactScore: 0,
      severityLevel: 'LOW',
      estimatedDelay: 0,
      alternativeRoutes: [],
      passengerImpact: 0
    };

    // Skip if no coordinates
    if (!roadwork.coordinates) {
      return impact;
    }

    try {
      // Find routes near roadwork location
      let lat, lng;
      if (Array.isArray(roadwork.coordinates)) {
        [lat, lng] = roadwork.coordinates;
      } else if (roadwork.coordinates.lat && roadwork.coordinates.lng) {
        lat = roadwork.coordinates.lat;
        lng = roadwork.coordinates.lng;
      } else if (roadwork.coordinates.latitude && roadwork.coordinates.longitude) {
        lat = roadwork.coordinates.latitude;
        lng = roadwork.coordinates.longitude;
      } else {
        return impact;
      }

      // Get affected routes using enhanced GTFS
      const nearbyRoutes = enhancedFindRoutesNearCoordinates(lat, lng, radiusMeters);
      
      if (nearbyRoutes && nearbyRoutes.length > 0) {
        // Analyze each affected route
        for (const routeId of nearbyRoutes) {
          const routeAnalysis = await this.analyzeRouteSpecificImpact(routeId, roadwork, lat, lng);
          impact.affectedRoutes.push(routeAnalysis);
        }

        // Calculate overall impact metrics
        impact.impactScore = this.calculateImpactScore(impact.affectedRoutes, roadwork);
        impact.severityLevel = this.determineSeverityLevel(impact.impactScore);
        impact.estimatedDelay = this.estimateDelay(impact.affectedRoutes, roadwork);
        impact.passengerImpact = this.estimatePassengerImpact(impact.affectedRoutes);
        impact.alternativeRoutes = this.findAlternativeRoutes(impact.affectedRoutes, lat, lng);
      }

    } catch (error) {
      console.warn(`⚠️ Error analyzing roadwork ${roadwork.id}:`, error.message);
    }

    return impact;
  }

  /**
   * Analyze route-specific impact details
   */
  async analyzeRouteSpecificImpact(routeId, roadwork, lat, lng) {
    return {
      routeId,
      routeName: this.getRouteDisplayName(routeId),
      frequency: await this.getRouteFrequency(routeId),
      passengerLoad: await this.getRoutePassengerLoad(routeId),
      impactType: this.determineImpactType(roadwork),
      estimatedDelay: this.calculateRouteDelay(routeId, roadwork),
      alternativeOptions: this.findRouteAlternatives(routeId, lat, lng),
      riskLevel: this.assessRouteRisk(routeId, roadwork)
    };
  }

  /**
   * Calculate overall impact score (0-100)
   */
  calculateImpactScore(affectedRoutes, roadwork) {
    if (affectedRoutes.length === 0) return 0;

    let score = 0;
    
    // Base score from number of affected routes
    score += Math.min(affectedRoutes.length * 10, 40);
    
    // Add score based on route frequency
    const totalFrequency = affectedRoutes.reduce((sum, route) => sum + (route.frequency || 1), 0);
    score += Math.min(totalFrequency * 2, 30);
    
    // Add score based on roadwork severity
    const severityMultiplier = {
      'Critical': 3,
      'High': 2.5,
      'Medium': 1.5,
      'Low': 1
    };
    score *= severityMultiplier[roadwork.severity] || 1;
    
    // Add score for duration
    if (roadwork.startDate && roadwork.endDate) {
      const duration = new Date(roadwork.endDate) - new Date(roadwork.startDate);
      const durationDays = duration / (1000 * 60 * 60 * 24);
      if (durationDays > 7) score += 20;
      else if (durationDays > 3) score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine severity level from impact score
   */
  determineSeverityLevel(impactScore) {
    if (impactScore >= 80) return 'CRITICAL';
    if (impactScore >= 60) return 'HIGH';
    if (impactScore >= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Estimate delay in minutes
   */
  estimateDelay(affectedRoutes, roadwork) {
    const baseDelay = {
      'Critical': 15,
      'High': 10,
      'Medium': 5,
      'Low': 2
    };

    const workTypeMultiplier = {
      'major': 2,
      'standard': 1.5,
      'minor': 1,
      'emergency': 1.8
    };

    const base = baseDelay[roadwork.severity] || 5;
    const multiplier = workTypeMultiplier[roadwork.workCategory] || 1;
    
    return Math.round(base * multiplier * affectedRoutes.length);
  }

  /**
   * Estimate passenger impact
   */
  estimatePassengerImpact(affectedRoutes) {
    // Rough passenger estimates per route per hour
    const passengerEstimates = {
      'Q3': 120, 'Q3X': 100,
      '10': 80, '10A': 70, '10B': 60,
      '21': 90, '22': 85,
      '1': 75, '2': 70,
      '27': 65, '28': 60
    };

    return affectedRoutes.reduce((total, route) => {
      const passengers = passengerEstimates[route.routeId] || 40;
      return total + passengers;
    }, 0);
  }

  /**
   * Calculate severity distribution
   */
  calculateSeverityDistribution(impacts) {
    const distribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };

    impacts.forEach(impact => {
      distribution[impact.severityLevel]++;
    });

    return distribution;
  }

  /**
   * Identify geographic hotspots
   */
  identifyGeographicHotspots(impacts) {
    const hotspots = [];
    const areas = {};

    // Group impacts by area
    impacts.forEach(impact => {
      if (!impact.coordinates) return;
      
      const lat = Array.isArray(impact.coordinates) ? impact.coordinates[0] : impact.coordinates.lat;
      const lng = Array.isArray(impact.coordinates) ? impact.coordinates[1] : impact.coordinates.lng;
      
      // Simple clustering by 0.01 degree grid (~1km)
      const gridLat = Math.floor(lat * 100) / 100;
      const gridLng = Math.floor(lng * 100) / 100;
      const key = `${gridLat},${gridLng}`;

      if (!areas[key]) {
        areas[key] = {
          center: [gridLat + 0.005, gridLng + 0.005],
          impacts: [],
          totalScore: 0,
          routesAffected: new Set()
        };
      }

      areas[key].impacts.push(impact);
      areas[key].totalScore += impact.impactScore;
      impact.affectedRoutes.forEach(route => {
        areas[key].routesAffected.add(route.routeId);
      });
    });

    // Convert to hotspots array and sort by impact
    Object.entries(areas).forEach(([key, area]) => {
      if (area.impacts.length >= 2 || area.totalScore >= 60) {
        hotspots.push({
          center: area.center,
          impactCount: area.impacts.length,
          totalScore: area.totalScore,
          uniqueRoutes: area.routesAffected.size,
          averageScore: Math.round(area.totalScore / area.impacts.length),
          description: this.generateHotspotDescription(area)
        });
      }
    });

    return hotspots.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
  }

  /**
   * Generate disruption predictions
   */
  async generateDisruptionPredictions(impacts) {
    const predictions = [];

    // Analyze patterns for high-impact areas
    const highImpacts = impacts.filter(i => i.impactScore >= 50);
    
    for (const impact of highImpacts) {
      const prediction = {
        type: 'route_disruption',
        confidence: this.calculatePredictionConfidence(impact),
        timeframe: '24h',
        affectedRoutes: impact.affectedRoutes.map(r => r.routeId),
        estimatedDelay: impact.estimatedDelay,
        mitigationActions: this.generateMitigationActions(impact),
        riskLevel: impact.severityLevel
      };

      predictions.push(prediction);
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate intelligent recommendations
   */
  generateIntelligentRecommendations(analysis) {
    const recommendations = [];

    // High-impact roadworks
    const criticalImpacts = analysis.routeImpacts.filter(i => i.severityLevel === 'CRITICAL');
    if (criticalImpacts.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'immediate_action',
        title: `${criticalImpacts.length} Critical Route Disruptions Detected`,
        description: 'Immediate supervisor attention required for high-impact roadworks',
        actions: [
          'Deploy additional supervisors to affected areas',
          'Activate alternative route communications',
          'Consider temporary service adjustments'
        ],
        affectedRoutes: criticalImpacts.flatMap(i => i.affectedRoutes.map(r => r.routeId)),
        estimatedBenefit: 'Reduce passenger delays by 60-80%'
      });
    }

    // Geographic hotspots
    if (analysis.geographicHotspots.length > 0) {
      const topHotspot = analysis.geographicHotspots[0];
      recommendations.push({
        priority: 'MEDIUM',
        category: 'resource_allocation',
        title: 'Concentrated Disruption Area Identified',
        description: `${topHotspot.impactCount} roadworks affecting ${topHotspot.uniqueRoutes} routes in concentrated area`,
        actions: [
          'Position mobile supervisors in hotspot area',
          'Pre-plan route diversions',
          'Coordinate with local authorities'
        ],
        location: topHotspot.center,
        estimatedBenefit: 'Improve response time by 40%'
      });
    }

    // Service frequency optimization
    const highFrequencyImpacts = analysis.routeImpacts.filter(i => 
      i.affectedRoutes.some(r => r.frequency > 6)
    );
    if (highFrequencyImpacts.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'service_optimization',
        title: 'High-Frequency Routes Affected',
        description: 'Optimize service patterns for maximum passenger benefit',
        actions: [
          'Consider temporary frequency adjustments',
          'Implement dynamic scheduling',
          'Deploy spare vehicles if available'
        ],
        affectedRoutes: highFrequencyImpacts.flatMap(i => i.affectedRoutes.map(r => r.routeId)),
        estimatedBenefit: 'Maintain 90% of normal capacity'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper functions
   */
  getRouteDisplayName(routeId) {
    const routeNames = {
      'Q3': 'Quayside - Q3',
      'Q3X': 'Quayside Express - Q3X',
      '10': 'Hexham - 10',
      '21': 'Durham - 21',
      '22': 'Sunderland - 22'
    };
    return routeNames[routeId] || `Route ${routeId}`;
  }

  async getRouteFrequency(routeId) {
    // Mock frequency data - in production, get from GTFS or service data
    const frequencies = {
      'Q3': 8, 'Q3X': 6, '10': 4, '21': 6, '22': 6,
      '1': 5, '2': 5, '27': 4, '28': 4
    };
    return frequencies[routeId] || 3;
  }

  async getRoutePassengerLoad(routeId) {
    // Mock passenger load data
    const loads = {
      'Q3': 0.8, 'Q3X': 0.7, '10': 0.6, '21': 0.75, '22': 0.7
    };
    return loads[routeId] || 0.5;
  }

  determineImpactType(roadwork) {
    const title = roadwork.title?.toLowerCase() || '';
    const description = roadwork.description?.toLowerCase() || '';
    
    if (title.includes('emergency') || description.includes('emergency')) {
      return 'emergency_closure';
    }
    if (title.includes('water') || description.includes('water')) {
      return 'utilities_work';
    }
    if (title.includes('gas') || description.includes('gas')) {
      return 'gas_work';
    }
    if (title.includes('electric') || description.includes('electric')) {
      return 'electrical_work';
    }
    return 'general_roadwork';
  }

  calculateRouteDelay(routeId, roadwork) {
    // Route-specific delay calculation based on importance and typical delays
    const routeFactors = {
      'Q3': 1.2, 'Q3X': 1.2, // Higher impact on key routes
      '21': 1.1, '22': 1.1,
      '10': 1.0
    };
    
    const baseFactor = routeFactors[routeId] || 1.0;
    const severityDelay = {
      'Critical': 12,
      'High': 8,
      'Medium': 5,
      'Low': 2
    };
    
    return Math.round((severityDelay[roadwork.severity] || 5) * baseFactor);
  }

  findRouteAlternatives(routeId, lat, lng) {
    // Find alternative routes serving similar areas
    const alternatives = enhancedFindRoutesNearCoordinates(lat, lng, 1000);
    return alternatives.filter(alt => alt !== routeId).slice(0, 3);
  }

  findAlternativeRoutes(affectedRoutes, lat, lng) {
    const allAlternatives = new Set();
    const affectedIds = new Set(affectedRoutes.map(r => r.routeId));
    
    const nearbyRoutes = enhancedFindRoutesNearCoordinates(lat, lng, 1500);
    nearbyRoutes.forEach(route => {
      if (!affectedIds.has(route)) {
        allAlternatives.add(route);
      }
    });
    
    return Array.from(allAlternatives).slice(0, 5);
  }

  assessRouteRisk(routeId, roadwork) {
    // Assess risk level based on route importance and roadwork type
    const importantRoutes = ['Q3', 'Q3X', '21', '22', '10'];
    const isImportant = importantRoutes.includes(routeId);
    const isLongTerm = this.isLongTermRoadwork(roadwork);
    
    if (isImportant && isLongTerm) return 'HIGH';
    if (isImportant || isLongTerm) return 'MEDIUM';
    return 'LOW';
  }

  isLongTermRoadwork(roadwork) {
    if (!roadwork.startDate || !roadwork.endDate) return false;
    const duration = new Date(roadwork.endDate) - new Date(roadwork.startDate);
    return duration > (7 * 24 * 60 * 60 * 1000); // More than 7 days
  }

  calculatePredictionConfidence(impact) {
    let confidence = 50;
    
    // Higher confidence for more data
    if (impact.affectedRoutes.length > 2) confidence += 20;
    if (impact.coordinates) confidence += 15;
    if (impact.impactScore > 70) confidence += 15;
    
    return Math.min(confidence, 95);
  }

  generateMitigationActions(impact) {
    const actions = [];
    
    if (impact.severityLevel === 'CRITICAL') {
      actions.push('Deploy emergency supervisor response');
      actions.push('Activate passenger communication protocols');
    }
    
    if (impact.affectedRoutes.length > 3) {
      actions.push('Consider temporary route adjustments');
    }
    
    if (impact.alternativeRoutes.length > 0) {
      actions.push(`Direct passengers to alternatives: ${impact.alternativeRoutes.slice(0, 2).join(', ')}`);
    }
    
    return actions;
  }

  generateHotspotDescription(area) {
    const routeCount = area.routesAffected.size;
    const impactCount = area.impacts.length;
    return `${impactCount} roadworks affecting ${routeCount} routes - requires coordination`;
  }
}

export default new IntelligentAnalytics();