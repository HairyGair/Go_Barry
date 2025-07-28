// Test connectivity to various services
import { getFetch } from '../utils/fetchHelper.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function testConnectivity() {
  console.log('\n🧪 Running connectivity tests...\n');
  
  const fetch = await getFetch();
  const tests = [
    {
      name: 'GitHub API',
      url: 'https://api.github.com',
      headers: { 'User-Agent': 'Go-BARRY-Backend' }
    },
    {
      name: 'Google',
      url: 'https://www.google.com',
      headers: {}
    },
    {
      name: 'Supabase Root',
      url: process.env.SUPABASE_URL,
      headers: {}
    },
    {
      name: 'Supabase API',
      url: `${process.env.SUPABASE_URL}/rest/v1/`,
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`📡 Testing ${test.name}: ${test.url}`);
      const startTime = Date.now();
      
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers,
        timeout: 10000
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText} (${duration}ms)`);
      
    } catch (error) {
      console.error(`❌ ${test.name} failed: ${error.message}`);
      if (error.code) {
        console.error(`   Error code: ${error.code}`);
      }
      if (error.cause) {
        console.error(`   Error cause:`, error.cause);
      }
    }
  }
  
  console.log('\n🧪 Connectivity tests complete\n');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnectivity().catch(console.error);
}
