/*
 * Go Barry - Statistics Data Hook
 * Handles fetching and real-time updates for statistics dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

// Mock data for development - will be replaced with real API calls
const generateMockData = () => ({
  dashboard: {
    realTime: {
      alertsToday: 247,
      alertsTrend: '+12%',
      incidentsManaged: 23,
      incidentsTrend: '-3%',
      activeRoadworks: 12,
      roadworksTrend: '0%',
      activeSupervisors: 6,
      systemHealth: 89
    }
  },
  routes: {
    mostAffected: [
      { route: '21', incidents: 5, avgDelay: '8 mins', severity: 'high' },
      { route: 'X21', incidents: 3, avgDelay: '12 mins', severity: 'medium' },
      { route: '1', incidents: 4, avgDelay: '6 mins', severity: 'medium' },
      { route: '307', incidents: 2, avgDelay: '4 mins', severity: 'low' },
      { route: 'Q3', incidents: 2, avgDelay: '5 mins', severity: 'low' }
    ],
    criticalRoutes: ['A1 Western Bypass', 'Tyne Bridge', 'A19 Corridor'],
    performanceMetrics: {
      totalRoutes: 231,
      affectedRoutes: 45,
      averageDelay: '6.2 mins'
    }
  },
  supervisors: {
    activeToday: 6,
    totalActions: 142,
    avgResponseTime: '3.2 mins',
    topPerformers: [
      { name: 'Anthony Gair', actions: 28, avgResponseTime: '2.1 mins', efficiency: 95 },
      { name: 'Claire Fiddler', actions: 22, avgResponseTime: '2.8 mins', efficiency: 88 },
      { name: 'David Hall', actions: 19, avgResponseTime: '3.1 mins', efficiency: 82 },
      { name: 'Barry Perryman', actions: 15, avgResponseTime: '2.9 mins', efficiency: 90 }
    ]
  },
  systemHealth: {
    dataSources: {
      tomtom: {
        status: 'online',
        responseTime: '250ms',
        lastUpdate: '30s ago',
        errorRate: 0
      },
      nationalHighways: {
        status: 'online',
        responseTime: '1.2s',
        lastUpdate: '2m ago',
        errorRate: 0
      },
      streetManager: {
        status: 'online',
        responseTime: '180ms',
        lastUpdate: '45s ago',
        errorRate: 0
      },
      convex: {
        status: 'online',
        responseTime: '95ms',
        lastUpdate: '5s ago',
        errorRate: 0
      }
    },
    overallHealth: 89,
    uptime: '99.8%'
  }
});

export const useStatisticsData = ({ timeRange = 'today', autoRefresh = false } = {}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [supervisorData, setSupervisorData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // API base URL
  const API_BASE = Platform.OS === 'web' 
    ? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://go-barry.onrender.com')
    : 'https://go-barry.onrender.com';

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // For now, use mock data - will be replaced with real API calls
      // const response = await fetch(`${API_BASE}/api/statistics/dashboard?timeRange=${timeRange}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = generateMockData();
      
      setDashboardData(mockData.dashboard);
      setRouteData(mockData.routes);
      setSupervisorData(mockData.supervisors);
      setSystemHealth(mockData.systemHealth);
      setLastUpdated(new Date());
      setError(null);
      
      console.log('📊 Statistics data updated:', {
        timeRange,
        alertsToday: mockData.dashboard.realTime.alertsToday,
        activeSupervisors: mockData.dashboard.realTime.activeSupervisors,
        systemHealth: mockData.systemHealth.overallHealth
      });
      
    } catch (err) {
      console.error('Failed to fetch statistics data:', err);
      setError(err.message || 'Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, API_BASE]);

  // Fetch specific route performance data
  const fetchRoutePerformance = useCallback(async () => {
    try {
      // TODO: Implement real API call
      // const response = await fetch(`${API_BASE}/api/statistics/routes/performance?timeRange=${timeRange}`);
      console.log('📍 Route performance data would be fetched here');
    } catch (err) {
      console.error('Failed to fetch route performance:', err);
    }
  }, [timeRange, API_BASE]);

  // Fetch supervisor activity data
  const fetchSupervisorActivity = useCallback(async () => {
    try {
      // TODO: Implement real API call
      // const response = await fetch(`${API_BASE}/api/statistics/supervisors/activity?timeRange=${timeRange}`);
      console.log('👥 Supervisor activity data would be fetched here');
    } catch (err) {
      console.error('Failed to fetch supervisor activity:', err);
    }
  }, [timeRange, API_BASE]);

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    try {
      // This could be a real endpoint since it's system monitoring
      const response = await fetch(`${API_BASE}/api/health-extended`);
      if (response.ok) {
        const healthData = await response.json();
        
        // Transform health data to statistics format
        const transformedHealth = {
          dataSources: {
            tomtom: {
              status: healthData.services?.tomtom?.status === 'healthy' ? 'online' : 'offline',
              responseTime: healthData.services?.tomtom?.responseTime || 'Unknown',
              lastUpdate: healthData.services?.tomtom?.lastChecked || 'Unknown',
              errorRate: 0
            },
            nationalHighways: {
              status: healthData.services?.nationalHighways?.status === 'healthy' ? 'online' : 'offline',
              responseTime: healthData.services?.nationalHighways?.responseTime || 'Unknown',
              lastUpdate: healthData.services?.nationalHighways?.lastChecked || 'Unknown',
              errorRate: 0
            },
            streetManager: {
              status: healthData.services?.streetManager?.status === 'healthy' ? 'online' : 'offline',
              responseTime: healthData.services?.streetManager?.responseTime || 'Unknown',
              lastUpdate: healthData.services?.streetManager?.lastChecked || 'Unknown',
              errorRate: 0
            },
            convex: {
              status: 'online', // Convex is always online if we're running
              responseTime: '95ms',
              lastUpdate: 'Just now',
              errorRate: 0
            }
          },
          overallHealth: healthData.overallHealth || 85,
          uptime: healthData.uptime || '99.5%'
        };
        
        setSystemHealth(transformedHealth);
        console.log('🔌 Real system health data loaded');
      } else {
        // Fallback to mock data
        const mockData = generateMockData();
        setSystemHealth(mockData.systemHealth);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      // Use mock data on error
      const mockData = generateMockData();
      setSystemHealth(mockData.systemHealth);
    }
  }, [API_BASE]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchRoutePerformance(),
      fetchSupervisorActivity(),
      fetchSystemHealth()
    ]);
  }, [fetchDashboardData, fetchRoutePerformance, fetchSupervisorActivity, fetchSystemHealth]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if not currently loading
      if (!loading) {
        refreshData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loading, refreshData]);

  // Export functions for manual data fetching
  const exportData = useCallback(async (format = 'csv', sections = 'all') => {
    try {
      const response = await fetch(
        `${API_BASE}/api/statistics/export?type=${format}&timeRange=${timeRange}&sections=${sections}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistics-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log(`📄 Statistics exported as ${format}`);
        return { success: true };
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      console.error('Failed to export data:', err);
      return { success: false, error: err.message };
    }
  }, [API_BASE, timeRange]);

  return {
    // Data
    dashboardData,
    routeData,
    supervisorData,
    systemHealth,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshData,
    exportData,
    
    // Utilities
    timeRange
  };
};