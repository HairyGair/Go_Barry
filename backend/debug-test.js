// debug-test.js
// Debug version of the test to see what's happening

console.log('🔧 Starting Debug Test...');

async function runDebugTest() {
  try {
    console.log('Step 1: Loading modules...');
    
    // Test dotenv
    const dotenv = await import('dotenv');
    dotenv.config();
    console.log('✅ dotenv loaded');
    
    // Test MapQuest auth
    console.log('Step 2: Testing MapQuest authentication...');
    try {
      const { testMapQuestAuthentication } = await import('./test-mapquest-auth.js');
      console.log('✅ MapQuest test module loaded');
      
      const mapquestResult = await testMapQuestAuthentication();
      console.log(`📊 MapQuest result: ${mapquestResult}`);
    } catch (mapquestError) {
      console.log('❌ MapQuest test failed:', mapquestError.message);
    }
    
    // Test enhanced route matcher
    console.log('Step 3: Testing enhanced route matcher...');
    try {
      const routeMatcher = await import('./enhanced-route-matcher.js');
      console.log('✅ Route matcher module loaded');
      
      const initResult = await routeMatcher.initializeEnhancedMatcher();
      console.log(`📊 Route matcher init: ${initResult}`);
      
      if (initResult) {
        const stats = routeMatcher.getEnhancedMatcherStats();
        console.log('📊 Route matcher stats:', stats);
        
        // Test a simple route match
        const testRoutes = await routeMatcher.findRoutesEnhanced(54.9783, -1.6178, 'Newcastle');
        console.log(`📍 Test routes for Newcastle: [${testRoutes.join(', ')}]`);
      }
    } catch (routeError) {
      console.log('❌ Route matcher test failed:', routeError.message);
    }
    
    // Test mobile components
    console.log('Step 4: Testing mobile components...');
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const mobileDir = path.join(process.cwd(), '..', 'Go_BARRY', 'components', 'mobile');
      console.log(`📁 Checking: ${mobileDir}`);
      
      await fs.access(mobileDir);
      const files = await fs.readdir(mobileDir);
      console.log(`✅ Mobile components found: ${files.join(', ')}`);
    } catch (mobileError) {
      console.log('❌ Mobile components check failed:', mobileError.message);
    }
    
    console.log('✅ Debug test completed successfully!');
    
  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
    console.error('📍 Stack:', error.stack);
  }
}

// Run the debug test
runDebugTest()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Crash:', error);
    process.exit(1);
  });
