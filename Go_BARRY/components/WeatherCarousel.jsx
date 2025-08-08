import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WeatherCarousel = ({ theme = 'light' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(10000);
  const [error, setError] = useState(null);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/weather/multi-location`);
        const data = await response.json();
        
        if (data.success) {
          setWeatherData(data);
          setError(null);
        } else {
          setError('Weather data unavailable');
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Failed to load weather');
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Get locations to display (prioritized)
  const displayLocations = useMemo(() => {
    if (!weatherData?.locations) return [];
    
    // Sort by priority, then alphabetically
    return [...weatherData.locations].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
  }, [weatherData]);

  // Current location to display
  const currentLocation = displayLocations[currentLocationIndex];
  
  // Check if current location has severe weather
  const hasSevereWeather = useMemo(() => {
    if (!currentLocation) return false;
    
    const alerts = weatherData?.alerts?.filter(
      alert => alert.location === currentLocation.name && alert.severity === 'HIGH'
    );
    
    return alerts?.length > 0;
  }, [currentLocation, weatherData]);

  // Rotate through locations
  useEffect(() => {
    if (!displayLocations.length) return;

    // Set duration based on weather severity
    const duration = hasSevereWeather ? 30000 : 10000;
    setDisplayDuration(duration);

    const timer = setTimeout(() => {
      setCurrentLocationIndex((prev) => 
        prev + 1 >= displayLocations.length ? 0 : prev + 1
      );
    }, duration);

    return () => clearTimeout(timer);
  }, [currentLocationIndex, displayLocations, hasSevereWeather]);

  // Get weather icon
  const getWeatherIcon = (condition) => {
    const icons = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️'
    };
    return icons[condition] || '🌡️';
  };

  // Get wind direction
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(degrees / 45) % 8];
  };

  if (error) {
    return (
      <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
        <Text style={[styles.errorText, theme === 'dark' && styles.textDark]}>
          {error}
        </Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={[styles.container, theme === 'dark' && styles.containerDark]}>
        <Text style={[styles.loadingText, theme === 'dark' && styles.textDark]}>
          Loading weather...
        </Text>
      </View>
    );
  }

  const isSevere = hasSevereWeather;
  const relevantAlerts = weatherData?.alerts?.filter(
    alert => alert.location === currentLocation.name
  ) || [];

  return (
    <View style={[
      styles.container,
      theme === 'dark' && styles.containerDark,
      isSevere && styles.severeWeather
    ]}>
      <View style={styles.mainContent}>
        <View style={styles.locationInfo}>
          <Text style={[
            styles.locationName,
            theme === 'dark' && styles.textDark,
            isSevere && styles.severeText
          ]}>
            {currentLocation.name}
          </Text>
          <Text style={[styles.weatherIcon, isSevere && styles.severeIcon]}>
            {getWeatherIcon(currentLocation.current.condition)}
          </Text>
        </View>

        <View style={styles.weatherDetails}>
          <Text style={[
            styles.temperature,
            theme === 'dark' && styles.textDark,
            isSevere && styles.severeText
          ]}>
            {currentLocation.current.temp}°C
          </Text>
          <Text style={[
            styles.condition,
            theme === 'dark' && styles.textSecondaryDark
          ]}>
            {currentLocation.current.description}
          </Text>
        </View>

        <View style={styles.additionalInfo}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, theme === 'dark' && styles.textSecondaryDark]}>
              Wind
            </Text>
            <Text style={[
              styles.infoValue,
              theme === 'dark' && styles.textDark,
              currentLocation.current.wind.speed > 30 && styles.warningText
            ]}>
              {currentLocation.current.wind.speed} mph {getWindDirection(currentLocation.current.wind.direction)}
            </Text>
          </View>
          
          {currentLocation.current.rain > 0 && (
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, theme === 'dark' && styles.textSecondaryDark]}>
                Rain
              </Text>
              <Text style={[styles.infoValue, theme === 'dark' && styles.textDark]}>
                {currentLocation.current.rain} mm/hr
              </Text>
            </View>
          )}
        </View>

        {/* Weather change alert */}
        {currentLocation.nextHour?.change?.length > 0 && (
          <View style={styles.changeAlert}>
            <Text style={[styles.changeText, theme === 'dark' && styles.textDark]}>
              ⚠️ {currentLocation.nextHour.change[0].to} expected within 1 hour
            </Text>
          </View>
        )}
      </View>

      {/* Severe weather alerts */}
      {relevantAlerts.length > 0 && (
        <View style={styles.alertSection}>
          {relevantAlerts.map((alert, index) => (
            <Text key={index} style={styles.alertText}>
              ⚠️ {alert.message}
            </Text>
          ))}
        </View>
      )}

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { 
          width: '100%',
          animationDuration: `${displayDuration}ms`
        }]} />
      </View>

      {/* Location indicator */}
      <View style={styles.locationIndicator}>
        {displayLocations.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentLocationIndex && styles.activeDot,
              theme === 'dark' && styles.dotDark
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
    shadowOpacity: 0.3
  },
  severeWeather: {
    borderWidth: 3,
    borderColor: '#dc2626'
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  locationName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 12
  },
  weatherIcon: {
    fontSize: 48
  },
  severeIcon: {
    fontSize: 56
  },
  weatherDetails: {
    alignItems: 'center',
    marginHorizontal: 20
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  condition: {
    fontSize: 20,
    color: '#666666',
    textTransform: 'capitalize'
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 20
  },
  infoItem: {
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666'
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  warningText: {
    color: '#f59e0b'
  },
  severeText: {
    color: '#dc2626'
  },
  changeAlert: {
    position: 'absolute',
    bottom: -10,
    left: 20,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  changeText: {
    fontSize: 16,
    color: '#92400e'
  },
  alertSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5'
  },
  alertText: {
    fontSize: 18,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 4
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#e5e5e5',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
    animation: 'progress linear'
  },
  locationIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 20,
    flexDirection: 'row',
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db'
  },
  activeDot: {
    backgroundColor: '#3b82f6',
    width: 16
  },
  dotDark: {
    backgroundColor: '#4b5563'
  },
  textDark: {
    color: '#f5f5f5'
  },
  textSecondaryDark: {
    color: '#a0a0a0'
  },
  errorText: {
    fontSize: 24,
    color: '#666666',
    textAlign: 'center'
  },
  loadingText: {
    fontSize: 24,
    color: '#666666',
    textAlign: 'center'
  }
});

// Add CSS animation for progress bar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes progress {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}

export default WeatherCarousel;
