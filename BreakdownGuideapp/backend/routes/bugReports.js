/**
 * Bug Reports API
 * Handles bug reports, error tracking, and user feedback
 */

import express from 'express';
import db from '../config/mysql.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { sendFeedbackNotification } from '../services/emailService.js';

const router = express.Router();

// ============================================================================
// CREATE BUG REPORT
// ============================================================================

/**
 * POST /api/bug-reports
 * Create a new bug report (manual or automatic)
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'bug',
      severity = 'medium',
      pageUrl,
      userAgent,
      browserInfo,
      errorMessage,
      errorStack,
      appVersion,
      environment = 'production',
      screenshotUrl,
      additionalData,
      stepsToReproduce,
      reporterName,
      reporterEmail,
      reporterBadge
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Get reporter info from token if available
    let reporterId = null;
    if (req.user) {
      reporterId = req.user.id;
    }

    const query = `
      INSERT INTO bug_reports (
        title, description, type, severity, status,
        reporter_id, reporter_name, reporter_email, reporter_badge,
        page_url, user_agent, browser_info,
        error_message, error_stack,
        app_version, environment,
        screenshot_url, additional_data,
        steps_to_reproduce
      ) VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(query, [
      title,
      description || null,
      type,
      severity,
      reporterId,
      reporterName || null,
      reporterEmail || null,
      reporterBadge || null,
      pageUrl || null,
      userAgent || null,
      browserInfo ? JSON.stringify(browserInfo) : null,
      errorMessage || null,
      errorStack || null,
      appVersion || null,
      environment,
      screenshotUrl || null,
      additionalData ? JSON.stringify(additionalData) : null,
      stepsToReproduce || null
    ]);

    // Send email notification (don't wait for it, don't fail if it errors)
    sendFeedbackNotification({
      title,
      description,
      type,
      severity,
      reporterName,
      reporterEmail,
      reporterBadge,
      pageUrl,
      userAgent,
      browserInfo,
      errorMessage,
      errorStack,
      appVersion,
      environment,
      additionalData
    }).catch(err => {
      console.error('Email notification failed (non-critical):', err.message);
    });

    res.json({
      success: true,
      bugReportId: result.insertId,
      message: 'Bug report submitted successfully'
    });

  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bug report'
    });
  }
});

// ============================================================================
// GET BUG REPORTS (with filtering)
// ============================================================================

/**
 * GET /api/bug-reports
 * Get all bug reports with optional filters
 * Query params: status, severity, type, limit, offset
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      status,
      severity,
      type,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        br.*,
        s.name as reporter_full_name,
        s.badge_number as reporter_badge_number,
        rs.name as resolved_by_name
      FROM bug_reports br
      LEFT JOIN supervisors s ON br.reporter_id = s.id
      LEFT JOIN supervisors rs ON br.resolved_by = rs.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND br.status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND br.severity = ?';
      params.push(severity);
    }

    if (type) {
      query += ' AND br.type = ?';
      params.push(type);
    }

    query += ' ORDER BY br.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const reports = await db.query(query, params);

    // Get counts by status
    const statusCounts = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM bug_reports
      GROUP BY status
    `);

    // Get counts by severity
    const severityCounts = await db.query(`
      SELECT
        severity,
        COUNT(*) as count
      FROM bug_reports
      GROUP BY severity
    `);

    res.json({
      success: true,
      reports,
      stats: {
        byStatus: statusCounts,
        bySeverity: severityCounts,
        total: reports.length
      }
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bug reports'
    });
  }
});

// ============================================================================
// GET SINGLE BUG REPORT
// ============================================================================

/**
 * GET /api/bug-reports/:id
 * Get a specific bug report with comments
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get bug report
    const reports = await db.query(`
      SELECT
        br.*,
        s.name as reporter_full_name,
        s.badge_number as reporter_badge_number,
        s.email as reporter_email_address,
        rs.name as resolved_by_name
      FROM bug_reports br
      LEFT JOIN supervisors s ON br.reporter_id = s.id
      LEFT JOIN supervisors rs ON br.resolved_by = rs.id
      WHERE br.id = ?
    `, [id]);

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bug report not found'
      });
    }

    // Get comments
    const comments = await db.query(`
      SELECT
        c.*,
        s.name as user_full_name,
        s.badge_number as user_badge
      FROM bug_report_comments c
      LEFT JOIN supervisors s ON c.user_id = s.id
      WHERE c.bug_report_id = ?
      ORDER BY c.created_at ASC
    `, [id]);

    res.json({
      success: true,
      report: reports[0],
      comments
    });

  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bug report'
    });
  }
});

// ============================================================================
// UPDATE BUG REPORT
// ============================================================================

/**
 * PUT /api/bug-reports/:id
 * Update bug report status, severity, or details
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      severity,
      title,
      description,
      resolutionNotes
    } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);

      // If marking as resolved, record resolver and timestamp
      if (status === 'resolved' || status === 'closed') {
        updates.push('resolved_by = ?');
        updates.push('resolved_at = NOW()');
        params.push(req.user.id);
      }
    }

    if (severity) {
      updates.push('severity = ?');
      params.push(severity);
    }

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (description) {
      updates.push('description = ?');
      params.push(description);
    }

    if (resolutionNotes) {
      updates.push('resolution_notes = ?');
      params.push(resolutionNotes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    params.push(id);

    await db.query(
      `UPDATE bug_reports SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Bug report updated successfully'
    });

  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bug report'
    });
  }
});

// ============================================================================
// ADD COMMENT TO BUG REPORT
// ============================================================================

/**
 * POST /api/bug-reports/:id/comments
 * Add a comment to a bug report
 */
router.post('/:id/comments', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, isInternal = false } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required'
      });
    }

    await db.query(`
      INSERT INTO bug_report_comments (
        bug_report_id, user_id, user_name, comment, is_internal
      ) VALUES (?, ?, ?, ?, ?)
    `, [id, req.user.id, req.user.name, comment, isInternal]);

    res.json({
      success: true,
      message: 'Comment added successfully'
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// ============================================================================
// GET BUG REPORT STATISTICS
// ============================================================================

/**
 * GET /api/bug-reports/stats/overview
 * Get overview statistics for admin dashboard
 */
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    // Total counts
    const totalsResult = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count
      FROM bug_reports
    `);
    const totals = totalsResult[0];

    // Recent reports (last 7 days)
    const recentStatsResult = await db.query(`
      SELECT COUNT(*) as recent_count
      FROM bug_reports
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    const recentStats = recentStatsResult[0];

    // Top reporters
    const topReporters = await db.query(`
      SELECT
        reporter_name,
        reporter_badge,
        COUNT(*) as report_count
      FROM bug_reports
      WHERE reporter_name IS NOT NULL
      GROUP BY reporter_name, reporter_badge
      ORDER BY report_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        ...totals,
        ...recentStats,
        topReporters
      }
    });

  } catch (error) {
    console.error('Error fetching bug report stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// ============================================================================
// DELETE BUG REPORT (admin only)
// ============================================================================

/**
 * DELETE /api/bug-reports/:id
 * Delete a bug report (admin only)
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { id } = req.params;

    await db.query('DELETE FROM bug_reports WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting bug report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bug report'
    });
  }
});

export default router;
