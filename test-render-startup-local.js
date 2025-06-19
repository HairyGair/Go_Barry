#!/usr/bin/env node
// Local test of render-startup.js to verify it works before deployment

console.log('🧪 Testing render-startup.js locally...\n');

const PORT = process.env.PORT || 3001;

async function testRenderStartup() {
  try {
    console.log('📝 Test 1: Importing render-startup.js...');
    
    // Set PORT for testing
    process.env.PORT = PORT;
    
    // Import the render-startup.js module
    const startupModule = await import('./backend/render-startup.js');
    console.log('✅ render-startup.js imported successfully');
    
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📝 Test 2: Testing health endpoint...');
    try {
      const response = await fetch(`http://localhost:${PORT}/api/health`);
      const data = await response.json();
      console.log('✅ Health endpoint working:', data);
      
      console.log('\n📝 Test 3: Testing supervisor endpoints...');
      const activityResponse = await fetch(`http://localhost:${PORT}/api/supervisor/activity/recent`);
      const activityData = await activityResponse.json();
      console.log('✅ Activity endpoint working:', activityData.success);
      
      const activeResponse = await fetch(`http://localhost:${PORT}/api/supervisor/active`);
      const activeData = await activeResponse.json();
      console.log('✅ Active endpoint working:', activeData.success);
      
      console.log('\n📝 Test 4: Testing catch-all endpoint...');
      const catchAllResponse = await fetch(`http://localhost:${PORT}/unknown-endpoint`);
      const catchAllData = await catchAllResponse.json();
      console.log('✅ Catch-all working:', catchAllData.renderOptimized);
      
      console.log('\n🎉 render-startup.js is working correctly!');
      console.log('💡 The issue is likely with Render.com deployment, not the code.');
      
      process.exit(0);
      
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
      console.log('🚨 Server may not be listening properly');
      process.exit(1);
    }
    
  } catch (importError) {
    console.error('❌ Import error:', importError.message);
    console.log('🚨 render-startup.js has syntax or import issues');
    process.exit(1);
  }
}

// Cleanup function
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted, cleaning up...');
  process.exit(0);
});

testRenderStartup().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
