/**
 * MileageDetailsModal.jsx
 *
 * Detailed mileage analysis modal for Fleet Intelligence dashboard.
 * Shows breakdown-by-breakdown mileage lost with full calculation details.
 *
 * Created: December 2025
 */

import React, { useState, useEffect } from 'react';
import './MileageDetailsModal.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.breakdowns.gobarry.co.uk';

const MileageDetailsModal = ({ isOpen, onClose, initialDays = 7 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(initialDays);
  const [sortBy, setSortBy] = useState('mileage');
  const [filterDepot, setFilterDepot] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [activeTab, setActiveTab] = useState('breakdowns'); // 'breakdowns', 'routes', 'depots'

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, days, sortBy, filterDepot, filterRoute]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        days: days.toString(),
        sortBy,
        limit: '100',
      });
      if (filterDepot) params.append('depot', filterDepot);
      if (filterRoute) params.append('route', filterRoute);

      const response = await fetch(`${API_BASE}/api/mileage/detailed-analysis?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch mileage data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching mileage details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityClass = (severity) => {
    if (!severity) return '';
    const lower = severity.toLowerCase();
    if (lower === 'stop' || lower === 'red') return 'severity-stop';
    if (lower === 'amber' || lower === 'yellow') return 'severity-amber';
    return 'severity-continue';
  };

  if (!isOpen) return null;

  return (
    <div className="mileage-modal-overlay" onClick={onClose}>
      <div className="mileage-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mileage-modal-header">
          <div className="modal-title-section">
            <h2>📏 Mileage Lost Analysis</h2>
            <p className="modal-subtitle">Detailed breakdown of service mileage lost</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Filters */}
        <div className="mileage-filters">
          <div className="filter-group">
            <label>Time Period</label>
            <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="mileage">Highest Mileage</option>
              <option value="date">Most Recent</option>
              <option value="duration">Longest Duration</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Route</label>
            <input
              type="text"
              placeholder="Filter by route..."
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Depot</label>
            <input
              type="text"
              placeholder="Filter by depot..."
              value={filterDepot}
              onChange={(e) => setFilterDepot(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Stats */}
        {data && !loading && (
          <div className="mileage-summary-bar">
            <div className="summary-stat">
              <span className="stat-value">{data.summary.totalBreakdowns}</span>
              <span className="stat-label">Breakdowns</span>
            </div>
            <div className="summary-stat highlight">
              <span className="stat-value">{data.summary.totalMileageLost.toLocaleString()}</span>
              <span className="stat-label">Total Miles Lost</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{data.summary.avgMileagePerBreakdown.toFixed(1)}</span>
              <span className="stat-label">Avg per Breakdown</span>
            </div>
            <div className="summary-stat">
              <span className="stat-value">{data.summary.maxMileageSingleBreakdown.toFixed(1)}</span>
              <span className="stat-label">Max Single</span>
            </div>
            {data.summary.cappedBreakdowns > 0 && (
              <div className="summary-stat warning">
                <span className="stat-value">{data.summary.cappedBreakdowns}</span>
                <span className="stat-label">Hit 500mi Cap</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mileage-tabs">
          <button
            className={`tab-btn ${activeTab === 'breakdowns' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdowns')}
          >
            📋 All Breakdowns
          </button>
          <button
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            🚌 By Route
          </button>
          <button
            className={`tab-btn ${activeTab === 'depots' ? 'active' : ''}`}
            onClick={() => setActiveTab('depots')}
          >
            🏭 By Depot
          </button>
        </div>

        {/* Content */}
        <div className="mileage-modal-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading mileage data...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={fetchData}>Retry</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Breakdowns Tab */}
              {activeTab === 'breakdowns' && (
                <div className="breakdowns-list">
                  {data.breakdowns.length === 0 ? (
                    <div className="empty-state">
                      <span>📭</span>
                      <p>No breakdowns found with mileage data for this period.</p>
                    </div>
                  ) : (
                    data.breakdowns.map((breakdown) => (
                      <div
                        key={breakdown.id}
                        className={`breakdown-card ${selectedBreakdown?.id === breakdown.id ? 'expanded' : ''}`}
                        onClick={() => setSelectedBreakdown(
                          selectedBreakdown?.id === breakdown.id ? null : breakdown
                        )}
                      >
                        <div className="breakdown-card-header">
                          <div className="breakdown-main-info">
                            <span className={`severity-badge ${getSeverityClass(breakdown.wizardDecision || breakdown.severity)}`}>
                              {breakdown.wizardDecision || breakdown.severity || 'N/A'}
                            </span>
                            <span className="fleet-no">Fleet {breakdown.fleetNo}</span>
                            <span className="route-badge">Route {breakdown.route.shortName || breakdown.route.id}</span>
                          </div>
                          <div className="breakdown-mileage">
                            <span className="mileage-value">{breakdown.mileage.total.toFixed(1)}</span>
                            <span className="mileage-unit">mi lost</span>
                            {breakdown.mileage.wasCapped && (
                              <span className="capped-badge" title="Capped at 500 miles">⚠️ CAPPED</span>
                            )}
                          </div>
                        </div>

                        <div className="breakdown-card-meta">
                          <span className="meta-item">
                            <span className="meta-icon">📍</span>
                            {breakdown.location.description || 'Unknown location'}
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">🏭</span>
                            {breakdown.depot || 'Unknown depot'}
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">⏱️</span>
                            {breakdown.durationFormatted}
                          </span>
                          <span className="meta-item">
                            <span className="meta-icon">📅</span>
                            {formatDate(breakdown.createdAt)}
                          </span>
                        </div>

                        {/* Expanded Details */}
                        {selectedBreakdown?.id === breakdown.id && (
                          <div className="breakdown-details">
                            <div className="details-section">
                              <h4>📊 Mileage Calculation Breakdown</h4>
                              <div className="calculation-grid">
                                <div className="calc-item">
                                  <span className="calc-label">Current Trip Lost</span>
                                  <span className="calc-value">{breakdown.mileage.currentTripMiles.toFixed(2)} mi</span>
                                </div>
                                <div className="calc-item">
                                  <span className="calc-label">Missed Trips Lost</span>
                                  <span className="calc-value">{breakdown.mileage.missedTripsMiles.toFixed(2)} mi</span>
                                </div>
                                <div className="calc-item total">
                                  <span className="calc-label">Total Mileage Lost</span>
                                  <span className="calc-value">{breakdown.mileage.total.toFixed(2)} mi</span>
                                </div>
                              </div>
                            </div>

                            {breakdown.routeInfo && (
                              <div className="details-section">
                                <h4>🚌 Route Information</h4>
                                <div className="info-grid">
                                  <div className="info-item">
                                    <span className="info-label">Route Length</span>
                                    <span className="info-value">{breakdown.routeInfo.distanceMiles.toFixed(1)} mi</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Total Stops</span>
                                    <span className="info-value">{breakdown.routeInfo.totalStops}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {breakdown.serviceImpact && (
                              <div className="details-section">
                                <h4>⏱️ Service Impact</h4>
                                <div className="info-grid">
                                  <div className="info-item">
                                    <span className="info-label">Downtime</span>
                                    <span className="info-value">
                                      {breakdown.serviceImpact.estimatedDowntimeMinutes} min
                                      {breakdown.serviceImpact.downtimeWasCapped && (
                                        <span className="capped-note"> (capped from {breakdown.serviceImpact.originalDowntimeMinutes})</span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Service Frequency</span>
                                    <span className="info-value">{breakdown.serviceImpact.tripsPerHour} trips/hr</span>
                                  </div>
                                  <div className="info-item">
                                    <span className="info-label">Trips Affected</span>
                                    <span className="info-value">{breakdown.serviceImpact.tripsAffected}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {breakdown.calculation && (
                              <div className="details-section formula-section">
                                <h4>🧮 Formula</h4>
                                <p className="formula">{breakdown.calculation.formula}</p>
                                <p className="formula-breakdown">{breakdown.calculation.breakdown}</p>
                              </div>
                            )}

                            <div className="details-footer">
                              <span className="breakdown-id">ID: {breakdown.breakdownId}</span>
                              <span className={`status-badge status-${breakdown.status}`}>
                                {breakdown.status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Routes Tab */}
              {activeTab === 'routes' && (
                <div className="routes-analysis">
                  {data.byRoute.length === 0 ? (
                    <div className="empty-state">
                      <span>📭</span>
                      <p>No route data available.</p>
                    </div>
                  ) : (
                    <div className="routes-grid">
                      {data.byRoute.map((route, index) => (
                        <div key={route.route} className="route-analysis-card">
                          <div className="route-rank">#{index + 1}</div>
                          <div className="route-info">
                            <h4>Route {route.route}</h4>
                            {route.routeName && <p className="route-name">{route.routeName}</p>}
                          </div>
                          <div className="route-stats">
                            <div className="route-stat">
                              <span className="stat-value">{route.totalMileage.toFixed(1)}</span>
                              <span className="stat-label">mi total</span>
                            </div>
                            <div className="route-stat">
                              <span className="stat-value">{route.breakdownCount}</span>
                              <span className="stat-label">breakdowns</span>
                            </div>
                            <div className="route-stat">
                              <span className="stat-value">{route.avgMileage.toFixed(1)}</span>
                              <span className="stat-label">mi avg</span>
                            </div>
                          </div>
                          <div className="route-bar">
                            <div
                              className="route-bar-fill"
                              style={{
                                width: `${(route.totalMileage / data.byRoute[0].totalMileage) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Depots Tab */}
              {activeTab === 'depots' && (
                <div className="depots-analysis">
                  {data.byDepot.length === 0 ? (
                    <div className="empty-state">
                      <span>📭</span>
                      <p>No depot data available.</p>
                    </div>
                  ) : (
                    <div className="depots-grid">
                      {data.byDepot.map((depot, index) => (
                        <div key={depot.depot} className="depot-analysis-card">
                          <div className="depot-rank">#{index + 1}</div>
                          <div className="depot-info">
                            <h4>{depot.depot}</h4>
                          </div>
                          <div className="depot-stats">
                            <div className="depot-stat">
                              <span className="stat-value">{depot.totalMileage.toFixed(1)}</span>
                              <span className="stat-label">mi total</span>
                            </div>
                            <div className="depot-stat">
                              <span className="stat-value">{depot.breakdownCount}</span>
                              <span className="stat-label">breakdowns</span>
                            </div>
                          </div>
                          <div className="depot-bar">
                            <div
                              className="depot-bar-fill"
                              style={{
                                width: `${(depot.totalMileage / data.byDepot[0].totalMileage) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MileageDetailsModal;
