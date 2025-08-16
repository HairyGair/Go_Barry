// routes/enhancementAPI.js
// API endpoints for TomTom enhancement features

import express from 'express';
import {
  enhanceLocation,
  reverseGeocodeWithLandmarks,
  calculateRouteImpact,
  suggestAlternativeRoute,
  enhanceIncidentWithTomTom,
  checkTomTomQuota
} from '../services/tomtomEnhancementService.js';

const router = express.Router();

// Enhance a location string with better geocoding
router.post('/location', async (req, res) => {
  try {
    const { location, nearLat, nearLon } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location string required'
      });
    }
    
    const enhanced = await enhanceLocation(location, nearLat, nearLon);
    
    res.json({
      success: !!enhanced,
      original: location,
      enhanced: enhanced,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Location enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reverse geocode coordinates with nearby landmarks
router.post('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude required'
      });
    }
    
    const result = await reverseGeocodeWithLandmarks(lat, lon);
    
    res.json({
      success: !!result,
      coordinates: { lat, lon },
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate alternative route avoiding an incident
router.post('/alternative-route', async (req, res) => {
  try {
    const { start, end, avoid } = req.body;
    
    if (!start?.lat || !start?.lon || !end?.lat || !end?.lon || !avoid?.lat || !avoid?.lon) {
      return res.status(400).json({
        success: false,
        error: 'Start, end, and avoid coordinates required'
      });
    }
    
    const alternative = await suggestAlternativeRoute(
      start.lat, start.lon,
      end.lat, end.lon,
      avoid.lat, avoid.lon
    );
    
    res.json({
      success: !!alternative,
      alternative: alternative,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Alternative route error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhance an entire incident with all TomTom features
router.post('/enhance-incident', async (req, res) => {
  try {
    const { incident } = req.body;
    
    if (!incident) {
      return res.status(400).json({
        success: false,
        error: 'Incident object required'
      });
    }
    
    const enhanced = await enhanceIncidentWithTomTom(incident);
    
    res.json({
      success: true,
      original: incident,
      enhanced: enhanced,
      improvements: {
        locationEnhanced: enhanced.enhancedLocation !== undefined,
        landmarksAdded: enhanced.nearbyLandmarks !== undefined,
        coordinatesAdded: !incident.coordinates && enhanced.coordinates !== undefined
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Incident enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check TomTom API quota status
router.get('/quota', async (req, res) => {
  try {
    const quota = await checkTomTomQuota();
    
    res.json({
      success: true,
      quota: quota,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint - enhance location of Eldon Square
router.get('/test', async (req, res) => {
  try {
    const testLocation = 'Eldon Square Newcastle';
    const enhanced = await enhanceLocation(testLocation);
    
    const testCoords = { lat: 54.9783, lon: -1.6178 }; // Newcastle center
    const reversed = await reverseGeocodeWithLandmarks(testCoords.lat, testCoords.lon);
    
    res.json({
      success: true,
      tests: {
        locationEnhancement: {
          input: testLocation,
          result: enhanced
        },
        reverseGeocoding: {
          input: testCoords,
          result: reversed
        }
      },
      message: 'TomTom Enhancement Service is working!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
