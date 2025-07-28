// Continue testing imports after intelligenceAPINew.js
console.log('Continuing import test after intelligenceAPINew.js...');

async function testRemainingImports() {
  const imports = [
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
    './services/enhancedDataSourceManager.js',
    './routes/displayAPI.js',
    './services/streetManagerWebhooksSimple.js',
    './routes/streetManagerWebhook.js',
    './routes/streetManagerCleanup.js',
    './services/streetManagerScheduler.js',
    './routes/streetManagerActionsAPI.js',
    './routes/streetManagerDiagnostics.js',
    './routes/enhancedStreetManagerAPI.js',
    './routes/enhancedStreetManagerWebhook.js',
    './routes/unifiedRoadworksAPI.js',
    './routes/messageAPI.js',
    './routes/enhancedWorkflowAPI.js',
    './routes/dashboardActivityAPI.js',
    './routes/roadworksV2API.js',
    './routes/disruptionsAPI.js',
    './routes/authRoutes.js',
    './routes/sharePointExcelAPI.js',
    './routes/memoryAPI.js',
    './routes/trafficIntelligenceAPI.js',
    './routes/enhancedRouteAPI.js',
    './routes/flowMonitoringAPI.js',
    './routes/geocoding/coordinateAPI.js',
    './routes/geocodingAPI.js',
    './routes/historicalAPI.js',
    './routes/suggestionsAPI.js'
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

testRemainingImports();
