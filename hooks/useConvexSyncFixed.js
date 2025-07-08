// Fixed version of useConvexSync that handles Convex loading properly
// This version ensures hooks are always called in the same order

import { useEffect, useCallback, useRef, useState } from 'react';

// Import Convex hooks - these will throw if Convex isn't available
let useQuery, useMutation, api;
let convexAvailable = false;

try {
  const convexReact = require('convex/react');
  useQuery = convexReact.useQuery;
  useMutation = convexReact.useMutation;
  
  // Try to import the API
  try {
    const apiModule = require('../convex/_generated/api');
    api = apiModule.api;
    convexAvailable = true;
    console.log('✅ Convex loaded successfully');
  } catch (e) {
    console.warn('⚠️ Convex API not found');
  }
} catch (e) {
  console.warn('⚠️ Convex not available - using fallback mode');
}

// Fallback implementations
const noOpMutation = () => Promise.resolve({ success: false, error: 'Convex not available' });
const fallbackUseQuery = () => undefined;
const fallbackUseMutation = () => noOpMutation;

// Use fallbacks if Convex isn't available
if (!convexAvailable) {
  useQuery = fallbackUseQuery;
  useMutation = fallbackUseMutation;
}

// Simple array helper
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [];
};

// Safe localStorage wrapper
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' && window.localStorage 
        ? window.localStorage.getItem(key) 
        : null;
    } catch { 
      return null; 
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
      return false;
    } catch { 
      return false; 
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch { 
      return false; 
    }
  }
};

// Main hook - simplified version that always calls hooks in the same order
export function useConvexSync() {
  // Always call all hooks, even if api is null
  // This ensures React's hook order is consistent
  
  // Queries - always called, returns undefined if no api
  const activeAlertsRaw = useQuery(convexAvailable && api ? api.alerts.getActiveAlerts : undefined);
  const dismissedAlertsRaw = useQuery(convexAvailable && api ? api.alerts.getDismissedAlerts : undefined);
  const activeSupervisorsRaw = useQuery(convexAvailable && api ? api.supervisors.getActiveSupervisors : undefined);
  const activeEventsRaw = useQuery(convexAvailable && api ? api.sync.getActiveEvents : undefined);
  const mostSevereEvent = useQuery(convexAvailable && api ? api.sync.getMostSevereEvent : undefined);
  const syncState = useQuery(convexAvailable && api ? api.sync.getSyncState : undefined);
  
  // Mutations - always called, returns noOpMutation if no api
  const acknowledgeAlert = useMutation(convexAvailable && api ? api.alerts.acknowledge : undefined);
  const dismissFromDisplay = useMutation(convexAvailable && api ? api.alerts.dismissFromDisplay : undefined);
  const toggleDisplayLock = useMutation(convexAvailable && api ? api.alerts.toggleDisplayLock : undefined);
  const overridePriority = useMutation(convexAvailable && api ? api.alerts.overridePriority : undefined);
  const addNote = useMutation(convexAvailable && api ? api.alerts.addNote : undefined);
  const pushToDisplay = useMutation(convexAvailable && api ? api.alerts.pushToDisplay : undefined);
  const removeFromDisplay = useMutation(convexAvailable && api ? api.alerts.removeFromDisplay : undefined);
  const forceLogout = useMutation(convexAvailable && api ? api.supervisors.forceLogout : undefined);
  const upsertEvent = useMutation(convexAvailable && api ? api.sync.upsertEvent : undefined);
  const updateEventStatus = useMutation(convexAvailable && api ? api.sync.updateEventStatus : undefined);
  
  // Process raw data into arrays
  const activeAlerts = ensureArray(activeAlertsRaw);
  const dismissedAlerts = ensureArray(dismissedAlertsRaw);
  const activeSupervisors = ensureArray(activeSupervisorsRaw);
  const activeEvents = ensureArray(activeEventsRaw);
  
  // Load session ID on mount
  useEffect(() => {
    const storedId = safeLocalStorage.getItem('convex_session_id');
    if (storedId) {
      console.log('Found stored Convex session in localStorage');
    }
  }, []);
  
  // Return consistent object shape
  return {
    // Connection status
    isConnected: convexAvailable,
    
    // Data
    activeAlerts,
    dismissedAlerts,
    activeSupervisors,
    activeEvents,
    mostSevereEvent: mostSevereEvent || null,
    syncState: syncState || null,
    pushedAlerts: [], // Hardcoded for now
    
    // Alert actions
    acknowledge: acknowledgeAlert || noOpMutation,
    dismissFromDisplay: dismissFromDisplay || noOpMutation,
    toggleDisplayLock: toggleDisplayLock || noOpMutation,
    overridePriority: overridePriority || noOpMutation,
    addNote: addNote || noOpMutation,
    pushToDisplay: pushToDisplay || noOpMutation,
    removeFromDisplay: removeFromDisplay || noOpMutation,
    
    // Supervisor actions
    forceLogout: forceLogout || noOpMutation,
    
    // Event actions
    upsertEvent: upsertEvent || noOpMutation,
    updateEventStatus: updateEventStatus || noOpMutation,
    
    // Placeholder functions for compatibility
    login: noOpMutation,
    logout: noOpMutation,
    session: null,
    setDisplayMode: noOpMutation,
    addCustomMessage: noOpMutation,
    removeCustomMessage: noOpMutation,
    activeIncidents: [],
    allIncidents: [],
    createIncident: noOpMutation,
    updateIncident: noOpMutation,
    addIncidentNote: noOpMutation,
    sendTicketerMessage: noOpMutation,
    pushIncidentToDisplay: noOpMutation,
    trackLogin: noOpMutation,
    recentLogins: [],
    loginHistory: [],
    emailTemplates: [],
    distributionLists: [],
    communicationLogs: [],
    saveEmailTemplate: noOpMutation,
    deleteEmailTemplate: noOpMutation,
    saveDistributionList: noOpMutation,
    deleteDistributionList: noOpMutation,
    logCommunication: noOpMutation,
    syncAlerts: async () => ({ success: false, error: 'Not implemented' }),
    vixData: null,
    updateVixData: noOpMutation,
    clearVixData: noOpMutation,
  };
}

// Export other hooks for backward compatibility
export function useSupervisorAuth() {
  return {
    login: noOpMutation,
    logout: noOpMutation,
    session: null,
  };
}

export function useHeartbeat(sessionId, interval = 30000) {
  // No-op implementation for now
  return;
}

export function useAlerts() {
  const { activeAlerts, dismissedAlerts, pushedAlerts, ...actions } = useConvexSync();
  return {
    activeAlerts,
    dismissedAlerts,
    pushedAlerts,
    acknowledge: actions.acknowledge,
    dismissFromDisplay: actions.dismissFromDisplay,
    toggleDisplayLock: actions.toggleDisplayLock,
    overridePriority: actions.overridePriority,
    addNote: actions.addNote,
    pushToDisplay: actions.pushToDisplay,
    removeFromDisplay: actions.removeFromDisplay,
  };
}

export function useActiveSupervisors() {
  const { activeSupervisors, forceLogout } = useConvexSync();
  return {
    activeSupervisors,
    forceLogout,
  };
}

export function useEvents() {
  const { activeEvents, mostSevereEvent, upsertEvent, updateEventStatus } = useConvexSync();
  return {
    activeEvents,
    mostSevereEvent,
    upsertEvent,
    updateEventStatus,
  };
}
