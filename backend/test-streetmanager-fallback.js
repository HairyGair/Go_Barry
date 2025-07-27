#!/usr/bin/env node

/*
 * Test StreetManager fallback data loading
 * Debug why the unified API isn't getting StreetManager data
 */

import { loadStreetManagerFallback } from './services/streetManagerFallback.js';

async function testFallbackLoading() {
  console.log('🧪 Testing StreetManager fallback data loading...\n');

  try {
    console.log('📁 Attempting to load fallback data...');
    const result = await loadStreetManagerFallback();
    
    console.log('📊 Fallback loading result:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Data count: ${result.data?.length || 0}`);
    console.log(`  Source: ${result.source || 'unknown'}`);
    
    if (result.success && result.data?.length > 0) {
      console.log('\n✅ Sample fallback records:');
      result.data.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. ${record.title || record.notification_id}`);
        console.log(`   📍 ${record.location_description}`);
        console.log(`   🚨 ${record.severity} | ${record.status}`);
      });
      
      console.log(`\n🎯 Fallback data is working correctly!`);
      console.log(`📊 Total records available: ${result.data.length}`);
    } else {
      console.log('\n❌ Fallback data loading failed or returned no data');
      console.log(`Error: ${result.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testFallbackLoading().catch(console.error);