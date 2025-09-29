# 🔌 API Endpoints Integration Guide

## Overview
Complete API integration for SDC Dashboard with real-time breakdown data, assessment tracking, and audit capabilities.

## 📋 Core API Endpoints

### 1. Live Breakdown Data

#### `GET /api/breakdowns/live`
Returns active breakdowns with enriched assessment data for SDC Dashboard.

**Response Format:**
```json
{
  "success": true,
  "breakdowns": [
    {
      "id": "BD-2025-00034",
      "breakdown_id": "BD-2025-00034",
      "daily_id": "034",
      "vehicleFleet": "6334",
      "fleet_number": "6334", 
      "route": "X21",
      "location": "A19 Northbound",
      "assessmentType": "Steering",
      "supervisor": "John Smith",
      "supervisor_badge": "AG003",
      "status": "in_progress",
      "decision": "STOP",
      "currentStep": "4/5",
      "stepDescription": "Checking steering system...",
      "wizardResponses": [...],
      "recommendedActions": [...],
      "createdAt": "2025-09-28T10:30:00Z",
      "startedAt": "2025-09-28T10:30:30Z",
      "completedAt": null,
      "isCritical": true,
      "isPending": false,
      "inAssessment": true,
      "activities": [...]
    }
  ],
  "total": 15,
  "critical": 3,
  "pending": 2,
  "dispatched": 5,
  "in_assessment": 2,
  "timestamp": "2025-09-28T11:00:00Z"
}
```

**Key Features:**
- Real-time breakdown status with assessment integration
- Enhanced data structure for SDC Dashboard components
- Statistics for dashboard overview
- Activity tracking for progress monitoring

### 2. In-Progress Assessments

#### `GET /api/breakdowns/in-progress`
Returns currently active wizard assessments with real-time progress.

**Response Format:**
```json
{
  "success": true,
  "assessments": [
    {
      "breakdownId": "BD-2025-00034",
      "fleetNumber": "6334",
      "route": "X21",
      "location": "A19 Northbound",
      "assessmentType": "Steering",
      "supervisor": "John Smith",
      "startTime": "2025-09-28T10:30:00Z",
      "currentStep": "4/5",
      "stepDescription": "Checking steering system...",
      "estimatedCompletion": "2 mins",
      "priority": "critical",
      "elapsed_minutes": 6,
      "activities": [...]
    }
  ],
  "count": 2,
  "timestamp": "2025-09-28T11:00:00Z"
}
```

**Usage:**
```javascript
import sdcAPI from '../api/sdcAPI';

const assessments = await sdcAPI.getInProgressAssessments();
// Use for AssessmentProgressCard components
```

### 3. Assessment Edit Management

#### `POST /api/breakdowns/{id}/edit`
Initiates assessment edit with comprehensive audit logging.

**Request Body:**
```json
{
  "reason": "Incorrect decision recorded - should be AMBER not STOP",
  "user_type": "sdc_operator",
  "source": "sdc_dashboard",
  "return_url": "/dashboards/sdc?highlight=BD-2025-00034"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment edit initiated successfully",
  "edit_context": {
    "breakdown_id": "BD-2025-00034",
    "original_decision": "STOP",
    "edit_reason": "Incorrect decision recorded",
    "return_url": "/dashboards/sdc?highlight=BD-2025-00034"
  },
  "redirect_url": "/breakdown-guide?edit=BD-2025-00034&return=...",
  "audit_event": {...}
}
```

**Implementation:**
```javascript
const editResponse = await sdcAPI.startAssessmentEdit('BD-2025-00034', {
  reason: 'Incorrect decision recorded',
  userType: 'sdc_operator',
  returnUrl: '/dashboards/sdc?highlight=BD-2025-00034'
});

// Redirect to breakdown guide with edit context
window.location.href = editResponse.redirect_url;
```

### 4. Audit Trail Access

#### `GET /api/breakdowns/{id}/audit`
Comprehensive audit trail with assessment history and edit tracking.

**Response Format:**
```json
{
  "success": true,
  "breakdown_id": "BD-2025-00034",
  "audit_trail": [
    {
      "id": "1727512843000",
      "timestamp": "2025-09-28T10:35:00Z",
      "action": "Assessment Completed",
      "user": "John Smith",
      "details": "Steering assessment completed with STOP decision",
      "source": "breakdown_guide",
      "type": "activity"
    },
    {
      "id": "1727512900000", 
      "timestamp": "2025-09-28T10:36:00Z",
      "action": "Assessment Edit Initiated",
      "user": "sdc_operator",
      "details": "Incorrect decision recorded - should be AMBER not STOP",
      "source": "sdc_dashboard",
      "type": "audit_event"
    }
  ],
  "total_events": 15,
  "audit_events": 3,
  "activity_events": 12
}
```

### 5. WebSocket Real-time Updates

#### `WebSocket /ws/breakdowns`
Real-time breakdown and assessment updates for instant dashboard synchronization.

**Connection:**
```javascript
import useConnectionManager from '../hooks/useConnectionManager';

const connectionManager = useConnectionManager({
  endpoint: '/ws/sdc-dashboard',
  autoConnect: true,
  primary: 'websocket',
  fallback: 'polling',
  autoFailover: true
});
```

**Event Types:**
```javascript
const eventTypes = {
  WIZARD_STARTED: 'wizard_started',
  WIZARD_PROGRESS: 'wizard_progress', 
  WIZARD_COMPLETED: 'wizard_completed',
  BREAKDOWN_CREATED: 'breakdown_created',
  ASSESSMENT_PROGRESS: 'assessment_progress'
};
```

**Event Handling:**
```javascript
useEffect(() => {
  const unsubscribe = connectionManager.onMessage((message) => {
    switch (message.type) {
      case 'wizard_started':
        // Add to active assessments
        setActiveAssessments(prev => [message.data, ...prev]);
        break;
        
      case 'wizard_completed':
        // Update breakdown with decision, highlight in dashboard
        setHighlightedBreakdown(message.data.breakdown_id);
        setActiveAssessments(prev => 
          prev.filter(a => a.breakdown_id !== message.data.breakdown_id)
        );
        fetchBreakdowns(); // Refresh main data
        break;
        
      case 'assessment_progress':
        // Update progress card with current step
        setActiveAssessments(prev => 
          prev.map(a => a.breakdown_id === message.data.breakdown_id 
            ? { ...a, ...message.data } 
            : a
          )
        );
        break;
    }
  });
  
  return unsubscribe;
}, [connectionManager]);
```

## 🔄 Polling Fallback System

When WebSocket connections fail, automatic polling provides seamless fallback:

```javascript
// Automatic polling when WebSocket unavailable
const pollForUpdates = async () => {
  try {
    const updates = await sdcAPI.pollForUpdates(lastUpdateTimestamp);
    updates.breakdowns?.forEach(breakdown => {
      handleRealtimeUpdate({
        type: 'poll_update',
        data: breakdown
      });
    });
  } catch (error) {
    console.error('Polling failed:', error);
  }
};

// Poll every 5 seconds when WebSocket disconnected
useEffect(() => {
  if (!connectionManager.isConnected) {
    const interval = setInterval(pollForUpdates, 5000);
    return () => clearInterval(interval);
  }
}, [connectionManager.isConnected]);
```

## 🛠️ SDC Operations Endpoints

### Acknowledge Breakdown
```javascript
// POST /api/sdc/acknowledge
await sdcAPI.acknowledgeBreakdown('BD-2025-00034');
```

### Request Engineering
```javascript
// POST /api/sdc/request-engineering  
await sdcAPI.requestEngineering('BD-2025-00034', {
  priority: 'critical',
  notes: 'STOP decision requires immediate attention'
});
```

### Make SDC Decision
```javascript
// POST /api/sdc/decision
await sdcAPI.makeSDCDecision('BD-2025-00034', 'dispatch_engineer', 'Critical safety issue');
```

## 📊 Integration Examples

### 1. SDC Dashboard Data Loading
```javascript
import sdcAPI from '../api/sdcAPI';
import { useEffect, useState } from 'react';

const SDCDashboard = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [activeAssessments, setActiveAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load live breakdowns and active assessments in parallel
        const [liveData, assessmentsData] = await Promise.all([
          sdcAPI.getLiveBreakdowns(),
          sdcAPI.getInProgressAssessments()
        ]);
        
        setBreakdowns(liveData.breakdowns || []);
        setActiveAssessments(assessmentsData.assessments || []);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div>
      {/* Render dashboard components */}
    </div>
  );
};
```

### 2. Assessment Progress Tracking
```javascript
import { AssessmentProgressCard } from '../components';

const AssessmentTracker = ({ assessments }) => {
  const handleViewDetails = async (breakdownId) => {
    // Open assessment in new tab
    window.open(`/breakdown-guide?view=${breakdownId}&mode=live`, '_blank');
  };

  const handleCancel = async (breakdownId) => {
    if (confirm('Cancel this assessment?')) {
      await sdcAPI.logAuditEvent({
        action: 'assessment_cancelled',
        breakdown_id: breakdownId,
        reason: 'Cancelled by SDC operator',
        user_type: 'sdc_operator'
      });
      
      // Refresh assessments
      window.location.reload();
    }
  };

  return (
    <div>
      {assessments.map(assessment => (
        <AssessmentProgressCard
          key={assessment.breakdownId}
          {...assessment}
          onViewDetails={handleViewDetails}
          onCancel={handleCancel}
        />
      ))}
    </div>
  );
};
```

### 3. Edit Assessment Workflow
```javascript
import { EditAssessmentModal } from '../components';

const BreakdownCard = ({ breakdown }) => {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEditAssessment = async (breakdownId, reason) => {
    try {
      const response = await sdcAPI.startAssessmentEdit(breakdownId, {
        reason,
        userType: 'sdc_operator',
        returnUrl: `/dashboards/sdc?highlight=${breakdownId}`
      });
      
      // Close modal
      setEditModalOpen(false);
      
      // Redirect to breakdown guide
      window.location.href = response.redirect_url;
      
    } catch (error) {
      alert('Failed to initiate edit: ' + error.message);
    }
  };

  return (
    <div>
      <button onClick={() => setEditModalOpen(true)}>
        Edit Assessment
      </button>
      
      <EditAssessmentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        breakdownId={breakdown.breakdown_id}
        originalDecision={breakdown.decision}
        onEdit={handleEditAssessment}
      />
    </div>
  );
};
```

## 🔍 Error Handling & Resilience

### API Client Features
- **Automatic Retry**: Exponential backoff for failed requests
- **Request Deduplication**: Prevents duplicate concurrent requests
- **Intelligent Caching**: Reduces API load with configurable cache timeouts
- **Graceful Degradation**: Fallback mechanisms when endpoints unavailable

### Connection Management
- **Hybrid Architecture**: WebSocket primary, polling secondary
- **Automatic Failover**: Seamless switching between connection modes
- **Health Monitoring**: Connection status indicators and metrics
- **Memory Optimization**: Cleanup of stale connections and cached data

## 🚀 Production Deployment

### Backend Integration
1. **Add routes to server.js**:
   ```javascript
   import breakdownsAPIRoutes from './routes/breakdownsAPI.js';
   import webSocketHandler from './routes/webSocketHandler.js';
   
   app.use('/api/breakdowns', breakdownsAPIRoutes);
   webSocketHandler.initialize(server);
   ```

2. **Configure WebSocket endpoints**:
   - `/ws` - General WebSocket endpoint
   - `/ws/sdc-dashboard` - SDC Dashboard specific channel
   - `/ws/assessment-progress` - Assessment progress updates

3. **Set up file watchers**:
   - Monitors `breakdown-counter.json` for breakdown updates
   - Watches `activities.json` for assessment progress
   - Automatic real-time broadcasting to connected clients

### Frontend Integration
1. **Import API client**:
   ```javascript
   import sdcAPI from '../api/sdcAPI';
   ```

2. **Use connection manager**:
   ```javascript
   import useConnectionManager from '../hooks/useConnectionManager';
   ```

3. **Integrate components**:
   ```javascript
   import { AssessmentProgressCard, EditAssessmentModal } from '../components';
   ```

## 📈 Performance Considerations

### API Optimization
- **Batch Requests**: Minimize individual API calls
- **Smart Caching**: Reduce server load with intelligent cache strategies
- **Request Queuing**: Prevent API overwhelming with request management
- **Data Transformation**: Server-side processing for optimized payloads

### Memory Management
- **Cache Cleanup**: Automatic cleanup of expired cache entries
- **Connection Monitoring**: Remove stale WebSocket connections
- **Data Pagination**: Limit data sets for better performance
- **Render.com Optimization**: Designed for 2GB memory constraint

This API integration provides a complete, production-ready solution for real-time breakdown tracking and assessment management in the SDC Operations Dashboard.