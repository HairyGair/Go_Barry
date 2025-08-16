import express from 'express';

const router = express.Router();

// Initialize Supabase with lazy loading and error handling
let supabase = null;

async function getSupabaseClient() {
  if (supabase) return supabase;
  
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase environment variables not available for incident alerts');
      return null;
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase client initialized for incident alerts');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase for incident alerts:', error.message);
    return null;
  }
}

// GET /api/incident-alerts - Get active incident alerts
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching incident alerts...');
    
    // Get Supabase client
    const supabaseClient = await getSupabaseClient();
    
    if (!supabaseClient) {
      return res.json({
        success: true,
        alerts: [],
        incidents: [],
        count: 0,
        source: 'fallback',
        message: 'Supabase not available, returning empty results'
      });
    }
    
    // Try to fetch from incidents table first
    const { data: incidents, error: incidentError } = await supabaseClient
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
        incidents: incidents,
        count: incidents.length,
        source: 'incidents_table',
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Fallback: Try streetworks table for incident-type roadworks
    const { data: streetworks, error: streetworksError } = await supabaseClient
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
        incidents: streetworks,
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
      incidents: [],
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
      incidents: [],
      count: 0
    });
  }
});

export default router;