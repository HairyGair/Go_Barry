import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import { apiClient } from '../../services/api-client';
import EngineeringCardEnhanced from './EngineeringCardEnhanced';
import DepotStats from './DepotStats';
import DepotContactsPanel from './DepotContactsPanel';
// Supabase removed - uses backend API for authentication and WebSocket

const REFRESH_INTERVAL = 10000; // 10 seconds
const PRIORITY_ROUTES = ['X10', 'X21', '21', '56', '1'];

// WebSocket connection
let ws = null;

const EngineeringDashboard = () => {
  // State
  const [allBreakdowns, setAllBreakdowns] = useState([]);
  const [engineeringMetrics, setEngineeringMetrics] = useState({});
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [wsConnected, setWsConnected] = useState(false);

  // Filter options (simplified - no individual engineer tracking)
  const filterOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'unassigned', label: 'Awaiting Dispatch' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'on_site', label: 'On Site' },
    { value: 'priority', label: 'Priority Routes' },
    { value: 'overdue', label: 'SLA Risk' }
  ];

  // WebSocket setup and cleanup
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
        ws = null;
      }
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      // Supabase removed - get authentication token from backend API session
      // For now, WebSocket can connect without token or use backend session token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('supervisor_token');

      if (!token) {
        console.warn('⚠️ No authentication token available for WebSocket connection');
        // Continue anyway - backend may allow unauthenticated WebSocket for dashboard
      }

      const WS_URL = import.meta.env.VITE_WS_URL || 'wss://breakdowns.gobarry.co.uk/ws';
      const wsUrl = `${WS_URL}/ws?channel=engineering&token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Engineering Dashboard WebSocket connected');
        setWsConnected(true);

        // Subscribe to engineering events
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'engineering'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 5s...');
        setWsConnected(false);

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data) => {
    console.log('📨 Engineering WebSocket message:', data);

    switch (data.type) {
      case 'job_assigned':
        showNotification(`New job assigned: Fleet ${data.breakdown?.fleet_number}`);
        fetchAllData(); // Refresh data
        break;

      case 'job_accepted':
        showNotification(`Job ${data.breakdown_id} accepted`);
        fetchAllData();
        break;

      case 'status_updated':
        showNotification(`Job ${data.breakdown_id} status: ${data.status}`);
        fetchAllData();
        break;

      case 'job_completed':
        showNotification(`Job ${data.breakdown_id} completed by ${data.engineer_name}`);
        fetchAllData();
        break;

      case 'new_breakdown':
        showNotification(`🚨 New breakdown: Fleet ${data.breakdown?.fleet_number}`);
        fetchAllData();
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch engineering jobs from new API
  const fetchBreakdowns = async () => {
    try {
      // Use the new /api/engineering/jobs endpoint with filter support
      const params = new URLSearchParams();
      if (currentFilter !== 'all') {
        params.append('filter', currentFilter);
      }

      const data = await apiClient.get(`/api/engineering/jobs?${params.toString()}`);
      console.log('📊 Fetched engineering jobs:', data);

      if (data.success && Array.isArray(data.jobs)) {
        setAllBreakdowns(data.jobs);
        setError(null);
      } else {
        setAllBreakdowns([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs data');
    }
  };

  // Fetch engineering metrics
  const fetchMetrics = async () => {
    try {
      const data = await apiClient.get('/api/engineering/metrics');
      if (data.success) {
        setEngineeringMetrics(data.metrics || {});
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  // Combined fetch function
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchBreakdowns(),
      fetchMetrics()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [currentFilter]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchAllData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Filtered breakdowns (already filtered by API, but can add client-side filtering if needed)
  const filteredBreakdowns = allBreakdowns;

  // Calculate statistics (simplified - no individual engineer tracking)
  const stats = {
    total: allBreakdowns.length,
    awaitingDispatch: allBreakdowns.filter(b =>
      !b.engineer_dispatched_at &&
      b.status !== 'dispatched' &&
      b.status !== 'on_site' &&
      b.status !== 'in_progress'
    ).length,
    dispatched: allBreakdowns.filter(b => b.status === 'dispatched').length,
    onSite: allBreakdowns.filter(b => b.status === 'on_site' || b.status === 'in_progress').length,
    overdue: allBreakdowns.filter(b => b.is_overdue).length,
    avgResponseTime: engineeringMetrics.avgResponseTime || 0,
    slaCompliance: engineeringMetrics.slaCompliance || 0
  };

  // Callback handlers for card actions
  const handleJobAccepted = () => {
    fetchAllData();
  };

  const handleStatusUpdated = () => {
    fetchAllData();
  };

  const handleJobCompleted = () => {
    fetchAllData();
  };

  // Calculate depot statistics
  const depotStats = Object.entries(
    allBreakdowns.reduce((acc, breakdown) => {
      const depot = breakdown.depot || 'Unknown';
      if (!acc[depot]) {
        acc[depot] = {
          name: depot,
          total: 0,
          onSite: 0,
          overdue: 0,
          avgWaitTime: []
        };
      }
      acc[depot].total++;
      if (breakdown.engineer_status === 'on_site') acc[depot].onSite++;
      if (breakdown.isOverdue) acc[depot].overdue++;
      acc[depot].avgWaitTime.push(breakdown.waitTime);
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name,
    breakdowns: data.total,
    onSite: data.onSite,
    overdue: data.overdue,
    avgWaitTime: data.avgWaitTime.length > 0 
      ? Math.round(data.avgWaitTime.reduce((a, b) => a + b, 0) / data.avgWaitTime.length)
      : 0,
    sla: data.total > 0 ? Math.round(((data.total - data.overdue) / data.total) * 100) : 100
  }));

  // Handle engineer assignment
  const handleAssignEngineer = async (breakdownId) => {
    setSelectedBreakdownId(breakdownId);
    setShowEngineerModal(true);
  };

  const handleEngineerSelect = async (engineerId) => {
    try {
      await apiClient.post('/api/engineering/assign', {
        breakdown_id: selectedBreakdownId,
        engineer_id: engineerId
      });

      setNotification('Engineer assigned successfully');
      setShowEngineerModal(false);
      fetchAllData(); // Refresh data

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error assigning engineer:', error);
      setNotification('Failed to assign engineer');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (breakdownId, newStatus) => {
    try {
      await apiClient.put(`/api/engineering/assignment/${breakdownId}/status`, {
        status: newStatus
      });

      setNotification(`Status updated to ${newStatus}`);
      fetchAllData(); // Refresh data

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle auto-assign
  const handleAutoAssign = async (breakdownId) => {
    try {
      await apiClient.post('/api/engineering/auto-assign', {
        breakdown_id: breakdownId
      });

      setNotification('Engineer auto-assigned successfully');
      fetchAllData(); // Refresh data

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error auto-assigning engineer:', error);
    }
  };

  return (
    <DashboardLayout title="Engineering Dashboard" icon="🔧">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2>Engineering Dispatch & Management</h2>
          <p>Monitor and dispatch engineers to active breakdowns</p>
        </div>
        <span className={`ws-indicator ${wsConnected ? 'connected' : 'disconnected'}`}>
          {wsConnected ? '🟢 Live Updates' : '🔴 Offline'}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <StatsCard
          title="Total Active"
          value={stats.total}
          change="All breakdowns"
          trend="neutral"
        />
        <StatsCard
          title="Awaiting Dispatch"
          value={stats.awaitingDispatch}
          change={stats.awaitingDispatch > 2 ? 'Action needed' : 'Under control'}
          trend={stats.awaitingDispatch > 2 ? 'danger' : 'success'}
        />
        <StatsCard
          title="Dispatched"
          value={stats.dispatched}
          change="Engineers en route"
          trend="info"
        />
        <StatsCard
          title="On Site / Working"
          value={stats.onSite}
          change="Repairs in progress"
          trend="neutral"
        />
        <StatsCard
          title="SLA Compliance"
          value={`${stats.slaCompliance || 0}%`}
          change={`${stats.avgResponseTime || 0} min avg`}
          trend={stats.slaCompliance >= 95 ? 'success' : 'warning'}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filterOptions}
        activeFilter={currentFilter}
        onFilterChange={setCurrentFilter}
      />

      {/* Depot Contacts Quick Reference */}
      <DepotContactsPanel />

      {/* Depot Statistics */}
      {depotStats.length > 0 && (
        <DepotStats engineers={[]} metrics={engineeringMetrics?.by_depot || {}} />
      )}

      {/* Breakdown Cards */}
      <div className="mt-6 space-y-4">
        {loading && filteredBreakdowns.length === 0 ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading engineering jobs...</span>
            </div>
            <p className="mt-2 text-gray-400">Fetching live job data...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            {error}
            <button onClick={fetchAllData} className="btn btn-sm btn-outline-danger ms-3">
              Retry
            </button>
          </div>
        ) : filteredBreakdowns.length === 0 ? (
          <div className="no-data-message">
            <p>No jobs matching the selected filter</p>
            <small>Real-time engineering jobs feed</small>
          </div>
        ) : (
          filteredBreakdowns.map(breakdown => (
            <EngineeringCardEnhanced
              key={breakdown.breakdown_id}
              breakdown={breakdown}
              onJobAccepted={handleJobAccepted}
              onStatusUpdated={handleStatusUpdated}
              onJobCompleted={handleJobCompleted}
              onRefresh={fetchAllData}
            />
          ))
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="notification-toast">
          {notification}
        </div>
      )}

      {/* Live Data Indicator */}
      <div className="dashboard-footer">
        <span className="live-indicator">
          <span className="pulse"></span>
          Live Data - Real breakdowns from assessments
        </span>
        <span className="last-update">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <style>{`
        .dashboard-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          padding: 20px 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header-info h2 {
          margin: 0 0 4px 0;
          color: white;
          font-size: 22px;
          font-weight: 700;
        }

        .header-info p {
          margin: 0;
          color: #93c5fd;
          font-size: 14px;
        }

        .ws-indicator {
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .ws-indicator.connected {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .ws-indicator.disconnected {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .no-data-message {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .no-data-message p {
          font-size: 18px;
          color: #aaa;
          margin-bottom: 8px;
        }

        .no-data-message small {
          color: #888;
        }

        .notification-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.3s ease-out;
          z-index: 1000;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #4ade80;
          font-size: 14px;
        }

        .pulse {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }

        .last-update {
          color: #888;
          font-size: 12px;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EngineeringDashboard;
