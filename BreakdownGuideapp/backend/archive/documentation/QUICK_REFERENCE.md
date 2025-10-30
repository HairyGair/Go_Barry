# Go BARRY Backend - Quick Reference Guide

**Document**: API & WebSocket Quick Reference  
**Location**: `/backend/QUICK_REFERENCE.md`  
**Full Analysis**: See `API_WEBSOCKET_ANALYSIS.md` (852 lines)

---

## Core Statistics

| Metric | Value |
|--------|-------|
| REST Endpoints | 85+ |
| Protected Routes | 75 |
| Public Routes | 10 |
| WebSocket Channels | 5 |
| Database Tables | 12+ |
| Authentication Methods | 3 (JWT, Rate Limit, Role-based) |
| External APIs Integrated | 0 (ready for integration) |

---

## API Categories

### 1. Authentication (`/api/auth`)
**Endpoints**: 17  
**Key**: Login/signup, password management, supervisor approval  
**Rate Limiting**: 5 attempts/15 min

```bash
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/validate
POST /api/auth/admin/reset-password
```

### 2. Breakdown Management (`/api/breakdowns`)
**Endpoints**: 20  
**Key**: Create, update, resolve breakdowns  
**Features**: Pattern detection, WebSocket broadcast, activity logging

```bash
POST /api/breakdowns                    # Create
GET  /api/breakdowns                    # List (paginated)
GET  /api/breakdowns/live               # Active only
PUT  /api/breakdowns/:id                # Update
POST /api/breakdowns/:id/dispatch       # Dispatch engineer
```

### 3. Fleet Management (`/api/fleet`)
**Endpoints**: 10  
**Key**: Vehicle search, health tracking, depot management

```bash
GET /api/fleet                          # Get all vehicles
GET /api/fleet/vehicle/:fleetNumber     # Get single vehicle
GET /api/fleet/stats/summary            # Fleet health
```

### 4. Analytics (`/api/analytics`)
**Endpoints**: 5  
**Key**: KPIs, trends, depot comparison

```bash
GET /api/analytics/kpis                 # Performance indicators
GET /api/analytics/trends               # Trend analysis
GET /api/analytics/depot-comparison     # Compare depots
```

### 5. Fleet Intelligence (`/api/defects`)
**Endpoints**: 8  
**Key**: Repeat defects, trends, escalation  
**WebSocket**: Broadcasts to `defect-intelligence` channel

```bash
POST /api/defects/repeat                # Find repeat defects
POST /api/defects/trends                # Analyze trends
GET  /api/defects/predictive            # Predictive alerts
POST /api/defects/escalate              # Escalate issues
```

### 6. SDC Dashboard (`/api/sdc/*`)
**Endpoints**: 10  
**Auth**: `authenticateSDC` middleware  
**Rate Limit**: 100 ops/15 min

```bash
GET  /api/sdc/live                      # Active breakdowns
POST /api/sdc/acknowledge               # Mark acknowledged
POST /api/sdc/decision                  # Record decision
POST /api/sdc/resolve                   # Resolve breakdown
```

### 7. Engineering (`/api/engineering`)
**Endpoints**: 5  
**Key**: Engineer dispatch, job tracking, depot metrics

### 8. Activity Feed (`/api/activity`)
**Endpoints**: 10  
**Key**: Audit trail, user actions, statistics

### 9. Public (`/api/public/*`)
**Endpoints**: 4  
**Auth**: None (Control Room displays)

```bash
GET /api/public/breakdowns/live         # Display breakdowns
GET /api/public/breakdowns/stats        # Statistics
GET /api/public/fleet                   # Fleet data
```

### 10. Support Routes
- **Wizards** (`/api/wizards`) - 6 endpoints
- **Preferences** (`/api/preferences`) - 6 endpoints
- **Supervisors** (`/api/supervisors`) - 8 endpoints

---

## WebSocket Channels

### Protected Channels (Require JWT Token)

```javascript
// Connect
ws://host/ws/sdc-dashboard?token=JWT
ws://host/ws/breakdowns?token=JWT
ws://host/ws/assessment-progress?token=JWT

// Subscribe on connect
{type: "subscribe", channel: "breakdowns"}
```

**Events**:
- `wizard_started` - Wizard begins
- `wizard_completed` - Wizard finishes
- `breakdown_created` - New breakdown
- `assessment_progress` - Step completed

### Public Channels (No Auth)

```javascript
ws://host/ws/control-room                    // For displays
ws://host/ws/defect-intelligence            // Defect alerts
```

**Events**:
- `NEW_REPEAT_DEFECT` - Vehicle 3+ defects
- `TREND_UPDATE` - Defect trends rising
- `CRITICAL_PATTERN` - 5+ vehicles same issue
- `DEPOT_STATS_UPDATE` - Spike detected
- `PREDICTIVE_ALERT` - ML-detected pattern
- `DEFECT_ESCALATED` - Manual escalation

### Client → Server Messages

```javascript
{type: "subscribe", channel: "breakdowns"}
{type: "unsubscribe", channel: "breakdowns"}
{type: "ping"}
{type: "get_status"}
```

---

## Authentication Flow

### Login
```
1. POST /api/auth/login
   Input: {email, password}
   Output: {token, expires_at, user}

2. Use token in all requests:
   Authorization: Bearer <token>

3. WebSocket connect:
   ws://host/ws/sdc-dashboard?token=<token>
```

### Verify Token
```
GET /api/auth/validate
Authorization: Bearer <token>
```

### Rate Limiting
- **Login attempts**: 5 per 15 minutes (per IP+User-Agent)
- **SDC operations**: 100 per 15 minutes (per user)
- Response: 429 Too Many Requests with `Retry-After` header

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `supervisors` | User accounts | id, email, badge_number, role |
| `breakdowns` | Breakdown records | breakdown_id, fleet_no, status |
| `activity_logs` | Audit trail | activity_type, actor_id, timestamp |
| `fleet_vehicles` | Vehicle database | fleet_number, depot, health_score |
| `wizard_progress` | Breakdown assessment | breakdown_id, step, data |
| `engineer_jobs` | Engineer dispatch | breakdown_id, engineer_id, status |
| `supervisor_preferences` | User settings | supervisor_id, preferences |

---

## Critical Patterns (WebSocket Alerts)

### Repeat Defects (3+ occurrences)
```
Priority: high/critical
Event: NEW_REPEAT_DEFECT
Broadcast: defect-intelligence channel
```

### Trending Issue (15%+ increase)
```
Priority: medium/high
Event: TREND_UPDATE
Broadcast: defect-intelligence channel
```

### Critical Pattern (5+ vehicles, same defect, 24h)
```
Priority: critical
Event: CRITICAL_PATTERN
Broadcast: defect-intelligence channel
```

### Depot Spike (>25% increase, 5+ defects)
```
Priority: high/medium
Event: DEPOT_STATS_UPDATE
Broadcast: defect-intelligence channel
```

---

## Common Queries

### Get Breakdown Status
```
GET /api/breakdowns/:breakdown_id
```

### Get Fleet Health
```
GET /api/fleet/stats/summary
```

### Get KPIs
```
GET /api/analytics/kpis?period=today|week|month|year
```

### Find Repeat Defects
```
POST /api/defects/repeat
Body: {timeframe: "24h|7d|30d"}
```

### SDC Live Breakdowns
```
GET /api/sdc/live
Authorization: Bearer <sdc_token>
```

### Public Display Data
```
GET /api/public/breakdowns/live
(No auth required)
```

---

## Error Codes

| Code | Meaning | HTTP | Fix |
|------|---------|------|-----|
| `AUTH_TOKEN_MISSING` | No JWT provided | 401 | Add Authorization header |
| `AUTH_TOKEN_EXPIRED` | JWT expired | 401 | Request new token |
| `AUTH_USER_INACTIVE` | Account disabled | 403 | Contact admin |
| `SDC_RATE_LIMIT_EXCEEDED` | Too many requests | 429 | Retry after timeout |
| `WS_AUTH_REQUIRED` | WebSocket needs token | Close | Provide token in URL |
| `WS_SDC_AUTH_FORBIDDEN` | Not SDC operator | Close | Use correct credentials |

---

## Environment Variables

```bash
# Required
DB_HOST=localhost
DB_USER=cpanel_user
DB_PASSWORD=password
DB_NAME=database_name
JWT_SECRET=your_secret_key

# Optional
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=info
```

---

## cPanel Deployment

### Node.js Version
- Minimum: 18.0.0
- Recommended: 18+ or 20+

### Memory Limit
- 2GB RAM on cPanel
- Connection pool: 10 connections
- Recommended: 512MB Node process

### WebSocket Support
- Requires proxy pass configuration
- SSL/TLS passthrough needed
- Some hosts disable WebSocket support

### Startup Command
```bash
node --no-experimental-fetch --max-old-space-size=512 server.js
```

---

## Troubleshooting

### WebSocket Connection Fails
1. Check JWT token validity
2. Verify token in URL: `?token=<jwt>`
3. Check CORS allowed origins
4. Ensure proxy pass configured

### Database Connection Error
1. Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
2. Test MySQL connection: `mysql -h host -u user -p database`
3. Check connection pool limit (default: 10)

### Slow API Response
1. Check MySQL query performance
2. Verify database indexes on `breakdown_id`, `fleet_no`
3. Monitor connection pool usage
4. Check memory usage (2GB limit)

### Missing Broadcasts
1. Verify WebSocket channel subscription
2. Check if thresholds exceeded (3+ defects, 5+ vehicles, etc.)
3. Verify client listening to correct event type
4. Check browser DevTools WebSocket tab

---

## Performance Tips

1. **Pagination**: Use `?page=1&limit=50` for large datasets
2. **Caching**: Public endpoints are cache-friendly
3. **Batch Operations**: Use `/api/activity/batch` for multiple logs
4. **Limit Joins**: Keep queries focused on needed tables

---

## Testing

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Test WebSocket
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/control-room');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Test Public Breakdowns
```bash
curl http://localhost:3001/api/public/breakdowns/live
```

---

**Full Documentation**: See `API_WEBSOCKET_ANALYSIS.md` (852 lines)  
**Generated**: October 27, 2025  
**Last Updated**: 2.0.0 (MySQL Migration Complete)

