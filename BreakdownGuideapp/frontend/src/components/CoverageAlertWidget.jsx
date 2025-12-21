/**
 * CoverageAlertWidget Component
 *
 * Phase 4.4 - Coverage Alert for SDC
 * Real-time widget showing current shift coverage status
 *
 * Features:
 * - Shows which duties are expected to be active
 * - Displays active supervisors
 * - Alerts when coverage gaps exist
 * - Shows next shift change countdown
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api-client';
import './CoverageAlertWidget.css';

const CoverageAlertWidget = ({ variant = 'compact', refreshInterval = 60000 }) => {
  const [coverageData, setCoverageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

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

    // Refresh periodically
    const timer = setInterval(fetchCoverageStatus, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchCoverageStatus, refreshInterval]);

  // Get alert icon based on level
  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'normal': return '✅';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  // Get time display for next shift change
  const getTimeDisplay = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className={`coverage-widget coverage-widget--${variant} loading`}>
        <div className="coverage-widget__spinner"></div>
        <span>Checking coverage...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`coverage-widget coverage-widget--${variant} error`}>
        <span className="coverage-widget__icon">⚠️</span>
        <span>{error}</span>
        <button onClick={fetchCoverageStatus} className="coverage-widget__retry">Retry</button>
      </div>
    );
  }

  if (!coverageData || !coverageData.coverage) {
    return null;
  }

  const { coverage, nextShiftChange } = coverageData;

  // Compact variant - just shows status icon and count
  if (variant === 'compact') {
    return (
      <div
        className={`coverage-widget coverage-widget--compact coverage-widget--${coverage.alertLevel}`}
        onClick={() => setExpanded(!expanded)}
        title={coverage.alertMessage}
      >
        <span className="coverage-widget__icon">{getAlertIcon(coverage.alertLevel)}</span>
        <span className="coverage-widget__label">
          {coverage.coveredDutyCount}/{coverage.totalExpected}
        </span>

        {expanded && (
          <div className="coverage-widget__dropdown" onClick={e => e.stopPropagation()}>
            <div className="coverage-widget__dropdown-header">
              <strong>Shift Coverage</strong>
              <span className={`coverage-widget__status coverage-widget__status--${coverage.alertLevel}`}>
                {coverage.alertLevel.toUpperCase()}
              </span>
            </div>

            <div className="coverage-widget__dropdown-body">
              <p className="coverage-widget__message">{coverage.alertMessage}</p>

              {coverage.expectedDuties.length > 0 && (
                <div className="coverage-widget__duties">
                  <strong>Expected Duties:</strong>
                  {coverage.expectedDuties.map(duty => (
                    <div
                      key={duty.code}
                      className={`coverage-widget__duty ${duty.isCovered ? 'covered' : 'uncovered'}`}
                    >
                      <span
                        className="coverage-widget__duty-badge"
                        style={{ backgroundColor: duty.color }}
                      >
                        {duty.code}
                      </span>
                      <span className="coverage-widget__duty-name">{duty.name}</span>
                      <span className="coverage-widget__duty-time">{duty.timeRange}</span>
                      <span className={`coverage-widget__duty-status ${duty.isCovered ? 'yes' : 'no'}`}>
                        {duty.isCovered ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {coverage.activeSupervisors.length > 0 && (
                <div className="coverage-widget__supervisors">
                  <strong>Active Supervisors:</strong>
                  {coverage.activeSupervisors.slice(0, 5).map(sup => (
                    <div key={sup.badge} className="coverage-widget__supervisor">
                      <span className={`coverage-widget__activity-dot ${sup.isRecent ? 'recent' : ''}`}></span>
                      <span className="coverage-widget__supervisor-name">{sup.name || sup.badge}</span>
                      {sup.duty && (
                        <span className="coverage-widget__supervisor-duty">Duty {sup.duty}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {nextShiftChange && (
                <div className="coverage-widget__next-change">
                  <strong>Next Change:</strong>
                  <span>
                    Duty {nextShiftChange.duty} {nextShiftChange.action} in {getTimeDisplay(nextShiftChange.minutesRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant - detailed card view
  return (
    <div className={`coverage-widget coverage-widget--full coverage-widget--${coverage.alertLevel}`}>
      <div className="coverage-widget__header">
        <div className="coverage-widget__title">
          <span className="coverage-widget__icon">{getAlertIcon(coverage.alertLevel)}</span>
          <span>Shift Coverage</span>
        </div>
        <span className={`coverage-widget__status-badge coverage-widget__status-badge--${coverage.alertLevel}`}>
          {coverage.alertLevel.toUpperCase()}
        </span>
      </div>

      <div className="coverage-widget__content">
        <p className="coverage-widget__alert-message">{coverage.alertMessage}</p>

        {/* Coverage Stats */}
        <div className="coverage-widget__stats">
          <div className="coverage-widget__stat">
            <span className="coverage-widget__stat-value">{coverage.coveredDutyCount}</span>
            <span className="coverage-widget__stat-label">Covered</span>
          </div>
          <div className="coverage-widget__stat">
            <span className="coverage-widget__stat-value">{coverage.uncoveredDutyCount}</span>
            <span className="coverage-widget__stat-label">Uncovered</span>
          </div>
          <div className="coverage-widget__stat">
            <span className="coverage-widget__stat-value">{coverage.activeSupervisors.length}</span>
            <span className="coverage-widget__stat-label">Active</span>
          </div>
        </div>

        {/* Expected Duties */}
        {coverage.expectedDuties.length > 0 && (
          <div className="coverage-widget__section">
            <h4>Current Duties</h4>
            <div className="coverage-widget__duty-grid">
              {coverage.expectedDuties.map(duty => (
                <div
                  key={duty.code}
                  className={`coverage-widget__duty-card ${duty.isCovered ? 'covered' : 'uncovered'}`}
                  style={{ '--duty-color': duty.color }}
                >
                  <div className="coverage-widget__duty-card-header">
                    <span className="coverage-widget__duty-code">{duty.code}</span>
                    <span className={`coverage-widget__coverage-indicator ${duty.isCovered ? '' : 'missing'}`}>
                      {duty.isCovered ? '✓ Covered' : '✗ Gap'}
                    </span>
                  </div>
                  <div className="coverage-widget__duty-card-body">
                    <span className="coverage-widget__duty-name">{duty.name}</span>
                    <span className="coverage-widget__duty-hours">{duty.timeRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Supervisors */}
        {coverage.activeSupervisors.length > 0 && (
          <div className="coverage-widget__section">
            <h4>Active Supervisors</h4>
            <div className="coverage-widget__supervisor-list">
              {coverage.activeSupervisors.map(sup => (
                <div key={sup.badge} className="coverage-widget__supervisor-card">
                  <div className={`coverage-widget__supervisor-status ${sup.isRecent ? 'active' : 'idle'}`}></div>
                  <div className="coverage-widget__supervisor-info">
                    <span className="coverage-widget__supervisor-name">{sup.name || sup.badge}</span>
                    <span className="coverage-widget__supervisor-meta">
                      {sup.duty && `Duty ${sup.duty}`}
                      {sup.depot && ` • ${sup.depot}`}
                    </span>
                  </div>
                  <span className={`coverage-widget__last-active ${sup.isRecent ? '' : 'stale'}`}>
                    {sup.isRecent ? 'Active now' : 'Idle'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Shift Change */}
        {nextShiftChange && (
          <div className="coverage-widget__footer">
            <span className="coverage-widget__next-label">
              Duty {nextShiftChange.duty} {nextShiftChange.action}:
            </span>
            <span className="coverage-widget__countdown">
              {getTimeDisplay(nextShiftChange.minutesRemaining)}
            </span>
          </div>
        )}
      </div>

      <button className="coverage-widget__refresh" onClick={fetchCoverageStatus} title="Refresh">
        🔄
      </button>
    </div>
  );
};

export default CoverageAlertWidget;
