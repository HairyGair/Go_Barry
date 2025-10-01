/*
 * Engineering Team Management API
 * Manages engineer assignments, availability, and performance metrics
 */

import express from 'express';
import supabaseService from '../services/supabaseService.js';

const router = express.Router();

// Get Supabase client
async function getSupabaseClient() {
  try {
    if (!supabaseService.isInitialized) {
      await supabaseService.initialize();
    }
    return await supabaseService.getClient();
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    return null;
  }
}

// Get all engineers with current status
router.get('/engineers', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { depot_id, status, specialization } = req.query;
    
    let query = supabase
      .from('engineers')
      .select(`
        *,
        current_assignment:engineer_assignments!inner(
          breakdown_id,
          status,
          assigned_at,
          dispatched_at
        )
      `)
      .order('depot_id', { ascending: true })
      .order('name', { ascending: true });

    if (depot_id) {
      query = query.eq('depot_id', depot_id.toUpperCase());
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (specialization) {
      query = query.contains('specializations', [specialization]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Check if engineers are on shift
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const engineersWithShiftStatus = data.map(engineer => {
      const onShift = currentTime >= engineer.shift_start && currentTime <= engineer.shift_end;
      return {
        ...engineer,
        on_shift: onShift,
        available: onShift && engineer.status === 'available'
      };
    });

    res.json({
      success: true,
      engineers: engineersWithShiftStatus
    });
  } catch (error) {
    console.error('Error fetching engineers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get available engineers for a specific depot
router.get('/engineers/available/:depot_id', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { depot_id } = req.params;
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    const { data, error } = await supabase
      .from('engineers')
      .select('*')
      .eq('depot_id', depot_id.toUpperCase())
      .eq('status', 'available')
      .gte('shift_end', currentTime)
      .lte('shift_start', currentTime);

    if (error) throw error;

    res.json({
      success: true,
      available_count: data.length,
      engineers: data
    });
  } catch (error) {
    console.error('Error fetching available engineers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Assign engineer to breakdown
router.post('/assign', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { 
      breakdown_id, 
      engineer_id, 
      estimated_arrival_minutes 
    } = req.body;

    // Check if engineer is available
    const { data: engineer, error: engError } = await supabase
      .from('engineers')
      .select('*')
      .eq('engineer_id', engineer_id)
      .single();

    if (engError || !engineer) {
      throw new Error('Engineer not found');
    }

    if (engineer.status !== 'available') {
      throw new Error(`Engineer ${engineer.name} is not available (status: ${engineer.status})`);
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from('engineer_assignments')
      .insert({
        breakdown_id,
        engineer_id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignError) throw assignError;

    // Update engineer status
    await supabase
      .from('engineers')
      .update({
        status: 'busy',
        current_job_id: breakdown_id,
        updated_at: new Date().toISOString()
      })
      .eq('engineer_id', engineer_id);

    // Update breakdown with assignment
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + (estimated_arrival_minutes || 30));

    await supabase
      .from('breakdowns')
      .update({
        assigned_engineer_id: engineer_id,
        assignment_id: assignment.assignment_id,
        engineering_eta: eta.toISOString(),
        status: 'dispatched',
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id);

    res.json({
      success: true,
      assignment: {
        ...assignment,
        engineer,
        eta: eta.toISOString()
      }
    });
  } catch (error) {
    console.error('Error assigning engineer:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update engineer assignment status
router.put('/assignment/:assignment_id/status', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { assignment_id } = req.params;
    const { status, notes } = req.body;

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status
    const now = new Date().toISOString();
    switch(status) {
      case 'dispatched':
        updates.dispatched_at = now;
        break;
      case 'on_site':
        updates.arrival_at = now;
        break;
      case 'repairing':
        updates.started_repair_at = now;
        break;
      case 'completed':
        updates.completed_at = now;
        break;
    }

    if (notes) updates.notes = notes;

    const { data, error } = await supabase
      .from('engineer_assignments')
      .update(updates)
      .eq('assignment_id', assignment_id)
      .select(`
        *,
        engineer:engineers!inner(*)
      `)
      .single();

    if (error) throw error;

    // Calculate times if completed
    if (status === 'completed' && data) {
      const assigned = new Date(data.assigned_at);
      const arrived = data.arrival_at ? new Date(data.arrival_at) : null;
      const completed = new Date(data.completed_at);

      const travelTime = arrived ? Math.floor((arrived - assigned) / 60000) : null;
      const totalTime = Math.floor((completed - assigned) / 60000);

      await supabase
        .from('engineer_assignments')
        .update({
          travel_time_minutes: travelTime,
          total_time_minutes: totalTime
        })
        .eq('assignment_id', assignment_id);

      // Free up the engineer
      await supabase
        .from('engineers')
        .update({
          status: 'available',
          current_job_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', data.engineer_id);
    }

    res.json({
      success: true,
      assignment: data
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get engineering metrics by depot
router.get('/metrics/:depot_id', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { depot_id } = req.params;
    const { date } = req.query;

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get today's metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('engineering_metrics')
      .select('*')
      .eq('depot_id', depot_id.toUpperCase())
      .eq('date', targetDate)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') throw metricsError;

    // Get real-time data if no metrics found
    if (!metrics) {
      const { data: assignments, error: assignError } = await supabase
        .from('engineer_assignments')
        .select(`
          *,
          breakdown:breakdowns!inner(depot_id)
        `)
        .eq('breakdown.depot_id', depot_id.toUpperCase())
        .gte('assigned_at', targetDate + 'T00:00:00')
        .lte('assigned_at', targetDate + 'T23:59:59');

      if (assignError) throw assignError;

      const completed = assignments.filter(a => a.status === 'completed');
      const avgResponseTime = completed.length > 0
        ? Math.round(completed.reduce((sum, a) => sum + (a.travel_time_minutes || 0), 0) / completed.length)
        : 0;
      
      const slaMetCount = completed.filter(a => a.travel_time_minutes <= 30).length;
      const slaPercentage = completed.length > 0 
        ? Math.round((slaMetCount / completed.length) * 100)
        : 100;

      res.json({
        success: true,
        metrics: {
          depot_id: depot_id.toUpperCase(),
          date: targetDate,
          total_breakdowns: assignments.length,
          avg_response_time_minutes: avgResponseTime,
          sla_met: slaMetCount,
          sla_breached: completed.length - slaMetCount,
          sla_percentage: slaPercentage,
          assignments: assignments
        }
      });
    } else {
      res.json({
        success: true,
        metrics
      });
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get all depot metrics for dashboard
router.get('/metrics', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const today = new Date().toISOString().split('T')[0];

    // Get all depot metrics
    const { data: metrics, error } = await supabase
      .from('engineering_metrics')
      .select('*')
      .eq('date', today);

    if (error) throw error;

    // Get current engineer counts
    const { data: engineers, error: engError } = await supabase
      .from('engineers')
      .select('depot_id, status');

    if (engError) throw engError;

    // Group engineers by depot
    const engineersByDepot = engineers.reduce((acc, eng) => {
      if (!acc[eng.depot_id]) {
        acc[eng.depot_id] = { total: 0, available: 0, busy: 0 };
      }
      acc[eng.depot_id].total++;
      if (eng.status === 'available') acc[eng.depot_id].available++;
      if (eng.status === 'busy') acc[eng.depot_id].busy++;
      return acc;
    }, {});

    // Combine metrics with engineer counts
    const depotMetrics = {};
    const depots = ['WASHINGTON', 'RIVERSIDE', 'PERCY_MAIN', 'CONSETT', 'DEPTFORD', 'HEXHAM'];
    
    depots.forEach(depot => {
      const metric = metrics.find(m => m.depot_id === depot) || {
        depot_id: depot,
        avg_response_time_minutes: 0,
        sla_percentage: 100,
        total_breakdowns: 0
      };
      
      depotMetrics[depot] = {
        ...metric,
        engineers: engineersByDepot[depot] || { total: 0, available: 0, busy: 0 }
      };
    });

    res.json({
      success: true,
      metrics: depotMetrics
    });
  } catch (error) {
    console.error('Error fetching all metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update engineer status (for manual updates)
router.put('/engineer/:engineer_id/status', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { engineer_id } = req.params;
    const { status, notes } = req.body;

    const { data, error } = await supabase
      .from('engineers')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('engineer_id', engineer_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      engineer: data
    });
  } catch (error) {
    console.error('Error updating engineer status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get assignments for a breakdown
router.get('/breakdown/:breakdown_id/assignments', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { breakdown_id } = req.params;

    const { data, error } = await supabase
      .from('engineer_assignments')
      .select(`
        *,
        engineer:engineers!inner(*)
      `)
      .eq('breakdown_id', breakdown_id)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      assignments: data
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Auto-assign nearest available engineer
router.post('/auto-assign', async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Database connection failed');

    const { breakdown_id, depot_id, specialization_needed } = req.body;

    // Get available engineers from the depot
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    let query = supabase
      .from('engineers')
      .select('*')
      .eq('depot_id', depot_id.toUpperCase())
      .eq('status', 'available')
      .gte('shift_end', currentTime)
      .lte('shift_start', currentTime);

    if (specialization_needed) {
      query = query.contains('specializations', [specialization_needed]);
    }

    const { data: availableEngineers, error } = await query;

    if (error) throw error;

    if (!availableEngineers || availableEngineers.length === 0) {
      // Try neighboring depots
      const nearbyDepots = getNearbyDepots(depot_id);
      
      for (const nearbyDepot of nearbyDepots) {
        const { data: nearbyEngineers, error: nearbyError } = await supabase
          .from('engineers')
          .select('*')
          .eq('depot_id', nearbyDepot)
          .eq('status', 'available')
          .gte('shift_end', currentTime)
          .lte('shift_start', currentTime);

        if (!nearbyError && nearbyEngineers && nearbyEngineers.length > 0) {
          availableEngineers.push(...nearbyEngineers);
        }
      }
    }

    if (!availableEngineers || availableEngineers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No available engineers found'
      });
    }

    // Select the first available engineer (could be enhanced with location-based selection)
    const selectedEngineer = availableEngineers[0];

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from('engineer_assignments')
      .insert({
        breakdown_id,
        engineer_id: selectedEngineer.engineer_id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .select()
      .single();

    if (assignError) throw assignError;

    // Update engineer and breakdown status
    await Promise.all([
      supabase
        .from('engineers')
        .update({
          status: 'busy',
          current_job_id: breakdown_id,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', selectedEngineer.engineer_id),
      
      supabase
        .from('breakdowns')
        .update({
          assigned_engineer_id: selectedEngineer.engineer_id,
          assignment_id: assignment.assignment_id,
          engineering_eta: new Date(Date.now() + 30 * 60000).toISOString(),
          status: 'dispatched',
          updated_at: new Date().toISOString()
        })
        .eq('breakdown_id', breakdown_id)
    ]);

    res.json({
      success: true,
      assignment: {
        ...assignment,
        engineer: selectedEngineer,
        from_depot: selectedEngineer.depot_id
      }
    });
  } catch (error) {
    console.error('Error auto-assigning engineer:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function to get nearby depots
function getNearbyDepots(depot_id) {
  const depotProximity = {
    'WASHINGTON': ['RIVERSIDE', 'PERCY_MAIN'],
    'RIVERSIDE': ['WASHINGTON', 'DEPTFORD'],
    'PERCY_MAIN': ['WASHINGTON', 'RIVERSIDE'],
    'CONSETT': ['HEXHAM', 'RIVERSIDE'],
    'DEPTFORD': ['RIVERSIDE', 'PERCY_MAIN'],
    'HEXHAM': ['CONSETT']
  };
  
  return depotProximity[depot_id.toUpperCase()] || [];
}

export default router;