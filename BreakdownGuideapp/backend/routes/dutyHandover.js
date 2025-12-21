/**
 * Duty Handover Routes
 * Handles shift handover operations between supervisors
 *
 * Features:
 * - Submit handover with breakdown assignments
 * - Transfer breakdowns to incoming supervisor
 * - Generate handover summary
 * - Log handover activities
 */

import express from 'express';
import { query, insert } from '../utils/queryHelpers.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Activity type for handovers (add to activity types if not exists)
const HANDOVER_ACTIVITY_TYPE = 'duty_handover';

/**
 * POST /api/duty/handover
 * Submit a duty handover
 */
router.post('/handover', async (req, res) => {
  try {
    const {
      outgoing_supervisor,
      incoming_supervisor,
      breakdowns,
      general_notes,
      handover_time,
      duty_code,
      duty_end_time
    } = req.body;

    // Validate required fields
    if (!outgoing_supervisor || !outgoing_supervisor.badge) {
      return res.status(400).json({
        success: false,
        message: 'Outgoing supervisor information is required'
      });
    }

    // Create handover record
    const handoverData = {
      outgoing_supervisor_badge: outgoing_supervisor.badge,
      outgoing_supervisor_name: outgoing_supervisor.name,
      outgoing_duty_code: duty_code,
      incoming_supervisor_badge: incoming_supervisor?.badge || null,
      incoming_supervisor_name: incoming_supervisor?.name || null,
      general_notes: general_notes || null,
      breakdowns_count: breakdowns?.length || 0,
      handover_time: handover_time ? new Date(handover_time) : new Date(),
      status: 'completed'
    };

    // Insert handover record
    const handoverResult = await insert('duty_handovers', handoverData);
    const handoverId = handoverResult.insertId;

    // Process each breakdown
    const processedBreakdowns = [];
    if (breakdowns && breakdowns.length > 0) {
      for (const breakdown of breakdowns) {
        // Insert breakdown handover record
        await insert('handover_breakdowns', {
          handover_id: handoverId,
          breakdown_id: breakdown.breakdown_id || breakdown.id,
          fleet_no: breakdown.fleet_no,
          issue_category: breakdown.issue_category,
          severity: breakdown.severity,
          handover_notes: breakdown.note || null
        });

        // Update breakdown record with handover info (if incoming supervisor specified)
        if (incoming_supervisor?.badge) {
          await query(`
            UPDATE breakdowns
            SET
              handover_from = ?,
              handover_to = ?,
              handover_time = ?,
              handover_notes = ?,
              updated_at = NOW()
            WHERE breakdown_id = ? OR id = ?
          `, [
            outgoing_supervisor.badge,
            incoming_supervisor.badge,
            new Date(),
            breakdown.note || null,
            breakdown.breakdown_id,
            breakdown.id
          ]);
        }

        processedBreakdowns.push({
          id: breakdown.id,
          breakdown_id: breakdown.breakdown_id,
          fleet_no: breakdown.fleet_no,
          status: 'handed_over'
        });
      }
    }

    // Log handover activity
    await activityLogger.logActivity({
      activityType: HANDOVER_ACTIVITY_TYPE,
      action: incoming_supervisor?.name
        ? `handed over ${breakdowns?.length || 0} breakdowns to ${incoming_supervisor.name}`
        : `completed shift handover with ${breakdowns?.length || 0} breakdowns`,
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: outgoing_supervisor.badge,
      actorName: outgoing_supervisor.name,
      entityType: 'handover',
      entityId: handoverId.toString(),
      entityDetails: {
        breakdowns_count: breakdowns?.length || 0,
        incoming_supervisor: incoming_supervisor?.name || 'Next shift',
        duty_code: duty_code
      },
      severity: SEVERITY_LEVELS.INFO,
      source: 'duty_handover',
      metadata: {
        handover_id: handoverId,
        outgoing_duty: duty_code,
        breakdowns: processedBreakdowns.map(b => b.fleet_no),
        general_notes: general_notes
      },
      icon: '🔄'
    });

    // If incoming supervisor specified, log activity for them too
    if (incoming_supervisor?.badge) {
      await activityLogger.logActivity({
        activityType: HANDOVER_ACTIVITY_TYPE,
        action: `received handover of ${breakdowns?.length || 0} breakdowns from ${outgoing_supervisor.name}`,
        actorType: ACTOR_TYPES.SUPERVISOR,
        actorId: incoming_supervisor.badge,
        actorName: incoming_supervisor.name || 'Incoming Supervisor',
        entityType: 'handover',
        entityId: handoverId.toString(),
        entityDetails: {
          breakdowns_count: breakdowns?.length || 0,
          outgoing_supervisor: outgoing_supervisor.name,
          duty_code: duty_code
        },
        severity: SEVERITY_LEVELS.INFO,
        source: 'duty_handover',
        metadata: {
          handover_id: handoverId,
          breakdowns: processedBreakdowns.map(b => b.fleet_no)
        },
        icon: '📥'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Handover completed successfully',
      handover_id: handoverId,
      breakdowns_transferred: processedBreakdowns.length,
      summary: {
        outgoing: outgoing_supervisor.name,
        incoming: incoming_supervisor?.name || 'Next shift supervisor',
        duty_code: duty_code,
        breakdowns: processedBreakdowns
      }
    });

  } catch (error) {
    console.error('❌ Error processing handover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process handover',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/handover/:id
 * Get handover details by ID
 */
router.get('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get handover record
    const handovers = await query(
      'SELECT * FROM duty_handovers WHERE id = ?',
      [id]
    );

    if (!handovers || handovers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Handover not found'
      });
    }

    const handover = handovers[0];

    // Get associated breakdowns
    const breakdowns = await query(
      'SELECT * FROM handover_breakdowns WHERE handover_id = ?',
      [id]
    );

    res.json({
      success: true,
      handover: {
        ...handover,
        breakdowns
      }
    });

  } catch (error) {
    console.error('❌ Error fetching handover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handover',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/handovers
 * Get handover history with optional filters
 */
router.get('/handovers', async (req, res) => {
  try {
    const {
      supervisor_badge,
      date_from,
      date_to,
      limit = 20,
      offset = 0
    } = req.query;

    let sql = 'SELECT * FROM duty_handovers WHERE 1=1';
    const params = [];

    if (supervisor_badge) {
      sql += ' AND (outgoing_supervisor_badge = ? OR incoming_supervisor_badge = ?)';
      params.push(supervisor_badge, supervisor_badge);
    }

    if (date_from) {
      sql += ' AND handover_time >= ?';
      params.push(new Date(date_from));
    }

    if (date_to) {
      sql += ' AND handover_time <= ?';
      params.push(new Date(date_to));
    }

    sql += ' ORDER BY handover_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const handovers = await query(sql, params);

    // Get count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM duty_handovers WHERE 1=1';
    const countParams = [];

    if (supervisor_badge) {
      countSql += ' AND (outgoing_supervisor_badge = ? OR incoming_supervisor_badge = ?)';
      countParams.push(supervisor_badge, supervisor_badge);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      handovers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching handovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handovers',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/handover/pending
 * Get pending handovers (received but not acknowledged)
 */
router.get('/handover/pending', async (req, res) => {
  try {
    const supervisorBadge = req.user?.badge_number || req.query.badge;

    if (!supervisorBadge) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor badge required'
      });
    }

    const pendingHandovers = await query(`
      SELECT h.*, GROUP_CONCAT(hb.fleet_no) as fleet_numbers
      FROM duty_handovers h
      LEFT JOIN handover_breakdowns hb ON h.id = hb.handover_id
      WHERE h.incoming_supervisor_badge = ?
        AND h.acknowledged_at IS NULL
      GROUP BY h.id
      ORDER BY h.handover_time DESC
    `, [supervisorBadge]);

    res.json({
      success: true,
      pending_handovers: pendingHandovers,
      count: pendingHandovers.length
    });

  } catch (error) {
    console.error('❌ Error fetching pending handovers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending handovers',
      error: error.message
    });
  }
});

/**
 * POST /api/duty/handover/:id/acknowledge
 * Acknowledge receipt of a handover
 */
router.post('/handover/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorBadge = req.user?.badge_number || req.body.badge;

    // Update handover as acknowledged
    await query(`
      UPDATE duty_handovers
      SET acknowledged_at = NOW(), acknowledged_by = ?
      WHERE id = ? AND incoming_supervisor_badge = ?
    `, [supervisorBadge, id, supervisorBadge]);

    // Log acknowledgment
    await activityLogger.logActivity({
      activityType: HANDOVER_ACTIVITY_TYPE,
      action: 'acknowledged handover receipt',
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorBadge,
      entityType: 'handover',
      entityId: id,
      severity: SEVERITY_LEVELS.SUCCESS,
      source: 'duty_handover',
      icon: '✓'
    });

    res.json({
      success: true,
      message: 'Handover acknowledged'
    });

  } catch (error) {
    console.error('❌ Error acknowledging handover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge handover',
      error: error.message
    });
  }
});

export default router;
