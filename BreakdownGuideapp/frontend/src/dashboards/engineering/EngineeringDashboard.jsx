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
      console.log('🔒 Using HTTP-only cookie authentication for Engineering WebSocket');

      const WS_URL = import.meta.env.VITE_WS_URL || 'wss://api.breakdowns.gobarry.co.uk/ws';
      const wsUrl = `${WS_URL}/ws?channel=engineering`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Engineering Dashboard WebSocket connected');
        setWsConnected(true);

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
        fetchAllData();
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
        showNotification(`New breakdown: Fleet ${data.breakdown?.fleet_number}`);
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

  const fetchBreakdowns = async () => {
    try {
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

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchBreakdowns(),
      fetchMetrics()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [currentFilter]);

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => {
      fetchAllData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const filteredBreakdowns = allBreakdowns;

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

  const handleJobAccepted = () => {
    fetchAllData();
  };

  const handleStatusUpdated = () => {
    fetchAllData();
  };

  const handleJobCompleted = () => {
    fetchAllData();
  };

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
      fetchAllData();

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error assigning engineer:', error);
      setNotification('Failed to assign engineer');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleStatusUpdate = async (breakdownId, newStatus) => {
    try {
      await apiClient.put(`/api/engineering/assignment/${breakdownId}/status`, {
        status: newStatus
      });

      setNotification(`Status updated to ${newStatus}`);
      fetchAllData();

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAutoAssign = async (breakdownId) => {
    try {
      await apiClient.post('/api/engineering/auto-assign', {
        breakdown_id: breakdownId
      });

      setNotification('Engineer auto-assigned successfully');
      fetchAllData();

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error auto-assigning engineer:', error);
    }
  };

  return (
    <DashboardLayout title="Engineering Dashboard" icon="🔧">
      {/* Dashboard Header */}
      <div className="eng-dashboard-header">
        <div className="eng-header-left">
          <div className="eng-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="eng-header-text">
            <h2>Engineering Dispatch</h2>
            <p>Monitor and dispatch engineers to active breakdowns</p>
          </div>
        </div>
        <div className="eng-header-right">
          <span className={`eng-ws-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
            <span className="eng-ws-dot"></span>
            {wsConnected ? 'Live' : 'Offline'}
          </span>
        </div>
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
          <div className="eng-loading-state">
            <div className="eng-spinner"></div>
            <p>Fetching live job data...</p>
          </div>
        ) : error ? (
          <div className="eng-error-state">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{error}</span>
            <button onClick={fetchAllData} className="eng-retry-btn">Retry</button>
          </div>
        ) : filteredBreakdowns.length === 0 ? (
          <div className="eng-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
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
        <div className="eng-notification-toast">
          {notification}
        </div>
      )}

      {/* Live Data Indicator */}
      <div className="eng-dashboard-footer">
        <span className="eng-live-indicator">
          <span className="eng-live-pulse"></span>
          Live Data - Real breakdowns from assessments
        </span>
        <span className="eng-last-update">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <style>{`
        .eng-dashboard-header {
          background: linear-gradient(135deg, #0097A7 0%, #00838F 100%);
          padding: 20px 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0, 151, 167, 0.25);
          border: 1px solid rgba(0, 188, 212, 0.3);
        }

        .eng-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .eng-header-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          backdrop-filter: blur(8px);
        }

        .eng-header-text h2 {
          margin: 0 0 2px 0;
          color: white;
          font-size: 20px;
          font-weight: 700;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.3px;
        }

        .eng-header-text p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .eng-ws-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .eng-ws-badge.connected {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .eng-ws-badge.disconnected {
          background: rgba(239, 68, 68, 0.15);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .eng-ws-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .eng-ws-badge.connected .eng-ws-dot {
          animation: eng-pulse-dot 2s infinite;
        }

        @keyframes eng-pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }

        .eng-loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #94A3B8;
          font-family: 'Inter', sans-serif;
        }

        .eng-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #1E293B;
          border-top-color: #0097A7;
          border-radius: 50%;
          animation: eng-spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes eng-spin {
          to { transform: rotate(360deg); }
        }

        .eng-error-state {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.25);
          border-radius: 10px;
          color: #F87171;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
        }

        .eng-retry-btn {
          margin-left: auto;
          padding: 6px 16px;
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.3);
          border-radius: 6px;
          color: #F87171;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .eng-retry-btn:hover {
          background: rgba(220, 38, 38, 0.25);
        }

        .eng-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px dashed #1E293B;
        }

        .eng-empty-state svg {
          margin: 0 auto 16px;
          display: block;
        }

        .eng-empty-state p {
          font-size: 16px;
          color: #94A3B8;
          margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }

        .eng-empty-state small {
          color: #64748B;
          font-size: 13px;
        }

        .eng-notification-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #141D2B;
          color: #10B981;
          padding: 14px 22px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: eng-slide-in 0.3s ease-out;
          z-index: 1000;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }

        @keyframes eng-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .eng-dashboard-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding: 16px 20px;
          background: #141D2B;
          border-radius: 10px;
          border: 1px solid #1E293B;
        }

        .eng-live-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #10B981;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }

        .eng-live-pulse {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
          animation: eng-pulse-dot 2s infinite;
        }

        .eng-last-update {
          color: #64748B;
          font-size: 12px;
          font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EngineeringDashboard;
