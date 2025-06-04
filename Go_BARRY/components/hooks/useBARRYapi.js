// Go_BARRY/components/hooks/useBARRYapi.js
// ROLLBACK TO ORIGINAL WORKING VERSION
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

  // Fetch alerts function
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await safeApiCall('/api/alerts');
      
      if (result.success) {
        const alertsData = result.data.alerts || [];
        setAlerts(alertsData);
        setLastUpdated(result.data.metadata?.lastUpdated || new Date().toISOString());
        console.log(`✅ Loaded ${alertsData.length} alerts`);
      } else {
        throw new Error(result.error);
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

  // Auto-refresh effect
  useEffect(() => {
    fetchAlerts();
    fetchSystemHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, fetchSystemHealth, autoRefresh, refreshInterval]);

  // SAFE alert processing
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  const trafficAlerts = safeAlerts;
  const roadworkAlerts = safeAlerts.filter(alert => alert?.type === 'roadwork');
  const incidentAlerts = safeAlerts.filter(alert => alert?.type === 'incident');
  const congestionAlerts = safeAlerts.filter(alert => alert?.type === 'congestion');
  const criticalAlerts = safeAlerts.filter(alert => alert?.status === 'red' && alert?.severity === 'High');
  const activeAlerts = safeAlerts.filter(alert => alert?.status === 'red');
  const upcomingAlerts = safeAlerts.filter(alert => alert?.status === 'amber');

  // Calculate metrics safely
  const totalAlertsCount = safeAlerts.length;
  const activeAlertsCount = activeAlerts.length;
  const criticalAlertsCount = criticalAlerts.length;

  // Simple function stubs
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  return {
    // Core data
    alerts: safeAlerts,
    loading,
    error,
    lastUpdated,
    systemHealth,
    isRefreshing: loading,
    
    // Alert arrays
    trafficAlerts,
    roadworkAlerts,
    incidentAlerts,
    congestionAlerts,
    criticalAlerts,
    activeAlerts,
    upcomingAlerts,
    
    // Functions
    refreshAlerts,
    fetchSystemHealth,
    
    // Computed values
    totalAlertsCount,
    activeAlertsCount,
    criticalAlertsCount,
    
    // Utilities
    hasData: safeAlerts.length > 0,
    isHealthy: systemHealth?.status === 'healthy'
  };
};

export default useBarryAPI;