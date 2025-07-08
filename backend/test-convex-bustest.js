// Test the simplified bus test function
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testBusTestFunction() {
  const convexUrl = process.env.CONVEX_URL;
  console.log('🧪 Testing simplified bus test function...');
  
  try {
    const response = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'busTest:testBusInsertion',
        args: {
          testBus: {
            id: 'test001',
            operatorRef: 'GNEL',
            routeName: 'Test Route',
            lineRef: 'T01',
            coordinates: [54.9783, -1.6178],
            bearing: 0,
            delay: 0,
            status: 'on-time',
            destination: 'Test Destination',
            lastUpdate: Date.now()
          }
        },
        format: 'json'
      }),
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBusTestFunction().then(() => {
  console.log('🏁 Bus test complete');
  process.exit(0);
});