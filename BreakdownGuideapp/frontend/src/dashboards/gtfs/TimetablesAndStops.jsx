/**
 * Timetables & Stops
 *
 * One page for the two things supervisors look up when a driver calls:
 *  - Route timetable: the full day's schedule for a route
 *  - Stops: find a stop on the map and see what's due there
 *
 * The URL holds both the route and the stop (?view=&route=&stop=), so switching
 * views keeps your place, and a stop in a timetable / a route at a stop jumps
 * straight across without leaving the page.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useCallback } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import RouteTimetableViewer from './RouteTimetableViewer';
import StopFinder from './StopFinder';
import './TimetablesAndStops.css';

const VIEWS = [
  { id: 'timetable', label: 'Route timetable', Icon: CalendarDays },
  { id: 'stops', label: 'Stops & departures', Icon: MapPin },
];

const TimetablesAndStops = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'stops' ? 'stops' : 'timetable';
  const route = searchParams.get('route');

  const setParams = useCallback((changes) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') next.delete(k);
        else next.set(k, v);
      });
      return next;
    });
  }, [setSearchParams]);

  const openStop = useCallback((stopId) => setParams({ view: 'stops', stop: stopId }), [setParams]);
  const openRoute = useCallback((short) => setParams({ view: 'timetable', route: short }), [setParams]);

  return (
    <DashboardLayout title="Timetables & Stops">
      <div className="tns-page">
        <header className="tns-header">
          <div className="tns-header-left">
            <div className="tns-header-icon"><Clock size={20} aria-hidden="true" /></div>
            <div>
              <h2>Timetables &amp; Stops</h2>
              <p>Check a route’s schedule or what’s due at a stop</p>
            </div>
          </div>

          <div className="tns-switch" role="tablist" aria-label="View">
            {VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                id={`tns-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={view === id}
                aria-controls="tns-panel"
                className={`tns-switch-btn ${view === id ? 'tns-switch-on' : ''}`}
                onClick={() => setParams({ view: id === 'timetable' ? null : id })}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
                {id === 'timetable' && route && <span className="tns-chip">{route}</span>}
              </button>
            ))}
          </div>
        </header>

        <section id="tns-panel" role="tabpanel" aria-labelledby={`tns-tab-${view}`} className="tns-panel">
          {view === 'timetable' ? (
            <RouteTimetableViewer embedded onOpenStop={openStop} />
          ) : (
            <StopFinder embedded onOpenRoute={openRoute} />
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

/** Old /gtfs/timetable and /gtfs/stops links land on the combined page. */
export const LegacyTimetablesRedirect = ({ view }) => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (view === 'stops') params.set('view', 'stops');
  return <Navigate to={`/dashboards/gtfs/network?${params.toString()}`} replace />;
};

export default TimetablesAndStops;
