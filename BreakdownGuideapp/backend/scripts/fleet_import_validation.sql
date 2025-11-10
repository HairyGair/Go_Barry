-- =============================================================================
-- FLEET VEHICLE CSV IMPORT - VALIDATION & VERIFICATION QUERIES
-- =============================================================================
-- Use these queries to validate the fleet import was successful
-- Run these AFTER importing CSV data into fleet_vehicles table
-- =============================================================================

-- ============================================================================
-- PRE-IMPORT: Run these before importing to establish baseline
-- ============================================================================

-- Count current vehicles before import
SELECT
  'BEFORE_IMPORT' as phase,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT depot) as depot_count,
  NOW() as timestamp
FROM fleet_vehicles;

-- List current depots before import
SELECT
  depot,
  COUNT(*) as vehicle_count,
  'BEFORE_IMPORT' as phase
FROM fleet_vehicles
WHERE depot IS NOT NULL AND depot != ''
GROUP BY depot
ORDER BY depot;

-- ============================================================================
-- POST-IMPORT: Run these after importing to verify success
-- ============================================================================

-- Count vehicles after import
SELECT
  'AFTER_IMPORT' as phase,
  COUNT(*) as total_vehicles,
  COUNT(DISTINCT depot) as depot_count,
  COUNT(DISTINCT vehicle_type) as vehicle_type_count,
  NOW() as timestamp
FROM fleet_vehicles;

-- New vehicles added (count)
SELECT
  COUNT(*) as new_vehicles_added
FROM fleet_vehicles
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- List updated vehicles (within last hour)
SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type,
  updated_at
FROM fleet_vehicles
WHERE updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY updated_at DESC;

-- ============================================================================
-- DATA QUALITY CHECKS
-- ============================================================================

-- Check for missing fleet numbers (critical)
SELECT COUNT(*) as missing_fleet_numbers
FROM fleet_vehicles
WHERE fleet_number IS NULL OR fleet_number = '';

-- Check for missing registrations
SELECT COUNT(*) as missing_registrations
FROM fleet_vehicles
WHERE registration IS NULL OR registration = '';

-- Check for missing depot assignments
SELECT COUNT(*) as missing_depot
FROM fleet_vehicles
WHERE depot IS NULL OR depot = '';

-- Check for missing vehicle types
SELECT COUNT(*) as missing_vehicle_type
FROM fleet_vehicles
WHERE vehicle_type IS NULL OR vehicle_type = '';

-- ============================================================================
-- DUPLICATE DETECTION
-- ============================================================================

-- Find duplicate fleet numbers (should be none)
SELECT
  fleet_number,
  COUNT(*) as occurrence_count,
  GROUP_CONCAT(id) as ids
FROM fleet_vehicles
GROUP BY fleet_number
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- Find duplicate registrations (warning only - some may be valid)
SELECT
  registration,
  COUNT(*) as occurrence_count,
  GROUP_CONCAT(fleet_number) as fleet_numbers
FROM fleet_vehicles
WHERE registration IS NOT NULL AND registration != ''
GROUP BY registration
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- ============================================================================
-- DEPOT DISTRIBUTION
-- ============================================================================

-- Vehicles per depot
SELECT
  depot,
  COUNT(*) as vehicle_count,
  COUNT(DISTINCT vehicle_type) as vehicle_type_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fleet_vehicles), 2) as percentage
FROM fleet_vehicles
WHERE depot IS NOT NULL AND depot != ''
GROUP BY depot
ORDER BY vehicle_count DESC;

-- Expected depots check
SELECT
  CASE
    WHEN depot IS NULL THEN 'NULL'
    WHEN depot = '' THEN 'EMPTY'
    ELSE depot
  END as depot,
  COUNT(*) as count
FROM fleet_vehicles
GROUP BY depot
ORDER BY count DESC;

-- ============================================================================
-- VEHICLE TYPE DISTRIBUTION
-- ============================================================================

-- Vehicles by type
SELECT
  vehicle_type,
  COUNT(*) as vehicle_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fleet_vehicles), 2) as percentage
FROM fleet_vehicles
WHERE vehicle_type IS NOT NULL AND vehicle_type != ''
GROUP BY vehicle_type
ORDER BY vehicle_count DESC;

-- Vehicle group distribution
SELECT
  vehicle_group,
  COUNT(*) as vehicle_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fleet_vehicles), 2) as percentage
FROM fleet_vehicles
WHERE vehicle_group IS NOT NULL AND vehicle_group != ''
GROUP BY vehicle_group
ORDER BY vehicle_count DESC;

-- ============================================================================
-- SAMPLE DATA VERIFICATION
-- ============================================================================

-- First 10 vehicles (check data looks correct)
SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type,
  status,
  created_at,
  updated_at
FROM fleet_vehicles
LIMIT 10;

-- Last 10 imported vehicles
SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type,
  status,
  created_at,
  updated_at
FROM fleet_vehicles
ORDER BY created_at DESC
LIMIT 10;

-- Specific depot sample
SELECT
  fleet_number,
  registration,
  vehicle_type,
  vehicle_group
FROM fleet_vehicles
WHERE depot = 'BENH'  -- Replace BENH with your test depot
LIMIT 5;

-- ============================================================================
-- COMPARISON WITH JSON BACKUP
-- ============================================================================

-- Check if critical vehicles from old data exist
-- Expected vehicles from original fleet-database.json:
-- 5301-5309, 5420-5430, 6071-6080, 6917-6925

SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type
FROM fleet_vehicles
WHERE fleet_number IN (
  '5301', '5302', '5303', '5304', '5305',  -- Riverside group
  '5420', '5421', '5422',                  -- Percy Main group
  '6071', '6072',                          -- Consett group
  '6917', '6918', '6919'                   -- Percy Main new group
)
ORDER BY CAST(fleet_number AS UNSIGNED);

-- ============================================================================
-- STATUS VERIFICATION
-- ============================================================================

-- Check vehicle status distribution
SELECT
  status,
  COUNT(*) as count
FROM fleet_vehicles
WHERE status IS NOT NULL
GROUP BY status
ORDER BY count DESC;

-- Ensure all new imports have 'active' status
SELECT
  fleet_number,
  status
FROM fleet_vehicles
WHERE status != 'active'
LIMIT 10;

-- ============================================================================
-- TIMESTAMP VERIFICATION
-- ============================================================================

-- Check created_at timestamps are recent (should be after import start)
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM fleet_vehicles
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check updated_at timestamps (should be same as created_at for new records)
SELECT
  COUNT(*) as records_where_updated_equals_created
FROM fleet_vehicles
WHERE created_at = updated_at;

-- ============================================================================
-- API ENDPOINT SIMULATION
-- ============================================================================

-- Simulate GET /api/fleet (with pagination)
SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type,
  status
FROM fleet_vehicles
ORDER BY fleet_number ASC
LIMIT 20;

-- Simulate GET /api/fleet/depots/list
SELECT DISTINCT depot
FROM fleet_vehicles
WHERE depot IS NOT NULL AND depot != ''
ORDER BY depot ASC;

-- Simulate GET /api/fleet/types/list
SELECT DISTINCT vehicle_type
FROM fleet_vehicles
WHERE vehicle_type IS NOT NULL AND vehicle_type != ''
ORDER BY vehicle_type ASC;

-- Simulate GET /api/fleet/search/:term
-- (Search for vehicles containing "5301" in fleet_number or registration)
SELECT
  fleet_number,
  registration,
  depot,
  vehicle_type
FROM fleet_vehicles
WHERE fleet_number LIKE '%5301%' OR registration LIKE '%5301%'
ORDER BY fleet_number ASC
LIMIT 20;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT
  (SELECT COUNT(*) FROM fleet_vehicles) as total_vehicles,
  (SELECT COUNT(DISTINCT depot) FROM fleet_vehicles WHERE depot IS NOT NULL) as depot_count,
  (SELECT COUNT(DISTINCT vehicle_type) FROM fleet_vehicles WHERE vehicle_type IS NOT NULL) as vehicle_type_count,
  (SELECT COUNT(*) FROM fleet_vehicles WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)) as recent_imports,
  (SELECT COUNT(*) FROM fleet_vehicles WHERE status = 'active') as active_vehicles,
  (SELECT COUNT(*) FROM fleet_vehicles WHERE registration IS NULL) as missing_registration
UNION ALL
SELECT
  'DEPOT' as label,
  COUNT(DISTINCT depot),
  0, 0, 0, 0
FROM fleet_vehicles;

-- ============================================================================
-- CLEANUP (Run if import needs to be rolled back)
-- ============================================================================

-- Backup current data before deletion
-- CREATE TABLE fleet_vehicles_backup_2025_11_10 AS
-- SELECT * FROM fleet_vehicles;

-- Delete all vehicles (if full rollback needed)
-- DELETE FROM fleet_vehicles;

-- Delete specific depot (if partial rollback needed)
-- DELETE FROM fleet_vehicles WHERE depot = 'BENH';

-- Reset auto-increment if using AUTO_INCREMENT
-- ALTER TABLE fleet_vehicles AUTO_INCREMENT = 1;

-- ============================================================================
-- END OF VALIDATION SCRIPT
-- ============================================================================
