// backend/routes/routeManagementAPI.js
// Route Management API for Go Barry - Control Room Operations
import express from 'express';
import {
  initializeRouteVisualization,
  getRouteVisualization,
  getAvailableRoutes,
  getRoutesInArea,
  getVisualizationStats
} from '../services/routeVisualizationService.js';

import {
  initializeServiceFrequency,
  analyzeServiceFrequency,
  analyzeMultipleRoutes,
  getNetworkServiceStatus,
  getFrequencyStats,
  getServiceGapsDashboard,
  getBreakdownAlerts,
  getServiceTrends
} from '../services/serviceFrequencyService.js';

const router = express.Router();

/**
 * Initialize the route visualization system
 * GET /api/routes/initialize
 */
router.get('/initialize', async (req, res) => {
  try {
    console.log('🔄 API: Initializing route visualization...');
    const success = await initializeRouteVisualization();
    
    if (success) {
      const stats = getVisualizationStats();
      res.json({
        success: true,
        message: 'Route visualization system initialized',
        stats: stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize route visualization system'
      });
    }
  } catch (error) {
    console.error('❌ Route initialization API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get visualization data for a specific route
 * GET /api/routes/:routeNumber/visualization
 */
router.get('/:routeNumber/visualization', async (req, res) => {
  try {
    const routeNumber = req.params.routeNumber.toUpperCase();
    console.log(`🗺️ API: Getting visualization for route ${routeNumber}`);
    
    const result = await getRouteVisualization(routeNumber);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        availableRoutes: result.availableRoutes
      });
    }
  } catch (error) {
    console.error('❌ Route visualization API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all available routes with metadata
 * GET /api/routes/all
 */
router.get('/all', async (req, res) => {
  try {
    console.log('📋 API: Getting all available routes');
    const result = await getAvailableRoutes();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Available routes API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get routes within a specific geographic area
 * GET /api/routes/area?north=55.1&south=54.8&east=-1.4&west=-1.8
 */
router.get('/area', async (req, res) => {
  try {
    const { north, south, east, west } = req.query;
    
    // Validate coordinates
    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: north, south, east, west',
        example: '/api/routes/area?north=55.1&south=54.8&east=-1.4&west=-1.8'
      });
    }
    
    const coords = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };
    
    // Validate coordinate values
    if (Object.values(coords).some(isNaN)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates - must be valid numbers'
      });
    }
    
    console.log(`🗺️ API: Getting routes in area:`, coords);
    const result = await getRoutesInArea(coords.north, coords.south, coords.east, coords.west);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Routes in area API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get detailed information about a specific route (metadata only)
 * GET /api/routes/:routeNumber/info
 */
router.get('/:routeNumber/info', async (req, res) => {
  try {
    const routeNumber = req.params.routeNumber.toUpperCase();
    console.log(`ℹ️ API: Getting info for route ${routeNumber}`);
    
    const result = await getRouteVisualization(routeNumber);
    
    if (result.success) {
      // Return only metadata and basic info, not full shape data
      res.json({
        success: true,
        data: {
          route: result.route,
          metadata: result.metadata,
          stopCount: result.stops.length,
          shapeCount: result.shapes.length,
          hasWheelchairAccess: result.stops.some(stop => stop.wheelchair),
          firstStop: result.stops[0]?.name || 'Unknown',
          lastStop: result.stops[result.stops.length - 1]?.name || 'Unknown'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        availableRoutes: result.availableRoutes
      });
    }
  } catch (error) {
    console.error('❌ Route info API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get only the stops for a specific route
 * GET /api/routes/:routeNumber/stops
 */
router.get('/:routeNumber/stops', async (req, res) => {
  try {
    const routeNumber = req.params.routeNumber.toUpperCase();
    console.log(`🛑 API: Getting stops for route ${routeNumber}`);
    
    const result = await getRouteVisualization(routeNumber);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          route: result.route,
          totalStops: result.stops.length,
          stops: result.stops,
          wheelchairAccessibleStops: result.stops.filter(stop => stop.wheelchair).length
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Route stops API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get system statistics and health
 * GET /api/routes/stats
 */
router.get('/stats', (req, res) => {
  try {
    console.log('📊 API: Getting visualization system stats');
    const stats = getVisualizationStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Visualization stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get multiple routes at once for bulk operations
 * POST /api/routes/bulk
 * Body: { "routes": ["21", "22", "X21"] }
 */
router.post('/bulk', async (req, res) => {
  try {
    const { routes } = req.body;
    
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({
        success: false,
        error: 'Request body must contain "routes" array',
        example: { routes: ["21", "22", "X21"] }
      });
    }
    
    if (routes.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 routes per bulk request'
      });
    }
    
    console.log(`📦 API: Getting bulk visualization for ${routes.length} routes`);
    
    const results = [];
    const errors = [];
    
    for (const routeNumber of routes) {
      try {
        const result = await getRouteVisualization(routeNumber.toUpperCase());
        if (result.success) {
          results.push(result);
        } else {
          errors.push({ route: routeNumber, error: result.error });
        }
      } catch (error) {
        errors.push({ route: routeNumber, error: error.message });
      }
    }
    
    res.json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        routes: results,
        errors: errors
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Bulk routes API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search routes by name or number (fuzzy search)
 * GET /api/routes/search?q=21
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        example: '/api/routes/search?q=21'
      });
    }
    
    console.log(`🔍 API: Searching routes for "${query}"`);
    
    const allRoutes = await getAvailableRoutes();
    
    if (!allRoutes.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load routes for search'
      });
    }
    
    // Simple fuzzy search
    const queryLower = query.toLowerCase();
    const matchingRoutes = allRoutes.routes.filter(route => 
      route.routeNumber.toLowerCase().includes(queryLower) ||
      route.routeNumber.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(queryLower.replace(/[^a-z0-9]/gi, ''))
    );
    
    res.json({
      success: true,
      data: {
        query: query,
        matchCount: matchingRoutes.length,
        matches: matchingRoutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Route search API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================================================
// SERVICE FREQUENCY ANALYSIS ENDPOINTS
// ====================================================================

/**
 * Initialize the service frequency analysis system
 * GET /api/routes/frequency/initialize
 */
router.get('/frequency/initialize', async (req, res) => {
  try {
    console.log('🔄 API: Initializing service frequency analysis...');
    const success = await initializeServiceFrequency();
    
    if (success) {
      const stats = getFrequencyStats();
      res.json({
        success: true,
        message: 'Service frequency analysis system initialized',
        stats: stats,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to initialize service frequency analysis system'
      });
    }
  } catch (error) {
    console.error('❌ Frequency initialization API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze service frequency for a specific route
 * GET /api/routes/:routeNumber/frequency
 * GET /api/routes/:routeNumber/frequency?time=2024-01-15T14:30:00.000Z
 */
router.get('/:routeNumber/frequency', async (req, res) => {
  try {
    const routeNumber = req.params.routeNumber.toUpperCase();
    const currentTime = req.query.time || null;
    
    console.log(`⏱️ API: Analyzing frequency for route ${routeNumber}`);
    
    const result = await analyzeServiceFrequency(routeNumber, currentTime);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        availableRoutes: result.availableRoutes
      });
    }
  } catch (error) {
    console.error('❌ Frequency analysis API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze service frequency for multiple routes
 * POST /api/routes/frequency/bulk
 * Body: { "routes": ["21", "22", "X21"], "time": "2024-01-15T14:30:00.000Z" }
 */
router.post('/frequency/bulk', async (req, res) => {
  try {
    const { routes, time } = req.body;
    
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({
        success: false,
        error: 'Request body must contain "routes" array',
        example: { routes: ["21", "22", "X21"] }
      });
    }
    
    if (routes.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 20 routes per bulk frequency analysis'
      });
    }
    
    console.log(`📊 API: Bulk frequency analysis for ${routes.length} routes`);
    
    const result = await analyzeMultipleRoutes(routes.map(r => r.toUpperCase()), time);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Bulk frequency analysis API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get network-wide service status
 * GET /api/routes/frequency/network
 * GET /api/routes/frequency/network?time=2024-01-15T14:30:00.000Z
 */
router.get('/frequency/network', async (req, res) => {
  try {
    const currentTime = req.query.time || null;
    
    console.log('🌐 API: Getting network-wide service status');
    
    const result = await getNetworkServiceStatus(currentTime);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Network status API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get service frequency system statistics
 * GET /api/routes/frequency/stats
 */
router.get('/frequency/stats', (req, res) => {
  try {
    console.log('📊 API: Getting frequency analysis system stats');
    const stats = getFrequencyStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Frequency stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================================================
// SERVICE GAPS & BREAKDOWN DETECTION DASHBOARD ENDPOINTS
// ====================================================================

/**
 * Get service gaps dashboard data
 * GET /api/routes/frequency/dashboard
 * GET /api/routes/frequency/dashboard?includeAllRoutes=true&currentTime=2024-01-15T14:30:00.000Z
 */
router.get('/frequency/dashboard', async (req, res) => {
  try {
    const { includeAllRoutes, currentTime } = req.query;
    
    const options = {
      includeAllRoutes: includeAllRoutes === 'true',
      currentTime: currentTime ? new Date(currentTime) : null
    };
    
    console.log('📊 API: Getting service gaps dashboard data');
    
    const result = await getServiceGapsDashboard(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.dashboard,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Service gaps dashboard API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get real-time breakdown detection alerts
 * GET /api/routes/frequency/breakdown-alerts
 * GET /api/routes/frequency/breakdown-alerts?alertThreshold=30&currentTime=2024-01-15T14:30:00.000Z
 */
router.get('/frequency/breakdown-alerts', async (req, res) => {
  try {
    const { alertThreshold, currentTime } = req.query;
    
    const options = {
      alertThreshold: alertThreshold ? parseInt(alertThreshold) : null,
      currentTime: currentTime ? new Date(currentTime) : null
    };
    
    console.log('🚨 API: Getting breakdown detection alerts');
    
    const result = await getBreakdownAlerts(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Breakdown alerts API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get service performance trends
 * GET /api/routes/frequency/trends
 * GET /api/routes/frequency/trends?timeframe=week
 */
router.get('/frequency/trends', async (req, res) => {
  try {
    const { timeframe } = req.query;
    
    console.log(`📈 API: Getting service trends for ${timeframe || 'today'}`);
    
    const result = await getServiceTrends(timeframe || 'today');
    
    if (result.success) {
      res.json({
        success: true,
        data: result.trends,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Service trends API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get dashboard summary for control room display
 * GET /api/routes/frequency/dashboard-summary
 */
router.get('/frequency/dashboard-summary', async (req, res) => {
  try {
    console.log('📋 API: Getting dashboard summary for control room');
    
    // Get multiple data sources for comprehensive summary
    const [dashboardResult, alertsResult, networkResult] = await Promise.all([
      getServiceGapsDashboard({ includeAllRoutes: false }),
      getBreakdownAlerts(),
      getNetworkServiceStatus()
    ]);
    
    const summary = {
      timestamp: new Date().toISOString(),
      networkOverview: {
        status: dashboardResult.success ? dashboardResult.dashboard.networkStatus : 'UNKNOWN',
        totalRoutes: networkResult.success ? networkResult.networkStatus.totalRoutes : 0,
        operationalRoutes: networkResult.success ? networkResult.networkStatus.operationalRoutes : 0
      },
      serviceGaps: {
        totalGaps: dashboardResult.success ? dashboardResult.dashboard.serviceGaps.length : 0,
        criticalGaps: dashboardResult.success ? dashboardResult.dashboard.summary.criticalGaps : 0,
        potentialBreakdowns: dashboardResult.success ? dashboardResult.dashboard.summary.possibleBreakdowns : 0
      },
      alerts: {
        totalAlerts: alertsResult.success ? alertsResult.alertCount : 0,
        criticalAlerts: alertsResult.success ? alertsResult.criticalAlerts : 0,
        warningAlerts: alertsResult.success ? alertsResult.warningAlerts : 0
      },
      topPriorityRoutes: dashboardResult.success ? 
        dashboardResult.dashboard.serviceGaps.slice(0, 5).map(gap => ({
          route: gap.route,
          status: gap.status,
          serviceGap: gap.serviceGap,
          priority: gap.priority
        })) : [],
      immediateActions: dashboardResult.success ? dashboardResult.dashboard.recommendations.slice(0, 3) : [],
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      summary: summary,
      dataQuality: {
        dashboard: dashboardResult.success,
        alerts: alertsResult.success,
        network: networkResult.success
      }
    });
    
  } catch (error) {
    console.error('❌ Dashboard summary API error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
