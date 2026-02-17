import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';

const DEPOTS = [
  { code: 'WAS', name: 'Washington' },
  { code: 'NCL', name: 'Riverside' },
  { code: 'CON', name: 'Consett' },
  { code: 'GTS', name: 'Deptford' },
  { code: 'HEX', name: 'Hexham' },
  { code: 'DAR', name: 'Percy Main' }
];

const DispatchEngineerModal = ({ breakdownId, breakdownDepot, breakdownLat, breakdownLng, onDispatch, onClose }) => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState('30');
  const [dispatching, setDispatching] = useState(false);
  const [depotFilter, setDepotFilter] = useState(breakdownDepot || '');
  const [autoEta, setAutoEta] = useState(null);
  const [calculatingEta, setCalculatingEta] = useState(false);

  useEffect(() => {
    fetchOnShift();
  }, [depotFilter]);

  const fetchOnShift = async () => {
    setLoading(true);
    try {
      const endpoint = depotFilter
        ? `/api/engineer-management/on-shift/${depotFilter}`
        : '/api/engineer-management/on-shift';
      const response = await apiClient.get(endpoint);
      if (response.success) {
        // Sort: available first, then by workload
        const sorted = (response.engineers || []).sort((a, b) => {
          if (a.is_available && !b.is_available) return -1;
          if (!a.is_available && b.is_available) return 1;
          return (a.active_jobs || 0) - (b.active_jobs || 0);
        });
        setEngineers(sorted);
      }
    } catch (error) {
      console.error('Error fetching on-shift engineers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate ETA when engineer is selected and breakdown has coordinates
  useEffect(() => {
    if (!selectedEngineer || !breakdownLat || !breakdownLng) {
      setAutoEta(null);
      return;
    }

    const depotCode = selectedEngineer.shift_depot || selectedEngineer.home_depot_code || depotFilter;
    if (!depotCode) return;

    let cancelled = false;
    setCalculatingEta(true);

    apiClient.post('/api/engineering/calculate-eta', {
      depot_code: depotCode,
      breakdown_lat: breakdownLat,
      breakdown_lng: breakdownLng
    }).then(response => {
      if (cancelled) return;
      if (response.success) {
        setAutoEta(response);
        setEtaMinutes(String(response.eta_minutes));
      }
    }).catch(err => {
      if (!cancelled) console.error('Auto-ETA calculation failed:', err);
    }).finally(() => {
      if (!cancelled) setCalculatingEta(false);
    });

    return () => { cancelled = true; };
  }, [selectedEngineer, breakdownLat, breakdownLng, depotFilter]);

  const handleDispatch = async () => {
    if (!selectedEngineer) return;
    setDispatching(true);
    try {
      const response = await apiClient.post('/api/engineering/assign', {
        breakdown_id: breakdownId,
        engineer_id: selectedEngineer.id,
        estimated_arrival_minutes: parseInt(etaMinutes) || null,
        assigned_by: selectedEngineer.name
      });

      if (response.success) {
        if (onDispatch) onDispatch(response.dispatch);
      } else {
        alert('Failed to dispatch: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error dispatching engineer:', error);
      alert('Failed to dispatch engineer');
    } finally {
      setDispatching(false);
    }
  };

  // Fallback: dispatch anonymously (old behaviour)
  const handleAnonymousDispatch = async () => {
    setDispatching(true);
    try {
      const response = await apiClient.post('/api/engineering/assign', {
        breakdown_id: breakdownId,
        estimated_arrival_minutes: parseInt(etaMinutes) || null,
        assigned_by: 'Engineering Manager'
      });
      if (response.success) {
        if (onDispatch) onDispatch(response.dispatch);
      }
    } catch (error) {
      console.error('Error dispatching:', error);
      alert('Failed to dispatch');
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="dem-overlay" onClick={onClose}>
      <div className="dem-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dem-header">
          <div className="dem-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <h3>Dispatch Engineer</h3>
          </div>
          <button className="dem-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Depot filter */}
        <div className="dem-filter-row">
          <label className="dem-filter-label">Depot:</label>
          <select
            className="dem-filter-select"
            value={depotFilter}
            onChange={e => { setDepotFilter(e.target.value); setSelectedEngineer(null); }}
          >
            <option value="">All depots</option>
            {DEPOTS.map(d => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Engineer list */}
        <div className="dem-list">
          {loading ? (
            <div className="dem-loading">
              <div className="dem-spinner" />
              <p>Loading on-shift engineers...</p>
            </div>
          ) : engineers.length === 0 ? (
            <div className="dem-empty">
              <p>No engineers on shift{depotFilter ? ` at ${DEPOTS.find(d => d.code === depotFilter)?.name || depotFilter}` : ''}.</p>
              <p className="dem-empty-hint">Use the shift check-in to set who's working today, or dispatch anonymously.</p>
            </div>
          ) : (
            engineers.map(eng => {
              const skills = Array.isArray(eng.skills) ? eng.skills : [];
              const isSelected = selectedEngineer?.id === eng.id;
              const isFloating = eng.home_depot_code && eng.shift_depot && eng.home_depot_code !== eng.shift_depot;

              return (
                <div
                  key={eng.id}
                  className={`dem-card ${isSelected ? 'dem-card-selected' : ''} ${!eng.is_available ? 'dem-card-busy' : ''}`}
                  onClick={() => setSelectedEngineer(eng)}
                >
                  <div className="dem-card-top">
                    <div className="dem-card-identity">
                      <span className="dem-card-name">{eng.name}</span>
                      <span className="dem-card-badge">{eng.badge_number}</span>
                    </div>
                    <div className={`dem-card-status ${eng.is_available ? 'dem-available' : 'dem-busy'}`}>
                      {eng.is_available ? 'Available' : `On Job (${eng.active_jobs} active)`}
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="dem-card-skills">
                      {skills.map((s, i) => (
                        <span key={i} className="dem-skill">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="dem-card-meta">
                    {eng.shift_start && eng.shift_end && (
                      <span className="dem-meta-item">
                        {eng.shift_start?.slice(0,5)} - {eng.shift_end?.slice(0,5)}
                      </span>
                    )}
                    {isFloating && (
                      <span className="dem-meta-floating">
                        Floating from {DEPOTS.find(d => d.code === eng.home_depot_code)?.name || eng.home_depot_code}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="dem-card-check">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ETA + Actions */}
        <div className="dem-footer">
          <div className="dem-eta-row">
            <label className="dem-eta-label">ETA (minutes):</label>
            <input
              type="number"
              className="dem-eta-input"
              value={etaMinutes}
              onChange={e => { setEtaMinutes(e.target.value); setAutoEta(null); }}
              min="1"
              max="240"
            />
            {calculatingEta && (
              <span className="dem-eta-calc">Calculating...</span>
            )}
          </div>
          {autoEta && (
            <div className="dem-eta-info">
              Road ETA: ~{autoEta.eta_minutes}m ({autoEta.distance_miles} miles from {autoEta.from_depot})
              {autoEta.estimated && <span className="dem-eta-est"> (estimated)</span>}
            </div>
          )}
          <div className="dem-action-row">
            <button
              className="dem-btn dem-btn-anon"
              onClick={handleAnonymousDispatch}
              disabled={dispatching}
            >
              Dispatch Anonymous
            </button>
            <button
              className="dem-btn dem-btn-dispatch"
              onClick={handleDispatch}
              disabled={!selectedEngineer || dispatching}
            >
              {dispatching ? 'Sending...' : selectedEngineer ? `Dispatch ${selectedEngineer.name}` : 'Select an engineer'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .dem-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 1500; padding: 20px;
          backdrop-filter: blur(4px);
        }

        .dem-modal {
          background: #0d1420;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          max-width: 520px; width: 100%;
          max-height: 85vh;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
          overflow: hidden;
        }

        .dem-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #0097A7, #00838F);
        }

        .dem-header-left {
          display: flex; align-items: center; gap: 10px; color: white;
        }

        .dem-header-left h3 {
          margin: 0; font-size: 16px; font-weight: 700;
          font-family: 'Outfit', sans-serif;
        }

        .dem-close {
          background: rgba(255,255,255,0.15); border: none;
          color: white; width: 32px; height: 32px;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .dem-close:hover { background: rgba(255,255,255,0.25); }

        .dem-filter-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .dem-filter-label {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          font-family: 'Inter', sans-serif;
        }

        .dem-filter-select {
          flex: 1;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; padding: 6px 10px;
          border-radius: 6px; font-size: 12px;
          font-family: 'Inter', sans-serif;
        }

        .dem-list {
          flex: 1; overflow-y: auto; padding: 8px 12px;
          min-height: 150px; max-height: 400px;
        }

        .dem-loading, .dem-empty {
          text-align: center; padding: 40px 20px; color: #64748b;
          font-size: 13px; font-family: 'Inter', sans-serif;
        }

        .dem-empty-hint {
          font-size: 11px; color: #475569; margin-top: 4px;
        }

        .dem-spinner {
          width: 28px; height: 28px;
          border: 3px solid #1e293b; border-top-color: #0097A7;
          border-radius: 50%;
          animation: dem-spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes dem-spin { to { transform: rotate(360deg); } }

        .dem-card {
          position: relative;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .dem-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
        }

        .dem-card-selected {
          background: rgba(0,151,167,0.08) !important;
          border-color: rgba(0,151,167,0.4) !important;
        }

        .dem-card-busy { opacity: 0.65; }

        .dem-card-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 6px;
        }

        .dem-card-identity {
          display: flex; align-items: baseline; gap: 8px;
        }

        .dem-card-name {
          font-size: 14px; font-weight: 600; color: #e2e8f0;
          font-family: 'Outfit', sans-serif;
        }

        .dem-card-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: #64748b;
        }

        .dem-card-status {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px;
        }

        .dem-available {
          background: rgba(16,185,129,0.12); color: #34d399;
          border: 1px solid rgba(16,185,129,0.25);
        }

        .dem-busy {
          background: rgba(245,158,11,0.12); color: #fbbf24;
          border: 1px solid rgba(245,158,11,0.25);
        }

        .dem-card-skills {
          display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;
        }

        .dem-skill {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; padding: 2px 6px; border-radius: 3px;
          background: rgba(99,102,241,0.1); color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .dem-card-meta {
          display: flex; gap: 10px; flex-wrap: wrap;
        }

        .dem-meta-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #64748b;
        }

        .dem-meta-floating {
          font-size: 10px; color: #f59e0b; font-weight: 600;
          font-family: 'Inter', sans-serif;
        }

        .dem-card-check {
          position: absolute; top: 10px; right: 10px;
          width: 24px; height: 24px;
          background: #0097A7; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: white;
        }

        .dem-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.2);
          padding: 14px 20px;
        }

        .dem-eta-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }

        .dem-eta-label {
          font-size: 12px; font-weight: 600; color: #94a3b8;
          font-family: 'Inter', sans-serif; white-space: nowrap;
        }

        .dem-eta-input {
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; padding: 6px 10px;
          border-radius: 6px; font-size: 14px;
          font-family: 'JetBrains Mono', monospace;
          width: 80px; text-align: center;
        }

        .dem-action-row {
          display: flex; gap: 8px;
        }

        .dem-btn {
          padding: 10px 16px; border: none; border-radius: 8px;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s; letter-spacing: 0.3px;
        }

        .dem-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .dem-btn-anon {
          background: rgba(255,255,255,0.06);
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .dem-btn-anon:hover:not(:disabled) {
          background: rgba(255,255,255,0.1); color: #e2e8f0;
        }

        .dem-btn-dispatch {
          flex: 1;
          background: linear-gradient(135deg, #0097A7, #00838F);
          color: white;
        }
        .dem-btn-dispatch:hover:not(:disabled) {
          background: linear-gradient(135deg, #00ACC1, #0097A7);
          box-shadow: 0 4px 14px rgba(0,151,167,0.3);
        }

        .dem-eta-calc {
          font-size: 11px;
          color: #64748b;
          font-family: 'Inter', sans-serif;
          font-style: italic;
        }

        .dem-eta-info {
          font-size: 11px;
          color: #22d3ee;
          font-family: 'JetBrains Mono', monospace;
          padding: 6px 10px;
          background: rgba(0,151,167,0.08);
          border-radius: 6px;
          border: 1px solid rgba(0,151,167,0.15);
          margin-bottom: 12px;
        }

        .dem-eta-est {
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default DispatchEngineerModal;
