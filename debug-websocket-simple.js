// Quick WebSocket connection test for BARRY
// Tests the supervisor-display sync connection

console.log('🚦 BARRY WebSocket Debug Test');

// Test WebSocket connection
const testWebSocket = () => {
  const wsUrl = 'wss://go-barry.onrender.com/ws/supervisor-sync';
  console.log(`🔌 Testing connection to: ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ WebSocket connection opened');
    
    // Test display authentication
    const authMessage = {
      type: 'auth',
      clientType: 'display',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending display auth:', authMessage);
    ws.send(JSON.stringify(authMessage));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Received:', data.type, data);
    
    if (data.type === 'auth_success') {
      console.log('🎉 Display authentication successful!');
      
      // Now test supervisor auth
      setTimeout(() => {
        const supervisorAuth = {
          type: 'auth',
          clientType: 'supervisor',
          supervisorId: 'test_supervisor',
          sessionId: 'test_session_' + Date.now(),
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Testing supervisor auth:', supervisorAuth);
        ws.send(JSON.stringify(supervisorAuth));
      }, 1000);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };
  
  ws.onclose = (event) => {
    console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
  };
  
  // Timeout after 10 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      console.log('⏰ Connection timeout');
      ws.close();
    }
  }, 10000);
};

// Run the test
testWebSocket();
