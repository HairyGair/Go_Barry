-- SIMPLIFIED FIX - Just add the essential columns
-- Run this in Supabase SQL Editor NOW

-- Add only the columns that the webhook actually tries to save
ALTER TABLE streetmanager_notifications
  ADD COLUMN IF NOT EXISTS permit_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS activity_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS webhook_event_type TEXT,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Test it worked by inserting a test record
INSERT INTO streetmanager_notifications (
  notification_id,
  webhook_received_at,
  raw_webhook_data,
  title,
  street_name,
  processing_status
) VALUES (
  'manual_test_' || extract(epoch from now())::text,
  NOW(),
  '{"test": true}'::jsonb,
  'Manual Test',
  'Test Street',
  'test'
);

-- Check it saved
SELECT notification_id, title, street_name, created_at 
FROM streetmanager_notifications 
WHERE notification_id LIKE 'manual_test_%'
ORDER BY created_at DESC
LIMIT 1;
