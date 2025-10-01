-- Breakdown Tracking Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Create breakdowns table
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20) UNIQUE NOT NULL,
  daily_id INTEGER NOT NULL,
  fleet_no VARCHAR(10),
  supervisor_badge VARCHAR(10) NOT NULL,
  supervisor_name VARCHAR(100),
  
  -- Location fields
  location TEXT,
  location_type VARCHAR(50),
  location_coords JSONB,
  location_w3w VARCHAR(100),
  location_verified BOOLEAN DEFAULT FALSE,
  location_accuracy FLOAT,
  location_updated_at TIMESTAMPTZ,
  
  -- Breakdown details
  depot_id VARCHAR(50),
  route_id VARCHAR(20),
  wizard_type VARCHAR(50),
  wizard_steps JSONB,
  
  -- Status tracking
  status VARCHAR(20) CHECK (status IN ('received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving', 'cleared')),
  severity VARCHAR(20) CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE')),
  diagnosis TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  diagnosed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  returned_to_service_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Resolution
  resolution_notes TEXT,
  resolving_supervisor VARCHAR(10),
  
  -- Flags
  is_priority BOOLEAN DEFAULT FALSE,
  repeat_breakdown BOOLEAN DEFAULT FALSE,
  previous_breakdown_id VARCHAR(20),
  auto_escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMPTZ,
  passenger_cloud_used BOOLEAN DEFAULT FALSE,
  
  -- Archive
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  
  -- Calculated field
  total_duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN resolved_at IS NOT NULL THEN 
        EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60
      ELSE NULL
    END
  ) STORED
);

-- Create indexes
CREATE INDEX idx_breakdowns_status ON breakdowns(status) WHERE archived = FALSE;
CREATE INDEX idx_breakdowns_fleet ON breakdowns(fleet_no);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot_id);
CREATE INDEX idx_breakdowns_created ON breakdowns(created_at DESC);
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_badge);

-- Create breakdown events table
CREATE TABLE IF NOT EXISTS breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20) REFERENCES breakdowns(breakdown_id),
  event_type VARCHAR(50) NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  by_badge VARCHAR(10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create priority services table
CREATE TABLE IF NOT EXISTS priority_services (
  id SERIAL PRIMARY KEY,
  route_number VARCHAR(20) UNIQUE NOT NULL,
  priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'secured', 'important')),
  color_code VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default priority routes
INSERT INTO priority_services (route_number, priority_level, color_code) VALUES
  ('X10', 'critical', '#FF0000'),
  ('X21', 'critical', '#FF0000'),
  ('307', 'secured', '#FFA500'),
  ('1', 'important', '#FFFF00')
ON CONFLICT (route_number) DO NOTHING;

-- Create location history table
CREATE TABLE IF NOT EXISTS breakdown_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20),
  location TEXT,
  location_coords JSONB,
  location_w3w VARCHAR(100),
  location_type VARCHAR(50),
  updated_by VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to get next breakdown ID
CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS TEXT AS $$
DECLARE
  year INTEGER;
  last_num INTEGER;
  new_id TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(breakdown_id FROM 9 FOR 5) AS INTEGER)),
    0
  ) INTO last_num
  FROM breakdowns
  WHERE breakdown_id LIKE 'BD-' || year || '-%';
  
  new_id := 'BD-' || year || '-' || LPAD((last_num + 1)::TEXT, 5, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to create breakdown
CREATE OR REPLACE FUNCTION create_breakdown(
  p_fleet_number VARCHAR,
  p_supervisor_badge VARCHAR,
  p_supervisor_name VARCHAR,
  p_location TEXT,
  p_depot_id VARCHAR,
  p_wizard_type VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_breakdown_id TEXT;
  v_daily_id INTEGER;
BEGIN
  -- Get next breakdown ID
  v_breakdown_id := get_next_breakdown_id();
  
  -- Get next daily ID
  SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_daily_id
  FROM breakdowns
  WHERE created_at >= DATE_TRUNC('day', NOW()) + INTERVAL '1 hour';
  
  -- Insert breakdown
  INSERT INTO breakdowns (
    breakdown_id,
    daily_id,
    fleet_no,
    supervisor_badge,
    supervisor_name,
    location,
    depot_id,
    wizard_type,
    status
  ) VALUES (
    v_breakdown_id,
    v_daily_id,
    p_fleet_number,
    p_supervisor_badge,
    p_supervisor_name,
    p_location,
    p_depot_id,
    p_wizard_type,
    'received'
  );
  
  -- Return result
  RETURN json_build_object(
    'success', true,
    'breakdown_id', v_breakdown_id,
    'daily_id', v_daily_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to reset daily counter
CREATE OR REPLACE FUNCTION reset_breakdown_daily_counter()
RETURNS VOID AS $$
BEGIN
  -- This is handled automatically by the daily_id calculation
  -- Nothing to reset as we calculate based on timestamp
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON breakdowns TO authenticated;
GRANT ALL ON breakdown_events TO authenticated;
GRANT ALL ON priority_services TO authenticated;
GRANT ALL ON breakdown_location_history TO authenticated;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_location_history ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
CREATE POLICY "Allow all for authenticated users" ON breakdowns
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all for authenticated users" ON breakdown_events
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow read for all" ON priority_services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all for authenticated users" ON breakdown_location_history
  FOR ALL TO authenticated USING (true);

-- Create view for active breakdowns
CREATE OR REPLACE VIEW active_breakdowns AS
SELECT 
  b.*,
  CASE 
    WHEN b.diagnosed_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (NOW() - b.diagnosed_at)) / 60
    ELSE NULL
  END AS minutes_since_diagnosis,
  CASE 
    WHEN b.created_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60
    ELSE NULL
  END AS minutes_since_start
FROM breakdowns b
WHERE b.status != 'cleared' 
  AND b.archived = FALSE;

-- Grant access to view
GRANT SELECT ON active_breakdowns TO authenticated;
