/**
 * Supabase Optimization API Routes
 * Monitor and control Supabase usage optimization
 */

import express from 'express';
import { supabaseOptimizer } from '../services/supabaseOptimizer.js';

const router = express.Router();

/**
 * GET /api/supabase/stats
 * Get Supabase usage and cache statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = supabaseOptimizer.getCacheStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: stats,
      recommendations: generateRecommendations(stats)
    });
  } catch (error) {
    console.error('[Supabase API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/supabase/clear-cache
 * Clear cache for specific pattern or all cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    const { pattern } = req.body;
    
    supabaseOptimizer.clearCache(pattern);
    
    res.json({
      success: true,
      message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Supabase API] Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/supabase/usage-report
 * Generate detailed usage optimization report
 */
router.get('/usage-report', async (req, res) => {
  try {
    const stats = supabaseOptimizer.getCacheStats();
    const recommendations = generateRecommendations(stats);
    
    // Calculate potential savings
    const potentialSavings = calculatePotentialSavings(stats);
    
    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: stats.totalQueries,
        cacheHitRate: stats.hitRate,
        cacheSize: stats.cacheSize,
        estimatedEgressSaved: potentialSavings.egressSaved,
        estimatedCostSaved: potentialSavings.costSaved
      },
      performance: {
        cacheHits: stats.hits,
        cacheMisses: stats.misses,
        memoryUsage: stats.memory
      },
      recommendations,
      optimizations: {
        implemented: [
          'Query result caching with TTL',
          'Automatic LIMIT clauses on SELECT queries',
          'Batch query processing',
          'Static data long-term caching'
        ],
        pending: [
          'Data archival for old records',
          'Query result pagination',
          'Connection pooling optimization'
        ]
      }
    };
    
    res.json(report);
  } catch (error) {
    console.error('[Supabase API] Usage report error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function generateRecommendations(stats) {
  const recommendations = [];
  
  if (stats.hitRate < 50) {
    recommendations.push({
      type: 'Low Cache Hit Rate',
      description: `Cache hit rate is ${stats.hitRate}%. Consider increasing cache TTL for static data.`,
      priority: 'high'
    });
  }
  
  if (stats.totalQueries > 1000) {
    recommendations.push({
      type: 'High Query Volume',
      description: `${stats.totalQueries} queries executed. Implement more aggressive caching.`,
      priority: 'medium'
    });
  }
  
  if (stats.cacheSize > 800) {
    recommendations.push({
      type: 'Large Cache Size',
      description: `Cache contains ${stats.cacheSize} entries. Consider reducing TTL or cache size.`,
      priority: 'low'
    });
  }
  
  return recommendations;
}

function calculatePotentialSavings(stats) {
  // Rough estimates based on typical Supabase query sizes
  const avgQuerySizeKB = 2; // Assume 2KB average response
  const egressSavedKB = stats.hits * avgQuerySizeKB;
  const egressSavedMB = egressSavedKB / 1024;
  
  // Rough cost calculation (Supabase charges ~$0.09/GB egress)
  const costSavedUSD = (egressSavedMB / 1024) * 0.09;
  
  return {
    egressSaved: `${egressSavedMB.toFixed(2)} MB`,
    costSaved: `$${costSavedUSD.toFixed(4)} USD`,
    queriesSaved: stats.hits
  };
}

export default router;