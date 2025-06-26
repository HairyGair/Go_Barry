// Go_BARRY/components/DisplayScreen.jsx
// Control Room Display - Optimized for 60 metre viewing distance

import React, { useState, useEffect, useRef } from 'react';
import OptimizedTomTomMap from './OptimizedTomTomMap';
import { useConvexSync, useSupervisorActions } from '../hooks/useConvexSync';
import { formatTime24WithSeconds, formatDateWithWeekday, formatTime24 } from '../utils/dateTime';
import LateRunnersWidget from './LateRunnersWidget';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLocationIndex, setWeatherLocationIndex] = useState(0);
  const weatherLocations = ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Consett', 'Stanley'];

  // Use Convex for real-time sync
  const { pushedAlerts, activeSupervisors, vixData } = useConvexSync();
  const supervisorActivity = useSupervisorActions({ limit: 10 });
  
  // Extract VIX data from Convex (with safe fallback)
  const lateRunners = vixData?.lateRunners || [];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
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

    // Only fetch weather during working hours (06:00 - 00:15)
    const checkAndFetch = async () => {
      const now = new Date();
      const currentHour = now.getHours() + (now.getMinutes() / 60);
      
      // Working hours: 06:00 to 00:15 (crosses midnight)
      const isInWorkingHours = currentHour >= 6 || currentHour <= 0.25;
      
      if (isInWorkingHours) {
        await fetchWeather();
      } else {
        console.log('🌙 Outside working hours - skipping weather fetch');
      }
    };
    
    // Initial fetch after 5 seconds (if in working hours)
    const initialTimer = setTimeout(checkAndFetch, 5000);
    
    // Then check every 30 minutes
    // With working hours: ~36 fetches/day * 7 locations = 252 calls/day
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
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate alerts every 30 seconds
  useEffect(() => {
    if (pushedAlerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % pushedAlerts.length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pushedAlerts.length]);

  const getCurrentAlert = () => {
    if (!pushedAlerts.length || currentAlertIndex >= pushedAlerts.length) return null;
    return pushedAlerts[currentAlertIndex];
  };

  const currentAlert = getCurrentAlert();
  const currentWeatherLocation = weatherLocations[weatherLocationIndex];
  const currentWeatherData = weather?.locations?.[currentWeatherLocation];

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
        height: '80px',
        backgroundColor: '#111111',
        borderBottom: '2px solid #333333',
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
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '36px' }}>{currentWeatherData?.icon || '🌤️'}</span>
            <span>{currentWeatherLocation}: {currentWeatherData?.temp || '--'}°C</span>
          </div>
          {weather?.redheughBridge && weather.redheughBridge.windSpeedMph > 30 && (
            <div style={{
              backgroundColor: weather.redheughBridge.windSpeedMph > 40 ? '#DC2626' : '#F59E0B',
              padding: '10px 20px',
              borderRadius: '8px',
              animation: 'pulse 2s infinite',
              fontSize: '24px'
            }}>
              ⚠️ HIGH WIND: Redheugh Bridge {weather.redheughBridge.windSpeedMph}mph
            </div>
          )}
        </div>

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
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Current Alert */}
          {currentAlert ? (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '25px',
              border: '2px solid #ff0000',
              boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)'
            }}>
              <h1 style={{
                fontSize: '60px',
                fontWeight: 'bold',
                margin: '0 0 15px 0',
                lineHeight: '1.1',
                color: '#ffffff'
              }}>
                {currentAlert.title}
              </h1>
              
              <div style={{
                fontSize: '36px',
                color: '#ffcc00',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span>📍</span>
                <span>{currentAlert.location || 'Location not specified'}</span>
              </div>

              {currentAlert.affectsRoutes && currentAlert.affectsRoutes.length > 0 && (
                <div style={{
                  fontSize: '30px',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <span>🚌</span>
                  <span>Routes: {currentAlert.affectsRoutes.slice(0, 8).join(', ')}</span>
                </div>
              )}

              <div style={{
                fontSize: '24px',
                color: '#999999',
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Pushed by: {currentAlert.pushedToDisplayBy}</span>
                <span>Alert {currentAlertIndex + 1} of {pushedAlerts.length}</span>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              border: '2px solid #10b981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
              <h1 style={{ fontSize: '48px', color: '#10b981', margin: 0 }}>
                ALL CLEAR
              </h1>
              <p style={{ fontSize: '28px', color: '#666666', marginTop: '15px' }}>
                No alerts on display
              </p>
            </div>
          )}

          {/* Map */}
          <div style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid #333333',
            minHeight: '300px'
          }}>
            <OptimizedTomTomMap 
              alerts={pushedAlerts}
              currentAlert={currentAlert}
              alertIndex={currentAlertIndex}
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
          {/* Late Runners Widget */}
          {lateRunners && lateRunners.length > 0 && (
            <LateRunnersWidget 
              lateRunners={lateRunners}
              limit={5}
            />
          )}
          
          {/* Activity Panel */}
          <div style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #333333',
            display: 'flex',
            flexDirection: 'column'
          }}>
          <h2 style={{
            fontSize: '32px',
            marginBottom: '20px',
            color: '#ffffff'
          }}>
            SUPERVISOR ACTIVITY
          </h2>

          {/* Active Supervisors */}
          <div style={{
            marginBottom: '25px',
            backgroundColor: '#222222',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <h3 style={{ fontSize: '24px', color: '#10b981', marginBottom: '15px' }}>
              Active Personnel ({activeSupervisors?.length || 0})
            </h3>
            {activeSupervisors && activeSupervisors.length > 0 ? (
              activeSupervisors.map((supervisor, idx) => (
                <div key={idx} style={{
                  fontSize: '20px',
                  padding: '8px 0',
                  borderBottom: '1px solid #333333',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{supervisor.name}</span>
                  <span style={{ color: '#10b981' }}>{supervisor.isAdmin ? 'ADMIN' : 'ACTIVE'}</span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '18px', color: '#666666', textAlign: 'center', padding: '15px' }}>
                No active personnel
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '15px' }}>
              Recent Actions
            </h3>
            <div style={{ 
              overflowY: 'auto', 
              maxHeight: '400px',
              paddingRight: '5px'
            }}>
              {supervisorActivity && supervisorActivity.length > 0 ? (
                supervisorActivity.slice(0, 10).map((activity, idx) => (
                  <div key={activity._id} style={{
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: idx === 0 ? '#333333' : '#222222',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      activity.action === 'push_to_display' ? '#3B82F6' :
                      activity.action === 'dismiss_alert' ? '#F59E0B' :
                      activity.action === 'login' ? '#10B981' : '#666666'
                    }`
                  }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '3px' }}>
                      {activity.supervisorName}
                    </div>
                    <div style={{ fontSize: '16px', color: '#cccccc' }}>
                      {formatActivityAction(activity)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#999999', marginTop: '3px' }}>
                      {formatTime24(activity.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '18px', color: '#666666', textAlign: 'center', padding: '30px' }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>
          </div>
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

// Helper function to format activity action
const formatActivityAction = (action) => {
  switch (action.action) {
    case 'login':
      return `logged in as ${action.role || 'Supervisor'}`;
    case 'logout':
      return `logged out`;
    case 'dismiss_alert':
      return `dismissed alert: ${action.reason || 'No reason provided'}`;
    case 'push_to_display':
      return `pushed alert to display`;
    case 'remove_from_display':
      return `removed alert from display`;
    case 'create_roadwork':
      return `created roadwork at ${action.details?.location || 'unknown location'}`;
    case 'create_incident':
      return `created ${action.details?.type || 'incident'}`;
    default:
      return action.action.replace(/_/g, ' ');
  }
};

export default DisplayScreen;