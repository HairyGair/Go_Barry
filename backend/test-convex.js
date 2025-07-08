// Test script for Convex connection
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testConvex() {
  console.log('🔍 Testing Convex connection...');
  
  const convexUrl = process.env.CONVEX_URL;
  console.log('Convex URL:', convexUrl ? 'Set' : 'Missing');
  
  if (!convexUrl) {
    console.log('❌ CONVEX_URL not found in environment');
    return;
  }
  
  console.log('🧪 Testing basic connection...');
  
  try {
    // Test basic connection
    const response = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:getSyncState',
        args: {},
        format: 'json'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Convex response:', result);
    
    // Test the specific bus sync function with minimal data
    console.log('\n🚌 Testing bus sync function with minimal data...');
    const minimalBusResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:updateSimpleBusLocations',
        args: {
          buses: [{
            id: 'test001',
            operatorRef: 'GNEL',
            routeName: 'Test',
            lineRef: 'T01',
            coordinates: [54.9783, -1.6178],
            bearing: 0,
            delay: 0,
            status: 'delayed',
            destination: 'TestDest',
            lastUpdate: Date.now()
          }],
          timestamp: new Date().toISOString()
        },
        format: 'json'
      }),
    });
    
    console.log('Minimal bus sync response status:', minimalBusResponse.status);
    
    if (!minimalBusResponse.ok) {
      const minimalErrorText = await minimalBusResponse.text();
      console.error('❌ Minimal bus sync HTTP error:', minimalBusResponse.status, minimalErrorText);
    } else {
      const minimalResult = await minimalBusResponse.json();
      console.log('✅ Minimal bus sync response:', minimalResult);
    }
    
    // Test with empty array
    console.log('\n🔄 Testing with empty buses array...');
    const emptyBusResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:updateSimpleBusLocations',
        args: {
          buses: [],
          timestamp: new Date().toISOString()
        },
        format: 'json'
      }),
    });
    
    console.log('Empty bus sync response status:', emptyBusResponse.status);
    
    if (!emptyBusResponse.ok) {
      const emptyErrorText = await emptyBusResponse.text();
      console.error('❌ Empty bus sync HTTP error:', emptyBusResponse.status, emptyErrorText);
    } else {
      const emptyResult = await emptyBusResponse.json();
      console.log('✅ Empty bus sync response:', emptyResult);
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConvex().then(() => {
  console.log('🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});