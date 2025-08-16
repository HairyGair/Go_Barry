// backend/services/historicalTrendAnalysis.js
// Historical trend analysis and pattern recognition for transportation data

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Historical Trend Analysis Engine
 * Analyzes patterns in historical data to identify trends and predict future behavior
 */
class HistoricalTrendAnalysis {
  constructor() {
    this.trendCache = new Map();
    this.patterns = new Map();
    this.seasonalData = new Map();
    this.lastAnalysisUpdate = null;
  }

  /**
   * Comprehensive historical trend analysis
   */
  async analyzeHistoricalTrends(options = {}) {
    try {
      console.log('📈 Starting historical trend analysis...');

      const {
        timeframe = '90d',
        categories = ['disruptions', 'roadworks', 'alerts', 'frequency'],
        includeSeasonality = true,
        includePredictions = true
      } = options;

      const analysis = {
        timestamp: new Date().toISOString(),
        timeframe,
        trends: {},
        patterns: {},
        seasonality: {},
        predictions: {},
        insights: [],
        recommendations: []
      };

      // Analyze disruption trends
      if (categories.includes('disruptions')) {
        analysis.trends.disruptions = await this.analyzeDisruptionTrends(timeframe);
      }

      // Analyze roadwork trends
      if (categories.includes('roadworks')) {
        analysis.trends.roadworks = await this.analyzeRoadworkTrends(timeframe);
      }

      // Analyze alert trends
      if (categories.includes('alerts')) {
        analysis.trends.alerts = await this.analyzeAlertTrends(timeframe);
      }

      // Analyze service frequency trends
      if (categories.includes('frequency')) {
        analysis.trends.frequency = await this.analyzeFrequencyTrends(timeframe);
      }

      // Identify cross-category patterns
      analysis.patterns = this.identifyPatterns(analysis.trends);

      // Seasonal analysis
      if (includeSeasonality) {
        analysis.seasonality = await this.analyzeSeasonalPatterns(timeframe);
      }

      // Generate predictions
      if (includePredictions) {
        analysis.predictions = this.generateTrendPredictions(analysis.trends, analysis.patterns);
      }

      // Generate insights and recommendations
      analysis.insights = this.generateInsights(analysis);
      analysis.recommendations = this.generateTrendRecommendations(analysis);

      console.log(`✅ Historical trend analysis complete with ${analysis.insights.length} insights`);

      return {
        success: true,
        analysis
      };

    } catch (error) {
      console.error('❌ Historical trend analysis failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze disruption trends over time
   */
  async analyzeDisruptionTrends(timeframe) {
    try {
      const startDate = this.calculateStartDate(timeframe);
      
      // Get historical activity logs for disruptions
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .in('action', ['alert_dismissed', 'roadwork_created', 'incident_created'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const trends = {
        totalDisruptions: activities.length,
        dailyAverage: 0,
        weeklyPattern: {},
        monthlyPattern: {},
        timeOfDayPattern: {},
        severityTrends: {},
        growthRate: 0,
        volatility: 0
      };

      if (activities.length === 0) return trends;

      // Calculate daily average
      const daysDiff = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
      trends.dailyAverage = Math.round((activities.length / daysDiff) * 10) / 10;

      // Analyze weekly patterns
      trends.weeklyPattern = this.analyzeWeeklyPattern(activities);

      // Analyze monthly patterns
      trends.monthlyPattern = this.analyzeMonthlyPattern(activities);

      // Analyze time of day patterns
      trends.timeOfDayPattern = this.analyzeTimeOfDayPattern(activities);

      // Analyze severity trends
      trends.severityTrends = this.analyzeSeverityTrends(activities);

      // Calculate growth rate
      trends.growthRate = this.calculateGrowthRate(activities, timeframe);

      // Calculate volatility (standard deviation of daily counts)
      trends.volatility = this.calculateVolatility(activities);

      return trends;

    } catch (error) {
      console.warn('⚠️ Disruption trend analysis failed:', error.message);
      return this.getEmptyTrendData();
    }
  }

  /**
   * Analyze roadwork trends
   */
  async analyzeRoadworkTrends(timeframe) {
    try {
      const startDate = this.calculateStartDate(timeframe);

      // Get StreetManager notifications
      const { data: streetmanager, error: smError } = await supabase
        .from('streetmanager_notifications')
        .select('*')
        .gte('webhook_received_at', startDate.toISOString())
        .order('webhook_received_at', { ascending: true });

      if (smError) throw smError;

      // Get manual roadworks
      const { data: manual, error: manualError } = await supabase
        .from('manual_incidents')
        .select('*')
        .eq('type', 'roadwork')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (manualError) throw manualError;

      const allRoadworks = [
        ...streetmanager.map(r => ({ ...r, source: 'streetmanager', date: r.webhook_received_at })),
        ...manual.map(r => ({ ...r, source: 'manual', date: r.created_at }))
      ];

      const trends = {
        totalRoadworks: allRoadworks.length,
        streetManagerCount: streetmanager.length,
        manualCount: manual.length,
        sourceDistribution: {
          streetmanager: Math.round((streetmanager.length / allRoadworks.length) * 100) || 0,
          manual: Math.round((manual.length / allRoadworks.length) * 100) || 0
        },
        weeklyPattern: this.analyzeWeeklyPattern(allRoadworks),
        durationTrends: this.analyzeDurationTrends(allRoadworks),
        geographicTrends: this.analyzeGeographicTrends(allRoadworks),
        authorityTrends: this.analyzeAuthorityTrends(allRoadworks),
        growthRate: this.calculateGrowthRate(allRoadworks, timeframe)
      };

      return trends;

    } catch (error) {
      console.warn('⚠️ Roadwork trend analysis failed:', error.message);
      return this.getEmptyTrendData();
    }
  }

  /**
   * Analyze alert trends
   */
  async analyzeAlertTrends(timeframe) {
    try {
      const startDate = this.calculateStartDate(timeframe);

      // Get activity logs related to alerts
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .in('action', ['alert_dismissed', 'alert_acknowledged', 'alert_created'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const trends = {
        totalAlerts: activities.filter(a => a.action === 'alert_created').length,
        dismissalRate: 0,
        acknowledgmentRate: 0,
        responseTimePattern: {},
        supervisorActivityPattern: {},
        peakAlertTimes: {},
        resolutionTrends: {},
        escalationPattern: {}
      };

      if (activities.length === 0) return trends;

      // Calculate dismissal and acknowledgment rates
      const created = activities.filter(a => a.action === 'alert_created').length;
      const dismissed = activities.filter(a => a.action === 'alert_dismissed').length;
      const acknowledged = activities.filter(a => a.action === 'alert_acknowledged').length;

      trends.dismissalRate = created > 0 ? Math.round((dismissed / created) * 100) : 0;
      trends.acknowledgmentRate = created > 0 ? Math.round((acknowledged / created) * 100) : 0;

      // Analyze response time patterns
      trends.responseTimePattern = this.analyzeResponseTimePattern(activities);

      // Analyze supervisor activity patterns
      trends.supervisorActivityPattern = this.analyzeSupervisorActivityPattern(activities);

      // Identify peak alert times
      trends.peakAlertTimes = this.identifyPeakAlertTimes(activities);

      return trends;

    } catch (error) {
      console.warn('⚠️ Alert trend analysis failed:', error.message);
      return this.getEmptyTrendData();
    }
  }

  /**
   * Analyze service frequency trends
   */
  async analyzeFrequencyTrends(timeframe) {
    try {
      // Mock frequency trend data - in production, integrate with actual service data
      const trends = {
        averageFrequency: 4.2,
        frequencyVariability: 15, // percentage
        peakVsOffPeakRatio: 1.6,
        reliabilityTrend: 'improving', // improving, stable, declining
        punctualityTrend: 'stable',
        routePerformanceRanking: {
          'Q3': { rank: 1, score: 92 },
          '21': { rank: 2, score: 88 },
          '22': { rank: 3, score: 85 },
          '10': { rank: 4, score: 82 }
        },
        seasonalVariation: 8, // percentage variation
        weatherImpactCorrelation: 0.65 // correlation coefficient
      };

      return trends;

    } catch (error) {
      console.warn('⚠️ Frequency trend analysis failed:', error.message);
      return this.getEmptyTrendData();
    }
  }

  /**
   * Identify cross-category patterns
   */
  identifyPatterns(trends) {
    const patterns = {
      correlations: [],
      cyclicalPatterns: [],
      anomalies: [],
      emergingTrends: []
    };

    // Look for correlations between different trend categories
    if (trends.disruptions && trends.roadworks) {
      const correlation = this.calculateCorrelation(
        trends.disruptions.dailyAverage,
        trends.roadworks.totalRoadworks
      );
      
      if (Math.abs(correlation) > 0.3) {
        patterns.correlations.push({
          categories: ['disruptions', 'roadworks'],
          strength: Math.abs(correlation),
          direction: correlation > 0 ? 'positive' : 'negative',
          description: correlation > 0 
            ? 'Disruptions increase with roadwork activity'
            : 'Disruptions decrease with roadwork activity',
          confidence: this.calculateConfidence(correlation)
        });
      }
    }

    // Identify cyclical patterns
    patterns.cyclicalPatterns = this.identifyCyclicalPatterns(trends);

    // Detect anomalies
    patterns.anomalies = this.detectAnomalies(trends);

    // Identify emerging trends
    patterns.emergingTrends = this.identifyEmergingTrends(trends);

    return patterns;
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonalPatterns(timeframe) {
    const seasonality = {
      quarterlyTrends: {},
      monthlySeasonality: {},
      weeklySeasonality: {},
      holidayEffects: {},
      weatherCorrelations: {}
    };

    try {
      // Analyze quarterly trends
      seasonality.quarterlyTrends = await this.analyzeQuarterlyTrends();

      // Analyze monthly seasonality
      seasonality.monthlySeasonality = await this.analyzeMonthlySeasonality();

      // Analyze weekly seasonality
      seasonality.weeklySeasonality = await this.analyzeWeeklySeasonality();

      // Analyze holiday effects
      seasonality.holidayEffects = await this.analyzeHolidayEffects();

      return seasonality;

    } catch (error) {
      console.warn('⚠️ Seasonal pattern analysis failed:', error.message);
      return seasonality;
    }
  }

  /**
   * Generate trend-based predictions
   */
  generateTrendPredictions(trends, patterns) {
    const predictions = {
      shortTerm: [], // 1-7 days
      mediumTerm: [], // 1-4 weeks
      longTerm: [], // 1-3 months
      confidence: {}
    };

    // Generate short-term predictions
    if (trends.disruptions) {
      predictions.shortTerm.push({
        category: 'disruptions',
        prediction: 'Daily disruptions will continue at current rate',
        expectedValue: trends.disruptions.dailyAverage,
        confidence: 0.8,
        timeframe: '7d'
      });
    }

    // Generate medium-term predictions based on patterns
    for (const pattern of patterns.cyclicalPatterns) {
      if (pattern.cycle === 'weekly' || pattern.cycle === 'monthly') {
        predictions.mediumTerm.push({
          category: pattern.category,
          prediction: `${pattern.description} pattern will continue`,
          expectedChange: pattern.amplitude,
          confidence: pattern.reliability,
          timeframe: '4w'
        });
      }
    }

    // Generate long-term predictions based on growth rates
    Object.entries(trends).forEach(([category, trendData]) => {
      if (trendData.growthRate && Math.abs(trendData.growthRate) > 5) {
        predictions.longTerm.push({
          category,
          prediction: `${trendData.growthRate > 0 ? 'Increasing' : 'Decreasing'} trend will continue`,
          expectedChange: trendData.growthRate,
          confidence: 0.6,
          timeframe: '3m'
        });
      }
    });

    // Calculate overall confidence
    predictions.confidence = {
      shortTerm: 0.8,
      mediumTerm: 0.65,
      longTerm: 0.5
    };

    return predictions;
  }

  /**
   * Generate insights from trend analysis
   */
  generateInsights(analysis) {
    const insights = [];

    // Disruption insights
    if (analysis.trends.disruptions) {
      const disruptions = analysis.trends.disruptions;
      
      if (disruptions.growthRate > 10) {
        insights.push({
          type: 'warning',
          category: 'disruptions',
          title: 'Increasing Disruption Trend',
          description: `Disruptions have increased by ${disruptions.growthRate}% over the analysis period`,
          impact: 'HIGH',
          actionRequired: true
        });
      }

      if (disruptions.volatility > 30) {
        insights.push({
          type: 'observation',
          category: 'disruptions',
          title: 'High Disruption Volatility',
          description: 'Disruption patterns show high day-to-day variability',
          impact: 'MEDIUM',
          actionRequired: false
        });
      }
    }

    // Roadwork insights
    if (analysis.trends.roadworks) {
      const roadworks = analysis.trends.roadworks;
      
      if (roadworks.sourceDistribution.streetmanager > 80) {
        insights.push({
          type: 'positive',
          category: 'roadworks',
          title: 'Strong Street Manager Integration',
          description: `${roadworks.sourceDistribution.streetmanager}% of roadworks captured via Street Manager`,
          impact: 'MEDIUM',
          actionRequired: false
        });
      }
    }

    // Pattern insights
    for (const correlation of analysis.patterns.correlations) {
      if (correlation.strength > 0.7) {
        insights.push({
          type: 'insight',
          category: 'patterns',
          title: 'Strong Correlation Detected',
          description: correlation.description,
          impact: 'MEDIUM',
          actionRequired: true
        });
      }
    }

    return insights;
  }

  /**
   * Generate recommendations based on trends
   */
  generateTrendRecommendations(analysis) {
    const recommendations = [];

    // Disruption trend recommendations
    if (analysis.trends.disruptions?.growthRate > 15) {
      recommendations.push({
        priority: 'HIGH',
        category: 'disruption_management',
        title: 'Address Increasing Disruption Trend',
        description: 'Implement proactive disruption prevention measures',
        actions: [
          'Increase preventive maintenance schedules',
          'Enhance early warning systems',
          'Deploy additional monitoring resources',
          'Review and update incident response procedures'
        ],
        expectedBenefit: 'Reduce disruption growth rate by 50%',
        timeframe: '2-4 weeks',
        cost: 'Medium'
      });
    }

    // Seasonal preparation recommendations
    if (analysis.seasonality?.monthlySeasonality) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'seasonal_preparation',
        title: 'Prepare for Seasonal Patterns',
        description: 'Adjust operations based on identified seasonal trends',
        actions: [
          'Pre-position resources for high-activity periods',
          'Adjust staffing levels based on seasonal patterns',
          'Prepare seasonal communication strategies',
          'Review and update seasonal contingency plans'
        ],
        expectedBenefit: 'Improve seasonal operational efficiency by 25%',
        timeframe: '1-2 months',
        cost: 'Low'
      });
    }

    // Data quality recommendations
    if (analysis.trends.roadworks?.sourceDistribution.manual > 40) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'data_quality',
        title: 'Improve Automated Data Capture',
        description: 'Reduce reliance on manual roadwork data entry',
        actions: [
          'Enhance Street Manager integration',
          'Implement additional automated data sources',
          'Improve data validation processes',
          'Train staff on consistent data entry practices'
        ],
        expectedBenefit: 'Increase data accuracy and reduce manual effort',
        timeframe: '3-6 weeks',
        cost: 'Low-Medium'
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
  calculateStartDate(timeframe) {
    const now = new Date();
    const timeframeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '365d': 365
    };
    const days = timeframeMap[timeframe] || 90;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  analyzeWeeklyPattern(data) {
    const weeklyPattern = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0,
      Friday: 0, Saturday: 0, Sunday: 0
    };

    data.forEach(item => {
      const date = new Date(item.date || item.created_at);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      weeklyPattern[dayName]++;
    });

    return weeklyPattern;
  }

  analyzeMonthlyPattern(data) {
    const monthlyPattern = {};
    
    data.forEach(item => {
      const date = new Date(item.date || item.created_at);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      monthlyPattern[monthName] = (monthlyPattern[monthName] || 0) + 1;
    });

    return monthlyPattern;
  }

  analyzeTimeOfDayPattern(data) {
    const hourlyPattern = {};
    
    data.forEach(item => {
      const date = new Date(item.date || item.created_at);
      const hour = date.getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
    });

    return hourlyPattern;
  }

  analyzeSeverityTrends(data) {
    const severityPattern = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    
    data.forEach(item => {
      const severity = item.severity || item.details?.severity || 'Medium';
      severityPattern[severity] = (severityPattern[severity] || 0) + 1;
    });

    return severityPattern;
  }

  calculateGrowthRate(data, timeframe) {
    if (data.length < 2) return 0;

    const sortedData = data.sort((a, b) => 
      new Date(a.date || a.created_at) - new Date(b.date || b.created_at)
    );

    const midpoint = Math.floor(sortedData.length / 2);
    const firstHalf = sortedData.slice(0, midpoint).length;
    const secondHalf = sortedData.slice(midpoint).length;

    if (firstHalf === 0) return 0;
    
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }

  calculateVolatility(data) {
    if (data.length < 7) return 0;

    // Group by day and calculate daily counts
    const dailyCounts = {};
    data.forEach(item => {
      const date = new Date(item.date || item.created_at).toDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const counts = Object.values(dailyCounts);
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
    
    return Math.round(Math.sqrt(variance) * 100) / 100;
  }

  calculateCorrelation(value1, value2) {
    // Simplified correlation calculation
    if (!value1 || !value2) return 0;
    return Math.random() * 0.8 - 0.4; // Mock correlation for demo
  }

  calculateConfidence(correlation) {
    return Math.min(0.95, Math.abs(correlation) + 0.2);
  }

  identifyCyclicalPatterns(trends) {
    const patterns = [];
    
    // Mock cyclical pattern identification
    if (trends.disruptions?.weeklyPattern) {
      patterns.push({
        category: 'disruptions',
        cycle: 'weekly',
        description: 'Higher disruptions on weekdays',
        amplitude: 30,
        reliability: 0.75
      });
    }

    return patterns;
  }

  detectAnomalies(trends) {
    const anomalies = [];
    
    // Mock anomaly detection
    if (trends.roadworks?.growthRate > 50) {
      anomalies.push({
        category: 'roadworks',
        type: 'growth_spike',
        description: 'Unusual spike in roadwork activity',
        severity: 'HIGH',
        confidence: 0.8
      });
    }

    return anomalies;
  }

  identifyEmergingTrends(trends) {
    const emerging = [];
    
    // Mock emerging trend identification
    Object.entries(trends).forEach(([category, trendData]) => {
      if (trendData.growthRate > 20) {
        emerging.push({
          category,
          trend: 'accelerating_growth',
          description: `Rapid increase in ${category}`,
          strength: 'STRONG',
          timeframe: 'recent'
        });
      }
    });

    return emerging;
  }

  getEmptyTrendData() {
    return {
      totalItems: 0,
      dailyAverage: 0,
      weeklyPattern: {},
      monthlyPattern: {},
      growthRate: 0,
      volatility: 0
    };
  }

  // Mock seasonal analysis functions
  async analyzeQuarterlyTrends() {
    return {
      Q1: { activity: 85, trend: 'stable' },
      Q2: { activity: 110, trend: 'increasing' },
      Q3: { activity: 95, trend: 'decreasing' },
      Q4: { activity: 120, trend: 'peak' }
    };
  }

  async analyzeMonthlySeasonality() {
    return {
      highActivity: ['March', 'June', 'September'],
      lowActivity: ['January', 'August', 'December'],
      seasonalVariation: 25
    };
  }

  async analyzeWeeklySeasonality() {
    return {
      peakDays: ['Tuesday', 'Wednesday'],
      lowDays: ['Saturday', 'Sunday'],
      weekendReduction: 45
    };
  }

  async analyzeHolidayEffects() {
    return {
      bankHolidays: { activityReduction: 70 },
      schoolHolidays: { activityIncrease: 15 },
      christmas: { activityReduction: 85 }
    };
  }

  analyzeResponseTimePattern(activities) {
    // Mock response time analysis
    return {
      averageResponseTime: '15 minutes',
      peakResponseTime: '25 minutes',
      fastestResponseTime: '3 minutes',
      improvementTrend: 'stable'
    };
  }

  analyzeSupervisorActivityPattern(activities) {
    // Mock supervisor activity analysis
    return {
      mostActiveHours: ['08:00-10:00', '17:00-19:00'],
      averageActionsPerDay: 12,
      topPerformers: ['Supervisor A', 'Supervisor B']
    };
  }

  identifyPeakAlertTimes(activities) {
    // Mock peak time identification
    return {
      dailyPeaks: ['08:30', '17:45'],
      weeklyPeaks: ['Tuesday', 'Friday'],
      seasonalPeaks: ['March', 'October']
    };
  }

  analyzeDurationTrends(roadworks) {
    // Mock duration analysis
    return {
      averageDuration: '14 days',
      shortTerm: 35, // percentage
      longTerm: 15,   // percentage
      emergencyWork: 5 // percentage
    };
  }

  analyzeGeographicTrends(roadworks) {
    // Mock geographic analysis
    return {
      hotspots: ['Newcastle City Centre', 'Gateshead'],
      distributionPattern: 'clustered',
      ruralVsUrban: { rural: 30, urban: 70 }
    };
  }

  analyzeAuthorityTrends(roadworks) {
    // Mock authority analysis
    return {
      topAuthorities: [
        { name: 'Newcastle City Council', count: 45 },
        { name: 'Gateshead Council', count: 32 },
        { name: 'Durham County Council', count: 28 }
      ],
      averagePerAuthority: 18
    };
  }
}

export default new HistoricalTrendAnalysis();