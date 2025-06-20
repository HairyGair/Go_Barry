// Go_BARRY/components/TomTomMapSimple.jsx
// Simplified TomTom Map Display API integration

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';

const TomTomMapSimple = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    const initializeMap = async () => {
      try {
        setDebugInfo('Fetching API key...');
        
        // Get API key
        const response = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
        if (!response.ok) {
          throw new Error(`API key fetch failed: ${response.status}`);
        }
        
        const { apiKey } = await response.json();
        setDebugInfo('Loading TomTom SDK...');
        
        // Load TomTom SDK
        await loadTomTomSDK();
        
        setDebugInfo('Initializing TomTom map...');
        
        // Initialize TomTom map
        if (!window.tt) {
          throw new Error('TomTom SDK not available');
        }
        
        map.current = tt.map({
          key: apiKey,
          container: mapContainer.current,
          center: [-1.6178, 54.9783], // Newcastle
          zoom: 10
        });

        map.current.on('load', () => {
          console.log('✅ TomTom map loaded successfully');
          setMapLoaded(true);
          setDebugInfo('TomTom map loaded');
          
          // Add traffic flow
          try {
            const trafficFlowLayer = new tt.TrafficFlowLayer();
            map.current.addLayer(trafficFlowLayer);
            console.log('✅ Traffic flow layer added');
          } catch (trafficError) {
            console.warn('⚠️ Traffic layer failed:', trafficError);
          }
        });

        map.current.on('error', (error) => {
          console.error('❌ TomTom map error:', error);
          setDebugInfo(`Map error: ${error.message}`);
        });

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
        setDebugInfo(`Failed: ${error.message}`);
        
        // Use simple fallback
        initializeFallback();
      }
    };

    initializeMap();

    return () => {
      if (map.current && map.current.remove) {
        map.current.remove();
      }
    };
  }, []);

  const loadTomTomSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.tt) {
        resolve();
        return;
      }

      // Create CSS link
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://api.tomtom.com/maps-sdk-for-web/6/6.25.0/maps/maps.css';
      document.head.appendChild(css);

      // Create script
      const script = document.createElement('script');
      script.src = 'https://api.tomtom.com/maps-sdk-for-web/6/6.25.0/maps/maps-web.min.js';
      script.onload = () => {
        console.log('✅ TomTom SDK loaded');
        setTimeout(resolve, 100); // Small delay to ensure SDK is ready
      };
      script.onerror = () => {
        console.error('❌ Failed to load TomTom SDK');
        reject(new Error('TomTom SDK failed to load'));
      };
      document.head.appendChild(script);
    });
  };

  const initializeFallback = async () => {
    try {
      setDebugInfo('Loading fallback map...');
      const maplibregl = await import('maplibre-gl');
      
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [{
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }]
        },
        center: [-1.6178, 54.9783],
        zoom: 10
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setDebugInfo('Fallback map loaded (OpenStreetMap)');
        addFallbackAlerts();
      });

    } catch (error) {
      console.error('❌ Even fallback failed:', error);
      setDebugInfo(`Fallback failed: ${error.message}`);
    }
  };

  const addFallbackAlerts = async () => {
    if (!map.current || alerts.length === 0) return;

    const maplibregl = await import('maplibre-gl');
    
    alerts.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      
      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: ${getSeverityColor(alert.severity)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
      `;

      new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map.current);
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

  if (Platform.OS !== 'web') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a3e'
      }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          Map view available on web only
        </Text>
      </View>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '8px'
        }}
      />
      {/* Debug info overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        maxWidth: '200px',
        zIndex: 1000
      }}>
        🗺️ {debugInfo}
      </div>
    </div>
  );
};

export default TomTomMapSimple;
