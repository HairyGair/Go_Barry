/**
 * Route Status — an affected route and its open breakdowns
 *
 * Each breakdown shows severity, vehicle, fault, where, how long it has been
 * open and where the engineer is; clicking one opens it in Operations.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, MapPin, Wrench, CalendarDays } from 'lucide-react';
import EngineerEtaCountdown from '../../../components/EngineerEtaCountdown';
import { displayDepotName } from '../../../config/demoDepots';

export const STATUS_META = {
  RED: { label: 'Disrupted', tone: 'red' },
  AMBER: { label: 'Affected', tone: 'amber' },
  GREEN: { label: 'Running normally', tone: 'green' },
};

const SEVERITY_LABEL = { STOP: 'Off road', AMBER: 'Amber', CONTINUE: 'Continuing' };

export function openFor(createdAt, now = Date.now()) {
  if (!createdAt) return '';
  const mins = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

const titleCase = (s) => String(s || '')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, c => c.toUpperCase());

export const EngineerState = ({ b }) => {
  if (b.engineerOnSiteAt) {
    return <span className="rst-eng rst-eng-onsite"><Wrench size={11} aria-hidden="true" />{b.engineerName ? `${b.engineerName} on site` : 'Engineer on site'}</span>;
  }
  if (b.engineerDispatchedAt) {
    return (
      <span className="rst-eng rst-eng-enroute">
        {b.engineerName ? `${b.engineerName} en route` : 'Engineer en route'}
        {b.engineerEtaMinutes ? (
          <EngineerEtaCountdown dispatchedAt={b.engineerDispatchedAt} etaMinutes={b.engineerEtaMinutes} compact />
        ) : null}
      </span>
    );
  }
  return <span className="rst-eng rst-eng-waiting">Awaiting engineer</span>;
};

export const BreakdownLine = ({ b, now }) => {
  const age = openFor(b.createdAt, now);
  const stale = b.createdAt && now - new Date(b.createdAt).getTime() > 24 * 3600 * 1000;
  return (
    <Link
      to={`/dashboards/sdc?fleet=${encodeURIComponent(b.fleetNo || '')}`}
      className="rst-bd"
      aria-label={`Fleet ${b.fleetNo}, ${titleCase(b.issueCategory) || 'breakdown'}, open ${age}. Open in Operations`}
    >
      <span className={`rst-sev rst-sev-${(b.severity || 'unknown').toLowerCase()}`}>
        {SEVERITY_LABEL[b.severity] || 'Unrated'}
      </span>
      <span className="rst-bd-fleet">{b.fleetNo || '—'}</span>
      <span className="rst-bd-main">
        <span className="rst-bd-issue">{titleCase(b.issueCategory) || 'Breakdown'}</span>
        <span className="rst-bd-where">
          {b.location && <><MapPin size={11} aria-hidden="true" />{b.location}</>}
          {b.depot && <span className="rst-bd-depot">{displayDepotName(b.depot)}</span>}
          {b.routeRef && <span className="rst-bd-depot" title="This route isn’t in the loaded timetable data">Route {b.routeRef} not recognised</span>}
        </span>
      </span>
      <span className="rst-bd-side">
        <span className={`rst-bd-age ${stale ? 'rst-bd-age-stale' : ''}`} title={stale ? 'Open for more than a day - check it is still current' : undefined}>
          <Clock size={11} aria-hidden="true" />{age}
        </span>
        <EngineerState b={b} />
      </span>
      <ChevronRight size={16} className="rst-bd-chev" aria-hidden="true" />
    </Link>
  );
};

const RouteIssueCard = forwardRef(({ route, now, highlighted }, ref) => {
  const meta = STATUS_META[route.status] || STATUS_META.AMBER;
  const dest = route.destinations || [];
  return (
    <article
      ref={ref}
      className={`rst-card rst-card-${meta.tone} ${highlighted ? 'rst-card-flash' : ''}`}
      aria-label={`Route ${route.routeShortName}, ${meta.label}`}
      tabIndex={-1}
    >
      <header className="rst-card-head">
        <span className={`rst-route rst-route-${meta.tone}`}>{route.routeShortName}</span>
        <div className="rst-card-title">
          <span className={`rst-status rst-status-${meta.tone}`}>{meta.label}</span>
          {dest.length > 0 && (
            <span className="rst-dest">{dest.join(' ↔ ')}</span>
          )}
        </div>
        <span className="rst-card-count">
          {route.breakdownCount} breakdown{route.breakdownCount === 1 ? '' : 's'}
        </span>
        <Link
          to={`/dashboards/gtfs/timetable?route=${encodeURIComponent(route.routeShortName)}`}
          className="rst-mini-link"
          title={`Timetable for route ${route.routeShortName}`}
        >
          <CalendarDays size={13} aria-hidden="true" /> Timetable
        </Link>
      </header>
      <div className="rst-bd-list">
        {route.breakdowns.map(b => <BreakdownLine key={b.id} b={b} now={now} />)}
      </div>
    </article>
  );
});

RouteIssueCard.displayName = 'RouteIssueCard';

export default RouteIssueCard;
