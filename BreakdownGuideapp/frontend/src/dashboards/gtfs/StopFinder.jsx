/**
 * StopFinder - Search stops by name or map click, view departures
 * Feature 6 of GTFS Phase 2
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../components/DashboardLayout';
import { gtfsApiService } from '../../services/gtfsApiService';
import './StopFinder.css';

const NE_CENTER = [54.97, -1.60]; // Newcastle center

const stopIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#00838F;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: '',
});

const activeStopIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#00BCD4;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const StopFinder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const searchTimeout = useRef(null);
  const refreshInterval = useRef(null);

  // Search stops by name (debounced)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery || searchQuery.length < 2) {
      if (!searchQuery) setStops([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setLoadingStops(true);
      try {
        const res = await gtfsApiService.searchStops({ q: searchQuery, limit: 40 });
        setStops(res?.stops || []);
      } catch (err) {
        console.error('Stop search error:', err);
      } finally {
        setLoadingStops(false);
      }
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Handle map click - proximity search
  const handleMapClick = useCallback(async (lat, lng) => {
    setLoadingStops(true);
    try {
      const res = await gtfsApiService.searchStops({ lat, lng, radius_km: 0.5, limit: 30 });
      setStops(res?.stops || []);
      setSearchQuery('');
    } catch (err) {
      console.error('Proximity search error:', err);
    } finally {
      setLoadingStops(false);
    }
  }, []);

  // Load departures for selected stop
  const loadDepartures = useCallback(async (stopId) => {
    setLoadingDeps(true);
    try {
      const res = await gtfsApiService.getStopDepartures(stopId, { limit: 25 });
      setDepartures(res?.departures || []);
    } catch (err) {
      console.error('Departures error:', err);
    } finally {
      setLoadingDeps(false);
    }
  }, []);

  // Select a stop
  const handleSelectStop = useCallback((stop) => {
    setSelectedStop(stop);
    loadDepartures(stop.stopId);
  }, [loadDepartures]);

  // Auto-refresh departures every 30 seconds
  useEffect(() => {
    if (!selectedStop) return;

    refreshInterval.current = setInterval(() => {
      loadDepartures(selectedStop.stopId);
    }, 30000);

    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [selectedStop, loadDepartures]);

  return (
    <DashboardLayout>
      <div className="sf-container">
        {/* Map panel */}
        <div className="sf-map-panel">
          <MapContainer
            center={NE_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
            />

            <MapClickHandler onMapClick={handleMapClick} />

            {/* Stop markers */}
            {stops.map(stop => (
              <Marker
                key={stop.stopId}
                position={[stop.lat, stop.lng]}
                icon={selectedStop?.stopId === stop.stopId ? activeStopIcon : stopIcon}
                eventHandlers={{
                  click: () => handleSelectStop(stop),
                }}
              >
                <Popup>
                  <strong>{stop.stopName}</strong>
                  {stop.distanceKm != null && <><br />{(stop.distanceKm * 1000).toFixed(0)}m away</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Info panel */}
        <div className="sf-info-panel">
          <div className="sf-search-bar">
            <input
              className="sf-search-input"
              type="text"
              placeholder="Search stop name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Stop results list */}
          {!selectedStop && (
            <div className="sf-results">
              {loadingStops && <div className="sf-loading">Searching stops...</div>}

              {!loadingStops && stops.length === 0 && searchQuery.length >= 2 && (
                <div className="sf-empty"><p>No stops found</p></div>
              )}

              {!loadingStops && stops.length === 0 && searchQuery.length < 2 && (
                <div className="sf-empty">
                  <p>Type a stop name or click on the map</p>
                  <p>to find nearby stops</p>
                </div>
              )}

              {stops.map(stop => (
                <div
                  key={stop.stopId}
                  className="sf-result-item"
                  onClick={() => handleSelectStop(stop)}
                >
                  <span className="sf-result-icon">&#x1F68F;</span>
                  <div className="sf-result-info">
                    <div className="sf-result-name">{stop.stopName}</div>
                    {stop.distanceKm != null && (
                      <div className="sf-result-distance">{(stop.distanceKm * 1000).toFixed(0)}m away</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Departure board */}
          {selectedStop && (
            <div className="sf-departures">
              <div className="sf-dep-header">
                <h4 className="sf-dep-stop-name">{selectedStop.stopName}</h4>
                {selectedStop.stopCode && (
                  <div className="sf-dep-stop-code">Stop code: {selectedStop.stopCode}</div>
                )}
                <button
                  style={{
                    marginTop: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)', color: '#e0f7fa', fontSize: 11, cursor: 'pointer',
                  }}
                  onClick={() => { setSelectedStop(null); setDepartures([]); }}
                >
                  &larr; Back to results
                </button>
              </div>

              <div className="sf-dep-list">
                {loadingDeps && <div className="sf-loading">Loading departures...</div>}

                {!loadingDeps && departures.length === 0 && (
                  <div className="sf-empty"><p>No upcoming departures found</p></div>
                )}

                {departures.map((dep, i) => (
                  <div key={i} className="sf-dep-item">
                    <div className="sf-dep-route-badge">{dep.routeShortName}</div>
                    <div className="sf-dep-details">
                      <div className="sf-dep-headsign">{dep.headsign}</div>
                      <div className="sf-dep-time">{dep.departureTime?.substring(0, 5)}</div>
                    </div>
                    <div className={`sf-dep-mins ${dep.minutesUntilDeparture <= 2 ? 'sf-due' : ''}`}>
                      {dep.minutesUntilDeparture <= 0 ? 'Due' : `${dep.minutesUntilDeparture} min`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sf-refresh-note">Auto-refreshes every 30 seconds</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StopFinder;
