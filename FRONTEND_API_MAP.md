# Frontend API Usage Map - Go BARRY

## API Configuration

### Base URL Configuration
- **Primary URL**: `https://go-barry.onrender.com` (Production)
- **Development URL**: `http://localhost:3001` (local dev - not used in code)
- **Force Production**: Both `apiConfig.js` and `config/api.js` force production URLs at all times

### Configuration Files
1. **`/utils/apiConfig.js`**
   - Helper function: `getApiUrl(endpoint)` - builds absolute URLs
   - Helper function: `apiFetch(endpoint, options)` - wraps fetch with production URL
   - Exports: `API_BASE_URL`, `API_ENDPOINTS` object with common routes

2. **`/config/api.js`**
   - Main config object: `API_CONFIG`
   - Helper function: `apiRequest(endpoint, options)` - with retry logic & timeout handling
   - Retry logic: Up to 2 retries with exponential backoff (2s, 4s, 8s max)
   - Request timeouts: 45s default, 60s for uploads, 90s for reports
   - Refresh intervals: Dashboard 30s, alerts 20s, incidents 15s

3. **`/components/hooks/useApi.js`** (Primary API Hook)
   - Handles authentication with JWT tokens
   - Token stored in memory (NOT localStorage for security)
   - Provides: `get()`, `post()`, `put()`, `delete()`, `apiCall()`
   - Features:
     - Automatic token refresh before expiry (5s buffer)
     - 401 retry once with refreshed token
     - 403 logout immediately
     - Request timeout handling (10s default from env)
     - Concurrent refresh prevention

### Authentication System

#### Storage Strategy
- **Access Token**: Memory only (`sessionStorageService.accessTokenMemory`)
- **Refresh Token**: HttpOnly cookie (backend managed)
- **Session Data**: localStorage + memory (NO tokens stored)
- **JWT Auth Header**: `Authorization: Bearer {accessToken}`

#### Login Flow (useApi.js)
1. User selects supervisor badge, password, duty in AppHeader
2. Calls: `POST /api/auth/login` with badge & password
3. Response includes access token (stored in memory)
4. Backend sets refresh token in HttpOnly cookie
5. Session object created with supervisor data
6. Saved to localStorage (without access token)

#### Token Refresh Flow
1. Automatic refresh when token expires soon (5s buffer)
2. Concurrent refresh prevention via Promise tracking
3. Calls: `POST /api/auth/refresh`
4. Credentials include: true (sends HttpOnly refresh token cookie)
5. Returns new access token (stored in memory)
6. Failed refresh triggers logout

---

## Screen-by-Screen API Calls

### Home Screen (app/index.jsx → components/HomePageWithLogin.jsx)
**File**: `/Go_BARRY/app/index.jsx` → `/components/HomePageWithLogin.jsx`

#### On Mount:
- `GET https://go-barry.onrender.com/api/health` - System status check
  - Trigger: Periodic (every 30s)
  - Purpose: Display system operational status in header
  - No authentication required

#### On Login Success (via AppHeader):
- `POST /api/auth/login` - Authenticate supervisor
  - Payload: `{ badge, password }`
  - Response: `{ success, token, user: { id, name, badge, role, email, depot } }`
  - Token storage: Memory only
  - Creates session with duties list

#### On Card Click:
- Routes to: `/operations-centre`, `/disruption-centre`, `/communications-hub`, `/admin`, etc.
- No API calls (navigation only)

---

### Operations Centre (app/operations-centre/index.jsx)
**File**: `/Go_BARRY/app/operations-centre/index.jsx`

#### On Mount:
- Verifies authentication via `useNavigationGuard` hook
- Calls: `fetchOperationsStats()` (see below)

#### Periodic Calls (30s interval):
1. `GET /api/alerts-enhanced` - Active alerts data
   - Purpose: Update alert counts and high-priority alert list
   - Response: `{ alerts: [{severity, type, location, ...}] }`
   - Data Used: Total alerts, high-priority filters

2. `GET /api/analytics/summary` - Daily analytics
   - Purpose: On-time performance metrics
   - Response: `{ summary: { last24Hours, onTimePercentage } }`
   - Data Used: Statistics card, performance metrics

3. `GET /api/health-extended` - System health details
   - Purpose: Backend service health status
   - Response: `{ status, api, database, memory, ... }`
   - Data Used: System health indicator

#### On Button Click:
- **Password Status Check**:
  - `GET /api/password/password-status/{badge}` - Password expiry check
  - Trigger: On supervisor loaded
  - Response: `{ daysUntilExpiry, success }`
  - Updates: Change Password card display

- **Card Click Navigation**:
  - Routes to individual card screens (no API call)

#### Card Statistics Refresh:
- Updates every 30 seconds from fetched data
- Card stats shown:
  - Disruptions: Total alerts count
  - Live Map: High-priority alert count
  - Statistics: Daily events count
  - On-time Request: SharePoint iframe (not API)
  - Daily Lost Mileage: SDC Report iframe (not API)

---

### Disruption Centre (app/disruption-centre/index.jsx)
**File**: `/Go_BARRY/app/disruption-centre/index.jsx`

#### On Mount:
- Verifies authentication via `useNavigationGuard` hook

#### Periodic Calls (120s interval - reduced to prevent duplication):
1. `GET /api/roadworks/unified` - Active roadworks
   - Purpose: Count active disruptions from roadworks
   - Response: `{ data: [{status, location, ...}] }`
   - Data Used: Roadworks manager card count

2. `GET /api/incident-alerts` - Incident data
   - Purpose: Count active incidents
   - Response: `{ incidents: [{status, ...}] }`
   - Data Used: Incidents manager card count

#### On Card Selection:
- **Disruption Database**: Loads `DisruptionDatabase` component
  - `GET /api/disruptions/active` - Active disruptions
  - `GET /api/disruptions/stats` - Statistics
  - `GET /api/disruptions/all?limit=100` - All disruptions
  - Updates: Every 30s from component

- **Roadworks Manager**: Loads `RoadworksManagerDashboard` component
  - Multiple API calls (see component details below)

---

### Admin Dashboard (app/admin/index.jsx)
**File**: `/Go_BARRY/app/admin/index.jsx`

#### Navigation Handler (No API calls):
- Routes to sub-pages on card click
- Pages available:
  - `/admin/system-overview`
  - `/admin/intelligence`
  - `/admin/roadworks`
  - `/admin/supervisors`
  - `/admin/audit`
  - `/admin/analytics`
  - `/admin/api-usage`
  - `/admin/live-map`

---

### System Overview Admin Page (app/admin/system-overview.jsx)
**File**: `/Go_BARRY/app/admin/system-overview.jsx`

#### On Mount:
- Redirects if not admin
- Calls: `fetchSystemHealth()`, `fetchCoverageData()`

#### Periodic Calls (10s interval):
1. `GET /api/admin/health-extended` - Detailed system health
   - Authentication: Bearer token required
   - Response: `{ api, database, memory, system }`
   - Data Used: Service health grid, RAM percentage, health status

2. `GET /api/alerts-enhanced` - Alerts for coverage map
   - Purpose: Group alerts by area
   - Response: `{ alerts: [{location, area, ...}] }`
   - Data Used: Coverage data grouped by area

#### On Action:
- **Restart Service**:
  - `POST /api/admin/restart/{service}` - Restart specific service
  - Authentication: Bearer token required
  - Payload: `{ service }`
  - Response: Success/error message
  - Refresh: Calls `fetchSystemHealth()` after restart

---

### Supervisor Management Admin Page (app/admin/supervisors.jsx)
**File**: `/Go_BARRY/app/admin/supervisors.jsx`

#### On Mount:
- Redirects if not admin
- Calls: `loadSupervisors()`, `loadActiveSessions()`

#### Supervisor Loading:
1. **Auth Check** (JWT in HttpOnly cookie):
   - `GET /api/auth/check` - Verify valid JWT tokens
   - Credentials: include (sends cookies)
   - Response: `{ authenticated, success }`

2. **Load Supervisors** (with fallback chain):
   - Primary: `GET /api/supervisor/list/all` - Admin endpoint (requires JWT)
   - Fallback: `GET /api/supervisor/active/list` - Public endpoint
   - Response: `{ supervisors: [{id, name, badge, role, ...}] }`
   - If both fail: Uses hardcoded fallback supervisors list

#### Token Refresh Flow (on 401):
- `POST /api/auth/refresh` - Refresh JWT tokens
  - Credentials: include
  - Response: `{ success }`

#### Periodic Calls (30s interval):
- `loadActiveSessions()` - Get active supervisor sessions
  - Purpose: Monitor who's logged in
  - Data Used: Active sessions display

#### On Action:
- Add Supervisor: `POST /api/supervisor/add` (form data)
- Edit Supervisor: `PUT /api/supervisor/{id}` (form data)
- Delete Supervisor: `DELETE /api/supervisor/{id}`
- Manage Permissions: Various permission endpoints

---

### Disruption Database Component (components/DisruptionDatabase.jsx)
**File**: `/components/DisruptionDatabase.jsx`

#### On Mount:
- Calls: `fetchDisruptions()`

#### Periodic Calls (30s interval):
1. `GET /api/disruptions/active` - Active disruptions only
2. `GET /api/disruptions/stats` - Statistics
3. `GET /api/disruptions/all?limit=100` - All disruptions (with limit)
   - Purpose: Load all disruptions for tab filtering
   - Response: `{ disruptions: [{status, location, affected_routes, ...}] }`
   - Filtering: Frontend filters by status (Active, Ended) and search

#### On Action:
- **End Disruption**:
  - `PUT /api/disruptions/{id}/end` - Mark disruption as ended
  - Payload: `{ endedBy, endedByName, reason, sessionId }`
  - Response: Success confirmation
  - Refresh: Calls `fetchDisruptions()` on success

- **Reactivate Disruption**:
  - `PUT /api/disruptions/{id}/reactivate` - Resume disruption
  - Payload: `{ reactivatedBy, reactivatedByName, reason, sessionId }`
  - Response: Success confirmation
  - Refresh: Calls `fetchDisruptions()` on success

---

## Critical User Flows

### Flow 1: Login → Operations Centre
1. **Screen**: HomePageWithLogin (home page)
2. **User Action**: Click "Supervisor Login" → Select badge, password, duty → Click Login
3. **API Call**: 
   - `POST /api/auth/login` with badge & password
   - Returns: access token + user data
4. **State Change**:
   - Access token stored in memory
   - Session created and stored in localStorage
   - `useSupervisor()` context updates
   - Navigation enabled for protected screens
5. **Next Screen**: Home page now shows "Welcome back, {name}"
6. **Data Available**:
   - `supervisorName`, `supervisorSession`, `isAdmin` flags
   - `currentShift`, `isClockedIn` states
   - `accessToken` for authenticated API calls

### Flow 2: View Operations Centre Stats
1. **Screen**: Operations Centre
2. **On Mount**: `useNavigationGuard` verifies authentication
3. **API Calls** (parallel):
   - `GET /api/alerts-enhanced` → Total alerts, high-priority count
   - `GET /api/analytics/summary` → On-time %, daily events
   - `GET /api/health-extended` → System status
4. **Data Processing**:
   - Alert counts → Update "Disruptions" card
   - High-priority alerts → Update "Live Map" alerts card
   - Daily events → Update "Statistics" card
   - System status → System health indicator
5. **Display**: Card statistics updated every 30 seconds
6. **User Can**: Click cards to navigate to detailed views

### Flow 3: Create/End Disruption
1. **Screen**: DisruptionDatabase (via Disruptions card)
2. **On Load**:
   - `GET /api/disruptions/active` → Active disruptions list
   - `GET /api/disruptions/all?limit=100` → All disruptions
3. **User Action**: Click "End Disruption" on active item
4. **API Call**:
   - `PUT /api/disruptions/{id}/end` with supervisor badge & reason
   - Response: Success confirmation
5. **Refresh**: `fetchDisruptions()` reloads all data
6. **Display Update**: 
   - Disruption moves to "Ended" tab
   - Active disruption count decreases

### Flow 4: Admin System Check → Restart Service
1. **Screen**: System Overview (admin only)
2. **On Load**:
   - `GET /api/admin/health-extended` → Service health
   - `GET /api/alerts-enhanced` → Coverage data
3. **Display**: Service health grid with status indicators
4. **User Action**: Click "Restart" on unhealthy service
5. **API Call**:
   - `POST /api/admin/restart/{service}` with Bearer token
   - Response: Success message
6. **Refresh**: `fetchSystemHealth()` reloads metrics
7. **Verification**: User sees service status change to "healthy"

### Flow 5: Admin Manage Supervisors
1. **Screen**: Supervisor Management (admin only)
2. **On Load**:
   - `GET /api/auth/check` → Verify JWT authentication
   - `GET /api/supervisor/list/all` → Load supervisors (requires JWT)
   - Fallback: `GET /api/supervisor/active/list` if admin fails
   - Fallback: Hardcoded list if both fail
3. **Display**: Supervisor list with current status
4. **Periodic**: `loadActiveSessions()` every 30s
5. **User Action**: Add/Edit/Delete supervisor
6. **API Calls**:
   - `POST /api/supervisor/add` → New supervisor
   - `PUT /api/supervisor/{id}` → Edit supervisor
   - `DELETE /api/supervisor/{id}` → Remove supervisor
7. **Refresh**: List reloads after action

---

## API Endpoints Summary

### Authentication Endpoints
- `POST /api/auth/login` - Supervisor authentication
- `POST /api/auth/refresh` - Token refresh (HttpOnly cookie)
- `POST /api/auth/logout` - Clear session
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/check` - Verify JWT token validity

### Alert & Disruption Endpoints
- `GET /api/alerts` - Basic alerts
- `GET /api/alerts-enhanced` - Alerts with detailed data
- `GET /api/disruptions/active` - Active disruptions only
- `GET /api/disruptions/all` - All disruptions (paginated)
- `GET /api/disruptions/stats` - Disruption statistics
- `GET /api/incident-alerts` - Incident data
- `PUT /api/disruptions/{id}/end` - Mark disruption ended
- `PUT /api/disruptions/{id}/reactivate` - Resume disruption

### Roadworks & Infrastructure
- `GET /api/roadworks/unified` - Unified roadworks data
- `POST /api/roadworks/create` - Create new roadwork
- `PUT /api/roadworks/{id}` - Update roadwork
- `DELETE /api/roadworks/{id}` - Remove roadwork

### Analytics & Reporting
- `GET /api/analytics/summary` - Daily analytics summary
- `GET /api/service-frequency` - Service frequency data
- `GET /api/service-frequency/dashboard` - SF dashboard data
- `GET /api/disruptions/logs` - Disruption logs
- `GET /api/disruptions/statistics` - Disruption stats

### Admin Endpoints
- `GET /api/admin/health-extended` - System health details
- `POST /api/admin/restart/{service}` - Restart service
- `GET /api/supervisor/list/all` - All supervisors (admin)
- `GET /api/supervisor/active/list` - Active supervisors
- `POST /api/supervisor/add` - Create supervisor
- `PUT /api/supervisor/{id}` - Update supervisor
- `DELETE /api/supervisor/{id}` - Delete supervisor

### Utility Endpoints
- `GET /api/health` - Basic health check
- `GET /api/password/password-status/{badge}` - Password expiry status
- `GET /api/streetmanager/all` - Street Manager data
- `GET /api/routes` - Route definitions

---

## Critical Data Flows

### Login → Session Storage
```
User Input (badge, password, duty)
    ↓
POST /api/auth/login
    ↓
Response: { token, user: {...} }
    ↓
Store: accessToken → Memory only
Store: refreshToken → HttpOnly cookie (backend)
Store: session → localStorage (no tokens)
    ↓
useSupervisor() context updates
    ↓
Navigation enabled for protected screens
```

### API Call with Token Refresh
```
Component makes GET/POST request
    ↓
ensureValidToken() checks expiry
    ↓
Token expires soon? → POST /api/auth/refresh
    ↓
Fresh token stored in memory
    ↓
Request made with: Authorization: Bearer {newToken}
    ↓
401 response? → Refresh once more
    ↓
Still 401? → logout() called
```

### Real-time Updates
```
Component mounts
    ↓
Fetch initial data via API
    ↓
setInterval() with 10s-120s based on screen
    ↓
Background polling updates state
    ↓
Component re-renders with new data
    ↓
User sees "Last updated: X seconds ago"
```

---

## Missing/Broken API Calls

### Potentially Missing Implementations
1. **Create Incident Flow** - No direct API call found in frontend
   - Components reference `create_incidents` permission
   - Likely calls `/api/incidents/create` (not found in grep)
   - Needs implementation or verification

2. **Send Messages Flow** - No direct API call found
   - Components reference `send_messages` permission
   - Likely calls `/api/messaging/send` (not found in grep)
   - Needs implementation or verification

3. **Activity Logging** - Calls mentioned but not shown
   - `logActivity()` function exists but sends to Convex, not backend
   - May need backend audit log endpoint

4. **Change Password** - Implementation in hook but flow not fully tested
   - `POST /api/auth/change-password` endpoint defined
   - Frontend flow exists but validation/security needs review

### Known Broken/Issues
1. **MapQuest Geocoding** - CLAUDE.md notes "Authentication broken"
   - No frontend calls found (likely on backend)

2. **Elgin/SCOOT Integration** - CLAUDE.md notes "Integration incomplete"
   - No frontend calls found

3. **Token Expiry Handling** - Edge case where refresh fails
   - Logout is called but UI doesn't always show message
   - User might be confused about sudden logout

---

## Authentication Token Flow Diagram

```
┌─────────────────────────────────────────┐
│ Home Page - Supervisor Login            │
│ (components/common/AppHeader.jsx)       │
└──────────────┬──────────────────────────┘
               │ User enters badge, password, duty
               ↓
     ┌─────────────────────────┐
     │ POST /api/auth/login    │
     │ { badge, password }     │
     └─────────┬───────────────┘
               │
         ┌─────┴─────┐
         │ Success? │
         └─────┬─────┘
               │ YES
               ↓
    ┌──────────────────────────┐
    │ Response:                │
    │ - token (access)         │ ← Stored in memory only
    │ - user { name, role }    │
    │ - Set HttpOnly cookie    │ ← Refresh token (backend managed)
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │ Create session object    │
    │ Store in localStorage    │ ← NO access token stored
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │ Update useSupervisor()   │
    │ context state            │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │ Unlock protected screens │
    │ Route to /operations     │
    └──────────────────────────┘

┌─────────────────────────────────────────┐
│ During API Calls (useApi.js)            │
└──────────────┬──────────────────────────┘
               │ Component calls: get(), post(), etc.
               ↓
      ┌────────────────────────┐
      │ Ensure token valid     │
      │ Check expiry           │
      └────────┬───────────────┘
               │
         ┌─────┴──────────────────┐
         │ Expires soon (5s)?     │
         └─────┬──────────────────┘
               │ YES
               ↓
      ┌────────────────────────────┐
      │ POST /api/auth/refresh     │
      │ credentials: include       │ ← Sends HttpOnly cookie
      │ (No params needed)         │
      └────────┬───────────────────┘
               │
         ┌─────┴──────────────┐
         │ New token in       │
         │ response?          │
         └─────┬──────────────┘
               │ YES
               ↓
      ┌────────────────────────┐
      │ Update memory with     │
      │ new access token       │
      └────────┬───────────────┘
               │
               ↓
      ┌────────────────────────┐
      │ Make API request with  │
      │ Authorization header   │ ← Bearer {newToken}
      └────────────────────────┘
```

---

## Environment & Configuration Notes

- **Backend Host**: `https://go-barry.onrender.com` (2GB RAM limit)
- **Frontend Platform**: React Native with Expo (web primary)
- **API Module System**: ES6 imports (fetch API, no axios)
- **CORS**: Configured for gobarry.co.uk domain
- **Memory Constraints**: Backend optimized for 2GB, so large requests rare
- **Error Handling**: Most endpoints have fallback mechanisms or graceful degradation

