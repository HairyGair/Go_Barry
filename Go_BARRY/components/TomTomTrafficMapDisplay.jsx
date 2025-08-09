// Go_BARRY/components/TomTomTrafficMapDisplay.jsx
// Enhanced TomTom Traffic Map for Display Screen with Auto-Zoom
// Optimized for 55" display with synchronized alert carousel

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';

const MAP_ZOOM_LEVELS = {
  OVERVIEW: 10,      // Shows entire region
  CITY: 12,          // City-level view
  INCIDENT: 15,      // Street-level for incidents
  DETAILED: 17       // Maximum zoom for critical events
};

const ZOOM_DURATION = 2000; // 2 seconds for smooth transition
const HOLD_DURATION = 18000; // 18 seconds (alert time minus transition)

const TomTomTrafficMapDisplay = ({ 
  alerts = [], 
  currentAlert = null,
  theme = 'dark',
  mapId = 'display-map',
  onMapReady = null
}) => {
  const [containerElement, setContainerElement] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);
  const previousAlertsRef = useRef([]);
  const zoomTimeoutRef = useRef(null);

  // Map container callback
  const mapContainerCallback = (element) => {
    if (element && !containerElement) {
      setContainerElement(element);
    }
  };

  // Initialize map
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerElement) return;

    const initializeMap = async () => {
      try {
        // Get API key
        let apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
        if (!apiKey) {
          const keyResponse = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
          if (keyResponse.ok) {
            const keyData = await keyResponse.json();
            apiKey = keyData.apiKey;
          }
        }
        
        if (!apiKey) {
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
        }

        // Load MapLibre GL
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
        
        // Create map with dark theme for display
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
            }],
            glyphs: 'https://api.mapbox.com/fonts/v1/mapbox/{fontstack}/{range}.pbf?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
            sprite: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/sprite'
          },
          center: [-1.6178, 54.9783], // Newcastle
          zoom: MAP_ZOOM_LEVELS.OVERVIEW,
          pitch: 0,
          bearing: 0
        });

        map.on('load', () => {
          setMapLoaded(true);
          setMapInstance(map);
          
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
              'raster-opacity': theme === 'dark' ? 0.7 : 0.6
            }
          });

          // Add pulsing animation styles
          if (!document.getElementById('display-map-animations')) {
            const style = document.createElement('style');
            style.id = 'display-map-animations';
            style.textContent = `
              @keyframes pulse-alert {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.8; }
              }
              @keyframes fade-in {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
              }
              .alert-marker-current {
                animation: pulse-alert 2s infinite;
              }
              .alert-marker-new {
                animation: fade-in 0.5s ease-out;
              }
            `;
            document.head.appendChild(style);
          }
          
          if (onMapReady) {
            onMapReady(map);
          }
        });

        map.on('error', (error) => {
          console.error('Map error:', error);
          setMapError(error.message);
        });

        setMapInstance(map);

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError(error.message);
      }
    };

    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('Map cleanup error:', e);
        }
      }
    };
  }, [containerElement, theme]);

  // Update markers and handle auto-zoom
  useEffect(() => {
    if (!mapInstance || !mapLoaded || !window.maplibregl) return;

    const maplibregl = window.maplibregl;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.warn('Marker removal error:', e);
      }
    });
    markersRef.current = [];

    // Clear zoom timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = null;
    }

    // Add current alert to previous alerts (keep last 5)
    if (currentAlert && currentAlert.coordinates) {
      previousAlertsRef.current = [
        currentAlert,
        ...previousAlertsRef.current.filter(a => a.id !== currentAlert.id)
      ].slice(0, 5);
    }

    // Create faded markers for previous alerts
    previousAlertsRef.current.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      const opacity = 0.3 - (index * 0.05); // Fade older markers more
      
      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
        width: 12px;
        height: 12px;
        background-color: ${getSeverityColor(alert.severity)};
        border: 2px solid white;
        border-radius: 50%;
        opacity: ${opacity};
        transition: all 0.3s ease;
      `;
      
      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(mapInstance);
      
      markersRef.current.push(marker);
    });

    // Add all current alerts
    alerts.forEach((alert) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      const isCurrentAlert = currentAlert && alert.id === currentAlert.id;
      
      const markerElement = document.createElement('div');
      const severityColor = getSeverityColor(alert.severity);
      const size = isCurrentAlert ? 24 : 16;
      
      markerElement.className = isCurrentAlert ? 'alert-marker-current' : 'alert-marker-new';
      markerElement.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${severityColor};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        z-index: ${isCurrentAlert ? 1000 : 100};
        position: relative;
      `;

      // Add severity indicator for current alert
      if (isCurrentAlert) {
        const severityBadge = document.createElement('div');
        severityBadge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: ${severityColor};
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          white-space: nowrap;
        `;
        severityBadge.textContent = alert.severity?.toUpperCase() || 'ALERT';
        markerElement.appendChild(severityBadge);
      }

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(mapInstance);

      // Create enhanced popup
      const popup = new maplibregl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div style="
          padding: 12px;
          font-family: Arial, sans-serif;
          max-width: 300px;
          background: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
          color: ${theme === 'dark' ? '#ffffff' : '#000000'};
          border-radius: 8px;
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold;">
            ${alert.title}
          </h3>
          <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.8;">
            📍 ${alert.location}
          </p>
          ${alert.affectedRoutes && alert.affectedRoutes.length > 0 ? `
            <div style="margin: 8px 0;">
              <span style="font-size: 12px; opacity: 0.7;">Affected Routes:</span>
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                ${alert.affectedRoutes.map(route => `
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
          ">
            ${alert.severity?.toUpperCase() || 'ALERT'}
          </div>
        </div>
      `);

      marker.setPopup(popup);
      
      // Auto-show popup for current alert
      if (isCurrentAlert) {
        setTimeout(() => {
          popup.addTo(mapInstance);
        }, ZOOM_DURATION + 500);
      }
      
      markersRef.current.push(marker);
    });

    // Handle auto-zoom to current alert
    if (currentAlert && currentAlert.coordinates && Array.isArray(currentAlert.coordinates)) {
      const [lat, lng] = currentAlert.coordinates;
      const zoomLevel = currentAlert.severity === 'CRITICAL' || currentAlert.severity === 'EMERGENCY' 
        ? MAP_ZOOM_LEVELS.DETAILED 
        : MAP_ZOOM_LEVELS.INCIDENT;

      // Smooth fly to alert
      mapInstance.flyTo({
        center: [lng, lat],
        zoom: zoomLevel,
        duration: ZOOM_DURATION,
        essential: true,
        pitch: currentAlert.severity === 'CRITICAL' ? 30 : 0,
        bearing: 0
      });

      // Return to overview after holding
      zoomTimeoutRef.current = setTimeout(() => {
        mapInstance.flyTo({
          center: [-1.6178, 54.9783], // Newcastle center
          zoom: MAP_ZOOM_LEVELS.OVERVIEW,
          duration: ZOOM_DURATION,
          pitch: 0,
          bearing: 0
        });
      }, HOLD_DURATION);
    } else if (alerts.length === 0) {
      // No alerts - show full overview
      mapInstance.flyTo({
        center: [-1.6178, 54.9783],
        zoom: MAP_ZOOM_LEVELS.OVERVIEW,
        duration: ZOOM_DURATION,
        pitch: 0,
        bearing: 0
      });
    }

    // Memory cleanup for old markers (keep only 50 markers max)
    if (markersRef.current.length > 50) {
      const toRemove = markersRef.current.splice(0, markersRef.current.length - 50);
      toRemove.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('Marker cleanup error:', e);
        }
      });
    }

  }, [alerts, currentAlert, mapInstance, mapLoaded, theme]);

  // Helper function for severity colors
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
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5'
      }}>
        <Text style={{ 
          color: theme === 'dark' ? '#666666' : '#999999',
          fontSize: 18 
        }}>
          🗺️ Map view available on web only
        </Text>
      </View>
    );
  }

  // Web platform
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? '#0a0a0a' : '#f5f5f5'
    }}>
      <div
        ref={mapContainerCallback}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      />
      
      {/* Loading state */}
      {!mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme === 'dark' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(245, 245, 245, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            color: theme === 'dark' ? '#666666' : '#999999',
            fontSize: '24px' 
          }}>
            🗺️ Loading traffic map...
          </div>
        </div>
      )}
      
      {/* Error state */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{ color: '#dc2626', fontSize: '24px', marginBottom: '8px' }}>
            ❌ Map error
          </div>
          <div style={{ color: '#ef4444', fontSize: '16px' }}>
            {mapError}
          </div>
        </div>
      )}

      {/* Map legend */}
      {mapLoaded && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 100
        }}>
          <div style={{ 
            color: theme === 'dark' ? '#ffffff' : '#000000',
            fontWeight: 'bold',
            marginBottom: '8px' 
          }}>
            Alert Severity
          </div>
          {['CRITICAL', 'MAJOR', 'MINOR'].map(severity => (
            <div key={severity} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '4px' 
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: getSeverityColor(severity),
                borderRadius: '50%',
                marginRight: '8px'
              }} />
              <span style={{ 
                color: theme === 'dark' ? '#a0a0a0' : '#666666',
                fontSize: '12px'
              }}>
                {severity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TomTomTrafficMapDisplay;
