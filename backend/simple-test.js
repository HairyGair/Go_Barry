// simple-test.js
// Simple test to debug the enhanced route matcher
console.log('🔧 Starting simple test...');

try {
  console.log('📦 Testing imports...');
  
  // Test basic import
  import('./enhanced-route-matcher.js')
    .then(module => {
      console.log('✅ Enhanced route matcher imported successfully');
      console.log('📋 Available exports:', Object.keys(module));
      
      // Test initialization
      return module.initializeEnhancedMatcher();
    })
    .then(success => {
      console.log(`📊 Initialization result: ${success ? 'SUCCESS' : 'FAILED'}`);
      
      if (success) {
        console.log('🎯 Enhanced route matcher is working!');
      } else {
        console.log('⚠️ Initialization failed, but import worked');
      }
    })
    .catch(error => {
      console.error('❌ Error during testing:', error.message);
      console.error('📍 Stack trace:', error.stack);
    });
    
} catch (error) {
  console.error('💥 Failed to run test:', error.message);
}
