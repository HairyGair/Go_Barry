-- Create missing manual_roadworks table for Go BARRY
-- This table is referenced in the code but doesn't exist in the database

-- ===============================================
-- TABLE: manual_roadworks (from Roadworks Manager)
-- ===============================================
CREATE TABLE IF NOT EXISTS manual_roadworks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  coordinates JSONB, -- {latitude: float, longitude: float}
  
  -- Authority/Contact Information
  authority TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  
  -- Roadwork Details
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  estimated_duration TEXT,
  road_closure_type TEXT, -- 'full', 'partial', 'lane'
  affected_lanes TEXT,
  traffic_management TEXT,
  
  -- Routing Information
  affected_routes TEXT[],
  diversion_route TEXT,
  alternative_routes TEXT[],
  
  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'monitoring', 'completed', 'cancelled'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  severity TEXT DEFAULT 'medium', -- Added for compatibility
  
  -- Supervisor tracking
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT,
  assigned_to TEXT,
  
  -- Enhanced metadata
  enhanced_with_gtfs BOOLEAN DEFAULT FALSE,
  enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
  automated_matching BOOLEAN DEFAULT FALSE,
  route_matching_confidence NUMERIC(3,2),
  notes TEXT,
  
  -- Display & Promotion
  promoted_to_display BOOLEAN DEFAULT FALSE,
  display_priority INTEGER DEFAULT 0,
  public_message TEXT,
  
  -- Planning
  planned_start_date TIMESTAMP WITH TIME ZONE,
  planned_end_date TIMESTAMP WITH TIME ZONE,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern JSONB,
  
  -- Data retention
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_status ON manual_roadworks(status);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_priority ON manual_roadworks(priority);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_created_at ON manual_roadworks(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_retention_date ON manual_roadworks(retention_date);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_location ON manual_roadworks(location);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_assigned_to ON manual_roadworks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_affected_routes ON manual_roadworks USING GIN(affected_routes);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_promoted_to_display ON manual_roadworks(promoted_to_display);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_planned_start_date ON manual_roadworks(planned_start_date);

-- Add trigger for updating last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_roadworks_timestamp
  BEFORE UPDATE ON manual_roadworks
  FOR EACH ROW EXECUTE FUNCTION update_last_updated();

-- Add comments
COMMENT ON TABLE manual_roadworks IS 'Manual roadworks created by supervisors via Roadworks Manager';
COMMENT ON COLUMN manual_roadworks.coordinates IS 'Location coordinates as {latitude: float, longitude: float}';
COMMENT ON COLUMN manual_roadworks.retention_date IS 'Date when this record will be automatically deleted';