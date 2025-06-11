// Quick WebSocket connection test
// Test if connection limits are the issue

const testConnections = async () => {
  const WS_URL = 'wss://go-barry.onrender.com/ws/supervisor-sync';
  const connections = [];
  
  console.log('🔍 Testing WebSocket connection limits...\n');

  for (let i = 1; i <= 5; i++) {
    try {
      console.log(`📡 Attempting connection ${i}...`);
      
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log(`✅ Connection ${i} successful`);
        
        // Send auth message
        ws.send(JSON.stringify({
          type: 'auth',
          clientType: 'display',
          timestamp: new Date().toISOString()
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`📨 Connection ${i} received: ${data.type}`);
      };
      
      ws.onerror = (error) => {
        console.log(`❌ Connection ${i} error:`, error.message);
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 Connection ${i} closed: Code ${event.code}`);
        if (event.code === 1008) {
          console.log(`🚨 Connection ${i} REJECTED - Rate limit exceeded!`);
        }
      };
      
      connections.push(ws);
      
      // Wait between connections
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Connection ${i} failed:`, error.message);
    }
  }
  
  // Clean up after 10 seconds
  setTimeout(() => {
    console.log('\n🧹 Cleaning up connections...');
    connections.forEach((ws, index) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log(`🔌 Closed connection ${index + 1}`);
      }
    });
  }, 10000);
};

// Run in browser console or Node.js with ws library
if (typeof window !== 'undefined') {
  // Browser environment
  testConnections();
} else {
  // Node.js environment
  import('ws').then(({ default: WebSocket }) => {
    global.WebSocket = WebSocket;
    testConnections();
  });
}
