/**
 * DefectHotspotMap Component
 *
 * Interactive map showing breakdown locations with severity-based markers.
 * Features: Marker clustering, depot markers, legend, and click handlers.
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

// Depot coordinates for Go North East
const DEPOT_COORDS = {
  'Washington': { lat: 54.8963, lng: -1.5238, color: '#E30613' },
  'Riverside': { lat: 54.9619, lng: -1.6036, color: '#003B5C' },
  'Percy Main': { lat: 55.0079, lng: -1.4631, color: '#10B981' },
  'Deptford': { lat: 54.8989, lng: -1.3825, color: '#F59E0B' },
  'Consett': { lat: 54.8500, lng: -1.8300, color: '#8B5CF6' },
  'Chester-le-Street': { lat: 54.8566, lng: -1.5707, color: '#EC4899' },
};

// Map bounds for Go North East region
const MAP_CONFIG = {
  center: [54.9783, -1.6178], // Newcastle
  zoom: 10,
  minZoom: 8,
  maxZoom: 16,
};

// Severity colors
const SEVERITY_COLORS = {
  'STOP': '#DC2626',
  'AMBER': '#F59E0B',
  'CONTINUE': '#10B981',
  'pending': '#6B7280',
};

// Create custom marker icon
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

// Create depot marker icon
const createDepotIcon = (name, color) => {
  return L.divIcon({
    className: 'depot-marker',
    html: `
      <div class="depot-marker-inner" style="background: ${color}">
        <span class="depot-icon">🏭</span>
      </div>
      <div class="depot-label">${name}</div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
  });
};

// Component to fit bounds when breakdowns change
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
      <div className="fid-card defect-map-container">
        <div className="map-header">
          <h3>📍 Live Defect Hotspots</h3>
        </div>
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fid-card defect-map-container">
      <div className="map-header">
        <h3>📍 Live Defect Hotspots</h3>
        <div className="map-stats">
          <span className="stat-badge">{validBreakdowns.length} active</span>
        </div>
      </div>

      <div className="defect-map">
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

          {/* Fit bounds to breakdowns */}
          {validBreakdowns.length > 0 && <FitBounds breakdowns={validBreakdowns} />}
        </MapContainer>
      </div>

      <div className="map-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: SEVERITY_COLORS.STOP }}></span>
          STOP
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: SEVERITY_COLORS.AMBER }}></span>
          AMBER
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: SEVERITY_COLORS.CONTINUE }}></span>
          CONTINUE
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: SEVERITY_COLORS.pending }}></span>
          Pending
        </span>
      </div>
    </div>
  );
};

export default DefectHotspotMap;
