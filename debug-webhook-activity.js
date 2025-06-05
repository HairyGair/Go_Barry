#!/usr/bin/env node
// Debug Street Manager webhook activity

// Using built-in fetch (Node.js 18+)

const BACKEND_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const PRODUCTION_URL = 'https://go-barry.onrender.com';

async function debugWebhookActivity() {
  console.log('🔍 Debugging Street Manager Webhook Activity...\n');
  
  try {
    // Check local backend first
    console.log('📊 Checking local backend webhook status...');
    try {
      const localResponse = await fetch(`${BACKEND_URL}/api/streetmanager/status`);
      const localData = await localResponse.json();
      
      console.log('Local Storage:', localData.status?.storage || 'No storage info');
      console.log('Last received:', localData.status?.lastReceived || 'Never');
      console.log('');
    } catch (error) {
      console.log('Local backend not running on port 3001');
      console.log('');
    }
    
    // Check production webhook
    console.log('🌐 Testing production webhook...');
    try {
      const prodResponse = await fetch(`${PRODUCTION_URL}/api/streetmanager/status`);
      const prodData = await prodResponse.json();
      
      console.log('Production Storage:', prodData.status?.storage || 'No storage info');
      console.log('Production Method:', prodData.status?.method || 'Unknown');
      console.log('');
    } catch (error) {
      console.log('❌ Production webhook not accessible:', error.message);
      console.log('');
    }
    
    // Test webhook endpoint directly
    console.log('🧪 Testing webhook endpoint with sample data...');
    try {
      const testPayload = {
        Type: 'Notification',
        Message: JSON.stringify({
          event_type: 'DEBUG_TEST',
          object_type: 'TEST',
          object_reference: 'DEBUG_001',
          timestamp: new Date().toISOString()
        })
      };
      
      const testResponse = await fetch(`${PRODUCTION_URL}/api/streetmanager/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Debug-Script'
        },
        body: JSON.stringify(testPayload)
      });
      
      const testResult = await testResponse.json();
      console.log('Webhook test result:', testResult);
      console.log('');
    } catch (error) {
      console.log('❌ Webhook test failed:', error.message);
      console.log('');
    }
    
    // Check for recent activities after test
    console.log('🔄 Checking for data after webhook test...');
    try {
      const finalResponse = await fetch(`${PRODUCTION_URL}/api/streetmanager/activities`);
      const finalData = await finalResponse.json();
      
      console.log('Total activities after test:', finalData.activities?.length || 0);
      if (finalData.activities?.length > 0) {
        console.log('Most recent activity:', finalData.activities[finalData.activities.length - 1]);
      }
    } catch (error) {
      console.log('❌ Could not check final activities:', error.message);
    }
    
    console.log('\n📋 DEBUGGING CHECKLIST:');
    console.log('1. ✅ Check if production webhook responds to HTTP requests');
    console.log('2. ✅ Verify webhook can process AWS SNS format');
    console.log('3. ❓ Confirm DFT registration includes your exact webhook URL');
    console.log('4. ❓ Verify geographic coverage includes North East England');
    console.log('5. ❓ Check if there are active roadworks in your coverage area');
    
    console.log('\n💡 Common issues:');
    console.log('- DFT registration pending approval');
    console.log('- Webhook URL mismatch in registration');
    console.log('- AWS SNS subscription not confirmed');
    console.log('- No current roadworks in North East England');
    console.log('- Geographic coverage not approved for your area');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

debugWebhookActivity();
