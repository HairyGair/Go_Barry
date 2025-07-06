-- Emergency Database Vacuum Script
-- Run this in Supabase SQL Editor to reclaim space

-- 1. Vacuum all tables to reclaim deleted space
VACUUM FULL roadworks;
VACUUM FULL supervisors;
VACUUM FULL supervisor_sessions;
VACUUM FULL message_templates;

-- 2. Reindex to optimize indexes
REINDEX TABLE roadworks;
REINDEX TABLE supervisors;
REINDEX TABLE supervisor_sessions;
REINDEX TABLE message_templates;

-- 3. Analyze tables for query optimization
ANALYZE roadworks;
ANALYZE supervisors;
ANALYZE supervisor_sessions;
ANALYZE message_templates;

-- 4. Check table sizes after vacuum
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;