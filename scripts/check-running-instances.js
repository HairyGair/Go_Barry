#!/usr/bin/env node

console.log('🚀 Checking for Go BARRY instances...\n');

console.log('Common scenarios:\n');

console.log('1. 📱 Expo Development Server');
console.log('   - Started with: cd Go_BARRY && npm start');
console.log('   - Usually runs on: http://localhost:19006');
console.log('   - Check Expo DevTools in browser\n');

console.log('2. 🌐 Production Build Being Served');
console.log('   - Started with: cd Go_BARRY && npm run serve');
console.log('   - Usually runs on: http://localhost:3000');
console.log('   - This is a static build, not dev server\n');

console.log('3. 🔧 Backend API');
console.log('   - Started with: cd backend && npm start');
console.log('   - Usually runs on: http://localhost:3001\n');

console.log('Quick checks:');
console.log('1. Run: lsof -i :19006  (see if port is in use)');
console.log('2. Run: lsof -i :3000   (check alternative port)');
console.log('3. Run: ps aux | grep expo  (find Expo processes)\n');

console.log('If you see "dist" folder being served, tests won\'t work!');
console.log('Tests need the DEVELOPMENT server, not production build.\n');

// Import and run the port finder
import('./find-expo-port.js').catch(() => {
  console.log('Could not run port finder');
});
