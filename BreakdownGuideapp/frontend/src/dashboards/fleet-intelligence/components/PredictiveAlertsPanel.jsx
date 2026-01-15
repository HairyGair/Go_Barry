/**
 * PredictiveAlertsPanel Component
 *
 * AI-generated maintenance predictions with confidence scores.
 * Features: Risk levels, confidence indicators, actionable recommendations.
 */

import React, { useMemo } from 'react';

// Risk level configurations
const RISK_LEVELS = {
  'high': { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'High Risk' },
  'medium': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', label: 'Medium Risk' },
  'low': { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low Risk' },
  'default': { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', label: 'Unknown' },
};

const AlertCard = ({ alert }) => {
  const riskLevel = alert.risk_level || alert.severity || 'default';
  const riskConfig = RISK_LEVELS[riskLevel.toLowerCase()] || RISK_LEVELS.default;
  const confidence = alert.confidence || alert.confidence_score || 0;

  return (
    <div
      className="alert-card"
      style={{ borderLeftColor: riskConfig.color }}
    >
      <div className="alert-header">
        <span
          className="risk-badge"
          style={{ background: riskConfig.bg, color: riskConfig.color }}
        >
          {riskConfig.label}
        </span>
        <span className="confidence-badge">
          {confidence}% confidence
        </span>
      </div>
      <div className="alert-body">
        <p className="alert-title">
          {alert.title || alert.message || 'Maintenance Alert'}
        </p>
        <p className="alert-description">
          {alert.description || alert.recommendation || 'Review recommended'}
        </p>
        {alert.fleet_number && (
          <span className="alert-vehicle">Fleet {alert.fleet_number}</span>
        )}
      </div>
      <div className="alert-footer">
        <span className="alert-time">
          {alert.predicted_date
            ? `Expected: ${new Date(alert.predicted_date).toLocaleDateString('en-GB')}`
            : 'Monitor closely'}
        </span>
      </div>
    </div>
  );
};

const PredictiveAlertsPanel = ({ alerts = [], loading }) => {
  // Sort alerts by risk level and confidence
  const sortedAlerts = useMemo(() => {
    const riskOrder = { high: 0, medium: 1, low: 2 };

    return [...alerts]
      .sort((a, b) => {
        const riskA = riskOrder[a.risk_level?.toLowerCase()] ?? 3;
        const riskB = riskOrder[b.risk_level?.toLowerCase()] ?? 3;
        if (riskA !== riskB) return riskA - riskB;
        return (b.confidence || 0) - (a.confidence || 0);
      })
      .slice(0, 5);
  }, [alerts]);

  // Count by risk level
  const riskCounts = useMemo(() => {
    return alerts.reduce((acc, alert) => {
      const level = (alert.risk_level || 'unknown').toLowerCase();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
  }, [alerts]);

  if (loading) {
    return (
      <div className="fid-card predictive-alerts-panel">
        <div className="panel-header">
          <h3>🔮 Predictive Alerts</h3>
        </div>
        <div className="alerts-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="alert-card loading">
              <div className="loading-skeleton alert-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card predictive-alerts-panel">
      <div className="panel-header">
        <h3>🔮 Predictive Alerts</h3>
        <div className="risk-summary">
          {riskCounts.high > 0 && (
            <span className="risk-count high">{riskCounts.high} high</span>
          )}
          {riskCounts.medium > 0 && (
            <span className="risk-count medium">{riskCounts.medium} med</span>
          )}
        </div>
      </div>

      <div className="alerts-list">
        {sortedAlerts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔮</span>
            <p>No predictive alerts</p>
            <span className="empty-subtext">AI monitoring active</span>
          </div>
        ) : (
          sortedAlerts.map((alert, index) => (
            <AlertCard key={alert.id || index} alert={alert} />
          ))
        )}
      </div>

      {sortedAlerts.length > 0 && (
        <div className="panel-footer">
          <span className="ai-badge">
            <span className="ai-icon">🤖</span>
            AI-powered predictions
          </span>
        </div>
      )}
    </div>
  );
};

export default PredictiveAlertsPanel;
