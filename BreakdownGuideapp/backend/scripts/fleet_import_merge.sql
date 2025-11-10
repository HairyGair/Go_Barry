-- =============================================================================
-- FLEET VEHICLE IMPORT - MERGE STRATEGY (Update Existing + Insert New)
-- =============================================================================
-- This script performs a merge/upsert operation on fleet_vehicles
-- - Updates existing vehicles by matching fleet_number
-- - Inserts new vehicles not already in database
-- - Preserves all existing data not explicitly overwritten
-- =============================================================================

SET SQL_MODE='STRICT_TRANS_TABLES';
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- STEP 1: Create temporary import table
-- ============================================================================

DROP TEMPORARY TABLE IF EXISTS temp_fleet_import;

CREATE TEMPORARY TABLE temp_fleet_import (
  fleet_number VARCHAR(50) NOT NULL,
  registration VARCHAR(20) NULL,
  depot VARCHAR(100) NULL,
  vehicle_type VARCHAR(100) NULL,
  vehicle_group VARCHAR(255) NULL,
  branding VARCHAR(100) NULL,
  service_vehicle_type VARCHAR(255) NULL,
  vehicle_class VARCHAR(50) NULL,
  PRIMARY KEY (fleet_number)
);

-- ============================================================================
-- STEP 2: Import CSV into temporary table
-- ============================================================================
-- Use DBeaver's "Import Data" feature to load your CSV into temp_fleet_import
-- OR paste the INSERT statements below if importing programmatically:

-- Example data (replace with your actual CSV data):
-- INSERT INTO temp_fleet_import VALUES
-- ('5301', 'NJX18AAA', 'BENH', 'Mercedes Sprinter', 'Single Deck', 'Bensham', NULL, 'SDD'),
-- ('5302', 'NJX18AAB', 'BENH', 'Mercedes Sprinter', 'Single Deck', 'Bensham', NULL, 'SDD'),
-- ... more rows ...

-- ============================================================================
-- STEP 3: Merge into production table (Update + Insert)
-- ============================================================================

-- Using INSERT ... ON DUPLICATE KEY UPDATE (recommended for MySQL 5.6+)
INSERT INTO fleet_vehicles (
  id,
  fleet_number,
  registration,
  depot,
  vehicle_type,
  vehicle_group,
  branding,
  service_vehicle_type,
  vehicle_class,
  status,
  created_at,
  updated_at
)
SELECT
  COALESCE(
    (SELECT id FROM fleet_vehicles WHERE fleet_number = t.fleet_number),
    UUID()
  ) as id,
  t.fleet_number,
  t.registration,
  t.depot,
  t.vehicle_type,
  t.vehicle_group,
  t.branding,
  t.service_vehicle_type,
  t.vehicle_class,
  (SELECT COALESCE(status, 'active') FROM fleet_vehicles WHERE fleet_number = t.fleet_number LIMIT 1),
  (SELECT COALESCE(created_at, NOW()) FROM fleet_vehicles WHERE fleet_number = t.fleet_number LIMIT 1),
  NOW()
FROM temp_fleet_import t
ON DUPLICATE KEY UPDATE
  registration = COALESCE(VALUES(registration), registration),
  depot = COALESCE(VALUES(depot), depot),
  vehicle_type = COALESCE(VALUES(vehicle_type), vehicle_type),
  vehicle_group = COALESCE(VALUES(vehicle_group), vehicle_group),
  branding = COALESCE(VALUES(branding), branding),
  service_vehicle_type = COALESCE(VALUES(service_vehicle_type), service_vehicle_type),
  vehicle_class = COALESCE(VALUES(vehicle_class), vehicle_class),
  status = COALESCE(status, 'active'),
  updated_at = NOW();

-- ============================================================================
-- STEP 4: Verify merge results
-- ============================================================================

-- Count vehicles after merge
SELECT
  'POST_MERGE' as phase,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT depot) as depot_count,
  COUNT(*) - (SELECT COUNT(*) FROM temp_fleet_import) as existing_vehicles,
  (SELECT COUNT(*) FROM temp_fleet_import) as imported_vehicles
FROM fleet_vehicles;

-- Show newly added vehicles
SELECT
  'NEW_RECORDS' as record_type,
  fleet_number,
  registration,
  depot,
  vehicle_type,
  created_at
FROM fleet_vehicles
WHERE fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY created_at DESC;

-- Show updated vehicles
SELECT
  'UPDATED_RECORDS' as record_type,
  fleet_number,
  registration,
  depot,
  vehicle_type,
  updated_at
FROM fleet_vehicles
WHERE fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
AND updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
AND updated_at != created_at
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 5: Data quality checks
-- ============================================================================

-- Check for any duplicates (should be none)
SELECT
  fleet_number,
  COUNT(*) as count
FROM fleet_vehicles
WHERE fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
GROUP BY fleet_number
HAVING COUNT(*) > 1;

-- Check for null values in critical fields
SELECT
  'NULL_FLEET_NUMBER' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE fleet_number IS NULL
UNION ALL
SELECT
  'NULL_REGISTRATION' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE registration IS NULL AND fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
UNION ALL
SELECT
  'NULL_DEPOT' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE depot IS NULL AND fleet_number IN (SELECT fleet_number FROM temp_fleet_import);

-- ============================================================================
-- STEP 6: Comparison - what changed?
-- ============================================================================

-- Show depot distribution
SELECT
  depot,
  COUNT(*) as vehicle_count
FROM fleet_vehicles
WHERE fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
GROUP BY depot
ORDER BY vehicle_count DESC;

-- Show vehicle type distribution
SELECT
  vehicle_type,
  COUNT(*) as vehicle_count
FROM fleet_vehicles
WHERE fleet_number IN (SELECT fleet_number FROM temp_fleet_import)
GROUP BY vehicle_type
ORDER BY vehicle_count DESC;

-- ============================================================================
-- STEP 7: Cleanup
-- ============================================================================

-- Drop temporary table
DROP TEMPORARY TABLE temp_fleet_import;

-- ============================================================================
-- STEP 8: Final verification
-- ============================================================================

-- Total fleet size
SELECT
  'FINAL_COUNT' as metric,
  COUNT(*) as count,
  COUNT(DISTINCT depot) as depots,
  COUNT(DISTINCT vehicle_type) as vehicle_types
FROM fleet_vehicles;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if something goes wrong)
-- ============================================================================

-- If you need to undo this merge, you can:
-- 1. Delete just the new/updated vehicles:
--    DELETE FROM fleet_vehicles
--    WHERE created_at > '2025-11-10 12:00:00';  -- Adjust timestamp

-- 2. Or restore from backup:
--    TRUNCATE TABLE fleet_vehicles;
--    INSERT INTO fleet_vehicles SELECT * FROM fleet_vehicles_backup;

-- =============================================================================
-- END OF MERGE SCRIPT
-- =============================================================================
