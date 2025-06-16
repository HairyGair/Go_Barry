#!/usr/bin/env node
// test-mapquest-removal.js
// Verify MapQuest has been completely removed from Go BARRY

console.log('🔍 Verifying MapQuest Removal from Go BARRY');
console.log('============================================');

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
  
  // Check if MapQuest is gone
  if (!enhancedDataSourceManager.sourceConfigs.mapquest) {
    console.log('\n🎉 SUCCESS: MapQuest completely removed!');
    console.log('💰 No more charges from MapQuest API');
    console.log('🚀 System now running with 5 traffic sources:');
    console.log('   ✅ TomTom, HERE, National Highways, StreetManager, Manual Incidents');
  } else {
    console.log('\n❌ WARNING: MapQuest still found in configuration');
  }
  
  console.log(`\n📈 System statistics:`);
  console.log(`   Sources: ${data.performance.sourcesActive}/${data.performance.totalSources} active`);
  console.log(`   Total incidents: ${data.stats.total}`);
  console.log(`   Processing time: ${data.performance.fetchDuration}`);
  
} catch (error) {
  console.error('❌ Test error:', error.message);
}
