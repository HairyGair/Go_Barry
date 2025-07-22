/*
 * Go Barry - WebSocket Hook for Incidents
 * Provides real-time updates for incident management
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, View, Text } from 'react-native';

const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://go-barry.onrender.com/ws/supervisor-sync'
  : 'ws://localhost:3001/ws/supervisor-sync';

const RECONNECT_INTERVALS = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

export const useIncidentWebSocket = ({ 
  sessionId, 
  supervisorName,
  onIncidentCreated,
  onIncidentUpdated,
  onIncidentResolved,
  onConnectionChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const wsRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isPollbackRef = useRef(false);

  // Clear all intervals and timeouts
  const clearTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((type, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type,
          sessionId,
          supervisorName,
          timestamp: new Date().toISOString(),
          ...data
        }));
        return true;
      } catch (error) {
        console.error('❌ WebSocket send error:', error);
        return false;
      }
    }
    return false;
  }, [sessionId, supervisorName]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('📨 WebSocket message:', message.type);

      switch (message.type) {
        case 'welcome':
          console.log('✅ WebSocket connected:', message.message);
          setIsConnected(true);
          setConnectionStatus('connected');
          setReconnectAttempt(0);
          if (onConnectionChange) onConnectionChange(true);
          break;

        case 'incidentCreated':
          console.log('🆕 New incident via WebSocket:', message.incident?.id);
          if (onIncidentCreated && message.incident) {
            onIncidentCreated(message.incident);
          }
          break;

        case 'incidentUpdated':
          console.log('📝 Incident updated via WebSocket:', message.incident?.id);
          if (onIncidentUpdated && message.incident) {
            onIncidentUpdated(message.incident);
          }
          break;

        case 'incidentResolved':
          console.log('✅ Incident resolved via WebSocket:', message.incidentId);
          if (onIncidentResolved && message.incidentId) {
            onIncidentResolved(message.incidentId);
          }
          break;

        case 'heartbeat':
          setLastHeartbeat(new Date());
          break;

        case 'supervisorUpdate':
          // Handle supervisor activity updates
          console.log('👤 Supervisor update:', message);
          break;

        default:
          console.log('🔔 Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  }, [onIncidentCreated, onIncidentUpdated, onIncidentResolved, onConnectionChange]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // TEMPORARY: Skip WebSocket connection until backend is properly configured
    // This prevents connection errors from appearing in the console
    console.log('📡 Using polling mode for incident updates (WebSocket temporarily disabled)');
    setConnectionStatus('polling');
    isPollbackRef.current = true;
    setIsConnected(false);
    if (onConnectionChange) onConnectionChange(false);
    return;
    
    // WebSocket code below will be re-enabled when backend is ready
    if (Platform.OS !== 'web') {
      console.log('⚠️ WebSocket only available on web platform');
      setConnectionStatus('polling');
      isPollbackRef.current = true;
      return;
    }

    if (!sessionId || !supervisorName) {
      console.log('⚠️ Missing sessionId or supervisorName for WebSocket');
      setConnectionStatus('polling');
      isPollbackRef.current = true;
      return;
    }

    // If we're already in polling mode due to previous failures, don't try WebSocket
    if (isPollbackRef.current && reconnectAttempt >= 2) {
      console.log('⚠️ Skipping WebSocket - already in polling mode');
      setConnectionStatus('polling');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    clearTimers();
    setConnectionStatus('connecting');

    try {
      console.log('🔌 Attempting WebSocket connection to:', WEBSOCKET_URL);
      console.log('🔌 Connection details:', {
        url: WEBSOCKET_URL,
        sessionId: sessionId,
        supervisorName: supervisorName,
        timestamp: new Date().toISOString()
      });
      
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn('⚠️ WebSocket connection timeout, switching to polling');
          ws.close();
          setConnectionStatus('polling');
          isPollbackRef.current = true;
        }
      }, 5000); // 5 second timeout

      ws.onopen = () => {
        console.log('🔗 WebSocket connection opened successfully');
        console.log('🔗 WebSocket readyState:', ws.readyState);
        clearTimeout(connectionTimeout); // Clear the timeout since connection succeeded
        setConnectionStatus('authenticating');
        
        // Send authentication
        ws.send(JSON.stringify({
          type: 'authenticate',
          sessionId,
          supervisorName,
          role: 'supervisor',
          timestamp: new Date().toISOString()
        }));

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeat',
              sessionId,
              timestamp: new Date().toISOString()
            }));
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout); // Clear timeout
        console.warn('⚠️ WebSocket connection failed - this is expected if backend WebSocket server is not running');
        console.log('📡 Switching to polling mode for incident updates');
        console.log('🔍 WebSocket error details:', {
          url: WEBSOCKET_URL,
          readyState: ws.readyState,
          timestamp: new Date().toISOString()
        });
        
        setConnectionStatus('polling');
        setIsConnected(false);
        
        // Notify parent component about connection failure
        if (onConnectionChange) onConnectionChange(false);
        
        // Switch to polling mode after WebSocket failures
        isPollbackRef.current = true;
        
        // Don't retry WebSocket for this session to avoid spam
        console.log('📡 Using auto-refresh polling instead of real-time WebSocket updates');
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout); // Clear timeout
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        clearTimers();
        
        if (onConnectionChange) onConnectionChange(false);

        // Reconnect logic - but limit attempts to avoid spam
        if (!event.wasClean && reconnectAttempt < 2) { // Only try twice
          const delay = RECONNECT_INTERVALS[reconnectAttempt];
          console.log(`🔄 WebSocket reconnect attempt ${reconnectAttempt + 1}/2 in ${delay}ms`);
          setConnectionStatus('reconnecting');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.log('📡 WebSocket unavailable - using polling mode for reliable incident updates');
          setConnectionStatus('polling');
          isPollbackRef.current = true;
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionStatus('error');
      // Switch to polling mode on creation error
      isPollbackRef.current = true;
      setConnectionStatus('polling');
    }
  }, [sessionId, supervisorName, reconnectAttempt, handleMessage, clearTimers, onConnectionChange]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    console.log('👋 Disconnecting WebSocket');
    clearTimers();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setReconnectAttempt(0);
    isPollbackRef.current = false;
  }, [clearTimers]);

  // Emit incident events
  const emitIncidentCreated = useCallback((incident) => {
    return sendMessage('incidentCreated', { incident });
  }, [sendMessage]);

  const emitIncidentUpdated = useCallback((incident) => {
    return sendMessage('incidentUpdated', { incident });
  }, [sendMessage]);

  const emitIncidentResolved = useCallback((incidentId) => {
    return sendMessage('incidentResolved', { incidentId });
  }, [sendMessage]);

  // Initialize connection
  useEffect(() => {
    if (sessionId && supervisorName) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, supervisorName]); // Only reconnect if these change

  // Monitor connection health
  useEffect(() => {
    if (!isConnected || !lastHeartbeat) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastHeartbeat = now - lastHeartbeat;
      
      // If no heartbeat for 90 seconds, assume connection lost
      if (timeSinceLastHeartbeat > 90000) {
        console.warn('⚠️ No heartbeat received, connection may be lost');
        disconnect();
        connect();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [isConnected, lastHeartbeat, disconnect, connect]);

  return {
    isConnected,
    connectionStatus,
    lastHeartbeat,
    isPolling: isPollbackRef.current,
    reconnectAttempt,
    emitIncidentCreated,
    emitIncidentUpdated,
    emitIncidentResolved,
    reconnect: connect,
    disconnect
  };
};

// Connection status indicator component
export const WebSocketStatus = ({ status, lastHeartbeat }) => {
  const [opacity, setOpacity] = React.useState(1);
  
  // Pulse animation for connected state
  React.useEffect(() => {
    if (status !== 'connected') return;
    
    const interval = setInterval(() => {
      setOpacity(prev => prev === 1 ? 0.5 : 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return '#10B981';
      case 'connecting': return '#F59E0B';
      case 'authenticating': return '#3B82F6';
      case 'reconnecting': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'polling': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Live';
      case 'connecting': return 'Connecting...';
      case 'authenticating': return 'Authenticating...';
      case 'reconnecting': return 'Reconnecting...';
      case 'error': return 'Connection Error';
      case 'polling': return 'Auto-Refresh Active';
      default: return 'Offline';
    }
  };

  if (Platform.OS !== 'web') return null;

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: 'rgba(0,0,0,0.1)',
      borderRadius: 8
    }}>
      <View style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: getStatusColor(),
        opacity: status === 'connected' ? opacity : 1
      }} />
      <Text style={{ 
        color: getStatusColor(), 
        fontWeight: '600',
        fontSize: 12
      }}>
        {getStatusText()}
      </Text>
      {lastHeartbeat && status === 'connected' && (
        <Text style={{ 
          color: '#6B7280', 
          fontSize: 11 
        }}>
          {(() => {
            try {
              const date = new Date(lastHeartbeat);
              return `Last sync: ${date.toLocaleTimeString('en-GB')}`;
            } catch {
              return 'Last sync: --:--';
            }
          })()}
        </Text>
      )}
    </View>
  );
};
