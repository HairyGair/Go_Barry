-- Migration 026: Add block_id column to gtfs_trips
-- block_id represents the vehicle running number / duty block
-- All trips with the same block_id are operated by the same physical vehicle in sequence
-- Requires GTFS re-import to populate data
-- Apply via phpMyAdmin > SQL tab

ALTER TABLE gtfs_trips ADD COLUMN block_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE gtfs_trips ADD INDEX idx_trips_block_id (block_id);
