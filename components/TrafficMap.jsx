// Go_BARRY/components/TrafficMap.jsx
// Interactive Mapbox map for Control Room Display
// Auto-zooms to alerts and shows markers

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

const TrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Mapbox access token - you may need to pass this as prop or get from env
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiaGFpcnlnYWlyMDAiLCJhIjoiY21iNWVsazl5MjFvbjJqc2I4ejBkZmdtZCJ9.CyLjZzGIuPsNFUCc1LlUyg';

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (!Platform.OS === 'web' || !mapContainer.current) return;

    // Load Mapbox GL dynamically for web
    const initializeMap = async () => {
      try {
        // Dynamically import mapbox-gl for web
        const mapboxgl = await import('mapbox-gl');
        
        if (!mapboxgl.default) {
          console.error('❌ Mapbox GL failed to load');
          return;
        }

        mapboxgl.default.accessToken = MAPBOX_TOKEN;

        // Create map instance
        const map = new mapboxgl.default.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11', // Dark theme for control room
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          projection: 'mercator'
        });

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

          // Add alert markers layer
          map.addLayer({
            id: 'alert-markers',
            type: 'circle',
            source: 'alerts',
            paint: {
              'circle-radius': [
                'case',
                ['==', ['get', 'isCurrent'], true], 12, // Larger for current alert
                8
              ],
              'circle-color': [
                'case',
                ['==', ['get', 'severity'], 'High'], '#ef4444', // Red for high severity
                ['==', ['get', 'severity'], 'Medium'], '#f59e0b', // Orange for medium
                '#10b981' // Green for low
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': [
                'case',
                ['==', ['get', 'isCurrent'], true], 3, // Thicker stroke for current
                2
              ],
              'circle-opacity': 0.8
            }
          });

          // Add alert labels layer
          map.addLayer({
            id: 'alert-labels',
            type: 'symbol',
            source: 'alerts',
            layout: {
              'text-field': ['get', 'title'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'case',
                ['==', ['get', 'isCurrent'], true], 14,
                12
              ],
              'text-offset': [0, 2],
              'text-anchor': 'top',
              'text-max-width': 8
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 2
            }
          });
        });

        map.on('error', (e) => {
          console.error('❌ Map error:', e);
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
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
      
      // Create GeoJSON features for alerts with coordinates
      const features = alerts
        .filter(alert => alert.coordinates && alert.coordinates.length === 2)
        .map((alert, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [alert.coordinates[1], alert.coordinates[0]] // [lng, lat]
          },
          properties: {
            id: alert.id || `alert-${index}`,
            title: alert.title || 'Traffic Alert',
            description: alert.description || '',
            location: alert.location || '',
            severity: alert.severity || 'Low',
            isCurrent: index === alertIndex,
            startDate: alert.startDate || null
          }
        }));

      // Update the alerts source
      const source = map.getSource('alerts');
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: features
        });
      }

      console.log(`📍 Updated map with ${features.length} alert markers`);

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

      // Animate to the current alert location
      map.flyTo({
        center: [lng, lat],
        zoom: 14, // Closer zoom for alert details
        duration: 2000, // 2 second animation
        essential: true
      });

      console.log(`🎯 Map zooming to alert at [${lat}, ${lng}]`);

    } catch (error) {
      console.error('❌ Error zooming to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Reset to overview when no alerts
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (!alerts.length || !currentAlert) {
      try {
        const map = mapRef.current;
        map.flyTo({
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 1500
        });
        console.log('🗺️ Map reset to North East England overview');
      } catch (error) {
        console.error('❌ Error resetting map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedText}>
          Map view not supported on this platform
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
          <Text style={styles.loadingText}>Loading map...</Text>
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
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
  },
  unsupportedText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TrafficMap;