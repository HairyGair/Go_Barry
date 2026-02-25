/**
 * Mileage Calculation API Routes
 *
 * Provides endpoints for calculating and reporting mileage lost due to breakdowns.
 * Uses GTFS data to determine route distances and service impact.
 *
 * Created: December 2025
 */

import express from 'express';
import { query } from '../utils/queryHelpers.js';
import {
  calculateMileageLost,
  calculateRouteDistance,
  getMileageLostSummary,
  getRouteFrequency,
} from '../services/mileageCalculationService.js';

const router = express.Router();

/**
 * Calculate mileage lost for a specific breakdown
 * POST /api/mileage/calculate
 *
 * Body:
 * {
 *   routeId: string,          // Required: Route number or GTFS route_id
 *   lat?: number,             // Optional: Breakdown latitude
 *   lng?: number,             // Optional: Breakdown longitude
 *   estimatedDowntimeMinutes?: number,  // Optional: Expected downtime (default: 60)
 *   isFullRouteAffected?: boolean       // Optional: True if entire route affected
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { routeId, lat, lng, estimatedDowntimeMinutes, isFullRouteAffected } = req.body;

    if (!routeId) {
      return res.status(400).json({
        success: false,
        error: 'routeId is required',
      });
    }

    const result = await calculateMileageLost({
      routeId,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      estimatedDowntimeMinutes: estimatedDowntimeMinutes || 60,
      isFullRouteAffected: isFullRouteAffected || false,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error calculating mileage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate mileage',
      details: error.message,
    });
  }
});

/**
 * Get route distance information
 * GET /api/mileage/route/:routeId/distance
 */
router.get('/route/:routeId/distance', async (req, res) => {
  try {
    const { routeId } = req.params;

    const distance = await calculateRouteDistance(routeId);

    if (!distance) {
      return res.status(404).json({
        success: false,
        error: 'Route not found or no GTFS data available',
      });
    }

    return res.json({
      success: true,
      ...distance,
    });
  } catch (error) {
    console.error('Error getting route distance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get route distance',
      details: error.message,
    });
  }
});

/**
 * Get route frequency (trips per hour)
 * GET /api/mileage/route/:routeId/frequency
 */
router.get('/route/:routeId/frequency', async (req, res) => {
  try {
    const { routeId } = req.params;

    const frequency = await getRouteFrequency(routeId);

    return res.json({
      success: true,
      routeId,
      ...frequency,
    });
  } catch (error) {
    console.error('Error getting route frequency:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get route frequency',
      details: error.message,
    });
  }
});

/**
 * Calculate and store mileage for a breakdown
 * POST /api/mileage/breakdown/:breakdownId/calculate
 *
 * Calculates mileage lost and updates the breakdown record
 */
router.post('/breakdown/:breakdownId/calculate', async (req, res) => {
  try {
    const { breakdownId } = req.params;
    const { estimatedDowntimeMinutes } = req.body;

    // Get breakdown details
    const breakdowns = await query(`
      SELECT id, breakdown_id, route_id, location_lat, location_lng, created_at, resolved_at
      FROM breakdowns
      WHERE id = ? OR breakdown_id = ?
      LIMIT 1
    `, [breakdownId, breakdownId]);

    if (!breakdowns || breakdowns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
      });
    }

    const breakdown = breakdowns[0];

    if (!breakdown.route_id) {
      return res.status(400).json({
        success: false,
        error: 'Breakdown does not have a route_id assigned',
      });
    }

    // Fix 2: Calculate actual downtime - live elapsed for open, actual for resolved
    let downtimeMinutes;
    if (estimatedDowntimeMinutes) {
      downtimeMinutes = estimatedDowntimeMinutes;
    } else if (breakdown.resolved_at && breakdown.created_at) {
      const createdAt = new Date(breakdown.created_at);
      const resolvedAt = new Date(breakdown.resolved_at);
      downtimeMinutes = Math.ceil((resolvedAt - createdAt) / (1000 * 60));
    } else if (breakdown.created_at) {
      // Live elapsed time for unresolved breakdowns
      const createdAt = new Date(breakdown.created_at);
      downtimeMinutes = Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60));
    } else {
      downtimeMinutes = 60;
    }

    // Calculate mileage lost (with time-aware frequency)
    const result = await calculateMileageLost({
      routeId: breakdown.route_id,
      lat: breakdown.location_lat,
      lng: breakdown.location_lng,
      estimatedDowntimeMinutes: downtimeMinutes,
      breakdownStartTime: breakdown.created_at,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update breakdown record with mileage data
    await query(`
      UPDATE breakdowns
      SET
        estimated_mileage_lost = ?,
        mileage_calculation_data = ?
      WHERE id = ?
    `, [
      result.mileageLost.totalMiles,
      JSON.stringify(result),
      breakdown.id,
    ]);

    return res.json({
      success: true,
      breakdownId: breakdown.breakdown_id,
      mileageLost: result.mileageLost.totalMiles,
      calculation: result,
      message: 'Mileage calculation saved to breakdown record',
    });
  } catch (error) {
    console.error('Error calculating breakdown mileage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate breakdown mileage',
      details: error.message,
    });
  }
});

/**
 * Daily mileage lost report
 * GET /api/mileage/report/daily
 *
 * Query params:
 * - date: YYYY-MM-DD (defaults to today) - for single day report
 * - days: number (e.g., 7) - for multi-day report (overrides date param)
 */
router.get('/report/daily', async (req, res) => {
  try {
    const { date, days } = req.query;

    // If 'days' parameter is provided, return multi-day data for charts
    if (days && parseInt(days) > 0) {
      const numDays = Math.min(parseInt(days), 90); // Cap at 90 days
      const dailyData = [];
      let totalMileageLost = 0;
      let lastWeekMileageLost = 0;

      // Calculate date range
      const endDateObj = new Date();
      const startDateObj = new Date();
      startDateObj.setDate(endDateObj.getDate() - numDays + 1);

      // Calculate last week's start/end for comparison
      const lastWeekEndObj = new Date();
      lastWeekEndObj.setDate(endDateObj.getDate() - numDays);
      const lastWeekStartObj = new Date();
      lastWeekStartObj.setDate(lastWeekEndObj.getDate() - numDays + 1);

      // Get all breakdowns for the period
      const breakdowns = await query(`
        SELECT
          DATE(b.created_at) as breakdown_date,
          b.route_id,
          r.route_short_name,
          SUM(COALESCE(b.estimated_mileage_lost, 0)) as day_mileage_lost,
          COUNT(*) as breakdown_count
        FROM breakdowns b
        LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
        WHERE b.created_at >= ?
        GROUP BY DATE(b.created_at), b.route_id, r.route_short_name
        ORDER BY breakdown_date ASC
      `, [startDateObj.toISOString().split('T')[0] + ' 00:00:00']);

      // Get last week's total for comparison
      const lastWeekData = await query(`
        SELECT SUM(COALESCE(estimated_mileage_lost, 0)) as total
        FROM breakdowns
        WHERE created_at BETWEEN ? AND ?
      `, [
        lastWeekStartObj.toISOString().split('T')[0] + ' 00:00:00',
        lastWeekEndObj.toISOString().split('T')[0] + ' 23:59:59'
      ]);
      lastWeekMileageLost = lastWeekData?.[0]?.total || 0;

      // Group by date
      const byDate = {};
      const routeTotals = {};

      (breakdowns || []).forEach(b => {
        const dateStr = b.breakdown_date instanceof Date
          ? b.breakdown_date.toISOString().split('T')[0]
          : String(b.breakdown_date).split('T')[0];

        if (!byDate[dateStr]) {
          byDate[dateStr] = { date: dateStr, total: 0, byRoute: {} };
        }
        byDate[dateStr].total += parseFloat(b.day_mileage_lost) || 0;
        totalMileageLost += parseFloat(b.day_mileage_lost) || 0;

        // Track by route
        const routeKey = b.route_short_name || b.route_id || 'Unknown';
        if (!byDate[dateStr].byRoute[routeKey]) {
          byDate[dateStr].byRoute[routeKey] = 0;
        }
        byDate[dateStr].byRoute[routeKey] += parseFloat(b.day_mileage_lost) || 0;

        // Track route totals
        if (!routeTotals[routeKey]) {
          routeTotals[routeKey] = 0;
        }
        routeTotals[routeKey] += parseFloat(b.day_mileage_lost) || 0;
      });

      // Fill in missing dates with zero values
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!byDate[dateStr]) {
          byDate[dateStr] = { date: dateStr, total: 0, byRoute: {} };
        }
        dailyData.push(byDate[dateStr]);
      }

      // Sort by date
      dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Top routes by mileage lost
      const topRoutes = Object.entries(routeTotals)
        .map(([route, miles]) => ({ route, miles }))
        .sort((a, b) => b.miles - a.miles)
        .slice(0, 10);

      return res.json({
        success: true,
        period: `Last ${numDays} days`,
        daily: dailyData,
        summary: {
          totalMileageLost: Math.round(totalMileageLost * 100) / 100,
          lastWeekMileageLost: Math.round(lastWeekMileageLost * 100) / 100,
          avgPerDay: Math.round((totalMileageLost / numDays) * 100) / 100,
        },
        topRoutes,
        timestamp: new Date().toISOString(),
      });
    }

    // Single day report (original behavior)
    const reportDate = date || new Date().toISOString().split('T')[0];

    const startDate = `${reportDate} 00:00:00`;
    const endDate = `${reportDate} 23:59:59`;

    // Get breakdowns with mileage data for the day
    const breakdowns = await query(`
      SELECT
        b.id,
        b.breakdown_id,
        b.fleet_no,
        b.route_id,
        r.route_short_name,
        r.route_long_name,
        b.depot,
        b.severity,
        b.status,
        b.estimated_mileage_lost,
        b.mileage_calculation_data,
        b.created_at,
        b.resolved_at,
        TIMESTAMPDIFF(MINUTE, b.created_at, COALESCE(b.resolved_at, NOW())) as duration_minutes
      FROM breakdowns b
      LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
      WHERE b.created_at BETWEEN ? AND ?
      ORDER BY b.estimated_mileage_lost DESC NULLS LAST, b.created_at DESC
    `, [startDate, endDate]);

    // Calculate summary
    const totalMileageLost = (breakdowns || [])
      .reduce((sum, b) => sum + (parseFloat(b.estimated_mileage_lost) || 0), 0);

    const breakdownsWithMileage = (breakdowns || []).filter(b => b.estimated_mileage_lost > 0);
    const breakdownsWithoutMileage = (breakdowns || []).filter(b => !b.estimated_mileage_lost);

    // Group by route
    const byRoute = {};
    (breakdowns || []).forEach(b => {
      const routeKey = b.route_short_name || b.route_id || 'Unknown';
      if (!byRoute[routeKey]) {
        byRoute[routeKey] = {
          route: routeKey,
          routeName: b.route_long_name,
          breakdownCount: 0,
          mileageLost: 0,
        };
      }
      byRoute[routeKey].breakdownCount++;
      byRoute[routeKey].mileageLost += parseFloat(b.estimated_mileage_lost) || 0;
    });

    // Group by depot
    const byDepot = {};
    (breakdowns || []).forEach(b => {
      const depot = b.depot || 'Unknown';
      if (!byDepot[depot]) {
        byDepot[depot] = {
          depot,
          breakdownCount: 0,
          mileageLost: 0,
        };
      }
      byDepot[depot].breakdownCount++;
      byDepot[depot].mileageLost += parseFloat(b.estimated_mileage_lost) || 0;
    });

    return res.json({
      success: true,
      date: reportDate,
      summary: {
        totalBreakdowns: (breakdowns || []).length,
        breakdownsWithMileageData: breakdownsWithMileage.length,
        breakdownsNeedingCalculation: breakdownsWithoutMileage.length,
        totalMileageLost: Math.round(totalMileageLost * 100) / 100,
        avgMileageLostPerBreakdown: breakdownsWithMileage.length > 0
          ? Math.round((totalMileageLost / breakdownsWithMileage.length) * 100) / 100
          : 0,
      },
      byRoute: Object.values(byRoute).sort((a, b) => b.mileageLost - a.mileageLost),
      byDepot: Object.values(byDepot).sort((a, b) => b.mileageLost - a.mileageLost),
      breakdowns: (breakdowns || []).map(b => ({
        id: b.id,
        breakdownId: b.breakdown_id,
        fleetNo: b.fleet_no,
        route: b.route_short_name || b.route_id,
        routeName: b.route_long_name,
        depot: b.depot,
        severity: b.severity,
        status: b.status,
        mileageLost: parseFloat(b.estimated_mileage_lost) || null,
        durationMinutes: b.duration_minutes,
        createdAt: b.created_at,
        resolvedAt: b.resolved_at,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate daily report',
      details: error.message,
    });
  }
});

/**
 * Weekly/Monthly mileage summary
 * GET /api/mileage/report/summary
 *
 * Query params:
 * - startDate: YYYY-MM-DD
 * - endDate: YYYY-MM-DD
 */
router.get('/report/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required (YYYY-MM-DD format)',
      });
    }

    const result = await getMileageLostSummary(
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`
    );

    return res.json(result);
  } catch (error) {
    console.error('Error generating summary report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate summary report',
      details: error.message,
    });
  }
});

/**
 * Recalculate mileage for all breakdowns missing data
 * POST /api/mileage/recalculate-all
 *
 * Batch processes breakdowns that don't have mileage calculated
 */
router.post('/recalculate-all', async (req, res) => {
  try {
    const { limit = 100 } = req.body;

    // Get breakdowns without mileage data
    const breakdowns = await query(`
      SELECT id, breakdown_id, route_id, location_lat, location_lng, created_at, resolved_at
      FROM breakdowns
      WHERE route_id IS NOT NULL
      AND estimated_mileage_lost IS NULL
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit) || 100}
    `, []);

    if (!breakdowns || breakdowns.length === 0) {
      return res.json({
        success: true,
        message: 'No breakdowns require mileage calculation',
        processed: 0,
      });
    }

    let processed = 0;
    let errors = 0;
    const results = [];

    for (const breakdown of breakdowns) {
      try {
        // Fix 2: Calculate downtime - live elapsed for open, actual for resolved
        let downtimeMinutes;
        if (breakdown.resolved_at && breakdown.created_at) {
          const createdAt = new Date(breakdown.created_at);
          const resolvedAt = new Date(breakdown.resolved_at);
          downtimeMinutes = Math.ceil((resolvedAt - createdAt) / (1000 * 60));
        } else if (breakdown.created_at) {
          const createdAt = new Date(breakdown.created_at);
          downtimeMinutes = Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60));
        } else {
          downtimeMinutes = 60;
        }

        // Calculate mileage (with time-aware frequency)
        const result = await calculateMileageLost({
          routeId: breakdown.route_id,
          lat: breakdown.location_lat,
          lng: breakdown.location_lng,
          estimatedDowntimeMinutes: downtimeMinutes,
          breakdownStartTime: breakdown.created_at,
        });

        if (result.success) {
          // Update breakdown
          await query(`
            UPDATE breakdowns
            SET estimated_mileage_lost = ?, mileage_calculation_data = ?
            WHERE id = ?
          `, [result.mileageLost.totalMiles, JSON.stringify(result), breakdown.id]);

          processed++;
          results.push({
            breakdownId: breakdown.breakdown_id,
            mileageLost: result.mileageLost.totalMiles,
            status: 'success',
          });
        } else {
          errors++;
          results.push({
            breakdownId: breakdown.breakdown_id,
            error: result.error,
            status: 'failed',
          });
        }
      } catch (err) {
        errors++;
        results.push({
          breakdownId: breakdown.breakdown_id,
          error: err.message,
          status: 'error',
        });
      }
    }

    return res.json({
      success: true,
      message: `Processed ${processed} breakdowns, ${errors} errors`,
      processed,
      errors,
      total: breakdowns.length,
      results,
    });
  } catch (error) {
    console.error('Error recalculating mileage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to recalculate mileage',
      details: error.message,
    });
  }
});

/**
 * Get detailed mileage analysis for breakdowns
 * GET /api/mileage/detailed-analysis
 *
 * Query params:
 * - days: number of days to look back (default: 7, max: 90)
 * - depot: filter by depot
 * - route: filter by route
 * - sortBy: 'mileage' | 'date' | 'duration' (default: 'mileage')
 * - limit: max results (default: 50, max: 200)
 */
router.get('/detailed-analysis', async (req, res) => {
  try {
    const {
      days = 7,
      depot,
      route,
      sortBy = 'mileage',
      limit = 50
    } = req.query;

    const numDays = Math.min(parseInt(days) || 7, 90);
    const numLimit = Math.min(parseInt(limit) || 50, 200);

    // Build WHERE clause dynamically
    let whereClause = 'WHERE b.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)';
    const params = [numDays];

    if (depot) {
      whereClause += ' AND b.depot = ?';
      params.push(depot);
    }

    if (route) {
      whereClause += ' AND (b.route_id = ? OR r.route_short_name = ?)';
      params.push(route, route);
    }

    // Determine sort order
    let orderBy = 'b.estimated_mileage_lost DESC';
    if (sortBy === 'date') {
      orderBy = 'b.created_at DESC';
    } else if (sortBy === 'duration') {
      orderBy = 'duration_minutes DESC';
    }

    // Get detailed breakdown data
    const breakdowns = await query(`
      SELECT
        b.id,
        b.breakdown_id,
        b.fleet_no,
        b.route_id,
        r.route_short_name,
        r.route_long_name,
        b.depot,
        b.severity,
        b.status,
        b.issue_category,
        b.wizard_decision,
        b.location_description,
        b.location_lat,
        b.location_lng,
        b.estimated_mileage_lost,
        b.mileage_calculation_data,
        b.created_at,
        b.resolved_at,
        TIMESTAMPDIFF(MINUTE, b.created_at, COALESCE(b.resolved_at, NOW())) as duration_minutes
      FROM breakdowns b
      LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
      ${whereClause}
      AND b.estimated_mileage_lost IS NOT NULL
      AND b.estimated_mileage_lost > 0
      ORDER BY ${orderBy}
      LIMIT ${numLimit}
    `, params);

    // Parse mileage_calculation_data JSON for each breakdown
    const detailedBreakdowns = (breakdowns || []).map(b => {
      let calculationDetails = null;
      try {
        if (b.mileage_calculation_data) {
          calculationDetails = JSON.parse(b.mileage_calculation_data);
        }
      } catch (e) {
        // Ignore parse errors
      }

      return {
        id: b.id,
        breakdownId: b.breakdown_id,
        fleetNo: b.fleet_no,
        route: {
          id: b.route_id,
          shortName: b.route_short_name,
          longName: b.route_long_name,
        },
        depot: b.depot,
        severity: b.severity,
        status: b.status,
        issueCategory: b.issue_category,
        wizardDecision: b.wizard_decision,
        location: {
          description: b.location_description,
          lat: b.location_lat,
          lng: b.location_lng,
        },
        mileage: {
          total: parseFloat(b.estimated_mileage_lost) || 0,
          currentTripMiles: calculationDetails?.mileageLost?.currentTripMiles || 0,
          missedTripsMiles: calculationDetails?.mileageLost?.missedTripsMiles || 0,
          wasCapped: calculationDetails?.mileageLost?.wasCapped || false,
        },
        routeInfo: calculationDetails?.routeInfo || null,
        serviceImpact: calculationDetails?.serviceImpact || null,
        calculation: calculationDetails?.calculation || null,
        durationMinutes: b.duration_minutes,
        durationFormatted: formatDuration(b.duration_minutes),
        createdAt: b.created_at,
        resolvedAt: b.resolved_at,
      };
    });

    // Calculate summary statistics
    const totalMileage = detailedBreakdowns.reduce((sum, b) => sum + b.mileage.total, 0);
    const avgMileage = detailedBreakdowns.length > 0 ? totalMileage / detailedBreakdowns.length : 0;
    const maxMileage = detailedBreakdowns.length > 0 ? Math.max(...detailedBreakdowns.map(b => b.mileage.total)) : 0;

    // Group by route for route summary
    const routeSummary = {};
    detailedBreakdowns.forEach(b => {
      const routeKey = b.route.shortName || b.route.id || 'Unknown';
      if (!routeSummary[routeKey]) {
        routeSummary[routeKey] = {
          route: routeKey,
          routeName: b.route.longName,
          breakdownCount: 0,
          totalMileage: 0,
          breakdowns: [],
        };
      }
      routeSummary[routeKey].breakdownCount++;
      routeSummary[routeKey].totalMileage += b.mileage.total;
      routeSummary[routeKey].breakdowns.push({
        breakdownId: b.breakdownId,
        mileage: b.mileage.total,
        date: b.createdAt,
      });
    });

    // Group by depot for depot summary
    const depotSummary = {};
    detailedBreakdowns.forEach(b => {
      const depotKey = b.depot || 'Unknown';
      if (!depotSummary[depotKey]) {
        depotSummary[depotKey] = {
          depot: depotKey,
          breakdownCount: 0,
          totalMileage: 0,
        };
      }
      depotSummary[depotKey].breakdownCount++;
      depotSummary[depotKey].totalMileage += b.mileage.total;
    });

    return res.json({
      success: true,
      filters: {
        days: numDays,
        depot: depot || null,
        route: route || null,
        sortBy,
        limit: numLimit,
      },
      summary: {
        totalBreakdowns: detailedBreakdowns.length,
        totalMileageLost: Math.round(totalMileage * 100) / 100,
        avgMileagePerBreakdown: Math.round(avgMileage * 100) / 100,
        maxMileageSingleBreakdown: Math.round(maxMileage * 100) / 100,
        cappedBreakdowns: detailedBreakdowns.filter(b => b.mileage.wasCapped).length,
      },
      byRoute: Object.values(routeSummary)
        .sort((a, b) => b.totalMileage - a.totalMileage)
        .map(r => ({
          ...r,
          totalMileage: Math.round(r.totalMileage * 100) / 100,
          avgMileage: Math.round((r.totalMileage / r.breakdownCount) * 100) / 100,
        })),
      byDepot: Object.values(depotSummary)
        .sort((a, b) => b.totalMileage - a.totalMileage)
        .map(d => ({
          ...d,
          totalMileage: Math.round(d.totalMileage * 100) / 100,
        })),
      breakdowns: detailedBreakdowns,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting detailed analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get detailed analysis',
      details: error.message,
    });
  }
});

/**
 * Get single breakdown mileage details
 * GET /api/mileage/breakdown/:breakdownId/details
 */
router.get('/breakdown/:breakdownId/details', async (req, res) => {
  try {
    const { breakdownId } = req.params;

    const breakdowns = await query(`
      SELECT
        b.*,
        r.route_short_name,
        r.route_long_name,
        TIMESTAMPDIFF(MINUTE, b.created_at, COALESCE(b.resolved_at, NOW())) as duration_minutes
      FROM breakdowns b
      LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
      WHERE b.id = ? OR b.breakdown_id = ?
      LIMIT 1
    `, [breakdownId, breakdownId]);

    if (!breakdowns || breakdowns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
      });
    }

    const b = breakdowns[0];

    let calculationDetails = null;
    try {
      if (b.mileage_calculation_data) {
        calculationDetails = JSON.parse(b.mileage_calculation_data);
      }
    } catch (e) {
      // Ignore parse errors
    }

    return res.json({
      success: true,
      breakdown: {
        id: b.id,
        breakdownId: b.breakdown_id,
        fleetNo: b.fleet_no,
        route: {
          id: b.route_id,
          shortName: b.route_short_name,
          longName: b.route_long_name,
        },
        depot: b.depot,
        severity: b.severity,
        status: b.status,
        issueCategory: b.issue_category,
        wizardDecision: b.wizard_decision,
        location: {
          description: b.location_description,
          lat: b.location_lat,
          lng: b.location_lng,
        },
        mileage: {
          total: parseFloat(b.estimated_mileage_lost) || 0,
          currentTripMiles: calculationDetails?.mileageLost?.currentTripMiles || 0,
          missedTripsMiles: calculationDetails?.mileageLost?.missedTripsMiles || 0,
          totalKm: calculationDetails?.mileageLost?.totalKm || 0,
          wasCapped: calculationDetails?.mileageLost?.wasCapped || false,
        },
        routeInfo: calculationDetails?.routeInfo || null,
        breakdownLocation: calculationDetails?.breakdownLocation || null,
        serviceImpact: calculationDetails?.serviceImpact || null,
        calculation: calculationDetails?.calculation || null,
        durationMinutes: b.duration_minutes,
        durationFormatted: formatDuration(b.duration_minutes),
        createdAt: b.created_at,
        resolvedAt: b.resolved_at,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting breakdown details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get breakdown details',
      details: error.message,
    });
  }
});

/**
 * Helper function to format duration
 */
function formatDuration(minutes) {
  if (!minutes || minutes < 0) return 'Unknown';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get top routes by mileage lost
 * GET /api/mileage/top-routes
 */
router.get('/top-routes', async (req, res) => {
  try {
    const { days = 30, limit = 10 } = req.query;

    const results = await query(`
      SELECT
        b.route_id,
        r.route_short_name,
        r.route_long_name,
        COUNT(*) as breakdown_count,
        SUM(COALESCE(b.estimated_mileage_lost, 0)) as total_mileage_lost,
        AVG(COALESCE(b.estimated_mileage_lost, 0)) as avg_mileage_lost,
        MAX(b.created_at) as last_breakdown
      FROM breakdowns b
      LEFT JOIN gtfs_routes r ON b.route_id = r.route_id OR b.route_id = r.route_short_name
      WHERE b.created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
      AND b.route_id IS NOT NULL
      GROUP BY b.route_id, r.route_short_name, r.route_long_name
      ORDER BY total_mileage_lost DESC
      LIMIT ${parseInt(limit) || 20}
    `, [parseInt(days)]);

    return res.json({
      success: true,
      period: `Last ${days} days`,
      routes: (results || []).map(r => ({
        routeId: r.route_id,
        routeShortName: r.route_short_name,
        routeLongName: r.route_long_name,
        breakdownCount: r.breakdown_count,
        totalMileageLost: Math.round((r.total_mileage_lost || 0) * 100) / 100,
        avgMileageLost: Math.round((r.avg_mileage_lost || 0) * 100) / 100,
        lastBreakdown: r.last_breakdown,
      })),
    });
  } catch (error) {
    console.error('Error getting top routes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get top routes',
      details: error.message,
    });
  }
});

export default router;
