-- Update Business Periods to match Go North East Accounting Calendar FY 2025
-- This script handles existing data by deleting and re-inserting

-- First, delete existing 2025 periods if they exist
DELETE FROM business_periods WHERE year = 2025;

-- Now insert the correct periods based on the accounting calendar
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

-- Update any existing historical disruptions to use the new period boundaries
-- This will recalculate their business_period based on the new dates
UPDATE historical_disruptions hd
SET 
  business_period = bp.period_number,
  business_year = bp.year
FROM business_periods bp
WHERE hd.start_time::date BETWEEN bp.start_date AND bp.end_date
  AND bp.year = 2025;

-- Verify the update
SELECT 
  period_number,
  year,
  start_date,
  end_date,
  end_date - start_date + 1 as days,
  to_char(start_date, 'Day') as start_day,
  to_char(end_date, 'Day') as end_day
FROM business_periods 
WHERE year = 2025
ORDER BY period_number;
