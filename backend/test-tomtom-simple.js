// Simplified TomTom test without geocoding
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testTomTomSimple() {
  console.log('🚗 TESTING TOMTOM WITHOUT GEOCODING\n');
  
  const apiKey = process.env.TOMTOM_API_KEY || '9rZJqtnfYpOzlqnypI97nFb5oX17SNzp';
  
  try {
    const bbox = '-1.8,54.8,-1.4,55.1'; // Newcastle/Gateshead area
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('Bounding Box:', bbox);
    
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails`;
    const params = {
      key: apiKey,
      bbox: bbox,
      fields: '{incidents{properties{iconCategory,delay,roadNumbers,description}}}',
      language: 'en-GB',
      categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11,14'
    };
    
    console.log('\nMaking request to TomTom API...');
    const response = await axios.get(url, {
      params,
      timeout: 10000
    });
    
    console.log('Response Status:', response.status);
    console.log('Total Incidents:', response.data?.incidents?.length || 0);
    
    if (response.data?.incidents && response.data.incidents.length > 0) {
      console.log('\n📊 Incident Categories:');
      const categories = {};
      response.data.incidents.forEach(inc => {
        const cat = inc.properties?.iconCategory || 'unknown';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      
      Object.entries(categories).forEach(([cat, count]) => {
        const catName = {
          1: 'Accident',
          2: 'Dangerous Conditions', 
          3: 'Weather',
          4: 'Road Hazard',
          5: 'Vehicle Breakdown',
          6: 'Road Closure',
          7: 'Road Works',
          8: 'Mass Transit',
          9: 'Traffic',
          10: 'Road Blocked',
          11: 'Road Blocked',
          14: 'Broken Down Vehicle'
        }[cat] || 'Unknown';
        
        console.log(`   Category ${cat} (${catName}): ${count} incidents`);
      });
      
      // Create simple alerts without geocoding
      const alerts = response.data.incidents.slice(0, 5).map((inc, i) => ({
        id: `test_${Date.now()}_${i}`,
        title: inc.properties?.description || 'Traffic Incident',
        severity: 'Medium',
        iconCategory: inc.properties?.iconCategory,
        delay: inc.properties?.delay,
        coordinates: inc.geometry?.coordinates
      }));
      
      console.log('\n📍 Sample Alerts (without geocoding):');
      alerts.forEach((alert, i) => {
        console.log(`\n${i + 1}. ${alert.title}`);
        console.log(`   Category: ${alert.iconCategory}`);
        console.log(`   Delay: ${alert.delay}s`);
        console.log(`   Coords: ${alert.coordinates}`);
      });
      
      return alerts;
    } else {
      console.log('\n⚠️ No incidents found in the specified area');
      console.log('This could mean:');
      console.log('1. No current traffic incidents in Newcastle/Gateshead');
      console.log('2. API key is invalid or rate limited');
      console.log('3. Network/firewall issue');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 403) {
        console.error('\n🔑 API Key Issue: The API key is invalid or doesn\'t have access to this service');
      } else if (error.response.status === 429) {
        console.error('\n⏱️ Rate Limit: You\'ve exceeded the API rate limit');
      }
    }
  }
}

testTomTomSimple().catch(console.error);
