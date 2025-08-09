// Breakdown Analytics API
// Operations-focused fleet breakdown tracking system

import express from 'express';
import supabaseService from '../services/supabaseService.js';

const router = express.Router();

// Initialize the service
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await supabaseService.initialize();
    initialized = true;
  }
}

// =====================
// BREAKDOWN EVENTS
// =====================

// Record a new breakdown event (from GO BARRY or manual entry)
router.post('/events', async (req, res) => {
  try {
    await ensureInitialized();
    const breakdownData = req.body;
    
    // Validate required fields
    if (!breakdownData.fleet_number || !breakdownData.breakdown_category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fleet_number and breakdown_category'
      });
    }
    
    // Add timestamps
    breakdownData.reported_date = breakdownData.reported_date || new Date().toISOString();
    
    // Insert the breakdown event
    const result = await supabaseService.insert('breakdown_events', breakdownData);
    
    if (result.success) {
      // Check for patterns asynchronously
      checkForPatterns(breakdownData).catch(console.error);
      
      res.json({
        success: true,
        eventId: result.data?.[0]?.event_id,
        message: 'Breakdown event recorded successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error recording breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get breakdown events with filters
router.get('/events', async (req, res) => {
  try {
    await ensureInitialized();
    const { 
      depot, 
      category, 
      fleet_number,
      days = 30,
      limit = 100,
      offset = 0 
    } = req.query;
    
    // Build filters
    const filters = {};
    if (depot) filters.depot = depot;
    if (category) filters.breakdown_category = category;
    if (fleet_number) filters.fleet_number = fleet_number;
    
    const result = await supabaseService.select('breakdown_events', {
      filters,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: { column: 'reported_date', ascending: false }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching breakdowns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================
// ANALYTICS & INSIGHTS
// =====================

// Dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    await ensureInitialized();
    const { depot, days = 7 } = req.query;
    
    // Get total breakdowns
    const totalQuery = await supabaseService.rawQuery(`
      SELECT 
        COUNT(*) as total_breakdowns,
        COUNT(DISTINCT vehicle_id) as vehicles_affected,
        COUNT(CASE WHEN severity = 'STOP' THEN 1 END) as safety_critical,
        COUNT(CASE WHEN reported_date >= NOW() - INTERVAL '7 days' THEN 1 END) as last_week,
        COUNT(CASE WHEN reported_date >= NOW() - INTERVAL '14 days' 
                    AND reported_date < NOW() - INTERVAL '7 days' THEN 1 END) as previous_week
      FROM breakdown_events
      WHERE reported_date >= NOW() - INTERVAL '${days} days'
      ${depot ? "AND depot = '" + depot + "'" : ''}
    `);
    
    const stats = totalQuery.data?.[0] || {};
    
    // Calculate week-over-week change
    const weeklyChange = stats.previous_week > 0 
      ? Math.round(((stats.last_week - stats.previous_week) / stats.previous_week) * 100)
      : 0;
    
    // Get top categories
    const categoriesQuery = await supabaseService.rawQuery(`
      SELECT 
        breakdown_category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM breakdown_events
      WHERE reported_date >= NOW() - INTERVAL '${days} days'
      ${depot ? "AND depot = '" + depot + "'" : ''}
      GROUP BY breakdown_category
      ORDER BY count DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      data: {
        totalBreakdowns: parseInt(stats.total_breakdowns) || 0,
        vehiclesAffected: parseInt(stats.vehicles_affected) || 0,
        safetyCritical: parseInt(stats.safety_critical) || 0,
        weeklyChange: weeklyChange,
        topCategories: categoriesQuery.data || []
      }
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Vehicle reliability report
router.get('/vehicle-reliability', async (req, res) => {
  try {
    await ensureInitialized();
    const { depot, limit = 20 } = req.query;
    
    const query = `
      SELECT 
        v.fleet_number,
        v.vehicle_type,
        v.depot,
        COUNT(be.event_id) as breakdown_count,
        COUNT(DISTINCT DATE(be.reported_date)) as days_with_breakdowns,
        ARRAY_AGG(DISTINCT be.breakdown_category) as categories,
        MAX(be.reported_date) as last_breakdown,
        SUM(CASE WHEN be.vehicle_off_road THEN 1 ELSE 0 END) as vor_count,
        CASE 
          WHEN COUNT(be.event_id) = 0 THEN 'Excellent'
          WHEN COUNT(be.event_id) <= 2 THEN 'Good'
          WHEN COUNT(be.event_id) <= 5 THEN 'Fair'
          ELSE 'Poor'
        END as reliability_rating
      FROM fleet_vehicles v
      LEFT JOIN breakdown_events be ON v.vehicle_id = be.vehicle_id
        AND be.reported_date >= NOW() - INTERVAL '90 days'
      WHERE v.in_service = true
        ${depot ? "AND v.depot = '" + depot + "'" : ''}
      GROUP BY v.vehicle_id, v.fleet_number, v.vehicle_type, v.depot
      ORDER BY breakdown_count DESC, last_breakdown DESC
      LIMIT ${limit}
    `;
    
    const result = await supabaseService.rawQuery(query);
    
    res.json({
      success: true,
      data: result.data || []
    });
  } catch (error) {
    console.error('Error fetching vehicle reliability:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Depot pattern analysis
router.get('/depot-patterns', async (req, res) => {
  try {
    await ensureInitialized();
    const { days = 30 } = req.query;
    
    const query = `
      WITH depot_category_stats AS (
        SELECT 
          depot,
          breakdown_category,
          COUNT(*) as occurrences,
          COUNT(DISTINCT vehicle_id) as vehicles_affected,
          ARRAY_AGG(DISTINCT fleet_number) as fleet_numbers,
          MIN(reported_date) as first_occurrence,
          MAX(reported_date) as last_occurrence
        FROM breakdown_events
        WHERE reported_date >= NOW() - INTERVAL '${days} days'
        GROUP BY depot, breakdown_category
        HAVING COUNT(*) >= 3
      )
      SELECT 
        depot,
        breakdown_category,
        occurrences,
        vehicles_affected,
        fleet_numbers,
        first_occurrence,
        last_occurrence,
        EXTRACT(DAY FROM (last_occurrence - first_occurrence)) as day_span
      FROM depot_category_stats
      ORDER BY occurrences DESC, depot, breakdown_category
    `;
    
    const result = await supabaseService.rawQuery(query);
    
    res.json({
      success: true,
      data: result.data || []
    });
  } catch (error) {
    console.error('Error fetching depot patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Category trends over time
router.get('/category-trends', async (req, res) => {
  try {
    await ensureInitialized();
    const { category, groupBy = 'week', depot } = req.query;
    
    const dateFormat = groupBy === 'day' ? 'YYYY-MM-DD' : 
                      groupBy === 'week' ? 'YYYY-IW' : 'YYYY-MM';
    
    const query = `
      SELECT 
        TO_CHAR(reported_date, '${dateFormat}') as period,
        breakdown_category,
        COUNT(*) as breakdowns,
        COUNT(DISTINCT vehicle_id) as vehicles_affected,
        COUNT(DISTINCT depot) as depots_affected,
        SUM(CASE WHEN vehicle_off_road THEN 1 ELSE 0 END) as vor_events
      FROM breakdown_events
      WHERE reported_date >= NOW() - INTERVAL '6 months'
        ${category ? "AND breakdown_category = '" + category + "'" : ''}
        ${depot ? "AND depot = '" + depot + "'" : ''}
      GROUP BY period, breakdown_category
      ORDER BY period DESC, breakdowns DESC
    `;
    
    const result = await supabaseService.rawQuery(query);
    
    res.json({
      success: true,
      data: result.data || []
    });
  } catch (error) {
    console.error('Error fetching category trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================
// PATTERN ALERTS
// =====================

// Get active pattern alerts
router.get('/pattern-alerts', async (req, res) => {
  try {
    await ensureInitialized();
    const { status = 'active', depot } = req.query;
    
    const filters = { status };
    if (depot) filters.affected_depot = depot;
    
    const result = await supabaseService.select('pattern_alerts', {
      filters,
      order: { column: 'created_at', ascending: false }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching pattern alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Acknowledge a pattern alert
router.post('/pattern-alerts/:alertId/acknowledge', async (req, res) => {
  try {
    await ensureInitialized();
    const { alertId } = req.params;
    const { acknowledged_by, notes } = req.body;
    
    const result = await supabaseService.update('pattern_alerts', {
      status: 'acknowledged',
      acknowledged_by,
      acknowledged_at: new Date().toISOString(),
      notes
    }, { alert_id: alertId });
    
    res.json(result);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================
// FLEET MANAGEMENT
// =====================

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    await ensureInitialized();
    const { depot, in_service = true } = req.query;
    
    const filters = {};
    if (depot) filters.depot = depot;
    if (in_service !== undefined) filters.in_service = in_service === 'true';
    
    const result = await supabaseService.select('fleet_vehicles', {
      filters,
      order: { column: 'fleet_number', ascending: true }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add/update vehicle
router.post('/vehicles', async (req, res) => {
  try {
    await ensureInitialized();
    const vehicleData = req.body;
    
    // Upsert based on fleet_number
    const result = await supabaseService.upsert('fleet_vehicles', vehicleData, {
      onConflict: 'fleet_number'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error saving vehicle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================
// GO BARRY INTEGRATION
// =====================

// Record GO BARRY session
router.post('/barry-sessions', async (req, res) => {
  try {
    await ensureInitialized();
    const sessionData = req.body;
    
    const result = await supabaseService.insert('go_barry_sessions', sessionData);
    
    res.json(result);
  } catch (error) {
    console.error('Error recording GO BARRY session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================
// HELPER FUNCTIONS
// =====================

async function checkForPatterns(breakdownData) {
  try {
    // The database trigger will handle pattern detection
    // This is where we could add additional real-time notifications
    
    // Check if this creates a critical pattern
    const criticalPatterns = await supabaseService.rawQuery(`
      SELECT * FROM pattern_alerts
      WHERE status = 'active'
        AND severity = 'critical'
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND (affected_depot = $1 OR $2 = ANY(affected_vehicles))
    `, [breakdownData.depot, breakdownData.fleet_number]);
    
    if (criticalPatterns.data?.length > 0) {
      // TODO: Send immediate notification to operations team
      console.log('CRITICAL PATTERN DETECTED:', criticalPatterns.data[0]);
    }
  } catch (error) {
    console.error('Error checking patterns:', error);
  }
}

export default router;