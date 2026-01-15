/**
 * Fleet Intelligence Command Center
 *
 * A comprehensive analytics dashboard for Go North East supervisors
 * showing real-time fleet health, mileage tracking, and predictive insights.
 *
 * Created: December 2025
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './FleetIntelligenceDashboard.css';

// Import sub-components
import KPIBar from './components/KPIBar';
import DefectHotspotMap from './components/DefectHotspotMap';
import MileageLostChart from './components/MileageLostChart';
import CriticalVehiclesPanel from './components/CriticalVehiclesPanel';
import LiveActivityFeed from '../../components/LiveActivityFeed';
import DepotPerformanceChart from './components/DepotPerformanceChart';
import TrendingIssuesList from './components/TrendingIssuesList';
import PredictiveAlertsPanel from './components/PredictiveAlertsPanel';

// Import the custom hook
import useFleetIntelligence from './hooks/useFleetIntelligence';

const FleetIntelligenceDashboard = () => {
  const [timeframe, setTimeframe] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Use the custom hook to fetch all data
  const {
    kpis,
    breakdowns,
    mileageData,
    criticalVehicles,
    depotStats,
    trendingIssues,
    predictiveAlerts,
    loading,
    error,
    usingDemoData,
    refresh,
  } = useFleetIntelligence({ timeframe, autoRefresh: true, refreshInterval: 30000 });

  // Update last updated time when data refreshes
  useEffect(() => {
    if (!loading) {
      setLastUpdated(new Date());
    }
  }, [loading]);

  // Handle timeframe change
  const handleTimeframeChange = (e) => {
    setTimeframe(e.target.value);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refresh();
  };

  // Handle export (placeholder for now)
  const handleExport = () => {
    console.log('Export functionality coming soon');
    // Could export to CSV/PDF
  };

  // Format last updated time
  const formatLastUpdated = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Handle vehicle escalation
  const handleEscalate = (vehicle) => {
    console.log('Escalating vehicle:', vehicle);
    // TODO: Implement escalation logic
  };

  // Handle view history
  const handleViewHistory = (vehicle) => {
    console.log('Viewing history for:', vehicle);
    // TODO: Navigate to vehicle history view
  };

  // Handle map marker click
  const handleMarkerClick = (breakdownId) => {
    console.log('Map marker clicked:', breakdownId);
    // TODO: Show breakdown details modal
  };

  return (
    <div className="fleet-intelligence-dashboard">
      {/* Header */}
      <header className="fid-header">
        <div>
          <h1>Fleet Intelligence Command Center</h1>
          <p className="fid-header-subtitle">Real-time fleet analytics and insights</p>
        </div>
        <div className="fid-controls">
          <div className="fid-last-updated">
            <span className="fid-live-dot"></span>
            Updated {formatLastUpdated(lastUpdated)}
          </div>
          <select
            className="fid-timeframe-select"
            value={timeframe}
            onChange={handleTimeframeChange}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="fid-control-btn" onClick={handleRefresh}>
            <span>Refresh</span>
          </button>
          <button className="fid-control-btn" onClick={handleExport}>
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Demo Mode Banner */}
      {usingDemoData && (
        <div className="fid-demo-banner">
          <span>📊 Demo Mode - Showing sample data (API unavailable)</span>
          <button onClick={refresh}>Try Again</button>
        </div>
      )}

      {/* Error State */}
      {error && !usingDemoData && (
        <div className="fid-error-banner">
          <span>Error loading data: {error}</span>
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {/* KPI Bar */}
      <KPIBar data={kpis} loading={loading} />

      {/* Main Grid */}
      <div className="fid-grid">
        {/* Left Column - Map & Chart */}
        <div className="fid-left-column">
          <DefectHotspotMap
            breakdowns={breakdowns}
            onMarkerClick={handleMarkerClick}
            loading={loading}
          />
          <MileageLostChart
            data={mileageData}
            loading={loading}
          />
        </div>

        {/* Right Column - Vehicles & Activity */}
        <div className="fid-right-column">
          <CriticalVehiclesPanel
            vehicles={criticalVehicles}
            onEscalate={handleEscalate}
            onViewHistory={handleViewHistory}
            loading={loading}
          />
          <LiveActivityFeed embedded={true} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="fid-bottom-row">
        <DepotPerformanceChart
          depots={depotStats}
          loading={loading}
        />
        <TrendingIssuesList
          trends={trendingIssues}
          loading={loading}
        />
        <PredictiveAlertsPanel
          alerts={predictiveAlerts}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default FleetIntelligenceDashboard;
