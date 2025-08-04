// Test script to diagnose the 404 error
// Run this in your browser console while on the roadworks page

console.log('🔍 Diagnosing Roadworks Fetch Issue...\n');

// Check environment
console.log('📋 Environment Check:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  Current URL:', window.location.href);
console.log('  Origin:', window.location.origin);
console.log('');

// Test different URL constructions
console.log('🌐 URL Construction Tests:');
const baseUrl1 = process.env.NODE_ENV === 'development' ? '' : 'https://go-barry.onrender.com';
const url1 = `${baseUrl1}/api/roadworks/unified?days=90`;
console.log('  Method 1 (current):', url1);

const baseUrl2 = '';
const url2 = `${baseUrl2}/api/roadworks/unified?days=90`;
console.log('  Method 2 (empty base):', url2);

const url3 = '/api/roadworks/unified?days=90';
console.log('  Method 3 (direct path):', url3);

const url4 = 'https://go-barry.onrender.com/api/roadworks/unified?days=90';
console.log('  Method 4 (absolute):', url4);
console.log('');

// Test fetch with each URL
console.log('🧪 Testing Fetch Calls:');

// Test 1: Current method
fetch(url1, { method: 'HEAD' })
  .then(res => console.log(`  ✅ Method 1 (${url1}): Status ${res.status}`))
  .catch(err => console.error(`  ❌ Method 1 (${url1}): ${err.message}`));

// Test 2: Empty base
fetch(url2, { method: 'HEAD' })
  .then(res => console.log(`  ✅ Method 2 (${url2}): Status ${res.status}`))
  .catch(err => console.error(`  ❌ Method 2 (${url2}): ${err.message}`));

// Test 3: Direct path
fetch(url3, { method: 'HEAD' })
  .then(res => console.log(`  ✅ Method 3 (${url3}): Status ${res.status}`))
  .catch(err => console.error(`  ❌ Method 3 (${url3}): ${err.message}`));

// Test 4: Absolute URL
fetch(url4, { method: 'HEAD' })
  .then(res => console.log(`  ✅ Method 4 (${url4}): Status ${res.status}`))
  .catch(err => console.error(`  ❌ Method 4 (${url4}): ${err.message}`));

console.log('\n💡 Check the results above to see which URL format works');
console.log('💡 The error showing just "unified" suggests URL truncation');
console.log('💡 Use Method 4 (absolute URL) as a quick fix');
