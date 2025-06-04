// Go_BARRY/components/hooks/useBARRYapi-simple.js
// Simple fallback version that guarantees all properties exist

import { useState, useEffect, useCallback } from 'react';

export const useBarryAPI = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Guaranteed to return all properties Dashboard expects
  return {
    // Core data
    alerts: alerts || [],
    loading: loading || false,
    error: null,
    lastUpdated: new Date().toISOString(),
    systemHealth: { status: 'healthy' },
    isRefreshing: false,
    
    // Alert arrays - ALWAYS arrays
    trafficAlerts: alerts || [],           // ← GUARANTEED ARRAY
    roadworkAlerts: [],
    incidentAlerts: [],
    congestionAlerts: [],
    criticalAlerts: [],
    activeAlerts: [],
    upcomingAlerts: [],
    
    // Functions - Simple stubs
    refreshAlerts: async () => { console.log('refreshAlerts called'); },
    fetchSystemHealth: async () => { console.log('fetchSystemHealth called'); },
    getCriticalAlerts: async () => [],
    getActiveAlerts: async () => [],
    getTrafficAlerts: async () => [],
    getCongestionAlerts: async () => [],
    getUpcomingAlerts: async () => [],
    getAlertsByRoute: async () => [],
    getRoadworks: async () => [],
    getIncidents: async () => [],
    validateHookFunctions: () => { console.log('validateHookFunctions called'); },
    
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
      note: 'Using simple fallback hook'
    }
  };
};

export default useBarryAPI;