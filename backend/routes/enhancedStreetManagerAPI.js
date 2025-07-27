// Enhanced StreetManager API for Supervisor Dashboard Integration
// Provides comprehensive route impact data and management endpoints
// Memory-optimized for Go North East's operational requirements

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import enhancedProcessor from '../services/enhancedStreetManagerProcessor.js';
import routeImpactAnalyzer from '../services/enhancedRouteImpactAnalyzer.js';
import severityClassifier from '../services/streetManagerSeverityClassifier.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * GET /api/streetmanager/enhanced/status
 * Get comprehensive system status for all enhanced components
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      system: {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      processor: enhancedProcessor.getStatus(),
      route_analyzer: routeImpactAnalyzer.getStatus(),
      severity_classifier: severityClassifier.getStatus(),
      database: {
        connected: true,
        supabase_url: process.env.SUPABASE_URL ? 'configured' : 'missing'
      }
    };

    // Add health check
    const { data: testQuery, error } = await supabase
      .from('streetworks_enhanced')
      .select('count')
      .limit(1);

    status.database.healthy = !error;
    if (error) {
      status.database.error = error.message;
    }

    res.json({
      success: true,
      status: status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/active-critical
 * Get active high-impact streetworks requiring supervisor attention
 */
router.get('/active-critical', async (req, res) => {
  try {
    const { data: criticalWorks, error } = await supabase
      .from('active_critical_streetworks')
      .select('*')
      .order('proposed_start_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: criticalWorks,
      metadata: {
        count: criticalWorks.length,
        source: 'enhanced_streetmanager_system',
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to get active critical streetworks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve critical streetworks',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/route-disruptions/:routeNumber
 * Get upcoming disruptions for a specific route
 */
router.get('/route-disruptions/:routeNumber', async (req, res) => {
  try {
    const { routeNumber } = req.params;
    const { days = 30 } = req.query;

    // Get upcoming disruptions for this route
    const { data: disruptions, error } = await supabase
      .from('streetworks_enhanced')
      .select(`
        id,
        title,
        location_description,
        impact_severity,
        proposed_start_date,
        proposed_end_date,
        work_status,
        traffic_management_type,
        affected_route_count,
        route_matching_confidence,
        route_impacts!inner(
          impact_type,
          route_impact_severity,
          estimated_delay_minutes,
          requires_diversion
        )
      `)
      .contains('affected_route_numbers', [routeNumber])
      .gte('proposed_start_date', new Date().toISOString())
      .lte('proposed_start_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
      .eq('route_impacts.route_number', routeNumber)
      .order('proposed_start_date', { ascending: true });

    if (error) throw error;

    // Calculate summary statistics
    const summary = {
      total_disruptions: disruptions.length,
      critical_count: disruptions.filter(d => d.impact_severity === 'CRITICAL').length,
      high_count: disruptions.filter(d => d.impact_severity === 'HIGH').length,
      diversions_required: disruptions.filter(d => 
        d.route_impacts.some(ri => ri.requires_diversion)
      ).length,
      total_estimated_delay: disruptions.reduce((sum, d) => 
        sum + d.route_impacts.reduce((impactSum, ri) => 
          impactSum + (ri.estimated_delay_minutes || 0), 0
        ), 0
      )
    };

    res.json({
      success: true,
      route_number: routeNumber,
      data: disruptions,
      summary: summary,
      metadata: {
        query_period_days: parseInt(days),
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Failed to get route disruptions for ${req.params.routeNumber}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve route disruptions',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/routes-summary
 * Get summary of upcoming disruptions across all routes
 */
router.get('/routes-summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const { data: routeSummary, error } = await supabase
      .from('routes_upcoming_disruptions')
      .select('*')
      .order('next_disruption_date', { ascending: true });

    if (error) throw error;

    // Calculate overall statistics
    const totalDisruptions = routeSummary.reduce((sum, route) => sum + route.disruption_count, 0);
    const routesAffected = routeSummary.length;
    const criticalRoutes = routeSummary.filter(route => 
      route.severity_levels.includes('CRITICAL')
    ).length;

    res.json({
      success: true,
      data: routeSummary,
      summary: {
        total_disruptions: totalDisruptions,
        routes_affected: routesAffected,
        critical_routes: criticalRoutes,
        query_period_days: parseInt(days)
      },
      metadata: {
        generated_at: new Date().toISOString(),
        data_source: 'enhanced_route_impact_analysis'
      }
    });

  } catch (error) {
    console.error('❌ Failed to get routes summary:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve routes summary',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/notifications/pending
 * Get pending supervisor notifications
 */
router.get('/notifications/pending', async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('supervisor_notifications')
      .select(`
        *,
        streetworks_enhanced(
          title,
          location_description,
          impact_severity,
          affected_route_count
        )
      `)
      .eq('sent', false)
      .lte('scheduled_for', new Date().toISOString())
      .order('priority_level', { ascending: false })
      .order('scheduled_for', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: notifications,
      metadata: {
        count: notifications.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to get pending notifications:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending notifications',
      details: error.message
    });
  }
});

/**
 * POST /api/streetmanager/enhanced/notifications/:id/acknowledge
 * Acknowledge a supervisor notification
 */
router.post('/notifications/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { supervisor_badge, notes } = req.body;

    if (!supervisor_badge) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor badge required for acknowledgment'
      });
    }

    // Update notification with acknowledgment
    const { data, error } = await supabase
      .from('supervisor_notifications')
      .update({
        acknowledged_by: supabase.sql`array_append(acknowledged_by, ${supervisor_badge})`,
        supervisor_notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Notification acknowledged',
      data: data
    });

  } catch (error) {
    console.error(`❌ Failed to acknowledge notification ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge notification',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/analytics/performance
 * Get performance analytics for the enhanced system
 */
router.get('/analytics/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get recent performance data
    const { data: performanceData, error } = await supabase
      .from('streetmanager_performance')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate aggregated metrics
    const totalProcessed = performanceData.reduce((sum, p) => sum + p.webhooks_processed_count, 0);
    const avgProcessingTime = performanceData.reduce((sum, p) => sum + p.route_analysis_time_ms, 0) / performanceData.length;
    const totalRoutes = performanceData.reduce((sum, p) => sum + p.routes_analyzed_count, 0);
    const avgConfidence = performanceData.reduce((sum, p) => sum + parseFloat(p.average_confidence_score || 0), 0) / performanceData.length;

    const analytics = {
      period: {
        days: parseInt(days),
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      },
      processing: {
        total_webhooks_processed: totalProcessed,
        average_processing_time_ms: Math.round(avgProcessingTime || 0),
        total_routes_analyzed: totalRoutes,
        average_confidence_score: Math.round(avgConfidence || 0)
      },
      system_status: enhancedProcessor.getStatus(),
      performance_history: performanceData
    };

    res.json({
      success: true,
      data: analytics,
      metadata: {
        generated_at: new Date().toISOString(),
        data_points: performanceData.length
      }
    });

  } catch (error) {
    console.error('❌ Failed to get performance analytics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance analytics',
      details: error.message
    });
  }
});

/**
 * POST /api/streetmanager/enhanced/analyze-location
 * Manually analyze route impacts for a specific location
 */
router.post('/analyze-location', async (req, res) => {
  try {
    const { latitude, longitude, radius_meters = 200, description } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Ensure analyzer is initialized
    if (!routeImpactAnalyzer.initialized) {
      await routeImpactAnalyzer.initialize();
    }

    // Create mock streetwork data for analysis
    const mockStreetwork = {
      permit_reference_number: `manual_${Date.now()}`,
      title: `Manual Analysis: ${description || 'Location Analysis'}`,
      location_description: description || `Coordinates: ${latitude}, ${longitude}`,
      latitude: latitude,
      longitude: longitude,
      work_category: 'analysis',
      traffic_management_type: 'unknown'
    };

    // Perform analysis
    const routeAnalysis = await routeImpactAnalyzer.analyzeRouteImpacts(mockStreetwork);

    res.json({
      success: true,
      analysis: routeAnalysis,
      input: {
        latitude: latitude,
        longitude: longitude,
        radius_meters: radius_meters,
        description: description
      },
      metadata: {
        analyzed_at: new Date().toISOString(),
        analysis_type: 'manual_location'
      }
    });

  } catch (error) {
    console.error('❌ Manual location analysis failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Location analysis failed',
      details: error.message
    });
  }
});

/**
 * GET /api/streetmanager/enhanced/search
 * Search streetworks by various criteria
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      route_number, 
      severity, 
      location, 
      start_date, 
      end_date, 
      status,
      limit = 50,
      offset = 0
    } = req.query;

    let query = supabase
      .from('streetworks_enhanced')
      .select(`
        id,
        title,
        location_description,
        impact_severity,
        proposed_start_date,
        proposed_end_date,
        work_status,
        affected_route_numbers,
        affected_route_count,
        route_matching_confidence
      `)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (route_number) {
      query = query.contains('affected_route_numbers', [route_number]);
    }

    if (severity) {
      query = query.eq('impact_severity', severity.toUpperCase());
    }

    if (location) {
      query = query.ilike('location_description', `%${location}%`);
    }

    if (start_date) {
      query = query.gte('proposed_start_date', start_date);
    }

    if (end_date) {
      query = query.lte('proposed_end_date', end_date);
    }

    if (status) {
      query = query.eq('work_status', status);
    }

    // Execute query
    const { data: results, error } = await query.order('proposed_start_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        returned: results.length
      },
      filters_applied: {
        route_number,
        severity,
        location,
        start_date,
        end_date,
        status
      },
      metadata: {
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Search failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      details: error.message
    });
  }
});

/**
 * POST /api/streetmanager/enhanced/system/refresh
 * Refresh system caches and reload configuration
 */
router.post('/system/refresh', async (req, res) => {
  try {
    const { component = 'all' } = req.body;

    const refreshResults = {};

    if (component === 'all' || component === 'severity_classifier') {
      await severityClassifier.refreshRules();
      refreshResults.severity_classifier = 'refreshed';
    }

    if (component === 'all' || component === 'caches') {
      enhancedProcessor.clearCaches();
      refreshResults.caches = 'cleared';
    }

    if (component === 'all' || component === 'route_analyzer') {
      routeImpactAnalyzer.clearCache();
      refreshResults.route_analyzer = 'cache_cleared';
    }

    res.json({
      success: true,
      message: 'System refresh completed',
      refreshed_components: refreshResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ System refresh failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'System refresh failed',
      details: error.message
    });
  }
});

/**
 * POST /api/streetmanager/enhanced/webhook/test
 * Test webhook processing with sample data
 */
router.post('/webhook/test', async (req, res) => {
  try {
    const { notification_data } = req.body;

    if (!notification_data) {
      return res.status(400).json({
        success: false,
        error: 'notification_data required for testing'
      });
    }

    // Process the test notification
    const result = await enhancedProcessor.processWebhookNotification(notification_data, { test_mode: true });

    res.json({
      success: true,
      message: 'Test webhook processed',
      processing_result: result,
      metadata: {
        test_mode: true,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Test webhook processing failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Test webhook processing failed',
      details: error.message
    });
  }
});

export default router;