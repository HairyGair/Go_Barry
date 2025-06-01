// backend/index.js
// BARRY Backend - Using the WORKING comprehensive traffic fetcher
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchComprehensiveTrafficData } from './fetch-comprehensive-traffic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Backend Starting...');
console.log('🎯 Using WORKING comprehensive traffic fetcher');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Load Street Manager data from files
async function loadStreetManagerData() {
  try {
    console.log('📁 Loading Street Manager data from files...');
    
    const dataDir = path.join(__dirname, 'data');
    const files = await fs.readdir(dataDir).catch(() => []);
    
    if (files.length === 0) {
      return { success: true, data: [], count: 0 };
    }
    
    const streetWorksFiles = files.filter(file => 
      file.includes('street') && file.endsWith('.json')
    );
    
    let allWorks = [];
    
    for (const file of streetWorksFiles) {
      try {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const works = JSON.parse(content);
        
        if (Array.isArray(works)) {
          allWorks.push(...works);
        }
      } catch (fileError) {
        console.warn(`⚠️ Error reading ${file}:`, fileError.message);
      }
    }
    
    console.log(`📄 Loaded ${allWorks.length} street works from files`);
    return { success: true, data: allWorks, count: allWorks.length };
    
  } catch (error) {
    console.warn('⚠️ Street Manager file loading failed:', error.message);
    return { success: true, data: [], count: 0 };
  }
}

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Main alerts endpoint using YOUR working fetcher
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached GNE alerts');
      return res.json({
        success: true,
        alerts: cachedAlerts.alerts,
        metadata: {
          ...cachedAlerts.metadata,
          cached: true,
          servedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('🔄 Fetching GNE-focused alerts using comprehensive traffic system...');
    
    // Use YOUR working comprehensive traffic fetcher
    const comprehensiveResult = await fetchComprehensiveTrafficData();
    
    // Also load Street Manager data
    const streetManagerResult = await loadStreetManagerData();
    
    let allAlerts = [];
    const sources = {};
    
    // Process comprehensive traffic data
    if (comprehensiveResult.success) {
      allAlerts.push(...comprehensiveResult.alerts);
      
      // Map the comprehensive results to our sources format
      if (comprehensiveResult.metadata && comprehensiveResult.metadata.sources) {
        sources.here = comprehensiveResult.metadata.sources.here;
        sources.mapquest = comprehensiveResult.metadata.sources.mapquest; 
        sources.nationalHighways = comprehensiveResult.metadata.sources.nationalHighways;
      }
      
      console.log(`✅ Comprehensive Traffic: ${comprehensiveResult.alerts.length} alerts loaded`);
    } else {
      console.log('❌ Comprehensive traffic fetch failed');
      sources.comprehensiveTraffic = {
        success: false,
        count: 0,
        error: 'Comprehensive traffic fetch failed'
      };
    }
    
    // Process Street Manager data
    if (streetManagerResult.success) {
      // Convert street manager data to alert format
      const streetManagerAlerts = streetManagerResult.data.map(work => ({
        id: `sm_${work.work_reference_number || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'roadwork',
        title: work.activity_type || 'Street Works',
        description: work.description || 'Local authority roadworks',
        location: work.location_description || work.street_name || 'Local Road',
        authority: work.promoter_organisation || 'Local Authority',
        source: 'streetmanager',
        severity: work.traffic_management_type?.includes('road_closure') ? 'High' : 'Medium',
        status: 'amber',
        startDate: work.actual_start_date || work.proposed_start_date || null,
        endDate: work.actual_end_date || work.proposed_end_date || null,
        affectsRoutes: [],
        lastUpdated: new Date().toISOString(),
        dataSource: 'Street Manager (Local File)'
      }));
      
      allAlerts.push(...streetManagerAlerts);
      sources.streetManager = {
        success: true,
        count: streetManagerAlerts.length,
        method: 'File Storage'
      };
      
      console.log(`✅ Street Manager: ${streetManagerAlerts.length} alerts loaded`);
    } else {
      sources.streetManager = {
        success: false,
        count: 0,
        error: streetManagerResult.error || 'No data files found'
      };
    }
    
    // Calculate comprehensive statistics
    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: allAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: allAlerts.filter(a => a.status === 'green').length,
      highSeverity: allAlerts.filter(a => a.severity === 'High').length,
      mediumSeverity: allAlerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: allAlerts.filter(a => a.severity === 'Low').length,
      totalIncidents: allAlerts.filter(a => a.type === 'incident').length,
      totalCongestion: allAlerts.filter(a => a.type === 'congestion').length,
      totalRoadworks: allAlerts.filter(a => a.type === 'roadwork').length
    };
    
    // Cache results
    cachedAlerts = {
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: comprehensiveResult.metadata?.processingTime || 'N/A',
        gneRelevant: true,
        usingComprehensiveFetcher: true
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ GNE-FOCUSED: ${allAlerts.length} relevant alerts (${stats.activeAlerts} active) covering multiple routes`);
    
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ Alerts endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Test endpoint with sample data
app.get('/api/alerts-test', async (req, res) => {
  console.log('🧪 Serving test alerts data...');
  
  const sampleTestAlerts = [
    {
      id: 'test_001',
      type: 'incident',
      title: 'Vehicle Breakdown - A1 Northbound',
      description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66. Recovery vehicle en route.',
      location: 'A1 Northbound, Junction 65 (Birtley)',
      authority: 'National Highways',
      source: 'national_highways',
      severity: 'High',
      status: 'red',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      affectsRoutes: ['21', '22', 'X21', '25', '28'],
      lastUpdated: new Date().toISOString(),
      dataSource: 'Test Data'
    }
  ];
  
  const testResponse = {
    success: true,
    alerts: sampleTestAlerts,
    metadata: {
      totalAlerts: sampleTestAlerts.length,
      sources: {
        nationalHighways: { success: true, count: 1, method: 'Test Data' },
        mapquest: { success: true, count: 0, method: 'Test Data' },
        here: { success: true, count: 0, method: 'Test Data' },
        streetManager: { success: true, count: 0, method: 'Test Data' }
      },
      lastUpdated: new Date().toISOString(),
      testMode: true
    }
  };
  
  res.json(testResponse);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0-comprehensive',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY,
      port: PORT
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0,
    usingComprehensiveFetcher: true
  });
});

// Force refresh
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh requested...');
    cachedAlerts = null;
    lastFetchTime = null;
    
    res.json({
      success: true,
      message: 'Cache cleared - next request will fetch fresh comprehensive data',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚦 BARRY Backend - Using Comprehensive Traffic Intelligence',
    version: '3.0-comprehensive',
    status: 'healthy',
    endpoints: {
      alerts: '/api/alerts (Using comprehensive fetcher)',
      'alerts-test': '/api/alerts-test',
      health: '/api/health',
      refresh: '/api/refresh'
    },
    dataSources: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY
    },
    usingComprehensiveFetcher: true
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Backend Started - Comprehensive Traffic Intelligence`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📊 Data Sources Configuration:`);
  console.log(`   🛣️  National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   🚗 TomTom Traffic: ${process.env.TOMTOM_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   🗺️  MapQuest Traffic: ${process.env.MAPQUEST_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   📡 HERE Traffic: ${process.env.HERE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`\n🎯 Using YOUR working comprehensive traffic fetcher!`);
  console.log(`   📍 Zone-based fetching for North East regions`);
  console.log(`   🔧 Fixed API authentication (query params)`);
  console.log(`   📊 Multi-source integration`);
  console.log(`   🚌 GNE route impact analysis`);
  
  // Initial data load
  setTimeout(async () => {
    try {
      console.log('\n🔄 Loading initial comprehensive traffic data...');
      
      // Clear cache to force fresh fetch
      cachedAlerts = null;
      lastFetchTime = null;
      
      // Test the comprehensive fetcher directly
      const result = await fetchComprehensiveTrafficData();
      
      if (result.success) {
        console.log(`✅ Initial comprehensive load: ${result.alerts.length} alerts`);
        console.log(`📊 Sources: ${Object.keys(result.metadata?.sources || {}).join(', ')}`);
      } else {
        console.log(`❌ Initial comprehensive load failed`);
      }
    } catch (error) {
      console.log(`❌ Initial load error: ${error.message}`);
    }
  }, 3000);
});

export default app;