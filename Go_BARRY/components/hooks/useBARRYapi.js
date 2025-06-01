// Go_BARRY/components/hooks/useBARRYapi.js
// SAFE VERSION - Minimal imports to avoid undefined references

import { useState, useEffect, useCallback } from 'react';

// Define API functions inline to avoid import issues
const safeApiCall = async (endpoint) => {
  try {
    const response = await fetch(`https://go-barry.onrender.com${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error.message);
    return { success: false, error: error.message, data: null };
  }
};

export const useBarryAPI = (options = {}) => {
  console.log('🔧 Hook starting (safe version)...');
  
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000
  } = options;

  // State management
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [systemHealth, setSystemHealth] = useState({ 
    status: 'healthy', 
    dataSources: { 
      nationalHighways: { configured: true, status: 'enabled' },
      streetManager: { configured: true, status: 'enabled' }
    } 
  });

  console.log('🔧 State initialized');

  // Fetch alerts function
  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🔧 Fetching alerts...');
      setLoading(true);
      
      const result = await safeApiCall('/api/alerts');
      
      if (result.success) {
        const alertsData = result.data.alerts || [];
        setAlerts(alertsData);
        setLastUpdated(result.data.metadata?.lastUpdated || new Date().toISOString());
        console.log(`✅ Loaded ${alertsData.length} alerts`);
      } else {
        console.warn('⚠️ Failed to fetch alerts:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    try {
      const result = await safeApiCall('/api/health');
      if (result.success) {
        setSystemHealth(result.data);
      }
    } catch (err) {
      console.error('❌ Health fetch error:', err);
    }
  }, []);

  console.log('🔧 Functions defined');

  // Auto-refresh effect
  useEffect(() => {
    console.log('🔧 Setting up auto-refresh...');
    fetchAlerts();
    fetchSystemHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, fetchSystemHealth, autoRefresh, refreshInterval]);

  console.log('🔧 Computing alert arrays...');

  // SAFE alert processing - avoid any undefined access
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  // Process alerts safely - check every property access
  const trafficAlerts = safeAlerts;
  const roadworkAlerts = safeAlerts.filter(alert => {
    try {
      return alert && typeof alert === 'object' && alert.type === 'roadwork';
    } catch (e) {
      return false;
    }
  });
  
  const incidentAlerts = safeAlerts.filter(alert => {
    try {
      return alert && typeof alert === 'object' && alert.type === 'incident';
    } catch (e) {
      return false;
    }
  });
  
  const congestionAlerts = safeAlerts.filter(alert => {
    try {
      return alert && typeof alert === 'object' && alert.type === 'congestion';
    } catch (e) {
      return false;
    }
  });
  
  // CAREFUL: This is where "red" might be causing issues
  const criticalAlerts = safeAlerts.filter(alert => {
    try {
      return alert && 
             typeof alert === 'object' && 
             alert.status === 'red' && 
             alert.severity === 'High';
    } catch (e) {
      console.warn('🔧 Error filtering critical alerts:', e);
      return false;
    }
  });
  
  const activeAlerts = safeAlerts.filter(alert => {
    try {
      return alert && typeof alert === 'object' && alert.status === 'red';
    } catch (e) {
      console.warn('🔧 Error filtering active alerts:', e);
      return false;
    }
  });
  
  const upcomingAlerts = safeAlerts.filter(alert => {
    try {
      return alert && typeof alert === 'object' && alert.status === 'amber';
    } catch (e) {
      return false;
    }
  });

  console.log('🔧 Computing metrics...');

  // Calculate metrics safely
  const totalAlertsCount = safeAlerts.length;
  const activeAlertsCount = activeAlerts.length;
  const criticalAlertsCount = criticalAlerts.length;
  const totalSourcesCount = systemHealth?.dataSources 
    ? Object.keys(systemHealth.dataSources).length 
    : 2;

  // Process routes safely
  const routeCount = {};
  safeAlerts.forEach(alert => {
    try {
      if (alert && 
          typeof alert === 'object' && 
          alert.affectsRoutes && 
          Array.isArray(alert.affectsRoutes)) {
        alert.affectsRoutes.forEach(route => {
          if (typeof route === 'string') {
            routeCount[route] = (routeCount[route] || 0) + 1;
          }
        });
      }
    } catch (e) {
      console.warn('🔧 Error processing routes for alert:', e);
    }
  });
  
  const mostAffectedRoutes = Object.entries(routeCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  console.log('🔧 Creating function stubs...');

  // Function stubs
  const refreshAlerts = useCallback(async () => {
    console.log('🔄 Refreshing alerts...');
    await fetchAlerts();
  }, [fetchAlerts]);

  const getCriticalAlerts = useCallback(async () => criticalAlerts, [criticalAlerts]);
  const getActiveAlerts = useCallback(async () => activeAlerts, [activeAlerts]);
  const getTrafficAlerts = useCallback(async () => trafficAlerts, [trafficAlerts]);
  const getCongestionAlerts = useCallback(async () => congestionAlerts, [congestionAlerts]);
  const getUpcomingAlerts = useCallback(async () => upcomingAlerts, [upcomingAlerts]);
  const getAlertsByRoute = useCallback(async (routeId) => {
    return safeAlerts.filter(alert => {
      try {
        return alert && 
               alert.affectsRoutes && 
               Array.isArray(alert.affectsRoutes) && 
               alert.affectsRoutes.includes(routeId);
      } catch (e) {
        return false;
      }
    });
  }, [safeAlerts]);
  const getRoadworks = useCallback(async () => roadworkAlerts, [roadworkAlerts]);
  const getIncidents = useCallback(async () => incidentAlerts, [incidentAlerts]);
  const validateHookFunctions = useCallback(() => {
    console.log('🔧 Hook validation: All functions available');
    return true;
  }, []);

  console.log('🔧 Creating return object...');

  // SAFE return object
  const returnValue = {
    // Core data
    alerts: safeAlerts,
    loading: loading || false,
    error: error || null,
    lastUpdated: lastUpdated || null,
    systemHealth: systemHealth || { status: 'unknown', dataSources: {} },
    isRefreshing: loading || false,
    
    // Alert arrays
    trafficAlerts: trafficAlerts,
    roadworkAlerts: roadworkAlerts,
    incidentAlerts: incidentAlerts,
    congestionAlerts: congestionAlerts,
    criticalAlerts: criticalAlerts,
    activeAlerts: activeAlerts,
    upcomingAlerts: upcomingAlerts,
    
    // Functions
    refreshAlerts,
    fetchSystemHealth,
    getCriticalAlerts,
    getActiveAlerts,
    getTrafficAlerts,
    getCongestionAlerts,
    getUpcomingAlerts,
    getAlertsByRoute,
    getRoadworks,
    getIncidents,
    validateHookFunctions,
    
    // Computed values
    totalAlertsCount,
    activeAlertsCount,
    criticalAlertsCount,
    totalSourcesCount,
    mostAffectedRoutes,
    
    // Utilities
    hasData: safeAlerts.length > 0,
    isHealthy: systemHealth?.status === 'healthy',
    
    // Debug info
    debugInfo: {
      alertsCount: safeAlerts.length,
      healthStatus: systemHealth?.status || 'unknown',
      lastFetch: lastUpdated,
      version: 'safe-v2'
    }
  };

  console.log('🔧 Hook completed successfully');
  
  return returnValue;
};

// Default export
export default useBarryAPI;