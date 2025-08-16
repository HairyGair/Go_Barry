// routes/locationCorrectionAPI.js
// API endpoints for supervisor location corrections

import express from 'express';
import enhancedLocationMatchingService from '../services/enhancedLocationMatching.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Middleware to verify supervisor session
const requireSupervisor = async (req, res, next) => {
  const { supervisorId, sessionToken } = req.body;
  
  if (!supervisorId || !sessionToken) {
    return res.status(401).json({
      success: false,
      error: 'Supervisor authentication required'
    });
  }
  
  const validation = supervisorManager.validateSession(supervisorId, sessionToken);
  if (!validation.valid) {
    return res.status(401).json({
      success: false,
      error: validation.reason || 'Invalid session'
    });
  }
  
  req.supervisor = supervisorManager.getSupervisor(supervisorId);
  next();
};

// Get all location corrections
router.get('/corrections', async (req, res) => {
  try {
    const corrections = enhancedLocationMatchingService.getAllCorrections();
    const stats = enhancedLocationMatchingService.getStatistics();
    
    res.json({
      success: true,
      corrections,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching corrections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a new location correction
router.post('/corrections', requireSupervisor, async (req, res) => {
  try {
    const {
      originalLocation,
      originalCoords,
      correctedLocation,
      correctedCoords,
      reason
    } = req.body;
    
    // Validate input
    if (!originalLocation || !originalCoords || !correctedLocation || !correctedCoords) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: originalLocation, originalCoords, correctedLocation, correctedCoords'
      });
    }
    
    if (!Array.isArray(originalCoords) || originalCoords.length !== 2 ||
        !Array.isArray(correctedCoords) || correctedCoords.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Coordinates must be arrays with [latitude, longitude]'
      });
    }
    
    // Add the correction
    const correction = await enhancedLocationMatchingService.addSupervisorCorrection({
      originalLocation,
      originalCoords,
      correctedLocation,
      correctedCoords,
      supervisorId: req.supervisor.id,
      supervisorName: req.supervisor.name,
      reason: reason || 'Manual correction'
    });
    
    console.log(`✅ Location correction added by ${req.supervisor.name}`);
    
    res.json({
      success: true,
      correction,
      message: `Location correction saved successfully`
    });
    
  } catch (error) {
    console.error('❌ Error adding correction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove a location correction
router.delete('/corrections/:correctionId', requireSupervisor, async (req, res) => {
  try {
    const { correctionId } = req.params;
    
    const removed = await enhancedLocationMatchingService.removeCorrection(correctionId);
    
    if (removed) {
      console.log(`✅ Location correction ${correctionId} removed by ${req.supervisor.name}`);
      res.json({
        success: true,
        message: 'Correction removed successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Correction not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error removing correction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test location enhancement
router.post('/test-enhancement', async (req, res) => {
  try {
    const { location, coordinates } = req.body;
    
    if (!location || !coordinates) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: location, coordinates'
      });
    }
    
    const enhanced = await enhancedLocationMatchingService.enhanceLocation(
      location,
      coordinates,
      'test'
    );
    
    res.json({
      success: true,
      original: {
        location,
        coordinates
      },
      enhanced,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error testing enhancement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get location boundaries
router.get('/boundaries', async (req, res) => {
  try {
    const { format } = req.query;
    
    if (format === 'geojson') {
      const geojson = await import('../services/locationBoundaries.js')
        .then(module => module.default.exportForMap());
      
      res.json({
        success: true,
        boundaries: geojson,
        format: 'geojson'
      });
    } else {
      const boundaries = await import('../services/locationBoundaries.js')
        .then(module => module.default.getAllBoundaries());
      
      res.json({
        success: true,
        boundaries,
        format: 'raw'
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching boundaries:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate location against boundaries
router.post('/validate-location', async (req, res) => {
  try {
    const { description, latitude, longitude } = req.body;
    
    if (!description || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: description, latitude, longitude'
      });
    }
    
    const locationBoundariesService = await import('../services/locationBoundaries.js')
      .then(module => module.default);
    
    const validation = locationBoundariesService.validateLocationDescription(
      description,
      latitude,
      longitude
    );
    
    const nearestLocation = locationBoundariesService.getNearestLocation(
      latitude,
      longitude
    );
    
    res.json({
      success: true,
      validation,
      nearestLocation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error validating location:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
