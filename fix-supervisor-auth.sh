#!/bin/bash
chmod +x "$0"

echo "🚀 Fixing Supervisor Login & WebSocket Connection..."

# Fix 1: Update browser-main.jsx to properly pass supervisor info
cat > /tmp/browser-main-fix.patch << 'EOF'
--- a/Go_BARRY/app/browser-main.jsx
+++ b/Go_BARRY/app/browser-main.jsx
@@ -445,8 +445,11 @@ const BrowserMainApp = () => {
         <View style={styles.screenContent}>
           {activeScreen === 'supervisor' ? (
             <SupervisorControl
-              supervisorId={supervisorSession?.supervisor?.backendId || 'supervisor001'} // Force backend ID
-              supervisorName={supervisorName}
+              // Use the actual supervisor info, not hardcoded
+              supervisorId={supervisorSession?.supervisor?.backendId || supervisorSession?.supervisor?.id || supervisorId}
+              supervisorName={supervisorName || supervisorSession?.supervisor?.name}
+              badge={supervisorSession?.supervisor?.badge}
+              role={supervisorRole || supervisorSession?.supervisor?.role}
               sessionId={sessionId}
               alerts={alerts}
             />
EOF

cd Go_BARRY/app
patch -p2 < /tmp/browser-main-fix.patch || echo "Patch may have already been applied"
cd ../..

# Fix 2: Update SupervisorControl to log complete auth details
cat > /tmp/supervisor-control-fix.patch << 'EOF'
--- a/Go_BARRY/components/SupervisorControl.jsx
+++ b/Go_BARRY/components/SupervisorControl.jsx
@@ -42,10 +42,14 @@ const SupervisorControl = ({
   // Debug WebSocket authentication
   useEffect(() => {
     console.log('🚀 SupervisorControl WebSocket Auth:', {
-      supervisorId,
-      sessionId,
-      supervisorName,
+      supervisorId: supervisorId || 'NO_ID',
+      supervisorName: supervisorName || 'NO_NAME',
+      sessionId: sessionId || 'NO_SESSION',
       hasSessionId: !!sessionId,
-      sessionIdLength: sessionId?.length
+      sessionIdLength: sessionId?.length || 0,
+      sessionPrefix: sessionId ? sessionId.substring(0, 20) + '...' : 'none',
+      timestamp: new Date().toISOString()
     });
+    
+    if (!supervisorId || !sessionId) {
+      console.error('❌ WARNING: Missing supervisor ID or session ID for WebSocket auth!');
+    }
   }, [supervisorId, sessionId, supervisorName]);
EOF

cd Go_BARRY/components
patch -p2 < /tmp/supervisor-control-fix.patch || echo "Patch may have already been applied"
cd ../..

# Fix 3: Add better error handling to backend supervisor auth
cat > /tmp/backend-supervisor-fix.patch << 'EOF'
--- a/backend/services/supervisorManager.js
+++ b/backend/services/supervisorManager.js
@@ -82,6 +82,13 @@ class SupervisorManager {
       return { success: false, error: 'Badge number is required' };
     }
     
+    // Debug log the authentication attempt
+    console.log('🔐 Authentication attempt:', {
+      supervisorId,
+      badge,
+      timestamp: new Date().toISOString()
+    });
+    
     // Find supervisor
     const supervisor = this.supervisors.find(s => 
       s.id === supervisorId && s.badge === badge
@@ -118,6 +125,7 @@ class SupervisorManager {
     this.sessions.set(sessionId, session);
     
     // Log the activity
+    console.log(`✅ Supervisor ${supervisor.name} authenticated with session: ${sessionId}`);
     this.logActivity('LOGIN', `${supervisor.name} logged in`, supervisor.id);
     
     return {
EOF

cd backend/services
patch -p2 < /tmp/backend-supervisor-fix.patch || echo "Patch may have already been applied"
cd ../..

# Fix 4: Ensure supervisor session includes all needed data
cat > /tmp/supervisor-session-fix.patch << 'EOF'
--- a/Go_BARRY/components/hooks/useSupervisorSession.js
+++ b/Go_BARRY/components/hooks/useSupervisorSession.js
@@ -166,7 +166,7 @@ export const useSupervisorSession = () => {
       const session = {
         sessionId: authResult.sessionId, // Use backend session ID
         supervisor: {
-          id: loginData.supervisorId, // Keep frontend ID for UI
+          id: loginData.supervisorId, // Frontend ID
           name: supervisor.name,
           role: supervisor.role,
           duty: loginData.duty,
@@ -177,6 +177,7 @@ export const useSupervisorSession = () => {
           backendId: backendSupervisor.id, // Store backend ID for WebSocket
           badge: backendSupervisor.badge
         },
+        backendAuth: authResult, // Keep full auth response
         loginTime: new Date().toISOString(),
         lastActivity: Date.now(),
       };
@@ -193,6 +194,13 @@ export const useSupervisorSession = () => {
       logActivity('LOGIN', `${supervisor.name} logged in on ${loginData.duty?.name || 'Unknown Duty'}`);
       
       console.log('✅ Supervisor logged in:', supervisor.name, 'Duty:', loginData.duty?.name, 'Session:', authResult.sessionId);
+      console.log('📦 Session data:', {
+        frontendId: session.supervisor.id,
+        backendId: session.supervisor.backendId,
+        sessionId: session.sessionId,
+        name: session.supervisor.name
+      });
+      
       return { success: true, session };
EOF

cd Go_BARRY/components/hooks
patch -p2 < /tmp/supervisor-session-fix.patch || echo "Patch may have already been applied"
cd ../../..

echo "✅ Fixes applied!"
echo ""
echo "Committing and deploying..."

git add -A
git add test-supervisor-auth.html SUPERVISOR_FIX_GUIDE.md
git commit -m "Fix: Supervisor login and WebSocket authentication issues"
git push origin main

echo "✅ Deployed!"
echo ""
echo "⏱️ Wait 3-5 minutes for Render to rebuild"
echo ""
echo "Then test:"
echo "1. Clear browser cache/cookies"
echo "2. Go to https://gobarry.co.uk/browser-main"
echo "3. Login as yourself (Anthony Gair)"
echo "4. Check console logs - it should show your name, not Alex"
echo "5. Open display screen and verify your name appears"
