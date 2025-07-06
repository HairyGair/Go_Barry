-- Simple VACUUM Commands for Supabase
-- Copy and paste each command separately into SQL Editor
-- DO NOT run as a batch - run one at a time

-- Command 1: VACUUM roadworks table
VACUUM roadworks;

-- Command 2: VACUUM supervisors table  
VACUUM supervisors;

-- Command 3: VACUUM supervisor_sessions table
VACUUM supervisor_sessions;

-- Command 4: VACUUM message_templates table
VACUUM message_templates;

-- Command 5: VACUUM all other tables we found
VACUUM alerts;

-- Command 6: VACUUM incidents
VACUUM incidents;

-- Command 7: VACUUM disruptions  
VACUUM disruptions;

-- Command 8: VACUUM street_manager_data
VACUUM street_manager_data;

-- Command 9: VACUUM audit_logs
VACUUM audit_logs;

-- Command 10: VACUUM geocoding_cache
VACUUM geocoding_cache;

-- Command 11: After all VACUUMs, check if size improved
SELECT pg_size_pretty(pg_database_size(current_database())) as "Database Size After VACUUM";