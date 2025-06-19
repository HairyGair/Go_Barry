#!/usr/bin/env node
// Test script to verify Render port binding fix

console.log('🧪 Testing Render Port Binding Fix...\n');

const PORT = process.env.PORT || 3001;
console.log(`📍 PORT environment variable: ${PORT}`);

// Test the render-startup.js file
import('./render-startup.js').then(() => {
  console.log('✅ render-startup.js imported successfully');
  
  // Give the server time to start
  setTimeout(() => {
    console.log('\n🔍 Testing server endpoints...');
    
    fetch(`http://localhost:${PORT}/api/health`)
      .then(response => response.json())
      .then(data => {
        console.log('✅ Health endpoint working:', data.status);
        console.log('✅ Port binding test PASSED');
        console.log('\n🎉 Render.com deployment should now work!');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Health endpoint failed:', error.message);
        console.log('🚨 Port binding test FAILED');
        process.exit(1);
      });
  }, 3000);
  
}).catch(error => {
  console.error('❌ Failed to import render-startup.js:', error);
  process.exit(1);
});
