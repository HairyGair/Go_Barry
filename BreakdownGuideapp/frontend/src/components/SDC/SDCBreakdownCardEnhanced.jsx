/**
 * SDCBreakdownCardEnhanced Component
 * Clean, functional breakdown card design for Control Room operators
 * No unnecessary animations - focused on clarity and efficiency
 */

import React, { useState, useMemo } from 'react';
import { formatElapsedTime } from '../../utils/sdcDataUtils';

const SDCBreakdownCardEnhanced = ({
  breakdown,
  onAcknowledge,
  onMakeDecision,
  onRequestEngineering,
  onEditAssessment,
  onQuickAction,
  isHighlighted = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Memoized calculations
  const elapsedTime = useMemo(() => {
    return formatElapsedTime(breakdown.createdAt);
  }, [breakdown.createdAt]);

  const statusConfig = useMemo(() => {
    const decision = breakdown.decision || breakdown.severity;
    
    if (decision === 'STOP') {
      return { color: '#dc2626', bgColor: '#fef2f2', icon: '🛑', label: 'STOP' };
    }
    if (decision === 'AMBER' || decision === 'CHANGEOVER') {
      return { color: '#f59e0b', bgColor: '#fffbeb', icon: '⚡', label: 'CHANGEOVER' };
    }
    if (decision === 'CONTINUE') {
      return { color: '#10b981', bgColor: '#f0fdf4', icon: '✅', label: 'CONTINUE' };
    }
    if (breakdown.inAssessment) {
      return { color: '#3b82f6', bgColor: '#eff6ff', icon: '🔄', label: 'IN ASSESSMENT' };
    }
    return { color: '#6b7280', bgColor: '#f9fafb', icon: '⏳', label: 'PENDING' };
  }, [breakdown.decision, breakdown.severity, breakdown.inAssessment]);

  const priorityLevel = useMemo(() => {
    if (breakdown.isCritical) return 'critical';
    if (breakdown.isPriorityRoute) return 'high';
    return 'normal';
  }, [breakdown.isCritical, breakdown.isPriorityRoute]);

  return (
    <div 
      className={`sdc-breakdown-card ${priorityLevel} ${isHighlighted ? 'highlighted' : ''}`}
      data-breakdown-id={breakdown.breakdown_id}
    >
      {/* Header Section */}
      <div className="card-header">
        <div className="header-main">
          <div className="breakdown-identity">
            <span className="breakdown-id">{breakdown.breakdown_id}</span>
            <span className="fleet-badge">Fleet {breakdown.fleet_number}</span>
            {breakdown.route && (
              <span className="route-badge">{breakdown.route}</span>
            )}
          </div>
          <div className="status-indicator" style={{ backgroundColor: statusConfig.bgColor }}>
            <span className="status-icon">{statusConfig.icon}</span>
            <span className="status-label" style={{ color: statusConfig.color }}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        
        <div className="header-meta">
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span className="location-text">{breakdown.location}</span>
          </div>
          <div className="time-info">
            <span className="time-icon">⏱️</span>
            <span className="time-text">{elapsedTime}</span>
          </div>
        </div>
      </div>

      {/* Quick Info Section */}
      <div className="quick-info">
        <div className="info-item">
          <span className="info-label">Issue:</span>
          <span className="info-value">{breakdown.issue_category || 'Not specified'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Supervisor:</span>
          <span className="info-value">
            {breakdown.supervisor_name || 'Unknown'}
            {breakdown.supervisor_badge && ` (${breakdown.supervisor_badge})`}
          </span>
        </div>
      </div>

      {/* Action Section */}
      <div className="action-section">
        {/* Primary Actions */}
        <div className="primary-actions">
          {!breakdown.sdc_acknowledged && (
            <button 
              className="action-btn acknowledge"
              onClick={() => onAcknowledge(breakdown.breakdown_id)}
              title="Acknowledge breakdown"
            >
              <span className="btn-icon">👁️</span>
              <span className="btn-text">Acknowledge</span>
            </button>
          )}
          
          {breakdown.decision && !breakdown.engineer_assigned && (
            <button 
              className="action-btn engineering"
              onClick={() => onRequestEngineering(breakdown.breakdown_id)}
              title="Request engineering support"
            >
              <span className="btn-icon">🔧</span>
              <span className="btn-text">Request Engineer</span>
            </button>
          )}
          
          <button 
            className="action-btn edit"
            onClick={() => onEditAssessment(breakdown.breakdown_id)}
            title="Edit assessment"
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Edit Assessment</span>
          </button>
        </div>

        {/* Quick Actions Toggle */}
        <button 
          className="quick-actions-toggle"
          onClick={() => setShowQuickActions(!showQuickActions)}
          aria-expanded={showQuickActions}
        >
          <span className="toggle-icon">⚡</span>
          <span className="toggle-text">Quick Actions</span>
          <span className="toggle-arrow">{showQuickActions ? '▼' : '▶'}</span>
        </button>
      </div>

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <div className="quick-actions-panel">
          <button 
            className="quick-action"
            onClick={() => onQuickAction('changeover', breakdown.breakdown_id)}
          >
            <span className="qa-icon">🔄</span>
            <span className="qa-text">Mark for Changeover</span>
          </button>
          <button 
            className="quick-action"
            onClick={() => onQuickAction('escalate', breakdown.breakdown_id)}
          >
            <span className="qa-icon">📢</span>
            <span className="qa-text">Escalate to Management</span>
          </button>
          <button 
            className="quick-action"
            onClick={() => onQuickAction('update', breakdown.breakdown_id)}
          >
            <span className="qa-icon">📝</span>
            <span className="qa-text">Add Update Note</span>
          </button>
        </div>
      )}

      {/* Engineering Status */}
      {breakdown.engineer_assigned && (
        <div className="engineering-status">
          <span className="eng-icon">🔧</span>
          <span className="eng-text">
            Engineer {breakdown.engineer_name || breakdown.engineer_assigned} dispatched
          </span>
        </div>
      )}

      {/* Expand/Collapse Toggle */}
      <button 
        className="expand-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="expand-text">{isExpanded ? 'Show Less' : 'Show More'}</span>
        <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="expanded-details">
          {breakdown.wizardResponses && breakdown.wizardResponses.length > 0 && (
            <div className="wizard-responses">
              <h4>Assessment Details</h4>
              {breakdown.wizardResponses.map((response, index) => (
                <div key={index} className="response-item">
                  <span className="response-q">{response.question}:</span>
                  <span className="response-a">{response.answer}</span>
                </div>
              ))}
            </div>
          )}
          
          {breakdown.recommendedActions && breakdown.recommendedActions.length > 0 && (
            <div className="recommended-actions">
              <h4>Recommended Actions</h4>
              {breakdown.recommendedActions.map((action, index) => (
                <div key={index} className={`rec-action priority-${action.priority}`}>
                  <span className="rec-icon">{action.icon}</span>
                  <span className="rec-text">{action.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .sdc-breakdown-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 20px;
          margin-bottom: 16px;
          position: relative;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .sdc-breakdown-card.critical {
          border-color: #dc2626;
          border-width: 2px;
        }

        .sdc-breakdown-card.high {
          border-color: #f59e0b;
        }

        .sdc-breakdown-card.highlighted {
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }

        .sdc-breakdown-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .card-header {
          margin-bottom: 16px;
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .breakdown-identity {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .breakdown-id {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .fleet-badge, .route-badge {
          background: #eff6ff;
          color: #3b82f6;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .route-badge {
          background: #f0f9ff;
          color: #0891b2;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
        }

        .status-icon {
          font-size: 16px;
        }

        .status-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #6b7280;
        }

        .location-info, .time-info {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .quick-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .info-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
        }

        .action-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-bottom: 8px;
        }

        .primary-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.acknowledge {
          background: #eff6ff;
          color: #3b82f6;
        }

        .action-btn.acknowledge:hover {
          background: #dbeafe;
        }

        .action-btn.engineering {
          background: #fef3c7;
          color: #d97706;
        }

        .action-btn.engineering:hover {
          background: #fde68a;
        }

        .action-btn.edit {
          background: #f3f4f6;
          color: #4b5563;
        }

        .action-btn.edit:hover {
          background: #e5e7eb;
        }

        .btn-icon {
          font-size: 14px;
        }

        .quick-actions-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-actions-toggle:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .toggle-arrow {
          font-size: 10px;
          transition: transform 0.2s ease;
        }

        .quick-actions-panel {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          margin-top: 12px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .engineering-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #fef3c7;
          border-radius: 8px;
          margin-top: 12px;
          font-size: 13px;
          color: #92400e;
          font-weight: 500;
        }

        .expand-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px;
          background: transparent;
          border: none;
          border-top: 1px solid #e5e7eb;
          margin-top: 16px;
          margin-left: -20px;
          margin-right: -20px;
          margin-bottom: -20px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .expand-toggle:hover {
          background: #f9fafb;
          color: #374151;
        }

        .expand-arrow {
          font-size: 10px;
          transition: transform 0.2s ease;
        }

        .expanded-details {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .expanded-details h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .wizard-responses {
          margin-bottom: 20px;
        }

        .response-item {
          display: flex;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }

        .response-q {
          color: #6b7280;
          flex: 1;
        }

        .response-a {
          color: #1e293b;
          font-weight: 500;
          flex: 1;
        }

        .recommended-actions {
          margin-top: 16px;
        }

        .rec-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .rec-action.priority-critical {
          background: #fef2f2;
          color: #991b1b;
        }

        .rec-action.priority-high {
          background: #fffbeb;
          color: #92400e;
        }

        .rec-icon {
          font-size: 16px;
        }

        @media (max-width: 768px) {
          .sdc-breakdown-card {
            padding: 16px;
          }

          .header-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-meta {
            flex-direction: column;
            gap: 8px;
          }

          .quick-info {
            grid-template-columns: 1fr;
          }

          .primary-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }

          .quick-actions-panel {
            flex-direction: column;
          }

          .quick-action {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCBreakdownCardEnhanced;