-- backend/sql/breakdowns_schema.sql
-- Create breakdowns table for logging vehicle breakdown incidents

-- Create the breakdowns table
CREATE TABLE IF NOT EXISTS breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id TEXT NOT NULL,
    vehicle_reg TEXT NOT NULL,
    fleet_no TEXT NOT NULL,
    breakdown_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_timestamp ON breakdowns(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor ON breakdowns(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_vehicle_reg ON breakdowns(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX IF NOT EXISTS idx_breakdowns_type ON breakdowns(breakdown_type);

-- Optional: Add a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_breakdowns_vehicle_composite ON breakdowns(vehicle_reg, fleet_no);

-- Add comments for documentation
COMMENT ON TABLE breakdowns IS 'Stores all vehicle breakdown incidents reported through Go BARRY wizards';
COMMENT ON COLUMN breakdowns.id IS 'Unique identifier for the breakdown record';
COMMENT ON COLUMN breakdowns.supervisor_id IS 'Badge ID of the supervisor who confirmed the breakdown';
COMMENT ON COLUMN breakdowns.vehicle_reg IS 'Registration number of the vehicle';
COMMENT ON COLUMN breakdowns.fleet_no IS 'Fleet number of the vehicle';
COMMENT ON COLUMN breakdowns.breakdown_type IS 'Type of breakdown (e.g., Steering, Brakes, Battery, etc.)';
COMMENT ON COLUMN breakdowns.timestamp IS 'When the breakdown was reported';
COMMENT ON COLUMN breakdowns.created_at IS 'When the record was created in the database';

-- Grant permissions (if using RLS, though you mentioned no RLS required)
-- ALTER TABLE breakdowns ENABLE ROW LEVEL SECURITY;

-- Example data for testing (optional - uncomment to insert test data)
/*
INSERT INTO breakdowns (supervisor_id, vehicle_reg, fleet_no, breakdown_type, timestamp)
VALUES 
    ('SUP001', 'ABC123', 'FL001', 'Steering', NOW() - INTERVAL '1 hour'),
    ('SUP002', 'DEF456', 'FL002', 'Battery', NOW() - INTERVAL '2 hours'),
    ('SUP001', 'GHI789', 'FL003', 'Brakes', NOW() - INTERVAL '3 hours'),
    ('SUP003', 'JKL012', 'FL004', 'Doors', NOW() - INTERVAL '4 hours'),
    ('SUP002', 'MNO345', 'FL005', 'Overheating', NOW() - INTERVAL '5 hours'),
    ('SUP001', 'PQR678', 'FL006', 'Non-Starter', NOW() - INTERVAL '6 hours'),
    ('SUP003', 'STU901', 'FL007', 'Wipers', NOW() - INTERVAL '7 hours'),
    ('SUP002', 'VWX234', 'FL008', 'ABS Light', NOW() - INTERVAL '8 hours'),
    ('SUP001', 'YZA567', 'FL009', 'Suspension', NOW() - INTERVAL '9 hours'),
    ('SUP003', 'BCD890', 'FL010', 'Exterior Lights', NOW() - INTERVAL '10 hours');
*/
