-- =====================================================
-- Verification Queries for User Preferences Migration
-- =====================================================
-- Run these queries to verify the migration was successful
-- =====================================================

-- 1. Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_preferences', 'notification_preferences')
ORDER BY table_name;

-- 2. Check user_preferences table structure
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- 3. Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('user_preferences', 'notification_preferences');

-- 4. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('user_preferences', 'notification_preferences')
ORDER BY tablename, policyname;

-- 5. Check indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('user_preferences', 'notification_preferences')
ORDER BY tablename, indexname;

-- 6. Check if view was created
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_name = 'supervisor_preferences_view';

-- 7. Check triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_preferences', 'notification_preferences');

-- 8. Test inserting a preference record (uses your supervisor account)
-- Replace with actual supervisor_id from supervisors table
-- SELECT id FROM supervisors WHERE email = 'anthony.gair@gonortheast.co.uk';

-- 9. Count existing supervisors (to know how many preference records we'll eventually need)
SELECT COUNT(*) as total_supervisors FROM supervisors;

-- 10. Check if helper function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_or_create_preferences'
  AND routine_schema = 'public';
