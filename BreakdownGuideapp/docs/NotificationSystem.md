# Notification System Documentation

## Overview

The Go North East Breakdown Management System features a comprehensive notification system designed to keep supervisors informed about critical events, SLA breaches, and operational updates in real-time.

## Architecture

```
NotificationService (Singleton)
├── Notification Store
├── Subscription Manager
├── Priority Queue
├── Real-time Updates
└── Persistence Layer
```

## Features

### 🎯 Core Capabilities
- **Real-time updates** - WebSocket-based live notifications
- **Priority management** - Critical, High, Medium, Low levels
- **Smart filtering** - By type, priority, time, or status
- **Action buttons** - Quick actions directly from notifications
- **Persistence** - Notifications survive page refreshes
- **Sound alerts** - Audio cues for critical notifications

### 📊 Notification Types

```javascript
const NotificationTypes = {
  EMERGENCY: 'emergency',      // Critical breakdowns
  BREAKDOWN: 'breakdown',      // General breakdown alerts  
  SLA: 'sla',                 // SLA warnings
  ASSIGNMENT: 'assignment',   // Task assignments
  FLEET_STATUS: 'fleet_status', // Fleet updates
  OPERATIONAL: 'operational',  // Operational alerts
  SYSTEM: 'system'            // System messages
};
```

### 🚨 Priority Levels

```javascript
const NotificationPriority = {
  CRITICAL: 'critical',  // Immediate action required
  HIGH: 'high',         // Urgent attention needed
  MEDIUM: 'medium',     // Standard priority
  LOW: 'low'           // Informational only
};
```

## Implementation

### Basic Setup

```javascript
import notificationService from '../services/notificationService';

// Initialize in your app
useEffect(() => {
  // Start real-time simulation (development)
  notificationService.startRealTimeSimulation(supervisorData);
  
  // Subscribe to updates
  const unsubscribe = notificationService.subscribe((notifications) => {
    console.log('Notifications updated:', notifications);
  });
  
  return () => unsubscribe();
}, []);
```

### Creating Notifications

```javascript
// Emergency notification
notificationService.add({
  type: NotificationTypes.EMERGENCY,
  priority: NotificationPriority.CRITICAL,
  icon: '🚨',
  title: 'Emergency Breakdown',
  message: 'Bus 5521 broken down on A1 - Passengers on board',
  busNumber: '5521',
  route: 'X10',
  location: 'A1 Northbound',
  requiresAction: true,
  actions: [
    { label: 'Assign to Me', action: 'assign_self' },
    { label: 'Dispatch Recovery', action: 'dispatch' }
  ]
});

// SLA warning
notificationService.add({
  type: NotificationTypes.SLA,
  priority: NotificationPriority.HIGH,
  icon: '⏰',
  title: 'SLA Warning',
  message: 'Bus 3421 approaching 30-minute SLA limit',
  busNumber: '3421',
  timeRemaining: '8 minutes',
  requiresAction: true,
  actions: [
    { label: 'View Details', action: 'view' },
    { label: 'Escalate', action: 'escalate' }
  ]
});
```

### Managing Notifications

```javascript
// Mark as read
notificationService.markAsRead(notificationId);

// Mark all as read
notificationService.markAllAsRead();

// Clear specific notification
notificationService.clearNotification(notificationId);

// Clear all notifications
notificationService.clearAll();

// Get unread count
const unreadCount = notificationService.getUnreadCount();

// Get critical notifications
const criticalNotifications = notificationService.getCritical();

// Check for critical notifications
if (notificationService.hasCritical()) {
  // Handle critical situation
}
```

## UI Components

### EnhancedNotifications Panel

```jsx
import EnhancedNotifications from './components/notifications/EnhancedNotifications';

<EnhancedNotifications
  isOpen={showNotifications}
  onClose={() => setShowNotifications(false)}
  supervisorData={supervisorData}
  onActionClick={(notification, action) => {
    // Handle notification action
    console.log('Action clicked:', action, notification);
  }}
/>
```

### Notification Badge

```jsx
// In your header component
<button className="notifications-btn">
  🔔
  {activeBreakdowns > 0 && (
    <span className="notification-badge">{activeBreakdowns}</span>
  )}
</button>
```

## Notification Templates

### Emergency Breakdown

```javascript
{
  type: 'emergency',
  priority: 'critical',
  icon: '🚨',
  title: 'Emergency Breakdown',
  message: 'Bus [number] broken down at [location]',
  metadata: {
    busNumber: '5521',
    route: 'X10',
    location: 'A1 Northbound',
    passengersOnBoard: true,
    driverName: 'John Smith',
    reportedTime: new Date()
  },
  requiresAction: true,
  actions: [
    { label: 'Assign to Me', action: 'assign_self' },
    { label: 'Dispatch Recovery', action: 'dispatch' },
    { label: 'Contact Driver', action: 'contact_driver' }
  ]
}
```

### SLA Warning

```javascript
{
  type: 'sla',
  priority: 'high',
  icon: '⏰',
  title: 'SLA Warning',
  message: 'Bus [number] approaching SLA limit',
  metadata: {
    busNumber: '3421',
    currentWaitTime: '22 minutes',
    slaTarget: '30 minutes',
    timeRemaining: '8 minutes',
    location: 'Durham Road'
  },
  requiresAction: true,
  actions: [
    { label: 'View Details', action: 'view_details' },
    { label: 'Escalate', action: 'escalate' },
    { label: 'Assign Engineer', action: 'assign_engineer' }
  ]
}
```

### Pattern Detection

```javascript
{
  type: 'operational',
  priority: 'medium',
  icon: '💡',
  title: 'Pattern Detected',
  message: 'Multiple brake issues on Volvo B9TL fleet',
  metadata: {
    affectedBuses: ['5521', '5522', '5525'],
    issueType: 'Brake System',
    occurrences: 3,
    timeframe: 'Last 4 hours',
    recommendation: 'Schedule fleet inspection'
  },
  requiresAction: false,
  actions: [
    { label: 'View Analysis', action: 'view_analysis' },
    { label: 'Alert Engineering', action: 'alert_engineering' }
  ]
}
```

## Filtering & Sorting

### Filter Options

```javascript
// Filter by priority
const criticalOnly = notifications.filter(
  n => n.priority === NotificationPriority.CRITICAL
);

// Filter unread
const unread = notifications.filter(n => !n.read);

// Filter by type
const slaWarnings = notifications.filter(
  n => n.type === NotificationTypes.SLA
);

// Filter by time (today)
const today = notifications.filter(n => {
  const notifDate = new Date(n.timestamp);
  const todayDate = new Date();
  return notifDate.toDateString() === todayDate.toDateString();
});
```

### Sorting

```javascript
// Sort by priority (critical first)
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
notifications.sort((a, b) => 
  priorityOrder[a.priority] - priorityOrder[b.priority]
);

// Sort by time (newest first)
notifications.sort((a, b) => 
  new Date(b.timestamp) - new Date(a.timestamp)
);
```

## Real-time Updates

### WebSocket Integration

```javascript
// Connect to WebSocket server
const ws = new WebSocket('wss://api.gonortheast.co.uk/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  notificationService.add(notification);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Fall back to polling
};
```

### Polling Fallback

```javascript
// Poll for updates if WebSocket fails
const pollNotifications = async () => {
  try {
    const response = await fetch('/api/notifications/new');
    const notifications = await response.json();
    notifications.forEach(n => notificationService.add(n));
  } catch (error) {
    console.error('Polling error:', error);
  }
};

setInterval(pollNotifications, 30000); // Every 30 seconds
```

## Sound Alerts

### Audio Configuration

```javascript
const notificationSounds = {
  critical: '/sounds/critical-alert.mp3',
  high: '/sounds/high-priority.mp3',
  medium: '/sounds/notification.mp3',
  low: null // No sound for low priority
};

// Play notification sound
const playSound = (priority) => {
  const soundFile = notificationSounds[priority];
  if (soundFile) {
    const audio = new Audio(soundFile);
    audio.play().catch(e => console.log('Audio play failed:', e));
  }
};
```

## Persistence

### LocalStorage

```javascript
// Save notifications
const saveNotifications = (notifications) => {
  localStorage.setItem('notifications', JSON.stringify(notifications));
};

// Load notifications
const loadNotifications = () => {
  const saved = localStorage.getItem('notifications');
  return saved ? JSON.parse(saved) : [];
};

// Clear old notifications (older than 7 days)
const cleanupOldNotifications = () => {
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const notifications = loadNotifications();
  const filtered = notifications.filter(n => 
    new Date(n.timestamp).getTime() > weekAgo
  );
  saveNotifications(filtered);
};
```

## Analytics

### Tracking Metrics

```javascript
// Track notification interactions
const trackNotificationAction = (notification, action) => {
  analytics.track('Notification Action', {
    notificationType: notification.type,
    priority: notification.priority,
    action: action.action,
    responseTime: Date.now() - new Date(notification.timestamp).getTime()
  });
};

// Track notification performance
const getNotificationMetrics = () => {
  return {
    totalNotifications: notifications.length,
    unreadCount: notifications.filter(n => !n.read).length,
    criticalCount: notifications.filter(n => n.priority === 'critical').length,
    averageResponseTime: calculateAverageResponseTime(),
    dismissalRate: calculateDismissalRate()
  };
};
```

## Testing

### Unit Tests

```javascript
describe('NotificationService', () => {
  it('should add notification', () => {
    const notification = { 
      type: 'emergency', 
      message: 'Test' 
    };
    notificationService.add(notification);
    expect(notificationService.getAll()).toContain(notification);
  });

  it('should mark notification as read', () => {
    const id = 'test-123';
    notificationService.markAsRead(id);
    const notification = notificationService.getById(id);
    expect(notification.read).toBe(true);
  });

  it('should filter by priority', () => {
    const critical = notificationService.getCritical();
    expect(critical.every(n => n.priority === 'critical')).toBe(true);
  });
});
```

## Best Practices

1. **Priority Assignment**
   - Use CRITICAL only for immediate safety concerns
   - Use HIGH for SLA risks and urgent issues
   - Use MEDIUM for standard operational alerts
   - Use LOW for informational messages

2. **Action Design**
   - Limit to 2-3 actions per notification
   - Make primary action obvious
   - Use clear, action-oriented labels

3. **Message Content**
   - Keep messages concise (<100 characters)
   - Include essential details in metadata
   - Use consistent terminology

4. **Performance**
   - Limit notifications to 100 in memory
   - Archive older notifications
   - Debounce rapid updates

5. **User Experience**
   - Group similar notifications
   - Allow bulk actions
   - Provide clear timestamps
   - Show relative time ("2 mins ago")

## Troubleshooting

### Common Issues

#### Notifications not appearing
- Check WebSocket connection
- Verify subscription is active
- Ensure notifications panel is mounted

#### Badge count incorrect
- Verify priority filtering logic
- Check unread status updates
- Ensure state synchronization

#### Actions not working
- Verify action handlers are defined
- Check event propagation
- Ensure proper routing setup

## API Reference

### NotificationService Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `add(notification)` | `Object` | `void` | Add new notification |
| `markAsRead(id)` | `String` | `void` | Mark notification as read |
| `markAllAsRead()` | - | `void` | Mark all as read |
| `clearNotification(id)` | `String` | `void` | Remove notification |
| `clearAll()` | - | `void` | Clear all notifications |
| `getAll()` | - | `Array` | Get all notifications |
| `getUnreadCount()` | - | `Number` | Count unread notifications |
| `getCritical()` | - | `Array` | Get critical notifications |
| `subscribe(callback)` | `Function` | `Function` | Subscribe to updates |

## Support

For issues or enhancements:
- Review existing issues on GitHub
- Contact the development team
- Check system status page

---

*Last updated: January 2024*