#!/usr/bin/env node
// Test WebSocket Authentication with Session Fix

const https = require('https');

console.log('🧪 Testing WebSocket Authentication Flow with Session Fix...\n');

const API_BASE = 'https://go-barry.onrender.com';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  try {
    // Step 1: Check current sessions
    console.log('Step 1: Checking current sessions...');
    const sessionsCheck = await makeRequest('GET', '/api/supervisor/debug/sessions');
    console.log('Current sessions:', sessionsCheck.data);
    console.log('');

    // Step 2: Create test session
    console.log('Step 2: Creating test session...');
    const testSession = await makeRequest('POST', '/api/supervisor/debug/test-session');
    console.log('Test session result:', testSession.data);
    console.log('');

    if (testSession.data.success) {
      const sessionId = testSession.data.sessionId;
      
      // Step 3: Test WebSocket connection
      console.log('Step 3: Testing WebSocket connection...');
      const WebSocket = require('ws');
      
      const ws = new WebSocket('wss://go-barry.onrender.com/ws/supervisor-sync');
      
      ws.on('open', () => {
        console.log('✅ WebSocket connected!');
        
        // Send auth message
        const authMessage = {
          type: 'auth',
          clientType: 'supervisor',
          supervisorId: 'supervisor001',
          sessionId: sessionId
        };
        
        console.log('Sending auth:', authMessage);
        ws.send(JSON.stringify(authMessage));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('📨 Received:', message);
        
        if (message.type === 'auth_success') {
          console.log('✅ WebSocket authenticated successfully!');
          console.log('Connected displays:', message.connectedDisplays);
          
          // Test complete
          setTimeout(() => {
            ws.close();
            process.exit(0);
          }, 1000);
        } else if (message.type === 'auth_failed') {
          console.log('❌ WebSocket authentication failed:', message.error);
          ws.close();
          process.exit(1);
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        process.exit(1);
      });
      
      ws.on('close', () => {
        console.log('WebSocket closed');
      });
    } else {
      console.error('❌ Failed to create test session');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
console.log('🔗 Testing against:', API_BASE);
console.log('');

runTests();

// Add timeout
setTimeout(() => {
  console.error('❌ Test timed out after 30 seconds');
  process.exit(1);
}, 30000);
