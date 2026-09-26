// Compact dark map with a single location pin (Leaflet + Esri dark tiles),
// replacing the light OpenStreetMap iframe embeds.

import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { DARK_BASE_TILES, DARK_LABEL_TILES } from '../../config/mapTiles';

const pinIcon = L.divIcon({
  className: 'dark-pin-marker',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#00bcd4;border:3px solid #0b1220;box-shadow:0 0 0 4px rgba(0,188,212,0.3),0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const DarkPinMap = ({ lat, lng, zoom = 15, height = 220, title = 'Location map' }) => (
  <div style={{ height, width: '100%', borderRadius: 8, overflow: 'hidden', background: '#0b1220' }} aria-label={title}>
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      attributionControl={true}
    >
      <TileLayer url={DARK_BASE_TILES.url} {...DARK_BASE_TILES.options} />
      <TileLayer url={DARK_LABEL_TILES.url} {...DARK_LABEL_TILES.options} />
      <Marker position={[lat, lng]} icon={pinIcon} />
    </MapContainer>
  </div>
);

export default DarkPinMap;
