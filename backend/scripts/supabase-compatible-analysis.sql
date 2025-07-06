-- Supabase-Compatible Database Size Analysis
-- Run each query separately in SQL Editor

-- 1. Check total database size
SELECT pg_size_pretty(pg_database_size(current_database())) as total_database_size;

-- 2. Check all table sizes (compatible syntax)
SELECT 
  t.table_schema,
  t.table_name,
  pg_size_pretty(pg_total_relation_size('"'||t.table_schema||'"."'||t.table_name||'"')) as total_size,
  pg_size_pretty(pg_relation_size('"'||t.table_schema||'"."'||t.table_name||'"')) as data_size,
  pg_total_relation_size('"'||t.table_schema||'"."'||t.table_name||'"') as size_bytes
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY pg_total_relation_size('"'||t.table_schema||'"."'||t.table_name||'"') DESC;

-- 3. Check system tables that might be large
SELECT 
  schemaname,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size,
  pg_total_relation_size(schemaname||'.'||relname) as size_bytes
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- 4. Check for dead tuples (indication of bloat)
SELECT 
  schemaname,
  relname as table_name,
  n_tup_ins as inserts,
  n_tup_upd as updates, 
  n_tup_del as deletes,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- 5. Simple row counts for our known tables
SELECT 'roadworks' as table_name, COUNT(*) as row_count FROM roadworks
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL  
SELECT 'supervisor_sessions', COUNT(*) FROM supervisor_sessions
UNION ALL
SELECT 'message_templates', COUNT(*) FROM message_templates;