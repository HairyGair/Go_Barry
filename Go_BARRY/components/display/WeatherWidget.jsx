// Go_BARRY/components/display/WeatherWidget.jsx
// Comprehensive weather widget for display screen with transport impact analysis

import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ weatherData, isActive = true }) => {
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [showImpactDetails, setShowImpactDetails] = useState(false);

  // Locations in priority order for display
  const locationOrder = ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Consett', 'Stanley'];
  
  // Cycle through locations every 8 seconds when active
  useEffect(() => {
    if (!isActive || !weatherData?.locations) return;
    
    const interval = setInterval(() => {
      setCurrentLocationIndex((prev) => (prev + 1) % locationOrder.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [isActive, weatherData?.locations]);

  // Toggle between current conditions and impact details every 15 seconds
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setShowImpactDetails((prev) => !prev);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isActive]);

  if (!weatherData) {
    return <WeatherLoadingState />;
  }

  const currentLocation = locationOrder[currentLocationIndex];
  const currentWeather = weatherData.locations?.[currentLocation];
  const redheughWind = weatherData.redheughBridge;
  const weatherAlerts = weatherData.alerts || [];

  // Analyze transport impact
  const transportImpact = analyzeTransportImpact(weatherData);

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      border: '3px solid #333333',
      overflow: 'hidden',
      height: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with alerts */}
      <WeatherHeader 
        alerts={weatherAlerts}
        redheughWind={redheughWind}
        transportImpact={transportImpact}
      />

      {/* Main content - alternates between current conditions and impact */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showImpactDetails ? (
          <WeatherImpactPanel 
            transportImpact={transportImpact}
            weatherData={weatherData}
          />
        ) : (
          <CurrentConditionsPanel 
            currentLocation={currentLocation}
            currentWeather={currentWeather}
            allLocations={weatherData.locations}
            locationIndex={currentLocationIndex}
            totalLocations={locationOrder.length}
          />
        )}
      </div>

      {/* Footer with rotation indicator */}
      <WeatherFooter 
        showingImpact={showImpactDetails}
        currentLocation={currentLocation}
        lastUpdate={weatherData.lastUpdate}
      />
    </div>
  );
};

// Weather Header Component
const WeatherHeader = ({ alerts, redheughWind, transportImpact }) => {
  const hasHighWind = redheughWind?.windSpeedMph > 30;
  const hasSevereImpact = transportImpact.severity === 'high';
  const hasAlerts = alerts.length > 0 || hasHighWind || hasSevereImpact;

  const getHeaderColor = () => {
    if (hasHighWind && redheughWind.windSpeedMph > 40) return '#DC2626'; // Critical
    if (hasHighWind || hasSevereImpact) return '#F59E0B'; // Warning
    if (transportImpact.severity === 'medium') return '#3B82F6'; // Caution
    return '#333333'; // Normal
  };

  return (
    <div style={{
      backgroundColor: getHeaderColor(),
      padding: '12px 20px',
      borderBottom: '2px solid #444'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '22px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🌤️ WEATHER CONDITIONS
          {hasAlerts && (
            <span style={{
              fontSize: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '4px 8px',
              borderRadius: '12px',
              animation: hasHighWind ? 'pulse 2s infinite' : 'none'
            }}>
              {hasHighWind ? 'HIGH WIND' : 'IMPACT'}
            </span>
          )}
        </h3>
        
        {hasHighWind && (
          <div style={{
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: 'bold'
          }}>
            💨 Redheugh: {redheughWind.windSpeedMph}mph
          </div>
        )}
      </div>
    </div>
  );
};

// Current Conditions Panel
const CurrentConditionsPanel = ({ 
  currentLocation, 
  currentWeather, 
  allLocations, 
  locationIndex, 
  totalLocations 
}) => {
  if (!currentWeather) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#666',
        fontSize: '18px'
      }}>
        Weather data unavailable for {currentLocation}
      </div>
    );
  }

  // Get all temperatures for comparison
  const allTemps = Object.values(allLocations).map(loc => loc.tempC).filter(Boolean);
  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);
  const avgTemp = Math.round(allTemps.reduce((a, b) => a + b, 0) / allTemps.length);

  return (
    <div style={{ flex: 1, padding: '20px' }}>
      {/* Current Location Large Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '10px'
        }}>
          {currentWeather.icon}
        </div>
        
        <div style={{
          fontSize: '36px',
          color: '#ffffff',
          fontWeight: 'bold',
          marginBottom: '5px'
        }}>
          {currentLocation}
        </div>
        
        <div style={{
          fontSize: '42px',
          color: getTemperatureColor(currentWeather.tempC),
          fontWeight: 'bold',
          marginBottom: '5px'
        }}>
          {currentWeather.tempC}°C
        </div>
        
        <div style={{
          fontSize: '18px',
          color: '#cccccc',
          textTransform: 'capitalize'
        }}>
          {currentWeather.description}
        </div>
      </div>

      {/* Regional Summary */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        padding: '15px',
        border: '2px solid #444'
      }}>
        <div style={{
          fontSize: '16px',
          color: '#F59E0B',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          NORTH EAST REGION
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          fontSize: '14px',
          color: '#cccccc'
        }}>
          <div>
            <div style={{ color: '#999', fontSize: '12px' }}>RANGE</div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
              {minTemp}° - {maxTemp}°C
            </div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: '12px' }}>AVERAGE</div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
              {avgTemp}°C
            </div>
          </div>
          <div>
            <div style={{ color: '#999', fontSize: '12px' }}>CONDITIONS</div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
              {getMostCommonCondition(allLocations)}
            </div>
          </div>
        </div>
      </div>

      {/* Location indicator */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        fontSize: '14px',
        color: '#666'
      }}>
        Location {locationIndex + 1} of {totalLocations}
      </div>
    </div>
  );
};

// Weather Impact Panel
const WeatherImpactPanel = ({ transportImpact, weatherData }) => {
  return (
    <div style={{ flex: 1, padding: '20px' }}>
      <div style={{
        fontSize: '20px',
        color: '#F59E0B',
        marginBottom: '15px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        🚌 TRANSPORT IMPACT ANALYSIS
      </div>

      {/* Impact Level Indicator */}
      <div style={{
        backgroundColor: getImpactBackgroundColor(transportImpact.severity),
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        border: `2px solid ${getImpactBorderColor(transportImpact.severity)}`,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '24px',
          color: '#ffffff',
          fontWeight: 'bold',
          marginBottom: '5px'
        }}>
          {getImpactIcon(transportImpact.severity)} {transportImpact.severity.toUpperCase()} IMPACT
        </div>
        <div style={{
          fontSize: '16px',
          color: '#cccccc'
        }}>
          {transportImpact.summary}
        </div>
      </div>

      {/* Specific Impacts */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {transportImpact.impacts.map((impact, index) => (
          <div key={index} style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid #444',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>{impact.icon}</span>
            <div>
              <div style={{
                fontSize: '16px',
                color: '#ffffff',
                fontWeight: 'bold'
              }}>
                {impact.type}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#cccccc'
              }}>
                {impact.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {transportImpact.impacts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          color: '#666',
          fontSize: '18px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
          <div>No weather-related transport impacts</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Current conditions favorable for operations
          </div>
        </div>
      )}
    </div>
  );
};

// Weather Footer
const WeatherFooter = ({ showingImpact, currentLocation, lastUpdate }) => {
  const updateTime = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Unknown';
  
  return (
    <div style={{
      padding: '10px 20px',
      borderTop: '1px solid #333',
      backgroundColor: '#2a2a2a',
      fontSize: '12px',
      color: '#666',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        {showingImpact ? '📊 Impact Analysis' : `📍 ${currentLocation}`}
      </div>
      <div>
        Updated: {updateTime}
      </div>
    </div>
  );
};

// Weather Loading State
const WeatherLoadingState = () => (
  <div style={{
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    border: '3px solid #333333',
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '15px'
  }}>
    <div style={{ fontSize: '48px' }}>🌤️</div>
    <div style={{ fontSize: '18px', color: '#666' }}>Loading weather data...</div>
  </div>
);

// Utility Functions
const getTemperatureColor = (temp) => {
  if (temp <= 0) return '#3B82F6'; // Freezing - Blue
  if (temp <= 5) return '#06B6D4'; // Cold - Cyan
  if (temp <= 15) return '#10B981'; // Cool - Green
  if (temp <= 25) return '#F59E0B'; // Warm - Orange
  return '#DC2626'; // Hot - Red
};

const getMostCommonCondition = (locations) => {
  const conditions = Object.values(locations).map(loc => loc.condition).filter(Boolean);
  const conditionCounts = conditions.reduce((acc, condition) => {
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {});
  
  return Object.keys(conditionCounts).reduce((a, b) => 
    conditionCounts[a] > conditionCounts[b] ? a : b
  ) || 'Mixed';
};

const analyzeTransportImpact = (weatherData) => {
  const impacts = [];
  let severity = 'low';

  // Check all locations for weather impacts
  Object.entries(weatherData.locations || {}).forEach(([location, weather]) => {
    const temp = weather.tempC;
    const condition = weather.condition?.toLowerCase() || '';

    // Temperature impacts
    if (temp <= -2) {
      impacts.push({
        type: 'Ice Risk',
        description: `${location}: ${temp}°C - High risk of icy roads`,
        icon: '🧊',
        severity: 'high'
      });
      severity = 'high';
    } else if (temp <= 2) {
      impacts.push({
        type: 'Frost Warning',
        description: `${location}: ${temp}°C - Possible frost on roads`,
        icon: '❄️',
        severity: 'medium'
      });
      if (severity === 'low') severity = 'medium';
    }

    // Condition impacts
    if (condition.includes('snow')) {
      impacts.push({
        type: 'Snow Alert',
        description: `${location}: Snow affecting road conditions`,
        icon: '🌨️',
        severity: 'high'
      });
      severity = 'high';
    } else if (condition.includes('rain') && temp <= 5) {
      impacts.push({
        type: 'Wet & Cold',
        description: `${location}: Rain with low temperatures`,
        icon: '🌧️',
        severity: 'medium'
      });
      if (severity === 'low') severity = 'medium';
    } else if (condition.includes('fog') || condition.includes('mist')) {
      impacts.push({
        type: 'Poor Visibility',
        description: `${location}: Fog/mist reducing visibility`,
        icon: '🌫️',
        severity: 'medium'
      });
      if (severity === 'low') severity = 'medium';
    }
  });

  // Wind impacts
  const wind = weatherData.redheughBridge;
  if (wind?.windSpeedMph > 40) {
    impacts.push({
      type: 'Critical Wind',
      description: `Redheugh Bridge: ${wind.windSpeedMph}mph - Severe conditions`,
      icon: '💨',
      severity: 'high'
    });
    severity = 'high';
  } else if (wind?.windSpeedMph > 30) {
    impacts.push({
      type: 'High Wind',
      description: `Redheugh Bridge: ${wind.windSpeedMph}mph - Caution advised`,
      icon: '🌪️',
      severity: 'medium'
    });
    if (severity === 'low') severity = 'medium';
  }

  const getSummary = () => {
    if (severity === 'high') return 'Significant weather impacts on operations';
    if (severity === 'medium') return 'Moderate weather impacts - monitor conditions';
    return 'Minimal weather impact on operations';
  };

  return {
    severity,
    summary: getSummary(),
    impacts: impacts.slice(0, 4) // Limit to 4 most important impacts
  };
};

const getImpactIcon = (severity) => {
  switch (severity) {
    case 'high': return '🚨';
    case 'medium': return '⚠️';
    default: return '✅';
  }
};

const getImpactBackgroundColor = (severity) => {
  switch (severity) {
    case 'high': return '#DC2626';
    case 'medium': return '#F59E0B';
    default: return '#10B981';
  }
};

const getImpactBorderColor = (severity) => {
  switch (severity) {
    case 'high': return '#EF4444';
    case 'medium': return '#FBBF24';
    default: return '#34D399';
  }
};

export default WeatherWidget;