#!/usr/bin/env node

console.log('🔧 Go BARRY Test Setup Helper\n');

console.log('This will help you get the tests working.\n');

console.log('STEP 1: Check your Expo terminal');
console.log('================================');
console.log('Look for a line like:');
console.log('  Web is running at http://localhost:XXXX');
console.log('  (where XXXX is the port number)\n');

console.log('STEP 2: Common port numbers');
console.log('===========================');
console.log('  19006 - Default Expo web port');
console.log('  8081  - Common alternative');
console.log('  3000  - If using serve command\n');

console.log('STEP 3: Once you know the port');
console.log('===============================');
console.log('Run this command with your port number:');
console.log('  node scripts/update-test-port.js [PORT]\n');
console.log('Example:');
console.log('  node scripts/update-test-port.js 8081\n');

console.log('STEP 4: Test it works');
console.log('=====================');
console.log('  node scripts/check-services.js\n');

console.log('STEP 5: Run the tests');
console.log('=====================');
console.log('  node scripts/integration-test.js\n');

console.log('💡 TIP: If you\'re not sure, try:');
console.log('  node scripts/find-expo-port.js\n');

// Try to auto-detect
console.log('Attempting auto-detection...\n');
import('./find-expo-port.js').catch(console.error);
