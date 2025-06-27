// backend/routes/streetManagerActionsAPI.js
// API endpoints for StreetManager roadwork supervisor actions

import express from 'express';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

/**
 * POST /api/streetmanager/actions/:id/acknowledge
 * Acknowledge a StreetManager roadwork
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgmentType, notes, sessionId } = req.body;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Session ID required'
      });
    }

    const result = await supervisorManager.acknowledgeRoadwork(
      id,
      sessionId,
      acknowledgmentType || 'reviewed',
      notes || '',
      req
    );

    res.json(result);

  } catch (error) {
    console.error('❌ API Error acknowledging roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streetmanager/actions/:id/diversion
 * Create a diversion plan for a roadwork
 */
router.post('/:id/diversion', async (req, res) => {
  try {
    const { id } = req.params;
    const { diversionData, sessionId } = req.body;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Session ID required'
      });
    }

    if (!diversionData) {
      return res.status(400).json({
        success: false,
        error: 'Diversion data is required'
      });
    }

    const result = await supervisorManager.createDiversionPlan(
      id,
      sessionId,
      diversionData,
      req
    );

    res.json(result);

  } catch (error) {
    console.error('❌ API Error creating diversion plan:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streetmanager/actions/:id/notify-drivers
 * Send notification to drivers about a roadwork
 */
router.post('/:id/notify-drivers', async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationData, sessionId } = req.body;

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        error: 'Session ID required'
      });
    }

    if (!notificationData || !notificationData.message) {
      return res.status(400).json({
        success: false,
        error: 'Notification message is required'
      });
    }

    const result = await supervisorManager.notifyDriversAboutRoadwork(
      id,
      sessionId,
      notificationData,
      req
    );

    res.json(result);

  } catch (error) {
    console.error('❌ API Error notifying drivers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streetmanager/actions/:id/history
 * Get action history for a roadwork
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await supervisorManager.getRoadworkActionHistory(id);
    
    res.json(result);

  } catch (error) {
    console.error('❌ API Error getting action history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/streetmanager/actions/sync
 * Force sync StreetManager data to Intelligence Engine and Convex
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 API: Force syncing StreetManager to systems...');
    
    // Import streetManager service
    const { default: streetManager } = await import('../services/streetManager.js');
    
    const result = await streetManager.syncStreetManagerToSystems();
    
    res.json({
      success: result.success,
      message: result.success ? 
        `Synced ${result.totalAlerts} alerts (${result.convexSynced} to Convex, ${result.criticalCount} critical)` :
        'Failed to sync StreetManager data',
      ...result
    });

  } catch (error) {
    console.error('❌ API Error syncing StreetManager:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/streetmanager/actions/templates
 * Get templates for driver notifications and diversion plans
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      driverNotifications: [
        {
          id: 'roadwork_alert',
          title: 'Roadwork Alert',
          template: 'ROADWORK ALERT: {location} - Routes {routes} affected. {duration} expected delays. {instruction}'
        },
        {
          id: 'diversion_active',
          title: 'Diversion Active',
          template: 'DIVERSION: Route {route} diverted via {diversion}. Follow yellow signs. Est. delay {delay} mins.'
        },
        {
          id: 'road_closure',
          title: 'Road Closure',
          template: 'ROAD CLOSED: {location} closed {times}. Use alternative routes. Buses terminating at {terminus}.'
        }
      ],
      diversionPlans: [
        {
          id: 'standard_diversion',
          title: 'Standard Diversion',
          fields: ['affectedRoutes', 'diversionRoute', 'estimatedDelay', 'instructions']
        },
        {
          id: 'emergency_diversion',
          title: 'Emergency Diversion',
          fields: ['affectedRoutes', 'primaryDiversion', 'secondaryDiversion', 'emergencyContacts']
        }
      ]
    };
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('❌ API Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ StreetManager Actions API endpoints registered at /api/streetmanager/actions');

export default router;
