import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Building2, MapPin, Bug, Layers, Flame, Car } from 'lucide-react';
import { DARK_BASE_TILES, DARK_LABEL_TILES } from '../../config/mapTiles';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { isDemoSession, DEMO_DEPOTS } from '../../config/demoDepots';
import './BreakdownMap.css';

// Zoom tracker component to monitor zoom level changes
const ZoomTracker = ({ onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };

    map.on('zoomend', handleZoom);
    // Initial zoom level
    onZoomChange(map.getZoom());

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onZoomChange]);

  return null;
};

// Heatmap layer component
const HeatmapLayer = ({ points, options }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Import leaflet.heat dynamically
    import('leaflet.heat').then(() => {
      // Remove existing heatmap layer if any
      map.eachLayer((layer) => {
        if (layer._heat) {
          map.removeLayer(layer);
        }
      });

      // Create heatmap layer
      const heat = L.heatLayer(
        points.map(p => [p[0], p[1], p[2] || 1]),
        {
          radius: options?.radius || 25,
          blur: options?.blur || 15,
          maxZoom: options?.maxZoom || 17,
          gradient: options?.gradient || {
            0.0: '#22c55e',  // Green
            0.4: '#84cc16',  // Light green
            0.6: '#eab308',  // Yellow
            0.8: '#f97316',  // Orange
            1.0: '#dc2626'   // Red
          }
        }
      );
      heat.addTo(map);
      heat._heat = true; // Mark for removal later
    }).catch(err => {
      console.warn('Failed to load heatmap library:', err);
    });

    return () => {
      // Cleanup on unmount
      map.eachLayer((layer) => {
        if (layer._heat) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, points, options]);

  return null;
};

// Geocoding cache to avoid repeated API calls
const geocodeCache = new Map();

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Marker colours by decision/severity - kept in sync with the triage chip
// colours used in the breakdown row and detail drawer (STOP/AMBER/CONTINUE/PENDING).
const SEVERITY_COLORS = {
  stop: '#dc2626',
  amber: '#f59e0b',
  continue: '#10b981',
  pending: '#3b82f6'
};

const getBreakdownSeverityKey = (breakdown) => {
  const decision = (breakdown.decision || breakdown.wizard_decision || breakdown.severity || '').toUpperCase();
  if (decision === 'STOP') return 'stop';
  if (decision === 'AMBER') return 'amber';
  if (decision === 'CONTINUE') return 'continue';
  return 'pending';
};

const buildBreakdownIcon = (color, highlighted) => {
  if (highlighted) {
    return L.divIcon({
      html: `
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <circle cx="18" cy="18" r="16" fill="${color}" opacity="0.25" class="pulse-ring"/>
          <circle cx="18" cy="18" r="12" fill="${color}" stroke="white" stroke-width="3"/>
          <circle cx="18" cy="18" r="5" fill="white" opacity="0.9"/>
        </svg>
      `,
      className: 'breakdown-marker highlighted',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });
  }
  return L.divIcon({
    html: `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.3"/>
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
      </svg>
    `,
    className: 'breakdown-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Pre-built once per severity/highlight combination (created outside the
// component so re-renders don't recreate Leaflet icon instances).
const BREAKDOWN_ICONS = Object.keys(SEVERITY_COLORS).reduce((acc, key) => {
  acc[key] = {
    normal: buildBreakdownIcon(SEVERITY_COLORS[key], false),
    highlighted: buildBreakdownIcon(SEVERITY_COLORS[key], true)
  };
  return acc;
}, {});

const getMarkerIcon = (breakdown, isHighlighted) => {
  const key = getBreakdownSeverityKey(breakdown);
  const set = BREAKDOWN_ICONS[key] || BREAKDOWN_ICONS.pending;
  return isHighlighted ? set.highlighted : set.normal;
};

// Pans/flies the map to the currently-highlighted (selected) breakdown so
// clicking a row in the centre list brings its marker into view.
const PanToHighlighted = ({ highlightedId, markers }) => {
  const map = useMap();
  const lastPannedRef = useRef(null);
  const isFirstRunRef = useRef(true);

  useEffect(() => {
    // Skip the very first selection (the dashboard auto-selects the most
    // urgent breakdown on load) so the map doesn't immediately jump away
    // from its overview position/zoom before the supervisor has done
    // anything - only pan in response to an explicit row/marker selection.
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      lastPannedRef.current = highlightedId;
      return;
    }

    if (!highlightedId || highlightedId === lastPannedRef.current) return;
    const target = markers.find(m => m.breakdown_id === highlightedId);
    if (!target || !Array.isArray(target.coords)) return;
    const [lat, lng] = target.coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    lastPannedRef.current = highlightedId;
    // Pan only (no forced zoom change) - changing zoom while the marker
    // cluster group is still settling new markers has been observed to
    // drop markers from the cluster group entirely.
    try {
      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    } catch (err) {
      console.warn('PanToHighlighted: panTo failed', err);
    }
  }, [highlightedId, markers, map]);

  return null;
};

// Fit the view to the breakdowns once they first load (the map otherwise
// opens at a fixed city-centre view and outlying breakdowns start off-screen).
// No animation, after a short delay so the cluster layer has settled.
const FitToMarkers = ({ markers }) => {
  const map = useMap();
  const fittedRef = useRef(false);
  const markersRef = useRef(markers);
  markersRef.current = markers;
  useEffect(() => {
    if (fittedRef.current || !markers || markers.length === 0) return;
    fittedRef.current = true;
    // Deliberately not cleared on re-render: markers are recomputed on every
    // live refresh, which would otherwise cancel the pending fit for good.
    setTimeout(() => {
      const pts = (markersRef.current || []).map(m => m.coords)
        .filter(c => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]));
      if (pts.length === 0) return;
      try {
        map.invalidateSize(); // panel layout may have resized the container
        if (pts.length === 1) map.setView(pts[0], 14, { animate: false });
        else map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 14, animate: false });
      } catch (err) { console.warn('FitToMarkers failed', err); }
    }, 300);
  }, [markers, map]);
  return null;
};

const depotIcon = L.divIcon({
  html: `<div style="
    width: 22px; height: 22px;
    background: rgba(15, 23, 42, 0.9);
    border: 1.5px solid rgba(148, 163, 184, 0.7);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  "><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg></div>`,
  className: 'depot-marker-simple',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12]
});

// Depot locations - VERIFIED from OpenStreetMap Nominatim API (December 2025)
// Coordinates point to actual depot buildings, not postcode centroids
const REAL_DEPOT_LOCATIONS = [
  { name: 'Washington', code: 'WAS', coords: [54.9068, -1.5140] },      // Industrial Road, Hertburn
  { name: 'Riverside', code: 'RIV', coords: [54.9586, -1.6579] },       // Handy Drive Bus Depot, Dunston
  { name: 'Consett', code: 'CON', coords: [54.8403, -1.8380] },         // Number One Industrial Estate (near Greencore)
  { name: 'Deptford', code: 'DEP', coords: [54.9142, -1.3976] },        // Deptford Terrace, Sunderland
  { name: 'Percy Main', code: 'PM', coords: [55.0041, -1.4774] },       // Rothbury Terrace, North Shields
  { name: 'Hexham', code: 'HEX', coords: [54.9756, -2.0960] }           // Tyne Green Road, Hexham
];

// Fictional depot markers shown instead in a demo session, using the
// canonical demo depot table (config/demoDepots.js) so codes/names/coords
// stay consistent with the rest of the app.
const DEMO_DEPOT_LOCATIONS = DEMO_DEPOTS.map(d => ({
  name: d.name,
  code: d.code,
  coords: [d.lat, d.lng]
}));

// Evaluated at render time (modules outlive logout/login)
const getDepotLocations = () => (isDemoSession() ? DEMO_DEPOT_LOCATIONS : REAL_DEPOT_LOCATIONS);

// Depot code to coordinates mapping for fallback - VERIFIED from OpenStreetMap (December 2025).
// Includes both real and fictional demo entries (distinct keys, so it's safe to
// keep them in one shared lookup regardless of session).
const DEPOT_COORDINATES = {
  'WAS': [54.9068, -1.5140],
  'Washington': [54.9068, -1.5140],
  'RIV': [54.9586, -1.6579],
  'Riverside': [54.9586, -1.6579],
  'CON': [54.8403, -1.8380],
  'Consett': [54.8403, -1.8380],
  'DEP': [54.9142, -1.3976],
  'Deptford': [54.9142, -1.3976],
  'PM': [55.0041, -1.4774],
  'Percy Main': [55.0041, -1.4774],
  'HEX': [54.9756, -2.0960],
  'Hexham': [54.9756, -2.0960],
  'SDC': [54.9069, -1.3838],  // Sunderland city centre
  'Sunderland': [54.9069, -1.3838],
  // Fictional demo depots (code + name keys)
  ...DEMO_DEPOTS.reduce((acc, d) => {
    acc[d.code] = [d.lat, d.lng];
    acc[d.name] = [d.lat, d.lng];
    return acc;
  }, {})
};

// Geocode a location description using Nominatim (OpenStreetMap)
const geocodeLocation = async (locationDescription) => {
  if (!locationDescription || locationDescription === 'Location TBC') return null;

  // Check cache first
  const cacheKey = locationDescription.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    // Add "North East England, UK" to improve accuracy
    const searchQuery = `${locationDescription}, North East England, UK`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
      {
        headers: {
          'User-Agent': 'GoBarryBreakdownTracker/1.0'
        }
      }
    );

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const coords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
        geocodeCache.set(cacheKey, coords);
        console.log(`🌍 Geocoded "${locationDescription}" → [${coords[0]}, ${coords[1]}]`);
        return coords;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Geocoding failed for "${locationDescription}":`, error.message);
  }

  // Cache null result to avoid repeated failed requests
  geocodeCache.set(cacheKey, null);
  return null;
};

// Known location coordinates - constant data for the operator area
const LOCATION_COORDINATES = {
  // Newcastle
  'Newcastle City Centre': [54.9783, -1.6178],
  'Newcastle': [54.9783, -1.6178],
  'Eldon Square': [54.9766, -1.6147],
  'Central Station': [54.9686, -1.6174],
  'Haymarket': [54.9794, -1.6137],
  'Quayside': [54.9675, -1.6028],
  'Heaton': [54.9947, -1.5810],
  'Byker': [54.9733, -1.5650],
  'Jesmond': [54.9883, -1.5978],
  'Gosforth': [55.0072, -1.6087],
  'Great Park': [55.0367, -1.6462],
  'Kingston Park': [55.0150, -1.6750],
  'Airport': [55.0375, -1.6917],

  // Gateshead
  'Gateshead': [54.9614, -1.6010],
  'Gateshead Interchange': [54.9614, -1.6010],
  'MetroCentre': [54.9588, -1.6658],
  'Team Valley': [54.9225, -1.5745],
  'Low Fell': [54.9375, -1.5867],
  'Felling': [54.9483, -1.5600],

  // Sunderland
  'Sunderland': [54.9069, -1.3838],
  'Park Lane': [54.9042, -1.3872],
  'Pennywell': [54.9217, -1.4300],
  'Washington': [54.9000, -1.5200],

  // Durham
  'Durham': [54.7761, -1.5733],
  'Chester-le-Street': [54.8544, -1.5700],
  'Stanley': [54.8678, -1.6967],
  'Consett': [54.8500, -1.8300],

  // North Tyneside
  'North Shields': [55.0100, -1.4500],
  'Wallsend': [54.9908, -1.5333],
  'Whitley Bay': [55.0461, -1.4442],
  'Tynemouth': [55.0178, -1.4250],

  // South Tyneside
  'South Shields': [54.9983, -1.4317],
  'Jarrow': [54.9833, -1.4833],
  'Hebburn': [54.9717, -1.5133],

  // Other
  'Hexham': [54.9710, -2.1010],
  'Cramlington': [55.0858, -1.5900],
  'Blyth': [55.1250, -1.5083],

  // Fictional demo place names (matches the demo data seed's location text,
  // e.g. "Northgate Interchange, Stand C") so pins land near the right
  // fictional depot instead of falling through to the generic default.
  'Northgate Interchange': [55.0180, -1.6230],
  'Northgate': [55.0180, -1.6230],
  'Market Street, Eastfield': [54.9830, -1.4620],
  'Eastfield': [54.9830, -1.4620],
  'Harbourside Ferry Terminal': [54.9120, -1.3850],
  'Harbourside': [54.9120, -1.3850],
  'Westmoor Retail Park': [54.9560, -1.7420],
  'Westmoor': [54.9560, -1.7420],
  'Southbank Hospital': [54.8620, -1.5760],
  'Southbank': [54.8620, -1.5760],
  'Hillcrest High Street': [54.8720, -1.8350],
  'Hillcrest': [54.8720, -1.8350]
};

const BreakdownMap = ({
  breakdowns = [],
  highlightedId = null,
  onMarkerClick = null,
  // Home command-centre embeds a compact, read-only presentation of this
  // same map: no layer-toggle clutter (cluster/heatmap/traffic/debug), no
  // priority-route overlay circle. Operations behaviour is unaffected when
  // this is left at its default.
  hideToggles = false
}) => {
  // Map configuration
  const center = [54.9783, -1.6178];
  const zoom = 11;

  // State for geocoded coordinates
  const [geocodedCoords, setGeocodedCoords] = useState({});
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Clustering and heatmap state
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  // Traffic layer state
  const [currentZoom, setCurrentZoom] = useState(11);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const TRAFFIC_MIN_ZOOM = 12; // Show traffic when zoom >= 12

  // Refs for map instance
  const mapRef = useRef(null);

  // Memoized coordinate extraction function
  const getCoordinates = useCallback((breakdown) => {
    // Parse wizard_assessment_data if it's a JSON string
    let wizardData = breakdown.wizard_assessment_data;
    if (typeof wizardData === 'string') {
      try {
        wizardData = JSON.parse(wizardData);
      } catch (e) {
        wizardData = null;
      }
    }

    // 1. Top-level fields (location_lat, location_lng)
    if (breakdown.location_lat && breakdown.location_lng) {
      const lat = parseFloat(breakdown.location_lat);
      const lng = parseFloat(breakdown.location_lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }

    // 2. Nested in wizard_assessment_data.location_coords
    if (wizardData?.location_coords?.lat && wizardData?.location_coords?.lng) {
      const lat = parseFloat(wizardData.location_coords.lat);
      const lng = parseFloat(wizardData.location_coords.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        console.log(`📍 Using wizard location_coords for ${breakdown.breakdown_id}`);
        return [lat, lng];
      }
    }

    // 3. Alternate field names (lat/lng)
    if (breakdown.lat && breakdown.lng) {
      const lat = parseFloat(breakdown.lat);
      const lng = parseFloat(breakdown.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }

    // 4. GPS field
    if (breakdown.gps_location?.lat && breakdown.gps_location?.lng) {
      const lat = parseFloat(breakdown.gps_location.lat);
      const lng = parseFloat(breakdown.gps_location.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return [lat, lng];
      }
    }

    // 5. Predefined location lookup
    if (breakdown.location && LOCATION_COORDINATES[breakdown.location]) {
      return LOCATION_COORDINATES[breakdown.location];
    }

    // 6. Location description fuzzy match
    if (breakdown.location_description) {
      for (const [locationName, coords] of Object.entries(LOCATION_COORDINATES)) {
        if (breakdown.location_description.toLowerCase().includes(locationName.toLowerCase())) {
          console.log(`📍 Matched location "${locationName}" for ${breakdown.breakdown_id}`);
          return coords;
        }
      }
    }

    // 7. Depot-based fallback - use depot location if breakdown has depot
    if (breakdown.depot) {
      const depotCoords = DEPOT_COORDINATES[breakdown.depot];
      if (depotCoords) {
        console.log(`🏢 Using depot fallback for ${breakdown.breakdown_id}: ${breakdown.depot}`);
        return depotCoords;
      }
    }

    // 8. Depot from wizard_assessment_data
    if (wizardData?.depot) {
      const depotCoords = DEPOT_COORDINATES[wizardData.depot];
      if (depotCoords) {
        console.log(`🏢 Using wizard depot fallback for ${breakdown.breakdown_id}: ${wizardData.depot}`);
        return depotCoords;
      }
    }

    // 9. Check geocoded results
    if (geocodedCoords[breakdown.breakdown_id]) {
      return geocodedCoords[breakdown.breakdown_id];
    }

    // 10. Final fallback - use SDC/Sunderland as default location
    // This ensures all breakdowns appear on the map
    console.log(`📍 Using SDC default location for ${breakdown.breakdown_id} (no coords found)`);
    return DEPOT_COORDINATES['SDC'];
  }, [geocodedCoords]);

  // Effect to geocode breakdowns without coordinates
  useEffect(() => {
    const geocodeBreakdowns = async () => {
      // Find breakdowns without coordinates that have location descriptions
      const breakdownsToGeocode = breakdowns.filter(b => {
        const coords = getCoordinates(b);
        return !coords && b.location_description && b.location_description !== 'Location TBC';
      });

      if (breakdownsToGeocode.length === 0) return;

      setGeocodingInProgress(true);
      console.log(`🌍 Starting geocoding for ${breakdownsToGeocode.length} breakdowns...`);

      const newCoords = {};

      // Geocode in batches to avoid rate limiting
      for (const breakdown of breakdownsToGeocode) {
        const coords = await geocodeLocation(breakdown.location_description);
        if (coords) {
          newCoords[breakdown.breakdown_id] = coords;
        }
        // Add small delay to avoid rate limiting (Nominatim allows 1 request/second)
        await new Promise(resolve => setTimeout(resolve, 1100));
      }

      if (Object.keys(newCoords).length > 0) {
        setGeocodedCoords(prev => ({ ...prev, ...newCoords }));
        console.log(`✅ Geocoded ${Object.keys(newCoords).length} locations`);
      }

      setGeocodingInProgress(false);
    };

    geocodeBreakdowns();
  }, [breakdowns]); // Note: intentionally not including getCoordinates to avoid infinite loop

  // Memoized breakdown markers with coordinates
  const breakdownMarkers = useMemo(() => {
    console.log('🗺️ Computing breakdown markers for', breakdowns.length, 'breakdowns');

    return breakdowns
      .map(breakdown => {
        const coords = getCoordinates(breakdown);
        if (!coords) {
          console.warn('⚠️ No coords for breakdown:', breakdown.breakdown_id, breakdown.fleet_no);
          return null;
        }

        // Log FULL PRECISION coordinates for debugging
        console.log(`📍 Breakdown ${breakdown.breakdown_id} (Fleet ${breakdown.fleet_no}):`, {
          rawLat: breakdown.location_lat,
          rawLng: breakdown.location_lng,
          extractedCoords: coords,
          precision: {
            lat: typeof breakdown.location_lat === 'number' ? breakdown.location_lat.toString().split('.')[1]?.length : 'N/A',
            lng: typeof breakdown.location_lng === 'number' ? breakdown.location_lng.toString().split('.')[1]?.length : 'N/A'
          }
        });

        return { ...breakdown, coords };
      })
      .filter(Boolean); // Remove nulls
  }, [breakdowns, getCoordinates]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: breakdowns.length,
    withCoords: breakdownMarkers.length,
    depots: getDepotLocations().length
  }), [breakdowns.length, breakdownMarkers.length]);

  // Heatmap points - with intensity based on severity
  const heatmapPoints = useMemo(() => {
    return breakdownMarkers.map(b => {
      const intensity = b.wizard_decision === 'STOP' ? 1.0 :
                       b.wizard_decision === 'AMBER' ? 0.7 :
                       b.severity === 'critical' ? 1.0 :
                       b.severity === 'high' ? 0.8 : 0.5;
      return [b.coords[0], b.coords[1], intensity];
    });
  }, [breakdownMarkers]);

  // Log stats (only when they change)
  console.log('📊 Map Stats:', stats);

  // Find breakdowns without coordinates for debug panel
  const breakdownsWithoutCoords = useMemo(() => {
    return breakdowns.filter(b => !getCoordinates(b));
  }, [breakdowns, getCoordinates]);

  // Plain (non-clustered) markers; the selected one sits on top
  const renderPlainMarkers = (list) => (
    list.map((breakdown) => {
              const isHighlighted = highlightedId === breakdown.breakdown_id;
  
              return (
                <Marker
                  key={breakdown.breakdown_id}
                  position={breakdown.coords}
                  icon={getMarkerIcon(breakdown, isHighlighted)}
                  zIndexOffset={isHighlighted ? 1000 : 0}
                  eventHandlers={{
                    click: () => {
                      if (onMarkerClick) {
                        onMarkerClick(breakdown.breakdown_id);
                      }
                    }
                  }}
                >
                  <Popup className="breakdown-popup">
                    <div style={{ padding: '8px', minWidth: '200px' }}>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#f8fafc',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                        paddingBottom: '4px'
                      }}>
                        Fleet {breakdown.fleet_no}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Route:</strong> <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          marginLeft: '4px'
                        }}>{breakdown.route_id || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Location:</strong> {breakdown.location || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Depot:</strong> {breakdown.depot_display || breakdown.depot || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                        <strong>Duration:</strong> <span style={{ color: '#dc2626', fontWeight: '600' }}>
                          {breakdown.elapsed || 0} mins
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: breakdown.criticality === 'critical' ? 'rgba(239, 68, 68, 0.18)' :
                                   breakdown.criticality === 'warning' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                        color: breakdown.criticality === 'critical' ? '#fca5a5' :
                               breakdown.criticality === 'warning' ? '#fbbf24' : '#93c5fd'
                      }}>
                        {breakdown.currentStage || breakdown.status || 'ACTIVE'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
  );

  return (
    <div className="breakdown-map-container">
      {/* Map layer toggles (Debug only via ?mapdebug) */}
      {!hideToggles && (
      <div className="bm-toggles">
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mapdebug') && (
          <button className={`bm-toggle ${showDebug ? 'on' : ''}`} onClick={() => setShowDebug(!showDebug)} aria-pressed={showDebug}>
            <Bug size={13} aria-hidden="true" /> Debug
          </button>
        )}
        <button className={`bm-toggle ${clusteringEnabled ? 'on' : ''}`} onClick={() => setClusteringEnabled(!clusteringEnabled)} aria-pressed={clusteringEnabled} title="Group nearby breakdowns">
          <Layers size={13} aria-hidden="true" /> Cluster
        </button>
        <button className={`bm-toggle ${heatmapEnabled ? 'on' : ''}`} onClick={() => setHeatmapEnabled(!heatmapEnabled)} aria-pressed={heatmapEnabled} title="Show breakdown density">
          <Flame size={13} aria-hidden="true" /> Heatmap
        </button>
        <button
          className={`bm-toggle ${trafficEnabled ? 'on' : ''}`}
          onClick={() => setTrafficEnabled(!trafficEnabled)}
          aria-pressed={trafficEnabled}
          title={currentZoom < TRAFFIC_MIN_ZOOM ? `Traffic shows from zoom level ${TRAFFIC_MIN_ZOOM}` : 'Toggle live traffic overlay'}
        >
          <Car size={13} aria-hidden="true" /> Traffic{trafficEnabled && currentZoom < TRAFFIC_MIN_ZOOM ? ' (zoom in)' : ''}
        </button>
      </div>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '10px',
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          maxWidth: '280px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '8px', color: '#3b82f6' }}>
            Map Coordinate Debug
          </div>
          <div style={{ marginBottom: '4px' }}>
            📊 Total Breakdowns: <strong>{stats.total}</strong>
          </div>
          <div style={{ marginBottom: '4px', color: '#22c55e' }}>
            ✅ With Coords: <strong>{stats.withCoords}</strong>
          </div>
          <div style={{ marginBottom: '4px', color: stats.total - stats.withCoords > 0 ? '#ef4444' : '#22c55e' }}>
            ❌ Missing Coords: <strong>{stats.total - stats.withCoords}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            🏢 Depots Shown: <strong>{stats.depots}</strong>
          </div>
          {geocodingInProgress && (
            <div style={{ marginBottom: '4px', color: '#f59e0b' }}>
              🌍 Geocoding in progress...
            </div>
          )}
          <div style={{ marginBottom: '4px' }}>
            📍 Geocoded: <strong>{Object.keys(geocodedCoords).length}</strong>
          </div>
          <div style={{ marginBottom: '4px', color: clusteringEnabled ? '#8b5cf6' : '#888' }}>
            🔗 Clustering: <strong>{clusteringEnabled ? 'ON' : 'OFF'}</strong>
          </div>
          <div style={{ marginBottom: '4px', color: heatmapEnabled ? '#f97316' : '#888' }}>
            🔥 Heatmap: <strong>{heatmapEnabled ? 'ON' : 'OFF'}</strong>
          </div>

          {breakdownsWithoutCoords.length > 0 && (
            <>
              <div style={{
                borderTop: '1px solid #444',
                paddingTop: '8px',
                marginTop: '8px',
                fontWeight: '600',
                color: '#ef4444'
              }}>
                Missing Coordinates:
              </div>
              {breakdownsWithoutCoords.slice(0, 5).map(b => (
                <div key={b.breakdown_id} style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  padding: '4px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '4px'
                }}>
                  <div><strong>{b.breakdown_id}</strong></div>
                  <div>Fleet: {b.fleet_no || 'N/A'}</div>
                  <div>Depot: {b.depot || 'N/A'}</div>
                  <div style={{ wordBreak: 'break-word' }}>
                    Loc: {b.location_description?.substring(0, 30) || 'N/A'}...
                  </div>
                </div>
              ))}
              {breakdownsWithoutCoords.length > 5 && (
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                  ...and {breakdownsWithoutCoords.length - 5} more
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* No coordinates message */}
      {stats.total > 0 && stats.withCoords === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📍</div>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            {stats.total} breakdown{stats.total !== 1 ? 's' : ''} found
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            No GPS coordinates available to display on map
          </div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '16px' }}
        className="breakdown-map"
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        boxZoom={true}
        keyboard={true}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark base map to match the UI (Esri — see config/mapTiles.js) */}
        <TileLayer url={DARK_BASE_TILES.url} {...DARK_BASE_TILES.options} />
        <TileLayer url={DARK_LABEL_TILES.url} {...DARK_LABEL_TILES.options} />

        {/* Google Traffic Layer - shows when zoomed in and enabled */}
        {trafficEnabled && currentZoom >= TRAFFIC_MIN_ZOOM && (
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=h,traffic&hl=en&x={x}&y={y}&z={z}"
            maxZoom={20}
            opacity={0.7}
          />
        )}

        {/* Zoom tracker to monitor zoom level */}
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* Fly to the selected/highlighted breakdown's marker */}
        <FitToMarkers markers={breakdownMarkers} />
        <PanToHighlighted highlightedId={highlightedId} markers={breakdownMarkers} />

        {/* Priority routes area circle */}
        <Circle
          center={center}
          radius={5000}
          pathOptions={{
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.2,
            dashArray: '5, 10'
          }}
        />

        {/* Depot markers - 6 the operator depots */}
        {getDepotLocations().map((depot, index) => {
          return (
            <Marker
              key={`depot-${depot.code}`}
              position={depot.coords}
              icon={depotIcon}
              zIndexOffset={-1000}
            >
              <Popup className="depot-popup">
                <div style={{ padding: '8px', minWidth: '150px' }}>
                  <div style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: '#22d3ee',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Building2 size={15} /> {depot.name} Depot
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Code: <strong style={{ color: '#e2e8f0' }}>{depot.code}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} /> {depot.coords[0].toFixed(6)}, {depot.coords[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Heatmap Layer */}
        {heatmapEnabled && heatmapPoints.length > 0 && (
          <HeatmapLayer
            points={heatmapPoints}
            options={{
              radius: 30,
              blur: 20,
              maxZoom: 15
            }}
          />
        )}

        {/* Breakdown markers - with optional clustering */}
        {clusteringEnabled ? (
          <>
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            maxClusterRadius={40}
            iconCreateFunction={(cluster) => {
              const count = cluster.getChildCount();
              const size = count < 5 ? 'small' : count < 10 ? 'medium' : 'large';
              return L.divIcon({
                html: `<div class="cluster-icon cluster-${size}">
                  <span>${count}</span>
                </div>`,
                className: 'breakdown-cluster',
                iconSize: [40, 40]
              });
            }}
          >
            {breakdownMarkers.filter(b => b.breakdown_id !== highlightedId).map((breakdown) => {
              const isHighlighted = false;

              return (
                <Marker
                  key={breakdown.breakdown_id}
                  position={breakdown.coords}
                  icon={getMarkerIcon(breakdown, isHighlighted)}
                  eventHandlers={{
                    click: () => {
                      if (onMarkerClick) {
                        onMarkerClick(breakdown.breakdown_id);
                      }
                    }
                  }}
                >
                  <Popup className="breakdown-popup">
                    <div style={{ padding: '8px', minWidth: '200px' }}>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#f8fafc',
                        marginBottom: '8px',
                        borderBottom: '1px solid rgba(255,255,255,0.12)',
                        paddingBottom: '4px'
                      }}>
                        Fleet {breakdown.fleet_no}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Route:</strong> <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          marginLeft: '4px'
                        }}>{breakdown.route_id || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Location:</strong> {breakdown.location || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                        <strong>Depot:</strong> {breakdown.depot_display || breakdown.depot || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                        <strong>Duration:</strong> <span style={{ color: '#dc2626', fontWeight: '600' }}>
                          {breakdown.elapsed || 0} mins
                        </span>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: breakdown.criticality === 'critical' ? 'rgba(239, 68, 68, 0.18)' :
                                   breakdown.criticality === 'warning' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                        color: breakdown.criticality === 'critical' ? '#fca5a5' :
                               breakdown.criticality === 'warning' ? '#fbbf24' : '#93c5fd'
                      }}>
                        {breakdown.currentStage || breakdown.status || 'ACTIVE'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
          {/* The selected breakdown is never hidden inside a cluster */}
          {renderPlainMarkers(breakdownMarkers.filter(b => b.breakdown_id === highlightedId))}
          </>
        ) : (
          renderPlainMarkers(breakdownMarkers)
        )}
      </MapContainer>
    </div>
  );
};

export default BreakdownMap;
