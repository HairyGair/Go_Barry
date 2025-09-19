import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import { apiConfig } from '../../breakdown-guide/components/common/constants';
import { theme } from '@styles/theme';
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
  const [isConnected, setIsConnected] = useState(true);
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

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch data in parallel
      const [breakdownsRes, engineersRes, metricsRes] = await Promise.all([
        fetch(`${apiConfig.baseUrl}/api/breakdowns/live`),
        fetch(`${apiConfig.baseUrl}/api/engineering/engineers`),
        fetch(`${apiConfig.baseUrl}/api/engineering/metrics`)
      ]);

      if (breakdownsRes.ok && engineersRes.ok && metricsRes.ok) {
        const [breakdownsData, engineersData, metricsData] = await Promise.all([
          breakdownsRes.json(),
          engineersRes.json(),
          metricsRes.json()
        ]);

        // Enhance breakdown data
        const enhancedBreakdowns = await enhanceBreakdownData(breakdownsData.breakdowns || []);
        
        setAllBreakdowns(enhancedBreakdowns);
        setAllEngineers(engineersData.engineers || []);
        setEngineeringMetrics(metricsData.metrics || {});
        setIsConnected(true);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to connect to server');
      setIsConnected(false);
      setLoading(false);
    }
  }, []);

  // Enhance breakdown data with assignments
  const enhanceBreakdownData = async (breakdowns) => {
    const enhancedBreakdowns = [];
    
    for (const breakdown of breakdowns) {
      try {
        const assignmentRes = await fetch(
          `${apiConfig.baseUrl}/api/engineering/breakdown/${breakdown.breakdown_id}/assignments`
        );
        const assignmentData = await assignmentRes.json();
        
        const currentAssignment = assignmentData.success && assignmentData.assignments?.length > 0
          ? assignmentData.assignments[0]
          : null;
        
        // Calculate real elapsed time
        const created = new Date(breakdown.created_at);
        const now = new Date();
        const totalElapsed = Math.floor((now - created) / 60000); // minutes
        
        // Calculate wait time
        let waitTime = totalElapsed;
        if (currentAssignment) {
          if (currentAssignment.status === 'on_site' || currentAssignment.status === 'repairing') {
            waitTime = 0; // Engineer is on site
          } else if (currentAssignment.arrival_at) {
            const arrival = new Date(currentAssignment.arrival_at);
            waitTime = Math.floor((arrival - created) / 60000);
          }
        }
        
        // Determine status
        let timeStatus = 'normal';
        if (totalElapsed > 45) {
          timeStatus = 'overdue';
        } else if (totalElapsed > 30) {
          timeStatus = 'warning';
        }
        
        enhancedBreakdowns.push({
          ...breakdown,
          assignment: currentAssignment,
          totalElapsed,
          waitTime,
          timeStatus,
          currentStage: getBreakdownStage(breakdown, currentAssignment),
          isPriority: PRIORITY_ROUTES.includes(breakdown.route_id)
        });
      } catch (error) {
        // If assignment fetch fails, use breakdown without assignment
        const created = new Date(breakdown.created_at);
        const now = new Date();
        const totalElapsed = Math.floor((now - created) / 60000);
        
        enhancedBreakdowns.push({
          ...breakdown,
          assignment: null,
          totalElapsed,
          waitTime: totalElapsed,
          timeStatus: totalElapsed > 45 ? 'overdue' : totalElapsed > 30 ? 'warning' : 'normal',
          currentStage: 'reported',
          isPriority: PRIORITY_ROUTES.includes(breakdown.route_id)
        });
      }
    }
    
    return enhancedBreakdowns;
  };

  // Get breakdown stage
  const getBreakdownStage = (breakdown, assignment) => {
    if (breakdown.status === 'cleared') return 'resolved';
    if (assignment) {
      if (assignment.status === 'completed') return 'resolved';
      if (assignment.status === 'repairing') return 'fixing';
      if (assignment.status === 'on_site') return 'onSite';
      if (assignment.status === 'dispatched') return 'dispatched';
      if (assignment.status === 'assigned') return 'acknowledged';
    }
    if (breakdown.status === 'decision') return 'acknowledged';
    return 'reported';
  };

  // Filter breakdowns
  const getFilteredBreakdowns = () => {
    let breakdowns = [...allBreakdowns];
    
    // Apply filters
    switch(currentFilter) {
      case 'unassigned':
        breakdowns = breakdowns.filter(b => !b.assignment);
        break;
      case 'dispatched':
        breakdowns = breakdowns.filter(b => 
          b.assignment && b.assignment.status === 'dispatched'
        );
        break;
      case 'on-site':
        breakdowns = breakdowns.filter(b => 
          b.assignment && (b.assignment.status === 'on_site' || b.assignment.status === 'repairing')
        );
        break;
      case 'overdue':
        breakdowns = breakdowns.filter(b => b.timeStatus === 'overdue' || b.timeStatus === 'warning');
        break;
      case 'priority':
        breakdowns = breakdowns.filter(b => b.isPriority);
        break;
    }
    
    // Sort breakdowns: overdue first, then by elapsed time
    breakdowns.sort((a, b) => {
      if (a.timeStatus === 'overdue' && b.timeStatus !== 'overdue') return -1;
      if (b.timeStatus === 'overdue' && a.timeStatus !== 'overdue') return 1;
      if (a.timeStatus === 'warning' && b.timeStatus === 'normal') return -1;
      if (b.timeStatus === 'warning' && a.timeStatus === 'normal') return 1;
      return b.totalElapsed - a.totalElapsed;
    });
    
    return breakdowns;
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle engineer modal
  const handleShowEngineerModal = (breakdownId, depotId) => {
    setSelectedBreakdownId({ breakdownId, depotId });
    setShowEngineerModal(true);
  };

  // Handle engineer assignment
  const handleAssignEngineer = async (engineerId) => {
    if (!selectedBreakdownId) return;
    
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/engineering/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakdown_id: selectedBreakdownId.breakdownId,
          engineer_id: engineerId,
          estimated_arrival_minutes: 30
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(`Engineer ${data.assignment.engineer.name} assigned successfully`, 'success');
        setShowEngineerModal(false);
        await fetchAllData();
      } else {
        showNotification(data.error || 'Failed to assign engineer', 'error');
      }
    } catch (error) {
      console.error('Error assigning engineer:', error);
      showNotification('Failed to assign engineer', 'error');
    }
  };

  // Auto-assign engineer
  const handleAutoAssign = async (breakdownId, depotId) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/engineering/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          breakdown_id: breakdownId,
          depot_id: depotId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(
          `Auto-assigned ${data.assignment.engineer.name} from ${data.assignment.from_depot}`,
          'success'
        );
        await fetchAllData();
      } else {
        showNotification(data.error || 'No available engineers', 'error');
      }
    } catch (error) {
      console.error('Error auto-assigning:', error);
      showNotification('Failed to auto-assign engineer', 'error');
    }
  };

  // Update assignment status
  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      const response = await fetch(`${apiConfig.baseUrl}/api/engineering/assignment/${assignmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(`Status updated to ${newStatus}`, 'success');
        await fetchAllData();
      } else {
        showNotification('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status', 'error');
    }
  };

  // Calculate statistics
  const getStats = () => {
    const total = allBreakdowns.length;
    const unassigned = allBreakdowns.filter(b => !b.assignment).length;
    const onsite = allBreakdowns.filter(b => 
      b.assignment && (b.assignment.status === 'on_site' || b.assignment.status === 'repairing')
    ).length;
    const overdue = allBreakdowns.filter(b => b.timeStatus === 'overdue' || b.timeStatus === 'warning').length;
    
    // Calculate average response time
    const completedAssignments = allBreakdowns
      .filter(b => b.assignment && b.assignment.travel_time_minutes)
      .map(b => b.assignment.travel_time_minutes);
    
    const avgResponse = completedAssignments.length > 0
      ? Math.round(completedAssignments.reduce((a, b) => a + b, 0) / completedAssignments.length)
      : 0;
    
    // Calculate SLA compliance
    const totalWithResponse = completedAssignments.length;
    const slaMetCount = completedAssignments.filter(time => time <= 30).length;
    const slaCompliance = totalWithResponse > 0
      ? Math.round((slaMetCount / totalWithResponse) * 100)
      : 100;
    
    // Count active engineers
    const busyEngineers = allEngineers.filter(e => e.status === 'busy').length;
    const totalEngineers = allEngineers.length;
    
    return {
      total,
      unassigned,
      onsite,
      overdue,
      avgResponse,
      slaCompliance,
      busyEngineers,
      totalEngineers
    };
  };

  // Setup auto-refresh
  useEffect(() => {
    fetchAllData();
    
    const interval = setInterval(() => {
      fetchAllData();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAllData]);

  const filteredBreakdowns = getFilteredBreakdowns();
  const stats = getStats();

  return (
    <DashboardLayout title="🔧 Engineering Response Dashboard" activeTab="engineering">
      <div 
        className="engineering-dashboard"
        style={{
          backgroundColor: theme.colors.bgPrimary,
          color: theme.colors.textPrimary,
          minHeight: 'calc(100vh - 180px)',
        }}
      >
        {/* Connection Status Bar */}
        <div 
          className="connection-bar"
          style={{
            backgroundColor: theme.colors.bgTertiary,
            borderBottom: `1px solid ${theme.colors.border}`,
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isConnected ? theme.colors.success : theme.colors.danger,
                animation: isConnected ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>
              {isConnected ? 'Live' : 'Disconnected'} • {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <span style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
            Auto-refresh: {REFRESH_INTERVAL / 1000}s
          </span>
        </div>

        {/* Main Content Container */}
        <div style={{ padding: '20px' }}>
          {/* Header Stats Cards */}
          <div 
            className="performance-metrics"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <div 
              className="metric-card"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: theme.transitions.normal,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                e.currentTarget.style.borderColor = theme.colors.borderHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgSecondary;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="metric-icon"
                style={{
                  fontSize: '32px',
                  width: '60px',
                  height: '60px',
                  borderRadius: theme.radius.md,
                  backgroundColor: `${theme.colors.primary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ⏱️
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  AVG RESPONSE TIME
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.textPrimary }}>
                  {stats.avgResponse ? `${stats.avgResponse} mins` : '--'}
                </div>
              </div>
            </div>

            <div 
              className="metric-card"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: theme.transitions.normal,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                e.currentTarget.style.borderColor = theme.colors.borderHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgSecondary;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="metric-icon"
                style={{
                  fontSize: '32px',
                  width: '60px',
                  height: '60px',
                  borderRadius: theme.radius.md,
                  backgroundColor: `${theme.colors.success}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✅
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  SLA COMPLIANCE
                </div>
                <div 
                  style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: stats.slaCompliance >= 90 ? theme.colors.success : 
                           stats.slaCompliance >= 70 ? theme.colors.warning : 
                           theme.colors.danger 
                  }}
                >
                  {stats.slaCompliance}%
                </div>
              </div>
            </div>

            <div 
              className="metric-card"
              style={{
                backgroundColor: theme.colors.bgSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: theme.transitions.normal,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgTertiary;
                e.currentTarget.style.borderColor = theme.colors.borderHover;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = theme.shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.bgSecondary;
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="metric-icon"
                style={{
                  fontSize: '32px',
                  width: '60px',
                  height: '60px',
                  borderRadius: theme.radius.md,
                  backgroundColor: `${theme.colors.info}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                👷
              </div>
              <div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
                  ACTIVE ENGINEERS
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: theme.colors.textPrimary }}>
                  {stats.busyEngineers}/{stats.totalEngineers}
                </div>
              </div>
            </div>
          </div>

          {/* Engineering Team Performance Section */}
          <div 
            className="depot-performance-section"
            style={{
              backgroundColor: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.lg,
              padding: '20px',
              marginBottom: '30px',
            }}
          >
            <h3 style={{ 
              color: theme.colors.textPrimary, 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              ⚙️ Engineering Team Performance <span style={{ color: theme.colors.textSecondary, fontSize: '14px', fontWeight: '400' }}>(Today)</span>
            </h3>
            <DepotStats 
              engineers={allEngineers} 
              metrics={engineeringMetrics}
            />
          </div>

          {/* Filters Section */}
          <div style={{ marginBottom: '20px' }}>
            <FilterBar
              filters={filterOptions}
              activeFilter={currentFilter}
              onFilterChange={setCurrentFilter}
            />
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <StatsCard
              icon="🚌"
              value={stats.total}
              label="Active Breakdowns"
              trend={null}
            />
            <StatsCard
              icon="⏳"
              value={stats.unassigned}
              label="Awaiting Engineer"
              variant={stats.unassigned > 5 ? 'danger' : stats.unassigned > 2 ? 'warning' : 'default'}
              trend={null}
            />
            <StatsCard
              icon="🔧"
              value={stats.onsite}
              label="Engineers On Site"
              trend={null}
            />
            <StatsCard
              icon="⚠️"
              value={stats.overdue}
              label="SLA at Risk"
              variant={stats.overdue > 3 ? 'danger' : stats.overdue > 1 ? 'warning' : 'default'}
              trend={null}
            />
          </div>

          {/* Breakdown List */}
          <div className="breakdown-list" style={{ marginTop: '30px' }}>
            {loading ? (
              <div className="theme-card" style={{ textAlign: 'center', padding: '60px' }}>
                <div className="theme-loading" style={{ margin: '0 auto 20px' }}></div>
                <p style={{ color: theme.colors.textSecondary }}>Loading breakdown data...</p>
              </div>
            ) : error ? (
              <div className="theme-card" style={{
                textAlign: 'center',
                padding: '40px',
                border: `1px solid ${theme.colors.danger}`,
              }}>
                <p style={{ color: theme.colors.danger, marginBottom: '20px' }}>⚠️ {error}</p>
                <button 
                  onClick={fetchAllData} 
                  className="theme-btn theme-btn-danger"
                >
                  Retry
                </button>
              </div>
            ) : filteredBreakdowns.length === 0 ? (
              <div className="theme-card" style={{ 
                textAlign: 'center', 
                padding: '60px',
                backgroundColor: theme.colors.bgSecondary,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.8 }}>
                  ✅
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '600',
                  color: theme.colors.textPrimary,
                  marginBottom: '10px'
                }}>
                  No breakdowns matching the selected filter.
                </div>
                <div style={{ color: theme.colors.textSecondary, fontSize: '16px' }}>
                  {currentFilter === 'all' ? 
                    'All vehicles are operational' : 
                    `Try selecting a different filter to view breakdowns`}
                </div>
              </div>
            ) : (
              <div className="breakdown-grid">
                {filteredBreakdowns.map(breakdown => (
                  <EngineeringCard
                    key={breakdown.breakdown_id}
                    breakdown={breakdown}
                    onShowEngineerModal={handleShowEngineerModal}
                    onAutoAssign={handleAutoAssign}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Engineer Selection Modal */}
        {showEngineerModal && (
          <EngineerModal
            breakdownId={selectedBreakdownId?.breakdownId}
            depotId={selectedBreakdownId?.depotId}
            onAssign={handleAssignEngineer}
            onClose={() => setShowEngineerModal(false)}
          />
        )}

        {/* Notification */}
        {notification && (
          <div 
            className="notification"
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '15px 30px',
              borderRadius: theme.radius.md,
              boxShadow: theme.shadows.lg,
              zIndex: theme.zIndex.tooltip,
              fontWeight: '500',
              animation: 'slideDown 0.3s ease-out',
              backgroundColor: notification.type === 'success' ? theme.colors.success : theme.colors.danger,
              color: 'white',
            }}
          >
            {notification.type === 'success' ? '✅ ' : '❌ '}
            {notification.message}
          </div>
        )}

        {/* Quick Stats Footer */}
        <div 
          className="quick-stats-footer"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.bgSecondary,
            borderTop: `2px solid ${theme.colors.border}`,
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
            zIndex: theme.zIndex.fixed,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>Next Available Engineer:</span>
            <span style={{ color: theme.colors.textPrimary, fontSize: '16px', fontWeight: '600' }}>
              {allEngineers.find(e => e.status === 'available')?.name || '--:--'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>Avg Wait Time:</span>
            <span style={{ color: theme.colors.textPrimary, fontSize: '16px', fontWeight: '600' }}>
              {stats.avgResponse ? `${stats.avgResponse}m` : '--'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>Today's Resolved:</span>
            <span style={{ color: theme.colors.success, fontSize: '16px', fontWeight: '600' }}>
              {engineeringMetrics.totalResolved || 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>SLA Breaches:</span>
            <span 
              style={{ 
                color: engineeringMetrics.slaBreaches > 0 ? theme.colors.danger : theme.colors.success, 
                fontSize: '16px', 
                fontWeight: '600' 
              }}
            >
              {engineeringMetrics.slaBreaches || 0}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .performance-metrics {
            grid-template-columns: 1fr !important;
          }

          .breakdown-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .quick-stats-footer {
            flex-direction: column;
            gap: 10px;
            padding-bottom: 70px !important;
          }

          .quick-stats-footer > div {
            width: 100%;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
            padding-bottom: 8px;
          }

          .quick-stats-footer > div:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EngineeringDashboard;
