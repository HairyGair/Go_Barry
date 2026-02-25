/**
 * Duty Schedule Management API Routes
 * Phase 5.1: Admin features for pre-assigning duty shifts to supervisors
 *
 * Endpoints:
 * - GET /api/admin/duty/schedules - List all schedules
 * - POST /api/admin/duty/schedules - Create a new schedule
 * - PUT /api/admin/duty/schedules/:id - Update a schedule
 * - DELETE /api/admin/duty/schedules/:id - Delete a schedule
 * - GET /api/admin/duty/supervisors/status - Real-time supervisor duty status
 * - GET /api/admin/duty/templates - List shift templates
 * - POST /api/admin/duty/templates - Create shift template
 * - PUT /api/admin/duty/templates/:id - Update shift template
 * - DELETE /api/admin/duty/templates/:id - Delete shift template
 * - GET /api/admin/duty/conflicts - Check for schedule conflicts
 */

import express from 'express';
import db from '../config/mysql.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// ============================================
// SCHEDULE MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/admin/duty/schedules
 * List all duty schedules with filtering options
 */
router.get('/schedules', async (req, res) => {
  try {
    const {
      date,
      supervisor_id,
      depot,
      status,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        ds.*,
        st.color,
        st.icon,
        CASE
          WHEN ds.schedule_date = CURDATE() THEN 'today'
          WHEN ds.schedule_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'tomorrow'
          WHEN ds.schedule_date < CURDATE() THEN 'past'
          ELSE 'future'
        END as schedule_type
      FROM duty_schedules ds
      LEFT JOIN shift_templates st ON ds.duty_code = st.code
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND ds.schedule_date = ?';
      params.push(date);
    }

    if (start_date && end_date) {
      query += ' AND ds.schedule_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (supervisor_id) {
      query += ' AND ds.supervisor_id = ?';
      params.push(supervisor_id);
    }

    if (depot) {
      query += ' AND ds.depot = ?';
      params.push(depot);
    }

    if (status) {
      query += ' AND ds.status = ?';
      params.push(status);
    }

    const safeLimit = parseInt(limit) || 50;
    const safeOffset = parseInt(offset) || 0;
    query += ' ORDER BY ds.schedule_date ASC, ds.start_time ASC';
    query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [schedules] = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM duty_schedules WHERE 1=1';
    const countParams = [];
    if (date) {
      countQuery += ' AND schedule_date = ?';
      countParams.push(date);
    }
    if (supervisor_id) {
      countQuery += ' AND supervisor_id = ?';
      countParams.push(supervisor_id);
    }
    if (depot) {
      countQuery += ' AND depot = ?';
      countParams.push(depot);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      schedules,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/duty/schedules
 * Create a new duty schedule assignment
 */
router.post('/schedules', async (req, res) => {
  try {
    const {
      supervisor_id,
      duty_code,
      duty_name,
      schedule_date,
      start_time,
      end_time,
      depot,
      notes,
      is_override = false
    } = req.body;

    // Validate required fields
    if (!supervisor_id || !duty_code || !schedule_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supervisor_id, duty_code, schedule_date, start_time, end_time'
      });
    }

    // Get supervisor details
    const [supervisorResult] = await db.query(
      'SELECT id, name, badge_number, depot FROM supervisors WHERE id = ?',
      [supervisor_id]
    );

    if (supervisorResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];

    // Check for existing schedule (conflict)
    const [existingSchedule] = await db.query(
      `SELECT id FROM duty_schedules
       WHERE supervisor_id = ? AND schedule_date = ? AND duty_code = ?
       AND status NOT IN ('cancelled', 'completed')`,
      [supervisor_id, schedule_date, duty_code]
    );

    if (existingSchedule.length > 0 && !is_override) {
      return res.status(409).json({
        success: false,
        error: 'Schedule conflict: Supervisor already has this duty assigned for this date',
        existing_schedule_id: existingSchedule[0].id
      });
    }

    // Get admin info from request (set by auth middleware)
    const adminId = req.user?.id || null;
    const adminName = req.user?.name || 'System';

    // Insert the schedule
    const [result] = await db.query(
      `INSERT INTO duty_schedules (
        supervisor_id, supervisor_name, supervisor_badge,
        duty_code, duty_name, schedule_date, start_time, end_time,
        depot, notes, is_override, assigned_by, assigned_by_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
      ON DUPLICATE KEY UPDATE
        duty_name = VALUES(duty_name),
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        notes = VALUES(notes),
        is_override = VALUES(is_override),
        assigned_by = VALUES(assigned_by),
        assigned_by_name = VALUES(assigned_by_name),
        updated_at = CURRENT_TIMESTAMP`,
      [
        supervisor_id,
        supervisor.name,
        supervisor.badge_number,
        duty_code,
        duty_name,
        schedule_date,
        start_time,
        end_time,
        depot || supervisor.depot,
        notes,
        is_override,
        adminId,
        adminName
      ]
    );

    // Fetch the created/updated schedule
    const [newSchedule] = await db.query(
      `SELECT ds.*, st.color, st.icon
       FROM duty_schedules ds
       LEFT JOIN shift_templates st ON ds.duty_code = st.code
       WHERE ds.id = ?`,
      [result.insertId || existingSchedule[0]?.id]
    );

    res.status(201).json({
      success: true,
      message: is_override ? 'Schedule updated (override)' : 'Schedule created successfully',
      schedule: newSchedule[0]
    });

  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/duty/schedules/:id
 * Update an existing schedule
 */
router.put('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      duty_code,
      duty_name,
      schedule_date,
      start_time,
      end_time,
      status,
      notes
    } = req.body;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (duty_code !== undefined) {
      updates.push('duty_code = ?');
      params.push(duty_code);
    }
    if (duty_name !== undefined) {
      updates.push('duty_name = ?');
      params.push(duty_name);
    }
    if (schedule_date !== undefined) {
      updates.push('schedule_date = ?');
      params.push(schedule_date);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);

      // Update status timestamps
      if (status === 'confirmed') {
        updates.push('confirmed_at = CURRENT_TIMESTAMP');
      } else if (status === 'active') {
        updates.push('started_at = CURRENT_TIMESTAMP');
      } else if (status === 'completed') {
        updates.push('ended_at = CURRENT_TIMESTAMP');
      }
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(id);

    const [result] = await db.query(
      `UPDATE duty_schedules SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    // Fetch updated schedule
    const [updatedSchedule] = await db.query(
      `SELECT ds.*, st.color, st.icon
       FROM duty_schedules ds
       LEFT JOIN shift_templates st ON ds.duty_code = st.code
       WHERE ds.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: updatedSchedule[0]
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
      details: error.message
    });
  }
});

/**
 * DELETE /api/admin/duty/schedules/:id
 * Delete (or cancel) a schedule
 */
router.delete('/schedules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete = false } = req.query;

    if (hard_delete === 'true') {
      // Permanent delete
      const [result] = await db.query(
        'DELETE FROM duty_schedules WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
      }

      res.json({
        success: true,
        message: 'Schedule permanently deleted'
      });
    } else {
      // Soft delete (mark as cancelled)
      const [result] = await db.query(
        `UPDATE duty_schedules SET status = 'cancelled' WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
      }

      res.json({
        success: true,
        message: 'Schedule cancelled successfully'
      });
    }

  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete schedule',
      details: error.message
    });
  }
});

// ============================================
// SUPERVISOR STATUS ENDPOINTS
// ============================================

/**
 * GET /api/admin/duty/supervisors/status
 * Get real-time status of all supervisors' duty assignments
 */
router.get('/supervisors/status', async (req, res) => {
  try {
    const { depot, date = new Date().toISOString().split('T')[0] } = req.query;

    // Get all active supervisors with their schedule status for today
    let query = `
      SELECT
        s.id,
        s.name,
        s.badge_number,
        s.depot,
        s.email,
        s.current_duty,
        s.duty_start_time,
        ds.id as scheduled_id,
        ds.duty_code as scheduled_duty,
        ds.duty_name as scheduled_duty_name,
        ds.start_time as scheduled_start,
        ds.end_time as scheduled_end,
        ds.status as schedule_status,
        ds.confirmed_at,
        ds.started_at,
        st.color as duty_color,
        st.icon as duty_icon,
        CASE
          WHEN s.current_duty IS NOT NULL AND s.duty_start_time IS NOT NULL THEN 'on_duty'
          WHEN ds.status = 'scheduled' THEN 'scheduled'
          WHEN ds.status = 'confirmed' THEN 'confirmed'
          WHEN ds.status = 'active' THEN 'active'
          ELSE 'off_duty'
        END as current_status
      FROM supervisors s
      LEFT JOIN duty_schedules ds ON s.id = ds.supervisor_id
        AND ds.schedule_date = ?
        AND ds.status NOT IN ('cancelled', 'completed')
      LEFT JOIN shift_templates st ON ds.duty_code = st.code
      WHERE s.is_active = 1
    `;
    const params = [date];

    if (depot) {
      query += ' AND s.depot = ?';
      params.push(depot);
    }

    query += ' ORDER BY s.depot, s.name';

    const [supervisors] = await db.query(query, params);

    // Group by depot for easier display
    const byDepot = supervisors.reduce((acc, sup) => {
      if (!acc[sup.depot]) {
        acc[sup.depot] = [];
      }
      acc[sup.depot].push(sup);
      return acc;
    }, {});

    // Calculate summary stats
    const summary = {
      total_supervisors: supervisors.length,
      on_duty: supervisors.filter(s => s.current_status === 'on_duty' || s.current_status === 'active').length,
      scheduled: supervisors.filter(s => s.current_status === 'scheduled' || s.current_status === 'confirmed').length,
      off_duty: supervisors.filter(s => s.current_status === 'off_duty').length
    };

    res.json({
      success: true,
      date,
      summary,
      supervisors,
      by_depot: byDepot
    });

  } catch (error) {
    console.error('Error fetching supervisor status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor status',
      details: error.message
    });
  }
});

// ============================================
// SHIFT TEMPLATE ENDPOINTS
// ============================================

/**
 * GET /api/admin/duty/templates
 * List all shift templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { active_only = true } = req.query;

    let query = 'SELECT * FROM shift_templates';
    if (active_only === 'true' || active_only === true) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY is_standard DESC, code ASC';

    const [templates] = await db.query(query);

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/duty/templates
 * Create a new shift template
 */
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      start_time,
      end_time,
      color = '#6366f1',
      icon = '📋'
    } = req.body;

    if (!name || !code || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, code, start_time, end_time'
      });
    }

    const adminId = req.user?.id || null;

    const [result] = await db.query(
      `INSERT INTO shift_templates (name, code, description, start_time, end_time, color, icon, created_by, is_standard)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [name, code, description, start_time, end_time, color, icon, adminId]
    );

    const [newTemplate] = await db.query(
      'SELECT * FROM shift_templates WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template: newTemplate[0]
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Template code already exists'
      });
    }
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/duty/templates/:id
 * Update a shift template
 */
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      start_time,
      end_time,
      color,
      icon,
      is_active
    } = req.body;

    // Check if it's a standard template
    const [existing] = await db.query(
      'SELECT is_standard FROM shift_templates WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    if (existing[0].is_standard) {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify standard duty templates (100, 200, 400, 500)'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      params.push(end_time);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(id);

    await db.query(
      `UPDATE shift_templates SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updated] = await db.query(
      'SELECT * FROM shift_templates WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Template updated successfully',
      template: updated[0]
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      details: error.message
    });
  }
});

/**
 * DELETE /api/admin/duty/templates/:id
 * Delete a shift template
 */
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a standard template
    const [existing] = await db.query(
      'SELECT is_standard, code FROM shift_templates WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    if (existing[0].is_standard) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete standard duty templates (100, 200, 400, 500)'
      });
    }

    // Check if template is in use
    const [inUse] = await db.query(
      `SELECT COUNT(*) as count FROM duty_schedules WHERE duty_code = ?`,
      [existing[0].code]
    );

    if (inUse[0].count > 0) {
      // Soft delete by deactivating
      await db.query(
        'UPDATE shift_templates SET is_active = 0 WHERE id = ?',
        [id]
      );
      return res.json({
        success: true,
        message: 'Template deactivated (in use by existing schedules)'
      });
    }

    // Hard delete
    await db.query('DELETE FROM shift_templates WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      details: error.message
    });
  }
});

// ============================================
// CONFLICT DETECTION ENDPOINTS
// ============================================

/**
 * GET /api/admin/duty/conflicts
 * Check for schedule conflicts
 */
router.get('/conflicts', async (req, res) => {
  try {
    const { start_date, end_date, supervisor_id } = req.query;

    let query = `
      SELECT
        a.id as schedule_a_id,
        b.id as schedule_b_id,
        a.supervisor_id,
        a.supervisor_name,
        a.schedule_date,
        a.duty_code as duty_a,
        b.duty_code as duty_b,
        a.start_time as start_a,
        a.end_time as end_a,
        b.start_time as start_b,
        b.end_time as end_b
      FROM duty_schedules a
      JOIN duty_schedules b ON a.supervisor_id = b.supervisor_id
        AND a.schedule_date = b.schedule_date
        AND a.id < b.id
        AND a.status NOT IN ('cancelled', 'completed')
        AND b.status NOT IN ('cancelled', 'completed')
        AND (a.start_time < b.end_time AND a.end_time > b.start_time)
      WHERE 1=1
    `;
    const params = [];

    if (start_date && end_date) {
      query += ' AND a.schedule_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (supervisor_id) {
      query += ' AND a.supervisor_id = ?';
      params.push(supervisor_id);
    }

    query += ' ORDER BY a.schedule_date, a.supervisor_name';

    const [conflicts] = await db.query(query, params);

    res.json({
      success: true,
      conflicts_found: conflicts.length,
      conflicts
    });

  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/duty/upcoming
 * Get upcoming schedules for quick overview
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { days = 7, depot } = req.query;

    let query = `
      SELECT
        ds.*,
        st.color,
        st.icon
      FROM duty_schedules ds
      LEFT JOIN shift_templates st ON ds.duty_code = st.code
      WHERE ds.schedule_date >= CURDATE()
        AND ds.schedule_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND ds.status NOT IN ('cancelled', 'completed')
    `;
    const params = [parseInt(days)];

    if (depot) {
      query += ' AND ds.depot = ?';
      params.push(depot);
    }

    query += ' ORDER BY ds.schedule_date ASC, ds.start_time ASC';

    const [schedules] = await db.query(query, params);

    // Group by date
    const byDate = schedules.reduce((acc, schedule) => {
      const dateStr = schedule.schedule_date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(schedule);
      return acc;
    }, {});

    res.json({
      success: true,
      days_ahead: parseInt(days),
      total_schedules: schedules.length,
      schedules,
      by_date: byDate
    });

  } catch (error) {
    console.error('Error fetching upcoming schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming schedules',
      details: error.message
    });
  }
});

// ============================================
// FORCE ASSIGNMENT ENDPOINTS (Phase 5.2)
// ============================================

/**
 * POST /api/admin/duty/force-assign
 * Force-assign a duty to a supervisor, ending any current duty
 */
router.post('/force-assign', async (req, res) => {
  try {
    const {
      supervisor_id,
      duty_code,
      reason,
      notes
    } = req.body;

    // Validate required fields
    if (!supervisor_id || !duty_code) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supervisor_id, duty_code'
      });
    }

    // Get supervisor details
    const [supervisorResult] = await db.query(
      'SELECT id, name, badge_number, depot, current_duty, duty_start_time FROM supervisors WHERE id = ?',
      [supervisor_id]
    );

    if (supervisorResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];
    const previousDuty = supervisor.current_duty;
    const adminId = req.user?.id || null;
    const adminName = req.user?.name || 'System';
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Standard duty times
    const dutyTimes = {
      '100': { start: '06:00:00', end: '15:30:00' },
      '200': { start: '07:30:00', end: '17:00:00' },
      '400': { start: '12:30:00', end: '22:00:00' },
      '500': { start: '14:45:00', end: '00:15:00' }
    };

    const dutyTime = dutyTimes[duty_code] || { start: '00:00:00', end: '23:59:59' };

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. End any active scheduled duty for today
      await connection.query(
        `UPDATE duty_schedules
         SET status = 'completed', ended_at = NOW(), notes = CONCAT(IFNULL(notes, ''), '\n[Force ended by admin: ${reason || 'Force assignment'}]')
         WHERE supervisor_id = ? AND schedule_date = ? AND status = 'active'`,
        [supervisor_id, today]
      );

      // 2. Update supervisor's current duty
      await connection.query(
        `UPDATE supervisors
         SET current_duty = ?, duty_start_time = NOW()
         WHERE id = ?`,
        [duty_code, supervisor_id]
      );

      // 3. Create new duty schedule record
      const [scheduleResult] = await connection.query(
        `INSERT INTO duty_schedules (
          supervisor_id, supervisor_name, supervisor_badge,
          duty_code, duty_name, schedule_date, start_time, end_time,
          depot, notes, status, started_at, assigned_by, assigned_by_name, is_override
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE
          status = 'active',
          started_at = NOW(),
          notes = VALUES(notes),
          is_override = TRUE`,
        [
          supervisor_id,
          supervisor.name,
          supervisor.badge_number,
          duty_code,
          `Duty ${duty_code}`,
          today,
          dutyTime.start,
          dutyTime.end,
          supervisor.depot,
          `[Force assigned] ${reason || ''} ${notes || ''}`.trim(),
          adminId,
          adminName
        ]
      );

      await connection.commit();
      connection.release();

      // Log activity with WebSocket broadcast (after transaction succeeds)
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.DUTY_FORCE_ASSIGNED,
        action: `force-assigned Duty ${duty_code} to ${supervisor.name}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: adminId,
        actorName: adminName,
        entityType: ENTITY_TYPES.DUTY,
        entityId: String(scheduleResult.insertId || ''),
        entityDetails: {
          previous_duty: previousDuty,
          new_duty: duty_code,
          reason: reason,
          supervisor_name: supervisor.name,
          supervisor_badge: supervisor.badge_number
        },
        depot: supervisor.depot,
        severity: SEVERITY_LEVELS.WARNING,
        source: 'admin_panel',
        icon: '⚡'
      });

      res.json({
        success: true,
        message: `Duty ${duty_code} force-assigned to ${supervisor.name}`,
        previous_duty: previousDuty,
        new_duty: duty_code,
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          badge_number: supervisor.badge_number
        }
      });

    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error('Error force-assigning duty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force-assign duty',
      details: error.message
    });
  }
});

// ============================================
// DUTY OVERRIDE ENDPOINTS (Phase 5.3)
// ============================================

/**
 * POST /api/admin/duty/override
 * Override a supervisor's current duty with a different one
 */
router.post('/override', async (req, res) => {
  try {
    const {
      supervisor_id,
      new_duty_code,
      reason,
      effective_immediately = true
    } = req.body;

    if (!supervisor_id || !new_duty_code || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supervisor_id, new_duty_code, reason'
      });
    }

    // Get current supervisor state
    const [supervisorResult] = await db.query(
      `SELECT s.id, s.name, s.badge_number, s.depot, s.current_duty, s.duty_start_time,
              ds.id as schedule_id, ds.duty_code as scheduled_duty
       FROM supervisors s
       LEFT JOIN duty_schedules ds ON s.id = ds.supervisor_id
         AND ds.schedule_date = CURDATE()
         AND ds.status = 'active'
       WHERE s.id = ?`,
      [supervisor_id]
    );

    if (supervisorResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];
    const previousDuty = supervisor.current_duty;
    const adminId = req.user?.id || null;
    const adminName = req.user?.name || 'System';
    const today = new Date().toISOString().split('T')[0];

    const dutyTimes = {
      '100': { start: '06:00:00', end: '15:30:00' },
      '200': { start: '07:30:00', end: '17:00:00' },
      '400': { start: '12:30:00', end: '22:00:00' },
      '500': { start: '14:45:00', end: '00:15:00' }
    };

    const dutyTime = dutyTimes[new_duty_code] || { start: '00:00:00', end: '23:59:59' };

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Mark current schedule as overridden
      if (supervisor.schedule_id) {
        await connection.query(
          `UPDATE duty_schedules
           SET status = 'completed',
               ended_at = NOW(),
               notes = CONCAT(IFNULL(notes, ''), '\n[Overridden: ${reason}]')
           WHERE id = ?`,
          [supervisor.schedule_id]
        );
      }

      // 2. Update supervisor duty if effective immediately
      if (effective_immediately) {
        await connection.query(
          `UPDATE supervisors
           SET current_duty = ?, duty_start_time = NOW()
           WHERE id = ?`,
          [new_duty_code, supervisor_id]
        );
      }

      // 3. Create override schedule
      await connection.query(
        `INSERT INTO duty_schedules (
          supervisor_id, supervisor_name, supervisor_badge,
          duty_code, duty_name, schedule_date, start_time, end_time,
          depot, notes, status, started_at, assigned_by, assigned_by_name, is_override
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          supervisor_id,
          supervisor.name,
          supervisor.badge_number,
          new_duty_code,
          `Duty ${new_duty_code} (Override)`,
          today,
          dutyTime.start,
          dutyTime.end,
          supervisor.depot,
          `[Override] Reason: ${reason}\nPrevious duty: ${previousDuty || 'None'}`,
          effective_immediately ? 'active' : 'scheduled',
          effective_immediately ? new Date() : null,
          adminId,
          adminName
        ]
      );

      await connection.commit();
      connection.release();

      // Log activity with WebSocket broadcast (after transaction succeeds)
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.DUTY_OVERRIDE,
        action: `overrode duty: ${previousDuty || 'None'} → ${new_duty_code}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: adminId,
        actorName: adminName,
        entityType: ENTITY_TYPES.DUTY,
        entityId: String(supervisor.id),
        entityDetails: {
          previous_duty: previousDuty,
          new_duty: new_duty_code,
          reason: reason,
          effective_immediately: effective_immediately,
          supervisor_name: supervisor.name,
          supervisor_badge: supervisor.badge_number
        },
        depot: supervisor.depot,
        severity: SEVERITY_LEVELS.WARNING,
        source: 'admin_panel',
        icon: '🔄'
      });

      res.json({
        success: true,
        message: `Duty overridden: ${previousDuty || 'None'} → ${new_duty_code}`,
        override: {
          supervisor_id: supervisor.id,
          supervisor_name: supervisor.name,
          previous_duty: previousDuty,
          new_duty: new_duty_code,
          reason: reason,
          effective_immediately: effective_immediately
        }
      });

    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error('Error overriding duty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to override duty',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/duty/end-shift
 * End a supervisor's current shift
 */
router.post('/end-shift', async (req, res) => {
  try {
    const {
      supervisor_id,
      reason,
      notes
    } = req.body;

    if (!supervisor_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: supervisor_id'
      });
    }

    const [supervisorResult] = await db.query(
      `SELECT id, name, badge_number, depot, current_duty
       FROM supervisors WHERE id = ?`,
      [supervisor_id]
    );

    if (supervisorResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const supervisor = supervisorResult[0];
    const endedDuty = supervisor.current_duty;
    const adminId = req.user?.id || null;
    const adminName = req.user?.name || 'System';
    const today = new Date().toISOString().split('T')[0];

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Clear supervisor's current duty
      await connection.query(
        `UPDATE supervisors
         SET current_duty = NULL, duty_start_time = NULL
         WHERE id = ?`,
        [supervisor_id]
      );

      // 2. End any active schedules for today
      await connection.query(
        `UPDATE duty_schedules
         SET status = 'completed',
             ended_at = NOW(),
             notes = CONCAT(IFNULL(notes, ''), '\n[Shift ended by admin: ${reason || 'Manual end'}]')
         WHERE supervisor_id = ? AND schedule_date = ? AND status = 'active'`,
        [supervisor_id, today]
      );

      await connection.commit();
      connection.release();

      // Log activity with WebSocket broadcast (after transaction succeeds)
      await activityLogger.logActivity({
        activityType: ACTIVITY_TYPES.DUTY_ENDED,
        action: `ended shift${reason ? `: ${reason}` : ''}`,
        actorType: ACTOR_TYPES.ADMIN,
        actorId: adminId,
        actorName: adminName,
        entityType: ENTITY_TYPES.DUTY,
        entityId: String(supervisor.id),
        entityDetails: {
          ended_duty: endedDuty,
          reason: reason,
          notes: notes,
          supervisor_name: supervisor.name,
          supervisor_badge: supervisor.badge_number
        },
        depot: supervisor.depot,
        severity: SEVERITY_LEVELS.NORMAL,
        source: 'admin_panel',
        icon: '🏁'
      });

      res.json({
        success: true,
        message: `Shift ended for ${supervisor.name}`,
        ended_duty: endedDuty,
        supervisor: {
          id: supervisor.id,
          name: supervisor.name,
          badge_number: supervisor.badge_number
        }
      });

    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }

  } catch (error) {
    console.error('Error ending shift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end shift',
      details: error.message
    });
  }
});

export default router;
