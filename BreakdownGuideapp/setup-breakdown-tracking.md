# Breakdown Wizard to Dashboard Integration Setup

## Overview

This implementation creates a comprehensive system to capture breakdown information from assessment wizards and display them as cards on both the SDC Dashboard and Engineering Dashboard.

## What Was Implemented

### 1. Enhanced Database Schema

**File**: `database/migrations/004_enhance_breakdown_tracking.sql`

- **Enhanced breakdowns table** with wizard-specific fields:
  - `wizard_type` - Type of wizard used (SteeringWizard, BrakesWizard, etc.)
  - `wizard_decision` - Assessment result (STOP, AMBER, CONTINUE)
  - `wizard_assessment_data` - Complete assessment data in JSONB format
  - `fleet_number` - Direct fleet number reference
  - `reported_by_badge/name` - Supervisor information
  - `duration_minutes` - Breakdown duration tracking
  - `priority_level` - 1-5 priority scale
  - Location and timing enhancements

- **New breakdown_wizard_sessions table** for tracking wizard progress
- **New breakdown_dashboard_cards table** for dashboard display management
- **Enhanced views** (`sdc_dashboard_breakdowns`, `active_breakdowns_enhanced`)
- **Automatic triggers** to create dashboard cards when breakdowns are created

### 2. API Enhancements

**File**: `backend/routes/breakdowns.js`

- **Enhanced `/api/breakdowns/live`** endpoint to use new database views
- **New `/api/breakdowns/from-wizard`** endpoint for wizard integration
- **New `/api/breakdowns/dashboard/cards`** endpoint for dashboard-specific data
- **New `/api/breakdowns/:breakdown_id/update-card`** endpoint for card management

### 3. Wizard Integration Updates

**File**: `frontend/src/breakdown-guide/components/WizardTrackerIntegration.jsx`

- **Updated createBreakdownFromWizard()** to use new API endpoint
- **Added helper methods**:
  - `getIssueCategoryFromWizard()` - Maps wizard types to issue categories
  - `generateIssueDescription()` - Creates detailed issue descriptions
  - `requiresEngineering()` - Determines if engineering is needed
  - `summarizeResponses()` - Extracts key findings from wizard responses

### 4. Dashboard Card Enhancements

**File**: `frontend/src/dashboards/sdc/SDCBreakdownCard.jsx`

- **Enhanced information display**:
  - Issue type from wizard assessment
  - Duration with visual highlighting
  - Assessment result with color coding (STOP=red, AMBER=amber, CONTINUE=green)
  - Better supervisor and depot information

- **New CSS styling** for severity indicators and duration highlighting

### 5. Dashboard Integration

Both SDC Dashboard and Engineering Dashboard automatically benefit from:
- Enhanced breakdown data with wizard information
- Better categorization and priority handling
- Improved duration tracking and display
- Automatic card creation from wizard assessments

## Required Information Captured

✅ **Location of breakdown** - From wizard location input and GPS coordinates
✅ **Duration of breakdown** - Automatically calculated from creation time
✅ **Issue type/category** - Mapped from wizard type (e.g., "Steering System", "Braking System")
✅ **Fleet number** - From wizard vehicle input
✅ **Supervisor information** - Badge and name from session
✅ **Assessment result** - STOP/AMBER/CONTINUE decision
✅ **Assessment details** - Complete wizard responses stored as JSONB
✅ **Priority level** - Auto-calculated based on severity
✅ **Engineering requirements** - Auto-determined based on wizard type and responses

## How It Works

1. **Wizard Completion**: When a supervisor completes any breakdown wizard:
   - `WizardTrackerIntegration.handleWizardCompletion()` is called
   - Data is sent to `/api/breakdowns/from-wizard`
   - A breakdown record is created with all wizard data
   - A dashboard card is automatically generated

2. **Dashboard Display**:
   - SDC Dashboard calls `/api/breakdowns/live` every 5 seconds
   - Data is formatted with enhanced information from wizards
   - Cards show issue type, duration, assessment result, and priority
   - Engineering Dashboard gets the same enhanced data

3. **Real-time Updates**:
   - Dashboard cards update automatically as breakdown status changes
   - Priority and criticality are calculated in real-time
   - Duration tracking updates continuously

## Setup Instructions

1. **Run Database Migration**:
   ```sql
   -- Execute in Supabase SQL editor or via psql
   \i database/migrations/004_enhance_breakdown_tracking.sql
   ```

2. **Verify API Integration**:
   - Test `/api/breakdowns/live` endpoint
   - Ensure wizards are calling the integration correctly

3. **Test Wizard Flow**:
   - Complete a breakdown wizard with STOP or AMBER decision
   - Verify breakdown appears on dashboards
   - Check that all required information is displayed

## Key Features

- **Automatic Integration**: No manual intervention needed
- **Comprehensive Data**: All wizard assessment data is preserved
- **Smart Categorization**: Issue types automatically mapped from wizard types
- **Priority Handling**: Critical issues (STOP decisions) get highest priority
- **Engineering Dispatch**: System automatically flags when engineering is required
- **Real-time Display**: Dashboard updates immediately after wizard completion
- **Historical Tracking**: Complete audit trail of all wizard assessments

## Compatibility

- ✅ Works with all existing breakdown wizards
- ✅ Backward compatible with existing dashboard code
- ✅ Uses existing authentication and session management
- ✅ Integrates with existing engineering dispatch system
- ✅ Maintains existing API contracts