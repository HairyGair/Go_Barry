// Simple Convex test to isolate the issue
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testSimpleConvex() {
  const convexUrl = process.env.CONVEX_URL;
  console.log('🔍 Testing simple Convex insertion...');
  
  // Test with minimal required fields only
  try {
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'sync:updateSimpleBusLocations',
        args: {
          buses: [{
            id: 'simple001',
            operatorRef: 'GNEL',
            routeName: 'Test',
            lineRef: 'T01',
            coordinates: [54.9783, -1.6178],
            bearing: 0,
            delay: 0,
            status: 'on-time',
            destination: 'Test Destination',
            lastUpdate: Date.now()
          }],
          timestamp: new Date().toISOString()
        },
        format: 'json'
      }),
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.status === 'error') {
      console.log('❌ Error detected, testing simplified version...');
      
      // Test with pre-converted dates
      const now = new Date();
      const response2 = await fetch(`${convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'sync:updateSimpleBusLocations',
          args: {
            buses: [{
              id: 'simple002',
              operatorRef: 'GNEL',
              routeName: 'Test2',
              lineRef: 'T02',
              coordinates: [54.9783, -1.6178],
              bearing: 0,
              delay: 0,
              status: 'on-time',
              destination: 'Test Destination 2',
              lastUpdate: now.getTime() // Use getTime() explicitly
            }],
            timestamp: now.toISOString()
          },
          format: 'json'
        }),
      });
      
      const result2 = await response2.json();
      console.log('Simplified response:', JSON.stringify(result2, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleConvex().then(() => {
  console.log('🏁 Simple test complete');
  process.exit(0);
});