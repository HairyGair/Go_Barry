// backend/index.js
// BARRY Backend - Enhanced with Multi-Source Integration and Location Extraction
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

console.log('🚦 BARRY Enhanced Backend Starting...');
console.log('🎯 Focus: Multi-source integration with proper location extraction');

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

// Enhanced location extraction helper
function extractLocation(apiData, source) {
  let location = null;
  
  try {
    switch (source) {
      case 'national_highways':
        location = apiData.properties?.location || 
                  apiData.properties?.description || 
                  apiData.location || 
                  apiData.description;
        break;
        
      case 'tomtom':
        // TomTom traffic incident structure
        location = apiData.address?.freeformAddress ||
                  apiData.from?.address?.freeformAddress ||
                  apiData.to?.address?.freeformAddress ||
                  apiData.poi?.address?.freeformAddress ||
                  apiData.description ||
                  `${apiData.from?.position?.lat || ''}, ${apiData.from?.position?.lon || ''}`.replace(', ', '') ||
                  null;
        break;
        
      case 'mapquest':
        // MapQuest traffic structure
        location = apiData.street ||
                  apiData.address ||
                  apiData.shortDesc ||
                  apiData.fullDesc ||
                  `${apiData.lat || ''}, ${apiData.lng || ''}`.replace(', ', '') ||
                  null;
        break;
        
      case 'here':
        // HERE API structure
        location = apiData.location?.address?.label ||
                  apiData.location?.address?.street ||
                  apiData.location?.description ||
                  apiData.summary ||
                  `${apiData.location?.position?.lat || ''}, ${apiData.location?.position?.lng || ''}`.replace(', ', '') ||
                  null;
        break;
        
      case 'streetmanager':
        location = apiData.location_description ||
                  apiData.street_name ||
                  apiData.area_name ||
                  apiData.works_location_coordinates ||
                  null;
        break;
        
      default:
        // Generic extraction attempt
        location = apiData.location ||
                  apiData.address ||
                  apiData.description ||
                  apiData.street ||
                  apiData.place ||
                  null;
    }
    
    // Clean up the location string
    if (location && typeof location === 'string') {
      location = location.trim();
      // Remove coordinates-only locations that are just "lat, lng"
      if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(location)) {
        location = convertCoordinatesToLocation(location);
      }
    }
    
  } catch (error) {
    console.warn(`⚠️ Location extraction error for ${source}:`, error.message);
  }
  
  return location || 'Location not specified';
}

// Convert coordinates to readable location (basic implementation)
function convertCoordinatesToLocation(coordString) {
  try {
    const [lat, lng] = coordString.split(',').map(c => parseFloat(c.trim()));
    
    // Basic region detection for North East
    if (lat >= 54.5 && lat <= 55.5 && lng >= -2.0 && lng <= -1.0) {
      if (lat >= 54.9 && lat <= 55.2) return 'Newcastle area';
      if (lat >= 54.6 && lat <= 54.9) return 'Sunderland area';
      if (lat >= 54.7 && lat <= 54.8) return 'Durham area';
    }
    
    return `Coordinates: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return 'Unknown location';
  }
}

// Helper functions
function isInNorthEast(location, description = '') {
  const text = `${location} ${description}`.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY',
    'GOSFORTH', 'JESMOND', 'HEATON', 'WALKER', 'BENWELL'
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
    } else if (alert.category?.toLowerCase().includes('closure') || 
               alert.type === 'incident' || 
               alert.severity === 'High') {
      status = 'red'; // Assume active if it's serious
    }
  } catch (error) {
    console.warn('⚠️ Alert classification error:', error.message);
  }
  
  return status;
}

// Enhanced National Highways fetcher
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
    
    if (!response.data || !response.data.features) {
      return { success: false, data: [], error: 'No features in response' };
    }
    
    const allFeatures = response.data.features;
    console.log(`📊 Total features from National Highways: ${allFeatures.length}`);
    
    const northEastAlerts = allFeatures
      .map(feature => {
        const props = feature.properties;
        const location = extractLocation(feature, 'national_highways');
        
        // Only process if it's in North East
        if (!isInNorthEast(location, props.description || '')) {
          return null;
        }
        
        const routes = matchRoutes(location, props.description || '');
        const status = classifyAlert(props);
        
        return {
          id: `nh_${props.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'roadwork',
          title: props.title || props.description || 'National Highways Closure',
          description: props.description || props.comment || 'Planned closure or roadworks',
          location: location,
          authority: 'National Highways',
          source: 'national_highways',
          severity: props.category?.toLowerCase().includes('closure') ? 'High' : 'Medium',
          status: status,
          startDate: props.startDate || null,
          endDate: props.endDate || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'National Highways DATEX II API'
        };
      })
      .filter(alert => alert !== null);
    
    console.log(`✅ Processed ${northEastAlerts.length} North East alerts from National Highways`);
    return { success: true, data: northEastAlerts, count: northEastAlerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// TomTom Traffic fetcher
async function fetchTomTomTraffic() {
  const apiKey = process.env.TOMTOM_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🌐 Fetching TomTom traffic data...');
    
    // TomTom Traffic Incident Details API for North East bounding box
    const bbox = '-2.0,54.5,-1.0,55.5'; // North East England
    const response = await axios.get(`https://api.tomtom.com/traffic/services/5/incidentDetails`, {
      params: {
        key: apiKey,
        bbox: bbox,
        fields: '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity,probabilityOfOccurrence,numberOfReports,lastModificationTime,startPositionParameterType,endPositionParameterType}}}'
      },
      timeout: 15000
    });
    
    if (!response.data?.incidents) {
      return { success: false, data: [], error: 'No incidents in response' };
    }
    
    const incidents = response.data.incidents;
    console.log(`📊 Total TomTom incidents: ${incidents.length}`);
    
    const processedAlerts = incidents
      .map(incident => {
        const props = incident.properties;
        const location = extractLocation({
          from: props.from,
          to: props.to,
          description: props.events?.[0]?.description,
          roadNumbers: props.roadNumbers
        }, 'tomtom');
        
        // Only process if in North East
        if (!isInNorthEast(location)) {
          return null;
        }
        
        const routes = matchRoutes(location, props.events?.[0]?.description || '');
        
        return {
          id: `tt_${props.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: props.iconCategory?.includes('roadwork') ? 'roadwork' : 'incident',
          title: props.events?.[0]?.description || 'Traffic Incident',
          description: `${props.events?.[0]?.description || 'Traffic disruption'} - Delay: ${props.delay || 0} seconds`,
          location: location,
          authority: 'TomTom Traffic',
          source: 'tomtom',
          severity: props.magnitudeOfDelay > 4 ? 'High' : (props.magnitudeOfDelay > 2 ? 'Medium' : 'Low'),
          status: 'red', // TomTom incidents are current
          delayMinutes: Math.round((props.delay || 0) / 60),
          startDate: props.startTime || new Date().toISOString(),
          endDate: props.endTime || null,
          affectsRoutes: routes,
          lastUpdated: props.lastModificationTime || new Date().toISOString(),
          dataSource: 'TomTom Traffic Incident API'
        };
      })
      .filter(alert => alert !== null);
    
    console.log(`✅ Processed ${processedAlerts.length} TomTom alerts`);
    return { success: true, data: processedAlerts, count: processedAlerts.length };
    
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// MapQuest Traffic fetcher  
async function fetchMapQuestTraffic() {
  const apiKey = process.env.MAPQUEST_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🌐 Fetching MapQuest traffic data...');
    
    // MapQuest Traffic API for North East
    const response = await axios.get(`https://www.mapquestapi.com/traffic/v2/incidents`, {
      params: {
        key: apiKey,
        boundingBox: '55.5,-2.0,54.5,-1.0', // North East England
        filters: 'incidents,construction'
      },
      timeout: 15000
    });
    
    if (!response.data?.incidents) {
      return { success: false, data: [], error: 'No incidents in response' };
    }
    
    const incidents = response.data.incidents;
    console.log(`📊 Total MapQuest incidents: ${incidents.length}`);
    
    const processedAlerts = incidents
      .map(incident => {
        const location = extractLocation(incident, 'mapquest');
        
        // Only process if in North East
        if (!isInNorthEast(location, incident.shortDesc || '')) {
          return null;
        }
        
        const routes = matchRoutes(location, incident.fullDesc || '');
        
        return {
          id: `mq_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: incident.type?.toLowerCase().includes('construction') ? 'roadwork' : 'incident',
          title: incident.shortDesc || 'Traffic Incident',
          description: incident.fullDesc || incident.shortDesc || 'Traffic disruption reported',
          location: location,
          authority: 'MapQuest Traffic',
          source: 'mapquest',
          severity: incident.severity || 'Medium',
          status: incident.type?.toLowerCase().includes('planned') ? 'amber' : 'red',
          startDate: incident.startTime || new Date().toISOString(),
          endDate: incident.endTime || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'MapQuest Traffic API'
        };
      })
      .filter(alert => alert !== null);
    
    console.log(`✅ Processed ${processedAlerts.length} MapQuest alerts`);
    return { success: true, data: processedAlerts, count: processedAlerts.length };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// HERE Traffic fetcher
async function fetchHERETraffic() {
  const apiKey = process.env.HERE_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ HERE API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🌐 Fetching HERE traffic data...');
    
    // HERE Traffic API v7 for incidents
    const response = await axios.get(`https://data.traffic.hereapi.com/v7/incidents`, {
      params: {
        apikey: apiKey,
        in: 'bbox:-2.0,54.5,-1.0,55.5', // North East England
        locationReferencing: 'shape'
      },
      timeout: 15000
    });
    
    if (!response.data?.results) {
      return { success: false, data: [], error: 'No results in response' };
    }
    
    const incidents = response.data.results;
    console.log(`📊 Total HERE incidents: ${incidents.length}`);
    
    const processedAlerts = incidents
      .map(incident => {
        const location = extractLocation(incident, 'here');
        
        // Only process if in North East  
        if (!isInNorthEast(location, incident.summary || '')) {
          return null;
        }
        
        const routes = matchRoutes(location, incident.summary || '');
        
        return {
          id: `here_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: incident.type?.toLowerCase().includes('roadwork') ? 'roadwork' : 'incident',
          title: incident.summary || 'Traffic Incident',
          description: incident.description || incident.summary || 'Traffic disruption reported',
          location: location,
          authority: 'HERE Traffic',
          source: 'here',
          severity: incident.criticality || 'Medium',
          status: 'red',
          startDate: incident.startTime || new Date().toISOString(),
          endDate: incident.endTime || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'HERE Traffic API v7'
        };
      })
      .filter(alert => alert !== null);
    
    console.log(`✅ Processed ${processedAlerts.length} HERE alerts`);
    return { success: true, data: processedAlerts, count: processedAlerts.length };
    
  } catch (error) {
    console.error('❌ HERE API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Load Street Manager data from files (enhanced with location extraction)
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
          const processedWorks = works
            .map(work => {
              const location = extractLocation(work, 'streetmanager');
              
              if (!isInNorthEast(location)) return null;
              
              const routes = matchRoutes(location, work.description || '');
              
              return {
                id: `sm_${work.work_reference_number || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                type: 'roadwork',
                title: work.activity_type || 'Street Works',
                description: work.description || 'Local authority roadworks',
                location: location,
                authority: work.promoter_organisation || 'Local Authority',
                source: 'streetmanager',
                severity: work.traffic_management_type?.includes('road_closure') ? 'High' : 'Medium',
                status: classifyAlert(work),
                startDate: work.actual_start_date || work.proposed_start_date || null,
                endDate: work.actual_end_date || work.proposed_end_date || null,
                affectsRoutes: routes,
                lastUpdated: new Date().toISOString(),
                dataSource: 'Street Manager (Local File)'
              };
            })
            .filter(work => work !== null);
            
          allWorks.push(...processedWorks);
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

// Sample test data (enhanced with proper locations)
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

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Enhanced main alerts endpoint with all data sources
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
    
    console.log('🔄 Fetching fresh alerts from all sources...');
    
    // Fetch from all sources in parallel
    const [nhResult, smResult, ttResult, mqResult, hereResult] = await Promise.allSettled([
      fetchNationalHighways(),
      loadStreetManagerData(),
      fetchTomTomTraffic(),
      fetchMapQuestTraffic(),
      fetchHERETraffic()
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    // Process all results
    const processors = [
      { result: nhResult, name: 'nationalHighways', method: 'Direct API' },
      { result: smResult, name: 'streetManager', method: 'File Storage' },
      { result: ttResult, name: 'tomtom', method: 'Direct API' },
      { result: mqResult, name: 'mapquest', method: 'Direct API' },
      { result: hereResult, name: 'here', method: 'Direct API' }
    ];
    
    processors.forEach(({ result, name, method }) => {
      if (result.status === 'fulfilled' && result.value.success) {
        allAlerts.push(...result.value.data);
        sources[name] = {
          success: true,
          count: result.value.count,
          method: method
        };
      } else {
        sources[name] = {
          success: false,
          count: 0,
          error: result.status === 'rejected' ? result.reason.message : result.value.error
        };
      }
    });
    
    // Remove duplicates and sort by priority
    const uniqueAlerts = removeDuplicateAlerts(allAlerts);
    const sortedAlerts = sortAlertsByPriority(uniqueAlerts);
    
    // Calculate statistics
    const stats = {
      totalAlerts: sortedAlerts.length,
      activeAlerts: sortedAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: sortedAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: sortedAlerts.filter(a => a.status === 'green').length,
      highSeverity: sortedAlerts.filter(a => a.severity === 'High').length,
      mediumSeverity: sortedAlerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: sortedAlerts.filter(a => a.severity === 'Low').length,
      totalIncidents: sortedAlerts.filter(a => a.type === 'incident').length,
      totalCongestion: sortedAlerts.filter(a => a.type === 'congestion').length,
      totalRoadworks: sortedAlerts.filter(a => a.type === 'roadwork').length
    };
    
    // Cache results
    cachedAlerts = {
      alerts: sortedAlerts,
      metadata: {
        totalAlerts: sortedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: 'N/A'
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ Serving ${sortedAlerts.length} alerts (${stats.activeAlerts} active) from ${Object.keys(sources).length} sources`);
    
    res.json({
      success: true,
      alerts: sortedAlerts,
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

// Helper function to remove duplicate alerts
function removeDuplicateAlerts(alerts) {
  const seen = new Set();
  return alerts.filter(alert => {
    const key = `${alert.title}-${alert.location}-${alert.type}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Helper function to sort alerts by priority
function sortAlertsByPriority(alerts) {
  return alerts.sort((a, b) => {
    const typePriority = { incident: 5, congestion: 4, roadwork: 3 };
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
    return bSeverityScore - aSeverityScore;
  });
}

// Test endpoint with enhanced sample data
app.get('/api/alerts-test', async (req, res) => {
  console.log('🧪 Serving enhanced test alerts data...');
  
  const testResponse = {
    success: true,
    alerts: sampleTestAlerts,
    metadata: {
      totalAlerts: sampleTestAlerts.length,
      sources: {
        nationalHighways: { success: true, count: 1, method: 'Test Data' },
        tomtom: { success: true, count: 0, method: 'Test Data' },
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
    version: '2.0-enhanced',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY,
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
    
    // Trigger fresh fetch by calling our own endpoint
    const alertsResponse = await fetch(`http://localhost:${PORT}/api/alerts`);
    const data = await alertsResponse.json();
    
    res.json({
      success: true,
      message: 'Cache cleared and data refreshed from all sources',
      timestamp: new Date().toISOString(),
      alerts: data.alerts?.length || 0,
      sources: Object.keys(data.metadata?.sources || {})
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
    message: '🚦 BARRY Enhanced Backend - Multi-Source Traffic Intelligence',
    version: '2.0',
    status: 'healthy',
    endpoints: {
      alerts: '/api/alerts (Multi-source with location extraction)',
      'alerts-test': '/api/alerts-test',
      health: '/api/health',
      refresh: '/api/refresh'
    },
    dataSources: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      tomtom: !!process.env.TOMTOM_API_KEY,
      mapquest: !!process.env.MAPQUEST_API_KEY,
      here: !!process.env.HERE_API_KEY
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Enhanced Backend Started`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📊 Data Sources Configuration:`);
  console.log(`   🛣️  National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   🚗 TomTom Traffic: ${process.env.TOMTOM_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   🗺️  MapQuest Traffic: ${process.env.MAPQUEST_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`   📡 HERE Traffic: ${process.env.HERE_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`\n🎯 Enhanced Features:`);
  console.log(`   📍 Multi-source location extraction`);
  console.log(`   🔄 Duplicate detection and removal`);  
  console.log(`   📊 Priority-based alert sorting`);
  console.log(`   🌍 North East region filtering`);
  
  // Initial data load
  setTimeout(async () => {
    try {
      console.log('\n🔄 Loading initial data from all sources...');
      cachedAlerts = null;
      lastFetchTime = null;
      
      // Trigger initial load
      const response = await axios.get(`http://localhost:${PORT}/api/alerts`);
      const data = response.data;
      
      console.log(`✅ Initial load complete: ${data.alerts?.length || 0} alerts`);
      console.log(`📊 Active sources: ${Object.keys(data.metadata?.sources || {}).join(', ')}`);
    } catch (error) {
      console.log(`❌ Initial load error: ${error.message}`);
    }
  }, 3000);
});

export default app;