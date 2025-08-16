// Weather API routes for Go BARRY
import express from 'express';
import fetch from 'node-fetch';
import { weatherService } from '../services/weatherService.js';

const router = express.Router();

// Get weather data for all locations
router.get('/current', async (req, res) => {
  try {
    const weatherData = await weatherService.getAllWeatherData();
    res.json({
      success: true,
      data: weatherData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// Get weather summary for display
router.get('/summary', async (req, res) => {
  try {
    const summary = await weatherService.getWeatherSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Weather summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather summary',
      message: error.message
    });
  }
});

// Initialize weather service
router.post('/initialize', async (req, res) => {
  try {
    const initialized = await weatherService.initialize();
    res.json({
      success: true,
      initialized,
      message: initialized ? 'Weather service initialized' : 'Weather service not configured (no API key)'
    });
  } catch (error) {
    console.error('Weather initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize weather service',
      message: error.message
    });
  }
});

// Get API usage status
router.get('/status', async (req, res) => {
  try {
    const status = weatherService.getAPIStatus();
    
    // Add debug info about API key
    const debugInfo = {
      hasApiKey: !!process.env.OPENWEATHER_API_KEY,
      apiKeyLength: process.env.OPENWEATHER_API_KEY ? process.env.OPENWEATHER_API_KEY.length : 0,
      serviceInitialized: weatherService.initialized
    };
    
    res.json({
      success: true,
      status,
      debug: debugInfo,
      message: status.canMakeCall ? 'Weather API available' : 'Daily limit reached',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather status',
      message: error.message
    });
  }
});

// Test API key functionality
router.get('/test-api', async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      return res.json({
        success: false,
        error: 'No API key configured',
        details: {
          envVarName: 'OPENWEATHER_API_KEY',
          hasKey: false
        }
      });
    }
    
    // Test API call to Newcastle
    const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=54.9783&lon=-1.6178&units=metric&appid=${apiKey}`;
    
    const response = await fetch(testUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Go-BARRY-Traffic-System/2.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      message: 'API key working correctly',
      testLocation: 'Newcastle',
      apiResponse: {
        location: data.name,
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].main,
        description: data.weather[0].description
      },
      debug: {
        hasApiKey: true,
        apiKeyLength: apiKey.length,
        responseStatus: response.status
      }
    });
    
  } catch (error) {
    console.error('Weather API test error:', error);
    res.json({
      success: false,
      error: 'API test failed',
      message: error.message,
      debug: {
        hasApiKey: !!process.env.OPENWEATHER_API_KEY,
        apiKeyLength: process.env.OPENWEATHER_API_KEY ? process.env.OPENWEATHER_API_KEY.length : 0
      }
    });
  }
});

// Get weather forecast for transport planning
router.get('/forecast', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const forecastData = await weatherService.getWeatherForecast(parseInt(hours));
    res.json({
      success: true,
      data: forecastData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather forecast',
      message: error.message
    });
  }
});

// Get comprehensive transport impact analysis
router.get('/impact', async (req, res) => {
  try {
    const weatherData = await weatherService.getAllWeatherData();
    const impactAnalysis = weatherService.analyzeTransportImpact(weatherData);
    res.json({
      success: true,
      data: impactAnalysis,
      weatherData: {
        locations: Object.keys(weatherData.locations || {}),
        windSpeed: weatherData.redheughBridge?.windSpeedMph || 0,
        lastUpdate: weatherData.lastUpdate
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather impact analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze weather impact',
      message: error.message
    });
  }
});

// Get weather alerts for display and operations
router.get('/alerts', async (req, res) => {
  try {
    const { severity } = req.query;
    const weatherData = await weatherService.getAllWeatherData();
    const impactAnalysis = weatherService.analyzeTransportImpact(weatherData);
    
    let alerts = [
      ...(weatherData.alerts || []),
      ...impactAnalysis.impacts.map(impact => ({
        type: 'WEATHER_IMPACT',
        severity: impact.severity.toUpperCase(),
        location: impact.location,
        message: impact.description,
        routes: impact.routes,
        recommendation: impact.recommendation,
        timestamp: new Date().toISOString()
      }))
    ];
    
    // Filter by severity if requested
    if (severity) {
      alerts = alerts.filter(alert => 
        alert.severity.toLowerCase() === severity.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      alerts,
      count: alerts.length,
      overallSeverity: impactAnalysis.severity,
      summary: impactAnalysis.summary,
      recommendations: impactAnalysis.recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get weather alerts',
      message: error.message
    });
  }
});

// Get weather data for specific location
router.get('/location/:locationName', async (req, res) => {
  try {
    const { locationName } = req.params;
    const weatherData = await weatherService.getAllWeatherData();
    
    const locationData = weatherData.locations?.[locationName];
    if (!locationData) {
      return res.status(404).json({
        success: false,
        error: `Weather data not found for location: ${locationName}`,
        availableLocations: Object.keys(weatherData.locations || {})
      });
    }
    
    // Get location-specific impact analysis
    const locationImpacts = weatherService.analyzeLocationImpact(locationName, locationData);
    
    res.json({
      success: true,
      location: locationName,
      weather: locationData,
      impacts: locationImpacts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Weather location error for ${req.params.locationName}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location weather data',
      message: error.message
    });
  }
});

export default router;
