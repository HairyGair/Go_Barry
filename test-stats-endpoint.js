// Test if the stats endpoint is accessible on production backend
import https from 'https';

const API_URL = 'https://api.breakdowns.gobarry.co.uk';
const SUPERVISOR_ID = '1646c9a7-58fe-4ea6-bff2-8b5c3bbe54a0';

// Test without auth (should return 401)
console.log('🔍 Testing stats endpoint without authentication...');
https.get(`${API_URL}/api/supervisors/${SUPERVISOR_ID}/stats`, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
});

// Test health endpoint for comparison
console.log('\n🏥 Testing health endpoint for comparison...');
setTimeout(() => {
  https.get(`${API_URL}/health`, (res) => {
    console.log(`Health Status Code: ${res.statusCode}`);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('\nHealth Response:');
      try {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Health check error:', err.message);
  });
}, 1000);
