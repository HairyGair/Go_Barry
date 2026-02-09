/**
 * DefectHotspotMap Component - Ocean Teal Theme
 *
 * Interactive map showing breakdown locations with severity-based markers.
 * Features: Auto-fit bounds, depot markers, legend, and click handlers.
 */

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Depot coordinates - Ocean Teal color palette
const DEPOT_COORDS = {
  'Washington': { lat: 54.8963, lng: -1.5238, color: '#0097A7' },
  'Riverside': { lat: 54.9619, lng: -1.6036, color: '#00838F' },
  'Percy Main': { lat: 55.0079, lng: -1.4631, color: '#10B981' },
  'Deptford': { lat: 54.8989, lng: -1.3825, color: '#F59E0B' },
  'Consett': { lat: 54.8500, lng: -1.8300, color: '#8B5CF6' },
  'Chester-le-Street': { lat: 54.8566, lng: -1.5707, color: '#00BCD4' },
};

// Map bounds for the operator region
const MAP_CONFIG = {
  center: [54.9783, -1.6178], // Newcastle
  zoom: 10,
  minZoom: 8,
  maxZoom: 16,
};

// Severity colors
const SEVERITY_COLORS = {
  'STOP': '#EF4444',
  'AMBER': '#F59E0B',
  'CONTINUE': '#10B981',
  'pending': '#6B7280',
};

// Create custom marker icon for breakdowns
const createMarkerIcon = (severity) => {
  const color = SEVERITY_COLORS[severity] || SEVERITY_COLORS.pending;

  return L.divIcon({
    className: 'breakdown-marker',
    html: `
      <div class="marker-container ${severity.toLowerCase()}">
        <div class="marker-pulse" style="background: ${color}40"></div>
        <div class="marker-dot" style="background: ${color}"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Create depot marker icon with first letter instead of emoji
const createDepotIcon = (name, color) => {
  const letter = name.charAt(0).toUpperCase();

  return L.divIcon({
    className: 'depot-marker',
    html: `
      <div class="depot-marker-inner" style="background: ${color}; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <span class="depot-letter" style="color: white; font-weight: bold; font-size: 18px;">${letter}</span>
      </div>
      <div class="depot-label" style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${name}</div>
    `,
    iconSize: [40, 60],
    iconAnchor: [20, 60],
  });
};

// Component to auto-fit map bounds when breakdowns change
const FitBounds = ({ breakdowns }) => {
  const map = useMap();

  React.useEffect(() => {
    if (breakdowns.length > 0) {
      const bounds = L.latLngBounds(
        breakdowns.map(b => [parseFloat(b.location_lat), parseFloat(b.location_lng)])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [breakdowns, map]);

  return null;
};

const DefectHotspotMap = ({ breakdowns = [], onMarkerClick, loading }) => {
  // Filter breakdowns with valid coordinates
  const validBreakdowns = useMemo(() => {
    return breakdowns.filter(b =>
      b.location_lat && b.location_lng &&
      !isNaN(parseFloat(b.location_lat)) &&
      !isNaN(parseFloat(b.location_lng))
    );
  }, [breakdowns]);

  if (loading) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM8 3.5a1 1 0 0 0-1 1v3a1 1 0 0 0 .293.707l2 2a1 1 0 0 0 1.414-1.414L9.5 7.586V4.5a1 1 0 0 0-1-1z"/>
            </svg>
            Live Defect Hotspots
          </h3>
        </div>
        <div className="fi__loading-spinner">
          <div className="spinner"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  if (validBreakdowns.length === 0) {
    return (
      <div className="fi__card">
        <div className="fi__card-header">
          <h3 className="fi__card-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM8 3.5a1 1 0 0 0-1 1v3a1 1 0 0 0 .293.707l2 2a1 1 0 0 0 1.414-1.414L9.5 7.586V4.5a1 1 0 0 0-1-1z"/>
            </svg>
            Live Defect Hotspots
          </h3>
          <span className="fi__card-badge--count">0 active</span>
        </div>
        <div className="fi__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          <p>No active breakdowns with location data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fi__card">
      <div className="fi__card-header">
        <h3 className="fi__card-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1"/>
          </svg>
          Live Defect Hotspots
        </h3>
        <span className="fi__card-badge--count">{validBreakdowns.length} active</span>
      </div>

      <div className="fi__map-wrap">
        <div className="fi__map">
          <MapContainer
            center={MAP_CONFIG.center}
            zoom={MAP_CONFIG.zoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Depot markers */}
            {Object.entries(DEPOT_COORDS).map(([name, coords]) => (
              <Marker
                key={`depot-${name}`}
                position={[coords.lat, coords.lng]}
                icon={createDepotIcon(name, coords.color)}
              >
                <Popup>
                  <strong>{name} Depot</strong>
                </Popup>
              </Marker>
            ))}

            {/* Breakdown markers */}
            {validBreakdowns.map((breakdown, index) => {
              const severity = breakdown.wizard_decision || breakdown.severity || 'pending';
              return (
                <Marker
                  key={breakdown.id || `breakdown-${index}`}
                  position={[parseFloat(breakdown.location_lat), parseFloat(breakdown.location_lng)]}
                  icon={createMarkerIcon(severity)}
                  eventHandlers={{
                    click: () => {
                      if (onMarkerClick) {
                        onMarkerClick(breakdown.id);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>Fleet {breakdown.fleet_no || 'Unknown'}</strong><br/>
                      <span className={`popup-severity ${severity.toLowerCase()}`}>{severity}</span><br/>
                      <span className="popup-issue">{breakdown.issue_type || breakdown.issue_category || 'Unknown Issue'}</span><br/>
                      <span className="popup-location">{breakdown.location || breakdown.location_description || 'Unknown Location'}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Auto-fit bounds to breakdowns */}
            {validBreakdowns.length > 0 && <FitBounds breakdowns={validBreakdowns} />}
          </MapContainer>
        </div>
      </div>

      <div className="fi__map-legend">
        <div className="fi__map-legend-item">
          <span className="fi__map-legend-dot" style={{ background: SEVERITY_COLORS.STOP }}></span>
          STOP
        </div>
        <div className="fi__map-legend-item">
          <span className="fi__map-legend-dot" style={{ background: SEVERITY_COLORS.AMBER }}></span>
          AMBER
        </div>
        <div className="fi__map-legend-item">
          <span className="fi__map-legend-dot" style={{ background: SEVERITY_COLORS.CONTINUE }}></span>
          CONTINUE
        </div>
        <div className="fi__map-legend-item">
          <span className="fi__map-legend-dot" style={{ background: SEVERITY_COLORS.pending }}></span>
          Pending
        </div>
      </div>
    </div>
  );
};

export default DefectHotspotMap;
