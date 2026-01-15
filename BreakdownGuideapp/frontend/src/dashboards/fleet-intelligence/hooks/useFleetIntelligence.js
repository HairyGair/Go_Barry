/**
 * useFleetIntelligence Hook
 *
 * Custom hook for fetching and managing all Fleet Intelligence dashboard data.
 * Aggregates data from multiple sources: breakdowns, mileage, defects, depot stats.
 * Provides demo data when APIs are unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

/**
 * Demo data for when APIs are unavailable
 */
const DEMO_DATA = {
  breakdowns: [
    { id: 1, fleet_no: '6377', location: 'Newcastle City Centre', location_lat: 54.9783, location_lng: -1.6178, status: 'active', severity: 'AMBER', issue_type: 'Engine', depot: 'Riverside', created_at: new Date().toISOString() },
    { id: 2, fleet_no: '5421', location: 'Gateshead Interchange', location_lat: 54.9619, location_lng: -1.6036, status: 'active', severity: 'STOP', issue_type: 'Brakes', depot: 'Washington', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, fleet_no: '6102', location: 'Sunderland', location_lat: 54.9069, location_lng: -1.3838, status: 'active', severity: 'CONTINUE', issue_type: 'Doors', depot: 'Deptford', created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
  mileageData: {
    summary: { totalMileageLost: 127.5, lastWeekMileageLost: 142.3 },
    daily: [
      { date: new Date(Date.now() - 6 * 86400000).toISOString(), total: 18.2 },
      { date: new Date(Date.now() - 5 * 86400000).toISOString(), total: 22.5 },
      { date: new Date(Date.now() - 4 * 86400000).toISOString(), total: 15.8 },
      { date: new Date(Date.now() - 3 * 86400000).toISOString(), total: 28.1 },
      { date: new Date(Date.now() - 2 * 86400000).toISOString(), total: 12.4 },
      { date: new Date(Date.now() - 1 * 86400000).toISOString(), total: 19.7 },
      { date: new Date().toISOString(), total: 10.8 },
    ],
    topRoutes: [
      { route: '21', miles: 32.5 },
      { route: 'X10', miles: 28.2 },
      { route: '56', miles: 24.1 },
      { route: '1', miles: 18.9 },
      { route: 'Q3', miles: 12.4 },
    ],
  },
  criticalVehicles: [
    { fleet_number: '5421', depot: 'Washington', defect_count: 5, top_issue: 'Brakes', last_defect_date: new Date().toISOString() },
    { fleet_number: '6089', depot: 'Riverside', defect_count: 4, top_issue: 'Engine', last_defect_date: new Date(Date.now() - 86400000).toISOString() },
    { fleet_number: '5512', depot: 'Percy Main', defect_count: 3, top_issue: 'Electrical', last_defect_date: new Date(Date.now() - 172800000).toISOString() },
  ],
  depotStats: [
    { depot: 'Washington', defect_count: 12, trend: 5 },
    { depot: 'Riverside', defect_count: 8, trend: -3 },
    { depot: 'Percy Main', defect_count: 6, trend: 2 },
    { depot: 'Deptford', defect_count: 5, trend: -1 },
    { depot: 'Consett', defect_count: 4, trend: 0 },
    { depot: 'Chester-le-Street', defect_count: 3, trend: -2 },
  ],
  trendingIssues: [
    { issue_type: 'Brakes', count: 15, change: 12 },
    { issue_type: 'Engine', count: 12, change: -5 },
    { issue_type: 'Electrical', count: 9, change: 8 },
    { issue_type: 'Doors', count: 7, change: 3 },
    { issue_type: 'HVAC', count: 5, change: -2 },
    { issue_type: 'Steering', count: 4, change: 1 },
  ],
  predictiveAlerts: [
    { id: 1, title: 'Fleet 6089 - Engine Service Due', description: 'Based on mileage patterns, recommend engine inspection within 7 days', risk_level: 'high', confidence: 87, fleet_number: '6089' },
    { id: 2, title: 'Washington Depot - Brake Pattern', description: 'Increased brake issues detected. Review brake maintenance schedule.', risk_level: 'medium', confidence: 72 },
    { id: 3, title: 'Route 21 - Recurring Issues', description: 'Higher than average breakdown rate on Route 21 corridor', risk_level: 'low', confidence: 65 },
  ],
};

/**
 * Calculate KPI values from raw data
 */
function calculateKPIs(breakdowns, mileage, repeatVehicles) {
  // Filter active breakdowns (not resolved or cleared)
  const active = (breakdowns || []).filter(b =>
    !['resolved', 'cleared'].includes(b.status)
  );

  // Count critical (STOP severity) vehicles
  const critical = active.filter(b =>
    b.wizard_decision === 'STOP' || b.severity === 'STOP'
  );

  // Count resolved today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resolvedToday = (breakdowns || []).filter(b => {
    if (b.status !== 'resolved') return false;
    const resolvedDate = new Date(b.resolved_at || b.updated_at);
    return resolvedDate >= today;
  });

  // Calculate mileage lost this week
  const weeklyMileage = mileage?.summary?.totalMileageLost || 0;
  const lastWeekMileage = mileage?.summary?.lastWeekMileageLost || weeklyMileage * 0.9;
  const weeklyTrend = lastWeekMileage > 0
    ? ((weeklyMileage - lastWeekMileage) / lastWeekMileage) * 100
    : 0;

  return {
    activeBreakdowns: active.length,
    mileageLost: weeklyMileage,
    criticalVehicles: critical.length,
    atRiskVehicles: (repeatVehicles || []).length,
    resolvedToday: resolvedToday.length,
    weeklyTrend: weeklyTrend,
  };
}

/**
 * Fetch data from a single endpoint with error handling
 */
async function fetchEndpoint(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Fleet Intelligence: Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Main Fleet Intelligence Data Hook
 */
const useFleetIntelligence = (options = {}) => {
  const {
    timeframe = '7d',
    autoRefresh = true,
    refreshInterval = 30000,
    useDemoData = false, // Force demo data for testing
  } = options;

  // State
  const [data, setData] = useState({
    kpis: null,
    breakdowns: [],
    mileageData: null,
    criticalVehicles: [],
    depotStats: [],
    trendingIssues: [],
    predictiveAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Refs for cleanup
  const refreshTimerRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Apply demo data as fallback
   */
  const applyDemoData = useCallback(() => {
    console.log('Fleet Intelligence: Using demo data');
    setUsingDemoData(true);

    const kpis = calculateKPIs(DEMO_DATA.breakdowns, DEMO_DATA.mileageData, DEMO_DATA.criticalVehicles);

    setData({
      kpis,
      breakdowns: DEMO_DATA.breakdowns,
      mileageData: DEMO_DATA.mileageData,
      criticalVehicles: DEMO_DATA.criticalVehicles,
      depotStats: DEMO_DATA.depotStats,
      trendingIssues: DEMO_DATA.trendingIssues,
      predictiveAlerts: DEMO_DATA.predictiveAlerts,
    });
  }, []);

  /**
   * Fetch all data from multiple endpoints
   */
  const fetchAllData = useCallback(async () => {
    if (!mountedRef.current) return;

    // If forced demo mode, use demo data
    if (useDemoData) {
      applyDemoData();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Fleet Intelligence: Fetching data from API...');

      // Parallel fetch all data sources
      const [
        breakdownsRes,
        mileageRes,
        repeatRes,
        depotRes,
        trendsRes,
        predictiveRes,
      ] = await Promise.all([
        // Live breakdowns
        fetchEndpoint('/api/breakdowns/live'),

        // Mileage data (7 days)
        fetchEndpoint('/api/mileage/report/daily?days=7'),

        // Repeat defect vehicles
        fetchEndpoint('/api/defects/repeat', {
          method: 'POST',
          body: JSON.stringify({ timeframe, limit: 20 }),
        }),

        // Depot statistics
        fetchEndpoint(`/api/defects/depot-stats?timeframe=${timeframe}`),

        // Trending issues
        fetchEndpoint('/api/defects/trends', {
          method: 'POST',
          body: JSON.stringify({ timeframe, limit: 10 }),
        }),

        // Predictive alerts
        fetchEndpoint('/api/defects/predictive'),
      ]);

      if (!mountedRef.current) return;

      // Check if any data was returned
      const hasAnyData = breakdownsRes || mileageRes || repeatRes || depotRes || trendsRes || predictiveRes;

      if (!hasAnyData) {
        console.log('Fleet Intelligence: No API data available, falling back to demo data');
        applyDemoData();
        setError('Unable to connect to API - showing demo data');
        setLoading(false);
        return;
      }

      setUsingDemoData(false);

      // Extract data from responses with fallbacks
      const breakdowns = breakdownsRes?.breakdowns || breakdownsRes?.data || DEMO_DATA.breakdowns;
      const mileage = mileageRes || DEMO_DATA.mileageData;
      const repeatVehicles = repeatRes?.vehicles || repeatRes?.data || DEMO_DATA.criticalVehicles;
      const depots = depotRes?.depots || depotRes?.data || DEMO_DATA.depotStats;
      const trends = trendsRes?.trends || trendsRes?.data || DEMO_DATA.trendingIssues;
      const predictive = predictiveRes?.alerts || predictiveRes?.data || DEMO_DATA.predictiveAlerts;

      // Calculate KPIs from raw data
      const kpis = calculateKPIs(breakdowns, mileage, repeatVehicles);

      console.log('Fleet Intelligence: Data loaded successfully', {
        breakdowns: breakdowns.length,
        depots: depots.length,
        trends: trends.length,
      });

      // Update state
      setData({
        kpis,
        breakdowns,
        mileageData: mileage,
        criticalVehicles: repeatVehicles,
        depotStats: depots,
        trendingIssues: trends,
        predictiveAlerts: predictive,
      });

    } catch (err) {
      console.error('Fleet Intelligence: Error fetching data:', err);
      if (mountedRef.current) {
        setError(err.message || 'Failed to fetch data');
        // Fall back to demo data on error
        applyDemoData();
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [timeframe, useDemoData, applyDemoData]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    mountedRef.current = true;
    fetchAllData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchAllData]);

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    refreshTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchAllData();
      }
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAllData]);

  return {
    // Data
    kpis: data.kpis,
    breakdowns: data.breakdowns,
    mileageData: data.mileageData,
    criticalVehicles: data.criticalVehicles,
    depotStats: data.depotStats,
    trendingIssues: data.trendingIssues,
    predictiveAlerts: data.predictiveAlerts,

    // State
    loading,
    error,
    usingDemoData,

    // Actions
    refresh,
  };
};

export default useFleetIntelligence;
