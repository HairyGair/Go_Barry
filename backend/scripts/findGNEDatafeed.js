import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function findGoNorthEastDatafeed() {
  console.log('🔍 Searching for Go North East BODS datafeed...\n');
  
  if (!process.env.BODS_API_KEY) {
    console.error('❌ ERROR: BODS_API_KEY not set in .env file');
    console.log('\nPlease follow these steps:');
    console.log('1. Create account at https://data.bus-data.dft.gov.uk/account/signup/');
    console.log('2. Go to Account Settings: https://data.bus-data.dft.gov.uk/account/settings/');
    console.log('3. Generate API key');
    console.log('4. Add to .env file: BODS_API_KEY=your-key-here');
    return;
  }
  
  try {
    // First, try to list all datafeeds
    console.log('📡 Fetching datafeed list...');
    const url = `${process.env.BODS_API_URL}datafeed/?api_key=${process.env.BODS_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.count} total datafeeds\n`);
    
    // Search for Go North East related feeds
    const searchTerms = ['go north east', 'gonortheast', 'gne', 'go-ahead', 'goahead'];
    const matches = [];
    
    data.results.forEach(feed => {
      const nameMatch = searchTerms.some(term => 
        feed.name?.toLowerCase().includes(term) ||
        feed.operator_name?.toLowerCase().includes(term) ||
        feed.description?.toLowerCase().includes(term)
      );
      
      const nocMatch = feed.noc_codes?.includes('GONORTHEAST') || 
                       feed.noc_codes?.includes('GNEL');
      
      if (nameMatch || nocMatch) {
        matches.push(feed);
      }
    });
    
    if (matches.length > 0) {
      console.log(`🎯 Found ${matches.length} potential Go North East datafeed(s):\n`);
      
      matches.forEach((feed, index) => {
        console.log(`Feed ${index + 1}:`);
        console.log(`- ID: ${feed.id}`);
        console.log(`- Name: ${feed.name}`);
        console.log(`- Operator: ${feed.operator_name}`);
        console.log(`- NOC Codes: ${feed.noc_codes?.join(', ') || 'N/A'}`);
        console.log(`- Status: ${feed.status}`);
        console.log(`- URL Template: ${feed.url_link}`);
        console.log(`- Description: ${feed.description || 'N/A'}`);
        console.log('');
      });
      
      console.log('\n✅ Update your .env file with:');
      console.log(`BODS_GNE_DATAFEED_ID=${matches[0].id}`);
      
    } else {
      console.log('⚠️ No Go North East datafeeds found directly.');
      console.log('\nShowing all active SIRI-VM feeds that might be relevant:\n');
      
      const siriFeeds = data.results.filter(feed => 
        feed.status === 'live' && 
        feed.url_link?.includes('siri')
      );
      
      siriFeeds.slice(0, 10).forEach(feed => {
        console.log(`- ID: ${feed.id} | ${feed.operator_name} | NOC: ${feed.noc_codes?.join(', ')}`);
      });
      
      console.log('\nTry searching manually at: https://data.bus-data.dft.gov.uk/browse/');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n🔐 Authentication failed. Please check:');
      console.log('1. Your API key is correct');
      console.log('2. The key is active in your BODS account settings');
      console.log('3. You\'re using the correct format in .env');
    }
  }
}

// Alternative: Direct test of known IDs
async function testKnownDatafeeds() {
  console.log('\n🧪 Testing known potential datafeed IDs...\n');
  
  // Common IDs that might be Go North East
  const potentialIds = [
    '9264',  // This might be Go North East based on NOC
    'gne',
    'gonortheast',
    'go-north-east',
    'GONORTHEAST'
  ];
  
  for (const id of potentialIds) {
    try {
      console.log(`Testing ID: ${id}...`);
      const url = `${process.env.BODS_API_URL}datafeed/${id}/?api_key=${process.env.BODS_API_KEY}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`✅ Success! ID "${id}" returned ${response.status} (${contentType})`);
        
        // If it's XML, it's likely a SIRI-VM feed
        if (contentType?.includes('xml')) {
          console.log('   This appears to be a valid SIRI-VM feed!');
          console.log(`   Add to .env: BODS_GNE_DATAFEED_ID=${id}\n`);
        }
      } else {
        console.log(`❌ ID "${id}" returned ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ID "${id}" failed: ${error.message}`);
    }
  }
}

// Run both searches
async function main() {
  await findGoNorthEastDatafeed();
  await testKnownDatafeeds();
}

main();
