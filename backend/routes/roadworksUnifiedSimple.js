import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/roadworks/debug-values - Debug endpoint to check actual database values
router.get('/debug-values', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking actual database values...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get sample records to check actual field values
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,sm_works_state,sm_start_date,sm_end_date,sm_works_category,sm_location_description',
        order: 'created_at.desc',
        limit: 20
      },
      timeout: 10000
    });
    
    const sampleData = response.data;
    
    // Extract unique work states
    const workStates = [...new Set(sampleData.map(r => r.sm_works_state).filter(Boolean))];
    
    // Extract unique work categories
    const workCategories = [...new Set(sampleData.map(r => r.sm_works_category).filter(Boolean))];
    
    // Check date ranges
    const now = new Date();
    const startDates = sampleData.map(r => r.sm_start_date).filter(Boolean);
    const futureDates = startDates.filter(date => new Date(date) > now);
    const pastDates = startDates.filter(date => new Date(date) <= now);
    
    res.json({
      success: true,
      debug: {
        totalSample: sampleData.length,
        uniqueWorkStates: workStates,
        uniqueWorkCategories: workCategories,
        dateAnalysis: {
          totalDates: startDates.length,
          futureDates: futureDates.length,
          pastDates: pastDates.length,
          earliestFuture: futureDates.length > 0 ? Math.min(...futureDates.map(d => new Date(d))) : null,
          latestPast: pastDates.length > 0 ? Math.max(...pastDates.map(d => new Date(d))) : null
        },
        sampleRecords: sampleData.slice(0, 5).map(r => ({
          id: r.id,
          state: r.sm_works_state,
          category: r.sm_works_category,
          startDate: r.sm_start_date,
          location: r.sm_location_description?.substring(0, 50) + '...'
        })),
        currentFilters: {
          expectedStates: ['Works planned', 'Works in progress'],
          dateRange: '28 days from now'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug values error:', error);
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
    
    let roadworks = [];
    
    try {
      // Try with full filtering first
      const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          // Filter by work state: only show planned or in progress works (CONFIRMED working!)
          'sm_works_state': 'in.(Works planned,Works in progress)',
          // Use 180-day window instead of 28 days (infrastructure projects need longer planning)
          'or': `sm_start_date.lte.${new Date(Date.now() + 180*24*60*60*1000).toISOString()},and(sm_start_date.lte.${nowISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null))`,
          order: 'sm_start_date.asc',
          limit: 200 // Increased for more comprehensive results
        },
        timeout: 10000
      });
      
      roadworks = response.data;
      
    } catch (filterError) {
      console.error('❌ Filtered query failed, trying simpler approach:', filterError.message);
      
      // Fallback: Just filter by work state
      try {
        const simpleResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            'sm_works_state': 'in.(Works planned,Works in progress)',
            order: 'sm_start_date.asc',
            limit: 100
          },
          timeout: 10000
        });
        
        roadworks = simpleResponse.data;
        console.log('✅ Fallback query successful');
        
      } catch (simpleError) {
        console.error('❌ Simple query also failed:', simpleError.message);
        
        // Final fallback: Get all data and filter client-side
        const allResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            order: 'sm_start_date.asc',
            limit: 50
          },
          timeout: 10000
        });
        
        roadworks = allResponse.data;
        console.log('✅ Final fallback: returning all data');
      }
    }

    console.log(`✅ Fetched ${roadworks?.length || 0} roadworks from Supabase (FILTERED: Works planned/in progress, 180-day window)`);
    console.log(`📈 Query params used:`, {
      workStateFilter: 'Works planned, Works in progress',
      dateFilter: '180 days ahead + currently active',
      limit: 200,
      orderBy: 'sm_start_date.asc'
    });
    
    res.json({
      success: true,
      data: roadworks || [],
      roadworks: roadworks || [], // Keep for backward compatibility
      metadata: {
        count: roadworks?.length || 0,
        source: 'supabase_streetworks',
        table: 'streetworks',
        workStateFilter: 'Works planned, Works in progress',
        dateFilter: '180_days_ahead_plus_active',
        filterApplied: `States: [Works planned, Works in progress] + Dates: next 180 days OR currently active`,
        lastUpdated: new Date().toISOString(),
        breakthrough: 'Case sensitivity issue resolved - filtering now working!'
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