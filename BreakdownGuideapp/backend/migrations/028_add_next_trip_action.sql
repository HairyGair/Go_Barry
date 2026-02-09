-- Migration 028: Add next_trip_action column to breakdowns table
-- Part of Next Trip Countdown Alert System
-- Values: NULL (no action taken), 'covered', 'cancelled'
-- When set, the countdown alert for the next scheduled trip dismisses.

ALTER TABLE breakdowns ADD COLUMN next_trip_action VARCHAR(20) DEFAULT NULL;
