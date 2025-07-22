# GO BARRY - Real-Time Enhancements & Visual Improvements Prompt

## Context for Next Chat
You are continuing development on the Go BARRY traffic intelligence platform. The previous session successfully implemented:
- Enhanced route matching with confidence scoring (0-1 scale)
- Multi-modal impact detection (Metro/Ferry/Interchange connections)
- Time-based route filtering (peak/off-peak, weekday/weekend)
- TomTom API rate limit monitoring with visual dashboard

## Current State
- **Backend**: Enhanced route matching integrated into TomTom service
- **Frontend**: RouteConfidenceDisplay component created
- **API**: New endpoints at /api/routes/* for enhanced matching
- **Data Flow**: TomTom → Confidence Scoring → Route Matching → Incident Display

## Priority Tasks for Real-Time Enhancements

### 1. 🔄 Real-Time Traffic Flow Updates
**Goal**: Add live traffic speed monitoring to existing incidents
- Subscribe to TomTom Flow API for speed data
- Update incident severity based on traffic speed changes
- Auto-close incidents when traffic returns to normal
- Show speed trends (improving/worsening arrows)
- 5-minute polling for active incidents only

### 2. 📊 Live Dashboard Enhancements
**Goal**: Create dynamic visual dashboard for control room
- Real-time incident heat map overlay
- Animated traffic flow indicators
- Live route status board (green/amber/red)
- Passenger impact counter (estimated affected)
- Network health score (0-100)
- Peak hour countdown timer

### 3. 🎨 Visual Improvements
**Goal**: Enhance UI/UX with modern animations and transitions
- Smooth fade-in/out for new incidents
- Pulsing animation for critical alerts
- Sliding route confidence bars
- Animated multi-modal connection lines
- Glass morphism effects for cards
- Dark mode optimization
- Skeleton loaders for all data fetching

### 4. 🚨 Smart Alert Prioritization
**Goal**: AI-powered alert ranking system
- Score alerts by: passenger impact + severity + confidence + time of day
- Bubble critical alerts to top
- Group related incidents (same cause/location)
- Suppress low-impact alerts during peak times
- Supervisor override capability

### 5. 📱 Push Notification System
**Goal**: Proactive alerting for supervisors
- Critical incident notifications
- Multi-modal impact warnings
- Route status changes
- Shift handover summaries
- Customizable alert thresholds

### 6. 🗺️ Enhanced Map Visualization
**Goal**: Interactive incident map with layers
- Incident clusters with zoom
- Route paths with live bus positions
- Traffic flow color coding
- Metro/Ferry connection indicators
- 3D building landmarks
- Weather overlay option

## Technical Requirements

### Performance Targets
- Initial load: <1 second
- Real-time updates: <100ms latency
- 60 FPS animations
- Memory usage: <100MB
- Supports 50+ concurrent incidents

### API Integrations Needed
- TomTom Traffic Flow API (speed data)
- TomTom Traffic Incidents Viewport API (clustering)
- Weather API (for overlay)
- WebSocket for real-time sync

### Visual Design System
- Primary: #ee7203 (Go North East orange)
- Success: #10b981 (green)
- Warning: #f59e0b (amber)
- Danger: #ef4444 (red)
- Glass effect: backdrop-filter: blur(10px)
- Animations: Framer Motion or React Native Animated

## Implementation Priority
1. Real-time traffic flow (backend first)
2. Live dashboard (frontend focus)
3. Visual improvements (progressive enhancement)
4. Smart prioritization (algorithm development)
5. Push notifications (infrastructure setup)
6. Enhanced map (final integration)

## Success Metrics
- 50% reduction in incident response time
- 90% supervisor satisfaction with visual clarity
- <2% missed critical incidents
- 30% reduction in false positive alerts
- 100% uptime during peak hours

## Questions to Address
1. Should we use WebSockets or polling for real-time updates?
2. What's the budget for additional API calls (TomTom Flow)?
3. Do supervisors prefer light or dark mode for 24/7 display?
4. Should we add sound alerts for critical incidents?
5. How many historical incidents to show on dashboard?

## Next Session Goals
Start with real-time traffic flow implementation:
1. Add TomTom Flow API integration
2. Create speed monitoring service
3. Update incident severity dynamically
4. Add visual speed indicators
5. Test with live traffic data

Remember to:
- Check GO_BARRY_AI_CONTEXT.txt for system architecture
- Maintain 2GB memory limit for Render.com
- Use React Native components (not HTML)
- Keep all route matching enhancements from previous session
- Test on both web and mobile platforms
