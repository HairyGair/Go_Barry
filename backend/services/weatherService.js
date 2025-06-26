// Weather Service for Go BARRY - OpenWeatherMap Integration
// Provides weather data for display screen with focus on transport-affecting conditions

import fetch from 'node-fetch';

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache to reduce API calls
    this.dailyCallCount = 0;
    this.dailyCallLimit = 900; // Keep under 1000 to be safe
    this.lastResetDate = new Date().toDateString();
    
    // Working hours: 06:00 to 00:15 (next day)
    this.workingHoursStart = 6; // 6 AM
    this.workingHoursEnd = 0.25; // 12:15 AM (0:15)
    
    // Locations to monitor
    this.locations = [
      { name: 'Newcastle', lat: 54.9783, lon: -1.6178 },
      { name: 'Gateshead', lat: 54.9527, lon: -1.6034 },
      { name: 'Sunderland', lat: 54.9061, lon: -1.3811 },
      { name: 'Durham', lat: 54.7761, lon: -1.5733 },
      { name: 'Consett', lat: 54.8549, lon: -1.8321 },
      { name: 'Stanley', lat: 54.8679, lon: -1.6987 }
    ];
    
    // Redheugh Bridge coordinates
    this.redheughBridge = { lat: 54.9684, lon: -1.6220 };
    
    this.initialized = false;
  }

  async initialize() {
    if (!this.apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured');
      return false;
    }
    
    this.initialized = true;
    console.log('✅ Weather service initialized');
    return true;
  }

  // Reset daily counter if new day
  checkDailyReset() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCallCount = 0;
      this.lastResetDate = today;
      console.log('🔄 Weather API daily counter reset');
    }
  }

  // Check if current time is within working hours
  isWithinWorkingHours() {
    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    
    // Working hours: 06:00 to 00:15 (crosses midnight)
    // If current hour is >= 6 AM OR <= 0:15 AM, we're in working hours
    const isInWorkingHours = currentHour >= this.workingHoursStart || currentHour <= this.workingHoursEnd;
    
    if (!isInWorkingHours) {
      console.log(`🌙 Outside working hours (${currentHour.toFixed(2)}h). Weather API calls disabled.`);
    }
    
    return isInWorkingHours;
  }

  // Check if we can make more API calls
  canMakeAPICall() {
    this.checkDailyReset();
    
    // First check working hours
    if (!this.isWithinWorkingHours()) {
      return false;
    }
    
    if (this.dailyCallCount >= this.dailyCallLimit) {
      console.warn(`⚠️ Weather API daily limit reached: ${this.dailyCallCount}/${this.dailyCallLimit}`);
      return false;
    }
    return true;
  }

  // Get weather for all locations using bulk endpoint
  async getAllWeatherData() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.apiKey) {
        return this.getMockWeatherData();
      }
      
      // Check cache first
      const cacheKey = 'all-weather';
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('🎯 Weather data from cache, API calls saved');
        return cached.data;
      }
      
      // Check daily limit and working hours
      if (!this.canMakeAPICall()) {
        const reason = !this.isWithinWorkingHours() ? 'outside working hours' : 'daily limit reached';
        console.warn(`⚠️ Weather API unavailable (${reason}), returning cached or mock data`);
        return cached?.data || this.getMockWeatherData();
      }
      
      // Try to get all locations efficiently
      const allCoords = [...this.locations, { ...this.redheughBridge, name: 'Redheugh Bridge' }];
      let results = [];
      
      // First try: Use bulk API to get multiple locations in ONE call
      try {
        console.log('🌐 Attempting bulk weather fetch for all locations...');
        const bulkResults = await this.getWeatherForMultipleLocations(allCoords);
        
        if (bulkResults && bulkResults.length > 0) {
          results = bulkResults;
          this.dailyCallCount += 1; // Only ONE API call!
          console.log(`✅ Got weather for ${results.length} locations with just 1 API call! (${this.dailyCallCount}/${this.dailyCallLimit})`);
        } else {
          throw new Error('Bulk API returned no results');
        }
      } catch (bulkError) {
        console.warn('⚠️ Bulk API failed, falling back to individual calls:', bulkError.message);
        
        // Fallback: Get locations individually
        for (const location of allCoords) {
          if (!this.canMakeAPICall()) {
            console.warn(`⚠️ Stopping weather fetch at ${location.name} - daily limit reached`);
            break;
          }
          
          const result = await this.getWeatherForLocation(location.lat, location.lon, location.name);
          if (result) {
            results.push(result);
            this.dailyCallCount++;
            console.log(`📡 Weather API call ${this.dailyCallCount}/${this.dailyCallLimit} for ${location.name}`);
          }
        }
      }
      
      // Process results
      const weatherData = {
        locations: {},
        redheughBridge: null,
        alerts: []
      };
      
      results.forEach(result => {
        if (result) {
          if (result.name === 'Redheugh Bridge') {
            weatherData.redheughBridge = {
              windSpeed: result.wind.speed,
              windSpeedMph: Math.round(result.wind.speed * 2.237), // m/s to mph
              windDirection: result.wind.deg,
              windGust: result.wind.gust,
              windGustMph: result.wind.gust ? Math.round(result.wind.gust * 2.237) : null
            };
            
            // Check for high wind alert
            if (weatherData.redheughBridge.windSpeedMph > 30) {
              weatherData.alerts.push({
                type: 'HIGH_WIND',
                severity: weatherData.redheughBridge.windSpeedMph > 40 ? 'HIGH' : 'MEDIUM',
                location: 'Redheugh Bridge',
                message: `High winds: ${weatherData.redheughBridge.windSpeedMph}mph`,
                windSpeed: weatherData.redheughBridge.windSpeedMph
              });
            }
          } else {
            weatherData.locations[result.name] = {
              temp: Math.round(result.main.temp),
              tempC: Math.round(result.main.temp),
              tempF: Math.round(result.main.temp * 9/5 + 32),
              condition: result.weather[0].main,
              description: result.weather[0].description,
              icon: this.getWeatherIcon(result.weather[0].id, result.weather[0].icon),
              humidity: result.main.humidity,
              pressure: result.main.pressure
            };
          }
        }
      });
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });
      
      return weatherData;
      
    } catch (error) {
      console.error('❌ Weather service error:', error);
      return this.getMockWeatherData();
    }
  }

  // Get weather for multiple locations in ONE API call (more efficient)
  async getWeatherForMultipleLocations(locations) {
    try {
      // Use the 'find' endpoint with a bounding box that covers all our locations
      // This gets weather for multiple cities in ONE API call
      const bbox = [
        Math.min(...locations.map(l => l.lon)) - 0.5, // left
        Math.min(...locations.map(l => l.lat)) - 0.5, // bottom
        Math.max(...locations.map(l => l.lon)) + 0.5, // right
        Math.max(...locations.map(l => l.lat)) + 0.5, // top
        10 // zoom level
      ].join(',');
      
      const url = `${this.baseUrl}/box/city?bbox=${bbox}&units=metric&appid=${this.apiKey}`;
      
      const response = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Go-BARRY-Traffic-System/2.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Weather bulk API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`🌐 Got weather for ${data.list?.length || 0} locations in ONE API call`);
      
      // Map the results to our location names
      const results = [];
      for (const location of locations) {
        // Find closest match in results
        const closest = data.list?.reduce((prev, curr) => {
          const prevDist = Math.sqrt(
            Math.pow(prev.coord.lat - location.lat, 2) + 
            Math.pow(prev.coord.lon - location.lon, 2)
          );
          const currDist = Math.sqrt(
            Math.pow(curr.coord.lat - location.lat, 2) + 
            Math.pow(curr.coord.lon - location.lon, 2)
          );
          return currDist < prevDist ? curr : prev;
        });
        
        if (closest) {
          closest.name = location.name; // Use our location name
          results.push(closest);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Weather bulk fetch error:', error.message);
      return null;
    }
  }

  // Get weather for a specific location (fallback method)
  async getWeatherForLocation(lat, lon, name) {
    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      
      const response = await fetch(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Go-BARRY-Traffic-System/2.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      data.name = name; // Override with our location name
      return data;
      
    } catch (error) {
      console.error(`❌ Weather fetch error for ${name}:`, error.message);
      return null;
    }
  }

  // Get weather icon based on condition code
  getWeatherIcon(code, iconCode) {
    // Map OpenWeatherMap codes to emoji icons
    if (code >= 200 && code < 300) return '⛈️'; // Thunderstorm
    if (code >= 300 && code < 400) return '🌦️'; // Drizzle
    if (code >= 500 && code < 600) return '🌧️'; // Rain
    if (code >= 600 && code < 700) return '❄️'; // Snow
    if (code >= 700 && code < 800) return '🌫️'; // Atmosphere (fog, mist)
    if (code === 800) return iconCode.includes('n') ? '🌙' : '☀️'; // Clear
    if (code > 800 && code < 900) return '☁️'; // Clouds
    return '🌤️'; // Default
  }

  // Mock data for when API is not available
  getMockWeatherData() {
    return {
      locations: {
        Newcastle: { temp: 12, tempC: 12, tempF: 54, condition: 'Cloudy', icon: '☁️' },
        Gateshead: { temp: 11, tempC: 11, tempF: 52, condition: 'Cloudy', icon: '☁️' },
        Sunderland: { temp: 11, tempC: 11, tempF: 52, condition: 'Rain', icon: '🌧️' },
        Durham: { temp: 10, tempC: 10, tempF: 50, condition: 'Clear', icon: '☀️' },
        Consett: { temp: 9, tempC: 9, tempF: 48, condition: 'Cloudy', icon: '☁️' },
        Stanley: { temp: 10, tempC: 10, tempF: 50, condition: 'Cloudy', icon: '☁️' }
      },
      redheughBridge: {
        windSpeed: 8.5,
        windSpeedMph: 19,
        windDirection: 270,
        windGust: null,
        windGustMph: null
      },
      alerts: []
    };
  }

  // Get weather summary for display
  async getWeatherSummary() {
    const data = await this.getAllWeatherData();
    
    return {
      currentLocation: 'Newcastle', // Default display location
      temperature: data.locations.Newcastle?.temp || 12,
      condition: data.locations.Newcastle?.condition || 'Unknown',
      icon: data.locations.Newcastle?.icon || '🌤️',
      windSpeed: data.redheughBridge?.windSpeedMph || 0,
      windAlert: data.alerts.find(a => a.type === 'HIGH_WIND') || null,
      locations: data.locations,
      lastUpdate: new Date().toISOString()
    };
  }
  
  // Get API usage status
  getAPIStatus() {
    this.checkDailyReset();
    const now = new Date();
    const currentHour = now.getHours() + (now.getMinutes() / 60);
    const isInWorkingHours = this.isWithinWorkingHours();
    
    // Calculate actual working hours per day (18.25 hours)
    const workingHoursPerDay = 18.25; // 6:00 to 00:15
    const estimatedCallsInWorkingHours = Math.round((workingHoursPerDay * 60 / (this.cacheExpiry / 1000 / 60)) * 7);
    
    return {
      dailyCallCount: this.dailyCallCount,
      dailyCallLimit: this.dailyCallLimit,
      remainingCalls: this.dailyCallLimit - this.dailyCallCount,
      percentageUsed: Math.round((this.dailyCallCount / this.dailyCallLimit) * 100),
      canMakeCall: this.canMakeAPICall(),
      isInWorkingHours,
      currentTime: now.toLocaleTimeString(),
      workingHours: '06:00 - 00:15',
      workingHoursPerDay,
      cacheExpiry: this.cacheExpiry / 1000 / 60, // in minutes
      lastResetDate: this.lastResetDate,
      estimatedDailyUsage: estimatedCallsInWorkingHours,
      estimatedDailyUsageAllDay: Math.round((24 * 60 / (this.cacheExpiry / 1000 / 60)) * 7), // if ran 24/7
      savingsFromWorkingHours: `${Math.round((1 - workingHoursPerDay/24) * 100)}% reduction`,
      recommendation: this.dailyCallCount > 800 ? 'Consider increasing cache duration' : 
                     !isInWorkingHours ? 'Outside working hours - no API calls' :
                     'Usage within safe limits'
    };
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
