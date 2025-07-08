/*
 * Go Barry - Alert Marker Layer
 * Enhanced alert visualization with 3-state design and supervisor badges
 * Phase 4: Performance optimized with MarkerPool and efficient DOM manipulation
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { AlertStateUtils } from '../utils/alertStateManager';
import { liveMapTheme } from '../styles/liveMapStyles';
import { MarkerPool, createDataUpdateManager } from '../utils/performanceOptimizer';

/**
 * AlertMarkerLayer Component
 * Manages alert markers on the map with enhanced state visualization
 */
const AlertMarkerLayer = ({
  map,
  alerts = [],
  selectedAlert = null,
  onAlertClick = () => {},
  visible = true
}) => {
  const markersRef = useRef(new Map());
  const popupsRef = useRef(new Map());
  const markerPoolRef = useRef(null);
  const updateManagerRef = useRef(null);
  
  // Create reusable marker class for efficient DOM reuse
  const createReusableMarker = useCallback((alert) => {
    if (Platform.OS !== 'web' || !window.maplibregl) return null;
    
    const element = document.createElement('div');
    let maplibreMarker = null;
    
    return {
      update(newAlert, isSelected = false) {
        // Update DOM element with new alert data
        const color = AlertStateUtils.getStateColor(newAlert.alertState);
        const size = isSelected ? 28 : 22;
        
        element.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: ${isSelected ? liveMapTheme.zIndex.selectedMarker : liveMapTheme.zIndex.markers};
          ${isSelected && Platform.OS === 'web' ? 'animation: alertPulse 2s infinite;' : ''}
        `;
        
        // Clear previous content
        element.innerHTML = '';
        
        // Add state icon
        const iconElement = document.createElement('div');
        const iconChar = getAlertStateIcon(newAlert.alertState, newAlert.severity);
        iconElement.textContent = iconChar;
        iconElement.style.cssText = `
          color: white;
          font-size: ${Math.round(size * 0.4)}px;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          line-height: 1;
        `;
        element.appendChild(iconElement);
        
        // Add supervisor badge if acknowledged
        if (newAlert.alertState === 'acknowledged' && newAlert.acknowledgedBy) {
          const badge = document.createElement('div');
          const initials = newAlert.acknowledgedBy.substring(0, 2).toUpperCase();
          badge.textContent = initials;
          badge.style.cssText = `
            position: absolute;
            top: -6px;
            right: -6px;
            width: 18px;
            height: 18px;
            background-color: ${liveMapTheme.alertStates.acknowledged};
            color: white;
            border-radius: 50%;
            font-size: 9px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1;
          `;
          element.appendChild(badge);
        }
        
        // Add escalation indicator
        if (newAlert.alertState === 'escalated') {
          const escalationBadge = document.createElement('div');
          escalationBadge.innerHTML = '▲';
          escalationBadge.style.cssText = `
            position: absolute;
            top: -8px;
            left: -8px;
            width: 16px;
            height: 16px;
            background-color: ${liveMapTheme.alertStates.escalated};
            color: white;
            border-radius: 50%;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1;
          `;
          element.appendChild(escalationBadge);
        }
        
        // Update tooltip
        element.title = `${newAlert.title} (${AlertStateUtils.getStateDisplayText(newAlert.alertState)})`;
        
        // Create or update MapLibre marker
        if (maplibreMarker) {
          const [lat, lng] = newAlert.coordinates;
          maplibreMarker.setLngLat([lng, lat]);
        } else {
          const [lat, lng] = newAlert.coordinates;
          maplibreMarker = new window.maplibregl.Marker({ 
            element,
            anchor: 'center'
          }).setLngLat([lng, lat]);
        }
        
        this.currentAlert = newAlert;
      },
      
      addToMap(mapInstance) {
        if (maplibreMarker && mapInstance) {
          maplibreMarker.addTo(mapInstance);
        }
      },
      
      removeFromMap() {
        if (maplibreMarker) {
          maplibreMarker.remove();
        }
      },
      
      reset() {
        element.innerHTML = '';
        element.removeAttribute('style');
        element.removeAttribute('title');
        this.currentAlert = null;
      },
      
      destroy() {
        this.removeFromMap();
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        maplibreMarker = null;
      },
      
      getElement: () => element,
      getMarker: () => maplibreMarker,
      currentAlert: null
    };
  }, [onAlertClick]);
  
  // Initialize performance optimization systems
  useMemo(() => {
    if (Platform.OS === 'web' && !markerPoolRef.current) {
      markerPoolRef.current = new MarkerPool(createReusableMarker, 100);
      updateManagerRef.current = createDataUpdateManager(200); // Batch updates every 200ms
    }
  }, [createReusableMarker]);

  // Create enhanced alert marker element
  const createAlertMarkerElement = useCallback((alert, isSelected = false) => {
    if (Platform.OS !== 'web' || !window.document) return null;

    const element = document.createElement('div');
    const color = AlertStateUtils.getStateColor(alert.alertState);
    const size = isSelected ? 28 : 22;
    
    // Base marker styling
    element.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(0,0,0,0.4);
      transition: all 0.3s ease;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: ${isSelected ? liveMapTheme.zIndex.selectedMarker : liveMapTheme.zIndex.markers};
      ${isSelected && Platform.OS === 'web' ? 'animation: alertPulse 2s infinite;' : ''}
    `;

    // Add pulse animation CSS if not already added (web only)
    if (isSelected && Platform.OS === 'web' && !document.getElementById('alert-pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'alert-pulse-animation';
      style.textContent = `
        @keyframes alertPulse {
          0% { transform: scale(1); box-shadow: 0 3px 12px rgba(0,0,0,0.4); }
          50% { transform: scale(1.15); box-shadow: 0 5px 20px rgba(0,0,0,0.6); }
          100% { transform: scale(1); box-shadow: 0 3px 12px rgba(0,0,0,0.4); }
        }
      `;
      document.head.appendChild(style);
    }

    // Add state icon in center of marker
    const iconElement = document.createElement('div');
    const iconChar = getAlertStateIcon(alert.alertState, alert.severity);
    iconElement.textContent = iconChar;
    iconElement.style.cssText = `
      color: white;
      font-size: ${Math.round(size * 0.4)}px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      line-height: 1;
    `;
    element.appendChild(iconElement);

    // Add supervisor badge for acknowledged alerts
    if (alert.alertState === 'acknowledged' && alert.acknowledgedBy) {
      const badge = document.createElement('div');
      const initials = alert.acknowledgedBy.substring(0, 2).toUpperCase();
      badge.textContent = initials;
      badge.style.cssText = `
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        background-color: ${liveMapTheme.alertStates.acknowledged};
        color: white;
        border-radius: 50%;
        font-size: 9px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 1;
      `;
      element.appendChild(badge);
    }

    // Add escalation indicator for escalated alerts
    if (alert.alertState === 'escalated') {
      const escalationBadge = document.createElement('div');
      escalationBadge.innerHTML = '▲';
      escalationBadge.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        width: 16px;
        height: 16px;
        background-color: ${liveMapTheme.alertStates.escalated};
        color: white;
        border-radius: 50%;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 1;
      `;
      element.appendChild(escalationBadge);
    }

    // Hover effects
    element.addEventListener('mouseenter', () => {
      element.style.transform = isSelected ? 'scale(1.15)' : 'scale(1.3)';
      element.style.zIndex = liveMapTheme.zIndex.selectedMarker;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      element.style.zIndex = isSelected ? liveMapTheme.zIndex.selectedMarker : liveMapTheme.zIndex.markers;
    });

    // Click handler
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      onAlertClick(alert);
    });

    // Add tooltip on hover
    element.title = `${alert.title} (${AlertStateUtils.getStateDisplayText(alert.alertState)})`;

    return element;
  }, [onAlertClick]);

  // Create enhanced popup content
  const createAlertPopup = useCallback((alert) => {
    const affectedRoutesHtml = alert.affectsRoutes && alert.affectsRoutes.length > 0
      ? `<p style="margin: 4px 0; font-size: 11px; color: #ef4444;"><strong>Affects:</strong> Routes ${alert.affectsRoutes.join(', ')}</p>`
      : '';

    const stateColor = AlertStateUtils.getStateColor(alert.alertState);
    const stateText = AlertStateUtils.getStateDisplayText(alert.alertState);
    const timeText = AlertStateUtils.formatTimestamp(alert.timestamp);

    let supervisorInfo = '';
    if (alert.alertState === 'acknowledged' && alert.acknowledgedBy) {
      supervisorInfo = `<p style="margin: 4px 0; font-size: 11px; color: ${liveMapTheme.alertStates.acknowledged};"><strong>Acknowledged by:</strong> ${alert.acknowledgedBy}</p>`;
    } else if (alert.alertState === 'escalated' && alert.escalatedBy) {
      supervisorInfo = `<p style="margin: 4px 0; font-size: 11px; color: ${liveMapTheme.alertStates.escalated};"><strong>Escalated by:</strong> ${alert.escalatedBy}</p>`;
    }

    return `
      <div style="padding: 12px; font-family: system-ui; max-width: 280px; line-height: 1.4;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937; font-weight: 700;">${alert.title}</h3>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${alert.location || 'Location not specified'}</p>
        ${alert.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #374151;">${alert.description}</p>` : ''}
        ${affectedRoutesHtml}
        ${supervisorInfo}
        <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
          <span style="
            background-color: ${stateColor};
            color: white;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: bold;
          ">${stateText.toUpperCase()}</span>
          <span style="
            background-color: #f3f4f6;
            color: #374151;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
          ">${alert.source || 'Unknown'}</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 10px; color: #9ca3af;">
          ${timeText}
        </p>
      </div>
    `;
  }, []);

  // Performance-optimized marker updates using MarkerPool (Phase 4)
  useEffect(() => {
    if (!map || !visible || Platform.OS !== 'web' || !markerPoolRef.current) return;

    const maplibregl = window.maplibregl;
    if (!maplibregl) return;

    // Batch the marker updates for better performance
    updateManagerRef.current.queueUpdate('alerts', () => {
      const pool = markerPoolRef.current;
      const currentIds = new Set(markersRef.current.keys());
      const newIds = new Set(alerts.map(alert => alert.id));

      // Remove obsolete markers (return to pool)
      currentIds.forEach(id => {
        if (!newIds.has(id)) {
          const markerWrapper = markersRef.current.get(id);
          if (markerWrapper) {
            markerWrapper.removeFromMap();
            pool.releaseMarker(id);
            markersRef.current.delete(id);
          }
          
          const popup = popupsRef.current.get(id);
          if (popup) {
            popup.remove();
            popupsRef.current.delete(id);
          }
        }
      });

      // Add or update markers using pool
      alerts.forEach(alert => {
        if (!alert.coordinates || !Array.isArray(alert.coordinates)) return;

        const isSelected = selectedAlert && alert.id === selectedAlert.id;
        let markerWrapper = markersRef.current.get(alert.id);
        
        // Get marker from pool (reuse or create new)
        if (!markerWrapper) {
          markerWrapper = pool.getMarker(alert.id, alert);
          markersRef.current.set(alert.id, markerWrapper);
        }
        
        // Update marker with current alert data
        markerWrapper.update(alert, isSelected);
        markerWrapper.addToMap(map);
        
        // Setup click handler
        const element = markerWrapper.getElement();
        if (element) {
          // Remove existing listeners to prevent duplicates
          element.replaceWith(element.cloneNode(true));
          const newElement = markersRef.current.get(alert.id).getElement();
          
          // Add optimized event handlers
          newElement.addEventListener('click', (e) => {
            e.stopPropagation();
            onAlertClick(alert);
          });
          
          // Add hover effects
          newElement.addEventListener('mouseenter', () => {
            newElement.style.transform = isSelected ? 'scale(1.15)' : 'scale(1.3)';
            newElement.style.zIndex = liveMapTheme.zIndex.selectedMarker;
            
            // Show popup
            let popup = popupsRef.current.get(alert.id);
            if (!popup) {
              popup = new maplibregl.Popup({ 
                offset: 25,
                closeButton: false,
                closeOnClick: false,
                className: 'alert-popup'
              }).setHTML(createAlertPopup(alert));
              popupsRef.current.set(alert.id, popup);
            }
            popup.addTo(map);
          });

          newElement.addEventListener('mouseleave', () => {
            newElement.style.transform = 'scale(1)';
            newElement.style.zIndex = isSelected ? liveMapTheme.zIndex.selectedMarker : liveMapTheme.zIndex.markers;
            
            // Hide popup
            const popup = popupsRef.current.get(alert.id);
            if (popup) {
              popup.remove();
            }
          });
        }

        // Auto-focus selected alert
        if (isSelected) {
          const [lat, lng] = alert.coordinates;
          map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), 15),
            duration: 1000
          });
        }
      });
      
      // Log performance stats
      const poolStats = pool.getStats();
      console.log('[AlertMarkerLayer] Performance stats:', {
        activeMarkers: alerts.length,
        poolSize: poolStats.poolSize,
        poolActive: poolStats.activeCount,
        totalCapacity: poolStats.totalCapacity,
        efficiency: `${Math.round((poolStats.poolSize / poolStats.totalCapacity) * 100)}% pooled`
      });
    });

  }, [map, alerts, selectedAlert, visible, createAlertPopup, onAlertClick]);

  // Cleanup on unmount (Phase 4: Enhanced with pool cleanup)
  useEffect(() => {
    return () => {
      // Release all markers back to pool
      if (markerPoolRef.current) {
        markersRef.current.forEach((markerWrapper, id) => {
          markerWrapper.removeFromMap();
          markerPoolRef.current.releaseMarker(id);
        });
        markerPoolRef.current.releaseAll();
      } else {
        // Fallback cleanup for old markers
        markersRef.current.forEach(marker => {
          if (marker.remove) marker.remove();
        });
      }
      markersRef.current.clear();
      
      // Clean up popups
      popupsRef.current.forEach(popup => {
        if (popup.remove) popup.remove();
      });
      popupsRef.current.clear();
      
      // Clean up update manager
      if (updateManagerRef.current) {
        updateManagerRef.current.clear();
      }
    };
  }, []);

  return null; // This component doesn't render anything directly
};

/**
 * Get appropriate icon character for alert state and severity
 */
const getAlertStateIcon = (state, severity) => {
  switch (state) {
    case 'new':
      return severity === 'critical' ? '⚠' : '!';
    case 'acknowledged':
      return '✓';
    case 'escalated':
      return '▲';
    case 'dismissed':
      return '✗';
    default:
      return '!';
  }
};

export default AlertMarkerLayer;
