/**
 * Engineer Management Routes
 * Handles engineer CRUD, shift templates, daily shift check-in, and on-shift queries
 *
 * Mounted at /api/engineer-management
 *
 * @author Anthony Gair
 * @version 1.0.0
 */

import express from 'express';
import { query, select, insert, update } from '../config/mysql.js';
import { from } from '../utils/queryHelpers.js';

const router = express.Router();

// ─── ENGINEERS CRUD ──────────────────────────────────────────────────────────

// GET /api/engineer-management/engineers - List engineers managed by current user
router.get('/engineers', async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { depot, include_all } = req.query;

    let sql = `
      SELECT e.*, d.name AS depot_name
      FROM engineers e
      LEFT JOIN depots d ON d.code = e.home_depot_code COLLATE utf8mb4_0900_ai_ci
      WHERE e.is_active = 1
    `;
    const params = [];

    // If not requesting all, scope to manager
    if (!include_all) {
      sql += ' AND (e.managed_by = ? OR e.managed_by IS NULL)';
      params.push(supervisorId);
    }

    if (depot) {
      sql += ' AND e.home_depot_code = ?';
      params.push(depot);
    }

    sql += ' ORDER BY e.name ASC';

    const engineers = await query(sql, params);

    // Parse skills JSON
    const parsed = engineers.map(e => ({
      ...e,
      skills: typeof e.skills === 'string' ? JSON.parse(e.skills) : (e.skills || [])
    }));

    res.json({ success: true, engineers: parsed });
  } catch (error) {
    console.error('Error fetching managed engineers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engineers' });
  }
});

// POST /api/engineer-management/engineers - Add new engineer
router.post('/engineers', async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { name, badge_number, phone, email, home_depot_code, skills } = req.body;

    if (!name || !badge_number) {
      return res.status(400).json({ success: false, error: 'name and badge_number are required' });
    }

    const result = await insert('engineers', {
      name,
      badge_number,
      phone: phone || null,
      email: email || null,
      depot: home_depot_code || null,
      home_depot_code: home_depot_code || null,
      skills: JSON.stringify(skills || []),
      status: 'available',
      is_active: 1,
      managed_by: supervisorId
    });

    res.json({ success: true, engineer_id: result, message: 'Engineer added' });
  } catch (error) {
    console.error('Error adding engineer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'Badge number already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to add engineer' });
  }
});

// PUT /api/engineer-management/engineers/:id - Edit engineer
router.put('/engineers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;
    const { name, badge_number, phone, email, home_depot_code, skills } = req.body;

    // Verify ownership
    const [engineer] = await select('engineers', { id });
    if (!engineer) {
      return res.status(404).json({ success: false, error: 'Engineer not found' });
    }
    if (engineer.managed_by && engineer.managed_by !== supervisorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this engineer' });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (badge_number !== undefined) updateFields.badge_number = badge_number;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (home_depot_code !== undefined) {
      updateFields.home_depot_code = home_depot_code;
      updateFields.depot = home_depot_code;
    }
    if (skills !== undefined) updateFields.skills = JSON.stringify(skills);

    await update('engineers', updateFields, { id });

    res.json({ success: true, message: 'Engineer updated' });
  } catch (error) {
    console.error('Error updating engineer:', error);
    res.status(500).json({ success: false, error: 'Failed to update engineer' });
  }
});

// DELETE /api/engineer-management/engineers/:id - Soft-delete
router.delete('/engineers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;

    const [engineer] = await select('engineers', { id });
    if (!engineer) {
      return res.status(404).json({ success: false, error: 'Engineer not found' });
    }
    if (engineer.managed_by && engineer.managed_by !== supervisorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this engineer' });
    }

    await update('engineers', { is_active: 0 }, { id });

    res.json({ success: true, message: 'Engineer deactivated' });
  } catch (error) {
    console.error('Error deactivating engineer:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate engineer' });
  }
});

// ─── SHIFT TEMPLATES ─────────────────────────────────────────────────────────

// GET /api/engineer-management/shift-templates
router.get('/shift-templates', async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const templates = await query(
      `SELECT * FROM engineer_shift_templates
       WHERE (created_by = ? OR created_by IN (SELECT id FROM supervisors WHERE role = 'admin'))
       AND is_active = 1
       ORDER BY start_time ASC`,
      [supervisorId]
    );

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching shift templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shift templates' });
  }
});

// POST /api/engineer-management/shift-templates
router.post('/shift-templates', async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { name, start_time, end_time, depot_code } = req.body;

    if (!name || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'name, start_time, and end_time are required' });
    }

    const result = await insert('engineer_shift_templates', {
      name,
      start_time,
      end_time,
      created_by: supervisorId,
      depot_code: depot_code || null,
      is_active: 1
    });

    res.json({ success: true, template_id: result, message: 'Shift template created' });
  } catch (error) {
    console.error('Error creating shift template:', error);
    res.status(500).json({ success: false, error: 'Failed to create shift template' });
  }
});

// PUT /api/engineer-management/shift-templates/:id
router.put('/shift-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;
    const { name, start_time, end_time, depot_code } = req.body;

    // Verify ownership
    const [template] = await query(
      'SELECT * FROM engineer_shift_templates WHERE id = ?',
      [parseInt(id)]
    );
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (template.created_by !== supervisorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this template' });
    }

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (start_time !== undefined) updateFields.start_time = start_time;
    if (end_time !== undefined) updateFields.end_time = end_time;
    if (depot_code !== undefined) updateFields.depot_code = depot_code;

    await update('engineer_shift_templates', updateFields, { id: parseInt(id) });

    res.json({ success: true, message: 'Shift template updated' });
  } catch (error) {
    console.error('Error updating shift template:', error);
    res.status(500).json({ success: false, error: 'Failed to update shift template' });
  }
});

// DELETE /api/engineer-management/shift-templates/:id
router.delete('/shift-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.user.id;

    const [template] = await query(
      'SELECT * FROM engineer_shift_templates WHERE id = ?',
      [parseInt(id)]
    );
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (template.created_by !== supervisorId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this template' });
    }

    await update('engineer_shift_templates', { is_active: 0 }, { id: parseInt(id) });

    res.json({ success: true, message: 'Shift template deactivated' });
  } catch (error) {
    console.error('Error deactivating shift template:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate shift template' });
  }
});

// ─── DAILY SHIFTS ────────────────────────────────────────────────────────────

// POST /api/engineer-management/daily-shifts - Bulk set today's shifts
router.post('/daily-shifts', async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { shifts } = req.body;

    if (!Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({ success: false, error: 'shifts array is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    let inserted = 0;
    let updated = 0;

    for (const shift of shifts) {
      const { engineer_id, shift_template_id, custom_start, custom_end, depot_code } = shift;

      if (!engineer_id || !depot_code) continue;

      // Use INSERT ... ON DUPLICATE KEY UPDATE
      const sql = `
        INSERT INTO engineer_daily_shifts
          (engineer_id, shift_date, shift_template_id, custom_start, custom_end, checked_in_by, depot_code, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'on_shift')
        ON DUPLICATE KEY UPDATE
          shift_template_id = VALUES(shift_template_id),
          custom_start = VALUES(custom_start),
          custom_end = VALUES(custom_end),
          checked_in_by = VALUES(checked_in_by),
          depot_code = VALUES(depot_code),
          status = 'on_shift',
          updated_at = CURRENT_TIMESTAMP
      `;

      const result = await query(sql, [
        engineer_id,
        today,
        shift_template_id || null,
        custom_start || null,
        custom_end || null,
        supervisorId,
        depot_code
      ]);

      // affectedRows=1 = insert, affectedRows=2 = update
      if (result.affectedRows === 1) inserted++;
      else if (result.affectedRows === 2) updated++;
    }

    // Also update the engineer status to available for checked-in engineers
    const engineerIds = shifts.map(s => s.engineer_id).filter(Boolean);
    if (engineerIds.length > 0) {
      const placeholders = engineerIds.map(() => '?').join(',');
      await query(
        `UPDATE engineers SET status = 'available' WHERE id IN (${placeholders}) AND status = 'off_duty'`,
        engineerIds
      );
    }

    res.json({
      success: true,
      message: `${inserted} engineers checked in, ${updated} updated`,
      inserted,
      updated
    });
  } catch (error) {
    console.error('Error setting daily shifts:', error);
    res.status(500).json({ success: false, error: 'Failed to set daily shifts' });
  }
});

// GET /api/engineer-management/on-shift - Today's on-shift engineers
router.get('/on-shift', async (req, res) => {
  try {
    const { depot } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let sql = `
      SELECT
        e.id, e.name, e.badge_number, e.phone, e.skills, e.status, e.home_depot_code,
        ds.depot_code AS shift_depot,
        ds.status AS shift_status,
        ds.shift_template_id,
        st.name AS template_name,
        COALESCE(st.start_time, ds.custom_start) AS shift_start,
        COALESCE(st.end_time, ds.custom_end) AS shift_end,
        (SELECT COUNT(*) FROM breakdowns b
         WHERE b.engineer_badge = e.badge_number
         AND b.status IN ('dispatched', 'on_site', 'in_progress')
        ) AS active_jobs
      FROM engineer_daily_shifts ds
      JOIN engineers e ON e.id = ds.engineer_id AND e.is_active = 1
      LEFT JOIN engineer_shift_templates st ON st.id = ds.shift_template_id
      WHERE ds.shift_date = ?
        AND ds.status = 'on_shift'
    `;
    const params = [today];

    if (depot) {
      sql += ' AND ds.depot_code = ?';
      params.push(depot);
    }

    sql += ' ORDER BY e.status ASC, e.name ASC';

    const engineers = await query(sql, params);

    // Parse skills JSON
    const parsed = engineers.map(e => ({
      ...e,
      skills: typeof e.skills === 'string' ? JSON.parse(e.skills) : (e.skills || []),
      is_available: e.status === 'available' && e.active_jobs === 0
    }));

    res.json({ success: true, engineers: parsed });
  } catch (error) {
    console.error('Error fetching on-shift engineers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch on-shift engineers' });
  }
});

// GET /api/engineer-management/on-shift/:depot - Depot-filtered on-shift engineers
router.get('/on-shift/:depot', async (req, res) => {
  try {
    const { depot } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const sql = `
      SELECT
        e.id, e.name, e.badge_number, e.phone, e.skills, e.status, e.home_depot_code,
        ds.depot_code AS shift_depot,
        ds.status AS shift_status,
        COALESCE(st.start_time, ds.custom_start) AS shift_start,
        COALESCE(st.end_time, ds.custom_end) AS shift_end,
        (SELECT COUNT(*) FROM breakdowns b
         WHERE b.engineer_badge = e.badge_number
         AND b.status IN ('dispatched', 'on_site', 'in_progress')
        ) AS active_jobs
      FROM engineer_daily_shifts ds
      JOIN engineers e ON e.id = ds.engineer_id AND e.is_active = 1
      LEFT JOIN engineer_shift_templates st ON st.id = ds.shift_template_id
      WHERE ds.shift_date = ?
        AND ds.depot_code = ?
        AND ds.status = 'on_shift'
      ORDER BY e.status ASC, e.name ASC
    `;

    const engineers = await query(sql, [today, depot]);

    const parsed = engineers.map(e => ({
      ...e,
      skills: typeof e.skills === 'string' ? JSON.parse(e.skills) : (e.skills || []),
      is_available: e.status === 'available' && e.active_jobs === 0
    }));

    res.json({ success: true, depot, engineers: parsed });
  } catch (error) {
    console.error('Error fetching depot on-shift engineers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch on-shift engineers' });
  }
});

// GET /api/engineer-management/shift-history - Last 7 days of shift data
router.get('/shift-history', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const sql = `
      SELECT
        ds.shift_date,
        ds.depot_code,
        ds.status AS shift_status,
        e.name AS engineer_name,
        e.badge_number,
        COALESCE(st.name, 'Custom') AS template_name,
        COALESCE(st.start_time, ds.custom_start) AS shift_start,
        COALESCE(st.end_time, ds.custom_end) AS shift_end,
        s.name AS checked_in_by_name
      FROM engineer_daily_shifts ds
      JOIN engineers e ON e.id = ds.engineer_id
      LEFT JOIN engineer_shift_templates st ON st.id = ds.shift_template_id
      LEFT JOIN supervisors s ON s.id = ds.checked_in_by
      WHERE ds.shift_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY ds.shift_date DESC, ds.depot_code ASC, e.name ASC
    `;

    const history = await query(sql, [parseInt(days)]);

    res.json({ success: true, history, days: parseInt(days) });
  } catch (error) {
    console.error('Error fetching shift history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch shift history' });
  }
});

export default router;
