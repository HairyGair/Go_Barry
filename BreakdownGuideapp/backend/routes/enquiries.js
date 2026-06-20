/**
 * Interest Enquiries API (admin only)
 * Lists and manages "I'm Interested" enquiries captured from the public site.
 * Mounted at /api/admin/enquiries behind authenticateAdmin.
 */

import express from 'express';
import { query } from '../utils/queryHelpers.js';

const router = express.Router();

const parseFeatures = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
};

// GET /api/admin/enquiries - list enquiries (newest first), optional ?status=
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const allowed = ['new', 'contacted', 'archived'];
    let sql = 'SELECT * FROM interest_enquiries';
    const params = [];
    if (status && allowed.includes(status)) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT 500';

    const rows = await query(sql, params);
    const enquiries = (rows || []).map(r => ({ ...r, features: parseFeatures(r.features) }));

    // Counts by status for the admin UI badges
    const counts = { new: 0, contacted: 0, archived: 0, total: 0 };
    const countRows = await query('SELECT status, COUNT(*) AS c FROM interest_enquiries GROUP BY status');
    for (const cr of (countRows || [])) { counts[cr.status] = cr.c; counts.total += cr.c; }

    res.json({ success: true, enquiries, counts });
  } catch (error) {
    console.error('Error listing enquiries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch enquiries' });
  }
});

// PATCH /api/admin/enquiries/:id - update status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = ['new', 'contacted', 'archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const result = await query('UPDATE interest_enquiries SET status = ? WHERE id = ?', [status, id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({ success: false, error: 'Failed to update enquiry' });
  }
});

export default router;
