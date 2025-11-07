import express from 'express';
import { from, query } from '../utils/queryHelpers.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// GET /api/public/breakdowns - Get breakdowns with optional depot filtering (for Engineering Display)
// This endpoint does NOT require authentication - it's for public yard displays
router.get('/breakdowns', async (req, res) => {
  try {
    const { depot } = req.query;

    // Query from breakdowns table using MySQL
    let queryBuilder = from('breakdowns').select('*');

    // Apply depot filter if provided
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    const { data: allBreakdowns, error } = await queryBuilder
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    console.log(`📊 /public/breakdowns: Found ${allBreakdowns?.length || 0} total breakdowns${depot ? ` for depot ${depot}` : ''}`);

    // Filter out resolved/completed breakdowns
    const breakdowns = allBreakdowns.filter(b =>
      !['resolved', 'deleted', 'cancelled', 'completed'].includes(b.status)
    );

    console.log(`✅ /public/breakdowns: Returning ${breakdowns.length} active breakdowns after filtering`);

    // Format breakdowns for display
    const formattedBreakdowns = breakdowns.map(b => ({
      // Core identifiers
      breakdown_id: b.breakdown_id,
      id: b.breakdown_id,

      // Vehicle information
      fleet_no: b.fleet_no,
      registration: b.registration,
      depot: b.depot,

      // Location and issue information
      location: b.location_description || b.location || 'Location TBC',
      issue_category: b.issue_category,
      description: b.description,

      // Status and severity
      status: b.status,
      severity: b.severity,
      wizard_decision: b.wizard_decision,

      // Timing information
      created_at: b.created_at,
      updated_at: b.updated_at,

      // Supervisor information
      supervisor_badge: b.supervisor_badge,
      supervisor_name: b.supervisor_name,

      // Assessment data
      wizard_type: b.wizard_type,
      wizard_assessment_data: b.wizard_assessment_data
    }));

    res.json({
      success: true,
      breakdowns: formattedBreakdowns,
      timestamp: new Date().toISOString(),
      count: formattedBreakdowns.length
    });
  } catch (error) {
    console.error('Error fetching public breakdowns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breakdowns',
      timestamp: new Date().toISOString(),
      breakdowns: [] // Return empty array for graceful degradation
    });
  }
});

// GET /api/public/breakdowns/live - Get active breakdowns for public displays (Control Room)
// This endpoint does NOT require authentication - it's for public wall displays
router.get('/breakdowns/live', async (req, res) => {
  try {
    // Query from breakdowns table using MySQL
    const { data: allBreakdowns, error } = await from('breakdowns')
      .select('*')
      .order('created_at', 'DESC')
      .execute();

    if (error) throw error;

    console.log(`📊 /public/breakdowns/live: Found ${allBreakdowns?.length || 0} total breakdowns in database`);
    if (allBreakdowns && allBreakdowns.length > 0) {
      console.log('📋 Breakdown statuses:', allBreakdowns.map(b => `${b.breakdown_id}: ${b.status}`));
    }

    // Filter out resolved/completed breakdowns
    const breakdowns = allBreakdowns.filter(b =>
      !['resolved', 'deleted', 'cancelled', 'completed'].includes(b.status)
    );

    console.log(`✅ /public/breakdowns/live: Returning ${breakdowns.length} active breakdowns after filtering`);

    // Format breakdowns for dashboard display
    const formattedBreakdowns = breakdowns.map(b => {
      // Calculate elapsed time
      const elapsedMinutes = Math.floor((new Date() - new Date(b.created_at)) / (1000 * 60));
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      const remainingMinutes = Math.floor(elapsedMinutes % 60);

      let durationText = '';
      if (elapsedHours > 0) {
        durationText = `${elapsedHours}h ${remainingMinutes}m`;
      } else {
        durationText = `${remainingMinutes}m`;
      }

      // Determine priority level and status color
      // Secured mileage is ALWAYS priority 1 (contractual obligation)
      const priorityLevel = b.priority_level || (
        b.secured_mileage ? 1 :  // Secured mileage must be priority 1 to avoid fines
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

        // Route and priority - extract from wizard_assessment_data if available
        route_id: b.wizard_assessment_data?.route || b.route_id || b.route || null,
        route: b.wizard_assessment_data?.route || b.route || null,
        route_number: b.wizard_assessment_data?.route || b.route || null,
        route_name: b.wizard_assessment_data?.route_name || b.route_name || null,
        service: b.wizard_assessment_data?.route || b.route || null,
        is_priority: priorityLevel <= 2 || b.secured_mileage,
        priority_level: priorityLevel,
        secured_mileage: b.secured_mileage || false,

        // Supervisor information
        supervisor_badge: b.supervisor_badge,
        supervisor_name: b.supervisor_name,

        // Dashboard card information
        card_title: cardTitle,
        status_color: statusColor,
        requires_immediate_action: b.requires_immediate_action || (b.severity === 'STOP') || (priorityLevel <= 2) || b.secured_mileage,

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
    console.error('Error fetching live breakdowns (public):', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live breakdowns',
      timestamp: new Date().toISOString(),
      breakdowns: [] // Return empty array for graceful degradation
    });
  }
});

// GET /api/public/fleet - Get fleet database
router.get('/fleet', (req, res) => {
  try {
    const fleetDbPath = join(__dirname, '..', 'data', 'fleet-database.json');
    const fleetData = JSON.parse(readFileSync(fleetDbPath, 'utf-8'));

    res.json({
      success: true,
      fleet: fleetData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error loading fleet database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load fleet database',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/public/activity/feed - Get activity feed (no auth required)
router.get('/activity/feed', async (req, res) => {
  try {
    const { limit = 25, offset = 0 } = req.query;

    const { data, error } = await from('activities')
      .select('*')
      .order('created_at', 'DESC')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .execute();

    if (error) throw error;

    res.json({
      success: true,
      activities: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching public activity feed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed',
      activities: [],
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/public/breakdowns/stats - Get breakdown statistics (no auth required)
router.get('/breakdowns/stats', async (req, res) => {
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

export default router;
