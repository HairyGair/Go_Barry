// quick-debug-test.js
// Simple test to see what's happening

const https = require('https');

console.log('🔍 DEBUGGING: Testing basic connectivity...');

// Test 1: Basic connection test
function testBasicConnection() {
  return new Promise((resolve) => {
    console.log('📡 Testing basic HTTPS connection to Render...');
    
    const req = https.get('https://go-barry.onrender.com/api/health', {
      timeout: 10000
    }, (res) => {
      console.log(`✅ Connection successful: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📄 Response: ${data.substring(0, 100)}...`);
        resolve(true);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Connection failed: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('⏰ Connection timeout');
      req.destroy();
      resolve(false);
    });
  });
}

// Test 2: DNS resolution
function testDNS() {
  return new Promise((resolve) => {
    const dns = require('dns');
    console.log('🌐 Testing DNS resolution for go-barry.onrender.com...');
    
    dns.lookup('go-barry.onrender.com', (err, address) => {
      if (err) {
        console.log(`❌ DNS failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`✅ DNS resolved: ${address}`);
        resolve(true);
      }
    });
  });
}

async function runDebugTest() {
  console.log('🚀 Starting debug test...');
  
  // Test DNS first
  const dnsWorking = await testDNS();
  if (!dnsWorking) {
    console.log('💔 DNS failed - check internet connection');
    return;
  }
  
  // Test basic connection
  const connectionWorking = await testBasicConnection();
  if (!connectionWorking) {
    console.log('💔 Basic connection failed - backend might be down');
    return;
  }
  
  console.log('✅ Basic connectivity working - issue is elsewhere');
}

runDebugTest().catch(console.error);
