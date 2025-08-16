// backend/routes/unifiedRoadworksAPI.js
// API endpoints for unified roadworks management

import express from 'express';
import unifiedRoadworksManager from '../services/unifiedRoadworksManager.js';
import supervisorManager from '../services/supervisorManager.js';
import redisCache from '../services/redisCache.js';
import StreamingResponseService from '../services/streamingResponse.js';

// Enhanced supervisor logging imports
import {
  enhancedSupervisorAuth,
  enhancedSupervisorLogout,
  enhancedAlertDismissal,
  enhancedRoadworkAction,
  enhancedIncidentCreation,
  enhancedCommunicationLogging,
  enhancedAdminAction,
  logScreenNavigation,
  logSettingsUpdate,
  logDataAccess,
  getSupervisorFromSession
} from '../patches/supervisorLoggingIntegration.js';

const router = express.Router();

/**
 * GET /api/roadworks/unified
 * Get all roadworks from all sources (Street Manager, Durham, Manual)
 * NOW WITH: Redis caching, streaming responses, memory optimization
 */
router.get('/unified', redisCache.middleware(300), async (req, res) => {
  try {
    console.log('📋 API: Fetching unified roadworks data...');
    
    const {
      source = 'all', // all, street_manager, manual
      status = 'all', // all, active, planned, completed
      limit = 50, // Memory optimized - max 50 items per page
      offset = 0,
      include_dismissed = 'false' // NEW: Include dismissed alerts (admin/audit feature)
    } = req.query;
    
    console.log(`🔍 Query params: source=${source}, status=${status}, limit=${limit}, offset=${offset}, include_dismissed=${include_dismissed}`);

    const result = await unifiedRoadworksManager.getAllRoadworks({
      source,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeDismissed: include_dismissed === 'true'
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
    
    console.log(`📦 Before filtering: ${filteredRoadworks.length} total roadworks`);
    console.log(`📦 Sample sources:`, filteredRoadworks.slice(0, 5).map(r => r.source));

    if (source !== 'all') {
      // Handle both exact match and partial match for StreetManager
      filteredRoadworks = filteredRoadworks.filter(r => {
        const roadworkSource = r.source?.toLowerCase() || '';
        const querySource = source.toLowerCase();
        
        // For StreetManager, match both 'streetmanager' and 'street_manager' variants
        if (querySource === 'streetmanager' || querySource === 'street_manager') {
          return roadworkSource.includes('street') && roadworkSource.includes('manager');
        }
        
        return roadworkSource === querySource;
      });
      
      console.log(`🎯 After source filter (${source}): ${filteredRoadworks.length} roadworks`);
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

    // Check if streaming is requested
    if (StreamingResponseService.supportsStreaming(req) || req.query.stream === 'true') {
      console.log('📡 Streaming response requested');
      
      // Stream paginated data
      return res.streamPaginated(
        async (pageSize, offset) => {
          const pageResult = await unifiedRoadworksManager.getAllRoadworks({
            source,
            status,
            limit: Math.min(pageSize, 50), // Enforce 50 max per page
            offset,
            includeDismissed: include_dismissed === 'true'
          });
          return pageResult.success ? pageResult.combined : [];
        },
        {
          pageSize: Math.min(parseInt(limit), 50),
          maxPages: Math.ceil(total / Math.min(parseInt(limit), 50)),
          delayMs: 50 // Small delay to prevent memory spikes
        }
      );
    }

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
        filters: { source, status, include_dismissed }
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
      supervisor.supervisor.name,
      supervisor.supervisor.badge,
      supervisor.supervisor.id
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
 * Acknowledge a roadwork with enhanced validation and error handling
 * Optimized for Go BARRY's 2GB RAM constraint and production requirements
 */
router.post('/:id/acknowledge', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { note, supervisorToken } = req.body;

    // Enhanced input validation
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Roadwork ID is required',
        code: 'MISSING_ROADWORK_ID'
      });
    }

    if (!supervisorToken || supervisorToken.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Supervisor token is required',
        code: 'MISSING_SUPERVISOR_TOKEN'
      });
    }

    // Verify supervisor token with enhanced error handling
    const supervisor = await supervisorManager.getSupervisorFromToken(supervisorToken);
    if (!supervisor.success) {
      console.warn(`🚫 Invalid supervisor token attempted for roadwork ${id}:`, supervisorToken.substring(0, 10) + '...');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired supervisor token',
        code: 'INVALID_SUPERVISOR_TOKEN'
      });
    }

    // Validate note length (prevent memory bloat)
    const sanitizedNote = note ? note.substring(0, 500).trim() : '';
    if (note && note.length > 500) {
      console.warn(`⚠️ Note truncated from ${note.length} to 500 characters for roadwork ${id}`);
    }

    console.log(`🔐 Supervisor ${supervisor.supervisor.name} (${supervisor.supervisor.id}) acknowledging roadwork ${id}`);

    // Acknowledge the roadwork with enhanced error handling
    const result = await unifiedRoadworksManager.acknowledgeRoadwork(
      id.trim(), 
      sanitizedNote, 
      supervisor.supervisor.name
    );

    if (result.success) {
      // Log the activity with enhanced metadata
      try {
        await supervisorManager.logActivity(
          supervisor.supervisor.id,
          'roadwork_acknowledged',
          {
            roadworkId: id,
            note: sanitizedNote || 'No note provided',
            table: result.metadata?.table || 'unknown',
            processingTime: Date.now() - startTime
          },
          req
        );
      } catch (logError) {
        console.warn('⚠️ Failed to log acknowledgment activity:', logError.message);
        // Continue - acknowledgment succeeded even if logging failed
      }

      console.log(`✅ API: Roadwork ${id} acknowledged by ${supervisor.supervisor.name} in ${Date.now() - startTime}ms`);
      
      // Return enhanced response with metadata
      return res.json({
        success: true,
        data: result.data,
        metadata: {
          ...result.metadata,
          processingTime: Date.now() - startTime,
          acknowledgedBy: {
            id: supervisor.supervisor.id,
            name: supervisor.supervisor.name,
            badge: supervisor.supervisor.badge
          }
        }
      });
    } else {
      // Handle specific error cases
      let statusCode = 500;
      let errorCode = 'ACKNOWLEDGMENT_FAILED';
      
      if (result.notFound) {
        statusCode = 404;
        errorCode = 'ROADWORK_NOT_FOUND';
      } else if (result.dbError) {
        statusCode = 503;
        errorCode = 'DATABASE_ERROR';
      }
      
      console.error(`❌ API: Failed to acknowledge roadwork ${id}:`, result.error);
      
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: errorCode,
        metadata: {
          roadworkId: id,
          supervisorId: supervisor.supervisor.id,
          processingTime: Date.now() - startTime
        }
      });
    }

  } catch (error) {
    console.error('❌ API Error acknowledging roadwork:', error);
    
    // Memory-conscious error response
    const errorResponse = {
      success: false,
      error: 'Internal server error during roadwork acknowledgment',
      code: 'INTERNAL_ERROR',
      metadata: {
        processingTime: Date.now() - startTime
      }
    };
    
    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        message: error.message,
        stack: error.stack?.substring(0, 500) // Limit stack trace size
      };
    }
    
    res.status(500).json(errorResponse);
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
    
    // Clear all cache including dismissed/active specific caches
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
      filteredRoadworks = filteredRoadworks.filter(r => 
        r.source?.toLowerCase() === source.toLowerCase()
      );
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