-- Breakdown Analytics Database Schema for Go North East
-- Operations-focused tracking system for fleet breakdowns

-- 1. Fleet Vehicles Table (simplified for operations use)
CREATE TABLE IF NOT EXISTS fleet_vehicles (
    vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_number VARCHAR(20) UNIQUE NOT NULL,
    registration VARCHAR(20),
    vehicle_type VARCHAR(50), -- 'Single Decker', 'Double Decker', 'Minibus', 'Coach'
    manufacturer VARCHAR(50), -- 'Wright', 'ADL', 'Optare', 'Volvo'
    model VARCHAR(50), -- 'StreetDeck', 'Eclipse', 'Solo', 'B5LH'
    depot VARCHAR(50) NOT NULL, -- 'Washington', 'Consett', 'Hexham', 'Riverside'
    year_of_manufacture INTEGER,
    in_service BOOLEAN DEFAULT true,
    added_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Breakdown Events - Core tracking table
CREATE TABLE IF NOT EXISTS breakdown_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES fleet_vehicles(vehicle_id),
    fleet_number VARCHAR(20) NOT NULL, -- Denormalized for performance
    depot VARCHAR(50) NOT NULL, -- Denormalized for analysis
    
    -- When & Where
    reported_date TIMESTAMP NOT NULL DEFAULT NOW(),
    reported_by VARCHAR(100), -- Driver/Supervisor name
    route VARCHAR(20), -- Route number if applicable
    location VARCHAR(200), -- General location of breakdown
    
    -- What Happened
    breakdown_category VARCHAR(50) NOT NULL, -- 'Cooling System', 'Electrical', etc.
    specific_issue VARCHAR(100), -- More detailed description
    symptoms TEXT[], -- Array of symptoms from GO BARRY
    severity VARCHAR(20), -- 'STOP', 'AMBER', 'CONTINUE'
    
    -- Operational Impact
    vehicle_off_road BOOLEAN DEFAULT false,
    changeover_required BOOLEAN DEFAULT false,
    service_disrupted BOOLEAN DEFAULT false,
    passengers_affected INTEGER DEFAULT 0,
    delay_minutes INTEGER,
    
    -- Source Information
    source VARCHAR(50) DEFAULT 'GO_BARRY', -- 'GO_BARRY', 'DRIVER_REPORT', 'ROUTINE_CHECK'
    barry_wizard_used VARCHAR(50), -- Which wizard if from GO BARRY
    barry_session_id UUID, -- Link to GO BARRY session data
    
    -- Tranzaura Integration
    tranzaura_ref VARCHAR(50), -- Tranzaura ticket number
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Breakdown Categories Reference Table
CREATE TABLE IF NOT EXISTS breakdown_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(50) UNIQUE NOT NULL, -- 'cooling_system', 'electrical', etc.
    category_name VARCHAR(100) NOT NULL, -- 'Cooling System', 'Electrical', etc.
    category_group VARCHAR(50), -- 'safety_critical', 'mechanical', 'electrical'
    sdc_section VARCHAR(50), -- Reference to SDC Guide section
    typical_symptoms TEXT[],
    is_safety_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Pattern Alerts - Automated pattern detection
CREATE TABLE IF NOT EXISTS pattern_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'depot_pattern', 'vehicle_repeat', 'fleet_trend'
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
    
    -- Pattern Details
    pattern_description TEXT NOT NULL, -- "5 alternator failures at Consett in 7 days"
    affected_depot VARCHAR(50),
    affected_category VARCHAR(50),
    affected_vehicles VARCHAR(20)[], -- Array of fleet numbers
    
    -- Metrics
    occurrence_count INTEGER NOT NULL,
    timeframe_days INTEGER,
    first_occurrence DATE,
    last_occurrence DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. GO BARRY Sessions Table (stores wizard completion data)
CREATE TABLE IF NOT EXISTS go_barry_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES fleet_vehicles(vehicle_id),
    fleet_number VARCHAR(20),
    wizard_type VARCHAR(50) NOT NULL, -- 'brakes', 'steering', etc.
    started_by VARCHAR(100), -- Supervisor name
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Wizard Data
    responses JSONB, -- Complete wizard responses
    final_decision VARCHAR(20), -- 'STOP', 'CONTINUE', 'CHANGEOVER'
    
    -- Actions Taken
    tranzaura_created BOOLEAN DEFAULT false,
    engineer_contacted BOOLEAN DEFAULT false,
    changeover_arranged BOOLEAN DEFAULT false,
    
    -- Session Metadata
    device_info JSONB,
    location JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_breakdown_vehicle_date ON breakdown_events(vehicle_id, reported_date);
CREATE INDEX idx_breakdown_depot_category ON breakdown_events(depot, breakdown_category);
CREATE INDEX idx_breakdown_category_date ON breakdown_events(breakdown_category, reported_date);
CREATE INDEX idx_breakdown_fleet_number ON breakdown_events(fleet_number);
CREATE INDEX idx_pattern_alerts_status ON pattern_alerts(status);
CREATE INDEX idx_pattern_alerts_depot ON pattern_alerts(affected_depot);

-- Insert default breakdown categories based on SDC Guide
INSERT INTO breakdown_categories (category_code, category_name, category_group, sdc_section, is_safety_critical) VALUES
    -- Safety Critical
    ('brakes', 'Brake System', 'safety_critical', 'Section 5', true),
    ('steering', 'Steering', 'safety_critical', 'Section 8', true),
    ('oil_warning', 'Oil System', 'safety_critical', 'Section 20', true),
    ('loose_wheel_nuts', 'Wheels', 'safety_critical', 'Section 17', true),
    ('puncture', 'Tires', 'safety_critical', 'Section 22', true),
    
    -- Mechanical
    ('cooling_system', 'Cooling System', 'mechanical', 'Section 11,16', false),
    ('engine', 'Engine', 'mechanical', 'Section 8,12,19', false),
    ('transmission', 'Transmission', 'mechanical', 'Section 13,14', false),
    ('suspension', 'Suspension', 'mechanical', 'Section 27', false),
    
    -- Electrical
    ('electrical', 'Electrical System', 'electrical', 'Section 4,10,15', false),
    ('battery', 'Battery/Charging', 'electrical', 'Section 4', false),
    ('lights', 'Lighting System', 'electrical', 'Section 11,15', false),
    
    -- Operational
    ('doors', 'Door System', 'operational', 'Section 10', false),
    ('ramp', 'Wheelchair Ramp', 'operational', 'Section 23', false),
    ('climate', 'Heating/Cooling', 'operational', 'Section 9', false),
    ('wipers', 'Wipers/Washers', 'operational', 'Section 30', false),
    
    -- Other
    ('warning_lights', 'Warning Lights', 'other', 'Section 28', false),
    ('other', 'Other', 'other', 'Various', false)
ON CONFLICT (category_code) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW vehicle_breakdown_summary AS
SELECT 
    v.fleet_number,
    v.vehicle_type,
    v.depot,
    COUNT(be.event_id) as total_breakdowns,
    COUNT(CASE WHEN be.reported_date >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days,
    COUNT(CASE WHEN be.severity = 'STOP' THEN 1 END) as critical_breakdowns,
    MAX(be.reported_date) as last_breakdown
FROM fleet_vehicles v
LEFT JOIN breakdown_events be ON v.vehicle_id = be.vehicle_id
WHERE v.in_service = true
GROUP BY v.vehicle_id, v.fleet_number, v.vehicle_type, v.depot;

CREATE OR REPLACE VIEW depot_breakdown_stats AS
SELECT 
    depot,
    COUNT(*) as total_breakdowns,
    COUNT(DISTINCT vehicle_id) as vehicles_affected,
    COUNT(CASE WHEN severity = 'STOP' THEN 1 END) as critical_events,
    COUNT(CASE WHEN reported_date >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    COUNT(CASE WHEN reported_date >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM breakdown_events
GROUP BY depot;

-- Function to detect patterns (called after each new breakdown)
CREATE OR REPLACE FUNCTION check_breakdown_patterns() RETURNS trigger AS $$
DECLARE
    depot_patterns RECORD;
    vehicle_patterns RECORD;
BEGIN
    -- Check for depot-specific patterns (3+ same issues in 7 days)
    FOR depot_patterns IN 
        SELECT depot, breakdown_category, COUNT(*) as count,
               ARRAY_AGG(DISTINCT fleet_number) as vehicles
        FROM breakdown_events
        WHERE reported_date >= NOW() - INTERVAL '7 days'
        GROUP BY depot, breakdown_category
        HAVING COUNT(*) >= 3
    LOOP
        INSERT INTO pattern_alerts (
            alert_type, severity, pattern_description,
            affected_depot, affected_category, affected_vehicles,
            occurrence_count, timeframe_days
        ) VALUES (
            'depot_pattern',
            CASE WHEN depot_patterns.count >= 5 THEN 'critical' 
                 WHEN depot_patterns.count >= 4 THEN 'warning' 
                 ELSE 'info' END,
            depot_patterns.count || ' ' || depot_patterns.breakdown_category || 
            ' issues at ' || depot_patterns.depot || ' in 7 days',
            depot_patterns.depot,
            depot_patterns.breakdown_category,
            depot_patterns.vehicles,
            depot_patterns.count,
            7
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Check for repeat vehicle offenders (4+ breakdowns in 30 days)
    FOR vehicle_patterns IN
        SELECT fleet_number, depot, COUNT(*) as count
        FROM breakdown_events
        WHERE reported_date >= NOW() - INTERVAL '30 days'
        GROUP BY fleet_number, depot
        HAVING COUNT(*) >= 4
    LOOP
        INSERT INTO pattern_alerts (
            alert_type, severity, pattern_description,
            affected_depot, affected_vehicles, occurrence_count, timeframe_days
        ) VALUES (
            'vehicle_repeat',
            CASE WHEN vehicle_patterns.count >= 6 THEN 'critical' 
                 WHEN vehicle_patterns.count >= 5 THEN 'warning' 
                 ELSE 'info' END,
            'Vehicle ' || vehicle_patterns.fleet_number || ' has ' || 
            vehicle_patterns.count || ' breakdowns in 30 days',
            vehicle_patterns.depot,
            ARRAY[vehicle_patterns.fleet_number],
            vehicle_patterns.count,
            30
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Return NEW for trigger (required for AFTER INSERT triggers)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check patterns after each breakdown
CREATE TRIGGER check_patterns_after_breakdown
AFTER INSERT ON breakdown_events
FOR EACH ROW
EXECUTE FUNCTION check_breakdown_patterns();

-- Grant permissions (adjust based on your Supabase roles)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;