import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import FilterBar from '../components/FilterBar.jsx';

import SDCBreakdownCard from './SDCBreakdownCard.jsx';
import PriorityAlerts from './PriorityAlerts.jsx';
import StatusWidget from './StatusWidget.jsx';
import RecentDecisions from './RecentDecisions.jsx';
import BreakdownMap from './BreakdownMap.jsx';
import { apiConfig } from '../../breakdown-guide/components/common/constants.js';
import { pollingManager } from '../../utils/pollingManager.js';

const SDCDashboard = () => {
  const navigate = useNavigate();
  const [breakdowns, setBreakdowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentDecisions, setRecentDecisions] = useState([]);

  const [headerStats, setHeaderStats] = useState({
    active: 0,
    critical: 0,
    pending: 0,
    avgResponse: '--'
  });

  // Priority routes configuration
  const PRIORITY_ROUTES = ['X10', 'X21', '21', '56', '1'];

  // Filter options
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'pending', label: 'Pending' },
    { value: 'priority', label: 'Priority Routes' }
  ];

  // Format depot names
  const formatDepot = (depot) => {
    const names = {
      'WASHINGTON': 'Washington',
      'WAS': 'Washington',
      'RIVERSIDE': 'Riverside',
      'PERCY_MAIN': 'Percy Main',
      'CONSETT': 'Consett',
      'DEPTFORD': 'Deptford',
      'HEXHAM': 'Hexham'
    };
    return names[depot] || depot || 'Unknown';
  };

  // Process breakdowns
  const processBreakdowns = (rawBreakdowns) => {
    return rawBreakdowns.map(b => {
      const created = new Date(b.created_at);
      const now = new Date();
      const elapsed = Math.floor((now - created) / 60000);
      
      // Determine criticality
      let criticality = 'normal';
      if (elapsed > 30 || b.severity === 'STOP' || b.severity === 'RED') {
        criticality = 'critical';
      } else if (elapsed > 15 || b.severity === 'AMBER' || PRIORITY_ROUTES.includes(b.route_id)) {
        criticality = 'warning';
      }
      
      // Determine current stage
      let currentStage = 'received';
      if (b.status === 'cleared' || b.status === 'resolved') currentStage = 'resolved';
      else if (b.status === 'dispatched' || b.status === 'on_site') currentStage = 'engineering';
      else if (b.status === 'decision') currentStage = 'decision';
      else if (b.status === 'acknowledged') currentStage = 'acknowledged';
      
      return {
        ...b,
        elapsed,
        criticality,
        currentStage,
        isPriority: PRIORITY_ROUTES.includes(b.route_id),
        depot_display: formatDepot(b.depot_id)
      };
    });
  };

  // Fetch breakdowns
  useEffect(() => {
    const fetchBreakdowns = async () => {
      console.log('🔍 SDCDashboard: fetchBreakdowns called at', new Date().toISOString());
      setLoading(true);

      try {
        const response = await fetch(`${apiConfig.baseUrl}/api/breakdowns/live`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const processed = processBreakdowns(data.breakdowns || []);
            setBreakdowns(processed);
            updateStatistics(processed);

          }
        }
      } catch (error) {
        console.error('Error fetching breakdowns:', error);
        // Show empty state on error
        setBreakdowns([]);
        updateStatistics([]);
      } finally {
        setLoading(false);
      }
    };

    pollingManager.startPolling('sdc-dashboard', fetchBreakdowns, 30000);

    return () => {
      pollingManager.stopPolling('sdc-dashboard');
    };
  }, []);

  // Update statistics
  const updateStatistics = (breakdownsList) => {
    const active = breakdownsList.length;
    const critical = breakdownsList.filter(b => b.criticality === 'critical').length;
    const pending = breakdownsList.filter(b => 
      b.currentStage === 'received' || b.currentStage === 'acknowledged'
    ).length;
    const avgResponse = active > 0 
      ? Math.round(breakdownsList.reduce((sum, b) => sum + b.elapsed, 0) / active)
      : 0;
    
    setHeaderStats({
      active,
      critical,
      pending,
      avgResponse: avgResponse ? `${avgResponse}m` : '--'
    });
  };

  // Filter breakdowns
  const getFilteredBreakdowns = () => {
    switch(activeFilter) {
      case 'critical':
        return breakdowns.filter(b => b.criticality === 'critical');
      case 'pending':
        return breakdowns.filter(b => 
          b.currentStage === 'received' || b.currentStage === 'acknowledged'
        );
      case 'priority':
        return breakdowns.filter(b => b.isPriority);
      default:
        return breakdowns;
    }
  };

  // Action handlers
  const handleAcknowledge = async (breakdownId) => {
    alert(`Acknowledging breakdown ${breakdownId}`);
    recordDecision(breakdownId, 'ACKNOWLEDGED');
    // TODO: Implement API call
  };

  const handleMakeDecision = (breakdownId) => {
    const decision = prompt('Enter decision (STOP/AMBER/CONTINUE):');
    if (decision) {
      alert(`Decision recorded: ${decision}`);
      recordDecision(breakdownId, decision.toUpperCase());
      // TODO: Implement API call
    }
  };

  const handleRequestEngineering = (breakdownId) => {
    navigate(`/dashboards/engineering?breakdown=${breakdownId}`);
  };

  // Record decision
  const recordDecision = (breakdownId, decision) => {
    const breakdown = breakdowns.find(b => b.breakdown_id === breakdownId);
    if (breakdown) {
      const decisionRecord = {
        time: new Date().toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        fleet: breakdown.fleet_no,
        decision: decision
      };
      
      setRecentDecisions(prev => {
        const updated = [decisionRecord, ...prev];
        return updated.slice(0, 5); // Keep only last 5
      });
    }
  };

  // Quick action handlers
  const reportEmergency = () => {
    window.location.href = '/breakdown-guide?emergency=true';
  };

  const openBreakdownWizard = () => {
    navigate('/breakdown-guide');
  };

  const openPassengerCloud = () => {
    window.open('https://gonortheast.passenger-app.com/network/journeys/cancellations', '_blank');
  };

  const refreshData = () => {
    window.location.reload();
  };

  const filteredBreakdowns = getFilteredBreakdowns();

  return (
    <DashboardLayout title="📍 SDC Operations Control" activeTab="sdc">
      {/* Background Pattern */}
      <div className="background-pattern"></div>
      
      {/* Main Dashboard Container */}
      <div className="dashboard-container">
        {/* Left Column - Breakdowns List */}
        <div className="left-column">
          {/* Header Stats */}
          <div className="header-stats">
            <div className="header-stat">
              <div className="header-stat-value">{headerStats.active}</div>
              <div className="header-stat-label">Active</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-value">{headerStats.critical}</div>
              <div className="header-stat-label">Critical</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-value">{headerStats.pending}</div>
              <div className="header-stat-label">Pending</div>
            </div>
            <div className="header-stat">
              <div className="header-stat-value">{headerStats.avgResponse}</div>
              <div className="header-stat-label">Avg Response</div>
            </div>
          </div>

          {/* Priority Alert */}
          <PriorityAlerts breakdowns={breakdowns} />

          {/* Active Breakdowns Section */}
          <div className="active-breakdowns">
            <div className="section-header">
              <h2 className="section-title">Active Breakdowns</h2>
              <FilterBar 
                filters={filters}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                showCount={false}
                className="inline-filter"
              />
            </div>
            
            <div className="breakdown-list">
              {loading ? (
                <div className="loading-skeleton">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-card">
                      <div className="skeleton-header">
                        <div></div>
                        <div></div>
                      </div>
                      <div className="skeleton-content">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line"></div>
                      </div>
                      <div className="skeleton-footer">
                        <div className="skeleton-button"></div>
                        <div className="skeleton-button"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredBreakdowns.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No active breakdowns matching filter</p>
                </div>
              ) : (
                filteredBreakdowns.map((breakdown, index) => (
                  <SDCBreakdownCard
                    key={breakdown.breakdown_id}
                    breakdown={breakdown}
                    onAcknowledge={handleAcknowledge}
                    onMakeDecision={handleMakeDecision}
                    onRequestEngineering={handleRequestEngineering}
                    animationDelay={index * 0.1}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Map Section */}
          <div className="map-container">
            <div className="map-header">
              <h3>🗺️ Breakdown Locations</h3>

            </div>
            <div className="map-placeholder">
              <BreakdownMap breakdowns={breakdowns} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button className="quick-btn emergency" onClick={reportEmergency}>
              🚨 Emergency
            </button>
            <button className="quick-btn primary" onClick={openBreakdownWizard}>
              📝 New
            </button>
            <button className="quick-btn primary" onClick={handleRequestEngineering}>
              🔧 Engineering
            </button>
            <button className="quick-btn secondary" onClick={openPassengerCloud}>
              ☁️ Passenger
            </button>
            <button className="quick-btn secondary" onClick={refreshData}>
              🔄 Refresh
            </button>
          </div>

          {/* Status Widget */}
          <StatusWidget breakdowns={breakdowns} />

          {/* Recent Decisions */}
          <RecentDecisions decisions={recentDecisions} />
        </div>
      </div>

      <style jsx>{`
        .background-pattern {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(219, 39, 119, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.01) 0%, transparent 50%),
            linear-gradient(180deg, #fafbfc 0%, #f0f4f8 100%);
          pointer-events: none;
          z-index: -1;
        }
        
        .background-pattern::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,0.015) 35px, rgba(0,0,0,0.015) 70px);
        }
        .dashboard-container {
          max-width: 100%;
          margin: 0;
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr minmax(400px, 450px);
          gap: 20px;
          height: calc(100vh - 120px);
          overflow: hidden;
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
          overflow-y: auto;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 0;
          overflow-y: auto;
        }

        .header-stats {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.02) 0%, transparent 50%);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 
            0 4px 20px rgba(0,0,0,0.04),
            0 2px 8px rgba(0,0,0,0.02),
            inset 0 2px 0 rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.9);
        }

        .header-stat {
          flex: 1;
          text-align: center;
          position: relative;
        }

        .header-stat::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 30px;
          background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
        }

        .header-stat:last-child::after {
          display: none;
        }

        .header-stat-value {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 2px;
          color: #0f172a;
          letter-spacing: -0.5px;
          font-variant-numeric: tabular-nums;
        }

        .header-stat:nth-child(2) .header-stat-value {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-stat:nth-child(3) .header-stat-value {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-stat:nth-child(4) .header-stat-value {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-stat-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .map-container {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.08),
            0 2px 8px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.5);
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .map-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .map-placeholder {
          height: 280px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(226,232,240,0.3);
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.5);
          background: #f8fafc;
        }
        


        .quick-actions {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
          padding: 16px;
          box-shadow: 
            0 4px 20px rgba(0,0,0,0.06),
            0 1px 3px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.7);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.8);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .quick-btn {
          padding: 14px 8px;
          border: 1px solid transparent;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          white-space: nowrap;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .quick-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        
        .quick-btn:hover::before {
          opacity: 1;
        }

        .quick-btn.emergency {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border-color: rgba(220, 38, 38, 0.2);
          box-shadow: 
            0 2px 8px rgba(220, 38, 38, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .quick-btn.emergency:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 8px 20px rgba(220, 38, 38, 0.35),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(220, 38, 38, 0.3);
        }

        .quick-btn.primary {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          color: white;
          border-color: rgba(59, 130, 246, 0.2);
          box-shadow: 
            0 2px 8px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }

        .quick-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 6px 16px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.3);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .quick-btn.secondary {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(243,244,246,0.9));
          color: #4b5563;
          border: 1px solid rgba(229,231,235,0.8);
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.05),
            inset 0 1px 0 rgba(255,255,255,0.8);
        }

        .quick-btn.secondary:hover {
          background: linear-gradient(135deg, #ffffff, #f9fafb);
          transform: translateY(-1px);
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.9);
          border-color: rgba(209,213,219,0.9);
        }

        .active-breakdowns {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.7);
          border-radius: 16px;
          box-shadow: 
            0 8px 32px rgba(0,0,0,0.08),
            0 2px 8px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.5);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .active-breakdowns::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(219, 39, 119, 0.2), transparent);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .section-header {
          background: 
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%),
            radial-gradient(circle at 10% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 30%);
          padding: 20px 24px;
          border-bottom: 1px solid rgba(226,232,240,0.6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        
        .section-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
          animation: shimmer 4s infinite;
        }

        .section-title {
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .section-title::before {
          content: '📋';
          font-size: 22px;
          filter: brightness(1.1) contrast(1.1);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
          border-radius: 10px;
        }

        .inline-filter {
          background: transparent;
          padding: 0;
          border: none;
        }

        .inline-filter :global(.filters) {
          gap: 5px;
        }

        .inline-filter :global(.filter-btn) {
          padding: 6px 12px;
          font-size: 13px;
        }

        .breakdown-list {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          position: relative;
        }
        
        .breakdown-list::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20px;
          right: 20px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(248,250,252,1), transparent);
          pointer-events: none;
          z-index: 1;
        }
        
        .breakdown-list::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 40px;
          background: linear-gradient(to top, rgba(248,250,252,1), transparent);
          pointer-events: none;
          z-index: 1;
        }

        .breakdown-list::-webkit-scrollbar {
          width: 6px;
        }

        .breakdown-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .breakdown-list::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }

        .breakdown-list::-webkit-scrollbar-thumb:hover {
          background: #666;
        }

        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 16px;
          padding: 20px;
          animation: skeletonPulse 1.5s infinite;
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .skeleton-header > div:first-child {
          width: 120px;
          height: 32px;
          background: rgba(226,232,240,0.5);
          border-radius: 8px;
        }

        .skeleton-header > div:last-child {
          width: 60px;
          height: 60px;
          background: rgba(226,232,240,0.5);
          border-radius: 50%;
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-line {
          height: 16px;
          background: rgba(226,232,240,0.5);
          border-radius: 4px;
        }

        .skeleton-line:nth-child(1) { width: 80%; }
        .skeleton-line:nth-child(2) { width: 60%; }
        .skeleton-line:nth-child(3) { width: 70%; }

        .skeleton-footer {
          margin-top: 16px;
          display: flex;
          gap: 8px;
        }

        .skeleton-button {
          width: 100px;
          height: 36px;
          background: rgba(226,232,240,0.5);
          border-radius: 8px;
        }

        @keyframes skeletonPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .empty-state {
          text-align: center;
          padding: 80px 40px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-icon {
          font-size: 64px;
          opacity: 0.3;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 16px;
          margin: 0;
        }

        @media (max-width: 1400px) {
          .dashboard-container {
            grid-template-columns: 1fr minmax(350px, 400px);
          }
        }

        @media (max-width: 1200px) {
          .dashboard-container {
            grid-template-columns: 1fr;
            height: auto;
          }

          .right-column {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
            gap: 16px;
          }

          .map-container {
            grid-column: 1 / -1;
          }

          .quick-actions {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px;
            gap: 12px;
          }

          .header-stats {
            gap: 10px;
            padding: 12px;
            flex-wrap: wrap;
          }

          .header-stat {
            flex: 1;
            min-width: 70px;
          }

          .header-stat-value {
            font-size: 20px;
          }

          .header-stat-label {
            font-size: 10px;
          }

          .right-column {
            grid-template-columns: 1fr;
          }

          .map-placeholder {
            height: 200px;
          }

          .quick-actions {
            grid-template-columns: repeat(3, 1fr);
          }

          .breakdown-list {
            padding: 12px;
          }

          .section-header {
            padding: 12px 16px;
          }

          .section-title {
            font-size: 16px;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default SDCDashboard;
