-- Fix the NOT NULL constraints that are blocking inserts
-- Run this in Supabase SQL Editor

-- 1. Remove NOT NULL constraints from optional fields
ALTER TABLE streetmanager_notifications
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN permit_reference_number DROP NOT NULL,
  ALTER COLUMN activity_reference_number DROP NOT NULL,
  ALTER COLUMN street_name DROP NOT NULL,
  ALTER COLUMN webhook_event_type DROP NOT NULL;

-- 2. Test insert now
INSERT INTO streetmanager_notifications (
  notification_id,
  webhook_received_at,
  raw_webhook_data
) VALUES (
  'test_after_fix_' || extract(epoch from now())::text,
  NOW(),
  '{"test": "after constraint fix"}'::jsonb
) RETURNING notification_id, created_at;

-- 3. Check if it worked
SELECT notification_id, title, street_name, created_at 
FROM streetmanager_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. If RLS is still enabled, add proper policies
DROP POLICY IF EXISTS "Allow all operations" ON streetmanager_notifications;

CREATE POLICY "Enable all access" ON streetmanager_notifications
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Make sure the table is accessible
GRANT ALL ON streetmanager_notifications TO anon;
GRANT ALL ON streetmanager_notifications TO authenticated;
GRANT ALL ON streetmanager_notifications TO service_role;
