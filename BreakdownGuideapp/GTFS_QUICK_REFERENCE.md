# GTFS Features - Quick Reference Card

**System:** Go BARRY Breakdown Management
**Date:** November 10, 2025
**Memory Limit:** 2GB RAM (Critical)

---

## Feature Feasibility Summary

| # | Feature | Status | Memory | Query Time | Phase | Weeks |
|---|---------|--------|--------|------------|-------|-------|
| 1 | Live Route Status Dashboard | ✅ **READY** | 8 MB | 50ms | 1 | 1 |
| 2 | Route Coverage Analysis | ✅ **READY** | 92 MB | 50ms | 1 | 2 |
| 3 | Dynamic Spare Allocation | ✅ **READY** | 25 MB | 100ms | 1 | 3-4 |
| 4 | Stop-Level Heatmap | ⚠️ **CAUTION** | 75 MB | 500ms | 2 | 5-6 |
| 5 | Smart Engineer Dispatch | ✅ **READY** | 25 MB | 200ms | 2 | 7-8 |
| 6 | Predictive Route Alerts | ⚠️ **DEFER** | 225 MB | 200ms | 3 | 9-10 |
| 7 | Seasonal Risk Profiles | ✅ **READY** | 165 MB | 50ms | 3 | 11-12 |
| 8 | Passenger Impact | ⚠️ **CAUTION** | 70 MB | 1s | 3 | 13 |
| 9 | Stop Accessibility | ✅ **READY** | 13 MB | 100ms | 4 | 14-15 |
| 10 | Passenger Notifications | ❌ **NOT RECOMMENDED** | 300 MB | - | - | - |

**Legend:**
- ✅ **READY:** Implement as planned, low risk
- ⚠️ **CAUTION:** Requires careful memory monitoring
- ⚠️ **DEFER:** Wait for 3+ months of data collection
- ❌ **NOT RECOMMENDED:** Too complex for current infrastructure

---

## Critical Actions (Do These First)

### 1. Database Schema (REQUIRED for all features)

```sql
-- Add route_id to breakdowns (MOST CRITICAL)
ALTER TABLE breakdowns ADD COLUMN route_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_route_id (route_id);
ALTER TABLE breakdowns ADD INDEX idx_status_route (status, route_id);

-- Add spatial indexes
ALTER TABLE gtfs_stops
  ADD COLUMN location POINT GENERATED ALWAYS AS (POINT(stop_lon, stop_lat)) STORED;
CREATE SPATIAL INDEX idx_stop_location_spatial ON gtfs_stops(location);

ALTER TABLE breakdowns
  ADD COLUMN location_point POINT GENERATED ALWAYS AS
    (POINT(location_lng, location_lat)) STORED;
CREATE SPATIAL INDEX idx_breakdown_location ON breakdowns(location_point);

-- Optimize GTFS queries
ALTER TABLE gtfs_stop_times
  ADD INDEX idx_trip_stop_time (trip_id, stop_id, departure_time);
```

### 2. Memory Monitoring (REQUIRED)

Add to `backend/server.js`:

```javascript
// Memory monitoring endpoint
app.get('/api/system/memory', (req, res) => {
  const used = process.memoryUsage();
  const mb = (bytes) => Math.round(bytes / 1024 / 1024);
  res.json({
    rss: mb(used.rss),
    available: 2048 - mb(used.rss),
    warning: mb(used.rss) > 1800
  });
});

// Auto-restart on memory limit
setInterval(() => {
  const usedMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
  if (usedMB > 1900) {
    console.error('Memory limit exceeded, restarting...');
    process.exit(1); // PM2 will restart
  }
}, 60000);
```

### 3. Caching Setup (REQUIRED)

```bash
npm install node-cache --save
```

```javascript
import NodeCache from 'node-cache';

// Route status cache (30-second TTL)
const routeStatusCache = new NodeCache({ stdTTL: 30 });

// GTFS query cache (5-minute TTL)
const gtfsQueryCache = new NodeCache({ stdTTL: 300 });
```

---

## Revised Implementation Order

### Phase 1: Foundation (Weeks 1-4) ✅ All Green

**Week 1: Live Route Status Dashboard**
- Memory: 8 MB
- Query Time: 50ms
- API: `GET /api/routes/status/live`
- WebSocket: `ws://api/ws/route-status`
- **Risk:** Low

**Week 2: Route Coverage Analysis**
- Memory: 92 MB (peak during batch job)
- Query Time: 50ms (cached), 60s (batch)
- API: `GET /api/routes/coverage/analysis`
- Cron: Every 15 minutes
- **Risk:** Low

**Weeks 3-4: Dynamic Spare Allocation**
- Memory: 25 MB
- Query Time: 100ms
- API: `GET /api/spares/available`, `POST /api/spares/allocate`
- WebSocket: Recommendations
- **Risk:** Low

### Phase 2: Optimization (Weeks 5-8) ⚠️ Monitor Closely

**Weeks 5-6: Stop-Level Heatmap** ⚠️
- Memory: 75 MB
- Query Time: 500ms (with spatial index)
- API: `GET /api/breakdowns/heatmap`
- Background Job: Cluster generation every 5 minutes
- **Risk:** Medium (spatial queries can spike memory)
- **Mitigation:** Pre-compute clusters, aggressive caching

**Weeks 7-8: Smart Engineer Dispatch**
- Memory: 25 MB
- Query Time: 200ms
- API: `POST /api/engineering/dispatch/recommend`
- **Risk:** Low

### Phase 3: Prediction (Weeks 9-13) ⚠️ Data-Dependent

**Weeks 9-10: Predictive Route Alerts** ⚠️ DEFER
- **Prerequisite:** 3+ months historical data with route_id
- Memory: 225 MB (training)
- Query Time: 200ms
- **Risk:** Medium (requires data accumulation)
- **Recommendation:** Collect data in Phases 1-2, implement in Phase 3

**Weeks 11-12: Seasonal Risk Profiles**
- Memory: 165 MB (batch job only)
- Query Time: 50ms (cached)
- API: `GET /api/analytics/seasonal-risk`
- **Risk:** Low (background processing)

**Week 13: Passenger Impact** ⚠️
- Memory: 70 MB
- Query Time: 500ms → 100ms (with pre-computation)
- API: Auto-calculated on breakdown creation
- **Risk:** Medium (complex GTFS queries)
- **Mitigation:** Pre-compute route frequency cache

### Phase 4: Compliance (Weeks 14-16) ✅ All Green

**Weeks 14-15: Stop Accessibility Matching**
- Memory: 13 MB
- Query Time: 100ms
- API: `GET /api/accessibility/gaps/live`
- **Risk:** Low

**Week 16: GTFS-RT Public API** (Replaces Passenger Notifications)
- Memory: 40 MB
- Query Time: 50ms
- API: `GET /api/gtfs-rt/trip-updates`
- WebSocket: `ws://api/ws/gtfs-rt`
- **Risk:** Low

---

## Memory Budget Allocation

```
BASELINE USAGE:                     390 MB
  - Node.js Runtime                  80 MB
  - Express App                      50 MB
  - MySQL Pool (10 connections)      30 MB
  - WebSocket (10-20 connections)    20 MB
  - node-cache (route/GTFS)          60 MB
  - Request processing              100 MB
  - GC buffer                        50 MB

AVAILABLE FOR FEATURES:           1,610 MB

PHASE 1 (Concurrent):               125 MB
  - Route Status                      8 MB
  - Coverage Analysis                92 MB (peak)
  - Spare Allocation                 25 MB

PHASE 2 (Concurrent):               100 MB
  - Stop Heatmap                     75 MB (peak)
  - Engineer Dispatch                25 MB

PHASE 3 (Sequential):               225 MB
  - Predictive Alerts               225 MB (background)
  - Seasonal Analysis               165 MB (background)
  - Passenger Impact                 70 MB

PHASE 4 (Concurrent):                53 MB
  - Accessibility                    13 MB
  - GTFS-RT API                      40 MB

PEAK CONCURRENT USAGE:              ~600 MB
REMAINING BUFFER:                 1,010 MB ✅

CRITICAL THRESHOLD:               1,900 MB
  → Auto-restart if exceeded
```

---

## API Endpoint Summary

### Phase 1 Endpoints

```javascript
// Route Status Dashboard
GET  /api/routes/status/live
WS   ws://api/ws/route-status

// Route Coverage Analysis
GET  /api/routes/coverage/analysis
GET  /api/routes/:routeId/alternatives

// Spare Vehicle Allocation
GET  /api/spares/available
POST /api/spares/allocate
GET  /api/spares/recommendations/active
```

### Phase 2 Endpoints

```javascript
// Stop Heatmap
GET  /api/breakdowns/heatmap
GET  /api/stops/nearby/:lat/:lng

// Engineer Dispatch
POST /api/engineering/dispatch/recommend
POST /api/engineering/dispatch/assign
```

### Phase 3 Endpoints

```javascript
// Predictive Alerts
GET  /api/routes/predictions/live
POST /api/routes/predictions/train (admin)

// Seasonal Risk
GET  /api/analytics/seasonal-risk
GET  /api/analytics/seasonal-trends

// Passenger Impact
GET  /api/breakdowns/:id/passenger-impact
```

### Phase 4 Endpoints

```javascript
// Accessibility
GET  /api/accessibility/gaps/live
POST /api/accessibility/check-breakdown

// GTFS-RT Public API
GET  /api/gtfs-rt/trip-updates
GET  /api/gtfs-rt/vehicle-positions
GET  /api/gtfs-rt/service-alerts
WS   ws://api/ws/gtfs-rt
```

---

## Database Tables to Create

### Phase 1 Tables

```sql
CREATE TABLE route_status_cache (...);
CREATE TABLE route_coverage_analysis (...);
CREATE TABLE route_overlaps (...);
CREATE TABLE spare_vehicles (...);
CREATE TABLE spare_allocation_recommendations (...);
```

### Phase 2 Tables

```sql
CREATE TABLE stop_breakdown_clusters (...);
CREATE TABLE engineer_dispatch_recommendations (...);
ALTER TABLE engineers ADD COLUMN skills JSON;
ALTER TABLE engineers ADD COLUMN current_location_lat DECIMAL(10, 8);
ALTER TABLE engineers ADD COLUMN current_location_lng DECIMAL(11, 8);
```

### Phase 3 Tables

```sql
CREATE TABLE route_prediction_models (...);
CREATE TABLE route_prediction_alerts (...);
CREATE TABLE seasonal_risk_profiles (...);
CREATE TABLE route_passenger_averages (...);
CREATE TABLE route_frequency_cache (...);
ALTER TABLE breakdowns ADD COLUMN estimated_passengers_affected INT;
```

### Phase 4 Tables

```sql
ALTER TABLE fleet_vehicles ADD COLUMN wheelchair_accessible BOOLEAN;
ALTER TABLE breakdowns ADD COLUMN accessibility_impact ENUM(...);
CREATE TABLE accessibility_gap_alerts (...);
CREATE TABLE gtfs_rt_api_access_log (...);
```

---

## Query Optimization Cheat Sheet

### ✅ DO (Fast Queries)

```sql
-- Use indexes
SELECT * FROM breakdowns
WHERE status IN ('active', 'pending')
  AND route_id = '21'
ORDER BY created_at DESC
LIMIT 100;

-- Pre-compute aggregations
SELECT * FROM route_status_cache
WHERE route_id = '21';

-- Use stored procedures for spatial queries
CALL sp_find_nearest_stops(54.9783, -1.6178, 5);
```

### ❌ DON'T (Slow Queries)

```sql
-- Avoid full table scans on large tables
SELECT * FROM gtfs_stop_times; -- 2M+ records

-- Avoid unindexed JOINs
SELECT * FROM gtfs_stop_times st
JOIN gtfs_trips t ON st.trip_id = t.trip_id
WHERE t.route_id = '21'; -- Missing index

-- Avoid real-time aggregations
SELECT COUNT(*) FROM gtfs_stop_times
WHERE departure_time > NOW(); -- Slow, pre-compute instead
```

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Memory Usage | <1.6 GB sustained | >1.8 GB |
| API Response Time (p95) | <500ms | >1s |
| API Response Time (p99) | <1s | >2s |
| Database Query (p95) | <200ms | >500ms |
| WebSocket Latency | <100ms | >500ms |
| Cache Hit Rate | >80% | <60% |

---

## Common Issues & Fixes

### Issue: Memory Limit Exceeded

```bash
# Check memory usage
curl https://api.breakdowns.gobarry.co.uk/api/system/memory

# If > 1.9 GB:
# 1. Identify memory-heavy feature
pm2 logs breakdown-backend | grep -i memory

# 2. Temporarily disable feature (comment out route)
# 3. Restart: pm2 restart breakdown-backend
# 4. Optimize query or increase cache TTL
```

### Issue: Slow API Responses

```sql
-- Check for missing indexes
EXPLAIN SELECT ... FROM ...;

-- Add missing index
CREATE INDEX idx_missing ON table_name(column_name);

-- Analyze table
ANALYZE TABLE breakdowns;
```

### Issue: Database Connection Timeout

```javascript
// Reduce connection pool if hitting limits
// backend/config/mysql.js
connectionLimit: 5 // Reduce from 10
```

---

## Rollback Procedures

### Emergency Rollback

```bash
# 1. Stop PM2
pm2 stop breakdown-backend

# 2. Revert database changes (if needed)
mysql -u gobarryco_Gair -p gobarryco_breakdowns < backup.sql

# 3. Restore previous code version
git checkout <previous-commit-hash>

# 4. Restart
pm2 restart breakdown-backend
```

### Feature-Specific Rollback

```javascript
// Comment out route in server.js
// app.use('/api/routes/predictions', predictiveAlerts);

// Restart
pm2 restart breakdown-backend
```

---

## Contact & Resources

**Developer:** Anthony Gair (anthony.gair@gonortheast.co.uk)

**Documentation:**
- Full Technical Review: `GTFS_FEATURE_ARCHITECTURE_REVIEW.md` (70 pages)
- Implementation Checklist: `GTFS_IMPLEMENTATION_CHECKLIST.md`
- Architecture Diagrams: `GTFS_ARCHITECTURE_DIAGRAM.md`
- Project Context: `CLAUDE.md`

**Monitoring URLs:**
- API Health: `https://api.breakdowns.gobarry.co.uk/health`
- Memory Status: `https://api.breakdowns.gobarry.co.uk/api/system/memory`
- PM2 Logs: `pm2 logs breakdown-backend`

**Database:**
- Host: 85.234.151.224
- Database: gobarryco_breakdowns
- User: gobarryco_Gair

---

## Success Criteria Checklist

### Phase 1 (Weeks 1-4)
- [ ] Route Status Dashboard loads in <500ms
- [ ] Coverage Analysis completes in <60 seconds
- [ ] Spare Allocation recommendations appear within 10 seconds
- [ ] Memory usage stays under 600 MB
- [ ] WebSocket updates arrive within 10 seconds

### Phase 2 (Weeks 5-8)
- [ ] Heatmap loads in <2 seconds (first load), <500ms (cached)
- [ ] Engineer Dispatch recommendations in <500ms
- [ ] Background jobs complete in <30 seconds
- [ ] Memory usage stays under 700 MB

### Phase 3 (Weeks 9-13)
- [ ] Predictive alerts accuracy >60%
- [ ] Seasonal analysis identifies 80%+ of trends
- [ ] Passenger impact calculation <500ms
- [ ] Memory usage stays under 1.6 GB (including batch jobs)

### Phase 4 (Weeks 14-16)
- [ ] Accessibility checks complete in <200ms
- [ ] GTFS-RT feed validates against GTFS-RT spec
- [ ] Public API rate limiting works correctly
- [ ] Total system memory <1.8 GB sustained

---

## Key Recommendations

1. **Start with Phase 1 immediately** - All features are low-risk, high-value
2. **Monitor memory closely in Phase 2** - Stop Heatmap has highest risk
3. **Defer Predictive Alerts** - Wait for 3+ months of data collection
4. **Skip Passenger Notifications** - Use GTFS-RT API instead
5. **Pre-compute everything possible** - Move complexity to background jobs
6. **Cache aggressively** - 30s-5min TTLs for all queries
7. **Test with production data** - Memory usage varies with data volume

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Status:** Ready for Implementation

**Next Steps:**
1. Apply critical database schema changes
2. Add memory monitoring to server.js
3. Install node-cache package
4. Begin Phase 1, Week 1: Live Route Status Dashboard
