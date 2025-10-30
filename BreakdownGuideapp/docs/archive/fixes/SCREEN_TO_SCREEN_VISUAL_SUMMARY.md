# Screen-to-Screen Data Flow - Visual Summary

**Quick Visual Reference for Go BARRY System**

---

## System Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                     (React 18 + Router)                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Login   │→ │Operations│→ │Breakdown │→ │ Control  │      │
│  │  Screen  │  │ Centre   │  │  Guide   │  │   Room   │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│       │              │              │              │           │
└───────┼──────────────┼──────────────┼──────────────┼───────────┘
        │              │              │              │
        │ POST login   │ GET kpis     │ POST         │ GET public
        │              │ GET activity │ breakdowns   │ /breakdowns
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                │
│                    (Node.js + Express)                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Auth Routes │  │  Breakdown  │  │  WebSocket  │           │
│  │ /api/auth   │  │   Routes    │  │   Handler   │           │
│  │             │  │ /api/       │  │   /ws       │           │
│  └─────────────┘  │ breakdowns  │  └─────────────┘           │
│                   └─────────────┘          │                   │
│                          │                 │                   │
│                          ▼                 ▼                   │
│  ┌───────────────────────────────────────────────┐           │
│  │              MySQL Database                    │           │
│  │  - breakdowns  - supervisors  - activities    │           │
│  │  - fleet_vehicles  - engineers  - jobs        │           │
│  └───────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ WebSocket Broadcasts
                          ▼
        ┌─────────────────────────────────────────────┐
        │     All Connected Clients (Real-Time)       │
        │  Control Room | SDC Dashboard | Engineering │
        └─────────────────────────────────────────────┘
```

---

## Login Flow

```
┌─────────────┐
│ Login Page  │
│             │
│ [Email]     │
│ [Password]  │
│ [Login]     │
└──────┬──────┘
       │ Click Login
       ▼
POST /api/auth/login
{ email, password }
       │
       ▼
┌──────────────┐
│   Backend    │
│ 1. Find user │
│ 2. Check pwd │
│ 3. Gen token │
│ 4. Log login │
└──────┬───────┘
       │
       ▼
Response:
{
  token: "eyJ...",
  user: {...}
}
       │
       ▼
┌──────────────────┐
│ Store in Session │
│ - auth_token     │
│ - current_user   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Operations       │
│ Centre           │
│ (HomePage)       │
│                  │
│ ✅ Authenticated │
└──────────────────┘
```

---

## Breakdown Creation Flow (Simplified)

```
Operations Centre
       ↓
   Click "Breakdown Guide"
       ↓
┌──────────────────────────┐
│  Breakdown Guide         │
│  Select Issue Category   │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│  Select Vehicle          │
│  GET /api/fleet          │
│  Response: [vehicles]    │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│  Capture Location        │
│  GPS or Manual Entry     │
└──────────┬───────────────┘
           ↓
┌──────────────────────────┐
│  Wizard Assessment       │
│  Q1: [Answer]            │
│  Q2: [Answer]            │
│  ...                     │
│  QN: [Decision]          │
└──────────┬───────────────┘
           ↓
      Click Submit
           ↓
POST /api/breakdowns
{
  fleet_number,
  location,
  issue_category,
  wizard_assessment_data,
  supervisor_badge,
  notes
}
           ↓
┌──────────────────────────┐
│  Backend Processing      │
│  1. Generate ID          │
│  2. INSERT breakdown     │
│  3. Log activity         │
│  4. Broadcast WebSocket  │
└──────────┬───────────────┘
           │
           ├─────────────────────────────────────┐
           │                                     │
           ▼                                     ▼
WebSocket Broadcast              Response: {breakdown_id}
to ALL screens                              │
           │                                 ▼
           │                    ┌──────────────────────────┐
           │                    │  Confirmation Screen     │
           │                    │  ✅ BD-20251027-001      │
           │                    └──────────────────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼
Control Room  SDC Dashboard  HomePage  Engineering
UPDATE card   UPDATE queue   UPDATE    ADD to
instantly     instantly      count     unassigned
```

---

## WebSocket Real-Time Update Flow

```
                Backend Event Trigger
                (e.g., Breakdown Created)
                          │
                          ▼
        ┌──────────────────────────────────┐
        │ webSocketHandler.broadcast()     │
        │ - Get all subscribed clients     │
        │ - Send JSON message to each      │
        └───────────┬──────────────────────┘
                    │
         ┏━━━━━━━━━━┻━━━━━━━━━━┓
         ▼                      ▼
    Channel:              Channel:
 'control-room'         'sdc-dashboard'
         │                      │
    ┌────┴────┐            ┌────┴────┐
    │ Client  │            │ Client  │
    │   1     │            │   2     │
    └────┬────┘            └────┬────┘
         │                      │
         ▼                      ▼
  ws.onmessage()         ws.onmessage()
         │                      │
         ▼                      ▼
  parseEvent()           parseEvent()
         │                      │
         ▼                      ▼
  updateState()          updateState()
         │                      │
         ▼                      ▼
  React re-render        React re-render
         │                      │
         ▼                      ▼
  ┌────────────┐       ┌────────────┐
  │ Control    │       │    SDC     │
  │ Room       │       │ Dashboard  │
  │ Display    │       │            │
  │ UPDATED    │       │  UPDATED   │
  └────────────┘       └────────────┘

  Total Time: 50-200ms
```

---

## Engineering Dispatch Flow

```
┌──────────────────────────┐
│ Control Room Display     │
│ Breakdown: BD-001        │
│ Status: REPORTED         │
│ [Assign Engineer]        │
└──────────┬───────────────┘
           ↓
      Click "Assign Engineer"
           ↓
┌──────────────────────────┐
│ Dispatch Modal Opens     │
│ GET /api/engineering/    │
│    engineers/available   │
│                          │
│ Available Engineers:     │
│ ☑ Mike Brown (3.2mi)    │
│ ☐ Tom Davis (5.1mi)     │
│                          │
│ [Dispatch]               │
└──────────┬───────────────┘
           ↓
      Click "Dispatch"
           ↓
POST /api/engineering/assign
{
  breakdown_id,
  engineer_id,
  estimated_arrival_minutes
}
           ↓
┌──────────────────────────┐
│ Backend Processing       │
│ 1. UPDATE breakdowns     │
│    SET status='dispatched'│
│ 2. UPDATE engineers      │
│    SET status='dispatched'│
│ 3. INSERT engineer_jobs  │
│ 4. Log activity          │
│ 5. Broadcast WebSocket   │
└──────────┬───────────────┘
           │
    ┌──────┴──────┬──────────┬──────────┐
    ▼             ▼          ▼          ▼
Control Room  Engineering  HomePage   SDC Dash
Status:       New job in   Activity   Status:
DISPATCHED    "My Jobs"    updated    DISPATCHED
Badge: 🟠     🔔 Notify    +1 event   Badge: 🟠
Mike Brown    engineer     in feed    Mike Brown
ETA: 15min    ETA: 15min              ETA: 15min
```

---

## Data Flow Patterns (Icons)

### Pattern 1: User Action → API → Database → Broadcast

```
👤 User Action
   ↓
📡 HTTP API Call
   ↓
💾 Database Write
   ↓
📢 WebSocket Broadcast
   ↓
🖥️ All Screens Update
```

### Pattern 2: Screen Load → API → Display

```
🖥️ Screen Mounts
   ↓
📡 API Call
   ↓
💾 Database Read
   ↓
📦 Response Data
   ↓
🖥️ Display Data
   ↓
🔄 Start Polling (if needed)
```

### Pattern 3: Real-Time Event → Update

```
⚡ Event Occurs
   ↓
📢 WebSocket Message
   ↓
👂 Client Listener
   ↓
🔄 State Update
   ↓
🖥️ UI Re-render
```

---

## Screen State Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│ Login Screen                                                 │
│ Dependencies: NONE                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ State: email, password                                  │ │
│ │ API: POST /api/auth/login                               │ │
│ │ Output: token, user → sessionStorage                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Operations Centre (HomePage)                                 │
│ Dependencies: auth_token, current_user                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ State: dashboardData, activityFeed                      │ │
│ │ APIs:                                                   │ │
│ │   - GET /api/analytics/kpis                             │ │
│ │   - GET /api/activity/feed (polling 5s)                 │ │
│ │ WebSocket: 'breakdowns' channel                         │ │
│ │ Navigation: Breakdown Guide, Control Room, Dashboards   │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Breakdown Guide                                              │
│ Dependencies: auth_token, supervisorSession                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ State: selectedVehicle, breakdownLocation,              │ │
│ │        currentWizard, responses, assessmentId           │ │
│ │ APIs:                                                   │ │
│ │   - GET /api/fleet (vehicle selection)                  │ │
│ │   - POST /api/breakdowns (submission)                   │ │
│ │ WebSocket: 'sdc-dashboard', 'assessments' (broadcast)   │ │
│ │ Flow: Issue → Vehicle → Location → Wizard → Submit     │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Control Room Display                                         │
│ Dependencies: NONE (public)                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ State: breakdowns, filters                              │ │
│ │ APIs:                                                   │ │
│ │   - GET /api/public/breakdowns/live (polling 30s)       │ │
│ │ WebSocket: 'control-room' channel (real-time updates)   │ │
│ │ Display: Live breakdown cards with status indicators    │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## WebSocket Channel Architecture

```
                   Backend WebSocket Server
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐     ┌─────▼─────┐    ┌─────▼─────┐
    │ Channel:  │     │ Channel:  │    │ Channel:  │
    │ sdc-      │     │ control-  │    │ defect-   │
    │ dashboard │     │ room      │    │ intelligence│
    │           │     │           │    │           │
    │ 🔒 Auth   │     │ 🌍 Public │    │ 🌍 Public │
    └─────┬─────┘     └─────┬─────┘    └─────┬─────┘
          │                 │                  │
    ┌─────┴─────┐     ┌─────┴─────┐    ┌─────┴─────┐
    │ Events:   │     │ Events:   │    │ Events:   │
    │           │     │           │    │           │
    │ • assess- │     │ • breakdown│    │ • repeat  │
    │   ment_   │     │   _created│    │   _defect │
    │   progress│     │ • engineer│    │ • trend   │
    │ • breakdown│    │   _assigned│   │   _update │
    │   _created│     │ • breakdown│    │ • critical│
    │ • wizard_ │     │   _updated│    │   _pattern│
    │   completed│    │           │    │           │
    └───────────┘     └───────────┘    └───────────┘
```

---

## Authentication Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Login Successful                           │
│              JWT Token Generated                            │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ sessionStorage  │     │  AuthContext    │
│                 │     │                 │
│ auth_token      │────▶│ isAuthenticated │
│ current_user    │     │ currentUser     │
└────────┬────────┘     │ token           │
         │              └────────┬────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         ▼              ▼                 ▼
┌─────────────────────────┐     ┌─────────────────┐
│  HTTP Request Headers   │     │ WebSocket URL   │
│                         │     │                 │
│ Authorization:          │     │ ws://backend/ws │
│ Bearer eyJhbGc...       │     │ ?token=eyJhbGc...│
│                         │     │ &channel=sdc    │
└─────────────────────────┘     └─────────────────┘
```

---

## Critical Issues (Visual)

### Issue 1: Activity Feed Polling (Should be WebSocket)

```
❌ CURRENT (Slow):
Activity happens
      ↓
MySQL INSERT
      ↓
[Wait up to 5 seconds]
      ↓
Client polls API
      ↓
Display updated

✅ RECOMMENDED (Fast):
Activity happens
      ↓
MySQL INSERT
      ↓
WebSocket broadcast ━━━━━━━━⚡ 50-200ms ━━━━━━━━→ Display updated
```

---

### Issue 2: No Wizard State Persistence

```
❌ CURRENT:
User starts wizard
      ↓
Answers 5/7 questions
      ↓
🔄 Page refresh
      ↓
❌ All progress lost
      ↓
Start over from Step 1

✅ RECOMMENDED:
User starts wizard
      ↓
Answers 5/7 questions
      ↓
💾 Save to sessionStorage
      ↓
🔄 Page refresh
      ↓
✅ "Resume Assessment?"
      ↓
Continue from Step 6
```

---

## Performance Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    Latency Comparison                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  WebSocket Events        ████ 50-200ms   ⚡ EXCELLENT       │
│  Breakdown Creation      █████ 100-300ms  ✅ VERY GOOD       │
│  API Calls (cached)      ██████ 200-500ms  ✅ GOOD          │
│  Activity Feed Polling   ████████████████████ 5000ms ⚠️ SLOW│
│  Dashboard Stats Polling ████████████████████████████████    │
│                          30000ms ⚠️ VERY SLOW               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen Navigation Map

```
                    ┌────────────┐
                    │   Login    │
                    └─────┬──────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Operations Centre    │
              │     (HomePage)        │
              └───┬───────────┬───────┘
                  │           │
    ┌─────────────┼───────────┼─────────────┐
    │             │           │             │
    ▼             ▼           ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐
│Breakdown│ │ Control │ │   SDC   │ │ Management  │
│  Guide  │ │  Room   │ │Dashboard│ │  Dashboard  │
│         │ │ Display │ │         │ │  (Admin)    │
└─────────┘ └─────────┘ └─────────┘ └─────────────┘
     │
     ├─ Select Issue
     ├─ Select Vehicle
     ├─ Capture Location
     └─▶ Wizard (Q&A)
           │
           └─▶ Submit
                 │
                 └─▶ Confirmation
                       │
                       └─▶ Back to Home
```

---

**Generated**: October 27, 2025
**For**: Go BARRY System
**See Also**: SCREEN_TO_SCREEN_DATA_FLOW.md (detailed documentation)
