#!/usr/bin/env node

console.log('🔍 Go BARRY Port Detective\n');
console.log('Please answer these questions:\n');

console.log('1. In your Expo terminal (where you ran npm start), what URL is shown?');
console.log('   (Look for "Web is running at http://localhost:XXXX")\n');

console.log('2. In your browser, which of these URLs shows your app?');
console.log('   - http://localhost:19006');
console.log('   - http://localhost:19000'); 
console.log('   - http://localhost:8081');
console.log('   - http://localhost:3000\n');

console.log('3. Can you access the Operations Centre at any of these?');
console.log('   - http://localhost:19006/operations-centre');
console.log('   - http://localhost:8081/operations-centre\n');

console.log('Once you know the port, run:');
console.log('  node scripts/update-test-port.js [PORT]\n');

console.log('For example, if Expo is on port 8081:');
console.log('  node scripts/update-test-port.js 8081\n');

// Also run the port finder
import('./find-expo-port.js');
