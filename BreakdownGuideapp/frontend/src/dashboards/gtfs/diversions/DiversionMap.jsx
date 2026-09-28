/**
 * Diversions — map
 *
 * Draws the route's road path and stops, the closure, the stretch being
 * avoided, the diversion options (selected one bold) and the stops affected.
 * Clicking the map either marks the closure or adds a via-point, depending on
 * the planner's mode.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DARK_BASE_TILES, DARK_LABEL_TILES } from '../../../config/mapTiles';

const closureIcon = L.divIcon({
  className: 'dvm-closure-icon',
  html: '<span aria-hidden="true">✕</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const viaIcon = L.divIcon({
  className: 'dvm-via-icon',
  html: '<span aria-hidden="true"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const endpointIcon = (label, tone) => L.divIcon({
  className: `dvm-end-icon dvm-end-${tone}`,
  html: `<span>${label}</span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
const LEAVE_ICON = endpointIcon('A', 'leave');
const REJOIN_ICON = endpointIcon('B', 'rejoin');

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

/** Refit when `fitKey` changes (new route / new plan), not on every render */
function FitTo({ points, fitKey }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length < 2) return;
    map.invalidateSize();
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [fitKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

const DiversionMap = ({
  geometry,
  plan,
  candidates = [],
  selectedId,
  onSelectCandidate,
  via = [],
  onRemoveVia,
  onMapClick,
  clickMode,
  savedPath,
  savedServed = [],
  pendingClosure,
  fitKey,
}) => {
  const fitPoints = useMemo(() => {
    // Saved diversion: frame the diversion itself, not the whole route
    if (savedPath?.length) return savedPath;
    if (plan?.original) {
      const pts = [...(plan.original.path || [])];
      candidates.forEach(c => pts.push(...c.path));
      return pts.length ? pts : geometry?.path;
    }
    return geometry?.path;
  }, [plan, candidates, geometry, savedPath]);

  const selected = candidates.find(c => c.id === selectedId);

  return (
    <div className={`dvm ${clickMode ? `dvm-mode-${clickMode}` : ''}`}>
      <MapContainer center={[54.97, -1.6]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer url={DARK_BASE_TILES.url} {...DARK_BASE_TILES.options} />
        <TileLayer url={DARK_LABEL_TILES.url} {...DARK_LABEL_TILES.options} />
        <ClickHandler onClick={onMapClick} />
        <FitTo points={fitPoints} fitKey={fitKey} />

        {geometry?.path?.length > 1 && (
          <Polyline
            positions={geometry.path}
            pathOptions={{ color: '#22d3ee', weight: plan ? 4 : 5, opacity: plan ? 0.35 : 0.85 }}
          />
        )}

        {/* The stretch the buses can't use */}
        {plan?.original?.path?.length > 1 && (
          <Polyline positions={plan.original.path} pathOptions={{ color: '#ef4444', weight: 5, opacity: 0.75, dashArray: '8 8' }} />
        )}

        {/* Other options first so the selected one draws on top */}
        {candidates.filter(c => c.id !== selectedId).map(c => (
          <Polyline
            key={c.id}
            positions={c.path}
            pathOptions={{ color: c.usesClosedRoad ? '#f59e0b' : '#94a3b8', weight: 4, opacity: 0.6, dashArray: '2 8' }}
            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onSelectCandidate?.(c.id); } }}
          >
            <Tooltip sticky>{c.summary ? `Via ${c.summary}` : 'Alternative'} · click to choose</Tooltip>
          </Polyline>
        ))}
        {selected && (
          <Polyline positions={selected.path} pathOptions={{ color: '#10b981', weight: 7, opacity: 0.95 }} />
        )}
        {savedPath?.length > 1 && (
          <Polyline positions={savedPath} pathOptions={{ color: '#10b981', weight: 7, opacity: 0.95 }} />
        )}

        {/* Route stops (small), then affected stops on top */}
        {geometry?.stops?.map(s => (
          <CircleMarker
            key={s.stopId}
            center={[s.lat, s.lng]}
            radius={3.5}
            pathOptions={{ color: '#0b1220', weight: 1, fillColor: '#67e8f9', fillOpacity: plan ? 0.5 : 0.9 }}
          >
            <Tooltip>{s.name}{s.departure ? ` · ${s.departure}` : ''}</Tooltip>
          </CircleMarker>
        ))}
        {(selected?.servedStops || savedServed).map(s => (
          <CircleMarker key={`sv-${s.stopId}`} center={[s.lat, s.lng]} radius={6} pathOptions={{ color: '#0b1220', weight: 2, fillColor: '#60a5fa', fillOpacity: 1 }}>
            <Tooltip>On the diversion: {s.name}</Tooltip>
          </CircleMarker>
        ))}
        {(selected ? selected.missedStops : plan?.missedStops || []).map(s => (
          <CircleMarker key={`ms-${s.stopId}`} center={[s.lat, s.lng]} radius={6} pathOptions={{ color: '#0b1220', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }}>
            <Tooltip>Not served: {s.name}</Tooltip>
          </CircleMarker>
        ))}

        {plan?.from && <Marker position={[plan.from.lat, plan.from.lng]} icon={LEAVE_ICON}><Tooltip>Leave route after {plan.from.name}</Tooltip></Marker>}
        {plan?.to && <Marker position={[plan.to.lat, plan.to.lng]} icon={REJOIN_ICON}><Tooltip>Rejoin at {plan.to.name}</Tooltip></Marker>}
        {/* The closed stretch itself */}
        {plan?.closure?.section?.length > 1 && (
          <Polyline positions={plan.closure.section} pathOptions={{ color: '#dc2626', weight: 9, opacity: 0.9 }}>
            <Tooltip sticky>Closed</Tooltip>
          </Polyline>
        )}
        {plan?.closure && (
          <Marker position={plan.closure.snapped || [plan.closure.lat, plan.closure.lng]} icon={closureIcon}>
            <Tooltip>Road closed</Tooltip>
          </Marker>
        )}
        {pendingClosure && (
          <Marker position={pendingClosure} icon={closureIcon}>
            <Tooltip permanent direction="right">Closure starts here</Tooltip>
          </Marker>
        )}
        {via.map((p, i) => (
          <Marker
            key={`via-${i}`}
            position={p}
            icon={viaIcon}
            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onRemoveVia?.(i); } }}
          >
            <Tooltip>Via point {i + 1} · click to remove</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DiversionMap;
