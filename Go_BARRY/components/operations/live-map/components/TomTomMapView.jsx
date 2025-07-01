/*
 * Go Barry - Enhanced TomTom Map View for Live Map
 * Built on existing TomTomTrafficMap with viewport detection and enhanced controls
 * Phase 1: Core map with traffic flow and alert markers
 */

import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useRef, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { Platform } from 'react-native';
import AlertMarkerLayer from './AlertMarkerLayer';

const TomTomMapView = forwardRef(({
  alerts = [],
  selectedAlert = null,
  onMapLoad = null,
  onMapError = null,
  onViewportChange = null,
  onAlertClick = null,
  onMapClick = null,
  style = {}
}, ref) => {
  // Map state
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Initializing...');
  
  // Refs
  const containerRef = useRef(null);
  const viewportUpdateTimeoutRef = useRef(null);

  // Expose map methods to parent
  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance,
    flyTo: (coordinates, zoom = 14) => {
      if (mapInstance && coordinates) {
        const [lat, lng] = coordinates;
        mapInstance.flyTo({
          center: [lng, lat],
          zoom,
          duration: 1500
        });
      }
    },
    fitBounds: (bounds) => {
      if (mapInstance && bounds) {
        mapInstance.fitBounds(bounds, { padding: 50 });
      }
    },
    getViewport: () => {
      if (!mapInstance) return null;
      const bounds = mapInstance.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
        center: mapInstance.getCenter(),
        zoom: mapInstance.getZoom()
      };
    }
  }), [mapInstance]);

  // Initialize map
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) {
      return;
    }

    const initializeMap = async () => {
      try {
        setDebugInfo('Loading TomTom API...');
        
        // Get API key
        let apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
        if (!apiKey) {
          try {
            const response = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
            if (response.ok) {
              const data = await response.json();
              apiKey = data.apiKey;
            }
          } catch (e) {
            console.warn('Failed to fetch API key from backend');
          }
        }
        
        // Fallback API key
        if (!apiKey) {
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
        }

        setDebugInfo('Loading MapLibre GL...');
        
        // Load MapLibre GL if not already loaded
        if (!window.maplibregl) {
          // Load CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
          document.head.appendChild(cssLink);
          
          // Load JS
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        const maplibregl = window.maplibregl;
        setDebugInfo('Creating map instance...');

        // Create map with enhanced styling
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: [`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`],
                tileSize: 256,
                attribution: '© TomTom'
              },
              'tomtom-traffic': {
                type: 'raster',
                tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${apiKey}`],
                tileSize: 256
              }
            },
            layers: [
              {
                id: 'tomtom-base',
                type: 'raster',
                source: 'tomtom-base'
              },
              {
                id: 'traffic-flow',
                type: 'raster',
                source: 'tomtom-traffic',
                paint: {
                  'raster-opacity': 0.7
                }
              }
            ]
          },
          center: [-1.6178, 54.9783], // Newcastle
          zoom: 10,
          minZoom: 8,
          maxZoom: 18
        });

        // Add navigation controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        
        // Add fullscreen control
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');

        // Map event handlers
        map.on('load', () => {
          console.log('[TomTomMapView] Map loaded');
          setMapLoaded(true);
          setMapError(null);
          setDebugInfo('Map ready');
          setMapInstance(map);
          
          if (onMapLoad) {
            onMapLoad();
          }
        });

        map.on('error', (error) => {
          console.error('[TomTomMapView] Map error:', error);
          const errorMsg = error.error?.message || 'Map initialization failed';
          setMapError(errorMsg);
          setDebugInfo(`Error: ${errorMsg}`);
          
          if (onMapError) {
            onMapError(error);
          }
        });

        // Viewport change tracking with throttling
        const handleViewportChange = () => {
          if (viewportUpdateTimeoutRef.current) {
            clearTimeout(viewportUpdateTimeoutRef.current);
          }
          
          viewportUpdateTimeoutRef.current = setTimeout(() => {
            if (onViewportChange && map) {
              const bounds = map.getBounds();
              const viewport = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
                center: map.getCenter(),
                zoom: map.getZoom()
              };
              onViewportChange(viewport);
            }
          }, 250); // Throttle to max 4 times per second
        };

        map.on('moveend', handleViewportChange);
        map.on('zoomend', handleViewportChange);

        // Map click handler
        map.on('click', (e) => {
          if (onMapClick) {
            onMapClick(e);
          }
        });

        // Cleanup function
        return () => {
          if (viewportUpdateTimeoutRef.current) {
            clearTimeout(viewportUpdateTimeoutRef.current);
          }
          map.remove();
        };

      } catch (error) {
        console.error('[TomTomMapView] Initialization error:', error);
        setMapError(error.message);
        setDebugInfo(`Init error: ${error.message}`);
        
        if (onMapError) {
          onMapError(error);
        }
      }
    };

    const cleanup = initializeMap();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [onMapLoad, onMapError, onViewportChange, onMapClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (viewportUpdateTimeoutRef.current) {
        clearTimeout(viewportUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Web platform only
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      ...style 
    }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a3e'
        }}
      />
      
      {/* Enhanced Alert Markers */}
      {mapInstance && mapLoaded && (
        <AlertMarkerLayer
          map={mapInstance}
          alerts={alerts}
          selectedAlert={selectedAlert}
          onAlertClick={onAlertClick}
          visible={true}
        />
      )}
      
      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 26, 62, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          <div>🗺️ Loading live map...</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>
            {debugInfo}
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(127, 29, 29, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fca5a5',
          fontSize: '14px',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>❌ {mapError}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#f87171' }}>
            {debugInfo}
          </div>
        </div>
      )}
    </div>
  );
});

TomTomMapView.displayName = 'TomTomMapView';

export default TomTomMapView;
