# Activity Feed Sync Issue - Root Cause Analysis

**Report Date:** October 4, 2025
**Issue:** Completed breakdown actions not appearing in activity feed or syncing across screens
**Severity:** HIGH
**Status:** ROOT CAUSE IDENTIFIED

---

## 🔴 Problem Statement

When breakdowns are resolved in the SDC Operations Dashboard, the following issues occur:

1. **Activity feed doesn't update** - Resolution events not appearing in activity stream
2. **Other screens don't reflect changes** - Status changes not syncing
3. **WebSocket events not reaching clients** - Real-time updates failing

---

## 🔍 Root Cause Analysis

### Issue #1: Activities Table Doesn't Exist ⚠️

**Discovery:**
The backend is trying to use TWO activity logging systems:

1. **Database-based** (`activityLogger.js`) → Tries to INSERT into `activities` table
2. **JSON file-based** (`breakdownsAPI.js`) → Writes to `/backend/data/activities.json`

**Problem:**
- `activityLogger.js:186` attempts: `supabase.from('activities').insert(...)`
- BUT the `activities` table **does not exist** in the database!
- Result: All activity logging to database FAILS silently

**Evidence:**
```javascript
// activityLogger.js:101-108
const { data, error } = await supabase
  .from('activities')
  .select('id')
  .limit(1);

if (error && !error.message.includes('relation "activities" does not exist')) {
  throw error;
}
```

This code checks if the table exists, but if it doesn't exist, it just sets `isInitialized = false` and queues activities that never get persisted!

### Issue #2: Dual Activity Logging Systems 🔀

**System 1: Activity Logger Service** (Intended, but broken)
- **File:** `backend/services/activityLogger.js`
- **Method:** Database-based with Supabase
- **Status:** ❌ BROKEN - table doesn't exist
- **Used By:** Supposed to be used across the app, but not called in breakdownsAPI.js

**System 2: Direct JSON File Writing** (Currently working)
- **File:** `backend/routes/breakdownsAPI.js:1445-1466`
- **Method:** Direct file writes to `activities.json`
- **Status:** ✅ WORKING - but limited to breakdownsAPI.js only

**Problem:** The resolution endpoint (`/api/sdc/resolve`) writes to the JSON file, but OTHER parts of the app expect to read from the database!

### Issue #3: Missing WebSocket Broadcast Channel ⚠️

**Backend broadcasts to:** `'sdc-dashboard'` channel
```javascript
// breakdownsAPI.js:1498
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'breakdown_resolved',
  breakdown_id: breakdown_id,
  // ...
});
```

**Frontend connects to:** `/ws?channel=sdc-dashboard` ✅
```javascript
// SDCDashboard.jsx:63
const connectionManager = useConnectionManager({
  endpoint: '/ws?channel=sdc-dashboard',
  autoConnect: true,
  // ...
});
```

**This part is correct!** But there's a potential issue...

### Issue #4: Activity Feed Reads from Wrong Source 📍

**Activity Feed API Endpoint:**
```javascript
// Backend routes/activity.js
GET /api/activity/feed
```

This endpoint tries to read from the `activities` **database table**:
```javascript
const { data, error } = await supabase
  .from('activities')
  .select('*')
  .order('created_at', { ascending: false })
```

**But activities are being written to:**
- `backend/data/activities.json` (JSON file)

**Result:** Activity feed API returns EMPTY or OLD data because it's reading from non-existent database table!

### Issue #5: WebSocket Message Not Triggering Activity Feed Update 🔌

**SDC Dashboard WebSocket Handler:**
```javascript
// SDCDashboard.jsx:639-644
case 'breakdown_resolved':
  // Remove resolved breakdown from view
  const resolvedBreakdownId = data.breakdown_id || data.breakdownId;
  console.log('✅ Breakdown resolved via WebSocket:', resolvedBreakdownId);

  // Remove from active breakdowns
```

**Missing:** The WebSocket handler updates the breakdown list, but it does NOT:
1. Add the resolution event to the activity feed
2. Notify the activity feed component to refresh
3. Broadcast the activity event to other screens

---

## 🛠️ Detailed Technical Analysis

### File-by-File Breakdown

#### 1. `/backend/services/activityLogger.js`
**Purpose:** Centralized activity logging service
**Status:** ❌ BROKEN

**Issues:**
- Line 101-108: Checks if `activities` table exists
- Line 186: Tries to INSERT into non-existent table
- Line 178-183: Queues activities when table doesn't exist
- **Activities stay queued forever** - never persisted

**Missing Migration:**
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_details JSONB,
  depot TEXT,
  severity TEXT,
  priority INTEGER DEFAULT 5,
  source TEXT,
  source_url TEXT,
  metadata JSONB,
  icon TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_activities_depot ON activities(depot);
CREATE INDEX idx_activities_entity ON activities(entity_id);
```

#### 2. `/backend/routes/breakdownsAPI.js`
**Purpose:** SDC-specific breakdown operations
**Status:** ⚠️ PARTIAL

**Line 1445-1466: Direct JSON file write**
```javascript
const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
const newActivity = {
  id: `activity_${Date.now()}`,
  type: 'breakdown_resolved',
  activity_type: 'breakdown_resolved',
  breakdown_id: breakdown_id,
  // ... more fields
  message: `Breakdown ${breakdown_id} resolved by ${resolvingUser} - ${resolution_type}...`
};

activitiesData.activities.unshift(newActivity);
saveJSONFile(ACTIVITIES_PATH, activitiesData);
```

**Problem:** This ONLY writes to local JSON file, not accessible by:
- Activity feed API endpoint (reads from database)
- Other dashboard components (expect database)
- Real-time subscribers (need WebSocket events)

**Line 1498-1508: WebSocket broadcast**
```javascript
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'breakdown_resolved',
  breakdown_id: breakdown_id,
  breakdown: breakdown,
  // ...
});
```

**Missing:** No `activity_created` or `activity_feed_update` event broadcast!

#### 3. `/backend/routes/activity.js` (Activity Feed API)
**Purpose:** Provide activity feed data to frontend
**Status:** ❌ BROKEN

**Reads from database:**
```javascript
const { data, error } = await supabase
  .from('activities')  // ← Table doesn't exist!
  .select('*')
  .order('created_at', { ascending: false })
```

**Should read from:** JSON file OR database (whichever exists)

#### 4. `/frontend/src/dashboards/sdc/SDCDashboard.jsx`
**Purpose:** SDC Operations Dashboard
**Status:** ⚠️ PARTIAL

**WebSocket Connection:** ✅ CORRECT
```javascript
const connectionManager = useConnectionManager({
  endpoint: '/ws?channel=sdc-dashboard',
  autoConnect: true,
  primary: 'websocket',
  fallback: 'polling'
});
```

**WebSocket Message Handler:** ⚠️ INCOMPLETE
```javascript
case 'breakdown_resolved':
  const resolvedBreakdownId = data.breakdown_id || data.breakdownId;
  console.log('✅ Breakdown resolved via WebSocket:', resolvedBreakdownId);

  // Remove from active breakdowns ← MISSING: Update activity feed!
```

**Missing:**
- No activity feed state update
- No call to refresh activities
- No local activity creation

---

## 📊 Data Flow Analysis

### Current (Broken) Flow:

```
1. User clicks "Resolve" in SDC Dashboard
   ↓
2. POST /api/sdc/resolve
   ↓
3. Update breakdowns table (✅ works)
   ↓
4. Write to activities.json (✅ works, but wrong destination)
   ↓
5. WebSocket broadcast 'breakdown_resolved' (✅ works)
   ↓
6. Frontend receives WebSocket event (✅ works)
   ↓
7. Frontend removes breakdown from list (✅ works)
   ↓
8. Activity feed API reads from activities table (❌ empty/doesn't exist)
   ↓
9. Activity feed shows nothing (❌ FAIL)
```

### Expected (Correct) Flow:

```
1. User clicks "Resolve" in SDC Dashboard
   ↓
2. POST /api/sdc/resolve
   ↓
3. Update breakdowns table (✅)
   ↓
4. Insert activity into activities table (❌ needs fix)
   ↓
5. WebSocket broadcast 'breakdown_resolved' + 'activity_created' (❌ needs second event)
   ↓
6. Frontend receives both WebSocket events
   ↓
7. Update breakdown list (remove resolved)
   ↓
8. Update activity feed (add new activity)
   ↓
9. All screens show updated data (✅)
```

---

## 🎯 Root Causes Summary

### 1. Missing Database Table (CRITICAL)
- **Table:** `activities`
- **Impact:** All database-based activity logging fails
- **Affected:** Activity feed API, real-time subscriptions, cross-screen sync

### 2. Dual Logging Systems (HIGH)
- **System 1:** Activity Logger Service (broken, uses database)
- **System 2:** Direct JSON writes (working, but isolated)
- **Impact:** Data inconsistency, activities not accessible across app

### 3. Activity Feed API Mismatch (HIGH)
- **API reads from:** Database `activities` table
- **Data written to:** JSON file `activities.json`
- **Impact:** Activity feed always empty or stale

### 4. Incomplete WebSocket Events (MEDIUM)
- **Current:** Only `breakdown_resolved` event broadcast
- **Missing:** `activity_created` or `activity_feed_update` event
- **Impact:** Activity feed not notified to refresh

### 5. Frontend Missing Activity Sync (MEDIUM)
- **Current:** WebSocket handler only updates breakdown list
- **Missing:** Activity feed refresh/update logic
- **Impact:** Even if backend fixed, frontend won't display new activities

---

## ✅ Solution Roadmap

### Immediate Fixes (This Week)

#### Fix 1: Create Activities Table Migration ⚡
**File:** `backend/migrations/create_activities_table.sql`
**Priority:** CRITICAL

```sql
-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  entity_type TEXT,
  entity_id TEXT,
  entity_details JSONB DEFAULT '{}',
  depot TEXT,
  severity TEXT DEFAULT 'info',
  priority INTEGER DEFAULT 5,
  source TEXT,
  source_url TEXT,
  metadata JSONB DEFAULT '{}',
  icon TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_depot ON activities(depot);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_activities_severity ON activities(severity);

-- Full-text search index (if needed)
CREATE INDEX IF NOT EXISTS idx_activities_message_search
  ON activities USING gin(to_tsvector('english', message));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at_trigger
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activities_updated_at();

-- Row Level Security (if needed)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Allow supervisors to read all activities
CREATE POLICY activities_select_policy ON activities
  FOR SELECT
  USING (true);

-- Policy: Allow supervisors to insert activities
CREATE POLICY activities_insert_policy ON activities
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE activities IS 'Unified activity feed for all system events and user actions';
```

#### Fix 2: Use Activity Logger in Resolve Endpoint ⚡
**File:** `backend/routes/breakdownsAPI.js`
**Change:** Replace JSON file writes with Activity Logger

```javascript
// BEFORE (lines 1445-1466):
const activitiesData = loadJSONFile(ACTIVITIES_PATH, { activities: [] });
const newActivity = { /* ... */ };
activitiesData.activities.unshift(newActivity);
saveJSONFile(ACTIVITIES_PATH, activitiesData);

// AFTER:
import { activityLogger, ACTIVITY_TYPES, SEVERITY_LEVELS } from '../services/activityLogger.js';

// Log to database via activity logger
await activityLogger.logActivity({
  activityType: ACTIVITY_TYPES.BREAKDOWN_RESOLVED,
  action: `resolved ${resolution_type} - ${breakdown.fleet_number}`,
  actorType: 'supervisor',
  actorId: supervisor_badge,
  actorName: resolvingUser,
  entityType: 'breakdown',
  entityId: breakdown_id,
  entityDetails: {
    fleetNo: breakdown.fleet_number,
    location: breakdown.location,
    issueCategory: breakdown.issue_category,
    resolutionType: resolution_type,
    returnedToService: returned_to_service
  },
  depot: breakdown.depot,
  severity: returned_to_service ? SEVERITY_LEVELS.SUCCESS : SEVERITY_LEVELS.INFO,
  source: 'sdc_operations',
  metadata: {
    resolutionNotes: resolution_notes,
    elapsedTime: Math.floor((new Date(resolvedAt) - new Date(breakdown.created_at)) / 1000 / 60)
  },
  message: `Breakdown ${breakdown_id} resolved by ${resolvingUser} - ${resolution_type}${resolution_notes ? ': ' + resolution_notes : ''}`
});
```

#### Fix 3: Broadcast Activity Feed Event ⚡
**File:** `backend/routes/breakdownsAPI.js`
**Add:** Second WebSocket broadcast for activity feed

```javascript
// After existing breakdown_resolved broadcast (line 1498):
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'breakdown_resolved',
  breakdown_id: breakdown_id,
  breakdown: breakdown,
  // ...
});

// ADD THIS:
webSocketHandler.broadcast('sdc-dashboard', {
  type: 'activity_created',
  activity: {
    id: activityId,
    activity_type: 'breakdown_resolved',
    breakdown_id: breakdown_id,
    fleet_number: breakdown.fleet_number,
    resolved_by: resolvingUser,
    resolution_type: resolution_type,
    message: `Breakdown ${breakdown_id} resolved by ${resolvingUser} - ${resolution_type}`,
    timestamp: resolvedAt,
    icon: returned_to_service ? '✅' : '📋'
  },
  timestamp: resolvedAt
});

// Also broadcast to general channel for other dashboards:
webSocketHandler.broadcast('general', {
  type: 'activity_created',
  activity: { /* same as above */ }
});
```

#### Fix 4: Update Frontend Activity Feed ⚡
**File:** `frontend/src/dashboards/sdc/SDCDashboard.jsx`
**Change:** Add activity feed update to WebSocket handler

```javascript
// In WebSocket message handler (around line 639):
case 'breakdown_resolved':
  const resolvedBreakdownId = data.breakdown_id || data.breakdownId;
  console.log('✅ Breakdown resolved via WebSocket:', resolvedBreakdownId);

  // Remove from active breakdowns
  setBreakdowns(prev => prev.filter(b => b.breakdown_id !== resolvedBreakdownId));

  // ADD THIS: Update activity feed
  if (data.activity) {
    setActivities(prev => [data.activity, ...prev].slice(0, 100));
  }
  break;

// ADD NEW CASE:
case 'activity_created':
  console.log('📝 New activity via WebSocket:', data.activity);
  setActivities(prev => [data.activity, ...prev].slice(0, 100));
  break;
```

### Medium-Term Fixes (Next 2 Weeks)

#### Fix 5: Migrate JSON File Data to Database
**Script:** `backend/scripts/migrate-activities-to-db.js`

```javascript
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const activitiesJSON = JSON.parse(readFileSync('./data/activities.json', 'utf-8'));

for (const activity of activitiesJSON.activities) {
  await supabase.from('activities').insert({
    id: activity.id,
    activity_type: activity.activity_type || activity.type,
    action: activity.message || 'Unknown action',
    actor_id: activity.resolved_by || activity.actorId,
    actor_name: activity.resolved_by || activity.actorName,
    entity_type: 'breakdown',
    entity_id: activity.breakdown_id,
    entity_details: {
      fleetNo: activity.fleet_number || activity.fleet_no,
      resolutionType: activity.resolution_type
    },
    message: activity.message,
    created_at: activity.timestamp,
    severity: 'info',
    icon: activity.icon || '📝'
  });
}

console.log(`✅ Migrated ${activitiesJSON.activities.length} activities to database`);
```

#### Fix 6: Update All Activity Feed Components
**Files to Update:**
1. `frontend/src/components/ActivityFeed.jsx` - Add WebSocket listener
2. `frontend/src/pages/Dashboard.jsx` - Subscribe to activity events
3. `frontend/src/dashboards/breakdown/BreakdownDashboard.jsx` - Add activity sync

#### Fix 7: Add Activity Feed Real-time Subscription
**File:** `frontend/src/services/activityService.js`

```javascript
import { supabase } from './supabase-client';

export function subscribeToActivities(callback) {
  const subscription = supabase
    .channel('activities-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'activities' },
      (payload) => {
        console.log('🔔 New activity from Supabase:', payload.new);
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
```

---

## 🧪 Testing Plan

### Test 1: Database Migration
```bash
# 1. Apply migration
psql -h db.oieliubbvvdzhzvikzal.supabase.co -U postgres -d postgres \
  -f backend/migrations/create_activities_table.sql

# 2. Verify table exists
psql -h ... -c "SELECT COUNT(*) FROM activities;"

# 3. Test insert
psql -h ... -c "INSERT INTO activities (activity_type, action, actor_type, message)
  VALUES ('test', 'test action', 'system', 'Test message');"
```

### Test 2: Activity Logger
```bash
# Start backend with logging
cd backend && NODE_ENV=development npm run dev

# Watch logs for:
# ✅ Activity Logger Service initialized
# 📝 Activity logged: breakdown_resolved by...
```

### Test 3: WebSocket Broadcast
```bash
# Connect WebSocket client
wscat -c "ws://localhost:3001/ws?channel=sdc-dashboard"

# Resolve a breakdown via API
# Watch for TWO messages:
# 1. {"type":"breakdown_resolved",...}
# 2. {"type":"activity_created",...}
```

### Test 4: Frontend Activity Feed
```bash
# Open SDC Dashboard
# Resolve a breakdown
# Check:
# 1. Breakdown removed from list ✅
# 2. Activity appears in feed ✅
# 3. Other screens see the update ✅
```

---

## 📝 Deployment Checklist

- [ ] Create `create_activities_table.sql` migration
- [ ] Apply migration to production Supabase
- [ ] Update `breakdownsAPI.js` to use Activity Logger
- [ ] Add `activity_created` WebSocket broadcast
- [ ] Update `SDCDashboard.jsx` WebSocket handler
- [ ] Migrate existing JSON activities to database
- [ ] Test on staging/development first
- [ ] Deploy to production
- [ ] Monitor WebSocket connections and activity feed
- [ ] Verify cross-screen synchronization

---

## 🔗 Related Files

**Backend:**
- `backend/services/activityLogger.js` - Activity logging service
- `backend/routes/breakdownsAPI.js` - SDC operations (resolve endpoint)
- `backend/routes/activity.js` - Activity feed API
- `backend/routes/webSocketHandler.js` - WebSocket server
- `backend/data/activities.json` - Current JSON file (to be deprecated)

**Frontend:**
- `frontend/src/dashboards/sdc/SDCDashboard.jsx` - SDC Dashboard
- `frontend/src/hooks/useConnectionManager.js` - WebSocket connection
- `frontend/src/components/ActivityFeed.jsx` - Activity feed component

**Migrations:**
- `backend/migrations/create_activities_table.sql` - **TO BE CREATED**

---

**Report End**

**Next Actions:**
1. Create activities table migration
2. Apply to Supabase production
3. Update resolve endpoint to use Activity Logger
4. Add activity_created WebSocket event
5. Update frontend WebSocket handler
6. Test end-to-end flow
7. Deploy to production

For implementation assistance, contact: anthony.gair@gonortheast.co.uk
