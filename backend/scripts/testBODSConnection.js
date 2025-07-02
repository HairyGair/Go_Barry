import fetch from 'node-fetch';
import xml2js from 'xml2js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const parser = new xml2js.Parser({
  explicitArray: false,
  ignoreAttrs: false,
  tagNameProcessors: [xml2js.processors.stripPrefix]
});

console.log('🚌 Testing BODS API Connection for Go North East...\n');
console.log('API Key:', process.env.BODS_API_KEY ? '✅ Configured' : '❌ NOT SET');
console.log('Feed ID:', process.env.BODS_GNE_DATAFEED_ID || 'NOT SET');
console.log('API URL:', process.env.BODS_API_URL);

async function testBODSConnection() {
  try {
    // Build URL
    const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/?api_key=${process.env.BODS_API_KEY}`;
    console.log('\n📡 Fetching from BODS API...');
    console.log('URL:', url.replace(process.env.BODS_API_KEY, '***KEY***'));
    
    const response = await fetch(url);
    
    console.log('\nResponse Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    // Get XML data
    const xml = await response.text();
    console.log('XML Length:', xml.length, 'characters');
    console.log('\n✅ Successfully connected to BODS API!');
    
    // Parse XML
    const data = await parser.parseStringPromise(xml);
    console.log('\n✅ Successfully parsed XML data!');
    
    // Find vehicle data in SIRI structure
    const siri = data?.Siri;
    if (!siri) {
      console.log('⚠️ No SIRI data found in response');
      return;
    }
    
    const delivery = siri.ServiceDelivery?.VehicleMonitoringDelivery;
    if (!delivery) {
      console.log('⚠️ No VehicleMonitoringDelivery found');
      return;
    }
    
    const activities = delivery.VehicleActivity;
    const vehicleCount = Array.isArray(activities) ? activities.length : (activities ? 1 : 0);
    
    console.log(`\n🚌 Found ${vehicleCount} buses in the feed`);
    
    if (vehicleCount > 0) {
      // Show first 3 buses as examples
      const examples = Array.isArray(activities) ? activities.slice(0, 3) : [activities];
      
      console.log('\n📍 Sample buses:');
      examples.forEach((activity, index) => {
        const journey = activity.MonitoredVehicleJourney;
        if (journey) {
          console.log(`\nBus ${index + 1}:`);
          console.log('- Vehicle ID:', journey.VehicleRef);
          console.log('- Operator:', journey.OperatorRef);
          console.log('- Line:', journey.PublishedLineName || journey.LineRef);
          console.log('- Destination:', journey.DestinationName);
          console.log('- Location:', journey.VehicleLocation ? 
            `${journey.VehicleLocation.Latitude}, ${journey.VehicleLocation.Longitude}` : 
            'No location');
          console.log('- Bearing:', journey.Bearing || 'N/A');
        }
      });
      
      // Check operator references
      const operators = new Set();
      const lines = new Set();
      
      const allActivities = Array.isArray(activities) ? activities : [activities];
      allActivities.forEach(activity => {
        const journey = activity.MonitoredVehicleJourney;
        if (journey) {
          if (journey.OperatorRef) operators.add(journey.OperatorRef);
          if (journey.PublishedLineName) lines.add(journey.PublishedLineName);
        }
      });
      
      console.log('\n📊 Summary:');
      console.log('Operators found:', Array.from(operators).join(', '));
      console.log('Lines found:', Array.from(lines).slice(0, 10).join(', '), 
                  lines.size > 10 ? `... and ${lines.size - 10} more` : '');
    }
    
    console.log('\n✅ BODS Integration Test Successful!');
    console.log('The API connection is working and returning bus data.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n🔐 Authentication failed. Please check your API key.');
    } else if (error.message.includes('404')) {
      console.log('\n🔍 Feed not found. The datafeed ID might be incorrect.');
    }
  }
}

// Run test
testBODSConnection();
