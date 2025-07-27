-- Supervisor Activity Logging Schema
-- Run this in your Supabase SQL editor to create the activity logging table

-- Create supervisor_activity_log table
CREATE TABLE IF NOT EXISTS supervisor_activity_log (
  id SERIAL PRIMARY KEY,
  badge VARCHAR(10),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint (optional - only if supervisors.badge is unique)
-- ALTER TABLE supervisor_activity_log 
-- ADD CONSTRAINT fk_supervisor_badge 
-- FOREIGN KEY (badge) REFERENCES supervisors(badge);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supervisor_activity_badge ON supervisor_activity_log(badge);
CREATE INDEX IF NOT EXISTS idx_supervisor_activity_timestamp ON supervisor_activity_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_supervisor_activity_action ON supervisor_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_supervisor_activity_session ON supervisor_activity_log(session_id);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE supervisor_activity_log ENABLE ROW LEVEL SECURITY;

-- Create a policy for admin access
-- CREATE POLICY "Admin can view all activity logs" ON supervisor_activity_log
-- FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM supervisors 
--     WHERE supervisors.badge = auth.jwt() ->> 'badge' 
--     AND supervisors.admin = true
--   )
-- );

-- Add a function to clean up old logs (optional)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM supervisor_activity_log 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (run this separately if needed)
-- SELECT cron.schedule('cleanup-activity-logs', '0 2 * * 0', 'SELECT cleanup_old_activity_logs();');

-- Grant necessary permissions
-- GRANT SELECT, INSERT ON supervisor_activity_log TO authenticated;
-- GRANT USAGE ON SEQUENCE supervisor_activity_log_id_seq TO authenticated;