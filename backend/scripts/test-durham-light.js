// Test the Durham roadworks lightweight scraper
import durhamRoadworksLight from '../services/durhamRoadworksLight.js';

console.log('🧪 Testing Durham roadworks lightweight scraper...\n');

async function test() {
  try {
    const roadworks = await durhamRoadworksLight.fetchRoadworks();
    
    console.log(`✅ Successfully fetched ${roadworks.length} roadworks\n`);
    
    if (roadworks.length > 0) {
      console.log('📍 First few roadworks:');
      roadworks.slice(0, 3).forEach((rw, index) => {
        console.log(`\n${index + 1}. ${rw.title}`);
        console.log(`   Location: ${rw.location}`);
        console.log(`   Severity: ${rw.severity}`);
        console.log(`   Start: ${new Date(rw.startDate).toLocaleDateString()}`);
        console.log(`   End: ${new Date(rw.endDate).toLocaleDateString()}`);
        console.log(`   Description: ${rw.description.split('\n')[0]}`);
      });
    } else {
      console.log('⚠️ No roadworks found - check if the website structure has changed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

test();