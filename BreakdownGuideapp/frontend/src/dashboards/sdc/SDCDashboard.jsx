import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import SDCBreakdownCard from './SDCBreakdownCard';
import PriorityAlerts from './PriorityAlerts';
import StatusWidget from './StatusWidget';
import RecentDecisions from './RecentDecisions';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

const SDCDashboard = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [priorityAlerts, setPriorityAlerts] = useState([]);
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    pending: 0,
    dispatched: 0
  });

  // Filter options
  const filters = [
    { value: 'all', label: 'All Breakdowns', icon: '📋' },
    { value: 'critical', label: 'Critical', icon: '🚨' },
    { value: 'pending', label: 'Pending Decision', icon: '⏳' },
    { value: 'priority-routes', label: 'Priority Routes', icon: '⭐' }
  ];

  // Priority routes
  const PRIORITY_ROUTES = ['X10', 'X21', '21', '56', '1'];

  // Fetch real breakdowns from backend
  const fetchBreakdowns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch breakdowns');
      }
      
      const data = await response.json();
      console.log('📊 SDC fetched real breakdowns:', data);
      
      if (data.success && Array.isArray(data.breakdowns)) {
        // Process real breakdowns for SDC view
        const processedBreakdowns = data.breakdowns.map(b => ({
          id: b.breakdown_id || b.id,
          breakdown_id: b.breakdown_id,
          daily_id: b.daily_id,
          fleet_number: b.fleet_number,
          location: b.location,
          issue_category: b.issue_category,
          severity: b.severity || b.wizard_decision,
          status: b.status || 'active',
          created_at: b.created_at,
          
          // SDC-specific fields
          isCritical: b.severity === 'STOP' || b.wizard_decision === 'STOP',
          isPending: !b.acknowledged_at,
          isDispatched: b.engineer_assigned || b.dispatched_at,
          isPriorityRoute: PRIORITY_ROUTES.some(route => 
            b.location?.includes(route)
          ),
          
          // Timeline for SDC stages
          timeline: {
            received: b.created_at,
            acknowledged: b.acknowledged_at || null,
            decision: b.decision_at || b.dispatched_at || null,
            engineering: b.engineer_assigned ? b.dispatched_at : null
          },
          
          // Supervisor info
          supervisor_name: b.supervisor_name,
          supervisor_badge: b.supervisor_badge,
          
          // Engineering assignment
          engineer_assigned: b.engineer_assigned,
          engineer_name: b.engineer_name,
          
          // Decision data
          decision: b.wizard_decision || b.severity,
          decision_notes: b.decision_notes || '',
          
          // Activities
          activities: b.activities || []
        }));
        
        setBreakdowns(processedBreakdowns);
        
        // Calculate statistics
        const activeBreakdowns = processedBreakdowns.filter(b => b.status !== 'resolved');
        const criticalCount = activeBreakdowns.filter(b => b.isCritical).length;
        const pendingCount = activeBreakdowns.filter(b => b.isPending).length;
        const dispatchedCount = activeBreakdowns.filter(b => b.isDispatched).length;
        
        setStats({
          total: activeBreakdowns.length,
          critical: criticalCount,
          pending: pendingCount,
          dispatched: dispatchedCount
        });
        
        // Generate priority alerts for critical situations
        const alerts = [];
        
        // Check for multiple critical breakdowns on priority routes
        const criticalPriorityBreakdowns = activeBreakdowns.filter(
          b => b.isCritical && b.isPriorityRoute
        );
        
        if (criticalPriorityBreakdowns.length >= 2) {
          alerts.push({
            id: 'critical-priority',
            type: 'critical',
            message: `${criticalPriorityBreakdowns.length} critical breakdowns on priority routes`,
            breakdowns: criticalPriorityBreakdowns
          });
        }
        
        // Check for unacknowledged critical breakdowns over 10 minutes old
        const unacknowledgedCritical = activeBreakdowns.filter(b => {
          if (!b.isCritical || b.timeline.acknowledged) return false;
          const age = (Date.now() - new Date(b.created_at)) / 60000;
          return age > 10;
        });
        
        if (unacknowledgedCritical.length > 0) {
          alerts.push({
            id: 'unack-critical',
            type: 'warning',
            message: `${unacknowledgedCritical.length} critical breakdown${unacknowledgedCritical.length > 1 ? 's' : ''} awaiting acknowledgement`,
            breakdowns: unacknowledgedCritical
          });
        }
        
        setPriorityAlerts(alerts);
        
        // Extract recent decisions for activity feed
        const decisions = processedBreakdowns
          .filter(b => b.decision && b.timeline.decision)
          .sort((a, b) => new Date(b.timeline.decision) - new Date(a.timeline.decision))
          .slice(0, 5)
          .map(b => ({
            id: b.breakdown_id,
            time: b.timeline.decision,
            fleet: b.fleet_number,
            decision: b.decision,
            notes: b.decision_notes,
            supervisor: b.supervisor_name
          }));
        
        setRecentDecisions(decisions);
        
      } else {
        setBreakdowns([]);
        setPriorityAlerts([]);
        setRecentDecisions([]);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      setBreakdowns([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and set up auto-refresh
  useEffect(() => {
    fetchBreakdowns();
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchBreakdowns, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter breakdowns based on active filter
  const filteredBreakdowns = breakdowns.filter(b => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'critical') return b.isCritical;
    if (activeFilter === 'pending') return b.isPending;
    if (activeFilter === 'priority-routes') return b.isPriorityRoute;
    return true;
  });

  // Quick action handlers
  const handleEmergencyBreakdown = () => {
    window.location.href = '/breakdown-guide';
  };

  const handleNewBreakdown = () => {
    window.location.href = '/breakdown-guide';
  };

  const handleRequestEngineering = async (breakdownId) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/sdc/request-engineering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ breakdown_id: breakdownId })
      });
      
      if (response.ok) {
        fetchBreakdowns(); // Refresh data
      }
    } catch (error) {
      console.error('Error requesting engineering:', error);
    }
  };

  const handleAcknowledge = async (breakdownId) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/sdc/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          breakdown_id: breakdownId,
          acknowledged_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        fetchBreakdowns(); // Refresh data
      }
    } catch (error) {
      console.error('Error acknowledging breakdown:', error);
    }
  };

  const handleMakeDecision = async (breakdownId, decision) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/sdc/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          breakdown_id: breakdownId,
          decision: decision,
          decision_at: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        fetchBreakdowns(); // Refresh data
      }
    } catch (error) {
      console.error('Error making decision:', error);
    }
  };

  return (
    <DashboardLayout title="SDC Operations Centre" icon="🎯">
      {/* Priority Alerts */}
      {priorityAlerts.length > 0 && (
        <PriorityAlerts alerts={priorityAlerts} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Active Breakdowns"
          value={stats.total}
          change={stats.critical > 0 ? `${stats.critical} critical` : 'No critical'}
          trend={stats.critical > 0 ? 'danger' : 'success'}
        />
        <StatsCard
          title="Critical"
          value={stats.critical}
          change={stats.critical > 2 ? 'High volume' : 'Normal'}
          trend={stats.critical > 2 ? 'danger' : 'neutral'}
        />
        <StatsCard
          title="Pending Decision"
          value={stats.pending}
          change={stats.pending > 0 ? 'Action needed' : 'All acknowledged'}
          trend={stats.pending > 0 ? 'warning' : 'success'}
        />
        <StatsCard
          title="Dispatched"
          value={stats.dispatched}
          change="Engineers assigned"
          trend="success"
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <button onClick={handleEmergencyBreakdown} className="action-btn emergency">
          🚨 Emergency Breakdown
        </button>
        <button onClick={handleNewBreakdown} className="action-btn">
          ➕ New Breakdown
        </button>
        <button onClick={() => fetchBreakdowns()} className="action-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Breakdown List - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="breakdown-list">
            {loading ? (
              <div className="text-center py-8">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading real SDC data...</span>
                </div>
                <p className="mt-2">Fetching live breakdowns...</p>
              </div>
            ) : filteredBreakdowns.length === 0 ? (
              <div className="no-breakdowns">
                <p>No breakdowns matching filter</p>
                <small>Real-time data from assessments</small>
              </div>
            ) : (
              filteredBreakdowns.map(breakdown => (
                <SDCBreakdownCard
                  key={breakdown.breakdown_id}
                  breakdown={breakdown}
                  onAcknowledge={() => handleAcknowledge(breakdown.breakdown_id)}
                  onMakeDecision={(decision) => handleMakeDecision(breakdown.breakdown_id, decision)}
                  onRequestEngineering={() => handleRequestEngineering(breakdown.breakdown_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div>
          <StatusWidget stats={stats} />
          <RecentDecisions decisions={recentDecisions} />
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="dashboard-footer">
        <span className="live-indicator">
          <span className="pulse"></span>
          SDC Live Data - Real breakdowns from assessments
        </span>
        <span className="last-update">
          Auto-refreshing every 5 seconds
        </span>
      </div>

      <style jsx>{`
        .quick-actions-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .action-btn {
          padding: 10px 20px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          color: #60a5fa;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: translateY(-1px);
        }

        .action-btn.emergency {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: #f87171;
          animation: pulse-red 2s infinite;
        }

        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        .breakdown-list {
          min-height: 400px;
        }

        .no-breakdowns {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .no-breakdowns p {
          font-size: 18px;
          color: #aaa;
          margin-bottom: 8px;
        }

        .no-breakdowns small {
          color: #888;
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

export default SDCDashboard;
