// backend/index.js
// BARRY Comprehensive Backend with ALL Data Sources Integrated
// Version 3.0-comprehensive - Full Traffic Intelligence Platform
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

console.log('🚦 BARRY Comprehensive Backend Starting...');
console.log('🎯 Version 3.0 - Full Traffic Intelligence with ALL Data Sources');

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

// North East bounding box for geographic filtering
const NORTH_EAST_BOUNDS = {
  north: 55.2,   // Northumberland border
  south: 54.4,   // Durham border  
  east: -1.0,    // North Sea coast
  west: -2.5     // Cumbria border
};

// Helper functions
function isInNorthEast(location, description = '', coordinates = null) {
  // Text-based filtering
  const text = `${location} ${description}`.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'HEXHAM', 'CRAMLINGTON',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY', 'BLAYDON',
    'CONSETT', 'STANLEY', 'HOUGHTON', 'HETTON', 'PETERLEE'
  ];
  
  const textMatch = keywords.some(keyword => text.includes(keyword));
  
  // Coordinate-based filtering (if available)
  if (coordinates && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    const coordMatch = lat >= NORTH_EAST_BOUNDS.south && 
                      lat <= NORTH_EAST_BOUNDS.north &&
                      lng >= NORTH_EAST_BOUNDS.west && 
                      lng <= NORTH_EAST_BOUNDS.east;
    return textMatch || coordMatch;
  }
  
  return textMatch;
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

function classifyAlert(alert, source = 'unknown') {
  const now = new Date();
  let status = 'green';
  let severity = 'Medium';
  
  try {
    const startDate = alert.startDate ? new Date(alert.startDate) : null;
    const endDate = alert.endDate ? new Date(alert.endDate) : null;
    
    // Status classification
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
               source === 'here_traffic') {
      status = 'red'; // Assume active if it's an incident or closure
    }
    
    // Severity classification
    if (alert.category?.toLowerCase().includes('closure') || 
        alert.type === 'incident' ||
        (alert.severity && alert.severity >= 8)) {
      severity = 'High';
    } else if (alert.severity && alert.severity >= 5) {
      severity = 'Medium';
    } else {
      severity = 'Low';
    }
    
  } catch (error) {
    console.warn('⚠️ Alert classification error:', error.message);
  }
  
  return { status, severity };
}

function generateAlertId(source, originalId = null, location = '', timestamp = null) {
  const ts = timestamp || Date.now();
  const locationHash = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
  const randomSuffix = Math.random().toString(36).substr(2, 4);
  
  if (originalId) {
    return `${source}_${originalId}_${locationHash}`;
  }
  return `${source}_${ts}_${locationHash}_${randomSuffix}`;
}

// Data fetching functions
async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🛣️ Fetching National Highways data...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 15000
    });
    
    console.log(`📡 National Highways response status: ${response.status}`);
    
    if (!response.data || !response.data.features) {
      console.warn('⚠️ No features in National Highways response');
      return { success: false, data: [], error: 'No features in response' };
    }
    
    const allFeatures = response.data.features;
    console.log(`📊 Total features from National Highways: ${allFeatures.length}`);
    
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
        const { status, severity } = classifyAlert(props, 'national_highways');
        
        return {
          id: generateAlertId('nh', props.id, props.location),
          type: 'roadwork',
          title: props.title || props.description || 'National Highways Closure',
          description: props.description || props.comment || 'Planned closure or roadworks',
          location: props.location || 'Major Road Network',
          authority: 'National Highways',
          source: 'national_highways',
          severity,
          status,
          startDate: props.startDate || null,
          endDate: props.endDate || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'National Highways DATEX II API'
        };
      });
    
    console.log(`✅ National Highways: ${northEastAlerts.length} North East alerts`);
    return { success: true, data: northEastAlerts, count: northEastAlerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// HERE Traffic fetch v7: improved parsing, criticality, and robust error handling
async function fetchHERETraffic() {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ HERE API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('📡 Fetching HERE Traffic data (v7)...');
    // North East bounding box for HERE API: "topLeft;bottomRight" (lat,lon)
    const bbox = `${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.west};${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.east}`;
    const response = await axios.get('https://traffic.ls.hereapi.com/traffic/6.3/incidents.json', {
      params: {
        apikey: apiKey,
        bbox: bbox,
        criticality: '0,1,2,3'
      },
      timeout: 12000
    });
    console.log(`📡 HERE Traffic response status: ${response.status}`);
    const alerts = [];
    // Defensive: check structure
    const items = response.data?.TRAFFIC_ITEMS?.TRAFFIC_ITEM;
    if (!items) {
      console.warn('⚠️ No HERE traffic items in response');
      return { success: true, data: [], count: 0 };
    }
    const incidents = Array.isArray(items) ? items : [items];
    console.log(`📊 HERE Traffic found ${incidents.length} incidents`);
    for (const incident of incidents) {
      // Defensive: try to extract fields
      const location =
        incident.LOCATION?.DESCRIPTION?.[0]?.content ||
        incident.LOCATION?.GEOLOC?.ORIGIN?.DESCRIPTION?.[0]?.content ||
        'Unknown location';
      const description =
        incident.TRAFFIC_ITEM_DESCRIPTION?.[0]?.content ||
        incident.TRAFFIC_ITEM_DETAIL?.[0]?.content ||
        '';
      const type =
        (incident.TRAFFIC_ITEM_TYPE?.[0]?.content || '').toLowerCase();
      // HERE criticality: 0=critical, 1=major, 2=minor, 3=low-impact
      const criticality = (typeof incident.CRITICALITY?.ID !== 'undefined')
        ? Number(incident.CRITICALITY.ID)
        : 5;
      const startDate = incident.START_TIME || new Date().toISOString();
      const endDate = incident.END_TIME || null;
      // Attempt to extract geo coordinates for extra NE filtering
      let coordinates = null;
      const geo = incident.LOCATION?.GEOLOC;
      if (geo && geo.ORIGIN && geo.ORIGIN.LATITUDE && geo.ORIGIN.LONGITUDE) {
        coordinates = [parseFloat(geo.ORIGIN.LONGITUDE), parseFloat(geo.ORIGIN.LATITUDE)];
      }
      // Only keep if NE
      if (!isInNorthEast(location, description, coordinates)) continue;
      // Route match
      const routes = matchRoutes(location, description);
      // Classify: map HERE criticality to severity
      let severity = 'Medium';
      if (criticality === 0 || criticality === 1) severity = 'High';
      else if (criticality === 2) severity = 'Medium';
      else severity = 'Low';
      // Status: active if now within start/end
      let status = 'red';
      try {
        const now = new Date();
        const s = new Date(startDate);
        const e = endDate ? new Date(endDate) : null;
        if (s && now < s) status = 'amber';
        else if (e && now > e) status = 'green';
      } catch {
        status = 'red';
      }
      // Compose alert
      const alertObj = {
        id: generateAlertId('here', incident.TRAFFIC_ITEM_ID, location),
        type: type.includes('congestion') ? 'congestion' : 'incident',
        title: incident.TRAFFIC_ITEM_TYPE?.[0]?.content || 'Traffic Incident',
        description: description || 'Traffic disruption reported',
        location: location,
        authority: 'HERE Traffic Intelligence',
        source: 'here_traffic',
        severity,
        status,
        criticality: criticality,
        startDate,
        endDate,
        affectsRoutes: routes,
        lastUpdated: new Date().toISOString(),
        dataSource: 'HERE Traffic API v6.3'
      };
      if (coordinates) alertObj.coordinates = coordinates;
      alerts.push(alertObj);
    }
    console.log(`✅ HERE Traffic: ${alerts.length} North East alerts`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ HERE Traffic API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchMapQuestTraffic() {
  const apiKey = process.env.MAPQUEST_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🗺️ Fetching MapQuest Traffic data...');
    
    const boundingBox = `${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.east}`;
    
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: apiKey,
        boundingBox: boundingBox,
        filters: 'construction,incidents',
        inFormat: 'json',
        outFormat: 'json'
      },
      timeout: 10000
    });
    
    console.log(`📡 MapQuest response status: ${response.status}`);
    
    const alerts = [];
    
    if (response.data.incidents && response.data.incidents.length > 0) {
      console.log(`📊 MapQuest found ${response.data.incidents.length} incidents`);
      
      response.data.incidents
        .filter(incident => {
          const location = incident.fullDesc || incident.shortDesc || '';
          return isInNorthEast(location, incident.eventDescription || '');
        })
        .forEach(incident => {
          const location = incident.fullDesc || incident.shortDesc || 'Unknown location';
          const routes = matchRoutes(location, incident.eventDescription || '');
          const isConstruction = incident.type === 'construction';
          const { status, severity } = classifyAlert({
            type: isConstruction ? 'roadwork' : 'incident',
            severity: incident.severity || 5,
            category: incident.eventDescription
          }, 'mapquest');
          
          alerts.push({
            id: generateAlertId('mq', incident.id, location),
            type: isConstruction ? 'roadwork' : 'incident',
            title: incident.eventDescription || (isConstruction ? 'Construction Activity' : 'Traffic Incident'),
            description: incident.fullDesc || incident.shortDesc || 'Traffic disruption reported via MapQuest',
            location: location,
            authority: 'MapQuest Traffic Intelligence',
            source: 'mapquest',
            severity,
            status,
            impactScore: incident.severity,
            startDate: incident.startTime || new Date().toISOString(),
            endDate: incident.endTime || null,
            coordinates: incident.lng && incident.lat ? [incident.lng, incident.lat] : null,
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'MapQuest Traffic API v2'
          });
        });
    } else {
      console.log('📍 No MapQuest incidents found for North East');
    }
    
    console.log(`✅ MapQuest: ${alerts.length} North East alerts`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchTomTomTraffic() {
  const apiKey = process.env.TOMTOM_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🚗 Fetching TomTom Traffic data...');
    
    const bbox = `${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.east}`;
    
    const response = await axios.get(`https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json`, {
      params: {
        key: apiKey,
        language: 'en-GB',
        projection: 'EPSG4326'
      },
      timeout: 10000
    });
    
    console.log(`📡 TomTom response status: ${response.status}`);
    
    const alerts = [];
    
    if (response.data.tm && response.data.tm.poi && response.data.tm.poi.length > 0) {
      console.log(`📊 TomTom found ${response.data.tm.poi.length} incidents`);
      
      response.data.tm.poi.forEach(incident => {
        const position = incident.p;
        const location = `${position?.r || 'Unknown Road'} - ${position?.c || 'Traffic point'}`;
        
        if (isInNorthEast(location, incident.ic?.d || '')) {
          const routes = matchRoutes(location, incident.ic?.d || '');
          const { status, severity } = classifyAlert({
            type: 'incident',
            severity: incident.ic?.ty || 5,
            category: incident.ic?.d
          }, 'tomtom');
          
          alerts.push({
            id: generateAlertId('tt', incident.id, location),
            type: 'incident',
            title: incident.ic?.d || 'TomTom Traffic Incident',
            description: `${incident.ic?.d || 'Traffic disruption detected'}. Length: ${incident.ic?.l || 'Unknown'} meters.`,
            location: location,
            authority: 'TomTom Traffic',
            source: 'tomtom',
            severity,
            status,
            incidentLength: incident.ic?.l,
            coordinates: [position?.x, position?.y],
            startDate: new Date().toISOString(),
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'TomTom Traffic API v4'
          });
        }
      });
    } else {
      console.log('📍 No TomTom incidents found for North East');
    }
    
    console.log(`✅ TomTom: ${alerts.length} alerts processed`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function loadStreetManagerData() {
  try {
    console.log('📁 Loading Street Manager data from files...');
    
    const dataDir = path.join(__dirname, 'data');
    const files = await fs.readdir(dataDir).catch(() => []);
    
    if (files.length === 0) {
      console.log('📁 No data files found');
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
            .filter(work => isInNorthEast(work.location || work.description || ''))
            .map(work => {
              const routes = matchRoutes(work.location || '', work.description || '');
              const { status, severity } = classifyAlert(work, 'streetmanager');
              
              return {
                id: generateAlertId('sm', work.id, work.location),
                type: 'roadwork',
                title: work.title || work.workDescription || 'Street Works',
                description: work.description || work.workDescription || 'Local authority street works',
                location: work.location || work.address || 'Local Streets',
                authority: work.authority || work.promoter || 'Local Authority',
                source: 'streetmanager',
                severity,
                status,
                startDate: work.startDate || work.proposedStartDate || null,
                endDate: work.endDate || work.proposedEndDate || null,
                permit: work.permitNumber || null,
                affectsRoutes: routes,
                lastUpdated: new Date().toISOString(),
                dataSource: 'Street Manager via File Storage'
              };
            });
          
          allWorks.push(...processedWorks);
        }
      } catch (fileError) {
        console.warn(`⚠️ Error reading ${file}:`, fileError.message);
      }
    }
    
    console.log(`✅ Street Manager: ${allWorks.length} works loaded`);
    return { success: true, data: allWorks, count: allWorks.length };
    
  } catch (error) {
    console.warn('⚠️ Street Manager file loading failed:', error.message);
    return { success: true, data: [], count: 0 };
  }
}

// Data deduplication function
function deduplicateAlerts(alerts) {
  const deduplicated = [];
  const seen = new Set();
  
  // Sort by priority (incidents > congestion > roadworks, then by severity)
  const prioritySorted = alerts.sort((a, b) => {
    const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 0;
    const bTypeScore = typePriority[b.type] || 0;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    return bSeverityScore - aSeverityScore;
  });
  
  for (const alert of prioritySorted) {
    const locationKey = alert.location.toLowerCase().replace(/[^a-z0-9]/g, '');
    const typeKey = alert.type;
    const combinedKey = `${locationKey}_${typeKey}`;
    
    if (!seen.has(combinedKey)) {
      seen.add(combinedKey);
      deduplicated.push(alert);
    } else {
      console.log(`🔄 Deduplicated: ${alert.title} at ${alert.location}`);
    }
  }
  
  return deduplicated;
}

// Cache for alerts
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Sample test data for immediate testing
const sampleTestAlerts = [
  {
    id: 'test_001',
    type: 'incident',
    title: 'Vehicle Breakdown - A1 Northbound',
    description: 'Lane 1 blocked due to vehicle breakdown between J65 and J66. Recovery vehicle en route. Expect delays of 10-15 minutes.',
    location: 'A1 Northbound, Junction 65 (Birtley)',
    authority: 'National Highways',
    source: 'national_highways',
    severity: 'High',
    status: 'red',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['21', '22', 'X21', '25', '28'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - National Highways Simulation'
  },
  {
    id: 'test_002', 
    type: 'congestion',
    title: 'Heavy Traffic - Tyne Tunnel Approach',
    description: 'Severe congestion approaching Tyne Tunnel southbound due to high traffic volume. Delays of 15+ minutes expected.',
    location: 'A19 Southbound, Tyne Tunnel Approach',
    authority: 'Highways England',
    source: 'traffic_monitoring',
    severity: 'Medium',
    status: 'red',
    congestionLevel: 9,
    delayMinutes: 18,
    currentSpeed: 15,
    freeFlowSpeed: 70,
    startDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    affectsRoutes: ['1', '2', '308', '309', '311', '317'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Traffic Intelligence'
  },
  {
    id: 'test_003',
    type: 'roadwork', 
    title: 'Street Works - High Street, Newcastle',
    description: 'Gas main replacement works with temporary traffic lights. Lane closures in effect 9am-4pm weekdays only.',
    location: 'High Street, Newcastle City Centre (near Monument)',
    authority: 'Newcastle City Council',
    source: 'streetmanager',
    severity: 'Medium',
    status: 'amber',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    affectsRoutes: ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12'],
    lastUpdated: new Date().toISOString(),
    dataSource: 'Test Data - Street Manager'
  }
];

// Main alerts endpoint with ALL data sources
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached comprehensive alerts');
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
    
    console.log('🔄 Fetching comprehensive alerts from ALL sources...');
    const startTime = Date.now();
    
    // Fetch from ALL sources in parallel
    const [nhResult, smResult, hereResult, mqResult, ttResult] = await Promise.allSettled([
      fetchNationalHighways(),
      loadStreetManagerData(),
      fetchHERETraffic(),
      fetchMapQuestTraffic(),
      fetchTomTomTraffic()
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    // Process National Highways
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
    
    // Process Street Manager
    if (smResult.status === 'fulfilled' && smResult.value.success) {
      allAlerts.push(...smResult.value.data);
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
    
    // Process HERE Traffic
    if (hereResult.status === 'fulfilled' && hereResult.value.success) {
      allAlerts.push(...hereResult.value.data);
      sources.hereTraffic = {
        success: true,
        count: hereResult.value.count,
        method: 'Direct API'
      };
    } else {
      sources.hereTraffic = {
        success: false,
        count: 0,
        error: hereResult.status === 'rejected' ? hereResult.reason.message : hereResult.value.error
      };
    }
    
    // Process MapQuest
    if (mqResult.status === 'fulfilled' && mqResult.value.success) {
      allAlerts.push(...mqResult.value.data);
      sources.mapQuest = {
        success: true,
        count: mqResult.value.count,
        method: 'Direct API'
      };
    } else {
      sources.mapQuest = {
        success: false,
        count: 0,
        error: mqResult.status === 'rejected' ? mqResult.reason.message : mqResult.value.error
      };
    }
    
    // Process TomTom
    if (ttResult.status === 'fulfilled' && ttResult.value.success) {
      allAlerts.push(...ttResult.value.data);
      sources.tomTom = {
        success: true,
        count: ttResult.value.count,
        method: 'Direct API'
      };
    } else {
      sources.tomTom = {
        success: false,
        count: 0,
        error: ttResult.status === 'rejected' ? ttResult.reason.message : ttResult.value.error
      };
    }
    
    // Deduplicate alerts
    const deduplicatedAlerts = deduplicateAlerts(allAlerts);
    
    // Calculate statistics
    const stats = {
      totalAlerts: deduplicatedAlerts.length,
      activeAlerts: deduplicatedAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: deduplicatedAlerts.filter(a => a.status === 'amber').length,
      plannedAlerts: deduplicatedAlerts.filter(a => a.status === 'green').length,
      highSeverity: deduplicatedAlerts.filter(a => a.severity === 'High').length,
      mediumSeverity: deduplicatedAlerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: deduplicatedAlerts.filter(a => a.severity === 'Low').length,
      totalIncidents: deduplicatedAlerts.filter(a => a.type === 'incident').length,
      totalCongestion: deduplicatedAlerts.filter(a => a.type === 'congestion').length,
      totalRoadworks: deduplicatedAlerts.filter(a => a.type === 'roadwork').length
    };
    
    const processingTime = Date.now() - startTime;
    
    // Cache results
    cachedAlerts = {
      alerts: deduplicatedAlerts,
      metadata: {
        totalAlerts: deduplicatedAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        rawDataCount: allAlerts.length,
        deduplicatedCount: deduplicatedAlerts.length
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ Comprehensive fetch complete: ${deduplicatedAlerts.length} alerts (${stats.activeAlerts} active) in ${processingTime}ms`);
    
    res.json({
      success: true,
      alerts: deduplicatedAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ Comprehensive alerts endpoint error:', error);
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

// Individual source endpoints
app.get('/api/traffic', async (req, res) => {
  try {
    console.log('🚗 Fetching traffic-only data...');
    
    const [hereResult, ttResult] = await Promise.allSettled([
      fetchHERETraffic(),
      fetchTomTomTraffic()
    ]);
    
    const trafficAlerts = [];
    
    if (hereResult.status === 'fulfilled') {
      trafficAlerts.push(...hereResult.value.data.filter(a => a.type === 'congestion'));
    }
    
    if (ttResult.status === 'fulfilled') {
      trafficAlerts.push(...ttResult.value.data.filter(a => a.type === 'congestion'));
    }
    
    res.json({
      success: true,
      traffic: trafficAlerts,
      count: trafficAlerts.length,
      sources: {
        here: hereResult.status === 'fulfilled' ? hereResult.value.success : false,
        tomtom: ttResult.status === 'fulfilled' ? ttResult.value.success : false
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/roadworks', async (req, res) => {
  try {
    console.log('🚧 Fetching roadworks-only data...');
    
    const [nhResult, smResult] = await Promise.allSettled([
      fetchNationalHighways(),
      loadStreetManagerData()
    ]);
    
    const roadworks = [];
    
    if (nhResult.status === 'fulfilled') {
      roadworks.push(...nhResult.value.data);
    }
    
    if (smResult.status === 'fulfilled') {
      roadworks.push(...smResult.value.data);
    }
    
    res.json({
      success: true,
      roadworks: roadworks,
      count: roadworks.length,
      sources: {
        nationalHighways: nhResult.status === 'fulfilled' ? nhResult.value.success : false,
        streetManager: smResult.status === 'fulfilled' ? smResult.value.success : false
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint with sample data
app.get('/api/alerts-test', async (req, res) => {
  console.log('🧪 Serving test alerts data for development...');
  
  const testResponse = {
    success: true,
    alerts: sampleTestAlerts,
    metadata: {
      totalAlerts: sampleTestAlerts.length,
      sources: {
        nationalHighways: { 
          success: true, 
          count: sampleTestAlerts.filter(a => a.source === 'national_highways').length,
          method: 'Test Data'
        },
        streetManager: { 
          success: true, 
          count: sampleTestAlerts.filter(a => a.source === 'streetmanager').length,
          method: 'Test Data'
        },
        trafficMonitoring: {
          success: true,
          count: sampleTestAlerts.filter(a => a.source === 'traffic_monitoring').length,
          method: 'Test Data'
        }
      },
      statistics: {
        totalAlerts: sampleTestAlerts.length,
        activeAlerts: sampleTestAlerts.filter(a => a.status === 'red').length,
        upcomingAlerts: sampleTestAlerts.filter(a => a.status === 'amber').length,
        plannedAlerts: sampleTestAlerts.filter(a => a.status === 'green').length,
        highSeverity: sampleTestAlerts.filter(a => a.severity === 'High').length,
        mediumSeverity: sampleTestAlerts.filter(a => a.severity === 'Medium').length,
        lowSeverity: sampleTestAlerts.filter(a => a.severity === 'Low').length,
        totalIncidents: sampleTestAlerts.filter(a => a.type === 'incident').length,
        totalCongestion: sampleTestAlerts.filter(a => a.type === 'congestion').length,
        totalRoadworks: sampleTestAlerts.filter(a => a.type === 'roadwork').length
      },
      lastUpdated: new Date().toISOString(),
      processingTime: '50ms',
      testMode: true,
      note: 'This is test data for development purposes'
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
      hereTraffic: !!process.env.HERE_API_KEY,
      mapQuest: !!process.env.MAPQUEST_API_KEY,
      tomTom: !!process.env.TOMTOM_API_KEY,
      port: PORT
    },
    dataSources: {
      'National Highways': !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      'HERE Traffic': !!process.env.HERE_API_KEY,
      'MapQuest': !!process.env.MAPQUEST_API_KEY,
      'TomTom': !!process.env.TOMTOM_API_KEY,
      'Street Manager': 'File Storage'
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0
  });
});

// Force refresh
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh requested - clearing all caches...');
    cachedAlerts = null;
    lastFetchTime = null;
    
    res.json({
      success: true,
      message: 'All caches cleared - next request will fetch fresh data from ALL sources',
      timestamp: new Date().toISOString(),
      dataSources: ['National Highways', 'Street Manager', 'HERE Traffic', 'MapQuest', 'TomTom']
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
    message: '🚦 BARRY Comprehensive Backend - ALL Data Sources Integrated',
    version: '3.0-comprehensive',
    status: 'healthy',
    endpoints: {
      alerts: '/api/alerts (ALL sources combined)',
      traffic: '/api/traffic (congestion only)',
      roadworks: '/api/roadworks (planned works only)',
      'alerts-test': '/api/alerts-test (sample data)',
      health: '/api/health',
      refresh: '/api/refresh'
    },
    dataSources: {
      'National Highways': !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      'HERE Traffic': !!process.env.HERE_API_KEY,
      'MapQuest': !!process.env.MAPQUEST_API_KEY,
      'TomTom': !!process.env.TOMTOM_API_KEY,
      'Street Manager': 'File Storage'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Comprehensive Backend Started`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n📊 Data Sources Configuration:`);
  console.log(`   🛣️ National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   📡 HERE Traffic: ${process.env.HERE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🗺️ MapQuest: ${process.env.MAPQUEST_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🚗 TomTom: ${process.env.TOMTOM_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🚧 Street Manager: File Storage`);
  console.log(`\n📡 Comprehensive Endpoints:`);
  console.log(`   🎯 Main: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/alerts`);
  console.log(`   🚗 Traffic: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/traffic`);
  console.log(`   🚧 Roadworks: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/roadworks`);
  console.log(`   💚 Health: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/health`);
  console.log(`   🔄 Refresh: ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/refresh`);
  
  // Initial data load
  setTimeout(async () => {
    try {
      console.log('\n🔄 Loading initial comprehensive data...');
      const results = await Promise.allSettled([
        fetchNationalHighways(),
        fetchHERETraffic(),
        fetchMapQuestTraffic(),
        fetchTomTomTraffic()
      ]);
      
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`✅ Initial load: ${successCount}/4 data sources successful`);
      
      results.forEach((result, index) => {
        const sources = ['National Highways', 'HERE Traffic', 'MapQuest', 'TomTom'];
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`   ✅ ${sources[index]}: ${result.value.count} alerts`);
        } else {
          console.log(`   ❌ ${sources[index]}: ${result.status === 'rejected' ? result.reason.message : result.value.error}`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Initial load error: ${error.message}`);
    }
  }, 3000);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

export default app;