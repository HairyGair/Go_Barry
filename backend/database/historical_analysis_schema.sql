-- Historical Analysis System for Go BARRY
-- Supabase Schema

-- Historical incidents/disruptions table
CREATE TABLE IF NOT EXISTS historical_disruptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  disruption_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('incident', 'roadwork', 'event')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  
  -- Location data
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_description TEXT,
  
  -- Impact data
  affected_routes TEXT[], -- Array of route numbers
  affected_route_count INTEGER DEFAULT 0,
  
  -- Time data
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Business period (calculated field)
  business_period INTEGER,
  business_year INTEGER,
  
  -- Supervisor data
  created_by VARCHAR(10),
  handled_by VARCHAR(10)[],
  
  -- Metadata
  source VARCHAR(50), -- 'tomtom', 'manual', 'streetmanager', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_disruption_time ON historical_disruptions(start_time, end_time);
CREATE INDEX idx_disruption_type ON historical_disruptions(type);
CREATE INDEX idx_disruption_period ON historical_disruptions(business_period, business_year);
CREATE INDEX idx_disruption_routes ON historical_disruptions USING GIN(affected_routes);

-- Business periods lookup table
CREATE TABLE IF NOT EXISTS business_periods (
  id SERIAL PRIMARY KEY,
  period_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  UNIQUE(period_number, year)
);

-- Period summaries table (pre-calculated for performance)
CREATE TABLE IF NOT EXISTS period_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Summary statistics
  total_disruptions INTEGER DEFAULT 0,
  total_incidents INTEGER DEFAULT 0,
  total_roadworks INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  
  -- Duration stats
  avg_duration_minutes DOUBLE PRECISION,
  max_duration_minutes INTEGER,
  total_disruption_minutes INTEGER,
  
  -- Route impact
  most_affected_route VARCHAR(10),
  most_affected_route_count INTEGER,
  unique_routes_affected INTEGER,
  
  -- Time patterns
  peak_hour INTEGER, -- 0-23
  peak_day_of_week INTEGER, -- 1-7
  
  -- Severity stats
  avg_severity DOUBLE PRECISION,
  critical_count INTEGER, -- severity >= 8
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(period_number, year)
);

-- Route impact summary table
CREATE TABLE IF NOT EXISTS route_impact_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_number VARCHAR(10) NOT NULL,
  period_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Impact metrics
  disruption_count INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  avg_duration_minutes DOUBLE PRECISION,
  max_severity INTEGER,
  
  -- Pattern data
  most_common_hour INTEGER,
  most_common_location TEXT,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(route_number, period_number, year)
);

-- Function to calculate business period from date
CREATE OR REPLACE FUNCTION get_business_period(input_date DATE)
RETURNS TABLE(period INTEGER, year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT period_number, business_periods.year
  FROM business_periods
  WHERE input_date BETWEEN start_date AND end_date
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update business period on insert
CREATE OR REPLACE FUNCTION update_business_period()
RETURNS TRIGGER AS $$
DECLARE
  period_info RECORD;
BEGIN
  SELECT * INTO period_info FROM get_business_period(NEW.start_time::DATE);
  NEW.business_period := period_info.period;
  NEW.business_year := period_info.year;
  NEW.affected_route_count := array_length(NEW.affected_routes, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_business_period
BEFORE INSERT OR UPDATE ON historical_disruptions
FOR EACH ROW
EXECUTE FUNCTION update_business_period();

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_disruption_timestamp
BEFORE UPDATE ON historical_disruptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- View for current period disruptions
CREATE OR REPLACE VIEW current_period_disruptions AS
SELECT *
FROM historical_disruptions
WHERE (business_period, business_year) = (
  SELECT period_number, year
  FROM business_periods
  WHERE CURRENT_DATE BETWEEN start_date AND end_date
  LIMIT 1
);

-- Sample business periods for 2025 (4-week periods)
-- Based on Go North East Accounting Calendar FY 2025
INSERT INTO business_periods (period_number, year, start_date, end_date) VALUES
(1, 2025, '2025-01-05', '2025-02-01'),  -- Period 1: Jan 5 - Feb 1
(2, 2025, '2025-02-02', '2025-03-01'),  -- Period 2: Feb 2 - Mar 1
(3, 2025, '2025-03-02', '2025-03-29'),  -- Period 3: Mar 2 - Mar 29
(4, 2025, '2025-03-30', '2025-04-26'),  -- Period 4: Mar 30 - Apr 26
(5, 2025, '2025-04-27', '2025-05-24'),  -- Period 5: Apr 27 - May 24
(6, 2025, '2025-05-25', '2025-06-21'),  -- Period 6: May 25 - Jun 21
(7, 2025, '2025-06-22', '2025-07-19'),  -- Period 7: Jun 22 - Jul 19
(8, 2025, '2025-07-20', '2025-08-16'),  -- Period 8: Jul 20 - Aug 16
(9, 2025, '2025-08-17', '2025-09-13'),  -- Period 9: Aug 17 - Sep 13
(10, 2025, '2025-09-14', '2025-10-11'), -- Period 10: Sep 14 - Oct 11
(11, 2025, '2025-10-12', '2025-11-08'), -- Period 11: Oct 12 - Nov 8
(12, 2025, '2025-11-09', '2025-12-06'), -- Period 12: Nov 9 - Dec 6
(13, 2025, '2025-12-07', '2026-01-03'); -- Period 13: Dec 7 - Jan 3 (2026)
