// Test National Highways RSS feed
import { fetchNationalHighways } from './services/nationalHighways.js';
import axios from 'axios';

async function testNationalHighways() {
  console.log('🛣️ Testing National Highways RSS feed...\n');
  
  // Test direct RSS access first
  console.log('1️⃣ Testing direct RSS feed access...');
  try {
    const response = await axios.get('https://m.highwaysengland.co.uk/feeds/rss/UnplannedEvents.xml', {
      headers: {
        'User-Agent': 'Go-BARRY-Test/1.0',
        'Accept': 'application/xml, text/xml, */*'
      },
      timeout: 10000
    });
    
    console.log(`✅ RSS feed status: ${response.status}`);
    console.log(`📊 Response type: ${response.headers['content-type']}`);
    console.log(`📏 Response length: ${response.data.length} characters`);
    
    // Count items in RSS
    const itemMatches = response.data.match(/<item>/g);
    console.log(`📰 Total RSS items: ${itemMatches ? itemMatches.length : 0}`);
    
    // Check for North East items
    const neMatches = response.data.match(/north east|northumberland|tyne|newcastle|gateshead|sunderland|durham/gi);
    console.log(`🎯 North East mentions: ${neMatches ? neMatches.length : 0}`);
    
  } catch (error) {
    console.error('❌ Direct RSS error:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
    }
  }
  
  // Test the service function
  console.log('\n2️⃣ Testing National Highways service function...');
  try {
    const result = await fetchNationalHighways();
    console.log('Service result:', {
      success: result.success,
      count: result.count || 0,
      dataLength: result.data?.length || 0,
      error: result.error
    });
    
    if (result.data && result.data.length > 0) {
      console.log('\nSample alerts:');
      result.data.slice(0, 3).forEach((alert, i) => {
        console.log(`\n${i + 1}. ${alert.title}`);
        console.log(`   Location: ${alert.location}`);
        console.log(`   Road: ${alert.road || 'N/A'}`);
        console.log(`   County: ${alert.county || 'N/A'}`);
        console.log(`   Source: ${alert.source}`);
      });
    }
  } catch (error) {
    console.error('❌ Service function error:', error.message);
  }
}

testNationalHighways().catch(console.error);
