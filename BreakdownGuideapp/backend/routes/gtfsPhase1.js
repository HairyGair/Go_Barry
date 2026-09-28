/**
 * GTFS Phase 1 Features API Routes
 * Purpose: Live route status, coverage analysis, and incident heatmap
 * Created: November 11, 2025
 */

import express from 'express';
import { query } from '../utils/queryHelpers.js';
import { demoSqlFilter, isDemoUser } from '../utils/demoFilter.js';
import { getCurrentDiversions } from './diversions.js';

const router = express.Router();

/**
 * Route status rules, shared by the list and per-route endpoints.
 *  RED   (disrupted): any STOP breakdown (vehicle off the road) or 2+ breakdowns
 *  AMBER (affected):  one AMBER/CONTINUE breakdown
 *  GREEN:             nothing open
 * "Open" means not resolved/cleared, however old - a 24-hour window used to drop
 * long-running breakdowns off route status entirely. Age is returned instead so
 * stale ones are visible.
 */
const KNOWN_SEVERITIES = new Set(['STOP', 'AMBER', 'CONTINUE']);
const normSeverity = (sev) => {
  const up = String(sev || '').trim().toUpperCase();
  return KNOWN_SEVERITIES.has(up) ? up : null;
};
const SEVERITY_RANK = { STOP: 3, AMBER: 2, CONTINUE: 1 };

function routeStatusFor(breakdowns) {
  if (breakdowns.length === 0) return 'GREEN';
  if (breakdowns.length >= 2 || breakdowns.some(b => b.severity === 'STOP')) return 'RED';
  return 'AMBER';
}

function formatBreakdown(b) {
  return {
    id: b.id,
    breakdownId: b.breakdown_id,
    fleetNo: b.fleet_no,
    severity: normSeverity(b.severity),
    status: b.status,
    issueCategory: b.issue_category,
    location: b.location_description,
    depot: b.depot,
    createdAt: b.created_at,
    engineerName: b.engineer_name || null,
    engineerDispatchedAt: b.engineer_dispatched_at || null,
    engineerEtaMinutes: b.engineer_eta_minutes || null,
    engineerOnSiteAt: b.engineer_on_site_at || null,
  };
}

const OPEN_BREAKDOWN_COLUMNS = `
  id, breakdown_id, fleet_no, severity, status, issue_category, location_description,
  depot, route_id, created_at, engineer_name, engineer_dispatched_at,
  engineer_eta_minutes, engineer_on_site_at, wizard_assessment_data`;

// Closed as far as every other screen is concerned (Operations, dispatch board)
const CLOSED_STATUSES = `('resolved', 'cleared', 'completed')`;

// The route a breakdown is on: the route_id column, or - as Operations does -
// the route captured in the wizard answers when the column is empty
function breakdownRouteRef(b) {
  if (b.route_id) return b.route_id;
  let data = b.wizard_assessment_data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = null; }
  }
  const ref = data && (data.route || data.route_number || data.routeNumber);
  return ref ? String(ref) : null;
}

// Where each route runs, from its two most common trip destinations. GTFS is
// static between imports, so this is cached rather than re-aggregating 14k+
// trips on every 10-second refresh.
let destinationsCache = { at: 0, byRoute: null };
const DESTINATIONS_TTL_MS = 60 * 60 * 1000;

async function getRouteDestinations() {
  if (destinationsCache.byRoute && Date.now() - destinationsCache.at < DESTINATIONS_TTL_MS) {
    return destinationsCache.byRoute;
  }
  const rows = await query(`
    SELECT route_id, trip_headsign, COUNT(*) AS trips
    FROM gtfs_trips
    WHERE trip_headsign IS NOT NULL AND trip_headsign <> ''
    GROUP BY route_id, trip_headsign
  `);
  const byRoute = {};
  (rows || []).forEach(r => {
    (byRoute[r.route_id] = byRoute[r.route_id] || []).push({ name: r.trip_headsign, trips: Number(r.trips) });
  });
  Object.keys(byRoute).forEach(id => {
    byRoute[id] = byRoute[id].sort((a, b) => b.trips - a.trips).slice(0, 2).map(x => x.name);
  });
  destinationsCache = { at: Date.now(), byRoute };
  return byRoute;
}

/**
 * Feature 1: Live Route Status Dashboard
 * GET /api/gtfs/routes/status/live
 *
 * Every route with its status (rules above), its open breakdowns, and - for
 * real sessions - where it runs. Also returns open breakdowns that aren't
 * linked to any route, so they don't silently disappear from this view.
 */
router.get('/routes/status/live', async (req, res) => {
  try {
    const demo = isDemoUser(req.user);
    const [routeRows, openRows, destinations, diversions] = await Promise.all([
      query(`
        SELECT route_id, route_short_name, route_long_name
        FROM gtfs_routes
        ORDER BY route_short_name ASC
        LIMIT 500
      `),
      query(`
        SELECT ${OPEN_BREAKDOWN_COLUMNS}
        FROM breakdowns
        WHERE status NOT IN ${CLOSED_STATUSES}${demoSqlFilter(req.user)}
        ORDER BY created_at DESC
      `),
      // Real place names - the public demo uses fictional geography, so skip
      demo ? Promise.resolve({}) : getRouteDestinations().catch(() => ({})),
      // Diversions in force (table may not exist on older installs)
      getCurrentDiversions(req.user).catch(() => []),
    ]);
    const diversionsByRoute = {};
    diversions.forEach(d => {
      const k = String(d.routeShortName || '').trim().toUpperCase();
      (diversionsByRoute[k] = diversionsByRoute[k] || []).push({
        id: d.id, title: d.title, reason: d.reason, directionLabel: d.directionLabel,
        from: d.from?.name, to: d.to?.name, endAt: d.endAt,
        missedStops: (d.missedStops || []).length, extraMinutes: d.extraMinutes,
      });
    });

    // Match on the full GTFS id or the short name (breakdowns store '21')
    const routeKey = (v) => String(v || '').trim().toUpperCase();
    const byKey = new Map();
    (routeRows || []).forEach(r => {
      byKey.set(routeKey(r.route_id), r.route_id);
      if (r.route_short_name) byKey.set(routeKey(r.route_short_name), r.route_id);
    });

    const breakdownsByRoute = {};
    const unlinked = [];
    (openRows || []).forEach(b => {
      const ref = breakdownRouteRef(b);
      const id = ref ? byKey.get(routeKey(ref)) : null;
      const formatted = formatBreakdown(b);
      if (id) (breakdownsByRoute[id] = breakdownsByRoute[id] || []).push(formatted);
      else unlinked.push({ ...formatted, routeRef: ref });
    });

    const statusOrder = { RED: 0, AMBER: 1, GREEN: 2 };
    const formattedResults = (routeRows || []).map(row => {
      const list = (breakdownsByRoute[row.route_id] || [])
        .sort((a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)
          || new Date(a.createdAt) - new Date(b.createdAt));
      const status = routeStatusFor(list);
      const dest = destinations[row.route_id] || [];
      return {
        routeId: row.route_id,
        routeShortName: row.route_short_name,
        routeLongName: row.route_long_name,
        destinations: dest,
        status,
        breakdownCount: list.length,
        lastBreakdownTime: list.length ? list.reduce((m, b) => (new Date(b.createdAt) > new Date(m) ? b.createdAt : m), list[0].createdAt) : null,
        breakdownSeverities: [...new Set(list.map(b => b.severity).filter(Boolean))],
        breakdowns: list,
        diversions: diversionsByRoute[String(row.route_short_name || '').trim().toUpperCase()] || [],
        timestamp: new Date().toISOString(),
      };
    }).sort((a, b) => statusOrder[a.status] - statusOrder[b.status]
      || String(a.routeShortName).localeCompare(String(b.routeShortName), undefined, { numeric: true }));

    const linkedCount = formattedResults.reduce((sum, r) => sum + r.breakdownCount, 0);
    const summary = {
      total_routes: formattedResults.length,
      green_routes: formattedResults.filter(r => r.status === 'GREEN').length,
      amber_routes: formattedResults.filter(r => r.status === 'AMBER').length,
      red_routes: formattedResults.filter(r => r.status === 'RED').length,
      total_active_breakdowns: linkedCount,
      unlinked_breakdowns: unlinked.length,
      open_breakdowns: linkedCount + unlinked.length,
      diverted_routes: formattedResults.filter(r => r.diversions.length > 0).length,
    };

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      routes: formattedResults,
      unlinked,
    });

  } catch (error) {
    console.error('Error fetching live route status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch live route status',
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

    // Open breakdowns for this route, however old
    const breakdowns = await query(`
      SELECT ${OPEN_BREAKDOWN_COLUMNS}
      FROM breakdowns
      WHERE (route_id = ? OR route_id = ?)
      AND status NOT IN ${CLOSED_STATUSES}${demoSqlFilter(req.user)}
      ORDER BY created_at DESC;
    `, [routeId, route.route_short_name]);
    const formatted = (breakdowns || []).map(formatBreakdown);

    return res.json({
      success: true,
      route: {
        routeId: route.route_id,
        routeShortName: route.route_short_name,
        routeLongName: route.route_long_name,
        status: routeStatusFor(formatted),
        activeBreakdownCount: formatted.length,
      },
      breakdowns: formatted,
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
      LEFT JOIN breakdowns b ON (r.route_id = b.route_id OR r.route_short_name = b.route_id)
        AND b.status NOT IN ('resolved', 'cleared')
        AND b.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)${demoSqlFilter(req.user, { alias: 'b' })}
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

    // Mirrors the v_breakdown_heatmap view but applies demo isolation (the view
    // doesn't expose supervisor_badge, so we inline it here).
    const demoB = demoSqlFilter(req.user, { alias: 'b' });
    const demoB2 = demoSqlFilter(req.user, { alias: 'b2' });
    let sqlQuery = `
      SELECT
        b.id,
        b.breakdown_id,
        b.location_lat,
        b.location_lng,
        b.issue_category,
        b.severity,
        b.status,
        b.created_at,
        (
          SELECT COUNT(*) FROM breakdowns b2
          WHERE b2.location_lat IS NOT NULL
          AND b2.location_lng IS NOT NULL
          AND SQRT(
            POW(b2.location_lat - b.location_lat, 2) +
            POW(b2.location_lng - b.location_lng, 2)
          ) < 0.01
          AND b2.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)${demoB2}
        ) as nearby_breakdown_count
      FROM breakdowns b
      WHERE b.location_lat IS NOT NULL
        AND b.location_lng IS NOT NULL
        AND b.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)${demoB}
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

    const safeLimit = Math.min(Math.max(parseInt(limit) || 1000, 1), 5000);
    sqlQuery += ` ORDER BY created_at DESC LIMIT ${safeLimit}`;

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

/**
 * Feature: GTFS Realtime - Affected trips near a breakdown
 * GET /api/gtfs/realtime/affected-trips?lat=X&lng=Y&radius=1
 *
 * Uses BODS GTFS-RT feed (polled every 30s) to show live vehicles
 * near a breakdown location instead of static schedule matching.
 */
import gtfsRealtimeService from '../services/gtfsRealtimeService.js';

router.get('/realtime/affected-trips', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 1;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng are required' });
    }

    const result = gtfsRealtimeService.getAffectedTrips(lat, lng, radius);

    // Enrich with route names from GTFS static data
    if (result.routes.length > 0) {
      try {
        const placeholders = result.routes.map(() => '?').join(',');
        const routeNames = await query(
          `SELECT route_id, route_short_name, route_long_name FROM gtfs_routes WHERE route_id IN (${placeholders})`,
          result.routes
        );
        const routeMap = {};
        (routeNames || []).forEach(r => { routeMap[r.route_id] = r; });
        result.vehicles = result.vehicles.map(v => ({
          ...v,
          route_short_name: routeMap[v.routeId]?.route_short_name || null,
          route_long_name: routeMap[v.routeId]?.route_long_name || null,
        }));
      } catch (e) {
        // Non-critical — return without route names
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('GTFS-RT affected trips error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch affected trips' });
  }
});

router.get('/realtime/status', (req, res) => {
  res.json({ success: true, data: gtfsRealtimeService.getStatus() });
});

export default router;
