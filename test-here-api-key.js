#!/usr/bin/env node
// Simple HERE API key validation test

import dotenv from 'dotenv';

// Load environment variables from backend directory
dotenv.config({ path: './backend/.env' });

async function validateHEREApiKey() {
  console.log('🔑 HERE API Key Validation Test\n');
  
  // Check if key exists
  if (!process.env.HERE_API_KEY) {
    console.error('❌ HERE_API_KEY not found in environment');
    process.exit(1);
  }
  
  const apiKey = process.env.HERE_API_KEY.trim();
  console.log('✅ API Key found');
  console.log(`📏 Length: ${apiKey.length} characters`);
  console.log(`🔤 First 10 chars: ${apiKey.substring(0, 10)}`);
  console.log(`🔤 Last 10 chars: ${apiKey.substring(apiKey.length - 10)}`);
  console.log(`🔍 Contains spaces: ${apiKey.includes(' ')}`);
  console.log(`🔍 Trimmed length: ${apiKey.trim().length}\n`);
  
  // Test 1: Simple Geocoding API (should work with any valid HERE key)
  console.log('🧪 Test 1: Geocoding API (Newcastle)');
  try {
    const geocodeUrl = `https://geocode.search.hereapi.com/v1/geocode?apikey=${apiKey}&q=Newcastle+upon+Tyne,+UK`;
    const geocodeResponse = await fetch(geocodeUrl, { 
      method: 'GET',
      headers: { 'User-Agent': 'BARRY-Test/1.0' }
    });
    
    if (geocodeResponse.ok) {
      const data = await geocodeResponse.json();
      console.log('✅ Geocoding API: SUCCESS');
      console.log(`📍 Results: ${data.items?.length || 0} locations found\n`);
    } else {
      console.log('❌ Geocoding API: FAILED');
      console.log(`   Status: ${geocodeResponse.status}`);
      const errorData = await geocodeResponse.json().catch(() => ({ error: 'Unknown' }));
      console.log(`   Error: ${errorData.error || geocodeResponse.statusText}\n`);
    }
  } catch (error) {
    console.log('❌ Geocoding API: NETWORK ERROR');
    console.log(`   Error: ${error.message}\n`);
  }
  
  // Test 2: Traffic API v7 (the one that's failing)
  console.log('🧪 Test 2: Traffic API v7 (25km around Newcastle)');
  try {
    const trafficUrl = `https://data.traffic.hereapi.com/v7/incidents?apikey=${apiKey}&in=circle:54.9783,-1.6178;r=25000&locationReferencing=olr`;
    const trafficResponse = await fetch(trafficUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'BARRY-Test/1.0' }
    });
    
    if (trafficResponse.ok) {
      const data = await trafficResponse.json();
      console.log('✅ Traffic API v7: SUCCESS');
      console.log(`🚦 Results: ${data.results?.length || 0} incidents found\n`);
    } else {
      console.log('❌ Traffic API v7: FAILED');
      console.log(`   Status: ${trafficResponse.status}`);
      const errorData = await trafficResponse.json().catch(() => ({ error: 'Unknown' }));
      console.log(`   Error: ${errorData.error || trafficResponse.statusText}`);
      console.log(`   Description: ${errorData.error_description || 'N/A'}\n`);
    }
  } catch (error) {
    console.log('❌ Traffic API v7: NETWORK ERROR');
    console.log(`   Error: ${error.message}\n`);
  }
  
  console.log('🔎 DIAGNOSIS:');
  console.log('If geocoding works but traffic fails → Traffic API requires different permissions');
  console.log('If everything fails → API key is invalid or expired');
  console.log('If some work → Check HERE developer portal for API entitlements');
  console.log('\n🌐 Check your HERE developer portal: https://developer.here.com/projects');
  console.log('📋 Look for "Traffic API" in your project entitlements');
}

validateHEREApiKey().catch(console.error);
