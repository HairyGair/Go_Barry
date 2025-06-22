// Debug script to check why alerts aren't coming through
import dotenv from 'dotenv';
import { fetchTomTomTrafficWithStreetNames } from './services/tomtom.js';
import { fetchNationalHighways } from './services/nationalHighways.js';
import { convexSync } from './services/convexSync.js';

dotenv.config();

console.log('🔍 GO BARRY ALERT SYSTEM DEBUGGER\n');

async function debugAlertSystem() {
  // 1. Check environment variables
  console.log('1️⃣ CHECKING ENVIRONMENT VARIABLES:');
  console.log('   TOMTOM_API_KEY:', process.env.TOMTOM_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   NATIONAL_HIGHWAYS_API_KEY:', process.env.NATIONAL_HIGHWAYS_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   CONVEX_URL:', process.env.CONVEX_URL ? '✅ Set' : '❌ Missing');
  console.log('   PORT:', process.env.PORT || '3001');
  console.log('');

  // 2. Test TomTom API directly
  console.log('2️⃣ TESTING TOMTOM API:');
  try {
    const tomtomResult = await fetchTomTomTrafficWithStreetNames();
    console.log('   Status:', tomtomResult.success ? '✅ Success' : '❌ Failed');
    console.log('   Alerts found:', tomtomResult.data?.length || 0);
    if (tomtomResult.error) {
      console.log('   Error:', tomtomResult.error);
    }
    if (tomtomResult.data && tomtomResult.data.length > 0) {
      console.log('   Sample alert:', {
        title: tomtomResult.data[0].title,
        location: tomtomResult.data[0].location,
        severity: tomtomResult.data[0].severity,
        coordinates: tomtomResult.data[0].coordinates
      });
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');

  // 3. Test National Highways API
  console.log('3️⃣ TESTING NATIONAL HIGHWAYS API:');
  try {
    const nhResult = await fetchNationalHighways();
    console.log('   Status:', nhResult.success ? '✅ Success' : '❌ Failed');
    console.log('   Alerts found:', nhResult.data?.length || 0);
    if (nhResult.error) {
      console.log('   Error:', nhResult.error);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');

  // 4. Test backend API endpoint
  console.log('4️⃣ TESTING BACKEND API ENDPOINT:');
  try {
    const response = await fetch('http://localhost:3001/api/alerts-enhanced');
    const data = await response.json();
    console.log('   Status:', data.success ? '✅ Success' : '❌ Failed');
    console.log('   Total alerts:', data.alerts?.length || 0);
    console.log('   Sources:', data.metadata?.sources || {});
    
    // Check categorization
    if (data.alerts && data.alerts.length > 0) {
      const roadworks = data.alerts.filter(a => a.isRoadwork);
      const incidents = data.alerts.filter(a => a.isIncident);
      console.log('   Roadworks:', roadworks.length);
      console.log('   Incidents:', incidents.length);
    }
  } catch (error) {
    console.log('   ❌ Error connecting to backend:', error.message);
    console.log('   Is the backend running on port 3001?');
  }
  console.log('');

  // 5. Test Convex connection
  console.log('5️⃣ TESTING CONVEX CONNECTION:');
  try {
    const testResult = await convexSync.testConnection();
    console.log('   Status:', testResult.success ? '✅ Connected' : '❌ Failed');
    if (testResult.error) {
      console.log('   Error:', testResult.error);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log('');

  // 6. Test specific endpoints
  console.log('6️⃣ TESTING SPECIFIC ENDPOINTS:');
  const endpoints = [
    'http://localhost:3001/api/roadworks-alerts',
    'http://localhost:3001/api/incident-alerts',
    'http://localhost:3001/api/health-extended'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      const path = endpoint.split('/').pop();
      console.log(`   ${path}:`, data.success ? `✅ (${data.roadworks?.length || data.incidents?.length || 0} items)` : '❌');
    } catch (error) {
      console.log(`   ${endpoint.split('/').pop()}: ❌ ${error.message}`);
    }
  }
}

debugAlertSystem().catch(console.error);
