// Notification Service for Go North East Breakdown Management System
import { apiConfig } from '../breakdown-guide/components/common/constants';

// Notification types and priorities
export const NotificationTypes = {
  EMERGENCY: 'emergency',
  BREAKDOWN: 'breakdown',
  SLA: 'sla',
  ASSIGNMENT: 'assignment',
  FLEET_STATUS: 'fleet_status',
  OPERATIONAL: 'operational',
  SYSTEM: 'system'
};

export const NotificationPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Real-time notification service
class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
  }

  // Generate realistic notifications based on supervisor context
  generateNotifications(supervisorData) {
    const templates = [
      // Critical/Emergency
      {
        id: `emrg-${Date.now()}-1`,
        type: NotificationTypes.EMERGENCY,
        priority: NotificationPriority.CRITICAL,
        icon: '🚨',
        title: 'Emergency Breakdown',
        message: 'Bus 5521 broken down on A1 - Passengers on board',
        location: 'A1 Northbound, Near Team Valley',
        busNumber: '5521',
        route: 'X10',
        time: 'Just now',
        requiresAction: true,
        actions: [
          { label: 'Assign to Me', action: 'assign_self' },
          { label: 'Dispatch Recovery', action: 'dispatch' }
        ]
      },
      
      // SLA Warnings
      {
        id: `sla-${Date.now()}-1`,
        type: NotificationTypes.SLA,
        priority: NotificationPriority.HIGH,
        icon: '⏰',
        title: 'SLA Warning',
        message: 'Bus 3421 approaching 30-minute SLA limit',
        busNumber: '3421',
        timeRemaining: '8 minutes',
        time: '2 mins ago',
        requiresAction: true,
        actions: [
          { label: 'View Details', action: 'view' },
          { label: 'Escalate', action: 'escalate' }
        ]
      },
      
      // New Assignment
      {
        id: `assign-${Date.now()}-1`,
        type: NotificationTypes.ASSIGNMENT,
        priority: NotificationPriority.MEDIUM,
        icon: '📋',
        title: 'New Assignment',
        message: 'Breakdown assessment assigned to you',
        busNumber: '4892',
        route: '21',
        location: 'Durham Road, Gateshead',
        time: '5 mins ago',
        requiresAction: true,
        actions: [
          { label: 'Start Assessment', action: 'start_assessment' },
          { label: 'View Location', action: 'view_map' }
        ]
      },
      
      // Fleet Status Update
      {
        id: `fleet-${Date.now()}-1`,
        type: NotificationTypes.FLEET_STATUS,
        priority: NotificationPriority.LOW,
        icon: '✅',
        title: 'Bus Back in Service',
        message: 'Bus 3302 repairs completed and operational',
        busNumber: '3302',
        downtime: '2h 15m',
        time: '10 mins ago',
        requiresAction: false
      },
      
      // Operational Alert
      {
        id: `ops-${Date.now()}-1`,
        type: NotificationTypes.OPERATIONAL,
        priority: NotificationPriority.MEDIUM,
        icon: '📊',
        title: 'High Breakdown Rate',
        message: 'SDC depot: 5 breakdowns in last hour (3x normal)',
        metric: '5 breakdowns/hour',
        trend: 'increasing',
        time: '15 mins ago',
        requiresAction: false,
        actions: [
          { label: 'View Dashboard', action: 'dashboard' }
        ]
      },
      
      // Pattern Detection
      {
        id: `pattern-${Date.now()}-1`,
        type: NotificationTypes.OPERATIONAL,
        priority: NotificationPriority.MEDIUM,
        icon: '💡',
        title: 'Pattern Detected',
        message: '3 brake-related issues on Volvo B9TL fleet today',
        affectedBuses: ['5521', '5522', '5525'],
        issueType: 'Brake System',
        time: '30 mins ago',
        requiresAction: false,
        actions: [
          { label: 'View Analysis', action: 'view_analysis' },
          { label: 'Alert Engineering', action: 'alert_engineering' }
        ]
      },
      
      // Weather Alert
      {
        id: `weather-${Date.now()}-1`,
        type: NotificationTypes.SYSTEM,
        priority: NotificationPriority.HIGH,
        icon: '🌨️',
        title: 'Weather Warning',
        message: 'Heavy snow forecast - Prepare for increased breakdowns',
        severity: 'Amber Warning',
        expectedImpact: 'High',
        time: '1 hour ago',
        requiresAction: true,
        actions: [
          { label: 'View Contingency Plan', action: 'contingency' }
        ]
      }
    ];

    // Return relevant notifications based on supervisor
    return templates;
  }

  // Get notifications for specific supervisor
  async fetchNotifications(supervisorId) {
    // Note: Notifications API endpoint not yet implemented
    // Using mock notifications for now
    console.log('📧 Using mock notifications (API endpoint not implemented)');
    
    // Return mock notifications
    return this.generateNotifications();
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  // Clear notification
  clearNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifySubscribers();
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  // Get count of unread notifications
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get notifications by priority
  getByPriority(priority) {
    return this.notifications.filter(n => n.priority === priority);
  }

  // Get critical notifications
  getCritical() {
    return this.getByPriority(NotificationPriority.CRITICAL);
  }

  // Check if any critical notifications exist
  hasCritical() {
    return this.getCritical().length > 0;
  }

  // Simulate real-time notifications
  startRealTimeSimulation(supervisorData) {
    // Add a new notification every 30-60 seconds for demo
    setInterval(() => {
      const random = Math.random();
      if (random > 0.7) {
        const newNotifications = this.generateNotifications(supervisorData);
        const randomNotification = newNotifications[Math.floor(Math.random() * newNotifications.length)];
        randomNotification.id = `rt-${Date.now()}`;
        randomNotification.time = 'Just now';
        randomNotification.read = false;
        this.notifications.unshift(randomNotification);
        this.notifySubscribers();
        
        // Play notification sound if critical
        if (randomNotification.priority === NotificationPriority.CRITICAL) {
          this.playNotificationSound('critical');
        } else {
          this.playNotificationSound('normal');
        }
      }
    }, 45000); // Every 45 seconds
  }

  // Play notification sound
  playNotificationSound(type = 'normal') {
    // Implementation would use Web Audio API or <audio> element
    console.log(`🔊 Notification sound: ${type}`);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export for use in components
export default notificationService;

// Notification formatter for display
export const formatNotification = (notification) => {
  const { type, priority, icon, title, message, time, requiresAction } = notification;
  
  return {
    icon: icon || getIconForType(type),
    title: title || getTitleForType(type),
    message,
    time,
    className: `notification-${priority}`,
    requiresAction,
    isUrgent: priority === NotificationPriority.CRITICAL || priority === NotificationPriority.HIGH
  };
};

// Helper to get icon based on type
const getIconForType = (type) => {
  const icons = {
    [NotificationTypes.EMERGENCY]: '🚨',
    [NotificationTypes.BREAKDOWN]: '🔧',
    [NotificationTypes.SLA]: '⏰',
    [NotificationTypes.ASSIGNMENT]: '📋',
    [NotificationTypes.FLEET_STATUS]: '🚌',
    [NotificationTypes.OPERATIONAL]: '📊',
    [NotificationTypes.SYSTEM]: 'ℹ️'
  };
  return icons[type] || '🔔';
};

// Helper to get title based on type
const getTitleForType = (type) => {
  const titles = {
    [NotificationTypes.EMERGENCY]: 'Emergency',
    [NotificationTypes.BREAKDOWN]: 'Breakdown Alert',
    [NotificationTypes.SLA]: 'SLA Warning',
    [NotificationTypes.ASSIGNMENT]: 'New Assignment',
    [NotificationTypes.FLEET_STATUS]: 'Fleet Update',
    [NotificationTypes.OPERATIONAL]: 'Operational Alert',
    [NotificationTypes.SYSTEM]: 'System Message'
  };
  return titles[type] || 'Notification';
};