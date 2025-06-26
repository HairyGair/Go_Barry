// React hooks for Convex real-time sync in Go BARRY
// Gracefully handles cases where Convex is not deployed yet

import { useEffect, useCallback, useRef, useState } from 'react';

// Safely import AsyncStorage
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  // AsyncStorage not available on web
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}

// Safely import Convex with fallbacks
let useQuery, useMutation, api;

try {
  const convexReact = require('convex/react');
  const apiModule = require('../convex/_generated/api');
  
  if (convexReact && apiModule.api) {
    useQuery = convexReact.useQuery;
    useMutation = convexReact.useMutation;
    api = apiModule.api;
    console.log('Convex imported successfully');
  } else {
    throw new Error('Convex API not fully available');
  }
} catch (error) {
  console.warn('Convex not available - using fallback mode:', error.message);
  // Provide fallback functions
  useQuery = () => undefined;
  useMutation = () => {
    // Return a stable function that can be called
    return async () => ({ success: false, error: 'Convex not available' });
  };
  api = null;
}

// Hook for supervisor authentication
export function useSupervisorAuth() {
  const [sessionId, setSessionId] = useState(null);
  const login = api ? useMutation(api.supervisors.login) : useMutation();
  const logout = api ? useMutation(api.supervisors.logout) : useMutation();
  const session = sessionId && api ? useQuery(api.supervisors.getSession, { sessionId }) : undefined;

  // Load session ID on mount
  useEffect(() => {
    const loadSessionId = async () => {
      try {
        // Try localStorage first for web
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedId = window.localStorage.getItem('convex_session_id');
          if (storedId) {
            setSessionId(storedId);
            console.log('Loaded Convex session from localStorage');
            return;
          }
        }
        
        // Fall back to AsyncStorage only on native platforms
        if (typeof window === 'undefined') {
          try {
            const id = await AsyncStorage.getItem('convex_session_id');
            if (id) {
              setSessionId(id);
            }
          } catch (error) {
            // AsyncStorage not available on web
            console.log('AsyncStorage not available');
          }
        }
      } catch (error) {
        // Silently handle errors
        console.log('Session loading error:', error);
      }
    };
    
    loadSessionId();
  }, []);

  const authenticateSupervisor = useCallback(async (credentials) => {
    try {
      const result = await login(credentials);
      if (result.success && result.sessionId) {
        // Store session ID
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('convex_session_id', result.sessionId);
        } else {
          await AsyncStorage.setItem('convex_session_id', result.sessionId);
        }
        setSessionId(result.sessionId);
        return result;
      }
      return result;
    } catch (error) {
      console.error('Convex auth error:', error);
      throw error;
    }
  }, [login]);

  const logoutSupervisor = useCallback(async (sessionId) => {
    try {
      await logout({ sessionId });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('convex_session_id');
      } else {
        await AsyncStorage.removeItem('convex_session_id');
      }
      setSessionId(null);
    } catch (error) {
      console.error('Convex logout error:', error);
    }
  }, [logout]);

  return {
    login: authenticateSupervisor,
    logout: logoutSupervisor,
    session,
  };
}

// Hook for real-time sync state
export function useSyncState() {
  const syncState = api ? useQuery(api.sync.getSyncState) : undefined;
  const setDisplayMode = api ? useMutation(api.sync.setDisplayMode) : useMutation();
  const addCustomMessage = api ? useMutation(api.sync.addCustomMessage) : useMutation();
  const removeCustomMessage = api ? useMutation(api.sync.removeCustomMessage) : useMutation();

  return {
    syncState,
    setDisplayMode,
    addCustomMessage,
    removeCustomMessage,
  };
}

// Hook for alert management
export function useAlerts() {
  const activeAlerts = api ? useQuery(api.alerts.getActiveAlerts) : [];
  const dismissedAlerts = api ? useQuery(api.alerts.getDismissedAlerts) : [];
  
  // Temporarily disable pushedAlerts until Convex is re-deployed
  // TODO: Re-enable after Convex deployment
  const pushedAlerts = []; // api ? useQuery(api.alerts.getPushedAlerts) : [];
  
  const acknowledge = api ? useMutation(api.alerts.acknowledge) : useMutation();
  const dismissFromDisplay = api ? useMutation(api.alerts.dismissFromDisplay) : useMutation();
  const toggleDisplayLock = api ? useMutation(api.alerts.toggleDisplayLock) : useMutation();
  const overridePriority = api ? useMutation(api.alerts.overridePriority) : useMutation();
  const addNote = api ? useMutation(api.alerts.addNote) : useMutation();
  const pushToDisplay = api ? useMutation(api.alerts.pushToDisplay) : useMutation();
  const removeFromDisplay = api ? useMutation(api.alerts.removeFromDisplay) : useMutation();

  return {
    activeAlerts: activeAlerts || [],
    dismissedAlerts: dismissedAlerts || [],
    pushedAlerts: pushedAlerts || [],
    acknowledge,
    dismissFromDisplay,
    toggleDisplayLock,
    overridePriority,
    addNote,
    pushToDisplay,
    removeFromDisplay,
  };
}

// Hook for active supervisors
export function useActiveSupervisors() {
  const activeSupervisors = api ? useQuery(api.supervisors.getActiveSupervisors) : [];
  const forceLogout = api ? useMutation(api.supervisors.forceLogout) : useMutation();

  return {
    activeSupervisors: activeSupervisors || [],
    forceLogout,
  };
}

// Hook for supervisor actions (audit trail)
export function useSupervisorActions(options = {}) {
  const { supervisorId, alertId, limit = 50 } = options;

  let actions;
  if (!api) {
    actions = [];
  } else if (supervisorId) {
    actions = useQuery(api.sync.getSupervisorActions, { supervisorId, limit });
  } else if (alertId) {
    actions = useQuery(api.sync.getAlertActions, { alertId });
  } else {
    actions = useQuery(api.sync.getRecentActions, { limit });
  }

  return actions || [];
}

// Hook for login tracking and analytics
export function useLoginTracking() {
  // TEMPORARILY DISABLED for testing - Convex functions not deployed yet
  return {
    recentLogins: [],
    loginHistory: [],
    trackLogin: async () => ({ success: false, error: 'Login tracking not available' }),
  };
}

// Hook for session heartbeat
export function useHeartbeat(sessionId, interval = 30000) {
  const heartbeat = api ? useMutation(api.sync.heartbeat) : useMutation();
  const intervalRef = useRef();

  useEffect(() => {
    if (!sessionId || !api) return;

    const sendHeartbeat = async () => {
      try {
        await heartbeat({ sessionId });
      } catch (error) {
        console.error('Heartbeat error:', error);
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
  }, [sessionId, heartbeat, interval, api]);
}

// Hook for events management
export function useEvents() {
  const activeEvents = api ? useQuery(api.sync.getActiveEvents) : [];
  const mostSevereEvent = api ? useQuery(api.sync.getMostSevereEvent) : null;
  
  const upsertEvent = api ? useMutation(api.sync.upsertEvent) : useMutation();
  const updateEventStatus = api ? useMutation(api.sync.updateEventStatus) : useMutation();

  return {
    activeEvents: activeEvents || [],
    mostSevereEvent,
    upsertEvent,
    updateEventStatus,
  };
}

// Hook for VIX late runners data
export function useVixData() {
  let vixData, updateVixData, clearVixData;
  
  try {
    vixData = api && api.vixData ? useQuery(api.vixData.getVixData) : null;
    updateVixData = api && api.vixData ? useMutation(api.vixData.updateVixData) : useMutation();
    clearVixData = api && api.vixData ? useMutation(api.vixData.clearVixData) : useMutation();
  } catch (error) {
    console.warn('VIX data functions not available yet - Convex deployment needed');
    vixData = null;
    updateVixData = async () => ({ success: false, error: 'VIX functions not deployed' });
    clearVixData = async () => ({ success: false, error: 'VIX functions not deployed' });
  }

  return {
    vixData: vixData || null,
    updateVixData,
    clearVixData,
  };
}

// Hook for incident management
export function useIncidents() {
  let activeIncidents, allIncidents, createIncident, updateIncident, addIncidentNote, sendTicketerMessage, pushIncidentToDisplay;
  // Enhanced incident functions
  let convertAlertToIncident, addIncidentAction, archiveIncident, getIncidentWithActions, getIncidentsByStatus, searchArchivedIncidents, getIncidentStats;
  
  if (!api || !api.sync) {
    console.warn('Incident management via Convex not available - API not deployed');
    // Return empty arrays and no-op functions if Convex isn't available
    activeIncidents = [];
    allIncidents = [];
    createIncident = async () => ({ success: false, error: 'Convex not deployed' });
    updateIncident = async () => ({ success: false, error: 'Convex not deployed' });
    addIncidentNote = async () => ({ success: false, error: 'Convex not deployed' });
    sendTicketerMessage = async () => ({ success: false, error: 'Convex not deployed' });
    pushIncidentToDisplay = async () => ({ success: false, error: 'Convex not deployed' });
    // Enhanced functions
    convertAlertToIncident = async () => ({ success: false, error: 'Convex not deployed' });
    addIncidentAction = async () => ({ success: false, error: 'Convex not deployed' });
    archiveIncident = async () => ({ success: false, error: 'Convex not deployed' });
    getIncidentWithActions = undefined;
    getIncidentsByStatus = undefined;
    searchArchivedIncidents = undefined;
    getIncidentStats = undefined;
  } else {
    try {
      activeIncidents = useQuery(api.sync.getActiveIncidents);
      allIncidents = useQuery(api.sync.getAllIncidents);
      createIncident = useMutation(api.sync.createIncident);
      updateIncident = useMutation(api.sync.updateIncident);
      addIncidentNote = useMutation(api.sync.addIncidentNote);
      sendTicketerMessage = useMutation(api.sync.sendTicketerMessage);
      pushIncidentToDisplay = useMutation(api.sync.pushIncidentToDisplay);
      
      // Try to use enhanced functions if available
      if (api.incidentsEnhanced) {
        convertAlertToIncident = useMutation(api.incidentsEnhanced.convertAlertToIncident);
        addIncidentAction = useMutation(api.incidentsEnhanced.addIncidentAction);
        archiveIncident = useMutation(api.incidentsEnhanced.archiveIncident);
      } else {
        convertAlertToIncident = async () => ({ success: false, error: 'Enhanced functions not deployed' });
        addIncidentAction = async () => ({ success: false, error: 'Enhanced functions not deployed' });
        archiveIncident = async () => ({ success: false, error: 'Enhanced functions not deployed' });
      }
    } catch (error) {
      console.warn('Incident management via Convex not available:', error.message);
      // Return empty arrays and no-op functions if Convex isn't available
      activeIncidents = [];
      allIncidents = [];
      createIncident = async () => ({ success: false, error: 'Convex not deployed' });
      updateIncident = async () => ({ success: false, error: 'Convex not deployed' });
      addIncidentNote = async () => ({ success: false, error: 'Convex not deployed' });
      sendTicketerMessage = async () => ({ success: false, error: 'Convex not deployed' });
      pushIncidentToDisplay = async () => ({ success: false, error: 'Convex not deployed' });
      convertAlertToIncident = async () => ({ success: false, error: 'Convex not deployed' });
      addIncidentAction = async () => ({ success: false, error: 'Convex not deployed' });
      archiveIncident = async () => ({ success: false, error: 'Convex not deployed' });
    }
  }

  return {
    activeIncidents: activeIncidents || [],
    allIncidents: allIncidents || [],
    createIncident,
    updateIncident,
    addIncidentNote,
    sendTicketerMessage,
    pushIncidentToDisplay,
    // Enhanced functions
    convertAlertToIncident,
    addIncidentAction,
    archiveIncident,
    getIncidentWithActions,
    getIncidentsByStatus,
    searchArchivedIncidents,
    getIncidentStats,
    loading: activeIncidents === undefined,
  };
}

// Hook for alert sync from backend
export function useAlertSync() {
  const batchInsertAlerts = api ? useMutation(api.alerts.batchInsertAlerts) : useMutation();
  
  const syncAlerts = useCallback(async (alerts) => {
    if (!alerts || alerts.length === 0) return;
    if (!api) {
      console.warn('Alert sync skipped - Convex not available');
      return { success: false, error: 'Convex not available' };
    }

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
      console.log('Synced alerts to Convex:', result);
      return result;
    } catch (error) {
      console.error('Alert sync error:', error);
      throw error;
    }
  }, [batchInsertAlerts]);

  return { syncAlerts };
}

// Combined hook for complete Convex integration
export function useConvexSync() {
  const auth = useSupervisorAuth();
  const sync = useSyncState();
  const alerts = useAlerts();
  const supervisors = useActiveSupervisors();
  const events = useEvents();
  const incidents = useIncidents();
  const alertSync = useAlertSync();
  const loginTracking = useLoginTracking();
  const vixDataHook = useVixData();

  // Get stored session ID on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Try localStorage first for web
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedId = window.localStorage.getItem('convex_session_id');
          if (storedId) {
            console.log('Found stored Convex session in localStorage');
            return;
          }
        }
        
        // Fall back to AsyncStorage only on native
        if (typeof window === 'undefined') {
          try {
            const sessionId = await AsyncStorage.getItem('convex_session_id');
            if (sessionId) {
              // Session will be validated by Convex query
              console.log('Found stored Convex session in AsyncStorage');
            }
          } catch (asyncStorageError) {
            // AsyncStorage might not be available on web
            console.log('AsyncStorage not available, likely running on web');
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    };
    
    // Call the async function
    loadSession();
  }, []);

  return {
    // Auth
    login: auth.login,
    logout: auth.logout,
    session: auth.session,
    
    // Sync state
    syncState: sync.syncState,
    setDisplayMode: sync.setDisplayMode,
    addCustomMessage: sync.addCustomMessage,
    removeCustomMessage: sync.removeCustomMessage,
    
    // Alerts
    activeAlerts: alerts.activeAlerts,
    dismissedAlerts: alerts.dismissedAlerts,
    pushedAlerts: alerts.pushedAlerts,
    acknowledge: alerts.acknowledge,
    dismissFromDisplay: alerts.dismissFromDisplay,
    toggleDisplayLock: alerts.toggleDisplayLock,
    overridePriority: alerts.overridePriority,
    addNote: alerts.addNote,
    pushToDisplay: alerts.pushToDisplay,
    removeFromDisplay: alerts.removeFromDisplay,
    
    // Supervisors
    activeSupervisors: supervisors.activeSupervisors,
    forceLogout: supervisors.forceLogout,
    
    // Events
    activeEvents: events.activeEvents,
    mostSevereEvent: events.mostSevereEvent,
    upsertEvent: events.upsertEvent,
    updateEventStatus: events.updateEventStatus,
    
    // Incidents
    activeIncidents: incidents.activeIncidents,
    allIncidents: incidents.allIncidents,
    createIncident: incidents.createIncident,
    updateIncident: incidents.updateIncident,
    addIncidentNote: incidents.addIncidentNote,
    sendTicketerMessage: incidents.sendTicketerMessage,
    pushIncidentToDisplay: incidents.pushIncidentToDisplay,
    incidentsLoading: incidents.loading,
    // Enhanced incident functions
    convertAlertToIncident: incidents.convertAlertToIncident,
    addIncidentAction: incidents.addIncidentAction,
    archiveIncident: incidents.archiveIncident,
    getIncidentWithActions: incidents.getIncidentWithActions,
    getIncidentsByStatus: incidents.getIncidentsByStatus,
    searchArchivedIncidents: incidents.searchArchivedIncidents,
    getIncidentStats: incidents.getIncidentStats,
    
    // Alert sync
    syncAlerts: alertSync.syncAlerts,
    
    // Login tracking
    recentLogins: loginTracking.recentLogins,
    loginHistory: loginTracking.loginHistory,
    trackLogin: loginTracking.trackLogin,
    
    // VIX data
    vixData: vixDataHook.vixData,
    updateVixData: vixDataHook.updateVixData,
    clearVixData: vixDataHook.clearVixData,
  };
}
