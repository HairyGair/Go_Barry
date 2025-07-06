-- Emergency VACUUM FULL migration to fix database bloat
-- This should reclaim the 510MB of bloated space

-- VACUUM FULL all main tables
VACUUM (FULL, ANALYZE) roadworks;
VACUUM (FULL, ANALYZE) supervisors;
VACUUM (FULL, ANALYZE) supervisor_sessions;
VACUUM (FULL, ANALYZE) message_templates;

-- VACUUM FULL empty tables that might have bloat
VACUUM (FULL, ANALYZE) alerts;
VACUUM (FULL, ANALYZE) incidents;
VACUUM (FULL, ANALYZE) disruptions;
VACUUM (FULL, ANALYZE) street_manager_data;
VACUUM (FULL, ANALYZE) audit_logs;
VACUUM (FULL, ANALYZE) geocoding_cache;

-- This migration should reduce database size from 510MB to <50MB