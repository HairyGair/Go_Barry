// backend/routes/unifiedRoadworksAPI.js
// API endpoints for unified roadworks management

import express from 'express';
import unifiedRoadworksManager from '../services/unifiedRoadworksManager.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

/**
 * GET /api/roadworks/unified
 * Get all roadworks from all sources (Street Manager, Durham, Manual)
 */
router.get('/unified', async (req, res) => {
  try {
    console.log('📋 API: Fetching unified roadworks data...');
    
    const {
      source = 'all', // all, street_manager, manual
      status = 'all', // all, active, planned, completed
      limit = 50,
      offset = 0
    } = req.query;

    const result = await unifiedRoadworksManager.getAllRoadworks({
      source,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        data: []
      });
    }

    // Apply filters
    let filteredRoadworks = result.combined;

    if (source !== 'all') {
      filteredRoadworks = filteredRoadworks.filter(r => r.source === source);
    }

    if (status !== 'all') {
      filteredRoadworks = filteredRoadworks.filter(r => 
        r.status?.toLowerCase().includes(status.toLowerCase())
      );
    }

    // Apply pagination
    const total = filteredRoadworks.length;
    const paginatedRoadworks = filteredRoadworks.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );

    console.log(`✅ API: Returning ${paginatedRoadworks.length}/${total} unified roadworks`);

    res.json({
      success: true,
      roadworks: paginatedRoadworks,
      metadata: {
        ...result.metadata,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < total
        },
        filters: { source, status }
      }
    });

  } catch (error) {
    console.error('❌ API Error fetching unified roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

/**
 * POST /api/roadworks/:id/dismiss
 * Dismiss a roadwork with reason
 */
router.post('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, supervisorToken } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Dismissal reason is required'
      });
    }

    // Verify supervisor token
    const supervisor = await supervisorManager.getSupervisorFromToken(supervisorToken);
    if (!supervisor.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor token'
      });
    }

    const result = await unifiedRoadworksManager.dismissRoadwork(
      id, 
      reason, 
      supervisor.supervisor.name
    );

    if (result.success) {
      // Log the activity
      await supervisorManager.logActivity(
        supervisor.supervisor.id,
        'roadwork_dismissed',
        {
          roadworkId: id,
          reason: reason,
          location: 'Unknown' // Could be enhanced to include location
        },
        req
      );

      console.log(`✅ API: Roadwork ${id} dismissed by ${supervisor.supervisor.name}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ API Error dismissing roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/roadworks/:id/acknowledge
 * Acknowledge a roadwork with optional note
 */
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { note, supervisorToken } = req.body;

    // Verify supervisor token
    const supervisor = await supervisorManager.getSupervisorFromToken(supervisorToken);
    if (!supervisor.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor token'
      });
    }

    const result = await unifiedRoadworksManager.acknowledgeRoadwork(
      id, 
      note || 'Acknowledged', 
      supervisor.supervisor.name
    );

    if (result.success) {
      // Log the activity
      await supervisorManager.logActivity(
        supervisor.supervisor.id,
        'roadwork_acknowledged',
        {
          roadworkId: id,
          note: note || 'No note provided'
        },
        req
      );

      console.log(`✅ API: Roadwork ${id} acknowledged by ${supervisor.supervisor.name}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ API Error acknowledging roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/roadworks/:id/save
 * Save/bookmark a roadwork
 */
router.post('/:id/save', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, supervisorToken } = req.body;

    // Verify supervisor token
    const supervisor = await supervisorManager.getSupervisorFromToken(supervisorToken);
    if (!supervisor.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid supervisor token'
      });
    }

    const result = await unifiedRoadworksManager.saveRoadwork(
      id, 
      supervisor.supervisor.name,
      notes || ''
    );

    if (result.success) {
      // Log the activity
      await supervisorManager.logActivity(
        supervisor.supervisor.id,
        'roadwork_saved',
        {
          roadworkId: id,
          notes: notes || 'No notes'
        },
        req
      );

      console.log(`✅ API: Roadwork ${id} saved by ${supervisor.supervisor.name}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ API Error saving roadwork:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks/:id/history
 * Get management history for a roadwork
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await unifiedRoadworksManager.getRoadworkHistory(id);
    
    if (result.success) {
      console.log(`✅ API: Retrieved history for roadwork ${id}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ API Error getting roadwork history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks/stats
 * Get roadworks management statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const result = await unifiedRoadworksManager.getManagementStats(timeframe);
    
    if (result.success) {
      console.log(`✅ API: Retrieved roadworks stats for ${timeframe}`);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ API Error getting roadworks stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks/sources
 * Get status of all roadworks data sources
 */
router.get('/sources', async (req, res) => {
  try {
    const result = await unifiedRoadworksManager.getAllRoadworks();
    
    if (result.success) {
      res.json({
        success: true,
        sources: result.metadata.sources,
        summary: {
          totalSources: Object.keys(result.metadata.sources).length,
          activeSources: Object.values(result.metadata.sources).filter(s => s.success).length,
          totalRoadworks: result.metadata.totalCount,
          lastUpdate: result.metadata.lastUpdate
        }
      });
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ API Error getting sources status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/roadworks/refresh
 * Force refresh of all roadworks data
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('🔄 API: Force refreshing roadworks data...');
    
    // Clear any cache
    unifiedRoadworksManager.cache.clear();
    
    const result = await unifiedRoadworksManager.getAllRoadworks();
    
    if (result.success) {
      console.log(`✅ API: Refreshed roadworks data - ${result.metadata.totalCount} total`);
    }

    res.json({
      success: result.success,
      message: result.success ? 'Roadworks data refreshed successfully' : 'Failed to refresh roadworks data',
      error: result.error,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ API Error refreshing roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/roadworks/search
 * Search roadworks by location, description, or other criteria
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      location, 
      source = 'all', 
      limit = 20 
    } = req.query;

    if (!query && !location) {
      return res.status(400).json({
        success: false,
        error: 'Search query or location is required'
      });
    }

    const result = await unifiedRoadworksManager.getAllRoadworks();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    let filteredRoadworks = result.combined;

    // Apply source filter
    if (source !== 'all') {
      filteredRoadworks = filteredRoadworks.filter(r => r.source === source);
    }

    // Apply search filters
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredRoadworks = filteredRoadworks.filter(r => 
        r.title?.toLowerCase().includes(searchTerm) ||
        r.description?.toLowerCase().includes(searchTerm) ||
        r.location?.toLowerCase().includes(searchTerm) ||
        r.streetName?.toLowerCase().includes(searchTerm)
      );
    }

    if (location) {
      const locationTerm = location.toLowerCase();
      filteredRoadworks = filteredRoadworks.filter(r => 
        r.location?.toLowerCase().includes(locationTerm) ||
        r.streetName?.toLowerCase().includes(locationTerm) ||
        r.areaName?.toLowerCase().includes(locationTerm)
      );
    }

    // Apply limit
    const searchResults = filteredRoadworks.slice(0, parseInt(limit));

    console.log(`🔍 API: Search returned ${searchResults.length} results for "${query || location}"`);

    res.json({
      success: true,
      results: searchResults,
      metadata: {
        query: query || location,
        totalResults: filteredRoadworks.length,
        returnedResults: searchResults.length,
        source: source
      }
    });

  } catch (error) {
    console.error('❌ API Error searching roadworks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


export default router;