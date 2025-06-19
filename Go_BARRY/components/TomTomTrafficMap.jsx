// Go_BARRY/components/TomTomTrafficMap.jsx
// Simplified TomTom Maps implementation - Fixed for Display Screen

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const TomTomTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // TomTom API key
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeMap = async () => {
      try {
        // Check if component is still mounted
        if (!mountedRef.current) {
          console.log('🛑 Component unmounted, aborting map initialization');
          return;
        }

        console.log(`🗺️ Starting TomTom Map initialization... (attempt ${retryCountRef.current + 1})`);
        
        // Check if we're in a browser
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Load TomTom SDK if not already loaded
        if (!window.tt) {
          console.log('📦 Loading TomTom Maps SDK...');
          
          // Create script element
          const script = document.createElement('script');
          script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js';
          script.async = true;
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load TomTom SDK'));
            document.head.appendChild(script);
          });

          // Load CSS
          const link = document.createElement('link');
          link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);

          // Wait a moment for SDK to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Verify SDK is ready
        if (!window.tt || !window.tt.map) {
          throw new Error('TomTom SDK not properly loaded');
        }

        console.log('✅ TomTom SDK ready');

        // Get container element with retry logic
        const container = mapContainer.current;
        if (!container) {
          if (retryCountRef.current < 50) { // Max 50 retries = 10 seconds
            retryCountRef.current++;
            console.log(`⏳ Container not ready yet, retrying... (${retryCountRef.current}/50)`);
            setTimeout(initializeMap, 200);
            return;
          } else {
            throw new Error('Container element not found after 50 retries');
          }
        }
        
        // Ensure container is in DOM and has dimensions
        if (!document.contains(container) || container.offsetWidth === 0 || container.offsetHeight === 0) {
          if (retryCountRef.current < 50) { // Max 50 retries = 10 seconds
            retryCountRef.current++;
            console.log(`⏳ Container not ready in DOM (${container.offsetWidth}x${container.offsetHeight}), retrying... (${retryCountRef.current}/50)`);
            setTimeout(initializeMap, 200);
            return;
          } else {
            throw new Error('Container not properly rendered after 50 retries');
          }
        }
        
        console.log('✅ Container ready:', container);

        // Create map
        console.log('🗺️ Creating map instance...');
        const map = window.tt.map({
          key: TOMTOM_API_KEY,
          container: container,
          center: NE_ENGLAND_CENTER,
          zoom: DEFAULT_ZOOM,
          language: 'en-GB'
        });

        mapRef.current = map;

        // Wait for map to load
        map.on('load', () => {
          console.log('✅ Map loaded successfully');
          setMapLoaded(true);
          setMapError(null);
          
          // Enable traffic layers
          try {
            map.showTrafficFlow();
            map.showTrafficIncidents();
            console.log('✅ Traffic layers enabled');
          } catch (err) {
            console.warn('⚠️ Could not enable traffic layers:', err);
          }
        });

        map.on('error', (e) => {
          console.error('❌ Map error:', e);
          setMapError('Map loading error');
        });

      } catch (error) {
        console.error('❌ TomTom initialization error:', error);
        setMapError(error.message);
      }
    };

    // Small delay to ensure container is ready
    const timer = setTimeout(initializeMap, 2000); // Increased from 1000ms to 2000ms

    // Cleanup
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          console.log('✅ Map cleaned up');
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapRef.current = null;
      }
      markersRef.current = [];
      retryCountRef.current = 0;
    };
  }, [TOMTOM_API_KEY]);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !window.tt) return;

    try {
      const map = mapRef.current;
      
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.error('Error removing marker:', e);
        }
      });
      markersRef.current = [];

      // Add new markers
      alerts
        .filter(alert => {
          const coords = alert.coordinates;
          return coords && Array.isArray(coords) && coords.length >= 2 && 
                 !isNaN(coords[0]) && !isNaN(coords[1]);
        })
        .forEach((alert, index) => {
          try {
            const isCurrent = index === alertIndex;
            const [lat, lng] = alert.coordinates;
            
            // Create marker element
            const el = document.createElement('div');
            el.style.width = isCurrent ? '24px' : '16px';
            el.style.height = isCurrent ? '24px' : '16px';
            el.style.borderRadius = '50%';
            el.style.border = isCurrent ? '3px solid #FFFFFF' : '2px solid #FFFFFF';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            
            // Set color based on severity
            let color = '#10B981'; // Low
            const severity = (alert.severity || '').toLowerCase();
            if (severity === 'critical' || severity === 'high') {
              color = '#EF4444';
            } else if (severity === 'medium') {
              color = '#F59E0B';
            }
            
            el.style.backgroundColor = color;
            
            // Add animation for current alert
            if (isCurrent) {
              el.style.animation = 'pulse 2s ease-in-out infinite';
            }
            
            // Create marker
            const marker = new window.tt.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(map);
            
            markersRef.current.push(marker);
          } catch (markerError) {
            console.error('Error creating marker:', markerError);
          }
        });

      console.log(`✅ Added ${markersRef.current.length} markers`);

    } catch (error) {
      console.error('❌ Error updating markers:', error);
    }
  }, [alerts, alertIndex, mapLoaded]);

  // Auto-zoom to current alert
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !currentAlert) return;

    const coords = currentAlert.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length < 2) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = coords;

      map.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 2000
      });

    } catch (error) {
      console.error('❌ Error zooming to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Non-web platform
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackIcon}>🗺️</Text>
        <Text style={styles.fallbackText}>
          Map view is only available on web
        </Text>
      </View>
    );
  }

  // Loading state
  if (!mapLoaded && !mapError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>🗺️</Text>
        <Text style={styles.loadingText}>
          Loading TomTom Maps...
        </Text>
        <Text style={styles.loadingSubtext}>
          API Key: {TOMTOM_API_KEY ? 'Present' : 'Missing'}
        </Text>
      </View>
    );
  }

  // Error state
  if (mapError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>
          Map Loading Error
        </Text>
        <Text style={styles.errorText}>
          {mapError}
        </Text>
        <Text style={styles.errorSubtext}>
          Check browser console for details
        </Text>
      </View>
    );
  }

  // Map container
  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        id="tomtom-map-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '12px',
          position: 'relative'
        }}
      />
      {mapLoaded && alerts.length > 0 && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {alerts.filter(a => a.coordinates).length} alerts on map
          </Text>
        </View>
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            70% {
              box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
        `
      }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  fallbackIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9CA3AF',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#F3F4F6',
  },
});

export default TomTomTrafficMap;