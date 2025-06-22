// Direct TomTom API test
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testTomTomDirect() {
  console.log('🚗 TESTING TOMTOM API DIRECTLY\n');
  
  const apiKey = process.env.TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Missing');
  
  // Test 1: Basic API test
  console.log('\n1️⃣ Testing basic TomTom traffic API:');
  try {
    const bbox = '-1.8,54.8,-1.4,55.1'; // Newcastle/Gateshead area
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${bbox}`;
    
    console.log('URL:', url.replace(apiKey, 'API_KEY'));
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'BARRY-TrafficWatch/3.0',
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Incidents found:', response.data?.incidents?.length || 0);
    
    if (response.data?.incidents && response.data.incidents.length > 0) {
      console.log('\nFirst 3 incidents:');
      response.data.incidents.slice(0, 3).forEach((incident, i) => {
        console.log(`\n${i + 1}. ${incident.properties?.description || 'No description'}`);
        console.log(`   Category: ${incident.properties?.iconCategory}`);
        console.log(`   Delay: ${incident.properties?.delay}s`);
        console.log(`   Road: ${incident.properties?.roadName || 'Unknown'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test 2: Check API key validity
  console.log('\n2️⃣ Testing API key validity:');
  try {
    const testUrl = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=0,0,0.1,0.1`;
    const response = await axios.head(testUrl);
    console.log('✅ API key is valid');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('❌ API key is invalid or expired');
    } else if (error.response?.status === 429) {
      console.log('⚠️ API rate limit exceeded');
    } else {
      console.log('❌ Unknown error:', error.response?.status || error.message);
    }
  }
}

testTomTomDirect().catch(console.error);
