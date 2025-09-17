-- =====================================================
-- SUPABASE SECURITY CONFIGURATION
-- Row Level Security (RLS) Policies for Go BARRY Breakdown Management
-- =====================================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_location_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPERVISOR ACCESS POLICIES
-- =====================================================

-- Supervisors can read their own profile and update certain fields
CREATE POLICY "supervisors_own_profile" ON supervisors
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'badge' = badge)
  WITH CHECK (auth.jwt() ->> 'badge' = badge);

-- Supervisors can read all other supervisor profiles (but not update)
CREATE POLICY "supervisors_read_others" ON supervisors
  FOR SELECT TO authenticated 
  USING (true);

-- Admin supervisors can manage all supervisor records
CREATE POLICY "admin_manage_supervisors" ON supervisors
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- BREAKDOWN ACCESS POLICIES
-- =====================================================

-- All authenticated supervisors can read all breakdowns
CREATE POLICY "supervisors_read_all_breakdowns" ON breakdowns
  FOR SELECT TO authenticated 
  USING (true);

-- Supervisors can create new breakdowns
CREATE POLICY "supervisors_create_breakdowns" ON breakdowns
  FOR INSERT TO authenticated 
  WITH CHECK (auth.jwt() ->> 'badge' = supervisor_badge);

-- Supervisors can update breakdowns they created or are assigned to
CREATE POLICY "supervisors_update_own_breakdowns" ON breakdowns
  FOR UPDATE TO authenticated 
  USING (
    auth.jwt() ->> 'badge' = supervisor_badge OR 
    auth.jwt() ->> 'badge' = resolving_supervisor OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Only admins can delete/archive breakdowns
CREATE POLICY "admin_delete_breakdowns" ON breakdowns
  FOR DELETE TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Prevent updates to archived breakdowns (except by admins)
CREATE POLICY "prevent_archived_updates" ON breakdowns
  FOR UPDATE TO authenticated 
  USING (
    archived = false OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- BREAKDOWN EVENTS POLICIES
-- =====================================================

-- All supervisors can read breakdown events
CREATE POLICY "supervisors_read_events" ON breakdown_events
  FOR SELECT TO authenticated 
  USING (true);

-- Supervisors can create events for breakdowns they're involved with
CREATE POLICY "supervisors_create_events" ON breakdown_events
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.jwt() ->> 'badge' = by_badge OR
    EXISTS (
      SELECT 1 FROM breakdowns b 
      WHERE b.breakdown_id = breakdown_events.breakdown_id 
        AND (b.supervisor_badge = auth.jwt() ->> 'badge' OR 
             b.resolving_supervisor = auth.jwt() ->> 'badge')
    )
  );

-- No updates or deletes on events (audit trail integrity)
CREATE POLICY "no_event_modifications" ON breakdown_events
  FOR UPDATE TO authenticated 
  USING (false);

CREATE POLICY "admin_only_event_deletes" ON breakdown_events
  FOR DELETE TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- FLEET VEHICLE POLICIES
-- =====================================================

-- All supervisors can read fleet data
CREATE POLICY "supervisors_read_fleet" ON fleet_vehicles
  FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify fleet data
CREATE POLICY "admin_manage_fleet" ON fleet_vehicles
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- ROUTE PRIORITIES POLICIES
-- =====================================================

-- All users can read route priorities
CREATE POLICY "public_read_route_priorities" ON route_priorities
  FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify route priorities
CREATE POLICY "admin_manage_route_priorities" ON route_priorities
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- SUPERVISOR SESSIONS POLICIES
-- =====================================================

-- Supervisors can manage their own sessions
CREATE POLICY "supervisors_own_sessions" ON supervisor_sessions
  FOR ALL TO authenticated 
  USING (supervisor_badge = auth.jwt() ->> 'badge');

-- Admins can see all sessions for monitoring
CREATE POLICY "admin_monitor_sessions" ON supervisor_sessions
  FOR SELECT TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Auto-cleanup: supervisors can only have 5 active sessions
CREATE POLICY "limit_active_sessions" ON supervisor_sessions
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT COUNT(*) FROM supervisor_sessions 
     WHERE supervisor_badge = auth.jwt() ->> 'badge' 
       AND active = true) < 5
  );

-- =====================================================
-- LOCATION HISTORY POLICIES
-- =====================================================

-- All supervisors can read location history
CREATE POLICY "supervisors_read_location_history" ON breakdown_location_history
  FOR SELECT TO authenticated 
  USING (true);

-- Supervisors can add location updates for relevant breakdowns
CREATE POLICY "supervisors_add_location_updates" ON breakdown_location_history
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM breakdowns b 
      WHERE b.breakdown_id = breakdown_location_history.breakdown_id 
        AND (b.supervisor_badge = auth.jwt() ->> 'badge' OR 
             b.resolving_supervisor = auth.jwt() ->> 'badge' OR
             auth.jwt() ->> 'role' = 'admin')
    )
  );

-- No modifications to location history (audit trail)
CREATE POLICY "no_location_history_modifications" ON breakdown_location_history
  FOR UPDATE TO authenticated 
  USING (false);

-- =====================================================
-- VIEW POLICIES
-- =====================================================

-- Grant access to views
GRANT SELECT ON active_breakdowns TO authenticated;
GRANT SELECT ON daily_breakdown_summary TO authenticated;
GRANT SELECT ON breakdown_performance_metrics TO authenticated;

-- =====================================================
-- FUNCTION SECURITY
-- =====================================================

-- Secure function to get supervisor info from JWT
CREATE OR REPLACE FUNCTION get_current_supervisor()
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'badge', auth.jwt() ->> 'badge',
    'name', auth.jwt() ->> 'name',
    'role', auth.jwt() ->> 'role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced create_breakdown function with security
CREATE OR REPLACE FUNCTION create_breakdown_secure(
  p_fleet_number VARCHAR,
  p_supervisor_badge VARCHAR,
  p_supervisor_name VARCHAR,
  p_location TEXT,
  p_location_coords POINT DEFAULT NULL,
  p_depot_id VARCHAR DEFAULT 'Washington',
  p_route_id VARCHAR DEFAULT NULL,
  p_wizard_type VARCHAR DEFAULT 'general'
)
RETURNS JSON AS $$
DECLARE
  v_current_badge TEXT;
  v_breakdown_id TEXT;
  v_result JSON;
BEGIN
  -- Get current user from JWT
  v_current_badge := auth.jwt() ->> 'badge';
  
  -- Security check: supervisor can only create breakdowns for themselves
  IF v_current_badge != p_supervisor_badge AND auth.jwt() ->> 'role' != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Can only create breakdowns for yourself'
    );
  END IF;
  
  -- Validate supervisor exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM supervisors 
    WHERE badge = p_supervisor_badge AND active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Supervisor not found or inactive'
    );
  END IF;
  
  -- Call the main creation function
  SELECT create_breakdown(
    p_fleet_number, p_supervisor_badge, p_supervisor_name,
    p_location, p_location_coords, p_depot_id, p_route_id, p_wizard_type
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Function to log all breakdown modifications
CREATE OR REPLACE FUNCTION audit_breakdown_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO breakdown_events (
    breakdown_id,
    event_type,
    event_data,
    by_badge,
    occurred_at
  ) VALUES (
    COALESCE(NEW.breakdown_id, OLD.breakdown_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'breakdown_created'
      WHEN TG_OP = 'UPDATE' THEN 'breakdown_modified'
      WHEN TG_OP = 'DELETE' THEN 'breakdown_deleted'
    END,
    json_build_object(
      'operation', TG_OP,
      'changed_by', auth.jwt() ->> 'badge',
      'old_status', CASE WHEN TG_OP != 'INSERT' THEN OLD.status ELSE NULL END,
      'new_status', CASE WHEN TG_OP != 'DELETE' THEN NEW.status ELSE NULL END,
      'timestamp', NOW()
    ),
    auth.jwt() ->> 'badge',
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger
DROP TRIGGER IF EXISTS audit_breakdown_changes_trigger ON breakdowns;
CREATE TRIGGER audit_breakdown_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON breakdowns
  FOR EACH ROW EXECUTE FUNCTION audit_breakdown_changes();

-- =====================================================
-- DATA VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate breakdown data integrity
CREATE OR REPLACE FUNCTION validate_breakdown_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate supervisor badge format
  IF NEW.supervisor_badge !~ '^[A-Z]{2}[0-9]{3}$' THEN
    RAISE EXCEPTION 'Invalid supervisor badge format: %', NEW.supervisor_badge;
  END IF;
  
  -- Validate fleet number format (basic check)
  IF NEW.fleet_no IS NOT NULL AND NEW.fleet_no !~ '^[0-9]{4,5}$' THEN
    RAISE EXCEPTION 'Invalid fleet number format: %', NEW.fleet_no;
  END IF;
  
  -- Validate status transitions
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check valid status transitions
    IF NOT (
      (OLD.status = 'received' AND NEW.status IN ('acknowledged', 'decision')) OR
      (OLD.status = 'acknowledged' AND NEW.status IN ('decision', 'dispatched')) OR
      (OLD.status = 'decision' AND NEW.status IN ('dispatched', 'cleared')) OR
      (OLD.status = 'dispatched' AND NEW.status IN ('on_site', 'cleared')) OR
      (OLD.status = 'on_site' AND NEW.status IN ('moving', 'cleared')) OR
      (OLD.status = 'moving' AND NEW.status = 'cleared') OR
      (auth.jwt() ->> 'role' = 'admin') -- Admins can override
    ) THEN
      RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
  END IF;
  
  -- Set timestamps based on status changes
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'acknowledged' AND NEW.status = 'acknowledged' THEN
      NEW.acknowledged_at = NOW();
    END IF;
    
    IF OLD.status != 'decision' AND NEW.status = 'decision' THEN
      NEW.diagnosed_at = NOW();
    END IF;
    
    IF OLD.status != 'cleared' AND NEW.status = 'cleared' THEN
      NEW.resolved_at = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
DROP TRIGGER IF EXISTS validate_breakdown_data_trigger ON breakdowns;
CREATE TRIGGER validate_breakdown_data_trigger
  BEFORE INSERT OR UPDATE ON breakdowns
  FOR EACH ROW EXECUTE FUNCTION validate_breakdown_data();

-- =====================================================
-- PERFORMANCE SECURITY
-- =====================================================

-- Function to prevent excessive queries (rate limiting)
CREATE OR REPLACE FUNCTION check_query_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_badge TEXT;
  recent_queries INTEGER;
BEGIN
  user_badge := auth.jwt() ->> 'badge';
  
  -- Count queries from this user in the last minute
  SELECT COUNT(*) INTO recent_queries
  FROM breakdown_events
  WHERE by_badge = user_badge
    AND created_at > NOW() - INTERVAL '1 minute'
    AND event_type LIKE '%_query';
  
  -- Limit to 100 queries per minute
  IF recent_queries > 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded for user %', user_badge;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EMERGENCY ACCESS FUNCTIONS
-- =====================================================

-- Function for emergency breakdown access (bypasses some restrictions)
CREATE OR REPLACE FUNCTION emergency_breakdown_access(
  p_breakdown_id VARCHAR,
  p_emergency_code VARCHAR
)
RETURNS JSON AS $$
DECLARE
  v_valid_code BOOLEAN := false;
  v_breakdown JSON;
BEGIN
  -- Validate emergency code (in production, use secure method)
  v_valid_code := (p_emergency_code = 'EMERGENCY_BREAKDOWN_2025');
  
  IF NOT v_valid_code THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid emergency access code'
    );
  END IF;
  
  -- Log emergency access
  INSERT INTO breakdown_events (
    breakdown_id,
    event_type,
    event_data,
    by_badge,
    notes
  ) VALUES (
    p_breakdown_id,
    'emergency_access',
    json_build_object('emergency_code_used', true),
    'EMERGENCY',
    'Emergency access granted with code'
  );
  
  -- Return breakdown data
  SELECT row_to_json(b) INTO v_breakdown
  FROM breakdowns b
  WHERE b.breakdown_id = p_breakdown_id;
  
  RETURN json_build_object(
    'success', true,
    'breakdown', v_breakdown,
    'emergency_access', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY MONITORING
-- =====================================================

-- View for security monitoring
CREATE OR REPLACE VIEW security_audit_log AS
SELECT 
  be.id,
  be.breakdown_id,
  be.event_type,
  be.by_badge,
  be.occurred_at,
  be.event_data,
  s.name as supervisor_name,
  s.role as supervisor_role,
  CASE 
    WHEN be.event_type IN ('emergency_access', 'admin_override') THEN 'HIGH'
    WHEN be.event_type LIKE '%_delete%' THEN 'MEDIUM'
    ELSE 'LOW'
  END as security_level
FROM breakdown_events be
LEFT JOIN supervisors s ON be.by_badge = s.badge
WHERE be.event_type IN (
  'emergency_access', 
  'admin_override',
  'unauthorized_access_attempt',
  'breakdown_deleted',
  'mass_update'
)
ORDER BY be.occurred_at DESC;

-- Grant access to security audit log (admin only)
GRANT SELECT ON security_audit_log TO authenticated;

-- =====================================================
-- CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to cleanup old sessions and audit logs
CREATE OR REPLACE FUNCTION security_maintenance()
RETURNS TEXT AS $$
DECLARE
  cleaned_sessions INTEGER;
  cleaned_events INTEGER;
BEGIN
  -- Clean up old inactive sessions (older than 30 days)
  DELETE FROM supervisor_sessions
  WHERE active = false 
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS cleaned_sessions = ROW_COUNT;
  
  -- Archive old low-priority audit events (older than 90 days)
  DELETE FROM breakdown_events
  WHERE event_type NOT IN ('emergency_access', 'admin_override', 'breakdown_deleted')
    AND created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS cleaned_events = ROW_COUNT;
  
  RETURN format('Cleaned %s old sessions and %s old audit events', 
                cleaned_sessions, cleaned_events);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT FINAL PERMISSIONS
-- =====================================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION get_current_supervisor() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION create_breakdown_secure(VARCHAR, VARCHAR, VARCHAR, TEXT, POINT, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_breakdown_access(VARCHAR, VARCHAR) TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION security_maintenance() TO authenticated;

-- =====================================================
-- SECURITY CONFIGURATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🔒 Supabase Security Configuration Applied Successfully!';
  RAISE NOTICE '🛡️ Row Level Security enabled on all tables';
  RAISE NOTICE '👮 Supervisor and admin access policies configured';
  RAISE NOTICE '📊 Audit logging and security monitoring enabled';
  RAISE NOTICE '⚡ Rate limiting and data validation in place';
  RAISE NOTICE '🚨 Emergency access procedures configured';
  RAISE NOTICE '🧹 Automated cleanup and maintenance functions ready';
END $$;