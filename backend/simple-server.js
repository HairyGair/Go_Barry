// backend/simple-server.js
// Simplified BARRY Backend - Focus on getting basic data working
import express from 'express';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Simple Backend Starting...');
console.log('🎯 Focus: Get National Highways data working first');

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

// Enhanced North East route mapping
const LOCATION_ROUTE_MAPPING = {
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309'],
  'a167': ['21', '22', 'X21', '50', '6', '7'],
  'a1058': ['1', '2', '308', '309', '311', '317'],
  'a184': ['25', '28', '29', '93', '94'],
  'a690': ['61', '62', '63', '64', '65'],
  'a69': ['X84', 'X85', '602', '685'],
  'a183': ['16', '18', '20', '61', '62'],
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65'],
  'durham': ['21', '22', 'X21', '50', '6', '7', '13', '14'],
  'tyne tunnel': ['1', '2', '308', '309', '311'],
  'coast road': ['1', '2', '308', '309', '311', '317'],
  'central motorway': ['Q1', 'Q2', 'Q3', 'QUAYSIDE']
};

// Helper functions
function isInNorthEast(location, description = '') {
  const text = `${location} ${description}`.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY'
  ];
  return keywords.some(keyword => text.includes(keyword));
}

function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  
  for (const [pattern, routeList] of Object.entries(LOCATION_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  // Check for A-road patterns
  const roadPattern = /\b(a\d+|m\d+|b\d+)\b/gi;
  let match;
  while ((match = roadPattern.exec(text)) !== null) {
    const road = match[1].toLowerCase();
    if (LOCATION_ROUTE_MAPPING[road]) {
      LOCATION_ROUTE_MAPPING[road].forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

function classifyAlert(alert) {
  const now = new Date();
  let status = 'green';
  
  try {
    const startDate = alert.startDate ? new Date(alert.startDate) : null;
    const endDate = alert.endDate ? new Date(alert.endDate) : null;
    
    if (startDate && endDate) {
      if (startDate <= now && endDate >= now) {
        status = 'red'; // Active
      } else if (startDate > now) {
        const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7) {
          status = 'amber'; // Upcoming
        }
      }
    } else if (alert.category?.toLowerCase().includes('closure')) {
      status = 'red'; // Assume active if it's a closure
    }
  } catch (error) {
    console.warn('⚠️ Alert classification error:', error.message);
  }
  
  return status;
}

// Fetch National Highways data
async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🌐 Fetching National Highways data...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 15000
    });
    
    console.log(`📡 National Highways API response status: ${response.status}`);
    
    if (!response.data || !response.data.features) {
      console.warn('⚠️ No features in National Highways response');
      return { success: false, data: [], error: 'No features in response' };
    }
    
    const allFeatures = response.data.features;
    console.log(`📊 Total features from National Highways: ${allFeatures.length}`);
    
    // Filter for North East and process
    const northEastAlerts = allFeatures
      .filter(feature => {
        const location = feature.properties?.location || feature.properties?.description || '';
        const isNE = isInNorthEast(location, feature.properties?.comment || '');
        if (isNE) {
          console.log(`✅ North East match: ${location}`);
        }
        return isNE;
      })
      .map(feature => {
        const props = feature.properties;
        const routes = matchRoutes(props.location || '', props.description || '');
        const status = classifyAlert(props);
        
        return {
          id: `nh_${props.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'roadwork',
          title: props.title || props.description || 'National Highways Closure',
          description: props.description || props.comment || 'Planned closure or roadworks',
          location: props.location || 'Major Road Network',
          authority: 'National Highways',
          source: 'national_highways',
          severity: props.category?.toLowerCase().includes('closure') ? 'High' : 'Medium',
          status: status,
          startDate: props.startDate || null,
          endDate: props.endDate || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'National Highways DATEX II API',
          
          // Raw data for debugging
          rawData: {
            category: props.category,
            roadName: props.roadName,
            routeName: props.routeName
          }
        };
      });
    
    console.log(`✅ Processed ${northEastAlerts.length} North East alerts`);
    
    // Sort by priority
    northEastAlerts.sort((a, b) => {
      const statusPriority = { red: 3, amber: 2, green: 1 };
      const severityPriority = { High: 3, Medium: 2, Low: 1 };
      
      const aStatusScore = statusPriority[a.status] || 0;
      const bStatusScore = statusPriority[b.status] || 0;
      
      if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
      
      const aSeverityScore = severityPriority[a.severity] || 0;
      const bSeverityScore = severityPriority[b.severity] || 0;
      
      return bSeverityScore - aSeverityScore;
    });
    
    return { success: true, data: northEastAlerts, count: northEastAlerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    if (error.response) {
      console.error(`📡 Response status: ${error.response.status}`);
      console.error(`📡 Response data:`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Load Street Manager data from files
async function loadStreetManagerData() {
  try {
    console.log('📁 Loading Street Manager data from files...');
    
    const dataDir = path.join(__dirname, 'data');
    const files = await fs.readdir(dataDir).catch(() => []);
    
    if (files.length === 0) {
      console.log('📁 No data files found - creating sample data');
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
    return { success: true, data: [], count: 0 }; // Don't fail if no files
  }
}

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Main alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached alerts');
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
    
    console.log('🔄 Fetching fresh alerts...');
    
    // Fetch from all sources
    const [nhResult, smResult] = await Promise.allSettled([
      fetchNationalHighways(),
      loadStreetManagerData()
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    // Process National Highways results
    if (nhResult.status === 'fulfilled' && nhResult.value.success) {
      allAlerts.push(...nhResult.value.data);
      sources.nationalHighways = {
        success: true,
        count: nhResult.value.count,
        method: 'Direct API'
      };
    } else {
      sources.nationalHighways = {
        success: false,
        count: 0,
        error: nhResult.status === 'rejected' ? nhResult.reason.message : nhResult.value.error
      };
    }
    
    // Process Street Manager results
    if (smResult.status === 'fulfilled' && smResult.value.success) {
      sources.streetManager = {
        success: true,
        count: smResult.value.count,
        method: 'File Storage'
      };
    } else {
      sources.streetManager = {
        success: false,
        count: 0,
        error: smResult.status === 'rejected' ? smResult.reason.message : smResult.value.error
      };
    }
    
    // Calculate statistics
    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: allAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: allAlerts.filter(a => a.status === 'green').length,
      highSeverity: allAlerts.filter(a => a.severity === 'High').length,
      mediumSeverity: allAlerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: allAlerts.filter(a => a.severity === 'Low').length
    };
    
    // Cache results
    cachedAlerts = {
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: 'N/A'
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ Serving ${allAlerts.length} alerts (${stats.activeAlerts} active)`);
    
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

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0-simple',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      port: PORT
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0
  });
});

// Force refresh
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh requested...');
    cachedAlerts = null;
    lastFetchTime = null;
    
    // Trigger fresh fetch
    const alertsResponse = await axios.get(`http://localhost:${PORT}/api/alerts`);
    
    res.json({
      success: true,
      message: 'Cache cleared and data refreshed',
      timestamp: new Date().toISOString(),
      alerts: alertsResponse.data.alerts.length
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
    message: '🚦 BARRY Simple Backend',
    version: '1.0',
    status: 'healthy',
    endpoints: {
      alerts: '/api/alerts',
      health: '/api/health',
      refresh: '/api/refresh'
    },
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Simple Backend Started`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📊 Configuration:`);
  console.log(`   🔑 National Highways API: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`\n📡 Available Endpoints:`);
  console.log(`   🎯 Main: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/alerts`);
  console.log(`   💚 Health: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/health`);
  console.log(`   🔄 Refresh: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/refresh`);
  
  // Initial data load
  setTimeout(async () => {
    try {
      console.log('\n🔄 Loading initial data...');
      const result = await fetchNationalHighways();
      if (result.success) {
        console.log(`✅ Initial load: ${result.count} alerts from National Highways`);
      } else {
        console.log(`❌ Initial load failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Initial load error: ${error.message}`);
    }
  }, 2000);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

export default app;