// Weather API routes for Go BARRY
import express from 'express';
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
    res.json({
      success: true,
      status,
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

export default router;
