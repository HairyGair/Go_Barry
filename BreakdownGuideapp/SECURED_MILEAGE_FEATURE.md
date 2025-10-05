# Secured Mileage Feature

## Overview
Added a "Secured Mileage" checkbox to the Fleet Selection Modal in breakdown wizards. This captures critical business information about whether a breakdown is occurring on contracted/secured mileage work.

## Why This Matters
Secured mileage refers to contracted work that the company **must** fulfill. If not fulfilled, the company could face contractual fines. This checkbox ensures supervisors can flag these critical breakdowns immediately during the assessment process.

## Changes Made

### Frontend Changes

#### 1. FleetSelectionModal.jsx
**File:** `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx`

**Added:**
- State management for `securedMileage` checkbox
- Prominent checkbox UI in the route selection step with orange highlighting when checked
- Visual "CRITICAL" badge when secured mileage is checked
- Auto-save to draft storage
- Data passed through all location selection handlers

**UI Features:**
- Checkbox appears after vehicle and route selection
- Orange border and background when checked (vs gray when unchecked)
- Clear explanation text: "This vehicle is operating contracted work. Failure to fulfill secured mileage may result in fines."
- Persistent across modal steps and draft restoration

#### 2. App.jsx
**File:** `/frontend/src/breakdown-guide/App.jsx`

**Updated:**
- `handleFleetSelection` function to extract and log `securedMileage` from vehicle data
- Passes `securedMileage` to `supervisorBreakdownLogger.startBreakdown()`

#### 3. supervisorBreakdownLogger.js
**File:** `/frontend/src/breakdown-guide/supervisorBreakdownLogger.js`

**Updated:**
- `completeAssessment` function now includes `secured_mileage` in the wizard data payload sent to the backend
- Reads from `this.currentBreakdown.securedMileage`

### Backend Changes

#### 1. Breakdown Routes
**File:** `/backend/routes/breakdowns.js`

**Updated:**
- `/from-wizard` POST endpoint now accepts `secured_mileage` parameter (defaults to `false`)
- Includes `secured_mileage` in the breakdown data object sent to Supabase

#### 2. Database Migration
**File:** `/backend/migrations/add_secured_mileage_column.sql`

**Created:**
- Adds `secured_mileage` BOOLEAN column to `breakdowns` table (defaults to `false`)
- Creates index for filtering secured mileage breakdowns
- Adds column comment explaining the field's purpose

## Database Schema

### New Column
```sql
ALTER TABLE breakdowns
ADD COLUMN secured_mileage BOOLEAN DEFAULT false;
```

### Index
```sql
CREATE INDEX IF NOT EXISTS idx_breakdowns_secured_mileage
ON breakdowns(secured_mileage)
WHERE secured_mileage = true;
```

## Deployment Instructions

### 1. Run Database Migration
Connect to your Supabase dashboard and run the migration:

```bash
# Navigate to Supabase SQL Editor
# Execute: /backend/migrations/add_secured_mileage_column.sql
```

Or run directly:
```sql
psql [your-supabase-connection-string] -f backend/migrations/add_secured_mileage_column.sql
```

### 2. Deploy Backend
The backend changes are backward compatible (defaults to `false`), so you can deploy immediately:

```bash
git add backend/routes/breakdowns.js
git commit -m "feat: Add secured mileage tracking to breakdowns"
git push breakdown main
```

### 3. Deploy Frontend
```bash
git add frontend/src/breakdown-guide/
git commit -m "feat: Add secured mileage checkbox to fleet modal"
git push breakdown main
```

## Data Flow

1. **User Selection:** Supervisor checks "Secured Mileage" in the Fleet Selection Modal (route step)
2. **State Management:** `securedMileage` boolean stored in modal state
3. **Vehicle Data:** Included in complete vehicle object when location is selected
4. **App Context:** `handleFleetSelection` extracts and passes to breakdown logger
5. **Breakdown Logger:** Stored in `currentBreakdown.securedMileage`
6. **Backend Submission:** Sent as `secured_mileage` field in `/from-wizard` POST
7. **Database:** Stored as `secured_mileage` BOOLEAN in `breakdowns` table

## Testing

### Manual Testing Steps
1. Open breakdown wizard
2. Select a vehicle
3. Select a route
4. Check the "Secured Mileage" checkbox
5. Verify orange highlighting appears
6. Verify "CRITICAL" badge shows
7. Select a location
8. Complete the wizard
9. Check the backend logs to confirm `secured_mileage: true`
10. Verify in Supabase that the breakdown record has `secured_mileage = true`

### Test Cases
- [ ] Checkbox appears in route selection step
- [ ] Checkbox can be checked/unchecked
- [ ] Visual styling changes when checked
- [ ] State persists when navigating between steps
- [ ] State persists in draft restoration
- [ ] Data included in breakdown submission
- [ ] Database correctly stores the value

## Future Enhancements

### Recommended Dashboard Improvements
1. **SDC Dashboard Filter:** Add filter to show only secured mileage breakdowns
2. **Priority Indicator:** Visual badge on breakdown cards showing secured mileage status
3. **Analytics:** Track percentage of breakdowns on secured mileage
4. **Alerts:** Notify management when secured mileage breakdowns occur
5. **Reporting:** Generate compliance reports for secured mileage fulfillment

### Possible UI Enhancements
1. Auto-set higher priority for secured mileage breakdowns
2. Add warning dialog if trying to close secured mileage breakdown without resolution
3. Track replacement vehicle assignment for secured mileage routes
4. Show secured mileage status in breakdown timeline

## Files Modified

### Frontend
- `/frontend/src/breakdown-guide/components/FleetSelectionModal.jsx`
- `/frontend/src/breakdown-guide/App.jsx`
- `/frontend/src/breakdown-guide/supervisorBreakdownLogger.js`

### Backend
- `/backend/routes/breakdowns.js`

### Database
- `/backend/migrations/add_secured_mileage_column.sql` (new)

### Documentation
- `/SECURED_MILEAGE_FEATURE.md` (this file)

## Support
For questions or issues, contact Anthony Gair at anthony@gobarry.co.uk

---
**Last Updated:** October 5, 2025
**Feature Version:** 1.0
**Status:** Ready for deployment
