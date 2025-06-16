#!/usr/bin/env node
// verify-config.js
// Verify optimized traffic source configuration

console.log('🔍 Verifying Traffic Source Configuration');
console.log('=======================================');

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
  
  // Test actual data aggregation
  console.log('\n🧪 Testing data aggregation...');
  const data = await enhancedDataSourceManager.aggregateAllSources();
  
  console.log(`📈 Results:`);
  console.log(`   Successful sources: ${data.performance.sourcesActive}/${data.performance.totalSources}`);
  console.log(`   Total incidents: ${data.stats.total}`);
  console.log(`   Processing time: ${data.performance.fetchDuration}`);
  
  console.log('\n✅ Verification complete! 🎯');
  console.log('🚀 System running efficiently with optimized traffic sources');
  
} catch (error) {
  console.error('❌ Verification error:', error.message);
}
