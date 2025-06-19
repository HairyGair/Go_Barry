#!/usr/bin/env node
// Enhanced diagnostic test for backend issues

console.log('🔍 Enhanced Backend Diagnostic Test...\n');

const API_BASE_URL = 'https://go-barry.onrender.com';

async function diagnosticTest() {
  try {
    console.log('📍 Testing backend URL:', API_BASE_URL);
    
    console.log('\n📝 Test 1: Basic connectivity...');
    const response = await fetch(API_BASE_URL);
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📊 Response content type:', response.headers.get('content-type'));
    console.log('📊 Response length:', text.length, 'characters');
    
    // Show first 500 characters of response
    console.log('📄 Response preview:');
    console.log(text.substring(0, 500));
    
    if (text.includes('<!DOCTYPE')) {
      console.log('\n🚨 Backend is returning HTML instead of JSON');
      console.log('💡 This usually means:');
      console.log('   - Backend deployment failed');
      console.log('   - Backend crashed during startup');
      console.log('   - Backend is returning an error page');
      
      // Try different endpoints
      console.log('\n📝 Test 2: Trying health endpoint specifically...');
      try {
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const healthText = await healthResponse.text();
        console.log('🏥 Health endpoint status:', healthResponse.status);
        console.log('🏥 Health endpoint preview:', healthText.substring(0, 200));
      } catch (healthError) {
        console.log('❌ Health endpoint failed:', healthError.message);
      }
      
      console.log('\n📝 Test 3: Trying root catch-all endpoint...');
      try {
        const rootResponse = await fetch(`${API_BASE_URL}/test`);
        const rootText = await rootResponse.text();
        console.log('🌐 Root endpoint status:', rootResponse.status);
        console.log('🌐 Root endpoint preview:', rootText.substring(0, 200));
      } catch (rootError) {
        console.log('❌ Root endpoint failed:', rootError.message);
      }
      
    } else {
      console.log('\n✅ Backend is responding with non-HTML content');
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        console.log('✅ Valid JSON response:', data);
      } catch (jsonError) {
        console.log('⚠️ Response is not valid JSON:', jsonError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   - Network connectivity problem');
    console.log('   - Backend URL incorrect');
    console.log('   - Backend completely down');
    console.log('   - DNS resolution failure');
  }
}

// Check if backend is deployed properly
async function checkRenderStatus() {
  console.log('\n🔍 Checking Render.com deployment status...');
  
  try {
    // Try multiple endpoints to see which ones work
    const endpoints = [
      '/',
      '/api/health',
      '/api/supervisor/active',
      '/api/alerts-enhanced'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, { timeout: 10000 });
        const isJson = response.headers.get('content-type')?.includes('application/json');
        console.log(`📍 ${endpoint}: ${response.status} ${isJson ? '(JSON)' : '(HTML/Other)'}`);
      } catch (endpointError) {
        console.log(`📍 ${endpoint}: FAILED (${endpointError.message})`);
      }
    }
  } catch (error) {
    console.log('❌ Could not check Render status:', error.message);
  }
}

// Run diagnostics
console.log('🚀 Starting comprehensive backend diagnostic...\n');

diagnosticTest()
  .then(() => checkRenderStatus())
  .then(() => {
    console.log('\n📋 Diagnostic Summary:');
    console.log('   If backend returns HTML: Deployment issue, check Render logs');
    console.log('   If endpoints fail: Backend not running or crashed');
    console.log('   If JSON works: Backend is healthy, auth issue is elsewhere');
    console.log('\n💡 Next steps:');
    console.log('   1. Check Render.com deployment logs');
    console.log('   2. Verify backend/render-startup.js is working');
    console.log('   3. Check if port binding fix was applied correctly');
  })
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
  });
