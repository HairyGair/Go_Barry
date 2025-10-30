# WebSocket Message Reference - Defect Intelligence Channel

## Quick Reference for Backend Developers

This document provides the exact message formats that the TrendsDefectsPanel component expects to receive via WebSocket.

---

## Connection Details

- **Channel**: `defect-intelligence`
- **WebSocket Endpoint**: `/ws?channel=defect-intelligence`
- **Component**: `TrendsDefectsPanel` (SDC Dashboard)
- **Protocol**: JSON messages

---

## Message Types

### 1. NEW_REPEAT_DEFECT

**When to Send**: When a vehicle has repeated the same or similar defect within the monitoring timeframe.

**Required Fields**:
```json
{
  "type": "NEW_REPEAT_DEFECT",
  "data": {
    "fleet_number": "6377",
    "depot": "Washington",
    "defect_count": 5,
    "top_issue": "Engine malfunction",
    "last_defect": "2 hours ago",
    "pattern_score": 87
  },
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Field Descriptions**:
- `fleet_number` (string): Vehicle fleet number
- `depot` (string): Depot name (Washington, Riverside, Consett, Deptford, Percy Main, Hexham)
- `defect_count` (number): Total defects in timeframe (triggers escalation button if >= 3)
- `top_issue` (string): Most common defect type
- `last_defect` (string): Human-readable time since last defect
- `pattern_score` (number): 0-100 score indicating pattern confidence

**Frontend Behavior**:
- Adds/updates vehicle in "Critical Vehicles" section
- Shows green "LIVE" badge for 10 seconds
- Pulses card with green border for 6 seconds
- Prevents duplicate entries by fleet number

---

### 2. TREND_UPDATE

**When to Send**: When trending issue statistics change significantly.

**Required Fields**:
```json
{
  "type": "TREND_UPDATE",
  "data": {
    "issue_type": "Engine malfunction",
    "occurrences": 28,
    "vehicles_affected": 15,
    "trend": "up",
    "change_percentage": 23,
    "top_depots": ["Washington", "Riverside", "Deptford"]
  },
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Field Descriptions**:
- `issue_type` (string): Defect category/type
- `occurrences` (number): Total occurrences in timeframe
- `vehicles_affected` (number): Unique vehicles with this issue
- `trend` (string): "up" or "down"
- `change_percentage` (number): Percentage change from previous period
- `top_depots` (array): Array of depot names most affected (max 3-5)

**Frontend Behavior**:
- Updates/adds trending issue card
- Automatically sorted by occurrence count
- Shows "LIVE" badge for 10 seconds
- Updates progress bar width
- Color codes trend arrows (red=up, green=down)

---

### 3. CRITICAL_PATTERN

**When to Send**: When AI/pattern detection identifies an urgent issue requiring immediate attention.

**Required Fields**:
```json
{
  "type": "CRITICAL_PATTERN",
  "data": {
    "title": "Critical Pattern Detected",
    "message": "Multiple engine failures in Washington depot - 5 vehicles affected in last 2 hours",
    "priority": "high"
  },
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Field Descriptions**:
- `title` (string): Alert title (short, 3-5 words)
- `message` (string): Detailed description of the pattern
- `priority` (string): "high" or "medium" (affects icon: 🚨 vs ⚠️)

**Frontend Behavior**:
- Shows notification banner at top-right
- Auto-dismisses after 10 seconds
- Triggers full data refresh
- Plays pulse animation on banner
- User can manually dismiss

**Use Cases**:
- Multiple related defects in short timeframe
- Unusual spike in specific defect type
- Cross-depot pattern detected
- Safety-critical issue identified

---

### 4. DEPOT_STATS_UPDATE

**When to Send**: When depot-level statistics change (e.g., new defect logged, vehicle repaired).

**Required Fields**:
```json
{
  "type": "DEPOT_STATS_UPDATE",
  "data": {
    "depot_id": "WH",
    "depot_name": "Washington",
    "defect_rate": 18.5,
    "total_defects": 45,
    "fleet_size": 243,
    "repeat_vehicles": 8,
    "top_issue": "Engine malfunction"
  },
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Field Descriptions**:
- `depot_id` (string): 2-letter depot code (WH, RV, CS, DP, PM, HX)
- `depot_name` (string): Full depot name
- `defect_rate` (number): Percentage (total_defects / fleet_size * 100)
- `total_defects` (number): Total defects in timeframe
- `fleet_size` (number): Total vehicles at depot
- `repeat_vehicles` (number): Vehicles with repeat defects
- `top_issue` (string): Most common defect at this depot

**Frontend Behavior**:
- Updates depot card in "Depot Hotspots" section
- Color-codes severity (>15% red, >10% orange, else green)
- Shows "LIVE" badge for 10 seconds
- Updates progress bar
- Maintains depot ordering

**Depot Codes**:
- WH = Washington
- RV = Riverside
- CS = Consett
- DP = Deptford
- PM = Percy Main
- HX = Hexham

---

### 5. PREDICTIVE_ALERT

**When to Send**: When predictive maintenance algorithm identifies potential future failures.

**Required Fields**:
```json
{
  "type": "PREDICTIVE_ALERT",
  "data": {
    "priority": "high",
    "prediction_type": "Engine Failure Risk",
    "vehicles_affected": 6,
    "confidence_score": 89,
    "description": "Pattern analysis indicates high probability of engine failure in the next 7-14 days based on repeat malfunction codes.",
    "vehicle_list": ["6377", "6084", "6312", "6156", "6245", "6098"],
    "recommendation": "Schedule preventive maintenance inspection for all affected vehicles within 48 hours",
    "predicted_timeframe": "7-14 days"
  },
  "timestamp": "2025-10-06T14:30:00Z"
}
```

**Field Descriptions**:
- `priority` (string): "high", "medium", or "low"
- `prediction_type` (string): Short alert title
- `vehicles_affected` (number): Count of affected vehicles
- `confidence_score` (number): 0-100 AI confidence level
- `description` (string): Detailed explanation of the prediction
- `vehicle_list` (array): Array of fleet numbers
- `recommendation` (string): Suggested action to take
- `predicted_timeframe` (string): When issue is expected to occur

**Frontend Behavior**:
- Adds alert to "Predictive Maintenance Alerts" section
- Shows priority icon (🔴 high, 🟡 medium, 🔵 low)
- Displays confidence score badge
- Shows first 5 vehicles, "+X more" for rest
- High priority = shows notification banner
- "LIVE" badge for 10 seconds
- Prevents duplicate alerts

**Priority Guidelines**:
- **High**: Imminent failure (0-7 days), safety-critical, >80% confidence
- **Medium**: Near-term (7-21 days), operational impact, 60-79% confidence
- **Low**: Long-term (21-30 days), maintenance planning, <60% confidence

---

## General Message Format

All messages should follow this structure:

```json
{
  "type": "MESSAGE_TYPE",
  "data": {
    // Event-specific data
  },
  "timestamp": "ISO8601 timestamp"
}
```

**Required Top-Level Fields**:
- `type` (string): One of the 5 message types above
- `data` (object): Event-specific payload
- `timestamp` (string): ISO 8601 timestamp (optional but recommended)

---

## Message Timing Recommendations

### Frequency Guidelines

1. **NEW_REPEAT_DEFECT**: Send immediately when threshold reached
2. **TREND_UPDATE**: Every 5-10 minutes if data changes
3. **CRITICAL_PATTERN**: Immediately when detected (rare)
4. **DEPOT_STATS_UPDATE**: Every 1-2 minutes per depot
5. **PREDICTIVE_ALERT**: When confidence > 70% (once per prediction)

### Debouncing
- Avoid sending duplicate messages within 30 seconds
- Batch updates when possible (e.g., multiple trend updates)
- Critical patterns should override debouncing

---

## Error Handling

### Unknown Message Types
Frontend logs warning but continues operating:
```
[Defect Intelligence] Unknown message type: {type}
```

### Missing Required Fields
Frontend ignores message but logs error in development mode.

### Malformed JSON
Connection manager handles parsing errors automatically.

---

## Testing Messages

### Send Test Message via WebSocket Client

```javascript
// Example using ws library
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3002/ws?channel=defect-intelligence');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'NEW_REPEAT_DEFECT',
    data: {
      fleet_number: '6377',
      depot: 'Washington',
      defect_count: 5,
      top_issue: 'Engine malfunction',
      last_defect: '2 hours ago',
      pattern_score: 87
    },
    timestamp: new Date().toISOString()
  }));
});
```

### Backend Testing Endpoint (Suggested)
Create a test endpoint to trigger messages:

```javascript
POST /api/sdc/defects/test-websocket
Body: {
  "messageType": "NEW_REPEAT_DEFECT",
  "data": { /* message data */ }
}
```

---

## Integration Checklist

### Backend Requirements
- [ ] WebSocket server configured on `/ws` endpoint
- [ ] Channel routing supports `defect-intelligence`
- [ ] Message broadcasting to all connected clients on channel
- [ ] Proper JSON serialization
- [ ] Error handling for connection drops
- [ ] Logging for sent messages

### Data Sources
- [ ] Breakdown database triggers for NEW_REPEAT_DEFECT
- [ ] Analytics pipeline for TREND_UPDATE
- [ ] AI/ML service for CRITICAL_PATTERN
- [ ] Depot statistics aggregation for DEPOT_STATS_UPDATE
- [ ] Predictive model for PREDICTIVE_ALERT

### Monitoring
- [ ] Track message send success rate
- [ ] Monitor client connection count
- [ ] Alert on channel errors
- [ ] Log message frequency by type

---

## Common Scenarios

### Scenario 1: New Vehicle Defect
```javascript
// Vehicle 6377 gets 3rd defect in 7 days
ws.broadcast('defect-intelligence', {
  type: 'NEW_REPEAT_DEFECT',
  data: {
    fleet_number: '6377',
    depot: 'Washington',
    defect_count: 3,
    top_issue: 'Engine malfunction',
    last_defect: '1 hour ago',
    pattern_score: 75
  }
});
```

### Scenario 2: Trending Issue Spike
```javascript
// Engine issues up 25% in last hour
ws.broadcast('defect-intelligence', {
  type: 'TREND_UPDATE',
  data: {
    issue_type: 'Engine malfunction',
    occurrences: 35,
    vehicles_affected: 18,
    trend: 'up',
    change_percentage: 25,
    top_depots: ['Washington', 'Riverside']
  }
});
```

### Scenario 3: Critical Pattern Detected
```javascript
// AI detects cluster of related defects
ws.broadcast('defect-intelligence', {
  type: 'CRITICAL_PATTERN',
  data: {
    title: 'Engine Failure Cluster',
    message: '5 engine failures at Washington in 90 minutes - possible fuel quality issue',
    priority: 'high'
  }
});
```

### Scenario 4: Depot Stats Change
```javascript
// Washington depot defect rate updated
ws.broadcast('defect-intelligence', {
  type: 'DEPOT_STATS_UPDATE',
  data: {
    depot_id: 'WH',
    depot_name: 'Washington',
    defect_rate: 19.8,
    total_defects: 48,
    fleet_size: 243,
    repeat_vehicles: 9,
    top_issue: 'Engine malfunction'
  }
});
```

### Scenario 5: Predictive Alert
```javascript
// ML model predicts failures
ws.broadcast('defect-intelligence', {
  type: 'PREDICTIVE_ALERT',
  data: {
    priority: 'high',
    prediction_type: 'Brake System Failure',
    vehicles_affected: 4,
    confidence_score: 84,
    description: 'Brake wear patterns suggest imminent failure',
    vehicle_list: ['6084', '6125', '6189', '6234'],
    recommendation: 'Immediate brake inspection required',
    predicted_timeframe: '3-5 days'
  }
});
```

---

## Support & Questions

For questions about message formats or integration:
1. Review this document
2. Check `TrendsDefectsPanel.jsx` implementation
3. Test with WebSocket client
4. Review connection manager logs

---

**Document Version**: 1.0
**Last Updated**: October 6, 2025
**Component**: TrendsDefectsPanel (SDC Dashboard)
**WebSocket Channel**: defect-intelligence
