# Duty Selection & Supervisor Tracking - Backend Implementation

**Status:** ✅ Complete - Ready for Testing
**Date:** November 11, 2025
**Version:** 1.0.0

---

## Overview

Complete backend implementation for:
1. **Mandatory duty selection** with persistence and validation
2. **Duty badge in header** with real-time countdown
3. **Live supervisor tracking** for Control Room Display
4. **Automatic logout** 15 minutes before shift ends
5. **Single session enforcement** (prevent simultaneous logins)
6. **Admin override** capability

---

## Files Created

### 1. Database Migration
**File:** `/backend/migrations/010_add_duty_tracking.sql`

**Creates:**
- Duty columns in `supervisors` table (`current_duty`, `duty_start_time`, `duty_end_time`, `duty_locked_at`, `duty_locked_by`)
- `supervisor_sessions` table for real-time tracking
- `supervisor_shift_history` table for reporting
- `v_active_supervisors` view for Control Room Display
- Indexes for performance

**To apply:**
```bash
# Connect to MySQL
mysql -u gobarryco_Gair -p gobarryco_breakdown

# Run migration
source /path/to/backend/migrations/010_add_duty_tracking.sql

# Verify tables created
SHOW TABLES LIKE '%supervisor%';
DESCRIBE supervisor_sessions;
```

### 2. Supervisor Sessions Routes
**File:** `/backend/routes/supervisorSessions.js` (620 lines)

**Endpoints Created:**
- `GET /api/supervisor-sessions/active` - Get all online supervisors (Control Room)
- `GET /api/supervisor-sessions/all` - Get all sessions including offline (Admin only)
- `POST /api/supervisor-sessions/login-session` - Create session after login
- `POST /api/supervisor-sessions/logout` - End session on logout
- `PUT /api/supervisor-sessions/:sessionId/update-duty` - Update duty mid-session
- `POST /api/supervisor-sessions/heartbeat` - Keep session alive
- `GET /api/supervisor-sessions/stats` - Session statistics (Admin only)
- `DELETE /api/supervisor-sessions/:sessionId` - Force close session (Admin only)

**Features:**
- Automatic WebSocket broadcasts on login/logout/duty change
- Single session enforcement (closes existing session on new login)
- Session duration tracking
- Admin control endpoints

### 3. Authentication Enhancements
**File:** `/backend/routes/auth.js` (modified)

**Changes Made:**
1. **Imported webSocketHandler** at top of file
2. **Enhanced login endpoint** (`POST /api/auth/login`):
   - Creates supervisor_sessions record after successful login
   - Broadcasts `supervisor_login` event via WebSocket
   - Closes existing session if duplicate login detected
3. **Enhanced logout endpoint** (`POST /api/auth/logout`):
   - Marks session as offline in database
   - Clears supervisor's current duty
   - Broadcasts `supervisor_logout` event via WebSocket
4. **Enhanced set-duty endpoint** (`POST /api/auth/set-duty`):
   - Updates supervisor_sessions table with duty info
   - Broadcasts `supervisor_duty_change` event via WebSocket
5. **Added current-duty endpoint** (`GET /api/auth/current-duty`):
   - Returns supervisor's current duty information
   - Calculates time remaining until shift ends
   - Used by frontend DutyBadge component

### 4. Server Registration
**File:** `/backend/server.js` (modified)

**Changes:**
- Imported `supervisorSessionsRoutes`
- Registered routes at `/api/supervisor-sessions`

---

## API Endpoints Reference

### Public Endpoints

#### Get Active Supervisors (Control Room Display)
```http
GET /api/supervisor-sessions/active
Authorization: Not required (public for Control Room)

Response:
{
  "success": true,
  "count": 3,
  "sessions": [
    {
      "id": 1,
      "supervisor_id": 123,
      "supervisor_name": "Anthony Gair",
      "email": "anthony@example.com",
      "badge_number": "AG003",
      "current_duty": "Duty 200",
      "duty_start_time": "2025-11-11 07:30:00",
      "duty_end_time": "2025-11-11 17:00:00",
      "depot": "SDC",
      "role": "admin",
      "login_time": "2025-11-11 07:25:00",
      "last_activity": "2025-11-11 10:30:00",
      "session_duration_minutes": 185,
      "duty_minutes_remaining": 390
    }
  ],
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

### Authentication Endpoints

#### Get Current Duty
```http
GET /api/auth/current-duty
Authorization: Bearer <token>

Response (has duty):
{
  "success": true,
  "hasDuty": true,
  "duty_code": "Duty 200",
  "duty_name": "Day shift (07:30 - 17:00)",
  "start_time": "2025-11-11T07:30:00.000Z",
  "end_time": "2025-11-11T17:00:00.000Z",
  "time_remaining_ms": 23400000,
  "minutes_remaining": 390,
  "locked": true
}

Response (no duty):
{
  "success": true,
  "hasDuty": false,
  "message": "No active duty set"
}
```

#### Set Duty After Login
```http
POST /api/auth/set-duty
Authorization: Bearer <token>
Content-Type: application/json

{
  "duty": "Duty 200"
}

Response:
{
  "success": true,
  "duty": "Duty 200",
  "shiftInfo": {
    "duty": "Duty 200",
    "shiftStart": "2025-11-11T07:30:00.000Z",
    "shiftEnd": "2025-11-11T17:00:00.000Z"
  }
}
```

### Session Management Endpoints

#### Create Session (Called by auth.js)
```http
POST /api/supervisor-sessions/login-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "supervisorId": 123,
  "name": "Anthony Gair",
  "email": "anthony@example.com",
  "badgeNumber": "AG003",
  "depot": "SDC",
  "role": "admin",
  "currentDuty": "Duty 200",
  "dutyStartTime": "2025-11-11 07:30:00",
  "dutyEndTime": "2025-11-11 17:00:00"
}

Response:
{
  "success": true,
  "message": "Session created successfully",
  "session": { ... }
}
```

#### End Session (Called by auth.js)
```http
POST /api/supervisor-sessions/logout
Authorization: Bearer <token>
Content-Type: application/json

{
  "supervisorId": 123,
  "name": "Anthony Gair",
  "badgeNumber": "AG003"
}

Response:
{
  "success": true,
  "message": "Session ended successfully",
  "session_duration_minutes": 185
}
```

#### Update Session Heartbeat
```http
POST /api/supervisor-sessions/heartbeat
Authorization: Bearer <token>
Content-Type: application/json

{
  "supervisorId": 123
}

Response:
{
  "success": true,
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

### Admin Endpoints

#### Get All Sessions
```http
GET /api/supervisor-sessions/all?limit=100&offset=0&depot=SDC&dutyCode=Duty%20200
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "count": 50,
  "sessions": [ ... ],
  "pagination": {
    "limit": 100,
    "offset": 0
  },
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

#### Get Session Statistics
```http
GET /api/supervisor-sessions/stats
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "stats": {
    "total_sessions": 25,
    "active_sessions": 3,
    "unique_supervisors": 8,
    "active_depots": 4,
    "avg_session_duration_minutes": 245,
    "most_recent_activity": "2025-11-11T10:30:00.000Z"
  },
  "duty_breakdown": [
    { "current_duty": "Duty 200", "count": 2 },
    { "current_duty": "Duty 400", "count": 1 }
  ],
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

#### Force Close Session
```http
DELETE /api/supervisor-sessions/:sessionId
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "message": "Session closed successfully",
  "session_id": 123
}
```

---

## WebSocket Events

### Event Types

#### 1. supervisor_login
Broadcast when supervisor logs in with duty.

```json
{
  "type": "supervisor_login",
  "data": {
    "supervisor_id": 123,
    "name": "Anthony Gair",
    "badge_number": "AG003",
    "depot": "SDC",
    "current_duty": "Duty 200",
    "duty_start_time": "2025-11-11 07:30:00",
    "login_time": "2025-11-11 07:25:00"
  },
  "timestamp": "2025-11-11T07:25:00.000Z"
}
```

#### 2. supervisor_logout
Broadcast when supervisor logs out.

```json
{
  "type": "supervisor_logout",
  "data": {
    "supervisor_id": 123,
    "name": "Anthony Gair",
    "badge_number": "AG003",
    "logout_time": "2025-11-11 17:05:00",
    "session_duration_minutes": 580
  },
  "timestamp": "2025-11-11T17:05:00.000Z"
}
```

#### 3. supervisor_duty_change
Broadcast when supervisor changes duty mid-session.

```json
{
  "type": "supervisor_duty_change",
  "data": {
    "supervisor_id": 123,
    "name": "Anthony Gair",
    "badge_number": "AG003",
    "depot": "SDC",
    "old_duty": "Duty 200",
    "new_duty": "Duty 400",
    "duty_start_time": "2025-11-11T12:30:00.000Z",
    "duty_end_time": "2025-11-11T22:00:00.000Z"
  },
  "timestamp": "2025-11-11T12:30:00.000Z"
}
```

---

## Testing Checklist

### Phase 1: Database Migration

- [ ] **Connect to MySQL database**
  ```bash
  mysql -u gobarryco_Gair -p gobarryco_breakdown
  ```

- [ ] **Run migration**
  ```bash
  source /Users/anthony/Go\ BARRY\ App/BreakdownGuideapp/backend/migrations/010_add_duty_tracking.sql
  ```

- [ ] **Verify tables created**
  ```sql
  SHOW TABLES LIKE '%supervisor%';
  -- Should show: supervisors, supervisor_sessions, supervisor_shift_history

  DESCRIBE supervisor_sessions;
  -- Should show all columns: id, supervisor_id, email, badge_number, etc.

  SELECT * FROM v_active_supervisors;
  -- Should return empty result (no active sessions yet)
  ```

### Phase 2: Backend Testing

#### Test 1: Login with Duty
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "YourPassword123!",
    "duty": "Duty 200"
  }'
```

**Expected:**
- ✅ Returns success with JWT token
- ✅ Creates supervisor_sessions record
- ✅ Sets current_duty in supervisors table
- ✅ Broadcasts `supervisor_login` WebSocket event

**Verify:**
```sql
SELECT * FROM supervisor_sessions WHERE is_online = TRUE;
SELECT id, name, current_duty, duty_start_time, duty_end_time FROM supervisors WHERE current_duty IS NOT NULL;
```

#### Test 2: Get Current Duty
```bash
curl -X GET http://localhost:3001/api/auth/current-duty \
  -H "Authorization: Bearer <your-token>"
```

**Expected:**
- ✅ Returns duty information
- ✅ Shows time remaining until shift ends

#### Test 3: Set Duty After Login
```bash
curl -X POST http://localhost:3001/api/auth/set-duty \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"duty": "Duty 400"}'
```

**Expected:**
- ✅ Updates duty in database
- ✅ Updates supervisor_sessions record
- ✅ Broadcasts `supervisor_duty_change` WebSocket event

#### Test 4: Get Active Sessions
```bash
curl -X GET http://localhost:3001/api/supervisor-sessions/active
```

**Expected:**
- ✅ Returns list of online supervisors
- ✅ Shows duty information and time remaining

#### Test 5: Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer <your-token>"
```

**Expected:**
- ✅ Sets is_online = FALSE in supervisor_sessions
- ✅ Clears current_duty in supervisors table
- ✅ Calculates session duration
- ✅ Broadcasts `supervisor_logout` WebSocket event

**Verify:**
```sql
SELECT * FROM supervisor_sessions WHERE is_online = FALSE ORDER BY logout_time DESC LIMIT 1;
SELECT id, name, current_duty FROM supervisors WHERE email = 'anthony.gair@gonortheast.co.uk';
```

#### Test 6: Duplicate Login Prevention
```bash
# Login first time
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test", "duty": "Duty 100"}'

# Login second time (same user, different device/browser)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test", "duty": "Duty 200"}'
```

**Expected:**
- ✅ First login creates session
- ✅ Second login closes first session automatically
- ✅ Only ONE active session exists per supervisor

**Verify:**
```sql
SELECT COUNT(*) FROM supervisor_sessions WHERE email = 'test@example.com' AND is_online = TRUE;
-- Should return 1 (not 2!)
```

### Phase 3: WebSocket Testing

#### Test WebSocket Connection
```javascript
// Frontend or test script
const ws = new WebSocket('ws://localhost:3001/ws?channel=control-room');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Received:', message.type, message.data);
};

// Listen for supervisor_login, supervisor_logout, supervisor_duty_change events
```

**Expected WebSocket Events:**
- `supervisor_login` when someone logs in
- `supervisor_logout` when someone logs out
- `supervisor_duty_change` when duty is changed
- Events contain supervisor info (name, badge, depot, duty)

### Phase 4: Admin Testing

#### Test Admin Endpoints (AG003 or BP009 only)
```bash
# Get all sessions
curl -X GET http://localhost:3001/api/supervisor-sessions/all \
  -H "Authorization: Bearer <admin-token>"

# Get session statistics
curl -X GET http://localhost:3001/api/supervisor-sessions/stats \
  -H "Authorization: Bearer <admin-token>"

# Force close a session
curl -X DELETE http://localhost:3001/api/supervisor-sessions/123 \
  -H "Authorization: Bearer <admin-token>"
```

**Expected:**
- ✅ Only admins can access these endpoints
- ✅ Non-admins get 403 Forbidden

---

## Deployment Steps

### 1. Backup Database
```bash
# Create backup before applying migration
mysqldump -u gobarryco_Gair -p gobarryco_breakdown > backup_$(date +%Y%m%d).sql
```

### 2. Apply Migration
```bash
# Connect to production database
mysql -u gobarryco_Gair -p gobarryco_breakdown

# Run migration
source /path/to/010_add_duty_tracking.sql

# Verify
SHOW TABLES LIKE '%supervisor%';
```

### 3. Deploy Backend
```bash
# SSH to production server
ssh user@85.234.151.224

# Navigate to backend directory
cd ~/api

# Pull latest changes or upload files
# - supervisorSessions.js (new file)
# - auth.js (modified)
# - server.js (modified)

# Restart PM2
pm2 restart breakdown-backend

# Check logs
pm2 logs breakdown-backend --lines 50
```

### 4. Verify Production
```bash
# Test health endpoint
curl https://api.breakdowns.gobarry.co.uk/health

# Test active sessions endpoint
curl https://api.breakdowns.gobarry.co.uk/api/supervisor-sessions/active

# Check logs for errors
pm2 logs breakdown-backend | grep ERROR
```

---

## Integration with Frontend

### Frontend Changes Needed

**1. Update AuthContext to handle sessions**
```javascript
// After successful login
await fetch('/api/supervisor-sessions/login-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    supervisorId: user.id,
    name: user.name,
    email: user.email,
    badgeNumber: user.badge_number,
    depot: user.depot,
    role: user.role,
    currentDuty: duty,
    dutyStartTime: shiftInfo.shiftStart,
    dutyEndTime: shiftInfo.shiftEnd
  })
});
```

**2. Add Heartbeat Mechanism**
```javascript
// Update last_activity every 60 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/supervisor-sessions/heartbeat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ supervisorId: user.id })
    });
  }, 60000); // Every 60 seconds

  return () => clearInterval(interval);
}, [user.id, token]);
```

**3. DutyBadge Component**
```javascript
// Fetch current duty on mount
useEffect(() => {
  const fetchDuty = async () => {
    const response = await fetch('/api/auth/current-duty', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.hasDuty) {
      setDuty(data.duty_code);
      setTimeRemaining(data.time_remaining_ms);
      // Start countdown timer
    }
  };

  fetchDuty();
}, [token]);
```

**4. Control Room Display**
```javascript
// WebSocket connection
const ws = new WebSocket('wss://api.breakdowns.gobarry.co.uk/ws?channel=control-room');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'supervisor_login':
      addSupervisorToList(message.data);
      break;
    case 'supervisor_logout':
      removeSupervisorFromList(message.data.supervisor_id);
      break;
    case 'supervisor_duty_change':
      updateSupervisorDuty(message.data);
      break;
  }
};

// Poll active sessions every 30 seconds as backup
setInterval(async () => {
  const response = await fetch('/api/supervisor-sessions/active');
  const data = await response.json();
  updateSupervisorList(data.sessions);
}, 30000);
```

---

## Troubleshooting

### Issue: Migration Fails

**Symptom:** SQL errors when running migration

**Solution:**
```sql
-- Check if tables already exist
SHOW TABLES LIKE '%supervisor%';

-- Drop tables if needed (CAUTION: This deletes data!)
DROP TABLE IF EXISTS supervisor_shift_history;
DROP TABLE IF EXISTS supervisor_sessions;
DROP VIEW IF EXISTS v_active_supervisors;

-- Re-run migration
source /path/to/010_add_duty_tracking.sql
```

### Issue: Sessions Not Creating

**Symptom:** Login succeeds but no session in database

**Check:**
```bash
# Check backend logs
pm2 logs breakdown-backend | grep session

# Verify auth.js has WebSocket import
grep "webSocketHandler" ~/api/routes/auth.js

# Test manually
curl -X POST http://localhost:3001/api/supervisor-sessions/login-session \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "supervisorId": 1, "name": "Test", ... }'
```

### Issue: WebSocket Events Not Broadcasting

**Symptom:** Sessions created but no WebSocket messages

**Check:**
```bash
# Verify WebSocket handler is initialized
pm2 logs | grep "WebSocket server initialized"

# Check for WebSocket errors
pm2 logs | grep -i websocket

# Test WebSocket connection
wscat -c ws://localhost:3001/ws?channel=control-room
```

### Issue: Duplicate Sessions

**Symptom:** Multiple sessions for same supervisor

**Fix:**
```sql
-- Check for duplicates
SELECT email, COUNT(*) as count
FROM supervisor_sessions
WHERE is_online = TRUE
GROUP BY email
HAVING count > 1;

-- Force close duplicates
UPDATE supervisor_sessions
SET is_online = FALSE,
    logout_time = NOW()
WHERE email = 'duplicate@example.com' AND id != <keep_this_id>;
```

---

## Summary

### What's Been Implemented

✅ **Phase 1: Mandatory Duty Selection**
- Database migration with duty columns and session tracking
- Enhanced login/logout endpoints with session management
- Set-duty endpoint with validation and persistence
- WebSocket broadcasts for real-time updates

✅ **Phase 2: Duty Badge Support**
- GET /api/auth/current-duty endpoint for badge data
- Time remaining calculation
- Duty lock enforcement

✅ **Phase 3: Live Supervisor Tracking**
- supervisor_sessions table for Control Room Display
- Active sessions endpoint (public)
- Session statistics (admin)
- Admin control endpoints (force logout, view all sessions)

✅ **Additional Features**
- Single session enforcement (prevents multiple logins)
- Session heartbeat mechanism
- Session duration tracking
- Shift history for reporting
- Admin override capabilities

### What's Next (Frontend Work)

**Required Frontend Changes:**
1. Update AuthContext to call session endpoints after login
2. Add heartbeat mechanism (every 60 seconds)
3. Build DutyBadge component with countdown timer
4. Integrate WebSocket listener in Control Room Display
5. Add duty selection modal (mandatory on login)
6. Implement auto-logout 15 min before shift ends

**Estimated Frontend Work:** 8-12 hours

---

## Contact

**Developer:** Anthony Gair
**Date:** November 11, 2025
**Version:** 1.0.0

For questions or issues, review this document and check the troubleshooting section first.
