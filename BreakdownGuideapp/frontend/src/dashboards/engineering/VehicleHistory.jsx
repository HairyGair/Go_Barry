/**
 * Vehicle History Component
 * Displays breakdown history and recurring issues for a fleet vehicle
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';

const VehicleHistory = ({ fleetNo, compact = false }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fleetNo) {
      fetchHistory();
    }
  }, [fleetNo]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/engineering/vehicle-history/${fleetNo}?limit=5`);
      if (response.success) {
        setHistory(response.history);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      console.error('Error fetching vehicle history:', err);
      setError('Error loading history');
    } finally {
      setLoading(false);
    }
  };

  if (!fleetNo) {
    return null;
  }

  if (loading) {
    return (
      <div className="vehicle-history loading">
        <div className="loading-spinner">Loading history...</div>
        <style>{`
          .vehicle-history.loading {
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          .loading-spinner {
            color: #999;
            font-size: 12px;
          }
        `}</style>
      </div>
    );
  }

  if (error || !history) {
    return null;
  }

  const { statistics, recurringIssues, breakdowns } = history;
  const hasPreviousBreakdowns = breakdowns && breakdowns.length > 0;

  if (!hasPreviousBreakdowns) {
    return (
      <div className="vehicle-history no-history">
        <div className="history-header">
          <span className="history-icon">📋</span>
          <span className="history-title">Vehicle History</span>
        </div>
        <div className="no-history-message">✓ No previous breakdowns</div>
        <style>{`
          .vehicle-history.no-history {
            padding: 12px 16px;
            background: rgba(16, 185, 129, 0.1);
            border-top: 1px solid rgba(16, 185, 129, 0.2);
            border-left: 3px solid #10b981;
          }
          .history-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }
          .history-icon {
            font-size: 14px;
          }
          .history-title {
            color: #10b981;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .no-history-message {
            color: #10b981;
            font-size: 13px;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`vehicle-history ${statistics.isProblemVehicle ? 'problem-vehicle' : ''}`}>
      <div className="history-header">
        <div className="header-left">
          <span className="history-icon">
            {statistics.isProblemVehicle ? '⚠️' : '📋'}
          </span>
          <span className="history-title">Vehicle History - Fleet {fleetNo}</span>
        </div>
        {compact && (
          <button
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* Statistics Summary */}
      <div className="history-stats">
        {statistics.isProblemVehicle && (
          <div className="problem-flag">
            ⚠️ PROBLEM VEHICLE: {statistics.last90Days} breakdowns in 90 days
          </div>
        )}
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Last 30 days:</span>
            <span className="stat-value">{statistics.last30Days}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last 90 days:</span>
            <span className="stat-value">{statistics.last90Days}</span>
          </div>
          {statistics.avgResolutionMinutes > 0 && (
            <div className="stat-item">
              <span className="stat-label">Avg fix time:</span>
              <span className="stat-value">{statistics.avgResolutionMinutes} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Recurring Issues */}
      {recurringIssues && recurringIssues.length > 0 && (
        <div className="recurring-issues">
          <div className="section-title">🔁 Recurring Issues</div>
          <div className="issue-tags">
            {recurringIssues.map((item, idx) => (
              <span key={idx} className="issue-tag">
                {item.issue} ({item.count}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown History Timeline */}
      {expanded && breakdowns && breakdowns.length > 0 && (
        <div className="history-timeline">
          <div className="section-title">Recent Breakdowns</div>
          <div className="timeline">
            {breakdowns.slice(0, 5).map((breakdown, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">
                    {formatRelativeDate(breakdown.created_at)}
                  </div>
                  <div className="timeline-issue">
                    {breakdown.issue_category || 'General Issue'}
                  </div>
                  <div className="timeline-details">
                    <span className={`severity ${(breakdown.severity || '').toLowerCase()}`}>
                      {breakdown.severity || 'Unknown'}
                    </span>
                    {breakdown.status === 'cleared' || breakdown.status === 'resolved' ? (
                      <span className="status resolved">✓ Resolved</span>
                    ) : (
                      <span className="status pending">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .vehicle-history {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 3px solid rgba(100, 181, 246, 0.5);
        }

        .vehicle-history.problem-vehicle {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .history-icon {
          font-size: 14px;
        }

        .history-title {
          color: #64b5f6;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .problem-vehicle .history-title {
          color: #f59e0b;
        }

        .expand-btn {
          background: transparent;
          border: none;
          color: #64b5f6;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 12px;
        }

        .expand-btn:hover {
          color: #90caf9;
        }

        .history-stats {
          margin-bottom: 12px;
        }

        .problem-flag {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 6px;
          padding: 8px 12px;
          color: #f59e0b;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 10px;
          text-align: center;
        }

        .stat-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-label {
          color: #999;
          font-size: 11px;
        }

        .stat-value {
          color: white;
          font-size: 13px;
          font-weight: 600;
        }

        .recurring-issues {
          margin-bottom: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-title {
          color: #999;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .issue-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .issue-tag {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 4px;
          padding: 4px 8px;
          color: #ef4444;
          font-size: 11px;
          font-weight: 600;
        }

        .history-timeline {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }

        .timeline-item {
          display: flex;
          gap: 12px;
          position: relative;
        }

        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 20px;
          bottom: -8px;
          width: 1px;
          background: rgba(255, 255, 255, 0.1);
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          background: #64b5f6;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .timeline-content {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 10px;
          border-radius: 6px;
        }

        .timeline-date {
          color: #999;
          font-size: 10px;
          margin-bottom: 4px;
        }

        .timeline-issue {
          color: white;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .timeline-details {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .severity {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity.stop {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .severity.amber {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .severity.continue {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .status {
          font-size: 10px;
          font-weight: 600;
        }

        .status.resolved {
          color: #10b981;
        }

        .status.pending {
          color: #999;
        }
      `}</style>
    </div>
  );
};

// Helper function to format relative date
function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}

export default VehicleHistory;
