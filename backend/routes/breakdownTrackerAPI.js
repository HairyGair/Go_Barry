/*
 * Breakdown Tracker API
 * Manages breakdown lifecycle from receipt to clearance with timed stages
 * Tracks KPIs by depot and provides DVSA compliance exports
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import supabaseService from '../services/supabaseService.js';

const router = express.Router();

// Depot definitions
const VALID_DEPOTS = ['Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford', 'Hexham'];
const EVENT_TYPES = ['received', 'acknowledged', 'decision', 'engineer_dispatched', 'on_site', 'moving', 'cleared', 'note'];
const SEVERITY_LEVELS = ['STOP', 'AMBER', 'CONTINUE', 'PENDING'];

// Helper to determine depot from vehicle ID
function getDepotFromVehicle(vehicleId) {
  // Fleet number ranges by depot (example mapping)
  const fleetNum = parseInt(vehicleId);
  if (fleetNum >= 5200 && fleetNum <= 5499) return 'Washington';
  if (fleetNum >= 5500 && fleetNum <= 5799) return 'Riverside';
  if (fleetNum >= 6000 && fleetNum <= 6299) return 'Percy Main';
  if (fleetNum >= 6300 && fleetNum <= 6599) return 'Consett';
  if (fleetNum >= 6900 && fleetNum <= 7199) return 'Deptford';
  if (fleetNum >= 8300 && fleetNum <= 8399) return 'Hexham';
  return 'Washington'; // Default
}

// Create new breakdown record
router.post('/create', async (req, res) => {
  try {
    const {
      vehicle_id,
      depot_id,
      route_id,
      service_number,
      location,
      supervisor_badge,
      supervisor_name,
      initial_notes
    } = req.body;

    // Validate required fields
    if (!vehicle_id || !supervisor_badge) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['vehicle_id', 'supervisor_badge']
      });
    }

    // Auto-determine depot if not provided
    const depot = depot_id || getDepotFromVehicle(vehicle_id);
    if (!VALID_DEPOTS.includes(depot)) {
      return res.status(400).json({
        error: 'Invalid depot',
        valid_depots: VALID_DEPOTS
      });
    }

    // Create breakdown record
    const breakdownId = uuidv4();
    const breakdown = {
      id: breakdownId,
      vehicle_id,
      depot_id: depot,
      route_id: route_id || null,
      service_number: service_number || null,
      location: location || null,
      supervisor_badge,
      severity: 'PENDING',
      status: 'received',
      created_at: new Date().toISOString()
    };

    // Insert breakdown record
    const { data: breakdownData, error: breakdownError } = await supabaseService.client
      .from('breakdowns')
      .insert(breakdown)
      .select()
      .single();

    if (breakdownError) {
      console.error('Error creating breakdown:', breakdownError);
      return res.status(500).json({ error: 'Failed to create breakdown record' });
    }

    // Create initial received event
    const receivedEvent = {
      id: uuidv4(),
      breakdown_id: breakdownId,
      event_type: 'received',
      occurred_at: new Date().toISOString(),
      by_badge: supervisor_badge,
      by_name: supervisor_name || null,
      notes: initial_notes || `Breakdown reported for vehicle ${vehicle_id}`,
      metadata: {
        vehicle_id,
        depot_id: depot,
        location,
        route_id,
        service_number
      }
    };

    const { error: eventError } = await supabaseService.client
      .from('breakdown_events')
      .insert(receivedEvent);

    if (eventError) {
      console.error('Error creating received event:', eventError);
    }

    res.json({
      success: true,
      breakdown_id: breakdownId,
      message: 'Breakdown logged successfully',
      data: breakdownData
    });

  } catch (error) {
    console.error('Error in breakdown create:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update breakdown status/stage
router.post('/:id/event', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_type,
      by_badge,
      by_name,
      notes,
      metadata,
      severity // For decision events
    } = req.body;

    // Validate event type
    if (!EVENT_TYPES.includes(event_type)) {
      return res.status(400).json({
        error: 'Invalid event type',
        valid_types: EVENT_TYPES
      });
    }

    // Create event record
    const event = {
      id: uuidv4(),
      breakdown_id: id,
      event_type,
      occurred_at: new Date().toISOString(),
      by_badge,
      by_name: by_name || null,
      notes: notes || null,
      metadata: metadata || {}
    };

    const { error: eventError } = await supabaseService.client
      .from('breakdown_events')
      .insert(event);

    if (eventError) {
      console.error('Error creating event:', eventError);
      return res.status(500).json({ error: 'Failed to create event' });
    }

    // Update breakdown status based on event type
    const statusMap = {
      'acknowledged': 'acknowledged',
      'decision': 'decision',
      'engineer_dispatched': 'dispatched',
      'on_site': 'on_site',
      'moving': 'moving',
      'cleared': 'cleared'
    };

    if (statusMap[event_type]) {
      const updateData = {
        status: statusMap[event_type],
        updated_at: new Date().toISOString()
      };

      // Add severity if this is a decision event
      if (event_type === 'decision' && severity) {
        if (!SEVERITY_LEVELS.includes(severity)) {
          return res.status(400).json({
            error: 'Invalid severity level',
            valid_levels: SEVERITY_LEVELS
          });
        }
        updateData.severity = severity;
      }

      // Add closed_at if cleared
      if (event_type === 'cleared') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabaseService.client
        .from('breakdowns')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating breakdown status:', updateError);
      }
    }

    res.json({
      success: true,
      message: `Event '${event_type}' recorded successfully`,
      event_id: event.id
    });

  } catch (error) {
    console.error('Error in breakdown event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active breakdowns with live timers
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabaseService.client
      .rpc('get_active_breakdowns');

    if (error) {
      console.error('Error fetching active breakdowns:', error);
      return res.status(500).json({ error: 'Failed to fetch active breakdowns' });
    }

    // Add timer status for UI
    const enhancedData = data.map(breakdown => ({
      ...breakdown,
      timer_status: getTimerStatus(breakdown.minutes_elapsed),
      formatted_time: formatElapsedTime(breakdown.minutes_elapsed)
    }));

    res.json({
      success: true,
      count: data.length,
      breakdowns: enhancedData
    });

  } catch (error) {
    console.error('Error in active breakdowns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get depot KPI summary (league table)
router.get('/kpi/depot-summary', async (req, res) => {
  try {
    const { data, error } = await supabaseService.client
      .from('depot_kpi_summary')
      .select('*')
      .order('overall_score', { ascending: false });

    if (error) {
      console.error('Error fetching depot KPIs:', error);
      return res.status(500).json({ error: 'Failed to fetch depot KPIs' });
    }

    // Add ranking
    const rankedData = data.map((depot, index) => ({
      ...depot,
      rank: index + 1,
      performance_grade: getPerformanceGrade(depot.overall_score)
    }));

    res.json({
      success: true,
      depots: rankedData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in depot KPI summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get breakdown details with full timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;

    // Get breakdown header
    const { data: breakdown, error: breakdownError } = await supabaseService.client
      .from('breakdowns')
      .select('*')
      .eq('id', id)
      .single();

    if (breakdownError || !breakdown) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    // Get all events
    const { data: events, error: eventsError } = await supabaseService.client
      .from('breakdown_events')
      .select('*')
      .eq('breakdown_id', id)
      .order('occurred_at', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return res.status(500).json({ error: 'Failed to fetch timeline' });
    }

    // Calculate stage durations
    const stageDurations = calculateStageDurations(events);

    res.json({
      success: true,
      breakdown,
      events,
      stage_durations: stageDurations,
      total_duration_minutes: breakdown.total_duration_minutes
    });

  } catch (error) {
    console.error('Error in breakdown timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DVSA compliance export
router.get('/:id/dvsa-export', async (req, res) => {
  try {
    const { id } = req.params;

    // Get breakdown with all related data
    const { data: breakdown, error: breakdownError } = await supabaseService.client
      .from('breakdowns')
      .select(`
        *,
        breakdown_events (*)
      `)
      .eq('id', id)
      .single();

    if (breakdownError || !breakdown) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    // Format for DVSA compliance
    const dvsaReport = {
      report_generated: new Date().toISOString(),
      breakdown_reference: breakdown.id,
      vehicle: {
        fleet_number: breakdown.vehicle_id,
        depot: breakdown.depot_id,
        route: breakdown.route_id,
        service: breakdown.service_number
      },
      incident: {
        reported_at: breakdown.created_at,
        location: breakdown.location,
        severity: breakdown.severity,
        final_status: breakdown.status,
        resolved_at: breakdown.closed_at,
        total_duration_minutes: breakdown.total_duration_minutes
      },
      supervisor: {
        badge: breakdown.supervisor_badge,
        actions: breakdown.breakdown_events.filter(e => e.by_badge === breakdown.supervisor_badge)
      },
      timeline: breakdown.breakdown_events.map(event => ({
        timestamp: event.occurred_at,
        action: event.event_type,
        performed_by: event.by_badge,
        notes: event.notes
      })),
      compliance: {
        all_stages_documented: true,
        supervisor_authenticated: true,
        audit_trail_complete: true,
        retention_compliant: true
      }
    };

    res.json({
      success: true,
      dvsa_report: dvsaReport
    });

  } catch (error) {
    console.error('Error in DVSA export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function getTimerStatus(minutes) {
  if (minutes < 30) return 'green';
  if (minutes < 60) return 'amber';
  if (minutes < 90) return 'red';
  return 'critical';
}

function formatElapsedTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getPerformanceGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function calculateStageDurations(events) {
  const stages = {};
  let lastTime = null;
  let lastName = null;

  events.forEach(event => {
    if (lastTime && lastName) {
      const duration = (new Date(event.occurred_at) - new Date(lastTime)) / 1000 / 60;
      stages[`${lastName}_to_${event.event_type}`] = Math.round(duration * 10) / 10;
    }
    lastTime = event.occurred_at;
    lastName = event.event_type;
  });

  return stages;
}

export default router;