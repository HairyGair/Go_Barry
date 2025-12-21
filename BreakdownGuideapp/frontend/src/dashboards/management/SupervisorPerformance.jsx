/**
 * SupervisorPerformance Component
 *
 * Phase 3.2 - Supervisor Performance Dashboard
 * Displays comprehensive performance metrics for supervisors
 *
 * Features:
 * - Weekly/monthly performance breakdown
 * - Breakdowns resolved per shift type
 * - Response time trends
 * - Leaderboard (optional)
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

const SupervisorPerformance = ({ period = 'week' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period: selectedPeriod,
        include_leaderboard: showLeaderboard.toString()
      });

      const response = await fetch(`${API_URL}/api/analytics/supervisor-performance?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch performance data');

      const result = await response.json();
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching supervisor performance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, showLeaderboard]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (loading) {
    return (
      <div className="performance-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="performance-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchPerformanceData}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { overallStats, supervisors, leaderboard, trends, period: periodInfo } = data;

  // Performance score color
  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  // Performance score label
  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="supervisor-performance">
      {/* Header */}
      <div className="performance-header">
        <div className="performance-title">
          <h2>📊 Supervisor Performance</h2>
          <span className="period-label">{periodInfo?.label || 'Last 7 Days'}</span>
        </div>
        <div className="performance-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <label className="leaderboard-toggle">
            <input
              type="checkbox"
              checked={showLeaderboard}
              onChange={(e) => setShowLeaderboard(e.target.checked)}
            />
            Show Leaderboard
          </label>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="overall-stats">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-content">
            <span className="stat-value">{overallStats?.totalBreakdowns || 0}</span>
            <span className="stat-label">Total Breakdowns</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{overallStats?.totalResolved || 0}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-value">{overallStats?.activeSupervisors || 0}</span>
            <span className="stat-label">Active Supervisors</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-content">
            <span className="stat-value" style={{ color: getScoreColor(overallStats?.avgPerformanceScore || 0) }}>
              {overallStats?.avgPerformanceScore || 0}
            </span>
            <span className="stat-label">Avg Performance</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {showLeaderboard && leaderboard && leaderboard.length > 0 && (
        <div className="leaderboard-section">
          <h3>🏆 Top Performers</h3>
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <span className="lb-rank">Rank</span>
              <span className="lb-name">Supervisor</span>
              <span className="lb-depot">Depot</span>
              <span className="lb-breakdowns">Breakdowns</span>
              <span className="lb-response">Avg Response</span>
              <span className="lb-score">Score</span>
            </div>
            {leaderboard.map((entry) => (
              <div
                key={entry.badge}
                className={`leaderboard-row ${entry.rank <= 3 ? 'top-three' : ''}`}
                onClick={() => setSelectedSupervisor(entry.badge === selectedSupervisor ? null : entry.badge)}
              >
                <span className="lb-rank">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </span>
                <span className="lb-name">{entry.name}</span>
                <span className="lb-depot">{entry.depot || '-'}</span>
                <span className="lb-breakdowns">{entry.breakdowns}</span>
                <span className="lb-response">{entry.avgResponse ? `${entry.avgResponse}m` : '-'}</span>
                <span className="lb-score" style={{ color: getScoreColor(entry.score) }}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supervisor Details */}
      {supervisors && supervisors.length > 0 && (
        <div className="supervisor-details-section">
          <h3>👤 Supervisor Details</h3>
          <div className="supervisor-grid">
            {supervisors.map((sup) => (
              <div
                key={sup.badge}
                className={`supervisor-card ${selectedSupervisor === sup.badge ? 'selected' : ''}`}
                onClick={() => setSelectedSupervisor(sup.badge === selectedSupervisor ? null : sup.badge)}
              >
                <div className="supervisor-card-header">
                  <div className="supervisor-info">
                    <span className="supervisor-name">{sup.name}</span>
                    <span className="supervisor-badge">{sup.badge}</span>
                  </div>
                  <div
                    className="performance-score-badge"
                    style={{ backgroundColor: getScoreColor(sup.metrics?.performanceScore || 0) }}
                  >
                    {sup.metrics?.performanceScore || 0}
                  </div>
                </div>

                <div className="supervisor-metrics">
                  <div className="metric">
                    <span className="metric-value">{sup.metrics?.totalHandled || 0}</span>
                    <span className="metric-label">Handled</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{sup.metrics?.resolved || 0}</span>
                    <span className="metric-label">Resolved</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{sup.metrics?.avgResponseTime ? `${sup.metrics.avgResponseTime}m` : '-'}</span>
                    <span className="metric-label">Avg Response</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">{sup.metrics?.resolutionRate || 0}%</span>
                    <span className="metric-label">Resolution</span>
                  </div>
                </div>

                {/* Breakdowns by Duty Type */}
                <div className="duty-breakdown">
                  <span className="duty-label">By Shift:</span>
                  <div className="duty-bars">
                    {Object.entries(sup.byDutyType || {}).map(([duty, count]) => (
                      <div key={duty} className="duty-bar" title={`Duty ${duty}: ${count}`}>
                        <div
                          className={`duty-bar-fill duty-${duty}`}
                          style={{
                            height: `${Math.min(100, (count / Math.max(1, sup.metrics?.totalHandled || 1)) * 100)}%`
                          }}
                        />
                        <span className="duty-bar-label">{duty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="performance-label">
                  {getScoreLabel(sup.metrics?.performanceScore || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Time Trends */}
      {trends && trends.length > 0 && (
        <div className="trends-section">
          <h3>📈 Response Time Trends</h3>
          <div className="trends-chart">
            <div className="chart-bars">
              {trends.slice(-14).map((day, index) => (
                <div key={index} className="trend-bar-container">
                  <div
                    className="trend-bar"
                    style={{
                      height: `${Math.min(100, (day.avgResponseTime || 0) / 60 * 100)}%`,
                      backgroundColor: day.avgResponseTime && day.avgResponseTime <= 30 ? '#10B981' :
                                       day.avgResponseTime && day.avgResponseTime <= 45 ? '#F59E0B' : '#EF4444'
                    }}
                    title={`${day.label}: ${day.avgResponseTime || 0}m avg, ${day.breakdowns} breakdowns`}
                  >
                    {day.avgResponseTime && <span className="bar-value">{day.avgResponseTime}m</span>}
                  </div>
                  <span className="trend-label">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <span className="legend-item good">● ≤30m (Good)</span>
              <span className="legend-item warning">● 31-45m (Warning)</span>
              <span className="legend-item critical">● &gt;45m (Critical)</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .supervisor-performance {
          padding: var(--spacing-lg, 24px);
          background: var(--color-bg-primary, #1a1a2e);
          border-radius: var(--radius-xl, 16px);
          color: var(--color-text-primary, #fff);
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg, 24px);
          flex-wrap: wrap;
          gap: var(--spacing-md, 16px);
        }

        .performance-title h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .period-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #a0aec0);
          margin-left: 12px;
        }

        .performance-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
        }

        .period-select {
          padding: 8px 16px;
          border-radius: var(--radius-md, 8px);
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
        }

        .leaderboard-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #a0aec0);
          cursor: pointer;
        }

        .overall-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md, 16px);
          margin-bottom: var(--spacing-xl, 32px);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: var(--spacing-md, 16px);
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-lg, 12px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .leaderboard-section,
        .supervisor-details-section,
        .trends-section {
          margin-bottom: var(--spacing-xl, 32px);
        }

        .leaderboard-section h3,
        .supervisor-details-section h3,
        .trends-section h3 {
          margin: 0 0 var(--spacing-md, 16px);
          font-size: 1.125rem;
        }

        .leaderboard-table {
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-lg, 12px);
          overflow: hidden;
        }

        .leaderboard-header,
        .leaderboard-row {
          display: grid;
          grid-template-columns: 60px 1fr 80px 100px 100px 70px;
          padding: 12px 16px;
          align-items: center;
        }

        .leaderboard-header {
          background: rgba(255,255,255,0.05);
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .leaderboard-row {
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: background 0.2s;
        }

        .leaderboard-row:hover {
          background: rgba(255,255,255,0.05);
        }

        .leaderboard-row.top-three {
          background: linear-gradient(90deg, rgba(245,158,11,0.1), transparent);
        }

        .supervisor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-md, 16px);
        }

        .supervisor-card {
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-lg, 12px);
          padding: var(--spacing-md, 16px);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }

        .supervisor-card:hover,
        .supervisor-card.selected {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
        }

        .supervisor-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md, 16px);
        }

        .supervisor-name {
          font-weight: 600;
          font-size: 1rem;
          display: block;
        }

        .supervisor-badge {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .performance-score-badge {
          padding: 4px 10px;
          border-radius: var(--radius-full, 20px);
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
        }

        .supervisor-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: var(--spacing-md, 16px);
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .metric-label {
          font-size: 0.625rem;
          color: var(--color-text-secondary, #a0aec0);
          text-transform: uppercase;
        }

        .duty-breakdown {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--spacing-sm, 8px);
        }

        .duty-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .duty-bars {
          display: flex;
          gap: 4px;
          flex: 1;
          height: 24px;
        }

        .duty-bar {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          background: rgba(0,0,0,0.2);
          border-radius: 2px;
          position: relative;
        }

        .duty-bar-fill {
          width: 100%;
          border-radius: 2px;
          transition: height 0.3s;
        }

        .duty-100 { background: #3B82F6; }
        .duty-200 { background: #10B981; }
        .duty-400 { background: #F59E0B; }
        .duty-500 { background: #8B5CF6; }

        .duty-bar-label {
          font-size: 0.5rem;
          position: absolute;
          bottom: -12px;
          color: var(--color-text-muted, #718096);
        }

        .performance-label {
          text-align: center;
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
          padding-top: var(--spacing-sm, 8px);
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: var(--spacing-sm, 8px);
        }

        .trends-chart {
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-lg, 12px);
          padding: var(--spacing-lg, 24px);
        }

        .chart-bars {
          display: flex;
          gap: 8px;
          height: 200px;
          align-items: flex-end;
          padding-bottom: 24px;
        }

        .trend-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .trend-bar {
          width: 100%;
          max-width: 40px;
          border-radius: 4px 4px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-height: 4px;
          transition: height 0.3s;
        }

        .bar-value {
          font-size: 0.625rem;
          color: white;
          padding-top: 4px;
        }

        .trend-label {
          font-size: 0.625rem;
          color: var(--color-text-muted, #718096);
          margin-top: 4px;
          white-space: nowrap;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: var(--spacing-lg, 24px);
          margin-top: var(--spacing-md, 16px);
          font-size: 0.75rem;
        }

        .legend-item.good { color: #10B981; }
        .legend-item.warning { color: #F59E0B; }
        .legend-item.critical { color: #EF4444; }

        .performance-loading,
        .performance-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl, 32px);
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #3B82F6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md, 16px);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-sm, 8px);
        }

        .performance-error button {
          margin-top: var(--spacing-md, 16px);
          padding: 8px 24px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .performance-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .leaderboard-header,
          .leaderboard-row {
            grid-template-columns: 50px 1fr 70px 60px;
          }

          .lb-depot,
          .lb-response {
            display: none;
          }

          .supervisor-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .chart-bars {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default SupervisorPerformance;
