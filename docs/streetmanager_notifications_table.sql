-- Create or update the streetmanager_notifications table in Supabase
-- This table stores webhook notifications from UK StreetManager

CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  -- Primary key
  notification_id TEXT PRIMARY KEY,
  
  -- Reference numbers
  permit_reference_number TEXT,
  activity_reference_number TEXT,
  work_reference_number TEXT,
  
  -- Basic info
  title TEXT,
  description TEXT,
  webhook_event_type TEXT,
  activity_status TEXT,
  severity TEXT,
  alert_status TEXT,
  
  -- Location data
  street_name TEXT,
  area_name TEXT,
  location_description TEXT,
  town TEXT,
  usrn TEXT,
  coordinates JSONB, -- Stores {lat, lng} after BNG conversion
  
  -- Organisation data
  promoter_organisation TEXT,
  promoter_swa_code TEXT,
  highway_authority TEXT,
  highway_authority_swa_code TEXT,
  
  -- Work details
  work_description TEXT,
  work_category TEXT,
  activity_type TEXT,
  permit_status TEXT,
  work_status TEXT,
  traffic_management_type TEXT,
  permit_conditions TEXT,
  
  -- Traffic sensitivity
  is_traffic_sensitive TEXT,
  
  -- Timing
  proposed_start_date TIMESTAMPTZ,
  proposed_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  
  -- Processing metadata
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  processed_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  
  -- SNS metadata
  sns_message_id TEXT,
  sns_topic_arn TEXT,
  sns_timestamp TIMESTAMPTZ,
  
  -- Raw webhook data
  raw_webhook_data JSONB,
  
  -- Route matching results (populated later)
  affected_routes TEXT[],
  route_impact_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_streetmanager_status ON streetmanager_notifications(activity_status);
CREATE INDEX IF NOT EXISTS idx_streetmanager_severity ON streetmanager_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_streetmanager_dates ON streetmanager_notifications(proposed_start_date, proposed_end_date);
CREATE INDEX IF NOT EXISTS idx_streetmanager_location ON streetmanager_notifications(street_name);
CREATE INDEX IF NOT EXISTS idx_streetmanager_processing ON streetmanager_notifications(processing_status);
CREATE INDEX IF NOT EXISTS idx_streetmanager_webhook_received ON streetmanager_notifications(webhook_received_at);

-- Create a view for active roadworks
CREATE OR REPLACE VIEW active_streetmanager_roadworks AS
SELECT 
  notification_id,
  permit_reference_number,
  activity_reference_number,
  work_reference_number,
  title,
  description,
  webhook_event_type,
  activity_status,
  severity,
  alert_status,
  street_name,
  area_name,
  location_description,
  town,
  coordinates,
  promoter_organisation,
  highway_authority,
  work_category,
  activity_type,
  traffic_management_type,
  is_traffic_sensitive,
  proposed_start_date,
  proposed_end_date,
  actual_start_date,
  actual_end_date,
  affected_routes,
  route_impact_count,
  webhook_received_at,
  updated_at
FROM streetmanager_notifications
WHERE 
  -- Active means: started and not ended yet
  (actual_start_date IS NOT NULL OR proposed_start_date <= NOW()) 
  AND (actual_end_date IS NULL AND (proposed_end_date IS NULL OR proposed_end_date >= NOW()))
  AND processing_status = 'processed'
ORDER BY severity DESC, proposed_start_date ASC;

-- Add RLS (Row Level Security) if needed
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed)
GRANT ALL ON streetmanager_notifications TO authenticated;
GRANT SELECT ON active_streetmanager_roadworks TO authenticated;
