/**
 * React Hook for Storage Service
 * Provides easy access to storage functionality with React state management
 */

import { useState, useEffect, useCallback } from 'react';
import storageService from '../services/storageService';

/**
 * Hook for managing breakdown drafts
 */
export const useBreakdownDraft = () => {
  const [draft, setDraft] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const savedDraft = storageService.getDraft();
    if (savedDraft) {
      setDraft(savedDraft);
      setHasDraft(true);
    }
  }, []);

  const saveDraft = useCallback((data) => {
    const result = storageService.saveDraft(data);
    if (result.success) {
      setDraft(data);
      setHasDraft(true);
    }
    return result;
  }, []);

  const clearDraft = useCallback(() => {
    storageService.clearDraft();
    setDraft(null);
    setHasDraft(false);
  }, []);

  const resumeDraft = useCallback(() => {
    return draft;
  }, [draft]);

  return {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    resumeDraft
  };
};

/**
 * Hook for managing frequent routes
 */
export const useFrequentRoutes = () => {
  const [frequentRoutes, setFrequentRoutes] = useState([]);
  const [topRoutes, setTopRoutes] = useState([]);

  useEffect(() => {
    const routes = storageService.getFrequentRoutes();
    setFrequentRoutes(routes);
    setTopRoutes(storageService.getTopRoutes(6));
  }, []);

  const updateRoute = useCallback((routeNumber, routeName) => {
    const updatedRoutes = storageService.updateFrequentRoutes(routeNumber, routeName);
    setFrequentRoutes(updatedRoutes);
    setTopRoutes(storageService.getTopRoutes(6));
    return updatedRoutes;
  }, []);

  const getTopRoutesForButtons = useCallback((limit = 6) => {
    return storageService.getTopRoutes(limit);
  }, []);

  return {
    frequentRoutes,
    topRoutes,
    updateRoute,
    getTopRoutesForButtons
  };
};

/**
 * Hook for managing activity feed
 */
export const useActivityFeed = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Load cached activities on mount
    const cached = storageService.getActivityFeed();
    if (cached.length > 0) {
      setActivities(cached);
    }
  }, []);

  const addActivity = useCallback((item) => {
    const updatedFeed = storageService.addActivityItem(item);
    setActivities(updatedFeed);
    return updatedFeed;
  }, []);

  const saveActivities = useCallback((items) => {
    const result = storageService.saveActivityFeed(items);
    if (result.success) {
      setActivities(items);
    }
    return result;
  }, []);

  return {
    activities,
    addActivity,
    saveActivities
  };
};

/**
 * Hook for managing recent locations
 */
export const useRecentLocations = () => {
  const [recentLocations, setRecentLocations] = useState([]);

  useEffect(() => {
    const locations = storageService.getRecentLocations();
    setRecentLocations(locations);
  }, []);

  const saveLocation = useCallback((location) => {
    const updated = storageService.saveRecentLocation(location);
    setRecentLocations(updated);
    return updated;
  }, []);

  return {
    recentLocations,
    saveLocation
  };
};

/**
 * Hook for managing recent fleet numbers
 */
export const useRecentFleetNumbers = () => {
  const [recentFleetNumbers, setRecentFleetNumbers] = useState([]);

  useEffect(() => {
    const numbers = storageService.getRecentFleetNumbers();
    setRecentFleetNumbers(numbers);
  }, []);

  const saveFleetNumber = useCallback((fleetNumber) => {
    const updated = storageService.saveRecentFleetNumber(fleetNumber);
    setRecentFleetNumbers(updated);
    return updated;
  }, []);

  return {
    recentFleetNumbers,
    saveFleetNumber
  };
};

/**
 * Hook for managing user preferences
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(storageService.getPreferences());

  const updatePreferences = useCallback((newPrefs) => {
    const updated = storageService.savePreferences(newPrefs);
    setPreferences(updated);
    return updated;
  }, []);

  const getPreference = useCallback((key) => {
    return preferences[key];
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
    getPreference
  };
};

/**
 * Hook for managing cached breakdowns
 */
export const useCachedBreakdowns = () => {
  const [cachedBreakdowns, setCachedBreakdowns] = useState([]);

  useEffect(() => {
    const cached = storageService.getCachedBreakdowns();
    setCachedBreakdowns(cached);
  }, []);

  const cacheBreakdowns = useCallback((breakdowns) => {
    const result = storageService.cacheBreakdowns(breakdowns);
    if (result.success) {
      setCachedBreakdowns(breakdowns);
    }
    return result;
  }, []);

  return {
    cachedBreakdowns,
    cacheBreakdowns
  };
};

/**
 * Hook for managing GTFS route cache
 */
export const useRouteCache = () => {
  const [cachedRoutes, setCachedRoutes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const routes = storageService.getCachedRoutes();
    setCachedRoutes(routes);
    setIsLoading(false);
  }, []);

  const cacheRoutes = useCallback((routes) => {
    const result = storageService.cacheRoutes(routes);
    if (result.success) {
      setCachedRoutes(routes);
    }
    return result;
  }, []);

  return {
    cachedRoutes,
    isLoading,
    cacheRoutes
  };
};

/**
 * Main hook that combines all storage functionality
 */
export const useStorage = () => {
  const draft = useBreakdownDraft();
  const routes = useFrequentRoutes();
  const feed = useActivityFeed();
  const locations = useRecentLocations();
  const fleet = useRecentFleetNumbers();
  const preferences = useUserPreferences();
  const breakdowns = useCachedBreakdowns();
  const routeCache = useRouteCache();

  // Utility functions
  const clearAllStorage = useCallback(() => {
    storageService.clearAll();
    // Reset all states
    draft.clearDraft();
    window.location.reload(); // Easiest way to reset all states
  }, [draft]);

  const getStorageInfo = useCallback(() => {
    return storageService.getStorageInfo();
  }, []);

  const exportData = useCallback(() => {
    return storageService.exportData();
  }, []);

  return {
    draft,
    routes,
    feed,
    locations,
    fleet,
    preferences,
    breakdowns,
    routeCache,
    clearAllStorage,
    getStorageInfo,
    exportData
  };
};