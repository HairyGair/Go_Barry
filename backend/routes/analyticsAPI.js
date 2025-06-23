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

export default router;
