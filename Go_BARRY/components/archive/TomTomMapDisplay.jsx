// Go_BARRY/components/TomTomMapDisplay.jsx
// TomTom Map Display API for React Native Web - Official SDK

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';

const TomTomMapDisplay = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  // Load TomTom SDK and initialize map
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    const initializeTomTomMap = async () => {
      try {
        // Get API key from backend
        console.log('🔑 Fetching TomTom API key...');
        const response = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
        if (!response.ok) {
          throw new Error('Failed to get TomTom API key');
        }
        
        const { apiKey: key } = await response.json();
        setApiKey(key);
        console.log('✅ Got TomTom API key');

        // Load TomTom SDK dynamically
        await loadTomTomSDK();
        
        // Initialize map with proper TomTom SDK
        map.current = tt.map({
          key: key,
          container: mapContainer.current,
          center: [-1.6178, 54.9783], // Newcastle upon Tyne
          zoom: 10,
          language: 'en-GB'
        });

        map.current.on('load', () => {
          console.log('🗺️ TomTom map loaded');
          setMapLoaded(true);
          
          // Add traffic layer using TomTom's built-in method
          addTrafficLayer();
          
          // Add alerts if available
          if (alerts.length > 0) {
            addAlertsToMap();
          }
        });

        map.current.on('error', (error) => {
          console.error('❌ TomTom map error:', error);
        });

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
        // Fallback to OpenStreetMap if TomTom fails
        await initializeFallbackMap();
      }
    };

    initializeTomTomMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Load TomTom SDK dynamically
  const loadTomTomSDK = () => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.tt) {
        resolve();
        return;
      }

      // Load CSS
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://api.tomtom.com/maps-sdk-for-web/6/6.25.0/maps/maps.css';
      document.head.appendChild(css);

      // Load JavaScript
      const script = document.createElement('script');
      script.src = 'https://api.tomtom.com/maps-sdk-for-web/6/6.25.0/maps/maps-web.min.js';
      script.onload = () => {
        console.log('✅ TomTom SDK loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load TomTom SDK');
        reject(new Error('Failed to load TomTom SDK'));
      };
      document.head.appendChild(script);
    });
  };

  // Add TomTom's built-in traffic layer
  const addTrafficLayer = () => {
    if (!map.current || !window.tt) return;

    try {
      // TomTom has built-in traffic methods - much simpler!
      map.current.addControl(new tt.TrafficIncidentsControl());
      map.current.addControl(new tt.TrafficFlowControl());
      
      console.log('✅ TomTom traffic controls added');
    } catch (error) {
      console.warn('⚠️ Failed to add traffic controls:', error);
    }
  };

  // Add alerts as markers using TomTom's marker system
  const addAlertsToMap = () => {
    if (!map.current || !mapLoaded || !window.tt) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.tomtom-alert-marker');
    existingMarkers.forEach(marker => marker.remove());

    alerts.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      
      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'tomtom-alert-marker';
      markerElement.style.cssText = `
        width: ${index === alertIndex ? 16 : 12}px;
        height: ${index === alertIndex ? 16 : 12}px;
        background-color: ${getSeverityColor(alert.severity)};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${index === alertIndex ? 'transform: scale(1.2);' : ''}
      `;

      // Create TomTom marker
      const marker = new tt.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Create popup
      const popup = new tt.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${alert.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${alert.location}</p>
            <span style="
              background-color: ${getSeverityColor(alert.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${alert.severity}</span>
          </div>
        `);

      marker.setPopup(popup);

      // Auto-open popup for current alert
      if (index === alertIndex) {
        popup.addTo(map.current);
      }
    });
  };

  // Fallback to MapLibre if TomTom fails
  const initializeFallbackMap = async () => {
    try {
      console.log('🔄 Initializing fallback map...');
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
        if (alerts.length > 0) {
          addFallbackAlerts();
        }
      });

      console.log('✅ Fallback map initialized');
    } catch (error) {
      console.error('❌ Even fallback map failed:', error);
    }
  };

  // Add alerts for fallback map
  const addFallbackAlerts = async () => {
    if (!map.current) return;

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
      `;

      new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map.current);
    });
  };

  // Update alerts when they change
  useEffect(() => {
    if (mapLoaded && alerts.length > 0) {
      addAlertsToMap();
    }
  }, [alerts, alertIndex, mapLoaded]);

  // Focus on current alert
  useEffect(() => {
    if (currentAlert && currentAlert.coordinates && mapLoaded && map.current) {
      const [lat, lng] = currentAlert.coordinates;
      
      if (window.tt && map.current.flyTo) {
        // TomTom method
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          speed: 1.2
        });
      } else if (map.current.flyTo) {
        // MapLibre method
        map.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1500
        });
      }
    }
  }, [currentAlert, mapLoaded]);

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
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px'
      }}
    />
  );
};

export default TomTomMapDisplay;
