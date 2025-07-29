import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET /api/incident-alerts - Get active incident alerts
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching incident alerts...');
    
    // Try to fetch from incidents table first
    const { data: incidents, error: incidentError } = await supabase
      .from('incidents')
      .select('*')
      .in('status', ['active', 'monitoring', 'assessing'])
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!incidentError && incidents && incidents.length > 0) {
      console.log(`✅ Found ${incidents.length} active incidents`);
      return res.json({
        success: true,
        alerts: incidents,
        count: incidents.length,
        source: 'incidents_table',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Fallback: Try streetworks table for incident-type roadworks
    const { data: streetworks, error: streetworksError } = await supabase
      .from('streetworks')
      .select('*')
      .or('type.eq.incident,severity.eq.critical,severity.eq.high')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!streetworksError && streetworks && streetworks.length > 0) {
      console.log(`✅ Found ${streetworks.length} incident-type streetworks`);
      return res.json({
        success: true,
        alerts: streetworks,
        count: streetworks.length,
        source: 'streetworks_table',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // No incidents found
    console.log('ℹ️ No active incidents found');
    res.json({
      success: true,
      alerts: [],
      count: 0,
      message: 'No active incidents',
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching incident alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      count: 0
    });
  }
});

export default router;