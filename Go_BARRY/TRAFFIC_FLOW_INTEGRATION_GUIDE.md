# Traffic Flow Monitoring Integration Guide

## Overview
This guide shows how to integrate the real-time traffic flow monitoring components into your Go BARRY app.

## Components Created

### 1. **TrafficFlowIndicatorEnhanced**
Beautiful gradient-based flow indicator with animations:
- Live speed display (current vs normal)
- Speed ratio percentage with color coding
- Trend indicators (improving/worsening/stable)
- Expandable history chart
- Pulse animation for critical speeds

### 2. **TrafficHeatMapOverlay**
TomTom map overlay showing traffic congestion:
- Heat map visualization of flow data
- Legend with color coding
- Real-time statistics
- Works with existing TomTom maps

### 3. **NetworkHealthScore**
Animated circular gauge showing overall network health:
- 0-100 score based on average speeds
- Color-coded status (Excellent/Good/Fair/Poor/Critical)
- Live metrics (monitored/critical/congested)
- Compact and full-size variants

### 4. **TrafficFlowDashboard**
Comprehensive dashboard with all flow data:
- Header statistics
- Critical incident cards
- Active flow monitoring list
- Speed history charts
- Auto-clear indicators

### 5. **GlassAlertCard**
Modern glassmorphism-styled alert cards:
- Blur effect on iOS, glass effect on Android
- Severity color coding
- Route pills showing affected buses
- Integrated flow indicators
- Dismiss functionality

### 6. **SkeletonLoaders**
Smooth loading states with shimmer effects:
- Alert card skeletons
- Flow indicator skeletons
- Dashboard skeletons
- Map loading skeleton

## Integration Examples

### 1. Adding Flow Indicators to Alert Lists

```jsx
import GlassAlertCard from './components/GlassAlertCard';
import TrafficFlowIndicatorEnhanced from './components/TrafficFlowIndicatorEnhanced';

// In your alert list component
{alerts.map(alert => (
  <View key={alert.id}>
    <GlassAlertCard 
      alert={alert}
      onPress={handleAlertPress}
      onDismiss={handleDismiss}
    />
    {alert.type === 'incident' && alert.coordinates && (
      <TrafficFlowIndicatorEnhanced
        alertId={alert.id}
        showDetails={false}
      />
    )}
  </View>
))}
```

### 2. Adding Network Health to Dashboard

```jsx
import NetworkHealthScore from './components/NetworkHealthScore';

// In your dashboard header
<View style={styles.header}>
  <NetworkHealthScore compact />
</View>
```

### 3. Adding Heat Map to Existing Maps

```jsx
import TrafficHeatMapOverlay from './components/TrafficHeatMapOverlay';

// In your map component
const mapRef = useRef(null);

<View style={styles.mapContainer}>
  <OptimizedTomTomMap ref={mapRef} />
  {Platform.OS === 'web' && (
    <TrafficHeatMapOverlay mapRef={mapRef} />
  )}
</View>
```

### 4. Full Traffic Flow Screen

```jsx
import TrafficFlowDashboard from './components/TrafficFlowDashboard';

// As a full screen component
<ScrollView>
  <NetworkHealthScore />
  <TrafficFlowDashboard />
</ScrollView>
```

### 5. Using Skeleton Loaders

```jsx
import { ListSkeleton, NetworkHealthSkeleton } from './components/SkeletonLoaders';

// While loading
{isLoading ? (
  <ListSkeleton count={3} />
) : (
  <YourContent />
)}
```

## Backend Integration

### Flow Monitoring Service
The flow monitoring service runs on the backend and:
- Polls TomTom Flow API every 5 minutes
- Updates incident severity based on speeds
- Auto-clears incidents when traffic normalizes
- Syncs data to Convex for real-time updates

### API Endpoints
- `GET /api/flow/overview` - Monitoring statistics
- `GET /api/flow/incident/:id` - Individual flow data
- `POST /api/flow/check-flow` - Check flow at coordinates
- `POST /api/flow/control` - Start/stop monitoring

### Convex Integration
Flow data syncs to Convex tables:
- `trafficFlowData` - Current flow information
- Uses existing `alerts` table for severity updates

## Hooks Available

### useTrafficFlow
```jsx
import { useTrafficFlow } from '../hooks/useTrafficFlow';

const { flowData, isLoading, hasFlow } = useTrafficFlow(alertId);
```

### useActiveFlows
```jsx
import { useActiveFlows } from '../hooks/useTrafficFlow';

const { activeFlows, count, isLoading } = useActiveFlows();
```

### useCriticalFlows
```jsx
import { useCriticalFlows } from '../hooks/useTrafficFlow';

const { criticalFlows, highFlows, totalCritical } = useCriticalFlows();
```

## Where Components Are Integrated

1. **Operations Centre** - New "Traffic Flow" card added
2. **Enhanced Alert List** - Flow indicators on each incident
3. **Live Map** - Can add heat map overlay
4. **Demo Page** - `/traffic-flow-demo` shows all components

## Styling Notes

- Uses Go North East orange (#ee7203) as primary color
- Gradient colors for severity (green → amber → red → dark red)
- Glass morphism effects for modern look
- Smooth animations with React Native Animated API
- Responsive design for web and mobile

## Performance Considerations

- Flow data cached for 5 minutes to reduce API calls
- Skeleton loaders prevent layout shift
- Lazy loading for dashboard components
- Efficient re-renders with React.memo
- Convex provides real-time updates without polling

## Next Steps

1. Add sound alerts for critical speed changes
2. Implement peak hour predictions
3. Add historical comparison views
4. Create supervisor notification preferences
5. Add export functionality for reports

## Testing

Test the integration at:
- `/traffic-flow-demo` - Full demo page
- Operations Centre - Traffic Flow card
- Any alert list - See flow indicators

The system automatically monitors all incidents with coordinates and provides real-time speed updates to help supervisors make informed decisions about traffic management.