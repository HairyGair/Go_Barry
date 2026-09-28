-- 036: Route diversions
-- A temporary change to a route around a road closure: where the route leaves
-- its normal path, the road path it takes instead, where it rejoins, the stops
-- it misses and any stops served instead. Shown on Route Status, timetables,
-- stops and as a printable driver sheet.
--
-- supervisor_badge keeps demo diversions (DEMO01) apart from real ones, the
-- same way breakdowns are isolated.

CREATE TABLE IF NOT EXISTS route_diversions (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  route_id VARCHAR(100) NULL,
  route_short_name VARCHAR(50) NOT NULL,
  direction_id TINYINT NULL,
  direction_label VARCHAR(255) NULL,
  title VARCHAR(200) NOT NULL,
  reason ENUM('road_closure', 'roadworks', 'incident', 'event', 'weather', 'other') NOT NULL DEFAULT 'road_closure',
  closure_description VARCHAR(255) NULL,
  closure_lat DECIMAL(10,6) NULL,
  closure_lng DECIMAL(10,6) NULL,
  from_stop_id VARCHAR(100) NULL,
  from_stop_name VARCHAR(255) NULL,
  to_stop_id VARCHAR(100) NULL,
  to_stop_name VARCHAR(255) NULL,
  diversion_path JSON NULL,
  directions JSON NULL,
  missed_stops JSON NULL,
  served_stops JSON NULL,
  extra_miles DECIMAL(6,2) NULL,
  extra_minutes INT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NULL,
  status ENUM('active', 'ended', 'cancelled') NOT NULL DEFAULT 'active',
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_by_name VARCHAR(100) NULL,
  supervisor_badge VARCHAR(20) NULL,
  ended_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_div_route (route_short_name),
  KEY idx_div_status_window (status, start_at, end_at),
  KEY idx_div_badge (supervisor_badge)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
