import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import BreakdownCard from './BreakdownCard';
import EngineeringStats from './EngineeringStats';
import { apiClient } from '../../services/api-client';

const BreakdownDashboard = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    onsite: 0,
    slaRisk: 0,
    avgResponseTime: 0,
    slaCompliance: 0,
    engineersActive: '0/0',
    todayResolved: 0,
    slaBreaches: 0
  });

  const [depotStats, setDepotStats] = useState([]);
  const [engineeringTeams, setEngineeringTeams] = useState({});

  // Filter options
  const filters = [
    { value: 'all', label: 'All Breakdowns', icon: '📋' },
    { value: 'unassigned', label: 'Unassigned', icon: '⚠️' },
    { value: 'dispatched', label: 'Dispatched', icon: '🚚' },
    { value: 'on-site', label: 'On Site', icon: '🔧' },
    { value: 'sla-risk', label: 'SLA Risk', icon: '🚨' },
    { value: 'priority', label: 'Priority Routes', icon: '⭐' }
  ];

  // Fetch real breakdown data from backend
  const fetchBreakdowns = async () => {
    try {
      setLoading(true);

      // Fetch breakdowns from the real API (auth automatic via apiClient)
      const data = await apiClient.get('/api/breakdowns/active');
      console.log('📊 Fetched real breakdowns:', data);
      
      if (data.success && Array.isArray(data.breakdowns)) {
        // Process real breakdowns - no mock data!
        const processedBreakdowns = data.breakdowns.map(b => {
          // Use real data from backend
          return {
            id: b.breakdown_id || b.id,
            breakdown_id: b.breakdown_id,
            daily_id: b.daily_id,
            fleet_number: b.fleet_number,
            location: b.location,
            issue_category: b.issue_category,
            severity: b.severity || b.wizard_decision,
            status: b.status || 'active',
            created_at: b.created_at,
            updated_at: b.updated_at,
            
            // Engineer assignment (if exists)
            engineer_assigned: b.engineer_assigned || null,
            engineer_name: b.engineer_name || null,
            engineer_eta: b.engineer_eta || null,
            engineer_status: b.engineer_status || null,
            
            // Timeline from backend
            timeline: b.timeline || {
              reported: b.created_at,
              acknowledged: b.acknowledged_at || null,
              dispatched: b.dispatched_at || null,
              onSite: b.on_site_at || null,
              fixing: b.fixing_at || null,
              resolved: b.resolved_at || null
            },
            
            // Activity feed from backend
            activities: b.activities || b.activity_feed || [],
            
            // Supervisor info
            supervisor_name: b.supervisor_name,
            supervisor_badge: b.supervisor_badge,
            
            // Wizard data
            wizard_type: b.wizard_type,
            wizard_decision: b.wizard_decision || b.severity,
            wizard_assessment_data: b.wizard_assessment_data || {}
          };
        });
        
        setBreakdowns(processedBreakdowns);
        
        // Calculate real stats
        const activeBreakdowns = processedBreakdowns.filter(b => b.status !== 'resolved');
        const unassignedCount = activeBreakdowns.filter(b => !b.engineer_assigned).length;
        const onSiteCount = activeBreakdowns.filter(b => b.engineer_status === 'on_site').length;
        
        // Calculate SLA risk (breakdowns over 45 minutes without engineer)
        const slaRiskCount = activeBreakdowns.filter(b => {
          if (b.engineer_assigned) return false;
          const created = new Date(b.created_at);
          const now = new Date();
          const elapsedMinutes = (now - created) / 60000;
          return elapsedMinutes > 45;
        }).length;
        
        // Calculate today's resolved
        const today = new Date().setHours(0,0,0,0);
        const todayResolvedCount = processedBreakdowns.filter(b => {
          if (!b.timeline?.resolved) return false;
          const resolvedDate = new Date(b.timeline.resolved).setHours(0,0,0,0);
          return resolvedDate === today;
        }).length;
        
        setStats({
          total: activeBreakdowns.length,
          unassigned: unassignedCount,
          onsite: onSiteCount,
          slaRisk: slaRiskCount,
          avgResponseTime: data.avg_response_time || 0,
          slaCompliance: data.sla_compliance || 0,
          engineersActive: data.engineers_active || '0/0',
          todayResolved: todayResolvedCount,
          slaBreaches: data.sla_breaches || 0
        });
      } else {
        setBreakdowns([]);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      setBreakdowns([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch depot stats from backend
  const fetchDepotStats = async () => {
    try {
      const data = await apiClient.get('/api/engineering/depot-stats');
      if (data.success) {
        setEngineeringTeams(data.teams || {});
        const depotData = Object.entries(data.teams || {}).map(([name, data]) => ({
          name,
          avgResponse: data.avgResponse || 0,
          sla: data.sla || 0,
          activeEngineers: data.available || 0,
          totalEngineers: data.total || 0
        }));
        setDepotStats(depotData);
      }
    } catch (error) {
      console.error('Error fetching depot stats:', error);
      setDepotStats([]);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchBreakdowns();
    fetchDepotStats();
    
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchBreakdowns();
    }, 5000);
    
    // Depot stats refresh every minute
    const depotInterval = setInterval(() => {
      fetchDepotStats();
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(depotInterval);
    };
  }, []);

  // Filter breakdowns based on active filter
  const filteredBreakdowns = breakdowns.filter(b => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unassigned') return !b.engineer_assigned;
    if (activeFilter === 'dispatched') return b.engineer_status === 'dispatched';
    if (activeFilter === 'on-site') return b.engineer_status === 'on_site';
    if (activeFilter === 'sla-risk') {
      const created = new Date(b.created_at);
      const now = new Date();
      const elapsedMinutes = (now - created) / 60000;
      return elapsedMinutes > 45 && !b.timeline?.resolved;
    }
    if (activeFilter === 'priority') {
      const priorityRoutes = ['X10', 'X21', '21', '56', '1'];
      return priorityRoutes.some(route => 
        b.location?.toLowerCase().includes(route.toLowerCase())
      );
    }
    return true;
  });

  const handleAssignEngineer = async (breakdownId, engineerId) => {
    try {
      await apiClient.post('/api/engineering/assign', {
        breakdown_id: breakdownId,
        engineer_id: engineerId
      });

      // Refresh data to show the assignment
      fetchBreakdowns();
    } catch (error) {
      console.error('Error assigning engineer:', error);
    }
  };

  const handleResolve = async (breakdownId) => {
    try {
      await apiClient.put(`/api/breakdowns/${breakdownId}/resolve`, {
        resolved_at: new Date().toISOString(),
        status: 'resolved'
      });

      // Refresh data to show resolution
      fetchBreakdowns();
    } catch (error) {
      console.error('Error resolving breakdown:', error);
    }
  };

  return (
    <DashboardLayout title="Breakdown Dashboard" icon="🔧">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Active Breakdowns"
          value={stats.total}
          change={stats.unassigned > 0 ? `${stats.unassigned} unassigned` : 'All assigned'}
          trend={stats.unassigned > 0 ? 'warning' : 'success'}
        />
        <StatsCard
          title="Engineers On Site"
          value={stats.onsite}
          change={stats.engineersActive}
          trend="neutral"
        />
        <StatsCard
          title="SLA Risk"
          value={stats.slaRisk}
          change={stats.slaRisk > 0 ? 'Action needed' : 'Within target'}
          trend={stats.slaRisk > 0 ? 'danger' : 'success'}
        />
        <StatsCard
          title="Resolved Today"
          value={stats.todayResolved}
          change={`${stats.slaCompliance}% SLA compliance`}
          trend={stats.slaCompliance >= 95 ? 'success' : 'warning'}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Breakdown Cards */}
      <div className="breakdown-list">
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading real breakdowns...</span>
            </div>
            <p className="mt-2">Fetching live breakdown data...</p>
          </div>
        ) : filteredBreakdowns.length === 0 ? (
          <div className="no-breakdowns-message">
            <p>No active breakdowns matching filter</p>
            <small>Complete an assessment to see real breakdowns appear here</small>
          </div>
        ) : (
          filteredBreakdowns.map(breakdown => (
            <BreakdownCard
              key={breakdown.breakdown_id}
              breakdown={breakdown}
              onAssignEngineer={handleAssignEngineer}
              onResolve={handleResolve}
              engineeringTeams={engineeringTeams}
            />
          ))
        )}
      </div>

      {/* Engineering Stats */}
      {depotStats.length > 0 && (
        <EngineeringStats depotStats={depotStats} />
      )}

      {/* Real-time indicator */}
      <div className="dashboard-footer">
        <span className="live-indicator">
          <span className="pulse"></span>
          Live Data - Auto-refreshing every 5 seconds
        </span>
        <span className="last-update">
          Last update: {new Date().toLocaleTimeString()}
        </span>
      </div>

      <style jsx>{`
        .breakdown-list {
          margin-top: 20px;
          min-height: 400px;
        }

        .no-breakdowns-message {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .no-breakdowns-message p {
          font-size: 18px;
          color: #aaa;
          margin-bottom: 8px;
        }

        .no-breakdowns-message small {
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

export default BreakdownDashboard;
