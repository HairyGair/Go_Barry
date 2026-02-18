-- Migration: Create Replacement Vehicles Table
-- Purpose: Track BSOG replacement vehicle mileage (dead miles vs pickup miles)
-- Created: February 2026

CREATE TABLE IF NOT EXISTS replacement_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  breakdown_id VARCHAR(20) NOT NULL,
  breakdown_ref VARCHAR(20),
  replacement_fleet_no VARCHAR(10) NOT NULL,
  sending_depot_code VARCHAR(10) NOT NULL,
  sending_depot_name VARCHAR(100),

  -- Depot coordinates (origin of dead miles)
  depot_lat DECIMAL(10, 8),
  depot_lng DECIMAL(11, 8),

  -- Breakdown coordinates (end of dead miles / start of pickup miles)
  breakdown_lat DECIMAL(10, 8),
  breakdown_lng DECIMAL(11, 8),

  -- Dead miles: depot -> breakdown location
  dead_miles DECIMAL(8, 2),
  dead_miles_duration_minutes INT,

  -- Return to service point (where replacement starts earning revenue)
  return_to_service_lat DECIMAL(10, 8),
  return_to_service_lng DECIMAL(11, 8),
  return_to_service_location VARCHAR(255),
  return_to_service_at TIMESTAMP NULL,

  -- Pickup miles: breakdown -> return-to-service point
  pickup_miles DECIMAL(8, 2),
  pickup_miles_duration_minutes INT,

  -- Total non-revenue miles for BSOG reporting
  total_dead_miles DECIMAL(8, 2),

  -- Status tracking
  status ENUM('dispatched', 'in_service', 'cancelled') DEFAULT 'dispatched',
  dispatched_by_badge VARCHAR(10),
  dispatched_by_name VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_rv_breakdown_id (breakdown_id),
  INDEX idx_rv_status (status),
  INDEX idx_rv_fleet_no (replacement_fleet_no),
  INDEX idx_rv_depot (sending_depot_code),
  INDEX idx_rv_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add Percy Main depot if it doesn't exist
INSERT INTO depots (code, name, latitude, longitude, is_active) VALUES
  ('PM', 'Percy Main', 55.0072, -1.4581, true)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude);
