// Simplified version of unified endpoint to diagnose 500 error
import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/roadworks/unified-test - Simplified test version
router.get('/unified-test', async (req, res) => {
  try {
    console.log('📋 TEST: Fetching unified roadworks (simplified)...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing',
        data: []
      });
    }
    
    // Use minimal parameters
    const limit = parseInt(req.query.limit) || 20; // Much smaller default
    
    console.log(`🔍 Fetching ${limit} roadworks...`);
    
    try {
      const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          'sm_works_state': 'in.(Works planned,Works in progress)',
          limit: limit,
          order: 'created_at.desc'
        },
        timeout: 15000
      });
      
      const roadworks = response.data;
      console.log(`✅ Found ${roadworks.length} roadworks`);
      
      // Return simple response without processing
      return res.json({
        success: true,
        data: roadworks,
        metadata: {
          count: roadworks.length,
          source: 'supabase_streetworks',
          processing: 'none',
          limit: limit
        }
      });
      
    } catch (error) {
      console.error('❌ Error fetching roadworks:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Unified test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: [] 
    });
  }
});

// GET /api/roadworks/unified-minimal - Even more minimal version
router.get('/unified-minimal', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      metadata: {
        test: 'minimal endpoint working',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

export default router;
