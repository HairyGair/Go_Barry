import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import LiveIndicator from '../components/LiveIndicator';
import FilterBar from '../components/FilterBar';
import BreakdownCard from './BreakdownCard';
import EngineeringStats from './EngineeringStats';
import { apiConfig } from '../../breakdown-guide/components/common/constants';

const BreakdownDashboard = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    unassigned: 0,
    onsite: 0,
    slaRisk: 0,
    avgResponseTime: 24,
    slaCompliance: 87,
    engineersActive: '12/18',
    todayResolved: 27,
    slaBreaches: 2
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [depotStats, setDepotStats] = useState([]);

  // Engineering teams mock data (would come from backend)
  const engineeringTeams = {
    'Washington': { available: 3, total: 5, avgResponse: 22, sla: 95 },
    'WAS': { available: 3, total: 5, avgResponse: 22, sla: 95 },
    'Riverside': { available: 1, total: 4, avgResponse: 28, sla: 87 },
    'Percy Main': { available: 3, total: 4, avgResponse: 19, sla: 98 },
    'Consett': { available: 0, total: 4, avgResponse: 34, sla: 76 },
    'Deptford': { available: 1, total: 3, avgResponse: 25, sla: 91 },
    'Hexham': { available: 2, total: 2, avgResponse: 31, sla: 83 }
  };

  // Filter options
  const filters = [
    { value: 'all', label: 'All Breakdowns', icon: '📋' },
    { value: 'unassigned', label: 'Unassigned', icon: '⚠️' },
    { value: 'dispatched', label: 'Dispatched', icon: '🚚' },
    { value: 'on-site', label: 'On Site', icon: '🔧' },
    { value: 'sla-risk', label: 'SLA Risk', icon: '🚨' },
    { value: 'priority', label: 'Priority Routes', icon: '⭐' }
  ];

  // Initialize depot stats
  useEffect(() => {
    const depotData = Object.entries(engineeringTeams).map(([name, data]) => ({
      name,
      avgResponse: data.avgResponse,
      sla: data.sla,
      activeEngineers: data.available,
      totalEngineers: data.total
    }));
    setDepotStats(depotData);
  }, []);

  // Enhance breakdown data with timeline and mock data
  const enhanceBreakdownData = (breakdowns) => {
    return breakdowns.map(b => {
      const created = new Date(b.created_at);
      const now = new Date();
      const elapsed = Math.floor((now - created) / 60000); // minutes
      
      // Mock timeline data (would come from backend)
      const timeline = {
        reported: created.toISOString(),
        acknowledged: elapsed > 2 ? new Date(created.getTime() + 2 * 60000).toISOString() : null,
        dispatched: elapsed > 10 ? new Date(created.getTime() + 10 * 60000).toISOString() : null,
        onSite: elapsed > 30 ? new Date(created.getTime() + 30 * 60000).toISOString() : null,
        fixing: elapsed > 35 ? new Date(created.getTime() + 35 * 60000).toISOString() : null,
        resolved: null
      };
      
      // Determine current stage
      let currentStage = 'reported';
      if (timeline.resolved) currentStage = 'resolved';
      else if (timeline.fixing) currentStage = 'fixing';
      else if (timeline.onSite) currentStage = 'onSite';
      else if (timeline.dispatched) currentStage = 'dispatched';
      else if (timeline.acknowledged) currentStage = 'acknowledged';
      
      // Mock engineer assignment
      const engineerAssigned = elapsed > 10 ? {
        team: `${b.depot_id || 'Washington'} Engineering`,
        engineer: `John Smith (JS00${Math.floor(Math.random() * 9) + 1})`,
        eta: elapsed > 30 ? null : `${30 - elapsed} mins`
      } : null;
      
      // Mock activity feed
      const activities = [];
      const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      activities.push({ time: formatTime(created), text: 'Breakdown reported by driver' });
      if (timeline.acknowledged) {
        activities.push({ 
          time: formatTime(new Date(timeline.acknowledged)), 
          text: `SDC acknowledged (${b.supervisor_badge})` 
        });
      }
      if (timeline.dispatched) {
        activities.push({ 
          time: formatTime(new Date(timeline.dispatched)), 
          text: 'Engineering dispatched' 
        });
      }
      if (timeline.onSite) {
        activities.push({ 
          time: formatTime(new Date(timeline.onSite)), 
          text: 'Engineer on site' 
        });
      }
      if (timeline.fixing) {
        activities.push({ 
          time: formatTime(new Date(timeline.fixing)), 
          text: 'Repairs in progress' 
        });
      }
      
      return {
        ...b,
        timeline,
        currentStage,
        engineerAssigned,
        activities,
        totalElapsed: elapsed,
        slaStatus: elapsed > 60 ? 'breach' : elapsed > 45 ? 'warning' : 'ok',
        severity: b.severity || 'AMBER' // Default severity if not provided
      };
    });
  };

  // Fetch live breakdowns
  useEffect(() => {
    const fetchBreakdowns = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/live`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const enhanced = enhanceBreakdownData(data.breakdowns || []);
            setBreakdowns(enhanced);
            updateStats(enhanced);
            setLastUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Error fetching breakdowns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdowns();
    const interval = setInterval(fetchBreakdowns, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update statistics
  const updateStats = (breakdownsList) => {
    const unassigned = breakdownsList.filter(b => !b.engineerAssigned).length;
    const onsite = breakdownsList.filter(b => 
      b.currentStage === 'onSite' || b.currentStage === 'fixing'
    ).length;
    const slaRisk = breakdownsList.filter(b => b.slaStatus !== 'ok').length;
    
    setStats(prev => ({
      ...prev,
      total: breakdownsList.length,
      unassigned,
      onsite,
      slaRisk
    }));
  };

  // Filter breakdowns
  const getFilteredBreakdowns = () => {
    switch(activeFilter) {
      case 'unassigned':
        return breakdowns.filter(b => !b.engineerAssigned);
      case 'dispatched':
        return breakdowns.filter(b => b.currentStage === 'dispatched');
      case 'on-site':
        return breakdowns.filter(b => b.currentStage === 'onSite' || b.currentStage === 'fixing');
      case 'sla-risk':
        return breakdowns.filter(b => b.slaStatus !== 'ok');
      case 'priority':
        return breakdowns.filter(b => b.is_priority);
      default:
        return breakdowns;
    }
  };

  // Action handlers
  const handleDispatchEngineer = async (breakdownId) => {
    alert(`Dispatching engineer to breakdown ${breakdownId}`);
    // TODO: Implement API call
  };

  const handleUpdateStatus = (breakdownId) => {
    const status = prompt('Enter new status:');
    if (status) {
      alert(`Status updated for ${breakdownId}: ${status}`);
      // TODO: Implement API call
    }
  };

  const handleEscalate = (breakdownId) => {
    if (confirm('Escalate this breakdown to management?')) {
      alert(`Breakdown ${breakdownId} escalated to management`);
      // TODO: Implement API call
    }
  };

  const handleResolve = async (breakdown) => {
    const notes = prompt('Resolution notes:');
    if (!notes) return;
    
    const supervisor = prompt('Your badge number:', 'AG003') || 'AG003';
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/${breakdown.breakdown_id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: notes,
          resolving_supervisor: supervisor,
          returned_to_service: confirm('Has the vehicle returned to service?')
        })
      });
      
      if (response.ok) {
        // Remove from local state immediately
        setBreakdowns(prev => prev.filter(b => b.breakdown_id !== breakdown.breakdown_id));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          todayResolved: prev.todayResolved + 1
        }));
        showNotification('Breakdown resolved successfully', 'success');
      } else {
        const error = await response.json();
        showNotification(`Failed to resolve: ${error.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error resolving breakdown:', error);
      showNotification('Network error - please try again', 'error');
    }
  };

  const handleRequestETA = (breakdownId) => {
    alert(`Requesting ETA update for breakdown ${breakdownId}`);
    // TODO: Implement API call
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = type === 'success' ? '✅ ' + message : '❌ ' + message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const filteredBreakdowns = getFilteredBreakdowns();

  return (
    <DashboardLayout title="🚨 Engineering Response Dashboard" activeTab="breakdown">
      {/* Header Stats */}
      <div className="header-stats">
        <div className="header-stat">
          <span>⏱️ Avg Response Time:</span>
          <strong>{stats.avgResponseTime} mins</strong>
        </div>
        <div className="header-stat">
          <span>✅ SLA Compliance:</span>
          <strong>{stats.slaCompliance}%</strong>
        </div>
        <div className="header-stat">
          <span>👷 Engineers Active:</span>
          <strong>{stats.engineersActive}</strong>
        </div>
      </div>

      {/* Engineering Performance Panel */}
      <EngineeringStats depots={depotStats} />

      {/* Filters */}
      <FilterBar 
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showCount={false}
      />

      {/* Statistics */}
      <div className="stats-grid">
        <StatsCard 
          value={stats.total}
          label="Active Breakdowns"
          change={2}
          trend="negative"
          icon="🚌"
          colorScheme="blue"
        />
        <StatsCard 
          value={stats.unassigned}
          label="Awaiting Engineer"
          change={1}
          trend="negative"
          icon="⏳"
          colorScheme="amber"
        />
        <StatsCard 
          value={stats.onsite}
          label="Engineers On Site"
          change={0}
          trend="neutral"
          icon="🔧"
          colorScheme="green"
        />
        <StatsCard 
          value={stats.slaRisk}
          label="SLA at Risk"
          change={1}
          trend="negative"
          icon="⚠️"
          colorScheme="red"
        />
      </div>

      {/* Breakdown List */}
      <div className="container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading breakdowns...</p>
          </div>
        ) : filteredBreakdowns.length > 0 ? (
          <div className="breakdown-grid">
            {filteredBreakdowns.map(breakdown => (
              <BreakdownCard
                key={breakdown.breakdown_id}
                breakdown={breakdown}
                onDispatch={handleDispatchEngineer}
                onUpdate={handleUpdateStatus}
                onEscalate={handleEscalate}
                onResolve={handleResolve}
                onRequestETA={handleRequestETA}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No breakdowns matching the selected filter.</p>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="quick-stat">
          <span className="quick-stat-label">Next Available Engineer:</span>
          <span className="quick-stat-value">10:45</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">Avg Wait Time:</span>
          <span className="quick-stat-value">18 mins</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">Today's Resolved:</span>
          <span className="quick-stat-value">{stats.todayResolved}</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">SLA Breaches:</span>
          <span className="quick-stat-value" style={{ color: '#dc2626' }}>{stats.slaBreaches}</span>
        </div>
      </div>

      {/* Auto-refresh indicator */}
      <div className="auto-refresh">
        <LiveIndicator 
          status="online"
          updateInterval={5}
          lastUpdate={lastUpdate}
        />
      </div>

      <style jsx>{`
        .header-stats {
          display: flex;
          justify-content: center;
          gap: 30px;
          padding: 15px;
          background: rgba(255,255,255,0.1);
          margin-top: -20px;
          position: relative;
          z-index: 10;
        }

        .header-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: white;
        }

        .header-stat strong {
          font-size: 16px;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding: 20px;
        }

        .container {
          padding: 20px;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid #1e3a8a;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          color: #6b7280;
          background: white;
          border-radius: 12px;
          margin: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .quick-stats-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 2px solid #e5e7eb;
          padding: 10px 20px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .quick-stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .quick-stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #1e3a8a;
        }

        .auto-refresh {
          position: fixed;
          bottom: 70px;
          right: 20px;
          background: white;
          padding: 10px 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 999;
        }

        @media (max-width: 768px) {
          .header-stats {
            display: none;
          }

          .stats-grid {
            padding: 10px;
            gap: 10px;
          }

          .breakdown-grid {
            grid-template-columns: 1fr;
          }

          .quick-stats-bar {
            flex-direction: column;
            gap: 10px;
            padding: 15px;
            bottom: 60px; /* Account for mobile nav */
          }

          .quick-stat {
            width: 100%;
            justify-content: space-between;
          }

          .auto-refresh {
            bottom: 200px; /* Adjusted for mobile */
            right: 10px;
          }
        }

        /* Notification animations */
        @keyframes slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default BreakdownDashboard;
