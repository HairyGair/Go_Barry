import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api-client';
import { getDepotOptions } from '../../config/demoDepots';
import { getShiftWindow } from './board/dispatchBoardHelpers';

const REAL_DEPOTS = [
  { code: 'WAS', name: 'Washington' },
  { code: 'NCL', name: 'Riverside' },
  { code: 'CON', name: 'Consett' },
  { code: 'GTS', name: 'Deptford' },
  { code: 'HEX', name: 'Hexham' },
  { code: 'DAR', name: 'Percy Main' }
];

// Evaluated at render time (not module load): modules outlive logout/login,
// so a module-level list could keep the previous session's depots.
const getDepots = () => getDepotOptions(REAL_DEPOTS);

// The pattern covering the current time - a sensible default when checking someone in
const currentTemplate = (templates) =>
  templates.find(t => getShiftWindow({ shift_start: t.start_time, shift_end: t.end_time }).state === 'current') || null;

const ShiftCheckInModal = ({ onComplete, onSkip, dismissLabel = 'Skip for now' }) => {
  const [step, setStep] = useState(1); // 1 = select engineers, 2 = confirm
  const [engineers, setEngineers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selections, setSelections] = useState({}); // { engineerId: { checked, templateId, customStart, customEnd, depotCode } }
  const [rosteredById, setRosteredById] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [engRes, tmplRes, shiftRes] = await Promise.all([
        apiClient.get('/api/engineer-management/engineers?include_all=true'),
        apiClient.get('/api/engineer-management/shift-templates'),
        apiClient.get('/api/engineer-management/on-shift').catch(() => null)
      ]);

      const tmpls = tmplRes.success ? (tmplRes.templates || []) : [];
      if (engRes.success) setEngineers(engRes.engineers || []);
      setTemplates(tmpls);

      // Who is already rostered today (re-checking them in updates their shift)
      const rostered = {};
      (shiftRes?.engineers || []).forEach(r => { rostered[r.id] = r; });
      setRosteredById(rostered);

      // Initialize selections: already-rostered engineers start from their
      // current shift; everyone else defaults to the pattern covering now
      const fallback = currentTemplate(tmpls);
      const initial = {};
      (engRes.engineers || []).forEach(e => {
        const r = rostered[e.id];
        initial[e.id] = {
          checked: false,
          templateId: r ? (r.shift_template_id ? String(r.shift_template_id) : null) : (fallback ? String(fallback.id) : null),
          customStart: r && !r.shift_template_id ? (r.shift_start || '').slice(0, 5) : '',
          customEnd: r && !r.shift_template_id ? (r.shift_end || '').slice(0, 5) : '',
          depotCode: (r && r.shift_depot) || e.home_depot_code || ''
        };
      });
      setSelections(initial);
    } catch (error) {
      console.error('Error fetching check-in data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEngineer = (id) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked }
    }));
  };

  const updateSelection = (id, field, value) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const selectedEngineers = engineers.filter(e => selections[e.id]?.checked);
  const allSelected = engineers.length > 0 && selectedEngineers.length === engineers.length;
  const toggleAll = () => {
    setSelections(prev => {
      const next = { ...prev };
      engineers.forEach(e => { next[e.id] = { ...next[e.id], checked: !allSelected }; });
      return next;
    });
  };
  // A selected engineer needs either a pattern or both custom times
  const missingTimes = selectedEngineers.filter(e => {
    const sel = selections[e.id];
    return !sel?.templateId && !(sel?.customStart && sel?.customEnd);
  });

  const getShiftTime = (engineerId) => {
    const sel = selections[engineerId];
    if (!sel) return '';
    if (sel.templateId) {
      const tmpl = templates.find(t => t.id === parseInt(sel.templateId));
      if (tmpl) return `${tmpl.start_time?.slice(0,5)} - ${tmpl.end_time?.slice(0,5)}`;
    }
    if (sel.customStart && sel.customEnd) return `${sel.customStart} - ${sel.customEnd}`;
    return 'No time set';
  };

  // Group selected by depot
  const selectedByDepot = selectedEngineers.reduce((acc, eng) => {
    const depot = selections[eng.id]?.depotCode || eng.home_depot_code || 'Unknown';
    const depotName = getDepots().find(d => d.code === depot)?.name || depot;
    if (!acc[depotName]) acc[depotName] = [];
    acc[depotName].push(eng);
    return acc;
  }, {});

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const shifts = selectedEngineers.map(eng => {
        const sel = selections[eng.id];
        return {
          engineer_id: eng.id,
          shift_template_id: sel.templateId ? parseInt(sel.templateId) : null,
          custom_start: !sel.templateId && sel.customStart ? sel.customStart + ':00' : null,
          custom_end: !sel.templateId && sel.customEnd ? sel.customEnd + ':00' : null,
          depot_code: sel.depotCode || eng.home_depot_code
        };
      });

      const response = await apiClient.post('/api/engineer-management/daily-shifts', { shifts });

      if (response.success) {
        // Mark as done for today
        const today = new Date().toISOString().split('T')[0];
        sessionStorage.setItem(`shift_checkin_${today}`, 'done');
        if (onComplete) onComplete(response);
      }
      else setSubmitError(response?.error || 'Check-in could not be saved. Please try again.');
    } catch (error) {
      console.error('Error submitting shift check-in:', error);
      setSubmitError(error?.message && !/^(Server error|HTTP error)/.test(error.message)
        ? error.message
        : 'Check-in could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.setItem(`shift_checkin_${today}`, 'skipped');
    if (onSkip) onSkip();
  };

  if (loading) {
    return (
      <div className="sci-overlay" role="presentation">
        <div className="sci-modal" role="dialog" aria-modal="true" aria-labelledby="sci-title">
          <div className="sci-loading">
            <div className="sci-spinner" />
            <p>Loading engineer roster...</p>
          </div>
        </div>
        <style>{shiftCheckInStyles}</style>
      </div>
    );
  }

  return (
    <div className="sci-overlay" role="presentation">
      <div className="sci-modal" role="dialog" aria-modal="true" aria-labelledby="sci-title">
        {/* Header */}
        <div className="sci-header">
          <div className="sci-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <h2 id="sci-title" className="sci-title">Who's on shift today?</h2>
            <p className="sci-subtitle">Select engineers and assign their shift patterns</p>
          </div>
          <div className="sci-step-indicator">Step {step} of 2</div>
        </div>

        {step === 1 && (
          <div className="sci-body">
            {engineers.length === 0 ? (
              <div className="sci-empty">
                <p>No engineers found. Add engineers from the management page first.</p>
              </div>
            ) : (
              <div className="sci-engineer-list">
                <div className="sci-list-head">
                  <label className="sci-select-all">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    Select all
                  </label>
                  <span className="sci-list-hint">Ticking someone already on shift updates their shift.</span>
                </div>
                {engineers.map(eng => {
                  const sel = selections[eng.id];
                  const skills = Array.isArray(eng.skills) ? eng.skills : [];
                  return (
                    <div key={eng.id} className={`sci-engineer-row ${sel?.checked ? 'sci-selected' : ''}`}>
                      <div className="sci-eng-left">
                        <label className="sci-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={sel?.checked || false}
                            onChange={() => toggleEngineer(eng.id)}
                          />
                          <span className="sci-checkmark" />
                        </label>
                        <div className="sci-eng-info">
                          <span className="sci-eng-name">
                            {eng.name}
                            {rosteredById[eng.id] && (
                              <span className="sci-rostered">
                                On shift {rosteredById[eng.id].shift_start?.slice(0, 5)}–{rosteredById[eng.id].shift_end?.slice(0, 5)}
                              </span>
                            )}
                          </span>
                          <span className="sci-eng-badge">{eng.badge_number}</span>
                          <span className="sci-eng-depot">{getDepots().find(d => d.code === eng.home_depot_code)?.name || eng.home_depot_code || 'No depot'}</span>
                        </div>
                        {skills.length > 0 && (
                          <div className="sci-skills">
                            {skills.slice(0, 3).map((s, i) => (
                              <span key={i} className="sci-skill-pill">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {sel?.checked && (
                        <div className="sci-eng-config">
                          <select
                            className="sci-select"
                            value={sel.templateId || ''}
                            onChange={e => updateSelection(eng.id, 'templateId', e.target.value || null)}
                          >
                            <option value="">Custom hours</option>
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.start_time?.slice(0,5)} - {t.end_time?.slice(0,5)})
                              </option>
                            ))}
                          </select>

                          {!sel.templateId && (
                            <div className="sci-time-row">
                              <input
                                type="time"
                                className="sci-time-input"
                                value={sel.customStart}
                                onChange={e => updateSelection(eng.id, 'customStart', e.target.value)}
                                placeholder="Start"
                              />
                              <span className="sci-time-sep">to</span>
                              <input
                                type="time"
                                className="sci-time-input"
                                value={sel.customEnd}
                                onChange={e => updateSelection(eng.id, 'customEnd', e.target.value)}
                                placeholder="End"
                              />
                            </div>
                          )}

                          <select
                            className="sci-select sci-depot-select"
                            value={sel.depotCode}
                            onChange={e => updateSelection(eng.id, 'depotCode', e.target.value)}
                          >
                            {getDepots().map(d => (
                              <option key={d.code} value={d.code}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sci-footer">
              <button className="sci-btn sci-btn-skip" onClick={handleSkip}>{dismissLabel}</button>
              {missingTimes.length > 0 && (
                <span className="sci-footer-warn">Set hours for {missingTimes.map(e => e.name.split(' ')[0]).join(', ')}</span>
              )}
              <button
                className="sci-btn sci-btn-next"
                disabled={selectedEngineers.length === 0 || missingTimes.length > 0}
                onClick={() => setStep(2)}
              >
                Next ({selectedEngineers.length} selected)
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sci-body">
            <div className="sci-confirm">
              <h3 className="sci-confirm-title">Confirm Shift Check-In</h3>

              {Object.entries(selectedByDepot).map(([depotName, engs]) => (
                <div key={depotName} className="sci-confirm-depot">
                  <div className="sci-confirm-depot-header">
                    <span className="sci-confirm-depot-name">{depotName}</span>
                    <span className="sci-confirm-depot-count">{engs.length} engineer{engs.length !== 1 ? 's' : ''}</span>
                  </div>
                  {engs.map(eng => (
                    <div key={eng.id} className="sci-confirm-eng">
                      <span className="sci-confirm-eng-name">{eng.name}</span>
                      <span className="sci-confirm-eng-time">{getShiftTime(eng.id)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {submitError && <div className="sci-error" role="alert">{submitError}</div>}
            <div className="sci-footer">
              <button className="sci-btn sci-btn-back" onClick={() => setStep(1)}>Back</button>
              <button
                className="sci-btn sci-btn-confirm"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Saving...' : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{shiftCheckInStyles}</style>
    </div>
  );
};

const shiftCheckInStyles = `
  .sci-list-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    position: sticky; top: 0; z-index: 1;
    background: #0d1420;
  }
  .sci-select-all { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #cbd5e1; cursor: pointer; }
  .sci-select-all input { width: 16px; height: 16px; accent-color: #0097A7; }
  .sci-list-hint { font-size: 11px; color: #64748b; }
  .sci-rostered {
    margin-left: 8px;
    padding: 1px 7px;
    border-radius: 10px;
    background: rgba(16,185,129,0.1);
    border: 1px solid rgba(16,185,129,0.3);
    color: #6ee7b7;
    font-size: 10px; font-weight: 600;
    font-family: var(--font-mono, 'JetBrains Mono'), monospace;
    vertical-align: middle;
  }
  .sci-footer-warn { font-size: 12px; color: #fbbf24; margin-left: auto; }
  .sci-error {
    margin: 0 20px 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.35);
    color: #fecaca;
    font-size: 13px;
  }
  .sci-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
    backdrop-filter: blur(6px);
  }

  .sci-modal {
    background: #0d1420;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    max-width: 680px;
    width: 100%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    overflow: hidden;
  }

  .sci-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: relative;
  }

  .sci-header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #0097A7, #22d3ee, transparent);
  }

  .sci-header-icon {
    width: 44px; height: 44px;
    background: rgba(0,188,212,0.12);
    border: 1px solid rgba(0,188,212,0.25);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #22d3ee;
    flex-shrink: 0;
  }

  .sci-title {
    color: #f1f5f9; font-size: 18px; font-weight: 700;
    font-family: 'Outfit', sans-serif; margin: 0;
  }

  .sci-subtitle {
    color: #94a3b8; font-size: 13px; margin: 2px 0 0;
    font-family: 'Inter', sans-serif;
  }

  .sci-step-indicator {
    margin-left: auto;
    background: rgba(0,151,167,0.15);
    color: #22d3ee;
    border: 1px solid rgba(0,151,167,0.25);
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }

  .sci-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .sci-loading {
    text-align: center; padding: 60px 20px; color: #94a3b8;
    font-family: 'Inter', sans-serif;
  }

  .sci-spinner {
    width: 36px; height: 36px;
    border: 3px solid #1e293b; border-top-color: #0097A7;
    border-radius: 50%;
    animation: sci-spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes sci-spin { to { transform: rotate(360deg); } }

  .sci-empty {
    text-align: center; padding: 40px 20px; color: #64748b;
    font-size: 14px; font-family: 'Inter', sans-serif;
  }

  .sci-engineer-list {
    flex: 1; overflow-y: auto; padding: 8px 0;
  }

  .sci-engineer-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
  }

  .sci-engineer-row:hover { background: rgba(255,255,255,0.02); }
  .sci-engineer-row.sci-selected { background: rgba(0,151,167,0.06); }

  .sci-eng-left {
    display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px;
  }

  .sci-checkbox-wrap {
    position: relative; cursor: pointer;
    display: flex; align-items: center;
  }

  .sci-checkbox-wrap input {
    width: 18px; height: 18px; cursor: pointer;
    accent-color: #0097A7;
  }

  .sci-eng-info {
    display: flex; flex-direction: column; gap: 2px;
  }

  .sci-eng-name {
    font-size: 14px; font-weight: 600; color: #e2e8f0;
    font-family: 'Outfit', sans-serif;
  }

  .sci-eng-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #64748b;
  }

  .sci-eng-depot {
    font-size: 11px; color: #94a3b8;
    font-family: 'Inter', sans-serif;
  }

  .sci-skills {
    display: flex; gap: 4px; flex-wrap: wrap;
  }

  .sci-skill-pill {
    font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
    padding: 2px 6px; border-radius: 3px;
    background: rgba(0,151,167,0.12);
    color: #22d3ee;
    border: 1px solid rgba(0,151,167,0.2);
  }

  .sci-eng-config {
    width: 100%;
    display: flex; flex-wrap: wrap; gap: 8px;
    padding: 8px 0 0 30px;
  }

  .sci-select {
    background: #1e293b;
    border: 1px solid rgba(255,255,255,0.1);
    color: #e2e8f0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-family: 'Inter', sans-serif;
    min-width: 0;
    flex: 1;
  }

  .sci-depot-select { max-width: 140px; flex: 0 0 auto; }

  .sci-time-row {
    display: flex; align-items: center; gap: 6px;
  }

  .sci-time-input {
    background: #1e293b;
    border: 1px solid rgba(255,255,255,0.1);
    color: #e2e8f0;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    width: 100px;
  }

  .sci-time-sep {
    color: #475569; font-size: 12px;
  }

  /* Confirm step */
  .sci-confirm {
    padding: 20px;
  }

  .sci-confirm-title {
    font-size: 16px; font-weight: 700; color: #e2e8f0;
    font-family: 'Outfit', sans-serif;
    margin: 0 0 16px;
  }

  .sci-confirm-depot {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
  }

  .sci-confirm-depot-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 14px;
    background: rgba(0,151,167,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .sci-confirm-depot-name {
    font-size: 13px; font-weight: 700; color: #22d3ee;
    text-transform: uppercase; letter-spacing: 0.5px;
    font-family: 'Outfit', sans-serif;
  }

  .sci-confirm-depot-count {
    font-size: 11px; color: #94a3b8;
    font-family: 'Inter', sans-serif;
  }

  .sci-confirm-eng {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
  }

  .sci-confirm-eng:last-child { border-bottom: none; }

  .sci-confirm-eng-name {
    font-size: 13px; color: #e2e8f0; font-weight: 500;
    font-family: 'Outfit', sans-serif;
  }

  .sci-confirm-eng-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #94a3b8;
  }

  /* Footer */
  .sci-footer {
    display: flex; gap: 10px; align-items: center;
    padding: 16px 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.2);
  }

  .sci-btn {
    padding: 10px 20px;
    border: none; border-radius: 8px;
    font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
    letter-spacing: 0.3px;
  }

  .sci-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .sci-btn-skip {
    background: rgba(255,255,255,0.06);
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .sci-btn-skip:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

  .sci-btn-next, .sci-btn-confirm {
    flex: 1;
    background: linear-gradient(135deg, #0097A7, #00838F);
    color: white;
  }
  .sci-btn-next:hover:not(:disabled), .sci-btn-confirm:hover:not(:disabled) {
    background: linear-gradient(135deg, #00ACC1, #0097A7);
    box-shadow: 0 4px 14px rgba(0,151,167,0.3);
  }

  .sci-btn-back {
    background: rgba(255,255,255,0.06);
    color: #94a3b8;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .sci-btn-back:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }
`;

export default ShiftCheckInModal;
