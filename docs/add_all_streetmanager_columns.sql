-- Add ALL fields that the current production webhook handler expects
-- This will make the existing deployed code work immediately

-- Add all missing columns (safe - won't error if they exist)
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

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'streetmanager_notifications'
ORDER BY ordinal_position;
