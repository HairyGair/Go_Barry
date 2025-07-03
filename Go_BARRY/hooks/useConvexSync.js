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
        const storedId = convexDebug.safeLocalStorage.getItem('convex_session_id');
        if (storedId) {
          setSessionId(storedId);
          console.log('Loaded Convex session from localStorage');
          return;
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
  // Use fallback if convexDebug isn't ready yet
  const debugObj = convexDebug || fallbackConvexDebug;
  const activeAlerts = debugObj.ensureArray(activeAlertsRaw);
  const dismissedAlerts = debugObj.ensureArray(dismissedAlertsRaw);
  
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
  // Use fallback if convexDebug isn't ready yet
  const debugObj = convexDebug || fallbackConvexDebug;
  const activeSupervisors = debugObj.ensureArray(activeSupervisorsRaw);

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

    // Convert session ID to proper format if needed
    let convexSessionId = sessionId;
    if (typeof sessionId === 'string' && sessionId.startsWith('session-')) {
      // This is a local session ID, we need the Convex session ID from the database
      // For now, skip heartbeat for non-Convex sessions
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
  // Use fallback if convexDebug isn't ready yet
  const debugObj = convexDebug || fallbackConvexDebug;
  const activeEvents = debugObj.ensureArray(activeEventsRaw);
  
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
    // Additional safety check for length property
    try {
      if (alerts.length === 0) return { success: true, synced: 0 };
    } catch (lengthError) {
      console.error('Error accessing alerts.length:', lengthError);
      return { success: false, error: 'Invalid alerts array' };
    }
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

// Hook for email communications
export function useEmailCommunications() {
  let emailTemplates, distributionLists, communicationLogs;
  let saveEmailTemplate, deleteEmailTemplate, saveDistributionList, deleteDistributionList;
  let logCommunication;
  
  if (!api || !api.communications) {
    console.warn('Email communications via Convex not available - API not deployed');
    // Return empty arrays and no-op functions if Convex isn't available
    emailTemplates = [];
    distributionLists = [];
    communicationLogs = [];
    saveEmailTemplate = noOpMutation;
    deleteEmailTemplate = noOpMutation;
    saveDistributionList = noOpMutation;
    deleteDistributionList = noOpMutation;
    logCommunication = noOpMutation;
  } else {
    try {
      emailTemplates = useQuery(api.communications.getEmailTemplates);
      distributionLists = useQuery(api.communications.getDistributionLists);
      communicationLogs = useQuery(api.communications.getRecentCommunications);
      saveEmailTemplate = useMutation(api.communications.saveEmailTemplate);
      deleteEmailTemplate = useMutation(api.communications.deleteEmailTemplate);
      saveDistributionList = useMutation(api.communications.saveDistributionList);
      deleteDistributionList = useMutation(api.communications.deleteDistributionList);
      logCommunication = useMutation(api.communications.logCommunication);
    } catch (error) {
      console.warn('Email communications via Convex not available:', error.message);
      // Return empty arrays and no-op functions if Convex isn't available
      emailTemplates = [];
      distributionLists = [];
      communicationLogs = [];
      saveEmailTemplate = noOpMutation;
      deleteEmailTemplate = noOpMutation;
      saveDistributionList = noOpMutation;
      deleteDistributionList = noOpMutation;
      logCommunication = noOpMutation;
    }
  }

  return {
    emailTemplates: emailTemplates || [],
    distributionLists: distributionLists || [],
    communicationLogs: communicationLogs || [],
    saveEmailTemplate,
    deleteEmailTemplate,
    saveDistributionList,
    deleteDistributionList,
    logCommunication,
    loading: emailTemplates === undefined || distributionLists === undefined,
  };
}

// Create a minimal fallback object
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

// Combined hook for complete Convex integration
export function useConvexSync() {
  // Check if Convex API is properly loaded at the start
  useEffect(() => {
    try {
      if (api && convexDebug && typeof convexDebug.checkConnection === 'function') {
        if (!convexDebug.checkConnection(api)) {
          console.error('Convex API loaded but some functions are missing. Run: npx convex deploy');
        }
      }
    } catch (checkError) {
      console.warn('Error checking Convex connection:', checkError);
    }
  }, []);
  
  const auth = useSupervisorAuth();
  const sync = useSyncState();
  const alerts = useAlerts();
  const supervisors = useActiveSupervisors();
  const events = useEvents();
  const incidents = useIncidents();
  const alertSync = useAlertSync();
  const loginTracking = useLoginTracking();
  const vixDataHook = useVixData();
  const emailComms = useEmailCommunications();
  
  // Early return with complete fallback if hooks are not ready
  if (!auth || !sync || !alerts || !supervisors || !events || !incidents || !alertSync || !loginTracking || !vixDataHook || !emailComms) {
    console.warn('Some Convex hooks are not yet initialized, returning fallback');
    return createFallbackConvexSync();
  }

  // Safety check for arrays in hooks before accessing
  const safeAlerts = alerts || {};
  const safeSupervisors = supervisors || {};
  const safeEvents = events || {};
  const safeIncidents = incidents || {};
  const safeLoginTracking = loginTracking || {};
  const safeEmailComms = emailComms || {};

  // Get stored session ID on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Use fallback if convexDebug isn't ready
        const debugObj = convexDebug || fallbackConvexDebug;
        
        // Extra safety check
        if (!debugObj || !debugObj.safeLocalStorage) {
          console.log('Waiting for convexDebug to initialize...');
          return;
        }
        
        // Try localStorage first for web
        const storedId = debugObj.safeLocalStorage.getItem('convex_session_id');
        if (storedId) {
          console.log('Found stored Convex session in localStorage');
          return;
        }
        
        // Fall back to AsyncStorage only on native
        if (typeof window === 'undefined' && AsyncStorage) {
          try {
            const sessionId = await AsyncStorage.getItem('convex_session_id');
            if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
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
    
    // Add a small delay to ensure convexDebug is loaded
    const timeoutId = setTimeout(loadSession, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - only run on mount

  try {
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
    activeAlerts: (convexDebug || fallbackConvexDebug).ensureArray(alerts?.activeAlerts),
    dismissedAlerts: (convexDebug || fallbackConvexDebug).ensureArray(alerts?.dismissedAlerts),
    pushedAlerts: (convexDebug || fallbackConvexDebug).ensureArray(alerts?.pushedAlerts),
    acknowledge: alerts?.acknowledge || noOpMutation,
    dismissFromDisplay: alerts?.dismissFromDisplay || noOpMutation,
    toggleDisplayLock: alerts?.toggleDisplayLock || noOpMutation,
    overridePriority: alerts?.overridePriority || noOpMutation,
    addNote: alerts?.addNote || noOpMutation,
    pushToDisplay: alerts?.pushToDisplay || noOpMutation,
    removeFromDisplay: alerts?.removeFromDisplay || noOpMutation,
    
    // Supervisors (with extra safety checks)
    activeSupervisors: (convexDebug || fallbackConvexDebug).ensureArray(supervisors?.activeSupervisors),
    forceLogout: supervisors?.forceLogout || noOpMutation,
    
    // Events (with extra safety checks)
    activeEvents: (convexDebug || fallbackConvexDebug).ensureArray(events?.activeEvents),
    mostSevereEvent: events?.mostSevereEvent || null,
    upsertEvent: events?.upsertEvent || noOpMutation,
    updateEventStatus: events?.updateEventStatus || noOpMutation,
    
    // Incidents (with extra safety checks)
    activeIncidents: (convexDebug || fallbackConvexDebug).ensureArray(incidents?.activeIncidents),
    allIncidents: (convexDebug || fallbackConvexDebug).ensureArray(incidents?.allIncidents),
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
    recentLogins: (convexDebug || fallbackConvexDebug).ensureArray(loginTracking?.recentLogins),
    loginHistory: (convexDebug || fallbackConvexDebug).ensureArray(loginTracking?.loginHistory),
    trackLogin: loginTracking?.trackLogin || noOpMutation,
    
    // VIX data
    vixData: vixDataHook?.vixData || null,
    updateVixData: vixDataHook?.updateVixData || noOpMutation,
    clearVixData: vixDataHook?.clearVixData || noOpMutation,
    
    // Email communications
    emailTemplates: (convexDebug || fallbackConvexDebug).ensureArray(emailComms?.emailTemplates),
    distributionLists: (convexDebug || fallbackConvexDebug).ensureArray(emailComms?.distributionLists),
    communicationLogs: (convexDebug || fallbackConvexDebug).ensureArray(emailComms?.communicationLogs),
    saveEmailTemplate: emailComms?.saveEmailTemplate || noOpMutation,
    deleteEmailTemplate: emailComms?.deleteEmailTemplate || noOpMutation,
    saveDistributionList: emailComms?.saveDistributionList || noOpMutation,
    deleteDistributionList: emailComms?.deleteDistributionList || noOpMutation,
    logCommunication: emailComms?.logCommunication || noOpMutation,
    };
  } catch (error) {
    console.error('Error in useConvexSync return statement:', error);
    // Return a complete fallback object
    return createFallbackConvexSync();
  }
}
