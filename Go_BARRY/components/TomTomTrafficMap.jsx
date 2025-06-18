// Go_BARRY/components/TomTomTrafficMap.jsx
// Fixed TomTom Maps SDK implementation with better error handling

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const TomTomTrafficMap = ({ alerts = [], currentAlert = null, alertIndex = 0 }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [containerReady, setContainerReady] = useState(false);

  // Callback ref to ensure container is ready
  const setMapContainerRef = (element) => {
    console.log('🔗 Callback ref called with element:', element);
    mapContainer.current = element;
    if (element) {
      console.log('✅ Container element is available via callback ref');
      console.log('Element details:', {
        tagName: element.tagName,
        id: element.id,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
        offsetParent: element.offsetParent
      });
      setContainerReady(true);
    } else {
      setContainerReady(false);
    }
  };

  // TomTom API key - hardcoded as fallback for production
  const TOMTOM_API_KEY = process.env.EXPO_PUBLIC_TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';

  // North East England center coordinates
  const NE_ENGLAND_CENTER = [-1.6131, 54.9783]; // Newcastle area
  const DEFAULT_ZOOM = 10;

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;

    console.log('🗺️ TomTom Map useLayoutEffect triggered');
    console.log('Container ref at layout time:', mapContainer.current);
    
    // Set basic container properties immediately
    if (mapContainer.current) {
      const container = mapContainer.current;
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '400px';
      container.style.position = 'relative';
      container.style.display = 'block';
      
      console.log('💻 Container styled at layout time:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        display: container.style.display,
        position: container.style.position
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!containerReady) {
      console.log('⌛ Container not ready yet, waiting...');
      return;
    }

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
      const maxRetries = 20; // Increased retries
      
      while (retries < maxRetries) {
        // Check both ref and DOM element
        const containerElement = mapContainer.current;
        if (containerElement && containerElement.offsetParent !== null) {
          console.log(`✅ Container ready after ${retries} retries`);
          console.log('Container element:', containerElement);
          console.log('Container dimensions:', {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight,
            offsetParent: containerElement.offsetParent
          });
          break;
        }
        
        console.log(`⌛ Waiting for container... (attempt ${retries + 1}/${maxRetries})`);
        console.log('Container ref current:', mapContainer.current);
        console.log('Container ref type:', typeof mapContainer.current);
        if (mapContainer.current) {
          console.log('Container dimensions:', {
            width: mapContainer.current.offsetWidth,
            height: mapContainer.current.offsetHeight,
            offsetParent: mapContainer.current.offsetParent
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased wait time
        retries++;
      }
      
      const containerElement = mapContainer.current;
      if (!containerElement || containerElement.offsetParent === null) {
        console.error('❌ Map container not ready after retries');
        console.log('Final container state:', {
          element: containerElement,
          offsetParent: containerElement?.offsetParent,
          dimensions: containerElement ? {
            width: containerElement.offsetWidth,
            height: containerElement.offsetHeight
          } : null
        });
        setMapError('Map container failed to initialize - element not found or not visible');
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
        if (containerElement.offsetWidth === 0 || containerElement.offsetHeight === 0) {
          console.warn('⚠️ Container has zero dimensions, setting minimum size');
          containerElement.style.width = '100%';
          containerElement.style.height = '400px';
          containerElement.style.minHeight = '400px';
          containerElement.style.display = 'block';
          
          // Wait a moment for styles to apply
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Create map with explicit error handling
        try {
          const map = window.tt.map({
            key: TOMTOM_API_KEY,
            container: containerElement,
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

    // Use different timing approach for initialization
    const startInit = () => {
      // Use multiple timing strategies
      const attemptInit = () => {
        if (mapContainer.current && mapContainer.current.offsetParent !== null) {
          initializeMapWithRetry();
        } else {
          console.log('🔄 Container not yet available, scheduling retry...');
          setTimeout(attemptInit, 100);
        }
      };
      
      // Try immediately
      attemptInit();
      
      // Also try with requestAnimationFrame
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            attemptInit();
          });
        });
      }
      
      // Fallback with setTimeout
      setTimeout(attemptInit, 50);
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
  }, [TOMTOM_API_KEY, containerReady]);

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
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        minHeight: 400,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🗺️</div>
          <div style={{ fontSize: 16, color: '#374151' }}>
            Map view is only available on web
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!mapLoaded && !mapError) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        minHeight: 400,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <div style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
            Loading TomTom Maps...
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>
            API Key: {TOMTOM_API_KEY ? 'Present' : 'Missing'}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        minHeight: 400,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: '700', color: '#ef4444', marginBottom: 8 }}>
            Map Loading Error
          </div>
          <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 16 }}>
            {mapError}
          </div>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16
          }}>
            <div style={{ fontSize: 12, fontWeight: '600', marginBottom: 8 }}>Debug Info:</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>API Key: {debugInfo.apiKey}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Platform: {debugInfo.platform}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Container: {debugInfo.containerReady ? 'Ready' : 'Not ready'}</div>
            {debugInfo.error && (
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Error: {debugInfo.error}</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
            Check browser console for detailed errors
          </div>
        </div>
      </div>
    );
  }

  // Map container
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#F3F4F6',
      minHeight: 400,
    }}>
      <div
        ref={setMapContainerRef}
        id="tomtom-map-container"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 16,
          minHeight: 400,
          position: 'relative',
          display: 'block',
          backgroundColor: containerReady ? (mapLoaded ? 'transparent' : '#f0f0f0') : '#ffcccc' // Visual feedback
        }}
      />
      {mapLoaded && alerts.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: '500',
        }}>
          {alerts.filter(a => a.coordinates && a.coordinates.length === 2).length} alerts
        </div>
      )}
    </div>
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
