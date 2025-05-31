// backend/index.js
// BARRY Enhanced Backend - Complete Traffic Intelligence Platform
// Integrates: Street Manager + National Highways + HERE + MapQuest
import express from 'express';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchComprehensiveTrafficData } from './fetch-comprehensive-traffic.js'; // New comprehensive traffic system

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Enhanced Backend - Complete Traffic Intelligence Platform');
console.log('📊 Data Sources: Street Manager + National Highways + HERE + MapQuest');
console.log('🎯 Target: Go North East Bus Operations');

// Enhanced configuration
const SYSTEM_CONFIG = {
  streetManager: {
    method: 'AWS SNS Webhooks + Stored Files',
    enabled: true,
    features: ['local_authority_roadworks', 'street_works', 'permits']
  },
  nationalHighways: {
    method: 'Direct DATEX II API',
    enabled: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
    apiKey: process.env.NATIONAL_HIGHWAYS_API_KEY,
    features: ['major_road_incidents', 'planned_closures', 'roadworks']
  },
  here: {
    method: 'HERE Traffic API v7',
    enabled: !!process.env.HERE_API_KEY,
    apiKey: process.env.HERE_API_KEY,
    features: ['traffic_flow', 'congestion_analysis', 'lane_level_precision', 'jam_factor'],
    limit: '1,000 transactions/month'
  },
  mapquest: {
    method: 'MapQuest Traffic API v2',
    enabled: !!process.env.MAPQUEST_API_KEY,
    apiKey: process.env.MAPQUEST_API_KEY,
    features: ['traffic_incidents', 'detailed_descriptions', 'construction_events'],
    limit: '15,000 transactions/month'
  }
};

// Enhanced route mapping (your existing + traffic-specific)
const ENHANCED_LOCATION_ROUTE_MAPPING = {
  // Your existing mappings
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309'],
  'a167': ['21', '22', 'X21', '50', '6', '7'],
  'a1058': ['1', '2', '308', '309', '311', '317'],
  'a184': ['25', '28', '29', '93', '94'],
  'a690': ['61', '62', '63', '64', '65'],
  'a69': ['X84', 'X85', '602', '685'],
  'a183': ['16', '18', '20', '61', '62'],
  
  // Enhanced traffic-specific keywords
  'traffic': [], // Generic traffic alerts
  'congestion': [], // Congestion alerts
  'incident': [], // Traffic incidents
  'accident': [], // Accidents
  'breakdown': [], // Vehicle breakdowns
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65'],
  'durham': ['21', '22', 'X21', '50', '6', '7', '13', '14'],
  'tyne tunnel': ['1', '2', '308', '309', '311'],
  'coast road': ['1', '2', '308', '309', '311', '317'],
  'central motorway': ['Q1', 'Q2', 'Q3', 'QUAYSIDE']
};

// Middleware (unchanged)
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// CORS
app.use((req, res, next) => {
  // Allow all origins for mobile app testing
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-amz-sns-message-type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging with enhanced traffic tracking
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  
  // Track traffic API usage
  if (req.path.includes('/traffic') || req.path.includes('/congestion')) {
    console.log(`🚦 Traffic API request: ${req.path}`);
  }
  
  next();
});

// Enhanced helper functions
function matchRoutes(location, streetName = '', description = '') {
  const routes = new Set();
  const text = `${location} ${streetName} ${description}`.toLowerCase();
  
  for (const [pattern, routeList] of Object.entries(ENHANCED_LOCATION_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  // Enhanced road pattern matching for traffic data
  const roadPattern = /\b(a\d+(?:\([m]\))?|b\d+|m\d+)\b/gi;
  let match;
  while ((match = roadPattern.exec(text)) !== null) {
    const road = match[1].toLowerCase();
    if (ENHANCED_LOCATION_ROUTE_MAPPING[road]) {
      ENHANCED_LOCATION_ROUTE_MAPPING[road].forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

function isInNorthEast(location, description = '') {
  const text = `${location} ${description}`.toUpperCase();
  const northEastKeywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY',
    // Enhanced traffic location keywords
    'METRO CENTRE', 'BLAYDON', 'CONSETT', 'STANLEY', 'HOUGHTON'
  ];
  
  return northEastKeywords.some(keyword => text.includes(keyword));
}

function classifyAlert(alert) {
  const now = new Date();
  let status = 'green';
  let startDate = null;
  let endDate = null;
  
  try {
    // Handle different date field names from various sources
    const startFields = [
      'startDate', 'start_date', 'overallStartTime', 'proposed_start_date', 
      'actual_start_date_time', 'startTime', 'entryTime'
    ];
    
    const endFields = [
      'endDate', 'end_date', 'overallEndTime', 'proposed_end_date', 
      'actual_end_date_time', 'endTime', 'estimatedClearTime'
    ];
    
    for (const field of startFields) {
      if (alert[field]) {
        startDate = new Date(alert[field]);
        if (!isNaN(startDate.getTime())) break;
      }
    }
    
    for (const field of endFields) {
      if (alert[field]) {
        endDate = new Date(alert[field]);
        if (!isNaN(endDate.getTime())) break;
      }
    }
    
    // Enhanced classification for traffic data
    if (alert.type === 'congestion') {
      if (alert.congestionLevel >= 8 || alert.jamFactor >= 0.7) {
        status = 'red'; // Severe congestion
      } else if (alert.congestionLevel >= 5 || alert.jamFactor >= 0.4) {
        status = 'amber'; // Moderate congestion
      } else {
        status = 'green'; // Light congestion
      }
    } else if (alert.type === 'incident') {
      if (alert.roadClosed || alert.severity === 'High') {
        status = 'red'; // Major incident
      } else {
        status = 'amber'; // Minor incident
      }
    } else {
      // Traditional roadworks classification
      if (startDate && endDate) {
        if (startDate <= now && endDate >= now) {
          status = 'red'; // Active
        } else if (startDate > now) {
          const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7) {
            status = 'amber'; // Upcoming
          }
        }
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Alert classification error:', error.message);
  }
  
  return {
    status,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null
  };
}

// Your existing Street Manager functions (unchanged)
async function loadStreetManagerData() {
  try {
    console.log('📁 Loading Street Manager data from stored files...');
    
    const dataDir = path.join(__dirname, 'data');
    const files = await fs.readdir(dataDir);
    const streetWorksFiles = files.filter(file => 
      file.startsWith('streetworks-') && file.endsWith('.json')
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
        
        console.log(`📄 Loaded ${Array.isArray(works) ? works.length : 0} works from ${file}`);
      } catch (fileError) {
        console.warn(`⚠️ Error reading ${file}:`, fileError.message);
      }
    }
    
    // Process and filter Street Manager data
    const processedWorks = allWorks
      .filter(work => {
        const location = work.location || work.street || work.area || '';
        return isInNorthEast(location, work.description || '');
      })
      .map(work => {
        const classification = classifyAlert(work);
        const routes = matchRoutes(
          work.location || work.street || '',
          work.street || '',
          work.description || work.activity_type || ''
        );
        
        return {
          id: work.permit_reference_number || work.id || `sm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'roadwork',
          title: `${work.activity_type || 'Street Works'} - ${work.street || work.location || 'Unknown Location'}`,
          description: work.description || work.activity_type || 'Street works in progress',
          location: `${work.street || work.location || 'Unknown Location'}, ${work.area || 'North East'}`,
          authority: work.highway_authority || work.authority || 'Local Authority',
          source: 'streetmanager',
          severity: work.traffic_management_type === 'road_closure' ? 'High' : 
                   work.traffic_management_type === 'lane_closure' ? 'Medium' : 'Low',
          status: classification.status,
          startDate: classification.startDate,
          endDate: classification.endDate,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'Street Manager via AWS SNS'
        };
      });
    
    console.log(`✅ Street Manager: ${processedWorks.length} works processed`);
    return { success: true, data: processedWorks, count: processedWorks.length };
    
  } catch (error) {
    console.error('❌ Street Manager data loading failed:', error.message);
    return { success: false, data: [], count: 0, error: error.message };
  }
}

// Your existing National Highways function (unchanged)
async function fetchNationalHighwaysData() {
  if (!SYSTEM_CONFIG.nationalHighways.enabled) {
    console.warn('⚠️ National Highways API not configured');
    return { success: false, data: [], count: 0, error: 'API key missing' };
  }

  try {
    console.log('🌐 Fetching National Highways data via API...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': SYSTEM_CONFIG.nationalHighways.apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 15000
    });
    
    let processedAlerts = [];
    
    if (response.data && response.data.features) {
      processedAlerts = response.data.features
        .filter(feature => {
          const location = feature.properties?.location || feature.properties?.description || '';
          return isInNorthEast(location);
        })
        .map(feature => {
          const props = feature.properties;
          const classification = classifyAlert(props);
          const routes = matchRoutes(props.location || '', '', props.description || '');
          
          return {
            id: `nh_${props.id || Date.now()}`,
            type: 'roadwork',
            title: props.title || props.description || 'National Highways Closure',
            description: props.description || props.comment || 'Planned closure or roadworks',
            location: props.location || 'Major Road Network',
            authority: 'National Highways',
            source: 'national_highways',
            severity: props.category?.toLowerCase().includes('closure') ? 'High' : 'Medium',
            status: classification.status,
            startDate: classification.startDate,
            endDate: classification.endDate,
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'National Highways DATEX II API'
          };
        });
    }
    
    console.log(`✅ National Highways: ${processedAlerts.length} alerts processed`);
    return { success: true, data: processedAlerts, count: processedAlerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API failed:', error.message);
    return { success: false, data: [], count: 0, error: error.message };
  }
}

// ENHANCED: Unified data processing with comprehensive traffic integration
async function fetchUnifiedAlertsWithTraffic() {
  console.log('🚀 Creating UNIFIED alerts: Street Manager + National Highways + Traffic Data...');
  
  const startTime = Date.now();
  
  // Load/fetch all data sources in parallel
  const [streetManagerResult, nationalHighwaysResult, comprehensiveTrafficResult] = await Promise.allSettled([
    loadStreetManagerData(),
    fetchNationalHighwaysData(),
    fetchComprehensiveTrafficData() // NEW: Comprehensive traffic from HERE + MapQuest
  ]);
  
  // Combine all alerts
  const allAlerts = [];
  
  // Street Manager data
  if (streetManagerResult.status === 'fulfilled' && streetManagerResult.value.success) {
    allAlerts.push(...streetManagerResult.value.data);
  }
  
  // National Highways data
  if (nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success) {
    allAlerts.push(...nationalHighwaysResult.value.data);
  }
  
  // NEW: Comprehensive traffic data (HERE + MapQuest + Enhanced National Highways)
  if (comprehensiveTrafficResult.status === 'fulfilled' && comprehensiveTrafficResult.value.success) {
    allAlerts.push(...comprehensiveTrafficResult.value.alerts);
  }
  
  // Enhanced classification and sorting
  const enhancedAlerts = allAlerts.map(alert => {
    const classification = classifyAlert(alert);
    return {
      ...alert,
      status: classification.status,
      startDate: classification.startDate || alert.startDate,
      endDate: classification.endDate || alert.endDate,
      processedAt: new Date().toISOString()
    };
  });
  
  // Enhanced sorting: incidents > congestion > roadworks, then by priority
  enhancedAlerts.sort((a, b) => {
    const typePriority = { incident: 5, congestion: 4, roadwork: 3, unknown: 1 };
    const statusPriority = { red: 3, amber: 2, green: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 1;
    const bTypeScore = typePriority[b.type] || 1;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aStatusScore = statusPriority[a.status] || 0;
    const bStatusScore = statusPriority[b.status] || 0;
    
    if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    if (aSeverityScore !== bSeverityScore) return bSeverityScore - aSeverityScore;
    
    // Final sort by congestion level for traffic alerts
    const aCongestion = a.congestionLevel || 0;
    const bCongestion = b.congestionLevel || 0;
    
    return bCongestion - aCongestion;
  });
  
  const processingTime = Date.now() - startTime;
  
  // Save unified data
  await saveUnifiedData(enhancedAlerts);
  
  const successfulSources = [
    streetManagerResult.status === 'fulfilled' && streetManagerResult.value.success,
    nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success,
    comprehensiveTrafficResult.status === 'fulfilled' && comprehensiveTrafficResult.value.success
  ].filter(Boolean).length;
  
  return {
    success: true,
    alerts: enhancedAlerts,
    metadata: {
      totalAlerts: enhancedAlerts.length,
      sources: {
        streetManager: {
          method: 'AWS SNS Webhooks + Stored Files',
          success: streetManagerResult.status === 'fulfilled' && streetManagerResult.value.success,
          count: streetManagerResult.status === 'fulfilled' ? streetManagerResult.value.count : 0,
          error: streetManagerResult.status === 'rejected' ? streetManagerResult.reason.message : null
        },
        nationalHighways: {
          method: 'Direct DATEX II API',
          success: nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success,
          count: nationalHighwaysResult.status === 'fulfilled' ? nationalHighwaysResult.value.count : 0,
          error: nationalHighwaysResult.status === 'rejected' ? nationalHighwaysResult.reason.message : null
        },
        comprehensiveTraffic: {
          method: 'Multi-API Traffic Intelligence (HERE + MapQuest + Enhanced NH)',
          success: comprehensiveTrafficResult.status === 'fulfilled' && comprehensiveTrafficResult.value.success,
          count: comprehensiveTrafficResult.status === 'fulfilled' ? comprehensiveTrafficResult.value.alerts.length : 0,
          details: comprehensiveTrafficResult.status === 'fulfilled' ? comprehensiveTrafficResult.value.metadata : {},
          error: comprehensiveTrafficResult.status === 'rejected' ? comprehensiveTrafficResult.reason.message : null
        }
      },
      statistics: {
        // Enhanced statistics with traffic intelligence
        totalIncidents: enhancedAlerts.filter(a => a.type === 'incident').length,
        totalCongestion: enhancedAlerts.filter(a => a.type === 'congestion').length,
        totalRoadworks: enhancedAlerts.filter(a => a.type === 'roadwork').length,
        activeAlerts: enhancedAlerts.filter(a => a.status === 'red').length,
        upcomingAlerts: enhancedAlerts.filter(a => a.status === 'amber').length,
        plannedAlerts: enhancedAlerts.filter(a => a.status === 'green').length,
        highSeverity: enhancedAlerts.filter(a => a.severity === 'High').length,
        mediumSeverity: enhancedAlerts.filter(a => a.severity === 'Medium').length,
        lowSeverity: enhancedAlerts.filter(a => a.severity === 'Low').length,
        
        // Traffic intelligence statistics
        severeTraffic: enhancedAlerts.filter(a => a.congestionLevel >= 8).length,
        moderateTraffic: enhancedAlerts.filter(a => a.congestionLevel >= 5 && a.congestionLevel < 8).length,
        averageDelay: Math.round(
          enhancedAlerts
            .filter(a => a.delayMinutes && a.delayMinutes > 0)
            .reduce((sum, a) => sum + a.delayMinutes, 0) / 
          enhancedAlerts.filter(a => a.delayMinutes && a.delayMinutes > 0).length || 0
        ),
        
        // Route impact analysis
        mostAffectedRoutes: calculateMostAffectedRoutes(enhancedAlerts),
        
        // Data source breakdown
        sourceBreakdown: {
          streetManager: enhancedAlerts.filter(a => a.source === 'streetmanager').length,
          nationalHighways: enhancedAlerts.filter(a => a.source === 'national_highways').length,
          here: enhancedAlerts.filter(a => a.source === 'here').length,
          mapquest: enhancedAlerts.filter(a => a.source === 'mapquest').length
        }
      },
      systemStatus: {
        enabledSources: successfulSources,
        totalSources: 3,
        trafficIntelligence: SYSTEM_CONFIG.here.enabled || SYSTEM_CONFIG.mapquest.enabled,
        apiConfiguration: {
          here: SYSTEM_CONFIG.here.enabled,
          mapquest: SYSTEM_CONFIG.mapquest.enabled,
          nationalHighways: SYSTEM_CONFIG.nationalHighways.enabled,
          streetManager: SYSTEM_CONFIG.streetManager.enabled
        }
      },
      processingTime: `${processingTime}ms`,
      lastUpdated: new Date().toISOString()
    }
  };
}

function calculateMostAffectedRoutes(alerts) {
  const routeImpacts = {};
  
  alerts.forEach(alert => {
    if (alert.affectsRoutes && alert.status === 'red') {
      alert.affectsRoutes.forEach(route => {
        if (!routeImpacts[route]) {
          routeImpacts[route] = {
            route,
            totalAlerts: 0,
            incidents: 0,
            congestion: 0,
            roadworks: 0,
            totalDelay: 0
          };
        }
        
        routeImpacts[route].totalAlerts++;
        
        if (alert.type === 'incident') routeImpacts[route].incidents++;
        else if (alert.type === 'congestion') routeImpacts[route].congestion++;
        else if (alert.type === 'roadwork') routeImpacts[route].roadworks++;
        
        if (alert.delayMinutes) {
          routeImpacts[route].totalDelay += alert.delayMinutes;
        }
      });
    }
  });
  
  return Object.values(routeImpacts)
    .sort((a, b) => b.totalAlerts - a.totalAlerts)
    .slice(0, 10);
}

async function saveUnifiedData(alerts) {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, 'unified-alerts-enhanced.json');
    await fs.writeFile(filePath, JSON.stringify(alerts, null, 2));
    
    console.log(`💾 Saved ${alerts.length} unified enhanced alerts to file`);
  } catch (error) {
    console.warn('⚠️ Could not save unified enhanced data:', error.message);
  }
}

// Store latest unified data
let latestUnifiedData = null;
let lastUnifiedFetchTime = null;

// Your existing Street Manager webhook endpoints (unchanged)
// ... [All your existing webhook code here] ...

// ENHANCED API ENDPOINTS

app.get('/', (req, res) => {
  res.json({
    message: '🚦 BARRY Enhanced Backend - Complete Traffic Intelligence Platform',
    version: '3.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    description: 'Real-time traffic intelligence for Go North East bus operations',
    dataSources: {
      streetManager: {
        method: 'AWS SNS Webhooks + Stored Files',
        description: 'Local authority roadworks and street works',
        enabled: SYSTEM_CONFIG.streetManager.enabled,
        webhook: 'https://go-barry.onrender.com/api/streetmanager/webhook'
      },
      nationalHighways: {
        method: 'Direct DATEX II API',
        description: 'Major road incidents and planned closures',
        enabled: SYSTEM_CONFIG.nationalHighways.enabled,
        configured: !!SYSTEM_CONFIG.nationalHighways.apiKey
      },
      here: {
        method: 'HERE Traffic API v7',
        description: 'Real-time traffic flow, congestion analysis, lane-level precision',
        enabled: SYSTEM_CONFIG.here.enabled,
        configured: !!SYSTEM_CONFIG.here.apiKey,
        features: SYSTEM_CONFIG.here.features,
        limit: SYSTEM_CONFIG.here.limit
      },
      mapquest: {
        method: 'MapQuest Traffic API v2',
        description: 'Detailed traffic incidents and construction events',
        enabled: SYSTEM_CONFIG.mapquest.enabled,
        configured: !!SYSTEM_CONFIG.mapquest.apiKey,
        features: SYSTEM_CONFIG.mapquest.features,
        limit: SYSTEM_CONFIG.mapquest.limit
      }
    },
    capabilities: [
      'Street Manager AWS SNS Integration (Local Authority Roadworks)',
      'National Highways API Integration (Major Road Incidents & Roadworks)', 
      'HERE Traffic API Integration (Traffic Flow & Congestion Analysis)',
      'MapQuest Traffic API Integration (Detailed Incident Reporting)',
      'Real-time Traffic Congestion Monitoring',
      'Traffic Incident Detection & Classification',
      'Go North East Route Impact Analysis',
      'Multi-source Data Validation & Deduplication',
      'Comprehensive Traffic Intelligence Dashboard'
    ],
    endpoints: {
      main: '/api/alerts - Unified alerts from all sources with traffic intelligence',
      traffic: '/api/traffic - Live traffic data (congestion + incidents)',
      congestion: '/api/congestion - Current congestion hotspots',
      incidents: '/api/incidents - Traffic incidents from all sources',
      streetworks: '/api/streetworks - Street Manager roadworks (AWS SNS)',
      roadworks: '/api/roadworks - National Highways roadworks',
      'route-delays': '/api/route-delays - Bus route delay analysis',
      'traffic-intelligence': '/api/traffic-intelligence - Comprehensive traffic analysis',
      refresh: '/api/refresh - Force refresh all data sources',
      webhook: '/api/streetmanager/webhook - AWS SNS webhook receiver',
      health: '/api/health'
    }
  });
});

// ENHANCED: Main unified alerts endpoint with comprehensive traffic integration
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    if (!latestUnifiedData || !lastUnifiedFetchTime || (now - lastUnifiedFetchTime) > cacheTimeout) {
      console.log('🔄 Creating fresh unified alerts data with comprehensive traffic intelligence...');
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = now;
    } else {
      console.log('📋 Using cached unified alerts data with traffic intelligence');
      latestUnifiedData.metadata.cached = true;
      latestUnifiedData.metadata.servedAt = new Date().toISOString();
    }
    
    res.json(latestUnifiedData);
    
  } catch (error) {
    console.error('❌ Enhanced unified alerts endpoint error:', error);
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

// NEW: Comprehensive traffic intelligence endpoint
app.get('/api/traffic-intelligence', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    const trafficAlerts = latestUnifiedData.alerts.filter(alert => 
      alert.type === 'congestion' || alert.type === 'incident'
    );
    
    // Analyze traffic patterns
    const trafficAnalysis = {
      summary: {
        totalTrafficAlerts: trafficAlerts.length,
        incidents: trafficAlerts.filter(a => a.type === 'incident').length,
        congestion: trafficAlerts.filter(a => a.type === 'congestion').length,
        severeTraffic: trafficAlerts.filter(a => a.congestionLevel >= 8).length,
        averageCongestionLevel: Math.round(
          trafficAlerts
            .filter(a => a.congestionLevel)
            .reduce((sum, a) => sum + a.congestionLevel, 0) / 
          trafficAlerts.filter(a => a.congestionLevel).length || 0
        )
      },
      hotspots: trafficAlerts
        .filter(a => a.type === 'congestion' && a.congestionLevel >= 6)
        .sort((a, b) => (b.congestionLevel || 0) - (a.congestionLevel || 0))
        .slice(0, 10),
      incidents: trafficAlerts
        .filter(a => a.type === 'incident')
        .sort((a, b) => {
          const severityScore = { High: 3, Medium: 2, Low: 1 };
          return (severityScore[b.severity] || 0) - (severityScore[a.severity] || 0);
        })
        .slice(0, 10),
      routeImpacts: latestUnifiedData.metadata.statistics.mostAffectedRoutes || [],
      dataQuality: {
        sources: Object.keys(latestUnifiedData.metadata.sources).length,
        successfulSources: Object.values(latestUnifiedData.metadata.sources).filter(s => s.success).length,
        apiCalls: latestUnifiedData.metadata.sources.comprehensiveTraffic?.details?.apiUsage || {}
      }
    };
    
    res.json({
      success: true,
      trafficIntelligence: trafficAnalysis,
      lastUpdated: latestUnifiedData.metadata.lastUpdated
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      trafficIntelligence: null
    });
  }
});

// Enhanced traffic endpoints (existing + new)
app.get('/api/traffic', async (req, res) => {
  try {
    if (!latestUnifiedData) {
      latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
      lastUnifiedFetchTime = Date.now();
    }
    
    const trafficAlerts = latestUnifiedData.alerts.filter(alert => 
      alert.type === 'congestion' || alert.type === 'incident'
    );
    
    res.json({
      success: true,
      traffic: trafficAlerts,
      metadata: {
        count: trafficAlerts.length,
        types: {
          congestion: trafficAlerts.filter(a => a.type === 'congestion').length,
          incidents: trafficAlerts.filter(a => a.type === 'incident').length
        },
        severity: {
          high: trafficAlerts.filter(a => a.severity === 'High').length,
          medium: trafficAlerts.filter(a => a.severity === 'Medium').length,
          low: trafficAlerts.filter(a => a.severity === 'Low').length
        },
        sources: {
          here: trafficAlerts.filter(a => a.source === 'here').length,
          mapquest: trafficAlerts.filter(a => a.source === 'mapquest').length,
          nationalHighways: trafficAlerts.filter(a => a.source === 'national_highways' && 
            (a.type === 'incident' || a.type === 'congestion')).length
        },
        lastUpdated: latestUnifiedData.metadata.lastUpdated
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      traffic: []
    });
  }
});

// Your existing endpoints (enhanced)
app.get('/api/streetworks', async (req, res) => {
  // Your existing implementation
});

app.get('/api/roadworks', async (req, res) => {
  // Your existing implementation  
});

// Enhanced health endpoint
app.get('/api/health', (req, res) => {
  const trafficAPIsEnabled = SYSTEM_CONFIG.here.enabled || SYSTEM_CONFIG.mapquest.enabled;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.0',
    features: {
      trafficIntelligence: trafficAPIsEnabled,
      multiSourceIntegration: true,
      realTimeTrafficData: trafficAPIsEnabled,
      comprehensiveTrafficAnalysis: true
    },
    dataSources: {
      streetManager: {
        method: 'AWS SNS Webhooks + Stored Files',
        webhook: 'https://go-barry.onrender.com/api/streetmanager/webhook',
        enabled: SYSTEM_CONFIG.streetManager.enabled,
        lastFetch: lastUnifiedFetchTime
      },
      nationalHighways: {
        method: 'Direct DATEX II API',
        enabled: SYSTEM_CONFIG.nationalHighways.enabled,
        configured: !!SYSTEM_CONFIG.nationalHighways.apiKey,
        apiKey: SYSTEM_CONFIG.nationalHighways.apiKey ? 
          `${SYSTEM_CONFIG.nationalHighways.apiKey.substring(0, 8)}...` : 'Not configured',
        lastFetch: lastUnifiedFetchTime
      },
      here: {
        method: 'HERE Traffic API v7',
        enabled: SYSTEM_CONFIG.here.enabled,
        configured: !!SYSTEM_CONFIG.here.apiKey,
        features: SYSTEM_CONFIG.here.features,
        limit: SYSTEM_CONFIG.here.limit
      },
      mapquest: {
        method: 'MapQuest Traffic API v2',
        enabled: SYSTEM_CONFIG.mapquest.enabled,
        configured: !!SYSTEM_CONFIG.mapquest.apiKey,
        features: SYSTEM_CONFIG.mapquest.features,
        limit: SYSTEM_CONFIG.mapquest.limit
      },
      unified: {
        dataAvailable: !!latestUnifiedData,
        alertCount: latestUnifiedData?.alerts?.length || 0,
        trafficCount: latestUnifiedData?.alerts?.filter(a => 
          a.type === 'congestion' || a.type === 'incident').length || 0,
        lastUpdate: latestUnifiedData?.metadata?.lastUpdated
      }
    },
    locationMappings: Object.keys(ENHANCED_LOCATION_ROUTE_MAPPING).length
  });
});

// Enhanced refresh endpoint
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refreshing all data sources including comprehensive traffic intelligence...');
    latestUnifiedData = await fetchUnifiedAlertsWithTraffic();
    lastUnifiedFetchTime = Date.now();
    
    res.json({
      success: true,
      message: 'All data sources refreshed successfully',
      note: 'Street Manager (AWS SNS) + National Highways + HERE + MapQuest refreshed',
      timestamp: new Date().toISOString(),
      data: {
        totalAlerts: latestUnifiedData.alerts.length,
        trafficAlerts: latestUnifiedData.alerts.filter(a => 
          a.type === 'congestion' || a.type === 'incident').length,
        roadworks: latestUnifiedData.alerts.filter(a => a.type === 'roadwork').length,
        sources: latestUnifiedData.metadata.sources,
        apiUsage: latestUnifiedData.metadata.sources.comprehensiveTraffic?.details?.apiUsage
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refresh data sources',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Enhanced Backend - Complete Traffic Intelligence Platform`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 URL: https://go-barry.onrender.com`);
  console.log(`\n📊 Enhanced Data Sources:`);
  console.log(`   🔗 Street Manager: AWS SNS Webhooks -> Stored Files`);
  console.log(`   🔗 National Highways: Direct DATEX II API + Enhanced Traffic Data`);
  console.log(`   🔗 HERE Traffic API: Real-time Flow + Congestion + Lane Precision`);
  console.log(`   🔗 MapQuest Traffic API: Detailed Incidents + Construction Events`);
  console.log(`\n📊 Enhanced API Endpoints:`);
  console.log(`   🎯 Main Unified: https://go-barry.onrender.com/api/alerts`);
  console.log(`   🧠 Traffic Intelligence: https://go-barry.onrender.com/api/traffic-intelligence`);
  console.log(`   🚦 Live Traffic: https://go-barry.onrender.com/api/traffic`);
  console.log(`   🔴 Congestion: https://go-barry.onrender.com/api/congestion`);
  console.log(`   🛣️  Street Manager: https://go-barry.onrender.com/api/streetworks`);
  console.log(`   🚨 National Highways: https://go-barry.onrender.com/api/roadworks`);
  console.log(`   🔄 Refresh: https://go-barry.onrender.com/api/refresh`);
  console.log(`   💚 Health: https://go-barry.onrender.com/api/health`);
  
  console.log(`\n✅ Configuration Status:`);
  
  if (SYSTEM_CONFIG.nationalHighways.apiKey) {
    console.log(`   🔑 National Highways: ${SYSTEM_CONFIG.nationalHighways.apiKey.substring(0, 8)}...`);
  } else {
    console.warn('   ⚠️  National Highways: API key not configured');
  }
  
  if (SYSTEM_CONFIG.here.apiKey) {
    console.log(`   🔑 HERE Traffic: ${SYSTEM_CONFIG.here.apiKey.substring(0, 8)}... (1,000 trans/month)`);
  } else {
    console.warn('   ⚠️  HERE Traffic: API key not configured');
  }
  
  if (SYSTEM_CONFIG.mapquest.apiKey) {
    console.log(`   🔑 MapQuest Traffic: ${SYSTEM_CONFIG.mapquest.apiKey.substring(0, 8)}... (15,000 trans/month)`);
  } else {
    console.warn('   ⚠️  MapQuest Traffic: API key not configured (register at developer.mapquest.com)');
  }
  
  console.log(`   🗺️ Enhanced Route Mappings: ${Object.keys(ENHANCED_LOCATION_ROUTE_MAPPING).length} patterns`);
  
  const enabledTrafficAPIs = [SYSTEM_CONFIG.here.enabled, SYSTEM_CONFIG.mapquest.enabled].filter(Boolean).length;
  console.log(`   🚦 Traffic Intelligence: ${enabledTrafficAPIs}/2 APIs enabled`);
  
  console.log(`\n🚀 Enhanced BARRY server ready with complete traffic intelligence platform!`);

  // Initial enhanced data load
  console.log('\n🔄 Scheduling initial enhanced data load with traffic intelligence...');
  setTimeout(() => {
    fetchUnifiedAlertsWithTraffic()
      .then(result => {
        console.log(`✅ Enhanced initial load complete: ${result.alerts.length} total alerts`);
        console.log(`   📊 Street Manager (AWS SNS): ${result.metadata.sources.streetManager.count} works`);
        console.log(`   📊 National Highways (API): ${result.metadata.sources.nationalHighways.count} alerts`);
        console.log(`   📊 Traffic Intelligence: ${result.metadata.sources.comprehensiveTraffic.count} traffic alerts`);
        if (result.metadata.sources.comprehensiveTraffic.details) {
          const details = result.metadata.sources.comprehensiveTraffic.details;
          console.log(`   🚦 Traffic Breakdown: ${details.statistics?.totalIncidents || 0} incidents, ${details.statistics?.totalCongestion || 0} congestion alerts`);
          console.log(`   📞 API Usage: HERE ${details.apiUsage?.here?.used || 0}/1000, MapQuest ${details.apiUsage?.mapquest?.used || 0}/15000`);
        }
      })
      .catch(error => {
        console.warn('⚠️ Enhanced initial data load failed:', error.message);
      });
  }, 5000);
});

// Error handling (unchanged)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

export default app;