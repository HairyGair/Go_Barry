// backend/routes/sharePointExcelAPI.js
// SharePoint Excel API routes for real-time document editing

import express from 'express';
import sharePointExcelService from '../services/sharePointExcelService.js';
import microsoftEmailService from '../services/microsoftEmailService.js';

const router = express.Router();

/**
 * GET /api/sharepoint/permissions/:supervisorId
 * Check if supervisor has SharePoint access
 */
router.get('/permissions/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;

    // Check if supervisor is authenticated with Microsoft
    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Supervisor not authenticated with Microsoft',
        requiresAuth: true,
        loginUrl: microsoftEmailService.getMicrosoftLoginUrl(supervisorId)
      });
    }

    const permissions = await sharePointExcelService.checkSharePointPermissions(supervisorId);

    res.json({
      success: true,
      supervisorId,
      ...permissions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 SharePoint permission check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Permission check failed',
      details: error.message
    });
  }
});

/**
 * GET /api/sharepoint/documents/:documentKey/info/:supervisorId
 * Get workbook metadata
 */
router.get('/documents/:documentKey/info/:supervisorId', async (req, res) => {
  try {
    const { documentKey, supervisorId } = req.params;

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    const workbookInfo = await sharePointExcelService.getWorkbookInfo(supervisorId, documentKey);

    res.json({
      success: true,
      supervisorId,
      ...workbookInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Get workbook info failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document info',
      details: error.message
    });
  }
});

/**
 * GET /api/sharepoint/documents/:documentKey/data/:supervisorId
 * Get structured document data
 */
router.get('/documents/:documentKey/data/:supervisorId', async (req, res) => {
  try {
    const { documentKey, supervisorId } = req.params;

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    let data;
    switch (documentKey) {
      case 'onTimeRequest':
        data = await sharePointExcelService.getOnTimeRequestData(supervisorId);
        break;
      case 'dailyLostMileage':
        data = await sharePointExcelService.getDailyLostMileageData(supervisorId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown document type',
          availableDocuments: ['onTimeRequest', 'dailyLostMileage']
        });
    }

    res.json({
      success: true,
      supervisorId,
      ...data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Get document data failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document data',
      details: error.message
    });
  }
});

/**
 * POST /api/sharepoint/documents/onTimeRequest/submit
 * Submit new On Time Request
 */
router.post('/documents/onTimeRequest/submit', async (req, res) => {
  try {
    const { supervisorId, driverName, badge, shift, route, scheduledFinish, requestedFinish, reason } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID required'
      });
    }

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    const requestData = {
      driverName,
      badge,
      shift,
      route,
      scheduledFinish,
      requestedFinish,
      reason
    };

    const result = await sharePointExcelService.submitOnTimeRequest(supervisorId, requestData);

    res.json({
      success: true,
      supervisorId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Submit On Time Request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit request',
      details: error.message
    });
  }
});

/**
 * POST /api/sharepoint/documents/dailyLostMileage/submit
 * Submit new Lost Mileage Report
 */
router.post('/documents/dailyLostMileage/submit', async (req, res) => {
  try {
    const { supervisorId, date, route, lostMiles, reason, impact, reportedBy } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID required'
      });
    }

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    const reportData = {
      date,
      route,
      lostMiles: parseFloat(lostMiles) || 0,
      reason,
      impact,
      reportedBy: reportedBy || supervisorId
    };

    const result = await sharePointExcelService.submitLostMileageReport(supervisorId, reportData);

    res.json({
      success: true,
      supervisorId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Submit Lost Mileage report failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
      details: error.message
    });
  }
});

/**
 * PATCH /api/sharepoint/documents/:documentKey/update
 * Update specific cells in document
 */
router.patch('/documents/:documentKey/update', async (req, res) => {
  try {
    const { documentKey } = req.params;
    const { supervisorId, range, values } = req.body;

    if (!supervisorId || !range || !values) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID, range, and values are required'
      });
    }

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    const result = await sharePointExcelService.updateWorksheetCells(supervisorId, documentKey, range, values);

    res.json({
      success: true,
      supervisorId,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Update worksheet failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
      details: error.message
    });
  }
});

/**
 * POST /api/sharepoint/webhooks/:documentKey/subscribe
 * Create webhook subscription for real-time updates
 */
router.post('/webhooks/:documentKey/subscribe', async (req, res) => {
  try {
    const { documentKey } = req.params;
    const { supervisorId, callbackUrl } = req.body;

    if (!supervisorId || !callbackUrl) {
      return res.status(400).json({
        success: false,
        error: 'Supervisor ID and callback URL are required'
      });
    }

    if (!microsoftEmailService.isSupervisorLoggedIn(supervisorId)) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        requiresAuth: true
      });
    }

    const subscription = await sharePointExcelService.createWebhookSubscription(supervisorId, documentKey, callbackUrl);

    res.json({
      success: true,
      supervisorId,
      ...subscription,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Create webhook subscription failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook subscription',
      details: error.message
    });
  }
});

/**
 * POST /api/sharepoint/webhooks/callback
 * Handle SharePoint webhook notifications
 */
router.post('/webhooks/callback', async (req, res) => {
  try {
    const validationToken = req.query.validationToken;
    
    // Handle webhook validation
    if (validationToken) {
      console.log('📊 SharePoint webhook validation received');
      return res.status(200).send(validationToken);
    }

    // Handle actual notifications
    const notifications = req.body.value || [];
    
    console.log('📊 SharePoint webhook notifications received:', notifications.length);
    
    for (const notification of notifications) {
      console.log('📊 Processing notification:', {
        subscriptionId: notification.subscriptionId,
        changeType: notification.changeType,
        resource: notification.resource,
        clientState: notification.clientState
      });

      // Here you could emit real-time updates via WebSocket/Convex
      // or trigger data refresh for connected clients
    }

    res.status(200).json({
      success: true,
      processed: notifications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Webhook callback processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

/**
 * GET /api/sharepoint/auth-status/:supervisorId
 * Check authentication status and required permissions
 */
router.get('/auth-status/:supervisorId', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    
    const isLoggedIn = microsoftEmailService.isSupervisorLoggedIn(supervisorId);
    
    let sharePointAccess = null;
    if (isLoggedIn) {
      try {
        sharePointAccess = await sharePointExcelService.checkSharePointPermissions(supervisorId);
      } catch (error) {
        sharePointAccess = { hasAccess: false, error: error.message };
      }
    }

    res.json({
      success: true,
      supervisorId,
      isAuthenticated: isLoggedIn,
      sharePointAccess,
      loginUrl: isLoggedIn ? null : microsoftEmailService.getMicrosoftLoginUrl(supervisorId),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('📊 Auth status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Auth status check failed',
      details: error.message
    });
  }
});

export default router;