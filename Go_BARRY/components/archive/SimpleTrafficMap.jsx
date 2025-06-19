// Go_BARRY/components/SimpleTrafficMap.jsx
// Simple, reliable map implementation for DisplayScreen

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const SimpleTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState(null);

  // North East England bounds
  const MAP_BOUNDS = {
    north: 55.5,
    south: 54.5,
    east: -1.0,
    west: -2.2
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initMap = async () => {
      try {
        // Wait for container
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!mapContainer.current) {
          throw new Error('Container not found');
        }

        // Create basic Leaflet map
        if (!window.L) {
          // Load Leaflet
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Create map
        const map = window.L.map(mapContainer.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([54.9783, -1.6131], 10);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
        }).addTo(map);

        mapRef.current = map;
        setMapReady(true);
        setError(null);

      } catch (err) {
        console.error('Map error:', err);
        setError(err.message);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers
  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.L) return;

    const map = mapRef.current;
    
    // Clear existing layers
    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add alert markers
    alerts
      .filter(alert => alert.coordinates && Array.isArray(alert.coordinates))
      .forEach((alert, index) => {
        const [lat, lng] = alert.coordinates;
        
        // Create colored marker
        const color = alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 
          '#ef4444' : alert.severity === 'MEDIUM' ? '#f59e0b' : '#10b981';
        
        const marker = window.L.circleMarker([lat, lng], {
          radius: index === alertIndex ? 12 : 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        // Add popup
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>${alert.title || 'Traffic Alert'}</strong><br>
            <small>${alert.location || 'Location not specified'}</small>
          </div>
        `);

        // Focus on current alert
        if (index === alertIndex) {
          map.setView([lat, lng], 14);
        }
      });

  }, [alerts, alertIndex, mapReady]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackIcon}>🗺️</Text>
        <Text style={styles.fallbackText}>Map available on web only</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackIcon}>⚠️</Text>
        <Text style={styles.fallbackText}>Map unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!mapReady) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackIcon}>🔄</Text>
        <Text style={styles.fallbackText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <div 
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 12,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SimpleTrafficMap;