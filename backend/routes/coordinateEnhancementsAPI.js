// backend/routes/coordinateEnhancementsAPI.js
// API endpoints for coordinate enhancements
import express from 'express';
import { convertToWhat3Words, convertFromWhat3Words } from '../services/what3wordsService.js';
import { snapRoadworkToRoad } from '../services/snapToRoadService.js';
import { verifyRoadworkCoordinates, flagCoordinatesForReview } from '../services/coordinateVerificationService.js';

const router = express.Router();

// GET /api/coordinates/w3w/:lat/:lng - Convert coordinates to What3Words
router.get('/w3w/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const result = await convertToWhat3Words(parseFloat(lat), parseFloat(lng));
    
    res.json(result);
  } catch (error) {
    console.error('W3W conversion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/coordinates/w3w/reverse/:words - Convert What3Words to coordinates
router.get('/w3w/reverse/:words', async (req, res) => {
  try {
    const { words } = req.params;
    const result = await convertFromWhat3Words(words);
    
    res.json(result);
  } catch (error) {
    console.error('W3W reverse error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/coordinates/snap-to-road - Snap coordinates to nearest road
router.post('/snap-to-road', async (req, res) => {
  try {
    const { coordinates, roadworkId } = req.body;
    
    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Coordinates array required' 
      });
    }
    
    // Create temporary roadwork object for processing
    const tempRoadwork = {
      id: roadworkId,
      coordinates: coordinates,
      coordinatePoints: 1
    };
    
    const snappedResult = await snapRoadworkToRoad(tempRoadwork);
    
    res.json({
      success: true,
      original: coordinates,
      snapped: snappedResult.coordinates,
      snapDistance: snappedResult.snapDistance,
      snapApplied: snappedResult.snapToRoadApplied || false
    });
  } catch (error) {
    console.error('Snap to road error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/coordinates/verify/:id - Verify roadwork coordinates
router.post('/verify/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates, verifiedBy, verificationMethod, notes, confidence } = req.body;
    
    const result = await verifyRoadworkCoordinates(id, coordinates, {
      verifiedBy,
      verificationMethod,
      notes,
      confidence,
      previousCoordinates: req.body.previousCoordinates
    });
    
    res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/coordinates/flag/:id - Flag coordinates for review
router.post('/flag/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, flaggedBy } = req.body;
    
    const result = await flagCoordinatesForReview(id, reason, flaggedBy);
    
    res.json(result);
  } catch (error) {
    console.error('Flag error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/coordinates/cache-stats - Get coordinate cache statistics
router.get('/cache-stats', async (req, res) => {
  try {
    // Would query Supabase for cache statistics
    const stats = {
      totalRoadworks: 1234,
      cachedCoordinates: 987,
      cacheHitRate: 0.80,
      averageCacheAge: 3.5, // days
      verifiedCoordinates: 234,
      flaggedForReview: 12
    };
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
