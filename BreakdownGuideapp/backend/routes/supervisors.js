/**
 * Go BARRY Supervisors API Routes
 *
 * Handles supervisor/user management endpoints
 * Migrated from Supabase to MySQL
 *
 * @author Anthony Gair
 * @version 2.0.0 - MySQL Migration
 */

import express from 'express';
import dotenv from 'dotenv';
import { query } from '../config/mysql.js';

// Load environment variables
dotenv.config();

const router = express.Router();

/**
 * GET /api/supervisors
 * Get all active supervisors
 *
 * Query params:
 * - include_inactive: boolean (default: false)
 * - depot: string (filter by depot)
 * - role: string (filter by role)
 */
router.get('/', async (req, res) => {
  try {
    const { include_inactive, depot, role } = req.query;

    // Build SQL query with dynamic WHERE conditions
    let sql = `
      SELECT id, email, name, badge_number, depot, role, is_active,
             pending_approval, signup_date, approved_date, created_at, updated_at
      FROM supervisors
      WHERE 1=1
    `;
    const params = [];

    // Filter by active status (default: only active)
    if (include_inactive !== 'true') {
      sql += ` AND is_active = ?`;
      params.push(1);
    }

    // Filter by depot if provided
    if (depot) {
      sql += ` AND depot = ?`;
      params.push(depot);
    }

    // Filter by role if provided
    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    // Order by name
    sql += ` ORDER BY name ASC`;

    const supervisors = await query(sql, params);

    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length
    });
  } catch (error) {
    console.error('Error fetching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

/**
 * GET /api/supervisors/:id/stats
 * Get supervisor statistics (MUST come before /:id route!)
 *
 * Query params:
 * - period: 'today' | 'week' | 'month' (default: 'today')
 *
 * Returns:
 * - Supervisor info
 * - Performance metrics (total breakdowns, critical, resolved, etc.)
 * - Average response time
 * - Resolution rate
 * - Breakdown categories breakdown
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'today' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'today':
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Get supervisor info (excluding password_hash)
    const supervisorSql = `
      SELECT id, email, name, badge_number, depot, role, shift_start, shift_end
      FROM supervisors
      WHERE id = ? OR email = ? OR badge_number = ?
      LIMIT 1
    `;
    const supervisorResults = await query(supervisorSql, [id, id, id]);
    const supervisor = supervisorResults[0];

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    // Get breakdowns handled by this supervisor
    const breakdownsSql = `
      SELECT *
      FROM breakdowns
      WHERE supervisor_badge = ? AND created_at >= ?
      ORDER BY created_at DESC
    `;
    const breakdowns = await query(breakdownsSql, [
      supervisor.badge_number,
      startDate.toISOString().slice(0, 19).replace('T', ' ')
    ]);

    // Calculate supervisor statistics
    const totalBreakdowns = breakdowns.length;
    const criticalBreakdowns = breakdowns.filter(b =>
      b.severity === 'STOP' || b.status === 'critical'
    ).length;
    const resolvedBreakdowns = breakdowns.filter(b =>
      b.status === 'resolved' || b.status === 'completed'
    ).length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const breakdown of breakdowns) {
      if (breakdown.acknowledged_at && breakdown.received_at) {
        const responseTime = (new Date(breakdown.acknowledged_at) - new Date(breakdown.received_at)) / 60000;
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
    const resolutionRate = totalBreakdowns > 0 ? Math.round((resolvedBreakdowns / totalBreakdowns) * 100) : 0;

    // Group breakdowns by issue category
    const issueCategories = {};
    breakdowns.forEach(b => {
      const category = b.issue_category || 'Other';
      issueCategories[category] = (issueCategories[category] || 0) + 1;
    });

    const stats = {
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        badge: supervisor.badge_number,
        depot: supervisor.depot,
        shift_start: supervisor.shift_start,
        shift_end: supervisor.shift_end
      },
      performance: {
        totalBreakdowns: totalBreakdowns,
        criticalBreakdowns: criticalBreakdowns,
        resolvedBreakdowns: resolvedBreakdowns,
        avgResponseTime: avgResponseTime,
        resolutionRate: resolutionRate
      },
      breakdown_categories: Object.entries(issueCategories).map(([category, count]) => ({
        category,
        count,
        percentage: totalBreakdowns > 0 ? Math.round((count / totalBreakdowns) * 100) : 0
      })),
      period: period,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching supervisor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor statistics'
    });
  }
});

/**
 * GET /api/supervisors/by-badge/:badge
 * Get supervisor by badge number
 *
 * Useful for quick lookups during breakdown logging
 */
router.get('/by-badge/:badge', async (req, res) => {
  try {
    const { badge } = req.params;

    const sql = `
      SELECT id, email, name, badge_number, depot, role, is_active
      FROM supervisors
      WHERE badge_number = ? AND is_active = 1
      LIMIT 1
    `;
    const results = await query(sql, [badge]);
    const supervisor = results[0];

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found with this badge number'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Error fetching supervisor by badge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor'
    });
  }
});

/**
 * GET /api/supervisors/depot/:depot
 * Get all supervisors for a specific depot
 */
router.get('/depot/:depot', async (req, res) => {
  try {
    const { depot } = req.params;
    const { include_inactive } = req.query;

    let sql = `
      SELECT id, email, name, badge_number, depot, role, is_active, created_at, updated_at
      FROM supervisors
      WHERE depot = ?
    `;
    const params = [depot];

    if (include_inactive !== 'true') {
      sql += ` AND is_active = 1`;
    }

    sql += ` ORDER BY name ASC`;

    const supervisors = await query(sql, params);

    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length,
      depot: depot
    });
  } catch (error) {
    console.error('Error fetching supervisors by depot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

/**
 * GET /api/supervisors/search
 * Search supervisors by name, email, or badge
 *
 * Query params:
 * - q: search query (required)
 * - limit: max results (default: 20)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${q.trim()}%`;

    // Search across name, email, and badge_number
    const sql = `
      SELECT id, email, name, badge_number, depot, role, is_active
      FROM supervisors
      WHERE (
        name LIKE ? OR
        email LIKE ? OR
        badge_number LIKE ?
      )
      AND is_active = true
      ORDER BY name ASC
      LIMIT ${parseInt(limit) || 20}
    `;

    const results = await query(sql, [searchTerm, searchTerm, searchTerm]);

    res.json({
      success: true,
      data: results,
      count: results.length,
      query: q
    });
  } catch (error) {
    console.error('Error searching supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search supervisors'
    });
  }
});

/**
 * GET /api/supervisors/role/:role
 * Get supervisors by role (admin, supervisor, manager, engineering)
 */
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { include_inactive } = req.query;

    // Validate role
    const validRoles = ['admin', 'supervisor', 'manager', 'engineering'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    let sql = `
      SELECT id, email, name, badge_number, depot, role, is_active, created_at, updated_at
      FROM supervisors
      WHERE role = ?
    `;
    const params = [role];

    if (include_inactive !== 'true') {
      sql += ` AND is_active = 1`;
    }

    sql += ` ORDER BY name ASC`;

    const supervisors = await query(sql, params);

    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length,
      role: role
    });
  } catch (error) {
    console.error('Error fetching supervisors by role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisors'
    });
  }
});

/**
 * GET /api/supervisors/pending
 * Get supervisors pending approval
 *
 * Admin-only endpoint
 */
router.get('/pending', async (req, res) => {
  try {
    const sql = `
      SELECT id, email, name, badge_number, depot, role, signup_date, created_at
      FROM supervisors
      WHERE pending_approval = 1 AND is_active = 0
      ORDER BY signup_date DESC
    `;
    const supervisors = await query(sql);

    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length
    });
  } catch (error) {
    console.error('Error fetching pending supervisors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending supervisors'
    });
  }
});

/**
 * GET /api/supervisors/:id
 * Get supervisor profile by ID
 *
 * Returns supervisor info WITHOUT password_hash
 *
 * NOTE: This route MUST come LAST as it's a catch-all for any ID
 * More specific routes (like /:id/stats) must be defined above
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch supervisor excluding password_hash for security
    const sql = `
      SELECT id, email, name, badge_number, depot, role, is_active,
             pending_approval, signup_date, approved_date, created_at, updated_at
      FROM supervisors
      WHERE id = ? OR email = ? OR badge_number = ?
      LIMIT 1
    `;
    const results = await query(sql, [id, id, id]);
    const supervisor = results[0];

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        error: 'Supervisor not found'
      });
    }

    res.json({
      success: true,
      data: supervisor
    });
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supervisor'
    });
  }
});

export default router;
