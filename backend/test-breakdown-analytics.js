#!/usr/bin/env node

// Quick test script for Breakdown Analytics API
// Run this to verify your setup is working

import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Breakdown Analytics API...\n');
  
  try {
    // Test 1: Check if API is accessible
    console.log('1️⃣ Testing API health...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ API is running\n');
    } else {
      console.log('❌ API is not responding\n');
      return;
    }
    
    // Test 2: Check breakdown analytics endpoints
    console.log('2️⃣ Testing breakdown analytics overview...');
    const overviewResponse = await fetch(`${API_BASE}/api/breakdown-analytics/overview`);
    const overviewText = await overviewResponse.text();
    
    let overviewData;
    try {
      overviewData = JSON.parse(overviewText);
    } catch (e) {
      console.log('❌ Overview endpoint not returning JSON');
      console.log('   Response status:', overviewResponse.status);
      console.log('   Response type:', overviewResponse.headers.get('content-type'));
      console.log('   First 100 chars:', overviewText.substring(0, 100));
      console.log('\n   This usually means:');
      console.log('   1. The route is not registered in backend/index.js');
      console.log('   2. The backend is not running');
      console.log('   3. There\'s an error in the route handler\n');
      return;
    }
    
    if (overviewResponse.ok && overviewData.success) {
      console.log('✅ Overview endpoint working');
      console.log(`   Total breakdowns: ${overviewData.data?.totalBreakdowns || 0}`);
      console.log(`   Vehicles affected: ${overviewData.data?.vehiclesAffected || 0}\n`);
    } else {
      console.log('❌ Overview endpoint error:', overviewData.error || 'Unknown error');
      console.log('   This usually means database tables are not created\n');
    }
    
    // Test 3: Try to record a test breakdown
    console.log('3️⃣ Testing breakdown recording...');
    const testBreakdown = {
      fleet_number: '6301',
      depot: 'Washington',
      breakdown_category: 'Test Category',
      specific_issue: 'API Test',
      severity: 'CONTINUE',
      reported_by: 'Test Script',
      source: 'TEST_SCRIPT'
    };
    
    const recordResponse = await fetch(`${API_BASE}/api/breakdown-analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBreakdown)
    });
    
    const recordData = await recordResponse.json();
    
    if (recordResponse.ok && recordData.success) {
      console.log('✅ Breakdown recording working');
      console.log(`   Event ID: ${recordData.eventId}\n`);
    } else {
      console.log('❌ Recording error:', recordData.error || 'Unknown error\n');
    }
    
    // Test 4: Check pattern alerts
    console.log('4️⃣ Testing pattern alerts...');
    const alertsResponse = await fetch(`${API_BASE}/api/breakdown-analytics/pattern-alerts`);
    const alertsData = await alertsResponse.json();
    
    if (alertsResponse.ok && alertsData.success) {
      console.log('✅ Pattern alerts endpoint working');
      console.log(`   Active alerts: ${alertsData.data?.length || 0}\n`);
    } else {
      console.log('❌ Alerts endpoint error:', alertsData.error || 'Unknown error\n');
    }
    
    // Summary
    console.log('📋 SUMMARY:');
    console.log('===========');
    if (overviewResponse.ok && recordResponse.ok && alertsResponse.ok) {
      console.log('✅ All endpoints are working correctly!');
      console.log('\n🎉 Your Breakdown Analytics system is ready to use.');
      console.log('\nNext steps:');
      console.log('1. Import your fleet data');
      console.log('2. Start using GO BARRY to record breakdowns');
      console.log('3. View analytics at: http://localhost:3000/breakdown-analytics');
    } else {
      console.log('⚠️  Some endpoints are not working.');
      console.log('\nTroubleshooting:');
      console.log('1. Check if database tables are created (run setup script)');
      console.log('2. Verify Supabase credentials in .env');
      console.log('3. Check backend logs for errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend is running (npm start)');
    console.log('2. Port 3001 is not blocked');
    console.log('3. Database is accessible');
  }
}

// Run the test
testAPI().catch(console.error);