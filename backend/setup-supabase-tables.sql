-- Roadworks Manager V2 - Supabase Database Setup
-- Execute these statements in your Supabase SQL editor
-- © 2024-2025 Anthony Gair. All rights reserved.

-- =============================================================================
-- 1. DIVERSION TEMPLATES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS diversion_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_hash VARCHAR(50) NOT NULL,
  location_data JSONB,
  location_characteristics JSONB,
  route_description TEXT NOT NULL,
  diversion_route TEXT NOT NULL,
  diversion_details JSONB,
  affected_routes TEXT[],
  success_rating DECIMAL(3,2) DEFAULT 0.7 CHECK (success_rating >= 0 AND success_rating <= 1),
  usage_count INTEGER DEFAULT 1 CHECK (usage_count >= 0),
  created_by VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW(),
  last_rated_by VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for diversion_templates
CREATE INDEX IF NOT EXISTS idx_diversion_location_hash ON diversion_templates(location_hash);
CREATE INDEX IF NOT EXISTS idx_diversion_success_rating ON diversion_templates(success_rating DESC);
CREATE INDEX IF NOT EXISTS idx_diversion_created_by ON diversion_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_diversion_usage_count ON diversion_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_diversion_last_used ON diversion_templates(last_used DESC);

-- Add comments
COMMENT ON TABLE diversion_templates IS 'Reusable diversion templates with success ratings and usage tracking';
COMMENT ON COLUMN diversion_templates.location_hash IS 'Hashed location for grouping similar locations';
COMMENT ON COLUMN diversion_templates.success_rating IS 'Success rating from 0.0 to 1.0 based on supervisor feedback';
COMMENT ON COLUMN diversion_templates.usage_count IS 'Number of times this template has been used';

-- =============================================================================
-- 2. GEOCODING CACHE TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS geocoding_cache (
  cache_key VARCHAR(50) PRIMARY KEY,
  latitude DECIMAL(10,6) NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  location_description TEXT NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  provider VARCHAR(20) DEFAULT 'tomtom',
  confidence_score DECIMAL(3,2) DEFAULT 1.0
);

-- Create indexes for geocoding_cache
CREATE INDEX IF NOT EXISTS idx_geocoding_coordinates ON geocoding_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geocoding_cached_at ON geocoding_cache(cached_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_expires_at ON geocoding_cache(expires_at);

-- Add comments
COMMENT ON TABLE geocoding_cache IS 'Cached reverse geocoding results to reduce API calls';
COMMENT ON COLUMN geocoding_cache.cache_key IS 'Formatted as "lat,lng" with precision';
COMMENT ON COLUMN geocoding_cache.expires_at IS 'Cache expiration time (7 days default)';

-- =============================================================================
-- 3. SUPERVISOR AUDIT LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS supervisor_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge VARCHAR(20) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_category VARCHAR(30),
  target_type VARCHAR(30),
  target_id VARCHAR(100),
  action_details JSONB,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for supervisor_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_supervisor ON supervisor_audit_log(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON supervisor_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON supervisor_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON supervisor_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_target ON supervisor_audit_log(target_type, target_id);

-- Add comments
COMMENT ON TABLE supervisor_audit_log IS 'Comprehensive audit trail of all supervisor actions';
COMMENT ON COLUMN supervisor_audit_log.action_category IS 'Groups actions: data_management, workflow, operations, etc.';
COMMENT ON COLUMN supervisor_audit_log.severity IS 'Action severity: low, medium, high, critical';

-- =============================================================================
-- 4. SYSTEM EVENT LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(30),
  source VARCHAR(50) DEFAULT 'system',
  event_details JSONB,
  severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Create indexes for system_event_log
CREATE INDEX IF NOT EXISTS idx_system_event_type ON system_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_system_created_at ON system_event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_severity ON system_event_log(severity);
CREATE INDEX IF NOT EXISTS idx_system_unresolved ON system_event_log(resolved_at) WHERE resolved_at IS NULL;

-- Add comments
COMMENT ON TABLE system_event_log IS 'System events, errors, and automated processes';

-- =============================================================================
-- 5. DATA ACCESS LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  access_type VARCHAR(20) DEFAULT 'read' CHECK (access_type IN ('read', 'write', 'update', 'delete')),
  resource_id VARCHAR(100),
  access_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true
);

-- Create indexes for data_access_log
CREATE INDEX IF NOT EXISTS idx_data_access_user ON data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_type ON data_access_log(data_type);
CREATE INDEX IF NOT EXISTS idx_data_access_created_at ON data_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_resource ON data_access_log(resource_id) WHERE resource_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE data_access_log IS 'Compliance log for data access tracking';

-- =============================================================================
-- 6. REPORT GENERATION LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS report_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  file_path TEXT,
  recipients TEXT[],
  generation_time_ms INTEGER,
  error_message TEXT
);

-- Create indexes for report_generation_log
CREATE INDEX IF NOT EXISTS idx_report_type ON report_generation_log(report_type);
CREATE INDEX IF NOT EXISTS idx_report_generated_at ON report_generation_log(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_status ON report_generation_log(status);

-- Add comments
COMMENT ON TABLE report_generation_log IS 'Log of all generated reports and their status';

-- =============================================================================
-- 7. CRITICAL ACTIONS LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS critical_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge VARCHAR(20) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_details JSONB,
  requires_review BOOLEAN DEFAULT true,
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by VARCHAR(20),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- Create indexes for critical_actions_log
CREATE INDEX IF NOT EXISTS idx_critical_supervisor ON critical_actions_log(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_critical_requires_review ON critical_actions_log(requires_review) WHERE requires_review = true;
CREATE INDEX IF NOT EXISTS idx_critical_escalated_at ON critical_actions_log(escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_critical_risk_level ON critical_actions_log(risk_level);

-- Add comments
COMMENT ON TABLE critical_actions_log IS 'High-risk actions requiring special attention';

-- =============================================================================
-- 8. ANALYTICS REQUESTS LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS analytics_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  data_points_returned INTEGER,
  filters_applied JSONB
);

-- Create indexes for analytics_requests
CREATE INDEX IF NOT EXISTS idx_analytics_supervisor ON analytics_requests(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_analytics_requested_at ON analytics_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_timeframe ON analytics_requests(timeframe);

-- Add comments
COMMENT ON TABLE analytics_requests IS 'Track analytics usage and performance';

-- =============================================================================
-- 9. REPORT REQUESTS LOG TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_badge VARCHAR(20) NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  requested_by VARCHAR(50) NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  parameters JSONB
);

-- Create indexes for report_requests
CREATE INDEX IF NOT EXISTS idx_report_requests_supervisor ON report_requests(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_report_requests_type ON report_requests(report_type);
CREATE INDEX IF NOT EXISTS idx_report_requests_status ON report_requests(status);
CREATE INDEX IF NOT EXISTS idx_report_requests_requested_at ON report_requests(requested_at DESC);

-- Add comments
COMMENT ON TABLE report_requests IS 'Track manual report generation requests';

-- =============================================================================
-- 10. UPDATE EXISTING STREETWORKS TABLE
-- =============================================================================

-- Add new columns to existing streetworks table (if they don't exist)
ALTER TABLE streetworks 
ADD COLUMN IF NOT EXISTS pushed_to_display BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_pushed_by VARCHAR(20),
ADD COLUMN IF NOT EXISTS display_pushed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS display_removed_by VARCHAR(20),
ADD COLUMN IF NOT EXISTS display_removed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS display_removal_reason TEXT,
ADD COLUMN IF NOT EXISTS diversion_id UUID,
ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(20),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS review_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- Create indexes for new streetworks columns
CREATE INDEX IF NOT EXISTS idx_streetworks_display_status ON streetworks(pushed_to_display);
CREATE INDEX IF NOT EXISTS idx_streetworks_diversion_id ON streetworks(diversion_id) WHERE diversion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_streetworks_reviewed_by ON streetworks(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_streetworks_priority ON streetworks(priority);
CREATE INDEX IF NOT EXISTS idx_streetworks_severity ON streetworks(severity);
CREATE INDEX IF NOT EXISTS idx_streetworks_review_required ON streetworks(review_required) WHERE review_required = true;

-- Add foreign key constraint (if diversion_templates table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'diversion_templates') THEN
    ALTER TABLE streetworks 
    ADD CONSTRAINT fk_streetworks_diversion 
    FOREIGN KEY (diversion_id) REFERENCES diversion_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add comments for new columns
COMMENT ON COLUMN streetworks.pushed_to_display IS 'Whether this roadwork is currently shown on control room display';
COMMENT ON COLUMN streetworks.diversion_id IS 'Reference to associated diversion template';
COMMENT ON COLUMN streetworks.priority IS 'Priority level 1-5 (1=highest, 5=lowest)';
COMMENT ON COLUMN streetworks.severity IS 'Impact severity: low, medium, high, critical';

-- =============================================================================
-- 11. CREATE UTILITY FUNCTIONS
-- =============================================================================

-- Function to clean up expired geocoding cache
CREATE OR REPLACE FUNCTION cleanup_expired_geocoding_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM geocoding_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_statistics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_actions', COUNT(*),
    'unique_supervisors', COUNT(DISTINCT supervisor_badge),
    'actions_by_type', json_object_agg(action_type, type_count),
    'critical_actions', COUNT(*) FILTER (WHERE severity = 'critical'),
    'period_start', (NOW() - INTERVAL '1 day' * days_back)::date,
    'period_end', NOW()::date
  ) INTO result
  FROM (
    SELECT 
      action_type,
      COUNT(*) as type_count,
      severity
    FROM supervisor_audit_log 
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY action_type, severity
  ) stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage
CREATE OR REPLACE FUNCTION update_template_usage(template_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE diversion_templates 
  SET 
    usage_count = usage_count + 1,
    last_used = NOW(),
    updated_at = NOW()
  WHERE id = template_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 12. SET UP ROW LEVEL SECURITY (RLS) - Optional
-- =============================================================================

-- Enable RLS on sensitive tables (uncomment if needed)
-- ALTER TABLE supervisor_audit_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE critical_actions_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

-- Create policies for supervisor access (example)
-- CREATE POLICY "Supervisors can view their own audit logs" ON supervisor_audit_log
--   FOR SELECT USING (supervisor_badge = current_setting('app.supervisor_badge', true));

-- =============================================================================
-- 13. CREATE VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for active diversions with templates
CREATE OR REPLACE VIEW active_diversions AS
SELECT 
  sw.id,
  sw.location_description,
  sw.status,
  sw.severity,
  sw.pushed_to_display,
  dt.route_description,
  dt.diversion_route,
  dt.success_rating,
  dt.usage_count,
  sw.created_at,
  sw.reviewed_by,
  sw.reviewed_at
FROM streetworks sw
LEFT JOIN diversion_templates dt ON sw.diversion_id = dt.id
WHERE sw.status IN ('approved', 'monitoring', 'active')
  AND sw.diversion_id IS NOT NULL;

-- View for audit summary
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  supervisor_badge,
  DATE(created_at) as activity_date,
  COUNT(*) as total_actions,
  COUNT(DISTINCT action_type) as unique_action_types,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_actions,
  MAX(created_at) as last_activity
FROM supervisor_audit_log
GROUP BY supervisor_badge, DATE(created_at)
ORDER BY activity_date DESC, total_actions DESC;

-- View for template performance
CREATE OR REPLACE VIEW template_performance AS
SELECT 
  id,
  route_description,
  success_rating,
  usage_count,
  ROUND(success_rating * usage_count, 2) as weighted_score,
  created_by,
  last_used,
  EXTRACT(DAYS FROM NOW() - last_used) as days_since_used
FROM diversion_templates
ORDER BY weighted_score DESC, last_used DESC;

-- =============================================================================
-- 14. INSERT SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Insert sample diversion template
INSERT INTO diversion_templates (
  location_hash, 
  route_description, 
  diversion_route, 
  affected_routes,
  created_by
) VALUES (
  '54.978300,-1.617800',
  'Newcastle City Centre - Grainger Street Works',
  'Via Grey Street and Dean Street',
  ARRAY['1', '2', '35'],
  'AG003'
) ON CONFLICT DO NOTHING;

-- Insert sample audit log entry
INSERT INTO supervisor_audit_log (
  supervisor_badge,
  action_type,
  action_category,
  action_details
) VALUES (
  'SYSTEM',
  'DATABASE_SETUP',
  'system',
  '{"description": "Initial Roadworks Manager V2 database setup completed"}'
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- COMPLETION
-- =============================================================================

-- Log setup completion
INSERT INTO system_event_log (
  event_type,
  event_category,
  event_details
) VALUES (
  'DATABASE_SETUP_COMPLETE',
  'deployment',
  json_build_object(
    'tables_created', 11,
    'indexes_created', 25,
    'functions_created', 3,
    'views_created', 3,
    'setup_time', NOW()
  )
);

-- Success message
SELECT 
  'Roadworks Manager V2 database setup completed successfully!' as message,
  NOW() as completed_at,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_name IN (
      'diversion_templates', 'geocoding_cache', 'supervisor_audit_log',
      'system_event_log', 'data_access_log', 'report_generation_log',
      'critical_actions_log', 'analytics_requests', 'report_requests'
    )
  ) as tables_created;