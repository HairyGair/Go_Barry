-- Go BARRY StreetManager Notifications Table
-- Run this SQL in the Supabase SQL Editor to create the table

-- Create the main table
CREATE TABLE IF NOT EXISTS streetmanager_notifications (
  -- Primary identification
  notification_id VARCHAR(255) PRIMARY KEY,
  
  -- Webhook metadata
  webhook_received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  raw_webhook_data JSONB NOT NULL,
  processing_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Core permit information
  permit_reference_number VARCHAR(100),
  event_reference VARCHAR(100),
  
  -- Location details (UK format)
  street_name TEXT,
  area VARCHAR(100),
  town VARCHAR(100),
  postcode VARCHAR(10),
  location_description TEXT,
  coordinates JSONB, -- {lat: number, lng: number}
  easting INTEGER,
  northing INTEGER,
  
  -- Work details
  activity_type VARCHAR(100),
  work_category VARCHAR(50), -- 'major', 'standard', 'minor', 'immediate'
  work_status VARCHAR(50), -- 'proposed', 'planned', 'in_progress', 'completed', 'cancelled'
  
  -- Traffic management
  traffic_management_type VARCHAR(100),
  traffic_management_type_ref VARCHAR(50), -- 'road_closure', 'multi_way_signals', etc.
  is_traffic_sensitive BOOLEAN DEFAULT FALSE,
  is_emergency_works BOOLEAN DEFAULT FALSE,
  
  -- Dates and timing
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Organization details
  organisation_name VARCHAR(200),
  contractor VARCHAR(200),
  contact_details JSONB,
  
  -- Impact assessment
  severity VARCHAR(20) DEFAULT 'Low', -- 'Low', 'Medium', 'High'
  impact_level VARCHAR(20),
  affected_routes TEXT[], -- Array of bus route numbers
  route_impact_score INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  alert_status VARCHAR(20) DEFAULT 'green', -- 'red', 'amber', 'green'
  
  -- Additional metadata
  source VARCHAR(50) DEFAULT 'streetmanager_webhook',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Cleanup management
  cleanup_date TIMESTAMP WITH TIME ZONE,
  
  -- Internal tracking
  duplicate_check_hash VARCHAR(64),
  version INTEGER DEFAULT 1
);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_streetmanager_webhook_received_at 
  ON streetmanager_notifications(webhook_received_at DESC);

CREATE INDEX IF NOT EXISTS idx_streetmanager_permit_reference 
  ON streetmanager_notifications(permit_reference_number);

CREATE INDEX IF NOT EXISTS idx_streetmanager_status_date 
  ON streetmanager_notifications(processing_status, webhook_received_at);

CREATE INDEX IF NOT EXISTS idx_streetmanager_location_town 
  ON streetmanager_notifications(town, area);

CREATE INDEX IF NOT EXISTS idx_streetmanager_work_status 
  ON streetmanager_notifications(work_status, start_date);

-- JSONB index for raw webhook data queries
CREATE INDEX IF NOT EXISTS idx_streetmanager_raw_data_gin 
  ON streetmanager_notifications USING GIN(raw_webhook_data);

-- Array index for affected routes
CREATE INDEX IF NOT EXISTS idx_streetmanager_route_impacts 
  ON streetmanager_notifications USING GIN(affected_routes);

-- Enable Row Level Security (RLS)
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for read access
CREATE POLICY IF NOT EXISTS streetmanager_notifications_read_policy 
  ON streetmanager_notifications
  FOR SELECT
  USING (true); -- Allow all reads for now

-- Create RLS policies for insert access
CREATE POLICY IF NOT EXISTS streetmanager_notifications_insert_policy 
  ON streetmanager_notifications
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts for now

-- Create RLS policies for update access
CREATE POLICY IF NOT EXISTS streetmanager_notifications_update_policy 
  ON streetmanager_notifications
  FOR UPDATE
  USING (true); -- Allow all updates for now

-- Create view for active notifications
CREATE OR REPLACE VIEW active_streetmanager_notifications AS
SELECT 
  notification_id,
  permit_reference_number,
  street_name,
  town,
  area,
  work_status,
  traffic_management_type,
  severity,
  start_date,
  end_date,
  affected_routes,
  route_impact_score,
  organisation_name,
  created_at,
  updated_at
FROM streetmanager_notifications
WHERE 
  work_status IN ('in_progress', 'planned', 'proposed')
  AND (end_date IS NULL OR end_date >= NOW())
  AND status = 'active'
ORDER BY 
  route_impact_score DESC,
  severity DESC,
  start_date ASC;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON streetmanager_notifications TO authenticated;
GRANT SELECT ON active_streetmanager_notifications TO authenticated;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'StreetManager notifications table created successfully!';
END $$;