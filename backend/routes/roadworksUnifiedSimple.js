import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/roadworks/unified/debug - Debug endpoint to check data counts
router.get('/unified/debug', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking roadworks data counts...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get total count (no filters)
    const totalResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      },
      params: {
        select: 'id',
        limit: 1
      }
    });
    
    const totalCount = totalResponse.headers['content-range']?.split('/')[1] || 'unknown';
    
    // Calculate date range for next 28 days
    const now = new Date();
    const next28Days = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
    const nowISO = now.toISOString();
    const next28DaysISO = next28Days.toISOString();
    
    // Get filtered count
    const filteredResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      },
      params: {
        select: 'id',
        'or': `and(sm_start_date.lte.${next28DaysISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null)),and(sm_start_date.lte.${nowISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null))`,
        limit: 1
      }
    });
    
    const filteredCount = filteredResponse.headers['content-range']?.split('/')[1] || 'unknown';
    
    // Get sample of dates to check spread
    const sampleResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      params: {
        select: 'sm_start_date,sm_end_date',
        order: 'sm_start_date.asc',
        limit: 5
      }
    });
    
    res.json({
      success: true,
      debug: {
        totalRecords: totalCount,
        filteredRecords: filteredCount,
        dateRange: {
          from: nowISO,
          to: next28DaysISO,
          description: 'Next 28 days + currently active'
        },
        sampleDates: sampleResponse.data,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    
    // Calculate date range for next 28 days
    const now = new Date();
    const next28Days = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
    const nowISO = now.toISOString();
    const next28DaysISO = next28Days.toISOString();
    
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        // Filter for works starting in next 28 days OR currently active
        'or': `and(sm_start_date.lte.${next28DaysISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null)),and(sm_start_date.lte.${nowISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null))`,
        order: 'sm_start_date.asc',
        limit: 1000
      },
      timeout: 10000
    });
    
    const roadworks = response.data;

    console.log(`✅ Fetched ${roadworks?.length || 0} roadworks from Supabase (filtered for next 28 days)`);
    
    res.json({
      success: true,
      data: roadworks || [],
      roadworks: roadworks || [], // Keep for backward compatibility
      metadata: {
        count: roadworks?.length || 0,
        source: 'supabase_streetworks',
        table: 'streetworks',
        dateFilter: 'next_28_days_and_active',
        filterApplied: `${nowISO} to ${next28DaysISO}`,
        lastUpdated: new Date().toISOString()
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

// POST /api/roadworks/unified/actions/:id/acknowledge - Acknowledge a roadwork alert
router.post('/actions/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, acknowledgmentType, notes } = req.body;
    
    console.log(`📝 Acknowledging roadwork ${id} as ${acknowledgmentType}`);
    
    // Log the acknowledgment action (could be enhanced to store in Supabase)
    const acknowledgment = {
      roadworkId: id,
      sessionId: sessionId,
      type: acknowledgmentType || 'reviewed',
      notes: notes,
      acknowledgedAt: new Date().toISOString()
    };
    
    console.log('✅ Roadwork acknowledged:', acknowledgment);
    
    res.json({
      success: true,
      message: 'Roadwork acknowledged successfully',
      acknowledgment: acknowledgment
    });
  } catch (error) {
    console.error('❌ Error acknowledging roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/roadworks/unified/actions/:id/diversion - Plan diversion for roadwork
router.post('/actions/:id/diversion', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, diversionRoute, notes } = req.body;
    
    console.log(`🚌 Planning diversion for roadwork ${id}`);
    
    // Log the diversion plan (could be enhanced to store in Supabase)
    const diversion = {
      roadworkId: id,
      sessionId: sessionId,
      diversionRoute: diversionRoute,
      notes: notes,
      plannedAt: new Date().toISOString()
    };
    
    console.log('✅ Diversion planned:', diversion);
    
    res.json({
      success: true,
      message: 'Diversion planned successfully',
      diversion: diversion
    });
  } catch (error) {
    console.error('❌ Error planning diversion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/roadworks/unified/actions/:id/dismiss - Dismiss a roadwork alert
router.post('/actions/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, dismissedBy, reason } = req.body;
    
    console.log(`❌ Dismissing roadwork ${id}`);
    
    // Log the dismissal (could be enhanced to store in Supabase)
    const dismissal = {
      roadworkId: id,
      sessionId: sessionId,
      dismissedBy: dismissedBy,
      reason: reason,
      dismissedAt: new Date().toISOString()
    };
    
    console.log('✅ Roadwork dismissed:', dismissal);
    
    res.json({
      success: true,
      message: 'Roadwork dismissed successfully',
      dismissal: dismissal
    });
  } catch (error) {
    console.error('❌ Error dismissing roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;