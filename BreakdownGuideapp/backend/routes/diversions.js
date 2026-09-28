/**
 * Route diversions
 *
 * Plan and record temporary diversions around road closures.
 *
 *   GET   /api/diversions/geometry/:route?direction=  route path + stops for the planner map
 *   POST  /api/diversions/plan                        candidate diversions around a closure
 *   GET   /api/diversions?scope=current|upcoming|past|all&route=
 *   GET   /api/diversions/:id
 *   POST  /api/diversions                             save a diversion
 *   PATCH /api/diversions/:id                         end / cancel / edit
 *
 * Road paths: the Maps key in use is referrer-restricted, which Google rejects
 * for server-side Directions calls (REQUEST_DENIED). So the browser fetches the
 * road options (Maps JS DirectionsService, which accepts that key) and posts
 * them back here to be checked; with `clientDirections` the server doesn't try
 * Google itself. If a server key is configured later, omitting it lets the
 * server fetch them directly.
 *
 * Planning works on the route's real road shape (GTFS shapes) and stop order:
 * the bus leaves the route after the last stop before the closure and rejoins
 * at the first stop after it (either can be widened), and Google Directions
 * supplies road paths between those two stops. A path that still runs past the
 * closure is flagged - Google doesn't know about local closures - and the
 * supervisor can add via-points to force a different road.
 *
 * Times: the pool writes/reads DATETIME as UTC while MySQL's NOW() is local
 * (BST), so "now" is always passed in from JS, never NOW().
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import express from 'express';
import { query } from '../config/mysql.js';
import { demoSqlFilter } from '../utils/demoFilter.js';
import { getDrivingRoutes, stripHtml } from '../services/googleDirectionsService.js';

const router = express.Router();

const METERS_PER_MILE = 1609.344;
const CLICK_TOLERANCE_M = 200;     // how close a click must be to the route line
const STOP_BUFFER_M = 40;          // stops this close to the closure count as blocked
const CLOSED_ROAD_M = 20;          // a path this close to the closed stretch still uses it
const SINGLE_POINT_HALF_M = 40;    // a one-click closure covers this much road either side
const DETOUR_OFFSETS_M = [300, 650, 1100]; // how far either side of the closure to try detours
const DETOUR_SNAP_M = 450;          // detour points snap to a bus stop within this distance
const TURN_PENALTY_M = 120;         // ranking: each turn counts as this much extra distance
const SERVED_STOP_M = 45;          // stops this close to a diversion path could be served
const REASONS = new Set(['road_closure', 'roadworks', 'incident', 'event', 'weather', 'other']);

// ── Geometry helpers (equirectangular - accurate enough at city scale) ─────────

const toXY = (lat, lng, lat0) => {
  const k = Math.PI / 180;
  return [lng * k * 6371000 * Math.cos(lat0 * k), lat * k * 6371000];
};

function distM(a, b) {
  const [x1, y1] = toXY(a[0], a[1], a[0]);
  const [x2, y2] = toXY(b[0], b[1], a[0]);
  return Math.hypot(x2 - x1, y2 - y1);
}

function distToSegmentM(p, a, b) {
  const lat0 = p[0];
  const [px, py] = toXY(p[0], p[1], lat0);
  const [ax, ay] = toXY(a[0], a[1], lat0);
  const [bx, by] = toXY(b[0], b[1], lat0);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distToPathM(p, path) {
  if (path.length === 1) return distM(p, path[0]);
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const d = distToSegmentM(p, path[i - 1], path[i]);
    if (d < best) best = d;
  }
  return best;
}

/** True when a path doubles back on itself (e.g. into a cul-de-sac estate and out) */
function hasLoop(path) {
  if (path.length < 8) return false;
  const along = [0];
  for (let i = 1; i < path.length; i++) along.push(along[i - 1] + distM(path[i - 1], path[i]));
  const step = Math.max(1, Math.floor(path.length / 250));
  for (let i = 0; i < path.length; i += step) {
    for (let j = i + step; j < path.length; j += step) {
      if (along[j] - along[i] > 400 && distM(path[i], path[j]) < 30) return true;
    }
  }
  return false;
}

function pathBounds(path, padM) {
  let minLat = Infinity; let maxLat = -Infinity; let minLng = Infinity; let maxLng = -Infinity;
  path.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
  });
  const dLat = padM / 111320;
  const dLng = padM / (111320 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180));
  return { minLat: minLat - dLat, maxLat: maxLat + dLat, minLng: minLng - dLng, maxLng: maxLng + dLng };
}

const parseTimeMins = (t) => {
  if (!t) return null;
  const [h, m, s] = String(t).split(':').map(Number);
  return Number.isNaN(h) ? null : h * 60 + (m || 0) + (s || 0) / 60;
};

const parseJson = (v, fallback) => {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

// ── Route geometry (cached - GTFS is static between imports) ───────────────────

const geometryCache = new Map();
const GEOMETRY_TTL_MS = 60 * 60 * 1000;
const GEOMETRY_MAX = 60;

async function findRoute(routeRef) {
  const rows = await query(
    `SELECT route_id, route_short_name FROM gtfs_routes
     WHERE route_short_name = ? OR route_id = ? LIMIT 1`,
    [routeRef, routeRef]
  );
  return rows[0] || null;
}

/** Each direction's most common shape/pattern, with a trip that uses it. */
async function routeDirections(routeId) {
  const rows = await query(
    `SELECT direction_id, shape_id, trip_headsign, MIN(trip_id) AS trip_id, COUNT(*) AS trips
     FROM gtfs_trips
     WHERE route_id = ? AND shape_id IS NOT NULL
     GROUP BY direction_id, shape_id, trip_headsign
     ORDER BY trips DESC`,
    [routeId]
  );
  const byDir = new Map();
  rows.forEach(r => {
    const dir = r.direction_id == null ? 0 : Number(r.direction_id);
    if (!byDir.has(dir)) {
      byDir.set(dir, { directionId: dir, headsign: r.trip_headsign || null, shapeId: r.shape_id, tripId: r.trip_id });
    }
  });
  return [...byDir.values()].sort((a, b) => a.directionId - b.directionId);
}

async function loadGeometry(routeRef, directionId) {
  const route = await findRoute(routeRef);
  if (!route) return null;
  const directions = await routeDirections(route.route_id);
  if (!directions.length) return { route, directions, error: 'No mapped trips for this route' };

  const dir = directions.find(d => d.directionId === Number(directionId)) || directions[0];
  const key = `${route.route_id}|${dir.directionId}`;
  const cached = geometryCache.get(key);
  if (cached && Date.now() - cached.at < GEOMETRY_TTL_MS) return cached.value;

  const [shapeRows, stopRows] = await Promise.all([
    query(
      `SELECT shape_pt_lat AS lat, shape_pt_lon AS lng
       FROM gtfs_shapes WHERE shape_id = ? ORDER BY shape_pt_sequence`,
      [dir.shapeId]
    ),
    query(
      `SELECT st.stop_id, st.stop_sequence, st.departure_time, s.stop_name, s.stop_lat, s.stop_lon
       FROM gtfs_stop_times st
       JOIN gtfs_stops s ON s.stop_id = st.stop_id
       WHERE st.trip_id = ?
       ORDER BY st.stop_sequence`,
      [dir.tripId]
    ),
  ]);

  const path = shapeRows.map(r => [parseFloat(r.lat), parseFloat(r.lng)]);
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) cumulative.push(cumulative[i - 1] + distM(path[i - 1], path[i]));

  // Place each stop on the shape, moving forwards only so loops don't confuse it
  let from = 0;
  const stops = stopRows.map(r => {
    const pos = [parseFloat(r.stop_lat), parseFloat(r.stop_lon)];
    let bestIdx = from;
    let best = Infinity;
    for (let i = from; i < path.length; i++) {
      const d = distM(pos, path[i]);
      if (d < best) { best = d; bestIdx = i; }
    }
    from = bestIdx;
    return {
      stopId: r.stop_id,
      name: r.stop_name,
      lat: pos[0],
      lng: pos[1],
      sequence: r.stop_sequence,
      departure: r.departure_time ? String(r.departure_time).slice(0, 5) : null,
      departureMins: parseTimeMins(r.departure_time),
      shapeIndex: bestIdx,
      distAlong: cumulative[bestIdx] || 0,
    };
  });

  const value = {
    route: { routeId: route.route_id, shortName: route.route_short_name },
    directions: directions.map(d => ({ directionId: d.directionId, headsign: d.headsign })),
    directionId: dir.directionId,
    headsign: dir.headsign,
    path,
    cumulative,
    stops,
  };
  geometryCache.set(key, { at: Date.now(), value });
  if (geometryCache.size > GEOMETRY_MAX) geometryCache.delete(geometryCache.keys().next().value);
  return value;
}

const publicGeometry = (g) => ({
  route: g.route,
  directions: g.directions,
  directionId: g.directionId,
  headsign: g.headsign,
  path: g.path,
  stops: g.stops.map(({ departureMins, ...s }) => s),
});

// ── Diversion state ───────────────────────────────────────────────────────────

function stateOf(row, now = new Date()) {
  if (row.status !== 'active') return 'past';
  const start = new Date(row.start_at);
  const end = row.end_at ? new Date(row.end_at) : null;
  if (start > now) return 'upcoming';
  if (end && end <= now) return 'past';
  return 'current';
}

function formatDiversion(row, { full = false } = {}) {
  const base = {
    id: row.id,
    routeId: row.route_id,
    routeShortName: row.route_short_name,
    directionId: row.direction_id,
    directionLabel: row.direction_label,
    title: row.title,
    reason: row.reason,
    closureDescription: row.closure_description,
    closure: row.closure_lat != null ? { lat: parseFloat(row.closure_lat), lng: parseFloat(row.closure_lng) } : null,
    from: { stopId: row.from_stop_id, name: row.from_stop_name },
    to: { stopId: row.to_stop_id, name: row.to_stop_name },
    missedStops: parseJson(row.missed_stops, []),
    servedStops: parseJson(row.served_stops, []),
    extraMiles: row.extra_miles != null ? parseFloat(row.extra_miles) : null,
    extraMinutes: row.extra_minutes,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    state: stateOf(row),
    endedAt: row.ended_at,
    notes: row.notes,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
  if (!full) return base;
  return { ...base, path: parseJson(row.diversion_path, []), directions: parseJson(row.directions, []) };
}

/** Current diversions (not ended, started, not past their end time) for this session's dataset. */
export async function getCurrentDiversions(user) {
  const now = new Date();
  const rows = await query(
    `SELECT * FROM route_diversions
     WHERE status = 'active' AND start_at <= ? AND (end_at IS NULL OR end_at > ?)${demoSqlFilter(user)}
     ORDER BY start_at DESC`,
    [now, now]
  );
  return rows.map(r => formatDiversion(r));
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/geometry/:route', async (req, res) => {
  try {
    const g = await loadGeometry(req.params.route, req.query.direction);
    if (!g) return res.status(404).json({ success: false, error: 'Route not found' });
    if (g.error) return res.status(404).json({ success: false, error: g.error });
    res.json({ success: true, geometry: publicGeometry(g) });
  } catch (error) {
    console.error('Error loading route geometry:', error);
    res.status(500).json({ success: false, error: 'Failed to load route' });
  }
});

router.post('/plan', async (req, res) => {
  try {
    const {
      routeShortName, directionId, closure, closureEnd, via = [], fromStopId, toStopId,
      candidates: clientCandidates, clientDirections = false,
    } = req.body || {};
    const cLat = parseFloat(closure?.lat);
    const cLng = parseFloat(closure?.lng);
    if (!routeShortName || Number.isNaN(cLat) || Number.isNaN(cLng)) {
      return res.status(400).json({ success: false, error: 'Route and closure location are required' });
    }
    const viaPoints = (Array.isArray(via) ? via : [])
      .slice(0, 8)
      .map(p => [parseFloat(p.lat ?? p[0]), parseFloat(p.lng ?? p[1])])
      .filter(([a, b]) => !Number.isNaN(a) && !Number.isNaN(b));

    const g = await loadGeometry(routeShortName, directionId);
    if (!g || g.error) return res.status(404).json({ success: false, error: g?.error || 'Route not found' });

    // Snap the closure (one point, or both ends of a closed stretch) onto the route
    const snap = (pt) => {
      let idx = 0;
      let best = Infinity;
      g.path.forEach((p, i) => { const d = distM(pt, p); if (d < best) { best = d; idx = i; } });
      return { idx, best };
    };
    const a = snap([cLat, cLng]);
    const eLat = parseFloat(closureEnd?.lat);
    const eLng = parseFloat(closureEnd?.lng);
    const b2 = !Number.isNaN(eLat) && !Number.isNaN(eLng) ? snap([eLat, eLng]) : null;
    if (a.best > CLICK_TOLERANCE_M || (b2 && b2.best > CLICK_TOLERANCE_M)) {
      return res.status(400).json({ success: false, error: 'Mark the closure on the route line' });
    }
    let startAlong = g.cumulative[a.idx];
    let endAlong = b2 ? g.cumulative[b2.idx] : startAlong;
    if (endAlong < startAlong) [startAlong, endAlong] = [endAlong, startAlong];
    if (!b2 || endAlong - startAlong < 2 * SINGLE_POINT_HALF_M) {
      const mid = (startAlong + endAlong) / 2;
      startAlong = Math.min(startAlong, mid - SINGLE_POINT_HALF_M);
      endAlong = Math.max(endAlong, mid + SINGLE_POINT_HALF_M);
    }
    // The closed stretch as points along the route shape
    const section = [];
    const inner = []; // the stretch minus 30 m at each end, where the junctions are
    for (let i = 0; i < g.path.length; i++) {
      const along = g.cumulative[i];
      if (along >= startAlong && along <= endAlong) section.push(g.path[i]);
      if (along >= startAlong + 30 && along <= endAlong - 30) inner.push(g.path[i]);
    }
    if (section.length === 0) section.push(g.path[a.idx]);
    if (inner.length === 0) inner.push(section[Math.floor(section.length / 2)]);
    const closurePt = g.path[a.idx];

    // Leave after the last stop clear of the closure, rejoin at the first stop past it
    let fromIdx = -1;
    let toIdx = -1;
    g.stops.forEach((s, i) => {
      if (s.distAlong < startAlong - STOP_BUFFER_M) fromIdx = i;
      if (toIdx === -1 && s.distAlong > endAlong + STOP_BUFFER_M) toIdx = i;
    });
    // Supervisor can leave earlier / rejoin later (but not straddle the closure the wrong way)
    if (fromStopId) {
      const i = g.stops.findIndex(s => s.stopId === fromStopId);
      if (i !== -1 && i <= fromIdx) fromIdx = i;
    }
    if (toStopId) {
      const i = g.stops.findIndex(s => s.stopId === toStopId);
      if (i !== -1 && i >= toIdx && toIdx !== -1) toIdx = i;
    }
    if (fromIdx === -1) return res.status(400).json({ success: false, error: 'The closure is before the first stop, so there is nowhere to divert from' });
    if (toIdx === -1) return res.status(400).json({ success: false, error: 'The closure is after the last stop, so there is nowhere to rejoin' });

    const from = g.stops[fromIdx];
    const to = g.stops[toIdx];
    const missedStops = g.stops.slice(fromIdx + 1, toIdx).map(s => ({ stopId: s.stopId, name: s.name, lat: s.lat, lng: s.lng }));
    const originalPath = g.path.slice(from.shapeIndex, to.shapeIndex + 1);
    const originalMeters = to.distAlong - from.distAlong;
    const scheduledMinutes = from.departureMins != null && to.departureMins != null
      ? Math.max(0, Math.round(to.departureMins - from.departureMins))
      : null;

    // Road options: supplied by the browser, or fetched here when possible
    let routes = [];
    if (Array.isArray(clientCandidates) && clientCandidates.length) {
      routes = clientCandidates.slice(0, 12).map(c => ({
        path: (Array.isArray(c.path) ? c.path : []).slice(0, 8000)
          .map(p => [parseFloat(p[0]), parseFloat(p[1])])
          .filter(([a, b]) => !Number.isNaN(a) && !Number.isNaN(b)),
        distanceMeters: parseInt(c.distanceMeters, 10) || 0,
        durationSeconds: parseInt(c.durationSeconds, 10) || 0,
        summary: String(c.summary || '').slice(0, 120),
        steps: (Array.isArray(c.steps) ? c.steps : []).slice(0, 200).map(st => ({
          instruction: stripHtml(st.instruction).slice(0, 500),
          distanceMeters: parseInt(st.distanceMeters, 10) || 0,
        })),
      })).filter(r => r.path.length >= 2);
    } else if (!clientDirections) {
      routes = await getDrivingRoutes([from.lat, from.lng], [to.lat, to.lng], { via: viaPoints });
    }

    // Stops near any candidate path, fetched once for the union bounding box
    const allPts = routes.flatMap(r => r.path);
    const b = pathBounds(allPts.length ? allPts : [[from.lat, from.lng], [to.lat, to.lng]], SERVED_STOP_M);
    const nearby = await query(
      `SELECT stop_id, stop_name, stop_lat, stop_lon FROM gtfs_stops
       WHERE stop_lat BETWEEN ? AND ? AND stop_lon BETWEEN ? AND ?
       LIMIT 3000`,
      [b.minLat, b.maxLat, b.minLng, b.maxLng]
    );
    const routeStopIds = new Set(g.stops.map(s => s.stopId));

    // Does a path still run along the closed stretch? Check the stretch's inner
    // points (sampled) against the path
    const sectionSample = inner.length > 60
      ? inner.filter((_, i) => i % Math.ceil(inner.length / 60) === 0)
      : inner;
    const usesClosed = (path) => sectionSample.some(pt => distToPathM(pt, path) <= CLOSED_ROAD_M);

    const scored = routes.map((r, i) => {
      const usesClosedRoad = usesClosed(r.path);
      const servedStops = nearby
        .filter(s => !routeStopIds.has(s.stop_id) || missedStops.some(m => m.stopId === s.stop_id))
        .map(s => ({ stopId: s.stop_id, name: s.stop_name, lat: parseFloat(s.stop_lat), lng: parseFloat(s.stop_lon) }))
        .filter(s => distToPathM([s.lat, s.lng], r.path) <= SERVED_STOP_M);
      // A 'missed' stop the diversion still passes isn't really missed
      const stillMissed = missedStops.filter(m => distToPathM([m.lat, m.lng], r.path) > SERVED_STOP_M);
      return {
        id: `opt-${i + 1}`,
        summary: r.summary,
        hasLoop: hasLoop(r.path),
        turns: r.steps.length,
        path: r.path,
        steps: r.steps,
        distanceMeters: r.distanceMeters,
        durationMinutes: Math.round(r.durationSeconds / 60),
        extraMiles: Math.round(((r.distanceMeters - originalMeters) / METERS_PER_MILE) * 10) / 10,
        // Extra driving time for the extra distance, at this option's own average
        // speed (comparing with the timetable would count dwell time at stops)
        extraMinutes: r.distanceMeters > 0
          ? Math.round((r.durationSeconds / 60) * ((r.distanceMeters - originalMeters) / r.distanceMeters))
          : null,
        usesClosedRoad,
        missedStops: stillMissed,
        servedStops: servedStops.filter(s => !missedStops.some(m => m.stopId === s.stopId)).slice(0, 30),
      };
    }).sort((a, b) => Number(a.usesClosedRoad) - Number(b.usesClosedRoad)
      || Number(a.hasLoop) - Number(b.hasLoop)
      // Simple routes first: a short diversion with a dozen turns through an
      // estate is worse for a bus than a slightly longer one on main roads
      || (a.distanceMeters + TURN_PENALTY_M * a.turns) - (b.distanceMeters + TURN_PENALTY_M * b.turns));

    // Drop near-duplicates (the detour attempts often land on the same roads)
    const candidates = [];
    scored.forEach(c => {
      const dup = candidates.some(k => k.usesClosedRoad === c.usesClosedRoad
        && Math.abs(k.distanceMeters - c.distanceMeters) <= Math.max(60, k.distanceMeters * 0.03));
      if (!dup && candidates.length < 5) candidates.push(c);
    });
    candidates.forEach((c, i) => { c.id = `opt-${i + 1}`; });

    // Detours for the browser to try (Google has no 'avoid this road'): for
    // each side and distance, a pair of via points beside each end of the closed
    // stretch, which steers the route onto a parallel road rather than up the
    // closed one and off again
    const first = section[0];
    const last = section[section.length - 1];
    const mid = section[Math.floor(section.length / 2)];
    const [fx, fy] = toXY(first[0], first[1], mid[0]);
    const [lx, ly] = toXY(last[0], last[1], mid[0]);
    let dx = lx - fx;
    let dy = ly - fy;
    if (Math.hypot(dx, dy) < 1) { dx = to.lng - from.lng; dy = to.lat - from.lat; }
    const len = Math.hypot(dx, dy) || 1;
    const perp = [-dy / len, dx / len]; // unit vector across the road (x=east, y=north)
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(mid[0] * Math.PI / 180);
    const offset = (pt, off, side) => [
      Math.round((pt[0] + (perp[1] * off * side) / mPerDegLat) * 1e6) / 1e6,
      Math.round((pt[1] + (perp[0] * off * side) / mPerDegLng) * 1e6) / 1e6,
    ];
    // Snap each point to the nearest bus stop that isn't on the closed road:
    // stops sit on roads buses already use, so this keeps detours on bus-suitable
    // roads instead of threading through housing estates
    const reach = Math.max(...DETOUR_OFFSETS_M) + DETOUR_SNAP_M + distM(first, last);
    const sb = pathBounds([first, last], reach);
    const stopPool = (await query(
      `SELECT stop_lat, stop_lon FROM gtfs_stops
       WHERE stop_lat BETWEEN ? AND ? AND stop_lon BETWEEN ? AND ?
       LIMIT 4000`,
      [sb.minLat, sb.maxLat, sb.minLng, sb.maxLng]
    )).map(r => [parseFloat(r.stop_lat), parseFloat(r.stop_lon)])
      .filter(pt => distToPathM(pt, section) > 200 && distToPathM(pt, originalPath) > 120);
    const snapToStop = (pt) => {
      let best = null;
      let bestD = DETOUR_SNAP_M;
      stopPool.forEach(sp => { const d = distM(pt, sp); if (d < bestD) { bestD = d; best = sp; } });
      return best;
    };
    const shortStretch = distM(first, last) < 150;
    const seen = new Set();
    const detourVias = [];
    DETOUR_OFFSETS_M.forEach(off => [1, -1].forEach(side => {
      const raw = shortStretch ? [offset(mid, off, side)] : [offset(first, off, side), offset(last, off, side)];
      const snapped = raw.map(snapToStop);
      if (snapped.some(p => !p)) return;
      const key = snapped.map(p => p.join(',')).join('|');
      if (seen.has(key)) return;
      seen.add(key);
      detourVias.push(snapped);
    }));

    res.json({
      success: true,
      plan: {
        route: g.route,
        directionId: g.directionId,
        headsign: g.headsign,
        closure: { lat: cLat, lng: cLng, snapped: closurePt, section, end: b2 ? { lat: eLat, lng: eLng } : null },
        detourVias,
        from: { stopId: from.stopId, name: from.name, lat: from.lat, lng: from.lng, index: fromIdx },
        to: { stopId: to.stopId, name: to.name, lat: to.lat, lng: to.lng, index: toIdx },
        missedStops,
        original: { path: originalPath, distanceMeters: Math.round(originalMeters), scheduledMinutes },
        via: viaPoints,
        candidates,
      },
    });
  } catch (error) {
    console.error('Error planning diversion:', error);
    const google = /Google Directions/.test(error.message || '');
    res.status(google ? 502 : 500).json({
      success: false,
      error: google ? 'Couldn’t get road directions for this diversion. Try moving the closure or adding a via point.' : 'Failed to plan diversion',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const scope = ['current', 'upcoming', 'past', 'all'].includes(req.query.scope) ? req.query.scope : 'all';
    const params = [];
    let sql = `SELECT * FROM route_diversions WHERE 1=1${demoSqlFilter(req.user)}`;
    if (req.query.route) {
      sql += ' AND route_short_name = ?';
      params.push(String(req.query.route));
    }
    sql += ' ORDER BY start_at DESC LIMIT 200';
    const rows = await query(sql, params);
    const list = rows.map(r => formatDiversion(r)).filter(d => scope === 'all' || d.state === scope);
    res.json({ success: true, diversions: list });
  } catch (error) {
    console.error('Error listing diversions:', error);
    res.status(500).json({ success: false, error: 'Failed to load diversions' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM route_diversions WHERE id = ?${demoSqlFilter(req.user)}`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Diversion not found' });
    res.json({ success: true, diversion: formatDiversion(rows[0], { full: true }) });
  } catch (error) {
    console.error('Error loading diversion:', error);
    res.status(500).json({ success: false, error: 'Failed to load diversion' });
  }
});

const cleanStops = (list) => (Array.isArray(list) ? list : []).slice(0, 200).map(s => ({
  stopId: String(s.stopId || '').slice(0, 100),
  name: String(s.name || '').slice(0, 255),
  lat: parseFloat(s.lat) || null,
  lng: parseFloat(s.lng) || null,
}));

router.post('/', async (req, res) => {
  try {
    const d = req.body || {};
    const title = String(d.title || '').trim();
    if (!d.routeShortName || !title) {
      return res.status(400).json({ success: false, error: 'Route and title are required' });
    }
    const startAt = d.startAt ? new Date(d.startAt) : new Date();
    const endAt = d.endAt ? new Date(d.endAt) : null;
    if (Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime()))) {
      return res.status(400).json({ success: false, error: 'Invalid start or end time' });
    }
    if (endAt && endAt <= startAt) {
      return res.status(400).json({ success: false, error: 'The end time must be after the start time' });
    }
    const path = (Array.isArray(d.path) ? d.path : []).slice(0, 8000)
      .map(p => [parseFloat(p[0]), parseFloat(p[1])])
      .filter(([a, b]) => !Number.isNaN(a) && !Number.isNaN(b));
    if (path.length < 2) {
      return res.status(400).json({ success: false, error: 'Choose a diversion route before saving' });
    }
    const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 200).map(s => ({
      instruction: String(s.instruction || '').slice(0, 500),
      distanceMeters: parseInt(s.distanceMeters, 10) || 0,
    }));
    const route = await findRoute(d.routeShortName);
    const [row] = await query('SELECT UUID() AS id');
    const id = row.id;

    await query(
      `INSERT INTO route_diversions (
         id, route_id, route_short_name, direction_id, direction_label, title, reason,
         closure_description, closure_lat, closure_lng, from_stop_id, from_stop_name,
         to_stop_id, to_stop_name, diversion_path, directions, missed_stops, served_stops,
         extra_miles, extra_minutes, start_at, end_at, status, notes,
         created_by, created_by_name, supervisor_badge
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      [
        id,
        route?.route_id || null,
        route?.route_short_name || String(d.routeShortName).slice(0, 50),
        d.directionId == null ? null : parseInt(d.directionId, 10),
        d.directionLabel ? String(d.directionLabel).slice(0, 255) : null,
        title.slice(0, 200),
        REASONS.has(d.reason) ? d.reason : 'road_closure',
        d.closureDescription ? String(d.closureDescription).slice(0, 255) : null,
        parseFloat(d.closure?.lat) || null,
        parseFloat(d.closure?.lng) || null,
        d.from?.stopId ? String(d.from.stopId).slice(0, 100) : null,
        d.from?.name ? String(d.from.name).slice(0, 255) : null,
        d.to?.stopId ? String(d.to.stopId).slice(0, 100) : null,
        d.to?.name ? String(d.to.name).slice(0, 255) : null,
        JSON.stringify(path),
        JSON.stringify(steps),
        JSON.stringify(cleanStops(d.missedStops)),
        JSON.stringify(cleanStops(d.servedStops)),
        Number.isFinite(parseFloat(d.extraMiles)) ? parseFloat(d.extraMiles) : null,
        Number.isFinite(parseInt(d.extraMinutes, 10)) ? parseInt(d.extraMinutes, 10) : null,
        startAt,
        endAt,
        d.notes ? String(d.notes).slice(0, 2000) : null,
        req.user?.id || null,
        req.user?.name || null,
        req.user?.badge_number || null,
      ]
    );
    const rows = await query('SELECT * FROM route_diversions WHERE id = ?', [id]);
    res.json({ success: true, diversion: formatDiversion(rows[0], { full: true }) });
  } catch (error) {
    console.error('Error saving diversion:', error);
    res.status(500).json({ success: false, error: 'Failed to save diversion' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT * FROM route_diversions WHERE id = ?${demoSqlFilter(req.user)}`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Diversion not found' });
    const current = rows[0];
    const { action, title, notes, endAt } = req.body || {};
    const now = new Date();
    const fields = {};

    if (action === 'end' || action === 'cancel') {
      if (current.status !== 'active') {
        return res.status(400).json({ success: false, error: 'This diversion has already finished' });
      }
      fields.status = action === 'end' ? 'ended' : 'cancelled';
      fields.ended_at = now;
      if (!current.end_at || new Date(current.end_at) > now) fields.end_at = now;
    }
    if (title !== undefined && String(title).trim()) fields.title = String(title).trim().slice(0, 200);
    if (notes !== undefined) fields.notes = notes ? String(notes).slice(0, 2000) : null;
    if (endAt !== undefined && !fields.end_at) {
      const e = endAt ? new Date(endAt) : null;
      if (e && (Number.isNaN(e.getTime()) || e <= new Date(current.start_at))) {
        return res.status(400).json({ success: false, error: 'The end time must be after the start time' });
      }
      fields.end_at = e;
    }
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ success: false, error: 'Nothing to change' });

    await query(
      `UPDATE route_diversions SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...keys.map(k => fields[k]), current.id]
    );
    const updated = await query('SELECT * FROM route_diversions WHERE id = ?', [current.id]);
    res.json({ success: true, diversion: formatDiversion(updated[0], { full: true }) });
  } catch (error) {
    console.error('Error updating diversion:', error);
    res.status(500).json({ success: false, error: 'Failed to update diversion' });
  }
});

export default router;
