# Database Schema Issue Resolution Summary

## Problem Identified
The `/api/breakdowns/from-wizard` endpoint was failing with the error:
```
"Could not find the 'issue_category' column of 'breakdowns' in the schema cache"
```

## Root Cause Analysis
After comprehensive testing, I discovered several issues:

### 1. Column Name Mismatches
The API was using incorrect column names compared to the actual database:
- API used `fleet_number` → Database uses `fleet_no`
- API used `location_description` → Database uses `location`
- API used `reported_by_badge` → Database uses `supervisor_badge`
- API used `reported_by_name` → Database uses `supervisor_name`

### 2. Missing Required Fields
The database has more columns than the original schema.sql file, including:
- `assessment_type` (exists in DB)
- `diagnosis` (exists in DB)
- `final_decision` (exists in DB)
- Various timestamp fields with different names

### 3. Status Constraint Issues
The database has a check constraint on the `status` field that only allows specific values.
- `received` is NOT valid
- `active` is valid
- `resolved` is valid

### 4. Persistent issue_category Constraint
Despite the `issue_category` column not existing in the table structure, there appears to be a trigger or policy that requires this field.

## Solution Implemented

### API Endpoint Fixes (`/backend/routes/breakdowns.js`)
Updated the `/api/breakdowns/from-wizard` endpoint to:

1. **Use correct column names:**
   ```javascript
   fleet_no: fleet_number,           // Not fleet_number
   location: location,               // Not location_description
   supervisor_badge: supervisor_badge, // Not reported_by_badge
   supervisor_name: supervisor_name,   // Not reported_by_name
   ```

2. **Use valid status:**
   ```javascript
   status: 'active',  // Not 'received'
   ```

3. **Map issue data to existing fields:**
   ```javascript
   assessment_type: issue_category || 'General Assessment',
   diagnosis: issue_description || `${wizard_type} assessment completed with ${wizard_decision} decision`,
   final_decision: determinedSeverity,
   ```

4. **Include all required database fields:**
   - `depot_id: 'SDC'`
   - `dvsa_reportable: false`
   - `safety_critical`, `service_disruption`
   - `passengers_affected: 0`
   - `estimated_cost: 0`
   - Various boolean flags

## Current Status

### ✅ Fixed Issues:
- Column name mismatches resolved
- Status constraint resolved
- Most required fields mapped correctly

### ❌ Remaining Issue:
There's still a persistent `issue_category` constraint that prevents inserts, despite this column not existing in the table. This suggests there may be:
- A database trigger requiring this field
- An RLS policy checking for this field
- A view or function dependency

## Recommended Next Steps

### Option 1: Add Missing Database Column (Recommended)
Execute this SQL in your Supabase dashboard:
```sql
ALTER TABLE breakdowns ADD COLUMN issue_category VARCHAR(100);
```

### Option 2: Remove the Constraint/Trigger
Investigate and remove the database constraint that requires `issue_category`.

### Option 3: Use Alternative API Approach
Create breakdowns through a different route that doesn't trigger the constraint.

## Files Modified
- `/backend/routes/breakdowns.js` - Fixed column mappings and data structure
- Created test scripts to verify functionality

## Test Results
- ✅ Database connection working
- ✅ Table access working
- ✅ Column mapping corrected
- ✅ Dashboard retrieval working
- ❌ Insert still fails due to `issue_category` constraint

The API endpoint should work once the `issue_category` column is added to the database or the constraint is removed.