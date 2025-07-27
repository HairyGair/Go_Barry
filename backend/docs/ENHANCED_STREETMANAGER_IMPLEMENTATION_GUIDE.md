# Enhanced StreetManager Route Impact Analysis System

## Implementation Guide for Go North East Bus Operations

### Overview

This comprehensive system transforms raw StreetManager webhook notifications into actionable disruption intelligence for Go North East's 231+ bus routes. The system provides:

- **Intelligent Route Matching**: Geographical analysis using GTFS data to identify affected bus routes
- **Severity Classification**: Multi-factor analysis to prioritize streetworks by operational impact
- **Advance Notice Processing**: Proactive notifications for future works allowing planning time
- **Supervisor Notifications**: Automated alerts for critical impacts requiring immediate attention
- **Memory Optimization**: Designed for 2GB RAM constraint on Render.com deployment

---

## Architecture Components

### 1. Database Schema (`enhanced_streetmanager_schema.sql`)

**Core Tables:**
- `streetworks_enhanced`: Main streetworks table with route impact analysis
- `route_impacts`: Detailed analysis of how each streetwork affects specific routes
- `supervisor_notifications`: Notification management and delivery tracking
- `route_analysis_cache`: Performance cache for geographical queries
- `severity_classification_rules`: Configurable classification logic

**Key Features:**
- PostGIS spatial indexing for efficient geographical queries
- Automated triggers to maintain data consistency
- Built-in performance monitoring and cleanup functions
- Views for dashboard integration

### 2. Route Impact Analyzer (`enhancedRouteImpactAnalyzer.js`)

**Capabilities:**
- Loads GTFS route and stop data for North East England
- Performs geographical proximity analysis (configurable radius)
- Calculates confidence scores for route matches
- Memory-optimized with LRU cache (max 100 entries)
- Supports coordinate extraction from various StreetManager formats

**Geographic Bounds:**
```javascript
{
  north: 55.811,  // Berwick-upon-Tweed
  south: 54.400,  // Bishop Auckland  
  east: -1.200,   // Coast
  west: -2.800    // Pennines
}
```

### 3. Severity Classifier (`streetManagerSeverityClassifier.js`)

**Classification Factors:**
- Work category (emergency, major, standard, minor)
- Traffic management type (road closure, signals, lane closure)
- Location importance (major corridors, city centers, transport hubs)
- Timing sensitivity (peak hours, school terms, weekends)
- Emergency status and urgent indicators

**Severity Levels:**
- **CRITICAL**: Emergency works, road closures, major works in progress
- **HIGH**: Multi-way signals, major category works, lane closures on main routes
- **MEDIUM**: Traffic-sensitive works, standard category works
- **LOW**: Minor works with minimal impact

### 4. Enhanced Processor (`enhancedStreetManagerProcessor.js`)

**Processing Pipeline:**
1. Validate webhook notification data
2. Apply geographic and event type filters
3. Extract and normalize streetwork data
4. Perform severity classification
5. Analyze route impacts using GTFS data
6. Save enhanced data to database
7. Create supervisor notifications if required
8. Update processing statistics

**Memory Management:**
- Queue size limits (50 items max)
- Automatic cache cleanup on memory pressure
- Streaming GTFS data processing
- Cleanup callbacks registered with memory monitor

### 5. Notification System (`supervisorNotificationSystem.js`)

**Notification Types:**
- `ROUTE_CLOSURE`: Complete road closures requiring diversions
- `CRITICAL_IMPACT`: High-severity disruptions
- `DIVERSION_REQUIRED`: Works requiring route changes
- `ADVANCE_WARNING`: Future works with planning time
- `EMERGENCY_WORKS`: Immediate emergency interventions

**Delivery Methods:**
- Dashboard alerts (real-time via Supabase)
- Email notifications (configurable)
- SMS alerts for critical issues (configurable)
- Microsoft Teams integration (configurable)

---

## Installation and Setup

### 1. Database Setup

```sql
-- Run the enhanced schema
\i backend/sql/enhanced_streetmanager_schema.sql

-- Verify tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename LIKE '%streetworks%' OR tablename LIKE '%route%';
```

### 2. Environment Variables

Add to your `.env` file:

```bash
# Enhanced StreetManager Configuration
STREETMANAGER_ENHANCED_ENABLED=true
STREETMANAGER_WEBHOOK_URL=https://yourapp.render.com/api/streetmanager/enhanced/webhook

# Optional notification services
EMAIL_SERVICE_CONFIGURED=false
SMS_SERVICE_CONFIGURED=false
TEAMS_WEBHOOK_URL=

# Performance tuning
ROUTE_CACHE_SIZE=100
NOTIFICATION_QUEUE_SIZE=100
```

### 3. Backend Integration

Update your main server file to include the enhanced routes:

```javascript
// In backend/index.js
import enhancedStreetManagerAPI from './routes/enhancedStreetManagerAPI.js';
import enhancedStreetManagerWebhook from './routes/enhancedStreetManagerWebhook.js';

// Add routes
app.use('/api/streetmanager/enhanced', enhancedStreetManagerAPI);
app.use('/api/streetmanager/enhanced/webhook', enhancedStreetManagerWebhook);
```

### 4. GTFS Data Preparation

Ensure your GTFS data files are in `backend/data/`:
- `routes.txt`: Bus route definitions
- `stops.txt`: Bus stop locations with coordinates
- `trips.txt`: Trip to route mappings
- `stop_times.txt`: Stop-route relationships

The system automatically filters to North East England coordinates.

---

## API Endpoints

### System Status
```bash
GET /api/streetmanager/enhanced/status
```
Returns comprehensive system status including analyzer and classifier states.

### Active Critical Streetworks
```bash
GET /api/streetmanager/enhanced/active-critical
```
Returns high-impact streetworks requiring supervisor attention.

### Route-Specific Disruptions
```bash
GET /api/streetmanager/enhanced/route-disruptions/21
```
Returns upcoming disruptions for a specific route (e.g., Service 21).

### Routes Summary
```bash
GET /api/streetmanager/enhanced/routes-summary?days=7
```
Returns summary of upcoming disruptions across all routes.

### Manual Location Analysis
```bash
POST /api/streetmanager/enhanced/analyze-location
Content-Type: application/json

{
  "latitude": 54.9783,
  "longitude": -1.6178,
  "radius_meters": 300,
  "description": "Grey Street Newcastle"
}
```

### Search Streetworks
```bash
GET /api/streetmanager/enhanced/search?route_number=21&severity=HIGH&days=30
```

### Pending Notifications
```bash
GET /api/streetmanager/enhanced/notifications/pending
```

### Performance Analytics
```bash
GET /api/streetmanager/enhanced/analytics/performance?days=7
```

---

## Dashboard Integration

### Real-time Critical Alerts

```javascript
// React component for critical alerts
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

function CriticalAlertsWidget() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Fetch initial data
    fetchCriticalAlerts();

    // Subscribe to real-time updates
    const subscription = supabase
      .from('active_critical_streetworks')
      .on('*', () => fetchCriticalAlerts())
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, []);

  const fetchCriticalAlerts = async () => {
    const { data } = await supabase
      .from('active_critical_streetworks')
      .select('*')
      .order('proposed_start_date');
    setAlerts(data || []);
  };

  return (
    <div className="critical-alerts">
      {alerts.map(alert => (
        <div key={alert.id} className={`alert ${alert.impact_severity.toLowerCase()}`}>
          <h4>{alert.title}</h4>
          <p>{alert.location_description}</p>
          <div className="routes">
            Affected Routes: {alert.affected_route_numbers.join(', ')}
          </div>
          <div className="timing">
            {new Date(alert.proposed_start_date).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Route-Specific Impact Display

```javascript
// Component for route-specific disruption view
function RouteDisruptionView({ routeNumber }) {
  const [disruptions, setDisruptions] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchRouteDisruptions();
  }, [routeNumber]);

  const fetchRouteDisruptions = async () => {
    const response = await fetch(`/api/streetmanager/enhanced/route-disruptions/${routeNumber}`);
    const data = await response.json();
    
    if (data.success) {
      setDisruptions(data.data);
      setSummary(data.summary);
    }
  };

  return (
    <div className="route-disruptions">
      <div className="summary">
        <h3>Service {routeNumber} - Upcoming Disruptions</h3>
        <div className="stats">
          <span>Total: {summary.total_disruptions}</span>
          <span>Critical: {summary.critical_count}</span>
          <span>Diversions: {summary.diversions_required}</span>
          <span>Est. Delay: {summary.total_estimated_delay} min</span>
        </div>
      </div>
      
      <div className="disruptions-list">
        {disruptions.map(disruption => (
          <DisruptionCard key={disruption.id} disruption={disruption} />
        ))}
      </div>
    </div>
  );
}
```

---

## Operational Workflows

### For Supervisors

1. **Morning Briefing**: Check `/active-critical` for today's critical impacts
2. **Route Planning**: Review `/routes-summary` for upcoming disruptions
3. **Service Monitoring**: Monitor real-time notifications for new critical alerts
4. **Incident Response**: Use manual location analysis for unplanned disruptions

### For Control Room

1. **Dashboard Integration**: Real-time critical alerts on main display
2. **Route Status**: Individual route disruption views
3. **Performance Monitoring**: Analytics dashboard for system effectiveness
4. **Historical Analysis**: Search and filter past streetworks for planning

### For Management

1. **Weekly Reports**: Performance analytics and impact summaries
2. **Trend Analysis**: Historical data for service planning
3. **System Health**: Monitor processing statistics and accuracy
4. **Operational Insights**: Route vulnerability analysis

---

## Performance Optimization

### Memory Management

The system is designed for Render.com's 2GB RAM limit:

- **GTFS Data Sampling**: Loads representative sample of stop_times data
- **LRU Caches**: Automatic eviction of old cache entries
- **Queue Limits**: Processing queues limited to prevent memory bloat
- **Memory Callbacks**: Automatic cleanup during memory pressure

### Database Optimization

- **Spatial Indexes**: PostGIS indexes for geographical queries
- **Partial Indexes**: Filtered indexes on commonly queried columns
- **Automated Cleanup**: Functions to archive old completed works
- **View Materialization**: Pre-computed views for dashboard queries

### API Performance

- **Response Caching**: Cache frequently requested data
- **Pagination**: Limit result set sizes
- **Selective Fields**: Only return required data fields
- **Async Processing**: Background processing for heavy operations

---

## Monitoring and Maintenance

### Health Checks

```bash
# System status
curl https://yourapp.render.com/api/streetmanager/enhanced/webhook/health

# Performance metrics
curl https://yourapp.render.com/api/streetmanager/enhanced/analytics/performance
```

### Database Maintenance

```sql
-- Clean up old completed works (run weekly)
SELECT archive_old_streetworks(90); -- 90 days retention

-- Clean up expired cache entries (run daily)
SELECT cleanup_expired_cache();

-- Check system performance
SELECT * FROM streetmanager_performance ORDER BY created_at DESC LIMIT 10;
```

### Log Monitoring

Key log patterns to monitor:

- `📨 Processing StreetManager notification` - Webhook received
- `✅ Route analysis complete` - Successful processing
- `📢 Supervisor notification created` - Critical alert sent
- `🧹 Emergency cleanup` - Memory pressure response

---

## Testing and Validation

### Test Webhook Processing

```bash
curl -X POST https://yourapp.render.com/api/streetmanager/enhanced/webhook/test \
  -H "Content-Type: application/json" \
  -d '{
    "test_data": {
      "object_type": "ACTIVITY",
      "event_type": "work_started",
      "object_reference": "TEST123",
      "work_category": "major",
      "traffic_management_type": "road_closure",
      "location_description": "Grey Street, Newcastle",
      "latitude": 54.9783,
      "longitude": -1.6178,
      "proposed_start_date": "2025-08-01T08:00:00Z"
    }
  }'
```

### Manual Location Analysis

```bash
curl -X POST https://yourapp.render.com/api/streetmanager/enhanced/analyze-location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 54.9783,
    "longitude": -1.6178,
    "radius_meters": 300,
    "description": "Test location analysis"
  }'
```

### Validate Route Matching

```bash
# Check specific route disruptions
curl https://yourapp.render.com/api/streetmanager/enhanced/route-disruptions/21

# Check overall system status
curl https://yourapp.render.com/api/streetmanager/enhanced/status
```

---

## Troubleshooting

### Common Issues

1. **No Routes Found**: 
   - Check GTFS data files are present in `backend/data/`
   - Verify coordinates are within North East England bounds
   - Check analyzer initialization logs

2. **Low Confidence Scores**:
   - Verify coordinate accuracy in StreetManager data
   - Check if location is near bus stops
   - Review geographical bounds configuration

3. **Missing Notifications**:
   - Check severity classification rules
   - Verify supervisor preferences are loaded
   - Check notification system initialization

4. **Memory Issues**:
   - Monitor queue sizes in status endpoint
   - Check memory cleanup callbacks are registered
   - Review cache size configurations

### Performance Tuning

```javascript
// Adjust cache sizes for memory constraints
const routeImpactAnalyzer = {
  cacheMaxSize: 50, // Reduce if memory limited
  gtfsDataSampling: 0.1 // Sample 10% of GTFS data
};

const notificationSystem = {
  maxQueueSize: 25, // Reduce notification queue
  templateCaching: true // Enable template caching
};
```

---

## Future Enhancements

### Planned Features

1. **Machine Learning**: Predictive impact assessment based on historical data
2. **Dynamic Routing**: Real-time diversion suggestions
3. **Passenger Communication**: Integration with passenger information systems
4. **Mobile Alerts**: Push notifications to supervisor mobile apps
5. **Advanced Analytics**: Route vulnerability heat maps and trend analysis

### Integration Opportunities

1. **BODS Integration**: Real-time bus location data for impact validation
2. **Weather Data**: Enhanced severity classification based on weather conditions
3. **Event Management**: Integration with major events and festivals
4. **TomTom Enhanced**: Real-time traffic flow validation
5. **Passenger Apps**: Direct passenger notifications for affected routes

---

## Summary

This Enhanced StreetManager Route Impact Analysis System provides Go North East with:

- **Proactive Intelligence**: Advance warning of route impacts with planning time
- **Operational Efficiency**: Automated analysis replacing manual route checking
- **Risk Management**: Severity-based prioritization of disruptions
- **Supervisor Support**: Intelligent notifications for critical impacts
- **Scalable Architecture**: Memory-optimized for 231+ routes within 2GB constraint

The system transforms reactive disruption management into proactive service planning, enabling supervisors to maintain service quality and minimize passenger impact through intelligent advance warning and automated route impact analysis.

**Contact**: For implementation support or system questions, refer to the Go BARRY technical documentation or the system status endpoints for real-time health monitoring.