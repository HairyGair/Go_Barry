import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Testing BODS API connection...\n');
console.log('API Key exists:', !!process.env.BODS_API_KEY);
console.log('API Key (last 4):', process.env.BODS_API_KEY ? '...' + process.env.BODS_API_KEY.slice(-4) : 'NOT SET');

async function testBODSConnection() {
  try {
    // Test 1: Check API key validity
    console.log('\n📡 Testing API key validity...');
    const testUrl = `${process.env.BODS_API_URL}datafeed/?api_key=${process.env.BODS_API_KEY}&limit=5`;
    
    const response = await fetch(testUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ API key invalid or request failed');
      return;
    }
    
    const data = await response.json();
    console.log('✅ API key is valid!');
    console.log(`Found ${data.count} total datafeeds\n`);
    
    // Test 2: Search for Go North East
    console.log('🔍 Searching for Go North East feeds...');
    
    // Look for Go North East in the results
    const gneFeeds = data.results.filter(feed => {
      const name = (feed.name || '').toLowerCase();
      const operator = (feed.operator_name || '').toLowerCase();
      const noc = (feed.noc || []).join(' ').toLowerCase();
      
      return name.includes('go north east') ||
             name.includes('gonortheast') ||
             name.includes('gne') ||
             operator.includes('go north east') ||
             operator.includes('gonortheast') ||
             noc.includes('gnel') ||
             noc.includes('gone');
    });
    
    if (gneFeeds.length > 0) {
      console.log(`\n✅ Found ${gneFeeds.length} Go North East feed(s):\n`);
      gneFeeds.forEach(feed => {
        console.log('Feed ID:', feed.id);
        console.log('Name:', feed.name);
        console.log('Operator:', feed.operator_name);
        console.log('NOC:', feed.noc);
        console.log('Status:', feed.status);
        console.log('---');
      });
    } else {
      console.log('\n⚠️ No obvious Go North East feeds found in first page');
      console.log('Showing all feeds to help identify the correct one:\n');
      
      data.results.slice(0, 10).forEach(feed => {
        console.log(`ID: ${feed.id} | ${feed.operator_name} | NOC: ${feed.noc?.join(', ')}`);
      });
    }
    
    // Test 3: Try specific IDs
    console.log('\n🧪 Testing known potential IDs...');
    const testIds = ['9264', '5095', '4652'];
    
    for (const id of testIds) {
      try {
        const idUrl = `${process.env.BODS_API_URL}datafeed/${id}/?api_key=${process.env.BODS_API_KEY}`;
        const idResponse = await fetch(idUrl);
        if (idResponse.ok) {
          console.log(`✅ ID ${id}: Valid feed exists`);
        } else {
          console.log(`❌ ID ${id}: ${idResponse.status}`);
        }
      } catch (err) {
        console.log(`❌ ID ${id}: Error - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBODSConnection();
