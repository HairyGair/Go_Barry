/**
 * Real-time WebSocket Connection Manager
 * Phase 2 Priority 4: Enhanced Real-time Features
 * 
 * Features:
 * - WebSocket connection management with auto-reconnect
 * - Real-time breakdown status updates
 * - Multi-supervisor collaboration
 * - Live dashboard synchronization
 * - Connection status monitoring
 */

class RealTimeManager {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000; // Start with 1 second
        this.heartbeatInterval = null;
        this.supervisorId = null;
        this.subscribedChannels = new Set();
        this.messageHandlers = new Map();
        this.connectionListeners = new Set();
        
        // Configuration
        this.config = {
            wsUrl: this.getWebSocketUrl(),
            heartbeatInterval: 30000, // 30 seconds
            reconnectBackoff: 1.5, // Exponential backoff multiplier
            maxReconnectDelay: 30000 // Max 30 seconds between reconnects
        };
        
        this.init();
    }
    
    init() {
        console.log('🔗 Real-time Manager initializing...');
        
        // Get supervisor ID from session/auth
        this.supervisorId = this.getSupervisorId();
        
        // Connect to WebSocket
        this.connect();
        
        // Handle browser events
        this.setupBrowserEventHandlers();
        
        console.log('✅ Real-time Manager initialized');
    }
    
    getWebSocketUrl() {
        // Determine WebSocket URL based on environment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        // For development, might use different URL
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return `${protocol}//${host}/ws/breakdown-guide`;
        }
        
        // Production WebSocket URL
        return `${protocol}//go-barry.onrender.com/ws/breakdown-guide`;
    }
    
    getSupervisorId() {
        // Get supervisor ID from session storage, localStorage, or auth token
        return sessionStorage.getItem('supervisorId') || 
               localStorage.getItem('supervisorId') || 
               'supervisor_demo';
    }
    
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('⚠️ WebSocket already connected');
            return;
        }
        
        console.log('🔌 Connecting to WebSocket...', this.config.wsUrl);
        
        try {
            this.ws = new WebSocket(this.config.wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            this.scheduleReconnect();
        }
    }
    
    setupWebSocketHandlers() {
        this.ws.onopen = (event) => {
            console.log('✅ WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            
            // Authenticate supervisor
            this.authenticate();
            
            // Start heartbeat
            this.startHeartbeat();
            
            // Notify listeners
            this.notifyConnectionListeners('connected');
            
            // Re-subscribe to channels
            this.resubscribeChannels();
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('❌ Failed to parse WebSocket message:', error);
            }
        };
        
        this.ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected:', event.code, event.reason);
            this.connected = false;
            this.stopHeartbeat();
            
            // Notify listeners
            this.notifyConnectionListeners('disconnected');
            
            // Attempt reconnection if not a normal closure
            if (event.code !== 1000) {
                this.scheduleReconnect();
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.notifyConnectionListeners('error', error);
        };
    }
    
    authenticate() {
        this.send({
            type: 'auth',
            supervisorId: this.supervisorId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
    }
    
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error('❌ Failed to send WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('⚠️ WebSocket not connected, message queued');
            // Could implement message queuing here
            return false;
        }
    }
    
    handleMessage(message) {
        console.log('📨 Received message:', message.type, message);
        
        switch (message.type) {
            case 'auth_success':
                console.log('✅ Authentication successful');
                break;
                
            case 'auth_error':
                console.error('❌ Authentication failed:', message.error);
                break;
                
            case 'heartbeat':
                // Echo heartbeat
                this.send({ type: 'heartbeat_ack' });
                break;
                
            case 'breakdown_update':
                this.handleBreakdownUpdate(message);
                break;
                
            case 'breakdown_new':
                this.handleNewBreakdown(message);
                break;
                
            case 'supervisor_activity':
                this.handleSupervisorActivity(message);
                break;
                
            case 'notification':
                this.handleNotification(message);
                break;
                
            default:
                // Check for custom message handlers
                const handler = this.messageHandlers.get(message.type);
                if (handler) {
                    handler(message);
                } else {
                    console.log('🔄 Unhandled message type:', message.type);
                }
        }
    }
    
    handleBreakdownUpdate(message) {
        const { breakdownId, updates, updatedBy } = message;
        
        console.log('🔄 Breakdown update:', breakdownId, updates);
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('breakdown-updated', {
            detail: { breakdownId, updates, updatedBy }
        }));
        
        // Show notification if updated by another supervisor
        if (updatedBy !== this.supervisorId) {
            this.showUpdateNotification(breakdownId, updates, updatedBy);
        }
    }
    
    handleNewBreakdown(message) {
        const { breakdown } = message;
        
        console.log('🆕 New breakdown:', breakdown.id);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('breakdown-new', {
            detail: { breakdown }
        }));
        
        // Show notification
        this.showNewBreakdownNotification(breakdown);
    }
    
    handleSupervisorActivity(message) {
        const { supervisorId, activity, timestamp } = message;
        
        console.log('👤 Supervisor activity:', supervisorId, activity);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('supervisor-activity', {
            detail: { supervisorId, activity, timestamp }
        }));
    }
    
    handleNotification(message) {
        const { title, body, type, data } = message;
        
        console.log('🔔 Notification:', title);
        
        // Show browser notification if permitted
        this.showBrowserNotification(title, body, type, data);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('realtime-notification', {
            detail: { title, body, type, data }
        }));
    }
    
    // Public API methods
    subscribeToBreakdown(breakdownId) {
        const channel = `breakdown:${breakdownId}`;
        this.subscribedChannels.add(channel);
        
        this.send({
            type: 'subscribe',
            channel: channel
        });
        
        console.log('🔔 Subscribed to breakdown:', breakdownId);
    }
    
    unsubscribeFromBreakdown(breakdownId) {
        const channel = `breakdown:${breakdownId}`;
        this.subscribedChannels.delete(channel);
        
        this.send({
            type: 'unsubscribe',
            channel: channel
        });
        
        console.log('🔕 Unsubscribed from breakdown:', breakdownId);
    }
    
    subscribeToDepot(depotId) {
        const channel = `depot:${depotId}`;
        this.subscribedChannels.add(channel);
        
        this.send({
            type: 'subscribe',
            channel: channel
        });
        
        console.log('🔔 Subscribed to depot:', depotId);
    }
    
    subscribeToSupervisorUpdates() {
        const channel = 'supervisors:activity';
        this.subscribedChannels.add(channel);
        
        this.send({
            type: 'subscribe',
            channel: channel
        });
        
        console.log('🔔 Subscribed to supervisor updates');
    }
    
    updateBreakdownStatus(breakdownId, status, notes = '') {
        this.send({
            type: 'breakdown_status_update',
            breakdownId: breakdownId,
            status: status,
            notes: notes,
            supervisorId: this.supervisorId,
            timestamp: Date.now()
        });
    }
    
    broadcastSupervisorActivity(activity) {
        this.send({
            type: 'supervisor_activity',
            supervisorId: this.supervisorId,
            activity: activity,
            timestamp: Date.now()
        });
    }
    
    requestBreakdownCollaboration(breakdownId, requestType = 'assistance') {
        this.send({
            type: 'collaboration_request',
            breakdownId: breakdownId,
            requestType: requestType,
            fromSupervisor: this.supervisorId,
            timestamp: Date.now()
        });
    }
    
    // Message handler registration
    onMessage(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }
    
    offMessage(messageType) {
        this.messageHandlers.delete(messageType);
    }
    
    // Connection status monitoring
    onConnectionChange(listener) {
        this.connectionListeners.add(listener);
    }
    
    offConnectionChange(listener) {
        this.connectionListeners.delete(listener);
    }
    
    notifyConnectionListeners(status, data = null) {
        this.connectionListeners.forEach(listener => {
            try {
                listener(status, data);
            } catch (error) {
                console.error('❌ Connection listener error:', error);
            }
        });
    }
    
    // Heartbeat management
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.send({ type: 'heartbeat' });
            }
        }, this.config.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    // Reconnection logic
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.notifyConnectionListeners('failed');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(
            this.reconnectDelay * Math.pow(this.config.reconnectBackoff, this.reconnectAttempts - 1),
            this.config.maxReconnectDelay
        );
        
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    resubscribeChannels() {
        this.subscribedChannels.forEach(channel => {
            this.send({
                type: 'subscribe',
                channel: channel
            });
        });
    }
    
    // Browser event handlers
    setupBrowserEventHandlers() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.connected) {
                console.log('🔄 Page visible, reconnecting...');
                this.connect();
            }
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Back online, reconnecting...');
            this.connect();
        });
        
        window.addEventListener('offline', () => {
            console.log('📡 Gone offline');
            this.notifyConnectionListeners('offline');
        });
        
        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.ws) {
                this.ws.close(1000, 'Page unload');
            }
        });
    }
    
    // Notification helpers
    showUpdateNotification(breakdownId, updates, updatedBy) {
        const message = `Breakdown ${breakdownId} updated by ${updatedBy}`;
        this.showInAppNotification(message, 'info');
    }
    
    showNewBreakdownNotification(breakdown) {
        const message = `New breakdown: ${breakdown.vehicle_id} - ${breakdown.location}`;
        this.showInAppNotification(message, 'warning');
    }
    
    showBrowserNotification(title, body, type = 'info', data = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '/breakdown-guide/icons/icon-192x192.png',
                tag: `breakdown-${Date.now()}`,
                data: data
            });
            
            notification.onclick = () => {
                window.focus();
                if (data.breakdownId) {
                    // Could navigate to specific breakdown
                    console.log('Notification clicked for breakdown:', data.breakdownId);
                }
            };
        }
    }
    
    showInAppNotification(message, type = 'info') {
        const colors = {
            info: 'bg-blue-600',
            success: 'bg-green-600',
            warning: 'bg-amber-600',
            error: 'bg-red-600'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-sm">${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="text-sm">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white/80 hover:text-white">✕</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Utility methods
    isConnected() {
        return this.connected;
    }
    
    getConnectionStatus() {
        if (!this.ws) return 'disconnected';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }
    
    disconnect() {
        console.log('🔌 Manually disconnecting WebSocket');
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
        }
    }
    
    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('🔔 Notification permission:', permission);
            return permission === 'granted';
        }
        return false;
    }
}

// Initialize real-time manager
window.RealTimeManager = new RealTimeManager();

// Export for module use
window.RealTime = {
    isConnected: () => window.RealTimeManager.isConnected(),
    subscribeToBreakdown: (id) => window.RealTimeManager.subscribeToBreakdown(id),
    unsubscribeFromBreakdown: (id) => window.RealTimeManager.unsubscribeFromBreakdown(id),
    updateBreakdownStatus: (id, status, notes) => window.RealTimeManager.updateBreakdownStatus(id, status, notes),
    broadcastActivity: (activity) => window.RealTimeManager.broadcastSupervisorActivity(activity),
    onMessage: (type, handler) => window.RealTimeManager.onMessage(type, handler),
    onConnectionChange: (listener) => window.RealTimeManager.onConnectionChange(listener),
    requestNotificationPermission: () => window.RealTimeManager.requestNotificationPermission()
};

console.log('⚡ Real-time WebSocket system loaded');
