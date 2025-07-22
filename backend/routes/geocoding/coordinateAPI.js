// backend/routes/geocoding/coordinateAPI.js
// API endpoints for coordinate enhancement and testing
// © 2025 Anthony Gair. All rights reserved.

import express from 'express';
import coordinateEnhancer from '../../services/geocoding/coordinateEnhancer.js';

const router = express.Router();

/**
 * Test coordinate enhancement for a single location
 */
router.post('/enhance-single', async (req, res) => {
  try {
    const { alert } = req.body;
    
    if (!alert) {
      return res.status(400).json({
        success: false,
        error: 'Alert data required in request body'
      });
    }
    
    console.log('🌐 Testing coordinate enhancement for:', alert.location || alert.title);
    
    const enhanced = await coordinateEnhancer.enhanceAlertCoordinates(alert);
    
    res.json({
      success: true,
      original: alert,
      enhanced: enhanced,
      improvements: {
        hadCoordinates: coordinateEnhancer.hasValidCoordinates(alert),
        coordinatesAdded: !coordinateEnhancer.hasValidCoordinates(alert) && enhanced.coordinates,
        coordinateSource: enhanced.coordinateSource,
        accuracy: enhanced.coordinateAccuracy
      }
    });
    
  } catch (error) {
    console.error('❌ Coordinate enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Batch test coordinate enhancement
 */
router.post('/enhance-batch', async (req, res) => {
  try {
    const { alerts } = req.body;
    
    if (!Array.isArray(alerts)) {
      return res.status(400).json({
        success: false,
        error: 'Alerts array required in request body'
      });
    }
    
    console.log(`🌐 Batch enhancing ${alerts.length} alerts...`);
    
    const enhanced = await coordinateEnhancer.enhanceMultipleAlerts(alerts);
    
    const stats = {
      total: enhanced.length,
      withOriginalCoords: enhanced.filter(a => a.coordinateSource === 'original').length,
      geocoded: enhanced.filter(a => a.coordinateSource === 'geocoded').length,
      fromJunction: enhanced.filter(a => a.coordinateSource === 'junction').length,
      fallback: enhanced.filter(a => a.coordinateSource === 'fallback').length,
      default: enhanced.filter(a => a.coordinateSource === 'default').length
    };
    
    res.json({
      success: true,
      enhanced: enhanced,
      statistics: stats,
      improvementRate: ((stats.geocoded + stats.fromJunction) / stats.total * 100).toFixed(1) + '%'
    });
    
  } catch (error) {
    console.error('❌ Batch enhancement error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test geocoding for a specific location string
 */
router.post('/geocode-test', async (req, res) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location string required'
      });
    }
    
    console.log(`🌐 Testing geocoding for: "${location}"`);
    
    // Create a dummy alert for testing
    const testAlert = {
      id: 'test-' + Date.now(),
      location: location,
      title: location
    };
    
    const enhanced = await coordinateEnhancer.enhanceAlertCoordinates(testAlert);
    
    res.json({
      success: true,
      query: location,
      result: {
        coordinates: enhanced.coordinates,
        source: enhanced.coordinateSource,
        accuracy: enhanced.coordinateAccuracy,
        enhancedLocation: enhanced.enhancedLocation
      }
    });
    
  } catch (error) {
    console.error('❌ Geocoding test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get coordinate enhancement statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = coordinateEnhancer.getStats();
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear geocoding cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    coordinateEnhancer.clearCache();
    
    res.json({
      success: true,
      message: 'Geocoding cache cleared successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test specific junction coordinates
 */
router.get('/junction/:road/:number', (req, res) => {
  try {
    const { road, number } = req.params;
    const junctionKey = `${road.toUpperCase()}_J${number}`;
    
    // Access junction coordinates directly
    const coords = coordinateEnhancer.junctionCoordinates[junctionKey];
    
    if (coords) {
      res.json({
        success: true,
        junction: `${road.toUpperCase()} Junction ${number}`,
        coordinates: coords,
        mapUrl: `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      });
    } else {
      res.status(404).json({
        success: false,
        error: `Junction ${junctionKey} not found`,
        availableJunctions: Object.keys(coordinateEnhancer.junctionCoordinates)
          .filter(k => k.startsWith(road.toUpperCase()))
          .sort()
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate alerts for coordinate completeness
 */
router.post('/validate-alerts', async (req, res) => {
  try {
    const { alerts } = req.body;
    
    if (!Array.isArray(alerts)) {
      return res.status(400).json({
        success: false,
        error: 'Alerts array required in request body'
      });
    }
    
    console.log(`🔍 Validating ${alerts.length} alerts for coordinate completeness...`);
    
    const validation = alerts.map(alert => {
      const hasCoords = coordinateEnhancer.hasValidCoordinates(alert);
      const coords = hasCoords ? coordinateEnhancer.extractCoordinates(alert) : null;
      
      return {
        id: alert.id,
        title: alert.title,
        location: alert.location,
        hasCoordinates: hasCoords,
        coordinates: coords,
        isInNorthEast: coords ? coordinateEnhancer.isInNorthEast(coords.lat, coords.lng) : false,
        needsEnhancement: !hasCoords || (coords && !coordinateEnhancer.isInNorthEast(coords.lat, coords.lng))
      };
    });
    
    const stats = {
      total: validation.length,
      withValidCoords: validation.filter(v => v.hasCoordinates).length,
      inNorthEast: validation.filter(v => v.isInNorthEast).length,
      needingEnhancement: validation.filter(v => v.needsEnhancement).length
    };
    
    res.json({
      success: true,
      validation: validation,
      statistics: stats,
      readiness: stats.needingEnhancement === 0 ? 'Ready' : `${stats.needingEnhancement} alerts need coordinate enhancement`
    });
    
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
