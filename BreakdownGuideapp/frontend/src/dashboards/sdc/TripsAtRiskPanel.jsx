/**
 * TripsAtRiskPanel - Shows upcoming trips affected by a breakdown
 * Includes service gap warnings and last bus alerts (Features 1, 2, 3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { gtfsApiService } from '../../services/gtfsApiService';
import './TripsAtRiskPanel.css';

export default function TripsAtRiskPanel({ routeId, lat, lng, breakdownTime }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [gaps, setGaps] = useState(null);
  const [dirFilter, setDirFilter] = useState('all');

  const fetchData = useCallback(async () => {
    if (!routeId) return;
    setLoading(true);
    try {
      const [tripsRes, gapsRes] = await Promise.all([
        gtfsApiService.getTripsAtRisk({ route_id: routeId, lat, lng, minutes: 120 }),
        gtfsApiService.getServiceGaps({
          route_id: routeId,
          breakdown_time: breakdownTime,
          stop_id: null,
        }),
      ]);
      setData(tripsRes);
      setGaps(gapsRes);
    } catch (err) {
      console.error('TripsAtRiskPanel fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [routeId, lat, lng, breakdownTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!routeId) return null;

  const trips = data?.tripsAtRisk || [];
  const lastBusAlert = data?.lastBusAlert;
  const nearestStop = data?.nearestStop;
  const gapList = gaps?.gaps || [];
  const totalTrips = data?.summary?.totalTripsAtRisk || 0;

  const filteredTrips = dirFilter === 'all'
    ? trips
    : trips.filter(t => String(t.directionId) === dirFilter);

  // Collect unique directions for filter
  const directions = [...new Set(trips.map(t => String(t.directionId)))];

  const getMinsBadgeClass = (mins) => {
    if (mins < 15) return 'tar-urgent';
    if (mins < 30) return 'tar-soon';
    return 'tar-normal';
  };

  return (
    <div className="tar-panel">
      {/* Last Bus Alert - always visible at top */}
      {lastBusAlert?.isLastBusAffected && (
        <div className="tar-last-bus-alert">
          <span className="tar-last-bus-icon">&#x1F6A8;</span>
          <div className="tar-last-bus-text">
            LAST BUS AT RISK: {lastBusAlert.affectedLastBuses.map(b =>
              `${b.departureTime?.substring(0, 5)} towards ${b.headsign}`
            ).join(', ')}
            <span>
              {lastBusAlert.affectedLastBuses.some(b => b.isAbsoluteLastBus)
                ? 'This is the final service - no later bus available'
                : 'Second-to-last service affected'}
            </span>
          </div>
        </div>
      )}

      {/* Toggle header */}
      <button className="tar-toggle" onClick={() => { setExpanded(!expanded); if (!data) fetchData(); }}>
        <div className="tar-toggle-left">
          <span>Trips at Risk</span>
          {totalTrips > 0 && <span className="tar-toggle-count">{totalTrips}</span>}
        </div>
        <span className={`tar-toggle-arrow ${expanded ? 'open' : ''}`}>&#x25BC;</span>
      </button>

      {expanded && (
        <>
          {/* Service Gap Warnings */}
          {gapList.filter(g => g.severity !== 'ok').map((gap, i) => (
            <div key={i} className={`tar-gap-warning ${
              gap.severity === 'critical' ? 'tar-gap-critical' :
              gap.severity === 'warning' ? 'tar-gap-warning-level' : 'tar-gap-caution'
            }`}>
              <span>{gap.severity === 'critical' ? '\u26A0\uFE0F' : gap.severity === 'warning' ? '\u26A0\uFE0F' : '\u2139\uFE0F'}</span>
              <div>
                SERVICE GAP: {gap.gapWithoutTripMinutes}-min gap towards {gap.headsign} (normal: {gap.normalHeadwayMinutes} min)
                <div className="tar-gap-details">
                  Gap ratio: {gap.gapRatio}x &middot; Previous: {gap.previousDeparture?.substring(0, 5)} &middot; Next: {gap.nextDeparture?.substring(0, 5)}
                </div>
              </div>
            </div>
          ))}

          {loading && <div className="tar-loading">Loading trips...</div>}

          {!loading && trips.length === 0 && (
            <div className="tar-empty">No upcoming trips found in the next 2 hours</div>
          )}

          {!loading && trips.length > 0 && (
            <>
              {/* Direction filter */}
              {directions.length > 1 && (
                <div className="tar-direction-filter">
                  <button
                    className={`tar-dir-btn ${dirFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDirFilter('all')}
                  >
                    All ({trips.length})
                  </button>
                  {directions.map(dir => {
                    const count = trips.filter(t => String(t.directionId) === dir).length;
                    const sample = trips.find(t => String(t.directionId) === dir);
                    return (
                      <button
                        key={dir}
                        className={`tar-dir-btn ${dirFilter === dir ? 'active' : ''}`}
                        onClick={() => setDirFilter(dir)}
                      >
                        {sample?.headsign || `Dir ${dir}`} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              <table className="tar-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Headsign</th>
                    <th>In</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.map((trip, i) => (
                    <tr key={i}>
                      <td className={`tar-time-cell ${getMinsBadgeClass(trip.minutesUntilDeparture)}`}>
                        {trip.departureTime?.substring(0, 5)}
                      </td>
                      <td className="tar-headsign">{trip.headsign}</td>
                      <td>
                        <span className={`tar-mins-badge ${getMinsBadgeClass(trip.minutesUntilDeparture)}`}>
                          {trip.minutesUntilDeparture} min
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {nearestStop && (
                <div className="tar-nearest-stop">
                  Nearest stop: {nearestStop.stopName}
                  {nearestStop.distanceKm != null && ` (${(nearestStop.distanceKm * 1000).toFixed(0)}m away)`}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * LastBusBadge - Small badge for SDCBreakdownCard header
 */
export function LastBusBadge({ routeId, lat, lng }) {
  const [isLastBus, setIsLastBus] = useState(false);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    gtfsApiService.getTripsAtRisk({ route_id: routeId, lat, lng, minutes: 480 })
      .then(res => {
        if (!cancelled && res?.lastBusAlert?.isLastBusAffected) {
          setIsLastBus(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [routeId, lat, lng]);

  if (!isLastBus) return null;

  return (
    <span className="sdc-last-bus-badge">LAST BUS</span>
  );
}
