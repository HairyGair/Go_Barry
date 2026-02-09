-- Migration 027: Add trip_id and block_id to breakdowns table
-- Links a breakdown to the specific GTFS trip the vehicle was operating
-- Apply via phpMyAdmin > SQL tab

ALTER TABLE breakdowns ADD COLUMN trip_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE breakdowns ADD COLUMN block_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE breakdowns ADD INDEX idx_breakdowns_trip_id (trip_id);
ALTER TABLE breakdowns ADD INDEX idx_breakdowns_block_id (block_id);
