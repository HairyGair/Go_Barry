-- Migration 029: Create breakdown_lost_trips table
-- Stores full trip details when a supervisor cancels a journey,
-- enabling pattern analysis: which routes lose the most trips,
-- which vehicles cause repeated cancellations, time-of-day trends, etc.

CREATE TABLE IF NOT EXISTS breakdown_lost_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(20) NOT NULL,
  fleet_no VARCHAR(20),
  trip_id VARCHAR(100),
  route_id VARCHAR(20),
  direction_id INT,
  departure_time VARCHAR(10),
  arrival_time VARCHAR(10),
  origin_stop VARCHAR(150),
  dest_stop VARCHAR(150),
  headsign VARCHAR(200),
  action VARCHAR(20) NOT NULL,
  supervisor_badge VARCHAR(20),
  depot VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_breakdown_id (breakdown_id),
  INDEX idx_route_id (route_id),
  INDEX idx_created_at (created_at),
  INDEX idx_fleet_no (fleet_no)
);
