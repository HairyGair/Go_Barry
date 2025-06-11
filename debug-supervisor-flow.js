#!/usr/bin/env node
// Debug script to test supervisor → display flow

import fetch from 'node-fetch';

const API_BASE = 'https://go-barry.onrender.com';

console.log('🔍 Debugging Supervisor → Display Flow\n');

async function testFlow() {
  // Test 1: Backend Health
  console.log('1️⃣ Testing backend health...');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log(`✅ Backend: ${data.status}`);
  } catch (error) {
    console.log(`❌ Backend unreachable: ${error.message}`);
    return;
  }

  // Test 2: WebSocket Sync Status
  console.log('\n2️⃣ Testing WebSocket sync status...');
  try {
    const response = await fetch(`${API_BASE}/api/supervisor/sync-status`);
    const data = await response.json();
    console.log(`✅ WebSocket service: ${data.success ? 'Running' : 'Failed'}`);
    console.log(`📊 Stats:`, data.syncStatus);
  } catch (error) {
    console.log(`❌ WebSocket sync failed: ${error.message}`);
  }

  // Test 3: Active Supervisors
  console.log('\n3️⃣ Testing active supervisors...');
  try {
    const response = await fetch(`${API_BASE}/api/supervisor/active`);
    const data = await response.json();
    console.log(`✅ Active supervisors: ${data.count}`);
    console.log(`👥 Supervisors:`, data.activeSupervisors);
  } catch (error) {
    console.log(`❌ Active supervisors failed: ${error.message}`);
  }

  // Test 4: Alerts Data
  console.log('\n4️⃣ Testing alerts data...');
  try {
    const response = await fetch(`${API_BASE}/api/alerts-enhanced`);
    const data = await response.json();
    console.log(`✅ Alerts: ${data.alerts.length} available`);
    console.log(`📊 Sources working: ${Object.keys(data.metadata.sources).filter(s => data.metadata.sources[s].success).length}/4`);
  } catch (error) {
    console.log(`❌ Alerts failed: ${error.message}`);
  }

  console.log('\n🎯 **DIAGNOSIS:**');
  console.log('If all tests pass, the issue is likely in:');
  console.log('- Frontend WebSocket connection');
  console.log('- Supervisor authentication');
  console.log('- Browser console errors');
  console.log('\nNext: Check browser dev tools Network/Console tabs');
}

testFlow().catch(console.error);
