// Pick on Map - dark Leaflet map for the breakdown "Vehicle Location" step.
// Click to drop a pin; we then reverse-geocode it (Google) and/or find the
// nearest GTFS bus stop to suggest a readable description, which the
// supervisor can edit before confirming.

import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Loader2 } from 'lucide-react';
import { DARK_BASE_TILES, DARK_LABEL_TILES } from '../../../config/mapTiles.js';
import { reverseGeocode, findNearestStop, NE_CENTER } from './geocode.js';

const pinIcon = L.divIcon({
  className: 'lmp-pin-marker',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#00bcd4;border:3px solid #0b1220;box-shadow:0 0 0 4px rgba(0,188,212,0.3),0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationMapPickerModal = ({ onClose, onConfirm, center }) => {
  const [pin, setPin] = useState(null);
  const [description, setDescription] = useState('');
  const [resolving, setResolving] = useState(false);
  const [edited, setEdited] = useState(false);

  const mapCenter = useMemo(() => [center?.lat ?? NE_CENTER.lat, center?.lng ?? NE_CENTER.lng], [center]);

  const handlePick = useCallback(async (lat, lng) => {
    setPin({ lat, lng });
    setEdited(false);
    setResolving(true);

    const [address, nearestStop] = await Promise.all([
      reverseGeocode(lat, lng),
      findNearestStop(lat, lng, 0.25),
    ]);

    let suggested = address;
    if (!suggested && nearestStop) {
      suggested = `Near ${nearestStop.stopName} bus stop`;
    } else if (nearestStop && nearestStop.distanceKm != null && nearestStop.distanceKm < 0.1) {
      suggested = `${address} (near ${nearestStop.stopName})`;
    }
    if (!suggested) {
      suggested = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    setResolving(false);
    setDescription((prev) => (edited ? prev : suggested));
  }, [edited]);

  const handleConfirm = () => {
    if (!pin) return;
    onConfirm({
      lat: pin.lat,
      lng: pin.lng,
      description: description.trim() || `${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`,
      source: 'map_pick',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-700 flex flex-col max-h-[90vh]">
        <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-white">Pick on Map</h3>
            <p className="text-sm text-gray-400 mt-1">Click the map to drop a pin at the vehicle's location</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close map picker">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pt-4">
          <div style={{ height: 340, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer url={DARK_BASE_TILES.url} {...DARK_BASE_TILES.options} />
              <TileLayer url={DARK_LABEL_TILES.url} {...DARK_LABEL_TILES.options} />
              <ClickHandler onPick={handlePick} />
              {pin && <Marker position={[pin.lat, pin.lng]} icon={pinIcon} />}
            </MapContainer>
          </div>

          <div className="mt-4">
            {!pin && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4" />
                No location picked yet - click anywhere on the map
              </div>
            )}
            {pin && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={resolving ? '' : description}
                    onChange={(e) => { setEdited(true); setDescription(e.target.value); }}
                    placeholder={resolving ? 'Finding address...' : 'Describe the location'}
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    disabled={resolving}
                  />
                  {resolving && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <p className="text-xs text-gray-500 font-mono">{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!pin || resolving}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                pin && !resolving
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Use This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMapPickerModal;
