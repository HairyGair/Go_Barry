// Test script to manually push bus data to Convex
// Run this with: node backend/scripts/testBusConvexSync.js

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const CONVEX_URL = process.env.CONVEX_URL || 'https://standing-octopus-908.convex.cloud';

console.log('🚌 Testing bus sync to Convex...');
console.log('📡 Convex URL:', CONVEX_URL);

// Generate mock bus data
function generateMockBusData() {
  const routes = ['21', 'X21', '1', '56', '57', '58', 'Q3', '307', '27', 'X10'];
  const buses = [];
  
  // Newcastle/Gateshead area bounds
  const bounds = {
    north: 55.0184,
    south: 54.9045,
    east: -1.4876,
    west: -1.7297
  };
  
  const busCount = 15;
  
  for (let i = 0; i < busCount; i++) {
    const route = routes[Math.floor(Math.random() * routes.length)];
    const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    const lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    const delayMinutes = Math.random() < 0.7 ? Math.floor(Math.random() * 10) : 0;
    const bearing = Math.floor(Math.random() * 360);
    
    buses.push({
      id: `test-bus-${1000 + i}`,
      vehicleRef: `TEST-${1000 + i}`,
      operatorRef: 'GNEL',
      routeName: route,
      lineRef: route,
      coordinates: [lat, lng],
      bearing: bearing,
      delay: delayMinutes,
      status: delayMinutes > 5 ? 'delayed' : 'on-time',
      destination: `${route} ${Math.random() > 0.5 ? 'Newcastle' : 'Gateshead'}`,
      occupancy: Math.random() < 0.5 ? 'seatsAvailable' : 'standingAvailable',
      lastUpdate: Date.now()
    });
  }
  
  return buses;
}

async function syncBusesToConvex() {
  try {
    const buses = generateMockBusData();
    console.log(`📦 Generated ${buses.length} test buses`);
    
    // Call the simplified mutation
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:updateSimpleBusLocations',
        args: {
          buses: buses,
          timestamp: new Date().toISOString()
        },
        format: 'json'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Convex error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.errorMessage || 'Unknown Convex error');
    }

    console.log('✅ Successfully synced buses to Convex!');
    console.log('📊 Result:', result.value);
    
    // Test fetching them back
    console.log('\n🔍 Fetching buses back from Convex...');
    
    const fetchResponse = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:getBusLocations',
        args: {},
        format: 'json'
      }),
    });
    
    if (fetchResponse.ok) {
      const fetchResult = await fetchResponse.json();
      if (fetchResult.value) {
        console.log(`✅ Retrieved ${fetchResult.value.length} buses from Convex`);
        console.log('🚌 Sample bus:', fetchResult.value[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error syncing buses:', error.message);
  }
}

// Run the test
syncBusesToConvex();
