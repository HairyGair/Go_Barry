/**
 * Fleet Management Routes - MySQL Version
 *
 * Migrated from Supabase to MySQL
 * Handles vehicle fleet management, search, filtering, and statistics
 *
 * @migrated 2025-10-16
 */

import express from 'express';
import { from, query, buildSearchCondition, paginate } from '../utils/queryHelpers.js';

const router = express.Router();

// GET /api/fleet - Get all vehicles with search and filtering
router.get('/', async (req, res) => {
  try {
    const { search, depot, type, page = 1, limit = 100 } = req.query;
    const { limit: pageLimit, offset } = paginate(page, limit);

    // Build base query
    let queryBuilder = from('fleet_vehicles')
      .select('*')
      .order('fleet_no', 'ASC');

    // Apply search filter (fleet_no, registration, or depot)
    if (search) {
      const searchConditions = [];
      const searchParams = [];

      searchConditions.push('fleet_no LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('registration LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('depot LIKE ?');
      searchParams.push(`%${search}%`);

      // Build custom query with OR conditions
      let sql = `SELECT * FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const params = [...searchParams];

      // Apply depot filter
      if (depot) {
        sql += ' AND depot = ?';
        params.push(depot);
      }

      // Apply type filter
      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      // Add order, limit, offset
      sql += ' ORDER BY fleet_no ASC LIMIT ? OFFSET ?';
      params.push(pageLimit, offset);

      const data = await query(sql, params);

      // Get total count for pagination
      let countSql = `SELECT COUNT(*) as total FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const countParams = [...searchParams];

      if (depot) {
        countSql += ' AND depot = ?';
        countParams.push(depot);
      }

      if (type) {
        countSql += ' AND type = ?';
        countParams.push(type);
      }

      const countResult = await query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      return res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // No search - use query builder
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // Apply pagination
    queryBuilder = queryBuilder.limit(pageLimit).offset(offset);

    const { data, error } = await queryBuilder.execute();

    if (error) throw error;

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM fleet_vehicles';
    const countParams = [];
    const countConditions = [];

    if (depot) {
      countConditions.push('depot = ?');
      countParams.push(depot);
    }

    if (type) {
      countConditions.push('type = ?');
      countParams.push(type);
    }

    if (countConditions.length > 0) {
      countSql += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch fleet vehicles' });
  }
});

// GET /api/fleet/vehicles - Search vehicles (alias for main endpoint)
router.get('/vehicles', async (req, res) => {
  try {
    const { search, depot, type, page = 1, limit = 100 } = req.query;
    const { limit: pageLimit, offset } = paginate(page, limit);

    // Build base query
    let queryBuilder = from('fleet_vehicles')
      .select('*')
      .order('fleet_no', 'ASC');

    // Apply search filter (fleet_no, registration, or depot)
    if (search) {
      const searchConditions = [];
      const searchParams = [];

      searchConditions.push('fleet_no LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('registration LIKE ?');
      searchParams.push(`%${search}%`);

      searchConditions.push('depot LIKE ?');
      searchParams.push(`%${search}%`);

      // Build custom query with OR conditions
      let sql = `SELECT * FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const params = [...searchParams];

      // Apply depot filter
      if (depot) {
        sql += ' AND depot = ?';
        params.push(depot);
      }

      // Apply type filter
      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      // Add order, limit, offset
      sql += ' ORDER BY fleet_no ASC LIMIT ? OFFSET ?';
      params.push(pageLimit, offset);

      const data = await query(sql, params);

      // Get total count for pagination
      let countSql = `SELECT COUNT(*) as total FROM fleet_vehicles WHERE (${searchConditions.join(' OR ')})`;
      const countParams = [...searchParams];

      if (depot) {
        countSql += ' AND depot = ?';
        countParams.push(depot);
      }

      if (type) {
        countSql += ' AND type = ?';
        countParams.push(type);
      }

      const countResult = await query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      return res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // No search - use query builder
    if (depot) {
      queryBuilder = queryBuilder.eq('depot', depot);
    }

    if (type) {
      queryBuilder = queryBuilder.eq('type', type);
    }

    // Apply pagination
    queryBuilder = queryBuilder.limit(pageLimit).offset(offset);

    const { data, error } = await queryBuilder.execute();

    if (error) throw error;

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM fleet_vehicles';
    const countParams = [];
    const countConditions = [];

    if (depot) {
      countConditions.push('depot = ?');
      countParams.push(depot);
    }

    if (type) {
      countConditions.push('type = ?');
      countParams.push(type);
    }

    if (countConditions.length > 0) {
      countSql += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch fleet vehicles' });
  }
});

// GET /api/fleet/search/:term - Quick search vehicles
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;

    // Search in fleet_no and registration with LIKE (FIXED: was fleet_number)
    const sql = `
      SELECT *
      FROM fleet_vehicles
      WHERE fleet_no LIKE ? OR registration LIKE ?
      ORDER BY fleet_no ASC
      LIMIT 20
    `;

    const params = [`%${searchTerm}%`, `%${searchTerm}%`];
    const data = await query(sql, params);

    res.json(data);
  } catch (error) {
    console.error('Error searching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to search fleet vehicles' });
  }
});

// GET /api/fleet/vehicle/:fleetNumber - Get specific vehicle by fleet number
router.get('/vehicle/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_no', req.params.fleetNumber)  // FIXED: Use fleet_no not fleet_number
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// GET /api/fleet/:fleetNumber - Get specific vehicle by fleet number
router.get('/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_no', req.params.fleetNumber)  // FIXED: Use fleet_no not fleet_number
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// GET /api/fleet/depots/list - Get list of all depots
router.get('/depots/list', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT depot
      FROM fleet_vehicles
      WHERE depot IS NOT NULL
      ORDER BY depot ASC
    `;

    const data = await query(sql);

    // Extract depot names from result set
    const depots = data.map(row => row.depot);

    res.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

// GET /api/fleet/types/list - Get list of vehicle types
router.get('/types/list', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT type
      FROM fleet_vehicles
      WHERE type IS NOT NULL
      ORDER BY type ASC
    `;

    const data = await query(sql);

    // Extract type names from result set
    const types = data.map(row => row.type);

    res.json(types);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
});

// GET /api/fleet/stats/summary - Get fleet statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const sql = 'SELECT depot, type, status FROM fleet_vehicles';
    const data = await query(sql);

    const stats = {
      total_vehicles: data.length,
      by_depot: {},
      by_type: {},
      by_status: {
        active: 0,
        maintenance: 0,
        out_of_service: 0
      }
    };

    data.forEach(vehicle => {
      // Count by depot
      if (vehicle.depot) {
        stats.by_depot[vehicle.depot] = (stats.by_depot[vehicle.depot] || 0) + 1;
      }

      // Count by type
      if (vehicle.type) {
        stats.by_type[vehicle.type] = (stats.by_type[vehicle.type] || 0) + 1;
      }

      // Count by status
      if (vehicle.status) {
        stats.by_status[vehicle.status] = (stats.by_status[vehicle.status] || 0) + 1;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});

// PUT /api/fleet/:fleetNumber - Update vehicle information
router.put('/:fleetNumber', async (req, res) => {
  try {
    const fleetNumber = req.params.fleetNumber;
    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // Remove fleet_no and id from update data if present
    delete updateData.fleet_no;
    delete updateData.id;

    // Build update query
    const keys = Object.keys(updateData);
    const sql = `
      UPDATE fleet_vehicles
      SET ${keys.map(k => `${k} = ?`).join(', ')}
      WHERE fleet_no = ?
    `;

    const params = [...keys.map(k => updateData[k]), fleetNumber];
    await query(sql, params);

    // Fetch updated record
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_no', fleetNumber)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// PATCH /api/fleet/:fleetNumber/status - Update vehicle status
router.patch('/:fleetNumber/status', async (req, res) => {
  try {
    const fleetNumber = req.params.fleetNumber;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const sql = `
      UPDATE fleet_vehicles
      SET status = ?, updated_at = ?
      WHERE fleet_no = ?
    `;

    const params = [status, new Date(), fleetNumber];
    await query(sql, params);

    // Fetch updated record
    const { data, error } = await from('fleet_vehicles')
      .select('*')
      .eq('fleet_no', fleetNumber)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating vehicle status:', error);
    res.status(500).json({ error: 'Failed to update vehicle status' });
  }
});

export default router;
