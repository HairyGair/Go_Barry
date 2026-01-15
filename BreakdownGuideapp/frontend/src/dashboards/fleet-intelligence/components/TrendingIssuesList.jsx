/**
 * TrendingIssuesList Component
 *
 * Ranked list of trending defect types with change indicators.
 * Features: Trend arrows, percentage changes, severity indicators.
 */

import React, { useMemo } from 'react';

// Issue category icons
const ISSUE_ICONS = {
  'Engine': '🔧',
  'Brakes': '🛑',
  'Electrical': '⚡',
  'Doors': '🚪',
  'HVAC': '❄️',
  'Steering': '🎯',
  'Suspension': '📏',
  'Gearbox': '⚙️',
  'Wheelchair Ramp': '♿',
  'Destination Display': '📺',
  'Tyres': '⭕',
  'Fuel System': '⛽',
  'default': '📋',
};

const TrendingIssuesList = ({ trends = [], loading }) => {
  // Process and sort trends
  const processedTrends = useMemo(() => {
    if (!trends || trends.length === 0) {
      return [];
    }

    return trends
      .map(trend => ({
        name: trend.issue_type || trend.category || trend.name || 'Unknown',
        count: trend.count || trend.defect_count || 0,
        change: trend.change || trend.trend || trend.weekly_change || 0,
        icon: ISSUE_ICONS[trend.issue_type] || ISSUE_ICONS[trend.category] || ISSUE_ICONS.default,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [trends]);

  if (loading) {
    return (
      <div className="fid-card trending-issues-panel">
        <div className="panel-header">
          <h3>📊 Trending Issues</h3>
        </div>
        <div className="issues-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="issue-item loading">
              <div className="loading-skeleton issue-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card trending-issues-panel">
      <div className="panel-header">
        <h3>📊 Trending Issues</h3>
        <span className="period-badge">7 days</span>
      </div>

      <div className="issues-list">
        {processedTrends.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📉</span>
            <p>No trending data</p>
          </div>
        ) : (
          processedTrends.map((issue, index) => (
            <div key={index} className="issue-item">
              <div className="issue-rank">{index + 1}</div>
              <span className="issue-icon">{issue.icon}</span>
              <div className="issue-info">
                <span className="issue-name">{issue.name}</span>
                <span className="issue-count">{issue.count} incidents</span>
              </div>
              <div className={`issue-trend ${issue.change >= 0 ? 'up' : 'down'}`}>
                <span className="trend-arrow">{issue.change >= 0 ? '↑' : '↓'}</span>
                <span className="trend-value">{Math.abs(issue.change).toFixed(0)}%</span>
              </div>
            </div>
          ))
        )}
      </div>

      {processedTrends.length > 0 && (
        <div className="panel-footer">
          <span className="footer-note">
            {processedTrends.filter(t => t.change > 0).length} issues trending upward
          </span>
        </div>
      )}
    </div>
  );
};

export default TrendingIssuesList;
