-- ETA Request Pop-up System Database Migration
-- Run this in Supabase SQL Editor
-- Created: January 2025

-- Create ETA requests table
CREATE TABLE IF NOT EXISTS eta_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breakdown_id VARCHAR(50) REFERENCES breakdowns(breakdown_id),
    requested_by VARCHAR(10), -- SDC operator badge
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    urgency_level VARCHAR(20) DEFAULT 'normal', -- normal, urgent, critical
    notes TEXT,
    
    -- Response fields
    responded_by VARCHAR(10), -- Engineer badge
    responded_at TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    response_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, responded, cancelled
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_eta_breakdown ON eta_requests(breakdown_id);
CREATE INDEX idx_eta_status ON eta_requests(status);
CREATE INDEX idx_eta_requested_at ON eta_requests(requested_at);

-- Add ETA tracking columns to breakdowns table
ALTER TABLE breakdowns 
ADD COLUMN IF NOT EXISTS eta_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS eta_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS engineer_eta TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS engineer_assigned VARCHAR(10);

-- Create view for active ETA requests
CREATE OR REPLACE VIEW active_eta_requests AS
SELECT 
    er.*,
    b.fleet_no,
    b.location,
    b.depot_id,
    b.route_id,
    b.supervisor_badge,
    b.severity,
    EXTRACT(EPOCH FROM (NOW() - er.requested_at))/60 AS minutes_waiting
FROM eta_requests er
JOIN breakdowns b ON er.breakdown_id = b.breakdown_id
WHERE er.status = 'pending'
AND b.status != 'resolved'
ORDER BY 
    CASE er.urgency_level 
        WHEN 'critical' THEN 1
        WHEN 'urgent' THEN 2
        ELSE 3
    END,
    er.requested_at;

-- Create function to auto-escalate old ETA requests
CREATE OR REPLACE FUNCTION escalate_old_eta_requests()
RETURNS void AS $$
BEGIN
    -- Escalate normal to urgent after 10 minutes
    UPDATE eta_requests
    SET urgency_level = 'urgent'
    WHERE status = 'pending'
    AND urgency_level = 'normal'
    AND requested_at < NOW() - INTERVAL '10 minutes';
    
    -- Escalate urgent to critical after 20 minutes
    UPDATE eta_requests
    SET urgency_level = 'critical'
    WHERE status = 'pending'
    AND urgency_level = 'urgent'
    AND requested_at < NOW() - INTERVAL '20 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate ETA response
CREATE OR REPLACE FUNCTION validate_eta_response()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'responded' AND NEW.estimated_arrival IS NULL THEN
        RAISE EXCEPTION 'Cannot mark as responded without providing estimated arrival time';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_eta_response
BEFORE UPDATE ON eta_requests
FOR EACH ROW
WHEN (NEW.status = 'responded')
EXECUTE FUNCTION validate_eta_response();

-- Grant permissions
GRANT ALL ON eta_requests TO authenticated;
GRANT ALL ON active_eta_requests TO authenticated;