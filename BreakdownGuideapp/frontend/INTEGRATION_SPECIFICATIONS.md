# 📋 SDC Dashboard Integration Specifications

## Overview
Complete integration guide for connecting the breakdown guide system with the SDC Operations Dashboard, including data structures, API endpoints, and real-time synchronization.

## 1. Data Flow Architecture

### 1.1 Core Data Structure
```javascript
// Standard breakdown data format for SDC Dashboard
const breakdownData = {
  // Core identification
  id: "BD-2025-00034",
  breakdown_id: "BD-2025-00034", 
  daily_id: "034",
  
  // Vehicle information
  vehicleFleet: "6334",
  fleet_number: "6334",
  route: "X21",
  
  // Location and context
  location: "A19 Northbound",
  coordinates: { lat: 54.9783, lng: -1.6178 },
  
  // Assessment details
  assessmentType: "Steering",
  issue_category: "Steering",
  wizard_type: "steering",
  
  // Personnel
  supervisor: "John Smith",
  supervisor_name: "John Smith",
  supervisor_badge: "AG003",
  
  // Status and progress
  status: "IN_PROGRESS", // IN_PROGRESS, COMPLETED, CANCELLED
  decision: "STOP", // STOP, AMBER, CONTINUE, null
  currentStep: "4/5",
  stepDescription: "Checking steering system...",
  
  // Wizard data
  wizardResponses: [
    {
      step: 1,
      question: "Is the steering wheel loose?",
      answer: "Yes", 
      timestamp: "2025-09-28T10:31:00Z"
    }
  ],
  
  // SDC specific actions
  recommendedActions: [
    {
      type: "immediate_stop",
      description: "Vehicle must be stopped immediately",
      priority: "critical",
      icon: "🛑"
    }
  ],
  
  // Timeline
  createdAt: "2025-09-28T10:30:00Z",
  startedAt: "2025-09-28T10:30:30Z", 
  completedAt: null,
  
  // Edit history and audit
  editHistory: [
    {
      timestamp: "2025-09-28T10:32:00Z",
      action: "assessment_started",
      user: "John Smith",
      details: "Steering assessment initiated"
    }
  ]
}
```

### 1.2 Assessment Progress Data
```javascript
// For AssessmentProgressCard component
const progressData = {
  breakdownId: "BD-2025-00034",
  currentStep: "4/5",
  stepDescription: "Checking steering system...",
  supervisor: "John Smith",
  estimatedCompletion: "2 mins",
  fleetNumber: "6334", 
  route: "X21",
  location: "A19 Northbound",
  startTime: "2025-09-28T10:30:00Z",
  wizardType: "Steering Assessment",
  priority: "critical" // critical, high, medium, normal
}
```

### 1.3 Edit Assessment Data
```javascript
// For EditAssessmentModal component
const editData = {
  breakdownId: "BD-2025-00034",
  originalDecision: "STOP",
  originalAssessment: {
    decision: "STOP",
    wizard_type: "steering", 
    supervisor_name: "John Smith",
    completed_at: "2025-09-28T10:35:00Z",
    wizard_responses: {...}
  },
  auditTrail: [
    {
      timestamp: "2025-09-28T10:35:00Z",
      action: "Assessment Completed",
      user: "John Smith",
      details: "Steering assessment completed with STOP decision"
    }
  ]
}
```

## 2. API Endpoints

### 2.1 Core Breakdown Endpoints
```javascript
// Get active breakdowns for SDC Dashboard
GET /api/breakdowns/active
Response: {
  success: true,
  breakdowns: [breakdownData, ...],
  total: 15,
  critical: 3,
  in_assessment: 2
}

// Get specific breakdown details
GET /api/breakdowns/{breakdownId}
Response: {
  success: true,
  breakdown: breakdownData
}

// Get breakdown assessment details
GET /api/breakdowns/{breakdownId}/assessment
Response: {
  success: true,
  assessment: {
    decision: "STOP",
    wizard_responses: {...},
    completed_at: "2025-09-28T10:35:00Z"
  }
}
```

### 2.2 Assessment Progress Endpoints
```javascript
// Get active assessments
GET /api/assessments/active
Response: {
  success: true,
  assessments: [progressData, ...]
}

// Update assessment progress
POST /api/assessments/{breakdownId}/progress
Body: {
  currentStep: "4/5",
  stepDescription: "Checking steering system...",
  estimated_completion: "2 mins"
}

// Complete assessment
POST /api/assessments/{breakdownId}/complete
Body: {
  decision: "STOP",
  wizard_responses: {...},
  notes: "Vehicle unsafe to continue"
}
```

### 2.3 SDC Operations Endpoints
```javascript
// SDC acknowledge breakdown
POST /api/sdc/acknowledge
Body: {
  breakdown_id: "BD-2025-00034",
  acknowledged_at: "2025-09-28T10:40:00Z"
}

// Request engineering support
POST /api/sdc/request-engineering
Body: {
  breakdown_id: "BD-2025-00034",
  priority: "critical",
  notes: "STOP decision requires immediate attention"
}

// Make SDC decision
POST /api/sdc/decision
Body: {
  breakdown_id: "BD-2025-00034", 
  decision: "dispatch_engineer",
  decision_at: "2025-09-28T10:45:00Z"
}
```

### 2.4 Audit and Edit Endpoints
```javascript
// Get audit trail
GET /api/audit/assessment/{breakdownId}
Response: {
  success: true,
  history: [auditEntry, ...]
}

// Log audit event
POST /api/audit/log
Body: {
  action: "assessment_edit_initiated",
  breakdown_id: "BD-2025-00034",
  reason: "Incorrect decision recorded",
  user_type: "sdc_operator"
}
```

## 3. Real-time Integration

### 3.1 WebSocket Events
```javascript
// WebSocket connection
const ws = new WebSocket('/ws/sdc-dashboard');

// Event types
const eventTypes = {
  WIZARD_STARTED: 'wizard_started',
  WIZARD_PROGRESS: 'wizard_progress', 
  WIZARD_COMPLETED: 'wizard_completed',
  BREAKDOWN_CREATED: 'breakdown_created',
  ASSESSMENT_PROGRESS: 'assessment_progress',
  SDC_ACTION_REQUIRED: 'sdc_action_required'
};

// Example event data
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'wizard_started':
      // Add to active assessments
      break;
    case 'wizard_completed':
      // Update breakdown with decision, highlight in dashboard
      break;
    case 'assessment_progress':
      // Update progress card with current step
      break;
  }
};
```

### 3.2 Polling Fallback
```javascript
// Automatic fallback to polling if WebSocket fails
const pollForUpdates = async () => {
  try {
    const response = await fetch('/api/breakdowns/updates?since=' + lastUpdate);
    const updates = await response.json();
    
    updates.forEach(update => {
      handleRealtimeUpdate(update);
    });
  } catch (error) {
    console.error('Polling failed:', error);
  }
};

// Poll every 5 seconds when WebSocket unavailable
setInterval(pollForUpdates, 5000);
```

## 4. Component Integration

### 4.1 SDC Dashboard Usage
```jsx
import { useState, useEffect } from 'react';
import sdcIntegrationService from '../services/sdcIntegrationService';
import AssessmentProgressCard from './AssessmentProgressCard';
import EditAssessmentModal from './EditAssessmentModal';

const SDCDashboard = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [activeAssessments, setActiveAssessments] = useState([]);
  
  useEffect(() => {
    // Fetch and transform breakdown data
    const loadData = async () => {
      const response = await fetch('/api/breakdowns/active');
      const data = await response.json();
      
      // Transform to SDC format
      const transformed = data.breakdowns.map(breakdown => 
        sdcIntegrationService.transformBreakdownData(breakdown)
      );
      
      setBreakdowns(transformed);
    };
    
    loadData();
  }, []);
  
  return (
    <div>
      {/* Active assessments */}
      {activeAssessments.map(assessment => (
        <AssessmentProgressCard
          key={assessment.breakdownId}
          {...sdcIntegrationService.createAssessmentProgressData(assessment)}
        />
      ))}
      
      {/* Breakdown cards with edit capability */}
      {breakdowns.map(breakdown => (
        <BreakdownCard
          key={breakdown.id}
          breakdown={breakdown}
          onEdit={() => setEditModalData(
            sdcIntegrationService.createEditAssessmentData(breakdown)
          )}
        />
      ))}
    </div>
  );
};
```

### 4.2 Assessment Progress Integration
```jsx
// Real-time progress tracking
useEffect(() => {
  const unsubscribe = assessmentProgressService.addEventListener('step_progress', (assessment) => {
    // Update progress card in real-time
    setActiveAssessments(prev => 
      prev.map(a => a.breakdownId === assessment.breakdownId ? assessment : a)
    );
  });
  
  return unsubscribe;
}, []);
```

### 4.3 Edit Assessment Workflow
```jsx
const handleEditAssessment = async (breakdownId) => {
  // Create edit data using integration service
  const editData = sdcIntegrationService.createEditAssessmentData(breakdown);
  
  // Open modal
  setEditModalData(editData);
  setEditModalOpen(true);
};

const handleConfirmEdit = async (breakdownId, reason) => {
  // Log audit event
  await sdcIntegrationService.logAuditEvent({
    action: 'assessment_edit_initiated',
    breakdown_id: breakdownId,
    reason: reason
  });
  
  // Redirect to wizard with edit context
  const returnUrl = encodeURIComponent(`/dashboards/sdc?highlight=${breakdownId}`);
  window.location.href = `/breakdown-guide?edit=${breakdownId}&return=${returnUrl}&reason=${encodeURIComponent(reason)}`;
};
```

## 5. Data Transformation

### 5.1 Using SDC Integration Service
```javascript
import sdcIntegrationService from '../services/sdcIntegrationService';

// Transform raw breakdown data to SDC format
const breakdownData = await fetch('/api/breakdowns/123').then(r => r.json());
const sdcData = sdcIntegrationService.transformBreakdownData(breakdownData);

// Create component data
const progressData = sdcIntegrationService.createAssessmentProgressData(sdcData);
const editData = sdcIntegrationService.createEditAssessmentData(sdcData);

// Validate data structure
const isValid = sdcIntegrationService.validateBreakdownData(sdcData);
```

### 5.2 Status Mapping
```javascript
// Status normalization
const statusMap = {
  "active": "IN_PROGRESS",
  "pending": "IN_PROGRESS",
  "completed": "COMPLETED", 
  "resolved": "COMPLETED",
  "cancelled": "CANCELLED"
};

// Decision mapping  
const decisionMap = {
  "STOP": { color: "red", priority: "critical", icon: "🛑" },
  "AMBER": { color: "amber", priority: "high", icon: "⚡" },
  "CHANGEOVER": { color: "amber", priority: "high", icon: "⚡" },
  "CONTINUE": { color: "green", priority: "low", icon: "✅" }
};
```

## 6. Error Handling and Fallbacks

### 6.1 Connection Management
```javascript
// Hybrid connection with automatic fallback
const connectionManager = useConnectionManager({
  primary: 'websocket',
  fallback: 'polling', 
  autoFailover: true,
  reconnectAttempts: 5,
  pollingInterval: 5000
});

// Handle connection status
useEffect(() => {
  if (!connectionManager.isConnected) {
    // Show offline indicator
    setConnectionStatus('offline');
  }
}, [connectionManager.isConnected]);
```

### 6.2 Data Validation
```javascript
// Validate incoming data
const validateBreakdownData = (data) => {
  const required = ['id', 'fleet_number', 'location'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    console.warn('Invalid breakdown data, missing:', missing);
    return false;
  }
  
  return true;
};
```

## 7. Performance Optimization

### 7.1 Caching Strategy
```javascript
// Cache breakdown data to reduce API calls
const cache = new Map();

const getCachedBreakdown = async (id) => {
  if (cache.has(id)) {
    const cached = cache.get(id);
    if (Date.now() - cached.timestamp < 30000) { // 30 second cache
      return cached.data;
    }
  }
  
  const fresh = await fetchBreakdown(id);
  cache.set(id, { data: fresh, timestamp: Date.now() });
  return fresh;
};
```

### 7.2 Memory Management
```javascript
// Cleanup old assessments to prevent memory leaks
useEffect(() => {
  const cleanup = setInterval(() => {
    setActiveAssessments(prev => 
      prev.filter(assessment => {
        const age = Date.now() - new Date(assessment.startTime);
        return age < 2 * 60 * 60 * 1000; // Remove assessments older than 2 hours
      })
    );
  }, 60000); // Check every minute
  
  return () => clearInterval(cleanup);
}, []);
```

## 8. Testing Integration

### 8.1 Mock Data Generation
```javascript
// Generate test data for development
const generateMockBreakdown = (overrides = {}) => {
  return {
    id: `BD-2025-${String(Math.floor(Math.random() * 1000)).padStart(5, '0')}`,
    fleet_number: String(Math.floor(Math.random() * 9000) + 1000),
    location: "A19 Northbound",
    assessmentType: "Steering",
    supervisor: "John Smith",
    status: "IN_PROGRESS",
    decision: null,
    createdAt: new Date().toISOString(),
    ...overrides
  };
};
```

### 8.2 Component Testing
```jsx
// Test AssessmentProgressCard with mock data
import { render, screen } from '@testing-library/react';
import AssessmentProgressCard from './AssessmentProgressCard';

test('displays assessment progress correctly', () => {
  const mockData = {
    breakdownId: "BD-2025-00034",
    currentStep: "3/5",
    stepDescription: "Testing brakes...",
    supervisor: "Jane Doe",
    fleetNumber: "5432"
  };
  
  render(<AssessmentProgressCard {...mockData} />);
  
  expect(screen.getByText("3/5")).toBeInTheDocument();
  expect(screen.getByText("Testing brakes...")).toBeInTheDocument();
  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
});
```

## 9. Security Considerations

### 9.1 Data Sanitization
```javascript
// Sanitize user input for audit logs
const sanitizeInput = (input) => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>'"]/g, '')
    .trim()
    .substring(0, 1000); // Limit length
};
```

### 9.2 Authentication
```javascript
// Verify supervisor permissions for edit actions
const canEditAssessment = (supervisorBadge, breakdownData) => {
  const adminBadges = ['AG003', 'BP009'];
  const isOriginalSupervisor = breakdownData.supervisor_badge === supervisorBadge;
  const isAdmin = adminBadges.includes(supervisorBadge);
  
  return isOriginalSupervisor || isAdmin;
};
```

## 10. Deployment Checklist

- [ ] API endpoints implemented and tested
- [ ] WebSocket server configured with fallback
- [ ] Data transformation service deployed 
- [ ] Component integration tested
- [ ] Real-time sync verified
- [ ] Audit logging functional
- [ ] Error handling implemented
- [ ] Performance optimization applied
- [ ] Security measures in place
- [ ] Documentation updated

---

This integration specification provides a complete roadmap for connecting the breakdown guide system with the SDC Operations Dashboard, ensuring seamless data flow and real-time synchronization.