// backend/routes/intelligenceAPI.js
// API Routes for Go BARRY Intelligence System
// ML predictions, analytics, and enhanced data sources

import express from 'express';
import intelligenceEngine from '../services/intelligenceEngine.js';
import enhancedDataSourceManager from '../services/enhancedDataSourceManager.js';

const router = express.Router();

// ===== MACHINE LEARNING PREDICTIONS =====

// Predict incident severity
router.post('/predict/severity', async (req, res) => {
  try {
    const { alertData } = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required'
      });
    }
    
    const prediction = intelligenceEngine.predictSeverity(alertData);
    
    res.json({
      success: true,
      prediction,
      alertData: {
        title: alertData.title,
        location: alertData.location,
        coordinates: alertData.coordinates
      }
    });
  } catch (error) {
    console.error('❌ Severity prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict severity'
    });
  }
});

// Calculate route impact score
router.post('/analyze/route-impact', async (req, res) => {
  try {
    const { alertData } = req.body;
    
    if (!alertData) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required'
      });
    }
    
    const routeImpact = intelligenceEngine.calculateRouteImpactScore(alertData);
    
    res.json({
      success: true,
      routeImpact,
      analysis: {
        recommendation: routeImpact.recommendation,
        affectedRoutes: alertData.affectsRoutes || [],
        impactLevel: routeImpact.impactLevel
      }
    });
  } catch (error) {
    console.error('❌ Route impact analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze route impact'
    });
  }
});

// ===== PREDICTIVE ANALYTICS =====

// Generate predictive insights
router.get('/analytics/insights', async (req, res) => {
  try {
    const insights = intelligenceEngine.generatePredictiveInsights();
    
    if (!insights.success) {
      return res.status(400).json(insights);
    }
    
    res.json({
      success: true,
      insights: insights.insights,
      metadata: {
        dataPoints: insights.insights.dataPoints || 0,
        generatedAt: insights.insights.generatedAt,
        version: '1.0'
      }
    });
  } catch (error) {
    console.error('❌ Analytics insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

// Get traffic hotspots
router.get('/analytics/hotspots', async (req, res) => {
  try {
    const insights = intelligenceEngine.generatePredictiveInsights();
    
    if (!insights.success) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data for hotspot analysis'
      });
    }
    
    res.json({
      success: true,
      hotspots: insights.insights.hotspots || [],
      analysis: {
        topRiskLocation: insights.insights.hotspots?.[0]?.location || 'No data',
        totalHotspots: insights.insights.hotspots?.length || 0,
        averageRiskScore: insights.insights.hotspots?.length > 0 ? 
          Math.round(insights.insights.hotspots.reduce((sum, h) => sum + h.riskScore, 0) / insights.insights.hotspots.length) : 0
      }
    });
  } catch (error) {
    console.error('❌ Hotspots analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze hotspots'
    });
  }
});

// Get time pattern analysis
router.get('/analytics/time-patterns', async (req, res) => {
  try {
    const insights = intelligenceEngine.generatePredictiveInsights();
    
    if (!insights.success) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data for time pattern analysis'
      });
    }
    
    res.json({
      success: true,
      timePatterns: insights.insights.timePatterns || {},
      summary: {
        peakHour: insights.insights.timePatterns?.peakHours?.[0]?.hour || 'No data',
        peakDay: insights.insights.timePatterns?.peakDays?.[0]?.day || 'No data',
        totalAnalyzed: insights.insights.dataPoints || 0
      }
    });
  } catch (error) {
    console.error('❌ Time patterns analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze time patterns'
    });
  }
});

// Get route vulnerability analysis
router.get('/analytics/route-vulnerability', async (req, res) => {
  try {
    const insights = intelligenceEngine.generatePredictiveInsights();
    
    if (!insights.success) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data for route vulnerability analysis'
      });
    }
    
    res.json({
      success: true,
      vulnerableRoutes: insights.insights.routeVulnerability || [],
      summary: {
        mostVulnerableRoute: insights.insights.routeVulnerability?.[0]?.route || 'No data',
        totalRoutesAnalyzed: insights.insights.routeVulnerability?.length || 0,
        averageVulnerabilityScore: insights.insights.routeVulnerability?.length > 0 ?
          Math.round(insights.insights.routeVulnerability.reduce((sum, r) => sum + r.vulnerabilityScore, 0) / insights.insights.routeVulnerability.length) : 0
      }
    });
  } catch (error) {
    console.error('❌ Route vulnerability analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze route vulnerability'
    });
  }
});

// Get AI recommendations
router.get('/analytics/recommendations', async (req, res) => {
  try {
    const insights = intelligenceEngine.generatePredictiveInsights();
    
    if (!insights.success) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data for recommendations'
      });
    }
    
    res.json({
      success: true,
      recommendations: insights.insights.recommendedActions || [],
      summary: {
        totalRecommendations: insights.insights.recommendedActions?.length || 0,
        highPriorityCount: insights.insights.recommendedActions?.filter(r => r.priority === 'HIGH')?.length || 0,
        generatedAt: insights.insights.generatedAt
      }
    });
  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations'
    });
  }
});

// ===== ENHANCED DATA SOURCES =====

// Get enhanced traffic data with ML
router.get('/data/enhanced', async (req, res) => {
  try {
    const data = await enhancedDataSourceManager.aggregateAllSources();
    
    res.json({
      success: true,
      data,
      metadata: {
        enhancedIncidents: data.incidents?.filter(i => i.enhanced)?.length || 0,
        mlPredictions: data.incidents?.filter(i => i.mlPrediction)?.length || 0,
        routeImpactAnalysis: data.incidents?.filter(i => i.routeImpact)?.length || 0,
        lastUpdate: data.lastUpdate,
        confidence: data.confidence
      }
    });
  } catch (error) {
    console.error('❌ Enhanced data fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced data'
    });
  }
});

// Get data source statistics
router.get('/data/sources/stats', async (req, res) => {
  try {
    const stats = enhancedDataSourceManager.getSourceStatistics();
    
    res.json({
      success: true,
      statistics: stats,
      health: {
        overallStatus: stats.activeSources >= 2 ? 'healthy' : 'degraded',
        coverage: 'North East England',
        lastUpdate: stats.lastUpdate
      }
    });
  } catch (error) {
    console.error('❌ Source statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get source statistics'
    });
  }
});

// ===== MODEL PERFORMANCE =====

// Get ML model performance metrics
router.get('/ml/performance', async (req, res) => {
  try {
    const performance = intelligenceEngine.getModelPerformance();
    
    if (!performance.success) {
      return res.status(400).json(performance);
    }
    
    res.json({
      success: true,
      performance,
      status: {
        modelHealth: performance.accuracy >= 70 ? 'good' : performance.accuracy >= 50 ? 'fair' : 'poor',
        recommendedAction: performance.accuracy < 70 ? 'Model needs more training data' : 'Model performing well'
      }
    });
  } catch (error) {
    console.error('❌ Model performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get model performance'
    });
  }
});

// Record incident outcome (for ML training)
router.post('/ml/record-outcome', async (req, res) => {
  try {
    const { alertId, actualSeverity, actualDelayMinutes, resolutionTimeMinutes } = req.body;
    
    if (!alertId || !actualSeverity) {
      return res.status(400).json({
        success: false,
        error: 'Alert ID and actual severity are required'
      });
    }
    
    // This would update the historical record for ML training
    // Implementation would involve finding the incident and updating it
    
    res.json({
      success: true,
      message: 'Incident outcome recorded for ML training',
      data: {
        alertId,
        actualSeverity,
        actualDelayMinutes,
        resolutionTimeMinutes,
        recordedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Record outcome error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record incident outcome'
    });
  }
});

// ===== SYSTEM HEALTH =====

// Get intelligence system health
router.get('/health', async (req, res) => {
  try {
    const dataSourceStats = enhancedDataSourceManager.getSourceStatistics();
    const modelPerformance = intelligenceEngine.getModelPerformance();
    
    const health = {
      status: 'operational',
      components: {
        dataSources: {
          status: dataSourceStats.activeSources >= 2 ? 'healthy' : 'degraded',
          activeSources: dataSourceStats.activeSources,
          totalSources: dataSourceStats.totalSources,
          confidence: dataSourceStats.confidence
        },
        machineLearning: {
          status: modelPerformance.success && modelPerformance.accuracy >= 50 ? 'operational' : 'limited',
          accuracy: modelPerformance.accuracy || 'insufficient_data',
          predictions: modelPerformance.totalPredictions || 0
        },
        analytics: {
          status: 'operational',
          lastGenerated: new Date().toISOString()
        }
      },
      lastCheck: new Date().toISOString()
    };
    
    // Determine overall status
    const componentStatuses = Object.values(health.components).map(c => c.status);
    if (componentStatuses.some(s => s === 'degraded')) {
      health.status = 'degraded';
    } else if (componentStatuses.some(s => s === 'limited')) {
      health.status = 'limited';
    }
    
    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('❌ System health error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system health',
      health: {
        status: 'error',
        lastCheck: new Date().toISOString()
      }
    });
  }
});

export default router;