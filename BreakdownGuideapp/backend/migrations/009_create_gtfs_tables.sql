-- Migration: Create GTFS Tables for MySQL
-- Purpose: Store GTFS transit data for route matching and navigation
-- Created: November 10, 2025
-- Author: Anthony Gair

-- ============================================
-- GTFS ROUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id VARCHAR(100) UNIQUE NOT NULL,
  agency_id VARCHAR(100),
  route_short_name VARCHAR(50),
  route_long_name VARCHAR(255),
  route_desc TEXT,
  route_type INT,
  route_url VARCHAR(500),
  route_color VARCHAR(6),
  route_text_color VARCHAR(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_route_id (route_id),
  INDEX idx_route_short_name (route_short_name),
  INDEX idx_agency_id (agency_id),
  INDEX idx_route_type (route_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='GTFS bus route definitions';

-- ============================================
-- GTFS STOPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stop_id VARCHAR(100) UNIQUE NOT NULL,
  stop_code VARCHAR(50),
  stop_name VARCHAR(255) NOT NULL,
  stop_lat DECIMAL(10, 8) NOT NULL,
  stop_lon DECIMAL(11, 8) NOT NULL,
  stop_desc TEXT,
  zone_id VARCHAR(50),
  wheelchair_boarding INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_stop_id (stop_id),
  INDEX idx_stop_code (stop_code),
  INDEX idx_stop_name (stop_name),
  INDEX idx_stop_location (stop_lat, stop_lon),
  INDEX idx_zone_id (zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='GTFS bus stop locations';

-- ============================================
-- GTFS TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id VARCHAR(100) UNIQUE NOT NULL,
  route_id VARCHAR(100) NOT NULL,
  service_id VARCHAR(100) NOT NULL,
  trip_headsign VARCHAR(255),
  direction_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_trip_id (trip_id),
  INDEX idx_route_id (route_id),
  INDEX idx_service_id (service_id),
  INDEX idx_direction_id (direction_id),

  FOREIGN KEY (route_id) REFERENCES gtfs_routes(route_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='GTFS trip schedules';

-- ============================================
-- GTFS STOP TIMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_stop_times (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id VARCHAR(100) NOT NULL,
  stop_id VARCHAR(100) NOT NULL,
  stop_sequence INT NOT NULL,
  arrival_time VARCHAR(8),
  departure_time VARCHAR(8),
  stop_headsign VARCHAR(255),
  pickup_type INT DEFAULT 0,
  drop_off_type INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_trip_id (trip_id),
  INDEX idx_stop_id (stop_id),
  INDEX idx_stop_sequence (stop_sequence),
  INDEX idx_arrival_time (arrival_time),
  INDEX idx_departure_time (departure_time),
  UNIQUE KEY unique_trip_stop_sequence (trip_id, stop_id, stop_sequence),

  FOREIGN KEY (trip_id) REFERENCES gtfs_trips(trip_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES gtfs_stops(stop_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='GTFS departure/arrival times';

-- ============================================
-- GTFS IMPORT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gtfs_import_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  import_type ENUM('routes', 'stops', 'trips', 'stop_times') NOT NULL,
  file_name VARCHAR(255),
  records_processed INT DEFAULT 0,
  records_successful INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  error_details JSON DEFAULT NULL,
  imported_by VARCHAR(100),
  import_status ENUM('in_progress', 'completed', 'failed') DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  duration_seconds INT,

  INDEX idx_import_type (import_type),
  INDEX idx_import_status (import_status),
  INDEX idx_started_at (started_at),
  INDEX idx_imported_by (imported_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='GTFS import history and audit log';

-- ============================================
-- STORED PROCEDURE: Get Routes by Short Name
-- ============================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_get_routes_by_name(
  IN p_route_name VARCHAR(50)
)
BEGIN
  SELECT
    route_id,
    agency_id,
    route_short_name,
    route_long_name,
    route_desc,
    route_type,
    route_url,
    route_color,
    route_text_color,
    created_at,
    updated_at
  FROM gtfs_routes
  WHERE route_short_name LIKE CONCAT('%', p_route_name, '%')
  ORDER BY route_short_name;
END //

DELIMITER ;

-- ============================================
-- STORED PROCEDURE: Find Nearest Stops
-- ============================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_find_nearest_stops(
  IN p_latitude DECIMAL(10, 8),
  IN p_longitude DECIMAL(11, 8),
  IN p_limit INT
)
BEGIN
  SELECT
    stop_id,
    stop_code,
    stop_name,
    stop_lat,
    stop_lon,
    stop_desc,
    zone_id,
    wheelchair_boarding,
    -- Calculate distance using Haversine formula
    (
      6371 * ACOS(
        COS(RADIANS(p_latitude)) * COS(RADIANS(stop_lat)) *
        COS(RADIANS(stop_lon) - RADIANS(p_longitude)) +
        SIN(RADIANS(p_latitude)) * SIN(RADIANS(stop_lat))
      )
    ) AS distance_km
  FROM gtfs_stops
  HAVING distance_km IS NOT NULL
  ORDER BY distance_km
  LIMIT p_limit;
END //

DELIMITER ;

-- ============================================
-- STORED PROCEDURE: Get Trip Details with Stops
-- ============================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS sp_get_trip_details(
  IN p_trip_id VARCHAR(100)
)
BEGIN
  SELECT
    t.trip_id,
    t.route_id,
    t.service_id,
    t.trip_headsign,
    t.direction_id,
    r.route_short_name,
    r.route_long_name,
    st.stop_sequence,
    st.arrival_time,
    st.departure_time,
    st.stop_headsign,
    s.stop_id,
    s.stop_name,
    s.stop_lat,
    s.stop_lon
  FROM gtfs_trips t
  INNER JOIN gtfs_routes r ON t.route_id = r.route_id
  LEFT JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
  LEFT JOIN gtfs_stops s ON st.stop_id = s.stop_id
  WHERE t.trip_id = p_trip_id
  ORDER BY st.stop_sequence;
END //

DELIMITER ;

-- ============================================
-- VIEW: Route Statistics
-- ============================================
CREATE OR REPLACE VIEW v_gtfs_route_stats AS
SELECT
  r.route_id,
  r.route_short_name,
  r.route_long_name,
  COUNT(DISTINCT t.trip_id) as total_trips,
  COUNT(DISTINCT st.stop_id) as total_stops,
  MIN(st.departure_time) as first_departure,
  MAX(st.arrival_time) as last_arrival,
  r.updated_at as last_updated
FROM gtfs_routes r
LEFT JOIN gtfs_trips t ON r.route_id = t.route_id
LEFT JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
GROUP BY r.route_id, r.route_short_name, r.route_long_name, r.updated_at;

-- ============================================
-- VIEW: Import Summary
-- ============================================
CREATE OR REPLACE VIEW v_gtfs_import_summary AS
SELECT
  import_type,
  COUNT(*) as total_imports,
  SUM(records_processed) as total_records_processed,
  SUM(records_successful) as total_records_successful,
  SUM(records_failed) as total_records_failed,
  MAX(completed_at) as last_import_date,
  AVG(duration_seconds) as avg_duration_seconds
FROM gtfs_import_log
WHERE import_status = 'completed'
GROUP BY import_type;

-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gtfs_routes TO 'gobarryco_Gair'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gtfs_stops TO 'gobarryco_Gair'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gtfs_trips TO 'gobarryco_Gair'@'%';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gtfs_stop_times TO 'gobarryco_Gair'@'%';
-- GRANT SELECT, INSERT ON gtfs_import_log TO 'gobarryco_Gair'@'%';

-- Migration complete
SELECT 'GTFS tables migration completed successfully' AS Status;
SELECT CONCAT('Created tables: gtfs_routes, gtfs_stops, gtfs_trips, gtfs_stop_times, gtfs_import_log') AS Details;
