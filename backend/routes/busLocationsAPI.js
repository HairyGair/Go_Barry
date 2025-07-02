/*
 * Go BARRY - Bus Locations API Routes
 * Real-time bus location endpoints
 */

import express from 'express';
import fetch from 'node-fetch';
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
    // NOTE: Disabled until syncBusLocations function is implemented in Convex
    // if (result.data && result.data.length > 0) {
    //   convexSync.syncBusLocations(result.data).catch(err => {
    //     console.warn('⚠️ Failed to sync bus locations to Convex:', err.message);
    //   });
    // }
    
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

// Webhook endpoint for UK Bus Data API - receives real-time bus location updates
router.post('/webhook', async (req, res) => {
  try {
    console.log('🚌 Bus location webhook received');
    console.log('📦 Content-Type:', req.headers['content-type']);
    console.log('📏 Content-Length:', req.headers['content-length']);
    
    // Get the raw body based on content type
    let busData;
    if (req.headers['content-type']?.includes('json')) {
      busData = req.body;
    } else if (req.headers['content-type']?.includes('xml')) {
      // For XML data, req.body should be text if express.text() middleware is used
      busData = req.body;
    } else {
      // Default to treating as JSON
      busData = req.body;
    }
    
    // Log the data type for debugging
    console.log('📊 Data type:', typeof busData);
    console.log('📊 Data preview:', typeof busData === 'string' ? 
      busData.substring(0, 200) + '...' : 
      JSON.stringify(busData).substring(0, 200) + '...'
    );
    
    // Process the webhook data
    const result = await busLocationService.processBusDataWebhook(busData);
    
    // Sync to Convex for real-time updates if we have processed data
    if (result.success && result.buses?.length > 0) {
      // TODO: Enable when syncBusLocations is implemented in Convex
      // await convexSync.syncBusLocations(result.buses).catch(err => {
      //   console.warn('⚠️ Failed to sync bus locations to Convex:', err.message);
      // });
      console.log(`✅ Processed ${result.buses.length} bus locations from webhook`);
    }
    
    // Return success response to acknowledge receipt
    res.status(200).json({ 
      success: true,
      message: 'Webhook data received successfully',
      processed: result.buses?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Bus webhook error:', error);
    console.error('Stack trace:', error.stack);
    
    // Still return 200 to acknowledge receipt, but indicate error
    res.status(200).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook health check endpoint
router.get('/webhook/health', async (req, res) => {
  try {
    const lastWebhookData = busLocationService.getLastWebhookData();
    
    res.json({
      success: true,
      status: 'ready',
      lastWebhook: lastWebhookData || null,
      endpoint: 'https://go-barry.onrender.com/api/bus-locations/webhook',
      acceptedFormats: ['application/json', 'application/xml', 'text/xml'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to test direct API access
router.get('/debug-api', async (req, res) => {
  try {
    console.log('🔍 Testing direct UK Bus Data API access...');
    
    const apiKey = process.env.UK_BUS_DATA_API_KEY || '1b7862548843de84e3ee3602c9b9b2488b736fd3';
    const apiUrl = `https://data.bus-data.dft.gov.uk/api/v1/datafeed/9264/?api_key=${apiKey}`;
    
    console.log('📍 API URL:', apiUrl.replace(apiKey, '***' + apiKey.slice(-4)));
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml,application/json',
        'User-Agent': 'Go-BARRY-Traffic-Intelligence/1.0'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    let responseData;
    let dataFormat = 'unknown';
    
    if (contentType?.includes('json')) {
      responseData = await response.json();
      dataFormat = 'json';
    } else if (contentType?.includes('xml')) {
      responseData = await response.text();
      dataFormat = 'xml';
    } else {
      responseData = await response.text();
      dataFormat = 'text';
    }
    
    res.json({
      success: response.ok,
      debug: {
        apiUrl: apiUrl.replace(apiKey, '***' + apiKey.slice(-4)),
        status: response.status,
        statusText: response.statusText,
        contentType,
        dataFormat,
        dataPreview: typeof responseData === 'string' ? 
          responseData.substring(0, 500) + '...' : 
          JSON.stringify(responseData).substring(0, 500) + '...',
        dataLength: typeof responseData === 'string' ? responseData.length : JSON.stringify(responseData).length,
        hasApiKey: !!apiKey,
        apiKeyLast4: apiKey ? '***' + apiKey.slice(-4) : 'not-set'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      debug: {
        hasApiKey: !!process.env.UK_BUS_DATA_API_KEY,
        apiKeyConfigured: process.env.UK_BUS_DATA_API_KEY ? 'yes' : 'no'
      }
    });
  }
});

export default router;
