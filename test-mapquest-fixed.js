#!/usr/bin/env node
// test-mapquest-fixed.js
// Test MapQuest API with proper environment loading

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
const envPath = path.join(__dirname, 'backend/.env');
console.log('🔧 Loading environment from:', envPath);
dotenv.config({ path: envPath });

console.log('🧪 Testing MapQuest API Key (Fixed)');
console.log('===================================');

const apiKey = process.env.MAPQUEST_API_KEY;
console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT FOUND'}`);

if (!apiKey) {
  console.error('❌ MAPQUEST_API_KEY not found in backend/.env');
  process.exit(1);
}

try {
  // Import the MapQuest service
  const { fetchMapQuestTrafficWithStreetNames } = await import('./backend/services/mapquest.js');
  
  console.log('\n📡 Testing MapQuest API...');
  const result = await fetchMapQuestTrafficWithStreetNames();
  
  if (result.success) {
    console.log('✅ SUCCESS! MapQuest API is working!');
    console.log(`📊 Found ${result.data.length} traffic incidents`);
    console.log(`🎯 Method: ${result.method}`);
    
    if (result.data.length > 0) {
      const sample = result.data[0];
      console.log('\n📝 Sample incident:', {
        title: sample.title,
        location: sample.location,
        severity: sample.severity,
        source: sample.source,
        coordinates: sample.coordinates
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
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Restart your backend server if running');
    console.log('2. Check Go BARRY dashboard for MapQuest traffic alerts');
    console.log('3. Critical issue RESOLVED! 🎯');
    
  } else {
    console.log('❌ MapQuest API test failed');
    console.log('📝 Error:', result.error);
    
    if (result.error === 'API key missing') {
      console.log('\n🔧 Environment variable issue:');
      console.log('1. Check backend/.env file exists');
      console.log('2. Verify MAPQUEST_API_KEY line in file');
      console.log('3. No quotes around the API key value');
    } else {
      console.log('\n🔧 API issue:');
      console.log('1. API key may need a few minutes to activate');
      console.log('2. Check MapQuest dashboard for Traffic API permissions');
      console.log('3. Verify rate limits');
    }
  }
  
} catch (error) {
  console.error('❌ Test error:', error.message);
  console.log('\n🔧 Import error - check file paths and dependencies');
}
