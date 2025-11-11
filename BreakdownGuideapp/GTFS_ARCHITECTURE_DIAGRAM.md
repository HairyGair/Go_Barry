# GTFS Feature Architecture - System Diagrams

**Date:** November 10, 2025
**System:** Go BARRY Breakdown Management System

---

## System Overview - Current State + GTFS Integration

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Breakdown    │  │ Route Status │  │ Spare Alloc  │  │ Engineering  │  │
│  │ Management   │  │ Dashboard    │  │ Dashboard    │  │ Dispatch     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │                  │
          │ REST API         │ WebSocket        │ REST API         │ WebSocket
          │                  │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────▼─────────┐
│                      BACKEND (Node.js + Express + PM2)                     │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ API Routes Layer                                                   │    │
│  │  - /api/breakdowns      - /api/routes/status                      │    │
│  │  - /api/spares          - /api/engineering/dispatch               │    │
│  │  - /api/routes/coverage - /api/routes/predictions                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Services Layer                                                     │    │
│  │  - routeStatusService    - spareAllocationService                 │    │
│  │  - engineerDispatch      - passengerImpactCalculator              │    │
│  │  - seasonalAnalyzer      - accessibilityChecker                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Caching Layer (node-cache)                                         │    │
│  │  - Route Status: 30s TTL, 10MB                                     │    │
│  │  - GTFS Queries: 5min TTL, 50MB                                    │    │
│  │  - Coverage Analysis: 15min TTL, 10MB                              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Background Jobs (PM2 Cron)                                         │    │
│  │  - route-coverage-analyzer (every 15 min)                          │    │
│  │  - stop-cluster-generator (every 5 min)                            │    │
│  │  - prediction-model-trainer (weekly)                               │    │
│  │  - seasonal-analyzer (monthly)                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ WebSocket Handler (ws package)                                     │    │
│  │  - /ws/sdc-dashboard        - /ws/route-status                     │    │
│  │  - /ws/engineering-display  - /ws/gtfs-rt (public)                │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                     MySQL Connection Pool (10 connections)
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                   MYSQL DATABASE @ 85.234.151.224                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Existing Tables                                                    │    │
│  │  - fleet_vehicles (1,000+ records)                                 │    │
│  │  - breakdowns (growing, ~10,000+ records)                          │    │
│  │  - supervisors (9 active users)                                    │    │
│  │  - activities (activity log)                                       │    │
│  │  - engineers (50 engineers)                                        │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ GTFS Tables (To Be Populated)                                     │    │
│  │  - gtfs_routes (~231 routes)                                       │    │
│  │  - gtfs_stops (~15,000 stops)                                      │    │
│  │  - gtfs_trips (~50,000 trips)                                      │    │
│  │  - gtfs_stop_times (~2,000,000 records) ⚠️ LARGE                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ New GTFS Feature Tables (Phase 1-4)                               │    │
│  │  - route_status_cache                                              │    │
│  │  - route_coverage_analysis                                         │    │
│  │  - route_overlaps (pre-computed)                                   │    │
│  │  - spare_vehicles                                                  │    │
│  │  - spare_allocation_recommendations                                │    │
│  │  - stop_breakdown_clusters                                         │    │
│  │  - engineer_dispatch_recommendations                               │    │
│  │  - route_prediction_models                                         │    │
│  │  - seasonal_risk_profiles                                          │    │
│  │  - accessibility_gap_alerts                                        │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Indexes (Critical for Performance)                                │    │
│  │  - idx_status_route (breakdowns.status, breakdowns.route_id)      │    │
│  │  - idx_stop_location_spatial (gtfs_stops.location) SPATIAL        │    │
│  │  - idx_breakdown_location (breakdowns.location_point) SPATIAL     │    │
│  │  - idx_trip_stop_time (gtfs_stop_times composite)                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Integration Flow - Breakdown Creation with GTFS Enrichment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Supervisor Creates Breakdown                                       │
└────────┬────────────────────────────────────────────────────────────────────┘
         │
         │ POST /api/breakdowns
         │ Body: {
         │   fleet_no: "6377",
         │   location_lat: 54.9783,
         │   location_lng: -1.6178,
         │   issue_category: "Engine",
         │   wizard_assessment_data: { route: "21" }
         │ }
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Backend Enrichment Pipeline                                       │
│                                                                            │
│  2a. Extract route_id                                                     │
│      route_id = wizard_assessment_data.route || auto-detect               │
│                                                                            │
│  2b. Find nearest stop (if location provided)                            │
│      CALL sp_find_nearest_stops(54.9783, -1.6178, 5)                     │
│      nearest_stop_id = result[0].stop_id                                  │
│                                                                            │
│  2c. Check vehicle accessibility                                         │
│      SELECT wheelchair_accessible FROM fleet_vehicles                     │
│      WHERE fleet_no = '6377'                                              │
│                                                                            │
│  2d. Calculate passenger impact (if route_id known)                      │
│      trips_affected = COUNT(trips in next 2 hours on route)              │
│      estimated_passengers = trips_affected × avg_passengers_per_trip      │
│                                                                            │
│  2e. Recommend spare vehicle                                             │
│      spareAllocationService.recommendSpare(breakdown)                     │
│                                                                            │
│  2f. Recommend engineer                                                   │
│      engineerDispatch.findBestMatch(breakdown)                            │
│                                                                            │
└────────┬───────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Save Enriched Breakdown                                           │
│                                                                            │
│  INSERT INTO breakdowns (                                                 │
│    breakdown_id, fleet_no, location_lat, location_lng,                   │
│    route_id,                    ← NEW GTFS FIELD                         │
│    nearest_stop_id,             ← NEW GTFS FIELD                         │
│    estimated_passengers_affected, ← NEW GTFS FIELD                       │
│    trips_affected_count,        ← NEW GTFS FIELD                         │
│    vehicle_wheelchair_accessible, ← NEW GTFS FIELD                       │
│    accessibility_impact,        ← NEW GTFS FIELD                         │
│    ...                                                                    │
│  )                                                                         │
│                                                                            │
└────────┬───────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Real-time Updates (WebSocket Broadcasts)                          │
│                                                                            │
│  4a. Update route status cache                                            │
│      UPDATE route_status_cache                                             │
│      SET active_breakdowns = active_breakdowns + 1,                        │
│          status = 'amber',                                                 │
│          last_breakdown_time = NOW()                                       │
│      WHERE route_id = '21'                                                 │
│                                                                            │
│  4b. Broadcast to SDC Dashboard                                           │
│      webSocketHandler.broadcastToSDCDashboard({                            │
│        type: 'new_breakdown',                                              │
│        breakdown: enrichedBreakdown                                        │
│      })                                                                    │
│                                                                            │
│  4c. Broadcast route status update                                        │
│      webSocketHandler.broadcast('route-status', {                          │
│        route_id: '21',                                                     │
│        status: 'amber',                                                    │
│        breakdown_count: 2                                                  │
│      })                                                                    │
│                                                                            │
│  4d. Broadcast spare allocation recommendation                            │
│      webSocketHandler.broadcast('sdc-dashboard', {                         │
│        type: 'spare_recommendation',                                       │
│        breakdown_id: 'BRK-20251110-001',                                   │
│        spare_fleet_no: '6999',                                             │
│        eta_minutes: 15                                                     │
│      })                                                                    │
│                                                                            │
│  4e. Notify assigned engineer (if auto-assigned)                          │
│      webSocketHandler.notifyEngineer(engineer_id, {                        │
│        type: 'new_assignment',                                             │
│        breakdown: breakdown                                                │
│      })                                                                    │
│                                                                            │
└────────┬───────────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Trigger Analysis Jobs (Async)                                     │
│                                                                            │
│  5a. Update stop breakdown cluster                                        │
│      UPDATE stop_breakdown_clusters                                        │
│      SET breakdown_count_24h = breakdown_count_24h + 1                     │
│      WHERE stop_id = nearest_stop_id                                       │
│                                                                            │
│  5b. Check for critical patterns                                          │
│      IF (same defect on 5+ vehicles in 24h)                               │
│         webSocketHandler.broadcastCriticalPattern(...)                     │
│                                                                            │
│  5c. Update coverage analysis (next 15-min job)                           │
│      Mark route_coverage_analysis as stale                                 │
│      Next cron job will recalculate                                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Memory Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        2GB RAM ALLOCATION PLAN                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ NODE.JS RUNTIME                                          80 MB   │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ EXPRESS APP + MIDDLEWARE                                 50 MB   │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ MYSQL CONNECTION POOL (10 connections)                   30 MB   │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ WEBSOCKET CONNECTIONS (10-20 active)                     20 MB   │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ NODE-CACHE (Route Status + GTFS Queries)                60 MB   │      │
│  │  - Route Status Cache (30s TTL)              10 MB              │      │
│  │  - GTFS Query Cache (5min TTL)               50 MB              │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ ACTIVE REQUEST PROCESSING                               100 MB   │      │
│  │  - Query buffers, JSON parsing, response building                │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ BUFFER FOR GARBAGE COLLECTION                            50 MB   │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ──────────────────────────────────────────────────────────────────        │
│  BASELINE USAGE:                                           390 MB          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ AVAILABLE FOR FEATURES                                1,610 MB   │      │
│  │                                                                  │      │
│  │  Phase 1 Features (Concurrent):                       125 MB    │      │
│  │    - Route Status Dashboard             8 MB                    │      │
│  │    - Route Coverage Analysis           92 MB (peak)             │      │
│  │    - Spare Vehicle Allocation          25 MB                    │      │
│  │                                                                  │      │
│  │  Phase 2 Features (Concurrent):                       100 MB    │      │
│  │    - Stop Heatmap                      75 MB (peak)             │      │
│  │    - Engineer Dispatch                 25 MB                    │      │
│  │                                                                  │      │
│  │  Phase 3 Features (Sequential):                       225 MB    │      │
│  │    - Predictive Alerts (training)     225 MB (background)       │      │
│  │    - Seasonal Analysis (batch)        165 MB (background)       │      │
│  │    - Passenger Impact                  70 MB                    │      │
│  │                                                                  │      │
│  │  Phase 4 Features:                                     53 MB    │      │
│  │    - Accessibility Matching            13 MB                    │      │
│  │    - GTFS-RT API                       40 MB                    │      │
│  │                                                                  │      │
│  │  PEAK CONCURRENT USAGE:               ~600 MB                   │      │
│  │  REMAINING SAFETY BUFFER:            1,010 MB ✅                │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │ CRITICAL THRESHOLD: 1,900 MB                                     │      │
│  │ → Auto-restart triggered if exceeded                             │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

MEMORY OPTIMIZATION STRATEGIES:
1. Aggressive caching with short TTLs (30s - 5min)
2. Pagination for all large result sets (max 100 records)
3. Streaming for exports (no full-dataset loads)
4. Background jobs run during off-peak hours
5. Database connection pool limited to 10
6. Query result limits enforced in SQL
7. Garbage collection optimized (--gc-interval=100)
```

---

## Query Performance Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE QUERY OPTIMIZATION                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: INDEX-BASED QUERIES (Fast, <50ms)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query: Get route status for all routes                                    │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ SELECT route_id, COUNT(*) as breakdown_count                      │     │
│  │ FROM breakdowns                                                   │     │
│  │ WHERE status IN ('active', 'pending')                             │     │
│  │ GROUP BY route_id                                                 │     │
│  │                                                                   │     │
│  │ Index Used: idx_status_route (status, route_id)                  │     │
│  │ Query Time: 20-50ms                                               │     │
│  │ Rows Scanned: ~100 (active breakdowns only)                      │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 2: SPATIAL QUERIES (Medium, 100-500ms with optimization)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query: Find nearest stops to breakdown location                           │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ CALL sp_find_nearest_stops(54.9783, -1.6178, 5)                  │     │
│  │                                                                   │     │
│  │ Uses: Haversine formula + SPATIAL index                          │     │
│  │ Index Used: idx_stop_location_spatial (location POINT)           │     │
│  │ Query Time: 50-100ms                                              │     │
│  │ Rows Scanned: ~100 (bounding box filter)                         │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Optimization: Pre-compute nearest_stop_id on breakdown creation           │
│  Result: Eliminates real-time spatial query (0ms on read)                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 3: AGGREGATION QUERIES (Slow, 1-5s without optimization)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query: Calculate passenger impact for route                               │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ SELECT COUNT(*) as trips_affected                                 │     │
│  │ FROM gtfs_stop_times st                                           │     │
│  │ JOIN gtfs_trips t ON st.trip_id = t.trip_id                       │     │
│  │ WHERE t.route_id = '21'                                           │     │
│  │   AND st.departure_time BETWEEN '14:00:00' AND '16:00:00'        │     │
│  │                                                                   │     │
│  │ Problem: Scans 2M+ records in gtfs_stop_times                    │     │
│  │ Query Time: 1-5 seconds (unacceptable)                            │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Optimization Strategy: PRE-COMPUTE route frequency                         │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ CREATE TABLE route_frequency_cache (                              │     │
│  │   route_id, time_of_day_hour, day_of_week,                        │     │
│  │   trips_per_hour, avg_passengers_per_trip                         │     │
│  │ )                                                                 │     │
│  │                                                                   │     │
│  │ SELECT trips_per_hour FROM route_frequency_cache                 │     │
│  │ WHERE route_id = '21' AND time_of_day_hour = 14                  │     │
│  │                                                                   │     │
│  │ Query Time: <10ms (indexed lookup)                                │     │
│  │ Rows Scanned: 1                                                  │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LEVEL 4: ANALYTICAL QUERIES (Very Slow, 5-60s - BACKGROUND JOBS ONLY)      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Query: Calculate route overlap matrix (231 routes = 26,565 comparisons)   │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │ INSERT INTO route_overlaps                                        │     │
│  │ SELECT a.route_id, b.route_id, COUNT(DISTINCT a.stop_id)         │     │
│  │ FROM (SELECT route_id, stop_id FROM gtfs_stop_times              │     │
│  │       JOIN gtfs_trips USING(trip_id)) a                           │     │
│  │ JOIN (SELECT route_id, stop_id FROM gtfs_stop_times              │     │
│  │       JOIN gtfs_trips USING(trip_id)) b                           │     │
│  │   ON a.stop_id = b.stop_id AND a.route_id < b.route_id           │     │
│  │ GROUP BY a.route_id, b.route_id                                   │     │
│  │                                                                   │     │
│  │ Query Time: 30-60 seconds                                         │     │
│  │ Run Once: During GTFS import                                      │     │
│  │ Update: Only when GTFS data changes (rare)                        │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  Usage Pattern: Run in background, cache results                           │
│  Read Performance: <10ms (indexed lookup in route_overlaps table)          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

QUERY OPTIMIZATION RULES:
1. ALWAYS use indexes for WHERE, JOIN, ORDER BY
2. NEVER query gtfs_stop_times without filtering by trip_id or time range
3. Pre-compute aggregations, store in cache tables
4. Use stored procedures for complex spatial queries
5. Batch analytical queries in background jobs
6. Limit result sets to 100 rows max (pagination)
7. Monitor slow queries: EXPLAIN before deploying
```

---

## WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET BROADCAST ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WEBSOCKET SERVER (backend/routes/webSocketHandler.js)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Connection Types:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │ 1. SDC Dashboard              ws://api/ws/sdc-dashboard         │       │
│  │    - Requires JWT auth token                                    │       │
│  │    - 5-10 concurrent connections                                │       │
│  │    - Receives: breakdown updates, recommendations               │       │
│  │                                                                 │       │
│  │ 2. Route Status Monitor       ws://api/ws/route-status          │       │
│  │    - Public access (read-only)                                  │       │
│  │    - 10-20 concurrent connections                               │       │
│  │    - Receives: route status changes                             │       │
│  │                                                                 │       │
│  │ 3. Engineering Display        ws://api/ws/engineering-display   │       │
│  │    - Public access (depot-filtered)                             │       │
│  │    - 6-10 concurrent connections (one per depot)                │       │
│  │    - Receives: depot-specific breakdowns                        │       │
│  │                                                                 │       │
│  │ 4. GTFS-RT Public Feed        ws://api/ws/gtfs-rt              │       │
│  │    - Public access with rate limiting                           │       │
│  │    - 20-50 concurrent connections                               │       │
│  │    - Receives: GTFS-Realtime formatted updates                  │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ BROADCAST FLOW                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

  Event: New breakdown created
    │
    ├─> webSocketHandler.broadcastToSDCDashboard({
    │     type: 'new_breakdown',
    │     breakdown: { id, fleet_no, location, severity, ... }
    │   })
    │   → Sent to: 5-10 SDC Dashboard clients
    │   → Latency: 5-10ms
    │
    ├─> webSocketHandler.broadcast('route-status', {
    │     type: 'route_status_update',
    │     route_id: '21',
    │     status: 'amber',
    │     breakdown_count: 2
    │   })
    │   → Sent to: 10-20 route monitor clients
    │   → Latency: 5-10ms
    │
    ├─> webSocketHandler.broadcastToEngineeringDisplays({
    │     type: 'new_breakdown',
    │     breakdown: { ... },
    │     depot: 'Washington'
    │   })
    │   → Sent to: Washington depot display only (filtered)
    │   → Latency: 5-10ms
    │
    └─> webSocketHandler.broadcast('gtfs-rt', {
          type: 'service_alert',
          gtfs_rt_format: { ... }
        })
        → Sent to: All GTFS-RT subscribers
        → Latency: 10-20ms

┌─────────────────────────────────────────────────────────────────────────────┐
│ CONNECTION MANAGEMENT                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Max Connections: 50 (configurable)                                         │
│  Connection Timeout: 30 seconds idle                                        │
│  Ping/Pong Heartbeat: Every 30 seconds                                      │
│  Reconnect Logic: Exponential backoff (client-side)                         │
│                                                                             │
│  Memory Per Connection: ~1-2MB                                              │
│  Total WebSocket Memory: ~50-100MB (50 connections max)                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CPANEL + PM2 DEPLOYMENT                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ cPanel Server @ 85.234.151.224                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ PM2 Process Manager                                                │    │
│  │                                                                    │    │
│  │  breakdown-api (Main Server)                                      │    │
│  │    - Port: 3001                                                   │    │
│  │    - Memory Limit: 1800MB                                         │    │
│  │    - Auto-restart: Yes                                            │    │
│  │                                                                    │    │
│  │  route-coverage-analyzer (Cron Job)                               │    │
│  │    - Schedule: */15 * * * * (every 15 minutes)                    │    │
│  │    - Memory Limit: 500MB                                          │    │
│  │    - Auto-restart: No (runs once per schedule)                    │    │
│  │                                                                    │    │
│  │  stop-cluster-generator (Cron Job)                                │    │
│  │    - Schedule: */5 * * * * (every 5 minutes)                      │    │
│  │    - Memory Limit: 500MB                                          │    │
│  │    - Auto-restart: No                                             │    │
│  │                                                                    │    │
│  │  prediction-model-trainer (Cron Job)                              │    │
│  │    - Schedule: 0 2 * * 0 (Sunday 2 AM)                            │    │
│  │    - Memory Limit: 500MB                                          │    │
│  │    - Auto-restart: No                                             │    │
│  │                                                                    │    │
│  │  seasonal-analyzer (Cron Job)                                     │    │
│  │    - Schedule: 0 3 1 * * (1st of month, 3 AM)                     │    │
│  │    - Memory Limit: 500MB                                          │    │
│  │    - Auto-restart: No                                             │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ MySQL Server                                                       │    │
│  │    - Host: localhost (85.234.151.224)                              │    │
│  │    - Port: 3306                                                    │    │
│  │    - Database: gobarryco_breakdowns                                │    │
│  │    - Connection Pool: 10 connections                               │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ Static Frontend (cPanel File Manager)                             │    │
│  │    - Location: ~/public_html/breakdowns.gobarry.co.uk/            │    │
│  │    - Built with: Vite (npm run build)                             │    │
│  │    - Served by: Apache                                             │    │
│  │    - URL: https://breakdowns.gobarry.co.uk                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CLIENT ACCESS                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend:  https://breakdowns.gobarry.co.uk                               │
│  Backend:   https://api.breakdowns.gobarry.co.uk                           │
│  WebSocket: wss://api.breakdowns.gobarry.co.uk/ws                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Route Status Dashboard (Example)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ USER LOADS ROUTE STATUS DASHBOARD                                       │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 1. Frontend: GET /api/routes/status/live
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Backend: Check cache                                                    │
│  - Cache Key: 'route_status_all'                                        │
│  - TTL: 30 seconds                                                      │
│  - Cache Hit? ──YES──> Return cached data (10-20ms)                     │
│              └─NO──> Continue to database query                         │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 2. Query MySQL
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Query 1: Get active breakdowns by route                                 │
│  SELECT route_id, COUNT(*) as breakdown_count                           │
│  FROM breakdowns                                                         │
│  WHERE status IN ('active', 'pending', 'in-progress')                   │
│    AND route_id IS NOT NULL                                             │
│  GROUP BY route_id                                                       │
│                                                                          │
│  Index Used: idx_status_route                                           │
│  Query Time: 20-30ms                                                    │
│  Rows Returned: ~20 routes with active breakdowns                       │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 3. Query MySQL again
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Query 2: Get all routes                                                 │
│  SELECT route_id, route_short_name, route_long_name                     │
│  FROM gtfs_routes                                                        │
│  ORDER BY route_short_name                                               │
│                                                                          │
│  Index Used: idx_route_short_name                                       │
│  Query Time: 10-20ms                                                    │
│  Rows Returned: 231 routes                                              │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 4. Merge and calculate status
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Backend Logic:                                                          │
│  For each route:                                                        │
│    - Check if breakdowns exist                                          │
│    - Calculate status:                                                  │
│        0 breakdowns   → GREEN                                           │
│        1-2 breakdowns → AMBER                                           │
│        3+ breakdowns  → RED                                             │
│                                                                          │
│  Processing Time: 5-10ms                                                │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 5. Cache result
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Cache result for 30 seconds                                             │
│  - Memory: 10MB (231 routes × ~40KB each)                               │
│  - Next request in 30 seconds: Return cached (10-20ms)                  │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 6. Return JSON response
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Frontend receives:                                                      │
│  {                                                                      │
│    success: true,                                                       │
│    data: [                                                              │
│      {                                                                  │
│        route_id: "21",                                                  │
│        route_name: "21",                                                │
│        route_description: "Newcastle - Durham",                         │
│        status: "amber",                                                 │
│        active_breakdowns: 2,                                            │
│        last_breakdown: "2025-11-10T14:32:15Z"                           │
│      },                                                                 │
│      ...                                                                │
│    ],                                                                   │
│    cached: false,                                                       │
│    generated_at: "2025-11-10T14:35:00Z"                                 │
│  }                                                                      │
│                                                                          │
│  Total Response Time: 50-100ms (first request)                          │
│                       10-20ms (cached)                                   │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         │ 7. Render dashboard
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ React Component:                                                        │
│  - Displays 231 route cards                                             │
│  - Color-coded: Green/Amber/Red                                         │
│  - Clickable to view route details                                      │
│  - Auto-refreshes every 30 seconds                                      │
│  - Listens to WebSocket for real-time updates                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Document Information

**Created:** November 10, 2025
**Version:** 1.0
**Author:** Backend Architecture Specialist
**System:** Go BARRY Breakdown Management System

**Related Documents:**
- GTFS_FEATURE_ARCHITECTURE_REVIEW.md (Detailed technical specs)
- GTFS_IMPLEMENTATION_CHECKLIST.md (Week-by-week tasks)
- CLAUDE.md (Project context and guidelines)

---
