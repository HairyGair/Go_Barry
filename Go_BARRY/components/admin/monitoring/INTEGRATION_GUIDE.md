# TomTom API Rate Limit Management Integration Guide

## Overview
We've created a TomTom API usage monitoring system that tracks API calls and provides visual warnings when approaching daily limits.

## Components Created

### 1. Frontend Component
**Location**: `/Go_BARRY/components/admin/monitoring/TomTomUsageMonitor.jsx`

Features:
- Real-time usage display for all TomTom APIs
- Color-coded progress bars (green → orange → red)
- Warning alerts at 75% usage
- Critical alerts at 90% usage
- Automatic recommendations
- 5-minute auto-refresh

### 2. Backend API
**Location**: `/backend/routes/tomtomUsageAPI.js`

Endpoints:
- `GET /api/tomtom/usage` - Get current usage stats (admin only)
- `POST /api/tomtom/usage/reset` - Manual reset (admin only)
- `GET /api/tomtom/usage/history` - Historical data (future feature)

Features:
- Automatic daily reset at midnight
- In-memory tracking (survives restarts with reset)
- Usage increment function for integration

## Integration Steps

### 1. Import the Component
In your Admin Dashboard or Admin Panel:

```javascript
import TomTomUsageMonitor from './monitoring/TomTomUsageMonitor';

// In your render:
<TomTomUsageMonitor />
```

### 2. Register the API Route
In `/backend/index.js`, add:

```javascript
import tomtomUsageAPI from './routes/tomtomUsageAPI.js';

// After other route registrations:
app.use('/api/tomtom', tomtomUsageAPI);
```

### 3. Track API Usage
In any service that calls TomTom APIs, add:

```javascript
import { incrementTomTomUsage } from '../routes/tomtomUsageAPI.js';

// After making a TomTom API call:
incrementTomTomUsage('traffic'); // for traffic API
incrementTomTomUsage('search'); // for geocoding/search
incrementTomTomUsage('routing'); // for routing API
incrementTomTomUsage('reverseGeocode'); // for reverse geocoding
```

## Usage Tracking Integration Points

### TomTom Enhanced Service
In `/backend/services/tomtom-enhanced.js`, after each API call:

```javascript
// After traffic API call
incrementTomTomUsage('traffic');

// After geocoding
incrementTomTomUsage('search');
```

### TomTom Enhancement Service  
In `/backend/services/tomtomEnhancementService.js`, after each API call:

```javascript
// After geocoding
incrementTomTomUsage('search');

// After reverse geocoding
incrementTomTomUsage('reverseGeocode');

// After routing
incrementTomTomUsage('routing');
```

## Visual Features

1. **Progress Bars**
   - Green (0-49%): Healthy usage
   - Orange (50-74%): Normal usage
   - Amber (75-89%): Warning - monitor closely
   - Red (90-100%): Critical - immediate action needed

2. **Alerts**
   - Warning icon appears at 75%
   - Critical alert box at 90%
   - Shows exact remaining calls

3. **Recommendations**
   - Automatic suggestions based on usage patterns
   - Advises on caching, queuing, and fallbacks

## Admin Features

1. **Manual Reset**
   - Admin can reset counters if needed
   - Useful for testing or emergencies

2. **Access Control**
   - Only AG003 and BP009 can view usage
   - Integrated with supervisor auth system

## Future Enhancements

1. **Historical Data**
   - Store daily usage in Supabase
   - Show usage trends over time
   - Predict when limits will be hit

2. **Email Alerts**
   - Send email when usage hits 80%
   - Daily summary emails

3. **Auto-Throttling**
   - Automatically slow down requests at 80%
   - Queue non-critical requests

## Testing

1. Make some TomTom API calls
2. Check `/api/tomtom/usage` endpoint
3. View in Admin Dashboard
4. Verify color changes and alerts

## Notes

- Usage resets daily at midnight (server time)
- Counters are in-memory (will reset on server restart)
- Each API has a 2,500 calls/day limit
- Monitor shows all 4 TomTom APIs we use
