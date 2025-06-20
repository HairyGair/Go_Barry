-- Supervisor Sessions Table
CREATE TABLE IF NOT EXISTS supervisor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id VARCHAR(10) NOT NULL,
  supervisor_name VARCHAR(100) NOT NULL,
  badge_number VARCHAR(10) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id VARCHAR(10),
  supervisor_name VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  screen_type VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_supervisor_sessions_token ON supervisor_sessions(session_token);
CREATE INDEX idx_supervisor_sessions_active ON supervisor_sessions(is_active);
CREATE INDEX idx_activity_logs_supervisor ON activity_logs(supervisor_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Add RLS (Row Level Security) policies
ALTER TABLE supervisor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read for checking sessions
CREATE POLICY anonymous_session_checks ON supervisor_sessions
  FOR SELECT USING (true);

-- Allow anonymous insert for activity logs
CREATE POLICY anonymous_activity_logging ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Allow anonymous read for activity logs
CREATE POLICY read_activity_logs ON activity_logs
  FOR SELECT USING (true);