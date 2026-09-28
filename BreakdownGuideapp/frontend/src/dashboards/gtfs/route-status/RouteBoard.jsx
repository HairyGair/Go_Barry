/**
 * Route Status — the whole network at a glance
 *
 * Every route as a tile coloured by status. Searching dims non-matching tiles;
 * picking an affected route jumps to its card, picking any route shows a short
 * summary with a link to its timetable.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CalendarDays, X } from 'lucide-react';
import { STATUS_META } from './RouteIssueCard';

const RouteBoard = ({ routes, onJumpToRoute }) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return new Set(routes
      .filter(r => String(r.routeShortName || '').toLowerCase().startsWith(q)
        || (r.destinations || []).some(d => d.toLowerCase().includes(q)))
      .map(r => r.routeId));
  }, [routes, q]);

  const sorted = useMemo(
    () => [...routes].sort((a, b) => String(a.routeShortName).localeCompare(String(b.routeShortName), undefined, { numeric: true })),
    [routes]
  );

  const selected = routes.find(r => r.routeId === selectedId) || null;

  const pick = (route) => {
    setSelectedId(route.routeId);
    if (route.status !== 'GREEN') onJumpToRoute(route);
  };

  const onSearchKey = (e) => {
    // Enter opens the single/first match - quick "is the 21 OK?" check
    if (e.key !== 'Enter' || !matches) return;
    const first = sorted.find(r => matches.has(r.routeId));
    if (first) pick(first);
  };

  return (
    <section className="rst-board" aria-labelledby="rst-board-title">
      <div className="rst-board-head">
        <h3 id="rst-board-title">All routes</h3>
        <span className="rst-board-sub">{routes.length}</span>
      </div>

      <label className="rst-search">
        <Search size={14} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="Find a route"
          aria-label="Find a route by number or destination"
        />
      </label>

      {selected && (
        <div className={`rst-pick rst-pick-${STATUS_META[selected.status].tone}`} role="status">
          <span className={`rst-route rst-route-${STATUS_META[selected.status].tone}`}>{selected.routeShortName}</span>
          <div className="rst-pick-text">
            <strong>{STATUS_META[selected.status].label}</strong>
            <span>
              {selected.breakdownCount
                ? `${selected.breakdownCount} open breakdown${selected.breakdownCount === 1 ? '' : 's'}`
                : 'No open breakdowns'}
              {selected.diversions?.length ? ` · ${selected.diversions.length} diversion${selected.diversions.length === 1 ? '' : 's'}` : ''}
              {selected.destinations?.length ? ` · ${selected.destinations.join(' ↔ ')}` : ''}
            </span>
          </div>
          <Link to={`/dashboards/gtfs/network?route=${encodeURIComponent(selected.routeShortName)}`} className="rst-mini-link">
            <CalendarDays size={13} aria-hidden="true" /> Timetable
          </Link>
          <button type="button" className="rst-icon-btn" onClick={() => setSelectedId(null)} aria-label="Clear selected route">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="rst-tiles" role="group" aria-label="Route status by route number">
        {sorted.map(r => {
          const meta = STATUS_META[r.status];
          const dim = matches && !matches.has(r.routeId);
          return (
            <button
              key={r.routeId}
              type="button"
              className={`rst-tile rst-tile-${meta.tone} ${r.diversions?.length ? 'rst-tile-diverted' : ''} ${dim ? 'rst-tile-dim' : ''} ${selectedId === r.routeId ? 'rst-tile-on' : ''}`}
              onClick={() => pick(r)}
              title={`Route ${r.routeShortName} · ${meta.label}${r.diversions?.length ? ' · Diverted' : ''}${r.breakdownCount ? ` · ${r.breakdownCount} breakdown${r.breakdownCount === 1 ? '' : 's'}` : ''}${r.destinations?.length ? ` · ${r.destinations.join(' ↔ ')}` : ''}`}
              aria-label={`Route ${r.routeShortName}, ${meta.label}`}
            >
              {r.routeShortName}
            </button>
          );
        })}
      </div>

      <div className="rst-legend" aria-hidden="true">
        <span><i className="rst-sw rst-sw-red" />Disrupted</span>
        <span><i className="rst-sw rst-sw-amber" />Affected</span>
        <span><i className="rst-sw rst-sw-green" />Normal</span>
        <span><i className="rst-sw rst-sw-diverted" />Diverted</span>
      </div>
    </section>
  );
};

export default RouteBoard;
