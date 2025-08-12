/*
 * Enhanced Breakdown Tracker API V2
 * Manages breakdown lifecycle with sequential IDs, step tracking, and pattern detection
 * Integrates with breakdown wizard and provides real-time dashboard data
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabaseService from '../services/supabaseService.js';
import fleetDatabase from '../services/fleetDatabaseService.js';
import cron from 'node-cron';

const router = express.Router();

// Get Supabase client helper
async function getSupabaseClient() {
  try {
    // Initialize if needed
    if (!supabaseService.isInitialized) {
      await supabaseService.initialize();
    }
    
    // Use the service's getClient method
    const client = await supabaseService.getClient();
    if (client) {
      return client;
    }
    
    throw new Error('Unable to get Supabase client');
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    return null;
  }
}

// Initialize Supabase on module load
(async () => {
  try {
    await supabaseService.initialize();
    console.log('✅ Supabase initialized for Breakdown Tracker V2');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase for Breakdown Tracker:', error);
  }
})();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Breakdown Tracker V2 is working',
    timestamp: new Date().toISOString()
  });
});

// Depot definitions
const VALID_DEPOTS = ['Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford', 'Hexham'];
const VALID_SUPERVISORS = ['AW001', 'AC002', 'AG003', 'CF004', 'DH005', 'JD006', 'JP007', 'SG008', 'BP009'];

// Helper to determine depot from vehicle ID
function getDepotFromVehicle(vehicleId) {
  const vehicle = fleetDatabase.getByFleetNumber(vehicleId);
  if (vehicle) {
    return fleetDatabase.getDepotFromFleetNumber(vehicleId);
  }
  // Fallback to original logic if vehicle not found
  const fleetNum = parseInt(vehicleId);
  if (fleetNum >= 5200 && fleetNum <= 5499) return 'Washington';
  if (fleetNum >= 5500 && fleetNum <= 5799) return 'Riverside';
  if (fleetNum >= 6000 && fleetNum <= 6299) return 'Percy Main';
  if (fleetNum >= 6300 && fleetNum <= 6599) return 'Consett';
  if (fleetNum >= 6900 && fleetNum <= 7199) return 'Deptford';
  if (fleetNum >= 8300 && fleetNum <= 8399) return 'Hexham';
  return 'Washington';
}

// Generate sequential breakdown ID
async function generateBreakdownId() {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      throw new Error('No Supabase client available');
    }
    
    // Try to use the database function if it exists
    const { data, error } = await client
      .rpc('get_next_breakdown_id');
    
    if (!error && data) {
      return data;
    }
    
    // Fallback: Generate ID based on count
    const { data: countData, error: countError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .like('breakdown_id', 'BD-2025-%')
      .order('breakdown_id', { ascending: false })
      .limit(1);
    
    if (!countError && countData && countData.length > 0) {
      // Extract number from last ID and increment
      const lastId = countData[0].breakdown_id;
      const lastNum = parseInt(lastId.split('-').pop()) || 0;
      return `BD-2025-${String(lastNum + 1).padStart(5, '0')}`;
    }
    
    // If no existing records, start at 1
    return 'BD-2025-00001';
    
  } catch (error) {
    console.error('Error in generateBreakdownId:', error);
    // Ultimate fallback to timestamp
    const timestamp = Date.now().toString().slice(-5);
    return `BD-2025-${timestamp}`;
  }
}

// Get next daily ID
async function getNextDailyId() {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('No Supabase client available for daily ID');
      return 1;
    }
    
    // Get today's breakdowns since 1am
    const today = new Date();
    today.setHours(1, 0, 0, 0);
    
    const { data, error } = await client
      .from('breakdowns')
      .select('daily_id')
      .gte('created_at', today.toISOString())
      .order('daily_id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error getting daily ID:', error);
      return 1;
    }
    
    return data && data.length > 0 ? (data[0].daily_id || 0) + 1 : 1;
  } catch (error) {
    console.error('Error in getNextDailyId:', error);
    return 1;
  }
}

// Check for repeat breakdowns in last 7 days
async function checkRepeatBreakdown(fleetNumber) {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('No Supabase client available for repeat check');
      return { isRepeat: false, count: 0 };
    }
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data, error } = await client
      .from('breakdowns')
      .select('breakdown_id, created_at')
      .eq('fleet_no', fleetNumber)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error checking repeat breakdowns:', error);
      return { isRepeat: false, count: 0 };
    }
    
    return {
      isRepeat: data.length > 0,
      count: data.length,
      previousBreakdownId: data.length > 0 ? data[0].breakdown_id : null,
      shouldFlag: data.length >= 3
    };
  } catch (error) {
    console.error('Error in checkRepeatBreakdown:', error);
    return { isRepeat: false, count: 0 };
  }
}

// Check if route is priority
async function checkPriorityRoute(routeNumber) {
  if (!routeNumber) return false;
  
  try {
    const client = await getSupabaseClient();
    if (!client) {
      console.error('No Supabase client available for priority check');
      // Default check for X10 and X21
      return ['X10', 'X21'].includes(routeNumber);
    }
    
    const { data, error } = await client
      .from('priority_services')
      .select('priority_level')
      .eq('route_number', routeNumber)
      .single();
    
    return !error && data && ['critical', 'secured'].includes(data.priority_level);
  } catch (error) {
    console.error('Error checking priority route:', error);
    // Default check for X10 and X21
    return ['X10', 'X21'].includes(routeNumber);
  }
}

// START NEW BREAKDOWN (Called when wizard opens)
router.post('/start', async (req, res) => {
  try {
    const {
      fleet_number,
      supervisor_badge,
      supervisor_name,
      location,
      depot_id,
      route_number,
      wizard_type
    } = req.body;

    // Validate supervisor
    if (!supervisor_badge || !VALID_SUPERVISORS.includes(supervisor_badge)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor badge'
      });
    }

    // Get Supabase client
    const client = await getSupabaseClient();
    if (!client) {
      throw new Error('No Supabase client available');
    }

    // Auto-determine depot if not provided
    const depot = depot_id || getDepotFromVehicle(fleet_number);

    // Call the Supabase function to create breakdown
    console.log('Calling create_breakdown with:', {
      fleet_number: fleet_number || null,
      supervisor_badge,
      supervisor_name: supervisor_name || null,
      location: location || null,
      depot_id: depot || 'Washington',
      wizard_type: wizard_type || 'general'
    });

    const { data: result, error: rpcError } = await client
      .rpc('create_breakdown', {
        p_fleet_number: fleet_number || null,
        p_supervisor_badge: supervisor_badge,
        p_supervisor_name: supervisor_name || null,
        p_location: location || null,
        p_depot_id: depot || 'Washington',
        p_wizard_type: wizard_type || 'general'
      });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create breakdown record',
        details: rpcError.message
      });
    }

    if (!result || !result.success) {
      console.error('Unexpected result:', result);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create breakdown record'
      });
    }

    // Check for repeat breakdowns
    const repeatCheck = await checkRepeatBreakdown(fleet_number);
    
    // Check if priority route
    const isPriority = await checkPriorityRoute(route_number);

    // Update the record with additional info if needed
    if (route_number || isPriority || repeatCheck.isRepeat) {
      await client
        .from('breakdowns')
        .update({
          route_id: route_number || null,
          is_priority: isPriority,
          repeat_breakdown: repeatCheck.isRepeat,
          previous_breakdown_id: repeatCheck.previousBreakdownId
        })
        .eq('breakdown_id', result.breakdown_id);
    }

    // Log initial wizard step
    await client
      .from('breakdowns')
      .update({
        wizard_steps: JSON.stringify([{
          type: 'wizard_opened',
          timestamp: new Date().toISOString(),
          data: { wizard_type: wizard_type || 'general', fleet_number }
        }])
      })
      .eq('breakdown_id', result.breakdown_id);

    res.json({
      success: true,
      breakdown_id: result.breakdown_id,
      daily_id: result.daily_id,
      message: 'Breakdown started successfully',
      data: {
        breakdown_id: result.breakdown_id,
        daily_id: result.daily_id,
        fleet_number,
        supervisor_badge,
        supervisor_name,
        depot_id: depot,
        repeat_warning: repeatCheck.shouldFlag ? 
          `⚠️ Fleet ${fleet_number} has broken down ${repeatCheck.count} times in 7 days` : null
      }
    });

  } catch (error) {
    console.error('Error starting breakdown:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// LOG WIZARD STEP
router.post('/step', async (req, res) => {
  try {
    const {
      breakdown_id,
      step_type,
      step_data,
      timestamp
    } = req.body;

    if (!breakdown_id || !step_type) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id and step_type required'
      });
    }

    // Get current breakdown
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data: breakdown, error: fetchError } = await client
      .from('breakdowns')
      .select('wizard_steps')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Parse existing steps
    let steps = [];
    try {
      steps = JSON.parse(breakdown.wizard_steps || '[]');
    } catch (e) {
      steps = [];
    }

    // Add new step
    steps.push({
      type: step_type,
      timestamp: timestamp || new Date().toISOString(),
      data: step_data || {}
    });

    // Update breakdown with new step
    const { error: updateError } = await client
      .from('breakdowns')
      .update({
        wizard_steps: JSON.stringify(steps),
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id);

    if (updateError) {
      console.error('Error updating wizard steps:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to log step'
      });
    }

    res.json({
      success: true,
      message: 'Step logged successfully',
      total_steps: steps.length
    });

  } catch (error) {
    console.error('Error logging step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// MARK AS DIAGNOSED (Start timer)
router.post('/diagnose', async (req, res) => {
  try {
    const {
      breakdown_id,
      diagnosis,
      severity,
      passenger_cloud_required
    } = req.body;

    if (!breakdown_id) {
      return res.status(400).json({
        success: false,
        error: 'breakdown_id required'
      });
    }

    const diagnosedAt = new Date().toISOString();

    // Update breakdown status to diagnosed
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { error: updateError } = await client
      .from('breakdowns')
      .update({
        status: 'diagnosed',
        diagnosed_at: diagnosedAt,
        severity: severity || 'AMBER',
        passenger_cloud_used: passenger_cloud_required || false,
        updated_at: diagnosedAt
      })
      .eq('breakdown_id', breakdown_id);

    if (updateError) {
      console.error('Error updating diagnosis:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update diagnosis'
      });
    }

    res.json({
      success: true,
      message: 'Breakdown diagnosed - timer started',
      diagnosed_at: diagnosedAt
    });

  } catch (error) {
    console.error('Error in diagnose:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// RESOLVE BREAKDOWN
router.put('/:breakdown_id/resolve', async (req, res) => {
  try {
    const { breakdown_id } = req.params;
    const {
      resolution_notes,
      resolving_supervisor,
      returned_to_service
    } = req.body;

    const resolvedAt = new Date().toISOString();

    // Calculate total duration if diagnosed_at exists
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data: breakdown, error: fetchError } = await client
      .from('breakdowns')
      .select('diagnosed_at')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    let totalDuration = null;
    if (breakdown.diagnosed_at) {
      const diagnosedTime = new Date(breakdown.diagnosed_at);
      const resolvedTime = new Date(resolvedAt);
      totalDuration = Math.round((resolvedTime - diagnosedTime) / 60000); // minutes
    }

    // Update breakdown
    const updateData = {
      status: 'resolved',
      resolved_at: resolvedAt,
      resolution_notes,
      resolving_supervisor: resolving_supervisor || null,
      total_duration_minutes: totalDuration,
      updated_at: resolvedAt
    };

    if (returned_to_service) {
      updateData.returned_to_service_at = resolvedAt;
    }

    const { error: updateError } = await client
      .from('breakdowns')
      .update(updateData)
      .eq('breakdown_id', breakdown_id);

    if (updateError) {
      console.error('Error resolving breakdown:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve breakdown'
      });
    }

    res.json({
      success: true,
      message: 'Breakdown resolved',
      duration_minutes: totalDuration
    });

  } catch (error) {
    console.error('Error resolving breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET LIVE/ACTIVE BREAKDOWNS
router.get('/live', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data, error } = await client
      .from('breakdowns')
      .select('*')
      .in('status', ['started', 'diagnosed', 'in_progress'])
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching live breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch breakdowns'
      });
    }

    // Check for auto-escalation (30+ minutes since diagnosis)
    const now = new Date();
    const breakdownsWithEscalation = data.map(breakdown => {
      if (breakdown.diagnosed_at && !breakdown.auto_escalated) {
        const diagnosedTime = new Date(breakdown.diagnosed_at);
        const minutesSince = Math.round((now - diagnosedTime) / 60000);
        
        if (minutesSince > 30) {
          // Auto-escalate
          client
            .from('breakdowns')
            .update({
              auto_escalated: true,
              escalated_at: now.toISOString()
            })
            .eq('breakdown_id', breakdown.breakdown_id)
            .then(() => console.log(`Auto-escalated breakdown ${breakdown.breakdown_id}`));
          
          return {
            ...breakdown,
            auto_escalated: true,
            minutes_since_diagnosis: minutesSince
          };
        }
      }
      
      return {
        ...breakdown,
        minutes_since_diagnosis: breakdown.diagnosed_at ? 
          Math.round((now - new Date(breakdown.diagnosed_at)) / 60000) : null
      };
    });

    res.json({
      success: true,
      breakdowns: breakdownsWithEscalation,
      total: data.length
    });

  } catch (error) {
    console.error('Error in live breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET TODAY'S BREAKDOWNS (since 1am)
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(1, 0, 0, 0);

    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data, error } = await client
      .from('breakdowns')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('daily_id', { ascending: true });

    if (error) {
      console.error('Error fetching today\'s breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch breakdowns'
      });
    }

    res.json({
      success: true,
      breakdowns: data,
      total: data.length
    });

  } catch (error) {
    console.error('Error in today\'s breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET FLEET HISTORY (last 7 days)
router.get('/fleet/:fleetNumber/history', async (req, res) => {
  try {
    const { fleetNumber } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data, error } = await client
      .from('breakdowns')
      .select('*')
      .eq('fleet_no', fleetNumber)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fleet history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch history'
      });
    }

    res.json({
      success: true,
      fleet_number: fleetNumber,
      breakdowns: data,
      count: data.length,
      should_flag: data.length >= 3
    });

  } catch (error) {
    console.error('Error in fleet history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE BREAKDOWN (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_badge, reason } = req.body;

    // Check if admin
    if (!['AG003', 'BP009'].includes(supervisor_badge)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // Soft delete (mark as archived)
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { error } = await client
      .from('breakdowns')
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        resolution_notes: `Deleted by ${supervisor_badge}: ${reason || 'No reason provided'}`
      })
      .eq('breakdown_id', id);

    if (error) {
      console.error('Error deleting breakdown:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete breakdown'
      });
    }

    res.json({
      success: true,
      message: 'Breakdown archived successfully'
    });

  } catch (error) {
    console.error('Error deleting breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// CRON JOB - Reset daily counter at 1am
cron.schedule('0 1 * * *', async () => {
  console.log('Resetting daily breakdown counter...');
  try {
    const client = await getSupabaseClient();
    if (client) {
      await client.rpc('reset_breakdown_daily_counter');
      console.log('Daily counter reset successfully');
    } else {
      console.error('Could not get Supabase client for counter reset');
    }
  } catch (error) {
    console.error('Error resetting daily counter:', error);
  }
});

// CRON JOB - Archive old breakdowns at 2am
cron.schedule('0 2 * * *', async () => {
  console.log('Archiving old breakdowns...');
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const client = await getSupabaseClient();
    if (!client) {
      console.error('Could not get Supabase client for archiving');
      return;
    }
    
    const { error } = await client
      .from('breakdowns')
      .update({
        archived: true,
        archived_at: new Date().toISOString()
      })
      .eq('archived', false)
      .eq('status', 'resolved')
      .lt('resolved_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error archiving breakdowns:', error);
    } else {
      console.log('Old breakdowns archived successfully');
    }
  } catch (error) {
    console.error('Error in archive job:', error);
  }
});

export default router;
