# SDC Dashboard Live Assessment Integration

## Overview
This integration provides real-time tracking of breakdown assessments in the SDC Operations Dashboard, showing live progress as supervisors work through the 33 SDC-compliant wizards.

## Architecture

### Components

#### 1. Assessment Broadcaster Service (`assessmentBroadcaster.js`)
- **Location**: `/src/services/assessmentBroadcaster.js`
- **Purpose**: Bridges the gap between breakdown guide wizards and SDC Dashboard
- **Features**:
  - WebSocket connection for real-time updates
  - Automatic fallback to REST API if WebSocket fails
  - Progress tracking with step descriptions
  - Estimated completion time calculations

#### 2. Enhanced SDC Dashboard
- **Location**: `/src/dashboards/sdc/SDCDashboard.jsx`
- **Updates**:
  - Integrated `AssessmentProgressCard` for detailed view
  - Enhanced real-time message handling
  - Shows first 2 assessments as detailed cards
  - Additional assessments in tracker view

#### 3. Assessment Progress Components
- **AssessmentProgressCard**: Detailed individual assessment tracking
- **AssessmentProgressTracker**: Compact view for multiple assessments

## Data Flow

```
Supervisor starts assessment
         ↓
    App.jsx calls assessmentBroadcaster.initAssessment()
         ↓
    Broadcasts "assessment_started" via WebSocket/API
         ↓
    SDC Dashboard receives and displays in real-time
         ↓
    As supervisor progresses through wizard steps
         ↓
    assessmentBroadcaster.updateProgress() sends updates
         ↓
    Dashboard shows current step & estimated completion
         ↓
    On completion/cancellation
         ↓
    Final status broadcasted and dashboard updated
```

## Message Types

### assessment_started
```javascript
{
  type: 'assessment_started',
  assessmentId: 'ASSESS-1234567890',
  breakdownId: 'BD-2025-00034',
  wizardType: 'steering',
  totalSteps: 5,
  currentStep: 1,
  stepDescription: 'Initial steering assessment',
  supervisor: { name: 'John Smith', badge: 'JS001' },
  vehicle: { fleetNumber: '6334' },
  location: { description: 'A19 Northbound' },
  route: 'X10',
  estimatedCompletion: '5 mins',
  startTime: '2025-09-28T17:45:00Z'
}
```

### assessment_progress
```javascript
{
  type: 'assessment_progress',
  assessmentId: 'ASSESS-1234567890',
  currentStep: 3,
  totalSteps: 5,
  stepDescription: 'Testing power steering function',
  progress: 60, // percentage
  estimatedCompletion: '2 mins',
  elapsedTime: 180 // seconds
}
```

### assessment_completed
```javascript
{
  type: 'assessment_completed',
  assessmentId: 'ASSESS-1234567890',
  breakdownId: 'BD-2025-00034',
  wizardType: 'steering',
  decision: 'STOP',
  notes: 'Excessive play detected - 85mm measured',
  duration: 300, // seconds
  completedAt: '2025-09-28T17:50:00Z'
}
```

## Features

### Real-time Progress Tracking
- **Live Step Updates**: Shows current step number and description
- **Progress Bar**: Visual representation of completion percentage
- **Elapsed Time**: Running timer since assessment started
- **Estimated Completion**: Dynamic calculation based on wizard type

### Enhanced Visibility
- **Detailed Cards**: First 2 active assessments shown with full details
- **Compact Tracker**: Additional assessments in space-efficient view
- **Priority Highlighting**: Critical assessments highlighted in red
- **Supervisor Info**: Shows who is conducting the assessment

### Smart Integration
- **WebSocket Primary**: Real-time updates via WebSocket
- **API Fallback**: Automatic fallback to REST API if WebSocket fails
- **Offline Support**: Stores updates locally for later sync
- **Auto-reconnect**: Handles connection drops gracefully

## Usage

### Starting an Assessment
When a supervisor selects a wizard and vehicle:
1. Assessment broadcaster initializes with wizard details
2. SDC Dashboard immediately shows the assessment as "In Progress"
3. Real-time updates flow as supervisor progresses

### Monitoring Progress
SDC operators can:
- See which supervisors are conducting assessments
- Monitor progress through wizard steps
- View estimated completion times
- Track multiple concurrent assessments
- Click to view assessment details

### Completion Handling
When assessment completes:
1. Final decision broadcasted to dashboard
2. Assessment removed from active list
3. Breakdown card updated with decision
4. Activity logged for audit trail

## Configuration

### Environment Variables
```bash
VITE_API_URL=https://breakdown-guide.onrender.com
```

### WebSocket Connection
- Primary: `ws://breakdown-guide.onrender.com/ws/assessment-tracker`
- Fallback: `POST /api/assessment/broadcast`

## Testing

### Manual Testing
1. Open SDC Dashboard in one browser tab
2. Open Breakdown Guide in another tab
3. Start an assessment and observe real-time updates
4. Progress through wizard steps
5. Verify step descriptions update live
6. Complete assessment and verify removal from active list

### Connection Testing
1. Start with good network connection
2. Disable network briefly to test fallback
3. Re-enable to test reconnection
4. Verify no data loss during transitions

## Troubleshooting

### Assessment Not Showing
- Check WebSocket connection in Network tab
- Verify supervisor session is active
- Check browser console for errors
- Ensure backend is running

### Updates Not Real-time
- WebSocket may have fallen back to polling
- Check connection status indicator
- Verify firewall allows WebSocket connections

### Progress Not Updating
- Ensure wizard is calling `onNext()` properly
- Check assessmentBroadcaster is initialized
- Verify step numbers are incrementing

## Future Enhancements

### Planned Features
- [ ] Historical assessment timeline
- [ ] Performance metrics per supervisor
- [ ] Average completion times by wizard type
- [ ] Parallel assessment coordination
- [ ] Voice notifications for critical assessments
- [ ] Mobile app integration
- [ ] Assessment handoff between supervisors

### API Endpoints Needed
- `GET /api/assessments/active` - List active assessments
- `GET /api/assessments/:id/progress` - Get detailed progress
- `POST /api/assessments/:id/handoff` - Transfer to another supervisor
- `GET /api/assessments/metrics` - Performance statistics

## Notes

### Performance Considerations
- Limit to showing 10 active assessments maximum
- Throttle progress updates to every 5 seconds minimum
- Use React.memo for assessment cards to prevent re-renders
- Implement virtual scrolling for large assessment lists

### Security
- Validate supervisor permissions before broadcasting
- Sanitize all user input in messages
- Use secure WebSocket (wss://) in production
- Implement rate limiting on broadcasts

---

**Created**: September 28, 2025
**Version**: 1.0.0
**Author**: SDC Development Team
