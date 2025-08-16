-- Supabase Migration: Create disruptions table for roadworks escalation system
-- Run this in the Supabase SQL Editor

-- Create disruptions table
CREATE TABLE IF NOT EXISTS disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'roadwork',
  status TEXT NOT NULL CHECK (status IN ('Active', 'Ended', 'Reactivated', 'Completed')),
  
  -- Location and route information
  location TEXT NOT NULL,
  street_name TEXT,
  town TEXT,
  highway_authority TEXT,
  coordinates NUMERIC(10, 7)[],
  affected_routes TEXT[],
  
  -- Mileage impact data
  normal_mileage NUMERIC(10, 2),
  diversion_mileage NUMERIC(10, 2),
  mileage_difference NUMERIC(10, 2),
  
  -- Escalation metadata
  pushed_by TEXT NOT NULL,
  pushed_by_name TEXT,
  pushed_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Timing information
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  last_reactivated_at TIMESTAMP WITH TIME ZONE,
  
  -- Reactivation tracking
  reactivation_count INTEGER DEFAULT 0,
  reactivation_history JSONB DEFAULT '[]'::jsonb,
  
  -- Additional data
  notes TEXT,
  diversion_details JSONB,
  original_alert_data JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_disruptions_status ON disruptions(status);
CREATE INDEX idx_disruptions_location ON disruptions(location);
CREATE INDEX idx_disruptions_created_at ON disruptions(created_at DESC);
CREATE INDEX idx_disruptions_affected_routes ON disruptions USING GIN(affected_routes);
CREATE INDEX idx_disruptions_pushed_by ON disruptions(pushed_by);

-- Create partial unique index to prevent duplicate active alerts
-- This allows multiple ended/completed records for the same alert
CREATE UNIQUE INDEX idx_unique_active_alert ON disruptions(alert_id, alert_type) 
WHERE status IN ('Active', 'Reactivated');

-- Create audit log table for comprehensive tracking
CREATE TABLE IF NOT EXISTS disruption_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disruption_id UUID REFERENCES disruptions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_details JSONB,
  performed_by TEXT NOT NULL,
  performed_by_name TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_id TEXT,
  ip_address TEXT
);

-- Create index for audit log queries
CREATE INDEX idx_audit_log_disruption_id ON disruption_audit_log(disruption_id);
CREATE INDEX idx_audit_log_performed_at ON disruption_audit_log(performed_at DESC);
CREATE INDEX idx_audit_log_performed_by ON disruption_audit_log(performed_by);

-- Create view for active disruptions with summary data
CREATE OR REPLACE VIEW active_disruptions AS
SELECT 
  d.*,
  EXTRACT(EPOCH FROM (NOW() - d.escalated_at))/60 AS minutes_active,
  CASE 
    WHEN d.reactivation_count = 0 THEN 'First occurrence'
    WHEN d.reactivation_count = 1 THEN 'Reactivated once'
    ELSE 'Reactivated ' || d.reactivation_count || ' times'
  END AS reactivation_status
FROM disruptions d
WHERE d.status IN ('Active', 'Reactivated')
ORDER BY d.escalated_at DESC;

-- Create function to log audit actions
CREATE OR REPLACE FUNCTION log_disruption_action(
  p_disruption_id UUID,
  p_action TEXT,
  p_action_details JSONB,
  p_performed_by TEXT,
  p_performed_by_name TEXT,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO disruption_audit_log (
    disruption_id, action, action_details, 
    performed_by, performed_by_name, session_id, ip_address
  ) VALUES (
    p_disruption_id, p_action, p_action_details,
    p_performed_by, p_performed_by_name, p_session_id, p_ip_address
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to reactivate a disruption
CREATE OR REPLACE FUNCTION reactivate_disruption(
  p_disruption_id UUID,
  p_reactivated_by TEXT,
  p_reactivated_by_name TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS disruptions AS $$
DECLARE
  v_disruption disruptions;
  v_history_entry JSONB;
BEGIN
  -- Build history entry
  v_history_entry = jsonb_build_object(
    'timestamp', NOW(),
    'reactivated_by', p_reactivated_by,
    'reactivated_by_name', p_reactivated_by_name,
    'reason', p_reason,
    'previous_status', (SELECT status FROM disruptions WHERE id = p_disruption_id)
  );
  
  -- Update disruption
  UPDATE disruptions
  SET 
    status = 'Reactivated',
    reactivation_count = reactivation_count + 1,
    last_reactivated_at = NOW(),
    ended_at = NULL,
    reactivation_history = reactivation_history || v_history_entry
  WHERE id = p_disruption_id
  RETURNING * INTO v_disruption;
  
  -- Log the action
  PERFORM log_disruption_action(
    p_disruption_id,
    'REACTIVATE',
    jsonb_build_object('reason', p_reason),
    p_reactivated_by,
    p_reactivated_by_name
  );
  
  RETURN v_disruption;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your Supabase auth setup)
GRANT ALL ON disruptions TO authenticated;
GRANT ALL ON disruption_audit_log TO authenticated;
GRANT ALL ON active_disruptions TO authenticated;

-- Add RLS policies (optional - adjust based on your security needs)
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disruption_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read disruptions
CREATE POLICY "Authenticated users can read disruptions" ON disruptions
  FOR SELECT TO authenticated
  USING (true);

-- Policy: All authenticated users can insert disruptions
CREATE POLICY "Authenticated users can create disruptions" ON disruptions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Policy: All authenticated users can update disruptions
CREATE POLICY "Authenticated users can update disruptions" ON disruptions
  FOR UPDATE TO authenticated
  USING (true);

-- Similar policies for audit log
CREATE POLICY "Authenticated users can read audit log" ON disruption_audit_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create audit log" ON disruption_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Verify the tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('disruptions', 'disruption_audit_log', 'active_disruptions')
AND table_schema = 'public'
ORDER BY table_name;
