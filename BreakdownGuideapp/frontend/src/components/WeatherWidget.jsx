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

import React, { useEffect, useState } from 'react';
import './WeatherWidget.css';

// Northeast England towns and villages
const LOCATIONS = [
  { name: 'Newcastle', city: 'Newcastle upon Tyne,uk', display: 'Newcastle upon Tyne' },
  { name: 'Gateshead', city: 'Gateshead,uk', display: 'Gateshead' },
  { name: 'Sunderland', city: 'Sunderland,uk', display: 'Sunderland' },
  { name: 'Durham', city: 'Durham,uk', display: 'Durham' },
  { name: 'Middlesbrough', city: 'Middlesbrough,uk', display: 'Middlesbrough' },
  { name: 'Darlington', city: 'Darlington,uk', display: 'Darlington' },
  { name: 'Hartlepool', city: 'Hartlepool,uk', display: 'Hartlepool' },
  { name: 'Stockton', city: 'Stockton-on-Tees,uk', display: 'Stockton-on-Tees' },
  { name: 'Hexham', city: 'Hexham,uk', display: 'Hexham' },
  { name: 'Alnwick', city: 'Alnwick,uk', display: 'Alnwick' },
  { name: 'Berwick', city: 'Berwick-upon-Tweed,uk', display: 'Berwick-upon-Tweed' },
  { name: 'Morpeth', city: 'Morpeth,uk', display: 'Morpeth' },
  { name: 'Blyth', city: 'Blyth,uk', display: 'Blyth' },
  { name: 'Cramlington', city: 'Cramlington,uk', display: 'Cramlington' },
  { name: 'Whitley Bay', city: 'Whitley Bay,uk', display: 'Whitley Bay' },
  { name: 'Tynemouth', city: 'Tynemouth,uk', display: 'Tynemouth' },
  { name: 'South Shields', city: 'South Shields,uk', display: 'South Shields' },
  { name: 'Washington', city: 'Washington,uk', display: 'Washington' },
  { name: 'Chester-le-Street', city: 'Chester-le-Street,uk', display: 'Chester-le-Street' },
  { name: 'Consett', city: 'Consett,uk', display: 'Consett' },
  { name: 'Bishop Auckland', city: 'Bishop Auckland,uk', display: 'Bishop Auckland' },
  { name: 'Newton Aycliffe', city: 'Newton Aycliffe,uk', display: 'Newton Aycliffe' },
  { name: 'Seaham', city: 'Seaham,uk', display: 'Seaham' },
  { name: 'Peterlee', city: 'Peterlee,uk', display: 'Peterlee' },
  { name: 'Redcar', city: 'Redcar,uk', display: 'Redcar' },
  { name: 'Guisborough', city: 'Guisborough,uk', display: 'Guisborough' },
  { name: 'Billingham', city: 'Billingham,uk', display: 'Billingham' },
  { name: 'Sedgefield', city: 'Sedgefield,uk', display: 'Sedgefield' },
  { name: 'Barnard Castle', city: 'Barnard Castle,uk', display: 'Barnard Castle' },
  { name: 'Corbridge', city: 'Corbridge,uk', display: 'Corbridge' }
];

const ROTATION_INTERVAL = 5000; // 5 seconds
const CACHE_DURATION = 600000; // 10 minutes

const WeatherWidget = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);

  const currentLocation = LOCATIONS[currentIndex];

  // Get weather emoji based on condition
  const getWeatherEmoji = (condition) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '☀️';
    if (conditionLower.includes('cloud')) return '⛅';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⚡';
    return '🌤️';
  };

  // Get color based on weather condition
  const getWeatherColor = (condition) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return '#F59E0B';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return '#3B82F6';
    if (conditionLower.includes('snow')) return '#60A5FA';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '#8B5CF6';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '#9CA3AF';
    return '#10B981';
  };

  // Fetch weather data for a specific location
  const fetchWeatherForLocation = async (location) => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey) {
      console.warn('OpenWeatherMap API key not configured');
      return null;
    }

    // Check cache first
    const cacheKey = `weather_${location.name}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${location.city}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error('Weather data unavailable');
      }

      const data = await response.json();
      const weatherInfo = {
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        windSpeed: Math.round(data.wind.speed * 2.237), // Convert m/s to mph
        humidity: data.main.humidity
      };

      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data: weatherInfo,
        timestamp: Date.now()
      }));

      return weatherInfo;
    } catch (err) {
      console.error(`Error fetching weather for ${location.name}:`, err);
      return null;
    }
  };

  // Load initial weather data for all locations
  useEffect(() => {
    const loadAllWeather = async () => {
      setLoading(true);
      const weatherCache = {};

      for (const location of LOCATIONS) {
        const data = await fetchWeatherForLocation(location);
        if (data) {
          weatherCache[location.name] = data;
        }
      }

      setWeatherData(weatherCache);
      setLoading(false);

      // If no data loaded, show error
      if (Object.keys(weatherCache).length === 0) {
        setError('Weather data unavailable');
      }
    };

    loadAllWeather();

    // Refresh all weather data every 10 minutes
    const refreshInterval = setInterval(loadAllWeather, CACHE_DURATION);
    return () => clearInterval(refreshInterval);
  }, []);

  // Rotation logic with fade transition
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setFadeIn(false);

      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % LOCATIONS.length);
        setFadeIn(true);
      }, 300); // Half of CSS transition time
    }, ROTATION_INTERVAL);

    return () => clearInterval(rotateInterval);
  }, []);

  if (loading) {
    return (
      <div className="weather-widget weather-skeleton">
        <div className="skeleton-header">
          <div className="skeleton-line skeleton-location"></div>
          <div className="skeleton-line skeleton-counter"></div>
        </div>
        <div className="skeleton-main">
          <div className="skeleton-icon"></div>
          <div className="skeleton-line skeleton-temp"></div>
        </div>
        <div className="skeleton-line skeleton-condition"></div>
        <div className="skeleton-details">
          <div className="skeleton-line skeleton-detail"></div>
          <div className="skeleton-line skeleton-detail"></div>
        </div>
      </div>
    );
  }

  if (error || Object.keys(weatherData).length === 0) {
    return (
      <div className="weather-widget error">
        <div className="weather-icon">🌤️</div>
        <p className="weather-error-message">Weather data unavailable</p>
      </div>
    );
  }

  const weather = weatherData[currentLocation.name];
  if (!weather) {
    return (
      <div className="weather-widget error">
        <div className="weather-icon">🌤️</div>
        <p className="weather-error-message">Weather data unavailable</p>
      </div>
    );
  }

  const weatherColor = getWeatherColor(weather.condition);

  return (
    <div
      className={`weather-widget ${fadeIn ? 'fade-in' : 'fade-out'}`}
      style={{ '--weather-color': weatherColor }}
    >
      <div className="weather-header">
        <div className="weather-location-name">{currentLocation.display}</div>
        <div className="weather-rotation-indicator">
          <span className="rotation-counter">{currentIndex + 1} / {LOCATIONS.length}</span>
        </div>
      </div>

      <div className="weather-main">
        <div className="weather-temp-section">
          <div className="weather-icon-large">
            {getWeatherEmoji(weather.condition)}
          </div>
          <div className="weather-temp">{weather.temp}°C</div>
        </div>

        <div className="weather-condition">{weather.description}</div>
      </div>

      <div className="weather-details">
        <div className="weather-detail-item">
          <span className="weather-detail-icon">💨</span>
          <span className="weather-detail-label">Wind:</span>
          <span className="weather-detail-value">{weather.windSpeed} mph</span>
        </div>
        <div className="weather-detail-item">
          <span className="weather-detail-icon">💧</span>
          <span className="weather-detail-label">Humidity:</span>
          <span className="weather-detail-value">{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
