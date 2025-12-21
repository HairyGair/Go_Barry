/**
 * SupervisorHistoryModal Component
 * Displays full history of a supervisor's activities, breakdowns, and actions
 */

import React, { useState, useEffect } from 'react';
import './SupervisorHistoryModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

const SupervisorHistoryModal = ({ supervisorId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('activities');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    if (supervisorId) {
      fetchHistory();
    }
  }, [supervisorId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });

      // Add date filter
      if (dateFilter === '7days') {
        params.append('dateFrom', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (dateFilter === '30days') {
        params.append('dateFrom', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }

      const response = await fetch(`${API_URL}/api/auth/supervisors/${supervisorId}/history?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supervisor history');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const getActivityIcon = (type) => {
    const icons = {
      'login': '🔐',
      'logout': '🚪',
      'breakdown_created': '🚨',
      'breakdown_updated': '📝',
      'breakdown_resolved': '✅',
      'duty_started': '⏰',
      'duty_ended': '🏁',
      'note_added': '📋',
      'default': '📌'
    };
    return icons[type] || icons.default;
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'stop':
        return 'severity-critical';
      case 'high':
      case 'amber':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      default:
        return 'severity-low';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!supervisorId) return null;

  return (
    <div className="supervisor-history-modal__backdrop" onClick={handleBackdropClick}>
      <div className="supervisor-history-modal">
        {/* Header */}
        <div className="supervisor-history-modal__header">
          <div className="supervisor-history-modal__header-content">
            {data?.supervisor ? (
              <>
                <div className="supervisor-history-modal__avatar">
                  {data.supervisor.name?.charAt(0) || '?'}
                </div>
                <div className="supervisor-history-modal__info">
                  <h2>{data.supervisor.name}</h2>
                  <div className="supervisor-history-modal__meta">
                    <span className="badge">{data.supervisor.badge_number}</span>
                    <span className="role">{data.supervisor.role}</span>
                    <span className="depot">{data.supervisor.depot}</span>
                  </div>
                </div>
              </>
            ) : (
              <h2>Supervisor History</h2>
            )}
          </div>
          <button className="supervisor-history-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Stats Bar */}
        {data?.stats && (
          <div className="supervisor-history-modal__stats">
            <div className="stat-item">
              <span className="stat-value">{data.stats.total_activities || 0}</span>
              <span className="stat-label">Activities</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.stats.total_breakdowns || 0}</span>
              <span className="stat-label">Breakdowns</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.stats.total_notes || 0}</span>
              <span className="stat-label">Notes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{data.stats.total_logins || 0}</span>
              <span className="stat-label">Logins</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="supervisor-history-modal__tabs">
          <button
            className={`tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Activities ({data?.activities?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'breakdowns' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdowns')}
          >
            Breakdowns ({data?.breakdowns?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'logins' ? 'active' : ''}`}
            onClick={() => setActiveTab('logins')}
          >
            Logins ({data?.loginHistory?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes ({data?.dutyNotes?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Log ({data?.auditEntries?.length || 0})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="supervisor-history-modal__filters">
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setTimeout(fetchHistory, 100);
            }}
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>

        {/* Content */}
        <div className="supervisor-history-modal__content">
          {loading ? (
            <div className="supervisor-history-modal__loading">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          ) : error ? (
            <div className="supervisor-history-modal__error">
              <span>⚠️</span>
              <p>{error}</p>
              <button onClick={fetchHistory}>Retry</button>
            </div>
          ) : (
            <>
              {/* Activities Tab */}
              {activeTab === 'activities' && (
                <div className="history-list">
                  {data?.activities?.length === 0 ? (
                    <div className="empty-state">No activities found</div>
                  ) : (
                    data?.activities?.map((activity, idx) => (
                      <div key={activity.id || idx} className="history-item activity-item">
                        <div className="item-icon">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="item-content">
                          <div className="item-action">{activity.action || activity.message}</div>
                          <div className="item-details">
                            {activity.entity_type && (
                              <span className="detail-badge">{activity.entity_type}</span>
                            )}
                            {activity.entity_id && (
                              <span className="detail-id">{activity.entity_id}</span>
                            )}
                          </div>
                        </div>
                        <div className="item-time">{formatTimeAgo(activity.created_at || activity.timestamp)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Breakdowns Tab */}
              {activeTab === 'breakdowns' && (
                <div className="history-list">
                  {data?.breakdowns?.length === 0 ? (
                    <div className="empty-state">No breakdowns logged</div>
                  ) : (
                    data?.breakdowns?.map((breakdown, idx) => (
                      <div key={breakdown.id || idx} className="history-item breakdown-item">
                        <div className={`item-severity ${getSeverityClass(breakdown.severity)}`}>
                          {breakdown.severity || 'N/A'}
                        </div>
                        <div className="item-content">
                          <div className="item-title">
                            <span className="fleet-no">{breakdown.fleet_no}</span>
                            <span className="breakdown-id">{breakdown.breakdown_id}</span>
                          </div>
                          <div className="item-location">{breakdown.location_description}</div>
                          <div className="item-issue">{breakdown.issue_category}</div>
                        </div>
                        <div className="item-status">
                          <span className={`status-badge status-${breakdown.status}`}>
                            {breakdown.status}
                          </span>
                          <span className="item-time">{formatTimeAgo(breakdown.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Logins Tab */}
              {activeTab === 'logins' && (
                <div className="history-list">
                  {data?.loginHistory?.length === 0 ? (
                    <div className="empty-state">No login history</div>
                  ) : (
                    data?.loginHistory?.map((login, idx) => (
                      <div key={login.id || idx} className="history-item login-item">
                        <div className="item-icon">
                          {login.action?.includes('logout') ? '🚪' : '🔐'}
                        </div>
                        <div className="item-content">
                          <div className="item-action">{login.action}</div>
                          {login.ip_address && (
                            <div className="item-ip">IP: {login.ip_address}</div>
                          )}
                        </div>
                        <div className="item-time">{formatDate(login.created_at || login.timestamp)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="history-list">
                  {data?.dutyNotes?.length === 0 ? (
                    <div className="empty-state">No duty notes</div>
                  ) : (
                    data?.dutyNotes?.map((note, idx) => (
                      <div key={note.id || idx} className={`history-item note-item ${note.is_priority ? 'priority' : ''}`}>
                        <div className="item-icon">
                          {note.is_priority ? '📌' : '📝'}
                        </div>
                        <div className="item-content">
                          <div className="item-note">{note.note}</div>
                          <div className="item-meta">
                            <span className="note-type">{note.note_type}</span>
                            <span className="duty-code">Duty {note.duty_code}</span>
                          </div>
                        </div>
                        <div className="item-time">{formatTimeAgo(note.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Audit Log Tab */}
              {activeTab === 'audit' && (
                <div className="history-list">
                  {data?.auditEntries?.length === 0 ? (
                    <div className="empty-state">No audit entries</div>
                  ) : (
                    data?.auditEntries?.map((entry, idx) => (
                      <div key={entry.id || idx} className="history-item audit-item">
                        <div className="item-icon">📋</div>
                        <div className="item-content">
                          <div className="item-action-type">{entry.action_type?.replace(/_/g, ' ')}</div>
                          {entry.duty_code && (
                            <div className="item-duty">Duty {entry.duty_code}</div>
                          )}
                          {entry.notes && (
                            <div className="item-notes">{entry.notes}</div>
                          )}
                        </div>
                        <div className="item-time">{formatDate(entry.created_at)}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="supervisor-history-modal__footer">
          {data?.supervisor && (
            <span className="account-created">
              Account created: {formatDate(data.supervisor.created_at)}
            </span>
          )}
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorHistoryModal;
