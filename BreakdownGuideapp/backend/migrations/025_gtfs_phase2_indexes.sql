-- Migration 025: GTFS Phase 2 Performance Indexes
-- Required for trips-at-risk, service gaps, shape matching, timetable, and stop finder features
-- Apply via phpMyAdmin > SQL tab
--
-- INSTRUCTIONS: Run each statement one at a time in phpMyAdmin.
-- If an index already exists, you'll get "Duplicate key name" - that's fine, skip to the next.

-- 1. Index for stop departure time queries (trips-at-risk, service gaps, timetable)
ALTER TABLE gtfs_stop_times ADD INDEX idx_st_stop_departure (stop_id, departure_time);

-- 2. Index for shape proximity queries (multi-route impact map)
ALTER TABLE gtfs_shapes ADD INDEX idx_shapes_location (shape_pt_lat, shape_pt_lon);

-- 3. Index for trip route/service lookups (all features)
ALTER TABLE gtfs_trips ADD INDEX idx_trips_route_service (route_id, service_id, direction_id);

-- 4. Index for stop name search (stop finder)
ALTER TABLE gtfs_stops ADD INDEX idx_stops_name (stop_name);

-- 5. Index for stop location queries (stop finder proximity)
ALTER TABLE gtfs_stops ADD INDEX idx_stops_location (stop_lat, stop_lon);
