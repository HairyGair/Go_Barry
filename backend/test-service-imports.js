// Test each service import individually
async function testServiceImports() {
  const services = [
    '../services/intelligentAnalytics.js',
    '../services/predictiveModeling.js', 
    '../services/serviceFrequencyIntelligence.js',
    '../services/historicalTrendAnalysis.js',
    '../services/realTimeDisruptionScoring.js'
  ];

  for (const service of services) {
    try {
      console.log(`Testing: ${service}`);
      await import(service);
      console.log(`✅ ${service} imported successfully`);
    } catch (error) {
      console.log(`❌ ${service} failed:`, error.message);
      if (error.stack) {
        const match = error.stack.match(/:(\d+):(\d+)/);
        if (match) {
          console.log(`   Error at line ${match[1]}, column ${match[2]}`);
        }
      }
    }
  }
}

testServiceImports();
