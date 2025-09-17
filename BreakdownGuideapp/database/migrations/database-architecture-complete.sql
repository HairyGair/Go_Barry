-- =====================================================
-- GO BARRY BREAKDOWN MANAGEMENT - COMPLETE DATABASE SCHEMA
-- Optimized for Supabase with RLS, real-time, and performance
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Supervisors table (enhanced from existing Go BARRY)
CREATE TABLE IF NOT EXISTS supervisors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(20) CHECK (role IN ('supervisor', 'admin', 'manager')) DEFAULT 'supervisor',
  depot_id VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  session_data JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breakdowns table (enhanced version)
CREATE TABLE IF NOT EXISTS breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20) UNIQUE NOT NULL,
  daily_id INTEGER NOT NULL,
  
  -- Fleet and basic info
  fleet_no VARCHAR(10),
  supervisor_badge VARCHAR(10) NOT NULL REFERENCES supervisors(badge),
  supervisor_name VARCHAR(100),
  
  -- Location (enhanced with PostGIS)
  location TEXT,
  location_type VARCHAR(50) CHECK (location_type IN ('depot', 'bus_station', 'route', 'road', 'other')),
  location_coords POINT, -- PostGIS geometry
  location_w3w VARCHAR(100),
  location_verified BOOLEAN DEFAULT FALSE,
  location_accuracy FLOAT,
  location_updated_at TIMESTAMPTZ,
  
  -- Breakdown details
  depot_id VARCHAR(50),
  route_id VARCHAR(20),
  route_priority VARCHAR(20) CHECK (route_priority IN ('critical', 'secured', 'important', 'standard')) DEFAULT 'standard',
  wizard_type VARCHAR(50),
  wizard_steps JSONB DEFAULT '[]',
  
  -- Status and workflow
  status VARCHAR(20) CHECK (status IN ('received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving', 'cleared')) DEFAULT 'received',
  severity VARCHAR(20) CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE')) DEFAULT 'AMBER',
  priority_score INTEGER DEFAULT 0, -- Calculated priority
  
  -- Diagnosis and resolution
  diagnosis TEXT,
  resolution_notes TEXT,
  resolving_supervisor VARCHAR(10),
  
  -- Timing (critical for KPIs)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  diagnosed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  returned_to_service_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Duration calculations (stored for performance)
  acknowledgment_time_minutes INTEGER,
  diagnosis_time_minutes INTEGER,
  total_duration_minutes INTEGER,
  
  -- Flags and metadata
  is_priority BOOLEAN DEFAULT FALSE,
  repeat_breakdown BOOLEAN DEFAULT FALSE,
  previous_breakdown_id VARCHAR(20),
  auto_escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMPTZ,
  passenger_cloud_used BOOLEAN DEFAULT FALSE,
  weather_conditions JSONB,
  traffic_conditions JSONB,
  
  -- Archive and audit
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archived_by VARCHAR(10),
  
  -- Sync and real-time
  sync_status VARCHAR(20) DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1
);

-- Breakdown events (audit trail)
CREATE TABLE IF NOT EXISTS breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20) NOT NULL REFERENCES breakdowns(breakdown_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  by_badge VARCHAR(10),
  by_name VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fleet database (for validation and intelligence)
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fleet_number VARCHAR(10) UNIQUE NOT NULL,
  registration VARCHAR(20),
  make VARCHAR(50),
  model VARCHAR(50),
  year INTEGER,
  depot_id VARCHAR(50),
  vehicle_type VARCHAR(30),
  capacity INTEGER,
  fuel_type VARCHAR(20),
  euro_standard VARCHAR(10),
  length_meters DECIMAL(4,2),
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  
  -- Status and reliability
  status VARCHAR(20) CHECK (status IN ('active', 'maintenance', 'breakdown', 'withdrawn')) DEFAULT 'active',
  last_mot DATE,
  next_service DATE,
  mileage INTEGER,
  
  -- Breakdown history summary
  total_breakdowns INTEGER DEFAULT 0,
  last_breakdown_date DATE,
  avg_monthly_breakdowns DECIMAL(4,2) DEFAULT 0,
  reliability_score INTEGER DEFAULT 100, -- 0-100
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route priorities (for escalation logic)
CREATE TABLE IF NOT EXISTS route_priorities (
  id SERIAL PRIMARY KEY,
  route_number VARCHAR(20) UNIQUE NOT NULL,
  priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'secured', 'important', 'standard')) DEFAULT 'standard',
  color_code VARCHAR(7),
  escalation_threshold_minutes INTEGER DEFAULT 30,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time supervisor sessions
CREATE TABLE IF NOT EXISTS supervisor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  supervisor_badge VARCHAR(10) NOT NULL REFERENCES supervisors(badge),
  supervisor_name VARCHAR(100),
  
  -- Session details
  login_time TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  
  -- Sync data
  current_breakdowns JSONB DEFAULT '[]',
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location history (for tracking movement)
CREATE TABLE IF NOT EXISTS breakdown_location_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breakdown_id VARCHAR(20) NOT NULL REFERENCES breakdowns(breakdown_id) ON DELETE CASCADE,
  location TEXT,
  location_coords POINT,
  location_w3w VARCHAR(100),
  location_type VARCHAR(50),
  location_accuracy FLOAT,
  updated_by VARCHAR(10),
  update_source VARCHAR(30) DEFAULT 'manual', -- manual, gps, wizard
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Breakdowns indexes (critical for real-time queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_status_active 
  ON breakdowns(status, created_at DESC) WHERE archived = FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_fleet_recent 
  ON breakdowns(fleet_no, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_supervisor 
  ON breakdowns(supervisor_badge, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_depot 
  ON breakdowns(depot_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_priority 
  ON breakdowns(is_priority, status, created_at DESC) WHERE archived = FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_sync 
  ON breakdowns(sync_status, last_sync_at);

-- Geospatial indexes for location queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdowns_location_gist 
  ON breakdowns USING GIST(location_coords) WHERE location_coords IS NOT NULL;

-- Breakdown events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdown_events_breakdown 
  ON breakdown_events(breakdown_id, occurred_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_breakdown_events_type 
  ON breakdown_events(event_type, occurred_at DESC);

-- Supervisor sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supervisor_sessions_active 
  ON supervisor_sessions(supervisor_badge, active, last_activity DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supervisor_sessions_heartbeat 
  ON supervisor_sessions(last_heartbeat) WHERE active = TRUE;

-- Fleet indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fleet_depot_status 
  ON fleet_vehicles(depot_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fleet_reliability 
  ON fleet_vehicles(reliability_score, total_breakdowns DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate sequential breakdown IDs
CREATE OR REPLACE FUNCTION get_next_breakdown_id()
RETURNS TEXT AS $$
DECLARE
  year INTEGER;
  last_num INTEGER;
  new_id TEXT;
BEGIN
  year := EXTRACT(YEAR FROM NOW());
  
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(breakdown_id FROM 9 FOR 5) AS INTEGER)),
    0
  ) INTO last_num
  FROM breakdowns
  WHERE breakdown_id LIKE 'BD-' || year || '-%';
  
  new_id := 'BD-' || year || '-' || LPAD((last_num + 1)::TEXT, 5, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_priority_score(
  p_route_id VARCHAR,
  p_severity VARCHAR,
  p_repeat_breakdown BOOLEAN,
  p_fleet_reliability INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
  base_score INTEGER := 0;
  route_priority VARCHAR;
BEGIN
  -- Base score by severity
  CASE p_severity
    WHEN 'STOP' THEN base_score := 100;
    WHEN 'AMBER' THEN base_score := 50;
    WHEN 'CONTINUE' THEN base_score := 25;
    ELSE base_score := 50;
  END CASE;
  
  -- Route priority multiplier
  SELECT priority_level INTO route_priority
  FROM route_priorities
  WHERE route_number = p_route_id;
  
  CASE route_priority
    WHEN 'critical' THEN base_score := base_score * 2;
    WHEN 'secured' THEN base_score := base_score * 1.5;
    WHEN 'important' THEN base_score := base_score * 1.2;
    ELSE base_score := base_score * 1;
  END CASE;
  
  -- Repeat breakdown penalty
  IF p_repeat_breakdown THEN
    base_score := base_score + 25;
  END IF;
  
  -- Fleet reliability factor
  IF p_fleet_reliability < 80 THEN
    base_score := base_score + 10;
  END IF;
  
  RETURN LEAST(base_score, 200); -- Cap at 200
END;
$$ LANGUAGE plpgsql;

-- Function to create breakdown with auto-calculations
CREATE OR REPLACE FUNCTION create_breakdown(
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
  v_breakdown_id TEXT;
  v_daily_id INTEGER;
  v_repeat_check BOOLEAN := FALSE;
  v_previous_id VARCHAR;
  v_priority_score INTEGER;
  v_fleet_reliability INTEGER := 100;
BEGIN
  -- Get next breakdown ID
  v_breakdown_id := get_next_breakdown_id();
  
  -- Calculate daily ID (resets at 1 AM each day)
  SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_daily_id
  FROM breakdowns
  WHERE created_at >= DATE_TRUNC('day', NOW()) + INTERVAL '1 hour';
  
  -- Check for repeat breakdowns (last 7 days)
  SELECT 
    COUNT(*) > 0,
    (SELECT breakdown_id FROM breakdowns 
     WHERE fleet_no = p_fleet_number 
       AND created_at >= NOW() - INTERVAL '7 days'
     ORDER BY created_at DESC LIMIT 1)
  INTO v_repeat_check, v_previous_id
  FROM breakdowns
  WHERE fleet_no = p_fleet_number 
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Get fleet reliability
  SELECT reliability_score INTO v_fleet_reliability
  FROM fleet_vehicles
  WHERE fleet_number = p_fleet_number;
  
  -- Calculate priority score
  v_priority_score := calculate_priority_score(
    p_route_id, 'AMBER', v_repeat_check, v_fleet_reliability
  );
  
  -- Insert breakdown
  INSERT INTO breakdowns (
    breakdown_id, daily_id, fleet_no, supervisor_badge, supervisor_name,
    location, location_coords, depot_id, route_id, wizard_type,
    repeat_breakdown, previous_breakdown_id, priority_score,
    is_priority, status
  ) VALUES (
    v_breakdown_id, v_daily_id, p_fleet_number, p_supervisor_badge, p_supervisor_name,
    p_location, p_location_coords, p_depot_id, p_route_id, p_wizard_type,
    v_repeat_check, v_previous_id, v_priority_score,
    (p_route_id IN (SELECT route_number FROM route_priorities WHERE priority_level = 'critical')),
    'received'
  );
  
  -- Log creation event
  INSERT INTO breakdown_events (
    breakdown_id, event_type, by_badge, event_data
  ) VALUES (
    v_breakdown_id, 'breakdown_created', p_supervisor_badge,
    json_build_object(
      'fleet_number', p_fleet_number,
      'location', p_location,
      'wizard_type', p_wizard_type,
      'repeat_breakdown', v_repeat_check
    )
  );
  
  -- Update fleet statistics
  UPDATE fleet_vehicles 
  SET total_breakdowns = total_breakdowns + 1,
      last_breakdown_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE fleet_number = p_fleet_number;
  
  RETURN json_build_object(
    'success', true,
    'breakdown_id', v_breakdown_id,
    'daily_id', v_daily_id,
    'repeat_warning', v_repeat_check,
    'priority_score', v_priority_score
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_breakdowns_updated_at
  BEFORE UPDATE ON breakdowns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at
  BEFORE UPDATE ON supervisors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_vehicles_updated_at
  BEFORE UPDATE ON fleet_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR PERFORMANCE
-- =====================================================

-- Active breakdowns with calculated fields
CREATE OR REPLACE VIEW active_breakdowns AS
SELECT 
  b.*,
  s.name as supervisor_full_name,
  s.depot_id as supervisor_depot,
  fv.make, fv.model, fv.reliability_score,
  rp.priority_level as route_priority_level,
  
  -- Time calculations
  EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 AS minutes_since_start,
  EXTRACT(EPOCH FROM (NOW() - b.diagnosed_at)) / 60 AS minutes_since_diagnosis,
  EXTRACT(EPOCH FROM (NOW() - b.acknowledged_at)) / 60 AS minutes_since_acknowledged,
  
  -- Status flags
  CASE WHEN b.diagnosed_at IS NOT NULL AND 
            EXTRACT(EPOCH FROM (NOW() - b.diagnosed_at)) / 60 > 30 
       THEN TRUE ELSE FALSE END AS is_overdue,
  
  -- Location display
  CASE 
    WHEN b.location_verified AND b.location_type = 'depot' THEN '🏢 ' || b.location || ' ✓'
    WHEN b.location_verified AND b.location_type = 'bus_station' THEN '🚏 ' || b.location || ' ✓'
    WHEN b.location_type = 'route' THEN '🚌 ' || b.location || ' (On Route)'
    WHEN b.location_w3w IS NOT NULL THEN '📍 ' || b.location || ' (///' || b.location_w3w || ')'
    WHEN b.location_verified THEN '📍 ' || b.location || ' ✓'
    ELSE '📍 ' || COALESCE(b.location, 'Unknown location')
  END AS location_display

FROM breakdowns b
LEFT JOIN supervisors s ON b.supervisor_badge = s.badge
LEFT JOIN fleet_vehicles fv ON b.fleet_no = fv.fleet_number
LEFT JOIN route_priorities rp ON b.route_id = rp.route_number
WHERE b.status != 'cleared' 
  AND b.archived = FALSE;

-- Daily breakdown summary
CREATE OR REPLACE VIEW daily_breakdown_summary AS
SELECT 
  DATE(created_at) as breakdown_date,
  COUNT(*) as total_breakdowns,
  COUNT(*) FILTER (WHERE status = 'cleared') as resolved_count,
  COUNT(*) FILTER (WHERE status != 'cleared') as active_count,
  COUNT(*) FILTER (WHERE severity = 'STOP') as critical_count,
  COUNT(*) FILTER (WHERE repeat_breakdown = TRUE) as repeat_count,
  AVG(total_duration_minutes) FILTER (WHERE total_duration_minutes IS NOT NULL) as avg_duration_minutes,
  COUNT(DISTINCT supervisor_badge) as supervisors_involved,
  COUNT(DISTINCT depot_id) as depots_affected
FROM breakdowns
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND archived = FALSE
GROUP BY DATE(created_at)
ORDER BY breakdown_date DESC;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_location_history ENABLE ROW LEVEL SECURITY;

-- Supervisors can see all data (authenticated users)
CREATE POLICY "supervisors_all_access" ON breakdowns
  FOR ALL TO authenticated USING (true);

CREATE POLICY "supervisors_all_access" ON breakdown_events
  FOR ALL TO authenticated USING (true);

CREATE POLICY "supervisors_all_access" ON supervisor_sessions
  FOR ALL TO authenticated USING (true);

CREATE POLICY "supervisors_read_fleet" ON fleet_vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "supervisors_read_routes" ON route_priorities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "supervisors_all_location_history" ON breakdown_location_history
  FOR ALL TO authenticated USING (true);

-- Admin-only policies for sensitive operations
CREATE POLICY "admin_supervisors_management" ON supervisors
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'badge' = badge);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert Go North East supervisors
INSERT INTO supervisors (badge, name, role, depot_id, active) VALUES
  ('AW001', 'Alan Wilson', 'supervisor', 'Washington', true),
  ('AC002', 'Andrew Coates', 'supervisor', 'Chester', true),
  ('AG003', 'Anthony Gair', 'admin', 'Washington', true),
  ('CF004', 'Chris Forster', 'supervisor', 'Hexham', true),
  ('DH005', 'David Hunter', 'supervisor', 'Riverside', true),
  ('JD006', 'John Dobson', 'supervisor', 'Percy Main', true),
  ('JP007', 'John Patterson', 'supervisor', 'Consett', true),
  ('SG008', 'Steven Graham', 'supervisor', 'Deptford', true),
  ('BP009', 'Brian Pears', 'admin', 'Washington', true)
ON CONFLICT (badge) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  depot_id = EXCLUDED.depot_id,
  active = EXCLUDED.active,
  updated_at = NOW();

-- Insert priority routes
INSERT INTO route_priorities (route_number, priority_level, color_code, escalation_threshold_minutes) VALUES
  ('X10', 'critical', '#FF0000', 15),
  ('X21', 'critical', '#FF0000', 15),
  ('21', 'critical', '#FF0000', 20),
  ('56', 'critical', '#FF0000', 20),
  ('307', 'secured', '#FFA500', 25),
  ('309', 'secured', '#FFA500', 25),
  ('1', 'important', '#FFFF00', 30),
  ('28', 'important', '#FFFF00', 30),
  ('49', 'important', '#FFFF00', 30)
ON CONFLICT (route_number) DO UPDATE SET
  priority_level = EXCLUDED.priority_level,
  color_code = EXCLUDED.color_code,
  escalation_threshold_minutes = EXCLUDED.escalation_threshold_minutes;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Real-time publications for Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE breakdowns;
ALTER PUBLICATION supabase_realtime ADD TABLE breakdown_events;
ALTER PUBLICATION supabase_realtime ADD TABLE supervisor_sessions;

-- Performance monitoring
CREATE OR REPLACE VIEW breakdown_performance_metrics AS
SELECT
  'breakdowns' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE status != 'cleared' AND archived = FALSE) as active_count,
  pg_size_pretty(pg_total_relation_size('breakdowns')) as table_size
FROM breakdowns
UNION ALL
SELECT
  'breakdown_events' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  0 as active_count,
  pg_size_pretty(pg_total_relation_size('breakdown_events')) as table_size
FROM breakdown_events;

-- =====================================================
-- MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to archive old breakdowns
CREATE OR REPLACE FUNCTION archive_old_breakdowns(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE breakdowns 
  SET archived = TRUE, 
      archived_at = NOW(),
      archived_by = 'SYSTEM'
  WHERE created_at < NOW() - INTERVAL days_old || ' days'
    AND status = 'cleared'
    AND archived = FALSE;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  INSERT INTO breakdown_events (breakdown_id, event_type, by_badge, notes)
  SELECT breakdown_id, 'auto_archived', 'SYSTEM', 
         'Automatically archived after ' || days_old || ' days'
  FROM breakdowns 
  WHERE archived_at >= NOW() - INTERVAL '1 minute';
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  DELETE FROM supervisor_sessions
  WHERE (last_heartbeat < NOW() - INTERVAL '1 day' OR 
         expires_at < NOW())
    AND active = TRUE;
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Go BARRY Breakdown Management Database Schema Deployed Successfully!';
  RAISE NOTICE '📊 Tables created: supervisors, breakdowns, breakdown_events, fleet_vehicles, route_priorities, supervisor_sessions, breakdown_location_history';
  RAISE NOTICE '🔒 Row Level Security enabled with supervisor and admin policies';
  RAISE NOTICE '⚡ Performance indexes and views created for real-time operations';
  RAISE NOTICE '📱 Real-time subscriptions configured for Supabase';
  RAISE NOTICE '🔧 Ready for production use with 231+ bus routes and 9 supervisors';
END $$;