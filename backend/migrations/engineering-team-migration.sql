-- Engineering Team Management Tables
-- Run this in Supabase SQL Editor

-- 1. Engineers table
CREATE TABLE IF NOT EXISTS engineers (
    engineer_id TEXT PRIMARY KEY,
    badge_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    depot_id TEXT NOT NULL,
    specializations TEXT[], -- ['electrical', 'mechanical', 'bodywork', 'diagnostic']
    status TEXT DEFAULT 'available', -- available, busy, off_duty, break
    current_job_id TEXT,
    shift_start TIME,
    shift_end TIME,
    phone TEXT,
    last_location TEXT,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Engineer assignments table
CREATE TABLE IF NOT EXISTS engineer_assignments (
    assignment_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    breakdown_id TEXT NOT NULL,
    engineer_id TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ,
    arrival_at TIMESTAMPTZ,
    started_repair_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    travel_time_minutes INTEGER,
    repair_time_minutes INTEGER,
    total_time_minutes INTEGER,
    status TEXT DEFAULT 'assigned', -- assigned, dispatched, travelling, on_site, repairing, completed, cancelled
    notes TEXT,
    parts_used JSONB,
    tracerit_job_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (engineer_id) REFERENCES engineers(engineer_id)
);

-- 3. Engineer shifts table
CREATE TABLE IF NOT EXISTS engineer_shifts (
    shift_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    engineer_id TEXT NOT NULL,
    depot_id TEXT NOT NULL,
    shift_date DATE NOT NULL,
    scheduled_start TIME NOT NULL,
    scheduled_end TIME NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled', -- scheduled, active, completed, absent
    breakdowns_handled INTEGER DEFAULT 0,
    avg_response_time INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (engineer_id) REFERENCES engineers(engineer_id)
);

-- 4. Engineering performance metrics table
CREATE TABLE IF NOT EXISTS engineering_metrics (
    metric_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    depot_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_breakdowns INTEGER DEFAULT 0,
    avg_response_time_minutes INTEGER,
    avg_repair_time_minutes INTEGER,
    sla_met INTEGER DEFAULT 0,
    sla_breached INTEGER DEFAULT 0,
    sla_percentage DECIMAL(5,2),
    engineers_on_duty INTEGER,
    peak_hour INTEGER,
    peak_breakdowns INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(depot_id, date)
);

-- 5. Add engineering columns to breakdowns table
ALTER TABLE breakdowns 
ADD COLUMN IF NOT EXISTS assigned_engineer_id TEXT,
ADD COLUMN IF NOT EXISTS assignment_id TEXT,
ADD COLUMN IF NOT EXISTS engineering_eta TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS actual_arrival_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS repair_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS repair_complete_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS repair_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS total_downtime_minutes INTEGER,
ADD COLUMN IF NOT EXISTS parts_required JSONB,
ADD COLUMN IF NOT EXISTS tracerit_job_number TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_engineers_depot ON engineers(depot_id);
CREATE INDEX IF NOT EXISTS idx_engineers_status ON engineers(status);
CREATE INDEX IF NOT EXISTS idx_assignments_breakdown ON engineer_assignments(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_assignments_engineer ON engineer_assignments(engineer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON engineer_assignments(status);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON engineer_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_engineer ON engineer_shifts(engineer_id);
CREATE INDEX IF NOT EXISTS idx_metrics_depot_date ON engineering_metrics(depot_id, date);

-- Create trigger to update breakdown status when engineer assigned
CREATE OR REPLACE FUNCTION update_breakdown_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE breakdowns 
    SET 
        assigned_engineer_id = NEW.engineer_id,
        assignment_id = NEW.assignment_id,
        status = CASE 
            WHEN NEW.status = 'dispatched' THEN 'dispatched'
            WHEN NEW.status = 'on_site' THEN 'on_site'
            WHEN NEW.status = 'repairing' THEN 'on_site'
            ELSE status
        END,
        updated_at = NOW()
    WHERE breakdown_id = NEW.breakdown_id;
    
    -- Update engineer status
    UPDATE engineers
    SET 
        status = 'busy',
        current_job_id = NEW.breakdown_id,
        updated_at = NOW()
    WHERE engineer_id = NEW.engineer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_breakdown_on_assignment
AFTER INSERT OR UPDATE ON engineer_assignments
FOR EACH ROW
EXECUTE FUNCTION update_breakdown_on_assignment();

-- Sample engineers data (Go North East depots)
INSERT INTO engineers (engineer_id, badge_number, name, depot_id, specializations, shift_start, shift_end, phone) VALUES
-- Washington Depot
('eng-001', 'WAS001', 'John Smith', 'WASHINGTON', ARRAY['mechanical', 'diagnostic'], '06:00', '14:00', '07700900001'),
('eng-002', 'WAS002', 'Mike Johnson', 'WASHINGTON', ARRAY['electrical', 'diagnostic'], '06:00', '14:00', '07700900002'),
('eng-003', 'WAS003', 'Dave Wilson', 'WASHINGTON', ARRAY['mechanical', 'bodywork'], '14:00', '22:00', '07700900003'),
('eng-004', 'WAS004', 'Paul Brown', 'WASHINGTON', ARRAY['electrical'], '14:00', '22:00', '07700900004'),
('eng-005', 'WAS005', 'Steve Davis', 'WASHINGTON', ARRAY['mechanical', 'diagnostic'], '22:00', '06:00', '07700900005'),

-- Riverside Depot
('eng-006', 'RIV001', 'Tom Anderson', 'RIVERSIDE', ARRAY['mechanical', 'diagnostic'], '06:00', '14:00', '07700900006'),
('eng-007', 'RIV002', 'Chris Martin', 'RIVERSIDE', ARRAY['electrical'], '06:00', '14:00', '07700900007'),
('eng-008', 'RIV003', 'Andy Taylor', 'RIVERSIDE', ARRAY['mechanical', 'bodywork'], '14:00', '22:00', '07700900008'),
('eng-009', 'RIV004', 'Mark Evans', 'RIVERSIDE', ARRAY['diagnostic'], '14:00', '22:00', '07700900009'),

-- Percy Main Depot
('eng-010', 'PM001', 'James White', 'PERCY_MAIN', ARRAY['mechanical', 'electrical'], '06:00', '14:00', '07700900010'),
('eng-011', 'PM002', 'Rob Green', 'PERCY_MAIN', ARRAY['diagnostic'], '06:00', '14:00', '07700900011'),
('eng-012', 'PM003', 'Ian Black', 'PERCY_MAIN', ARRAY['mechanical'], '14:00', '22:00', '07700900012'),
('eng-013', 'PM004', 'Gary Hughes', 'PERCY_MAIN', ARRAY['electrical', 'bodywork'], '14:00', '22:00', '07700900013'),

-- Consett Depot
('eng-014', 'CON001', 'Neil Roberts', 'CONSETT', ARRAY['mechanical', 'diagnostic'], '06:00', '14:00', '07700900014'),
('eng-015', 'CON002', 'Simon Clark', 'CONSETT', ARRAY['electrical'], '06:00', '14:00', '07700900015'),
('eng-016', 'CON003', 'Peter Lewis', 'CONSETT', ARRAY['mechanical'], '14:00', '22:00', '07700900016'),
('eng-017', 'CON004', 'Alan Walker', 'CONSETT', ARRAY['bodywork'], '14:00', '22:00', '07700900017'),

-- Deptford Depot
('eng-018', 'DEP001', 'Kevin Hall', 'DEPTFORD', ARRAY['mechanical', 'electrical'], '06:00', '14:00', '07700900018'),
('eng-019', 'DEP002', 'Brian King', 'DEPTFORD', ARRAY['diagnostic'], '06:00', '14:00', '07700900019'),
('eng-020', 'DEP003', 'Colin Wright', 'DEPTFORD', ARRAY['mechanical', 'bodywork'], '14:00', '22:00', '07700900020'),

-- Hexham Depot
('eng-021', 'HEX001', 'George Hill', 'HEXHAM', ARRAY['mechanical', 'electrical'], '06:00', '14:00', '07700900021'),
('eng-022', 'HEX002', 'Frank Moore', 'HEXHAM', ARRAY['diagnostic', 'bodywork'], '14:00', '22:00', '07700900022')
ON CONFLICT (engineer_id) DO NOTHING;

-- Create today's shifts for all engineers
INSERT INTO engineer_shifts (engineer_id, depot_id, shift_date, scheduled_start, scheduled_end, status)
SELECT 
    engineer_id,
    depot_id,
    CURRENT_DATE,
    shift_start,
    shift_end,
    CASE 
        WHEN CURRENT_TIME BETWEEN shift_start AND shift_end THEN 'active'
        ELSE 'scheduled'
    END
FROM engineers
ON CONFLICT DO NOTHING;

-- Function to calculate engineering metrics
CREATE OR REPLACE FUNCTION calculate_engineering_metrics()
RETURNS void AS $$
DECLARE
    depot RECORD;
BEGIN
    FOR depot IN SELECT DISTINCT depot_id FROM engineers LOOP
        INSERT INTO engineering_metrics (
            depot_id,
            date,
            total_breakdowns,
            avg_response_time_minutes,
            avg_repair_time_minutes,
            sla_met,
            sla_breached,
            sla_percentage,
            engineers_on_duty
        )
        SELECT 
            depot.depot_id,
            CURRENT_DATE,
            COUNT(DISTINCT b.breakdown_id),
            AVG(ea.travel_time_minutes)::INTEGER,
            AVG(ea.repair_time_minutes)::INTEGER,
            COUNT(CASE WHEN ea.travel_time_minutes <= 30 THEN 1 END),
            COUNT(CASE WHEN ea.travel_time_minutes > 30 THEN 1 END),
            CASE 
                WHEN COUNT(ea.assignment_id) > 0 
                THEN (COUNT(CASE WHEN ea.travel_time_minutes <= 30 THEN 1 END)::DECIMAL / COUNT(ea.assignment_id) * 100)
                ELSE 100
            END,
            COUNT(DISTINCT e.engineer_id)
        FROM engineers e
        LEFT JOIN engineer_assignments ea ON e.engineer_id = ea.engineer_id 
            AND DATE(ea.assigned_at) = CURRENT_DATE
        LEFT JOIN breakdowns b ON ea.breakdown_id = b.breakdown_id
        WHERE e.depot_id = depot.depot_id
        GROUP BY depot.depot_id
        ON CONFLICT (depot_id, date) DO UPDATE SET
            total_breakdowns = EXCLUDED.total_breakdowns,
            avg_response_time_minutes = EXCLUDED.avg_response_time_minutes,
            avg_repair_time_minutes = EXCLUDED.avg_repair_time_minutes,
            sla_met = EXCLUDED.sla_met,
            sla_breached = EXCLUDED.sla_breached,
            sla_percentage = EXCLUDED.sla_percentage,
            engineers_on_duty = EXCLUDED.engineers_on_duty;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run initial metrics calculation
SELECT calculate_engineering_metrics();

-- Grant permissions
GRANT ALL ON engineers TO authenticated;
GRANT ALL ON engineer_assignments TO authenticated;
GRANT ALL ON engineer_shifts TO authenticated;
GRANT ALL ON engineering_metrics TO authenticated;