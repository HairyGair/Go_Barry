# API Documentation

## Base URL

```
Production: https://api.gonortheast.co.uk/v1
Development: http://localhost:5000/api/v1
```

## Authentication

All API requests require authentication using Bearer tokens:

```http
Authorization: Bearer <token>
```

### Obtain Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "supervisor@gonortheast.co.uk",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Anthony Gair",
      "email": "anthony.gair@gonortheast.co.uk",
      "role": "supervisor",
      "depot": "SDC"
    }
  }
}
```

## Endpoints

### Breakdowns

#### Get All Breakdowns

```http
GET /breakdowns
```

**Query Parameters:**
- `status` (optional): `active`, `pending`, `resolved`
- `priority` (optional): `critical`, `high`, `medium`, `low`
- `depot` (optional): Depot code
- `date` (optional): ISO date string
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "breakdowns": [
      {
        "id": "b1234567-89ab-cdef-0123-456789abcdef",
        "busNumber": "5521",
        "route": "X10",
        "location": "A1 Northbound, Near Team Valley",
        "status": "active",
        "priority": "critical",
        "reportedAt": "2024-01-25T14:30:00Z",
        "supervisor": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Anthony Gair"
        },
        "driver": {
          "name": "John Smith",
          "phone": "07700900123"
        },
        "passengers": 25,
        "slaTarget": "2024-01-25T15:00:00Z",
        "notes": "Engine failure, passengers transferred to replacement bus"
      }
    ],
    "total": 127,
    "page": 1,
    "limit": 50
  }
}
```

#### Get Single Breakdown

```http
GET /breakdowns/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "b1234567-89ab-cdef-0123-456789abcdef",
    "busNumber": "5521",
    "route": "X10",
    "location": {
      "description": "A1 Northbound, Near Team Valley",
      "coordinates": {
        "lat": 54.9567,
        "lng": -1.5897
      }
    },
    "status": "active",
    "priority": "critical",
    "reportedAt": "2024-01-25T14:30:00Z",
    "supervisor": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Anthony Gair",
      "depot": "SDC"
    },
    "engineer": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "name": "Mike Johnson",
      "eta": "2024-01-25T14:55:00Z"
    },
    "driver": {
      "name": "John Smith",
      "phone": "07700900123",
      "employeeId": "D12345"
    },
    "vehicle": {
      "fleetNumber": "5521",
      "registration": "NK64EZH",
      "type": "Volvo B9TL",
      "depot": "SDC"
    },
    "passengers": {
      "count": 25,
      "vulnerable": 2,
      "wheelchairs": 1
    },
    "assessment": {
      "faultCode": "ENG-001",
      "symptoms": "Engine won't start, warning lights on dashboard",
      "initialDiagnosis": "Possible fuel system failure",
      "safetyChecks": {
        "passengersEvacuated": true,
        "vehicleSecure": true,
        "hazardsActive": true,
        "locationSafe": true
      }
    },
    "timeline": [
      {
        "timestamp": "2024-01-25T14:30:00Z",
        "event": "Breakdown reported",
        "user": "John Smith (Driver)"
      },
      {
        "timestamp": "2024-01-25T14:32:00Z",
        "event": "Assigned to supervisor",
        "user": "System"
      },
      {
        "timestamp": "2024-01-25T14:35:00Z",
        "event": "Engineer dispatched",
        "user": "Anthony Gair"
      }
    ],
    "sla": {
      "target": "2024-01-25T15:00:00Z",
      "remainingMinutes": 25,
      "status": "at_risk"
    }
  }
}
```

#### Create Breakdown Report

```http
POST /breakdowns
Content-Type: application/json

{
  "busNumber": "3421",
  "route": "21",
  "location": {
    "description": "Durham Road, Gateshead",
    "coordinates": {
      "lat": 54.9567,
      "lng": -1.5897
    }
  },
  "driverName": "Jane Doe",
  "driverPhone": "07700900456",
  "passengerCount": 15,
  "priority": "high",
  "symptoms": "Brake warning light, unusual noise from rear",
  "notes": "Driver reports grinding noise when braking"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "b7654321-89ab-cdef-0123-456789abcdef",
    "message": "Breakdown report created successfully",
    "assignedTo": "Anthony Gair",
    "estimatedResponse": "15 minutes"
  }
}
```

#### Update Breakdown

```http
PATCH /breakdowns/:id
Content-Type: application/json

{
  "status": "in_progress",
  "engineerId": "650e8400-e29b-41d4-a716-446655440001",
  "notes": "Engineer en route, ETA 10 minutes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Breakdown updated successfully",
    "breakdown": { /* Updated breakdown object */ }
  }
}
```

#### Resolve Breakdown

```http
POST /breakdowns/:id/resolve
Content-Type: application/json

{
  "resolution": "replaced",
  "replacementBus": "3302",
  "engineerNotes": "Fuel pump failure, vehicle towed to depot",
  "downtime": 45
}
```

### Notifications

#### Get Notifications

```http
GET /notifications
```

**Query Parameters:**
- `unread` (optional): `true` to get only unread
- `priority` (optional): Filter by priority
- `type` (optional): Filter by type
- `limit` (optional): Number of results

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "n1234567-89ab-cdef-0123-456789abcdef",
        "type": "emergency",
        "priority": "critical",
        "title": "Emergency Breakdown",
        "message": "Bus 5521 broken down on A1 - Passengers on board",
        "metadata": {
          "busNumber": "5521",
          "route": "X10",
          "location": "A1 Northbound"
        },
        "read": false,
        "createdAt": "2024-01-25T14:30:00Z",
        "actions": [
          {
            "label": "Assign to Me",
            "action": "assign_self",
            "url": "/api/v1/breakdowns/b1234567/assign"
          }
        ]
      }
    ],
    "unreadCount": 3,
    "total": 15
  }
}
```

#### Mark Notification as Read

```http
PATCH /notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Notification marked as read"
  }
}
```

#### Mark All as Read

```http
POST /notifications/read-all
```

### Fleet

#### Get Fleet Status

```http
GET /fleet/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 450,
    "operational": 420,
    "breakdown": 8,
    "maintenance": 22,
    "depots": {
      "SDC": {
        "total": 120,
        "operational": 115,
        "breakdown": 2,
        "maintenance": 3
      },
      "Washington": {
        "total": 95,
        "operational": 90,
        "breakdown": 1,
        "maintenance": 4
      }
    },
    "healthScore": 93.3
  }
}
```

#### Get Vehicle Details

```http
GET /fleet/vehicles/:busNumber
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fleetNumber": "5521",
    "registration": "NK64EZH",
    "type": "Volvo B9TL",
    "depot": "SDC",
    "status": "breakdown",
    "lastService": "2024-01-10",
    "nextService": "2024-03-10",
    "mileage": 145678,
    "breakdownHistory": [
      {
        "date": "2024-01-25",
        "issue": "Engine failure",
        "downtime": 45
      },
      {
        "date": "2023-12-15",
        "issue": "Brake system",
        "downtime": 120
      }
    ],
    "maintenanceSchedule": [
      {
        "type": "A Service",
        "due": "2024-03-10",
        "mileageOrDate": "6 weeks"
      }
    ]
  }
}
```

### Analytics

#### Get Dashboard Stats

```http
GET /analytics/dashboard
```

**Query Parameters:**
- `period` (optional): `today`, `week`, `month`, `year`
- `depot` (optional): Filter by depot

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "breakdowns": {
      "total": 12,
      "resolved": 8,
      "active": 3,
      "pending": 1
    },
    "sla": {
      "met": 10,
      "breached": 2,
      "percentage": 83.3
    },
    "avgResponseTime": 18,
    "avgResolutionTime": 42,
    "topIssues": [
      {
        "type": "Brake System",
        "count": 4,
        "percentage": 33.3
      },
      {
        "type": "Engine",
        "count": 3,
        "percentage": 25
      }
    ],
    "trends": {
      "breakdownRate": "+15%",
      "responseTime": "-5%",
      "slaCompliance": "+2%"
    }
  }
}
```

#### Get SLA Report

```http
GET /analytics/sla
```

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `depot` (optional): Filter by depot

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "summary": {
      "totalBreakdowns": 245,
      "slaMet": 220,
      "slaBreached": 25,
      "compliance": 89.8
    },
    "byDepot": {
      "SDC": {
        "compliance": 91.2,
        "avgResponseTime": 16
      },
      "Washington": {
        "compliance": 88.5,
        "avgResponseTime": 19
      }
    },
    "byPriority": {
      "critical": {
        "target": 30,
        "avgActual": 28,
        "compliance": 94
      },
      "high": {
        "target": 45,
        "avgActual": 42,
        "compliance": 90
      }
    }
  }
}
```

### Engineers

#### Get Available Engineers

```http
GET /engineers/available
```

**Query Parameters:**
- `location` (optional): Coordinates or area
- `specialization` (optional): Filter by expertise

**Response:**
```json
{
  "success": true,
  "data": {
    "engineers": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "name": "Mike Johnson",
        "status": "available",
        "location": {
          "lat": 54.9567,
          "lng": -1.5897
        },
        "distance": 2.5,
        "eta": 8,
        "specializations": ["Volvo", "Engine", "Electrical"],
        "currentLoad": 0,
        "rating": 4.8
      }
    ]
  }
}
```

#### Assign Engineer

```http
POST /breakdowns/:id/assign
Content-Type: application/json

{
  "engineerId": "650e8400-e29b-41d4-a716-446655440001",
  "priority": "immediate",
  "notes": "Critical breakdown with passengers"
}
```

### WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('wss://api.gonortheast.co.uk/ws');

ws.onopen = () => {
  // Subscribe to events
  ws.send(JSON.stringify({
    action: 'subscribe',
    channels: ['breakdowns', 'notifications']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'breakdown:new':
      // New breakdown reported
      break;
    case 'breakdown:updated':
      // Breakdown status changed
      break;
    case 'notification:new':
      // New notification
      break;
    case 'sla:warning':
      // SLA warning
      break;
  }
};
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "busNumber",
        "message": "Bus number is required"
      }
    ]
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` - Invalid or missing token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `SERVER_ERROR` - Internal server error
- `RATE_LIMIT` - Too many requests

### Rate Limiting

API endpoints are rate limited:

- **Default**: 100 requests per minute
- **Search endpoints**: 30 requests per minute
- **Analytics**: 10 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706195400
```

### Pagination

List endpoints support pagination:

```http
GET /breakdowns?limit=20&offset=40

Link: <https://api.gonortheast.co.uk/v1/breakdowns?limit=20&offset=60>; rel="next",
      <https://api.gonortheast.co.uk/v1/breakdowns?limit=20&offset=20>; rel="prev",
      <https://api.gonortheast.co.uk/v1/breakdowns?limit=20&offset=0>; rel="first",
      <https://api.gonortheast.co.uk/v1/breakdowns?limit=20&offset=240>; rel="last"
```

### Filtering and Sorting

Most list endpoints support filtering and sorting:

```http
GET /breakdowns?status=active&priority=high&sort=-reportedAt&depot=SDC
```

**Sort Options:**
- Prefix with `-` for descending order
- `reportedAt` - Time reported
- `priority` - Priority level
- `status` - Current status
- `slaTarget` - SLA deadline

---

*Last updated: January 2024*