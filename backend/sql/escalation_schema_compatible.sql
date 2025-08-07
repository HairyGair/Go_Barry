-- Compatible escalation schema migration
-- This adds only the columns we need to the existing disruptions table

-- Add escalation columns to existing disruptions table if they don't exist
DO $$ 
BEGIN
    -- Add escalated_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disruptions' AND column_name = 'escalated_by') THEN
        ALTER TABLE disruptions ADD COLUMN escalated_by TEXT;
    END IF;
    
    -- Add escalated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disruptions' AND column_name = 'escalated_at') THEN
        ALTER TABLE disruptions ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add escalation_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disruptions' AND column_name = 'escalation_data') THEN
        ALTER TABLE disruptions ADD COLUMN escalation_data JSONB;
    END IF;
    
    -- Add services_affected column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disruptions' AND column_name = 'services_affected') THEN
        ALTER TABLE disruptions ADD COLUMN services_affected TEXT[];
    END IF;
    
    -- Add workflow_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disruptions' AND column_name = 'workflow_data') THEN
        ALTER TABLE disruptions ADD COLUMN workflow_data JSONB;
    END IF;
END $$;

-- Create display_screen_alerts table only if it doesn't exist
CREATE TABLE IF NOT EXISTS display_screen_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT NOT NULL,
  display_config JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supervisor_audit_log table only if it doesn't exist
CREATE TABLE IF NOT EXISTS supervisor_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT,
  supervisor_badge TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disruptions_escalated_by ON disruptions(escalated_by);
CREATE INDEX IF NOT EXISTS idx_disruptions_escalated_at ON disruptions(escalated_at);
CREATE INDEX IF NOT EXISTS idx_display_screen_alerts_status ON display_screen_alerts(status);
CREATE INDEX IF NOT EXISTS idx_display_screen_alerts_expires ON display_screen_alerts(expires_at);
CREATE INDEX IF NOT EXISTS idx_supervisor_audit_log_badge ON supervisor_audit_log(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_supervisor_audit_log_action ON supervisor_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_supervisor_audit_log_alert ON supervisor_audit_log(alert_id);

-- Simple escalation statistics function
CREATE OR REPLACE FUNCTION get_escalation_stats(days_back INTEGER DEFAULT 7, supervisor_badge TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_escalations', (
            SELECT COUNT(*) 
            FROM supervisor_audit_log 
            WHERE action = 'escalation' 
            AND created_at >= NOW() - (days_back || ' days')::INTERVAL
            AND (supervisor_badge IS NULL OR supervisor_audit_log.supervisor_badge = supervisor_badge)
        ),
        'escalations_by_day', (
            SELECT json_agg(
                json_build_object(
                    'date', date_trunc('day', created_at),
                    'count', count
                )
            )
            FROM (
                SELECT 
                    date_trunc('day', created_at) as day,
                    COUNT(*) as count
                FROM supervisor_audit_log 
                WHERE action = 'escalation' 
                AND created_at >= NOW() - (days_back || ' days')::INTERVAL
                AND (supervisor_badge IS NULL OR supervisor_audit_log.supervisor_badge = supervisor_badge)
                GROUP BY date_trunc('day', created_at)
                ORDER BY day DESC
            ) daily_counts
        ),
        'active_display_alerts', (
            SELECT COUNT(*) 
            FROM display_screen_alerts 
            WHERE status = 'active' 
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;