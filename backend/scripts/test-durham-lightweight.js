#!/usr/bin/env node
// Test Durham lightweight roadworks scraper
// Run: node backend/scripts/test-durham-lightweight.js

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

console.log('🚧 Testing Durham lightweight roadworks scraper...');
console.log('📅 Started at:', new Date().toISOString());
console.log('🌐 Target URL: https://www.durham.gov.uk/roadworks\n');

async function testLightweightScraper() {
  try {
    // Import the lightweight scraper
    const { default: durhamRoadworksLight } = await import('../services/durhamRoadworksLight.js');
    
    const startTime = Date.now();
    
    // Fetch roadworks
    const roadworks = await durhamRoadworksLight.fetchRoadworks();
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Lightweight scraper completed successfully!');
    console.log(`📊 Results: Found ${roadworks.length} active roadworks`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`🔧 Method: axios + cheerio (no browser required)\n`);
    
    if (roadworks.length > 0) {
      console.log('📋 All roadworks found:\n');
      
      roadworks.forEach((rw, index) => {
        console.log(`${index + 1}. ${rw.title}`);
        console.log(`   📍 Location: ${rw.location}`);
        console.log(`   🚦 Severity: ${rw.severity}`);
        console.log(`   📅 Start: ${new Date(rw.startDate).toLocaleDateString()}`);
        console.log(`   📅 End: ${new Date(rw.endDate).toLocaleDateString()}`);
        console.log(`   🚌 Routes: ${rw.affectedRoutes?.join(', ') || 'None identified'}`);
        console.log(`   📝 ${rw.description?.split('\n')[0]}`);
        console.log('');
      });
      
      console.log(`\n💡 Summary:`);
      console.log(`   Total roadworks: ${roadworks.length}`);
      console.log(`   High severity: ${roadworks.filter(r => r.severity === 'high').length}`);
      console.log(`   Medium severity: ${roadworks.filter(r => r.severity === 'medium').length}`);
      console.log(`   Low severity: ${roadworks.filter(r => r.severity === 'low').length}`);
      
    } else {
      console.log('⚠️ No roadworks found');
      console.log('💡 Possible reasons:');
      console.log('   - Durham website structure may have changed');
      console.log('   - No active roadworks currently listed');
      console.log('   - Network/connectivity issues');
    }
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Check Durham website directly: https://www.durham.gov.uk/roadworks');
    console.log('   2. Run debug script: node scripts/debug-durham-website.js');
    console.log('   3. If working, data will appear in Go BARRY alerts');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('📋 Stack trace:', error.stack);
    
    if (error.message.includes('cheerio')) {
      console.error('\n💡 Missing dependency - install cheerio:');
      console.error('   cd backend && npm install cheerio');
    } else if (error.message.includes('Cannot find module')) {
      console.error('\n💡 Module not found - check file paths');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.error('\n💡 Network error - check internet connection');
    }
    
    process.exit(1);
  }
}

// Run the test
testLightweightScraper().then(() => {
  console.log('\n✅ Test completed successfully');
  process.exit(0);
}).catch(err => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});