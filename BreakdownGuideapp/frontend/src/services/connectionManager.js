/**
 * WebSocket + Polling Hybrid Connection Manager
 * Provides reliable real-time updates with automatic failover
 */

import { apiConfig, websocketConfig } from '../breakdown-guide/components/common/constants';

// Connection states
export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  POLLING: 'polling',
  FAILED: 'failed'
};

// Connection modes
export const CONNECTION_MODES = {
  WEBSOCKET: 'websocket',
  POLLING: 'polling',
  HYBRID: 'hybrid'
};

// Connection configuration
const DEFAULT_CONFIG = {
  primary: CONNECTION_MODES.WEBSOCKET,
  fallback: CONNECTION_MODES.POLLING,
  autoFailover: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000, // Start with 1 second
  maxReconnectDelay: 30000, // Max 30 seconds
  pollingInterval: 5000, // 5 seconds
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  enableLogging: true
};

class ConnectionManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = CONNECTION_STATES.DISCONNECTED;
    this.mode = this.config.primary;
    this.ws = null;
    this.pollingTimer = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.reconnectAttempt = 0;
    this.lastSuccessfulConnection = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.isDestroyed = false;
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.switchMode = this.switchMode.bind(this);
    
    this.log('ConnectionManager initialized', { config: this.config });
  }

  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log('Error in event callback', { event, error });
        }
      });
    }
  }

  // Logging
  log(message, data = {}) {
    if (this.config.enableLogging) {
      console.log(`[ConnectionManager] ${message}`, data);
    }
  }

  // Connection management
  async connect(endpoint = '/ws/sdc-dashboard') {
    if (this.isDestroyed) return;
    
    this.log('Starting connection', { endpoint, mode: this.mode });
    this.setState(CONNECTION_STATES.CONNECTING);

    if (this.mode === CONNECTION_MODES.WEBSOCKET) {
      await this.connectWebSocket(endpoint);
    } else {
      this.startPolling();
    }
  }

  async connectWebSocket(endpoint) {
    try {
      // NOTE: Authentication now handled via HTTP-only cookies (XSS protection)
      // The browser automatically sends the auth_token cookie with WebSocket upgrade request
      // No need to retrieve or inject token manually

      this.log('🔒 Using HTTP-only cookie authentication for WebSocket');

      // Determine if we're in development or production
      // Check actual hostname instead of relying on import.meta.env.DEV
      let wsUrl;
      const isProductionDomain = window.location.hostname === 'breakdowns.gobarry.co.uk' ||
                                 window.location.hostname === 'api.breakdowns.gobarry.co.uk';
      const isLocalDevelopment = window.location.hostname === 'localhost' ||
                                 window.location.hostname === '127.0.0.1';

      if (isLocalDevelopment) {
        // Use relative URL in development to go through Vite's WebSocket proxy
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}${endpoint}`;
        this.log('Development mode: Using relative WebSocket URL', { wsUrl, endpoint });
      } else {
        // In production or on production domain, ALWAYS use WebSocket-specific URL from config
        wsUrl = `${websocketConfig.url}${endpoint}`;
        this.log('Production mode: Using WebSocket URL from config', {
          wsUrl,
          websocketConfigUrl: websocketConfig.url,
          hostname: window.location.hostname,
          isProductionDomain
        });
      }

      // NOTE: No token injection needed - browser sends HTTP-only cookie automatically
      // This is more secure as JavaScript cannot access the token (XSS protection)

      this.log('Attempting WebSocket connection', {
        wsUrl,
        baseUrl: apiConfig.baseUrl,
        endpoint,
        authMethod: 'HTTP-only cookie',
        isLocalDevelopment
      });

      this.ws = new WebSocket(wsUrl);
      
      // Set connection timeout
      const timeoutId = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.log('WebSocket connection timeout');
          this.ws.close();
          this.handleWebSocketFailure('Connection timeout');
        }
      }, this.config.connectionTimeout);

      this.ws.onopen = () => {
        clearTimeout(timeoutId);
        this.handleWebSocketOpen();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeoutId);
        this.handleWebSocketClose(event);
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeoutId);
        this.handleWebSocketError(error);
      };

    } catch (error) {
      this.log('WebSocket connection failed', { error });
      this.handleWebSocketFailure(error.message);
    }
  }

  handleWebSocketOpen() {
    this.log('WebSocket connected successfully');
    this.setState(CONNECTION_STATES.CONNECTED);
    this.mode = CONNECTION_MODES.WEBSOCKET;
    this.reconnectAttempt = 0;
    this.lastSuccessfulConnection = Date.now();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processMessageQueue();
    
    this.emit('connected', { mode: CONNECTION_MODES.WEBSOCKET });
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);
      
      // Handle heartbeat responses
      if (data.type === 'pong') {
        this.log('Heartbeat response received');
        return;
      }
      
      this.log('WebSocket message received', { type: data.type });
      this.emit('message', data);
      
    } catch (error) {
      this.log('Error parsing WebSocket message', { error, data: event.data });
    }
  }

  handleWebSocketClose(event) {
    this.log('WebSocket closed', { 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean,
      state: this.state 
    });
    this.stopHeartbeat();
    
    if (!this.isDestroyed && this.state !== CONNECTION_STATES.DISCONNECTED) {
      if (this.config.autoFailover) {
        this.attemptReconnection();
      } else {
        this.setState(CONNECTION_STATES.DISCONNECTED);
      }
    }
  }

  handleWebSocketError(error) {
    this.log('WebSocket error', { 
      error: error.message || error,
      readyState: this.ws?.readyState,
      url: this.ws?.url 
    });
    this.emit('error', { type: 'websocket', error });
  }

  handleWebSocketFailure(reason) {
    this.log('WebSocket connection failed', { reason });
    
    if (this.config.autoFailover) {
      if (this.reconnectAttempt < this.config.reconnectAttempts) {
        this.attemptReconnection();
      } else {
        this.log('Max reconnection attempts reached, switching to polling');
        this.switchToPolling();
      }
    } else {
      this.setState(CONNECTION_STATES.FAILED);
    }
  }

  // Polling mode
  startPolling() {
    this.log('Starting polling mode');
    this.setState(CONNECTION_STATES.POLLING);
    this.mode = CONNECTION_MODES.POLLING;
    
    // Initial poll
    this.poll();
    
    // Set up polling interval
    this.pollingTimer = setInterval(() => {
      this.poll();
    }, this.config.pollingInterval);
    
    this.emit('connected', { mode: CONNECTION_MODES.POLLING });
  }

  async poll() {
    if (this.isDestroyed) return;
    
    try {
      // Get the latest timestamp for incremental updates
      const since = this.lastSuccessfulConnection ? new Date(this.lastSuccessfulConnection).toISOString() : null;
      
      const response = await fetch(`${apiConfig.baseUrl}/api/activity/live${since ? `?since=${since}` : ''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: Send HTTP-only cookie with request
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        const data = await response.json();
        this.lastSuccessfulConnection = Date.now();
        
        if (data.activities && data.activities.length > 0) {
          this.log('Polling update received', { count: data.activities.length });
          this.emit('message', {
            type: 'poll_update',
            activities: data.activities,
            timestamp: data.timestamp
          });
        }
      } else {
        this.log('Polling request failed', { status: response.status });
      }
      
    } catch (error) {
      this.log('Polling error', { error: error.message });
      this.emit('error', { type: 'polling', error });
    }
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      this.log('Polling stopped');
    }
  }

  // Heartbeat system
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
        this.log('Heartbeat sent');
      }
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Reconnection logic
  attemptReconnection() {
    if (this.isDestroyed) return;
    
    this.reconnectAttempt++;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempt - 1),
      this.config.maxReconnectDelay
    );
    
    this.log('Attempting reconnection', { 
      attempt: this.reconnectAttempt, 
      maxAttempts: this.config.reconnectAttempts,
      delay 
    });
    
    this.setState(CONNECTION_STATES.RECONNECTING);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  switchToPolling() {
    this.log('Switching to polling mode');
    this.disconnect();
    this.mode = CONNECTION_MODES.POLLING;
    this.reconnectAttempt = 0;
    this.startPolling();
  }

  switchToWebSocket() {
    this.log('Switching to WebSocket mode');
    this.stopPolling();
    this.mode = CONNECTION_MODES.WEBSOCKET;
    this.reconnectAttempt = 0;
    this.connect();
  }

  // Mode switching
  switchMode(newMode) {
    if (this.mode === newMode) return;
    
    this.log('Switching connection mode', { from: this.mode, to: newMode });
    
    if (newMode === CONNECTION_MODES.WEBSOCKET) {
      this.switchToWebSocket();
    } else if (newMode === CONNECTION_MODES.POLLING) {
      this.switchToPolling();
    }
  }

  // Message handling
  send(message) {
    if (this.mode === CONNECTION_MODES.WEBSOCKET && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.log('Message sent via WebSocket', { message });
      } catch (error) {
        this.log('Error sending WebSocket message', { error });
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  queueMessage(message) {
    this.messageQueue.push(message);
    this.log('Message queued', { message, queueLength: this.messageQueue.length });
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  // State management
  setState(newState) {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log('State changed', { from: oldState, to: newState });
      this.emit('stateChange', { from: oldState, to: newState, mode: this.mode });
    }
  }

  getState() {
    return {
      state: this.state,
      mode: this.mode,
      reconnectAttempt: this.reconnectAttempt,
      maxReconnectAttempts: this.config.reconnectAttempts,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      isConnected: this.state === CONNECTION_STATES.CONNECTED || this.state === CONNECTION_STATES.POLLING
    };
  }

  // Connection health
  isHealthy() {
    const state = this.getState();
    return state.isConnected && (
      this.mode === CONNECTION_MODES.WEBSOCKET ? 
        this.ws && this.ws.readyState === WebSocket.OPEN :
        this.pollingTimer !== null
    );
  }

  getConnectionHealth() {
    const state = this.getState();
    const timeSinceLastConnection = this.lastSuccessfulConnection ? 
      Date.now() - this.lastSuccessfulConnection : null;

    return {
      ...state,
      isHealthy: this.isHealthy(),
      timeSinceLastConnection,
      queuedMessages: this.messageQueue.length,
      config: this.config
    };
  }

  // Cleanup
  disconnect() {
    this.log('Disconnecting');
    this.setState(CONNECTION_STATES.DISCONNECTED);
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    this.stopPolling();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.reconnectAttempt = 0;
    this.emit('disconnected');
  }

  destroy() {
    this.log('Destroying connection manager');
    this.isDestroyed = true;
    this.disconnect();
    this.listeners.clear();
    this.messageQueue = [];
  }
}

// Singleton instance for the SDC Dashboard
let sdcConnectionManager = null;

export function getSDCConnectionManager(config = {}) {
  if (!sdcConnectionManager) {
    sdcConnectionManager = new ConnectionManager({
      ...config,
      enableLogging: true
    });
  }
  return sdcConnectionManager;
}

export function destroySDCConnectionManager() {
  if (sdcConnectionManager) {
    sdcConnectionManager.destroy();
    sdcConnectionManager = null;
  }
}

export default ConnectionManager;