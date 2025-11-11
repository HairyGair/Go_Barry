-- ═══════════════════════════════════════════════════════════════════════════════
-- GTFS Phase 1 Database Migration - Updated
-- Purpose: Create views and tables for Phase 1 (route_id column already exists)
-- Date: November 11, 2025
--
-- Usage: Execute this SQL file in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Verify route_id index exists, create if missing
ALTER TABLE breakdowns
ADD INDEX IF NOT EXISTS idx_route_id (route_id);

-- Step 2: Add spatial index on gtfs_stops
ALTER TABLE gtfs_stops
ADD INDEX IF NOT EXISTS idx_stop_location (stop_lat, stop_lon);

-- Step 3: Create route status summary view
CREATE OR REPLACE VIEW v_route_status_summary AS
SELECT
  r.route_id,
  r.route_short_name,
  r.route_long_name,
  COUNT(DISTINCT b.id) as active_breakdown_count,
  MAX(b.created_at) as last_breakdown_time,
  CASE
    WHEN COUNT(DISTINCT b.id) = 0 THEN 'GREEN'
    WHEN COUNT(DISTINCT b.id) = 1 THEN 'AMBER'
    ELSE 'RED'
  END as status,
  GROUP_CONCAT(DISTINCT b.severity SEPARATOR ',') as breakdown_severities
FROM gtfs_routes r
LEFT JOIN breakdowns b ON r.route_id = b.route_id
  AND b.status NOT IN ('resolved', 'cleared')
  AND b.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY r.route_id, r.route_short_name, r.route_long_name;

-- Step 4: Create breakdown heatmap view
CREATE OR REPLACE VIEW v_breakdown_heatmap AS
SELECT
  b.id,
  b.breakdown_id,
  b.location_lat,
  b.location_lng,
  b.issue_category,
  b.severity,
  b.status,
  b.created_at,
  (
    SELECT COUNT(*) FROM breakdowns b2
    WHERE b2.location_lat IS NOT NULL
    AND b2.location_lng IS NOT NULL
    AND SQRT(
      POW(b2.location_lat - b.location_lat, 2) +
      POW(b2.location_lng - b.location_lng, 2)
    ) < 0.01
    AND b2.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
  ) as nearby_breakdown_count
FROM breakdowns b
WHERE b.location_lat IS NOT NULL
  AND b.location_lng IS NOT NULL
  AND b.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Step 5: Create route coverage analysis table
CREATE TABLE IF NOT EXISTS route_coverage_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id VARCHAR(10) NOT NULL UNIQUE,
  route_name VARCHAR(255),
  total_vehicles INT DEFAULT 0,
  active_vehicles INT DEFAULT 0,
  spare_vehicles INT DEFAULT 0,
  coverage_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) COMMENT 'GREEN/AMBER/RED for coverage',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_route_id (route_id),
  INDEX idx_coverage (coverage_percentage),
  INDEX idx_status (status)
) COMMENT='Route coverage analysis for Phase 1 feature';

-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration Complete!
--
-- The following have been created/updated:
-- ✅ Index on route_id (created if missing)
-- ✅ Spatial index on gtfs_stops
-- ✅ v_route_status_summary view created
-- ✅ v_breakdown_heatmap view created
-- ✅ route_coverage_analysis table created
--
-- Ready for backend deployment and testing
-- ═══════════════════════════════════════════════════════════════════════════════
