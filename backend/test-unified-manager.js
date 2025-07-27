#!/usr/bin/env node

/*
 * Test the unified roadworks manager directly to see why it's not using fallback data
 */

import unifiedRoadworksManager from './services/unifiedRoadworksManager.js';

async function testUnifiedManager() {
  console.log('🧪 Testing UnifiedRoadworksManager directly...\n');

  try {
    console.log('📊 Testing getStreetManagerRoadworks()...');
    const smResult = await unifiedRoadworksManager.getStreetManagerRoadworks();
    
    console.log('StreetManager Result:');
    console.log(`  Success: ${smResult.success}`);
    console.log(`  Data count: ${smResult.data?.length || 0}`);
    console.log(`  Source: ${smResult.source || 'unknown'}`);
    console.log(`  Error: ${smResult.error || 'none'}`);
    console.log(`  Fallback used: ${smResult.fallbackUsed || false}`);
    
    if (smResult.data?.length > 0) {
      console.log('\n✅ Sample StreetManager records:');
      smResult.data.slice(0, 2).forEach((record, index) => {
        console.log(`${index + 1}. ${record.title}`);
        console.log(`   📍 ${record.location}`);
        console.log(`   🚨 ${record.severity} | ${record.status}`);
      });
    } else {
      console.log('\n❌ No StreetManager data returned');
    }

    console.log('\n📊 Testing getAllRoadworks()...');
    const allResult = await unifiedRoadworksManager.getAllRoadworks();
    
    console.log('All Roadworks Result:');
    console.log(`  Success: ${allResult.success}`);
    console.log(`  Combined count: ${allResult.combined?.length || 0}`);
    console.log(`  StreetManager count: ${allResult.streetManager?.length || 0}`);
    console.log(`  Manual count: ${allResult.manual?.length || 0}`);
    
    if (allResult.metadata?.sources) {
      console.log('\nSource Metadata:');
      Object.entries(allResult.metadata.sources).forEach(([source, info]) => {
        console.log(`  ${source}: success=${info.success}, count=${info.count || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testUnifiedManager().catch(console.error);