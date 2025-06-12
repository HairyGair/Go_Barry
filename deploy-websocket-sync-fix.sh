#!/bin/bash
chmod +x "$0"

echo "🚀 Deploying complete Supervisor-Display sync fix..."

# Fix CORS in backend - already done above

# Add WebSocket debugging to backend
cat > /tmp/websocket-debug.patch << 'EOF'
--- a/backend/services/supervisorSync.js
+++ b/backend/services/supervisorSync.js
@@ -87,6 +87,7 @@ class SupervisorSyncService {
     });
 
     // Set up event handlers
+    console.log(`🔐 Client ${clientId} waiting for authentication...`);
     ws.on('message', (message) => {
       this.handleMessage(clientId, message);
     });
@@ -208,6 +209,7 @@ class SupervisorSyncService {
         });
         
         // Send updated supervisor list to all displays
+        console.log(`📡 Sending supervisor list update to all displays...`);
         const activeSupervisors = [];
         for (const [clientId, client] of this.clients.entries()) {
           if (client.type === 'supervisor' && client.supervisorId) {
@@ -368,6 +370,15 @@ class SupervisorSyncService {
       this.broadcastToDisplays({
         type: 'supervisor_disconnected',
         supervisorId: client.supervisorId,
+        remainingSupervisors: this.getConnectedSupervisors().length
+      });
+      
+      // Send updated supervisor list
+      const updatedList = this.getConnectedSupervisors();
+      console.log(`📡 Supervisor disconnected - updating display list (${updatedList.length} remaining)`);
+      this.broadcastToDisplays({
+        type: 'supervisor_list_updated',
+        supervisors: updatedList,
         remainingSupervisors: this.getConnectedSupervisors().length
       });
     } else if (client.type === 'display') {
EOF

# Apply the patch
cd backend/services
patch -p1 < /tmp/websocket-debug.patch || echo "Patch may have already been applied"
cd ../..

# Create a test file to verify WebSocket connection
cat > test-websocket-sync.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Sync Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
        .log { background: #f8f9fa; padding: 10px; margin: 10px 0; height: 300px; overflow-y: auto; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>WebSocket Supervisor-Display Sync Test</h1>
    
    <div id="status" class="status disconnected">Disconnected</div>
    
    <div>
        <button onclick="connectAsSupervisor()">Connect as Supervisor</button>
        <button onclick="connectAsDisplay()">Connect as Display</button>
        <button onclick="disconnect()">Disconnect</button>
        <button onclick="clearLog()">Clear Log</button>
    </div>
    
    <div>
        <button onclick="sendTestAlert()">Send Test Alert</button>
        <button onclick="acknowledgeAlert()">Acknowledge Alert</button>
        <button onclick="broadcastMessage()">Broadcast Message</button>
    </div>
    
    <div class="log" id="log"></div>
    
    <script>
        let ws = null;
        let clientType = null;
        
        function log(message, type = 'info') {
            const logEl = document.getElementById('log');
            const time = new Date().toLocaleTimeString();
            const color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
            logEl.innerHTML += `<div style="color: ${color}">[${time}] ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        }
        
        function updateStatus(connected) {
            const statusEl = document.getElementById('status');
            if (connected) {
                statusEl.className = 'status connected';
                statusEl.textContent = `Connected as ${clientType}`;
            } else {
                statusEl.className = 'status disconnected';
                statusEl.textContent = 'Disconnected';
            }
        }
        
        function connect(type) {
            if (ws) {
                ws.close();
            }
            
            clientType = type;
            const wsUrl = 'wss://go-barry.onrender.com/ws/supervisor-sync';
            log(`Connecting to ${wsUrl} as ${type}...`);
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                log('WebSocket connected', 'success');
                
                // Send auth message
                const authMsg = {
                    type: 'auth',
                    clientType: type,
                    ...(type === 'supervisor' && {
                        supervisorId: 'test-sup-001',
                        sessionId: 'test-session-' + Date.now()
                    })
                };
                
                ws.send(JSON.stringify(authMsg));
                log(`Sent auth: ${JSON.stringify(authMsg)}`);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                log(`Received: ${data.type} - ${JSON.stringify(data)}`);
                
                if (data.type === 'auth_success') {
                    updateStatus(true);
                    log('Authentication successful!', 'success');
                } else if (data.type === 'auth_failed') {
                    log(`Authentication failed: ${data.error}`, 'error');
                }
            };
            
            ws.onerror = (error) => {
                log('WebSocket error', 'error');
                console.error(error);
            };
            
            ws.onclose = (event) => {
                log(`WebSocket closed: ${event.code} ${event.reason}`);
                updateStatus(false);
                ws = null;
            };
        }
        
        function connectAsSupervisor() {
            connect('supervisor');
        }
        
        function connectAsDisplay() {
            connect('display');
        }
        
        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
            }
        }
        
        function sendTestAlert() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                log('Not connected', 'error');
                return;
            }
            
            const msg = {
                type: 'update_alerts',
                alerts: [{
                    id: 'test-alert-' + Date.now(),
                    title: 'Test Alert',
                    location: 'Newcastle City Centre',
                    severity: 'High',
                    description: 'Test alert from WebSocket test'
                }]
            };
            
            ws.send(JSON.stringify(msg));
            log(`Sent: ${JSON.stringify(msg)}`);
        }
        
        function acknowledgeAlert() {
            if (!ws || ws.readyState !== WebSocket.OPEN || clientType !== 'supervisor') {
                log('Must be connected as supervisor', 'error');
                return;
            }
            
            const msg = {
                type: 'acknowledge_alert',
                alertId: 'test-alert-001',
                reason: 'Test acknowledgment',
                notes: 'Testing WebSocket sync'
            };
            
            ws.send(JSON.stringify(msg));
            log(`Sent: ${JSON.stringify(msg)}`);
        }
        
        function broadcastMessage() {
            if (!ws || ws.readyState !== WebSocket.OPEN || clientType !== 'supervisor') {
                log('Must be connected as supervisor', 'error');
                return;
            }
            
            const msg = {
                type: 'broadcast_message',
                message: 'Test broadcast from WebSocket test',
                priority: 'info',
                duration: 30000
            };
            
            ws.send(JSON.stringify(msg));
            log(`Sent: ${JSON.stringify(msg)}`);
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }
    </script>
</body>
</html>
EOF

echo "✅ WebSocket test file created: test-websocket-sync.html"

# Add and commit
git add backend/index.js
git add backend/services/supervisorSync.js
git add test-websocket-sync.html
git commit -m "Fix: Complete Supervisor-Display WebSocket sync with CORS fix"
git push origin main

echo "✅ Fix deployed!"
echo ""
echo "⏱️ Wait 3-5 minutes for Render to rebuild"
echo ""
echo "Then test:"
echo "1. Open display screen: https://gobarry.co.uk/display"
echo "2. Open supervisor: https://gobarry.co.uk/browser-main"
echo "3. Login and check if supervisor appears on display"
echo ""
echo "For debugging, you can also open test-websocket-sync.html locally"
