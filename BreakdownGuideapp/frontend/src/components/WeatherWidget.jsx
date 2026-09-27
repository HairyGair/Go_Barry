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

import React, { useEffect, useState, useMemo } from 'react';
import { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudFog, CloudLightning, Wind, Droplet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { isDemoSession, findDemoDepotByName, DEMO_DEPOTS } from '../config/demoDepots.js';
import './WeatherWidget.css';

// Real (non-demo) sessions don't need a supervisor-specific forecast — a
// single sensible regional default (Newcastle area, matches the Operations
// map centre) is all that's asked for here.
const REGIONAL_DEFAULT_LOCATION = { name: 'North East England', lat: 54.9783, lng: -1.6178 };

const CACHE_DURATION = 600000; // 10 minutes

// Resolve where to fetch weather for: the current demo depot in a demo
// session, otherwise the fixed regional default.
function getWeatherLocation(currentUser) {
  if (isDemoSession()) {
    const depot = findDemoDepotByName(currentUser?.depot) || DEMO_DEPOTS[0];
    return { name: depot.name, lat: depot.lat, lng: depot.lng };
  }
  return REGIONAL_DEFAULT_LOCATION;
}

// WMO weather codes (Open-Meteo) -> icon + short label.
// https://open-meteo.com/en/docs (Weather variable documentation)
function describeWeatherCode(code) {
  if (code === 0) return { label: 'Clear sky', Icon: Sun, color: '#F59E0B' };
  if (code === 1 || code === 2) return { label: 'Partly cloudy', Icon: CloudSun, color: '#F59E0B' };
  if (code === 3) return { label: 'Overcast', Icon: Cloud, color: '#94A3B8' };
  if (code === 45 || code === 48) return { label: 'Fog', Icon: CloudFog, color: '#9CA3AF' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { label: 'Rain', Icon: CloudRain, color: '#3B82F6' };
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', Icon: Snowflake, color: '#60A5FA' };
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', Icon: CloudLightning, color: '#8B5CF6' };
  return { label: 'Cloudy', Icon: CloudSun, color: '#94A3B8' };
}

/**
 * Compact header weather chip by default (icon + temp, tooltip with detail).
 * Pass `compact={false}` for the older full card presentation.
 * Uses Open-Meteo (keyless) instead of OpenWeatherMap, which required
 * VITE_WEATHER_API_KEY - never set in the production build, so the widget
 * always showed "Weather data unavailable" there. On any failure this now
 * renders nothing rather than a broken-looking card.
 */
const WeatherWidget = ({ compact = true }) => {
  const { currentUser } = useAuth();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const location = useMemo(() => getWeatherLocation(currentUser), [currentUser?.depot]);

  useEffect(() => {
    let cancelled = false;

    const cacheKey = `weather_openmeteo_${location.lat}_${location.lng}`;

    const load = async () => {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            if (!cancelled) {
              setWeather(data);
              setLoading(false);
            }
            return;
          }
        }
      } catch { /* ignore cache errors */ }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&wind_speed_unit=mph`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const current = data?.current;
        if (!current || typeof current.temperature_2m !== 'number') {
          throw new Error('Malformed response');
        }

        const info = {
          temp: Math.round(current.temperature_2m),
          code: current.weather_code,
          windSpeed: Math.round(current.wind_speed_10m || 0),
          humidity: current.relative_humidity_2m ?? null
        };

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: info, timestamp: Date.now() }));
        } catch { /* ignore quota errors */ }

        if (!cancelled) {
          setWeather(info);
          setLoading(false);
        }
      } catch (error) {
        console.warn('Weather fetch failed:', error.message);
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    };

    load();
    const refreshInterval = setInterval(load, CACHE_DURATION);
    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, [location.lat, location.lng]);

  // Fails silently - hide rather than show a broken-looking card/chip.
  if (failed || (!loading && !weather)) return null;

  if (compact) {
    if (loading) {
      return <div className="ww-compact ww-compact--loading" aria-hidden="true" />;
    }
    const { label, Icon, color } = describeWeatherCode(weather.code);
    return (
      <div
        className="ww-compact"
        title={`${location.name}: ${label}, wind ${weather.windSpeed}mph${weather.humidity != null ? `, humidity ${weather.humidity}%` : ''}`}
      >
        <Icon size={17} style={{ color }} strokeWidth={1.75} />
        <span className="ww-compact-temp">{weather.temp}&deg;</span>
        <span className="ww-compact-location">{location.name}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="weather-widget weather-skeleton">
        <div className="skeleton-header">
          <div className="skeleton-line skeleton-location"></div>
        </div>
        <div className="skeleton-main">
          <div className="skeleton-icon"></div>
          <div className="skeleton-line skeleton-temp"></div>
        </div>
        <div className="skeleton-line skeleton-condition"></div>
      </div>
    );
  }

  const { label, Icon, color } = describeWeatherCode(weather.code);

  return (
    <div className="weather-widget fade-in" style={{ '--weather-color': color }}>
      <div className="weather-header">
        <div className="weather-location-name">{location.name}</div>
      </div>

      <div className="weather-main">
        <div className="weather-temp-section">
          <div className="weather-icon-large">
            <Icon size={36} strokeWidth={1.75} />
          </div>
          <div className="weather-temp">{weather.temp}&deg;C</div>
        </div>
        <div className="weather-condition">{label}</div>
      </div>

      <div className="weather-details">
        <div className="weather-detail-item">
          <span className="weather-detail-icon"><Wind size={13} /></span>
          <span className="weather-detail-label">Wind:</span>
          <span className="weather-detail-value">{weather.windSpeed} mph</span>
        </div>
        {weather.humidity != null && (
          <div className="weather-detail-item">
            <span className="weather-detail-icon"><Droplet size={13} /></span>
            <span className="weather-detail-label">Humidity:</span>
            <span className="weather-detail-value">{weather.humidity}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;
