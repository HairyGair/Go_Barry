// backend/routes/optimizedRoadworksAPI.js
// Memory-optimized roadworks API with streaming, pagination, and selective loading

import express from 'express';
import { memoryOptimizedMiddleware, requestMemoryMonitor } from '../middleware/memoryOptimizedResponse.js';
import { memoryThrottleMiddleware } from '../middleware/memoryGuard.js';
import unifiedRoadworksManager from '../services/unifiedRoadworksManager.js';
import supervisorManager from '../services/supervisorManager.js';

const router = express.Router();

// Apply memory optimization middleware
router.use(memoryOptimizedMiddleware);
router.use(requestMemoryMonitor);
router.use(memoryThrottleMiddleware);

/**
 * GET /api/roadworks/stream
 * Stream roadworks data with memory-efficient pagination
 */
router.get('/stream', async (req, res) => {
  try {
    const {
      source = 'all',
      status = 'all', 
      limit = 100,
      fields,
      bounds, // "lat1,lng1,lat2,lng2" for spatial filtering
      compress = true
    } = req.query;

    console.log('🚧 Streaming roadworks with memory optimization...', {
      source, status, limit, fields: fields ? 'selected' : 'all'
    });

    // Parse field selection for reduced memory usage
    const selectedFields = fields ? fields.split(',').map(f => f.trim()) : null;
    
    // Parse spatial bounds if provided
    let spatialFilter = null;
    if (bounds) {
      const coords = bounds.split(',').map(parseFloat);
      if (coords.length === 4) {
        spatialFilter = {
          minLat: Math.min(coords[0], coords[2]),
          maxLat: Math.max(coords[0], coords[2]),
          minLng: Math.min(coords[1], coords[3]),
          maxLng: Math.max(coords[1], coords[3])
        };
      }
    }

    // Create memory-efficient paginated fetch function
    const fetchRoadworksPage = async (offset, pageSize) => {
      try {
        console.log(`📄 Fetching roadworks page: offset=${offset}, size=${pageSize}`);
        
        // Get roadworks with pagination
        const result = await unifiedRoadworksManager.getAllRoadworks({
          source,
          status,
          limit: pageSize,
          offset: offset
        });

        if (!result.success || !result.combined) {
          console.warn('⚠️ No roadworks data returned from manager');
          return [];
        }

        let roadworks = result.combined;

        // Apply spatial filtering if bounds provided
        if (spatialFilter && roadworks.length > 0) {
          roadworks = roadworks.filter(roadwork => {
            if (!roadwork.coordinates || !roadwork.coordinates.lat || !roadwork.coordinates.lng) {
              return false; // Skip items without coordinates
            }
            
            const lat = parseFloat(roadwork.coordinates.lat);
            const lng = parseFloat(roadwork.coordinates.lng);
            
            return lat >= spatialFilter.minLat &&
                   lat <= spatialFilter.maxLat &&
                   lng >= spatialFilter.minLng &&
                   lng <= spatialFilter.maxLng;
          });
        }

        // Apply field selection to reduce memory usage
        let processedRoadworks = roadworks;
        if (selectedFields && selectedFields.length > 0) {
          processedRoadworks = roadworks.map(roadwork => {
            const selected = {};
            for (const field of selectedFields) {
              if (roadwork.hasOwnProperty(field)) {
                selected[field] = roadwork[field];
              }
            }
            return selected;
          });
        }

        // Clear original array references for GC
        roadworks.length = 0;
        if (result.combined) {
          result.combined.length = 0;
        }

        console.log(`✅ Processed ${processedRoadworks.length} roadworks for streaming`);
        return processedRoadworks;

      } catch (error) {
        console.error('❌ Error fetching roadworks page:', error);
        return [];
      }
    };

    // Stream the paginated response
    await res.streamPaginated(fetchRoadworksPage, {
      pageSize: Math.min(parseInt(limit), 500), // Cap page size to prevent memory spikes
      totalLimit: 10000, // Prevent unbounded queries
      compress: compress === 'true'
    });

  } catch (error) {
    console.error('❌ Roadworks streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * GET /api/roadworks/active/stream
 * Stream only active roadworks with route impact analysis
 */
router.get('/active/stream', async (req, res) => {
  try {
    const {
      includeRouteImpact = false,
      fields,
      compress = true
    } = req.query;

    console.log('🚧 Streaming active roadworks with route impact analysis...');

    // Optimized fields for active roadworks
    const defaultFields = [
      'id', 'title', 'location', 'coordinates', 'status', 
      'start_date', 'end_date', 'severity', 'source'
    ];
    
    const fieldsToFetch = fields ? fields.split(',').map(f => f.trim()) : defaultFields;
    
    if (includeRouteImpact === 'true') {
      fieldsToFetch.push('affected_routes', 'route_impact_level');
    }

    // Create fetch function for active roadworks
    const fetchActiveRoadworks = async (offset, pageSize) => {
      try {
        // Get only active roadworks to reduce memory usage
        const result = await unifiedRoadworksManager.getAllRoadworks({
          source: 'all',
          status: 'active',
          limit: pageSize,
          offset: offset
        });

        if (!result.success || !result.combined) {
          return [];
        }

        // Filter for truly active roadworks
        const activeRoadworks = result.combined.filter(roadwork => {
          const now = new Date();
          const startDate = roadwork.start_date ? new Date(roadwork.start_date) : null;
          const endDate = roadwork.end_date ? new Date(roadwork.end_date) : null;
          
          // Check if roadwork is currently active
          const isActive = (!startDate || startDate <= now) && 
                          (!endDate || endDate >= now) &&
                          roadwork.status !== 'completed' &&
                          roadwork.status !== 'cancelled';
          
          return isActive;
        });

        // Apply field selection
        const processedRoadworks = activeRoadworks.map(roadwork => {
          const selected = {};
          for (const field of fieldsToFetch) {
            if (roadwork.hasOwnProperty(field)) {
              selected[field] = roadwork[field];
            }
          }
          return selected;
        });

        // Clear references for GC
        result.combined.length = 0;
        activeRoadworks.length = 0;

        return processedRoadworks;

      } catch (error) {
        console.error('❌ Error fetching active roadworks:', error);
        return [];
      }
    };

    await res.streamPaginated(fetchActiveRoadworks, {
      pageSize: 200, // Smaller page size for active roadworks
      totalLimit: 5000,
      compress: compress === 'true'
    });

  } catch (error) {
    console.error('❌ Active roadworks streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * GET /api/roadworks/summary/stream
 * Stream roadworks summary with aggregated statistics
 */
router.get('/summary/stream', async (req, res) => {
  try {
    const { groupBy = 'source', compress = true } = req.query;

    console.log(`📊 Streaming roadworks summary grouped by ${groupBy}...`);

    // Memory-efficient summary generation
    const generateSummary = async () => {
      try {
        // Get basic roadworks data with minimal fields
        const result = await unifiedRoadworksManager.getAllRoadworks({
          source: 'all',
          status: 'all',
          limit: 50000 // Large limit but still bounded
        });

        if (!result.success || !result.combined) {
          return { success: false, summary: [] };
        }

        const roadworks = result.combined;
        
        // Create summary groups with memory-efficient processing
        const summaryMap = new Map();
        
        // Process roadworks in chunks to prevent memory spikes
        const chunkSize = 1000;
        for (let i = 0; i < roadworks.length; i += chunkSize) {
          const chunk = roadworks.slice(i, i + chunkSize);
          
          chunk.forEach(roadwork => {
            const groupKey = roadwork[groupBy] || 'unknown';
            
            if (!summaryMap.has(groupKey)) {
              summaryMap.set(groupKey, {
                group: groupKey,
                total: 0,
                active: 0,
                planned: 0,
                completed: 0,
                severity: { low: 0, medium: 0, high: 0, critical: 0 }
              });
            }
            
            const summary = summaryMap.get(groupKey);
            summary.total++;
            
            // Status counting
            const status = (roadwork.status || '').toLowerCase();
            if (status.includes('active') || status.includes('in progress')) {
              summary.active++;
            } else if (status.includes('planned') || status.includes('upcoming')) {
              summary.planned++;
            } else if (status.includes('completed') || status.includes('finished')) {
              summary.completed++;
            }
            
            // Severity counting
            const severity = (roadwork.severity || 'medium').toLowerCase();
            if (summary.severity.hasOwnProperty(severity)) {
              summary.severity[severity]++;
            } else {
              summary.severity.medium++;
            }
          });
          
          // Clear chunk reference for GC
          chunk.length = 0;
        }
        
        // Convert map to array
        const summaryArray = Array.from(summaryMap.values());
        
        // Clear references for GC
        roadworks.length = 0;
        result.combined.length = 0;
        summaryMap.clear();
        
        return {
          success: true,
          summary: summaryArray,
          metadata: {
            groupBy,
            totalGroups: summaryArray.length,
            generatedAt: new Date().toISOString()
          }
        };
        
      } catch (error) {
        console.error('❌ Error generating roadworks summary:', error);
        return { success: false, error: error.message };
      }
    };

    // Generate and stream summary
    const summaryResult = await generateSummary();
    
    if (!summaryResult.success) {
      return res.status(500).json({
        success: false,
        error: summaryResult.error || 'Failed to generate summary'
      });
    }

    await res.streamJSON(summaryResult.summary, {
      compress: compress === 'true',
      metadata: summaryResult.metadata
    });

  } catch (error) {
    console.error('❌ Roadworks summary streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

/**
 * POST /api/roadworks/search/stream
 * Search roadworks with streaming results
 */
router.post('/search/stream', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      fields,
      limit = 100,
      compress = true
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    console.log(`🔍 Searching roadworks for: "${query}"`);

    const selectedFields = fields || [
      'id', 'title', 'location', 'coordinates', 'status', 
      'start_date', 'end_date', 'description', 'source'
    ];

    // Create search function with memory optimization
    const searchRoadworks = async (offset, pageSize) => {
      try {
        const result = await unifiedRoadworksManager.getAllRoadworks({
          source: filters.source || 'all',
          status: filters.status || 'all',
          limit: pageSize * 2, // Get more to account for filtering
          offset: offset
        });

        if (!result.success || !result.combined) {
          return [];
        }

        // Perform text search on relevant fields
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        const matchingRoadworks = result.combined.filter(roadwork => {
          const searchableText = [
            roadwork.title || '',
            roadwork.location || '',
            roadwork.description || '',
            roadwork.status || '',
            roadwork.source || ''
          ].join(' ').toLowerCase();

          return searchTerms.some(term => searchableText.includes(term));
        });

        // Apply additional filters
        let filteredRoadworks = matchingRoadworks;
        
        if (filters.severity) {
          filteredRoadworks = filteredRoadworks.filter(r => 
            (r.severity || '').toLowerCase() === filters.severity.toLowerCase()
          );
        }

        if (filters.dateRange) {
          const { start, end } = filters.dateRange;
          filteredRoadworks = filteredRoadworks.filter(r => {
            const roadworkStart = r.start_date ? new Date(r.start_date) : null;
            const roadworkEnd = r.end_date ? new Date(r.end_date) : null;
            
            if (start && roadworkEnd && roadworkEnd < new Date(start)) return false;
            if (end && roadworkStart && roadworkStart > new Date(end)) return false;
            
            return true;
          });
        }

        // Apply field selection and limit results
        const processedResults = filteredRoadworks
          .slice(0, pageSize)
          .map(roadwork => {
            const selected = {};
            for (const field of selectedFields) {
              if (roadwork.hasOwnProperty(field)) {
                selected[field] = roadwork[field];
              }
            }
            return selected;
          });

        // Clear references for GC
        result.combined.length = 0;
        matchingRoadworks.length = 0;
        filteredRoadworks.length = 0;

        return processedResults;

      } catch (error) {
        console.error('❌ Error searching roadworks:', error);
        return [];
      }
    };

    await res.streamPaginated(searchRoadworks, {
      pageSize: Math.min(parseInt(limit), 200),
      totalLimit: 2000, // Reasonable limit for search results
      compress: compress === true
    });

  } catch (error) {
    console.error('❌ Roadworks search streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

export default router;