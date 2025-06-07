#!/usr/bin/env node

// Go BARRY API Endpoint Tester
// Tests the live API endpoints to diagnose alert issues

const https = require('https');
const http = require('http');

const API_BASE = 'https://go-barry.onrender.com';

console.log('🚦 Go BARRY API Endpoint Diagnostic Tool');
console.log('==========================================');
console.log();

async function testEndpoint(endpoint, description) {
  return new Promise((resolve) => {
    const url = `${API_BASE}${endpoint}`;
    console.log(`🔍 Testing ${description}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    
    const request = https.get(url, (response) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      response.on('data', (chunk) => data += chunk);
      
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          console.log(`   ✅ Status: ${response.statusCode}`);
          console.log(`   ⏱️  Response Time: ${responseTime}ms`);
          
          if (parsed.success !== undefined) {
            console.log(`   📊 Success: ${parsed.success}`);
          }
          
          if (parsed.alerts) {
            console.log(`   🚨 Alerts Count: ${parsed.alerts.length}`);
            if (parsed.alerts.length > 0) {
              console.log(`   📋 Sample Alert: ${parsed.alerts[0].title || 'No title'}`);
              console.log(`   📍 Location: ${parsed.alerts[0].location || 'No location'}`);
              console.log(`   🔧 Source: ${parsed.alerts[0].source || 'No source'}`);
            }
          }
          
          if (parsed.metadata) {
            console.log(`   📈 Total Alerts: ${parsed.metadata.totalAlerts || 0}`);
            if (parsed.metadata.sources) {
              console.log('   🔌 Data Sources:');
              Object.entries(parsed.metadata.sources).forEach(([source, info]) => {
                const status = info.success ? '✅' : '❌';
                const count = info.count || 0;
                console.log(`      ${status} ${source}: ${count} alerts`);
              });
            }
          }
          
          if (parsed.error) {
            console.log(`   ❌ Error: ${parsed.error}`);
          }
          
          resolve({
            success: true,
            statusCode: response.statusCode,
            responseTime,
            data: parsed
          });
          
        } catch (parseError) {
          console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
          console.log(`   📄 Raw Response: ${data.substring(0, 200)}...`);
          resolve({
            success: false,
            error: parseError.message,
            rawData: data
          });
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`   ❌ Request Error: ${error.message}`);
      resolve({
        success: false,
        error: error.message
      });
    });
    
    request.setTimeout(30000, () => {
      console.log(`   ⏰ Request Timeout (30s)`);
      request.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function runDiagnostics() {
  const endpoints = [
    ['/api/health', 'Health Check'],
    ['/api/status', 'System Status'],
    ['/api/alerts', 'Main Alerts Endpoint'],
    ['/api/alerts-enhanced', 'Enhanced Alerts Endpoint'],
    ['/api/debug-traffic', 'Traffic Debug Endpoint'],
    ['/api/config', 'Configuration'],
  ];
  
  const results = [];
  
  for (const [endpoint, description] of endpoints) {
    const result = await testEndpoint(endpoint, description);
    results.push({ endpoint, description, ...result });
    console.log();
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('===================');
  console.log();
  
  let workingEndpoints = 0;
  let totalAlerts = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description} (${result.endpoint})`);
    
    if (result.success) {
      workingEndpoints++;
      if (result.data && result.data.alerts) {
        totalAlerts += result.data.alerts.length;
      }
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log();
  console.log(`📈 Working Endpoints: ${workingEndpoints}/${results.length}`);
  console.log(`🚨 Total Alerts Found: ${totalAlerts}`);
  
  if (totalAlerts === 0) {
    console.log();
    console.log('🔍 ZERO ALERTS DIAGNOSIS:');
    console.log('========================');
    console.log('Possible causes:');
    console.log('1. 🔑 API keys not working (expired/invalid)');
    console.log('2. 🌐 No traffic incidents in Newcastle area currently');
    console.log('3. 🚫 API rate limiting or quota exceeded');
    console.log('4. ⚠️  Backend processing issues');
    console.log('5. 📍 Geographic bounding box too restrictive');
    console.log();
    console.log('Recommendations:');
    console.log('1. Check API key configuration in backend/.env');
    console.log('2. Test with a broader geographic area');
    console.log('3. Check traffic API service status pages');
    console.log('4. Review backend logs for errors');
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);
