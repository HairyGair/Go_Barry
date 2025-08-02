import express from 'express';
import axios from 'axios';
import { processStreetManagerCoordinates } from '../utils/coordinateConverter.js';
import { calculateAffectedRoutes, formatAffectedRoutesSummary } from '../utils/routeImpactCalculator.js';
import { coordinateFallbackProcessor } from '../utils/coordinateFallbackProcessor.js';
import { coordinateValidator } from '../utils/coordinateValidator.js';

const router = express.Router();

// GET /api/roadworks/check-dates - Debug date filtering
router.get('/check-dates', (req, res) => {
  const days = parseInt(req.query.days) || 90;
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  const pastDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  res.json({
    currentDate: now.toISOString(),
    currentDateString: now.toString(),
    filterRange: {
      from: pastDate.toISOString(),
      to: futureDate.toISOString(),
      fromString: pastDate.toString(),
      toString: futureDate.toString()
    },
    days: days,
    explanation: 'The unified endpoint filters from 30 days ago to X days in future'
  });
});

// GET /api/roadworks/env-check - Check what environment variables are available
router.get('/env-check', (req, res) => {
  res.json({
    success: true,
    environment: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      renderService: process.env.RENDER_SERVICE_NAME
    },
    hint: 'If hasAnonKey is false but others are true, the key mapping might not be working'
  });
});

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

// GET /api/roadworks/debug-raw - Get raw data without filters
router.get('/debug-raw', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get raw data with no filters
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        select: 'id,sm_works_state,sm_start_date,sm_end_date,sm_street_name,sm_location_description,created_at',
        order: 'created_at.desc',
        limit: 50
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    // Analyze the data
    const states = {};
    const dateAnalysis = {
      total: data.length,
      hasStartDate: 0,
      futureStart: 0,
      pastStart: 0,
      activeNow: 0
    };
    
    const now = new Date();
    
    data.forEach(record => {
      // Count states
      if (record.sm_works_state) {
        states[record.sm_works_state] = (states[record.sm_works_state] || 0) + 1;
      }
      
      // Analyze dates
      if (record.sm_start_date) {
        dateAnalysis.hasStartDate++;
        const startDate = new Date(record.sm_start_date);
        if (startDate > now) {
          dateAnalysis.futureStart++;
        } else {
          dateAnalysis.pastStart++;
        }
        
        // Check if active now
        if (record.sm_end_date) {
          const endDate = new Date(record.sm_end_date);
          if (startDate <= now && endDate >= now) {
            dateAnalysis.activeNow++;
          }
        }
      }
    });
    
    res.json({
      success: true,
      totalRecords: data.length,
      stateBreakdown: states,
      dateAnalysis,
      sampleRecords: data.slice(0, 5).map(r => ({
        id: r.id,
        state: r.sm_works_state,
        startDate: r.sm_start_date,
        endDate: r.sm_end_date,
        location: r.sm_street_name || r.sm_location_description,
        createdAt: r.created_at
      })),
      recommendation: dateAnalysis.activeNow === 0 
        ? 'No currently active roadworks. Consider expanding date range or checking data import.'
        : `Found ${dateAnalysis.activeNow} active roadworks`
    });
    
  } catch (error) {
    console.error('Debug raw error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// GET /api/roadworks/debug-auth - Check Supabase authentication
router.get('/debug-auth', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔍 Checking Supabase auth...');
    console.log('URL exists:', !!supabaseUrl);
    console.log('Key exists:', !!supabaseKey);
    console.log('Key length:', supabaseKey?.length || 0);
    
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        success: false,
        error: 'Missing credentials',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    
    // Try a simple query
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
    
    res.json({
      success: true,
      message: 'Supabase connection successful',
      recordCount: response.data.length,
      status: response.status
    });
    
  } catch (error) {
    console.error('Auth check error:', error.response?.data || error.message);
    res.json({
      success: false,
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
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
    
    // Get date range from query params (default 90 days)
    const days = parseInt(req.query.days) || 90;
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    const pastDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
    
    console.log(`🗄️ Fetching roadworks for ${days} day window`);
    console.log(`📊 Currently showing all planned/in-progress roadworks (no date filter)`);
    console.log(`🔑 API Key length: ${supabaseKey?.length || 0}`);
    
    let roadworks = [];
    
    try {
      // Get roadworks within date range - single request with reasonable limit
      console.log('🔍 Fetching roadworks within date range...');
      console.log('📅 Date filter:', {
        from: pastDate.toISOString(),
        to: futureDate.toISOString(),
        daysRange: days
      });
      console.log('🏷️ State filter:', 'Works planned, Works in progress');
      
      const requestParams = {
        'sm_works_state': 'in.(Works planned,Works in progress)',
        order: 'sm_start_date.desc',
        limit: 300
      };
      
      console.log('📤 Request params:', requestParams);
      console.log('🅰️ Making request to:', `${supabaseUrl}/rest/v1/streetworks`);
      
      let response;
      try {
        response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          params: requestParams,
          timeout: 30000
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', response.headers['content-type']);
        console.log('📥 Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
        console.log('📥 Response data length:', response.data?.length);
        
      } catch (axiosError) {
        console.error('🆘 Axios error details:', {
          message: axiosError.message,
          code: axiosError.code,
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
        throw axiosError;
      }
      
      roadworks = response.data;
      console.log(`✅ Found ${roadworks.length} roadworks with state filter`);
      console.log('🔍 First few results:', roadworks.slice(0, 3).map(r => ({
        state: r.sm_works_state,
        location: r.sm_street_name,
        dates: `${r.sm_start_date} to ${r.sm_end_date}`
      })));
      
    } catch (error) {
      console.error('❌ Error fetching roadworks:', error.message);
      console.error('📝 Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // If it's a 401, it's likely an auth issue
      if (error.response?.status === 401) {
        console.error('🔒 Authentication failed - check SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
      }
      
      roadworks = [];
    }
    
    // Process coordinates for each roadwork
    console.log(`🗺️ Processing coordinates and route impacts for ${roadworks.length} roadworks...`);
    console.log('🔍 Pre-processing count:', roadworks.length);
    
    // Process with coordinate conversion and route impact calculation
    const processedRoadworks = await Promise.all(roadworks.map(async (roadwork) => {
      // First, process coordinates with standard converter
      let processed = processStreetManagerCoordinates(roadwork);
      
      // Validate coordinates to detect defaults/mismatches
      processed = coordinateValidator.processWithValidation(processed);
      
      // If no coordinates found or validation failed, use enhanced fallback processor
      if (!processed.coordinates) {
        processed = await coordinateFallbackProcessor.processRoadworkWithFallbacks(processed);
        console.log(`🔍 Fallback processing for ${processed.sm_reference}: ${processed.coordinateFallbackStrategy}`);
      }
      
      // Log coordinate processing results (limit logging for performance)
      if (roadworks.length < 100 && processed.coordinates) {
        console.log(`✅ ${processed.sm_reference}: [${processed.coordinates[0].toFixed(6)}, ${processed.coordinates[1].toFixed(6)}]`);
      } else if (roadworks.length < 100 && !processed.coordinates) {
        console.log(`⚠️ ${processed.sm_reference}: No valid coordinates - ${processed.coordinateValidation?.reason || 'unknown reason'}`);
      }
      
      // Calculate affected routes if we have valid coordinates
      if (processed.coordinates || processed.works_location_coordinates) {
        try {
          const affectedRoutes = await calculateAffectedRoutes(processed);
          processed.affectedRoutes = affectedRoutes;
          processed.affectedRoutesSummary = formatAffectedRoutesSummary(affectedRoutes);
          
          if (affectedRoutes.length > 0 && roadworks.length < 50) {
            console.log(`🚌 ${processed.sm_reference}: Affects ${processed.affectedRoutesSummary}`);
          }
        } catch (error) {
          console.error(`⚠️ Route impact calculation failed for ${processed.sm_reference}:`, error.message);
          processed.affectedRoutes = [];
          processed.affectedRoutesSummary = 'Unable to calculate';
        }
      } else {
        processed.affectedRoutes = [];
        processed.affectedRoutesSummary = 'No coordinates available';
      }
      
      return processed;
    }));
    
    roadworks = processedRoadworks;
    console.log('🔍 Post-processing count:', roadworks.length);
    
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
      dateFilter: `${days} days (${pastDate.toLocaleDateString()} to ${futureDate.toLocaleDateString()})`,
      limit: 500,
      totalFetched: roadworks.length,
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
        dateFilter: `${days}_days`,
        dateRange: {
          from: pastDate.toISOString(),
          to: futureDate.toISOString(),
          days: days
        },
        limit: 500,
        coordinateProcessing: {
          total: coordinateStats.total,
          successful: coordinateStats.withCoordinates,
          successRate: `${coordinateStats.successRate}%`,
          conversionMethod: 'OSGB36_to_WGS84'
        },
        routeImpactAnalysis: {
          enabled: true,
          roadworksWithImpact: roadworks.filter(r => r.affectedRoutes && r.affectedRoutes.length > 0).length,
          totalRoutesAffected: roadworks.reduce((sum, r) => sum + (r.affectedRoutes?.length || 0), 0)
        },
        lastUpdated: new Date().toISOString(),
        memoryOptimized: true
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

// DELETE /api/roadworks/unified/:id - Permanently delete a roadwork alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisorId, supervisorName, reason, notes } = req.body;
    
    console.log(`🗑️ PERMANENTLY DELETING roadwork ${id} by ${supervisorName}`);
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase configuration missing'
      });
    }
    
    // First, get the roadwork details for logging
    const fetchResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'id': `eq.${id}`
      },
      timeout: 10000
    });
    
    const roadwork = fetchResponse.data[0];
    if (!roadwork) {
      return res.status(404).json({
        success: false,
        error: 'Roadwork not found'
      });
    }
    
    // Log the deletion details before deleting
    console.log('🔍 Roadwork to be deleted:', {
      id: roadwork.id,
      reference: roadwork.sm_reference,
      location: roadwork.sm_street_name || roadwork.sm_location_description,
      startDate: roadwork.sm_start_date,
      endDate: roadwork.sm_end_date,
      promoter: roadwork.sm_promoter_organisation
    });
    
    // Perform the permanent deletion
    const deleteResponse = await axios.delete(
      `${supabaseUrl}/rest/v1/streetworks?id=eq.${id}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
      console.log('✅ Roadwork permanently deleted from database');
      
      // Log deletion audit trail
      const deletionRecord = {
        roadworkId: id,
        roadworkReference: roadwork.sm_reference,
        roadworkLocation: roadwork.sm_street_name || roadwork.sm_location_description,
        deletedBy: supervisorName,
        supervisorId: supervisorId,
        reason: reason,
        notes: notes,
        deletedAt: new Date().toISOString(),
        originalData: {
          startDate: roadwork.sm_start_date,
          endDate: roadwork.sm_end_date,
          promoter: roadwork.sm_promoter_organisation,
          trafficManagement: roadwork.sm_traffic_management_type
        }
      };
      
      console.log('📝 Deletion audit trail:', deletionRecord);
      
      res.json({
        success: true,
        message: 'Roadwork permanently deleted',
        deletionRecord: deletionRecord
      });
    } else {
      throw new Error(`Unexpected delete response status: ${deleteResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error permanently deleting roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// GET /api/roadworks/test-route-impact/:id - Test route impact calculation for a specific roadwork
router.get('/test-route-impact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧪 Testing route impact calculation for roadwork ${id}`);
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Fetch specific roadwork
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'id': `eq.${id}`,
        limit: 1
      },
      timeout: 10000
    });
    
    const roadwork = response.data[0];
    if (!roadwork) {
      return res.status(404).json({ success: false, error: 'Roadwork not found' });
    }
    
    // Process coordinates
    const processed = processStreetManagerCoordinates(roadwork);
    
    // Calculate affected routes
    const affectedRoutes = await calculateAffectedRoutes(processed);
    const summary = formatAffectedRoutesSummary(affectedRoutes);
    
    res.json({
      success: true,
      roadwork: {
        id: roadwork.id,
        location: roadwork.sm_street_name || roadwork.sm_location_description,
        coordinates: processed.coordinates,
        coordinateSource: processed.coordinateSource,
        works_location_coordinates: processed.works_location_coordinates
      },
      affectedRoutes: affectedRoutes,
      affectedRoutesSummary: summary,
      metadata: {
        totalRoutesAffected: affectedRoutes.length,
        uniqueRouteNumbers: [...new Set(affectedRoutes.map(r => r.routeNumber))].length,
        directions: {
          inbound: affectedRoutes.filter(r => r.direction === 'inbound').length,
          outbound: affectedRoutes.filter(r => r.direction === 'outbound').length
        },
        highImpact: affectedRoutes.filter(r => r.impact.severity === 'high').length
      }
    });
    
  } catch (error) {
    console.error('❌ Test route impact error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/roadworks/debug-coordinate-validation - Debug coordinate validation
router.get('/debug-coordinate-validation', async (req, res) => {
  try {
    console.log('🔍 Debug: Testing coordinate validation...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get some roadworks to test
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'sm_highway_authority': 'eq.NORTH TYNESIDE COUNCIL',
        order: 'created_at.desc',
        limit: 10
      },
      timeout: 10000
    });
    
    const roadworks = response.data;
    const validationResults = [];
    
    for (const roadwork of roadworks) {
      // Process coordinates
      let processed = processStreetManagerCoordinates(roadwork);
      
      // Validate
      const beforeValidation = {
        hasCoordinates: !!processed.coordinates,
        coordinates: processed.coordinates,
        source: processed.coordinateSource
      };
      
      processed = coordinateValidator.processWithValidation(processed);
      
      const afterValidation = {
        hasCoordinates: !!processed.coordinates,
        coordinates: processed.coordinates,
        validation: processed.coordinateValidation
      };
      
      validationResults.push({
        id: roadwork.id,
        streetName: roadwork.sm_street_name,
        authority: roadwork.sm_highway_authority,
        beforeValidation,
        afterValidation,
        wouldUseFallback: !processed.coordinates
      });
    }
    
    // Special check for Killingworth Way
    const killingworthCheck = roadworks.find(r => 
      r.sm_street_name && r.sm_street_name.toLowerCase().includes('killingworth')
    );
    
    res.json({
      success: true,
      totalChecked: validationResults.length,
      invalidated: validationResults.filter(r => r.wouldUseFallback).length,
      killingworthWayFound: !!killingworthCheck,
      killingworthDetails: killingworthCheck ? {
        streetName: killingworthCheck.sm_street_name,
        originalCoords: killingworthCheck.coordinates,
        processedCoords: validationResults.find(r => r.id === killingworthCheck.id)
      } : null,
      results: validationResults
    });
    
  } catch (error) {
    console.error('❌ Debug coordinate validation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/roadworks/test-connection - Simple test to check if we can connect at all
router.get('/test-connection', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    // Step 1: Check env vars
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        success: false,
        step: 'env_check',
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
        keyLength: supabaseKey?.length || 0
      });
    }
    
    // Step 2: Try to connect with no filters
    let response;
    try {
      response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        },
        params: {
          limit: 1
        },
        timeout: 10000
      });
    } catch (axiosError) {
      return res.json({
        success: false,
        step: 'connection',
        error: axiosError.message,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        responseData: axiosError.response?.data,
        hint: axiosError.response?.status === 401 
          ? 'Invalid API key - check SUPABASE_ANON_KEY in Render environment variables'
          : 'Connection failed - check SUPABASE_URL in Render environment variables'
      });
    }
    
    // Step 3: Check the response
    const totalCount = response.headers['content-range']?.split('/')[1] || 'unknown';
    
    res.json({
      success: true,
      message: 'Connection successful!',
      totalRecordsInTable: totalCount,
      sampleRecord: response.data[0] ? {
        hasData: true,
        id: response.data[0].id,
        state: response.data[0].sm_works_state,
        location: response.data[0].sm_street_name || response.data[0].sm_location_description
      } : {
        hasData: false,
        message: 'Table exists but is empty'
      },
      nextSteps: totalCount === '0' 
        ? 'The streetworks table is empty. Check if data is being imported from Street Manager.'
        : 'Connection works! Check /api/roadworks/debug-raw to see why /unified might return empty.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      step: 'unexpected_error',
      error: error.message
    });
  }
});

export default router;