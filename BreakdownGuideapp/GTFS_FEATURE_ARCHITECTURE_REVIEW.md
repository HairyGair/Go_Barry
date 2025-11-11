# GTFS Feature Implementation - Technical Architecture Review

**Date:** November 10, 2025
**System:** Go BARRY Breakdown Management System
**Reviewer:** Backend Architecture Specialist
**Environment:** Node.js + Express + MySQL on cPanel PM2 (2GB RAM)

---

## Executive Summary

This document provides a comprehensive technical feasibility analysis of 10 proposed GTFS-powered features for the Go BARRY system. The analysis addresses critical constraints (2GB RAM, 2M+ GTFS records) and provides concrete implementation recommendations, database optimizations, and risk mitigation strategies.

**Key Findings:**
- 7 of 10 features are highly feasible with proper optimization
- 2 features require significant architectural changes
- 1 feature is not recommended for current infrastructure
- Proposed phasing differs from business priority due to technical dependencies

---

## Current System Assessment

### Infrastructure Constraints

| Component | Current State | Critical Limits |
|-----------|---------------|-----------------|
| **Memory** | 2GB RAM | Hard limit - no expansion possible |
| **Database** | MySQL 8.0+ @ 85.234.151.224 | Direct connection, 10 concurrent connections |
| **Backend** | Node.js 18+ on PM2 | Single instance, no clustering |
| **GTFS Data** | 2M+ records in 4 tables | Not yet imported |
| **WebSocket** | ws package, single server | No Redis pub/sub |
| **Caching** | node-cache (in-memory) | Competes with app memory |

### Existing Database Schema

**GTFS Tables (Created, Not Populated):**
```sql
gtfs_routes          -- ~231 routes (route_short_name, route_long_name, etc.)
gtfs_stops           -- ~15,000 stops (stop_lat, stop_lon, wheelchair_boarding)
gtfs_trips           -- ~50,000 trips (trip_id, route_id, service_id)
gtfs_stop_times      -- ~2,000,000+ records (trip_id, stop_id, arrival_time)
```

**Fleet Tables:**
```sql
fleet_vehicles       -- 1,000+ vehicles (fleet_no, depot, vehicle_type)
breakdowns           -- Breakdown records (fleet_no, location_lat/lng, status)
activities           -- Activity log (breakdown_id, timestamp, type)
supervisors          -- 9 active users (badge_number, depot)
```

**Current Indexes:**
- Route lookup: `idx_route_short_name`, `idx_route_id`
- Stop location: `idx_stop_location (stop_lat, stop_lon)`
- Stop times: `idx_trip_id`, `idx_stop_id`, `unique_trip_stop_sequence`
- Breakdowns: No spatial indexes (critical gap)

### Memory Usage Baseline

**Current Estimated Memory Consumption:**
```
Node.js Runtime:        ~80MB
Express App:            ~50MB
MySQL Connection Pool:  ~30MB (10 connections)
WebSocket Connections:  ~20MB (5-10 active)
node-cache:             ~50MB (fleet/route data)
Working Memory:         ~100MB
Buffer:                 ~50MB
--------------------------------
Total Baseline:         ~380MB
Available for Features: ~1,620MB
```

**Critical Threshold:** If memory exceeds 1.8GB, PM2 will trigger warnings and potential crashes.

---

## Feature-by-Feature Technical Analysis

### Phase 1: Foundation Features

---

#### 1. Live Route Status Dashboard

**Business Priority:** Phase 1, Week 1
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 1 (Keep as Phase 1)

**Description:**
Real-time dashboard showing Green/Amber/Red status for all 231 routes based on active breakdowns.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ WebSocket Server (ws)                                   │
│ - Broadcasts route status changes every 5 seconds      │
│ - Filters by depot for targeted updates                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Route Status Service (Cached)                          │
│ - Queries: SELECT route_id, COUNT(*) FROM breakdowns   │
│   WHERE status IN ('active', 'pending')                │
│   GROUP BY route_id                                     │
│ - Cache TTL: 30 seconds (node-cache)                   │
│ - Memory: ~5MB for all route statuses                  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ MySQL Query (Optimized)                                │
│ - Uses existing breakdowns table                       │
│ - New index: idx_status_route (status, route_id)       │
│ - Query time: <50ms                                     │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Add route_id column to breakdowns table
ALTER TABLE breakdowns ADD COLUMN route_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_status_route (status, route_id);

-- Create materialized cache table (optional optimization)
CREATE TABLE route_status_cache (
  route_id VARCHAR(100) PRIMARY KEY,
  status ENUM('green', 'amber', 'red') NOT NULL,
  active_breakdowns INT DEFAULT 0,
  last_breakdown_time TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/routes/status/live
// Returns: { routes: [{ route_id, status, active_breakdowns, last_updated }] }
// Memory: 5MB cached, 1MB per request
// Response Time: 50-100ms

// WebSocket: ws://api/ws/route-status
// Broadcasts: Every 5 seconds when status changes
// Payload: { type: 'route_status_update', route_id, status, breakdown_count }
```

**Implementation Steps:**

1. **Week 1, Days 1-2:** Add route_id column and index to breakdowns table
2. **Week 1, Days 3-4:** Create route status service with caching
3. **Week 1, Days 5-7:** Build WebSocket broadcast logic and frontend dashboard

**Memory Impact:**
- Cached data: ~5MB (231 routes × ~20KB each)
- Active queries: ~1MB per concurrent request
- WebSocket: ~2MB for 10 concurrent connections
- **Total: ~8MB** ✅ Well within limits

**Performance Estimates:**
- Initial load: 200-300ms (query + cache warm-up)
- Cached responses: 10-20ms
- WebSocket updates: 5ms broadcast latency
- Database load: 1 query per 30 seconds (minimal)

**Risk Assessment:**
- **Low Risk:** Simple aggregation query on indexed column
- **Dependency:** Requires route_id capture during breakdown creation
- **Mitigation:** Use wizard_assessment_data.route as fallback

**Success Criteria:**
- Dashboard loads in <500ms
- Status updates appear within 10 seconds of breakdown creation
- Memory usage stays under 50MB total

---

#### 2. Stop-Level Incident Heatmap

**Business Priority:** Phase 1, Week 2
**Technical Feasibility:** ⚠️ **MEDIUM** (Spatial queries are memory-intensive)
**Recommended Priority:** 4 (Move to Phase 2)

**Description:**
Visualize breakdown locations on a map with clustering by bus stop proximity.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: Leaflet.js + MarkerCluster                   │
│ - Client-side clustering (reduce server load)          │
│ - Max 500 markers loaded at once                       │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Spatial Query Service                                   │
│ - Query: SELECT b.*, s.stop_name,                      │
│     (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(s.lat))│
│      * COS(RADIANS(s.lon) - RADIANS(?)) +              │
│     SIN(RADIANS(?)) * SIN(RADIANS(s.lat)))) AS distance│
│   FROM breakdowns b                                     │
│   JOIN gtfs_stops s ON distance < 0.5                  │
│ - Memory: ~50MB for 2,000 breakdown records            │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ MySQL Spatial Optimization                             │
│ - Add SPATIAL index on gtfs_stops                      │
│ - Use ST_Distance_Sphere() for accurate calculations   │
│ - Pre-compute stop clusters offline                    │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Add spatial columns to stops table
ALTER TABLE gtfs_stops
  ADD COLUMN location POINT GENERATED ALWAYS AS
    (POINT(stop_lon, stop_lat)) STORED;

CREATE SPATIAL INDEX idx_stop_location_spatial
  ON gtfs_stops(location);

-- Add nearest_stop_id to breakdowns table
ALTER TABLE breakdowns ADD COLUMN nearest_stop_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_nearest_stop (nearest_stop_id);

-- Create stop cluster cache (pre-computed aggregation)
CREATE TABLE stop_breakdown_clusters (
  stop_id VARCHAR(100) PRIMARY KEY,
  stop_name VARCHAR(255),
  stop_lat DECIMAL(10, 8),
  stop_lon DECIMAL(11, 8),
  breakdown_count_24h INT DEFAULT 0,
  breakdown_count_7d INT DEFAULT 0,
  last_breakdown_time TIMESTAMP NULL,
  severity_max ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_breakdown_count_24h (breakdown_count_24h),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/breakdowns/heatmap
// Query params: ?timeRange=24h&depot=Washington&minSeverity=medium
// Returns: { clusters: [{ stop_id, lat, lng, count, severity }] }
// Memory: 20MB for 500 clusters
// Response Time: 200-500ms (with spatial index)

// GET /api/stops/nearby/:lat/:lng
// Returns: Stops within 500m radius
// Uses stored procedure: sp_find_nearest_stops(lat, lng, limit)
// Memory: 5MB per request
```

**Implementation Steps:**

1. **Week 2, Days 1-3:** Add spatial indexes and nearest_stop_id column
2. **Week 2, Days 4-5:** Create background job to compute stop clusters
3. **Week 2, Days 6-7:** Build heatmap API with caching and frontend visualization

**Memory Impact:**
- Spatial calculations: ~50MB peak during query
- Cluster cache: ~15MB for 500 clusters
- Map markers: ~10MB for 500 rendered markers (client-side)
- **Total: ~75MB** ⚠️ Moderate impact

**Performance Estimates:**
- Initial query (no cache): 1-2 seconds (spatial join on 2M records)
- Cached query: 50-100ms
- Cluster pre-computation: 5-10 seconds (background job)
- Frontend rendering: 300-500ms (500 markers)

**Risk Assessment:**
- **Medium Risk:** Spatial queries without proper indexes can cause memory spikes
- **Bottleneck:** Haversine calculations on 2M+ gtfs_stop_times records
- **Mitigation Strategies:**
  1. Use SPATIAL indexes (mandatory)
  2. Pre-compute clusters in background job (every 5 minutes)
  3. Cache results for 5 minutes
  4. Limit results to 500 clusters max
  5. Use bounding box filtering before distance calculation

**Alternative Approach (Recommended):**
Compute nearest_stop_id at breakdown creation time using existing stored procedure `sp_find_nearest_stops()`. This moves the expensive calculation to write-time (1 breakdown per few minutes) instead of read-time (many dashboard loads per minute).

**Success Criteria:**
- Heatmap loads in <2 seconds on first load
- Subsequent loads: <500ms (cached)
- Memory usage stays under 100MB total
- Background jobs complete in <30 seconds

---

#### 3. Route Coverage Analysis

**Business Priority:** Phase 1, Week 3
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 2 (Keep in Phase 1)

**Description:**
Identify gaps in service coverage due to breakdowns and detect redundant service areas.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Coverage Analysis Service (Batch Processing)           │
│ - Runs every 15 minutes via cron/PM2                   │
│ - Analyzes 231 routes + active breakdowns              │
│ - Outputs coverage report (JSON)                        │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ SQL Analysis Queries                                    │
│ 1. Routes with 0 active vehicles (coverage gaps)       │
│ 2. Routes with 3+ breakdowns (service degradation)     │
│ 3. Overlapping routes serving same stops               │
│ 4. Alternative routes for passengers                   │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Coverage Report Cache Table                            │
│ - Stores pre-computed analysis results                 │
│ - Updated every 15 minutes                              │
│ - API serves cached data instantly                     │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Create route coverage analysis table
CREATE TABLE route_coverage_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  route_id VARCHAR(100) NOT NULL,
  total_stops INT NOT NULL,
  affected_stops INT DEFAULT 0,
  coverage_percentage DECIMAL(5, 2) NOT NULL,
  active_breakdowns INT DEFAULT 0,
  service_status ENUM('normal', 'degraded', 'critical', 'suspended') NOT NULL,
  alternative_routes JSON DEFAULT NULL,
  recommendations TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_route_id (route_id),
  INDEX idx_service_status (service_status),
  INDEX idx_analysis_date (analysis_date)
) ENGINE=InnoDB;

-- Create route overlap mapping (pre-computed)
CREATE TABLE route_overlaps (
  route_id_a VARCHAR(100) NOT NULL,
  route_id_b VARCHAR(100) NOT NULL,
  shared_stops INT NOT NULL,
  overlap_percentage DECIMAL(5, 2) NOT NULL,
  PRIMARY KEY (route_id_a, route_id_b),
  INDEX idx_overlap_percentage (overlap_percentage)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/routes/coverage/analysis
// Query params: ?depot=Washington
// Returns: {
//   total_routes: 231,
//   normal_service: 200,
//   degraded_service: 25,
//   critical_service: 6,
//   gaps: [{ route_id, coverage_percentage, recommendations }]
// }
// Memory: 10MB cached
// Response Time: 20-50ms (cached)

// GET /api/routes/:routeId/alternatives
// Returns: { alternatives: [{ route_id, shared_stops, recommendation }] }
// Memory: 2MB per request
```

**Implementation Steps:**

1. **Week 3, Days 1-2:** Create coverage analysis tables
2. **Week 3, Days 3-4:** Write batch analysis scripts (route overlap detection)
3. **Week 3, Days 5-6:** Create PM2 cron job for 15-minute updates
4. **Week 3, Day 7:** Build API endpoints and frontend dashboard

**Memory Impact:**
- Analysis job: ~80MB peak during batch processing
- Cached results: ~10MB (231 routes × ~40KB each)
- API responses: ~2MB per request
- **Total: ~92MB** ✅ Acceptable

**Performance Estimates:**
- Batch analysis: 30-60 seconds (runs in background)
- API response (cached): 20-50ms
- Coverage calculation: One-time 60-second job
- Alternative route lookup: 10-20ms per route

**Risk Assessment:**
- **Low Risk:** Batch processing runs in background, doesn't block requests
- **Bottleneck:** Initial overlap calculation (231² comparisons = 53,361 pairs)
- **Mitigation:**
  1. Pre-compute route overlaps during GTFS import
  2. Store results in `route_overlaps` table
  3. Update only when GTFS data changes (rare)
  4. Use indexed queries for fast lookups

**One-Time Setup Query:**

```sql
-- Pre-compute route overlaps (run once after GTFS import)
INSERT INTO route_overlaps (route_id_a, route_id_b, shared_stops, overlap_percentage)
SELECT
  a.route_id AS route_id_a,
  b.route_id AS route_id_b,
  COUNT(DISTINCT a.stop_id) AS shared_stops,
  (COUNT(DISTINCT a.stop_id) * 100.0 / total_stops_a.count) AS overlap_percentage
FROM (
  SELECT DISTINCT st.stop_id, t.route_id
  FROM gtfs_stop_times st
  JOIN gtfs_trips t ON st.trip_id = t.trip_id
) a
JOIN (
  SELECT DISTINCT st.stop_id, t.route_id
  FROM gtfs_stop_times st
  JOIN gtfs_trips t ON st.trip_id = t.trip_id
) b ON a.stop_id = b.stop_id AND a.route_id < b.route_id
JOIN (
  SELECT route_id, COUNT(DISTINCT stop_id) as count
  FROM gtfs_stop_times st
  JOIN gtfs_trips t ON st.trip_id = t.trip_id
  GROUP BY route_id
) total_stops_a ON a.route_id = total_stops_a.route_id
GROUP BY a.route_id, b.route_id, total_stops_a.count
HAVING shared_stops >= 5;
```

**Success Criteria:**
- Coverage report generates in <60 seconds
- API serves results in <100ms
- Memory usage stays under 100MB during batch processing
- Identifies 95%+ of coverage gaps accurately

---

### Phase 2: Predictive & Intelligent Features

---

#### 4. Predictive Route Alerts

**Business Priority:** Phase 2, Week 5
**Technical Feasibility:** ⚠️ **MEDIUM** (Requires historical data analysis)
**Recommended Priority:** 6 (Move to Phase 3 - needs data accumulation)

**Description:**
Predict breakdowns 30-60 minutes ahead based on historical patterns, route characteristics, and current conditions.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Prediction Engine (Simple Statistical Model)           │
│ - Historical breakdown frequency by route               │
│ - Time-of-day patterns (rush hour risk)                │
│ - Weather conditions (optional)                         │
│ - Vehicle age/mileage factors                           │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Historical Data Analysis (3+ months required)          │
│ - Query: Breakdown patterns by:                        │
│   • Route + Time of Day                                │
│   • Vehicle Type + Route                               │
│   • Weather + Route Type (hills, motorway)            │
│ - Memory: ~200MB for analysis of 10,000+ breakdowns   │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Risk Score Calculation (Real-time)                     │
│ - Low Risk: <5% probability                            │
│ - Medium Risk: 5-15% probability                       │
│ - High Risk: >15% probability                          │
│ - Triggers: WebSocket alert to SDC Dashboard           │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Create breakdown prediction model table
CREATE TABLE route_prediction_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL, -- 0-23
  day_of_week INT NOT NULL, -- 1-7 (Monday-Sunday)
  vehicle_type VARCHAR(100),
  historical_breakdown_count INT DEFAULT 0,
  total_trips_analyzed INT DEFAULT 0,
  breakdown_probability DECIMAL(5, 2) NOT NULL,
  confidence_score DECIMAL(5, 2) NOT NULL,
  last_trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_route_time (route_id, time_of_day_hour, day_of_week),
  INDEX idx_probability (breakdown_probability DESC)
) ENGINE=InnoDB;

-- Create real-time prediction alerts table
CREATE TABLE route_prediction_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  risk_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  contributing_factors JSON DEFAULT NULL,
  recommendation TEXT,
  actual_breakdown_occurred BOOLEAN DEFAULT FALSE,
  actual_breakdown_time TIMESTAMP NULL,
  alert_accuracy DECIMAL(5, 2) NULL,
  INDEX idx_route_id (route_id),
  INDEX idx_predicted_at (predicted_at),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/routes/predictions/live
// Returns: {
//   high_risk_routes: [
//     { route_id, risk_score, predicted_window: "14:30-15:30", factors: [...] }
//   ]
// }
// Memory: 20MB cached
// Response Time: 50-100ms

// POST /api/routes/predictions/train
// Admin-only: Retrain prediction models using last 90 days of data
// Memory: 200MB peak
// Processing Time: 2-5 minutes
```

**Implementation Steps:**

1. **Phase 3, Week 9-10:** Collect 3+ months of historical data
2. **Phase 3, Week 11:** Build statistical model (time-series analysis)
3. **Phase 3, Week 12:** Create prediction API and alert system
4. **Phase 3, Week 13:** Integrate with SDC Dashboard WebSocket

**Memory Impact:**
- Historical data analysis: ~200MB peak during training
- Trained models: ~15MB cached (231 routes × various time slots)
- Real-time predictions: ~10MB per batch calculation
- **Total: ~225MB** ⚠️ Significant but manageable

**Performance Estimates:**
- Model training: 2-5 minutes (admin-triggered, runs in background)
- Real-time prediction: 100-200ms per route
- Batch prediction (all routes): 5-10 seconds
- Alert generation: 50ms per alert

**Risk Assessment:**
- **Medium-High Risk:** Requires significant historical data (3+ months)
- **Bottleneck:** Statistical analysis of 10,000+ breakdown records
- **Dependency:** Accurate route_id capture in all breakdowns
- **Mitigation Strategies:**
  1. Start data collection immediately (even before feature implementation)
  2. Use simple statistical model (not ML) to reduce complexity
  3. Train models overnight via cron job (low-priority task)
  4. Cache predictions for 30-minute windows
  5. Gradually improve model as more data accumulates

**Recommended Approach:**

Phase 2 should focus on **data collection** only:
- Add route_id to all breakdown records
- Track breakdown patterns (no prediction yet)
- Build data visualization dashboard

Phase 3 implements actual prediction after 3 months of data accumulation.

**Success Criteria:**
- Prediction accuracy: >60% (low bar initially, improves over time)
- False positive rate: <20%
- Memory usage: <250MB total
- Response time: <200ms for live predictions

---

#### 5. Dynamic Spare Vehicle Allocation

**Business Priority:** Phase 2, Week 6
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 3 (Keep in Phase 2)

**Description:**
Intelligently recommend spare vehicle positioning based on route breakdown patterns and current breakdown locations.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Allocation Engine (Rule-Based Optimization)            │
│ - Input: Current breakdowns + Spare vehicle locations  │
│ - Output: Recommended spare movements                   │
│ - Algorithm: Nearest spare + highest-risk route        │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Optimization Factors                                    │
│ 1. Distance to breakdown (haversine calculation)       │
│ 2. Vehicle type compatibility (route requirements)     │
│ 3. Depot availability (spare count by depot)           │
│ 4. Route priority (high-frequency routes preferred)    │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Real-time Updates via WebSocket                        │
│ - Broadcasts recommendations to SDC Dashboard          │
│ - Updates every 2 minutes or on new breakdown          │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Create spare vehicle tracking table
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
  INDEX idx_status (current_status),
  INDEX idx_location (current_location_lat, current_location_lng)
) ENGINE=InnoDB;

-- Create allocation recommendations table
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
  expires_at TIMESTAMP,
  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_status (recommendation_status),
  INDEX idx_recommended_at (recommended_at)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/spares/available
// Query params: ?depot=Washington&vehicleType=Streetlite
// Returns: { spares: [{ fleet_no, depot, status, location }] }
// Memory: 5MB
// Response Time: 20-50ms

// POST /api/spares/allocate
// Body: { breakdown_id, spare_fleet_no }
// Returns: { success: true, recommendation: {...} }
// Triggers WebSocket broadcast
// Memory: 2MB per request

// GET /api/spares/recommendations/active
// Returns: {
//   recommendations: [
//     { breakdown_id, spare_fleet_no, distance_km, eta_minutes, priority }
//   ]
// }
// Memory: 10MB cached
```

**Implementation Steps:**

1. **Week 6, Days 1-2:** Create spare_vehicles and recommendations tables
2. **Week 6, Days 3-4:** Implement allocation algorithm (nearest + compatible)
3. **Week 6, Days 5-6:** Build API endpoints and WebSocket integration
4. **Week 6, Day 7:** Frontend integration with SDC Dashboard

**Memory Impact:**
- Spare vehicle data: ~5MB (50-100 spare vehicles)
- Allocation calculations: ~10MB per batch (all active breakdowns)
- Cached recommendations: ~10MB
- **Total: ~25MB** ✅ Low impact

**Performance Estimates:**
- Allocation calculation: 50-100ms per breakdown
- Batch allocation (20 active breakdowns): 1-2 seconds
- API response: 20-50ms (cached)
- WebSocket broadcast: 10ms

**Allocation Algorithm (Simplified):**

```javascript
// Pseudo-code for allocation logic
function recommendSpare(breakdown) {
  // 1. Get all available spares
  const spares = await getAvailableSpares(breakdown.depot);

  // 2. Filter by vehicle type compatibility
  const compatible = spares.filter(spare =>
    isCompatible(spare.vehicle_type, breakdown.route_requirements)
  );

  // 3. Calculate distance to breakdown
  const withDistance = compatible.map(spare => ({
    ...spare,
    distance: haversineDistance(
      spare.location_lat, spare.location_lng,
      breakdown.location_lat, breakdown.location_lng
    )
  }));

  // 4. Sort by priority score (distance + route priority)
  const scored = withDistance.map(spare => ({
    ...spare,
    priority_score: calculatePriority(spare, breakdown)
  })).sort((a, b) => b.priority_score - a.priority_score);

  // 5. Return top recommendation
  return scored[0];
}
```

**Risk Assessment:**
- **Low Risk:** Simple rule-based algorithm, no complex calculations
- **Dependency:** Requires spare vehicle location updates (manual or GPS integration)
- **Mitigation:**
  1. Start with depot-level positioning (coarse-grained)
  2. Add GPS integration later for precise locations
  3. Cache allocation results for 2 minutes
  4. Fallback to nearest depot if no compatible spare

**Success Criteria:**
- Recommendations generated in <2 seconds
- 90%+ accuracy for compatible vehicle types
- Memory usage <50MB total
- WebSocket updates arrive within 10 seconds

---

### Phase 3: Advanced Intelligence

---

#### 6. Smart Engineer Dispatch

**Business Priority:** Phase 3, Week 9
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 5 (Keep in Phase 3)

**Description:**
Auto-assign engineers to breakdowns based on skill match, proximity, and workload.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Dispatch Engine (Weighted Scoring Algorithm)           │
│ - Input: Breakdown details + Engineer availability     │
│ - Output: Ranked engineer recommendations               │
│ - Factors: Skill match (40%), Distance (30%),          │
│           Workload (20%), Availability (10%)            │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Engineer Skills Database                                │
│ - Certifications (electrical, hydraulic, diesel)       │
│ - Vehicle type expertise (Streetlite, Enviro, etc.)    │
│ - Historical success rate by defect type               │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Real-time Assignment via WebSocket                     │
│ - Notifies engineer via mobile app                     │
│ - Updates SDC Dashboard instantly                      │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Enhance engineers table (already exists)
ALTER TABLE engineers ADD COLUMN skills JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN certifications JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN vehicle_type_expertise JSON DEFAULT NULL;
ALTER TABLE engineers ADD COLUMN current_location_lat DECIMAL(10, 8);
ALTER TABLE engineers ADD COLUMN current_location_lng DECIMAL(11, 8);
ALTER TABLE engineers ADD INDEX idx_location (current_location_lat, current_location_lng);

-- Example skills JSON structure:
-- {
--   "electrical": 5, // skill level 1-5
--   "hydraulic": 4,
--   "diesel_engine": 5,
--   "wheelchair_ramp": 3
-- }

-- Create dispatch recommendations table
CREATE TABLE engineer_dispatch_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(100) NOT NULL,
  engineer_id INT NOT NULL,
  recommendation_score DECIMAL(5, 2) NOT NULL,
  skill_match_score DECIMAL(5, 2),
  distance_score DECIMAL(5, 2),
  workload_score DECIMAL(5, 2),
  distance_km DECIMAL(8, 2),
  estimated_arrival_minutes INT,
  recommendation_reason TEXT,
  recommendation_status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_engineer_id (engineer_id),
  INDEX idx_score (recommendation_score DESC)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// POST /api/engineering/dispatch/recommend
// Body: { breakdown_id }
// Returns: {
//   recommendations: [
//     { engineer_id, name, score, distance_km, eta_minutes, skills }
//   ]
// }
// Memory: 5MB per request
// Response Time: 100-200ms

// POST /api/engineering/dispatch/assign
// Body: { breakdown_id, engineer_id }
// Returns: { success: true, assignment: {...} }
// Triggers WebSocket notification to engineer and SDC
// Memory: 2MB per request
```

**Implementation Steps:**

1. **Week 9, Days 1-2:** Add skills/certifications columns to engineers table
2. **Week 9, Days 3-4:** Implement weighted scoring algorithm
3. **Week 9, Days 5-6:** Build dispatch API endpoints
4. **Week 9, Day 7:** WebSocket integration for real-time notifications

**Memory Impact:**
- Engineer data: ~5MB (50 engineers × ~100KB each with skills)
- Dispatch calculations: ~10MB per batch
- Cached recommendations: ~10MB
- **Total: ~25MB** ✅ Low impact

**Performance Estimates:**
- Dispatch calculation: 100-200ms per breakdown
- Batch dispatch (20 breakdowns): 2-4 seconds
- Skill matching: 50ms per engineer
- Distance calculation: 10ms per engineer

**Dispatch Algorithm (Weighted Scoring):**

```javascript
function calculateDispatchScore(engineer, breakdown) {
  // 1. Skill Match Score (40% weight)
  const requiredSkills = extractSkillsFromDefect(breakdown.issue_category);
  const skillMatch = requiredSkills.reduce((sum, skill) =>
    sum + (engineer.skills[skill] || 0), 0
  ) / requiredSkills.length;
  const skillScore = (skillMatch / 5) * 100; // Normalize to 0-100

  // 2. Distance Score (30% weight)
  const distance = haversineDistance(
    engineer.current_location_lat, engineer.current_location_lng,
    breakdown.location_lat, breakdown.location_lng
  );
  const distanceScore = Math.max(0, 100 - (distance * 10)); // Penalty for distance

  // 3. Workload Score (20% weight)
  const activeAssignments = engineer.active_breakdown_count || 0;
  const workloadScore = Math.max(0, 100 - (activeAssignments * 25));

  // 4. Availability Score (10% weight)
  const availabilityScore = engineer.is_available ? 100 : 0;

  // 5. Weighted Total
  const totalScore = (
    skillScore * 0.40 +
    distanceScore * 0.30 +
    workloadScore * 0.20 +
    availabilityScore * 0.10
  );

  return {
    total_score: totalScore,
    skill_match: skillScore,
    distance: distance,
    eta_minutes: Math.ceil(distance / 0.5) // Assume 30km/h average speed
  };
}
```

**Risk Assessment:**
- **Low Risk:** Simple scoring algorithm, existing engineers table
- **Dependency:** Requires engineer skill data entry (one-time setup)
- **Mitigation:**
  1. Default to distance-only if skill data incomplete
  2. Gradual skill data population by SDC staff
  3. Learning mode: Track assignment outcomes to tune weights

**Success Criteria:**
- Dispatch recommendations in <500ms
- 80%+ engineer acceptance rate
- Avg response time reduction: 15-20%
- Memory usage <50MB total

---

#### 7. Seasonal Risk Profiles

**Business Priority:** Phase 3, Week 10
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 7 (Keep in Phase 3)

**Description:**
Analyze breakdown patterns by season, weather, temperature to identify seasonal trends.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Seasonal Analysis Engine (Batch Processing)            │
│ - Analyzes 12+ months of historical data               │
│ - Groups by season, weather, temperature               │
│ - Outputs risk profiles by route/vehicle type          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Weather Data Integration (Optional)                    │
│ - External API: OpenWeatherMap or Met Office          │
│ - Stores daily weather snapshots                       │
│ - Correlates weather with breakdown frequency          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Risk Profile Dashboard                                  │
│ - Winter: "Heating defects +40%"                       │
│ - Summer: "A/C failures +60%"                          │
│ - Rain: "Electrical issues +25%"                       │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Create seasonal risk profiles table
CREATE TABLE seasonal_risk_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  season ENUM('winter', 'spring', 'summer', 'autumn') NOT NULL,
  defect_category VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(100),
  route_type VARCHAR(50), -- 'urban', 'motorway', 'rural'
  baseline_breakdown_rate DECIMAL(5, 2) NOT NULL, -- Breakdowns per 1000 miles
  seasonal_adjustment_factor DECIMAL(5, 2) NOT NULL, -- Multiplier (1.0 = no change)
  sample_size INT NOT NULL, -- Number of historical breakdowns analyzed
  confidence_level DECIMAL(5, 2), -- Statistical confidence
  last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_season_defect (season, defect_category),
  INDEX idx_vehicle_type (vehicle_type)
) ENGINE=InnoDB;

-- Create weather snapshot table (optional)
CREATE TABLE weather_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recorded_at TIMESTAMP NOT NULL,
  depot VARCHAR(100) NOT NULL,
  temperature_celsius DECIMAL(4, 1),
  weather_condition VARCHAR(50), -- 'clear', 'rain', 'snow', 'fog'
  wind_speed_kmh DECIMAL(5, 2),
  INDEX idx_recorded_at (recorded_at),
  INDEX idx_depot (depot)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/analytics/seasonal-risk
// Query params: ?season=winter&vehicleType=Streetlite
// Returns: {
//   profiles: [
//     { defect_category: "Heating", risk_increase: "+40%", sample_size: 150 }
//   ]
// }
// Memory: 10MB cached
// Response Time: 50ms

// GET /api/analytics/seasonal-trends
// Returns: Time-series chart data for last 24 months
// Memory: 20MB per request
```

**Implementation Steps:**

1. **Week 10, Days 1-2:** Create seasonal analysis tables
2. **Week 10, Days 3-5:** Write batch analysis script (12-month lookback)
3. **Week 10, Days 6-7:** Build API and frontend dashboard

**Memory Impact:**
- Historical analysis: ~150MB peak during batch processing
- Risk profiles: ~10MB cached (200 profiles × ~50KB)
- Weather data: ~5MB (365 days × ~15KB)
- **Total: ~165MB** ⚠️ Moderate impact (batch job only)

**Performance Estimates:**
- Batch analysis: 5-10 minutes (runs monthly via cron)
- API response: 20-50ms (cached)
- Chart generation: 200-300ms

**Risk Assessment:**
- **Low Risk:** Read-only batch analysis, no real-time processing
- **Dependency:** 12+ months of historical data required
- **Mitigation:**
  1. Run analysis as low-priority background job
  2. Cache results for 30 days
  3. Progressive analysis: Start with 3 months, improve as data grows

**Success Criteria:**
- Identifies 80%+ of seasonal trends
- Reports statistically significant patterns (confidence >70%)
- Memory usage <200MB during analysis
- API serves results in <100ms

---

#### 8. Passenger Impact Assessment

**Business Priority:** Phase 3, Week 11
**Technical Feasibility:** ⚠️ **MEDIUM** (Complex calculations)
**Recommended Priority:** 8 (Keep in Phase 3)

**Description:**
Calculate number of affected passengers per breakdown based on route frequency and time of day.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Passenger Impact Calculator                            │
│ - Input: Breakdown location + route + time             │
│ - Query: Trips scheduled in next 60 minutes            │
│ - Estimate: Passengers per trip (historical averages)  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ GTFS Stop Times Query                                   │
│ SELECT COUNT(*) FROM gtfs_stop_times st                │
│ JOIN gtfs_trips t ON st.trip_id = t.trip_id            │
│ WHERE t.route_id = ?                                    │
│   AND st.departure_time BETWEEN ? AND ?                │
│ - Memory: ~50MB for query on 2M records                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Passenger Count Estimation                              │
│ - Peak hours: 40-60 passengers/trip                    │
│ - Off-peak: 15-25 passengers/trip                      │
│ - School runs: 30-40 passengers/trip                   │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Create route passenger averages table (pre-computed)
CREATE TABLE route_passenger_averages (
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL, -- 0-23
  day_of_week INT NOT NULL, -- 1-7
  avg_passengers_per_trip DECIMAL(5, 2) NOT NULL,
  sample_size INT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (route_id, time_of_day_hour, day_of_week),
  INDEX idx_route_id (route_id)
) ENGINE=InnoDB;

-- Add passenger impact to breakdowns table
ALTER TABLE breakdowns ADD COLUMN estimated_passengers_affected INT DEFAULT 0;
ALTER TABLE breakdowns ADD COLUMN trips_affected_count INT DEFAULT 0;
ALTER TABLE breakdowns ADD INDEX idx_passengers_affected (estimated_passengers_affected);
```

**API Endpoints:**

```javascript
// GET /api/breakdowns/:id/passenger-impact
// Returns: {
//   estimated_passengers: 240,
//   trips_affected: 6,
//   impact_duration_minutes: 45,
//   severity: "high"
// }
// Memory: 20MB per request
// Response Time: 200-500ms

// Auto-calculated on breakdown creation
// Stored in breakdowns.estimated_passengers_affected
```

**Implementation Steps:**

1. **Week 11, Days 1-2:** Create passenger averages table
2. **Week 11, Days 3-4:** Build impact calculator
3. **Week 11, Days 5-6:** Integrate into breakdown creation workflow
4. **Week 11, Day 7:** Add impact metrics to SDC Dashboard

**Memory Impact:**
- GTFS query: ~50MB peak (filtered query on 2M records)
- Passenger averages: ~15MB cached (231 routes × 24 hours × 7 days)
- Impact calculation: ~5MB per breakdown
- **Total: ~70MB** ⚠️ Moderate impact

**Performance Estimates:**
- GTFS query: 500ms-1s (with indexes)
- Impact calculation: 100-200ms
- Total: 600ms-1.2s per breakdown

**Risk Assessment:**
- **Medium Risk:** Complex query on large gtfs_stop_times table
- **Bottleneck:** Time-range queries on 2M+ records
- **Mitigation Strategies:**
  1. Pre-compute passenger averages (hourly cron job)
  2. Use indexed time range queries
  3. Cache recent impact calculations (5 minutes)
  4. Simplify to route-level estimates (ignore stop-level detail)

**Simplified Approach (Recommended):**

Instead of querying gtfs_stop_times in real-time, use pre-computed route frequency:

```sql
-- Pre-compute route frequency (trips per hour)
CREATE TABLE route_frequency_cache (
  route_id VARCHAR(100) NOT NULL,
  time_of_day_hour INT NOT NULL,
  day_of_week INT NOT NULL,
  trips_per_hour INT NOT NULL,
  avg_passengers_per_trip DECIMAL(5, 2) NOT NULL,
  PRIMARY KEY (route_id, time_of_day_hour, day_of_week)
) ENGINE=InnoDB;

-- Impact calculation becomes simple:
-- estimated_passengers = trips_per_hour * avg_passengers_per_trip * impact_duration_hours
```

**Success Criteria:**
- Impact calculation in <500ms
- 70%+ accuracy for passenger estimates
- Memory usage <100MB per calculation
- Integrates seamlessly into breakdown workflow

---

### Phase 4: Customer-Facing Features

---

#### 9. Stop Accessibility Matching

**Business Priority:** Phase 4, Week 13
**Technical Feasibility:** ✅ **HIGH**
**Recommended Priority:** 9 (Keep in Phase 4)

**Description:**
Track wheelchair-accessible vehicle assignments and flag accessibility gaps when wheelchair-compliant vehicles break down.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Accessibility Tracker                                   │
│ - Monitors breakdowns of wheelchair-accessible vehicles│
│ - Checks route wheelchair requirements                 │
│ - Flags accessibility gaps to SDC                      │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ GTFS Stops + Fleet Data                                │
│ - gtfs_stops.wheelchair_boarding (0/1/2)               │
│ - fleet_vehicles.wheelchair_accessible (boolean)       │
│ - routes.requires_wheelchair_access (boolean)          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Accessibility Alert                                     │
│ - "Route X21 wheelchair-accessible vehicle offline"    │
│ - "3 stops without accessible service"                 │
│ - Recommend spare wheelchair-accessible vehicle        │
└─────────────────────────────────────────────────────────┘
```

**Database Changes:**

```sql
-- Add accessibility flag to fleet_vehicles
ALTER TABLE fleet_vehicles ADD COLUMN wheelchair_accessible BOOLEAN DEFAULT FALSE;
ALTER TABLE fleet_vehicles ADD INDEX idx_wheelchair_accessible (wheelchair_accessible);

-- Add accessibility tracking to breakdowns
ALTER TABLE breakdowns ADD COLUMN vehicle_wheelchair_accessible BOOLEAN DEFAULT FALSE;
ALTER TABLE breakdowns ADD COLUMN accessibility_impact ENUM('none', 'minor', 'major', 'critical') DEFAULT 'none';
ALTER TABLE breakdowns ADD INDEX idx_accessibility_impact (accessibility_impact);

-- Create accessibility gap alerts table
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
  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_route_id (route_id),
  INDEX idx_severity (alert_severity)
) ENGINE=InnoDB;
```

**API Endpoints:**

```javascript
// GET /api/accessibility/gaps/live
// Returns: {
//   active_gaps: [
//     { route_id, affected_stops: 8, severity: "high", recommendation: "..." }
//   ]
// }
// Memory: 5MB cached
// Response Time: 20-50ms

// POST /api/accessibility/check-breakdown
// Body: { breakdown_id, fleet_no }
// Returns: { accessibility_impact: "major", affected_stops: [...] }
// Auto-called during breakdown creation
// Memory: 10MB per request
```

**Implementation Steps:**

1. **Week 13, Days 1-2:** Add wheelchair_accessible columns to tables
2. **Week 13, Days 3-4:** Build accessibility gap detection logic
3. **Week 13, Days 5-6:** Create alert API and WebSocket integration
4. **Week 13, Day 7:** Frontend dashboard integration

**Memory Impact:**
- Fleet data: ~1MB (wheelchair flags added to existing data)
- Stop accessibility data: ~2MB (15,000 stops)
- Gap detection: ~10MB per breakdown
- **Total: ~13MB** ✅ Low impact

**Performance Estimates:**
- Accessibility check: 50-100ms per breakdown
- Gap detection query: 100-200ms
- Alert generation: 50ms

**Accessibility Check Algorithm:**

```javascript
async function checkAccessibilityImpact(breakdown) {
  // 1. Get vehicle accessibility status
  const vehicle = await getFleetVehicle(breakdown.fleet_no);
  if (!vehicle.wheelchair_accessible) {
    return { impact: 'none', affected_stops: [] };
  }

  // 2. Get route's wheelchair-required stops
  const wheelchairStops = await query(`
    SELECT s.stop_id, s.stop_name, s.stop_lat, s.stop_lon
    FROM gtfs_stops s
    JOIN gtfs_stop_times st ON s.stop_id = st.stop_id
    JOIN gtfs_trips t ON st.trip_id = t.trip_id
    WHERE t.route_id = ?
      AND s.wheelchair_boarding = 1
      AND st.departure_time > NOW()
      AND st.departure_time < DATE_ADD(NOW(), INTERVAL 2 HOUR)
  `, [breakdown.route_id]);

  // 3. Calculate severity
  const affectedCount = wheelchairStops.length;
  const severity = affectedCount === 0 ? 'none' :
                   affectedCount < 3 ? 'minor' :
                   affectedCount < 8 ? 'major' : 'critical';

  return {
    impact: severity,
    affected_stops: wheelchairStops,
    recommendation: generateAccessibilityRecommendation(affectedCount)
  };
}
```

**Risk Assessment:**
- **Low Risk:** Simple boolean checks and joins
- **Dependency:** Accurate wheelchair_accessible data in fleet database
- **Mitigation:**
  1. One-time data entry for fleet wheelchair status
  2. Default to "unknown" if data missing
  3. Gradual improvement as data quality improves

**Success Criteria:**
- Accessibility checks complete in <200ms
- 100% detection rate for wheelchair vehicle breakdowns
- Alerts generated within 10 seconds
- Memory usage <20MB total

---

#### 10. Real-Time Passenger Notifications

**Business Priority:** Phase 4, Week 14
**Technical Feasibility:** ❌ **LOW** (External dependencies, compliance issues)
**Recommended Priority:** 10 (Not recommended for current infrastructure)

**Description:**
Send SMS/push notifications to passengers affected by breakdowns.

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│ Notification Service (External Integration Required)   │
│ - SMS Gateway: Twilio, AWS SNS, etc. ($$$)            │
│ - Push Notifications: Firebase Cloud Messaging        │
│ - Email: SendGrid, AWS SES                             │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Passenger Database (DOES NOT EXIST)                    │
│ - Requires passenger phone numbers                     │
│ - GDPR compliance for contact data storage             │
│ - Opt-in consent management                            │
│ - Estimated 50,000+ passengers                          │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Notification Queue (Redis or RabbitMQ required)        │
│ - 1,000+ notifications per breakdown                   │
│ - Rate limiting per SMS provider                        │
│ - Retry logic for failed sends                         │
└─────────────────────────────────────────────────────────┘
```

**Why Not Recommended:**

1. **No Passenger Data:** System does not have passenger contact information
2. **GDPR Compliance:** Requires consent management, data protection officer
3. **External Costs:** SMS costs £0.04-0.08 per message (£40-80 per 1,000 passengers)
4. **Infrastructure Requirements:**
   - Message queue (Redis/RabbitMQ)
   - SMS gateway integration
   - Retry/failure handling
   - Legal compliance framework
5. **Memory Impact:** 200-300MB for notification queue + contact database
6. **Alternative:** Go North East likely has existing passenger notification system

**Alternative Approach (Recommended):**

Instead of direct notifications, integrate with existing Go North East systems:
- **Real-time API:** Provide breakdown data to existing passenger apps
- **Public WebSocket:** Allow third-party apps to subscribe to breakdown updates
- **GTFS-RT Feed:** Publish GTFS-Realtime feed (industry standard)

**If Still Required, Minimal Viable Implementation:**

```sql
-- Passenger opt-in table (GDPR-compliant)
CREATE TABLE passenger_notifications_optin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  opted_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  opted_out_at TIMESTAMP NULL,
  notification_preferences JSON DEFAULT NULL,
  INDEX idx_phone (phone_number),
  INDEX idx_opted_in (opted_in_at)
) ENGINE=InnoDB;

-- Notification log
CREATE TABLE notification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
  provider_response JSON DEFAULT NULL,
  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;
```

**Estimated Costs:**
- SMS gateway: £500-1,000/month (10,000 messages)
- Legal compliance: £5,000-10,000 (one-time GDPR audit)
- Infrastructure: Redis/RabbitMQ (additional server, £50/month)
- Development time: 4-6 weeks (Phase 4 → Phase 5)

**Risk Assessment:**
- **High Risk:** Legal, cost, and infrastructure complexity
- **Blocker:** No passenger contact database exists
- **Recommendation:** Defer until business case justifies investment

**Success Criteria (if implemented):**
- 95%+ SMS delivery rate
- <30 seconds from breakdown to notification sent
- GDPR-compliant consent management
- Memory usage <300MB

---

## Revised Implementation Roadmap

### Recommended Phasing (Technical Priority)

**Phase 1: Foundation (Weeks 1-4)**
1. **Live Route Status Dashboard** - Week 1 (Original)
2. **Route Coverage Analysis** - Week 2 (Moved up from Week 3)
3. **Dynamic Spare Vehicle Allocation** - Week 3-4 (Moved up from Phase 2)

**Phase 2: Data Collection & Optimization (Weeks 5-8)**
4. **Stop-Level Incident Heatmap** - Week 5-6 (Moved up from Week 2)
5. **Smart Engineer Dispatch** - Week 7-8 (Moved up from Phase 3)
6. **Historical Data Collection** - Weeks 5-8 (Preparation for predictive features)

**Phase 3: Intelligence & Prediction (Weeks 9-13)**
7. **Predictive Route Alerts** - Week 9-10 (Requires 3+ months data)
8. **Seasonal Risk Profiles** - Week 11-12
9. **Passenger Impact Assessment** - Week 13

**Phase 4: Accessibility & Compliance (Weeks 14-16)**
10. **Stop Accessibility Matching** - Week 14-15
11. **Public GTFS-RT API** - Week 16 (Replaces passenger notifications)

### Why Reordered?

| Feature | Original Phase | New Phase | Reason |
|---------|---------------|-----------|--------|
| Spare Allocation | 2 | 1 | No dependencies, high ROI |
| Stop Heatmap | 1 | 2 | Needs spatial optimization first |
| Engineer Dispatch | 3 | 2 | Uses existing data, quick win |
| Predictive Alerts | 2 | 3 | Requires 3+ months historical data |
| Passenger Notifications | 4 | Deferred | Too complex, external dependencies |

---

## Critical Database Optimizations

### Required Before Any Implementation

```sql
-- 1. Add route_id to breakdowns (most critical)
ALTER TABLE breakdowns ADD COLUMN route_id VARCHAR(100);
ALTER TABLE breakdowns ADD INDEX idx_route_id (route_id);
ALTER TABLE breakdowns ADD INDEX idx_status_route (status, route_id);

-- 2. Spatial indexes for stop proximity
ALTER TABLE gtfs_stops
  ADD COLUMN location POINT GENERATED ALWAYS AS (POINT(stop_lon, stop_lat)) STORED;
CREATE SPATIAL INDEX idx_stop_location_spatial ON gtfs_stops(location);

-- 3. Composite indexes for common queries
ALTER TABLE gtfs_stop_times
  ADD INDEX idx_trip_stop_time (trip_id, stop_id, departure_time);

-- 4. Breakdown location optimization
ALTER TABLE breakdowns
  ADD COLUMN location_point POINT GENERATED ALWAYS AS
    (POINT(location_lng, location_lat)) STORED;
CREATE SPATIAL INDEX idx_breakdown_location ON breakdowns(location_point);

-- 5. Materialized view for route statistics (optional but recommended)
CREATE TABLE route_stats_cache (
  route_id VARCHAR(100) PRIMARY KEY,
  total_stops INT,
  total_trips INT,
  active_breakdowns INT DEFAULT 0,
  status ENUM('green', 'amber', 'red') DEFAULT 'green',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### Memory-Efficient Query Patterns

**Bad (Memory-intensive):**
```sql
-- Loads entire 2M record set into memory
SELECT * FROM gtfs_stop_times
WHERE departure_time > NOW();
```

**Good (Indexed, filtered):**
```sql
-- Uses index, filters early, limits results
SELECT st.*
FROM gtfs_stop_times st
JOIN gtfs_trips t ON st.trip_id = t.trip_id
WHERE t.route_id = '21'
  AND st.departure_time BETWEEN '08:00:00' AND '10:00:00'
LIMIT 100;
```

---

## Performance Optimization Strategies

### 1. Aggressive Caching

```javascript
import NodeCache from 'node-cache';

// Route status cache (30-second TTL)
const routeStatusCache = new NodeCache({
  stdTTL: 30,
  checkperiod: 60,
  maxKeys: 500
});

// GTFS query cache (5-minute TTL)
const gtfsQueryCache = new NodeCache({
  stdTTL: 300,
  checkperiod: 600,
  maxKeys: 1000
});

// Example usage
async function getRouteStatus(routeId) {
  const cacheKey = `route_status_${routeId}`;

  // Check cache first
  const cached = routeStatusCache.get(cacheKey);
  if (cached) return cached;

  // Query database
  const status = await queryRouteStatus(routeId);

  // Cache result
  routeStatusCache.set(cacheKey, status);

  return status;
}
```

**Memory Allocation:**
- Route status cache: 10MB (231 routes)
- GTFS query cache: 50MB (1,000 queries)
- Total: 60MB (acceptable)

### 2. Background Job Architecture

```javascript
// Use PM2 ecosystem for cron jobs
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'breakdown-api',
      script: './server.js',
      instances: 1,
      max_memory_restart: '1800M'
    },
    {
      name: 'route-coverage-analyzer',
      script: './jobs/route-coverage.js',
      cron_restart: '*/15 * * * *', // Every 15 minutes
      autorestart: false,
      max_memory_restart: '500M'
    },
    {
      name: 'seasonal-analyzer',
      script: './jobs/seasonal-analysis.js',
      cron_restart: '0 2 * * *', // Daily at 2 AM
      autorestart: false,
      max_memory_restart: '500M'
    }
  ]
};
```

### 3. Query Result Pagination

```javascript
// Always paginate large result sets
router.get('/api/routes/all', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = (page - 1) * limit;

  const routes = await query(
    'SELECT * FROM gtfs_routes ORDER BY route_short_name LIMIT ? OFFSET ?',
    [limit, offset]
  );

  const [countResult] = await query('SELECT COUNT(*) as total FROM gtfs_routes');

  res.json({
    data: routes,
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      pages: Math.ceil(countResult[0].total / limit)
    }
  });
});
```

### 4. Streaming for Large Datasets

```javascript
// Stream large result sets to avoid memory spikes
router.get('/api/gtfs/stop-times/export', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');

  let first = true;
  const stream = pool.query('SELECT * FROM gtfs_stop_times')
    .stream({ highWaterMark: 5 });

  stream.on('data', (row) => {
    if (!first) res.write(',');
    res.write(JSON.stringify(row));
    first = false;
  });

  stream.on('end', () => {
    res.write(']');
    res.end();
  });

  stream.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});
```

---

## Memory Management Best Practices

### 1. Connection Pool Tuning

```javascript
// backend/config/mysql.js
const dbConfig = {
  connectionLimit: 10, // Current setting
  // Optimize for 2GB RAM:
  // - 10 connections × ~3MB each = 30MB
  // - Reduce to 5 if memory pressure increases

  queueLimit: 0, // Unlimited queue (requests wait)
  waitForConnections: true,

  // Clean up idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Don't cache prepared statements (saves memory)
  cache: false
};
```

### 2. Monitor Memory Usage

```javascript
// Add memory monitoring endpoint
app.get('/api/system/memory', (req, res) => {
  const used = process.memoryUsage();
  const mb = (bytes) => Math.round(bytes / 1024 / 1024);

  res.json({
    rss: `${mb(used.rss)} MB`, // Total memory
    heapTotal: `${mb(used.heapTotal)} MB`, // Heap allocated
    heapUsed: `${mb(used.heapUsed)} MB`, // Heap used
    external: `${mb(used.external)} MB`, // C++ objects
    available: `${2048 - mb(used.rss)} MB`, // Remaining
    warning: mb(used.rss) > 1800 ? 'Critical memory usage' : null
  });
});

// Auto-restart if memory exceeds threshold
setInterval(() => {
  const used = process.memoryUsage();
  const usedMB = Math.round(used.rss / 1024 / 1024);

  if (usedMB > 1900) {
    console.error('⚠️  Memory limit exceeded, initiating graceful shutdown');
    process.exit(1); // PM2 will restart
  }
}, 60000); // Check every minute
```

### 3. Garbage Collection Optimization

```javascript
// Start Node.js with optimized GC flags
// package.json
{
  "scripts": {
    "start": "node --max-old-space-size=1800 --gc-interval=100 server.js"
  }
}
```

---

## Sample API Endpoint Implementations

### Example 1: Live Route Status

```javascript
// backend/routes/routeStatus.js
import express from 'express';
import { query } from '../config/mysql.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30 });

router.get('/status/live', async (req, res) => {
  try {
    // Check cache
    const cached = cache.get('route_status_all');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Query active breakdowns by route
    const breakdownsByRoute = await query(`
      SELECT
        route_id,
        COUNT(*) as breakdown_count,
        MAX(severity) as max_severity,
        MAX(created_at) as last_breakdown_time
      FROM breakdowns
      WHERE status IN ('active', 'pending', 'in-progress')
        AND route_id IS NOT NULL
      GROUP BY route_id
    `);

    // Get all routes
    const allRoutes = await query(`
      SELECT route_id, route_short_name, route_long_name
      FROM gtfs_routes
      ORDER BY route_short_name
    `);

    // Merge data and calculate status
    const routeStatuses = allRoutes.map(route => {
      const breakdown = breakdownsByRoute.find(b => b.route_id === route.route_id);

      let status = 'green';
      if (breakdown) {
        if (breakdown.breakdown_count >= 3) status = 'red';
        else if (breakdown.breakdown_count >= 1) status = 'amber';
      }

      return {
        route_id: route.route_id,
        route_name: route.route_short_name,
        route_description: route.route_long_name,
        status,
        active_breakdowns: breakdown?.breakdown_count || 0,
        last_breakdown: breakdown?.last_breakdown_time || null
      };
    });

    // Cache result
    cache.set('route_status_all', routeStatuses);

    res.json({
      success: true,
      data: routeStatuses,
      cached: false,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Route status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch route status'
    });
  }
});

export default router;
```

### Example 2: Spare Vehicle Allocation

```javascript
// backend/services/spareAllocation.js
import { query } from '../config/mysql.js';

// Calculate distance between two points (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function recommendSpareVehicle(breakdown) {
  // 1. Get available spare vehicles
  const spares = await query(`
    SELECT
      fleet_no,
      depot,
      vehicle_type,
      current_location_lat,
      current_location_lng
    FROM spare_vehicles
    WHERE current_status = 'available'
      AND depot = ?
  `, [breakdown.depot]);

  if (spares.length === 0) {
    return {
      success: false,
      message: 'No spare vehicles available at depot'
    };
  }

  // 2. Calculate distance and score for each spare
  const scored = spares.map(spare => {
    const distance = haversineDistance(
      spare.current_location_lat,
      spare.current_location_lng,
      breakdown.location_lat,
      breakdown.location_lng
    );

    // Priority score: closer is better
    const priorityScore = Math.max(0, 100 - (distance * 10));

    return {
      ...spare,
      distance_km: distance,
      eta_minutes: Math.ceil(distance / 0.5), // 30 km/h average
      priority_score: priorityScore
    };
  });

  // 3. Sort by priority and return top recommendation
  scored.sort((a, b) => b.priority_score - a.priority_score);

  const recommendation = scored[0];

  // 4. Save recommendation to database
  await query(`
    INSERT INTO spare_allocation_recommendations
    (breakdown_id, recommended_spare_fleet_no, recommendation_reason,
     distance_km, estimated_arrival_minutes, priority_score)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    breakdown.breakdown_id,
    recommendation.fleet_no,
    `Nearest available spare vehicle (${recommendation.distance_km.toFixed(1)}km away)`,
    recommendation.distance_km,
    recommendation.eta_minutes,
    recommendation.priority_score
  ]);

  return {
    success: true,
    recommendation: {
      spare_fleet_no: recommendation.fleet_no,
      distance_km: recommendation.distance_km,
      eta_minutes: recommendation.eta_minutes,
      depot: recommendation.depot
    }
  };
}
```

---

## Risk Mitigation Matrix

| Risk Category | Probability | Impact | Mitigation |
|---------------|-------------|--------|------------|
| **Memory Overflow** | High | Critical | Aggressive caching, pagination, streaming |
| **Slow GTFS Queries** | Medium | High | Spatial indexes, materialized views |
| **Database Lock Contention** | Low | Medium | Read replicas (future), query optimization |
| **WebSocket Scaling** | Medium | Medium | Connection limits, Redis pub/sub (future) |
| **Data Quality Issues** | High | Medium | Validation on import, fallback logic |
| **Historical Data Gaps** | High | Low | Progressive feature enablement |
| **External API Failures** | Low | Low | Timeouts, circuit breakers |

---

## Success Metrics & Monitoring

### Key Performance Indicators (KPIs)

**System Health:**
- Memory usage: <1.8GB sustained (alert at 1.9GB)
- API response time: p95 <500ms, p99 <1s
- Database query time: p95 <200ms, p99 <500ms
- WebSocket latency: <100ms

**Feature Effectiveness:**
- Route status accuracy: >95%
- Spare allocation acceptance rate: >80%
- Predictive alert accuracy: >60% (Phase 3)
- Engineer dispatch response time: -20% improvement

### Monitoring Dashboard (Recommended)

```javascript
// Add Prometheus-style metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cache: {
      route_status: routeStatusCache.getStats(),
      gtfs_query: gtfsQueryCache.getStats()
    },
    database: {
      pool: db.getPoolStats()
    }
  };

  res.json(metrics);
});
```

---

## Conclusion & Recommendations

### High-Priority Actions (Immediate)

1. **Add route_id to breakdowns table** (Critical dependency for all features)
2. **Create spatial indexes** on gtfs_stops and breakdowns tables
3. **Implement aggressive caching** (node-cache with 30-60 second TTLs)
4. **Set up memory monitoring** (alert at 1.9GB usage)

### Feature Implementation Order (Technical)

**Phase 1 (Weeks 1-4):** Foundation
- ✅ Live Route Status Dashboard (Week 1)
- ✅ Route Coverage Analysis (Week 2)
- ✅ Dynamic Spare Allocation (Weeks 3-4)

**Phase 2 (Weeks 5-8):** Optimization & Intelligence
- ⚠️ Stop-Level Heatmap (Weeks 5-6) - Monitor memory closely
- ✅ Smart Engineer Dispatch (Weeks 7-8)

**Phase 3 (Weeks 9-13):** Prediction & Analysis
- ⚠️ Predictive Alerts (Weeks 9-10) - Requires 3+ months data
- ✅ Seasonal Risk Profiles (Weeks 11-12)
- ⚠️ Passenger Impact (Week 13) - Complex queries

**Phase 4 (Weeks 14-16):** Compliance & Integration
- ✅ Stop Accessibility (Weeks 14-15)
- ✅ Public GTFS-RT API (Week 16) - Replaces passenger notifications

### Not Recommended

- ❌ **Real-Time Passenger Notifications** - Too complex, defer indefinitely

### Infrastructure Upgrades (Future Consideration)

If features prove successful and usage grows:
1. **Redis for caching** - Offload memory to dedicated cache server (£20-50/month)
2. **Read replica** - Separate database for reporting/analytics queries (£50-100/month)
3. **Load balancer** - Multiple backend instances with sticky sessions (£30-50/month)
4. **Upgrade to 4GB RAM** - If cPanel allows, provides more headroom (£10-20/month)

**Total Cost (All Upgrades):** £110-220/month (only if needed)

---

## Appendix: Database Schema Diagrams

### Existing Schema (Simplified)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  fleet_vehicles │     │   breakdowns     │     │   supervisors   │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ fleet_no (PK)   │────<│ fleet_no (FK)    │     │ id (PK)         │
│ depot           │     │ breakdown_id     │────<│ badge_number    │
│ vehicle_type    │     │ status           │     │ depot           │
│ health_score    │     │ location_lat     │     │ role            │
└─────────────────┘     │ location_lng     │     └─────────────────┘
                        │ route_id (NEW)   │
                        │ severity         │
                        └──────────────────┘
```

### GTFS Schema (Existing, Not Populated)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ gtfs_routes  │     │ gtfs_trips   │     │ gtfs_stop_times  │     │ gtfs_stops   │
├──────────────┤     ├──────────────┤     ├──────────────────┤     ├──────────────┤
│ route_id(PK) │────<│ route_id(FK) │────<│ trip_id (FK)     │────>│ stop_id (PK) │
│ route_short  │     │ trip_id (PK) │     │ stop_id (FK)     │     │ stop_name    │
│ route_long   │     │ service_id   │     │ stop_sequence    │     │ stop_lat     │
│ route_type   │     │ direction_id │     │ arrival_time     │     │ stop_lon     │
└──────────────┘     └──────────────┘     │ departure_time   │     │ wheelchair   │
                                           └──────────────────┘     └──────────────┘
```

### Proposed New Tables (By Feature)

**Route Status:**
- `route_status_cache` (materialized view of route health)

**Stop Heatmap:**
- `stop_breakdown_clusters` (pre-computed aggregation)

**Spare Allocation:**
- `spare_vehicles` (spare vehicle tracking)
- `spare_allocation_recommendations` (allocation suggestions)

**Predictive Alerts:**
- `route_prediction_models` (trained statistical models)
- `route_prediction_alerts` (generated predictions)

**Engineer Dispatch:**
- `engineer_dispatch_recommendations` (dispatch suggestions)

**Seasonal Risk:**
- `seasonal_risk_profiles` (seasonal patterns)
- `weather_snapshots` (optional weather tracking)

**Accessibility:**
- `accessibility_gap_alerts` (wheelchair service gaps)

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Author:** Backend Architecture Specialist
**Review Status:** Ready for Implementation

---

## Quick Reference: Feature Feasibility Summary

| # | Feature | Feasibility | Memory | Query Time | Complexity | Priority |
|---|---------|-------------|--------|------------|------------|----------|
| 1 | Route Status | ✅ High | 8MB | 50ms | Low | 1 |
| 2 | Stop Heatmap | ⚠️ Medium | 75MB | 500ms | Medium | 4 |
| 3 | Coverage Analysis | ✅ High | 92MB | 50ms | Low | 2 |
| 4 | Predictive Alerts | ⚠️ Medium | 225MB | 200ms | High | 6 |
| 5 | Spare Allocation | ✅ High | 25MB | 100ms | Low | 3 |
| 6 | Engineer Dispatch | ✅ High | 25MB | 200ms | Low | 5 |
| 7 | Seasonal Risk | ✅ High | 165MB | 50ms | Medium | 7 |
| 8 | Passenger Impact | ⚠️ Medium | 70MB | 1s | Medium | 8 |
| 9 | Accessibility | ✅ High | 13MB | 100ms | Low | 9 |
| 10 | Notifications | ❌ Low | 300MB | - | Very High | Deferred |

**Legend:**
- ✅ High: Ready for implementation, low risk
- ⚠️ Medium: Feasible with optimizations, moderate risk
- ❌ Low: Not recommended for current infrastructure

**Total Estimated Memory (All Features):** ~1,000MB (within 2GB limit with 1GB buffer)
