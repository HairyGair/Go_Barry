// Go_BARRY/components/TomTomTrafficMapEnhanced.jsx
// Enhanced TomTom Traffic Map with Auto-Zoom for Display Screen
// Optimized for 55" display with smooth animations

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';

const MAP_ZOOM_LEVELS = {
  OVERVIEW: 10,      // Shows entire region
  CITY: 12,          // City-level view
  INCIDENT: 15,      // Street-level for incidents
  DETAILED: 17       // Maximum zoom for critical events
};

const ZOOM_DURATION = 2000; // 2 seconds for smooth transition
const HOLD_DURATION = 18000; // 18 seconds (alert time minus transition)

const TomTomTrafficMapEnhanced = ({ 
  alerts = [], 
  currentAlertIndex = 0,
  mapId = 'display-map',
  theme = 'dark',
  showPreviousAlerts = true,
  maxPreviousAlerts = 5,
  onMapReady = null,
  style = {}
}) => {
  const [containerElement, setContainerElement] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const previousAlertsRef = useRef([]);
  const currentMarkerRef = useRef(null);
  const zoomTimeoutRef = useRef(null);

  // Get current alert
  const currentAlert = alerts[currentAlertIndex] || null;

  // Map container callback
  const mapContainerCallback = useCallback((element) => {
    if (element && !containerElement) {
      setContainerElement(element);
    }
  }, [containerElement]);

  // Initialize map
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerElement) return;

    const initializeMap = async () => {
      try {
        // Get TomTom API key
        let apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
        
        if (!apiKey) {
          try {
            const keyResponse = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              apiKey = keyData.apiKey;
            }
          } catch (keyError) {
            console.warn('⚠️ Backend API key fetch failed');
          }
        }
        
        if (!apiKey) {
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp'; // Fallback
        }

        // Load MapLibre GL JS
        if (!window.maplibregl) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
          document.head.appendChild(cssLink);
          
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        const maplibregl = window.maplibregl;
        
        // Create map with dark theme for display screen
        const map = new maplibregl.Map({
          container: containerElement,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: [`https://api.tomtom.com/map/1/tile/basic/${theme === 'dark' ? 'night' : 'main'}/{z}/{x}/{y}.png?key=${apiKey}`],
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
          center: [-1.6178, 54.9783], // Newcastle
          zoom: MAP_ZOOM_LEVELS.OVERVIEW,
          pitch: 0,
          bearing: 0
        });

        mapInstanceRef.current = map;

        map.on('load', () => {
          setMapLoaded(true);
          
          // Add traffic layer
          map.addSource('tomtom-traffic', {
            type: 'raster',
            tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${apiKey}`],
            tileSize: 256
          });
          
          map.addLayer({
            id: 'traffic-flow',
            type: 'raster',
            source: 'tomtom-traffic',
            paint: {
              'raster-opacity': 0.7
            }
          });

          // Notify parent component
          if (onMapReady) {
            onMapReady(map);
          }
        });

        map.on('error', (error) => {
          console.error('❌ Map error:', error);
          setMapError(error.message);
        });

      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
        setMapError(error.message);
      }
    };

    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (cleanupError) {
          console.warn('Map cleanup error:', cleanupError);
        }
      }
    };
  }, [containerElement, theme, onMapReady]);

  // Handle alert changes and auto-zoom
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !currentAlert) return;

    const map = mapInstanceRef.current;
    const maplibregl = window.maplibregl;

    // Clear previous zoom timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }

    // Clear all existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.warn('Error removing marker:', e);
      }
    });
    markersRef.current = [];

    // Add previous alert markers (faded)
    if (showPreviousAlerts) {
      const previousAlerts = previousAlertsRef.current.slice(-maxPreviousAlerts);
      
      previousAlerts.forEach((alert, index) => {
        if (!alert.coordinates) return;
        
        const opacity = 0.3 + (index / previousAlerts.length) * 0.3; // Fade older alerts
        const [lat, lng] = alert.coordinates;
        
        const markerElement = document.createElement('div');
        markerElement.style.cssText = `
          width: 12px;
          height: 12px;
          background-color: ${getSeverityColor(alert.severity)};
          border: 2px solid rgba(255, 255, 255, ${opacity});
          border-radius: 50%;
          opacity: ${opacity};
          transition: all 0.3s ease;
        `;
        
        const marker = new maplibregl.Marker({ element: markerElement })
          .setLngLat([lng, lat])
          .addTo(map);
          
        markersRef.current.push(marker);
      });
    }

    // Add current alert marker (if it has coordinates)
    if (currentAlert.coordinates) {
      const [lat, lng] = currentAlert.coordinates;
      
      // Create animated marker for current alert
      const markerElement = document.createElement('div');
      const severityColor = getSeverityColor(currentAlert.severity);
      
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: ${severityColor};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 20px ${severityColor};
        animation: pulse 2s infinite;
        z-index: 1000;
      `;
      
      // Add pulse animation CSS if not already added
      if (!document.getElementById('map-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'map-pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% { 
              transform: scale(1); 
              box-shadow: 0 0 20px ${severityColor};
            }
            50% { 
              transform: scale(1.2); 
              box-shadow: 0 0 40px ${severityColor};
            }
            100% { 
              transform: scale(1); 
              box-shadow: 0 0 20px ${severityColor};
            }
          }
        `;
        document.head.appendChild(style);
      }

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map);
      
      currentMarkerRef.current = marker;
      markersRef.current.push(marker);

      // Create popup for current alert
      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'alert-popup'
      })
        .setHTML(`
          <div style="
            padding: 12px; 
            font-family: system-ui; 
            max-width: 300px;
            background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
            color: ${theme === 'dark' ? '#f5f5f5' : '#1a1a1a'};
            border-radius: 8px;
          ">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
              ${currentAlert.title}
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.8;">
              📍 ${currentAlert.location || 'Location not specified'}
            </p>
            ${currentAlert.affectedRoutes && currentAlert.affectedRoutes.length > 0 ? `
              <div style="margin: 8px 0;">
                <span style="font-size: 12px; opacity: 0.7;">Affected Routes:</span>
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                  ${currentAlert.affectedRoutes.map(route => `
                    <span style="
                      background-color: ${severityColor};
                      color: white;
                      padding: 2px 8px;
                      border-radius: 12px;
                      font-size: 12px;
                      font-weight: bold;
                    ">${route}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div style="
              display: inline-block;
              background-color: ${severityColor};
              color: white;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              margin-top: 8px;
            ">${currentAlert.severity?.toUpperCase() || 'ALERT'}</div>
          </div>
        `);
      
      marker.setPopup(popup);

      // Determine zoom level based on severity and type
      const zoomLevel = getZoomLevel(currentAlert);
      
      // Smooth fly to location
      map.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        duration: ZOOM_DURATION,
        pitch: currentAlert.severity === 'CRITICAL' ? 30 : 0, // Tilt for critical alerts
        bearing: 0,
        essential: true
      });

      // Open popup after animation
      setTimeout(() => {
        if (currentMarkerRef.current && currentMarkerRef.current.getPopup()) {
          currentMarkerRef.current.getPopup().addTo(map);
        }
      }, ZOOM_DURATION + 500);

      // Auto-close popup before next transition
      zoomTimeoutRef.current = setTimeout(() => {
        if (currentMarkerRef.current && currentMarkerRef.current.getPopup()) {
          currentMarkerRef.current.getPopup().remove();
        }
      }, HOLD_DURATION - 1000);

    } else {
      // No coordinates - return to overview
      map.flyTo({
        center: [-1.6178, 54.9783], // Newcastle
        zoom: MAP_ZOOM_LEVELS.OVERVIEW,
        duration: ZOOM_DURATION,
        pitch: 0,
        bearing: 0
      });
    }

    // Add current alert to previous alerts (if it has coordinates)
    if (currentAlert.coordinates && !previousAlertsRef.current.find(a => a.id === currentAlert.id)) {
      previousAlertsRef.current.push(currentAlert);
    }

    // Cleanup function
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, [currentAlert, mapLoaded, showPreviousAlerts, maxPreviousAlerts, theme]);

  // Helper function to determine zoom level
  const getZoomLevel = (alert) => {
    if (!alert) return MAP_ZOOM_LEVELS.OVERVIEW;
    
    // Critical alerts get maximum zoom
    if (alert.severity === 'CRITICAL' || alert.severity === 'EMERGENCY') {
      return MAP_ZOOM_LEVELS.DETAILED;
    }
    
    // Major incidents get incident-level zoom
    if (alert.severity === 'MAJOR' || alert.type === 'INCIDENT') {
      return MAP_ZOOM_LEVELS.INCIDENT;
    }
    
    // Roadworks get city-level view
    if (alert.type === 'ROADWORK') {
      return MAP_ZOOM_LEVELS.CITY;
    }
    
    // Default to city view
    return MAP_ZOOM_LEVELS.CITY;
  };

  // Helper function to get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      'EMERGENCY': '#dc2626',
      'CRITICAL': '#dc2626',
      'MAJOR': '#f59e0b',
      'MINOR': '#eab308',
      'INFO': '#3b82f6'
    };
    return colors[severity] || '#6b7280';
  };

  // Mobile fallback
  if (Platform.OS !== 'web') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
        minHeight: 400
      }}>
        <Text style={{ 
          color: theme === 'dark' ? '#a0a0a0' : '#666666', 
          fontSize: 18 
        }}>
          🗺️ Map view available on web only
        </Text>
      </View>
    );
  }

  // Web platform render
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      minHeight: '400px',
      borderRadius: '12px',
      overflow: 'hidden',
      ...style 
    }}>
      {/* Map container */}
      <div
        ref={mapContainerCallback}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          position: 'relative',
          backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5'
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
          backgroundColor: theme === 'dark' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(245, 245, 245, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            color: theme === 'dark' ? '#a0a0a0' : '#666666', 
            fontSize: '24px', 
            marginBottom: '12px' 
          }}>
            🗺️ Loading traffic map...
          </div>
          <div style={{ 
            color: theme === 'dark' ? '#666666' : '#999999', 
            fontSize: '16px' 
          }}>
            Newcastle Traffic Intelligence
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
          backgroundColor: 'rgba(220, 38, 38, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            color: '#ffffff', 
            fontSize: '24px', 
            marginBottom: '12px' 
          }}>
            ❌ Map error
          </div>
          <div style={{ 
            color: '#fca5a5', 
            fontSize: '16px' 
          }}>
            {mapError}
          </div>
        </div>
      )}
      
      {/* Current alert indicator */}
      {mapLoaded && currentAlert && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 100,
          maxWidth: '300px'
        }}>
          <div style={{
            fontSize: '14px',
            color: theme === 'dark' ? '#a0a0a0' : '#666666',
            marginBottom: '4px'
          }}>
            Viewing Alert {currentAlertIndex + 1} of {alerts.length}
          </div>
          <div style={{
            fontSize: '16px',
            color: theme === 'dark' ? '#f5f5f5' : '#1a1a1a',
            fontWeight: 'bold'
          }}>
            {currentAlert.location || 'Unknown Location'}
          </div>
        </div>
      )}
    </div>
  );
};

export default TomTomTrafficMapEnhanced;
