-- Quick fix for StreetManager notifications table
-- Run this in Supabase SQL Editor to fix the "Failed to save notification" error

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_webhook_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Check if table was created
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'streetmanager_notifications'
) as table_exists;

-- Step 3: Test insert with minimal data
INSERT INTO streetmanager_notifications (
  notification_id,
  webhook_received_at,
  raw_webhook_data
) VALUES (
  'test_' || extract(epoch from now())::text,
  NOW(),
  '{"test": true}'::jsonb
) ON CONFLICT (notification_id) DO NOTHING;

-- Step 4: Verify it worked
SELECT COUNT(*) as test_records FROM streetmanager_notifications WHERE notification_id LIKE 'test_%';

-- Step 5: Clean up test record
DELETE FROM streetmanager_notifications WHERE notification_id LIKE 'test_%';

-- Step 6: Add any additional columns that might be needed (won't fail if they exist)
ALTER TABLE streetmanager_notifications 
  ADD COLUMN IF NOT EXISTS permit_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Step 7: Grant permissions
GRANT ALL ON streetmanager_notifications TO authenticated;
GRANT ALL ON streetmanager_notifications TO anon;
GRANT ALL ON streetmanager_notifications TO service_role;

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS idx_streetmanager_webhook_received 
  ON streetmanager_notifications(webhook_received_at DESC);

-- Final check
SELECT 
  'Table exists' as status,
  COUNT(*) as column_count,
  array_agg(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'streetmanager_notifications'
GROUP BY table_name;
