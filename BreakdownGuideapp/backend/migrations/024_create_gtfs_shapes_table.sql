-- Migration 024: GTFS Shapes table and route distance cache
-- Required for BSOG mileage accuracy - shape-based distances replace Haversine crow-flies
-- Apply via phpMyAdmin > SQL tab

-- 1. GTFS Shapes table (stores shape point sequences from shapes.txt)
CREATE TABLE IF NOT EXISTS gtfs_shapes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shape_id VARCHAR(100) NOT NULL,
  shape_pt_lat DECIMAL(10, 6) NOT NULL,
  shape_pt_lon DECIMAL(10, 6) NOT NULL,
  shape_pt_sequence INT NOT NULL,
  shape_dist_traveled DECIMAL(10, 4) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_shape_point (shape_id, shape_pt_sequence),
  INDEX idx_shape_id (shape_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add shape_id column to gtfs_trips (links trips to their route shape)
ALTER TABLE gtfs_trips
  ADD COLUMN IF NOT EXISTS shape_id VARCHAR(100) DEFAULT NULL,
  ADD INDEX IF NOT EXISTS idx_trips_shape_id (shape_id);

-- 3. Route distance cache table (pre-computed from shapes for fast lookups)
CREATE TABLE IF NOT EXISTS gtfs_route_distances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) NOT NULL,
  direction_id TINYINT NOT NULL DEFAULT 0,
  distance_km DECIMAL(10, 4) NOT NULL,
  distance_miles DECIMAL(10, 4) NOT NULL,
  shape_id VARCHAR(100) DEFAULT NULL,
  stop_count INT DEFAULT 0,
  cumulative_distances JSON DEFAULT NULL COMMENT 'Array of cumulative km at each stop for percentage calculation',
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_route_direction (route_id, direction_id),
  INDEX idx_route_id (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Update gtfs_import_log ENUM to include 'shapes' if the column uses ENUM
-- Note: If gtfs_import_log uses VARCHAR for file_type, this is not needed
-- ALTER TABLE gtfs_import_log MODIFY COLUMN file_type ENUM('routes', 'stops', 'trips', 'stop_times', 'shapes') NOT NULL;
