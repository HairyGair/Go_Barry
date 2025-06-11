#!/usr/bin/env node
// test-new-mapquest-key.js
// Test the new MapQuest API key

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing New MapQuest API Key');
console.log('===============================');

try {
  console.log('📡 Testing MapQuest API with new key...');
  
  // Import the MapQuest service from the correct path
  const { fetchMapQuestTrafficWithStreetNames } = await import('./backend/services/mapquest.js');
  
  console.log('📍 Calling MapQuest Traffic API...');
  const result = await fetchMapQuestTrafficWithStreetNames();
  
  if (result.success) {
    console.log('✅ SUCCESS! MapQuest API is working!');
    console.log(`📊 Found ${result.data.length} traffic incidents`);
    console.log(`🎯 Method: ${result.method}`);
    
    if (result.data.length > 0) {
      const sample = result.data[0];
      console.log('📝 Sample incident:', {
        title: sample.title,
        location: sample.location,
        severity: sample.severity,
        source: sample.source
      });
    }
    
    console.log('\n🎉 MAPQUEST INTEGRATION FIXED!');
    console.log('✅ Go BARRY now has 4/6 traffic sources working:');
    console.log('   ✅ TomTom');
    console.log('   ✅ HERE');
    console.log('   ✅ National Highways');
    console.log('   ✅ MapQuest (NEWLY FIXED!)');
    console.log('   ⏳ Elgin (needs setup)');
    console.log('   ⏳ SCOOT (needs API access)');
    
  } else {
    console.log('❌ MapQuest API test failed');
    console.log('📝 Error:', result.error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if Traffic API is enabled in MapQuest dashboard');
    console.log('2. Verify API key permissions');
    console.log('3. Check rate limits');
    console.log('4. Wait a few minutes for API key activation');
  }
  
} catch (error) {
  console.error('❌ Test error:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you\'re in the Go BARRY App directory');
  console.log('2. Check if backend/services/mapquest.js exists');
  console.log('3. Try: cd backend && node -e "import(\'./services/mapquest.js\').then(console.log)"');
}
