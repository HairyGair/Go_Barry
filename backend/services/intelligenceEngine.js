// backend/services/intelligenceEngine.js
// Machine Learning and Predictive Analytics for Go BARRY
// Provides severity prediction, route impact scoring, and traffic pattern analysis

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IntelligenceEngine {
  constructor() {
    this.historicalDataPath = path.join(__dirname, '../data/historical-incidents.json');
    this.modelsPath = path.join(__dirname, '../data/ml-models.json');
    this.analyticsPath = path.join(__dirname, '../data/analytics-cache.json');
    
    this.historicalData = [];
    this.models = {};
    this.analyticsCache = {};
    this.predictionCache = new Map();
    
    this.loadData();
    this.initializeModels();
  }

  async loadData() {
    try {
      // Load historical incidents
      try {
        const historicalContent = await fs.readFile(this.historicalDataPath, 'utf8');
        this.historicalData = JSON.parse(historicalContent);
      } catch (error) {
        this.historicalData = [];
        console.log('📊 No historical data found, starting fresh');
      }

      // Load ML models
      try {
        const modelsContent = await fs.readFile(this.modelsPath, 'utf8');
        this.models = JSON.parse(modelsContent);
      } catch (error) {
        this.models = {};
        console.log('🤖 No ML models found, will train new ones');
      }

      // Load analytics cache
      try {
        const analyticsContent = await fs.readFile(this.analyticsPath, 'utf8');
        this.analyticsCache = JSON.parse(analyticsContent);
      } catch (error) {
        this.analyticsCache = {};
        console.log('📈 No analytics cache found, starting fresh');
      }

      console.log(`✅ Intelligence Engine loaded: ${this.historicalData.length} historical incidents`);
    } catch (error) {
      console.error('❌ Failed to load intelligence data:', error);
    }
  }

  async saveData() {
    try {
      await fs.writeFile(this.historicalDataPath, JSON.stringify(this.historicalData, null, 2));
      await fs.writeFile(this.modelsPath, JSON.stringify(this.models, null, 2));
      await fs.writeFile(this.analyticsPath, JSON.stringify(this.analyticsCache, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to save intelligence data:', error);
      return false;
    }
  }

  // Record new incident for learning
  recordIncident(alertData, actualImpact = null, resolutionTime = null) {
    const incident = {
      id: alertData.id || `incident_${Date.now()}`,
      timestamp: new Date().toISOString(),
      
      // Alert characteristics
      title: alertData.title,
      description: alertData.description,
      location: alertData.location,
      coordinates: alertData.coordinates,
      source: alertData.source,
      
      // Extracted features for ML
      features: this.extractFeatures(alertData),
      
      // Actual outcomes (for training)
      actualSeverity: actualImpact?.severity,
      actualDelayMinutes: actualImpact?.delayMinutes,
      affectedRoutes: alertData.affectsRoutes || [],
      resolutionTimeMinutes: resolutionTime,
      
      // Predictions (to measure accuracy)
      predictedSeverity: null,
      predictedImpact: null,
      
      recordedAt: new Date().toISOString()
    };

    this.historicalData.unshift(incident);
    
    // Keep only last 10,000 incidents to manage memory
    if (this.historicalData.length > 10000) {
      this.historicalData = this.historicalData.slice(0, 10000);
    }

    this.saveData();
    return incident;
  }

  // Extract features from alert for ML
  extractFeatures(alertData) {
    const text = (alertData.title + ' ' + alertData.description + ' ' + alertData.location).toLowerCase();
    
    // Time-based features
    const now = new Date();
    const timeFeatures = {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isRushHour: (now.getHours() >= 7 && now.getHours() <= 9) || (now.getHours() >= 17 && now.getHours() <= 19),
      month: now.getMonth()
    };

    // Location-based features
    const locationFeatures = {
      isA1: text.includes('a1'),
      isA19: text.includes('a19'),
      isA69: text.includes('a69'),
      isNewcastle: text.includes('newcastle'),
      isGateshead: text.includes('gateshead'),
      isSunderland: text.includes('sunderland'),
      isDurham: text.includes('durham'),
      isMotorway: text.includes('motorway') || text.includes('m1') || text.includes('a1'),
      isBridge: text.includes('bridge'),
      isJunction: text.includes('junction') || text.includes('j'),
      isRoundabout: text.includes('roundabout')
    };

    // Incident-type features
    const incidentFeatures = {
      isAccident: text.includes('accident') || text.includes('collision') || text.includes('crash'),
      isBreakdown: text.includes('breakdown') || text.includes('broken down'),
      isRoadworks: text.includes('roadworks') || text.includes('road works') || text.includes('construction'),
      isWeather: text.includes('weather') || text.includes('rain') || text.includes('snow') || text.includes('ice'),
      isBlocked: text.includes('blocked') || text.includes('obstruction'),
      isClosed: text.includes('closed') || text.includes('closure'),
      isEmergency: text.includes('emergency') || text.includes('police') || text.includes('ambulance') || text.includes('fire'),
      isDelay: text.includes('delay') || text.includes('delayed'),
      hasLanes: text.includes('lane'),
      isMultiLane: text.includes('lanes') || text.includes('lane 1') || text.includes('lane 2')
    };

    // Severity indicators from text
    const severityFeatures = {
      hasUrgent: text.includes('urgent') || text.includes('severe') || text.includes('major'),
      hasMinor: text.includes('minor') || text.includes('slight'),
      hasCleared: text.includes('cleared') || text.includes('resolved'),
      hasExpected: text.includes('expected') || text.includes('estimated'),
      hasDuration: /\d+\s*(minute|hour)/.test(text)
    };

    return {
      ...timeFeatures,
      ...locationFeatures,
      ...incidentFeatures,
      ...severityFeatures,
      textLength: text.length,
      wordCount: text.split(' ').length,
      hasCoordinates: !!(alertData.coordinates?.lat && alertData.coordinates?.lng)
    };
  }

  // Predict incident severity using ML
  predictSeverity(alertData) {
    const cacheKey = `severity_${JSON.stringify(alertData)}`;
    if (this.predictionCache.has(cacheKey)) {
      return this.predictionCache.get(cacheKey);
    }

    const features = this.extractFeatures(alertData);
    let prediction = this.simpleSeverityModel(features);

    // Enhanced prediction with route analysis
    if (alertData.affectsRoutes && alertData.affectsRoutes.length > 0) {
      const routeImpact = this.calculateRouteImpactScore(alertData);
      
      // Adjust severity based on route impact
      if (routeImpact.totalPassengerImpact > 1000) {
        prediction.severity = Math.min(prediction.severity + 1, 4);
        prediction.confidence *= 1.1;
      }
      
      if (routeImpact.criticalRoutesAffected > 2) {
        prediction.severity = Math.min(prediction.severity + 1, 4);
      }
    }

    // Cache prediction
    this.predictionCache.set(cacheKey, prediction);
    
    // Clean cache if too large
    if (this.predictionCache.size > 1000) {
      const oldestKey = this.predictionCache.keys().next().value;
      this.predictionCache.delete(oldestKey);
    }

    return prediction;
  }

  // Simple ML model for severity prediction (can be enhanced with real ML libraries)
  simpleSeverityModel(features) {
    let score = 2; // Base severity (1-4 scale: 1=minor, 2=moderate, 3=major, 4=critical)
    let confidence = 0.5;

    // Time-based scoring
    if (features.isRushHour) {
      score += 1;
      confidence += 0.2;
    }
    
    if (features.isWeekend) {
      score -= 0.5;
    }

    // Location-based scoring
    if (features.isMotorway) {
      score += 1;
      confidence += 0.3;
    }
    
    if (features.isNewcastle || features.isGateshead) {
      score += 0.5;
      confidence += 0.1;
    }

    // Incident-type scoring
    if (features.isAccident) {
      score += 1.5;
      confidence += 0.4;
    }
    
    if (features.isEmergency) {
      score += 2;
      confidence += 0.5;
    }
    
    if (features.isWeather) {
      score += 0.5;
      confidence += 0.2;
    }
    
    if (features.isRoadworks) {
      score += 0.3;
      confidence += 0.3;
    }

    // Severity indicators
    if (features.hasUrgent) {
      score += 1.5;
      confidence += 0.3;
    }
    
    if (features.hasMinor) {
      score -= 1;
      confidence += 0.2;
    }
    
    if (features.hasCleared) {
      score -= 2;
      confidence += 0.4;
    }

    // Lane impact
    if (features.isBlocked || features.isClosed) {
      score += 1;
      confidence += 0.3;
    }
    
    if (features.isMultiLane) {
      score += 0.5;
    }

    // Normalize
    score = Math.max(1, Math.min(4, Math.round(score * 2) / 2)); // Round to 0.5
    confidence = Math.max(0.1, Math.min(1.0, confidence));

    const severityLabels = {
      1: 'minor',
      1.5: 'minor-moderate',
      2: 'moderate', 
      2.5: 'moderate-major',
      3: 'major',
      3.5: 'major-critical',
      4: 'critical'
    };

    return {
      severity: score,
      severityLabel: severityLabels[score] || 'moderate',
      confidence: confidence,
      estimatedDuration: this.estimateDuration(features, score),
      modelVersion: '1.0',
      features: Object.keys(features).filter(key => features[key] === true)
    };
  }

  // Calculate route impact score
  calculateRouteImpactScore(alertData) {
    const affectedRoutes = alertData.affectsRoutes || [];
    
    // Route importance weights (based on Go North East route data)
    const routeWeights = {
      'Q1': 10, 'Q2': 10, 'Q3': 9, // Quayside routes (high frequency)
      '21': 9, 'X21': 9, // Major Newcastle-Chester-le-Street routes
      '56': 8, 'X12': 8, // Important cross-city routes
      '1': 7, '4': 7, '12': 7, // Core city routes
      '27': 6, '28': 6, '29': 6, // Suburban routes
      'X1': 9, 'X9': 8, 'X10': 8, // Express routes
      'default': 5 // Standard weight for unknown routes
    };

    // Passenger capacity estimates (passengers per hour during peak)
    const routeCapacity = {
      'Q1': 600, 'Q2': 500, 'Q3': 450,
      '21': 800, 'X21': 600,
      '56': 500, 'X12': 450,
      '1': 400, '4': 350, '12': 300,
      'X1': 700, 'X9': 500, 'X10': 450,
      'default': 250
    };

    let totalImpactScore = 0;
    let totalPassengerImpact = 0;
    let criticalRoutesAffected = 0;

    affectedRoutes.forEach(route => {
      const weight = routeWeights[route] || routeWeights['default'];
      const capacity = routeCapacity[route] || routeCapacity['default'];
      
      const routeImpact = weight * (alertData.coordinates ? this.getLocationMultiplier(alertData.coordinates) : 1);
      
      totalImpactScore += routeImpact;
      totalPassengerImpact += capacity;
      
      if (weight >= 8) {
        criticalRoutesAffected++;
      }
    });

    // Time-based multiplier
    const now = new Date();
    const timeMultiplier = this.getTimeMultiplier(now);
    
    totalImpactScore *= timeMultiplier;
    totalPassengerImpact *= timeMultiplier;

    return {
      totalImpactScore,
      totalPassengerImpact: Math.round(totalPassengerImpact),
      criticalRoutesAffected,
      affectedRouteCount: affectedRoutes.length,
      timeMultiplier,
      impactLevel: this.getImpactLevel(totalImpactScore),
      recommendation: this.getRecommendation(totalImpactScore, criticalRoutesAffected)
    };
  }

  getLocationMultiplier(coordinates) {
    // Higher multiplier for city centers and major transport hubs
    const cityAreas = [
      { center: { lat: 54.9783, lng: -1.6178 }, radius: 0.01, multiplier: 1.5 }, // Newcastle City Centre
      { center: { lat: 54.9526, lng: -1.6014 }, radius: 0.008, multiplier: 1.3 }, // Gateshead
      { center: { lat: 54.9069, lng: -1.3838 }, radius: 0.01, multiplier: 1.4 }, // Sunderland
      { center: { lat: 54.7753, lng: -1.5849 }, radius: 0.008, multiplier: 1.2 }  // Durham
    ];

    for (const area of cityAreas) {
      const distance = this.calculateDistance(coordinates, area.center);
      if (distance <= area.radius) {
        return area.multiplier;
      }
    }

    return 1.0; // Default multiplier
  }

  getTimeMultiplier(dateTime) {
    const hour = dateTime.getHours();
    const dayOfWeek = dateTime.getDay();
    
    // Weekend reduced impact
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 0.7;
    }
    
    // Rush hour increased impact
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5;
    }
    
    // Peak daytime
    if (hour >= 10 && hour <= 16) {
      return 1.2;
    }
    
    // Evening/night reduced impact
    if (hour >= 22 || hour <= 6) {
      return 0.5;
    }
    
    return 1.0; // Default
  }

  getImpactLevel(score) {
    if (score >= 100) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    if (score >= 10) return 'LOW';
    return 'MINIMAL';
  }

  getRecommendation(score, criticalRoutes) {
    if (score >= 100 || criticalRoutes >= 3) {
      return 'IMMEDIATE_ACTION_REQUIRED';
    }
    if (score >= 60 || criticalRoutes >= 2) {
      return 'URGENT_RESPONSE_NEEDED';
    }
    if (score >= 30) {
      return 'MONITOR_CLOSELY';
    }
    return 'STANDARD_MONITORING';
  }

  estimateDuration(features, severity) {
    let baseDuration = 15; // minutes
    
    if (features.isAccident) baseDuration = 45;
    if (features.isEmergency) baseDuration = 60;
    if (features.isRoadworks) baseDuration = 120;
    if (features.isBreakdown) baseDuration = 30;
    if (features.isWeather) baseDuration = 90;
    
    // Adjust by severity
    baseDuration *= (severity / 2);
    
    // Adjust by time of day
    if (features.isRushHour) baseDuration *= 1.3;
    if (features.isWeekend) baseDuration *= 0.8;
    
    return Math.round(baseDuration);
  }

  // Predictive analytics
  generatePredictiveInsights() {
    if (this.historicalData.length < 10) {
      return {
        success: false,
        error: 'Insufficient historical data for analysis'
      };
    }

    const insights = {
      hotspots: this.identifyHotspots(),
      timePatterns: this.analyzeTimePatterns(),
      routeVulnerability: this.analyzeRouteVulnerability(),
      seasonalTrends: this.analyzeSeasonalTrends(),
      recommendedActions: []
    };

    // Generate recommendations
    insights.recommendedActions = this.generateRecommendations(insights);

    // Cache insights
    this.analyticsCache = {
      ...insights,
      generatedAt: new Date().toISOString(),
      dataPoints: this.historicalData.length
    };

    this.saveData();

    return {
      success: true,
      insights: this.analyticsCache
    };
  }

  identifyHotspots() {
    const locationCounts = {};
    const severityTotals = {};

    this.historicalData.forEach(incident => {
      const location = incident.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
      severityTotals[location] = (severityTotals[location] || 0) + (incident.actualSeverity || 2);
    });

    const hotspots = Object.keys(locationCounts)
      .map(location => ({
        location,
        incidentCount: locationCounts[location],
        averageSeverity: (severityTotals[location] / locationCounts[location]).toFixed(2),
        riskScore: locationCounts[location] * (severityTotals[location] / locationCounts[location])
      }))
      .filter(spot => spot.incidentCount >= 3)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return hotspots;
  }

  analyzeTimePatterns() {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    this.historicalData.forEach(incident => {
      const date = new Date(incident.timestamp);
      hourCounts[date.getHours()]++;
      dayCounts[date.getDay()]++;
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const peakDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .map((day, index) => ({ day, count: dayCounts[index] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      peakHours,
      peakDays,
      hourlyDistribution: hourCounts,
      dailyDistribution: dayCounts
    };
  }

  analyzeRouteVulnerability() {
    const routeImpacts = {};

    this.historicalData.forEach(incident => {
      if (incident.affectedRoutes) {
        incident.affectedRoutes.forEach(route => {
          if (!routeImpacts[route]) {
            routeImpacts[route] = {
              incidentCount: 0,
              totalDelayMinutes: 0,
              severitySum: 0
            };
          }
          routeImpacts[route].incidentCount++;
          routeImpacts[route].totalDelayMinutes += incident.actualDelayMinutes || 0;
          routeImpacts[route].severitySum += incident.actualSeverity || 2;
        });
      }
    });

    const vulnerableRoutes = Object.keys(routeImpacts)
      .map(route => ({
        route,
        ...routeImpacts[route],
        averageDelay: routeImpacts[route].totalDelayMinutes / routeImpacts[route].incidentCount,
        averageSeverity: routeImpacts[route].severitySum / routeImpacts[route].incidentCount,
        vulnerabilityScore: routeImpacts[route].incidentCount * (routeImpacts[route].severitySum / routeImpacts[route].incidentCount)
      }))
      .sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore)
      .slice(0, 10);

    return vulnerableRoutes;
  }

  analyzeSeasonalTrends() {
    const monthCounts = new Array(12).fill(0);
    const weatherIncidents = new Array(12).fill(0);
    
    this.historicalData.forEach(incident => {
      const month = new Date(incident.timestamp).getMonth();
      monthCounts[month]++;
      
      if (incident.features?.isWeather) {
        weatherIncidents[month]++;
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const seasonalData = months.map((month, index) => ({
      month,
      incidents: monthCounts[index],
      weatherIncidents: weatherIncidents[index],
      weatherPercentage: monthCounts[index] > 0 ? 
        Math.round((weatherIncidents[index] / monthCounts[index]) * 100) : 0
    }));

    return seasonalData;
  }

  generateRecommendations(insights) {
    const recommendations = [];

    // Hotspot recommendations
    if (insights.hotspots.length > 0) {
      const topHotspot = insights.hotspots[0];
      recommendations.push({
        type: 'HOTSPOT_MONITORING',
        priority: 'HIGH',
        title: `Monitor ${topHotspot.location} closely`,
        description: `This location has ${topHotspot.incidentCount} incidents with average severity ${topHotspot.averageSeverity}`,
        action: 'Consider increased monitoring or infrastructure improvements'
      });
    }

    // Time pattern recommendations
    if (insights.timePatterns.peakHours.length > 0) {
      const peakHour = insights.timePatterns.peakHours[0];
      recommendations.push({
        type: 'PEAK_HOUR_PREP',
        priority: 'MEDIUM',
        title: `Prepare for ${peakHour.hour}:00 peak incidents`,
        description: `${peakHour.count} incidents typically occur at this hour`,
        action: 'Ensure adequate supervisor coverage and quick response capability'
      });
    }

    // Route vulnerability recommendations
    if (insights.routeVulnerability.length > 0) {
      const vulnerableRoute = insights.routeVulnerability[0];
      recommendations.push({
        type: 'ROUTE_PROTECTION',
        priority: 'HIGH',
        title: `Route ${vulnerableRoute.route} requires attention`,
        description: `${vulnerableRoute.incidentCount} incidents with average ${Math.round(vulnerableRoute.averageDelay)} minute delays`,
        action: 'Consider alternative routing options and enhanced monitoring'
      });
    }

    return recommendations;
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Get model accuracy statistics
  getModelPerformance() {
    const predictions = this.historicalData.filter(incident => 
      incident.predictedSeverity && incident.actualSeverity
    );

    if (predictions.length === 0) {
      return {
        success: false,
        error: 'No prediction data available'
      };
    }

    let correctPredictions = 0;
    let totalError = 0;

    predictions.forEach(incident => {
      const predicted = incident.predictedSeverity;
      const actual = incident.actualSeverity;
      
      if (Math.abs(predicted - actual) <= 0.5) {
        correctPredictions++;
      }
      
      totalError += Math.abs(predicted - actual);
    });

    const accuracy = (correctPredictions / predictions.length) * 100;
    const avgError = totalError / predictions.length;

    return {
      success: true,
      accuracy: Math.round(accuracy),
      averageError: Math.round(avgError * 100) / 100,
      totalPredictions: predictions.length,
      modelVersion: '1.0'
    };
  }

  initializeModels() {
    console.log('🤖 Intelligence Engine initialized with simple ML models');
    console.log('📊 Ready for severity prediction and route impact analysis');
  }
}

// Export singleton instance
const intelligenceEngine = new IntelligenceEngine();
export default intelligenceEngine;
