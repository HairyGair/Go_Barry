// Quick test of API keys
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: './backend/.env' });

console.log('Testing API keys...');
console.log('TomTom:', process.env.TOMTOM_API_KEY ? 'LOADED' : 'MISSING');
console.log('HERE:', process.env.HERE_API_KEY ? 'LOADED' : 'MISSING');

// Test TomTom API
if (process.env.TOMTOM_API_KEY) {
  try {
    const response = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails', {
      params: {
        key: process.env.TOMTOM_API_KEY,
        bbox: '-1.7,54.9,-1.5,55.1', // Small Newcastle area
        zoom: 10
      },
      timeout: 10000
    });
    console.log('✅ TomTom API working:', response.status, 'incidents:', response.data?.incidents?.length || 0);
  } catch (error) {
    console.log('❌ TomTom API failed:', error.response?.status, error.message);
  }
} else {
  console.log('❌ TomTom API key missing');
}
