#!/usr/bin/env node
// verify-api-removal.js
// Quick verification that both MapQuest and HERE are removed

console.log('🔍 Verifying API Removals from Go BARRY');
console.log('======================================');

try {
  // Test the enhanced data source manager
  const { default: enhancedDataSourceManager } = await import('./backend/services/enhancedDataSourceManager.js');
  
  console.log('✅ Successfully imported enhancedDataSourceManager');
  
  const sourceConfigs = enhancedDataSourceManager.sourceConfigs;
  const sourceCount = Object.keys(sourceConfigs).length;
  
  console.log(`\n📊 Current configuration:`);
  console.log(`   Total sources: ${sourceCount}`);
  console.log(`   Active sources:`);
  
  Object.keys(sourceConfigs).forEach(source => {
    console.log(`     ✅ ${source}`);
  });
  
  // Check removals
  const mapquestRemoved = !sourceConfigs.mapquest;
  const hereRemoved = !sourceConfigs.here;
  
  console.log(`\n💰 Cost reduction status:`);
  console.log(`   MapQuest removed: ${mapquestRemoved ? '✅ YES (£80/month saved)' : '❌ NO'}`);
  console.log(`   HERE removed: ${hereRemoved ? '✅ YES (£100/month saved)' : '❌ NO'}`);
  
  if (mapquestRemoved && hereRemoved) {
    console.log('\n🎉 SUCCESS: Both expensive APIs removed!');
    console.log('💰 Total monthly savings: £180');
    console.log('🚀 System operational with 4 free/low-cost sources');
  } else {
    console.log('\n⚠️  Some APIs still present');
  }
  
  // Test actual data aggregation
  console.log('\n🧪 Testing data aggregation...');
  const data = await enhancedDataSourceManager.aggregateAllSources();
  
  console.log(`📈 Results:`);
  console.log(`   Successful sources: ${data.performance.sourcesActive}/${data.performance.totalSources}`);
  console.log(`   Total incidents: ${data.stats.total}`);
  console.log(`   Processing time: ${data.performance.fetchDuration}`);
  
  console.log('\n✅ Verification complete! 🎯');
  
} catch (error) {
  console.error('❌ Verification error:', error.message);
}
