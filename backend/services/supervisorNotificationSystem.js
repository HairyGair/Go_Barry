// Supervisor Notification System for Critical Route Impacts
// Advanced notification engine with multiple delivery channels and intelligent scheduling
// Memory-optimized for Go North East operational requirements

import { createClient } from '@supabase/supabase-js';
import memoryMonitor from './memoryMonitor.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Supervisor Notification System
 * Manages intelligent notification delivery for critical route impacts
 */
class SupervisorNotificationSystem {
  constructor() {
    this.notificationQueue = [];
    this.maxQueueSize = 100; // Memory constraint
    this.isProcessingQueue = false;
    this.deliveryMethods = new Map();
    this.notificationStats = {
      total_sent: 0,
      critical_sent: 0,
      failed_deliveries: 0,
      average_delivery_time: 0
    };
    
    // Notification templates
    this.templates = new Map();
    
    // Supervisor preferences and schedules
    this.supervisorPreferences = new Map();
    
    // Initialize delivery methods
    this.initializeDeliveryMethods();
    
    // Register memory cleanup
    this.registerMemoryCleanup();
    
    // Start queue processor
    this.startQueueProcessor();
  }

  /**
   * Register memory cleanup callback
   */
  registerMemoryCleanup() {
    if (typeof memoryMonitor?.registerCleanupCallback === 'function') {
      memoryMonitor.registerCleanupCallback((level) => {
        console.log(`🧹 Supervisor Notification System: ${level} memory cleanup`);
        
        if (level === 'emergency') {
          // Emergency: Keep only critical notifications
          this.notificationQueue = this.notificationQueue.filter(n => n.priority_level === 'CRITICAL');
          console.log(`🚨 Emergency cleanup: Kept ${this.notificationQueue.length} critical notifications`);
        } else {
          // Preventive: Trim queue to half size
          this.notificationQueue = this.notificationQueue.slice(-Math.floor(this.maxQueueSize / 2));
          console.log(`🧹 Preventive cleanup: Queue trimmed to ${this.notificationQueue.length} items`);
        }
      });
    }
  }

  /**
   * Initialize available delivery methods
   */
  initializeDeliveryMethods() {
    // Dashboard notification (always available)
    this.deliveryMethods.set('dashboard', {
      name: 'Dashboard Alert',
      enabled: true,
      priority: 1,
      delivery_time_seconds: 1
    });

    // Email notification (if configured)
    this.deliveryMethods.set('email', {
      name: 'Email Alert',
      enabled: !!process.env.EMAIL_SERVICE_CONFIGURED,
      priority: 2,
      delivery_time_seconds: 5
    });

    // SMS notification (if configured)
    this.deliveryMethods.set('sms', {
      name: 'SMS Alert',
      enabled: !!process.env.SMS_SERVICE_CONFIGURED,
      priority: 3,
      delivery_time_seconds: 3
    });

    // Teams/Slack integration (if configured)
    this.deliveryMethods.set('teams', {
      name: 'Microsoft Teams',
      enabled: !!process.env.TEAMS_WEBHOOK_URL,
      priority: 4,
      delivery_time_seconds: 2
    });

    console.log(`📢 Initialized ${this.deliveryMethods.size} notification delivery methods`);
  }

  /**
   * Load notification templates from database
   */
  async loadNotificationTemplates() {
    try {
      const { data: templates, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('category', 'streetmanager_notifications');

      if (error) throw error;

      templates.forEach(template => {
        this.templates.set(template.title, template);
      });

      console.log(`📋 Loaded ${this.templates.size} notification templates`);
    } catch (error) {
      console.warn('⚠️ Could not load templates from database:', error.message);
      this.loadDefaultTemplates();
    }
  }

  /**
   * Load default notification templates
   */
  loadDefaultTemplates() {
    const defaultTemplates = [
      {
        title: 'critical_route_closure',
        message: 'CRITICAL ALERT: Road closure affecting {{route_count}} routes\n\nLocation: {{location}}\nRoutes: {{affected_routes}}\nStart: {{start_time}}\n\nAction Required: Plan diversions immediately',
        priority: 'CRITICAL'
      },
      {
        title: 'high_impact_works',
        message: 'HIGH IMPACT: Streetworks affecting {{route_count}} routes\n\nLocation: {{location}}\nRoutes: {{affected_routes}}\nSeverity: {{severity}}\n\nRecommended: Monitor delays and consider contingencies',
        priority: 'HIGH'
      },
      {
        title: 'advance_warning',
        message: 'ADVANCE NOTICE: Upcoming works in {{advance_hours}} hours\n\nLocation: {{location}}\nRoutes: {{affected_routes}}\nExpected Impact: {{impact_type}}\n\nPlanning Time Available',
        priority: 'MEDIUM'
      },
      {
        title: 'emergency_works',
        message: 'EMERGENCY WORKS: Immediate action required\n\nLocation: {{location}}\nRoutes: {{affected_routes}}\nStatus: IN PROGRESS\n\nContact traffic management immediately',
        priority: 'CRITICAL'
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.title, template);
    });

    console.log('📋 Loaded default notification templates');
  }

  /**
   * Load supervisor preferences and schedules
   */
  async loadSupervisorPreferences() {
    try {
      const { data: supervisors, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      supervisors.forEach(supervisor => {
        this.supervisorPreferences.set(supervisor.badge, {
          id: supervisor.id,
          name: supervisor.name,
          badge: supervisor.badge,
          role: supervisor.role,
          shift: supervisor.shift,
          notification_methods: this.getDefaultNotificationMethods(supervisor.role),
          critical_only: supervisor.role === 'observer',
          timezone: 'Europe/London'
        });
      });

      console.log(`👥 Loaded preferences for ${this.supervisorPreferences.size} supervisors`);
    } catch (error) {
      console.warn('⚠️ Could not load supervisor preferences:', error.message);
    }
  }

  /**
   * Get default notification methods based on supervisor role
   */
  getDefaultNotificationMethods(role) {
    switch (role) {
      case 'senior_supervisor':
        return ['dashboard', 'email', 'sms'];
      case 'supervisor':
        return ['dashboard', 'email'];
      case 'trainee':
        return ['dashboard'];
      default:
        return ['dashboard'];
    }
  }

  /**
   * Create and queue a notification for critical route impacts
   */
  async createNotification(streetworkData, options = {}) {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`📢 [${notificationId}] Creating notification for ${streetworkData.affected_route_count} affected routes`);

      // Determine notification type and priority
      const notificationType = this.determineNotificationType(streetworkData);
      const priority = this.calculatePriority(streetworkData);
      
      // Generate notification content
      const content = await this.generateNotificationContent(streetworkData, notificationType);
      
      // Calculate delivery timing
      const deliveryTiming = this.calculateDeliveryTiming(streetworkData, priority);
      
      // Determine target supervisors
      const targetSupervisors = await this.determineTargetSupervisors(streetworkData, priority);

      // Create notification record
      const notification = {
        id: notificationId,
        streetwork_id: streetworkData.id,
        notification_type: notificationType,
        priority_level: priority,
        title: content.title,
        message: content.message,
        affected_routes: streetworkData.affected_route_numbers,
        scheduled_for: deliveryTiming.scheduled_for,
        advance_notice_hours: deliveryTiming.advance_notice_hours,
        target_supervisors: targetSupervisors,
        delivery_methods: this.selectDeliveryMethods(priority, targetSupervisors),
        created_at: new Date().toISOString(),
        metadata: {
          severity: streetworkData.impact_severity,
          route_count: streetworkData.affected_route_count,
          escalation_level: streetworkData.escalation_level
        }
      };

      // Save to database
      const savedNotification = await this.saveNotification(notification);
      
      // Queue for delivery
      if (savedNotification.success) {
        this.queueNotification(notification);
        console.log(`✅ [${notificationId}] Notification queued for delivery at ${deliveryTiming.scheduled_for}`);
      }

      return {
        success: savedNotification.success,
        notification_id: notificationId,
        scheduled_for: deliveryTiming.scheduled_for,
        target_count: targetSupervisors.length,
        delivery_methods: notification.delivery_methods
      };

    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine notification type based on streetwork characteristics
   */
  determineNotificationType(streetworkData) {
    if (streetworkData.traffic_management_type === 'road_closure') {
      return 'ROUTE_CLOSURE';
    }
    
    if (streetworkData.impact_severity === 'CRITICAL') {
      return 'CRITICAL_IMPACT';
    }
    
    if (streetworkData.escalation_level >= 2) {
      return 'DIVERSION_REQUIRED';
    }
    
    if (streetworkData.proposed_start_date && 
        new Date(streetworkData.proposed_start_date) > new Date()) {
      return 'ADVANCE_WARNING';
    }
    
    if (streetworkData.route_impact_analysis?.severity_analysis?.matched_rule === 'emergency_works') {
      return 'EMERGENCY_WORKS';
    }
    
    return 'TIMING_CHANGE';
  }

  /**
   * Calculate notification priority
   */
  calculatePriority(streetworkData) {
    // Critical conditions
    if (streetworkData.impact_severity === 'CRITICAL' ||
        streetworkData.escalation_level >= 3 ||
        streetworkData.affected_route_count > 10) {
      return 'CRITICAL';
    }

    // High priority conditions
    if (streetworkData.impact_severity === 'HIGH' ||
        streetworkData.escalation_level >= 2 ||
        streetworkData.affected_route_count > 5) {
      return 'HIGH';
    }

    // Medium priority conditions
    if (streetworkData.requires_supervisor_notification ||
        streetworkData.affected_route_count > 2) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Generate notification content using templates
   */
  async generateNotificationContent(streetworkData, notificationType) {
    const templateKey = notificationType.toLowerCase();
    const template = this.templates.get(templateKey) || this.templates.get('high_impact_works');
    
    // Prepare template variables
    const variables = {
      location: streetworkData.location_description || 'Unknown location',
      affected_routes: streetworkData.affected_route_numbers.slice(0, 5).join(', '),
      route_count: streetworkData.affected_route_count,
      severity: streetworkData.impact_severity,
      start_time: streetworkData.proposed_start_date ? 
        new Date(streetworkData.proposed_start_date).toLocaleDateString() : 'Immediate',
      impact_type: this.summarizeImpactType(streetworkData),
      advance_hours: this.calculateAdvanceHours(streetworkData)
    };

    // Replace template variables
    let message = template.message;
    let title = streetworkData.title;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, value);
      title = title.replace(regex, value);
    }

    return {
      title: title,
      message: message,
      template_used: templateKey
    };
  }

  /**
   * Calculate delivery timing based on streetwork schedule and priority
   */
  calculateDeliveryTiming(streetworkData, priority) {
    const now = new Date();
    let scheduledFor = now;
    let advanceNoticeHours = 0;

    // For future works, calculate advance notice
    if (streetworkData.proposed_start_date) {
      const startDate = new Date(streetworkData.proposed_start_date);
      
      // Determine advance notice based on priority
      switch (priority) {
        case 'CRITICAL':
          advanceNoticeHours = 24; // 1 day advance notice
          break;
        case 'HIGH':
          advanceNoticeHours = 12; // 12 hours advance notice
          break;
        case 'MEDIUM':
          advanceNoticeHours = 6; // 6 hours advance notice
          break;
        default:
          advanceNoticeHours = 2; // 2 hours advance notice
      }

      scheduledFor = new Date(startDate.getTime() - (advanceNoticeHours * 60 * 60 * 1000));
      
      // Don't schedule in the past
      if (scheduledFor < now) {
        scheduledFor = now;
        advanceNoticeHours = Math.round((startDate.getTime() - now.getTime()) / (60 * 60 * 1000));
      }
    }

    return {
      scheduled_for: scheduledFor.toISOString(),
      advance_notice_hours: advanceNoticeHours
    };
  }

  /**
   * Determine which supervisors should receive the notification
   */
  async determineTargetSupervisors(streetworkData, priority) {
    const targets = [];

    // Get currently active supervisors
    try {
      const { data: activeSupervisors, error } = await supabase
        .from('supervisor_sessions')
        .select(`
          supervisor_id,
          badge,
          supervisors(name, role, shift)
        `)
        .gt('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 minutes

      if (error) throw error;

      for (const session of activeSupervisors) {
        const supervisor = session.supervisors;
        
        // Include all supervisors for critical notifications
        if (priority === 'CRITICAL') {
          targets.push(session.badge);
          continue;
        }

        // Include senior supervisors for high priority
        if (priority === 'HIGH' && supervisor.role === 'senior_supervisor') {
          targets.push(session.badge);
          continue;
        }

        // Include all active supervisors for medium priority
        if (priority === 'MEDIUM') {
          targets.push(session.badge);
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not determine active supervisors:', error.message);
      // Fallback: notify all supervisors for critical alerts
      if (priority === 'CRITICAL') {
        return Array.from(this.supervisorPreferences.keys());
      }
    }

    return targets.length > 0 ? targets : ['AG003', 'BP009']; // Fallback to admin supervisors
  }

  /**
   * Select delivery methods based on priority and supervisor preferences
   */
  selectDeliveryMethods(priority, targetSupervisors) {
    const methods = ['dashboard']; // Always include dashboard

    if (priority === 'CRITICAL') {
      methods.push('email');
      if (this.deliveryMethods.get('sms')?.enabled) {
        methods.push('sms');
      }
    } else if (priority === 'HIGH') {
      methods.push('email');
    }

    return methods;
  }

  /**
   * Save notification to database
   */
  async saveNotification(notification) {
    try {
      const { data, error } = await supabase
        .from('supervisor_notifications')
        .insert({
          streetwork_id: notification.streetwork_id,
          notification_type: notification.notification_type,
          priority_level: notification.priority_level,
          title: notification.title,
          message: notification.message,
          affected_routes: notification.affected_routes,
          scheduled_for: notification.scheduled_for,
          advance_notice_hours: notification.advance_notice_hours
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };

    } catch (error) {
      console.error('❌ Failed to save notification to database:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue notification for delivery
   */
  queueNotification(notification) {
    // Add to queue if not full
    if (this.notificationQueue.length < this.maxQueueSize) {
      this.notificationQueue.push(notification);
      
      // Sort queue by priority and scheduled time
      this.notificationQueue.sort((a, b) => {
        const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        const priorityA = priorityOrder[a.priority_level] || 3;
        const priorityB = priorityOrder[b.priority_level] || 3;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        return new Date(a.scheduled_for) - new Date(b.scheduled_for);
      });
    } else {
      console.warn('⚠️ Notification queue full, dropping notification');
    }
  }

  /**
   * Start the queue processor
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.notificationQueue.length > 0) {
        await this.processNotificationQueue();
      }
    }, 30000); // Check every 30 seconds

    console.log('🔄 Notification queue processor started');
  }

  /**
   * Process notifications in the queue
   */
  async processNotificationQueue() {
    this.isProcessingQueue = true;
    const now = new Date();

    try {
      const dueNotifications = this.notificationQueue.filter(n => 
        new Date(n.scheduled_for) <= now
      );

      for (const notification of dueNotifications) {
        await this.deliverNotification(notification);
        
        // Remove from queue
        const index = this.notificationQueue.indexOf(notification);
        if (index > -1) {
          this.notificationQueue.splice(index, 1);
        }
      }

    } catch (error) {
      console.error('❌ Error processing notification queue:', error.message);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Deliver a notification using selected methods
   */
  async deliverNotification(notification) {
    const deliveryStart = Date.now();
    const deliveryResults = [];

    try {
      console.log(`📤 Delivering ${notification.priority_level} notification: ${notification.title}`);

      for (const method of notification.delivery_methods) {
        const result = await this.deliverViaMethod(notification, method);
        deliveryResults.push({ method, success: result.success, error: result.error });
      }

      // Update notification status in database
      await this.updateNotificationStatus(notification, deliveryResults);

      // Update statistics
      this.updateDeliveryStats(deliveryStart, true);

      console.log(`✅ Notification delivered via ${deliveryResults.filter(r => r.success).length}/${deliveryResults.length} methods`);

    } catch (error) {
      console.error(`❌ Failed to deliver notification:`, error.message);
      this.updateDeliveryStats(deliveryStart, false);
    }
  }

  /**
   * Deliver notification via specific method
   */
  async deliverViaMethod(notification, method) {
    switch (method) {
      case 'dashboard':
        return await this.deliverToDashboard(notification);
      case 'email':
        return await this.deliverViaEmail(notification);
      case 'sms':
        return await this.deliverViaSMS(notification);
      case 'teams':
        return await this.deliverViaTeams(notification);
      default:
        return { success: false, error: `Unknown delivery method: ${method}` };
    }
  }

  /**
   * Deliver notification to dashboard (Supabase realtime)
   */
  async deliverToDashboard(notification) {
    try {
      // Insert into dashboard_notifications table for realtime updates
      const { error } = await supabase
        .from('dashboard_notifications')
        .insert({
          notification_id: notification.id,
          title: notification.title,
          message: notification.message,
          priority: notification.priority_level,
          type: notification.notification_type,
          affected_routes: notification.affected_routes,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Deliver notification via email (placeholder - would integrate with email service)
   */
  async deliverViaEmail(notification) {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('📧 Email delivery would send:', notification.title);
    return { success: true, note: 'Email service not implemented' };
  }

  /**
   * Deliver notification via SMS (placeholder - would integrate with SMS service)
   */
  async deliverViaSMS(notification) {
    // This would integrate with your SMS service (Twilio, AWS SNS, etc.)
    console.log('📱 SMS delivery would send:', notification.title);
    return { success: true, note: 'SMS service not implemented' };
  }

  /**
   * Deliver notification via Teams (placeholder - would use webhook)
   */
  async deliverViaTeams(notification) {
    // This would send to Microsoft Teams webhook
    console.log('💬 Teams delivery would send:', notification.title);
    return { success: true, note: 'Teams integration not implemented' };
  }

  /**
   * Update notification delivery status in database
   */
  async updateNotificationStatus(notification, deliveryResults) {
    try {
      const successful = deliveryResults.filter(r => r.success).length;
      const failed = deliveryResults.length - successful;

      await supabase
        .from('supervisor_notifications')
        .update({
          sent: successful > 0,
          sent_at: new Date().toISOString(),
          delivery_method: deliveryResults.filter(r => r.success).map(r => r.method),
          delivery_status: {
            successful: successful,
            failed: failed,
            results: deliveryResults
          }
        })
        .eq('streetwork_id', notification.streetwork_id);

    } catch (error) {
      console.error('❌ Failed to update notification status:', error.message);
    }
  }

  /**
   * Helper methods
   */
  summarizeImpactType(streetworkData) {
    if (streetworkData.traffic_management_type === 'road_closure') {
      return 'Road closure requiring diversions';
    }
    
    if (streetworkData.impact_severity === 'CRITICAL') {
      return 'Critical disruption to services';
    }
    
    return 'Potential delays and timing impacts';
  }

  calculateAdvanceHours(streetworkData) {
    if (!streetworkData.proposed_start_date) return 0;
    
    const startDate = new Date(streetworkData.proposed_start_date);
    const now = new Date();
    
    return Math.round((startDate.getTime() - now.getTime()) / (60 * 60 * 1000));
  }

  updateDeliveryStats(startTime, success) {
    this.notificationStats.total_sent++;
    
    if (success) {
      const deliveryTime = Date.now() - startTime;
      this.notificationStats.average_delivery_time = 
        (this.notificationStats.average_delivery_time * (this.notificationStats.total_sent - 1) + deliveryTime) / 
        this.notificationStats.total_sent;
    } else {
      this.notificationStats.failed_deliveries++;
    }
  }

  /**
   * Get system status and statistics
   */
  getStatus() {
    return {
      queue_size: this.notificationQueue.length,
      max_queue_size: this.maxQueueSize,
      is_processing: this.isProcessingQueue,
      delivery_methods: Object.fromEntries(this.deliveryMethods),
      templates_loaded: this.templates.size,
      supervisor_preferences: this.supervisorPreferences.size,
      statistics: this.notificationStats
    };
  }

  /**
   * Initialize the notification system
   */
  async initialize() {
    try {
      console.log('📢 Initializing Supervisor Notification System...');
      
      await this.loadNotificationTemplates();
      await this.loadSupervisorPreferences();
      
      console.log('✅ Supervisor Notification System ready');
      return true;
    } catch (error) {
      console.error('❌ Notification system initialization failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const notificationSystem = new SupervisorNotificationSystem();

export default notificationSystem;
export { SupervisorNotificationSystem };