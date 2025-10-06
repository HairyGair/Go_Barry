/**
 * Control Room Display
 * Large screen display for monitoring active breakdowns in real-time
 *
 * Features:
 * - Auto-scrolling breakdown cards (20-second intervals)
 * - Most affected routes
 * - Real-time stats
 * - Priority alerts
 * - WebSocket live updates
 * - Full-screen optimized
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/api-client';
import useConnectionManager from '../../hooks/useConnectionManager';
import './ControlRoomDisplay.css';

const ControlRoomDisplay = () => {
  const [breakdowns, setBreakdowns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    activeEngineers: 0,
    totalEngineers: 0
  });
  const [affectedRoutes, setAffectedRoutes] = useState([]);
  const [priorityAlerts, setPriorityAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fleetDatabase, setFleetDatabase] = useState({});
  const [currentWeatherIndex, setCurrentWeatherIndex] = useState(0);
  const [weatherData, setWeatherData] = useState(null);

  const scrollIntervalRef = useRef(null);

  // Weather locations to rotate through (using OpenWeather-recognized names)
  const weatherLocations = [
    'Durham,GB',
    'Consett,GB',
    'Washington,GB',
    'Hexham,GB',
    'Newcastle upon Tyne,GB',  // More specific name
    'Gateshead,GB',
    'Sunderland,GB',
    'North Shields,GB',  // Skip Percy Main (too small for API)
    'Tynemouth,GB',
    'Blyth,GB',
    'Cramlington,GB',
    'Middlesbrough,GB',  // Skip Killingworth (too small for API)
    'Bishop Auckland,GB',
    'Peterlee,GB'
  ];

  // WebSocket connection for real-time updates (using public channel, no auth required)
  // No polling fallback since this is a public display without authentication
  const connectionManager = useConnectionManager({
    endpoint: '/ws?channel=control-room',
    autoConnect: true,
    primary: 'websocket',
    fallback: null, // Disable polling fallback for public display
    autoFailover: false // No fallback to polling
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch fleet database on mount
  useEffect(() => {
    const fetchFleetDatabase = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com'}/api/public/fleet`)
          .then(res => res.json());
        if (response.success && response.fleet) {
          setFleetDatabase(response.fleet);
        }
      } catch (error) {
        console.error('Error fetching fleet database:', error);
      }
    };
    fetchFleetDatabase();
  }, []);

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    try {
      const location = weatherLocations[currentWeatherIndex];
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

      // Skip if no API key is configured
      if (!apiKey) {
        console.warn('Weather API key not configured. Set VITE_WEATHER_API_KEY in .env file');
        setWeatherData({
          location: location.split(',')[0],
          temp: '--',
          icon: '01d',
          description: 'API key required'
        });
        return;
      }

      // Using a free weather API - OpenWeatherMap
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`
      ).then(res => res.json());

      if (response.main && response.weather) {
        setWeatherData({
          location: location.split(',')[0],
          temp: Math.round(response.main.temp),
          icon: response.weather[0].icon,
          description: response.weather[0].description
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Set fallback data if API fails
      setWeatherData({
        location: weatherLocations[currentWeatherIndex].split(',')[0],
        temp: '--',
        icon: '01d',
        description: 'Weather unavailable'
      });
    }
  }, [currentWeatherIndex]);

  // Rotate weather location every 20 seconds
  useEffect(() => {
    fetchWeather();
    const weatherTimer = setInterval(() => {
      setCurrentWeatherIndex((prev) => (prev + 1) % weatherLocations.length);
    }, 20000); // 20 seconds
    return () => clearInterval(weatherTimer);
  }, [currentWeatherIndex, fetchWeather]);

  // Get bus type from fleet database
  const getBusType = (fleetNumber) => {
    if (!fleetNumber || !fleetDatabase) return null;
    const vehicle = fleetDatabase[fleetNumber.toString()];
    return vehicle?.busType || null;
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Fetch active breakdowns
  const fetchBreakdowns = useCallback(async () => {
    try {
      // Use public endpoint - no authentication required for Control Room Display
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://breakdown-guide.onrender.com'}/api/public/breakdowns/live`)
        .then(res => res.json());

      if (response.success && Array.isArray(response.breakdowns)) {
        const activeBreakdowns = response.breakdowns
          .sort((a, b) => {
            // Sort by priority: STOP first, then by creation time
            if (a.severity === 'STOP' && b.severity !== 'STOP') return -1;
            if (b.severity === 'STOP' && a.severity !== 'STOP') return 1;
            if (a.is_priority && !b.is_priority) return -1;
            if (b.is_priority && !a.is_priority) return 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });

        setBreakdowns(activeBreakdowns);
        setLastUpdated(new Date());

        // Calculate stats
        const critical = activeBreakdowns.filter(b => b.severity === 'STOP' || b.requires_immediate_action).length;

        // Calculate today's total breakdowns (all breakdowns from today, not just active)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBreakdowns = response.breakdowns.filter(b =>
          new Date(b.created_at) >= today
        ).length;

        setStats({
          total: activeBreakdowns.length,
          critical,
          today: todayBreakdowns
        });

        // Calculate affected routes - properly handle route display
        const routeCounts = {};
        activeBreakdowns.forEach(b => {
          // Try multiple fields for route information
          const route = b.route_id || b.service || b.route_number || b.route ||
                       (b.route_data && b.route_data.route_id) || 'Unknown';
          // Clean up the route display
          const displayRoute = route === 'Unknown' ? 'Unknown' :
                             route.toString().replace(/^route_/, '').toUpperCase();
          routeCounts[displayRoute] = (routeCounts[displayRoute] || 0) + 1;
        });

        const sortedRoutes = Object.entries(routeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([route, count]) => ({ route, count }));

        setAffectedRoutes(sortedRoutes);

        // Extract priority alerts
        const alerts = activeBreakdowns
          .filter(b => b.severity === 'STOP' || b.is_priority)
          .slice(0, 3);

        setPriorityAlerts(alerts);
      }
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchBreakdowns();
    const pollInterval = setInterval(fetchBreakdowns, 30000); // Refresh every 30s
    return () => clearInterval(pollInterval);
  }, [fetchBreakdowns]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'breakdown_created' ||
            data.type === 'breakdown_updated' ||
            data.type === 'breakdowns_updated' ||
            data.type === 'wizard_completed' ||
            data.type === 'assessment_completed') {
          console.log('📡 Control Room received breakdown update:', data.type);
          fetchBreakdowns();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    if (connectionManager.ws) {
      connectionManager.ws.addEventListener('message', handleMessage);
      return () => {
        connectionManager.ws.removeEventListener('message', handleMessage);
      };
    }
  }, [connectionManager.ws, fetchBreakdowns]);

  // Auto-scroll through breakdowns every 20 seconds
  useEffect(() => {
    if (breakdowns.length === 0) return;

    scrollIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % breakdowns.length);
    }, 20000); // 20 seconds

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [breakdowns.length]);

  // Get current breakdown to display
  const currentBreakdown = breakdowns[currentIndex];

  // Get severity badge styling
  const getSeverityBadge = (severity) => {
    const badges = {
      'STOP': { label: 'STOP', class: 'severity-critical' },
      'AMBER': { label: 'AMBER', class: 'severity-high' },
      'CONTINUE': { label: 'CONTINUE', class: 'severity-low' },
      critical: { label: 'CRITICAL', class: 'severity-critical' },
      high: { label: 'HIGH', class: 'severity-high' },
      medium: { label: 'MEDIUM', class: 'severity-medium' },
      low: { label: 'LOW', class: 'severity-low' }
    };
    return badges[severity] || badges[severity?.toLowerCase()] || badges.medium;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'ACTIVE', class: 'status-active' },
      dispatched: { label: 'DISPATCHED', class: 'status-dispatched' },
      on_site: { label: 'ON SITE', class: 'status-onsite' },
      fixing: { label: 'FIXING', class: 'status-fixing' }
    };
    return badges[status?.toLowerCase()] || badges.active;
  };

  return (
    <div className="control-room-display">
      {/* Incognito Home Button */}
      <a href="/" className="home-button" title="Return to App">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </a>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">🔴 ACTIVE NOW</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">📅 TODAY'S TOTAL</span>
          <span className="stat-value">{stats.today}</span>
        </div>
        <div className="stat-item status-icon">
          <span className="stat-label">📅 {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span className="stat-value">{formatTime(currentTime)}</span>
        </div>
        {weatherData && (
          <div className="stat-item weather-icon">
            <span className="stat-label">🌤️ {weatherData.location}</span>
            <span className="stat-value">{weatherData.temp}°C</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="control-room-content">
        {currentBreakdown ? (
          <>
          <div className={`breakdown-card-large ${currentBreakdown.secured_mileage ? 'secured-mileage-card' : ''}`}>
            {/* Service Number - Centered at Top */}
            <div className="card-service-header">
              <span className="service-label">🚌 SERVICE</span>
              <span className="service-number">
                {(() => {
                  const route = currentBreakdown.route_id || currentBreakdown.service ||
                               currentBreakdown.route_number || currentBreakdown.route ||
                               (currentBreakdown.route_data && currentBreakdown.route_data.route_id);
                  if (!route || route === 'Unknown') return 'TBC';
                  const displayRoute = route.toString().replace(/^route_/, '').toUpperCase();
                  return displayRoute;
                })()}
              </span>
            </div>

            {/* Card Header */}
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="fleet-number">
                  {currentBreakdown.fleet_no || currentBreakdown.fleet_number}
                  {(() => {
                    const busType = getBusType(currentBreakdown.fleet_no || currentBreakdown.fleet_number);
                    return busType ? ` (${busType})` : '';
                  })()}
                </h2>
                <div className="card-badges">
                  {currentBreakdown.secured_mileage && (
                    <span className="secured-mileage-badge">
                      🚨 SECURED MILEAGE
                    </span>
                  )}
                  <span className={`severity-badge ${getSeverityBadge(currentBreakdown.severity).class}`}>
                    {getSeverityBadge(currentBreakdown.severity).label}
                  </span>
                  <span className={`status-badge ${getStatusBadge(currentBreakdown.status).class}`}>
                    {getStatusBadge(currentBreakdown.status).label}
                  </span>
                </div>
              </div>
              <div className="card-header-right">
                <div className="breakdown-time">
                  {currentBreakdown.duration_text || getTimeAgo(currentBreakdown.created_at)}
                </div>
                <div className="meta-location">
                  <span className="meta-label">📍 LOCATION</span>
                  <span className="meta-value">
                    {(() => {
                      // API already handles fallback logic, just use the location field
                      const loc = currentBreakdown.location || 'Unknown Location';

                      // Try to extract coordinates for display
                      let coords = null;

                      // Check wizard_assessment_data first
                      if (currentBreakdown.wizard_assessment_data?.location_coords) {
                        coords = currentBreakdown.wizard_assessment_data.location_coords;
                      }
                      // Parse from location string (Ticketer format)
                      else if (loc) {
                        const coordMatch = loc.match(/\(?\s*(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)\s*\)?/);
                        if (coordMatch) {
                          coords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
                        }
                      }

                      // If we have coordinates, show them nicely formatted
                      if (coords && coords.lat && coords.lng) {
                        // For Ticketer format, show just coordinates
                        if (loc.toLowerCase().includes('ticketer')) {
                          return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
                        }
                        // For other locations, append coordinates
                        const cleanLoc = loc.split(/\(/)[0].trim();
                        return `${cleanLoc} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
                      }

                      // No coordinates, show location text as-is
                      return loc.replace(/\s+/g, ' ').trim();
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <div className="info-grid-top">
                <div className="info-item">
                  <div className="info-label">ISSUE</div>
                  <div className="info-value">
                    {(() => {
                      const issueType = currentBreakdown.issue_type || currentBreakdown.issue_category || 'Unknown';
                      const issueDesc = currentBreakdown.issue_description || currentBreakdown.description || '';

                      // Capitalize first letter of each word
                      const capitalize = (str) => {
                        return str.split(' ').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ');
                      };

                      // Don't show "wizard assessment completed" or generic descriptions
                      if (issueDesc && !issueDesc.toLowerCase().includes('wizard') && !issueDesc.toLowerCase().includes('assessment completed')) {
                        return `${capitalize(issueType)} - ${capitalize(issueDesc)}`;
                      }
                      return capitalize(issueType);
                    })()}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-label">SUPERVISOR</div>
                  <div className="info-value">
                    {currentBreakdown.supervisor_name || 'Unknown'}
                  </div>
                </div>
              </div>
              <div className="info-grid-bottom">
                {currentBreakdown.dispatched_at && (
                  <div className="info-item">
                    <div className="info-label">ENGINEER</div>
                    <div className="info-value">{currentBreakdown.engineer_name || 'Dispatched'}</div>
                  </div>
                )}
                {currentBreakdown.on_site_at && (
                  <div className="info-item">
                    <div className="info-label">STATUS</div>
                    <div className="info-value">On Site</div>
                  </div>
                )}
              </div>

              {/* Progress Indicator with Counter */}
              {breakdowns.length > 1 && (
                <div className="progress-section">
                  <div className="progress-counter">
                    Breakdown {currentIndex + 1} of {breakdowns.length}
                  </div>
                  <div className="progress-dots">
                    {breakdowns.map((_, idx) => (
                      <div
                        key={idx}
                        className={`progress-dot ${idx === currentIndex ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Map */}
          <div className="breakdown-map">
            <div className="map-container">
              {(() => {
                // Extract coordinates from breakdown location - check all possible fields
                let lat = currentBreakdown.location_lat ||
                         currentBreakdown.latitude ||
                         currentBreakdown.lat || null;

                let lng = currentBreakdown.location_lng ||
                         currentBreakdown.longitude ||
                         currentBreakdown.lng ||
                         currentBreakdown.lon || null;

                // Parse location_coordinates JSON if available
                if (!lat && !lng && currentBreakdown.location_coordinates) {
                  try {
                    const coords = typeof currentBreakdown.location_coordinates === 'string'
                      ? JSON.parse(currentBreakdown.location_coordinates)
                      : currentBreakdown.location_coordinates;
                    lat = coords.lat || coords.latitude;
                    lng = coords.lng || coords.lon || coords.longitude;
                  } catch (e) {
                    console.warn('Failed to parse location_coordinates:', e);
                  }
                }

                // Extract from wizard_assessment_data.location_coords (wizard completions)
                if (!lat && !lng && currentBreakdown.wizard_assessment_data?.location_coords) {
                  const wizardCoords = currentBreakdown.wizard_assessment_data.location_coords;
                  lat = wizardCoords.lat;
                  lng = wizardCoords.lng;
                }

                // Parse from location string (Ticketer format: "Ticketer Location (55.011578, -1.621315)")
                if (!lat && !lng && currentBreakdown.location) {
                  const coordMatch = currentBreakdown.location.match(/\(?\s*(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)\s*\)?/);
                  if (coordMatch) {
                    lat = parseFloat(coordMatch[1]);
                    lng = parseFloat(coordMatch[2]);
                  }
                }

                // Validate coordinates are valid numbers and within reasonable bounds
                const isValidLat = lat !== null && !isNaN(parseFloat(lat)) &&
                                  parseFloat(lat) >= -90 && parseFloat(lat) <= 90;
                const isValidLng = lng !== null && !isNaN(parseFloat(lng)) &&
                                  parseFloat(lng) >= -180 && parseFloat(lng) <= 180;

                // Only show map if we have valid coordinates
                if (!isValidLat || !isValidLng) {
                  return (
                    <div className="map-error">
                      <div className="map-error-icon">📍</div>
                      <div className="map-error-text">Location Unavailable</div>
                    </div>
                  );
                }

                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

                // Ensure we have API key
                if (!apiKey) {
                  return (
                    <div className="map-error">
                      <div className="map-error-icon">🗺️</div>
                      <div className="map-error-text">Map API Key Missing</div>
                    </div>
                  );
                }

                // Google Maps Static API URL with dark theme (zoom 16 for closer view)
                const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=400x600&markers=color:red%7Clabel:B%7C${lat},${lng}&key=${apiKey}&style=feature:all%7Celement:geometry%7Ccolor:0x1a2332&style=feature:all%7Celement:labels.text.fill%7Ccolor:0xffffff&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0x0a0f1b&style=feature:road%7Celement:geometry%7Ccolor:0x2d3748&style=feature:water%7Celement:geometry%7Ccolor:0x0f172a`;

                return (
                  <img
                    src={mapUrl}
                    alt="Breakdown Location"
                    className="map-image"
                    onError={(e) => {
                      // Log the error for debugging
                      console.error('Google Maps Static API error. URL:', mapUrl);
                      console.error('Check that Static Maps API is enabled in Google Cloud Console');
                      console.error('API Key:', apiKey.substring(0, 10) + '...');

                      // Fallback if map fails to load
                      e.target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'map-error';
                      errorDiv.innerHTML = '<div class="map-error-icon">🗺️</div><div class="map-error-text">Map Load Failed<br/><small>Check API key & Static Maps API</small></div>';
                      e.target.parentElement.appendChild(errorDiv);
                    }}
                    onLoad={() => {
                      console.log('✅ Map loaded successfully for coordinates:', lat, lng);
                    }}
                  />
                );
              })()}
            </div>
          </div>
          </>
        ) : (
          <div className="no-breakdowns">
            <div className="no-breakdowns-icon">✅</div>
            <h2>No Active Breakdowns</h2>
            <p>All systems operational</p>
          </div>
        )}
      </div>

      {/* Most Affected Routes - Only show when there are active breakdowns */}
      {breakdowns.length > 0 && (
        <div className="affected-routes-section">
          <h3 className="section-title">🚌 MOST AFFECTED ROUTES</h3>
          <div className="routes-grid">
            {affectedRoutes.length > 0 ? (
              affectedRoutes.map((route, idx) => (
                <div key={idx} className="route-item">
                  <span className="route-number">{route.route}</span>
                  <span className="route-count">{route.count} breakdown{route.count !== 1 ? 's' : ''}</span>
                </div>
              ))
            ) : (
              <div className="no-routes">No affected routes</div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="control-room-footer">
        <div className="footer-info">
          Breakdown Management System
        </div>
        <div className="footer-refresh">
          Auto-refresh: 30s | Card rotation: 20s
        </div>
      </div>
    </div>
  );
};

export default ControlRoomDisplay;
