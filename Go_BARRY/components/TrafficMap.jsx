// Go_BARRY/components/TrafficMap.jsx
// Interactive Mapbox map for Control Room Display
// Auto-zooms to alerts and shows markers

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const TrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Mapbox access token from environment
  const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iNWVsazl5MjFvbjJqc2I4ejBkZmdtZCJ9.CyLjZzGIuPsNFUCc1LlUyg';

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    console.log('🗺️ Initializing TrafficMap...');

    // Load Mapbox GL dynamically for web
    const initializeMap = async () => {
      try {
        // Add Mapbox CSS if not already added
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          console.log('📄 Mapbox CSS loaded');
        }

        // Dynamically import mapbox-gl
        const mapboxgl = await import('mapbox-gl');
        
        if (!mapboxgl.default) {
          throw new Error('Failed to load Mapbox GL library');
        }

        console.log('📦 Mapbox GL library loaded');
        mapboxgl.default.accessToken = MAPBOX_TOKEN;

        // Create map instance
        const map = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark theme for control room
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          projection: 'mercator',
          attributionControl: false // Remove attribution for cleaner display
        });

        console.log('🗺️ Map instance created');

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ TrafficMap loaded successfully');
          setMapLoaded(true);
          
          // Add source for alert markers
          map.addSource('alerts', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Add alert markers layer with pulsing effect for current alert
          map.addLayer({
            id: 'alert-markers',
            type: 'circle',
            source: 'alerts',
            paint: {
              'circle-radius': [
                'case',
                ['==', ['get', 'isCurrent'], true], 15, // Larger for current alert
                10
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'severity'], 'High'], '#ef4444', // Red for high severity
                ['==', ['get', 'severity'], 'Medium'], '#f59e0b', // Orange for medium
                '#10b981' // Green for low
              ],
              'circle-stroke-color': [
                'case',
                ['==', ['get', 'isCurrent'], true], '#ffffff', // White stroke for current
                '#000000'
              ],
              'circle-stroke-width': [
                'case',
                ['==', ['get', 'isCurrent'], true], 4, // Thicker stroke for current
                2
              ],
              'circle-opacity': [
                'case',
                ['==', ['get', 'isCurrent'], true], 0.9, // More opaque for current
                0.7
              ],
              'circle-stroke-opacity': 1
            }
          });

          // Add pulsing effect for current alert
          map.addLayer({
            id: 'alert-pulse',
            type: 'circle',
            source: 'alerts',
            filter: ['==', ['get', 'isCurrent'], true],
            paint: {
              'circle-radius': 25,
              'circle-color': '#ef4444',
              'circle-opacity': 0.3,
              'circle-stroke-color': '#ef4444',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.5
            }
          });

          // Add alert labels layer
          map.addLayer({
            id: 'alert-labels',
            type: 'symbol',
            source: 'alerts',
            layout: {
              'text-field': [
                'case',
                ['==', ['get', 'isCurrent'], true], 
                ['concat', '🚨 ', ['get', 'shortTitle']], // Emoji for current alert
                ['get', 'shortTitle']
              ],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'case',
                ['==', ['get', 'isCurrent'], true], 16,
                12
              ],
              'text-offset': [0, 2.5],
              'text-anchor': 'top',
              'text-max-width': 10,
              'text-allow-overlap': false,
              'text-ignore-placement': false
            },
            paint: {
              'text-color': [
                'case',
                ['==', ['get', 'isCurrent'], true], '#ffffff',
                '#ffffff'
              ],
              'text-halo-color': '#000000',
              'text-halo-width': 2,
              'text-halo-blur': 1
            }
          });

          console.log('🎨 Map layers added successfully');
        });

        map.on('error', (e) => {
          console.error('❌ Map error:', e);
          setMapError('Map failed to load properly');
        });

        map.on('sourcedata', (e) => {
          if (e.sourceId === 'alerts' && e.isSourceLoaded) {
            console.log('📊 Alert data loaded on map');
          }
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
        setMapError(`Failed to initialize map: ${error.message}`);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        console.log('🧹 Cleaning up map...');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map data when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !alerts.length) return;

    try {
      const map = mapRef.current;
      
      console.log(`📍 Updating map with ${alerts.length} alerts, current index: ${alertIndex}`);
      
      // Create GeoJSON features for alerts with coordinates
      const features = alerts
        .filter(alert => alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2)
        .map((alert, index) => {
          const isCurrent = index === alertIndex;
          const shortTitle = (alert.title || 'Alert').length > 20 
            ? (alert.title || 'Alert').substring(0, 20) + '...'
            : (alert.title || 'Alert');

          console.log(`📌 Alert ${index}: ${alert.title} at [${alert.coordinates[0]}, ${alert.coordinates[1]}] - Current: ${isCurrent}`);

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [alert.coordinates[1], alert.coordinates[0]] // [lng, lat] for Mapbox
            },
            properties: {
              id: alert.id || `alert-${index}`,
              title: alert.title || 'Traffic Alert',
              shortTitle: shortTitle,
              description: alert.description || '',
              location: alert.location || '',
              severity: alert.severity || 'Medium',
              isCurrent: isCurrent,
              startDate: alert.startDate || null,
              index: index
            }
          };
        });

      console.log(`🗺️ Created ${features.length} map features from ${alerts.length} alerts`);

      // Update the alerts source
      const source = map.getSource('alerts');
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: features
        });
        console.log(`✅ Updated map with ${features.length} alert markers`);
      } else {
        console.warn('⚠️ Alerts source not found on map');
      }

    } catch (error) {
      console.error('❌ Error updating map data:', error);
    }
  }, [alerts, alertIndex, mapLoaded]);

  // Auto-zoom to current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentAlert || !currentAlert.coordinates) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      console.log(`🎯 Auto-zooming to current alert: ${currentAlert.title} at [${lat}, ${lng}]`);

      // Animate to the current alert location
      map.flyTo({
        center: [lng, lat], // [lng, lat] for Mapbox
        zoom: 15, // Closer zoom for alert details
        duration: 2500, // 2.5 second animation
        essential: true, // Ensures animation completes
        curve: 1.42, // Smooth curve
        easing: (t) => t * (2 - t) // Ease out animation
      });

      console.log(`🎯 Map zooming to alert "${currentAlert.title}" at [${lat}, ${lng}]`);

    } catch (error) {
      console.error('❌ Error zooming to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Reset to overview when no alerts or no current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const map = mapRef.current;
        console.log('🔄 Resetting map to North East England overview');
        map.flyTo({
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 2000,
          essential: true
        });
        console.log('🗺️ Map reset to North East England overview');
      } catch (error) {
        console.error('❌ Error resetting map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  // Handle non-web platforms
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🗺️</Text>
        <Text style={styles.unsupportedText}>
          Interactive map view is only available on web browsers
        </Text>
      </View>
    );
  }

  // Handle map errors
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Map Error</Text>
        <Text style={styles.errorText}>{mapError}</Text>
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
          <Text style={styles.loadingText}>Loading interactive map...</Text>
          <Text style={styles.loadingSubtext}>Connecting to Mapbox...</Text>
        </View>
      )}
      {mapLoaded && alerts.length > 0 && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts on map
          </Text>
        </View>
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
    backgroundColor: '#1e293b',
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapInfoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 32,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  unsupportedText: {
    color: '#ffffff',
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
  },
});

export default TrafficMap;