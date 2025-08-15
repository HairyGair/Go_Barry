# ✅ Breakdown Guide → Dashboard Connection Status

## YES, IT'S NOW FULLY CONNECTED! 

Every wizard completed in the Breakdown Guide will now appear in the dashboard with:
- Sequential ID (BD-2025-00001 format)
- Timer showing minutes since diagnosis
- Real-time updates every 5 seconds
- Full tracking from start to resolution

## How It Works

### 1. When a Wizard Starts
```javascript
User selects wizard → Enter fleet number → System calls:
  ↓
/api/breakdowns/start
  ↓
Creates breakdown record with:
- Sequential ID (BD-2025-00001)
- Daily counter
- Timestamp
- Supervisor details
```

### 2. During the Wizard
```javascript
Each step → Logged to backend
Each decision → Tracked with timestamp
```

### 3. When Wizard Completes
```javascript
Diagnosis complete → /api/breakdowns/diagnose
  ↓
Sets severity (STOP/AMBER/CONTINUE)
Starts timer
Shows in dashboard
```

### 4. Dashboard Display
```javascript
Dashboard polls every 5 seconds → /api/breakdowns/live
Shows all active breakdowns with:
- Fleet number
- Time since diagnosis
- Severity color coding
- Resolve button
```

## Files That Make This Work

### Frontend (Breakdown Guide)
1. **`App.js`** - Main application
   - `handleWizardSelect()` - Starts breakdown tracking
   - `handleComplete()` - Completes diagnosis

2. **`supervisorBreakdownLogger.js`** - Enhanced logger
   - `startAssessment()` - Calls API to create breakdown
   - `completeWizardDiagnosis()` - Sets severity

3. **`breakdown-tracking-helper.js`** - Helper utilities
   - `startBreakdownTracking()` - Simple API wrapper
   - `completeDiagnosis()` - Finish with severity

### Backend (API)
1. **`breakdownTrackerV2.js`** - All endpoints
   - `POST /api/breakdowns/start` - Create breakdown
   - `POST /api/breakdowns/diagnose` - Complete diagnosis
   - `GET /api/breakdowns/live` - Get active breakdowns

### Dashboard
1. **`breakdown-dashboard-enhanced.html`** - Live view
   - Fetches from `/api/breakdowns/live`
   - Auto-refreshes every 5 seconds
   - Shows timers and allows resolution

## Testing the Connection

### Quick Test
```bash
./test-wizard-to-dashboard.sh
```

### Manual Test
1. Open Breakdown Guide
2. Login as supervisor (AG003)
3. Start any wizard (e.g., Steering)
4. Enter fleet number (6301)
5. Complete the wizard
6. Open dashboard in another tab
7. ✅ Your breakdown appears with timer!

## What Each Wizard Completion Creates

When you complete a wizard, this record is created:
```json
{
  "breakdown_id": "uuid-here",
  "daily_id": "BD-2025-00023",
  "fleet_no": "6301",
  "depot_id": "RIV",
  "supervisor_badge": "AG003",
  "supervisor_name": "Anthony Gair",
  "wizard_type": "steering",
  "status": "diagnosed",
  "severity": "AMBER",
  "diagnosis": "Steering play detected - proceed to depot",
  "diagnosed_at": "2025-01-27T10:30:00Z",
  "minutes_since_diagnosis": 5,
  "is_priority": false,
  "repeat_breakdown": false
}
```

## Features Working

✅ **Sequential IDs** - BD-2025-00001, BD-2025-00002, etc.
✅ **Daily Counter** - Resets at 1am
✅ **Pattern Detection** - Warns if 3+ breakdowns in 7 days
✅ **Timers** - Start when diagnosis complete
✅ **Auto-refresh** - Dashboard updates every 5 seconds
✅ **Passenger Cloud** - Modal for STOP decisions
✅ **Resolution** - Can resolve from dashboard
✅ **Filters** - My/Critical/Overdue/Priority

## Common Issues & Solutions

### Breakdown not appearing in dashboard?
1. Check browser console for errors
2. Verify supervisor is logged in
3. Ensure wizard was completed (not just started)
4. Check network tab for API calls

### Timer not starting?
- Timer starts only after diagnosis is complete
- Must reach the final step of wizard

### Passenger Cloud modal not showing?
- Only appears for STOP severity decisions
- Check that severity is being set correctly

## API Endpoints

All working and tested:
- `POST /api/breakdowns/start` ✅
- `POST /api/breakdowns/step` ✅
- `POST /api/breakdowns/diagnose` ✅
- `PUT /api/breakdowns/:id/resolve` ✅
- `GET /api/breakdowns/live` ✅
- `GET /api/breakdowns/today` ✅

## Verification

Run this command to see current live breakdowns:
```bash
curl https://go-barry.onrender.com/api/breakdowns/live | jq
```

## Summary

**YES, the connection is complete!** Every wizard assessment in the Breakdown Guide now:
1. Creates a tracked breakdown with sequential ID
2. Logs all steps and decisions
3. Appears in the live dashboard
4. Shows timer from diagnosis
5. Can be resolved from dashboard

The system is fully integrated and ready for production use.
