// Simple connectivity test
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Running connectivity tests...\n');

// Test 1: Basic HTTPS
console.log('📡 Test 1: Basic HTTPS to Google...');
https.get('https://www.google.com', (res) => {
  console.log(`✅ Google: ${res.statusCode} ${res.statusMessage}`);
}).on('error', (err) => {
  console.error('❌ Google failed:', err.message);
});

// Test 2: GitHub API
console.log('\n📡 Test 2: GitHub API...');
https.get('https://api.github.com', {
  headers: { 'User-Agent': 'Go-BARRY' }
}, (res) => {
  console.log(`✅ GitHub: ${res.statusCode} ${res.statusMessage}`);
}).on('error', (err) => {
  console.error('❌ GitHub failed:', err.message);
});

// Test 3: Supabase
const supabaseUrl = process.env.SUPABASE_URL;
console.log(`\n📡 Test 3: Supabase (${supabaseUrl})...`);

if (supabaseUrl) {
  const url = new URL(supabaseUrl);
  https.get({
    hostname: url.hostname,
    path: '/rest/v1/',
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY || 'no-key',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'no-key'}`
    }
  }, (res) => {
    console.log(`✅ Supabase: ${res.statusCode} ${res.statusMessage}`);
    
    // Read response body
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (data) {
        console.log('📄 Response preview:', data.substring(0, 200));
      }
    });
  }).on('error', (err) => {
    console.error('❌ Supabase failed:', err.message);
    console.error('❌ Error code:', err.code);
    if (err.code === 'ENOTFOUND') {
      console.error('❌ This means the domain cannot be resolved (DNS issue)');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('❌ This means the connection was refused by the server');
    } else if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('❌ This is an SSL certificate issue');
    }
  });
} else {
  console.error('❌ SUPABASE_URL not set in environment');
}

// Test 4: Using node-fetch
console.log('\n📡 Test 4: Testing node-fetch...');
import('node-fetch').then(async (module) => {
  const fetch = module.default;
  try {
    const response = await fetch('https://api.github.com', {
      headers: { 'User-Agent': 'Go-BARRY' }
    });
    console.log(`✅ node-fetch works: ${response.status} ${response.statusText}`);
  } catch (err) {
    console.error('❌ node-fetch failed:', err.message);
  }
}).catch(err => {
  console.error('❌ Could not load node-fetch:', err.message);
});

// Keep process alive for async operations
setTimeout(() => {
  console.log('\n✅ Tests complete');
  process.exit(0);
}, 5000);
