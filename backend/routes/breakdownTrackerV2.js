/*
 * Enhanced Breakdown Tracker API V2
 * Manages breakdown lifecycle with sequential IDs, step tracking, and pattern detection
 * Integrates with breakdown wizard and provides real-time dashboard data
 * 
 * STATUS VALUES (Database Constraint):
 * - received: Initial breakdown report
 * - acknowledged: SDC has acknowledged the breakdown
 * - decision: Supervisor has made STOP/AMBER/CONTINUE decision (timer starts)
 * - dispatched: Engineer dispatched (if needed)
 * - on_site: Engineer on site
 * - moving: Vehicle moving (under own power or being recovered)
 * - cleared: Breakdown resolved, service restored
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

// Dashboard endpoint
router.get('/dashboard', (req, res) => {
  const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Go North East - Breakdown Tracker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f3f4f6;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #dc2626 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            font-size: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .stats {
            display: flex;
            gap: 20px;
            padding: 20px;
        }
        .stat-card {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            flex: 1;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1e3a8a;
        }
        .stat-label {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .container {
            padding: 20px;
        }
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 15px;
        }
        .breakdown-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.2s;
        }
        .breakdown-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .card-header {
            padding: 15px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .fleet-number {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
        }
        .depot-badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .card-body {
            padding: 15px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-label {
            color: #6b7280;
        }
        .info-value {
            color: #111827;
            font-weight: 500;
        }
        .card-actions {
            padding: 15px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-primary:hover {
            background: #2563eb;
        }
        .btn-success {
            background: #10b981;
            color: white;
        }
        .btn-success:hover {
            background: #059669;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-received { background: #fef3c7; color: #92400e; }
        .status-decision { background: #fed7aa; color: #9a3412; }
        .status-cleared { background: #d1fae5; color: #065f46; }
        .timer {
            color: #dc2626;
            font-weight: bold;
            font-size: 16px;
            margin-top: 10px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Go North East - Live Breakdown Tracker</h1>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value" id="total-count">0</div>
            <div class="stat-label">Active Breakdowns</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="pending-count">0</div>
            <div class="stat-label">Awaiting Decision</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="decision-count">0</div>
            <div class="stat-label">Decision Made</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="today-count">0</div>
            <div class="stat-label">Today's Total</div>
        </div>
    </div>
    
    <div class="container">
        <div id="breakdown-grid" class="breakdown-grid">
            <div class="loading">Loading breakdowns...</div>
        </div>
    </div>

    <script>
        const API_URL = window.location.origin;
        
        async function loadBreakdowns() {
            try {
                const response = await fetch(\`\${API_URL}/api/breakdowns/live\`);
                const data = await response.json();
                
                if (data.success) {
                    displayBreakdowns(data.breakdowns);
                    updateStats(data.breakdowns);
                }
            } catch (error) {
                console.error('Error loading breakdowns:', error);
                document.getElementById('breakdown-grid').innerHTML = 
                    '<div class="loading">Error loading breakdowns. Check console.</div>';
            }
        }
        
        function displayBreakdowns(breakdowns) {
            const grid = document.getElementById('breakdown-grid');
            
            if (breakdowns.length === 0) {
                grid.innerHTML = '<div class="loading">No active breakdowns 🎉</div>';
                return;
            }
            
            grid.innerHTML = breakdowns.map(b => \`
                <div class="breakdown-card">
                    <div class="card-header">
                        <span class="fleet-number">Fleet \${b.fleet_number || b.fleet_no || 'Unknown'}</span>
                        <span class="depot-badge">\${b.depot_id || 'Unknown Depot'}</span>
                    </div>
                    <div class="card-body">
                        <div class="info-row">
                            <span class="info-label">Breakdown ID:</span>
                            <span class="info-value">\${b.breakdown_id || 'Pending'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Location:</span>
                            <span class="info-value">\${b.location || 'Not specified'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Supervisor:</span>
                            <span class="info-value">\${b.supervisor_name || b.supervisor_badge}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Wizard Type:</span>
                            <span class="info-value">\${b.wizard_type || 'General'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="status-badge status-\${b.status}">\${b.status.toUpperCase()}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Severity:</span>
                            <span class="info-value">\${b.severity || 'PENDING'}</span>
                        </div>
                        \${b.minutes_since_diagnosis ? 
                            \`<div class="timer">⏱️ \${b.minutes_since_diagnosis} minutes since decision</div>\` : 
                            ''
                        }
                    </div>
                    <div class="card-actions">
                        \${b.status === 'received' ? 
                            \`<button class="btn btn-primary" onclick="makeDecision('\${b.breakdown_id}')">
                                Make Decision
                            </button>\` : ''
                        }
                        <button class="btn btn-success" onclick="clearBreakdown('\${b.breakdown_id}')">
                            Clear Breakdown
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        function updateStats(breakdowns) {
            document.getElementById('total-count').textContent = breakdowns.length;
            document.getElementById('pending-count').textContent = 
                breakdowns.filter(b => b.status === 'received').length;
            document.getElementById('decision-count').textContent = 
                breakdowns.filter(b => b.status === 'decision').length;
            
            // Count today's breakdowns
            const today = new Date().toDateString();
            const todayCount = breakdowns.filter(b => 
                new Date(b.created_at).toDateString() === today
            ).length;
            document.getElementById('today-count').textContent = todayCount;
        }
        
        async function makeDecision(breakdownId) {
            const severity = prompt('Enter severity (STOP/AMBER/CONTINUE):', 'AMBER');
            if (!severity) return;
            
            const diagnosis = prompt('Enter diagnosis:', 'Issue identified');
            if (!diagnosis) return;
            
            try {
                const response = await fetch(\`\${API_URL}/api/breakdowns/diagnose\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        breakdown_id: breakdownId,
                        diagnosis: diagnosis,
                        severity: severity.toUpperCase()
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Decision recorded successfully');
                    loadBreakdowns();
                } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error making decision:', error);
                alert('Failed to make decision');
            }
        }
        
        async function clearBreakdown(breakdownId) {
            const notes = prompt('Resolution notes:', 'Issue resolved');
            if (!notes) return;
            
            try {
                const response = await fetch(\`\${API_URL}/api/breakdowns/\${breakdownId}/resolve\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resolution_notes: notes,
                        resolving_supervisor: 'AG003',
                        returned_to_service: true
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert('Breakdown cleared successfully');
                    loadBreakdowns();
                } else {
                    alert('Error: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error clearing breakdown:', error);
                alert('Failed to clear breakdown');
            }
        }
        
        // Load breakdowns on page load
        loadBreakdowns();
        
        // Auto-refresh every 10 seconds
        setInterval(loadBreakdowns, 10000);
    </script>
</body>
</html>
  `;
  res.send(dashboardHTML);
});

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
      console.error('Error fetching breakdown:', fetchError);
      console.error('Breakdown ID:', breakdown_id);
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
        details: fetchError ? fetchError.message : 'No breakdown found'
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
        status: 'decision',  // Changed from 'diagnosed' to match DB constraint
        diagnosed_at: diagnosedAt,
        severity: severity || 'AMBER',
        passenger_cloud_used: passenger_cloud_required || false,
        updated_at: diagnosedAt
      })
      .eq('breakdown_id', breakdown_id);

    if (updateError) {
      console.error('Error updating diagnosis:', updateError);
      console.error('Update attempted with:', {
        breakdown_id,
        status: 'decision',
        diagnosed_at: diagnosedAt,
        severity: severity || 'AMBER'
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to update diagnosis',
        details: updateError.message
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

    console.log('Resolving breakdown:', breakdown_id);
    console.log('Request body:', req.body);

    const resolvedAt = new Date().toISOString();

    // Get breakdown to check if it exists
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    const { data: breakdown, error: fetchError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .eq('breakdown_id', breakdown_id)
      .single();

    if (fetchError || !breakdown) {
      console.error('Resolve error - fetchError:', fetchError);
      console.error('Resolve error - breakdown_id:', breakdown_id);
      console.error('Resolve error - breakdown found:', !!breakdown);
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found',
        details: fetchError ? fetchError.message : 'No breakdown found'
      });
    }

    // Update breakdown (removed total_duration_minutes as it's a generated column)
    const updateData = {
      status: 'cleared',  // Changed from 'resolved' to match DB constraint
      resolved_at: resolvedAt,
      resolution_notes,
      resolving_supervisor: resolving_supervisor || null,
      // total_duration_minutes is GENERATED - don't update it
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
      console.error('Update data:', updateData);
      console.error('Breakdown ID:', breakdown_id);
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve breakdown',
        details: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Breakdown resolved',
      resolved_at: resolvedAt
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
    
    // Simple query - just get all breakdowns that aren't cleared
    const { data, error } = await client
      .from('breakdowns')
      .select('*')
      .neq('status', 'cleared')
      .order('created_at', { ascending: false });
    
    // Filter out archived and ensure status is valid in JavaScript
    const activeBreakdowns = data ? data.filter(b => 
      b.archived !== true && 
      b.status !== 'cleared'
    ) : [];

    if (error) {
      console.error('Error fetching live breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch breakdowns'
      });
    }

    // Check for auto-escalation (30+ minutes since diagnosis)
    const now = new Date();
    const breakdownsWithEscalation = activeBreakdowns.map(breakdown => {
      if (breakdown.diagnosed_at && !breakdown.auto_escalated) {
        const diagnosedTime = new Date(breakdown.diagnosed_at);
        const minutesSince = Math.round((now - diagnosedTime) / 60000);
        
        if (minutesSince > 30) {
          // Auto-escalate (30+ minutes since decision was made)
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
      total: breakdownsWithEscalation.length
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
// GET BREAKDOWN STATISTICS
router.get('/stats', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable'
      });
    }
    
    // Get active breakdowns count
    const { data: activeBreakdowns, error: activeError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .in('status', ['received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving'])
      .neq('status', 'cleared')
      .neq('archived', true);
    
    if (activeError) {
      console.error('Error fetching active breakdowns:', activeError);
    }
    
    // Get today's breakdown count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayBreakdowns, error: todayError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .gte('created_at', todayStart.toISOString())
      .neq('archived', true);
    
    if (todayError) {
      console.error('Error fetching today breakdowns:', todayError);
    }
    
    // Get overdue count (decision made more than 30 mins ago, still not cleared)
    const thirtyMinsAgo = new Date();
    thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    
    const { data: overdueBreakdowns, error: overdueError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .eq('status', 'decision')
      .lte('decision_time', thirtyMinsAgo.toISOString())
      .neq('archived', true);
    
    if (overdueError) {
      console.error('Error fetching overdue breakdowns:', overdueError);
    }
    
    // Get critical breakdowns (safety-related)
    const { data: criticalBreakdowns, error: criticalError } = await client
      .from('breakdowns')
      .select('breakdown_id')
      .in('diagnosis', ['STOP', 'Safety Critical'])
      .neq('status', 'cleared')
      .neq('archived', true);
    
    if (criticalError) {
      console.error('Error fetching critical breakdowns:', criticalError);
    }
    
    const stats = {
      active: activeBreakdowns?.length || 0,
      today: todayBreakdowns?.length || 0,
      overdue: overdueBreakdowns?.length || 0,
      critical: criticalBreakdowns?.length || 0,
      demo_mode: false // Indicate this is real data
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error getting breakdown stats:', error);
    
    // Return demo data if database fails
    res.json({
      active: Math.floor(Math.random() * 8),
      today: Math.floor(Math.random() * 20 + 10),
      overdue: Math.floor(Math.random() * 5),
      critical: Math.floor(Math.random() * 3),
      demo_mode: true
    });
  }
});

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
      .eq('status', 'cleared')  // Changed from 'resolved' to match DB constraint
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

// GET /api/breakdowns/active - Get active breakdowns
router.get('/active', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable',
        breakdowns: []
      });
    }
    
    const { data: breakdowns, error } = await client
      .from('breakdowns')
      .select('*')
      .in('status', ['received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving'])
      .neq('archived', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch active breakdowns',
        breakdowns: []
      });
    }
    
    res.json({
      success: true,
      breakdowns: breakdowns || [],
      count: breakdowns?.length || 0
    });
    
  } catch (error) {
    console.error('Error fetching active breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      breakdowns: []
    });
  }
});

// GET /api/breakdowns/overdue - Get overdue breakdowns
router.get('/overdue', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable',
        breakdowns: []
      });
    }
    
    // Breakdowns older than 1 hour without resolution
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: breakdowns, error } = await client
      .from('breakdowns')
      .select('*')
      .neq('status', 'cleared')
      .neq('archived', true)
      .lt('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching overdue breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch overdue breakdowns',
        breakdowns: []
      });
    }
    
    res.json({
      success: true,
      breakdowns: breakdowns || [],
      count: breakdowns?.length || 0
    });
    
  } catch (error) {
    console.error('Error fetching overdue breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      breakdowns: []
    });
  }
});

// GET /api/breakdowns/critical - Get critical breakdowns
router.get('/critical', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'Database connection unavailable',
        breakdowns: []
      });
    }
    
    const { data: breakdowns, error } = await client
      .from('breakdowns')
      .select('*')
      .eq('severity', 'STOP')
      .neq('status', 'cleared')
      .neq('archived', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching critical breakdowns:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch critical breakdowns',
        breakdowns: []
      });
    }
    
    res.json({
      success: true,
      breakdowns: breakdowns || [],
      count: breakdowns?.length || 0
    });
    
  } catch (error) {
    console.error('Error fetching critical breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      breakdowns: []
    });
  }
});

// DEBUG endpoint to check environment variables (TEMPORARY - REMOVE IN PRODUCTION)
router.get('/debug/env', async (req, res) => {
  try {
    const client = await getSupabaseClient();
    
    res.json({
      success: true,
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
        hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
        hasSupabaseRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
        clientAvailable: !!client,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseAnon: !!process.env.SUPABASE_ANON_KEY,
        hasSupabaseService: !!process.env.SUPABASE_SERVICE_KEY,
        hasSupabaseRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  }
});

export default router;
