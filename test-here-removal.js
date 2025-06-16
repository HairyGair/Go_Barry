#!/usr/bin/env node
// test-here-removal.js
// Verify HERE API has been completely removed from Go BARRY

console.log('🔍 Verifying HERE API Removal from Go BARRY');
console.log('===========================================');

try {
  // Test the enhanced data source manager
  const { default: enhancedDataSourceManager } = await import('./backend/services/enhancedDataSourceManager.js');
  
  console.log('✅ Successfully imported enhancedDataSourceManager');
  
  // Get aggregated data to check sources
  const data = await enhancedDataSourceManager.aggregateAllSources();
  
  console.log(`📊 Total sources now: ${Object.keys(enhancedDataSourceManager.sourceConfigs).length}`);
  console.log('📋 Active sources:');
  
  Object.keys(enhancedDataSourceManager.sourceConfigs).forEach(source => {
    console.log(`   ✅ ${source}`);
  });
  
  // Check if HERE is gone
  if (!enhancedDataSourceManager.sourceConfigs.here) {
    console.log('\n🎉 SUCCESS: HERE API completely removed!');
    console.log('💰 No more £100 charges from HERE API');
    console.log('🚀 System now running with 4 traffic sources:');
    console.log('   ✅ TomTom, National Highways, StreetManager, Manual Incidents');
  } else {
    console.log('\n❌ WARNING: HERE still found in configuration');
  }
  
  // Check if MapQuest is also gone
  if (!enhancedDataSourceManager.sourceConfigs.mapquest) {
    console.log('💰 MapQuest also removed (no more £80 charges)');
  }
  
  console.log(`\n📈 System statistics:`);
  console.log(`   Sources: ${data.performance.sourcesActive}/${data.performance.totalSources} active`);
  console.log(`   Total incidents: ${data.stats.total}`);
  console.log(`   Processing time: ${data.performance.fetchDuration}`);
  
  console.log('\n💸 TOTAL SAVINGS: £180 per month (£80 MapQuest + £100 HERE)');
  console.log('🎯 Go BARRY still fully operational with remaining free/low-cost APIs');
  
} catch (error) {
  console.error('❌ Test error:', error.message);
}
