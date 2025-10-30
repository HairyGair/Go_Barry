# Go BARRY - Developer Quick Reference Guide

**Version:** 2.0.0
**Last Updated:** October 27, 2025
**Status:** Production Ready

---

## Table of Contents

1. [API Base URLs](#1-api-base-urls)
2. [Authentication](#2-authentication)
3. [All API Endpoints (165+)](#3-all-api-endpoints)
4. [WebSocket Real-Time (5 Channels)](#4-websocket-real-time)
5. [Database Tables (15+)](#5-database-tables)
6. [Environment Variables](#6-environment-variables)
7. [Common Operations](#7-common-operations)
8. [Error Codes](#8-error-codes)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. API Base URLs

### Production
```
Primary:    https://breakdowns.gobarry.co.uk
Alternate:  https://breakdowns.gobarry.co.uk
Domain:     https://gobarry.co.uk
```

### Development
```
Local:      http://localhost:3001
Network:    http://192.168.1.132:3001
```

### WebSocket URLs
```
Production: wss://breakdowns.gobarry.co.uk/ws
Local:      ws://localhost:3001/ws
```

---

## 2. Authentication

### Badge-Based Login (JWT Tokens)

Go BARRY uses badge-based authentication where supervisors log in with their badge number (e.g., AG003, BP009) and a password. The system issues JWT tokens for authenticated sessions.

**Real Supervisors in Production:**
- AG003, BP009 (Admins)
- Other active supervisor badges from the supervisors table

### Login Flow

```bash
# Step 1: Login and get JWT token
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@gobarry.co.uk",
    "password": "your_password"
  }'

# Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "supervisor@gobarry.co.uk",
    "name": "Alice Green",
    "badge_number": "AG003",
    "role": "admin",
    "depot": "Washington"
  },
  "expires_at": "2025-10-28T12:00:00.000Z"
}
```

### Using JWT Token in Requests

```bash
# Add token to Authorization header
curl -X GET https://breakdowns.gobarry.co.uk/api/breakdowns/live \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Validate Token

```bash
curl -X GET https://breakdowns.gobarry.co.uk/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Logout

```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 3. All API Endpoints

**Total Endpoints:** 165+
**Route Files:** 14
**Database:** MySQL with query builder

### Category 1: Authentication & Supervisors (21 endpoints)

```
POST   /api/auth/login                    - User login
POST   /api/auth/logout                   - User logout
POST   /api/auth/signup                   - New supervisor signup
POST   /api/auth/supervisor-signup        - Existing supervisor account activation
GET    /api/auth/validate                 - Validate JWT token
POST   /api/auth/verify                   - Verify session with username
GET    /api/auth/supervisors              - Get all active supervisors
GET    /api/auth/user/:id                 - Get specific user by ID
GET    /api/auth/supervisor/:username     - Get supervisor by username
GET    /api/auth/depots                   - Get list of all depots
GET    /api/auth/recent-sessions          - Get recently active supervisors
GET    /api/auth/pending-signups          - Get pending supervisor approvals (Admin)
POST   /api/auth/approve-signup           - Approve/reject signup (Admin)
PUT    /api/auth/supervisor/:id           - Update supervisor details (Admin)
POST   /api/auth/change-password          - Change password
POST   /api/auth/admin/reset-password     - Admin password reset (Admin)
GET    /api/supervisors/:id/stats         - Get supervisor performance stats
GET    /api/supervisors                   - Get all supervisors with filtering
```

**Example: Get all supervisors**
```bash
curl https://breakdowns.gobarry.co.uk/api/auth/supervisors
```

---

### Category 2: Breakdowns & Tracking (42 endpoints)

```
GET    /api/breakdowns                              - Get all breakdowns (paginated)
GET    /api/breakdowns/active                       - Get only active breakdowns
GET    /api/breakdowns/live                         - Get active breakdowns (dashboard)
POST   /api/breakdowns                              - Create new breakdown
GET    /api/breakdowns/:breakdown_id                - Get specific breakdown
PUT    /api/breakdowns/:breakdown_id                - Update breakdown
DELETE /api/breakdowns/:breakdown_id                - Cancel/delete breakdown
PATCH  /api/breakdowns/:breakdown_id/status         - Update status only
POST   /api/breakdowns/:breakdown_id/acknowledge    - Acknowledge breakdown
POST   /api/breakdowns/:breakdown_id/decision       - Record assessment decision
POST   /api/breakdowns/:breakdown_id/notes          - Add notes
POST   /api/breakdowns/:breakdown_id/request-engineering  - Request engineer
POST   /api/breakdowns/:breakdown_id/resolve        - Mark as resolved
POST   /api/breakdowns/acknowledge                  - Acknowledge multiple
POST   /api/breakdowns/record-decision              - Record assessment decision
POST   /api/breakdowns/add-note                     - Add audit note
POST   /api/breakdowns/request-engineering          - Request engineering
GET    /api/breakdowns/breakdown-counters           - Get breakdown statistics
POST   /api/breakdowns/export                       - Export to CSV/JSON
GET    /api/breakdowns/search                       - Search breakdowns
POST   /api/breakdowns/bulk-update                  - Update multiple breakdowns
GET    /api/breakdowns/fleet/:fleet_no              - Get all breakdowns for vehicle
POST   /api/breakdowns/batch-import                 - Import breakdowns
GET    /api/breakdowns/audit-log/:breakdown_id      - Get audit trail
```

**Example: Get live breakdowns**
```bash
curl https://breakdowns.gobarry.co.uk/api/breakdowns/live
```

**Example: Create breakdown**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_no": "6127",
    "supervisor_name": "Alice Green",
    "supervisor_badge": "AG003",
    "wizard_type": "Non-Starter",
    "location_lat": 54.9783,
    "location_lng": -1.6178,
    "location_address": "Newcastle upon Tyne",
    "assessment_data": {
      "decision": "STOP",
      "severity": "critical",
      "issue_category": "Engine"
    }
  }'
```

---

### Category 3: Fleet Management (11 endpoints)

```
GET    /api/fleet                          - Get all fleet vehicles
GET    /api/fleet/vehicles                 - Alias for fleet endpoint
GET    /api/fleet/search/:term             - Quick search vehicles
GET    /api/fleet/vehicle/:fleetNumber     - Get specific vehicle
GET    /api/fleet/:fleetNumber             - Alias for vehicle detail
GET    /api/fleet/depots/list              - Get depot list
GET    /api/fleet/types/list               - Get vehicle types
GET    /api/fleet/stats/summary            - Fleet statistics
PUT    /api/fleet/:fleetNumber             - Update vehicle
PATCH  /api/fleet/:fleetNumber/status      - Update vehicle status only
```

**Example: Search fleet**
```bash
curl "https://breakdowns.gobarry.co.uk/api/fleet?search=6127&depot=Washington"
```

**Example: Get vehicle details**
```bash
curl https://breakdowns.gobarry.co.uk/api/fleet/vehicle/6127
```

---

### Category 4: Activity & Audit Logging (18 endpoints)

```
GET    /api/activity/feed                  - Unified activity feed
GET    /api/activity/feed/legacy           - Legacy activity feed (fallback)
GET    /api/activity/live                  - Recent activity stream (5 min)
GET    /api/activity/live/legacy           - Legacy live stream (fallback)
GET    /api/activity/breakdown-guide       - Breakdown Guide activities
POST   /api/activity/log                   - Log new activity
POST   /api/activity/batch                 - Log multiple activities
GET    /api/activity/search                - Search activities
GET    /api/activity/stats                 - Activity statistics
DELETE /api/activity/:id                   - Delete activity
```

**Example: Get activity feed**
```bash
curl "https://breakdowns.gobarry.co.uk/api/activity/feed?limit=50&depot=Washington"
```

**Example: Log activity**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/activity/log \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "wizard_completed",
    "action": "Completed breakdown assessment",
    "actorType": "supervisor",
    "actorId": "AG003",
    "actorName": "Alice Green",
    "entityType": "breakdown",
    "entityId": "BD-2025-001",
    "depot": "Washington",
    "severity": "high"
  }'
```

---

### Category 5: Engineering & Field Operations (32 endpoints)

```
GET    /api/engineering/depot-stats                  - Depot performance stats
GET    /api/engineering/engineers                    - All active engineers
GET    /api/engineering/metrics                      - Engineering performance metrics
GET    /api/engineering/engineers/available/:depotId - Available engineers by depot
POST   /api/engineering/assign                       - Assign engineer (simplified)
POST   /api/engineering/update-engineer-status       - Update engineer job status
POST   /api/engineering/auto-assign                  - Auto-assign engineer
PUT    /api/engineering/assignment/:id/status        - Update assignment status
GET    /api/engineering/breakdown/:id/assignments    - Get assignments for breakdown
GET    /api/engineering/performance                  - Performance metrics
GET    /api/engineering/sla                          - SLA metrics
GET    /api/engineering/teams                        - Get engineering teams
POST   /api/engineering/accept-job                   - Accept job
PUT    /api/engineering/update-status                - Update job status
POST   /api/engineering/complete-job                 - Complete job
GET    /api/engineering/jobs                         - Get job queue
GET    /api/engineering/job/:breakdown_id            - Get specific job
GET    /api/engineering/vehicle-history/:fleet_no    - Vehicle breakdown history
```

**Example: Get engineering jobs**
```bash
curl https://breakdowns.gobarry.co.uk/api/engineering/jobs
```

**Example: Assign engineer**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/engineering/assign \
  -H "Content-Type: application/json" \
  -d '{
    "breakdown_id": "BD-2025-001",
    "estimated_arrival_minutes": 20,
    "assigned_by": "AG003"
  }'
```

---

### Category 6: Defects & Maintenance Intelligence (8 endpoints)

```
POST   /api/defects/repeat               - Find repeat defects
POST   /api/defects/trends               - Analyze defect trends
GET    /api/defects/depot-stats          - Get depot defect statistics
GET    /api/defects/predictive           - Predictive maintenance alerts
POST   /api/defects/escalate             - Escalate defect issue
GET    /api/defects/vehicle/:fleet_no    - Get vehicle defect history
GET    /api/defects/fleet-health         - Overall fleet health metrics
POST   /api/defects/notifications        - Send defect notifications
```

**Example: Find repeat defects**
```bash
curl -X POST https://breakdowns.gobarry.co.uk/api/defects/repeat \
  -H "Content-Type: application/json" \
  -d '{
    "timeframe": "7d",
    "min_occurrences": 3
  }'
```

---

### Category 7: Analytics & Reporting (15 endpoints)

```
GET    /api/analytics/kpis                   - Performance KPIs
GET    /api/analytics/trends                 - Trend analysis
GET    /api/analytics/depot-comparison       - Compare depot performance
GET    /api/analytics/breakdown-trends       - Breakdown trend analysis
GET    /api/analytics/supervisor-performance - Supervisor performance metrics
GET    /api/analytics/fleet-health           - Fleet health overview
POST   /api/analytics/custom-report          - Generate custom report
GET    /api/analytics/period-summary         - Period summary stats
GET    /api/analytics/resolution-times       - Resolution time metrics
GET    /api/analytics/sla-compliance         - SLA compliance metrics
```

**Example: Get KPIs**
```bash
curl "https://breakdowns.gobarry.co.uk/api/analytics/kpis?period=week"
```

---

### Category 8: Wizard & Assessment Tracking (5 endpoints)

```
GET    /api/wizards/types                - Get available wizard types
POST   /api/wizards/start                - Start wizard assessment
PUT    /api/wizards/progress             - Update wizard progress
POST   /api/wizards/complete             - Complete wizard assessment
GET    /api/wizards/active               - Get active wizard sessions
```

---

### Category 9: User Preferences & Settings (6 endpoints)

```
GET    /api/preferences/:supervisor_id   - Get user preferences
PUT    /api/preferences/:supervisor_id   - Update preferences
POST   /api/preferences/reset            - Reset to defaults
POST   /api/preferences/import           - Import preferences
GET    /api/preferences/export           - Export preferences
DELETE /api/preferences/:supervisor_id   - Delete preferences
```

---

### Category 10: Public & Display APIs (7 endpoints)

```
GET    /api/public/breakdowns/live       - Live breakdowns (no auth)
GET    /api/public/breakdowns/stats      - Breakdown statistics (no auth)
GET    /api/public/fleet                 - Fleet data (no auth)
GET    /api/public/depots                - Depot list (no auth)
GET    /health                           - Health check (no auth)
GET    /api/health/extended              - Extended health check (no auth)
POST   /api/health/test                  - Test endpoint (no auth)
```

**Example: Control Room Display data**
```bash
curl https://breakdowns.gobarry.co.uk/api/public/breakdowns/live
```

---

## 4. WebSocket Real-Time

**Technology:** Native WebSocket (ws library), NOT Convex
**Total Channels:** 5
**Connection URL:** `wss://breakdowns.gobarry.co.uk/ws?channel=CHANNEL_NAME&token=JWT_TOKEN`

### 4.1 Protected Channels (Require JWT Token)

#### Channel: `sdc-dashboard`
**Purpose:** Real-time updates for SDC Operations Dashboard
**Auth:** JWT token required
**Events:**
- `assessment_started` - Wizard begins
- `assessment_progress` - Step completed
- `assessment_completed` - Wizard finishes
- `breakdown_created` - New breakdown
- `breakdown_updated` - Breakdown status change
- `engineer_assigned` - Engineer dispatched

**Connection Example:**
```javascript
const ws = new WebSocket(
  'wss://breakdowns.gobarry.co.uk/ws?channel=sdc-dashboard&token=YOUR_JWT_TOKEN'
);

ws.onopen = () => {
  console.log('Connected to SDC Dashboard');
  // Subscribe to specific events
  ws.send(JSON.stringify({ type: 'subscribe', events: ['breakdown_created'] }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);

  if (data.type === 'breakdown_created') {
    // Handle new breakdown
    console.log('New breakdown:', data.breakdown);
  }
};
```

#### Channel: `breakdowns`
**Purpose:** Breakdown status updates
**Auth:** JWT token required
**Events:**
- `breakdown_created`
- `breakdown_updated`
- `breakdown_resolved`
- `status_change`

#### Channel: `assessment-progress`
**Purpose:** Real-time wizard assessment tracking
**Auth:** JWT token required
**Events:**
- `wizard_started`
- `wizard_step`
- `wizard_completed`

---

### 4.2 Public Channels (No Authentication)

#### Channel: `control-room`
**Purpose:** Public display screens (Control Room Display)
**Auth:** None
**Events:**
- `breakdown_update` - General breakdown updates
- `stats_update` - Statistics refresh

**Connection Example:**
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws?channel=control-room');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'breakdown_update') {
    updateDisplay(data.breakdowns);
  }
};
```

#### Channel: `defect-intelligence`
**Purpose:** Defect alerts and maintenance intelligence
**Auth:** None
**Events:**
- `NEW_REPEAT_DEFECT` - Vehicle with 3+ defects
- `TREND_UPDATE` - Defect trends rising (15%+ increase)
- `CRITICAL_PATTERN` - 5+ vehicles, same issue, 24h
- `DEPOT_STATS_UPDATE` - Depot spike (>25% increase, 5+ defects)
- `PREDICTIVE_ALERT` - ML-detected pattern
- `DEFECT_ESCALATED` - Manual escalation

**Connection Example:**
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws?channel=defect-intelligence');

ws.onmessage = (event) => {
  const alert = JSON.parse(event.data);

  if (alert.type === 'NEW_REPEAT_DEFECT') {
    console.warn(`ALERT: Vehicle ${alert.fleet_no} has repeat defect: ${alert.defect_type}`);
  }

  if (alert.type === 'CRITICAL_PATTERN') {
    console.error(`CRITICAL: ${alert.affected_vehicles} vehicles with ${alert.defect_type}`);
  }
};
```

---

### 4.3 WebSocket Message Format

**Client → Server Messages:**
```javascript
// Subscribe to channel
{ type: "subscribe", channel: "breakdowns" }

// Unsubscribe from channel
{ type: "unsubscribe", channel: "breakdowns" }

// Ping (keep-alive)
{ type: "ping" }

// Get status
{ type: "get_status" }
```

**Server → Client Messages:**
```javascript
// Event broadcast
{
  type: "breakdown_created",
  breakdown: {
    breakdown_id: "BD-2025-001",
    fleet_number: "6127",
    location: "Newcastle",
    severity: "critical"
  },
  timestamp: "2025-10-27T12:00:00.000Z"
}

// Error
{
  type: "error",
  error: "Authentication required",
  code: "WS_AUTH_REQUIRED",
  timestamp: "2025-10-27T12:00:00.000Z"
}

// Pong (heartbeat response)
{
  type: "pong",
  timestamp: "2025-10-27T12:00:00.000Z"
}
```

---

### 4.4 WebSocket Configuration

**Timeouts:**
- Heartbeat interval: 30 seconds
- Connection timeout: 10 seconds
- Reconnect attempts: 5
- Reconnect interval: 3 seconds (exponential backoff)

**Limits:**
- Max concurrent connections: ~100 (2GB RAM limit)
- Max message size: 10MB
- Ping interval: 30 seconds

---

## 5. Database Tables

**Database:** MySQL (gobarryco_breakdowns)
**Total Tables:** 15+
**Connection Pool:** 10 connections max

### Core Tables

#### 1. `supervisors`
**Purpose:** User authentication and management
**Key Fields:**
- `id` (UUID) - Primary key
- `email` (TEXT) - Unique login email
- `name` (TEXT) - Full name
- `badge_number` (TEXT) - Badge ID (e.g., AG003)
- `depot` (TEXT) - Assigned depot
- `role` (TEXT) - admin, supervisor, manager
- `is_active` (BOOLEAN) - Account status
- `pending_approval` (BOOLEAN) - Signup approval status
- `auth_user_id` (UUID) - Auth system reference

#### 2. `breakdowns`
**Purpose:** Core breakdown tracking
**Key Fields:**
- `id` (UUID) - Primary key
- `breakdown_id` (TEXT) - Business identifier (e.g., BD-2025-001)
- `fleet_no` (TEXT) - Vehicle fleet number
- `registration` (TEXT) - Vehicle registration
- `depot` (TEXT) - Depot assignment
- `route` (TEXT) - Route number
- `status` (TEXT) - active, resolved, cancelled
- `severity` (TEXT) - STOP, AMBER, CONTINUE
- `wizard_type` (TEXT) - Assessment wizard used
- `wizard_decision` (TEXT) - Assessment outcome
- `supervisor_id`, `supervisor_email`, `supervisor_name`, `supervisor_badge` (TEXT)
- `location_lat`, `location_lng` (DECIMAL) - GPS coordinates
- `location_address` (TEXT) - Human-readable location
- `assessment_data` (JSONB) - Full wizard responses
- `created_at`, `updated_at`, `completed_at` (TIMESTAMPTZ)

#### 3. `activities`
**Purpose:** Unified activity feed and audit trail
**Key Fields:**
- `id` (UUID) - Primary key
- `activity_type` (TEXT) - Event type
- `timestamp` (TIMESTAMPTZ) - Event time
- `breakdown_id` (TEXT) - Related breakdown
- `fleet_no`, `fleet_number` (TEXT) - Related vehicle
- `supervisor_name`, `supervisor_badge` (TEXT) - Actor
- `message`, `description` (TEXT) - Activity details
- `activity_data` (JSONB) - Additional data
- `wizard_type`, `wizard_decision` (TEXT) - Wizard info
- `depot` (TEXT) - Depot filter
- `severity` (TEXT) - Activity severity

#### 4. `fleet_vehicles`
**Purpose:** Vehicle master data
**Key Fields:**
- `id` (UUID) - Primary key
- `fleet_no` (TEXT) - Fleet number (unique)
- `vehicle_type` (TEXT) - Vehicle type
- `depot` (TEXT) - Home depot
- `make`, `model` (TEXT) - Vehicle details
- `year` (INTEGER) - Manufacturing year
- `registration` (TEXT) - Registration number
- `is_active` (BOOLEAN) - Active status

#### 5. `engineers`
**Purpose:** Engineering staff management
**Key Fields:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Engineer name
- `depot` (TEXT) - Home depot
- `phone` (TEXT) - Contact number
- `status` (TEXT) - available, assigned, unavailable
- `is_active` (BOOLEAN) - Employment status

#### 6. `wizard_progress`
**Purpose:** Track wizard assessment progress
**Key Fields:**
- `id` (UUID) - Primary key
- `supervisor_id`, `supervisor_email` (TEXT) - Supervisor
- `wizard_type` (TEXT) - Wizard name
- `current_step` (INTEGER) - Progress tracker
- `total_steps` (INTEGER) - Total wizard steps
- `progress_data` (JSONB) - Step responses
- `status` (TEXT) - in_progress, completed, cancelled

#### 7. `breakdown_events`
**Purpose:** Audit trail of breakdown lifecycle events
**Key Fields:**
- `id` (UUID) - Primary key
- `breakdown_id` (UUID) - Foreign key to breakdowns
- `event_type` (TEXT) - Event category
- `event_data` (JSONB) - Event details
- `by_badge` (TEXT) - Actor badge
- `occurred_at` (TIMESTAMPTZ) - Event timestamp

#### 8. `user_preferences`
**Purpose:** User settings and customization
**Key Fields:**
- `id` (UUID) - Primary key
- `supervisor_id` (UUID) - Foreign key to supervisors
- `preferences` (JSONB) - Settings data
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### 9. `depots`
**Purpose:** Depot master data
**Key Fields:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Depot name (e.g., Washington, Riverside)
- `address` (TEXT) - Physical address
- `is_active` (BOOLEAN) - Operational status

---

### Supporting Tables

#### 10. `engineer_assignments`
**Purpose:** Track engineer job assignments

#### 11. `breakdown_notes`
**Purpose:** Notes and comments on breakdowns

#### 12. `performance_metrics`
**Purpose:** Historical KPI data

#### 13. `defect_patterns`
**Purpose:** Identified defect patterns and trends

#### 14. `audit_log`
**Purpose:** Security and compliance audit trail

#### 15. `sessions`
**Purpose:** Active user sessions (JWT tracking)

---

### Database Indexes (Performance-Critical)

```sql
-- Breakdowns
CREATE INDEX idx_breakdowns_breakdown_id ON breakdowns(breakdown_id);
CREATE INDEX idx_breakdowns_fleet_no ON breakdowns(fleet_no);
CREATE INDEX idx_breakdowns_status ON breakdowns(status);
CREATE INDEX idx_breakdowns_supervisor_badge ON breakdowns(supervisor_badge);
CREATE INDEX idx_breakdowns_created_at ON breakdowns(created_at DESC);

-- Activities
CREATE INDEX idx_activities_breakdown_id ON activities(breakdown_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX idx_activities_supervisor_badge ON activities(supervisor_badge);

-- Supervisors
CREATE INDEX idx_supervisors_email ON supervisors(email);
CREATE INDEX idx_supervisors_badge_number ON supervisors(badge_number);
CREATE INDEX idx_supervisors_pending_approval ON supervisors(pending_approval);

-- Fleet
CREATE INDEX idx_fleet_vehicles_fleet_no ON fleet_vehicles(fleet_no);
CREATE INDEX idx_fleet_vehicles_depot ON fleet_vehicles(depot);
```

---

## 6. Environment Variables

**Required Configuration:**

```bash
# =============================================================================
# NODE.JS CONFIGURATION
# =============================================================================
NODE_ENV=production
PORT=3001

# Memory limit for shared hosting (if needed)
NODE_OPTIONS=--no-experimental-fetch --max-old-space-size=512

# =============================================================================
# DATABASE - MySQL (cPanel Hosting)
# =============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gobarryco_breakdowns
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Connection pool settings
MYSQL_CONNECTION_LIMIT=10

# =============================================================================
# SECURITY - JWT Authentication
# =============================================================================
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRES_IN=24h

# Session secret
SESSION_SECRET=your_session_secret_here_change_in_production

# =============================================================================
# API CONFIGURATION
# =============================================================================
# Backend API URL
API_BASE_URL=https://breakdowns.gobarry.co.uk/api

# Frontend App URL
APP_URL=https://breakdowns.gobarry.co.uk

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://breakdowns.gobarry.co.uk,https://gobarry.co.uk

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# FEATURE FLAGS
# =============================================================================
ENABLE_AUTH=false
ENABLE_MOCK_DATA=false

# =============================================================================
# OPTIONAL INTEGRATIONS
# =============================================================================
# TomTom Traffic API
# TOMTOM_API_KEY=your_tomtom_api_key

# HERE Maps API
# HERE_API_KEY=your_here_api_key

# National Highways API
# NATIONAL_HIGHWAYS_API_KEY=your_api_key
```

---

## 7. Common Operations

### 7.1 Authentication Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supervisor@gobarry.co.uk","password":"password123"}' \
  | jq -r '.token')

# 2. Use token in subsequent requests
curl -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/breakdowns/live

# 3. Validate token
curl -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/auth/validate

# 4. Logout
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://breakdowns.gobarry.co.uk/api/auth/logout
```

---

### 7.2 Breakdown Lifecycle

```bash
# 1. Create breakdown
curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns \
  -H "Content-Type: application/json" \
  -d '{
    "fleet_no": "6127",
    "supervisor_name": "Alice Green",
    "supervisor_badge": "AG003",
    "wizard_type": "Non-Starter",
    "location_lat": 54.9783,
    "location_lng": -1.6178,
    "location_address": "Newcastle upon Tyne",
    "assessment_data": {
      "decision": "STOP",
      "severity": "critical"
    }
  }'

# 2. Acknowledge breakdown
curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns/BD-2025-001/acknowledge \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledged_by": "BP009",
    "notes": "Engineer dispatched"
  }'

# 3. Request engineering
curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns/BD-2025-001/request-engineering \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "high",
    "eta_minutes": 20,
    "notes": "Non-starter, battery issue suspected",
    "depot": "Washington"
  }'

# 4. Resolve breakdown
curl -X POST https://breakdowns.gobarry.co.uk/api/breakdowns/BD-2025-001/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolved_by": "ENG001",
    "resolution_type": "repaired",
    "resolution_notes": "Battery replaced, vehicle back in service"
  }'
```

---

### 7.3 Fleet Operations

```bash
# Search fleet by number
curl "https://breakdowns.gobarry.co.uk/api/fleet?search=6127"

# Get vehicle details
curl https://breakdowns.gobarry.co.uk/api/fleet/vehicle/6127

# Get all Washington depot vehicles
curl "https://breakdowns.gobarry.co.uk/api/fleet?depot=Washington&limit=100"

# Get vehicle breakdown history
curl https://breakdowns.gobarry.co.uk/api/breakdowns/fleet/6127

# Get fleet statistics
curl https://breakdowns.gobarry.co.uk/api/fleet/stats/summary
```

---

### 7.4 Real-Time Monitoring

```bash
# Get live breakdowns
curl https://breakdowns.gobarry.co.uk/api/breakdowns/live

# Get activity feed
curl "https://breakdowns.gobarry.co.uk/api/activity/feed?limit=50"

# Get recent activity (last 5 minutes)
curl "https://breakdowns.gobarry.co.uk/api/activity/live?since=2025-10-27T12:00:00Z"

# Get breakdown counters
curl https://breakdowns.gobarry.co.uk/api/breakdowns/breakdown-counters
```

---

### 7.5 Analytics & Reporting

```bash
# Get KPIs for current week
curl "https://breakdowns.gobarry.co.uk/api/analytics/kpis?period=week"

# Compare depot performance
curl https://breakdowns.gobarry.co.uk/api/analytics/depot-comparison

# Get breakdown trends
curl "https://breakdowns.gobarry.co.uk/api/analytics/breakdown-trends?period=month"

# Get supervisor performance stats
curl https://breakdowns.gobarry.co.uk/api/supervisors/AG003/stats?period=week

# Find repeat defects (7 days)
curl -X POST https://breakdowns.gobarry.co.uk/api/defects/repeat \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"7d","min_occurrences":3}'
```

---

### 7.6 Engineering Workflow

```bash
# Get engineering job queue
curl https://breakdowns.gobarry.co.uk/api/engineering/jobs

# Get job details
curl https://breakdowns.gobarry.co.uk/api/engineering/job/BD-2025-001

# Accept job
curl -X POST https://breakdowns.gobarry.co.uk/api/engineering/accept-job \
  -H "Content-Type: application/json" \
  -d '{
    "breakdown_id": "BD-2025-001",
    "engineer_id": "ENG001",
    "estimated_arrival": "2025-10-27T12:30:00Z"
  }'

# Complete job
curl -X POST https://breakdowns.gobarry.co.uk/api/engineering/complete-job \
  -H "Content-Type: application/json" \
  -d '{
    "breakdown_id": "BD-2025-001",
    "engineer_id": "ENG001",
    "resolution": "repaired",
    "notes": "Battery replaced"
  }'
```

---

### 7.7 Health Checks

```bash
# Basic health check
curl https://breakdowns.gobarry.co.uk/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "service": "breakdown-guide-api",
  "database": {
    "type": "mysql",
    "status": "connected",
    "host": "localhost",
    "name": "gobarryco_breakdowns"
  }
}

# Extended health check
curl https://breakdowns.gobarry.co.uk/api/health/extended
```

---

## 8. Error Codes

### Authentication Errors

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `AUTH_TOKEN_MISSING` | 401 | No JWT provided | Add `Authorization: Bearer TOKEN` header |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired | Login again to get new token |
| `AUTH_TOKEN_INVALID` | 401 | JWT malformed or tampered | Verify token format and secret |
| `AUTH_USER_INACTIVE` | 403 | Account disabled | Contact admin to activate account |
| `AUTH_USER_NOT_FOUND` | 404 | User doesn't exist | Check email/credentials |
| `AUTH_CREDENTIALS_INVALID` | 401 | Wrong password | Verify password |
| `AUTH_REQUIRED` | 401 | Endpoint requires auth | Login first |

### WebSocket Errors

| Code | Meaning | Solution |
|------|---------|----------|
| `WS_AUTH_REQUIRED` | Channel requires token | Add `?token=JWT` to WebSocket URL |
| `WS_AUTH_INVALID` | Invalid token | Get fresh JWT from login |
| `WS_SDC_AUTH_FORBIDDEN` | Not SDC operator | Use correct supervisor credentials |
| `WS_CONNECTION_CLOSED` | Connection dropped | Reconnect with exponential backoff |

### Rate Limiting

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait for `Retry-After` header time |
| `SDC_RATE_LIMIT_EXCEEDED` | 429 | SDC ops limit hit | Max 100 ops/15 min, slow down |

### Validation Errors

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `VALIDATION_ERROR` | 400 | Invalid input | Check request body against schema |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing | Add missing field |
| `INVALID_BREAKDOWN_ID` | 400 | Breakdown ID format wrong | Use format: BD-YYYY-NNN |
| `INVALID_FLEET_NUMBER` | 400 | Fleet number not found | Verify vehicle exists |

### Database Errors

| Code | HTTP Status | Meaning | Solution |
|------|-------------|---------|----------|
| `DB_CONNECTION_ERROR` | 503 | Database unavailable | Check MySQL connection |
| `DB_QUERY_ERROR` | 500 | Query failed | Check logs for SQL errors |
| `RECORD_NOT_FOUND` | 404 | Resource doesn't exist | Verify ID is correct |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violated | Check for existing record |

---

## 9. Troubleshooting

### 9.1 WebSocket Connection Issues

**Problem:** WebSocket won't connect
**Symptoms:** Connection closes immediately, timeout errors
**Solutions:**
1. **Check JWT token validity:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://breakdowns.gobarry.co.uk/api/auth/validate
   ```
2. **Verify token in URL:** `?token=YOUR_TOKEN`
3. **Check CORS origins** in server config
4. **Check browser console** for WebSocket errors
5. **Test with public channel first:** `control-room` or `defect-intelligence`

**Example Debug:**
```javascript
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws?channel=control-room');

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
};
```

---

### 9.2 Authentication Problems

**Problem:** Login fails or token rejected
**Symptoms:** 401 errors, "Invalid credentials"
**Solutions:**
1. **Verify email format:** Must be valid email
2. **Check password:** Minimum 8 characters
3. **Verify account is active:** `is_active = true` in database
4. **Check pending approval:** New accounts need admin approval
5. **Test with known good credentials:** AG003 or BP009

**Debug Steps:**
```bash
# 1. Check if user exists
curl https://breakdowns.gobarry.co.uk/api/auth/supervisors

# 2. Try login with known credentials
curl -X POST https://breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gobarry.co.uk","password":"password"}'

# 3. If token received, validate it
curl -H "Authorization: Bearer TOKEN" \
  https://breakdowns.gobarry.co.uk/api/auth/validate
```

---

### 9.3 Database Connection Errors

**Problem:** Database unavailable, query failures
**Symptoms:** 503 errors, "Database connection error"
**Solutions:**
1. **Check MySQL is running:**
   ```bash
   mysql -h localhost -u DB_USER -p DB_NAME
   ```
2. **Verify connection pool not exhausted:** Max 10 connections
3. **Check environment variables:**
   ```bash
   echo $DB_HOST $DB_NAME $DB_USER
   ```
4. **Test health endpoint:**
   ```bash
   curl https://breakdowns.gobarry.co.uk/health
   ```
5. **Check MySQL logs** for connection errors

---

### 9.4 Slow API Response Times

**Problem:** Requests taking >2 seconds
**Symptoms:** Timeouts, laggy UI
**Solutions:**
1. **Check database indexes:** Run `EXPLAIN` on slow queries
2. **Monitor connection pool usage:** May need to increase limit
3. **Use pagination:** Limit results to 50-100 items
4. **Check memory usage:** 2GB limit on production
5. **Cache frequent queries:** Fleet data, depot lists

**Performance Tips:**
- Use `?limit=50` for large datasets
- Filter by depot when possible: `?depot=Washington`
- Use `/api/breakdowns/live` instead of `/api/breakdowns` for dashboards
- Cache static data (fleet vehicles, depots) in frontend

---

### 9.5 Missing Real-Time Updates

**Problem:** Changes not appearing in real-time
**Symptoms:** Stale data, manual refresh needed
**Solutions:**
1. **Check WebSocket connection status** in browser DevTools
2. **Verify activity feed polling** (5-second interval)
3. **Check if event broadcast was triggered** in backend logs
4. **Test with public channel:** `defect-intelligence` should work without auth
5. **Verify JWT not expired:** Tokens expire after 24 hours

**Debug Real-Time:**
```javascript
// Check WebSocket status
const ws = new WebSocket('wss://breakdowns.gobarry.co.uk/ws?channel=sdc-dashboard&token=TOKEN');

ws.onopen = () => console.log('✅ Connected');
ws.onmessage = (e) => console.log('📨 Message:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('🔌 Closed:', e.code, e.reason);
```

---

### 9.6 Memory Issues (Production)

**Problem:** API crashes, out of memory
**Symptoms:** 503 errors, slow response, restarts
**Solutions:**
1. **Check memory usage:**
   ```bash
   node --max-old-space-size=512 server.js
   ```
2. **Limit connection pool:** Max 10 connections
3. **Clean up WebSocket connections:** Max ~100 concurrent
4. **Avoid large JSON responses:** Use pagination
5. **Monitor with health checks:**
   ```bash
   curl https://breakdowns.gobarry.co.uk/health
   ```

**Memory Limits:**
- cPanel: 2GB RAM
- Node.js heap: 512MB recommended
- Connection pool: 10 connections
- WebSocket connections: ~100 concurrent

---

### 9.7 CORS Errors

**Problem:** Browser blocks requests
**Symptoms:** "CORS policy" errors in console
**Solutions:**
1. **Verify origin in ALLOWED_ORIGINS:**
   ```bash
   ALLOWED_ORIGINS=http://localhost:5173,https://breakdowns.gobarry.co.uk
   ```
2. **Check request includes credentials:**
   ```javascript
   fetch(url, { credentials: 'include' })
   ```
3. **Add origin to server config** if needed
4. **Test with curl** (bypasses CORS):
   ```bash
   curl -H "Origin: https://gobarry.co.uk" \
     https://breakdowns.gobarry.co.uk/api/breakdowns/live
   ```

---

### 9.8 Common Error Messages and Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| "JWT malformed" | Invalid token format | Re-login to get new token |
| "WebAssembly memory error" | Node.js option missing | Add `NODE_OPTIONS=--no-experimental-fetch` |
| "Connection pool exhausted" | Too many queries | Increase pool or optimize queries |
| "Breakdown not found" | Invalid ID | Verify breakdown_id format |
| "Unauthorized access" | Missing/expired token | Login and use fresh token |
| "Rate limit exceeded" | Too many requests | Wait 15 minutes or reduce frequency |
| "Database connection timeout" | MySQL down | Check MySQL service |

---

## Quick Reference Card

**Most Used Endpoints:**
```
GET    /api/breakdowns/live           # Live breakdowns
GET    /api/activity/feed             # Activity feed
POST   /api/auth/login                # Login
GET    /api/fleet/vehicle/:fleetNo    # Vehicle details
POST   /api/breakdowns                # Create breakdown
GET    /health                        # Health check
```

**WebSocket Channels:**
```
wss://breakdowns.gobarry.co.uk/ws?channel=sdc-dashboard&token=JWT      (protected)
wss://breakdowns.gobarry.co.uk/ws?channel=control-room                 (public)
wss://breakdowns.gobarry.co.uk/ws?channel=defect-intelligence          (public)
```

**Key Supervisors (Production):**
```
AG003 (Alice Green)    - Admin, Washington
BP009 (Bob Parker)     - Admin, Washington
```

---

**Document Version:** 2.0.0
**Generated:** October 27, 2025
**Full API Audit:** COMPLETE_API_ENDPOINT_AUDIT.md (1041 lines)
**Real-Time Analysis:** REALTIME_ANALYSIS_INDEX.md
**Database Schema:** DATABASE_ANALYSIS_REPORT.md

---

**For Production Deployment:**
- Test all 165+ endpoints with production data
- Configure rate limiting on auth endpoints
- Set up monitoring and alerting
- Update CORS for deployment domains
- Run load tests (1000 concurrent users)
- Configure backup/recovery strategy

**Support:** See TROUBLESHOOTING.md for extended debugging guides
