// Go_BARRY/components/hooks/useBARRYapi.js
// BARRY Live Data Hook - Fetches live alerts from all sources
// Removes all sample data and connects to live backend APIs

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../../services/api';

const useBARRYapi = () => {
  // State management
  const [alerts, setAlerts] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [trafficIntelligence, setTrafficIntelligence] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for cleanup
  const mounted = useRef(true);
  const refreshTimer = useRef(null);

  // Statistics computed from live data
  const [statistics, setStatistics] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    trafficIncidents: 0,
    congestionAlerts: 0,
    roadworks: 0,
    mostAffectedRoutes: [],
    sourcesStatus: {}
  });

  // Clear any existing timers on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  // Calculate statistics from live data
  const calculateStatistics = useCallback((alertsData, trafficData, metadata) => {
    if (!mounted.current) return;

    const stats = {
      totalAlerts: alertsData.length,
      activeAlerts: alertsData.filter(alert => alert.status === 'red').length,
      criticalAlerts: alertsData.filter(alert => alert.severity === 'High').length,
      trafficIncidents: alertsData.filter(alert => alert.type === 'incident').length,
      congestionAlerts: alertsData.filter(alert => alert.type === 'congestion').length,
      roadworks: alertsData.filter(alert => alert.type === 'roadwork').length,
      mostAffectedRoutes: metadata?.statistics?.mostAffectedRoutes || [],
      sourcesStatus: {
        streetManager: metadata?.sources?.streetManager?.success || false,
        nationalHighways: metadata?.sources?.nationalHighways?.success || false,
        trafficIntelligence: metadata?.sources?.comprehensiveTraffic?.success || false,
        totalSources: Object.keys(metadata?.sources || {}).length,
        successfulSources: Object.values(metadata?.sources || {}).filter(s => s.success).length
      }
    };

    console.log('📊 Live Statistics Calculated:', {
      total: stats.totalAlerts,
      active: stats.activeAlerts,
      critical: stats.criticalAlerts,
      sources: `${stats.sourcesStatus.successfulSources}/${stats.sourcesStatus.totalSources}`
    });

    setStatistics(stats);
  }, []);

  // Fetch live alerts from all sources
  const fetchLiveAlerts = useCallback(async () => {
    if (!mounted.current) return;

    try {
      console.log('🔄 Fetching live alerts from all sources...');
      
      const result = await apiService.getLiveAlerts();
      
      if (!mounted.current) return;

      if (result.success) {
        setAlerts(result.alerts);
        setError(null);
        setLastUpdated(new Date().toISOString());
        
        // Calculate statistics from live data
        calculateStatistics(result.alerts, [], result.metadata);
        
        console.log(`✅ Live alerts loaded: ${result.alerts.length} total alerts`);
        console.log(`   📊 Breakdown: ${result.alerts.filter(a => a.type === 'incident').length} incidents, ${result.alerts.filter(a => a.type === 'congestion').length} congestion, ${result.alerts.filter(a => a.type === 'roadwork').length} roadworks`);
        
      } else {
        throw new Error(result.error || 'Failed to fetch live alerts');
      }
    } catch (err) {
      if (!mounted.current) return;
      
      console.error('❌ Error fetching live alerts:', err.message);
      setError(`Failed to load live alerts: ${err.message}`);
      setAlerts([]); // Clear any existing data
    }
  }, [calculateStatistics]);

  // Fetch live traffic data
  const fetchLiveTraffic = useCallback(async () => {
    if (!mounted.current) return;

    try {
      console.log('🚦 Fetching live traffic data...');
      
      const result = await apiService.getLiveTrafficData();
      
      if (!mounted.current) return;

      if (result.success) {
        setTrafficData(result.traffic);
        console.log(`✅ Live traffic loaded: ${result.traffic.length} traffic alerts`);
      } else {
        console.warn('⚠️ Traffic data fetch failed:', result.error);
        setTrafficData([]); // Clear any existing data
      }
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ Error fetching live traffic:', err.message);
      setTrafficData([]); // Clear any existing data
    }
  }, []);

  // Fetch traffic intelligence
  const fetchTrafficIntelligence = useCallback(async () => {
    if (!mounted.current) return;

    try {
      console.log('🧠 Fetching traffic intelligence...');
      
      const result = await apiService.getTrafficIntelligence();
      
      if (!mounted.current) return;

      if (result.success) {
        setTrafficIntelligence(result.intelligence);
        console.log(`✅ Traffic intelligence loaded`);
      } else {
        console.warn('⚠️ Traffic intelligence fetch failed:', result.error);
        setTrafficIntelligence(null);
      }
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ Error fetching traffic intelligence:', err.message);
      setTrafficIntelligence(null);
    }
  }, []);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    if (!mounted.current) return;

    try {
      const result = await apiService.getSystemHealth();
      
      if (!mounted.current) return;

      if (result.success) {
        setSystemHealth(result.health);
        console.log(`💚 System health loaded: ${result.health.dataSources?.unified?.alertCount || 0} alerts available`);
      } else {
        console.warn('⚠️ System health fetch failed:', result.error);
        setSystemHealth(null);
      }
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ Error fetching system health:', err.message);
      setSystemHealth(null);
    }
  }, []);

  // Complete data refresh from all sources
  const refreshAllData = useCallback(async () => {
    if (!mounted.current) return;

    setLoading(true);
    setError(null);

    console.log('🔄 Starting complete live data refresh...');

    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchLiveAlerts(),
        fetchLiveTraffic(),
        fetchTrafficIntelligence(),
        fetchSystemHealth()
      ]);

      console.log('✅ Complete live data refresh successful');
      
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ Complete data refresh failed:', err.message);
      setError(`Data refresh failed: ${err.message}`);
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [fetchLiveAlerts, fetchLiveTraffic, fetchTrafficIntelligence, fetchSystemHealth]);

  // Force refresh all sources on backend
  const forceRefresh = useCallback(async () => {
    if (!mounted.current) return;
    
    setRefreshing(true);
    
    try {
      console.log('🔄 Forcing backend refresh of all data sources...');
      
      const result = await apiService.refreshAllSources();
      
      if (!mounted.current) return;

      if (result.success) {
        console.log('✅ Backend refresh successful, reloading data...');
        // Reload all data after backend refresh
        await refreshAllData();
      } else {
        throw new Error(result.error || 'Backend refresh failed');
      }
    } catch (err) {
      if (!mounted.current) return;
      console.error('❌ Force refresh failed:', err.message);
      setError(`Force refresh failed: ${err.message}`);
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [refreshAllData]);

  // Get alerts by route
  const getAlertsByRoute = useCallback(async (routeId) => {
    try {
      const result = await apiService.getAlertsByRoute(routeId);
      return result.success ? result.alerts : [];
    } catch (err) {
      console.error(`❌ Error fetching alerts for route ${routeId}:`, err.message);
      return [];
    }
  }, []);

  // Get critical alerts only
  const getCriticalAlerts = useCallback(() => {
    return alerts.filter(alert => 
      alert.status === 'red' || alert.severity === 'High'
    );
  }, [alerts]);

  // Get traffic alerts only
  const getTrafficAlerts = useCallback(() => {
    return alerts.filter(alert => 
      alert.type === 'congestion' || alert.type === 'incident'
    );
  }, [alerts]);

  // Get roadworks only
  const getRoadworks = useCallback(() => {
    return alerts.filter(alert => alert.type === 'roadwork');
  }, [alerts]);

  // Initial data load
  useEffect(() => {
    console.log('🚀 BARRY API Hook initialized - Loading live data...');
    refreshAllData();
  }, [refreshAllData]);

  // Set up auto-refresh (every 5 minutes)
  useEffect(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
    }

    refreshTimer.current = setInterval(() => {
      console.log('⏰ Auto-refresh triggered (5min interval)');
      refreshAllData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [refreshAllData]);

  // Public API
  return {
    // Live data
    alerts,
    trafficData,
    trafficIntelligence,
    systemHealth,
    statistics,
    
    // State
    loading,
    error,
    lastUpdated,
    refreshing,
    
    // Actions
    refreshAllData,
    forceRefresh,
    
    // Utility functions
    getAlertsByRoute,
    getCriticalAlerts,
    getTrafficAlerts,
    getRoadworks,
    
    // Computed properties
    hasLiveData: alerts.length > 0,
    isSystemHealthy: systemHealth?.status === 'healthy',
    activeSourcesCount: statistics.sourcesStatus.successfulSources,
    totalSourcesCount: statistics.sourcesStatus.totalSources,
    
    // Legacy compatibility for Dashboard component
    mostAffectedRoutes: statistics.mostAffectedRoutes || []
  };
};

// Export the hook with multiple names for compatibility
export { useBARRYapi };
export { useBARRYapi as useBarryAPI };
export default useBARRYapi;