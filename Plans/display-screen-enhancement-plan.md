# Display Screen Enhancement Plan
**Go BARRY Traffic Intelligence Platform**  
**Document Version**: 1.0  
**Date**: January 2025  
**Author**: Development Team  

## Executive Summary
Complete redesign of the Control Room Display Screen to provide enhanced real-time traffic intelligence with weather integration, automated alert management, and optimized visibility for 55" displays.

## Project Objectives
1. Remove Service Status and Regional Status boxes
2. Integrate multi-location weather monitoring with severe weather alerts
3. Implement automated alert carousel from RoadworksManagerDashboard
4. Optimize for 24/7 control room viewing on 55" displays
5. Create view-only interface with zero interaction requirements

## Technical Specifications

### Display Requirements
- **Target Display**: 55" screen (1920x1080 minimum, 4K supported)
- **Viewing Distance**: 10-15 feet
- **Operating Hours**: 24/7 continuous operation
- **Interaction**: None - strictly view-only

### Font Specifications
- **Minimum Font Size**: 24px for secondary information
- **Primary Content**: 36-48px 
- **Critical Alerts**: 48-60px
- **Status Bar**: 32px

---

## Phase 1: Weather Integration System
**Duration**: 2-3 days  
**Priority**: High

### 1.1 Weather API Integration
- Integrate OpenWeatherMap or Met Office API
- Create weather service in backend (`/backend/services/weatherService.js`)
- Endpoint: `GET /api/weather/multi-location`
- Cache weather data for 5 minutes to reduce API calls

### 1.2 Location Configuration
```javascript
const WEATHER_LOCATIONS = [
  { name: "Newcastle", lat: 54.9783, lon: -1.6178, priority: 1 },
  { name: "Sunderland", lat: 54.9061, lon: -1.3811, priority: 1 },
  { name: "Durham", lat: 54.7753, lon: -1.5849, priority: 1 },
  { name: "Gateshead", lat: 54.9527, lon: -1.6035, priority: 1 },
  { name: "South Shields", lat: 54.9985, lon: -1.4323, priority: 2 },
  { name: "Consett", lat: 54.8543, lon: -1.8314, priority: 2 },
  { name: "Stanley", lat: 54.8673, lon: -1.6983, priority: 2 },
  { name: "Whitley Bay", lat: 55.0394, lon: -1.4446, priority: 2 },
  { name: "Blyth", lat: 55.1272, lon: -1.5086, priority: 2 },
  { name: "Seaham", lat: 54.8390, lon: -1.3427, priority: 3 },
  { name: "Peterlee", lat: 54.7594, lon: -1.3316, priority: 3 },
  { name: "Houghton-le-Spring", lat: 54.8411, lon: -1.4686, priority: 3 },
  { name: "Penshaw", lat: 54.8885, lon: -1.4867, priority: 3 },
  { name: "East Rainton", lat: 54.8225, lon: -1.4815, priority: 3 },
  { name: "Fulwell", lat: 54.9300, lon: -1.3644, priority: 3 },
  { name: "Southwick", lat: 54.9202, lon: -1.4031, priority: 3 },
  { name: "Ryhope", lat: 54.8663, lon: -1.3698, priority: 3 },
  { name: "Middlesbrough", lat: 54.5742, lon: -1.2350, priority: 3 },
  { name: "Stockton", lat: 54.5653, lon: -1.3213, priority: 3 },
  { name: "Billingham", lat: 54.6057, lon: -1.2901, priority: 3 }
];
```

### 1.3 Weather Display Component
- Create `WeatherCarousel.jsx` component
- 10-second rotation for normal weather
- 30-second display for severe weather warnings
- Special handling for wind speeds at:
  - Redheugh Bridge (threshold: 40mph)
  - A1 Western Bypass (threshold: 50mph)  
  - A19 Tyne Tunnel (threshold: 45mph)

### 1.4 Weather Alert Categories
- **RED**: Severe weather warnings (snow, ice, flooding, high winds)
- **AMBER**: Weather advisories (heavy rain, fog, moderate winds)
- **GREEN**: Normal conditions

---

## Phase 2: Enhanced Alert Carousel System
**Duration**: 3-4 days  
**Priority**: Critical

### 2.1 Convex Integration
- Connect to existing Convex real-time sync
- Subscribe to roadworks and incidents channels
- Implement efficient data filtering

### 2.2 Alert Data Structure
```typescript
interface DisplayAlert {
  id: string;
  type: 'ROADWORK' | 'INCIDENT' | 'EMERGENCY';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  title: string;
  location: string;
  coordinates: { lat: number, lon: number };
  affectedRoutes: string[];
  description: string;
  startTime: Date;
  estimatedEndTime?: Date;
  ageInMinutes: number;
  source: string;
}
```

### 2.3 Alert Carousel Component
- 20-second display per alert
- Progress bar showing time remaining
- Smooth fade transitions (1s)
- Maximum 3 alerts in DOM for memory efficiency
- Auto-remove resolved alerts

### 2.4 Alert Prioritization
1. Emergency incidents (P1)
2. Major roadworks affecting key routes
3. Active incidents with traffic impact
4. Planned roadworks
5. Minor incidents

### 2.5 Visual Design
- Border colors: Red (Critical), Amber (Major), Yellow (Minor)
- Pulsing animation for new alerts (3 pulses)
- Age indicator: "Just Now", "5 mins ago", "1 hour ago"
- Route badges for affected services

---

## Phase 3: Map Synchronization
**Duration**: 2-3 days  
**Priority**: High

### 3.1 Map Configuration
- 40% screen width allocation
- TomTom Maps SDK integration
- Custom styling for dark/light modes

### 3.2 Auto-Zoom Functionality
```javascript
const MAP_ZOOM_LEVELS = {
  OVERVIEW: 10,      // Shows entire region
  CITY: 12,          // City-level view
  INCIDENT: 15,      // Street-level for incidents
  DETAILED: 17       // Maximum zoom for critical events
};

const ZOOM_DURATION = 2000; // 2 seconds for smooth transition
const HOLD_DURATION = 18000; // 18 seconds (alert time minus transition)
```

### 3.3 Map Features
- Pin colors matching alert severity
- Faded pins for previous alerts (last 5)
- Route overlay for affected bus services
- Traffic flow layer integration
- Smooth pan/zoom animations

### 3.4 Memory Management
- Clear old markers after 10 alerts
- Efficient marker clustering
- Lazy load map tiles

---

## Phase 4: Status Bar & Indicators
**Duration**: 1-2 days  
**Priority**: Medium

### 4.1 Status Bar Layout
```
[Connection •] [Peak Hours] Active Incidents: 12 | Active Roadworks: 8 | Last Update: 14:32:15
```

### 4.2 Components
- **Connection Indicator**: Green (live), Amber (delayed), Red (offline)
- **Peak Hours Badge**: Shows during 07:00-09:00, 16:30-18:30
- **Counter Badges**: Large, readable numbers with color coding
- **Update Timer**: Real-time clock showing last data refresh

### 4.3 Data Freshness
- "LIVE" badge for data < 1 minute old
- "2 mins ago" for older data
- Red warning if data > 5 minutes old

---

## Phase 5: Dark Mode Implementation
**Duration**: 2 days  
**Priority**: High

### 5.1 CSS Variable System
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --alert-critical: #dc2626;
  --alert-major: #f59e0b;
  --alert-minor: #eab308;
}

[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #f5f5f5;
  --text-secondary: #a0a0a0;
  --alert-critical: #ef4444;
  --alert-major: #f97316;
  --alert-minor: #facc15;
}
```

### 5.2 Implementation Strategy
- System preference detection
- Manual toggle with 12-hour memory
- Contrast ratios: minimum 7:1 for text
- Map theme synchronization

### 5.3 Testing Requirements
- Test on actual 55" display
- Verify readability at 10ft distance
- Check color contrast compliance
- Ensure no white flash on load

---

## Phase 6: Performance Optimization
**Duration**: 2-3 days  
**Priority**: High

### 6.1 Memory Management
- Component unmounting for off-screen alerts
- Efficient re-render prevention
- Maximum 50 alerts in memory
- 5-minute cache clearing cycle

### 6.2 Network Optimization
- Batch API requests
- Implement request debouncing
- Use Convex for real-time updates only
- Fallback to cached data on connection loss

### 6.3 Rendering Optimization
- Use React.memo for static components
- Implement virtual scrolling for alert queue
- Lazy load map markers
- CSS animations over JavaScript

### 6.4 Error Handling
- Graceful degradation on API failures
- Automatic reconnection attempts
- Error state UI components
- Logging to backend for monitoring

---

## Testing Strategy

### 6.1 Unit Testing
- Weather service integration
- Alert prioritization logic
- Time formatting functions
- Map zoom calculations

### 6.2 Integration Testing
- Convex real-time sync
- API endpoint responses
- Cross-component communication
- Memory leak detection

### 6.3 Visual Testing
- 55" display compatibility
- 10ft readability test
- Color contrast verification
- Animation smoothness

### 6.4 Performance Testing
- 24-hour continuous run test
- Memory usage monitoring
- Network failure simulation
- Peak load testing (50+ alerts)

---

## Deployment Plan

### Phase 1 Deployment (Weather)
1. Deploy weather service to backend
2. Test API integration
3. Deploy weather carousel component
4. Monitor for 24 hours

### Phase 2 Deployment (Alerts)
1. Enable Convex subscriptions
2. Deploy alert carousel
3. Test with live data
4. Monitor memory usage

### Phase 3 Deployment (Full System)
1. Deploy complete display screen
2. Test on actual 55" display
3. Run 48-hour stability test
4. Full rollout to control room

---

## Success Metrics
- Zero interaction required from control room staff
- < 200MB memory usage after 24 hours
- 100% uptime over 7 days
- All text readable from 10ft distance
- < 3 second delay for new alerts
- Positive feedback from control room supervisors

---

## Risk Mitigation
- **Risk**: API rate limits
  - **Mitigation**: Implement caching and request pooling
- **Risk**: Memory leaks in 24/7 operation
  - **Mitigation**: Automatic page refresh every 6 hours
- **Risk**: Network connectivity issues
  - **Mitigation**: Local data caching and graceful degradation
- **Risk**: Display burn-in
  - **Mitigation**: Pixel shifting and element rotation

---

## Future Enhancements (Post-Launch)
1. Sound notifications for critical alerts
2. Integration with bus tracking systems
3. Predictive traffic modeling
4. Multi-screen support
5. Historical playback feature
6. Supervisor annotation system
