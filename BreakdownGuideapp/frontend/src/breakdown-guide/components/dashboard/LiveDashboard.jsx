import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LiveDashboard.css';
import BreakdownMap from './BreakdownMap';
import VehicleHistoryPanel from './VehicleHistoryPanel';
import AssessmentAnalytics from './AssessmentAnalytics';
import EngineeringMetrics from './EngineeringMetrics';
import SupervisorActivity from './SupervisorActivity';
import { MapPin, Activity, AlertTriangle, Users, Clock, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

const LiveDashboard = () => {
  // State management
  const [activeBreakdowns, setActiveBreakdowns] = useState([]);
  const [todaysAssessments, setTodaysAssessments] = useState([]);
  const [supervisorStats, setSupervisorStats] = useState({});
  const [engineeringMetrics, setEngineeringMetrics] = useState({});
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const refreshInterval = useRef(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://breakdown-guide.onrender.com';

  // Fetch live breakdown data
  const fetchLiveBreakdowns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/breakdown-tracker/live`);
      const data = await response.json();
      
      if (data.success) {
        // Add timer start time to each breakdown if not present
        const enhancedBreakdowns = data.breakdowns.map(breakdown => ({
          ...breakdown,
          // Timer starts when breakdown wizard is initiated (created_at)
          timer_start: breakdown.created_at,
          minutes_elapsed: breakdown.minutes_since_start || 0,
          location_coords: breakdown.location_coordinates ? {
            lat: parseFloat(breakdown.location_coordinates.split(' ')[1]),
            lng: parseFloat(breakdown.location_coordinates.split(' ')[0])
          } : null
        }));
        
        setActiveBreakdowns(enhancedBreakdowns);
      }
    } catch (error) {
      console.error('Error fetching live breakdowns:', error);
    }
  }, [API_BASE]);

  // Fetch today's assessments
  const fetchTodaysAssessments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/breakdown-tracker/today`);
      const data = await response.json();
      
      if (data.success) {
        setTodaysAssessments(data.breakdowns || []);
      }
    } catch (error) {
      console.error('Error fetching today\'s assessments:', error);
    }
  }, [API_BASE]);

  // Fetch supervisor statistics
  const fetchSupervisorStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/breakdown-analytics/supervisor-performance`);
      const data = await response.json();
      
      if (data.success) {
        setSupervisorStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching supervisor stats:', error);
    }
  }, [API_BASE]);

  // Fetch engineering metrics
  const fetchEngineeringMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/breakdown-analytics/fleet-health`);
      const data = await response.json();
      
      if (data.success) {
        setEngineeringMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching engineering metrics:', error);
    }
  }, [API_BASE]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchLiveBreakdowns(),
      fetchTodaysAssessments(),
      fetchSupervisorStats(),
      fetchEngineeringMetrics()
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchLiveBreakdowns, fetchTodaysAssessments, fetchSupervisorStats, fetchEngineeringMetrics]);

  // Set up auto-refresh
  useEffect(() => {
    refreshData(); // Initial load
    
    if (autoRefresh) {
      refreshInterval.current = setInterval(refreshData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh, refreshData]);

  // Calculate summary statistics
  const calculateStats = () => {
    const activeCount = activeBreakdowns.length;
    const criticalCount = activeBreakdowns.filter(b => b.severity === 'STOP').length;
    const avgResponseTime = activeBreakdowns.reduce((acc, b) => acc + b.minutes_elapsed, 0) / (activeCount || 1);
    const supervisorsActive = new Set(activeBreakdowns.map(b => b.supervisor_badge)).size;
    
    return {
      activeCount,
      criticalCount,
      avgResponseTime: Math.round(avgResponseTime),
      supervisorsActive
    };
  };

  const stats = calculateStats();

  return (
    <div className="live-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>
          <Activity className="header-icon" />
          Go North East - Live Breakdown Dashboard
        </h1>
        <div className="header-actions">
          <button 
            onClick={() => window.open('https://goahead.tranzaura.com/Safety/Main#/', '_blank')}
            className="tranzaura-button"
          >
            🔧 Open Tranzaura
          </button>
          <div className="refresh-info">
            <span className="last-refresh">
              Last update: {lastRefresh.toLocaleTimeString()}
            </span>
            <button 
              className={`refresh-button ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw className={`refresh-icon ${autoRefresh ? 'spinning' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card active">
          <div className="card-icon">
            <AlertTriangle />
          </div>
          <div className="card-content">
            <h3>{stats.activeCount}</h3>
            <p>Active Breakdowns</p>
          </div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-icon">
            <MapPin />
          </div>
          <div className="card-content">
            <h3>{stats.criticalCount}</h3>
            <p>Critical (STOP)</p>
          </div>
        </div>
        
        <div className="summary-card response">
          <div className="card-icon">
            <Clock />
          </div>
          <div className="card-content">
            <h3>{stats.avgResponseTime}m</h3>
            <p>Avg Response Time</p>
          </div>
        </div>
        
        <div className="summary-card supervisors">
          <div className="card-icon">
            <Users />
          </div>
          <div className="card-content">
            <h3>{stats.supervisorsActive}</h3>
            <p>Active Supervisors</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Live Breakdown Map */}
        <div className="dashboard-section map-section">
          <h2>
            <MapPin className="section-icon" />
            Live Breakdown Locations
          </h2>
          <BreakdownMap 
            breakdowns={activeBreakdowns}
            onBreakdownSelect={setSelectedBreakdown}
            selectedBreakdown={selectedBreakdown}
          />
          {selectedBreakdown && (
            <div className="selected-breakdown-info">
              <h4>Selected Breakdown</h4>
              <p><strong>Vehicle:</strong> {selectedBreakdown.fleet_no}</p>
              <p><strong>Location:</strong> {selectedBreakdown.location_display || selectedBreakdown.location}</p>
              <p><strong>Time:</strong> {selectedBreakdown.minutes_elapsed}m ago</p>
              <p><strong>Decision:</strong> <span className={`severity ${selectedBreakdown.severity?.toLowerCase()}`}>
                {selectedBreakdown.severity || 'Pending'}
              </span></p>
            </div>
          )}
        </div>

        {/* Vehicle History Panel */}
        <div className="dashboard-section history-section">
          <h2>
            <TrendingUp className="section-icon" />
            Vehicle Breakdown History
          </h2>
          <VehicleHistoryPanel 
            breakdowns={todaysAssessments} 
            activeBreakdowns={activeBreakdowns}
          />
        </div>

        {/* Assessment Analytics */}
        <div className="dashboard-section analytics-section">
          <h2>
            <Activity className="section-icon" />
            Assessment Analytics
          </h2>
          <AssessmentAnalytics 
            assessments={todaysAssessments}
            timeframe="today"
          />
        </div>

        {/* Engineering Response Metrics */}
        <div className="dashboard-section engineering-section">
          <h2>
            <Clock className="section-icon" />
            Engineering Response Metrics
          </h2>
          <EngineeringMetrics 
            metrics={engineeringMetrics}
            breakdowns={activeBreakdowns}
          />
        </div>

        {/* Supervisor Activity */}
        <div className="dashboard-section supervisor-section">
          <h2>
            <Users className="section-icon" />
            Supervisor Activity
          </h2>
          <SupervisorActivity 
            supervisorStats={supervisorStats}
            activeBreakdowns={activeBreakdowns}
            todaysAssessments={todaysAssessments}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <RefreshCw className="spinning" />
            <p>Loading dashboard data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;