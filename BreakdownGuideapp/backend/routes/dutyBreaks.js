/**
 * Duty Breaks Routes
 * Phase 2.3: Track supervisor breaks during shifts
 *
 * Provides:
 * - Start/end break functionality
 * - Break duration tracking
 * - Break history and reporting
 * - Active break status
 */

import express from 'express';
import { pool } from '../config/mysql.js';
import { logAuditEvent, ACTION_TYPES } from './dutyAudit.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Break type options
const BREAK_TYPES = {
  MEAL: 'meal',
  COMFORT: 'comfort',
  OTHER: 'other'
};

// Maximum break duration (minutes) before auto-alert
const MAX_BREAK_DURATION = 60;

// =====================================================
// POST /api/breaks/start - Start a break
// =====================================================
router.post('/start', async (req, res) => {
  try {
    const {
      supervisorId,
      supervisorBadge,
      supervisorName,
      dutyCode,
      breakType = 'other',
      notes
    } = req.body;

    // Validate required fields
    if (!supervisorId || !supervisorBadge || !dutyCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supervisorId, supervisorBadge, dutyCode'
      });
    }

    // Check if supervisor already on break
    const [existingBreak] = await pool.query(
      `SELECT id FROM duty_breaks
       WHERE supervisor_id = ? AND status = 'active' AND break_end IS NULL`,
      [supervisorId]
    );

    if (existingBreak.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor is already on break',
        activeBreakId: existingBreak[0].id
      });
    }

    const now = new Date();
    const shiftDate = now.toISOString().split('T')[0];

    // Create break record
    const [result] = await pool.query(
      `INSERT INTO duty_breaks (
        supervisor_id,
        supervisor_badge,
        supervisor_name,
        duty_code,
        shift_date,
        break_start,
        break_type,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, 'active', ?)`,
      [
        supervisorId,
        supervisorBadge,
        supervisorName || 'Unknown',
        dutyCode,
        shiftDate,
        breakType,
        notes || null
      ]
    );

    // Update supervisor's break status
    await pool.query(
      `UPDATE supervisors
       SET on_break = TRUE, break_start_time = NOW()
       WHERE id = ?`,
      [supervisorId]
    );

    // Log to audit trail
    await logAuditEvent({
      supervisorId,
      supervisorBadge,
      supervisorName,
      actionType: ACTION_TYPES.BREAK_START,
      dutyCode,
      notes: `Started ${breakType} break`,
      metadata: {
        breakId: result.insertId,
        breakType
      }
    });

    // Log to Activity Feed with WebSocket broadcast
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.BREAK_STARTED,
      action: `started ${breakType} break`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorBadge,
      actorName: supervisorName || 'Unknown',
      entityType: ENTITY_TYPES.BREAK,
      entityId: String(result.insertId),
      entityDetails: {
        break_type: breakType,
        duty_code: dutyCode,
        notes: notes
      },
      severity: SEVERITY_LEVELS.NORMAL,
      source: 'duty_system',
      icon: '☕'
    });

    console.log(`☕ Break started: ${supervisorName} (${supervisorBadge}) - ${breakType}`);

    res.json({
      success: true,
      breakId: result.insertId,
      message: 'Break started',
      breakStart: now.toISOString()
    });

  } catch (error) {
    console.error('Error starting break:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// POST /api/breaks/end - End a break
// =====================================================
router.post('/end', async (req, res) => {
  try {
    const { supervisorId, supervisorBadge, supervisorName, notes } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: supervisorId'
      });
    }

    // Find active break
    const [activeBreaks] = await pool.query(
      `SELECT id, break_start, duty_code, break_type
       FROM duty_breaks
       WHERE supervisor_id = ? AND status = 'active' AND break_end IS NULL
       ORDER BY break_start DESC
       LIMIT 1`,
      [supervisorId]
    );

    if (activeBreaks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active break found for supervisor'
      });
    }

    const activeBreak = activeBreaks[0];
    const breakStart = new Date(activeBreak.break_start);
    const breakEnd = new Date();
    const durationMinutes = Math.round((breakEnd - breakStart) / 60000);

    // Update break record
    await pool.query(
      `UPDATE duty_breaks
       SET break_end = NOW(),
           break_duration_minutes = ?,
           status = 'completed',
           notes = CONCAT_WS(' | ', notes, ?)
       WHERE id = ?`,
      [durationMinutes, notes || null, activeBreak.id]
    );

    // Update supervisor's break status and accumulate total
    await pool.query(
      `UPDATE supervisors
       SET on_break = FALSE,
           break_start_time = NULL,
           total_break_minutes_today = COALESCE(total_break_minutes_today, 0) + ?
       WHERE id = ?`,
      [durationMinutes, supervisorId]
    );

    // Log to audit trail
    await logAuditEvent({
      supervisorId,
      supervisorBadge,
      supervisorName,
      actionType: ACTION_TYPES.BREAK_END,
      dutyCode: activeBreak.duty_code,
      notes: `Ended ${activeBreak.break_type} break (${durationMinutes} minutes)`,
      metadata: {
        breakId: activeBreak.id,
        breakType: activeBreak.break_type,
        durationMinutes
      }
    });

    // Log to Activity Feed with WebSocket broadcast
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.BREAK_ENDED,
      action: `ended ${activeBreak.break_type} break (${durationMinutes} min)`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorBadge,
      actorName: supervisorName || 'Unknown',
      entityType: ENTITY_TYPES.BREAK,
      entityId: String(activeBreak.id),
      entityDetails: {
        break_type: activeBreak.break_type,
        duty_code: activeBreak.duty_code,
        duration_minutes: durationMinutes,
        break_start: breakStart.toISOString(),
        break_end: breakEnd.toISOString()
      },
      severity: SEVERITY_LEVELS.NORMAL,
      source: 'duty_system',
      icon: '▶️'
    });

    console.log(`▶️ Break ended: ${supervisorName || supervisorBadge} - ${durationMinutes} minutes`);

    res.json({
      success: true,
      breakId: activeBreak.id,
      message: 'Break ended',
      durationMinutes,
      breakStart: breakStart.toISOString(),
      breakEnd: breakEnd.toISOString()
    });

  } catch (error) {
    console.error('Error ending break:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/breaks/status/:supervisorId - Get break status
// =====================================================
router.get('/status/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;

    // Get supervisor's break status
    const [supervisor] = await pool.query(
      `SELECT on_break, break_start_time, total_break_minutes_today
       FROM supervisors
       WHERE id = ?`,
      [supervisorId]
    );

    if (supervisor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    const sup = supervisor[0];
    let currentBreakMinutes = 0;

    if (sup.on_break && sup.break_start_time) {
      currentBreakMinutes = Math.round(
        (new Date() - new Date(sup.break_start_time)) / 60000
      );
    }

    // Get active break details if on break
    let activeBreak = null;
    if (sup.on_break) {
      const [breaks] = await pool.query(
        `SELECT id, break_start, break_type, notes
         FROM duty_breaks
         WHERE supervisor_id = ? AND status = 'active'
         ORDER BY break_start DESC
         LIMIT 1`,
        [supervisorId]
      );
      if (breaks.length > 0) {
        activeBreak = {
          ...breaks[0],
          durationMinutes: currentBreakMinutes
        };
      }
    }

    res.json({
      success: true,
      onBreak: sup.on_break || false,
      breakStartTime: sup.break_start_time,
      currentBreakMinutes,
      totalBreakMinutesToday: sup.total_break_minutes_today || 0,
      activeBreak,
      isOverdue: currentBreakMinutes > MAX_BREAK_DURATION
    });

  } catch (error) {
    console.error('Error getting break status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/breaks/history/:supervisorBadge - Get break history
// =====================================================
router.get('/history/:supervisorBadge', async (req, res) => {
  try {
    const { supervisorBadge } = req.params;
    const { days = 7 } = req.query;

    const [breaks] = await pool.query(
      `SELECT
        id,
        duty_code,
        shift_date,
        break_start,
        break_end,
        break_duration_minutes,
        break_type,
        status,
        notes
      FROM duty_breaks
      WHERE supervisor_badge = ?
        AND shift_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY break_start DESC`,
      [supervisorBadge, parseInt(days)]
    );

    // Calculate summary
    const completedBreaks = breaks.filter(b => b.status === 'completed');
    const totalMinutes = completedBreaks.reduce(
      (sum, b) => sum + (b.break_duration_minutes || 0), 0
    );

    res.json({
      success: true,
      supervisorBadge,
      breaks,
      summary: {
        totalBreaks: completedBreaks.length,
        totalMinutes,
        averageMinutes: completedBreaks.length > 0
          ? Math.round(totalMinutes / completedBreaks.length)
          : 0,
        byType: {
          meal: completedBreaks.filter(b => b.break_type === 'meal').length,
          comfort: completedBreaks.filter(b => b.break_type === 'comfort').length,
          other: completedBreaks.filter(b => b.break_type === 'other').length
        }
      },
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error getting break history:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/breaks/today/:supervisorId - Get today's breaks
// =====================================================
router.get('/today/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;

    const [breaks] = await pool.query(
      `SELECT
        id,
        duty_code,
        break_start,
        break_end,
        break_duration_minutes,
        break_type,
        status,
        notes
      FROM duty_breaks
      WHERE supervisor_id = ?
        AND shift_date = CURDATE()
      ORDER BY break_start ASC`,
      [supervisorId]
    );

    const completedBreaks = breaks.filter(b => b.status === 'completed');
    const totalMinutes = completedBreaks.reduce(
      (sum, b) => sum + (b.break_duration_minutes || 0), 0
    );

    res.json({
      success: true,
      breaks,
      totalBreaks: completedBreaks.length,
      totalMinutes,
      hasActiveBreak: breaks.some(b => b.status === 'active')
    });

  } catch (error) {
    console.error('Error getting today\'s breaks:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// POST /api/breaks/cancel - Cancel an active break
// =====================================================
router.post('/cancel', async (req, res) => {
  try {
    const { supervisorId, reason } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: supervisorId'
      });
    }

    // Find and cancel active break
    const [result] = await pool.query(
      `UPDATE duty_breaks
       SET status = 'cancelled', notes = CONCAT_WS(' | ', notes, ?)
       WHERE supervisor_id = ? AND status = 'active'`,
      [reason ? `Cancelled: ${reason}` : 'Cancelled', supervisorId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active break to cancel'
      });
    }

    // Reset supervisor break status
    await pool.query(
      `UPDATE supervisors
       SET on_break = FALSE, break_start_time = NULL
       WHERE id = ?`,
      [supervisorId]
    );

    console.log(`❌ Break cancelled for supervisor ${supervisorId}`);

    res.json({
      success: true,
      message: 'Break cancelled'
    });

  } catch (error) {
    console.error('Error cancelling break:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/breaks/active - Get all active breaks (SDC view)
// =====================================================
router.get('/active', async (req, res) => {
  try {
    const [activeBreaks] = await pool.query(
      `SELECT
        db.id,
        db.supervisor_id,
        db.supervisor_badge,
        db.supervisor_name,
        db.duty_code,
        db.break_start,
        db.break_type,
        TIMESTAMPDIFF(MINUTE, db.break_start, NOW()) as minutes_on_break,
        s.depot
      FROM duty_breaks db
      LEFT JOIN supervisors s ON db.supervisor_id = s.id
      WHERE db.status = 'active'
        AND db.break_end IS NULL
      ORDER BY db.break_start ASC`
    );

    // Flag overdue breaks
    const breaksWithStatus = activeBreaks.map(b => ({
      ...b,
      isOverdue: b.minutes_on_break > MAX_BREAK_DURATION
    }));

    res.json({
      success: true,
      activeBreaks: breaksWithStatus,
      count: activeBreaks.length,
      overdueCount: breaksWithStatus.filter(b => b.isOverdue).length
    });

  } catch (error) {
    console.error('Error getting active breaks:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/breaks/daily-summary - Get daily break summary
// =====================================================
router.get('/daily-summary', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [summary] = await pool.query(
      `SELECT
        supervisor_badge,
        supervisor_name,
        duty_code,
        COUNT(*) as total_breaks,
        SUM(break_duration_minutes) as total_minutes,
        SUM(CASE WHEN break_type = 'meal' THEN break_duration_minutes ELSE 0 END) as meal_minutes,
        SUM(CASE WHEN break_type = 'comfort' THEN break_duration_minutes ELSE 0 END) as comfort_minutes,
        MIN(break_start) as first_break,
        MAX(break_end) as last_break
      FROM duty_breaks
      WHERE shift_date = ?
        AND status = 'completed'
      GROUP BY supervisor_badge, supervisor_name, duty_code
      ORDER BY supervisor_name`,
      [targetDate]
    );

    res.json({
      success: true,
      date: targetDate,
      summary,
      count: summary.length
    });

  } catch (error) {
    console.error('Error getting daily summary:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// Export break types for use in other modules
export { BREAK_TYPES, MAX_BREAK_DURATION };

export default router;
