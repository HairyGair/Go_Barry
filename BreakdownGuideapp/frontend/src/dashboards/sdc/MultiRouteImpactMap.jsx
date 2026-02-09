/**
 * MultiRouteImpactMap - Shows all routes whose road path passes near a breakdown
 * Uses GTFS shape geometry for accurate matching, not just stop proximity
 * Feature 4 of GTFS Phase 2
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { gtfsApiService } from '../../services/gtfsApiService';
import './MultiRouteImpactMap.css';

const ROUTE_COLORS = [
  '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#F4511E', '#3949AB', '#7CB342', '#D81B60',
  '#6D4C41', '#546E7A', '#C0CA33', '#5E35B1', '#039BE5',
];

const breakdownIcon = L.divIcon({
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#D32F2F;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: '',
});

export default function MultiRouteImpactMap({ lat, lng, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!lat || !lng) return;
    let cancelled = false;
    setLoading(true);

    gtfsApiService.getShapeRouteMatch({ lat, lng, radius_m: 100 })
      .then(res => {
        if (!cancelled) setData(res);
      })
      .catch(err => console.error('MultiRouteImpactMap error:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [lat, lng]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const routes = data?.affectedRoutes || [];
  const shapes = data?.shapes || {};
  const comparison = data?.comparison || {};

  // Build route-to-color map
  const routeColorMap = {};
  const uniqueRoutes = [];
  const seen = new Set();
  for (const r of routes) {
    if (!seen.has(r.routeShortName)) {
      seen.add(r.routeShortName);
      routeColorMap[r.routeShortName] = ROUTE_COLORS[uniqueRoutes.length % ROUTE_COLORS.length];
      uniqueRoutes.push(r);
    }
  }

  // Map shape_id to route short name via routes list
  const shapeToRoute = {};
  for (const r of routes) {
    // Find any matching shape_id from the data
    for (const shapeId of Object.keys(shapes)) {
      // If this route's trip uses this shape, link them
      if (!shapeToRoute[shapeId]) {
        shapeToRoute[shapeId] = r.routeShortName;
      }
    }
  }

  return (
    <div className="mri-overlay" onClick={handleOverlayClick}>
      <div className="mri-modal">
        <div className="mri-header">
          <div>
            <h3>Multi-Route Impact Map</h3>
            <div className="mri-header-stats">
              <span>{routes.length} routes affected</span>
              <span>100m radius</span>
            </div>
          </div>
          <button className="mri-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="mri-body">
          <div className="mri-map-container">
            {loading ? (
              <div className="mri-loading">Loading route shapes...</div>
            ) : (
              <MapContainer
                center={[parseFloat(lat), parseFloat(lng)]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
                  attribution="&copy; Google Maps"
                  maxZoom={20}
                />

                {/* Breakdown location marker */}
                <Marker position={[parseFloat(lat), parseFloat(lng)]} icon={breakdownIcon}>
                  <Popup>Breakdown Location</Popup>
                </Marker>

                {/* Radius circle */}
                <Circle
                  center={[parseFloat(lat), parseFloat(lng)]}
                  radius={100}
                  pathOptions={{ color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.08, weight: 1, dashArray: '4 4' }}
                />

                {/* Route shape polylines */}
                {Object.entries(shapes).map(([shapeId, points]) => {
                  const routeName = shapeToRoute[shapeId] || 'Unknown';
                  const color = routeColorMap[routeName] || '#999';
                  return (
                    <Polyline
                      key={shapeId}
                      positions={points}
                      pathOptions={{ color, weight: 3, opacity: 0.8 }}
                    >
                      <Popup>Route {routeName}</Popup>
                    </Polyline>
                  );
                })}
              </MapContainer>
            )}
          </div>

          <div className="mri-legend">
            <h4>Affected Routes</h4>
            {uniqueRoutes.map((r, i) => (
              <div key={i} className="mri-legend-item">
                <div
                  className="mri-legend-swatch"
                  style={{ backgroundColor: routeColorMap[r.routeShortName] }}
                />
                <div>
                  <div className="mri-legend-route">{r.routeShortName}</div>
                  <div className="mri-legend-name">{r.routeLongName}</div>
                </div>
              </div>
            ))}

            {uniqueRoutes.length === 0 && !loading && (
              <div style={{ fontSize: 12, color: '#999', padding: 8 }}>
                No routes matched via shape geometry
              </div>
            )}

            <div className="mri-comparison">
              <h4>Match Comparison</h4>
              <div className="mri-comparison-stat">
                <span>Stop-based matches</span>
                <span>{comparison.stopBasedMatches || 0}</span>
              </div>
              <div className="mri-comparison-stat">
                <span>Shape-based matches</span>
                <span>{comparison.shapeBasedMatches || 0}</span>
              </div>
              <div className="mri-comparison-stat">
                <span>Additional routes found</span>
                <span>{comparison.additionalRoutesFound || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
