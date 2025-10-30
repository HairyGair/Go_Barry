# SDC Operations Dashboard Backend Support Analysis

**Generated:** 2025-10-02
**Scope:** Backend API endpoints, WebSocket support, data services, and database schema for SDC Dashboard

---

## Executive Summary

The backend has **partial support** for the SDC Operations Dashboard. Core breakdown tracking endpoints exist, WebSocket infrastructure is in place, but **critical SDC-specific endpoints are missing**. The database schema needs enhancement to support full SDC workflow.

### Overall Status: 65% Complete

- ✅ **Strong**: Breakdown data endpoints, WebSocket infrastructure, activity logging
- ⚠️ **Partial**: Assessment tracking, audit trail
- ❌ **Missing**: SDC-specific action endpoints (acknowledge, decision, engineering requests, notes)

---

## 1. Required API Endpoints Analysis

### ✅ IMPLEMENTED (5/8)

#### 1.1 `/api/breakdowns/live` - Main breakdown data endpoint
**Status:** ✅ FULLY IMPLEMENTED
**Location:** `/backend/routes/breakdownsAPI.js` (lines 64-247)
**Features:**
- Fetches active breakdowns from Supabase with status filtering
- Enriches data with assessment progress from activities file
- Calculates real-time statistics (critical count, pending, dispatched)
- Maps wizard decisions to severity levels
- Returns formatted breakdown objects with 30+ fields

**Response Structure:**
```javascript
{
  success: true,
  breakdowns: [
    {
      id, breakdown_id, daily_id,
      vehicleFleet, fleet_number, route,
      location, coordinates,
      assessmentType, wizard_type,
      supervisor, supervisor_badge,
      status, decision, severity,
      currentStep, stepDescription, progress_percentage,
      wizardResponses,
      recommendedActions,
      createdAt, startedAt, completedAt, acknowledgedAt,
      sdc_acknowledged, engineering_requested, engineer_assigned,
      isCritical, isPending, isDispatched, inAssessment
    }
  ],
  total, critical, pending, dispatched, in_assessment
}
```

#### 1.2 `/api/breakdowns/in-progress` - Active assessments
**Status:** ✅ FULLY IMPLEMENTED
**Location:** `/backend/routes/breakdownsAPI.js` (lines 249-343)
**Features:**
- Filters assessments started within last 30 minutes
- Tracks wizard session state (started but not completed)
- Calculates current step and progress percentage
- Provides estimated completion time
- Includes elapsed minutes since assessment started

**Response Structure:**
```javascript
{
  success: true,
  assessments: [
    {
      breakdownId, fleetNumber, route, location,
      assessmentType, wizard_type,
      supervisor, supervisor_badge,
      startTime, currentStep, stepDescription,
      estimatedCompletion, priority,
      progress_percentage, elapsed_minutes
    }
  ],
  count, timestamp
}
```

#### 1.3 `/api/breakdowns/:id/edit` - Assessment edit workflow
**Status:** ✅ IMPLEMENTED (but uses POST, not in spec)
**Location:** `/backend/routes/breakdownsAPI.js` (lines 345-450)
**Features:**
- Validates edit reason requirement
- Logs audit event with full context
- Creates activity log entry
- Returns edit context with redirect URL
- Supports return_url for dashboard navigation

**Missing:**
- Not mounted under `/api/sdc/` prefix as dashboard expects
- Endpoint path conflict - SDC Dashboard may call `/api/sdc/add-note` instead

#### 1.4 `/api/breakdowns/:id/audit` - Assessment audit trail
**Status:** ✅ FULLY IMPLEMENTED
**Location:** `/backend/routes/breakdownsAPI.js` (lines 452-537)
**Features:**
- Combines audit events and activities
- Formats timeline with action descriptions
- Provides source tracking (system, user, sdc_dashboard)
- Returns sorted chronological events

**Response Structure:**
```javascript
{
  success: true,
  breakdown_id: "BD-2025-00123",
  audit_trail: [
    {
      id, timestamp, action, user, details, source, type, metadata
    }
  ],
  total_events, audit_events, activity_events
}
```

#### 1.5 `/api/activity/log` - Activity logging endpoint
**Status:** ✅ FULLY IMPLEMENTED
**Location:** `/backend/routes/activity.js` (lines 650-719)
**Features:**
- Logs activities to unified `activities` table
- Supports custom activity types, severity levels, icons
- Validates required fields
- Returns logged activity record

---

### ❌ MISSING CRITICAL ENDPOINTS (3/8)

#### 1.6 `/api/sdc/add-note` - Adding notes to breakdowns
**Status:** ❌ NOT IMPLEMENTED
**Expected Implementation:**
```javascript
router.post('/api/sdc/add-note', async (req, res) => {
  const { breakdown_id, note, user_name, user_badge } = req.body;

  // Add note to breakdown_notes table or activities
  await supabase.from('breakdown_notes').insert({
    breakdown_id,
    note_text: note,
    created_by: user_name,
    user_badge,
    created_at: new Date().toISOString()
  });

  // Log activity
  await activityLogger.logActivity({
    activityType: 'note_added',
    action: 'added note',
    actorType: 'sdc_operator',
    actorId: user_badge,
    actorName: user_name,
    entityType: 'breakdown',
    entityId: breakdown_id,
    metadata: { note_text: note }
  });

  res.json({ success: true });
});
```

**Impact:** SDC operators cannot add operational notes to breakdowns

---

#### 1.7 `/api/sdc/acknowledge` - Acknowledging breakdowns
**Status:** ❌ NOT IMPLEMENTED (Reference exists in REQUIRED_ENDPOINTS.js)
**Expected Implementation:**
```javascript
router.post('/api/sdc/acknowledge', async (req, res) => {
  const { breakdown_id, acknowledged_by } = req.body;

  const { data, error } = await supabase
    .from('breakdowns')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by,
      updated_at: new Date().toISOString()
    })
    .eq('breakdown_id', breakdown_id)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await activityLogger.logActivity({
    activityType: 'sdc_acknowledged',
    action: 'acknowledged breakdown',
    actorType: 'sdc_operator',
    actorId: acknowledged_by,
    entityType: 'breakdown',
    entityId: breakdown_id
  });

  // Broadcast WebSocket update
  webSocketHandler.broadcast('sdc-dashboard', {
    type: 'breakdown_acknowledged',
    breakdown_id,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, breakdown: data });
});
```

**Impact:** Dashboard cannot track when SDC operators acknowledge breakdowns

---

#### 1.8 `/api/sdc/decision` - Recording SDC decisions
**Status:** ❌ NOT IMPLEMENTED (Reference exists in REQUIRED_ENDPOINTS.js)
**Expected Implementation:**
```javascript
router.post('/api/sdc/decision', async (req, res) => {
  const { breakdown_id, decision, decision_notes, decided_by } = req.body;

  const { data, error } = await supabase
    .from('breakdowns')
    .update({
      sdc_decision: decision,
      decision_notes,
      decision_at: new Date().toISOString(),
      decided_by,
      updated_at: new Date().toISOString()
    })
    .eq('breakdown_id', breakdown_id)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await activityLogger.logSDCDecision({
    supervisorId: decided_by,
    breakdownId: breakdown_id,
    decision,
    notes: decision_notes
  });

  // Broadcast update
  webSocketHandler.broadcast('sdc-dashboard', {
    type: 'sdc_decision_made',
    breakdown_id,
    decision,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, breakdown: data });
});
```

**Impact:** Cannot track SDC operational decisions separate from wizard assessments

---

#### 1.9 `/api/sdc/request-engineering` - Engineering dispatch requests
**Status:** ❌ NOT IMPLEMENTED
**Expected Implementation:**
```javascript
router.post('/api/sdc/request-engineering', async (req, res) => {
  const {
    breakdown_id,
    priority,
    requested_by,
    notes,
    preferred_depot
  } = req.body;

  // Create engineering request
  const { data: request, error } = await supabase
    .from('engineering_requests')
    .insert({
      breakdown_id,
      priority,
      requested_by,
      notes,
      preferred_depot,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Update breakdown
  await supabase
    .from('breakdowns')
    .update({
      engineering_requested: true,
      engineering_requested_at: new Date().toISOString()
    })
    .eq('breakdown_id', breakdown_id);

  // Log activity
  await activityLogger.logActivity({
    activityType: 'engineering_requested',
    action: 'requested engineering assistance',
    actorType: 'sdc_operator',
    actorId: requested_by,
    entityType: 'breakdown',
    entityId: breakdown_id,
    metadata: { priority, notes, request_id: request.id }
  });

  // Broadcast to engineering dashboard
  webSocketHandler.broadcast('engineering-dashboard', {
    type: 'engineering_request_created',
    request,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, request });
});
```

**Impact:** SDC cannot formally request engineering assistance through the system

---

## 2. WebSocket Support Analysis

### ✅ INFRASTRUCTURE: FULLY IMPLEMENTED

**Location:** `/backend/routes/webSocketHandler.js`
**Server Integration:** `/backend/server.js` (lines 243-256)

#### 2.1 WebSocket Server Configuration
```javascript
// Initialized on HTTP server
webSocketHandler.initialize(server);

// Available at: ws://localhost:3001/ws
// Channel-based routing: ws://localhost:3001/ws?channel=sdc-dashboard
```

#### 2.2 Supported Channels
- ✅ `sdc-dashboard` - SDC Operations Dashboard
- ✅ `breakdowns` - General breakdown updates
- ✅ `assessment-progress` - Real-time assessment tracking
- ✅ `engineering-dashboard` - Engineering team updates

#### 2.3 Event Broadcasting Methods
**Available in webSocketHandler:**
```javascript
// Channel-specific broadcast
webSocketHandler.broadcast('sdc-dashboard', { type: 'event', data: {} });

// Broadcast to all connected clients
webSocketHandler.broadcastToAll({ type: 'event', data: {} });

// Specialized broadcast methods
webSocketHandler.broadcastWizardStarted(assessmentData);
webSocketHandler.broadcastWizardCompleted(assessmentData);
webSocketHandler.broadcastAssessmentProgress(progressData);
webSocketHandler.broadcastBreakdownCreated(breakdownData);
```

#### 2.4 File Watching for Real-time Updates
**Active watchers:**
- `/backend/data/activities.json` - Triggers activity updates
- `/backend/data/breakdown-counter.json` - Triggers breakdown updates

**Event mapping** (lines 324-334):
```javascript
{
  'wizard_started': 'wizard_started',
  'wizard_completed': 'wizard_completed',
  'wizard_step': 'wizard_progress',
  'edit_initiated': 'assessment_edit_started',
  'breakdown_reported': 'breakdown_created'
}
```

---

### ⚠️ WEBSOCKET GAPS

#### Missing Real-time Events:
1. ❌ `breakdown_acknowledged` - When SDC acknowledges
2. ❌ `sdc_decision_made` - When SDC makes operational decision
3. ❌ `engineering_requested` - When engineering assistance requested
4. ❌ `note_added` - When note added to breakdown
5. ❌ `status_changed` - When breakdown status updates

**Recommendation:** Add broadcast calls in missing endpoint implementations

---

## 3. Data Services Analysis

### ✅ EXISTING SERVICES

#### 3.1 Activity Logger Service
**Location:** `/backend/services/activityLogger.js`
**Status:** ✅ COMPREHENSIVE

**Features:**
- Unified activity logging to Supabase `activities` table
- Pre-defined activity types and severity levels
- Actor type tracking (supervisor, sdc_operator, engineer, system)
- Entity relationship tracking (breakdown, assessment, vehicle)
- Metadata and icon support

**Activity Types Available:**
```javascript
ACTIVITY_TYPES = {
  BREAKDOWN_REPORTED: 'breakdown_reported',
  WIZARD_STARTED: 'wizard_started',
  WIZARD_COMPLETED: 'wizard_completed',
  WIZARD_DECISION: 'wizard_decision',
  ENGINEER_ASSIGNED: 'engineer_assigned',
  ENGINEER_DISPATCHED: 'engineer_dispatched',
  ENGINEER_ARRIVED: 'engineer_on_site',
  BREAKDOWN_RESOLVED: 'breakdown_resolved',
  STATUS_CHANGED: 'status_changed',
  NOTE_ADDED: 'note_added',
  SDC_ACKNOWLEDGED: 'sdc_acknowledged',
  SDC_DECISION: 'sdc_decision'
}
```

**Specialized Logging Methods:**
```javascript
logBreakdownReported({ supervisorId, supervisorName, breakdownId, fleetNo, issueCategory, location, severity, depot, source })
logWizardCompleted({ supervisorId, supervisorName, breakdownId, fleetNo, wizardType, decision, assessmentData })
logEngineerAssigned({ engineerId, engineerName, breakdownId, fleetNo, assignedBy, depot })
logSDCDecision({ supervisorId, breakdownId, decision, notes, priority, fleetNo })
```

---

#### 3.2 Breakdown ID Generator Service
**Location:** `/backend/services/breakdownIdGenerator.js`
**Status:** ✅ OPERATIONAL

**Features:**
- Generates sequential breakdown IDs: `BD-2025-00001`
- Daily counter reset mechanism
- Database-backed counter for reliability
- Provides statistics and status endpoints

---

### ⚠️ DATA SERVICE GAPS

#### 3.3 Missing: Breakdown State Aggregation Service
**Impact:** No centralized service to aggregate breakdown state across multiple data sources

**Recommendation:**
```javascript
// /backend/services/breakdownAggregator.js
class BreakdownAggregator {
  async getBreakdownFullState(breakdown_id) {
    // Combines: breakdown data, activities, audit events, notes, engineering requests
  }

  async getSDCDashboardState() {
    // Optimized query for dashboard view with all relationships
  }
}
```

---

#### 3.4 Missing: Assessment Progress Tracker
**Impact:** Assessment progress tracked in JSON files, not in database

**Current Implementation:**
- Progress stored in `/backend/data/activities.json`
- Wizard progress tracked in file system
- No persistent progress tracking in database

**Recommendation:**
- Store assessment steps in `wizard_progress` table
- Track completion percentage in database
- Enable progress recovery after server restart

---

## 4. Database Schema Analysis

### ✅ EXISTING TABLES

#### 4.1 `breakdowns` Table
**Status:** ⚠️ PARTIAL - Missing SDC workflow fields

**Current Schema** (from setup-database-tables.sql):
```sql
CREATE TABLE breakdowns (
  id UUID PRIMARY KEY,
  fleet_no TEXT NOT NULL,
  supervisor_id TEXT,
  supervisor_email TEXT,
  supervisor_name TEXT,
  wizard_type TEXT,
  status TEXT DEFAULT 'active',
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_address TEXT,
  assessment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Missing Critical Fields:**
```sql
-- SDC workflow tracking
acknowledged_at TIMESTAMPTZ,
acknowledged_by TEXT,
decision_at TIMESTAMPTZ,
decided_by TEXT,
sdc_decision TEXT,
decision_notes TEXT,

-- Engineering workflow
engineering_requested BOOLEAN DEFAULT FALSE,
engineering_requested_at TIMESTAMPTZ,
engineer_assigned TEXT,
engineer_assigned_at TIMESTAMPTZ,
dispatched_at TIMESTAMPTZ,
on_site_at TIMESTAMPTZ,
resolved_at TIMESTAMPTZ,

-- Breakdown identification
breakdown_id TEXT UNIQUE NOT NULL, -- BD-2025-00001 format
daily_id INTEGER,

-- Additional context
location TEXT, -- Human-readable location
route TEXT,
depot TEXT,
severity TEXT, -- STOP/AMBER/CONTINUE
priority_level INTEGER DEFAULT 3,
wizard_decision TEXT,
wizard_assessment_data JSONB,
issue_category TEXT,
description TEXT
```

---

#### 4.2 `activities` Table
**Status:** ✅ COMPREHENSIVE

**Schema** (inferred from activityLogger.js):
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY,
  activity_type TEXT NOT NULL,
  action TEXT,
  actor_type TEXT, -- supervisor, sdc_operator, engineer, system
  actor_id TEXT,
  actor_name TEXT,
  entity_type TEXT, -- breakdown, assessment, vehicle
  entity_id TEXT,
  entity_details JSONB,
  depot TEXT,
  severity TEXT, -- critical, warning, normal, success, info
  priority INTEGER DEFAULT 5,
  source TEXT,
  source_url TEXT,
  metadata JSONB,
  icon TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### 4.3 `breakdown_events` Table
**Status:** ✅ EXISTS (inferred from code usage)

**Purpose:** Immutable event log for breakdown lifecycle

**Expected Schema:**
```sql
CREATE TABLE breakdown_events (
  id UUID PRIMARY KEY,
  breakdown_id UUID REFERENCES breakdowns(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### ❌ MISSING TABLES

#### 4.4 `breakdown_notes` Table
**Purpose:** Store operational notes from SDC and engineers

```sql
CREATE TABLE breakdown_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  created_by TEXT NOT NULL,
  user_badge TEXT,
  user_type TEXT, -- sdc_operator, engineer, supervisor
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (breakdown_id) REFERENCES breakdowns(breakdown_id)
);

CREATE INDEX idx_breakdown_notes_breakdown_id ON breakdown_notes(breakdown_id);
CREATE INDEX idx_breakdown_notes_created_at ON breakdown_notes(created_at DESC);
```

---

#### 4.5 `engineering_requests` Table
**Purpose:** Track engineering assistance requests

```sql
CREATE TABLE engineering_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  requested_by TEXT NOT NULL,
  notes TEXT,
  preferred_depot TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'dispatched', 'completed', 'cancelled')),
  assigned_engineer TEXT,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (breakdown_id) REFERENCES breakdowns(breakdown_id)
);

CREATE INDEX idx_engineering_requests_breakdown_id ON engineering_requests(breakdown_id);
CREATE INDEX idx_engineering_requests_status ON engineering_requests(status);
```

---

## 5. Implementation Gaps Summary

### Critical Missing Components

| Component | Priority | Estimated Effort | Impact |
|-----------|----------|------------------|--------|
| `/api/sdc/acknowledge` endpoint | HIGH | 2 hours | Cannot track SDC acknowledgment |
| `/api/sdc/decision` endpoint | HIGH | 2 hours | Cannot record SDC decisions |
| `/api/sdc/add-note` endpoint | MEDIUM | 1 hour | No operational notes |
| `/api/sdc/request-engineering` endpoint | HIGH | 3 hours | Cannot request engineering |
| Database schema updates | HIGH | 4 hours | Missing critical fields |
| `breakdown_notes` table | MEDIUM | 1 hour | No persistent notes |
| `engineering_requests` table | HIGH | 2 hours | No formal request tracking |
| WebSocket event broadcasts | MEDIUM | 2 hours | Missing real-time updates |

**Total Estimated Effort:** 17 hours

---

## 6. Recommendations

### Immediate Actions (Week 1)

1. **Add SDC workflow fields to `breakdowns` table**
   - Run migration to add `acknowledged_at`, `acknowledged_by`, `decision_at`, `decided_by`, `sdc_decision`, `decision_notes`
   - Add `breakdown_id` unique field
   - Add `depot`, `severity`, `priority_level` fields

2. **Implement missing SDC endpoints**
   - `/api/sdc/acknowledge`
   - `/api/sdc/decision`
   - `/api/sdc/add-note`
   - `/api/sdc/request-engineering`

3. **Create missing database tables**
   - `breakdown_notes`
   - `engineering_requests`

### Short-term Improvements (Week 2-3)

4. **Enhance WebSocket broadcasting**
   - Add real-time events for SDC actions
   - Implement selective channel broadcasting
   - Add reconnection handling

5. **Create aggregation service**
   - Centralized breakdown state retrieval
   - Optimized dashboard queries
   - Caching layer for frequent queries

### Long-term Enhancements (Month 2+)

6. **Assessment progress persistence**
   - Store wizard steps in database
   - Enable progress recovery
   - Add completion time tracking

7. **Performance optimization**
   - Database indexes on new fields
   - Query optimization for dashboard loads
   - Response time monitoring

---

## 7. API Endpoint Mount Points Issue

### Current Route Configuration
```javascript
// /backend/server.js
app.use('/api/sdc', breakdownsAPIRoutes); // Line 186
```

### Problem
- SDC Dashboard expects: `/api/sdc/acknowledge`, `/api/sdc/decision`, `/api/sdc/add-note`
- Current routes in `breakdownsAPI.js` are defined as:
  - `/live` → mounts as `/api/sdc/live` ✅
  - `/in-progress` → mounts as `/api/sdc/in-progress` ✅
  - `/:id/edit` → mounts as `/api/sdc/:id/edit` ❌ (should be `/api/breakdowns/:id/edit`)
  - `/:id/audit` → mounts as `/api/sdc/:id/audit` ✅

### Solution
Need to add new routes in `breakdownsAPI.js`:
```javascript
router.post('/acknowledge', async (req, res) => { /* implementation */ });
router.post('/decision', async (req, res) => { /* implementation */ });
router.post('/add-note', async (req, res) => { /* implementation */ });
router.post('/request-engineering', async (req, res) => { /* implementation */ });
```

---

## Conclusion

The backend has a **solid foundation** with comprehensive breakdown tracking, WebSocket infrastructure, and activity logging. However, **critical SDC-specific workflow endpoints are missing**, preventing full dashboard functionality.

**Completion Status:** 65%
**Blockers:** 4 missing API endpoints, 2 missing database tables, schema updates required
**Estimated Time to Full Implementation:** 17 hours

The system can currently:
- ✅ Display live breakdowns
- ✅ Track assessment progress
- ✅ Provide audit trails
- ✅ Real-time WebSocket updates (partial)

The system cannot currently:
- ❌ Record SDC acknowledgments
- ❌ Store SDC decisions
- ❌ Add operational notes
- ❌ Request engineering assistance
- ❌ Track full breakdown lifecycle in database

**Next Step:** Implement the 4 missing SDC endpoints and run database migration.
