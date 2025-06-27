-- Simple StreetManager notifications table creation
-- Run this in Supabase SQL editor to fix the missing columns

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL,
  raw_webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE streetmanager_notifications 
  ADD COLUMN IF NOT EXISTS permit_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS activity_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS work_reference_number TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS webhook_event_type TEXT,
  ADD COLUMN IF NOT EXISTS activity_status TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS alert_status TEXT,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS area_name TEXT,
  ADD COLUMN IF NOT EXISTS location_description TEXT,
  ADD COLUMN IF NOT EXISTS town TEXT,
  ADD COLUMN IF NOT EXISTS usrn TEXT,
  ADD COLUMN IF NOT EXISTS coordinates JSONB,
  ADD COLUMN IF NOT EXISTS promoter_organisation TEXT,
  ADD COLUMN IF NOT EXISTS promoter_swa_code TEXT,
  ADD COLUMN IF NOT EXISTS highway_authority TEXT,
  ADD COLUMN IF NOT EXISTS highway_authority_swa_code TEXT,
  ADD COLUMN IF NOT EXISTS work_description TEXT,
  ADD COLUMN IF NOT EXISTS work_category TEXT,
  ADD COLUMN IF NOT EXISTS activity_type TEXT,
  ADD COLUMN IF NOT EXISTS permit_status TEXT,
  ADD COLUMN IF NOT EXISTS work_status TEXT,
  ADD COLUMN IF NOT EXISTS traffic_management_type TEXT,
  ADD COLUMN IF NOT EXISTS permit_conditions TEXT,
  ADD COLUMN IF NOT EXISTS is_traffic_sensitive TEXT,
  ADD COLUMN IF NOT EXISTS proposed_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error TEXT,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sns_message_id TEXT,
  ADD COLUMN IF NOT EXISTS sns_topic_arn TEXT,
  ADD COLUMN IF NOT EXISTS sns_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS affected_routes TEXT[],
  ADD COLUMN IF NOT EXISTS route_impact_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_sm_notif_id ON streetmanager_notifications(notification_id);
CREATE INDEX IF NOT EXISTS idx_sm_webhook_received ON streetmanager_notifications(webhook_received_at);
CREATE INDEX IF NOT EXISTS idx_sm_processing ON streetmanager_notifications(processing_status);

-- Test query to verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'streetmanager_notifications'
ORDER BY ordinal_position;
