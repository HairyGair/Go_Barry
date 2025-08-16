/*
 * Go BARRY - Bus Locations API Routes
 * Real-time bus location endpoints
 */

import express from 'express';
import fetch from 'node-fetch';
import busLocationService from '../services/busLocationService.js';
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
    
    // Test BODS API endpoints according to official documentation
    const tests = [
      {
        name: 'All Bus Location Feeds',
        url: `https://data.bus-data.dft.gov.uk/api/v1/datafeed/?api_key=${apiKey}`,
        headers: {
          'Accept': 'application/xml, text/xml, application/json, */*',
          'User-Agent': 'Go-BARRY/1.0'
        }
      },
      {
        name: 'Filtered by Operator (GONE)',
        url: `https://data.bus-data.dft.gov.uk/api/v1/datafeed/?api_key=${apiKey}&operatorRef=GONE`,
        headers: {
          'Accept': 'application/xml, text/xml, application/json, */*',
          'User-Agent': 'Go-BARRY/1.0'
        }
      },
      {
        name: 'Filtered by Bounding Box (North East)',
        url: `https://data.bus-data.dft.gov.uk/api/v1/datafeed/?api_key=${apiKey}&boundingBox=-2.2,54.7,-1.3,55.2`,
        headers: {
          'Accept': 'application/xml, text/xml, application/json, */*',
          'User-Agent': 'Go-BARRY/1.0'
        }
      },
      {
        name: 'Specific Feed ID 9264',
        url: `https://data.bus-data.dft.gov.uk/api/v1/datafeed/9264/?api_key=${apiKey}`,
        headers: {
          'Accept': 'application/xml, text/xml, application/json, */*',
          'User-Agent': 'Go-BARRY/1.0'
        }
      },
      {
        name: 'Check Available Feeds (JSON)',
        url: `https://data.bus-data.dft.gov.uk/api/v1/datafeed/?api_key=${apiKey}&format=json`,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Go-BARRY/1.0'
        }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log('📍 URL:', test.url.replace(apiKey, '***'));
      
      try {
        const response = await fetch(test.url, {
          method: 'GET',
          headers: test.headers
        });
        
        const contentType = response.headers.get('content-type');
        let responseData = '';
        let dataFormat = 'unknown';
        let dataPreview = '';
        
        if (response.ok) {
          if (contentType?.includes('json')) {
            const json = await response.json();
            responseData = JSON.stringify(json);
            dataFormat = 'json';
            dataPreview = JSON.stringify(json, null, 2).substring(0, 500) + '...';
          } else if (contentType?.includes('xml')) {
            responseData = await response.text();
            dataFormat = 'xml';
            dataPreview = responseData.substring(0, 500) + '...';
          } else if (contentType?.includes('protobuf') || contentType?.includes('octet-stream')) {
            const buffer = await response.arrayBuffer();
            dataFormat = 'protobuf';
            dataPreview = `Binary data (${buffer.byteLength} bytes)`;
          } else {
            responseData = await response.text();
            dataFormat = 'text';
            dataPreview = responseData.substring(0, 500) + '...';
          }
        } else {
          // Try to get error message
          try {
            responseData = await response.text();
            dataPreview = responseData.substring(0, 500);
          } catch (e) {
            dataPreview = 'Could not read error response';
          }
        }
        
        results.push({
          test: test.name,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType,
          dataFormat,
          dataPreview,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        console.log(`📡 Result: ${response.status} ${response.statusText}`);
        
      } catch (error) {
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
        console.error(`❌ Error: ${error.message}`);
      }
    }
    
    // Find successful tests
    const successfulTests = results.filter(r => r.success);
    const recommendation = successfulTests.length > 0 ?
      `Use ${successfulTests[0].test} method` :
      'All authentication methods failed - check API key or subscription status';
    
    res.json({
      success: true,
      apiKey: {
        configured: !!apiKey,
        last4: apiKey ? '***' + apiKey.slice(-4) : 'not-set'
      },
      results,
      summary: {
        tested: results.length,
        successful: successfulTests.length,
        failed: results.filter(r => !r.success).length
      },
      recommendation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name
    });
  }
});

// Test webhook configuration status
router.get('/webhook/test-config', async (req, res) => {
  try {
    const apiKey = process.env.UK_BUS_DATA_API_KEY || '1b7862548843de84e3ee3602c9b9b2488b736fd3';
    
    res.json({
      success: true,
      webhookConfiguration: {
        endpoint: 'https://go-barry.onrender.com/api/bus-locations/webhook',
        subscriptionId: '5faf8676-0523-4b50-9ace-7c244f084418',
        datasetId: '9264',
        operator: 'Go North East',
        updateInterval: '10 seconds',
        apiKeyConfigured: !!apiKey,
        apiKeyLast4: apiKey ? '***' + apiKey.slice(-4) : 'not-set',
        status: 'waiting_for_data'
      },
      instructions: [
        '1. The webhook is configured to receive data every 10 seconds',
        '2. UK Bus Data API will POST data to our webhook endpoint',
        '3. Check backend logs for incoming webhook data',
        '4. Data format will likely be SIRI-VM XML or JSON',
        '5. Once data arrives, it will be cached and available at /api/bus-locations'
      ],
      troubleshooting: [
        'If no data arrives, check subscription status on UK Bus Data portal',
        'Ensure the webhook URL is accessible from the internet',
        'Check if subscription needs to be activated/confirmed',
        'Monitor backend logs for any webhook activity'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test BODS API configuration
router.get('/test-bods', async (req, res) => {
  try {
    const hasBodsKey = !!process.env.BODS_API_KEY;
    const hasDatafeedId = !!process.env.BODS_GNE_DATAFEED_ID;
    const hasApiUrl = !!process.env.BODS_API_URL;
    
    const configStatus = {
      hasBodsKey,
      bodsKeyLength: process.env.BODS_API_KEY ? process.env.BODS_API_KEY.length : 0,
      hasDatafeedId,
      datafeedId: process.env.BODS_GNE_DATAFEED_ID || 'not set',
      hasApiUrl,
      apiUrl: process.env.BODS_API_URL || 'not set',
      isConfigured: hasBodsKey && hasDatafeedId && hasApiUrl
    };
    
    res.json({
      success: true,
      configuration: configStatus,
      message: configStatus.isConfigured ? 'BODS API configured' : 'BODS API not configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('BODS test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test BODS configuration',
      message: error.message
    });
  }
});

// Test Convex sync
router.get('/test-convex-sync', async (req, res) => {
  try {
    // Get a small sample of bus data
    const buses = await busLocationService.fetchBusLocations();
    const sampleBuses = buses.slice(0, 3); // Just 3 buses for testing
    
    // Try to sync to Convex
    const result = await convexSync.syncBusLocations();
    
    res.json({
      success: true,
      bodsDataReceived: buses.length,
      sampleBuses: sampleBuses.map(b => ({
        id: b.id,
        route: b.lineName,
        operator: b.operatorRef,
        location: b.location
      })),
      convexSyncResult: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Convex sync test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Convex sync',
      message: error.message,
      stack: error.stack
    });
  }
});

export default router;
