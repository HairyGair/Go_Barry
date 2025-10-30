# Go BARRY Backend - Comprehensive API & WebSocket Analysis
## October 27, 2025

**Project**: Go BARRY (Bus Alerts and Roadworks Reporting for You)  
**Backend Location**: `/backend/`  
**Framework**: Express.js 4.18.2  
**Runtime**: Node.js 18+  
**Database**: MySQL 8.0+ (via mysql2/promise)  
**WebSocket Library**: ws 8.18.3  
**Module System**: ES6 imports only (type: "module")

---

## PART 1: API ENDPOINT MAPPING

### Complete Endpoint Inventory

#### **Authentication Routes** (`/api/auth`)
- **Middleware Applied**: `rateLimitLogin` (5 attempts per 15 min)
- **Database Tables**: `supervisors`

| HTTP | Path | Purpose | Input | Output | Auth | Rate Limit |
|------|------|---------|-------|--------|------|-----------|
| POST | `/login` | Email/password authentication | `{email, password}` | `{token, expires_at, user}` | None | 5/15min |
| POST | `/signup` | New supervisor registration | `{email, password, fullName, badgeNumber, depot}` | `{supervisorId, pending_approval}` | None | 5/15min |
| POST | `/supervisor-signup` | Activate existing supervisor | `{email, password}` | `{success, supervisor}` | None | 5/15min |
| POST | `/logout` | Logout user | JWT token in header | `{success, message}` | Optional | None |
| POST | `/verify` | Verify session | `{username, session_token}` | `{valid, user}` | None | None |
| GET | `/validate` | Validate JWT token | Bearer token header | `{valid, user}` | JWT | None |
| GET | `/supervisors` | Get all active supervisors | None | `[{id, name, email, role, depot}]` | None | None |
| GET | `/user/:id` | Get specific user by ID | None | `{user object}` | None | None |
| GET | `/supervisor/:username` | Get supervisor by name | None | `{supervisor object}` | None | None |
| GET | `/depots` | Get list of all depots | None | `[depots]` | None | None |
| GET | `/recent-sessions` | Get recent login sessions | `?limit=10` | `{data: [], count}` | None | None |
| GET | `/pending-signups` | Get pending approvals (ADMIN) | None | `{data: [], count}` | Admin | None |
| POST | `/approve-signup` | Approve pending signup (ADMIN) | `{supervisorId, approved: boolean}` | `{success, supervisor}` | Admin | None |
| PUT | `/supervisor/:id` | Update supervisor (ADMIN) | `{name, email, depot, role, is_active}` | `{supervisor}` | Admin | None |
| POST | `/change-password` | Change own password | `{email, currentPassword, newPassword}` | `{success, message}` | None | None |
| POST | `/admin/reset-password` | Admin password reset (ADMIN) | `{email, newPassword}` | `{success, user}` | Admin | None |
| GET | `/supervisors/:id/stats` | Supervisor personal stats | None | `{active, today, resolved, responseTime, fleetHealth}` | None | None |

---

#### **Breakdown Management Routes** (`/api/breakdowns`)
- **Middleware Applied**: `authenticateSupervisor` (JWT + supervisor check)
- **Database Tables**: `breakdowns`, `breakdown_activity`, `fleet_vehicles`
- **WebSocket Broadcasting**: Yes - critical patterns detected

| HTTP | Path | Purpose | Input | Output | Parameters |
|------|------|---------|-------|--------|-----------|
| POST | `/` | Create new breakdown | `{fleet_no, location, issue_category, severity, wizard_assessment_data}` | `{breakdown_id, status}` | None |
| GET | `/` | List all breakdowns (paginated) | None | `{breakdowns: [], pagination}` | `?page=1&limit=50&status=&depot=` |
| GET | `/active` | Get only active breakdowns | None | `{breakdowns: []}` | None |
| GET | `/live` | Get live breakdowns for SDC | None | `{breakdowns: [], assessment_data}` | None |
| GET | `/stats` | Breakdown statistics | None | `{total, active, resolved, avgResponseTime}` | `?period=today\|week\|month` |
| GET | `/:id` | Get specific breakdown | None | `{breakdown object}` | None |
| PUT | `/:id` | Update breakdown | `{status, location, issue_category, wizard_assessment_data}` | `{updated breakdown}` | None |
| PATCH | `/:id/status` | Update status only | `{status}` | `{status}` | None |
| PUT | `/:id/resolve` | Mark as resolved | `{resolution, notes}` | `{status: resolved}` | None |
| POST | `/:id/dispatch` | Dispatch engineer | `{engineer_id, notes}` | `{dispatch_id, status: dispatched}` | None |
| GET | `/:id/activities` | Get breakdown activity | None | `{activities: []}` | None |
| POST | `/:id/activities` | Log activity | `{activity_type, notes}` | `{activity_id}` | None |
| POST | `/from-wizard` | Create from wizard | `{wizard_assessment_data, fleet_no, location}` | `{breakdown_id}` | None |
| GET | `/stats/summary` | Summary statistics | None | `{breakdown stats}` | None |
| GET | `/id-generator/status` | Check ID generator | None | `{current_id, next_id}` | None |
| GET | `/id-generator/next` | Get next ID | None | `{id}` | None |
| POST | `/id-generator/validate` | Validate ID | `{id}` | `{valid: boolean}` | None |
| GET | `/dashboard/cards` | Dashboard cards | None | `{cards: []}` | None |
| POST | `/:breakdown_id/update-card` | Update card | `{card_data}` | `{success}` | None |
| POST | `/resolve` | Bulk resolve | `{breakdown_ids: []}` | `{resolved_count}` | None |

**Critical Pattern Detection**: 
- Same defect on 5+ vehicles in 24h → WebSocket broadcast
- Same vehicle 3+ breakdowns in 24h → WebSocket broadcast
- Depot defect spike >25% → WebSocket broadcast

---

#### **Fleet Management Routes** (`/api/fleet`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `fleet_vehicles`, `vehicle_health_scores`

| HTTP | Path | Purpose | Input | Output | Query Parameters |
|------|------|---------|-------|--------|------------------|
| GET | `/` | Get all vehicles | None | `{data: [], pagination}` | `?search=&depot=&type=&page=1&limit=100` |
| GET | `/vehicles` | Alias for `/` | None | `{vehicles: [], count}` | Same as above |
| GET | `/search/:term` | Search vehicles | None | `{results: []}` | None |
| GET | `/vehicle/:fleetNumber` | Get specific vehicle | None | `{vehicle, defects, breakdowns}` | None |
| GET | `/:fleetNumber` | Alternative vehicle lookup | None | `{vehicle}` | None |
| GET | `/depots/list` | Get all depot names | None | `[depot_names]` | None |
| GET | `/types/list` | Get all vehicle types | None | `[vehicle_types]` | None |
| GET | `/stats/summary` | Fleet health summary | None | `{total_vehicles, operational, health_score}` | None |
| PUT | `/:fleetNumber` | Update vehicle info | `{health_score, status, notes}` | `{vehicle}` | None |
| PATCH | `/:fleetNumber/status` | Update vehicle status | `{status}` | `{status}` | None |

---

#### **Analytics Routes** (`/api/analytics`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `breakdowns`, `fleet_vehicles`, `supervisors`

| HTTP | Path | Purpose | Input | Output | Query Parameters |
|------|------|---------|-------|--------|------------------|
| GET | `/kpis` | Key Performance Indicators | None | `{mtbf, fleetAvailability, slaPercent, avgResponseTime}` | `?period=today\|week\|month\|year` |
| GET | `/trends` | Performance trends | None | `{breakdowns_trend, response_time_trend, resolution_trend}` | `?period=7d\|30d` |
| GET | `/depot-comparison` | Compare depot performance | None | `{depots: [{name, breakdowns, avg_response_time}]}` | None |
| GET | `/fleet-health` | Fleet health overview | None | `{health_score, operational_rate, risk_vehicles}` | None |
| GET | `/activity/feed` | Analytics activity | None | `{activities: []}` | None |

---

#### **Defects / Fleet Intelligence Routes** (`/api/defects`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `breakdowns`, `fleet_vehicles`
- **WebSocket Broadcasting**: Yes - repeat defects, trends, escalations

| HTTP | Path | Purpose | Input | Output | WebSocket Events |
|------|------|---------|-------|--------|------------------|
| POST | `/repeat` | Find repeat defects | `{timeframe: '24h\|7d\|30d'}` | `{vehicles_with_repeats: []}` | `NEW_REPEAT_DEFECT` (3+ defects) |
| POST | `/trends` | Analyze defect trends | `{timeframe}` | `{trending_issues: [{defect_type, count, trend}]}` | `TREND_UPDATE` (rising trends) |
| GET | `/depot-stats` | Depot defect statistics | None | `{depots: [{name, defect_count, rate, top_issue}]}` | `DEPOT_STATS_UPDATE` |
| GET | `/predictive` | Predictive maintenance alerts | None | `{alerts: [{type, vehicles, recommendation}]}` | `PREDICTIVE_ALERT` |
| POST | `/escalate` | Escalate critical defects | `{vehicle_ids: [], priority}` | `{escalation_id}` | `DEFECT_ESCALATED` |
| POST | `/report` | Generate analysis report | `{timeframe, format}` | `{report_id, report_data}` | None |
| GET | `/vehicle/:fleetNumber` | Vehicle defect history | None | `{defects: [], summary}` | None |
| POST | `/notifications/maintenance` | Send maintenance alert | `{vehicle_id, message, priority}` | `{notification_id}` | None |

**Broadcast Severity Mapping**:
- Defect count ≥5 → `priority: critical`
- Defect count ≥3 → `priority: high`
- Defect count <3 → `priority: medium`

---

#### **Engineering Routes** (`/api/engineering`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `engineers`, `depots`, `breakdowns`, `engineer_jobs`

| HTTP | Path | Purpose | Input | Output | Database Tables |
|------|------|---------|-------|--------|------------------|
| GET | `/depot-stats` | Depot performance stats | None | `{depots: [{name, total_breakdowns, avg_response_time, engineers}]}` | `depots`, `breakdowns` |
| GET | `/engineers` | List all engineers | None | `{engineers: [{id, name, depot, status}]}` | `engineers` |
| GET | `/metrics` | Performance metrics | None | `{metrics}` | `engineer_jobs`, `breakdowns` |
| POST | `/assign` | Assign engineer to breakdown | `{breakdown_id, engineer_id}` | `{assignment_id, status}` | `engineer_jobs` |
| POST | `/auto-assign` | Auto-assign based on availability | `{breakdown_id}` | `{assigned_to, engineer_name}` | `engineers`, `engineer_jobs` |

---

#### **SDC Dashboard API Routes** (`/api/sdc/*`) - **Requires SDC Operator Auth**
- **Middleware Applied**: `rateLimitSDC` (100 ops/15min), `authenticateSDC`
- **Database Tables**: `breakdowns`, `supervisor_assessments`

| HTTP | Path | Purpose | Input | Output | Rate Limit |
|------|------|---------|-------|--------|-----------|
| GET | `/live` | Live breakdowns for SDC | None | `{breakdowns: [], count}` | 100/15min |
| GET | `/in-progress` | Breakdowns being assessed | None | `{in_progress: []}` | 100/15min |
| POST | `/:id/edit` | Start assessment edit | `{notes}` | `{edit_session_id}` | 100/15min |
| GET | `/:id/audit` | Get audit trail | None | `{events: []}` | 100/15min |
| GET | `/:id` | Get breakdown details | None | `{breakdown}` | 100/15min |
| POST | `/acknowledge` | Acknowledge breakdown | `{breakdown_id, acknowledged_by}` | `{acknowledged_at}` | 100/15min |
| POST | `/decision` | Record assessment decision | `{breakdown_id, wizard_decision, wizard_assessment_data}` | `{decision_id}` | 100/15min |
| POST | `/add-note` | Add notes to breakdown | `{breakdown_id, notes}` | `{note_id}` | 100/15min |
| POST | `/request-engineering` | Request engineer dispatch | `{breakdown_id, engineer_type}` | `{request_id, engineer_assigned}` | 100/15min |
| POST | `/resolve` | Resolve breakdown | `{breakdown_id, resolution_code, notes}` | `{status: resolved}` | 100/15min |

---

#### **Activity Feed Routes** (`/api/activity`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `activity_logs`, `supervisors`

| HTTP | Path | Purpose | Input | Output | Query Parameters |
|------|------|---------|-------|--------|------------------|
| GET | `/feed` | Get activity feed | None | `{activities: []}` | `?limit=25&offset=0` |
| GET | `/feed/legacy` | Legacy format | None | `{activities: []}` | Same |
| GET | `/live` | Real-time live feed | None | `{activities: []}` | WebSocket compatible |
| GET | `/live/legacy` | Legacy live | None | `{activities: []}` | None |
| GET | `/breakdown-guide` | Breakdown guide activities | None | `{activities: []}` | None |
| POST | `/log` | Log activity | `{activity_type, action, metadata}` | `{activity_id}` | None |
| POST | `/batch` | Batch log activities | `{activities: []}` | `{logged_count}` | None |
| GET | `/search` | Search activities | None | `{results: []}` | `?q=&type=&limit=50` |
| GET | `/stats` | Activity statistics | None | `{total, by_type, by_actor}` | None |
| DELETE | `/:id` | Delete activity | None | `{deleted: true}` | None |

---

#### **Public Routes** (`/api/public/*`) - **No Authentication Required**
- **Use Case**: Control Room displays, public dashboards
- **Rate Limiting**: None
- **Database Tables**: `breakdowns`, `activity_logs`

| HTTP | Path | Purpose | Output | Cache Friendly |
|------|------|---------|--------|----------------|
| GET | `/breakdowns/live` | Active breakdowns for display | `{breakdowns: [...]}` formatted for wall displays | Yes |
| GET | `/breakdowns/stats` | Breakdown statistics | `{today, week, month, total}` | Yes |
| GET | `/activity/feed` | Activity feed | `{activities: [], count}` | Yes |
| GET | `/fleet` | Full fleet database | `{vehicles: []}` | Yes |

---

#### **Wizard Routes** (`/api/wizards`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `wizard_progress`, `breakdowns`

| HTTP | Path | Purpose | Input | Output |
|------|------|---------|-------|--------|
| POST | `/progress` | Track wizard step | `{breakdown_id, step, data}` | `{progress_id}` |
| GET | `/progress/:breakdownId` | Get wizard progress | None | `{current_step, data}` |
| POST | `/complete` | Complete wizard | `{breakdown_id, assessment_data}` | `{breakdown_id, status: assessed}` |
| GET | `/stats/usage` | Wizard usage stats | None | `{total_started, total_completed, avg_time_minutes}` |
| GET | `/recent` | Recent wizards | None | `{recent_wizards: []}` |
| GET | `/decisions/summary` | Decision summary | None | `{decisions: {repair, monitor, scrap, investigate}}` |

---

#### **Preferences Routes** (`/api/preferences`)
- **Middleware Applied**: `authenticateSupervisor`
- **Database Tables**: `supervisor_preferences`

| HTTP | Path | Purpose | Input | Output |
|------|------|---------|-------|--------|
| GET | `/` | Get preferences | None | `{preferences: {}}` |
| PUT | `/` | Update preferences | `{theme, notifications, alerts_enabled}` | `{preferences}` |
| PATCH | `/` | Partial update | `{key: value}` | `{preferences}` |
| DELETE | `/` | Delete preferences | None | `{deleted: true}` |
| POST | `/export` | Export preferences | None | `{export_file}` |
| POST | `/import` | Import preferences | `{file_content}` | `{imported_count}` |

---

#### **Supervisors Routes** (`/api/supervisors`) - **Partial Public**
- **Middleware Applied**: None (read-only)
- **Database Tables**: `supervisors`

| HTTP | Path | Purpose | Output | Query Parameters |
|------|------|---------|--------|------------------|
| GET | `/` | Get all supervisors | `{supervisors: []}` | `?include_inactive=false&depot=&role=` |
| GET | `/:id/stats` | Supervisor stats | `{active, today, resolved}` | None |
| GET | `/by-badge/:badge` | Get by badge | `{supervisor}` | None |
| GET | `/depot/:depot` | Get by depot | `{supervisors: []}` | None |
| GET | `/search` | Search supervisors | `{results: []}` | `?q=` |
| GET | `/role/:role` | Get by role | `{supervisors: []}` | None |
| GET | `/pending` | Get pending approvals | `{pending: []}` | None |
| GET | `/:id` | Get supervisor | `{supervisor}` | None |

---

### Health Check Endpoints

| HTTP | Path | Purpose | Response | Rate Limit |
|------|------|---------|----------|-----------|
| GET | `/health` | Basic health check | `{status, service, database}` | None |
| GET | `/api/health` | API health check | `{status, service, routes}` | None |
| GET | `/api/diagnostics` | Detailed diagnostics | `{server, database, tests}` | None |

---

## PART 2: WebSocket Implementation

### WebSocket Architecture

**Library**: `ws` 8.18.3  
**Server**: Initialized via `WebSocketServer` on HTTP server upgrade  
**Location**: `/routes/webSocketHandler.js`  
**Singleton Pattern**: Single instance manages all connections

### WebSocket Endpoints

#### **Paths & Channels**

```
ws://hostname/ws                 - General connection (uses channel parameter)
ws://hostname/ws/sdc-dashboard   - SDC Dashboard real-time updates (AUTHENTICATED)
ws://hostname/ws/control-room    - Control Room public display (PUBLIC)
ws://hostname/ws/breakdowns      - Breakdown updates (AUTHENTICATED)
ws://hostname/ws/defect-intelligence - Defect trend broadcasts (PUBLIC)
```

#### **Connection Authentication**

**Protected Channels** (require JWT token):
- `sdc-dashboard` - Requires `?token=JWT` in URL
- `breakdowns` - Requires `?token=JWT`
- `assessment-progress` - Requires `?token=JWT`

**Public Channels** (no auth needed):
- `control-room` - For public displays
- `defect-intelligence` - For defect monitoring

**Token Extraction**:
```
URL: ws://host/ws/sdc-dashboard?token=eyJhbGc...
```

Token is verified using the same `verifyToken()` middleware from auth routes.

### WebSocket Message Types

#### **Client → Server**

| Message Type | Body | Handler | Purpose |
|--------------|------|---------|---------|
| `subscribe` | `{channel}` | `handleSubscription()` | Subscribe to additional channel |
| `unsubscribe` | `{channel}` | `handleUnsubscription()` | Unsubscribe from channel |
| `ping` | None | Auto-respond | Connection keep-alive |
| `get_status` | None | `sendStatusUpdate()` | Request connection stats |

#### **Server → Client**

| Message Type | Body | Trigger | Broadcast Channels |
|--------------|------|---------|-------------------|
| `connected` | `{clientId, channel, authenticated, user}` | Connection established | Initial message only |
| `error` | `{error, code, timestamp}` | Auth failure or error | Initial message |
| `subscribed` | `{channel, message, timestamp}` | After subscription | None |
| `unsubscribed` | `{channel, message, timestamp}` | After unsubscription | None |
| `pong` | `{timestamp}` | Ping received | Unicast only |
| `status_update` | `{stats: {total_clients, channels, uptime}}` | get_status message | Unicast only |
| `initial_data` | `{breakdowns: [], recent_activities: []}` | Breakdown channel connect | Unicast only |

#### **Defect Intelligence Events** (Broadcast)

| Event Type | Data Structure | Priority | Trigger Condition |
|------------|---|----------|-------------------|
| `NEW_REPEAT_DEFECT` | `{fleetNumber, defectCount, severity, depot, defects[]}` | critical/high/medium | Vehicle has 3+ defects in timeframe |
| `TREND_UPDATE` | `{defectType, count, trend, changePercent, affectedModels[]}` | Based on defect count | Defect type shows 15%+ change |
| `CRITICAL_PATTERN` | `{message, affectedVehicles[], defectType, priority}` | critical/high | 5+ vehicles same issue in 24h |
| `DEPOT_STATS_UPDATE` | `{depotName, defectCount, defectRate, trend, topIssue}` | high/medium | Spike detected (>15% rate, >5 defects) |
| `PREDICTIVE_ALERT` | `{type, vehicles[], recommendation, estimatedCost}` | medium/high | AI model detects pattern |
| `DEFECT_ESCALATED` | `{vehicleId, defectCount, recipient, priority, message}` | critical/high | Manual escalation |

#### **Breakdown Events** (Broadcast)

| Event Type | Data | Channel | Trigger |
|------------|------|---------|---------|
| `wizard_started` | `{assessmentData}` | sdc-dashboard | Wizard begins |
| `wizard_completed` | `{assessmentData, decision}` | sdc-dashboard | Wizard finishes |
| `assessment_progress` | `{breakdownId, step, progress}` | sdc-dashboard | Step completed |
| `breakdown_created` | `{breakdownData}` | sdc-dashboard | New breakdown reported |
| `breakdowns_updated` | `{message, timestamp}` | breakdowns, sdc-dashboard | File watcher detects change |

### WebSocket Connection Management

**Client Tracking**:
```javascript
Map<clientId, {
  ws,                      // WebSocket connection
  channel,                 // Primary channel
  user,                    // Authentication info
  supervisor,              // Supervisor details (if SDC)
  connectedAt,             // Connection timestamp
  lastActivity,            // Last message timestamp
  subscriptions,           // Set of subscribed channels
  authenticated            // Auth status boolean
}>
```

**Channel Tracking**:
```javascript
Map<channel, Set<clientId>>  // Track clients in each channel
```

### WebSocket Features

**Heartbeat**: Ping/Pong mechanism maintains connection  
**Auto-reconnection**: Client-side responsibility  
**Memory Management**: Clients cleaned up on disconnect  
**File Watchers**: Disabled for cPanel shared hosting (WebAssembly issues)  
**Broadcast Functions** (exported from server.js):
- `broadcastToSDCDashboard(message)` - Sends to 'sdc-dashboard' channel
- `broadcastToAll(message)` - Sends to all connected clients

### WebSocket Error Handling

| Error Condition | Response | Code |
|-----------------|----------|------|
| Missing token on protected channel | Close connection | `WS_AUTH_REQUIRED` |
| Invalid/expired token | Close connection | `WS_AUTH_INVALID` |
| Unauthorized SDC access | Close connection | `WS_SDC_AUTH_FORBIDDEN` |
| Connection error | Close connection | `WS_AUTH_ERROR` |
| Message parsing error | Log error, continue | None |
| Client send failure | Auto-disconnect client | None |

---

## PART 3: API Dependencies & Data Flow

### Authentication Flow

```
Login Request (POST /api/auth/login)
  ↓
Password verification (bcrypt)
  ↓
JWT token generation
  ↓
Activity logging (activity_logger service)
  ↓
Response with token + user + expires_at
```

### Breakdown Creation Flow

```
Report Breakdown (POST /api/breakdowns)
  ↓
Generate unique breakdown_id (breakdownIdGenerator service)
  ↓
Insert into breakdowns table
  ↓
Log activity (activity_logger)
  ↓
Detect critical patterns (detectAndBroadcastCriticalPatterns)
  ↓
WebSocket broadcast to sdc-dashboard channel
  ↓
Broadcast to control-room for display
```

### Defect Analysis Flow

```
POST /api/defects/repeat or /api/defects/trends
  ↓
Query breakdowns with issue_category
  ↓
Calculate severity scores
  ↓
Determine trend direction
  ↓
WebSocket broadcast (if thresholds exceeded)
  ↓
JSON response to client
```

### SDC Dashboard Real-time Flow

```
Client WebSocket connect (ws://host/ws/sdc-dashboard?token=JWT)
  ↓
Token verification
  ↓
SDC operator privileges check
  ↓
Send initial breakdown data
  ↓
Listen for broadcasts:
  - wizard_started
  - wizard_completed
  - assessment_progress
  - breakdown_created
  - CRITICAL_PATTERN events
  - TREND_UPDATE events
```

### Supervisor Statistics Flow

```
GET /api/auth/supervisors/:id/stats
  ↓
Fetch supervisor details
  ↓
Query breakdowns for today/active/resolved counts
  ↓
Calculate response time
  ↓
Generate mock fleet health metrics
  ↓
Return stats object
```

### Key Dependencies Between APIs

| Source API | Depends On | Reason |
|-----------|-----------|--------|
| `/api/breakdowns/*` | Authentication (JWT) | Only supervisors can create |
| `/api/breakdowns/*` | breakdownIdGenerator service | Auto-generate IDs |
| `/api/breakdowns/*` | activityLogger service | Track all actions |
| `/api/defects/*` | /api/breakdowns/* | Query breakdown history |
| `/api/analytics/*` | /api/breakdowns/* | Calculate metrics |
| `/api/engineering/*` | /api/breakdowns/* | Get breakdown data |
| `/api/sdc/*` | authenticateSDC middleware | SDC-specific auth |
| `/api/public/*` | None | No dependencies |
| WebSocket | JWT verification | Authenticate protected channels |
| WebSocket | breakdowns table | Send initial data |
| WebSocket | activity_logger | Send activity to channel |

---

## PART 4: External API Integrations

### Current Status: **MINIMAL EXTERNAL INTEGRATIONS**

The system is **primarily self-contained** with MySQL database. Based on code analysis:

**No active external API integrations found for**:
- Street Manager webhook
- National Highways data
- TomTom traffic flows
- Google Maps/HERE geocoding
- Weather APIs
- What3Words integration

**Note**: The codebase structure suggests these were planned but not implemented in current deployment. Focus is on internal MySQL-based data management.

### Potential Future Integrations (Based on Code Hints)

| API | Purpose | Status | Notes |
|-----|---------|--------|-------|
| Street Manager | Roadworks alerts | Not Active | Webhook structure ready |
| National Highways | M1/A1(M) incidents | Not Active | Data collection service prepared |
| TomTom | Traffic flow, geocoding | Not Active | API keys in .env |
| HERE / Google Maps | Route visualization | Not Active | Geocoding helpers present |
| Weather services | Incident correlation | Not Active | Conditional feature |
| What3Words | Location backup | Not Active | Geocoding fallback |

### Rate Limiting Configuration

**Login Endpoint**:
```
5 failed attempts per IP/User-Agent
15-minute window
Exponential backoff recommended
```

**SDC Operations**:
```
100 operations per user per 15-minute window
Tracked by email + IP
Returns 429 with retry-after header
```

**WebSocket Broadcast Rate**:
```
No built-in rate limiting
Broadcast to all channel subscribers
Potential performance impact if high volume
```

---

## PART 5: cPanel Compatibility Analysis

### Server Configuration

**Runtime**: Node.js 18+ (required)  
**Module System**: ES6 imports (`type: "module"` in package.json)  
**Port**: Configurable via `PORT` env variable (default: 3001)  
**Process Manager**: Passenger (auto-detection via `PASSENGER_APP_ENV`)

### cPanel-Specific Setup

#### **MySQL Connection**

**Database**: `gobarryco_breakdowns`  
**Connection Method**: Local socket (cPanel standard)

**Required Environment Variables**:
```
DB_HOST=localhost or cPanel assigned
DB_PORT=3306
DB_USER=cpanel_user
DB_PASSWORD=password
DB_NAME=cpanel_database_prefix
MYSQL_HOST=localhost
MYSQL_USER=cpanel_user
MYSQL_PASSWORD=password
MYSQL_DATABASE=database_name
```

**Connection Pool Settings**:
- Connection limit: 10 (optimized for 2GB RAM)
- Keep-alive enabled
- Timeout: 10 seconds
- Character set: utf8mb4

#### **WebSocket Support on cPanel**

**Status**: **SUPPORTED** with caveats

**Configuration Required**:
1. **Node.js Custom Application** setup in cPanel
2. **Proxy pass** configuration for WebSocket upgrade headers
3. **SSL/TLS** passthrough for `wss://` connections

**Sample cPanel Proxy Config**:
```
RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://localhost:PORT/$1" [P,L]

ProxyPreserveHost On
ProxyPass / http://localhost:PORT/
ProxyPassReverse / http://localhost:PORT/
```

**WebSocket Limitations on cPanel**:
- Shared hosting may have connection limits
- Some hosting providers disable WebSocket support
- Long-lived connections count toward CPU limits

### Environment Variables for cPanel

```bash
# MySQL Database
DB_HOST=localhost
DB_USER=cpanel_user
DB_PASSWORD=***
DB_NAME=cpanel_database_name
DB_PORT=3306

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# Server
NODE_ENV=production
PORT=3001

# CORS (adjust for cPanel domain)
ALLOWED_ORIGINS=https://yourdomain.com,https://subdomain.domain.com

# Logging
LOG_LEVEL=info
```

### Memory Optimization for 2GB cPanel

**Current Implementation**:
- Connection pool limit: 10 connections
- No global caching layers
- JSON files loaded on-demand
- File watchers disabled (WebAssembly issues)

**Recommended Settings**:
```bash
# In start script:
node --no-experimental-fetch --max-old-space-size=512 server.js

# Or via PM2 (if available):
pm2 start server.js --name "go-barry" --max-memory-restart 512M
```

### Deployment Checklist for cPanel

- [ ] Create Node.js custom application in cPanel
- [ ] Set port to 3001 (or configure in .env)
- [ ] Configure MySQL credentials in .env
- [ ] Generate JWT_SECRET and add to .env
- [ ] Set up SSL certificate (auto via cPanel AutoSSL)
- [ ] Configure proxy pass for API routes
- [ ] Configure proxy pass for WebSocket upgrade
- [ ] Set NODE_ENV=production
- [ ] Verify JWT_SECRET is NOT empty
- [ ] Test MySQL connection before deployment
- [ ] Monitor memory usage (2GB limit)
- [ ] Set up error logging rotation
- [ ] Configure backup for MySQL database

### cPanel File Structure

```
/home/cpanel_user/
├── public_html/
│   ├── index.html (frontend or redirect)
│   └── .well-known/
├── node_app/
│   ├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── node_modules/
├── .env (parent)
└── logs/
    ├── error.log
    ├── access.log
    └── websocket.log
```

---

## PART 6: Security Analysis

### Authentication

**Method**: JWT with MySQL verification  
**Secret**: Required in `JWT_SECRET` environment variable  
**Expiration**: 24 hours (configurable)  
**Verification**:
- Token signature validation
- Expiration check
- User existence in database
- User active status check
- Role-based access control

**Rate Limiting**:
- Login: 5 attempts / 15 minutes per IP+User-Agent
- SDC operations: 100 operations / 15 minutes per user
- Implemented in-memory (no distributed cache)

### CORS Configuration

**Allowed Origins**:
- `localhost:*` (all ports)
- `.onrender.com` (Render deployments)
- `.render.com`
- `.gobarry.co.uk` (production)
- Environment variable override: `ALLOWED_ORIGINS`

### Data Validation

**Input Validation**:
- `breakdownsAPI.js`: Joi schema validation for critical endpoints
- `authMiddleware.js`: Email regex, password strength checks
- Sanitization of notes/comments

**Protected Endpoints**:
- All `/api/breakdowns` require supervisor authentication
- All `/api/auth/admin/*` require admin role
- All WebSocket protected channels require JWT token

### Security Logging

**Events Logged**:
- Failed login attempts
- Unauthorized access attempts
- SDC rate limit exceeded
- Unauthorized WebSocket access
- Admin actions (password resets, approvals)

### Database Security

**Best Practices**:
- Parameterized queries (via mysql2/promise)
- Connection pooling with timeouts
- Active status checking for accounts
- Password hashing with bcrypt (10 salt rounds)
- Timezone normalization (UTC)

### Known Vulnerabilities / Considerations

1. **In-Memory Rate Limiting**: Not suitable for distributed deployments
   - Workaround: Implement Redis-based rate limiting

2. **No Token Blacklist**: Revoked tokens remain valid until expiration
   - Workaround: Implement token revocation table

3. **WebSocket No Heartbeat Timeout**: Long-idle connections remain open
   - Workaround: Implement server-side ping/pong with 30-second timeout

4. **File Watcher Disabled**: Limits real-time file-based updates
   - Status: Intentional for cPanel compatibility

---

## PART 7: Integration Issues & Recommendations

### Current Issues

1. **WebSocket File Watchers Disabled**
   - Impact: Real-time breakdown data updates depend on polling
   - Solution: Implement polling endpoint or use database triggers

2. **In-Memory Activity Logger**
   - Impact: Activities lost on server restart
   - Solution: Persist to MySQL immediately

3. **No External API Integration**
   - Impact: Cannot fetch Street Manager, National Highways, TomTom data
   - Solution: Implement service layer for each provider

4. **Rate Limiting Not Distributed**
   - Impact: Scales only to single server
   - Solution: Use Redis for shared rate limit state

### Recommendations

#### **Short Term (Critical)**
- [ ] Implement Redis for distributed rate limiting
- [ ] Add token blacklist table for early revocation
- [ ] Implement database-driven activity persistence
- [ ] Add WebSocket heartbeat timeout (30 seconds)

#### **Medium Term (Important)**
- [ ] Integrate Street Manager webhook processor
- [ ] Add National Highways data fetcher
- [ ] Implement TomTom traffic integration
- [ ] Add monitoring/alerting for API health

#### **Long Term (Enhancement)**
- [ ] GraphQL API alongside REST
- [ ] Message queue (Bull/RabbitMQ) for async tasks
- [ ] Analytics dashboard improvements
- [ ] Mobile app API optimization

### Performance Considerations

**Current Bottlenecks**:
1. MySQL connection pool (10 connections) - adequate for 9 supervisors
2. No query caching - database hit for each request
3. JSON file reads - loading entire files into memory
4. WebSocket broadcasts - sent to all clients simultaneously

**Optimization Opportunities**:
```javascript
// 1. Add query result caching
const breakdownCache = new Map(); // TTL 60 seconds

// 2. Stream large responses
res.setHeader('Content-Type', 'application/json');
res.write('[');
// Stream results
res.write(']');

// 3. Implement database query batching
const breakdowns = await batchQuery([query1, query2, query3]);

// 4. Paginate WebSocket broadcasts
const batchSize = 100;
for (let i = 0; i < clients.length; i += batchSize) {
  // Send batch
}
```

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total REST Endpoints | 85+ |
| Authenticated Endpoints | 75 |
| Public Endpoints | 10 |
| WebSocket Channels | 5 |
| Database Tables Accessed | 12+ |
| Authentication Methods | 3 (JWT, rate limit, role-based) |
| External APIs Integrated | 0 (ready for integration) |
| Supported Depots | Dynamic (configurable) |
| Max Supervisors | 9 (current) |
| Max Breakdowns (daily) | Unlimited (MySQL capacity) |
| Recommended cPanel RAM | 2GB minimum |
| Node.js Minimum Version | 18.0.0 |

---

**Report Generated**: October 27, 2025  
**Backend Version**: 2.0.0 (MySQL Migration)  
**Framework**: Express.js 4.18.2  
**Database**: MySQL 8.0+  
**WebSocket**: ws 8.18.3  
**Authentication**: JWT + MySQL + Role-based  

