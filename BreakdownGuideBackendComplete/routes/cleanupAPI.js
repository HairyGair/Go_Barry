// backend/routes/cleanupAPI.js
// API endpoints for dismissed alerts cleanup management
// Memory optimized for Render.com 2GB RAM constraint

import express from 'express';
import { dismissedAlertsCleanupService } from '../services/dismissedAlertsCleanupService.js';
import { cleanupScheduler } from '../services/cleanupScheduler.js';
import supervisorManager from '../services/supervisorManager.js';
import { createClient } from '@supabase/supabase-js';
import { parseLineStringToBNG, parsePointToBNG } from '../utils/bngToLatLng.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// North East England bounding box
const NORTH_EAST_BOUNDS = {
  north: 55.8,  // Scottish border
  south: 54.2,  // Yorkshire border
  east: -0.5,   // North Sea coast
  west: -3.0    // Cumbrian border
};

/**
 * Check if coordinates are within North East England
 */
function isInNorthEastRegion(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

/**
 * Parse coordinates from Street Manager webhook data
 */
function parseCoordinates(rawData) {
  if (!rawData || !rawData.object_data) {
    return null;
  }

  const objectData = rawData.object_data;
  
  // Try to parse from works_location_coordinates
  if (objectData.works_location_coordinates) {
    try {
      const coordinates = parseLineStringToBNG(objectData.works_location_coordinates);
      if (coordinates && coordinates.length > 0) {
        return { lat: coordinates[0].lat, lng: coordinates[0].lng };
      }
    } catch (error) {
      console.warn('Error parsing works_location_coordinates:', error);
    }
  }
  
  // Try to parse from works_coordinates
  if (objectData.works_coordinates) {
    try {
      const point = parsePointToBNG(objectData.works_coordinates);
      if (point) {
        return { lat: point.lat, lng: point.lng };
      }
    } catch (error) {
      console.warn('Error parsing works_coordinates:', error);
    }
  }
  
  return null;
}

/**
 * Check if webhook data is relevant to North East England
 */
function isRelevantToNorthEast(webhookData) {
  if (!webhookData) return false;
  
  // Parse coordinates
  const coords = parseCoordinates(webhookData);
  if (coords && isInNorthEastRegion(coords.lat, coords.lng)) {
    return true;
  }
  
  // Check location names for North East areas
  const objectData = webhookData.object_data || {};
  const locationFields = [
    objectData.area_name,
    objectData.town,
    objectData.street_name,
    objectData.location_description,
    objectData.highway_authority
  ].filter(Boolean).join(' ').toLowerCase();
  
  const northEastKeywords = [
    'newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland',
    'north tyneside', 'south tyneside', 'northumberland county council',
    'newcastle city council', 'gateshead council', 'sunderland city council',
    'durham county council', 'north tyneside council', 'south tyneside council'
  ];
  
  return northEastKeywords.some(keyword => locationFields.includes(keyword));
}

// Analyze Street Manager data without deleting
router.get('/analyze-street-manager', async (req, res) => {
  try {
    console.log('🔍 Analyzing Street Manager data...');
    
    // Get sample of notifications
    const { data: notifications, error } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data, webhook_received_at')
      .limit(1000); // Limit for performance
    
    if (error) throw error;
    
    let northEastCount = 0;
    let outsideCount = 0;
    const samples = { northEast: [], outside: [] };
    
    for (const notification of notifications) {
      const isRelevant = isRelevantToNorthEast(notification.raw_webhook_data);
      
      if (isRelevant) {
        northEastCount++;
        if (samples.northEast.length < 3) {
          const coords = parseCoordinates(notification.raw_webhook_data);
          samples.northEast.push({
            id: notification.id,
            location: notification.raw_webhook_data?.object_data?.area_name || 'Unknown',
            coordinates: coords
          });
        }
      } else {
        outsideCount++;
        if (samples.outside.length < 3) {
          const coords = parseCoordinates(notification.raw_webhook_data);
          samples.outside.push({
            id: notification.id,
            location: notification.raw_webhook_data?.object_data?.area_name || 'Unknown',
            coordinates: coords
          });
        }
      }
    }
    
    res.json({
      success: true,
      analysis: {
        total: notifications.length,
        northEast: northEastCount,
        outside: outsideCount,
        percentageOutside: Math.round((outsideCount / notifications.length) * 100),
        samples,
        bounds: NORTH_EAST_BOUNDS
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing Street Manager data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up Street Manager data (removes records outside North East)
router.post('/cleanup-street-manager', async (req, res) => {
  try {
    const { dryRun = true } = req.body; // Default to dry run for safety
    
    console.log(`🧹 ${dryRun ? 'DRY RUN' : 'ACTUAL'} cleanup of Street Manager data...`);
    
    // Get all notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data');
    
    if (fetchError) throw fetchError;
    
    // Analyze notifications
    const toDelete = [];
    const toKeep = [];
    
    for (const notification of notifications) {
      const isRelevant = isRelevantToNorthEast(notification.raw_webhook_data);
      
      if (isRelevant) {
        toKeep.push(notification.id);
      } else {
        toDelete.push(notification.id);
      }
    }
    
    let deletedCount = 0;
    
    if (!dryRun && toDelete.length > 0) {
      // Actually delete in batches
      const batchSize = 50;
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('streetmanager_notifications')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting batch:`, deleteError);
        } else {
          deletedCount += batch.length;
        }
      }
    }
    
    res.json({
      success: true,
      result: {
        dryRun,
        total: notifications.length,
        toDelete: toDelete.length,
        toKeep: toKeep.length,
        actuallyDeleted: deletedCount,
        percentageToDelete: Math.round((toDelete.length / notifications.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up Street Manager data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Middleware to check admin authorization for cleanup operations
 */
const requireAdminAuth = async (req, res, next) => {
  try {
    const { supervisorToken } = req.body || req.query;
    
    if (!supervisorToken) {
      return res.status(401).json({
        success: false,
        error: 'Supervisor token required for cleanup operations'
      });
    }

    const supervisor = await supervisorManager.getSupervisorFromToken(supervisorToken);
    if (!supervisor.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor token'
      });
    }

    // Check if supervisor has admin privileges (AG003 or BP009)
    const adminBadges = ['AG003', 'BP009'];
    if (!adminBadges.includes(supervisor.supervisor.badge)) {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required for cleanup operations'
      });
    }

    req.supervisor = supervisor.supervisor;
    next();
  } catch (error) {
    console.error('❌ Admin auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// =============================================================================
// DISMISSED ALERTS CLEANUP ENDPOINTS
// =============================================================================

/**
 * GET /api/cleanup/dismissed-alerts/stats
 * Get dismissed alerts cleanup statistics and current status
 */
router.get('/dismissed-alerts/stats', async (req, res) => {
  try {
    console.log('📊 API: Getting dismissed alerts cleanup statistics...');
    
    const [statsResult, schedulerStatus] = await Promise.all([
      dismissedAlertsCleanupService.getCleanupStats(),
      Promise.resolve(cleanupScheduler.getStatus())
    ]);

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        error: statsResult.error
      });
    }

    res.json({
      success: true,
      cleanup_stats: statsResult.stats,
      scheduler_status: schedulerStatus,
      retention_config: dismissedAlertsCleanupService.retentionPeriods,
      generated_at: statsResult.generated_at
    });

  } catch (error) {
    console.error('❌ API Error getting dismissed alerts cleanup stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/dismissed-alerts/eligible
 * Get dismissed alert records eligible for cleanup (dry run)
 */
router.get('/dismissed-alerts/eligible', requireAdminAuth, async (req, res) => {
  try {
    console.log(`📋 API: Finding eligible dismissed alert records for cleanup (by ${req.supervisor.name})...`);
    
    const result = await dismissedAlertsCleanupService.findEligibleRecords();
    
    res.json({
      success: result.success,
      eligible_records: result.eligible_records || null,
      total_eligible: result.total_eligible || 0,
      error: result.error || null,
      supervisor: req.supervisor.name,
      retention_config: dismissedAlertsCleanupService.retentionPeriods
    });

  } catch (error) {
    console.error('❌ API Error finding eligible dismissed alert records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/dismissed-alerts/run
 * Manually trigger dismissed alerts cleanup operation
 */
router.post('/dismissed-alerts/run', requireAdminAuth, async (req, res) => {
  try {
    const { 
      dry_run = false, 
      cleanup_type = 'daily',
      force = false 
    } = req.body;

    console.log(`🧹 API: Manual dismissed alerts cleanup triggered by ${req.supervisor.name} (type: ${cleanup_type}, dry_run: ${dry_run})`);
    
    // Check if cleanup is already running
    const schedulerStatus = cleanupScheduler.getStatus();
    if (schedulerStatus.running_jobs.length > 0 && !force) {
      return res.status(409).json({
        success: false,
        error: 'Cleanup operation already running',
        running_jobs: schedulerStatus.running_jobs
      });
    }

    let result;
    
    if (cleanup_type === 'manual') {
      // Direct cleanup call with custom settings
      const originalDryRun = dismissedAlertsCleanupService.dryRun;
      dismissedAlertsCleanupService.dryRun = dry_run;
      
      try {
        result = await dismissedAlertsCleanupService.performCleanup();
      } finally {
        dismissedAlertsCleanupService.dryRun = originalDryRun;
      }
    } else {
      // Use scheduler for consistent job execution
      result = await cleanupScheduler.triggerManualCleanup(cleanup_type);
    }

    // Log the manual cleanup operation
    if (result.success) {
      await supervisorManager.logActivity(
        req.supervisor.id,
        'manual_dismissed_alerts_cleanup_triggered',
        {
          cleanup_type,
          dry_run,
          deleted_count: result.results?.deleted_count || result.deleted_count || 0,
          execution_time_ms: result.results?.execution_time_ms || result.execution_time_ms
        },
        req
      );
    }

    res.json({
      success: result.success,
      results: result.results || result,
      error: result.error || null,
      initiated_by: req.supervisor.name,
      initiated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API Error running dismissed alerts cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/scheduler/status
 * Get detailed cleanup scheduler status
 */
router.get('/scheduler/status', async (req, res) => {
  try {
    const status = cleanupScheduler.getStatus();
    
    res.json({
      success: true,
      scheduler_status: status
    });

  } catch (error) {
    console.error('❌ API Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/scheduler/start
 * Start the cleanup scheduler
 */
router.post('/scheduler/start', requireAdminAuth, async (req, res) => {
  try {
    console.log(`⏰ API: Starting cleanup scheduler (by ${req.supervisor.name})`);
    
    const result = await cleanupScheduler.startScheduler();
    
    // Log the scheduler start
    await supervisorManager.logActivity(
      req.supervisor.id,
      'cleanup_scheduler_started',
      {
        scheduled_jobs: result.scheduled_jobs,
        next_run_times: result.next_run_times
      },
      req
    );

    res.json({
      success: result.success,
      scheduled_jobs: result.scheduled_jobs || 0,
      next_run_times: result.next_run_times || {},
      error: result.error || null,
      started_by: req.supervisor.name
    });

  } catch (error) {
    console.error('❌ API Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/scheduler/stop
 * Stop the cleanup scheduler
 */
router.post('/scheduler/stop', requireAdminAuth, async (req, res) => {
  try {
    console.log(`🛑 API: Stopping cleanup scheduler (by ${req.supervisor.name})`);
    
    const result = cleanupScheduler.stopScheduler();
    
    // Log the scheduler stop
    await supervisorManager.logActivity(
      req.supervisor.id,
      'cleanup_scheduler_stopped',
      {
        stopped_jobs: result.stopped_jobs
      },
      req
    );

    res.json({
      success: result.success,
      stopped_jobs: result.stopped_jobs || 0,
      error: result.error || null,
      stopped_by: req.supervisor.name
    });

  } catch (error) {
    console.error('❌ API Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/cleanup/config
 * Get current cleanup configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      retention_periods: dismissedAlertsCleanupService.retentionPeriods,
      performance_limits: {
        batch_size: dismissedAlertsCleanupService.batchSize,
        max_operation_time_ms: dismissedAlertsCleanupService.maxOperationTime,
        dry_run_mode: dismissedAlertsCleanupService.dryRun
      },
      scheduler_config: cleanupScheduler.enabledJobs,
      environment_variables: {
        cleanup_daily_enabled: process.env.CLEANUP_DAILY_ENABLED,
        cleanup_weekly_enabled: process.env.CLEANUP_WEEKLY_ENABLED,
        cleanup_monthly_enabled: process.env.CLEANUP_MONTHLY_ENABLED,
        cleanup_batch_size: process.env.CLEANUP_BATCH_SIZE,
        cleanup_max_time_ms: process.env.CLEANUP_MAX_TIME_MS,
        cleanup_dry_run: process.env.CLEANUP_DRY_RUN
      }
    };

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('❌ API Error getting cleanup config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/cleanup/test
 * Test dismissed alerts cleanup functionality (dry run only)
 */
router.post('/test', requireAdminAuth, async (req, res) => {
  try {
    console.log(`🧪 API: Testing dismissed alerts cleanup functionality (by ${req.supervisor.name})`);
    
    // Force dry run for test endpoint
    const originalDryRun = dismissedAlertsCleanupService.dryRun;
    dismissedAlertsCleanupService.dryRun = true;
    
    try {
      // Get stats first
      const stats = await dismissedAlertsCleanupService.getCleanupStats();
      
      // Find eligible records
      const eligibleResult = await dismissedAlertsCleanupService.findEligibleRecords();
      
      // Run test cleanup (dry run)
      const cleanupResult = await dismissedAlertsCleanupService.performCleanup(
        eligibleResult.success ? eligibleResult.eligible_records : null
      );
      
      res.json({
        success: true,
        test_results: {
          current_stats: stats.stats,
          eligible_records: eligibleResult.success ? eligibleResult : { error: eligibleResult.error },
          cleanup_simulation: cleanupResult.success ? cleanupResult.results : { error: cleanupResult.error }
        },
        message: 'Dismissed alerts cleanup test completed (dry run only)',
        tested_by: req.supervisor.name,
        tested_at: new Date().toISOString()
      });
      
    } finally {
      // Restore original dry run setting
      dismissedAlertsCleanupService.dryRun = originalDryRun;
    }

  } catch (error) {
    console.error('❌ API Error testing dismissed alerts cleanup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;