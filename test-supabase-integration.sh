#!/bin/bash
# Test script for Supabase integration

echo "🧪 Testing Supabase Integration for Go BARRY"
echo "==========================================="
echo ""

cd backend

# Test 1: Check Supabase connection and tables
echo "1️⃣ Testing Supabase Connection & Tables..."
node -e "
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSupabase() {
  console.log('🔍 Checking tables...');
  
  // Check supervisor_sessions
  const { count: sessionCount, error: sessionError } = await supabase
    .from('supervisor_sessions')
    .select('*', { count: 'exact', head: true });
  
  if (sessionError) {
    console.log('❌ supervisor_sessions table error:', sessionError.message);
  } else {
    console.log('✅ supervisor_sessions table: OK (' + sessionCount + ' records)');
  }
  
  // Check activity_logs
  const { count: activityCount, error: activityError } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true });
    
  if (activityError) {
    console.log('❌ activity_logs table error:', activityError.message);
  } else {
    console.log('✅ activity_logs table: OK (' + activityCount + ' records)');
  }
  
  // Check dismissed_alerts
  const { count: dismissedCount, error: dismissedError } = await supabase
    .from('dismissed_alerts')
    .select('*', { count: 'exact', head: true });
    
  if (dismissedError) {
    console.log('❌ dismissed_alerts table error:', dismissedError.message);
  } else {
    console.log('✅ dismissed_alerts table: OK (' + dismissedCount + ' records)');
  }
}

testSupabase();
" --input-type=module

echo ""
echo "2️⃣ Testing Supervisor Authentication..."
node -e "
import dotenv from 'dotenv';
import supervisorManager from './services/supervisorManager.js';

dotenv.config();

async function testAuth() {
  // Test authentication
  const authResult = await supervisorManager.authenticateSupervisor('supervisor003', 'AG003');
  
  if (authResult.success) {
    console.log('✅ Authentication successful for:', authResult.supervisor.name);
    console.log('   Session ID:', authResult.sessionId);
    console.log('   Is Admin:', authResult.supervisor.isAdmin);
    
    // Test session validation
    const validateResult = await supervisorManager.validateSupervisorSession(authResult.sessionId);
    if (validateResult.success) {
      console.log('✅ Session validation successful');
    } else {
      console.log('❌ Session validation failed:', validateResult.error);
    }
    
    // Test activity logging
    console.log('');
    console.log('3️⃣ Testing Activity Logging...');
    
    // Get recent activity logs
    const logs = await supervisorManager.getActivityLogs({ limit: 5 });
    console.log('📊 Recent activity logs:', logs.length, 'entries found');
    if (logs.length > 0) {
      console.log('   Latest:', logs[0].action, 'at', new Date(logs[0].created_at).toLocaleString());
    }
    
    // Sign out
    await supervisorManager.signOutSupervisor(authResult.sessionId);
    console.log('✅ Signed out successfully');
    
  } else {
    console.log('❌ Authentication failed:', authResult.error);
  }
}

// Add delay to ensure DB is ready
setTimeout(testAuth, 1000);
" --input-type=module

echo ""
echo "Test complete! Check the output above for any issues."
