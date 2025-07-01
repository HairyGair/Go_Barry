/*
 * Go BARRY - Bus Locations API Routes
 * Real-time bus location endpoints
 */

import express from 'express';
import { busLocationService } from '../services/busLocationService.js';
import { convexSync } from '../services/convexSync.js';

const router = express.Router();

// Get current bus locations
router.get('/', async (req, res) => {
  try {
    const { forceRefresh } = req.query;
    const result = await busLocationService.getBusLocations(forceRefresh === 'true');
    
    res.json({
      success: true,
      buses: result.data || [],
      metadata: {
        count: result.data?.length || 0,
        cached: result.cached || false,
        timestamp: result.timestamp,
        lastUpdated: new Date(result.timestamp).toISOString(),
        error: result.error
      }
    });
    
    // Sync to Convex for real-time updates (non-blocking)
    if (result.data && result.data.length > 0) {
      convexSync.syncBusLocations(result.data).catch(err => {
        console.warn('⚠️ Failed to sync bus locations to Convex:', err.message);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching bus locations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      buses: []
    });
  }
});

// Get bus location statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = busLocationService.getStatistics();
    
    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting bus location stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      statistics: {
        totalVehicles: 0,
        activeVehicles: 0,
        delayedVehicles: 0,
        uniqueRoutes: 0,
        lastUpdate: null,
        dataSource: 'error',
        dataQuality: 'unavailable'
      }
    });
  }
});

// Get bus location service configuration
router.get('/config', async (req, res) => {
  try {
    const config = busLocationService.getConfiguration();
    
    res.json({
      success: true,
      configuration: config,
      timestamp: new Date().toISOString(),
      message: 'Updated to use Go North East specific dataset 9264'
    });
    
  } catch (error) {
    console.error('❌ Error getting bus location config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Set data source preference
router.post('/set-datasource', async (req, res) => {
  try {
    const { useSpecificDataset = true } = req.body;
    
    busLocationService.setDataSourcePreference(useSpecificDataset);
    
    res.json({
      success: true,
      message: `Data source preference updated to: ${useSpecificDataset ? 'specific dataset 9264' : 'generic multiplestops.xml'}`,
      newConfiguration: busLocationService.getConfiguration(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error setting data source preference:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test both data sources
router.get('/test-sources', async (req, res) => {
  try {
    console.log('🧪 Testing both bus data sources...');
    
    const results = {
      specific: { tested: false },
      generic: { tested: false }
    };
    
    // Test specific dataset 9264
    try {
      const originalPreference = busLocationService.useSpecificDataset;
      busLocationService.useSpecificDataset = true;
      
      const specificResult = await busLocationService.getBusLocations(true);
      results.specific = {
        tested: true,
        success: specificResult.success,
        count: specificResult.count || 0,
        dataSource: specificResult.dataSource,
        dataQuality: specificResult.dataQuality,
        error: specificResult.error
      };
      
      // Restore original preference
      busLocationService.useSpecificDataset = originalPreference;
    } catch (specificError) {
      results.specific = {
        tested: true,
        success: false,
        error: specificError.message
      };
    }
    
    // Test generic endpoint
    try {
      const originalPreference = busLocationService.useSpecificDataset;
      busLocationService.useSpecificDataset = false;
      
      const genericResult = await busLocationService.getBusLocations(true);
      results.generic = {
        tested: true,
        success: genericResult.success,
        count: genericResult.count || 0,
        dataSource: genericResult.dataSource,
        dataQuality: genericResult.dataQuality,
        error: genericResult.error
      };
      
      // Restore original preference
      busLocationService.useSpecificDataset = originalPreference;
    } catch (genericError) {
      results.generic = {
        tested: true,
        success: false,
        error: genericError.message
      };
    }
    
    const recommendation = results.specific.success ? 
      'Use specific dataset 9264 for better data quality' :
      results.generic.success ? 
        'Use generic multiplestops.xml as fallback' :
        'Both data sources failed - check network connectivity';
    
    res.json({
      success: true,
      testResults: results,
      recommendation,
      summary: {
        specificWorking: results.specific.success,
        genericWorking: results.generic.success,
        specificVehicles: results.specific.count || 0,
        genericVehicles: results.generic.count || 0,
        qualityImprovement: results.specific.success && results.generic.success ? 
          `${((results.specific.count || 0) / (results.generic.count || 1) * 100).toFixed(1)}% of generic data` : 'unknown'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error testing data sources:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear bus location cache
router.post('/refresh', async (req, res) => {
  try {
    busLocationService.clearCache();
    const result = await busLocationService.getBusLocations(true);
    
    res.json({
      success: true,
      message: 'Bus locations refreshed',
      buses: result.data || [],
      metadata: {
        count: result.data?.length || 0,
        timestamp: result.timestamp
      }
    });
    
  } catch (error) {
    console.error('❌ Error refreshing bus locations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      buses: []
    });
  }
});

export default router;
