// backend/routes/messagingAPI.js
// Phase 4: Multi-Channel Distribution & Automation API Routes

import express from 'express';

const router = express.Router();

// In-memory message storage (in production, use database)
let messages = [];
let messageCounter = 1;

// Message channel configurations
const MESSAGE_CHANNELS = {
  ticketer: {
    name: 'Ticketer (Driver/Crew)',
    endpoint: 'https://api.ticketer.com/messages',
    enabled: true,
    requiresAuth: true,
    maxLength: 160
  },
  passengerCloud: {
    name: 'Passenger Cloud (Website)',
    endpoint: 'https://api.passengercloud.com/alerts',
    enabled: true,
    requiresAuth: true,
    maxLength: 500
  },
  email: {
    name: 'Email Alerts',
    endpoint: 'internal',
    enabled: true,
    requiresAuth: false,
    maxLength: 5000
  },
  sms: {
    name: 'SMS Alerts',
    endpoint: 'https://api.sms.com/send',
    enabled: false,
    requiresAuth: true,
    maxLength: 160
  },
  socialMedia: {
    name: 'Social Media',
    endpoint: 'https://api.twitter.com/posts',
    enabled: false,
    requiresAuth: true,
    maxLength: 280
  }
};

// POST /api/messaging/send - Send message to multiple channels
router.post('/send', async (req, res) => {
  try {
    const {
      title,
      content,
      priority,
      channels,
      emailLists,
      scheduleTime,
      expiryTime,
      affectedRoutes,
      locations,
      sentBy
    } = req.body;

    // Validate required fields
    if (!title || !content || !channels || channels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title, content, and at least one channel are required'
      });
    }

    // Create message record
    const message = {
      id: `msg_${messageCounter++}`,
      title,
      content,
      priority: priority || 'Medium',
      channels,
      emailLists: emailLists || [],
      scheduleTime,
      expiryTime,
      affectedRoutes: affectedRoutes || [],
      locations: locations || [],
      sentBy: sentBy || 'Unknown',
      sentAt: new Date().toISOString(),
      status: 'sending',
      sendResults: {},
      recipients: 0
    };

    messages.unshift(message);

    // Simulate sending to each channel
    const sendResults = {};
    let totalRecipients = 0;

    for (const channelId of channels) {
      const channelConfig = MESSAGE_CHANNELS[channelId];
      if (!channelConfig) {
        sendResults[channelId] = {
          success: false,
          error: 'Unknown channel'
        };
        continue;
      }

      if (!channelConfig.enabled) {
        sendResults[channelId] = {
          success: false,
          error: 'Channel disabled'
        };
        continue;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

      // Simulate success/failure (95% success rate)
      const success = Math.random() > 0.05;
      const recipients = success ? Math.floor(Math.random() * 50) + 10 : 0;

      sendResults[channelId] = {
        success,
        recipients,
        sentAt: new Date().toISOString(),
        ...(success ? {} : { error: 'Delivery failed' })
      };

      if (success) {
        totalRecipients += recipients;
      }

      console.log(`📢 Message "${title}" ${success ? 'sent' : 'failed'} to ${channelConfig.name}`);
    }

    // Update message with results
    message.status = 'sent';
    message.sendResults = sendResults;
    message.recipients = totalRecipients;

    console.log(`✅ Message distributed: "${title}" to ${channels.length} channels, ${totalRecipients} recipients`);

    res.json({
      success: true,
      message,
      summary: {
        channelsAttempted: channels.length,
        channelsSuccessful: Object.values(sendResults).filter(r => r.success).length,
        totalRecipients
      }
    });

  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// GET /api/messaging/messages - Get message history
router.get('/messages', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const paginatedMessages = messages.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      messages: paginatedMessages,
      total: messages.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// GET /api/messaging/channels - Get channel status
router.get('/channels', async (req, res) => {
  try {
    const channelStatus = {};
    
    for (const [channelId, config] of Object.entries(MESSAGE_CHANNELS)) {
      // Simulate channel health check
      const online = Math.random() > 0.1; // 90% uptime
      const responseTime = Math.floor(Math.random() * 500) + 100;
      
      channelStatus[channelId] = {
        ...config,
        online,
        responseTime,
        lastCheck: new Date().toISOString()
      };
    }
    
    res.json({
      success: true,
      channels: channelStatus,
      summary: {
        total: Object.keys(MESSAGE_CHANNELS).length,
        online: Object.values(channelStatus).filter(c => c.online).length,
        enabled: Object.values(channelStatus).filter(c => c.enabled).length
      }
    });

  } catch (error) {
    console.error('Failed to get channel status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get channel status'
    });
  }
});

// GET /api/messaging/stats - Get messaging statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = messages.filter(msg => 
      new Date(msg.sentAt) >= today
    );
    
    const totalRecipients = messages.reduce((sum, msg) => sum + (msg.recipients || 0), 0);
    const successfulMessages = messages.filter(msg => 
      msg.status === 'sent' && 
      Object.values(msg.sendResults || {}).some(result => result.success)
    );
    
    const channelPerformance = {};
    Object.keys(MESSAGE_CHANNELS).forEach(channelId => {
      const channelMessages = messages.filter(msg => 
        msg.channels.includes(channelId) && msg.sendResults[channelId]
      );
      
      const sent = channelMessages.length;
      const delivered = channelMessages.filter(msg => 
        msg.sendResults[channelId]?.success
      ).length;
      const failed = sent - delivered;
      
      channelPerformance[channelId] = { sent, delivered, failed };
    });
    
    res.json({
      success: true,
      stats: {
        totalMessagesSent: messages.length,
        todayMessages: todayMessages.length,
        successRate: messages.length > 0 ? 
          (successfulMessages.length / messages.length * 100).toFixed(1) : 0,
        totalRecipients,
        averageDeliveryTime: '2.3 seconds', // Simulated
        channelPerformance
      }
    });

  } catch (error) {
    console.error('Failed to get messaging stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messaging statistics'
    });
  }
});

// POST /api/messaging/test - Test channel connectivity
router.post('/test/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channelConfig = MESSAGE_CHANNELS[channelId];
    
    if (!channelConfig) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }
    
    // Simulate test message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = Math.random() > 0.05; // 95% success rate
    const responseTime = Math.floor(Math.random() * 300) + 100;
    
    res.json({
      success: true,
      channelId,
      test: {
        success,
        responseTime,
        timestamp: new Date().toISOString(),
        ...(success ? {} : { error: 'Connection failed' })
      }
    });

  } catch (error) {
    console.error('Failed to test channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test channel'
    });
  }
});

// GET /api/messaging/templates - Get message templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'service_disruption',
        name: 'Service Disruption',
        title: 'Service Disruption - Route {route}',
        content: 'We are experiencing disruption to Route {route} services due to {reason} at {location}. Expected delays: {delay}. We apologize for any inconvenience.',
        channels: ['ticketer', 'passengerCloud', 'email'],
        priority: 'High',
        variables: ['route', 'reason', 'location', 'delay']
      },
      {
        id: 'planned_diversion',
        name: 'Planned Diversion',
        title: 'Planned Diversion - Route {route}',
        content: 'Route {route} will be diverted via {diversion} due to {reason} at {location}. This will be in effect from {startTime} to {endTime}.',
        channels: ['ticketer', 'passengerCloud'],
        priority: 'Medium',
        variables: ['route', 'diversion', 'reason', 'location', 'startTime', 'endTime']
      },
      {
        id: 'service_restored',
        name: 'Service Restored',
        title: 'Service Restored - Route {route}',
        content: 'Route {route} services have now returned to normal operation. Thank you for your patience during the disruption.',
        channels: ['passengerCloud', 'email'],
        priority: 'Low',
        variables: ['route']
      },
      {
        id: 'emergency_alert',
        name: 'Emergency Alert',
        title: 'URGENT: Emergency Service Alert',
        content: 'Emergency services are active at {location}. All services in the area are suspended until further notice. Please use alternative transport.',
        channels: ['ticketer', 'passengerCloud', 'email', 'sms'],
        priority: 'Critical',
        variables: ['location']
      }
    ];
    
    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Failed to get templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

export default router;
