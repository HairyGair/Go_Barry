// Go_BARRY/components/TomTomTrafficMap.jsx
// TomTom Map Display API for React Native Web

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform } from 'react-native';

const MapLibreTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    // Dynamically import MapLibre GL JS only on web
    const initializeMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        
        // Initialize map
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: ['https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key={accessToken}'],
                tileSize: 256,
                attribution: '© TomTom'
              },
              'tomtom-traffic': {
                type: 'raster',
                tiles: ['https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key={accessToken}'],
                tileSize: 256
              }
            },
            layers: [
              {
                id: 'base-map',
                type: 'raster',
                source: 'tomtom-base'
              },
              {
                id: 'traffic-flow',
                type: 'raster',
                source: 'tomtom-traffic',
                paint: {
                  'raster-opacity': 0.8
                }
              }
            ]
          },
          accessToken: 'dummy', // Will be replaced with actual key
          center: [-1.6178, 54.9783], // Newcastle upon Tyne
          zoom: 10,
          attributionControl: true
        });

        map.current.on('load', () => {
          setMapLoaded(true);
          
          // Setup reliable tiles (OpenStreetMap)
          setupReliableTiles();

          // Add alerts source
          if (alerts.length > 0) {
            addAlertsToMap();
          }
        });

        // Function to setup tiles - using OpenStreetMap for reliability
        const setupReliableTiles = async () => {
          try {
            console.log('🔄 Setting up OpenStreetMap tiles...');
            
            // Remove existing sources if they exist
            try {
              if (map.current.getSource('tomtom-base')) {
                map.current.removeLayer('base-map');
                map.current.removeSource('tomtom-base');
              }
              if (map.current.getSource('osm-base')) {
                map.current.removeLayer('base-map');
                map.current.removeSource('osm-base');
              }
            } catch (e) {
              console.log('No existing sources to remove');
            }
            
            // Add OpenStreetMap base tiles (reliable and free)
            map.current.addSource('osm-base', {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            });
            
            // Add base map layer
            map.current.addLayer({
              id: 'base-map',
              type: 'raster',
              source: 'osm-base'
            });
            
            console.log('✅ OpenStreetMap base tiles loaded - reliable and working');
            
            // Note: We'll focus on alert visualization for now
            // TomTom traffic integration can be added back later
            
          } catch (error) {
            console.error('❌ Even OpenStreetMap failed:', error);
          }
        };
        
        // Error handling
        map.current.on('error', (e) => {
          console.error('Map error:', e);
          // Map will continue to work with OpenStreetMap even if there are tile errors
        });

      } catch (error) {
        console.error('Failed to load MapLibre:', error);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add alerts as markers
  const addAlertsToMap = () => {
    if (!map.current || !mapLoaded) return;

    // Remove existing alerts
    if (map.current.getSource('alerts')) {
      map.current.removeLayer('alert-markers');
      map.current.removeSource('alerts');
    }

    const alertFeatures = alerts
      .filter(alert => alert.coordinates && Array.isArray(alert.coordinates))
      .map((alert, index) => ({
        type: 'Feature',
        properties: {
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          location: alert.location,
          isCurrentAlert: index === alertIndex
        },
        geometry: {
          type: 'Point',
          coordinates: [alert.coordinates[1], alert.coordinates[0]] // [lng, lat]
        }
      }));

    if (alertFeatures.length === 0) return;

    map.current.addSource('alerts', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: alertFeatures
      }
    });

    map.current.addLayer({
      id: 'alert-markers',
      type: 'circle',
      source: 'alerts',
      paint: {
        'circle-radius': [
          'case',
          ['get', 'isCurrentAlert'], 12,
          8
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'severity'], 'CRITICAL'], '#ef4444',
          ['==', ['get', 'severity'], 'HIGH'], '#f59e0b',
          ['==', ['get', 'severity'], 'MEDIUM'], '#06b6d4',
          '#64748b'
        ],
        'circle-stroke-width': [
          'case',
          ['get', 'isCurrentAlert'], 3,
          1
        ],
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add popup on click
    map.current.on('click', 'alert-markers', async (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const properties = e.features[0].properties;

      // Dynamically import maplibre for popup
      const maplibregl = await import('maplibre-gl');
      
      const popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${properties.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${properties.location}</p>
            <span style="
              background-color: ${getSeverityColor(properties.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${properties.severity}</span>
          </div>
        `)
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
      map.current.flyTo({
        center: [currentAlert.coordinates[1], currentAlert.coordinates[0]],
        zoom: 14,
        duration: 1500
      });
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

export default MapLibreTrafficMap;