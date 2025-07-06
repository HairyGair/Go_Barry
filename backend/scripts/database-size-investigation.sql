-- Database Size Investigation for Supabase
-- Run this in SQL Editor to identify what's consuming 524MB

-- 1. Check total database size
SELECT pg_size_pretty(pg_database_size(current_database())) as total_database_size;

-- 2. Check individual table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Check for bloated tables
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;

-- 4. Check WAL (Write-Ahead Log) usage
SELECT 
  'WAL Size' as component,
  pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0')) as size;

-- 5. Check system catalog sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname IN ('information_schema', 'pg_catalog')
  AND pg_total_relation_size(schemaname||'.'||tablename) > 1024*1024  -- Only show tables > 1MB
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- 6. Check for large objects (LOBs)
SELECT 
  'Large Objects' as component,
  pg_size_pretty(SUM(pg_largeobject_metadata.lomowner)::bigint) as size,
  COUNT(*) as count
FROM pg_largeobject_metadata;

-- 7. Check extensions taking space
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname NOT IN ('plpgsql');  -- Exclude default extensions