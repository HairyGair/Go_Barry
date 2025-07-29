// Test route imports individually to identify problematic files

console.log('🧪 Testing individual route imports...\n');

const routesToTest = [
  './routes/health.js',
  './routes/memoryAPI.js', 
  './routes/supervisorAPI.js',
  './routes/adminAPI.js',
  './routes/incidentAPI.js',
  './routes/incidentAlertsAPI.js',
  './routes/roadworksAPI.js',
  './routes/roadworksUnifiedSimple.js'
];

async function testRouteImport(routePath) {
  try {
    console.log(`Testing: ${routePath}`);
    const module = await import(routePath);
    const hasDefault = !!module.default;
    const hasRouter = !!module.router;
    console.log(`✅ ${routePath} - Default: ${hasDefault}, Router: ${hasRouter}`);
    return { success: true, routePath, hasDefault, hasRouter };
  } catch (error) {
    console.log(`❌ ${routePath} - ERROR: ${error.message}`);
    return { success: false, routePath, error: error.message };
  }
}

async function testAllRoutes() {
  console.log('Testing route imports individually...\n');
  
  const results = [];
  for (const route of routesToTest) {
    const result = await testRouteImport(route);
    results.push(result);
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📊 SUMMARY:');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful imports: ${successful.length}`);
  console.log(`❌ Failed imports: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n🚨 FAILED IMPORTS:');
    failed.forEach(f => console.log(`  - ${f.routePath}: ${f.error}`));
  }
  
  return results;
}

testAllRoutes().catch(console.error);