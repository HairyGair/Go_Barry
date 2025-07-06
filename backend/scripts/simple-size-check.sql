-- Simple Database Size Check for Supabase
-- Copy and paste each query one at a time

-- Query 1: Total database size
SELECT pg_size_pretty(pg_database_size(current_database())) as "Total Database Size";

-- Query 2: Check our main tables
SELECT 
  'roadworks' as "Table",
  pg_size_pretty(pg_total_relation_size('roadworks')) as "Size",
  (SELECT COUNT(*) FROM roadworks) as "Rows";

-- Query 3: Check supervisors table  
SELECT 
  'supervisors' as "Table",
  pg_size_pretty(pg_total_relation_size('supervisors')) as "Size",
  (SELECT COUNT(*) FROM supervisors) as "Rows";

-- Query 4: Check supervisor_sessions table
SELECT 
  'supervisor_sessions' as "Table", 
  pg_size_pretty(pg_total_relation_size('supervisor_sessions')) as "Size",
  (SELECT COUNT(*) FROM supervisor_sessions) as "Rows";

-- Query 5: Check message_templates table
SELECT 
  'message_templates' as "Table",
  pg_size_pretty(pg_total_relation_size('message_templates')) as "Size", 
  (SELECT COUNT(*) FROM message_templates) as "Rows";

-- Query 6: List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;