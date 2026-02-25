/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import express from 'express';
import { from, query, insert, update } from '../utils/queryHelpers.js';
import breakdownIdGenerator from '../services/breakdownIdGenerator.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';
import webSocketHandler from './webSocketHandler.js';
import { validate } from '../middleware/validationMiddleware.js';
import { breakdownSchemas } from '../validation/schemas.js';
import breakdownAssignmentService from '../services/breakdownAssignmentService.js';
import { calculateMileageLost } from '../services/mileageCalculationService.js';
import { calculateRoadDistance } from '../services/googleDirectionsService.js';
import { replacementSchemas } from '../validation/schemas.js';

const router = express.Router();

// Helper function to format datetime for MySQL
// Converts ISO 8601 (2025-10-28T22:29:52.324Z) to MySQL format (2025-10-28 22:29:52)
const toMySQLDatetime = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to transform breakdown data for frontend compatibility
// Maps database field names to expected frontend field names
const transformBreakdownForFrontend = (breakdown) => {
  if (!breakdown) return breakdown;

  return {
    ...breakdown,
    // Map location_description to location for frontend compatibility
    location: breakdown.location_description || breakdown.location,
    // Extract route from wizard_assessment_data if available
    route_id: breakdown.wizard_assessment_data?.route ||
              breakdown.route_id ||
              breakdown.route ||
              null
  };
};

// Transform an array of breakdowns
const transformBreakdownsArray = (breakdowns) => {
  if (!Array.isArray(breakdowns)) return breakdowns;
  return breakdowns.map(transformBreakdownForFrontend);
};

// Helper function to detect and broadcast critical patterns
const detectAndBroadcastCriticalPatterns = async (breakdown, issueCategory, fleetNumber, depot) => {
  try {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    // Pattern 1: Same defect type on 5+ vehicles in 24 hours
    if (issueCategory && issueCategory !== 'Unknown') {
      const { data: sameDefectBreakdowns, error: defectError } = await from('breakdowns')
        .select('fleet_no, issue_category')
        .eq('issue_category', issueCategory)
        .gte('created_at', last24Hours.toISOString())
        .execute();

      if (!defectError && sameDefectBreakdowns && sameDefectBreakdowns.length >= 5) {
        const uniqueVehicles = [...new Set(sameDefectBreakdowns.map(b => b.fleet_no).filter(f => f && f !== 'TBC'))];

        if (uniqueVehicles.length >= 5) {
          webSocketHandler.broadcastCriticalPattern({
            message: `${issueCategory} affecting ${uniqueVehicles.length} vehicles in last 24 hours - potential fleet-wide issue`,
            priority: 'critical',
            affectedVehicles: uniqueVehicles.slice(0, 10),
            defectType: issueCategory,
            count: uniqueVehicles.length,
            timeframe: '24h'
          });
          console.log(`🚨 Critical pattern detected: ${issueCategory} on ${uniqueVehicles.length} vehicles`);
        }
      }
    }

    // Pattern 2: Same vehicle experiencing issues 3+ times in 24 hours
    if (fleetNumber && fleetNumber !== 'TBC') {
      const { data: vehicleBreakdowns, error: vehicleError } = await from('breakdowns')
        .select('breakdown_id, issue_category, created_at')
        .eq('fleet_no', fleetNumber)
        .gte('created_at', last24Hours.toISOString())
        .execute();

      if (!vehicleError && vehicleBreakdowns && vehicleBreakdowns.length >= 3) {
        webSocketHandler.broadcastCriticalPattern({
          message: `Vehicle ${fleetNumber} has ${vehicleBreakdowns.length} breakdowns in last 24 hours - immediate maintenance required`,
          priority: 'high',
          affectedVehicles: [fleetNumber],
          defectCount: vehicleBreakdowns.length,
          timeframe: '24h',
          defects: vehicleBreakdowns.map(b => b.issue_category)
        });
        console.log(`🚨 Critical pattern detected: Vehicle ${fleetNumber} with ${vehicleBreakdowns.length} breakdowns`);
      }
    }

    // Pattern 3: Depot defect rate spike (>25% increase from previous 24h period)
    if (depot && depot !== 'Unknown') {
      const previous48to24Hours = new Date(last24Hours);
      previous48to24Hours.setHours(previous48to24Hours.getHours() - 24);

      // Get current period count
      const currentPeriodSQL = `SELECT COUNT(*) as count FROM breakdowns
        WHERE depot = ? AND created_at >= ?`;
      const currentPeriodResult = await query(currentPeriodSQL, [depot, last24Hours.toISOString()]);
      const currentCount = currentPeriodResult[0]?.count || 0;

      // Get previous period count
      const previousPeriodSQL = `SELECT COUNT(*) as count FROM breakdowns
        WHERE depot = ? AND created_at >= ? AND created_at < ?`;
      const previousPeriodResult = await query(previousPeriodSQL, [
        depot,
        previous48to24Hours.toISOString(),
        last24Hours.toISOString()
      ]);
      const previousCount = previousPeriodResult[0]?.count || 0;

      if (previousCount > 0) {
        const increasePercent = ((currentCount - previousCount) / previousCount) * 100;

        if (increasePercent > 25 && currentCount >= 5) {
          webSocketHandler.broadcastCriticalPattern({
            message: `${depot} depot defect rate spike: ${increasePercent.toFixed(0)}% increase (${currentCount} vs ${previousCount})`,
            priority: 'high',
            depot: depot,
            currentCount,
            previousCount,
            increasePercent: Math.round(increasePercent),
            timeframe: '24h'
          });
          console.log(`🚨 Critical pattern detected: ${depot} defect rate spike ${increasePercent.toFixed(0)}%`);
        }
      }
    }

  } catch (error) {
    console.error('Error in pattern detection:', error);
    // Silently fail - don't throw
  }
};

// GET /api/breakdowns - Get all breakdowns with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, depot } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let queryBuilder = from('breakdowns')
      .select('*')
      .order('created_at', 'DESC')
      .limit(parseInt(limit))
      .offset(offset);

    // Hide demo breakdowns from real users
    const isDemoUser = req.user?.badge_number === 'DEMO01';
    if (!isDemoUser) {
      queryBuilder = queryBuilder.neq('supervisor_badge', 'DEMO01');
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    const { data, error } = await queryBuilder.execute();

    if (error) throw error;

    // Get total count for pagination
    let countSQL = 'SELECT COUNT(*) as count FROM breakdowns WHERE 1=1';
    const countParams = [];

    // Hide demo breakdowns from real users
    if (!isDemoUser) {
      countSQL += " AND supervisor_badge != 'DEMO01'";
    }

    if (status) {
      countSQL += ' AND status = ?';
      countParams.push(status);
    }

    if (depot) {
      countSQL += ' AND depot = ?';
      countParams.push(depot);
    }

    const countResult = await query(countSQL, countParams);
    const count = countResult[0]?.count || 0;

    // Transform breakdowns for frontend compatibility
    const transformedData = transformBreakdownsArray(data);

    res.json({
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch breakdowns' });
  }
});

// GET /api/breakdowns/active - Get active breakdowns
router.get('/active', async (req, res) => {
  try {
    let activeQuery = from('breakdowns')
      .select('*')
      .in('status', ['active', 'pending', 'in_progress'])
      .order('created_at', 'DESC');

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      activeQuery = activeQuery.neq('supervisor_badge', 'DEMO01');
    }

    const { data, error } = await activeQuery.execute();

    if (error) throw error;

    // Transform breakdowns for frontend compatibility
    const transformedData = transformBreakdownsArray(data);

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching active breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch active breakdowns' });
  }
});

// Helper: Batch-fetch the next scheduled trip for breakdowns with a linked trip_id
// Uses turnaround inference (same route, opposite direction, departing after current trip arrives)
async function batchFetchNextTrips(breakdowns) {
  const withTrip = breakdowns.filter(b => b.trip_id && !b.next_trip_action);
  if (withTrip.length === 0) return {};

  const results = {}; // keyed by breakdown_id

  for (const b of withTrip) {
    try {
      // Query A: Get current trip info (route, direction, service, arrival time)
      const currentTripRows = await query(
        `SELECT t.route_id, t.direction_id, t.service_id,
                MAX(st.departure_time) as arrival_time
         FROM gtfs_trips t
         JOIN gtfs_stop_times st ON st.trip_id = t.trip_id
         WHERE t.trip_id = ?
         GROUP BY t.route_id, t.direction_id, t.service_id`,
        [b.trip_id]
      );

      if (!currentTripRows || currentTripRows.length === 0) continue;
      const current = currentTripRows[0];

      // Determine day code filter from service_id
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
      let dayFilter;
      if (dayOfWeek === 0) dayFilter = '%SU%';
      else if (dayOfWeek === 6) dayFilter = '%SA%';
      else dayFilter = '%MF%';

      // Calculate time window: arrival_time to arrival_time + 90 minutes
      const arrParts = current.arrival_time.split(':').map(Number);
      const arrMins = arrParts[0] * 60 + arrParts[1];
      const windowEnd = arrMins + 90;
      const arrTimeStr = current.arrival_time;
      const endHrs = Math.floor(windowEnd / 60);
      const endMinsRem = windowEnd % 60;
      const endTimeStr = `${String(endHrs).padStart(2, '0')}:${String(endMinsRem).padStart(2, '0')}:00`;

      // Query B: Find next trip (opposite direction, after arrival, within 90min window)
      const nextTripRows = await query(
        `SELECT t.trip_id, t.trip_headsign, t.direction_id,
                MIN(st.departure_time) as departure_time,
                MAX(st.departure_time) as next_arrival_time
         FROM gtfs_trips t
         JOIN gtfs_stop_times st ON st.trip_id = t.trip_id
         WHERE t.route_id = ?
           AND t.direction_id != ?
           AND t.service_id LIKE ?
         GROUP BY t.trip_id, t.trip_headsign, t.direction_id
         HAVING departure_time >= ? AND departure_time <= ?
         ORDER BY departure_time ASC
         LIMIT 1`,
        [current.route_id, current.direction_id, dayFilter, arrTimeStr, endTimeStr]
      );

      if (!nextTripRows || nextTripRows.length === 0) continue;
      const next = nextTripRows[0];

      // Query C: Get origin/dest stop names for the next trip
      const endpointRows = await query(
        `SELECT sub.endpoint, s.stop_name
         FROM (
           SELECT st.stop_id, 'origin' as endpoint
           FROM gtfs_stop_times st
           WHERE st.trip_id = ?
             AND st.stop_sequence = (SELECT MIN(st2.stop_sequence) FROM gtfs_stop_times st2 WHERE st2.trip_id = st.trip_id)
           UNION ALL
           SELECT st.stop_id, 'dest' as endpoint
           FROM gtfs_stop_times st
           WHERE st.trip_id = ?
             AND st.stop_sequence = (SELECT MAX(st2.stop_sequence) FROM gtfs_stop_times st2 WHERE st2.trip_id = st.trip_id)
         ) sub
         JOIN gtfs_stops s ON sub.stop_id = s.stop_id`,
        [next.trip_id, next.trip_id]
      );

      let originStop = null, destStop = null;
      for (const row of (endpointRows || [])) {
        if (row.endpoint === 'origin') originStop = row.stop_name;
        if (row.endpoint === 'dest') destStop = row.stop_name;
      }

      results[b.breakdown_id] = {
        tripId: next.trip_id,
        headsign: next.trip_headsign || 'Unknown',
        departureTime: next.departure_time,
        arrivalTime: next.next_arrival_time,
        originStop,
        destStop,
        directionId: next.direction_id
      };
    } catch (err) {
      console.error(`Next trip lookup failed for breakdown ${b.breakdown_id}:`, err.message);
      // Continue to next breakdown - don't fail the batch
    }
  }

  return results;
}

// GET /api/breakdowns/live - Get active breakdowns for dashboards
router.get('/live', async (req, res) => {
  try {
    console.log('\n=== LIVE BREAKDOWNS REQUEST ===');

    // Query for unresolved breakdowns using direct MySQL query
    // Exclude: resolved, deleted, cancelled, completed statuses
    // Hide demo breakdowns from real users
    const isDemoUser = req.user?.badge_number === 'DEMO01';
    const demoFilter = isDemoUser ? '' : " AND supervisor_badge != 'DEMO01'";
    const breakdowns = await query(`
      SELECT * FROM breakdowns
      WHERE status NOT IN ('resolved', 'deleted', 'cancelled', 'completed')${demoFilter}
      ORDER BY created_at DESC
    `);

    console.log(`✅ /live endpoint: Returning ${breakdowns?.length || 0} active breakdowns`);

    // Batch-fetch next trip data for breakdowns with linked trips
    let nextTripMap = {};
    try {
      nextTripMap = await batchFetchNextTrips(breakdowns);
    } catch (ntErr) {
      console.error('Non-fatal: batchFetchNextTrips failed:', ntErr.message);
    }

    // Batch-fetch replacement vehicle data
    let replacementMap = {};
    try {
      const breakdownIds = breakdowns.map(b => b.breakdown_id).filter(Boolean);
      if (breakdownIds.length > 0) {
        const placeholders = breakdownIds.map(() => '?').join(',');
        const replacements = await query(
          `SELECT * FROM replacement_vehicles WHERE breakdown_id IN (${placeholders}) AND status != 'cancelled'`,
          breakdownIds
        );
        if (replacements) {
          for (const rv of replacements) {
            replacementMap[rv.breakdown_id] = rv;
          }
        }
      }
    } catch (rvErr) {
      console.error('Non-fatal: replacement_vehicles fetch failed:', rvErr.message);
    }

    // Additional processing for dashboard compatibility
    const formattedBreakdowns = breakdowns.map(b => {
      // Calculate elapsed minutes from created_at
      const elapsedMinutes = Math.floor((new Date() - new Date(b.created_at)) / (1000 * 60));
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = Math.floor(elapsedMinutes % 60);

      let durationText = '';
      if (elapsedHours > 0) {
        durationText = `${elapsedHours}h ${remainingMinutes}m`;
      } else {
        durationText = `${remainingMinutes}m`;
      }

      // Extract data from wizard_assessment_data if main columns are empty/null
      const wizardData = b.wizard_assessment_data || {};

      // Supervisor info - prioritize main columns, fallback to wizard_assessment_data
      const supervisorName = b.supervisor_name || wizardData.supervisorName || wizardData.supervisor_name || null;
      const supervisorBadge = b.supervisor_badge || wizardData.supervisorBadge || wizardData.supervisor_badge || null;
      const depot = b.depot || wizardData.depot || null;

      // Determine priority level and status color
      const priorityLevel = b.priority_level || (
        b.severity === 'STOP' ? 1 :
        b.severity === 'AMBER' ? 2 : 3
      );

      const statusColor = b.status_color || (
        b.severity === 'STOP' ? 'red' :
        b.severity === 'AMBER' ? 'orange' :
        b.severity === 'CONTINUE' ? 'green' : 'gray'
      );

      const cardTitle = b.card_title ||
        `${b.fleet_no || 'TBC'} - ${b.issue_category || 'Assessment Required'}`;

      return {
        // Core identifiers
        breakdown_id: b.breakdown_id,
        id: b.breakdown_id,

        // Vehicle information
        fleet_no: b.fleet_no || 'TBC',
        fleet_number: b.fleet_no || 'TBC',
        registration: b.registration,
        depot_id: depot,
        depot: depot,

        // Location and issue information
        location: b.location_description || b.location || 'Location TBC',
        location_description: b.location_description || b.location || 'Location TBC',
        location_lat: b.location_lat || b.wizard_assessment_data?.location_coords?.lat || null,
        location_lng: b.location_lng || b.wizard_assessment_data?.location_coords?.lng || null,
        issue_type: b.issue_category || 'Assessment Required',
        issue_category: b.issue_category || 'Assessment Required',
        issue_description: b.description,

        // Status and severity
        status: b.status,
        severity: b.severity,
        wizard_decision: b.wizard_decision,
        criticality: b.criticality || b.severity,

        // Timing information
        created_at: b.created_at,
        updated_at: b.updated_at,
        elapsed_minutes: elapsedMinutes,
        duration_text: durationText,

        // Route and priority - extract from wizard_assessment_data if available
        route_id: b.wizard_assessment_data?.route || b.route_id || b.route || null,
        route: b.wizard_assessment_data?.route || b.route || null,
        route_number: b.wizard_assessment_data?.route || b.route || null,
        route_name: b.wizard_assessment_data?.route_name || b.route_name || null,
        service: b.wizard_assessment_data?.route || b.route || null,
        is_priority: priorityLevel <= 2 || b.secured_mileage,
        priority_level: priorityLevel,

        // Supervisor information - use extracted values
        supervisor_badge: supervisorBadge,
        supervisor_name: supervisorName,

        // Dashboard card information
        card_title: cardTitle,
        status_color: statusColor,
        requires_immediate_action: b.requires_immediate_action || (b.severity === 'STOP') || (priorityLevel <= 2) || b.secured_mileage,

        // Operational flags
        secured_mileage: b.secured_mileage || false,

        // GTFS trip link
        trip_id: b.trip_id || null,
        block_id: b.block_id || null,

        // Next trip countdown alert
        next_trip: nextTripMap[b.breakdown_id] || null,
        next_trip_action: b.next_trip_action || null,

        // Replacement vehicle data (BSOG mileage tracking)
        replacement_vehicle: replacementMap[b.breakdown_id] || null,

        // Wizard assessment data (for frontend to access additional context)
        wizard_assessment_data: b.wizard_assessment_data || null,

        // Legacy compatibility fields
        driver_name: b.driver_name,
        driver_phone: b.driver_phone,
        passenger_count: b.passenger_count,
        received_at: b.received_at || b.created_at,
        acknowledged_at: b.acknowledged_at,
        decision_at: b.decision_at,
        dispatched_at: b.dispatched_at,
        on_site_at: b.on_site_at,
        cleared_at: b.cleared_at,

        // Engineer ETA countdown fields
        engineer_dispatched_at: b.engineer_dispatched_at || b.dispatched_at || null,
        engineer_eta_minutes: b.engineer_eta_minutes ? parseInt(b.engineer_eta_minutes) : null,
        engineer_name: b.engineer_name || null,
        engineer_on_site_at: b.engineer_on_site_at || b.on_site_at || null
      };
    });

    res.json({
      success: true,
      breakdowns: formattedBreakdowns,
      timestamp: new Date().toISOString(),
      count: formattedBreakdowns.length
    });
  } catch (error) {
    console.error('Error fetching live breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live breakdowns',
      timestamp: new Date().toISOString(),
      breakdowns: [] // Return empty array for graceful degradation
    });
  }
});

// GET /api/breakdowns/stats - Get breakdown statistics (moved before :id route)
router.get('/stats', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    let statsQuery = from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString());

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      statsQuery = statsQuery.neq('supervisor_badge', 'DEMO01');
    }

    const { data, error } = await statsQuery.execute();

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      pending: data.filter(b => b.status === 'pending').length,
      resolved: data.filter(b => b.status === 'resolved').length,
      in_progress: data.filter(b => b.status === 'in_progress').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching breakdown stats:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown statistics' });
  }
});

// GET /api/breakdowns/:id - Get specific breakdown
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

// POST /api/breakdowns - Create new breakdown
router.post('/', async (req, res) => {
  try {
    // Generate unique breakdown ID with daily counter
    const idResult = await breakdownIdGenerator.generateId();

    // Extract duty context from request (sent by frontend from sessionStorage)
    const dutyCode = req.body.duty_code || null;
    const dutyName = req.body.duty_name || null;

    // Extract route_id from wizard_assessment_data if not provided directly
    const wizardData = req.body.wizard_assessment_data || {};
    const routeId = req.body.route_id ||
                    wizardData.route ||
                    req.body.route ||
                    null;

    const breakdownData = {
      ...req.body,
      breakdown_id: idResult.id,
      created_at: toMySQLDatetime(),
      status: req.body.status || 'received',
      // Add duty context for shift-based reporting
      duty_code: dutyCode,
      duty_name: dutyName,
      // Ensure route_id is populated for mileage calculations
      route_id: routeId
    };

    // Log duty context if present
    if (dutyCode) {
      console.log(`📋 Breakdown created during ${dutyName || dutyCode} shift`);
    }

    const insertResult = await insert('breakdowns', breakdownData);

    // Fetch the created breakdown
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq('id', insertResult.insertId)
      .single();

    if (error) throw error;

    // Log activity to the unified activity feed
    try {
      await activityLogger.logBreakdownReported({
        supervisorId: data.supervisor_badge || data.supervisor_id || 'unknown',
        supervisorName: data.supervisor_name || 'Supervisor',
        breakdownId: data.breakdown_id,
        fleetNo: data.fleet_no || 'Unknown',
        issueCategory: data.issue_category || 'General',
        location: data.location || 'Location to be added later',
        severity: data.severity || 'NORMAL',
        depot: data.depot || 'Unknown',
        source: 'direct_report'
      });
      console.log('✅ Activity logged successfully for breakdown:', data.breakdown_id);
    } catch (activityError) {
      console.error('⚠️ Failed to log activity for breakdown:', data.breakdown_id, activityError);
      // Don't fail the main request if activity logging fails
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    // Broadcast new breakdown to WebSocket clients (SDC dashboard and Control Room)
    try {
      const broadcastData = {
        type: 'new_breakdown',
        event: 'breakdown_reported',
        breakdown_id: data.breakdown_id,
        fleet_number: data.fleet_no || 'TBC',
        location: data.location || 'Location to be added',
        supervisor_name: data.supervisor_name || 'Supervisor',
        issue_category: data.issue_category || 'General',
        severity: data.severity || 'NORMAL',
        depot: data.depot || 'Unknown',
        timestamp: new Date().toISOString()
      };
      webSocketHandler.broadcast('sdc-dashboard', broadcastData);
      webSocketHandler.broadcast('control-room', broadcastData);
      console.log(`📡 Broadcasted breakdown ${data.breakdown_id} creation to WebSocket clients`);
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast breakdown creation:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    // Check for critical patterns and broadcast to defect intelligence
    try {
      await detectAndBroadcastCriticalPatterns(
        data,
        data.issue_category,
        data.fleet_no,
        data.depot
      );
    } catch (patternError) {
      console.error('⚠️ Failed to detect critical patterns:', patternError);
      // Don't fail the main request if pattern detection fails
    }

    // Phase 7.1: Auto-assign breakdown to on-duty supervisor
    let assignmentResult = null;
    try {
      assignmentResult = await breakdownAssignmentService.autoAssignBreakdown({
        breakdownId: data.breakdown_id,
        fleetNo: data.fleet_no,
        depot: data.depot,
        severity: data.severity,
        issueCategory: data.issue_category,
        location: data.location_description
      });

      if (assignmentResult.assigned) {
        console.log(`✅ Auto-assigned to ${assignmentResult.supervisor.name}`);
        // Broadcast assignment to WebSocket clients
        webSocketHandler.broadcast('sdc-dashboard', {
          type: 'breakdown_assigned',
          breakdown_id: data.breakdown_id,
          assigned_to: assignmentResult.supervisor.name,
          assigned_badge: assignmentResult.supervisor.badge_number,
          timestamp: new Date().toISOString()
        });
      }
    } catch (assignError) {
      console.error('⚠️ Auto-assignment failed:', assignError);
      // Don't fail the main request if assignment fails
    }

    // Calculate mileage lost if route_id is available
    let mileageResult = null;
    if (data.route_id) {
      try {
        mileageResult = await calculateMileageLost({
          routeId: data.route_id,
          lat: data.location_lat,
          lng: data.location_lng,
          estimatedDowntimeMinutes: 60, // Default 1 hour estimate
        });

        if (mileageResult.success) {
          // Update breakdown with mileage data
          await update('breakdowns', {
            estimated_mileage_lost: mileageResult.mileageLost.totalMiles,
            mileage_calculation_data: JSON.stringify(mileageResult)
          }, { id: data.id });
          console.log(`📏 Mileage calculated for ${data.breakdown_id}: ${mileageResult.mileageLost.totalMiles} miles`);
        }
      } catch (mileageError) {
        console.error('⚠️ Mileage calculation failed:', mileageError);
        // Don't fail the main request if mileage calculation fails
      }
    }

    res.status(201).json({
      ...transformedData,
      breakdown_id: idResult.id,
      assignment: assignmentResult,
      estimated_mileage_lost: mileageResult?.mileageLost?.totalMiles || null
    });
  } catch (error) {
    console.error('Error creating breakdown:', error);
    res.status(500).json({
      error: 'Failed to create breakdown',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/breakdowns/:id - Update breakdown
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: toMySQLDatetime()
    };

    // Support lookup by numeric id OR breakdown_id (BD-YYYY-NNNNN)
    const isBreakdownId = req.params.id.startsWith('BD-');
    const lookupField = isBreakdownId ? 'breakdown_id' : 'id';

    await update('breakdowns', { [lookupField]: req.params.id }, updateData);

    // Fetch the updated breakdown
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq(lookupField, req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    // If a next_trip_action was set and lost_trip_details provided, persist to breakdown_lost_trips
    if (req.body.next_trip_action && req.body.lost_trip_details) {
      try {
        const ltd = req.body.lost_trip_details;
        await insert('breakdown_lost_trips', {
          breakdown_id: data.breakdown_id,
          fleet_no: data.fleet_no || null,
          trip_id: ltd.trip_id || null,
          route_id: ltd.route_id || null,
          direction_id: ltd.direction_id ?? null,
          departure_time: ltd.departure_time || null,
          arrival_time: ltd.arrival_time || null,
          origin_stop: ltd.origin_stop || null,
          dest_stop: ltd.dest_stop || null,
          headsign: ltd.headsign || null,
          action: req.body.next_trip_action,
          supervisor_badge: data.supervisor_badge || null,
          depot: data.depot || null,
          created_at: toMySQLDatetime()
        });
        console.log(`📋 Lost trip recorded for ${data.breakdown_id}: action=${req.body.next_trip_action}`);
      } catch (lostTripError) {
        console.error('⚠️ Failed to record lost trip:', lostTripError.message);
        // Non-fatal - don't fail the main request
      }
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    res.json(transformedData);
  } catch (error) {
    console.error('Error updating breakdown:', error);
    res.status(500).json({ error: 'Failed to update breakdown' });
  }
});

// PATCH /api/breakdowns/:id/status - Update breakdown status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, supervisor_badge, supervisor_name } = req.body;

    // First, get the current breakdown to capture old status
    const { data: currentBreakdown, error: fetchError } = await from('breakdowns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !currentBreakdown) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    const oldStatus = currentBreakdown.status;

    await update('breakdowns', { id: req.params.id }, {
      status,
      updated_at: toMySQLDatetime()
    });

    // Fetch the updated breakdown
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Log activity for status change
    try {
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.BREAKDOWN_STATUS_CHANGED,
        action: `changed status from ${oldStatus} to ${status}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: supervisor_badge || req.supervisor?.badge_number || 'system',
        actorName: supervisor_name || req.supervisor?.name || 'System',
        entityType: ENTITY_TYPES.BREAKDOWN,
        entityId: data.breakdown_id,
        entityDetails: {
          fleetNo: data.fleet_no,
          oldStatus: oldStatus,
          newStatus: status,
          issueCategory: data.issue_category
        },
        depot: data.depot,
        severity: status === 'resolved' || status === 'cleared' ? SEVERITY_LEVELS.SUCCESS :
                 status === 'active' ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.INFO,
        source: 'breakdown_dashboard',
        icon: status === 'resolved' ? '✅' : status === 'cleared' ? '🧹' : '🔄'
      });
      console.log(`📝 Activity logged: Status changed from ${oldStatus} to ${status} for ${data.breakdown_id}`);
    } catch (activityError) {
      console.error('⚠️ Failed to log status change activity:', activityError);
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    // Broadcast status change to WebSocket clients
    try {
      webSocketHandler.broadcast('sdc-dashboard', {
        type: 'breakdown_status_changed',
        breakdown_id: data.breakdown_id,
        old_status: oldStatus,
        new_status: status,
        timestamp: new Date().toISOString()
      });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast status change:', broadcastError);
    }

    res.json(transformedData);
  } catch (error) {
    console.error('Error updating breakdown status:', error);
    res.status(500).json({ error: 'Failed to update breakdown status' });
  }
});


// GET /api/breakdowns/stats/summary - Get breakdown statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const { data, error } = await from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString())
      .execute();

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      pending: data.filter(b => b.status === 'pending').length,
      resolved: data.filter(b => b.status === 'resolved').length,
      in_progress: data.filter(b => b.status === 'in_progress').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching breakdown stats:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown statistics' });
  }
});

// GET /api/breakdowns/id-generator/status - Get ID generator status
router.get('/id-generator/status', async (req, res) => {
  try {
    const status = breakdownIdGenerator.getStatus();
    const statistics = await breakdownIdGenerator.getStatistics();

    res.json({
      generator: status,
      statistics: statistics,
      health: 'operational'
    });
  } catch (error) {
    console.error('Error getting ID generator status:', error);
    res.status(500).json({ error: 'Failed to get generator status' });
  }
});

// GET /api/breakdowns/id-generator/next - Preview next ID without creating
router.get('/id-generator/next', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const countSQL = `SELECT COUNT(*) as count FROM breakdowns
      WHERE created_at >= ? AND created_at < ?`;
    const countResult = await query(countSQL, [
      `${year}-01-01T00:00:00.000Z`,
      `${year + 1}-01-01T00:00:00.000Z`
    ]);

    const count = countResult[0]?.count || 0;
    const nextNumber = count + 1;
    const nextId = `BD-${year}-${nextNumber.toString().padStart(5, '0')}`;

    res.json({
      next_id: nextId,
      current_count: count,
      next_sequence: nextNumber,
      year: year,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error previewing next ID:', error);
    res.status(500).json({ error: 'Failed to preview next ID' });
  }
});

// POST /api/breakdowns/id-generator/validate - Validate a breakdown ID
router.post('/id-generator/validate', async (req, res) => {
  try {
    const { breakdown_id } = req.body;

    if (!breakdown_id) {
      return res.status(400).json({ error: 'breakdown_id is required' });
    }

    const validation = breakdownIdGenerator.validateId(breakdown_id);

    // Check if ID already exists in database
    let exists = false;
    if (validation.valid) {
      const { data } = await from('breakdowns')
        .select('breakdown_id')
        .eq('breakdown_id', breakdown_id)
        .single();

      exists = !!data;
    }

    res.json({
      ...validation,
      exists_in_database: exists,
      breakdown_id: breakdown_id
    });
  } catch (error) {
    console.error('Error validating breakdown ID:', error);
    res.status(500).json({ error: 'Failed to validate breakdown ID' });
  }
});

// PUT /api/breakdowns/:id/resolve - Resolve a breakdown
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes, resolving_supervisor, returned_to_service, supervisor_badge } = req.body;

    // Update the breakdown using breakdown_id
    await update('breakdowns', { breakdown_id: id }, {
      status: 'cleared',
      cleared_at: toMySQLDatetime(),
      resolution_notes,
      updated_at: toMySQLDatetime()
    });

    // Fetch the updated breakdown
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create an event log
    try {
      await insert('breakdown_events', {
        breakdown_id: data.id,
        event_type: 'resolved',
        event_data: JSON.stringify({
          resolution_notes,
          resolving_supervisor,
          returned_to_service,
          resolved_at: new Date().toISOString()
        }),
        created_at: toMySQLDatetime()
      });
    } catch (eventError) {
      console.error('Error creating event:', eventError);
    }

    // Log activity to the unified activity feed
    try {
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.BREAKDOWN_RESOLVED,
        action: `resolved breakdown on ${data.fleet_no}${returned_to_service ? ' - returned to service' : ''}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: supervisor_badge || req.supervisor?.badge_number || 'system',
        actorName: resolving_supervisor || req.supervisor?.name || 'Supervisor',
        entityType: ENTITY_TYPES.BREAKDOWN,
        entityId: data.breakdown_id,
        entityDetails: {
          fleetNo: data.fleet_no,
          issueCategory: data.issue_category,
          location: data.location_description,
          resolutionNotes: resolution_notes,
          returnedToService: returned_to_service
        },
        depot: data.depot,
        severity: SEVERITY_LEVELS.SUCCESS,
        source: 'breakdown_dashboard',
        icon: '✅'
      });
      console.log(`📝 Activity logged: Breakdown ${data.breakdown_id} resolved`);
    } catch (activityError) {
      console.error('⚠️ Failed to log resolve activity:', activityError);
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    // Broadcast resolution to WebSocket clients
    try {
      webSocketHandler.broadcast('sdc-dashboard', {
        type: 'breakdown_resolved',
        breakdown_id: data.breakdown_id,
        fleet_no: data.fleet_no,
        resolved_by: resolving_supervisor,
        returned_to_service: returned_to_service,
        timestamp: new Date().toISOString()
      });
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast resolution:', broadcastError);
    }

    res.json({
      success: true,
      breakdown: transformedData,
      message: 'Breakdown resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve breakdown'
    });
  }
});

// POST /api/breakdowns/:id/dispatch - Dispatch engineer to breakdown
router.post('/:id/dispatch', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      engineer_id,
      engineer_name,
      estimated_arrival_minutes,
      dispatch_notes,
      dispatching_supervisor
    } = req.body;

    // Update breakdown status to dispatched
    await update('breakdowns', { breakdown_id: id }, {
      status: 'dispatched',
      dispatched_at: toMySQLDatetime(),
      updated_at: toMySQLDatetime()
    });

    // Fetch the updated breakdown
    const { data: breakdown, error: updateError } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', id)
      .single();

    if (updateError) throw updateError;

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create event log for dispatch
    try {
      await insert('breakdown_events', {
        breakdown_id: breakdown.id,
        event_type: 'engineer_dispatched',
        event_data: JSON.stringify({
          engineer_id,
          engineer_name,
          estimated_arrival_minutes,
          dispatch_notes,
          dispatching_supervisor,
          dispatched_at: toMySQLDatetime()
        }),
        created_at: toMySQLDatetime()
      });
    } catch (eventError) {
      console.error('Error creating dispatch event:', eventError);
    }

    // Calculate ETA
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + (estimated_arrival_minutes || 30));

    // Transform breakdown for frontend compatibility
    const transformedBreakdown = transformBreakdownForFrontend(breakdown);

    res.json({
      success: true,
      breakdown: {
        ...transformedBreakdown,
        engineer_assigned: {
          id: engineer_id,
          name: engineer_name,
          eta: eta.toISOString(),
          estimated_minutes: estimated_arrival_minutes || 30
        }
      },
      message: 'Engineer dispatched successfully'
    });
  } catch (error) {
    console.error('Error dispatching engineer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch engineer'
    });
  }
});

// GET /api/breakdowns/:id/activities - Get activity log for specific breakdown
router.get('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // First get the breakdown to verify it exists
    const { data: breakdown, error: breakdownError } = await from('breakdowns')
      .select('id, breakdown_id')
      .eq('breakdown_id', id)
      .single();

    if (breakdownError || !breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Get all events for this breakdown
    const { data: events, error: eventsError } = await from('breakdown_events')
      .select('*')
      .eq('breakdown_id', breakdown.id)
      .order('created_at', 'DESC')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .execute();

    if (eventsError) throw eventsError;

    // Format activities
    const activities = events.map(event => ({
      id: event.id,
      type: event.event_type,
      timestamp: event.created_at,
      description: formatEventDescription(event),
      data: typeof event.event_data === 'string' ? JSON.parse(event.event_data) : event.event_data,
      user: event.event_data?.supervisor_name || event.event_data?.dispatching_supervisor || 'System'
    }));

    res.json({
      success: true,
      breakdown_id: id,
      activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching breakdown activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown activities'
    });
  }
});

// POST /api/breakdowns/:id/activities - Add activity entry to breakdown
router.post('/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      activity_type,
      description,
      user_name,
      supervisor_badge,
      metadata
    } = req.body;

    // Verify breakdown exists and get full data for activity logging
    const { data: breakdown, error: breakdownError } = await from('breakdowns')
      .select('id, breakdown_id, fleet_no, depot, issue_category')
      .eq('breakdown_id', id)
      .single();

    if (breakdownError || !breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create activity event
    const eventData = {
      description,
      user_name,
      metadata,
      created_at: toMySQLDatetime()
    };

    const insertResult = await insert('breakdown_events', {
      breakdown_id: breakdown.id,
      event_type: activity_type || 'comment',
      event_data: JSON.stringify(eventData),
      created_at: toMySQLDatetime()
    });

    // Fetch the created event
    const { data: event, error: eventError } = await from('breakdown_events')
      .select('*')
      .eq('id', insertResult.insertId)
      .single();

    if (eventError) throw eventError;

    // Log to unified activity feed
    try {
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.BREAKDOWN_NOTE_ADDED,
        action: `added note to breakdown on ${breakdown.fleet_no}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: supervisor_badge || req.supervisor?.badge_number || 'system',
        actorName: user_name || req.supervisor?.name || 'Supervisor',
        entityType: ENTITY_TYPES.BREAKDOWN,
        entityId: breakdown.breakdown_id,
        entityDetails: {
          fleetNo: breakdown.fleet_no,
          issueCategory: breakdown.issue_category,
          noteType: activity_type || 'comment',
          notePreview: description?.substring(0, 100) // First 100 chars of note
        },
        depot: breakdown.depot,
        severity: SEVERITY_LEVELS.INFO,
        source: 'breakdown_dashboard',
        icon: '📝'
      });
      console.log(`📝 Activity logged: Note added to breakdown ${breakdown.breakdown_id}`);
    } catch (activityError) {
      console.error('⚠️ Failed to log note activity:', activityError);
    }

    res.status(201).json({
      success: true,
      activity: {
        id: event.id,
        type: event.event_type,
        timestamp: event.created_at,
        description,
        user: user_name,
        data: eventData
      },
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add activity'
    });
  }
});

// Helper function to format event descriptions
function formatEventDescription(event) {
  const data = typeof event.event_data === 'string'
    ? JSON.parse(event.event_data)
    : (event.event_data || {});

  switch (event.event_type) {
    case 'wizard_assessment_completed':
      return `${data.wizard_type || 'Breakdown'} assessment completed - Decision: ${data.wizard_decision || 'N/A'}`;

    case 'engineer_assigned':
      return `Engineer ${data.engineer_name || 'assigned'} - ETA: ${data.estimated_arrival_minutes || 'N/A'} minutes`;

    case 'engineer_dispatched':
      return `Engineer ${data.engineer_name || 'dispatched'} to site`;

    case 'engineer_on_site':
      return `Engineer arrived on site`;

    case 'resolved':
      return `Breakdown resolved - ${data.resolution_notes || 'No notes'}`;

    case 'status_change':
      return `Status changed from ${data.old_status || 'N/A'} to ${data.new_status || 'N/A'}`;

    case 'comment':
      return data.description || 'Comment added';

    default:
      return data.description || event.event_type.replace(/_/g, ' ');
  }
}

// =====================================================
// WIZARD INTEGRATION ENDPOINTS
// =====================================================

// POST /api/breakdowns/from-wizard - Create breakdown from wizard assessment
router.post('/from-wizard', async (req, res) => {
  try {
    const {
      // Wizard information
      wizard_type,
      wizard_decision,
      wizard_assessment_data,

      // Vehicle and location
      fleet_number,
      depot,
      vehicle_type,
      registration,
      location,
      location_coords,
      w3w_location,

      // Route/Service information
      route,
      route_name,
      service,

      // Supervisor information
      supervisor_badge,
      supervisor_name,

      // Issue details
      issue_category,
      issue_description, // Frontend sends this but we'll map to description
      severity,

      // Additional context
      priority_level = 3,
      engineering_required = false,
      replacement_vehicle_required = false,
      secured_mileage = false,
      not_in_service = false,

      // GTFS trip linking (Phase 2)
      trip_id,
      block_id
    } = req.body;

    // Check for duplicate submissions (same vehicle + supervisor within last 10 seconds)
    const tenSecondsAgo = new Date();
    tenSecondsAgo.setSeconds(tenSecondsAgo.getSeconds() - 10);

    const { data: recentBreakdowns, error: duplicateCheckError } = await from('breakdowns')
      .select('breakdown_id, created_at')
      .eq('fleet_no', fleet_number)
      .eq('supervisor_badge', supervisor_badge)
      .eq('wizard_type', wizard_type)
      .gte('created_at', tenSecondsAgo.toISOString())
      .order('created_at', 'DESC')
      .limit(1)
      .execute();

    if (!duplicateCheckError && recentBreakdowns && recentBreakdowns.length > 0) {
      const existingBreakdown = recentBreakdowns[0];
      console.log(`⚠️ Duplicate submission detected! Returning existing breakdown: ${existingBreakdown.breakdown_id}`);

      // Return the existing breakdown instead of creating a duplicate
      return res.json({
        success: true,
        breakdown: existingBreakdown,
        breakdown_id: existingBreakdown.breakdown_id,
        message: 'Breakdown already exists (duplicate prevented)',
        isDuplicate: true
      });
    }

    // Generate unique breakdown ID
    const idResult = await breakdownIdGenerator.generateId();

    // Determine severity if not provided
    const determinedSeverity = severity || wizard_decision || 'AMBER';

    // Determine priority based on severity, wizard decision, and secured mileage
    // Secured mileage is ALWAYS priority 1 (contractual obligation)
    const determinedPriority = priority_level || (
      secured_mileage ? 1 :  // Secured mileage must be priority 1 to avoid fines
      determinedSeverity === 'STOP' ? 1 :
      determinedSeverity === 'AMBER' ? 2 : 3
    );

    // Auto-allocate depot based on fleet number lookup from fleet database
    let allocatedDepot = depot;
    if (!allocatedDepot || allocatedDepot === 'Unknown') {
      try {
        const results = await query(
          'SELECT depot FROM fleet_vehicles WHERE fleet_no = ?',  // FIXED: Use fleet_no not fleet_number
          [fleet_number]
        );
        const fleetVehicle = results[0];
        if (fleetVehicle && fleetVehicle.depot) {
          allocatedDepot = fleetVehicle.depot;
          console.log(`✅ Depot auto-allocated: Fleet ${fleet_number} → ${allocatedDepot}`);
        } else {
          allocatedDepot = 'Unknown';
          console.warn(`⚠️ Fleet ${fleet_number} not found in database - depot set to Unknown`);
        }
      } catch (error) {
        console.error(`❌ Auto-allocation failed for fleet ${fleet_number}:`, error.message);
        allocatedDepot = depot || 'Unknown';
      }
    }

    // Create the breakdown record with only fields that exist in the database
    const breakdownData = {
      breakdown_id: idResult.id,
      fleet_no: fleet_number,
      depot: allocatedDepot,
      supervisor_badge: supervisor_badge,
      supervisor_name: supervisor_name,
      location_description: location,
      issue_category: issue_category,
      status: 'active',
      severity: determinedSeverity,
      wizard_decision: wizard_decision,
      wizard_type: wizard_type,
      secured_mileage: secured_mileage || false,  // Store in database column for Control Room Display
      wizard_assessment_data: JSON.stringify({
        ...wizard_assessment_data,
        // Store additional fields in JSONB since columns don't exist yet
        vehicle_type,
        registration,
        route,
        route_name,
        description: issue_description,
        priority_level: determinedPriority,
        engineering_required,
        replacement_vehicle_required,
        location_coords,
        not_in_service: not_in_service || false  // Store if vehicle was not in service (light running/dead run)
      }),
      breakdown_source: 'wizard',
      created_at: toMySQLDatetime()
    };

    // Add GTFS trip linking if provided
    if (trip_id) breakdownData.trip_id = trip_id;
    if (block_id) breakdownData.block_id = block_id;

    // Add coordinates if provided
    if (location_coords && location_coords.lat && location_coords.lng) {
      breakdownData.location_lat = location_coords.lat;
      breakdownData.location_lng = location_coords.lng;
    }

    console.log('🔍 Attempting to insert breakdown data:', JSON.stringify(breakdownData, null, 2));

    const insertResult = await insert('breakdowns', breakdownData);

    // Fetch the created breakdown
    const { data, error } = await from('breakdowns')
      .select('*')
      .eq('id', insertResult.insertId)
      .single();

    if (error) {
      console.error('❌ Database fetch error:', error);
      throw error;
    }

    // Create initial event log
    await insert('breakdown_events', {
      breakdown_id: data.id,
      event_type: 'wizard_assessment_completed',
      event_data: JSON.stringify({
        wizard_type,
        wizard_decision,
        assessment_data: wizard_assessment_data,
        supervisor_badge,
        supervisor_name
      }),
      created_at: toMySQLDatetime()
    });

    // Log activity to the unified activity feed with location
    // Use wizard completion activity for wizard assessments
    try {
      await activityLogger.logWizardCompleted({
        supervisorId: supervisor_badge,
        supervisorName: supervisor_name,
        breakdownId: data.breakdown_id,
        fleetNo: fleet_number,
        wizardType: wizard_type || 'Breakdown Guide',
        decision: wizard_decision || determinedSeverity,
        depot: 'SDC', // Could be enhanced to get actual depot from supervisor data
        location: location || 'Location to be added later',
        locationCoords: location_coords,
        latitude: location_coords?.lat || (typeof location_coords === 'string' ? parseFloat(location_coords.split(',')[0]) : null),
        longitude: location_coords?.lng || (typeof location_coords === 'string' ? parseFloat(location_coords.split(',')[1]) : null),
        assessmentData: {
          issueCategory: issue_category,
          location: location || 'Location to be added later',
          locationCoords: location_coords,
          severity: determinedSeverity,
          engineeringRequired: engineering_required,
          replacementVehicleRequired: replacement_vehicle_required,
          securedMileage: secured_mileage
        }
      });
      console.log('✅ Wizard activity logged successfully for breakdown:', data.breakdown_id);
    } catch (activityError) {
      console.error('⚠️ Failed to log wizard activity for breakdown:', data.breakdown_id, activityError);
      // Don't fail the main request if activity logging fails
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

    // Broadcast breakdown creation to all connected WebSocket clients
    try {
      const broadcastData = {
        type: 'breakdown_created',
        breakdown_id: transformedData.breakdown_id,
        breakdown: transformedData,
        wizard_type: wizard_type,
        wizard_decision: wizard_decision,
        severity: determinedSeverity,
        fleet_number: fleet_number,
        location: location,
        supervisor_name: supervisor_name,
        timestamp: new Date().toISOString()
      };
      webSocketHandler.broadcast('sdc-dashboard', broadcastData);
      webSocketHandler.broadcast('control-room', broadcastData); // Also broadcast to Control Room Display
      console.log(`📡 Broadcasted breakdown ${transformedData.breakdown_id} creation to WebSocket clients`);
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast breakdown creation:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    // Check for critical patterns and broadcast to defect intelligence
    try {
      await detectAndBroadcastCriticalPatterns(data, issue_category, fleet_number, depot);
    } catch (patternError) {
      console.error('⚠️ Failed to detect critical patterns:', patternError);
      // Don't fail the main request if pattern detection fails
    }

    // Phase 7.1: Auto-assign breakdown to on-duty supervisor
    let assignmentResult = null;
    try {
      assignmentResult = await breakdownAssignmentService.autoAssignBreakdown({
        breakdownId: transformedData.breakdown_id,
        fleetNo: fleet_number,
        depot: allocatedDepot,
        severity: determinedSeverity,
        issueCategory: issue_category,
        location: location
      });

      if (assignmentResult.assigned) {
        console.log(`✅ Auto-assigned to ${assignmentResult.supervisor.name}`);
        // Broadcast assignment to WebSocket clients
        webSocketHandler.broadcast('sdc-dashboard', {
          type: 'breakdown_assigned',
          breakdown_id: transformedData.breakdown_id,
          assigned_to: assignmentResult.supervisor.name,
          assigned_badge: assignmentResult.supervisor.badge_number,
          timestamp: new Date().toISOString()
        });
      }
    } catch (assignError) {
      console.error('⚠️ Auto-assignment failed:', assignError);
      // Don't fail the main request if assignment fails
    }

    res.status(201).json({
      success: true,
      breakdown_id: transformedData.breakdown_id,
      breakdown: transformedData,
      message: 'Breakdown created from wizard assessment',
      assignment: assignmentResult
    });

  } catch (error) {
    console.error('Error creating breakdown from wizard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create breakdown from wizard assessment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/breakdowns/dashboard/cards - Get breakdown cards for dashboards
router.get('/dashboard/cards', async (req, res) => {
  try {
    const { dashboard = 'sdc' } = req.query;

    let visibilityField;
    switch (dashboard) {
      case 'sdc':
        visibilityField = 'visible_on_sdc';
        break;
      case 'engineering':
        visibilityField = 'visible_on_engineering';
        break;
      case 'management':
        visibilityField = 'visible_on_management';
        break;
      default:
        visibilityField = 'visible_on_sdc';
    }

    // Get breakdown dashboard cards with JOIN to breakdowns table
    const cardsSQL = `
      SELECT
        c.*,
        b.breakdown_id as b_breakdown_id,
        b.status as b_status,
        b.severity as b_severity,
        b.created_at as b_created_at,
        b.updated_at as b_updated_at,
        b.wizard_type as b_wizard_type,
        b.wizard_decision as b_wizard_decision
      FROM breakdown_dashboard_cards c
      LEFT JOIN breakdowns b ON c.breakdown_id = b.breakdown_id
      WHERE c.${visibilityField} = 1
      ORDER BY c.priority_level ASC, c.created_at DESC
    `;

    const cards = await query(cardsSQL);

    // Format cards for dashboard consumption
    const formattedCards = cards.map(card => ({
      id: card.id,
      breakdown_id: card.breakdown_id,

      // Card display
      title: card.card_title,
      subtitle: card.card_subtitle,
      status_color: card.status_color,
      priority_level: card.priority_level,

      // Key information
      fleet_number: card.fleet_number,
      location: card.location_display,
      issue_summary: card.issue_summary,
      duration_text: card.duration_text,
      severity_display: card.severity_display,

      // Action indicators
      requires_immediate_action: card.requires_immediate_action,
      engineering_dispatched: card.engineering_dispatched,
      replacement_vehicle_sent: card.replacement_vehicle_sent,
      service_resumed: card.service_resumed,

      // Breakdown data
      breakdown_status: card.b_status,
      wizard_type: card.b_wizard_type,
      wizard_decision: card.b_wizard_decision,

      // Metadata
      last_refreshed: card.last_refreshed_at,
      created_at: card.created_at
    }));

    res.json({
      success: true,
      cards: formattedCards,
      dashboard: dashboard,
      count: formattedCards.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard cards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard cards',
      cards: []
    });
  }
});

// POST /api/breakdowns/:breakdown_id/update-card - Update breakdown card
router.post('/:breakdown_id/update-card', async (req, res) => {
  try {
    const { breakdown_id } = req.params;
    const cardUpdates = {
      ...req.body,
      last_refreshed_at: toMySQLDatetime(),
      updated_at: toMySQLDatetime()
    };

    await update('breakdown_dashboard_cards', { breakdown_id }, cardUpdates);

    // Fetch the updated card
    const { data, error } = await from('breakdown_dashboard_cards')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown card not found'
      });
    }

    res.json({
      success: true,
      card: data,
      message: 'Breakdown card updated successfully'
    });

  } catch (error) {
    console.error('Error updating breakdown card:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update breakdown card'
    });
  }
});

// PATCH /api/breakdowns/:breakdown_id/decision - Quick decision update (STOP/AMBER/CONTINUE)
// Used by SDC Dashboard QuickDecisionButtons for fast triage
router.patch('/:breakdown_id/decision', async (req, res) => {
  try {
    const { breakdown_id } = req.params;
    const { decision, quick_decision = false } = req.body;

    // Validate decision type
    const validDecisions = ['STOP', 'AMBER', 'CONTINUE'];
    if (!decision || !validDecisions.includes(decision.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}`
      });
    }

    const normalizedDecision = decision.toUpperCase();
    const now = toMySQLDatetime();

    // Update the breakdown with the new decision
    // Note: Only updating columns that definitely exist in the schema
    const updateData = {
      wizard_decision: normalizedDecision,
      severity: normalizedDecision,
      updated_at: now
    };

    await update('breakdowns', { breakdown_id }, updateData);

    // Fetch the updated breakdown
    const { data: updatedBreakdown, error: fetchError } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError) throw fetchError;

    if (!updatedBreakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Log the activity
    await activityLogger.log({
      type: ACTIVITY_TYPES.BREAKDOWN_UPDATED,
      action: quick_decision ? 'quick_decision_made' : 'decision_updated',
      description: `Decision changed to ${normalizedDecision}${quick_decision ? ' (quick decision)' : ''}`,
      entity_type: ENTITY_TYPES.BREAKDOWN,
      entity_id: breakdown_id,
      breakdown_id: breakdown_id,
      fleet_no: updatedBreakdown.fleet_no,
      severity: normalizedDecision === 'STOP' ? SEVERITY_LEVELS.CRITICAL :
                normalizedDecision === 'AMBER' ? SEVERITY_LEVELS.WARNING :
                SEVERITY_LEVELS.SUCCESS,
      metadata: {
        decision: normalizedDecision,
        quick_decision,
        previous_decision: updatedBreakdown.wizard_decision
      }
    });

    // Broadcast WebSocket update
    webSocketHandler.broadcast({
      type: 'breakdown_updated',
      breakdown_id,
      decision: normalizedDecision,
      fleet_no: updatedBreakdown.fleet_no,
      timestamp: now
    });

    res.json({
      success: true,
      breakdown: transformBreakdownForFrontend(updatedBreakdown),
      message: `Decision updated to ${normalizedDecision}`
    });

  } catch (error) {
    console.error('Error updating breakdown decision:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update breakdown decision'
    });
  }
});

// POST /api/breakdowns/smart-route-match - Find routes passing through breakdown location
// Returns all bus routes serving stops within 1km of the breakdown location
router.post('/smart-route-match', async (req, res) => {
  try {
    const { latitude, longitude, radius_km = 1 } = req.body;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
        code: 'MISSING_COORDINATES'
      });
    }

    // Validate that they are numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude must be valid numbers',
        code: 'INVALID_COORDINATES'
      });
    }

    // Validate ranges
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Latitude must be between -90 and 90',
        code: 'INVALID_LATITUDE'
      });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Longitude must be between -180 and 180',
        code: 'INVALID_LONGITUDE'
      });
    }

    // Approximately 1 degree of latitude = 111 km
    // So for 1km radius: 1/111 ≈ 0.009 degrees
    // For X km radius: X/111 degrees
    const radiusDegrees = radius_km / 111;

    // Query: Find all routes serving stops within the radius
    // Using geospatial distance calculation:
    // SQRT((lat - stop_lat)^2 + (lng - stop_lon)^2) < radiusDegrees
    // Note: Using MIN() for distance to comply with only_full_group_by sql_mode
    const sql = `
      SELECT
        gr.route_id,
        gr.route_short_name,
        gr.route_long_name,
        COUNT(DISTINCT gst.trip_id) as trips_per_period,
        COUNT(DISTINCT gs.stop_id) as serving_stops,
        GROUP_CONCAT(DISTINCT gs.stop_name SEPARATOR ', ') as serving_stop_names,
        MIN(gs.stop_lat) as nearest_lat,
        MIN(gs.stop_lon) as nearest_lon,
        MIN(SQRT(
          POW((gs.stop_lat - ?), 2) +
          POW((gs.stop_lon - ?), 2)
        )) as distance_degrees
      FROM gtfs_stops gs
      JOIN gtfs_stop_times gst ON gs.stop_id = gst.stop_id
      JOIN gtfs_trips gt ON gst.trip_id = gt.trip_id
      JOIN gtfs_routes gr ON gt.route_id = gr.route_id
      WHERE SQRT(
        POW((gs.stop_lat - ?), 2) +
        POW((gs.stop_lon - ?), 2)
      ) < ?
      GROUP BY gr.route_id, gr.route_short_name, gr.route_long_name
      ORDER BY trips_per_period DESC, distance_degrees ASC
    `;

    const results = await query(sql, [lat, lng, lat, lng, radiusDegrees]);

    // Transform results for frontend
    const affectedRoutes = results.map(route => ({
      route_id: route.route_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      trips_per_period: parseInt(route.trips_per_period) || 0,
      serving_stops: parseInt(route.serving_stops) || 0,
      serving_stop_names: route.serving_stop_names,
      distance_km: Math.round((route.distance_degrees * 111) * 10) / 10, // Convert back to km with 1 decimal
      nearest_coordinates: {
        lat: parseFloat(route.nearest_lat),
        lng: parseFloat(route.nearest_lon)
      }
    }));

    res.json({
      success: true,
      breakdown_location: {
        latitude: lat,
        longitude: lng,
        radius_km: radius_km
      },
      affected_routes: affectedRoutes,
      total_routes: affectedRoutes.length,
      message: affectedRoutes.length > 0
        ? `Found ${affectedRoutes.length} routes serving stops near this location`
        : 'No routes found serving stops near this location'
    });

  } catch (error) {
    console.error('Error finding smart routes:', error);

    // Check if GTFS tables don't exist (common in production without GTFS data)
    // Handle multiple possible error formats from MySQL
    const errorMsg = error.message || '';
    const errorCode = error.code || '';
    const isTableMissing =
      errorMsg.includes("doesn't exist") ||
      errorMsg.includes('doesn\'t exist') ||
      errorMsg.includes('Table') ||
      errorMsg.includes('gtfs_') ||
      errorCode === 'ER_NO_SUCH_TABLE' ||
      errorCode === 'ER_BAD_TABLE_ERROR';

    if (isTableMissing) {
      console.log('GTFS tables not available - returning empty result');
      return res.json({
        success: true,
        breakdown_location: { latitude: req.body.latitude, longitude: req.body.longitude },
        affected_routes: [],
        total_routes: 0,
        message: 'GTFS route data not available - manual route selection required'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to find routes for location',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/breakdowns/resolve - Mark breakdown as resolved/completed
router.post('/resolve', async (req, res) => {
  try {
    const {
      breakdown_id,
      resolved_by,
      supervisor_badge,
      resolution_notes,
      returned_to_service = true,
      resolution_type = 'fixed'
    } = req.body;

    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'Breakdown ID is required',
        code: 'MISSING_BREAKDOWN_ID'
      });
    }

    console.log(`✅ Resolving breakdown ${breakdown_id}`);

    // Verify breakdown exists
    const { data: currentBreakdown, error: fetchError } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !currentBreakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
        code: 'BREAKDOWN_NOT_FOUND',
        breakdown_id: breakdown_id
      });
    }

    // Check if already resolved
    if (currentBreakdown.status === 'resolved') {
      return res.status(400).json({
        success: false,
        error: 'Breakdown already resolved',
        code: 'ALREADY_RESOLVED',
        breakdown_id: breakdown_id,
        resolved_at: currentBreakdown.resolved_at
      });
    }

    const resolvedAt = toMySQLDatetime(new Date());
    const resolvingUser = resolved_by || req.supervisor?.name || supervisor_badge || 'System';

    // Update breakdown status to resolved
    await update('breakdowns',
      {
        status: 'resolved',
        resolved_at: resolvedAt,
        resolved_by: resolvingUser,
        resolution_notes: resolution_notes || '',
        resolution_type: resolution_type || 'fixed',
        returned_to_service: returned_to_service
      },
      { breakdown_id }
    );

    // Fetch updated breakdown
    const { data: breakdown, error: updateError } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (updateError) {
      console.error('Error fetching updated breakdown:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch updated breakdown',
        code: 'FETCH_ERROR'
      });
    }

    console.log(`✅ Breakdown ${breakdown_id} marked as resolved`);

    // Fix 3: Auto-recalculate mileage with actual downtime now that we have resolved_at
    if (breakdown.route_id || breakdown.wizard_assessment_data?.route) {
      try {
        const routeId = breakdown.route_id || breakdown.wizard_assessment_data?.route;
        const createdAt = new Date(breakdown.created_at);
        const actualResolvedAt = new Date(resolvedAt);
        const actualDowntimeMinutes = Math.ceil((actualResolvedAt - createdAt) / (1000 * 60));

        const mileageResult = await calculateMileageLost({
          routeId,
          lat: breakdown.location_lat,
          lng: breakdown.location_lng,
          estimatedDowntimeMinutes: actualDowntimeMinutes,
          breakdownStartTime: breakdown.created_at,
        });

        if (mileageResult.success) {
          await update('breakdowns', {
            estimated_mileage_lost: mileageResult.mileageLost.totalMiles,
            mileage_calculation_data: JSON.stringify(mileageResult)
          }, { breakdown_id });
          console.log(`📏 Mileage recalculated on resolution for ${breakdown_id}: ${mileageResult.mileageLost.totalMiles} miles (${actualDowntimeMinutes}min actual downtime)`);
        }
      } catch (mileageError) {
        console.error(`⚠️ Non-fatal: Mileage recalculation failed for ${breakdown_id}:`, mileageError.message);
      }
    }

    // Log activity
    await activityLogger.logActivity({
      activityType: 'breakdown_resolved',
      action: `resolved breakdown on ${breakdown.fleet_number || breakdown.fleet_no}`,
      actorType: 'supervisor',
      actorId: supervisor_badge || req.supervisor?.id || 'system',
      actorName: resolvingUser,
      entityType: 'breakdown',
      entityId: breakdown_id,
      entityDetails: {
        fleetNo: breakdown.fleet_number || breakdown.fleet_no,
        location: breakdown.location,
        issueCategory: breakdown.issue_category,
        resolutionType: resolution_type,
        returnedToService: returned_to_service
      },
      depot: breakdown.depot,
      severity: returned_to_service ? 'success' : 'info',
      source: 'sdc_operations',
      metadata: {
        resolutionNotes: resolution_notes,
        resolutionType: resolution_type,
        elapsedTime: Math.floor((new Date(resolvedAt) - new Date(breakdown.created_at)) / 1000 / 60)
      }
    });

    // Transform breakdown for frontend compatibility
    const transformedBreakdown = transformBreakdownForFrontend(breakdown);

    // Broadcast to WebSocket clients
    const resolveData = {
      type: 'breakdown_resolved',
      breakdown_id: breakdown_id,
      breakdown: transformedBreakdown,
      resolution_type: resolution_type,
      resolved_at: resolvedAt,
      resolved_by: resolvingUser,
      returned_to_service: returned_to_service,
      resolution_notes: resolution_notes,
      timestamp: resolvedAt
    };
    webSocketHandler.broadcast('sdc-dashboard', resolveData);
    webSocketHandler.broadcast('control-room', resolveData); // Also broadcast to Control Room Display

    res.json({
      success: true,
      message: 'Breakdown resolved successfully',
      breakdown_id: breakdown_id,
      resolution_type: resolution_type,
      resolved_at: resolvedAt,
      resolved_by: resolvingUser,
      returned_to_service: returned_to_service,
      breakdown: transformedBreakdown,
      timestamp: resolvedAt
    });

  } catch (error) {
    console.error('Error resolving breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve breakdown',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// PHASE 7.1: ASSIGNMENT MANAGEMENT ENDPOINTS
// ============================================

// POST /api/breakdowns/:breakdown_id/assign - Manually assign breakdown to supervisor
router.post('/:breakdown_id/assign', async (req, res) => {
  try {
    const { breakdown_id } = req.params;
    const { supervisor_id } = req.body;
    const assignedBy = req.supervisor?.badge_number || req.supervisor?.id || 'admin';

    if (!supervisor_id) {
      return res.status(400).json({
        success: false,
        error: 'supervisor_id is required'
      });
    }

    const result = await breakdownAssignmentService.manualAssignBreakdown(
      breakdown_id,
      supervisor_id,
      assignedBy
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Broadcast assignment
    webSocketHandler.broadcast('sdc-dashboard', {
      type: 'breakdown_assigned',
      breakdown_id: breakdown_id,
      assigned_to: result.supervisor.name,
      assigned_badge: result.supervisor.badge_number,
      assigned_by: assignedBy,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Breakdown assigned to ${result.supervisor.name}`,
      ...result
    });

  } catch (error) {
    console.error('Error manually assigning breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign breakdown',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/breakdowns/assignments/stats - Get assignment statistics
router.get('/assignments/stats', async (req, res) => {
  try {
    const stats = await breakdownAssignmentService.getAssignmentStats();

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error getting assignment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment statistics'
    });
  }
});

// GET /api/breakdowns/assignments/unassigned - Get unassigned breakdowns
router.get('/assignments/unassigned', async (req, res) => {
  try {
    const { data, error } = await from('breakdowns')
      .select('breakdown_id, fleet_no, depot, location_description, issue_category, severity, status, created_at')
      .isNull('assigned_supervisor_id')
      .notIn('status', ['resolved', 'cleared', 'completed'])
      .order('created_at', 'ASC')
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      count: data?.length || 0,
      unassigned: data || []
    });

  } catch (error) {
    console.error('Error getting unassigned breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unassigned breakdowns'
    });
  }
});

// GET /api/breakdowns/assignments/on-duty - Get supervisors currently on duty
router.get('/assignments/on-duty', async (req, res) => {
  try {
    const { depot } = req.query;
    const supervisors = await breakdownAssignmentService.getOnDutySupervisors(depot || null);

    res.json({
      success: true,
      count: supervisors.length,
      supervisors: supervisors
    });

  } catch (error) {
    console.error('Error getting on-duty supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get on-duty supervisors'
    });
  }
});

// ============================================
// REPLACEMENT VEHICLE ENDPOINTS (BSOG Mileage)
// ============================================

// POST /api/breakdowns/:id/replacement - Dispatch a replacement vehicle
router.post('/:id/replacement', validate(replacementSchemas.dispatch), async (req, res) => {
  try {
    const { id } = req.params;
    const { fleet_no, sending_depot_code } = req.body;

    // Fetch the breakdown
    const { data: breakdown, error: bErr } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', id)
      .single();

    if (bErr || !breakdown) {
      return res.status(404).json({ success: false, error: 'Breakdown not found' });
    }

    // Check if replacement already exists
    const existingRows = await query(
      'SELECT id FROM replacement_vehicles WHERE breakdown_id = ? AND status != ?',
      [id, 'cancelled']
    );
    if (existingRows && existingRows.length > 0) {
      return res.status(409).json({ success: false, error: 'Replacement already dispatched for this breakdown' });
    }

    // Hardcoded depot coordinates fallback (in case DB lookup fails)
    const DEPOT_COORDS = {
      WAS: { name: 'Washington', lat: 54.9005, lng: -1.5169 },
      NCL: { name: 'Riverside', lat: 54.9731, lng: -1.6178 },
      CON: { name: 'Consett', lat: 54.8519, lng: -1.8314 },
      HEX: { name: 'Hexham', lat: 54.9719, lng: -2.1011 },
      GTS: { name: 'Deptford', lat: 54.9501, lng: -1.5783 },
      PM:  { name: 'Percy Main', lat: 55.0072, lng: -1.4581 },
      DAR: { name: 'Darlington', lat: 54.5245, lng: -1.5515 }
    };

    // Look up depot coordinates from DB, fall back to hardcoded
    let depotName, depotLat, depotLng;
    try {
      const { data: depot } = await from('depots')
        .select('code, name, latitude, longitude')
        .eq('code', sending_depot_code)
        .single();

      if (depot && depot.latitude && depot.longitude) {
        depotName = depot.name;
        depotLat = parseFloat(depot.latitude);
        depotLng = parseFloat(depot.longitude);
      }
    } catch (dbErr) {
      console.error('Depot DB lookup failed (using fallback):', dbErr.message);
    }

    // Fallback to hardcoded coordinates
    if (!depotLat || !depotLng) {
      const fallback = DEPOT_COORDS[sending_depot_code];
      if (!fallback) {
        return res.status(400).json({ success: false, error: `Unknown depot code: ${sending_depot_code}` });
      }
      depotName = fallback.name;
      depotLat = fallback.lat;
      depotLng = fallback.lng;
      console.log(`Using fallback coordinates for depot ${sending_depot_code}`);
    }

    const breakdownLat = breakdown.location_lat || breakdown.wizard_assessment_data?.location_coords?.lat;
    const breakdownLng = breakdown.location_lng || breakdown.wizard_assessment_data?.location_coords?.lng;

    if (!breakdownLat || !breakdownLng) {
      return res.status(400).json({ success: false, error: 'Breakdown has no GPS coordinates' });
    }

    // Calculate dead miles using Google Directions
    let deadMiles = null;
    let deadMilesDuration = null;
    try {
      const distance = await calculateRoadDistance(
        depotLat, depotLng,
        breakdownLat, breakdownLng
      );
      deadMiles = distance.distanceMiles;
      deadMilesDuration = distance.durationMinutes;
    } catch (distErr) {
      console.error('Google Directions error (non-fatal):', distErr.message);
      // Continue without distance - can be calculated later
    }

    // Get supervisor info from the request (set by auth middleware)
    const supervisorBadge = req.user?.badge_number || req.body.dispatched_by_badge || null;
    const supervisorName = req.user?.name || req.body.dispatched_by_name || null;

    // Insert replacement record
    await insert('replacement_vehicles', {
      breakdown_id: id,
      breakdown_ref: breakdown.breakdown_id,
      replacement_fleet_no: fleet_no,
      sending_depot_code: sending_depot_code,
      sending_depot_name: depotName,
      depot_lat: depotLat,
      depot_lng: depotLng,
      breakdown_lat: breakdownLat,
      breakdown_lng: breakdownLng,
      dead_miles: deadMiles,
      dead_miles_duration_minutes: deadMilesDuration,
      total_dead_miles: deadMiles,
      status: 'dispatched',
      dispatched_by_badge: supervisorBadge,
      dispatched_by_name: supervisorName,
      created_at: toMySQLDatetime(),
      updated_at: toMySQLDatetime()
    });

    // Log activity
    try {
      await activityLogger.log({
        activityType: ACTIVITY_TYPES.BREAKDOWN_UPDATED,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: supervisorBadge || 'system',
        actorName: supervisorName || 'System',
        entityType: ENTITY_TYPES.BREAKDOWN,
        entityId: id,
        severity: SEVERITY_LEVELS.MEDIUM,
        message: `Replacement vehicle ${fleet_no} dispatched from ${depotName}`,
        metadata: { fleet_no, depot: depotName, dead_miles: deadMiles }
      });
    } catch (logErr) {
      console.error('Activity log error (non-fatal):', logErr.message);
    }

    // Broadcast via WebSocket
    try {
      webSocketHandler.broadcast({
        type: 'replacement_dispatched',
        breakdown_id: id,
        replacement_fleet_no: fleet_no,
        sending_depot: depotName,
        dead_miles: deadMiles
      });
    } catch (wsErr) {
      console.error('WebSocket broadcast error (non-fatal):', wsErr.message);
    }

    res.json({
      success: true,
      message: 'Replacement vehicle dispatched',
      data: {
        breakdown_id: id,
        replacement_fleet_no: fleet_no,
        sending_depot: depotName,
        dead_miles: deadMiles,
        dead_miles_duration_minutes: deadMilesDuration,
        status: 'dispatched'
      }
    });
  } catch (error) {
    console.error('Error dispatching replacement:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch replacement vehicle' });
  }
});

// PUT /api/breakdowns/:id/replacement/return-to-service - Record where replacement enters service
router.put('/:id/replacement/return-to-service', validate(replacementSchemas.returnToService), async (req, res) => {
  try {
    const { id } = req.params;
    const { stop_id, latitude, longitude, location_description } = req.body;

    // Find the active replacement for this breakdown
    const rows = await query(
      'SELECT * FROM replacement_vehicles WHERE breakdown_id = ? AND status = ? LIMIT 1',
      [id, 'dispatched']
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No dispatched replacement found for this breakdown' });
    }

    const replacement = rows[0];
    let rtsLat = latitude;
    let rtsLng = longitude;
    let rtsLocation = location_description || '';

    // If stop_id provided, look up stop coordinates
    if (stop_id) {
      const stopRows = await query(
        'SELECT stop_name, stop_lat, stop_lon FROM gtfs_stops WHERE stop_id = ? LIMIT 1',
        [stop_id]
      );
      if (stopRows && stopRows.length > 0) {
        rtsLat = stopRows[0].stop_lat;
        rtsLng = stopRows[0].stop_lon;
        rtsLocation = stopRows[0].stop_name;
      } else {
        return res.status(400).json({ success: false, error: 'Stop not found' });
      }
    }

    if (!rtsLat || !rtsLng) {
      return res.status(400).json({ success: false, error: 'Return-to-service coordinates required' });
    }

    // Calculate pickup miles: breakdown -> return-to-service point
    let pickupMiles = null;
    let pickupDuration = null;
    try {
      const distance = await calculateRoadDistance(
        replacement.breakdown_lat, replacement.breakdown_lng,
        rtsLat, rtsLng
      );
      pickupMiles = distance.distanceMiles;
      pickupDuration = distance.durationMinutes;
    } catch (distErr) {
      console.error('Google Directions error (non-fatal):', distErr.message);
    }

    const totalDeadMiles = (parseFloat(replacement.dead_miles || 0) + (pickupMiles || 0)).toFixed(2);

    // Update replacement record
    await update('replacement_vehicles', { id: replacement.id }, {
      return_to_service_lat: rtsLat,
      return_to_service_lng: rtsLng,
      return_to_service_location: rtsLocation,
      return_to_service_at: toMySQLDatetime(),
      pickup_miles: pickupMiles,
      pickup_miles_duration_minutes: pickupDuration,
      total_dead_miles: totalDeadMiles,
      status: 'in_service',
      updated_at: toMySQLDatetime()
    });

    // Broadcast via WebSocket
    try {
      webSocketHandler.broadcast({
        type: 'replacement_in_service',
        breakdown_id: id,
        replacement_fleet_no: replacement.replacement_fleet_no,
        pickup_miles: pickupMiles,
        total_dead_miles: parseFloat(totalDeadMiles)
      });
    } catch (wsErr) {
      console.error('WebSocket broadcast error (non-fatal):', wsErr.message);
    }

    res.json({
      success: true,
      message: 'Replacement vehicle returned to service',
      data: {
        breakdown_id: id,
        replacement_fleet_no: replacement.replacement_fleet_no,
        dead_miles: replacement.dead_miles,
        pickup_miles: pickupMiles,
        pickup_miles_duration_minutes: pickupDuration,
        total_dead_miles: parseFloat(totalDeadMiles),
        return_to_service_location: rtsLocation,
        status: 'in_service'
      }
    });
  } catch (error) {
    console.error('Error recording return to service:', error);
    res.status(500).json({ success: false, error: 'Failed to record return to service' });
  }
});

// GET /api/breakdowns/:id/replacement - Get replacement details for a breakdown
router.get('/:id/replacement', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query(
      'SELECT * FROM replacement_vehicles WHERE breakdown_id = ? AND status != ? ORDER BY created_at DESC LIMIT 1',
      [id, 'cancelled']
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching replacement:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch replacement data' });
  }
});

// GET /api/breakdowns/:id/replacement/route-stops - Get GTFS stops for the breakdown's route
router.get('/:id/replacement/route-stops', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the breakdown to find its route
    const { data: breakdown, error: bErr } = await from('breakdowns')
      .select('*')
      .eq('breakdown_id', id)
      .single();

    if (bErr || !breakdown) {
      return res.status(404).json({ success: false, error: 'Breakdown not found' });
    }

    const routeValue = breakdown.wizard_assessment_data?.route || breakdown.route_id || breakdown.route;
    if (!routeValue) {
      return res.json({ success: true, stops: [], message: 'No route linked to this breakdown' });
    }

    // Resolve route_short_name to GTFS route_id (breakdown stores "21", GTFS uses internal IDs)
    let gtfsRouteId = routeValue;
    const routeLookup = await query(
      'SELECT route_id FROM gtfs_routes WHERE route_id = ? OR route_short_name = ? LIMIT 1',
      [routeValue, routeValue]
    );
    if (routeLookup && routeLookup.length > 0) {
      gtfsRouteId = routeLookup[0].route_id;
    }

    // Find stops on this route via GTFS join
    const stops = await query(`
      SELECT DISTINCT gs.stop_id, gs.stop_name, gs.stop_lat, gs.stop_lon
      FROM gtfs_stops gs
      JOIN gtfs_stop_times gst ON gst.stop_id = gs.stop_id
      JOIN gtfs_trips gt ON gt.trip_id = gst.trip_id
      WHERE gt.route_id = ?
      ORDER BY gs.stop_name ASC
      LIMIT 200
    `, [gtfsRouteId]);

    res.json({ success: true, stops: stops || [] });
  } catch (error) {
    console.error('Error fetching route stops:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch route stops' });
  }
});

export default router;
