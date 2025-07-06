-- VACUUM FULL script to run directly on PostgreSQL
-- This should work when executed outside of transaction blocks

BEGIN;
COMMIT;

-- Try VACUUM FULL on each table
VACUUM FULL roadworks;
VACUUM FULL supervisors;
VACUUM FULL supervisor_sessions;
VACUUM FULL message_templates;
VACUUM FULL alerts;
VACUUM FULL incidents;
VACUUM FULL disruptions;
VACUUM FULL street_manager_data;
VACUUM FULL audit_logs;
VACUUM FULL geocoding_cache;

-- Check final database size
SELECT pg_size_pretty(pg_database_size(current_database())) as "Database Size After VACUUM FULL";