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

// No-op mutation function for when Convex is not available
const noOpMutation = () => Promise.resolve({ success: false, error: 'Convex not available' });

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
  // Provide fallback functions that return appropriate default values
  useQuery = () => undefined; // Match Convex behavior when loading
  useMutation = () => noOpMutation;
  api = null;
}

// Hook for supervisor authentication
export function useSupervisorAuth() {
  const [sessionId, setSessionId] = useState(null);
  const login = api ? useMutation(api.supervisors.login) : noOpMutation;
  const logout = api ? useMutation(api.supervisors.logout) : noOpMutation;
  const session = sessionId && api ? useQuery(api.supervisors.getSession, { sessionId }) : null;

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
  const setDisplayMode = api ? useMutation(api.sync.setDisplayMode) : noOpMutation;
  const addCustomMessage = api ? useMutation(api.sync.addCustomMessage) : noOpMutation;
  const removeCustomMessage = api ? useMutation(api.sync.removeCustomMessage) : noOpMutation;

  return {
    syncState,
    setDisplayMode,
    addCustomMessage,
    removeCustomMessage,
  };
}

// Hook for alert management
export function useAlerts() {
  const activeAlertsRaw = api ? useQuery(api.alerts.getActiveAlerts) : undefined;
  const dismissedAlertsRaw = api ? useQuery(api.alerts.getDismissedAlerts) : undefined;
  
  // Ensure we always have arrays, even during loading
  const activeAlerts = Array.isArray(activeAlertsRaw) ? activeAlertsRaw : [];
  const dismissedAlerts = Array.isArray(dismissedAlertsRaw) ? dismissedAlertsRaw : [];
  
  // TEMPORARY FIX: getPushedAlerts causes Convex server error
  // The function exists in alerts.ts but the deployment seems out of sync
  // TODO: Fix by running `npx convex deploy` to update the Convex deployment
  const pushedAlerts = []; // api ? useQuery(api.alerts.getPushedAlerts) : [];
  
  const acknowledge = api ? useMutation(api.alerts.acknowledge) : noOpMutation;
  const dismissFromDisplay = api ? useMutation(api.alerts.dismissFromDisplay) : noOpMutation;
  const toggleDisplayLock = api ? useMutation(api.alerts.toggleDisplayLock) : noOpMutation;
  const overridePriority = api ? useMutation(api.alerts.overridePriority) : noOpMutation;
  const addNote = api ? useMutation(api.alerts.addNote) : noOpMutation;
  const pushToDisplay = api ? useMutation(api.alerts.pushToDisplay) : noOpMutation;
  const removeFromDisplay = api ? useMutation(api.alerts.removeFromDisplay) : noOpMutation;

  return {
    activeAlerts: activeAlerts, // Already ensured to be an array above
    dismissedAlerts: dismissedAlerts, // Already ensured to be an array above
    pushedAlerts: pushedAlerts, // Already hardcoded as empty array
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
  const activeSupervisorsRaw = api ? useQuery(api.supervisors.getActiveSupervisors) : undefined;
  const forceLogout = api ? useMutation(api.supervisors.forceLogout) : noOpMutation;
  
  // Ensure we always have an array
  const activeSupervisors = Array.isArray(activeSupervisorsRaw) ? activeSupervisorsRaw : [];

  return {
    activeSupervisors: activeSupervisors, // Already ensured to be an array above
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
    trackLogin: noOpMutation,
  };
}

// Hook for session heartbeat
export function useHeartbeat(sessionId, interval = 30000) {
  const heartbeat = api ? useMutation(api.sync.heartbeat) : noOpMutation;
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
  const activeEventsRaw = api ? useQuery(api.sync.getActiveEvents) : undefined;
  const mostSevereEvent = api ? useQuery(api.sync.getMostSevereEvent) : null;
  
  // Ensure we always have an array
  const activeEvents = Array.isArray(activeEventsRaw) ? activeEventsRaw : [];
  
  const upsertEvent = api ? useMutation(api.sync.upsertEvent) : noOpMutation;
  const updateEventStatus = api ? useMutation(api.sync.updateEventStatus) : noOpMutation;

  return {
    activeEvents: activeEvents, // Already ensured to be an array above
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
    updateVixData = api && api.vixData ? useMutation(api.vixData.updateVixData) : noOpMutation;
    clearVixData = api && api.vixData ? useMutation(api.vixData.clearVixData) : noOpMutation;
  } catch (error) {
    console.warn('VIX data functions not available yet - Convex deployment needed');
    vixData = null;
    updateVixData = noOpMutation;
    clearVixData = noOpMutation;
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
    createIncident = noOpMutation;
    updateIncident = noOpMutation;
    addIncidentNote = noOpMutation;
    sendTicketerMessage = noOpMutation;
    pushIncidentToDisplay = noOpMutation;
    // Enhanced functions
    convertAlertToIncident = noOpMutation;
    addIncidentAction = noOpMutation;
    archiveIncident = noOpMutation;
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
        convertAlertToIncident = noOpMutation;
        addIncidentAction = noOpMutation;
        archiveIncident = noOpMutation;
      }
    } catch (error) {
      console.warn('Incident management via Convex not available:', error.message);
      // Return empty arrays and no-op functions if Convex isn't available
      activeIncidents = [];
      allIncidents = [];
      createIncident = noOpMutation;
      updateIncident = noOpMutation;
      addIncidentNote = noOpMutation;
      sendTicketerMessage = noOpMutation;
      pushIncidentToDisplay = noOpMutation;
      convertAlertToIncident = noOpMutation;
      addIncidentAction = noOpMutation;
      archiveIncident = noOpMutation;
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
  const batchInsertAlerts = api ? useMutation(api.alerts.batchInsertAlerts) : noOpMutation;
  
  const syncAlerts = useCallback(async (alerts) => {
    // Add defensive check for alerts parameter
    if (!alerts || !Array.isArray(alerts)) {
      console.warn('syncAlerts called with invalid alerts:', alerts);
      return { success: false, error: 'Invalid alerts parameter' };
    }
    if (alerts.length === 0) return { success: true, synced: 0 };
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
  
  // Add defensive checks to ensure hooks are properly initialized
  if (!auth || !sync || !alerts || !supervisors || !events || !incidents || !alertSync || !loginTracking || !vixDataHook) {
    console.warn('Some Convex hooks are not yet initialized');
  }

  // Get stored session ID on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Try localStorage first for web
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const storedId = window.localStorage.getItem('convex_session_id');
            if (storedId) {
              console.log('Found stored Convex session in localStorage');
              return;
            }
          } catch (localStorageError) {
            console.log('localStorage access error:', localStorageError);
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
  }, []); // Empty dependency array - only run on mount

  return {
    // Auth
    login: auth?.login || noOpMutation,
    logout: auth?.logout || noOpMutation,
    session: auth?.session || null,
    
    // Sync state
    syncState: sync?.syncState || null,
    setDisplayMode: sync?.setDisplayMode || noOpMutation,
    addCustomMessage: sync?.addCustomMessage || noOpMutation,
    removeCustomMessage: sync?.removeCustomMessage || noOpMutation,
    
    // Alerts (with extra safety checks)
    activeAlerts: Array.isArray(alerts?.activeAlerts) ? alerts.activeAlerts : [],
    dismissedAlerts: Array.isArray(alerts?.dismissedAlerts) ? alerts.dismissedAlerts : [],
    pushedAlerts: Array.isArray(alerts?.pushedAlerts) ? alerts.pushedAlerts : [],
    acknowledge: alerts?.acknowledge || noOpMutation,
    dismissFromDisplay: alerts?.dismissFromDisplay || noOpMutation,
    toggleDisplayLock: alerts?.toggleDisplayLock || noOpMutation,
    overridePriority: alerts?.overridePriority || noOpMutation,
    addNote: alerts?.addNote || noOpMutation,
    pushToDisplay: alerts?.pushToDisplay || noOpMutation,
    removeFromDisplay: alerts?.removeFromDisplay || noOpMutation,
    
    // Supervisors (with extra safety checks)
    activeSupervisors: Array.isArray(supervisors?.activeSupervisors) ? supervisors.activeSupervisors : [],
    forceLogout: supervisors?.forceLogout || noOpMutation,
    
    // Events (with extra safety checks)
    activeEvents: Array.isArray(events?.activeEvents) ? events.activeEvents : [],
    mostSevereEvent: events?.mostSevereEvent || null,
    upsertEvent: events?.upsertEvent || noOpMutation,
    updateEventStatus: events?.updateEventStatus || noOpMutation,
    
    // Incidents (with extra safety checks)
    activeIncidents: Array.isArray(incidents?.activeIncidents) ? incidents.activeIncidents : [],
    allIncidents: Array.isArray(incidents?.allIncidents) ? incidents.allIncidents : [],
    createIncident: incidents?.createIncident || noOpMutation,
    updateIncident: incidents?.updateIncident || noOpMutation,
    addIncidentNote: incidents?.addIncidentNote || noOpMutation,
    sendTicketerMessage: incidents?.sendTicketerMessage || noOpMutation,
    pushIncidentToDisplay: incidents?.pushIncidentToDisplay || noOpMutation,
    incidentsLoading: incidents?.loading || false,
    // Enhanced incident functions
    convertAlertToIncident: incidents?.convertAlertToIncident || noOpMutation,
    addIncidentAction: incidents?.addIncidentAction || noOpMutation,
    archiveIncident: incidents?.archiveIncident || noOpMutation,
    getIncidentWithActions: incidents?.getIncidentWithActions,
    getIncidentsByStatus: incidents?.getIncidentsByStatus,
    searchArchivedIncidents: incidents?.searchArchivedIncidents,
    getIncidentStats: incidents?.getIncidentStats,
    
    // Alert sync
    syncAlerts: alertSync?.syncAlerts || (() => {}),
    
    // Login tracking (with extra safety checks)
    recentLogins: Array.isArray(loginTracking?.recentLogins) ? loginTracking.recentLogins : [],
    loginHistory: Array.isArray(loginTracking?.loginHistory) ? loginTracking.loginHistory : [],
    trackLogin: loginTracking?.trackLogin || noOpMutation,
    
    // VIX data
    vixData: vixDataHook?.vixData || null,
    updateVixData: vixDataHook?.updateVixData || noOpMutation,
    clearVixData: vixDataHook?.clearVixData || noOpMutation,
  };
}
