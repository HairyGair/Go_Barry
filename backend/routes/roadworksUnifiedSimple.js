import express from 'express';
import axios from 'axios';
import { processStreetManagerCoordinates } from '../utils/coordinateConverter.js';

const router = express.Router();

// GET /api/roadworks/debug-coordinate-data - Debug coordinate field availability
router.get('/debug-coordinate-data', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking coordinate field availability...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get one record to check ALL available fields
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1
      },
      timeout: 10000
    });
    
    const record = response.data[0];
    
    if (!record) {
      return res.json({ success: false, error: 'No records found' });
    }
    
    // Check coordinate-related fields
    const coordinateFields = {
      'latitude': record.latitude,
      'longitude': record.longitude, 
      'works_location_coordinates': record.works_location_coordinates,
      'raw_webhook_data': record.raw_webhook_data,
      'geometry': record.geometry,
      'location_text': record.sm_location_description,
      'coordinates': record.coordinates
    };
    
    // Check if raw_webhook_data has nested coordinate data
    let webhookCoordinates = null;
    if (record.raw_webhook_data) {
      try {
        const webhookData = typeof record.raw_webhook_data === 'string' 
          ? JSON.parse(record.raw_webhook_data) 
          : record.raw_webhook_data;
        webhookCoordinates = webhookData?.object_data?.works_location_coordinates;
      } catch (e) {
        webhookCoordinates = 'Parse error: ' + e.message;
      }
    }
    
    res.json({
      success: true,
      debug: {
        totalFields: Object.keys(record).length,
        allFields: Object.keys(record).sort(),
        coordinateFields: coordinateFields,
        webhookCoordinates: webhookCoordinates,
        sampleRecord: {
          id: record.id,
          sm_reference: record.sm_reference,
          location: record.sm_location_description?.substring(0, 100)
        },
        recommendations: {
          hasDirectCoordinateField: !!record.works_location_coordinates,
          hasLatLng: !!(record.latitude && record.longitude),
          hasWebhookData: !!record.raw_webhook_data,
          hasGeometry: !!record.geometry
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Debug coordinate data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/roadworks/debug-next-7-days - Check what's scheduled for next 7 days
router.get('/debug-next-7-days', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking roadworks for next 7 days...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    const now = new Date();
    const next7Days = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const next30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Query for all roadworks starting in next 30 days to see distribution
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'sm_start_date': `gte.${now.toISOString()},lte.${next30Days.toISOString()}`,
        'sm_works_state': 'in.(Works planned,Works in progress)',
        select: 'id,sm_reference,sm_street_name,sm_location_description,sm_start_date,sm_end_date,sm_works_state',
        order: 'sm_start_date.asc',
        limit: 100
      },
      timeout: 10000
    });
    
    const roadworks = response.data;
    
    // Analyze by week
    const analysis = {
      currentDate: now.toISOString(),
      next7DaysCutoff: next7Days.toISOString(),
      totalFound: roadworks.length,
      byWeek: {
        next7Days: [],
        week2: [],
        week3: [],
        week4Plus: []
      }
    };
    
    roadworks.forEach(work => {
      if (!work.sm_start_date) return;
      
      const startDate = new Date(work.sm_start_date);
      const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      const workSummary = {
        location: work.sm_street_name || work.sm_location_description,
        startDate: work.sm_start_date,
        daysUntil: daysUntil,
        state: work.sm_works_state
      };
      
      if (daysUntil > 0 && daysUntil <= 7) {
        analysis.byWeek.next7Days.push(workSummary);
      } else if (daysUntil > 7 && daysUntil <= 14) {
        analysis.byWeek.week2.push(workSummary);
      } else if (daysUntil > 14 && daysUntil <= 21) {
        analysis.byWeek.week3.push(workSummary);
      } else if (daysUntil > 21) {
        analysis.byWeek.week4Plus.push(workSummary);
      }
    });
    
    // Add summary
    analysis.summary = {
      next7DaysCount: analysis.byWeek.next7Days.length,
      message: analysis.byWeek.next7Days.length === 0 
        ? 'No roadworks scheduled to start in next 7 days' 
        : `${analysis.byWeek.next7Days.length} roadworks starting in next 7 days`
    };
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('❌ Debug next 7 days error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    
    // Remove date filtering - get ALL roadworks for comprehensive view
    console.log('🗄️ Fetching ALL roadworks from Supabase table (10,000+ entries)');
    console.log('📊 No date filtering - supervisors control relevance through dismissals');
    
    let roadworks = [];
    
    try {
      // Get ALL planned and in-progress roadworks - no date or limit filters
      console.log('🔍 Fetching ALL planned/in-progress roadworks (no date filter, no limit)...');
      
      const futureResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          'sm_works_state': 'in.(Works planned,Works in progress)',
          order: 'sm_start_date.asc',
          limit: 15000  // Fetch 15000 records
        },
        timeout: 60000 // 60 seconds for 15000 records
      });
      
      console.log(`✅ Found ${futureResponse.data.length} roadworks (future + active)`);
      
      // Simple debug log for date distribution
      const futureWorksDebug = futureResponse.data
        .filter(w => w.sm_start_date && new Date(w.sm_start_date) > new Date())
        .slice(0, 5)
        .map(w => {
          const days = Math.ceil((new Date(w.sm_start_date) - new Date()) / (1000 * 60 * 60 * 24));
          return `${w.sm_street_name || w.sm_location_description} - ${days} days`;
        });
      console.log('📅 Next few roadworks:', futureWorksDebug);
      
      // Use the full dataset
      if (futureResponse.data.length > 0) {
        roadworks = futureResponse.data;
        console.log('🎯 Using comprehensive roadworks dataset for frontend filtering');
      }
      
    } catch (futureError) {
      console.warn('⚠️ Future roadworks query failed, trying broader approach:', futureError.message);
    }
    
    // If no future works found, or error occurred, get broader dataset
    if (roadworks.length === 0) {
      try {
        console.log('🔍 Fallback: Fetching all planned/in-progress works without date filter...');
        
        // Get all planned and in-progress works (no date filter)
        const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            'sm_works_state': 'in.(Works planned,Works in progress)',
            order: 'sm_start_date.asc',
            limit: 15000  // Fetch 15000 records
          },
          timeout: 60000  // 60 seconds for 15000 records
        });
        
        roadworks = response.data;
        console.log(`✅ Fallback: Found ${roadworks.length} planned/in-progress works (no date filter)`);
        
      } catch (broadError) {
        console.error('❌ Broader dataset query also failed:', broadError.message);
        // Final fallback - return empty array
        roadworks = [];
      }
    }
    
    // Process coordinates for each roadwork
    console.log(`🗺️ Processing coordinates for ${roadworks.length} roadworks...`);
    roadworks = roadworks.map(roadwork => {
      const processed = processStreetManagerCoordinates(roadwork);
      
      // Log coordinate processing results (limit logging for performance)
      if (roadworks.length < 100 && processed.coordinates) {
        console.log(`✅ ${processed.sm_reference}: [${processed.coordinates[0].toFixed(6)}, ${processed.coordinates[1].toFixed(6)}]`);
      }
      
      return processed;
    });
    
    const successfulCoordinates = roadworks.filter(r => r.coordinates).length;
    const coordinateSuccessRate = roadworks.length > 0 ? Math.round((successfulCoordinates / roadworks.length) * 100) : 0;
    console.log(`📍 Coordinate processing complete: ${successfulCoordinates}/${roadworks.length} (${coordinateSuccessRate}%) successful`);
    
    console.log(`✅ Fetched ${roadworks?.length || 0} roadworks from Supabase (FILTERED: Works planned/in progress, NO date filter)`);
    
    // Calculate coordinate statistics
    const coordinateStats = {
      total: roadworks?.length || 0,
      withCoordinates: roadworks?.filter(r => r.coordinates)?.length || 0,
      successRate: roadworks?.length > 0 ? Math.round((roadworks.filter(r => r.coordinates).length / roadworks.length) * 100) : 0
    };
    
    console.log(`📈 Query params used:`, {
      workStateFilter: 'Works planned, Works in progress',
      dateFilter: 'none - all roadworks',
      limit: 15000,
      orderBy: 'sm_start_date.asc',
      coordinateProcessing: `${coordinateStats.withCoordinates}/${coordinateStats.total} (${coordinateStats.successRate}%)`
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
        dateFilter: 'none_all_roadworks',
        filterApplied: 'All planned/in-progress works - no date filtering',
        dismissalNote: 'Frontend handles dismissals to manage memory',
        coordinateProcessing: {
          total: coordinateStats.total,
          successful: coordinateStats.withCoordinates,
          successRate: `${coordinateStats.successRate}%`,
          conversionMethod: 'OSGB36_to_WGS84'
        },
        lastUpdated: new Date().toISOString(),
        breakthrough: 'Case sensitivity issue resolved + coordinate conversion added!'
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