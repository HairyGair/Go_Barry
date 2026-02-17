/**
 * Engineering Routes - MySQL Migration
 * Handles engineer dispatch, job tracking, and performance metrics
 *
 * Migrated from Supabase to MySQL - October 16, 2025
 *
 * Features:
 * - Engineer availability and assignment
 * - Breakdown dispatch workflow
 * - Job status tracking (accepted, on_site, fixing, completed)
 * - Performance metrics and SLA compliance
 * - Depot statistics and team management
 * - Vehicle breakdown history
 *
 * @author Anthony Gair
 * @version 2.0.0 (MySQL)
 */

import express from 'express';
import { query, select, insert, update } from '../config/mysql.js';
import { from } from '../utils/queryHelpers.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';
import { calculateRoadDistance } from '../services/googleDirectionsService.js';

const router = express.Router();

// WebSocket broadcaster (imported from server)
let wsBroadcast = null;

// Set WebSocket broadcaster
export const setWebSocketBroadcast = (broadcast) => {
  wsBroadcast = broadcast;
};

// Helper function to broadcast engineering events
const broadcastEngineeringEvent = (type, data) => {
  if (wsBroadcast) {
    wsBroadcast('engineering', {
      type,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

// GET /api/engineering/depot-stats - Get depot performance statistics
router.get('/depot-stats', async (req, res) => {
  try {
    // Get all active depots
    const { data: depots, error: depotError } = await from('depots')
      .select('*')
      .eq('is_active', true)
      .execute();

    if (depotError) throw depotError;

    // Get engineer data for each depot
    const depotStats = {};

    for (const depot of depots) {
      // Count breakdowns by depot in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      let depotBreakdownQuery = from('breakdowns')
        .select('*')
        .eq('depot', depot.code)
        .gte('created_at', oneDayAgo.toISOString())
        .in('status', ['active', 'pending', 'in_progress', 'dispatched', 'on_site']);

      // Hide demo breakdowns from real users
      if (req.user?.badge_number !== 'DEMO01') {
        depotBreakdownQuery = depotBreakdownQuery.neq('supervisor_badge', 'DEMO01');
      }

      const { data: breakdowns, error: breakdownError } = await depotBreakdownQuery.execute();

      if (breakdownError) throw breakdownError;

      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const breakdown of breakdowns) {
        if (breakdown.acknowledged_at && breakdown.received_at) {
          const responseTime = new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at);
          totalResponseTime += responseTime / 60000; // Convert to minutes
          responseCount++;
        }
      }

      const avgResponse = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

      // Calculate SLA compliance (under 30 minutes)
      const slaMetCount = breakdowns.filter(b => {
        if (!b.acknowledged_at || !b.received_at) return false;
        const responseTime = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
        return responseTime <= 30;
      }).length;

      const slaCompliance = breakdowns.length > 0
        ? Math.round((slaMetCount / breakdowns.length) * 100)
        : 100;

      // Get actual engineer counts
      const { data: depotEngineers } = await from('engineers')
        .select('status')
        .eq('depot', depot.code)
        .eq('is_active', true)
        .execute();

      const total = depotEngineers?.length || 0;
      const available = depotEngineers?.filter(e => e.status === 'available').length || 0;

      depotStats[depot.name] = {
        code: depot.code,
        available,
        total,
        avgResponse,
        sla: slaCompliance,
        activeBreakdowns: breakdowns.length
      };
    }

    res.json({
      success: true,
      teams: depotStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching depot stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch depot statistics'
    });
  }
});

// GET /api/engineering/engineers - Get all engineers
router.get('/engineers', async (req, res) => {
  try {
    const { data: engineers, error } = await from('engineers')
      .select('*')
      .eq('is_active', true)
      .order('name', 'ASC')
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      engineers: engineers || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineers'
    });
  }
});

// GET /api/engineering/metrics - Get engineering performance metrics
router.get('/metrics', async (req, res) => {
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

    // Get breakdowns for the period
    let metricsQuery = from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      metricsQuery = metricsQuery.neq('supervisor_badge', 'DEMO01');
    }

    const { data: breakdowns, error } = await metricsQuery.execute();

    if (error) throw error;

    // Calculate metrics
    const totalBreakdowns = breakdowns.length;
    const resolvedBreakdowns = breakdowns.filter(b => b.status === 'cleared').length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const breakdown of breakdowns) {
      if (breakdown.acknowledged_at && breakdown.received_at) {
        const responseTime = new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at);
        totalResponseTime += responseTime / 60000; // Convert to minutes
        responseCount++;
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Calculate SLA compliance
    const slaMetCount = breakdowns.filter(b => {
      if (!b.acknowledged_at || !b.received_at) return false;
      const responseTime = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
      return responseTime <= 30;
    }).length;

    const slaCompliance = responseCount > 0
      ? Math.round((slaMetCount / responseCount) * 100)
      : 100;

    // Engineer utilization (simulated based on active jobs)
    const { data: engineers } = await from('engineers')
      .select('status')
      .eq('is_active', true)
      .execute();

    const totalEngineers = engineers?.length || 1;
    const busyEngineers = engineers?.filter(e => e.status === 'on_job').length || 0;
    const engineerUtilization = Math.round((busyEngineers / totalEngineers) * 100);

    res.json({
      success: true,
      metrics: {
        totalBreakdowns,
        resolvedBreakdowns,
        avgResponseTime,
        slaCompliance,
        engineerUtilization,
        period
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engineering metrics'
    });
  }
});

// GET /api/engineering/engineers/available/:depotId - Get available engineers by depot
router.get('/engineers/available/:depotId', async (req, res) => {
  try {
    const { depotId } = req.params;

    // Map depot names to codes
    const depotMap = {
      'Washington': 'WAS',
      'Riverside': 'NCL',
      'Percy Main': 'NCL',
      'Consett': 'CON',
      'Deptford': 'GTS',
      'Hexham': 'HEX'
    };

    const depotCode = depotMap[depotId] || depotId;

    const { data: engineers, error } = await from('engineers')
      .select('*')
      .eq('depot', depotCode)
      .eq('status', 'available')
      .eq('is_active', true)
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      engineers: engineers || [],
      depotId: depotId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching available engineers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available engineers'
    });
  }
});

// POST /api/engineering/assign - Dispatch engineer (named or anonymous)
router.post('/assign', async (req, res) => {
  try {
    const { breakdown_id, engineer_id, estimated_arrival_minutes, assigned_by } = req.body;

    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id is required'
      });
    }

    const dispatchTime = new Date();
    let engineerName = null;
    let engineerBadge = null;

    // If engineer_id provided, look up the engineer and validate
    if (engineer_id) {
      const [engineer] = await select('engineers', { id: engineer_id });
      if (!engineer) {
        return res.status(404).json({ success: false, error: 'Engineer not found' });
      }
      engineerName = engineer.name;
      engineerBadge = engineer.badge_number;

      // Update engineer status to on_job
      await update('engineers', {
        status: 'on_job',
        current_breakdown_id: breakdown_id,
        updated_at: dispatchTime
      }, { id: engineer_id });
    }

    // Update breakdown status to dispatched
    const updateFields = {
      status: 'dispatched',
      dispatched_at: dispatchTime,
      engineer_dispatched_at: dispatchTime,
      engineer_eta_minutes: estimated_arrival_minutes || null,
      updated_at: dispatchTime
    };

    // Add engineer details if named dispatch
    if (engineerName) {
      updateFields.engineer_name = engineerName;
      updateFields.engineer_badge = engineerBadge;
      updateFields.engineer_id = engineerBadge;
    }

    const affectedRows = await update('breakdowns', updateFields, { breakdown_id });

    if (affectedRows === 0) {
      throw new Error('Breakdown not found');
    }

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    const dispatchedBy = engineerName
      ? `${engineerName} (${engineerBadge})`
      : (assigned_by || 'Engineering Manager');

    // Create breakdown event for audit trail
    await insert('breakdown_events', {
      breakdown_id: breakdown.id,
      event_type: 'engineer_dispatched',
      event_data: JSON.stringify({
        dispatched_at: dispatchTime.toISOString(),
        estimated_arrival_minutes: estimated_arrival_minutes || null,
        assigned_by: dispatchedBy,
        engineer_name: engineerName || null,
        engineer_badge: engineerBadge || null,
        engineer_id: engineer_id || null,
        breakdown_id: breakdown_id,
        fleet_no: breakdown.fleet_no,
        depot: breakdown.depot
      })
    });

    // Log activity to unified feed
    try {
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.ENGINEER_DISPATCHED,
        action: 'engineer dispatched',
        actorType: ACTOR_TYPES.ENGINEERING,
        actorId: engineerBadge || assigned_by || 'manager',
        actorName: engineerName || assigned_by || 'Engineering Manager',
        depot: breakdown.depot || 'Unknown',
        severity: SEVERITY_LEVELS.INFO,
        source: 'engineering_dashboard',
        metadata: {
          breakdown_id: breakdown.breakdown_id,
          fleet_no: breakdown.fleet_no,
          dispatched_at: dispatchTime.toISOString(),
          eta_minutes: estimated_arrival_minutes,
          engineer_name: engineerName || null,
          location: breakdown.location_description || breakdown.location,
          issue: breakdown.issue_category
        }
      });
      console.log('✅ Engineer dispatch activity logged');
    } catch (activityError) {
      console.error('⚠️ Failed to log engineer dispatch activity:', activityError);
    }

    // Broadcast WebSocket event with engineer name
    broadcastEngineeringEvent('engineer_dispatched', {
      breakdown_id,
      engineer_name: engineerName,
      engineer_badge: engineerBadge,
      breakdown
    });

    // Return assignment details
    res.json({
      success: true,
      dispatch: {
        breakdown_id,
        dispatched_at: dispatchTime.toISOString(),
        status: 'dispatched',
        estimated_arrival_minutes: estimated_arrival_minutes || null,
        assigned_by: dispatchedBy,
        engineer_name: engineerName || null,
        engineer_badge: engineerBadge || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error dispatching engineer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to dispatch engineer'
    });
  }
});

// POST /api/engineering/update-engineer-status - Update engineer arrival/completion status
router.post('/update-engineer-status', async (req, res) => {
  try {
    const { breakdown_id, status, notes } = req.body;

    if (!breakdown_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and status are required'
      });
    }

    const validStatuses = ['arrived', 'working', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateTime = new Date();
    const updateFields = {
      updated_at: updateTime
    };

    let eventType = '';
    let activityType = '';

    // Map status to database fields
    switch (status) {
      case 'arrived':
        updateFields.status = 'on_site';
        updateFields.engineer_on_site_at = updateTime;
        eventType = 'engineer_arrived';
        activityType = ACTIVITY_TYPES.ENGINEER_ARRIVED || 'engineer_arrived';
        break;
      case 'working':
        updateFields.status = 'in_progress';
        updateFields.engineer_fixing_at = updateTime;
        eventType = 'engineer_working';
        activityType = 'engineer_working';
        break;
      case 'completed':
        updateFields.status = 'resolved';
        updateFields.engineer_completed_at = updateTime;
        updateFields.cleared_at = updateTime;
        eventType = 'engineer_completed';
        activityType = ACTIVITY_TYPES.BREAKDOWN_CLEARED || 'breakdown_cleared';
        break;
    }

    // Update breakdown
    await update('breakdowns', updateFields, { breakdown_id });

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    // Create breakdown event
    await insert('breakdown_events', {
      breakdown_id: breakdown.id,
      event_type: eventType,
      event_data: JSON.stringify({
        status,
        timestamp: updateTime.toISOString(),
        notes: notes || null,
        breakdown_id: breakdown_id,
        fleet_no: breakdown.fleet_no
      })
    });

    // Log activity
    try {
      await activityLogger.logActivity({
        activityType: activityType,
        action: status === 'arrived' ? 'engineer arrived on site' :
                status === 'working' ? 'engineer started repairs' :
                'breakdown resolved',
        actorType: ACTOR_TYPES.ENGINEERING,
        actorId: 'engineer',
        actorName: 'Engineer',
        depot: breakdown.depot || 'Unknown',
        severity: SEVERITY_LEVELS.INFO,
        source: 'engineering_dashboard',
        metadata: {
          breakdown_id: breakdown.breakdown_id,
          fleet_no: breakdown.fleet_no,
          status,
          timestamp: updateTime.toISOString(),
          notes: notes || null
        }
      });
      console.log(`✅ Engineer ${status} activity logged`);
    } catch (activityError) {
      console.error('⚠️ Failed to log activity:', activityError);
    }

    res.json({
      success: true,
      breakdown: {
        breakdown_id,
        status: updateFields.status,
        updated_at: updateTime.toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating engineer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update engineer status'
    });
  }
});

// POST /api/engineering/auto-assign - Auto-assign nearest available engineer
router.post('/auto-assign', async (req, res) => {
  try {
    const { breakdown_id, depot_id } = req.body;

    if (!breakdown_id || !depot_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and depot_id are required'
      });
    }

    // Get available engineers from depot
    const { data: availableEngineers } = await from('engineers')
      .select('*')
      .eq('depot', depot_id)
      .eq('status', 'available')
      .eq('is_active', true)
      .limit(1)
      .execute();

    const assignedEngineer = availableEngineers?.[0] || {
      id: 'AUTO',
      name: 'Auto-assigned Engineer',
      badge_number: 'AUTO001',
      depot: depot_id
    };

    // Update breakdown
    await update(
      'breakdowns',
      {
        status: 'dispatched',
        dispatched_at: new Date(),
        engineer_id: assignedEngineer.badge_number,
        engineer_name: assignedEngineer.name,
        updated_at: new Date()
      },
      { breakdown_id }
    );

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    res.json({
      success: true,
      assignment: {
        breakdown_id,
        engineer: assignedEngineer,
        from_depot: depot_id,
        status: 'dispatched',
        estimated_arrival_minutes: 30
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error auto-assigning engineer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-assign engineer'
    });
  }
});

// PUT /api/engineering/assignment/:id/status - Update assignment status
router.put('/assignment/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['dispatched', 'on_site', 'repairing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Map status to breakdown status
    let breakdownStatus = 'in_progress';
    let updateFields = {
      status: breakdownStatus,
      updated_at: new Date()
    };

    switch (status) {
      case 'dispatched':
        updateFields.status = 'dispatched';
        updateFields.dispatched_at = new Date();
        break;
      case 'on_site':
        updateFields.status = 'on_site';
        updateFields.engineer_on_site_at = new Date();
        break;
      case 'repairing':
        updateFields.status = 'in_progress';
        updateFields.engineer_fixing_at = new Date();
        break;
      case 'completed':
        updateFields.status = 'cleared';
        updateFields.cleared_at = new Date();
        break;
    }

    // Update breakdown status by ID
    await update('breakdowns', updateFields, { id: parseInt(id) });

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { id: parseInt(id) });

    res.json({
      success: true,
      assignment: {
        id: breakdown.id,
        breakdown_id: breakdown.breakdown_id,
        status: status,
        updated_at: breakdown.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment status'
    });
  }
});

// GET /api/engineering/breakdown/:id/assignments - Get breakdown assignments
router.get('/breakdown/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;

    // Get breakdown details
    const [breakdown] = await select('breakdowns', { breakdown_id: id });

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Get assignment history from events
    const sql = `
      SELECT * FROM breakdown_events
      WHERE breakdown_id = ?
      AND event_type = 'engineer_assigned'
      ORDER BY created_at DESC
    `;
    const events = await query(sql, [breakdown.id]);

    // Format assignments
    const assignments = events.map(event => {
      const eventData = typeof event.event_data === 'string'
        ? JSON.parse(event.event_data)
        : event.event_data;

      return {
        id: event.id,
        engineer_id: eventData?.engineer_id,
        engineer_name: eventData?.engineer_name || 'Unknown',
        status: breakdown.status,
        assigned_at: event.created_at,
        arrival_at: breakdown.engineer_on_site_at,
        completed_at: breakdown.cleared_at,
        travel_time_minutes: breakdown.engineer_on_site_at && event.created_at
          ? Math.round((new Date(breakdown.engineer_on_site_at) - new Date(event.created_at)) / 60000)
          : null
      };
    });

    res.json({
      success: true,
      breakdown_id: id,
      assignments: assignments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching breakdown assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdown assignments'
    });
  }
});

// GET /api/engineering/performance - Get overall engineering performance stats
router.get('/performance', async (req, res) => {
  try {
    const { period = 'today', depot } = req.query;

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
      default: // today
        startDate.setHours(0, 0, 0, 0);
    }

    // Build query
    let sql = 'SELECT * FROM breakdowns WHERE created_at >= ?';
    let params = [startDate];

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      sql += " AND supervisor_badge != 'DEMO01'";
    }

    if (depot) {
      sql += ' AND depot = ?';
      params.push(depot);
    }

    const breakdowns = await query(sql, params);

    // Calculate performance metrics
    const totalBreakdowns = breakdowns.length;
    const resolvedBreakdowns = breakdowns.filter(b => b.status === 'cleared').length;
    const activeBreakdowns = breakdowns.filter(b =>
      ['active', 'pending', 'in_progress', 'dispatched', 'on_site'].includes(b.status)
    ).length;

    // Response time calculations
    let totalResponseTime = 0;
    let totalRepairTime = 0;
    let responseCount = 0;
    let repairCount = 0;
    let firstTimeFixCount = 0;

    breakdowns.forEach(b => {
      // Response time (received to acknowledged)
      if (b.acknowledged_at && b.received_at) {
        const responseTime = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
        totalResponseTime += responseTime;
        responseCount++;
      }

      // Repair time (dispatched to cleared)
      if (b.cleared_at && b.dispatched_at) {
        const repairTime = (new Date(b.cleared_at) - new Date(b.dispatched_at)) / 60000;
        totalRepairTime += repairTime;
        repairCount++;

        // Assume first-time fix if resolved within 2 hours
        if (repairTime <= 120) {
          firstTimeFixCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const avgRepairTime = repairCount > 0 ? Math.round(totalRepairTime / repairCount) : 0;
    const firstTimeFixRate = repairCount > 0
      ? Math.round((firstTimeFixCount / repairCount) * 100) : 0;

    // Breakdown by severity
    const bySeverity = {
      critical: breakdowns.filter(b => b.severity === 'STOP').length,
      warning: breakdowns.filter(b => b.severity === 'AMBER').length,
      normal: breakdowns.filter(b => b.severity === 'CONTINUE').length
    };

    // Top issue categories
    const issueCounts = {};
    breakdowns.forEach(b => {
      const issue = b.issue_category || 'Other';
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    const topIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get engineer count for productivity calculation
    const { data: engineers } = await from('engineers')
      .select('id')
      .eq('is_active', true)
      .execute();

    const engineerCount = engineers?.length || 10;

    res.json({
      success: true,
      performance: {
        period,
        depot: depot || 'All Depots',
        totalBreakdowns,
        resolvedBreakdowns,
        activeBreakdowns,
        resolutionRate: totalBreakdowns > 0
          ? Math.round((resolvedBreakdowns / totalBreakdowns) * 100) : 0,
        avgResponseTime: `${avgResponseTime} minutes`,
        avgRepairTime: `${avgRepairTime} minutes`,
        firstTimeFixRate: `${firstTimeFixRate}%`,
        bySeverity,
        topIssues,
        engineerProductivity: {
          breakdownsPerEngineer: Math.round(totalBreakdowns / engineerCount),
          avgJobsPerDay: Math.round(totalBreakdowns / 7)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance data'
    });
  }
});

// GET /api/engineering/sla - Get SLA compliance data
router.get('/sla', async (req, res) => {
  try {
    const { period = 'today', depot } = req.query;

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
      default: // today
        startDate.setHours(0, 0, 0, 0);
    }

    // Get breakdowns for SLA analysis
    let sql = 'SELECT * FROM breakdowns WHERE created_at >= ?';
    let params = [startDate];

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      sql += " AND supervisor_badge != 'DEMO01'";
    }

    if (depot) {
      sql += ' AND depot = ?';
      params.push(depot);
    }

    const breakdowns = await query(sql, params);

    // Define SLA targets (in minutes)
    const slaTargets = {
      STOP: 30,      // Critical - 30 minutes response
      AMBER: 60,     // Warning - 60 minutes response
      CONTINUE: 120  // Normal - 120 minutes response
    };

    // Calculate SLA compliance
    let totalWithSLA = 0;
    let slaMet = 0;
    let slaBreached = 0;
    const slaDetails = {
      critical: { total: 0, met: 0, breached: 0 },
      warning: { total: 0, met: 0, breached: 0 },
      normal: { total: 0, met: 0, breached: 0 }
    };

    breakdowns.forEach(b => {
      if (!b.acknowledged_at || !b.received_at) return;

      const responseMinutes = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;
      const target = slaTargets[b.severity] || slaTargets.CONTINUE;

      totalWithSLA++;

      const severityKey = b.severity === 'STOP' ? 'critical' :
                         b.severity === 'AMBER' ? 'warning' : 'normal';

      slaDetails[severityKey].total++;

      if (responseMinutes <= target) {
        slaMet++;
        slaDetails[severityKey].met++;
      } else {
        slaBreached++;
        slaDetails[severityKey].breached++;
      }
    });

    const overallCompliance = totalWithSLA > 0
      ? Math.round((slaMet / totalWithSLA) * 100) : 100;

    // Calculate compliance by severity
    const complianceBySeverity = {
      critical: slaDetails.critical.total > 0
        ? Math.round((slaDetails.critical.met / slaDetails.critical.total) * 100) : 100,
      warning: slaDetails.warning.total > 0
        ? Math.round((slaDetails.warning.met / slaDetails.warning.total) * 100) : 100,
      normal: slaDetails.normal.total > 0
        ? Math.round((slaDetails.normal.met / slaDetails.normal.total) * 100) : 100
    };

    // Response time distribution
    const responseTimeRanges = {
      under15: 0,
      '15to30': 0,
      '30to60': 0,
      '60to120': 0,
      over120: 0
    };

    breakdowns.forEach(b => {
      if (!b.acknowledged_at || !b.received_at) return;
      const responseMinutes = (new Date(b.acknowledged_at) - new Date(b.received_at)) / 60000;

      if (responseMinutes < 15) responseTimeRanges.under15++;
      else if (responseMinutes <= 30) responseTimeRanges['15to30']++;
      else if (responseMinutes <= 60) responseTimeRanges['30to60']++;
      else if (responseMinutes <= 120) responseTimeRanges['60to120']++;
      else responseTimeRanges.over120++;
    });

    res.json({
      success: true,
      sla: {
        period,
        depot: depot || 'All Depots',
        overallCompliance: `${overallCompliance}%`,
        totalBreakdowns: breakdowns.length,
        breakdownsWithSLA: totalWithSLA,
        slaMet,
        slaBreached,
        complianceBySeverity,
        slaDetails,
        responseTimeDistribution: responseTimeRanges,
        targets: {
          critical: '30 minutes',
          warning: '60 minutes',
          normal: '120 minutes'
        },
        status: overallCompliance >= 95 ? 'good' :
                overallCompliance >= 90 ? 'warning' : 'critical'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching SLA data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SLA compliance data'
    });
  }
});

// GET /api/engineering/teams - Get team availability and status
router.get('/teams', async (req, res) => {
  try {
    // Get all active depots
    const { data: depots, error: depotError } = await from('depots')
      .select('*')
      .eq('is_active', true)
      .execute();

    if (depotError) throw depotError;

    // Get team data for each depot
    const teams = [];

    for (const depot of depots) {
      // Get active breakdowns for this depot
      let teamsSql = `
        SELECT * FROM breakdowns
        WHERE depot = ?
        AND status IN ('active', 'pending', 'in_progress', 'dispatched', 'on_site')
      `;
      // Hide demo breakdowns from real users
      if (req.user?.badge_number !== 'DEMO01') {
        teamsSql += " AND supervisor_badge != 'DEMO01'";
      }
      const activeBreakdowns = await query(teamsSql, [depot.code]);

      // Get engineer data for this depot
      const { data: depotEngineers } = await from('engineers')
        .select('status')
        .eq('depot', depot.code)
        .eq('is_active', true)
        .execute();

      const total = depotEngineers?.length || 0;
      const available = depotEngineers?.filter(e => e.status === 'available').length || 0;
      const onSite = depotEngineers?.filter(e => e.status === 'on_job').length || 0;
      const onBreak = depotEngineers?.filter(e => e.status === 'off_duty').length || 0;

      teams.push({
        depot: depot.name,
        depotCode: depot.code,
        status: available > 0 ? 'operational' : 'limited',
        engineers: {
          total,
          available,
          onSite,
          onBreak
        },
        workload: {
          activeBreakdowns: activeBreakdowns.length,
          criticalBreakdowns: activeBreakdowns.filter(b => b.severity === 'STOP').length,
          avgPerEngineer: total > 0
            ? Math.round(activeBreakdowns.length / total * 10) / 10 : 0
        },
        capacity: available > activeBreakdowns.length ? 'good' :
                 available >= activeBreakdowns.length / 2 ? 'moderate' : 'strained'
      });
    }

    // Calculate totals
    const totals = teams.reduce((acc, team) => ({
      totalEngineers: acc.totalEngineers + team.engineers.total,
      availableEngineers: acc.availableEngineers + team.engineers.available,
      onSiteEngineers: acc.onSiteEngineers + team.engineers.onSite,
      totalBreakdowns: acc.totalBreakdowns + team.workload.activeBreakdowns,
      criticalBreakdowns: acc.criticalBreakdowns + team.workload.criticalBreakdowns
    }), {
      totalEngineers: 0,
      availableEngineers: 0,
      onSiteEngineers: 0,
      totalBreakdowns: 0,
      criticalBreakdowns: 0
    });

    res.json({
      success: true,
      teams,
      summary: {
        ...totals,
        overallCapacity: totals.availableEngineers > totals.totalBreakdowns ? 'good' :
                        totals.availableEngineers >= totals.totalBreakdowns / 2 ? 'moderate' : 'strained',
        avgUtilization: totals.totalEngineers > 0
          ? Math.round((totals.onSiteEngineers / totals.totalEngineers) * 100) : 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching teams data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams data'
    });
  }
});

// POST /api/engineering/accept-job - Engineer accepts a breakdown job
router.post('/accept-job', async (req, res) => {
  try {
    const { breakdown_id, engineer_badge, engineer_name, eta_minutes } = req.body;

    if (!breakdown_id || !engineer_badge) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and engineer_badge are required'
      });
    }

    const acceptTime = new Date();

    // Update breakdown with engineer assignment
    await update(
      'breakdowns',
      {
        engineer_id: engineer_badge,
        engineer_name: engineer_name || 'Engineer',
        engineer_badge: engineer_badge,
        engineer_eta_minutes: eta_minutes || null,
        engineer_accepted_at: acceptTime,
        status: 'dispatched',
        updated_at: acceptTime
      },
      { breakdown_id }
    );

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    // Update engineer status
    await update(
      'engineers',
      {
        status: 'on_job',
        current_breakdown_id: breakdown_id,
        updated_at: acceptTime
      },
      { badge_number: engineer_badge }
    );

    // Broadcast WebSocket event
    broadcastEngineeringEvent('job_accepted', {
      breakdown_id,
      engineer_badge,
      engineer_name,
      breakdown
    });

    res.json({
      success: true,
      breakdown: {
        breakdown_id,
        engineer_badge,
        engineer_name,
        status: 'dispatched',
        accepted_at: acceptTime.toISOString(),
        eta_minutes: eta_minutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept job'
    });
  }
});

// PUT /api/engineering/update-status - Update engineer job status
router.put('/update-status', async (req, res) => {
  try {
    const { breakdown_id, status, engineer_badge, notes } = req.body;

    if (!breakdown_id || !status) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and status are required'
      });
    }

    const validStatuses = ['dispatched', 'on_site', 'fixing', 'testing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateTime = new Date();

    // Prepare update fields based on status
    let updateFields = {
      status: status === 'fixing' || status === 'testing' ? 'in_progress' : status,
      updated_at: updateTime
    };

    // Add timestamp fields based on status
    switch (status) {
      case 'on_site':
        updateFields.engineer_on_site_at = updateTime;
        break;
      case 'fixing':
        updateFields.engineer_fixing_at = updateTime;
        break;
    }

    // Add notes if provided
    if (notes) {
      // Get existing notes first
      const [existing] = await select('breakdowns', { breakdown_id }, ['engineer_notes']);

      let existingNotes = [];
      if (existing?.engineer_notes) {
        existingNotes = typeof existing.engineer_notes === 'string'
          ? JSON.parse(existing.engineer_notes)
          : existing.engineer_notes;
      }

      const newNote = {
        timestamp: updateTime.toISOString(),
        engineer: engineer_badge || 'Unknown',
        note: notes,
        status: status
      };

      updateFields.engineer_notes = JSON.stringify([...existingNotes, newNote]);
    }

    // Update breakdown
    await update('breakdowns', updateFields, { breakdown_id });

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    // Broadcast WebSocket event
    broadcastEngineeringEvent('status_updated', {
      breakdown_id,
      status,
      engineer_badge,
      breakdown
    });

    res.json({
      success: true,
      breakdown: {
        breakdown_id,
        status: status,
        updated_at: breakdown.updated_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// POST /api/engineering/complete-job - Complete a breakdown job
router.post('/complete-job', async (req, res) => {
  try {
    const {
      breakdown_id,
      engineer_badge,
      resolution_type,
      resolution_notes,
      parts_used,
      labor_hours,
      repair_category,
      root_cause,
      returned_to_service
    } = req.body;

    if (!breakdown_id || !resolution_type) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and resolution_type are required'
      });
    }

    const validResolutionTypes = ['fixed', 'changeover', 'workshop_required', 'escalated', 'deem_safe'];
    if (!validResolutionTypes.includes(resolution_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resolution_type. Must be one of: ${validResolutionTypes.join(', ')}`
      });
    }

    const completionTime = new Date();

    // Update breakdown as completed
    await update(
      'breakdowns',
      {
        status: 'resolved',
        engineer_completed_at: completionTime,
        resolved_at: completionTime,
        resolved_by: engineer_badge || 'Engineering Team',
        resolution_type: resolution_type,
        resolution_notes: resolution_notes || '',
        parts_used: parts_used ? JSON.stringify(parts_used) : null,
        labor_hours: labor_hours || null,
        repair_category: repair_category || null,
        root_cause: root_cause || '',
        returned_to_service: returned_to_service !== false,
        updated_at: completionTime
      },
      { breakdown_id }
    );

    // Get updated breakdown
    const [breakdown] = await select('breakdowns', { breakdown_id });

    // Update engineer status back to available (only if engineer_badge provided)
    if (engineer_badge) {
      await update(
        'engineers',
        {
          status: 'available',
          current_breakdown_id: null,
          updated_at: completionTime
        },
        { badge_number: engineer_badge }
      );
    }

    // Broadcast WebSocket event
    broadcastEngineeringEvent('job_completed', {
      breakdown_id,
      engineer_badge,
      resolution_type,
      breakdown
    });

    res.json({
      success: true,
      completion: {
        breakdown_id,
        engineer_badge,
        resolution_type,
        completed_at: completionTime.toISOString(),
        labor_hours: labor_hours,
        returned_to_service: returned_to_service !== false
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete job'
    });
  }
});

// GET /api/engineering/jobs - Get engineering jobs queue
router.get('/jobs', async (req, res) => {
  try {
    const { filter = 'all', engineer_badge } = req.query;

    // Base query for active breakdowns
    let sql = "SELECT * FROM breakdowns WHERE status != 'resolved'";
    let params = [];

    // Hide demo breakdowns from real users
    if (req.user?.badge_number !== 'DEMO01') {
      sql += " AND supervisor_badge != 'DEMO01'";
    }

    // Apply filters
    switch (filter) {
      case 'unassigned':
        sql += ' AND engineer_id IS NULL';
        break;
      case 'my_jobs':
        if (engineer_badge) {
          sql += ' AND engineer_badge = ?';
          params.push(engineer_badge);
        }
        break;
      case 'dispatched':
        sql += " AND status = 'dispatched'";
        break;
      case 'on_site':
        sql += " AND status = 'on_site'";
        break;
      case 'priority':
        sql += " AND (severity = 'STOP' OR wizard_decision = 'STOP')";
        break;
    }

    sql += ' ORDER BY created_at DESC';

    const breakdowns = await query(sql, params);

    // Process breakdowns with calculated fields
    const jobs = breakdowns.map(b => {
      const created = new Date(b.created_at);
      const now = new Date();
      const elapsedMinutes = Math.floor((now - created) / 60000);

      // Calculate time on site if applicable
      let timeOnSiteMinutes = null;
      if (b.engineer_on_site_at) {
        timeOnSiteMinutes = Math.floor((now - new Date(b.engineer_on_site_at)) / 60000);
      }

      return {
        ...b,
        elapsed_minutes: elapsedMinutes,
        time_on_site_minutes: timeOnSiteMinutes,
        is_overdue: elapsedMinutes > 60,
        sla_status: elapsedMinutes > 90 ? 'critical' : elapsedMinutes > 60 ? 'warning' : 'normal'
      };
    });

    res.json({
      success: true,
      jobs,
      count: jobs.length,
      filter,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
});

// GET /api/engineering/job/:breakdown_id - Get full job details including assessment data
router.get('/job/:breakdown_id', async (req, res) => {
  try {
    const { breakdown_id } = req.params;

    // Get breakdown with all details
    const [breakdown] = await select('breakdowns', { breakdown_id });

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Calculate timeline durations
    const timeline = {
      created_at: breakdown.created_at,
      accepted_at: breakdown.engineer_accepted_at,
      on_site_at: breakdown.engineer_on_site_at,
      fixing_at: breakdown.engineer_fixing_at,
      completed_at: breakdown.engineer_completed_at,

      // Calculated durations
      time_to_accept: breakdown.engineer_accepted_at
        ? Math.floor((new Date(breakdown.engineer_accepted_at) - new Date(breakdown.created_at)) / 60000)
        : null,
      time_to_site: breakdown.engineer_on_site_at && breakdown.engineer_accepted_at
        ? Math.floor((new Date(breakdown.engineer_on_site_at) - new Date(breakdown.engineer_accepted_at)) / 60000)
        : null,
      time_on_site: breakdown.engineer_on_site_at && breakdown.engineer_completed_at
        ? Math.floor((new Date(breakdown.engineer_completed_at) - new Date(breakdown.engineer_on_site_at)) / 60000)
        : breakdown.engineer_on_site_at
        ? Math.floor((new Date() - new Date(breakdown.engineer_on_site_at)) / 60000)
        : null,
      total_elapsed: Math.floor((new Date() - new Date(breakdown.created_at)) / 60000)
    };

    // Parse wizard assessment data
    let wizardData = {};
    if (breakdown.wizard_assessment_data) {
      wizardData = typeof breakdown.wizard_assessment_data === 'string'
        ? JSON.parse(breakdown.wizard_assessment_data)
        : breakdown.wizard_assessment_data;
    }

    res.json({
      success: true,
      job: {
        ...breakdown,
        timeline,
        wizard_responses: wizardData,
        assessment_summary: parseAssessmentSummary(breakdown)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job details'
    });
  }
});

// Helper function to parse assessment summary from wizard data
function parseAssessmentSummary(breakdown) {
  const summary = {
    issue_type: breakdown.issue_category || 'General',
    severity: breakdown.severity || breakdown.wizard_decision || 'Unknown',
    key_symptoms: [],
    safety_concerns: [],
    recommended_actions: []
  };

  // Parse wizard assessment data if available
  if (breakdown.wizard_assessment_data) {
    const data = typeof breakdown.wizard_assessment_data === 'string'
      ? JSON.parse(breakdown.wizard_assessment_data)
      : breakdown.wizard_assessment_data;

    // Extract symptoms
    if (data.symptoms) {
      summary.key_symptoms = Array.isArray(data.symptoms) ? data.symptoms : [data.symptoms];
    }

    // Extract safety concerns
    if (data.safety_critical === true || data.immediate_danger === true) {
      summary.safety_concerns.push('Safety critical issue identified');
    }

    // Extract recommended actions
    if (data.recommended_action) {
      summary.recommended_actions = Array.isArray(data.recommended_action)
        ? data.recommended_action
        : [data.recommended_action];
    }
  }

  return summary;
}

// GET /api/engineering/vehicle-history/:fleet_no - Get breakdown history for a vehicle
router.get('/vehicle-history/:fleet_no', async (req, res) => {
  try {
    const { fleet_no } = req.params;
    const { limit = 10 } = req.query;

    if (!fleet_no) {
      return res.status(400).json({
        success: false,
        error: 'fleet_no is required'
      });
    }

    // Get breakdown history for this fleet number
    const sql = `
      SELECT * FROM breakdowns
      WHERE fleet_no = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const breakdowns = await query(sql, [fleet_no, parseInt(limit)]);

    // Calculate statistics
    const totalBreakdowns = breakdowns.length;
    const last30Days = breakdowns.filter(b => {
      const created = new Date(b.created_at);
      const daysAgo = (new Date() - created) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    const last90Days = breakdowns.filter(b => {
      const created = new Date(b.created_at);
      const daysAgo = (new Date() - created) / (1000 * 60 * 60 * 24);
      return daysAgo <= 90;
    }).length;

    // Identify recurring issues
    const issueCounts = {};
    breakdowns.forEach(b => {
      const issue = b.issue_category || 'Other';
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    const recurringIssues = Object.entries(issueCounts)
      .filter(([issue, count]) => count > 1)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count);

    // Most recent breakdown
    const mostRecent = breakdowns.length > 0 ? breakdowns[0] : null;

    // Calculate average resolution time
    const resolvedBreakdowns = breakdowns.filter(b => b.cleared_at && b.created_at);
    let avgResolutionMinutes = 0;
    if (resolvedBreakdowns.length > 0) {
      const totalMinutes = resolvedBreakdowns.reduce((sum, b) => {
        const created = new Date(b.created_at);
        const cleared = new Date(b.cleared_at);
        return sum + (cleared - created) / 60000;
      }, 0);
      avgResolutionMinutes = Math.round(totalMinutes / resolvedBreakdowns.length);
    }

    // Problem vehicle flag (>3 breakdowns in 90 days)
    const isProblemVehicle = last90Days > 3;

    res.json({
      success: true,
      fleet_no,
      history: {
        breakdowns: breakdowns.map(b => ({
          breakdown_id: b.breakdown_id,
          created_at: b.created_at,
          issue_category: b.issue_category,
          severity: b.severity || b.wizard_decision,
          status: b.status,
          resolved_at: b.cleared_at,
          resolution_type: b.resolution_type,
          engineer_name: b.engineer_name,
          depot: b.depot
        })),
        statistics: {
          totalBreakdowns,
          last30Days,
          last90Days,
          avgResolutionMinutes,
          isProblemVehicle
        },
        recurringIssues,
        mostRecent: mostRecent ? {
          breakdown_id: mostRecent.breakdown_id,
          created_at: mostRecent.created_at,
          issue_category: mostRecent.issue_category,
          status: mostRecent.status
        } : null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching vehicle history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vehicle history'
    });
  }
});

// Depot coordinates for ETA calculation (verified from OpenStreetMap Dec 2025)
const DEPOT_COORDS = {
  WAS: { lat: 54.9068, lng: -1.5140, name: 'Washington' },
  NCL: { lat: 54.9586, lng: -1.6579, name: 'Riverside' },
  CON: { lat: 54.8403, lng: -1.8380, name: 'Consett' },
  GTS: { lat: 54.9142, lng: -1.3976, name: 'Deptford' },
  HEX: { lat: 54.9689, lng: -2.0953, name: 'Hexham' },
  DAR: { lat: 54.9962, lng: -1.4692, name: 'Percy Main' },
  PM:  { lat: 54.9962, lng: -1.4692, name: 'Percy Main' }
};

// POST /api/engineering/calculate-eta - Auto-calculate ETA from depot to breakdown via Google Directions
router.post('/calculate-eta', async (req, res) => {
  try {
    const { depot_code, breakdown_lat, breakdown_lng } = req.body;

    if (!depot_code || !breakdown_lat || !breakdown_lng) {
      return res.status(400).json({
        success: false,
        error: 'depot_code, breakdown_lat, and breakdown_lng are required'
      });
    }

    const depot = DEPOT_COORDS[depot_code];
    if (!depot) {
      return res.status(400).json({
        success: false,
        error: `Unknown depot code: ${depot_code}`
      });
    }

    const lat = parseFloat(breakdown_lat);
    const lng = parseFloat(breakdown_lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid breakdown coordinates'
      });
    }

    const result = await calculateRoadDistance(depot.lat, depot.lng, lat, lng);

    res.json({
      success: true,
      eta_minutes: result.durationMinutes,
      distance_miles: result.distanceMiles,
      from_depot: depot.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating ETA:', error.message);

    // Graceful fallback: estimate based on straight-line distance
    try {
      const depot = DEPOT_COORDS[req.body.depot_code];
      if (depot) {
        const lat = parseFloat(req.body.breakdown_lat);
        const lng = parseFloat(req.body.breakdown_lng);
        // Haversine approximation for NE England (~111km per degree lat)
        const dLat = (lat - depot.lat) * 111;
        const dLng = (lng - depot.lng) * 111 * Math.cos(depot.lat * Math.PI / 180);
        const straightLineKm = Math.sqrt(dLat * dLat + dLng * dLng);
        const roadKm = straightLineKm * 1.35; // ~35% road factor
        const etaMinutes = Math.round(roadKm / 0.67); // ~40 km/h average

        return res.json({
          success: true,
          eta_minutes: etaMinutes,
          distance_miles: parseFloat((roadKm * 0.621371).toFixed(1)),
          from_depot: depot.name,
          estimated: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (fallbackErr) {
      // ignore fallback errors
    }

    res.status(500).json({
      success: false,
      error: 'Failed to calculate ETA'
    });
  }
});

export default router;
