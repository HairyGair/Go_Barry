/**
 * Engineer Management — Engineers directory
 *
 * Searchable, filterable table of every engineer with home depot, skills,
 * today's shift and live status (the old cards showed the stored `status`
 * column, which nothing keeps current - every engineer read "Available").
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useMemo, useState } from 'react';
import { Search, Pencil, UserX, Phone } from 'lucide-react';
import { getDepots, depotLabel, hhmm, liveStatusFor, STATUS_LABEL } from './manageHelpers';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'working', label: 'Working now' },
  { id: 'available', label: 'Available' },
  { id: 'busy', label: 'On a job' },
  { id: 'not_rostered', label: 'Not rostered' },
];

const matchesFilter = (filter, status) => {
  switch (filter) {
    case 'working': return ['available', 'en_route', 'on_site'].includes(status);
    case 'available': return status === 'available';
    case 'busy': return status === 'en_route' || status === 'on_site';
    case 'not_rostered': return status === 'not_rostered';
    default: return true;
  }
};

const EngineersTable = ({ engineers, rosterById, jobs, onEdit, onDeactivate }) => {
  const [query, setQuery] = useState('');
  const [depot, setDepot] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmId, setConfirmId] = useState(null);

  const rows = useMemo(() => engineers.map(eng => {
    const entry = rosterById[eng.id];
    return { eng, entry, ...liveStatusFor(eng, entry, jobs) };
  }), [engineers, rosterById, jobs]);

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach(f => { c[f.id] = rows.filter(r => matchesFilter(f.id, r.status)).length; });
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ eng, status }) => {
      if (!matchesFilter(filter, status)) return false;
      if (depot && String(eng.home_depot_code || '').toUpperCase() !== depot.toUpperCase()) return false;
      if (!q) return true;
      const skills = Array.isArray(eng.skills) ? eng.skills.join(' ') : '';
      return `${eng.name} ${eng.badge_number} ${skills}`.toLowerCase().includes(q);
    });
  }, [rows, query, depot, filter]);

  return (
    <div className="emg-directory">
      <div className="emg-toolbar">
        <label className="emg-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search name, badge or skill"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search engineers"
          />
        </label>
        <select className="emg-select" value={depot} onChange={e => setDepot(e.target.value)} aria-label="Filter by home depot">
          <option value="">All depots</option>
          {getDepots().map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
        </select>
        <div className="emg-chips" role="group" aria-label="Filter by status">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className={`emg-chip ${filter === f.id ? 'emg-chip-on' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}<span className="emg-chip-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="emg-table-wrap">
        <table className="emg-table">
          <thead>
            <tr>
              <th scope="col">Engineer</th>
              <th scope="col">Home depot</th>
              <th scope="col">Skills</th>
              <th scope="col">Today</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="emg-sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ eng, entry, status, job }) => {
              const skills = Array.isArray(eng.skills) ? eng.skills : [];
              return (
                <tr key={eng.id} className={`emg-tr-${status}`}>
                  <td>
                    <div className="emg-cell-who">
                      <span className="emg-avatar" aria-hidden="true">
                        {eng.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                      </span>
                      <div>
                        <div className="emg-name">{eng.name}</div>
                        <div className="emg-badge-no">
                          {eng.badge_number}
                          {eng.phone && (
                            <a className="emg-phone" href={`tel:${eng.phone}`}><Phone size={11} aria-hidden="true" />{eng.phone}</a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{depotLabel(eng.home_depot_code) || <span className="emg-muted">Not set</span>}</td>
                  <td>
                    <div className="emg-skills">
                      {skills.length ? skills.map(s => <span key={s} className="emg-skill">{s}</span>) : <span className="emg-muted">None listed</span>}
                    </div>
                  </td>
                  <td className="emg-mono">
                    {entry ? (
                      <>
                        {hhmm(entry.shift_start)}–{hhmm(entry.shift_end)}
                        {entry.shift_depot && String(entry.shift_depot).toUpperCase() !== String(eng.home_depot_code || '').toUpperCase() && (
                          <div className="emg-muted emg-small">at {depotLabel(entry.shift_depot)}</div>
                        )}
                      </>
                    ) : <span className="emg-muted">Not rostered</span>}
                  </td>
                  <td>
                    <span className={`emg-pill emg-pill-${status}`}>
                      <span className={`emg-dot emg-dot-${status}`} aria-hidden="true" />
                      {status === 'upcoming' && entry ? `From ${hhmm(entry.shift_start)}` : STATUS_LABEL[status]}
                    </span>
                    {job && (
                      <div className="emg-job-line">
                        Fleet <span className="emg-fleet">{job.fleet_no || job.fleet_number}</span>
                        {job.location_description ? <span className="emg-muted"> · {job.location_description}</span> : null}
                      </div>
                    )}
                  </td>
                  <td className="emg-actions">
                    {confirmId === eng.id ? (
                      <span className="emg-inline-confirm">
                        <span className="emg-muted emg-small">Deactivate?</span>
                        <button type="button" className="emg-link emg-link-danger" onClick={() => { setConfirmId(null); onDeactivate(eng); }}>Yes</button>
                        <button type="button" className="emg-link" onClick={() => setConfirmId(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button type="button" className="emg-icon-btn" onClick={() => onEdit(eng)} aria-label={`Edit ${eng.name}`} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="emg-icon-btn emg-icon-danger"
                          onClick={() => setConfirmId(eng.id)}
                          aria-label={`Deactivate ${eng.name}`}
                          title="Deactivate"
                          disabled={status === 'en_route' || status === 'on_site'}
                        >
                          <UserX size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="emg-empty emg-empty-slim">
            <p>{engineers.length === 0 ? 'No engineers yet. Add your first engineer to start rostering.' : 'No engineers match these filters.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineersTable;
