// Go_BARRY/components/hooks/useRealTimeAlerts.js
// Custom hook for real-time traffic alerts

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';

export const useRealTimeAlerts = (options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    enableRealTime = true,
    filters = {}
  } = options;

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [metadata, setMetadata] = useState({});
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const refreshIntervalRef = useRef(null);
  const realtimeUnsubscribeRef = useRef(null);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      console.log('🔄 Fetching alerts with filters:', filters);
      const result = await api.getAlerts(filters);

      if (result.success) {
        setAlerts(result.data.alerts);
        setMetadata(result.data.metadata);
        setLastUpdated(result.data.metadata.lastUpdated);
        console.log(`✅ Loaded ${result.data.alerts.length} alerts`);
      } else {
        throw new Error(result.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error('❌ Failed to fetch alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('📡 Real-time update received:', payload);

    setAlerts(currentAlerts => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          // Add new alert if it doesn't exist
          if (newRecord && !currentAlerts.find(a => a.id === newRecord.id)) {
            console.log('📡 Adding new alert:', newRecord.title);
            return [newRecord, ...currentAlerts];
          }
          return currentAlerts;

        case 'UPDATE':
          // Update existing alert
          if (newRecord) {
            console.log('📡 Updating alert:', newRecord.title);
            return currentAlerts.map(alert => 
              alert.id === newRecord.id ? { ...alert, ...newRecord } : alert
            );
          }
          return currentAlerts;

        case 'DELETE':
          // Remove deleted alert
          if (oldRecord) {
            console.log('📡 Removing alert:', oldRecord.id);
            return currentAlerts.filter(alert => alert.id !== oldRecord.id);
          }
          return currentAlerts;

        default:
          return currentAlerts;
      }
    });

    // Update last updated timestamp
    setLastUpdated(new Date().toISOString());
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!enableRealTime) return;

    console.log('📡 Setting up real-time subscription...');
    
    const unsubscribe = api.subscribeToRealTimeUpdates((payload) => {
      setRealtimeConnected(true);
      handleRealtimeUpdate(payload);
    });

    realtimeUnsubscribeRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      if (realtimeUnsubscribeRef.current) {
        console.log('📡 Cleaning up real-time subscription...');
        realtimeUnsubscribeRef.current();
      }
    };
  }, [enableRealTime, handleRealtimeUpdate]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ Auto-refreshing alerts...');
      fetchAlerts(false); // Don't show loading for auto-refresh
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAlerts]);

  // Initial load
  useEffect(() => {
    fetchAlerts(true);
  }, [fetchAlerts]);

  // Manual refresh function
  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh requested...');
    return fetchAlerts(true);
  }, [fetchAlerts]);

  // Filter alerts locally
  const getFilteredAlerts = useCallback((localFilters = {}) => {
    let filtered = [...alerts];

    if (localFilters.type) {
      filtered = filtered.filter(alert => alert.type === localFilters.type);
    }

    if (localFilters.status) {
      filtered = filtered.filter(alert => alert.status === localFilters.status);
    }

    if (localFilters.severity) {
      filtered = filtered.filter(alert => alert.severity === localFilters.severity);
    }

    if (localFilters.search) {
      const search = localFilters.search.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title?.toLowerCase().includes(search) ||
        alert.description?.toLowerCase().includes(search) ||
        alert.location?.toLowerCase().includes(search) ||
        alert.affectsRoutes?.some(route => route.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [alerts]);

  // Get statistics
  const getStatistics = useCallback(() => {
    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'red').length,
      upcoming: alerts.filter(a => a.status === 'amber').length,
      planned: alerts.filter(a => a.status === 'green').length,
      incidents: alerts.filter(a => a.type === 'incident').length,
      congestion: alerts.filter(a => a.type === 'congestion').length,
      roadworks: alerts.filter(a => a.type === 'roadwork').length,
      highSeverity: alerts.filter(a => a.severity === 'High').length,
      mediumSeverity: alerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: alerts.filter(a => a.severity === 'Low').length
    };
  }, [alerts]);

  return {
    // Data
    alerts,
    loading,
    error,
    lastUpdated,
    metadata,
    realtimeConnected,

    // Functions
    refresh,
    getFilteredAlerts,
    getStatistics,

    // Statistics
    statistics: getStatistics()
  };
};

// Export default for easier imports
export default useRealTimeAlerts;