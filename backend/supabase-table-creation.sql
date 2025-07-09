-- Go BARRY Manual Incidents Table Creation
-- Run this SQL in your Supabase SQL Editor

-- Create manual_incidents table
CREATE TABLE IF NOT EXISTS manual_incidents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  subtype TEXT,
  location TEXT NOT NULL,
  coordinates JSONB,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  severity TEXT NOT NULL,
  notes TEXT,
  affected_routes TEXT[],
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  enhanced_with_tomtom BOOLEAN DEFAULT FALSE,
  tomtom_features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual',
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_incidents_status ON manual_incidents(status);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_at ON manual_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_location ON manual_incidents(location);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_created_by ON manual_incidents(created_by);
CREATE INDEX IF NOT EXISTS idx_manual_incidents_affected_routes ON manual_incidents USING GIN(affected_routes);

-- Create supervisor_actions table for audit trail
CREATE TABLE IF NOT EXISTS supervisor_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retention_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 months')
);

-- Create indexes for supervisor_actions
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor_badge ON supervisor_actions(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_action_type ON supervisor_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_type ON supervisor_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target_id ON supervisor_actions(target_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_performed_at ON supervisor_actions(performed_at);