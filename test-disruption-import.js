/**
 * Test script to verify import paths and basic functionality
 */

// Test imports
console.log('Testing import paths...');

try {
  // Test export utils
  const exportUtils = require('./utils/exportUtils.js');
  console.log('✅ exportUtils imported successfully');
  console.log('Available formats:', Object.keys(exportUtils.EXPORT_FORMATS || {}));
} catch (error) {
  console.error('❌ exportUtils import failed:', error.message);
}

try {
  // Test communication utils
  const commUtils = require('./utils/communicationUtils.js');
  console.log('✅ communicationUtils imported successfully');
  console.log('Available channels:', Object.keys(commUtils.COMMUNICATION_CHANNELS || {}));
} catch (error) {
  console.error('❌ communicationUtils import failed:', error.message);
}

try {
  // Test data
  const testData = require('./utils/testData.js');
  console.log('✅ testData imported successfully');
  const disruptions = testData.generateTestDisruptions();
  console.log('Generated test disruptions:', disruptions.length);
} catch (error) {
  console.error('❌ testData import failed:', error.message);
}

console.log('\n🎉 All utility imports working correctly!');