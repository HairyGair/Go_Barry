// Go_BARRY/components/TomTomTrafficMap.jsx
// TomTom Maps SDK implementation for Control Room Display
// Auto-zooms to alerts and shows markers

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const TomTomTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // TomTom API key from environment
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || 'YOUR_TOMTOM_KEY_HERE';

  console.log('🔑 TomTom API key available:', TOMTOM_API_KEY && TOMTOM_API_KEY !== 'YOUR_TOMTOM_KEY_HERE' ? 'Yes' : 'No');
  console.log('🌐 Platform:', Platform.OS);

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapContainer.current) return;

    console.log('🗺️ Initializing TomTomTrafficMap...');

    // Load TomTom Maps SDK dynamically for web
    const initializeMap = async () => {
      try {
        console.log('🚀 Starting TomTom map initialization...');
        
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Add TomTom Maps SDK script if not already loaded
        if (!window.tt) {
          console.log('📦 Loading TomTom Maps SDK...');
          const script = document.createElement('script');
          script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load TomTom Maps SDK'));
          });
        }

        // Add TomTom CSS if not already added
        if (!document.querySelector('link[href*="tomtom"]')) {
          console.log('📄 Loading TomTom CSS...');
          const link = document.createElement('link');
          link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        if (!window.tt) {
          throw new Error('TomTom Maps SDK failed to load');
        }

        console.log('✅ TomTom Maps SDK loaded successfully');

        // Create map instance
        const map = window.tt.map({
          key: TOMTOM_API_KEY,
          container: mapContainer.current,
          style: 'tomtom://vector/1/basic-main',
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          language: 'en-GB'
        });

        console.log('🗺️ TomTom map instance created');

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ TomTomTrafficMap loaded successfully');
          setMapLoaded(true);
          
          // Enable traffic flow
          map.addLayer({
            id: 'traffic-flow',
            type: 'TomTomTrafficFlowLayer',
            source: 'traffic',
            minzoom: 0,
            maxzoom: 22
          });

          // Enable traffic incidents
          map.addLayer({
            id: 'traffic-incidents',
            type: 'TomTomTrafficIncidentsLayer',
            source: 'traffic-incidents',
            minzoom: 0,
            maxzoom: 22
          });

          console.log('🎨 Traffic layers added successfully');
        });

        map.on('error', (e) => {
          console.error('❌ Map error:', e);
          setMapError('Map failed to load properly');
        });

        mapRef.current = map;

      } catch (error) {
        console.error('❌ Failed to initialize TomTom map:', error);
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
      // Clear markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Update map markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !window.tt) return;

    try {
      const map = mapRef.current;
      
      console.log(`📍 Updating map with ${alerts.length} alerts, current index: ${alertIndex}`);
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add markers for alerts with coordinates
      alerts
        .filter(alert => alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2)
        .forEach((alert, index) => {
          const isCurrent = index === alertIndex;
          const [lat, lng] = alert.coordinates;
          
          // Create custom HTML element for marker
          const el = document.createElement('div');
          el.className = 'tt-marker';
          el.style.width = isCurrent ? '30px' : '20px';
          el.style.height = isCurrent ? '30px' : '20px';
          el.style.borderRadius = '50%';
          el.style.border = isCurrent ? '4px solid #1F2937' : '2px solid #FFFFFF';
          el.style.cursor = 'pointer';
          
          // Set color based on severity
          let color = '#10B981'; // Default green
          if (alert.severity === 'CRITICAL' || alert.severity === 'Critical') color = '#DC2626';
          else if (alert.severity === 'HIGH' || alert.severity === 'High') color = '#EF4444';
          else if (alert.severity === 'MEDIUM' || alert.severity === 'Medium') color = '#F59E0B';
          
          el.style.backgroundColor = color;
          
          if (isCurrent) {
            // Add pulsing animation for current alert
            el.style.animation = 'pulse 2s infinite';
          }
          
          // Create marker
          const marker = new window.tt.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map);
          
          // Add popup
          const popup = new window.tt.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-weight: bold;">${alert.title || 'Traffic Alert'}</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">${alert.location || ''}</p>
                <p style="margin: 4px 0 0 0; font-weight: 500; color: ${color};">${alert.severity || 'Medium'}</p>
              </div>
            `);
          
          marker.setPopup(popup);
          
          markersRef.current.push(marker);
          
          console.log(`📌 Added marker for alert ${index}: ${alert.title} at [${lat}, ${lng}]`);
        });

      console.log(`✅ Updated map with ${markersRef.current.length} alert markers`);

    } catch (error) {
      console.error('❌ Error updating map markers:', error);
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
        center: [lng, lat],
        zoom: 15,
        duration: 2500
      });

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
        console.log('🔄 Resetting map to North East England overview');
        map.flyTo({
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          duration: 2000
        });
      } catch (error) {
        console.error('❌ Error resetting map view:', error);
      }
    }
  }, [alerts.length, currentAlert, mapLoaded]);

  // Add pulse animation CSS
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
        {mapError.includes('API') && (
          <Text style={styles.errorHint}>
            Check that EXPO_PUBLIC_TOMTOM_API_KEY is set correctly
          </Text>
        )}
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
          <Text style={styles.loadingSubtext}>Connecting to TomTom Services...</Text>
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
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  errorHint: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TomTomTrafficMap;
