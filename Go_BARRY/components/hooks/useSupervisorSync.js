// Go_BARRY/components/hooks/useSupervisorSync.js
// Shared WebSocket state management for supervisor-display sync
// Provides real-time synchronization with automatic reconnection

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { API_CONFIG } from '../../config/api';

// Create context for sharing WebSocket state across components
const SupervisorSyncContext = createContext();

// WebSocket connection states
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Message types for WebSocket communication
const MESSAGE_TYPES = {
  // Authentication
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  
  // Connection management
  WELCOME: 'welcome',
  PING: 'ping',
  PONG: 'pong',
  
  // Alert management
  ACKNOWLEDGE_ALERT: 'acknowledge_alert',
  UPDATE_PRIORITY: 'update_priority',
  ADD_NOTE: 'add_note',
  ALERT_ACKNOWLEDGED: 'alert_acknowledged',
  PRIORITY_UPDATED: 'priority_updated',
  NOTE_ADDED: 'note_added',
  
  // State synchronization
  REQUEST_STATE: 'request_state',
  STATE_UPDATE: 'state_update',
  UPDATE_ALERTS: 'update_alerts',
  ALERTS_UPDATED: 'alerts_updated',
  
  // Custom messages
  BROADCAST_MESSAGE: 'broadcast_message',
  CUSTOM_MESSAGE: 'custom_message',
  CLEAR_MESSAGE: 'clear_message',
  MESSAGE_REMOVED: 'message_removed',
  
  // Display control
  SET_MODE: 'set_mode',
  MODE_CHANGED: 'mode_changed',
  DISMISS_FROM_DISPLAY: 'dismiss_from_display',
  LOCK_ON_DISPLAY: 'lock_on_display',
  UNLOCK_FROM_DISPLAY: 'unlock_from_display',
  ALERT_DISMISSED_FROM_DISPLAY: 'alert_dismissed_from_display',
  ALERT_LOCKED_ON_DISPLAY: 'alert_locked_on_display',
  ALERT_UNLOCKED_FROM_DISPLAY: 'alert_unlocked_from_display',
  
  // Connection events
  SUPERVISOR_CONNECTED: 'supervisor_connected',
  SUPERVISOR_DISCONNECTED: 'supervisor_disconnected',
  SUPERVISOR_JOINED: 'supervisor_joined',
  SUPERVISOR_LEFT: 'supervisor_left',
  SUPERVISOR_LIST_UPDATED: 'supervisor_list_updated',
  SUPERVISOR_ACTIVITY_UPDATE: 'supervisor_activity_update',
  DISPLAY_CONNECTED: 'display_connected',
  DISPLAY_DISCONNECTED: 'display_disconnected',
  
  // Error handling
  ERROR: 'error'
};

// Hook for WebSocket supervisor sync functionality
export const useSupervisorSync = ({ 
  clientType = 'supervisor', // 'supervisor' or 'display'
  supervisorId = null,
  sessionId = null,
  autoConnect = true,
  onConnectionChange = null,
  onMessage = null,
  onError = null
} = {}) => {
  
  // WebSocket connection
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const pingInterval = useRef(null);
  const reconnectAttempts = useRef(0);
  
  // Connection state
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [connectionStats, setConnectionStats] = useState({
    connectedAt: null,
    reconnectAttempts: 0,
    lastPing: null,
    roundTripTime: null
  });
  
  // Sync state
  const [syncState, setSyncState] = useState({
    acknowledgedAlerts: new Set(),
    priorityOverrides: new Map(),
    supervisorNotes: new Map(),
    customMessages: [],
    dismissedFromDisplay: new Set(), // Alerts hidden from display
    lockedOnDisplay: new Set(), // Alerts locked on display (no auto-rotation)
    activeMode: 'normal',
    connectedSupervisors: 0,
    connectedDisplays: 0,
    activeSupervisors: [], // Array of individual supervisor objects
    lastUpdated: null
  });
  
  // Message queue for offline messages
  const messageQueue = useRef([]);
  const [queuedMessages, setQueuedMessages] = useState(0);

  // Generate WebSocket URL based on environment
  const getWebSocketUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'ws://localhost:3001/ws/supervisor-sync';
      }
    }
    
    const baseUrl = API_CONFIG.baseURL.replace('http://', '').replace('https://', '');
    const protocol = API_CONFIG.baseURL.startsWith('https') ? 'wss' : 'ws';
    return `${protocol}://${baseUrl}/ws/supervisor-sync`;
  }, []);

  // Send message with queue support
  const sendMessage = useCallback((message) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString(),
      clientId: ws.current?.clientId || 'unknown'
    };

    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify(messageWithTimestamp));
        console.log('📤 Sent message:', message.type);
        return true;
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        setLastError(`Failed to send message: ${error.message}`);
        return false;
      }
    } else {
      // Queue message for when connection is restored
      messageQueue.current.push(messageWithTimestamp);
      setQueuedMessages(messageQueue.current.length);
      console.log('📮 Queued message for later:', message.type);
      return false;
    }
  }, []);

  // Process queued messages when connection is restored
  const processMessageQueue = useCallback(() => {
    if (messageQueue.current.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
      console.log(`📬 Processing ${messageQueue.current.length} queued messages`);
      
      const messages = [...messageQueue.current];
      messageQueue.current = [];
      setQueuedMessages(0);
      
      messages.forEach(message => {
        try {
          ws.current.send(JSON.stringify(message));
          console.log('📤 Sent queued message:', message.type);
        } catch (error) {
          console.error('❌ Failed to send queued message:', error);
          // Re-queue if still failing
          messageQueue.current.push(message);
        }
      });
      
      setQueuedMessages(messageQueue.current.length);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 Received message:', data.type);

      // Call external message handler if provided
      if (onMessage) {
        onMessage(data);
      }

      switch (data.type) {
        case MESSAGE_TYPES.WELCOME:
          ws.current.clientId = data.clientId;
          console.log('👋 Welcomed with client ID:', data.clientId);
          break;

        case MESSAGE_TYPES.AUTH_SUCCESS:
          console.log('✅ Authentication successful');
          setConnectionState(CONNECTION_STATES.CONNECTED);
          setIsConnected(true);
          setLastError(null);
          reconnectAttempts.current = 0;
          
          // Update connection stats
          setConnectionStats(prev => ({
            ...prev,
            connectedAt: new Date().toISOString(),
            reconnectAttempts: 0
          }));
          
          // Process any queued messages
          processMessageQueue();
          
          // Update sync state if provided
          if (data.currentState) {
            updateSyncState(data.currentState);
          }
          break;

        case MESSAGE_TYPES.AUTH_FAILED:
          console.error('❌ Authentication failed:', data.error);
          setLastError(`Authentication failed: ${data.error}`);
          setConnectionState(CONNECTION_STATES.ERROR);
          if (onError) onError(data.error);
          break;

        case MESSAGE_TYPES.STATE_UPDATE:
          updateSyncState(data.state);
          break;

        case MESSAGE_TYPES.ALERT_ACKNOWLEDGED:
          setSyncState(prev => ({
            ...prev,
            acknowledgedAlerts: new Set([...prev.acknowledgedAlerts, data.alertId]),
            lastUpdated: data.timestamp
          }));
          
          if (data.notes) {
            setSyncState(prev => ({
              ...prev,
              supervisorNotes: new Map(prev.supervisorNotes).set(data.alertId, {
                note: data.notes,
                supervisorId: data.supervisorId,
                timestamp: data.timestamp
              })
            }));
          }
          break;

        case MESSAGE_TYPES.PRIORITY_UPDATED:
          setSyncState(prev => ({
            ...prev,
            priorityOverrides: new Map(prev.priorityOverrides).set(data.alertId, {
              priority: data.priority,
              reason: data.reason,
              supervisorId: data.supervisorId,
              timestamp: data.timestamp
            }),
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.NOTE_ADDED:
          setSyncState(prev => ({
            ...prev,
            supervisorNotes: new Map(prev.supervisorNotes).set(data.alertId, {
              note: data.note,
              supervisorId: data.supervisorId,
              timestamp: data.timestamp
            }),
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.CUSTOM_MESSAGE:
          setSyncState(prev => ({
            ...prev,
            customMessages: [...prev.customMessages, data.message],
            lastUpdated: data.timestamp
          }));
          
          // Auto-remove message after expiration
          if (data.message.expiresAt) {
            const timeToExpire = new Date(data.message.expiresAt) - new Date();
            if (timeToExpire > 0) {
              setTimeout(() => {
                setSyncState(prev => ({
                  ...prev,
                  customMessages: prev.customMessages.filter(m => m.id !== data.message.id)
                }));
              }, timeToExpire);
            }
          }
          break;

        case MESSAGE_TYPES.MESSAGE_REMOVED:
          setSyncState(prev => ({
            ...prev,
            customMessages: prev.customMessages.filter(m => m.id !== data.messageId),
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.MODE_CHANGED:
          setSyncState(prev => ({
            ...prev,
            activeMode: data.mode,
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.ALERT_DISMISSED_FROM_DISPLAY:
          setSyncState(prev => ({
            ...prev,
            dismissedFromDisplay: new Set([...prev.dismissedFromDisplay, data.alertId]),
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.ALERT_LOCKED_ON_DISPLAY:
          setSyncState(prev => ({
            ...prev,
            lockedOnDisplay: new Set([...prev.lockedOnDisplay, data.alertId]),
            lastUpdated: data.timestamp
          }));
          break;

        case MESSAGE_TYPES.ALERT_UNLOCKED_FROM_DISPLAY:
          setSyncState(prev => {
            const newLocked = new Set(prev.lockedOnDisplay);
            newLocked.delete(data.alertId);
            return {
              ...prev,
              lockedOnDisplay: newLocked,
              lastUpdated: data.timestamp
            };
          });
          break;

        case MESSAGE_TYPES.SUPERVISOR_JOINED:
          setSyncState(prev => {
            const newSupervisors = [...prev.activeSupervisors];
            // Check if supervisor already exists
            if (!newSupervisors.find(s => s.id === data.supervisor.id)) {
              newSupervisors.push(data.supervisor);
            }
            return {
              ...prev,
              activeSupervisors: newSupervisors,
              connectedSupervisors: newSupervisors.length
            };
          });
          break;

        case MESSAGE_TYPES.SUPERVISOR_LEFT:
          setSyncState(prev => {
            const newSupervisors = prev.activeSupervisors.filter(s => s.id !== data.supervisorId);
            return {
              ...prev,
              activeSupervisors: newSupervisors,
              connectedSupervisors: newSupervisors.length
            };
          });
          break;

        case MESSAGE_TYPES.SUPERVISOR_LIST_UPDATED:
          setSyncState(prev => ({
            ...prev,
            activeSupervisors: data.supervisors || [],
            connectedSupervisors: (data.supervisors || []).length
          }));
          break;

        case MESSAGE_TYPES.SUPERVISOR_ACTIVITY_UPDATE:
          setSyncState(prev => {
            const updatedSupervisors = prev.activeSupervisors.map(supervisor => 
              supervisor.id === data.supervisorId 
                ? { ...supervisor, lastActivity: data.lastActivity }
                : supervisor
            );
            return {
              ...prev,
              activeSupervisors: updatedSupervisors
            };
          });
          break;

        case MESSAGE_TYPES.SUPERVISOR_CONNECTED:
          setSyncState(prev => ({
            ...prev,
            connectedSupervisors: (data.supervisorCount || prev.connectedSupervisors + 1)
          }));
          break;

        case MESSAGE_TYPES.SUPERVISOR_DISCONNECTED:
          setSyncState(prev => ({
            ...prev,
            connectedSupervisors: Math.max(0, data.remainingSupervisors || prev.connectedSupervisors - 1)
          }));
          break;

        case MESSAGE_TYPES.DISPLAY_CONNECTED:
          setSyncState(prev => ({
            ...prev,
            connectedDisplays: (data.displayCount || prev.connectedDisplays + 1)
          }));
          break;

        case MESSAGE_TYPES.DISPLAY_DISCONNECTED:
          setSyncState(prev => ({
            ...prev,
            connectedDisplays: Math.max(0, data.remainingDisplays || prev.connectedDisplays - 1)
          }));
          break;

        case MESSAGE_TYPES.PONG:
          const now = Date.now();
          if (connectionStats.lastPing) {
            const rtt = now - connectionStats.lastPing;
            setConnectionStats(prev => ({
              ...prev,
              roundTripTime: rtt
            }));
          }
          break;

        case MESSAGE_TYPES.ERROR:
          console.error('❌ Server error:', data.error);
          setLastError(data.error);
          if (onError) onError(data.error);
          break;

        default:
          console.log('⚠️ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
      setLastError(`Message parsing error: ${error.message}`);
    }
  }, [onMessage, onError, processMessageQueue]);

  // Update sync state from server
  const updateSyncState = useCallback((state) => {
    setSyncState(prev => ({
      ...prev,
      acknowledgedAlerts: state.acknowledgedAlerts ? new Set(state.acknowledgedAlerts) : prev.acknowledgedAlerts,
      priorityOverrides: state.priorityOverrides ? new Map(Object.entries(state.priorityOverrides)) : prev.priorityOverrides,
      supervisorNotes: state.supervisorNotes ? new Map(Object.entries(state.supervisorNotes)) : prev.supervisorNotes,
      customMessages: state.customMessages || prev.customMessages,
      dismissedFromDisplay: state.dismissedFromDisplay ? new Set(state.dismissedFromDisplay) : prev.dismissedFromDisplay,
      lockedOnDisplay: state.lockedOnDisplay ? new Set(state.lockedOnDisplay) : prev.lockedOnDisplay,
      activeMode: state.activeMode || prev.activeMode,
      connectedSupervisors: state.connectedSupervisors ?? prev.connectedSupervisors,
      connectedDisplays: state.connectedDisplays ?? prev.connectedDisplays,
      activeSupervisors: state.activeSupervisors || prev.activeSupervisors,
      lastUpdated: state.lastUpdated || new Date().toISOString()
    }));
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('🔌 Already connected or connecting');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to:', wsUrl);
      
      setConnectionState(CONNECTION_STATES.CONNECTING);
      setLastError(null);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connection opened');
        setConnectionState(CONNECTION_STATES.CONNECTING); // Still connecting until auth
        
        // Authenticate based on client type
        const authMessage = {
          type: MESSAGE_TYPES.AUTH,
          clientType,
          ...(clientType === 'supervisor' && { supervisorId, sessionId })
        };
        
        // Send auth message directly (don't use sendMessage which checks connection state)
        try {
          ws.current.send(JSON.stringify({
            ...authMessage,
            timestamp: new Date().toISOString()
          }));
          console.log('📤 Sent auth message:', authMessage.clientType);
        } catch (error) {
          console.error('❌ Failed to send auth message:', error);
          setLastError('Authentication failed');
        }
      };

      ws.current.onmessage = handleMessage;

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionState(CONNECTION_STATES.ERROR);
        setLastError('WebSocket connection error');
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
        if (onError) {
          onError('WebSocket connection error');
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState(CONNECTION_STATES.DISCONNECTED);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }
        
        // Attempt reconnection if not a clean close (very limited attempts to prevent storm)
        if (event.code !== 1000 && reconnectAttempts.current < 2) {
          scheduleReconnect();
        } else if (reconnectAttempts.current >= 2) {
          console.log('🛑 Max reconnection attempts reached (2), stopping to prevent connection storm');
          setLastError('Connection failed after 2 attempts. Please refresh page.');
        }
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setConnectionState(CONNECTION_STATES.ERROR);
      setLastError(`Connection failed: ${error.message}`);
    }
  }, [clientType, supervisorId, sessionId, getWebSocketUrl, sendMessage, handleMessage, onConnectionChange, onError]);

  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    reconnectAttempts.current++;
    // Very conservative reconnection to prevent connection storms
    const delay = Math.min(5000 * Math.pow(2, reconnectAttempts.current), 30000); // Start at 5s, max 30s
    
    console.log(`🔄 Scheduling reconnection attempt ${reconnectAttempts.current} in ${delay}ms`);
    setConnectionState(CONNECTION_STATES.RECONNECTING);
    
    setConnectionStats(prev => ({
      ...prev,
      reconnectAttempts: reconnectAttempts.current
    }));

    reconnectTimeout.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket');
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }
    
    setConnectionState(CONNECTION_STATES.DISCONNECTED);
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  // Start ping interval for connection health
  const startPingInterval = useCallback(() => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    
    pingInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const pingTime = Date.now();
        setConnectionStats(prev => ({
          ...prev,
          lastPing: pingTime
        }));
        
        sendMessage({ type: MESSAGE_TYPES.PING });
      }
    }, 60000); // Ping every 60 seconds (reduced frequency)
  }, [sendMessage]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
      startPingInterval();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect]); // Removed circular dependencies

  // Supervisor-specific actions
  const acknowledgeAlert = useCallback((alertId, reason, notes = '') => {
    return sendMessage({
      type: MESSAGE_TYPES.ACKNOWLEDGE_ALERT,
      alertId,
      reason,
      notes
    });
  }, [sendMessage]);

  const updateAlertPriority = useCallback((alertId, priority, reason) => {
    return sendMessage({
      type: MESSAGE_TYPES.UPDATE_PRIORITY,
      alertId,
      priority,
      reason
    });
  }, [sendMessage]);

  const addNoteToAlert = useCallback((alertId, note) => {
    return sendMessage({
      type: MESSAGE_TYPES.ADD_NOTE,
      alertId,
      note
    });
  }, [sendMessage]);

  const broadcastMessage = useCallback((message, priority = 'info', duration = 30000) => {
    return sendMessage({
      type: MESSAGE_TYPES.BROADCAST_MESSAGE,
      message,
      priority,
      duration
    });
  }, [sendMessage]);

  const setDisplayMode = useCallback((mode, reason) => {
    return sendMessage({
      type: MESSAGE_TYPES.SET_MODE,
      mode,
      reason
    });
  }, [sendMessage]);

  const updateAlerts = useCallback((alerts) => {
    return sendMessage({
      type: MESSAGE_TYPES.UPDATE_ALERTS,
      alerts
    });
  }, [sendMessage]);

  const requestCurrentState = useCallback(() => {
    return sendMessage({
      type: MESSAGE_TYPES.REQUEST_STATE
    });
  }, [sendMessage]);

  // Display control actions
  const dismissFromDisplay = useCallback((alertId, reason) => {
    return sendMessage({
      type: MESSAGE_TYPES.DISMISS_FROM_DISPLAY,
      alertId,
      reason
    });
  }, [sendMessage]);

  const lockOnDisplay = useCallback((alertId, reason) => {
    return sendMessage({
      type: MESSAGE_TYPES.LOCK_ON_DISPLAY,
      alertId,
      reason
    });
  }, [sendMessage]);

  const unlockFromDisplay = useCallback((alertId, reason) => {
    return sendMessage({
      type: MESSAGE_TYPES.UNLOCK_FROM_DISPLAY,
      alertId,
      reason
    });
  }, [sendMessage]);

  // Return hook interface
  return {
    // Connection state
    connectionState,
    isConnected,
    lastError,
    connectionStats,
    queuedMessages,
    
    // Sync state
    syncState,
    acknowledgedAlerts: syncState.acknowledgedAlerts,
    priorityOverrides: syncState.priorityOverrides,
    supervisorNotes: syncState.supervisorNotes,
    customMessages: syncState.customMessages,
    dismissedFromDisplay: syncState.dismissedFromDisplay,
    lockedOnDisplay: syncState.lockedOnDisplay,
    activeMode: syncState.activeMode,
    connectedSupervisors: syncState.connectedSupervisors,
    connectedDisplays: syncState.connectedDisplays,
    activeSupervisors: syncState.activeSupervisors,
    lastUpdated: syncState.lastUpdated,
    
    // Connection methods
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setTimeout(connect, 1000);
    },
    
    // Communication methods
    sendMessage,
    requestCurrentState,
    
    // Supervisor actions
    acknowledgeAlert,
    updateAlertPriority,
    addNoteToAlert,
    broadcastMessage,
    setDisplayMode,
    updateAlerts,
    dismissFromDisplay,
    lockOnDisplay,
    unlockFromDisplay,
    
    // Utilities
    clearError: () => setLastError(null),
    clearQueue: () => {
      messageQueue.current = [];
      setQueuedMessages(0);
    }
  };
};

// Context Provider Component
export const SupervisorSyncProvider = ({ children, ...hookProps }) => {
  const syncHook = useSupervisorSync(hookProps);

  return (
    <SupervisorSyncContext.Provider value={syncHook}>
      {children}
    </SupervisorSyncContext.Provider>
  );
};

// Hook to use the sync context
export const useSupervisorSyncContext = () => {
  const context = useContext(SupervisorSyncContext);
  
  if (!context) {
    throw new Error('useSupervisorSyncContext must be used within a SupervisorSyncProvider');
  }
  
  return context;
};

// Constants export
export { CONNECTION_STATES, MESSAGE_TYPES };

export default useSupervisorSync;
