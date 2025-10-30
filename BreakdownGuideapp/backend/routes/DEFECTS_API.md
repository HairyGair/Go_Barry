# Fleet Intelligence / Defects Tracking API Documentation

**Version:** 1.0.0
**Last Updated:** October 6, 2025
**Base URL:** `https://breakdown-guide.onrender.com`

## Overview

The Defects API provides advanced analytics and intelligence for fleet management, enabling supervisors to:

- Identify vehicles with repeat defects
- Track trending defect types across the fleet
- Generate predictive maintenance alerts
- Analyze depot-level defect statistics
- Escalate critical defects to management
- Generate comprehensive defect analysis reports

All endpoints require **Supervisor Authentication** via Supabase JWT token.

---

## Authentication

All endpoints require a valid Supabase authentication token in the Authorization header:

```http
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

**Roles Required:** Supervisor, Manager, Admin

---

## Endpoints

### 1. Repeat Defects Analysis

**Endpoint:** `POST /api/defects/repeat`

**Description:** Identifies vehicles with multiple defects in a given timeframe, helping identify problematic vehicles requiring preventive maintenance.

**Request Body:**
```json
{
  "timeframe": "24h" | "7d" | "30d" | "90d"
}
```

**Response:**
```json
{
  "success": true,
  "timeframe": "7d",
  "startDate": "2025-09-29T10:00:00.000Z",
  "totalVehiclesAnalyzed": 45,
  "repeatDefectVehicles": 8,
  "vehicles": [
    {
      "fleetNumber": "6335",
      "registration": "NK67 EHY",
      "depot": "Washington",
      "vehicleType": "Streetlite",
      "defectCount": 4,
      "totalSeverityScore": 8,
      "averageSeverityScore": "2.00",
      "unresolvedCount": 2,
      "defects": [
        {
          "breakdownId": "BD-2025-00123",
          "type": "Engine Issues",
          "date": "2025-10-05T14:30:00.000Z",
          "severity": "AMBER",
          "severityScore": 2,
          "resolved": false,
          "status": "active",
          "location": "Newcastle City Centre",
          "description": "Engine warning light"
        },
        // ... more defects
      ]
    }
  ],
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Use Cases:**
- Identify vehicles needing preventive maintenance
- Flag problematic vehicles for detailed inspection
- Support fleet replacement decisions

---

### 2. Trending Defects Analysis

**Endpoint:** `POST /api/defects/trends`

**Description:** Analyzes defect trends over time, comparing current period with previous period to identify rising, falling, or stable defect types.

**Request Body:**
```json
{
  "timeframe": "7d" | "24h" | "30d",
  "groupByType": true
}
```

**Response:**
```json
{
  "success": true,
  "timeframe": "7d",
  "currentPeriod": {
    "start": "2025-09-29T10:00:00.000Z",
    "end": "2025-10-06T10:00:00.000Z",
    "totalDefects": 87
  },
  "comparisonPeriod": {
    "start": "2025-09-22T10:00:00.000Z",
    "end": "2025-09-29T10:00:00.000Z",
    "totalDefects": 72
  },
  "trends": [
    {
      "defectType": "Engine Issues",
      "currentCount": 23,
      "previousCount": 15,
      "change": 8,
      "changePercent": 53.3,
      "trend": "rising",
      "affectedModels": ["Streetlite", "Versa", "Citaro"],
      "priority": "high"
    },
    {
      "defectType": "Electrical Fault",
      "currentCount": 18,
      "previousCount": 22,
      "change": -4,
      "changePercent": -18.2,
      "trend": "falling",
      "affectedModels": ["Streetlite"],
      "priority": "normal"
    }
  ],
  "risingTrends": 3,
  "fallingTrends": 2,
  "stableTrends": 5,
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Use Cases:**
- Identify emerging fleet-wide issues
- Track effectiveness of maintenance interventions
- Support parts inventory planning

---

### 3. Depot Defect Statistics

**Endpoint:** `GET /api/defects/depot-stats`

**Description:** Returns defect statistics grouped by depot, including defect rates, top issues, and trends.

**Query Parameters:**
- `timeframe` (optional): `7d` (default), `24h`, `30d`, `90d`

**Response:**
```json
{
  "success": true,
  "timeframe": "7d",
  "startDate": "2025-09-29T10:00:00.000Z",
  "depots": [
    {
      "name": "Washington",
      "defectCount": 28,
      "defectRate": 14.00,
      "trend": "stable",
      "topIssue": "Engine Issues",
      "topIssueCount": 12,
      "vehicleCount": 200,
      "averageSeverity": 1.85,
      "defectTypes": {
        "Engine Issues": 12,
        "Electrical Fault": 8,
        "Brake Problems": 5,
        "Door Malfunction": 3
      }
    },
    // ... more depots
  ],
  "totalDefects": 87,
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Use Cases:**
- Compare depot performance
- Identify depots needing additional support
- Benchmark maintenance quality

---

### 4. Predictive Maintenance Alerts

**Endpoint:** `GET /api/defects/predictive`

**Description:** Generates AI-driven predictive maintenance alerts based on defect patterns in the last 30 days.

**Response:**
```json
{
  "success": true,
  "alertCount": 5,
  "alerts": [
    {
      "type": "maintenance",
      "priority": "high",
      "message": "Vehicle 6335 has 5 defects in 30 days - schedule preventive maintenance",
      "vehicles": ["6335"],
      "defectCount": 5,
      "recommendation": "Schedule comprehensive inspection and preventive maintenance",
      "estimatedCost": "Medium-High",
      "createdAt": "2025-10-06T10:00:00.000Z"
    },
    {
      "type": "pattern",
      "priority": "medium",
      "message": "Engine Issues affecting 15 vehicles - potential fleet-wide issue",
      "vehicles": ["6335", "6340", "6345", "6350", "6355", "..."],
      "defectType": "Engine Issues",
      "affectedCount": 15,
      "recommendation": "Investigate common cause and implement fleet-wide preventive measures",
      "estimatedCost": "High",
      "createdAt": "2025-10-06T10:00:00.000Z"
    },
    {
      "type": "weather",
      "priority": "low",
      "message": "4 weather-related defects detected - prepare for seasonal maintenance",
      "vehicles": ["6335", "6340", "6345", "6350"],
      "recommendation": "Review climate control systems and electrical systems fleet-wide",
      "estimatedCost": "Low-Medium",
      "createdAt": "2025-10-06T10:00:00.000Z"
    }
  ],
  "analysisRange": {
    "start": "2025-09-06T10:00:00.000Z",
    "end": "2025-10-06T10:00:00.000Z",
    "daysAnalyzed": 30
  },
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Alert Types:**
- `maintenance`: Vehicles with high failure rates
- `pattern`: Fleet-wide recurring issues
- `weather`: Seasonal/weather-related defects

**Priority Levels:**
- `high`: Immediate action required
- `medium`: Action recommended within 7 days
- `low`: Monitor and plan accordingly

**Use Cases:**
- Proactive maintenance scheduling
- Fleet-wide issue detection
- Cost optimization through prevention

---

### 5. Defect Escalation

**Endpoint:** `POST /api/defects/escalate`

**Description:** Escalates critical defects to management via email/notification system.

**Request Body:**
```json
{
  "vehicleId": "6335",
  "fleetNumber": "6335",
  "defects": [
    {
      "type": "Engine Issues",
      "severity": "STOP",
      "date": "2025-10-06T10:00:00.000Z"
    }
  ],
  "escalationType": "email",
  "recipient": "engineering.manager@gonortheast.co.uk",
  "cc": ["depot.manager@gonortheast.co.uk"],
  "message": "Critical engine failure requiring immediate attention",
  "priority": "critical"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Defect escalation successful",
  "escalation": {
    "id": "ESC-1728209400000",
    "vehicleId": "6335",
    "status": "sent",
    "escalatedBy": "Anthony Gair",
    "escalatedAt": "2025-10-06T10:00:00.000Z",
    "emailPreview": {
      "to": "engineering.manager@gonortheast.co.uk",
      "cc": ["depot.manager@gonortheast.co.uk"],
      "subject": "[CRITICAL] Fleet Defect Escalation - Vehicle 6335",
      "body": "..."
    }
  },
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Priority Levels:**
- `critical`: Immediate safety concern
- `high`: Urgent action required
- `medium`: Timely action needed
- `low`: For awareness

**Use Cases:**
- Escalate safety-critical issues
- Notify management of repeated failures
- Document escalation trail for compliance

---

### 6. Defect Report Generation

**Endpoint:** `POST /api/defects/report`

**Description:** Generates comprehensive defect analysis report with customizable sections.

**Request Body:**
```json
{
  "timeframe": "30d",
  "includeRepeatDefects": true,
  "includeTrends": true,
  "includeDepotStats": true,
  "includePredictive": true,
  "format": "json"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "title": "Fleet Intelligence - Defect Analysis Report",
    "generatedAt": "2025-10-06T10:00:00.000Z",
    "generatedBy": "Anthony Gair",
    "timeframe": "30d",
    "summary": {
      "totalDefects": 287,
      "timeframe": "30d",
      "analysisStartDate": "2025-09-06T10:00:00.000Z",
      "analysisEndDate": "2025-10-06T10:00:00.000Z",
      "daysAnalyzed": 30
    },
    "sections": {
      "repeatDefects": {
        "totalVehicles": 15,
        "vehicles": [...]
      },
      "trends": {
        "summary": "Defect trends over selected timeframe",
        "note": "Use /api/defects/trends endpoint for detailed trend analysis"
      },
      "depotStats": {
        "summary": "Depot-level defect statistics",
        "note": "Use /api/defects/depot-stats endpoint for detailed depot analysis"
      },
      "predictiveAlerts": {
        "summary": "AI-generated predictive maintenance recommendations",
        "note": "Use /api/defects/predictive endpoint for detailed predictive analysis"
      }
    }
  },
  "format": "json",
  "downloadUrl": null,
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Report Sections:**
- `repeatDefects`: Vehicles with multiple defects
- `trends`: Trending defect analysis
- `depotStats`: Depot-level statistics
- `predictiveAlerts`: Predictive maintenance recommendations

**Future Formats:**
- `json` (current)
- `pdf` (planned)
- `csv` (planned)

**Use Cases:**
- Monthly management reports
- Compliance documentation
- Performance reviews

---

### 7. Vehicle Defect History

**Endpoint:** `GET /api/defects/vehicle/:fleetNumber`

**Description:** Returns complete defect history and analysis for a specific vehicle.

**Path Parameters:**
- `fleetNumber`: Vehicle fleet number (e.g., "6335")

**Query Parameters:**
- `limit` (optional): Max records to return (default: 50)
- `includeResolved` (optional): Include resolved defects (default: true)

**Response:**
```json
{
  "success": true,
  "fleetNumber": "6335",
  "totalDefects": 12,
  "averageSeverity": "1.92",
  "mostCommonDefect": {
    "type": "Engine Issues",
    "count": 5
  },
  "defectTypes": {
    "Engine Issues": 5,
    "Electrical Fault": 3,
    "Brake Problems": 2,
    "Door Malfunction": 2
  },
  "defectsByMonth": {
    "2025-07": 2,
    "2025-08": 4,
    "2025-09": 3,
    "2025-10": 3
  },
  "defects": [
    {
      "breakdownId": "BD-2025-00145",
      "type": "Engine Issues",
      "date": "2025-10-05T14:30:00.000Z",
      "severity": "AMBER",
      "status": "active",
      "location": "Newcastle City Centre",
      "resolved": false
    }
    // ... more defects
  ],
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Use Cases:**
- Vehicle maintenance history
- Identify chronic problem vehicles
- Support vehicle retirement decisions

---

### 8. Maintenance Notifications

**Endpoint:** `POST /api/defects/notifications/maintenance`

**Description:** Sends notification to maintenance team about defects or issues requiring attention.

**Request Body:**
```json
{
  "type": "general" | "urgent" | "scheduled" | "preventive",
  "priority": "critical" | "high" | "normal" | "low",
  "vehicles": ["6335", "6340"],
  "message": "Engine issues detected on multiple vehicles - urgent inspection required",
  "depot": "Washington",
  "notifyEngineering": true,
  "notifyManagement": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance notification sent successfully",
  "notification": {
    "id": "MAINT-NOTIF-1728209400000",
    "type": "urgent",
    "priority": "high",
    "vehicles": ["6335", "6340"],
    "message": "Engine issues detected on multiple vehicles - urgent inspection required",
    "depot": "Washington",
    "notifyEngineering": true,
    "notifyManagement": false,
    "sentBy": "Anthony Gair",
    "sentAt": "2025-10-06T10:00:00.000Z"
  },
  "recipients": {
    "engineering": true,
    "management": false,
    "depot": "Washington"
  },
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

**Notification Types:**
- `general`: Routine notifications
- `urgent`: Immediate attention required
- `scheduled`: Planned maintenance reminders
- `preventive`: Proactive maintenance alerts

**Use Cases:**
- Alert engineering team to issues
- Coordinate maintenance activities
- Document communication trail

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid auth token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

All endpoints are protected by supervisor authentication and general API rate limits:

- **Limit:** 100 operations per 15 minutes per user
- **Response:** `429 Too Many Requests` with retry-after header

---

## Best Practices

### 1. Timeframe Selection
- Use `24h` for real-time monitoring
- Use `7d` for weekly trend analysis
- Use `30d` for monthly reports
- Use `90d` for quarterly reviews

### 2. Defect Prioritization
- Focus on `rising` trends with high priority
- Address `high` priority predictive alerts first
- Monitor vehicles with 3+ defects in 30 days

### 3. Report Generation
- Generate monthly reports for management
- Use predictive alerts for proactive planning
- Track depot statistics for performance reviews

### 4. Escalation Guidelines
- Escalate safety-critical issues immediately (`critical` priority)
- Use `high` priority for repeated failures
- Document all escalations for compliance

---

## Example Workflows

### Workflow 1: Daily Fleet Health Check

```bash
# 1. Check predictive alerts
GET /api/defects/predictive

# 2. Review repeat defects in last 24 hours
POST /api/defects/repeat
Body: { "timeframe": "24h" }

# 3. Check depot statistics
GET /api/defects/depot-stats?timeframe=24h
```

### Workflow 2: Monthly Management Report

```bash
# 1. Generate comprehensive report
POST /api/defects/report
Body: {
  "timeframe": "30d",
  "includeRepeatDefects": true,
  "includeTrends": true,
  "includeDepotStats": true,
  "includePredictive": true
}

# 2. Analyze trends
POST /api/defects/trends
Body: { "timeframe": "30d" }

# 3. Review depot performance
GET /api/defects/depot-stats?timeframe=30d
```

### Workflow 3: Investigate Problem Vehicle

```bash
# 1. Get vehicle defect history
GET /api/defects/vehicle/6335

# 2. Check if part of broader trend
POST /api/defects/trends
Body: { "timeframe": "30d" }

# 3. Escalate if needed
POST /api/defects/escalate
Body: {
  "fleetNumber": "6335",
  "priority": "high",
  "recipient": "engineering.manager@gonortheast.co.uk"
}
```

---

## Support

For API support or feature requests, contact:
- **Developer:** Anthony Gair
- **Email:** anthony.gair@gonortheast.co.uk
- **Documentation:** https://breakdown-guide.onrender.com/

---

**Last Updated:** October 6, 2025
**API Version:** 1.0.0
**Environment:** Production
