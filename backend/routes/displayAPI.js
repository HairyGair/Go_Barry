// backend/routes/displayAPI.js
// API endpoints for managing the display screen

import express from 'express';
import { convexSync } from '../services/convexSync.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Push an alert to the display screen
router.post('/push-alert', async (req, res) => {
  try {
    const { 
      sessionId, 
      alertId,
      type,
      title, 
      message, 
      priority = 'medium',
      severity,
      location,
      affectedRoutes,
      source,
      duration = 600,
      iconCategory,
      mapIcon
    } = req.body;
    
    // Validate session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Map priority levels to display priority numbers
    const priorityMap = {
      'high': 1,     // P1 Critical
      'medium': 2,   // P2 Important  
      'low': 3       // P3 Information
    };
    
    // Create display message with proper structure
    const displayMessage = {
      id: `display_${alertId || Date.now()}`,
      content: title || message,
      priority: priorityMap[priority] || 2,
      supervisorName: supervisor.name,
      supervisorBadge: supervisor.badge,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (duration * 1000)).toISOString(),
      // Disruption-specific data
      alertType: type,
      alertSeverity: severity,
      location: location,
      affectsRoutes: affectedRoutes || [],
      source: source,
      iconCategory: iconCategory,
      mapIcon: mapIcon,
      autoTriggered: false,
      displayed: false,
      // Display metadata
      pushedToDisplay: true,
      pushedBy: supervisor.name,
      pushedAt: new Date().toISOString(),
      displayDuration: duration,
      rotationInterval: 30000 // 30 seconds
    };
    
    // Store in global display messages (in production, use Convex)
    if (!global.displayMessages) {
      global.displayMessages = [];
    }
    
    // Remove any existing message for the same alert
    global.displayMessages = global.displayMessages.filter(msg => msg.id !== displayMessage.id);
    
    // Add new message
    global.displayMessages.push(displayMessage);
    
    // Keep only last 10 messages
    global.displayMessages = global.displayMessages.slice(-10);
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'push_to_display', {
      alertId: alertId,
      alertTitle: title,
      alertType: type,
      severity: severity,
      affectedRoutes: affectedRoutes?.length || 0,
      displayDuration: duration,
      priority
    });
    
    // Sync to Convex for real-time update
    if (convexSync.isEnabled) {
      try {
        await convexSync.syncDisplayMessages([displayMessage]);
      } catch (syncError) {
        console.warn('⚠️ Convex sync failed, continuing with local storage:', syncError.message);
      }
    }
    
    console.log(`📺 Disruption pushed to display by ${supervisor.name}: ${title}`);
    console.log(`   Type: ${type}, Severity: ${severity}, Routes: ${affectedRoutes?.join(', ')}`);
    
    res.json({
      success: true,
      message: 'Disruption pushed to display screen successfully',
      displayMessage: {
        id: displayMessage.id,
        content: displayMessage.content,
        priority: displayMessage.priority,
        expiresAt: displayMessage.expiresAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error pushing disruption to display:', error);
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

// Get current display messages
router.get('/current-messages', async (req, res) => {
  try {
    // Get stored display messages
    const currentMessages = global.displayMessages || [];
    
    // Filter out expired messages
    const activeMessages = currentMessages.filter(msg => {
      const expiresAt = new Date(msg.expiresAt).getTime();
      return expiresAt > Date.now();
    });
    
    // Update global storage with only active messages
    global.displayMessages = activeMessages;
    
    res.json({
      success: true,
      messages: activeMessages,
      count: activeMessages.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting display messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current display alerts (legacy endpoint for compatibility)
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

// Push message to display screen (enhanced)
router.post('/push-message', async (req, res) => {
  try {
    const { sessionId, message, priority = 'medium', duration = 300, messageType = 'info' } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Create display message
    const displayMessage = {
      id: `display_msg_${Date.now()}`,
      content: message,
      priority: priority,
      messageType: messageType,
      duration: duration,
      createdBy: supervisor.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (duration * 1000)).toISOString(),
      displayed: false,
      acknowledged: false
    };
    
    // Store message (in production, use Convex)
    if (!global.displayMessages) {
      global.displayMessages = [];
    }
    global.displayMessages.push(displayMessage);
    
    // Log the action
    await supervisorManager.logSupervisorAction(sessionId, 'push_message', {
      message,
      priority,
      messageType,
      duration
    });
    
    // Sync to Convex for real-time update
    if (convexSync.isEnabled) {
      await convexSync.syncDisplayMessage(displayMessage);
    }
    
    console.log(`📺 Message pushed to display by ${supervisor.name}: ${message}`);
    
    res.json({
      success: true,
      message: 'Message pushed to display screen',
      displayMessage
    });
    
  } catch (error) {
    console.error('❌ Error pushing message to display:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current display state
router.get('/current-state', async (req, res) => {
  try {
    // Get active alerts
    const { default: fetch } = await import('node-fetch');
    
    let alerts = [];
    try {
      const alertsResponse = await fetch('http://localhost:' + (process.env.PORT || 3001) + '/api/alerts-enhanced');
      const alertsData = await alertsResponse.json();
      if (alertsData.success) {
        alerts = alertsData.alerts || [];
      }
    } catch (alertError) {
      console.warn('⚠️ Failed to fetch alerts for display state:', alertError.message);
    }
    
    // Get active supervisors
    const activeSupervisors = await supervisorManager.getActiveSupervisors();
    
    // Get display messages
    const displayMessages = (global.displayMessages || [])
      .filter(msg => new Date(msg.expiresAt) > new Date())
      .sort((a, b) => {
        const priorityOrder = { 'emergency': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    
    // Get coordination messages
    const recentCoordination = (global.coordinationMessages || [])
      .slice(-5)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const currentState = {
      alerts: {
        total: alerts.length,
        active: alerts.filter(a => a.status === 'red' || !a.status).length,
        critical: alerts.filter(a => a.severity === 'High').length,
        alerts: alerts.slice(0, 10) // Top 10 for display
      },
      supervisors: {
        active: activeSupervisors.length,
        supervisors: activeSupervisors
      },
      messages: {
        active: displayMessages.length,
        messages: displayMessages
      },
      coordination: {
        recent: recentCoordination.length,
        messages: recentCoordination
      },
      lastUpdated: new Date().toISOString(),
      systemStatus: 'operational'
    };
    
    res.json({
      success: true,
      currentState
    });
    
  } catch (error) {
    console.error('❌ Error getting display state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update message priority
router.post('/update-priority', async (req, res) => {
  try {
    const { sessionId, messageId, newPriority, reason } = req.body;
    
    if (!sessionId || !messageId || !newPriority) {
      return res.status(400).json({
        success: false,
        error: 'Session ID, message ID, and new priority are required'
      });
    }
    
    // Validate supervisor session
    const sessionValidation = supervisorManager.validateSupervisorSession(sessionId);
    if (!sessionValidation.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor session'
      });
    }
    
    const supervisor = sessionValidation.supervisor;
    
    // Find and update message
    if (global.displayMessages) {
      const message = global.displayMessages.find(m => m.id === messageId);
      if (message) {
        const oldPriority = message.priority;
        message.priority = newPriority;
        message.priorityUpdatedBy = supervisor.name;
        message.priorityUpdatedAt = new Date().toISOString();
        message.priorityUpdateReason = reason;
        
        // Log the action
        await supervisorManager.logSupervisorAction(sessionId, 'update_message_priority', {
          messageId,
          oldPriority,
          newPriority,
          reason
        });
        
        console.log(`🎯 Message ${messageId} priority updated from ${oldPriority} to ${newPriority} by ${supervisor.name}`);
        
        res.json({
          success: true,
          message: 'Message priority updated',
          updatedMessage: message
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
    } else {
      res.status(404).json({
        success: false,
        error: 'No messages found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating message priority:', error);
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

// Get display message queue
router.get('/message-queue', async (req, res) => {
  try {
    const { priority } = req.query;
    
    let messages = (global.displayMessages || [])
      .filter(msg => new Date(msg.expiresAt) > new Date());
    
    if (priority) {
      messages = messages.filter(msg => msg.priority === priority);
    }
    
    messages.sort((a, b) => {
      const priorityOrder = { 'emergency': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    res.json({
      success: true,
      messages,
      count: messages.length,
      queueDepth: {
        emergency: messages.filter(m => m.priority === 'emergency').length,
        high: messages.filter(m => m.priority === 'high').length,
        medium: messages.filter(m => m.priority === 'medium').length,
        low: messages.filter(m => m.priority === 'low').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting message queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear expired messages (maintenance endpoint)
router.post('/clear-expired', async (req, res) => {
  try {
    const now = new Date();
    const beforeCount = (global.displayMessages || []).length;
    
    if (global.displayMessages) {
      global.displayMessages = global.displayMessages.filter(
        msg => new Date(msg.expiresAt) > now
      );
    }
    
    const afterCount = (global.displayMessages || []).length;
    const clearedCount = beforeCount - afterCount;
    
    console.log(`🧹 Cleared ${clearedCount} expired display messages`);
    
    res.json({
      success: true,
      message: 'Expired messages cleared',
      clearedCount,
      remainingCount: afterCount
    });
    
  } catch (error) {
    console.error('❌ Error clearing expired messages:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
