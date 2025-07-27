// Go_BARRY/components/DisplayScreen.jsx
// Control Room Display - Enhanced with Intelligent Forwarding & Supervisor Activity
// Optimized for 60 metre viewing distance

import React, { useState, useEffect } from 'react';
import TomTomTrafficMap from './TomTomTrafficMap';
import { useConvexSyncSimple } from '../hooks/useConvexSyncSimple';
import { formatTime24WithSeconds, formatDateWithWeekday } from '../utils/dateTime';
// LateRunnersWidget removed during cleanup
import WeatherWidget from './display/WeatherWidget';
import WeatherImpactAlert from './display/WeatherImpactAlert';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLocationIndex, setWeatherLocationIndex] = useState(0);
  const [showSupervisorActivity, setShowSupervisorActivity] = useState(true);
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const weatherLocations = ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Consett', 'Stanley'];

  // Use enhanced Convex for real-time sync
  const convexData = useConvexSyncSimple();
  
  // Get display messages from Convex
  const displayMessages = convexData?.customMessages || [];
  
  // Get data from Convex
  const activeSupervisors = convexData?.activeSupervisors || [];
  const vixData = convexData?.vixData;
  // Get recent actions from Convex
  const recentActions = convexData?.recentActions || [];
  const mostSevereEvent = convexData?.mostSevereEvent || null;
  
  // Get recent handovers from Convex
  const recentHandovers = convexData?.recentHandovers || [];
  
  // Get display incidents from Convex
  const displayIncidents = convexData?.displayIncidents || [];
  const displayMessageQueue = convexData?.displayMessages || [];
  
  // Extract VIX data from Convex (with safe fallback)
  const lateRunners = vixData?.lateRunners || [];

  // Get active display messages (prioritized)
  const activeMessages = displayMessages?.filter(msg => 
    !msg.displayed && msg.expiresAt > Date.now()
  ) || [];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data (optimized for working hours)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://go-barry.onrender.com/api/weather/current');
        const data = await response.json();
        if (data.success) {
          setWeather(data.data);
          console.log('🌤️ Weather data updated');
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    };

    const checkAndFetch = async () => {
      const now = new Date();
      const currentHour = now.getHours() + (now.getMinutes() / 60);
      const isInWorkingHours = currentHour >= 6 || currentHour <= 0.25;
      
      if (isInWorkingHours) {
        await fetchWeather();
      }
    };
    
    const initialTimer = setTimeout(checkAndFetch, 5000);
    const interval = setInterval(checkAndFetch, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Cycle through weather locations
  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherLocationIndex((prev) => (prev + 1) % weatherLocations.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate messages based on priority
  useEffect(() => {
    if (!activeMessages?.length || activeMessages.length <= 1) return;
    
    const currentMessage = activeMessages[currentMessageIndex];
    const rotationInterval = currentMessage?.rotationInterval || 30000;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        return (prev + 1) % activeMessages.length;
      });
    }, rotationInterval);
    
    return () => clearInterval(interval);
  }, [activeMessages?.length, currentMessageIndex]);

  // Toggle between supervisor activity, weather widget, and late runners every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSupervisorActivity(prev => {
        if (prev) {
          // Show weather widget next
          setShowWeatherWidget(true);
          return false;
        } else if (showWeatherWidget) {
          // Show late runners next
          setShowWeatherWidget(false);
          return false;
        } else {
          // Show supervisor activity next
          return true;
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [showWeatherWidget]);

  // Check for recent handovers (last 2 hours)
  const hasRecentHandovers = recentHandovers?.some(handover => {
    const handoverTime = new Date(handover.createdAt).getTime();
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    return handoverTime > twoHoursAgo;
  }) || false;

  const getCurrentMessage = () => {
    if (!activeMessages?.length || currentMessageIndex >= activeMessages.length) return null;
    return activeMessages[currentMessageIndex];
  };

  const calculatePassengerImpact = (message) => {
    if (!message?.affectsRoutes?.length) return null;
    
    // Estimated passengers per route per hour (simplified calculation)
    const routePassengerEstimates = {
      '21': 150, 'X21': 120, '1': 100, '2': 90, '307': 85,
      'Q3': 200, '56': 80, '57': 75, '58': 70, '4': 95
    };
    
    const affectedPassengers = message.affectsRoutes.reduce((total, route) => {
      return total + (routePassengerEstimates[route] || 50); // Default 50 passengers/hour
    }, 0);
    
    const severityMultiplier = message.priority === 0 ? 3 : message.priority === 1 ? 2 : 1.5;
    
    return {
      affectedPassengers: Math.round(affectedPassengers * severityMultiplier),
      affectedRoutes: message.affectsRoutes.length,
      estimatedDelay: message.priority === 0 ? '15+ min' : message.priority === 1 ? '10-15 min' : '5-10 min'
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 0: return '#DC2626'; // P0 Emergency - Red
      case 1: return '#F59E0B'; // P1 Critical - Orange  
      case 2: return '#3B82F6'; // P2 Important - Blue
      case 3: return '#10B981'; // P3 Info - Green
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 0: return 'EMERGENCY';
      case 1: return 'CRITICAL';
      case 2: return 'IMPORTANT';
      case 3: return 'INFORMATION';
      default: return 'UNKNOWN';
    }
  };

  const currentMessage = getCurrentMessage();
  const currentWeatherLocation = weatherLocations[weatherLocationIndex];
  const currentWeatherData = weather?.locations?.[currentWeatherLocation];
  const passengerImpact = currentMessage ? calculatePassengerImpact(currentMessage) : null;
  
  // Handle weather alert generation
  const handleWeatherAlert = (alert) => {
    setWeatherAlerts(prev => {
      const newAlerts = [alert, ...prev.slice(0, 4)]; // Keep last 5 alerts
      return newAlerts;
    });
    console.log('🌤️ Weather alert generated:', alert);
  };
  
  // Simple queue status for display
  const queueStatus = {
    totalMessages: activeMessages.length,
    byPriority: {
      P0: activeMessages.filter(m => m.priority === 0).length,
      P1: activeMessages.filter(m => m.priority === 1).length,
      P2: activeMessages.filter(m => m.priority === 2).length,
      P3: activeMessages.filter(m => m.priority === 3).length,
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#ffffff',
      fontFamily: "'Arial', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header - Weather & Time */}
      <div style={{
        height: '90px',
        backgroundColor: '#111111',
        borderBottom: '3px solid #333333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
      }}>
        {/* Weather Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontSize: '36px',
          fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '42px' }}>{currentWeatherData?.icon || '🌤️'}</span>
            <span>{currentWeatherLocation}: {currentWeatherData?.temp || '--'}°C</span>
          </div>
          {weather?.redheughBridge && weather.redheughBridge.windSpeedMph > 30 && (
            <div style={{
              backgroundColor: weather.redheughBridge.windSpeedMph > 40 ? '#DC2626' : '#F59E0B',
              padding: '10px 20px',
              borderRadius: '8px',
              animation: 'pulse 2s infinite',
              fontSize: '28px'
            }}>
              ⚠️ HIGH WIND: Redheugh Bridge {weather.redheughBridge.windSpeedMph}mph
            </div>
          )}
        </div>

        {/* Message Queue Status and Incidents */}
        <div style={{ display: 'flex', gap: '15px' }}>
          {queueStatus && (queueStatus.totalMessages > 0) && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '20px',
              border: '2px solid #333'
            }}>
              <div style={{ color: '#999', fontSize: '16px' }}>MESSAGE QUEUE</div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <span style={{ color: '#DC2626' }}>P0: {queueStatus.byPriority?.P0 || 0}</span>
                <span style={{ color: '#F59E0B' }}>P1: {queueStatus.byPriority?.P1 || 0}</span>
                <span style={{ color: '#3B82F6' }}>P2: {queueStatus.byPriority?.P2 || 0}</span>
                <span style={{ color: '#10B981' }}>P3: {queueStatus.byPriority?.P3 || 0}</span>
              </div>
            </div>
          )}
          
          {/* Incident Status */}
          {displayIncidents && displayIncidents.length > 0 && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '20px',
              border: '2px solid #DC2626'
            }}>
              <div style={{ color: '#DC2626', fontSize: '16px', fontWeight: 'bold' }}>ACTIVE INCIDENTS</div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ color: '#DC2626', fontSize: '24px', fontWeight: 'bold' }}>
                  🚨 {displayIncidents.length}
                </span>
                <span style={{ color: '#999', fontSize: '14px' }}>
                  {displayIncidents.filter(i => i.affectedRoutes?.length > 0).reduce((sum, i) => sum + (i.affectedRoutes?.length || 0), 0)} routes affected
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Alerts Section */}
        <EmergencyAlertsSection 
          alerts={activeMessages.filter(msg => msg.priority === 0)} // P0 Emergency
          incidents={displayIncidents.filter(inc => inc.severity === 'critical')}
          mostSevereEvent={mostSevereEvent}
        />

        {/* Time Display */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '56px',
            fontWeight: '300',
            fontFamily: 'monospace',
            letterSpacing: '-1px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            {formatTime24WithSeconds(currentTime)}
          </div>
          <div style={{
            fontSize: '20px',
            color: '#999999',
            marginTop: '-5px'
          }}>
            {formatDateWithWeekday(currentTime)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '15px',
        gap: '15px'
      }}>
        {/* Alert & Map Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Current Message */}
          {currentMessage ? (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '25px',
              border: `3px solid ${getPriorityColor(currentMessage.priority)}`,
              boxShadow: `0 0 20px ${getPriorityColor(currentMessage.priority)}33`
            }}>
              {/* Priority Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{
                  backgroundColor: getPriorityColor(currentMessage.priority),
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  {getPriorityLabel(currentMessage.priority)}
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {currentMessage.autoTriggered && <span style={{ color: '#F59E0B' }}>🤖 AUTO</span>}
                  <span>from {currentMessage.supervisorName}</span>
                </div>
              </div>

              <h1 style={{
                fontSize: '72px',
                fontWeight: 'bold',
                margin: '0 0 20px 0',
                lineHeight: '1.1',
                color: '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                {currentMessage.content}
              </h1>

              {/* Passenger Impact */}
              {passengerImpact && (
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '20px',
                  border: '2px solid #444'
                }}>
                  <div style={{ fontSize: '20px', color: '#F59E0B', marginBottom: '10px', fontWeight: 'bold' }}>
                    📊 PASSENGER IMPACT ESTIMATE
                  </div>
                  <div style={{ display: 'flex', gap: '30px', fontSize: '24px' }}>
                    <span>👥 {passengerImpact.affectedPassengers} passengers</span>
                    <span>🚌 {passengerImpact.affectedRoutes} routes</span>
                    <span>⏱️ {passengerImpact.estimatedDelay} delay</span>
                  </div>
                </div>
              )}

              <div style={{
                fontSize: '20px',
                color: '#999999',
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Created: {new Date(currentMessage.createdAt).toLocaleTimeString()}</span>
                <span>Message {currentMessageIndex + 1} of {activeMessages.length}</span>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              border: '3px solid #10b981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
              <h1 style={{ fontSize: '64px', color: '#10b981', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                ALL CLEAR
              </h1>
              <p style={{ fontSize: '32px', color: '#666666', marginTop: '20px' }}>
                No priority messages in queue
              </p>
            </div>
          )}

          {/* Map */}
          <div style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '3px solid #333333',
            minHeight: '300px'
          }}>
            <TomTomTrafficMap 
              alerts={[
                ...activeMessages,
                ...(displayIncidents || []).filter(inc => inc.coordinates).map(incident => ({
                  id: `incident-${incident.id}`,
                  location: {
                    lat: incident.coordinates.lat,
                    lng: incident.coordinates.lng
                  },
                  description: `🚨 ${incident.incidentType?.toUpperCase() || 'INCIDENT'}: ${incident.description}`,
                  severity: incident.severity || 'medium',
                  type: 'incident',
                  affectedRoutes: incident.affectedRoutes
                }))
              ]}
              currentAlert={currentMessage}
              alertIndex={currentMessageIndex}
              mapId="display-screen-60m"
            />
          </div>
        </div>

        {/* Right Side Panel */}
        <div style={{
          width: '450px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Service Status Overview */}
          <ServiceStatusPanel 
            operationalStats={convexData.operationalStats}
            servicePerformance={convexData.servicePerformance}
            isConnected={convexData.isConnected}
          />

          {/* Regional Status Panel */}
          <RegionalStatusPanel 
            regionalStatus={convexData.regionalStatus}
            activeSupervisors={activeSupervisors}
          />

          {/* Handover Status (if recent handovers) */}
          {hasRecentHandovers && (
            <HandoverStatusWidget recentHandovers={recentHandovers} />
          )}
          
          {/* Rotating Panels: Supervisor Activity, Weather Widget, Late Runners */}
          {showSupervisorActivity ? (
            <SupervisorActivityPanel 
              activeSupervisors={activeSupervisors}
              recentActions={recentActions}
            />
          ) : showWeatherWidget ? (
            <WeatherWidget 
              weatherData={weather}
              isActive={true}
            />
          ) : (
            lateRunners?.length > 0 && (
              <div style={{
                padding: '20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                border: '2px solid #ff6b6b'
              }}>
                <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>⚠️ Late Runners</h3>
                <div style={{ fontSize: '16px' }}>
                  {lateRunners.slice(0, 5).map((runner, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      {runner.route} - {runner.delay} mins late
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Weather Impact Alert Overlay */}
      <WeatherImpactAlert 
        weatherData={weather}
        onAlertGenerated={handleWeatherAlert}
      />

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Supervisor Activity Panel Component
const SupervisorActivityPanel = ({ activeSupervisors, recentActions }) => {
  const [activityIndex, setActivityIndex] = useState(0);

  // Rotate through recent actions every 5 seconds
  useEffect(() => {
    if (!recentActions?.length || recentActions.length <= 1) return;
    
    const interval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % recentActions.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [recentActions?.length]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'send_display_message': return '📺';
      case 'create_roadwork': return '🚧';
      case 'acknowledge_alert': return '✅';
      case 'dismiss_alert': return '❌';
      case 'create_incident': return '📝';
      case 'create_shift_handover': return '🔄';
      case 'acknowledge_handover': return '🤝';
      case 'login': return '🔑';
      case 'logout': return '🔓';
      default: return '⚡';
    }
  };

  const formatActionText = (actionData) => {
    const action = actionData.action;
    const supervisor = actionData.supervisorName;
    const time = new Date(actionData.timestamp).toLocaleTimeString();
    
    switch (action) {
      case 'send_display_message':
        return `${supervisor} sent message (${actionData.details?.priority || 'P2'})`;
      case 'create_roadwork':
        return `${supervisor} created roadwork`;
      case 'acknowledge_alert':
        return `${supervisor} acknowledged alert`;
      case 'dismiss_alert':
        return `${supervisor} dismissed alert`;
      case 'create_incident':
        return `${supervisor} created incident`;
      case 'create_shift_handover':
        return `${supervisor} created shift handover`;
      case 'acknowledge_handover':
        return `${supervisor} acknowledged handover`;
      case 'login':
        return `${supervisor} logged in`;
      default:
        return `${supervisor} ${action.replace('_', ' ')}`;
    }
  };

  const recentActivity = recentActions?.slice(0, 10) || [];
  const currentActivity = recentActivity[activityIndex];

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      border: '3px solid #333333',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '15px 20px',
        borderBottom: '2px solid #333'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '24px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          👥 SUPERVISOR ACTIVITY
          <span style={{ 
            fontSize: '16px', 
            color: '#10B981',
            backgroundColor: '#1a2e1a',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {activeSupervisors.length} online
          </span>
        </h3>
      </div>

      {/* Active Supervisors */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #333'
      }}>
        {activeSupervisors?.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px'
          }}>
            {activeSupervisors.slice(0, 6).map((supervisor) => (
              <div key={supervisor.badge} style={{
                fontSize: '16px',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ color: '#10b981' }}>●</span>
                <span>{supervisor.supervisorName}</span>
                <span style={{ color: '#666', fontSize: '14px' }}>({supervisor.badge})</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '16px', color: '#666666' }}>
            No supervisors online
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{
        padding: '15px 20px'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#999',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          RECENT ACTIONS
        </div>
        
        {currentActivity ? (
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '12px',
            border: '2px solid #444'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '18px',
              color: '#ffffff'
            }}>
              <span style={{ fontSize: '24px' }}>
                {getActionIcon(currentActivity.action)}
              </span>
              <span>{formatActionText(currentActivity)}</span>
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999',
              marginTop: '5px'
            }}>
              {new Date(currentActivity.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '16px', color: '#666' }}>
            No recent activity
          </div>
        )}

        {recentActivity.length > 1 && (
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginTop: '10px',
            textAlign: 'center'
          }}>
            Activity {activityIndex + 1} of {recentActivity.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Handover Status Widget Component
const HandoverStatusWidget = ({ recentHandovers }) => {
  const [handoverIndex, setHandoverIndex] = useState(0);

  // Rotate through handovers every 10 seconds
  useEffect(() => {
    if (!recentHandovers?.length || recentHandovers.length <= 1) return;
    
    const interval = setInterval(() => {
      setHandoverIndex((prev) => (prev + 1) % recentHandovers.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [recentHandovers?.length]);

  const currentHandover = recentHandovers?.[handoverIndex];
  if (!currentHandover) return null;

  const isRecent = new Date(currentHandover.createdAt).getTime() > (Date.now() - (30 * 60 * 1000)); // Last 30 minutes
  const timeAgo = Math.round((Date.now() - new Date(currentHandover.createdAt).getTime()) / (1000 * 60)); // minutes ago

  return (
    <div style={{
      backgroundColor: isRecent ? '#1a2e1a' : '#1a1a1a',
      borderRadius: '12px',
      border: `3px solid ${isRecent ? '#00B894' : '#333333'}`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: isRecent ? '#00B894' : '#2a2a2a',
        padding: '12px 15px',
        borderBottom: '2px solid #333'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '20px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔄 {isRecent ? 'RECENT HANDOVER' : 'SHIFT HANDOVER'}
          {isRecent && (
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '2px 6px',
              borderRadius: '8px'
            }}>
              NEW
            </span>
          )}
        </h3>
      </div>

      {/* Handover Details */}
      <div style={{
        padding: '12px 15px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div>
            <div style={{
              fontSize: '18px',
              color: '#ffffff',
              fontWeight: 'bold'
            }}>
              {currentHandover.fromSupervisorName}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#999'
            }}>
              {currentHandover.shiftTime}
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666',
            textAlign: 'right'
          }}>
            {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#ccc'
        }}>
          <span>🚨 {currentHandover.incidents?.length || 0} incidents</span>
          <span>⚠️ {currentHandover.alerts?.length || 0} alerts</span>
          <span>📝 {currentHandover.recommendations?.length || 0} notes</span>
        </div>

        {currentHandover.acknowledged ? (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#00B894',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ✅ Acknowledged by {currentHandover.acknowledgedByName}
          </div>
        ) : (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⏳ Awaiting acknowledgment
          </div>
        )}
      </div>

      {recentHandovers.length > 1 && (
        <div style={{
          padding: '8px 15px',
          borderTop: '1px solid #333',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          Handover {handoverIndex + 1} of {recentHandovers.length}
        </div>
      )}
    </div>
  );
};

// Service Status Panel Component
const ServiceStatusPanel = ({ operationalStats, servicePerformance, isConnected }) => {
  const getStatusColor = (performance) => {
    if (performance >= 95) return '#10B981'; // Green
    if (performance >= 90) return '#F59E0B'; // Orange
    return '#DC2626'; // Red
  };

  const getStatusText = (performance) => {
    if (performance >= 95) return 'EXCELLENT';
    if (performance >= 90) return 'GOOD';
    if (performance >= 85) return 'FAIR';
    return 'POOR';
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      border: `3px solid ${isConnected ? '#10B981' : '#DC2626'}`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '15px 20px',
        borderBottom: '2px solid #333'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '24px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🚌 SERVICE STATUS
          <span style={{
            fontSize: '12px',
            color: isConnected ? '#10B981' : '#DC2626',
            backgroundColor: isConnected ? '#1a2e1a' : '#2e1a1a',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </h3>
      </div>

      {/* Stats Grid */}
      <div style={{
        padding: '15px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px'
      }}>
        {/* Operating Routes */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
            {operationalStats.operatingRoutes}
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            / {operationalStats.totalRoutes} ROUTES
          </div>
        </div>

        {/* On-Time Performance */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: getStatusColor(operationalStats.onTimePerformance) 
          }}>
            {operationalStats.onTimePerformance}%
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            ON TIME
          </div>
        </div>

        {/* Average Delay */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: operationalStats.averageDelay > 5 ? '#DC2626' : '#10B981' 
          }}>
            {operationalStats.averageDelay}m
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            AVG DELAY
          </div>
        </div>

        {/* Active Incidents */}
        <div style={{
          textAlign: 'center',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px'
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: operationalStats.activeIncidents > 5 ? '#DC2626' : '#10B981' 
          }}>
            {operationalStats.activeIncidents}
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            INCIDENTS
          </div>
        </div>
      </div>

      {/* Performance Status */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #333',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: getStatusColor(operationalStats.onTimePerformance),
          backgroundColor: `${getStatusColor(operationalStats.onTimePerformance)}20`,
          padding: '8px 16px',
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          NETWORK STATUS: {getStatusText(operationalStats.onTimePerformance)}
        </div>
      </div>
    </div>
  );
};

// Regional Status Panel Component
const RegionalStatusPanel = ({ regionalStatus, activeSupervisors }) => {
  const getRegionStatusColor = (status) => {
    switch (status) {
      case 'good': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getRegionIcon = (regionKey) => {
    const icons = {
      newcastle: '🏰',
      gateshead: '🌉',
      sunderland: '⚽',
      durham: '🏛️',
      northTyneside: '🚢',
      northumberland: '🏔️'
    };
    return icons[regionKey] || '📍';
  };

  const getRegionName = (regionKey) => {
    const names = {
      newcastle: 'Newcastle',
      gateshead: 'Gateshead',
      sunderland: 'Sunderland',
      durham: 'Durham',
      northTyneside: 'N. Tyneside',
      northumberland: 'Northumberland'
    };
    return names[regionKey] || regionKey;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      border: '3px solid #333333',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '15px 20px',
        borderBottom: '2px solid #333'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '20px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🗺️ REGIONAL STATUS
          <span style={{
            fontSize: '12px',
            color: '#10B981',
            backgroundColor: '#1a2e1a',
            padding: '4px 8px',
            borderRadius: '8px'
          }}>
            6 REGIONS
          </span>
        </h3>
      </div>

      {/* Regional Grid */}
      <div style={{
        padding: '15px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {Object.entries(regionalStatus).map(([regionKey, region]) => (
          <div key={regionKey} style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '12px',
            border: `2px solid ${getRegionStatusColor(region.status)}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {getRegionIcon(regionKey)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffffff'
              }}>
                {getRegionName(regionKey)}
              </div>
              <div style={{
                fontSize: '12px',
                color: getRegionStatusColor(region.status),
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{region.performance}%</span>
                <span>{region.incidents} inc</span>
              </div>
            </div>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getRegionStatusColor(region.status)
            }} />
          </div>
        ))}
      </div>

      {/* Overall Summary */}
      <div style={{
        padding: '15px 20px',
        borderTop: '1px solid #333',
        fontSize: '14px',
        color: '#999',
        textAlign: 'center'
      }}>
        {activeSupervisors.length} supervisors monitoring • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

// Emergency Alerts Section Component
const EmergencyAlertsSection = ({ alerts = [], incidents = [], mostSevereEvent }) => {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // Combine all emergency items
  const emergencyItems = [
    ...alerts.map(alert => ({ type: 'message', data: alert })),
    ...incidents.map(incident => ({ type: 'incident', data: incident })),
    ...(mostSevereEvent ? [{ type: 'event', data: mostSevereEvent }] : [])
  ];

  // Rotate through emergency items
  useEffect(() => {
    if (emergencyItems.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % emergencyItems.length);
    }, 8000); // Change every 8 seconds
    
    return () => clearInterval(interval);
  }, [emergencyItems.length]);

  if (emergencyItems.length === 0) return null;

  const currentItem = emergencyItems[currentAlertIndex];
  
  const getEmergencyColor = (item) => {
    switch (item.type) {
      case 'message': return '#DC2626'; // Red for P0 messages
      case 'incident': return '#DC2626'; // Red for critical incidents
      case 'event': return item.data.severity === 'CRITICAL' ? '#DC2626' : '#F59E0B'; // Red/Orange for events
      default: return '#DC2626';
    }
  };

  const getEmergencyIcon = (item) => {
    switch (item.type) {
      case 'message': return '🚨';
      case 'incident': return '⚠️';
      case 'event': return '🏟️';
      default: return '🚨';
    }
  };

  const getEmergencyText = (item) => {
    switch (item.type) {
      case 'message':
        return `${item.data.content}`;
      case 'incident':
        return `${item.data.incidentType?.toUpperCase() || 'INCIDENT'}: ${item.data.description}`;
      case 'event':
        return `${item.data.venue}: ${item.data.event} - ${item.data.time}`;
      default:
        return 'Emergency Alert';
    }
  };

  const getEmergencyLabel = (item) => {
    switch (item.type) {
      case 'message': return 'EMERGENCY MESSAGE';
      case 'incident': return 'CRITICAL INCIDENT';
      case 'event': return 'MAJOR EVENT';
      default: return 'EMERGENCY';
    }
  };

  return (
    <div style={{
      backgroundColor: getEmergencyColor(currentItem),
      padding: '12px 20px',
      borderRadius: '8px',
      animation: 'pulse 2s infinite',
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '600px',
      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
    }}>
      <span style={{ fontSize: '28px' }}>
        {getEmergencyIcon(currentItem)}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '12px',
          opacity: 0.9,
          marginBottom: '2px',
          letterSpacing: '1px'
        }}>
          {getEmergencyLabel(currentItem)}
        </div>
        <div style={{ fontSize: '18px' }}>
          {getEmergencyText(currentItem)}
        </div>
      </div>
      {emergencyItems.length > 1 && (
        <div style={{
          fontSize: '12px',
          opacity: 0.8,
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {currentAlertIndex + 1}/{emergencyItems.length}
        </div>
      )}
    </div>
  );
};

export default DisplayScreen;