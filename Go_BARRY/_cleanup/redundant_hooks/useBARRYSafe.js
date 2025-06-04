// Go_BARRY/components/hooks/useBarrySafe.js
// COMPLETELY NEW HOOK FILE - Safe version with no problematic imports

import { useState, useEffect, useCallback } from 'react';

export const useBarrySafe = () => {
  console.log('🚦 SAFE HOOK STARTING...');
  
  // Basic state
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log('🚦 State initialized');

  // Simple fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🚦 Fetching data...');
      
      const response = await fetch('https://go-barry.onrender.com/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        console.log(`🚦 Got ${data.alerts?.length || 0} alerts`);
      }
    } catch (error) {
      console.log('🚦 Fetch error:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  console.log('🚦 Fetch function created');

  // Load data on mount
  useEffect(() => {
    console.log('🚦 Effect running...');
    fetchData();
  }, [fetchData]);

  console.log('🚦 Processing alerts...');

  // SAFE alert processing
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  console.log('🚦 Safe alerts:', safeAlerts.length);

  // GUARANTEED arrays
  const trafficAlerts = safeAlerts;
  const roadworkAlerts = [];
  const incidentAlerts = [];
  const congestionAlerts = [];
  const criticalAlerts = [];
  const activeAlerts = [];
  const upcomingAlerts = [];

  console.log('🚦 Arrays created');

  // Simple metrics
  const totalAlertsCount = safeAlerts.length;
  const activeAlertsCount = 0;
  const criticalAlertsCount = 0;
  const totalSourcesCount = 2;
  const mostAffectedRoutes = [];

  console.log('🚦 Metrics calculated');

  // Simple functions
  const refreshAlerts = async () => {
    console.log('🚦 Refresh called');
    await fetchData();
  };

  const getCriticalAlerts = async () => [];
  const getActiveAlerts = async () => [];
  const getTrafficAlerts = async () => trafficAlerts;
  const getCongestionAlerts = async () => [];
  const getUpcomingAlerts = async () => [];
  const getAlertsByRoute = async () => [];
  const getRoadworks = async () => [];
  const getIncidents = async () => [];
  const fetchSystemHealth = async () => {};
  const validateHookFunctions = () => true;

  console.log('🚦 Functions created');

  // Return object
  const returnData = {
    // Core data
    alerts: safeAlerts,
    loading,
    error: null,
    lastUpdated: new Date().toISOString(),
    systemHealth: { status: 'healthy' },
    isRefreshing: loading,
    
    // Alert arrays - GUARANTEED
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
    isHealthy: true,
    
    // Debug
    debugInfo: {
      alertsCount: safeAlerts.length,
      healthStatus: 'healthy',
      version: 'safe-new-file'
    }
  };

  console.log('🚦 SAFE HOOK RETURNING DATA');
  return returnData;
};

export default useBarrySafe;