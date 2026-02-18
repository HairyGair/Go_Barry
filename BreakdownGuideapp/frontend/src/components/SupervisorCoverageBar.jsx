/**
 * SupervisorCoverageBar Component
 *
 * Horizontal stats bar showing supervisor coverage status
 * Displays active supervisors with their breakdown counts and response times
 * Uses the operator brand colors
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import './SupervisorCoverageBar.css';

const SupervisorCoverageBar = ({ refreshInterval = 60000 }) => {
  const [coverageData, setCoverageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCoverageStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/analytics/coverage-alert');

      if (response.success) {
        setCoverageData(response);
        setError(null);
      } else {
        setError(response.error || 'Failed to load coverage data');
      }
    } catch (err) {
      console.error('Error fetching coverage status:', err);
      setError('Unable to check coverage status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoverageStatus();
    const timer = setInterval(fetchCoverageStatus, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchCoverageStatus, refreshInterval]);

  // Format response time
  const formatResponseTime = (minutes) => {
    if (!minutes) return '--';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="supervisor-coverage-bar loading">
        <div className="coverage-bar__spinner"></div>
        <span>Loading coverage...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="supervisor-coverage-bar error">
        <span className="coverage-bar__icon">⚠️</span>
        <span>{error}</span>
        <button onClick={fetchCoverageStatus} className="coverage-bar__retry">Retry</button>
      </div>
    );
  }

  if (!coverageData || !coverageData.coverage) {
    return null;
  }

  const { coverage, nextShiftChange } = coverageData;

  return (
    <div className={`supervisor-coverage-bar supervisor-coverage-bar--${coverage.alertLevel}`}>
      {/* Header Label */}
      <div className="coverage-bar__header">
        <span className="coverage-bar__title">SUPERVISOR COVERAGE</span>
      </div>

      {/* Coverage Status */}
      <div className="coverage-bar__status">
        <div className={`coverage-bar__status-indicator coverage-bar__status-indicator--${coverage.alertLevel}`}>
          <span className="coverage-bar__status-dot"></span>
          <span className="coverage-bar__status-text">
            {coverage.alertLevel === 'normal' ? 'COVERED' :
             coverage.alertLevel === 'warning' ? 'PARTIAL' :
             coverage.alertLevel === 'critical' ? 'GAP' : 'INFO'}
          </span>
        </div>
      </div>

      {/* Duty Coverage Pills */}
      <div className="coverage-bar__duties">
        <span className="coverage-bar__duties-label">Duties:</span>
        <div className="coverage-bar__duty-pills">
          {coverage.expectedDuties.map(duty => (
            <span
              key={duty.code}
              className={`coverage-bar__duty-pill ${duty.isCovered ? 'covered' : 'uncovered'}`}
              style={{ '--duty-color': duty.color }}
            >
              Duty {duty.code}
            </span>
          ))}
        </div>
      </div>

      {/* Active Supervisors */}
      <div className="coverage-bar__supervisors">
        {coverage.activeSupervisors.length === 0 ? (
          <div className="coverage-bar__no-supervisors">
            No active supervisors
          </div>
        ) : (
          coverage.activeSupervisors.slice(0, 6).map(sup => (
            <div key={sup.badge} className="coverage-bar__supervisor">
              <div className="coverage-bar__supervisor-header">
                <span className={`coverage-bar__activity-dot ${sup.isRecent ? 'active' : 'idle'}`}></span>
                <span className="coverage-bar__supervisor-name">
                  {sup.name ? sup.name.split(' ')[0] : sup.badge}
                </span>
                {sup.duty && (
                  <span className="coverage-bar__supervisor-duty">{sup.duty}</span>
                )}
              </div>
              <div className="coverage-bar__supervisor-stats">
                <span className="coverage-bar__stat" title="Active breakdowns">
                  <span className="coverage-bar__stat-icon">🚌</span>
                  <span className={`coverage-bar__stat-value ${sup.activeBreakdowns > 2 ? 'high' : ''}`}>
                    {sup.activeBreakdowns}
                  </span>
                </span>
                <span className="coverage-bar__stat" title="Resolved today">
                  <span className="coverage-bar__stat-icon">✓</span>
                  <span className="coverage-bar__stat-value">{sup.todayResolved}</span>
                </span>
                <span className="coverage-bar__stat" title="Avg response time">
                  <span className="coverage-bar__stat-icon">⏱</span>
                  <span className={`coverage-bar__stat-value ${sup.avgResponseTime > 30 ? 'slow' : ''}`}>
                    {formatResponseTime(sup.avgResponseTime)}
                  </span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Next Shift Change */}
      {nextShiftChange && (
        <div className="coverage-bar__next-change">
          <span className="coverage-bar__next-label">
            Duty {nextShiftChange.duty} {nextShiftChange.action}
          </span>
          <span className="coverage-bar__next-time">
            {nextShiftChange.minutesRemaining < 60
              ? `${nextShiftChange.minutesRemaining}m`
              : `${Math.floor(nextShiftChange.minutesRemaining / 60)}h ${nextShiftChange.minutesRemaining % 60}m`}
          </span>
        </div>
      )}

      {/* Refresh Button */}
      <button
        className="coverage-bar__refresh"
        onClick={fetchCoverageStatus}
        title="Refresh coverage data"
      >
        🔄
      </button>
    </div>
  );
};

export default SupervisorCoverageBar;
