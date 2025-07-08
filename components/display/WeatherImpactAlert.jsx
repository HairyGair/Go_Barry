// Go_BARRY/components/display/WeatherImpactAlert.jsx
// Severe weather warning alert component for display screen

import React, { useState, useEffect } from 'react';

const WeatherImpactAlert = ({ weatherData, onAlertGenerated }) => {
  const [currentAlert, setCurrentAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    if (!weatherData) return;

    const alert = analyzeForSevereWeather(weatherData);
    if (alert && (!currentAlert || alert.severity !== currentAlert.severity)) {
      setCurrentAlert(alert);
      
      // Add to history
      setAlertHistory(prev => {
        const newHistory = [alert, ...prev.slice(0, 9)]; // Keep last 10 alerts
        return newHistory;
      });

      // Notify parent component
      if (onAlertGenerated) {
        onAlertGenerated(alert);
      }
    }
  }, [weatherData, currentAlert, onAlertGenerated]);

  // Auto-clear alert after duration
  useEffect(() => {
    if (!currentAlert) return;

    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, currentAlert.duration || 300000); // 5 minutes default

    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (!currentAlert) return null;

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'severe': return '#F59E0B';
      case 'moderate': return '#3B82F6';
      default: return '#10B981';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'ice': return '🧊';
      case 'snow': return '🌨️';
      case 'wind': return '💨';
      case 'fog': return '🌫️';
      case 'rain': return '🌧️';
      case 'temperature': return '🌡️';
      default: return '⚠️';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: getAlertColor(currentAlert.severity),
      color: '#ffffff',
      padding: '20px',
      borderRadius: '12px',
      border: '3px solid #ffffff',
      boxShadow: '0 0 30px rgba(0,0,0,0.5)',
      zIndex: 1000,
      minWidth: '400px',
      animation: 'slideIn 0.5s ease-out, pulse 2s infinite'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '40px' }}>
          {getAlertIcon(currentAlert.type)}
        </span>
        <div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {currentAlert.severity.toUpperCase()} WEATHER ALERT
          </div>
          <div style={{
            fontSize: '14px',
            opacity: 0.9
          }}>
            {currentAlert.location}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '16px',
        marginBottom: '10px',
        lineHeight: '1.4'
      }}>
        {currentAlert.message}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        opacity: 0.8
      }}>
        <div>
          Impact: {currentAlert.impact}
        </div>
        <div>
          {new Date(currentAlert.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.9; 
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
};

// Analyze weather data for severe conditions
const analyzeForSevereWeather = (weatherData) => {
  const alerts = [];

  // Check all locations
  Object.entries(weatherData.locations || {}).forEach(([location, weather]) => {
    const temp = weather.tempC;
    const condition = weather.condition?.toLowerCase() || '';
    const windSpeed = weather.windSpeedMph || 0;

    // Ice conditions - Critical
    if (temp <= -2) {
      alerts.push({
        severity: 'critical',
        type: 'ice',
        location,
        message: `Severe ice risk at ${temp}°C. All routes affected.`,
        impact: 'Major delays expected',
        timestamp: new Date().toISOString(),
        duration: 600000 // 10 minutes
      });
    }
    // Frost conditions - Severe
    else if (temp <= 1) {
      alerts.push({
        severity: 'severe',
        type: 'temperature',
        location,
        message: `Frost risk at ${temp}°C. Caution on elevated routes.`,
        impact: 'Possible delays',
        timestamp: new Date().toISOString(),
        duration: 300000 // 5 minutes
      });
    }

    // Snow conditions - Critical
    if (condition.includes('snow')) {
      alerts.push({
        severity: 'critical',
        type: 'snow',
        location,
        message: `Active snowfall affecting ${location}. Severe delays expected.`,
        impact: 'Major service disruption',
        timestamp: new Date().toISOString(),
        duration: 900000 // 15 minutes
      });
    }

    // Heavy rain with cold temperatures
    if (condition.includes('rain') && temp <= 4) {
      alerts.push({
        severity: 'moderate',
        type: 'rain',
        location,
        message: `Cold rain at ${temp}°C. Slippery conditions likely.`,
        impact: 'Minor delays possible',
        timestamp: new Date().toISOString(),
        duration: 300000 // 5 minutes
      });
    }

    // Fog conditions
    if (condition.includes('fog') || condition.includes('mist')) {
      alerts.push({
        severity: 'moderate',
        type: 'fog',
        location,
        message: `Poor visibility due to fog/mist in ${location}.`,
        impact: 'Reduced speeds, minor delays',
        timestamp: new Date().toISOString(),
        duration: 300000 // 5 minutes
      });
    }
  });

  // High wind conditions
  const wind = weatherData.redheughBridge;
  if (wind?.windSpeedMph > 45) {
    alerts.push({
      severity: 'critical',
      type: 'wind',
      location: 'Redheugh Bridge',
      message: `Extreme wind speeds: ${wind.windSpeedMph}mph. Bridge closure likely.`,
      impact: 'Major route disruption',
      timestamp: new Date().toISOString(),
      duration: 900000 // 15 minutes
    });
  } else if (wind?.windSpeedMph > 35) {
    alerts.push({
      severity: 'severe',
      type: 'wind',
      location: 'Redheugh Bridge',
      message: `High wind speeds: ${wind.windSpeedMph}mph. Use caution.`,
      impact: 'Possible route restrictions',
      timestamp: new Date().toISOString(),
      duration: 600000 // 10 minutes
    });
  }

  // Return highest severity alert
  if (alerts.length === 0) return null;
  
  const severityOrder = { 'critical': 0, 'severe': 1, 'moderate': 2, 'minor': 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  return alerts[0];
};

export default WeatherImpactAlert;