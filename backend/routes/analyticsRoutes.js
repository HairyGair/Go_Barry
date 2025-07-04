// routes/analyticsRoutes.js
// Analytics and bulk operations API routes for Message Distribution Centre Phase 7

import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to load JSON file
const loadJSONFile = (filename) => {
  const filePath = join(__dirname, '..', 'data', filename);
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Helper function to save JSON file
const saveJSONFile = (filename, data) => {
  const filePath = join(__dirname, '..', 'data', filename);
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    return false;
  }
};

// Generate mock analytics data
const generateAnalytics = (timeRange) => {
  const now = new Date();
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  // Generate time series data
  const timeSeriesData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    timeSeriesData.push({
      date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      sent: Math.floor(Math.random() * 50) + 20,
      opened: Math.floor(Math.random() * 40) + 15,
      delivered: Math.floor(Math.random() * 45) + 18
    });
  }

  return {
    overview: {
      totalMessages: Math.floor(Math.random() * 500) + 200,
      totalRecipients: Math.floor(Math.random() * 5000) + 2000,
      averageOpenRate: Math.random() * 0.3 + 0.6, // 60-90%
      averageResponseTime: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
      topPriority: 'urgent',
      topCategory: 'roadworks'
    },
    delivery: {
      sent: Math.floor(Math.random() * 400) + 150,
      delivered: Math.floor(Math.random() * 380) + 140,
      failed: Math.floor(Math.random() * 20) + 5,
      pending: Math.floor(Math.random() * 30) + 10,
      scheduled: Math.floor(Math.random() * 50) + 20
    },
    engagement: {
      opened: Math.floor(Math.random() * 300) + 100,
      clicked: Math.floor(Math.random() * 150) + 50,
      replied: Math.floor(Math.random() * 50) + 10,
      forwarded: Math.floor(Math.random() * 30) + 5
    },
    routePerformance: [
      { route: '21', messages: 45, openRate: 0.82, avgDelay: 12 },
      { route: 'X21', messages: 38, openRate: 0.78, avgDelay: 15 },
      { route: '1', messages: 52, openRate: 0.85, avgDelay: 8 },
      { route: '10', messages: 31, openRate: 0.75, avgDelay: 10 },
      { route: '56', messages: 28, openRate: 0.72, avgDelay: 14 }
    ],
    timeSeriesData,
    categoryBreakdown: {
      roadworks: Math.floor(Math.random() * 100) + 50,
      incidents: Math.floor(Math.random() * 80) + 30,
      service: Math.floor(Math.random() * 60) + 20,
      general: Math.floor(Math.random() * 40) + 10
    },
    supervisorActivity: [
      { supervisorId: 'AG003', name: 'Adam Gordon', messages: 125, avgResponseTime: 8 },
      { supervisorId: 'BP009', name: 'Brian Peterson', messages: 98, avgResponseTime: 12 },
      { supervisorId: 'JH045', name: 'James Harrison', messages: 76, avgResponseTime: 10 }
    ]
  };
};

// GET /api/messages/analytics - Get message analytics
router.get('/analytics', (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Analytics] Getting analytics for ${supervisorId}, timeRange: ${timeRange}`);
    
    const analytics = generateAnalytics(timeRange);
    
    res.json({
      success: true,
      analytics,
      timeRange,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load analytics'
    });
  }
});

// GET /api/messages/scheduled - Get scheduled messages
router.get('/scheduled', (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'];
    console.log(`[Scheduler] Getting scheduled messages for ${supervisorId}`);
    
    // Generate mock scheduled messages
    const now = new Date();
    const scheduledMessages = [
      {
        id: 'sched_001',
        title: 'Morning Service Update - Route 21',
        content: 'Daily morning service status update for Route 21 operations...',
        routes: ['21'],
        scheduledFor: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        category: 'service',
        status: 'pending',
        createdBy: supervisorId || 'AG003',
        conditions: [
          { type: 'weather', operator: 'not_equals', value: 'severe' },
          { type: 'time', operator: 'between', value: '07:00-09:00' }
        ]
      },
      {
        id: 'sched_002',
        title: 'Evening Rush Hour Alert',
        content: 'Prepare for evening rush hour disruptions...',
        routes: ['1', '21', '56'],
        scheduledFor: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        priority: 'urgent',
        category: 'general',
        status: 'pending',
        createdBy: supervisorId || 'AG003',
        conditions: [
          { type: 'day_of_week', operator: 'in', value: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] }
        ]
      }
    ];
    
    res.json({
      success: true,
      scheduledMessages
    });
  } catch (error) {
    console.error('Error getting scheduled messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load scheduled messages'
    });
  }
});

// GET /api/messages/recurring-rules - Get recurring rules
router.get('/recurring-rules', (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'];
    console.log(`[Scheduler] Getting recurring rules for ${supervisorId}`);
    
    // Generate mock recurring rules
    const recurringRules = [
      {
        id: 'rec_001',
        name: 'Daily Morning Briefing',
        template: 'morning_briefing',
        frequency: 'daily',
        time: '08:00',
        days: [],
        conditions: [
          { type: 'day_of_week', operator: 'not_in', value: ['saturday', 'sunday'] }
        ],
        active: true,
        routes: ['21', 'X21', '1'],
        createdBy: supervisorId || 'AG003',
        nextExecution: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
        lastExecution: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'rec_002',
        name: 'Weekly Route Performance',
        template: 'performance_summary',
        frequency: 'weekly',
        time: '17:00',
        days: ['friday'],
        conditions: [],
        active: true,
        routes: ['all'],
        createdBy: supervisorId || 'BP009',
        nextExecution: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastExecution: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      recurringRules
    });
  } catch (error) {
    console.error('Error getting recurring rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load recurring rules'
    });
  }
});

// PUT /api/messages/recurring-rules/:id - Update recurring rule
router.put('/recurring-rules/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Scheduler] Updating recurring rule ${id} for ${supervisorId}, active: ${active}`);
    
    // In a real implementation, this would update the database
    res.json({
      success: true,
      message: 'Recurring rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating recurring rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recurring rule'
    });
  }
});

// POST /api/messages/:id/cancel - Cancel scheduled message
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Scheduler] Canceling scheduled message ${id} for ${supervisorId}`);
    
    // In a real implementation, this would update the database
    res.json({
      success: true,
      message: 'Scheduled message cancelled successfully'
    });
  } catch (error) {
    console.error('Error canceling scheduled message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled message'
    });
  }
});

// POST /api/messages/:id/resend - Resend message
router.post('/:id/resend', (req, res) => {
  try {
    const { id } = req.params;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Bulk] Resending message ${id} for ${supervisorId}`);
    
    // In a real implementation, this would resend the message
    res.json({
      success: true,
      message: 'Message resent successfully'
    });
  } catch (error) {
    console.error('Error resending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend message'
    });
  }
});

// GET /api/integrations/status - Get integration status
router.get('/status', (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'];
    console.log(`[Integrations] Getting integration status for ${supervisorId}`);
    
    // Generate mock service status
    const services = [
      {
        id: 'ticketer',
        name: 'Ticketer Portal',
        description: 'Driver messaging and fleet management',
        url: 'https://portal.ticketer.org.uk',
        status: Math.random() > 0.1 ? 'operational' : 'degraded',
        responseTime: Math.floor(Math.random() * 500) + 200,
        uptime: 99.2 + Math.random() * 0.7,
        lastCheck: new Date(),
        incidents: Math.floor(Math.random() * 3),
        type: 'external',
        critical: true,
        healthChecks: [
          { name: 'API Endpoint', status: 'healthy', responseTime: 245 },
          { name: 'Authentication', status: 'healthy', responseTime: 180 },
          { name: 'Message Queue', status: 'healthy', responseTime: 95 }
        ]
      },
      {
        id: 'passenger_cloud',
        name: 'Passenger Cloud',
        description: 'Customer messaging and app notifications',
        url: 'https://gonortheast.passenger-app.com',
        status: Math.random() > 0.05 ? 'operational' : 'outage',
        responseTime: Math.floor(Math.random() * 800) + 300,
        uptime: 98.8 + Math.random() * 1.1,
        lastCheck: new Date(),
        incidents: Math.floor(Math.random() * 2),
        type: 'external',
        critical: true,
        healthChecks: [
          { name: 'Web Portal', status: 'healthy', responseTime: 456 },
          { name: 'API Gateway', status: 'healthy', responseTime: 320 },
          { name: 'Push Notifications', status: 'warning', responseTime: 1200 }
        ]
      },
      {
        id: 'convex',
        name: 'Convex Sync',
        description: 'Real-time data synchronization',
        url: 'https://api.convex.dev',
        status: Math.random() > 0.02 ? 'operational' : 'degraded',
        responseTime: Math.floor(Math.random() * 200) + 50,
        uptime: 99.95,
        lastCheck: new Date(),
        incidents: 0,
        type: 'internal',
        critical: true,
        healthChecks: [
          { name: 'WebSocket Connection', status: 'healthy', responseTime: 85 },
          { name: 'Database Sync', status: 'healthy', responseTime: 125 },
          { name: 'Authentication', status: 'healthy', responseTime: 67 }
        ]
      }
    ];
    
    // Calculate overall status
    const criticalDown = services.filter(s => s.critical && (s.status === 'outage' || s.status === 'major_outage')).length;
    const anyDegraded = services.some(s => s.status === 'degraded' || s.status === 'warning');
    
    let overallStatus = 'operational';
    if (criticalDown > 0) {
      overallStatus = 'outage';
    } else if (anyDegraded) {
      overallStatus = 'degraded';
    }
    
    res.json({
      success: true,
      services,
      overallStatus,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting integration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load integration status'
    });
  }
});

// POST /api/search/advanced - Advanced search
router.post('/advanced', (req, res) => {
  try {
    const { query, filters, mode } = req.body;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Search] Advanced search for ${supervisorId}: ${query} (${mode})`);
    
    // Generate mock search results based on query
    const results = [];
    
    if (query.toLowerCase().includes('bridge') || query.toLowerCase().includes('urgent')) {
      results.push({
        id: 'msg_001',
        type: 'message',
        title: 'URGENT: High Level Bridge - Police incident causing full closure',
        content: 'URGENT ROADWORK NOTIFICATION\\n\\nLocation: High Level Bridge, Newcastle...',
        relevance: 0.95,
        status: 'sent',
        priority: 'urgent',
        category: 'incident',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdBy: 'AG003',
        routes: ['1', '10', '11', '12', '21'],
        highlights: ['High Level Bridge', 'URGENT', 'police incident']
      });
    }
    
    if (query.toLowerCase().includes('21') || query.toLowerCase().includes('route')) {
      results.push({
        id: 'msg_002',
        type: 'message',
        title: 'Service Update: Route 21 Running Late',
        content: 'Route 21 services are experiencing delays due to traffic congestion...',
        relevance: 0.88,
        status: 'sent',
        priority: 'normal',
        category: 'service',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        createdBy: 'BP009',
        routes: ['21'],
        highlights: ['Route 21', 'delays', 'traffic']
      });
    }
    
    if (filters.includeTemplates && query.toLowerCase().includes('roadwork')) {
      results.push({
        id: 'tpl_001',
        type: 'template',
        title: 'Emergency Road Closure Template',
        content: 'URGENT ROAD CLOSURE\\n\\nLocation: [LOCATION]\\nDuration: [DURATION]...',
        relevance: 0.82,
        category: 'roadworks',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'AG003',
        useCount: 15,
        highlights: ['road closure', 'emergency', 'duration']
      });
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    res.json({
      success: true,
      results,
      totalCount: results.length,
      query,
      filters,
      mode
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// GET /api/search/saved - Get saved searches
router.get('/saved', (req, res) => {
  try {
    const supervisorId = req.headers['x-supervisor-id'];
    console.log(`[Search] Getting saved searches for ${supervisorId}`);
    
    // Generate mock saved searches
    const savedSearches = [
      {
        id: 'search_001',
        name: 'High Priority Alerts',
        query: 'URGENT OR priority:urgent',
        filters: { priority: 'urgent', includeMessages: true, includeAuditLogs: false },
        createdBy: supervisorId || 'AG003',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        useCount: 12
      },
      {
        id: 'search_002',
        name: 'Route 21 Communications',
        query: 'route:21 OR "route 21"',
        filters: { includeMessages: true, includeTemplates: true },
        createdBy: supervisorId || 'AG003',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        useCount: 8
      }
    ];
    
    res.json({
      success: true,
      savedSearches
    });
  } catch (error) {
    console.error('Error getting saved searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load saved searches'
    });
  }
});

// POST /api/search/save - Save search
router.post('/save', (req, res) => {
  try {
    const { name, query, filters, mode } = req.body;
    const supervisorId = req.headers['x-supervisor-id'];
    
    console.log(`[Search] Saving search "${name}" for ${supervisorId}`);
    
    // In a real implementation, this would save to database
    res.json({
      success: true,
      message: 'Search saved successfully'
    });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search'
    });
  }
});

export default router;