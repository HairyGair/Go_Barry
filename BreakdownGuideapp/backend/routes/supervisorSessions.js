/**
 * Go BARRY Breakdown Management System
 *
 * Supervisor Session Management Routes
 * Handles real-time supervisor tracking for Control Room Display
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 */

import express from 'express';
import { from, insert, update, query } from '../utils/queryHelpers.js';
import { verifyToken, authenticateAdmin, authenticateSupervisor } from '../middleware/authMiddleware.js';
import webSocketHandler from './webSocketHandler.js';

const router = express.Router();

/**
 * GET /api/supervisor-sessions/active
 * Get all currently online supervisors with active sessions
 * Used by Control Room Display to show live supervisor presence
 */
router.get('/active', async (req, res) => {
  try {
    console.log('📊 Fetching active supervisor sessions');

    const activeSessions = await query(`
      SELECT
        ss.id,
        ss.supervisor_id,
        ss.supervisor_name,
        ss.email,
        ss.badge_number,
        ss.current_duty,
        ss.duty_start_time,
        ss.duty_end_time,
        ss.depot,
        ss.role,
        ss.login_time,
        ss.last_activity,
        TIMESTAMPDIFF(MINUTE, ss.login_time, NOW()) as session_duration_minutes,
        TIMESTAMPDIFF(MINUTE, NOW(), ss.duty_end_time) as duty_minutes_remaining
      FROM supervisor_sessions ss
      WHERE ss.is_online = TRUE
      ORDER BY ss.depot, ss.supervisor_name
    `);

    console.log(`✅ Found ${activeSessions.length} active supervisor sessions`);

    res.json({
      success: true,
      count: activeSessions.length,
      sessions: activeSessions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active supervisor sessions',
      details: error.message
    });
  }
});

/**
 * GET /api/supervisor-sessions/all
 * Get all supervisor sessions (including offline) - Admin only
 * Used for session history and reporting
 */
router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, depot = null, dutyCode = null } = req.query;

    let sql = `
      SELECT
        ss.*,
        TIMESTAMPDIFF(MINUTE, ss.login_time, COALESCE(ss.logout_time, NOW())) as session_duration_minutes
      FROM supervisor_sessions ss
      WHERE 1=1
    `;
    const params = [];

    if (depot) {
      sql += ' AND ss.depot = ?';
      params.push(depot);
    }

    if (dutyCode) {
      sql += ' AND ss.current_duty = ?';
      params.push(dutyCode);
    }

    sql += ' ORDER BY ss.login_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const sessions = await query(sql, params);

    res.json({
      success: true,
      count: sessions.length,
      sessions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching all sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor sessions',
      details: error.message
    });
  }
});

/**
 * POST /api/supervisor-sessions/login-session
 * Create or update supervisor session after successful login
 * Called by auth.js after login and duty selection
 */
router.post('/login-session', verifyToken, async (req, res) => {
  try {
    const { supervisorId, name, email, badgeNumber, depot, role, currentDuty, dutyStartTime, dutyEndTime } = req.body;

    console.log(`📝 Creating/updating session for ${name} (${badgeNumber})`);

    // Check if session already exists for this supervisor
    const existingSessions = await query(
      'SELECT id FROM supervisor_sessions WHERE supervisor_id = ? AND is_online = TRUE',
      [supervisorId]
    );

    if (existingSessions.length > 0) {
      // Close existing session (prevent multiple simultaneous sessions)
      const existingSessionId = existingSessions[0].id;
      console.log(`⚠️  Closing existing session ${existingSessionId} for ${name}`);

      await update('supervisor_sessions', {
        is_online: false,
        logout_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        session_duration_minutes: query(
          'SELECT TIMESTAMPDIFF(MINUTE, login_time, NOW()) FROM supervisor_sessions WHERE id = ?',
          [existingSessionId]
        )[0]
      }, {
        id: existingSessionId
      });
    }

    // Create new session
    const sessionData = {
      supervisor_id: supervisorId,
      supervisor_name: name,
      email: email,
      badge_number: badgeNumber,
      current_duty: currentDuty || null,
      duty_start_time: dutyStartTime || null,
      duty_end_time: dutyEndTime || null,
      depot: depot || null,
      role: role || 'supervisor',
      login_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      last_activity: new Date().toISOString().slice(0, 19).replace('T', ' '),
      is_online: true
    };

    await insert('supervisor_sessions', sessionData);

    console.log(`✅ Session created for ${name} (${badgeNumber})`);

    // Broadcast supervisor login event via WebSocket
    webSocketHandler.broadcast('control-room', {
      type: 'supervisor_login',
      data: {
        supervisor_id: supervisorId,
        name,
        badge_number: badgeNumber,
        depot,
        current_duty: currentDuty,
        duty_start_time: dutyStartTime,
        login_time: sessionData.login_time
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Session created successfully',
      session: sessionData
    });

  } catch (error) {
    console.error('❌ Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      details: error.message
    });
  }
});

/**
 * POST /api/supervisor-sessions/logout
 * End supervisor session on logout
 * Called by auth.js during logout
 */
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { supervisorId, name, badgeNumber } = req.body;

    console.log(`👋 Ending session for ${name} (${badgeNumber})`);

    // Find active session
    const activeSessions = await query(
      'SELECT id, login_time FROM supervisor_sessions WHERE supervisor_id = ? AND is_online = TRUE',
      [supervisorId]
    );

    if (activeSessions.length === 0) {
      console.warn(`⚠️  No active session found for supervisor ${supervisorId}`);
      return res.json({
        success: true,
        message: 'No active session to end'
      });
    }

    const session = activeSessions[0];
    const logoutTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Calculate session duration
    const durationResult = await query(
      'SELECT TIMESTAMPDIFF(MINUTE, login_time, ?) as duration FROM supervisor_sessions WHERE id = ?',
      [logoutTime, session.id]
    );
    const sessionDuration = durationResult[0]?.duration || 0;

    // Update session
    await update('supervisor_sessions', {
      is_online: false,
      logout_time: logoutTime,
      session_duration_minutes: sessionDuration
    }, {
      id: session.id
    });

    console.log(`✅ Session ended for ${name} (${badgeNumber}) - Duration: ${sessionDuration} minutes`);

    // Broadcast supervisor logout event via WebSocket
    webSocketHandler.broadcast('control-room', {
      type: 'supervisor_logout',
      data: {
        supervisor_id: supervisorId,
        name,
        badge_number: badgeNumber,
        logout_time: logoutTime,
        session_duration_minutes: sessionDuration
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Session ended successfully',
      session_duration_minutes: sessionDuration
    });

  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      details: error.message
    });
  }
});

/**
 * PUT /api/supervisor-sessions/:sessionId/update-duty
 * Update supervisor's current duty in active session
 * Called when supervisor changes duty mid-session
 */
router.put('/:sessionId/update-duty', authenticateSupervisor, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { currentDuty, dutyStartTime, dutyEndTime } = req.body;

    console.log(`🔄 Updating duty for session ${sessionId} to ${currentDuty}`);

    // Verify session exists and is online
    const sessions = await query(
      'SELECT * FROM supervisor_sessions WHERE id = ? AND is_online = TRUE',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
    }

    const session = sessions[0];

    // Update session duty
    await update('supervisor_sessions', {
      current_duty: currentDuty,
      duty_start_time: dutyStartTime,
      duty_end_time: dutyEndTime,
      last_activity: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }, {
      id: sessionId
    });

    console.log(`✅ Duty updated for session ${sessionId}`);

    // Broadcast duty change event via WebSocket
    webSocketHandler.broadcast('control-room', {
      type: 'supervisor_duty_change',
      data: {
        supervisor_id: session.supervisor_id,
        name: session.supervisor_name,
        badge_number: session.badge_number,
        old_duty: session.current_duty,
        new_duty: currentDuty,
        duty_start_time: dutyStartTime,
        duty_end_time: dutyEndTime
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Duty updated successfully',
      session_id: sessionId,
      current_duty: currentDuty
    });

  } catch (error) {
    console.error('❌ Error updating duty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update duty',
      details: error.message
    });
  }
});

/**
 * POST /api/supervisor-sessions/heartbeat
 * Update last_activity timestamp for session
 * Called periodically by frontend to indicate supervisor is still active
 */
router.post('/heartbeat', verifyToken, async (req, res) => {
  try {
    const { supervisorId } = req.body;

    // Update last_activity for active session
    await query(`
      UPDATE supervisor_sessions
      SET last_activity = NOW()
      WHERE supervisor_id = ? AND is_online = TRUE
    `, [supervisorId]);

    res.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating heartbeat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update heartbeat'
    });
  }
});

/**
 * GET /api/supervisor-sessions/stats
 * Get session statistics (admin only)
 * Useful for monitoring system usage
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN is_online = TRUE THEN 1 END) as active_sessions,
        COUNT(DISTINCT supervisor_id) as unique_supervisors,
        COUNT(DISTINCT depot) as active_depots,
        AVG(session_duration_minutes) as avg_session_duration_minutes,
        MAX(last_activity) as most_recent_activity
      FROM supervisor_sessions
      WHERE login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    const dutyBreakdown = await query(`
      SELECT
        current_duty,
        COUNT(*) as count
      FROM supervisor_sessions
      WHERE is_online = TRUE
      GROUP BY current_duty
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      stats: stats[0],
      duty_breakdown: dutyBreakdown,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching session stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session statistics'
    });
  }
});

/**
 * DELETE /api/supervisor-sessions/:sessionId
 * Force close a session (admin only)
 * Used for cleaning up stuck sessions or force logout
 */
router.delete('/:sessionId', authenticateAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`🔐 Admin force-closing session ${sessionId}`);

    const sessions = await query(
      'SELECT * FROM supervisor_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const session = sessions[0];

    // Calculate duration if session was online
    let sessionDuration = session.session_duration_minutes;
    if (session.is_online && !sessionDuration) {
      const durationResult = await query(
        'SELECT TIMESTAMPDIFF(MINUTE, login_time, NOW()) as duration FROM supervisor_sessions WHERE id = ?',
        [sessionId]
      );
      sessionDuration = durationResult[0]?.duration || 0;
    }

    // Close session
    await update('supervisor_sessions', {
      is_online: false,
      logout_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      session_duration_minutes: sessionDuration
    }, {
      id: sessionId
    });

    console.log(`✅ Session ${sessionId} force-closed by admin`);

    // Broadcast logout event
    webSocketHandler.broadcast('control-room', {
      type: 'supervisor_logout',
      data: {
        supervisor_id: session.supervisor_id,
        name: session.supervisor_name,
        badge_number: session.badge_number,
        forced: true,
        logout_time: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Session closed successfully',
      session_id: sessionId
    });

  } catch (error) {
    console.error('❌ Error force-closing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to close session'
    });
  }
});

export default router;
