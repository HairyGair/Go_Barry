/**
 * RouteTimetableViewer - Full timetable grid for any route
 * Supervisors use this when drivers call and they need to check scheduling
 * Feature 5 of GTFS Phase 2
 *
 * Layout: Transposed table - stops as rows, trips as columns
 * Matches real bus timetable boards at bus stops
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { gtfsApiService } from '../../services/gtfsApiService';
import './RouteTimetableViewer.css';

/** Turn a day code or raw service ID into a readable label */
function cleanServiceLabel(sid, index) {
  if (!sid) return `Service ${index + 1}`;
  // Day type codes returned by the backend
  const dayCodes = { MF: 'Mon-Fri', SA: 'Saturday', SU: 'Sunday' };
  if (dayCodes[sid]) return dayCodes[sid];
  // Fallback: parse raw service_id strings
  const parts = sid.split(':');
  const dayHints = { MF: 'Mon-Fri', SA: 'Saturday', SU: 'Sunday', MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday', TH: 'Thursday', FR: 'Friday' };
  for (const part of parts) {
    for (const [code, label] of Object.entries(dayHints)) {
      if (part.includes(code)) return label;
    }
  }
  return `Service ${index + 1}`;
}

/** Time period filter definitions */
const TIME_PERIODS = [
  { key: 'all',       label: 'All Day',   from: '00:00', to: '29:59' },
  { key: 'early',     label: 'Early',     from: '04:00', to: '07:59' },
  { key: 'morning',   label: 'Morning',   from: '07:00', to: '10:59' },
  { key: 'midday',    label: 'Midday',    from: '10:00', to: '13:59' },
  { key: 'afternoon', label: 'Afternoon', from: '13:00', to: '17:59' },
  { key: 'evening',   label: 'Evening',   from: '17:00', to: '23:59' },
];

/** Helper to get stop name - handles both string and {name, id} formats */
function getStopName(stop) {
  return typeof stop === 'string' ? stop : stop?.name || '';
}
function getStopId(stop) {
  return typeof stop === 'string' ? null : stop?.id || null;
}

const RouteTimetableViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [directionIdx, setDirectionIdx] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const [stopSearch, setStopSearch] = useState('');
  const [selectedStopIdx, setSelectedStopIdx] = useState(null);
  const [timePeriod, setTimePeriod] = useState('all');
  const [hidePast, setHidePast] = useState(false);
  const [interchanges, setInterchanges] = useState([]);
  const [activeInterchange, setActiveInterchange] = useState(null);
  const tableWrapperRef = useRef(null);
  const nowColRef = useRef(null);
  const firstMatchRef = useRef(null);
  const routeParamHandled = useRef(false);

  // Load routes list and interchange groupings on mount
  useEffect(() => {
    gtfsApiService.getRoutesList()
      .then(res => setRoutes(res?.routes || []))
      .catch(err => console.error('Failed to load routes:', err));
    gtfsApiService.getRouteInterchanges()
      .then(res => setInterchanges(res?.interchanges || []))
      .catch(err => console.error('Failed to load interchanges:', err));
  }, []);

  // Feature 2: Auto-select route from ?route= URL param (from StopFinder badges)
  useEffect(() => {
    if (routeParamHandled.current || routes.length === 0) return;
    const routeParam = searchParams.get('route');
    if (!routeParam) return;
    routeParamHandled.current = true;

    const match = routes.find(r =>
      (r.routeShortName || '').toLowerCase() === routeParam.toLowerCase()
    );
    if (match) {
      setSelectedRouteId(match.routeId);
      setServiceId(null);
    } else {
      // No exact match - pre-fill the search box so the user can see suggestions
      setRouteSearch(routeParam);
    }
  }, [routes, searchParams]);

  // Load timetable when route or service changes
  const fetchTimetable = useCallback(async () => {
    if (!selectedRouteId) return;
    setLoading(true);
    try {
      const res = await gtfsApiService.getRouteTimetable(selectedRouteId, {
        service_id: serviceId || undefined,
      });
      setTimetable(res);
      setDirectionIdx(0);
      setSelectedStopIdx(null);
      if (res?.serviceId && !serviceId) {
        setServiceId(res.serviceId);
      }
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRouteId, serviceId]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  // Filter routes by search and interchange
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    // Apply interchange filter
    if (activeInterchange) {
      const ic = interchanges.find(i => i.name === activeInterchange);
      if (ic) {
        const routeIdSet = new Set(ic.routeIds);
        filtered = filtered.filter(r => routeIdSet.has(r.routeId));
      }
    }

    // Apply text search
    if (routeSearch) {
      const q = routeSearch.toLowerCase();
      filtered = filtered.filter(r =>
        (r.routeShortName || '').toLowerCase().includes(q) ||
        (r.routeLongName || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [routes, routeSearch, activeInterchange, interchanges]);

  // Current direction data
  const directions = timetable?.directions || [];
  const currentDir = directions[directionIdx] || null;
  const currentTime = timetable?.currentTime || '';

  // Filter trips by time period and past/future
  const periodFilter = TIME_PERIODS.find(p => p.key === timePeriod) || TIME_PERIODS[0];

  const filteredTrips = useMemo(() => {
    if (!currentDir) return [];
    return currentDir.trips.map((trip, origIdx) => ({ trip, origIdx })).filter(({ trip }) => {
      const firstTime = trip.departureTimes.find(t => t != null);
      if (!firstTime) return false;
      // Time period filter
      if (timePeriod !== 'all') {
        if (firstTime < periodFilter.from || firstTime > periodFilter.to) return false;
      }
      // Hide past trips toggle
      if (hidePast && currentTime && firstTime < currentTime) return false;
      return true;
    });
  }, [currentDir, timePeriod, periodFilter, hidePast, currentTime]);

  // Find the "now" trip index within filteredTrips (first future trip)
  const nowFilteredIdx = useMemo(() => {
    if (!currentTime) return -1;
    for (let i = 0; i < filteredTrips.length; i++) {
      const firstTime = filteredTrips[i].trip.departureTimes.find(t => t != null);
      if (firstTime && firstTime >= currentTime) return i;
    }
    return -1;
  }, [filteredTrips, currentTime]);

  // Scroll target: the "now" trip, or the last trip if all are past
  const scrollTargetIdx = nowFilteredIdx >= 0
    ? nowFilteredIdx
    : (filteredTrips.length > 0 ? filteredTrips.length - 1 : -1);

  // Stop search matching
  const stopMatchSet = useMemo(() => {
    if (!stopSearch || !currentDir) return new Set();
    const q = stopSearch.toLowerCase();
    const matches = new Set();
    currentDir.stops.forEach((stop, idx) => {
      if (getStopName(stop).toLowerCase().includes(q)) matches.add(idx);
    });
    return matches;
  }, [stopSearch, currentDir]);

  const hasStopSearch = stopSearch.length > 0;

  // Auto-scroll to target column on load
  useEffect(() => {
    if (!nowColRef.current || !tableWrapperRef.current) return;
    scrollToNow();
  }, [currentDir, scrollTargetIdx]);

  // Auto-scroll to first matched stop when searching
  useEffect(() => {
    if (!hasStopSearch || !firstMatchRef.current || !tableWrapperRef.current) return;
    firstMatchRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [stopMatchSet, hasStopSearch]);

  function scrollToNow() {
    if (!nowColRef.current || !tableWrapperRef.current) return;
    const wrapper = tableWrapperRef.current;
    const colEl = nowColRef.current;
    const scrollLeft = colEl.offsetLeft - wrapper.clientWidth / 2 + colEl.offsetWidth / 2;
    wrapper.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
  }

  const selectedRoute = routes.find(r => r.routeId === selectedRouteId);

  // Clean service labels
  const serviceLabels = useMemo(() => {
    if (!timetable?.availableServiceIds) return {};
    const map = {};
    timetable.availableServiceIds.forEach((sid, i) => {
      map[sid] = cleanServiceLabel(sid, i);
    });
    return map;
  }, [timetable?.availableServiceIds]);

  const singleService = timetable?.availableServiceIds?.length <= 1;

  // Stop quick-view: all departure times for a selected stop
  const stopQuickView = useMemo(() => {
    if (selectedStopIdx === null || !currentDir) return null;
    const stopName = getStopName(currentDir.stops[selectedStopIdx]);
    const times = currentDir.trips
      .map(trip => trip.departureTimes[selectedStopIdx])
      .filter(t => t != null)
      .map(t => t.substring(0, 5));
    // Find the next departure from this stop
    const nextTime = times.find(t => t >= (currentTime?.substring(0, 5) || ''));
    return { stopName, times, nextTime, index: selectedStopIdx };
  }, [selectedStopIdx, currentDir, currentTime]);

  // Journey time: difference between first and last stop for the current/next trip
  const journeyTime = useMemo(() => {
    if (!currentDir || filteredTrips.length === 0) return null;
    // Use the "now" trip or first available
    const tripIdx = nowFilteredIdx >= 0 ? nowFilteredIdx : 0;
    const times = filteredTrips[tripIdx].trip.departureTimes;
    const first = times.find(t => t != null);
    const last = [...times].reverse().find(t => t != null);
    if (!first || !last || first === last) return null;
    const toMin = (t) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
    const mins = toMin(last) - toMin(first);
    return mins > 0 ? mins : null;
  }, [currentDir, filteredTrips, nowFilteredIdx]);

  // Average frequency: gap between consecutive trips
  const avgFrequency = useMemo(() => {
    if (!filteredTrips || filteredTrips.length < 3) return null;
    const firstTimes = filteredTrips
      .map(({ trip }) => trip.departureTimes.find(t => t != null))
      .filter(Boolean);
    if (firstTimes.length < 3) return null;
    const gaps = [];
    for (let i = 1; i < firstTimes.length; i++) {
      const toMin = (t) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
      gaps.push(toMin(firstTimes[i]) - toMin(firstTimes[i - 1]));
    }
    const sorted = [...gaps].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return Math.round(median);
  }, [filteredTrips]);

  // Timing points: stops that appear in 90%+ of trips (key timing points)
  const timingPointSet = useMemo(() => {
    if (!currentDir || currentDir.trips.length < 3) return new Set();
    const totalTrips = currentDir.trips.length;
    const threshold = totalTrips * 0.9;
    const counts = new Array(currentDir.stops.length).fill(0);
    for (const trip of currentDir.trips) {
      for (let i = 0; i < trip.departureTimes.length; i++) {
        if (trip.departureTimes[i] != null) counts[i]++;
      }
    }
    const points = new Set();
    counts.forEach((c, i) => { if (c >= threshold) points.add(i); });
    return points;
  }, [currentDir]);

  // Navigate to Stop Finder when clicking a stop name
  const handleStopClick = useCallback((stop, e) => {
    e.stopPropagation();
    const stopId = getStopId(stop);
    if (stopId) {
      navigate(`/dashboards/gtfs/stops?stop=${encodeURIComponent(stopId)}`);
    }
  }, [navigate]);

  // Track first match ref assignment
  let firstMatchAssigned = false;

  return (
    <DashboardLayout>
      <div className="rtv-container">
        <div className="rtv-header">
          <div>
            <h2 className="rtv-title">Route Timetable</h2>
            <div className="rtv-subtitle">View full daily schedules for any route</div>
          </div>
          <div className="rtv-selector">
            <input
              className="rtv-search"
              type="text"
              placeholder="Search route number or name..."
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Interchange filter buttons */}
        {interchanges.length > 0 && (
          <div className="rtv-interchange-filters">
            <button
              className={`rtv-interchange-btn ${!activeInterchange ? 'active' : ''}`}
              onClick={() => setActiveInterchange(null)}
            >
              All Routes
            </button>
            {interchanges.map(ic => (
              <button
                key={ic.name}
                className={`rtv-interchange-btn ${activeInterchange === ic.name ? 'active' : ''}`}
                onClick={() => setActiveInterchange(activeInterchange === ic.name ? null : ic.name)}
              >
                {ic.name} ({ic.routeShortNames?.length || 0})
              </button>
            ))}
          </div>
        )}

        {/* Route chips */}
        <div className="rtv-route-list">
          {filteredRoutes.slice(0, 60).map(r => (
            <button
              key={r.routeId}
              className={`rtv-route-chip ${selectedRouteId === r.routeId ? 'active' : ''}`}
              onClick={() => { setSelectedRouteId(r.routeId); setServiceId(null); setSelectedStopIdx(null); }}
              title={r.routeLongName}
            >
              {r.routeShortName}
            </button>
          ))}
          {filteredRoutes.length > 60 && (
            <span style={{ fontSize: 12, color: 'rgba(224,247,250,0.4)', padding: '6px 8px' }}>
              +{filteredRoutes.length - 60} more...
            </span>
          )}
        </div>

        {/* No route selected */}
        {!selectedRouteId && (
          <div className="rtv-empty">
            <p>Select a route above to view its timetable</p>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="rtv-loading">Loading timetable...</div>}

        {/* Timetable */}
        {!loading && selectedRouteId && timetable && (
          <>
            <div className="rtv-controls">
              {selectedRoute && (
                <span className="rtv-route-name">
                  {selectedRoute.routeShortName}: {selectedRoute.routeLongName}
                </span>
              )}

              {/* Direction tabs */}
              {directions.length > 1 && (
                <div className="rtv-dir-tabs">
                  {directions.map((dir, i) => (
                    <button
                      key={i}
                      className={`rtv-dir-tab ${directionIdx === i ? 'active' : ''}`}
                      onClick={() => { setDirectionIdx(i); setSelectedStopIdx(null); }}
                      title={dir.headsign}
                    >
                      {dir.headsign}
                    </button>
                  ))}
                </div>
              )}

              {/* Service ID selector */}
              {!singleService && (
                <select
                  className="rtv-service-select"
                  value={serviceId || ''}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  {timetable.availableServiceIds.map(sid => (
                    <option key={sid} value={sid}>
                      {serviceLabels[sid] || sid}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currentDir && currentDir.trips.length > 0 ? (
              <>
                {/* Time banner */}
                <div className="rtv-time-banner">
                  <span className="rtv-time-now">{currentTime?.substring(0, 5)}</span>
                  <span className="rtv-trip-badge">{currentDir.trips.length} trips today</span>
                  <span className="rtv-trip-badge rtv-trip-badge--showing">{filteredTrips.length} showing</span>
                  {journeyTime && (
                    <span className="rtv-trip-badge rtv-trip-badge--journey">Journey: {journeyTime} min</span>
                  )}
                  {avgFrequency && (
                    <span className="rtv-trip-badge rtv-trip-badge--freq">Every ~{avgFrequency} min</span>
                  )}
                  {nowFilteredIdx >= 0 && (
                    <span className="rtv-next-label">
                      Next: {filteredTrips[nowFilteredIdx].trip.departureTimes.find(t => t != null)?.substring(0, 5)}
                    </span>
                  )}
                  <button className="rtv-jump-now-btn" onClick={scrollToNow} title="Scroll to current time">
                    Jump to now
                  </button>
                </div>

                {/* Toolbar row: time period filters + stop search + hide past */}
                <div className="rtv-toolbar">
                  <div className="rtv-time-filters">
                    {TIME_PERIODS.map(p => (
                      <button
                        key={p.key}
                        className={`rtv-time-filter ${timePeriod === p.key ? 'active' : ''}`}
                        onClick={() => setTimePeriod(p.key)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <label className="rtv-toggle-label">
                    <input
                      type="checkbox"
                      checked={hidePast}
                      onChange={(e) => setHidePast(e.target.checked)}
                    />
                    Hide past
                  </label>

                  <div className="rtv-stop-search-group">
                    <input
                      className="rtv-stop-search"
                      type="text"
                      placeholder="Find a stop..."
                      value={stopSearch}
                      onChange={(e) => setStopSearch(e.target.value)}
                    />
                    {hasStopSearch && (
                      <>
                        <span className="rtv-stop-match-count">
                          {stopMatchSet.size} match{stopMatchSet.size !== 1 ? 'es' : ''}
                        </span>
                        <button className="rtv-clear-search" onClick={() => setStopSearch('')}>Clear</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stop quick-view panel */}
                {stopQuickView && (
                  <div className="rtv-quick-view">
                    <div className="rtv-qv-header">
                      <span className="rtv-qv-seq">Stop {stopQuickView.index + 1}</span>
                      <span className="rtv-qv-name">{stopQuickView.stopName}</span>
                      <button className="rtv-qv-close" onClick={() => setSelectedStopIdx(null)}>Close</button>
                    </div>
                    <div className="rtv-qv-times">
                      {stopQuickView.times.map((t, i) => {
                        const isNext = t === stopQuickView.nextTime && i === stopQuickView.times.indexOf(stopQuickView.nextTime);
                        const isPast = currentTime && t < currentTime.substring(0, 5);
                        return (
                          <span
                            key={i}
                            className={`rtv-qv-time ${isNext ? 'rtv-qv-time--next' : ''} ${isPast ? 'rtv-qv-time--past' : ''}`}
                          >
                            {t}
                          </span>
                        );
                      })}
                      {stopQuickView.times.length === 0 && (
                        <span className="rtv-qv-none">No departures from this stop</span>
                      )}
                    </div>
                    {stopQuickView.nextTime && (
                      <div className="rtv-qv-next">
                        Next departure from this stop: <strong>{stopQuickView.nextTime}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Transposed timetable: rows = stops, columns = trips */}
                {filteredTrips.length > 0 ? (
                  <div className="rtv-table-wrapper" ref={tableWrapperRef}>
                    <table className="rtv-table rtv-table--transposed">
                      <thead>
                        <tr>
                          <th className="rtv-stop-header">#</th>
                          <th className="rtv-stop-header rtv-stop-header--name">Stop</th>
                          {filteredTrips.map(({ trip, origIdx }, colIdx) => {
                            const firstTime = trip.departureTimes.find(t => t != null);
                            const isPast = firstTime && currentTime && firstTime < currentTime;
                            const isNow = colIdx === nowFilteredIdx;
                            const isScrollTarget = colIdx === scrollTargetIdx;
                            return (
                              <th
                                key={origIdx}
                                ref={isScrollTarget ? nowColRef : undefined}
                                className={`rtv-trip-header ${isPast ? 'rtv-col-past' : ''} ${isNow ? 'rtv-col-now' : ''}`}
                              >
                                {firstTime ? firstTime.substring(0, 5) : '-'}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {currentDir.stops.map((stop, rowIdx) => {
                          const stopName = getStopName(stop);
                          const stopId = getStopId(stop);
                          const isMatch = hasStopSearch && stopMatchSet.has(rowIdx);
                          const isDimmed = hasStopSearch && !isMatch;
                          const isSelected = selectedStopIdx === rowIdx;
                          const isTimingPoint = timingPointSet.has(rowIdx);
                          // Track first match for auto-scroll
                          const isFirstMatch = isMatch && !firstMatchAssigned;
                          if (isFirstMatch) firstMatchAssigned = true;

                          return (
                            <tr
                              key={rowIdx}
                              ref={isFirstMatch ? firstMatchRef : undefined}
                              className={[
                                isMatch ? 'rtv-stop-match' : '',
                                isDimmed ? 'rtv-stop-dimmed' : '',
                                isSelected ? 'rtv-stop-selected' : '',
                                isTimingPoint ? 'rtv-timing-point' : '',
                              ].filter(Boolean).join(' ')}
                              onClick={() => setSelectedStopIdx(isSelected ? null : rowIdx)}
                            >
                              <td className="rtv-stop-seq">{rowIdx + 1}</td>
                              <td
                                className={`rtv-stop-name ${stopId ? 'rtv-stop-link' : ''}`}
                                onClick={stopId ? (e) => handleStopClick(stop, e) : undefined}
                                title={stopId ? `View ${stopName} in Stop Finder` : undefined}
                              >
                                {stopName}
                              </td>
                              {filteredTrips.map(({ trip, origIdx }, colIdx) => {
                                const time = trip.departureTimes[rowIdx];
                                const firstTime = trip.departureTimes.find(t => t != null);
                                const isPast = firstTime && currentTime && firstTime < currentTime;
                                const isNow = colIdx === nowFilteredIdx;
                                return (
                                  <td
                                    key={origIdx}
                                    className={[
                                      time ? '' : 'rtv-cell-empty',
                                      isPast ? 'rtv-col-past' : '',
                                      isNow ? 'rtv-col-now' : '',
                                    ].filter(Boolean).join(' ')}
                                  >
                                    {time ? time.substring(0, 5) : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rtv-empty">
                    <p>No trips match the current filters</p>
                    <button className="rtv-reset-filters" onClick={() => { setTimePeriod('all'); setHidePast(false); }}>
                      Reset filters
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rtv-empty">
                <p>No trips found for this direction/service</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RouteTimetableViewer;
