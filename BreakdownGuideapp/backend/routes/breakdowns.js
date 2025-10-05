import express from 'express';
import { supabase } from '../server.js';
import breakdownIdGenerator from '../services/breakdownIdGenerator.js';
import { activityLogger } from '../services/activityLogger.js';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

// GET /api/breakdowns - Get all breakdowns with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, depot } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (depot) {
      query = query.eq('depot', depot);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
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
    const { data, error } = await supabase
      .from('breakdowns')
      .select('*')
      .in('status', ['active', 'pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching active breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch active breakdowns' });
  }
});

// GET /api/breakdowns/live - Get active breakdowns for dashboards
router.get('/live', async (req, res) => {
  try {
    // Query from breakdowns table only (joins will be added once foreign keys are set up)
    // Get all breakdowns, then filter in JavaScript for more reliable results
    const { data: allBreakdowns, error } = await supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 /live endpoint: Found ${allBreakdowns?.length || 0} total breakdowns in database`);
    if (allBreakdowns && allBreakdowns.length > 0) {
      console.log('📋 Breakdown statuses:', allBreakdowns.map(b => `${b.breakdown_id}: ${b.status}`));
    }

    // Filter out resolved/completed breakdowns
    const breakdowns = allBreakdowns.filter(b =>
      !['resolved', 'deleted', 'cancelled', 'completed'].includes(b.status)
    );

    console.log(`✅ /live endpoint: Returning ${breakdowns.length} active breakdowns after filtering`);

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

      // Vehicle and supervisor data will come from the breakdown record itself

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
        `${b.fleet_no || 'Unknown'} - ${b.issue_category || 'Assessment Required'}`;

      return {
        // Core identifiers
        breakdown_id: b.breakdown_id,
        id: b.breakdown_id,

        // Vehicle information
        fleet_no: b.fleet_no,
        fleet_number: b.fleet_no,
        registration: b.registration,
        depot_id: b.depot,

        // Location and issue information
        location: b.location_description || b.location || 'Location TBC',
        issue_type: b.issue_category,
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

        // Route and priority
        route_id: b.route || null,
        route: b.route || null,
        route_number: b.route || null,
        route_name: b.route_name || null,
        service: b.route || null,
        is_priority: priorityLevel <= 2 || b.secured_mileage,
        priority_level: priorityLevel,

        // Supervisor information
        supervisor_badge: b.supervisor_badge,
        supervisor_name: b.supervisor_name,

        // Dashboard card information
        card_title: cardTitle,
        status_color: statusColor,
        requires_immediate_action: b.requires_immediate_action || (b.severity === 'STOP') || (priorityLevel <= 2) || b.secured_mileage,

        // Operational flags
        secured_mileage: b.secured_mileage || false,

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

    const { data, error } = await supabase
      .from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString());

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
    const { data, error } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
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
      created_at: new Date().toISOString(),
      status: req.body.status || 'received'
    };

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdownData)
      .select()
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

    res.status(201).json({
      ...data,
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
    const { data, error } = await supabase
      .from('breakdowns')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating breakdown:', error);
    res.status(500).json({ error: 'Failed to update breakdown' });
  }
});

// PATCH /api/breakdowns/:id/status - Update breakdown status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('breakdowns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
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

    const { data, error } = await supabase
      .from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString());

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
    const { count } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00.000Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);
    
    const nextNumber = (count || 0) + 1;
    const nextId = `BD-${year}-${nextNumber.toString().padStart(5, '0')}`;
    
    res.json({
      next_id: nextId,
      current_count: count || 0,
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
      const { data } = await supabase
        .from('breakdowns')
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
    const { data, error } = await supabase
      .from('breakdowns')
      .update({
        status: 'cleared',
        cleared_at: new Date().toISOString(),
        resolution_notes,
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create an event log
    const { error: eventError } = await supabase
      .from('breakdown_events')
      .insert({
        breakdown_id: data.id,
        event_type: 'resolved',
        event_data: {
          resolution_notes,
          resolving_supervisor,
          returned_to_service,
          resolved_at: new Date().toISOString()
        }
      });

    if (eventError) console.error('Error creating event:', eventError);

    res.json({
      success: true,
      breakdown: data,
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
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'dispatched',
        dispatched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        error: 'Breakdown not found'
      });
    }

    // Create event log for dispatch
    const { error: eventError } = await supabase
      .from('breakdown_events')
      .insert({
        breakdown_id: breakdown.id,
        event_type: 'engineer_dispatched',
        event_data: {
          engineer_id,
          engineer_name,
          estimated_arrival_minutes,
          dispatch_notes,
          dispatching_supervisor,
          dispatched_at: new Date().toISOString()
        }
      });

    if (eventError) console.error('Error creating dispatch event:', eventError);

    // Calculate ETA
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + (estimated_arrival_minutes || 30));

    res.json({
      success: true,
      breakdown: {
        ...breakdown,
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
    const { data: breakdown, error: breakdownError } = await supabase
      .from('breakdowns')
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
    const { data: events, error: eventsError } = await supabase
      .from('breakdown_events')
      .select('*')
      .eq('breakdown_id', breakdown.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventsError) throw eventsError;

    // Format activities
    const activities = events.map(event => ({
      id: event.id,
      type: event.event_type,
      timestamp: event.created_at,
      description: formatEventDescription(event),
      data: event.event_data,
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
    const { data: breakdown, error: breakdownError } = await supabase
      .from('breakdowns')
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
    const { data: event, error: eventError } = await supabase
      .from('breakdown_events')
      .insert({
        breakdown_id: breakdown.id,
        event_type: activity_type || 'comment',
        event_data: {
          description,
          user_name,
          metadata,
          created_at: new Date().toISOString()
        }
      })
      .select()
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
        data: event.event_data
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
  const data = event.event_data || {};

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
      secured_mileage = false
    } = req.body;

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

    // Create the breakdown record with only fields that exist in the database
    const breakdownData = {
      breakdown_id: idResult.id,
      fleet_no: fleet_number,
      supervisor_badge: supervisor_badge,
      supervisor_name: supervisor_name,
      location: location,
      route: route || service || null,
      route_name: route_name || null,
      issue_category: issue_category,
      description: issue_description || 'Wizard assessment completed',
      status: 'active',
      severity: determinedSeverity,
      wizard_decision: wizard_decision,
      wizard_type: wizard_type,
      wizard_assessment_data: wizard_assessment_data || {},
      breakdown_source: 'wizard',
      priority_level: determinedPriority,
      engineering_required: engineering_required,
      replacement_vehicle_required: replacement_vehicle_required,
      secured_mileage: secured_mileage,
      created_at: new Date().toISOString()
    };

    // Add coordinates if provided
    if (location_coords && location_coords.lat && location_coords.lng) {
      breakdownData.location_lat = location_coords.lat;
      breakdownData.location_lng = location_coords.lng;
    }

    console.log('🔍 Attempting to insert breakdown data:', JSON.stringify(breakdownData, null, 2));

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdownData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database insert error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    // Create initial event log
    await supabase
      .from('breakdown_events')
      .insert({
        breakdown_id: data.id,
        event_type: 'wizard_assessment_completed',
        event_data: {
          wizard_type,
          wizard_decision,
          assessment_data: wizard_assessment_data,
          supervisor_badge,
          supervisor_name
        }
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

    // Broadcast breakdown creation to all connected WebSocket clients
    try {
      const broadcastData = {
        type: 'breakdown_created',
        breakdown_id: data.breakdown_id,
        breakdown: data,
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
      console.log(`📡 Broadcasted breakdown ${data.breakdown_id} creation to WebSocket clients`);
    } catch (broadcastError) {
      console.error('⚠️ Failed to broadcast breakdown creation:', broadcastError);
      // Don't fail the main request if broadcast fails
    }

    res.status(201).json({
      success: true,
      breakdown_id: data.breakdown_id,
      breakdown: data,
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

    const { data: cards, error } = await supabase
      .from('breakdown_dashboard_cards')
      .select(`
        *,
        breakdowns!breakdown_id (
          breakdown_id,
          status,
          severity,
          created_at,
          updated_at,
          wizard_type,
          wizard_decision
        )
      `)
      .eq(visibilityField, true)
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

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
      breakdown_status: card.breakdowns?.status,
      wizard_type: card.breakdowns?.wizard_type,
      wizard_decision: card.breakdowns?.wizard_decision,

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
    const cardUpdates = req.body;

    const { data, error } = await supabase
      .from('breakdown_dashboard_cards')
      .update({
        ...cardUpdates,
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('breakdown_id', breakdown_id)
      .select()
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
    const { data: currentBreakdown, error: fetchError } = await supabase
      .from('breakdowns')
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

    const resolvedAt = new Date().toISOString();
    const resolvingUser = resolved_by || supervisor_badge || req.supervisor?.name || 'System';

    // Update breakdown status to resolved
    // Note: Only updating fields that exist in the database schema
    const { data: breakdown, error: updateError } = await supabase
      .from('breakdowns')
      .update({
        status: 'resolved',
        resolved_at: resolvedAt,
        resolved_by: resolvingUser,
        resolution_notes: resolution_notes || '',
        resolution_type: resolution_type || 'fixed',
        returned_to_service: returned_to_service
      })
      .eq('breakdown_id', breakdown_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating breakdown resolution:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update breakdown resolution',
        code: 'UPDATE_ERROR'
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

    // Broadcast to WebSocket clients
    const resolveData = {
      type: 'breakdown_resolved',
      breakdown_id: breakdown_id,
      breakdown: breakdown,
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
      breakdown: breakdown,
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