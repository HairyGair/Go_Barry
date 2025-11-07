/**
 * Login Analytics Dashboard Component
 * Comprehensive analytics for admin users tracking login activity and usage patterns
 *
 * Features:
 * - Real-time login statistics
 * - Success rate metrics
 * - Most active users table
 * - Hourly distribution chart
 * - Recent activity feed
 * - Auto-refresh every 30 seconds
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client.js';
import './LoginAnalyticsDashboard.css';

const LoginAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load analytics on mount and set up auto-refresh
  useEffect(() => {
    loadAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch analytics data from API
  const loadAnalytics = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const data = await apiClient.get('/api/analytics/dashboard');
      setAnalytics(data);
      setLastUpdated(new Date());

    } catch (err) {
      console.error('Failed to load analytics:', err);
      if (!silent) {
        setError('Failed to load analytics. Please try again.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return '';

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate max value for chart scaling
  const getMaxCount = (distribution) => {
    if (!distribution || distribution.length === 0) return 10;
    return Math.max(...distribution.map(d => d.count || 0), 1);
  };

  if (loading) {
    return (
      <div className="settings-section">
        <h2>Login Analytics</h2>
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-section">
        <h2>Login Analytics</h2>
        <div className="info-box error">
          <p>{error}</p>
        </div>
        <button
          className="settings-button"
          onClick={() => loadAnalytics()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics || !analytics.totals) {
    return (
      <div className="settings-section">
        <h2>Login Analytics</h2>
        <div className="analytics-empty">
          <div className="empty-icon">📊</div>
          <h3>No Data Yet</h3>
          <p>Login analytics will appear here once users start logging in.</p>
        </div>
      </div>
    );
  }

  const { totals, session, mostActiveUsers, hourlyDistribution, recentActivity } = analytics;
  const maxCount = getMaxCount(hourlyDistribution);

  return (
    <div className="settings-section">
      <div className="analytics-header">
        <div>
          <h2>Login Analytics</h2>
          <p className="section-description">
            Real-time insights into login activity and usage patterns
          </p>
        </div>
        <div className="analytics-refresh">
          {lastUpdated && (
            <span className="last-updated">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <button
            className="refresh-button"
            onClick={() => loadAnalytics()}
            title="Refresh analytics"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="analytics-grid">
        {/* Total Logins */}
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">🔐</div>
          <div className="stat-content">
            <div className="stat-label">Total Logins</div>
            <div className="stat-value">{totals.total_logins || 0}</div>
            <div className="stat-sublabel">
              {totals.successful_logins || 0} successful
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="stat-card stat-card-green">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Success Rate</div>
            <div className="stat-value">{(totals.success_rate || 0).toFixed(1)}%</div>
            <div className="stat-sublabel">
              Login success ratio
            </div>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="stat-card stat-card-red">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-label">Failed Attempts</div>
            <div className="stat-value">{totals.failed_logins || 0}</div>
            <div className="stat-sublabel">
              Unsuccessful logins
            </div>
          </div>
        </div>

        {/* Average Session */}
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Avg Session</div>
            <div className="stat-value">
              {formatDuration(session?.avg_duration_minutes || 0)}
            </div>
            <div className="stat-sublabel">
              {session?.completed_sessions || 0} sessions
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="analytics-columns">
        {/* Left Column: Most Active Users */}
        <div className="analytics-panel">
          <h3>Most Active Users</h3>
          <div className="active-users-table">
            {mostActiveUsers && mostActiveUsers.length > 0 ? (
              <>
                <div className="table-header">
                  <div>User</div>
                  <div>Logins</div>
                </div>
                {mostActiveUsers.slice(0, 5).map((user, index) => (
                  <div key={index} className="table-row">
                    <div className="user-info">
                      <div className="user-rank">#{index + 1}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-count">{user.login_count}</div>
                  </div>
                ))}
              </>
            ) : (
              <div className="table-empty">
                <p>No activity data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hourly Distribution Chart */}
        <div className="analytics-panel">
          <h3>Hourly Login Distribution</h3>
          <div className="hourly-chart">
            {hourlyDistribution && hourlyDistribution.length > 0 ? (
              <div className="chart-bars">
                {hourlyDistribution.map((item) => {
                  const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={item.hour} className="chart-bar-wrapper">
                      <div
                        className="chart-bar"
                        style={{ height: `${height}%` }}
                        title={`${item.hour}:00 - ${item.count} logins`}
                      >
                        <div className="bar-value">{item.count}</div>
                      </div>
                      <div className="bar-label">{item.hour}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty">
                <p>No hourly data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="analytics-panel">
        <h3>Recent Login Activity</h3>
        <div className="activity-feed">
          {recentActivity && recentActivity.length > 0 ? (
            <>
              <div className="activity-header">
                <div>User</div>
                <div>Time</div>
                <div>Status</div>
              </div>
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="activity-row">
                  <div className="activity-user">
                    {activity.email}
                  </div>
                  <div className="activity-time">
                    {formatDateTime(activity.login_time)}
                  </div>
                  <div className="activity-status">
                    {activity.success ? (
                      <span className="status-badge status-success">✓ Success</span>
                    ) : (
                      <span className="status-badge status-failed">✗ Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="activity-empty">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginAnalyticsDashboard;
