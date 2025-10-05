import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './LiveActivityFeed.css';
import { activityRealtimeService, ACTIVITY_EVENTS } from '../services/activityRealtimeService.js';
import routeHelpers from '../data/routes.js';
import storageService from '../services/storageService.js';
import locationService from '../utils/locationService.js';
import googleLocationService from '../utils/googleLocationService.js';

const STORAGE_KEY = 'gobarry_activity_feed_cache';

const LiveActivityFeed = ({ isOpen = true, onClose, embedded = false, activities: propActivities = [] }) => {
  // Only cache in standalone mode, not embedded
  const shouldCache = !embedded;

  // Use ref to track if we've initialized to prevent re-renders
  const hasInitializedRef = useRef(false);
  const prevActivitiesRef = useRef(propActivities);
  const subscriptionIdRef = useRef(null);

  // State management
  const [activities, setActivities] = useState(propActivities);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [realTimeActivities, setRealTimeActivities] = useState([]);
  const [locationCache, setLocationCache] = useState(new Map());

  // Handle new real-time activities
  const handleRealTimeActivity = useCallback((activityEvent) => {
    console.log('📡 Received real-time activity:', activityEvent);

    const { activity, eventType } = activityEvent;

    if (eventType === 'INSERT') {
      setRealTimeActivities(prev => {
        // Add new activity to the beginning
        const updated = [activity, ...prev.filter(a => a.id !== activity.id)];
        // Keep only the most recent 50 activities for performance
        return updated.slice(0, 50);
      });

      setLastUpdateTime(new Date().toISOString());

      // Update cache if in standalone mode
      if (shouldCache) {
        try {
          const cachedData = {
            activities: [activity],
            timestamp: Date.now(),
            source: 'realtime'
          };
          localStorage.setItem(STORAGE_KEY + '_realtime', JSON.stringify(cachedData));
        } catch (error) {
          // Silently fail
        }
      }
    }
  }, [shouldCache]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((event) => {
    setIsRealTimeConnected(event.connected);
    console.log(`📡 Real-time connection ${event.connected ? 'established' : 'lost'}`);
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    if (!embedded) return; // Only use real-time for embedded feeds

    console.log('📡 Setting up real-time activity subscription...');

    // Subscribe to real-time activities
    const subscriptionId = activityRealtimeService.subscribeToActivities(
      handleRealTimeActivity,
      {
        filter: {}, // No filter, get all activities
        bufferUpdates: true,
        includeExisting: false // Don't fetch existing, use props for that
      }
    );

    subscriptionIdRef.current = subscriptionId;

    // Set up event listeners
    activityRealtimeService.on(ACTIVITY_EVENTS.CONNECTION_CHANGED, handleConnectionChange);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up real-time activity subscription');
      if (subscriptionIdRef.current) {
        activityRealtimeService.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      activityRealtimeService.off(ACTIVITY_EVENTS.CONNECTION_CHANGED, handleConnectionChange);
    };
  }, [embedded, handleRealTimeActivity, handleConnectionChange]);

  // Update activities when props change (fallback polling data)
  useEffect(() => {
    // Deep comparison to prevent unnecessary updates
    const activitiesChanged = JSON.stringify(prevActivitiesRef.current) !== JSON.stringify(propActivities);

    if (activitiesChanged || !hasInitializedRef.current) {
      setActivities(propActivities);
      prevActivitiesRef.current = propActivities;
      hasInitializedRef.current = true;

      // Only cache if in standalone mode
      if (shouldCache && propActivities.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activities: propActivities,
            timestamp: Date.now(),
            source: 'polling'
          }));
        } catch (error) {
          // Silently fail
        }
      }
    }
  }, [propActivities, shouldCache]);

  // Memoize the combined activities (real-time + polling fallback)
  const combinedActivities = useMemo(() => {
    // Combine real-time activities with polling activities, avoiding duplicates
    const realTimeIds = new Set(realTimeActivities.map(a => a.id));
    const pollingActivities = activities.filter(a => !realTimeIds.has(a.id));

    // Merge and sort by timestamp
    const merged = [...realTimeActivities, ...pollingActivities]
      .sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at))
      .slice(0, 25); // Limit to 25 most recent

    return merged;
  }, [realTimeActivities, activities]);

  // Helper function to enrich activities with route information
  const enrichActivityWithRouteData = useCallback((activity) => {
    // Extract route number from activity message or data
    let routeNumber = null;

    // Try to extract route from various fields
    if (activity.route_number) {
      routeNumber = activity.route_number;
    } else if (activity.data?.route) {
      routeNumber = activity.data.route;
    } else if (activity.message) {
      // Extract route number from message using regex
      const routeMatch = activity.message.match(/(?:Route|route|Bus)\s+([A-Z0-9]+)/i);
      if (routeMatch) {
        routeNumber = routeMatch[1];
      }
    }

    if (routeNumber) {
      // Get route information from GTFS data
      const routeInfo = routeHelpers.findByShortName(routeNumber);
      if (routeInfo && routeInfo.length > 0) {
        const route = routeInfo[0];

        // Track route usage
        storageService.trackRouteUsage(routeNumber, 'activity_feed');

        return {
          ...activity,
          enrichedRoute: {
            shortName: route.routeShortName,
            displayName: route.displayName,
            agency: route.agency,
            category: route.category,
            depot: route.depot,
            color: `#${route.routeColor}`,
            textColor: `#${route.routeTextColor}`,
            isExpress: route.isExpress
          }
        };
      }
    }

    return activity;
  }, []);

  // Group related activities by bus number and time proximity
  const groupActivities = useCallback((activityList) => {
    const groups = [];
    let currentGroup = null;

    activityList.forEach(activity => {
      const busNumber = activity.busNumber || activity.fleet_no || activity.vehicle ||
        (activity.message && activity.message.match(/(?:vehicle|bus|fleet)\s+(\w+)/i)?.[1]);

      if (activity.action === 'started' || activity.type === 'wizard_started') {
        currentGroup = {
          id: `group-${busNumber || activity.id}-${activity.timestamp}`,
          busNumber: busNumber,
          startTime: activity.timestamp,
          events: [activity],
          isActive: true
        };
        groups.push(currentGroup);
      } else if (currentGroup && currentGroup.busNumber === busNumber && currentGroup.isActive) {
        currentGroup.events.push(activity);
        // Mark group as completed if this is a completion event
        if (activity.action === 'completed' || activity.type === 'wizard_completed') {
          currentGroup.isActive = false;
        }
      } else {
        // Create single-event group
        groups.push({
          id: activity.id || `single-${Date.now()}-${Math.random()}`,
          events: [activity],
          isActive: false
        });
      }
    });

    return groups;
  }, []);

  // Get priority classification
  const getPriorityClass = useCallback((activity) => {
    // Check for critical scenarios with passengers
    if (activity.passengersOnBoard && (activity.status === 'STOP' || activity.decision === 'STOP')) {
      return 'priority-critical animate-pulse';
    }

    // High priority for vehicle disabled
    if (activity.status === 'STOP' || activity.decision === 'STOP') {
      return 'priority-high';
    }

    // Medium priority for amber/assessment required
    if (activity.status === 'AMBER' || activity.decision === 'AMBER') {
      return 'priority-medium';
    }

    // Check severity from existing data
    if (activity.severity === 'critical' || activity.severity === 'high') {
      return 'priority-high';
    }

    if (activity.severity === 'medium' || activity.severity === 'warning') {
      return 'priority-medium';
    }

    return 'priority-low';
  }, []);

  // Format status text with emojis
  const getStatusText = useCallback((status) => {
    switch(status) {
      case 'STOP': return '🛑 Vehicle Disabled';
      case 'AMBER': return '⚠️ Assessment Required';
      case 'CONTINUE': return '✅ Can Continue';
      case 'reported': return '📝 Reported';
      case 'active': return '🔧 In Progress';
      case 'resolved': return '✅ Resolved';
      default: return status;
    }
  }, []);

  // Handle location button clicks - Opens Google Maps
  const handleLocationClick = useCallback(async (activity) => {
    const activityKey = activity.id || activity.timestamp;

    let location = activity.location || activity.location_description || activity.currentLocation?.name;
    let lat, lng;

    // Extract coordinates from location string
    if (location && /^[-+]?\d*\.?\d+,\s*[-+]?\d*\.?\d+$/.test(location.trim())) {
      [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
    }

    // Extract coordinates from separate fields
    if (!lat && !lng) {
      lat = activity.latitude || activity.lat;
      lng = activity.longitude || activity.lng;
    }

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      // Open Google Maps in a new tab with the coordinates at street level zoom
      const busNumber = activity.busNumber || activity.fleet_no || activity.vehicle || activity.fleet_number || 'Vehicle';
      const label = encodeURIComponent(`${busNumber} - Breakdown Location`);
      // Using the @latitude,longitude,zoom format for better positioning
      const mapsUrl = `https://www.google.com/maps/@${lat},${lng},17z`;

      window.open(mapsUrl, '_blank', 'noopener,noreferrer');

      // Also try to get the address name in the background for caching
      if (!locationCache.has(activityKey)) {
        try {
          const locationName = await googleLocationService.getLocation(lat, lng);
          const newLocationCache = new Map(locationCache);
          newLocationCache.set(activityKey, locationName);
          setLocationCache(newLocationCache);
        } catch (error) {
          console.warn('Failed to reverse geocode coordinates:', error);
        }
      }
    } else if (location) {
      // If we have a text location, try to search for it on Google Maps
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('📍 Location: No location data available for this activity');
    }
  }, [locationCache]);

  // Get location display for activity (shows button for coordinates)
  const getLocationDisplay = useCallback((activity) => {
    let location = activity.location || activity.location_description || activity.currentLocation?.name;

    // Check if location looks like coordinates
    if (location && /^[-+]?\d*\.?\d+,\s*[-+]?\d*\.?\d+$/.test(location.trim())) {
      return {
        isCoordinates: true,
        displayText: 'Click for location',
        coordinates: location
      };
    }

    // Check if we have separate lat/lng fields
    if ((activity.latitude || activity.lat) && (activity.longitude || activity.lng)) {
      return {
        isCoordinates: true,
        displayText: 'Click for location',
        coordinates: `${activity.latitude || activity.lat}, ${activity.longitude || activity.lng}`
      };
    }

    return {
      isCoordinates: false,
      displayText: location || 'Location Unknown'
    };
  }, []);

  // Format activity display with enhanced information (now synchronous)
  const formatActivityDisplay = useCallback((activity) => {
    const lines = [];

    // Line 1: Use the pre-formatted message from the activity aggregator
    // The message is already formatted with supervisor name, action, and fleet number
    const mainMessage = activity.message || `Activity for ${activity.busNumber || activity.fleet_no || 'vehicle'}`;
    lines.push(mainMessage);

    // Line 2: Route and location with coordinate conversion
    const route = activity.route || activity.route_number || activity.routeNumber;
    const locationDisplay = getLocationDisplay(activity);

    const line2Parts = [];
    if (route) {
      line2Parts.push(`Route ${route}`);
    }
    if (locationDisplay.displayText) {
      line2Parts.push(locationDisplay.displayText);
    }
    if (line2Parts.length > 0) {
      lines.push(line2Parts.join(' • '));
    }

    // Line 3: Issue details and passenger info
    const issue = activity.issue || activity.issue_type || activity.issueType || activity.breakdownType;
    const line3Parts = [];

    if (issue) {
      line3Parts.push(issue);
    }

    // Add passenger information
    if (activity.passengersOnBoard || activity.passengers_on_board) {
      const count = activity.passengerCount || activity.passenger_count || '';
      line3Parts.push(`👥 ${count ? count + ' ' : ''}passengers`);
    } else if (activity.passengersOnBoard === false) {
      line3Parts.push('🚌✓ No passengers');
    }

    if (line3Parts.length > 0) {
      lines.push(line3Parts.join(' • '));
    }

    return {
      lines,
      locationDisplay // Include location info for rendering
    };
  }, [getLocationDisplay]);

  // Calculate time-based opacity for activity items
  const getTimeBasedOpacity = useCallback((timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const ageInMinutes = (now - activityTime) / 60000;

    // Full opacity for activities less than 5 minutes old
    if (ageInMinutes <= 5) return 1.0;
    // Gradually fade for older activities
    if (ageInMinutes <= 30) return 0.9;
    if (ageInMinutes <= 60) return 0.8;
    return 0.7;
  }, []);

  // Format relative time
  const formatTimeAgo = useCallback((timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }, []);

  // Pattern detection for similar issues
  useEffect(() => {
    if (combinedActivities.length < 3) return;

    const checkPatterns = () => {
      const recentActivities = combinedActivities.filter(a => {
        const ageInHours = (Date.now() - new Date(a.timestamp || a.created_at)) / 3600000;
        return ageInHours < 1; // Last hour
      });

      if (recentActivities.length < 3) return;

      // Check for similar issues
      const issueCount = {};
      const routeCount = {};

      recentActivities.forEach(activity => {
        const issue = activity.issue || activity.issue_type || activity.issueType;
        const route = activity.route || activity.route_number;

        if (issue) {
          issueCount[issue] = (issueCount[issue] || 0) + 1;
        }

        if (route) {
          routeCount[route] = (routeCount[route] || 0) + 1;
        }
      });

      // Check for issue patterns
      Object.entries(issueCount).forEach(([issue, count]) => {
        if (count >= 3) {
          const patternId = `pattern-issue-${issue.replace(/\s+/g, '-')}-${Date.now()}`;

          // Check if we've already shown this pattern
          const existingPattern = combinedActivities.find(a => a.id === patternId);
          if (!existingPattern) {
            const patternAlert = {
              id: patternId,
              type: 'pattern',
              message: `⚠️ Pattern Detected: ${count} "${issue}" issues in last hour`,
              timestamp: new Date().toISOString(),
              priority: 'warning',
              icon: '🔍',
              severity: 'warning'
            };

            setRealTimeActivities(prev => [patternAlert, ...prev]);
          }
        }
      });

      // Check for route patterns
      Object.entries(routeCount).forEach(([route, count]) => {
        if (count >= 3) {
          const patternId = `pattern-route-${route}-${Date.now()}`;

          const existingPattern = combinedActivities.find(a => a.id === patternId);
          if (!existingPattern) {
            const patternAlert = {
              id: patternId,
              type: 'pattern',
              message: `🚌 Route Alert: ${count} incidents on Route ${route} in last hour`,
              timestamp: new Date().toISOString(),
              priority: 'warning',
              icon: '🚨',
              severity: 'medium'
            };

            setRealTimeActivities(prev => [patternAlert, ...prev]);
          }
        }
      });
    };

    // Debounce pattern checking
    const timeoutId = setTimeout(checkPatterns, 1000);
    return () => clearTimeout(timeoutId);
  }, [combinedActivities]);

  // Memoize the formatted activities to prevent unnecessary re-renders
  const formattedActivities = useMemo(() => {
    const enrichedActivities = combinedActivities.map((activity, index) => {
      const enriched = enrichActivityWithRouteData(activity);

      const formattedDisplay = formatActivityDisplay(activity);

      return {
        ...enriched,
        // Ensure unique keys
        uniqueKey: `${activity.id || Math.random()}-${activity.timestamp || activity.created_at || index}`,
        // Mark real-time activities
        isRealTime: realTimeActivities.some(rt => rt.id === activity.id),
        // Add priority classification
        priorityClass: getPriorityClass(activity),
        // Add formatted display
        displayLines: formattedDisplay.lines,
        locationDisplay: formattedDisplay.locationDisplay,
        // Add time-based opacity
        opacity: getTimeBasedOpacity(activity.timestamp || activity.created_at)
      };
    });

    return enrichedActivities;
  }, [combinedActivities, realTimeActivities, enrichActivityWithRouteData, getPriorityClass, formatActivityDisplay, getTimeBasedOpacity, locationCache]);

  // Group activities for better display
  const groupedActivities = useMemo(() => {
    return groupActivities(formattedActivities);
  }, [formattedActivities, groupActivities]);

  if (!isOpen && !embedded) return null;

  const renderContent = () => (
    <>
      <div className="live-activity-header">
        <h3>Live Activity Feed</h3>
        <div className="activity-status">
          {embedded && (
            <span className={`connection-status ${isRealTimeConnected ? 'connected' : 'disconnected'}`}>
              {isRealTimeConnected ? '🟢' : '🔴'}
            </span>
          )}
          {lastUpdateTime && (
            <span className="last-update">
              Updated {new Date(lastUpdateTime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
        {!embedded && <button className="close-btn" onClick={onClose}>×</button>}
      </div>
      
      <div className="live-activity-content">
        {groupedActivities.length === 0 ? (
          <div className="no-activity">
            <span className="no-activity-icon">📋</span>
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="activity-list">
            {groupedActivities.map(group => {
              const primaryActivity = group.events[0];
              const hasMultipleEvents = group.events.length > 1;

              return (
                <div
                  key={group.id}
                  className={`activity-group ${primaryActivity.priorityClass || ''} ${primaryActivity.isRealTime ? 'real-time' : 'polling'} ${hasMultipleEvents ? 'grouped' : 'single'}`}
                  style={{ opacity: primaryActivity.opacity }}
                  title={primaryActivity.isRealTime ? 'Real-time update' : 'Polling data'}
                >
                  {/* Primary Activity Display */}
                  <div className="activity-item primary">
                    <span className="activity-icon">{primaryActivity.icon || (primaryActivity.type === 'pattern' ? '🔍' : '📄')}</span>
                    <div className="activity-details">
                      {primaryActivity.displayLines ? (
                        // Enhanced display for breakdown activities
                        <div className="activity-breakdown-display">
                          {primaryActivity.displayLines.map((line, index) => {
                            // Check if this line contains location and if it needs a button
                            if (index === 1 && primaryActivity.locationDisplay?.isCoordinates && line.includes('Click for location')) {
                              // Replace the location text with a clickable button
                              const parts = line.split('Click for location');
                              return (
                                <p key={index} className={`activity-line line-${index + 1}`}>
                                  {parts[0]}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLocationClick(primaryActivity);
                                    }}
                                    className="location-button"
                                    title="Click to view location details"
                                  >
                                    📍 View Location
                                  </button>
                                  {parts[1]}
                                </p>
                              );
                            }
                            return (
                              <p key={index} className={`activity-line line-${index + 1}`}>{line}</p>
                            );
                          })}

                          {/* Vehicle Location button for breakdown activities */}
                          {(primaryActivity.type === 'breakdown_reported' ||
                            primaryActivity.type === 'BREAKDOWN_REPORTED' ||
                            primaryActivity.type === 'wizard_completed' ||
                            primaryActivity.type === 'WIZARD_COMPLETED' ||
                            primaryActivity.type === 'ASSESSMENT_COMPLETED' ||
                            primaryActivity.activity_type === 'breakdown_reported' ||
                            primaryActivity.activity_type === 'wizard_completed' ||
                            primaryActivity.activityType === 'breakdown_reported' ||
                            primaryActivity.activityType === 'wizard_completed') &&
                           (primaryActivity.location || primaryActivity.location_description ||
                            primaryActivity.latitude || primaryActivity.lat) && (
                            <div className="vehicle-location-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocationClick(primaryActivity);
                                }}
                                className="vehicle-location-button"
                                title="View vehicle location on map"
                              >
                                📍 Vehicle Location
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Fallback for other activities
                        <p className="activity-message">{primaryActivity.message}</p>
                      )}

                      {/* Status indicator with enhanced styling */}
                      {(primaryActivity.status || primaryActivity.decision) && (
                        <div className="activity-status-display">
                          <span className={`status-badge ${(primaryActivity.status || primaryActivity.decision).toLowerCase()}`}>
                            {getStatusText(primaryActivity.status || primaryActivity.decision)}
                          </span>
                        </div>
                      )}

                      {/* Enhanced route information */}
                      {primaryActivity.enrichedRoute && (
                        <div className="activity-route-info">
                          <span
                            className={`route-badge ${primaryActivity.enrichedRoute.category.toLowerCase().replace(' ', '-')}`}
                            style={{
                              backgroundColor: primaryActivity.enrichedRoute.color,
                              color: primaryActivity.enrichedRoute.textColor,
                              fontWeight: 'bold'
                            }}
                            title={`${primaryActivity.enrichedRoute.agency} - ${primaryActivity.enrichedRoute.category}`}
                          >
                            {primaryActivity.enrichedRoute.shortName}
                          </span>
                          {primaryActivity.enrichedRoute.isExpress && (
                            <span className="express-indicator" title="Express Service">⚡</span>
                          )}
                        </div>
                      )}

                      <div className="activity-meta">
                        <span className="activity-time">
                          {formatTimeAgo(primaryActivity.timestamp || primaryActivity.created_at)}
                        </span>

                        {/* Show route depot or activity depot */}
                        {(primaryActivity.enrichedRoute?.depot || primaryActivity.depot) && (
                          <span className="activity-depot">
                            • {primaryActivity.enrichedRoute?.depot || primaryActivity.depot}
                          </span>
                        )}

                        {/* Bus number for grouped activities */}
                        {group.busNumber && (
                          <span className="activity-bus-number">
                            • Bus {group.busNumber}
                          </span>
                        )}

                        {primaryActivity.isRealTime && (
                          <span className="real-time-indicator" title="Real-time update">
                            🔴 LIVE
                          </span>
                        )}

                        {/* Group indicator */}
                        {hasMultipleEvents && (
                          <span className="group-indicator" title={`${group.events.length} related events`}>
                            • {group.events.length} events
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Events in Group */}
                  {hasMultipleEvents && (
                    <div className="nested-events">
                      {group.events.slice(1).map((event, eventIndex) => (
                        <div key={`${group.id}-event-${eventIndex}`} className="nested-event">
                          <span className="nested-icon">{event.icon || '↳'}</span>
                          <div className="nested-details">
                            {event.displayLines ? (
                              <p className="nested-message">{event.displayLines[0]}</p>
                            ) : (
                              <p className="nested-message">{event.message}</p>
                            )}
                            <span className="nested-time">
                              {formatTimeAgo(event.timestamp || event.created_at)}
                            </span>
                            {(event.status || event.decision) && (
                              <span className={`nested-status ${(event.status || event.decision).toLowerCase()}`}>
                                • {getStatusText(event.status || event.decision)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="live-activity-footer">
        <button 
          className="view-all-btn"
          onClick={() => window.location.href = '/dashboards/breakdown'}
        >
          View All Activity →
        </button>
      </div>
    </>
  );

  // Embedded version - use React.memo to prevent re-renders
  if (embedded) {
    return (
      <div className="live-activity-feed embedded" key="live-feed-embedded">
        {renderContent()}
      </div>
    );
  }

  // Standalone floating version
  return (
    <div className="live-activity-feed-overlay" key="live-feed-overlay">
      <div className="live-activity-feed">
        {renderContent()}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(LiveActivityFeed, (prevProps, nextProps) => {
  // Custom comparison function
  // Only re-render if activities or important props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.embedded === nextProps.embedded &&
    JSON.stringify(prevProps.activities) === JSON.stringify(nextProps.activities)
  );
});
