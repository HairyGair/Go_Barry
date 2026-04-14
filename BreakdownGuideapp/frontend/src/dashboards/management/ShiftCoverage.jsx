import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ShiftCoverage = () => {
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiClient.get(`/api/analytics/shift-coverage?date=${selectedDate}`);
        setData(result.data);
      } catch (err) {
        console.error('Shift coverage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  if (loading) return <div className="mgmt-section-loading">Loading shift coverage...</div>;
  if (!data) return null;

  return (
    <div className="mgmt-section">
      <div className="sc-header">
        <div>
          <h2 className="mgmt-section-title">Shift Coverage Timeline</h2>
          <p className="mgmt-section-subtitle">Engineer availability across depots</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="sc-date-picker"
          aria-label="Select date for shift coverage"
        />
      </div>

      {data.depots.length === 0 ? (
        <div className="sc-empty">
          <p>No shift data for {selectedDate}</p>
          <span>Engineers need to be checked in for shifts to appear here.</span>
        </div>
      ) : (
        <>
          {/* Coverage summary cards */}
          <div className="sc-depot-cards">
            {data.depots.map(depot => (
              <div key={depot.depot} className="sc-depot-card">
                <div className="sc-depot-name">{depot.depot}</div>
                <div className="sc-depot-stats">
                  <span className="sc-engineers">{depot.engineers_on_shift} engineers</span>
                  <span className={`sc-coverage ${depot.coverage_pct >= 80 ? 'good' : depot.coverage_pct >= 50 ? 'fair' : 'poor'}`}>
                    {depot.coverage_pct}% coverage
                  </span>
                </div>
                {/* 24-hour timeline bar */}
                <div className="sc-timeline" role="img" aria-label={`${depot.depot}: ${depot.hours_covered} hours covered, gaps at ${depot.gap_hours.join(', ') || 'none'}`}>
                  {HOURS.map(h => (
                    <div
                      key={h}
                      className={`sc-hour ${depot.gap_hours.includes(h) ? 'gap' : 'covered'}`}
                      title={`${String(h).padStart(2, '0')}:00 — ${depot.gap_hours.includes(h) ? 'No coverage' : 'Covered'}`}
                    />
                  ))}
                </div>
                <div className="sc-timeline-labels">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
                {depot.gap_hours.length > 0 && (
                  <div className="sc-gap-warning">
                    Gap hours: {depot.gap_hours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Engineer list per depot */}
          {Object.entries(data.shifts).map(([depot, engineers]) => (
            <div key={depot} className="sc-engineer-section">
              <h3 className="sc-depot-heading">{depot} — {engineers.length} engineer{engineers.length !== 1 ? 's' : ''}</h3>
              <div className="sc-engineer-list">
                {engineers.map((eng, i) => (
                  <div key={i} className="sc-engineer-row">
                    <span className="sc-eng-name">{eng.engineer_name}</span>
                    <span className="sc-eng-badge">{eng.badge_number}</span>
                    <span className="sc-eng-shift">{eng.shift_name || 'Custom'}</span>
                    <span className="sc-eng-time">{eng.start_time?.slice(0, 5)} — {eng.end_time?.slice(0, 5)}</span>
                    <span className={`sc-eng-status sc-status-${eng.status}`}>{eng.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <style>{`
        .sc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .sc-date-picker {
          background: #1E293B; border: 1px solid #334155; border-radius: 8px;
          padding: 8px 12px; color: #F1F5F9; font-size: 13px;
        }
        .sc-depot-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .sc-depot-card {
          background: #1E293B; border-radius: 10px; padding: 16px;
          border: 1px solid #334155;
        }
        .sc-depot-name { font-size: 16px; font-weight: 700; color: #F1F5F9; margin-bottom: 6px; }
        .sc-depot-stats { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .sc-engineers { color: #94A3B8; }
        .sc-coverage { font-weight: 600; }
        .sc-coverage.good { color: #10B981; }
        .sc-coverage.fair { color: #F59E0B; }
        .sc-coverage.poor { color: #EF4444; }
        .sc-timeline { display: flex; gap: 1px; height: 20px; border-radius: 4px; overflow: hidden; }
        .sc-hour { flex: 1; min-width: 0; }
        .sc-hour.covered { background: #0097A7; }
        .sc-hour.gap { background: #334155; }
        .sc-timeline-labels {
          display: flex; justify-content: space-between;
          font-size: 10px; color: #64748B; margin-top: 4px;
        }
        .sc-gap-warning {
          margin-top: 8px; font-size: 11px; color: #F59E0B;
          padding: 6px 8px; background: rgba(245, 158, 11, 0.1);
          border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .sc-depot-heading { font-size: 14px; font-weight: 600; color: #CBD5E1; margin: 16px 0 8px; }
        .sc-engineer-list { display: flex; flex-direction: column; gap: 4px; }
        .sc-engineer-row {
          display: flex; gap: 16px; align-items: center;
          padding: 6px 12px; background: #1E293B; border-radius: 6px;
          font-size: 13px; color: #CBD5E1;
        }
        .sc-eng-name { font-weight: 600; min-width: 140px; }
        .sc-eng-badge { color: #64748B; font-family: monospace; min-width: 60px; }
        .sc-eng-shift { color: #94A3B8; min-width: 80px; }
        .sc-eng-time { font-family: monospace; color: #0097A7; min-width: 100px; }
        .sc-eng-status { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .sc-status-on_shift { color: #10B981; }
        .sc-status-completed { color: #64748B; }
        .sc-status-absent { color: #EF4444; }
        .sc-empty { text-align: center; padding: 24px; color: #64748B; }
        .sc-empty p { font-size: 14px; margin-bottom: 4px; }
        .sc-empty span { font-size: 12px; }
      `}</style>
    </div>
  );
};

export default ShiftCoverage;
