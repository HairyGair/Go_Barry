-- Enhanced StreetManager Route Impact Analysis Schema
-- Designed for Go North East's 231+ bus routes
-- Supports geographical matching, severity classification, and supervisor notifications

-- ====================================================================================
-- 1. ENHANCED STREETWORKS TABLE WITH ROUTE IMPACT ANALYSIS
-- ====================================================================================

CREATE TABLE IF NOT EXISTS streetworks_enhanced (
    -- Primary identification
    id TEXT PRIMARY KEY,
    permit_reference_number TEXT UNIQUE,
    activity_reference_number TEXT,
    
    -- Basic streetwork details
    title TEXT NOT NULL,
    description TEXT,
    location_description TEXT,
    
    -- Geographic data for route matching
    coordinates POINT, -- PostGIS point for efficient spatial queries
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geometry TEXT, -- Original WKT geometry from StreetManager
    
    -- Location hierarchy for filtering
    area_name TEXT,
    town TEXT,
    administrative_area TEXT,
    street_name TEXT,
    
    -- Work classification
    work_category TEXT, -- major, standard, minor, immediate
    work_status TEXT, -- proposed, permitted, in_progress, completed, cancelled
    traffic_management_type TEXT, -- road_closure, lane_closure, multi_way_signals, etc.
    
    -- Timing information
    proposed_start_date TIMESTAMP WITH TIME ZONE,
    proposed_end_date TIMESTAMP WITH TIME ZONE,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Enhanced route impact analysis
    route_impact_analysis JSONB, -- Detailed analysis of affected routes
    affected_route_numbers TEXT[], -- Simple array of route numbers for quick filtering
    affected_route_count INTEGER DEFAULT 0,
    
    -- Impact classification
    impact_severity TEXT CHECK (impact_severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    impact_radius_meters INTEGER, -- Calculated impact radius based on work type
    
    -- Route confidence scoring (0-100)
    route_matching_confidence INTEGER DEFAULT 0,
    geographical_accuracy TEXT, -- exact, approximate, estimated
    
    -- Notification management
    requires_supervisor_notification BOOLEAN DEFAULT FALSE,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    escalation_level INTEGER DEFAULT 0, -- 0=none, 1=standard, 2=urgent, 3=critical
    
    -- Processing metadata
    source TEXT DEFAULT 'streetmanager_webhook',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_route_analysis TIMESTAMP WITH TIME ZONE,
    
    -- Webhook tracking
    notification_id TEXT, -- Links to webhook notification
    event_type TEXT, -- streetmanager event type
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_coordinates ON streetworks_enhanced USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_severity ON streetworks_enhanced (impact_severity);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_routes ON streetworks_enhanced USING GIN (affected_route_numbers);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_dates ON streetworks_enhanced (proposed_start_date, proposed_end_date);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_status ON streetworks_enhanced (work_status);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_notifications ON streetworks_enhanced (requires_supervisor_notification, notification_sent);
CREATE INDEX IF NOT EXISTS idx_streetworks_enhanced_area ON streetworks_enhanced (administrative_area, town);

-- ====================================================================================
-- 2. ROUTE IMPACT DETAILS TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS route_impacts (
    id SERIAL PRIMARY KEY,
    streetwork_id TEXT REFERENCES streetworks_enhanced(id) ON DELETE CASCADE,
    
    -- Route identification
    route_number TEXT NOT NULL,
    route_id TEXT, -- GTFS route_id if available
    
    -- Impact analysis
    impact_type TEXT CHECK (impact_type IN (
        'DIRECT_BLOCKAGE', 'STOP_AFFECTED', 'DELAY_RISK', 
        'DIVERSION_REQUIRED', 'TIMING_IMPACT', 'PASSENGER_ACCESS'
    )),
    
    -- Distance and proximity
    distance_meters DECIMAL(10, 2),
    closest_stop_id TEXT,
    closest_stop_name TEXT,
    closest_stop_distance DECIMAL(10, 2),
    
    -- Impact severity for this specific route
    route_impact_severity TEXT CHECK (route_impact_severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    
    -- Estimated effects
    estimated_delay_minutes INTEGER,
    requires_diversion BOOLEAN DEFAULT FALSE,
    passenger_impact_level TEXT, -- minimal, moderate, significant, severe
    
    -- Confidence scoring
    matching_confidence INTEGER, -- 0-100 confidence in this route match
    matching_method TEXT, -- proximity, stop_match, shape_overlap, manual
    
    -- Analysis metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for route impact queries
CREATE INDEX IF NOT EXISTS idx_route_impacts_streetwork ON route_impacts (streetwork_id);
CREATE INDEX IF NOT EXISTS idx_route_impacts_route ON route_impacts (route_number);
CREATE INDEX IF NOT EXISTS idx_route_impacts_severity ON route_impacts (route_impact_severity);
CREATE INDEX IF NOT EXISTS idx_route_impacts_diversion ON route_impacts (requires_diversion);

-- ====================================================================================
-- 3. SUPERVISOR NOTIFICATIONS TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS supervisor_notifications (
    id SERIAL PRIMARY KEY,
    streetwork_id TEXT REFERENCES streetworks_enhanced(id) ON DELETE CASCADE,
    
    -- Notification details
    notification_type TEXT CHECK (notification_type IN (
        'CRITICAL_IMPACT', 'ADVANCE_WARNING', 'DIVERSION_REQUIRED', 
        'ROUTE_CLOSURE', 'TIMING_CHANGE', 'EMERGENCY_WORKS'
    )),
    
    priority_level TEXT CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    affected_routes TEXT[],
    
    -- Timing
    scheduled_for TIMESTAMP WITH TIME ZONE,
    advance_notice_hours INTEGER, -- How many hours before work starts
    
    -- Delivery tracking
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_method TEXT[], -- email, dashboard, sms, etc.
    
    -- Supervisor interaction
    acknowledged_by TEXT[],
    supervisor_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification management
CREATE INDEX IF NOT EXISTS idx_supervisor_notifications_streetwork ON supervisor_notifications (streetwork_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_notifications_priority ON supervisor_notifications (priority_level);
CREATE INDEX IF NOT EXISTS idx_supervisor_notifications_sent ON supervisor_notifications (sent, scheduled_for);

-- ====================================================================================
-- 4. ROUTE ANALYSIS CACHE TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS route_analysis_cache (
    id SERIAL PRIMARY KEY,
    
    -- Cache key components
    cache_key TEXT UNIQUE NOT NULL, -- Hash of coordinates + search radius
    coordinates POINT,
    search_radius_meters INTEGER,
    
    -- Cached route data
    nearby_routes JSONB, -- Routes found near these coordinates
    route_count INTEGER,
    
    -- Cache metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for cache performance
CREATE INDEX IF NOT EXISTS idx_route_cache_key ON route_analysis_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_route_cache_coordinates ON route_analysis_cache USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_route_cache_expires ON route_analysis_cache (expires_at);

-- ====================================================================================
-- 5. SEVERITY CLASSIFICATION RULES TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS severity_classification_rules (
    id SERIAL PRIMARY KEY,
    rule_name TEXT UNIQUE NOT NULL,
    rule_description TEXT,
    
    -- Conditions (stored as JSONB for flexibility)
    conditions JSONB, -- work_category, traffic_management_type, etc.
    
    -- Results
    base_severity TEXT CHECK (base_severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    impact_radius_meters INTEGER,
    requires_notification BOOLEAN DEFAULT FALSE,
    advance_notice_hours INTEGER DEFAULT 2,
    
    -- Rule metadata
    priority INTEGER DEFAULT 100, -- Lower number = higher priority
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default severity rules
INSERT INTO severity_classification_rules (rule_name, rule_description, conditions, base_severity, impact_radius_meters, requires_notification, advance_notice_hours, priority) VALUES
('emergency_works', 'Emergency roadworks requiring immediate attention', '{"is_emergency_works": "Yes"}', 'CRITICAL', 1000, TRUE, 0, 1),
('road_closure', 'Complete road closures affecting through traffic', '{"traffic_management_type": "road_closure"}', 'CRITICAL', 800, TRUE, 24, 2),
('major_works_progress', 'Major category works that are in progress', '{"work_category": "major", "work_status": "in_progress"}', 'HIGH', 600, TRUE, 12, 3),
('multi_way_signals', 'Multi-way traffic signals causing delays', '{"traffic_management_type": "multi_way_signals"}', 'MEDIUM', 400, TRUE, 6, 4),
('lane_closure_major', 'Lane closures on major roads', '{"traffic_management_type": "lane_closure", "work_category": "major"}', 'MEDIUM', 300, TRUE, 8, 5),
('traffic_sensitive', 'Works on traffic sensitive streets', '{"is_traffic_sensitive": "Yes"}', 'MEDIUM', 200, FALSE, 4, 6),
('standard_works', 'Standard category works', '{"work_category": "standard"}', 'LOW', 150, FALSE, 2, 7),
('minor_works', 'Minor works with minimal impact', '{"work_category": "minor"}', 'LOW', 100, FALSE, 1, 8)
ON CONFLICT (rule_name) DO NOTHING;

-- ====================================================================================
-- 6. PERFORMANCE MONITORING TABLE
-- ====================================================================================

CREATE TABLE IF NOT EXISTS streetmanager_performance (
    id SERIAL PRIMARY KEY,
    
    -- Metrics
    webhooks_processed_count INTEGER DEFAULT 0,
    route_analysis_time_ms INTEGER,
    routes_analyzed_count INTEGER DEFAULT 0,
    notifications_sent_count INTEGER DEFAULT 0,
    
    -- Processing stats
    successful_matches INTEGER DEFAULT 0,
    failed_matches INTEGER DEFAULT 0,
    average_confidence_score DECIMAL(5,2),
    
    -- Memory and performance
    memory_usage_mb DECIMAL(10,2),
    processing_errors TEXT[],
    
    -- Time period
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================================
-- 7. VIEWS FOR DASHBOARD INTEGRATION
-- ====================================================================================

-- Active high-impact streetworks requiring supervisor attention
CREATE OR REPLACE VIEW active_critical_streetworks AS
SELECT 
    s.*,
    ri.route_count,
    ri.critical_routes,
    ri.high_impact_routes
FROM streetworks_enhanced s
LEFT JOIN (
    SELECT 
        streetwork_id,
        COUNT(*) as route_count,
        COUNT(*) FILTER (WHERE route_impact_severity = 'CRITICAL') as critical_routes,
        COUNT(*) FILTER (WHERE route_impact_severity = 'HIGH') as high_impact_routes
    FROM route_impacts 
    GROUP BY streetwork_id
) ri ON s.id = ri.streetwork_id
WHERE s.work_status IN ('in_progress', 'proposed', 'permitted')
    AND s.impact_severity IN ('CRITICAL', 'HIGH')
    AND (s.proposed_start_date <= NOW() + INTERVAL '7 days' OR s.actual_start_date IS NOT NULL);

-- Routes with upcoming disruptions for planning
CREATE OR REPLACE VIEW routes_upcoming_disruptions AS
SELECT 
    ri.route_number,
    COUNT(*) as disruption_count,
    MIN(s.proposed_start_date) as next_disruption_date,
    ARRAY_AGG(DISTINCT s.impact_severity) as severity_levels,
    ARRAY_AGG(s.title ORDER BY s.proposed_start_date) as upcoming_works
FROM route_impacts ri
JOIN streetworks_enhanced s ON ri.streetwork_id = s.id
WHERE s.proposed_start_date > NOW()
    AND s.proposed_start_date <= NOW() + INTERVAL '30 days'
    AND s.work_status IN ('proposed', 'permitted')
GROUP BY ri.route_number
ORDER BY next_disruption_date;

-- ====================================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- ====================================================================================

-- Function to automatically update route impact count
CREATE OR REPLACE FUNCTION update_route_impact_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE streetworks_enhanced 
        SET 
            affected_route_count = (
                SELECT COUNT(*) 
                FROM route_impacts 
                WHERE streetwork_id = NEW.streetwork_id
            ),
            updated_at = NOW()
        WHERE id = NEW.streetwork_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE streetworks_enhanced 
        SET 
            affected_route_count = (
                SELECT COUNT(*) 
                FROM route_impacts 
                WHERE streetwork_id = OLD.streetwork_id
            ),
            updated_at = NOW()
        WHERE id = OLD.streetwork_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep route counts synchronized
DROP TRIGGER IF EXISTS trigger_update_route_impact_count ON route_impacts;
CREATE TRIGGER trigger_update_route_impact_count
    AFTER INSERT OR UPDATE OR DELETE ON route_impacts
    FOR EACH ROW EXECUTE FUNCTION update_route_impact_count();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM route_analysis_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================================
-- 9. ROW LEVEL SECURITY (OPTIONAL)
-- ====================================================================================

-- Enable RLS for sensitive tables if needed
-- ALTER TABLE streetworks_enhanced ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE supervisor_notifications ENABLE ROW LEVEL SECURITY;

-- ====================================================================================
-- 10. CLEANUP AND MAINTENANCE
-- ====================================================================================

-- Function to archive old completed streetworks
CREATE OR REPLACE FUNCTION archive_old_streetworks(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    DELETE FROM streetworks_enhanced 
    WHERE work_status = 'completed' 
        AND (actual_end_date < NOW() - INTERVAL '1 day' * retention_days
        OR (actual_end_date IS NULL AND proposed_end_date < NOW() - INTERVAL '1 day' * retention_days));
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Summary comment
COMMENT ON TABLE streetworks_enhanced IS 'Enhanced StreetManager data with comprehensive route impact analysis for Go North East bus operations';
COMMENT ON TABLE route_impacts IS 'Detailed analysis of how each streetwork affects specific bus routes';
COMMENT ON TABLE supervisor_notifications IS 'Notifications sent to supervisors about critical route impacts';
COMMENT ON TABLE route_analysis_cache IS 'Performance cache for geographical route matching queries';