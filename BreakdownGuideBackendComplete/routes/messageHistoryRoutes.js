// backend/routes/messageHistoryRoutes.js
// API routes for message history and audit logging - Phase 6

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Paths for data storage
const MESSAGE_HISTORY_FILE = path.join(__dirname, '../data/message_history.json');
const AUDIT_LOG_FILE = path.join(__dirname, '../data/message_audit.json');

// Utility function to ensure data files exist
const ensureDataFiles = async () => {
  try {
    // Check message history file
    try {
      await fs.access(MESSAGE_HISTORY_FILE);
    } catch {
      await fs.writeFile(MESSAGE_HISTORY_FILE, JSON.stringify({ messages: [] }, null, 2));
      console.log('📝 Created message_history.json');
    }

    // Check audit log file
    try {
      await fs.access(AUDIT_LOG_FILE);
    } catch {
      await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify({ auditLogs: [] }, null, 2));
      console.log('📝 Created message_audit.json');
    }
  } catch (error) {
    console.error('❌ Error ensuring data files:', error);
  }
};

// Initialize data files
ensureDataFiles();

// Utility function to load message history
const loadMessageHistory = async () => {
  try {
    const data = await fs.readFile(MESSAGE_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading message history:', error);
    return { messages: [] };
  }
};

// Utility function to save message history
const saveMessageHistory = async (data) => {
  try {
    await fs.writeFile(MESSAGE_HISTORY_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving message history:', error);
    return false;
  }
};

// Utility function to load audit logs
const loadAuditLogs = async () => {
  try {
    const data = await fs.readFile(AUDIT_LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading audit logs:', error);
    return { auditLogs: [] };
  }
};

// Utility function to save audit logs
const saveAuditLogs = async (data) => {
  try {
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving audit logs:', error);
    return false;
  }
};

// Utility function to create audit log entry
const createAuditLog = async (messageId, action, description, userId, details = null, changes = null) => {
  try {
    const auditData = await loadAuditLogs();
    
    const newLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      action,
      actionDescription: description,
      userId: userId || 'system',
      userName: getUserName(userId) || 'System',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // In real implementation, get from request
      userAgent: 'Go BARRY Web/1.0', // In real implementation, get from request
      details,
      changes
    };

    auditData.auditLogs.unshift(newLog); // Add to beginning of array
    
    // Keep only last 1000 audit logs to prevent file from growing too large
    if (auditData.auditLogs.length > 1000) {
      auditData.auditLogs = auditData.auditLogs.slice(0, 1000);
    }

    await saveAuditLogs(auditData);
    return newLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};

// Helper function to get user name from ID (in real app, this would query a user database)
const getUserName = (userId) => {
  const userMap = {
    'AG003': 'Adam Gordon',
    'BP009': 'Brian Peterson',
    'JH045': 'James Harrison',
    'MR123': 'Michael Roberts',
    'system': 'System'
  };
  return userMap[userId] || userId;
};

// Generate unique message ID
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// GET /api/messages/history - Get message history
router.get('/history', async (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    console.log(`📊 Loading message history for supervisor: ${supervisorId}`);

    const messageData = await loadMessageHistory();
    
    // Filter messages based on supervisor permissions
    // For now, show all messages - in production, filter by supervisor access level
    let messages = messageData.messages || [];
    
    // Sort by creation date (newest first)
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      messages,
      total: messages.length,
      supervisorId
    });

  } catch (error) {
    console.error('❌ Error loading message history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load message history'
    });
  }
});

// POST /api/messages - Create/save a new message
router.post('/', async (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    const {
      subject,
      content,
      routes,
      priority,
      category,
      alertId,
      status = 'draft',
      scheduledFor = null
    } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Subject and content are required'
      });
    }

    const messageId = generateMessageId();
    const now = new Date().toISOString();

    const newMessage = {
      id: messageId,
      subject,
      content,
      status,
      priority: priority || 'normal',
      category: category || 'general',
      routes: routes || [],
      createdAt: now,
      createdBy: supervisorId,
      alertId: alertId || null,
      scheduledFor,
      recipientCount: 0,
      openRate: 0,
      sentAt: null
    };

    // Load and update message history
    const messageData = await loadMessageHistory();
    messageData.messages = messageData.messages || [];
    messageData.messages.unshift(newMessage);

    const saved = await saveMessageHistory(messageData);
    
    if (saved) {
      // Create audit log
      await createAuditLog(
        messageId,
        status === 'draft' ? 'draft_saved' : 'message_created',
        status === 'draft' ? 'Message saved as draft' : 'New message created',
        supervisorId,
        {
          category,
          priority,
          routeCount: routes?.length || 0,
          sourceAlert: alertId
        }
      );

      console.log(`✅ Message ${messageId} created by ${supervisorId}`);
      
      res.json({
        success: true,
        message: newMessage,
        messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save message'
      });
    }

  } catch (error) {
    console.error('❌ Error creating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create message'
    });
  }
});

// PUT /api/messages/:messageId - Update an existing message
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    const updates = req.body;

    const messageData = await loadMessageHistory();
    const messageIndex = messageData.messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const originalMessage = { ...messageData.messages[messageIndex] };
    const updatedMessage = { 
      ...originalMessage, 
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy: supervisorId
    };

    messageData.messages[messageIndex] = updatedMessage;
    const saved = await saveMessageHistory(messageData);

    if (saved) {
      // Create audit log for modification
      const changes = {};
      Object.keys(updates).forEach(key => {
        if (originalMessage[key] !== updates[key]) {
          changes[key] = {
            before: originalMessage[key],
            after: updates[key]
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        await createAuditLog(
          messageId,
          'message_modified',
          'Message content or metadata updated',
          supervisorId,
          {
            fieldsChanged: Object.keys(changes),
            changeCount: Object.keys(changes).length
          },
          changes
        );
      }

      console.log(`✅ Message ${messageId} updated by ${supervisorId}`);
      
      res.json({
        success: true,
        message: updatedMessage
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update message'
      });
    }

  } catch (error) {
    console.error('❌ Error updating message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    });
  }
});

// POST /api/messages/:messageId/send - Send a message
router.post('/:messageId/send', async (req, res) => {
  try {
    const { messageId } = req.params;
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    const { recipientList = [] } = req.body;

    const messageData = await loadMessageHistory();
    const messageIndex = messageData.messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const message = messageData.messages[messageIndex];
    
    if (message.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Message has already been sent'
      });
    }

    // Simulate message sending (in real app, integrate with actual messaging service)
    const recipientCount = recipientList.length || Math.floor(Math.random() * 30) + 10;
    const openRate = Math.random() * 0.5 + 0.5; // Random open rate between 50-100%

    // Update message status
    messageData.messages[messageIndex] = {
      ...message,
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentBy: supervisorId,
      recipientCount,
      openRate
    };

    const saved = await saveMessageHistory(messageData);

    if (saved) {
      // Create audit log
      await createAuditLog(
        messageId,
        'message_sent',
        'Message sent to all recipients',
        supervisorId,
        {
          recipientCount,
          routesAffected: message.routes,
          priority: message.priority,
          deliveryMethod: 'immediate'
        }
      );

      console.log(`📤 Message ${messageId} sent by ${supervisorId} to ${recipientCount} recipients`);
      
      res.json({
        success: true,
        message: messageData.messages[messageIndex],
        recipientCount,
        openRate
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }

  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// DELETE /api/messages/:messageId - Delete a message (drafts only)
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';

    const messageData = await loadMessageHistory();
    const messageIndex = messageData.messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const message = messageData.messages[messageIndex];

    if (message.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Only draft messages can be deleted'
      });
    }

    // Remove message from history
    messageData.messages.splice(messageIndex, 1);
    const saved = await saveMessageHistory(messageData);

    if (saved) {
      // Create audit log
      await createAuditLog(
        messageId,
        'draft_deleted',
        'Draft message permanently deleted',
        supervisorId,
        {
          deletionReason: 'user_request',
          messageSubject: message.subject
        }
      );

      console.log(`🗑️ Draft message ${messageId} deleted by ${supervisorId}`);
      
      res.json({
        success: true,
        message: 'Draft deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete message'
      });
    }

  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
});

// GET /api/messages/audit - Get all audit logs
router.get('/audit', async (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    console.log(`📊 Loading audit logs for supervisor: ${supervisorId}`);

    const auditData = await loadAuditLogs();
    let auditLogs = auditData.auditLogs || [];

    // Add message subjects to audit logs for context
    const messageData = await loadMessageHistory();
    const messageMap = new Map(messageData.messages.map(m => [m.id, m.subject]));

    auditLogs = auditLogs.map(log => ({
      ...log,
      messageSubject: messageMap.get(log.messageId) || 'Unknown Message'
    }));

    res.json({
      success: true,
      auditLogs,
      total: auditLogs.length,
      supervisorId
    });

  } catch (error) {
    console.error('❌ Error loading audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load audit logs'
    });
  }
});

// GET /api/messages/:messageId/audit - Get audit logs for specific message
router.get('/:messageId/audit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';

    console.log(`📊 Loading audit logs for message ${messageId}`);

    const auditData = await loadAuditLogs();
    let auditLogs = (auditData.auditLogs || []).filter(log => log.messageId === messageId);

    // Get message subject for context
    const messageData = await loadMessageHistory();
    const message = messageData.messages.find(m => m.id === messageId);
    const messageSubject = message?.subject || 'Unknown Message';

    auditLogs = auditLogs.map(log => ({
      ...log,
      messageSubject
    }));

    res.json({
      success: true,
      auditLogs,
      total: auditLogs.length,
      messageId,
      messageSubject,
      supervisorId
    });

  } catch (error) {
    console.error('❌ Error loading message audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load message audit logs'
    });
  }
});

// GET /api/messages/stats - Get message statistics
router.get('/stats', async (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'] || 'unknown';
    
    const messageData = await loadMessageHistory();
    const messages = messageData.messages || [];
    
    const auditData = await loadAuditLogs();
    const auditLogs = auditData.auditLogs || [];

    const stats = {
      totalMessages: messages.length,
      sentMessages: messages.filter(m => m.status === 'sent').length,
      draftMessages: messages.filter(m => m.status === 'draft').length,
      scheduledMessages: messages.filter(m => m.status === 'scheduled').length,
      totalRecipients: messages.filter(m => m.status === 'sent').reduce((sum, m) => sum + (m.recipientCount || 0), 0),
      averageOpenRate: (() => {
        const sentWithOpenRate = messages.filter(m => m.status === 'sent' && m.openRate);
        if (sentWithOpenRate.length === 0) return 0;
        return sentWithOpenRate.reduce((sum, m) => sum + m.openRate, 0) / sentWithOpenRate.length;
      })(),
      recentActivity: auditLogs.slice(0, 10), // Last 10 activities
      messagesByCategory: (() => {
        const categories = {};
        messages.forEach(m => {
          categories[m.category] = (categories[m.category] || 0) + 1;
        });
        return categories;
      })(),
      messagesByPriority: (() => {
        const priorities = {};
        messages.forEach(m => {
          priorities[m.priority] = (priorities[m.priority] || 0) + 1;
        });
        return priorities;
      })()
    };

    res.json({
      success: true,
      stats,
      supervisorId
    });

  } catch (error) {
    console.error('❌ Error loading message statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load message statistics'
    });
  }
});

export default router;