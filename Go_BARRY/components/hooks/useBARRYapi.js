// Go_BARRY/components/hooks/useBARRYapi.js
// ROLLBACK TO ORIGINAL WORKING VERSION
import { useState, useEffect, useCallback } from 'react';

// Define API functions inline to avoid import issues
const safeApiCall = async (endpoint) => {
  try {
    const API_BASE_URL = 'https://go-barry.onrender.com';
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`🚀 API Call: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BARRY-Mobile/3.0'
      },
      timeout: 15000 // 15 second timeout
    });
    
    console.log(`📊 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    console.log(`✅ API Success:`, {
      endpoint,
      alertCount: data?.alerts?.length || 0,
      success: data?.success,
      hasMetadata: !!data?.metadata
    });
    
    return { success: true, data };
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error.message);
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
      
      const result = await safeApiCall('/api/alerts-enhanced');
      
      if (result.success) {
        const alertsData = result.data.alerts || [];
        setAlerts(alertsData);
        setLastUpdated(result.data.metadata?.lastUpdated || new Date().toISOString());
        console.log(`✅ Loaded ${alertsData.length} enhanced alerts from multiple sources`);
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
    console.log('🔄 useBarryAPI initializing...');
    
    fetchAlerts();
    fetchSystemHealth();

    if (autoRefresh) {
      console.log(`⏰ Setting up auto-refresh every ${refreshInterval / 1000}s`);
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => {
        console.log('💵 Clearing auto-refresh interval');
        clearInterval(interval);
      };
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