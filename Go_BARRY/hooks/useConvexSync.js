// hooks/useConvexSync.js
// React hooks for Convex real-time sync in Go BARRY

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hook for supervisor authentication
export function useConvexAuth() {
  const login = useMutation(api.supervisors.login);
  const logout = useMutation(api.supervisors.logout);
  const getSession = useQuery(api.supervisors.getSession);

  const authenticateSupervisor = useCallback(async (credentials) => {
    try {
      const result = await login(credentials);
      if (result.success && result.sessionId) {
        // Store session ID
        await AsyncStorage.setItem('convex_session_id', result.sessionId);
        return result;
      }
      return result;
    } catch (error) {
      console.error('❌ Convex auth error:', error);
      throw error;
    }
  }, [login]);

  const logoutSupervisor = useCallback(async (sessionId) => {
    try {
      await logout({ sessionId });
      await AsyncStorage.removeItem('convex_session_id');
    } catch (error) {
      console.error('❌ Convex logout error:', error);
    }
  }, [logout]);

  return {
    login: authenticateSupervisor,
    logout: logoutSupervisor,
    session: getSession,
  };
}

// Hook for real-time sync state
export function useSyncState() {
  const syncState = useQuery(api.sync.getSyncState);
  const setDisplayMode = useMutation(api.sync.setDisplayMode);
  const addCustomMessage = useMutation(api.sync.addCustomMessage);
  const removeCustomMessage = useMutation(api.sync.removeCustomMessage);

  return {
    syncState,
    setDisplayMode,
    addCustomMessage,
    removeCustomMessage,
  };
}

// Hook for alert management
export function useAlerts() {
  const activeAlerts = useQuery(api.alerts.getActiveAlerts);
  const dismissedAlerts = useQuery(api.alerts.getDismissedAlerts);
  
  const acknowledge = useMutation(api.alerts.acknowledge);
  const dismissFromDisplay = useMutation(api.alerts.dismissFromDisplay);
  const toggleDisplayLock = useMutation(api.alerts.toggleDisplayLock);
  const overridePriority = useMutation(api.alerts.overridePriority);
  const addNote = useMutation(api.alerts.addNote);

  return {
    activeAlerts: activeAlerts || [],
    dismissedAlerts: dismissedAlerts || [],
    acknowledge,
    dismissFromDisplay,
    toggleDisplayLock,
    overridePriority,
    addNote,
  };
}

// Hook for active supervisors
export function useActiveSupervisors() {
  const activeSupervisors = useQuery(api.supervisors.getActiveSupervisors);
  const forceLogout = useMutation(api.supervisors.forceLogout);

  return {
    activeSupervisors: activeSupervisors || [],
    forceLogout,
  };
}

// Hook for supervisor actions (audit trail)
export function useSupervisorActions(options = {}) {
  const { supervisorId, alertId, limit = 50 } = options;

  let actions;
  if (supervisorId) {
    actions = useQuery(api.sync.getSupervisorActions, { supervisorId, limit });
  } else if (alertId) {
    actions = useQuery(api.sync.getAlertActions, { alertId });
  } else {
    actions = useQuery(api.sync.getRecentActions, { limit });
  }

  return actions || [];
}

// Hook for session heartbeat
export function useHeartbeat(sessionId, interval = 30000) {
  const heartbeat = useMutation(api.sync.heartbeat);
  const intervalRef = useRef();

  useEffect(() => {
    if (!sessionId) return;

    const sendHeartbeat = async () => {
      try {
        await heartbeat({ sessionId });
      } catch (error) {
        console.error('❌ Heartbeat error:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, heartbeat, interval]);
}

// Hook for alert sync from backend
export function useAlertSync() {
  const batchInsertAlerts = useMutation(api.alerts.batchInsertAlerts);
  
  const syncAlerts = useCallback(async (alerts) => {
    if (!alerts || alerts.length === 0) return;

    try {
      // Transform alerts to match Convex schema
      const convexAlerts = alerts.map(alert => ({
        alertId: alert.id || alert.alertId,
        title: alert.title,
        description: alert.description,
        location: alert.location,
        coordinates: alert.coordinates,
        severity: alert.severity || 'medium',
        status: alert.status || 'active',
        source: alert.source,
        timestamp: alert.timestamp || Date.now(),
        affectsRoutes: alert.affectsRoutes || [],
        routeFrequencies: alert.routeFrequencies,
      }));

      const result = await batchInsertAlerts({ alerts: convexAlerts });
      console.log('✅ Synced alerts to Convex:', result);
      return result;
    } catch (error) {
      console.error('❌ Alert sync error:', error);
      throw error;
    }
  }, [batchInsertAlerts]);

  return { syncAlerts };
}

// Combined hook for complete Convex integration
export function useConvexSync() {
  const auth = useConvexAuth();
  const sync = useSyncState();
  const alerts = useAlerts();
  const supervisors = useActiveSupervisors();
  const alertSync = useAlertSync();

  // Get stored session ID on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionId = await AsyncStorage.getItem('convex_session_id');
        if (sessionId) {
          // Session will be validated by Convex query
          console.log('📱 Found stored Convex session');
        }
      } catch (error) {
        console.error('❌ Error loading session:', error);
      }
    };
    loadSession();
  }, []);

  return {
    // Auth
    ...auth,
    
    // Sync state
    ...sync,
    
    // Alerts
    ...alerts,
    
    // Supervisors
    activeSupervisors: supervisors.activeSupervisors,
    forceLogout: supervisors.forceLogout,
    
    // Alert sync
    syncAlerts: alertSync.syncAlerts,
  };
}
