// routes/tileAPI.js
// API for serving TomTom map tiles with throttling

import express from 'express';
import tomtomTileService from '../services/tomtomTiles.js';

const router = express.Router();

// GET /api/tiles/map/:layer/:style/:zoom/:x/:y.:format - Get map tile
router.get('/map/:layer/:style/:zoom/:x/:y.:format', async (req, res) => {
  try {
    const { layer, style, zoom, x, y, format } = req.params;
    
    // Validate parameters
    const zoomInt = parseInt(zoom);
    const xInt = parseInt(x);
    const yInt = parseInt(y);
    
    if (isNaN(zoomInt) || isNaN(xInt) || isNaN(yInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tile coordinates'
      });
    }
    
    if (zoomInt < 0 || zoomInt > 22) {
      return res.status(400).json({
        success: false,
        error: 'Zoom level must be between 0 and 22'
      });
    }
    
    console.log(`🗺️ Tile request: ${layer}/${style}/${zoom}/${x}/${y}.${format}`);
    
    const result = await tomtomTileService.requestTile(layer, style, zoomInt, xInt, yInt, format);
    
    if (result.success) {
      // Set appropriate headers for image data
      res.set({
        'Content-Type': result.data.contentType,
        'Cache-Control': 'public, max-age=1800', // 30 minutes
        'X-Tile-Source': result.source,
        'X-Tile-Size': result.data.size
      });
      
      // Send base64 image data
      const imageBuffer = Buffer.from(result.data.data, 'base64');
      res.send(imageBuffer);
      
    } else {
      console.error(`❌ Tile request failed: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Tile API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tiles/traffic/:zoom/:x/:y.:format - Get traffic incident tile
router.get('/traffic/:zoom/:x/:y.:format', async (req, res) => {
  try {
    const { zoom, x, y, format } = req.params;
    const { style = 'light' } = req.query;
    
    // Validate parameters
    const zoomInt = parseInt(zoom);
    const xInt = parseInt(x);
    const yInt = parseInt(y);
    
    if (isNaN(zoomInt) || isNaN(xInt) || isNaN(yInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tile coordinates'
      });
    }
    
    if (zoomInt < 0 || zoomInt > 22) {
      return res.status(400).json({
        success: false,
        error: 'Zoom level must be between 0 and 22'
      });
    }
    
    console.log(`🚦 Traffic tile request: ${zoom}/${x}/${y}.${format} (${style})`);
    
    const result = await tomtomTileService.requestTrafficIncidentTile(zoomInt, xInt, yInt, style, format);
    
    if (result.success) {
      // Set appropriate headers for image data
      res.set({
        'Content-Type': result.data.contentType,
        'Cache-Control': 'public, max-age=300', // 5 minutes for traffic data
        'X-Tile-Source': result.source,
        'X-Tile-Size': result.data.size
      });
      
      // Send base64 image data
      const imageBuffer = Buffer.from(result.data.data, 'base64');
      res.send(imageBuffer);
      
    } else {
      console.error(`❌ Traffic tile request failed: ${result.error}`);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Traffic tile API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tiles/status - Get tile service status
router.get('/status', (req, res) => {
  try {
    const stats = tomtomTileService.getStats();
    
    res.json({
      success: true,
      tileService: {
        ...stats,
        endpoints: {
          mapTiles: '/api/tiles/map/{layer}/{style}/{zoom}/{x}/{y}.{format}',
          trafficTiles: '/api/tiles/traffic/{zoom}/{x}/{y}.{format}?style={style}',
          availableLayers: ['basic', 'hybrid', 'labels'],
          availableStyles: ['main', 'night'],
          availableFormats: ['png', 'jpg']
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Tile status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/tiles/cache/clear - Clear tile cache (admin only)
router.post('/cache/clear', (req, res) => {
  try {
    const clearedCount = tomtomTileService.cleanupCache();
    
    res.json({
      success: true,
      message: `Cleared ${clearedCount} expired tiles from cache`,
      cacheStatus: {
        size: tomtomTileService.tileCache.size,
        maxSize: tomtomTileService.maxCacheSize
      }
    });
    
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
