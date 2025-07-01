#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🩺 Go BARRY Full Diagnostic\n');
console.log('='.repeat(50));

// Check running processes
console.log('\n📋 Checking running processes...');
try {
  const expoProcesses = execSync('ps aux | grep -i expo | grep -v grep', { encoding: 'utf8' });
  console.log('Expo processes found:');
  console.log(expoProcesses);
} catch (e) {
  console.log('No Expo processes found');
}

// Check common ports
console.log('\n🔌 Checking ports...');
const ports = [19006, 19000, 8081, 3000, 3001];

ports.forEach(port => {
  try {
    const result = execSync(`lsof -i :${port} | grep LISTEN`, { encoding: 'utf8' });
    console.log(`✅ Port ${port} is in use:`);
    console.log(result.trim());
  } catch (e) {
    console.log(`❌ Port ${port} is free`);
  }
});

// Check if dist folder exists (production build)
console.log('\n📁 Checking for production builds...');
try {
  const hasDist = execSync('ls -la Go_BARRY/dist 2>/dev/null', { encoding: 'utf8' });
  console.log('⚠️  Found dist folder - might be serving production build');
} catch (e) {
  console.log('✅ No dist folder found');
}

console.log('\n' + '='.repeat(50));
console.log('\n💡 SOLUTION:\n');
console.log('If tests are failing with connection refused:');
console.log('1. Make sure you started the DEV server, not production:');
console.log('   cd Go_BARRY && npm start  (NOT npm run serve)');
console.log('   Press "w" to open in web\n');
console.log('2. Check what port Expo shows in the terminal');
console.log('3. Update tests to use that port:');
console.log('   node scripts/update-test-port.js [PORT]\n');
console.log('4. If still failing, try:');
console.log('   cd Go_BARRY && expo start --web --port 8081');
console.log('   Then: node scripts/update-test-port.js 8081\n');
