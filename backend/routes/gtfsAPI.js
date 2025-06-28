// backend/routes/gtfsAPI.js
// GTFS API endpoints for route matching and testing

import express from 'express';
import gtfsService from '../services/gtfsService.js';
import { 
  findAffectedRoutes, 
  findRoutesByLocation, 
  findAffectedRoutesEnhanced,
  getRouteDetails,
  getGTFSStats,
  isGTFSReady 
} from '../utils/gtfsRouteMatching.js';

const router = express.Router();

/**
 * GET /api/gtfs/stats
 * Get GTFS system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getGTFSStats();
    res.json({
      success: true,
      data: stats,
      ready: isGTFSReady(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gtfs/match/coordinate
 * Find routes by coordinate
 */
router.post('/match/coordinate', async (req, res) => {
  try {
    const { lat, lng, radius = 250 } = req.body;
    
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Valid latitude and longitude required'
      });
    }
    
    if (!isGTFSReady()) {
      return res.status(503).json({
        success: false,
        error: 'GTFS service not ready'
      });
    }
    
    const routes = await findAffectedRoutes(lat, lng, radius);
    
    res.json({
      success: true,
      data: {
        routes: routes,
        count: routes.length,
        coordinates: { lat, lng },
        radius: radius
      },
      method: 'GTFS Coordinate Matching',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gtfs/match/location
 * Find routes by location text
 */
router.post('/match/location', (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location || typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Location text required'
      });
    }
    
    if (!isGTFSReady()) {
      return res.status(503).json({
        success: false,
        error: 'GTFS service not ready'
      });
    }
    
    const routes = findRoutesByLocation(location);
    
    res.json({
      success: true,
      data: {
        routes: routes,
        count: routes.length,
        location: location
      },
      method: 'GTFS Location Text Matching',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gtfs/match/enhanced
 * Enhanced GTFS route matching with confidence scoring
 */
router.post('/match/enhanced', async (req, res) => {
  try {
    const { lat, lng, radius = 1000, includeStops = true, includeShapes = true, includeDirections = false } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    console.log(`🎯 Enhanced GTFS matching: ${lat}, ${lng} (radius: ${radius}m)`);
    
    // Use the enhanced GTFS matcher
    const enhancedGTFSMatcher = (await import('../services/enhancedGTFSMatcher.js')).default;
    const result = await enhancedGTFSMatcher.matchRoutesEnhanced(lat, lng, {
      radius,
      maxResults: 20,
      includeStops,
      includeShapes,
      includeDirections,
      confidenceThreshold: 0.1
    });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Enhanced GTFS matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      matches: []
    });
  }
});

/**
 * GET /api/gtfs/route/:routeName
 * Get detailed information about a specific route
 */
router.get('/route/:routeName', (req, res) => {
  try {
    const { routeName } = req.params;
    
    if (!isGTFSReady()) {
      return res.status(503).json({
        success: false,
        error: 'GTFS service not ready'
      });
    }
    
    const routeDetails = getRouteDetails(routeName);
    
    if (!routeDetails) {
      return res.status(404).json({
        success: false,
        error: `Route '${routeName}' not found`
      });
    }
    
    res.json({
      success: true,
      data: routeDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/gtfs/test/accuracy
 * Test route matching accuracy with known locations
 */
router.post('/test/accuracy', async (req, res) => {
  try {
    if (!isGTFSReady()) {
      return res.status(503).json({
        success: false,
        error: 'GTFS service not ready'
      });
    }
    
    // Test locations with known expected routes
    const testCases = [
      {
        name: 'Newcastle Central Station',
        lat: 54.9689, lng: -1.6174,
        location: 'Newcastle Central Station',
        expectedRoutes: ['Q3', 'Q3X', '10', '21', '22', '1', '12']
      },
      {
        name: 'Gateshead Interchange',
        lat: 54.9526, lng: -1.6031,
        location: 'Gateshead Interchange',
        expectedRoutes: ['10', '21', '27', '28', 'Q3', '53', '54']
      },
      {
        name: 'Durham Bus Station',
        lat: 54.7762, lng: -1.5747,
        location: 'Durham',
        expectedRoutes: ['21', '22', 'X21', '6', '50', '16', '20']
      },
      {
        name: 'Sunderland Interchange',
        lat: 54.9053, lng: -1.3826,
        location: 'Sunderland',
        expectedRoutes: ['16', '20', '61', '62', '35', '36']
      },
      {
        name: 'Metro Centre',
        lat: 54.9561, lng: -1.6751,
        location: 'Metro Centre',
        expectedRoutes: ['10', '27', '28', '49', '49A', '6']
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const foundRoutes = await findAffectedRoutesEnhanced(
        testCase.lat, 
        testCase.lng, 
        testCase.location, 
        300
      );
      
      const matches = foundRoutes.filter(route => 
        testCase.expectedRoutes.includes(route)
      );
      
      const accuracy = testCase.expectedRoutes.length > 0 ? 
        (matches.length / testCase.expectedRoutes.length) * 100 : 0;
      
      results.push({
        name: testCase.name,
        coordinates: { lat: testCase.lat, lng: testCase.lng },
        location: testCase.location,
        expectedRoutes: testCase.expectedRoutes,
        foundRoutes: foundRoutes,
        matches: matches,
        accuracy: Math.round(accuracy),
        passed: accuracy >= 50 // Consider 50%+ match as passing
      });
    }
    
    const overallAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    const passedTests = results.filter(r => r.passed).length;
    
    res.json({
      success: true,
      data: {
        results: results,
        summary: {
          totalTests: results.length,
          passedTests: passedTests,
          failedTests: results.length - passedTests,
          overallAccuracy: Math.round(overallAccuracy),
          passRate: Math.round((passedTests / results.length) * 100)
        }
      },
      method: 'GTFS Accuracy Testing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/gtfs/health
 * Health check for GTFS service
 */
router.get('/health', (req, res) => {
  const ready = isGTFSReady();
  const stats = getGTFSStats();
  
  res.status(ready ? 200 : 503).json({
    success: ready,
    ready: ready,
    data: {
      initialized: stats.initialized,
      routes: stats.routes,
      stops: stats.stops,
      shapes: stats.shapes,
      spatialIndexCells: stats.spatialIndexCells
    },
    message: ready ? 'GTFS service is ready' : 'GTFS service is not ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/gtfs/match/enhanced
 * Enhanced GTFS route matching with confidence scoring (Legacy GET endpoint)
 */
router.get('/match/enhanced', async (req, res) => {
  try {
    const { lat, lng, radius = 1000, includeDirections = false } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius);
    
    console.log(`🎯 Enhanced GTFS matching: ${latitude}, ${longitude} (radius: ${searchRadius}m)`);
    
    // Use the enhanced GTFS matcher
    const enhancedGTFSMatcher = (await import('../services/enhancedGTFSMatcher.js')).default;
    const result = await enhancedGTFSMatcher.matchRoutesEnhanced(latitude, longitude, {
      radius: searchRadius,
      maxResults: 20,
      includeStops: true,
      includeShapes: true,
      includeDirections: includeDirections === 'true',
      confidenceThreshold: 0.1
    });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Enhanced GTFS matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      matches: []
    });
  }
});

/**
 * GET /api/gtfs/route-shapes
 * Get route shapes for visualization
 */
router.get('/route-shapes', async (req, res) => {
  try {
    const { routes } = req.query;
    
    if (!routes) {
      return res.status(400).json({
        success: false,
        error: 'Routes parameter is required'
      });
    }
    
    const routeNames = routes.split(',').map(r => r.trim());
    console.log(`🗺️ Getting route shapes for: ${routeNames.join(', ')}`);
    
    // Use the enhanced GTFS matcher
    const enhancedGTFSMatcher = (await import('../services/enhancedGTFSMatcher.js')).default;
    const result = await enhancedGTFSMatcher.getRouteShapes(routeNames);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Route shapes error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      shapes: []
    });
  }
});

/**
 * POST /api/gtfs/route-shapes
 * Get route shapes for visualization (POST version)
 */
router.post('/route-shapes', async (req, res) => {
  try {
    const { routes } = req.body;
    
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({
        success: false,
        error: 'Routes array is required'
      });
    }
    
    console.log(`🗺️ Getting route shapes for: ${routes.join(', ')}`);
    
    // Use the enhanced GTFS matcher
    const enhancedGTFSMatcher = (await import('../services/enhancedGTFSMatcher.js')).default;
    const result = await enhancedGTFSMatcher.getRouteShapes(routes);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Route shapes error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      shapes: []
    });
  }
});

export default router;