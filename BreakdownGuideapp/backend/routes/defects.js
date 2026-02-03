// Fleet Intelligence / Trends & Defects Tracking System
// Analyzes breakdown patterns to identify repeat defects, trending issues, and predictive maintenance needs

import express from 'express';
import { from, query } from '../utils/queryHelpers.js';
import { activityLogger } from '../services/activityLogger.js';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate time period start date based on timeframe
 */
const getTimeframeStartDate = (timeframe) => {
  const now = new Date();

  switch (timeframe) {
    case '24h':
      now.setHours(now.getHours() - 24);
      break;
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    default:
      now.setHours(now.getHours() - 24);
  }

  return now.toISOString();
};

/**
 * Extract defect type from issue category or wizard assessment data
 */
const extractDefectType = (breakdown) => {
  // Primary source: issue_category
  if (breakdown.issue_category) {
    return breakdown.issue_category;
  }

  // Fallback to wizard_assessment_data
  const wizardData = breakdown.wizard_assessment_data || {};
  return wizardData.issueCategory || wizardData.issue_category || 'Unknown';
};

/**
 * Calculate severity score for defect prioritization
 */
const getSeverityScore = (severity) => {
  const severityMap = {
    'STOP': 3,
    'AMBER': 2,
    'CONTINUE': 1,
    'NORMAL': 1
  };

  return severityMap[severity] || 1;
};

/**
 * Determine trend direction based on current vs previous period
 */
const calculateTrend = (currentCount, previousCount) => {
  if (previousCount === 0) {
    return currentCount > 0 ? 'rising' : 'stable';
  }

  const changePercent = ((currentCount - previousCount) / previousCount) * 100;

  if (changePercent > 15) return 'rising';
  if (changePercent < -15) return 'falling';
  return 'stable';
};

/**
 * Get vehicle type from wizard assessment data or fleet data
 */
const getVehicleType = (breakdown) => {
  const wizardData = breakdown.wizard_assessment_data || {};
  return wizardData.vehicle_type || wizardData.vehicleType || 'Unknown';
};

// =====================================================
// REPEAT DEFECTS ANALYSIS
// =====================================================

/**
 * POST /api/defects/repeat
 * Identifies vehicles with repeat defects in a given timeframe
 *
 * Body: { timeframe: '24h' | '7d' | '30d' }
 * Returns: Array of vehicles with multiple defects
 */
router.post('/repeat', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.body;
    const startDate = getTimeframeStartDate(timeframe);

    console.log(`🔍 Analyzing repeat defects for timeframe: ${timeframe} (since ${startDate})`);

    // Get all breakdowns in the timeframe
    const { data: breakdowns, error } = await from('breakdowns')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    // Group breakdowns by fleet number
    const vehicleDefects = {};

    breakdowns.forEach(breakdown => {
      const fleetNo = breakdown.fleet_no || 'TBC';

      // Skip vehicles without fleet numbers
      if (fleetNo === 'TBC' || !fleetNo) return;

      if (!vehicleDefects[fleetNo]) {
        vehicleDefects[fleetNo] = {
          fleetNumber: fleetNo,
          registration: breakdown.registration || breakdown.wizard_assessment_data?.registration || null,
          depot: breakdown.depot || 'Unknown',
          vehicleType: getVehicleType(breakdown),
          defects: [],
          defectCount: 0,
          totalSeverityScore: 0
        };
      }

      const defectType = extractDefectType(breakdown);
      const severityScore = getSeverityScore(breakdown.severity);

      vehicleDefects[fleetNo].defects.push({
        breakdownId: breakdown.breakdown_id,
        type: defectType,
        date: breakdown.created_at,
        severity: breakdown.severity || 'NORMAL',
        severityScore,
        resolved: ['resolved', 'cleared', 'completed'].includes(breakdown.status),
        status: breakdown.status,
        location: breakdown.location_description || breakdown.location || 'Unknown',
        description: breakdown.description || breakdown.wizard_assessment_data?.description || null
      });

      vehicleDefects[fleetNo].defectCount++;
      vehicleDefects[fleetNo].totalSeverityScore += severityScore;
    });

    // Filter vehicles with 2+ defects (repeat defects)
    const repeatDefects = Object.values(vehicleDefects)
      .filter(vehicle => vehicle.defectCount >= 2)
      .map(vehicle => ({
        ...vehicle,
        averageSeverityScore: (vehicle.totalSeverityScore / vehicle.defectCount).toFixed(2),
        unresolvedCount: vehicle.defects.filter(d => !d.resolved).length
      }))
      .sort((a, b) => {
        // Sort by: 1) defect count (desc), 2) average severity (desc)
        if (b.defectCount !== a.defectCount) {
          return b.defectCount - a.defectCount;
        }
        return b.averageSeverityScore - a.averageSeverityScore;
      });

    console.log(`✅ Found ${repeatDefects.length} vehicles with repeat defects`);

    // Broadcast critical repeat defects (3+ defects) to WebSocket clients
    try {
      repeatDefects
        .filter(vehicle => vehicle.defectCount >= 3)
        .forEach(vehicle => {
          webSocketHandler.broadcastRepeatDefect(vehicle);
        });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast repeat defects:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.json({
      success: true,
      timeframe,
      startDate,
      totalVehiclesAnalyzed: Object.keys(vehicleDefects).length,
      repeatDefectVehicles: repeatDefects.length,
      vehicles: repeatDefects,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analysing repeat defects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyse repeat defects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// TRENDING DEFECTS ANALYSIS
// =====================================================

/**
 * POST /api/defects/trends
 * Analyzes trending defect types over time
 *
 * Body: { timeframe: string, groupByType: boolean }
 * Returns: Trending defect issues with change metrics
 */
router.post('/trends', async (req, res) => {
  try {
    const { timeframe = '7d', groupByType = true } = req.body;

    // Get current period data
    const currentPeriodStart = getTimeframeStartDate(timeframe);

    // Calculate comparison period (same duration, but previous time window)
    const timeframeDays = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
    const comparisonPeriodEnd = new Date(currentPeriodStart);
    const comparisonPeriodStart = new Date(comparisonPeriodEnd);

    if (timeframe === '24h') {
      comparisonPeriodStart.setHours(comparisonPeriodStart.getHours() - 24);
    } else {
      comparisonPeriodStart.setDate(comparisonPeriodStart.getDate() - timeframeDays);
    }

    console.log(`📊 Analyzing defect trends for ${timeframe}`);
    console.log(`   Current period: ${currentPeriodStart} to now`);
    console.log(`   Comparison period: ${comparisonPeriodStart.toISOString()} to ${comparisonPeriodEnd.toISOString()}`);

    // Get current period breakdowns
    const { data: currentBreakdowns, error: currentError } = await from('breakdowns')
      .select('*')
      .gte('created_at', currentPeriodStart)
      .execute();

    if (currentError) throw currentError;

    // Get comparison period breakdowns
    const { data: comparisonBreakdowns, error: comparisonError } = await from('breakdowns')
      .select('*')
      .gte('created_at', comparisonPeriodStart.toISOString())
      .lt('created_at', comparisonPeriodEnd.toISOString())
      .execute();

    if (comparisonError) throw comparisonError;

    // Count defects by type for current period
    const currentDefectCounts = {};
    const defectVehicleModels = {}; // Track which vehicle types are affected

    currentBreakdowns.forEach(breakdown => {
      const defectType = extractDefectType(breakdown);
      const vehicleType = getVehicleType(breakdown);

      currentDefectCounts[defectType] = (currentDefectCounts[defectType] || 0) + 1;

      if (!defectVehicleModels[defectType]) {
        defectVehicleModels[defectType] = new Set();
      }
      if (vehicleType !== 'Unknown') {
        defectVehicleModels[defectType].add(vehicleType);
      }
    });

    // Count defects by type for comparison period
    const comparisonDefectCounts = {};

    comparisonBreakdowns.forEach(breakdown => {
      const defectType = extractDefectType(breakdown);
      comparisonDefectCounts[defectType] = (comparisonDefectCounts[defectType] || 0) + 1;
    });

    // Calculate trends for each defect type
    const trends = Object.keys(currentDefectCounts).map(defectType => {
      const currentCount = currentDefectCounts[defectType];
      const previousCount = comparisonDefectCounts[defectType] || 0;
      const changePercent = previousCount === 0
        ? (currentCount > 0 ? 100 : 0)
        : ((currentCount - previousCount) / previousCount) * 100;

      const trend = calculateTrend(currentCount, previousCount);
      const affectedModels = Array.from(defectVehicleModels[defectType] || []);

      return {
        defectType,
        currentCount,
        previousCount,
        change: currentCount - previousCount,
        changePercent: Math.round(changePercent * 10) / 10, // Round to 1 decimal
        trend,
        affectedModels,
        priority: trend === 'rising' && currentCount >= 3 ? 'high' : 'normal'
      };
    });

    // Sort by current count (descending) to show most common issues first
    trends.sort((a, b) => b.currentCount - a.currentCount);

    console.log(`✅ Analyzed ${trends.length} defect types`);

    // Broadcast rising trends to WebSocket clients
    try {
      trends
        .filter(trend => trend.trend === 'rising' && trend.currentCount >= 3)
        .forEach(trend => {
          webSocketHandler.broadcastTrendUpdate(trend);
        });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast trend updates:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.json({
      success: true,
      timeframe,
      currentPeriod: {
        start: currentPeriodStart,
        end: new Date().toISOString(),
        totalDefects: currentBreakdowns.length
      },
      comparisonPeriod: {
        start: comparisonPeriodStart.toISOString(),
        end: comparisonPeriodEnd.toISOString(),
        totalDefects: comparisonBreakdowns.length
      },
      trends,
      risingTrends: trends.filter(t => t.trend === 'rising').length,
      fallingTrends: trends.filter(t => t.trend === 'falling').length,
      stableTrends: trends.filter(t => t.trend === 'stable').length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analysing defect trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyse defect trends',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// DEPOT STATISTICS
// =====================================================

/**
 * GET /api/defects/depot-stats
 * Returns defect statistics by depot
 *
 * Returns: Depot-level defect metrics and trends
 */
router.get('/depot-stats', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const startDate = getTimeframeStartDate(timeframe);

    console.log(`🏢 Analyzing depot defect statistics for ${timeframe}`);

    // Get breakdowns for the period
    const { data: breakdowns, error } = await from('breakdowns')
      .select('*')
      .gte('created_at', startDate)
      .execute();

    if (error) throw error;

    // Get fleet vehicle counts by depot (approximate based on data)
    const depotVehicleCounts = {
      'Washington': 200,
      'Riverside': 180,
      'Consett': 120,
      'Deptford': 150,
      'Percy Main': 100,
      'Hexham': 80,
      'SDC': 50, // Control centre
      'Unknown': 0
    };

    // Group breakdowns by depot
    const depotStats = {};

    breakdowns.forEach(breakdown => {
      const depot = breakdown.depot || 'Unknown';
      const defectType = extractDefectType(breakdown);

      if (!depotStats[depot]) {
        depotStats[depot] = {
          name: depot,
          defectCount: 0,
          defectTypes: {},
          vehicleCount: depotVehicleCounts[depot] || 0,
          severityScores: []
        };
      }

      depotStats[depot].defectCount++;
      depotStats[depot].defectTypes[defectType] = (depotStats[depot].defectTypes[defectType] || 0) + 1;
      depotStats[depot].severityScores.push(getSeverityScore(breakdown.severity));
    });

    // Calculate defect rates and identify top issues
    const depotStatistics = Object.values(depotStats).map(depot => {
      const defectRate = depot.vehicleCount > 0
        ? ((depot.defectCount / depot.vehicleCount) * 100).toFixed(2)
        : 0;

      const topIssue = Object.entries(depot.defectTypes)
        .sort((a, b) => b[1] - a[1])[0];

      const avgSeverity = depot.severityScores.length > 0
        ? (depot.severityScores.reduce((a, b) => a + b, 0) / depot.severityScores.length).toFixed(2)
        : 0;

      // Determine trend based on defect rate (simplified - could be enhanced with historical data)
      const trend = defectRate > 15 ? 'rising' : defectRate < 5 ? 'falling' : 'stable';

      return {
        name: depot.name,
        defectCount: depot.defectCount,
        defectRate: parseFloat(defectRate),
        trend,
        topIssue: topIssue ? topIssue[0] : 'None',
        topIssueCount: topIssue ? topIssue[1] : 0,
        vehicleCount: depot.vehicleCount,
        averageSeverity: parseFloat(avgSeverity),
        defectTypes: depot.defectTypes
      };
    });

    // Sort by defect rate (descending)
    depotStatistics.sort((a, b) => b.defectRate - a.defectRate);

    console.log(`✅ Analyzed ${depotStatistics.length} depots`);

    // Broadcast depot stats with rising trends or high defect rates
    try {
      depotStatistics
        .filter(depot => depot.trend === 'rising' || depot.defectRate > 15)
        .forEach(depot => {
          webSocketHandler.broadcastDepotStats(depot);
        });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast depot stats:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.json({
      success: true,
      timeframe,
      startDate,
      depots: depotStatistics,
      totalDefects: breakdowns.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching depot defect stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// PREDICTIVE MAINTENANCE ALERTS
// =====================================================

/**
 * GET /api/defects/predictive
 * Generates predictive maintenance alerts based on defect patterns
 *
 * Returns: Predictive alerts for proactive maintenance
 */
router.get('/predictive', async (req, res) => {
  try {
    console.log('🔮 Generating predictive maintenance alerts');

    // Get last 30 days of data for pattern analysis
    const startDate = getTimeframeStartDate('30d');

    const { data: breakdowns, error } = await from('breakdowns')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    const alerts = [];

    // Pattern 1: Vehicles with 3+ defects in 30 days (high failure rate)
    const vehicleDefects = {};
    breakdowns.forEach(breakdown => {
      const fleetNo = breakdown.fleet_no;
      if (!fleetNo || fleetNo === 'TBC') return;

      vehicleDefects[fleetNo] = vehicleDefects[fleetNo] || [];
      vehicleDefects[fleetNo].push(breakdown);
    });

    Object.entries(vehicleDefects).forEach(([fleetNo, defects]) => {
      if (defects.length >= 3) {
        alerts.push({
          type: 'maintenance',
          priority: 'high',
          message: `Vehicle ${fleetNo} has ${defects.length} defects in 30 days - schedule preventive maintenance`,
          vehicles: [fleetNo],
          defectCount: defects.length,
          recommendation: 'Schedule comprehensive inspection and preventive maintenance',
          estimatedCost: 'Medium-High',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Pattern 2: Recurring defect types across fleet
    const defectTypeCounts = {};
    breakdowns.forEach(breakdown => {
      const defectType = extractDefectType(breakdown);
      defectTypeCounts[defectType] = defectTypeCounts[defectType] || [];
      defectTypeCounts[defectType].push(breakdown.fleet_no);
    });

    Object.entries(defectTypeCounts).forEach(([defectType, vehicles]) => {
      if (vehicles.length >= 5) {
        const uniqueVehicles = [...new Set(vehicles.filter(v => v && v !== 'TBC'))];

        alerts.push({
          type: 'pattern',
          priority: 'medium',
          message: `${defectType} affecting ${uniqueVehicles.length} vehicles - potential fleet-wide issue`,
          vehicles: uniqueVehicles.slice(0, 10), // Limit to first 10
          defectType,
          affectedCount: uniqueVehicles.length,
          recommendation: 'Investigate common cause and implement fleet-wide preventive measures',
          estimatedCost: 'High',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Pattern 3: Weather-related defects (simplified example)
    const recentDefects = breakdowns.slice(0, 20);
    const weatherRelatedKeywords = ['electrical', 'battery', 'heating', 'cooling', 'window'];
    const weatherRelated = recentDefects.filter(b => {
      const defectType = extractDefectType(b).toLowerCase();
      return weatherRelatedKeywords.some(keyword => defectType.includes(keyword));
    });

    if (weatherRelated.length >= 3) {
      alerts.push({
        type: 'weather',
        priority: 'low',
        message: `${weatherRelated.length} weather-related defects detected - prepare for seasonal maintenance`,
        vehicles: weatherRelated.map(b => b.fleet_no).filter(v => v && v !== 'TBC').slice(0, 5),
        recommendation: 'Review climate control systems and electrical systems fleet-wide',
        estimatedCost: 'Low-Medium',
        createdAt: new Date().toISOString()
      });
    }

    // Sort alerts by priority
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`✅ Generated ${alerts.length} predictive maintenance alerts`);

    // Broadcast high and medium priority alerts to WebSocket clients
    try {
      alerts
        .filter(alert => alert.priority === 'high' || alert.priority === 'medium')
        .forEach(alert => {
          webSocketHandler.broadcastPredictiveAlert(alert);
        });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast predictive alerts:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.json({
      success: true,
      alertCount: alerts.length,
      alerts,
      analysisRange: {
        start: startDate,
        end: new Date().toISOString(),
        daysAnalyzed: 30
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating predictive alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictive alerts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// DEFECT ESCALATION
// =====================================================

/**
 * POST /api/defects/escalate
 * Escalates critical defects to management via email/notification
 *
 * Body: { vehicleId, defects, escalationType, recipient, cc }
 * Returns: Escalation confirmation
 */
router.post('/escalate', async (req, res) => {
  try {
    const {
      vehicleId,
      fleetNumber,
      defects = [],
      escalationType = 'email',
      recipient,
      cc = [],
      message,
      priority = 'high'
    } = req.body;

    // Validate required fields
    if (!vehicleId && !fleetNumber) {
      return res.status(400).json({
        success: false,
        error: 'Either vehicleId or fleetNumber is required'
      });
    }

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient is required'
      });
    }

    console.log(`📧 Escalating defects for vehicle ${vehicleId || fleetNumber} to ${recipient}`);

    // Log the escalation
    const escalationData = {
      vehicleId: vehicleId || fleetNumber,
      defects,
      escalationType,
      recipient,
      cc,
      message,
      priority,
      escalatedBy: req.supervisor?.name || req.user?.email || 'System',
      escalatedAt: new Date().toISOString()
    };

    // Log activity
    await activityLogger.logActivity({
      activityType: 'defect_escalated',
      action: `escalated defects for vehicle ${vehicleId || fleetNumber}`,
      actorType: 'supervisor',
      actorId: req.supervisor?.id || req.user?.id || 'system',
      actorName: req.supervisor?.name || req.user?.email || 'System',
      entityType: 'vehicle',
      entityId: vehicleId || fleetNumber,
      entityDetails: {
        defectCount: defects.length,
        recipient,
        priority
      },
      severity: priority === 'critical' ? 'critical' : 'warning',
      source: 'fleet_intelligence',
      metadata: escalationData
    });

    // In production, this would send an actual email via SendGrid/SES/etc.
    // For now, we'll simulate the escalation
    const simulatedEmailContent = {
      to: recipient,
      cc,
      from: 'noreply@gobarry.co.uk',
      subject: `[${priority.toUpperCase()}] Fleet Defect Escalation - Vehicle ${vehicleId || fleetNumber}`,
      body: `
Dear ${recipient},

This is an automated escalation notice for critical defects identified on vehicle ${vehicleId || fleetNumber}.

Defect Summary:
${defects.map((d, i) => `${i + 1}. ${d.type || d.defectType} - ${d.severity || 'NORMAL'} (${d.date || 'Recent'})`).join('\n')}

Additional Message:
${message || 'No additional notes provided.'}

Priority: ${priority.toUpperCase()}
Escalated By: ${req.supervisor?.name || req.user?.email || 'System'}
Escalated At: ${new Date().toISOString()}

Please review and take appropriate action.

the operator - Breakdown Management System
      `.trim()
    };

    console.log('📧 Email content prepared (not sent in development):', simulatedEmailContent.subject);

    // Broadcast escalation to WebSocket clients
    try {
      webSocketHandler.broadcastDefectEscalation(escalationData);
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast defect escalation:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.json({
      success: true,
      message: 'Defect escalation successful',
      escalation: {
        id: `ESC-${Date.now()}`,
        ...escalationData,
        status: 'sent',
        emailPreview: process.env.NODE_ENV === 'development' ? simulatedEmailContent : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error escalating defects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate defects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// REPORT GENERATION
// =====================================================

/**
 * POST /api/defects/report
 * Generates comprehensive defect analysis report
 *
 * Body: { timeframe, includeRepeatDefects, includeTrends, includeDepotStats, includePredictive }
 * Returns: Report data (PDF generation would happen client-side)
 */
router.post('/report', async (req, res) => {
  try {
    const {
      timeframe = '30d',
      includeRepeatDefects = true,
      includeTrends = true,
      includeDepotStats = true,
      includePredictive = true,
      format = 'json' // Future: 'pdf', 'csv'
    } = req.body;

    console.log(`📊 Generating defect analysis report for ${timeframe}`);

    const report = {
      title: 'Fleet Intelligence - Defect Analysis Report',
      generatedAt: new Date().toISOString(),
      generatedBy: req.supervisor?.name || req.user?.email || 'System',
      timeframe,
      sections: {}
    };

    // Section 1: Repeat Defects Analysis
    if (includeRepeatDefects) {
      const startDate = getTimeframeStartDate(timeframe);
      const { data: breakdowns } = await from('breakdowns')
        .select('*')
        .gte('created_at', startDate)
        .execute();

      const vehicleDefects = {};
      breakdowns.forEach(breakdown => {
        const fleetNo = breakdown.fleet_no;
        if (!fleetNo || fleetNo === 'TBC') return;

        if (!vehicleDefects[fleetNo]) {
          vehicleDefects[fleetNo] = {
            fleetNumber: fleetNo,
            defects: []
          };
        }

        vehicleDefects[fleetNo].defects.push({
          type: extractDefectType(breakdown),
          date: breakdown.created_at,
          severity: breakdown.severity
        });
      });

      const repeatDefects = Object.values(vehicleDefects)
        .filter(v => v.defects.length >= 2)
        .sort((a, b) => b.defects.length - a.defects.length);

      report.sections.repeatDefects = {
        totalVehicles: repeatDefects.length,
        vehicles: repeatDefects
      };
    }

    // Section 2: Trending Issues
    if (includeTrends) {
      // Simplified - use existing trends endpoint logic
      report.sections.trends = {
        summary: 'Defect trends over selected timeframe',
        note: 'Use /api/defects/trends endpoint for detailed trend analysis'
      };
    }

    // Section 3: Depot Statistics
    if (includeDepotStats) {
      report.sections.depotStats = {
        summary: 'Depot-level defect statistics',
        note: 'Use /api/defects/depot-stats endpoint for detailed depot analysis'
      };
    }

    // Section 4: Predictive Alerts
    if (includePredictive) {
      report.sections.predictiveAlerts = {
        summary: 'Data-driven predictive maintenance recommendations based on fleet analysis',
        note: 'Use /api/defects/predictive endpoint for detailed predictive analysis'
      };
    }

    // Add summary statistics
    const startDate = getTimeframeStartDate(timeframe);
    const { data: allBreakdowns } = await from('breakdowns')
      .select('*')
      .gte('created_at', startDate)
      .execute();

    report.summary = {
      totalDefects: allBreakdowns.length,
      timeframe,
      analysisStartDate: startDate,
      analysisEndDate: new Date().toISOString(),
      daysAnalyzed: timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
    };

    console.log('✅ Report generated successfully');

    // Log activity
    await activityLogger.logActivity({
      activityType: 'report_generated',
      action: `generated defect analysis report (${timeframe})`,
      actorType: 'supervisor',
      actorId: req.supervisor?.id || req.user?.id || 'system',
      actorName: req.supervisor?.name || req.user?.email || 'System',
      entityType: 'report',
      entityId: `DEFECT-REPORT-${Date.now()}`,
      severity: 'info',
      source: 'fleet_intelligence',
      metadata: {
        timeframe,
        sectionsIncluded: Object.keys(report.sections)
      }
    });

    res.json({
      success: true,
      report,
      format,
      downloadUrl: null, // Future: Generate PDF and return download URL
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating defect report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate defect report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// MAINTENANCE NOTIFICATIONS
// =====================================================

/**
 * POST /api/defects/notifications/maintenance
 * Sends notification to maintenance team about defects
 *
 * Body: { type, priority, vehicles, message }
 * Returns: Notification confirmation
 */
router.post('/notifications/maintenance', async (req, res) => {
  try {
    const {
      type = 'general',
      priority = 'normal',
      vehicles = [],
      message,
      depot,
      notifyEngineering = true,
      notifyManagement = false
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log(`🔔 Sending maintenance notification: ${type} (${priority})`);

    // Prepare notification data
    const notificationData = {
      id: `MAINT-NOTIF-${Date.now()}`,
      type,
      priority,
      vehicles,
      message,
      depot: depot || 'All Depots',
      notifyEngineering,
      notifyManagement,
      sentBy: req.supervisor?.name || req.user?.email || 'System',
      sentAt: new Date().toISOString()
    };

    // Log activity
    await activityLogger.logActivity({
      activityType: 'maintenance_notification_sent',
      action: `sent maintenance notification (${type})`,
      actorType: 'supervisor',
      actorId: req.supervisor?.id || req.user?.id || 'system',
      actorName: req.supervisor?.name || req.user?.email || 'System',
      entityType: 'notification',
      entityId: notificationData.id,
      severity: priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : 'info',
      depot: depot || 'All Depots',
      source: 'fleet_intelligence',
      metadata: notificationData
    });

    // In production, this would trigger actual notifications
    // (Email, SMS, push notifications, etc.)
    console.log('✅ Maintenance notification logged successfully');

    res.json({
      success: true,
      message: 'Maintenance notification sent successfully',
      notification: notificationData,
      recipients: {
        engineering: notifyEngineering,
        management: notifyManagement,
        depot: depot || 'All Depots'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send maintenance notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================================================
// VEHICLE DEFECT HISTORY
// =====================================================

/**
 * GET /api/defects/vehicle/:fleetNumber
 * Returns complete defect history for a specific vehicle
 *
 * Returns: All defects for the vehicle with trend analysis
 */
router.get('/vehicle/:fleetNumber', async (req, res) => {
  try {
    const { fleetNumber } = req.params;
    const { limit = 50, includeResolved = true } = req.query;

    console.log(`📋 Fetching defect history for vehicle ${fleetNumber}`);

    // Build the query
    let queryBuilder = from('breakdowns')
      .eq('fleet_no', fleetNumber)
      .order('created_at', 'DESC')
      .limit(parseInt(limit));

    // Note: MySQL doesn't have a direct NOT IN equivalent in our query builder
    // We'll fetch all and filter if needed
    const { data: allBreakdowns, error } = await queryBuilder.execute();

    if (error) throw error;

    // Filter out resolved if requested
    const breakdowns = includeResolved
      ? allBreakdowns
      : allBreakdowns.filter(b => !['resolved', 'cleared', 'completed'].includes(b.status));

    // Analyze defect patterns
    const defectTypes = {};
    const defectsByMonth = {};
    let totalSeverityScore = 0;

    breakdowns.forEach(breakdown => {
      const defectType = extractDefectType(breakdown);
      defectTypes[defectType] = (defectTypes[defectType] || 0) + 1;

      const month = new Date(breakdown.created_at).toISOString().substring(0, 7);
      defectsByMonth[month] = (defectsByMonth[month] || 0) + 1;

      totalSeverityScore += getSeverityScore(breakdown.severity);
    });

    const mostCommonDefect = Object.entries(defectTypes)
      .sort((a, b) => b[1] - a[1])[0];

    res.json({
      success: true,
      fleetNumber,
      totalDefects: breakdowns.length,
      averageSeverity: breakdowns.length > 0
        ? (totalSeverityScore / breakdowns.length).toFixed(2)
        : 0,
      mostCommonDefect: mostCommonDefect ? {
        type: mostCommonDefect[0],
        count: mostCommonDefect[1]
      } : null,
      defectTypes,
      defectsByMonth,
      defects: breakdowns.map(b => ({
        breakdownId: b.breakdown_id,
        type: extractDefectType(b),
        date: b.created_at,
        severity: b.severity,
        status: b.status,
        location: b.location_description || b.location,
        resolved: ['resolved', 'cleared', 'completed'].includes(b.status)
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching vehicle defect history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle defect history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
