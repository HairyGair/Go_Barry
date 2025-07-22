# Enhanced Route Matching Implementation Guide

## Overview
We've implemented advanced route matching with confidence scoring, multi-modal detection, and time-based filtering for the Go BARRY incident management system.

## New Features

### 1. Confidence Scoring System
Each route match now includes a confidence score (0-1) based on:
- **Distance** (40 points max): How close the incident is to the route
  - 0-50m: 40 points (very high confidence)
  - 50-100m: 30 points (high confidence)
  - 100-200m: 20 points (medium confidence)
  - 200-300m: 10 points (low confidence)
  
- **Match Type** (30 points max):
  - Direct GPS match: 30 points
  - Stop proximity: 25 points
  - Shape proximity: 20 points
  - Regional match: 10 points
  
- **Location Name** (20 points): If location text matches route
- **Time Relevance** (10 points): If route is active at incident time

### 2. Multi-Modal Impact Detection
Automatically detects when incidents affect:
- **Metro Stations**: Monument, Haymarket, Central Station, Gateshead, etc.
- **Ferry Terminals**: North Shields ↔ South Shields
- **Major Interchanges**: Eldon Square, Gateshead Interchange, Park Lane
- **Cascading Effects**: Shows all routes affected by multi-modal disruptions

### 3. Time-Based Route Filtering
Routes are filtered based on:
- **Service Type**: Weekday, Saturday, Sunday
- **Time Period**: Peak hours, night service, school times
- **Route Categories**:
  - 24/7 routes (1, 2, 56)
  - Peak only (X-prefixed routes)
  - School services (265, 267, etc.)
  - Night services (N21, N56, etc.)

## API Endpoints

### Enhanced Route Matching
```bash
POST /api/routes/match-enhanced
{
  "lat": 54.973556,
  "lng": -1.612778,
  "location": "Monument Metro Station",
  "radius": 300,
  "timestamp": "2024-12-27T08:30:00Z",
  "includeInactive": false
}
```

Response includes:
- Route matches with confidence scores
- Multi-modal impacts
- Service context (peak/off-peak)

### Multi-Modal Impact Check
```bash
GET /api/routes/multi-modal-impacts?lat=54.973556&lng=-1.612778&radius=500
```

### Active Routes by Time
```bash
GET /api/routes/active?timestamp=2024-12-27T08:30:00Z
```

## Frontend Integration

### 1. Import the Display Component
```javascript
import RouteConfidenceDisplay from './RouteConfidenceDisplay';

// In your incident display:
<RouteConfidenceDisplay 
  routeMatching={incident.routeMatching}
  multiModalImpacts={incident.multiModalImpacts}
/>
```

### 2. Visual Features
- **Color-coded confidence bars**:
  - Green (90%+): Very high confidence
  - Blue (70-89%): High confidence
  - Orange (50-69%): Medium confidence
  - Red (<50%): Low confidence

- **Icons indicate match type**:
  - GPS pin: Direct match
  - Bus: Near stop
  - Timeline: Near route shape
  - Landscape: Regional match
  - Hub: Cascading from interchange

- **Multi-modal warnings**: Yellow alert box shows affected stations/terminals

## Backend Integration

### 1. Register the Route API
In `/backend/index.js`:
```javascript
import enhancedRouteAPI from './routes/enhancedRouteAPI.js';
app.use('/api/routes', enhancedRouteAPI);
```

### 2. Enhance Incidents Automatically
In your incident creation/update code:
```javascript
import { enhanceIncidentWithRouteConfidence } from './services/incidentEnhancementService.js';

// After creating/updating an incident:
const enhancedIncident = await enhanceIncidentWithRouteConfidence(incident);
```

### 3. Use in TomTom Service
Update the TomTom service to use enhanced matching:
```javascript
import { enhancedRouteMatchWithConfidence } from './services/enhancedRouteConfidence.js';

// Replace basic route matching with:
const routeResults = await enhancedRouteMatchWithConfidence(
  lat, lng, location, { radius: 300 }
);
const affectedRoutes = routeResults.matches
  .filter(m => m.confidence >= 0.7)
  .map(m => m.route);
```

## Example Usage Scenarios

### 1. Metro Station Incident
Location: Monument Metro Station
- High confidence: Q3, Q3X, 1, 2, 22, 40
- Multi-modal impact: Yellow & Green lines affected
- Cascading routes automatically detected

### 2. A1 Motorway Incident
Location: A1 near Angel of the North
- High confidence: 21, X21, 25
- Medium confidence: 28, 28B
- No multi-modal impact

### 3. Peak Hour Filtering
Time: 08:30 AM Weekday
- Shows only routes active during morning peak
- Includes X-services (express routes)
- Excludes night services

## Benefits

1. **Accuracy**: Routes matched with 70%+ confidence are very likely affected
2. **Context**: Multi-modal impacts show wider network effects
3. **Timing**: Only shows routes actually running at incident time
4. **Transparency**: Supervisors see why routes were matched
5. **Prioritization**: High-confidence routes can be prioritized for alerts

## Testing

Use the test endpoint to verify functionality:
```bash
POST /api/routes/test-confidence
```

This runs predefined test scenarios and shows confidence scoring in action.

## Performance Considerations

- Route matching is cached for 15 minutes
- Active route lists are cached for 1 hour
- Multi-modal data is static (no API calls needed)
- Typical response time: <100ms

## Future Enhancements

1. **Historical Confidence**: Learn from supervisor corrections
2. **Weather Integration**: Adjust confidence based on conditions
3. **Passenger Numbers**: Weight routes by typical ridership
4. **Real-time GPS**: Use live bus positions for validation
