/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

/**
 * Engineering Display - Yardman's Office Display
 * Large screen display for engineering staff to monitor active breakdowns
 *
 * Features:
 * - Large card grid layout (3-4 cards per row)
 * - Real-time WebSocket updates
 * - Auto-refresh every 30 seconds
 * - Color-coded severity indicators (STOP/AMBER/CONTINUE)
 * - Time elapsed auto-updating
 * - Remote control via WebSocket (highlight, filter)
 * - URL parameters for depot filtering
 * - Auto-hide cursor after inactivity
 * - Dark theme for always-on displays
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/api-client';
import websocketService from '../../services/websocket';
import GairWareLogo from '../../components/GairWareLogo';
import './EngineeringDisplay.css';

const EngineeringDisplay = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [highlightedBreakdownId, setHighlightedBreakdownId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, in-progress, resolved
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [currentTime, setCurrentTime] = useState(new Date());
  const cursorTimerRef = useRef(null);
  const [locationCache, setLocationCache] = useState({}); // Cache geocoded addresses

  // Get URL parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      depot: params.get('depot') || null,
      displayId: params.get('displayId') || 'engineering-display-1'
    };
  };

  const { depot: depotFilter, displayId } = getUrlParams();

  // Depot coordinates - VERIFIED from OpenStreetMap (December 2025)
  const DEPOT_COORDINATES = {
    'Washington': { lat: 54.9068, lng: -1.5140, name: 'Washington Depot' },
    'Riverside': { lat: 54.9586, lng: -1.6579, name: 'Riverside Depot' },
    'Consett': { lat: 54.8403, lng: -1.8380, name: 'Consett Depot' },
    'Deptford': { lat: 54.9142, lng: -1.3976, name: 'Deptford Depot' },
    'Percy Main': { lat: 55.0041, lng: -1.4774, name: 'Percy Main Depot' },
    'Hexham': { lat: 54.9756, lng: -2.0960, name: 'Hexham Depot' }
  };

  // Auto-hide cursor after 5 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      document.body.style.cursor = 'default';

      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }

      cursorTimerRef.current = setTimeout(() => {
        document.body.style.cursor = 'none';
      }, 5000);
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Initial hide after 5 seconds
    cursorTimerRef.current = setTimeout(() => {
      document.body.style.cursor = 'none';
    }, 5000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (cursorTimerRef.current) {
        clearTimeout(cursorTimerRef.current);
      }
      document.body.style.cursor = 'default';
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate time elapsed since reported
  const getTimeElapsed = useCallback((createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  }, []);

  // Format location - extract readable address or convert coordinates
  const formatLocation = useCallback((breakdown) => {
    const location = breakdown.location || breakdown.location_description;

    if (!location) return 'Location Not Recorded';

    // Check if it's "Ticketer Location (lat, lng)" format
    const coordMatch = location.match(/Ticketer Location \(([^,]+),\s*([^)]+)\)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      const cacheKey = `${lat},${lng}`;

      // Check cache first
      if (locationCache[cacheKey]) {
        return locationCache[cacheKey];
      }

      // Trigger reverse geocoding (async, will update cache)
      reverseGeocode(lat, lng, cacheKey);

      // Return formatted coordinates while loading
      return `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }

    // Return location as-is if it's already a readable address
    return location;
  }, [locationCache]);

  // Reverse geocode coordinates to street address using Google API
  const reverseGeocode = async (lat, lng, cacheKey) => {
    try {
      // Use Google Geocoding API directly (frontend key is already exposed in browser)
      const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

      if (!GOOGLE_API_KEY) {
        console.error('Google Maps API key not configured');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components;

          // Extract street, city, and postcode
          const street = addressComponents.find(c => c.types.includes('route'))?.long_name || '';
          const streetNumber = addressComponents.find(c => c.types.includes('street_number'))?.long_name || '';
          const city = addressComponents.find(c => c.types.includes('postal_town') || c.types.includes('locality'))?.long_name || '';
          const postcode = addressComponents.find(c => c.types.includes('postal_code'))?.long_name || '';

          // Format: "123 Street Name, City, Postcode"
          const parts = [];
          if (streetNumber && street) {
            parts.push(`${streetNumber} ${street}`);
          } else if (street) {
            parts.push(street);
          }
          if (city) parts.push(city);
          if (postcode) parts.push(postcode);

          const formattedAddress = parts.length > 0 ? parts.join(', ') : result.formatted_address;

          // Update cache
          setLocationCache(prev => ({
            ...prev,
            [cacheKey]: formattedAddress
          }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Silently fail - GPS coordinates will remain visible
    }
  };

  // Capitalize first letter of each word
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Extract coordinates from location string
  const extractCoordinates = (breakdown) => {
    const location = breakdown.location || breakdown.location_description;

    if (!location) return null;

    // Check if it's "Ticketer Location (lat, lng)" format
    const coordMatch = location.match(/Ticketer Location \(([^,]+),\s*([^)]+)\)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      };
    }

    // Check if breakdown has separate lat/lng fields
    if (breakdown.location_lat && breakdown.location_lng) {
      return {
        lat: parseFloat(breakdown.location_lat),
        lng: parseFloat(breakdown.location_lng)
      };
    }

    return null;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get distance from depot to breakdown
  const getDistanceFromDepot = (breakdown) => {
    const coords = extractCoordinates(breakdown);
    if (!coords || !depotFilter || !DEPOT_COORDINATES[depotFilter]) return null;

    const depotCoords = DEPOT_COORDINATES[depotFilter];
    const distance = calculateDistance(
      depotCoords.lat,
      depotCoords.lng,
      coords.lat,
      coords.lng
    );

    return distance;
  };

  // Calculate estimated travel time (assuming 30 mph average in city)
  const getEstimatedTravelTime = (distance) => {
    if (!distance) return null;
    const avgSpeedMph = 30;
    const timeHours = distance / avgSpeedMph;
    const timeMinutes = Math.ceil(timeHours * 60);
    return timeMinutes;
  };

  // Check if breakdown is urgent (>60 minutes old)
  const isUrgent = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins >= 60;
  };

  // Fetch breakdowns from API
  const fetchBreakdowns = useCallback(async () => {
    try {
      // FIXED: Use public endpoint (no authentication required for engineering displays)
      const endpoint = depotFilter
        ? `/api/public/breakdowns?depot=${encodeURIComponent(depotFilter)}`
        : '/api/public/breakdowns';

      const response = await apiClient.get(endpoint);

      if (response.success && Array.isArray(response.breakdowns)) {
        // Filter by status based on filterStatus
        let filtered = response.breakdowns;

        // Always exclude resolved and cleared breakdowns by default (unless explicitly showing resolved)
        if (filterStatus !== 'resolved') {
          filtered = filtered.filter(b =>
            b.status !== 'resolved' && b.status !== 'cleared'
          );
        }

        if (filterStatus === 'pending') {
          filtered = filtered.filter(b =>
            b.status === 'pending' || b.status === 'active'
          );
        } else if (filterStatus === 'in-progress') {
          filtered = filtered.filter(b =>
            b.status === 'dispatched' || b.status === 'on_site' || b.status === 'fixing'
          );
        } else if (filterStatus === 'resolved') {
          // Only show resolved from last 30 minutes
          const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
          filtered = filtered.filter(b =>
            b.status === 'resolved' && new Date(b.resolved_at) > thirtyMinsAgo
          );
        }

        // Sort by severity (STOP first) and creation time
        filtered.sort((a, b) => {
          const severityOrder = { 'STOP': 0, 'AMBER': 1, 'CONTINUE': 2 };
          const aSeverity = severityOrder[a.severity] ?? 999;
          const bSeverity = severityOrder[b.severity] ?? 999;

          if (aSeverity !== bSeverity) return aSeverity - bSeverity;
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setBreakdowns(filtered);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
    }
  }, [depotFilter, filterStatus]);

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    fetchBreakdowns();
    const refreshInterval = setInterval(fetchBreakdowns, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchBreakdowns]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    // FIXED: Pass depot parameter to WebSocket for depot-filtered initial data
    const wsEndpoint = depotFilter
      ? `/ws?channel=engineering-display&displayId=${displayId}&depot=${encodeURIComponent(depotFilter)}`
      : `/ws?channel=engineering-display&displayId=${displayId}`;

    websocketService.connect(wsEndpoint, {
      onMessage: (data) => {
        console.log('Engineering Display received WebSocket message:', data);

        // Handle different event types
        switch (data.type) {
          case 'initial_data':
            // ADDED: Handle initial depot-filtered breakdown data from WebSocket
            console.log(`Received initial data for depot: ${data.depot}`, data);
            if (data.breakdowns && Array.isArray(data.breakdowns)) {
              // Filter and sort the data same as fetchBreakdowns
              let filtered = data.breakdowns;

              // Always exclude resolved and cleared breakdowns by default
              if (filterStatus !== 'resolved') {
                filtered = filtered.filter(b =>
                  b.status !== 'resolved' && b.status !== 'cleared'
                );
              }

              if (filterStatus === 'pending') {
                filtered = filtered.filter(b =>
                  b.status === 'pending' || b.status === 'active'
                );
              } else if (filterStatus === 'in-progress') {
                filtered = filtered.filter(b =>
                  b.status === 'dispatched' || b.status === 'on_site' || b.status === 'fixing'
                );
              } else if (filterStatus === 'resolved') {
                const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
                filtered = filtered.filter(b =>
                  b.status === 'resolved' && new Date(b.resolved_at) > thirtyMinsAgo
                );
              }

              // Sort by severity and creation time
              filtered.sort((a, b) => {
                const severityOrder = { 'STOP': 0, 'AMBER': 1, 'CONTINUE': 2 };
                const aSeverity = severityOrder[a.severity] ?? 999;
                const bSeverity = severityOrder[b.severity] ?? 999;

                if (aSeverity !== bSeverity) return aSeverity - bSeverity;
                return new Date(b.created_at) - new Date(a.created_at);
              });

              setBreakdowns(filtered);
              setLastUpdated(new Date());
            }
            break;

          case 'breakdown_created':
          case 'breakdown_updated':
          case 'breakdowns_updated':
          case 'engineer_assigned':
          case 'engineering_dispatched':
            // Refresh breakdown data
            fetchBreakdowns();
            break;

          case 'highlight_breakdown':
            // Remote control: highlight specific breakdown
            if (data.breakdown_id) {
              setHighlightedBreakdownId(data.breakdown_id);
              // Auto-remove highlight after 10 seconds
              setTimeout(() => {
                setHighlightedBreakdownId(null);
              }, 10000);
            }
            break;

          case 'set_filter':
            // Remote control: change filter
            if (data.filter) {
              setFilterStatus(data.filter);
            }
            break;

          default:
            break;
        }
      },
      onOpen: () => {
        console.log('Engineering Display WebSocket connected');
        setConnectionStatus('connected');
      },
      onClose: () => {
        console.log('Engineering Display WebSocket disconnected');
        setConnectionStatus('disconnected');
      },
      onError: (error) => {
        console.error('Engineering Display WebSocket error:', error);
        setConnectionStatus('error');
      },
      autoReconnect: true,
      heartbeat: true,
      requireAuth: false // Public display, no auth required
    });

    return () => {
      websocketService.disconnect(wsEndpoint);
    };
  }, [displayId, depotFilter, fetchBreakdowns, filterStatus]);

  // Get severity styling
  const getSeverityClass = (severity) => {
    const classes = {
      'STOP': 'severity-stop',
      'AMBER': 'severity-amber',
      'CONTINUE': 'severity-continue'
    };
    return classes[severity] || 'severity-unknown';
  };

  // Get status label
  const getStatusLabel = (breakdown) => {
    if (breakdown.status === 'resolved') return 'Resolved';
    if (breakdown.status === 'on_site') return 'On Site';
    if (breakdown.status === 'dispatched') return 'Dispatched';
    if (breakdown.status === 'fixing') return 'Being Fixed';
    if (breakdown.engineer_name) return `Assigned: ${breakdown.engineer_name}`;
    return 'Awaiting Dispatch';
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="engineering-display">
      {/* Header */}
      <div className="engineering-header">
        <div className="header-left">
          <h1 className="header-title">
            Engineering Dashboard
            {depotFilter && <span className="depot-filter"> - {depotFilter}</span>}
          </h1>
          <div className="header-subtitle">
            {breakdowns.length} Active Breakdown{breakdowns.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="header-center">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>

        <div className="header-right">
          <div className="connection-indicator">
            <div className={`connection-dot ${connectionStatus}`}></div>
            <span className="connection-label">
              {connectionStatus === 'connected' ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
          <div className="last-updated">
            Updated: {formatTime(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Breakdown Cards Grid */}
      <div className="breakdowns-grid">
        {breakdowns.length === 0 ? (
          <div className="no-breakdowns">
            <div className="no-breakdowns-icon">✓</div>
            <div className="no-breakdowns-title">No Active Breakdowns</div>
            <div className="no-breakdowns-subtitle">All systems operational</div>
          </div>
        ) : (
          breakdowns.map((breakdown) => (
            <div
              key={breakdown.id || breakdown.breakdown_id}
              className={`breakdown-card ${getSeverityClass(breakdown.severity)} ${
                highlightedBreakdownId === (breakdown.id || breakdown.breakdown_id) ? 'highlighted' : ''
              } ${breakdown.status === 'resolved' ? 'resolved' : ''}`}
            >
              {/* LEFT COLUMN: Info */}
              <div className="card-info-column">
                {/* Card Header */}
                <div className="card-header">
                  <div className="fleet-number">
                    Fleet {breakdown.fleet_no || breakdown.fleet_number || 'Unknown'}
                  </div>
                  <div className={`severity-badge ${getSeverityClass(breakdown.severity)}`}>
                    {breakdown.severity || 'UNKNOWN'}
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body">
                <div className="card-row">
                  <div className="card-label">Location:</div>
                  <div className="card-value location-value">
                    {formatLocation(breakdown)}
                  </div>
                </div>

                <div className="card-row">
                  <div className="card-label">Issue:</div>
                  <div className="card-value issue-value">
                    {toTitleCase(breakdown.issue_category || breakdown.issue_type || 'Unknown')}
                    {breakdown.issue_description && (
                      <div className="issue-description">
                        {breakdown.issue_description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-row">
                  <div className="card-label">Time Elapsed:</div>
                  <div className="card-value time-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isUrgent(breakdown.created_at) && <span style={{ fontSize: '32px' }}>🚨</span>}
                    {getTimeElapsed(breakdown.created_at)}
                  </div>
                </div>

                {/* Distance and Travel Time from Depot */}
                {(() => {
                  const distance = getDistanceFromDepot(breakdown);
                  const travelTime = getEstimatedTravelTime(distance);

                  if (distance && travelTime) {
                    return (
                      <div className="card-row">
                        <div className="card-label">Distance from Depot:</div>
                        <div className="card-value" style={{ color: '#60a5fa' }}>
                          {distance.toFixed(1)} miles • {travelTime} min drive
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {breakdown.engineer_name && (
                  <div className="card-row engineer-row">
                    <div className="card-label">Engineer:</div>
                    <div className="card-value engineer-value">
                      👷 {breakdown.engineer_name}
                    </div>
                  </div>
                )}

                <div className="card-row status-row">
                  <div className={`status-label ${getStatusLabel(breakdown) === 'Awaiting Dispatch' ? 'awaiting-dispatch' : ''}`}>
                    {getStatusLabel(breakdown)}
                  </div>
                </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Map */}
              <div className="card-map-column">
                {(() => {
                  const coords = extractCoordinates(breakdown);

                  if (!coords || !coords.lat || !coords.lng) {
                    return (
                      <div className="card-map-error">
                        <div className="map-error-icon">📍</div>
                        <div className="map-error-text">No Location Data</div>
                      </div>
                    );
                  }

                  const { lat, lng } = coords;
                  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

                  if (!GOOGLE_API_KEY) {
                    return (
                      <div className="card-map-error">
                        <div className="map-error-icon">🗺️</div>
                        <div className="map-error-text">Map API Key Missing</div>
                      </div>
                    );
                  }

                  // Add depot marker if we have depot coordinates
                  const depotCoords = depotFilter ? DEPOT_COORDINATES[depotFilter] : null;
                  const depotMarker = depotCoords ? `&markers=color:blue%7Clabel:D%7C${depotCoords.lat},${depotCoords.lng}` : '';

                  // Google Maps Static API URL - Compact to fit everything on screen
                  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=700x300&markers=size:mid%7Ccolor:red%7Clabel:B%7C${lat},${lng}${depotMarker}&key=${GOOGLE_API_KEY}&style=feature:all%7Celement:geometry%7Ccolor:0x1a2332&style=feature:all%7Celement:labels.text.fill%7Ccolor:0xffffff&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x0a0f1b&style=feature:road%7Celement:geometry%7Ccolor:0x2d3748&style=feature:water%7Celement:geometry%7Ccolor:0x0f172a`;

                  return (
                    <div className="card-map">
                      <img
                        src={mapUrl}
                        alt="Breakdown Location Map"
                        className="map-image"
                        onError={(e) => {
                          console.error('Map load error for:', lat, lng);
                          e.target.style.display = 'none';
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'card-map-error';
                          errorDiv.innerHTML = '<div class="map-error-icon">🗺️</div><div class="map-error-text">Map Unavailable</div>';
                          e.target.parentElement.appendChild(errorDiv);
                        }}
                        onLoad={() => {
                          console.log('✅ Map loaded for breakdown:', breakdown.breakdown_id);
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="engineering-footer">
        <div className="footer-info">
          <div className="footer-left">
            Display ID: {displayId} | Auto-refresh: 30s
          </div>
          <div className="footer-watermark">
            <GairWareLogo size={16} variant="minimal" color="rgba(255,255,255,0.15)" />
            <span className="watermark-text">GairWare</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineeringDisplay;
