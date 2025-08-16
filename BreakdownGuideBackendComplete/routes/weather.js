import express from 'express';
import weatherService from '../services/weatherService.js';

const router = express.Router();

// Get weather for multiple locations
router.get('/multi-location', async (req, res) => {
  try {
    const weatherData = await weatherService.getMultiLocationWeather();
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// Get current weather for display
router.get('/current', async (req, res) => {
  try {
    const weatherData = await weatherService.getMultiLocationWeather();
    
    // Return simplified version for current display
    const current = {
      success: true,
      timestamp: weatherData.timestamp,
      priority1Locations: weatherData.locations.filter(l => l.priority === 1),
      alerts: weatherData.alerts.filter(a => a.severity === 'HIGH'),
      criticalWinds: weatherData.criticalWindLocations.filter(l => l.isHighWind)
    };
    
    res.json(current);
  } catch (error) {
    console.error('Weather current API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current weather'
    });
  }
});

export default router;
