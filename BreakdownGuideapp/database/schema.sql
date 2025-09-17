-- Go North East Breakdown Guide Database Schema
-- Supabase PostgreSQL
-- Version: 1.0.0
-- Created: August 25, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUPERVISORS TABLE
-- =====================================================
CREATE TABLE supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_number VARCHAR(10) UNIQUE NOT NULL, -- e.g., 'AG003'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    depot VARCHAR(50),
    role VARCHAR(50) DEFAULT 'supervisor',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VEHICLES TABLE
-- =====================================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fleet_number VARCHAR(20) UNIQUE NOT NULL,
    registration VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    depot VARCHAR(50),
    vehicle_type VARCHAR(50),
    capacity INTEGER,
    is_priority_vehicle BOOLEAN DEFAULT false,
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    last_service_date DATE,
    next_service_due DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRIORITY SERVICES TABLE
-- =====================================================
CREATE TABLE priority_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_number VARCHAR(10) UNIQUE NOT NULL, -- X10, X21, 307, 1
    description VARCHAR(255),
    cost_multiplier DECIMAL(3,2) DEFAULT 2.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default priority services
INSERT INTO priority_services (service_number, description, cost_multiplier) VALUES
    ('X10', 'Express Service', 2.0),
    ('X21', 'Express Service', 2.0),
    ('307', 'High Frequency Service', 2.0),
    ('1', 'Core Route', 2.0);

-- =====================================================
-- BREAKDOWNS TABLE
-- =====================================================
CREATE TABLE breakdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breakdown_id VARCHAR(20) UNIQUE NOT NULL, -- BD-2025-00001
    vehicle_id UUID REFERENCES vehicles(id),
    supervisor_id UUID REFERENCES supervisors(id),
    
    -- Status and timing
    status VARCHAR(50) DEFAULT 'received', -- received, acknowledged, decision, dispatched, on_site, moving, cleared
    severity VARCHAR(10) CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE')),
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_description TEXT,
    route VARCHAR(50),
    direction VARCHAR(50),
    
    -- Issue details
    issue_category VARCHAR(100), -- From SDC Guide categories
    issue_description TEXT,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    passenger_count INTEGER,
    
    -- Timing
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    decision_at TIMESTAMP WITH TIME ZONE,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    on_site_at TIMESTAMP WITH TIME ZONE,
    moving_at TIMESTAMP WITH TIME ZONE,
    cleared_at TIMESTAMP WITH TIME ZONE,
    
    -- Cost tracking
    total_minutes INTEGER,
    base_cost DECIMAL(10, 2),
    peak_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    priority_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    total_cost DECIMAL(10, 2),
    
    -- Resolution
    resolution_notes TEXT,
    engineering_notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BREAKDOWN EVENTS TABLE (Audit Trail)
-- =====================================================
CREATE TABLE breakdown_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- status_change, note_added, photo_added, etc.
    event_data JSONB,
    created_by UUID REFERENCES supervisors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ASSESSMENT LOGS TABLE (Wizard Steps)
-- =====================================================
CREATE TABLE assessment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
    wizard_name VARCHAR(100) NOT NULL,
    step_number INTEGER NOT NULL,
    step_title VARCHAR(255),
    question TEXT,
    answer TEXT,
    decision VARCHAR(10), -- STOP, AMBER, CONTINUE
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BREAKDOWN PHOTOS TABLE
-- =====================================================
CREATE TABLE breakdown_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES supervisors(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEPOT CONFIGURATION TABLE
-- =====================================================
CREATE TABLE depots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    engineering_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert depots
INSERT INTO depots (code, name) VALUES
    ('WAS', 'Washington'),
    ('DAR', 'Darlinhgton'),
    ('NCL', 'Newcastle'),
    ('HEX', 'Hexham'),
    ('CON', 'Consett'),
    ('GTS', 'Gateshead');

-- =====================================================
-- DAILY COUNTER TABLE (For Sequential IDs)
-- =====================================================
CREATE TABLE daily_counters (
    date DATE PRIMARY KEY,
    counter INTEGER DEFAULT 0
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_vehicle ON breakdowns(vehicle_id);
CREATE INDEX idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX idx_breakdowns_created ON breakdowns(created_at);
CREATE INDEX idx_breakdown_events_breakdown ON breakdown_events(breakdown_id);
CREATE INDEX idx_assessment_logs_breakdown ON assessment_logs(breakdown_id);
CREATE INDEX idx_vehicles_fleet ON vehicles(fleet_number);
CREATE INDEX idx_vehicles_depot ON vehicles(depot);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate sequential breakdown ID
CREATE OR REPLACE FUNCTION generate_breakdown_id()
RETURNS VARCHAR AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    current_year VARCHAR(4) := EXTRACT(YEAR FROM current_date)::VARCHAR;
    new_counter INTEGER;
    new_id VARCHAR(20);
BEGIN
    -- Insert or update daily counter
    INSERT INTO daily_counters (date, counter)
    VALUES (current_date, 1)
    ON CONFLICT (date) DO UPDATE
    SET counter = daily_counters.counter + 1
    RETURNING counter INTO new_counter;
    
    -- Format: BD-YYYY-NNNNN
    new_id := 'BD-' || current_year || '-' || LPAD(new_counter::VARCHAR, 5, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate breakdown ID
CREATE OR REPLACE FUNCTION set_breakdown_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.breakdown_id IS NULL THEN
        NEW.breakdown_id := generate_breakdown_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_breakdown_id
BEFORE INSERT ON breakdowns
FOR EACH ROW
EXECUTE FUNCTION set_breakdown_id();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp trigger to relevant tables
CREATE TRIGGER update_supervisors_updated_at
BEFORE UPDATE ON supervisors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_breakdowns_updated_at
BEFORE UPDATE ON breakdowns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_services ENABLE ROW LEVEL SECURITY;

-- For now, create permissive policies (update when auth is implemented)
CREATE POLICY "Allow all for development" ON supervisors FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON vehicles FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON breakdowns FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON breakdown_events FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON assessment_logs FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON breakdown_photos FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON depots FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON priority_services FOR ALL USING (true);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active breakdowns view
CREATE VIEW active_breakdowns AS
SELECT 
    b.*,
    v.fleet_number,
    v.registration,
    s.name as supervisor_name,
    s.badge_number
FROM breakdowns b
LEFT JOIN vehicles v ON b.vehicle_id = v.id
LEFT JOIN supervisors s ON b.supervisor_id = s.id
WHERE b.status != 'cleared'
ORDER BY b.received_at DESC;

-- Fleet health view
CREATE VIEW fleet_health AS
SELECT 
    v.*,
    COUNT(DISTINCT b.id) as breakdown_count_30d,
    AVG(b.total_minutes) as avg_breakdown_minutes
FROM vehicles v
LEFT JOIN breakdowns b ON v.id = b.vehicle_id 
    AND b.created_at > NOW() - INTERVAL '30 days'
GROUP BY v.id;

-- =====================================================
-- MOCK DATA INSERTION (Remove for production)
-- =====================================================

-- Insert test supervisor
INSERT INTO supervisors (badge_number, name, email, depot) VALUES
    ('AG003', 'Anthony Gair', 'anthony.gair@gonortheast.co.uk', 'WAS');

-- Insert sample vehicles
INSERT INTO vehicles (fleet_number, registration, make, model, year, depot) 
SELECT 
    '70' || LPAD(generate_series::text, 3, '0'),
    'NK' || (10 + generate_series) || ' GNE',
    'Volvo',
    'B5TL',
    2020,
    CASE 
        WHEN generate_series % 6 = 0 THEN 'WAS'
        WHEN generate_series % 6 = 1 THEN 'NCL'
        WHEN generate_series % 6 = 2 THEN 'GTS'
        WHEN generate_series % 6 = 3 THEN 'DAR'
        WHEN generate_series % 6 = 4 THEN 'HEX'
        ELSE 'CON'
    END
FROM generate_series(1, 50);
