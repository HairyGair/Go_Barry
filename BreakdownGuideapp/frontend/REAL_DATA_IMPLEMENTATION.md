# 🚀 Connect Real Breakdown Data - Implementation Guide

## Overview
Your system is already set up to create real breakdowns when assessments are completed. The dashboards just need to fetch and display this real data instead of using mock/test data.

## What's Happening:
1. **Assessment Completion** → Creates real breakdown via `/api/breakdowns/from-wizard` ✅
2. **Backend Storage** → Stores breakdowns in database
3. **Dashboards** → Fetch and display real breakdowns (fixed now) ✅

## Files to Replace:

### 1. Replace Breakdown Dashboard
```bash
# Backup current file
mv src/dashboards/breakdown/BreakdownDashboard.jsx src/dashboards/breakdown/BreakdownDashboard-OLD.jsx

# Use the real data version
mv src/dashboards/breakdown/BreakdownDashboard-REAL.jsx src/dashboards/breakdown/BreakdownDashboard.jsx
```

### 2. Replace Engineering Dashboard  
```bash
# Backup current file
mv src/dashboards/engineering/EngineeringDashboard.jsx src/dashboards/engineering/EngineeringDashboard-OLD.jsx

# Use the real data version
mv src/dashboards/engineering/EngineeringDashboard-REAL.jsx src/dashboards/engineering/EngineeringDashboard.jsx
```

### 3. Replace SDC Dashboard
```bash
# Backup current file
mv src/dashboards/sdc/SDCDashboard.jsx src/dashboards/sdc/SDCDashboard-OLD.jsx

# Use the real data version
mv src/dashboards/sdc/SDCDashboard-REAL.jsx src/dashboards/sdc/SDCDashboard.jsx
```

## Backend Requirements:

### Check Backend is Running:
1. Visit: https://breakdown-guide.onrender.com/api/health
   - Should return: `{"status":"ok"}`

2. If not running, ensure backend has these endpoints:

### Required API Endpoints:

#### Breakdown Endpoints:
- `POST /api/breakdowns/from-wizard` - Creates breakdown from assessment ✅
- `GET /api/breakdowns/active` - Returns all active breakdowns
- `GET /api/breakdowns/live` - Alternative endpoint for live data
- `PUT /api/breakdowns/:id/resolve` - Mark breakdown as resolved

#### Engineering Endpoints:
- `GET /api/engineering/engineers` - List all engineers
- `GET /api/engineering/depot-stats` - Depot performance stats
- `GET /api/engineering/metrics` - Overall metrics
- `POST /api/engineering/assign` - Assign engineer to breakdown
- `POST /api/engineering/auto-assign` - Auto-assign nearest engineer
- `PUT /api/engineering/assignment/:id/status` - Update engineer status

#### SDC Endpoints:
- `POST /api/sdc/acknowledge` - Acknowledge breakdown receipt
- `POST /api/sdc/decision` - Record SDC decision
- `POST /api/sdc/request-engineering` - Request engineering support

## Data Flow:

### 1. When Assessment Completes:
```javascript
// supervisorBreakdownLogger.js already sends:
POST /api/breakdowns/from-wizard
{
  wizard_type: "Steering",
  wizard_decision: "STOP",
  fleet_number: "5401",
  location: "Newcastle Central Station",
  supervisor_name: "John Smith",
  supervisor_badge: "JS001",
  // ... other fields
}
```

### 2. Backend Creates Breakdown:
```javascript
// Returns:
{
  success: true,
  breakdown: {
    breakdown_id: "BD-2025-00123",
    daily_id: "123",
    status: "active",
    created_at: "2025-09-24T10:30:00Z",
    // ... all breakdown data
  }
}
```

### 3. Dashboards Fetch Real Data:
```javascript
// Every 5-10 seconds:
GET /api/breakdowns/active

// Returns array of real breakdowns:
{
  success: true,
  breakdowns: [
    {
      breakdown_id: "BD-2025-00123",
      fleet_number: "5401",
      wizard_decision: "STOP",
      // ... real breakdown data
    }
  ]
}
```

## Testing Real Data Flow:

### 1. Start Frontend:
```bash
cd frontend
npm run dev
```

### 2. Complete a Test Assessment:
1. Go to http://localhost:3000/breakdown-guide
2. Login as any supervisor
3. Select a vehicle (e.g., fleet 5401)
4. Choose any wizard (e.g., "Steering")
5. Complete the assessment with any decision (STOP/AMBER/CONTINUE)

### 3. Check Dashboards:
1. Open http://localhost:3000/dashboards/breakdown
   - Should show your real breakdown
   - No mock data!

2. Open http://localhost:3000/dashboards/engineering
   - Should show same breakdown from engineering view
   - Can assign engineers

3. Open http://localhost:3000/dashboards/sdc
   - Should show breakdown in SDC format
   - Can acknowledge and make decisions

## What You'll See:

### Real Breakdown Cards Show:
- ✅ Actual breakdown ID (BD-2025-xxxxx)
- ✅ Real fleet number from assessment
- ✅ Actual location entered
- ✅ Real supervisor name
- ✅ Actual wizard decision (STOP/AMBER/CONTINUE)
- ✅ Real timestamps
- ✅ Live activity feed

### No More Mock Data:
- ❌ No fake test breakdowns
- ❌ No simulated timelines
- ❌ No dummy engineer names
- ❌ No artificial delays

## Troubleshooting:

### If No Breakdowns Appear:
1. Check browser console for errors
2. Verify backend is running: https://breakdown-guide.onrender.com/api/health
3. Check Network tab in DevTools - are API calls failing?
4. Ensure CORS is enabled on backend

### If API Calls Fail:
1. Check environment variable: `VITE_API_URL` in .env
2. Should be: `https://breakdown-guide.onrender.com`
3. Restart dev server after changing .env

### If Data Looks Wrong:
1. Check the breakdown was created via assessment (not manual)
2. Ensure all fields were filled during assessment
3. Check backend logs for creation errors

## Success Criteria:

✅ **You'll know it's working when:**
1. Complete an assessment → Breakdown appears in dashboards immediately
2. All data in dashboards matches what you entered in assessment
3. No test/mock data visible anywhere
4. Activity feeds show real events as they happen
5. Engineer assignments update in real-time
6. SLA calculations based on real elapsed time

## Additional Notes:

- Dashboards auto-refresh every 5-10 seconds
- All times are in UTC, displayed in local timezone
- SLA warnings appear after 45 minutes
- SLA breaches after 60 minutes
- Priority routes: X10, X21, 21, 56, 1

## Summary:

Your system already creates real breakdowns! The updated dashboard files now:
1. Fetch real data from `/api/breakdowns/active`
2. Display actual breakdown information
3. Update in real-time as changes occur
4. Show real activity feeds and timelines
5. Calculate real SLA metrics

No more mock data - everything is real and live! 🎉
