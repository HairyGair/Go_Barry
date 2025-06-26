// Go_BARRY/components/DisplayScreen.jsx
// Control Room Display - Optimized for 60 metre viewing distance

import React, { useState, useEffect } from 'react';
import OptimizedTomTomMap from './OptimizedTomTomMap';
import { useConvexSync } from '../hooks/useConvexSync';
import { formatTime24WithSeconds, formatDateWithWeekday } from '../utils/dateTime';
import LateRunnersWidget from './LateRunnersWidget';

const DisplayScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLocationIndex, setWeatherLocationIndex] = useState(0);
  const weatherLocations = ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Consett', 'Stanley'];

  // Use Convex for real-time sync
  const convexData = useConvexSync();
  const pushedAlerts = convexData?.pushedAlerts || [];
  const activeSupervisors = convexData?.activeSupervisors || [];
  const vixData = convexData?.vixData;
  
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
    if (!pushedAlerts || !Array.isArray(pushedAlerts) || pushedAlerts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % pushedAlerts.length);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [pushedAlerts?.length]);

  const getCurrentAlert = () => {
    if (!pushedAlerts || !Array.isArray(pushedAlerts) || !pushedAlerts.length || currentAlertIndex >= pushedAlerts.length) return null;
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
          {/* Current Alert */}
          {currentAlert ? (
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              padding: '25px',
              border: '3px solid #ff0000',
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

              {currentAlert.affectsRoutes && Array.isArray(currentAlert.affectsRoutes) && currentAlert.affectsRoutes.length > 0 && (
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
              border: '3px solid #10b981',
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
            border: '3px solid #333333',
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

        {/* Right Side Panel - Only show if there are late runners */}
        {lateRunners && Array.isArray(lateRunners) && lateRunners.length > 0 && (
          <div style={{
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <LateRunnersWidget 
              lateRunners={lateRunners}
              limit={5}
            />
          </div>
        )}
      </div>

      {/* Supervisor Status Box - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #333333',
        borderRadius: '8px',
        padding: '15px 20px',
        minWidth: '200px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          fontSize: '18px',
          color: '#999999',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          ACTIVE SUPERVISORS
        </div>
        {activeSupervisors && activeSupervisors.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            {activeSupervisors.map((supervisor) => (
              <div key={supervisor.badge} style={{
                fontSize: '16px',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#10b981' }}>●</span>
                <span>{supervisor.supervisorName} ({supervisor.badge})</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '16px',
            color: '#666666'
          }}>
            No supervisors online
          </div>
        )}
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

export default DisplayScreen;