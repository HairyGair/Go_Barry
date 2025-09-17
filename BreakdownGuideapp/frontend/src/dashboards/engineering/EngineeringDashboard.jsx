import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import { apiConfig } from '../../breakdown-guide/components/common/constants';
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
  const [showTestData, setShowTestData] = useState(false);

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Breakdowns' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'on-site', label: 'On Site' },
    { value: 'overdue', label: 'Overdue (>30m)' },
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
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setLoading(false);
    }
  }, [showTestData]);

  // Enhance breakdown data with assignments
  const enhanceBreakdownData = async (breakdowns) => {
    // Filter out test data unless checkbox is checked
    let filteredBreakdowns = breakdowns;
    if (!showTestData) {
      filteredBreakdowns = breakdowns.filter(b => 
        !b.fleet_no.toUpperCase().includes('TEST')
      );
    }
    
    // Enhance each breakdown with assignment data
    const enhancedBreakdowns = [];
    
    for (const breakdown of filteredBreakdowns) {
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
    <DashboardLayout title="⚙️ Engineering Response Live" activeTab="engineering">
      {/* Header Stats */}
      <div className="header-stats">
        <div className="header-stat">
          <span>⏱️ Avg Response:</span>
          <strong>{stats.avgResponse ? `${stats.avgResponse} mins` : '--'}</strong>
        </div>
        <div className="header-stat">
          <span>✅ SLA Compliance:</span>
          <strong>{stats.slaCompliance}%</strong>
        </div>
        <div className="header-stat">
          <span>👷 Engineers Active:</span>
          <strong>{stats.busyEngineers}/{stats.totalEngineers}</strong>
        </div>
      </div>

      {/* Engineering Performance Panel */}
      <DepotStats 
        engineers={allEngineers} 
        metrics={engineeringMetrics}
      />

      {/* Filters */}
      <div className="filters-section">
        <FilterBar
          filters={filterOptions}
          activeFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />
        <div className="test-data-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={showTestData}
              onChange={(e) => setShowTestData(e.target.checked)}
            />
            Show Test Data
          </label>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatsCard
          value={stats.total}
          label="Active Breakdowns"
          trend={null}
        />
        <StatsCard
          value={stats.unassigned}
          label="Awaiting Engineer"
          variant={stats.unassigned > 5 ? 'danger' : stats.unassigned > 2 ? 'warning' : 'default'}
          trend={null}
        />
        <StatsCard
          value={stats.onsite}
          label="Engineers On Site"
          trend={null}
        />
        <StatsCard
          value={stats.overdue}
          label="Overdue (>30m)"
          variant={stats.overdue > 3 ? 'danger' : stats.overdue > 1 ? 'warning' : 'default'}
          trend={null}
        />
      </div>

      {/* Breakdown List */}
      <div className="breakdown-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading breakdown data...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={fetchAllData} className="retry-button">Retry</button>
          </div>
        ) : filteredBreakdowns.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">✅</div>
            <div className="no-data-title">No Active Breakdowns</div>
            <div className="no-data-text">
              {currentFilter === 'all' ? 
                'All vehicles are operational' : 
                `No breakdowns match the "${currentFilter}" filter`}
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
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✅ ' : '❌ '}
          {notification.message}
        </div>
      )}

      <style>{`
        .header-stats {
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .header-stat {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-stat strong {
          font-size: 18px;
          color: #1e3a8a;
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 20px;
        }

        .test-data-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 13px;
        }

        .test-data-toggle input {
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .breakdown-list {
          margin-top: 20px;
        }

        .loading {
          text-align: center;
          padding: 60px;
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

        .error-message {
          text-align: center;
          padding: 40px;
          background: #fee2e2;
          border-radius: 8px;
          margin: 20px 0;
        }

        .retry-button {
          margin-top: 10px;
          padding: 8px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .no-data-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .no-data-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e3a8a;
          margin-bottom: 10px;
        }

        .no-data-text {
          color: #6b7280;
          font-size: 16px;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
          gap: 20px;
        }

        .notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 15px 30px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }

        .notification.success {
          background: #10b981;
          color: white;
        }

        .notification.error {
          background: #ef4444;
          color: white;
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); }
          to { transform: translateX(-50%) translateY(0); }
        }

        @media (max-width: 768px) {
          .header-stats {
            flex-wrap: wrap;
            gap: 15px;
          }

          .filters-section {
            flex-direction: column;
          }

          .breakdown-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default EngineeringDashboard;
