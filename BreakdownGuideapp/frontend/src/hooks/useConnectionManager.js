import { useState, useEffect, useRef, useCallback } from 'react';
import { getSDCConnectionManager, destroySDCConnectionManager, CONNECTION_STATES, CONNECTION_MODES } from '../services/connectionManager';

/**
 * React hook for managing WebSocket + Polling hybrid connections
 * Provides automatic failover and reconnection capabilities
 */
export function useConnectionManager(config = {}) {
  const [connectionState, setConnectionState] = useState({
    state: CONNECTION_STATES.DISCONNECTED,
    mode: CONNECTION_MODES.WEBSOCKET,
    isConnected: false,
    isHealthy: false,
    reconnectAttempt: 0,
    maxReconnectAttempts: 5
  });

  const [messages, setMessages] = useState([]);
  const [errors, setErrors] = useState([]);
  const connectionManagerRef = useRef(null);
  const messageListenersRef = useRef([]);

  // Initialize connection manager
  useEffect(() => {
    console.log('🔌 Initializing connection manager with config:', config);
    
    const manager = getSDCConnectionManager({
      primary: CONNECTION_MODES.WEBSOCKET,
      fallback: CONNECTION_MODES.POLLING,
      autoFailover: true,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      pollingInterval: 5000,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      enableLogging: true,
      ...config
    });

    connectionManagerRef.current = manager;

    // Set initial state
    setConnectionState(manager.getState());

    // Set up event listeners
    const unsubscribeStateChange = manager.on('stateChange', (data) => {
      console.log('🔄 Connection state changed:', data);
      setConnectionState(manager.getState());
    });

    const unsubscribeConnected = manager.on('connected', (data) => {
      console.log('✅ Connection established:', data);
      setConnectionState(manager.getState());
      setErrors([]); // Clear errors on successful connection
    });

    const unsubscribeDisconnected = manager.on('disconnected', () => {
      console.log('❌ Connection lost');
      setConnectionState(manager.getState());
    });

    const unsubscribeMessage = manager.on('message', (message) => {
      console.log('📨 Message received:', message);
      setMessages(prev => [message, ...prev.slice(0, 99)]); // Keep last 100 messages
      
      // Notify message listeners
      messageListenersRef.current.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    });

    const unsubscribeError = manager.on('error', (error) => {
      console.error('🚨 Connection error:', error);
      setErrors(prev => [
        { ...error, timestamp: new Date().toISOString() },
        ...prev.slice(0, 9) // Keep last 10 errors
      ]);
    });

    // Auto-connect
    if (config.autoConnect !== false) {
      console.log('🚀 Auto-connecting...');
      manager.connect(config.endpoint || '/ws/sdc-dashboard');
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up connection manager');
      unsubscribeStateChange();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeMessage();
      unsubscribeError();
      
      if (config.destroyOnUnmount !== false) {
        destroySDCConnectionManager();
      }
    };
  }, []); // Empty dependency array - only run once

  // Connection control functions
  const connect = useCallback((endpoint) => {
    if (connectionManagerRef.current) {
      console.log('🔌 Manual connect requested');
      connectionManagerRef.current.connect(endpoint);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (connectionManagerRef.current) {
      console.log('🔌 Manual disconnect requested');
      connectionManagerRef.current.disconnect();
    }
  }, []);

  const switchMode = useCallback((mode) => {
    if (connectionManagerRef.current) {
      console.log('🔄 Switching connection mode to:', mode);
      connectionManagerRef.current.switchMode(mode);
    }
  }, []);

  const send = useCallback((message) => {
    if (connectionManagerRef.current) {
      console.log('📤 Sending message:', message);
      connectionManagerRef.current.send(message);
    } else {
      console.warn('Cannot send message - connection manager not available');
    }
  }, []);

  const retry = useCallback(() => {
    if (connectionManagerRef.current) {
      console.log('🔄 Retrying connection');
      connectionManagerRef.current.connect();
    }
  }, []);

  // Message subscription
  const onMessage = useCallback((listener) => {
    if (typeof listener !== 'function') {
      throw new Error('Message listener must be a function');
    }

    messageListenersRef.current.push(listener);

    // Return unsubscribe function
    return () => {
      const index = messageListenersRef.current.indexOf(listener);
      if (index > -1) {
        messageListenersRef.current.splice(index, 1);
      }
    };
  }, []);

  // Health monitoring
  const getHealth = useCallback(() => {
    if (connectionManagerRef.current) {
      return connectionManagerRef.current.getConnectionHealth();
    }
    return null;
  }, []);

  // Clear functions
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Force refresh (useful for testing)
  const forceRefresh = useCallback(() => {
    if (connectionManagerRef.current) {
      console.log('🔄 Force refreshing connection state');
      setConnectionState(connectionManagerRef.current.getState());
    }
  }, []);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState.isConnected,
    isHealthy: connectionState.isHealthy,
    currentMode: connectionState.mode,
    
    // Messages and errors
    messages,
    errors,
    latestMessage: messages[0] || null,
    latestError: errors[0] || null,
    
    // Connection control
    connect,
    disconnect,
    retry,
    switchMode,
    send,
    
    // Event subscription
    onMessage,
    
    // Utilities
    getHealth,
    clearMessages,
    clearErrors,
    forceRefresh,
    
    // Direct access to manager (use sparingly)
    manager: connectionManagerRef.current
  };
}

/**
 * Simplified hook for components that only need to listen to messages
 */
export function useConnectionMessages(config = {}) {
  const {
    messages,
    latestMessage,
    onMessage,
    isConnected,
    currentMode
  } = useConnectionManager({ ...config, destroyOnUnmount: false });

  return {
    messages,
    latestMessage,
    onMessage,
    isConnected,
    currentMode
  };
}

/**
 * Hook for connection status monitoring only
 */
export function useConnectionStatus(config = {}) {
  const {
    connectionState,
    isConnected,
    isHealthy,
    currentMode,
    errors,
    latestError,
    getHealth
  } = useConnectionManager({ ...config, destroyOnUnmount: false });

  return {
    connectionState,
    isConnected,
    isHealthy,
    currentMode,
    errors,
    latestError,
    getHealth
  };
}

export default useConnectionManager;