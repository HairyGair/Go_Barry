// Test specific imports from intelligenceAPINew.js
console.log('Testing imports for intelligenceAPINew.js...');

async function testSpecificImports() {
  const imports = [
    './services/intelligentAnalytics.js',
    './services/predictiveModeling.js',
    './services/serviceFrequencyIntelligence.js',
    './services/historicalTrendAnalysis.js',
    './services/realTimeDisruptionScoring.js'
  ];

  for (const importPath of imports) {
    try {
      console.log(`Testing import: ${importPath}`);
      await import(importPath);
      console.log(`✅ ${importPath} imported successfully`);
    } catch (error) {
      console.log(`❌ ${importPath} failed:`, error.message);
      if (error.message.includes('Invalid or unexpected token')) {
        console.log('FOUND THE SYNTAX ERROR IN:', importPath);
        console.log('Full error:', error);
        break;
      }
    }
  }
}

testSpecificImports();
