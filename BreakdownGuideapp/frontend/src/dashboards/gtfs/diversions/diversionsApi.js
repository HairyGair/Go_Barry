/**
 * Diversions — API calls and browser-side road directions
 *
 * Road options come from the Maps JS DirectionsService in the browser: the
 * Maps key is referrer-restricted, which Google refuses for server-side
 * Directions calls, but accepts here. The server then checks each option
 * against the closure and nearby stops.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import { apiClient } from '../../../services/api-client';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps.js';

export const REASONS = [
  { id: 'road_closure', label: 'Road closure' },
  { id: 'roadworks', label: 'Roadworks' },
  { id: 'incident', label: 'Incident / police' },
  { id: 'event', label: 'Event' },
  { id: 'weather', label: 'Weather / flooding' },
  { id: 'other', label: 'Other' },
];
export const reasonLabel = (id) => REASONS.find(r => r.id === id)?.label || 'Diversion';

export const getGeometry = (route, direction) =>
  apiClient.get(`/api/diversions/geometry/${encodeURIComponent(route)}${direction != null ? `?direction=${direction}` : ''}`);

export const planDiversion = (body) => apiClient.post('/api/diversions/plan', body);
export const listDiversions = (scope = 'all', route) =>
  apiClient.get(`/api/diversions?scope=${scope}${route ? `&route=${encodeURIComponent(route)}` : ''}`);
export const getDiversion = (id) => apiClient.get(`/api/diversions/${encodeURIComponent(id)}`);
export const saveDiversion = (body) => apiClient.post('/api/diversions', body);
export const updateDiversion = (id, body) => apiClient.patch(`/api/diversions/${encodeURIComponent(id)}`, body);

// ── Google Maps JS (shared with the Stop Finder's Places search) ──────────────

let mapsPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.DirectionsService) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const done = () => (window.google?.maps?.DirectionsService ? resolve(window.google.maps) : reject(new Error('Google Maps unavailable')));
    // Another screen may already have added the script - wait for it rather
    // than loading a second copy (two copies break each other)
    const existing = [...document.scripts].find(s => s.src.includes('maps.googleapis.com/maps/api/js'));
    if (existing) {
      if (window.google?.maps) { done(); return; }
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps failed to load')), { once: true });
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) { reject(new Error('Google Maps key not configured')); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = done;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  }).catch(err => { mapsPromise = null; throw err; });
  return mapsPromise;
}

/**
 * Driving options between two points, optionally through via-points (which
 * shape the path without becoming stops). Google only gives alternatives when
 * there are no via-points.
 */
export async function getRoadOptions(from, to, via = []) {
  const maps = await loadGoogleMaps();
  const svc = new maps.DirectionsService();
  const request = {
    origin: { lat: from.lat, lng: from.lng },
    destination: { lat: to.lat, lng: to.lng },
    travelMode: 'DRIVING',
    region: 'uk',
    provideRouteAlternatives: via.length === 0,
    waypoints: via.map(([lat, lng]) => ({ location: { lat, lng }, stopover: false })),
  };
  const response = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Road directions timed out')), 20000);
    svc.route(request, (res, status) => {
      clearTimeout(timer);
      if (status === 'OK') resolve(res);
      else reject(new Error(status === 'ZERO_RESULTS' ? 'No road route found between those stops' : `Road directions failed (${status})`));
    });
  });

  // Thin the path: ~1 m precision and no points within 6 m of the last one
  // (Google's step paths are very dense; this keeps requests small)
  const thin = (pts) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
      const last = out[out.length - 1];
      const far = !last || Math.hypot((q[0] - last[0]) * 111320, (q[1] - last[1]) * 64000) > 6;
      if (far || i === pts.length - 1) out.push(q);
    });
    return out;
  };

  return response.routes.map(r => {
    const legs = r.legs || [];
    const steps = legs.flatMap(l => l.steps || []);
    const path = [];
    steps.forEach(st => {
      (st.path || []).forEach((ll, i) => {
        if (i > 0 || path.length === 0) path.push([ll.lat(), ll.lng()]);
      });
    });
    return {
      summary: r.summary || '',
      path: thin(path.length ? path : (r.overview_path || []).map(ll => [ll.lat(), ll.lng()])),
      distanceMeters: legs.reduce((sum, l) => sum + (l.distance?.value || 0), 0),
      durationSeconds: legs.reduce((sum, l) => sum + (l.duration?.value || 0), 0),
      steps: steps.map(st => ({ instruction: st.instructions || '', distanceMeters: st.distance?.value || 0 })),
    };
  });
}

// ── Formatting ────────────────────────────────────────────────────────────────

export const fmtDateTime = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const fmtMiles = (m) => (m == null ? '' : `${m > 0 ? '+' : ''}${m} mi`);
export const fmtMinutes = (m) => (m == null ? '' : `${m > 0 ? '+' : ''}${m} min`);
export const fmtDistance = (meters) => (meters >= 1000 ? `${(meters / 1609.344).toFixed(1)} mi` : `${Math.round(meters)} m`);

/** Value for a datetime-local input, in local time */
export function toLocalInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const STATE_META = {
  current: { label: 'In force', tone: 'live' },
  upcoming: { label: 'Planned', tone: 'planned' },
  past: { label: 'Finished', tone: 'past' },
};
