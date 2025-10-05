import express from 'express';
import { supabase } from '../server.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

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
    // Get all depots
    const { data: depots, error: depotError } = await supabase
      .from('depots')
      .select('*')
      .eq('is_active', true);

    if (depotError) throw depotError;

    // Get engineer data for each depot (simulated for now)
    const depotStats = {};
    
    for (const depot of depots) {
      // Count breakdowns by depot in last 24 hours
      const { data: breakdowns, error: breakdownError } = await supabase
        .from('breakdowns')
        .select('*')
        .eq('depot', depot.code)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .in('status', ['active', 'pending', 'in_progress']);

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

      // Simulated engineer data based on depot codes
      const engineerCounts = {
        'WAS': { available: 3, total: 5 },
        'DAR': { available: 2, total: 4 },
        'NCL': { available: 2, total: 4 },
        'HEX': { available: 2, total: 2 },
        'CON': { available: 1, total: 4 },
        'GTS': { available: 1, total: 3 }
      };
      
      // Get actual engineer counts if the table exists
      try {
        const { data: depotEngineers, error: engError } = await supabase
          .from('engineers')
          .select('depot, status')
          .eq('depot', depot.code)
          .eq('is_active', true);
          
        if (!engError && depotEngineers) {
          const total = depotEngineers.length;
          const available = depotEngineers.filter(e => e.status === 'available').length;
          engineerCounts[depot.code] = { available, total };
        }
      } catch (e) {
        // Use simulated data if engineers table doesn't exist
      }

      depotStats[depot.name] = {
        code: depot.code,
        available: engineerCounts[depot.code]?.available || 0,
        total: engineerCounts[depot.code]?.total || 0,
        avgResponse: avgResponse,
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
    const { data: engineers, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('is_active', true)
      .order('name');

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
    const { data: breakdowns, error } = await supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString());

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

    // Engineer utilization (simulated)
    const engineerUtilization = 78; // This would come from engineer time tracking

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
      'Riverside': 'NCL',  // Assuming Riverside maps to Newcastle
      'Percy Main': 'NCL',
      'Consett': 'CON',
      'Deptford': 'GTS',   // Assuming Deptford maps to Gateshead
      'Hexham': 'HEX'
    };

    const depotCode = depotMap[depotId] || depotId;
    
    const { data: engineers, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('depot', depotCode)
      .eq('status', 'available')
      .eq('is_active', true);

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

// POST /api/engineering/assign - Assign engineer to breakdown
router.post('/assign', async (req, res) => {
  try {
    const { breakdown_id, engineer_id, estimated_arrival_minutes } = req.body;
    
    if (!breakdown_id || !engineer_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'breakdown_id and engineer_id are required' 
      });
    }

    // Update breakdown status to dispatched
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create breakdown event
    const { error: eventError } = await supabase
      .from('breakdown_events')
      .insert({
        breakdown_id: breakdown.id,
        event_type: 'engineer_assigned',
        event_data: {
          engineer_id,
          estimated_arrival_minutes,
          assigned_at: new Date().toISOString()
        }
      });

    if (eventError) console.error('Error creating event:', eventError);

    // Log activity to unified feed
    try {
      await activityLogger.logEngineerAssigned({
        engineerId: engineer_id,
        engineerName: 'Engineer', // This would come from engineer lookup in production
        breakdownId: breakdown.breakdown_id,
        fleetNo: breakdown.fleet_no,
        assignedBy: 'SDC',
        estimatedArrival: `${estimated_arrival_minutes} minutes`,
        depot: breakdown.depot || 'SDC'
      });
      console.log('✅ Engineer assignment activity logged');
    } catch (activityError) {
      console.error('⚠️ Failed to log engineer assignment activity:', activityError);
    }

    // Return assignment details
    res.json({
      success: true,
      assignment: {
        breakdown_id,
        engineer: {
          id: engineer_id,
          name: 'John Smith' // This would come from engineer lookup
        },
        status: 'dispatched',
        estimated_arrival_minutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error assigning engineer:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to assign engineer' 
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

    // For now, simulate auto-assignment
    // In production, this would use location data and availability
    const assignedEngineer = {
      id: 'ENG001',
      name: 'John Smith',
      badge_number: 'JS001',
      depot: depot_id
    };

    // Update breakdown
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) throw updateError;

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
      updated_at: new Date().toISOString()
    };

    switch (status) {
      case 'dispatched':
        breakdownStatus = 'dispatched';
        updateFields.status = breakdownStatus;
        updateFields.dispatched_at = new Date().toISOString();
        break;
      case 'on_site':
        breakdownStatus = 'on_site';
        updateFields.status = breakdownStatus;
        updateFields.on_site_at = new Date().toISOString();
        break;
      case 'repairing':
        breakdownStatus = 'in_progress';
        updateFields.status = breakdownStatus;
        break;
      case 'completed':
        breakdownStatus = 'cleared';
        updateFields.status = breakdownStatus;
        updateFields.cleared_at = new Date().toISOString();
        break;
    }

    // Update breakdown status
    const { data: breakdown, error } = await supabase
      .from('breakdowns')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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
    const { data: breakdown, error } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('breakdown_id', id)
      .single();

    if (error) throw error;

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Get assignment history from events
    const { data: events, error: eventsError } = await supabase
      .from('breakdown_events')
      .select('*')
      .eq('breakdown_id', breakdown.id)
      .eq('event_type', 'engineer_assigned')
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Format assignments
    const assignments = events?.map(event => ({
      id: event.id,
      engineer_id: event.event_data?.engineer_id,
      engineer_name: event.event_data?.engineer_name || 'Unknown',
      status: breakdown.status,
      assigned_at: event.created_at,
      arrival_at: breakdown.on_site_at,
      completed_at: breakdown.cleared_at,
      travel_time_minutes: breakdown.on_site_at && event.created_at
        ? Math.round((new Date(breakdown.on_site_at) - new Date(event.created_at)) / 60000)
        : null
    })) || [];

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
    let query = supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (depot) {
      query = query.eq('depot', depot);
    }

    const { data: breakdowns, error } = await query;
    if (error) throw error;

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
          breakdownsPerEngineer: Math.round(totalBreakdowns / 10), // Simulated
          avgJobsPerDay: Math.round(totalBreakdowns / 7) // Simulated
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
    let query = supabase
      .from('breakdowns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (depot) {
      query = query.eq('depot', depot);
    }

    const { data: breakdowns, error } = await query;
    if (error) throw error;

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
    // Get all depots
    const { data: depots, error: depotError } = await supabase
      .from('depots')
      .select('*')
      .eq('is_active', true);

    if (depotError) throw depotError;

    // Get team data for each depot
    const teams = [];

    for (const depot of depots) {
      // Get active breakdowns for this depot
      const { data: activeBreakdowns, error: breakdownError } = await supabase
        .from('breakdowns')
        .select('*')
        .eq('depot', depot.code)
        .in('status', ['active', 'pending', 'in_progress', 'dispatched', 'on_site']);

      if (breakdownError) throw breakdownError;

      // Simulated engineer data (would come from engineers table in production)
      const engineerData = {
        'WAS': { total: 5, available: 3, onSite: 2, onBreak: 0 },
        'NCL': { total: 4, available: 2, onSite: 2, onBreak: 0 },
        'CON': { total: 3, available: 1, onSite: 1, onBreak: 1 },
        'HEX': { total: 2, available: 1, onSite: 1, onBreak: 0 },
        'GTS': { total: 3, available: 2, onSite: 1, onBreak: 0 },
        'DAR': { total: 4, available: 2, onSite: 1, onBreak: 1 }
      };

      const engineers = engineerData[depot.code] || { total: 2, available: 1, onSite: 1, onBreak: 0 };

      teams.push({
        depot: depot.name,
        depotCode: depot.code,
        status: engineers.available > 0 ? 'operational' : 'limited',
        engineers: {
          total: engineers.total,
          available: engineers.available,
          onSite: engineers.onSite,
          onBreak: engineers.onBreak
        },
        workload: {
          activeBreakdowns: activeBreakdowns.length,
          criticalBreakdowns: activeBreakdowns.filter(b => b.severity === 'STOP').length,
          avgPerEngineer: engineers.total > 0
            ? Math.round(activeBreakdowns.length / engineers.total * 10) / 10 : 0
        },
        capacity: engineers.available > activeBreakdowns.length ? 'good' :
                 engineers.available >= activeBreakdowns.length / 2 ? 'moderate' : 'strained'
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

    // Update breakdown with engineer assignment
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        engineer_id: engineer_badge,
        engineer_name: engineer_name || 'Engineer',
        engineer_badge: engineer_badge,
        engineer_eta_minutes: eta_minutes || null,
        engineer_accepted_at: new Date().toISOString(),
        status: 'dispatched',
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update engineer status
    const { error: engineerError } = await supabase
      .from('engineers')
      .update({
        status: 'on_job',
        current_breakdown_id: breakdown_id,
        updated_at: new Date().toISOString()
      })
      .eq('badge_number', engineer_badge);

    if (engineerError) console.error('Error updating engineer status:', engineerError);

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
        accepted_at: breakdown.engineer_accepted_at,
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

    // Prepare update fields based on status
    let updateFields = {
      status: status === 'fixing' || status === 'testing' ? 'in_progress' : status,
      updated_at: new Date().toISOString()
    };

    // Add timestamp fields based on status
    switch (status) {
      case 'on_site':
        updateFields.engineer_on_site_at = new Date().toISOString();
        break;
      case 'fixing':
        updateFields.engineer_fixing_at = new Date().toISOString();
        break;
    }

    // Add notes if provided
    if (notes) {
      // Get existing notes first
      const { data: existing } = await supabase
        .from('breakdowns')
        .select('engineer_notes')
        .eq('breakdown_id', breakdown_id)
        .single();

      const existingNotes = existing?.engineer_notes || [];
      const newNote = {
        timestamp: new Date().toISOString(),
        engineer: engineer_badge || 'Unknown',
        note: notes,
        status: status
      };

      updateFields.engineer_notes = [...existingNotes, newNote];
    }

    // Update breakdown
    const { data: breakdown, error } = await supabase
      .from('breakdowns')
      .update(updateFields)
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (error) throw error;

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

    if (!breakdown_id || !engineer_badge || !resolution_type) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id, engineer_badge, and resolution_type are required'
      });
    }

    const validResolutionTypes = ['fixed', 'changeover', 'workshop_required', 'escalated', 'deem_safe'];
    if (!validResolutionTypes.includes(resolution_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resolution_type. Must be one of: ${validResolutionTypes.join(', ')}`
      });
    }

    // Update breakdown as completed
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'resolved',
        engineer_completed_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        resolved_by: engineer_badge,
        resolution_type: resolution_type,
        resolution_notes: resolution_notes || '',
        parts_used: parts_used || null,
        labor_hours: labor_hours || null,
        repair_category: repair_category || null,
        root_cause: root_cause || '',
        returned_to_service: returned_to_service !== false,
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update engineer status back to available
    const { error: engineerError } = await supabase
      .from('engineers')
      .update({
        status: 'available',
        current_breakdown_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('badge_number', engineer_badge);

    if (engineerError) console.error('Error updating engineer status:', engineerError);

    // Broadcast WebSocket event
    broadcastEngineeringEvent('job_completed', {
      breakdown_id,
      engineer_badge,
      engineer_name: engineerName,
      resolution_type,
      breakdown
    });

    res.json({
      success: true,
      completion: {
        breakdown_id,
        engineer_badge,
        resolution_type,
        completed_at: breakdown.engineer_completed_at,
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
    let query = supabase
      .from('breakdowns')
      .select('*')
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });

    // Apply filters
    switch (filter) {
      case 'unassigned':
        query = query.is('engineer_id', null);
        break;
      case 'my_jobs':
        if (engineer_badge) {
          query = query.eq('engineer_badge', engineer_badge);
        }
        break;
      case 'dispatched':
        query = query.eq('status', 'dispatched');
        break;
      case 'on_site':
        query = query.eq('status', 'on_site');
        break;
      case 'priority':
        query = query.or('severity.eq.STOP,wizard_decision.eq.STOP');
        break;
    }

    const { data: breakdowns, error } = await query;
    if (error) throw error;

    // Process breakdowns with calculated fields
    const jobs = (breakdowns || []).map(b => {
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
    const { data: breakdown, error } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (error) throw error;

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

    res.json({
      success: true,
      job: {
        ...breakdown,
        timeline,
        wizard_responses: breakdown.wizard_assessment_data || {},
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
    const data = breakdown.wizard_assessment_data;

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

export default router;
