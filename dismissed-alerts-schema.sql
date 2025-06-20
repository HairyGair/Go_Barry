-- Dismissed Alerts Table
CREATE TABLE IF NOT EXISTS dismissed_alerts (
  id VARCHAR(255) PRIMARY KEY,
  supervisor_id VARCHAR(10) NOT NULL,
  supervisor_badge VARCHAR(10) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  alert_hash VARCHAR(255) NOT NULL,
  alert_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dismissed_alerts_hash ON dismissed_alerts(alert_hash);
CREATE INDEX idx_dismissed_alerts_supervisor ON dismissed_alerts(supervisor_id);
CREATE INDEX idx_dismissed_alerts_timestamp ON dismissed_alerts(timestamp);

-- Enable RLS
ALTER TABLE dismissed_alerts ENABLE ROW LEVEL SECURITY;

-- Allow anonymous operations
CREATE POLICY anonymous_dismissed_alerts_select ON dismissed_alerts
  FOR SELECT USING (true);

CREATE POLICY anonymous_dismissed_alerts_insert ON dismissed_alerts
  FOR INSERT WITH CHECK (true);