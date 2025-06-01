// Go_BARRY/components/hooks/useBARRYapi-minimal.js
// MINIMAL VERSION - No complex imports, just return safe data

import { useState } from 'react';

export const useBarryAPI = () => {
  console.log('🧪 Minimal hook starting...');
  
  // Simple static data to test
  const [alerts] = useState([]);
  
  console.log('🧪 Creating return object...');
  
  // MINIMAL RETURN - Just what Dashboard needs
  const returnData = {
    // Core data
    alerts: [],
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    systemHealth: { status: 'healthy' },
    isRefreshing: false,
    
    // Alert arrays - GUARANTEED EMPTY ARRAYS
    trafficAlerts: [],
    roadworkAlerts: [],
    incidentAlerts: [],
    congestionAlerts: [],
    criticalAlerts: [],
    activeAlerts: [],
    upcomingAlerts: [],
    
    // Functions - Simple stubs
    refreshAlerts: async () => console.log('refreshAlerts called'),
    fetchSystemHealth: async () => console.log('fetchSystemHealth called'),
    getCriticalAlerts: async () => [],
    getActiveAlerts: async () => [],
    getTrafficAlerts: async () => [],
    getCongestionAlerts: async () => [],
    getUpcomingAlerts: async () => [],
    getAlertsByRoute: async () => [],
    getRoadworks: async () => [],
    getIncidents: async () => [],
    validateHookFunctions: () => true,
    
    // Computed values
    totalAlertsCount: 0,
    activeAlertsCount: 0,
    criticalAlertsCount: 0,
    totalSourcesCount: 2,
    mostAffectedRoutes: [],
    
    // Utilities
    hasData: false,
    isHealthy: true,
    
    // Debug
    debugInfo: {
      alertsCount: 0,
      healthStatus: 'healthy',
      version: 'minimal-safe'
    }
  };
  
  console.log('🧪 Minimal hook returning data');
  return returnData;
};

export default useBarryAPI;