/**
 * CoverageGapsAnalysis Component
 *
 * Phase 3.3 - Shift Coverage Gaps Analysis
 * Identifies times when no supervisor was on duty and overlap periods
 *
 * Features:
 * - Coverage timeline visualization
 * - Gap identification with severity
 * - Overlap period detection
 * - Schedule optimization suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.breakdowns.gobarry.co.uk';

// Duty shift colors
const DUTY_COLORS = {
  '100': '#3B82F6', // Early - Blue
  '200': '#10B981', // Day - Green
  '400': '#F59E0B', // Late - Amber
  '500': '#8B5CF6'  // Night - Purple
};

const DUTY_NAMES = {
  '100': 'Early Shift',
  '200': 'Day Shift',
  '400': 'Late Shift',
  '500': 'Night Shift'
};

const CoverageGapsAnalysis = ({ depot = null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchCoverageData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: selectedPeriod });
      if (depot) params.append('depot', depot);

      const response = await fetch(`${API_URL}/api/analytics/coverage-gaps?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch coverage data');

      const result = await response.json();
      if (result.success) {
        setData(result);
        setError(null);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching coverage gaps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, depot]);

  useEffect(() => {
    fetchCoverageData();
  }, [fetchCoverageData]);

  if (loading) {
    return (
      <div className="coverage-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing shift coverage...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coverage-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={fetchCoverageData}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const { summary, coverageByDay, gaps, overlaps, suggestions, dutyShifts, period: periodInfo } = data;

  // Get coverage color
  const getCoverageColor = (percent) => {
    if (percent >= 90) return '#10B981';
    if (percent >= 70) return '#F59E0B';
    return '#EF4444';
  };

  // Format hour range
  const formatHourRange = (startHour, endHour) => {
    const start = `${String(startHour).padStart(2, '0')}:00`;
    const end = endHour === 24 ? '00:00' : `${String(endHour).padStart(2, '0')}:00`;
    return `${start} - ${end}`;
  };

  return (
    <div className="coverage-gaps-analysis">
      {/* Header */}
      <div className="coverage-header">
        <div className="coverage-title">
          <h2>📅 Shift Coverage Analysis</h2>
          <span className="period-label">
            {periodInfo?.depot !== 'All' ? `${periodInfo.depot} • ` : ''}
            {selectedPeriod === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
          </span>
        </div>
        <div className="coverage-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card primary">
          <div className="stat-ring" style={{ '--progress': `${summary?.avgCoverage || 0}%` }}>
            <span className="stat-value">{summary?.avgCoverage || 0}%</span>
          </div>
          <span className="stat-label">Average Coverage</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalGaps || 0}</span>
            <span className="stat-label">Coverage Gaps</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalGapHours || 0}h</span>
            <span className="stat-label">Total Gap Time</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalOverlaps || 0}</span>
            <span className="stat-label">Shift Overlaps</span>
          </div>
        </div>
      </div>

      {/* Duty Shift Legend */}
      <div className="shift-legend">
        <span className="legend-title">Duty Shifts:</span>
        {Object.entries(dutyShifts || {}).map(([code, shift]) => (
          <div key={code} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: DUTY_COLORS[code] }}></span>
            <span className="legend-label">{code}: {shift.start}-{shift.end}</span>
          </div>
        ))}
      </div>

      {/* Coverage Timeline */}
      <div className="coverage-timeline-section">
        <h3>📊 Daily Coverage</h3>
        <div className="coverage-timeline">
          {(coverageByDay || []).map((day, index) => (
            <div
              key={day.date}
              className={`day-row ${selectedDay === index ? 'selected' : ''}`}
              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
            >
              <div className="day-info">
                <span className="day-name">{day.dayOfWeek?.substring(0, 3)}</span>
                <span className="day-date">{day.date?.split('-').slice(1).join('/')}</span>
              </div>
              <div className="day-timeline">
                {(day.hourlySlots || []).map((slot) => (
                  <div
                    key={slot.hour}
                    className={`hour-slot ${slot.isCovered ? 'covered' : ''} ${slot.isOverlap ? 'overlap' : ''} ${!slot.isCovered && slot.expectedDuties?.length > 0 ? 'gap' : ''}`}
                    title={`${slot.label}: ${slot.activeSupervisors} active, ${slot.activeDuties?.join(', ') || 'None'}`}
                    style={{
                      backgroundColor: slot.activeDuties?.length > 0
                        ? DUTY_COLORS[slot.activeDuties[0]] || 'rgba(255,255,255,0.2)'
                        : slot.expectedDuties?.length > 0
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {slot.isOverlap && <span className="overlap-indicator">+</span>}
                  </div>
                ))}
              </div>
              <div className="day-stats">
                <span
                  className="coverage-badge"
                  style={{ backgroundColor: getCoverageColor(day.coveragePercent) }}
                >
                  {day.coveragePercent}%
                </span>
                <span className="events-count">{day.totalEvents} events</span>
              </div>
            </div>
          ))}
        </div>
        <div className="timeline-hours">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Coverage Gaps List */}
      {gaps && gaps.length > 0 && (
        <div className="gaps-section">
          <h3>⚠️ Coverage Gaps ({gaps.length})</h3>
          <div className="gaps-list">
            {gaps.slice(0, 10).map((gap, index) => (
              <div key={index} className="gap-card">
                <div className="gap-header">
                  <span className="gap-date">{gap.date}</span>
                  <span className="gap-time">{formatHourRange(gap.startHour, gap.endHour)}</span>
                </div>
                <div className="gap-details">
                  <span className="gap-duration">{gap.duration}h uncovered</span>
                  <div className="expected-duties">
                    Expected: {gap.expectedDuties?.map(d => (
                      <span
                        key={d}
                        className="duty-tag"
                        style={{ backgroundColor: DUTY_COLORS[d] }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlap Periods */}
      {overlaps && overlaps.length > 0 && (
        <div className="overlaps-section">
          <h3>🔄 Shift Overlaps ({overlaps.length})</h3>
          <div className="overlaps-list">
            {overlaps.slice(0, 8).map((overlap, index) => (
              <div key={index} className="overlap-card">
                <span className="overlap-date">{overlap.date}</span>
                <span className="overlap-time">{overlap.hour}:00</span>
                <div className="overlap-duties">
                  {overlap.duties?.map(d => (
                    <span
                      key={d}
                      className="duty-tag"
                      style={{ backgroundColor: DUTY_COLORS[d] }}
                    >
                      {DUTY_NAMES[d] || d}
                    </span>
                  ))}
                </div>
                <span className="supervisor-count">{overlap.supervisorCount} supervisors</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3>💡 Optimization Suggestions</h3>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className={`suggestion-card priority-${suggestion.priority}`}>
                <span className="suggestion-icon">
                  {suggestion.priority === 'high' ? '🔴' : suggestion.priority === 'medium' ? '🟡' : '🟢'}
                </span>
                <div className="suggestion-content">
                  <span className="suggestion-type">{suggestion.type}</span>
                  <p className="suggestion-message">{suggestion.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best/Worst Days */}
      {(summary?.bestDay || summary?.worstDay) && (
        <div className="extremes-section">
          <h3>📅 Coverage Extremes</h3>
          <div className="extremes-grid">
            {summary.bestDay && (
              <div className="extreme-card best">
                <span className="extreme-icon">🏆</span>
                <div className="extreme-content">
                  <span className="extreme-label">Best Coverage</span>
                  <span className="extreme-date">{summary.bestDay.dayOfWeek} ({summary.bestDay.date})</span>
                  <span className="extreme-value" style={{ color: '#10B981' }}>
                    {summary.bestDay.coveragePercent}%
                  </span>
                </div>
              </div>
            )}
            {summary.worstDay && (
              <div className="extreme-card worst">
                <span className="extreme-icon">⚠️</span>
                <div className="extreme-content">
                  <span className="extreme-label">Lowest Coverage</span>
                  <span className="extreme-date">{summary.worstDay.dayOfWeek} ({summary.worstDay.date})</span>
                  <span className="extreme-value" style={{ color: '#EF4444' }}>
                    {summary.worstDay.coveragePercent}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .coverage-gaps-analysis {
          padding: var(--spacing-lg, 24px);
          background: var(--color-bg-primary, #1a1a2e);
          border-radius: var(--radius-xl, 16px);
          color: var(--color-text-primary, #fff);
        }

        .coverage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg, 24px);
          flex-wrap: wrap;
          gap: var(--spacing-md, 16px);
        }

        .coverage-title h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .period-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #a0aec0);
          margin-left: 12px;
        }

        .period-select {
          padding: 8px 16px;
          border-radius: var(--radius-md, 8px);
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 0.875rem;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

        .stat-card.primary {
          flex-direction: column;
          text-align: center;
        }

        .stat-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: conic-gradient(
            #10B981 var(--progress, 0%),
            rgba(255,255,255,0.1) var(--progress, 0%)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .stat-ring::before {
          content: '';
          position: absolute;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--color-bg-primary, #1a1a2e);
        }

        .stat-ring .stat-value {
          position: relative;
          z-index: 1;
          font-size: 1.25rem;
          font-weight: 700;
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

        .shift-legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md, 16px);
          align-items: center;
          margin-bottom: var(--spacing-lg, 24px);
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-md, 8px);
        }

        .legend-title {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .coverage-timeline-section h3,
        .gaps-section h3,
        .overlaps-section h3,
        .suggestions-section h3,
        .extremes-section h3 {
          margin: 0 0 var(--spacing-md, 16px);
          font-size: 1.125rem;
        }

        .coverage-timeline {
          background: rgba(0,0,0,0.2);
          border-radius: var(--radius-lg, 12px);
          padding: var(--spacing-md, 16px);
          margin-bottom: var(--spacing-xl, 32px);
        }

        .day-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-md, 16px);
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          transition: background 0.2s;
        }

        .day-row:hover,
        .day-row.selected {
          background: rgba(255,255,255,0.05);
        }

        .day-row:last-child {
          border-bottom: none;
        }

        .day-info {
          width: 60px;
          text-align: center;
        }

        .day-name {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .day-date {
          font-size: 0.625rem;
          color: var(--color-text-muted, #718096);
        }

        .day-timeline {
          flex: 1;
          display: flex;
          gap: 1px;
          height: 24px;
        }

        .hour-slot {
          flex: 1;
          border-radius: 2px;
          transition: all 0.2s;
          position: relative;
        }

        .hour-slot.gap {
          animation: pulse-gap 2s ease-in-out infinite;
        }

        @keyframes pulse-gap {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .overlap-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.5rem;
          font-weight: bold;
          color: white;
        }

        .day-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          width: 80px;
        }

        .coverage-badge {
          padding: 2px 8px;
          border-radius: var(--radius-full, 20px);
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }

        .events-count {
          font-size: 0.625rem;
          color: var(--color-text-muted, #718096);
        }

        .timeline-hours {
          display: flex;
          justify-content: space-between;
          font-size: 0.625rem;
          color: var(--color-text-muted, #718096);
          padding: 0 76px 0 76px;
          margin-top: 4px;
        }

        .gaps-section,
        .overlaps-section,
        .suggestions-section,
        .extremes-section {
          margin-bottom: var(--spacing-xl, 32px);
        }

        .gaps-list,
        .overlaps-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-sm, 8px);
        }

        .gap-card {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md, 8px);
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
        }

        .gap-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .gap-date {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .gap-time {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .gap-duration {
          font-size: 0.75rem;
          color: #EF4444;
          display: block;
          margin-bottom: 4px;
        }

        .expected-duties {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.625rem;
          color: var(--color-text-muted, #718096);
        }

        .duty-tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 600;
          color: white;
        }

        .overlap-card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: var(--radius-md, 8px);
          padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
          font-size: 0.75rem;
        }

        .overlap-date {
          font-weight: 600;
        }

        .overlap-time {
          color: var(--color-text-secondary, #a0aec0);
        }

        .overlap-duties {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .supervisor-count {
          color: var(--color-text-muted, #718096);
          font-size: 0.625rem;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
        }

        .suggestion-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: var(--spacing-md, 16px);
          border-radius: var(--radius-md, 8px);
          background: rgba(255,255,255,0.05);
          border-left: 4px solid;
        }

        .suggestion-card.priority-high {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .suggestion-card.priority-medium {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.05);
        }

        .suggestion-card.priority-low {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.05);
        }

        .suggestion-icon {
          font-size: 1.25rem;
        }

        .suggestion-type {
          display: block;
          font-size: 0.625rem;
          text-transform: uppercase;
          color: var(--color-text-muted, #718096);
          margin-bottom: 4px;
        }

        .suggestion-message {
          margin: 0;
          font-size: 0.875rem;
        }

        .extremes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-md, 16px);
        }

        .extreme-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: var(--spacing-md, 16px);
          border-radius: var(--radius-lg, 12px);
          background: rgba(255,255,255,0.05);
        }

        .extreme-card.best {
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .extreme-card.worst {
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .extreme-icon {
          font-size: 2rem;
        }

        .extreme-content {
          display: flex;
          flex-direction: column;
        }

        .extreme-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #a0aec0);
        }

        .extreme-date {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .extreme-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .coverage-loading,
        .coverage-error {
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

        .coverage-error button {
          margin-top: var(--spacing-md, 16px);
          padding: 8px 24px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: var(--radius-md, 8px);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .coverage-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .day-timeline {
            height: 16px;
          }

          .timeline-hours {
            padding: 0 60px 0 60px;
          }

          .day-info {
            width: 40px;
          }

          .day-stats {
            width: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default CoverageGapsAnalysis;
