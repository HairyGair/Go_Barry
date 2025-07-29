// backend/routes/streetworksAPI.js
// Direct API endpoints for streetworks table data

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * GET /api/streetworks/all
 * Get all streetworks data directly from the table
 */
router.get('/all', async (req, res) => {
  try {
    console.log('📋 API: Fetching all streetworks data...');
    
    const {
      limit = 20000, // High default to get all data
      offset = 0,
      status = 'all'
    } = req.query;

    let query = supabase
      .from('streetworks')
      .select('*')
      .order('webhook_received_at', { ascending: false });

    // Apply status filter if specified
    if (status !== 'all') {
      query = query.eq('alert_status', status);
    }

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching streetworks:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    console.log(`✅ API: Returning ${data?.length || 0} streetworks records`);

    res.json({
      success: true,
      streetworks: data || [],
      metadata: {
        total: count || data?.length || 0,
        returned: data?.length || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ API Error fetching streetworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streetworks/count
 * Get total count of streetworks
 */
router.get('/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('streetworks')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      count: count || 0
    });

  } catch (error) {
    console.error('❌ Error counting streetworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streetworks/active
 * Get only active streetworks (works planned or in progress, next 28 days + currently active)
 */
router.get('/active', async (req, res) => {
  try {
    // Calculate date range for next 28 days
    const now = new Date();
    const next28Days = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
    const nowISO = now.toISOString();
    const next28DaysISO = next28Days.toISOString();
    
    const { data, error } = await supabase
      .from('streetworks')
      .select('*')
      // Filter by work state: only show planned or in progress (fixed capitalization)
      .in('sm_works_state', ['Works planned', 'Works in progress'])
      // Filter by date: works starting in next 28 days OR currently active
      .or(`and(sm_start_date.lte.${next28DaysISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null)),and(sm_start_date.lte.${nowISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null))`)
      .order('sm_start_date', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      streetworks: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Error fetching active streetworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Streetworks API endpoints registered at /api/streetworks');

export default router;