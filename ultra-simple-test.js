// ultra-simple-test.js 
// Minimal test to check if backend responds

console.log('🔥 ULTRA SIMPLE TEST');
console.log('===================');

const https = require('https');

const options = {
  hostname: 'go-barry.onrender.com',
  port: 443,
  path: '/api/health',
  method: 'GET',
  timeout: 15000
};

console.log('📡 Making simple request...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Got response:', data.substring(0, 200));
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('⏰ Request timeout');
  req.destroy();
  process.exit(1);
});

req.end();

// Force exit after 20 seconds
setTimeout(() => {
  console.log('💀 Force exit - something is very wrong');
  process.exit(1);
}, 20000);
