# Breakdown Logging System - Implementation Complete

## Overview
The breakdown logging system has been successfully added to the Go BARRY backend. This system logs vehicle breakdowns reported through the various wizards and provides an admin interface to view the logs.

## Files Created

### Backend Routes
1. **`/backend/routes/breakdownLogger.js`**
   - POST `/api/breakdowns/log` - Logs new breakdown incidents
   - GET `/api/breakdowns/recent` - Gets recent breakdowns (optional)

2. **`/backend/routes/adminBreakdowns.js`**
   - GET `/api/admin-breakdowns` - Fetches all breakdown logs with filtering
   - GET `/api/admin-breakdowns/stats` - Gets breakdown statistics

### Database Schema
3. **`/backend/sql/breakdowns_schema.sql`**
   - Creates the `breakdowns` table
   - Adds necessary indexes for performance
   - Includes documentation comments

### Backend Integration
4. **Updated `/backend/index.js`**
   - Added route registration for breakdown logger at `/api/breakdowns`
   - Added route registration for admin breakdowns at `/api/admin-breakdowns`

## API Endpoints

### Logging a Breakdown
```bash
POST /api/breakdowns/log
Content-Type: application/json

{
  "supervisorId": "SUP001",
  "vehicleReg": "ABC123",
  "fleetNo": "FL001",
  "breakdownType": "Steering",
  "timestamp": "2025-01-10T10:30:00Z"  // Optional, defaults to current time
}
```

### Fetching Breakdown Logs (Admin)
```bash
GET /api/admin-breakdowns?limit=50&offset=0&supervisorId=SUP001&breakdownType=Steering&startDate=2025-01-01&endDate=2025-01-31
```

### Getting Breakdown Statistics
```bash
GET /api/admin-breakdowns/stats?startDate=2025-01-01&endDate=2025-01-31
```

## Setup Instructions

### 1. Create Database Table
Run the SQL schema in Supabase:
```bash
# Navigate to Supabase dashboard
# Go to SQL Editor
# Copy and paste contents of /backend/sql/breakdowns_schema.sql
# Execute the query
```

### 2. Deploy Backend
The backend routes are already integrated. Just deploy as usual:
```bash
git add .
git commit -m "Add breakdown logging system"
git push
```

### 3. Frontend Integration

#### Update BreakdownLogs Component
The admin component should fetch from the correct endpoint:
```javascript
// In BreakdownLogs.jsx, update the fetch URL:
const response = await fetch(`/api/admin-breakdowns?${queryParams}`);
```

#### Add to Each Wizard
In each wizard component where a breakdown is confirmed:
```javascript
await window.logBreakdown({
    supervisorId: window.AppConstants.currentSupervisor,
    vehicleReg: window.selectedReg,
    fleetNo: window.selectedFleetNo,
    breakdownType: 'Steering', // Change based on wizard type
    timestamp: new Date().toISOString()
});
```

## Testing

### Test Logging
```javascript
// From browser console:
await fetch('/api/breakdowns/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        supervisorId: 'TEST001',
        vehicleReg: 'TEST123',
        fleetNo: 'FL999',
        breakdownType: 'Steering'
    })
});
```

### Test Fetching Logs
```javascript
// From browser console:
const response = await fetch('/api/admin-breakdowns');
const data = await response.json();
console.log('Breakdown logs:', data);
```

## Breakdown Types Supported
Based on the SDC Guide:
- Steering
- Brakes
- Loose Wheel Nuts
- Battery
- ABS Light
- Oil Warning Light
- Warning Lights
- Doors
- Gearbox
- Gear Selection
- Non-Starter
- Suspension
- Ramp Stuck
- Overheating
- Low Water
- Fuel Problem
- Excessive Smoke
- Wipers/Screenwash
- Demisters/Heaters
- Exterior Lights
- Interior Lights
- Wing Mirrors
- Broken Windows
- Interior Damage
- Exterior Damage
- Puncture
- Buzzers Sounding
- Speedo Not Working
- Road Traffic Incident
- Repeat Defect

## Notes
- No authentication middleware is applied to these routes currently
- If you need admin-only access, add the `requireAdmin` middleware
- The system uses UUID for record IDs
- All timestamps are stored in UTC
- The frontend components still need to be created and integrated
