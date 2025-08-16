// backend/services/realTimeDisruptionScoring.js
// Real-time disruption scoring and alerting system

import intelligentAnalytics from './intelligentAnalytics.js';
import predictiveModeling from './predictiveModeling.js';
import serviceFrequencyIntelligence from './serviceFrequencyIntelligence.js';
import unifiedRoadworksManager from './unifiedRoadworksManager.js';

/**
 * Real-time Disruption Scoring System
 * Continuously monitors and scores the current disruption level across the network
 */
class RealTimeDisruptionScoring {
  constructor() {
    this.currentScore = 0;
    this.scoreHistory = [];
    this.alertThresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 85
    };
    this.lastUpdate = null;
    this.scoringInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMinutes = 5) {
    if (this.isMonitoring) {
      console.log('⚠️ Disruption scoring already monitoring');
      return;
    }

    console.log(`🔄 Starting real-time disruption scoring (${intervalMinutes}min intervals)`);
    
    // Initial score calculation
    this.calculateCurrentScore();
    
    // Set up recurring scoring
    this.scoringInterval = setInterval(() => {
      this.calculateCurrentScore();
    }, intervalMinutes * 60 * 1000);
    
    this.isMonitoring = true;
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring() {
    if (this.scoringInterval) {
      clearInterval(this.scoringInterval);
      this.scoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Disruption scoring monitoring stopped');
  }

  /**
   * Calculate current disruption score
   */
  async calculateCurrentScore() {
    try {
      console.log('📊 Calculating real-time disruption score...');

      const scoreComponents = {
        roadworkImpact: 0,
        serviceFrequencyImpact: 0,
        predictiveRisk: 0,
        historicalTrend: 0,
        weatherFactor: 0,
        timeOfDayFactor: 0,
        passengerImpact: 0
      };

      // Get roadwork impact score (0-35 points)
      scoreComponents.roadworkImpact = await this.calculateRoadworkImpactScore();

      // Get service frequency impact score (0-25 points)
      scoreComponents.serviceFrequencyImpact = await this.calculateServiceFrequencyScore();

      // Get predictive risk score (0-20 points)
      scoreComponents.predictiveRisk = await this.calculatePredictiveRiskScore();

      // Get historical trend factor (0-10 points)
      scoreComponents.historicalTrend = await this.calculateHistoricalTrendScore();

      // Get weather factor (0-5 points)
      scoreComponents.weatherFactor = this.calculateWeatherScore();

      // Get time of day factor (0-3 points)
      scoreComponents.timeOfDayFactor = this.calculateTimeOfDayScore();

      // Get passenger impact factor (0-2 points)
      scoreComponents.passengerImpact = await this.calculatePassengerImpactScore();

      // Calculate total score
      const totalScore = Object.values(scoreComponents).reduce((sum, score) => sum + score, 0);
      
      // Update current score and history
      this.currentScore = Math.min(Math.round(totalScore), 100);
      this.lastUpdate = new Date();
      
      // Add to history (keep last 24 hours)
      this.scoreHistory.push({
        timestamp: this.lastUpdate,
        score: this.currentScore,
        components: scoreComponents
      });
      
      // Keep only last 24 hours of data (assuming 5-minute intervals = 288 points)
      if (this.scoreHistory.length > 288) {
        this.scoreHistory = this.scoreHistory.slice(-288);
      }

      // Check for alerts
      await this.checkScoreAlerts();

      console.log(`✅ Disruption score updated: ${this.currentScore}/100`);
      
      return {
        success: true,
        score: this.currentScore,
        components: scoreComponents,
        level: this.getScoreLevel(this.currentScore),
        timestamp: this.lastUpdate
      };

    } catch (error) {
      console.error('❌ Error calculating disruption score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate roadwork impact score (0-35 points)
   */
  async calculateRoadworkImpactScore() {
    try {
      const roadworks = await unifiedRoadworksManager.getAllRoadworks();
      if (!roadworks.success || !roadworks.combined.length) {
        return 0;
      }

      const routeImpacts = await intelligentAnalytics.analyzeRouteImpact();
      if (!routeImpacts.success) {
        return Math.min(roadworks.combined.length * 2, 15); // Fallback scoring
      }

      let impactScore = 0;

      // Base score from number of active roadworks
      impactScore += Math.min(roadworks.combined.length * 1.5, 15);

      // Additional score from severity
      const severityWeights = { CRITICAL: 8, HIGH: 5, MEDIUM: 3, LOW: 1 };
      for (const impact of routeImpacts.analysis.routeImpacts) {
        impactScore += severityWeights[impact.severityLevel] || 0;
      }

      // Geographic clustering penalty
      if (routeImpacts.analysis.geographicHotspots.length > 0) {
        impactScore += routeImpacts.analysis.geographicHotspots.length * 3;
      }

      return Math.min(Math.round(impactScore), 35);

    } catch (error) {
      console.warn('⚠️ Roadwork impact scoring failed:', error.message);
      return 10; // Conservative fallback
    }
  }

  /**
   * Calculate service frequency impact score (0-25 points)
   */
  async calculateServiceFrequencyScore() {
    try {
      const frequencyAnalysis = await serviceFrequencyIntelligence.assessFrequencyImpact();
      if (!frequencyAnalysis.success) {
        return 5; // Fallback
      }

      let frequencyScore = 0;
      const analysis = frequencyAnalysis.assessment;

      // Overall impact severity
      const severityScores = { CRITICAL: 15, HIGH: 12, MEDIUM: 8, LOW: 3 };
      frequencyScore += severityScores[analysis.overallImpact?.severity] || 0;

      // Route count impact
      frequencyScore += Math.min(analysis.routeAnalysis?.length * 0.5, 5);

      // Capacity loss impact
      const avgCapacityLoss = analysis.overallImpact?.averageCapacityLoss || 0;
      frequencyScore += Math.min(avgCapacityLoss * 0.1, 5);

      return Math.min(Math.round(frequencyScore), 25);

    } catch (error) {
      console.warn('⚠️ Service frequency scoring failed:', error.message);
      return 8; // Conservative fallback
    }
  }

  /**
   * Calculate predictive risk score (0-20 points)
   */
  async calculatePredictiveRiskScore() {
    try {
      const predictions = await predictiveModeling.generateDisruptionPredictions('24h');
      if (!predictions.success) {
        return 3; // Fallback
      }

      let riskScore = 0;
      const predictionData = predictions.predictions;

      // Base score from prediction confidence and risk level
      const riskLevelScores = { CRITICAL: 10, HIGH: 7, MEDIUM: 4, LOW: 1 };
      riskScore += riskLevelScores[predictionData.totalRisk] || 0;

      // Additional score from high-confidence predictions
      const highConfidencePredictions = predictionData.predictions.filter(p => p.confidence > 80);
      riskScore += Math.min(highConfidencePredictions.length * 2, 8);

      // Escalation predictions penalty
      const escalationPredictions = predictionData.predictions.filter(p => p.type === 'disruption_escalation');
      riskScore += escalationPredictions.length * 2;

      return Math.min(Math.round(riskScore), 20);

    } catch (error) {
      console.warn('⚠️ Predictive risk scoring failed:', error.message);
      return 5; // Conservative fallback
    }
  }

  /**
   * Calculate historical trend score (0-10 points)
   */
  async calculateHistoricalTrendScore() {
    try {
      // Simple trend scoring based on recent activity
      // In production, this would analyze historical trend data
      
      let trendScore = 0;
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // Peak hour factor
      if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        trendScore += 3;
      }

      // Weekday factor
      if (day >= 1 && day <= 5) {
        trendScore += 2;
      }

      // Monday factor (higher disruption probability)
      if (day === 1) {
        trendScore += 2;
      }

      // Winter factor (if winter months)
      const month = now.getMonth();
      if (month >= 11 || month <= 2) {
        trendScore += 3;
      }

      return Math.min(trendScore, 10);

    } catch (error) {
      console.warn('⚠️ Historical trend scoring failed:', error.message);
      return 2;
    }
  }

  /**
   * Calculate weather impact score (0-5 points)
   */
  calculateWeatherScore() {
    // Mock weather scoring - in production, integrate with weather API
    const weatherConditions = this.getCurrentWeatherConditions();
    
    const weatherScores = {
      'clear': 0,
      'light_rain': 1,
      'heavy_rain': 3,
      'snow': 4,
      'ice': 5,
      'fog': 2,
      'high_winds': 3
    };

    return weatherScores[weatherConditions] || 0;
  }

  /**
   * Calculate time of day factor (0-3 points)
   */
  calculateTimeOfDayScore() {
    const hour = new Date().getHours();
    
    // Peak disruption hours
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 3; // Peak hours
    } else if ((hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 20)) {
      return 2; // Near-peak hours
    } else if (hour >= 22 || hour <= 5) {
      return 0; // Night hours (minimal disruption impact)
    } else {
      return 1; // Off-peak hours
    }
  }

  /**
   * Calculate passenger impact score (0-2 points)
   */
  async calculatePassengerImpactScore() {
    try {
      // Estimate passenger impact based on route analysis
      const roadworks = await unifiedRoadworksManager.getAllRoadworks();
      if (!roadworks.success) return 0;

      const routeImpacts = await intelligentAnalytics.analyzeRouteImpact();
      if (!routeImpacts.success) return 1;

      const totalPassengerImpact = routeImpacts.analysis.routeImpacts.reduce(
        (sum, impact) => sum + (impact.passengerImpact || 0), 0
      );

      if (totalPassengerImpact > 500) return 2;
      if (totalPassengerImpact > 200) return 1;
      return 0;

    } catch (error) {
      return 0;
    }
  }

  /**
   * Get score level description
   */
  getScoreLevel(score) {
    if (score >= this.alertThresholds.critical) return 'CRITICAL';
    if (score >= this.alertThresholds.high) return 'HIGH';
    if (score >= this.alertThresholds.medium) return 'MEDIUM';
    if (score >= this.alertThresholds.low) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Check if score change requires alerts
   */
  async checkScoreAlerts() {
    const previousScore = this.scoreHistory.length > 1 ? 
      this.scoreHistory[this.scoreHistory.length - 2].score : 0;
    
    const currentLevel = this.getScoreLevel(this.currentScore);
    const previousLevel = this.getScoreLevel(previousScore);
    
    // Alert if level has increased
    if (this.shouldTriggerAlert(currentLevel, previousLevel)) {
      await this.triggerScoreAlert(currentLevel, this.currentScore, previousScore);
    }
  }

  /**
   * Determine if an alert should be triggered
   */
  shouldTriggerAlert(currentLevel, previousLevel) {
    const levelOrder = { 'MINIMAL': 0, 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    
    // Trigger alert if level increased or if critical/high level maintained
    return levelOrder[currentLevel] > levelOrder[previousLevel] ||
           (currentLevel === 'CRITICAL' || currentLevel === 'HIGH');
  }

  /**
   * Trigger score alert
   */
  async triggerScoreAlert(level, currentScore, previousScore) {
    try {
      console.log(`🚨 Disruption score alert: ${level} level (${currentScore}/100)`);
      
      const alert = {
        type: 'disruption_score_alert',
        level,
        currentScore,
        previousScore,
        timestamp: new Date(),
        components: this.scoreHistory[this.scoreHistory.length - 1].components,
        recommendations: this.generateScoreRecommendations(level, currentScore)
      };

      // In production, this would send alerts to supervisors, update dashboards, etc.
      console.log('📧 Score alert would be sent to supervisors:', alert);

    } catch (error) {
      console.error('❌ Error triggering score alert:', error);
    }
  }

  /**
   * Generate recommendations based on score level
   */
  generateScoreRecommendations(level, score) {
    const recommendations = [];

    switch (level) {
      case 'CRITICAL':
        recommendations.push('Activate emergency response protocols');
        recommendations.push('Deploy all available supervisors');
        recommendations.push('Implement passenger communication emergency plan');
        recommendations.push('Consider service suspension if safety compromised');
        break;
        
      case 'HIGH':
        recommendations.push('Increase supervisor monitoring frequency');
        recommendations.push('Activate enhanced passenger communications');
        recommendations.push('Prepare contingency service plans');
        recommendations.push('Monitor situation every 15 minutes');
        break;
        
      case 'MEDIUM':
        recommendations.push('Deploy additional supervisors to affected areas');
        recommendations.push('Update passenger information systems');
        recommendations.push('Monitor key performance indicators');
        break;
        
      case 'LOW':
        recommendations.push('Maintain standard monitoring procedures');
        recommendations.push('Review current disruption mitigation measures');
        break;
    }

    return recommendations;
  }

  /**
   * Get current score and status
   */
  getCurrentScore() {
    return {
      score: this.currentScore,
      level: this.getScoreLevel(this.currentScore),
      lastUpdate: this.lastUpdate,
      trend: this.getScoreTrend(),
      isMonitoring: this.isMonitoring,
      components: this.scoreHistory.length > 0 ? 
        this.scoreHistory[this.scoreHistory.length - 1].components : null
    };
  }

  /**
   * Get score trend
   */
  getScoreTrend() {
    if (this.scoreHistory.length < 3) return 'insufficient_data';
    
    const recent = this.scoreHistory.slice(-3);
    const trend = recent[2].score - recent[0].score;
    
    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Get score history
   */
  getScoreHistory(hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.scoreHistory.filter(entry => entry.timestamp >= cutoffTime);
  }

  /**
   * Get detailed score breakdown
   */
  getScoreBreakdown() {
    if (this.scoreHistory.length === 0) {
      return { error: 'No score data available' };
    }

    const latest = this.scoreHistory[this.scoreHistory.length - 1];
    return {
      totalScore: this.currentScore,
      maxScore: 100,
      level: this.getScoreLevel(this.currentScore),
      components: latest.components,
      componentPercentages: this.calculateComponentPercentages(latest.components),
      lastUpdate: this.lastUpdate,
      trend: this.getScoreTrend()
    };
  }

  /**
   * Calculate component percentages
   */
  calculateComponentPercentages(components) {
    const total = Object.values(components).reduce((sum, value) => sum + value, 0);
    const percentages = {};
    
    for (const [key, value] of Object.entries(components)) {
      percentages[key] = total > 0 ? Math.round((value / total) * 100) : 0;
    }
    
    return percentages;
  }

  /**
   * Mock weather data - replace with real weather API in production
   */
  getCurrentWeatherConditions() {
    // Mock weather conditions
    const conditions = ['clear', 'light_rain', 'heavy_rain', 'snow', 'fog'];
    const now = new Date();
    const hour = now.getHours();
    
    // More likely to have weather issues during certain hours
    if (hour >= 6 && hour <= 8) {
      return Math.random() > 0.7 ? 'fog' : 'clear';
    } else if (hour >= 16 && hour <= 18) {
      return Math.random() > 0.8 ? 'light_rain' : 'clear';
    }
    
    return 'clear';
  }

  /**
   * Reset scoring system
   */
  reset() {
    this.stopMonitoring();
    this.currentScore = 0;
    this.scoreHistory = [];
    this.lastUpdate = null;
    console.log('🔄 Disruption scoring system reset');
  }
}

export default new RealTimeDisruptionScoring();