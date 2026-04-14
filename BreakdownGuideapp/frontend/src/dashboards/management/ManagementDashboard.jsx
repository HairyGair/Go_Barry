import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import { apiClient } from '../../services/api-client';
import ExecutiveKPIs from './ExecutiveKPIs';
import PerformanceTrends from './PerformanceTrends';
import DepotComparison from './DepotComparison';
import FleetHealth from './FleetHealth';
import ExportPanel from './ExportPanel';
import SupervisorPerformance from './SupervisorPerformance';
import CoverageGapsAnalysis from './CoverageGapsAnalysis';
import EtaAccuracy from './EtaAccuracy';
import ShiftCoverage from './ShiftCoverage';

const REFRESH_INTERVAL = 30000; // 30 seconds for executive dashboard

const ManagementDashboard = () => {
  // State
  const [kpiData, setKpiData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [depotData, setDepotData] = useState(null);
  const [fleetHealth, setFleetHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [notification, setNotification] = useState(null);

  // Period options
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ];

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch data in parallel (auth automatic via apiClient)
      // Trends endpoint only supports week/month/year and requires a metric
      const trendPeriod = (selectedPeriod === 'today' || selectedPeriod === 'quarter') ? 'week' : selectedPeriod;

      const [kpiJson, trendJson, depotJson, fleetJson] = await Promise.all([
        apiClient.get(`/api/analytics/kpis?period=${selectedPeriod}`),
        apiClient.get(`/api/analytics/trends?metric=breakdowns&period=${trendPeriod}`),
        apiClient.get(`/api/analytics/depot-comparison?period=${selectedPeriod}`),
        apiClient.get('/api/analytics/fleet-health')
      ]);

      setKpiData(kpiJson.data || null);
      setTrendData(trendJson.data || null);
      setDepotData(depotJson.data || null);
      setFleetHealth(fleetJson.data || null);

      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Clear data on error
      setKpiData(null);
      setTrendData(null);
      setDepotData(null);
      setFleetHealth(null);
      setLoading(false);
      setError('Failed to load data - API connection unavailable');
    }
  }, [selectedPeriod]);

  // Get time labels based on period
  const getTimeLabels = (period) => {
    switch(period) {
      case 'today':
        return ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
      case 'week':
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'month':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case 'quarter':
        return ['Month 1', 'Month 2', 'Month 3'];
      case 'year':
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      default:
        return [];
    }
  };

  // Get number of data points
  const getDataPoints = (period) => {
    switch(period) {
      case 'today': return 7;
      case 'week': return 7;
      case 'month': return 4;
      case 'quarter': return 3;
      case 'year': return 12;
      default: return 7;
    }
  };

  // Handle export
  const handleExport = async (format, sections) => {
    setNotification({ message: `Preparing ${format.toUpperCase()} export...`, type: 'info' });

    try {
      const rows = [];
      const timestamp = new Date().toISOString().split('T')[0];

      if (sections.includes('kpis') && kpiData) {
        rows.push(['== Executive KPIs ==']);
        rows.push(['Metric', 'Value']);
        rows.push(['Total Breakdowns', kpiData.totalBreakdowns ?? '']);
        rows.push(['Active Breakdowns', kpiData.activeBreakdowns ?? '']);
        rows.push(['SLA Compliance %', kpiData.slaCompliance ?? '']);
        rows.push(['Avg Response Time (min)', kpiData.avgResponseTime ?? '']);
        rows.push(['Fleet Availability %', kpiData.fleetAvailability ?? '']);
        rows.push(['MTBF (hours)', kpiData.mtbf ?? '']);
        rows.push([]);
      }

      if (sections.includes('depotComparison') && depotData) {
        rows.push(['== Depot Comparison ==']);
        rows.push(['Depot', 'Breakdowns', 'Avg Response (min)', 'SLA %', 'Fleet Size']);
        const depots = Array.isArray(depotData) ? depotData : depotData.depots || [];
        depots.forEach(d => {
          rows.push([d.name || d.depot, d.breakdowns ?? '', d.avgResponse ?? '', d.slaCompliance ?? '', d.fleetSize ?? '']);
        });
        rows.push([]);
      }

      if (sections.includes('fleetHealth') && fleetHealth) {
        rows.push(['== Fleet Health ==']);
        rows.push(['Status', 'Count']);
        const categories = fleetHealth.categories || fleetHealth.statusBreakdown || [];
        categories.forEach(c => {
          rows.push([c.name || c.status, c.count ?? c.value ?? '']);
        });
        rows.push([]);
      }

      // Build CSV string
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gobarry-analytics-${selectedPeriod}-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setNotification({ message: 'Export completed! Check your downloads folder.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setNotification({ message: 'Export failed. Please try again.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
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

  return (
    <DashboardLayout title="Management Overview" activeTab="management">
      {/* Period Selector */}
      <div className="mgmt-period-selector">
        <div className="mgmt-header-content">
          <div className="mgmt-title-row">
            <svg className="mgmt-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H9V9H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 3H21V9H15V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 15H21V21H15V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 15H9V21H3V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="mgmt-title">Management Overview</h1>
          </div>
          <div className="mgmt-period-buttons">
            {periodOptions.map(option => (
              <button
                key={option.value}
                className={`mgmt-period-btn ${selectedPeriod === option.value ? 'mgmt-active' : ''}`}
                onClick={() => setSelectedPeriod(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mgmt-last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mgmt-error-banner">
          <svg className="mgmt-error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="mgmt-loading">
          <div className="mgmt-spinner"></div>
          <p className="mgmt-loading-text">Loading executive dashboard...</p>
        </div>
      ) : (
        <>
          {/* Executive KPIs */}
          <ExecutiveKPIs kpiData={kpiData} period={selectedPeriod} />

          {/* Performance Trends */}
          <PerformanceTrends trendData={trendData} period={selectedPeriod} />

          {/* Two Column Layout */}
          <div className="mgmt-two-column-layout">
            {/* Depot Comparison */}
            <DepotComparison depotData={depotData} />

            {/* Fleet Health */}
            <FleetHealth fleetHealth={fleetHealth} />
          </div>

          {/* Supervisor Performance Dashboard */}
          <SupervisorPerformance period={selectedPeriod === 'today' ? 'week' : selectedPeriod} />

          {/* Engineer ETA Accuracy */}
          <EtaAccuracy period={selectedPeriod} />

          {/* Shift Coverage Timeline */}
          <ShiftCoverage />

          {/* Coverage Gaps Analysis */}
          <CoverageGapsAnalysis />

          {/* Export Panel */}
          <ExportPanel
            onExport={handleExport}
            period={selectedPeriod}
          />
        </>
      )}

      {/* Notification */}
      {notification && (
        <div className={`mgmt-notification mgmt-notification--${notification.type}`}>
          <svg className="mgmt-notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {notification.type === 'success' && (
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {notification.type === 'error' && (
              <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
            {notification.type === 'info' && (
              <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
          {notification.message}
        </div>
      )}

      <style jsx>{`
        /* Period Selector Card */
        .mgmt-period-selector {
          background: #141D2B;
          border: 1px solid #1E293B;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 0 20px rgba(0, 151, 167, 0.1);
        }

        .mgmt-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mgmt-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mgmt-icon {
          color: #0097A7;
          flex-shrink: 0;
        }

        .mgmt-title {
          color: white;
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }

        .mgmt-period-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mgmt-period-btn {
          padding: 8px 20px;
          border: 1px solid #1E293B;
          background: #0B1120;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          color: #94A3B8;
        }

        .mgmt-period-btn:hover {
          background: #1E293B;
          border-color: rgba(0, 151, 167, 0.3);
          color: white;
        }

        .mgmt-period-btn.mgmt-active {
          background: linear-gradient(135deg, #0097A7 0%, #00838F 100%);
          color: white;
          border-color: #0097A7;
          box-shadow: 0 0 20px rgba(0, 151, 167, 0.3);
        }

        .mgmt-last-updated {
          color: #64748B;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          margin-top: 8px;
          text-align: right;
        }

        /* Error Banner */
        .mgmt-error-banner {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #F59E0B;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mgmt-error-icon {
          flex-shrink: 0;
        }

        /* Loading State */
        .mgmt-loading {
          text-align: center;
          padding: 80px 20px;
          color: #64748B;
        }

        .mgmt-loading-text {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          margin-top: 16px;
        }

        .mgmt-spinner {
          border: 3px solid #1E293B;
          border-top: 3px solid #0097A7;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: mgmt-spin 1s linear infinite;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(0, 151, 167, 0.3);
        }

        @keyframes mgmt-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Two Column Layout */
        .mgmt-two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
        }

        /* Notification Toast */
        .mgmt-notification {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 16px 32px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 10000;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          animation: mgmt-slideDown 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid transparent;
        }

        .mgmt-notification-icon {
          flex-shrink: 0;
        }

        .mgmt-notification--success {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        }

        .mgmt-notification--error {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          color: white;
          border-color: rgba(220, 38, 38, 0.3);
          box-shadow: 0 8px 32px rgba(220, 38, 38, 0.3);
        }

        .mgmt-notification--info {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: white;
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }

        @keyframes mgmt-slideDown {
          from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        /* Responsive Layout */
        @media (max-width: 1024px) {
          .mgmt-two-column-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .mgmt-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .mgmt-period-buttons {
            width: 100%;
          }

          .mgmt-period-btn {
            flex: 1;
            min-width: 80px;
          }

          .mgmt-last-updated {
            text-align: left;
          }
        }

        @media (max-width: 640px) {
          .mgmt-period-selector {
            padding: 16px;
          }

          .mgmt-title {
            font-size: 20px;
          }

          .mgmt-period-buttons {
            flex-wrap: wrap;
            gap: 6px;
          }

          .mgmt-period-btn {
            padding: 6px 14px;
            font-size: 13px;
          }

          .mgmt-notification {
            left: 12px;
            right: 12px;
            transform: none;
            padding: 12px 20px;
          }

          @keyframes mgmt-slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ManagementDashboard;
