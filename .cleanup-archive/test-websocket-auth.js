#!/usr/bin/env node
// Test WebSocket Authentication Flow

console.log('🧪 Testing WebSocket Authentication Flow...\n');

// Step 1: Authenticate supervisor via API
console.log('Step 1: Authenticating supervisor...');
const authData = {
  supervisorId: 'supervisor001',
  badge: 'AW001'
};

console.log('Auth Request:', authData);

fetch('https://go-barry.onrender.com/api/supervisor/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(authData)
})
.then(response => response.json())
.then(result => {
  if (result.success) {
    console.log('✅ Authentication successful!');
    console.log('Session ID:', result.sessionId);
    console.log('Supervisor:', result.supervisor);
    
    // Step 2: Test WebSocket connection
    console.log('\nStep 2: Connecting to WebSocket...');
    const WebSocket = require('ws');
    
    const ws = new WebSocket('wss://go-barry.onrender.com/ws/supervisor-sync');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected!');
      
      // Step 3: Authenticate WebSocket
      console.log('\nStep 3: Authenticating WebSocket...');
      const authMessage = {
        type: 'auth',
        clientType: 'supervisor',
        supervisorId: 'supervisor001',
        sessionId: result.sessionId
      };
      
      console.log('Sending auth:', authMessage);
      ws.send(JSON.stringify(authMessage));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('📨 Received:', message.type);
      
      if (message.type === 'auth_success') {
        console.log('✅ WebSocket authenticated successfully!');
        console.log('Connected displays:', message.connectedDisplays);
        process.exit(0);
      } else if (message.type === 'auth_failed') {
        console.log('❌ WebSocket authentication failed:', message.error);
        process.exit(1);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      process.exit(1);
    });
    
  } else {
    console.log('❌ Authentication failed:', result.error);
    process.exit(1);
  }
})
.catch(error => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

// Instructions for manual testing
console.log('\n📝 Manual Testing Instructions:');
console.log('1. Go to https://gobarry.co.uk');
console.log('2. Click login and select "Alex Woodcock"');
console.log('3. Open browser console (F12)');
console.log('4. Check for WebSocket connection messages');
console.log('5. Go to https://gobarry.co.uk/display');
console.log('6. Should see "1 SUPERVISOR ONLINE"\n');
