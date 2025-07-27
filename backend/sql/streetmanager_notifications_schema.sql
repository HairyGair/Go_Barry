-- Go BARRY StreetManager Notifications Table
-- Comprehensive schema for UK StreetManager webhook data
-- Optimized for performance with proper indexing and RLS policies

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Table: streetmanager_notifications
-- Stores full StreetManager webhook notifications with UK-specific fields
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

-- Performance indexes for common query patterns
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

CREATE INDEX IF NOT EXISTS idx_streetmanager_traffic_management 
  ON streetmanager_notifications(traffic_management_type_ref, is_emergency_works);

CREATE INDEX IF NOT EXISTS idx_streetmanager_severity_impact 
  ON streetmanager_notifications(severity, route_impact_score);

CREATE INDEX IF NOT EXISTS idx_streetmanager_cleanup_date 
  ON streetmanager_notifications(cleanup_date) 
  WHERE cleanup_date IS NOT NULL;

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_streetmanager_active_works 
  ON streetmanager_notifications(work_status, start_date, end_date) 
  WHERE work_status IN ('in_progress', 'planned');

CREATE INDEX IF NOT EXISTS idx_streetmanager_route_impacts 
  ON streetmanager_notifications USING GIN(affected_routes) 
  WHERE affected_routes IS NOT NULL;

-- Spatial index for coordinates (if using PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_streetmanager_coordinates_gist 
--   ON streetmanager_notifications USING GIST(coordinates);

-- JSONB indexes for webhook data queries
CREATE INDEX IF NOT EXISTS idx_streetmanager_raw_data_gin 
  ON streetmanager_notifications USING GIN(raw_webhook_data);

-- Text search index for location descriptions
CREATE INDEX IF NOT EXISTS idx_streetmanager_location_text 
  ON streetmanager_notifications USING GIN(
    to_tsvector('english', 
      COALESCE(street_name, '') || ' ' || 
      COALESCE(location_description, '') || ' ' || 
      COALESCE(area, '') || ' ' || 
      COALESCE(town, '')
    )
  );

-- Duplicate detection index
CREATE INDEX IF NOT EXISTS idx_streetmanager_duplicate_check 
  ON streetmanager_notifications(duplicate_check_hash) 
  WHERE duplicate_check_hash IS NOT NULL;

-- Row Level Security (RLS) Policies
-- Enable RLS on the table
ALTER TABLE streetmanager_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow supervisors and admin to read all notifications
CREATE POLICY streetmanager_notifications_read_policy ON streetmanager_notifications
  FOR SELECT
  USING (
    -- Allow public read access for now (can be restricted based on auth)
    true
  );

-- Policy: Allow system/webhook to insert notifications
CREATE POLICY streetmanager_notifications_insert_policy ON streetmanager_notifications
  FOR INSERT
  WITH CHECK (
    -- Allow inserts from webhook system
    true
  );

-- Policy: Allow system to update processing status
CREATE POLICY streetmanager_notifications_update_policy ON streetmanager_notifications
  FOR UPDATE
  USING (
    -- Allow updates for processing status and metadata
    true
  );

-- Policy: Allow cleanup operations to delete old records
CREATE POLICY streetmanager_notifications_delete_policy ON streetmanager_notifications
  FOR DELETE
  USING (
    -- Allow deletion of records past cleanup date
    cleanup_date IS NOT NULL AND cleanup_date < NOW()
  );

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

-- Function to generate duplicate check hash
CREATE OR REPLACE FUNCTION generate_duplicate_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duplicate_check_hash = encode(
    digest(
      COALESCE(NEW.permit_reference_number, '') || 
      COALESCE(NEW.street_name, '') || 
      COALESCE(NEW.start_date::text, '') ||
      COALESCE(NEW.organisation_name, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_duplicate_hash_trigger
  BEFORE INSERT OR UPDATE ON streetmanager_notifications
  FOR EACH ROW
  EXECUTE FUNCTION generate_duplicate_hash();

-- Create helper function for route impact scoring
CREATE OR REPLACE FUNCTION calculate_route_impact_score(routes TEXT[])
RETURNS INTEGER AS $$
BEGIN
  IF routes IS NULL OR array_length(routes, 1) IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Simple scoring: number of affected routes
  -- Can be enhanced with route importance weighting
  RETURN array_length(routes, 1);
END;
$$ LANGUAGE plpgsql;

-- Create partitioning for large datasets (optional, for high-volume environments)
-- This creates monthly partitions for better performance
-- Uncomment if expecting high volume (>100k records/month)

/*
-- Enable partitioning by month on webhook_received_at
SELECT partman.create_parent(
  p_parent_table => 'public.streetmanager_notifications',
  p_control => 'webhook_received_at',
  p_type => 'range',
  p_interval => 'monthly',
  p_premake => 3
);

-- Auto-create partitions and maintain them
UPDATE partman.part_config 
SET infinite_time_partitions = true 
WHERE parent_table = 'public.streetmanager_notifications';
*/

-- Grant appropriate permissions
-- Grant access to authenticated users (adjust based on your auth system)
GRANT SELECT, INSERT, UPDATE ON streetmanager_notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant specific permissions for webhook system
-- GRANT INSERT, UPDATE ON streetmanager_notifications TO webhook_user;

-- Create view for active notifications (commonly used)
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

-- Create view for high-impact notifications
CREATE OR REPLACE VIEW high_impact_streetmanager_notifications AS
SELECT *
FROM streetmanager_notifications
WHERE 
  (route_impact_score >= 3 OR severity = 'High' OR is_emergency_works = true)
  AND work_status IN ('in_progress', 'planned')
  AND status = 'active'
ORDER BY 
  route_impact_score DESC,
  start_date ASC;

-- Maintenance: Create cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_old_streetmanager_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM streetmanager_notifications
  WHERE cleanup_date IS NOT NULL 
    AND cleanup_date < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup operation
  INSERT INTO cleanup_jobs (job_type, records_cleaned, status)
  VALUES ('streetmanager_notifications_cleanup', deleted_count, 'completed');
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule automatic cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-streetmanager', '0 2 * * *', 'SELECT cleanup_old_streetmanager_notifications();');

COMMENT ON TABLE streetmanager_notifications IS 'StreetManager webhook notifications for Go BARRY traffic management system. Stores UK roadworks data with bus route impact analysis.';
COMMENT ON COLUMN streetmanager_notifications.notification_id IS 'Unique notification identifier from webhook';
COMMENT ON COLUMN streetmanager_notifications.raw_webhook_data IS 'Complete webhook payload for audit and debugging';
COMMENT ON COLUMN streetmanager_notifications.affected_routes IS 'Array of bus route numbers impacted by this roadwork';
COMMENT ON COLUMN streetmanager_notifications.route_impact_score IS 'Calculated score based on number and importance of affected routes';
COMMENT ON COLUMN streetmanager_notifications.cleanup_date IS 'Auto-calculated date when record should be deleted (end_date + 7 days)';