/*
 * BusLocationLayer.jsx
 * Phase 3: Bus Location Integration
 * 
 * Displays real-time Go North East bus positions on the live map
 * Integrates with UK Bus Data API via backend service
 */

import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

const BusLocationLayer = ({ 
  map, 
  busLocations = [], 
  onBusClick, 
  selectedBusId = null,
  visible = true 
}) => {
  const [busMarkers, setBusMarkers] = useState(new Map());
  const layerRef = useRef(null);

  // Clean up markers on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === 'web' && busMarkers.size > 0) {
        busMarkers.forEach(marker => {
          try {
            marker.remove();
          } catch (error) {
            console.warn('Error removing bus marker:', error);
          }
        });
        setBusMarkers(new Map());
      }
    };
  }, []);

  // Update bus markers when data changes
  useEffect(() => {
    if (Platform.OS !== 'web' || !map || !map.getMap) {
      return;
    }

    const tomtomMap = map.getMap();
    if (!tomtomMap) return;

    // Clear existing markers that are no longer present
    const currentBusIds = new Set(busLocations.map(bus => bus.id || bus.busId));
    const existingMarkerIds = Array.from(busMarkers.keys());
    
    existingMarkerIds.forEach(markerId => {
      if (!currentBusIds.has(markerId)) {
        const marker = busMarkers.get(markerId);
        if (marker) {
          try {
            marker.remove();
            busMarkers.delete(markerId);
          } catch (error) {
            console.warn('Error removing outdated bus marker:', error);
          }
        }
      }
    });

    // Add or update bus markers
    if (visible) {
      busLocations.forEach(bus => {
        const busId = bus.id || bus.busId;
        const existingMarker = busMarkers.get(busId);

        if (existingMarker) {
          // Update existing marker position
          try {
            const coordinates = bus.coordinates;
            if (coordinates && coordinates.length >= 2) {
              existingMarker.setLngLat([coordinates[1], coordinates[0]]);
              
              // Update marker styling based on selection
              const isSelected = selectedBusId === busId;
              updateMarkerStyling(existingMarker, bus, isSelected);
            }
          } catch (error) {
            console.warn('Error updating bus marker position:', error);
          }
        } else {
          // Create new marker
          try {
            const marker = createBusMarker(bus, tomtomMap);
            if (marker) {
              busMarkers.set(busId, marker);
              setBusMarkers(new Map(busMarkers));
            }
          } catch (error) {
            console.warn('Error creating bus marker:', error);
          }
        }
      });
    } else {
      // Hide all markers
      busMarkers.forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error hiding bus marker:', error);
        }
      });
      setBusMarkers(new Map());
    }
  }, [map, busLocations, selectedBusId, visible]);

  // Create a bus marker
  const createBusMarker = (bus, tomtomMap) => {
    const coordinates = bus.coordinates;
    if (!coordinates || coordinates.length < 2) {
      console.warn('Invalid bus coordinates:', bus);
      return null;
    }

    // Create marker element
    const markerElement = createBusMarkerElement(bus);
    
    try {
      // Use TomTom SDK to create marker
      const marker = new window.tt.Marker({ 
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([coordinates[1], coordinates[0]])
        .addTo(tomtomMap);

      // Add click handler
      markerElement.addEventListener('click', () => {
        if (onBusClick) {
          onBusClick(bus);
        }
      });

      return marker;
    } catch (error) {
      console.error('Error creating TomTom bus marker:', error);
      return null;
    }
  };

  // Create the marker DOM element
  const createBusMarkerElement = (bus) => {
    const isSelected = selectedBusId === (bus.id || bus.busId);
    const isDelayed = bus.status === 'delayed';
    const routeName = bus.routeName || bus.lineRef || '?';

    const markerDiv = document.createElement('div');
    markerDiv.className = `bus-marker ${isSelected ? 'selected' : ''} ${isDelayed ? 'delayed' : 'active'}`;
    
    // Apply rotation based on bearing
    const rotation = bus.bearing || 0;
    
    markerDiv.innerHTML = `
      <div class="bus-icon" style="transform: rotate(${rotation}deg);">
        <svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
          <!-- Bus body -->
          <rect x="3" y="8" width="18" height="20" rx="2" 
                fill="${isDelayed ? '#f59e0b' : '#10b981'}" 
                stroke="${isSelected ? '#3b82f6' : '#ffffff'}" 
                stroke-width="${isSelected ? '3' : '2'}"/>
          
          <!-- Bus windows -->
          <rect x="5" y="10" width="4" height="3" fill="#ffffff" rx="1"/>
          <rect x="10" y="10" width="4" height="3" fill="#ffffff" rx="1"/>
          <rect x="15" y="10" width="4" height="3" fill="#ffffff" rx="1"/>
          
          <!-- Bus wheels -->
          <circle cx="7" cy="26" r="2" fill="#374151"/>
          <circle cx="17" cy="26" r="2" fill="#374151"/>
          
          <!-- Direction arrow -->
          <path d="M12 2 L16 8 L8 8 Z" fill="${isDelayed ? '#f59e0b' : '#10b981'}"/>
        </svg>
      </div>
      <div class="bus-label">${routeName}</div>
    `;

    // Add styles
    markerDiv.style.cssText = `
      position: relative;
      cursor: pointer;
      z-index: ${isSelected ? '1000' : '100'};
    `;

    return markerDiv;
  };

  // Update marker styling
  const updateMarkerStyling = (marker, bus, isSelected) => {
    const markerElement = marker.getElement();
    if (!markerElement) return;

    const isDelayed = bus.status === 'delayed';
    
    // Update classes
    markerElement.className = `bus-marker ${isSelected ? 'selected' : ''} ${isDelayed ? 'delayed' : 'active'}`;
    
    // Update z-index
    markerElement.style.zIndex = isSelected ? '1000' : '100';
    
    // Update SVG colors
    const busBody = markerElement.querySelector('rect[x="3"]');
    const arrow = markerElement.querySelector('path');
    
    if (busBody) {
      busBody.setAttribute('fill', isDelayed ? '#f59e0b' : '#10b981');
      busBody.setAttribute('stroke', isSelected ? '#3b82f6' : '#ffffff');
      busBody.setAttribute('stroke-width', isSelected ? '3' : '2');
    }
    
    if (arrow) {
      arrow.setAttribute('fill', isDelayed ? '#f59e0b' : '#10b981');
    }
  };

  // Web-only component
  if (Platform.OS !== 'web') {
    return null;
  }

  return null; // Markers are added directly to the map
};

export default BusLocationLayer;
