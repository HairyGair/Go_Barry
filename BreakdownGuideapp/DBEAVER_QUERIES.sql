-- Run these queries in DBeaver to diagnose the GTFS issue

-- 1. Check if GTFS tables exist
SHOW TABLES LIKE 'gtfs_%';

-- 2. Check gtfs_routes table structure
DESCRIBE gtfs_routes;

-- 3. Check if there are any records
SELECT COUNT(*) as route_count FROM gtfs_routes;
SELECT COUNT(*) as stop_count FROM gtfs_stops;
SELECT COUNT(*) as trip_count FROM gtfs_trips;
SELECT COUNT(*) as stoptime_count FROM gtfs_stop_times;

-- 4. Check recent errors in database logs
SELECT * FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'gobarryco_breakdowns' 
AND TABLE_NAME LIKE 'gtfs%';

-- 5. Check database user permissions
SELECT USER();
SELECT DATABASE();

-- 6. Test basic insert
-- THIS IS SAFE - just tests if the table accepts data
INSERT INTO gtfs_routes (route_id, route_short_name) 
VALUES ('TEST_001', 'Test Route')
ON DUPLICATE KEY UPDATE route_short_name = VALUES(route_short_name);

-- 7. Verify the test insert worked
SELECT * FROM gtfs_routes WHERE route_id = 'TEST_001';

-- 8. Clean up test data
DELETE FROM gtfs_routes WHERE route_id = 'TEST_001';

