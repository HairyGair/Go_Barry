import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';

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
    avgResponseTime: 0,
    slaCompliance: 0,
    engineersActive: '0/0',
    todayResolved: 0,
    slaBreaches: 0
  });

  const [depotStats, setDepotStats] = useState([]);

  // Engineering teams data will come from backend
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

  // Fetch depot stats from backend
  useEffect(() => {
    const fetchDepotStats = async () => {
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/engineering/depot-stats`);
        if (response.ok) {
          const data = await response.json();
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
        }
      } catch (error) {
        console.error('Error fetching depot stats:', error);
        setDepotStats([]);
      }
    };
    
    fetchDepotStats();
    const interval = setInterval(fetchDepotStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Enhance breakdown data with timeline from backend
  const enhanceBreakdownData = (breakdowns) => {
    return breakdowns.map(b => {
      const created = new Date(b.created_at);
      const now = new Date();
      const elapsed = Math.floor((now - created) / 60000); // minutes
      
      // Timeline data should come from backend - using defaults for now
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
      
      // Engineer assignment from backend data
      const engineerAssigned = b.engineer_assigned || null;
      
      // Build activity feed from timeline
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
      console.log('Fetching breakdowns from:', `${apiConfig.baseUrl}/api/breakdowns/live`);
      setLoading(true);
      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/live`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          
          if (data.success) {
            const enhanced = enhanceBreakdownData(data.breakdowns || []);
            setBreakdowns(enhanced);
            updateStats(enhanced);
          } else {
            console.log('API returned success: false');
            setBreakdowns([]);
            updateStats([]);
          }
        } else {
          console.error('API response not ok:', response.status, response.statusText);
          setBreakdowns([]);
          updateStats([]);
        }
      } catch (error) {
        console.error('Error fetching breakdowns:', error);
        setBreakdowns([]);
        updateStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdowns();
    const interval = setInterval(fetchBreakdowns, 30000); // Changed to 30 seconds to reduce console spam
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
          <span className="quick-stat-value">{stats.nextEngineer || '--:--'}</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-label">Avg Wait Time:</span>
          <span className="quick-stat-value">{stats.avgWaitTime ? `${stats.avgWaitTime} mins` : '--'}</span>
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




    </DashboardLayout>
  );
};

export default BreakdownDashboard;
