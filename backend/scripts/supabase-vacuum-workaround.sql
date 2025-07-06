-- Supabase-Compatible Database Cleanup
-- Run each command separately in SQL Editor (not as a batch)

-- 1. Regular VACUUM (works in transactions)
VACUUM roadworks;

-- 2. VACUUM supervisors
VACUUM supervisors;

-- 3. VACUUM supervisor_sessions  
VACUUM supervisor_sessions;

-- 4. VACUUM message_templates
VACUUM message_templates;

-- 5. ANALYZE tables for optimization
ANALYZE roadworks;
ANALYZE supervisors;
ANALYZE supervisor_sessions;
ANALYZE message_templates;

-- 6. Check current table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 7. Check for database bloat sources
SELECT 
  'Database Size' as item,
  pg_size_pretty(pg_database_size(current_database())) as size;

-- 8. Alternative: Drop and recreate unused indexes
-- (Only run if you have unused indexes)
-- REINDEX INDEX CONCURRENTLY index_name;