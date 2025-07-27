// Fixed useConvexSync hook without dynamic imports
// This version works with Metro bundler

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// Fallback convexDebug implementation
const convexDebug = {
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

// No-op mutation function for when Convex is not available
const noOpMutation = () => Promise.resolve({ success: false, error: 'Convex not available' });

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

// Main export - simplified without dynamic imports
export function useConvexSync() {
  // Supervisor auth
  const [sessionId, setSessionId] = useState(null);
  const login = useSafeMutation(api?.supervisors?.login);
  const logout = useSafeMutation(api?.supervisors?.logout);
  const session = sessionId ? useSafeQuery(api?.supervisors?.getSession, { sessionId }) : null;
  
  // Sync state
  const syncState = useSafeQuery(api?.sync?.getSyncState);
  const setDisplayMode = useSafeMutation(api?.sync?.setDisplayMode);
  const addCustomMessage = useSafeMutation(api?.sync?.addCustomMessage);
  const removeCustomMessage = useSafeMutation(api?.sync?.removeCustomMessage);
  
  // Alerts
  const activeAlertsRaw = useSafeQuery(api?.alerts?.getActiveAlerts);
  const dismissedAlertsRaw = useSafeQuery(api?.alerts?.getDismissedAlerts);
  const acknowledge = useSafeMutation(api?.alerts?.acknowledge);
  const dismissFromDisplay = useSafeMutation(api?.alerts?.dismissFromDisplay);
  const toggleDisplayLock = useSafeMutation(api?.alerts?.toggleDisplayLock);
  const overridePriority = useSafeMutation(api?.alerts?.overridePriority);
  const addNote = useSafeMutation(api?.alerts?.addNote);
  const pushToDisplay = useSafeMutation(api?.alerts?.pushToDisplay);
  const removeFromDisplay = useSafeMutation(api?.alerts?.removeFromDisplay);
  
  // Supervisors
  const activeSupervisorsRaw = useSafeQuery(api?.supervisors?.getActiveSupervisors);
  const forceLogout = useSafeMutation(api?.supervisors?.forceLogout);
  
  // Events
  const activeEventsRaw = useSafeQuery(api?.sync?.getActiveEvents);
  const mostSevereEvent = useSafeQuery(api?.sync?.getMostSevereEvent);
  const upsertEvent = useSafeMutation(api?.sync?.upsertEvent);
  const updateEventStatus = useSafeMutation(api?.sync?.updateEventStatus);
  
  // Incidents
  const activeIncidents = useSafeQuery(api?.sync?.getActiveIncidents);
  const allIncidents = useSafeQuery(api?.sync?.getAllIncidents);
  const createIncident = useSafeMutation(api?.sync?.createIncident);
  const updateIncident = useSafeMutation(api?.sync?.updateIncident);
  const addIncidentNote = useSafeMutation(api?.sync?.addIncidentNote);
  const sendTicketerMessage = useSafeMutation(api?.sync?.sendTicketerMessage);
  const pushIncidentToDisplay = useSafeMutation(api?.sync?.pushIncidentToDisplay);
  
  // Helper to ensure arrays
  const ensureArray = (value) => {
    return convexDebug.ensureArray(value);
  };
  
  // Auth functions
  const authenticateSupervisor = useCallback(async (credentials) => {
    try {
      const result = await login(credentials);
      if (result?.success && result?.sessionId) {
        convexDebug.safeLocalStorage.setItem('convex_session_id', result.sessionId);
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
      convexDebug.safeLocalStorage.removeItem('convex_session_id');
      setSessionId(null);
    } catch (error) {
      console.error('Convex logout error:', error);
    }
  }, [logout]);
  
  // Load session on mount
  useEffect(() => {
    const storedId = convexDebug.safeLocalStorage.getItem('convex_session_id');
    if (storedId) {
      setSessionId(storedId);
    }
  }, []);
  
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
    pushedAlerts: [],
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
    
    // Fallback functions
    convertAlertToIncident: noOpMutation,
    addIncidentAction: noOpMutation,
    archiveIncident: noOpMutation,
    getIncidentWithActions: undefined,
    getIncidentsByStatus: undefined,
    searchArchivedIncidents: undefined,
    getIncidentStats: undefined,
    
    // Additional properties
    recentLogins: [],
    loginHistory: [],
    trackLogin: noOpMutation,
    vixData: null,
    updateVixData: noOpMutation,
    clearVixData: noOpMutation,
    emailTemplates: [],
    distributionLists: [],
    communicationLogs: [],
    saveEmailTemplate: noOpMutation,
    deleteEmailTemplate: noOpMutation,
    saveDistributionList: noOpMutation,
    deleteDistributionList: noOpMutation,
    logCommunication: noOpMutation,
  };
}

export default useConvexSync;

// Additional utility hooks
export function useSupervisorActions(options = {}) {
  return [];
}

export function useLoginTracking() {
  return {
    recentLogins: [],
    loginHistory: [],
    trackLogin: noOpMutation,
  };
}

export function useHeartbeat(sessionId, interval = 30000) {
  // No-op for now
}
