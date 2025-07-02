import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Finding Go North East datafeed ID...\n');

async function findGNEDatafeed() {
  try {
    const apiKey = process.env.BODS_API_KEY;
    
    // According to BODS documentation, we can search for specific operators
    console.log('📡 Searching for Go North East datafeeds...');
    
    // Try various search parameters
    const searchUrls = [
      // Search by likely NOC codes
      `${process.env.BODS_API_URL}datafeed/?api_key=${apiKey}&noc=GNEL`,
      `${process.env.BODS_API_URL}datafeed/?api_key=${apiKey}&noc=GONE`,
      `${process.env.BODS_API_URL}datafeed/?api_key=${apiKey}&noc=GONORTHEAST`,
      // Search by operator name
      `${process.env.BODS_API_URL}datafeed/?api_key=${apiKey}&operatorRef=GNEL`,
      // Get all feeds and filter
      `${process.env.BODS_API_URL}datafeed/?api_key=${apiKey}&limit=500`
    ];
    
    let foundFeeds = [];
    
    for (const url of searchUrls) {
      try {
        console.log('Trying:', url.replace(apiKey, '***'));
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          
          // Filter for Go North East
          const gneFeeds = data.results?.filter(feed => {
            const name = (feed.name || '').toLowerCase();
            const operator = (feed.operator_name || '').toLowerCase();
            const desc = (feed.description || '').toLowerCase();
            const nocs = (feed.noc || []).map(n => n.toLowerCase());
            
            return name.includes('go north east') ||
                   name.includes('go-north-east') ||
                   name.includes('gonortheast') ||
                   name.includes('gne') ||
                   operator.includes('go north east') ||
                   operator.includes('go-north-east') ||
                   operator.includes('gonortheast') ||
                   desc.includes('go north east') ||
                   nocs.includes('gnel') ||
                   nocs.includes('gone') ||
                   nocs.includes('gonortheast');
          }) || [];
          
          foundFeeds.push(...gneFeeds);
        }
      } catch (err) {
        console.log('Error with search:', err.message);
      }
    }
    
    // Remove duplicates
    const uniqueFeeds = Array.from(new Map(foundFeeds.map(f => [f.id, f])).values());
    
    if (uniqueFeeds.length > 0) {
      console.log(`\n✅ Found ${uniqueFeeds.length} Go North East datafeed(s):\n`);
      
      uniqueFeeds.forEach((feed, index) => {
        console.log(`\n📍 Feed ${index + 1}:`);
        console.log(`ID: ${feed.id}`);
        console.log(`Name: ${feed.name}`);
        console.log(`Operator: ${feed.operator_name}`);
        console.log(`NOC Codes: ${(feed.noc || []).join(', ')}`);
        console.log(`Status: ${feed.status}`);
        console.log(`URL: ${feed.url}`);
        console.log(`Admin Area: ${(feed.admin_areas || []).join(', ')}`);
        
        // Check if it's location data
        if (feed.name?.toLowerCase().includes('siri') || 
            feed.description?.toLowerCase().includes('location') ||
            feed.description?.toLowerCase().includes('avl')) {
          console.log('✅ This appears to be a bus location feed!');
        }
      });
      
      // Recommend the best one
      const locationFeed = uniqueFeeds.find(f => 
        f.name?.toLowerCase().includes('siri') || 
        f.description?.toLowerCase().includes('location') ||
        f.description?.toLowerCase().includes('avl')
      );
      
      if (locationFeed) {
        console.log(`\n🎯 RECOMMENDED: Use datafeed ID: ${locationFeed.id}`);
        console.log('\nAdd this to your .env file:');
        console.log(`BODS_GNE_DATAFEED_ID=${locationFeed.id}`);
      } else if (uniqueFeeds.length > 0) {
        console.log(`\n🎯 Use datafeed ID: ${uniqueFeeds[0].id}`);
        console.log('\nAdd this to your .env file:');
        console.log(`BODS_GNE_DATAFEED_ID=${uniqueFeeds[0].id}`);
      }
      
    } else {
      console.log('\n⚠️ No Go North East feeds found with automatic search.');
      console.log('\nYou can browse manually at:');
      console.log('https://data.bus-data.dft.gov.uk/browse/');
      console.log('\nLook for Go North East in the operator list.');
    }
    
    // Also test if feed ID 9264 works (from the URL you showed)
    console.log('\n🧪 Testing feed ID 9264 (from your dataset URL)...');
    try {
      const testUrl = `${process.env.BODS_API_URL}datafeed/9264/?api_key=${apiKey}`;
      const testResponse = await fetch(testUrl);
      
      if (testResponse.ok) {
        const contentType = testResponse.headers.get('content-type');
        console.log('✅ Feed 9264 is accessible!');
        console.log('Content-Type:', contentType);
        
        if (contentType?.includes('xml')) {
          console.log('✅ Returns XML data (likely SIRI-VM format)');
          console.log('\n🎯 CONFIRMED: Use BODS_GNE_DATAFEED_ID=9264');
        }
      } else {
        console.log(`❌ Feed 9264 returned: ${testResponse.status}`);
      }
    } catch (err) {
      console.log('❌ Error testing feed 9264:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findGNEDatafeed();
