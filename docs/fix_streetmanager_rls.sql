-- Check what's wrong with the table
-- Run each part separately in Supabase SQL Editor

-- 1. Check if RLS is blocking inserts
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'streetmanager_notifications';

-- 2. Disable RLS temporarily to test
ALTER TABLE streetmanager_notifications DISABLE ROW LEVEL SECURITY;

-- 3. Try a direct insert
INSERT INTO streetmanager_notifications (
  notification_id,
  webhook_received_at,
  raw_webhook_data
) VALUES (
  'direct_test_' || NOW()::text,
  NOW(),
  '{"test": "direct insert"}'::jsonb
) RETURNING *;

-- 4. Check if it worked
SELECT COUNT(*) as total_records FROM streetmanager_notifications;

-- 5. If the direct insert worked, the issue is RLS. Fix with:
CREATE POLICY "Allow all for service role" ON streetmanager_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow inserts for anon" ON streetmanager_notifications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select for anon" ON streetmanager_notifications
  FOR SELECT TO anon USING (true);

-- 6. Re-enable RLS with the new policies
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;
