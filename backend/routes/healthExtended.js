// backend/routes/healthExtended.js
// Enhanced health monitoring including time-based polling, duplicate detection, and geocoding

import express from 'express';
import axios from 'axios';
import enhancedDataSourceManager from '../services/enhancedDataSourceManager.js';
import timeBasedPollingManager from '../services/timeBasedPollingManager.js';
import duplicateDetectionManager from '../services/duplicateDetectionManager.js';
import enhancedGeocodingService from '../services/enhancedGeocodingService.js';

const router = express.Router();

router.get('/health-extended', async (req, res) => {
  console.log('🏥 Running extended health check...');
  const startTime = Date.now();
  
  const healthData = {
    status: 'Enhanced Health Check',
    timestamp: new Date().toISOString(),
    services: {},
    dataFeeds: {},
    intelligence: {},
    pollingStatus: null,
    systemCapacity: {},
    performance: {}
  };

  // 1. Time-based polling status
  try {
    console.log('⏰ Checking time-based polling status...');
    healthData.pollingStatus = timeBasedPollingManager.getOptimizedSchedule();
    healthData.services.timeBasedPolling = '✅ Active';
  } catch (error) {
    healthData.services.timeBasedPolling = `❌ Error: ${error.message}`;
  }

  // 2. Individual API health checks with polling compliance
  const apiChecks = [
    {
      name: 'tomtom',
      url: 'https://api.tomtom.com/traffic/services/5/incidentDetails',
      params: `?key=${process.env.TOMTOM_API_KEY}&bbox=-1.8,54.8,-1.4,55.1&fields=basicPoint`
    },
    {
      name: 'here', 
      url: 'https://traffic.ls.hereapi.com/traffic/6.3/incidents.json',
      params: `?bbox=54.8,-1.8;55.1,-1.4&apiKey=${process.env.HERE_API_KEY}`
    },
    {
      name: 'mapquest',
      url: 'https://www.mapquestapi.com/traffic/v2/incidents',
      params: `?key=${process.env.MAPQUEST_API_KEY}&boundingBox=55.05,-2.10,54.75,-1.35`
    },
    {
      name: 'nationalHighways',
      url: process.env.NATIONAL_HIGHWAYS_API_URL,
      headers: { 'Ocp-Apim-Subscription-Key': process.env.NATIONAL_HIGHWAYS_API_KEY }
    }
  ];

  console.log('🌐 Testing individual APIs...');
  for (const api of apiChecks) {
    try {
      // Check if polling is allowed for this source
      const pollingCheck = timeBasedPollingManager.canPollSource(api.name);
      
      if (!pollingCheck.allowed) {
        healthData.dataFeeds[api.name] = `⏳ Rate Limited: ${pollingCheck.reason}`;
        continue;
      }

      const url = api.url + (api.params || '');
      const config = api.headers ? { headers: api.headers } : {};
      
      const response = await axios.get(url, { ...config, timeout: 10000 });
      healthData.dataFeeds[api.name] = response.status === 200 ? '✅ Working' : `⚠️ Status ${response.status}`;
      
      // Record successful poll
      timeBasedPollingManager.recordPoll(api.name, true);
      
    } catch (error) {
      const status = error.response?.status || 'Connection Error';
      const message = error.response?.data?.error_description || error.response?.data?.message || error.message;
      healthData.dataFeeds[api.name] = `❌ ${status}: ${message}`;
      
      // Record failed poll
      timeBasedPollingManager.recordPoll(api.name, false);
    }
  }

  // 3. Enhanced data source manager status
  try {
    console.log('📊 Checking enhanced data source manager...');
    const currentData = enhancedDataSourceManager.getCurrentData();
    const sourceStats = enhancedDataSourceManager.getSourceStatistics();
    
    healthData.services.enhancedDataManager = '✅ Active';
    healthData.systemCapacity = {
      totalSources: sourceStats.totalSources,
      enabledSources: sourceStats.enabledSources,
      activeSources: sourceStats.activeSources,
      utilizationRate: `${sourceStats.utilizationRate}%`,
      lastUpdate: currentData.lastUpdate,
      cacheStatus: currentData.incidents?.length > 0 ? 'Populated' : 'Empty'
    };
  } catch (error) {
    healthData.services.enhancedDataManager = `❌ Error: ${error.message}`;
  }

  // 4. Duplicate detection service
  try {
    console.log('🔍 Checking duplicate detection service...');
    const duplicateStats = duplicateDetectionManager.getStatistics();
    healthData.services.duplicateDetection = '✅ Active';
    healthData.intelligence.duplicateDetection = {
      cacheSize: duplicateStats.cacheSize,
      thresholds: duplicateStats.thresholds,
      sourceReliabilities: duplicateStats.sourceReliabilities
    };
  } catch (error) {
    healthData.services.duplicateDetection = `❌ Error: ${error.message}`;
  }

  // 5. Enhanced geocoding service
  try {
    console.log('🌍 Checking enhanced geocoding service...');
    const geocodingStats = enhancedGeocodingService.getStatistics();
    healthData.services.enhancedGeocoding = '✅ Active';
    healthData.intelligence.geocoding = {
      cacheSize: geocodingStats.cache.size,
      maxCacheSize: geocodingStats.cache.maxSize,
      availableAPIs: geocodingStats.apis.length,
      thresholds: geocodingStats.thresholds
    };
  } catch (error) {
    healthData.services.enhancedGeocoding = `❌ Error: ${error.message}`;
  }

  // 6. Test full data pipeline
  try {
    console.log('🔄 Testing full data pipeline...');
    const testData = await enhancedDataSourceManager.aggregateAllSources();
    
    healthData.intelligence.dataPipeline = {
      status: '✅ Working',
      totalIncidents: testData.incidents?.length || 0,
      duplicatesRemoved: testData.duplicationStats?.duplicatesRemoved || 0,
      geocodedIncidents: testData.stats?.geocoded || 0,
      enhancedIncidents: testData.stats?.enhanced || 0,
      fetchDuration: testData.performance?.fetchDuration || 'Unknown'
    };
  } catch (error) {
    healthData.intelligence.dataPipeline = {
      status: `❌ Error: ${error.message}`,
      totalIncidents: 0
    };
  }

  // 7. Memory and performance metrics
  const endTime = Date.now();
  const memoryUsage = process.memoryUsage();
  
  healthData.performance = {
    healthCheckDuration: `${endTime - startTime}ms`,
    memoryUsage: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    systemLoad: {
      uptime: `${Math.round(process.uptime())}s`,
      nodeVersion: process.version,
      platform: process.platform
    }
  };

  // 8. Overall system health assessment
  const serviceStatuses = Object.values(healthData.services);
  const workingServices = serviceStatuses.filter(status => status.startsWith('✅')).length;
  const totalServices = serviceStatuses.length;
  
  const feedStatuses = Object.values(healthData.dataFeeds);
  const workingFeeds = feedStatuses.filter(status => status.startsWith('✅')).length;
  const totalFeeds = feedStatuses.length;
  
  healthData.overallHealth = {
    status: workingServices === totalServices && workingFeeds > 0 ? 'HEALTHY' : 'DEGRADED',
    servicesOnline: `${workingServices}/${totalServices}`,
    dataFeedsOnline: `${workingFeeds}/${totalFeeds}`,
    summary: `${workingServices + workingFeeds}/${totalServices + totalFeeds} components operational`
  };

  console.log(`✅ Extended health check complete in ${endTime - startTime}ms`);
  console.log(`📊 Overall health: ${healthData.overallHealth.status}`);
  
  res.json(healthData);
});

// Additional endpoint for just polling status
router.get('/polling-status', async (req, res) => {
  try {
    const pollingStatus = timeBasedPollingManager.getOptimizedSchedule();
    const generalStatus = timeBasedPollingManager.getStatus();
    
    res.json({
      status: 'Polling Status Check',
      timestamp: new Date().toISOString(),
      pollingSchedule: pollingStatus,
      generalStatus: generalStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message
    });
  }
});

// Emergency override endpoint (for critical situations)
router.post('/emergency-override', async (req, res) => {
  try {
    const { reason, durationMinutes = 60 } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Reason required for emergency override'
      });
    }
    
    timeBasedPollingManager.enableEmergencyOverride(reason, durationMinutes);
    
    res.json({
      status: 'Emergency override enabled',
      reason,
      duration: `${durationMinutes} minutes`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.post('/disable-override', async (req, res) => {
  try {
    timeBasedPollingManager.disableEmergencyOverride();
    
    res.json({
      status: 'Emergency override disabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
