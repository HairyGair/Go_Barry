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

    // Get fleet data
    const { data: vehicles, error: fleetError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true);

    if (fleetError) throw fleetError;

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
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('depot', depot.code)
        .eq('is_active', true);

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
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true);

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

export default router;
