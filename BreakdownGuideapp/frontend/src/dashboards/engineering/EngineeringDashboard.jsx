import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import { apiClient } from '../../services/api-client';
import EngineeringCard from './EngineeringCard';
import DepotStats from './DepotStats';
import EngineerModal from './EngineerModal';

const REFRESH_INTERVAL = 10000; // 10 seconds
const PRIORITY_ROUTES = ['X10', 'X21', '21', '56', '1'];

const EngineeringDashboard = () => {
  // State
  const [allBreakdowns, setAllBreakdowns] = useState([]);
  const [allEngineers, setAllEngineers] = useState([]);
  const [engineeringMetrics, setEngineeringMetrics] = useState({});
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedBreakdownId, setSelectedBreakdownId] = useState(null);
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Breakdowns' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'on-site', label: 'On Site' },
    { value: 'overdue', label: 'SLA Risk' },
    { value: 'priority', label: 'Priority Routes' }
  ];

  // Fetch real breakdown data from backend
  const fetchBreakdowns = async () => {
    try {
      const data = await apiClient.get('/api/breakdowns/active');
      console.log('📊 Fetched real breakdowns for engineering:', data);
      
      if (data.success && Array.isArray(data.breakdowns)) {
        // Process real breakdown data - NO MOCK DATA!
        const processedBreakdowns = data.breakdowns.map(breakdown => {
          const created = new Date(breakdown.created_at);
          const now = new Date();
          const totalElapsed = Math.floor((now - created) / 60000); // minutes
          
          // Calculate SLA status based on real elapsed time
          let slaStatus = 'normal';
          if (totalElapsed > 90) {
            slaStatus = 'critical'; // Over 90 minutes
          } else if (totalElapsed > 60) {
            slaStatus = 'warning'; // Over 60 minutes
          }
          
          // Determine if priority route
          const isPriority = PRIORITY_ROUTES.some(route => 
            breakdown.location?.includes(route)
          );
          
          return {
            // Core breakdown data
            id: breakdown.breakdown_id || breakdown.id,
            breakdown_id: breakdown.breakdown_id,
            daily_id: breakdown.daily_id,
            fleet_number: breakdown.fleet_number,
            depot: breakdown.depot || 'Unknown',
            location: breakdown.location,
            
            // Issue details
            issue_category: breakdown.issue_category,
            severity: breakdown.severity || breakdown.wizard_decision,
            status: breakdown.status || 'active',
            
            // Timeline data from backend
            created_at: breakdown.created_at,
            acknowledged_at: breakdown.acknowledged_at,
            dispatched_at: breakdown.dispatched_at,
            on_site_at: breakdown.on_site_at,
            fixing_at: breakdown.fixing_at,
            resolved_at: breakdown.resolved_at,
            
            // Engineer assignment
            engineer_id: breakdown.engineer_id,
            engineer_name: breakdown.engineer_name,
            engineer_badge: breakdown.engineer_badge,
            engineer_status: breakdown.engineer_status,
            engineer_eta: breakdown.engineer_eta,
            
            // Calculated fields
            totalElapsed,
            waitTime: breakdown.engineer_status === 'on_site' ? 0 : totalElapsed,
            slaStatus,
            isPriority,
            isOverdue: totalElapsed > 60,
            
            // Activity feed
            activities: breakdown.activities || [],
            
            // Supervisor info
            supervisor_name: breakdown.supervisor_name,
            supervisor_badge: breakdown.supervisor_badge
          };
        });
        
        setAllBreakdowns(processedBreakdowns);
        setError(null);
      } else {
        setAllBreakdowns([]);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      setError('Failed to fetch breakdown data');
      // Keep existing data if fetch fails
    }
  };

  // Fetch engineers data
  const fetchEngineers = async () => {
    try {
      const data = await apiClient.get('/api/engineering/engineers');
      if (data.success) {
        setAllEngineers(data.engineers || []);
      }
    } catch (error) {
      console.error('Error fetching engineers:', error);
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
      fetchEngineers(),
      fetchMetrics()
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchAllData();
    
    const interval = setInterval(() => {
      fetchAllData();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Filter breakdowns
  const filteredBreakdowns = allBreakdowns.filter(breakdown => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'unassigned') return !breakdown.engineer_id;
    if (currentFilter === 'dispatched') return breakdown.engineer_status === 'dispatched';
    if (currentFilter === 'on-site') return breakdown.engineer_status === 'on_site';
    if (currentFilter === 'overdue') return breakdown.isOverdue;
    if (currentFilter === 'priority') return breakdown.isPriority;
    return true;
  });

  // Calculate statistics
  const stats = {
    total: allBreakdowns.length,
    unassigned: allBreakdowns.filter(b => !b.engineer_id).length,
    onSite: allBreakdowns.filter(b => b.engineer_status === 'on_site').length,
    overdue: allBreakdowns.filter(b => b.isOverdue).length,
    avgResponseTime: engineeringMetrics.avgResponseTime || 0,
    slaCompliance: engineeringMetrics.slaCompliance || 0,
    activeEngineers: engineeringMetrics.activeEngineers || 0,
    totalEngineers: engineeringMetrics.totalEngineers || 0
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Breakdowns"
          value={stats.total}
          change={`${stats.unassigned} unassigned`}
          trend={stats.unassigned > 2 ? 'danger' : 'warning'}
        />
        <StatsCard
          title="Engineers On Site"
          value={stats.onSite}
          change={`${stats.activeEngineers}/${stats.totalEngineers} active`}
          trend="neutral"
        />
        <StatsCard
          title="SLA Risk"
          value={stats.overdue}
          change={stats.overdue > 0 ? 'Immediate action' : 'On track'}
          trend={stats.overdue > 0 ? 'danger' : 'success'}
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

      {/* Depot Statistics */}
      {depotStats.length > 0 && (
        <DepotStats depots={depotStats} />
      )}

      {/* Breakdown Cards */}
      <div className="mt-6 space-y-4">
        {loading && filteredBreakdowns.length === 0 ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading real breakdowns...</span>
            </div>
            <p className="mt-2 text-gray-400">Fetching live engineering data...</p>
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
            <p>No breakdowns matching the selected filter</p>
            <small>Real-time data from active assessments</small>
          </div>
        ) : (
          filteredBreakdowns.map(breakdown => (
            <EngineeringCard
              key={breakdown.breakdown_id}
              breakdown={breakdown}
              onAssignEngineer={() => handleAssignEngineer(breakdown.breakdown_id)}
              onStatusUpdate={handleStatusUpdate}
              onAutoAssign={() => handleAutoAssign(breakdown.breakdown_id)}
            />
          ))
        )}
      </div>

      {/* Engineer Selection Modal */}
      {showEngineerModal && (
        <EngineerModal
          show={showEngineerModal}
          onClose={() => setShowEngineerModal(false)}
          onSelect={handleEngineerSelect}
          breakdownId={selectedBreakdownId}
          engineers={allEngineers}
        />
      )}

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

      <style jsx>{`
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
