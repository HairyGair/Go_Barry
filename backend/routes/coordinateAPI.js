// backend/routes/coordinateAPI.js
// Unified coordinate API endpoints

import express from 'express';
import coordinateService from '../services/coordinateService.js';

const router = express.Router();

/**
 * POST /api/coordinates/process
 * Process and resolve coordinates from various inputs
 */
router.post('/process', async (req, res) => {
  try {
    const result = await coordinateService.processCoordinate(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ Coordinate processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/batch
 * Process multiple coordinates at once
 */
router.post('/batch', async (req, res) => {
  try {
    const { items, options = {} } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items must be an array'
      });
    }
    
    const results = await coordinateService.batchProcess(items, options);
    
    res.json({
      success: true,
      results,
      metadata: {
        total: items.length,
        processed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('❌ Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/coordinates/validate
 * Validate if coordinates are within UK bounds
 */
router.get('/validate', (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    const isValid = coordinateService.isValidCoordinate(lat, lng);
    
    res.json({
      success: true,
      valid: isValid,
      coordinates: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      bounds: coordinateService.UK_BOUNDS
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/convert
 * Convert coordinates between systems (BNG to WGS84)
 */
router.post('/convert', async (req, res) => {
  try {
    const { easting, northing } = req.body;
    
    if (!easting || !northing) {
      return res.status(400).json({
        success: false,
        error: 'Easting and northing are required'
      });
    }
    
    const result = await coordinateService.convertBNGtoWGS84(easting, northing);
    
    res.json({
      success: true,
      ...result,
      precision: coordinateService.PRECISION,
      accuracy: `${Math.pow(10, -coordinateService.PRECISION) * 111000}m`
    });
  } catch (error) {
    console.error('❌ Conversion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/geocode
 * Geocode an address or postcode to coordinates
 */
router.post('/geocode', async (req, res) => {
  try {
    const result = await coordinateService.geocode(req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ Geocoding error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/assess-quality
 * Assess the quality of coordinates
 */
router.post('/assess-quality', async (req, res) => {
  try {
    const { coordinates, metadata = {} } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates array is required'
      });
    }
    
    const assessments = coordinates.map(coord => {
      const quality = coordinateService.assessQuality(coord, coord.metadata || metadata);
      return {
        ...coord,
        quality
      };
    });
    
    const avgScore = assessments.reduce((sum, a) => sum + a.quality.score, 0) / assessments.length;
    
    res.json({
      success: true,
      assessments,
      summary: {
        total: assessments.length,
        averageScore: avgScore.toFixed(1),
        distribution: {
          A: assessments.filter(a => a.quality.grade === 'A').length,
          B: assessments.filter(a => a.quality.grade === 'B').length,
          C: assessments.filter(a => a.quality.grade === 'C').length,
          D: assessments.filter(a => a.quality.grade === 'D').length,
          F: assessments.filter(a => a.quality.grade === 'F').length
        }
      }
    });
  } catch (error) {
    console.error('❌ Quality assessment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/cluster
 * Cluster nearby coordinates
 */
router.post('/cluster', async (req, res) => {
  try {
    const { coordinates, radius = 100 } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates array is required'
      });
    }
    
    const clusters = coordinateService.clusterCoordinates(coordinates, radius);
    
    res.json({
      success: true,
      clusters,
      metadata: {
        originalCount: coordinates.length,
        clusterCount: clusters.length,
        radius,
        reduction: `${((1 - clusters.length / coordinates.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    console.error('❌ Clustering error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/coordinates/known-locations
 * Get list of known locations
 */
router.get('/known-locations', (req, res) => {
  try {
    const locations = Object.entries(coordinateService.KNOWN_LOCATIONS).map(([key, value]) => ({
      name: key,
      ...value
    }));
    
    res.json({
      success: true,
      locations,
      total: locations.length
    });
  } catch (error) {
    console.error('❌ Known locations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/coordinates/cache/clear
 * Clear coordinate caches (admin only)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // TODO: Add admin authentication check here
    
    await coordinateService.clearAllCaches();
    
    res.json({
      success: true,
      message: 'All coordinate caches cleared successfully'
    });
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/coordinates/stats
 * Get coordinate service statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      precision: coordinateService.PRECISION,
      accuracy: `${Math.pow(10, -coordinateService.PRECISION) * 111000}m`,
      knownLocations: Object.keys(coordinateService.KNOWN_LOCATIONS).length,
      ukBounds: coordinateService.UK_BOUNDS,
      cacheConfig: {
        memory: '5 minutes',
        redis: '1 hour',
        database: '30 days'
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
