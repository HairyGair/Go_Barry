/**
 * Live Route Status
 *
 * Which routes are affected by breakdowns right now:
 *  - left:  affected routes, worst first, with each open breakdown (vehicle,
 *           fault, location, how long open, engineer) linking to Operations
 *  - right: every route as a tile, coloured by status, with search
 * Open breakdowns that aren't linked to a route are listed too, so nothing
 * silently drops off this view.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Bus, AlertOctagon, AlertTriangle, CheckCircle2, ClipboardList, RefreshCw, Unlink } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import RouteIssueCard, { BreakdownLine } from './route-status/RouteIssueCard';
import RouteBoard from './route-status/RouteBoard';
import { gtfsApiService } from '../../services/gtfsApiService';
import './LiveRouteStatusDashboard.css';

const REFRESH_INTERVAL = 15000;

const LiveRouteStatusDashboard = () => {
  const [routes, setRoutes] = useState([]);
  const [unlinked, setUnlinked] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [flashId, setFlashId] = useState(null);
  const cardRefs = useRef({});

  const fetchRouteStatus = useCallback(async () => {
    try {
      const response = await gtfsApiService.getLiveRouteStatus();
      if (response?.success) {
        setRoutes(response.routes || []);
        setUnlinked(response.unlinked || []);
        setSummary(response.summary || null);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('Route status couldn’t be loaded.');
      }
    } catch (err) {
      console.error('Error fetching route status:', err);
      setError('Route status couldn’t be loaded. Retrying automatically.');
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    fetchRouteStatus();
    const poll = setInterval(fetchRouteStatus, REFRESH_INTERVAL);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [fetchRouteStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRouteStatus();
    setRefreshing(false);
  };

  const affected = useMemo(() => routes.filter(r => r.status !== 'GREEN'), [routes]);
  const counts = {
    red: summary?.red_routes ?? affected.filter(r => r.status === 'RED').length,
    amber: summary?.amber_routes ?? affected.filter(r => r.status === 'AMBER').length,
    green: summary?.green_routes ?? routes.length - affected.length,
    open: summary?.open_breakdowns ?? summary?.total_active_breakdowns ?? 0,
  };

  const jumpToRoute = useCallback((route) => {
    const el = cardRefs.current[route.routeId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus({ preventScroll: true });
    setFlashId(route.routeId);
    setTimeout(() => setFlashId(null), 1600);
  }, []);

  return (
    <DashboardLayout title="Route Status" icon="bus">
      <div className="rst-page">
        <header className="rst-header">
          <div className="rst-header-left">
            <div className="rst-header-icon"><Bus size={20} aria-hidden="true" /></div>
            <div>
              <h2>Route Status</h2>
              <p>Which routes are affected by breakdowns right now</p>
            </div>
          </div>

          <div className="rst-kpis" role="list" aria-label="Route status summary">
            <div className="rst-kpi rst-kpi-red" role="listitem">
              <AlertOctagon size={13} aria-hidden="true" />
              <span className="rst-kpi-val">{counts.red}</span>
              <span className="rst-kpi-lbl">Disrupted</span>
            </div>
            <div className="rst-kpi rst-kpi-amber" role="listitem">
              <AlertTriangle size={13} aria-hidden="true" />
              <span className="rst-kpi-val">{counts.amber}</span>
              <span className="rst-kpi-lbl">Affected</span>
            </div>
            <div className="rst-kpi rst-kpi-green" role="listitem">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span className="rst-kpi-val">{counts.green}</span>
              <span className="rst-kpi-lbl">Running normally</span>
            </div>
            <div className="rst-kpi" role="listitem">
              <ClipboardList size={13} aria-hidden="true" />
              <span className="rst-kpi-val">{counts.open}</span>
              <span className="rst-kpi-lbl">Open breakdowns</span>
            </div>
          </div>

          <div className="rst-header-right">
            <span className="rst-updated" aria-live="polite">
              <span className={`rst-live-dot ${error ? 'rst-live-dot-off' : ''}`} aria-hidden="true" />
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading'}
            </span>
            <button type="button" className="rst-btn" onClick={handleRefresh} disabled={refreshing} aria-label="Refresh route status">
              <RefreshCw size={14} className={refreshing ? 'rst-spin' : ''} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        {error && <div className="rst-banner" role="alert">{error}</div>}

        {loading ? (
          <div className="rst-grid" aria-busy="true">
            <div className="rst-col"><div className="rst-skel" /><div className="rst-skel" /><div className="rst-skel" /></div>
            <div className="rst-col"><div className="rst-skel rst-skel-tall" /></div>
          </div>
        ) : (
          <div className="rst-grid">
            <div className="rst-col">
              <div className="rst-section-head">
                <h3>Needs attention</h3>
                <span className="rst-section-count">
                  {affected.length} route{affected.length === 1 ? '' : 's'}
                </span>
              </div>

              {affected.length === 0 ? (
                <div className="rst-allclear">
                  <CheckCircle2 size={28} aria-hidden="true" />
                  <div>
                    <h4>All {routes.length} routes running normally</h4>
                    <p>No open breakdowns are linked to a route.</p>
                  </div>
                </div>
              ) : (
                affected.map(route => (
                  <RouteIssueCard
                    key={route.routeId}
                    ref={el => { cardRefs.current[route.routeId] = el; }}
                    route={route}
                    now={now}
                    highlighted={flashId === route.routeId}
                  />
                ))
              )}

              {unlinked.length > 0 && (
                <article className="rst-card rst-card-unlinked" aria-labelledby="rst-unlinked-title">
                  <header className="rst-card-head">
                    <span className="rst-route rst-route-none"><Unlink size={16} aria-hidden="true" /></span>
                    <div className="rst-card-title">
                      <span id="rst-unlinked-title" className="rst-status">Not linked to a route</span>
                      <span className="rst-dest">
                        {unlinked.length} open breakdown{unlinked.length === 1 ? ' has' : 's have'} no route, so {unlinked.length === 1 ? 'it doesn’t' : 'they don’t'} affect the statuses above. Add the route in Operations.
                      </span>
                    </div>
                  </header>
                  <div className="rst-bd-list">
                    {unlinked.map(b => <BreakdownLine key={b.id} b={b} now={now} />)}
                  </div>
                </article>
              )}
            </div>

            <div className="rst-col rst-col-side">
              <RouteBoard routes={routes} onJumpToRoute={jumpToRoute} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveRouteStatusDashboard;
