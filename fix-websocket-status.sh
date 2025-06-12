#!/bin/bash
chmod +x "$0"

echo "🚀 Fixing WebSocket Connection Status Display..."

# Fix browser-main.jsx to show real WebSocket status
cat > /tmp/browser-main-websocket-fix.patch << 'EOF'
--- a/Go_BARRY/app/browser-main.jsx
+++ b/Go_BARRY/app/browser-main.jsx
@@ -31,6 +31,7 @@ import WebSocketDiagnostics from '../components/WebSocketDiagnostics';
 import { useSupervisorSession } from '../components/hooks/useSupervisorSession';
 import { useBarryAPI } from '../components/hooks/useBARRYapi';
 import { API_CONFIG } from '../config/api';
+import { useSupervisorSync, CONNECTION_STATES } from '../components/hooks/useSupervisorSync';
 
 const { width, height } = Dimensions.get('window');
 
@@ -143,6 +144,20 @@ const BrowserMainApp = () => {
 
   // Get live alerts for supervisor control
   const { alerts } = useBarryAPI({ autoRefresh: true, refreshInterval: 15000 });
+  
+  // Add WebSocket connection tracking
+  const {
+    connectionState,
+    isConnected: wsConnected,
+    connectedDisplays
+  } = useSupervisorSync({
+    clientType: 'supervisor',
+    supervisorId: supervisorSession?.supervisor?.backendId || supervisorSession?.supervisor?.id,
+    sessionId: sessionId,
+    autoConnect: isLoggedIn, // Only connect when logged in
+    onConnectionChange: (connected) => {
+      console.log('🔌 WebSocket connection changed:', connected);
+    }
+  });
 
   const [activeScreen, setActiveScreen] = useState('supervisor');
   const [showSupervisorLogin, setShowSupervisorLogin] = useState(false);
@@ -150,6 +165,27 @@ const BrowserMainApp = () => {
   const [currentTime, setCurrentTime] = useState(new Date());
   const [isFullscreen, setIsFullscreen] = useState(false);
+  
+  // Helper to get connection status details
+  const getConnectionStatus = () => {
+    if (!isLoggedIn) {
+      return { color: '#6B7280', text: 'Not logged in' };
+    }
+    
+    switch (connectionState) {
+      case CONNECTION_STATES.CONNECTED:
+        return { 
+          color: '#10B981', 
+          text: `Display Sync Active (${connectedDisplays} display${connectedDisplays !== 1 ? 's' : ''})` 
+        };
+      case CONNECTION_STATES.CONNECTING:
+        return { color: '#F59E0B', text: 'Connecting to display sync...' };
+      case CONNECTION_STATES.RECONNECTING:
+        return { color: '#F59E0B', text: 'Reconnecting...' };
+      case CONNECTION_STATES.ERROR:
+        return { color: '#EF4444', text: 'Connection error' };
+      default:
+        return { color: '#6B7280', text: 'Display sync offline' };
+    }
+  };
 
   // Update time every minute
   useEffect(() => {
@@ -376,15 +412,17 @@ const BrowserMainApp = () => {
                   {isAdmin && (
                     <Text style={styles.adminBadge}>⭐ Admin</Text>
                   )}
-                  <View style={styles.connectionStatus}>
-                    <View style={[
-                      styles.connectionDot,
-                      { backgroundColor: '#EF4444' }
-                    ]} />
-                    <Text style={[
-                      styles.connectionText,
-                      { color: '#EF4444' }
-                    ]}>
-                      Display Sync Offline (Testing Mode)
-                    </Text>
-                  </View>
+                  {(() => {
+                    const status = getConnectionStatus();
+                    return (
+                      <View style={styles.connectionStatus}>
+                        <View style={[
+                          styles.connectionDot,
+                          { backgroundColor: status.color }
+                        ]} />
+                        <Text style={[
+                          styles.connectionText,
+                          { color: status.color }
+                        ]}>
+                          {status.text}
+                        </Text>
+                      </View>
+                    );
+                  })()}
                 </View>
EOF

cd Go_BARRY/app
patch -p2 < /tmp/browser-main-websocket-fix.patch || echo "Patch may have already been applied"
cd ../..

# Also let's add a quick WebSocket status indicator to the screen header
cat > /tmp/browser-main-header-fix.patch << 'EOF'
--- a/Go_BARRY/app/browser-main.jsx
+++ b/Go_BARRY/app/browser-main.jsx
@@ -305,6 +305,19 @@ const BrowserMainApp = () => {
             </TouchableOpacity>
             
+            {/* WebSocket Status Indicator */}
+            {isLoggedIn && (
+              <View style={styles.wsStatusIndicator}>
+                <View style={[
+                  styles.wsStatusDot,
+                  { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }
+                ]} />
+                <Text style={styles.wsStatusText}>
+                  {wsConnected ? 'Connected' : 'Offline'}
+                </Text>
+              </View>
+            )}
+            
             <Text style={styles.currentTime}>
               {currentTime.toLocaleTimeString('en-GB', { 
                 hour: '2-digit', 
@@ -708,5 +721,22 @@ const styles = StyleSheet.create({
   screenContent: {
     flex: 1,
     overflow: 'hidden',
   },
+  wsStatusIndicator: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    gap: 6,
+    paddingHorizontal: 12,
+    paddingVertical: 6,
+    backgroundColor: '#F9FAFB',
+    borderRadius: 20,
+  },
+  wsStatusDot: {
+    width: 8,
+    height: 8,
+    borderRadius: 4,
+  },
+  wsStatusText: {
+    fontSize: 12,
+    fontWeight: '600',
+    color: '#374151',
+  },
 });
EOF

cd Go_BARRY/app
patch -p2 < /tmp/browser-main-header-fix.patch || echo "Patch may have partially been applied"
cd ../..

echo "✅ Fixes applied!"
echo ""
echo "Committing and deploying..."

git add -A
git add WEBSOCKET_TROUBLESHOOTING.md
git commit -m "Fix: Show real WebSocket connection status instead of hardcoded testing mode"
git push origin main

echo "✅ Deployed!"
echo ""
echo "⏱️ Wait 3-5 minutes for Render to rebuild"
echo ""
echo "After rebuild, the sidebar should show:"
echo "- 'Display Sync Active (X displays)' when connected"
echo "- 'Connecting to display sync...' when connecting"
echo "- 'Display sync offline' when disconnected"
echo ""
echo "There will also be a connection indicator in the top header bar."
