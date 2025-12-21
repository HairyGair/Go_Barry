/**
 * Duty Extensions Routes
 * Phase 2.5: Request and manage duty shift extensions
 *
 * Provides:
 * - Request extension functionality
 * - Approve/deny extension (admin/manager)
 * - Extension history and status
 * - Active extension status
 */

import express from 'express';
import { pool } from '../config/mysql.js';
import { logAuditEvent, ACTION_TYPES } from './dutyAudit.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, ENTITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Extension duration options (minutes)
const EXTENSION_OPTIONS = [30, 60, 90, 120];

// =====================================================
// POST /api/extensions/request - Request a duty extension
// =====================================================
router.post('/request', async (req, res) => {
  try {
    const {
      supervisorId,
      supervisorBadge,
      supervisorName,
      dutyCode,
      originalEndTime,
      extensionMinutes,
      reason
    } = req.body;

    // Validate required fields
    if (!supervisorId || !supervisorBadge || !dutyCode || !extensionMinutes || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: supervisorId, supervisorBadge, dutyCode, extensionMinutes, reason'
      });
    }

    // Validate extension duration
    if (!EXTENSION_OPTIONS.includes(parseInt(extensionMinutes))) {
      return res.status(400).json({
        success: false,
        error: `Invalid extension duration. Valid options: ${EXTENSION_OPTIONS.join(', ')} minutes`
      });
    }

    // Check for existing pending request
    const [existingRequest] = await pool.query(
      `SELECT id FROM duty_extensions
       WHERE supervisor_id = ? AND status = 'pending' AND shift_date = CURDATE()`,
      [supervisorId]
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending extension request for today',
        existingRequestId: existingRequest[0].id
      });
    }

    const now = new Date();
    const shiftDate = now.toISOString().split('T')[0];

    // Calculate new end time
    const [hourStr, minStr] = originalEndTime.split(':');
    const originalEnd = new Date();
    originalEnd.setHours(parseInt(hourStr), parseInt(minStr), 0, 0);
    const newEnd = new Date(originalEnd.getTime() + extensionMinutes * 60000);
    const newEndTime = `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}`;

    // Create extension request
    const [result] = await pool.query(
      `INSERT INTO duty_extensions (
        supervisor_id,
        supervisor_badge,
        supervisor_name,
        duty_code,
        shift_date,
        original_end_time,
        new_end_time,
        extension_minutes,
        reason,
        request_time,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')`,
      [
        supervisorId,
        supervisorBadge,
        supervisorName || 'Unknown',
        dutyCode,
        shiftDate,
        originalEndTime,
        newEndTime,
        extensionMinutes,
        reason
      ]
    );

    // Log to audit trail
    await logAuditEvent({
      supervisorId,
      supervisorBadge,
      supervisorName,
      actionType: ACTION_TYPES.EXTENSION_REQUESTED,
      dutyCode,
      notes: `Requested ${extensionMinutes} minute extension: ${reason}`,
      metadata: {
        extensionId: result.insertId,
        extensionMinutes,
        originalEndTime,
        newEndTime
      }
    });

    // Log to Activity Feed with WebSocket broadcast
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.EXTENSION_REQUESTED,
      action: `requested ${extensionMinutes} minute extension`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorBadge,
      actorName: supervisorName || 'Unknown',
      entityType: ENTITY_TYPES.EXTENSION,
      entityId: String(result.insertId),
      entityDetails: {
        duty_code: dutyCode,
        extension_minutes: extensionMinutes,
        original_end_time: originalEndTime,
        new_end_time: newEndTime,
        reason: reason
      },
      severity: SEVERITY_LEVELS.NORMAL,
      source: 'duty_system',
      icon: '📝'
    });

    console.log(`📝 Extension requested: ${supervisorName} (${supervisorBadge}) - ${extensionMinutes}m`);

    res.json({
      success: true,
      extensionId: result.insertId,
      message: 'Extension request submitted',
      status: 'pending',
      newEndTime
    });

  } catch (error) {
    console.error('Error requesting extension:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// POST /api/extensions/:id/approve - Approve an extension
// =====================================================
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, approverName, notes } = req.body;

    if (!approverId || !approverName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: approverId, approverName'
      });
    }

    // Get extension details
    const [extensions] = await pool.query(
      `SELECT * FROM duty_extensions WHERE id = ?`,
      [id]
    );

    if (extensions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Extension request not found'
      });
    }

    const extension = extensions[0];

    if (extension.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Extension request is already ${extension.status}`
      });
    }

    // Update extension status
    await pool.query(
      `UPDATE duty_extensions
       SET status = 'approved',
           approved_by_id = ?,
           approved_by_name = ?,
           approval_time = NOW(),
           approval_notes = ?
       WHERE id = ?`,
      [approverId, approverName, notes || null, id]
    );

    // Update supervisor's extended shift status
    await pool.query(
      `UPDATE supervisors
       SET shift_extended = TRUE, extended_end_time = ?
       WHERE id = ?`,
      [extension.new_end_time, extension.supervisor_id]
    );

    // Log to audit trail
    await logAuditEvent({
      supervisorId: approverId,
      supervisorBadge: 'ADMIN',
      supervisorName: approverName,
      actionType: ACTION_TYPES.EXTENSION_APPROVED,
      dutyCode: extension.duty_code,
      notes: `Approved ${extension.extension_minutes}m extension for ${extension.supervisor_name}`,
      metadata: {
        extensionId: id,
        targetSupervisorId: extension.supervisor_id,
        targetSupervisorBadge: extension.supervisor_badge,
        extensionMinutes: extension.extension_minutes
      }
    });

    // Log to Activity Feed with WebSocket broadcast
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.EXTENSION_APPROVED,
      action: `approved ${extension.extension_minutes}m extension for ${extension.supervisor_name}`,
      actorType: ACTOR_TYPES.ADMIN,
      actorId: approverId,
      actorName: approverName,
      entityType: ENTITY_TYPES.EXTENSION,
      entityId: String(id),
      entityDetails: {
        duty_code: extension.duty_code,
        extension_minutes: extension.extension_minutes,
        new_end_time: extension.new_end_time,
        target_supervisor: extension.supervisor_name,
        target_badge: extension.supervisor_badge,
        notes: notes
      },
      severity: SEVERITY_LEVELS.SUCCESS,
      source: 'admin_panel',
      icon: '✅'
    });

    console.log(`✅ Extension approved: ${extension.supervisor_name} by ${approverName}`);

    res.json({
      success: true,
      message: 'Extension approved',
      extensionId: id,
      newEndTime: extension.new_end_time
    });

  } catch (error) {
    console.error('Error approving extension:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// POST /api/extensions/:id/deny - Deny an extension
// =====================================================
router.post('/:id/deny', async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, approverName, notes } = req.body;

    if (!approverId || !approverName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: approverId, approverName'
      });
    }

    // Get extension details
    const [extensions] = await pool.query(
      `SELECT * FROM duty_extensions WHERE id = ?`,
      [id]
    );

    if (extensions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Extension request not found'
      });
    }

    const extension = extensions[0];

    if (extension.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Extension request is already ${extension.status}`
      });
    }

    // Update extension status
    await pool.query(
      `UPDATE duty_extensions
       SET status = 'denied',
           approved_by_id = ?,
           approved_by_name = ?,
           approval_time = NOW(),
           approval_notes = ?
       WHERE id = ?`,
      [approverId, approverName, notes || 'Request denied', id]
    );

    // Log to audit trail
    await logAuditEvent({
      supervisorId: approverId,
      supervisorBadge: 'ADMIN',
      supervisorName: approverName,
      actionType: ACTION_TYPES.EXTENSION_DENIED,
      dutyCode: extension.duty_code,
      notes: `Denied ${extension.extension_minutes}m extension for ${extension.supervisor_name}. Reason: ${notes || 'Not specified'}`,
      metadata: {
        extensionId: id,
        targetSupervisorId: extension.supervisor_id,
        targetSupervisorBadge: extension.supervisor_badge,
        extensionMinutes: extension.extension_minutes
      }
    });

    // Log to Activity Feed with WebSocket broadcast
    await activityLogger.logActivity({
      activityType: ACTIVITY_TYPES.EXTENSION_DENIED,
      action: `denied ${extension.extension_minutes}m extension for ${extension.supervisor_name}`,
      actorType: ACTOR_TYPES.ADMIN,
      actorId: approverId,
      actorName: approverName,
      entityType: ENTITY_TYPES.EXTENSION,
      entityId: String(id),
      entityDetails: {
        duty_code: extension.duty_code,
        extension_minutes: extension.extension_minutes,
        target_supervisor: extension.supervisor_name,
        target_badge: extension.supervisor_badge,
        denial_reason: notes || 'Not specified'
      },
      severity: SEVERITY_LEVELS.WARNING,
      source: 'admin_panel',
      icon: '❌'
    });

    console.log(`❌ Extension denied: ${extension.supervisor_name} by ${approverName}`);

    res.json({
      success: true,
      message: 'Extension denied',
      extensionId: id
    });

  } catch (error) {
    console.error('Error denying extension:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// POST /api/extensions/:id/cancel - Cancel own request
// =====================================================
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId, supervisorBadge, supervisorName } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: supervisorId'
      });
    }

    // Verify the request belongs to this supervisor and is pending
    const [extensions] = await pool.query(
      `SELECT * FROM duty_extensions
       WHERE id = ? AND supervisor_id = ? AND status = 'pending'`,
      [id, supervisorId]
    );

    if (extensions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Extension request not found or cannot be cancelled'
      });
    }

    const extension = extensions[0];

    // Update status to cancelled
    await pool.query(
      `UPDATE duty_extensions SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    console.log(`🚫 Extension cancelled by ${supervisorName || supervisorBadge}`);

    res.json({
      success: true,
      message: 'Extension request cancelled',
      extensionId: id
    });

  } catch (error) {
    console.error('Error cancelling extension:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/extensions/status/:supervisorId - Get extension status
// =====================================================
router.get('/status/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;

    // Get supervisor's extension status
    const [supervisor] = await pool.query(
      `SELECT shift_extended, extended_end_time
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

    // Get any pending or today's approved extensions
    const [extensions] = await pool.query(
      `SELECT id, status, extension_minutes, original_end_time, new_end_time, reason, request_time
       FROM duty_extensions
       WHERE supervisor_id = ?
         AND shift_date = CURDATE()
       ORDER BY request_time DESC
       LIMIT 1`,
      [supervisorId]
    );

    res.json({
      success: true,
      shiftExtended: supervisor[0].shift_extended || false,
      extendedEndTime: supervisor[0].extended_end_time,
      currentRequest: extensions.length > 0 ? extensions[0] : null
    });

  } catch (error) {
    console.error('Error getting extension status:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/extensions/pending - Get all pending extensions (admin)
// =====================================================
router.get('/pending', async (req, res) => {
  try {
    const [pendingExtensions] = await pool.query(
      `SELECT * FROM v_pending_extensions`
    );

    res.json({
      success: true,
      pendingExtensions,
      count: pendingExtensions.length
    });

  } catch (error) {
    console.error('Error getting pending extensions:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/extensions/history/:supervisorBadge - Get extension history
// =====================================================
router.get('/history/:supervisorBadge', async (req, res) => {
  try {
    const { supervisorBadge } = req.params;
    const { days = 30 } = req.query;

    const [extensions] = await pool.query(
      `SELECT
        id,
        duty_code,
        shift_date,
        original_end_time,
        new_end_time,
        extension_minutes,
        reason,
        status,
        approved_by_name,
        approval_notes,
        request_time,
        approval_time
      FROM duty_extensions
      WHERE supervisor_badge = ?
        AND shift_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY request_time DESC`,
      [supervisorBadge, parseInt(days)]
    );

    // Calculate summary
    const approved = extensions.filter(e => e.status === 'approved');
    const denied = extensions.filter(e => e.status === 'denied');
    const pending = extensions.filter(e => e.status === 'pending');

    const totalApprovedMinutes = approved.reduce(
      (sum, e) => sum + (e.extension_minutes || 0), 0
    );

    res.json({
      success: true,
      supervisorBadge,
      extensions,
      summary: {
        totalRequests: extensions.length,
        approved: approved.length,
        denied: denied.length,
        pending: pending.length,
        approvalRate: extensions.length > 0
          ? Math.round((approved.length / (approved.length + denied.length)) * 100) || 0
          : 0,
        totalApprovedMinutes,
        avgExtensionMinutes: approved.length > 0
          ? Math.round(totalApprovedMinutes / approved.length)
          : 0
      },
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error getting extension history:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/extensions/today - Get today's extensions
// =====================================================
router.get('/today', async (req, res) => {
  try {
    const [extensions] = await pool.query(
      `SELECT
        de.id,
        de.supervisor_id,
        de.supervisor_badge,
        de.supervisor_name,
        de.duty_code,
        de.extension_minutes,
        de.original_end_time,
        de.new_end_time,
        de.reason,
        de.status,
        de.request_time,
        de.approval_time,
        de.approved_by_name,
        s.depot
      FROM duty_extensions de
      LEFT JOIN supervisors s ON de.supervisor_id = s.id
      WHERE de.shift_date = CURDATE()
      ORDER BY de.request_time DESC`
    );

    const pending = extensions.filter(e => e.status === 'pending');
    const approved = extensions.filter(e => e.status === 'approved');
    const denied = extensions.filter(e => e.status === 'denied');

    res.json({
      success: true,
      extensions,
      summary: {
        total: extensions.length,
        pending: pending.length,
        approved: approved.length,
        denied: denied.length,
        totalApprovedMinutes: approved.reduce((sum, e) => sum + e.extension_minutes, 0)
      }
    });

  } catch (error) {
    console.error('Error getting today\'s extensions:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// =====================================================
// GET /api/extensions/options - Get extension duration options
// =====================================================
router.get('/options', (req, res) => {
  res.json({
    success: true,
    options: EXTENSION_OPTIONS.map(mins => ({
      value: mins,
      label: mins >= 60 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`
    }))
  });
});


// Export extension options for use in other modules
export { EXTENSION_OPTIONS };

export default router;
