// backend/index.js
// BARRY Real API Backend - ONLY uses live data from your subscriptions
// Version 4.0-real - NO mock data, ONLY real traffic intelligence
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 BARRY Real API Backend Starting...');
console.log('🎯 Version 4.0 - ONLY REAL DATA from your API subscriptions');

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

// More generous North East filtering (to catch more real data)
const NORTH_EAST_BOUNDS = {
  north: 55.8,   // Very generous north 
  south: 54.0,   // Very generous south
  east: -0.5,    // Very generous east
  west: -3.0     // Very generous west
};

// Comprehensive North East keywords (more permissive)
const NORTH_EAST_KEYWORDS = [
  // Major roads
  'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058', 'A1231',
  'M1', 'M8', 'A66', 'A696', 'A189', 'A194', 'A195', 'A197',
  
  // Major cities and towns  
  'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'HEXHAM', 'CRAMLINGTON',
  'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY', 'BLAYDON',
  'CONSETT', 'STANLEY', 'HOUGHTON', 'HETTON', 'PETERLEE', 'JARROW',
  'SOUTH SHIELDS', 'NORTH SHIELDS', 'TYNEMOUTH', 'WALLSEND', 'GOSFORTH',
  'BLYTH', 'WHITLEY BAY', 'MORPETH', 'BEDLINGTON', 'ASHINGTON',
  
  // Counties and regions
  'NORTHUMBERLAND', 'TYNE', 'WEAR', 'TEESSIDE', 'WEARSIDE', 'TYNESIDE',
  'NORTH EAST', 'NORTHEAST', 'COUNTY DURHAM',
  
  // Landmarks and areas
  'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY', 'QUAYSIDE',
  'METROCENTRE', 'TEAM VALLEY', 'ANGEL OF THE NORTH', 'SAGE',
  
  // Less specific but relevant
  'NORTH', 'EAST', 'BRIDGE', 'RIVER', 'TUNNEL'
];

// Helper functions
function isInNorthEast(location, description = '', coordinates = null) {
  const text = `${location} ${description}`.toUpperCase();
  
  // Very permissive text matching
  const textMatch = NORTH_EAST_KEYWORDS.some(keyword => text.includes(keyword));
  
  // Road patterns
  const roadPattern = /\b(A1|A19|A69|A167|A183|A184|A690|A1058|M1|M8)\b/i;
  const roadMatch = roadPattern.test(text);
  
  // UK-specific patterns
  const ukPattern = /\b(ENGLAND|UK|UNITED KINGDOM|BRITAIN)\b/i;
  const ukMatch = ukPattern.test(text);
  
  // Coordinate filtering (very generous bounds)
  let coordMatch = false;
  if (coordinates && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    coordMatch = lat >= NORTH_EAST_BOUNDS.south && 
                 lat <= NORTH_EAST_BOUNDS.north &&
                 lng >= NORTH_EAST_BOUNDS.west && 
                 lng <= NORTH_EAST_BOUNDS.east;
  }
  
  // Accept if ANY criteria match (very permissive)
  const isMatch = textMatch || roadMatch || coordMatch || ukMatch;
  
  if (isMatch) {
    console.log(`🎯 North East match: "${location}" (text:${textMatch}, road:${roadMatch}, coord:${coordMatch}, uk:${ukMatch})`);
  }
  
  return isMatch;
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
               source === 'here_traffic' ||
               source === 'tomtom' ||
               source === 'mapquest') {
      status = 'red'; // Assume active for traffic incidents
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

// HERE OAuth 2.0 token management
let hereAccessToken = null;
let hereTokenExpiry = null;

async function getHEREAccessToken() {
  const accessKeyId = process.env.HERE_ACCESS_KEY_ID;
  const accessKeySecret = process.env.HERE_ACCESS_KEY_SECRET;
  
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('HERE OAuth credentials missing');
  }
  
  // Check if current token is still valid
  if (hereAccessToken && hereTokenExpiry && Date.now() < hereTokenExpiry) {
    return hereAccessToken;
  }
  
  console.log('🔑 Generating new HERE OAuth token...');
  
  try {
    // OAuth 1.0a signature generation for HERE
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const oauthParams = {
      oauth_consumer_key: accessKeyId,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp.toString(),
      oauth_version: '1.0'
    };
    
    const requestParams = {
      grant_type: 'client_credentials'
    };
    
    // Combine and sort parameters
    const allParams = { ...oauthParams, ...requestParams };
    const sortedParams = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');
    
    // Create signature base string
    const baseString = [
      'POST',
      encodeURIComponent('https://account.api.here.com/oauth2/token'),
      encodeURIComponent(sortedParams)
    ].join('&');
    
    // Create signature
    const signingKey = `${encodeURIComponent(accessKeySecret)}&`;
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(baseString)
      .digest('base64');
    
    // Add signature to OAuth params
    oauthParams.oauth_signature = signature;
    
    // Create Authorization header
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');
    
    // Make token request
    const response = await axios.post(
      'https://account.api.here.com/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ HERE OAuth token generated successfully');
    
    hereAccessToken = response.data.access_token;
    hereTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer
    
    return hereAccessToken;
    
  } catch (error) {
    console.error('❌ HERE OAuth token generation failed:', error.message);
    if (error.response) {
      console.error('📡 Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

// REAL API fetching functions
async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🛣️ Fetching National Highways REAL data...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-RealAPI/4.0'
      },
      timeout: 15000
    });
    
    console.log(`📡 National Highways response: ${response.status}`);
    
    if (!response.data || !response.data.features) {
      console.log('📊 National Highways: No current closures');
      return { success: true, data: [], count: 0, note: 'No current closures' };
    }
    
    const allFeatures = response.data.features;
    console.log(`📊 Total National Highways features: ${allFeatures.length}`);
    
    // Process with generous filtering
    const alerts = allFeatures
      .filter(feature => {
        const location = feature.properties?.location || feature.properties?.description || '';
        const isNE = isInNorthEast(location, feature.properties?.comment || '');
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
    
    console.log(`✅ National Highways: ${alerts.length} alerts found`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchHERETraffic() {
  try {
    console.log('📡 Fetching HERE Traffic REAL data...');
    
    const accessToken = await getHEREAccessToken();
    
    // Use broader geographic search for incidents
    const bbox = `circle:54.8,-1.8;r=80000`; // 80km radius around Newcastle
    
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        'in': bbox,
        'locationReferencing': 'shape'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    });
    
    console.log(`📡 HERE Traffic response: ${response.status}`);
    console.log(`📊 HERE response structure:`, Object.keys(response.data || {}));
    
    const alerts = [];
    
    if (response.data.incidents && response.data.incidents.length > 0) {
      console.log(`📊 HERE found ${response.data.incidents.length} total incidents`);
      
      response.data.incidents.forEach(incident => {
        const location = incident.title || incident.summary || 'Traffic Incident';
        const description = incident.description || incident.summary || '';
        
        // Apply generous filtering
        if (isInNorthEast(location, description)) {
          const routes = matchRoutes(location, description);
          const { status, severity } = classifyAlert(incident, 'here_traffic');
          
          alerts.push({
            id: generateAlertId('here', incident.id, location),
            type: incident.type?.includes('congestion') ? 'congestion' : 'incident',
            title: incident.title || 'Traffic Incident',
            description: description || 'Traffic disruption reported',
            location: location,
            authority: 'HERE Traffic Intelligence',
            source: 'here_traffic',
            severity: incident.impact === 'critical' ? 'High' : severity,
            status,
            impact: incident.impact,
            startDate: incident.startTime || new Date().toISOString(),
            endDate: incident.endTime || null,
            coordinates: incident.geometry?.coordinates || null,
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'HERE Traffic API v7 (OAuth)'
          });
        }
      });
    } else {
      console.log('📍 HERE Traffic: No incidents found');
    }
    
    console.log(`✅ HERE Traffic: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ HERE Traffic API error:', error.message);
    if (error.response) {
      console.error(`📡 HERE Response: ${error.response.status}`, error.response.data);
    }
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
    console.log('🗺️ Fetching MapQuest Traffic REAL data...');
    
    // Correct MapQuest API v2 format
    const boundingBox = `${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.east}`;
    
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: apiKey,
        boundingBox: boundingBox,
        filters: 'incidents,construction,event,congestion'
      },
      timeout: 10000
    });
    
    console.log(`📡 MapQuest response: ${response.status}`);
    console.log(`📊 MapQuest response structure:`, Object.keys(response.data || {}));
    
    const alerts = [];
    
    if (response.data.incidents && response.data.incidents.length > 0) {
      console.log(`📊 MapQuest found ${response.data.incidents.length} total incidents`);
      
      response.data.incidents.forEach(incident => {
        const location = incident.fullDesc || incident.shortDesc || 'Traffic Incident';
        const description = incident.fullDesc || incident.shortDesc || '';
        
        // Apply generous filtering
        if (isInNorthEast(location, description, [incident.lng, incident.lat])) {
          const routes = matchRoutes(location, description);
          const isConstruction = incident.type === 1; // Construction type
          const { status, severity } = classifyAlert({
            type: isConstruction ? 'roadwork' : 'incident',
            severity: incident.severity || 2
          }, 'mapquest');
          
          alerts.push({
            id: generateAlertId('mq', incident.id, location),
            type: isConstruction ? 'roadwork' : 'incident',
            title: incident.shortDesc || (isConstruction ? 'Construction Activity' : 'Traffic Incident'),
            description: description || 'Traffic disruption reported via MapQuest',
            location: location,
            authority: 'MapQuest Traffic Intelligence',
            source: 'mapquest',
            severity,
            status,
            impactScore: incident.severity,
            startDate: incident.startTime || new Date().toISOString(),
            endDate: incident.endTime || null,
            coordinates: [incident.lng, incident.lat],
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'MapQuest Traffic API v2'
          });
        }
      });
    } else {
      console.log('📍 MapQuest: No incidents found in response');
    }
    
    console.log(`✅ MapQuest: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    if (error.response) {
      console.error(`📡 MapQuest Response: ${error.response.status}`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Enhanced TomTom processing
async function fetchTomTomTraffic() {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('🚗 Fetching TomTom Traffic REAL data...');
    // Use a very generous bounding box for North East
    const bbox = `${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.east}`;
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json`,
      {
        params: {
          key: apiKey,
          language: 'en-GB',
          projection: 'EPSG4326'
        },
        timeout: 12000
      }
    );
    console.log(`📡 TomTom response: ${response.status}`);
    if (!response.data?.tm?.poi?.length) {
      console.log('📍 TomTom: No incidents found in response');
      return { success: true, data: [], count: 0, note: 'No incidents found' };
    }
    const alerts = [];
    for (const incident of response.data.tm.poi) {
      // Defensive checks for structure
      const position = incident.p || {};
      const roadName = position.r || 'Unknown Road';
      const cityOrCrossing = position.c || '';
      const location = `${roadName}${cityOrCrossing ? ' - ' + cityOrCrossing : ''}`;
      const description = incident.ic?.d || '';
      // TomTom gives x (longitude), y (latitude)
      const coordinates = [position.x, position.y];
      // Enhanced: Accept even if coordinates are slightly out, if text matches
      if (isInNorthEast(location, description, coordinates)) {
        const routes = matchRoutes(location, description);
        // TomTom incident categories:
        // ic.ty: type, ic.l: length, ic.d: description, ic.s: severity
        // Use ic.s (severity: 1=minor, 2=major, 3=critical)
        let severityLevel = 'Low';
        if (incident.ic?.s === 3) severityLevel = 'High';
        else if (incident.ic?.s === 2) severityLevel = 'Medium';
        // Use classifyAlert for status
        const { status } = classifyAlert(
          {
            type: 'incident',
            severity: incident.ic?.s || 2,
            category: incident.ic?.d || ''
          },
          'tomtom'
        );
        alerts.push({
          id: generateAlertId('tt', incident.id, location),
          type: 'incident',
          title: incident.ic?.d || 'TomTom Traffic Incident',
          description:
            (description || 'Traffic disruption detected') +
            (incident.ic?.l ? `. Length: ${incident.ic.l} meters.` : ''),
          location: location,
          authority: 'TomTom Traffic',
          source: 'tomtom',
          severity: severityLevel,
          status,
          incidentLength: incident.ic?.l,
          coordinates: coordinates,
          startDate: new Date().toISOString(),
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v4'
        });
      }
    }
    console.log(`✅ TomTom: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    if (error.response) {
      console.error(`📡 TomTom Response: ${error.response.status}`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

// Cache for real data only
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// REAL DATA ONLY alerts endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached REAL alerts');
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
    
    console.log('🔄 Fetching REAL traffic data from ALL APIs...');
    const startTime = Date.now();
    
    // Fetch from ALL real APIs in parallel
    const [nhResult, hereResult, mqResult, ttResult] = await Promise.allSettled([
      fetchNationalHighways(),
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
        method: 'Real API',
        note: nhResult.value.note
      };
    } else {
      sources.nationalHighways = {
        success: false,
        count: 0,
        error: nhResult.status === 'rejected' ? nhResult.reason.message : nhResult.value.error
      };
    }
    
    // Process HERE Traffic
    if (hereResult.status === 'fulfilled' && hereResult.value.success) {
      allAlerts.push(...hereResult.value.data);
      sources.hereTraffic = {
        success: true,
        count: hereResult.value.count,
        method: 'Real API (OAuth)'
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
        method: 'Real API v2'
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
        method: 'Real API v4'
      };
    } else {
      sources.tomTom = {
        success: false,
        count: 0,
        error: ttResult.status === 'rejected' ? ttResult.reason.message : ttResult.value.error
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
      lowSeverity: allAlerts.filter(a => a.severity === 'Low').length,
      totalIncidents: allAlerts.filter(a => a.type === 'incident').length,
      totalCongestion: allAlerts.filter(a => a.type === 'congestion').length,
      totalRoadworks: allAlerts.filter(a => a.type === 'roadwork').length
    };
    
    // Sort by priority
    allAlerts.sort((a, b) => {
      const statusPriority = { red: 3, amber: 2, green: 1 };
      const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
      const severityPriority = { High: 3, Medium: 2, Low: 1 };
      
      const aStatusScore = statusPriority[a.status] || 0;
      const bStatusScore = statusPriority[b.status] || 0;
      if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
      
      const aTypeScore = typePriority[a.type] || 0;
      const bTypeScore = typePriority[b.type] || 0;
      if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
      
      const aSeverityScore = severityPriority[a.severity] || 0;
      const bSeverityScore = severityPriority[b.severity] || 0;
      return bSeverityScore - aSeverityScore;
    });
    
    const processingTime = Date.now() - startTime;
    
    // Cache results
    cachedAlerts = {
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        realDataOnly: true,
        version: '4.0-real',
        coverage: 'North East England',
        authMethods: {
          here: 'OAuth 2.0',
          nationalHighways: 'API Key',
          mapQuest: 'API Key',
          tomTom: 'API Key'
        }
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ REAL DATA: ${allAlerts.length} alerts from live APIs in ${processingTime}ms`);
    
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ Real API endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
        realDataOnly: true,
        note: 'No fallback data - real APIs only'
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
    version: '4.0-real',
    dataPolicy: 'REAL APIs ONLY - No mock data',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      hereOAuth: !!(process.env.HERE_ACCESS_KEY_ID && process.env.HERE_ACCESS_KEY_SECRET),
      mapQuest: !!process.env.MAPQUEST_API_KEY,
      tomTom: !!process.env.TOMTOM_API_KEY,
      port: PORT
    },
    apiMethods: {
      nationalHighways: 'DATEX II API with subscription key',
      here: 'OAuth 2.0 with access tokens',
      mapQuest: 'Traffic API v2 with API key',
      tomTom: 'Incident Details API v4 with API key'
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0,
    realDataOnly: true
  });
});

// Force refresh
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh - clearing cache and fetching real data...');
    cachedAlerts = null;
    lastFetchTime = null;
    hereAccessToken = null; // Force HERE token refresh
    
    res.json({
      success: true,
      message: 'Cache cleared - next request will fetch fresh REAL data from all APIs',
      timestamp: new Date().toISOString(),
      realDataOnly: true,
      apis: ['National Highways', 'HERE Traffic (OAuth)', 'MapQuest v2', 'TomTom v4']
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
    message: '🚦 BARRY Real API Backend - ONLY Live Traffic Data',
    version: '4.0-real',
    status: 'real-data-only',
    dataPolicy: 'NO MOCK DATA - Only live traffic intelligence from your API subscriptions',
    features: [
      '✅ National Highways DATEX II API',
      '✅ HERE Traffic API v7 (OAuth 2.0)',
      '✅ MapQuest Traffic API v2',
      '✅ TomTom Incident Details API v4',
      '✅ No fallback data - real APIs only',
      '✅ Enhanced North East filtering'
    ],
    endpoints: {
      alerts: '/api/alerts (REAL data only)',
      health: '/api/health (API status)',
      refresh: '/api/refresh (clear cache)'
    },
    authentication: {
      nationalHighways: 'Subscription key',
      here: 'OAuth 2.0 bearer tokens',
      mapQuest: 'API key',
      tomTom: 'API key'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Real API Backend Started - LIVE DATA ONLY!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n🎯 DATA POLICY: NO MOCK DATA - REAL APIs ONLY`);
  console.log(`\n📊 Real API Sources:`);
  console.log(`   🛣️ National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   📡 HERE OAuth: ${(process.env.HERE_ACCESS_KEY_ID && process.env.HERE_ACCESS_KEY_SECRET) ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🗺️ MapQuest: ${process.env.MAPQUEST_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🚗 TomTom: ${process.env.TOMTOM_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`\n🔗 Test immediately:`);
  console.log(`   ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/alerts`);
  
  // Test real APIs on startup
  setTimeout(async () => {
    try {
      console.log('\n🧪 Testing REAL APIs...');
      
      const results = await Promise.allSettled([
        fetchNationalHighways(),
        fetchHERETraffic(),
        fetchMapQuestTraffic(),
        fetchTomTomTraffic()
      ]);
      
      const sources = ['National Highways', 'HERE Traffic', 'MapQuest', 'TomTom'];
      let totalAlerts = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`   ✅ ${sources[index]}: ${result.value.count} real alerts`);
          totalAlerts += result.value.count;
        } else {
          const error = result.status === 'rejected' ? result.reason.message : result.value.error;
          console.log(`   ❌ ${sources[index]}: ${error}`);
        }
      });
      
      console.log(`\n📊 Total REAL alerts: ${totalAlerts}`);
      console.log(`🎉 BARRY Real API Backend is ready!`);
      
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
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
// Go North East Focused Backend v4.1-focused
// Enhanced North East traffic backend with improved filtering and route/area matching
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚦 Go North East Focused Backend Starting...');
console.log('🎯 Version 4.1-focused - Enhanced North East filtering and route/area matching');

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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// North East route mapping (expanded)
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

const NORTH_EAST_BOUNDS = {
  north: 55.8,
  south: 54.0,
  east: -0.5,
  west: -3.0
};

const NORTH_EAST_KEYWORDS = [
  'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058', 'A1231',
  'M1', 'M8', 'A66', 'A696', 'A189', 'A194', 'A195', 'A197',
  'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'HEXHAM', 'CRAMLINGTON',
  'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY', 'BLAYDON',
  'CONSETT', 'STANLEY', 'HOUGHTON', 'HETTON', 'PETERLEE', 'JARROW',
  'SOUTH SHIELDS', 'NORTH SHIELDS', 'TYNEMOUTH', 'WALLSEND', 'GOSFORTH',
  'BLYTH', 'WHITLEY BAY', 'MORPETH', 'BEDLINGTON', 'ASHINGTON',
  'NORTHUMBERLAND', 'TYNE', 'WEAR', 'TEESSIDE', 'WEARSIDE', 'TYNESIDE',
  'NORTH EAST', 'NORTHEAST', 'COUNTY DURHAM',
  'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY', 'QUAYSIDE',
  'METROCENTRE', 'TEAM VALLEY', 'ANGEL OF THE NORTH', 'SAGE',
  'NORTH', 'EAST', 'BRIDGE', 'RIVER', 'TUNNEL'
];

function isInNorthEast(location, description = '', coordinates = null) {
  const text = `${location} ${description}`.toUpperCase();
  const textMatch = NORTH_EAST_KEYWORDS.some(keyword => text.includes(keyword));
  const roadPattern = /\b(A1|A19|A69|A167|A183|A184|A690|A1058|M1|M8)\b/i;
  const roadMatch = roadPattern.test(text);
  const ukPattern = /\b(ENGLAND|UK|UNITED KINGDOM|BRITAIN)\b/i;
  const ukMatch = ukPattern.test(text);
  let coordMatch = false;
  if (coordinates && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    coordMatch = lat >= NORTH_EAST_BOUNDS.south &&
      lat <= NORTH_EAST_BOUNDS.north &&
      lng >= NORTH_EAST_BOUNDS.west &&
      lng <= NORTH_EAST_BOUNDS.east;
  }
  const isMatch = textMatch || roadMatch || coordMatch || ukMatch;
  if (isMatch) {
    console.log(`🎯 North East match: "${location}" (text:${textMatch}, road:${roadMatch}, coord:${coordMatch}, uk:${ukMatch})`);
  }
  return isMatch;
}

function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  for (const [pattern, routeList] of Object.entries(LOCATION_ROUTE_MAPPING)) {
    if (text.includes(pattern.toLowerCase())) {
      routeList.forEach(route => routes.add(route));
    }
  }
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
    if (startDate && endDate) {
      if (startDate <= now && endDate >= now) {
        status = 'red';
      } else if (startDate > now) {
        const daysUntil = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7) {
          status = 'amber';
        }
      }
    } else if (alert.category?.toLowerCase().includes('closure') ||
      alert.type === 'incident' ||
      source === 'here_traffic' ||
      source === 'tomtom' ||
      source === 'mapquest') {
      status = 'red';
    }
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

let hereAccessToken = null;
let hereTokenExpiry = null;

async function getHEREAccessToken() {
  const accessKeyId = process.env.HERE_ACCESS_KEY_ID;
  const accessKeySecret = process.env.HERE_ACCESS_KEY_SECRET;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('HERE OAuth credentials missing');
  }
  if (hereAccessToken && hereTokenExpiry && Date.now() < hereTokenExpiry) {
    return hereAccessToken;
  }
  console.log('🔑 Generating new HERE OAuth token...');
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const oauthParams = {
      oauth_consumer_key: accessKeyId,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA256',
      oauth_timestamp: timestamp.toString(),
      oauth_version: '1.0'
    };
    const requestParams = {
      grant_type: 'client_credentials'
    };
    const allParams = { ...oauthParams, ...requestParams };
    const sortedParams = Object.keys(allParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');
    const baseString = [
      'POST',
      encodeURIComponent('https://account.api.here.com/oauth2/token'),
      encodeURIComponent(sortedParams)
    ].join('&');
    const signingKey = `${encodeURIComponent(accessKeySecret)}&`;
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(baseString)
      .digest('base64');
    oauthParams.oauth_signature = signature;
    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');
    const response = await axios.post(
      'https://account.api.here.com/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );
    console.log('✅ HERE OAuth token generated successfully');
    hereAccessToken = response.data.access_token;
    hereTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
    return hereAccessToken;
  } catch (error) {
    console.error('❌ HERE OAuth token generation failed:', error.message);
    if (error.response) {
      console.error('📡 Response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, data: [], error: 'API key missing' };
  }
  try {
    console.log('🛣️ Fetching National Highways REAL data...');
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'GoNorthEast-Focused/4.1'
      },
      timeout: 15000
    });
    console.log(`📡 National Highways response: ${response.status}`);
    if (!response.data || !response.data.features) {
      console.log('📊 National Highways: No current closures');
      return { success: true, data: [], count: 0, note: 'No current closures' };
    }
    const allFeatures = response.data.features;
    console.log(`📊 Total National Highways features: ${allFeatures.length}`);
    const alerts = allFeatures
      .filter(feature => {
        const location = feature.properties?.location || feature.properties?.description || '';
        const isNE = isInNorthEast(location, feature.properties?.comment || '');
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
    console.log(`✅ National Highways: ${alerts.length} alerts found`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchHERETraffic() {
  try {
    console.log('📡 Fetching HERE Traffic REAL data...');
    const accessToken = await getHEREAccessToken();
    const bbox = `circle:54.8,-1.8;r=80000`;
    const response = await axios.get('https://data.traffic.hereapi.com/v7/incidents', {
      params: {
        'in': bbox,
        'locationReferencing': 'shape'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    });
    console.log(`📡 HERE Traffic response: ${response.status}`);
    const alerts = [];
    if (response.data.incidents && response.data.incidents.length > 0) {
      console.log(`📊 HERE found ${response.data.incidents.length} total incidents`);
      response.data.incidents.forEach(incident => {
        const location = incident.title || incident.summary || 'Traffic Incident';
        const description = incident.description || incident.summary || '';
        if (isInNorthEast(location, description)) {
          const routes = matchRoutes(location, description);
          const { status, severity } = classifyAlert(incident, 'here_traffic');
          alerts.push({
            id: generateAlertId('here', incident.id, location),
            type: incident.type?.includes('congestion') ? 'congestion' : 'incident',
            title: incident.title || 'Traffic Incident',
            description: description || 'Traffic disruption reported',
            location: location,
            authority: 'HERE Traffic Intelligence',
            source: 'here_traffic',
            severity: incident.impact === 'critical' ? 'High' : severity,
            status,
            impact: incident.impact,
            startDate: incident.startTime || new Date().toISOString(),
            endDate: incident.endTime || null,
            coordinates: incident.geometry?.coordinates || null,
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'HERE Traffic API v7 (OAuth)'
          });
        }
      });
    } else {
      console.log('📍 HERE Traffic: No incidents found');
    }
    console.log(`✅ HERE Traffic: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ HERE Traffic API error:', error.message);
    if (error.response) {
      console.error(`📡 HERE Response: ${error.response.status}`, error.response.data);
    }
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
    console.log('🗺️ Fetching MapQuest Traffic REAL data...');
    const boundingBox = `${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.east}`;
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: apiKey,
        boundingBox: boundingBox,
        filters: 'incidents,construction,event,congestion'
      },
      timeout: 10000
    });
    console.log(`📡 MapQuest response: ${response.status}`);
    const alerts = [];
    if (response.data.incidents && response.data.incidents.length > 0) {
      console.log(`📊 MapQuest found ${response.data.incidents.length} total incidents`);
      response.data.incidents.forEach(incident => {
        const location = incident.fullDesc || incident.shortDesc || 'Traffic Incident';
        const description = incident.fullDesc || incident.shortDesc || '';
        if (isInNorthEast(location, description, [incident.lng, incident.lat])) {
          const routes = matchRoutes(location, description);
          const isConstruction = incident.type === 1;
          const { status, severity } = classifyAlert({
            type: isConstruction ? 'roadwork' : 'incident',
            severity: incident.severity || 2
          }, 'mapquest');
          alerts.push({
            id: generateAlertId('mq', incident.id, location),
            type: isConstruction ? 'roadwork' : 'incident',
            title: incident.shortDesc || (isConstruction ? 'Construction Activity' : 'Traffic Incident'),
            description: description || 'Traffic disruption reported via MapQuest',
            location: location,
            authority: 'MapQuest Traffic Intelligence',
            source: 'mapquest',
            severity,
            status,
            impactScore: incident.severity,
            startDate: incident.startTime || new Date().toISOString(),
            endDate: incident.endTime || null,
            coordinates: [incident.lng, incident.lat],
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'MapQuest Traffic API v2'
          });
        }
      });
    } else {
      console.log('📍 MapQuest: No incidents found in response');
    }
    console.log(`✅ MapQuest: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    if (error.response) {
      console.error(`📡 MapQuest Response: ${error.response.status}`, error.response.data);
    }
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
    console.log('🚗 Fetching TomTom Traffic REAL data...');
    const bbox = `${NORTH_EAST_BOUNDS.south},${NORTH_EAST_BOUNDS.west},${NORTH_EAST_BOUNDS.north},${NORTH_EAST_BOUNDS.east}`;
    const response = await axios.get(
      `https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json`,
      {
        params: {
          key: apiKey,
          language: 'en-GB',
          projection: 'EPSG4326'
        },
        timeout: 12000
      }
    );
    console.log(`📡 TomTom response: ${response.status}`);
    if (!response.data?.tm?.poi?.length) {
      console.log('📍 TomTom: No incidents found in response');
      return { success: true, data: [], count: 0, note: 'No incidents found' };
    }
    const alerts = [];
    for (const incident of response.data.tm.poi) {
      const position = incident.p || {};
      const roadName = position.r || 'Unknown Road';
      const cityOrCrossing = position.c || '';
      const location = `${roadName}${cityOrCrossing ? ' - ' + cityOrCrossing : ''}`;
      const description = incident.ic?.d || '';
      const coordinates = [position.x, position.y];
      if (isInNorthEast(location, description, coordinates)) {
        const routes = matchRoutes(location, description);
        let severityLevel = 'Low';
        if (incident.ic?.s === 3) severityLevel = 'High';
        else if (incident.ic?.s === 2) severityLevel = 'Medium';
        const { status } = classifyAlert(
          {
            type: 'incident',
            severity: incident.ic?.s || 2,
            category: incident.ic?.d || ''
          },
          'tomtom'
        );
        alerts.push({
          id: generateAlertId('tt', incident.id, location),
          type: 'incident',
          title: incident.ic?.d || 'TomTom Traffic Incident',
          description:
            (description || 'Traffic disruption detected') +
            (incident.ic?.l ? `. Length: ${incident.ic.l} meters.` : ''),
          location: location,
          authority: 'TomTom Traffic',
          source: 'tomtom',
          severity: severityLevel,
          status,
          incidentLength: incident.ic?.l,
          coordinates: coordinates,
          startDate: new Date().toISOString(),
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'TomTom Traffic API v4'
        });
      }
    }
    console.log(`✅ TomTom: ${alerts.length} North East alerts found`);
    return { success: true, data: alerts, count: alerts.length };
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    if (error.response) {
      console.error(`📡 TomTom Response: ${error.response.status}`, error.response.data);
    }
    return { success: false, data: [], error: error.message };
  }
}

let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000;

app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedAlerts && lastFetchTime && (now - lastFetchTime) < CACHE_TIMEOUT) {
      console.log('📋 Serving cached REAL alerts');
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
    console.log('🔄 Fetching REAL traffic data from ALL APIs...');
    const startTime = Date.now();
    const [nhResult, hereResult, mqResult, ttResult] = await Promise.allSettled([
      fetchNationalHighways(),
      fetchHERETraffic(),
      fetchMapQuestTraffic(),
      fetchTomTomTraffic()
    ]);
    const allAlerts = [];
    const sources = {};
    if (nhResult.status === 'fulfilled' && nhResult.value.success) {
      allAlerts.push(...nhResult.value.data);
      sources.nationalHighways = {
        success: true,
        count: nhResult.value.count,
        method: 'Real API',
        note: nhResult.value.note
      };
    } else {
      sources.nationalHighways = {
        success: false,
        count: 0,
        error: nhResult.status === 'rejected' ? nhResult.reason.message : nhResult.value.error
      };
    }
    if (hereResult.status === 'fulfilled' && hereResult.value.success) {
      allAlerts.push(...hereResult.value.data);
      sources.hereTraffic = {
        success: true,
        count: hereResult.value.count,
        method: 'Real API (OAuth)'
      };
    } else {
      sources.hereTraffic = {
        success: false,
        count: 0,
        error: hereResult.status === 'rejected' ? hereResult.reason.message : hereResult.value.error
      };
    }
    if (mqResult.status === 'fulfilled' && mqResult.value.success) {
      allAlerts.push(...mqResult.value.data);
      sources.mapQuest = {
        success: true,
        count: mqResult.value.count,
        method: 'Real API v2'
      };
    } else {
      sources.mapQuest = {
        success: false,
        count: 0,
        error: mqResult.status === 'rejected' ? mqResult.reason.message : mqResult.value.error
      };
    }
    if (ttResult.status === 'fulfilled' && ttResult.value.success) {
      allAlerts.push(...ttResult.value.data);
      sources.tomTom = {
        success: true,
        count: ttResult.value.count,
        method: 'Real API v4'
      };
    } else {
      sources.tomTom = {
        success: false,
        count: 0,
        error: ttResult.status === 'rejected' ? ttResult.reason.message : ttResult.value.error
      };
    }
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
    allAlerts.sort((a, b) => {
      const statusPriority = { red: 3, amber: 2, green: 1 };
      const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
      const severityPriority = { High: 3, Medium: 2, Low: 1 };
      const aStatusScore = statusPriority[a.status] || 0;
      const bStatusScore = statusPriority[b.status] || 0;
      if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
      const aTypeScore = typePriority[a.type] || 0;
      const bTypeScore = typePriority[b.type] || 0;
      if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
      const aSeverityScore = severityPriority[a.severity] || 0;
      const bSeverityScore = severityPriority[b.severity] || 0;
      return bSeverityScore - aSeverityScore;
    });
    const processingTime = Date.now() - startTime;
    cachedAlerts = {
      alerts: allAlerts,
      metadata: {
        totalAlerts: allAlerts.length,
        sources,
        statistics: stats,
        lastUpdated: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        realDataOnly: true,
        version: '4.1-focused',
        coverage: 'North East England',
        authMethods: {
          here: 'OAuth 2.0',
          nationalHighways: 'API Key',
          mapQuest: 'API Key',
          tomTom: 'API Key'
        }
      }
    };
    lastFetchTime = now;
    console.log(`✅ REAL DATA: ${allAlerts.length} alerts from live APIs in ${processingTime}ms`);
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: cachedAlerts.metadata
    });
  } catch (error) {
    console.error('❌ Real API endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
        realDataOnly: true,
        note: 'No fallback data - real APIs only'
      }
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '4.1-focused',
    dataPolicy: 'REAL APIs ONLY - No mock data',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      hereOAuth: !!(process.env.HERE_ACCESS_KEY_ID && process.env.HERE_ACCESS_KEY_SECRET),
      mapQuest: !!process.env.MAPQUEST_API_KEY,
      tomTom: !!process.env.TOMTOM_API_KEY,
      port: PORT
    },
    apiMethods: {
      nationalHighways: 'DATEX II API with subscription key',
      here: 'OAuth 2.0 with access tokens',
      mapQuest: 'Traffic API v2 with API key',
      tomTom: 'Incident Details API v4 with API key'
    },
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0,
    realDataOnly: true
  });
});

app.get('/api/refresh', async (req, res) => {
  try {
    console.log('🔄 Force refresh - clearing cache and fetching real data...');
    cachedAlerts = null;
    lastFetchTime = null;
    hereAccessToken = null;
    res.json({
      success: true,
      message: 'Cache cleared - next request will fetch fresh REAL data from all APIs',
      timestamp: new Date().toISOString(),
      realDataOnly: true,
      apis: ['National Highways', 'HERE Traffic (OAuth)', 'MapQuest v2', 'TomTom v4']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: '🚦 Go North East Focused Backend - ONLY Live Traffic Data',
    version: '4.1-focused',
    status: 'real-data-only',
    dataPolicy: 'NO MOCK DATA - Only live traffic intelligence from your API subscriptions',
    features: [
      '✅ National Highways DATEX II API',
      '✅ HERE Traffic API v7 (OAuth 2.0)',
      '✅ MapQuest Traffic API v2',
      '✅ TomTom Incident Details API v4',
      '✅ No fallback data - real APIs only',
      '✅ Enhanced North East filtering and route/area matching'
    ],
    endpoints: {
      alerts: '/api/alerts (REAL data only)',
      health: '/api/health (API status)',
      refresh: '/api/refresh (clear cache)'
    },
    authentication: {
      nationalHighways: 'Subscription key',
      here: 'OAuth 2.0 bearer tokens',
      mapQuest: 'API key',
      tomTom: 'API key'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 Go North East Focused Backend Started - LIVE DATA ONLY!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://go-barry.onrender.com`);
  console.log(`\n🎯 DATA POLICY: NO MOCK DATA - REAL APIs ONLY`);
  console.log(`\n📊 Real API Sources:`);
  console.log(`   🛣️ National Highways: ${process.env.NATIONAL_HIGHWAYS_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   📡 HERE OAuth: ${(process.env.HERE_ACCESS_KEY_ID && process.env.HERE_ACCESS_KEY_SECRET) ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🗺️ MapQuest: ${process.env.MAPQUEST_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   🚗 TomTom: ${process.env.TOMTOM_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`\n🔗 Test immediately:`);
  console.log(`   ${PORT === 3001 ? 'http://localhost:3001' : 'https://go-barry.onrender.com'}/api/alerts`);
  setTimeout(async () => {
    try {
      console.log('\n🧪 Testing REAL APIs...');
      const results = await Promise.allSettled([
        fetchNationalHighways(),
        fetchHERETraffic(),
        fetchMapQuestTraffic(),
        fetchTomTomTraffic()
      ]);
      const sources = ['National Highways', 'HERE Traffic', 'MapQuest', 'TomTom'];
      let totalAlerts = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`   ✅ ${sources[index]}: ${result.value.count} real alerts`);
          totalAlerts += result.value.count;
        } else {
          const error = result.status === 'rejected' ? result.reason.message : result.value.error;
          console.log(`   ❌ ${sources[index]}: ${error}`);
        }
      });
      console.log(`\n📊 Total REAL alerts: ${totalAlerts}`);
      console.log(`🎉 Go North East Focused Backend is ready!`);
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
  }, 3000);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

export default app;