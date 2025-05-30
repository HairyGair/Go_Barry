// traffic-watch/hooks/useBarryAPI.js
// Enhanced API hook for comprehensive BARRY traffic intelligence
import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_BASE_URL = 'https://go-barry.onrender.com';

export const useBarryAPI = (options = {}) => {
  const {
    baseUrl = DEFAULT_BASE_URL,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
    onError = null,
    enableTrafficIntelligence = true
  } = options;

  // Main data states
  const [alerts, setAlerts] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  
  // Traffic intelligence states
  const [trafficData, setTrafficData] = useState([]);
  const [congestionHotspots, setCongestionHotspots] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [routeDelays, setRouteDelays] = useState([]);
  const [trafficIntelligence, setTrafficIntelligence] = useState(null);
  
  // System states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const refreshIntervalRef = useRef(null);

  // Enhanced API endpoints
  const endpoints = {
    // Main endpoints
    alerts: `${baseUrl}/api/alerts`,
    health: `${baseUrl}/api/health`,
    refresh: `${baseUrl}/api/refresh`,
    
    // Legacy endpoints
    streetworks: `${baseUrl}/api/streetworks`,
    roadworks: `${baseUrl}/api/roadworks`,
    
    // NEW: Traffic intelligence endpoints
    traffic: `${baseUrl}/api/traffic`,
    congestion: `${baseUrl}/api/congestion`,
    incidents: `${baseUrl}/api/incidents`,
    routeDelays: `${baseUrl}/api/route-delays`,
    trafficIntelligence: `${baseUrl}/api/traffic-intelligence`,
    usage: `${baseUrl}/api/usage`
  };

  // Enhanced fetch with better error handling
  const fetchWithRetry = async (url, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        if (i === retries) throw err;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  // Fetch main alerts data
  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setRefreshing(true);
      }
      setError(null);

      const data = await fetchWithRetry(endpoints.alerts);

      if (data.success && data.alerts) {
        setAlerts(data.alerts);
        setMetadata(data.metadata);
        setLastFetch(new Date());
        setIsOnline(true);
        return data;
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (err) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setIsOnline(false);
      
      if (onError) {
        onError(errorMessage);
      }
      
      console.error('BARRY API Error:', err);
      throw err;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoints.alerts, onError]);

  // NEW: Fetch traffic intelligence data
  const fetchTrafficIntelligence = useCallback(async (silent = false) => {
    if (!enableTrafficIntelligence) return;

    try {
      if (!silent) {
        setRefreshing(true);
      }

      // Fetch multiple traffic endpoints in parallel
      const [trafficRes, congestionRes, incidentsRes, routeDelaysRes, intelligenceRes] = await Promise.allSettled([
        fetchWithRetry(endpoints.traffic),
        fetchWithRetry(endpoints.congestion),
        fetchWithRetry(endpoints.incidents),
        fetchWithRetry(endpoints.routeDelays),
        fetchWithRetry(endpoints.trafficIntelligence)
      ]);

      // Process traffic data
      if (trafficRes.status === 'fulfilled' && trafficRes.value.success) {
        setTrafficData(trafficRes.value.traffic);
      }

      // Process congestion data
      if (congestionRes.status === 'fulfilled' && congestionRes.value.success) {
        setCongestionHotspots(congestionRes.value.congestion);
      }

      // Process incidents
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.success) {
        setIncidents(incidentsRes.value.incidents);
      }

      // Process route delays
      if (routeDelaysRes.status === 'fulfilled' && routeDelaysRes.value.success) {
        setRouteDelays(routeDelaysRes.value.routeDelays);
      }

      // Process traffic intelligence
      if (intelligenceRes.status === 'fulfilled' && intelligenceRes.value.success) {
        setTrafficIntelligence(intelligenceRes.value.trafficIntelligence);
      }

      setIsOnline(true);

    } catch (err) {
      console.error('Traffic Intelligence Error:', err);
      if (!silent && onError) {
        onError(`Traffic intelligence fetch failed: ${err.message}`);
      }
    }
  }, [endpoints, enableTrafficIntelligence, onError]);

  // Fetch system health
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetchWithRetry(endpoints.health);
      setSystemHealth(response);
      return response;
    } catch (err) {
      console.warn('Health check failed:', err.message);
    }
  }, [endpoints.health]);

  // Force refresh through backend
  const forceRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Trigger backend refresh
      await fetchWithRetry(endpoints.refresh);
      
      // Fetch updated data
      await Promise.all([
        fetchAlerts(false),
        fetchTrafficIntelligence(false),
        fetchHealth()
      ]);
      
    } catch (err) {
      console.error('Force refresh failed:', err);
      // Fallback to regular fetch
      await fetchAlerts(false);
    }
  }, [endpoints.refresh, fetchAlerts, fetchTrafficIntelligence, fetchHealth]);

  // NEW: Fetch API usage statistics
  const fetchUsageStats = useCallback(async () => {
    try {
      const response = await fetchWithRetry(endpoints.usage);
      return response.success ? response.usage : null;
    } catch (err) {
      console.warn('Usage stats fetch failed:', err.message);
      return null;
    }
  }, [endpoints.usage]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchAlerts(true); // Silent refresh
        fetchTrafficIntelligence(true);
        fetchHealth();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchAlerts, fetchTrafficIntelligence, fetchHealth]);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      try {
        await fetchAlerts(false);
        if (enableTrafficIntelligence) {
          await fetchTrafficIntelligence(false);
        }
        await fetchHealth();
      } catch (err) {
        // Error already handled in fetchAlerts
      }
    };

    initialLoad();
  }, [fetchAlerts, fetchTrafficIntelligence, fetchHealth, enableTrafficIntelligence]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Derived data
  const stats = metadata?.statistics || {};
  const sources = metadata?.sources || {};
  
  const activeAlerts = alerts.filter(alert => alert.status === 'red');
  const criticalAlerts = alerts.filter(alert => 
    alert.status === 'red' && alert.severity === 'High'
  );
  const upcomingAlerts = alerts.filter(alert => alert.status === 'amber');

  // Enhanced route impact analysis with traffic data
  const routeImpacts = alerts.reduce((impacts, alert) => {
    if (alert.affectsRoutes && alert.status === 'red') {
      alert.affectsRoutes.forEach(route => {
        if (!impacts[route]) {
          impacts[route] = {
            route,
            totalAlerts: 0,
            incidents: 0,
            congestion: 0,
            roadworks: 0,
            highSeverity: 0,
            totalDelay: 0,
            maxCongestionLevel: 0
          };
        }
        
        impacts[route].totalAlerts++;
        
        if (alert.type === 'incident') {
          impacts[route].incidents++;
        } else if (alert.type === 'congestion') {
          impacts[route].congestion++;
          impacts[route].maxCongestionLevel = Math.max(
            impacts[route].maxCongestionLevel,
            alert.congestionLevel || 0
          );
        } else if (alert.type === 'roadwork') {
          impacts[route].roadworks++;
        }
        
        if (alert.severity === 'High') {
          impacts[route].highSeverity++;
        }
        
        if (alert.delayMinutes) {
          impacts[route].totalDelay += alert.delayMinutes;
        }
      });
    }
    return impacts;
  }, {});

  const mostAffectedRoutes = Object.values(routeImpacts)
    .sort((a, b) => b.totalAlerts - a.totalAlerts)
    .slice(0, 15);

  // Traffic-specific derived data
  const trafficStats = {
    totalTrafficAlerts: trafficData.length,
    activeIncidents: incidents.filter(i => i.status === 'red').length,
    severeCongestion: congestionHotspots.filter(h => h.congestionLevel >= 8).length,
    routesWithDelays: routeDelays.filter(r => r.totalDelayMinutes > 0).length,
    averageCongestionLevel: trafficIntelligence?.summary?.averageCongestionLevel || 0,
    totalDelayMinutes: routeDelays.reduce((sum, r) => sum + (r.totalDelayMinutes || 0), 0)
  };

  return {
    // Main data
    alerts,
    metadata,
    systemHealth,
    activeAlerts,
    criticalAlerts,
    upcomingAlerts,
    mostAffectedRoutes,
    stats,
    sources,
    
    // Traffic intelligence data
    trafficData,
    congestionHotspots,
    incidents,
    routeDelays,
    trafficIntelligence,
    trafficStats,
    
    // State
    loading,
    refreshing,
    error,
    isOnline,
    lastFetch,
    
    // Actions
    fetchAlerts,
    fetchTrafficIntelligence,
    fetchHealth,
    forceRefresh,
    fetchUsageStats,
    
    // Utils
    endpoints
  };
};

// Enhanced hook for filtering traffic alerts
export const useTrafficFilters = (alerts = []) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    severity: [],
    status: [],
    source: [],
    type: [],
    congestionLevel: [], // NEW: Filter by congestion level
    incidentType: [] // NEW: Filter by incident type
  });
  const [sortBy, setSortBy] = useState('priority');

  const filteredAlerts = alerts.filter(alert => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchMatch = [
        alert.title,
        alert.description,
        alert.location,
        ...(alert.affectsRoutes || [])
      ].some(field => 
        field?.toString().toLowerCase().includes(query)
      );
      
      if (!searchMatch) return false;
    }

    // Category filters
    if (filters.severity.length > 0 && !filters.severity.includes(alert.severity)) {
      return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(alert.status)) {
      return false;
    }
    if (filters.source.length > 0 && !filters.source.includes(alert.source)) {
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(alert.type)) {
      return false;
    }
    
    // NEW: Congestion level filter
    if (filters.congestionLevel.length > 0 && alert.congestionLevel) {
      const levelMatch = filters.congestionLevel.some(level => {
        if (level === 'severe') return alert.congestionLevel >= 8;
        if (level === 'moderate') return alert.congestionLevel >= 5 && alert.congestionLevel < 8;
        if (level === 'light') return alert.congestionLevel >= 3 && alert.congestionLevel < 5;
        return false;
      });
      if (!levelMatch) return false;
    }
    
    // NEW: Incident type filter
    if (filters.incidentType.length > 0 && alert.incidentType) {
      if (!filters.incidentType.includes(alert.incidentType)) {
        return false;
      }
    }

    return true;
  });

  // Enhanced sorting with traffic-specific options
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        // Enhanced priority: incidents > congestion > roadworks, then by severity/congestion level
        const typePriority = { incident: 4, congestion: 3, roadwork: 2, unknown: 1 };
        const statusPriority = { red: 3, amber: 2, green: 1 };
        const severityPriority = { High: 3, Medium: 2, Low: 1 };
        
        const aTypeScore = typePriority[a.type] || 1;
        const bTypeScore = typePriority[b.type] || 1;
        
        if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
        
        const aStatusScore = statusPriority[a.status] || 0;
        const bStatusScore = statusPriority[b.status] || 0;
        
        if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
        
        // For congestion, prioritize by congestion level
        if (a.type === 'congestion' && b.type === 'congestion') {
          return (b.congestionLevel || 0) - (a.congestionLevel || 0);
        }
        
        const aSeverityScore = severityPriority[a.severity] || 0;
        const bSeverityScore = severityPriority[b.severity] || 0;
        
        return bSeverityScore - aSeverityScore;

      case 'congestion':
        // Sort by congestion level (traffic alerts only)
        return (b.congestionLevel || 0) - (a.congestionLevel || 0);

      case 'delay':
        // Sort by delay time
        return (b.delayMinutes || 0) - (a.delayMinutes || 0);

      case 'date':
        const aDate = new Date(a.startDate || a.lastUpdated || 0);
        const bDate = new Date(b.startDate || b.lastUpdated || 0);
        return bDate - aDate;

      case 'location':
        return (a.location || '').localeCompare(b.location || '');

      default:
        return 0;
    }
  });

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      severity: [],
      status: [],
      source: [],
      type: [],
      congestionLevel: [],
      incidentType: []
    });
    setSearchQuery('');
  };

  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + filterArray.length, 0
  ) + (searchQuery.trim() ? 1 : 0);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    filteredAlerts: sortedAlerts,
    toggleFilter,
    clearFilters,
    activeFilterCount
  };
};

export default useBarryAPI;