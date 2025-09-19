import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

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

export default router;
