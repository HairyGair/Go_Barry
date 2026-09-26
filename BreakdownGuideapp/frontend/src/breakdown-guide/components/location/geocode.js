// Shared geocoding / stop-lookup helpers for the breakdown location capture
// step (search-a-place + pick-on-map). Keeps FleetSelectionModal and the two
// location sub-modals in sync without duplicating API/script-loading logic.
//
// Two data sources, both already proven elsewhere in this app:
//  - GTFS stops search (backend /api/gtfs/stops/search) - see StopFinder.jsx
//  - Google Places Autocomplete + Geocoder, using the same VITE_GOOGLE_MAPS_KEY
//    already loaded via src/config/maps.js and already used successfully in
//    StopFinder.jsx (confirms Places + Geocoding are enabled for this key).

import { GOOGLE_MAPS_API_KEY } from '../../../config/maps.js';
import { gtfsApiService } from '../../../services/gtfsApiService.js';

// Bias suggestions to the North East England service area (matches StopFinder.jsx)
export const NE_BOUNDS = { north: 55.15, south: 54.75, east: -1.3, west: -2.0 };
export const NE_CENTER = { lat: 54.97, lng: -1.6 };

let placesLoadPromise = null;

/** Loads the Google Maps JS API (places + geocoding libraries) once, app-wide. */
export function loadGooglePlaces() {
  if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(false);
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (placesLoadPromise) return placesLoadPromise;

  placesLoadPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-gbarry-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(!!window.google?.maps?.places));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.dataset.gbarryGoogleMaps = 'true';
    script.onload = () => resolve(!!window.google?.maps?.places);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return placesLoadPromise;
}

/** Search GTFS bus stops by free-text name (debounced by the caller). */
export async function searchGtfsStops(query, { limit = 6, signal } = {}) {
  if (!query || query.length < 2) return [];
  try {
    const res = await gtfsApiService.searchStops({ q: query, limit, signal });
    return res?.stops || [];
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    console.error('[location] GTFS stop search failed:', err);
    return [];
  }
}

/** Find the nearest GTFS bus stop to a coordinate (used for map-pick fallback). */
export async function findNearestStop(lat, lng, radiusKm = 0.3) {
  try {
    const res = await gtfsApiService.searchStops({ lat, lng, radius_km: radiusKm, limit: 1 });
    return res?.stops?.[0] || null;
  } catch (err) {
    console.error('[location] Nearest stop lookup failed:', err);
    return null;
  }
}

/** Reverse-geocode a coordinate to a readable address via Google (if available). */
export function reverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    if (!window.google?.maps) return resolve(null);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.error('[location] Reverse geocode failed:', err);
      resolve(null);
    }
  });
}

/** Resolve a Google Place prediction (placeId) to coordinates + address. */
export function geocodePlaceId(placeId) {
  return new Promise((resolve) => {
    if (!window.google?.maps) return resolve(null);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng(), description: results[0].formatted_address });
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.error('[location] Place geocode failed:', err);
      resolve(null);
    }
  });
}
