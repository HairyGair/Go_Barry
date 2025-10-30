/**
 * Backend API Implementation Requirements
 * For Real Breakdown Data Flow
 * 
 * This file outlines the required backend endpoints and data structures
 * needed to support real-time breakdown tracking without mock data
 */

// ============================================
// DATABASE SCHEMA REQUIREMENTS
// ============================================

/* 
PostgreSQL Tables Needed:

1. breakdowns table:
   - breakdown_id (PRIMARY KEY) - Format: BD-2025-00001
   - daily_id (INTEGER) - Sequential daily number
   - fleet_number (VARCHAR)
   - location (TEXT)
   - location_coords (VARCHAR) - lat,lng format
   - w3w_location (VARCHAR) - what3words
   - issue_category (VARCHAR)
   - severity (VARCHAR) - STOP/AMBER/CONTINUE
   - status (VARCHAR) - active/resolved
   - supervisor_name (VARCHAR)
   - supervisor_badge (VARCHAR)
   - wizard_type (VARCHAR)
   - wizard_decision (VARCHAR)
   - wizard_assessment_data (JSONB)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)
   - acknowledged_at (TIMESTAMP)
   - dispatched_at (TIMESTAMP)
   - on_site_at (TIMESTAMP)
   - fixing_at (TIMESTAMP)
   - resolved_at (TIMESTAMP)
   - depot (VARCHAR)
   - priority_level (INTEGER)
   - engineering_required (BOOLEAN)
   - replacement_vehicle_required (BOOLEAN)

2. engineers table:
   - engineer_id (PRIMARY KEY)
   - name (VARCHAR)
   - badge (VARCHAR)
   - depot (VARCHAR)
   - status (VARCHAR) - available/busy/off_duty
   - current_breakdown_id (VARCHAR - FK to breakdowns)
   - specialization (VARCHAR)
   - shift_start (TIME)
   - shift_end (TIME)

3. breakdown_assignments table:
   - assignment_id (PRIMARY KEY)
   - breakdown_id (VARCHAR - FK)
   - engineer_id (VARCHAR - FK)
   - assigned_at (TIMESTAMP)
   - status (VARCHAR) - assigned/dispatched/on_site/repairing/complete
   - eta (TIMESTAMP)
   - arrival_at (TIMESTAMP)
   - completion_at (TIMESTAMP)

4. breakdown_activities table:
   - activity_id (PRIMARY KEY)
   - breakdown_id (VARCHAR - FK)
   - timestamp (TIMESTAMP)
   - type (VARCHAR)
   - description (TEXT)
   - user_name (VARCHAR)
   - user_badge (VARCHAR)
*/

// ============================================
// REQUIRED API ENDPOINTS
// ============================================

const express = require('express');
const router = express.Router();

// ------------------
// BREAKDOWN ENDPOINTS
// ------------------

/**
 * CREATE BREAKDOWN FROM WIZARD ASSESSMENT
 * This is the main endpoint called when assessment completes
 */
router.post('/api/breakdowns/from-wizard', async (req, res) => {
  try {
    const {
      wizard_type,
      wizard_decision,
      wizard_assessment_data,
      fleet_number,
      location,
      location_coords,
      w3w_location,
      supervisor_badge,
      supervisor_name,
      issue_category,
      severity,
      priority_level,
      engineering_required,
      replacement_vehicle_required
    } = req.body;

    // Generate breakdown ID (BD-YYYY-00001 format)
    const year = new Date().getFullYear();
    const count = await getNextBreakdownNumber(); // Implement this
    const breakdown_id = `BD-${year}-${String(count).padStart(5, '0')}`;
    
    // Generate daily ID
    const daily_id = await getTodaysBreakdownCount() + 1; // Implement this

    // Create breakdown record
    const breakdown = await db.query(`
      INSERT INTO breakdowns (
        breakdown_id, daily_id, fleet_number, location, location_coords,
        w3w_location, issue_category, severity, status, supervisor_name,
        supervisor_badge, wizard_type, wizard_decision, wizard_assessment_data,
        created_at, updated_at, priority_level, engineering_required,
        replacement_vehicle_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      breakdown_id, daily_id, fleet_number, location, location_coords,
      w3w_location, issue_category, severity || wizard_decision, 'active',
      supervisor_name, supervisor_badge, wizard_type, wizard_decision,
      wizard_assessment_data, new Date(), new Date(), priority_level,
      engineering_required, replacement_vehicle_required
    ]);

    // Log activity
    await logActivity(breakdown_id, 'CREATED', `Breakdown reported by ${supervisor_name}`);

    res.json({
      success: true,
      breakdown: breakdown.rows[0],
      message: 'Breakdown created successfully'
    });
  } catch (error) {
    console.error('Error creating breakdown:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET ALL ACTIVE BREAKDOWNS
 * Main endpoint for dashboards to fetch real breakdowns
 */
router.get('/api/breakdowns/active', async (req, res) => {
  try {
    // Fetch all active breakdowns with engineer assignments
    const breakdowns = await db.query(`
      SELECT 
        b.*,
        e.name as engineer_name,
        e.badge as engineer_badge,
        ba.status as engineer_status,
        ba.eta as engineer_eta,
        ba.arrival_at,
        (
          SELECT json_agg(json_build_object(
            'timestamp', timestamp,
            'type', type,
            'description', description,
            'user_name', user_name
          ) ORDER BY timestamp DESC)
          FROM breakdown_activities
          WHERE breakdown_id = b.breakdown_id
          LIMIT 10
        ) as activities
      FROM breakdowns b
      LEFT JOIN breakdown_assignments ba ON b.breakdown_id = ba.breakdown_id
        AND ba.status != 'complete'
      LEFT JOIN engineers e ON ba.engineer_id = e.engineer_id
      WHERE b.status = 'active'
      ORDER BY b.created_at DESC
    `);

    // Calculate statistics
    const stats = {
      total: breakdowns.rows.length,
      unassigned: breakdowns.rows.filter(b => !b.engineer_name).length,
      critical: breakdowns.rows.filter(b => b.severity === 'STOP').length,
      avg_response_time: await calculateAvgResponseTime(), // Implement
      sla_compliance: await calculateSLACompliance() // Implement
    };

    res.json({
      success: true,
      breakdowns: breakdowns.rows,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching breakdowns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * RESOLVE A BREAKDOWN
 */
router.put('/api/breakdowns/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      UPDATE breakdowns 
      SET status = 'resolved', 
          resolved_at = NOW(),
          updated_at = NOW()
      WHERE breakdown_id = $1
      RETURNING *
    `, [id]);

    await logActivity(id, 'RESOLVED', 'Breakdown resolved');

    res.json({
      success: true,
      breakdown: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------
// ENGINEERING ENDPOINTS
// ------------------

/**
 * GET ALL ENGINEERS
 */
router.get('/api/engineering/engineers', async (req, res) => {
  try {
    const engineers = await db.query(`
      SELECT * FROM engineers
      ORDER BY depot, name
    `);

    res.json({
      success: true,
      engineers: engineers.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET DEPOT STATISTICS
 */
router.get('/api/engineering/depot-stats', async (req, res) => {
  try {
    const depotStats = await db.query(`
      SELECT 
        depot,
        COUNT(DISTINCT e.engineer_id) as total_engineers,
        COUNT(DISTINCT CASE WHEN e.status = 'available' THEN e.engineer_id END) as available,
        AVG(EXTRACT(EPOCH FROM (ba.arrival_at - b.created_at))/60) as avg_response_minutes
      FROM engineers e
      LEFT JOIN breakdown_assignments ba ON e.engineer_id = ba.engineer_id
      LEFT JOIN breakdowns b ON ba.breakdown_id = b.breakdown_id
      GROUP BY depot
    `);

    const teams = {};
    depotStats.rows.forEach(depot => {
      teams[depot.depot] = {
        total: depot.total_engineers,
        available: depot.available,
        avgResponse: Math.round(depot.avg_response_minutes || 0),
        sla: depot.avg_response_minutes ? 
          (depot.avg_response_minutes <= 60 ? 100 : 
           depot.avg_response_minutes <= 90 ? 75 : 50) : 100
      };
    });

    res.json({
      success: true,
      teams: teams
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ASSIGN ENGINEER TO BREAKDOWN
 */
router.post('/api/engineering/assign', async (req, res) => {
  try {
    const { breakdown_id, engineer_id } = req.body;
    
    // Create assignment
    const assignment = await db.query(`
      INSERT INTO breakdown_assignments (
        breakdown_id, engineer_id, assigned_at, status, eta
      ) VALUES ($1, $2, NOW(), 'assigned', NOW() + INTERVAL '30 minutes')
      RETURNING *
    `, [breakdown_id, engineer_id]);

    // Update engineer status
    await db.query(`
      UPDATE engineers 
      SET status = 'busy', current_breakdown_id = $1
      WHERE engineer_id = $2
    `, [breakdown_id, engineer_id]);

    // Update breakdown
    await db.query(`
      UPDATE breakdowns 
      SET dispatched_at = NOW(), updated_at = NOW()
      WHERE breakdown_id = $1
    `, [breakdown_id]);

    // Log activity
    await logActivity(breakdown_id, 'ENGINEER_ASSIGNED', `Engineer assigned`);

    res.json({
      success: true,
      assignment: assignment.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * AUTO-ASSIGN NEAREST AVAILABLE ENGINEER
 */
router.post('/api/engineering/auto-assign', async (req, res) => {
  try {
    const { breakdown_id } = req.body;
    
    // Get breakdown details
    const breakdown = await db.query(
      'SELECT * FROM breakdowns WHERE breakdown_id = $1',
      [breakdown_id]
    );

    if (!breakdown.rows[0]) {
      return res.status(404).json({ success: false, error: 'Breakdown not found' });
    }

    // Find available engineer (preferably from same depot)
    const engineer = await db.query(`
      SELECT * FROM engineers 
      WHERE status = 'available'
      ORDER BY 
        CASE WHEN depot = $1 THEN 0 ELSE 1 END,
        random()
      LIMIT 1
    `, [breakdown.rows[0].depot || 'Washington']);

    if (!engineer.rows[0]) {
      return res.status(404).json({ success: false, error: 'No available engineers' });
    }

    // Use the assign endpoint logic
    req.body.engineer_id = engineer.rows[0].engineer_id;
    return router.post('/api/engineering/assign', req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * UPDATE ENGINEER STATUS
 */
router.put('/api/engineering/assignment/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update assignment status
    await db.query(`
      UPDATE breakdown_assignments 
      SET status = $1,
          ${status === 'on_site' ? 'arrival_at = NOW(),' : ''}
          ${status === 'complete' ? 'completion_at = NOW(),' : ''}
          updated_at = NOW()
      WHERE breakdown_id = $2
    `, [status, id]);

    // Update breakdown timeline
    if (status === 'on_site') {
      await db.query(
        'UPDATE breakdowns SET on_site_at = NOW() WHERE breakdown_id = $1',
        [id]
      );
      await logActivity(id, 'ENGINEER_ON_SITE', 'Engineer arrived on site');
    } else if (status === 'repairing') {
      await db.query(
        'UPDATE breakdowns SET fixing_at = NOW() WHERE breakdown_id = $1',
        [id]
      );
      await logActivity(id, 'REPAIR_STARTED', 'Repair work started');
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------
// SDC ENDPOINTS
// ------------------

/**
 * ACKNOWLEDGE BREAKDOWN
 */
router.post('/api/sdc/acknowledge', async (req, res) => {
  try {
    const { breakdown_id } = req.body;
    
    await db.query(`
      UPDATE breakdowns 
      SET acknowledged_at = NOW(), updated_at = NOW()
      WHERE breakdown_id = $1
    `, [breakdown_id]);

    await logActivity(breakdown_id, 'ACKNOWLEDGED', 'SDC acknowledged breakdown');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * MAKE SDC DECISION
 */
router.post('/api/sdc/decision', async (req, res) => {
  try {
    const { breakdown_id, decision } = req.body;
    
    await db.query(`
      UPDATE breakdowns 
      SET decision_at = NOW(), 
          decision = $2,
          updated_at = NOW()
      WHERE breakdown_id = $1
    `, [breakdown_id, decision]);

    await logActivity(breakdown_id, 'DECISION_MADE', `SDC decision: ${decision}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ------------------
// HELPER FUNCTIONS
// ------------------

async function logActivity(breakdown_id, type, description, user_name = 'System') {
  await db.query(`
    INSERT INTO breakdown_activities (
      breakdown_id, timestamp, type, description, user_name
    ) VALUES ($1, NOW(), $2, $3, $4)
  `, [breakdown_id, type, description, user_name]);
}

async function getNextBreakdownNumber() {
  const result = await db.query(
    "SELECT COUNT(*) FROM breakdowns WHERE breakdown_id LIKE 'BD-' || EXTRACT(YEAR FROM NOW())::TEXT || '%'"
  );
  return parseInt(result.rows[0].count) + 1;
}

async function getTodaysBreakdownCount() {
  const result = await db.query(
    "SELECT COUNT(*) FROM breakdowns WHERE DATE(created_at) = CURRENT_DATE"
  );
  return parseInt(result.rows[0].count);
}

async function calculateAvgResponseTime() {
  const result = await db.query(`
    SELECT AVG(EXTRACT(EPOCH FROM (ba.arrival_at - b.created_at))/60) as avg_minutes
    FROM breakdowns b
    JOIN breakdown_assignments ba ON b.breakdown_id = ba.breakdown_id
    WHERE ba.arrival_at IS NOT NULL
      AND b.created_at > NOW() - INTERVAL '7 days'
  `);
  return Math.round(result.rows[0].avg_minutes || 0);
}

async function calculateSLACompliance() {
  const result = await db.query(`
    SELECT 
      COUNT(CASE WHEN EXTRACT(EPOCH FROM (COALESCE(on_site_at, NOW()) - created_at))/60 <= 60 THEN 1 END) as within_sla,
      COUNT(*) as total
    FROM breakdowns
    WHERE created_at > NOW() - INTERVAL '7 days'
  `);
  const { within_sla, total } = result.rows[0];
  return total > 0 ? Math.round((within_sla / total) * 100) : 100;
}

module.exports = router;
