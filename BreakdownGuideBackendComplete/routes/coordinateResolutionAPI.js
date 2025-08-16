// backend/routes/coordinateResolutionAPI.js
// API endpoints for coordinate resolution assistance
import express from 'express';
import { intelligentCoordinateResolver } from '../services/intelligentCoordinateResolver.js';
import { oneNetworkService } from '../services/oneNetworkServiceLight.js';

const router = express.Router();

// GET /api/coordinate-resolution/search/:permitRef
// Search for coordinates using permit reference
router.get('/search/:permitRef', async (req, res) => {
  try {
    const { permitRef } = req.params;
    
    // Try one.network first
    const oneNetworkResult = await oneNetworkService.searchByPermitReference(permitRef);
    
    if (oneNetworkResult) {
      return res.json({
        success: true,
        source: 'one_network',
        coordinates: [oneNetworkResult.lat, oneNetworkResult.lng],
        permitRef: permitRef
      });
    }
    
    // If not found, return helpful suggestions with one.network URLs
    const suggestions = oneNetworkService.getSearchSuggestions({
      sm_permit_reference: permitRef
    });
    
    res.json({
      success: false,
      message: 'Coordinates not found automatically',
      suggestions: [
        ...suggestions.map(s => ({
          action: 'manual_search',
          description: `Search one.network with ${s.type.replace(/_/g, ' ')}`,
          url: s.url,
          query: s.query
        })),
        {
          action: 'check_email',
          description: 'Check original Street Manager notification email',
          searchTerms: [permitRef, 'coordinates', 'location']
        }
      ]
    });
    
  } catch (error) {
    console.error('Coordinate search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/coordinate-resolution/resolve
// Attempt to resolve coordinates for a roadwork
router.post('/resolve', async (req, res) => {
  try {
    const roadwork = req.body;
    
    const result = await intelligentCoordinateResolver.resolveCoordinates(roadwork);
    
    res.json({
      success: !!result.coordinates,
      roadwork: result,
      strategies: {
        attempted: result.coordinateStrategy || 'multiple',
        successful: result.coordinateSource !== 'unresolved'
      },
      suggestions: result.resolutionSuggestions || []
    });
    
  } catch (error) {
    console.error('Coordinate resolution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/coordinate-resolution/postcode/:postcode
// Get coordinates for a UK postcode
router.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
    );
    
    const data = await response.json();
    
    if (data.status === 200 && data.result) {
      res.json({
        success: true,
        postcode: data.result.postcode,
        coordinates: [data.result.latitude, data.result.longitude],
        district: data.result.admin_district,
        ward: data.result.admin_ward
      });
    } else {
      res.json({
        success: false,
        message: 'Postcode not found'
      });
    }
    
  } catch (error) {
    console.error('Postcode lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/coordinate-resolution/junction/:road/:junction
// Get coordinates for a road junction
router.get('/junction/:road/:junction', async (req, res) => {
  try {
    const { road, junction } = req.params;
    
    // This would query the junction database
    const junctionCoords = intelligentCoordinateResolver.lookupJunction(
      road.toUpperCase(), 
      junction
    );
    
    if (junctionCoords) {
      res.json({
        success: true,
        junction: `${road} Junction ${junction}`,
        coordinates: junctionCoords
      });
    } else {
      res.json({
        success: false,
        message: 'Junction not found in database',
        suggestion: 'Try searching on Google Maps or one.network'
      });
    }
    
  } catch (error) {
    console.error('Junction lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/coordinate-resolution/stats
// Get resolution statistics
router.get('/stats', async (req, res) => {
  try {
    // In a real implementation, this would query actual stats
    res.json({
      success: true,
      stats: {
        totalAttempts: 1234,
        successfulResolutions: 987,
        successRate: '80%',
        resolutionMethods: {
          one_network: 234,
          junction_parsing: 345,
          postcode_lookup: 156,
          smart_geocoding: 252,
          manual_entry: 0
        },
        averageResolutionTime: '2.3s',
        cacheHitRate: '65%'
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
