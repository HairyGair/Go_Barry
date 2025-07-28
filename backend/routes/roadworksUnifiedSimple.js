import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/roadworks/unified - Get all roadworks from Supabase streetworks table
router.get('/unified', async (req, res) => {
  try {
    console.log('📋 Fetching unified roadworks from Supabase streetworks table...');
    
    const { data: roadworks, error } = await supabase
      .from('streetworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        data: [] 
      });
    }

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