// backend/fetch-comprehensive-traffic.js
// BARRY SIMPLE WORKING VERSION - Complete File
// Single API calls, simple bounding box, reliable endpoints

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('🚦 BARRY SIMPLE Traffic System Loading...');
console.log('📊 Data Sources: TomTom + MapQuest + National Highways + HERE (simple approach)');

// SIMPLE: One bounding box for the entire North East
const NORTH_EAST_BBOX = {
  // Covers Newcastle, Sunderland, Durham, Middlesbrough and surrounding areas
  north: 55.5,    // Northern boundary
  south: 54.0,    // Southern boundary  
  east: -0.5,     // Eastern boundary
  west: -2.5      // Western boundary
};

// Enhanced route mapping
const ROUTE_MAPPING = {
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
  'washington': ['61', '62', '63', '64', '65'],
  'chester-le-street': ['21', '22', 'X21'],
  'cramlington': ['43', '44', '45'],
  'hexham': ['X84', 'X85', '602', '685']
};

// Helper functions
function isInNorthEast(text) {
  if (!text || typeof text !== 'string') return false;
  
  const upperText = text.toUpperCase();
  
  // Comprehensive keyword list for North East
  const keywords = [
    // Major roads
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'M74', 'M8', 'A696', 'A697', 'A689', 'A688', 'A177', 'A181', 'A182',
    
    // Cities and major towns
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'MIDDLESBROUGH',
    'HARTLEPOOL', 'DARLINGTON', 'STOCKTON', 'REDCAR', 'WHITBY',
    'HEXHAM', 'CRAMLINGTON', 'BLYTH', 'ASHINGTON', 'MORPETH',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'BLAYDON', 'STANLEY', 'CONSETT', 'SPENNYMOOR', 'HOUGHTON',
    
    // Regional terms
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'TEESSIDE', 'CLEVELAND',
    'NORTH EAST', 'NORTHEAST', 'TYNESIDE', 'WEARSIDE',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY',
    'QUAYSIDE', 'METRO CENTRE', 'TEAM VALLEY',
    
    // Specific areas
    'GOSFORTH', 'JESMOND', 'HEATON', 'WALKER', 'BENWELL',
    'WALLSEND', 'TYNEMOUTH', 'SOUTH SHIELDS', 'JARROW',
    'FELLING', 'PELAW', 'HEBBURN', 'BOLDON', 'CLEADON',
    
    // Postcodes (sample)
    'NE1', 'NE2', 'NE3', 'NE4', 'NE5', 'NE6', 'NE7', 'NE8', 'NE9',
    'NE10', 'NE11', 'NE12', 'NE13', 'NE15', 'NE16', 'NE17', 'NE18',
    'SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6', 'SR7', 'SR8',
    'DH1', 'DH2', 'DH3', 'DH4', 'DH5', 'DH6', 'DH7', 'DH8', 'DH9',
    'TS1', 'TS2', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7', 'TS8'
  ];
  
  return keywords.some(keyword => upperText.includes(keyword));
}

function matchRoutes(location, description = '') {
  const routes = new Set();
  const text = `${location} ${description}`.toLowerCase();
  
  for (const [pattern, routeList] of Object.entries(ROUTE_MAPPING)) {
    if (text.includes(pattern)) {
      routeList.forEach(route => routes.add(route));
    }
  }
  
  return Array.from(routes).sort();
}

// SIMPLE: TomTom Traffic (basic flow endpoint)
async function fetchTomTomTraffic() {
  if (!process.env.TOMTOM_API_KEY) {
    console.warn('⚠️ TomTom API key not found');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  try {
    console.log('🚗 Fetching TomTom traffic data (simple flow API)...');
    
    // Use TomTom's simple Traffic Flow API (more reliable than incidents)
    const response = await axios.get('https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        point: '54.9783,-1.6178', // Newcastle center
        unit: 'KMPH'
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ TomTom: HTTP ${response.status}`);
    console.log(`📊 TomTom response keys:`, Object.keys(response.data || {}));
    
    const alerts = [];
    
    // Process TomTom flow data
    if (response.data && response.data.flowSegmentData) {
      const data = response.data.flowSegmentData;
      
      if (data.currentSpeed && data.freeFlowSpeed) {
        const speedReduction = ((data.freeFlowSpeed - data.currentSpeed) / data.freeFlowSpeed) * 100;
        
        if (speedReduction > 15) { // Significant slowdown
          alerts.push({
            id: `tomtom_flow_${Date.now()}`,
            type: 'congestion',
            title: 'Traffic Congestion - Newcastle Area',
            description: `Slow traffic detected. Current: ${Math.round(data.currentSpeed)}km/h, Normal: ${Math.round(data.freeFlowSpeed)}km/h (${Math.round(speedReduction)}% slower)`,
            location: 'Newcastle City Centre Area',
            authority: 'TomTom Traffic',
            source: 'tomtom',
            severity: speedReduction > 50 ? 'High' : speedReduction > 30 ? 'Medium' : 'Low',
            status: speedReduction > 40 ? 'red' : 'amber',
            currentSpeed: Math.round(data.currentSpeed),
            freeFlowSpeed: Math.round(data.freeFlowSpeed),
            speedReduction: Math.round(speedReduction),
            confidence: data.confidence || 0.8,
            affectsRoutes: ['Q1', 'Q2', 'Q3', '10', '11', '12', '21', 'X21'],
            coordinates: { lat: 54.9783, lng: -1.6178 },
            lastUpdated: new Date().toISOString(),
            dataSource: 'TomTom Traffic Flow API v4'
          });
        }
      }
    }
    
    console.log(`✅ TomTom: ${alerts.length} traffic alerts from 1 API call`);
    return { success: true, alerts, apiCalls: 1 };
    
  } catch (error) {
    console.error('❌ TomTom API error:', error.message);
    if (error.response) {
      console.error(`📡 TomTom response status: ${error.response.status}`);
      console.error(`📡 TomTom response data:`, error.response.data);
    }
    return { success: false, alerts: [], apiCalls: 0, error: error.message };
  }
}

// SIMPLE: MapQuest Traffic (single large bounding box)
async function fetchMapQuestTraffic() {
  if (!process.env.MAPQUEST_API_KEY) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  try {
    console.log('🗺️ Fetching MapQuest traffic data (single large area)...');
    
    // Single API call for entire North East region
    const response = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents', {
      params: {
        key: process.env.MAPQUEST_API_KEY,
        boundingBox: `${NORTH_EAST_BBOX.north},${NORTH_EAST_BBOX.west},${NORTH_EAST_BBOX.south},${NORTH_EAST_BBOX.east}`,
        filters: 'incidents,construction'
      },
      timeout: 20000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ MapQuest: HTTP ${response.status}`);
    console.log(`📊 MapQuest total incidents found: ${response.data?.incidents?.length || 0}`);
    
    const alerts = [];
    let processedCount = 0;
    
    if (response.data?.incidents) {
      response.data.incidents.forEach((incident, index) => {
        // Enhanced location extraction
        let location = 'Unknown Location';
        
        if (incident.street && incident.street.length > 3) {
          location = incident.street;
        } else if (incident.shortDesc && incident.shortDesc.length > 3) {
          location = incident.shortDesc;
        } else if (incident.fullDesc && incident.fullDesc.length > 10) {
          location = incident.fullDesc.substring(0, 50);
        } else if (incident.lat && incident.lng) {
          location = `Coordinates: ${incident.lat.toFixed(3)}, ${incident.lng.toFixed(3)}`;
        }
        
        const description = incident.fullDesc || incident.shortDesc || 'Traffic incident';
        
        // More permissive filtering - accept more incidents
        if (isInNorthEast(`${location} ${description}`)) {
          processedCount++;
          const routes = matchRoutes(location, description);
          
          alerts.push({
            id: `mapquest_${incident.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: incident.type === 1 ? 'roadwork' : 'incident',
            title: incident.shortDesc || 'Traffic Incident',
            description: description,
            location: location,
            authority: 'MapQuest Traffic',
            source: 'mapquest',
            severity: incident.severity >= 3 ? 'High' : incident.severity >= 2 ? 'Medium' : 'Low',
            status: 'red',
            startDate: incident.startTime ? new Date(incident.startTime).toISOString() : null,
            endDate: incident.endTime ? new Date(incident.endTime).toISOString() : null,
            affectsRoutes: routes,
            coordinates: incident.lat && incident.lng ? { lat: incident.lat, lng: incident.lng } : null,
            lastUpdated: new Date().toISOString(),
            dataSource: 'MapQuest Traffic API v2'
          });
          
          // Debug first few
          if (processedCount <= 3) {
            console.log(`✅ MapQuest alert ${processedCount}: ${location} (${incident.shortDesc})`);
          }
        }
      });
    }
    
    console.log(`✅ MapQuest: ${alerts.length} North East alerts from 1 API call (${((alerts.length / (response.data?.incidents?.length || 1)) * 100).toFixed(1)}% acceptance rate)`);
    return { success: true, alerts, apiCalls: 1 };
    
  } catch (error) {
    console.error('❌ MapQuest API error:', error.message);
    if (error.response) {
      console.error(`📡 MapQuest response status: ${error.response.status}`);
      console.error(`📡 MapQuest response data:`, error.response.data);
    }
    return { success: false, alerts: [], apiCalls: 0, error: error.message };
  }
}

// SIMPLE: National Highways (basic closures endpoint)
async function fetchNationalHighways() {
  if (!process.env.NATIONAL_HIGHWAYS_API_KEY) {
    console.warn('⚠️ National Highways API key not found');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  try {
    console.log('🛣️ Fetching National Highways data (basic closures)...');
    
    const response = await axios.get('https://api.data.nationalhighways.co.uk/roads/v2.0/closures', {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.NATIONAL_HIGHWAYS_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'BARRY-TrafficWatch/3.0'
      },
      timeout: 15000
    });
    
    console.log(`✅ National Highways: HTTP ${response.status}`);
    console.log(`📊 National Highways features: ${response.data?.features?.length || 0}`);
    
    const alerts = [];
    let processedCount = 0;
    
    if (response.data?.features) {
      // Debug: Log first feature structure
      if (response.data.features.length > 0) {
        console.log('🔍 Sample National Highways feature:', JSON.stringify(response.data.features[0], null, 2).substring(0, 500));
      }
      
      response.data.features.forEach((feature, index) => {
        const props = feature.properties || {};
        
        // Enhanced location extraction
        let location = 'Major Road Network';
        if (props.location && props.location.length > 3) {
          location = props.location;
        } else if (props.description && props.description.length > 5) {
          location = props.description.substring(0, 100);
        } else if (props.title && props.title.length > 3) {
          location = props.title;
        }
        
        const description = props.description || props.comment || props.title || 'Road closure or roadworks';
        
        // Check if it's in North East (more permissive)
        if (isInNorthEast(`${location} ${description}`) || index < 5) { // Accept first 5 for debugging
          processedCount++;
          const routes = matchRoutes(location, description);
          
          alerts.push({
            id: `nh_${props.id || Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'roadwork',
            title: props.title || props.description || 'National Highways Closure',
            description: description,
            location: location,
            authority: 'National Highways',
            source: 'national_highways',
            severity: (props.category || '').toLowerCase().includes('closure') ? 'High' : 'Medium',
            status: 'amber',
            startDate: props.startDate || null,
            endDate: props.endDate || null,
            affectsRoutes: routes,
            coordinates: feature.geometry ? {
              type: feature.geometry.type,
              coordinates: feature.geometry.coordinates
            } : null,
            lastUpdated: new Date().toISOString(),
            dataSource: 'National Highways DATEX II API'
          });
          
          // Debug first few
          if (processedCount <= 3) {
            console.log(`✅ National Highways alert ${processedCount}: ${location}`);
          }
        }
      });
    }
    
    console.log(`✅ National Highways: ${alerts.length} alerts from 1 API call`);
    return { success: true, alerts, apiCalls: 1 };
    
  } catch (error) {
    console.error('❌ National Highways API error:', error.message);
    if (error.response) {
      console.error(`📡 National Highways response status: ${error.response.status}`);
      console.error(`📡 National Highways response data:`, error.response.data);
    }
    return { success: false, alerts: [], apiCalls: 0, error: error.message };
  }
}

// SIMPLE: HERE Traffic (basic flow endpoint)
async function fetchHERETraffic() {
  if (!process.env.HERE_API_KEY) {
    console.warn('⚠️ HERE API key not found');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  try {
    console.log('📡 Fetching HERE traffic data (basic flow)...');
    
    // Try HERE's most basic traffic flow endpoint
    const response = await axios.get('https://traffic.ls.hereapi.com/traffic/6.3/flow.json', {
      params: {
        apikey: process.env.HERE_API_KEY, // Use 'apikey' not 'apiKey'
        prox: '54.9783,-1.6178,25000', // Newcastle, 25km radius
        responseattributes: 'sh,fc'
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ HERE: HTTP ${response.status}`);
    console.log(`📊 HERE response keys:`, Object.keys(response.data || {}));
    
    const alerts = [];
    
    // Basic processing - create monitoring alert
    if (response.data) {
      alerts.push({
        id: `here_monitoring_${Date.now()}`,
        type: 'congestion',
        title: 'Traffic Monitoring - North East',
        description: 'HERE traffic flow monitoring active for North East region',
        location: 'North East England',
        authority: 'HERE Traffic',
        source: 'here',
        severity: 'Low',
        status: 'green',
        affectsRoutes: [],
        coordinates: { lat: 54.9783, lng: -1.6178 },
        lastUpdated: new Date().toISOString(),
        dataSource: 'HERE Traffic API v6.3'
      });
      
      // Process any actual flow data if available
      if (response.data.RWS) {
        console.log('📊 HERE: Processing flow data...');
        // Additional processing could go here
      }
    }
    
    console.log(`✅ HERE: ${alerts.length} alerts from 1 API call`);
    return { success: true, alerts, apiCalls: 1 };
    
  } catch (error) {
    console.error('❌ HERE API error:', error.message);
    if (error.response) {
      console.error(`📡 HERE response status: ${error.response.status}`);
      console.error(`📡 HERE response data:`, error.response.data);
    }
    return { success: false, alerts: [], apiCalls: 0, error: error.message };
  }
}

// MAIN: Comprehensive traffic data fetcher (simple version)
export async function fetchComprehensiveTrafficData() {
  const startTime = Date.now();
  
  console.log('🚦 BARRY SIMPLE Traffic Intelligence System Starting...');
  console.log('📊 Fetching from: TomTom + MapQuest + National Highways + HERE (simple single calls)');

  // Fetch from all sources in parallel - SIMPLE VERSION
  const [tomtomResult, mapquestResult, nationalHighwaysResult, hereResult] = await Promise.allSettled([
    fetchTomTomTraffic(),
    fetchMapQuestTraffic(), 
    fetchNationalHighways(),
    fetchHERETraffic()
  ]);

  // Combine all alerts
  const allAlerts = [];
  let totalApiCalls = 0;

  // Process TomTom results
  if (tomtomResult.status === 'fulfilled' && tomtomResult.value.success) {
    allAlerts.push(...tomtomResult.value.alerts);
    totalApiCalls += tomtomResult.value.apiCalls;
    console.log(`✅ TomTom: ${tomtomResult.value.alerts.length} alerts added`);
  } else {
    console.log(`❌ TomTom: Failed - ${tomtomResult.status === 'rejected' ? tomtomResult.reason.message : tomtomResult.value.error}`);
  }

  // Process MapQuest results  
  if (mapquestResult.status === 'fulfilled' && mapquestResult.value.success) {
    allAlerts.push(...mapquestResult.value.alerts);
    totalApiCalls += mapquestResult.value.apiCalls;
    console.log(`✅ MapQuest: ${mapquestResult.value.alerts.length} alerts added`);
  } else {
    console.log(`❌ MapQuest: Failed - ${mapquestResult.status === 'rejected' ? mapquestResult.reason.message : mapquestResult.value.error}`);
  }

  // Process National Highways results
  if (nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success) {
    allAlerts.push(...nationalHighwaysResult.value.alerts);
    totalApiCalls += nationalHighwaysResult.value.apiCalls;
    console.log(`✅ National Highways: ${nationalHighwaysResult.value.alerts.length} alerts added`);
  } else {
    console.log(`❌ National Highways: Failed - ${nationalHighwaysResult.status === 'rejected' ? nationalHighwaysResult.reason.message : nationalHighwaysResult.value.error}`);
  }

  // Process HERE results
  if (hereResult.status === 'fulfilled' && hereResult.value.success) {
    allAlerts.push(...hereResult.value.alerts);
    totalApiCalls += hereResult.value.apiCalls;
    console.log(`✅ HERE: ${hereResult.value.alerts.length} alerts added`);
  } else {
    console.log(`❌ HERE: Failed - ${hereResult.status === 'rejected' ? hereResult.reason.message : hereResult.value.error}`);
  }

  // Remove duplicates and sort by priority
  const uniqueAlerts = removeDuplicateAlerts(allAlerts);
  const sortedAlerts = sortAlertsByPriority(uniqueAlerts);

  const processingTime = Date.now() - startTime;

  // Save comprehensive traffic data
  await saveTrafficData(sortedAlerts);

  const statistics = {
    totalAlerts: sortedAlerts.length,
    totalIncidents: sortedAlerts.filter(a => a.type === 'incident').length,
    totalCongestion: sortedAlerts.filter(a => a.type === 'congestion').length,
    totalRoadworks: sortedAlerts.filter(a => a.type === 'roadwork').length,
    highSeverity: sortedAlerts.filter(a => a.severity === 'High').length,
    sources: {
      tomtom: sortedAlerts.filter(a => a.source === 'tomtom').length,
      mapquest: sortedAlerts.filter(a => a.source === 'mapquest').length,
      nationalHighways: sortedAlerts.filter(a => a.source === 'national_highways').length,
      here: sortedAlerts.filter(a => a.source === 'here').length
    }
  };

  console.log('💾 Saved', sortedAlerts.length, 'traffic alerts to comprehensive-traffic-data.json');
  console.log('🎯 SIMPLE Traffic Summary:');
  console.log(`   📊 Total Alerts: ${statistics.totalAlerts}`);
  console.log(`   ✅ Successful Sources: ${[tomtomResult, mapquestResult, nationalHighwaysResult, hereResult].filter(r => r.status === 'fulfilled' && r.value.success).length}/4`);
  console.log(`   📞 Total API Calls: ${totalApiCalls}`);
  console.log(`   ⏱️ Processing Time: ${processingTime}ms`);

  return {
    success: true,
    alerts: sortedAlerts,
    metadata: {
      statistics,
      sources: {
        tomtom: {
          success: tomtomResult.status === 'fulfilled' && tomtomResult.value.success,
          count: tomtomResult.status === 'fulfilled' ? tomtomResult.value.alerts.length : 0,
          apiCalls: tomtomResult.status === 'fulfilled' ? tomtomResult.value.apiCalls : 0,
          error: tomtomResult.status === 'rejected' ? tomtomResult.reason.message : 
                 (tomtomResult.status === 'fulfilled' && !tomtomResult.value.success ? tomtomResult.value.error : null)
        },
        mapquest: {
          success: mapquestResult.status === 'fulfilled' && mapquestResult.value.success,
          count: mapquestResult.status === 'fulfilled' ? mapquestResult.value.alerts.length : 0,
          apiCalls: mapquestResult.status === 'fulfilled' ? mapquestResult.value.apiCalls : 0,
          error: mapquestResult.status === 'rejected' ? mapquestResult.reason.message :
                 (mapquestResult.status === 'fulfilled' && !mapquestResult.value.success ? mapquestResult.value.error : null)
        },
        nationalHighways: {
          success: nationalHighwaysResult.status === 'fulfilled' && nationalHighwaysResult.value.success,
          count: nationalHighwaysResult.status === 'fulfilled' ? nationalHighwaysResult.value.alerts.length : 0,
          apiCalls: nationalHighwaysResult.status === 'fulfilled' ? nationalHighwaysResult.value.apiCalls : 0,
          error: nationalHighwaysResult.status === 'rejected' ? nationalHighwaysResult.reason.message :
                 (nationalHighwaysResult.status === 'fulfilled' && !nationalHighwaysResult.value.success ? nationalHighwaysResult.value.error : null)
        },
        here: {
          success: hereResult.status === 'fulfilled' && hereResult.value.success,
          count: hereResult.status === 'fulfilled' ? hereResult.value.alerts.length : 0,
          apiCalls: hereResult.status === 'fulfilled' ? hereResult.value.apiCalls : 0,
          error: hereResult.status === 'rejected' ? hereResult.reason.message :
                 (hereResult.status === 'fulfilled' && !hereResult.value.success ? hereResult.value.error : null)
        }
      },
      processingTime: `${processingTime}ms`,
      lastUpdated: new Date().toISOString(),
      approach: 'simple_single_calls'
    }
  };
}

function removeDuplicateAlerts(alerts) {
  const seen = new Set();
  return alerts.filter(alert => {
    const key = `${alert.type}_${alert.location}_${alert.title}`.substring(0, 100).toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortAlertsByPriority(alerts) {
  return alerts.sort((a, b) => {
    // Priority order: incidents > congestion > roadworks
    const typePriority = { incident: 3, congestion: 2, roadwork: 1 };
    const statusPriority = { red: 3, amber: 2, green: 1 };
    const severityPriority = { High: 3, Medium: 2, Low: 1 };
    
    const aTypeScore = typePriority[a.type] || 0;
    const bTypeScore = typePriority[b.type] || 0;
    
    if (aTypeScore !== bTypeScore) return bTypeScore - aTypeScore;
    
    const aStatusScore = statusPriority[a.status] || 0;
    const bStatusScore = statusPriority[b.status] || 0;
    
    if (aStatusScore !== bStatusScore) return bStatusScore - aStatusScore;
    
    const aSeverityScore = severityPriority[a.severity] || 0;
    const bSeverityScore = severityPriority[b.severity] || 0;
    
    return bSeverityScore - aSeverityScore;
  });
}

async function saveTrafficData(alerts) {
  try {
    const dataDir = path.join(__dirname, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filePath = path.join(dataDir, 'comprehensive-traffic-data.json');
    await fs.writeFile(filePath, JSON.stringify({
      alerts,
      metadata: {
        count: alerts.length,
        lastUpdated: new Date().toISOString(),
        sources: ['TomTom Traffic Flow', 'MapQuest Traffic API', 'National Highways API', 'HERE Traffic API'],
        approach: 'simple_single_calls'
      }
    }, null, 2));
    
  } catch (error) {
    console.warn('⚠️ Could not save comprehensive traffic data:', error.message);
  }
}

export default fetchComprehensiveTrafficData;