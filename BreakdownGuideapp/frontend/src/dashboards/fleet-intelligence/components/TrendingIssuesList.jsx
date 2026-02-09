/**
 * TrendingIssuesList Component
 *
 * Ocean Teal themed trending issues list with inline SVG icons.
 * Shows top 6 issues ranked by occurrence count with trend indicators.
 */

import React, { useMemo } from 'react';

// Inline SVG icon components for each issue category
const IssueIcons = {
  Engine: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Brakes: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Electrical: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Doors: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="16" cy="12" r="1" />
    </svg>
  ),
  HVAC: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 7l-5 5-5-5M7 17l5-5 5 5" />
    </svg>
  ),
  Steering: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
    </svg>
  ),
  Suspension: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  ),
  Gearbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  ),
  'Wheelchair Ramp': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 22v-8m0 0L9 11m3 3l3-3" />
    </svg>
  ),
  'Destination Display': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 3l-4 4-4-4" />
    </svg>
  ),
  Tyres: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
  'Fuel System': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v20h12V2H3zm0 12h12M8 2v20" />
      <path d="M19 6h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2V6z" />
    </svg>
  ),
  default: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
};

// Helper function to get icon component
const getIssueIcon = (name) => {
  const IconComponent = IssueIcons[name] || IssueIcons.default;
  return <IconComponent />;
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
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [trends]);

  // Count trending upward issues
  const trendingUpCount = useMemo(() => {
    return processedTrends.filter(t => t.change > 0).length;
  }, [processedTrends]);

  // Loading state
  if (loading) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">Trending Issues</h3>
          <span className="fi__card-badge fi__card-badge--teal">7 days</span>
        </div>
        <div className="fi__trending">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="fi__skeleton" style={{ height: '60px', marginBottom: '8px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (processedTrends.length === 0) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">Trending Issues</h3>
          <span className="fi__card-badge fi__card-badge--teal">7 days</span>
        </div>
        <div className="fi__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p>No trending data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fi__card">
      <div className="fi__card-header">
        <h3 className="fi__card-title">Trending Issues</h3>
        <span className="fi__card-badge fi__card-badge--teal">7 days</span>
      </div>

      <div className="fi__trending">
        {processedTrends.map((issue, index) => {
          const changeValue = Math.abs(issue.change);
          const changeClass = issue.change > 0
            ? 'fi__trend-change--up'
            : issue.change < 0
            ? 'fi__trend-change--down'
            : 'fi__trend-change--neutral';

          return (
            <div key={index} className="fi__trend-item">
              <div className="fi__trend-rank">#{index + 1}</div>

              <div className="fi__trend-icon">
                {getIssueIcon(issue.name)}
              </div>

              <div className="fi__trend-info">
                <div className="fi__trend-name">{issue.name}</div>
                <div className="fi__trend-count">{issue.count} incidents</div>
              </div>

              <div className={`fi__trend-change ${changeClass}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  {issue.change > 0 && <path d="M12 4l8 8h-6v8h-4v-8H4z" />}
                  {issue.change < 0 && <path d="M12 20l-8-8h6V4h4v8h6z" />}
                  {issue.change === 0 && <rect x="4" y="11" width="16" height="2" />}
                </svg>
                <span>{changeValue.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fi__trend-footer">
        {trendingUpCount} {trendingUpCount === 1 ? 'issue' : 'issues'} trending upward
      </div>
    </div>
  );
};

export default TrendingIssuesList;
