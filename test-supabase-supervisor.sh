#!/bin/bash
# Test Supabase integration for supervisor management

echo "🧪 Testing Supabase Supervisor Management Integration..."
echo ""

cd backend

echo "📝 Running supervisor authentication test..."
node -e "
import supervisorManager from './services/supervisorManager.js';

// Test authentication
console.log('\\n1️⃣ Testing supervisor authentication...');
const authResult = await supervisorManager.authenticateSupervisor('supervisor003', 'AG003');
if (authResult.success) {
  console.log('✅ Authentication successful:', {
    supervisor: authResult.supervisor.name,
    badge: authResult.supervisor.badge,
    sessionId: authResult.sessionId,
    hasToken: !!authResult.sessionToken
  });
  
  // Test session validation
  console.log('\\n2️⃣ Testing session validation...');
  const validationResult = await supervisorManager.validateSupervisorSession(authResult.sessionId);
  console.log(validationResult.success ? '✅ Session valid' : '❌ Session invalid');
  
  // Test activity logging
  console.log('\\n3️⃣ Testing activity retrieval...');
  const activities = await supervisorManager.getActivityLogs({ limit: 5 });
  console.log('📋 Recent activities:', activities.length);
  activities.forEach(a => {
    console.log('  -', a.action, 'by', a.supervisor_name || 'system', 'at', new Date(a.created_at).toLocaleString());
  });
  
  // Test active supervisors
  console.log('\\n4️⃣ Testing active supervisors...');
  const activeSupervisors = await supervisorManager.getActiveSupervisors();
  console.log('👥 Active supervisors:', activeSupervisors.length);
  activeSupervisors.forEach(s => {
    console.log('  -', s.name, 'since', new Date(s.sessionStart).toLocaleString());
  });
  
  // Sign out
  console.log('\\n5️⃣ Testing sign out...');
  const signOutResult = await supervisorManager.signOutSupervisor(authResult.sessionId);
  console.log(signOutResult.success ? '✅ Sign out successful' : '❌ Sign out failed');
  
} else {
  console.log('❌ Authentication failed:', authResult.error);
}

// Test display screen logging
console.log('\\n6️⃣ Testing display screen activity logging...');
await supervisorManager.logDisplayScreenView(15);
console.log('✅ Display screen view logged');

process.exit(0);
" --input-type=module
