// React hooks for Convex real-time sync in Go BARRY
// Gracefully handles cases where Convex is not deployed yet

import { useEffect, useCallback, useRef, useState } from 'react';

// Fallback convexDebug implementation
const fallbackConvexDebug = {
  safeLocalStorage: {
    getItem: (key) => {
      try {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
      } catch { return null; }
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
          return true;
        }
        return false;
      } catch { return false; }
    },
    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          return true;
        }
        return false;
      } catch { return false; }
    }
  },
  ensureArray: (value, defaultValue = []) => {
    try {
      if (value === null || value === undefined) return defaultValue;
      if (Array.isArray(value)) return value;
      return defaultValue;
    } catch (e) {
      console.warn('ensureArray error:', e);
      return defaultValue;
    }
  }
};

// Initialize convexDebug with fallback - always keep a valid object
let convexDebug = fallbackConvexDebug;

// Try to load convexDebug dynamically
(async () => {
  try {
    const convexDebugModule = await import('../utils/convexDebug');
    const loadedDebug = convexDebugModule.convexDebug || convexDebugModule.default;
    // Only reassign if we got a valid object
    if (loadedDebug && typeof loadedDebug === 'object' && loadedDebug.ensureArray) {
      convexDebug = loadedDebug;
    }
  } catch (error) {
    console.warn('Failed to import convexDebug, using fallback:', error);
    // Keep using fallbackConvexDebug
  }
})();

// Safely import AsyncStorage
let AsyncStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

// Try to load AsyncStorage dynamically
(async () => {
  try {
    const asyncStorageModule = await import('@react-native-async-storage/async-storage');
    AsyncStorage = asyncStorageModule.default || AsyncStorage;
  } catch (error) {
    // AsyncStorage not available on web - use fallback
    console.log('AsyncStorage not available, using fallback');
  }
})();

// Function to generate mock bus data for testing
function generateMockBusData() {
  const routes = ['21', 'X21', '1', '56', '57', '58', 'Q3', '307', '27', 'X10'];
  const buses = [];
  
  // Newcastle/Gateshead area bounds
  const bounds = {
    north: 55.0184,
    south: 54.9045,
    east: -1.4876,
    west: -1.7297
  };
  
  const busCount = 15 + Math.floor(Math.random() * 10); // 15-25 buses
  
  for (let i = 0; i < busCount; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    const delayMinutes = Math.random() < 0.7 ? Math.floor(Math.random() * 10) : 0;
    const bearing = Math.floor(Math.random() * 360);
    
    buses.push({
      id: `mock-bus-${1000 + i}`,
      vehicleRef: `GNE-${1000 + i}`,
      operatorRef: 'GNEL',
      routeName: route,
      lineRef: route,
      coordinates: [lat, lng],
      bearing: bearing,
      delay: delayMinutes,
      status: delayMinutes > 5 ? 'delayed' : 'on-time',
      destination: `${route} ${Math.random() > 0.5 ? 'Newcastle' : 'Gateshead'}`,
      occupancy: Math.random() < 0.5 ? 'seatsAvailable' : 'standingAvailable',
      lastUpdate: Date.now()
    });
  }
  
  return buses;
}

// Export a function to manually sync mock bus data
export const syncMockBusData = async () => {
  if (!useMutation || !api?.sync?.updateSimpleBusLocations) {
    console.warn('⚠️ Convex not available for mock bus sync');
    return { success: false, error: 'Convex not available' };
  }
  
  try {
    const mockBuses = generateMockBusData();
    console.log(`🚌 Syncing ${mockBuses.length} mock buses to Convex...`);
    
    // Note: This needs to be called from within a React component
    // that has access to Convex context
    const result = {
      buses: mockBuses,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Mock bus data prepared for sync');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Failed to prepare mock bus data:', error);
    return { success: false, error: error.message };
  }
};

// No-op mutation function for when Convex is not available
const noOpMutation = () => Promise.resolve({ success: false, error: 'Convex not available' });

// Initialize Convex with fallbacks
let useQuery = () => undefined; // Match Convex behavior when loading
let useMutation = () => noOpMutation;
let api = null;

// Try to load Convex dynamically
(async () => {
  try {
    const convexReact = await import('convex/react');
    
    if (convexReact) {
      useQuery = convexReact.useQuery;
      useMutation = convexReact.useMutation;
      
      // Try multiple import paths for the API
      try {
        // First try the relative path
        const apiModule = await import('../convex/_generated/api');
        api = apiModule.api;
      } catch (apiError1) {
        try {
          // Try alternative path with .js extension
          const apiModule = await import('../convex/_generated/api.js');
          api = apiModule.api;
        } catch (apiError2) {
          try {
            // Try absolute path from project root
            const apiModule = await import('../../convex/_generated/api');
            api = apiModule.api;
          } catch (apiError3) {
            console.warn('Convex API import failed with all paths:', {
              error1: apiError1.message,
              error2: apiError2.message, 
              error3: apiError3.message
            });
            api = null;
          }
        }
      }
      
      if (api) {
        console.log('✅ Convex imported successfully');
      } else {
        console.warn('⚠️ Convex React available but API not found');
      }
    } else {
      throw new Error('Convex React not available');
    }
  } catch (error) {
    console.warn('⚠️ Convex not available - using fallback mode:', error.message);
    // Fallback functions are already set above
  }
})();

// Create a complete fallback object
const createFallbackConvexSync = () => ({
  login: noOpMutation,
  logout: noOpMutation,
  session: null,
  syncState: null,
  activeAlerts: [],
  dismissedAlerts: [],
  pushedAlerts: [],
  activeSupervisors: [],
  activeEvents: [],
  mostSevereEvent: null,
  activeIncidents: [],
  allIncidents: [],
  recentLogins: [],
  loginHistory: [],
  emailTemplates: [],
  distributionLists: [],
  communicationLogs: [],
  acknowledge: noOpMutation,
  dismissFromDisplay: noOpMutation,
  toggleDisplayLock: noOpMutation,
  overridePriority: noOpMutation,
  addNote: noOpMutation,
  pushToDisplay: noOpMutation,
  removeFromDisplay: noOpMutation,
  forceLogout: noOpMutation,
  upsertEvent: noOpMutation,
  updateEventStatus: noOpMutation,
  createIncident: noOpMutation,
  updateIncident: noOpMutation,
  addIncidentNote: noOpMutation,
  sendTicketerMessage: noOpMutation,
  pushIncidentToDisplay: noOpMutation,
  trackLogin: noOpMutation,
  saveEmailTemplate: noOpMutation,
  deleteEmailTemplate: noOpMutation,
  saveDistributionList: noOpMutation,
  deleteDistributionList: noOpMutation,
  logCommunication: noOpMutation,
  syncAlerts: () => Promise.resolve({ success: false, error: 'Convex not available' }),
  setDisplayMode: noOpMutation,
  addCustomMessage: noOpMutation,
  removeCustomMessage: noOpMutation,
  incidentsLoading: false,
  convertAlertToIncident: noOpMutation,
  addIncidentAction: noOpMutation,
  archiveIncident: noOpMutation,
  getIncidentWithActions: undefined,
  getIncidentsByStatus: undefined,
  searchArchivedIncidents: undefined,
  getIncidentStats: undefined,
  vixData: null,
  updateVixData: noOpMutation,
  clearVixData: noOpMutation,
});

// Safe wrapper for useQuery
function useSafeQuery(queryFn, args) {
  try {
    if (!api || !queryFn) return undefined;
    return useQuery(queryFn, args);
  } catch (error) {
    console.warn('Query error:', error);
    return undefined;
  }
}

// Safe wrapper for useMutation
function useSafeMutation(mutationFn) {
  try {
    if (!api || !mutationFn) return noOpMutation;
    return useMutation(mutationFn);
  } catch (error) {
    console.warn('Mutation error:', error);
    return noOpMutation;
  }
}

// Main export - simplified to always work
export function useConvexSync() {
  // If API is not available, return fallback immediately
  if (!api) {
    return createFallbackConvexSync();
  }
  
  // Use all hooks unconditionally (Rules of Hooks)
  // Supervisor auth
  const [sessionId, setSessionId] = useState(null);
  const login = useSafeMutation(api.supervisors?.login);
  const logout = useSafeMutation(api.supervisors?.logout);
  const session = sessionId ? useSafeQuery(api.supervisors?.getSession, { sessionId }) : null;
  
  // Sync state
  const syncState = useSafeQuery(api.sync?.getSyncState);
  const setDisplayMode = useSafeMutation(api.sync?.setDisplayMode);
  const addCustomMessage = useSafeMutation(api.sync?.addCustomMessage);
  const removeCustomMessage = useSafeMutation(api.sync?.removeCustomMessage);
  
  // Alerts
  const activeAlertsRaw = useSafeQuery(api.alerts?.getActiveAlerts);
  const dismissedAlertsRaw = useSafeQuery(api.alerts?.getDismissedAlerts);
  const acknowledge = useSafeMutation(api.alerts?.acknowledge);
  const dismissFromDisplay = useSafeMutation(api.alerts?.dismissFromDisplay);
  const toggleDisplayLock = useSafeMutation(api.alerts?.toggleDisplayLock);
  const overridePriority = useSafeMutation(api.alerts?.overridePriority);
  const addNote = useSafeMutation(api.alerts?.addNote);
  const pushToDisplay = useSafeMutation(api.alerts?.pushToDisplay);
  const removeFromDisplay = useSafeMutation(api.alerts?.removeFromDisplay);
  
  // Supervisors
  const activeSupervisorsRaw = useSafeQuery(api.supervisors?.getActiveSupervisors);
  const forceLogout = useSafeMutation(api.supervisors?.forceLogout);
  
  // Events
  const activeEventsRaw = useSafeQuery(api.sync?.getActiveEvents);
  const mostSevereEvent = useSafeQuery(api.sync?.getMostSevereEvent);
  const upsertEvent = useSafeMutation(api.sync?.upsertEvent);
  const updateEventStatus = useSafeMutation(api.sync?.updateEventStatus);
  
  // Incidents
  const activeIncidents = useSafeQuery(api.sync?.getActiveIncidents);
  const allIncidents = useSafeQuery(api.sync?.getAllIncidents);
  const createIncident = useSafeMutation(api.sync?.createIncident);
  const updateIncident = useSafeMutation(api.sync?.updateIncident);
  const addIncidentNote = useSafeMutation(api.sync?.addIncidentNote);
  const sendTicketerMessage = useSafeMutation(api.sync?.sendTicketerMessage);
  const pushIncidentToDisplay = useSafeMutation(api.sync?.pushIncidentToDisplay);
  
  // VIX data
  const vixData = useSafeQuery(api.vixData?.getVixData);
  const updateVixData = useSafeMutation(api.vixData?.updateVixData);
  const clearVixData = useSafeMutation(api.vixData?.clearVixData);
  
  // Email communications
  const emailTemplates = useSafeQuery(api.communications?.getEmailTemplates);
  const distributionLists = useSafeQuery(api.communications?.getDistributionLists);
  const communicationLogs = useSafeQuery(api.communications?.getRecentCommunications);
  const saveEmailTemplate = useSafeMutation(api.communications?.saveEmailTemplate);
  const deleteEmailTemplate = useSafeMutation(api.communications?.deleteEmailTemplate);
  const saveDistributionList = useSafeMutation(api.communications?.saveDistributionList);
  const deleteDistributionList = useSafeMutation(api.communications?.deleteDistributionList);
  const logCommunication = useSafeMutation(api.communications?.logCommunication);
  
  // Alert sync
  const batchInsertAlerts = useSafeMutation(api.alerts?.batchInsertAlerts);
  const syncAlerts = useCallback(async (alerts) => {
    if (!alerts || !Array.isArray(alerts)) {
      console.warn('syncAlerts called with invalid alerts:', alerts);
      return { success: false, error: 'Invalid alerts parameter' };
    }
    if (!api) {
      console.warn('Alert sync skipped - Convex not available');
      return { success: false, error: 'Convex not available' };
    }
    try {
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
  
  // Auth functions
  const authenticateSupervisor = useCallback(async (credentials) => {
    try {
      const result = await login(credentials);
      if (result.success && result.sessionId) {
        const stored = convexDebug.safeLocalStorage.setItem('convex_session_id', result.sessionId);
        if (!stored && typeof window === 'undefined') {
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
      const removed = convexDebug.safeLocalStorage.removeItem('convex_session_id');
      if (!removed && typeof window === 'undefined') {
        await AsyncStorage.removeItem('convex_session_id');
      }
      setSessionId(null);
    } catch (error) {
      console.error('Convex logout error:', error);
    }
  }, [logout]);
  
  // Load session on mount
  useEffect(() => {
    const loadSessionId = async () => {
      try {
        const storedId = convexDebug.safeLocalStorage.getItem('convex_session_id');
        if (storedId) {
          setSessionId(storedId);
          console.log('Loaded Convex session from localStorage');
          return;
        }
        if (typeof window === 'undefined') {
          try {
            const id = await AsyncStorage.getItem('convex_session_id');
            if (id) {
              setSessionId(id);
            }
          } catch (error) {
            console.log('AsyncStorage not available');
          }
        }
      } catch (error) {
        console.log('Session loading error:', error);
      }
    };
    loadSessionId();
  }, []);
  
  // Helper to ensure arrays
  const ensureArray = (value) => {
    const debugObj = convexDebug || fallbackConvexDebug;
    return debugObj.ensureArray(value);
  };
  
  // Return the complete object
  return {
    // Auth
    login: authenticateSupervisor,
    logout: logoutSupervisor,
    session,
    
    // Sync state
    syncState,
    setDisplayMode,
    addCustomMessage,
    removeCustomMessage,
    
    // Alerts
    activeAlerts: ensureArray(activeAlertsRaw),
    dismissedAlerts: ensureArray(dismissedAlertsRaw),
    pushedAlerts: [], // Temporary fix
    acknowledge,
    dismissFromDisplay,
    toggleDisplayLock,
    overridePriority,
    addNote,
    pushToDisplay,
    removeFromDisplay,
    
    // Supervisors
    activeSupervisors: ensureArray(activeSupervisorsRaw),
    forceLogout,
    
    // Events
    activeEvents: ensureArray(activeEventsRaw),
    mostSevereEvent,
    upsertEvent,
    updateEventStatus,
    
    // Incidents
    activeIncidents: ensureArray(activeIncidents),
    allIncidents: ensureArray(allIncidents),
    createIncident,
    updateIncident,
    addIncidentNote,
    sendTicketerMessage,
    pushIncidentToDisplay,
    incidentsLoading: activeIncidents === undefined,
    convertAlertToIncident: noOpMutation,
    addIncidentAction: noOpMutation,
    archiveIncident: noOpMutation,
    getIncidentWithActions: undefined,
    getIncidentsByStatus: undefined,
    searchArchivedIncidents: undefined,
    getIncidentStats: undefined,
    
    // Alert sync
    syncAlerts,
    
    // Login tracking
    recentLogins: [],
    loginHistory: [],
    trackLogin: noOpMutation,
    
    // VIX data
    vixData: vixData || null,
    updateVixData,
    clearVixData,
    
    // Email communications
    emailTemplates: ensureArray(emailTemplates),
    distributionLists: ensureArray(distributionLists),
    communicationLogs: ensureArray(communicationLogs),
    saveEmailTemplate,
    deleteEmailTemplate,
    saveDistributionList,
    deleteDistributionList,
    logCommunication,
  };
}

// Main export is the useConvexSync hook above
// Individual hooks can be extracted from the main hook if needed


// Additional utility hooks
export function useSupervisorActions(options = {}) {
  const { supervisorId, alertId, limit = 50 } = options;

  let actions;
  if (!api) {
    actions = [];
  } else if (supervisorId) {
    actions = useSafeQuery(api.sync?.getSupervisorActions, { supervisorId, limit });
  } else if (alertId) {
    actions = useSafeQuery(api.sync?.getAlertActions, { alertId });
  } else {
    actions = useSafeQuery(api.sync?.getRecentActions, { limit });
  }

  return actions || [];
}

export function useLoginTracking() {
  return {
    recentLogins: [],
    loginHistory: [],
    trackLogin: noOpMutation,
  };
}

export function useHeartbeat(sessionId, interval = 30000) {
  const heartbeat = useSafeMutation(api?.sync?.heartbeat);
  const intervalRef = useRef();

  useEffect(() => {
    if (!sessionId || !api) return;

    let convexSessionId = sessionId;
    if (typeof sessionId === 'string' && sessionId.startsWith('session-')) {
      console.log('Skipping heartbeat for non-Convex session:', sessionId);
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await heartbeat({ sessionId: convexSessionId });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId, heartbeat, interval]);
}
