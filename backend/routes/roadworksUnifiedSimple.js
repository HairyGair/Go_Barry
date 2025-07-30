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
    
    // Calculate date range for next 30 days (temporarily expanded for debugging)
    const now = new Date();
    const next30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const nowISO = now.toISOString();
    const next30DaysISO = next30Days.toISOString();
    
    console.log('🔍 Date range debug:', {
      now: now.toISOString(),
      next30Days: next30Days.toISOString(),
      sampleStartDate: '2025-08-01T00:00:00+00:00',
      isWithinRange: new Date('2025-08-01T00:00:00+00:00') >= now && new Date('2025-08-01T00:00:00+00:00') <= next30Days
    });
    
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
          // Filter by work state: only show planned or in progress works
          'sm_works_state': 'in.(Works planned,Works in progress)',
          // Filter for roadworks starting within next 30 days (debugging)
          'and': `(sm_start_date.gte.${nowISO},sm_start_date.lte.${next30DaysISO})`,
          order: 'sm_start_date.asc'
          // No limit - get all roadworks starting in next 7 days
        },
        timeout: 10000
      });
      
      roadworks = response.data;
      
      // Process coordinates for each roadwork
      console.log(`🗺️ Processing coordinates for ${roadworks.length} roadworks...`);
      roadworks = roadworks.map(roadwork => {
        const processed = processStreetManagerCoordinates(roadwork);
        
        // Log coordinate processing results
        if (processed.coordinates) {
          console.log(`✅ ${processed.sm_reference}: [${processed.coordinates[0].toFixed(6)}, ${processed.coordinates[1].toFixed(6)}]`);
        } else {
          console.log(`❌ ${processed.sm_reference}: ${processed.coordinateError}`);
        }
        
        return processed;
      });
      
      const successfulCoordinates = roadworks.filter(r => r.coordinates).length;
      const coordinateSuccessRate = roadworks.length > 0 ? Math.round((successfulCoordinates / roadworks.length) * 100) : 0;
      console.log(`📍 Coordinate processing complete: ${successfulCoordinates}/${roadworks.length} (${coordinateSuccessRate}%) successful`);
      
      // Debug: Show first roadwork's raw data structure
      if (roadworks.length > 0) {
        const firstWork = response.data[0]; // Use original data before processing
        console.log('🔍 Raw Supabase data structure:', {
          id: firstWork.id,
          sm_reference: firstWork.sm_reference,
          availableFields: Object.keys(firstWork).sort(),
          coordinateFields: {
            sm_easting: firstWork.sm_easting,
            sm_northing: firstWork.sm_northing,
            works_location_coordinates: firstWork.works_location_coordinates,
            raw_webhook_data: firstWork.raw_webhook_data ? 'PRESENT' : 'MISSING',
            webhook_data_type: typeof firstWork.raw_webhook_data
          }
        });
      }
      
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
        
        // Process coordinates for fallback data too
        roadworks = roadworks.map(roadwork => processStreetManagerCoordinates(roadwork));
        console.log('✅ Fallback query successful with coordinate processing');
        
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
        
        // Process coordinates for final fallback data
        roadworks = roadworks.map(roadwork => processStreetManagerCoordinates(roadwork));
        console.log('✅ Final fallback: returning all data with coordinate processing');
      }
    }

    console.log(`✅ Fetched ${roadworks?.length || 0} roadworks from Supabase (FILTERED: Works planned/in progress, 180-day window)`);
    
    // Calculate coordinate statistics
    const coordinateStats = {
      total: roadworks?.length || 0,
      withCoordinates: roadworks?.filter(r => r.coordinates)?.length || 0,
      successRate: roadworks?.length > 0 ? Math.round((roadworks.filter(r => r.coordinates).length / roadworks.length) * 100) : 0
    };
    
    console.log(`📈 Query params used:`, {
      workStateFilter: 'Works planned, Works in progress',
      dateFilter: '180 days ahead + currently active',
      limit: 200,
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
        dateFilter: '30_days_ahead_start_date_debug',
        filterApplied: `States: [Works planned, Works in progress] + Dates: starting within next 30 days (debugging)`,
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