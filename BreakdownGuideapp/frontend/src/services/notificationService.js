// Notification Service for Go North East Breakdown Management System
// Phase 7.5: Duty-Aware Notifications - Only notify during active duty
import { apiConfig } from '../breakdown-guide/components/common/constants';

// Standard duty shift definitions (matching backend)
const DUTY_SHIFTS = {
  '100': { name: 'Early Shift', start: '06:00', end: '15:30' },
  '200': { name: 'Day Shift', start: '07:30', end: '17:00' },
  '400': { name: 'Late Shift', start: '12:30', end: '22:00' },
  '500': { name: 'Night Shift', start: '14:45', end: '00:15' }
};

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
    this.dutyAwareEnabled = true; // Phase 7.5: Enable duty-aware notifications by default
    this.emergencyOverrideEnabled = true; // Phase 7.5: Always allow emergency notifications
    this.loadSettings();
  }

  // Phase 7.5: Load settings from localStorage
  loadSettings() {
    try {
      const stored = localStorage.getItem('dutyAwareNotificationSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.dutyAwareEnabled = settings.dutyAwareEnabled ?? true;
        this.emergencyOverrideEnabled = settings.emergencyOverrideEnabled ?? true;
      }
    } catch (e) {
      console.warn('Error loading notification settings:', e);
    }
  }

  // Phase 7.5: Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('dutyAwareNotificationSettings', JSON.stringify({
        dutyAwareEnabled: this.dutyAwareEnabled,
        emergencyOverrideEnabled: this.emergencyOverrideEnabled
      }));
    } catch (e) {
      console.warn('Error saving notification settings:', e);
    }
  }

  // Phase 7.5: Check if supervisor is currently on duty
  isOnDuty() {
    try {
      const stored = sessionStorage.getItem('currentDuty');
      if (!stored) return false;

      const duty = JSON.parse(stored);
      if (!duty?.code) return false;

      const shiftInfo = DUTY_SHIFTS[duty.code];
      if (!shiftInfo) return true; // Custom duty, assume on duty

      // Check if current time is within shift hours
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = shiftInfo.start.split(':').map(Number);
      const [endH, endM] = shiftInfo.end.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;

      // Handle overnight shifts
      if (endMinutes < startMinutes) {
        // Shift crosses midnight
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }

      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch (e) {
      console.error('Error checking duty status:', e);
      return false;
    }
  }

  // Phase 7.5: Check if notifications should be shown
  shouldShowNotifications(isEmergency = false) {
    // Emergency override: always show emergency notifications if override is enabled
    if (isEmergency && this.emergencyOverrideEnabled) {
      console.log('🚨 Emergency notification - bypassing duty check');
      return true;
    }

    // If duty-aware is disabled, always show
    if (!this.dutyAwareEnabled) return true;

    // Otherwise, only show if on duty
    return this.isOnDuty();
  }

  // Phase 7.5: Enable/disable duty-aware mode
  setDutyAwareEnabled(enabled) {
    this.dutyAwareEnabled = enabled;
    this.saveSettings();
    console.log(`📢 Duty-aware notifications: ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Phase 7.5: Enable/disable emergency override
  setEmergencyOverrideEnabled(enabled) {
    this.emergencyOverrideEnabled = enabled;
    this.saveSettings();
    console.log(`🚨 Emergency override: ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Phase 7.5: Get current settings
  getSettings() {
    return {
      dutyAwareEnabled: this.dutyAwareEnabled,
      emergencyOverrideEnabled: this.emergencyOverrideEnabled,
      isOnDuty: this.isOnDuty()
    };
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

        // Phase 7.5: Check if emergency/critical notification
        const isEmergency = randomNotification.priority === NotificationPriority.CRITICAL ||
                           randomNotification.type === NotificationTypes.EMERGENCY;

        // Phase 7.5: Only send notifications if on duty (or emergency override)
        if (!this.shouldShowNotifications(isEmergency)) {
          console.log('📵 Notification suppressed - not on duty');
          return;
        }

        this.notifications.unshift(randomNotification);
        this.notifySubscribers();

        // Play notification sound if critical
        if (isEmergency) {
          this.playNotificationSound('critical', true);
        } else {
          this.playNotificationSound('normal', false);
        }
      }
    }, 45000); // Every 45 seconds
  }

  // Play notification sound
  playNotificationSound(type = 'normal', isEmergency = false) {
    // Phase 7.5: Only play sounds if on duty (or emergency override)
    if (!this.shouldShowNotifications(isEmergency)) {
      console.log('🔇 Sound suppressed - not on duty');
      return;
    }

    // Implementation would use Web Audio API or <audio> element
    console.log(`🔊 Notification sound: ${type}${isEmergency ? ' (emergency)' : ''}`);
  }

  // Phase 7.5: Send browser notification (duty-aware with emergency override)
  sendBrowserNotification(title, options = {}) {
    const isEmergency = options.priority === NotificationPriority.CRITICAL ||
                        options.type === NotificationTypes.EMERGENCY ||
                        options.isEmergency === true;

    // Only send if on duty (or emergency override)
    if (!this.shouldShowNotifications(isEmergency)) {
      console.log('📵 Browser notification suppressed - not on duty');
      return;
    }

    // Check if browser notifications are supported and permitted
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/barry-icon.png',
        badge: '/icons/barry-badge.png',
        tag: options.tag || 'barry-notification',
        requireInteraction: isEmergency, // Emergency notifications require interaction
        ...options
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.sendBrowserNotification(title, options);
        }
      });
    }
  }

  // Phase 7.5: Get duty status for display
  getDutyStatus() {
    const onDuty = this.isOnDuty();
    const stored = sessionStorage.getItem('currentDuty');
    let dutyInfo = null;

    if (stored) {
      try {
        dutyInfo = JSON.parse(stored);
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return {
      isOnDuty: onDuty,
      dutyCode: dutyInfo?.code || null,
      dutyName: dutyInfo?.name || null,
      notificationsEnabled: this.dutyAwareEnabled ? onDuty : true
    };
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