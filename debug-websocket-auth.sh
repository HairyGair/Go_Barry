#!/bin/bash
echo "🔧 Fixing WebSocket Authentication Issue..."

# Step 1: Update browser-main to debug WebSocket connection
cat > /tmp/websocket-debug.patch << 'EOF'
--- a/Go_BARRY/app/browser-main.jsx
+++ b/Go_BARRY/app/browser-main.jsx
@@ -308,7 +308,13 @@
         <View style={styles.screenContent}>
           {activeScreen === 'supervisor' ? (
             <SupervisorControl
-              supervisorId={supervisorSession?.supervisor?.backendId || 'supervisor001'} // Force backend ID
+              supervisorId={supervisorSession?.supervisor?.backendId || supervisorId} // Use backend ID for WebSocket
               supervisorName={supervisorName}
               sessionId={sessionId}
               alerts={alerts}
+              onMount={() => {
+                console.log('🚀 SupervisorControl mounted with:', { 
+                  supervisorId: supervisorSession?.supervisor?.backendId, 
+                  sessionId, 
+                  supervisorName 
+                });
+              }}
             />
EOF

# Step 2: Add debug logging to SupervisorControl
cat > /tmp/supervisor-control-debug.patch << 'EOF'
--- a/Go_BARRY/components/SupervisorControl.jsx
+++ b/Go_BARRY/components/SupervisorControl.jsx
@@ -50,6 +50,15 @@ const SupervisorControl = ({ 
   sector = 1 // Sector 1: Supervisor Control
 }) => {
+  // Debug logging on mount
+  useEffect(() => {
+    console.log('🎯 SupervisorControl initialized with:', {
+      supervisorId,
+      sessionId,
+      supervisorName,
+      hasAlerts: alerts.length > 0
+    });
+  }, []);
+
   // Use the shared WebSocket hook
   const {
     connectionState,
EOF

# Step 3: Fix WebSocket authentication in hook
cat > /tmp/websocket-hook-fix.patch << 'EOF'
--- a/Go_BARRY/components/hooks/useSupervisorSync.js
+++ b/Go_BARRY/components/hooks/useSupervisorSync.js
@@ -370,6 +370,12 @@ export const useSupervisorSync = ({ 
         
         // Authenticate based on client type
         const authMessage = {
           type: MESSAGE_TYPES.AUTH,
           clientType,
           ...(clientType === 'supervisor' && { supervisorId, sessionId })
         };
         
+        console.log('🔐 WebSocket Auth Details:', {
+          clientType,
+          supervisorId,
+          sessionId,
+          hasSessionId: !!sessionId
+        });
+        
         // Send auth message directly (don't use sendMessage which checks connection state)
EOF

echo "✅ Debug patches created!"

# Apply the patches (manually since patch might not be available)
echo ""
echo "📝 Manual Application Instructions:"
echo "1. Add debug logging to browser-main.jsx at line 311"
echo "2. Add debug logging to SupervisorControl.jsx at line 53"
echo "3. Add debug logging to useSupervisorSync.js at line 377"
echo ""
echo "Then commit and deploy to see what's actually being passed!"
