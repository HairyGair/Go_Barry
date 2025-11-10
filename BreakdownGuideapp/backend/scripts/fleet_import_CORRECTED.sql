-- =============================================================================
-- FLEET VEHICLE IMPORT - CORRECTED MERGE STRATEGY
-- =============================================================================
-- CORRECTED VERSION: Uses fleet_no (NOT fleet_number)
-- This script performs a merge/upsert operation on fleet_vehicles
-- - Updates existing vehicles by matching fleet_no
-- - Inserts new vehicles not already in database
-- - Preserves all existing data not explicitly overwritten
-- =============================================================================

SET SQL_MODE='STRICT_TRANS_TABLES';
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- STEP 1: Create temporary import table (CORRECTED COLUMN NAMES)
-- ============================================================================

DROP TEMPORARY TABLE IF EXISTS temp_fleet_import;

CREATE TEMPORARY TABLE temp_fleet_import (
  fleet_no VARCHAR(50) NOT NULL,           -- CORRECTED: fleet_no NOT fleet_number
  registration VARCHAR(20) NULL,
  depot VARCHAR(100) NULL,
  type VARCHAR(100) NULL,                  -- CORRECTED: type NOT vehicle_type
  vehicle_group VARCHAR(255) NULL,
  branding VARCHAR(100) NULL,
  service_vehicle_type VARCHAR(255) NULL,
  vehicle_class VARCHAR(50) NULL,
  PRIMARY KEY (fleet_no)
);

-- ============================================================================
-- STEP 2: Import CSV into temporary table
-- ============================================================================
-- Use DBeaver's "Import Data" feature to load your CSV into temp_fleet_import
-- Column mapping should be:
-- FleetNo → fleet_no
-- Registration → registration
-- OperatingDepotCode → depot
-- VehicleType → type
-- VehicleGroupDescription → vehicle_group
-- Branding → branding
-- Service Specific Vehicle Type → service_vehicle_type
-- Vehicle Class → vehicle_class

-- ============================================================================
-- STEP 3: Merge into production table (Update + Insert)
-- ============================================================================

INSERT INTO fleet_vehicles (
  id,
  fleet_no,                                -- CORRECTED COLUMN NAME
  registration,
  depot,
  type,                                    -- CORRECTED COLUMN NAME
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
    (SELECT id FROM fleet_vehicles WHERE fleet_no = t.fleet_no),
    UUID()
  ) as id,
  t.fleet_no,
  t.registration,
  t.depot,
  t.type,
  t.vehicle_group,
  t.branding,
  t.service_vehicle_type,
  t.vehicle_class,
  (SELECT COALESCE(status, 'active') FROM fleet_vehicles WHERE fleet_no = t.fleet_no LIMIT 1),
  (SELECT COALESCE(created_at, NOW()) FROM fleet_vehicles WHERE fleet_no = t.fleet_no LIMIT 1),
  NOW()
FROM temp_fleet_import t
ON DUPLICATE KEY UPDATE
  registration = COALESCE(VALUES(registration), registration),
  depot = COALESCE(VALUES(depot), depot),
  type = COALESCE(VALUES(type), type),
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
  fleet_no,
  registration,
  depot,
  type,
  created_at
FROM fleet_vehicles
WHERE fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
ORDER BY created_at DESC;

-- Show updated vehicles
SELECT
  'UPDATED_RECORDS' as record_type,
  fleet_no,
  registration,
  depot,
  type,
  updated_at
FROM fleet_vehicles
WHERE fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
AND updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
AND updated_at != created_at
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 5: Data quality checks
-- ============================================================================

-- Check for any duplicates (should be none)
SELECT
  fleet_no,
  COUNT(*) as count
FROM fleet_vehicles
WHERE fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
GROUP BY fleet_no
HAVING COUNT(*) > 1;

-- Check for null values in critical fields
SELECT
  'NULL_FLEET_NO' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE fleet_no IS NULL
UNION ALL
SELECT
  'NULL_REGISTRATION' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE registration IS NULL AND fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
UNION ALL
SELECT
  'NULL_DEPOT' as issue,
  COUNT(*) as count
FROM fleet_vehicles
WHERE depot IS NULL AND fleet_no IN (SELECT fleet_no FROM temp_fleet_import);

-- ============================================================================
-- STEP 6: Comparison - what changed?
-- ============================================================================

-- Show depot distribution
SELECT
  depot,
  COUNT(*) as vehicle_count
FROM fleet_vehicles
WHERE fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
GROUP BY depot
ORDER BY vehicle_count DESC;

-- Show vehicle type distribution
SELECT
  type,
  COUNT(*) as vehicle_count
FROM fleet_vehicles
WHERE fleet_no IN (SELECT fleet_no FROM temp_fleet_import)
GROUP BY type
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
  COUNT(DISTINCT type) as vehicle_types
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
-- CORRECTED VERSION - KEY CHANGES FROM ORIGINAL:
-- =============================================================================
-- Changed: fleet_number → fleet_no
-- Changed: vehicle_type → type
-- All other column names remain the same
-- This now matches the actual database schema
-- =============================================================================
