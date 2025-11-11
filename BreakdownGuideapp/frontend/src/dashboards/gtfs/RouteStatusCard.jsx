/**
 * Route Status Card Component
 * Displays individual route status with breakdown details
 */

import React, { useState } from 'react';
import './RouteStatusCard.css';

const RouteStatusCard = ({ route, onDetailsClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine status color and icon
  const getStatusStyles = (status) => {
    switch (status) {
      case 'GREEN':
        return {
          bgColor: '#10B981',
          textColor: '#FFFFFF',
          icon: '✓',
          label: 'Operational'
        };
      case 'AMBER':
        return {
          bgColor: '#F59E0B',
          textColor: '#FFFFFF',
          icon: '!',
          label: '1 Breakdown'
        };
      case 'RED':
        return {
          bgColor: '#EF4444',
          textColor: '#FFFFFF',
          icon: '⚠',
          label: 'Multiple Issues'
        };
      default:
        return {
          bgColor: '#6B7280',
          textColor: '#FFFFFF',
          icon: '?',
          label: 'Unknown'
        };
    }
  };

  const statusStyle = getStatusStyles(route.status);

  return (
    <div className="route-status-card">
      {/* Header with Status Badge */}
      <div className="card-header" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Route Number and Name */}
        <div className="route-info">
          <div className="route-number">
            {route.routeShortName}
          </div>
          <div className="route-name">
            {route.routeLongName}
          </div>
        </div>

        {/* Status Badge */}
        <div className="status-badge" style={{ backgroundColor: statusStyle.bgColor }}>
          <span className="status-icon">{statusStyle.icon}</span>
          <span className="status-label">{statusStyle.label}</span>
        </div>

        {/* Expand Icon */}
        <div className="expand-icon" style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▼
        </div>
      </div>

      {/* Breakdown Count and Severity */}
      <div className="card-stats">
        <div className="stat">
          <span className="stat-label">Active Breakdowns:</span>
          <span className="stat-value">{route.breakdownCount}</span>
        </div>

        {route.breakdownSeverities && route.breakdownSeverities.length > 0 && (
          <div className="stat">
            <span className="stat-label">Severity:</span>
            <div className="severity-badges">
              {route.breakdownSeverities.map((severity, idx) => (
                <span
                  key={idx}
                  className="severity-badge"
                  style={{
                    backgroundColor: severity === 'CRITICAL' ? '#DC2626' :
                                    severity === 'HIGH' ? '#EA580C' :
                                    severity === 'MEDIUM' ? '#F59E0B' :
                                    '#84CC16'
                  }}
                >
                  {severity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Last Breakdown Time */}
      {route.lastBreakdownTime && (
        <div className="card-timestamp">
          Last breakdown: {new Date(route.lastBreakdownTime).toLocaleTimeString()}
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="card-details">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Route ID:</span>
              <span className="detail-value">{route.routeId}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value" style={{ color: statusStyle.bgColor }}>
                {route.status}
              </span>
            </div>

            {route.lastBreakdownTime && (
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {new Date(route.lastBreakdownTime).toLocaleString()}
                </span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Active Issues:</span>
              <span className="detail-value">{route.breakdownCount}</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            className="details-button"
            onClick={() => onDetailsClick && onDetailsClick(route)}
          >
            View Breakdown Details →
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteStatusCard;
