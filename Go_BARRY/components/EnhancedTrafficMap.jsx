// Go_BARRY/components/EnhancedTrafficMap.jsx
// TomTom-powered interactive map with tiles and traffic overlay
// Optimized for 50,000 daily tile requests with intelligent caching

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const EnhancedTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [tileStats, setTileStats] = useState(null);
  const [trafficOverlay, setTrafficOverlay] = useState(true);

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area [lng, lat]
  const DEFAULT_ZOOM = 10;

  // TomTom tile service configuration
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://go-barry.onrender.com';

  console.log('🗺️ Enhanced TomTom TrafficMap initializing...');
  console.log('📡 Backend URL:', BACKEND_URL);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    console.log('🚀 Initializing TomTom-powered map...');

    const initializeMap = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Load Leaflet (lightweight map library) for tile display
        if (!window.L) {
          console.log('📦 Loading Leaflet library...');
          
          // Add Leaflet CSS
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(cssLink);
          
          // Add Leaflet JS
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
          });
        }

        if (!window.L) {
          throw new Error('Leaflet failed to load');
        }

        console.log('✅ Leaflet loaded successfully');

        // Create map instance
        const map = window.L.map(mapContainer.current, {
          center: [NE_ENGLAND_CENTER[1], NE_ENGLAND_CENTER[0]], // [lat, lng] for Leaflet
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          attributionControl: false, // Remove attribution for cleaner display
          preferCanvas: true // Better performance for many markers
        });

        // Add TomTom base map tiles
        const baseLayer = window.L.tileLayer(`${BACKEND_URL}/api/tiles/map/basic/main/{z}/{x}/{y}.png`, {
          maxZoom: 18,
          attribution: '© TomTom',
          errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Transparent 1x1 pixel
        });
        
        baseLayer.addTo(map);

        // Add traffic incident overlay if enabled
        let trafficLayer = null;
        if (trafficOverlay) {
          trafficLayer = window.L.tileLayer(`${BACKEND_URL}/api/tiles/traffic/{z}/{x}/{y}.png?style=light`, {
            maxZoom: 18,
            opacity: 0.7,
            attribution: '© TomTom Traffic',
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          });
          trafficLayer.addTo(map);
        }

        // Create marker group for alerts
        const markersGroup = window.L.layerGroup().addTo(map);

        console.log('✅ TomTom map loaded successfully');
        
        mapRef.current = {
          map,
          baseLayer,
          trafficLayer,
          markersGroup
        };

        setMapLoaded(true);

        // Get initial tile statistics
        fetchTileStats();

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
        setMapError(`Failed to initialize map: ${error.message}`);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current?.map) {
        console.log('🧹 Cleaning up TomTom map...');
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, [BACKEND_URL, trafficOverlay]);

  // Fetch tile usage statistics
  const fetchTileStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tiles/status`);
      if (response.ok) {
        const data = await response.json();
        setTileStats(data.tileService);
        console.log('📊 Tile stats:', data.tileService.dailyUsage);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch tile stats:', error.message);
    }
  };

  // Update map markers when alerts change
  useEffect(() => {
    if (!mapRef.current?.map || !mapLoaded || !alerts.length) return;

    try {
      const { map, markersGroup } = mapRef.current;
      
      console.log(`📍 Updating TomTom map with ${alerts.length} alerts, current index: ${alertIndex}`);
      
      // Clear existing markers
      markersGroup.clearLayers();

      // Add markers for alerts with coordinates
      alerts
        .filter(alert => alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2)
        .forEach((alert, index) => {
          const isCurrent = index === alertIndex;
          const [lat, lng] = alert.coordinates;

          // Create custom icon based on severity and current status
          const getSeverityColor = (severity) => {
            switch (severity?.toUpperCase()) {
              case 'CRITICAL': return '#DC2626';
              case 'HIGH': return '#EF4444';
              case 'MEDIUM': return '#F59E0B';
              case 'LOW': return '#10B981';
              default: return '#6B7280';
            }
          };

          const color = getSeverityColor(alert.severity);
          const size = isCurrent ? 20 : 15;
          const stroke = isCurrent ? 4 : 2;

          // Create custom div icon
          const iconHtml = `
            <div style="
              background-color: ${color};
              width: ${size}px;
              height: ${size}px;
              border-radius: 50%;
              border: ${stroke}px solid ${isCurrent ? '#1F2937' : '#FFFFFF'};
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
            "></div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `;

          const customIcon = window.L.divIcon({
            html: iconHtml,
            className: 'custom-alert-marker',
            iconSize: [size + stroke * 2, size + stroke * 2],
            iconAnchor: [(size + stroke * 2) / 2, (size + stroke * 2) / 2]
          });

          // Create marker
          const marker = window.L.marker([lat, lng], { icon: customIcon });

          // Add popup with alert details
          const popupContent = `
            <div style="max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #1F2937; font-size: 14px; font-weight: bold;">
                ${isCurrent ? '🚨 ' : ''}${alert.title || 'Traffic Alert'}
              </h3>
              <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px;">
                📍 ${alert.location || 'Unknown location'}
              </p>
              <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px;">
                🚨 Severity: <span style="color: ${color}; font-weight: bold;">${alert.severity || 'Medium'}</span>
              </p>
              ${alert.description ? `
                <p style="margin: 0; color: #4B5563; font-size: 12px;">
                  ${alert.description}
                </p>
              ` : ''}
              ${alert.affectsRoutes && alert.affectsRoutes.length > 0 ? `
                <p style="margin: 6px 0 0 0; color: #1F2937; font-size: 12px;">
                  🚌 Routes: ${alert.affectsRoutes.slice(0, 5).join(', ')}${alert.affectsRoutes.length > 5 ? '...' : ''}
                </p>
              ` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
          markersGroup.addLayer(marker);

          console.log(`📌 Added marker for: ${alert.title} at [${lat}, ${lng}] - Current: ${isCurrent}`);
        });

      console.log(`✅ Updated TomTom map with ${markersGroup.getLayers().length} markers`);

    } catch (error) {
      console.error('❌ Error updating TomTom map markers:', error);
    }
  }, [alerts, alertIndex, mapLoaded]);

  // Auto-zoom to current alert
  useEffect(() => {
    if (!mapRef.current?.map || !mapLoaded || !currentAlert || !currentAlert.coordinates) return;

    try {
      const { map } = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      console.log(`🎯 Auto-zooming to current alert: ${currentAlert.title} at [${lat}, ${lng}]`);

      // Animate to the current alert location
      map.flyTo([lat, lng], 15, {
        duration: 2.5, // 2.5 seconds
        easeLinearity: 0.1
      });

      console.log(`🎯 TomTom map zooming to alert "${currentAlert.title}"`);

    } catch (error) {
      console.error('❌ Error zooming to alert on TomTom map:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Reset to overview when no alerts
  useEffect(() => {
    if (!mapRef.current?.map || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const { map } = mapRef.current;
        console.log('🔄 Resetting TomTom map to North East England overview');
        map.flyTo([NE_ENGLAND_CENTER[1], NE_ENGLAND_CENTER[0]], DEFAULT_ZOOM, {
          duration: 2
        });
        console.log('🗺️ TomTom map reset to overview');
      } catch (error) {
        console.error('❌ Error resetting TomTom map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  // Toggle traffic overlay
  const toggleTrafficOverlay = () => {
    if (!mapRef.current?.map) return;

    try {
      const { map, trafficLayer } = mapRef.current;
      
      if (trafficOverlay && trafficLayer) {
        map.removeLayer(trafficLayer);
        console.log('🚦 Traffic overlay disabled');
      } else if (!trafficOverlay) {
        const newTrafficLayer = window.L.tileLayer(`${BACKEND_URL}/api/tiles/traffic/{z}/{x}/{y}.png?style=light`, {
          maxZoom: 18,
          opacity: 0.7,
          attribution: '© TomTom Traffic'
        });
        newTrafficLayer.addTo(map);
        mapRef.current.trafficLayer = newTrafficLayer;
        console.log('🚦 Traffic overlay enabled');
      }
      
      setTrafficOverlay(!trafficOverlay);
      
    } catch (error) {
      console.error('❌ Error toggling traffic overlay:', error);
    }
  };

  // Handle non-web platforms
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🗺️</Text>
        <Text style={styles.unsupportedText}>
          TomTom map view is only available on web browsers
        </Text>
      </View>
    );
  }

  // Handle map errors
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>TomTom Map Error</Text>
        <Text style={styles.errorText}>{mapError}</Text>
        <Text style={styles.errorSubtext}>
          Check network connection and backend status
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        style={styles.mapContainer}
      />
      
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingIcon}>🗺️</Text>
          <Text style={styles.loadingText}>Loading TomTom map...</Text>
          <Text style={styles.loadingSubtext}>Connecting to tile service...</Text>
        </View>
      )}
      
      {mapLoaded && (
        <>
          {/* Map Controls */}
          <View style={styles.mapControls}>
            <button
              onClick={toggleTrafficOverlay}
              style={{
                ...styles.controlButton,
                backgroundColor: trafficOverlay ? '#EF4444' : '#10B981'
              }}
            >
              {trafficOverlay ? '🚦 Hide Traffic' : '🚦 Show Traffic'}
            </button>
            
            <button
              onClick={fetchTileStats}
              style={styles.controlButton}
            >
              📊 Refresh Stats
            </button>
          </View>

          {/* Map Info */}
          {alerts.length > 0 && (
            <View style={styles.mapInfo}>
              <Text style={styles.mapInfoText}>
                📍 {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts
              </Text>
              {trafficOverlay && (
                <Text style={styles.mapInfoText}>🚦 Traffic overlay: ON</Text>
              )}
            </View>
          )}

          {/* Tile Usage Stats */}
          {tileStats && (
            <View style={styles.tileStats}>
              <Text style={styles.tileStatsTitle}>TomTom Tiles</Text>
              <Text style={styles.tileStatsText}>
                📊 {tileStats.dailyUsage?.tilesUsed || 0} / 50,000 used today
              </Text>
              <Text style={styles.tileStatsText}>
                💾 {tileStats.cache?.size || 0} tiles cached
              </Text>
              <Text style={styles.tileStatsText}>
                ⏰ {tileStats.throttling?.businessHours?.currentlyOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#6B7280',
    fontSize: 14,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapInfoText: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  tileStats: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tileStatsTitle: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  tileStatsText: {
    color: '#6B7280',
    fontSize: 10,
    marginBottom: 1,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    padding: 32,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  unsupportedText: {
    color: '#374151',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EnhancedTrafficMap;
