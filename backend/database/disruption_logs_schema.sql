-- backend/database/disruption_logs_schema.sql
-- Database schema for the BARRY Disruption Logging System
-- Run this SQL in your Supabase database to create the required table

-- ============================================
-- DISRUPTION LOGS TABLE
-- ============================================
-- This table stores all successfully resolved disruptions
-- for accountability, performance tracking, and continuous improvement

CREATE TABLE IF NOT EXISTS disruption_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core disruption information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('incident', 'roadwork', 'diversion', 'service_change', 'weather', 'breakdown', 'accident', 'emergency', 'planned_works', 'other')),
    location VARCHAR(500) NOT NULL,
    affected_routes TEXT[], -- Array of route numbers
    
    -- Resolution details
    resolution_method TEXT,
    actions_taken TEXT,
    resources_used TEXT[], -- Array of resources deployed
    
    -- Timing information
    disruption_started TIMESTAMPTZ,
    disruption_resolved TIMESTAMPTZ DEFAULT NOW(),
    resolution_time_minutes INTEGER,
    
    -- Responsibility and accountability
    supervisor_id VARCHAR(50) NOT NULL,
    supervisor_name VARCHAR(200),
    depot VARCHAR(100),
    shift VARCHAR(50),
    
    -- Impact assessment
    services_affected_count INTEGER DEFAULT 0,
    passengers_affected_estimate INTEGER DEFAULT 0,
    severity_level VARCHAR(20) DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Operational details
    diversion_route TEXT,
    replacement_services TEXT[], -- Array of replacement service details
    customer_communications TEXT[], -- Array of customer communication details
    driver_notifications TEXT,
    
    -- External factors
    weather_conditions VARCHAR(200),
    external_agencies TEXT[], -- Police, Highways England, etc.
    coordination_required BOOLEAN DEFAULT FALSE,
    
    -- Learning and improvement
    lessons_learned TEXT,
    improvement_suggestions TEXT,
    preventable BOOLEAN DEFAULT FALSE,
    recurring_issue BOOLEAN DEFAULT FALSE,
    
    -- Administrative
    cost_estimate DECIMAL(10,2),
    insurance_claim BOOLEAN DEFAULT FALSE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    
    -- Performance metrics
    response_time_minutes INTEGER,
    communication_delay_minutes INTEGER,
    service_restoration_time TIMESTAMPTZ,
    
    -- Metadata
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    logged_by VARCHAR(50),
    related_alert_id VARCHAR(100),
    
    -- Constraints
    CONSTRAINT valid_resolution_time CHECK (resolution_time_minutes >= 0),
    CONSTRAINT valid_response_time CHECK (response_time_minutes >= 0),
    CONSTRAINT valid_services_affected CHECK (services_affected_count >= 0),
    CONSTRAINT valid_passengers_affected CHECK (passengers_affected_estimate >= 0)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for supervisor queries
CREATE INDEX IF NOT EXISTS idx_disruption_logs_supervisor 
ON disruption_logs(supervisor_id, logged_at DESC);

-- Index for depot queries
CREATE INDEX IF NOT EXISTS idx_disruption_logs_depot 
ON disruption_logs(depot, logged_at DESC);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_disruption_logs_time 
ON disruption_logs(logged_at DESC, disruption_resolved DESC);

-- Index for type-based queries
CREATE INDEX IF NOT EXISTS idx_disruption_logs_type 
ON disruption_logs(type, severity_level, logged_at DESC);

-- Index for route-based queries (GIN index for array search)
CREATE INDEX IF NOT EXISTS idx_disruption_logs_routes 
ON disruption_logs USING GIN(affected_routes);

-- Index for follow-up queries
CREATE INDEX IF NOT EXISTS idx_disruption_logs_followup 
ON disruption_logs(follow_up_required, logged_at DESC) 
WHERE follow_up_required = TRUE;

-- Index for recurring issues
CREATE INDEX IF NOT EXISTS idx_disruption_logs_recurring 
ON disruption_logs(recurring_issue, type, logged_at DESC) 
WHERE recurring_issue = TRUE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on the table
ALTER TABLE disruption_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all logs
CREATE POLICY "Allow authenticated read access" ON disruption_logs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert logs
CREATE POLICY "Allow authenticated insert access" ON disruption_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own logs (based on supervisor_id)
CREATE POLICY "Allow update own logs" ON disruption_logs
    FOR UPDATE
    USING (auth.uid()::text = supervisor_id OR auth.role() = 'service_role');

-- Only allow service role to delete (admin function)
CREATE POLICY "Allow service role delete" ON disruption_logs
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_disruption_logs_updated_at 
    BEFORE UPDATE ON disruption_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPFUL VIEWS FOR REPORTING
-- ============================================

-- View for daily disruption summary
CREATE OR REPLACE VIEW daily_disruption_summary AS
SELECT 
    DATE(logged_at) as log_date,
    depot,
    COUNT(*) as total_disruptions,
    COUNT(*) FILTER (WHERE severity_level = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE severity_level = 'high') as high_count,
    COUNT(*) FILTER (WHERE severity_level = 'medium') as medium_count,
    COUNT(*) FILTER (WHERE severity_level = 'low') as low_count,
    AVG(resolution_time_minutes) as avg_resolution_time,
    AVG(response_time_minutes) as avg_response_time,
    COUNT(*) FILTER (WHERE preventable = TRUE) as preventable_count,
    COUNT(*) FILTER (WHERE recurring_issue = TRUE) as recurring_count
FROM disruption_logs
GROUP BY DATE(logged_at), depot
ORDER BY log_date DESC, depot;

-- View for supervisor performance
CREATE OR REPLACE VIEW supervisor_performance AS
SELECT 
    supervisor_id,
    supervisor_name,
    depot,
    COUNT(*) as total_disruptions_handled,
    AVG(resolution_time_minutes) as avg_resolution_time,
    AVG(response_time_minutes) as avg_response_time,
    COUNT(*) FILTER (WHERE severity_level IN ('high', 'critical')) as high_severity_count,
    COUNT(*) FILTER (WHERE preventable = TRUE) as preventable_disruptions,
    COUNT(*) FILTER (WHERE follow_up_required = TRUE) as requires_followup,
    MAX(logged_at) as last_disruption_logged
FROM disruption_logs
GROUP BY supervisor_id, supervisor_name, depot
ORDER BY total_disruptions_handled DESC;

-- ============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================

-- Function to cleanup old disruption logs (older than specified days)
CREATE OR REPLACE FUNCTION cleanup_old_disruption_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM disruption_logs 
    WHERE logged_at < (NOW() - INTERVAL '1 day' * days_to_keep)
    AND follow_up_required = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get disruption statistics for a time period
CREATE OR REPLACE FUNCTION get_disruption_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_disruptions', COUNT(*),
        'by_type', json_object_agg(type, type_count),
        'by_severity', json_object_agg(severity_level, severity_count),
        'avg_resolution_time', ROUND(AVG(resolution_time_minutes), 2),
        'avg_response_time', ROUND(AVG(response_time_minutes), 2),
        'preventable_percentage', ROUND((COUNT(*) FILTER (WHERE preventable = TRUE) * 100.0 / COUNT(*)), 2),
        'recurring_percentage', ROUND((COUNT(*) FILTER (WHERE recurring_issue = TRUE) * 100.0 / COUNT(*)), 2)
    ) INTO result
    FROM (
        SELECT 
            *,
            COUNT(*) OVER (PARTITION BY type) as type_count,
            COUNT(*) OVER (PARTITION BY severity_level) as severity_count
        FROM disruption_logs 
        WHERE logged_at BETWEEN start_date AND end_date
    ) stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA / EXAMPLES
-- ============================================

-- Insert some example disruption types for reference
-- (You can remove this section after setup if not needed)

COMMENT ON TABLE disruption_logs IS 'Stores successfully resolved disruptions for accountability and performance tracking';
COMMENT ON COLUMN disruption_logs.type IS 'Type of disruption: incident, roadwork, diversion, service_change, weather, breakdown, accident, emergency, planned_works, other';
COMMENT ON COLUMN disruption_logs.severity_level IS 'Impact severity: low, medium, high, critical';
COMMENT ON COLUMN disruption_logs.affected_routes IS 'Array of bus route numbers affected by this disruption';
COMMENT ON COLUMN disruption_logs.resolution_method IS 'How the disruption was resolved (e.g., diversion route, service suspension, etc.)';
COMMENT ON COLUMN disruption_logs.preventable IS 'Whether this disruption could have been prevented with better planning or procedures';
COMMENT ON COLUMN disruption_logs.recurring_issue IS 'Whether this is a recurring problem at this location or of this type';

-- Grant permissions for API access
GRANT ALL ON disruption_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON disruption_logs TO authenticated;
GRANT SELECT ON daily_disruption_summary TO authenticated;
GRANT SELECT ON supervisor_performance TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- After running this schema, your disruption logging system will be ready to use!
-- The API endpoints will automatically work with this table structure.
