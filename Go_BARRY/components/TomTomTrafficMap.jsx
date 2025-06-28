// Go_BARRY/components/TomTomTrafficMap.jsx
// Working TomTom Traffic Map - Fixed container ref issue

import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';

const TomTomTrafficMap = ({ 
  alerts = [], 
  currentAlert = null, 
  alertIndex = 0, 
  showRoadworks = true, 
  showAffectedRoutes = true,
  showClustering = false,
  showRouteOverlays = false,
  overlayRoutes = [],
  onMarkerClick = null,
  style = {}
}) => {
  // Use callback ref to ensure we get the container element
  const [containerElement, setContainerElement] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Starting initialization...');

  const mapContainerCallback = (element) => {
    console.log('🔗 Callback ref called with element:', element);
    if (element) {
      setContainerElement(element);
      setDebugInfo('Container element captured!');
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      platformOS: Platform.OS,
      isWeb: Platform.OS === 'web',
      hasContainer: !!containerElement,
      containerElement: containerElement
    });
    
    setDebugInfo(`Platform: ${Platform.OS}, Container: ${!!containerElement}`);
    
    if (Platform.OS !== 'web') {
      console.log('❌ Not web platform, exiting');
      setDebugInfo('Not web platform');
      return;
    }
    
    if (!containerElement) {
      console.log('❌ No container element, exiting');
      setDebugInfo('No container element - waiting...');
      return;
    }

    // Initialize map when container becomes available
    const initializeMap = async () => {
      try {
        console.log('🗺️ Initializing TomTom map...');
        setDebugInfo('Getting TomTom API key...');
        
        // Get TomTom API key - try environment variable first
        let apiKey = process.env.EXPO_PUBLIC_TOMTOM_API_KEY;
        
        if (!apiKey) {
          // Fallback to backend API
          try {
            const keyResponse = await fetch('https://go-barry.onrender.com/api/config/tomtom-key');
            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              apiKey = keyData.apiKey;
              console.log('✅ Got TomTom API key from backend');
            }
          } catch (keyError) {
            console.warn('⚠️ Backend API key fetch failed');
          }
        } else {
          console.log('✅ Using environment TomTom API key');
        }
        
        // Final fallback
        if (!apiKey) {
          apiKey = '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
          console.log('⚠️ Using hardcoded fallback API key');
        }
        
        if (!apiKey) {
          throw new Error('No TomTom API key available');
        }
        
        console.log('✅ Using API key:', apiKey.substring(0, 8) + '...');
        setDebugInfo('Loading MapLibre GL JS...');
        
        // Load MapLibre GL JS from CDN with CSS
        if (!window.maplibregl) {
          console.log('📦 Loading MapLibre GL JS from CDN...');
          setDebugInfo('Loading map library from CDN...');
          
          try {
            // Load CSS first
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css';
            document.head.appendChild(cssLink);
            
            // Load JS
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js';
              script.onload = () => {
                console.log('✅ MapLibre GL JS loaded from CDN');
                resolve();
              };
              script.onerror = (err) => {
                console.error('❌ Failed to load MapLibre GL JS:', err);
                reject(new Error('Failed to load MapLibre GL JS from CDN'));
              };
              document.body.appendChild(script);
            });
          } catch (loadError) {
            console.error('❌ MapLibre loading failed:', loadError);
            setMapError('Failed to load map library');
            setDebugInfo('Map library load failed');
            return;
          }
        }
        
        const maplibregl = window.maplibregl;
        if (!maplibregl) {
          console.error('❌ MapLibre GL not found on window object');
          setMapError('Map library not available');
          setDebugInfo('MapLibre GL not found after loading');
          return;
        }
        
        console.log('✅ MapLibre GL JS loaded successfully');
        setDebugInfo('Creating TomTom map instance...');
        
        // Build tile URLs with API key
        const baseTileUrl = `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${apiKey}`;
        const trafficTileUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative-delay/{z}/{x}/{y}.png?key=${apiKey}`;
        
        console.log('🔗 Base tile URL template:', baseTileUrl.replace(apiKey, 'API_KEY'));
        
        // Create map with TomTom tiles directly (no backend proxy)
        const map = new maplibregl.Map({
          container: containerElement,
          style: {
            version: 8,
            sources: {
              'tomtom-base': {
                type: 'raster',
                tiles: [baseTileUrl],
                tileSize: 256,
                attribution: '© TomTom'
              }
            },
            layers: [{
              id: 'tomtom-base',
              type: 'raster',
              source: 'tomtom-base'
            }]
          },
          center: [-1.6178, 54.9783], // Newcastle upon Tyne
          zoom: 10
        });

        console.log('✅ Map instance created');
        setDebugInfo('Waiting for map to load...');

        map.on('load', () => {
          console.log('✅ TomTom map loaded successfully');
          setMapLoaded(true);
          setDebugInfo('Adding TomTom traffic layer...');
          
          // Add TomTom traffic layer directly
          try {
            map.addSource('tomtom-traffic', {
              type: 'raster',
              tiles: [trafficTileUrl],
              tileSize: 256
            });
            
            map.addLayer({
              id: 'traffic-flow',
              type: 'raster',
              source: 'tomtom-traffic',
              paint: {
                'raster-opacity': 0.6
              }
            });
            
            console.log('✅ TomTom traffic layer added');
            setDebugInfo('TomTom map with live traffic loaded!');
          } catch (trafficError) {
            console.warn('⚠️ Traffic layer failed:', trafficError);
            setDebugInfo('TomTom map loaded (base tiles only)');
          }
          
          // Add alerts as markers
          addAlerts(map, maplibregl);
          
          // Add roadworks zones if enabled
          if (showRoadworks) {
            addRoadworkZones(map, maplibregl);
          }
          
          // Add route overlays if enabled
          if (showRouteOverlays && overlayRoutes.length > 0) {
            addRouteOverlays(map, maplibregl);
          }
        });

        map.on('error', (error) => {
          console.error('❌ Map error:', error);
          setMapError(error.message);
          setDebugInfo(`Map error: ${error.message}`);
        });

        // Store map reference for cleanup
        containerElement.mapInstance = map;

      } catch (error) {
        console.error('❌ Failed to initialize map:', error);
        setMapError(error.message || 'Unknown error');
        setDebugInfo(`Init error: ${error.message}`);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initializeMap, 100);
    
    return () => {
      clearTimeout(timer);
      if (containerElement?.mapInstance) {
        containerElement.mapInstance.remove();
      }
    };
  }, [containerElement]);

  const addAlerts = (map, maplibregl) => {
    if (!alerts || alerts.length === 0) return;

    console.log(`📍 Adding ${alerts.length} alerts to map`);
    
    // Add clustering support if enabled
    if (showClustering && alerts.length > 10) {
      addClusteredAlerts(map, maplibregl);
      return;
    }
    
    // Add individual markers (existing behavior)
    alerts.forEach((alert, index) => {
      if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

      const [lat, lng] = alert.coordinates;
      const isCurrentAlert = currentAlert && alert.id === currentAlert.id;
      
      // Create marker element with severity-based styling
      const markerElement = document.createElement('div');
      const severityColor = alert.color || getSeverityColor(alert.severity);
      const size = isCurrentAlert ? 20 : 16;
      
      markerElement.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${severityColor};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isCurrentAlert ? 'animation: pulse 2s infinite;' : ''}
        transition: all 0.2s ease;
      `;
      
      // Add hover effect
      markerElement.onmouseover = () => {
        markerElement.style.transform = 'scale(1.2)';
        markerElement.style.zIndex = '1000';
      };
      markerElement.onmouseout = () => {
        markerElement.style.transform = 'scale(1)';
        markerElement.style.zIndex = 'auto';
      };

      // Add CSS animation for current alert
      if (isCurrentAlert && !document.getElementById('marker-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'marker-pulse-style';
        style.textContent = `
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      // Create marker
      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .addTo(map);

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${alert.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${alert.location || 'Location not specified'}</p>
            <span style="
              background-color: ${getSeverityColor(alert.severity)};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${alert.severity || 'UNKNOWN'}</span>
          </div>
        `);

      marker.setPopup(popup);
      
      // Add click handler
      if (onMarkerClick) {
        markerElement.addEventListener('click', () => {
          onMarkerClick(alert);
        });
      }

      // Auto-focus on current alert
      if (isCurrentAlert) {
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 1500
        });
        
        // Auto-open popup after fly animation
        setTimeout(() => {
          popup.addTo(map);
        }, 1600);
      }
    });
  };

  const addClusteredAlerts = (map, maplibregl) => {
    console.log('🌐 Adding clustered alerts to map');
    
    // Convert alerts to GeoJSON features
    const features = alerts
      .filter(alert => alert.coordinates && Array.isArray(alert.coordinates))
      .map((alert, index) => ({
        type: 'Feature',
        properties: {
          id: alert.id,
          title: alert.title,
          location: alert.location,
          severity: alert.severity,
          color: alert.color || getSeverityColor(alert.severity),
          description: alert.description,
          affectedRoutes: JSON.stringify(alert.affectedRoutes || [])
        },
        geometry: {
          type: 'Point',
          coordinates: [alert.coordinates[1], alert.coordinates[0]] // [lng, lat]
        }
      }));

    // Add clustered source
    map.addSource('alerts-clustered', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add clusters layer
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'alerts-clustered',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6', // blue for small clusters
          10, '#f1f075', // yellow for medium
          30, '#f28cb1' // pink for large
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // 20px for small
          10, 25, // 25px for medium
          30, 30 // 30px for large
        ]
      }
    });

    // Add cluster count
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'alerts-clustered',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add unclustered points
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'alerts-clustered',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Click on cluster to zoom
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('alerts-clustered').getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Click on unclustered point
    map.on('click', 'unclustered-point', (e) => {
      const props = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      
      // Call marker click handler if provided
      if (onMarkerClick) {
        const alert = {
          id: props.id,
          title: props.title,
          location: props.location,
          severity: props.severity,
          description: props.description,
          affectedRoutes: JSON.parse(props.affectedRoutes || '[]')
        };
        onMarkerClick(alert);
      }
      
      // Show popup
      const affectedRoutesHtml = props.affectedRoutes && props.affectedRoutes !== '[]'
        ? `<p style="margin: 4px 0; font-size: 11px; color: #ef4444;"><strong>Affects:</strong> Routes ${JSON.parse(props.affectedRoutes).join(', ')}</p>`
        : '';
      
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${props.title}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${props.location || 'Location not specified'}</p>
            ${affectedRoutesHtml}
            <span style="
              background-color: ${props.color};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${props.severity || 'UNKNOWN'}</span>
          </div>
        `)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', 'unclustered-point', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  const addRoadworkZones = (map, maplibregl) => {
    // Filter for StreetManager roadworks with geometry
    const roadworks = alerts.filter(alert => 
      alert.source === 'StreetManager' && 
      alert.metadata?.works_location_coordinates
    );

    if (roadworks.length === 0) return;
    console.log(`🚧 Adding ${roadworks.length} roadwork zones to map`);

    // Create GeoJSON feature collection for roadworks
    const roadworkFeatures = roadworks.map(roadwork => {
      // Parse LINESTRING coordinates if available
      const coords = roadwork.metadata?.parsedCoordinates || [];
      if (coords.length === 0) return null;

      // Convert to GeoJSON LineString format [[lng, lat], ...]
      const lineCoords = coords.map(coord => [coord.lng, coord.lat]);
      
      return {
        type: 'Feature',
        properties: {
          id: roadwork.id,
          title: roadwork.title,
          severity: roadwork.severity || roadwork.mlSeverity || 'medium',
          severityScore: roadwork.metadata?.severityScore || 50,
          workType: roadwork.metadata?.workType,
          trafficManagement: roadwork.metadata?.trafficManagement,
          affectedRoutes: roadwork.metadata?.affectedRouteNames || [],
          impactScore: roadwork.metadata?.impactScore || 0,
          description: roadwork.description
        },
        geometry: {
          type: 'LineString',
          coordinates: lineCoords
        }
      };
    }).filter(f => f !== null);

    if (roadworkFeatures.length === 0) return;

    // Add roadworks source
    map.addSource('streetmanager-roadworks', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: roadworkFeatures
      }
    });

    // Add roadwork line layer with severity-based styling
    map.addLayer({
      id: 'roadwork-lines',
      type: 'line',
      source: 'streetmanager-roadworks',
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['get', 'severityScore'],
          0, 4,
          50, 6,
          100, 10
        ],
        'line-color': [
          'case',
          ['==', ['get', 'severity'], 'critical'], '#dc2626',
          ['==', ['get', 'severity'], 'high'], '#f59e0b',
          ['==', ['get', 'severity'], 'medium'], '#3b82f6',
          '#64748b'
        ],
        'line-opacity': 0.8,
        'line-blur': 1
      }
    });

    // Add buffer zone around roadworks
    map.addLayer({
      id: 'roadwork-buffer',
      type: 'line',
      source: 'streetmanager-roadworks',
      paint: {
        'line-width': 20,
        'line-color': [
          'case',
          ['==', ['get', 'severity'], 'critical'], '#dc2626',
          ['==', ['get', 'severity'], 'high'], '#f59e0b',
          ['==', ['get', 'severity'], 'medium'], '#3b82f6',
          '#64748b'
        ],
        'line-opacity': 0.15,
        'line-blur': 10
      }
    });

    // Add interaction - click on roadwork
    map.on('click', 'roadwork-lines', (e) => {
      const props = e.features[0].properties;
      const coordinates = e.lngLat;
      
      const affectedRoutesHtml = props.affectedRoutes && props.affectedRoutes.length > 0
        ? `<p style="margin: 4px 0; font-size: 11px; color: #ef4444;"><strong>Affects:</strong> Routes ${props.affectedRoutes.join(', ')}</p>`
        : '';
      
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div style="padding: 10px; font-family: system-ui; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">🚧 ${props.title}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">${props.description}</p>
            ${affectedRoutesHtml}
            <div style="margin-top: 8px;">
              <span style="
                background-color: ${getSeverityColor(props.severity)};
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                margin-right: 4px;
              ">${props.severity.toUpperCase()}</span>
              <span style="
                background-color: #3b82f6;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
              ">${props.workType || 'Roadwork'}</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #9ca3af;">
              Impact Score: ${props.impactScore}/100 | ${props.trafficManagement || 'Traffic management'}
            </p>
          </div>
        `)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'roadwork-lines', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'roadwork-lines', () => {
      map.getCanvas().style.cursor = '';
    });

    // Add affected routes overlay if enabled
    if (showAffectedRoutes) {
      addAffectedRoutesOverlay(map, maplibregl, roadworks);
    }
  };

  const addAffectedRoutesOverlay = async (map, maplibregl, roadworks) => {
    try {
      // Get unique affected routes
      const affectedRoutes = new Set();
      roadworks.forEach(rw => {
        const routes = rw.metadata?.affectedRouteNames || rw.affectsRoutes || [];
        routes.forEach(r => affectedRoutes.add(r));
      });

      if (affectedRoutes.size === 0) return;
      console.log(`🚌 Showing ${affectedRoutes.size} affected bus routes`);

      // Fetch route shapes from backend
      const routeShapes = await fetch(`https://go-barry.onrender.com/api/gtfs/route-shapes?routes=${Array.from(affectedRoutes).join(',')}`)
        .then(res => res.json())
        .catch(err => {
          console.warn('Failed to fetch route shapes:', err);
          return { shapes: [] };
        });

      if (!routeShapes.shapes || routeShapes.shapes.length === 0) return;

      // Create GeoJSON for affected routes
      const routeFeatures = routeShapes.shapes.map(shape => ({
        type: 'Feature',
        properties: {
          routeId: shape.routeId,
          routeName: shape.routeName,
          affectedBy: roadworks.filter(rw => 
            (rw.metadata?.affectedRouteNames || rw.affectsRoutes || []).includes(shape.routeName)
          ).length
        },
        geometry: {
          type: 'LineString',
          coordinates: shape.coordinates
        }
      }));

      // Add routes source
      map.addSource('affected-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });

      // Add routes layer (under roadworks)
      map.addLayer({
        id: 'affected-routes-lines',
        type: 'line',
        source: 'affected-routes',
        paint: {
          'line-width': 3,
          'line-color': '#ef4444',
          'line-opacity': 0.4,
          'line-dasharray': [2, 2]
        }
      }, 'roadwork-buffer'); // Add below roadwork layers

    } catch (error) {
      console.error('Failed to add affected routes overlay:', error);
    }
  };

  const addRouteOverlays = async (map, maplibregl) => {
    if (!overlayRoutes || overlayRoutes.length === 0) return;
    
    console.log(`🚌 Adding ${overlayRoutes.length} route overlays to map`);
    
    try {
      // Fetch route shapes from backend
      const response = await fetch(`https://go-barry.onrender.com/api/gtfs/route-shapes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: overlayRoutes })
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch route shapes');
        return;
      }
      
      const data = await response.json();
      if (!data.success || !data.shapes || data.shapes.length === 0) return;
      
      // Create GeoJSON for routes
      const routeFeatures = data.shapes.map(shape => ({
        type: 'Feature',
        properties: {
          routeId: shape.routeId,
          routeName: shape.routeName
        },
        geometry: {
          type: 'LineString',
          coordinates: shape.coordinates
        }
      }));
      
      // Add routes source
      map.addSource('overlay-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });
      
      // Add routes layer with distinct styling
      map.addLayer({
        id: 'overlay-routes-outline',
        type: 'line',
        source: 'overlay-routes',
        paint: {
          'line-width': 6,
          'line-color': '#FFFFFF',
          'line-opacity': 0.8
        }
      });
      
      map.addLayer({
        id: 'overlay-routes-line',
        type: 'line',
        source: 'overlay-routes',
        paint: {
          'line-width': 4,
          'line-color': '#7C3AED',
          'line-opacity': 0.8
        }
      });
      
      // Add route labels
      map.addLayer({
        id: 'overlay-routes-labels',
        type: 'symbol',
        source: 'overlay-routes',
        layout: {
          'text-field': ['get', 'routeName'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': '#7C3AED',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2
        }
      });
      
      console.log(`✅ Added ${routeFeatures.length} route overlays`);
      
    } catch (error) {
      console.error('Failed to add route overlays:', error);
    }
  };

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

  // Mobile fallback
  if (Platform.OS !== 'web') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a3e',
        minHeight: 400
      }}>
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>
          🗺️ Map view available on web only
        </Text>
      </View>
    );
  }

  // Web platform - always render container, show overlays as needed
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', ...style }}>
      {/* Map container - always rendered */}
      <div
        ref={mapContainerCallback}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px',
          position: 'relative',
          backgroundColor: '#1a1a3e'
        }}
      />
      
      {/* Loading overlay */}
      {!mapLoaded && !mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 26, 62, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '8px' }}>
            🗺️ Loading map...
          </div>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>
            Newcastle Traffic Intelligence
          </div>
          <div style={{ color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>
            Debug: {debugInfo}
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {mapError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(127, 29, 29, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          <div style={{ color: '#fca5a5', fontSize: '16px', marginBottom: '8px' }}>
            ❌ Map error: {mapError}
          </div>
          <div style={{ color: '#f87171', fontSize: '12px' }}>
            Falling back to alert list view
          </div>
        </div>
      )}
    </div>
  );
};

export default TomTomTrafficMap;
