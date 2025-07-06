/*
 * Go BARRY - BODS API Routes
 * Exposes Bus Open Data Service endpoints for frontend integration
 * 
 * Routes:
 * - GET /api/bods/vehicle-locations
 * - GET /api/bods/timetables  
 * - GET /api/bods/fares
 * - GET /api/bods/health
 */

import express from 'express';
import { bodsService } from '../services/bods.js';

const router = express.Router();

/**
 * GET /api/bods/vehicle-locations
 * Real-time vehicle positions from SIRI-VM feed
 */
router.get('/vehicle-locations', async (req, res) => {
  try {
    console.log('[BODS API] Vehicle locations requested');
    
    const {
      force_refresh = false,
      operator_filter = true,
      format = 'json'
    } = req.query;
    
    const options = {
      forceRefresh: force_refresh === 'true',
      operatorFilter: operator_filter === 'true'
    };
    
    const result = await bodsService.getVehicleLocations(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          count: result.count || result.data.length,
          timestamp: result.timestamp,
          cached: result.cached,
          source: result.source || 'SIRI-VM',
          format: format
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: result.error,
        data: result.data || [],
        metadata: {
          count: 0,
          cached: result.cached || false,
          source: 'error-fallback'
        }
      });
    }
  } catch (error) {
    console.error('[BODS API] Vehicle locations error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * GET /api/bods/timetables
 * Scheduled service data from TransXChange feed
 */
router.get('/timetables', async (req, res) => {
  try {
    console.log('[BODS API] Timetables requested');
    
    const {
      route_filter = null,
      operator_filter = true,
      force_refresh = false,
      format = 'json'
    } = req.query;
    
    const options = {
      routeFilter: route_filter,
      operatorFilter: operator_filter === 'true',
      forceRefresh: force_refresh === 'true'
    };
    
    const result = await bodsService.getTimetables(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          count: result.count || result.data.length,
          timestamp: result.timestamp,
          cached: result.cached,
          source: result.source || 'TransXChange',
          format: format,
          routeFilter: route_filter
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: result.error,
        data: result.data || [],
        metadata: {
          count: 0,
          cached: result.cached || false,
          source: 'error-fallback'
        }
      });
    }
  } catch (error) {
    console.error('[BODS API] Timetables error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * GET /api/bods/fares
 * Fare information from NeTEx feed
 */
router.get('/fares', async (req, res) => {
  try {
    console.log('[BODS API] Fares requested');
    
    const {
      route_filter = null,
      operator_filter = true,
      force_refresh = false,
      format = 'json'
    } = req.query;
    
    const options = {
      routeFilter: route_filter,
      operatorFilter: operator_filter === 'true',
      forceRefresh: force_refresh === 'true'
    };
    
    const result = await bodsService.getFares(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: {
          count: result.count || result.data.length,
          timestamp: result.timestamp,
          cached: result.cached,
          source: result.source || 'NeTEx',
          format: format,
          routeFilter: route_filter
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: result.error,
        data: result.data || [],
        metadata: {
          count: 0,
          cached: result.cached || false,
          source: 'error-fallback'
        }
      });
    }
  } catch (error) {
    console.error('[BODS API] Fares error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * GET /api/bods/status
 * Quick status for operations centre
 */
router.get('/status', async (req, res) => {
  try {
    const metrics = bodsService.getMetrics();
    const vehicleResult = await bodsService.getVehicleLocations({ operatorFilter: true });
    
    res.json({
      success: true,
      activeBuses: vehicleResult.count || 0,
      totalBuses: vehicleResult.data?.length || 0,
      lastUpdated: metrics.lastRequestTime || new Date().toISOString(),
      status: metrics.health || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BODS API] Status error:', error);
    res.status(500).json({
      success: false,
      activeBuses: 0,
      totalBuses: 0,
      lastUpdated: new Date().toISOString(),
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/bods/health
 * Service health and metrics
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = bodsService.getMetrics();
    
    res.json({
      success: true,
      service: 'BODS Integration',
      status: metrics.health,
      metrics: {
        requests: {
          total: metrics.totalRequests,
          successful: metrics.successfulRequests,
          failed: metrics.failedRequests,
          successRate: metrics.totalRequests > 0 
            ? (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2) + '%'
            : '0%'
        },
        performance: {
          avgResponseTime: Math.round(metrics.avgResponseTime) + 'ms',
          lastRequestTime: metrics.lastRequestTime 
            ? new Date(metrics.lastRequestTime).toISOString()
            : null
        },
        rateLimit: {
          remaining: metrics.rateLimitRemaining,
          resetTime: metrics.rateLimitReset
        },
        caches: metrics.cacheStatus,
        feeds: {
          vehicleLocations: 'SIRI-VM',
          timetables: 'TransXChange',
          fares: 'NeTEx'
        }
      },
      recentErrors: metrics.recentErrors.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BODS API] Health check error:', error);
    res.status(500).json({
      success: false,
      service: 'BODS Integration',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/bods/compare
 * Compare scheduled vs actual times
 */
router.get('/compare', async (req, res) => {
  try {
    console.log('[BODS API] Schedule comparison requested');
    
    const { route_id } = req.query;
    
    if (!route_id) {
      return res.status(400).json({
        success: false,
        error: 'route_id parameter required'
      });
    }
    
    res.json({
      success: true,
      data: {
        routeId: route_id,
        message: 'Comparison feature coming soon'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BODS API] Comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bods/clear-cache
 * Clear all BODS caches
 */
router.post('/clear-cache', async (req, res) => {
  try {
    console.log('[BODS API] Cache clear requested');
    
    bodsService.clearCaches();
    
    res.json({
      success: true,
      message: 'All BODS caches cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[BODS API] Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
