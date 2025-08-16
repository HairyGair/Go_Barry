import axios from 'axios';
import NodeCache from 'node-cache';

// Cache weather data for 5 minutes
const weatherCache = new NodeCache({ stdTTL: 300 });

// Weather locations for North East England
const WEATHER_LOCATIONS = [
  { name: "Newcastle", lat: 54.9783, lon: -1.6178, priority: 1 },
  { name: "Sunderland", lat: 54.9061, lon: -1.3811, priority: 1 },
  { name: "Durham", lat: 54.7753, lon: -1.5849, priority: 1 },
  { name: "Gateshead", lat: 54.9527, lon: -1.6035, priority: 1 },
  { name: "South Shields", lat: 54.9985, lon: -1.4323, priority: 2 },
  { name: "Consett", lat: 54.8543, lon: -1.8314, priority: 2 },
  { name: "Stanley", lat: 54.8673, lon: -1.6983, priority: 2 },
  { name: "Whitley Bay", lat: 55.0394, lon: -1.4446, priority: 2 },
  { name: "Blyth", lat: 55.1272, lon: -1.5086, priority: 2 },
  { name: "Seaham", lat: 54.8390, lon: -1.3427, priority: 3 },
  { name: "Peterlee", lat: 54.7594, lon: -1.3316, priority: 3 },
  { name: "Houghton-le-Spring", lat: 54.8411, lon: -1.4686, priority: 3 },
  { name: "Penshaw", lat: 54.8885, lon: -1.4867, priority: 3 },
  { name: "East Rainton", lat: 54.8225, lon: -1.4815, priority: 3 },
  { name: "Fulwell", lat: 54.9300, lon: -1.3644, priority: 3 },
  { name: "Southwick", lat: 54.9202, lon: -1.4031, priority: 3 },
  { name: "Ryhope", lat: 54.8663, lon: -1.3698, priority: 3 },
  { name: "Middlesbrough", lat: 54.5742, lon: -1.2350, priority: 3 },
  { name: "Stockton", lat: 54.5653, lon: -1.3213, priority: 3 },
  { name: "Billingham", lat: 54.6057, lon: -1.2901, priority: 3 }
];

// Critical wind speed locations
const WIND_CRITICAL_LOCATIONS = [
  { name: "Redheugh Bridge", lat: 54.9625, lon: -1.6189, threshold: 40 },
  { name: "A1 Western Bypass", lat: 54.9250, lon: -1.6500, threshold: 50 },
  { name: "A19 Tyne Tunnel", lat: 54.9889, lon: -1.4572, threshold: 45 }
];

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.WEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getMultiLocationWeather() {
    const cacheKey = 'multi-location-weather';
    const cached = weatherCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Fetch current weather for all locations
      const weatherPromises = WEATHER_LOCATIONS.map(location => 
        this.getLocationWeather(location)
      );
      
      // Fetch wind data for critical locations
      const windPromises = WIND_CRITICAL_LOCATIONS.map(location =>
        this.getLocationWeather(location)
      );

      const [weatherResults, windResults] = await Promise.all([
        Promise.allSettled(weatherPromises),
        Promise.allSettled(windPromises)
      ]);

      // Process results
      const weatherData = weatherResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const windData = windResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .map((data, index) => ({
          ...data,
          threshold: WIND_CRITICAL_LOCATIONS[index].threshold,
          isHighWind: data.wind?.speed > WIND_CRITICAL_LOCATIONS[index].threshold
        }));

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        locations: weatherData,
        criticalWindLocations: windData,
        alerts: this.generateWeatherAlerts(weatherData, windData)
      };

      weatherCache.set(cacheKey, response);
      return response;
    } catch (error) {
      console.error('Weather service error:', error);
      return {
        success: false,
        error: 'Failed to fetch weather data',
        locations: [],
        criticalWindLocations: [],
        alerts: []
      };
    }
  }

  async getLocationWeather(location) {
    try {
      // Get current weather
      const currentUrl = `${this.baseUrl}/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${this.apiKey}`;
      const forecastUrl = `${this.baseUrl}/forecast?lat=${location.lat}&lon=${location.lon}&units=metric&cnt=8&appid=${this.apiKey}`;

      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(currentUrl),
        axios.get(forecastUrl)
      ]);

      const current = currentResponse.data;
      const forecast = forecastResponse.data;

      // Check for weather changes in next hour
      const nextHour = forecast.list[0];
      const weatherChange = this.detectWeatherChange(current, nextHour);

      return {
        name: location.name,
        priority: location.priority,
        coordinates: { lat: location.lat, lon: location.lon },
        current: {
          temp: Math.round(current.main.temp),
          feels_like: Math.round(current.main.feels_like),
          condition: current.weather[0].main,
          description: current.weather[0].description,
          icon: current.weather[0].icon,
          wind: {
            speed: Math.round(current.wind.speed * 2.237), // Convert m/s to mph
            direction: current.wind.deg,
            gust: current.wind.gust ? Math.round(current.wind.gust * 2.237) : null
          },
          visibility: current.visibility,
          rain: current.rain?.['1h'] || 0,
          snow: current.snow?.['1h'] || 0
        },
        nextHour: {
          condition: nextHour.weather[0].main,
          description: nextHour.weather[0].description,
          rain: nextHour.rain?.['3h'] || 0,
          snow: nextHour.snow?.['3h'] || 0,
          change: weatherChange
        }
      };
    } catch (error) {
      console.error(`Weather fetch error for ${location.name}:`, error);
      return {
        name: location.name,
        priority: location.priority,
        error: true,
        current: {
          temp: '--',
          condition: 'Unknown',
          description: 'Data unavailable'
        }
      };
    }
  }

  detectWeatherChange(current, forecast) {
    const changes = [];

    // Check for condition changes
    if (current.weather[0].main !== forecast.weather[0].main) {
      changes.push({
        type: 'condition',
        from: current.weather[0].main,
        to: forecast.weather[0].main,
        severity: this.getChangeSeverity(current.weather[0].main, forecast.weather[0].main)
      });
    }

    // Check for precipitation starting
    if (!current.rain && forecast.rain?.['3h'] > 0) {
      changes.push({
        type: 'rain_starting',
        amount: forecast.rain['3h'],
        severity: forecast.rain['3h'] > 5 ? 'high' : 'medium'
      });
    }

    if (!current.snow && forecast.snow?.['3h'] > 0) {
      changes.push({
        type: 'snow_starting',
        amount: forecast.snow['3h'],
        severity: 'high'
      });
    }

    return changes;
  }

  getChangeSeverity(from, to) {
    const severeConditions = ['Thunderstorm', 'Snow', 'Fog'];
    if (severeConditions.includes(to)) return 'high';
    if (to === 'Rain' && from === 'Clear') return 'medium';
    return 'low';
  }

  generateWeatherAlerts(weatherData, windData) {
    const alerts = [];

    // Check for severe weather conditions
    weatherData.forEach(location => {
      if (location.error) return;

      // Snow alert
      if (location.current.snow > 0) {
        alerts.push({
          type: 'SNOW',
          severity: 'HIGH',
          location: location.name,
          message: `Snow reported in ${location.name} - ${location.current.snow}mm/hr`,
          displayDuration: 30
        });
      }

      // Heavy rain alert
      if (location.current.rain > 10) {
        alerts.push({
          type: 'HEAVY_RAIN',
          severity: 'MEDIUM',
          location: location.name,
          message: `Heavy rain in ${location.name} - ${location.current.rain}mm/hr`,
          displayDuration: 20
        });
      }

      // Fog alert
      if (location.current.visibility < 1000) {
        alerts.push({
          type: 'FOG',
          severity: 'HIGH',
          location: location.name,
          message: `Dense fog in ${location.name} - visibility ${location.current.visibility}m`,
          displayDuration: 30
        });
      }

      // Weather change alerts
      location.nextHour?.change?.forEach(change => {
        if (change.severity === 'high') {
          alerts.push({
            type: 'WEATHER_CHANGE',
            severity: 'MEDIUM',
            location: location.name,
            message: `${location.name}: ${change.from} changing to ${change.to} within 1 hour`,
            displayDuration: 20
          });
        }
      });
    });

    // High wind alerts
    windData.forEach(location => {
      if (location.isHighWind) {
        alerts.push({
          type: 'HIGH_WIND',
          severity: 'HIGH',
          location: location.name,
          message: `High winds at ${location.name} - ${location.current.wind.speed}mph (threshold: ${location.threshold}mph)`,
          displayDuration: 30
        });
      }
    });

    return alerts;
  }
}

export default new WeatherService();
