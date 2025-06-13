// Go_BARRY/components/hooks/useSupervisorPolling.js
// React hook for optimized supervisor polling to replace WebSocket communication
// Provides same interface as WebSocket hook for easy migration

import { useState, useEffect, useCallback, useRef } from 'react';
import supervisorPollingService from '../../services/supervisorPollingService';

export const useSupervisorPolling = ({
  clientType = 'display', // 'display' or 'supervisor'
  supervisorId = null,
  sessionId = null,
  autoConnect = true,
  onConnectionChange = null,
  onMessage = null,
  onError = null
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [lastError, setLastError] = useState(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());
  const [priorityOverrides, setPriorityOverrides] = useState(new Map());
  const [supervisorNotes, setSupervisorNotes] = useState(new Map());
  const [customMessages, setCustomMessages] = useState([]);
  const [dismissedFromDisplay, setDismissedFromDisplay] = useState(new Set());
  const [lockedOnDisplay, setLockedOnDisplay] = useState(new Set());
  const [connectedSupervisors, setConnectedSupervisors] = useState(0);
  const [activeSupervisors, setActiveSupervisors] = useState([]);
  const [connectionStats, setConnectionStats] = useState({
    reconnectAttempts: 0,
    lastConnected: null,
    totalPolls: 0
  });

  // Refs for callbacks
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  }, [onConnectionChange, onMessage, onError]);

  // Handle state updates from polling service
  const handleStateUpdate = useCallback((changes) => {
    console.log(`📊 ${clientType} received state update:`, Object.keys(changes));

    // Update individual state pieces
    if ('acknowledgedAlerts' in changes) {
      setAcknowledgedAlerts(changes.acknowledgedAlerts);
      onMessageRef.current?.({ type: 'alert_acknowledged', data: changes.acknowledgedAlerts });
    }

    if ('priorityOverrides' in changes) {
      setPriorityOverrides(changes.priorityOverrides);
      onMessageRef.current?.({ type: 'priority_updated', data: changes.priorityOverrides });
    }

    if ('supervisorNotes' in changes) {
      setSupervisorNotes(changes.supervisorNotes);
      onMessageRef.current?.({ type: 'note_added', data: changes.supervisorNotes });
    }

    if ('customMessages' in changes) {
      setCustomMessages(changes.customMessages);
      onMessageRef.current?.({ type: 'message_broadcast', data: changes.customMessages });
    }

    if ('dismissedFromDisplay' in changes) {
      setDismissedFromDisplay(changes.dismissedFromDisplay);
      onMessageRef.current?.({ type: 'display_dismissed', data: changes.dismissedFromDisplay });
    }

    if ('lockedOnDisplay' in changes) {
      setLockedOnDisplay(changes.lockedOnDisplay);
      onMessageRef.current?.({ type: 'display_locked', data: changes.lockedOnDisplay });
    }

    if ('connectedSupervisors' in changes) {
      setConnectedSupervisors(changes.connectedSupervisors);
    }

    if ('activeSupervisors' in changes) {
      setActiveSupervisors(changes.activeSupervisors);
    }

    // Handle connection state changes
    if ('error' in changes) {
      setLastError(changes.error);
      setIsConnected(false);
      setConnectionState('ERROR');
      onErrorRef.current?.(changes.error);
      onConnectionChangeRef.current?.(false);
    } else if ('connected' in changes) {
      const connected = changes.connected;
      setIsConnected(connected);
      setConnectionState(connected ? 'CONNECTED' : 'DISCONNECTED');
      setLastError(null);
      onConnectionChangeRef.current?.(connected);
      
      if (connected) {
        setConnectionStats(prev => ({
          ...prev,
          lastConnected: Date.now(),
          totalPolls: prev.totalPolls + 1,
          reconnectAttempts: 0
        }));
      }
    } else {
      // Successful update implies connection is working
      if (!isConnected) {
        setIsConnected(true);
        setConnectionState('CONNECTED');
        setLastError(null);
        onConnectionChangeRef.current?.(true);
      }
    }
  }, [clientType, isConnected]);

  // Connect to polling service
  const connect = useCallback(() => {
    console.log(`🔌 ${clientType} connecting to polling service...`);
    console.log(`📍 API Base URL:`, supervisorPollingService);
    setConnectionState('CONNECTING');
    
    // Add listener for state updates
    const removeListener = supervisorPollingService.addListener(handleStateUpdate);
    
    // Start polling
    console.log(`🚀 Starting polling for ${clientType}...`);
    supervisorPollingService.startPolling();
    
    // Get initial state
    const initialState = supervisorPollingService.getState();
    console.log(`📋 Initial state for ${clientType}:`, {
      connected: initialState.connected,
      connectedSupervisors: initialState.connectedSupervisors,
      activeSupervisors: initialState.activeSupervisors?.length || 0
    });
    
    setAcknowledgedAlerts(initialState.acknowledgedAlerts);
    setPriorityOverrides(initialState.priorityOverrides);
    setSupervisorNotes(initialState.supervisorNotes);
    setCustomMessages(initialState.customMessages);
    setDismissedFromDisplay(initialState.dismissedFromDisplay);
    setLockedOnDisplay(initialState.lockedOnDisplay);
    setConnectedSupervisors(initialState.connectedSupervisors);
    setActiveSupervisors(initialState.activeSupervisors);
    setIsConnected(initialState.connected);
    setConnectionState(initialState.connected ? 'CONNECTED' : 'DISCONNECTED');

    console.log(`✅ ${clientType} connected to polling service`);
    onConnectionChangeRef.current?.(initialState.connected);

    return removeListener;
  }, [clientType, handleStateUpdate]);

  // Disconnect from polling service
  const disconnect = useCallback(() => {
    console.log(`🔌 ${clientType} disconnecting from polling service...`);
    supervisorPollingService.stopPolling();
    setIsConnected(false);
    setConnectionState('DISCONNECTED');
    onConnectionChangeRef.current?.(false);
  }, [clientType]);

  // Auto-connect on mount
  useEffect(() => {
    let removeListener = null;
    
    if (autoConnect) {
      removeListener = connect();
    }

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [autoConnect, connect]);

  // Action functions for supervisors
  const acknowledgeAlert = useCallback(async (alertId, reason, notes) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can acknowledge alerts');
      return false;
    }
    
    console.log(`🎯 Supervisor acknowledging alert ${alertId}:`, reason);
    return await supervisorPollingService.acknowledgeAlert(alertId, reason, notes);
  }, [clientType]);

  const updateAlertPriority = useCallback(async (alertId, priority, reason) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can update alert priority');
      return false;
    }
    
    console.log(`🎯 Supervisor updating alert ${alertId} priority to ${priority}:`, reason);
    return await supervisorPollingService.updateAlertPriority(alertId, priority, reason);
  }, [clientType]);

  const addNoteToAlert = useCallback(async (alertId, note) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can add notes');
      return false;
    }
    
    console.log(`🎯 Supervisor adding note to alert ${alertId}:`, note);
    return await supervisorPollingService.addNoteToAlert(alertId, note);
  }, [clientType]);

  const broadcastMessage = useCallback(async (message, priority, duration) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can broadcast messages');
      return false;
    }
    
    console.log(`🎯 Supervisor broadcasting message:`, { message, priority, duration });
    return await supervisorPollingService.broadcastMessage(message, priority, duration);
  }, [clientType]);

  const dismissFromDisplay = useCallback(async (alertId, reason) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can dismiss from display');
      return false;
    }
    
    console.log(`🎯 Supervisor dismissing alert ${alertId} from display:`, reason);
    return await supervisorPollingService.dismissFromDisplay(alertId, reason);
  }, [clientType]);

  const lockOnDisplay = useCallback(async (alertId, reason) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can lock on display');
      return false;
    }
    
    console.log(`🎯 Supervisor locking alert ${alertId} on display:`, reason);
    return await supervisorPollingService.lockOnDisplay(alertId, reason);
  }, [clientType]);

  const unlockFromDisplay = useCallback(async (alertId, reason) => {
    if (clientType !== 'supervisor') {
      console.warn('Only supervisors can unlock from display');
      return false;
    }
    
    console.log(`🎯 Supervisor unlocking alert ${alertId} from display:`, reason);
    return await supervisorPollingService.unlockFromDisplay(alertId, reason);
  }, [clientType]);

  // Utility functions
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const forceRefresh = useCallback(() => {
    supervisorPollingService.forceRefresh();
  }, []);

  const resetToFastPolling = useCallback(() => {
    supervisorPollingService.resetToFastPolling();
  }, []);

  // Mock functions for compatibility (not needed in polling)
  const setDisplayMode = useCallback(async (mode, reason) => {
    console.log(`🎯 Display mode change to ${mode}:`, reason);
    // This could be implemented as a separate endpoint if needed
    return true;
  }, []);

  const updateAlerts = useCallback((alerts) => {
    console.log(`📊 ${clientType} received ${alerts.length} alerts`);
    // In polling mode, alerts come from the main app, not through sync
  }, [clientType]);

  return {
    // Connection state
    isConnected,
    connectionState,
    lastError,
    connectionStats,
    
    // Supervisor state
    acknowledgedAlerts,
    priorityOverrides,
    supervisorNotes,
    customMessages,
    dismissedFromDisplay,
    lockedOnDisplay,
    connectedSupervisors,
    activeSupervisors,
    connectedDisplays: connectedSupervisors, // Alias for compatibility
    activeMode: 'polling', // Always polling mode
    
    // Connection control
    connect,
    disconnect,
    clearError,
    forceRefresh,
    resetToFastPolling,
    
    // Supervisor actions
    acknowledgeAlert,
    updateAlertPriority,
    addNoteToAlert,
    broadcastMessage,
    dismissFromDisplay,
    lockOnDisplay,
    unlockFromDisplay,
    
    // Compatibility functions
    setDisplayMode,
    updateAlerts
  };
};

// Connection states for compatibility
export const CONNECTION_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR'
};

export default useSupervisorPolling;