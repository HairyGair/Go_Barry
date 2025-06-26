# Go BARRY Weather API - Working Hours Configuration

## Overview
The weather API has been configured with working hours to optimize API usage and prevent unnecessary calls during off-hours when the control room display is not being monitored.

## Working Hours
- **Active Period**: 06:00 - 00:15 (6 AM to 12:15 AM)
- **Inactive Period**: 00:16 - 05:59 (12:16 AM to 5:59 AM)
- **Duration**: 18.25 hours per day

## Benefits

### API Usage Reduction
- **Before Working Hours**: ~336 calls/day (24/7 operation)
- **With Working Hours**: ~252 calls/day (18.25 hour operation)
- **Savings**: 24% reduction in API calls
- **Safety Margin**: Now using only 28% of daily limit (was 37%)

### Cost Optimization
- No weather updates during night shift when control room is unmanned
- Preserves API quota for peak operational hours
- Reduces server processing during quiet hours

## How It Works

1. **Time Check**: Before any API call, system checks current time
2. **Working Hours**: If between 06:00-00:15, API calls proceed normally
3. **Off Hours**: If between 00:16-05:59, returns cached or mock data
4. **Cache Strategy**: 30-minute cache ensures fresh data during working hours

## Monitoring

Check the current status:
```bash
# One-time check
node monitor-weather-api.js

# Continuous monitoring
node monitor-weather-api.js --watch
```

API Status Endpoint:
```
https://go-barry.onrender.com/api/weather/status
```

## Expected Daily Pattern

- **06:00**: Weather service activates, fetches fresh data
- **06:00-00:15**: Normal operation with 30-minute cache intervals
- **00:15**: Last API call of the day
- **00:16-05:59**: No API calls, returns cached/mock data
- **Daily Reset**: Call counter resets at midnight

## Configuration

To adjust working hours, modify in `weatherService.js`:
```javascript
this.workingHoursStart = 6;    // 6 AM
this.workingHoursEnd = 0.25;   // 12:15 AM (0.25 = 15 minutes past midnight)
```

## Fallback Behavior

During off-hours or when API limit reached:
1. First attempts to return cached data (if available)
2. Falls back to mock data with realistic values
3. Display continues to function normally
4. Weather updates resume when working hours begin

## Display Screen Behavior

The display screen has been updated to:
- Only fetch weather during working hours
- Log when skipping fetches outside hours
- Continue showing last known data during off-hours
- Automatically resume updates at 06:00

This ensures the control room display remains functional 24/7 while optimizing API usage for actual operational needs.
