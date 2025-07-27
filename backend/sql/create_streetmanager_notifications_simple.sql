-- Simple StreetManager Notifications Table Creation
-- Run this directly in Supabase SQL Editor if Node.js script fails
-- Go BARRY Project - StreetManager Webhook Integration

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
  
  -- Work details
  activity_type VARCHAR(100),
  work_category VARCHAR(50),
  work_status VARCHAR(50),
  
  -- Traffic management
  traffic_management_type VARCHAR(100),
  traffic_management_type_ref VARCHAR(50),
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
  
  -- Impact assessment
  severity VARCHAR(20) DEFAULT 'Low',
  affected_routes TEXT[],
  route_impact_score INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active',
  alert_status VARCHAR(20) DEFAULT 'green',
  
  -- Additional metadata
  source VARCHAR(50) DEFAULT 'streetmanager_webhook',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  cleanup_date TIMESTAMP WITH TIME ZONE
);

-- Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_streetmanager_webhook_received_at 
  ON streetmanager_notifications(webhook_received_at DESC);

CREATE INDEX IF NOT EXISTS idx_streetmanager_permit_reference 
  ON streetmanager_notifications(permit_reference_number);

CREATE INDEX IF NOT EXISTS idx_streetmanager_status_date 
  ON streetmanager_notifications(processing_status, webhook_received_at);

CREATE INDEX IF NOT EXISTS idx_streetmanager_work_status 
  ON streetmanager_notifications(work_status, start_date);

CREATE INDEX IF NOT EXISTS idx_streetmanager_cleanup_date 
  ON streetmanager_notifications(cleanup_date) 
  WHERE cleanup_date IS NOT NULL;

-- JSONB index for webhook data queries
CREATE INDEX IF NOT EXISTS idx_streetmanager_raw_data_gin 
  ON streetmanager_notifications USING GIN(raw_webhook_data);

-- Route impacts index
CREATE INDEX IF NOT EXISTS idx_streetmanager_route_impacts 
  ON streetmanager_notifications USING GIN(affected_routes) 
  WHERE affected_routes IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow read/write for now - adjust based on your auth)
CREATE POLICY streetmanager_notifications_policy ON streetmanager_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_streetmanager_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streetmanager_notifications_updated_at
  BEFORE UPDATE ON streetmanager_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_streetmanager_notifications_updated_at();

-- Function to calculate cleanup date (end_date + 7 days)
CREATE OR REPLACE FUNCTION calculate_cleanup_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL THEN
    NEW.cleanup_date = NEW.end_date + INTERVAL '7 days';
  ELSIF NEW.actual_end_date IS NOT NULL THEN
    NEW.cleanup_date = NEW.actual_end_date + INTERVAL '7 days';
  ELSE
    -- Default cleanup after 30 days if no end date
    NEW.cleanup_date = NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cleanup_date
  BEFORE INSERT OR UPDATE ON streetmanager_notifications
  FOR EACH ROW
  EXECUTE FUNCTION calculate_cleanup_date();

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

-- Cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_streetmanager_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM streetmanager_notifications
  WHERE cleanup_date IS NOT NULL 
    AND cleanup_date < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON streetmanager_notifications TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON streetmanager_notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;