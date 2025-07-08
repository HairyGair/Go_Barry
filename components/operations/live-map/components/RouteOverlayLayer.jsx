/*
 * RouteOverlayLayer.jsx
 * Phase 3: GTFS Route Visualization - UPDATED with real route shapes
 * 
 * Displays accurate Go North East route overlays using GTFS shapes data
 * Shows precise route geometry from official transit data
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouteShapes } from '../hooks/useRouteShapes';

const RouteOverlayLayer = ({ 
  map, 
  visibleRoutes = [], // Route names that should be displayed
  highlightedRoute = null,
  viewport = null, // For viewport-based loading
  visible = true,
  onRouteClick 
}) => {
  const [routeLayers, setRouteLayers] = useState(new Map());
  const routeLayersRef = useRef(new Map());
  const [loadedShapes, setLoadedShapes] = useState(new Map());

  // GTFS route shapes data
  const {
    routeShapes: allRouteShapes,
    fetchRouteShapes,
    fetchRoutesInBounds,
    getRouteShape,
    loading: shapesLoading,
    error: shapesError
  } = useRouteShapes();

  // Clean up route layers on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && routeLayersRef.current.size > 0) {
        const tomtomMap = map?.getMap();
        if (tomtomMap) {
          routeLayersRef.current.forEach((layerInfo, routeId) => {
            try {
              if (tomtomMap.getLayer(layerInfo.layerId)) {
                tomtomMap.removeLayer(layerInfo.layerId);
              }
              if (tomtomMap.getSource(layerInfo.sourceId)) {
                tomtomMap.removeSource(layerInfo.sourceId);
              }
            } catch (error) {
              console.warn('[RouteOverlay] Error removing route layer:', error);
            }
          });
        }
        routeLayersRef.current.clear();
      }
    };
  }, []);

  // Load route shapes for visible routes
  useEffect(() => {
    if (!visible || visibleRoutes.length === 0 || shapesLoading) {
      return;
    }

    // Check which routes need shape data
    const routesNeedingShapes = visibleRoutes.filter(routeName => 
      !loadedShapes.has(routeName) && !getRouteShape(routeName)
    );

    if (routesNeedingShapes.length > 0) {
      console.log(`[RouteOverlay] Loading shapes for ${routesNeedingShapes.length} routes:`, routesNeedingShapes);
      
      fetchRouteShapes(routesNeedingShapes).then(result => {
        if (result.success && result.routes) {
          const newLoadedShapes = new Map(loadedShapes);
          result.routes.forEach(route => {
            newLoadedShapes.set(route.routeName, route);
          });
          setLoadedShapes(newLoadedShapes);
          console.log(`[RouteOverlay] Loaded ${result.routes.length} route shapes`);
        }
      }).catch(error => {
        console.error('[RouteOverlay] Error loading route shapes:', error);
      });
    }
  }, [visibleRoutes, visible, shapesLoading, loadedShapes, fetchRouteShapes, getRouteShape]);

  // Create or update route layers when data changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !map || !map.getMap || !visible) {
      return;
    }

    const tomtomMap = map.getMap();
    if (!tomtomMap) return;

    // Get route shapes for visible routes
    const routesToDisplay = visibleRoutes
      .map(routeName => {
        // Try to get from loaded shapes first, then from all shapes
        return loadedShapes.get(routeName) || getRouteShape(routeName);
      })
      .filter(route => route && route.coordinates && route.coordinates.length > 1);

    console.log(`[RouteOverlay] Displaying ${routesToDisplay.length}/${visibleRoutes.length} routes with coordinates`);

    // Remove layers for routes no longer visible
    const currentRouteIds = new Set(routesToDisplay.map(route => route.routeName));
    const existingLayerIds = Array.from(routeLayersRef.current.keys());
    
    existingLayerIds.forEach(routeId => {
      if (!currentRouteIds.has(routeId)) {
        removeRouteLayer(tomtomMap, routeId);
      }
    });

    // Add or update layers for current routes
    routesToDisplay.forEach(route => {
      const routeId = route.routeName;
      const existingLayer = routeLayersRef.current.get(routeId);

      if (existingLayer) {
        // Update existing layer styling
        updateRouteLayerStyling(tomtomMap, routeId, route);
      } else {
        // Create new route layer
        createRouteLayer(tomtomMap, route);
      }
    });

  }, [map, visibleRoutes, loadedShapes, allRouteShapes, highlightedRoute, visible, getRouteShape]);

  // Create a route layer using GTFS shapes
  const createRouteLayer = useCallback((tomtomMap, route) => {
    if (!route.coordinates || route.coordinates.length < 2) {
      console.warn('[RouteOverlay] Invalid route coordinates:', route.routeName);
      return;
    }

    const routeId = route.routeName;
    const sourceId = `route-source-${routeId}`;
    const layerId = `route-layer-${routeId}`;

    try {
      // Convert GTFS coordinates [lat, lng] to TomTom format [lng, lat]
      const tomtomCoordinates = route.coordinates.map(([lat, lng]) => [lng, lat]);

      // Add source with GTFS shape data
      tomtomMap.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            routeId: routeId,
            routeName: route.routeName,
            routeType: route.type,
            color: route.color
          },
          geometry: {
            type: 'LineString',
            coordinates: tomtomCoordinates
          }
        }
      });

      // Add route layer with proper styling
      const isHighlighted = highlightedRoute === routeId;
      const routeColor = route.color || getDefaultRouteColor(routeId);
      
      tomtomMap.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': isHighlighted ? '#3b82f6' : routeColor,
          'line-width': isHighlighted ? 6 : 4,
          'line-opacity': isHighlighted ? 0.9 : 0.7
        }
      });

      // Add click handler
      tomtomMap.on('click', layerId, (e) => {
        if (onRouteClick) {
          onRouteClick(route, e);
        }
      });

      // Change cursor on hover
      tomtomMap.on('mouseenter', layerId, () => {
        tomtomMap.getCanvas().style.cursor = 'pointer';
      });

      tomtomMap.on('mouseleave', layerId, () => {
        tomtomMap.getCanvas().style.cursor = '';
      });

      // Store layer info
      routeLayersRef.current.set(routeId, {
        sourceId,
        layerId,
        route
      });

      setRouteLayers(new Map(routeLayersRef.current));

      console.log(`[RouteOverlay] Created GTFS route layer for ${routeId} with ${route.coordinates.length} points`);
    } catch (error) {
      console.error('[RouteOverlay] Error creating route layer:', error);
    }
  }, [highlightedRoute, onRouteClick]);

  // Update route layer styling
  const updateRouteLayerStyling = useCallback((tomtomMap, routeId, route) => {
    const layerInfo = routeLayersRef.current.get(routeId);
    if (!layerInfo) return;

    try {
      const isHighlighted = highlightedRoute === routeId;
      const routeColor = route.color || getDefaultRouteColor(routeId);

      tomtomMap.setPaintProperty(layerInfo.layerId, 'line-color', 
        isHighlighted ? '#3b82f6' : routeColor);
      tomtomMap.setPaintProperty(layerInfo.layerId, 'line-width', 
        isHighlighted ? 6 : 4);
      tomtomMap.setPaintProperty(layerInfo.layerId, 'line-opacity', 
        isHighlighted ? 0.9 : 0.7);
      
      // Ensure visibility
      tomtomMap.setLayoutProperty(layerInfo.layerId, 'visibility', 'visible');
    } catch (error) {
      console.warn('[RouteOverlay] Error updating route layer styling:', error);
    }
  }, [highlightedRoute]);

  // Remove a route layer
  const removeRouteLayer = useCallback((tomtomMap, routeId) => {
    const layerInfo = routeLayersRef.current.get(routeId);
    if (!layerInfo) return;

    try {
      if (tomtomMap.getLayer(layerInfo.layerId)) {
        tomtomMap.removeLayer(layerInfo.layerId);
      }
      if (tomtomMap.getSource(layerInfo.sourceId)) {
        tomtomMap.removeSource(layerInfo.sourceId);
      }
      
      routeLayersRef.current.delete(routeId);
      setRouteLayers(new Map(routeLayersRef.current));
      
      console.log(`[RouteOverlay] Removed route layer for ${routeId}`);
    } catch (error) {
      console.warn('[RouteOverlay] Error removing route layer:', error);
    }
  }, []);

  // Get default color for route (fallback if not in GTFS data)
  const getDefaultRouteColor = useCallback((routeId) => {
    const route = String(routeId).toLowerCase();
    
    // Go North East route color scheme
    if (route.startsWith('x')) {
      return '#e11d48'; // Red for express routes
    } else if (route.startsWith('q')) {
      return '#7c3aed'; // Purple for Quayside routes
    } else if (['21', '22'].includes(route)) {
      return '#dc2626'; // Dark red for Angel routes
    } else if (['1', '2', '3', '4', '5'].includes(route)) {
      return '#059669'; // Green for main city routes
    } else if (route.startsWith('30')) {
      return '#2563eb'; // Blue for 300 series
    } else {
      return '#06b6d4'; // Default cyan
    }
  }, []);

  // Hide all layers when not visible
  useEffect(() => {
    if (Platform.OS !== 'web' || !map || !map.getMap) return;

    const tomtomMap = map.getMap();
    if (!tomtomMap) return;

    routeLayersRef.current.forEach((layerInfo, routeId) => {
      try {
        const visibility = visible ? 'visible' : 'none';
        tomtomMap.setLayoutProperty(layerInfo.layerId, 'visibility', visibility);
      } catch (error) {
        console.warn('[RouteOverlay] Error setting layer visibility:', error);
      }
    });
  }, [visible, map]);

  // Get route statistics
  const getRouteStats = useCallback(() => {
    return {
      totalLayers: routeLayersRef.current.size,
      visibleRoutes: visible ? routeLayersRef.current.size : 0,
      highlightedRoute: highlightedRoute,
      loadedShapes: loadedShapes.size,
      availableShapes: allRouteShapes.length,
      shapesLoading,
      shapesError: !!shapesError
    };
  }, [visible, highlightedRoute, loadedShapes.size, allRouteShapes.length, shapesLoading, shapesError]);

  // Debug logging
  useEffect(() => {
    if (visibleRoutes.length > 0) {
      console.log('[RouteOverlay] Status:', {
        visibleRoutes: visibleRoutes.length,
        loadedShapes: loadedShapes.size,
        activeLayers: routeLayersRef.current.size,
        highlighted: highlightedRoute,
        shapesLoading,
        shapesError: !!shapesError
      });
    }
  }, [visibleRoutes.length, loadedShapes.size, highlightedRoute, shapesLoading, shapesError]);

  // Web-only component
  if (Platform.OS !== 'web') {
    return null;
  }

  return null; // Layers are added directly to the map
};

export default RouteOverlayLayer;
