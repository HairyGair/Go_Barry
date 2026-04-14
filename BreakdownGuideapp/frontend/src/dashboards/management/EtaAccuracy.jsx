import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';

const EtaAccuracy = ({ period = 'month' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.get(`/api/analytics/eta-accuracy?period=${period}`);
        setData(result.data);
      } catch (err) {
        console.error('ETA accuracy fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) return <div className="mgmt-section-loading">Loading ETA accuracy...</div>;
  if (!data || !data.summary) return null;

  const { summary, by_depot, recent } = data;

  return (
    <div className="mgmt-section">
      <h2 className="mgmt-section-title">Engineer ETA Accuracy</h2>
      <p className="mgmt-section-subtitle">How accurately are engineer arrival times predicted?</p>

      {/* Summary cards */}
      <div className="eta-summary-grid">
        <div className="eta-stat-card">
          <span className="eta-stat-value">{summary.total_dispatches}</span>
          <span className="eta-stat-label">Total Dispatches</span>
        </div>
        <div className="eta-stat-card">
          <span className="eta-stat-value" style={{ color: summary.on_time_pct >= 80 ? '#10B981' : summary.on_time_pct >= 60 ? '#F59E0B' : '#EF4444' }}>
            {summary.on_time_pct}%
          </span>
          <span className="eta-stat-label">On Time (within 5 min)</span>
        </div>
        <div className="eta-stat-card">
          <span className="eta-stat-value">
            {summary.avg_variance_minutes > 0 ? '+' : ''}{summary.avg_variance_minutes}m
          </span>
          <span className="eta-stat-label">Avg Variance</span>
        </div>
        <div className="eta-stat-card">
          <span className="eta-stat-value">{summary.avg_accuracy_pct}%</span>
          <span className="eta-stat-label">Avg Accuracy</span>
        </div>
      </div>

      {/* By depot table */}
      {by_depot.length > 0 && (
        <div className="eta-depot-table">
          <h3 className="eta-subtitle">By Depot</h3>
          <table aria-label="ETA accuracy by depot">
            <thead>
              <tr>
                <th scope="col">Depot</th>
                <th scope="col">Dispatches</th>
                <th scope="col">On Time %</th>
                <th scope="col">Avg Variance</th>
              </tr>
            </thead>
            <tbody>
              {by_depot.map(d => (
                <tr key={d.depot}>
                  <td>{d.depot}</td>
                  <td>{d.dispatches}</td>
                  <td style={{ color: d.on_time_pct >= 80 ? '#10B981' : d.on_time_pct >= 60 ? '#F59E0B' : '#EF4444' }}>
                    {d.on_time_pct}%
                  </td>
                  <td>{d.avg_variance > 0 ? '+' : ''}{d.avg_variance}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent dispatches */}
      {recent.length > 0 && (
        <div className="eta-recent">
          <h3 className="eta-subtitle">Recent Dispatches</h3>
          <div className="eta-recent-list">
            {recent.slice(0, 10).map((r, i) => (
              <div key={i} className="eta-recent-item">
                <div className="eta-recent-main">
                  <strong>{r.fleet_no}</strong>
                  <span className="eta-recent-engineer">{r.engineer_name}</span>
                  <span className="eta-recent-depot">{r.depot}</span>
                </div>
                <div className="eta-recent-times">
                  <span>ETA: {r.eta_minutes}m</span>
                  <span>Actual: {r.actual_minutes}m</span>
                  <span className={`eta-variance ${r.on_time ? 'on-time' : 'late'}`}>
                    {r.variance_minutes > 0 ? '+' : ''}{r.variance_minutes}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.total_dispatches === 0 && (
        <div className="eta-empty">
          <p>No engineer dispatches with ETA data found for this period.</p>
          <span>Data appears here when engineers are dispatched with calculated ETAs.</span>
        </div>
      )}

      <style>{`
        .eta-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .eta-stat-card {
          background: #1E293B;
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          border: 1px solid #334155;
        }
        .eta-stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #F1F5F9;
          margin-bottom: 4px;
        }
        .eta-stat-label {
          font-size: 12px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .eta-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #CBD5E1;
          margin: 16px 0 8px;
        }
        .eta-depot-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .eta-depot-table th, .eta-depot-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #334155;
          font-size: 13px;
          color: #CBD5E1;
        }
        .eta-depot-table th {
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
        }
        .eta-recent-list { display: flex; flex-direction: column; gap: 6px; }
        .eta-recent-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #1E293B;
          border-radius: 8px;
          font-size: 13px;
          color: #CBD5E1;
        }
        .eta-recent-main { display: flex; gap: 12px; align-items: center; }
        .eta-recent-engineer { color: #94A3B8; }
        .eta-recent-depot { color: #64748B; font-size: 12px; }
        .eta-recent-times { display: flex; gap: 12px; font-size: 12px; color: #94A3B8; }
        .eta-variance.on-time { color: #10B981; font-weight: 600; }
        .eta-variance.late { color: #EF4444; font-weight: 600; }
        .eta-empty { text-align: center; padding: 24px; color: #64748B; }
        .eta-empty p { font-size: 14px; margin-bottom: 4px; }
        .eta-empty span { font-size: 12px; }
        @media (max-width: 768px) {
          .eta-summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default EtaAccuracy;
