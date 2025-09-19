import express from 'express';
import { supabase } from '../server.js';
import breakdownIdGenerator from '../services/breakdownIdGenerator.js';

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
    // Use the enhanced view that includes all relevant data
    const { data: breakdowns, error } = await supabase
      .from('sdc_dashboard_breakdowns')
      .select('*')
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Additional processing for dashboard compatibility
    const formattedBreakdowns = breakdowns.map(b => {
      const elapsedMinutes = b.elapsed_minutes || 0;
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = Math.floor(elapsedMinutes % 60);

      let durationText = '';
      if (elapsedHours > 0) {
        durationText = `${elapsedHours}h ${remainingMinutes}m`;
      } else {
        durationText = `${remainingMinutes}m`;
      }

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
        location: b.location,
        issue_type: b.issue_category,
        issue_description: b.issue_description,

        // Status and severity
        status: b.status,
        severity: b.severity,
        wizard_decision: b.wizard_decision,
        criticality: b.criticality,

        // Timing information
        created_at: b.created_at,
        updated_at: b.updated_at,
        elapsed_minutes: elapsedMinutes,
        duration_text: durationText,

        // Route and priority
        route_id: null, // Will be added if we have route data
        is_priority: b.priority_level <= 2,
        priority_level: b.priority_level,

        // Supervisor information
        supervisor_badge: b.supervisor_badge,
        supervisor_name: b.supervisor_name,

        // Dashboard card information
        card_title: b.card_title,
        status_color: b.status_color,
        requires_immediate_action: b.requires_immediate_action,

        // Legacy compatibility fields
        driver_name: null,
        driver_phone: null,
        passenger_count: null,
        received_at: b.created_at,
        acknowledged_at: null,
        decision_at: null,
        dispatched_at: null,
        on_site_at: null,
        cleared_at: null
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
      status: req.body.status || 'active',
      generation_metadata: {
        sequence: idResult.sequence,
        date: idResult.date,
        timestamp: idResult.timestamp,
        fallback: idResult.fallback || false
      }
    };

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdownData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...data,
      id_generation: {
        breakdown_id: idResult.id,
        sequence_number: idResult.sequence,
        generation_date: idResult.date
      }
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

// GET /api/breakdowns/stats - Get breakdown statistics (alias)
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

      // Supervisor information
      supervisor_badge,
      supervisor_name,

      // Issue details
      issue_category,
      issue_description,
      severity,

      // Additional context
      priority_level = 3,
      engineering_required = false,
      replacement_vehicle_required = false
    } = req.body;

    // Generate unique breakdown ID
    const idResult = await breakdownIdGenerator.generateId();

    // Determine severity if not provided
    const determinedSeverity = severity || wizard_decision || 'AMBER';

    // Determine priority based on severity and wizard decision
    const determinedPriority = priority_level || (
      determinedSeverity === 'STOP' ? 1 :
      determinedSeverity === 'AMBER' ? 2 : 3
    );

    // Create the breakdown record
    const breakdownData = {
      breakdown_id: idResult.id,

      // Wizard data
      wizard_type,
      wizard_decision: wizard_decision || determinedSeverity,
      wizard_assessment_data,
      wizard_started_at: new Date().toISOString(),
      wizard_completed_at: new Date().toISOString(),

      // Vehicle and location
      fleet_number,
      location_description: location,
      w3w_location,

      // Supervisor
      reported_by_badge: supervisor_badge,
      reported_by_name: supervisor_name,

      // Issue details
      issue_category: issue_category || 'General Assessment',
      issue_description: issue_description || `${wizard_type} assessment completed with ${wizard_decision} decision`,
      severity: determinedSeverity,

      // Status and priority
      status: 'received',
      priority_level: determinedPriority,
      breakdown_source: 'wizard',

      // Requirements
      engineering_required,
      replacement_vehicle_required,

      // Timing
      created_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
      last_update_at: new Date().toISOString()
    };

    // Add coordinates if provided
    if (location_coords && location_coords.lat && location_coords.lng) {
      breakdownData.latitude = location_coords.lat;
      breakdownData.longitude = location_coords.lng;
    }

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdownData)
      .select()
      .single();

    if (error) throw error;

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

export default router;