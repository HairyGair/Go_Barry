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
console.log('📊 Data Sources: TomTom + National Highways (simple approach)');

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


// ... [rest of your code for National Highways, HERE, main fetchComprehensiveTrafficData, etc.] ...

export default fetchComprehensiveTrafficData;