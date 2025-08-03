// backend/routes/roadworksHealthCheck.js
// Emergency health check endpoint to diagnose issues

import express from 'express';
const router = express.Router();

// GET /api/roadworks/health - Simple health check
router.get('/health', (req, res) => {
  try {
    res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabase: !!process.env.SUPABASE_URL,
        hasGoogleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/roadworks/test-simple - Test with minimal processing
router.get('/test-simple', async (req, res) => {
  try {
    const axios = (await import('axios')).default;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        success: false,
        error: 'Missing Supabase configuration'
      });
    }
    
    // Get just 5 records without any processing
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'sm_works_state': 'in.(Works planned,Works in progress)',
        limit: 5
      },
      timeout: 10000
    });
    
    res.json({
      success: true,
      count: response.data.length,
      data: response.data,
      message: 'Raw data without coordinate processing'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      phase: 'fetching',
      stack: error.stack
    });
  }
});

export default router;
