# Fleet Intelligence / Defects API - Quick Reference

**Base URL:** `https://breakdown-guide.onrender.com`
**Auth:** All endpoints require `Authorization: Bearer YOUR_TOKEN`

---

## Endpoints At-a-Glance

| Endpoint | Method | Purpose | Key Parameters |
|----------|--------|---------|----------------|
| `/api/defects/repeat` | POST | Find vehicles with repeat defects | `timeframe: "7d"` |
| `/api/defects/trends` | POST | Analyze trending defect types | `timeframe, groupByType` |
| `/api/defects/depot-stats` | GET | Depot defect statistics | `?timeframe=7d` |
| `/api/defects/predictive` | GET | AI maintenance alerts | None |
| `/api/defects/escalate` | POST | Escalate critical defects | `vehicleId, recipient` |
| `/api/defects/report` | POST | Generate defect report | `timeframe, sections` |
| `/api/defects/vehicle/:fleet` | GET | Vehicle defect history | `?limit=50` |
| `/api/defects/notifications/maintenance` | POST | Notify maintenance team | `type, priority` |

---

## Common Request Examples

### 1. Repeat Defects (Last 7 Days)

```bash
curl -X POST https://breakdown-guide.onrender.com/api/defects/repeat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"7d"}'
```

### 2. Trending Defects

```bash
curl -X POST https://breakdown-guide.onrender.com/api/defects/trends \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"30d","groupByType":true}'
```

### 3. Depot Statistics

```bash
curl -X GET "https://breakdown-guide.onrender.com/api/defects/depot-stats?timeframe=7d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Predictive Alerts

```bash
curl -X GET https://breakdown-guide.onrender.com/api/defects/predictive \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Escalate Defect

```bash
curl -X POST https://breakdown-guide.onrender.com/api/defects/escalate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fleetNumber": "6335",
    "defects": [{"type":"Engine Issues","severity":"STOP"}],
    "recipient": "manager@gonortheast.co.uk",
    "priority": "critical",
    "message": "Critical engine failure"
  }'
```

### 6. Generate Report

```bash
curl -X POST https://breakdown-guide.onrender.com/api/defects/report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timeframe": "30d",
    "includeRepeatDefects": true,
    "includeTrends": true,
    "includeDepotStats": true,
    "includePredictive": true
  }'
```

### 7. Vehicle History

```bash
curl -X GET "https://breakdown-guide.onrender.com/api/defects/vehicle/6335?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Maintenance Notification

```bash
curl -X POST https://breakdown-guide.onrender.com/api/defects/notifications/maintenance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "urgent",
    "priority": "high",
    "vehicles": ["6335"],
    "message": "Engine inspection required",
    "depot": "Washington"
  }'
```

---

## Response Formats

### Success Response

```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "timestamp": "2025-10-06T10:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error (development only)"
}
```

---

## Common Parameters

### Timeframe Options
- `"24h"` - Last 24 hours
- `"7d"` - Last 7 days (default for most endpoints)
- `"30d"` - Last 30 days
- `"90d"` - Last 90 days

### Priority Levels
- `"critical"` - Immediate safety concern
- `"high"` - Urgent action required
- `"medium"` - Timely action needed (default)
- `"low"` - For awareness

### Notification Types
- `"general"` - Routine notifications
- `"urgent"` - Immediate attention
- `"scheduled"` - Planned maintenance
- `"preventive"` - Proactive maintenance

---

## JavaScript Examples

### Fetch API (Browser)

```javascript
// Get predictive alerts
async function getPredictiveAlerts() {
  const response = await fetch('https://breakdown-guide.onrender.com/api/defects/predictive', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });

  const data = await response.json();
  return data.alerts;
}

// Analyze repeat defects
async function getRepeatDefects(timeframe = '7d') {
  const response = await fetch('https://breakdown-guide.onrender.com/api/defects/repeat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timeframe })
  });

  const data = await response.json();
  return data.vehicles;
}
```

### Axios (Node.js)

```javascript
import axios from 'axios';

const API_URL = 'https://breakdown-guide.onrender.com';
const authToken = 'YOUR_TOKEN';

// Get depot statistics
async function getDepotStats(timeframe = '7d') {
  const { data } = await axios.get(`${API_URL}/api/defects/depot-stats`, {
    params: { timeframe },
    headers: { Authorization: `Bearer ${authToken}` }
  });

  return data.depots;
}

// Generate report
async function generateReport(options) {
  const { data } = await axios.post(`${API_URL}/api/defects/report`, options, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  return data.report;
}
```

---

## Workflow Templates

### Daily Fleet Health Check

```javascript
// Morning routine for supervisors
async function dailyHealthCheck() {
  // 1. Check predictive alerts
  const alerts = await fetch('/api/defects/predictive', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  // 2. Review repeat defects (last 24h)
  const repeatDefects = await fetch('/api/defects/repeat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timeframe: '24h' })
  }).then(r => r.json());

  // 3. Get depot stats
  const depotStats = await fetch('/api/defects/depot-stats?timeframe=24h', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  return { alerts, repeatDefects, depotStats };
}
```

### Weekly Management Report

```javascript
// Weekly report for engineering managers
async function weeklyReport() {
  const report = await fetch('/api/defects/report', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeframe: '7d',
      includeRepeatDefects: true,
      includeTrends: true,
      includeDepotStats: true,
      includePredictive: true
    })
  }).then(r => r.json());

  return report;
}
```

### Vehicle Investigation

```javascript
// Investigate problem vehicle
async function investigateVehicle(fleetNumber) {
  // 1. Get vehicle history
  const history = await fetch(`/api/defects/vehicle/${fleetNumber}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  // 2. Check if part of broader trend
  const trends = await fetch('/api/defects/trends', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timeframe: '30d' })
  }).then(r => r.json());

  // 3. Escalate if critical
  if (history.totalDefects >= 3) {
    await fetch('/api/defects/escalate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fleetNumber,
        priority: 'high',
        recipient: 'engineering.manager@gonortheast.co.uk',
        message: `Vehicle ${fleetNumber} has ${history.totalDefects} defects in 30 days`
      })
    });
  }

  return { history, trends };
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Refresh auth token |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify endpoint URL |
| 429 | Rate Limited | Wait and retry after cooldown |
| 500 | Server Error | Contact support |

---

## Testing

### Local Development

```bash
# Start backend server
cd backend
npm run dev

# Test with curl
curl http://localhost:3001/api/defects/predictive \
  -H "Authorization: Bearer YOUR_DEV_TOKEN"

# Run test suite
node routes/test-defects.js
```

### Production Testing

```bash
# Health check
curl https://breakdown-guide.onrender.com/health

# Test defects endpoint
curl https://breakdown-guide.onrender.com/api/defects/predictive \
  -H "Authorization: Bearer YOUR_PROD_TOKEN"
```

---

## Rate Limits

- **Limit:** 100 operations per 15 minutes per user
- **Headers:** Check `X-RateLimit-Remaining` header
- **Exceeded:** Returns `429 Too Many Requests`
- **Reset:** Wait for `Retry-After` seconds

---

## Support

- **Documentation:** `/backend/routes/DEFECTS_API.md`
- **Test Suite:** `/backend/routes/test-defects.js`
- **System README:** `/FLEET_INTELLIGENCE_README.md`
- **Email:** anthony.gair@gonortheast.co.uk

---

**Version:** 1.0.0
**Last Updated:** October 6, 2025
**Production URL:** https://breakdown-guide.onrender.com
