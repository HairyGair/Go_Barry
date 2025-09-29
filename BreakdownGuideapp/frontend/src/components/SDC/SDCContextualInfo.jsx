/**
 * SDCContextualInfo Component
 * Displays contextual information relevant to Control Room operators
 * Clean, information-dense design without unnecessary visual elements
 */

import React, { useState, useMemo } from 'react';

const SDCContextualInfo = ({ 
  breakdown,
  showFleetInfo = true,
  showRouteInfo = true,
  showTimelineInfo = true,
  showActionableItems = true,
  compactMode = false
}) => {
  const [expandedSection, setExpandedSection] = useState(null);

  // Calculate contextual data
  const contextualData = useMemo(() => {
    if (!breakdown) return {};

    const now = new Date();
    const createdAt = new Date(breakdown.createdAt);
    const ageMinutes = Math.floor((now - createdAt) / 60000);

    return {
      age: {
        minutes: ageMinutes,
        display: ageMinutes < 60 ? `${ageMinutes}m` : `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m`
      },
      urgency: ageMinutes > 30 ? 'high' : ageMinutes > 15 ? 'medium' : 'normal',
      isStale: ageMinutes > 60,
      needsAttention: !breakdown.sdc_acknowledged && ageMinutes > 10,
      routeImpact: breakdown.isPriorityRoute ? 'high' : 'normal',
      passengerImpact: breakdown.isPriorityRoute ? 'Potentially affects multiple services' : 'Limited service impact'
    };
  }, [breakdown]);

  if (!breakdown) {
    return <div className="no-breakdown-info">No breakdown information available</div>;
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (compactMode) {
    return (
      <div className="contextual-info compact">
        <div className="compact-items">
          <div className="compact-item">
            <span className="compact-label">Age:</span>
            <span className={`compact-value urgency-${contextualData.urgency}`}>
              {contextualData.age.display}
            </span>
          </div>
          
          {breakdown.isPriorityRoute && (
            <div className="compact-item priority">
              <span className="compact-icon">⭐</span>
              <span className="compact-value">Priority Route</span>
            </div>
          )}
          
          {contextualData.needsAttention && (
            <div className="compact-item attention">
              <span className="compact-icon">⚠️</span>
              <span className="compact-value">Needs Attention</span>
            </div>
          )}
        </div>

        <style jsx>{`
          .contextual-info.compact {
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 3px solid #e5e7eb;
          }

          .contextual-info.compact.urgency-high {
            border-left-color: #dc2626;
            background: #fef2f2;
          }

          .contextual-info.compact.urgency-medium {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }

          .compact-items {
            display: flex;
            gap: 16px;
            align-items: center;
            flex-wrap: wrap;
          }

          .compact-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
          }

          .compact-label {
            color: #6b7280;
            font-weight: 500;
          }

          .compact-value {
            color: #374151;
            font-weight: 600;
          }

          .compact-value.urgency-high {
            color: #dc2626;
          }

          .compact-value.urgency-medium {
            color: #d97706;
          }

          .compact-icon {
            font-size: 14px;
          }

          .compact-item.priority .compact-value {
            color: #059669;
          }

          .compact-item.attention .compact-value {
            color: #dc2626;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="contextual-info">
      {/* Fleet Information */}
      {showFleetInfo && (
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('fleet')}
          >
            <span className="section-title">🚌 Fleet Information</span>
            <span className="section-toggle">{expandedSection === 'fleet' ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection === 'fleet' && (
            <div className="section-content">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Fleet Number:</span>
                  <span className="info-value">{breakdown.fleet_number}</span>
                </div>
                {breakdown.route && (
                  <div className="info-item">
                    <span className="info-label">Route:</span>
                    <span className={`info-value ${breakdown.isPriorityRoute ? 'priority' : ''}`}>
                      {breakdown.route}
                      {breakdown.isPriorityRoute && <span className="priority-indicator">⭐</span>}
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Location:</span>
                  <span className="info-value">{breakdown.location}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route Impact Information */}
      {showRouteInfo && breakdown.route && (
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('route')}
          >
            <span className="section-title">🗺️ Route Impact</span>
            <span className="section-toggle">{expandedSection === 'route' ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection === 'route' && (
            <div className="section-content">
              <div className="impact-assessment">
                <div className={`impact-level ${contextualData.routeImpact}`}>
                  {contextualData.routeImpact === 'high' ? 'High Impact Route' : 'Standard Route'}
                </div>
                <div className="impact-description">
                  {contextualData.passengerImpact}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline Information */}
      {showTimelineInfo && (
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('timeline')}
          >
            <span className="section-title">⏰ Timeline</span>
            <span className="section-toggle">{expandedSection === 'timeline' ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection === 'timeline' && (
            <div className="section-content">
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Reported:</span>
                  <span className="timeline-value">
                    {new Date(breakdown.createdAt).toLocaleTimeString('en-GB')} 
                    <span className={`age-indicator urgency-${contextualData.urgency}`}>
                      ({contextualData.age.display} ago)
                    </span>
                  </span>
                </div>
                
                {breakdown.acknowledgedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Acknowledged:</span>
                    <span className="timeline-value">
                      {new Date(breakdown.acknowledgedAt).toLocaleTimeString('en-GB')}
                    </span>
                  </div>
                )}
                
                {breakdown.completedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Completed:</span>
                    <span className="timeline-value">
                      {new Date(breakdown.completedAt).toLocaleTimeString('en-GB')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actionable Items */}
      {showActionableItems && (
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('actions')}
          >
            <span className="section-title">⚡ Required Actions</span>
            <span className="section-toggle">{expandedSection === 'actions' ? '▼' : '▶'}</span>
          </button>
          
          {expandedSection === 'actions' && (
            <div className="section-content">
              <div className="action-items">
                {contextualData.needsAttention && (
                  <div className="action-item urgent">
                    <span className="action-icon">⚠️</span>
                    <span className="action-text">Requires immediate acknowledgment</span>
                  </div>
                )}
                
                {breakdown.decision === 'STOP' && !breakdown.engineer_assigned && (
                  <div className="action-item critical">
                    <span className="action-icon">🔧</span>
                    <span className="action-text">Engineering support required</span>
                  </div>
                )}
                
                {breakdown.decision === 'AMBER' && (
                  <div className="action-item warning">
                    <span className="action-icon">🔄</span>
                    <span className="action-text">Arrange vehicle changeover</span>
                  </div>
                )}
                
                {contextualData.isStale && (
                  <div className="action-item info">
                    <span className="action-icon">📞</span>
                    <span className="action-text">Follow up required - breakdown over 1 hour old</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .contextual-info {
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .info-section {
          border-bottom: 1px solid #e5e7eb;
        }

        .info-section:last-child {
          border-bottom: none;
        }

        .section-header {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .section-header:hover {
          background: #f9fafb;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .section-toggle {
          font-size: 10px;
          color: #6b7280;
          transition: transform 0.2s ease;
        }

        .section-content {
          padding: 0 16px 16px 16px;
          background: #f9fafb;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          font-size: 13px;
        }

        .info-label {
          color: #6b7280;
          font-weight: 500;
        }

        .info-value {
          color: #374151;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .info-value.priority {
          color: #059669;
        }

        .priority-indicator {
          font-size: 12px;
        }

        .impact-assessment {
          text-align: center;
          padding: 12px;
        }

        .impact-level {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .impact-level.high {
          background: #fef2f2;
          color: #991b1b;
        }

        .impact-level.normal {
          background: #f0fdf4;
          color: #166534;
        }

        .impact-description {
          font-size: 12px;
          color: #6b7280;
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .timeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .timeline-label {
          color: #6b7280;
          font-weight: 500;
        }

        .timeline-value {
          color: #374151;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .age-indicator {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .age-indicator.urgency-normal {
          background: #f0fdf4;
          color: #166534;
        }

        .age-indicator.urgency-medium {
          background: #fffbeb;
          color: #92400e;
        }

        .age-indicator.urgency-high {
          background: #fef2f2;
          color: #991b1b;
        }

        .action-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
        }

        .action-item.urgent {
          background: #fef2f2;
          color: #991b1b;
        }

        .action-item.critical {
          background: #fef2f2;
          color: #991b1b;
        }

        .action-item.warning {
          background: #fffbeb;
          color: #92400e;
        }

        .action-item.info {
          background: #eff6ff;
          color: #1e40af;
        }

        .action-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .action-text {
          font-weight: 500;
        }

        .no-breakdown-info {
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .section-header {
            padding: 10px 12px;
          }

          .section-content {
            padding: 0 12px 12px 12px;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .timeline-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCContextualInfo;