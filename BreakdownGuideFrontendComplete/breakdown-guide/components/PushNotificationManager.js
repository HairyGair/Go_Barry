/**
 * Push Notification System
 * Phase 2 Priority 4: Real-time alerts and escalations
 * 
 * Features:
 * - Browser push notifications for breakdown alerts
 * - In-app notification system
 * - Escalation notifications
 * - Priority-based notification routing
 * - Notification preferences and management
 */

class PushNotificationManager {
    constructor() {
        this.serviceWorkerRegistration = null;
        this.notificationPermission = 'default';
        this.subscriptions = new Map();
        this.preferences = this.loadPreferences();
        this.notificationQueue = [];
        this.isVisible = !document.hidden;
        
        this.init();
    }
    
    async init() {
        console.log('🔔 Push Notification Manager initializing...');
        
        // Check browser support
        if (!('Notification' in window)) {
            console.warn('❌ Browser notifications not supported');
            return;
        }
        
        if (!('serviceWorker' in navigator)) {
            console.warn('❌ Service Worker not supported');
            return;
        }
        
        // Get current permission status
        this.notificationPermission = Notification.permission;
        
        // Set up service worker for push notifications
        await this.setupServiceWorker();
        
        // Set up real-time notification handlers
        this.setupRealTimeHandlers();
        
        // Monitor page visibility
        this.setupVisibilityHandlers();
        
        console.log('✅ Push Notification Manager initialized');
    }
    
    async setupServiceWorker() {
        try {
            // Get existing service worker registration
            this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
            console.log('✅ Service Worker ready for notifications');
        } catch (error) {
            console.error('❌ Service Worker setup failed:', error);
        }
    }
    
    setupRealTimeHandlers() {
        if (window.RealTime) {
            // Listen for real-time notifications
            window.RealTime.onMessage('notification', (message) => {
                this.handleRealTimeNotification(message);
            });
            
            // Listen for breakdown events
            window.addEventListener('breakdown-new', (event) => {
                this.handleNewBreakdown(event.detail.breakdown);
            });
            
            window.addEventListener('breakdown-updated', (event) => {
                this.handleBreakdownUpdate(event.detail);
            });
            
            // Listen for escalations
            window.addEventListener('breakdown-escalation', (event) => {
                this.handleEscalation(event.detail);
            });
        }
    }
    
    setupVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
            
            if (this.isVisible) {
                // Clear notification queue when page becomes visible
                this.processNotificationQueue();
            }
        });
    }
    
    async requestPermission() {
        if (this.notificationPermission === 'granted') {
            return true;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                this.showWelcomeNotification();
                return true;
            } else {
                console.log('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to request notification permission:', error);
            return false;
        }
    }
    
    async subscribeToPush() {
        if (!this.serviceWorkerRegistration) {
            console.warn('❌ Service Worker not available for push subscription');
            return null;
        }
        
        try {
            // Check if already subscribed
            let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                // Subscribe to push notifications
                subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.getVAPIDKey()
                });
                
                console.log('✅ Push subscription created');
            }
            
            // Send subscription to server
            await this.sendSubscriptionToServer(subscription);
            
            return subscription;
        } catch (error) {
            console.error('❌ Push subscription failed:', error);
            return null;
        }
    }
    
    getVAPIDKey() {
        // VAPID public key for push notifications
        // In production, this would come from environment variables
        return 'BEL4nTtOAG5bCF7-tM1iDkSslN9YTsM3fh8n1HLzHBqvzV2F1nZJJKQ4qLCw7qGEqZg1lNhE7_uE8kF9qQ4D3Pg';
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription,
                    supervisorId: this.getSupervisorId(),
                    preferences: this.preferences
                })
            });
            
            if (response.ok) {
                console.log('✅ Push subscription sent to server');
            } else {
                console.error('❌ Failed to send subscription to server');
            }
        } catch (error) {
            console.error('❌ Error sending subscription to server:', error);
        }
    }
    
    handleRealTimeNotification(message) {
        const { title, body, type, priority, data } = message;
        
        console.log('🔔 Real-time notification:', title);
        
        const notification = {
            id: Date.now(),
            title,
            body,
            type: type || 'info',
            priority: priority || 'normal',
            data: data || {},
            timestamp: Date.now()
        };
        
        this.processNotification(notification);
    }
    
    handleNewBreakdown(breakdown) {
        if (!this.shouldNotify('new_breakdown')) return;
        
        const notification = {
            id: Date.now(),
            title: '🚨 New Breakdown Alert',
            body: `${breakdown.vehicle_id} - ${breakdown.location}`,
            type: 'warning',
            priority: breakdown.priority || 'normal',
            data: { breakdownId: breakdown.id, type: 'new_breakdown' },
            timestamp: Date.now()
        };
        
        this.processNotification(notification);
    }
    
    handleBreakdownUpdate(updateData) {
        const { breakdownId, updates, updatedBy } = updateData;
        
        if (!this.shouldNotify('breakdown_update')) return;
        
        // Don't notify about own updates
        if (updatedBy === this.getSupervisorId()) return;
        
        const notification = {
            id: Date.now(),
            title: '🔄 Breakdown Updated',
            body: `Breakdown ${breakdownId} updated by ${updatedBy}`,
            type: 'info',
            priority: 'low',
            data: { breakdownId, type: 'breakdown_update' },
            timestamp: Date.now()
        };
        
        this.processNotification(notification);
    }
    
    handleEscalation(escalationData) {
        const { breakdownId, reason, escalatedBy } = escalationData;
        
        const notification = {
            id: Date.now(),
            title: '⚠️ Breakdown Escalation',
            body: `${reason} - Escalated by ${escalatedBy}`,
            type: 'error',
            priority: 'high',
            data: { breakdownId, type: 'escalation' },
            timestamp: Date.now()
        };
        
        this.processNotification(notification);
    }
    
    processNotification(notification) {
        console.log('📨 Processing notification:', notification.title);
        
        // Check if page is visible
        if (this.isVisible && notification.priority !== 'high') {
            // Show in-app notification for normal priority
            this.showInAppNotification(notification);
        } else {
            // Show browser notification or queue for later
            if (this.notificationPermission === 'granted') {
                this.showBrowserNotification(notification);
            } else {
                this.queueNotification(notification);
            }
        }
        
        // Always show high priority notifications
        if (notification.priority === 'high') {
            this.showBrowserNotification(notification);
            this.showInAppNotification(notification);
        }
        
        // Store notification in history
        this.storeNotification(notification);
    }
    
    showBrowserNotification(notification) {
        if (this.notificationPermission !== 'granted') {
            console.warn('❌ Cannot show browser notification: permission not granted');
            return;
        }
        
        const options = {
            body: notification.body,
            icon: '/breakdown-guide/icons/icon-192x192.png',
            badge: '/breakdown-guide/icons/badge-72x72.png',
            tag: `breakdown-${notification.data.breakdownId || notification.id}`,
            requireInteraction: notification.priority === 'high',
            silent: notification.priority === 'low',
            data: notification.data,
            actions: this.getNotificationActions(notification)
        };
        
        const browserNotification = new Notification(notification.title, options);
        
        browserNotification.onclick = () => {
            this.handleNotificationClick(notification);
            browserNotification.close();
        };
        
        // Auto-close after delay (except high priority)
        if (notification.priority !== 'high') {
            setTimeout(() => {
                browserNotification.close();
            }, this.getNotificationDuration(notification.priority));
        }
    }
    
    showInAppNotification(notification) {
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            warning: 'bg-amber-600',
            error: 'bg-red-600'
        };
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        const notificationEl = document.createElement('div');
        notificationEl.className = `fixed top-4 right-4 ${colors[notification.type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 translate-x-full`;
        notificationEl.innerHTML = `
            <div class="flex items-start space-x-3">
                <span class="text-xl">${icons[notification.type]}</span>
                <div class="flex-1">
                    <div class="font-semibold text-sm">${notification.title}</div>
                    <div class="text-sm opacity-90 mt-1">${notification.body}</div>
                    <div class="text-xs opacity-75 mt-2">${new Date(notification.timestamp).toLocaleTimeString()}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white ml-2">
                    ✕
                </button>
            </div>
            ${notification.data.breakdownId ? `
                <div class="mt-3 pt-3 border-t border-white/20">
                    <button onclick="window.location.href='/breakdown/${notification.data.breakdownId}'" class="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-all">
                        View Breakdown
                    </button>
                </div>
            ` : ''}
        `;
        
        document.body.appendChild(notificationEl);
        
        // Animate in
        requestAnimationFrame(() => {
            notificationEl.style.transform = 'translateX(0)';
        });
        
        // Auto-remove
        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    notificationEl.remove();
                }, 300);
            }
        }, this.getNotificationDuration(notification.priority));
    }
    
    queueNotification(notification) {
        this.notificationQueue.push(notification);
        console.log('📥 Notification queued:', notification.title);
    }
    
    processNotificationQueue() {
        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            this.showInAppNotification(notification);
        }
    }
    
    getNotificationActions(notification) {
        const actions = [];
        
        if (notification.data.breakdownId) {
            actions.push({
                action: 'view',
                title: 'View Breakdown',
                icon: '/breakdown-guide/icons/view-action.png'
            });
        }
        
        if (notification.type === 'error' || notification.priority === 'high') {
            actions.push({
                action: 'acknowledge',
                title: 'Acknowledge',
                icon: '/breakdown-guide/icons/ack-action.png'
            });
        }
        
        return actions;
    }
    
    getNotificationDuration(priority) {
        const durations = {
            low: 3000,
            normal: 5000,
            high: 8000
        };
        return durations[priority] || 5000;
    }
    
    handleNotificationClick(notification) {
        window.focus();
        
        if (notification.data.breakdownId) {
            // Navigate to breakdown details
            window.location.href = `/breakdown/${notification.data.breakdownId}`;
        }
        
        // Mark as read
        this.markNotificationAsRead(notification.id);
    }
    
    // Notification preferences
    loadPreferences() {
        const stored = localStorage.getItem('notificationPreferences');
        return stored ? JSON.parse(stored) : {
            new_breakdown: true,
            breakdown_update: true,
            escalation: true,
            collaboration_request: true,
            priority_override: true, // Always show high priority
            quiet_hours: false,
            quiet_start: '22:00',
            quiet_end: '06:00'
        };
    }
    
    savePreferences(preferences) {
        this.preferences = { ...this.preferences, ...preferences };
        localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
    }
    
    shouldNotify(type) {
        if (!this.preferences[type]) {
            return false;
        }
        
        // Check quiet hours
        if (this.preferences.quiet_hours) {
            const now = new Date();
            const currentTime = now.getHours() * 100 + now.getMinutes();
            const quietStart = this.parseTime(this.preferences.quiet_start);
            const quietEnd = this.parseTime(this.preferences.quiet_end);
            
            if (quietStart > quietEnd) {
                // Overnight quiet hours
                if (currentTime >= quietStart || currentTime <= quietEnd) {
                    return false;
                }
            } else {
                // Same day quiet hours
                if (currentTime >= quietStart && currentTime <= quietEnd) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 100 + minutes;
    }
    
    // Notification history
    storeNotification(notification) {
        const history = this.getNotificationHistory();
        history.unshift({
            ...notification,
            read: false
        });
        
        // Keep only last 100 notifications
        if (history.length > 100) {
            history.splice(100);
        }
        
        localStorage.setItem('notificationHistory', JSON.stringify(history));
    }
    
    getNotificationHistory() {
        const stored = localStorage.getItem('notificationHistory');
        return stored ? JSON.parse(stored) : [];
    }
    
    markNotificationAsRead(notificationId) {
        const history = this.getNotificationHistory();
        const notification = history.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem('notificationHistory', JSON.stringify(history));
        }
    }
    
    getUnreadCount() {
        const history = this.getNotificationHistory();
        return history.filter(n => !n.read).length;
    }
    
    clearNotificationHistory() {
        localStorage.removeItem('notificationHistory');
    }
    
    // Utility methods
    getSupervisorId() {
        return sessionStorage.getItem('supervisorId') || 
               localStorage.getItem('supervisorId') || 
               'supervisor_demo';
    }
    
    showWelcomeNotification() {
        const notification = {
            id: Date.now(),
            title: '🔔 Notifications Enabled',
            body: 'You\'ll receive alerts for breakdowns and escalations',
            type: 'success',
            priority: 'normal',
            data: {},
            timestamp: Date.now()
        };
        
        this.showInAppNotification(notification);
    }
    
    // Test notification (for demo purposes)
    sendTestNotification() {
        const notification = {
            id: Date.now(),
            title: '🧪 Test Notification',
            body: 'This is a test notification to verify the system is working',
            type: 'info',
            priority: 'normal',
            data: { type: 'test' },
            timestamp: Date.now()
        };
        
        this.processNotification(notification);
    }
    
    // Public API
    isEnabled() {
        return this.notificationPermission === 'granted';
    }
    
    getPermissionStatus() {
        return this.notificationPermission;
    }
}

// Notification Preferences Component
const NotificationPreferences = ({ onSave }) => {
    const [preferences, setPreferences] = React.useState(
        window.PushNotificationManager?.preferences || {}
    );
    
    const handleSave = () => {
        if (window.PushNotificationManager) {
            window.PushNotificationManager.savePreferences(preferences);
            if (onSave) onSave(preferences);
        }
    };
    
    const updatePreference = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };
    
    return React.createElement('div', {
        className: 'space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-600/30'
    }, [
        React.createElement('h3', {
            key: 'title',
            className: 'text-lg font-semibold text-white'
        }, '🔔 Notification Preferences'),
        
        React.createElement('div', {
            key: 'options',
            className: 'space-y-3'
        }, [
            React.createElement('label', {
                key: 'new-breakdown',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('input', {
                    key: 'input',
                    type: 'checkbox',
                    checked: preferences.new_breakdown,
                    onChange: (e) => updatePreference('new_breakdown', e.target.checked),
                    className: 'rounded'
                }),
                React.createElement('span', {
                    key: 'label',
                    className: 'text-sm text-gray-300'
                }, 'New breakdown alerts')
            ]),
            
            React.createElement('label', {
                key: 'breakdown-update',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('input', {
                    key: 'input',
                    type: 'checkbox',
                    checked: preferences.breakdown_update,
                    onChange: (e) => updatePreference('breakdown_update', e.target.checked),
                    className: 'rounded'
                }),
                React.createElement('span', {
                    key: 'label',
                    className: 'text-sm text-gray-300'
                }, 'Breakdown status updates')
            ]),
            
            React.createElement('label', {
                key: 'escalation',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('input', {
                    key: 'input',
                    type: 'checkbox',
                    checked: preferences.escalation,
                    onChange: (e) => updatePreference('escalation', e.target.checked),
                    className: 'rounded'
                }),
                React.createElement('span', {
                    key: 'label',
                    className: 'text-sm text-gray-300'
                }, 'Escalation alerts (recommended)')
            ]),
            
            React.createElement('label', {
                key: 'quiet-hours',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('input', {
                    key: 'input',
                    type: 'checkbox',
                    checked: preferences.quiet_hours,
                    onChange: (e) => updatePreference('quiet_hours', e.target.checked),
                    className: 'rounded'
                }),
                React.createElement('span', {
                    key: 'label',
                    className: 'text-sm text-gray-300'
                }, 'Enable quiet hours')
            ])
        ]),
        
        React.createElement('button', {
            key: 'save',
            onClick: handleSave,
            className: 'w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-all'
        }, 'Save Preferences')
    ]);
};

// Initialize push notification manager
window.PushNotificationManager = new PushNotificationManager();

// Export for use
window.PushNotifications = {
    requestPermission: () => window.PushNotificationManager.requestPermission(),
    subscribeToPush: () => window.PushNotificationManager.subscribeToPush(),
    isEnabled: () => window.PushNotificationManager.isEnabled(),
    getUnreadCount: () => window.PushNotificationManager.getUnreadCount(),
    sendTestNotification: () => window.PushNotificationManager.sendTestNotification(),
    getHistory: () => window.PushNotificationManager.getNotificationHistory()
};

window.NotificationPreferences = NotificationPreferences;

console.log('🔔 Push notification system loaded');
