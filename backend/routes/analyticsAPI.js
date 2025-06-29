// Analytics API endpoints for Go BARRY
import express from 'express';

const router = express.Router();

// In-memory storage for analytics (in production, use database)
const analyticsStore = {
  events: [],
  sessions: new Map(),
  metrics: {
    totalEvents: 0,
    uniqueSessions: 0,
    featureUsage: new Map(),
    alertInteractions: 0,
    errorCount: 0
  }
};

// Cleanup old events periodically (keep last 24 hours)
setInterval(() => {
  const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
  analyticsStore.events = analyticsStore.events.filter(
    event => new Date(event.properties.timestamp).getTime() > cutoffTime
  );
}, 60 * 60 * 1000); // Every hour

// POST /api/analytics - Receive analytics events
router.post('/', (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Events must be an array' 
      });
    }

    // Process each event
    events.forEach(event => {
      // Store event
      analyticsStore.events.push(event);
      analyticsStore.metrics.totalEvents++;

      // Track sessions
      if (event.properties.sessionId) {
        analyticsStore.sessions.set(
          event.properties.sessionId,
          event.properties.timestamp
        );
        analyticsStore.metrics.uniqueSessions = analyticsStore.sessions.size;
      }

      // Track feature usage
      if (event.event === 'feature_used') {
        const feature = event.properties.feature;
        const count = analyticsStore.metrics.featureUsage.get(feature) || 0;
        analyticsStore.metrics.featureUsage.set(feature, count + 1);
      }

      // Track alert interactions
      if (event.event === 'alert_clicked') {
        analyticsStore.metrics.alertInteractions++;
      }

      // Track errors
      if (event.event === 'error_occurred') {
        analyticsStore.metrics.errorCount++;
      }
    });

    console.log(`📊 Received ${events.length} analytics events`);
    
    res.json({ 
      success: true, 
      eventsProcessed: events.length 
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/summary - Get analytics summary
router.get('/summary', (req, res) => {
  try {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last1h = now - 60 * 60 * 1000;

    // Calculate time-based metrics
    const events24h = analyticsStore.events.filter(
      e => new Date(e.properties.timestamp).getTime() > last24h
    );
    const events1h = analyticsStore.events.filter(
      e => new Date(e.properties.timestamp).getTime() > last1h
    );

    // Top features
    const topFeatures = Array.from(analyticsStore.metrics.featureUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([feature, count]) => ({ feature, count }));

    // Event types breakdown
    const eventTypes = {};
    events24h.forEach(event => {
      eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
    });

    res.json({
      success: true,
      summary: {
        totals: {
          events: analyticsStore.metrics.totalEvents,
          sessions: analyticsStore.metrics.uniqueSessions,
          alertInteractions: analyticsStore.metrics.alertInteractions,
          errors: analyticsStore.metrics.errorCount
        },
        last24Hours: {
          events: events24h.length,
          uniqueSessions: new Set(events24h.map(e => e.properties.sessionId)).size
        },
        lastHour: {
          events: events1h.length,
          uniqueSessions: new Set(events1h.map(e => e.properties.sessionId)).size
        },
        topFeatures,
        eventTypes,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/events - Get recent events (admin only)
router.get('/events', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const events = analyticsStore.events
      .slice(-limit - offset)
      .slice(0, limit)
      .reverse();

    res.json({
      success: true,
      events,
      total: analyticsStore.events.length
    });
  } catch (error) {
    console.error('Analytics events error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/performance - Get performance metrics
router.get('/performance', (req, res) => {
  try {
    const performanceEvents = analyticsStore.events
      .filter(e => e.event === 'performance_metric')
      .slice(-100); // Last 100 performance events

    const metrics = {};
    performanceEvents.forEach(event => {
      const { metric, value } = event.properties;
      if (!metrics[metric]) {
        metrics[metric] = {
          count: 0,
          total: 0,
          min: value,
          max: value,
          values: []
        };
      }
      
      metrics[metric].count++;
      metrics[metric].total += value;
      metrics[metric].min = Math.min(metrics[metric].min, value);
      metrics[metric].max = Math.max(metrics[metric].max, value);
      metrics[metric].values.push(value);
    });

    // Calculate averages and percentiles
    Object.keys(metrics).forEach(metric => {
      const m = metrics[metric];
      m.average = m.total / m.count;
      
      // Calculate percentiles
      const sorted = m.values.sort((a, b) => a - b);
      m.p50 = sorted[Math.floor(sorted.length * 0.5)];
      m.p95 = sorted[Math.floor(sorted.length * 0.95)];
      m.p99 = sorted[Math.floor(sorted.length * 0.99)];
      
      delete m.values; // Don't send raw values
    });

    res.json({
      success: true,
      performance: metrics
    });
  } catch (error) {
    console.error('Analytics performance error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/supervisor-performance - Get supervisor performance metrics
router.get('/supervisor-performance', async (req, res) => {
  try {
    const { supervisorId, timeRange = '24h' } = req.query;
    
    // Calculate time range
    const now = Date.now();
    let cutoffTime;
    switch (timeRange) {
      case '1h': cutoffTime = now - 60 * 60 * 1000; break;
      case '24h': cutoffTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': cutoffTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoffTime = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    // Filter events by time range
    const relevantEvents = analyticsStore.events.filter(
      event => new Date(event.properties.timestamp).getTime() > cutoffTime
    );
    
    let supervisorEvents = relevantEvents;
    if (supervisorId) {
      supervisorEvents = relevantEvents.filter(
        event => event.properties.supervisorId === supervisorId
      );
    }
    
    // Calculate performance metrics
    const alertDismissals = supervisorEvents.filter(e => e.event === 'alert_dismissed');
    const alertRestorations = supervisorEvents.filter(e => e.event === 'alert_restored');
    const coordinationMessages = supervisorEvents.filter(e => e.event === 'supervisor_coordination');
    const handovers = supervisorEvents.filter(e => e.event === 'shift_handover');
    const displayActions = supervisorEvents.filter(e => e.event === 'display_action');
    
    // Response time calculation
    const responseEvents = supervisorEvents.filter(e => e.properties.responseTime);
    const responseTimes = responseEvents.map(e => e.properties.responseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    // Activity hours calculation
    const activityByHour = {};
    supervisorEvents.forEach(event => {
      const hour = new Date(event.properties.timestamp).getHours();
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
    });
    
    const performance = {
      supervisorId: supervisorId || 'all',
      timeRange,
      metrics: {
        totalEvents: supervisorEvents.length,
        alertsHandled: alertDismissals.length,
        alertsRestored: alertRestorations.length,
        coordinationsSent: coordinationMessages.length,
        handoversCreated: handovers.length,
        displayActions: displayActions.length,
        averageResponseTime: Math.round(avgResponseTime),
        activityScore: supervisorEvents.length > 0 ? Math.min(100, supervisorEvents.length * 2) : 0
      },
      breakdown: {
        byEventType: {},
        byHour: activityByHour,
        responseTimes: {
          min: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
          max: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
          average: Math.round(avgResponseTime)
        }
      },
      period: {
        start: new Date(cutoffTime).toISOString(),
        end: new Date(now).toISOString()
      }
    };
    
    // Event type breakdown
    supervisorEvents.forEach(event => {
      performance.breakdown.byEventType[event.event] = 
        (performance.breakdown.byEventType[event.event] || 0) + 1;
    });
    
    res.json({
      success: true,
      performance
    });
    
  } catch (error) {
    console.error('Analytics supervisor performance error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/system-metrics - Get system-wide metrics
router.get('/system-metrics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time range
    const now = Date.now();
    let cutoffTime;
    switch (timeRange) {
      case '1h': cutoffTime = now - 60 * 60 * 1000; break;
      case '24h': cutoffTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': cutoffTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoffTime = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    // Filter events by time range
    const relevantEvents = analyticsStore.events.filter(
      event => new Date(event.properties.timestamp).getTime() > cutoffTime
    );
    
    // System-wide calculations
    const uniqueSupervisors = new Set(
      relevantEvents
        .filter(e => e.properties.supervisorId)
        .map(e => e.properties.supervisorId)
    ).size;
    
    const systemErrors = relevantEvents.filter(e => e.event === 'system_error');
    const apiCalls = relevantEvents.filter(e => e.event === 'api_call');
    const userSessions = new Set(
      relevantEvents.map(e => e.properties.sessionId)
    ).size;
    
    // Performance metrics
    const apiResponseTimes = apiCalls
      .filter(e => e.properties.responseTime)
      .map(e => e.properties.responseTime);
    
    const avgApiResponseTime = apiResponseTimes.length > 0
      ? apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length
      : 0;
    
    // Error rate calculation
    const totalRequests = apiCalls.length;
    const errorRate = totalRequests > 0 ? (systemErrors.length / totalRequests) * 100 : 0;
    
    // Memory and CPU simulation (in production, get from actual system metrics)
    const memoryUsage = {
      used: Math.random() * 1000 + 500, // MB
      total: 2048, // 2GB limit on Render
      percentage: Math.random() * 50 + 25
    };
    
    const cpuUsage = {
      current: Math.random() * 30 + 10, // %
      average: Math.random() * 25 + 15
    };
    
    const systemMetrics = {
      timeRange,
      period: {
        start: new Date(cutoffTime).toISOString(),
        end: new Date(now).toISOString()
      },
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: process.memoryUsage().rss / 1024 / 1024, // MB
          heapUsed: process.memoryUsage().heapUsed / 1024 / 1024,
          heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
          external: process.memoryUsage().external / 1024 / 1024
        },
        cpu: {
          loadAverage: process.cpuUsage(),
          usage: cpuUsage
        }
      },
      activity: {
        totalEvents: relevantEvents.length,
        uniqueSupervisors,
        userSessions,
        apiCalls: apiCalls.length,
        errors: systemErrors.length,
        errorRate: Math.round(errorRate * 100) / 100
      },
      performance: {
        averageApiResponseTime: Math.round(avgApiResponseTime),
        responseTimeP95: apiResponseTimes.length > 0 
          ? apiResponseTimes.sort((a, b) => a - b)[Math.floor(apiResponseTimes.length * 0.95)]
          : 0,
        throughput: {
          eventsPerMinute: relevantEvents.length / ((now - cutoffTime) / 60000),
          apiCallsPerMinute: apiCalls.length / ((now - cutoffTime) / 60000)
        }
      },
      health: {
        status: errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical',
        lastError: systemErrors.length > 0 ? systemErrors[systemErrors.length - 1] : null,
        alerts: memoryUsage.percentage > 80 ? ['High memory usage'] : []
      }
    };
    
    res.json({
      success: true,
      systemMetrics
    });
    
  } catch (error) {
    console.error('Analytics system metrics error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/analytics/log-action - Log supervisor action
router.post('/log-action', async (req, res) => {
  try {
    const { sessionId, action, details, timestamp } = req.body;
    
    if (!sessionId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and action are required'
      });
    }
    
    // Create analytics event
    const event = {
      event: action,
      properties: {
        timestamp: timestamp || new Date().toISOString(),
        sessionId,
        ...details,
        source: 'supervisor_action'
      }
    };
    
    // Store event
    analyticsStore.events.push(event);
    analyticsStore.metrics.totalEvents++;
    
    // Track session
    if (sessionId) {
      analyticsStore.sessions.set(sessionId, event.properties.timestamp);
      analyticsStore.metrics.uniqueSessions = analyticsStore.sessions.size;
    }
    
    console.log(`📊 Logged supervisor action: ${action}`);
    
    res.json({
      success: true,
      message: 'Action logged successfully',
      eventId: analyticsStore.events.length - 1
    });
    
  } catch (error) {
    console.error('Analytics log action error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/supervisor-ranking - Get supervisor performance ranking
router.get('/supervisor-ranking', async (req, res) => {
  try {
    const { timeRange = '24h', metric = 'activity' } = req.query;
    
    // Calculate time range
    const now = Date.now();
    let cutoffTime;
    switch (timeRange) {
      case '1h': cutoffTime = now - 60 * 60 * 1000; break;
      case '24h': cutoffTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': cutoffTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoffTime = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    // Filter events by time range
    const relevantEvents = analyticsStore.events.filter(
      event => new Date(event.properties.timestamp).getTime() > cutoffTime
    );
    
    // Group by supervisor
    const supervisorStats = {};
    relevantEvents.forEach(event => {
      const supervisorId = event.properties.supervisorId;
      if (!supervisorId) return;
      
      if (!supervisorStats[supervisorId]) {
        supervisorStats[supervisorId] = {
          supervisorId,
          supervisorName: event.properties.supervisorName || supervisorId,
          totalEvents: 0,
          alertsHandled: 0,
          responseTime: [],
          coordinationsSent: 0,
          handoversCreated: 0
        };
      }
      
      supervisorStats[supervisorId].totalEvents++;
      
      if (event.event === 'alert_dismissed') {
        supervisorStats[supervisorId].alertsHandled++;
      }
      if (event.event === 'supervisor_coordination') {
        supervisorStats[supervisorId].coordinationsSent++;
      }
      if (event.event === 'shift_handover') {
        supervisorStats[supervisorId].handoversCreated++;
      }
      if (event.properties.responseTime) {
        supervisorStats[supervisorId].responseTime.push(event.properties.responseTime);
      }
    });
    
    // Calculate rankings
    const rankings = Object.values(supervisorStats).map(stats => {
      const avgResponseTime = stats.responseTime.length > 0
        ? stats.responseTime.reduce((a, b) => a + b, 0) / stats.responseTime.length
        : 0;
      
      let score = 0;
      switch (metric) {
        case 'activity':
          score = stats.totalEvents;
          break;
        case 'alerts':
          score = stats.alertsHandled;
          break;
        case 'response_time':
          score = avgResponseTime > 0 ? 1000 / avgResponseTime : 0; // Inverse for ranking
          break;
        case 'coordination':
          score = stats.coordinationsSent;
          break;
        default:
          score = stats.totalEvents;
      }
      
      return {
        ...stats,
        averageResponseTime: Math.round(avgResponseTime),
        score,
        rank: 0 // Will be calculated below
      };
    });
    
    // Sort and assign ranks
    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((supervisor, index) => {
      supervisor.rank = index + 1;
    });
    
    res.json({
      success: true,
      ranking: {
        timeRange,
        metric,
        supervisors: rankings,
        period: {
          start: new Date(cutoffTime).toISOString(),
          end: new Date(now).toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Analytics supervisor ranking error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/analytics/clear - Clear analytics data (admin only)
router.delete('/clear', (req, res) => {
  try {
    // Reset analytics store
    analyticsStore.events = [];
    analyticsStore.sessions.clear();
    analyticsStore.metrics = {
      totalEvents: 0,
      uniqueSessions: 0,
      featureUsage: new Map(),
      alertInteractions: 0,
      errorCount: 0
    };

    console.log('🗑️ Analytics data cleared');
    
    res.json({ 
      success: true, 
      message: 'Analytics data cleared' 
    });
  } catch (error) {
    console.error('Analytics clear error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/analytics/trends - Get trending data
router.get('/trends', async (req, res) => {
  try {
    const { metric = 'events', period = '24h', granularity = 'hour' } = req.query;
    
    // Calculate time range
    const now = Date.now();
    let cutoffTime;
    switch (period) {
      case '1h': cutoffTime = now - 60 * 60 * 1000; break;
      case '24h': cutoffTime = now - 24 * 60 * 60 * 1000; break;
      case '7d': cutoffTime = now - 7 * 24 * 60 * 60 * 1000; break;
      case '30d': cutoffTime = now - 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffTime = now - 24 * 60 * 60 * 1000;
    }
    
    // Filter events by time range
    const relevantEvents = analyticsStore.events.filter(
      event => new Date(event.properties.timestamp).getTime() > cutoffTime
    );
    
    // Group by time period
    const timeGroups = {};
    relevantEvents.forEach(event => {
      const timestamp = new Date(event.properties.timestamp);
      let timeKey;
      
      switch (granularity) {
        case 'minute':
          timeKey = `${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}`;
          break;
        case 'hour':
          timeKey = `${timestamp.getHours()}:00`;
          break;
        case 'day':
          timeKey = timestamp.toISOString().split('T')[0];
          break;
        default:
          timeKey = `${timestamp.getHours()}:00`;
      }
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          timestamp: timeKey,
          events: 0,
          errors: 0,
          alertsHandled: 0,
          apiCalls: 0,
          uniqueSupervisors: new Set()
        };
      }
      
      timeGroups[timeKey].events++;
      
      if (event.event === 'system_error') {
        timeGroups[timeKey].errors++;
      }
      if (event.event === 'alert_dismissed') {
        timeGroups[timeKey].alertsHandled++;
      }
      if (event.event === 'api_call') {
        timeGroups[timeKey].apiCalls++;
      }
      if (event.properties.supervisorId) {
        timeGroups[timeKey].uniqueSupervisors.add(event.properties.supervisorId);
      }
    });
    
    // Convert to array and calculate final values
    const trends = Object.values(timeGroups)
      .map(group => ({
        timestamp: group.timestamp,
        events: group.events,
        errors: group.errors,
        alertsHandled: group.alertsHandled,
        apiCalls: group.apiCalls,
        uniqueSupervisors: group.uniqueSupervisors.size
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    
    res.json({
      success: true,
      trends: {
        metric,
        period,
        granularity,
        data: trends,
        summary: {
          totalPeriods: trends.length,
          totalEvents: trends.reduce((sum, t) => sum + t.events, 0),
          totalErrors: trends.reduce((sum, t) => sum + t.errors, 0),
          peakActivity: Math.max(...trends.map(t => t.events))
        }
      }
    });
    
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
