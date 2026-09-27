/**
 * Go BARRY Analytics API Routes (MySQL Version)
 *
 * Provides analytics, KPIs, trends, and reporting endpoints
 * Migrated from Supabase to MySQL
 *
 * Endpoints:
 * - GET /api/analytics/kpis - Key performance indicators
 * - GET /api/analytics/trends - Performance trends over time
 * - GET /api/analytics/depot-comparison - Compare depot performance
 * - GET /api/analytics/fleet-health - Fleet health overview
 * - GET /api/analytics/activity/feed - Activity feed
 * - GET /api/reports/incident - Incident report data
 *
 * @author Anthony Gair
 * @version 2.0.0 (MySQL)
 * @license Proprietary
 */

import express from 'express';
import { query } from '../config/mysql.js';
import { from } from '../utils/queryHelpers.js';
import { demoSqlFilter, isDemoUser, DEMO_ENGINEER_PREFIX } from '../utils/demoFilter.js';
import { DEMO_DEPOTS } from '../data/demoDepots.js';
import { DEMO_FLEET } from '../data/demoFleet.js';
import { validate } from '../middleware/validationMiddleware.js';
import { analyticsSchemas } from '../validation/schemas.js';

const router = express.Router();

// GET /api/analytics/kpis - Get key performance indicators
router.get('/kpis', validate(analyticsSchemas.kpis), async (req, res) => {
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

    // Get current period breakdowns (demo isolation)
    const currentBreakdowns = await query(
      'SELECT * FROM breakdowns WHERE created_at >= ?' + demoSqlFilter(req.user),
      [startDate]
    );

    // Get previous period breakdowns for comparison
    const previousBreakdowns = await query(
      'SELECT * FROM breakdowns WHERE created_at >= ? AND created_at < ?' + demoSqlFilter(req.user),
      [previousStartDate, startDate]
    );

    // Fleet availability = active fleet minus vehicles currently off the road
    // (open STOP breakdowns). fleet_vehicles has no health data, so availability
    // is derived from live breakdown state rather than a per-vehicle score.
    let totalVehicles = 0;
    let offRoadVehicles = 0;
    try {
      const [fleetRow] = await query('SELECT COUNT(*) AS total FROM fleet_vehicles WHERE is_active = 1');
      totalVehicles = Number(fleetRow?.total) || 0;
      const [offRoadRow] = await query(
        `SELECT COUNT(DISTINCT fleet_no) AS off_road FROM breakdowns
         WHERE severity = 'STOP' AND status NOT IN ('resolved', 'completed', 'cancelled')` + demoSqlFilter(req.user)
      );
      offRoadVehicles = Number(offRoadRow?.off_road) || 0;
    } catch (err) {
      console.warn('Fleet availability not computable:', err.message);
    }

    // Calculate KPIs (null = unknown; the dashboard renders it as unavailable, not 0%)
    const fleetAvailability = totalVehicles > 0
      ? ((totalVehicles - Math.min(offRoadVehicles, totalVehicles)) / totalVehicles) * 100
      : null;

    // Period metrics — computed identically for the current and previous
    // period so every trend is a real period-over-period change.
    const periodMetrics = (breakdowns, from, to) => {
      const hours = Math.max((to - from) / (1000 * 60 * 60), 1);
      let total = 0, count = 0, met = 0;
      for (const b of breakdowns) {
        if (b.acknowledged_at && b.received_at) {
          const mins = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
          total += mins; count++;
          if (mins <= 30) met++;
        }
      }
      return {
        count: breakdowns.length,
        avgResponse: count > 0 ? Math.round(total / count) : null,
        sla: count > 0 ? (met / count) * 100 : null
      };
    };
    const pctChange = (cur, prev) =>
      cur == null || prev == null || prev === 0 ? null : Math.round(((cur - prev) / prev) * 1000) / 10;
    const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

    const cur = periodMetrics(currentBreakdowns, startDate, new Date());
    const prev = periodMetrics(previousBreakdowns, previousStartDate, startDate);
    const currentCount = cur.count;
    const previousCount = prev.count;

    // MTBF (mean time between failures) over "today" or even "week" is
    // meaningless — one incident an hour after midnight gives an MTBF of
    // "1 hour", which reads as broken rather than informative. Always compute
    // it over a fixed rolling 30-day window instead, independent of the
    // selected `period`, and say so via `windowDays` so the UI can label it
    // clearly rather than implying it matches the period tabs.
    const MTBF_WINDOW_DAYS = 30;
    let mtbfHours = null;
    let mtbfTrend = null;
    try {
      const mtbfWindowStart = new Date();
      mtbfWindowStart.setDate(mtbfWindowStart.getDate() - MTBF_WINDOW_DAYS);
      const mtbfPrevWindowStart = new Date();
      mtbfPrevWindowStart.setDate(mtbfPrevWindowStart.getDate() - MTBF_WINDOW_DAYS * 2);

      const [curCountRow] = await query(
        'SELECT COUNT(*) AS cnt FROM breakdowns WHERE created_at >= ?' + demoSqlFilter(req.user),
        [mtbfWindowStart]
      );
      const [prevCountRow] = await query(
        'SELECT COUNT(*) AS cnt FROM breakdowns WHERE created_at >= ? AND created_at < ?' + demoSqlFilter(req.user),
        [mtbfPrevWindowStart, mtbfWindowStart]
      );
      const mtbfCurCount = Number(curCountRow?.cnt) || 0;
      const mtbfPrevCount = Number(prevCountRow?.cnt) || 0;
      const windowHours = MTBF_WINDOW_DAYS * 24;
      mtbfHours = mtbfCurCount > 0 ? windowHours / mtbfCurCount : null;
      const prevMtbfHours = mtbfPrevCount > 0 ? windowHours / mtbfPrevCount : null;
      mtbfTrend = pctChange(mtbfHours, prevMtbfHours);
    } catch (err) {
      console.warn('MTBF not computable:', err.message);
    }

    // Engineer utilisation — share of active engineers currently on a job
    let engineerUtilization = null;
    try {
      const demo = isDemoUser(req.user);
      const [engRow] = await query(
        `SELECT COUNT(*) AS total, SUM(status = 'on_job') AS busy FROM engineers
         WHERE is_active = 1 AND badge_number ${demo ? 'LIKE' : 'NOT LIKE'} ?`,
        [DEMO_ENGINEER_PREFIX]
      );
      const total = Number(engRow?.total) || 0;
      if (total > 0) engineerUtilization = Math.round(((Number(engRow.busy) || 0) / total) * 100);
    } catch (err) {
      console.warn('Engineer utilisation not computable:', err.message);
    }

    const kpiData = {
      mtbf: {
        value: mtbfHours == null ? null : Math.round(mtbfHours * 10) / 10,
        unit: 'hours',
        // Always a fixed rolling window, regardless of the `period` selected
        // above — see the comment where this is computed.
        windowDays: MTBF_WINDOW_DAYS,
        windowLabel: `Last ${MTBF_WINDOW_DAYS} days`,
        trend: mtbfTrend,
        target: 1200,
        status: mtbfHours == null ? 'normal' : mtbfHours >= 1200 ? 'good' : mtbfHours >= 1000 ? 'normal' : 'warning'
      },
      slaCompliance: {
        value: round1(cur.sla),
        unit: '%',
        trend: pctChange(cur.sla, prev.sla),
        target: 95,
        status: cur.sla == null ? 'normal' : cur.sla >= 95 ? 'good' : cur.sla >= 90 ? 'warning' : 'critical'
      },
      avgResponseTime: {
        value: cur.avgResponse,
        unit: 'minutes',
        trend: pctChange(cur.avgResponse, prev.avgResponse),
        target: 30,
        status: cur.avgResponse == null ? 'normal' : cur.avgResponse <= 30 ? 'good' : cur.avgResponse <= 40 ? 'warning' : 'critical'
      },
      fleetAvailability: {
        value: round1(fleetAvailability),
        unit: '%',
        trend: null, // point-in-time snapshot; no historical availability series yet
        target: 95,
        status: fleetAvailability == null ? 'normal' : fleetAvailability >= 95 ? 'good' : fleetAvailability >= 90 ? 'warning' : 'critical'
      },
      breakdownsToday: {
        value: currentCount,
        unit: 'incidents',
        trend: pctChange(currentCount, previousCount),
        previousValue: previousCount,
        status: 'normal'
      },
      engineerUtilization: {
        value: engineerUtilization, // live snapshot: engineers currently on a job
        unit: '%',
        trend: null,
        target: 80,
        status: engineerUtilization == null ? 'normal' : engineerUtilization >= 80 ? 'good' : engineerUtilization >= 70 ? 'normal' : 'warning'
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

// GET /api/analytics/defect-timeline - Daily breakdown counts by severity
// Used by the Fleet Intelligence "N-Day Defect Timeline" chart. Unlike
// /api/breakdowns/live (active breakdowns only — always a handful of recent
// rows, so the chart was always flat), this counts ALL breakdowns created in
// the window by day, including resolved ones, from `breakdowns.created_at`.
router.get('/defect-timeline', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const rows = await query(
      `SELECT DATE(created_at) AS day,
              COUNT(*) AS total,
              SUM(CASE WHEN severity = 'STOP' OR wizard_decision = 'STOP' THEN 1 ELSE 0 END) AS stop_count,
              SUM(CASE WHEN severity = 'AMBER' OR wizard_decision = 'AMBER' THEN 1 ELSE 0 END) AS amber_count,
              SUM(CASE WHEN severity = 'CONTINUE' OR wizard_decision = 'CONTINUE' THEN 1 ELSE 0 END) AS continue_count
       FROM breakdowns
       WHERE created_at >= ?${demoSqlFilter(req.user)}
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [startDate]
    );

    // Dense day-by-day series (zero-filled gaps) so the frontend can render
    // directly without having to backfill missing days itself.
    const byDay = new Map(rows.map(r => {
      const key = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
      return [key, r];
    }));

    const series = [];
    const cursor = new Date(startDate);
    for (let i = 0; i < days; i++) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const row = byDay.get(dateKey);
      series.push({
        date: dateKey,
        total: Number(row?.total) || 0,
        stop: Number(row?.stop_count) || 0,
        amber: Number(row?.amber_count) || 0,
        cont: Number(row?.continue_count) || 0
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({
      success: true,
      days,
      series,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching defect timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch defect timeline'
    });
  }
});

// GET /api/analytics/trends - Get performance trends
router.get('/trends', validate(analyticsSchemas.trends), async (req, res) => {
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
      // Get breakdowns for this range (demo isolation)
      const breakdowns = await query(
        'SELECT * FROM breakdowns WHERE created_at >= ? AND created_at < ?' + demoSqlFilter(req.user),
        [range.start, range.end]
      );

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
router.get('/depot-comparison', validate(analyticsSchemas.summary), async (req, res) => {
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

    const demo = isDemoUser(req.user);

    // Get all active depots. Demo sessions compare against the fictional depot
    // table instead of the real one so no real depot name/code is returned.
    const depots = demo
      ? DEMO_DEPOTS.map((d) => ({ code: d.code, name: d.name }))
      : await query('SELECT * FROM depots WHERE is_active = ?', [true]);

    const depotData = [];

    for (const depot of depots) {
      // Get breakdowns for this depot (demo isolation). Real breakdown rows
      // store the depot code; demo breakdown rows store the fictional name.
      const breakdowns = await query(
        'SELECT * FROM breakdowns WHERE depot = ? AND created_at >= ?' + demoSqlFilter(req.user),
        [demo ? depot.name : depot.code, startDate]
      );

      // Get vehicles for this depot. The demo fleet is synthetic (served by
      // fleet.js, not the real fleet_vehicles table), so fleet size for demo
      // depots comes from the fictional roster instead of a DB lookup.
      let vehicles = [];
      if (demo) {
        vehicles = DEMO_FLEET.filter((v) => v.depot === depot.name);
      } else {
        try {
          vehicles = await query(
            'SELECT * FROM fleet_vehicles WHERE depot = ?',
            [depot.code]
          );
        } catch (err) {
          console.warn('Fleet vehicles table not accessible for depot:', err.message);
          vehicles = [];
        }
      }

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

      // Engineer efficiency isn't tracked yet (no engineer busy-time data)
      const engineerEfficiency = null;

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
    // Active fleet (fleet_vehicles carries no health data — status is derived
    // from live breakdowns: a vehicle with an open breakdown is off the road)
    let vehicles = [];
    try {
      vehicles = await query('SELECT fleet_no, vehicle_type FROM fleet_vehicles WHERE is_active = 1');
    } catch (err) {
      console.warn('Fleet vehicles table not accessible:', err.message);
      vehicles = [];
    }

    // Get recent breakdowns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBreakdowns = await query(
      'SELECT * FROM breakdowns WHERE created_at >= ?' + demoSqlFilter(req.user),
      [thirtyDaysAgo]
    );

    const openBreakdowns = await query(
      `SELECT fleet_no FROM breakdowns
       WHERE status NOT IN ('resolved', 'completed', 'cancelled')` + demoSqlFilter(req.user)
    );
    const offRoad = new Set(openBreakdowns.map(b => String(b.fleet_no)));

    // Calculate vehicle statuses
    const totalVehicles = vehicles.length;
    const inMaintenance = 0; // planned maintenance isn't tracked in this system
    const breakdown = offRoad.size;
    const operational = Math.max(totalVehicles - breakdown, 0);

    // Group vehicles by type
    const vehicleTypes = {};
    vehicles.forEach(v => {
      const type = v.vehicle_type || 'Unknown';
      if (!vehicleTypes[type]) {
        vehicleTypes[type] = { total: 0, operational: 0 };
      }
      vehicleTypes[type].total++;
      if (!offRoad.has(String(v.fleet_no))) {
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

    // Count breakdown issues — trend compares the last 15 days with the 15 before
    const midpoint = new Date();
    midpoint.setDate(midpoint.getDate() - 15);
    const issueCounts = {};
    recentBreakdowns.forEach(b => {
      const issue = b.issue_category || 'Other';
      if (!issueCounts[issue]) issueCounts[issue] = { count: 0, recent: 0, earlier: 0 };
      issueCounts[issue].count++;
      if (new Date(b.created_at) >= midpoint) issueCounts[issue].recent++;
      else issueCounts[issue].earlier++;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([issue, c]) => ({
        issue,
        count: c.count,
        trend: c.recent > c.earlier ? 'up' : c.recent < c.earlier ? 'down' : 'stable'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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

// GET /api/reports/incident - Get incident report data
// Note: route kept as /tracerit for backwards compatibility
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
    let breakdowns;
    if (depot) {
      breakdowns = await query(
        'SELECT * FROM breakdowns WHERE created_at >= ? AND created_at <= ? AND depot = ? ORDER BY created_at DESC',
        [startDate, endDate, depot]
      );
    } else {
      breakdowns = await query(
        'SELECT * FROM breakdowns WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC',
        [startDate, endDate]
      );
    }

    // Format for incident report
    const reportData = breakdowns.map(b => {
      // Parse location_coords if it's stored as JSON string
      let locationCoords = null;
      if (b.location_coords) {
        try {
          locationCoords = typeof b.location_coords === 'string'
            ? JSON.parse(b.location_coords)
            : b.location_coords;
        } catch (e) {
          // Ignore parse errors
        }
      }

      return {
        // Incident report required fields
        incidentNumber: b.breakdown_id,
        vehicleNumber: b.fleet_no || 'Unknown',
        registration: b.registration || 'Unknown',
        depot: b.depot || 'Unknown',
        dateReported: new Date(b.created_at).toISOString(),
        timeReported: new Date(b.created_at).toTimeString().substring(0, 8),

        // Location information
        location: b.location_description || b.location || 'Not specified',
        gridReference: locationCoords ?
          `${locationCoords.lat},${locationCoords.lng}` : '',
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
      };
    });

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
        `attachment; filename="incident-report-${period}-${Date.now()}.csv"`);
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
    console.error('Error generating incident report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate incident report'
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
    const isDemoUser = req.user?.badge_number === 'DEMO01';
    const demoFilter = isDemoUser ? " AND supervisor_badge = 'DEMO01'" : " AND supervisor_badge != 'DEMO01'";

    // Get recent breakdowns with depot filter if specified
    const safeLimit = parseInt(limit) || 20;
    const safeOffset = parseInt(offset) || 0;
    let breakdowns;
    if (depot) {
      breakdowns = await query(
        `SELECT * FROM breakdowns WHERE depot = ?${demoFilter} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        [depot]
      );
    } else {
      breakdowns = await query(
        `SELECT * FROM breakdowns WHERE 1=1${demoFilter} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
        []
      );
    }

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

// GET /api/analytics/shift-stats - Get statistics for current shift
// Used by DutyCard to show real-time shift performance
router.get('/shift-stats', async (req, res) => {
  try {
    const { duty_code, supervisor_badge, shift_start, shift_end } = req.query;
    const isDemoUser = req.user?.badge_number === 'DEMO01';

    if (!shift_start || !shift_end) {
      return res.status(400).json({
        success: false,
        error: 'shift_start and shift_end are required'
      });
    }

    // Parse shift times
    const shiftStartTime = new Date(shift_start);
    const shiftEndTime = new Date(shift_end);

    // Query breakdowns for this shift period
    // Use SELECT * to avoid errors if optional columns (acknowledged_at, received_at) don't exist
    const demoFilter = isDemoUser ? " AND supervisor_badge = 'DEMO01'" : " AND supervisor_badge != 'DEMO01'";
    let breakdownsQuery = `
      SELECT *
      FROM breakdowns
      WHERE created_at >= ? AND created_at <= ?${demoFilter}
    `;
    const queryParams = [shiftStartTime, shiftEndTime];

    // Filter by supervisor if provided
    if (supervisor_badge) {
      breakdownsQuery += ' AND supervisor_badge = ?';
      queryParams.push(supervisor_badge);
    }

    // Filter by duty code if provided. Demo: the demo duty follows the clock,
    // so seeded breakdowns can't carry it — the time window is the filter.
    if (duty_code && !isDemoUser) {
      breakdownsQuery += ' AND duty_code = ?';
      queryParams.push(duty_code);
    }

    breakdownsQuery += ' ORDER BY created_at DESC';

    const breakdowns = await query(breakdownsQuery, queryParams);

    // Calculate statistics
    const totalBreakdowns = breakdowns.length;
    const assessments = breakdowns.filter(b => b.wizard_type).length;
    const resolved = breakdowns.filter(b => b.status === 'resolved').length;
    const stopDecisions = breakdowns.filter(b => b.severity === 'STOP' || b.wizard_decision === 'STOP').length;
    const amberDecisions = breakdowns.filter(b => b.severity === 'AMBER' || b.wizard_decision === 'AMBER').length;
    const continueDecisions = breakdowns.filter(b => b.severity === 'CONTINUE' || b.wizard_decision === 'CONTINUE').length;

    // Calculate average response time (in minutes)
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const breakdown of breakdowns) {
      if (breakdown.acknowledged_at && breakdown.created_at) {
        const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.created_at)) / 60000;
        if (responseTime > 0 && responseTime < 480) { // Ignore outliers > 8 hours
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    const avgResponse = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;

    // Calculate resolution rate
    const resolutionRate = totalBreakdowns > 0
      ? Math.round((resolved / totalBreakdowns) * 100)
      : 100;

    // Get historical average for comparison (last 30 days, same duty code)
    let historicalAvg = null;
    if (duty_code) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historicalData = await query(`
          SELECT
            COUNT(*) as total,
            AVG(TIMESTAMPDIFF(MINUTE, created_at, COALESCE(acknowledged_at, NOW()))) as avg_response
          FROM breakdowns
          WHERE duty_code = ?
            AND created_at >= ?
            AND created_at < ?${demoFilter}
        `, [duty_code, thirtyDaysAgo, shiftStartTime]);

        if (historicalData && historicalData[0]) {
          historicalAvg = {
            breakdownsPerShift: Math.round(historicalData[0].total / 30) || 0,
            avgResponse: Math.round(historicalData[0].avg_response) || null
          };
        }
      } catch (err) {
        console.warn('Could not fetch historical data:', err.message);
      }
    }

    // Determine performance status.
    // "excellent" needs enough real activity to mean something — otherwise an
    // empty shift (0 breakdowns, resolutionRate defaulting to 100) always
    // came back "excellent", which reads as fake in the demo and in real use.
    const MIN_BREAKDOWNS_FOR_EXCELLENT = 3;
    let performance = 'good';
    if (stopDecisions > 2 || (avgResponse && avgResponse > 30)) {
      performance = 'needs-attention';
    } else if (totalBreakdowns >= MIN_BREAKDOWNS_FOR_EXCELLENT && stopDecisions === 0 && resolutionRate >= 80) {
      performance = 'excellent';
    }

    res.json({
      success: true,
      stats: {
        breakdownsHandled: totalBreakdowns,
        assessments: assessments,
        resolved: resolved,
        avgResponse: avgResponse,
        resolutionRate: resolutionRate,
        bySeverity: {
          stop: stopDecisions,
          amber: amberDecisions,
          continue: continueDecisions
        },
        performance: performance
      },
      comparison: historicalAvg ? {
        avgBreakdownsPerShift: historicalAvg.breakdownsPerShift,
        avgResponseHistorical: historicalAvg.avgResponse,
        trend: totalBreakdowns > historicalAvg.breakdownsPerShift ? 'above' :
               totalBreakdowns < historicalAvg.breakdownsPerShift ? 'below' : 'average'
      } : null,
      period: {
        start: shiftStartTime.toISOString(),
        end: shiftEndTime.toISOString(),
        dutyCode: duty_code || null,
        supervisorBadge: supervisor_badge || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching shift statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shift statistics',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/analytics/supervisor-performance - Supervisor Performance Dashboard
// Provides comprehensive performance metrics for supervisors
router.get('/supervisor-performance', async (req, res) => {
  try {
    const { period = 'week', supervisor_badge, include_leaderboard = 'true' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let periodLabel = '';

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        periodLabel = 'Last 7 Days';
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        periodLabel = 'Last 30 Days';
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        periodLabel = 'Last 90 Days';
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        periodLabel = 'Last 7 Days';
    }

    // Get all supervisors (demo sessions see only the demo supervisor)
    let supervisors = [];
    try {
      supervisors = await query(
        `SELECT id, badge_number, name, depot, role FROM supervisors WHERE is_active = 1${demoSqlFilter(req.user, { column: 'badge_number' })}`
      );
    } catch (err) {
      console.warn('Could not fetch supervisors:', err.message);
    }

    // Get all breakdowns in the period
    const allBreakdowns = await query(
      `SELECT
        id, breakdown_id, fleet_no, severity, status,
        duty_code, supervisor_badge, supervisor_name,
        wizard_type, wizard_decision,
        created_at, acknowledged_at, resolved_at, received_at, depot
      FROM breakdowns
      WHERE created_at >= ?${demoSqlFilter(req.user)}
      ORDER BY created_at DESC`,
      [startDate]
    );

    // Calculate per-supervisor metrics
    const supervisorMetrics = [];

    for (const supervisor of supervisors) {
      const badge = supervisor.badge_number;
      const supervisorBreakdowns = allBreakdowns.filter(b => b.supervisor_badge === badge);

      if (supervisorBreakdowns.length === 0 && !supervisor_badge) continue;

      // Calculate metrics
      const totalHandled = supervisorBreakdowns.length;
      const resolved = supervisorBreakdowns.filter(b => b.status === 'resolved').length;
      const assessments = supervisorBreakdowns.filter(b => b.wizard_type).length;
      const stopDecisions = supervisorBreakdowns.filter(b =>
        b.severity === 'STOP' || b.wizard_decision === 'STOP'
      ).length;

      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;
      for (const b of supervisorBreakdowns) {
        if (b.acknowledged_at && b.created_at) {
          const responseTime = (new Date(b.acknowledged_at) - new Date(b.created_at)) / 60000;
          if (responseTime > 0 && responseTime < 480) {
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      }
      const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : null;

      // Calculate resolution rate
      const resolutionRate = totalHandled > 0 ? Math.round((resolved / totalHandled) * 100) : 100;

      // Breakdowns by duty type
      const byDutyType = {
        '100': supervisorBreakdowns.filter(b => b.duty_code === '100').length,
        '200': supervisorBreakdowns.filter(b => b.duty_code === '200').length,
        '400': supervisorBreakdowns.filter(b => b.duty_code === '400').length,
        '500': supervisorBreakdowns.filter(b => b.duty_code === '500').length
      };

      // Calculate performance score (0-100)
      let performanceScore = 50; // Base score
      if (avgResponseTime !== null) {
        performanceScore += avgResponseTime <= 15 ? 20 : avgResponseTime <= 30 ? 10 : 0;
      }
      performanceScore += resolutionRate >= 90 ? 20 : resolutionRate >= 70 ? 10 : 0;
      performanceScore += stopDecisions === 0 ? 10 : stopDecisions <= 2 ? 5 : 0;
      performanceScore = Math.min(100, performanceScore);

      supervisorMetrics.push({
        badge: badge,
        name: supervisor.name,
        depot: supervisor.depot,
        role: supervisor.role,
        metrics: {
          totalHandled,
          resolved,
          assessments,
          stopDecisions,
          avgResponseTime,
          resolutionRate,
          performanceScore
        },
        byDutyType
      });
    }

    // Sort by performance score for leaderboard
    supervisorMetrics.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore);

    // Generate response time trend data (daily averages)
    const trendData = [];
    const daysInPeriod = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(daysInPeriod, 30); i++) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBreakdowns = allBreakdowns.filter(b => {
        const created = new Date(b.created_at);
        return created >= dayStart && created <= dayEnd;
      });

      let dayResponseTime = 0;
      let dayResponseCount = 0;
      for (const b of dayBreakdowns) {
        if (b.acknowledged_at && b.created_at) {
          const rt = (new Date(b.acknowledged_at) - new Date(b.created_at)) / 60000;
          if (rt > 0 && rt < 480) {
            dayResponseTime += rt;
            dayResponseCount++;
          }
        }
      }

      trendData.unshift({
        date: dayStart.toISOString().split('T')[0],
        label: dayStart.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        breakdowns: dayBreakdowns.length,
        avgResponseTime: dayResponseCount > 0 ? Math.round(dayResponseTime / dayResponseCount) : null,
        resolved: dayBreakdowns.filter(b => b.status === 'resolved').length
      });
    }

    // If specific supervisor requested, filter to just that one
    let filteredMetrics = supervisorMetrics;
    if (supervisor_badge) {
      filteredMetrics = supervisorMetrics.filter(s => s.badge === supervisor_badge);
    }

    // Build leaderboard (top 10)
    const leaderboard = include_leaderboard === 'true'
      ? supervisorMetrics.slice(0, 10).map((s, index) => ({
          rank: index + 1,
          badge: s.badge,
          name: s.name,
          depot: s.depot,
          score: s.metrics.performanceScore,
          breakdowns: s.metrics.totalHandled,
          avgResponse: s.metrics.avgResponseTime
        }))
      : null;

    // Calculate overall statistics
    const overallStats = {
      totalBreakdowns: allBreakdowns.length,
      totalResolved: allBreakdowns.filter(b => b.status === 'resolved').length,
      activeSupervisors: supervisorMetrics.length,
      avgPerformanceScore: supervisorMetrics.length > 0
        ? Math.round(supervisorMetrics.reduce((sum, s) => sum + s.metrics.performanceScore, 0) / supervisorMetrics.length)
        : 0
    };

    res.json({
      success: true,
      period: {
        type: period,
        label: periodLabel,
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      overallStats,
      supervisors: filteredMetrics,
      leaderboard,
      trends: trendData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching supervisor performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor performance data',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/analytics/coverage-gaps - Shift Coverage Gaps Analysis
// Identifies times when no supervisor was on duty and overlap periods
router.get('/coverage-gaps', async (req, res) => {
  try {
    const { period = 'week', depot } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Define standard duty shifts
    const DUTY_SHIFTS = {
      '100': { name: 'Early Shift', start: '06:00', end: '15:30' },
      '200': { name: 'Day Shift', start: '07:30', end: '17:00' },
      '400': { name: 'Late Shift', start: '12:30', end: '22:00' },
      '500': { name: 'Night Shift', start: '14:45', end: '00:15' }
    };

    // Get activity data to identify when supervisors were active
    let activities = [];
    try {
      let activityQuery = `
        SELECT
          supervisor_badge,
          supervisor_name,
          duty_code,
          depot,
          created_at,
          activity_type
        FROM activities
        WHERE created_at >= ?${demoSqlFilter(req.user, { column: 'actor_id' })}
      `;
      const params = [startDate];

      if (depot) {
        activityQuery += ' AND depot = ?';
        params.push(depot);
      }

      activityQuery += ' ORDER BY created_at ASC';
      activities = await query(activityQuery, params);
    } catch (err) {
      console.warn('Activities table not accessible:', err.message);
    }

    // Get breakdown data as proxy for coverage
    let breakdownsQuery = `
      SELECT
        supervisor_badge,
        supervisor_name,
        duty_code,
        depot,
        created_at
      FROM breakdowns
      WHERE created_at >= ?${demoSqlFilter(req.user)}
    `;
    const breakdownParams = [startDate];

    if (depot) {
      breakdownsQuery += ' AND depot = ?';
      breakdownParams.push(depot);
    }

    breakdownsQuery += ' ORDER BY created_at ASC';
    const breakdowns = await query(breakdownsQuery, breakdownParams);

    // Combine activities and breakdowns for coverage analysis
    const allEvents = [
      ...activities.map(a => ({
        timestamp: new Date(a.created_at),
        supervisor: a.supervisor_badge,
        name: a.supervisor_name,
        duty: a.duty_code,
        depot: a.depot,
        type: 'activity'
      })),
      ...breakdowns.map(b => ({
        timestamp: new Date(b.created_at),
        supervisor: b.supervisor_badge,
        name: b.supervisor_name,
        duty: b.duty_code,
        depot: b.depot,
        type: 'breakdown'
      }))
    ].sort((a, b) => a.timestamp - b.timestamp);

    // Analyze coverage by hour for each day
    const coverageByDay = [];
    const gapsIdentified = [];
    const overlaps = [];

    const daysInPeriod = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));

    for (let dayOffset = 0; dayOffset < daysInPeriod; dayOffset++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + dayOffset);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Get events for this day
      const dayEvents = allEvents.filter(e =>
        e.timestamp >= dayStart && e.timestamp <= dayEnd
      );

      // Analyze hourly coverage
      const hourlySlots = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(dayStart);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(dayStart);
        hourEnd.setHours(hour, 59, 59, 999);

        const hourEvents = dayEvents.filter(e =>
          e.timestamp >= hourStart && e.timestamp <= hourEnd
        );

        // Check which duties should be active at this hour
        const expectedDuties = [];
        for (const [code, shift] of Object.entries(DUTY_SHIFTS)) {
          const [startHour] = shift.start.split(':').map(Number);
          const [endHour] = shift.end.split(':').map(Number);

          // Handle overnight shifts
          if (endHour < startHour) {
            if (hour >= startHour || hour < endHour) {
              expectedDuties.push(code);
            }
          } else {
            if (hour >= startHour && hour < endHour) {
              expectedDuties.push(code);
            }
          }
        }

        // Get unique supervisors active in this hour
        const activeSupervisors = [...new Set(hourEvents.map(e => e.supervisor))].filter(Boolean);
        const activeDuties = [...new Set(hourEvents.map(e => e.duty))].filter(Boolean);

        hourlySlots.push({
          hour,
          label: `${hour.toString().padStart(2, '0')}:00`,
          expectedDuties,
          activeSupervisors: activeSupervisors.length,
          activeDuties,
          hasActivity: hourEvents.length > 0,
          isCovered: activeSupervisors.length > 0 || expectedDuties.length === 0,
          isOverlap: activeDuties.length > 1
        });

        // Track overlaps
        if (activeDuties.length > 1) {
          overlaps.push({
            date: dayStart.toISOString().split('T')[0],
            hour,
            duties: activeDuties,
            supervisorCount: activeSupervisors.length
          });
        }
      }

      // Identify gaps (periods with no coverage during expected duty hours)
      let gapStart = null;
      for (const slot of hourlySlots) {
        if (!slot.isCovered && slot.expectedDuties.length > 0) {
          if (!gapStart) {
            gapStart = slot.hour;
          }
        } else if (gapStart !== null) {
          gapsIdentified.push({
            date: dayStart.toISOString().split('T')[0],
            startHour: gapStart,
            endHour: slot.hour,
            duration: slot.hour - gapStart,
            expectedDuties: hourlySlots.find(s => s.hour === gapStart)?.expectedDuties || []
          });
          gapStart = null;
        }
      }
      // Handle gap that extends to end of day
      if (gapStart !== null) {
        gapsIdentified.push({
          date: dayStart.toISOString().split('T')[0],
          startHour: gapStart,
          endHour: 24,
          duration: 24 - gapStart,
          expectedDuties: hourlySlots.find(s => s.hour === gapStart)?.expectedDuties || []
        });
      }

      // Calculate daily coverage percentage
      const coveredHours = hourlySlots.filter(s => s.isCovered).length;
      const expectedHours = hourlySlots.filter(s => s.expectedDuties.length > 0).length;

      coverageByDay.push({
        date: dayStart.toISOString().split('T')[0],
        dayOfWeek: dayStart.toLocaleDateString('en-GB', { weekday: 'long' }),
        coveragePercent: expectedHours > 0 ? Math.round((coveredHours / expectedHours) * 100) : 100,
        totalEvents: dayEvents.length,
        uniqueSupervisors: [...new Set(dayEvents.map(e => e.supervisor))].filter(Boolean).length,
        hourlySlots
      });
    }

    // Calculate summary statistics
    const summary = {
      totalDays: daysInPeriod,
      avgCoverage: coverageByDay.length > 0
        ? Math.round(coverageByDay.reduce((sum, d) => sum + d.coveragePercent, 0) / coverageByDay.length)
        : 0,
      totalGaps: gapsIdentified.length,
      totalGapHours: gapsIdentified.reduce((sum, g) => sum + g.duration, 0),
      totalOverlaps: overlaps.length,
      worstDay: coverageByDay.reduce((worst, day) =>
        !worst || day.coveragePercent < worst.coveragePercent ? day : worst, null
      ),
      bestDay: coverageByDay.reduce((best, day) =>
        !best || day.coveragePercent > best.coveragePercent ? day : best, null
      )
    };

    // Generate optimization suggestions
    const suggestions = [];

    if (summary.avgCoverage < 80) {
      suggestions.push({
        priority: 'high',
        type: 'coverage',
        message: `Average coverage is ${summary.avgCoverage}%. Consider adding supervisors or adjusting shift schedules.`
      });
    }

    if (gapsIdentified.length > 5) {
      suggestions.push({
        priority: 'medium',
        type: 'gaps',
        message: `${gapsIdentified.length} coverage gaps identified. Review shift handover procedures.`
      });
    }

    // Find common gap hours
    const gapHourCounts = {};
    gapsIdentified.forEach(g => {
      for (let h = g.startHour; h < g.endHour; h++) {
        gapHourCounts[h] = (gapHourCounts[h] || 0) + 1;
      }
    });
    const problemHours = Object.entries(gapHourCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (problemHours.length > 0) {
      suggestions.push({
        priority: 'medium',
        type: 'timing',
        message: `Most common gap hours: ${problemHours.map(([h]) => `${h}:00`).join(', ')}. Consider shift adjustments.`
      });
    }

    if (overlaps.length > daysInPeriod * 2) {
      suggestions.push({
        priority: 'low',
        type: 'overlap',
        message: `High overlap frequency (${overlaps.length} instances). This may indicate inefficient scheduling, but ensures coverage.`
      });
    }

    res.json({
      success: true,
      period: {
        type: period,
        start: startDate.toISOString(),
        end: now.toISOString(),
        depot: depot || 'All'
      },
      summary,
      coverageByDay: coverageByDay.slice(-14), // Last 14 days
      gaps: gapsIdentified.slice(0, 20), // Most recent 20 gaps
      overlaps: overlaps.slice(0, 20), // Most recent 20 overlaps
      suggestions,
      dutyShifts: DUTY_SHIFTS,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing coverage gaps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze coverage gaps',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/analytics/coverage-alert - Real-time Coverage Alert for SDC
// Checks current coverage status and alerts when gaps exist
router.get('/coverage-alert', async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Define standard duty shifts with precise times
    const DUTY_SHIFTS = {
      '100': { name: 'Early Shift', start: '06:00', end: '15:30', color: '#3b82f6' },
      '200': { name: 'Day Shift', start: '07:30', end: '17:00', color: '#10b981' },
      '400': { name: 'Late Shift', start: '12:30', end: '22:00', color: '#f59e0b' },
      '500': { name: 'Night Shift', start: '14:45', end: '00:15', color: '#8b5cf6' }
    };

    // Check which duties should be active right now
    const expectedDuties = [];
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    for (const [code, shift] of Object.entries(DUTY_SHIFTS)) {
      const [startHour, startMin] = shift.start.split(':').map(Number);
      const [endHour, endMin] = shift.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Handle overnight shifts (e.g., Night Shift 14:45 - 00:15)
      let isActive = false;
      if (endMinutes < startMinutes) {
        // Overnight shift
        isActive = currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
      } else {
        isActive = currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }

      if (isActive) {
        expectedDuties.push({
          code,
          ...shift
        });
      }
    }

    // Get active supervisors from recent activity (last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const isDemoUser = req.user?.badge_number === 'DEMO01';
    const demoSupervisorFilter = isDemoUser ? " AND supervisor_badge = 'DEMO01'" : " AND supervisor_badge != 'DEMO01'";
    const demoActorFilter = isDemoUser ? " AND actor_id = 'DEMO01'" : " AND actor_id != 'DEMO01'";
    let activeSupervisors = [];

    try {
      // Check activities table for recent supervisor activity
      const recentActivities = await query(`
        SELECT DISTINCT
          supervisor_badge,
          supervisor_name,
          duty_code,
          depot,
          MAX(created_at) as last_active
        FROM activities
        WHERE created_at >= ?${demoActorFilter}
        GROUP BY supervisor_badge, supervisor_name, duty_code, depot
        ORDER BY last_active DESC
      `, [thirtyMinutesAgo]);

      activeSupervisors = recentActivities.map(a => ({
        badge: a.supervisor_badge,
        name: a.supervisor_name,
        duty: a.duty_code,
        depot: a.depot,
        lastActive: a.last_active
      }));
    } catch (err) {
      console.warn('Activities table not accessible:', err.message);
    }

    // Also check recent breakdowns as activity proxy
    try {
      const recentBreakdowns = await query(`
        SELECT DISTINCT
          supervisor_badge,
          supervisor_name,
          duty_code,
          depot,
          MAX(created_at) as last_active
        FROM breakdowns
        WHERE created_at >= ?${demoSupervisorFilter}
        GROUP BY supervisor_badge, supervisor_name, duty_code, depot
        ORDER BY last_active DESC
      `, [thirtyMinutesAgo]);

      for (const b of recentBreakdowns) {
        if (!activeSupervisors.find(s => s.badge === b.supervisor_badge)) {
          activeSupervisors.push({
            badge: b.supervisor_badge,
            name: b.supervisor_name,
            duty: b.duty_code,
            depot: b.depot,
            lastActive: b.last_active
          });
        }
      }
    } catch (err) {
      console.warn('Breakdowns table not accessible:', err.message);
    }

    // Get breakdown counts and response times per supervisor (today)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    let supervisorStats = {};
    try {
      // Get active breakdown counts per supervisor
      const breakdownCounts = await query(`
        SELECT
          supervisor_badge,
          COUNT(*) as active_count
        FROM breakdowns
        WHERE status NOT IN ('resolved', 'cleared')${demoSupervisorFilter}
        GROUP BY supervisor_badge
      `);

      for (const row of breakdownCounts) {
        if (row.supervisor_badge) {
          supervisorStats[row.supervisor_badge] = {
            activeBreakdowns: row.active_count,
            todayResolved: 0,
            avgResponseTime: null
          };
        }
      }

      // Get today's resolved count and average response time
      const todayStats = await query(`
        SELECT
          supervisor_badge,
          COUNT(*) as resolved_count,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, resolved_at)) as avg_response_minutes
        FROM breakdowns
        WHERE resolved_at IS NOT NULL
          AND resolved_at >= created_at
          AND DATE(created_at) = CURDATE()${demoSupervisorFilter}
        GROUP BY supervisor_badge
      `);

      for (const row of todayStats) {
        if (row.supervisor_badge) {
          if (!supervisorStats[row.supervisor_badge]) {
            supervisorStats[row.supervisor_badge] = { activeBreakdowns: 0 };
          }
          supervisorStats[row.supervisor_badge].todayResolved = row.resolved_count;
          supervisorStats[row.supervisor_badge].avgResponseTime = row.avg_response_minutes
            ? Math.round(row.avg_response_minutes)
            : null;
        }
      }
    } catch (err) {
      console.warn('Error fetching supervisor stats:', err.message);
    }

    // Demo: the demo supervisor is signed in and on duty — the frontend assigns
    // it the running standard duty with the most time left, so mirror that
    // here (otherwise every demo visit shows a red "no coverage" alarm).
    if (isDemoUser && expectedDuties.length > 0) {
      const minsLeft = (d) => {
        const [h, m] = d.end.split(':').map(Number);
        let end = h * 60 + m;
        if (end <= currentTimeMinutes) end += 24 * 60;
        return end - currentTimeMinutes;
      };
      const demoDuty = [...expectedDuties].sort((a, b) => minsLeft(b) - minsLeft(a))[0];
      const existing = activeSupervisors.find(s => s.badge === 'DEMO01');
      if (existing) {
        existing.duty = demoDuty.code;
      } else {
        activeSupervisors.push({ badge: 'DEMO01', name: 'Demo User', duty: demoDuty.code, depot: 'Northgate', lastActive: now });
      }
    }

    // Determine coverage status
    const activeDuties = [...new Set(activeSupervisors.map(s => s.duty).filter(Boolean))];
    const coveredDuties = expectedDuties.filter(d => activeDuties.includes(d.code));
    const uncoveredDuties = expectedDuties.filter(d => !activeDuties.includes(d.code));

    // Calculate alert level
    let alertLevel = 'normal';
    let alertMessage = 'All expected duties are covered';

    if (expectedDuties.length === 0) {
      alertLevel = 'info';
      alertMessage = 'No scheduled duties at this time';
    } else if (uncoveredDuties.length === expectedDuties.length) {
      alertLevel = 'critical';
      alertMessage = `No supervisor coverage! Expected duties: ${expectedDuties.map(d => `Duty ${d.code}`).join(', ')}`;
    } else if (uncoveredDuties.length > 0) {
      alertLevel = 'warning';
      alertMessage = `Partial coverage gap: ${uncoveredDuties.map(d => `Duty ${d.code}`).join(', ')} not covered`;
    }

    // Calculate time until next shift change
    let nextShiftChange = null;
    let minutesToChange = Infinity;

    for (const duty of expectedDuties) {
      const [endHour, endMin] = duty.end.split(':').map(Number);
      let endMinutes = endHour * 60 + endMin;

      // Handle overnight
      if (endMinutes < currentTimeMinutes) {
        endMinutes += 24 * 60;
      }

      const minsToEnd = endMinutes - currentTimeMinutes;
      if (minsToEnd < minutesToChange) {
        minutesToChange = minsToEnd;
        nextShiftChange = {
          duty: duty.code,
          action: 'ends',
          time: duty.end,
          minutesRemaining: minsToEnd
        };
      }
    }

    // Check for upcoming shifts starting soon (within 60 min)
    for (const [code, shift] of Object.entries(DUTY_SHIFTS)) {
      if (expectedDuties.find(d => d.code === code)) continue;

      const [startHour, startMin] = shift.start.split(':').map(Number);
      let startMinutes = startHour * 60 + startMin;

      // Handle next day
      if (startMinutes < currentTimeMinutes) {
        startMinutes += 24 * 60;
      }

      const minsToStart = startMinutes - currentTimeMinutes;
      if (minsToStart <= 60 && minsToStart < minutesToChange) {
        minutesToChange = minsToStart;
        nextShiftChange = {
          duty: code,
          action: 'starts',
          time: shift.start,
          minutesRemaining: minsToStart
        };
      }
    }

    res.json({
      success: true,
      currentTime: now.toISOString(),
      coverage: {
        alertLevel,
        alertMessage,
        expectedDuties: expectedDuties.map(d => ({
          code: d.code,
          name: d.name,
          timeRange: `${d.start} - ${d.end}`,
          color: d.color,
          isCovered: !uncoveredDuties.find(u => u.code === d.code)
        })),
        activeSupervisors: activeSupervisors.map(s => {
          const stats = supervisorStats[s.badge] || {};
          return {
            badge: s.badge,
            name: s.name,
            duty: s.duty,
            depot: s.depot,
            lastActive: s.lastActive,
            isRecent: new Date(s.lastActive) > new Date(now.getTime() - 10 * 60 * 1000),
            activeBreakdowns: stats.activeBreakdowns || 0,
            todayResolved: stats.todayResolved || 0,
            avgResponseTime: stats.avgResponseTime || null
          };
        }),
        coveredDutyCount: coveredDuties.length,
        uncoveredDutyCount: uncoveredDuties.length,
        totalExpected: expectedDuties.length
      },
      nextShiftChange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking coverage alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check coverage status',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/analytics/lost-trips - Lost trip pattern analysis
// Returns total count, breakdown by route, by depot, and recent lost trips
router.get('/lost-trips', async (req, res) => {
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
      default: // today
        startDate.setHours(0, 0, 0, 0);
    }

    // Total count
    const totalRows = await query(
      'SELECT COUNT(*) as total FROM breakdown_lost_trips WHERE created_at >= ?',
      [startDate]
    );
    const total = totalRows[0]?.total || 0;

    // Breakdown by route (which routes lose the most trips)
    const byRoute = await query(
      `SELECT route_id, COUNT(*) as lost_count
       FROM breakdown_lost_trips
       WHERE created_at >= ? AND route_id IS NOT NULL
       GROUP BY route_id
       ORDER BY lost_count DESC
       LIMIT 20`,
      [startDate]
    );

    // Breakdown by depot
    const byDepot = await query(
      `SELECT depot, COUNT(*) as lost_count
       FROM breakdown_lost_trips
       WHERE created_at >= ? AND depot IS NOT NULL
       GROUP BY depot
       ORDER BY lost_count DESC`,
      [startDate]
    );

    // Recent lost trips (last 20)
    const recent = await query(
      `SELECT * FROM breakdown_lost_trips
       WHERE created_at >= ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [startDate]
    );

    res.json({
      success: true,
      period,
      total,
      byRoute,
      byDepot,
      recent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching lost trips analytics:', error);

    // Graceful degradation if table doesn't exist yet
    const errMsg = error.message || '';
    if (errMsg.includes("doesn't exist") || error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        success: true,
        period: req.query.period || 'today',
        total: 0,
        byRoute: [],
        byDepot: [],
        recent: [],
        message: 'Lost trips table not yet created - apply migration 029',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch lost trips analytics'
    });
  }
});

// GET /api/analytics/eta-accuracy - Engineer ETA accuracy analysis
router.get('/eta-accuracy', async (req, res) => {
  try {
    const period = req.query.period || 'month';
    const periodDays = { today: 1, week: 7, month: 30, quarter: 90, year: 365 }[period] || 30;

    const rows = await query(
      `SELECT
        breakdown_id, fleet_no, depot, engineer_name,
        engineer_dispatched_at, engineer_eta_minutes, engineer_on_site_at,
        TIMESTAMPDIFF(MINUTE, engineer_dispatched_at, engineer_on_site_at) as actual_minutes
      FROM breakdowns
      WHERE engineer_dispatched_at IS NOT NULL
        AND engineer_eta_minutes IS NOT NULL
        AND engineer_on_site_at IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(periodDays)} DAY)${demoSqlFilter(req.user)}
      ORDER BY engineer_dispatched_at DESC`
    );

    const dispatches = (rows || []).map(r => {
      const etaMinutes = parseFloat(r.engineer_eta_minutes) || 0;
      const actualMinutes = parseInt(r.actual_minutes) || 0;
      const variance = actualMinutes - etaMinutes;
      return {
        breakdown_id: r.breakdown_id,
        fleet_no: r.fleet_no,
        depot: r.depot,
        engineer_name: r.engineer_name,
        eta_minutes: etaMinutes,
        actual_minutes: actualMinutes,
        variance_minutes: variance,
        accuracy_pct: etaMinutes > 0 ? Math.max(0, 100 - Math.abs(variance / etaMinutes * 100)) : 0,
        on_time: Math.abs(variance) <= 5,
      };
    });

    const totalDispatches = dispatches.length;
    const onTimeCount = dispatches.filter(d => d.on_time).length;
    const avgVariance = totalDispatches > 0
      ? dispatches.reduce((sum, d) => sum + d.variance_minutes, 0) / totalDispatches
      : 0;
    const avgAccuracy = totalDispatches > 0
      ? dispatches.reduce((sum, d) => sum + d.accuracy_pct, 0) / totalDispatches
      : 0;

    // Group by depot
    const byDepot = {};
    dispatches.forEach(d => {
      if (!byDepot[d.depot]) byDepot[d.depot] = { total: 0, onTime: 0, totalVariance: 0 };
      byDepot[d.depot].total++;
      if (d.on_time) byDepot[d.depot].onTime++;
      byDepot[d.depot].totalVariance += d.variance_minutes;
    });

    const depotAccuracy = Object.entries(byDepot).map(([depot, stats]) => ({
      depot,
      dispatches: stats.total,
      on_time_pct: stats.total > 0 ? Math.round(stats.onTime / stats.total * 100) : 0,
      avg_variance: stats.total > 0 ? Math.round(stats.totalVariance / stats.total) : 0,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          total_dispatches: totalDispatches,
          on_time_pct: totalDispatches > 0 ? Math.round(onTimeCount / totalDispatches * 100) : 0,
          avg_variance_minutes: Math.round(avgVariance),
          avg_accuracy_pct: Math.round(avgAccuracy),
        },
        by_depot: depotAccuracy,
        recent: dispatches.slice(0, 20),
      },
    });
  } catch (error) {
    console.error('ETA accuracy error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ETA accuracy' });
  }
});

// GET /api/analytics/shift-coverage - Engineer shift coverage timeline
router.get('/shift-coverage', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const shifts = await query(
      `SELECT
        eds.engineer_id, eds.shift_date, eds.status, eds.depot_code,
        COALESCE(eds.custom_start, est.start_time) as start_time,
        COALESCE(eds.custom_end, est.end_time) as end_time,
        est.name as shift_name,
        e.name as engineer_name, e.badge_number
      FROM engineer_daily_shifts eds
      LEFT JOIN engineer_shift_templates est ON eds.shift_template_id = est.id
      LEFT JOIN engineers e ON eds.engineer_id = e.id
      WHERE eds.shift_date = ?${isDemoUser(req.user) ? " AND e.badge_number LIKE 'DEMO-%'" : " AND e.badge_number NOT LIKE 'DEMO-%'"}
      ORDER BY eds.depot_code, start_time`,
      [date]
    );

    // Group by depot
    const byDepot = {};
    (shifts || []).forEach(s => {
      const depot = s.depot_code || 'Unknown';
      if (!byDepot[depot]) byDepot[depot] = [];
      byDepot[depot].push({
        engineer_name: s.engineer_name,
        badge_number: s.badge_number,
        shift_name: s.shift_name,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
      });
    });

    // Calculate coverage gaps per depot (hours with 0 engineers)
    const depotCoverage = Object.entries(byDepot).map(([depot, engineers]) => {
      const hoursWithCoverage = new Set();
      engineers.forEach(eng => {
        if (!eng.start_time || !eng.end_time) return;
        const start = parseInt(eng.start_time.split(':')[0]);
        const end = parseInt(eng.end_time.split(':')[0]);
        for (let h = start; h < (end < start ? 24 : end); h++) {
          hoursWithCoverage.add(h % 24);
        }
        if (end < start) {
          for (let h = 0; h < end; h++) hoursWithCoverage.add(h);
        }
      });

      const gaps = [];
      for (let h = 0; h < 24; h++) {
        if (!hoursWithCoverage.has(h)) gaps.push(h);
      }

      return {
        depot,
        engineers_on_shift: engineers.length,
        hours_covered: hoursWithCoverage.size,
        gap_hours: gaps,
        coverage_pct: Math.round(hoursWithCoverage.size / 24 * 100),
      };
    });

    res.json({
      success: true,
      data: {
        date,
        depots: depotCoverage,
        shifts: byDepot,
      },
    });
  } catch (error) {
    console.error('Shift coverage error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shift coverage' });
  }
});

// GET /api/analytics/today-summary - "How is today going" shift-briefing
// aggregate for the Home page. Deliberately separate from /kpis (which is
// period-selectable and drives the Management dashboard) - this is always
// "today", and returns the shapes the Home page's hourly chart / outcomes /
// top-issues / depot / engineering cards need in one round trip rather than
// shipping every raw breakdown row to the client.
// Demo-isolated via demoSqlFilter; read-only.
router.get('/today-summary', async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows = await query(
      `SELECT status, severity, wizard_decision, issue_category, depot, created_at,
              resolved_at, received_at, acknowledged_at,
              engineer_dispatched_at, engineer_on_site_at, engineer_eta_minutes,
              estimated_mileage_lost
       FROM breakdowns
       WHERE created_at >= ?${demoSqlFilter(req.user)}`,
      [startOfDay]
    );

    // Replacement vehicles dispatched against today's breakdowns.
    let replacementsToday = 0;
    try {
      const [rvRow] = await query(
        `SELECT COUNT(*) AS cnt FROM replacement_vehicles rv
         JOIN breakdowns b ON b.breakdown_id = rv.breakdown_id
         WHERE b.created_at >= ?${demoSqlFilter(req.user, { alias: 'b' })}`,
        [startOfDay]
      );
      replacementsToday = Number(rvRow?.cnt) || 0;
    } catch (err) {
      console.warn('Replacement vehicle count not computable:', err.message);
    }

    const RESOLVED_STATUSES = new Set(['resolved', 'completed']);
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, stop: 0, amber: 0, cont: 0, other: 0 }));
    const bySeverity = { STOP: 0, AMBER: 0, CONTINUE: 0, other: 0 };
    const issueCounts = new Map();
    const depotCounts = new Map();
    let resolvedCount = 0;
    let dispatchedCount = 0;
    let onSiteCount = 0;
    const arrivalMinutes = [];
    const etaMinutes = [];
    let mileageLost = 0;
    let responseTotal = 0;
    let responseCount = 0;

    for (const b of rows) {
      const createdAt = b.created_at ? new Date(b.created_at) : null;
      const hour = createdAt ? createdAt.getHours() : 0;
      const sev = String(b.wizard_decision || b.severity || '').toUpperCase();

      if (sev === 'STOP') { hourly[hour].stop++; bySeverity.STOP++; }
      else if (sev === 'AMBER') { hourly[hour].amber++; bySeverity.AMBER++; }
      else if (sev === 'CONTINUE') { hourly[hour].cont++; bySeverity.CONTINUE++; }
      else { hourly[hour].other++; bySeverity.other++; }

      if (RESOLVED_STATUSES.has(b.status)) resolvedCount++;

      if (b.issue_category) {
        issueCounts.set(b.issue_category, (issueCounts.get(b.issue_category) || 0) + 1);
      }
      if (b.depot) {
        depotCounts.set(b.depot, (depotCounts.get(b.depot) || 0) + 1);
      }

      if (b.acknowledged_at && b.received_at) {
        const mins = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
        if (Number.isFinite(mins) && mins >= 0) { responseTotal += mins; responseCount++; }
      }

      if (b.engineer_dispatched_at) {
        dispatchedCount++;
        if (b.engineer_eta_minutes != null) {
          const eta = Number(b.engineer_eta_minutes);
          if (Number.isFinite(eta)) etaMinutes.push(eta);
        }
        if (b.engineer_on_site_at) {
          onSiteCount++;
          const mins = (new Date(b.engineer_on_site_at) - new Date(b.engineer_dispatched_at)) / 60000;
          if (Number.isFinite(mins) && mins >= 0) arrivalMinutes.push(mins);
        }
      }

      if (b.estimated_mileage_lost != null) {
        const miles = parseFloat(b.estimated_mileage_lost);
        if (Number.isFinite(miles)) mileageLost += miles;
      }
    }

    const avg = (arr) => (arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null);

    const topIssues = [...issueCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({ category, count }));

    const depots = [...depotCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([depot, count]) => ({ depot, count }));

    // Best-effort handover/shift notes for today - omit entirely (null) rather
    // than show a fabricated card if the table is empty or unavailable.
    let handoverNotes = null;
    try {
      const noteRows = await query(
        `SELECT id, supervisor_name, duty_code, note, note_type, is_priority, created_at
         FROM duty_notes
         WHERE created_at >= ?${demoSqlFilter(req.user)}
         ORDER BY created_at DESC
         LIMIT 10`,
        [startOfDay]
      );
      if (noteRows && noteRows.length > 0) {
        handoverNotes = noteRows.map((n) => ({
          id: n.id,
          supervisorName: n.supervisor_name,
          dutyCode: n.duty_code,
          note: n.note,
          type: n.note_type,
          priority: !!n.is_priority,
          createdAt: n.created_at
        }));
      }
    } catch (err) {
      console.warn('Duty notes not computable for today-summary:', err.message);
      handoverNotes = null;
    }

    res.json({
      success: true,
      date: startOfDay.toISOString().slice(0, 10),
      totals: {
        reported: rows.length,
        resolved: resolvedCount,
        open: rows.length - resolvedCount,
        avgResponseMinutes: responseCount > 0 ? Math.round(responseTotal / responseCount) : null
      },
      hourly,
      outcomes: { bySeverity, resolved: resolvedCount, open: rows.length - resolvedCount },
      topIssues,
      depots,
      engineering: {
        dispatched: dispatchedCount,
        onSite: onSiteCount,
        avgArrivalMinutes: avg(arrivalMinutes),
        avgEtaMinutes: avg(etaMinutes),
        replacementsSent: replacementsToday,
        mileageLost: rows.length > 0 ? Math.round(mileageLost * 10) / 10 : null
      },
      handoverNotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching today summary:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today summary' });
  }
});

export default router;
