/**
 * Duty Audit Routes
 * Phase 9.2: Comprehensive audit trail for duty actions
 *
 * Provides:
 * - Audit event logging (internal use)
 * - Query audit history (admin only)
 * - Generate compliance reports
 * - Export audit data
 */

import express from 'express';
import { pool } from '../config/mysql.js';

const router = express.Router();

// =====================================================
// Action Types Enum (must match database ENUM)
// =====================================================
const ACTION_TYPES = {
  DUTY_START: 'DUTY_START',
  DUTY_END: 'DUTY_END',
  DUTY_EXTEND: 'DUTY_EXTEND',
  DUTY_CHANGE: 'DUTY_CHANGE',
  DUTY_SKIP: 'DUTY_SKIP',
  HANDOVER_INITIATED: 'HANDOVER_INITIATED',
  HANDOVER_COMPLETED: 'HANDOVER_COMPLETED',
  HANDOVER_RECEIVED: 'HANDOVER_RECEIVED',
  HANDOVER_REJECTED: 'HANDOVER_REJECTED',
  OVERTIME_START: 'OVERTIME_START',
  OVERTIME_ALERT: 'OVERTIME_ALERT',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END',
  FORCE_ASSIGN: 'FORCE_ASSIGN',
  FORCE_END: 'FORCE_END',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  NOTE_ADDED: 'NOTE_ADDED',
  EXTENSION_REQUESTED: 'EXTENSION_REQUESTED',
  EXTENSION_APPROVED: 'EXTENSION_APPROVED',
  EXTENSION_DENIED: 'EXTENSION_DENIED'
};

// =====================================================
// Helper: Log Audit Event
// =====================================================
export async function logAuditEvent(eventData) {
  try {
    const {
      supervisorId,
      supervisorBadge,
      supervisorName,
      supervisorDepot,
      actionType,
      dutyCode,
      dutyName,
      previousDutyCode,
      shiftStartTime,
      shiftEndTime,
      actualStartTime,
      actualEndTime,
      overtimeMinutes,
      relatedSupervisorId,
      relatedSupervisorBadge,
      relatedBreakdownIds,
      ipAddress,
      userAgent,
      notes,
      metadata
    } = eventData;

    // Validate action type
    if (!Object.values(ACTION_TYPES).includes(actionType)) {
      console.error(`Invalid action type: ${actionType}`);
      return null;
    }

    const [result] = await pool.query(
      `INSERT INTO duty_audit_log (
        supervisor_id,
        supervisor_badge,
        supervisor_name,
        supervisor_depot,
        action_type,
        duty_code,
        duty_name,
        previous_duty_code,
        shift_start_time,
        shift_end_time,
        actual_start_time,
        actual_end_time,
        overtime_minutes,
        related_supervisor_id,
        related_supervisor_badge,
        related_breakdown_ids,
        ip_address,
        user_agent,
        notes,
        metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supervisorId,
        supervisorBadge,
        supervisorName,
        supervisorDepot || null,
        actionType,
        dutyCode || null,
        dutyName || null,
        previousDutyCode || null,
        shiftStartTime || null,
        shiftEndTime || null,
        actualStartTime || null,
        actualEndTime || null,
        overtimeMinutes || 0,
        relatedSupervisorId || null,
        relatedSupervisorBadge || null,
        relatedBreakdownIds ? JSON.stringify(relatedBreakdownIds) : null,
        ipAddress || null,
        userAgent || null,
        notes || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    console.log(`📋 Audit logged: ${actionType} by ${supervisorBadge}`);
    return result.insertId;
  } catch (error) {
    console.error('Error logging audit event:', error);
    return null;
  }
}

// =====================================================
// POST /api/audit/log - Log an audit event (internal)
// =====================================================
router.post('/log', async (req, res) => {
  try {
    const eventId = await logAuditEvent({
      ...req.body,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    if (eventId) {
      res.json({ success: true, eventId });
    } else {
      res.status(400).json({ success: false, error: 'Failed to log audit event' });
    }
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/recent - Get recent audit entries
// =====================================================
router.get('/recent', async (req, res) => {
  try {
    const { hours = 24, limit = 100 } = req.query;

    const [entries] = await pool.query(
      `SELECT
        id,
        supervisor_badge,
        supervisor_name,
        supervisor_depot,
        action_type,
        duty_code,
        duty_name,
        overtime_minutes,
        notes,
        created_at,
        TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
      FROM duty_audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit) || 100}`,
      [parseInt(hours)]
    );

    res.json({
      success: true,
      entries,
      count: entries.length,
      period: `${hours} hours`
    });
  } catch (error) {
    console.error('Error fetching recent audit:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/supervisor/:badge - Get supervisor history
// =====================================================
router.get('/supervisor/:badge', async (req, res) => {
  try {
    const { badge } = req.params;
    const { days = 30, limit = 500 } = req.query;

    const [entries] = await pool.query(
      `SELECT
        id,
        action_type,
        duty_code,
        duty_name,
        previous_duty_code,
        shift_start_time,
        shift_end_time,
        overtime_minutes,
        related_supervisor_badge,
        notes,
        created_at
      FROM duty_audit_log
      WHERE supervisor_badge = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit) || 500}`,
      [badge, parseInt(days)]
    );

    // Calculate summary stats
    const summary = {
      totalEvents: entries.length,
      dutyStarts: entries.filter(e => e.action_type === 'DUTY_START').length,
      dutyEnds: entries.filter(e => e.action_type === 'DUTY_END').length,
      extensions: entries.filter(e => e.action_type === 'DUTY_EXTEND').length,
      overtimeEvents: entries.filter(e => e.action_type.includes('OVERTIME')).length,
      handoversOut: entries.filter(e => e.action_type === 'HANDOVER_COMPLETED').length,
      handoversIn: entries.filter(e => e.action_type === 'HANDOVER_RECEIVED').length,
      totalOvertimeMinutes: entries.reduce((sum, e) => sum + (e.overtime_minutes || 0), 0)
    };

    res.json({
      success: true,
      badge,
      entries,
      summary,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching supervisor audit:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/daily-summary - Get daily summary
// =====================================================
router.get('/daily-summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const [summary] = await pool.query(
      `SELECT
        DATE(created_at) as audit_date,
        COUNT(DISTINCT supervisor_badge) as unique_supervisors,
        SUM(CASE WHEN action_type = 'DUTY_START' THEN 1 ELSE 0 END) as total_starts,
        SUM(CASE WHEN action_type = 'DUTY_END' THEN 1 ELSE 0 END) as total_ends,
        SUM(CASE WHEN action_type = 'DUTY_EXTEND' THEN 1 ELSE 0 END) as total_extensions,
        SUM(CASE WHEN action_type = 'OVERTIME_START' THEN 1 ELSE 0 END) as overtime_occurrences,
        SUM(CASE WHEN action_type = 'HANDOVER_COMPLETED' THEN 1 ELSE 0 END) as total_handovers,
        SUM(CASE WHEN action_type = 'DUTY_SKIP' THEN 1 ELSE 0 END) as view_only_logins,
        SUM(overtime_minutes) as total_overtime_minutes
      FROM duty_audit_log
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY audit_date DESC`,
      [parseInt(days)]
    );

    res.json({
      success: true,
      summary,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/overtime-report - Overtime tracking
// =====================================================
router.get('/overtime-report', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [report] = await pool.query(
      `SELECT
        supervisor_badge,
        supervisor_name,
        supervisor_depot,
        duty_code,
        duty_name,
        overtime_minutes,
        shift_start_time,
        shift_end_time,
        actual_end_time,
        notes,
        created_at as logged_at
      FROM duty_audit_log
      WHERE action_type IN ('OVERTIME_START', 'OVERTIME_ALERT', 'DUTY_END')
        AND overtime_minutes > 0
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY created_at DESC`,
      [parseInt(days)]
    );

    // Group by supervisor
    const bySupervisor = {};
    report.forEach(entry => {
      if (!bySupervisor[entry.supervisor_badge]) {
        bySupervisor[entry.supervisor_badge] = {
          name: entry.supervisor_name,
          depot: entry.supervisor_depot,
          totalOvertimeMinutes: 0,
          occurrences: []
        };
      }
      bySupervisor[entry.supervisor_badge].totalOvertimeMinutes += entry.overtime_minutes;
      bySupervisor[entry.supervisor_badge].occurrences.push(entry);
    });

    res.json({
      success: true,
      totalOvertimeMinutes: report.reduce((sum, e) => sum + e.overtime_minutes, 0),
      totalOccurrences: report.length,
      bySupervisor,
      report,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching overtime report:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/search - Search audit logs
// =====================================================
router.get('/search', async (req, res) => {
  try {
    const {
      badge,
      actionType,
      dutyCode,
      depot,
      startDate,
      endDate,
      limit = 200
    } = req.query;

    let query = `
      SELECT
        id,
        supervisor_badge,
        supervisor_name,
        supervisor_depot,
        action_type,
        duty_code,
        duty_name,
        overtime_minutes,
        related_supervisor_badge,
        notes,
        created_at
      FROM duty_audit_log
      WHERE 1=1
    `;
    const params = [];

    if (badge) {
      query += ` AND supervisor_badge = ?`;
      params.push(badge);
    }

    if (actionType) {
      query += ` AND action_type = ?`;
      params.push(actionType);
    }

    if (dutyCode) {
      query += ` AND duty_code = ?`;
      params.push(dutyCode);
    }

    if (depot) {
      query += ` AND supervisor_depot = ?`;
      params.push(depot);
    }

    if (startDate) {
      query += ` AND created_at >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit) || 500}`;

    const [entries] = await pool.query(query, params);

    res.json({
      success: true,
      entries,
      count: entries.length,
      filters: { badge, actionType, dutyCode, depot, startDate, endDate }
    });
  } catch (error) {
    console.error('Error searching audit logs:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/export - Export audit data as CSV
// =====================================================
router.get('/export', async (req, res) => {
  try {
    const { days = 30, format = 'csv' } = req.query;

    const [entries] = await pool.query(
      `SELECT
        id,
        supervisor_badge,
        supervisor_name,
        supervisor_depot,
        action_type,
        duty_code,
        duty_name,
        overtime_minutes,
        related_supervisor_badge,
        notes,
        created_at
      FROM duty_audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY created_at DESC`,
      [parseInt(days)]
    );

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID', 'Badge', 'Name', 'Depot', 'Action', 'Duty Code',
        'Duty Name', 'Overtime (min)', 'Related Badge', 'Notes', 'Timestamp'
      ];

      const csvRows = [headers.join(',')];

      entries.forEach(e => {
        const row = [
          e.id,
          e.supervisor_badge,
          `"${e.supervisor_name || ''}"`,
          e.supervisor_depot || '',
          e.action_type,
          e.duty_code || '',
          `"${e.duty_name || ''}"`,
          e.overtime_minutes || 0,
          e.related_supervisor_badge || '',
          `"${(e.notes || '').replace(/"/g, '""')}"`,
          e.created_at.toISOString()
        ];
        csvRows.push(row.join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=duty_audit_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvRows.join('\n'));
    } else {
      // JSON format
      res.json({
        success: true,
        entries,
        count: entries.length,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting audit:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// =====================================================
// GET /api/audit/action-types - List all action types
// =====================================================
router.get('/action-types', (req, res) => {
  res.json({
    success: true,
    actionTypes: Object.keys(ACTION_TYPES).map(key => ({
      value: ACTION_TYPES[key],
      label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    }))
  });
});

// Export ACTION_TYPES for use in other modules
export { ACTION_TYPES };

export default router;
