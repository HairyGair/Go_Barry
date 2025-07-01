#!/usr/bin/env node

console.log('🧪 Quick Test Runner\n');
console.log('Run these commands to debug:\n');

console.log('1️⃣  First, check what\'s on the page:');
console.log('    node scripts/simple-test.js\n');

console.log('2️⃣  Then check the HTML files created:');
console.log('    open homepage-content.html');
console.log('    open operations-centre-content.html\n');

console.log('3️⃣  Try the updated integration test:');
console.log('    node scripts/integration-test-v2.js\n');

console.log('4️⃣  For manual inspection:');
console.log('    node scripts/visual-check.js\n');

console.log('📋 Summary of what we\'re testing:\n');
console.log('Port 8081 ✅ - Services are running here');
console.log('Need to find out:');
console.log('  - What\'s on the homepage?');
console.log('  - Is /operations-centre the right route?');
console.log('  - Does it need authentication?');
console.log('  - What selectors should we use?\n');

console.log('Start with: node scripts/simple-test.js');
