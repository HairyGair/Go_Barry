/**
 * StopFinder - Search stops by name or map click, view departures
 * Feature 6 of GTFS Phase 2
 * Enhanced with Google Places Autocomplete for landmark/address search
 * v2.0 - Supervisor power tool: route badges, timetable links, depot indicator,
 *         live breakdowns, diversion planning, deep link support
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../components/DashboardLayout';
import { gtfsApiService } from '../../services/gtfsApiService';
import { apiClient } from '../../services/api-client';
import './StopFinder.css';

const NE_CENTER = [54.97, -1.60]; // Newcastle center
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// Bias Places results to North East England
const NE_BOUNDS = { north: 55.15, south: 54.75, east: -1.3, west: -2.0 };

// Depot locations
const DEPOTS = [
  { name: 'Riverside', lat: 54.9575, lng: -1.5867 },
  { name: 'Deptford', lat: 54.9509, lng: -1.5293 },
  { name: 'Percy Main', lat: 55.0058, lng: -1.4770 },
  { name: 'Washington', lat: 54.8986, lng: -1.5166 },
  { name: 'Consett', lat: 54.8508, lng: -1.8311 },
  { name: 'Hexham', lat: 54.9710, lng: -2.1016 },
];

/** Haversine distance in km */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const stopIcon = L.divIcon({
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#00838F;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  className: '',
});

const activeStopIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#00BCD4;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Moves the map to a given position */
function MapFlyTo({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom || 16, { duration: 1 });
  }, [position, zoom, map]);
  return null;
}

/** Load Google Places script once */
function useGooglePlaces() {
  const [ready, setReady] = useState(false);
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_API_KEY) return;
    if (window.google?.maps?.places) {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      setReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      serviceRef.current = new window.google.maps.places.AutocompleteService();
      setReady(true);
    };
    document.head.appendChild(script);
  }, []);

  return { ready, service: serviceRef };
}

const StopFinder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [error, setError] = useState(null);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [flyToPos, setFlyToPos] = useState(null);
  const [placeName, setPlaceName] = useState(null);

  // Feature 4: copy feedback
  const [copiedTooltip, setCopiedTooltip] = useState(false);

  // Feature 5: live breakdowns
  const [liveBreakdowns, setLiveBreakdowns] = useState([]);
  const breakdownRefreshRef = useRef(null);

  // Feature 7: diversion planning
  const [diversionData, setDiversionData] = useState({ sameRoutes: [], otherRoutes: [] });
  const [loadingDiversion, setLoadingDiversion] = useState(false);
  const [showDiversion, setShowDiversion] = useState(false);
  const [diversionRadius, setDiversionRadius] = useState(0.5); // km
  const diversionAbortRef = useRef(null);

  // Feature 9: grouped vs chronological view
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'chronological'

  // Feature 10: nearby stops
  const [nearbyStops, setNearbyStops] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Feature 8: deep link handled flag
  const deepLinkHandled = useRef(false);

  // AbortControllers for cancelling stale requests
  const depsAbortRef = useRef(null);
  const searchAbortRef = useRef(null);
  const depsInFlightRef = useRef(false);

  const searchTimeout = useRef(null);
  const refreshInterval = useRef(null);
  const { ready: placesReady, service: placesService } = useGooglePlaces();

  // === Feature 1: unique routes from departures ===
  const uniqueRoutes = useMemo(() => {
    if (!departures || departures.length === 0) return [];
    const seen = new Map();
    for (const dep of departures) {
      if (dep.routeShortName && !seen.has(dep.routeShortName)) {
        seen.set(dep.routeShortName, dep.routeShortName);
      }
    }
    // Sort numerically when possible
    return Array.from(seen.keys()).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [departures]);

  // === Feature 3: nearest depot ===
  const nearestDepot = useMemo(() => {
    if (!selectedStop) return null;
    let best = null;
    let bestDist = Infinity;
    for (const depot of DEPOTS) {
      const dist = haversineKm(selectedStop.lat, selectedStop.lng, depot.lat, depot.lng);
      if (dist < bestDist) {
        bestDist = dist;
        best = depot;
      }
    }
    return best ? { name: best.name, distanceKm: bestDist } : null;
  }, [selectedStop]);

  // === Feature 4: first/last bus ===
  const firstLastBus = useMemo(() => {
    if (!departures || departures.length === 0) return null;
    const times = departures
      .map(d => d.departureTime?.substring(0, 5))
      .filter(Boolean)
      .sort();
    if (times.length === 0) return null;
    return { first: times[0], last: times[times.length - 1] };
  }, [departures]);

  // === Feature 9: group departures by route ===
  const groupedDepartures = useMemo(() => {
    if (!departures || departures.length === 0) return [];
    const groups = new Map();
    for (const dep of departures) {
      const key = dep.routeShortName || 'Unknown';
      if (!groups.has(key)) {
        groups.set(key, {
          routeShortName: key,
          routeLongName: dep.routeLongName || '',
          headsign: dep.headsign || '',
          departures: [],
        });
      }
      groups.get(key).departures.push(dep);
    }
    // Sort groups: numerically by route number
    return Array.from(groups.values()).sort((a, b) => {
      const na = parseInt(a.routeShortName, 10);
      const nb = parseInt(b.routeShortName, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.routeShortName.localeCompare(b.routeShortName);
    });
  }, [departures]);

  // === Feature 11: disrupted routes (from live breakdowns) ===
  const disruptedRoutes = useMemo(() => {
    if (!liveBreakdowns || liveBreakdowns.length === 0) return new Set();
    const routes = new Set();
    for (const brk of liveBreakdowns) {
      const r = brk.route_id || brk.service || brk.route_number || brk.route;
      if (r && r !== 'Unknown') routes.add(r.toString());
    }
    return routes;
  }, [liveBreakdowns]);

  // Cleanup all abort controllers on unmount
  useEffect(() => {
    return () => {
      if (depsAbortRef.current) depsAbortRef.current.abort();
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (diversionAbortRef.current) diversionAbortRef.current.abort();
    };
  }, []);

  // === Feature 5: fetch live breakdowns (no retries - non-critical) ===
  const fetchBreakdowns = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/breakdowns/live', { retries: 1 });
      const breakdowns = data?.breakdowns || data?.data || [];
      setLiveBreakdowns(
        breakdowns.filter(b => b.location_lat && b.location_lng)
      );
    } catch (err) {
      console.error('Failed to fetch live breakdowns for map:', err);
    }
  }, []);

  useEffect(() => {
    fetchBreakdowns();
    breakdownRefreshRef.current = setInterval(fetchBreakdowns, 60000);
    return () => { if (breakdownRefreshRef.current) clearInterval(breakdownRefreshRef.current); };
  }, [fetchBreakdowns]);

  // Search stops + places by name (debounced, with abort)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery || searchQuery.length < 2) {
      if (!searchQuery) {
        setStops([]);
        setPlaceSuggestions([]);
      }
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      // Cancel any previous search
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setLoadingStops(true);
      setError(null);

      // GTFS stop search
      try {
        const res = await gtfsApiService.searchStops({ q: searchQuery, limit: 30, signal: controller.signal });
        if (!controller.signal.aborted) setStops(res?.stops || []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Stop search error:', err);
        setError('Failed to search stops. Check your connection and try again.');
      } finally {
        if (!controller.signal.aborted) setLoadingStops(false);
      }

      // Google Places autocomplete (parallel, non-blocking)
      if (placesReady && placesService.current) {
        try {
          placesService.current.getPlacePredictions(
            {
              input: searchQuery,
              locationBias: {
                north: NE_BOUNDS.north,
                south: NE_BOUNDS.south,
                east: NE_BOUNDS.east,
                west: NE_BOUNDS.west,
              },
              componentRestrictions: { country: 'gb' },
            },
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                setPlaceSuggestions(predictions.slice(0, 4));
              } else {
                setPlaceSuggestions([]);
              }
            }
          );
        } catch {
          setPlaceSuggestions([]);
        }
      }
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, placesReady]);

  // Handle selecting a Google Place - geocode it and find nearby stops
  const handleSelectPlace = useCallback(async (placeId, description) => {
    if (!window.google?.maps) return;

    setLoadingStops(true);
    setError(null);
    setPlaceSuggestions([]);
    setPlaceName(description);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId }, async (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        setError('Could not locate that place.');
        setLoadingStops(false);
        return;
      }

      const loc = results[0].geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();

      // Fly map to the place
      setFlyToPos([lat, lng]);

      // Find stops near this place
      try {
        const res = await gtfsApiService.searchStops({ lat, lng, radius_km: 0.5, limit: 30 });
        setStops(res?.stops || []);
        setSearchQuery('');
      } catch (err) {
        console.error('Proximity search error:', err);
        setError('Failed to search nearby stops.');
      } finally {
        setLoadingStops(false);
      }
    });
  }, []);

  // Handle map click - proximity search
  const handleMapClick = useCallback(async (lat, lng) => {
    setLoadingStops(true);
    setError(null);
    setPlaceSuggestions([]);
    setPlaceName(null);
    try {
      const res = await gtfsApiService.searchStops({ lat, lng, radius_km: 0.5, limit: 30 });
      setStops(res?.stops || []);
      setSearchQuery('');
    } catch (err) {
      console.error('Proximity search error:', err);
      setError('Failed to search nearby stops.');
    } finally {
      setLoadingStops(false);
    }
  }, []);

  // Load departures for selected stop (with abort + timeout)
  const loadDepartures = useCallback(async (stopId) => {
    // Cancel any in-flight departures request
    if (depsAbortRef.current) depsAbortRef.current.abort();
    const controller = new AbortController();
    depsAbortRef.current = controller;

    // 15-second timeout to prevent indefinite hanging
    const timeout = setTimeout(() => controller.abort(), 15000);
    depsInFlightRef.current = true;
    setLoadingDeps(true);
    setError(null);
    try {
      const res = await gtfsApiService.getStopDepartures(stopId, { limit: 50, signal: controller.signal });
      if (!controller.signal.aborted) {
        setDepartures(res?.departures || []);
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // Silently ignore cancelled requests
      console.error('Departures error:', err);
      setError('Departures unavailable — the query may be slow. Try again shortly.');
    } finally {
      clearTimeout(timeout);
      depsInFlightRef.current = false;
      if (!controller.signal.aborted) setLoadingDeps(false);
    }
  }, []);

  // Load nearby stops within 200m
  const loadNearbyStops = useCallback(async (lat, lng, excludeStopId) => {
    setLoadingNearby(true);
    try {
      const res = await gtfsApiService.searchStops({ lat, lng, radius_km: 0.2, limit: 8 });
      const nearby = (res?.stops || []).filter(s => s.stopId !== excludeStopId);
      setNearbyStops(nearby);
    } catch {
      setNearbyStops([]);
    } finally {
      setLoadingNearby(false);
    }
  }, []);

  // Select a stop
  const handleSelectStop = useCallback((stop) => {
    setSelectedStop(stop);
    setError(null);
    setPlaceName(null);
    setFlyToPos([stop.lat, stop.lng]);
    setShowDiversion(false);
    setDiversionData({ sameRoutes: [], otherRoutes: [] });
    setNearbyStops([]);
    if (diversionAbortRef.current) diversionAbortRef.current.abort();
    loadDepartures(stop.stopId);
    loadNearbyStops(stop.lat, stop.lng, stop.stopId);
  }, [loadDepartures, loadNearbyStops]);

  // Auto-refresh departures every 30 seconds (skip if request already in-flight)
  useEffect(() => {
    if (!selectedStop) return;

    refreshInterval.current = setInterval(() => {
      if (!depsInFlightRef.current) {
        loadDepartures(selectedStop.stopId);
      }
    }, 30000);

    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [selectedStop, loadDepartures]);

  // === Feature 8: deep link - read ?stop=STOP_ID on mount ===
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const stopParam = searchParams.get('stop');
    if (!stopParam) return;
    deepLinkHandled.current = true;

    (async () => {
      setLoadingStops(true);
      try {
        // Search by stop ID - the searchStops API supports q= for name, but we need ID
        // Try to fetch departures directly and construct a stop object
        const res = await gtfsApiService.searchStops({ q: stopParam, limit: 10 });
        const foundStops = res?.stops || [];
        // Exact match on stopId
        const match = foundStops.find(s => s.stopId === stopParam) || foundStops[0];
        if (match) {
          setStops(foundStops);
          handleSelectStop(match);
        }
      } catch (err) {
        console.error('Deep link stop lookup failed:', err);
      } finally {
        setLoadingStops(false);
      }
    })();
  }, [searchParams, handleSelectStop]);

  // === Feature 4: copy location ===
  const handleCopyLocation = useCallback(() => {
    if (!selectedStop) return;
    const text = `${selectedStop.stopName} (${selectedStop.lat.toFixed(6)}, ${selectedStop.lng.toFixed(6)})`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTooltip(true);
      setTimeout(() => setCopiedTooltip(false), 2000);
    });
  }, [selectedStop]);

  // === Feature 6: report breakdown here ===
  const handleReportBreakdown = useCallback(() => {
    if (!selectedStop) return;
    const params = new URLSearchParams();
    params.set('lat', selectedStop.lat);
    params.set('lng', selectedStop.lng);
    params.set('location', selectedStop.stopName);
    if (uniqueRoutes.length > 0) {
      params.set('routes', uniqueRoutes.join(','));
    }
    navigate(`/breakdown-guide?${params.toString()}`);
  }, [selectedStop, uniqueRoutes, navigate]);

  // Compass bearing from one point to another
  const compassDirection = useCallback((fromLat, fromLng, toLat, toLng) => {
    const dLng = (toLng - fromLng) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(toLat * Math.PI / 180);
    const x = Math.cos(fromLat * Math.PI / 180) * Math.sin(toLat * Math.PI / 180) -
              Math.sin(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.cos(dLng);
    const bearing = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(bearing / 45) % 8];
  }, []);

  // === Feature 7: find diversion stops for road closure/incident ===
  const handleFindDiversions = useCallback(async (radiusOverride) => {
    if (!selectedStop) return;
    const radius = radiusOverride ?? diversionRadius;

    // Cancel any in-flight diversion requests
    if (diversionAbortRef.current) diversionAbortRef.current.abort();
    const controller = new AbortController();
    diversionAbortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20000);

    setLoadingDiversion(true);
    setShowDiversion(true);
    setDiversionData({ sameRoutes: [], otherRoutes: [] });

    try {
      // Find stops within selected radius
      const res = await gtfsApiService.searchStops({
        lat: selectedStop.lat,
        lng: selectedStop.lng,
        radius_km: radius,
        limit: 25,
        signal: controller.signal,
      });
      const nearby = (res?.stops || []).filter(s => s.stopId !== selectedStop.stopId);

      if (controller.signal.aborted) return;

      // Fetch departures for each candidate (max 12) to find their routes
      const candidates = nearby.slice(0, 12);
      const depResults = await Promise.all(
        candidates.map(async (stop) => {
          try {
            const depRes = await gtfsApiService.getStopDepartures(stop.stopId, {
              limit: 30,
              signal: controller.signal,
            });
            const routes = [...new Set((depRes?.departures || []).map(d => d.routeShortName).filter(Boolean))];
            const distM = stop.distanceKm != null ? Math.round(stop.distanceKm * 1000) : null;
            const walkMins = distM != null ? Math.ceil(distM / 80) : null; // ~80m/min walking
            const direction = compassDirection(selectedStop.lat, selectedStop.lng, stop.lat, stop.lng);
            return { ...stop, routes, distM, walkMins, direction };
          } catch (err) {
            if (err.name === 'AbortError') throw err;
            const distM = stop.distanceKm != null ? Math.round(stop.distanceKm * 1000) : null;
            const walkMins = distM != null ? Math.ceil(distM / 80) : null;
            const direction = compassDirection(selectedStop.lat, selectedStop.lng, stop.lat, stop.lng);
            return { ...stop, routes: [], distM, walkMins, direction };
          }
        })
      );

      if (controller.signal.aborted) return;

      // Group into same routes vs other routes
      const currentRouteSet = new Set(uniqueRoutes);
      const sameRoutes = [];
      const otherRoutes = [];

      for (const stop of depResults) {
        if (stop.routes.length === 0) continue;
        const matchingRoutes = stop.routes.filter(r => currentRouteSet.has(r));
        const newRoutes = stop.routes.filter(r => !currentRouteSet.has(r));
        if (matchingRoutes.length > 0) {
          sameRoutes.push({ ...stop, matchingRoutes, newRoutes });
        } else {
          otherRoutes.push({ ...stop, matchingRoutes: [], newRoutes: stop.routes });
        }
      }

      // Sort by distance
      sameRoutes.sort((a, b) => (a.distM || 9999) - (b.distM || 9999));
      otherRoutes.sort((a, b) => (a.distM || 9999) - (b.distM || 9999));

      setDiversionData({ sameRoutes, otherRoutes });
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Diversion search error:', err);
      setError('Failed to find diversion options.');
    } finally {
      clearTimeout(timeout);
      if (!controller.signal.aborted) setLoadingDiversion(false);
    }
  }, [selectedStop, uniqueRoutes, diversionRadius, compassDirection]);

  // === Feature 2: navigate to timetable ===
  const handleRouteBadgeClick = useCallback((routeShortName) => {
    navigate(`/dashboards/gtfs/timetable?route=${encodeURIComponent(routeShortName)}`);
  }, [navigate]);

  return (
    <DashboardLayout>
      <div className="sf-container">
        {/* Map panel */}
        <div className="sf-map-panel">
          <MapContainer
            center={NE_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
            />

            <MapClickHandler onMapClick={handleMapClick} />
            <MapFlyTo position={flyToPos} zoom={16} />

            {/* Stop markers */}
            {stops.map(stop => (
              <Marker
                key={stop.stopId}
                position={[stop.lat, stop.lng]}
                icon={selectedStop?.stopId === stop.stopId ? activeStopIcon : stopIcon}
                eventHandlers={{
                  click: () => handleSelectStop(stop),
                }}
              >
                <Popup>
                  <strong>{stop.stopName}</strong>
                  {stop.distanceKm != null && <><br />{(stop.distanceKm * 1000).toFixed(0)}m away</>}
                </Popup>
              </Marker>
            ))}

            {/* Feature 5: live breakdown markers */}
            {liveBreakdowns.map((brk, i) => (
              <CircleMarker
                key={`brk-${brk.id || i}`}
                center={[parseFloat(brk.location_lat), parseFloat(brk.location_lng)]}
                radius={8}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: '#D32F2F' }}>Breakdown</strong><br />
                    {brk.fleet_no && <>Fleet: {brk.fleet_no}<br /></>}
                    {brk.severity && <>Severity: {brk.severity}<br /></>}
                    {brk.location_description || 'Unknown location'}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Feature 7: diversion markers - green = same routes, amber = other routes */}
            {showDiversion && diversionData.sameRoutes.map(stop => (
              <CircleMarker
                key={`div-${stop.stopId}`}
                center={[stop.lat, stop.lng]}
                radius={8}
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: '#059669' }}>{stop.stopName}</strong><br />
                    {stop.distM != null && <>{stop.distM}m {stop.direction} &middot; {stop.walkMins} min walk<br /></>}
                    <span style={{ color: '#059669' }}>Same routes: {stop.matchingRoutes.join(', ')}</span>
                    {stop.newRoutes.length > 0 && <><br />Also: {stop.newRoutes.join(', ')}</>}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {showDiversion && diversionData.otherRoutes.map(stop => (
              <CircleMarker
                key={`div-other-${stop.stopId}`}
                center={[stop.lat, stop.lng]}
                radius={7}
                pathOptions={{
                  color: '#F59E0B',
                  fillColor: '#F59E0B',
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: '#D97706' }}>{stop.stopName}</strong><br />
                    {stop.distM != null && <>{stop.distM}m {stop.direction} &middot; {stop.walkMins} min walk<br /></>}
                    Routes: {stop.newRoutes.join(', ')}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Breakdown count overlay */}
          {liveBreakdowns.length > 0 && (
            <div className="sf-breakdown-badge">
              {liveBreakdowns.length} active breakdown{liveBreakdowns.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="sf-info-panel">
          <div className="sf-search-bar">
            <input
              className="sf-search-input"
              type="text"
              placeholder="Search stop name or place..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPlaceName(null); }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="sf-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Stop results list */}
          {!selectedStop && (
            <div className="sf-results">
              {loadingStops && (
                <div className="sf-loading">
                  <div className="sf-spinner" />
                  Searching stops...
                </div>
              )}

              {/* Context label when showing stops near a place */}
              {!loadingStops && placeName && stops.length > 0 && (
                <div className="sf-place-context">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Stops near {placeName}
                </div>
              )}

              {/* GTFS stop results */}
              {stops.map(stop => (
                <div
                  key={stop.stopId}
                  className="sf-result-item"
                  onClick={() => handleSelectStop(stop)}
                >
                  <span className="sf-result-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="3" width="16" height="18" rx="2" /><line x1="4" y1="11" x2="20" y2="11" /><line x1="12" y1="3" x2="12" y2="21" />
                    </svg>
                  </span>
                  <div className="sf-result-info">
                    <div className="sf-result-name">{stop.stopName}</div>
                    {stop.distanceKm != null && (
                      <div className="sf-result-distance">{(stop.distanceKm * 1000).toFixed(0)}m away</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Google Places suggestions */}
              {placeSuggestions.length > 0 && !loadingStops && (
                <>
                  <div className="sf-places-divider">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    Find stops near a place
                  </div>
                  {placeSuggestions.map(place => (
                    <div
                      key={place.place_id}
                      className="sf-result-item sf-place-item"
                      onClick={() => handleSelectPlace(place.place_id, place.structured_formatting?.main_text || place.description)}
                    >
                      <span className="sf-result-icon sf-place-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <div className="sf-result-info">
                        <div className="sf-result-name">{place.structured_formatting?.main_text || place.description}</div>
                        <div className="sf-result-distance">{place.structured_formatting?.secondary_text || ''}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!loadingStops && stops.length === 0 && placeSuggestions.length === 0 && searchQuery.length >= 2 && !error && (
                <div className="sf-empty"><p>No stops or places found</p></div>
              )}

              {!loadingStops && stops.length === 0 && searchQuery.length < 2 && !error && (
                <div className="sf-empty">
                  <p>Type a stop name, place, or landmark</p>
                  <p>or click on the map to find nearby stops</p>
                </div>
              )}
            </div>
          )}

          {/* Departure board */}
          {selectedStop && (
            <div className="sf-departures">
              <div className="sf-dep-header">
                <h4 className="sf-dep-stop-name">{selectedStop.stopName}</h4>
                {selectedStop.stopCode && (
                  <div className="sf-dep-stop-code">Stop code: {selectedStop.stopCode}</div>
                )}

                {/* Feature 1: route badges */}
                {uniqueRoutes.length > 0 && (
                  <div className="sf-route-badges">
                    {uniqueRoutes.map(route => (
                      <button
                        key={route}
                        className="sf-route-badge"
                        onClick={() => handleRouteBadgeClick(route)}
                        title={`View timetable for route ${route}`}
                      >
                        {route}
                      </button>
                    ))}
                  </div>
                )}

                {/* Feature 3 + 4: info row */}
                <div className="sf-info-row">
                  {nearestDepot && (
                    <span className="sf-info-chip" title={`Nearest depot: ${nearestDepot.name}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      {nearestDepot.name} {nearestDepot.distanceKm < 1
                        ? `${(nearestDepot.distanceKm * 1000).toFixed(0)}m`
                        : `${nearestDepot.distanceKm.toFixed(1)}km`}
                    </span>
                  )}
                  {firstLastBus && (
                    <span className="sf-info-chip" title="First and last departures today">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {firstLastBus.first} - {firstLastBus.last}
                    </span>
                  )}
                </div>

                {/* Feature 4 + 6 + 7: action bar */}
                <div className="sf-action-bar">
                  <button
                    className="sf-action-btn"
                    onClick={handleCopyLocation}
                    title="Copy stop name and coordinates"
                  >
                    {copiedTooltip ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copy Location
                      </>
                    )}
                  </button>
                  <button
                    className="sf-action-btn sf-action-btn--report"
                    onClick={handleReportBreakdown}
                    title="Report a breakdown at this stop"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Report Breakdown
                  </button>
                  <button
                    className={`sf-action-btn sf-action-btn--diversion ${showDiversion ? 'active' : ''}`}
                    onClick={() => handleFindDiversions()}
                    title="Find diversion options if this stop is blocked"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    Diversions
                  </button>
                </div>

                {/* View mode toggle */}
                {departures.length > 0 && (
                  <div className="sf-view-toggle">
                    <button
                      className={`sf-view-toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
                      onClick={() => setViewMode('grouped')}
                    >
                      By Route
                    </button>
                    <button
                      className={`sf-view-toggle-btn ${viewMode === 'chronological' ? 'active' : ''}`}
                      onClick={() => setViewMode('chronological')}
                    >
                      By Time
                    </button>
                  </div>
                )}

                <button
                  className="sf-back-btn"
                  onClick={() => { setSelectedStop(null); setDepartures([]); setError(null); setShowDiversion(false); setDiversionData({ sameRoutes: [], otherRoutes: [] }); if (diversionAbortRef.current) diversionAbortRef.current.abort(); }}
                >
                  &larr; Back to results
                </button>
              </div>

              {/* Feature 7: diversion planner panel */}
              {showDiversion && (
                <div className="sf-diversion-panel">
                  <div className="sf-diversion-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                    Diversion Planner
                    <div className="sf-diversion-radius">
                      {[0.3, 0.5, 1].map(r => (
                        <button
                          key={r}
                          className={`sf-radius-btn ${diversionRadius === r ? 'active' : ''}`}
                          onClick={() => { setDiversionRadius(r); handleFindDiversions(r); }}
                        >
                          {r < 1 ? `${r * 1000}m` : `${r}km`}
                        </button>
                      ))}
                    </div>
                    <button className="sf-diversion-close" onClick={() => { setShowDiversion(false); setDiversionData({ sameRoutes: [], otherRoutes: [] }); if (diversionAbortRef.current) diversionAbortRef.current.abort(); }}>
                      Close
                    </button>
                  </div>

                  {loadingDiversion && (
                    <div className="sf-loading" style={{ padding: '16px' }}>
                      <div className="sf-spinner" />
                      Scanning nearby stops for diversions...
                    </div>
                  )}

                  {!loadingDiversion && diversionData.sameRoutes.length === 0 && diversionData.otherRoutes.length === 0 && (
                    <div className="sf-diversion-empty">No diversion options found within {diversionRadius < 1 ? `${diversionRadius * 1000}m` : `${diversionRadius}km`}</div>
                  )}

                  {/* Same routes - direct passenger diversion */}
                  {!loadingDiversion && diversionData.sameRoutes.length > 0 && (
                    <div className="sf-diversion-group">
                      <div className="sf-diversion-group-header sf-diversion-group-header--same">
                        Same Routes Nearby - redirect passengers here
                      </div>
                      {diversionData.sameRoutes.map(stop => (
                        <div key={stop.stopId} className="sf-diversion-item sf-diversion-item--same" onClick={() => handleSelectStop(stop)}>
                          <div className="sf-diversion-item-name">
                            {stop.stopName}
                            <span className="sf-diversion-item-meta">
                              {stop.direction && <span className="sf-diversion-compass">{stop.direction}</span>}
                              {stop.distM != null && <span className="sf-diversion-item-dist">{stop.distM}m</span>}
                              {stop.walkMins != null && <span className="sf-diversion-walk">{stop.walkMins} min walk</span>}
                            </span>
                          </div>
                          <div className="sf-diversion-item-routes">
                            {stop.matchingRoutes.map(r => (
                              <span key={r} className="sf-diversion-route-tag sf-diversion-route-tag--match">{r}</span>
                            ))}
                            {stop.newRoutes.map(r => (
                              <span key={r} className="sf-diversion-route-tag">{r}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Other routes - alternative travel */}
                  {!loadingDiversion && diversionData.otherRoutes.length > 0 && (
                    <div className="sf-diversion-group">
                      <div className="sf-diversion-group-header sf-diversion-group-header--other">
                        Other Routes Nearby - alternative travel
                      </div>
                      {diversionData.otherRoutes.map(stop => (
                        <div key={stop.stopId} className="sf-diversion-item" onClick={() => handleSelectStop(stop)}>
                          <div className="sf-diversion-item-name">
                            {stop.stopName}
                            <span className="sf-diversion-item-meta">
                              {stop.direction && <span className="sf-diversion-compass">{stop.direction}</span>}
                              {stop.distM != null && <span className="sf-diversion-item-dist">{stop.distM}m</span>}
                              {stop.walkMins != null && <span className="sf-diversion-walk">{stop.walkMins} min walk</span>}
                            </span>
                          </div>
                          <div className="sf-diversion-item-routes">
                            {stop.newRoutes.map(r => (
                              <span key={r} className="sf-diversion-route-tag sf-diversion-route-tag--new">{r}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="sf-dep-list">
                {loadingDeps && (
                  <div className="sf-loading">
                    <div className="sf-spinner" />
                    Loading departures...
                  </div>
                )}

                {!loadingDeps && departures.length === 0 && !error && (
                  <div className="sf-empty"><p>No upcoming departures found</p></div>
                )}

                {/* Grouped view */}
                {viewMode === 'grouped' && !loadingDeps && groupedDepartures.map(group => {
                  const isDisrupted = disruptedRoutes.has(group.routeShortName);
                  const lastDep = group.departures[group.departures.length - 1];
                  const nextDep = group.departures[0];
                  return (
                    <div key={group.routeShortName} className="sf-dep-group">
                      <div className="sf-dep-group-header" onClick={() => handleRouteBadgeClick(group.routeShortName)}>
                        <div className={`sf-dep-route-badge ${isDisrupted ? 'sf-route-disrupted' : ''}`}>
                          {group.routeShortName}
                          {isDisrupted && <span className="sf-disruption-dot" title="Active breakdown on this route" />}
                        </div>
                        <div className="sf-dep-group-info">
                          <div className="sf-dep-headsign">{nextDep.headsign}</div>
                          <div className="sf-dep-group-count">{group.departures.length} departure{group.departures.length !== 1 ? 's' : ''}</div>
                        </div>
                        <div className={`sf-dep-mins ${nextDep.minutesUntilDeparture <= 2 ? 'sf-due' : ''}`}>
                          {nextDep.minutesUntilDeparture <= 0 ? 'Due' : `${nextDep.minutesUntilDeparture} min`}
                        </div>
                      </div>
                      <div className="sf-dep-group-times">
                        {group.departures.map((dep, i) => {
                          const isLast = i === group.departures.length - 1;
                          return (
                            <span
                              key={i}
                              className={`sf-dep-group-time ${dep.minutesUntilDeparture <= 2 ? 'sf-due' : ''} ${isLast ? 'sf-last-bus' : ''}`}
                              title={isLast ? 'LAST BUS' : `${dep.minutesUntilDeparture} min`}
                            >
                              {dep.departureTime?.substring(0, 5)}
                              {isLast && <span className="sf-last-bus-badge">LAST</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Chronological view (original) */}
                {viewMode === 'chronological' && !loadingDeps && departures.map((dep, i) => {
                  const isDisrupted = disruptedRoutes.has(dep.routeShortName);
                  return (
                    <div key={i} className="sf-dep-item">
                      <div className={`sf-dep-route-badge ${isDisrupted ? 'sf-route-disrupted' : ''}`}>
                        {dep.routeShortName}
                        {isDisrupted && <span className="sf-disruption-dot" title="Active breakdown on this route" />}
                      </div>
                      <div className="sf-dep-details">
                        <div className="sf-dep-headsign">{dep.headsign}</div>
                        <div className="sf-dep-time">{dep.departureTime?.substring(0, 5)}</div>
                      </div>
                      <div className={`sf-dep-mins ${dep.minutesUntilDeparture <= 2 ? 'sf-due' : ''}`}>
                        {dep.minutesUntilDeparture <= 0 ? 'Due' : `${dep.minutesUntilDeparture} min`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nearby stops within 200m */}
              {nearbyStops.length > 0 && (
                <div className="sf-nearby-panel">
                  <div className="sf-nearby-title">Nearby stops within 200m</div>
                  {nearbyStops.map(stop => (
                    <div
                      key={stop.stopId}
                      className="sf-nearby-item"
                      onClick={() => handleSelectStop(stop)}
                    >
                      <span className="sf-nearby-name">{stop.stopName}</span>
                      {stop.distanceKm != null && (
                        <span className="sf-nearby-dist">{(stop.distanceKm * 1000).toFixed(0)}m</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="sf-refresh-note">Auto-refreshes every 30 seconds</div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StopFinder;
