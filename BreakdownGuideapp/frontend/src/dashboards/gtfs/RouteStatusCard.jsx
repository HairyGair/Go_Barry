/**
 * Route Status Card Component
 * Individual route status display with expandable breakdown details
 * Version: 4.0.0 - Ocean Teal Dark Theme
 */

import React, { useState } from 'react';
import './RouteStatusCard.css';

const RouteStatusCard = ({ route, onDetailsClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    GREEN: { className: 'rsc--green', label: 'Operational', icon: '\u2713' },
    AMBER: { className: 'rsc--amber', label: '1 Breakdown', icon: '!' },
    RED:   { className: 'rsc--red', label: 'Multiple Issues', icon: '\u26A0' }
  };

  const config = statusConfig[route.status] || { className: '', label: 'Unknown', icon: '?' };

  return (
    <div className={`rsc ${config.className} ${isExpanded ? 'rsc--expanded' : ''}`}>
      {/* Main Row */}
      <div className="rsc__main" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Route Number */}
        <span className="rsc__number">{route.routeShortName}</span>

        {/* Route Name */}
        <span className="rsc__name">{route.routeLongName}</span>

        {/* Breakdown Count */}
        {route.breakdownCount > 0 && (
          <span className="rsc__bd-count">
            {route.breakdownCount} breakdown{route.breakdownCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Severity Badges */}
        {route.breakdownSeverities?.length > 0 && (
          <div className="rsc__severities">
            {route.breakdownSeverities.map((sev, idx) => (
              <span key={idx} className={`rsc__sev rsc__sev--${sev.toLowerCase()}`}>
                {sev}
              </span>
            ))}
          </div>
        )}

        {/* Status Badge */}
        <span className={`rsc__status rsc__status--${route.status.toLowerCase()}`}>
          <span className="rsc__status-icon">{config.icon}</span>
          {config.label}
        </span>

        {/* Chevron */}
        <svg
          className={`rsc__chevron ${isExpanded ? 'open' : ''}`}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="rsc__details">
          <div className="rsc__detail-grid">
            <div className="rsc__detail">
              <span className="rsc__detail-label">Route ID</span>
              <span className="rsc__detail-value">{route.routeId}</span>
            </div>
            <div className="rsc__detail">
              <span className="rsc__detail-label">Status</span>
              <span className={`rsc__detail-value rsc__detail-value--${route.status.toLowerCase()}`}>
                {route.status}
              </span>
            </div>
            {route.lastBreakdownTime && (
              <div className="rsc__detail">
                <span className="rsc__detail-label">Last Incident</span>
                <span className="rsc__detail-value">
                  {new Date(route.lastBreakdownTime).toLocaleString()}
                </span>
              </div>
            )}
            <div className="rsc__detail">
              <span className="rsc__detail-label">Active Issues</span>
              <span className="rsc__detail-value">{route.breakdownCount}</span>
            </div>
          </div>

          {/* View Details Button */}
          {route.breakdownCount > 0 && (
            <button
              className="rsc__view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDetailsClick && onDetailsClick(route);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View in Control Room
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteStatusCard;
