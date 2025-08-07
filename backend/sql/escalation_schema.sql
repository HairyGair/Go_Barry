-- SQL migration for escalation system database schema
-- This creates the necessary tables for the comprehensive escalation workflow

-- Create disruptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS disruptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  original_alert_data JSONB NOT NULL,
  services_affected TEXT[],
  ticket_machine_messages JSONB,
  customer_messages JSONB,
  supervisor_workflow_data JSONB,
  escalation_data JSONB,
  display_screen_config JSONB,
  email_notification_data JSONB,
  coordinate_data JSONB,
  route_impact_analysis JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  escalated_by TEXT NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create display_screen_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS display_screen_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  display_config JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE
);

-- Create supervisor_audit_log table if it doesn't exist  
CREATE TABLE IF NOT EXISTS supervisor_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT,
  supervisor_badge TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_disruptions_alert_id ON disruptions(alert_id);
CREATE INDEX IF NOT EXISTS idx_disruptions_escalated_by ON disruptions(escalated_by);
CREATE INDEX IF NOT EXISTS idx_disruptions_status ON disruptions(status);
CREATE INDEX IF NOT EXISTS idx_disruptions_escalated_at ON disruptions(escalated_at DESC);

CREATE INDEX IF NOT EXISTS idx_display_alerts_alert_id ON display_screen_alerts(alert_id);
CREATE INDEX IF NOT EXISTS idx_display_alerts_status ON display_screen_alerts(status);
CREATE INDEX IF NOT EXISTS idx_display_alerts_expires_at ON display_screen_alerts(expires_at);

CREATE INDEX IF NOT EXISTS idx_audit_log_supervisor ON supervisor_audit_log(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON supervisor_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_alert_id ON supervisor_audit_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON supervisor_audit_log(created_at DESC);

-- Add updated_at trigger for disruptions table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_disruptions_updated_at ON disruptions;
CREATE TRIGGER update_disruptions_updated_at
  BEFORE UPDATE ON disruptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to automatically expire old display alerts
CREATE OR REPLACE FUNCTION expire_old_display_alerts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE display_screen_alerts 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ language 'plpgsql';

-- Create a function to get escalation statistics
CREATE OR REPLACE FUNCTION get_escalation_stats(supervisor_badge TEXT DEFAULT NULL, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  total_escalations BIGINT,
  escalations_today BIGINT,
  avg_per_day NUMERIC,
  display_pushes BIGINT,
  email_escalations BIGINT,
  top_escalation_reasons JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH escalation_data AS (
    SELECT 
      d.*,
      (d.escalation_data->>'escalationReason') as reason,
      CASE 
        WHEN d.display_screen_config IS NOT NULL THEN 1 
        ELSE 0 
      END as has_display,
      CASE 
        WHEN d.email_notification_data IS NOT NULL THEN 1 
        ELSE 0 
      END as has_email
    FROM disruptions d
    WHERE 
      (supervisor_badge IS NULL OR d.escalated_by = supervisor_badge)
      AND d.escalated_at >= NOW() - (days_back || ' days')::INTERVAL
  ),
  reason_counts AS (
    SELECT 
      reason,
      COUNT(*) as count
    FROM escalation_data
    WHERE reason IS NOT NULL
    GROUP BY reason
    ORDER BY count DESC
    LIMIT 5
  )
  SELECT 
    COUNT(*)::BIGINT as total_escalations,
    COUNT(CASE WHEN DATE(escalated_at) = CURRENT_DATE THEN 1 END)::BIGINT as escalations_today,
    ROUND(COUNT(*)::NUMERIC / GREATEST(days_back, 1), 2) as avg_per_day,
    SUM(has_display)::BIGINT as display_pushes,
    SUM(has_email)::BIGINT as email_escalations,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('reason', reason, 'count', count)) FROM reason_counts),
      '[]'::jsonb
    ) as top_escalation_reasons
  FROM escalation_data;
END;
$$ language 'plpgsql';

-- Add Row Level Security (RLS) policies for security
ALTER TABLE disruptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_screen_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Supervisors can only see their own escalations (can be overridden by service role)
CREATE POLICY supervisor_disruptions_policy ON disruptions
  FOR ALL 
  TO authenticated 
  USING (escalated_by = current_setting('request.jwt.claims', true)::json->>'badge');

-- Policy: Display alerts are visible to all authenticated users
CREATE POLICY display_alerts_read_policy ON display_screen_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert display alerts
CREATE POLICY display_alerts_insert_policy ON display_screen_alerts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Audit logs are readable by supervisors for their own actions
CREATE POLICY audit_log_policy ON supervisor_audit_log
  FOR SELECT
  TO authenticated
  USING (supervisor_badge = current_setting('request.jwt.claims', true)::json->>'badge');

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON disruptions TO authenticated;
GRANT SELECT ON display_screen_alerts TO authenticated;
GRANT SELECT ON supervisor_audit_log TO authenticated;

-- Grant full permissions to service role (for backend operations)
GRANT ALL ON disruptions TO service_role;
GRANT ALL ON display_screen_alerts TO service_role;
GRANT ALL ON supervisor_audit_log TO service_role;

-- Add helpful comments for documentation
COMMENT ON TABLE disruptions IS 'Stores comprehensive data for escalated roadworks alerts including workflow information';
COMMENT ON TABLE display_screen_alerts IS 'Manages alerts pushed to display screens with map zoom configurations';
COMMENT ON TABLE supervisor_audit_log IS 'Tracks all supervisor actions for audit and compliance purposes';

COMMENT ON COLUMN disruptions.original_alert_data IS 'Complete original alert data from Street Manager or other sources';
COMMENT ON COLUMN disruptions.services_affected IS 'Array of bus service numbers affected by the disruption';
COMMENT ON COLUMN disruptions.ticket_machine_messages IS 'Messages generated for bus ticket machines';
COMMENT ON COLUMN disruptions.customer_messages IS 'Messages for passenger cloud and customer communication';
COMMENT ON COLUMN disruptions.supervisor_workflow_data IS 'Complete workflow information including supervisor notes';
COMMENT ON COLUMN disruptions.escalation_data IS 'Escalation metadata including reason and options selected';
COMMENT ON COLUMN disruptions.coordinate_data IS 'Geographical data for mapping and location services';
COMMENT ON COLUMN disruptions.route_impact_analysis IS 'Analysis of route impacts and alternative options';

COMMENT ON FUNCTION get_escalation_stats IS 'Returns comprehensive escalation statistics for dashboard reporting';
COMMENT ON FUNCTION expire_old_display_alerts IS 'Automatically expires old display alerts - run via cron job';

-- Insert some initial test data for development (will be ignored if data exists)
INSERT INTO disruptions (
  alert_id,
  original_alert_data,
  services_affected,
  supervisor_workflow_data,
  escalation_data,
  escalated_by
) VALUES (
  'test-escalation-001',
  '{"title": "Sample Roadwork", "location": "A1 Newcastle", "description": "Test escalation data"}',
  ARRAY['21', '22', 'X1'],
  '{"workflowNotes": "Sample escalation for testing", "processedAt": "2025-01-01T00:00:00Z"}',
  '{"escalationReason": "Testing system", "urgencyLevel": "low", "escalatedBy": "AG003"}',
  'AG003'
) ON CONFLICT DO NOTHING;

-- Create a view for supervisor dashboard
CREATE OR REPLACE VIEW supervisor_escalation_summary AS
SELECT 
  d.escalated_by,
  COUNT(*) as total_escalations,
  COUNT(CASE WHEN d.escalated_at::date = CURRENT_DATE THEN 1 END) as today_escalations,
  COUNT(CASE WHEN d.escalated_at > NOW() - INTERVAL '7 days' THEN 1 END) as week_escalations,
  MAX(d.escalated_at) as last_escalation,
  COUNT(CASE WHEN d.display_screen_config IS NOT NULL THEN 1 END) as display_pushes,
  COUNT(CASE WHEN d.email_notification_data IS NOT NULL THEN 1 END) as email_escalations
FROM disruptions d
WHERE d.escalated_at > NOW() - INTERVAL '30 days'
GROUP BY d.escalated_by
ORDER BY total_escalations DESC;

GRANT SELECT ON supervisor_escalation_summary TO authenticated;
GRANT SELECT ON supervisor_escalation_summary TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Escalation database schema created successfully!';
  RAISE NOTICE 'Tables: disruptions, display_screen_alerts, supervisor_audit_log';
  RAISE NOTICE 'Functions: get_escalation_stats, expire_old_display_alerts';
  RAISE NOTICE 'View: supervisor_escalation_summary';
  RAISE NOTICE 'RLS policies enabled for security';
END $$;