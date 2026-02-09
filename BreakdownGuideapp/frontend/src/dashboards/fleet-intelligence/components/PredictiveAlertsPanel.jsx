/**
 * PredictiveAlertsPanel Component
 *
 * Ocean Teal themed predictive alerts panel with risk-based sorting.
 * Features: Risk levels, confidence scores, AI-powered predictions.
 */

import React, { useMemo } from 'react';

// Risk level configurations
const RISK_LEVELS = {
  high: { label: 'High Risk', order: 0 },
  medium: { label: 'Medium Risk', order: 1 },
  low: { label: 'Low Risk', order: 2 },
};

// Inline SVG Icons
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M8 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 3v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M2 5h10M5 10v1.5M9 10v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="4.5" cy="7.5" r="0.75" fill="currentColor"/>
    <circle cx="9.5" cy="7.5" r="0.75" fill="currentColor"/>
  </svg>
);

const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 1 0 3 1.5 1.5 0 0 0-1.5 1.5v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1A1.5 1.5 0 0 0 3.5 9a1.5 1.5 0 0 1 0-3A1.5 1.5 0 0 0 5 4.5v-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 6v1M9 6v1M7 9.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M4.5 7l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AlertCard = ({ alert }) => {
  const riskLevel = (alert.risk_level || alert.severity || 'low').toLowerCase();
  const riskConfig = RISK_LEVELS[riskLevel] || RISK_LEVELS.low;
  const confidence = alert.confidence || alert.confidence_score || 0;

  const alertClass = `fi__alert fi__alert--${riskLevel}`;
  const badgeClass = `fi__risk-badge fi__risk-badge--${riskLevel}`;

  return (
    <div className={alertClass}>
      <div className="fi__alert-top">
        <span className={badgeClass}>
          <WarningIcon />
          {riskConfig.label}
        </span>
        <span className="fi__confidence">
          <CheckCircleIcon />
          {confidence}%
        </span>
      </div>

      <h4 className="fi__alert-title">
        {alert.title || alert.message || 'Maintenance Alert'}
      </h4>

      <p className="fi__alert-desc">
        {alert.description || alert.recommendation || 'Review recommended'}
      </p>

      <div className="fi__alert-bottom">
        {alert.fleet_number && (
          <span className="fi__alert-fleet">
            <BusIcon />
            Fleet {alert.fleet_number}
          </span>
        )}
        <span className="fi__alert-time">
          <ClockIcon />
          {alert.predicted_date
            ? new Date(alert.predicted_date).toLocaleDateString('en-GB')
            : 'Monitor'}
        </span>
      </div>
    </div>
  );
};

const PredictiveAlertsPanel = ({ alerts = [], loading }) => {
  // Sort alerts by risk level (high first) then confidence
  const sortedAlerts = useMemo(() => {
    return [...alerts]
      .sort((a, b) => {
        const riskA = RISK_LEVELS[a.risk_level?.toLowerCase()]?.order ?? 3;
        const riskB = RISK_LEVELS[b.risk_level?.toLowerCase()]?.order ?? 3;
        if (riskA !== riskB) return riskA - riskB;
        return (b.confidence || 0) - (a.confidence || 0);
      })
      .slice(0, 5);
  }, [alerts]);

  // Count by risk level
  const riskCounts = useMemo(() => {
    return alerts.reduce((acc, alert) => {
      const level = (alert.risk_level || 'low').toLowerCase();
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
  }, [alerts]);

  if (loading) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">Predictive Alerts</h3>
        </div>
        <div className="fi__alerts">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="fi__skeleton" style={{ height: '120px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fi__card">
      <div className="fi__card-header">
        <h3 className="fi__card-title">Predictive Alerts</h3>
        {(riskCounts.high > 0 || riskCounts.medium > 0) && (
          <div className="fi__risk-summary">
            {riskCounts.high > 0 && (
              <span className="fi__risk-count fi__risk-count--high">
                {riskCounts.high} high
              </span>
            )}
            {riskCounts.medium > 0 && (
              <span className="fi__risk-count fi__risk-count--medium">
                {riskCounts.medium} med
              </span>
            )}
          </div>
        )}
      </div>

      <div className="fi__alerts">
        {sortedAlerts.length === 0 ? (
          <div className="fi__empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2"/>
              <path d="M15 18a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v3a4.5 4.5 0 0 0 4.5 4.5 4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0-4.5 4.5v3a6 6 0 0 1-6 6h-6a6 6 0 0 1-6-6v-3a4.5 4.5 0 0 0-4.5-4.5 4.5 4.5 0 0 1 0-9A4.5 4.5 0 0 0 15 21v-3z" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
            </svg>
            <p>No predictive alerts</p>
            <span>AI monitoring active</span>
          </div>
        ) : (
          sortedAlerts.map((alert, index) => (
            <AlertCard key={alert.id || index} alert={alert} />
          ))
        )}
      </div>

      {sortedAlerts.length > 0 && (
        <div className="fi__panel-footer">
          <span className="fi__ai-badge">
            <BrainIcon />
            AI-powered predictions
          </span>
        </div>
      )}
    </div>
  );
};

export default PredictiveAlertsPanel;
