#!/usr/bin/env node
// Simple Direct API Test for Go BARRY
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

console.log('🚗 Testing TomTom API directly...');

async function testTomTomDirect() {
  try {
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.8,54.8,-1.4,55.1', // Newcastle area
        zoom: 10
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'BARRY-DirectTest/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ TomTom Response Status: ${response.status}`);
    console.log(`📊 Data received:`, typeof response.data);
    
    if (response.data) {
      // Check different possible data structures
      if (response.data.incidents) {
        console.log(`🚨 Incidents found: ${response.data.incidents.length}`);
        if (response.data.incidents.length > 0) {
          console.log(`📍 Sample incident:`, response.data.incidents[0]);
        }
      } else if (response.data.tm && response.data.tm.poi) {
        console.log(`🚨 TomTom POI incidents found: ${response.data.tm.poi.length}`);
        if (response.data.tm.poi.length > 0) {
          console.log(`📍 Sample POI incident:`, response.data.tm.poi[0]);
        }
      } else {
        console.log(`📋 Raw response structure:`, Object.keys(response.data));
        console.log(`📋 Full response:`, JSON.stringify(response.data, null, 2));
      }
    }
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.error(`❌ TomTom Error: ${error.message}`);
    if (error.response) {
      console.error(`❌ Status: ${error.response.status}`);
      console.error(`❌ Response:`, error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Run the test
testTomTomDirect().then(result => {
  if (result.success) {
    console.log('\n✅ SUCCESS: TomTom API is working!');
    console.log('🎯 Traffic data is available - the issue is likely in the frontend connection.');
  } else {
    console.log('\n❌ FAILED: TomTom API is not working');
    console.log('🔧 Check API key or network connection');
  }
}).catch(console.error);
