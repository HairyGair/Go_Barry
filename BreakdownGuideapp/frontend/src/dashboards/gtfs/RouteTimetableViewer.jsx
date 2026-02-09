/**
 * RouteTimetableViewer - Full timetable grid for any route
 * Supervisors use this when drivers call and they need to check scheduling
 * Feature 5 of GTFS Phase 2
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { gtfsApiService } from '../../services/gtfsApiService';
import './RouteTimetableViewer.css';

const RouteTimetableViewer = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [directionIdx, setDirectionIdx] = useState(0);
  const [serviceId, setServiceId] = useState(null);
  const tableRef = useRef(null);

  // Load routes list on mount
  useEffect(() => {
    gtfsApiService.getRoutesList()
      .then(res => setRoutes(res?.routes || []))
      .catch(err => console.error('Failed to load routes:', err));
  }, []);

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

  // Filter routes by search
  const filteredRoutes = useMemo(() => {
    if (!routeSearch) return routes;
    const q = routeSearch.toLowerCase();
    return routes.filter(r =>
      (r.routeShortName || '').toLowerCase().includes(q) ||
      (r.routeLongName || '').toLowerCase().includes(q)
    );
  }, [routes, routeSearch]);

  // Current direction data
  const directions = timetable?.directions || [];
  const currentDir = directions[directionIdx] || null;
  const currentTime = timetable?.currentTime || '';

  // Auto-scroll to current time row
  useEffect(() => {
    if (!currentDir || !tableRef.current) return;
    const tbody = tableRef.current.querySelector('tbody');
    if (!tbody) return;
    const currentRow = tbody.querySelector('.rtv-current-row');
    if (currentRow) {
      currentRow.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [currentDir]);

  const selectedRoute = routes.find(r => r.routeId === selectedRouteId);

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

        {/* Route chips */}
        <div className="rtv-route-list">
          {filteredRoutes.slice(0, 60).map(r => (
            <button
              key={r.routeId}
              className={`rtv-route-chip ${selectedRouteId === r.routeId ? 'active' : ''}`}
              onClick={() => { setSelectedRouteId(r.routeId); setServiceId(null); }}
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
                      onClick={() => setDirectionIdx(i)}
                      title={dir.headsign}
                    >
                      {dir.headsign}
                    </button>
                  ))}
                </div>
              )}

              {/* Service ID selector */}
              {timetable.availableServiceIds?.length > 1 && (
                <select
                  className="rtv-service-select"
                  value={serviceId || ''}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  {timetable.availableServiceIds.map(sid => (
                    <option key={sid} value={sid}>
                      Service: {sid}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {currentDir && currentDir.trips.length > 0 ? (
              <>
                <div className="rtv-current-time">
                  Current time: {currentTime?.substring(0, 5)} &middot; {currentDir.trips.length} trips
                </div>
                <div className="rtv-table-wrapper" ref={tableRef}>
                  <table className="rtv-table">
                    <thead>
                      <tr>
                        {currentDir.stops.map((stop, i) => (
                          <th key={i} title={stop}>{stop}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentDir.trips.map((trip, i) => {
                        const firstTime = trip.departureTimes.find(t => t != null);
                        const isPast = firstTime && firstTime < currentTime;
                        const isCurrent = firstTime && !isPast &&
                          (i === 0 || (currentDir.trips[i - 1]?.departureTimes.find(t => t != null) < currentTime));

                        return (
                          <tr
                            key={i}
                            className={`${isCurrent ? 'rtv-current-row' : ''} ${isPast ? 'rtv-past-row' : ''}`}
                          >
                            {trip.departureTimes.map((time, j) => (
                              <td key={j} className={time ? '' : 'rtv-cell-empty'}>
                                {time ? time.substring(0, 5) : '-'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
