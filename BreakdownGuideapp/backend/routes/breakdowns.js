import express from 'express';
import { supabase } from '../server.js';
import breakdownIdGenerator from '../services/breakdownIdGenerator.js';

const router = express.Router();

// GET /api/breakdowns - Get all breakdowns with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, depot } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('breakdowns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (depot) {
      query = query.eq('depot', depot);
    }

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
    console.error('Error fetching breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch breakdowns' });
  }
});

// GET /api/breakdowns/active - Get active breakdowns
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .select('*')
      .in('status', ['active', 'pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching active breakdowns:', error);
    res.status(500).json({ error: 'Failed to fetch active breakdowns' });
  }
});

// GET /api/breakdowns/live - Get active breakdowns for dashboards
router.get('/live', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .select(`
        id,
        breakdown_id,
        fleet_number,
        status,
        location,
        description,
        priority,
        supervisor_id,
        assessment_decision,
        created_at,
        updated_at
      `)
      .in('status', ['active', 'pending', 'in_progress', 'critical'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      count: data.length
    });
  } catch (error) {
    console.error('Error fetching live breakdowns:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch live breakdowns',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/breakdowns/:id - Get specific breakdown
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown' });
  }
});

// POST /api/breakdowns - Create new breakdown
router.post('/', async (req, res) => {
  try {
    // Generate unique breakdown ID with daily counter
    const idResult = await breakdownIdGenerator.generateId();
    
    const breakdownData = {
      ...req.body,
      breakdown_id: idResult.id,
      created_at: new Date().toISOString(),
      status: req.body.status || 'active',
      generation_metadata: {
        sequence: idResult.sequence,
        date: idResult.date,
        timestamp: idResult.timestamp,
        fallback: idResult.fallback || false
      }
    };

    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdownData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      ...data,
      id_generation: {
        breakdown_id: idResult.id,
        sequence_number: idResult.sequence,
        generation_date: idResult.date
      }
    });
  } catch (error) {
    console.error('Error creating breakdown:', error);
    res.status(500).json({ 
      error: 'Failed to create breakdown',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/breakdowns/:id - Update breakdown
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating breakdown:', error);
    res.status(500).json({ error: 'Failed to update breakdown' });
  }
});

// PATCH /api/breakdowns/:id/status - Update breakdown status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('breakdowns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Breakdown not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating breakdown status:', error);
    res.status(500).json({ error: 'Failed to update breakdown status' });
  }
});

// GET /api/breakdowns/stats - Get breakdown statistics (alias)
router.get('/stats', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const { data, error } = await supabase
      .from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      pending: data.filter(b => b.status === 'pending').length,
      resolved: data.filter(b => b.status === 'resolved').length,
      in_progress: data.filter(b => b.status === 'in_progress').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching breakdown stats:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown statistics' });
  }
});

// GET /api/breakdowns/stats/summary - Get breakdown statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const { data, error } = await supabase
      .from('breakdowns')
      .select('status')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data.length,
      active: data.filter(b => b.status === 'active').length,
      pending: data.filter(b => b.status === 'pending').length,
      resolved: data.filter(b => b.status === 'resolved').length,
      in_progress: data.filter(b => b.status === 'in_progress').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching breakdown stats:', error);
    res.status(500).json({ error: 'Failed to fetch breakdown statistics' });
  }
});

// GET /api/breakdowns/id-generator/status - Get ID generator status
router.get('/id-generator/status', async (req, res) => {
  try {
    const status = breakdownIdGenerator.getStatus();
    const statistics = await breakdownIdGenerator.getStatistics();
    
    res.json({
      generator: status,
      statistics: statistics,
      health: 'operational'
    });
  } catch (error) {
    console.error('Error getting ID generator status:', error);
    res.status(500).json({ error: 'Failed to get generator status' });
  }
});

// GET /api/breakdowns/id-generator/next - Preview next ID without creating
router.get('/id-generator/next', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01T00:00:00.000Z`)
      .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);
    
    const nextNumber = (count || 0) + 1;
    const nextId = `BD-${year}-${nextNumber.toString().padStart(5, '0')}`;
    
    res.json({
      next_id: nextId,
      current_count: count || 0,
      next_sequence: nextNumber,
      year: year,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error previewing next ID:', error);
    res.status(500).json({ error: 'Failed to preview next ID' });
  }
});

// POST /api/breakdowns/id-generator/validate - Validate a breakdown ID
router.post('/id-generator/validate', async (req, res) => {
  try {
    const { breakdown_id } = req.body;
    
    if (!breakdown_id) {
      return res.status(400).json({ error: 'breakdown_id is required' });
    }
    
    const validation = breakdownIdGenerator.validateId(breakdown_id);
    
    // Check if ID already exists in database
    let exists = false;
    if (validation.valid) {
      const { data } = await supabase
        .from('breakdowns')
        .select('breakdown_id')
        .eq('breakdown_id', breakdown_id)
        .single();
      
      exists = !!data;
    }
    
    res.json({
      ...validation,
      exists_in_database: exists,
      breakdown_id: breakdown_id
    });
  } catch (error) {
    console.error('Error validating breakdown ID:', error);
    res.status(500).json({ error: 'Failed to validate breakdown ID' });
  }
});

export default router;