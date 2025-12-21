/**
 * Duty Notes Routes
 * Handles shift notes/log operations for supervisors
 *
 * Features:
 * - Create notes during shift
 * - View notes history
 * - Filter by duty, date, priority
 * - Include in handover summaries
 * - Display in Activity Feed
 */

import express from 'express';
import { query, insert } from '../utils/queryHelpers.js';
import { activityLogger, ACTIVITY_TYPES, ACTOR_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

const router = express.Router();

// Activity type for duty notes
const DUTY_NOTE_ACTIVITY_TYPE = 'duty_note';

/**
 * POST /api/duty/notes
 * Create a new duty note
 */
router.post('/notes', async (req, res) => {
  try {
    const {
      note,
      note_type = 'general',
      breakdown_id,
      is_priority = false,
      duty_code,
      duty_start_time
    } = req.body;

    // Get supervisor info from request (set by auth middleware)
    const supervisorBadge = req.user?.badge_number || req.body.supervisor_badge;
    const supervisorName = req.user?.name || req.body.supervisor_name;
    const supervisorId = req.user?.id || req.body.supervisor_id;

    // Validate required fields
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    if (!supervisorBadge) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor badge is required'
      });
    }

    if (!duty_code) {
      return res.status(400).json({
        success: false,
        message: 'Duty code is required'
      });
    }

    // Insert note
    const noteData = {
      supervisor_id: supervisorId,
      supervisor_badge: supervisorBadge,
      supervisor_name: supervisorName,
      duty_code: duty_code,
      duty_start_time: duty_start_time ? new Date(duty_start_time) : null,
      note: note.trim(),
      note_type: note_type,
      breakdown_id: breakdown_id || null,
      is_priority: is_priority
    };

    const result = await insert('duty_notes', noteData);
    const noteId = result.insertId;

    // Log to activity feed
    await activityLogger.logActivity({
      activityType: DUTY_NOTE_ACTIVITY_TYPE,
      action: is_priority ? 'added priority note' : 'added shift note',
      actorType: ACTOR_TYPES.SUPERVISOR,
      actorId: supervisorBadge,
      actorName: supervisorName,
      entityType: 'duty_note',
      entityId: noteId.toString(),
      entityDetails: {
        note_preview: note.substring(0, 100),
        note_type: note_type,
        duty_code: duty_code
      },
      severity: is_priority ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.INFO,
      source: 'duty_notes',
      metadata: {
        note_id: noteId,
        breakdown_id: breakdown_id
      },
      icon: is_priority ? '📌' : '📝'
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: {
        id: noteId,
        ...noteData,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating duty note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/notes
 * Get duty notes with optional filters
 */
router.get('/notes', async (req, res) => {
  try {
    const {
      supervisor_badge,
      duty_code,
      note_type,
      is_priority,
      breakdown_id,
      date_from,
      date_to,
      limit = 50,
      offset = 0
    } = req.query;

    let sql = 'SELECT * FROM duty_notes WHERE 1=1';
    const params = [];

    // Apply filters
    if (supervisor_badge) {
      sql += ' AND supervisor_badge = ?';
      params.push(supervisor_badge);
    }

    if (duty_code) {
      sql += ' AND duty_code = ?';
      params.push(duty_code);
    }

    if (note_type) {
      sql += ' AND note_type = ?';
      params.push(note_type);
    }

    if (is_priority === 'true') {
      sql += ' AND is_priority = TRUE';
    }

    if (breakdown_id) {
      sql += ' AND breakdown_id = ?';
      params.push(breakdown_id);
    }

    if (date_from) {
      sql += ' AND created_at >= ?';
      params.push(new Date(date_from));
    }

    if (date_to) {
      sql += ' AND created_at <= ?';
      params.push(new Date(date_to));
    }

    // Order and pagination
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notes = await query(sql, params);

    // Get count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM duty_notes WHERE 1=1';
    const countParams = [];

    if (supervisor_badge) {
      countSql += ' AND supervisor_badge = ?';
      countParams.push(supervisor_badge);
    }

    if (duty_code) {
      countSql += ' AND duty_code = ?';
      countParams.push(duty_code);
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      notes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching duty notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/notes/current
 * Get notes for the current duty session
 */
router.get('/notes/current', async (req, res) => {
  try {
    const supervisorBadge = req.user?.badge_number || req.query.badge;
    const dutyCode = req.query.duty_code;

    if (!supervisorBadge) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor badge required'
      });
    }

    let sql = `
      SELECT * FROM duty_notes
      WHERE supervisor_badge = ?
    `;
    const params = [supervisorBadge];

    if (dutyCode) {
      sql += ' AND duty_code = ?';
      params.push(dutyCode);
    }

    // Only get notes from today
    sql += ' AND DATE(created_at) = CURDATE()';
    sql += ' ORDER BY created_at DESC';

    const notes = await query(sql, params);

    res.json({
      success: true,
      notes,
      count: notes.length
    });

  } catch (error) {
    console.error('❌ Error fetching current duty notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/notes/:id
 * Get a specific note by ID
 */
router.get('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notes = await query(
      'SELECT * FROM duty_notes WHERE id = ?',
      [id]
    );

    if (!notes || notes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.json({
      success: true,
      note: notes[0]
    });

  } catch (error) {
    console.error('❌ Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
      error: error.message
    });
  }
});

/**
 * PUT /api/duty/notes/:id
 * Update a note
 */
router.put('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, note_type, is_priority } = req.body;
    const supervisorBadge = req.user?.badge_number || req.body.supervisor_badge;

    // Verify note exists and belongs to this supervisor
    const existingNotes = await query(
      'SELECT * FROM duty_notes WHERE id = ?',
      [id]
    );

    if (!existingNotes || existingNotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const existingNote = existingNotes[0];

    // Check ownership
    if (existingNote.supervisor_badge !== supervisorBadge) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own notes'
      });
    }

    // Build update query
    const updates = [];
    const updateParams = [];

    if (note !== undefined) {
      updates.push('note = ?');
      updateParams.push(note.trim());
    }

    if (note_type !== undefined) {
      updates.push('note_type = ?');
      updateParams.push(note_type);
    }

    if (is_priority !== undefined) {
      updates.push('is_priority = ?');
      updateParams.push(is_priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    updateParams.push(id);

    await query(
      `UPDATE duty_notes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateParams
    );

    res.json({
      success: true,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
});

/**
 * DELETE /api/duty/notes/:id
 * Delete a note
 */
router.delete('/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorBadge = req.user?.badge_number || req.query.badge;

    // Verify note exists and belongs to this supervisor
    const existingNotes = await query(
      'SELECT * FROM duty_notes WHERE id = ?',
      [id]
    );

    if (!existingNotes || existingNotes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    const existingNote = existingNotes[0];

    // Check ownership (allow admins to delete any)
    const isAdmin = req.user?.role === 'admin';
    if (existingNote.supervisor_badge !== supervisorBadge && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own notes'
      });
    }

    await query('DELETE FROM duty_notes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/notes/search
 * Search notes by content
 */
router.get('/notes/search', async (req, res) => {
  try {
    const { q, supervisor_badge, duty_code, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let sql = `
      SELECT * FROM duty_notes
      WHERE note LIKE ?
    `;
    const params = [`%${q}%`];

    if (supervisor_badge) {
      sql += ' AND supervisor_badge = ?';
      params.push(supervisor_badge);
    }

    if (duty_code) {
      sql += ' AND duty_code = ?';
      params.push(duty_code);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const notes = await query(sql, params);

    res.json({
      success: true,
      notes,
      count: notes.length,
      query: q
    });

  } catch (error) {
    console.error('❌ Error searching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search notes',
      error: error.message
    });
  }
});

/**
 * GET /api/duty/notes/handover/:supervisorBadge
 * Get notes for handover summary (last shift's notes)
 */
router.get('/notes/handover/:supervisorBadge', async (req, res) => {
  try {
    const { supervisorBadge } = req.params;
    const { duty_code, hours_back = 12 } = req.query;

    let sql = `
      SELECT * FROM duty_notes
      WHERE supervisor_badge = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const params = [supervisorBadge, parseInt(hours_back)];

    if (duty_code) {
      sql += ' AND duty_code = ?';
      params.push(duty_code);
    }

    sql += ' ORDER BY is_priority DESC, created_at DESC';

    const notes = await query(sql, params);

    // Separate priority notes
    const priorityNotes = notes.filter(n => n.is_priority);
    const regularNotes = notes.filter(n => !n.is_priority);

    res.json({
      success: true,
      priority_notes: priorityNotes,
      regular_notes: regularNotes,
      total: notes.length
    });

  } catch (error) {
    console.error('❌ Error fetching handover notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch handover notes',
      error: error.message
    });
  }
});

export default router;
