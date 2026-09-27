/**
 * Engineer Management — Today
 *
 * Who is covering each depot across the day: one row per rostered engineer on a
 * 24-hour axis with a "now" marker, live status (from the jobs list, same rules
 * as the dispatch board) and a warning when a depot has no cover for the rest
 * of the day.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useMemo, useState } from 'react';
import { AlertTriangle, UserPlus, LogOut } from 'lucide-react';
import EngineerEtaCountdown from '../../../components/EngineerEtaCountdown';
import {
  getDepots, depotLabel, hhmm, shiftSegments, minutesOf, liveStatusFor, STATUS_LABEL,
} from './manageHelpers';

const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

const fmtClock = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

/** First minute from now to midnight with nobody on shift at this depot, or null. */
function firstGap(entries, nowMin) {
  const segs = entries.flatMap(e => shiftSegments(e.shift_start, e.shift_end));
  for (let m = nowMin; m < 1440; m += 5) {
    if (!segs.some(([a, b]) => m >= a && m < b)) return m;
  }
  return null;
}

function statusDetail(status, job, entry) {
  if (status === 'en_route' && job) {
    return (
      <>
        <span className="emg-fleet">{job.fleet_no || job.fleet_number}</span>
        {job.engineer_dispatched_at && job.engineer_eta_minutes ? (
          <EngineerEtaCountdown dispatchedAt={job.engineer_dispatched_at} etaMinutes={job.engineer_eta_minutes} compact />
        ) : null}
      </>
    );
  }
  if (status === 'on_site' && job) return <span className="emg-fleet">{job.fleet_no || job.fleet_number}</span>;
  if (status === 'upcoming') return <span className="emg-muted">From {hhmm(entry.shift_start)}</span>;
  if (status === 'off_shift') return <span className="emg-muted">Until {hhmm(entry.shift_end)}</span>;
  return null;
}

const TodayRoster = ({ roster, jobs, now, onCheckIn, onEndShift }) => {
  const [confirmId, setConfirmId] = useState(null);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = (nowMin / 1440) * 100;

  const groups = useMemo(() => {
    const byDepot = new Map();
    // Every depot gets a group, so a depot with nobody rostered is visible
    getDepots().forEach(d => byDepot.set(d.code.toUpperCase(), { code: d.code, name: d.name, entries: [] }));
    roster.forEach(entry => {
      const code = String(entry.shift_depot || entry.home_depot_code || 'NONE').toUpperCase();
      if (!byDepot.has(code)) byDepot.set(code, { code, name: depotLabel(code) || 'No depot', entries: [] });
      byDepot.get(code).entries.push(entry);
    });

    return [...byDepot.values()].map(g => {
      const entries = g.entries
        .map(entry => ({ entry, ...liveStatusFor(entry, entry, jobs) }))
        .sort((a, b) => (minutesOf(a.entry.shift_start) ?? 0) - (minutesOf(b.entry.shift_start) ?? 0)
          || a.entry.name.localeCompare(b.entry.name));
      const working = entries.filter(x => x.status !== 'upcoming' && x.status !== 'off_shift');
      const free = entries.filter(x => x.status === 'available').length;
      const gap = firstGap(g.entries, nowMin);
      return { ...g, entries, workingCount: working.length, free, gap };
    }).sort((a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name));
  }, [roster, jobs, nowMin]);

  if (roster.length === 0) {
    return (
      <div className="emg-empty">
        <h3>Nobody is checked in today</h3>
        <p>Check engineers in for their shift so they appear on the dispatch board and can be sent to breakdowns.</p>
        <button type="button" className="emg-btn emg-btn-primary" onClick={onCheckIn}>
          <UserPlus size={15} aria-hidden="true" /> Check in engineers
        </button>
      </div>
    );
  }

  return (
    <div className="emg-today">
      <div className="emg-today-head">
        <div className="emg-legend" aria-hidden="true">
          <span><i className="emg-swatch emg-sw-available" />Available</span>
          <span><i className="emg-swatch emg-sw-en_route" />En route</span>
          <span><i className="emg-swatch emg-sw-on_site" />On site</span>
          <span><i className="emg-swatch emg-sw-upcoming" />Later today</span>
          <span><i className="emg-swatch emg-sw-off_shift" />Finished</span>
        </div>
      </div>

      <div className="emg-timeline" role="table" aria-label="Today's engineer cover by depot">
        <div className="emg-tl-row emg-tl-axis" role="row">
          <div className="emg-tl-label" role="columnheader">Engineer</div>
          <div className="emg-tl-track" role="columnheader" aria-label="Shift, 00:00 to 24:00">
            {AXIS_HOURS.map(h => (
              <span
                key={h}
                className={`emg-axis-tick ${h === 0 ? 'emg-axis-start' : ''} ${h === 24 ? 'emg-axis-end' : ''}`}
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {String(h).padStart(2, '0')}
              </span>
            ))}
            <span className="emg-now-flag" style={{ left: `${nowPct}%` }}>{fmtClock(nowMin)}</span>
          </div>
        </div>

        {groups.map(g => (
          <div key={g.code} className="emg-tl-group" role="rowgroup">
            <div className="emg-tl-depot" role="row">
              <div className="emg-tl-depot-name" role="rowheader">{g.name}</div>
              <div className="emg-tl-depot-meta">
                {g.entries.length === 0 ? (
                  <span className="emg-warn"><AlertTriangle size={12} aria-hidden="true" /> No engineers rostered</span>
                ) : (
                  <>
                    <span>{g.workingCount} working now · {g.free} free</span>
                    {g.gap !== null && (
                      <span className="emg-warn">
                        <AlertTriangle size={12} aria-hidden="true" />
                        {g.gap <= nowMin ? 'No cover now' : `No cover from ${fmtClock(g.gap)}`}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {g.entries.map(({ entry, status, job }) => {
              const segs = shiftSegments(entry.shift_start, entry.shift_end);
              const canEnd = status !== 'en_route' && status !== 'on_site' && status !== 'off_shift';
              return (
                <div key={entry.id} className={`emg-tl-row emg-row-${status}`} role="row">
                  <div className="emg-tl-label" role="cell">
                    <span className={`emg-dot emg-dot-${status}`} aria-hidden="true" />
                    <div className="emg-tl-who">
                      <span className="emg-name">{entry.name}</span>
                      <span className="emg-tl-sub">
                        <span className={`emg-status-txt emg-st-${status}`}>{STATUS_LABEL[status]}</span>
                        {statusDetail(status, job, entry)}
                      </span>
                    </div>
                    {canEnd && (
                      confirmId === entry.id ? (
                        <span className="emg-inline-confirm">
                          <button type="button" className="emg-link emg-link-danger" onClick={() => { setConfirmId(null); onEndShift(entry); }}>Sign off</button>
                          <button type="button" className="emg-link" onClick={() => setConfirmId(null)}>Keep</button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="emg-icon-btn emg-row-action"
                          onClick={() => setConfirmId(entry.id)}
                          aria-label={`Sign ${entry.name} off for today`}
                          title="Sign off for today"
                        >
                          <LogOut size={14} />
                        </button>
                      )
                    )}
                  </div>
                  <div className="emg-tl-track" role="cell">
                    {AXIS_HOURS.slice(1, -1).map(h => (
                      <span key={h} className="emg-grid" style={{ left: `${(h / 24) * 100}%` }} aria-hidden="true" />
                    ))}
                    {segs.map(([a, b], i) => (
                      <span
                        key={i}
                        className={`emg-bar emg-bar-${status}`}
                        style={{ left: `${(a / 1440) * 100}%`, width: `${((b - a) / 1440) * 100}%` }}
                      >
                        {i === 0 && (
                          <span className="emg-bar-text">
                            {hhmm(entry.shift_start)}–{hhmm(entry.shift_end)}
                            {entry.template_name ? ` · ${entry.template_name}` : ''}
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="emg-now-line" style={{ left: `${nowPct}%` }} aria-hidden="true" />
                    <span className="emg-sr-only">
                      {hhmm(entry.shift_start)} to {hhmm(entry.shift_end)}, {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodayRoster;
