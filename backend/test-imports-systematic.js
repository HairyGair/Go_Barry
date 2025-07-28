// Test imports one by one to find the syntax error
console.log('Starting import test...');

async function testImports() {
  const imports = [
    './services/tomtom-enhanced.js',
    './routes/adminAPI.js',
    './routes/cleanupAPI.js',
    './services/nationalHighways.js',
    './enhanced-gtfs-route-matcher.js',
    './gtfs-streaming-processor.js',
    './routes/health.js',
    './routes/healthExtended.js',
    './routes/supervisorAPI.js',
    './routes/roadworksAPI.js',
    './routes/roadworkAlertsAPI-simple.js',
    './routes/streetworksAPI.js',
    './routes/gtfsAPI.js',
    './services/gtfsService.js',
    './routes/microsoftAuthAPI.js',
    './routes/intelligenceAPI.js',
    './routes/intelligenceAPINew.js',
    './routes/incidentAPI.js',
    './routes/enhancementAPI.js',
    './routes/frequencyAPI.js',
    './routes/throttleAPI.js',
    './routes/tileAPI.js',
    './routes/eventAPI.js',
    './routes/tomtomUsageAPI.js',
    './routes/activityLogs.js',
    './routes/dutyAPI.js',
    './routes/messagingAPI.js',
    './routes/messageHistoryRoutes.js',
    './routes/analyticsAPI.js',
    './routes/analyticsRoutes.js',
    './routes/communications/index.js',
    './routes/fileManagementAPI.js',
    './routes/startOfServiceAPI.js',
    './routes/locationCorrectionAPI.js',
    './services/supervisorManager.js',
    './services/memoryMonitor.js',
    './services/serviceFrequencyAnalyzer.js',
    './services/supervisorSync.js',
    './services/enhancedDataSourceManager.js'
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
        break;
      }
    }
  }
}

testImports();
