# Breakdown Analytics Integration Fix

## Problem
The Fleet Breakdown Analytics dashboard was showing "0 records" because completed breakdown guide wizards weren't recording data to the analytics system.

## Root Cause
The breakdown guide had two separate systems:
1. `SupervisorBreakdownLogger` - Logs assessments for audit trail
2. `BreakdownAnalytics` - Stores data for the analytics dashboard

These systems weren't connected, so completed wizards were logged but not appearing in analytics.

## Solution

### Files Created/Modified

1. **breakdown-analytics-integration.js** - Integration layer that:
   - Overrides `completeAssessment` to also call `BreakdownAnalytics.recordBreakdown()`
   - Ensures fleet number and depot are properly recorded
   - Syncs supervisor session between both systems
   - Provides `syncExistingAssessments()` to import historical data

2. **breakdown-dashboard-provider.js** - Dashboard data provider that:
   - Transforms breakdown data for the analytics dashboard
   - Provides summary statistics and charts data
   - Exports data to CSV format
   - Supports real-time updates with auto-refresh

3. **index.html** - Updated to load both integration scripts

## How It Works

### Data Flow
1. Supervisor completes a breakdown wizard assessment
2. `SupervisorBreakdownLogger.completeAssessment()` is called
3. Integration layer intercepts and also calls `BreakdownAnalytics.recordBreakdown()`
4. Data is stored in localStorage for the analytics dashboard
5. Dashboard provider makes data available to the Fleet Breakdown Analytics page

### Testing the Fix

1. **Clear browser cache and reload the breakdown guide**
   ```javascript
   // In browser console:
   window.testBreakdownIntegration()
   ```

2. **Complete a test wizard assessment**:
   - Login as supervisor
   - Select a vehicle (e.g., fleet 5804)
   - Complete any wizard (e.g., brakes, steering)
   - Submit the assessment

3. **Check if data is recorded**:
   ```javascript
   // In browser console:
   window.BreakdownDashboardData.hasData() // Should return true
   window.BreakdownDashboardData.getDashboardSummary() // Shows statistics
   ```

4. **View in Analytics Dashboard**:
   - Navigate to Fleet Breakdown Analytics
   - Should now show breakdown records instead of "0 records"

## Manual Data Sync

If you have existing assessments that need to be imported:

```javascript
// In browser console on breakdown guide page:
window.syncExistingAssessments()
```

This will import any previously completed assessments into the analytics system.

## Data Export

To export breakdown data as CSV:

```javascript
// In browser console:
window.BreakdownDashboardData.downloadCSV()
```

## Dashboard Integration

The Fleet Breakdown Analytics dashboard can now access data via:

```javascript
// Get all breakdown records
const records = window.BreakdownDashboardData.getBreakdownRecords();

// Get summary statistics
const summary = window.BreakdownDashboardData.getDashboardSummary();

// Get chart data
const charts = window.BreakdownDashboardData.getChartData();

// Check for patterns
const patterns = window.BreakdownDashboardData.getPatterns('5804', 'Gateshead Riverside');
```

## Real-time Updates

The dashboard can listen for new breakdowns:

```javascript
window.addEventListener('breakdown-recorded', (event) => {
    console.log('New breakdown:', event.detail);
    // Update dashboard UI
});
```

Or use auto-refresh:

```javascript
window.BreakdownDashboardData.startAutoRefresh((data) => {
    // Update dashboard with new data
    console.log('Updated data:', data);
}, 5000); // Refresh every 5 seconds
```

## Verification

After implementation, the Fleet Breakdown Analytics dashboard should show:
- Total breakdowns count > 0
- Vehicles affected
- Safety critical incidents
- Amber warnings
- Continue decisions
- Breakdown charts by depot and category
- Vehicle reliability worst performers list

## Troubleshooting

If data still doesn't appear:

1. **Check localStorage**:
   ```javascript
   localStorage.getItem('gobarry_breakdowns')
   ```

2. **Verify integration is loaded**:
   ```javascript
   window.BreakdownAnalytics // Should exist
   window.SupervisorBreakdownLogger // Should exist
   window.BreakdownDashboardData // Should exist
   ```

3. **Test recording manually**:
   ```javascript
   window.BreakdownAnalytics.recordBreakdown(
     'brakes',
     { fleetNumber: '5804', depot: 'Gateshead Riverside' },
     'STOP'
   );
   ```

4. **Clear and restart**:
   ```javascript
   window.BreakdownAnalytics.clearAllData();
   // Then complete a new assessment
   ```
