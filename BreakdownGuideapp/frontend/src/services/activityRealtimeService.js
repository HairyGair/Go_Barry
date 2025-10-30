/**
 * Real-time Activity Service
 *
 * Handles real-time subscriptions for activities and provides
 * a unified interface for subscribing to activity updates across the app.
 * Supabase removed - now uses backend MySQL API with WebSocket
 */

// Supabase import removed - no longer using Supabase real-time

// Activity event types
export const ACTIVITY_EVENTS = {
  NEW_ACTIVITY: 'new_activity',
  ACTIVITY_UPDATED: 'activity_updated',
  CONNECTION_CHANGED: 'connection_changed',
  ERROR: 'error'
};

class ActivityRealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.channels = new Map();
    this.connectionChannel = null; // For connection monitoring
    this.isConnected = false;
    this.subscribers = new Map();
    this.activityBuffer = [];
    this.maxBufferSize = 100;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second

    // Event emitter pattern
    this.events = new Map();

    this.init();
  }

  /**
   * Initialize the service
   */
  async init() {
    try {
      console.log('🔄 Initializing Activity Real-time Service...');

      // Supabase removed - now uses backend MySQL API
      // Connection would be established through WebSocket to backend

      // Set up connection monitoring
      this.setupConnectionMonitoring();

      console.log('✅ Activity Real-time Service initialized (backend mode)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Activity Real-time Service:', error);
      return false;
    }
  }

  /**
   * Subscribe to all activity changes
   */
  subscribeToActivities(callback, options = {}) {
    const subscriptionId = this.generateSubscriptionId();
    const {
      filter = {},
      bufferUpdates = true,
      includeExisting = false
    } = options;

    try {
      // Supabase removed - now uses backend MySQL API
      // TODO: Implement WebSocket subscription to backend API

      // Store subscription info (placeholder)
      this.subscriptions.set(subscriptionId, {
        callback,
        options,
        filter,
        active: true,
        createdAt: new Date()
      });

      console.log(`📡 Created activity subscription: ${subscriptionId}`);

      // If requested, fetch existing activities
      if (includeExisting) {
        this.fetchRecentActivities(filter).then(activities => {
          activities.forEach(activity => {
            callback({
              eventType: 'existing',
              new: activity,
              old: null,
              table: 'activities'
            });
          });
        });
      }

      return subscriptionId;
    } catch (error) {
      console.error('❌ Failed to subscribe to activities:', error);
      this.emit(ACTIVITY_EVENTS.ERROR, { error, subscriptionId: null });
      return null;
    }
  }

  /**
   * Subscribe to specific breakdown activities
   */
  subscribeToBreakdownActivities(breakdownId, callback) {
    return this.subscribeToActivities(callback, {
      filter: { entity_id: breakdownId },
      bufferUpdates: false
    });
  }

  /**
   * Subscribe to supervisor activities
   */
  subscribeToSupervisorActivities(supervisorId, callback) {
    return this.subscribeToActivities(callback, {
      filter: { actor_id: supervisorId },
      bufferUpdates: true
    });
  }

  /**
   * Subscribe to depot activities
   */
  subscribeToDepotActivities(depot, callback) {
    return this.subscribeToActivities(callback, {
      filter: { depot },
      bufferUpdates: true
    });
  }

  /**
   * Unsubscribe from activities
   */
  unsubscribe(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        console.warn(`⚠️ Subscription ${subscriptionId} not found`);
        return false;
      }

      // Unsubscribe from channel
      subscription.channel.unsubscribe();

      // Remove from tracking
      this.subscriptions.delete(subscriptionId);

      // Remove channel if no other subscriptions use it
      const channelName = `activities-${subscriptionId}`;
      this.channels.delete(channelName);

      subscription.active = false;
      console.log(`🔌 Unsubscribed from activities: ${subscriptionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to unsubscribe ${subscriptionId}:`, error);
      return false;
    }
  }

  /**
   * Unsubscribe from all activities
   */
  unsubscribeAll() {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    let unsubscribed = 0;

    subscriptionIds.forEach(id => {
      if (this.unsubscribe(id)) {
        unsubscribed++;
      }
    });

    console.log(`🔌 Unsubscribed from ${unsubscribed} activity subscriptions`);
    return unsubscribed;
  }

  /**
   * Handle activity change events
   */
  handleActivityChange(payload, callback, subscriptionId, bufferUpdates) {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // Format the activity for consistent consumption
      const formattedActivity = this.formatActivity(newRecord || oldRecord);

      // Add metadata
      const activityEvent = {
        eventType,
        activity: formattedActivity,
        new: newRecord,
        old: oldRecord,
        subscriptionId,
        timestamp: new Date().toISOString()
      };

      if (bufferUpdates) {
        // Add to buffer
        this.activityBuffer.push(activityEvent);

        // Keep buffer size manageable
        if (this.activityBuffer.length > this.maxBufferSize) {
          this.activityBuffer.shift();
        }
      }

      // Call the subscriber's callback
      callback(activityEvent);

      // Emit global event
      this.emit(ACTIVITY_EVENTS.NEW_ACTIVITY, activityEvent);

      console.log(`📝 Activity ${eventType}: ${formattedActivity.activity_type} by ${formattedActivity.actor_name}`);
    } catch (error) {
      console.error('❌ Error handling activity change:', error);
      this.emit(ACTIVITY_EVENTS.ERROR, { error, subscriptionId });
    }
  }

  /**
   * Format activity for consistent consumption
   */
  formatActivity(activity) {
    if (!activity) return null;

    return {
      id: activity.id,
      activity_type: activity.activity_type,
      action: activity.action,
      actor_type: activity.actor_type,
      actor_id: activity.actor_id,
      actor_name: activity.actor_name,
      entity_type: activity.entity_type,
      entity_id: activity.entity_id,
      entity_details: activity.entity_details || {},
      depot: activity.depot,
      severity: activity.severity,
      priority: activity.priority,
      source: activity.source,
      metadata: activity.metadata || {},
      icon: activity.icon,
      message: activity.message,
      created_at: activity.created_at,
      // Add formatted time
      time: this.formatTimeAgo(activity.created_at)
    };
  }

  /**
   * Format time ago string
   */
  formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Fetch recent activities (fallback for real-time)
   */
  async fetchRecentActivities(filter = {}, limit = 25) {
    try {
      // Supabase removed - now uses backend MySQL API
      // TODO: Implement backend API call to fetch activities
      console.log('📝 fetchRecentActivities would query backend API with filter:', filter);
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch recent activities:', error);
      return [];
    }
  }

  /**
   * Connection monitoring
   */
  setupConnectionMonitoring() {
    // Supabase removed - now uses backend MySQL API
    // TODO: Implement WebSocket connection monitoring to backend
    console.log('🔗 Connection monitoring would connect to backend WebSocket');
    this.isConnected = false;
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(subscriptionId) {
    console.log(`🔄 Handling connection error for ${subscriptionId}`);
    // Implementation for handling connection errors
    // Could trigger reconnection or fallback to polling
  }

  /**
   * Handle reconnection with exponential backoff
   */
  handleReconnection(subscriptionId = null) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit(ACTIVITY_EVENTS.ERROR, { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (subscriptionId) {
        // Reconnect specific subscription
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          console.log(`🔄 Reconnecting subscription: ${subscriptionId}`);
          // Implementation would restart the specific subscription
        }
      } else {
        // General reconnection
        console.log('🔄 Attempting general reconnection');
        // Implementation would restart all subscriptions
      }
    }, delay);
  }

  /**
   * Generate unique subscription ID
   */
  generateSubscriptionId() {
    return `activity-sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event emitter methods
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size,
      channels: this.channels.size,
      reconnectAttempts: this.reconnectAttempts,
      bufferSize: this.activityBuffer.length
    };
  }

  /**
   * Get buffered activities
   */
  getBufferedActivities() {
    return [...this.activityBuffer];
  }

  /**
   * Clear activity buffer
   */
  clearBuffer() {
    this.activityBuffer = [];
  }

  /**
   * Cleanup method
   */
  cleanup() {
    this.unsubscribeAll();
    this.clearBuffer();
    this.events.clear();
    
    // Clean up connection monitoring channel
    if (this.connectionChannel) {
      try {
        this.connectionChannel.unsubscribe();
        this.connectionChannel = null;
      } catch (error) {
        console.warn('⚠️ Error cleaning up connection channel:', error);
      }
    }
    
    console.log('🧹 Activity Real-time Service cleaned up');
  }
}

// Export singleton instance
export const activityRealtimeService = new ActivityRealtimeService();

// Initialize on import
activityRealtimeService.init().catch(error => {
  console.error('Failed to initialize activity realtime service:', error);
});

export default activityRealtimeService;