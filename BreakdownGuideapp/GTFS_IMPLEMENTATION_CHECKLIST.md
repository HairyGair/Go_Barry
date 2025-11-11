# GTFS Feature Implementation - Quick Start Checklist

**System:** Go BARRY Breakdown Management System
**Date:** November 10, 2025
**Memory Limit:** 2GB RAM (Critical Constraint)

---

## Pre-Implementation Setup (Required for ALL Features)

### Database Schema Changes

```bash
# Connect to MySQL
mysql -h 85.234.151.224 -u gobarryco_Gair -p gobarryco_breakdowns
```

```sql
-- 1. Add route_id to breakdowns table (CRITICAL DEPENDENCY)
ALTER TABLE breakdowns ADD COLUMN route_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_route_id (route_id);
ALTER TABLE breakdowns ADD INDEX idx_status_route (status, route_id);

-- 2. Add spatial indexes for stop proximity queries
ALTER TABLE gtfs_stops
  ADD COLUMN location POINT GENERATED ALWAYS AS (POINT(stop_lon, stop_lat)) STORED;
CREATE SPATIAL INDEX idx_stop_location_spatial ON gtfs_stops(location);

-- 3. Optimize breakdowns location queries
ALTER TABLE breakdowns
  ADD COLUMN location_point POINT GENERATED ALWAYS AS
    (POINT(location_lng, location_lat)) STORED;
CREATE SPATIAL INDEX idx_breakdown_location ON breakdowns(location_point);

-- 4. Add composite index for GTFS time queries
ALTER TABLE gtfs_stop_times
  ADD INDEX idx_trip_stop_time (trip_id, stop_id, departure_time);

-- 5. Verify indexes created
SHOW INDEX FROM breakdowns WHERE Key_name LIKE 'idx_%';
SHOW INDEX FROM gtfs_stops WHERE Key_name LIKE 'idx_%';
```

### Backend Code Setup

```bash
cd /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend

# Install any missing dependencies
npm install node-cache --save
```

### Memory Monitoring Setup

Add to `backend/server.js`:

```javascript
// Memory monitoring endpoint
app.get('/api/system/memory', (req, res) => {
  const used = process.memoryUsage();
  const mb = (bytes) => Math.round(bytes / 1024 / 1024);

  res.json({
    rss: mb(used.rss),
    heapUsed: mb(used.heapUsed),
    available: 2048 - mb(used.rss),
    warning: mb(used.rss) > 1800
  });
});

// Auto-restart on memory limit
setInterval(() => {
  const usedMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  if (usedMB > 1900) {
    console.error('Memory limit exceeded, restarting...');
    process.exit(1);
  }
}, 60000);
```

---

## Phase 1: Foundation Features (Weeks 1-4)

### Week 1: Live Route Status Dashboard

**Files to Create:**
- `backend/routes/routeStatus.js` (see GTFS_FEATURE_ARCHITECTURE_REVIEW.md line 485)
- `backend/services/routeStatusService.js`
- `frontend/src/pages/RouteStatusDashboard.jsx`

**Database:**
```sql
CREATE TABLE route_status_cache (
  route_id VARCHAR(100) PRIMARY KEY,
  status ENUM('green', 'amber', 'red') NOT NULL,
  active_breakdowns INT DEFAULT 0,
  last_breakdown_time TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

**API Endpoints:**
- `GET /api/routes/status/live`
- WebSocket: `ws://api/ws/route-status`

**Testing Checklist:**
- [ ] Route status query completes in <100ms
- [ ] WebSocket broadcasts within 10 seconds of breakdown
- [ ] Memory usage <50MB total
- [ ] All 231 routes display correctly

**Memory Budget:** 8MB

---

### Week 2: Route Coverage Analysis

**Files to Create:**
- `backend/services/routeCoverageAnalyzer.js`
- `backend/jobs/route-coverage.js` (cron job)
- `backend/routes/routeCoverage.js`
- `frontend/src/pages/RouteCoverageDashboard.jsx`

**Database:**
```sql
CREATE TABLE route_coverage_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  route_id VARCHAR(100) NOT NULL,
  total_stops INT NOT NULL,
  affected_stops INT DEFAULT 0,
  coverage_percentage DECIMAL(5, 2) NOT NULL,
  service_status ENUM('normal', 'degraded', 'critical', 'suspended') NOT NULL,
  alternative_routes JSON DEFAULT NULL,
  recommendations TEXT,
  INDEX idx_route_id (route_id)
) ENGINE=InnoDB;

CREATE TABLE route_overlaps (
  route_id_a VARCHAR(100) NOT NULL,
  route_id_b VARCHAR(100) NOT NULL,
  shared_stops INT NOT NULL,
  overlap_percentage DECIMAL(5, 2) NOT NULL,
  PRIMARY KEY (route_id_a, route_id_b)
) ENGINE=InnoDB;
```

**PM2 Cron Job:**
```javascript
// ecosystem.config.js
{
  name: 'route-coverage-analyzer',
  script: './jobs/route-coverage.js',
  cron_restart: '*/15 * * * *',
  autorestart: false,
  max_memory_restart: '500M'
}
```

**API Endpoints:**
- `GET /api/routes/coverage/analysis`
- `GET /api/routes/:routeId/alternatives`

**Testing Checklist:**
- [ ] Batch analysis completes in <60 seconds
- [ ] API response <100ms (cached)
- [ ] Memory usage <100MB during batch job
- [ ] Identifies 95%+ of coverage gaps

**Memory Budget:** 92MB (peak during batch processing)

---

### Weeks 3-4: Dynamic Spare Vehicle Allocation

**Files to Create:**
- `backend/services/spareAllocation.js` (see GTFS_FEATURE_ARCHITECTURE_REVIEW.md line 1080)
- `backend/routes/spares.js`
- `frontend/src/pages/SpareAllocationDashboard.jsx`

**Database:**
```sql
CREATE TABLE spare_vehicles (
  fleet_no VARCHAR(50) PRIMARY KEY,
  depot VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(100),
  current_status ENUM('available', 'assigned', 'in_transit', 'unavailable') DEFAULT 'available',
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  assigned_to_breakdown_id VARCHAR(100),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_depot (depot),
  INDEX idx_status (current_status)
) ENGINE=InnoDB;

CREATE TABLE spare_allocation_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(100) NOT NULL,
  recommended_spare_fleet_no VARCHAR(50) NOT NULL,
  recommendation_reason TEXT,
  distance_km DECIMAL(8, 2),
  estimated_arrival_minutes INT,
  priority_score DECIMAL(5, 2),
  recommendation_status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB;
```

**API Endpoints:**
- `GET /api/spares/available`
- `POST /api/spares/allocate`
- `GET /api/spares/recommendations/active`

**Testing Checklist:**
- [ ] Allocation calculation <100ms per breakdown
- [ ] WebSocket notification sent within 10 seconds
- [ ] 90%+ accuracy for compatible vehicle types
- [ ] Memory usage <50MB

**Memory Budget:** 25MB

---

## Phase 2: Optimization & Intelligence (Weeks 5-8)

### Weeks 5-6: Stop-Level Incident Heatmap

**Files to Create:**
- `backend/services/stopHeatmapService.js`
- `backend/jobs/stop-cluster-generator.js` (background job)
- `backend/routes/stopHeatmap.js`
- `frontend/src/pages/StopHeatmapDashboard.jsx` (Leaflet.js integration)

**Database:**
```sql
CREATE TABLE stop_breakdown_clusters (
  stop_id VARCHAR(100) PRIMARY KEY,
  stop_name VARCHAR(255),
  stop_lat DECIMAL(10, 8),
  stop_lon DECIMAL(11, 8),
  breakdown_count_24h INT DEFAULT 0,
  breakdown_count_7d INT DEFAULT 0,
  last_breakdown_time TIMESTAMP NULL,
  severity_max ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Add nearest_stop_id to breakdowns
ALTER TABLE breakdowns ADD COLUMN nearest_stop_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_nearest_stop (nearest_stop_id);
```

**Background Job Setup:**
```javascript
// jobs/stop-cluster-generator.js
// Runs every 5 minutes, pre-computes clusters
// Uses sp_find_nearest_stops() stored procedure
```

**API Endpoints:**
- `GET /api/breakdowns/heatmap`
- `GET /api/stops/nearby/:lat/:lng`

**Testing Checklist:**
- [ ] Heatmap query <500ms (cached)
- [ ] Background job completes in <30 seconds
- [ ] Memory usage <100MB
- [ ] Frontend renders 500 markers in <1 second

**Memory Budget:** 75MB

**⚠️ Important:** This feature has highest memory risk. Monitor closely.

---

### Weeks 7-8: Smart Engineer Dispatch

**Files to Create:**
- `backend/services/engineerDispatch.js`
- `backend/routes/engineerDispatch.js`
- `frontend/src/pages/EngineerDispatchDashboard.jsx`

**Database:**
```sql
-- Enhance existing engineers table
ALTER TABLE engineers ADD COLUMN skills JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN certifications JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN vehicle_type_expertise JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN current_location_lat DECIMAL(10, 8);
ALTER TABLE engineers ADD COLUMN current_location_lng DECIMAL(11, 8);

CREATE TABLE engineer_dispatch_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(100) NOT NULL,
  engineer_id INT NOT NULL,
  recommendation_score DECIMAL(5, 2) NOT NULL,
  skill_match_score DECIMAL(5, 2),
  distance_score DECIMAL(5, 2),
  distance_km DECIMAL(8, 2),
  estimated_arrival_minutes INT,
  recommendation_status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB;
```

**API Endpoints:**
- `POST /api/engineering/dispatch/recommend`
- `POST /api/engineering/dispatch/assign`

**Testing Checklist:**
- [ ] Dispatch calculation <200ms per breakdown
- [ ] WebSocket notification sent to engineer
- [ ] 80%+ engineer acceptance rate
- [ ] Memory usage <50MB

**Memory Budget:** 25MB

---

## Phase 3: Prediction & Analysis (Weeks 9-13)

### ⚠️ Prerequisites for Phase 3

**Data Collection Requirements:**
- [ ] 3+ months of breakdown history with route_id populated
- [ ] All historical breakdowns have accurate timestamps
- [ ] Route coverage data available from Phase 1-2

**If Prerequisites Not Met:** Continue data collection, defer Phase 3 by 2-3 months.

---

### Weeks 9-10: Predictive Route Alerts

**Files to Create:**
- `backend/services/routePredictionEngine.js`
- `backend/jobs/train-prediction-models.js` (monthly batch job)
- `backend/routes/routePredictions.js`
- `frontend/src/pages/PredictiveAlertsDashboard.jsx`

**Database:**
```sql
CREATE TABLE route_prediction_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL,
  day_of_week INT NOT NULL,
  historical_breakdown_count INT DEFAULT 0,
  total_trips_analyzed INT DEFAULT 0,
  breakdown_probability DECIMAL(5, 2) NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL,
  last_trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_route_time (route_id, time_of_day_hour, day_of_week)
) ENGINE=InnoDB;

CREATE TABLE route_prediction_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  contributing_factors JSON DEFAULT NULL,
  actual_breakdown_occurred BOOLEAN DEFAULT FALSE,
  alert_accuracy DECIMAL(5, 2) NULL,
  INDEX idx_route_id (route_id)
) ENGINE=InnoDB;
```

**Training Job:**
```javascript
// ecosystem.config.js
{
  name: 'prediction-model-trainer',
  script: './jobs/train-prediction-models.js',
  cron_restart: '0 2 * * 0', // Weekly at 2 AM Sunday
  autorestart: false,
  max_memory_restart: '500M'
}
```

**API Endpoints:**
- `GET /api/routes/predictions/live`
- `POST /api/routes/predictions/train` (admin only)

**Testing Checklist:**
- [ ] Model training completes in <5 minutes
- [ ] Prediction accuracy >60% (initial baseline)
- [ ] False positive rate <20%
- [ ] Memory usage <250MB during training

**Memory Budget:** 225MB

---

### Weeks 11-12: Seasonal Risk Profiles

**Files to Create:**
- `backend/services/seasonalAnalyzer.js`
- `backend/jobs/seasonal-analysis.js` (monthly batch job)
- `backend/routes/seasonalRisk.js`
- `frontend/src/pages/SeasonalRiskDashboard.jsx`

**Database:**
```sql
CREATE TABLE seasonal_risk_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season ENUM('winter', 'spring', 'summer', 'autumn') NOT NULL,
  defect_category VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(100),
  baseline_breakdown_rate DECIMAL(5, 2) NOT NULL,
  seasonal_adjustment_factor DECIMAL(5, 2) NOT NULL,
  sample_size INT NOT NULL,
  confidence_level DECIMAL(5, 2),
  last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_season_defect (season, defect_category)
) ENGINE=InnoDB;
```

**API Endpoints:**
- `GET /api/analytics/seasonal-risk`
- `GET /api/analytics/seasonal-trends`

**Testing Checklist:**
- [ ] Analysis completes in <10 minutes
- [ ] API response <50ms (cached)
- [ ] Identifies 80%+ of seasonal trends
- [ ] Memory usage <200MB during analysis

**Memory Budget:** 165MB

---

### Week 13: Passenger Impact Assessment

**Files to Create:**
- `backend/services/passengerImpactCalculator.js`
- `backend/jobs/passenger-averages-calculator.js`
- Integrate into existing breakdown creation workflow

**Database:**
```sql
CREATE TABLE route_passenger_averages (
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL,
  day_of_week INT NOT NULL,
  avg_passengers_per_trip DECIMAL(5, 2) NOT NULL,
  sample_size INT NOT NULL,
  PRIMARY KEY (route_id, time_of_day_hour, day_of_week)
) ENGINE=InnoDB;

CREATE TABLE route_frequency_cache (
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL,
  day_of_week INT NOT NULL,
  trips_per_hour INT NOT NULL,
  avg_passengers_per_trip DECIMAL(5, 2) NOT NULL,
  PRIMARY KEY (route_id, time_of_day_hour, day_of_week)
) ENGINE=InnoDB;

-- Add passenger impact to breakdowns
ALTER TABLE breakdowns ADD COLUMN estimated_passengers_affected INT DEFAULT 0;
ALTER TABLE breakdowns ADD COLUMN trips_affected_count INT DEFAULT 0;
```

**API Endpoints:**
- `GET /api/breakdowns/:id/passenger-impact`

**Testing Checklist:**
- [ ] Impact calculation <500ms
- [ ] 70%+ accuracy for passenger estimates
- [ ] Memory usage <100MB per calculation
- [ ] Auto-calculates on breakdown creation

**Memory Budget:** 70MB

---

## Phase 4: Accessibility & Integration (Weeks 14-16)

### Weeks 14-15: Stop Accessibility Matching

**Files to Create:**
- `backend/services/accessibilityChecker.js`
- `backend/routes/accessibility.js`
- `frontend/src/pages/AccessibilityDashboard.jsx`

**Database:**
```sql
-- Add accessibility to fleet
ALTER TABLE fleet_vehicles ADD COLUMN wheelchair_accessible BOOLEAN DEFAULT FALSE;

-- Track accessibility in breakdowns
ALTER TABLE breakdowns ADD COLUMN vehicle_wheelchair_accessible BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN accessibility_impact ENUM('none', 'minor', 'major', 'critical') DEFAULT 'none';

CREATE TABLE accessibility_gap_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(100) NOT NULL,
  route_id VARCHAR(100) NOT NULL,
  affected_stops_count INT DEFAULT 0,
  affected_stops JSON DEFAULT NULL,
  alert_severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_breakdown_id (breakdown_id)
) ENGINE=InnoDB;
```

**API Endpoints:**
- `GET /api/accessibility/gaps/live`
- `POST /api/accessibility/check-breakdown`

**Testing Checklist:**
- [ ] Accessibility check <200ms
- [ ] 100% detection rate for wheelchair vehicle breakdowns
- [ ] Alerts generated within 10 seconds
- [ ] Memory usage <20MB

**Memory Budget:** 13MB

---

### Week 16: Public GTFS-RT API (Replaces Passenger Notifications)

**Files to Create:**
- `backend/routes/gtfsRealtime.js`
- `backend/services/gtfsRealtimeGenerator.js`
- Public WebSocket endpoint for third-party apps

**Database:**
```sql
-- Track API usage
CREATE TABLE gtfs_rt_api_access_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  api_key VARCHAR(100),
  endpoint VARCHAR(255),
  ip_address VARCHAR(50),
  request_count INT DEFAULT 1,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key)
) ENGINE=InnoDB;
```

**API Endpoints:**
- `GET /api/gtfs-rt/trip-updates` (GTFS-Realtime format)
- `GET /api/gtfs-rt/vehicle-positions`
- `GET /api/gtfs-rt/service-alerts`
- WebSocket: `ws://api/ws/gtfs-rt` (public)

**Testing Checklist:**
- [ ] GTFS-RT feed validates against spec
- [ ] Updates every 30 seconds
- [ ] Memory usage <50MB
- [ ] Rate limiting: 60 requests/minute per API key

**Memory Budget:** 40MB

---

## Memory Budget Summary

| Feature | Memory (MB) | Status |
|---------|-------------|--------|
| Route Status | 8 | ✅ |
| Coverage Analysis | 92 | ✅ |
| Spare Allocation | 25 | ✅ |
| Stop Heatmap | 75 | ⚠️ |
| Engineer Dispatch | 25 | ✅ |
| Predictive Alerts | 225 | ⚠️ |
| Seasonal Risk | 165 | ⚠️ |
| Passenger Impact | 70 | ⚠️ |
| Accessibility | 13 | ✅ |
| GTFS-RT API | 40 | ✅ |
| **Total Peak** | **738 MB** | ✅ Within 2GB limit |
| **Baseline + Buffer** | **380 MB + 930 MB** | ✅ Safe |

**Note:** Not all features run simultaneously. Background jobs (seasonal analysis, prediction training) run during off-peak hours.

---

## Deployment Checklist

### Before Each Feature Launch

- [ ] Code reviewed and tested locally
- [ ] Memory usage monitored (`/api/system/memory`)
- [ ] Database migrations applied to production
- [ ] PM2 ecosystem config updated (if cron jobs added)
- [ ] Frontend build and deployed to cPanel
- [ ] Backend restarted: `pm2 restart breakdown-backend`
- [ ] Smoke tests passed (API responses, WebSocket connectivity)
- [ ] Documentation updated in CLAUDE.md

### Post-Launch Monitoring (First 48 Hours)

- [ ] Check PM2 logs: `pm2 logs breakdown-backend --lines 200`
- [ ] Monitor memory: `curl https://api.breakdowns.gobarry.co.uk/api/system/memory`
- [ ] Check database load: `SHOW PROCESSLIST;` in MySQL
- [ ] Test WebSocket broadcasts: Open SDC Dashboard and create test breakdown
- [ ] Verify caching working: Check response times decrease on repeat requests
- [ ] Review error logs: Look for query timeouts or memory warnings

---

## Rollback Procedures

### If Memory Limit Exceeded

```bash
# 1. Identify memory-heavy feature
pm2 logs breakdown-backend | grep -i memory

# 2. Temporarily disable feature
# Edit server.js, comment out route:
# app.use('/api/routes/predictions', predictiveAlerts);

# 3. Restart
pm2 restart breakdown-backend

# 4. Investigate and optimize
# - Add pagination to queries
# - Increase cache TTL to reduce re-computation
# - Move to background job if real-time not critical
```

### If Database Queries Slow

```sql
-- Check slow queries
SHOW FULL PROCESSLIST;

-- Check missing indexes
EXPLAIN SELECT ... FROM ...;

-- Add missing index
CREATE INDEX idx_missing_column ON table_name(column_name);

-- Analyze table statistics
ANALYZE TABLE breakdowns;
```

### If WebSocket Overload

```javascript
// Limit concurrent WebSocket connections
// backend/routes/webSocketHandler.js
const MAX_CONNECTIONS = 50;

wss.on('connection', (ws) => {
  if (wss.clients.size > MAX_CONNECTIONS) {
    ws.close(1008, 'Server at capacity');
    return;
  }
  // ... rest of connection handling
});
```

---

## Success Metrics Tracking

### Week 1 After Each Feature Launch

**Measure:**
- API response times (p95, p99)
- Memory usage (avg, peak)
- Database query times
- WebSocket latency
- Error rates
- User feedback

**Adjust If:**
- p95 response time >500ms → Add caching or indexes
- Memory usage >1.8GB → Optimize queries, reduce cache size
- Database queries >200ms → Add indexes, rewrite queries
- WebSocket latency >100ms → Check connection count
- Error rate >1% → Investigate logs, fix bugs

---

## Contact & Support

**Developer:** Anthony Gair (anthony.gair@gonortheast.co.uk)
**Documentation:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/GTFS_FEATURE_ARCHITECTURE_REVIEW.md`
**Codebase:** `/Users/anthony/Go BARRY App/BreakdownGuideapp/`

**For Issues:**
1. Check PM2 logs: `pm2 logs breakdown-backend`
2. Check memory: `/api/system/memory`
3. Review documentation: `GTFS_FEATURE_ARCHITECTURE_REVIEW.md`
4. Contact developer with logs and error details

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Status:** Ready for Phase 1 Implementation
