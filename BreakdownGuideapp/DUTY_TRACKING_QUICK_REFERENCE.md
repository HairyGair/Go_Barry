# Duty Tracking & Supervisor Sessions - Quick Reference

**Version:** 1.0.0 | **Date:** November 11, 2025

---

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `supervisors` | User accounts + current duty | `current_duty`, `duty_start_time`, `duty_end_time` |
| `supervisor_sessions` | Real-time session tracking | `supervisor_id`, `is_online`, `login_time`, `logout_time` |
| `supervisor_shift_history` | Historical shift records | `duty`, `shift_start`, `shift_end`, `breakdowns_handled` |
| `v_active_supervisors` | View of online supervisors | Joins supervisors + sessions |

---

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/auth/current-duty` | Required | Get supervisor's current duty info |
| `POST` | `/api/auth/set-duty` | Required | Set duty after login (Duty 100/200/400/500) |
| `POST` | `/api/auth/login` | None | Login with duty selection |
| `POST` | `/api/auth/logout` | Required | Logout and end session |

### Session Management Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/supervisor-sessions/active` | None (Public) | Get all online supervisors |
| `GET` | `/api/supervisor-sessions/all` | Admin | Get all sessions (online + offline) |
| `POST` | `/api/supervisor-sessions/login-session` | Required | Create session after login |
| `POST` | `/api/supervisor-sessions/logout` | Required | End session on logout |
| `POST` | `/api/supervisor-sessions/heartbeat` | Required | Update last_activity timestamp |
| `PUT` | `/api/supervisor-sessions/:id/update-duty` | Required | Update duty mid-session |
| `GET` | `/api/supervisor-sessions/stats` | Admin | Get session statistics |
| `DELETE` | `/api/supervisor-sessions/:id` | Admin | Force close session |

---

## WebSocket Events

### Broadcast Channel: `control-room`

| Event Type | When Triggered | Data Included |
|------------|----------------|---------------|
| `supervisor_login` | Supervisor logs in with duty | name, badge, depot, duty, login_time |
| `supervisor_logout` | Supervisor logs out | name, badge, logout_time, duration |
| `supervisor_duty_change` | Duty changed mid-session | old_duty, new_duty, times |

### Example WebSocket Connection

```javascript
const ws = new WebSocket('wss://api.breakdowns.gobarry.co.uk/ws?channel=control-room');

ws.onmessage = (event) => {
  const { type, data, timestamp } = JSON.parse(event.data);
  console.log('Event:', type, data);
};
```

---

## Example API Calls

### 1. Login with Duty

```bash
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "anthony.gair@gonortheast.co.uk",
    "password": "YourPassword",
    "duty": "Duty 200"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "name": "Anthony Gair",
    "current_duty": "Duty 200",
    "duty_end_time": "2025-11-11T17:00:00.000Z"
  },
  "session": {
    "expires_at": 1731350400,
    "expires_in": 86400
  }
}
```

### 2. Get Current Duty

```bash
curl -X GET https://api.breakdowns.gobarry.co.uk/api/auth/current-duty \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
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
```

### 3. Get Active Supervisors (Control Room)

```bash
curl -X GET https://api.breakdowns.gobarry.co.uk/api/supervisor-sessions/active
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "sessions": [
    {
      "supervisor_name": "Anthony Gair",
      "badge_number": "AG003",
      "depot": "SDC",
      "current_duty": "Duty 200",
      "login_time": "2025-11-11 07:25:00",
      "session_duration_minutes": 185,
      "duty_minutes_remaining": 390
    }
  ]
}
```

### 4. Set Duty After Login

```bash
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/set-duty \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"duty": "Duty 400"}'
```

**Response:**
```json
{
  "success": true,
  "duty": "Duty 400",
  "shiftInfo": {
    "duty": "Duty 400",
    "shiftStart": "2025-11-11T12:30:00.000Z",
    "shiftEnd": "2025-11-11T22:00:00.000Z"
  }
}
```

### 5. Update Session Heartbeat

```bash
curl -X POST https://api.breakdowns.gobarry.co.uk/api/supervisor-sessions/heartbeat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"supervisorId": 123}'
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

### 6. Logout

```bash
curl -X POST https://api.breakdowns.gobarry.co.uk/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Duty Codes

| Code | Shift Times | Duration | Description |
|------|-------------|----------|-------------|
| `Duty 100` | 06:00 - 15:30 | 9h 30m | Early shift |
| `Duty 200` | 07:30 - 17:00 | 9h 30m | Day shift |
| `Duty 400` | 12:30 - 22:00 | 9h 30m | Late shift |
| `Duty 500` | 14:45 - 00:15 | 9h 30m | Night shift (crosses midnight) |

---

## Frontend Integration Checklist

### 1. Login Flow
- [ ] Call `/api/auth/login` with email, password, duty
- [ ] Store JWT token securely
- [ ] No need to call `/api/supervisor-sessions/login-session` (backend handles it)

### 2. Duty Badge Component
- [ ] Call `/api/auth/current-duty` on component mount
- [ ] Display duty code and countdown timer
- [ ] Update timer every minute
- [ ] Show warning when < 15 minutes remaining

### 3. Session Heartbeat
- [ ] Call `/api/supervisor-sessions/heartbeat` every 60 seconds
- [ ] Ensures last_activity stays current
- [ ] Prevents session from appearing stale

### 4. Control Room Display
- [ ] Connect to WebSocket: `wss://api.../ws?channel=control-room`
- [ ] Listen for `supervisor_login`, `supervisor_logout`, `supervisor_duty_change`
- [ ] Poll `/api/supervisor-sessions/active` every 30 seconds as backup
- [ ] Display supervisor list with depot, duty, time remaining

### 5. Logout Flow
- [ ] Call `/api/auth/logout` with Authorization header
- [ ] Backend automatically ends session and broadcasts event
- [ ] Clear local JWT token
- [ ] Redirect to login page

---

## Key Features

### ✅ Single Session Enforcement
- Only ONE active session per supervisor
- New login automatically closes previous session
- Prevents multiple device logins

### ✅ Real-time Updates
- WebSocket broadcasts on login/logout/duty change
- Control Room Display updates instantly
- No polling required for real-time data

### ✅ Session Tracking
- `last_activity` updated on every API call + heartbeat
- Session duration calculated on logout
- Historical records preserved in database

### ✅ Admin Controls
- View all sessions (online + offline)
- Force close any session
- View session statistics
- No time limits for admins

### ✅ Duty Lock
- Duty cannot be changed once set (except by admin)
- Auto-logout 15 min before shift ends
- Prevents accidental duty changes

---

## Testing Commands

### Check Active Sessions
```sql
SELECT * FROM v_active_supervisors;
```

### Check Session History
```sql
SELECT * FROM supervisor_sessions
WHERE DATE(login_time) = CURDATE()
ORDER BY login_time DESC;
```

### Check Current Duties
```sql
SELECT id, name, badge_number, current_duty, duty_end_time
FROM supervisors
WHERE current_duty IS NOT NULL;
```

### Force End All Sessions (Emergency)
```sql
UPDATE supervisor_sessions
SET is_online = FALSE, logout_time = NOW()
WHERE is_online = TRUE;
```

---

## Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| Sessions not creating | Backend logs | Verify auth.js imports webSocketHandler |
| Duplicate sessions | Database query | Check session creation logic |
| WebSocket not broadcasting | PM2 logs | Restart backend, verify WebSocket initialized |
| Duty not persisting | supervisors table | Verify migration applied correctly |
| Heartbeat failing | Network tab | Check Authorization header present |

---

## Migration SQL File

**File:** `/backend/migrations/010_add_duty_tracking.sql`

**Apply:**
```bash
mysql -u gobarryco_Gair -p gobarryco_breakdown < 010_add_duty_tracking.sql
```

**Rollback (if needed):**
```sql
DROP TABLE IF EXISTS supervisor_shift_history;
DROP TABLE IF EXISTS supervisor_sessions;
DROP VIEW IF EXISTS v_active_supervisors;
ALTER TABLE supervisors
  DROP COLUMN current_duty,
  DROP COLUMN duty_start_time,
  DROP COLUMN duty_end_time,
  DROP COLUMN duty_locked_at,
  DROP COLUMN duty_locked_by;
```

---

## Contact

**Implementation Date:** November 11, 2025
**Version:** 1.0.0
**Developer:** Anthony Gair

For detailed documentation, see `DUTY_TRACKING_IMPLEMENTATION.md`
