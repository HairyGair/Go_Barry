# SDC Operations Dashboard - Database Schema and Data Flow Analysis

**Analysis Date:** 2025-10-02
**System:** Go BARRY Breakdown Guide - SDC Operations Dashboard
**Database:** Supabase (PostgreSQL)

---

## Executive Summary

This analysis reviews the database schema, data relationships, and data flow for the SDC Operations Dashboard. The system uses a hybrid architecture combining Supabase (PostgreSQL) for persistent storage and local JSON files for real-time state management.

### Key Findings

✅ **Strengths:**
- Core breakdown tracking schema is well-defined
- Good indexing strategy for performance
- Real-time subscriptions properly configured
- Activity logging infrastructure in place

⚠️ **Critical Issues:**
1. **Missing Tables**: `breakdown_events`, `breakdown_dashboard_cards`, `activities` tables not created
2. **Incomplete Schema**: Several fields referenced in code but not in schema
3. **Data Flow Gaps**: Assessment tracking relies on JSON files instead of database
4. **Audit Trail**: Audit logging functionality exists in code but no database table

---

## 1. Database Schema Analysis

### 1.1 Existing Tables

#### ✅ `breakdowns` Table (COMPLETE)
**Purpose:** Core breakdown tracking and management

**Schema:**
```sql
CREATE TABLE breakdowns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

**Missing Fields Identified in Code:**
```sql
-- From backend/routes/breakdowns.js and breakdownsAPI.js
breakdown_id TEXT UNIQUE NOT NULL,           -- Primary business identifier
registration TEXT,                           -- Vehicle registration
depot TEXT,                                  -- Depot assignment
route TEXT,                                  -- Route number
severity TEXT,                               -- STOP/AMBER/CONTINUE
wizard_decision TEXT,                        -- Assessment outcome
criticality TEXT,                            -- Critical status flag
priority_level INTEGER DEFAULT 3,           -- 1=Critical, 2=High, 3=Normal
supervisor_badge TEXT,                       -- e.g., AG003, BP009
card_title TEXT,                             -- Dashboard display title
status_color TEXT,                           -- UI color indicator
requires_immediate_action BOOLEAN,           -- Urgency flag
issue_category TEXT,                         -- Problem type
description TEXT,                            -- Issue description
location_description TEXT,                   -- Human-readable location
wizard_assessment_data JSONB,                -- Full wizard responses
breakdown_source TEXT,                       -- wizard/direct_report/api
engineering_required BOOLEAN,                -- Engineering dispatch needed
replacement_vehicle_required BOOLEAN,        -- Changeover needed
driver_name TEXT,                            -- Driver information
driver_phone TEXT,                           -- Contact number
passenger_count INTEGER,                     -- Passengers affected

-- Timestamps for workflow tracking
received_at TIMESTAMPTZ,                     -- Initial report time
acknowledged_at TIMESTAMPTZ,                 -- SDC acknowledgement
decision_at TIMESTAMPTZ,                     -- Assessment complete
dispatched_at TIMESTAMPTZ,                   -- Engineer dispatched
on_site_at TIMESTAMPTZ,                      -- Engineer arrived
cleared_at TIMESTAMPTZ,                      -- Resolution time
resolution_notes TEXT,                       -- Resolution details
resolving_supervisor TEXT,                   -- Who resolved
returned_to_service_at TIMESTAMPTZ,          -- Service resumed

-- Engineering assignment
engineer_assigned TEXT,                      -- Engineer ID
engineer_name TEXT                           -- Engineer name
```

**Current Indexes:**
```sql
CREATE INDEX idx_breakdowns_supervisor_email ON breakdowns(supervisor_email);
CREATE INDEX idx_breakdowns_created_at ON breakdowns(created_at DESC);
```

**Missing Indexes for Performance:**
```sql
CREATE INDEX idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);
CREATE INDEX idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_severity ON breakdowns(severity);
CREATE INDEX idx_breakdowns_priority_level ON breakdowns(priority_level);
CREATE INDEX idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
CREATE INDEX idx_breakdowns_wizard_decision ON breakdowns(wizard_decision);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);
CREATE INDEX idx_breakdowns_route ON breakdowns(route);
```

---

#### ✅ `supervisors` Table (COMPLETE)
**Purpose:** Supervisor authentication and management

**Schema:**
```sql
CREATE TABLE supervisors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    depot TEXT DEFAULT 'Washington',
    role TEXT CHECK (role IN ('admin', 'supervisor', 'manager')) DEFAULT 'supervisor',
    badge_number TEXT,
    is_active BOOLEAN DEFAULT true,
    pending_approval BOOLEAN DEFAULT false,
    signup_date TIMESTAMPTZ,
    approved_date TIMESTAMPTZ,
    auth_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_supervisors_email ON supervisors(email);
CREATE INDEX idx_supervisors_pending_approval ON supervisors(pending_approval);
```

**Status:** ✅ Complete and properly configured

---

#### ✅ `wizard_progress` Table (COMPLETE)
**Purpose:** Track wizard assessment progress

**Schema:**
```sql
CREATE TABLE wizard_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supervisor_id TEXT,
    supervisor_email TEXT,
    wizard_type TEXT NOT NULL,
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER,
    progress_data JSONB,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_wizard_progress_supervisor ON wizard_progress(supervisor_email);
```

**Status:** ✅ Complete

---

#### ✅ `fleet_vehicles` Table (COMPLETE)
**Purpose:** Fleet vehicle master data

**Schema:**
```sql
CREATE TABLE fleet_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fleet_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    depot TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    registration TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no);
```

**Status:** ✅ Complete

---

### 1.2 Missing Tables

#### ❌ `breakdown_events` Table (CRITICAL - MISSING)
**Purpose:** Audit trail and timeline of breakdown lifecycle events

**Referenced in:**
- `backend/routes/breakdowns.js` (lines 508-520, 571-586, 696-732)
- `backend/routes/activity.js` (lines 93-110, 252-295)
- `frontend/src/services/supabase-integration-service.js` (lines 721-735)

**Required Schema:**
```sql
CREATE TABLE breakdown_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id UUID REFERENCES breakdowns(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    by_badge TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'breakdown_created',
        'wizard_started',
        'wizard_step',
        'wizard_completed',
        'wizard_assessment_completed',
        'location_updated',
        'engineer_assigned',
        'engineer_dispatched',
        'engineer_on_site',
        'status_change',
        'diagnosed',
        'resolved',
        'comment',
        'edit_initiated',
        'edit_completed',
        'decision_changed',
        'sdc_acknowledged'
    ))
);

CREATE INDEX idx_breakdown_events_breakdown_id ON breakdown_events(breakdown_id);
CREATE INDEX idx_breakdown_events_event_type ON breakdown_events(event_type);
CREATE INDEX idx_breakdown_events_occurred_at ON breakdown_events(occurred_at DESC);
CREATE INDEX idx_breakdown_events_by_badge ON breakdown_events(by_badge);
```

**Impact:** High - Audit trail functionality is broken without this table

---

#### ❌ `breakdown_dashboard_cards` Table (MISSING)
**Purpose:** Materialized view for dashboard card presentation

**Referenced in:**
- `backend/routes/breakdowns.js` (lines 923-993, 996-1034)

**Required Schema:**
```sql
CREATE TABLE breakdown_dashboard_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id TEXT UNIQUE NOT NULL,

    -- Display information
    card_title TEXT NOT NULL,
    card_subtitle TEXT,
    status_color TEXT,
    priority_level INTEGER DEFAULT 3,

    -- Key information
    fleet_number TEXT NOT NULL,
    location_display TEXT,
    issue_summary TEXT,
    duration_text TEXT,
    severity_display TEXT,

    -- Action indicators
    requires_immediate_action BOOLEAN DEFAULT false,
    engineering_dispatched BOOLEAN DEFAULT false,
    replacement_vehicle_sent BOOLEAN DEFAULT false,
    service_resumed BOOLEAN DEFAULT false,

    -- Visibility flags
    visible_on_sdc BOOLEAN DEFAULT true,
    visible_on_engineering BOOLEAN DEFAULT false,
    visible_on_management BOOLEAN DEFAULT false,

    -- Metadata
    last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_breakdown
        FOREIGN KEY (breakdown_id)
        REFERENCES breakdowns(breakdown_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_dashboard_cards_breakdown_id ON breakdown_dashboard_cards(breakdown_id);
CREATE INDEX idx_dashboard_cards_priority ON breakdown_dashboard_cards(priority_level);
CREATE INDEX idx_dashboard_cards_sdc_visible ON breakdown_dashboard_cards(visible_on_sdc);
CREATE INDEX idx_dashboard_cards_engineering_visible ON breakdown_dashboard_cards(visible_on_engineering);
```

**Impact:** Medium - Dashboard cards work via API but no caching/materialization

---

#### ❌ `activities` Table (MISSING - HYBRID ARCHITECTURE)
**Purpose:** Unified activity feed for real-time updates

**Referenced in:**
- `backend/routes/activity.js` (lines 7-67, 173-230)
- `backend/routes/breakdownsAPI.js` (data/activities.json file operations)

**Required Schema:**
```sql
CREATE TABLE activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Breakdown reference
    breakdown_id TEXT,
    fleet_no TEXT,
    fleet_number TEXT,

    -- Supervisor information
    supervisor_name TEXT,
    supervisor_badge TEXT,
    supervisor_id TEXT,

    -- Activity details
    message TEXT,
    description TEXT,
    activity_data JSONB,

    -- Wizard specific
    wizard_type TEXT,
    wizard_decision TEXT,
    current_step TEXT,
    step_description TEXT,

    -- Context
    location TEXT,
    route TEXT,
    issue_category TEXT,
    severity TEXT,
    depot TEXT,
    source TEXT DEFAULT 'breakdown_guide',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_activity_type CHECK (activity_type IN (
        'breakdown_reported',
        'wizard_started',
        'wizard_step',
        'wizard_completed',
        'edit_initiated',
        'edit_completed',
        'status_updated',
        'engineer_assigned',
        'resolution_logged',
        'comment_added'
    ))
);

CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_breakdown_id ON activities(breakdown_id);
CREATE INDEX idx_activities_fleet_no ON activities(fleet_no);
CREATE INDEX idx_activities_supervisor_badge ON activities(supervisor_badge);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_source ON activities(source);
```

**Current Implementation:** Uses JSON file `/backend/data/activities.json`

**Impact:** High - Real-time activity tracking relies on file system instead of database

---

#### ⚠️ Supporting Tables (Recommended but not critical)

**`breakdown_location_history`** - Location update audit trail
```sql
CREATE TABLE breakdown_location_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id TEXT NOT NULL,
    location TEXT,
    location_coords GEOMETRY(POINT, 4326),
    location_w3w TEXT,
    location_type TEXT,
    updated_by TEXT,
    update_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`supervisor_sessions`** - Active session tracking
```sql
CREATE TABLE supervisor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    supervisor_badge TEXT NOT NULL,
    supervisor_name TEXT,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Data Relationships and Integrity

### 2.1 Current Foreign Key Relationships

**Status:** ⚠️ INCOMPLETE - No foreign key constraints defined

**Recommended Foreign Keys:**
```sql
-- Link breakdowns to supervisors
ALTER TABLE breakdowns
ADD CONSTRAINT fk_supervisor
FOREIGN KEY (supervisor_badge)
REFERENCES supervisors(badge_number)
ON DELETE SET NULL;

-- Link breakdowns to fleet vehicles
ALTER TABLE breakdowns
ADD CONSTRAINT fk_fleet_vehicle
FOREIGN KEY (fleet_no)
REFERENCES fleet_vehicles(fleet_no)
ON DELETE RESTRICT;

-- Link breakdown_events to breakdowns
ALTER TABLE breakdown_events
ADD CONSTRAINT fk_breakdown
FOREIGN KEY (breakdown_id)
REFERENCES breakdowns(id)
ON DELETE CASCADE;

-- Link activities to breakdowns (soft reference - no constraint)
-- This is intentional as activities may exist before breakdown record
```

### 2.2 Data Integrity Constraints

**Missing Constraints:**
```sql
-- Ensure breakdown_id follows format BD-YYYY-NNNNN
ALTER TABLE breakdowns
ADD CONSTRAINT chk_breakdown_id_format
CHECK (breakdown_id ~ '^BD-\d{4}-\d{5}$');

-- Ensure valid status values
ALTER TABLE breakdowns
ADD CONSTRAINT chk_status
CHECK (status IN (
    'active', 'pending', 'in_progress', 'received',
    'acknowledged', 'decision', 'dispatched',
    'on_site', 'moving', 'cleared', 'resolved'
));

-- Ensure valid severity values
ALTER TABLE breakdowns
ADD CONSTRAINT chk_severity
CHECK (severity IN ('STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER'));

-- Ensure priority level is 1-5
ALTER TABLE breakdowns
ADD CONSTRAINT chk_priority
CHECK (priority_level BETWEEN 1 AND 5);

-- Ensure fleet_no is 4 digits
ALTER TABLE fleet_vehicles
ADD CONSTRAINT chk_fleet_no_format
CHECK (fleet_no ~ '^\d{4}$');

-- Ensure supervisor badge format XX000
ALTER TABLE supervisors
ADD CONSTRAINT chk_badge_format
CHECK (badge_number ~ '^[A-Z]{2}\d{3}$');
```

---

## 3. Data Flow Analysis

### 3.1 Breakdown Creation Flow

**Path:** Frontend Wizard → Backend API → Database

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: Breakdown Guide Wizard                         │
│    - Supervisor completes assessment steps                  │
│    - Collects: fleet_no, location, issue_category, etc.    │
│    - Generates wizard_decision (STOP/AMBER/CONTINUE)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/breakdowns/from-wizard                         │
│    - Generates unique breakdown_id (BD-2025-00001)          │
│    - Inserts into breakdowns table                          │
│    - Creates breakdown_events entry (wizard_completed)      │
│    - Logs to activities (JSON file)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Database: Supabase                                        │
│    - breakdowns table INSERT                                 │
│    - breakdown_events table INSERT ❌ MISSING TABLE         │
│    - Triggers real-time subscription                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Real-time Broadcast                                       │
│    - WebSocket notification to SDC Dashboard                │
│    - Polling fallback updates                               │
│    - localStorage cache update                              │
└─────────────────────────────────────────────────────────────┘
```

**Issues Identified:**
1. ❌ `breakdown_events` table doesn't exist - events not persisted
2. ⚠️ Activities logged to JSON file instead of database
3. ⚠️ No transaction handling - partial failures possible
4. ✅ ID generation is atomic and sequential

---

### 3.2 SDC Dashboard Data Flow

**Path:** SDC Dashboard → API → Database → Real-time Updates

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SDC Dashboard Component Mount                            │
│    - GET /api/breakdowns/live                               │
│    - GET /api/breakdowns/in-progress (assessments)          │
│    - Initialize WebSocket connection                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. breakdownsAPI.js (SDC-specific endpoint)                 │
│    - Query breakdowns table                                 │
│    - Load activities.json ⚠️ FROM FILE SYSTEM              │
│    - Enrich data with assessment progress                   │
│    - Calculate elapsed time, priority, etc.                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Data Transformation                                       │
│    - Normalize field names (fleet_number vs fleet_no)       │
│    - Calculate progress percentages                         │
│    - Determine status colors                                │
│    - Generate recommended actions                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend State Management                                │
│    - React state update (setBreakdowns)                     │
│    - localStorage fallback cache                            │
│    - Real-time subscription listener active                 │
└─────────────────────────────────────────────────────────────┘
```

**Issues Identified:**
1. ⚠️ Assessment data from JSON file - not queryable via SQL
2. ⚠️ Data transformation happens in API layer - duplicated logic
3. ✅ Real-time updates properly configured
4. ⚠️ localStorage used as fallback - can become stale

---

### 3.3 Assessment Progress Tracking Flow

**Current Implementation:** Hybrid (Database + JSON Files)

```
Assessment Started:
1. Frontend: POST /api/wizards/start
2. Backend: INSERT INTO wizard_progress ✅
3. Backend: Write to activities.json ⚠️
4. WebSocket: Broadcast "wizard_started"

Assessment Step Progress:
1. Frontend: POST /api/wizards/step
2. Backend: UPDATE wizard_progress.current_step ✅
3. Backend: APPEND to activities.json ⚠️
4. WebSocket: Broadcast "wizard_step"

Assessment Complete:
1. Frontend: POST /api/breakdowns/from-wizard
2. Backend: INSERT INTO breakdowns ✅
3. Backend: INSERT INTO breakdown_events ❌ MISSING
4. Backend: APPEND to activities.json ⚠️
5. Backend: UPDATE wizard_progress.status = 'completed' ✅
```

**Recommended Flow (Database-Only):**
```sql
-- All assessment tracking in database
1. INSERT INTO wizard_progress
2. INSERT INTO activities (breakdown_started)
3. UPDATE wizard_progress, INSERT INTO activities (step completed)
4. INSERT INTO breakdowns, INSERT INTO breakdown_events
5. Query activities table for real-time feed
```

---

### 3.4 Audit Trail Flow

**Current Implementation:** Broken - Uses missing tables

```
Edit Initiated (SDC):
POST /api/breakdowns/:id/edit
├─ Load from breakdown-counter.json ❌ Should be database
├─ Write to audit-log.json ❌ Should be database table
└─ Write to activities.json ❌ Should be database table

Audit Trail Query:
GET /api/breakdowns/:id/audit
├─ Load audit-log.json ❌
├─ Load activities.json ❌
└─ Merge and return ⚠️ No database persistence
```

**Recommended Flow:**
```sql
-- Proper audit trail in database
1. INSERT INTO breakdown_events (edit_initiated)
2. UPDATE breakdowns SET updated_at = NOW()
3. Query breakdown_events WHERE breakdown_id = :id
4. Return sorted event timeline
```

---

## 4. Query Performance Analysis

### 4.1 Critical Queries

**Query 1: Live Breakdowns for SDC Dashboard**
```sql
-- Current query (backend/routes/breakdowns.js:69-73)
SELECT * FROM breakdowns
WHERE status IN ('active', 'pending', 'in_progress', 'received',
                 'acknowledged', 'decision', 'dispatched',
                 'on_site', 'moving')
ORDER BY created_at DESC;
```

**Performance:**
- ✅ Uses index on created_at
- ⚠️ `status IN (...)` requires index on status field
- ⚠️ Returns all fields - should use SELECT with specific columns

**Optimization:**
```sql
-- Add index
CREATE INDEX idx_breakdowns_status ON breakdowns(status);

-- Optimize query
SELECT
    breakdown_id, fleet_no, location_description,
    status, severity, supervisor_badge, created_at, updated_at
FROM breakdowns
WHERE status IN ('active', 'pending', 'in_progress', 'received',
                 'acknowledged', 'decision', 'dispatched',
                 'on_site', 'moving')
ORDER BY priority_level ASC, created_at DESC
LIMIT 100;
```

---

**Query 2: In-Progress Assessments**
```sql
-- Current implementation: File-based
-- Loads activities.json and filters in-memory

-- Recommended database query
SELECT
    wp.id, wp.supervisor_badge, wp.wizard_type,
    wp.current_step, wp.total_steps, wp.created_at,
    b.breakdown_id, b.fleet_no, b.location_description
FROM wizard_progress wp
LEFT JOIN breakdowns b ON wp.supervisor_email = b.supervisor_email
WHERE wp.status = 'in_progress'
    AND wp.created_at >= NOW() - INTERVAL '30 minutes'
ORDER BY wp.created_at DESC;
```

---

**Query 3: Breakdown with Full Activity History**
```sql
-- Current implementation: Multiple file reads + API calls
-- Recommended database query with proper joins

SELECT
    b.*,
    json_agg(
        json_build_object(
            'id', be.id,
            'event_type', be.event_type,
            'occurred_at', be.occurred_at,
            'by_badge', be.by_badge,
            'event_data', be.event_data
        ) ORDER BY be.occurred_at DESC
    ) AS events
FROM breakdowns b
LEFT JOIN breakdown_events be ON b.id = be.breakdown_id
WHERE b.breakdown_id = 'BD-2025-00001'
GROUP BY b.id;
```

---

### 4.2 Missing Indexes - Priority List

**HIGH PRIORITY:**
```sql
CREATE INDEX idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_severity ON breakdowns(severity);
CREATE INDEX idx_breakdowns_priority_level ON breakdowns(priority_level);
```

**MEDIUM PRIORITY:**
```sql
CREATE INDEX idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
CREATE INDEX idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);
```

**LOW PRIORITY:**
```sql
CREATE INDEX idx_breakdowns_route ON breakdowns(route);
CREATE INDEX idx_breakdowns_wizard_decision ON breakdowns(wizard_decision);
CREATE INDEX idx_breakdowns_engineer_assigned ON breakdowns(engineer_assigned);
```

---

## 5. Data Consistency Issues

### 5.1 Identified Inconsistencies

**Issue 1: Field Name Mismatches**
```javascript
// Database schema uses: fleet_no
// Frontend expects: fleet_number
// API transforms between both

// Solution: Standardize on fleet_no everywhere
```

**Issue 2: Status Values**
```javascript
// Code uses multiple status values not defined in schema:
- 'received', 'acknowledged', 'decision', 'dispatched',
  'on_site', 'moving', 'cleared'

// Schema only has: 'active', 'pending', 'in_progress', 'completed'

// Solution: Add CHECK constraint with all valid values
```

**Issue 3: Supervisor Identification**
```javascript
// Three different fields used:
- supervisor_id (TEXT, no clear format)
- supervisor_email (TEXT, email format)
- supervisor_badge (TEXT, XX000 format)

// Solution: Use supervisor_badge as primary reference
```

---

### 5.2 Data Migration Needs

**Existing Data Cleanup:**
```sql
-- 1. Add missing fields to breakdowns table
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS breakdown_id TEXT;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE breakdowns ADD COLUMN IF NOT EXISTS wizard_decision TEXT;
-- ... (see section 1.1 for full list)

-- 2. Migrate data from JSON files to database
-- Load activities.json into activities table
-- Load audit-log.json into breakdown_events table
-- Load breakdown-counter.json data into breakdowns table

-- 3. Set default values for existing records
UPDATE breakdowns
SET priority_level = CASE
    WHEN severity = 'STOP' THEN 1
    WHEN severity = 'AMBER' THEN 2
    ELSE 3
END
WHERE priority_level IS NULL;

-- 4. Generate breakdown_id for records missing it
UPDATE breakdowns
SET breakdown_id = CONCAT('BD-', EXTRACT(YEAR FROM created_at), '-',
                          LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 5, '0'))
WHERE breakdown_id IS NULL;
```

---

## 6. Recommended Schema Updates

### 6.1 Complete Breakdowns Table Schema

```sql
-- Drop and recreate with all fields
DROP TABLE IF EXISTS breakdowns CASCADE;

CREATE TABLE breakdowns (
    -- Primary keys
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id TEXT UNIQUE NOT NULL,
    daily_id INTEGER,

    -- Vehicle information
    fleet_no TEXT NOT NULL,
    registration TEXT,
    depot TEXT,
    route TEXT,

    -- Supervisor information
    supervisor_badge TEXT,
    supervisor_name TEXT,
    supervisor_email TEXT,
    supervisor_id TEXT,

    -- Location
    location_description TEXT,
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_w3w TEXT,
    location_type TEXT,
    location_verified BOOLEAN DEFAULT false,

    -- Issue details
    issue_category TEXT,
    description TEXT,
    wizard_type TEXT,

    -- Assessment and decision
    severity TEXT,
    wizard_decision TEXT,
    criticality TEXT,
    priority_level INTEGER DEFAULT 3,
    diagnosis TEXT,

    -- Status and workflow
    status TEXT DEFAULT 'received',
    breakdown_source TEXT DEFAULT 'manual',

    -- Wizard data
    wizard_assessment_data JSONB,
    assessment_data JSONB,
    wizard_steps JSONB,
    wizard_responses JSONB,

    -- Actions required
    engineering_required BOOLEAN DEFAULT false,
    replacement_vehicle_required BOOLEAN DEFAULT false,
    passenger_cloud_used BOOLEAN DEFAULT false,
    requires_immediate_action BOOLEAN DEFAULT false,

    -- Engineering assignment
    engineer_assigned TEXT,
    engineer_name TEXT,

    -- Driver information
    driver_name TEXT,
    driver_phone TEXT,
    passenger_count INTEGER,

    -- Dashboard display
    card_title TEXT,
    status_color TEXT,

    -- Timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    received_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    diagnosed_at TIMESTAMPTZ,
    decision_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    on_site_at TIMESTAMPTZ,
    moving_at TIMESTAMPTZ,
    cleared_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Resolution
    resolution_notes TEXT,
    resolving_supervisor TEXT,
    returned_to_service_at TIMESTAMPTZ,

    -- System fields
    archived BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT chk_breakdown_id_format
        CHECK (breakdown_id ~ '^BD-\d{4}-\d{5}$'),
    CONSTRAINT chk_status CHECK (status IN (
        'received', 'active', 'pending', 'in_progress',
        'acknowledged', 'decision', 'dispatched',
        'on_site', 'moving', 'cleared', 'resolved'
    )),
    CONSTRAINT chk_severity CHECK (severity IN (
        'STOP', 'AMBER', 'CONTINUE', 'CHANGEOVER'
    )),
    CONSTRAINT chk_priority CHECK (priority_level BETWEEN 1 AND 5)
);

-- Indexes for performance
CREATE INDEX idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);
CREATE INDEX idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
CREATE INDEX idx_breakdowns_supervisor_email ON breakdowns(supervisor_email);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_severity ON breakdowns(severity);
CREATE INDEX idx_breakdowns_priority_level ON breakdowns(priority_level);
CREATE INDEX idx_breakdowns_created_at ON breakdowns(created_at DESC);
CREATE INDEX idx_breakdowns_depot ON breakdowns(depot);
CREATE INDEX idx_breakdowns_route ON breakdowns(route);
CREATE INDEX idx_breakdowns_wizard_decision ON breakdowns(wizard_decision);
CREATE INDEX idx_breakdowns_archived ON breakdowns(archived);

-- Comments for documentation
COMMENT ON TABLE breakdowns IS 'Core breakdown tracking and management';
COMMENT ON COLUMN breakdowns.breakdown_id IS 'Business identifier format: BD-YYYY-NNNNN';
COMMENT ON COLUMN breakdowns.priority_level IS '1=Critical, 2=High, 3=Normal, 4=Low, 5=Info';
COMMENT ON COLUMN breakdowns.severity IS 'STOP=Immediate stop, AMBER=Changeover, CONTINUE=Safe';
```

---

### 6.2 Create Missing Tables Script

**File:** `/database/migrations/002_create_missing_tables.sql`

```sql
-- ============================================
-- Create breakdown_events table
-- ============================================
CREATE TABLE IF NOT EXISTS breakdown_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id UUID,
    event_type TEXT NOT NULL,
    event_data JSONB,
    by_badge TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_event_type CHECK (event_type IN (
        'breakdown_created', 'wizard_started', 'wizard_step',
        'wizard_completed', 'wizard_assessment_completed',
        'location_updated', 'engineer_assigned', 'engineer_dispatched',
        'engineer_on_site', 'status_change', 'diagnosed',
        'resolved', 'comment', 'edit_initiated', 'edit_completed',
        'decision_changed', 'sdc_acknowledged'
    ))
);

CREATE INDEX idx_breakdown_events_breakdown_id ON breakdown_events(breakdown_id);
CREATE INDEX idx_breakdown_events_event_type ON breakdown_events(event_type);
CREATE INDEX idx_breakdown_events_occurred_at ON breakdown_events(occurred_at DESC);
CREATE INDEX idx_breakdown_events_by_badge ON breakdown_events(by_badge);

COMMENT ON TABLE breakdown_events IS 'Audit trail and timeline of breakdown lifecycle events';

-- ============================================
-- Create activities table
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    breakdown_id TEXT,
    fleet_no TEXT,
    fleet_number TEXT,

    supervisor_name TEXT,
    supervisor_badge TEXT,
    supervisor_id TEXT,

    message TEXT,
    description TEXT,
    activity_data JSONB,

    wizard_type TEXT,
    wizard_decision TEXT,
    current_step TEXT,
    step_description TEXT,

    location TEXT,
    route TEXT,
    issue_category TEXT,
    severity TEXT,
    depot TEXT,
    source TEXT DEFAULT 'breakdown_guide',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_activity_type CHECK (activity_type IN (
        'breakdown_reported', 'wizard_started', 'wizard_step',
        'wizard_completed', 'edit_initiated', 'edit_completed',
        'status_updated', 'engineer_assigned', 'resolution_logged',
        'comment_added'
    ))
);

CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_breakdown_id ON activities(breakdown_id);
CREATE INDEX idx_activities_fleet_no ON activities(fleet_no);
CREATE INDEX idx_activities_supervisor_badge ON activities(supervisor_badge);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_source ON activities(source);

COMMENT ON TABLE activities IS 'Unified activity feed for real-time updates';

-- ============================================
-- Create breakdown_dashboard_cards table
-- ============================================
CREATE TABLE IF NOT EXISTS breakdown_dashboard_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id TEXT UNIQUE NOT NULL,

    card_title TEXT NOT NULL,
    card_subtitle TEXT,
    status_color TEXT,
    priority_level INTEGER DEFAULT 3,

    fleet_number TEXT NOT NULL,
    location_display TEXT,
    issue_summary TEXT,
    duration_text TEXT,
    severity_display TEXT,

    requires_immediate_action BOOLEAN DEFAULT false,
    engineering_dispatched BOOLEAN DEFAULT false,
    replacement_vehicle_sent BOOLEAN DEFAULT false,
    service_resumed BOOLEAN DEFAULT false,

    visible_on_sdc BOOLEAN DEFAULT true,
    visible_on_engineering BOOLEAN DEFAULT false,
    visible_on_management BOOLEAN DEFAULT false,

    last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dashboard_cards_breakdown_id ON breakdown_dashboard_cards(breakdown_id);
CREATE INDEX idx_dashboard_cards_priority ON breakdown_dashboard_cards(priority_level);
CREATE INDEX idx_dashboard_cards_sdc_visible ON breakdown_dashboard_cards(visible_on_sdc);

COMMENT ON TABLE breakdown_dashboard_cards IS 'Materialized view for dashboard card presentation';

-- ============================================
-- Create supporting tables
-- ============================================
CREATE TABLE IF NOT EXISTS supervisor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    supervisor_badge TEXT NOT NULL,
    supervisor_name TEXT,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supervisor_sessions_session_id ON supervisor_sessions(session_id);
CREATE INDEX idx_supervisor_sessions_supervisor_badge ON supervisor_sessions(supervisor_badge);
CREATE INDEX idx_supervisor_sessions_active ON supervisor_sessions(active);

CREATE TABLE IF NOT EXISTS breakdown_location_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    breakdown_id TEXT NOT NULL,
    location TEXT,
    location_coords GEOMETRY(POINT, 4326),
    location_w3w TEXT,
    location_type TEXT,
    updated_by TEXT,
    update_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_history_breakdown_id ON breakdown_location_history(breakdown_id);
CREATE INDEX idx_location_history_created_at ON breakdown_location_history(created_at DESC);
```

---

## 7. Backup and Disaster Recovery

### 7.1 Current State

**Backup Strategy:** ⚠️ Relies on Supabase automated backups

**Issues:**
1. No documented backup schedule
2. No tested restore procedures
3. JSON files in `/backend/data/` not included in database backups
4. No point-in-time recovery testing

---

### 7.2 Recommended Backup Strategy

**Daily Full Backups:**
```bash
#!/bin/bash
# File: /scripts/backup-database.sh

BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="breakdown_guide"

# Backup database
pg_dump "$SUPABASE_DB_URL" \
    --format=custom \
    --file="$BACKUP_DIR/${DB_NAME}_${DATE}.backup"

# Backup JSON data files
tar -czf "$BACKUP_DIR/json_data_${DATE}.tar.gz" \
    /backend/data/*.json

# Retention: Keep 30 days of backups
find "$BACKUP_DIR" -name "*.backup" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

**Retention Policy:**
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

---

### 7.3 Disaster Recovery Procedures

**Recovery Time Objective (RTO):** 2 hours
**Recovery Point Objective (RPO):** 1 hour (based on Supabase PITR)

**Recovery Steps:**

```bash
# 1. Restore from Supabase backup (if available)
# Via Supabase Dashboard: Settings > Database > Restore

# 2. Restore from custom backup
pg_restore --dbname="$SUPABASE_DB_URL" \
    --clean --if-exists \
    /backups/supabase/${DB_NAME}_YYYYMMDD_HHMMSS.backup

# 3. Restore JSON data files
tar -xzf /backups/supabase/json_data_YYYYMMDD_HHMMSS.tar.gz \
    -C /backend/data/

# 4. Verify data integrity
psql "$SUPABASE_DB_URL" -c "
    SELECT COUNT(*) FROM breakdowns;
    SELECT COUNT(*) FROM supervisors;
    SELECT COUNT(*) FROM breakdown_events;
"

# 5. Restart application
pm2 restart breakdown-guide-backend
```

---

## 8. Query Optimization Recommendations

### 8.1 Create Database Views

**View 1: Active Breakdowns with Enriched Data**
```sql
CREATE OR REPLACE VIEW v_active_breakdowns AS
SELECT
    b.breakdown_id,
    b.fleet_no,
    fv.registration,
    fv.make,
    fv.model,
    b.location_description,
    b.route,
    b.issue_category,
    b.status,
    b.severity,
    b.priority_level,
    b.supervisor_badge,
    s.name AS supervisor_name,
    s.depot AS supervisor_depot,
    b.created_at,
    b.acknowledged_at,
    EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 AS elapsed_minutes,
    CASE
        WHEN b.severity = 'STOP' THEN true
        WHEN b.priority_level <= 2 THEN true
        ELSE false
    END AS is_critical,
    b.engineer_assigned IS NOT NULL AS is_dispatched
FROM breakdowns b
LEFT JOIN fleet_vehicles fv ON b.fleet_no = fv.fleet_no
LEFT JOIN supervisors s ON b.supervisor_badge = s.badge_number
WHERE b.status IN ('active', 'pending', 'in_progress', 'received',
                   'acknowledged', 'decision', 'dispatched', 'on_site')
    AND b.archived = false;
```

**View 2: Dashboard Statistics**
```sql
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status != 'cleared') AS active_count,
    COUNT(*) FILTER (WHERE severity = 'STOP') AS critical_count,
    COUNT(*) FILTER (WHERE acknowledged_at IS NULL) AS pending_count,
    COUNT(*) FILTER (WHERE engineer_assigned IS NOT NULL) AS dispatched_count,
    COUNT(DISTINCT supervisor_badge) AS active_supervisors,
    AVG(EXTRACT(EPOCH FROM (COALESCE(acknowledged_at, NOW()) - created_at)) / 60)
        AS avg_response_time_minutes
FROM breakdowns
WHERE created_at >= CURRENT_DATE
    AND archived = false;
```

---

### 8.2 Recommended Stored Procedures

**Procedure 1: Create Breakdown with Full Audit Trail**
```sql
CREATE OR REPLACE FUNCTION create_breakdown_with_audit(
    p_breakdown_data JSONB,
    p_supervisor_badge TEXT
) RETURNS JSONB AS $$
DECLARE
    v_breakdown_id TEXT;
    v_breakdown_uuid UUID;
    v_year INTEGER;
    v_sequence INTEGER;
BEGIN
    -- Generate breakdown ID
    v_year := EXTRACT(YEAR FROM NOW());
    SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_sequence
    FROM breakdowns
    WHERE created_at >= DATE_TRUNC('year', NOW());

    v_breakdown_id := FORMAT('BD-%s-%s', v_year, LPAD(v_sequence::TEXT, 5, '0'));

    -- Insert breakdown
    INSERT INTO breakdowns (
        breakdown_id,
        daily_id,
        fleet_no,
        supervisor_badge,
        supervisor_name,
        location_description,
        issue_category,
        status,
        created_at
    )
    VALUES (
        v_breakdown_id,
        v_sequence,
        p_breakdown_data->>'fleet_no',
        p_supervisor_badge,
        p_breakdown_data->>'supervisor_name',
        p_breakdown_data->>'location',
        p_breakdown_data->>'issue_category',
        'received',
        NOW()
    )
    RETURNING id INTO v_breakdown_uuid;

    -- Create audit event
    INSERT INTO breakdown_events (
        breakdown_id,
        event_type,
        event_data,
        by_badge,
        occurred_at
    )
    VALUES (
        v_breakdown_uuid,
        'breakdown_created',
        p_breakdown_data,
        p_supervisor_badge,
        NOW()
    );

    -- Create activity
    INSERT INTO activities (
        activity_type,
        breakdown_id,
        fleet_no,
        supervisor_badge,
        supervisor_name,
        message,
        source
    )
    VALUES (
        'breakdown_reported',
        v_breakdown_id,
        p_breakdown_data->>'fleet_no',
        p_supervisor_badge,
        p_breakdown_data->>'supervisor_name',
        FORMAT('Breakdown reported for fleet %s', p_breakdown_data->>'fleet_no'),
        'api'
    );

    RETURN jsonb_build_object(
        'success', true,
        'breakdown_id', v_breakdown_id,
        'breakdown_uuid', v_breakdown_uuid,
        'sequence', v_sequence
    );
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Monitoring and Alerting

### 9.1 Database Health Metrics

**Key Metrics to Monitor:**

1. **Query Performance:**
```sql
-- Slow query monitoring
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries taking > 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

2. **Table Growth:**
```sql
-- Monitor table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

3. **Index Usage:**
```sql
-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

### 9.2 Alert Thresholds

**Critical Alerts:**
- Database connection failures: Immediate notification
- Query time > 5 seconds: Alert ops team
- Table size growth > 50% in 24 hours: Investigate

**Warning Alerts:**
- Active connections > 80% of pool: Scale warning
- Slow queries (> 1 second): Log for optimization
- Lock wait time > 10 seconds: Check for deadlocks

---

## 10. Migration Roadmap

### Phase 1: Schema Completion (Week 1)
1. Add missing fields to `breakdowns` table
2. Create `breakdown_events` table
3. Create `activities` table
4. Create `breakdown_dashboard_cards` table
5. Add all recommended indexes

### Phase 2: Data Migration (Week 2)
1. Migrate `activities.json` → `activities` table
2. Migrate `audit-log.json` → `breakdown_events` table
3. Validate data integrity
4. Create database views

### Phase 3: Code Updates (Week 3-4)
1. Update API endpoints to use new tables
2. Remove JSON file dependencies
3. Add transaction handling
4. Implement stored procedures

### Phase 4: Testing and Validation (Week 5)
1. Load testing with production data volumes
2. Backup/restore testing
3. Failover testing
4. Performance benchmarking

### Phase 5: Deployment (Week 6)
1. Deploy to staging environment
2. Run parallel systems for 1 week
3. Deploy to production with rollback plan
4. Monitor for 48 hours

---

## 11. Summary and Action Items

### Critical Issues (Fix Immediately)

1. ❌ **Create `breakdown_events` table** - Audit trail is broken
2. ❌ **Create `activities` table** - Real-time feed relies on file system
3. ❌ **Add missing fields to `breakdowns`** - Schema incomplete
4. ⚠️ **Add indexes** - Query performance is suboptimal

### High Priority (Fix Within 2 Weeks)

1. ⚠️ **Migrate JSON files to database** - Single source of truth
2. ⚠️ **Add foreign key constraints** - Data integrity
3. ⚠️ **Create database views** - Simplified querying
4. ⚠️ **Implement backup procedures** - Disaster recovery

### Medium Priority (Fix Within 4 Weeks)

1. 📝 **Create stored procedures** - Atomic operations
2. 📝 **Standardize field names** - Consistency across layers
3. 📝 **Add CHECK constraints** - Data validation
4. 📝 **Setup monitoring** - Proactive issue detection

### Low Priority (Enhancement)

1. 💡 **Implement connection pooling** - Performance optimization
2. 💡 **Add database triggers** - Automated workflows
3. 💡 **Create materialized views** - Faster dashboard queries
4. 💡 **Implement partitioning** - Long-term scalability

---

## Appendix A: Complete Schema Migration Script

**File:** `/database/migrations/complete-schema-update.sql`

See Section 6 for complete SQL scripts.

---

## Appendix B: API Endpoint Data Flow Map

```
Breakdown Creation Flow:
POST /api/breakdowns/from-wizard
  ├─ generateId() → breakdown_id
  ├─ INSERT breakdowns
  ├─ INSERT breakdown_events ❌ MISSING TABLE
  ├─ activityLogger.logBreakdownReported()
  │   └─ INSERT activities ❌ MISSING TABLE
  └─ broadcastToSDCDashboard()

SDC Dashboard Data Fetch:
GET /api/breakdowns/live
  ├─ SELECT FROM breakdowns WHERE status IN (...)
  ├─ Load activities.json ⚠️ FILE SYSTEM
  ├─ Enrich with assessment data
  └─ Return formatted JSON

Assessment Progress:
GET /api/breakdowns/in-progress
  ├─ Load activities.json ⚠️ FILE SYSTEM
  ├─ Filter wizard_started without wizard_completed
  ├─ Calculate progress percentages
  └─ Return active assessments

Audit Trail:
GET /api/breakdowns/:id/audit
  ├─ Load audit-log.json ⚠️ FILE SYSTEM
  ├─ Load activities.json ⚠️ FILE SYSTEM
  ├─ Merge and sort events
  └─ Return timeline
```

---

**Report Generated:** 2025-10-02
**Analyst:** Anthony Gair
**Review Status:** Ready for Technical Review

---

## Next Steps

1. Review this analysis with development team
2. Prioritize fixes based on impact and effort
3. Create detailed implementation plan
4. Schedule migration windows
5. Begin Phase 1 implementation

For questions or clarifications, please refer to the specific sections above or request additional analysis.
