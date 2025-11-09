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
import { activityLogger } from '../services/activityLogger.js';
import webSocketHandler from './webSocketHandler.js';
import { validate } from '../middleware/validationMiddleware.js';
import { breakdownSchemas } from '../validation/schemas.js';

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
    const { data, error } = await from('breakdowns')
      .select('*')
      .in('status', ['active', 'pending', 'in_progress'])
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    // Transform breakdowns for frontend compatibility
    const transformedData = transformBreakdownsArray(data);

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching active breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch active breakdowns' });
  }
});

// GET /api/breakdowns/live - Get active breakdowns for dashboards
router.get('/live', async (req, res) => {
  try {
    console.log('\n=== LIVE BREAKDOWNS REQUEST ===');

    // Query for unresolved breakdowns using direct MySQL query
    // Exclude: resolved, deleted, cancelled, completed statuses
    const [breakdowns] = await db.query(`
      SELECT * FROM breakdowns
      WHERE status NOT IN ('resolved', 'deleted', 'cancelled', 'completed')
      ORDER BY created_at DESC
    `);

    console.log(`✅ /live endpoint: Returning ${breakdowns?.length || 0} active breakdowns`);

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
        cleared_at: b.cleared_at
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

    const breakdownData = {
      ...req.body,
      breakdown_id: idResult.id,
      created_at: toMySQLDatetime(),
      status: req.body.status || 'received'
    };

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

    res.status(201).json({
      ...transformedData,
      breakdown_id: idResult.id
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

    await update('breakdowns', { id: req.params.id }, updateData);

    // Fetch the updated breakdown
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
    console.error('Error updating breakdown:', error);
    res.status(500).json({ error: 'Failed to update breakdown' });
  }
});

// PATCH /api/breakdowns/:id/status - Update breakdown status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

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

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

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
    const { resolution_notes, resolving_supervisor, returned_to_service } = req.body;

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

    // Transform breakdown for frontend compatibility
    const transformedData = transformBreakdownForFrontend(data);

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
      metadata
    } = req.body;

    // Verify breakdown exists
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
      not_in_service = false
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
        const [fleetVehicle] = await query(
          'SELECT depot FROM fleet_vehicles WHERE fleet_number = ?',
          [fleet_number]
        );
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

    res.status(201).json({
      success: true,
      breakdown_id: transformedData.breakdown_id,
      breakdown: transformedData,
      message: 'Breakdown created from wizard assessment'
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
    const resolvingUser = resolved_by || supervisor_badge || req.supervisor?.name || 'System';

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

export default router;
