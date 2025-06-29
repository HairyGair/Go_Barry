// Go_BARRY/components/DisplayScreen.jsx
// Control Room Display - Enhanced with Intelligent Forwarding & Supervisor Activity
// Optimized for 60 metre viewing distance

import React, { useState, useEffect } from 'react';
import OptimizedTomTomMap from './OptimizedTomTomMap';
import { useConvexSync } from '../hooks/useConvexSync';
import { formatTime24WithSeconds, formatDateWithWeekday } from '../utils/dateTime';
import LateRunnersWidget from './LateRunnersWidget';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLocationIndex, setWeatherLocationIndex] = useState(0);
  const [showSupervisorActivity, setShowSupervisorActivity] = useState(true);
  const weatherLocations = ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Consett', 'Stanley'];

  // Use Convex for real-time sync
  const convexData = useConvexSync();
  
  // TODO: Fix Convex deployment to enable display messages
  // For now, using empty array as fallback
  const displayMessages = [];
  
  // Get data from Convex
  const activeSupervisors = convexData?.activeSupervisors || [];
  const vixData = convexData?.vixData;
  // TODO: Fix Convex deployment to enable recent actions
  const recentActions = [];
  const mostSevereEvent = convexData?.mostSevereEvent || null;
  
  // Get recent handovers for display
  // TODO: Re-enable when Convex is deployed properly
  const recentHandovers = [];
  
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

  // Toggle supervisor activity panel every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSupervisorActivity(prev => !prev);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
          fontSize: '32px',
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

        {/* Message Queue Status */}
        {queueStatus && (queueStatus.totalMessages > 0) && (
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '18px',
            border: '2px solid #333'
          }}>
            <div style={{ color: '#999', fontSize: '14px' }}>MESSAGE QUEUE</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
              <span style={{ color: '#DC2626' }}>P0: {queueStatus.byPriority?.P0 || 0}</span>
              <span style={{ color: '#F59E0B' }}>P1: {queueStatus.byPriority?.P1 || 0}</span>
              <span style={{ color: '#3B82F6' }}>P2: {queueStatus.byPriority?.P2 || 0}</span>
              <span style={{ color: '#10B981' }}>P3: {queueStatus.byPriority?.P3 || 0}</span>
            </div>
          </div>
        )}

        {/* Major Event Alert */}
        {mostSevereEvent && (
          <div style={{
            backgroundColor: mostSevereEvent.severity === 'CRITICAL' ? '#DC2626' : '#F59E0B',
            padding: '10px 20px',
            borderRadius: '8px',
            animation: 'pulse 2s infinite',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🏟️ {mostSevereEvent.venue}: {mostSevereEvent.event} - {mostSevereEvent.time}
          </div>
        )}

        {/* Time Display */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '300',
            fontFamily: 'monospace',
            letterSpacing: '-1px'
          }}>
            {formatTime24WithSeconds(currentTime)}
          </div>
          <div style={{
            fontSize: '18px',
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
                fontSize: '60px',
                fontWeight: 'bold',
                margin: '0 0 15px 0',
                lineHeight: '1.1',
                color: '#ffffff'
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
              <h1 style={{ fontSize: '48px', color: '#10b981', margin: 0 }}>
                ALL CLEAR
              </h1>
              <p style={{ fontSize: '28px', color: '#666666', marginTop: '15px' }}>
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
            <OptimizedTomTomMap 
              alerts={activeMessages}
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
          {/* Handover Status (if recent handovers) */}
          {hasRecentHandovers && (
            <HandoverStatusWidget recentHandovers={recentHandovers} />
          )}
          
          {/* Supervisor Activity Panel (alternates with Late Runners) */}
          {showSupervisorActivity ? (
            <SupervisorActivityPanel 
              activeSupervisors={activeSupervisors}
              recentActions={recentActions}
            />
          ) : (
            lateRunners?.length > 0 && (
              <LateRunnersWidget 
                lateRunners={lateRunners}
                limit={5}
              />
            )
          )}
        </div>
      </div>

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

export default DisplayScreen;