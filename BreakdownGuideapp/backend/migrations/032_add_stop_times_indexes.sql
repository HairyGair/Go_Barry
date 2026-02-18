-- Migration 032: Add indexes for StopFinder performance
-- Without these, stop departures queries do full table scans on 2M+ rows
-- Run via phpMyAdmin > SQL tab

-- Primary index: stop_id + departure_time (covers the departures query exactly)
CREATE INDEX idx_stop_times_stop_dep
ON gtfs_stop_times (stop_id, departure_time);

-- Secondary index: trip_id (for JOIN to gtfs_trips)
-- May already exist as FK; safe to run - will error harmlessly if duplicate
CREATE INDEX idx_stop_times_trip
ON gtfs_stop_times (trip_id);
