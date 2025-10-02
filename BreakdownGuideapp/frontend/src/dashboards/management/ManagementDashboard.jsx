import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatsCard from '../components/StatsCard';
import { apiClient } from '../../services/api-client';
import ExecutiveKPIs from './ExecutiveKPIs';
import PerformanceTrends from './PerformanceTrends';
import DepotComparison from './DepotComparison';
import FleetHealth from './FleetHealth';
import ExportPanel from './ExportPanel';

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
      const [kpiJson, trendJson, depotJson, fleetJson] = await Promise.all([
        apiClient.get(`/api/analytics/kpis?period=${selectedPeriod}`),
        apiClient.get(`/api/analytics/trends?period=${selectedPeriod}`),
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
      // Simulate export preparation
      setTimeout(() => {
        setNotification({ 
          message: `Export completed! Check your downloads folder.`, 
          type: 'success' 
        });
        // In real implementation, this would trigger actual file download
      }, 2000);
    } catch (error) {
      setNotification({ message: 'Export failed. Please try again.', type: 'error' });
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
    <DashboardLayout title="📊 Management Overview" activeTab="management">
      {/* Period Selector */}
      <div className="period-selector">
        <div className="period-buttons">
          {periodOptions.map(option => (
            <button
              key={option.value}
              className={`period-btn ${selectedPeriod === option.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading executive dashboard...</p>
        </div>
      ) : (
        <>
          {/* Executive KPIs */}
          <ExecutiveKPIs kpiData={kpiData} period={selectedPeriod} />

          {/* Performance Trends */}
          <PerformanceTrends trendData={trendData} period={selectedPeriod} />

          {/* Two Column Layout */}
          <div className="two-column-layout">
            {/* Depot Comparison */}
            <DepotComparison depotData={depotData} />
            
            {/* Fleet Health */}
            <FleetHealth fleetHealth={fleetHealth} />
          </div>

          {/* Export Panel */}
          <ExportPanel 
            onExport={handleExport}
            period={selectedPeriod}
          />
        </>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✅ ' : 
           notification.type === 'error' ? '❌ ' : 'ℹ️ '}
          {notification.message}
        </div>
      )}

      <style jsx>{`
        .period-selector {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .period-buttons {
          display: flex;
          gap: 10px;
        }

        .period-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;
        }

        .period-btn:hover {
          background: #f9fafb;
        }

        .period-btn.active {
          background: #1e3a8a;
          color: white;
          border-color: #1e3a8a;
        }

        .last-updated {
          color: #6b7280;
          font-size: 13px;
        }

        .error-banner {
          background: #fef3c7;
          color: #92400e;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading {
          text-align: center;
          padding: 80px;
          color: #6b7280;
        }

        .spinner {
          border: 3px solid #f3f4f6;
          border-top: 3px solid #1e3a8a;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
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

        .notification.info {
          background: #3b82f6;
          color: white;
        }

        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); }
          to { transform: translateX(-50%) translateY(0); }
        }

        @media (max-width: 1024px) {
          .two-column-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .period-selector {
            flex-direction: column;
            gap: 15px;
          }

          .period-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }

          .last-updated {
            text-align: center;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default ManagementDashboard;
