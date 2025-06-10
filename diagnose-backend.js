// diagnose-backend.js
// Step-by-step diagnosis of backend issues

const https = require('https');

console.log('🔍 BACKEND DIAGNOSIS');
console.log('==================');

async function checkStep(stepName, testFunction) {
  console.log(`\n🔍 ${stepName}...`);
  try {
    const result = await testFunction();
    if (result) {
      console.log(`✅ ${stepName}: PASSED`);
      return true;
    } else {
      console.log(`❌ ${stepName}: FAILED`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${stepName}: ERROR - ${error.message}`);
    return false;
  }
}

// Test 1: DNS Resolution
function testDNS() {
  return new Promise((resolve) => {
    const dns = require('dns');
    dns.lookup('go-barry.onrender.com', (err, address) => {
      if (err) {
        console.log(`   DNS Error: ${err.message}`);
        resolve(false);
      } else {
        console.log(`   DNS resolved to: ${address}`);
        resolve(true);
      }
    });
  });
}

// Test 2: TCP Connection
function testTCPConnection() {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(10000);
    
    socket.connect(443, 'go-barry.onrender.com', () => {
      console.log('   TCP connection successful');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      console.log(`   TCP Error: ${error.message}`);
      resolve(false);
    });
    
    socket.on('timeout', () => {
      console.log('   TCP Timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

// Test 3: HTTP Response (any response)
function testHTTPResponse() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'go-barry.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      timeout: 30000
    }, (res) => {
      console.log(`   HTTP Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Response length: ${data.length} chars`);
        if (data.length > 0) {
          console.log(`   Response preview: ${data.substring(0, 100)}...`);
        }
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log(`   HTTP Error: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('   HTTP Timeout (30s)');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Test 4: Check if it's a cold start issue
function testColdStart() {
  return new Promise((resolve) => {
    console.log('   Testing if backend needs cold start wake-up...');
    console.log('   (This can take 60+ seconds on first request)');
    
    const req = https.request({
      hostname: 'go-barry.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      timeout: 90000 // 90 seconds for cold start
    }, (res) => {
      console.log(`   Cold start response: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (error) => {
      console.log(`   Cold start failed: ${error.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log('   Cold start timeout (90s) - backend likely down');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function runDiagnosis() {
  console.log('Starting comprehensive backend diagnosis...\n');
  
  const step1 = await checkStep('DNS Resolution', testDNS);
  if (!step1) {
    console.log('\n💀 DNS failed - check internet connection');
    return;
  }
  
  const step2 = await checkStep('TCP Connection to Port 443', testTCPConnection);
  if (!step2) {
    console.log('\n💀 Cannot connect to server - backend likely down');
    return;
  }
  
  const step3 = await checkStep('HTTP Response (quick)', testHTTPResponse);
  if (!step3) {
    console.log('\n🔄 Quick HTTP failed - trying cold start wake-up...');
    
    const step4 = await checkStep('Cold Start Wake-up (90s timeout)', testColdStart);
    if (!step4) {
      console.log('\n💀 Backend completely unresponsive');
      console.log('\n🚨 NEXT ACTIONS:');
      console.log('   1. Check Render dashboard: https://dashboard.render.com');
      console.log('   2. Look at build/deploy logs');
      console.log('   3. Check service logs for errors');
      console.log('   4. Consider emergency minimal deployment');
      return;
    }
  }
  
  console.log('\n✅ DIAGNOSIS COMPLETE: Backend is responsive');
  console.log('\n🎯 Now run: node quick-test-data-feeds.js');
}

runDiagnosis().catch(console.error);
