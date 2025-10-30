# Defect Intelligence WebSocket Channel

Real-time broadcast system for defect patterns, trends, and predictive maintenance alerts.

## Overview

The defect intelligence WebSocket channel provides real-time notifications for:
- Repeat defects on vehicles
- Trending defect types across the fleet
- Critical patterns (fleet-wide issues, depot spikes)
- Depot-level statistics
- Predictive maintenance alerts
- Defect escalations

## Connection

### Public Channel (No Authentication Required)

```javascript
const ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');

ws.onopen = () => {
  console.log('Connected to defect intelligence channel');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleDefectIntelligenceEvent(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from defect intelligence channel');
};
```

## Event Types

### 1. NEW_REPEAT_DEFECT

Triggered when a vehicle shows 3+ defects in the analyzed timeframe.

**Broadcast Conditions:**
- Vehicle has 3 or more defects
- Triggered by `/api/defects/repeat` endpoint

**Event Structure:**
```json
{
  "type": "NEW_REPEAT_DEFECT",
  "data": {
    "fleetNumber": "6348",
    "defectCount": 4,
    "severity": "2.5",
    "depot": "Washington",
    "defects": [
      {
        "breakdownId": "BD-2025-00123",
        "type": "Engine Issue",
        "date": "2025-10-06T10:30:00Z",
        "severity": "AMBER",
        "severityScore": 2,
        "resolved": false,
        "status": "active",
        "location": "A1(M) Northbound",
        "description": "Engine overheating"
      }
    ],
    "registration": "NK65 ABC",
    "vehicleType": "Streetdeck",
    "unresolvedCount": 2
  },
  "priority": "high",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Priority Levels:**
- `critical`: 5+ defects
- `high`: 3-4 defects
- `medium`: 2 defects

---

### 2. TREND_UPDATE

Triggered when a defect type shows a rising trend (3+ occurrences).

**Broadcast Conditions:**
- Trend is "rising"
- Current count >= 3
- Triggered by `/api/defects/trends` endpoint

**Event Structure:**
```json
{
  "type": "TREND_UPDATE",
  "data": {
    "defectType": "Electrical System Fault",
    "count": 8,
    "trend": "rising",
    "changePercent": 60.0,
    "previousCount": 5,
    "affectedModels": ["Streetdeck", "Streetlite"]
  },
  "priority": "high",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Trend Types:**
- `rising`: >15% increase
- `falling`: >15% decrease
- `stable`: Within ±15%

---

### 3. CRITICAL_PATTERN

Triggered when critical patterns are detected across the fleet.

**Pattern Detection Rules:**

**Pattern 1: Fleet-Wide Issue**
- Same defect type on 5+ vehicles in 24 hours
- Indicates potential systemic problem

**Pattern 2: Repeat Vehicle Failures**
- Same vehicle with 3+ breakdowns in 24 hours
- Requires immediate maintenance

**Pattern 3: Depot Defect Spike**
- Depot defect rate increases >25% from previous 24h period
- Minimum 5 current defects required

**Event Structure:**
```json
{
  "type": "CRITICAL_PATTERN",
  "data": {
    "defectType": "Brake System Failure",
    "count": 6,
    "timeframe": "24h"
  },
  "message": "Brake System Failure affecting 6 vehicles in last 24 hours - potential fleet-wide issue",
  "priority": "critical",
  "affectedVehicles": ["6348", "6349", "6350", "6351", "6352", "6353"],
  "timestamp": "2025-10-06T14:30:00Z"
}
```

---

### 4. DEPOT_STATS_UPDATE

Triggered when depot statistics show concerning trends.

**Broadcast Conditions:**
- Depot has rising trend OR defect rate > 15%
- Triggered by `/api/defects/depot-stats` endpoint

**Event Structure:**
```json
{
  "type": "DEPOT_STATS_UPDATE",
  "data": {
    "depotName": "Washington",
    "defectCount": 25,
    "defectRate": 18.5,
    "trend": "rising",
    "topIssue": "Engine Issues",
    "topIssueCount": 8,
    "vehicleCount": 200,
    "averageSeverity": 2.3
  },
  "priority": "high",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Defect Rate Calculation:**
```
defectRate = (defectCount / vehicleCount) * 100
```

---

### 5. PREDICTIVE_ALERT

Triggered by AI-generated predictive maintenance recommendations.

**Broadcast Conditions:**
- Alert priority is "high" or "medium"
- Triggered by `/api/defects/predictive` endpoint

**Event Structure:**
```json
{
  "type": "PREDICTIVE_ALERT",
  "data": {
    "alertType": "maintenance",
    "message": "Vehicle 6348 has 4 defects in 30 days - schedule preventive maintenance",
    "vehicles": ["6348"],
    "defectType": null,
    "affectedCount": 1,
    "recommendation": "Schedule comprehensive inspection and preventive maintenance",
    "estimatedCost": "Medium-High"
  },
  "priority": "high",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Alert Types:**
- `maintenance`: Vehicle needs preventive maintenance
- `pattern`: Recurring defect pattern detected
- `weather`: Weather-related defect cluster

---

### 6. DEFECT_ESCALATED

Triggered when defects are escalated to management.

**Broadcast Conditions:**
- Defect escalation is sent via `/api/defects/escalate` endpoint

**Event Structure:**
```json
{
  "type": "DEFECT_ESCALATED",
  "data": {
    "vehicleId": "6348",
    "defectCount": 4,
    "recipient": "fleet.manager@goahead.com",
    "priority": "critical",
    "escalatedBy": "John Smith (AG003)",
    "message": "Urgent: Vehicle requires immediate attention"
  },
  "priority": "critical",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

---

## Frontend Integration Examples

### React Hook for Defect Intelligence

```javascript
import { useEffect, useState } from 'react';

export const useDefectIntelligence = () => {
  const [events, setEvents] = useState([]);
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket(
      'wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence'
    );

    websocket.onopen = () => {
      console.log('✅ Connected to defect intelligence');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Ignore connection acknowledgment
      if (message.type === 'connected') return;

      // Add event to history
      setEvents(prev => [message, ...prev].slice(0, 50)); // Keep last 50 events

      // Handle specific event types
      handleDefectEvent(message);
    };

    websocket.onclose = () => {
      console.log('❌ Disconnected from defect intelligence');
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const handleDefectEvent = (message) => {
    switch (message.type) {
      case 'NEW_REPEAT_DEFECT':
        showNotification(`Repeat defect: Vehicle ${message.data.fleetNumber}`, 'warning');
        break;
      case 'CRITICAL_PATTERN':
        showNotification(message.message, 'error');
        break;
      case 'TREND_UPDATE':
        if (message.priority === 'high') {
          showNotification(`Rising trend: ${message.data.defectType}`, 'warning');
        }
        break;
      case 'PREDICTIVE_ALERT':
        showNotification(message.data.message, 'info');
        break;
      default:
        console.log('Defect intelligence event:', message);
    }
  };

  const showNotification = (message, severity) => {
    // Integrate with your notification system
    console.log(`[${severity.toUpperCase()}] ${message}`);
  };

  return {
    events,
    connected,
    ws
  };
};
```

### Vue.js Composition API Example

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useDefectIntelligence() {
  const events = ref([]);
  const connected = ref(false);
  let ws = null;

  const connect = () => {
    ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');

    ws.onopen = () => {
      connected.value = true;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== 'connected') {
        events.value.unshift(message);
        // Keep only last 50 events
        if (events.value.length > 50) events.value.pop();
      }
    };

    ws.onclose = () => {
      connected.value = false;
    };
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    if (ws) ws.close();
  });

  return {
    events,
    connected
  };
}
```

### Plain JavaScript Dashboard Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Defect Intelligence Dashboard</title>
  <style>
    .event { padding: 10px; margin: 5px; border-left: 4px solid #ccc; }
    .event.critical { border-color: #f44336; background: #ffebee; }
    .event.high { border-color: #ff9800; background: #fff3e0; }
    .event.medium { border-color: #2196f3; background: #e3f2fd; }
  </style>
</head>
<body>
  <h1>Defect Intelligence Feed</h1>
  <div id="connection-status">Connecting...</div>
  <div id="events"></div>

  <script>
    const eventsContainer = document.getElementById('events');
    const statusDiv = document.getElementById('connection-status');

    const ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');

    ws.onopen = () => {
      statusDiv.textContent = '✅ Connected';
      statusDiv.style.color = 'green';
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'connected') return;

      const eventDiv = document.createElement('div');
      eventDiv.className = `event ${message.priority || 'medium'}`;
      eventDiv.innerHTML = `
        <strong>${message.type}</strong> - ${message.priority || 'normal'}<br>
        <small>${new Date(message.timestamp).toLocaleString()}</small><br>
        ${formatEventData(message)}
      `;

      eventsContainer.insertBefore(eventDiv, eventsContainer.firstChild);

      // Keep only last 20 events
      while (eventsContainer.children.length > 20) {
        eventsContainer.removeChild(eventsContainer.lastChild);
      }
    };

    ws.onclose = () => {
      statusDiv.textContent = '❌ Disconnected';
      statusDiv.style.color = 'red';
    };

    function formatEventData(message) {
      switch (message.type) {
        case 'NEW_REPEAT_DEFECT':
          return `Vehicle ${message.data.fleetNumber}: ${message.data.defectCount} defects`;
        case 'CRITICAL_PATTERN':
          return message.message;
        case 'TREND_UPDATE':
          return `${message.data.defectType}: ${message.data.count} occurrences (${message.data.trend})`;
        case 'PREDICTIVE_ALERT':
          return message.data.message;
        default:
          return JSON.stringify(message.data);
      }
    }
  </script>
</body>
</html>
```

## API Endpoints That Trigger Broadcasts

| Endpoint | Event Type | Trigger Condition |
|----------|-----------|-------------------|
| `POST /api/defects/repeat` | `NEW_REPEAT_DEFECT` | Vehicle with 3+ defects |
| `POST /api/defects/trends` | `TREND_UPDATE` | Rising trend with 3+ occurrences |
| `GET /api/defects/depot-stats` | `DEPOT_STATS_UPDATE` | Rising trend or >15% defect rate |
| `GET /api/defects/predictive` | `PREDICTIVE_ALERT` | High/medium priority alerts |
| `POST /api/defects/escalate` | `DEFECT_ESCALATED` | Any escalation |
| `POST /api/breakdowns` | `CRITICAL_PATTERN` | Pattern detection rules met |
| `POST /api/breakdowns/from-wizard` | `CRITICAL_PATTERN` | Pattern detection rules met |

## Testing

### Manual Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to defect intelligence channel
wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"

# You should receive a connection confirmation:
# < {"type":"connected","clientId":"client_...","channel":"defect-intelligence",...}

# Trigger events by calling API endpoints in another terminal
curl -X POST https://breakdown-guide.onrender.com/api/defects/repeat \
  -H "Content-Type: application/json" \
  -d '{"timeframe":"24h"}'
```

### Automated Testing

```javascript
// test/defect-intelligence-websocket.test.js
import { WebSocket } from 'ws';
import { expect } from 'chai';

describe('Defect Intelligence WebSocket', () => {
  let ws;

  beforeEach((done) => {
    ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');
    ws.on('open', done);
  });

  afterEach(() => {
    ws.close();
  });

  it('should connect successfully', (done) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'connected') {
        expect(message.channel).to.equal('defect-intelligence');
        done();
      }
    });
  });

  it('should receive repeat defect events', (done) => {
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'NEW_REPEAT_DEFECT') {
        expect(message.data).to.have.property('fleetNumber');
        expect(message.data).to.have.property('defectCount');
        expect(message.priority).to.be.oneOf(['critical', 'high', 'medium']);
        done();
      }
    });

    // Trigger repeat defect detection
    // (Make API call to create breakdowns)
  });
});
```

## Production Monitoring

### Connection Statistics

Get WebSocket connection stats:

```bash
# Coming soon: GET /api/websocket/stats endpoint
```

### Event Rate Monitoring

Monitor broadcast rates in server logs:

```
📡 Broadcasted NEW_REPEAT_DEFECT to defect-intelligence: 3 clients
🚨 Critical pattern detected: Engine Issues on 6 vehicles
📡 Broadcasted CRITICAL_PATTERN to defect-intelligence: 3 clients
```

## Security Notes

- **Public Channel**: No authentication required (designed for dashboards)
- **Read-Only**: Clients can only receive events, not send commands
- **Rate Limiting**: Server-side rate limiting on broadcast frequency
- **Data Filtering**: Sensitive information (email addresses, personal data) not included

## Troubleshooting

### Connection Issues

**Problem**: WebSocket won't connect

**Solutions**:
1. Check URL format: `wss://` (not `ws://` in production)
2. Verify channel parameter: `?channel=defect-intelligence`
3. Check firewall/proxy settings
4. Test with wscat: `wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"`

### No Events Received

**Problem**: Connected but not receiving events

**Possible Causes**:
1. No defects meeting broadcast criteria
2. WebSocket handler not initialized
3. Channel name mismatch

**Debug Steps**:
```javascript
ws.onmessage = (event) => {
  console.log('Raw message:', event.data);
  const message = JSON.parse(event.data);
  console.log('Parsed message:', message);
};
```

### Reconnection Strategy

Implement automatic reconnection:

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  const ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');

  ws.onopen = () => {
    reconnectAttempts = 0;
    console.log('Connected');
  };

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(connect, delay);
    }
  };

  return ws;
}

const ws = connect();
```

## Performance Considerations

- **Event Buffering**: Events are not buffered - clients only receive events after connection
- **Historical Data**: Use REST API endpoints to get historical defect data
- **Bandwidth**: Average event size: 200-500 bytes
- **Frequency**: Varies based on fleet activity (typically 1-10 events/minute during peak hours)

## Support

For issues or questions:
- Check server logs for broadcast confirmations
- Review API endpoint documentation
- Test connection with wscat
- Contact: anthony.gair@goahead.com
