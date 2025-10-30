# Go BARRY Data Flow Documentation Index

**Quick Reference Guide to System Data Flows**

---

## Primary Documents

### 1. **SCREEN_TO_SCREEN_DATA_FLOW.md** (NEW)
**Purpose**: Complete mapping of data flow between all user-facing screens

**Contents**:
- Authentication Flow (Login → Operations Centre)
- Breakdown Creation Flow (Operations Centre → Breakdown Guide → Wizard → Confirmation)
- View Breakdowns Flow (Operations Centre → Control Room → Details)
- Assessment Wizard Flow (Step-by-step wizard navigation)
- Engineering Dispatch Flow (Control Room → Dispatch → Engineering Dashboard → Completion)
- Admin Operations Flow (System Overview → User Management)
- Real-Time Update Flows (WebSocket event propagation)
- Data Flow Diagrams (Visual mappings)
- Issues & Recommendations (10 identified issues with priorities)

**When to Use**:
- Understanding how data passes between screens
- Debugging screen navigation issues
- Planning new features that span multiple screens
- Onboarding new developers

---

### 2. **COMPLETE_API_ENDPOINT_AUDIT.md**
**Purpose**: Complete inventory of all backend API endpoints

**Contents**:
- 165+ endpoints across 14 route files
- Authentication & Supervisors (21 endpoints)
- Breakdowns & Tracking (42 endpoints)
- Fleet Management (11 endpoints)
- Activity & Audit Logging (18 endpoints)
- Engineering Operations (32 endpoints)
- Defects & Maintenance (8 endpoints)
- Analytics & Reporting (15 endpoints)
- Wizard Assessment (5+ endpoints)
- User Preferences (6 endpoints)
- Public & Display APIs (7 endpoints)

**When to Use**:
- Finding the right API endpoint for a feature
- Understanding request/response formats
- Checking authentication requirements
- API integration planning

---

### 3. **REALTIME_DATA_FLOW_SUMMARY.md**
**Purpose**: Deep dive into WebSocket and real-time data architecture

**Contents**:
- WebSocket vs Convex clarification (WebSocket is used, NOT Convex)
- Real-time data flows (Assessment completion, Breakdown creation, Activity feed)
- WebSocket channels (Protected vs Public)
- WebSocket event types (Assessment, Breakdown, Defect events)
- Authentication flow for WebSocket connections
- Frontend React hooks (useWebSocket, useAssessmentWebSocket, useSDCAssessmentEvents)
- Performance characteristics
- Configuration tuning
- Complete data flow diagram
- File references

**When to Use**:
- Troubleshooting real-time updates
- Adding new WebSocket events
- Performance optimization
- Understanding why data appears instantly on some screens

---

### 4. **API_WEBSOCKET_ANALYSIS.md** (Backend-focused)
**Purpose**: Comprehensive backend API and WebSocket implementation details

**Contents**:
- Complete endpoint inventory with HTTP methods
- WebSocket implementation architecture
- WebSocket endpoints and channels
- Message types (Client → Server, Server → Client)
- Defect intelligence events
- Connection management
- Authentication flow
- Supervisor state synchronization
- External API integrations (none currently active)
- cPanel compatibility analysis
- Security analysis
- Integration issues & recommendations

**When to Use**:
- Backend development and debugging
- WebSocket server configuration
- Security audits
- Deployment to cPanel
- Understanding backend architecture

---

## Quick Reference Tables

### Screen-to-API Mapping

| Screen | Primary APIs | WebSocket Channels | Polling |
|--------|-------------|-------------------|---------|
| **Login Page** | POST /api/auth/login | None | No |
| **Operations Centre** | GET /api/analytics/kpis<br>GET /api/activity/feed | breakdowns | Activity feed: 5s |
| **Breakdown Guide** | POST /api/breakdowns<br>GET /api/fleet | sdc-dashboard, assessments | No |
| **Control Room Display** | GET /api/public/breakdowns/live | control-room | Breakdowns: 30s |
| **SDC Dashboard** | GET /api/breakdowns/live | sdc-dashboard | No |
| **Engineering Dashboard** | GET /api/engineering/jobs | engineering | No |
| **Management Dashboard** | GET /api/analytics/kpis<br>GET /api/analytics/trends<br>GET /api/analytics/depot-comparison | None | Stats: 30s |

---

### WebSocket Events by Screen

| Event | Control Room | SDC Dashboard | Homepage | Engineering |
|-------|-------------|--------------|----------|-------------|
| `breakdown_created` | ✅ Add to list | ✅ Add to queue | ✅ Update count | ✅ Add to unassigned |
| `breakdown_updated` | ✅ Update card | ✅ Update status | ❌ | ✅ Update job |
| `breakdown_resolved` | ✅ Remove from list | ✅ Remove from queue | ✅ Update count | ✅ Move to completed |
| `engineer_assigned` | ✅ Update status | ✅ Update badge | ❌ | ✅ Add to my jobs |
| `assessment_progress` | ❌ | ✅ Show progress | ❌ | ❌ |
| `assessment_completed` | ❌ | ✅ Complete wizard | ❌ | ❌ |

---

### Data Flow Latency

| Operation | Mechanism | Latency | Used By |
|-----------|-----------|---------|---------|
| Breakdown creation | WebSocket broadcast | 50-200ms | Control Room, SDC Dashboard |
| Engineering dispatch | WebSocket broadcast | 50-200ms | All dashboards |
| Wizard progress update | WebSocket broadcast | 50-200ms | SDC Dashboard |
| Assessment completion | WebSocket broadcast | 100-300ms | All dashboards |
| Activity feed update | HTTP polling | **5000ms** | Homepage, SDC Dashboard |
| Breakdown list refresh | HTTP polling | 30000ms | Control Room Display |
| Dashboard stats | HTTP polling | 30000ms | Homepage, Management |

---

### Authentication Requirements

| Screen/API | Auth Required | Role Required | Token Location |
|------------|--------------|---------------|----------------|
| Login Page | No | None | N/A |
| Operations Centre | Yes | Any | sessionStorage |
| Breakdown Guide | Yes | Supervisor | sessionStorage |
| Control Room Display | **No** | None | N/A (public) |
| SDC Dashboard | Yes | Supervisor | sessionStorage |
| Engineering Dashboard | Yes | Any | sessionStorage |
| Management Dashboard | Yes | **Admin** | sessionStorage |
| POST /api/breakdowns | Yes | Supervisor | Bearer token |
| GET /api/public/breakdowns/live | No | None | N/A |
| WebSocket sdc-dashboard | Yes | Supervisor | Query param |
| WebSocket control-room | No | None | N/A |

---

## Common Data Flow Patterns

### Pattern 1: User Action → API → Database → WebSocket → All Screens

**Example**: Breakdown Creation

```
User completes wizard
  ↓
POST /api/breakdowns { ...data }
  ↓
Backend: INSERT INTO breakdowns
  ↓
Backend: activityLogger.logBreakdownReported()
  ↓
Backend: webSocketHandler.broadcastBreakdownCreated()
  ↓
All connected screens receive 'breakdown_created' event
  ↓
Each screen updates relevant UI component
  ↓
Total time: 100-300ms
```

---

### Pattern 2: Screen Mount → API Call → Display Data

**Example**: Control Room Display Load

```
ControlRoomDisplay mounts
  ↓
useEffect: fetch initial data
  ↓
GET /api/public/breakdowns/live
  ↓
Backend: SELECT * FROM breakdowns WHERE status IN (...)
  ↓
Response: { breakdowns: [...] }
  ↓
setBreakdowns(data.breakdowns)
  ↓
Render breakdown cards
  ↓
Start polling: every 30s
  ↓
Connect WebSocket: real-time updates
```

---

### Pattern 3: Real-Time Event → State Update → UI Re-render

**Example**: Engineering Dispatch Notification

```
Supervisor assigns engineer
  ↓
POST /api/engineering/assign
  ↓
Backend: UPDATE breakdowns, UPDATE engineers, INSERT engineer_jobs
  ↓
Backend: webSocketHandler.broadcastEngineerAssigned()
  ↓
WebSocket message to all clients on 'engineering' channel
  ↓
Engineering Dashboard: handleMessage()
  ↓
setMyJobs(prev => [...prev, newJob])
  ↓
React re-renders "My Jobs" section
  ↓
New job card appears with animation
  ↓
Total time: 50-200ms
```

---

## Critical Path Analysis

### Most Critical Data Flows (Must Never Fail)

1. **Authentication (Login → Token → Operations Centre)**
   - Failure Impact: Users locked out
   - Dependencies: MySQL supervisors table, JWT secret
   - Fallback: None - must work

2. **Breakdown Creation (Wizard → API → Database)**
   - Failure Impact: Breakdowns not recorded
   - Dependencies: MySQL breakdowns table, activity logger
   - Fallback: Manual entry, data export

3. **WebSocket Broadcasting (Event → All Screens)**
   - Failure Impact: Real-time updates lost (users see stale data)
   - Dependencies: WebSocket server, client connections
   - Fallback: HTTP polling (30s delay)

4. **Engineering Dispatch (Assign → Notify → Engineer)**
   - Failure Impact: Engineers not notified, SLA violations
   - Dependencies: MySQL engineer_jobs table, WebSocket
   - Fallback: Email/SMS notification (not implemented)

---

## Debugging Checklist

### "Data Not Appearing on Screen" Troubleshooting

**Step 1: Check Authentication**
- [ ] Is user logged in? (Check sessionStorage for 'auth_token')
- [ ] Is token valid? (Call GET /api/auth/validate)
- [ ] Does user have required role? (Check currentUser.role)

**Step 2: Check API Response**
- [ ] Open browser DevTools → Network tab
- [ ] Find API call (e.g., /api/breakdowns/live)
- [ ] Check status code (200 = success, 401 = auth, 500 = server error)
- [ ] Check response body (contains expected data?)

**Step 3: Check WebSocket Connection**
- [ ] Open DevTools → Console
- [ ] Look for "WebSocket connected" log
- [ ] Check ws:// or wss:// connection in Network tab (filter: WS)
- [ ] Is connection open? (readyState = 1)

**Step 4: Check Component State**
- [ ] Add console.log(state) in component
- [ ] Is data reaching component state?
- [ ] Is useEffect dependency array correct?
- [ ] Is state update triggering re-render?

**Step 5: Check Real-Time Updates**
- [ ] Is WebSocket listener registered?
- [ ] Is component subscribed to correct channel?
- [ ] Add console.log in message handler
- [ ] Is message being received but not processed?

---

## File Quick Reference

### Frontend Files

| File | Purpose | Key Exports |
|------|---------|------------|
| `/frontend/src/App.jsx` | Main router | App component, Navigation |
| `/frontend/src/contexts/AuthContext.jsx` | Authentication state | AuthProvider, useAuth |
| `/frontend/src/services/websocket.js` | WebSocket client | useWebSocket, useAssessmentWebSocket |
| `/frontend/src/utils/fetchDashboardData.js` | Dashboard API calls | fetchDashboardData |
| `/frontend/src/components/HomePage.jsx` | Operations Centre | HomePage component |
| `/frontend/src/breakdown-guide/App.jsx` | Wizard system | BreakdownGuideApp |
| `/frontend/src/dashboards/control-room/ControlRoomDisplay.jsx` | Live display | ControlRoomDisplay |
| `/frontend/src/dashboards/sdc/SDCDashboard.jsx` | Supervisor dashboard | SDCDashboard |

### Backend Files

| File | Purpose | Key Exports |
|------|---------|------------|
| `/backend/server.js` | Express server | app, server, broadcast functions |
| `/backend/routes/auth.js` | Authentication | 16 auth endpoints |
| `/backend/routes/breakdowns.js` | Breakdown CRUD | 25+ breakdown endpoints |
| `/backend/routes/engineering.js` | Engineering ops | 18 engineering endpoints |
| `/backend/routes/activity.js` | Activity feed | 10 activity endpoints |
| `/backend/routes/webSocketHandler.js` | WebSocket server | Connection management, broadcasts |
| `/backend/services/activityLogger.js` | Activity logging | logBreakdownReported, logEngineerDispatched |

---

## Key Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Total API Endpoints** | 165+ | Across 14 route files |
| **WebSocket Channels** | 5 | sdc-dashboard, breakdowns, control-room, assessments, defect-intelligence |
| **WebSocket Event Types** | 14+ | Breakdown, assessment, defect, engineering events |
| **Frontend Components** | 50+ | Screens, modals, widgets |
| **Real-Time Latency** | 50-200ms | WebSocket event to UI update |
| **Polling Intervals** | 5s (activity), 30s (dashboard) | HTTP polling fallbacks |
| **Database Tables** | 12+ | breakdowns, supervisors, activities, etc. |
| **Active Users** | 9 supervisors | Real production load |

---

## Related Documentation

- `CODEBASE_EXPLORATION_REPORT.md` - Full codebase analysis
- `CODEBASE_QUICK_REFERENCE.md` - Quick reference for common tasks
- `DATABASE_ANALYSIS_REPORT.md` - Database schema and relationships
- `DEPLOYMENT.md` - Deployment instructions
- `DOCUMENTATION_SUMMARY.md` - All documentation overview

---

**Generated**: October 27, 2025
**Version**: 1.0
**Maintainer**: System Architect
