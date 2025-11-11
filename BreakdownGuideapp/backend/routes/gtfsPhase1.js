/**
 * GTFS Phase 1 Features API Routes
 * Purpose: Live route status, coverage analysis, and incident heatmap
 * Created: November 11, 2025
 */

import express from 'express';
import { query } from '../utils/queryHelpers.js';

const router = express.Router();

/**
 * Feature 1: Live Route Status Dashboard
 * GET /api/gtfs/routes/status/live
 *
 * Returns real-time status for all routes (Green/Amber/Red)
 * Green: 0 active breakdowns
 * Amber: 1 active breakdown
 * Red: 2+ active breakdowns
 */
router.get('/routes/status/live', async (req, res) => {
  try {
    // Query using the view created in migration
    const results = await query(`
      SELECT
        route_id,
        route_short_name,
        route_long_name,
        active_breakdown_count,
        status,
        last_breakdown_time,
        breakdown_severities
      FROM v_route_status_summary
      ORDER BY
        FIELD(status, 'RED', 'AMBER', 'GREEN'),
        route_short_name ASC
      LIMIT 250;
    `);

    // Format for frontend
    const formattedResults = (results || []).map(row => ({
      routeId: row.route_id,
      routeShortName: row.route_short_name,
      routeLongName: row.route_long_name,
      status: row.status,
      breakdownCount: row.active_breakdown_count,
      lastBreakdownTime: row.last_breakdown_time,
      breakdownSeverities: row.breakdown_severities ? row.breakdown_severities.split(',') : [],
      timestamp: new Date().toISOString(),
    }));

    // Summary stats
    const summary = {
      total_routes: formattedResults.length,
      green_routes: formattedResults.filter(r => r.status === 'GREEN').length,
      amber_routes: formattedResults.filter(r => r.status === 'AMBER').length,
      red_routes: formattedResults.filter(r => r.status === 'RED').length,
      total_active_breakdowns: formattedResults.reduce((sum, r) => sum + r.breakdownCount, 0),
    };

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      routes: formattedResults,
    });

  } catch (error) {
    console.error('Error fetching live route status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch live route status',
      details: error.message,
    });
  }
});

/**
 * Feature 1 (Extended): Get status for a specific route
 * GET /api/gtfs/routes/:routeId/status
 */
router.get('/routes/:routeId/status', async (req, res) => {
  try {
    const { routeId } = req.params;

    // Get route details
    const routeRows = await query(`
      SELECT route_id, route_short_name, route_long_name
      FROM gtfs_routes
      WHERE route_id = ?
      LIMIT 1;
    `, [routeId]);

    if (!routeRows || routeRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    }

    const route = routeRows[0];

    // Get active breakdowns for this route (last 24 hours)
    const breakdowns = await query(`
      SELECT
        id,
        breakdown_id,
        fleet_no,
        severity,
        status,
        issue_category,
        location_description,
        location_lat,
        location_lng,
        supervisor_name,
        created_at,
        resolved_at
      FROM breakdowns
      WHERE route_id = ?
      AND status NOT IN ('resolved', 'cleared')
      AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY severity DESC, created_at DESC;
    `, [routeId]);

    return res.json({
      success: true,
      route: {
        routeId: route.route_id,
        routeShortName: route.route_short_name,
        routeLongName: route.route_long_name,
        status: !breakdowns || breakdowns.length === 0 ? 'GREEN' : (breakdowns.length === 1 ? 'AMBER' : 'RED'),
        activeBreakdownCount: breakdowns ? breakdowns.length : 0,
      },
      breakdowns: (breakdowns || []).map(b => ({
        id: b.id,
        breakdownId: b.breakdown_id,
        fleetNo: b.fleet_no,
        severity: b.severity,
        issueCategory: b.issue_category,
        location: b.location_description,
        lat: b.location_lat,
        lng: b.location_lng,
        supervisor: b.supervisor_name,
        createdAt: b.created_at,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching route status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch route status',
      details: error.message,
    });
  }
});

/**
 * Feature 2: Route Coverage Analysis
 * GET /api/gtfs/routes/coverage/analysis
 *
 * Identifies which routes have backup vehicle coverage
 * Returns routes at risk (low spare vehicle coverage)
 */
router.get('/routes/coverage/analysis', async (req, res) => {
  try {
    // Query breakdown counts per route
    const results = await query(`
      SELECT
        r.route_id,
        r.route_short_name,
        r.route_long_name,
        COUNT(DISTINCT f.fleet_no) as total_vehicles,
        COUNT(DISTINCT CASE
          WHEN f.vehicle_status = 'active' OR f.vehicle_status IS NULL
          THEN f.fleet_no
        END) as active_vehicles,
        COUNT(DISTINCT CASE
          WHEN f.vehicle_status = 'spare'
          THEN f.fleet_no
        END) as spare_vehicles,
        COUNT(DISTINCT b.id) as active_breakdowns
      FROM gtfs_routes r
      LEFT JOIN fleet_vehicles f ON r.route_id = f.route_id OR r.route_short_name = f.route_short_name
      LEFT JOIN breakdowns b ON r.route_id = b.route_id
        AND b.status NOT IN ('resolved', 'cleared')
        AND b.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY r.route_id, r.route_short_name, r.route_long_name
      HAVING total_vehicles > 0
      ORDER BY spare_vehicles ASC, active_breakdowns DESC;
    `);

    // Calculate coverage and risk status
    const analysis = (results || []).map(row => {
      const totalVehicles = row.total_vehicles || 0;
      const spareVehicles = row.spare_vehicles || 0;
      const coveragePercentage = totalVehicles > 0 ? ((spareVehicles / totalVehicles) * 100).toFixed(1) : 0;

      let riskStatus = 'GREEN';
      if (coveragePercentage < 5 && row.active_breakdowns > 0) {
        riskStatus = 'RED'; // Critical: No spares and breakdown active
      } else if (coveragePercentage < 10) {
        riskStatus = 'AMBER'; // Warning: Low spare coverage
      }

      return {
        routeId: row.route_id,
        routeShortName: row.route_short_name,
        routeLongName: row.route_long_name,
        totalVehicles,
        activeVehicles: row.active_vehicles || 0,
        spareVehicles,
        coveragePercentage: parseFloat(coveragePercentage),
        riskStatus,
        activeBreakdowns: row.active_breakdowns,
        recommendation: spareVehicles === 0 && row.active_breakdowns > 0
          ? 'CRITICAL: No spare vehicles and active breakdown'
          : spareVehicles < 2
            ? 'LOW COVERAGE: Consider preventive maintenance'
            : 'OK: Adequate backup coverage',
      };
    });

    // Summary
    const summary = {
      totalRoutes: analysis.length,
      routesByRisk: {
        RED: analysis.filter(r => r.riskStatus === 'RED').length,
        AMBER: analysis.filter(r => r.riskStatus === 'AMBER').length,
        GREEN: analysis.filter(r => r.riskStatus === 'GREEN').length,
      },
      atRiskRoutes: analysis.filter(r => r.riskStatus !== 'GREEN'),
    };

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      coverage: analysis.slice(0, 100), // Top 100 routes
    });

  } catch (error) {
    console.error('Error fetching coverage analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch coverage analysis',
      details: error.message,
    });
  }
});

/**
 * Feature 3: Stop-Level Incident Heatmap
 * GET /api/gtfs/breakdowns/heatmap
 *
 * Returns breakdown data for map visualization
 * Includes clustering information and hotspot identification
 */
router.get('/breakdowns/heatmap', async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 5, // km
      severity,
      daysBack = 30,
      limit = 1000,
    } = req.query;

    let sqlQuery = `
      SELECT
        id,
        breakdown_id,
        location_lat,
        location_lng,
        issue_category,
        severity,
        status,
        created_at,
        nearby_breakdown_count
      FROM v_breakdown_heatmap
      WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const params = [parseInt(daysBack) || 30];

    // Filter by severity if provided
    if (severity) {
      sqlQuery += ` AND severity = ?`;
      params.push(severity);
    }

    // Filter by location radius if lat/lng provided
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius) || 5;

      sqlQuery += `
        AND SQRT(
          POW(location_lat - ?, 2) +
          POW(location_lng - ?, 2)
        ) * 111 < ?
      `;
      params.push(latNum, lngNum, radiusKm);
    }

    sqlQuery += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit) || 1000);

    const breakdowns = await query(sqlQuery, params);

    // Cluster analysis - group by nearby_breakdown_count
    const hotspots = (breakdowns || [])
      .filter(b => b.nearby_breakdown_count > 1)
      .reduce((acc, breakdown) => {
        const key = `${breakdown.location_lat.toFixed(4)}-${breakdown.location_lng.toFixed(4)}`;
        if (!acc[key]) {
          acc[key] = {
            lat: breakdown.location_lat,
            lng: breakdown.location_lng,
            count: 0,
            breakdowns: [],
            intensity: 0,
          };
        }
        acc[key].count = breakdown.nearby_breakdown_count;
        acc[key].breakdowns.push({
          id: breakdown.id,
          breakdownId: breakdown.breakdown_id,
          severity: breakdown.severity,
          issueCategory: breakdown.issue_category,
          createdAt: breakdown.created_at,
        });
        return acc;
      }, {});

    const hotspotList = Object.values(hotspots)
      .map(hotspot => ({
        ...hotspot,
        intensity: Math.min(hotspot.count / 10, 1), // 0-1 scale
        intensityLevel: hotspot.count > 50 ? 'CRITICAL'
          : hotspot.count > 20 ? 'HIGH'
            : hotspot.count > 10 ? 'MEDIUM'
              : 'LOW',
      }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalBreakdowns: (breakdowns || []).length,
        hotspotCount: hotspotList.length,
        criticalHotspots: hotspotList.filter(h => h.intensityLevel === 'CRITICAL').length,
      },
      breakdowns: (breakdowns || []).map(b => ({
        id: b.id,
        breakdownId: b.breakdown_id,
        location: { lat: b.location_lat, lng: b.location_lng },
        severity: b.severity,
        issueCategory: b.issue_category,
        status: b.status,
        createdAt: b.created_at,
        nearbyCount: b.nearby_breakdown_count,
      })),
      hotspots: hotspotList,
    });

  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch heatmap data',
      details: error.message,
    });
  }
});

/**
 * Health check endpoint for Phase 1
 * GET /api/gtfs/health
 */
router.get('/health', async (req, res) => {
  try {
    const result = await query('SELECT 1');

    return res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

export default router;
