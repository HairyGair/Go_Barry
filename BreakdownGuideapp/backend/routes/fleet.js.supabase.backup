import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// GET /api/fleet - Get all vehicles with search and filtering
router.get('/', async (req, res) => {
  try {
    const { search, depot, type, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fleet_vehicles')
      .select('*')
      .order('fleet_number');

    // Apply search filter
    if (search) {
      query = query.or(`fleet_number.ilike.%${search}%,registration.ilike.%${search}%,depot.ilike.%${search}%`);
    }

    // Apply depot filter
    if (depot) {
      query = query.eq('depot', depot);
    }

    // Apply vehicle type filter
    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
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
    const offset = (page - 1) * limit;

    let query = supabase
      .from('fleet_vehicles')
      .select('*')
      .order('fleet_number');

    // Apply search filter
    if (search) {
      query = query.or(`fleet_number.ilike.%${search}%,registration.ilike.%${search}%,depot.ilike.%${search}%`);
    }

    // Apply depot filter
    if (depot) {
      query = query.eq('depot', depot);
    }

    // Apply vehicle type filter
    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
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
    
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .or(`fleet_number.ilike.%${searchTerm}%,registration.ilike.%${searchTerm}%`)
      .order('fleet_number')
      .limit(20);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error searching fleet vehicles:', error);
    res.status(500).json({ error: 'Failed to search fleet vehicles' });
  }
});

// GET /api/fleet/vehicle/:fleetNumber - Get specific vehicle by fleet number  
router.get('/vehicle/:fleetNumber', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', req.params.fleetNumber)
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
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', req.params.fleetNumber)
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
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('depot')
      .not('depot', 'is', null);

    if (error) throw error;

    // Get unique depots
    const depots = [...new Set(data.map(vehicle => vehicle.depot))].sort();

    res.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

// GET /api/fleet/types/list - Get list of vehicle types
router.get('/types/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('type')
      .not('type', 'is', null);

    if (error) throw error;

    // Get unique vehicle types
    const types = [...new Set(data.map(vehicle => vehicle.type))].sort();

    res.json(types);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
});

// GET /api/fleet/stats/summary - Get fleet statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('depot, type, status');

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('fleet_number', req.params.fleetNumber)
      .select()
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
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('fleet_number', req.params.fleetNumber)
      .select()
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