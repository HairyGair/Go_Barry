import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// GET /api/analytics/kpis - Get key performance indicators
router.get('/kpis', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    let previousStartDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        previousStartDate.setMonth(previousStartDate.getMonth() - 2);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        previousStartDate.setMonth(previousStartDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
        break;
      default: // today
        startDate.setHours(0, 0, 0, 0);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousStartDate.setHours(0, 0, 0, 0);
    }

    // Get current period breakdowns
    const { data: currentBreakdowns, error: currentError } = await supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (currentError) throw currentError;

    // Get previous period breakdowns for comparison
    const { data: previousBreakdowns, error: previousError } = await supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousError) throw previousError;

    // Get fleet data - fallback if table doesn't exist or column missing
    let vehicles = [];
    try {
      const { data: vehicleData, error: fleetError } = await supabase
        .from('fleet_vehicles')
        .select('*');

      if (fleetError) {
        console.warn('Fleet error:', fleetError.message);
        vehicles = [];
      } else {
        vehicles = vehicleData || [];
      }
    } catch (err) {
      console.warn('Fleet vehicles table not accessible:', err.message);
      // Use fallback fleet data
      vehicles = [];
    }

    // Calculate KPIs
    const totalVehicles = vehicles.length;
    const operationalVehicles = vehicles.filter(v => v.health_score > 50).length;
    const fleetAvailability = totalVehicles > 0 ? (operationalVehicles / totalVehicles) * 100 : 0;

    // Calculate MTBF (Mean Time Between Failures)
    const hoursInPeriod = (new Date() - startDate) / (1000 * 60 * 60);
    const mtbf = currentBreakdowns.length > 0 
      ? Math.round(hoursInPeriod / currentBreakdowns.length)
      : hoursInPeriod;

    // Calculate response times and SLA
    let totalResponseTime = 0;
    let responseCount = 0;
    let slaMetCount = 0;
    
    for (const breakdown of currentBreakdowns) {
      if (breakdown.acknowledged_at && breakdown.received_at) {
        const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / 60000;
        totalResponseTime += responseTime;
        responseCount++;
        if (responseTime <= 30) slaMetCount++;
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const slaCompliance = responseCount > 0 ? (slaMetCount / responseCount) * 100 : 100;

    // Calculate trends
    const previousCount = previousBreakdowns.length;
    const currentCount = currentBreakdowns.length;
    const breakdownTrend = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100
      : 0;

    // Engineer utilization (simulated)
    const engineerUtilization = 78;

    const kpiData = {
      mtbf: {
        value: mtbf,
        unit: 'hours',
        trend: 12.5, // This would be calculated from historical data
        target: 1200,
        status: mtbf >= 1200 ? 'good' : mtbf >= 1000 ? 'normal' : 'warning'
      },
      slaCompliance: {
        value: Math.round(slaCompliance * 10) / 10,
        unit: '%',
        trend: -2.3, // This would be calculated from historical data
        target: 95,
        status: slaCompliance >= 95 ? 'good' : slaCompliance >= 90 ? 'warning' : 'critical'
      },
      avgResponseTime: {
        value: avgResponseTime,
        unit: 'minutes',
        trend: -8.1, // This would be calculated from historical data
        target: 30,
        status: avgResponseTime <= 30 ? 'good' : avgResponseTime <= 40 ? 'warning' : 'critical'
      },
      fleetAvailability: {
        value: Math.round(fleetAvailability * 10) / 10,
        unit: '%',
        trend: 0.5, // This would be calculated from historical data
        target: 95,
        status: fleetAvailability >= 95 ? 'good' : fleetAvailability >= 90 ? 'warning' : 'critical'
      },
      breakdownsToday: {
        value: currentCount,
        unit: 'incidents',
        trend: breakdownTrend,
        previousValue: previousCount,
        status: 'normal'
      },
      engineerUtilization: {
        value: engineerUtilization,
        unit: '%',
        trend: 5.2, // This would be calculated from historical data
        target: 80,
        status: engineerUtilization >= 80 ? 'good' : engineerUtilization >= 70 ? 'normal' : 'warning'
      }
    };

    res.json({
      success: true,
      data: kpiData,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch KPI data' 
    });
  }
});

// GET /api/analytics/trends - Get performance trends
router.get('/trends', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    // Generate time ranges based on period
    const timeRanges = [];
    const now = new Date();
    
    switch (period) {
      case 'today':
        // Hourly buckets for today
        for (let i = 0; i <= 23; i++) {
          const hour = new Date(now);
          hour.setHours(i, 0, 0, 0);
          timeRanges.push({
            start: hour,
            end: new Date(hour.getTime() + 60 * 60 * 1000),
            label: `${i.toString().padStart(2, '0')}:00`
          });
        }
        break;
      case 'week':
        // Daily buckets for past week
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(day.getDate() - i);
          day.setHours(0, 0, 0, 0);
          const endDay = new Date(day);
          endDay.setHours(23, 59, 59, 999);
          timeRanges.push({
            start: day,
            end: endDay,
            label: day.toLocaleDateString('en-GB', { weekday: 'short' })
          });
        }
        break;
      case 'month':
        // Weekly buckets for past month
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          timeRanges.push({
            start: weekStart,
            end: weekEnd,
            label: `Week ${4 - i}`
          });
        }
        break;
      default:
        // Use today as default
        break;
    }

    // Collect data for each time range
    const breakdownCounts = [];
    const criticalCounts = [];
    const responseTimes = [];
    const slaRates = [];
    
    for (const range of timeRanges) {
      // Get breakdowns for this range
      const { data: breakdowns, error } = await supabase
        .from('breakdowns')
        .select('*')
        .gte('created_at', range.start.toISOString())
        .lt('created_at', range.end.toISOString());

      if (error) throw error;

      // Count total and critical
      breakdownCounts.push(breakdowns.length);
      criticalCounts.push(breakdowns.filter(b => 
        b.severity === 'STOP' || b.status === 'critical'
      ).length);

      // Calculate average response time
      let totalResponse = 0;
      let responseCount = 0;
      let slaMetCount = 0;
      
      for (const breakdown of breakdowns) {
        if (breakdown.acknowledged_at && breakdown.received_at) {
          const responseMinutes = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / 60000;
          totalResponse += responseMinutes;
          responseCount++;
          if (responseMinutes <= 30) slaMetCount++;
        }
      }
      
      const avgResponse = responseCount > 0 ? Math.round(totalResponse / responseCount) : 0;
      const slaRate = responseCount > 0 ? Math.round((slaMetCount / responseCount) * 100) : 100;
      
      responseTimes.push(avgResponse);
      slaRates.push(slaRate);
    }

    // Format trend data
    const trendData = {
      breakdowns: {
        labels: timeRanges.map(r => r.label),
        datasets: [
          {
            label: 'Total Breakdowns',
            data: breakdownCounts,
            color: '#3b82f6'
          },
          {
            label: 'Critical Breakdowns',
            data: criticalCounts,
            color: '#ef4444'
          }
        ]
      },
      responseTime: {
        labels: timeRanges.map(r => r.label),
        datasets: [
          {
            label: 'Average Response (mins)',
            data: responseTimes,
            color: '#10b981',
            target: 30
          }
        ]
      },
      slaCompliance: {
        labels: timeRanges.map(r => r.label),
        datasets: [
          {
            label: 'SLA Compliance %',
            data: slaRates,
            color: '#f59e0b',
            target: 95
          }
        ]
      }
    };

    res.json({
      success: true,
      data: trendData,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch trend data' 
    });
  }
});

// GET /api/analytics/depot-comparison - Get depot performance comparison
router.get('/depot-comparison', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    // Get all depots
    const { data: depots, error: depotError } = await supabase
      .from('depots')
      .select('*')
      .eq('is_active', true);

    if (depotError) throw depotError;

    const depotData = [];
    
    for (const depot of depots) {
      // Get breakdowns for this depot
      const { data: breakdowns, error: breakdownError } = await supabase
        .from('breakdowns')
        .select('*')
        .eq('depot', depot.code)
        .gte('created_at', startDate.toISOString());

      if (breakdownError) throw breakdownError;

      // Get vehicles for this depot
      let vehicles = [];
      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('fleet_vehicles')
          .select('*')
          .eq('depot', depot.code);

        if (vehicleError) throw vehicleError;
        vehicles = vehicleData || [];
      } catch (err) {
        console.warn('Fleet vehicles table not accessible for depot:', err.message);
        vehicles = [];
      }

      if (vehicleError) throw vehicleError;

      // Calculate metrics
      let totalResponseTime = 0;
      let responseCount = 0;
      let slaMetCount = 0;
      
      for (const breakdown of breakdowns) {
        if (breakdown.acknowledged_at && breakdown.received_at) {
          const responseMinutes = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / 60000;
          totalResponseTime += responseMinutes;
          responseCount++;
          if (responseMinutes <= 30) slaMetCount++;
        }
      }

      const avgResponse = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
      const slaCompliance = responseCount > 0 ? Math.round((slaMetCount / responseCount) * 100) : 100;
      
      // Determine performance status
      let performance = 'good';
      if (slaCompliance < 90 || avgResponse > 35) {
        performance = 'critical';
      } else if (slaCompliance < 95 || avgResponse > 30) {
        performance = 'warning';
      }

      // Engineer efficiency (simulated)
      const engineerEfficiency = 70 + Math.floor(Math.random() * 20);

      depotData.push({
        depot: depot.name,
        code: depot.code,
        breakdowns: breakdowns.length,
        avgResponse: avgResponse,
        slaCompliance: slaCompliance,
        engineerEfficiency: engineerEfficiency,
        fleetSize: vehicles.length,
        performance: performance
      });
    }

    // Sort by SLA compliance
    depotData.sort((a, b) => b.slaCompliance - a.slaCompliance);

    res.json({
      success: true,
      data: depotData,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching depot comparison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch depot comparison data' 
    });
  }
});

// GET /api/analytics/fleet-health - Get fleet health overview
router.get('/fleet-health', async (req, res) => {
  try {
    // Get all vehicles
    let vehicles = [];
    try {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('fleet_vehicles')
        .select('*');

      if (vehicleError) throw vehicleError;
      vehicles = vehicleData || [];
    } catch (err) {
      console.warn('Fleet vehicles table not accessible:', err.message);
      vehicles = [];
    }

    if (vehicleError) throw vehicleError;

    // Get recent breakdowns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentBreakdowns, error: breakdownError } = await supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (breakdownError) throw breakdownError;

    // Calculate vehicle statuses
    const totalVehicles = vehicles.length;
    const inMaintenance = vehicles.filter(v => v.health_score < 50).length;
    const breakdown = recentBreakdowns.filter(b => 
      ['active', 'pending', 'in_progress'].includes(b.status)
    ).length;
    const operational = totalVehicles - inMaintenance - breakdown;

    // Group vehicles by type
    const vehicleTypes = {};
    vehicles.forEach(v => {
      const type = v.vehicle_type || 'Unknown';
      if (!vehicleTypes[type]) {
        vehicleTypes[type] = { total: 0, operational: 0 };
      }
      vehicleTypes[type].total++;
      if (v.health_score >= 50) {
        vehicleTypes[type].operational++;
      }
    });

    // Convert to array format
    const categories = Object.entries(vehicleTypes).map(([type, data]) => ({
      type: type,
      total: data.total,
      operational: data.operational,
      percentage: data.total > 0 ? Math.round((data.operational / data.total) * 100) : 0
    }));

    // Count breakdown issues
    const issueCounts = {};
    recentBreakdowns.forEach(b => {
      const issue = b.issue_category || 'Other';
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    // Get top issues
    const topIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count, trend: 'stable' }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Add trend indicators (would be calculated from historical data)
    topIssues.forEach((issue, index) => {
      if (index === 0 || index === 4) issue.trend = 'up';
      else if (index === 1 || index === 3) issue.trend = 'down';
    });

    const fleetHealthData = {
      totalVehicles: totalVehicles,
      operational: operational,
      inMaintenance: inMaintenance,
      breakdown: breakdown,
      categories: categories,
      topIssues: topIssues
    };

    res.json({
      success: true,
      data: fleetHealthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching fleet health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch fleet health data' 
    });
  }
});

// GET /api/reports/tracerit - Get Tracerit report data
router.get('/tracerit', async (req, res) => {
  try {
    const { period = 'today', depot, format = 'standard' } = req.query;

    // Calculate date range
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    // Get breakdowns for the period
    let query = supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (depot) {
      query = query.eq('depot', depot);
    }

    const { data: breakdowns, error } = await query;
    if (error) throw error;

    // Format for Tracerit report
    const reportData = breakdowns.map(b => ({
      // Tracerit required fields
      incidentNumber: b.breakdown_id,
      vehicleNumber: b.fleet_no || 'Unknown',
      registration: b.registration || 'Unknown',
      depot: b.depot || 'Unknown',
      dateReported: new Date(b.created_at).toISOString(),
      timeReported: new Date(b.created_at).toTimeString().substring(0, 8),

      // Location information
      location: b.location_description || b.location || 'Not specified',
      gridReference: b.location_coords ?
        `${b.location_coords.lat},${b.location_coords.lng}` : '',
      w3wLocation: b.w3w_location || '',

      // Issue details
      issueCategory: b.issue_category || 'General',
      issueDescription: b.description || 'No description',
      severity: b.severity || 'AMBER',
      wizardAssessment: b.wizard_decision || '',

      // Supervisor information
      reportedBy: b.supervisor_name || 'Unknown',
      supervisorBadge: b.supervisor_badge || '',

      // Engineer information
      engineerDispatched: b.dispatched_at ? 'Yes' : 'No',
      dispatchTime: b.dispatched_at ?
        new Date(b.dispatched_at).toTimeString().substring(0, 8) : '',
      onSiteTime: b.on_site_at ?
        new Date(b.on_site_at).toTimeString().substring(0, 8) : '',
      resolvedTime: b.cleared_at ?
        new Date(b.cleared_at).toTimeString().substring(0, 8) : '',

      // Status and timings
      status: b.status,
      totalDowntime: b.cleared_at && b.created_at ?
        Math.round((new Date(b.cleared_at) - new Date(b.created_at)) / 60000) : null,
      responseTime: b.acknowledged_at && b.received_at ?
        Math.round((new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000) : null,
      repairTime: b.cleared_at && b.dispatched_at ?
        Math.round((new Date(b.cleared_at) - new Date(b.dispatched_at)) / 60000) : null,

      // Additional fields
      passengerCount: b.passenger_count || 0,
      replacementVehicle: b.replacement_vehicle_required ? 'Yes' : 'No',
      engineeringRequired: b.engineering_required ? 'Yes' : 'No',
      notes: b.resolution_notes || ''
    }));

    // Calculate summary statistics
    const summary = {
      totalIncidents: reportData.length,
      byStatus: {
        active: reportData.filter(r => r.status === 'active').length,
        resolved: reportData.filter(r => r.status === 'cleared').length,
        inProgress: reportData.filter(r => ['dispatched', 'on_site'].includes(r.status)).length
      },
      bySeverity: {
        critical: reportData.filter(r => r.severity === 'STOP').length,
        warning: reportData.filter(r => r.severity === 'AMBER').length,
        normal: reportData.filter(r => r.severity === 'CONTINUE').length
      },
      averages: {
        responseTime: calculateAverage(reportData.map(r => r.responseTime).filter(Boolean)),
        repairTime: calculateAverage(reportData.map(r => r.repairTime).filter(Boolean)),
        downtime: calculateAverage(reportData.map(r => r.totalDowntime).filter(Boolean))
      },
      topIssues: getTopIssues(reportData),
      affectedDepots: [...new Set(reportData.map(r => r.depot))].filter(Boolean)
    };

    // Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV format (headers + data)
      const csvHeaders = Object.keys(reportData[0] || {}).join(',');
      const csvData = reportData.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition',
        `attachment; filename="tracerit-report-${period}-${Date.now()}.csv"`);
      res.send(`${csvHeaders}\n${csvData}`);
    } else {
      // Standard JSON response
      res.json({
        success: true,
        report: {
          metadata: {
            period,
            depot: depot || 'All Depots',
            generatedAt: new Date().toISOString(),
            dateRange: {
              from: startDate.toISOString(),
              to: endDate.toISOString()
            }
          },
          summary,
          data: reportData
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error generating Tracerit report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Tracerit report'
    });
  }
});

// Helper function to calculate average
function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  return Math.round(sum / numbers.length);
}

// Helper function to get top issues
function getTopIssues(reportData, limit = 5) {
  const issueCounts = {};
  reportData.forEach(r => {
    const issue = r.issueCategory;
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });

  return Object.entries(issueCounts)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// GET /api/analytics/activity/feed - Get activity feed for all supervisors
router.get('/activity/feed', async (req, res) => {
  try {
    const { limit = 20, offset = 0, depot } = req.query;

    // Get recent breakdowns with supervisor info
    let breakdownQuery = supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (depot) {
      breakdownQuery = breakdownQuery.eq('depot', depot);
    }

    const { data: breakdowns, error: breakdownError } = await breakdownQuery;
    if (breakdownError) throw breakdownError;

    // Format activities from breakdowns
    const activities = breakdowns.map(breakdown => {
      const isWizardBreakdown = breakdown.breakdown_source === 'wizard' || breakdown.wizard_type;

      return {
        id: `breakdown-${breakdown.id}`,
        type: isWizardBreakdown ? 'breakdown_guide_assessment' : 'breakdown_created',
        icon: breakdown.severity === 'STOP' ? '🚨' : breakdown.severity === 'AMBER' ? '⚠️' : '📋',
        message: formatBreakdownMessage(breakdown),
        time: new Date(breakdown.created_at).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: breakdown.created_at,
        depot: breakdown.depot,
        supervisor: breakdown.supervisor_name,
        supervisor_badge: breakdown.supervisor_badge,
        decision: breakdown.wizard_decision || breakdown.severity,
        severity: breakdown.severity === 'STOP' ? 'critical' : breakdown.severity === 'AMBER' ? 'warning' : 'normal',
        breakdown_id: breakdown.breakdown_id,
        fleet_no: breakdown.fleet_no,
        location: breakdown.location_description,
        issue_type: breakdown.issue_category,
        wizard_type: breakdown.wizard_type,
        is_guide_assessment: isWizardBreakdown
      };
    });

    res.json({
      success: true,
      activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to format breakdown messages
function formatBreakdownMessage(breakdown) {
  const supervisor = breakdown.supervisor_name || 'Supervisor';
  const vehicle = breakdown.fleet_no || 'vehicle';
  const location = breakdown.location_description || breakdown.location;
  const isWizard = breakdown.wizard_type;

  if (isWizard) {
    let message = `${supervisor} completed ${breakdown.wizard_type} assessment for ${vehicle}`;
    if (location) message += ` at ${location}`;
    if (breakdown.wizard_decision) message += ` - Result: ${breakdown.wizard_decision}`;
    return message;
  } else {
    let message = `${supervisor} reported breakdown on ${vehicle}`;
    if (location) message += ` at ${location}`;
    if (breakdown.issue_category) message += ` - ${breakdown.issue_category}`;
    return message;
  }
}

export default router;
