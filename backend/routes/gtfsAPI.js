// backend/routes/gtfsAPI.js
// Enhanced GTFS Analysis API with Performance Monitoring

import express from 'express';
import enhancedGTFSMatcher, { 
  findRoutesNearCoordinatesEnhanced, 
  getDetailedRouteMatches,
  getGTFSMatcherStats 
} from '../services/enhancedGTFSMatcher.js';

const router = express.Router();

// Test enhanced route matching
router.post('/match/enhanced', async (req, res) => {
  try {
    const { lat, lng, radius = 250 } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const startTime = Date.now();
    const detailedMatches = await getDetailedRouteMatches(lat, lng, radius);
    const simpleRoutes = detailedMatches.map(match => match.shortName).filter(Boolean);
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      location: { lat, lng, radius },
      routes: simpleRoutes,
      detailedMatches,
      performance: {
        processingTimeMs: processingTime,
        totalCandidates: detailedMatches.length,
        highConfidenceMatches: detailedMatches.filter(m => m.confidence > 0.7).length,
        shapeBasedMatches: detailedMatches.filter(m => m.matchType === 'shape_geometry').length
      },
      accuracy: {
        averageConfidence: detailedMatches.length > 0 ? 
          Math.round((detailedMatches.reduce((sum, m) => sum + m.confidence, 0) / detailedMatches.length) * 100) / 100 : 0,
        bestMatch: detailedMatches[0] || null,
        methodsUsed: [...new Set(detailedMatches.map(m => m.matchType))]
      }
    });
  } catch (error) {
    console.error('❌ Enhanced route matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform enhanced route matching'
    });
  }
});

// Get GTFS matcher statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = getGTFSMatcherStats();
    
    res.json({
      success: true,
      statistics: stats,
      systemHealth: {
        status: stats.isInitialized ? 'operational' : 'initializing',
        memoryPressure: stats.memoryUsage.heapUsed > 1800 ? 'high' : 'normal',
        cacheEfficiency: `${stats.cacheHitRate}%`
      },
      recommendations: {
        memoryUsage: stats.memoryUsage.heapUsed < 1536 ? 'optimal' : 'high',
        cachePerformance: stats.cacheHitRate > 70 ? 'excellent' : 'needs_improvement'
      }
    });
  } catch (error) {
    console.error('❌ GTFS stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get GTFS statistics'
    });
  }
});

// Predefined test coordinates for accuracy testing
const TEST_COORDINATES = [
  { lat: 54.9783, lng: -1.6178, name: 'Newcastle Central Station' },
  { lat: 54.9526, lng: -1.6014, name: 'Gateshead Interchange' },
  { lat: 54.9069, lng: -1.3838, name: 'Sunderland City Centre' },
  { lat: 54.7753, lng: -1.5849, name: 'Durham Bus Station' },
  { lat: 54.9158, lng: -1.5721, name: 'A1 Junction 65' },
  { lat: 55.0059, lng: -1.4923, name: 'Cramlington' }
];

// Run accuracy test
router.get('/test/accuracy', async (req, res) => {
  try {
    console.log('🧪 Running GTFS accuracy test...');
    
    const startTime = Date.now();
    const results = [];
    
    for (const testPoint of TEST_COORDINATES) {
      const matches = await getDetailedRouteMatches(testPoint.lat, testPoint.lng, 500);
      
      results.push({
        location: testPoint,
        routes: matches.map(m => m.shortName).filter(Boolean),
        matchCount: matches.length,
        averageConfidence: matches.length > 0 ? 
          Math.round((matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length) * 100) / 100 : 0,
        bestMatch: matches[0] || null
      });
    }
    
    const totalTime = Date.now() - startTime;
    
    const overallStats = {
      totalLocations: TEST_COORDINATES.length,
      locationsWithMatches: results.filter(r => r.routes.length > 0).length,
      averageRoutesPerLocation: Math.round((results.reduce((sum, r) => sum + r.routes.length, 0) / TEST_COORDINATES.length) * 10) / 10,
      averageProcessingTime: Math.round(totalTime / TEST_COORDINATES.length),
      overallAccuracy: Math.round((results.reduce((sum, r) => sum + r.averageConfidence, 0) / TEST_COORDINATES.length) * 100) / 100
    };
    
    res.json({
      success: true,
      testResults: results,
      overallAccuracy: overallStats,
      benchmarks: {
        processingSpeed: overallStats.averageProcessingTime < 100 ? 'excellent' : 'good',
        matchCoverage: overallStats.locationsWithMatches / overallStats.totalLocations >= 0.9 ? 'excellent' : 'good',
        confidence: overallStats.overallAccuracy > 0.8 ? 'excellent' : overallStats.overallAccuracy > 0.6 ? 'good' : 'needs_improvement'
      }
    });
  } catch (error) {
    console.error('❌ GTFS accuracy test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run accuracy test'
    });
  }
});

// Performance monitoring
router.get('/performance', async (req, res) => {
  try {
    const stats = getGTFSMatcherStats();
    const memUsage = process.memoryUsage();
    
    const performance = {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / (2048 * 1024 * 1024)) * 100) // % of 2GB
      },
      gtfs: {
        routes: stats.totalRoutes,
        stops: stats.totalStops,
        shapes: stats.totalShapes,
        cacheHitRate: stats.cacheHitRate
      }
    };
    
    res.json({
      success: true,
      performance,
      status: {
        memoryPressure: performance.memory.percentage > 85 ? 'high' : 'normal',
        overallHealth: performance.memory.percentage < 80 && performance.gtfs.cacheHitRate > 60 ? 'excellent' : 'good'
      }
    });
  } catch (error) {
    console.error('❌ Performance monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance metrics'
    });
  }
});

export default router;