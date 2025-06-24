// backend/routes/displayAPI.js
// API endpoints for managing the display screen

import express from 'express';
import { convexSync } from '../services/convexSync.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Push an alert to the display screen
router.post('/push-alert', async (req, res) => {
  try {
    const { sessionId, alert, displayDuration = 300, priority = 'normal' } = req.body;
    
    // Validate session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create display alert
    const displayAlert = {
      ...alert,
      id: alert.id || `display_${Date.now()}`,
      pushedToDisplay: true,
      pushedBy: supervisor.name,
      pushedAt: new Date().toISOString(),
      displayPriority: priority,
      displayDuration,
      expiresAt: new Date(Date.now() + (displayDuration * 1000)).toISOString()
    };
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'push_to_display', {
      alertId: alert.id,
      alertTitle: alert.title,
      alertType: alert.alertCategory || 'unknown',
      displayDuration,
      priority
    });
    
    // Sync to Convex for real-time update
    if (convexSync.isEnabled) {
      await convexSync.syncAlerts([displayAlert]);
    }
    
    console.log(`📺 Alert pushed to display by ${supervisor.name}: ${alert.title}`);
    
    res.json({
      success: true,
      message: 'Alert pushed to display screen',
      displayAlert
    });
    
  } catch (error) {
    console.error('❌ Error pushing alert to display:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove an alert from the display screen
router.post('/remove-alert', async (req, res) => {
  try {
    const { sessionId, alertId } = req.body;
    
    // Validate session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'remove_from_display', {
      alertId,
      removedBy: supervisor.name
    });
    
    // TODO: Implement actual removal logic with Convex
    
    console.log(`📺 Alert removed from display by ${supervisor.name}: ${alertId}`);
    
    res.json({
      success: true,
      message: 'Alert removed from display screen'
    });
    
  } catch (error) {
    console.error('❌ Error removing alert from display:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current display alerts
router.get('/current-alerts', async (req, res) => {
  try {
    // Import the alerts from main API
    const { default: fetch } = await import('node-fetch');
    
    // Get all current alerts
    const alertsResponse = await fetch('http://localhost:' + (process.env.PORT || 3001) + '/api/alerts');
    const alertsData = await alertsResponse.json();
    
    if (!alertsData.success) {
      throw new Error('Failed to fetch alerts');
    }
    
    // Filter for high-priority alerts suitable for display
    const displayAlerts = alertsData.alerts.filter(alert => {
      // Only show high severity alerts or those affecting major routes
      if (alert.severity === 'High') return true;
      
      // Show alerts affecting key routes
      if (alert.affectsRoutes && alert.affectsRoutes.length > 0) {
        const majorRoutes = ['Q3', 'Q3X', '10', '10A', '10B', '21', '22', '28', '28B', '56', '57', 'X30', 'X31'];
        return alert.affectsRoutes.some(route => majorRoutes.includes(route));
      }
      
      return false;
    }).slice(0, 10); // Limit to 10 alerts for display
    
    res.json({
      success: true,
      alerts: displayAlerts,
      count: displayAlerts.length,
      message: 'Display alerts retrieved',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting display alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send emergency message to display
router.post('/emergency-message', async (req, res) => {
  try {
    const { sessionId, message, severity = 'high', duration = 600 } = req.body;
    
    // Validate session and admin rights
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Only admins can send emergency messages
    if (!supervisor.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can send emergency messages'
      });
    }
    
    const emergencyAlert = {
      id: `emergency_${Date.now()}`,
      type: 'emergency_message',
      title: 'EMERGENCY MESSAGE',
      description: message,
      severity,
      pushedToDisplay: true,
      pushedBy: supervisor.name,
      pushedAt: new Date().toISOString(),
      displayPriority: 'emergency',
      displayDuration: duration,
      expiresAt: new Date(Date.now() + (duration * 1000)).toISOString()
    };
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'emergency_message', {
      message,
      severity,
      duration
    });
    
    // Sync to Convex
    if (convexSync.isEnabled) {
      await convexSync.syncAlerts([emergencyAlert]);
    }
    
    console.log(`🚨 Emergency message sent by ${supervisor.name}: ${message}`);
    
    res.json({
      success: true,
      message: 'Emergency message sent to display',
      emergencyAlert
    });
    
  } catch (error) {
    console.error('❌ Error sending emergency message:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
