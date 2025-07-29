// Simple test to check what's happening with route registration
import fetch from 'node-fetch';

async function testRouteDiagnostic() {
  try {
    console.log('🔍 Testing route diagnostic endpoint...');
    
    const response = await fetch('https://go-barry.onrender.com/api/debug/route-test');
    const data = await response.json();
    
    console.log('📊 Route diagnostic results:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing diagnostic:', error.message);
  }
}

testRouteDiagnostic();