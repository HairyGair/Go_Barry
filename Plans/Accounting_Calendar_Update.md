# Go North East Accounting Calendar Integration
*Updated: January 2025*

## Overview
The Historical Analysis System has been updated to use Go North East's official accounting calendar for FY 2025, ensuring business period reports align with company financial reporting.

## FY 2025 Business Periods

| Period | Start Date | End Date | Weeks |
|--------|------------|----------|-------|
| 1 | Sun, Jan 5, 2025 | Sat, Feb 1, 2025 | 4 |
| 2 | Sun, Feb 2, 2025 | Sat, Mar 1, 2025 | 4 |
| 3 | Sun, Mar 2, 2025 | Sat, Mar 29, 2025 | 4 |
| 4 | Sun, Mar 30, 2025 | Sat, Apr 26, 2025 | 4 |
| 5 | Sun, Apr 27, 2025 | Sat, May 24, 2025 | 4 |
| 6 | Sun, May 25, 2025 | Sat, Jun 21, 2025 | 4 |
| 7 | Sun, Jun 22, 2025 | Sat, Jul 19, 2025 | 4 |
| 8 | Sun, Jul 20, 2025 | Sat, Aug 16, 2025 | 4 |
| 9 | Sun, Aug 17, 2025 | Sat, Sep 13, 2025 | 4 |
| 10 | Sun, Sep 14, 2025 | Sat, Oct 11, 2025 | 4 |
| 11 | Sun, Oct 12, 2025 | Sat, Nov 8, 2025 | 4 |
| 12 | Sun, Nov 9, 2025 | Sat, Dec 6, 2025 | 4 |
| 13 | Sun, Dec 7, 2025 | Sat, Jan 3, 2026 | 4 |

## Key Features
- All periods are exactly 4 weeks (28 days)
- Periods run Sunday to Saturday
- Period 13 extends into the following calendar year
- FY 2025 runs from January 5, 2025 to January 3, 2026

## Implementation Details

### Database Update
The `business_periods` table has been populated with the exact dates from the accounting calendar, replacing the generic 4-week calculations.

### API Updates
- `/api/historical/current-period` - Now returns the correct period based on actual calendar dates
- `/api/historical/quick-stats` - Uses proper period boundaries for statistics

### Automatic Period Assignment
All historical disruptions are automatically assigned to the correct business period based on their start date.

## Benefits
- Reports align with financial reporting periods
- Directors can correlate disruption data with financial performance
- Consistent period definitions across all Go North East systems
- Accurate year-over-year comparisons

## SQL to Update Existing Data
If you have existing disruption data that needs to be reassigned to the correct periods:

```sql
-- Update existing disruptions to correct business periods
UPDATE historical_disruptions hd
SET 
  business_period = bp.period_number,
  business_year = bp.year
FROM business_periods bp
WHERE hd.start_time::date BETWEEN bp.start_date AND bp.end_date;
```

## Testing
To verify the current period is correct:
```bash
curl https://go-barry.onrender.com/api/historical/current-period
```

Should return the period that matches today's date according to the accounting calendar.
