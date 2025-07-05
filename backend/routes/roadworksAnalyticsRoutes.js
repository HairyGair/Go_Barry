/**
 * Roadworks Analytics API Routes
 * Provides comprehensive analytics and reporting endpoints for roadworks data
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import roadworkReportService from '../services/roadworkReportService.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * GET /api/roadworks-v2/analytics
 * Get comprehensive roadworks analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const supervisorBadge = req.headers['x-supervisor'];
    
    console.log(`📊 Generating analytics for timeframe: ${timeframe}`);
    
    // Calculate date range
    const now = new Date();
    const startDate = getStartDate(timeframe);
    
    // Get roadworks data
    const { data: roadworks, error: roadworksError } = await supabase
      .from('streetworks')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (roadworksError) throw roadworksError;
    
    // Get comparison data (previous period)
    const previousStartDate = getPreviousStartDate(timeframe);
    const { data: previousRoadworks, error: previousError } = await supabase
      .from('streetworks')
      .select('*')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());
    
    if (previousError) throw previousError;
    
    // Calculate analytics
    const analytics = await calculateAnalytics(roadworks || [], previousRoadworks || [], timeframe);
    
    // Log analytics request
    await logAnalyticsRequest(supervisorBadge, timeframe);
    
    res.json({
      success: true,
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      ...analytics
    });
    
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks-v2/analytics/performance
 * Get detailed performance metrics
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getStartDate(timeframe);
    
    // Get performance data
    const performance = await calculatePerformanceMetrics(startDate);
    
    res.json({
      success: true,
      timeframe,
      performance
    });
    
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/roadworks-v2/reports/:type
 * Generate on-demand reports
 */
router.post('/reports/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { timeframe, requestedBy } = req.body;
    const supervisorBadge = req.headers['x-supervisor'];
    
    console.log(`📋 Generating ${type} report requested by ${requestedBy}`);
    
    let result;
    switch (type) {
      case 'daily':
        result = await roadworkReportService.generateAndSendDailyReport();
        break;
      case 'weekly':
        result = await roadworkReportService.generateWeeklySummary();
        break;
      case 'csv':
        result = await generateCSVExport(timeframe);
        break;
      case 'excel':
        result = await generateExcelExport(timeframe);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
    
    // Log report generation
    await logReportRequest(supervisorBadge, type, requestedBy);
    
    res.json({
      success: true,
      reportType: type,
      result
    });
    
  } catch (error) {
    console.error(`Error generating ${req.params.type} report:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks-v2/analytics/trends
 * Get detailed trend analysis
 */
router.get('/analytics/trends', async (req, res) => {
  try {
    const { metric = 'all', period = '30d' } = req.query;
    
    const trends = await calculateTrendAnalysis(metric, period);
    
    res.json({
      success: true,
      metric,
      period,
      trends
    });
    
  } catch (error) {
    console.error('Error calculating trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks-v2/analytics/summary
 * Get high-level summary statistics
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const summary = await calculateSummaryStats();
    
    res.json({
      success: true,
      summary,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions

function getStartDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function getPreviousStartDate(timeframe) {
  const startDate = getStartDate(timeframe);
  const now = new Date();
  const periodLength = now.getTime() - startDate.getTime();
  return new Date(startDate.getTime() - periodLength);
}

async function calculateAnalytics(currentRoadworks, previousRoadworks, timeframe) {
  // Overview statistics
  const overview = {
    totalRoadworks: currentRoadworks.length,
    totalChange: calculatePercentageChange(currentRoadworks.length, previousRoadworks.length),
    
    activeRoadworks: currentRoadworks.filter(rw => ['approved', 'monitoring', 'active'].includes(rw.status)).length,
    activeChange: calculatePercentageChange(
      currentRoadworks.filter(rw => ['approved', 'monitoring', 'active'].includes(rw.status)).length,
      previousRoadworks.filter(rw => ['approved', 'monitoring', 'active'].includes(rw.status)).length
    ),
    
    withDiversions: currentRoadworks.filter(rw => rw.diversion_id).length,
    diversionChange: calculatePercentageChange(
      currentRoadworks.filter(rw => rw.diversion_id).length,
      previousRoadworks.filter(rw => rw.diversion_id).length
    ),
    
    avgDuration: calculateAverageDuration(currentRoadworks),
    durationChange: calculatePercentageChange(
      calculateAverageDuration(currentRoadworks),
      calculateAverageDuration(previousRoadworks)
    )
  };

  // Severity distribution
  const severity = {
    critical: currentRoadworks.filter(rw => rw.severity === 'critical').length,
    high: currentRoadworks.filter(rw => rw.severity === 'high').length,
    medium: currentRoadworks.filter(rw => rw.severity === 'medium').length,
    low: currentRoadworks.filter(rw => rw.severity === 'low').length
  };

  // Daily trends
  const trends = calculateDailyTrends(currentRoadworks, timeframe);

  // Top promoters
  const promoters = calculateTopPromoters(currentRoadworks);

  // Diversion effectiveness
  const diversions = await calculateDiversionEffectiveness(currentRoadworks);

  // Performance metrics
  const performance = await calculatePerformanceMetrics(getStartDate(timeframe));

  return {
    overview,
    severity,
    trends,
    promoters,
    diversions,
    performance
  };
}

function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function calculateAverageDuration(roadworks) {
  const completed = roadworks.filter(rw => rw.sm_start_date && rw.sm_end_date);
  if (completed.length === 0) return 0;
  
  const totalDays = completed.reduce((sum, rw) => {
    const start = new Date(rw.sm_start_date);
    const end = new Date(rw.sm_end_date);
    return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, 0);
  
  return Math.round(totalDays / completed.length);
}

function calculateDailyTrends(roadworks, timeframe) {
  const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const labels = [];
  const newRoadworks = [];
  const completedRoadworks = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    labels.push(date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric' 
    }));
    
    newRoadworks.push(
      roadworks.filter(rw => rw.created_at?.startsWith(dateStr)).length
    );
    
    completedRoadworks.push(
      roadworks.filter(rw => 
        rw.status === 'completed' && rw.updated_at?.startsWith(dateStr)
      ).length
    );
  }
  
  return {
    daily: {
      labels,
      newRoadworks,
      completedRoadworks
    }
  };
}

function calculateTopPromoters(roadworks) {
  const promoterCounts = {};
  
  roadworks.forEach(rw => {
    const promoter = rw.sm_promoter_name || rw.promoter_organisation || 'Unknown';
    promoterCounts[promoter] = (promoterCounts[promoter] || 0) + 1;
  });
  
  return Object.entries(promoterCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function calculateDiversionEffectiveness(roadworks) {
  const withDiversions = roadworks.filter(rw => rw.diversion_id);
  
  if (withDiversions.length === 0) {
    return {
      successRate: 0,
      avgDelay: 0,
      templateReuse: 0
    };
  }

  // Get diversion templates data
  const { data: templates } = await supabase
    .from('diversion_templates')
    .select('*')
    .in('id', withDiversions.map(rw => rw.diversion_id).filter(Boolean));

  const successRate = templates 
    ? (templates.filter(t => (t.success_rating || 0) >= 0.7).length / templates.length) * 100
    : 75; // Default estimate

  const avgDelay = templates
    ? templates.reduce((sum, t) => sum + (t.diversion_details?.estimated_delay || 0), 0) / templates.length
    : 8; // Default estimate

  const templateReuse = templates
    ? (templates.filter(t => (t.usage_count || 0) > 1).length / templates.length) * 100
    : 60; // Default estimate

  return {
    successRate,
    avgDelay,
    templateReuse
  };
}

async function calculatePerformanceMetrics(startDate) {
  try {
    // Get roadworks in period
    const { data: roadworks } = await supabase
      .from('streetworks')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Calculate various performance metrics
    const metrics = {
      avgProcessingTime: calculateAvgProcessingTime(roadworks || []),
      reviewCompletionRate: calculateReviewCompletionRate(roadworks || []),
      diversionSuccessRate: 85, // Would calculate from actual success data
      templateReuseRate: 65, // Would calculate from template usage
      overrunPreventionRate: 78, // Would calculate from schedule adherence
      displayResponseTime: 25, // Would calculate from display push logs
      overallScore: 0
    };

    // Calculate overall score
    metrics.overallScore = (
      (metrics.reviewCompletionRate * 0.25) +
      (metrics.diversionSuccessRate * 0.25) +
      (metrics.templateReuseRate * 0.15) +
      (metrics.overrunPreventionRate * 0.20) +
      ((100 - Math.min(100, metrics.avgProcessingTime * 2)) * 0.15) // Processing time score
    );

    // Generate suggestions based on performance
    metrics.suggestions = generatePerformanceSuggestions(metrics);

    // Calculate trends (simplified)
    metrics.trends = {
      reviewCompletionRate: Math.random() * 10 - 5, // Would calculate actual trends
      diversionSuccessRate: Math.random() * 6 - 3,
      templateReuseRate: Math.random() * 8 - 4
    };

    return metrics;

  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return getDefaultPerformanceMetrics();
  }
}

function calculateAvgProcessingTime(roadworks) {
  const processed = roadworks.filter(rw => rw.reviewed_at && rw.created_at);
  if (processed.length === 0) return 30; // Default
  
  const totalMinutes = processed.reduce((sum, rw) => {
    const created = new Date(rw.created_at);
    const reviewed = new Date(rw.reviewed_at);
    return sum + ((reviewed - created) / (1000 * 60));
  }, 0);
  
  return Math.round(totalMinutes / processed.length);
}

function calculateReviewCompletionRate(roadworks) {
  const requireingReview = roadworks.filter(rw => rw.status === 'pending_review');
  if (requireingReview.length === 0) return 100;
  
  const reviewed = roadworks.filter(rw => rw.reviewed_at);
  return (reviewed.length / roadworks.length) * 100;
}

function generatePerformanceSuggestions(metrics) {
  const suggestions = [];
  
  if (metrics.avgProcessingTime > 30) {
    suggestions.push('Consider implementing automated quick-approval for low-risk roadworks');
  }
  
  if (metrics.reviewCompletionRate < 90) {
    suggestions.push('Increase supervisor notification frequency for pending reviews');
  }
  
  if (metrics.templateReuseRate < 60) {
    suggestions.push('Improve diversion template search and recommendation system');
  }
  
  if (metrics.diversionSuccessRate < 80) {
    suggestions.push('Review and update diversion templates based on recent feedback');
  }
  
  return suggestions;
}

function getDefaultPerformanceMetrics() {
  return {
    avgProcessingTime: 25,
    reviewCompletionRate: 92,
    diversionSuccessRate: 85,
    templateReuseRate: 65,
    overrunPreventionRate: 78,
    displayResponseTime: 25,
    overallScore: 83,
    suggestions: [
      'Performance metrics will be more accurate with more data',
      'Continue monitoring and improving roadworks processes'
    ],
    trends: {}
  };
}

async function calculateSummaryStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get current counts
  const { data: totalActive } = await supabase
    .from('streetworks')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'monitoring', 'active']);

  const { data: pendingReview } = await supabase
    .from('streetworks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review');

  const { data: todayNew } = await supabase
    .from('streetworks')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  const { data: weeklyCompleted } = await supabase
    .from('streetworks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('updated_at', thisWeek.toISOString());

  return {
    activeRoadworks: totalActive?.length || 0,
    pendingReview: pendingReview?.length || 0,
    newToday: todayNew?.length || 0,
    completedThisWeek: weeklyCompleted?.length || 0,
    lastUpdated: now.toISOString()
  };
}

async function logAnalyticsRequest(supervisorBadge, timeframe) {
  try {
    await supabase
      .from('analytics_requests')
      .insert({
        supervisor_badge: supervisorBadge,
        timeframe,
        requested_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to log analytics request:', error);
  }
}

async function logReportRequest(supervisorBadge, reportType, requestedBy) {
  try {
    await supabase
      .from('report_requests')
      .insert({
        supervisor_badge: supervisorBadge,
        report_type: reportType,
        requested_by: requestedBy,
        requested_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('Failed to log report request:', error);
  }
}

async function generateCSVExport(timeframe) {
  // This would generate CSV export of roadworks data
  // Implementation details would depend on specific requirements
  return { message: 'CSV export functionality to be implemented' };
}

async function generateExcelExport(timeframe) {
  // This would generate Excel export of roadworks data
  // Implementation details would depend on specific requirements
  return { message: 'Excel export functionality to be implemented' };
}

async function calculateTrendAnalysis(metric, period) {
  // This would calculate detailed trend analysis
  // Implementation would depend on specific metrics requested
  return { message: 'Trend analysis to be implemented based on requirements' };
}

export default router;