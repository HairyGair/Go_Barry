// Go_BARRY/components/hooks/useBARRYapi.js
// Updated to use centralized API configuration for browser compatibility
import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG, apiRequest } from '../../config/api';

// Enhanced API call function using centralized config
const safeApiCall = async (endpoint) => {
  try {
    console.log(`🚀 API Call: ${API_CONFIG.baseURL}${endpoint}`);
    
    const data = await apiRequest(endpoint, {
      headers: {
        'User-Agent': 'BARRY-Browser/3.0'
      }
    });
    
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
    refreshInterval = API_CONFIG.refreshIntervals.alerts // Use centralized intervals
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

  // Fetch alerts function using centralized endpoints
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🔄 Starting fetchAlerts() - Base URL: ${API_CONFIG.baseURL}`);
      
      // Try enhanced alerts first, fallback to basic alerts
      console.log('🚀 Trying enhanced alerts endpoint...');
      let result = await safeApiCall(API_CONFIG.endpoints.alertsEnhanced);
      
      if (!result.success) {
        console.log('⚠️ Enhanced alerts failed, trying basic alerts endpoint...');
        result = await safeApiCall(API_CONFIG.endpoints.alerts);
      }
      
      if (!result.success) {
        console.log('⚠️ Basic alerts failed, trying emergency endpoint...');
        result = await safeApiCall('/api/emergency-alerts');
      }
      
      if (result.success) {
        const alertsData = result.data.alerts || [];
        setAlerts(alertsData);
        setLastUpdated(result.data.metadata?.lastUpdated || new Date().toISOString());
        setError(null);
        console.log(`✅ SUCCESS: Loaded ${alertsData.length} LIVE alerts from ${API_CONFIG.baseURL}`);
        
        // Log first alert for debugging
        if (alertsData.length > 0) {
          console.log('📊 Sample alert:', {
            id: alertsData[0].id,
            title: alertsData[0].title,
            source: alertsData[0].source,
            isDemo: alertsData[0].id?.includes('demo')
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      
      // If we have no data, try to provide some sample data for demo
      if (alerts.length === 0) {
        console.log('🔄 No backend data available, using demo mode');
        const demoAlerts = [
          {
            id: 'demo-1',
            title: 'A1(M) Junction 65 - Temporary Traffic Lights',
            location: 'A1(M) Junction 65, Gateshead',
            type: 'roadwork',
            severity: 'Medium',
            status: 'amber',
            description: 'Temporary traffic lights in operation due to planned roadworks.',
            timestamp: new Date().toISOString(),
            source: 'Demo Data'
          },
          {
            id: 'demo-2', 
            title: 'A19 Tyne Tunnel - Heavy Traffic',
            location: 'A19 Tyne Tunnel, North Shields',
            type: 'congestion',
            severity: 'Low',
            status: 'green',
            description: 'Expect delays due to heavy traffic volume.',
            timestamp: new Date().toISOString(),
            source: 'Demo Data'
          },
          {
            id: 'demo-3',
            title: 'A194(M) Vehicle Breakdown',
            location: 'A194(M) Westbound, South Shields',
            type: 'incident',
            severity: 'High',
            status: 'red',
            description: 'Lane 2 blocked due to vehicle breakdown. Recovery in progress.',
            timestamp: new Date().toISOString(),
            source: 'Demo Data'
          }
        ];
        setAlerts(demoAlerts);
        setLastUpdated(new Date().toISOString());
        console.log('📺 Demo mode activated with sample traffic data');
      }
    } finally {
      setLoading(false);
    }
  }, [alerts.length]);

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
    console.log(`🔄 useBarryAPI initializing with ${API_CONFIG.baseURL}...`);
    
    fetchAlerts();
    fetchSystemHealth();

    if (autoRefresh) {
      console.log(`⏰ Setting up auto-refresh every ${refreshInterval / 1000}s`);
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => {
        console.log('🛑 Clearing auto-refresh interval');
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

  // Refresh function
  const refreshAlerts = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
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
    isHealthy: systemHealth?.status === 'healthy',
    
    // Debug info
    apiBaseUrl: API_CONFIG.baseURL
  };
};

export default useBarryAPI;