// Test ALL imports from index.js systematically
console.log('Testing ALL imports from index.js...\n');

const imports = [
  { name: 'express', path: 'express' },
  { name: 'axios', path: 'axios' },
  { name: 'fs/promises', path: 'fs/promises' },
  { name: 'path', path: 'path' },
  { name: 'url', path: 'url' },
  { name: 'dotenv', path: 'dotenv' },
  { name: 'csv-parse/sync', path: 'csv-parse/sync' },
  { name: 'tomtom-enhanced', path: './services/tomtom-enhanced.js' },
  { name: 'adminAPI', path: './routes/adminAPI.js' },
  { name: 'cleanupAPI', path: './routes/cleanupAPI.js' },
  { name: 'nationalHighways', path: './services/nationalHighways.js' },
  { name: 'enhanced-gtfs-route-matcher', path: './enhanced-gtfs-route-matcher.js' },
  { name: 'gtfs-streaming-processor', path: './gtfs-streaming-processor.js' },
  { name: 'health', path: './routes/health.js' },
  { name: 'healthExtended', path: './routes/healthExtended.js' },
  { name: 'supervisorAPI', path: './routes/supervisorAPI.js' },
  { name: 'roadworksAPI', path: './routes/roadworksAPI.js' },
  { name: 'roadworkAlertsAPI-simple', path: './routes/roadworkAlertsAPI-simple.js' },
  { name: 'streetworksAPI', path: './routes/streetworksAPI.js' },
  { name: 'gtfsAPI', path: './routes/gtfsAPI.js' },
  { name: 'gtfsService', path: './services/gtfsService.js' },
  { name: 'microsoftAuthAPI', path: './routes/microsoftAuthAPI.js' },
  { name: 'intelligenceAPI', path: './routes/intelligenceAPI.js' },
  { name: 'incidentAPI', path: './routes/incidentAPI.js' },
  { name: 'enhancementAPI', path: './routes/enhancementAPI.js' },
  { name: 'frequencyAPI', path: './routes/frequencyAPI.js' },
  { name: 'throttleAPI', path: './routes/throttleAPI.js' },
  { name: 'tileAPI', path: './routes/tileAPI.js' },
  { name: 'eventAPI', path: './routes/eventAPI.js' },
  { name: 'tomtomUsageAPI', path: './routes/tomtomUsageAPI.js' },
  { name: 'activityLogs', path: './routes/activityLogs.js' },
  { name: 'dutyAPI', path: './routes/dutyAPI.js' },
  { name: 'messagingAPI', path: './routes/messagingAPI.js' },
  { name: 'messageHistoryRoutes', path: './routes/messageHistoryRoutes.js' },
  { name: 'analyticsAPI', path: './routes/analyticsAPI.js' },
  { name: 'analyticsRoutes', path: './routes/analyticsRoutes.js' },
  { name: 'communicationsAPI', path: './routes/communications/index.js' },
  { name: 'fileManagementAPI', path: './routes/fileManagementAPI.js' },
  { name: 'startOfServiceAPI', path: './routes/startOfServiceAPI.js' },
  { name: 'locationCorrectionAPI', path: './routes/locationCorrectionAPI.js' },
  { name: 'supervisorManager', path: './services/supervisorManager.js' },
  { name: 'memoryMonitor', path: './services/memoryMonitor.js' },
  { name: 'serviceFrequencyAnalyzer', path: './services/serviceFrequencyAnalyzer.js' },
  { name: 'supervisorSync', path: './services/supervisorSync.js' },
  { name: 'enhancedDataSourceManager', path: './services/enhancedDataSourceManager.js' },
  { name: 'displayAPI', path: './routes/displayAPI.js' },
  { name: 'streetManagerWebhooks', path: './services/streetManagerWebhooksSimple.js' },
  { name: 'streetManagerWebhookRouter', path: './routes/streetManagerWebhook.js' },
  { name: 'streetManagerCleanupRouter', path: './routes/streetManagerCleanup.js' },
  { name: 'streetManagerScheduler', path: './services/streetManagerScheduler.js' },
  { name: 'streetManagerActionsAPI', path: './routes/streetManagerActionsAPI.js' },
  { name: 'streetManagerDiagnostics', path: './routes/streetManagerDiagnostics.js' },
  { name: 'enhancedStreetManagerAPI', path: './routes/enhancedStreetManagerAPI.js' },
  { name: 'enhancedStreetManagerWebhook', path: './routes/enhancedStreetManagerWebhook.js' },
  { name: 'unifiedRoadworksAPI', path: './routes/unifiedRoadworksAPI.js' },
  { name: 'messageAPI', path: './routes/messageAPI.js' },
  { name: 'enhancedWorkflowAPI', path: './routes/enhancedWorkflowAPI.js' },
  { name: 'dashboardActivityAPI', path: './routes/dashboardActivityAPI.js' },
  { name: 'roadworksV2API', path: './routes/roadworksV2API.js' },
  { name: 'disruptionsAPI', path: './routes/disruptionsAPI.js' },
  { name: 'authRoutes', path: './routes/authRoutes.js' },
  { name: 'sharePointExcelAPI', path: './routes/sharePointExcelAPI.js' },
  { name: 'memoryAPI', path: './routes/memoryAPI.js' },
  { name: 'trafficIntelligenceAPI', path: './routes/trafficIntelligenceAPI.js' },
  { name: 'enhancedRouteAPI', path: './routes/enhancedRouteAPI.js' },
  { name: 'flowMonitoringAPI', path: './routes/flowMonitoringAPI.js' },
  { name: 'coordinateAPI', path: './routes/geocoding/coordinateAPI.js' },
  { name: 'geocodingAPI', path: './routes/geocodingAPI.js' },
  { name: 'historicalAPI', path: './routes/historicalAPI.js' },
  { name: 'suggestionsAPI', path: './routes/suggestionsAPI.js' },
  { name: 'alertDeduplication', path: './utils/alertDeduplication.js' },
  { name: 'convexSync', path: './services/convexSync.js' },
  { name: 'startupService', path: './services/startupService.js' },
  { name: '@supabase/supabase-js', path: '@supabase/supabase-js' },
  { name: 'realTimeDisruptionScoring', path: './services/realTimeDisruptionScoring.js' },
  { name: 'busLocationService', path: './services/busLocationService.js' },
  { name: 'busUpdateLoop', path: './services/busUpdateLoop.js' },
  { name: 'gtfsRouteShapesService', path: './services/gtfsRouteShapesService.js' },
  { name: 'busLocationsAPI', path: './routes/busLocationsAPI.js' },
  { name: 'flowMonitor', path: './services/flowMonitor.js' }
];

const problematicImports = [];
let lastSuccessful = null;

async function testImports() {
  for (const imp of imports) {
    try {
      process.stdout.write(`Testing ${imp.name}...`);
      await import(imp.path);
      console.log(' ✅');
      lastSuccessful = imp.name;
    } catch (error) {
      console.log(` ❌`);
      console.log(`  Error: ${error.message}`);
      if (error.message.includes('Invalid or unexpected token')) {
        problematicImports.push(imp);
        console.log(`  🎯 SYNTAX ERROR FOUND IN: ${imp.path}`);
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Last successful import: ${lastSuccessful}`);
  console.log(`\nProblematic imports with syntax errors:`);
  problematicImports.forEach(imp => {
    console.log(`  ❌ ${imp.name} (${imp.path})`);
  });
}

testImports();
