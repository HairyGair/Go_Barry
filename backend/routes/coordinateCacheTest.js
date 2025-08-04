// backend/routes/coordinateCacheTest.js
// Test endpoint to verify coordinate caching works with new columns

import express from 'express';
import axios from 'axios';
import { coordinateCacheService } from '../services/coordinateCacheService.js';
import { processStreetManagerCoordinates } from '../utils/coordinateConverterProj4.js';

const router = express.Router();

// GET /api/coordinate-cache/test - Test coordinate caching
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing coordinate cache with new columns...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get a roadwork with coordinates to test
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'sm_works_state': 'in.(Works planned,Works in progress)',
        'sm_easting': 'not.is.null',
        limit: 1
      },
      timeout: 10000
    });
    
    if (response.data.length === 0) {
      return res.json({ 
        success: false, 
        error: 'No roadworks with coordinates found for testing' 
      });
    }
    
    const testRoadwork = response.data[0];
    console.log('📍 Test roadwork:', {
      id: testRoadwork.id,
      location: testRoadwork.sm_street_name,
      hasEasting: !!testRoadwork.sm_easting,
      hasNorthing: !!testRoadwork.sm_northing
    });
    
    // Step 1: Process coordinates
    const processed = await processStreetManagerCoordinates(testRoadwork);
    
    // Step 2: Try to cache them
    if (processed.coordinates) {
      await coordinateCacheService.storeCachedCoordinates(
        testRoadwork.id,
        processed.coordinates,
        {
          source: processed.coordinateSource,
          accuracy: processed.coordinateAccuracy || 'high',
          originalEasting: testRoadwork.sm_easting,
          originalNorthing: testRoadwork.sm_northing
        }
      );
      
      // Step 3: Fetch the record again to verify caching worked
      const verifyResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          'id': `eq.${testRoadwork.id}`,
          select: 'id,cached_lat,cached_lng,cached_coordinate_source,cached_coordinate_accuracy,cached_at,coordinate_metadata'
        },
        timeout: 10000
      });
      
      const cachedRecord = verifyResponse.data[0];
      
      res.json({
        success: true,
        test: {
          roadworkId: testRoadwork.id,
          location: testRoadwork.sm_street_name,
          originalCoords: {
            easting: testRoadwork.sm_easting,
            northing: testRoadwork.sm_northing
          },
          processedCoords: {
            lat: processed.coordinates[0],
            lng: processed.coordinates[1],
            source: processed.coordinateSource
          },
          cachedData: {
            cached_lat: cachedRecord.cached_lat,
            cached_lng: cachedRecord.cached_lng,
            cached_coordinate_source: cachedRecord.cached_coordinate_source,
            cached_coordinate_accuracy: cachedRecord.cached_coordinate_accuracy,
            cached_at: cachedRecord.cached_at,
            coordinate_metadata: cachedRecord.coordinate_metadata
          },
          cacheSuccess: !!(cachedRecord.cached_lat && cachedRecord.cached_lng),
          memoryCacheStats: coordinateCacheService.getCacheStats()
        }
      });
      
    } else {
      res.json({
        success: false,
        error: 'No coordinates could be processed for test roadwork',
        roadwork: {
          id: testRoadwork.id,
          location: testRoadwork.sm_street_name
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Coordinate cache test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// GET /api/coordinate-cache/verify-columns - Check if new columns exist
router.get('/verify-columns', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get one record to check columns
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
    
    // Check for new columns
    const newColumns = {
      cached_lat: record.hasOwnProperty('cached_lat'),
      cached_lng: record.hasOwnProperty('cached_lng'),
      cached_coordinate_source: record.hasOwnProperty('cached_coordinate_source'),
      cached_coordinate_accuracy: record.hasOwnProperty('cached_coordinate_accuracy'),
      cached_at: record.hasOwnProperty('cached_at'),
      coordinate_metadata: record.hasOwnProperty('coordinate_metadata')
    };
    
    const allColumnsExist = Object.values(newColumns).every(exists => exists === true);
    
    res.json({
      success: true,
      columnsExist: allColumnsExist,
      columnStatus: newColumns,
      message: allColumnsExist 
        ? '✅ All coordinate caching columns exist!' 
        : '❌ Some columns are missing - run the migration script',
      sampleValues: allColumnsExist ? {
        cached_lat: record.cached_lat,
        cached_lng: record.cached_lng,
        cached_coordinate_source: record.cached_coordinate_source,
        cached_coordinate_accuracy: record.cached_coordinate_accuracy,
        cached_at: record.cached_at,
        coordinate_metadata: record.coordinate_metadata
      } : null
    });
    
  } catch (error) {
    console.error('❌ Column verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/coordinate-cache/stats - Get caching statistics
router.get('/stats', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, error: 'Supabase configuration missing' });
    }
    
    // Get statistics on cached coordinates
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        'sm_works_state': 'in.(Works planned,Works in progress)',
        select: 'id,cached_lat,cached_lng,cached_coordinate_source,cached_at',
        limit: 1000
      },
      timeout: 10000
    });
    
    const roadworks = response.data;
    
    // Calculate statistics
    const stats = {
      total: roadworks.length,
      withCachedCoords: roadworks.filter(r => r.cached_lat && r.cached_lng).length,
      cachePercentage: 0,
      byCacheSource: {},
      cacheAge: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        older: 0,
        neverCached: 0
      }
    };
    
    stats.cachePercentage = stats.total > 0 
      ? Math.round((stats.withCachedCoords / stats.total) * 100) 
      : 0;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    roadworks.forEach(r => {
      if (r.cached_lat && r.cached_lng) {
        // Count by source
        const source = r.cached_coordinate_source || 'unknown';
        stats.byCacheSource[source] = (stats.byCacheSource[source] || 0) + 1;
        
        // Count by age
        if (r.cached_at) {
          const cachedDate = new Date(r.cached_at);
          if (cachedDate >= todayStart) {
            stats.cacheAge.today++;
          } else if (cachedDate >= weekAgo) {
            stats.cacheAge.thisWeek++;
          } else if (cachedDate >= monthAgo) {
            stats.cacheAge.thisMonth++;
          } else {
            stats.cacheAge.older++;
          }
        }
      } else {
        stats.cacheAge.neverCached++;
      }
    });
    
    res.json({
      success: true,
      statistics: stats,
      memoryCacheStats: coordinateCacheService.getCacheStats(),
      recommendations: {
        cacheRate: stats.cachePercentage < 50 
          ? 'Low cache rate - consider running batch coordinate processing'
          : 'Good cache coverage',
        oldCache: stats.cacheAge.older > stats.withCachedCoords * 0.3
          ? 'Many cached coordinates are old - consider refreshing'
          : 'Cache is relatively fresh'
      }
    });
    
  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
