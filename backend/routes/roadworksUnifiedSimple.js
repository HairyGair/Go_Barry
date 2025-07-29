import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/roadworks/unified - Get all roadworks from Supabase streetworks table using axios
router.get('/unified', async (req, res) => {
  try {
    console.log('📋 Fetching unified roadworks from Supabase streetworks table with axios...');
    
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
    
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        order: 'created_at.desc',
        limit: 1000
      },
      timeout: 10000
    });
    
    const roadworks = response.data;

    console.log(`✅ Fetched ${roadworks?.length || 0} roadworks from Supabase`);
    
    res.json({
      success: true,
      data: roadworks || [],
      metadata: {
        count: roadworks?.length || 0,
        source: 'supabase_streetworks'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching roadworks:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      data: [] 
    });
  }
});

export default router;