# Live Activity Feed Message Improvements

## Overview
Enhanced the Live Activity Feed on the home page to display specific, human-readable activity messages that describe what actions supervisors are taking, replacing generic messages with contextual descriptions.

## Changes Made

### 1. Created Activity Message Formatter (`frontend/src/utils/activityMessageFormatter.js`)

**Purpose**: Centralized message formatting logic for all activity types

**Key Functions**:
- `formatActivityMessage(activity)` - Generates human-readable messages based on activity type
- `getActivitySecondaryDetails(activity)` - Provides additional context (issue type, location, route)
- `getActivityIcon(activity)` - Returns appropriate emoji icons for each activity type
- `formatActivityForDisplay(activity)` - Complete display object with all formatted fields

**Supported Activity Types**:

1. **Breakdown Reported** (`breakdown_reported`, `BREAKDOWN_REPORTED`)
   - Format: `{Supervisor Name} reported a breakdown on {Fleet Number}`
   - Example: "Anthony Gair reported a breakdown on 5801"

2. **Wizard/Assessment Completed** (`wizard_completed`, `WIZARD_COMPLETED`, `ASSESSMENT_COMPLETED`)
   - Format: `{Supervisor Name} made a {DECISION} decision on {Fleet Number}`
   - Example: "Barry Perryman made a STOP decision on 8316"
   - Fallback: `{Supervisor Name} completed a breakdown on {Fleet Number}`

3. **Wizard Started** (`wizard_started`, `WIZARD_STARTED`)
   - Format: `{Supervisor Name} started assessing {Fleet Number}`
   - Example: "James Daglish started assessing 6001"

4. **Engineer Assigned** (`engineer_assigned`, `ENGINEER_ASSIGNED`)
   - Format: `{Supervisor Name} requested an engineer for {Fleet Number}`
   - Example: "Anthony Gair requested an engineer for 5801"

5. **Engineer On Site** (`engineer_on_site`, `ENGINEER_ON_SITE`)
   - Format: `Engineer arrived at {Fleet Number}`
   - Example: "Engineer arrived at 8316"

6. **Breakdown Resolved** (`breakdown_resolved`, `BREAKDOWN_RESOLVED`, `resolved`)
   - Format: `{Supervisor Name} resolved breakdown on {Fleet Number}`
   - Example: "Barry Perryman resolved breakdown on 6001"

7. **SDC Decision** (`sdc_decision`, `SDC_DECISION`)
   - Format: `{Supervisor Name} made SDC decision: {DECISION} on {Fleet Number}`
   - Example: "SDC made SDC decision: STOP on 5801"

8. **Breakdown Acknowledged** (`acknowledged`, `breakdown_acknowledged`)
   - Format: `{Supervisor Name} acknowledged breakdown {Breakdown ID}`
   - Example: "Anthony Gair acknowledged breakdown BD-2025-00007"

### 2. Updated Activity Aggregator (`frontend/src/api/activityAggregator.js`)

**Changes**:
- Imported `formatActivityMessage` and `getActivityIcon` from the formatter
- Updated unified activities processing to use formatter for messages and icons
- Updated legacy fallback to use formatter for consistent messaging
- Ensured all activity fields are properly mapped to LiveActivityFeed expectations

**Data Flow**:
```
Backend API → activityAggregator → formatActivityMessage → LiveActivityFeed → Display
```

### 3. Updated LiveActivityFeed Component (`frontend/src/components/LiveActivityFeed.jsx`)

**Changes**:
- Modified `formatActivityDisplay` to use pre-formatted messages from the aggregator
- Simplified message construction to avoid redundant formatting
- Maintained support for route, location, issue type, and passenger info on secondary lines

**Message Structure**:
- Line 1: Pre-formatted action message (e.g., "Anthony Gair made a STOP decision on 5801")
- Line 2: Route and location (e.g., "Route 21 • Newcastle City Centre")
- Line 3: Issue details and passenger info (e.g., "Engine Failure • 👥 15 passengers")

### 4. Enhanced Backend Activity Logger (`backend/services/activityLogger.js`)

**Changes**:
- Improved `generateMessage` method to create human-readable messages
- Added logic to avoid message duplication
- Ensured consistency with frontend formatter expectations

## Message Examples

### Before
```
"Activity logged for breakdown BD-2025-00007"
"Status update"
"Engineering requested"
```

### After
```
"Anthony Gair made a STOP decision on 5801"
"Barry Perryman resolved a breakdown on 8316"
"James Daglish requested an engineer for 6001"
"Supervisor started assessing 5801"
```

## Data Fields Used

The formatter prioritizes the following fields for each component:

**Supervisor Name** (in order of priority):
1. `activity.actor_name`
2. `activity.supervisorName`
3. `activity.supervisor_name`
4. `activity.supervisor`
5. `activity.reported_by`
6. Fallback: "A supervisor"

**Fleet Number**:
1. `activity.entity_details.fleetNo`
2. `activity.fleet_no`
3. `activity.fleet_number`
4. `activity.busNumber`
5. `activity.vehicle`

**Decision**:
1. `activity.metadata.decision`
2. `activity.decision`
3. `activity.wizard_decision`
4. `activity.severity`

**Issue Type**:
1. `activity.entity_details.issueCategory`
2. `activity.issue_category`
3. `activity.issue_type`
4. `activity.issue`

## Graceful Fallbacks

The formatter includes multiple fallback mechanisms:

1. **Missing Supervisor Name**: Uses "A supervisor"
2. **Missing Fleet Number**: Omits from message or shows "vehicle"
3. **Missing Decision**: Shows action without decision
4. **Unknown Activity Type**: Uses `activity.action` field or `activity.message` as fallback

## Testing Recommendations

To verify the improvements:

1. **Create a New Breakdown**:
   - Expected: "{Your Name} reported a breakdown on {Fleet Number}"

2. **Complete Assessment**:
   - Expected: "{Your Name} made a {DECISION} decision on {Fleet Number}"

3. **Request Engineer**:
   - Expected: "{Your Name} requested an engineer for {Fleet Number}"

4. **Resolve Breakdown**:
   - Expected: "{Your Name} resolved a breakdown on {Fleet Number}"

## Files Modified

1. `/frontend/src/utils/activityMessageFormatter.js` - **CREATED**
2. `/frontend/src/api/activityAggregator.js` - Updated
3. `/frontend/src/components/LiveActivityFeed.jsx` - Updated
4. `/backend/services/activityLogger.js` - Enhanced message generation

## No Rebuild Required

These changes are JavaScript-only and don't require a rebuild:
- The frontend uses Vite which will hot-reload the changes
- The backend uses nodemon in dev mode for auto-restart
- Simply refresh the browser to see the updated messages

## Future Enhancements

Potential improvements for consideration:

1. Add more activity types (vehicle recovered, changeover requested, etc.)
2. Include time estimates (e.g., "Engineer arriving in 15 minutes")
3. Add breakdown severity indicators in messages
4. Support for activity filtering by supervisor or depot
5. Real-time notifications for critical activities
