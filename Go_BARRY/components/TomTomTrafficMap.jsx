// Go_BARRY/components/TomTomTrafficMap.jsx
// Fixed TomTom Maps SDK implementation with better error handling

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const TomTomTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // TomTom API key - hardcoded as fallback for production
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('🗺️ TomTom Map Debug Info:');
    console.log('API Key:', TOMTOM_API_KEY ? `${TOMTOM_API_KEY.slice(0, 8)}...` : 'MISSING');
    console.log('Container ref:', mapContainer.current ? 'Ready' : 'Not ready');
    console.log('Window object:', typeof window !== 'undefined' ? 'Available' : 'Not available');

    setDebugInfo({
      apiKey: TOMTOM_API_KEY ? 'Present' : 'Missing',
      platform: Platform.OS,
      containerReady: !!mapContainer.current
    });

    // Wait for container to be ready with retry mechanism
    const initializeMapWithRetry = async () => {
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        if (mapContainer.current) {
          console.log(`✅ Container ready after ${retries} retries`);
          break;
        }
        
        console.log(`⌛ Waiting for container... (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!mapContainer.current) {
        console.error('❌ Map container not ready after retries');
        setMapError('Map container failed to initialize - element not found');
        return;
      }

      // Initialize map
      try {
        console.log('🚀 Starting TomTom initialization...');
        
        // Check browser environment
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          throw new Error('Not in browser environment');
        }

        // Load TomTom SDK
        if (!window.tt) {
          console.log('📦 Loading TomTom Maps SDK...');
          
          // Create script element
          const script = document.createElement('script');
          script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js';
          script.async = true;
          
          // Add load handlers
          const loadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('✅ TomTom SDK script loaded');
              resolve();
            };
            script.onerror = (e) => {
              console.error('❌ Failed to load TomTom SDK:', e);
              reject(new Error('Failed to load TomTom Maps SDK script'));
            };
          });
          
          document.head.appendChild(script);
          
          // Wait for script to load with timeout
          await Promise.race([
            loadPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TomTom SDK load timeout')), 15000)
            )
          ]);
        }

        // Load TomTom CSS
        if (!document.querySelector('link[href*="tomtom"]')) {
          console.log('📄 Loading TomTom CSS...');
          const link = document.createElement('link');
          link.href = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        // Verify SDK loaded
        if (!window.tt || !window.tt.map) {
          throw new Error('TomTom SDK not properly loaded - window.tt.map not available');
        }

        console.log('✅ TomTom SDK ready, creating map...');
        console.log('Container element:', mapContainer.current);
        console.log('Container dimensions:', {
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight
        });

        // Ensure container has dimensions
        if (mapContainer.current.offsetWidth === 0 || mapContainer.current.offsetHeight === 0) {
          console.warn('⚠️ Container has zero dimensions, setting minimum size');
          mapContainer.current.style.width = '100%';
          mapContainer.current.style.height = '400px';
          mapContainer.current.style.minHeight = '400px';
        }

        // Create map with explicit error handling
        try {
          const map = window.tt.map({
            key: TOMTOM_API_KEY,
            container: mapContainer.current,
            style: 'https://api.tomtom.com/style/1/style/22.2.1-*?map=basic_main&key=' + TOMTOM_API_KEY,
            center: NE_ENGLAND_CENTER,
            zoom: DEFAULT_ZOOM,
            language: 'en-GB'
          });

          console.log('🗺️ Map instance created successfully');

          // Map event handlers
          map.on('load', () => {
            console.log('✅ Map loaded successfully');
            setMapLoaded(true);
            setMapError(null);
            
            // Try to add traffic layers
            try {
              // Add traffic flow layer
              if (map.showTrafficFlow) {
                map.showTrafficFlow();
                console.log('✅ Traffic flow enabled');
              }
              
              // Add traffic incidents layer
              if (map.showTrafficIncidents) {
                map.showTrafficIncidents();
                console.log('✅ Traffic incidents enabled');
              }
            } catch (trafficError) {
              console.warn('⚠️ Could not enable traffic layers:', trafficError);
            }
          });

          map.on('error', (e) => {
            console.error('❌ Map error event:', e);
            if (e.error && e.error.message) {
              setMapError(`Map error: ${e.error.message}`);
            }
          });

          mapRef.current = map;

        } catch (mapError) {
          console.error('❌ Failed to create map instance:', mapError);
          throw new Error(`Map creation failed: ${mapError.message}`);
        }

      } catch (error) {
        console.error('❌ TomTom initialization error:', error);
        setMapError(`Map initialization failed: ${error.message}`);
        
        // Set debug info
        setDebugInfo(prev => ({
          ...prev,
          error: error.message,
          stack: error.stack
        }));
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const startInit = () => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            initializeMapWithRetry();
          });
        });
      } else {
        setTimeout(initializeMapWithRetry, 100);
      }
    };

    startInit();

    // Cleanup
    return () => {
      if (mapRef.current) {
        console.log('🧹 Cleaning up map...');
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapRef.current = null;
      }
      markersRef.current = [];
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
        .filter(alert => alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length >= 2)
        .forEach((alert, index) => {
          try {
            const isCurrent = index === alertIndex;
            const [lat, lng] = alert.coordinates;
            
            // Create marker element
            const el = document.createElement('div');
            el.style.width = isCurrent ? '30px' : '20px';
            el.style.height = isCurrent ? '30px' : '20px';
            el.style.borderRadius = '50%';
            el.style.border = isCurrent ? '4px solid #1F2937' : '2px solid #FFFFFF';
            el.style.cursor = 'pointer';
            
            // Set color based on severity
            let color = '#10B981';
            if (alert.severity === 'CRITICAL' || alert.severity === 'Critical') color = '#DC2626';
            else if (alert.severity === 'HIGH' || alert.severity === 'High') color = '#EF4444';
            else if (alert.severity === 'MEDIUM' || alert.severity === 'Medium') color = '#F59E0B';
            
            el.style.backgroundColor = color;
            
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
    if (!mapRef.current || !mapLoaded || !currentAlert || !currentAlert.coordinates) return;

    try {
      const map = mapRef.current;
      const [lat, lng] = currentAlert.coordinates;

      map.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2500
      });

    } catch (error) {
      console.error('❌ Error zooming to alert:', error);
    }
  }, [currentAlert, alertIndex, mapLoaded]);

  // Non-web platform
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.unsupportedContainer}>
        <Text style={styles.unsupportedIcon}>🗺️</Text>
        <Text style={styles.unsupportedText}>
          Map view is only available on web
        </Text>
      </View>
    );
  }

  // Loading state
  if (!mapLoaded && !mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>🗺️</Text>
          <Text style={styles.loadingText}>Loading TomTom Maps...</Text>
          <Text style={styles.debugText}>API Key: {TOMTOM_API_KEY ? 'Present' : 'Missing'}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (mapError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Map Loading Error</Text>
          <Text style={styles.errorText}>{mapError}</Text>
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>API Key: {debugInfo.apiKey}</Text>
            <Text style={styles.debugText}>Platform: {debugInfo.platform}</Text>
            <Text style={styles.debugText}>Container: {debugInfo.containerReady ? 'Ready' : 'Not ready'}</Text>
            {debugInfo.error && (
              <Text style={styles.debugText}>Error: {debugInfo.error}</Text>
            )}
          </View>
          <Text style={styles.fallbackText}>
            Check browser console for detailed errors
          </Text>
        </View>
      </View>
    );
  }

  // Map container
  return (
    <View style={styles.container}>
      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 16,
          minHeight: 400
        }}
      />
      {mapLoaded && alerts.length > 0 && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts
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
    minHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
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
    color: '#ef4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  fallbackText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  mapInfo: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapInfoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unsupportedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  unsupportedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
  },
});

export default TomTomTrafficMap;
