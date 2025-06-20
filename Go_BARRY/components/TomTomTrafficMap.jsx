// Go_BARRY/components/TomTomTrafficMap.jsx
// Working TomTom Traffic Map - Fixed container ref issue

import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';

const TomTomTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  // Use callback ref to ensure we get the container element
  const [containerElement, setContainerElement] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting initialization...');

  const mapContainerCallback = (element) => {
    console.log('🔗 Callback ref called with element:', element);
    if (element) {
      setContainerElement(element);
      setDebugInfo('Container element captured!');
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      platformOS: Platform.OS,
      isWeb: Platform.OS === 'web',
      hasContainer: !!containerElement,
      containerElement: containerElement
    });
    
    setDebugInfo(`Platform: ${Platform.OS}, Container: ${!!containerElement}`);
    
    if (Platform.OS !== 'web') {
      console.log('❌ Not web platform, exiting');
      setDebugInfo('Not web platform');
      return;
    }
    
    if (!containerElement) {
      console.log('❌ No container element, exiting');
      setDebugInfo('No container element - waiting...');
      return;
    }

    // Initialize map when container becomes available
    const initializeMap = async () => {
      try {
        console.log('🗺️ Initializing TomTom map...');
        setDebugInfo('Getting TomTom API key...');
        
        // Get TomTom API key from backend
        let apiKey;
        try {
          const keyResponse = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            apiKey = keyData.apiKey;
            console.log('✅ Got TomTom API key:', apiKey ? 'Present' : 'Missing');
          } else {
            throw new Error('API key fetch failed');
          }
        } catch (keyError) {
          console.warn('⚠️ API key fetch failed, using fallback');
          // Use hardcoded fallback
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
        }
        
        if (!apiKey) {
          throw new Error('No TomTom API key available');
        }
        
        console.log('✅ Using API key:', apiKey.substring(0, 8) + '...');
        setDebugInfo('Loading MapLibre GL JS...');
        
        // Use MapLibre GL JS which we already have installed
        const maplibregl = await import('maplibre-gl');
        console.log('✅ MapLibre GL JS loaded successfully');
        setDebugInfo('Creating TomTom map instance...');
        
        // Build tile URLs with API key
        const baseTileUrl = `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`;
        const trafficTileUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${apiKey}`;
        
        console.log('🔗 Base tile URL template:', baseTileUrl.replace(apiKey, 'API_KEY'));
        
        // Create map with TomTom tiles directly (no backend proxy)
        const map = new maplibregl.Map({
          container: containerElement,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: [baseTileUrl],
                tileSize: 256,
                attribution: '© TomTom'
              }
            },
            layers: [{
              id: 'tomtom-base',
              type: 'raster',
              source: 'tomtom-base'
            }]
          },
          center: [-1.6178, 54.9783], // Newcastle upon Tyne
          zoom: 10
        });

        console.log('✅ Map instance created');
        setDebugInfo('Waiting for map to load...');

        map.on('load', () => {
          console.log('✅ TomTom map loaded successfully');
          setMapLoaded(true);
          setDebugInfo('Adding TomTom traffic layer...');
          
          // Add TomTom traffic layer directly
          try {
            map.addSource('tomtom-traffic', {
              type: 'raster',
              tiles: [trafficTileUrl],
              tileSize: 256
            });
            
            map.addLayer({
              id: 'traffic-flow',
              type: 'raster',
              source: 'tomtom-traffic',
              paint: {
                'raster-opacity': 0.6
              }
            });
            
            console.log('✅ TomTom traffic layer added');
            setDebugInfo('TomTom map with live traffic loaded!');
          } catch (trafficError) {
            console.warn('⚠️ Traffic layer failed:', trafficError);
            setDebugInfo('TomTom map loaded (base tiles only)');
          }
          
          // Add alerts as markers
          addAlerts(map, maplibregl);
        });

        map.on('error', (error) => {
          console.error('❌ Map error:', error);
          setMapError(error.message);
          setDebugInfo(`Map error: ${error.message}`);
        });

        // Store map reference for cleanup
        containerElement.mapInstance = map;

      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
        setMapError(error.message);
        setDebugInfo(`Init error: ${error.message}`);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (containerElement?.mapInstance) {
        containerElement.mapInstance.remove();
      }
    };
  }, [containerElement]);

  const addAlerts = (map, maplibregl) => {
    if (!alerts || alerts.length === 0) return;

    console.log(`📍 Adding ${alerts.length} alerts to map`);
    
    alerts.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      const isCurrentAlert = index === alertIndex;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: ${isCurrentAlert ? 16 : 12}px;
        height: ${isCurrentAlert ? 16 : 12}px;
        background-color: ${getSeverityColor(alert.severity)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isCurrentAlert ? 'animation: pulse 2s infinite;' : ''}
      `;

      // Add CSS animation for current alert
      if (isCurrentAlert && !document.getElementById('marker-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'marker-pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      // Create marker
      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${alert.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${alert.location || 'Location not specified'}</p>
            <span style="
              background-color: ${getSeverityColor(alert.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${alert.severity || 'UNKNOWN'}</span>
          </div>
        `);

      marker.setPopup(popup);

      // Auto-focus on current alert
      if (isCurrentAlert) {
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1500
        });
        
        // Auto-open popup after fly animation
        setTimeout(() => {
          popup.addTo(map);
        }, 1600);
      }
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#06b6d4';
      default:
        return '#64748b';
    }
  };

  // Mobile fallback
  if (Platform.OS !== 'web') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a3e',
        minHeight: 400
      }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          🗺️ Map view available on web only
        </Text>
      </View>
    );
  }

  // Web platform - always render container, show overlays as needed
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      {/* Map container - always rendered */}
      <div
        ref={mapContainerCallback}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px',
          position: 'relative',
          backgroundColor: '#1a1a3e'
        }}
      />
      
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
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '8px' }}>
            🗺️ Loading map...
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>
            Newcastle Traffic Intelligence
          </div>
          <div style={{ color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
            Debug: {debugInfo}
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
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#fca5a5', fontSize: '16px', marginBottom: '8px' }}>
            ❌ Map error: {mapError}
          </div>
          <div style={{ color: '#f87171', fontSize: '12px' }}>
            Falling back to alert list view
          </div>
        </div>
      )}
    </div>
  );
};

export default TomTomTrafficMap;
