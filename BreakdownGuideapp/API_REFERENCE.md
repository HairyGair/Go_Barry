# API Reference - Breakdown Management System

**Version:** 2.0.0
**Base URL (Production):** `https://go-barry.onrender.com`
**Base URL (Local):** `http://localhost:3001`
**Last Updated:** October 1, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Breakdowns](#breakdowns)
3. [Activity Feed](#activity-feed)
4. [Analytics](#analytics)
5. [Engineering](#engineering)
6. [Supervisors](#supervisors)
7. [Wizards](#wizards)
8. [Fleet](#fleet)
9. [WebSocket](#websocket)
10. [Error Codes](#error-codes)

---

## Authentication

### Login

**POST** `/api/auth/login`

Authenticate a supervisor and receive a JWT token.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "anthony.gair@gonortheast.co.uk",
  "password": "TempPass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "...",
    "user": {
      "id": "1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0",
      "email": "anthony.gair@gonortheast.co.uk"
    }
  },
  "supervisor": {
    "badge_number": "AG003",
    "name": "Anthony Gair",
    "depot": "SDC",
    "role": "admin"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `429` - Too many login attempts (rate limited)

---

### Verify Token

**POST** `/api/auth/verify`

Verify if a JWT token is still valid.

**Request:**
```http
POST /api/auth/verify
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "admin"
  }
}
```

---

### Change Password

**POST** `/api/auth/change-password`

Change a supervisor's password.

**Request:**
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "anthony.gair@gonortheast.co.uk",
  "currentPassword": "TempPass123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `401` - Invalid current password
- `400` - Password too weak

---

### Logout

**POST** `/api/auth/logout`

End a supervisor session.

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Breakdowns

All breakdown endpoints require authentication.

### Create Breakdown

**POST** `/api/breakdowns`

Create a new breakdown record.

**Request:**
```http
POST /api/breakdowns
Authorization: Bearer <token>
Content-Type: application/json

{
  "fleet_no": "6377",
  "location_description": "Washington Depot",
  "location": "54.9000,-1.5200",
  "issue_category": "steering",
  "severity": "AMBER",
  "supervisor_badge": "AG003",
  "depot": "Washington",
  "wizard_type": "steering_wizard",
  "wizard_decision": "AMBER",
  "wizard_assessment_data": {
    "symptoms": ["pulling_left", "heavy_steering"],
    "inspection_notes": "Power steering fluid low"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "breakdown": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "breakdown_id": "BRK-20250101-001",
    "fleet_no": "6377",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location_description": "Washington Depot",
    "issue_category": "steering",
    "severity": "AMBER",
    "status": "pending",
    "created_at": "2025-10-01T19:00:00.000Z",
    "updated_at": "2025-10-01T19:00:00.000Z"
  },
  "breakdown_id": "BRK-20250101-001"
}
```

---

### Get Breakdown

**GET** `/api/breakdowns/:id`

Retrieve a specific breakdown by ID.

**Request:**
```http
GET /api/breakdowns/f47ac10b-58cc-4372-a567-0e02b2c3d479
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "breakdown": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "breakdown_id": "BRK-20250101-001",
    "fleet_no": "6377",
    "supervisor_badge": "AG003",
    "supervisor_name": "Anthony Gair",
    "location_description": "Washington Depot",
    "location": {"lat": 54.9000, "lng": -1.5200},
    "issue_category": "steering",
    "severity": "AMBER",
    "status": "pending",
    "wizard_type": "steering_wizard",
    "wizard_decision": "AMBER",
    "wizard_assessment_data": {...},
    "depot": "Washington",
    "created_at": "2025-10-01T19:00:00.000Z",
    "updated_at": "2025-10-01T19:00:00.000Z"
  }
}
```

---

### Update Breakdown

**PUT** `/api/breakdowns/:id`

Update an existing breakdown.

**Request:**
```http
PUT /api/breakdowns/f47ac10b-58cc-4372-a567-0e02b2c3d479
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress",
  "engineer_assigned": "ENG001",
  "engineer_name": "John Smith",
  "estimated_repair_time": 120
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "breakdown": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status": "in-progress",
    "engineer_assigned": "ENG001",
    "updated_at": "2025-10-01T19:15:00.000Z"
  }
}
```

---

### Get Live Breakdowns

**GET** `/api/breakdowns/live`

Get all active (non-resolved) breakdowns for dashboard display.

**Request:**
```http
GET /api/breakdowns/live?depot=SDC&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `depot` (optional) - Filter by depot
- `limit` (optional, default: 50) - Max results
- `offset` (optional, default: 0) - Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "breakdowns": [
    {
      "id": "...",
      "breakdown_id": "BRK-20250101-001",
      "fleet_no": "6377",
      "severity": "AMBER",
      "status": "pending",
      "location_description": "Washington Depot",
      "created_at": "2025-10-01T19:00:00.000Z",
      "time_elapsed": "15 minutes ago"
    },
    ...
  ],
  "count": 12,
  "timestamp": "2025-10-01T19:15:00.000Z"
}
```

---

### Get Breakdown Stats

**GET** `/api/breakdowns/stats`

Get breakdown statistics.

**Request:**
```http
GET /api/breakdowns/stats?period=24h&depot=SDC
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional) - `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `depot` (optional) - Filter by depot

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total": 45,
    "active": 12,
    "resolved": 33,
    "avg_response_time": 18.5,
    "by_severity": {
      "STOP": 8,
      "AMBER": 22,
      "CONTINUE": 15
    },
    "by_depot": {
      "SDC": 28,
      "Washington": 17
    },
    "trend": "increasing"
  }
}
```

---

## Activity Feed

### Get Activity Feed

**GET** `/api/activity/feed`

Get paginated activity feed.

**Request:**
```http
GET /api/activity/feed?limit=20&offset=0&depot=SDC
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional, default: 50) - Results per page
- `offset` (optional, default: 0) - Pagination offset
- `depot` (optional) - Filter by depot
- `actor_id` (optional) - Filter by supervisor badge
- `activity_type` (optional) - Filter by type
- `severity` (optional) - Filter by severity

**Response (200 OK):**
```json
{
  "success": true,
  "activities": [
    {
      "id": "...",
      "type": "breakdown_created",
      "icon": "🚨",
      "message": "Anthony Gair created breakdown for 6377 at Washington Depot",
      "time": "2m ago",
      "timestamp": "2025-10-01T19:13:00.000Z",
      "depot": "Washington",
      "supervisor": "Anthony Gair",
      "supervisor_badge": "AG003",
      "severity": "critical",
      "breakdown_id": "BRK-20250101-001",
      "fleet_no": "6377"
    },
    ...
  ],
  "count": 125,
  "timestamp": "2025-10-01T19:15:00.000Z"
}
```

---

### Get Live Activities

**GET** `/api/activity/live`

Get real-time activities (last 5 minutes).

**Request:**
```http
GET /api/activity/live?since=2025-10-01T19:10:00.000Z
Authorization: Bearer <token>
```

**Query Parameters:**
- `since` (optional) - ISO timestamp (default: 5 minutes ago)
- `limit` (optional, default: 25) - Max results

**Response (200 OK):**
```json
{
  "success": true,
  "activities": [...],
  "count": 8,
  "since": "2025-10-01T19:10:00.000Z",
  "timestamp": "2025-10-01T19:15:00.000Z"
}
```

---

### Log Activity

**POST** `/api/activity/log`

Manually log a new activity.

**Request:**
```http
POST /api/activity/log
Authorization: Bearer <token>
Content-Type: application/json

{
  "activityType": "breakdown_created",
  "action": "created",
  "actorType": "supervisor",
  "actorId": "AG003",
  "actorName": "Anthony Gair",
  "entityType": "breakdown",
  "entityId": "BRK-20250101-001",
  "entityDetails": {
    "fleetNo": "6377",
    "location": "Washington Depot"
  },
  "depot": "Washington",
  "severity": "critical",
  "priority": 5,
  "source": "web_app",
  "message": "New breakdown reported"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "activity": {
    "id": "...",
    "created_at": "2025-10-01T19:15:00.000Z"
  }
}
```

---

## Analytics

### Get KPIs

**GET** `/api/analytics/kpis`

Get key performance indicators.

**Request:**
```http
GET /api/analytics/kpis?period=24h&depot=SDC
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional) - `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `depot` (optional) - Filter by depot

**Response (200 OK):**
```json
{
  "success": true,
  "kpis": {
    "total_breakdowns": 45,
    "active_breakdowns": 12,
    "avg_response_time": 18.5,
    "avg_resolution_time": 87.3,
    "repeat_breakdown_rate": 0.12,
    "fleet_availability": 0.94,
    "sla_compliance": 0.96,
    "engineer_utilization": 0.78
  },
  "period": "24h",
  "timestamp": "2025-10-01T19:15:00.000Z"
}
```

---

### Get Trends

**GET** `/api/analytics/trends`

Get time-series trend data.

**Request:**
```http
GET /api/analytics/trends?metric=breakdown_count&period=7d&interval=hourly
Authorization: Bearer <token>
```

**Query Parameters:**
- `metric` (required) - `breakdown_count`, `response_time`, `resolution_time`
- `period` (optional, default: `7d`) - Time period
- `interval` (optional, default: `hourly`) - `hourly`, `daily`, `weekly`

**Response (200 OK):**
```json
{
  "success": true,
  "metric": "breakdown_count",
  "period": "7d",
  "interval": "hourly",
  "data": [
    {"timestamp": "2025-09-25T00:00:00.000Z", "value": 3},
    {"timestamp": "2025-09-25T01:00:00.000Z", "value": 1},
    ...
  ],
  "summary": {
    "avg": 2.8,
    "min": 0,
    "max": 7,
    "trend": "increasing"
  }
}
```

---

## Engineering

### List Engineers

**GET** `/api/engineering/engineers`

Get all engineers and their availability.

**Request:**
```http
GET /api/engineering/engineers?available=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `available` (optional) - Filter by availability
- `skill` (optional) - Filter by skill (electrical, mechanical, hvac)
- `depot` (optional) - Filter by home depot

**Response (200 OK):**
```json
{
  "success": true,
  "engineers": [
    {
      "id": "ENG001",
      "name": "John Smith",
      "depot": "Washington",
      "skills": ["electrical", "mechanical"],
      "availability": "available",
      "current_location": {"lat": 54.9000, "lng": -1.5200},
      "active_assignments": 0
    },
    ...
  ],
  "count": 8
}
```

---

### Assign Engineer

**POST** `/api/engineering/assign`

Manually assign engineer to breakdown.

**Request:**
```http
POST /api/engineering/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "breakdown_id": "BRK-20250101-001",
  "engineer_id": "ENG001",
  "notes": "Urgent - steering issue"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "assignment": {
    "breakdown_id": "BRK-20250101-001",
    "engineer_id": "ENG001",
    "engineer_name": "John Smith",
    "assigned_at": "2025-10-01T19:15:00.000Z",
    "estimated_arrival": "2025-10-01T19:35:00.000Z"
  }
}
```

---

### Auto-Assign Engineer

**POST** `/api/engineering/auto-assign`

Automatically assign best available engineer based on location and skills.

**Request:**
```http
POST /api/engineering/auto-assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "breakdown_id": "BRK-20250101-001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "assignment": {
    "breakdown_id": "BRK-20250101-001",
    "engineer_id": "ENG001",
    "engineer_name": "John Smith",
    "match_score": 0.95,
    "reasoning": "Closest available engineer with required skills",
    "estimated_arrival": "2025-10-01T19:25:00.000Z"
  }
}
```

---

## Supervisors

### List Supervisors

**GET** `/api/supervisors`

Get all supervisors.

**Request:**
```http
GET /api/supervisors?active=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `active` (optional) - Filter by active status
- `depot` (optional) - Filter by depot

**Response (200 OK):**
```json
{
  "success": true,
  "supervisors": [
    {
      "id": "...",
      "email": "anthony.gair@gonortheast.co.uk",
      "name": "Anthony Gair",
      "badge_number": "AG003",
      "depot": "SDC",
      "role": "admin",
      "is_active": true,
      "last_login": "2025-10-01T18:00:00.000Z"
    },
    ...
  ],
  "count": 13
}
```

---

## Wizards

### List Wizard Types

**GET** `/api/wizards/types`

Get all available wizard types.

**Request:**
```http
GET /api/wizards/types
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "wizards": [
    {
      "id": "steering_wizard",
      "name": "Steering Issues",
      "description": "Diagnose power steering and mechanical steering problems",
      "category": "mechanical",
      "steps": 8
    },
    {
      "id": "brakes_wizard",
      "name": "Brake Problems",
      "description": "Assess brake performance and safety",
      "category": "mechanical",
      "steps": 10
    },
    ...
  ],
  "count": 22
}
```

---

## Fleet

### Search Vehicles

**GET** `/api/fleet/vehicles`

Search for vehicles by fleet number or depot.

**Request:**
```http
GET /api/fleet/vehicles?search=6377
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional) - Search by fleet number
- `depot` (optional) - Filter by depot
- `limit` (optional, default: 10) - Max results

**Response (200 OK):**
```json
{
  "success": true,
  "vehicles": [
    {
      "fleet_no": "6377",
      "depot": "Washington",
      "make": "Alexander Dennis",
      "model": "Enviro400",
      "year": 2018,
      "status": "active"
    }
  ],
  "count": 1
}
```

---

### Get Vehicle

**GET** `/api/fleet/vehicle/:fleetNumber`

Get details for a specific vehicle.

**Request:**
```http
GET /api/fleet/vehicle/6377
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "vehicle": {
    "fleet_no": "6377",
    "depot": "Washington",
    "make": "Alexander Dennis",
    "model": "Enviro400",
    "year": 2018,
    "status": "active",
    "recent_breakdowns": 2,
    "last_breakdown": "2025-09-28T10:30:00.000Z"
  }
}
```

---

## WebSocket

### Connection

**WebSocket URL:** `wss://go-barry.onrender.com/ws`

Connect to receive real-time updates.

**Example (JavaScript):**
```javascript
const ws = new WebSocket('wss://go-barry.onrender.com/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');

  // Subscribe to specific channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'sdc-dashboard'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);

  // Handle different message types
  switch(data.type) {
    case 'new_breakdown':
      // Update UI with new breakdown
      break;
    case 'status_update':
      // Update breakdown status
      break;
    case 'engineer_assigned':
      // Show assignment notification
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
  // Implement reconnection logic
};
```

### Message Types

**new_breakdown:**
```json
{
  "type": "new_breakdown",
  "data": {
    "breakdown_id": "BRK-20250101-001",
    "fleet_no": "6377",
    "severity": "AMBER",
    "location": "Washington Depot"
  }
}
```

**status_update:**
```json
{
  "type": "status_update",
  "data": {
    "breakdown_id": "BRK-20250101-001",
    "status": "in-progress",
    "engineer_assigned": "ENG001"
  }
}
```

---

## Error Codes

### Standard HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, or DELETE |
| 201 | Created | Successful POST creating resource |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Database connection failed |

### Custom Error Codes

| Code | Description |
|------|-------------|
| `AUTH_TOKEN_MISSING` | No Authorization header |
| `AUTH_TOKEN_INVALID` | Invalid JWT token |
| `AUTH_TOKEN_EXPIRED` | Token has expired |
| `AUTH_TOKEN_MALFORMED` | Token format incorrect |
| `SUPERVISOR_NOT_FOUND` | No supervisor record for user |
| `BREAKDOWN_NOT_FOUND` | Breakdown ID doesn't exist |
| `INVALID_FLEET_NUMBER` | Fleet number format invalid |
| `DUPLICATE_BREAKDOWN` | Breakdown already exists |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limits

- **Login:** 5 attempts per 15 minutes per IP
- **All other endpoints:** No limit currently (may be added in future)

---

## Changelog

**Version 2.0.0 (Oct 1, 2025):**
- Initial comprehensive API documentation
- All endpoints documented
- WebSocket protocol added

---

**For Support:** anthony.gair@gonortheast.co.uk
