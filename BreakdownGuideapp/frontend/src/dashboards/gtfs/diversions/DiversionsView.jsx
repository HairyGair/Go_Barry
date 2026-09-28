/**
 * Diversions — list, planner and detail (Timetables & Stops, third view)
 *
 * Planner flow:
 *   1. choose a route and direction - its road path and stops are drawn
 *   2. click where the road is closed - the app finds where buses leave the
 *      route (A) and rejoin it (B) and asks Google for road options between them
 *   3. compare options (extra miles/minutes, stops missed, stops passed); leave
 *      earlier / rejoin later, or add via points to force a road
 *   4. name it, set when it applies, save - it then shows on Route Status,
 *      timetables and stops, with a printable driver sheet
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, ArrowLeft, Construction, MapPin, AlertTriangle, Printer, Route as RouteIcon,
  ChevronLeft, ChevronRight, MousePointerClick, Trash2, CheckCircle2, Clock, Loader2, Repeat,
} from 'lucide-react';
import { gtfsApiService } from '../../../services/gtfsApiService';
import DiversionMap from './DiversionMap';
import DriverSheet from './DriverSheet';
import {
  REASONS, reasonLabel, getGeometry, planDiversion, getRoadOptions, listDiversions, getDiversion,
  saveDiversion, updateDiversion, fmtDateTime, fmtMiles, fmtMinutes, toLocalInput, STATE_META,
} from './diversionsApi';
import './Diversions.css';

const errText = (e, fallback) => {
  const m = e?.message || '';
  return !m || /^(Server error|HTTP error)/.test(m) ? fallback : m;
};

// ── List ──────────────────────────────────────────────────────────────────────

const DiversionItem = ({ d, onOpen }) => {
  const meta = STATE_META[d.state] || STATE_META.past;
  return (
    <button type="button" className={`dvs-item dvs-item-${meta.tone}`} onClick={() => onOpen(d.id)}>
      <span className="dvs-route">{d.routeShortName}</span>
      <span className="dvs-item-main">
        <span className="dvs-item-title">{d.title}</span>
        <span className="dvs-item-sub">
          {d.directionLabel ? `To ${d.directionLabel} · ` : ''}
          {d.state === 'upcoming' ? `Starts ${fmtDateTime(d.startAt)}` : d.endAt ? `Until ${fmtDateTime(d.endAt)}` : 'Until further notice'}
        </span>
      </span>
      <span className={`dvs-state dvs-state-${meta.tone}`}>{meta.label}</span>
    </button>
  );
};

const DiversionList = ({ items, loading, onOpen, onNew }) => {
  const [showPast, setShowPast] = useState(false);
  const groups = {
    current: items.filter(d => d.state === 'current'),
    upcoming: items.filter(d => d.state === 'upcoming'),
    past: items.filter(d => d.state === 'past'),
  };
  return (
    <div className="dvs-panel-body">
      <button type="button" className="dvs-btn dvs-btn-primary dvs-btn-block" onClick={onNew}>
        <Plus size={15} aria-hidden="true" /> Plan a diversion
      </button>
      {loading ? (
        <div className="dvs-skel-list"><div className="dvs-skel" /><div className="dvs-skel" /></div>
      ) : items.length === 0 ? (
        <div className="dvs-empty">
          <Construction size={26} aria-hidden="true" />
          <h4>No diversions yet</h4>
          <p>When a road is closed, plan a diversion here. It will show on Route Status, timetables and stops, with a sheet for drivers.</p>
        </div>
      ) : (
        <>
          <section className="dvs-group">
            <h4>In force <span>{groups.current.length}</span></h4>
            {groups.current.length ? groups.current.map(d => <DiversionItem key={d.id} d={d} onOpen={onOpen} />)
              : <p className="dvs-muted">No diversions in force right now.</p>}
          </section>
          {groups.upcoming.length > 0 && (
            <section className="dvs-group">
              <h4>Planned <span>{groups.upcoming.length}</span></h4>
              {groups.upcoming.map(d => <DiversionItem key={d.id} d={d} onOpen={onOpen} />)}
            </section>
          )}
          {groups.past.length > 0 && (
            <section className="dvs-group">
              <button type="button" className="dvs-link" onClick={() => setShowPast(v => !v)} aria-expanded={showPast}>
                {showPast ? 'Hide' : 'Show'} finished ({groups.past.length})
              </button>
              {showPast && groups.past.map(d => <DiversionItem key={d.id} d={d} onOpen={onOpen} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
};

// ── Planner ───────────────────────────────────────────────────────────────────

const StopList = ({ title, stops, tone, empty }) => (
  <div className={`dvs-stops dvs-stops-${tone}`}>
    <h5>{title} <span>{stops.length}</span></h5>
    {stops.length ? (
      <ul>{stops.map(s => <li key={s.stopId}>{s.name}</li>)}</ul>
    ) : <p className="dvs-muted">{empty}</p>}
  </div>
);

const Planner = ({ routes, initialRoute, onCancel, onSaved, preset }) => {
  const [routeQuery, setRouteQuery] = useState(preset?.routeShortName || initialRoute || '');
  const [routeShort, setRouteShort] = useState(preset?.routeShortName || null);
  const [directionId, setDirectionId] = useState(preset?.directionId ?? null);
  const [geometry, setGeometry] = useState(null);
  const [plan, setPlan] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [closure, setClosure] = useState(null);
  const [closureEnd, setClosureEnd] = useState(null);
  const [via, setVia] = useState([]);
  const [override, setOverride] = useState({ fromStopId: null, toStopId: null });
  const [clickMode, setClickMode] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [fitKey, setFitKey] = useState(0);
  const [form, setForm] = useState(() => ({
    title: '',
    reason: preset?.reason || 'road_closure',
    closureDescription: preset?.closureDescription || '',
    startAt: toLocalInput(new Date()),
    endAt: preset?.endAt ? toLocalInput(preset.endAt) : '',
    notes: preset?.notes || '',
  }));
  const [saving, setSaving] = useState(false);

  const routeMatches = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    if (!q || routeShort) return [];
    return routes.filter(r => String(r.routeShortName).toLowerCase().startsWith(q)).slice(0, 12);
  }, [routes, routeQuery, routeShort]);

  const loadRoute = useCallback(async (short, dir) => {
    setBusy('route');
    setError('');
    setPlan(null); setCandidates([]); setSelectedId(null); setClosure(null); setClosureEnd(null); setVia([]);
    setOverride({ fromStopId: null, toStopId: null });
    try {
      const res = await getGeometry(short, dir);
      setGeometry(res.geometry);
      setRouteShort(res.geometry.route.shortName);
      setRouteQuery(res.geometry.route.shortName);
      setDirectionId(res.geometry.directionId);
      setClickMode('closure');
      setFitKey(k => k + 1);
    } catch (e) {
      setGeometry(null);
      setError(errText(e, 'That route couldn’t be loaded.'));
    } finally {
      setBusy('');
    }
  }, []);

  // Preset (e.g. "plan the other direction") or ?route= - load straight away
  useEffect(() => {
    if (preset?.routeShortName) loadRoute(preset.routeShortName, preset.directionId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runPlan = useCallback(async ({ closurePt = closure, endPt = closureEnd, viaPts = via, ov = override } = {}) => {
    if (!closurePt || !routeShort) return;
    setBusy('plan');
    setError('');
    const base = {
      routeShortName: routeShort,
      directionId,
      closure: { lat: closurePt[0], lng: closurePt[1] },
      closureEnd: endPt ? { lat: endPt[0], lng: endPt[1] } : null,
      via: viaPts,
      fromStopId: ov.fromStopId,
      toStopId: ov.toStopId,
    };
    try {
      // 1. where the bus leaves and rejoins, 2. road options, 3. check them
      const seg = await planDiversion({ ...base, clientDirections: true });
      setPlan(seg.plan);
      let options = [];
      try {
        options = await getRoadOptions(seg.plan.from, seg.plan.to, viaPts);
      } catch (e) {
        setCandidates([]);
        setError(errText(e, 'Road directions aren’t available right now.'));
        return;
      }
      // Google doesn't know about the closure, so its own suggestions often run
      // straight through it - also try routes steered round either side
      if (!viaPts.length && seg.plan.detourVias?.length) {
        const detours = await Promise.allSettled(
          seg.plan.detourVias.map(v => getRoadOptions(seg.plan.from, seg.plan.to, [v]))
        );
        detours.forEach(r => { if (r.status === 'fulfilled') options.push(...r.value); });
      }
      const res = await planDiversion({ ...base, candidates: options });
      setPlan(res.plan);
      setCandidates(res.plan.candidates);
      const best = res.plan.candidates.find(c => !c.usesClosedRoad) || res.plan.candidates[0];
      setSelectedId(best?.id || null);
      setFitKey(k => k + 1);
    } catch (e) {
      setPlan(null);
      setCandidates([]);
      setError(errText(e, 'The diversion couldn’t be planned.'));
    } finally {
      setBusy('');
    }
  }, [closure, closureEnd, via, override, routeShort, directionId]);

  const onMapClick = (lat, lng) => {
    if (busy) return;
    if (clickMode === 'closure') {
      // First click: start of the closed stretch - then its end (or plan now)
      setClosure([lat, lng]);
      setClosureEnd(null);
      setVia([]);
      setOverride({ fromStopId: null, toStopId: null });
      setClickMode('closureEnd');
    } else if (clickMode === 'closureEnd') {
      const endPt = [lat, lng];
      setClosureEnd(endPt);
      setClickMode(null);
      runPlan({ endPt, viaPts: [], ov: { fromStopId: null, toStopId: null } });
    } else if (clickMode === 'via') {
      const next = [...via, [lat, lng]];
      setVia(next);
      setClickMode(null);
      runPlan({ viaPts: next });
    }
  };

  const shiftStop = (which, delta) => {
    if (!plan || !geometry) return;
    const idx = (which === 'from' ? plan.from.index : plan.to.index) + delta;
    const stop = geometry.stops[idx];
    if (!stop) return;
    const ov = { ...override, [which === 'from' ? 'fromStopId' : 'toStopId']: stop.stopId };
    setOverride(ov);
    runPlan({ ov });
  };

  const removeVia = (i) => {
    const next = via.filter((_, j) => j !== i);
    setVia(next);
    runPlan({ viaPts: next });
  };

  const selected = candidates.find(c => c.id === selectedId);
  const directionLabel = geometry?.directions?.find(d => d.directionId === directionId)?.headsign || null;
  const defaultTitle = plan
    ? `${form.closureDescription ? `${form.closureDescription} closed` : 'Road closed'} · ${plan.from.name} to ${plan.to.name}`
    : '';

  const save = async () => {
    if (!selected || !plan) return;
    setSaving(true);
    setError('');
    try {
      const res = await saveDiversion({
        routeShortName: routeShort,
        directionId,
        directionLabel,
        title: (form.title || defaultTitle).trim(),
        reason: form.reason,
        closureDescription: form.closureDescription,
        closure: { lat: plan.closure.lat, lng: plan.closure.lng },
        from: { stopId: plan.from.stopId, name: plan.from.name },
        to: { stopId: plan.to.stopId, name: plan.to.name },
        path: selected.path,
        steps: selected.steps,
        missedStops: selected.missedStops,
        servedStops: selected.servedStops,
        extraMiles: selected.extraMiles,
        extraMinutes: selected.extraMinutes,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        notes: form.notes,
      });
      onSaved(res.diversion, { geometry, closure });
    } catch (e) {
      setError(errText(e, 'The diversion couldn’t be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const step = !geometry ? 1 : !plan ? 2 : 3;

  return (
    <div className="dvs">
      <aside className="dvs-panel" aria-label="Plan a diversion">
        <div className="dvs-panel-head">
          <button type="button" className="dvs-icon-btn" onClick={onCancel} aria-label="Back to diversions"><ArrowLeft size={16} /></button>
          <h3>Plan a diversion</h3>
        </div>
        <ol className="dvs-steps" aria-label="Steps">
          <li className={step >= 1 ? 'on' : ''}>Route</li>
          <li className={step >= 2 ? 'on' : ''}>Closure</li>
          <li className={step >= 3 ? 'on' : ''}>Diversion</li>
        </ol>

        <div className="dvs-panel-body">
          {/* 1. Route + direction */}
          <section className="dvs-section">
            <label className="dvs-field">
              <span>Route</span>
              <div className="dvs-route-input">
                <input
                  value={routeQuery}
                  onChange={e => { setRouteQuery(e.target.value); setRouteShort(null); setGeometry(null); setPlan(null); setCandidates([]); }}
                  onKeyDown={e => { if (e.key === 'Enter' && routeMatches[0]) loadRoute(routeMatches[0].routeShortName); }}
                  placeholder="Route number, e.g. 21"
                  autoComplete="off"
                />
                {busy === 'route' && <Loader2 size={15} className="dvs-spin" aria-label="Loading route" />}
              </div>
            </label>
            {routeMatches.length > 0 && (
              <div className="dvs-route-pick" role="listbox" aria-label="Matching routes">
                {routeMatches.map(r => (
                  <button key={r.routeId} type="button" role="option" aria-selected="false" className="dvs-route-chip" onClick={() => loadRoute(r.routeShortName)}>
                    {r.routeShortName}
                  </button>
                ))}
              </div>
            )}
            {geometry && geometry.directions.length > 1 && (
              <div className="dvs-seg" role="group" aria-label="Direction">
                {geometry.directions.map(d => (
                  <button
                    key={d.directionId}
                    type="button"
                    aria-pressed={d.directionId === directionId}
                    className={d.directionId === directionId ? 'on' : ''}
                    onClick={() => loadRoute(routeShort, d.directionId)}
                  >
                    To {d.headsign || `direction ${d.directionId + 1}`}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 2. Closure */}
          {geometry && !plan && clickMode === 'closure' && (
            <div className="dvs-callout">
              <MousePointerClick size={18} aria-hidden="true" />
              <p><strong>Click the route where the closure starts.</strong> Zoom in for accuracy.</p>
            </div>
          )}
          {geometry && !plan && clickMode === 'closureEnd' && (
            <div className="dvs-callout dvs-callout-col">
              <div>
                <MousePointerClick size={18} aria-hidden="true" />
                <p><strong>Now click where the closure ends</strong>, so the whole closed stretch is avoided.</p>
              </div>
              <button type="button" className="dvs-btn" onClick={() => { setClickMode(null); runPlan({ endPt: null, viaPts: [], ov: { fromStopId: null, toStopId: null } }); }}>
                It’s just one point
              </button>
            </div>
          )}

          {busy === 'plan' && (
            <div className="dvs-callout"><Loader2 size={18} className="dvs-spin" aria-hidden="true" /><p>Finding road options…</p></div>
          )}

          {error && <div className="dvs-error" role="alert">{error}</div>}

          {/* 3. Options */}
          {plan && (
            <section className="dvs-section">
              <div className="dvs-endpoints">
                <div>
                  <span className="dvs-badge dvs-badge-a">A</span>
                  <div><small>Leave route after</small><strong>{plan.from.name}</strong></div>
                  <div className="dvs-nudge">
                    <button type="button" className="dvs-icon-btn" onClick={() => shiftStop('from', -1)} disabled={!!busy || plan.from.index === 0} title="Leave one stop earlier" aria-label="Leave one stop earlier"><ChevronLeft size={15} /></button>
                  </div>
                </div>
                <div>
                  <span className="dvs-badge dvs-badge-b">B</span>
                  <div><small>Rejoin at</small><strong>{plan.to.name}</strong></div>
                  <div className="dvs-nudge">
                    <button type="button" className="dvs-icon-btn" onClick={() => shiftStop('to', 1)} disabled={!!busy || plan.to.index >= (geometry?.stops.length || 0) - 1} title="Rejoin one stop later" aria-label="Rejoin one stop later"><ChevronRight size={15} /></button>
                  </div>
                </div>
              </div>

              <h4 className="dvs-h">Diversion options</h4>
              {candidates.length === 0 && busy !== 'plan' && <p className="dvs-muted">No road options yet.</p>}
              <div className="dvs-options" role="radiogroup" aria-label="Diversion options">
                {candidates.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={c.id === selectedId}
                    className={`dvs-option ${c.id === selectedId ? 'on' : ''} ${c.usesClosedRoad ? 'warn' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span className="dvs-option-top">
                      <strong>{c.summary ? `Via ${c.summary}` : 'Direct'}</strong>
                      <span className="dvs-option-nums">
                        <span>{fmtMiles(c.extraMiles)}</span>
                        {c.extraMinutes != null && <span>{fmtMinutes(c.extraMinutes)}</span>}
                      </span>
                    </span>
                    {c.usesClosedRoad ? (
                      <span className="dvs-option-warn"><AlertTriangle size={12} aria-hidden="true" /> Still uses the closed road - add a via point</span>
                    ) : (
                      <span className="dvs-option-sub">
                        {c.missedStops.length} stop{c.missedStops.length === 1 ? '' : 's'} missed · {c.servedStops.length} on the way
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="dvs-row">
                <button
                  type="button"
                  className={`dvs-btn ${clickMode === 'via' ? 'dvs-btn-on' : ''}`}
                  onClick={() => setClickMode(m => (m === 'via' ? null : 'via'))}
                  disabled={!!busy}
                >
                  <RouteIcon size={14} aria-hidden="true" /> {clickMode === 'via' ? 'Click the map…' : 'Add via point'}
                </button>
                {via.length > 0 && (
                  <button type="button" className="dvs-btn" onClick={() => { setVia([]); runPlan({ viaPts: [] }); }} disabled={!!busy}>
                    <Trash2 size={14} aria-hidden="true" /> Clear via points
                  </button>
                )}
                <button type="button" className="dvs-btn" onClick={() => { setPlan(null); setCandidates([]); setClosure(null); setClosureEnd(null); setVia([]); setClickMode('closure'); }} disabled={!!busy}>
                  <MapPin size={14} aria-hidden="true" /> Move closure
                </button>
              </div>

              {selected && (
                <>
                  <StopList title="Stops not served" stops={selected.missedStops} tone="missed" empty="None - every stop is still served." />
                  <StopList title="Stops on the diversion" stops={selected.servedStops} tone="served" empty="No other stops along the diversion." />

                  <h4 className="dvs-h">Details</h4>
                  <label className="dvs-field">
                    <span>Road closed <em>optional</em></span>
                    <input value={form.closureDescription} onChange={e => setForm(f => ({ ...f, closureDescription: e.target.value }))} placeholder="e.g. Durham Road" />
                  </label>
                  <label className="dvs-field">
                    <span>Title</span>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={defaultTitle} />
                  </label>
                  <label className="dvs-field">
                    <span>Reason</span>
                    <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                      {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </label>
                  <div className="dvs-grid2">
                    <label className="dvs-field">
                      <span>Starts</span>
                      <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                    </label>
                    <label className="dvs-field">
                      <span>Ends <em>optional</em></span>
                      <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                    </label>
                  </div>
                  <label className="dvs-field">
                    <span>Notes for drivers <em>optional</em></span>
                    <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Temporary stop outside the library" />
                  </label>
                </>
              )}
            </section>
          )}
        </div>

        {plan && selected && (
          <div className="dvs-panel-foot">
            {selected.usesClosedRoad && <span className="dvs-foot-warn">This option still uses the closed road.</span>}
            <button type="button" className="dvs-btn" onClick={onCancel}>Cancel</button>
            <button type="button" className="dvs-btn dvs-btn-primary" onClick={save} disabled={saving || !!busy}>
              {saving ? 'Saving…' : 'Save diversion'}
            </button>
          </div>
        )}
      </aside>

      <div className="dvs-map">
        <DiversionMap
          geometry={geometry}
          plan={plan}
          candidates={candidates}
          selectedId={selectedId}
          onSelectCandidate={setSelectedId}
          via={via}
          onRemoveVia={removeVia}
          onMapClick={onMapClick}
          clickMode={clickMode}
          pendingClosure={!plan ? closure : null}
          fitKey={fitKey}
        />
        {clickMode && (
          <div className="dvs-map-hint" role="status">
            {clickMode === 'closure' ? 'Click the route where the closure starts'
              : clickMode === 'closureEnd' ? 'Click where the closure ends'
                : 'Click a road the diversion should use'}
          </div>
        )}
        {!geometry && (
          <div className="dvs-map-empty">Choose a route to see it on the map</div>
        )}
      </div>
    </div>
  );
};

// ── Detail ────────────────────────────────────────────────────────────────────

const Detail = ({ id, onBack, onChanged, onPlanOther }) => {
  const [d, setD] = useState(null);
  const [geometry, setGeometry] = useState(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getDiversion(id);
        if (!alive) return;
        setD(res.diversion);
        const g = await getGeometry(res.diversion.routeShortName, res.diversion.directionId).catch(() => null);
        if (alive && g) setGeometry(g.geometry);
      } catch (e) {
        if (alive) setError(errText(e, 'This diversion couldn’t be loaded.'));
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const act = async (action) => {
    setBusy(true);
    setError('');
    try {
      const res = await updateDiversion(id, { action });
      setD(res.diversion);
      setConfirm(null);
      onChanged();
    } catch (e) {
      setError(errText(e, 'That change couldn’t be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const meta = d ? STATE_META[d.state] || STATE_META.past : null;
  const planLike = d ? {
    closure: d.closure ? { lat: d.closure.lat, lng: d.closure.lng } : null,
  } : null;
  const otherDirection = geometry?.directions?.find(x => x.directionId !== d?.directionId);

  return (
    <div className="dvs">
      <aside className="dvs-panel" aria-label="Diversion details">
        <div className="dvs-panel-head">
          <button type="button" className="dvs-icon-btn" onClick={onBack} aria-label="Back to diversions"><ArrowLeft size={16} /></button>
          <h3>Diversion</h3>
          {meta && <span className={`dvs-state dvs-state-${meta.tone}`}>{meta.label}</span>}
        </div>
        <div className="dvs-panel-body">
          {error && <div className="dvs-error" role="alert">{error}</div>}
          {!d ? (!error && <div className="dvs-skel-list"><div className="dvs-skel" /><div className="dvs-skel" /></div>) : (
            <>
              <div className="dvs-detail-head">
                <span className="dvs-route dvs-route-lg">{d.routeShortName}</span>
                <div>
                  <h4>{d.title}</h4>
                  <p className="dvs-muted">{reasonLabel(d.reason)}{d.directionLabel ? ` · To ${d.directionLabel}` : ''}</p>
                </div>
              </div>
              <dl className="dvs-facts">
                <div><dt><Clock size={12} aria-hidden="true" /> From</dt><dd>{fmtDateTime(d.startAt)}</dd></div>
                <div><dt><Clock size={12} aria-hidden="true" /> Until</dt><dd>{d.endAt ? fmtDateTime(d.endAt) : 'Further notice'}</dd></div>
                <div><dt>Extra distance</dt><dd>{fmtMiles(d.extraMiles) || '—'}</dd></div>
                <div><dt>Extra time</dt><dd>{fmtMinutes(d.extraMinutes) || '—'}</dd></div>
              </dl>
              <div className="dvs-endpoints">
                <div><span className="dvs-badge dvs-badge-a">A</span><div><small>Leave route after</small><strong>{d.from.name}</strong></div></div>
                <div><span className="dvs-badge dvs-badge-b">B</span><div><small>Rejoin at</small><strong>{d.to.name}</strong></div></div>
              </div>
              <StopList title="Stops not served" stops={d.missedStops} tone="missed" empty="None - every stop is still served." />
              <StopList title="Stops on the diversion" stops={d.servedStops} tone="served" empty="No other stops along the diversion." />
              {d.notes && <div className="dvs-notes"><h5>Notes for drivers</h5><p>{d.notes}</p></div>}
              <p className="dvs-muted dvs-small">Set up by {d.createdByName || 'a supervisor'} · {fmtDateTime(d.createdAt)}</p>
            </>
          )}
        </div>
        {d && (
          <div className="dvs-panel-foot">
            {confirm ? (
              <>
                <span className="dvs-foot-q">{confirm === 'end' ? 'End this diversion now?' : 'Cancel this planned diversion?'}</span>
                <button type="button" className="dvs-btn" onClick={() => setConfirm(null)} disabled={busy}>Keep</button>
                <button type="button" className="dvs-btn dvs-btn-danger" onClick={() => act(confirm)} disabled={busy}>
                  {confirm === 'end' ? 'End now' : 'Cancel it'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="dvs-btn" onClick={() => setSheet(true)}><Printer size={14} aria-hidden="true" /> Driver sheet</button>
                {otherDirection && d.state !== 'past' && (
                  <button type="button" className="dvs-btn" onClick={() => onPlanOther(d, otherDirection.directionId)}>
                    <Repeat size={14} aria-hidden="true" /> Other direction
                  </button>
                )}
                {d.state === 'current' && <button type="button" className="dvs-btn dvs-btn-danger" onClick={() => setConfirm('end')}><CheckCircle2 size={14} aria-hidden="true" /> End</button>}
                {d.state === 'upcoming' && <button type="button" className="dvs-btn dvs-btn-danger" onClick={() => setConfirm('cancel')}>Cancel</button>}
              </>
            )}
          </div>
        )}
      </aside>
      <div className="dvs-map">
        <DiversionMap geometry={geometry} plan={planLike} savedPath={d?.path} fitKey={`${id}-${d ? 1 : 0}`} />
      </div>
      {sheet && d && <DriverSheet diversion={d} onClose={() => setSheet(false)} />}
    </div>
  );
};

// ── View ──────────────────────────────────────────────────────────────────────

const DiversionsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('diversion');
  const [mode, setMode] = useState(openId ? 'detail' : 'list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [preset, setPreset] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await listDiversions('all');
      setItems(res.diversions || []);
    } catch (e) {
      console.error('Failed to load diversions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    gtfsApiService.getRoutesList().then(res => setRoutes(res?.routes || [])).catch(() => {});
  }, [refresh]);

  const setDiversionParam = (id) => setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    if (id) next.set('diversion', id); else next.delete('diversion');
    return next;
  });

  const open = (id) => { setDiversionParam(id); setMode('detail'); };
  const back = () => { setDiversionParam(null); setPreset(null); setMode('list'); };

  if (mode === 'plan') {
    return (
      <Planner
        key={preset ? `${preset.routeShortName}-${preset.directionId}` : 'new'}
        routes={routes}
        initialRoute={searchParams.get('route') || ''}
        preset={preset}
        onCancel={back}
        onSaved={(saved) => { refresh(); setPreset(null); open(saved.id); }}
      />
    );
  }

  if (mode === 'detail' && openId) {
    return (
      <Detail
        id={openId}
        onBack={back}
        onChanged={refresh}
        onPlanOther={(d, directionId) => {
          setPreset({
            routeShortName: d.routeShortName, directionId, reason: d.reason,
            closureDescription: d.closureDescription, notes: d.notes, endAt: d.endAt,
          });
          setDiversionParam(null);
          setMode('plan');
        }}
      />
    );
  }

  return (
    <div className="dvs">
      <aside className="dvs-panel" aria-label="Diversions">
        <div className="dvs-panel-head"><h3>Diversions</h3></div>
        <DiversionList items={items} loading={loading} onOpen={open} onNew={() => { setPreset(null); setMode('plan'); }} />
      </aside>
      <div className="dvs-map">
        <DiversionsOverviewMap items={items.filter(d => d.state === 'current')} />
      </div>
    </div>
  );
};

/** List view map: just the tiles with a hint (diversion paths load per diversion) */
const DiversionsOverviewMap = ({ items }) => (
  <>
    <DiversionMap fitKey="overview" />
    <div className="dvs-map-empty">
      {items.length
        ? `${items.length} diversion${items.length === 1 ? '' : 's'} in force · open one to see it on the map`
        : 'Plan a diversion to see it here'}
    </div>
  </>
);

export default DiversionsView;
