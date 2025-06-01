// backend/index.js
// BARRY Go North East Focused Backend - Clean Version
// Version 4.1-focused - No duplicates, enhanced data quality
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

console.log('🚦 BARRY Go North East Focused Backend Starting...');
console.log('🎯 Version 4.1 - Precise GNE Areas with Enhanced Data');

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

// Go North East route mapping
const LOCATION_ROUTE_MAPPING = {
  'a1': ['X9', 'X10', '10', '11', '21', 'X21', '43', '44', '45', '47'],
  'a19': ['X7', 'X8', '19', '35', '36', '1', '2', '308', '309', '310'],
  'a167': ['21', '22', 'X21', '50', '6', '7', '8'],
  'a1058': ['1', '2', '308', '309', '311', '317', '51', '52', '53', '54'],
  'a184': ['25', '28', '29', '93', '94', '95'],
  'a690': ['61', '62', '63', '64', '65', '71', '73'],
  'a69': ['X84', 'X85', '602', '685', '74', '75'],
  'a183': ['16', '18', '20', '61', '62', 'E1', 'E2', 'E6'],
  'a1231': ['4', '61', '62', '63', '64', '65', '99'],
  'newcastle': ['Q1', 'Q2', 'Q3', 'QUAYSIDE', '10', '11', '12', '39', '40', '41', '42'],
  'gateshead': ['21', '25', '28', '29', '53', '54', '56', '57', '58'],
  'sunderland': ['16', '18', '20', '61', '62', '63', '64', '65', 'E1', 'E2', 'E6'],
  'durham': ['21', '22', 'X21', '50', '6', '7', '13', '14', '15'],
  'washington': ['4', '8', '26', '81', '82', '83', '84', '85', '86'],
  'tyne tunnel': ['1', '2', '308', '309', '310', '311'],
  'coast road': ['1', '2', '308', '309', '311', '317', '51', '52', '53', '54'],
  'central motorway': ['Q1', 'Q2', 'Q3', 'QUAYSIDE'],
  'metrocentre': ['21', '25', '28', '29', '53', '54', '56', '57', '58'],
  'team valley': ['25', '28', '29', '93', '94', '95']
};

// Focused Go North East boundaries
const GNE_BOUNDS = {
  north: 55.1,   
  south: 54.6,   
  east: -1.2,    
  west: -2.0     
};

// Go North East keywords
const GNE_KEYWORDS = [
  'A1', 'A19', 'A167', 'A1058', 'A184', 'A690', 'A183', 'A1231',
  'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'WASHINGTON',
  'CHESTER-LE-STREET', 'BIRTLEY', 'BLAYDON', 'CONSETT', 'STANLEY',
  'HOUGHTON', 'HETTON', 'SEAHAM', 'PETERLEE',
  'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY', 'QUAYSIDE',
  'METROCENTRE', 'TEAM VALLEY', 'ELDON SQUARE', 'MONUMENT',
  'HAYMARKET', 'GRAINGER STREET', 'PILGRIM STREET', 'GREY STREET',
  'FAWCETT STREET', 'HIGH STREET', 'MARKET STREET',
  'CENTRAL STATION', 'METRO', 'HAYMARKET BUS STATION',
  'ELDON SQUARE BUS STATION', 'PARK LANE', 'GALLERIES',
  'DURHAM ROAD', 'CHESTER ROAD', 'WASHINGTON HIGHWAY',
  'WREKENTON', 'ANGEL OF THE NORTH', 'SAGE GATESHEAD'
];

function isInGNEArea(location, description = '', coordinates = null) {
  const text = `${location} ${description}`.toUpperCase();
  
  const textMatch = GNE_KEYWORDS.some(keyword => text.includes(keyword));
  const roadMatch = /\b(A1|A19|A167|A1058|A184|A690|A183|A1231|M1)\b/i.test(text);
  
  let coordMatch = false;
  if (coordinates && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    coordMatch = lat >= GNE_BOUNDS.south && lat <= GNE_BOUNDS.north &&
                 lng >= GNE_BOUNDS.west && lng <= GNE_BOUNDS.east;
  }
  
  const isMatch = textMatch || roadMatch || coordMatch;
  
  if (isMatch) {
    console.log(`🎯 GNE match: "${location}" (text:${textMatch}, road:${roadMatch}, coord:${coordMatch})`);
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

function enhanceIncident(incident, source) {
  let type = 'incident';
  let severity = 'Medium';
  let status = 'red';
  
  const description = (incident.description || incident.ic?.d || '').toLowerCase();
  const title = (incident.title || '').toLowerCase();
  const combinedText = `${title} ${description}`.toLowerCase();
  
  if (combinedText.includes('construction') || combinedText.includes('roadwork') || 
      combinedText.includes('maintenance') || combinedText.includes('repair')) {
    type = 'roadwork';
  } else if (combinedText.includes('congestion') || combinedText.includes('slow') || 
             combinedText.includes('heavy traffic') || combinedText.includes('queue')) {
    type = 'congestion';
  }
  
  if (combinedText.includes('closed') || combinedText.includes('blocked') || 
      combinedText.includes('severe') || combinedText.includes('major')) {
    severity = 'High';
  } else if (combinedText.includes('minor') || combinedText.includes('cleared') || 
             combinedText.includes('resolved')) {
    severity = 'Low';
  }
  
  if (combinedText.includes('cleared') || combinedText.includes('resolved') || 
      combinedText.includes('reopened')) {
    status = 'green';
  } else if (combinedText.includes('planned') || combinedText.includes('scheduled') || 
             combinedText.includes('upcoming')) {
    status = 'amber';
  }
  
  return { type, severity, status };
}

function generateAlertId(source, originalId = null, location = '') {
  const ts = Date.now();
  const locationHash = location.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
  const randomSuffix = Math.random().toString(36).substr(2, 4);
  
  if (originalId) {
    return `${source}_${originalId}_${locationHash}`;
  }
  return `${source}_${ts}_${locationHash}_${randomSuffix}`;
}

// HERE OAuth
let hereAccessToken = null;
let hereTokenExpiry = null;

async function getHEREToken() {
  const accessKeyId = process.env.HERE_ACCESS_KEY_ID;
  const accessKeySecret = process.env.HERE_ACCESS_KEY_SECRET;
  
  if (!accessKeyId || !accessKeySecret) {
    throw new Error('HERE OAuth credentials missing');
  }
  
  if (hereAccessToken && hereTokenExpiry && Date.now() < hereTokenExpiry) {
    return hereAccessToken;
  }
  
  console.log('🔑 Generating HERE OAuth token...');
  
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const oauthParams = {
    oauth_consumer_key: accessKeyId,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp.toString(),
    oauth_version: '1.0'
  };
  
  const requestParams = { grant_type: 'client_credentials' };
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
  const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');
  
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
  
  console.log('✅ HERE OAuth token generated');
  
  hereAccessToken = response.data.access_token;
  hereTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
  
  return hereAccessToken;
}

// Enhanced TomTom with better data
async function fetchTomTom() {
  const apiKey = process.env.TOMTOM_API_KEY;
  
  if (!apiKey) {
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🚗 Fetching TomTom for GNE areas...');
    
    const bbox = `${GNE_BOUNDS.south},${GNE_BOUNDS.west},${GNE_BOUNDS.north},${GNE_BOUNDS.east}`;
    
    const response = await axios.get(`https://api.tomtom.com/traffic/services/4/incidentDetails/s3/${bbox}/10/-1/json`, {
      params: {
        key: apiKey,
        language: 'en-GB',
        projection: 'EPSG4326'
      },
      timeout: 10000
    });
    
    console.log(`📡 TomTom response: ${response.status}`);
    
    const alerts = [];
    
    if (response.data.tm && response.data.tm.poi && response.data.tm.poi.length > 0) {
      console.log(`📊 TomTom found ${response.data.tm.poi.length} incidents in GNE area`);
      
      response.data.tm.poi.forEach(incident => {
        const position = incident.p;
        const roadName = position?.r || 'Road';
        const cityName = position?.c || '';
        const incidentDescription = incident.ic?.d || '';
        const incidentType = incident.ic?.ty || 0;
        const incidentLength = incident.ic?.l || 0;
        
        let location = roadName;
        if (cityName && cityName !== 'Traffic point' && cityName !== roadName) {
          location = `${roadName}, ${cityName}`;
        }
        
        let title = 'Traffic Incident';
        let enhancedDescription = '';
        
        if (incidentDescription) {
          const desc = incidentDescription.toLowerCase();
          if (desc.includes('closed') || desc.includes('closure')) {
            title = `Road Closure - ${roadName}`;
            enhancedDescription = `Road closure on ${location}. ${incidentDescription}`;
          } else if (desc.includes('congestion') || desc.includes('slow') || desc.includes('heavy')) {
            title = `Traffic Congestion - ${roadName}`;
            enhancedDescription = `Heavy traffic congestion on ${location}. ${incidentDescription}`;
          } else if (desc.includes('accident') || desc.includes('collision') || desc.includes('incident')) {
            title = `Traffic Accident - ${roadName}`;
            enhancedDescription = `Traffic accident on ${location}. ${incidentDescription}`;
          } else if (desc.includes('roadwork') || desc.includes('construction') || desc.includes('maintenance')) {
            title = `Roadworks - ${roadName}`;
            enhancedDescription = `Road maintenance work on ${location}. ${incidentDescription}`;
          } else {
            title = `Traffic Alert - ${roadName}`;
            enhancedDescription = `Traffic disruption on ${location}. ${incidentDescription}`;
          }
        } else {
          switch (incidentType) {
            case 1:
              title = `Traffic Accident - ${roadName}`;
              enhancedDescription = `Traffic accident reported on ${location}. Emergency services may be present.`;
              break;
            case 2:
              title = `Road Closure - ${roadName}`;
              enhancedDescription = `Road closure in effect on ${location}. Find alternative route.`;
              break;
            case 3:
              title = `Roadworks - ${roadName}`;
              enhancedDescription = `Road maintenance work on ${location}. Expect delays.`;
              break;
            case 4:
              title = `Traffic Congestion - ${roadName}`;
              enhancedDescription = `Heavy traffic congestion on ${location}. Allow extra time.`;
              break;
            default:
              title = `Traffic Alert - ${roadName}`;
              enhancedDescription = `Traffic disruption detected on ${location}.`;
          }
        }
        
        if (incidentLength > 0) {
          enhancedDescription += ` Affected area: ${incidentLength} meters.`;
        }
        
        const coordinates = [position?.x, position?.y];
        
        if (isInGNEArea(location, enhancedDescription, coordinates)) {
          const routes = matchRoutes(location, enhancedDescription);
          const { type, severity, status } = enhanceIncident({
            description: enhancedDescription,
            ic: incident.ic
          }, 'tomtom');
          
          alerts.push({
            id: generateAlertId('tt', incident.id, location),
            type,
            title,
            description: enhancedDescription,
            location,
            authority: 'TomTom Traffic Intelligence',
            source: 'tomtom',
            severity,
            status,
            incidentLength,
            incidentType: incidentType,
            coordinates,
            startDate: new Date().toISOString(),
            affectsRoutes: routes,
            lastUpdated: new Date().toISOString(),
            dataSource: 'TomTom Traffic API v4 (Enhanced)',
            roadName: roadName,
            cityName: cityName,
            impactLevel: incidentLength > 500 ? 'High' : incidentLength > 100 ? 'Medium' : 'Low'
          });
        }
      });
    }
    
    console.log(`✅ TomTom: ${alerts.length} GNE-relevant alerts processed`);
    
    if (alerts.length > 0) {
      console.log('🔍 Sample GNE alerts:');
      alerts.slice(0, 3).forEach((alert, i) => {
        console.log(`   ${i+1}. "${alert.title}" - ${alert.location} (${alert.affectsRoutes.length} routes)`);
      });
    }
    
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchNationalHighways() {
  const apiKey = process.env.NATIONAL_HIGHWAYS_API_KEY;
  
  if (!apiKey) {
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🛣️ Fetching National Highways for GNE areas...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-GNE/4.1'
      },
      timeout: 15000
    });
    
    console.log(`📡 National Highways response: ${response.status}`);
    
    if (!response.data || !response.data.features) {
      return { success: true, data: [], count: 0, note: 'No current closures' };
    }
    
    const alerts = response.data.features
      .filter(feature => {
        const location = feature.properties?.location || '';
        return isInGNEArea(location, feature.properties?.description || '');
      })
      .map(feature => {
        const props = feature.properties;
        const routes = matchRoutes(props.location || '', props.description || '');
        
        return {
          id: generateAlertId('nh', props.id, props.location),
          type: 'roadwork',
          title: props.title || `National Highways Work - ${props.location}`,
          description: props.description || props.comment || 'Planned road maintenance or closure',
          location: props.location || 'Major Road Network',
          authority: 'National Highways',
          source: 'national_highways',
          severity: 'High',
          status: 'amber',
          startDate: props.startDate || null,
          endDate: props.endDate || null,
          affectsRoutes: routes,
          lastUpdated: new Date().toISOString(),
          dataSource: 'National Highways DATEX II API'
        };
      });
    
    console.log(`✅ National Highways: ${alerts.length} GNE-relevant alerts`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchHERE() {
  try {
    console.log('📡 Fetching HERE Traffic for GNE areas...');
    
    const accessToken = await getHEREToken();
    const bbox = `circle:54.97,-1.61;r=25000`;
    
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
      console.log(`📊 HERE found ${response.data.incidents.length} incidents in GNE area`);
      
      response.data.incidents.forEach(incident => {
        const location = incident.title || incident.summary || 'Traffic Incident';
        const description = incident.description || incident.summary || '';
        
        if (isInGNEArea(location, description)) {
          const routes = matchRoutes(location, description);
          const { type, severity, status } = enhanceIncident(incident, 'here_traffic');
          
          alerts.push({
            id: generateAlertId('here', incident.id, location),
            type,
            title: incident.title || 'HERE Traffic Incident',
            description: description || 'Traffic disruption reported by HERE',
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
    }
    
    console.log(`✅ HERE Traffic: ${alerts.length} GNE-relevant alerts`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ HERE Traffic API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

async function fetchMapQuest() {
  const apiKey = process.env.MAPQUEST_API_KEY;
  
  if (!apiKey) {
    return { success: false, data: [], error: 'API key missing' };
  }

  try {
    console.log('🗺️ Fetching MapQuest for GNE areas...');
    
    const boundingBox = `${GNE_BOUNDS.north},${GNE_BOUNDS.west},${GNE_BOUNDS.south},${GNE_BOUNDS.east}`;
    
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
      console.log(`📊 MapQuest found ${response.data.incidents.length} incidents in GNE area`);
      
      response.data.incidents.forEach(incident => {
        const location = incident.fullDesc || incident.shortDesc || 'Traffic Incident';
        const description = incident.fullDesc || incident.shortDesc || '';
        
        if (isInGNEArea(location, description, [incident.lng, incident.lat])) {
          const routes = matchRoutes(location, description);
          const isConstruction = incident.type === 1;
          const { type, severity, status } = enhanceIncident({
            description: description,
            title: incident.shortDesc
          }, 'mapquest');
          
          alerts.push({
            id: generateAlertId('mq', incident.id, location),
            type: isConstruction ? 'roadwork' : type,
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
    }
    
    console.log(`✅ MapQuest: ${alerts.length} GNE-relevant alerts`);
    return { success: true, data: alerts, count: alerts.length };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    return { success: false, data: [], error: error.message };
  }
}

// Cache
let cachedAlerts = null;
let lastFetchTime = null;
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Main endpoint
app.get('/api/alerts', async (req, res) => {
  try {
    const now = Date.now();
    
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
    
    console.log('🔄 Fetching GNE-focused traffic data...');
    const startTime = Date.now();
    
    const [nhResult, hereResult, mqResult, ttResult] = await Promise.allSettled([
      fetchNationalHighways(),
      fetchHERE(),
      fetchMapQuest(),
      fetchTomTom()
    ]);
    
    const allAlerts = [];
    const sources = {};
    
    [
      { result: nhResult, name: 'nationalHighways' },
      { result: hereResult, name: 'hereTraffic' },
      { result: mqResult, name: 'mapQuest' },
      { result: ttResult, name: 'tomTom' }
    ].forEach(({ result, name }) => {
      if (result.status === 'fulfilled' && result.value.success) {
        allAlerts.push(...result.value.data);
        sources[name] = {
          success: true,
          count: result.value.count,
          method: 'Real API (GNE Focused)',
          note: result.value.note
        };
      } else {
        sources[name] = {
          success: false,
          count: 0,
          error: result.status === 'rejected' ? result.reason.message : result.value.error
        };
      }
    });
    
    const stats = {
      totalAlerts: allAlerts.length,
      activeAlerts: allAlerts.filter(a => a.status === 'red').length,
      upcomingAlerts: allAlerts.filter(a => a.status === 'amber').length,
      resolvedAlerts: allAlerts.filter(a => a.status === 'green').length,
      highSeverity: allAlerts.filter(a => a.severity === 'High').length,
      mediumSeverity: allAlerts.filter(a => a.severity === 'Medium').length,
      lowSeverity: allAlerts.filter(a => a.severity === 'Low').length,
      totalIncidents: allAlerts.filter(a => a.type === 'incident').length,
      totalCongestion: allAlerts.filter(a => a.type === 'congestion').length,
      totalRoadworks: allAlerts.filter(a => a.type === 'roadwork').length,
      routesCovered: [...new Set(allAlerts.flatMap(a => a.affectsRoutes))].length
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
        gneFocused: true,
        operationalArea: 'Go North East Service Areas',
        version: '4.1-focused',
        bounds: GNE_BOUNDS
      }
    };
    lastFetchTime = now;
    
    console.log(`✅ GNE-FOCUSED: ${allAlerts.length} relevant alerts (${stats.activeAlerts} active) covering ${stats.routesCovered} routes`);
    
    res.json({
      success: true,
      alerts: allAlerts,
      metadata: cachedAlerts.metadata
    });
    
  } catch (error) {
    console.error('❌ GNE-focused endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      alerts: [],
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
        gneFocused: true
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
    focus: 'Go North East Operational Areas Only',
    configuration: {
      nationalHighways: !!process.env.NATIONAL_HIGHWAYS_API_KEY,
      hereOAuth: !!(process.env.HERE_ACCESS_KEY_ID && process.env.HERE_ACCESS_KEY_SECRET),
      mapQuest: !!process.env.MAPQUEST_API_KEY,
      tomTom: !!process.env.TOMTOM_API_KEY
    },
    operationalArea: GNE_BOUNDS,
    routesMonitored: Object.keys(LOCATION_ROUTE_MAPPING).length,
    keywordsTracked: GNE_KEYWORDS.length,
    lastFetch: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    cachedAlerts: cachedAlerts?.alerts?.length || 0
  });
});

app.get('/api/refresh', async (req, res) => {
  console.log('🔄 Clearing GNE-focused cache...');
  cachedAlerts = null;
  lastFetchTime = null;
  hereAccessToken = null;
  
  res.json({
    success: true,
    message: 'Cache cleared - next request will fetch fresh GNE-focused data',
    timestamp: new Date().toISOString(),
    focus: 'Go North East operational areas only'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚦 BARRY Go North East Focused Backend',
    version: '4.1-focused',
    focus: 'Precise GNE operational areas with enhanced traffic data',
    features: [
      '✅ Focused on Go North East service areas',
      '✅ Enhanced incident descriptions and titles',
      '✅ Better road name extraction',
      '✅ Accurate route impact mapping',
      '✅ Reduced noise - only relevant alerts',
      '✅ Real-time traffic intelligence'
    ],
    coverage: {
      primaryAreas: ['Newcastle', 'Gateshead', 'Sunderland', 'Durham', 'Washington'],
      majorRoutes: ['A1', 'A19', 'A167', 'A1058', 'A184', 'A690', 'A183'],
      busRoutes: Object.values(LOCATION_ROUTE_MAPPING).flat().length + ' services'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚦 BARRY Go North East Focused Backend Started!`);
  console.log(`🎯 Focus: GNE Operational Areas with Enhanced Data`);
  console.log(`📡 Server: https://go-barry.onrender.com`);
  console.log(`\n🏢 Go North East Coverage:`);
  console.log(`   📍 Primary Areas: Newcastle, Gateshead, Sunderland, Durham, Washington`);
  console.log(`   🛣️ Key Routes: A1, A19, A167, A1058, A184, A690, A183`);
  console.log(`   🚌 Bus Services: ${Object.values(LOCATION_ROUTE_MAPPING).flat().length} routes monitored`);
  console.log(`   🔍 Keywords: ${GNE_KEYWORDS.length} location terms`);
  
  setTimeout(async () => {
    console.log('\n🧪 Testing GNE-focused APIs...');
    const results = await Promise.allSettled([
      fetchNationalHighways(),
      fetchHERE(),
      fetchMapQuest(),
      fetchTomTom()
    ]);
    
    const sources = ['National Highways', 'HERE Traffic', 'MapQuest', 'TomTom'];
    let totalGNEAlerts = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`   ✅ ${sources[index]}: ${result.value.count} GNE-relevant alerts`);
        totalGNEAlerts += result.value.count;
      } else {
        const error = result.status === 'rejected' ? result.reason.message : result.value.error;
        console.log(`   ❌ ${sources[index]}: ${error}`);
      }
    });
    
    console.log(`\n📊 Total GNE-relevant alerts: ${totalGNEAlerts}`);
    console.log(`🎉 Enhanced data quality with better incident details!`);
  }, 3000);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

export default app;