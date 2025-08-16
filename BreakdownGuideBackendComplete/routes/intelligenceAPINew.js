// backend/routes/intelligenceAPINew.js
// API endpoints for advanced transportation intelligence and analytics

import express from 'express';
import intelligentAnalytics from '../services/intelligentAnalytics.js';
import predictiveModeling from '../services/predictiveModeling.js';
import serviceFrequencyIntelligence from '../services/serviceFrequencyIntelligence.js';
import historicalTrendAnalysis from '../services/historicalTrendAnalysis.js';
import realTimeDisruptionScoring from '../services/realTimeDisruptionScoring.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

/**
 * GET /api/intelligence/overview
 * Get comprehensive intelligence overview
 */
router.get('/overview', async (req, res) => {
  try {
    console.log('🧠 API: Generating intelligence overview...');
    
    const { timeframe = '24h' } = req.query;

    // Get all intelligence data in parallel
    const [
      routeImpactResult,
      predictionsResult,
      frequencyResult,
      disruptionScore
    ] = await Promise.allSettled([
      intelligentAnalytics.analyzeRouteImpact(),
      predictiveModeling.generateDisruptionPredictions(timeframe),
      serviceFrequencyIntelligence.assessFrequencyImpact(),
      realTimeDisruptionScoring.calculateCurrentScore()
    ]);

    const overview = {
      timestamp: new Date().toISOString(),
      timeframe,
      disruptionScore: disruptionScore.status === 'fulfilled' ? disruptionScore.value : null,
      routeImpact: routeImpactResult.status === 'fulfilled' ? routeImpactResult.value : null,
      predictions: predictionsResult.status === 'fulfilled' ? predictionsResult.value : null,
      frequencyImpact: frequencyResult.status === 'fulfilled' ? frequencyResult.value : null,
      summary: {},
      alerts: [],
      recommendations: []
    };

    // Generate summary
    overview.summary = generateOverviewSummary(overview);

    // Collect all alerts and recommendations
    if (overview.predictions?.success) {
      overview.alerts.push(...(overview.predictions.predictions.predictions || []));
      overview.recommendations.push(...(overview.predictions.predictions.recommendations || []));
    }

    if (overview.routeImpact?.success) {
      overview.recommendations.push(...(overview.routeImpact.analysis.recommendations || []));
    }

    if (overview.frequencyImpact?.success) {
      overview.recommendations.push(...(overview.frequencyImpact.assessment.frequencyOptimizations || []));
    }

    console.log(`✅ API: Intelligence overview generated`);

    res.json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('❌ API Error generating intelligence overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/intelligence/disruption-score
 * Get current real-time disruption score
 */
router.get('/disruption-score', async (req, res) => {
  try {
    const {
      includeHistory = 'false',
      includeBreakdown = 'true',
      historyHours = '24'
    } = req.query;

    let result = realTimeDisruptionScoring.getCurrentScore();

    if (includeBreakdown === 'true') {
      result.breakdown = realTimeDisruptionScoring.getScoreBreakdown();
    }

    if (includeHistory === 'true') {
      result.history = realTimeDisruptionScoring.getScoreHistory(parseInt(historyHours));
    }

    console.log(`✅ API: Disruption score retrieved - ${result.score}/100 (${result.level})`);

    res.json({
      success: true,
      disruptionScore: result
    });

  } catch (error) {
    console.error('❌ API Error getting disruption score:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/intelligence/status
 * Get intelligence system status
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        intelligentAnalytics: { status: 'active', lastUpdate: new Date().toISOString() },
        predictiveModeling: { status: 'active', lastUpdate: new Date().toISOString() },
        serviceFrequencyIntelligence: { status: 'active', lastUpdate: new Date().toISOString() },
        historicalTrendAnalysis: { status: 'active', lastUpdate: new Date().toISOString() },
        realTimeDisruptionScoring: { 
          status: realTimeDisruptionScoring.isMonitoring ? 'monitoring' : 'idle',
          lastUpdate: realTimeDisruptionScoring.lastUpdate,
          currentScore: realTimeDisruptionScoring.getCurrentScore()
        }
      },
      systemHealth: 'operational',
      uptime: process.uptime(),
      capabilities: [
        'route_impact_analysis',
        'disruption_prediction',
        'frequency_optimization',
        'historical_trend_analysis',
        'real_time_scoring',
        'intelligent_recommendations'
      ]
    };

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('❌ API Error getting intelligence status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper function to generate overview summary
 */
function generateOverviewSummary(overview) {
  const summary = {
    overallRisk: 'LOW',
    keyMetrics: {},
    activeIssues: 0,
    predictions: 0,
    recommendations: 0
  };

  try {
    // Overall risk assessment
    if (overview.disruptionScore?.success && overview.disruptionScore.level) {
      summary.overallRisk = overview.disruptionScore.level;
    }

    // Key metrics
    if (overview.routeImpact?.success) {
      summary.keyMetrics.totalRoadworks = overview.routeImpact.analysis.totalRoadworks;
      summary.keyMetrics.routeImpacts = overview.routeImpact.analysis.routeImpacts.length;
      summary.activeIssues += overview.routeImpact.analysis.routeImpacts.length;
    }

    if (overview.frequencyImpact?.success) {
      summary.keyMetrics.affectedRoutes = overview.frequencyImpact.assessment.routeAnalysis.length;
      summary.keyMetrics.averageCapacityLoss = overview.frequencyImpact.assessment.overallImpact.averageCapacityLoss;
    }

    // Count predictions and recommendations
    summary.predictions = overview.alerts.length;
    summary.recommendations = overview.recommendations.length;

  } catch (error) {
    console.warn('⚠️ Error generating overview summary:', error.message);
  }

  return summary;
}

export default router;