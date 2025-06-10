// wake-up-backend.js
// Force wake up the sleeping backend

console.log('😴 WAKING UP BACKEND...');
console.log('=====================');

const https = require('https');

function wakeUpCall(attempt = 1) {
  console.log(`📞 Wake-up call #${attempt}...`);
  
  const req = https.get('https://go-barry.onrender.com/api/health', {
    timeout: 60000 // 60 second timeout for cold start
  }, (res) => {
    console.log(`✅ Backend awake! Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('📄 Response received');
      console.log('🎉 Backend is now awake and ready!');
      console.log('');
      console.log('🔄 Now run: node quick-test-data-feeds.js');
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.log(`❌ Wake-up attempt ${attempt} failed: ${error.message}`);
    
    if (attempt < 3) {
      console.log(`⏳ Waiting 10 seconds before retry...`);
      setTimeout(() => wakeUpCall(attempt + 1), 10000);
    } else {
      console.log('💔 Backend not responding after 3 attempts');
      process.exit(1);
    }
  });
  
  req.on('timeout', () => {
    console.log(`⏰ Wake-up attempt ${attempt} timed out`);
    req.destroy();
    
    if (attempt < 3) {
      console.log(`⏳ Waiting 10 seconds before retry...`);
      setTimeout(() => wakeUpCall(attempt + 1), 10000);
    } else {
      console.log('💔 Backend not responding after 3 attempts');
      process.exit(1);
    }
  });
}

// Start wake-up process
wakeUpCall();

// Ultimate timeout
setTimeout(() => {
  console.log('💀 Ultimate timeout - backend appears to be down');
  console.log('🔧 Try visiting https://go-barry.onrender.com/api/health in browser');
  process.exit(1);
}, 180000); // 3 minutes total
