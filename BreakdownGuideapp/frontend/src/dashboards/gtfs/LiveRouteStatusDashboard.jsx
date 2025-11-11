/**
 * Live Route Status Dashboard
 * Displays real-time status of all 225 bus routes
 * Shows Green/Amber/Red status based on active breakdowns
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import RouteStatusCard from './RouteStatusCard';
import { gtfsApiService } from '../../services/gtfsApiService';
import './LiveRouteStatusDashboard.css';

const REFRESH_INTERVAL = 10000; // Refresh every 10 seconds for live data

const LiveRouteStatusDashboard = () => {
  // State
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, GREEN, AMBER, RED
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('status'); // status, number, name

  // Real-time connection
  const wsRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  /**
   * Fetch live route status from API
   */
  const fetchRouteStatus = useCallback(async () => {
    try {
      const response = await gtfsApiService.getLiveRouteStatus();

      if (response.success) {
        setRoutes(response.routes || []);
        setSummary(response.summary || null);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Failed to fetch route status');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching route status:', err);
      setError('Unable to connect to API');
      setLoading(false);
    }
  }, []);

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    // Initial fetch
    fetchRouteStatus();

    // Setup refresh interval
    refreshIntervalRef.current = setInterval(() => {
      fetchRouteStatus();
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchRouteStatus]);

  /**
   * Filter and sort routes
   */
  const getFilteredRoutes = useCallback(() => {
    let filtered = [...routes];

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(route => route.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(route =>
        route.routeShortName.toLowerCase().includes(query) ||
        route.routeLongName.toLowerCase().includes(query) ||
        route.routeId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'status':
          // RED > AMBER > GREEN
          const statusOrder = { RED: 0, AMBER: 1, GREEN: 2 };
          return statusOrder[a.status] - statusOrder[b.status];

        case 'number':
          // Numeric sort
          const numA = parseInt(a.routeShortName) || 999;
          const numB = parseInt(b.routeShortName) || 999;
          return numA - numB;

        case 'name':
          return a.routeLongName.localeCompare(b.routeLongName);

        default:
          return 0;
      }
    });

    return filtered;
  }, [routes, statusFilter, searchQuery, sortBy]);

  /**
   * Handle route card details click
   */
  const handleRouteDetails = (route) => {
    console.log('Route details:', route);
    // Could open a modal or navigate to detailed view
  };

  /**
   * Manual refresh button
   */
  const handleManualRefresh = async () => {
    setLoading(true);
    await fetchRouteStatus();
  };

  const filteredRoutes = getFilteredRoutes();

  return (
    <DashboardLayout>
      <div className="live-route-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Live Route Status Dashboard</h1>
            <p>Real-time monitoring of all 225 bus routes</p>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <button
              className="refresh-button"
              onClick={handleManualRefresh}
              disabled={loading}
              title="Refresh data (auto-refreshes every 10 seconds)"
            >
              <span className="refresh-icon" style={{
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }}>
                ↻
              </span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="summary-stats">
            <div className="stat-card green">
              <div className="stat-number">{summary.green_routes}</div>
              <div className="stat-label">Operational Routes</div>
              <div className="stat-subtitle">GREEN - No Issues</div>
            </div>

            <div className="stat-card amber">
              <div className="stat-number">{summary.amber_routes}</div>
              <div className="stat-label">At-Risk Routes</div>
              <div className="stat-subtitle">AMBER - 1 Breakdown</div>
            </div>

            <div className="stat-card red">
              <div className="stat-number">{summary.red_routes}</div>
              <div className="stat-label">Problem Routes</div>
              <div className="stat-subtitle">RED - Multiple Issues</div>
            </div>

            <div className="stat-card blue">
              <div className="stat-number">{summary.total_active_breakdowns}</div>
              <div className="stat-label">Active Breakdowns</div>
              <div className="stat-subtitle">Total Issues</div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Routes</option>
              <option value="GREEN">✓ Operational (GREEN)</option>
              <option value="AMBER">! At-Risk (AMBER)</option>
              <option value="RED">⚠ Problems (RED)</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-by">Sort by:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="status">Status (Critical First)</option>
              <option value="number">Route Number</option>
              <option value="name">Route Name</option>
            </select>
          </div>

          <div className="filter-group search">
            <input
              type="text"
              placeholder="Search route number, name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-message">
            <div className="error-icon">⚠</div>
            <div className="error-text">{error}</div>
            <button onClick={handleManualRefresh} className="error-retry">
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && routes.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading route status...</p>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="results-info">
            Showing <strong>{filteredRoutes.length}</strong> of <strong>{routes.length}</strong> routes
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </div>
        )}

        {/* Routes List */}
        <div className="routes-container">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route) => (
              <RouteStatusCard
                key={route.routeId}
                route={route}
                onDetailsClick={handleRouteDetails}
              />
            ))
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <p>No routes found matching your criteria</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="reset-button"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="dashboard-footer">
          <p>
            <strong>Status Definitions:</strong>
            <span className="status-def green">● GREEN: Operational (0 active breakdowns)</span>
            <span className="status-def amber">● AMBER: At-Risk (1 active breakdown)</span>
            <span className="status-def red">● RED: Problem (2+ active breakdowns)</span>
          </p>
          <p>Data auto-refreshes every 10 seconds • Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LiveRouteStatusDashboard;
