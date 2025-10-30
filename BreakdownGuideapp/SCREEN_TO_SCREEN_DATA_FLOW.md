# Screen-to-Screen Data Flow Documentation - Go BARRY System

**Generated**: October 27, 2025
**System**: Go BARRY (Bus Alerts and Roadworks Reporting for You)
**Purpose**: Complete mapping of data flow between all user-facing screens

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [Breakdown Creation Flow](#breakdown-creation-flow)
4. [View Breakdowns Flow](#view-breakdowns-flow)
5. [Assessment Wizard Flow](#assessment-wizard-flow)
6. [Engineering Dispatch Flow](#engineering-dispatch-flow)
7. [Admin Operations Flow](#admin-operations-flow)
8. [Real-Time Update Flows](#real-time-update-flows)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Issues & Recommendations](#issues-and-recommendations)

---

## System Overview

### Core Technology Stack

**Frontend**:
- Framework: React 18 (via Create React App)
- Routing: React Router v6
- State Management: React Context API + Local State
- Real-Time: WebSocket (ws library) + HTTP Polling
- Location: `/frontend/src/`

**Backend**:
- Framework: Express.js 4.18.2 on Node.js 18+
- Database: MySQL 8.0+
- Real-Time: Native WebSocket Server
- Authentication: JWT + MySQL
- Location: `/backend/`

### Key Frontend Components

| Component | File Path | Purpose |
|-----------|-----------|---------|
| `App.jsx` | `/frontend/src/App.jsx` | Main application router and layout |
| `HomePage` | `/frontend/src/components/HomePage.jsx` | Operations Centre landing page |
| `MySQLLoginPage` | `/frontend/src/components/MySQLLoginPage.jsx` | Authentication screen |
| `BreakdownGuideApp` | `/frontend/src/breakdown-guide/App.jsx` | Wizard assessment system |
| `ControlRoomDisplay` | `/frontend/src/dashboards/control-room/ControlRoomDisplay.jsx` | Live breakdown display |
| `SDCDashboard` | `/frontend/src/dashboards/sdc/SDCDashboard.jsx` | Supervisor operations dashboard |
| `EngineeringDashboard` | `/frontend/src/dashboards/engineering/EngineeringDashboard.jsx` | Engineering job queue |
| `ManagementDashboard` | `/frontend/src/dashboards/management/ManagementDashboard.jsx` | KPI and analytics view |

### Key Backend Routes

| Route File | Base Path | Endpoints | Purpose |
|------------|-----------|-----------|---------|
| `auth.js` | `/api/auth` | 16 endpoints | Authentication, supervisor management |
| `breakdowns.js` | `/api/breakdowns` | 25+ endpoints | Breakdown CRUD operations |
| `activity.js` | `/api/activity` | 10 endpoints | Activity feed and logging |
| `fleet.js` | `/api/fleet` | 11 endpoints | Fleet vehicle management |
| `engineering.js` | `/api/engineering` | 18 endpoints | Engineering dispatch and tracking |
| `defects.js` | `/api/defects` | 8 endpoints | Defect intelligence |
| `analytics.js` | `/api/analytics` | 5 endpoints | KPI and performance metrics |
| `webSocketHandler.js` | `/ws` | 5 channels | Real-time event broadcasting |

---

## Authentication Flow

### Flow: Login → Operations Centre

```
┌──────────────────────────────────────────────────────────────┐
│ SCREEN 1: Login Page                                          │
│ Component: MySQLLoginPage.jsx                                 │
│ Route: /login                                                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Submit credentials
                            │ Event: form.onSubmit()
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                       │
│ Endpoint: POST /api/auth/login                                │
│ Payload: { email: string, password: string }                  │
│ Rate Limit: 5 attempts per 15 minutes                         │
│ Authentication: None (public endpoint)                        │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                            │
│ File: /backend/routes/auth.js (line 45-98)                   │
│                                                               │
│ 1. Extract email & password from request body                │
│ 2. Query MySQL: SELECT * FROM supervisors WHERE email = ?    │
│ 3. Verify password: bcrypt.compare(password, hashedPassword) │
│ 4. Check is_active = 1                                       │
│ 5. Generate JWT token: jwt.sign({ email, id, role })         │
│ 6. Log activity: activityLogger.logLogin(user)               │
│ 7. Return token + user data                                  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ Status: 200 OK                                                │
│ Body: {                                                       │
│   success: true,                                              │
│   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",         │
│   expires_at: "2025-10-28T19:00:00.000Z",                    │
│   user: {                                                     │
│     id: 1,                                                    │
│     email: "supervisor@gobarry.co.uk",                        │
│     name: "John Smith",                                       │
│     badge_number: "AG003",                                    │
│     depot: "Riverside",                                       │
│     role: "supervisor"                                        │
│   }                                                           │
│ }                                                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND STATE UPDATE                                         │
│ Service: AuthContext.jsx (line 120-145)                      │
│                                                               │
│ 1. Store token in sessionStorage (key: 'auth_token')         │
│ 2. Store user in sessionStorage (key: 'current_user')        │
│ 3. Update AuthContext state:                                 │
│    - isAuthenticated = true                                  │
│    - currentUser = user object                               │
│    - token = JWT token                                       │
│ 4. Initialize WebSocket connection with token                │
│ 5. Navigate to: /                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ WEBSOCKET CONNECTION                                          │
│ Service: websocket.js (useWebSocket hook)                    │
│                                                               │
│ 1. Connect to: ws://backend/ws?channel=sdc-dashboard&token=JWT│
│ 2. Server verifies token (webSocketHandler.js line 69-95)   │
│ 3. Client receives: { type: 'connected', clientId, user }   │
│ 4. Subscribe to channels: ['sdc-dashboard', 'breakdowns']   │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN 2: Operations Centre (HomePage)                       │
│ Component: HomePage.jsx                                       │
│ Route: /                                                      │
│                                                               │
│ ON MOUNT (useEffect):                                         │
│ 1. Call fetchDashboardData() - loads stats & activity        │
│ 2. Start polling interval: 30s for dashboard updates         │
│ 3. WebSocket listener active for real-time events            │
│                                                               │
│ VISIBLE DATA:                                                 │
│ - Active Breakdowns count (from stats)                       │
│ - Today's Total breakdowns                                   │
│ - Average Response Time                                      │
│ - Fleet Health Score                                         │
│ - Live Activity Feed (polling every 5s)                      │
│                                                               │
│ NAVIGATION OPTIONS:                                           │
│ - "Breakdown Guide" → /breakdown-guide                       │
│ - "Control Room" → /dashboards/control-room                  │
│ - "Engineering" → /dashboards/engineering (if admin)         │
│ - "Management" → /dashboards/management (if admin)           │
│ - "SDC Dashboard" → /dashboards/sdc                          │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Data Dependencies

**Token Flow**:
```
Login Response → sessionStorage → AuthContext → HTTP Headers → All API Calls
                             └──→ WebSocket URL → WebSocket Connection
```

**Session Validation** (on page load/refresh):
```
App.jsx (mount)
  ↓
AuthContext useEffect
  ↓
Check sessionStorage for 'auth_token'
  ↓
If found: GET /api/auth/validate (with Bearer token)
  ↓
Response validates token, returns user
  ↓
Set isAuthenticated = true, currentUser = user
  ↓
Render authenticated routes
```

**Missing Real-Time Feature**: Login/logout events are NOT broadcast via WebSocket. Other supervisors don't see when someone logs in.

---

## Breakdown Creation Flow

### Flow: Operations Centre → Breakdown Guide → Wizard → Confirmation

```
┌──────────────────────────────────────────────────────────────┐
│ STARTING SCREEN: Operations Centre (HomePage)                │
│ Component: HomePage.jsx                                       │
│ Route: /                                                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Click "Breakdown Guide" button
                            │ Event: navigate('/breakdown-guide')
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Breakdown Guide Landing                              │
│ Component: BreakdownGuideApp.jsx                             │
│ Route: /breakdown-guide                                      │
│                                                               │
│ STATE INITIALIZATION:                                         │
│ 1. Check supervisorSession from sessionStorage               │
│ 2. If not authenticated: redirect to /login                  │
│ 3. Initialize assessment state:                              │
│    - currentWizard = null                                    │
│    - currentStep = 1                                         │
│    - responses = {}                                          │
│    - assessmentId = null                                     │
│    - selectedVehicle = null                                  │
│                                                               │
│ VISIBLE:                                                      │
│ - Issue category grid (25+ categories)                       │
│ - "Start New Assessment" button                              │
│ - Recent assessments list                                    │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Select issue category (e.g., "Steering")
                            │ Event: handleIssueSelect('steering')
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MODAL: Fleet Selection                                       │
│ Component: FleetSelectionModal.jsx                           │
│                                                               │
│ API CALL:                                                     │
│ GET /api/fleet?search=&depot=&page=1&limit=100               │
│ Response: { data: [vehicles...], pagination }                │
│                                                               │
│ USER SELECTS VEHICLE:                                         │
│ - Fleet number (e.g., "6332")                                │
│ - Type: "Enviro 400"                                         │
│ - Depot: "Riverside"                                         │
│ - Status: "In Service"                                       │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Select vehicle, click "Continue"
                            │ Event: handleVehicleSelect(vehicle)
                            │ State Update: setSelectedVehicle(vehicle)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MODAL: Location Capture                                      │
│ Component: LocationModal.jsx                                 │
│                                                               │
│ LOCATION METHODS:                                             │
│ 1. GPS Capture (if available)                                │
│    - navigator.geolocation.getCurrentPosition()              │
│ 2. Manual Entry                                              │
│    - Street address input                                    │
│    - What3Words input                                        │
│ 3. Route/Stop Selection                                      │
│    - Select from GTFS route data                             │
│                                                               │
│ VALIDATION:                                                   │
│ - Requires at least one location method                      │
│ - Validates lat/lng if GPS used                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Confirm location
                            │ State Update: setBreakdownLocation(location)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Wizard Assessment (e.g., SteeringWizard)            │
│ Component: SteeringWizard.jsx                                │
│ Route: /breakdown-guide (state-driven wizard display)        │
│                                                               │
│ INITIALIZATION:                                               │
│ 1. Generate assessmentId (UUID)                              │
│ 2. Set assessmentStartTime (Date.now())                      │
│ 3. Load wizard flow from diagnostic-flows-complete.js        │
│ 4. Initialize WebSocket progress tracking                    │
│                                                               │
│ WIZARD STEPS (example for Steering):                         │
│ Step 1: Initial checks                                       │
│   Q: "Is the power steering warning light on?"               │
│   Options: ["Yes", "No"]                                     │
│                                                               │
│ Step 2: Steering feel                                        │
│   Q: "How does the steering feel?"                           │
│   Options: ["Heavy", "Normal", "Loose", "Unresponsive"]     │
│                                                               │
│ Step 3: Noise assessment                                     │
│   Q: "Are there any unusual noises?"                         │
│   Options: ["Grinding", "Whining", "Knocking", "None"]      │
│                                                               │
│ [... continues through wizard logic tree ...]                │
│                                                               │
│ PROGRESS TRACKING (each step):                               │
│ - Save response to local state                               │
│ - Broadcast via WebSocket: assessment_progress event         │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ After each step: Progress update
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ WEBSOCKET BROADCAST (each step completion)                   │
│ Service: assessmentBroadcaster.js                            │
│                                                               │
│ Event: 'assessment_progress'                                 │
│ Payload: {                                                    │
│   type: 'assessment_progress',                               │
│   assessmentId: "uuid",                                      │
│   wizardType: "steering",                                    │
│   currentStep: 2,                                            │
│   totalSteps: 7,                                             │
│   lastResponse: { question: "...", answer: "..." },         │
│   timestamp: "2025-10-27T18:30:00Z",                         │
│   supervisor: {                                              │
│     name: "John Smith",                                      │
│     badge: "AG003"                                           │
│   }                                                          │
│ }                                                            │
│                                                               │
│ Broadcast to: 'sdc-dashboard' channel                        │
│ Recipients: All connected SDC Dashboard viewers              │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User completes wizard
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Assessment Summary                                   │
│ Component: AssessmentSummary.jsx                             │
│                                                               │
│ DISPLAYS:                                                     │
│ - All Q&A from wizard                                        │
│ - AI-generated decision recommendation                       │
│ - Severity assessment (Critical/High/Medium/Low)             │
│ - Recommended actions                                        │
│ - Estimated time to repair                                   │
│                                                               │
│ SUPERVISOR DECISION:                                          │
│ - "Continue in Service" (with monitoring notes)              │
│ - "Off Road - Repair Required"                               │
│ - "Off Road - Investigate Further"                           │
│ - "Off Road - Scrap/Write Off"                               │
│                                                               │
│ Additional fields:                                            │
│ - Supervisor notes (required)                                │
│ - Priority override (optional)                               │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Confirm decision, click "Submit"
                            │ Event: handleSubmit()
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL: Create Breakdown                                   │
│ Endpoint: POST /api/breakdowns                               │
│ Authentication: Bearer token in header                       │
│ Payload: {                                                    │
│   fleet_number: "6332",                                      │
│   depot: "Riverside",                                        │
│   location: {                                                │
│     lat: 54.9783,                                            │
│     lng: -1.6178,                                            │
│     address: "Gateshead Interchange",                        │
│     what3words: "///narrow.fence.repair"                     │
│   },                                                         │
│   issue_category: "Steering",                                │
│   severity: "high",                                          │
│   wizard_type: "steering",                                   │
│   wizard_assessment_data: {                                  │
│     steps: [...all wizard responses...],                     │
│     decision: "Off Road - Repair Required",                  │
│     recommendation: "Power steering failure...",             │
│     estimatedRepairTime: "2 hours"                           │
│   },                                                         │
│   supervisor_name: "John Smith",                             │
│   supervisor_badge: "AG003",                                 │
│   supervisor_id: 1,                                          │
│   assessment_id: "uuid",                                     │
│   notes: "Driver reports heavy steering...",                 │
│   reported_at: "2025-10-27T18:35:00Z"                        │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                            │
│ File: /backend/routes/breakdowns.js (POST / handler)        │
│                                                               │
│ 1. Validate request body                                     │
│ 2. Generate unique breakdown_id (BD-20251027-001)            │
│ 3. INSERT INTO breakdowns (...all fields...)                 │
│ 4. Log activity: activityLogger.logBreakdownReported()       │
│ 5. Check for critical patterns:                              │
│    - Same defect on 5+ vehicles in 24h?                      │
│    - Same vehicle 3+ breakdowns in 24h?                      │
│    - Depot spike >25%?                                       │
│ 6. If critical: broadcast defect alert                       │
│ 7. Broadcast breakdown_created event to WebSocket            │
│ 8. Return breakdown object with ID                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ Status: 201 Created                                           │
│ Body: {                                                       │
│   success: true,                                              │
│   breakdown_id: "BD-20251027-001",                           │
│   status: "reported",                                         │
│   created_at: "2025-10-27T18:35:12Z",                        │
│   breakdown: {                                                │
│     id: 123,                                                  │
│     breakdown_id: "BD-20251027-001",                         │
│     fleet_number: "6332",                                    │
│     depot: "Riverside",                                      │
│     status: "reported",                                      │
│     severity: "high",                                        │
│     issue_category: "Steering",                              │
│     ... [full breakdown object]                              │
│   }                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ WEBSOCKET BROADCAST                                           │
│ Service: webSocketHandler.js (broadcastBreakdownCreated)    │
│                                                               │
│ Event: 'breakdown_created'                                   │
│ Channels: ['sdc-dashboard', 'breakdowns', 'control-room']   │
│ Payload: {                                                    │
│   type: 'breakdown_created',                                 │
│   breakdown: { ...full breakdown object... },                │
│   timestamp: "2025-10-27T18:35:12Z"                          │
│ }                                                            │
│                                                               │
│ Recipients: ALL connected clients on these channels          │
│ Latency: 50-200ms                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Completion Confirmation                              │
│ Component: BreakdownGuideCompletion.jsx                      │
│                                                               │
│ DISPLAYS:                                                     │
│ - ✅ "Breakdown Reported Successfully"                        │
│ - Breakdown ID: BD-20251027-001                              │
│ - Vehicle: 6332 (Enviro 400)                                 │
│ - Status: Reported - Awaiting Dispatch                       │
│ - Decision: Off Road - Repair Required                       │
│ - Engineering: Not yet assigned                              │
│                                                               │
│ ACTIONS:                                                      │
│ - "View in Control Room" → /dashboards/control-room         │
│ - "Start Another Assessment" → Reset wizard state            │
│ - "Back to Home" → /                                         │
│                                                               │
│ AUTO-NAVIGATE: After 5 seconds → /                          │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ SIMULTANEOUS UPDATE (WebSocket)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ ALL CONNECTED SCREENS UPDATE IN REAL-TIME:                   │
│                                                               │
│ 1. Control Room Display                                      │
│    - New breakdown appears in live list                      │
│    - Card shows: BD-20251027-001, 6332, Steering, High      │
│    - Status: Reported (red indicator)                        │
│                                                               │
│ 2. SDC Dashboard                                             │
│    - Assessment complete notification                        │
│    - Breakdown added to queue                                │
│    - Activity feed updates                                   │
│                                                               │
│ 3. Operations Centre (HomePage)                              │
│    - Active Breakdowns count increments                      │
│    - Activity feed shows "Breakdown Reported" event          │
│                                                               │
│ 4. Engineering Dashboard (if open)                           │
│    - New job appears in "Unassigned" queue                   │
│    - Alert notification (if critical)                        │
└──────────────────────────────────────────────────────────────┘
```

### Data Persistence Points

**Local State** (during wizard):
- `BreakdownGuideApp` component state
- Persists wizard responses in memory
- Lost on page refresh (intentional)

**Backend Database**:
- `breakdowns` table: Full breakdown record
- `activities` table: Event log entry
- `breakdown_events` table: WebSocket event log

**Real-Time Sync**:
- WebSocket broadcasts ensure all screens update within 50-200ms
- No polling required for real-time features

---

## View Breakdowns Flow

### Flow: Operations Centre → Control Room Display → Breakdown Details

```
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Operations Centre (HomePage)                         │
│ Component: HomePage.jsx                                       │
│ Route: /                                                      │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Click "Control Room" in nav
                            │ Event: navigate('/dashboards/control-room')
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Control Room Display                                 │
│ Component: ControlRoomDisplay.jsx                            │
│ Route: /dashboards/control-room                              │
│                                                               │
│ ON MOUNT (useEffect):                                         │
│ 1. API Call: GET /api/public/breakdowns/live                 │
│ 2. WebSocket: Connect to 'control-room' channel (public)    │
│ 3. Start polling: every 30s refresh                          │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ Endpoint: GET /api/public/breakdowns/live                    │
│ Authentication: None (public endpoint)                       │
│ Query Params: None                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                            │
│ File: /backend/routes/public.js (GET /breakdowns/live)      │
│                                                               │
│ 1. Query MySQL:                                               │
│    SELECT * FROM breakdowns                                   │
│    WHERE status IN ('reported', 'acknowledged', 'dispatched',│
│                     'on_site', 'repairing')                  │
│    ORDER BY                                                   │
│      CASE severity                                           │
│        WHEN 'critical' THEN 1                                │
│        WHEN 'high' THEN 2                                    │
│        WHEN 'medium' THEN 3                                  │
│        WHEN 'low' THEN 4                                     │
│      END,                                                    │
│      reported_at DESC                                        │
│    LIMIT 50                                                  │
│                                                               │
│ 2. Calculate elapsed time for each breakdown                 │
│ 3. Format for display (assessment_data parsing)             │
│ 4. Add SLA status indicators                                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ Status: 200 OK                                                │
│ Body: {                                                       │
│   breakdowns: [                                               │
│     {                                                         │
│       id: 123,                                                │
│       breakdown_id: "BD-20251027-001",                       │
│       fleet_number: "6332",                                  │
│       depot: "Riverside",                                    │
│       issue_category: "Steering",                            │
│       severity: "high",                                      │
│       status: "reported",                                    │
│       reported_at: "2025-10-27T18:35:12Z",                   │
│       elapsed_time: "12m",                                   │
│       location: {                                            │
│         address: "Gateshead Interchange",                    │
│         lat: 54.9783, lng: -1.6178                          │
│       },                                                     │
│       supervisor_name: "John Smith",                         │
│       supervisor_badge: "AG003",                             │
│       assessment_summary: "Power steering failure...",       │
│       sla_status: "on_track"                                 │
│     },                                                        │
│     // ... more breakdowns                                   │
│   ],                                                         │
│   count: 8,                                                  │
│   last_updated: "2025-10-27T18:47:00Z"                       │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN UPDATE: Control Room Display                          │
│                                                               │
│ LAYOUT:                                                       │
│ ┌────────────────────────────────────────────────┐          │
│ │ ACTIVE BREAKDOWNS (8)          🔴 LIVE         │          │
│ ├────────────────────────────────────────────────┤          │
│ │                                                 │          │
│ │ ┌─────────────────────────────────────────┐   │          │
│ │ │ 🚨 BD-20251027-001    HIGH PRIORITY    │   │          │
│ │ │ Fleet: 6332 (Enviro 400)               │   │          │
│ │ │ Depot: Riverside                        │   │          │
│ │ │ Issue: Steering                         │   │          │
│ │ │ Status: REPORTED • 12m elapsed          │   │          │
│ │ │ Location: Gateshead Interchange         │   │          │
│ │ │ Supervisor: John Smith (AG003)          │   │          │
│ │ │                                         │   │          │
│ │ │ [View Details] [Assign Engineer]       │   │          │
│ │ └─────────────────────────────────────────┘   │          │
│ │                                                 │          │
│ │ ┌─────────────────────────────────────────┐   │          │
│ │ │ 🔧 BD-20251027-002    MEDIUM           │   │          │
│ │ │ ... (next breakdown card)               │   │          │
│ │ └─────────────────────────────────────────┘   │          │
│ │                                                 │          │
│ └────────────────────────────────────────────────┘          │
│                                                               │
│ FILTERS (top bar):                                           │
│ - All Depots / Riverside / Consett / Hexham                 │
│ - All Severities / Critical / High / Medium / Low           │
│ - All Statuses / Reported / Dispatched / On Site            │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Click "View Details" on breakdown
                            │ Event: handleViewDetails(breakdown)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MODAL/SLIDE-OUT: Breakdown Details                          │
│ Component: BreakdownDetailsPanel.jsx (inline in Control Room)│
│                                                               │
│ API CALL:                                                     │
│ GET /api/breakdowns/:breakdown_id                            │
│ Authentication: Bearer token (if logged in, optional)        │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ Body: {                                                       │
│   breakdown: {                                                │
│     ... [all breakdown fields] ...,                          │
│     wizard_assessment_data: {                                │
│       steps: [                                               │
│         {                                                    │
│           question: "Is the power steering warning light on?",│
│           answer: "Yes",                                     │
│           timestamp: "2025-10-27T18:30:05Z"                  │
│         },                                                   │
│         ... [all wizard steps]                               │
│       ],                                                     │
│       decision: "Off Road - Repair Required",                │
│       recommendation: "Power steering pump failure..."       │
│     },                                                       │
│     activities: [                                            │
│       {                                                      │
│         type: "breakdown_reported",                          │
│         timestamp: "2025-10-27T18:35:12Z",                   │
│         actor: "John Smith (AG003)"                          │
│       }                                                      │
│     ]                                                        │
│   }                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ DETAILS PANEL DISPLAY                                         │
│                                                               │
│ TABS:                                                         │
│ 1. Overview                                                   │
│    - Breakdown ID, Fleet, Depot, Status                      │
│    - Timeline visualization                                  │
│    - Current location (map if available)                     │
│                                                               │
│ 2. Assessment Details                                         │
│    - All wizard Q&A                                          │
│    - Decision rationale                                      │
│    - Supervisor notes                                        │
│                                                               │
│ 3. Engineering                                                │
│    - Assignment status                                       │
│    - Estimated arrival time                                  │
│    - Parts required                                          │
│                                                               │
│ 4. Activity Log                                               │
│    - Chronological event list                                │
│    - Who did what when                                       │
│                                                               │
│ ACTIONS (if authenticated supervisor):                       │
│ - "Acknowledge" (if status = reported)                       │
│ - "Assign Engineer" (opens dispatch modal)                   │
│ - "Add Note"                                                 │
│ - "Update Status"                                            │
└──────────────────────────────────────────────────────────────┘
```

### WebSocket Real-Time Updates

**While viewing Control Room Display**:

```
Control Room component useEffect:
  ↓
Connect WebSocket to 'control-room' channel
  ↓
Listen for events:
  - breakdown_created → Add new card to display (no refresh)
  - breakdown_updated → Update existing card
  - engineer_assigned → Update status badge
  - breakdown_resolved → Remove from display (fade out)
  ↓
Update local state immediately (50-200ms latency)
  ↓
Re-render only affected cards (React optimization)
```

### Filter & Search Flow

```
User Action: Change filter (e.g., select "Riverside" depot)
  ↓
Update local state: selectedDepot = "Riverside"
  ↓
Filter breakdowns array client-side (no API call)
  ↓
Re-render filtered list
```

**Note**: Filters are client-side only. All breakdowns are loaded once, then filtered in memory.

---

## Assessment Wizard Flow

### Detailed Step-by-Step Wizard Navigation

```
┌──────────────────────────────────────────────────────────────┐
│ WIZARD START: Issue Selected + Vehicle + Location           │
│ State: {                                                      │
│   currentWizard: "steering",                                 │
│   currentStep: 1,                                            │
│   responses: {},                                             │
│   selectedVehicle: { fleet_number: "6332" },                │
│   breakdownLocation: { lat, lng, address }                  │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Initial Question                                     │
│ Component: SteeringWizard.jsx (step 1)                      │
│                                                               │
│ QUESTION: "Is the power steering warning light on?"          │
│ TYPE: Single choice                                           │
│ OPTIONS:                                                      │
│   [ ] Yes                                                    │
│   [ ] No                                                     │
│                                                               │
│ User selects: "Yes"                                          │
│ Event: handleResponse(1, "Yes")                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STATE UPDATE                                                  │
│ setResponses({                                                │
│   ...responses,                                              │
│   1: {                                                       │
│     question: "Is the power steering warning light on?",     │
│     answer: "Yes",                                           │
│     timestamp: Date.now()                                    │
│   }                                                          │
│ })                                                           │
│                                                               │
│ WEBSOCKET BROADCAST:                                          │
│ assessmentBroadcaster.broadcastProgress({                    │
│   assessmentId,                                              │
│   currentStep: 1,                                            │
│   totalSteps: 7,                                             │
│   lastResponse: { question: "...", answer: "Yes" }          │
│ })                                                           │
│                                                               │
│ NAVIGATION:                                                   │
│ Check wizard logic tree:                                     │
│   If "Yes" → Go to Step 2                                   │
│   If "No" → Go to Step 3                                    │
│                                                               │
│ setCurrentStep(2)                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Follow-up Question (Conditional)                    │
│                                                               │
│ QUESTION: "When did the warning light come on?"              │
│ TYPE: Multiple choice                                         │
│ OPTIONS:                                                      │
│   [ ] Just now / within last hour                            │
│   [ ] Earlier today                                          │
│   [ ] Yesterday or before                                    │
│   [ ] Light has been on for several days                     │
│                                                               │
│ User selects: "Just now / within last hour"                  │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ (Repeat state update + broadcast)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEPS 3-6: Continue through wizard tree                     │
│ (Questions adapt based on previous answers)                  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: Final Recommendation                                 │
│                                                               │
│ AI DECISION ENGINE:                                           │
│ 1. Analyze all responses                                     │
│ 2. Check decision tree rules from diagnostic-flows-complete.js│
│ 3. Calculate severity score                                  │
│ 4. Generate recommendation                                   │
│                                                               │
│ RESULT:                                                       │
│ Decision: "Off Road - Repair Required"                       │
│ Severity: "High"                                             │
│ Reasoning: "Power steering warning light + recent onset      │
│            indicates potential pump failure. Safety risk     │
│            requires immediate attention."                    │
│ Estimated Repair Time: "2 hours"                             │
│ Parts Required: ["Power steering pump", "Hydraulic fluid"]  │
│                                                               │
│ SUPERVISOR OVERRIDE:                                          │
│ Supervisor can:                                              │
│ - Accept recommendation                                      │
│ - Override decision                                          │
│ - Add custom notes                                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User: Accept, add notes, submit
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SUBMISSION (as shown in Breakdown Creation Flow above)      │
│ POST /api/breakdowns                                         │
│ → Database insert                                            │
│ → WebSocket broadcast                                        │
│ → Confirmation screen                                        │
└──────────────────────────────────────────────────────────────┘
```

### Wizard Progress Visibility (Other Supervisors)

```
Supervisor A: Completes Step 3 of Steering Wizard
  ↓
WebSocket broadcast: 'assessment_progress'
  ↓
SDC Dashboard (Supervisor B viewing):
  ↓
Update "Active Assessments" panel:
  ┌─────────────────────────────────────────┐
  │ ACTIVE ASSESSMENTS (2)                  │
  ├─────────────────────────────────────────┤
  │ 🔄 John Smith (AG003)                   │
  │    Fleet 6332 - Steering Issue          │
  │    Step 3 of 7 • Started 5m ago         │
  │    Last update: 30s ago                 │
  │                                          │
  │ 🔄 Sarah Jones (BP009)                  │
  │    Fleet 7245 - Brakes Issue            │
  │    Step 1 of 5 • Started 2m ago         │
  └─────────────────────────────────────────┘
```

---

## Engineering Dispatch Flow

### Flow: Control Room → Dispatch → Engineering Dashboard → Job Completion

```
┌──────────────────────────────────────────────────────────────┐
│ STARTING SCREEN: Control Room Display                        │
│ User: Supervisor viewing breakdown BD-20251027-001           │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User Action: Click "Assign Engineer"
                            │ Event: handleAssignEngineer(breakdown)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MODAL: Engineering Dispatch                                  │
│ Component: EngineeringDispatchModal.jsx                      │
│                                                               │
│ API CALL ON OPEN:                                             │
│ GET /api/engineering/engineers/available/:depotId            │
│ Response: Available engineers for breakdown's depot          │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ {                                                             │
│   available_engineers: [                                     │
│     {                                                         │
│       id: 45,                                                 │
│       name: "Mike Brown",                                    │
│       badge_number: "ENG-012",                               │
│       depot: "Riverside",                                    │
│       status: "available",                                   │
│       current_jobs: 0,                                       │
│       location: { lat: 54.976, lng: -1.615 },              │
│       distance_to_breakdown: "3.2 miles",                    │
│       estimated_arrival: "15 minutes"                        │
│     },                                                        │
│     ... (more engineers)                                     │
│   ]                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ DISPATCH MODAL DISPLAY                                        │
│                                                               │
│ BREAKDOWN INFO:                                               │
│ - BD-20251027-001                                            │
│ - Fleet 6332 at Gateshead Interchange                        │
│ - Steering - High Priority                                   │
│                                                               │
│ AVAILABLE ENGINEERS:                                          │
│ ┌────────────────────────────────────────┐                  │
│ │ [✓] Mike Brown (ENG-012)               │                  │
│ │     3.2 miles away • ETA: 15 minutes   │                  │
│ │     Currently: Available               │                  │
│ ├────────────────────────────────────────┤                  │
│ │ [ ] Tom Davis (ENG-008)                │                  │
│ │     5.1 miles away • ETA: 22 minutes   │                  │
│ │     Currently: Available               │                  │
│ └────────────────────────────────────────┘                  │
│                                                               │
│ PRIORITY:                                                     │
│ [●] Standard    [ ] Urgent    [ ] Emergency                  │
│                                                               │
│ NOTES (optional):                                             │
│ [_______________________________________________]             │
│                                                               │
│ [Cancel]  [Dispatch Engineer]                                │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ User: Select engineer, click "Dispatch"
                            │ Event: handleDispatch(engineer, notes)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ Endpoint: POST /api/engineering/assign                       │
│ Authentication: Bearer token                                 │
│ Payload: {                                                    │
│   breakdown_id: "BD-20251027-001",                           │
│   engineer_id: 45,                                           │
│   engineer_name: "Mike Brown",                               │
│   engineer_badge: "ENG-012",                                 │
│   estimated_arrival_minutes: 15,                             │
│   priority: "standard",                                      │
│   notes: "Power steering issue - bring pump",                │
│   assigned_by: "John Smith",                                 │
│   assigned_by_badge: "AG003"                                 │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                            │
│ File: /backend/routes/engineering.js (POST /assign)         │
│                                                               │
│ 1. Validate engineer availability                            │
│ 2. UPDATE breakdowns SET                                     │
│      status = 'dispatched',                                  │
│      engineer_id = 45,                                       │
│      engineer_assigned_at = NOW(),                           │
│      estimated_arrival = NOW() + INTERVAL 15 MINUTE          │
│    WHERE breakdown_id = 'BD-20251027-001'                    │
│                                                               │
│ 3. UPDATE engineers SET                                      │
│      status = 'dispatched',                                  │
│      current_job_id = breakdown_id                           │
│    WHERE id = 45                                             │
│                                                               │
│ 4. INSERT INTO engineer_jobs (breakdown_id, engineer_id, ...)│
│                                                               │
│ 5. Log activity: activityLogger.logEngineerDispatched()      │
│                                                               │
│ 6. Broadcast WebSocket: 'engineer_assigned' event            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ {                                                             │
│   success: true,                                              │
│   dispatch_id: "DISP-20251027-001",                          │
│   breakdown_id: "BD-20251027-001",                           │
│   engineer: {                                                 │
│     name: "Mike Brown",                                      │
│     badge: "ENG-012",                                        │
│     phone: "07123 456789"                                    │
│   },                                                         │
│   estimated_arrival: "2025-10-27T19:02:00Z",                 │
│   status: "dispatched"                                       │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ WEBSOCKET BROADCAST                                           │
│ Event: 'engineer_assigned'                                   │
│ Channels: ['sdc-dashboard', 'breakdowns', 'control-room',   │
│            'engineering']                                    │
│ Payload: {                                                    │
│   type: 'engineer_assigned',                                 │
│   breakdown_id: "BD-20251027-001",                           │
│   engineer: { name: "Mike Brown", badge: "ENG-012" },       │
│   estimated_arrival: "15 minutes",                           │
│   timestamp: "2025-10-27T18:47:00Z"                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ SIMULTANEOUS UPDATES (all screens)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ REAL-TIME SCREEN UPDATES:                                    │
│                                                               │
│ 1. Control Room Display:                                     │
│    - Breakdown card status → "DISPATCHED"                    │
│    - Badge color: red → orange                               │
│    - Shows: "Mike Brown (ENG-012) • ETA 15 mins"            │
│                                                               │
│ 2. Engineering Dashboard (opens automatically for engineer): │
│    - New job appears in "My Jobs" section                    │
│    - Push notification sent to engineer's device             │
│    - Job card shows all breakdown details                    │
│                                                               │
│ 3. Operations Centre (HomePage):                             │
│    - Activity feed: "Engineer assigned to BD-20251027-001"   │
│    - Active breakdowns count unchanged (still active)        │
│                                                               │
│ 4. SDC Dashboard:                                             │
│    - Assessment removed from "Pending Dispatch"              │
│    - Added to "Dispatched" section                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ [Engineer receives notification]
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Engineering Dashboard (Engineer View)                │
│ Component: EngineeringDashboard.jsx                          │
│ Route: /dashboards/engineering                               │
│ User: Mike Brown (ENG-012)                                   │
│                                                               │
│ ON MOUNT:                                                     │
│ API Call: GET /api/engineering/jobs?engineer_badge=ENG-012   │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ {                                                             │
│   my_jobs: [                                                  │
│     {                                                         │
│       breakdown_id: "BD-20251027-001",                       │
│       fleet_number: "6332",                                  │
│       depot: "Riverside",                                    │
│       issue_category: "Steering",                            │
│       severity: "high",                                      │
│       status: "dispatched",                                  │
│       location: {                                            │
│         address: "Gateshead Interchange",                    │
│         lat: 54.9783, lng: -1.6178,                         │
│         directions_url: "..."                                │
│       },                                                     │
│       assessment_summary: "Power steering failure...",       │
│       parts_required: ["Power steering pump"],               │
│       estimated_repair_time: "2 hours",                      │
│       assigned_at: "2025-10-27T18:47:00Z",                   │
│       estimated_arrival: "2025-10-27T19:02:00Z",             │
│       sla_deadline: "2025-10-27T20:35:00Z"                   │
│     }                                                         │
│   ],                                                          │
│   depot_jobs: [...],                                          │
│   unassigned_jobs: [...]                                     │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ ENGINEERING DASHBOARD DISPLAY                                 │
│                                                               │
│ SECTIONS:                                                     │
│ 1. MY JOBS (1)                                               │
│    ┌──────────────────────────────────────┐                 │
│    │ 🚨 BD-20251027-001  HIGH             │                 │
│    │ Fleet 6332 - Steering                │                 │
│    │ Location: Gateshead Interchange      │                 │
│    │ ETA: 13 mins • SLA: On Track         │                 │
│    │                                       │                 │
│    │ [Get Directions] [Start Job] [Info] │                 │
│    └──────────────────────────────────────┘                 │
│                                                               │
│ 2. DEPOT JOBS (Riverside) - 3 unassigned                    │
│ 3. JOB HISTORY - Recent completed jobs                       │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Engineer: Clicks "Start Job"
                            │ Event: handleStartJob(breakdown_id)
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ POST /api/engineering/update-status                          │
│ Payload: {                                                    │
│   breakdown_id: "BD-20251027-001",                           │
│   status: "on_site",                                         │
│   engineer_badge: "ENG-012",                                 │
│   notes: "Arrived at location"                               │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: Update status to 'on_site'                          │
│ → Broadcast 'breakdown_updated' via WebSocket                │
│ → All screens update status badge                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ [Engineer completes repair]
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Job Completion Form                                  │
│ Component: JobCompletionForm.jsx (modal in Eng Dashboard)   │
│                                                               │
│ FIELDS:                                                       │
│ - Resolution Type: [Repaired/Monitoring/Refer to Depot]     │
│ - Parts Used: [Power steering pump]                          │
│ - Labor Hours: [2.5]                                         │
│ - Repair Notes: [Replaced power steering pump...]           │
│ - Root Cause: [Component failure]                            │
│ - Returned to Service: [✓] Yes / [ ] No                     │
│ - Vehicle Status: [Operational / Off Road / Monitoring]      │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Engineer: Submit completion
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ POST /api/engineering/complete-job                           │
│ Payload: {                                                    │
│   breakdown_id: "BD-20251027-001",                           │
│   engineer_badge: "ENG-012",                                 │
│   resolution_type: "repaired",                               │
│   resolution_notes: "Replaced power steering pump...",       │
│   parts_used: ["Power steering pump"],                       │
│   labor_hours: 2.5,                                          │
│   repair_category: "steering_system",                        │
│   root_cause: "component_failure",                           │
│   returned_to_service: true,                                 │
│   completed_at: "2025-10-27T20:15:00Z"                       │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND: Mark breakdown as resolved                          │
│ 1. UPDATE breakdowns SET status = 'resolved'                 │
│ 2. UPDATE engineers SET status = 'available'                 │
│ 3. Calculate resolution time (reported → resolved)           │
│ 4. Log activity: activityLogger.logJobCompleted()            │
│ 5. Broadcast 'breakdown_resolved' via WebSocket              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ ALL SCREENS UPDATE:                                           │
│                                                               │
│ 1. Control Room Display:                                     │
│    - Remove breakdown from active list (fade out animation)  │
│    - Active count decrements: 8 → 7                          │
│                                                               │
│ 2. Engineering Dashboard:                                     │
│    - Job moved to "Completed" section                        │
│    - Mike Brown status → Available                           │
│    - Show completion summary                                 │
│                                                               │
│ 3. Operations Centre:                                         │
│    - Activity feed: "BD-20251027-001 resolved by ENG-012"   │
│    - Today's Total increments                                │
│    - Active Breakdowns decrements                            │
│                                                               │
│ 4. Management Dashboard:                                     │
│    - KPIs update (resolution time, SLA compliance)           │
│    - Fleet health score adjusts                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Admin Operations Flow

### Flow: System Overview → Service Management → User Administration

```
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Operations Centre (HomePage)                         │
│ User: Admin (AG003 or BP009)                                 │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Admin sees additional nav items:
                            │ - "Management Dashboard"
                            │ - "Engineering Dashboard"
                            │ - "Admin Settings"
                            │
                            │ User Action: Click "Management Dashboard"
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SCREEN: Management Dashboard                                 │
│ Component: ManagementDashboard.jsx                           │
│ Route: /dashboards/management                                │
│ Authentication: AdminRoute (requires admin role)             │
│                                                               │
│ ON MOUNT:                                                     │
│ Multiple parallel API calls:                                 │
│ 1. GET /api/analytics/kpis?period=today                      │
│ 2. GET /api/analytics/trends?period=7d                       │
│ 3. GET /api/analytics/depot-comparison                       │
│ 4. GET /api/analytics/fleet-health                           │
│ 5. GET /api/engineering/performance?period=week              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSES (combined)                                      │
│                                                               │
│ KPIs:                                                         │
│ - MTBF: 450 hours                                            │
│ - Fleet Availability: 94.2%                                  │
│ - SLA Compliance: 89%                                        │
│ - Avg Response Time: 18 minutes                              │
│                                                               │
│ Trends (7-day):                                               │
│ - Breakdown count: [12, 15, 18, 14, 16, 13, 11]            │
│ - Response times: [22, 19, 18, 20, 17, 18, 16]             │
│                                                               │
│ Depot Comparison:                                             │
│ - Riverside: 45 breakdowns, 17min avg response               │
│ - Consett: 32 breakdowns, 22min avg response                 │
│ - Hexham: 28 breakdowns, 19min avg response                  │
│                                                               │
│ Fleet Health:                                                 │
│ - Operational: 231 vehicles (94.2%)                          │
│ - Off Road: 14 vehicles (5.8%)                               │
│ - High Risk Vehicles: 8 (repeat defects)                     │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MANAGEMENT DASHBOARD DISPLAY                                  │
│                                                               │
│ LAYOUT:                                                       │
│ ┌────────────────────────────────────────────────┐          │
│ │ EXECUTIVE KPIs                                 │          │
│ ├────────────────────────────────────────────────┤          │
│ │ MTBF: 450h ↑ │ Fleet: 94.2% ↓ │ SLA: 89% ↑  │          │
│ │ Response: 18min ↑ │ Today: 11 BD ↓            │          │
│ └────────────────────────────────────────────────┘          │
│                                                               │
│ ┌────────────────────────────────────────────────┐          │
│ │ 7-DAY BREAKDOWN TREND                          │          │
│ │ [Line chart showing daily breakdown counts]    │          │
│ └────────────────────────────────────────────────┘          │
│                                                               │
│ ┌────────────────────────────────────────────────┐          │
│ │ DEPOT COMPARISON                                │          │
│ │ [Bar chart: Riverside, Consett, Hexham]       │          │
│ └────────────────────────────────────────────────┘          │
│                                                               │
│ ┌────────────────────────────────────────────────┐          │
│ │ FLEET HEALTH                                    │          │
│ │ Operational: 94.2% | Off Road: 5.8%           │          │
│ │ High Risk Vehicles: 8 [View Details]          │          │
│ └────────────────────────────────────────────────┘          │
│                                                               │
│ ADMIN ACTIONS (top right):                                   │
│ - [Export Report]                                            │
│ - [User Management]                                          │
│ - [System Settings]                                          │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Admin Action: Click "User Management"
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ MODAL: User Management                                        │
│ Component: UserManagementModal.jsx                           │
│                                                               │
│ API CALL:                                                     │
│ GET /api/auth/supervisors?include_inactive=true              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                  │
│ {                                                             │
│   supervisors: [                                              │
│     {                                                         │
│       id: 1,                                                  │
│       name: "John Smith",                                    │
│       email: "john.smith@gobarry.co.uk",                     │
│       badge_number: "AG003",                                 │
│       depot: "Riverside",                                    │
│       role: "admin",                                         │
│       is_active: true,                                       │
│       last_login: "2025-10-27T18:30:00Z"                     │
│     },                                                        │
│     ... (more supervisors)                                   │
│   ],                                                          │
│   pending_approvals: [                                        │
│     {                                                         │
│       id: 15,                                                 │
│       name: "New User",                                      │
│       email: "new.user@gobarry.co.uk",                       │
│       badge_number: "TBC",                                   │
│       requested_at: "2025-10-27T10:00:00Z"                   │
│     }                                                         │
│   ]                                                          │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ USER MANAGEMENT DISPLAY                                       │
│                                                               │
│ TABS:                                                         │
│ 1. Active Supervisors (9)                                    │
│    ┌──────────────────────────────────────────┐             │
│    │ John Smith (AG003)           Admin       │             │
│    │ john.smith@gobarry.co.uk                 │             │
│    │ Last login: 30 mins ago                  │             │
│    │ [Edit] [Reset Password] [Deactivate]    │             │
│    ├──────────────────────────────────────────┤             │
│    │ [More users...]                          │             │
│    └──────────────────────────────────────────┘             │
│                                                               │
│ 2. Pending Approvals (1)                                     │
│    ┌──────────────────────────────────────────┐             │
│    │ New User (new.user@gobarry.co.uk)       │             │
│    │ Requested: Today at 10:00                │             │
│    │ [Approve] [Reject]                       │             │
│    └──────────────────────────────────────────┘             │
│                                                               │
│ 3. Inactive Users                                            │
│ 4. Audit Log                                                 │
│                                                               │
│ ACTIONS:                                                      │
│ - Add New Supervisor                                         │
│ - Export User List                                           │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Admin Action: Click "Approve" for pending user
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ POST /api/auth/approve-signup                                │
│ Authentication: Bearer token (admin required)                │
│ Payload: {                                                    │
│   supervisorId: 15,                                          │
│   approved: true                                             │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                            │
│ File: /backend/routes/auth.js (POST /approve-signup)        │
│                                                               │
│ 1. Verify admin role                                         │
│ 2. UPDATE supervisors SET                                    │
│      is_active = 1,                                          │
│      approved_at = NOW(),                                    │
│      approved_by = admin_id                                  │
│    WHERE id = 15                                             │
│ 3. Log admin action                                          │
│ 4. Send welcome email (optional)                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ RESPONSE & UI UPDATE                                          │
│ - Pending user moved to "Active Supervisors"                 │
│ - Success notification                                       │
│ - Audit log entry created                                    │
│                                                               │
│ NO WebSocket broadcast (admin actions not real-time)         │
└──────────────────────────────────────────────────────────────┘
```

### Admin Password Reset Flow

```
Admin: Click "Reset Password" for user
  ↓
Confirmation dialog: "Reset password for John Smith?"
  ↓
API Call: POST /api/auth/admin/reset-password
Payload: { email: "john.smith@gobarry.co.uk", newPassword: "temp123" }
  ↓
Backend: UPDATE supervisors SET password_hash = bcrypt(newPassword)
  ↓
Response: Success + temporary password
  ↓
UI: Show temporary password to admin (copy to clipboard)
  ↓
Admin communicates password to user (out of system)
```

---

## Real-Time Update Flows

### WebSocket Event Flow Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ EVENT SOURCE: Backend Route Handler                          │
│ Example: POST /api/breakdowns (create)                       │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ After database write
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ BROADCAST TRIGGER                                             │
│ File: /backend/routes/breakdowns.js                          │
│                                                               │
│ Import: webSocketHandler from '../routes/webSocketHandler.js'│
│                                                               │
│ Call: webSocketHandler.broadcastBreakdownCreated({           │
│   type: 'breakdown_created',                                 │
│   breakdown: breakdownObject,                                │
│   timestamp: new Date().toISOString()                        │
│ })                                                           │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ WEBSOCKET HANDLER                                             │
│ File: /backend/routes/webSocketHandler.js                    │
│                                                               │
│ Function: broadcastBreakdownCreated(data)                    │
│                                                               │
│ 1. Get all clients subscribed to channels:                   │
│    - 'sdc-dashboard'                                         │
│    - 'breakdowns'                                            │
│    - 'control-room'                                          │
│                                                               │
│ 2. For each client in channels:                              │
│    if (client.ws.readyState === WebSocket.OPEN) {           │
│      client.ws.send(JSON.stringify(data))                   │
│    }                                                         │
│                                                               │
│ 3. Track broadcast:                                           │
│    - Log broadcast event                                     │
│    - Count recipients                                        │
│    - Record timestamp                                        │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ Network transmission (50-200ms)
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ CLIENT WEBSOCKET LISTENERS                                    │
│ File: /frontend/src/services/websocket.js                    │
│                                                               │
│ useWebSocket() hook active in multiple components:           │
│                                                               │
│ 1. ControlRoomDisplay.jsx                                    │
│    - Listening on: 'control-room' channel                    │
│    - On message: handleBreakdownCreated()                    │
│                                                               │
│ 2. SDCDashboard.jsx                                          │
│    - Listening on: 'sdc-dashboard' channel                   │
│    - On message: handleAssessmentUpdate()                    │
│                                                               │
│ 3. HomePage.jsx                                              │
│    - Listening on: 'breakdowns' channel                      │
│    - On message: refreshStats()                              │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ MESSAGE HANDLING (per component)                             │
│                                                               │
│ Example: ControlRoomDisplay.jsx                              │
│                                                               │
│ useEffect(() => {                                            │
│   const handleMessage = (message) => {                       │
│     const data = JSON.parse(message.data);                   │
│                                                               │
│     if (data.type === 'breakdown_created') {                 │
│       setBreakdowns(prev => [                                │
│         data.breakdown,                                      │
│         ...prev                                              │
│       ]);                                                    │
│                                                               │
│       // Show toast notification                             │
│       showNotification('New breakdown reported');            │
│     }                                                        │
│   };                                                         │
│                                                               │
│   ws.addEventListener('message', handleMessage);             │
│   return () => ws.removeEventListener('message', handleMessage);│
│ }, [ws]);                                                    │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ UI UPDATE (React re-render)                                  │
│                                                               │
│ State change triggers re-render:                             │
│ - New breakdown card appears at top of list                  │
│ - Animation: Slide in from top                               │
│ - Highlight: Flashes for 2 seconds                           │
│ - Sound: Optional alert tone                                 │
│                                                               │
│ Total latency: 50-200ms from backend trigger to UI update    │
└───────────────────────────────────────────────────────────────┘
```

### All WebSocket Event Types

| Event Type | Broadcast From | Channels | Triggered By |
|------------|----------------|----------|--------------|
| `breakdown_created` | breakdowns.js | sdc-dashboard, breakdowns, control-room | POST /api/breakdowns |
| `breakdown_updated` | breakdowns.js | sdc-dashboard, breakdowns, control-room | PUT /api/breakdowns/:id |
| `breakdown_resolved` | engineering.js | sdc-dashboard, breakdowns, control-room, engineering | POST /api/engineering/complete-job |
| `engineer_assigned` | engineering.js | sdc-dashboard, breakdowns, control-room, engineering | POST /api/engineering/assign |
| `assessment_started` | breakdown-guide | sdc-dashboard, assessments | Wizard initialization |
| `assessment_progress` | breakdown-guide | sdc-dashboard, assessments | Each wizard step |
| `assessment_completed` | breakdown-guide | sdc-dashboard, assessments | Wizard submission |
| `assessment_cancelled` | breakdown-guide | sdc-dashboard, assessments | User cancels wizard |
| `NEW_REPEAT_DEFECT` | defects.js | defect-intelligence | POST /api/defects/repeat (3+ defects) |
| `TREND_UPDATE` | defects.js | defect-intelligence | POST /api/defects/trends (rising trend) |
| `CRITICAL_PATTERN` | breakdowns.js | sdc-dashboard, defect-intelligence | Pattern detection (5+ vehicles) |
| `DEPOT_STATS_UPDATE` | defects.js | defect-intelligence | Depot spike detection |
| `PREDICTIVE_ALERT` | defects.js | defect-intelligence | GET /api/defects/predictive |
| `DEFECT_ESCALATED` | defects.js | defect-intelligence | POST /api/defects/escalate |

### Activity Feed Polling (NOT WebSocket)

```
┌───────────────────────────────────────────────────────────────┐
│ COMPONENT: LiveActivityFeed.jsx                              │
│ Used in: HomePage, SDCDashboard                              │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ ON MOUNT
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ POLLING LOOP                                                  │
│                                                               │
│ useEffect(() => {                                            │
│   const fetchActivities = async () => {                      │
│     const response = await fetch('/api/activity/feed?limit=50');│
│     const data = await response.json();                      │
│     setActivities(data.activities);                          │
│   };                                                         │
│                                                               │
│   fetchActivities(); // Initial load                         │
│   const interval = setInterval(fetchActivities, 5000); // Every 5s│
│   return () => clearInterval(interval);                      │
│ }, []);                                                      │
└───────────────────────────────────────────────────────────────┘
                            │
                            │ Every 5 seconds
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ API CALL                                                      │
│ GET /api/activity/feed?limit=50                              │
│ Response: {                                                   │
│   activities: [                                               │
│     {                                                         │
│       id: 456,                                                │
│       activity_type: "breakdown_reported",                   │
│       message: "Breakdown BD-20251027-001 reported",         │
│       actor_name: "John Smith",                              │
│       actor_badge: "AG003",                                  │
│       severity: "high",                                      │
│       timestamp: "2025-10-27T18:35:12Z",                     │
│       icon: "🚨",                                            │
│       metadata: { breakdown_id: "BD-20251027-001" }          │
│     },                                                        │
│     ... (more activities)                                    │
│   ]                                                          │
│ }                                                            │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│ UI UPDATE                                                     │
│ - Replace activities array (not append)                      │
│ - Scroll to top if new activities detected                   │
│ - Show "New Activity" badge if user scrolled down            │
│                                                               │
│ Latency: Up to 5 seconds                                     │
└───────────────────────────────────────────────────────────────┘
```

**Issue**: Activity feed uses polling (5s delay) instead of WebSocket broadcasting. This creates inconsistency with real-time events.

---

## Data Flow Diagrams

### Authentication Token Flow

```
┌────────────┐
│   Login    │
│   Screen   │
└─────┬──────┘
      │ Email + Password
      ▼
┌────────────────────┐
│ POST /api/auth/login│
└─────┬──────────────┘
      │ JWT Token
      ▼
┌─────────────────────┐
│  sessionStorage     │
│  - auth_token       │
│  - current_user     │
└─────┬───────────────┘
      │
      ├─────────────────────────────────┐
      │                                 │
      ▼                                 ▼
┌────────────────┐            ┌─────────────────┐
│  AuthContext   │            │  HTTP Headers   │
│  isAuthenticated│            │  Authorization: │
│  currentUser   │            │  Bearer <token> │
└─────┬──────────┘            └─────┬───────────┘
      │                             │
      │                             ▼
      │                      ┌──────────────────┐
      │                      │  All API Calls   │
      │                      │  (authenticated) │
      │                      └──────────────────┘
      │
      ▼
┌────────────────────────────────────────┐
│  WebSocket Connection                  │
│  ws://backend/ws?token=<JWT>&channel=  │
└────────────────────────────────────────┘
```

### Breakdown Creation Data Flow

```
Breakdown Guide
     │
     │ User completes wizard
     │
     ▼
POST /api/breakdowns
     │
     ├─→ MySQL: INSERT INTO breakdowns
     │
     ├─→ activityLogger: INSERT INTO activities
     │
     ├─→ Pattern Detection
     │    └─→ If critical: WebSocket broadcast (defect alert)
     │
     ├─→ WebSocket broadcast: breakdown_created
     │    ├─→ sdc-dashboard channel → SDC Dashboard
     │    ├─→ breakdowns channel → All breakdown viewers
     │    └─→ control-room channel → Control Room Display
     │
     └─→ Response: { breakdown_id, status }
          │
          └─→ Confirmation screen
```

### WebSocket Update Propagation

```
                     Backend Event
                           │
                           ▼
              ┌────────────────────────┐
              │ WebSocket Broadcast    │
              │ (all subscribed clients)│
              └────────┬───────────────┘
                       │
         ┌─────────────┼─────────────┬─────────────┐
         │             │             │             │
         ▼             ▼             ▼             ▼
┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Control    │ │   SDC    │ │HomePage  │ │ Engineering  │
│ Room       │ │Dashboard │ │          │ │ Dashboard    │
│ Display    │ │          │ │          │ │              │
└─────┬──────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
      │             │            │               │
      │ Update      │ Update     │ Update        │ Update
      │ breakdown   │ assessment │ activity      │ job
      │ card        │ panel      │ feed count    │ queue
      │             │            │               │
      ▼             ▼            ▼               ▼
   UI Re-render  UI Re-render  UI Re-render  UI Re-render
   (50-200ms)    (50-200ms)    (50-200ms)    (50-200ms)
```

### Screen Navigation Map

```
┌─────────────────────────────────────────────────────────┐
│                       Login Page                        │
│                 (MySQLLoginPage.jsx)                    │
└────────────────────┬────────────────────────────────────┘
                     │ POST /api/auth/login
                     │ Success → Store token
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Operations Centre                      │
│                    (HomePage.jsx)                       │
│                          /                              │
│                                                         │
│  Displays:                                              │
│  - Dashboard stats                                      │
│  - Live activity feed (polling 5s)                      │
│  - Quick action buttons                                 │
└─┬─────────────┬───────────────┬───────────────┬────────┘
  │             │               │               │
  │ Click       │ Click         │ Click         │ Click
  │ "Breakdown  │ "Control      │ "SDC          │ "Management"
  │  Guide"     │  Room"        │  Dashboard"   │  (admin only)
  │             │               │               │
  ▼             ▼               ▼               ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐
│Breakdown│ │ Control │ │   SDC   │ │   Management     │
│ Guide   │ │  Room   │ │Dashboard│ │   Dashboard      │
│         │ │ Display │ │         │ │                  │
│/breakdown│ │/dashboards│/dashboards│/dashboards     │
│-guide   │ │/control-room│/sdc   │ │/management       │
└────┬────┘ └─────────┘ └─────────┘ └──────────────────┘
     │
     │ Select issue
     │ Select vehicle
     │ Capture location
     ▼
┌─────────────────────┐
│ Wizard Assessment   │
│ (SteeringWizard etc)│
│                     │
│ - Step 1: Q&A       │
│ - Step 2: Q&A       │
│ - ...               │
│ - Step N: Decision  │
└─────────┬───────────┘
          │
          │ Submit
          │ POST /api/breakdowns
          │ WebSocket broadcast
          ▼
┌─────────────────────┐
│ Confirmation Screen │
│ (BreakdownGuide     │
│  Completion.jsx)    │
│                     │
│ Auto-navigate (5s)  │
└─────────┬───────────┘
          │
          ▼
    Back to Operations Centre
```

### Critical Data Dependencies

```
Screen: Homepage
  ├─ Requires: JWT token (auth)
  ├─ API: GET /api/analytics/kpis
  ├─ API: GET /api/activity/feed (polling 5s)
  ├─ WebSocket: breakdowns channel (stats updates)
  └─ Navigation: All routes available

Screen: Breakdown Guide
  ├─ Requires: JWT token + supervisorSession
  ├─ API: GET /api/fleet (vehicle selection)
  ├─ State: selectedVehicle, breakdownLocation
  ├─ WebSocket: sdc-dashboard channel (progress broadcast)
  └─ Submit: POST /api/breakdowns

Screen: Control Room Display
  ├─ Requires: None (public)
  ├─ API: GET /api/public/breakdowns/live (polling 30s)
  ├─ WebSocket: control-room channel (real-time updates)
  └─ Navigation: View details → Modal

Screen: SDC Dashboard
  ├─ Requires: JWT token (supervisor)
  ├─ API: GET /api/breakdowns/live
  ├─ WebSocket: sdc-dashboard channel (assessment events)
  └─ Actions: Assign engineer, acknowledge, add note

Screen: Engineering Dashboard
  ├─ Requires: JWT token (any role)
  ├─ API: GET /api/engineering/jobs?engineer_badge=
  ├─ WebSocket: engineering channel (job assignments)
  └─ Actions: Start job, update status, complete job

Screen: Management Dashboard
  ├─ Requires: JWT token + ADMIN role
  ├─ API: GET /api/analytics/kpis
  ├─ API: GET /api/analytics/trends
  ├─ API: GET /api/analytics/depot-comparison
  ├─ API: GET /api/analytics/fleet-health
  ├─ No WebSocket (polling only)
  └─ Admin actions: User management, reports
```

---

## Issues and Recommendations

### Issues Found

#### 1. Activity Feed Uses Polling Instead of WebSocket

**Current Implementation**:
- Activity feed polls `/api/activity/feed` every 5 seconds
- Latency: Up to 5 seconds for activity updates

**Impact**:
- Inconsistent with real-time WebSocket events
- Unnecessary database load (query every 5s per user)
- Users see delays in activity feed while breakdowns update instantly

**Recommendation**:
```javascript
// Replace polling with WebSocket event
Backend: broadcastActivityUpdate(activity)
  → Channel: 'activities'
  → All clients: Update activity feed immediately
```

**Priority**: MEDIUM

---

#### 2. Login/Logout Not Broadcast

**Current Implementation**:
- Login logged to database (`activities` table)
- NO WebSocket broadcast
- Other supervisors don't see who's online

**Impact**:
- No "online status" indicator
- Can't see who's currently available
- Collaboration more difficult

**Recommendation**:
```javascript
// Add login/logout broadcasts
POST /api/auth/login (success)
  → webSocketHandler.broadcastUserOnline({ user, timestamp })
  → All clients: Update online supervisors list

POST /api/auth/logout
  → webSocketHandler.broadcastUserOffline({ user, timestamp })
```

**Priority**: LOW

---

#### 3. No Screen-to-Screen State Persistence

**Current Implementation**:
- Wizard state stored in component memory only
- Page refresh loses all wizard progress
- No "resume assessment" feature

**Impact**:
- Accidental refresh = start over
- Can't switch screens during assessment
- Poor mobile UX (browser kills background tabs)

**Recommendation**:
```javascript
// Add wizard state persistence
1. Save wizard state to sessionStorage after each step
2. On mount: Check sessionStorage for incomplete assessment
3. Offer "Resume Assessment" option
4. Backend: POST /api/wizards/progress (optional)
```

**Priority**: HIGH

---

#### 4. Real-Time Updates Missing for Engineering Status

**Current Implementation**:
- Engineering status updates (on_site, repairing, completed) broadcast via WebSocket
- BUT: Control Room Display requires manual refresh to see updates beyond "dispatched"

**Impact**:
- Supervisors don't see live engineering progress
- Must refresh page to see if engineer arrived
- Defeats purpose of real-time dashboard

**Recommendation**:
- Verify WebSocket listener in ControlRoomDisplay.jsx handles ALL breakdown_updated events
- Add visual indicators for status transitions (dispatched → on_site → repairing → resolved)

**Priority**: HIGH

---

#### 5. WebSocket Reconnection Not Robust

**Current Implementation**:
```javascript
// websocket.js
reconnectAttempts: 5,
reconnectInterval: 3000,
retryBackoff: { initial: 1000, max: 30000, factor: 1.5 }
```

**Issue**:
- After 5 failed attempts, gives up
- No notification to user about connection loss
- User may think system is working but not receiving updates

**Recommendation**:
```javascript
// Add persistent reconnection + UI feedback
1. Infinite reconnection attempts (until manual disconnect)
2. Show "Disconnected" indicator in UI
3. Queue failed broadcasts for retry on reconnect
4. Exponential backoff with max 60s interval
```

**Priority**: MEDIUM

---

#### 6. No Offline Support for Breakdown Guide

**Current Implementation**:
- Breakdown Guide requires constant network connection
- Vehicle fleet data fetched on demand
- Wizard flows loaded from server

**Impact**:
- Cannot report breakdowns in poor signal areas
- Field supervisors lose functionality in dead zones

**Recommendation**:
```javascript
// Add Progressive Web App (PWA) features
1. Cache fleet database for offline lookup
2. Cache wizard flows locally
3. Queue breakdown submissions when offline
4. Sync to backend when connection restored
```

**Priority**: LOW (nice-to-have)

---

#### 7. No Visual Indication of WebSocket Connection Status

**Current Implementation**:
- WebSocket connects silently
- No UI indicator of connection state
- Users don't know if real-time updates are working

**Recommendation**:
```javascript
// Add ConnectionStatusIndicator component (already exists but unused)
- Green dot: Connected
- Yellow dot: Reconnecting
- Red dot: Disconnected
- Display in header of all dashboard screens
```

**Priority**: MEDIUM

---

#### 8. Breakdown Details Panel Doesn't Subscribe to Updates

**Current Implementation**:
- User opens breakdown details in Control Room Display
- Details are static (from initial API call)
- If engineer updates status while panel open, user doesn't see update

**Recommendation**:
```javascript
// Add WebSocket listener to details panel
useEffect(() => {
  if (selectedBreakdown) {
    const handleUpdate = (event) => {
      if (event.breakdown_id === selectedBreakdown.breakdown_id) {
        setSelectedBreakdown(prev => ({ ...prev, ...event.breakdown }));
      }
    };

    ws.addEventListener('breakdown_updated', handleUpdate);
    return () => ws.removeEventListener('breakdown_updated', handleUpdate);
  }
}, [selectedBreakdown]);
```

**Priority**: MEDIUM

---

#### 9. Assessment Progress Not Stored in Database

**Current Implementation**:
- Wizard progress broadcast via WebSocket only
- NOT stored in database
- If no one watching SDC Dashboard, progress lost

**Impact**:
- Can't review assessment history
- Can't audit "who was working on what when"
- No analytics on assessment completion rates

**Recommendation**:
```javascript
// Add database persistence
Backend: POST /api/wizards/progress
  → INSERT INTO wizard_progress (assessment_id, step, data, timestamp)
  → Use for:
    - Resume assessment feature
    - Audit trail
    - Analytics (avg time per wizard, completion rate)
```

**Priority**: MEDIUM

---

#### 10. No Rate Limiting on WebSocket Broadcasts

**Current Implementation**:
- WebSocket broadcasts sent immediately
- No throttling or batching
- High-frequency events (e.g., 10 breakdowns created in 1 minute) = 10 broadcasts

**Impact**:
- Potential performance issue with many concurrent users
- Frontend may struggle with rapid state updates
- 2GB RAM limit on backend could be exceeded

**Recommendation**:
```javascript
// Add broadcast throttling
1. Batch similar events (e.g., multiple breakdowns in 5s window)
2. Rate limit: Max 10 broadcasts per second
3. Coalesce rapid updates (send latest state, not every change)
```

**Priority**: LOW (only if performance issues observed)

---

### Summary of Issues by Priority

**HIGH Priority** (Fix Soon):
1. No Screen-to-Screen State Persistence (wizard resume)
2. Real-Time Updates Missing for Engineering Status
3. Activity Feed Uses Polling Instead of WebSocket

**MEDIUM Priority** (Improve UX):
1. WebSocket Reconnection Not Robust
2. No Visual Indication of WebSocket Connection Status
3. Breakdown Details Panel Doesn't Subscribe to Updates
4. Assessment Progress Not Stored in Database

**LOW Priority** (Nice-to-Have):
1. Login/Logout Not Broadcast
2. No Offline Support for Breakdown Guide
3. No Rate Limiting on WebSocket Broadcasts

---

## Conclusion

**Data Flow Architecture**: ✅ **Highly Effective**

The Go BARRY system achieves true screen-to-screen data flow through a hybrid architecture:

1. **WebSocket for Real-Time Events** (50-200ms latency)
   - Breakdown creation, updates, resolution
   - Engineering dispatch and status
   - Assessment progress during wizard
   - Defect intelligence alerts

2. **HTTP API for Data Retrieval** (as needed)
   - Initial page loads
   - Detail panels
   - Historical data queries
   - Filters and searches

3. **HTTP Polling for Activity Feed** (5s interval)
   - Fallback for non-critical updates
   - Should be replaced with WebSocket

**Key Strengths**:
- Multiple supervisors see same dashboard updates simultaneously
- Engineering dispatch visible to all screens within 50-200ms
- Assessment progress broadcast as wizard progresses
- No manual refresh required for critical operations

**Areas for Improvement**:
- Replace activity feed polling with WebSocket
- Add wizard state persistence (resume feature)
- Improve WebSocket reconnection robustness
- Add connection status indicators

**Overall Assessment**: The system delivers on the promise of "data flowing effortlessly from screen to screen" for critical operations. Minor improvements would make it even more robust.

---

**Document Version**: 1.0
**Last Updated**: October 27, 2025
**Maintainer**: System Architect
**Related Docs**:
- `COMPLETE_API_ENDPOINT_AUDIT.md`
- `REALTIME_DATA_FLOW_SUMMARY.md`
- `API_WEBSOCKET_ANALYSIS.md`
