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

async function testBODSConnection() {
  console.log('🚌 Testing BODS API Connection...');
  console.log('API URL:', process.env.BODS_API_URL);
  console.log('Feed ID:', process.env.BODS_GNE_DATAFEED_ID);
  console.log('API Key:', process.env.BODS_API_KEY ? 'Set (hidden)' : 'NOT SET');
  
  try {
    // Make API request
    const url = `${process.env.BODS_API_URL}datafeed/${process.env.BODS_GNE_DATAFEED_ID}/`;
    console.log('\nFetching from:', url);
    
    // BODS accepts API key as query parameter
    const urlWithKey = `${url}?api_key=${process.env.BODS_API_KEY}`;
    console.log('Full URL (key hidden):', url + '?api_key=***');
    
    // Debug: print actual URL (be careful with this in production!)
    console.log('DEBUG - Actual URL:', urlWithKey);
    
    const response = await fetch(urlWithKey);
    
    // Check response
    console.log('\nResponse Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    // Get XML data
    const xml = await response.text();
    console.log('XML Length:', xml.length, 'characters');
    console.log('\nFirst 500 chars of XML:');
    console.log('---');
    console.log(xml.substring(0, 500));
    console.log('---\n');
    
    // Parse XML
    const data = await parser.parseStringPromise(xml);
    console.log('✅ Successfully parsed XML!');
    
    // Explore structure
    console.log('\n📊 SIRI Structure:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1000));
    
    // Find vehicle data
    const vehicleActivities = data?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery?.VehicleActivity;
    if (vehicleActivities) {
      const activities = Array.isArray(vehicleActivities) ? vehicleActivities : [vehicleActivities];
      console.log(`\n🚌 Found ${activities.length} buses`);
      
      // Sample first few buses
      console.log('\n📍 First 3 buses:');
      activities.slice(0, 3).forEach((activity, index) => {
        const journey = activity.MonitoredVehicleJourney;
        console.log(`\nBus ${index + 1}:`);
        console.log('- Vehicle ID:', journey.VehicleRef);
        console.log('- Line:', journey.PublishedLineName);
        console.log('- Destination:', journey.DestinationName);
        console.log('- Operator:', journey.OperatorRef);
        console.log('- Location:', journey.VehicleLocation);
        console.log('- Bearing:', journey.Bearing);
        console.log('- Delay:', journey.Delay);
      });
      
      // Check for Go North East buses
      const gneActivities = activities.filter(a => {
        const operatorRef = a.MonitoredVehicleJourney?.OperatorRef;
        return operatorRef && (
          operatorRef.includes('GONORTHEAST') || 
          operatorRef.includes('GNE') ||
          operatorRef.includes('9264')
        );
      });
      
      console.log(`\n✅ Found ${gneActivities.length} Go North East buses out of ${activities.length} total`);
      
    } else {
      console.log('\n⚠️ No vehicle activities found in response');
      console.log('Full structure:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

// Run test
console.log('Starting BODS API test...\n');
testBODSConnection();