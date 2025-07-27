#!/usr/bin/env node

/*
 * Comprehensive diagnostic test for future works functionality
 * Tests the entire chain from frontend request to backend response
 * Run: node test-future-works-diagnostic.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://go-barry.onrender.com';

async function runDiagnostics() {
  console.log('🔍 Go BARRY Future Works Diagnostic Suite');
  console.log('=========================================\n');

  const tests = [
    {
      name: 'Backend Health Check',
      url: `${BASE_URL}/api/health`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 5000 });
        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.text() : 'Failed'
        };
      }
    },
    {
      name: 'Unified Roadworks API - All Sources',
      url: `${BASE_URL}/api/roadworks/unified`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 10000 });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          success: data.success,
          totalRoadworks: data.roadworks?.length || 0,
          sources: data.metadata?.sources || {},
          totalCount: data.metadata?.totalCount || 0
        };
      }
    },
    {
      name: 'Unified Roadworks API - StreetManager Only',
      url: `${BASE_URL}/api/roadworks/unified?source=streetmanager&limit=1000`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 10000 });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          success: data.success,
          streetManagerRoadworks: data.roadworks?.length || 0,
          sourceFilter: 'streetmanager',
          hasMetadata: !!data.metadata,
          filters: data.metadata?.filters || {}
        };
      }
    },
    {
      name: 'StreetManager Summary',
      url: `${BASE_URL}/api/streetmanager/summary`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 10000 });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          success: data.success,
          total: data.summary?.total || 0,
          last24Hours: data.summary?.last24Hours || 0,
          lastUpdated: data.summary?.lastUpdated || 'Unknown'
        };
      }
    },
    {
      name: 'StreetManager Active Today',
      url: `${BASE_URL}/api/streetmanager/active-today`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 10000 });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          success: data.success,
          activeToday: data.roadworks?.length || 0,
          error: data.error || null
        };
      }
    },
    {
      name: 'Database Connection Test',
      url: `${BASE_URL}/api/streetmanager/test-supabase`,
      test: async (url) => {
        const response = await fetch(url, { timeout: 10000 });
        const data = await response.json();
        return {
          status: response.status,
          ok: response.ok,
          success: data.success,
          tablesChecked: data.tables || {},
          error: data.error || null
        };
      }
    }
  ];

  const results = [];
  
  for (const test of tests) {
    console.log(`🧪 Running: ${test.name}`);
    console.log(`📡 URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      const result = await test.test(test.url);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Status: ${result.status} (${duration}ms)`);
      console.log(`📊 Result:`, JSON.stringify(result, null, 2));
      
      results.push({
        name: test.name,
        success: result.ok,
        duration,
        result
      });
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        error: error.message
      });
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('====================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Overall: ${passed}/${total} tests passed\n`);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${index + 1}. ${result.name}: ${status}${duration}${error}`);
  });

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  const failedTests = results.filter(r => !r.success);
  
  if (failedTests.length === 0) {
    console.log('✅ All tests passed! The issue may be intermittent or environment-specific.');
    console.log('🔍 Check browser network tab for CORS issues or local connectivity problems.');
  } else {
    console.log('❌ Failed tests detected:');
    failedTests.forEach(test => {
      console.log(`  - ${test.name}: ${test.error || 'Unknown error'}`);
    });
    
    if (failedTests.some(t => t.name.includes('Health'))) {
      console.log('\n🚨 Backend is not responding. Check Render deployment status.');
    }
    
    if (failedTests.some(t => t.name.includes('Database'))) {
      console.log('\n🗄️ Database connection issues detected. Check Supabase credentials.');
    }
    
    if (failedTests.some(t => t.name.includes('StreetManager'))) {
      console.log('\n📡 StreetManager data issues. Check webhook configuration.');
    }
  }

  // Check for empty data scenario
  const streetManagerTest = results.find(r => r.name.includes('StreetManager Only'));
  if (streetManagerTest && streetManagerTest.success) {
    const roadworksCount = streetManagerTest.result.streetManagerRoadworks;
    if (roadworksCount === 0) {
      console.log('\n📊 EMPTY DATA DIAGNOSIS');
      console.log('=======================');
      console.log('StreetManager data is empty (0 roadworks).');
      console.log('This could be because:');
      console.log('1. No webhook data has been received yet');
      console.log('2. All current roadworks have expired');
      console.log('3. Data is being stored in a different table');
      console.log('4. Webhook endpoint is not properly configured');
      console.log('\n🔧 Suggested actions:');
      console.log('- Check StreetManager webhook configuration');
      console.log('- Verify data is being written to the streetworks table');
      console.log('- Test webhook with sample data');
    }
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('🚨 Diagnostic suite failed:', error);
});