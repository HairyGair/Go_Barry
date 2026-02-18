/**
 * Google Directions Service
 * Calculates road distance between two points using Google Directions API.
 * Uses Node.js built-in https module (not fetch) for cPanel compatibility.
 */

import https from 'https';

const KM_TO_MILES = 0.621371;
const MAX_CACHE_ENTRIES = 500;

// In-memory cache keyed by rounded coordinates (3 decimal places ~110m precision)
const distanceCache = new Map();

function cacheKey(lat1, lng1, lat2, lng2) {
  return `${lat1.toFixed(3)},${lng1.toFixed(3)}->${lat2.toFixed(3)},${lng2.toFixed(3)}`;
}

function pruneCache() {
  if (distanceCache.size <= MAX_CACHE_ENTRIES) return;
  const entries = [...distanceCache.entries()];
  entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
  for (const [key] of toRemove) {
    distanceCache.delete(key);
  }
}

/** Simple HTTPS GET that returns parsed JSON */
function httpsGetJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON parse error: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`HTTPS request failed: ${err.message}`));
    });
  });
}

/**
 * Calculate road distance between two points using Google Directions API
 * @param {number|string} originLat
 * @param {number|string} originLng
 * @param {number|string} destLat
 * @param {number|string} destLng
 * @returns {Promise<{distanceMiles: number, distanceKm: number, durationMinutes: number}>}
 */
export async function calculateRoadDistance(originLat, originLng, destLat, destLng) {
  // Read at call time so dotenv has loaded
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_KEY;
  if (!GOOGLE_API_KEY) {
    throw new Error('Google Maps API key not configured (GOOGLE_MAPS_API_KEY env var missing)');
  }

  // Parse coordinates to numbers (MySQL DECIMAL returns strings)
  originLat = parseFloat(originLat);
  originLng = parseFloat(originLng);
  destLat = parseFloat(destLat);
  destLng = parseFloat(destLng);

  if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
    throw new Error('All coordinates must be valid numbers');
  }

  // Check cache
  const key = cacheKey(originLat, originLng, destLat, destLng);
  const cached = distanceCache.get(key);
  if (cached && (Date.now() - cached.cachedAt) < 24 * 60 * 60 * 1000) {
    return cached.result;
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${GOOGLE_API_KEY}`;

  const data = await httpsGetJSON(url);

  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    console.error('Google Directions API error:', data.status, data.error_message);
    throw new Error(`Google Directions API error: ${data.status}`);
  }

  const leg = data.routes[0].legs[0];
  const distanceKm = leg.distance.value / 1000;
  const distanceMiles = parseFloat((distanceKm * KM_TO_MILES).toFixed(2));
  const durationMinutes = Math.round(leg.duration.value / 60);

  const result = { distanceMiles, distanceKm: parseFloat(distanceKm.toFixed(2)), durationMinutes };

  // Store in cache
  distanceCache.set(key, { result, cachedAt: Date.now() });
  pruneCache();

  return result;
}

export default { calculateRoadDistance };
