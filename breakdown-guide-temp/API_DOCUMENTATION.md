# Backend API Documentation

## Setup Instructions

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Variables**
Create a `.env` file with:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
```

3. **Database Setup**
Run the following SQL migrations in your Supabase SQL editor:
- `/database/schema.sql` - Base schema
- `/database/migrations/003_add_engineers.sql` - Engineers tables

4. **Start the Server**
```bash
npm start
```

## API Endpoints

### Breakdown Endpoints

#### GET /api/breakdowns/live
Get active breakdowns for dashboards
```json
Response: {
  "success": true,
  "breakdowns": [{
    "breakdown_id": "BD-2025-00001",
    "fleet_no": "7001",
    "registration": "NK20 GNE",
    "depot_id": "WAS",
    "location": "A1 Southbound",
    "severity": "AMBER",
    "issue_type": "Engine",
    "route_id": "X10",
    "is_priority": true,
    "status": "dispatched"
  }]
}
```

#### PUT /api/breakdowns/:id/resolve
Resolve a breakdown
```json
Request: {
  "resolution_notes": "Fixed alternator belt",
  "resolving_supervisor": "AG003",
  "returned_to_service": true
}
```

### Engineering Endpoints

#### GET /api/engineering/depot-stats
Get depot performance statistics
```json
Response: {
  "success": true,
  "teams": {
    "Washington": {
      "code": "WAS",
      "available": 3,
      "total": 5,
      "avgResponse": 22,
      "sla": 95,
      "activeBreakdowns": 2
    }
  }
}
```

#### GET /api/engineering/engineers
Get all engineers
```json
Response: {
  "success": true,
  "engineers": [{
    "engineer_id": "ENG001",
    "name": "John Smith",
    "badge_number": "JS001",
    "depot": "WAS",
    "status": "available",
    "specializations": ["Engine", "Electrical"],
    "shift_start": "06:00",
    "shift_end": "14:00"
  }]
}
```

#### GET /api/engineering/metrics
Get engineering performance metrics
```json
Query params: ?period=today|week|month
Response: {
  "success": true,
  "metrics": {
    "totalBreakdowns": 15,
    "resolvedBreakdowns": 12,
    "avgResponseTime": 28,
    "slaCompliance": 92,
    "engineerUtilization": 78
  }
}
```

#### GET /api/engineering/engineers/available/:depotId
Get available engineers by depot
```json
Response: {
  "success": true,
  "engineers": [...],
  "depotId": "Washington"
}
```

#### POST /api/engineering/assign
Assign engineer to breakdown
```json
Request: {
  "breakdown_id": "BD-2025-00001",
  "engineer_id": "ENG001",
  "estimated_arrival_minutes": 30
}
```

#### POST /api/engineering/auto-assign
Auto-assign nearest available engineer
```json
Request: {
  "breakdown_id": "BD-2025-00001",
  "depot_id": "WAS"
}
```

#### PUT /api/engineering/assignment/:id/status
Update assignment status
```json
Request: {
  "status": "on_site" // dispatched|on_site|repairing|completed
}
```

#### GET /api/engineering/breakdown/:id/assignments
Get breakdown assignment history
```json
Response: {
  "success": true,
  "breakdown_id": "BD-2025-00001",
  "assignments": [{
    "engineer_id": "ENG001",
    "status": "on_site",
    "assigned_at": "2025-09-18T10:00:00Z",
    "arrival_at": "2025-09-18T10:30:00Z"
  }]
}
```

### Analytics Endpoints

#### GET /api/analytics/kpis
Get key performance indicators
```json
Query params: ?period=today|week|month|quarter|year
Response: {
  "success": true,
  "data": {
    "mtbf": {
      "value": 1247,
      "unit": "hours",
      "trend": 12.5,
      "target": 1200,
      "status": "good"
    },
    "slaCompliance": {
      "value": 94.2,
      "unit": "%",
      "trend": -2.3,
      "target": 95,
      "status": "warning"
    }
  }
}
```

#### GET /api/analytics/trends
Get performance trends over time
```json
Query params: ?period=today|week|month
Response: {
  "success": true,
  "data": {
    "breakdowns": {
      "labels": ["Mon", "Tue", "Wed"],
      "datasets": [{
        "label": "Total Breakdowns",
        "data": [12, 15, 10],
        "color": "#3b82f6"
      }]
    }
  }
}
```

#### GET /api/analytics/depot-comparison
Compare performance across depots
```json
Query params: ?period=today|week|month|quarter|year
Response: {
  "success": true,
  "data": [{
    "depot": "Washington",
    "breakdowns": 15,
    "avgResponse": 25,
    "slaCompliance": 94,
    "engineerEfficiency": 82,
    "fleetSize": 120,
    "performance": "good"
  }]
}
```

#### GET /api/analytics/fleet-health
Get fleet health overview
```json
Response: {
  "success": true,
  "data": {
    "totalVehicles": 759,
    "operational": 732,
    "inMaintenance": 18,
    "breakdown": 9,
    "categories": [{
      "type": "Single Decker",
      "total": 432,
      "operational": 418,
      "percentage": 96.8
    }],
    "topIssues": [{
      "issue": "Brake System",
      "count": 23,
      "trend": "up"
    }]
  }
}
```

## Database Schema Requirements

The API expects these tables to exist:
- `breakdowns` - Main breakdown records
- `vehicles` - Fleet information
- `supervisors` - Supervisor accounts
- `depots` - Depot configuration
- `engineers` - Engineering staff (see migration file)
- `engineer_assignments` - Assignment tracking
- `breakdown_events` - Event history

## Notes

1. The engineering endpoints will use simulated data if the `engineers` table doesn't exist
2. All timestamps are in ISO 8601 format
3. The API includes CORS support for cross-origin requests
4. Error responses include appropriate HTTP status codes and error messages

## Testing

Test the API using curl:
```bash
# Get live breakdowns
curl http://localhost:3001/api/breakdowns/live

# Get depot stats
curl http://localhost:3001/api/engineering/depot-stats

# Get KPIs
curl http://localhost:3001/api/analytics/kpis?period=today
```

Or use a tool like Postman for more complex testing.
