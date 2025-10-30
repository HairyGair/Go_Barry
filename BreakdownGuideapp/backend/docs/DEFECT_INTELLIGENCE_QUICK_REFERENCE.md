# Defect Intelligence WebSocket - Quick Reference Card

## Connection

```javascript
const ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');
```

## Event Types (6 Total)

| Event Type | Trigger | Priority |
|------------|---------|----------|
| `NEW_REPEAT_DEFECT` | Vehicle with 3+ defects | high/critical |
| `TREND_UPDATE` | Rising trend (3+ occurrences) | high |
| `CRITICAL_PATTERN` | Fleet-wide issue detected | critical/high |
| `DEPOT_STATS_UPDATE` | Depot with rising trend/high rate | high/medium |
| `PREDICTIVE_ALERT` | AI maintenance recommendation | high/medium |
| `DEFECT_ESCALATED` | Escalation to management | critical/high |

## Pattern Detection Rules

**Fleet-Wide Issue**: Same defect on 5+ vehicles in 24h
**Repeat Failures**: Same vehicle with 3+ breakdowns in 24h
**Depot Spike**: >25% increase in defect rate vs previous 24h (min 5 defects)

## Basic Integration

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch(msg.type) {
    case 'NEW_REPEAT_DEFECT':
      alert(`Vehicle ${msg.data.fleetNumber}: ${msg.data.defectCount} defects`);
      break;
    case 'CRITICAL_PATTERN':
      alert(`CRITICAL: ${msg.message}`);
      break;
    case 'TREND_UPDATE':
      console.log(`Trending: ${msg.data.defectType} - ${msg.data.trend}`);
      break;
  }
};
```

## Testing with wscat

```bash
npm install -g wscat
wscat -c "wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence"
```

## Broadcast Trigger Endpoints

- `POST /api/defects/repeat` → NEW_REPEAT_DEFECT
- `POST /api/defects/trends` → TREND_UPDATE
- `GET /api/defects/depot-stats` → DEPOT_STATS_UPDATE
- `GET /api/defects/predictive` → PREDICTIVE_ALERT
- `POST /api/defects/escalate` → DEFECT_ESCALATED
- `POST /api/breakdowns/*` → CRITICAL_PATTERN

## Common Event Structure

```javascript
{
  "type": "EVENT_TYPE",
  "data": { /* event-specific data */ },
  "priority": "critical" | "high" | "medium" | "low",
  "timestamp": "2025-10-06T14:30:00Z"
}
```

## Priority Levels

- **critical**: Immediate action required (fleet-wide issues, 5+ defects)
- **high**: Urgent attention needed (3-4 defects, rising trends)
- **medium**: Monitor closely (2 defects, stable trends)
- **low**: Informational (weather alerts)

## Backend Broadcast Methods

```javascript
import webSocketHandler from './routes/webSocketHandler.js';

// Broadcast repeat defect
webSocketHandler.broadcastRepeatDefect(vehicleData);

// Broadcast trend update
webSocketHandler.broadcastTrendUpdate(trendData);

// Broadcast critical pattern
webSocketHandler.broadcastCriticalPattern(patternData);

// Broadcast depot stats
webSocketHandler.broadcastDepotStats(depotData);

// Broadcast predictive alert
webSocketHandler.broadcastPredictiveAlert(alertData);

// Broadcast escalation
webSocketHandler.broadcastDefectEscalation(escalationData);
```

## Error Handling

All broadcasts are non-blocking and wrapped in try-catch:

```javascript
try {
  webSocketHandler.broadcastRepeatDefect(vehicleData);
} catch (error) {
  console.error('⚠️ Broadcast failed:', error);
  // Main operation continues
}
```

## Reconnection Example

```javascript
let ws;

function connect() {
  ws = new WebSocket('wss://breakdown-guide.onrender.com/ws?channel=defect-intelligence');

  ws.onclose = () => {
    setTimeout(connect, 5000); // Reconnect after 5s
  };
}

connect();
```

## Full Documentation

See: `/backend/docs/DEFECT_INTELLIGENCE_WEBSOCKET.md`

## Support

Contact: anthony.gair@goahead.com
