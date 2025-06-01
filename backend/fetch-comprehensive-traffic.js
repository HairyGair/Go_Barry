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
  north: 55.5,
  south: 54.0,
  east: -0.5,
  west: -2.5
};

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

function isInNorthEast(text) {
  if (!text || typeof text !== 'string') return false;
  const upperText = text.toUpperCase();
  const keywords = [
    'A1', 'A19', 'A69', 'A68', 'A167', 'A183', 'A184', 'A690', 'A691', 'A1058',
    'M74', 'M8', 'A696', 'A697', 'A689', 'A688', 'A177', 'A181', 'A182',
    'NEWCASTLE', 'GATESHEAD', 'SUNDERLAND', 'DURHAM', 'MIDDLESBROUGH',
    'HARTLEPOOL', 'DARLINGTON', 'STOCKTON', 'REDCAR', 'WHITBY',
    'HEXHAM', 'CRAMLINGTON', 'BLYTH', 'ASHINGTON', 'MORPETH',
    'WASHINGTON', 'SEAHAM', 'CHESTER-LE-STREET', 'BIRTLEY',
    'BLAYDON', 'STANLEY', 'CONSETT', 'SPENNYMOOR', 'HOUGHTON',
    'NORTHUMBERLAND', 'TYNE', 'WEAR', 'TEESSIDE', 'CLEVELAND',
    'NORTH EAST', 'NORTHEAST', 'TYNESIDE', 'WEARSIDE',
    'TYNE TUNNEL', 'COAST ROAD', 'CENTRAL MOTORWAY',
    'QUAYSIDE', 'METRO CENTRE', 'TEAM VALLEY',
    'GOSFORTH', 'JESMOND', 'HEATON', 'WALKER', 'BENWELL',
    'WALLSEND', 'TYNEMOUTH', 'SOUTH SHIELDS', 'JARROW',
    'FELLING', 'PELAW', 'HEBBURN', 'BOLDON', 'CLEADON',
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
  // ... [Unchanged: your TomTom function] ...
}

// SIMPLE: MapQuest Traffic (single large bounding box)
async function fetchMapQuestTraffic() {
  if (!process.env.MAPQUEST_API_KEY) {
    console.warn('⚠️ MapQuest API key not found');
    return { success: false, alerts: [], apiCalls: 0 };
  }

  try {
    console.log('🗺️ Fetching MapQuest traffic data (single large area)...');
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
        // Only keep currently active incidents
        const now = new Date();
        if (incident.startTime) {
          const start = new Date(incident.startTime);
          if (start > now) return; // not started yet
        }
        if (incident.endTime) {
          const end = new Date(incident.endTime);
          if (end < now) return; // already finished
        }
        if (typeof incident.status === 'string' && incident.status.toUpperCase() !== 'ACTIVE') return;

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

// ... [rest of your code for National Highways, HERE, main fetchComprehensiveTrafficData, etc.] ...

export default fetchComprehensiveTrafficData;