// routes/enhancedRouteAPI.js
// Enhanced Route Matching API with Confidence Scoring
import express from 'express';
import { enhancedRouteMatchWithConfidence, detectMultiModalImpacts, getActiveRoutesAtTime } from '../services/enhancedRouteConfidence.js';

const router = express.Router();

/**
 * Get all routes (basic endpoint)
 * GET /api/routes
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      routes: [],
      total: 231,
      message: 'Go North East operates 231 bus routes across the North East',
      endpoints: {
        matchEnhanced: '/api/routes/match-enhanced',
        multiModal: '/api/routes/multi-modal-impacts', 
        active: '/api/routes/active',
        testConfidence: '/api/routes/test-confidence'
      }
    });
  } catch (error) {
    console.error('❌ Routes API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get enhanced route matches with confidence scores
 * POST /api/routes/match-enhanced
 */
router.post('/match-enhanced', async (req, res) => {
  try {
    const { 
      lat, 
      lng, 
      location, 
      radius = 300, 
      timestamp = new Date().toISOString(),
      includeInactive = false 
    } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const results = await enhancedRouteMatchWithConfidence(
      parseFloat(lat), 
      parseFloat(lng), 
      location,
      {
        radius: parseInt(radius),
        timestamp: new Date(timestamp),
        includeInactive
      }
    );

    // Format response with rich details
    const response = {
      success: true,
      location: {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        description: location || 'Unknown location',
        radius: parseInt(radius)
      },
      routeMatches: results.matches.map(match => ({
        route: match.route,
        confidence: {
          score: match.confidence,
          percentage: `${Math.round(match.confidence * 100)}%`,
          level: getConfidenceLevel(match.confidence)
        },
        matchDetails: {
          type: match.matchType,
          distance: match.distance,
          factors: match.factors
        },
        multiModal: {
          isMultiModal: match.isMultiModal,
          connections: match.connections
        }
      })),
      multiModalImpacts: {
        summary: {
          hasImpact: results.multiModalImpacts.hasMultiModalImpact,
          totalConnections: results.multiModalImpacts.totalAffectedConnections,
          cascadingRoutes: results.multiModalImpacts.cascadingRoutes.length
        },
        details: results.multiModalImpacts
      },
      serviceContext: {
        timestamp: results.timestamp,
        serviceType: results.serviceType,
        activeRoutesCount: results.activeRoutesCount
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Enhanced route matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get multi-modal impacts for a location
 * GET /api/routes/multi-modal-impacts
 */
router.get('/multi-modal-impacts', async (req, res) => {
  try {
    const { lat, lng, radius = 500 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const impacts = detectMultiModalImpacts(
      parseFloat(lat), 
      parseFloat(lng), 
      parseInt(radius)
    );

    res.json({
      success: true,
      location: {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        searchRadius: parseInt(radius)
      },
      impacts: {
        metro: impacts.metro.map(m => ({
          ...m,
          severity: m.distance < 200 ? 'high' : 'medium'
        })),
        ferry: impacts.ferry.map(f => ({
          ...f,
          severity: f.distance < 200 ? 'high' : 'medium'
        })),
        interchanges: impacts.interchanges.map(i => ({
          ...i,
          severity: i.distance < 200 ? 'high' : 'medium'
        }))
      },
      summary: {
        hasMultiModalImpact: impacts.hasMultiModalImpact,
        totalAffectedConnections: impacts.totalAffectedConnections,
        cascadingRoutes: impacts.cascadingRoutes,
        estimatedPassengerImpact: estimatePassengerImpact(impacts)
      }
    });
  } catch (error) {
    console.error('❌ Multi-modal impact check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get active routes at specific time
 * GET /api/routes/active
 */
router.get('/active', async (req, res) => {
  try {
    const { timestamp = new Date().toISOString() } = req.query;
    
    const activeRoutes = await getActiveRoutesAtTime(new Date(timestamp));

    res.json({
      success: true,
      ...activeRoutes,
      summary: {
        totalRoutes: 231, // Total Go North East routes
        activeRoutes: activeRoutes.totalActive,
        percentageActive: `${Math.round((activeRoutes.totalActive / 231) * 100)}%`
      }
    });
  } catch (error) {
    console.error('❌ Active routes check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test endpoint for route confidence
 * POST /api/routes/test-confidence
 */
router.post('/test-confidence', async (req, res) => {
  try {
    // Test scenarios
    const testCases = [
      {
        name: 'Monument Metro Station',
        lat: 54.973556,
        lng: -1.612778,
        location: 'Monument Metro Station'
      },
      {
        name: 'A1 Angel of the North',
        lat: 54.914444,
        lng: -1.589444,
        location: 'A1 near Angel of the North'
      },
      {
        name: 'North Shields Ferry',
        lat: 55.008333,
        lng: -1.443889,
        location: 'North Shields Ferry Terminal'
      }
    ];

    const results = [];
    
    for (const testCase of testCases) {
      const matches = await enhancedRouteMatchWithConfidence(
        testCase.lat,
        testCase.lng,
        testCase.location,
        { radius: 500 }
      );

      results.push({
        scenario: testCase.name,
        location: testCase.location,
        topMatches: matches.matches.slice(0, 5),
        multiModalImpact: matches.multiModalImpacts.hasMultiModalImpact
      });
    }

    res.json({
      success: true,
      testResults: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test confidence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getConfidenceLevel(score) {
  if (score >= 0.9) return 'very_high';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.3) return 'low';
  return 'very_low';
}

function estimatePassengerImpact(impacts) {
  // Rough estimates based on typical passenger numbers
  let estimate = 0;
  
  // Metro impacts (high passenger volume)
  estimate += impacts.metro.length * 500;
  
  // Ferry impacts (medium passenger volume)
  estimate += impacts.ferry.length * 200;
  
  // Interchange impacts (varies)
  estimate += impacts.interchanges.length * 300;
  
  // Cascading bus routes (50 passengers per route average)
  estimate += impacts.cascadingRoutes.length * 50;
  
  return {
    estimatedPassengers: estimate,
    severity: estimate > 1000 ? 'severe' : estimate > 500 ? 'major' : 'moderate'
  };
}

export default router;
