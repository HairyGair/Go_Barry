/**
 * Go BARRY Breakdown Management System
 * Login Analytics Routes
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * Features:
 * - Track all login attempts (success and failure)
 * - Record session duration and logout times
 * - Provide admin dashboard with login statistics
 * - Security monitoring for failed login attempts
 * - User-specific login history
 * - Hourly login distribution analysis
 *
 * @author Anthony Gair
 * @license Proprietary
 * @version 1.0.0
 */

import express from 'express';
import { query } from '../config/mysql.js';
import { authenticateAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Helper: Extract IP address from request
 * Handles proxies and direct connections
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Helper: Extract user agent from request
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * POST /api/analytics/log-login
 * Log a login attempt (success or failure)
 *
 * Body:
 * {
 *   email: string,
 *   success: boolean,
 *   sessionId?: string (for successful logins)
 * }
 *
 * Called by frontend after every login attempt
 */
router.post('/log-login', async (req, res) => {
  try {
    const { email, success } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (typeof success !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Success status (boolean) is required'
      });
    }

    // Extract security metadata
    const ip_address = getClientIP(req);
    const user_agent = getUserAgent(req);

    console.log(`📊 Login analytics: ${email} - ${success ? 'SUCCESS' : 'FAILED'} from ${ip_address}`);

    // Insert login record
    const result = await query(
      `INSERT INTO login_analytics (email, success, ip_address, user_agent, login_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [email, success, ip_address, user_agent]
    );

    // Return the analytics record ID for future updates (logout tracking)
    res.json({
      success: true,
      analyticsId: result.insertId,
      message: 'Login attempt logged successfully'
    });

  } catch (error) {
    console.error('❌ Error logging login attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log login attempt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/analytics/log-logout
 * Update session duration when user logs out
 *
 * Body:
 * {
 *   email: string,
 *   analyticsId?: number (optional - if you stored it on login)
 * }
 *
 * Called by frontend when user logs out
 */
router.post('/log-logout', async (req, res) => {
  try {
    const { email, analyticsId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log(`📊 Logout analytics: ${email}`);

    // Find the most recent successful login without a logout time
    let updateQuery, updateParams;

    if (analyticsId) {
      // If we have the specific analytics ID, update that record
      updateQuery = `
        UPDATE login_analytics
        SET logout_time = NOW(),
            session_duration = TIMESTAMPDIFF(MINUTE, login_time, NOW())
        WHERE id = ? AND email = ?
      `;
      updateParams = [analyticsId, email];
    } else {
      // Otherwise, update the most recent successful login for this user
      updateQuery = `
        UPDATE login_analytics
        SET logout_time = NOW(),
            session_duration = TIMESTAMPDIFF(MINUTE, login_time, NOW())
        WHERE email = ?
          AND success = TRUE
          AND logout_time IS NULL
        ORDER BY login_time DESC
        LIMIT 1
      `;
      updateParams = [email];
    }

    const result = await query(updateQuery, updateParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active session found to update'
      });
    }

    res.json({
      success: true,
      message: 'Logout logged successfully',
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('❌ Error logging logout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log logout',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/dashboard
 * Get comprehensive login analytics dashboard (Admin only)
 *
 * Query params:
 * - period: 'today' | 'week' | 'month' (default: 'today')
 *
 * Returns:
 * - Total logins (success + failed)
 * - Success rate percentage
 * - Failed login attempts
 * - Average session duration
 * - Most active users
 * - Hourly login distribution
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    // Determine date range based on period
    let dateFilter;
    switch (period) {
      case 'week':
        dateFilter = 'login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'login_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'today':
      default:
        dateFilter = 'DATE(login_time) = CURDATE()';
        break;
    }

    console.log(`📊 Fetching login analytics dashboard for period: ${period}`);

    // Query 1: Total logins and success rate
    const [totals] = await query(`
      SELECT
        COUNT(*) as total_logins,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_logins,
        ROUND(
          (SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as success_rate
      FROM login_analytics
      WHERE ${dateFilter}
    `);

    // Query 2: Average session duration (only completed sessions)
    const [avgSession] = await query(`
      SELECT
        ROUND(AVG(session_duration), 2) as avg_session_minutes,
        COUNT(*) as completed_sessions
      FROM login_analytics
      WHERE ${dateFilter}
        AND success = TRUE
        AND session_duration IS NOT NULL
    `);

    // Query 3: Most active users
    const mostActiveUsers = await query(`
      SELECT
        email,
        COUNT(*) as login_count,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed,
        MAX(login_time) as last_login
      FROM login_analytics
      WHERE ${dateFilter}
      GROUP BY email
      ORDER BY login_count DESC
      LIMIT 10
    `);

    // Query 4: Hourly login distribution (today only)
    const hourlyDistribution = period === 'today' ? await query(`
      SELECT
        HOUR(login_time) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed
      FROM login_analytics
      WHERE DATE(login_time) = CURDATE()
      GROUP BY HOUR(login_time)
      ORDER BY hour
    `) : [];

    // Query 5: Recent activity
    const recentActivity = await query(`
      SELECT
        email,
        login_time,
        success,
        ip_address,
        session_duration,
        logout_time
      FROM login_analytics
      WHERE ${dateFilter}
      ORDER BY login_time DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      period,
      totals: {
        total_logins: Number(totals.total_logins) || 0,
        successful_logins: Number(totals.successful_logins) || 0,
        failed_logins: Number(totals.failed_logins) || 0,
        success_rate: Number(totals.success_rate) || 0
      },
      session: {
        avg_duration_minutes: Number(avgSession.avg_session_minutes) || 0,
        completed_sessions: Number(avgSession.completed_sessions) || 0
      },
      mostActiveUsers: (mostActiveUsers || []).map(user => ({
        email: user.email,
        login_count: Number(user.login_count) || 0,
        successful: Number(user.successful) || 0,
        failed: Number(user.failed) || 0,
        last_login: user.last_login
      })),
      hourlyDistribution: (hourlyDistribution || []).map(h => ({
        hour: Number(h.hour),
        total: Number(h.total) || 0,
        successful: Number(h.successful) || 0,
        failed: Number(h.failed) || 0,
        count: Number(h.total) || 0
      })),
      recentActivity
    });

  } catch (error) {
    console.error('❌ Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics dashboard',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/failed-logins
 * Get failed login attempts for security monitoring (Admin only)
 *
 * Query params:
 * - limit: number (default: 50)
 * - email: string (optional - filter by specific email)
 */
router.get('/failed-logins', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, email } = req.query;

    console.log(`📊 Fetching failed login attempts${email ? ` for ${email}` : ''}`);

    let queryStr = `
      SELECT
        id,
        email,
        login_time,
        ip_address,
        user_agent,
        DATE_FORMAT(login_time, '%Y-%m-%d %H:%i:%s') as formatted_time
      FROM login_analytics
      WHERE success = FALSE
    `;

    const params = [];

    if (email) {
      queryStr += ' AND email = ?';
      params.push(email);
    }

    queryStr += ` ORDER BY login_time DESC LIMIT ${parseInt(limit) || 100}`;

    const failedLogins = await query(queryStr, params);

    // Get summary statistics
    const [summary] = await query(`
      SELECT
        COUNT(DISTINCT email) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(*) as total_failures,
        MAX(login_time) as most_recent_failure
      FROM login_analytics
      WHERE success = FALSE
        ${email ? 'AND email = ?' : ''}
    `, email ? [email] : []);

    res.json({
      success: true,
      summary,
      failedLogins
    });

  } catch (error) {
    console.error('❌ Error fetching failed logins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch failed login attempts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/user/:email
 * Get login history for a specific user (Admin only)
 *
 * Query params:
 * - limit: number (default: 50)
 */
router.get('/user/:email', authenticateAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 50 } = req.query;

    console.log(`📊 Fetching login history for user: ${email}`);

    // User's login history
    const loginHistory = await query(`
      SELECT
        id,
        login_time,
        logout_time,
        success,
        ip_address,
        user_agent,
        session_duration,
        DATE_FORMAT(login_time, '%Y-%m-%d %H:%i:%s') as formatted_login,
        DATE_FORMAT(logout_time, '%Y-%m-%d %H:%i:%s') as formatted_logout
      FROM login_analytics
      WHERE email = ?
      ORDER BY login_time DESC
      LIMIT ${parseInt(limit) || 50}
    `, [email]);

    // User statistics
    const [stats] = await query(`
      SELECT
        COUNT(*) as total_logins,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_logins,
        ROUND(AVG(session_duration), 2) as avg_session_minutes,
        MAX(login_time) as last_login,
        MIN(login_time) as first_login
      FROM login_analytics
      WHERE email = ?
    `, [email]);

    res.json({
      success: true,
      email,
      stats,
      loginHistory
    });

  } catch (error) {
    console.error('❌ Error fetching user login history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user login history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/active-sessions
 * Get currently active sessions (logged in but not logged out) (Admin only)
 */
router.get('/active-sessions', authenticateAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching active sessions');

    const activeSessions = await query(`
      SELECT
        id,
        email,
        login_time,
        ip_address,
        user_agent,
        TIMESTAMPDIFF(MINUTE, login_time, NOW()) as minutes_active,
        DATE_FORMAT(login_time, '%Y-%m-%d %H:%i:%s') as formatted_login
      FROM login_analytics
      WHERE success = TRUE
        AND logout_time IS NULL
      ORDER BY login_time DESC
    `);

    res.json({
      success: true,
      count: activeSessions.length,
      activeSessions
    });

  } catch (error) {
    console.error('❌ Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/security-summary
 * Get security summary (suspicious activity detection) (Admin only)
 *
 * Identifies:
 * - Multiple failed login attempts from same IP
 * - Multiple failed attempts for same email
 * - Unusual activity patterns
 */
router.get('/security-summary', authenticateAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching security summary');

    // Failed attempts by IP (potential brute force)
    const failedByIP = await query(`
      SELECT
        ip_address,
        COUNT(*) as failed_attempts,
        COUNT(DISTINCT email) as unique_emails_targeted,
        MAX(login_time) as most_recent_attempt,
        GROUP_CONCAT(DISTINCT email SEPARATOR ', ') as emails_attempted
      FROM login_analytics
      WHERE success = FALSE
        AND login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY ip_address
      HAVING failed_attempts >= 3
      ORDER BY failed_attempts DESC
      LIMIT 20
    `);

    // Failed attempts by email (potential account compromise)
    const failedByEmail = await query(`
      SELECT
        email,
        COUNT(*) as failed_attempts,
        COUNT(DISTINCT ip_address) as unique_ips,
        MAX(login_time) as most_recent_attempt,
        GROUP_CONCAT(DISTINCT ip_address SEPARATOR ', ') as ips_used
      FROM login_analytics
      WHERE success = FALSE
        AND login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY email
      HAVING failed_attempts >= 3
      ORDER BY failed_attempts DESC
      LIMIT 20
    `);

    // Get overall statistics
    const [stats] = await query(`
      SELECT
        COUNT(*) as total_failed_24h,
        COUNT(DISTINCT email) as unique_emails,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM login_analytics
      WHERE success = FALSE
        AND login_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    res.json({
      success: true,
      stats,
      suspiciousIPs: failedByIP,
      suspiciousAccounts: failedByEmail
    });

  } catch (error) {
    console.error('❌ Error fetching security summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/analytics/my-activity
 * Get login activity for the currently authenticated user
 * Non-admin users can view their own activity
 */
router.get('/my-activity', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;

    console.log(`📊 Fetching login activity for user: ${email}`);

    // User's recent login history
    const loginHistory = await query(`
      SELECT
        id,
        login_time,
        logout_time,
        success,
        ip_address,
        session_duration,
        DATE_FORMAT(login_time, '%Y-%m-%d %H:%i:%s') as formatted_login,
        DATE_FORMAT(logout_time, '%Y-%m-%d %H:%i:%s') as formatted_logout
      FROM login_analytics
      WHERE email = ?
      ORDER BY login_time DESC
      LIMIT 20
    `, [email]);

    // User statistics
    const [stats] = await query(`
      SELECT
        COUNT(*) as total_logins,
        SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_logins,
        ROUND(AVG(session_duration), 2) as avg_session_minutes,
        MAX(login_time) as last_login
      FROM login_analytics
      WHERE email = ?
    `, [email]);

    res.json({
      success: true,
      email,
      stats,
      loginHistory
    });

  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
