-- Breakdown Tracker Database Schema
-- Tracks end-to-end breakdown response times by stage and depot
-- Part of Go BARRY Breakdown Guide Enhancement

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create breakdowns table (header row for each breakdown)
CREATE TABLE IF NOT EXISTS breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT NOT NULL,
    depot_id TEXT NOT NULL CHECK (depot_id IN ('Washington', 'Riverside', 'Percy Main', 'Consett', 'Deptford', 'Hexham')),
    route_id TEXT,
    service_number TEXT,
    location TEXT,
    supervisor_badge TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE', 'PENDING')),
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving', 'cleared')),
    wizard_type TEXT, -- Links to breakdown guide assessment type
    assessment_id UUID, -- Links to breakdown assessment if applicable
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Receipt time
    closed_at TIMESTAMPTZ, -- Cleared time
    total_duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN closed_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (closed_at - created_at)) / 60
            ELSE NULL
        END
    ) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create breakdown_events table (immutable event log) - MUST exist before views
CREATE TABLE IF NOT EXISTS breakdown_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id UUID NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('received', 'acknowledged', 'decision', 'engineer_dispatched', 'on_site', 'moving', 'cleared', 'note')),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    by_badge TEXT NOT NULL,
    by_name TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure breakdown_events has breakdown_id column before adding foreign key
DO $$
BEGIN
    -- Add breakdown_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'breakdown_id'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN breakdown_id UUID NOT NULL DEFAULT gen_random_uuid();
    END IF;
    
    -- Add foreign key constraint after ensuring column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'breakdown_events_breakdown_id_fkey' 
        AND table_name = 'breakdown_events'
    ) THEN
        ALTER TABLE breakdown_events 
        ADD CONSTRAINT breakdown_events_breakdown_id_fkey 
        FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id) ON DELETE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    -- Ensure both vehicle_id and vehicle_reg exist for compatibility
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'vehicle_id'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN vehicle_id TEXT;
        -- Backfill from vehicle_reg if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'vehicle_reg'
        ) THEN
            UPDATE breakdowns SET vehicle_id = vehicle_reg WHERE vehicle_id IS NULL;
        END IF;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'vehicle_reg'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN vehicle_reg TEXT;
        -- Backfill from vehicle_id if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'vehicle_id'
        ) THEN
            UPDATE breakdowns SET vehicle_reg = vehicle_id WHERE vehicle_reg IS NULL;
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    -- Ensure depot_id exists and backfill from possible legacy columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'depot_id'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN depot_id TEXT;
    END IF;
    -- Backfill from legacy columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'depot'
    ) THEN
        EXECUTE 'UPDATE breakdowns SET depot_id = COALESCE(depot_id, depot)';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'depot_name'
    ) THEN
        EXECUTE 'UPDATE breakdowns SET depot_id = COALESCE(depot_id, depot_name) WHERE depot_id IS NULL';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'depot_code'
    ) THEN
        EXECUTE 'UPDATE breakdowns SET depot_id = COALESCE(depot_id, depot_code) WHERE depot_id IS NULL';
    END IF;
END
$$;

DO $$
BEGIN
    -- Ensure route_id exists; backfill from likely legacy columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'route_id'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN route_id TEXT;
        -- Backfill from service_number if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'service_number'
        ) THEN
            EXECUTE 'UPDATE breakdowns SET route_id = COALESCE(route_id, service_number)';
        END IF;
        -- Backfill from possible legacy "route" column if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'route'
        ) THEN
            EXECUTE 'UPDATE breakdowns SET route_id = COALESCE(route_id, route)';
        END IF;
    END IF;
    -- Ensure service_number exists; backfill from likely sources
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'service_number'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN service_number TEXT;
        -- Backfill from route_id if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'route_id'
        ) THEN
            EXECUTE 'UPDATE breakdowns SET service_number = COALESCE(service_number, route_id)';
        END IF;
        -- Backfill from possible legacy "route" column if present
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'breakdowns' AND column_name = 'route'
        ) THEN
            EXECUTE 'UPDATE breakdowns SET service_number = COALESCE(service_number, route)';
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    -- Ensure all required columns exist before creating views
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'severity'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN severity TEXT CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE', 'PENDING')) DEFAULT 'PENDING';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'status'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'acknowledged', 'decision', 'dispatched', 'on_site', 'moving', 'cleared'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'location'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'supervisor_badge'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN supervisor_badge TEXT NOT NULL DEFAULT 'UNKNOWN';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'wizard_type'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN wizard_type TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'assessment_id'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN assessment_id UUID;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdowns' AND column_name = 'total_duration_minutes'
    ) THEN
        ALTER TABLE breakdowns ADD COLUMN total_duration_minutes INTEGER GENERATED ALWAYS AS (
            CASE 
                WHEN closed_at IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (closed_at - created_at)) / 60
                ELSE NULL
            END
        ) STORED;
    END IF;
END
$$;

-- Ensure breakdown_events has all required columns for backward compatibility
DO $$
BEGIN
    -- Add breakdown_id if missing (handled above but double-check)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'breakdown_id'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN breakdown_id UUID;
    END IF;
    
    -- Add event_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'event_type'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'note' CHECK (event_type IN ('received', 'acknowledged', 'decision', 'engineer_dispatched', 'on_site', 'moving', 'cleared', 'note'));
    END IF;
    
    -- Add occurred_at if missing (shouldn't happen but for safety)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'occurred_at'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    
    -- Add by_badge if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'by_badge'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN by_badge TEXT NOT NULL DEFAULT 'UNKNOWN';
    END IF;
    
    -- Add by_name if missing (already in CREATE TABLE above but for existing tables)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'by_name'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN by_name TEXT;
    END IF;
    
    -- Add metadata if missing (already in CREATE TABLE above but for existing tables)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN metadata JSONB;
    END IF;
    
    -- Add notes if missing (already in CREATE TABLE above but for existing tables)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'notes'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN notes TEXT;
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'breakdown_events' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE breakdown_events ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END
$$;

-- Create breakdown_stage_durations view for KPI calculation
CREATE OR REPLACE VIEW breakdown_stage_durations AS
WITH stage_times AS (
    SELECT 
        b.id,
        COALESCE(b.vehicle_id, b.vehicle_reg) AS vehicle_id,
        b.depot_id AS depot_id,
        b.route_id,
        b.severity,
        b.created_at as receipt_time,
        b.closed_at as clear_time,
        -- Get timestamps for each stage
        (SELECT MIN(occurred_at) FROM breakdown_events WHERE breakdown_id = b.id AND event_type = 'acknowledged') as acknowledged_time,
        (SELECT MIN(occurred_at) FROM breakdown_events WHERE breakdown_id = b.id AND event_type = 'decision') as decision_time,
        (SELECT MIN(occurred_at) FROM breakdown_events WHERE breakdown_id = b.id AND event_type = 'engineer_dispatched') as dispatched_time,
        (SELECT MIN(occurred_at) FROM breakdown_events WHERE breakdown_id = b.id AND event_type = 'on_site') as on_site_time,
        (SELECT MIN(occurred_at) FROM breakdown_events WHERE breakdown_id = b.id AND event_type = 'moving') as moving_time
    FROM breakdowns b
)
SELECT 
    id,
    vehicle_id,
    depot_id,
    route_id,
    severity,
    receipt_time,
    clear_time,
    -- Calculate stage durations in minutes
    EXTRACT(EPOCH FROM (acknowledged_time - receipt_time)) / 60 as receipt_to_acknowledge_minutes,
    EXTRACT(EPOCH FROM (decision_time - COALESCE(acknowledged_time, receipt_time))) / 60 as acknowledge_to_decision_minutes,
    EXTRACT(EPOCH FROM (on_site_time - COALESCE(dispatched_time, decision_time))) / 60 as dispatch_to_onsite_minutes,
    EXTRACT(EPOCH FROM (moving_time - COALESCE(on_site_time, decision_time))) / 60 as onsite_to_moving_minutes,
    EXTRACT(EPOCH FROM (clear_time - receipt_time)) / 60 as receipt_to_clear_minutes,
    -- Include raw timestamps
    acknowledged_time,
    decision_time,
    dispatched_time,
    on_site_time,
    moving_time
FROM stage_times;

-- Create depot_kpi_summary view for league table
CREATE OR REPLACE VIEW depot_kpi_summary AS
WITH depot_stats AS (
    SELECT 
        depot_id,
        COUNT(*) as total_breakdowns,
        -- Receipt to Acknowledge
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY receipt_to_acknowledge_minutes) as receipt_ack_median,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY receipt_to_acknowledge_minutes) as receipt_ack_p90,
        -- Acknowledge to Decision
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY acknowledge_to_decision_minutes) as ack_decision_median,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY acknowledge_to_decision_minutes) as ack_decision_p90,
        -- Dispatch to On Site
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dispatch_to_onsite_minutes) as dispatch_onsite_median,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY dispatch_to_onsite_minutes) as dispatch_onsite_p90,
        -- Receipt to Clear (End-to-end)
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY receipt_to_clear_minutes) as receipt_clear_median,
        PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY receipt_to_clear_minutes) as receipt_clear_p90,
        -- SLA compliance (using initial targets)
        COUNT(*) FILTER (WHERE receipt_to_acknowledge_minutes <= 2) * 100.0 / NULLIF(COUNT(*), 0) as receipt_ack_sla_pct,
        COUNT(*) FILTER (WHERE acknowledge_to_decision_minutes <= 5) * 100.0 / NULLIF(COUNT(*), 0) as ack_decision_sla_pct,
        COUNT(*) FILTER (WHERE dispatch_to_onsite_minutes <= 30) * 100.0 / NULLIF(COUNT(*) FILTER (WHERE dispatch_to_onsite_minutes IS NOT NULL), 0) as dispatch_onsite_sla_pct,
        COUNT(*) FILTER (WHERE receipt_to_clear_minutes <= 90) * 100.0 / NULLIF(COUNT(*), 0) as receipt_clear_sla_pct
    FROM breakdown_stage_durations
    WHERE receipt_time >= NOW() - INTERVAL '30 days' -- Last 30 days
    GROUP BY depot_id
)
SELECT 
    depot_id,
    total_breakdowns,
    ROUND(receipt_ack_median::numeric, 1) as receipt_ack_median,
    ROUND(receipt_ack_p90::numeric, 1) as receipt_ack_p90,
    ROUND(ack_decision_median::numeric, 1) as ack_decision_median,
    ROUND(ack_decision_p90::numeric, 1) as ack_decision_p90,
    ROUND(dispatch_onsite_median::numeric, 1) as dispatch_onsite_median,
    ROUND(dispatch_onsite_p90::numeric, 1) as dispatch_onsite_p90,
    ROUND(receipt_clear_median::numeric, 1) as receipt_clear_median,
    ROUND(receipt_clear_p90::numeric, 1) as receipt_clear_p90,
    ROUND(receipt_ack_sla_pct::numeric, 1) as receipt_ack_sla_pct,
    ROUND(ack_decision_sla_pct::numeric, 1) as ack_decision_sla_pct,
    ROUND(dispatch_onsite_sla_pct::numeric, 1) as dispatch_onsite_sla_pct,
    ROUND(receipt_clear_sla_pct::numeric, 1) as receipt_clear_sla_pct,
    -- Overall score (weighted average of SLA percentages)
    ROUND(
        (receipt_ack_sla_pct * 0.2 + 
         ack_decision_sla_pct * 0.2 + 
         COALESCE(dispatch_onsite_sla_pct, 100) * 0.2 + 
         receipt_clear_sla_pct * 0.4)::numeric, 
    1) as overall_score
FROM depot_stats
ORDER BY overall_score DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breakdowns_depot_id ON breakdowns(depot_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_status ON breakdowns(status);
CREATE INDEX IF NOT EXISTS idx_breakdowns_created_at ON breakdowns(created_at);
CREATE INDEX IF NOT EXISTS idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
CREATE INDEX IF NOT EXISTS idx_breakdown_events_breakdown_id ON breakdown_events(breakdown_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_events_event_type ON breakdown_events(event_type);
CREATE INDEX IF NOT EXISTS idx_breakdown_events_occurred_at ON breakdown_events(occurred_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_breakdowns_updated_at BEFORE UPDATE ON breakdowns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to get active breakdowns with live timers
CREATE OR REPLACE FUNCTION get_active_breakdowns()
RETURNS TABLE (
    id UUID,
    vehicle_id TEXT,
    depot_id TEXT,
    route_id TEXT,
    location TEXT,
    severity TEXT,
    status TEXT,
    supervisor_badge TEXT,
    created_at TIMESTAMPTZ,
    minutes_elapsed INTEGER,
    last_event_type TEXT,
    last_event_time TIMESTAMPTZ,
    last_event_by TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        COALESCE(b.vehicle_id, b.vehicle_reg) AS vehicle_id,
        b.depot_id AS depot_id,
        b.route_id,
        b.location,
        b.severity,
        b.status,
        b.supervisor_badge,
        b.created_at,
        (EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60)::INTEGER as minutes_elapsed,
        le.event_type as last_event_type,
        le.occurred_at as last_event_time,
        le.by_badge as last_event_by
    FROM breakdowns b
    LEFT JOIN LATERAL (
        SELECT event_type, occurred_at, by_badge
        FROM breakdown_events
        WHERE breakdown_id = b.id
        ORDER BY occurred_at DESC
        LIMIT 1
    ) le ON true
    WHERE b.status != 'cleared'
    ORDER BY b.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE breakdowns IS 'Header records for vehicle breakdowns with lifecycle tracking';
COMMENT ON TABLE breakdown_events IS 'Immutable event log for breakdown lifecycle stages';
COMMENT ON VIEW breakdown_stage_durations IS 'Calculated stage durations for KPI analysis';
COMMENT ON VIEW depot_kpi_summary IS 'Depot performance league table with SLA compliance metrics';