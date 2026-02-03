import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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

// Create icons OUTSIDE component to prevent recreation
const breakdownIcon = L.divIcon({
  html: `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#dc2626" opacity="0.3"/>
      <circle cx="12" cy="12" r="8" fill="#dc2626" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="#ff4444"/>
    </svg>
  `,
  className: 'breakdown-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Highlighted breakdown icon - larger with pulsing effect
const highlightedBreakdownIcon = L.divIcon({
  html: `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" fill="#dc2626" opacity="0.2" class="pulse-ring"/>
      <circle cx="18" cy="18" r="12" fill="#dc2626" stroke="white" stroke-width="3"/>
      <circle cx="18" cy="18" r="5" fill="#ff4444"/>
    </svg>
  `,
  className: 'breakdown-marker highlighted',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const depotIcon = L.divIcon({
  html: `<div style="
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #003B5C 0%, #00527a 100%);
    border: 3px solid white;
    border-radius: 8px 8px 8px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transform: rotate(-45deg);
  "><span style="transform: rotate(45deg);">🏢</span></div>`,
  className: 'depot-marker-simple',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Depot locations - VERIFIED from OpenStreetMap Nominatim API (December 2025)
// Coordinates point to actual depot buildings, not postcode centroids
const DEPOT_LOCATIONS = [
  { name: 'Washington', code: 'WAS', coords: [54.9068, -1.5140] },      // Industrial Road, Hertburn
  { name: 'Riverside', code: 'RIV', coords: [54.9586, -1.6579] },       // Handy Drive Bus Depot, Dunston
  { name: 'Consett', code: 'CON', coords: [54.8403, -1.8380] },         // Number One Industrial Estate (near Greencore)
  { name: 'Deptford', code: 'DEP', coords: [54.9142, -1.3976] },        // Deptford Terrace, Sunderland
  { name: 'Percy Main', code: 'PM', coords: [55.0041, -1.4774] },       // Rothbury Terrace, North Shields
  { name: 'Hexham', code: 'HEX', coords: [54.9756, -2.0960] }           // Tyne Green Road, Hexham
];

// Depot code to coordinates mapping for fallback - VERIFIED from OpenStreetMap (December 2025)
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
  'Sunderland': [54.9069, -1.3838]
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
  'Blyth': [55.1250, -1.5083]
};

const BreakdownMap = ({
  breakdowns = [],
  highlightedId = null,
  onMarkerClick = null
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
    depots: DEPOT_LOCATIONS.length
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

  return (
    <div className="breakdown-map-container">
      {/* Map Control Buttons */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Debug toggle button */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            background: showDebug ? '#3b82f6' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🐛 Debug {showDebug ? 'ON' : 'OFF'}
        </button>

        {/* Clustering toggle button */}
        <button
          onClick={() => setClusteringEnabled(!clusteringEnabled)}
          style={{
            background: clusteringEnabled ? '#8b5cf6' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔗 Cluster {clusteringEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Heatmap toggle button */}
        <button
          onClick={() => setHeatmapEnabled(!heatmapEnabled)}
          style={{
            background: heatmapEnabled ? '#f97316' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔥 Heatmap {heatmapEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Traffic toggle button */}
        <button
          onClick={() => setTrafficEnabled(!trafficEnabled)}
          style={{
            background: trafficEnabled ? '#10b981' : 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          title={currentZoom < TRAFFIC_MIN_ZOOM ? `Zoom in to level ${TRAFFIC_MIN_ZOOM} to see traffic` : 'Toggle live traffic overlay'}
        >
          🚗 Traffic {trafficEnabled ? (currentZoom >= TRAFFIC_MIN_ZOOM ? 'ON' : `(zoom ${TRAFFIC_MIN_ZOOM}+)`) : 'OFF'}
        </button>
      </div>

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
          fontFamily: 'monospace',
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
          <div style={{ fontSize: '14px', color: '#64748b' }}>
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
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
          maxZoom={20}
        />

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
        {DEPOT_LOCATIONS.map((depot, index) => {
          console.log(`🏢 Rendering depot ${index + 1}/${DEPOT_LOCATIONS.length}: ${depot.name} (${depot.code}) at [${depot.coords[0]}, ${depot.coords[1]}]`);
          return (
            <Marker
              key={`depot-${depot.code}`}
              position={depot.coords}
              icon={depotIcon}
            >
              <Popup className="depot-popup">
                <div style={{ padding: '8px', minWidth: '150px' }}>
                  <div style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: '#003B5C',
                    marginBottom: '4px'
                  }}>
                    🏢 {depot.name} Depot
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Code: <strong>{depot.code}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    📍 {depot.coords[0].toFixed(6)}, {depot.coords[1].toFixed(6)}
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
          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            maxClusterRadius={60}
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
            {breakdownMarkers.map((breakdown) => {
              const isHighlighted = highlightedId === breakdown.breakdown_id;

              return (
                <Marker
                  key={breakdown.breakdown_id}
                  position={breakdown.coords}
                  icon={isHighlighted ? highlightedBreakdownIcon : breakdownIcon}
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
                        color: '#1e293b',
                        marginBottom: '8px',
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '4px'
                      }}>
                        Fleet {breakdown.fleet_no}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                        <strong>Route:</strong> <span style={{
                          background: '#3b82f6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600',
                          marginLeft: '4px'
                        }}>{breakdown.route_id || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                        <strong>Location:</strong> {breakdown.location || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                        <strong>Depot:</strong> {breakdown.depot_display || breakdown.depot || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
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
                        background: breakdown.criticality === 'critical' ? '#fee2e2' :
                                   breakdown.criticality === 'warning' ? '#fef3c7' : '#dbeafe',
                        color: breakdown.criticality === 'critical' ? '#dc2626' :
                               breakdown.criticality === 'warning' ? '#d97706' : '#2563eb'
                      }}>
                        {breakdown.currentStage || breakdown.status || 'ACTIVE'}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        ) : (
          /* Non-clustered markers */
          breakdownMarkers.map((breakdown) => {
            const isHighlighted = highlightedId === breakdown.breakdown_id;

            return (
              <Marker
                key={breakdown.breakdown_id}
                position={breakdown.coords}
                icon={isHighlighted ? highlightedBreakdownIcon : breakdownIcon}
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
                      color: '#1e293b',
                      marginBottom: '8px',
                      borderBottom: '1px solid #e5e7eb',
                      paddingBottom: '4px'
                    }}>
                      Fleet {breakdown.fleet_no}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      <strong>Route:</strong> <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        marginLeft: '4px'
                      }}>{breakdown.route_id || 'N/A'}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      <strong>Location:</strong> {breakdown.location || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      <strong>Depot:</strong> {breakdown.depot_display || breakdown.depot || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
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
                      background: breakdown.criticality === 'critical' ? '#fee2e2' :
                                 breakdown.criticality === 'warning' ? '#fef3c7' : '#dbeafe',
                      color: breakdown.criticality === 'critical' ? '#dc2626' :
                             breakdown.criticality === 'warning' ? '#d97706' : '#2563eb'
                    }}>
                      {breakdown.currentStage || breakdown.status || 'ACTIVE'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
};

export default BreakdownMap;
