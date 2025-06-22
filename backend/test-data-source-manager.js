// Test the enhanced data source manager
import enhancedDataSourceManager from './services/enhancedDataSourceManager.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDataSourceManager() {
  console.log('🚀 Testing Enhanced Data Source Manager...\n');
  
  try {
    // Clear cache first
    console.log('🧹 Clearing cache...');
    enhancedDataSourceManager.clearCache();
    
    // Test aggregation
    console.log('\n📊 Aggregating all sources...');
    const startTime = Date.now();
    const result = await enhancedDataSourceManager.aggregateAllSources();
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Aggregation completed in ${duration}ms`);
    console.log('\nResults:');
    console.log(`- Total incidents: ${result.incidents?.length || 0}`);
    console.log(`- Sources: ${result.sources?.join(', ') || 'None'}`);
    console.log(`- Confidence: ${result.confidence || 0}`);
    
    if (result.sourceStats) {
      console.log('\nSource breakdown:');
      Object.entries(result.sourceStats).forEach(([source, stats]) => {
        console.log(`\n${source}:`);
        console.log(`  - Success: ${stats.success}`);
        console.log(`  - Count: ${stats.count || 0}`);
        console.log(`  - Method: ${stats.method || 'N/A'}`);
        if (stats.error) {
          console.log(`  - Error: ${stats.error}`);
        }
      });
    }
    
    if (result.incidents && result.incidents.length > 0) {
      console.log('\n📍 Sample incidents:');
      result.incidents.slice(0, 5).forEach((incident, i) => {
        console.log(`\n${i + 1}. ${incident.title || 'No title'}`);
        console.log(`   - ID: ${incident.id}`);
        console.log(`   - Location: ${incident.location || 'Unknown'}`);
        console.log(`   - Source: ${incident.source}`);
        console.log(`   - Severity: ${incident.severity || 'Unknown'}`);
        console.log(`   - Routes: ${incident.affectsRoutes?.join(', ') || 'None'}`);
        console.log(`   - Enhanced: ${incident.enhanced ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('\n⚠️ No incidents found!');
    }
    
    // Check statistics
    if (result.stats) {
      console.log('\n📈 Statistics:');
      console.log(`- Total: ${result.stats.total}`);
      console.log(`- Enhanced: ${result.stats.enhanced}`);
      console.log(`- High Priority: ${result.stats.highPriority}`);
      console.log(`- With Routes: ${result.stats.withRoutes}`);
      console.log(`- With Coordinates: ${result.stats.withCoordinates}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing data source manager:', error);
    console.error(error.stack);
  }
}

// Run the test
testDataSourceManager().catch(console.error);
