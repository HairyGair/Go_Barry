-- Go BARRY - Manual Incidents & Roadworks Schema Extension
-- Add these tables to your existing Supabase database
-- Run this in Supabase SQL Editor

-- ===============================================
-- TABLE: manual_incidents (from Incident Manager)
-- ===============================================
CREATE TABLE IF NOT EXISTS manual_incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT,
  location TEXT NOT NULL,
  coordinates JSONB, -- {latitude: float, longitude: float}
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  severity TEXT NOT NULL, -- 'Low', 'Medium', 'High', 'Critical'
  notes TEXT,
  affected_routes TEXT[],
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'monitoring', 'resolved'
  
  -- Supervisor tracking
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  
  -- Enhancement data
  enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
  tomtom_features JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual',
  
  -- Cleanup tracking
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_retention_date ON manual_incidents(retention_date);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents(location);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_by ON manual_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_affected_routes ON manual_incidents USING GIN(affected_routes);

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
  
  -- Timing
  planned_start_date TIMESTAMP WITH TIME ZONE,
  planned_end_date TIMESTAMP WITH TIME ZONE,
  estimated_duration TEXT,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Classification
  roadwork_type TEXT, -- 'road_surface', 'utilities', 'maintenance', 'general'
  traffic_management TEXT, -- 'lane_closure', 'road_closure', 'traffic_lights', 'traffic_control'
  priority TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low', 'planned'
  
  -- Route Impact
  affected_routes TEXT[],
  impact_assessment JSONB,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'reported', -- 'reported', 'assessing', 'planning', 'approved', 'active', 'monitoring', 'completed', 'cancelled'
  assigned_to TEXT,
  assigned_to_name TEXT,
  
  -- Task Management
  tasks JSONB DEFAULT '[]',
  communications JSONB DEFAULT '[]',
  diversions JSONB DEFAULT '[]',
  council_coordination JSONB DEFAULT '[]',
  
  -- Audit Trail
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT,
  status_history JSONB DEFAULT '[]',
  
  -- Source Information
  source_type TEXT DEFAULT 'manual', -- 'manual', 'streetmanager', 'council', 'public'
  source_reference TEXT,
  notification_method TEXT,
  
  -- Display Control
  promoted_to_display BOOLEAN DEFAULT FALSE,
  display_promoted_by TEXT,
  display_promoted_by_name TEXT,
  display_promoted_at TIMESTAMP WITH TIME ZONE,
  display_notes TEXT,
  display_promotion_reason TEXT,
  display_removed_by TEXT,
  display_removed_by_name TEXT,
  display_removed_at TIMESTAMP WITH TIME ZONE,
  display_removal_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cleanup tracking
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_status ON manual_roadworks(status);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_priority ON manual_roadworks(priority);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_created_at ON manual_roadworks(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_retention_date ON manual_roadworks(retention_date);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_location ON manual_roadworks(location);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_assigned_to ON manual_roadworks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_affected_routes ON manual_roadworks USING GIN(affected_routes);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_promoted_to_display ON manual_roadworks(promoted_to_display);
CREATE INDEX IF NOT EXISTS idx_manual_roadworks_planned_start_date ON manual_roadworks(planned_start_date);

-- ===============================================
-- TABLE: supervisor_actions (audit trail for incidents/roadworks)
-- ===============================================
CREATE TABLE IF NOT EXISTS supervisor_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'incident_created', 'incident_updated', 'roadwork_created', 'roadwork_status_changed', etc.
  target_type TEXT NOT NULL, -- 'incident', 'roadwork'
  target_id TEXT NOT NULL,
  details JSONB,
  
  -- Timestamps
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Cleanup tracking
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Indexes for supervisor actions
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor_badge ON supervisor_actions(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_action_type ON supervisor_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_type ON supervisor_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_id ON supervisor_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_performed_at ON supervisor_actions(performed_at);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_retention_date ON supervisor_actions(retention_date);

-- ===============================================
-- RETENTION CLEANUP FUNCTIONS
-- ===============================================

-- Function to clean up old data (3+ months)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE(
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  incidents_deleted BIGINT;
  roadworks_deleted BIGINT;
  actions_deleted BIGINT;
  historical_deleted BIGINT;
BEGIN
  -- Clean up manual incidents older than 3 months
  DELETE FROM manual_incidents WHERE retention_date < NOW();
  GET DIAGNOSTICS incidents_deleted = ROW_COUNT;
  
  -- Clean up manual roadworks older than 3 months
  DELETE FROM manual_roadworks WHERE retention_date < NOW();
  GET DIAGNOSTICS roadworks_deleted = ROW_COUNT;
  
  -- Clean up supervisor actions older than 3 months
  DELETE FROM supervisor_actions WHERE retention_date < NOW();
  GET DIAGNOSTICS actions_deleted = ROW_COUNT;
  
  -- Clean up historical incidents older than 3 months
  DELETE FROM historical_incidents WHERE recorded_at < (NOW() - INTERVAL '3 months');
  GET DIAGNOSTICS historical_deleted = ROW_COUNT;
  
  -- Return results
  RETURN QUERY VALUES 
    ('manual_incidents', incidents_deleted),
    ('manual_roadworks', roadworks_deleted),
    ('supervisor_actions', actions_deleted),
    ('historical_incidents', historical_deleted);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS TO UPDATE retention_date AND last_updated
-- ===============================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_manual_incidents_timestamp
  BEFORE UPDATE ON manual_incidents
  FOR EACH ROW EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER update_manual_roadworks_timestamp
  BEFORE UPDATE ON manual_roadworks
  FOR EACH ROW EXECUTE FUNCTION update_last_updated();

-- ===============================================
-- RETENTION MANAGEMENT
-- ===============================================

-- Function to extend retention for specific records (if needed)
CREATE OR REPLACE FUNCTION extend_retention(
  table_name TEXT,
  record_id TEXT,
  additional_months INTEGER DEFAULT 3
)
RETURNS BOOLEAN AS $$
DECLARE
  sql_statement TEXT;
BEGIN
  IF table_name IN ('manual_incidents', 'manual_roadworks', 'supervisor_actions') THEN
    sql_statement := format(
      'UPDATE %I SET retention_date = NOW() + INTERVAL ''%s months'' WHERE id = $1',
      table_name,
      additional_months
    );
    EXECUTE sql_statement USING record_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- SAMPLE USAGE
-- ===============================================

-- To run manual cleanup:
-- SELECT * FROM cleanup_old_data();

-- To extend retention for a specific record:
-- SELECT extend_retention('manual_incidents', 'incident_123', 6);

-- To check what will be deleted soon:
-- SELECT id, location, retention_date FROM manual_incidents WHERE retention_date < NOW() + INTERVAL '7 days';
-- SELECT id, title, retention_date FROM manual_roadworks WHERE retention_date < NOW() + INTERVAL '7 days';

COMMENT ON TABLE manual_incidents IS 'Manual incidents created by supervisors via Incident Manager';
COMMENT ON TABLE manual_roadworks IS 'Manual roadworks created by supervisors via Roadworks Manager';
COMMENT ON TABLE supervisor_actions IS 'Audit trail of all supervisor actions on incidents and roadworks';
COMMENT ON FUNCTION cleanup_old_data() IS 'Removes all data older than 3 months from manual tables';
COMMENT ON FUNCTION extend_retention(TEXT, TEXT, INTEGER) IS 'Extends retention period for specific records';
