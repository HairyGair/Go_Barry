// Debug Durham website structure
import axios from 'axios';
import * as cheerio from 'cheerio';

console.log('🔍 Debugging Durham roadworks website structure...\n');

async function debug() {
  try {
    const response = await axios.get('https://www.durham.gov.uk/roadworks', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9'
      },
      timeout: 15000
    });
    
    console.log(`✅ Successfully fetched page (${response.data.length} bytes)\n`);
    
    const $ = cheerio.load(response.data);
    
    // Check for tables
    const tables = $('table');
    console.log(`📊 Found ${tables.length} table(s)`);
    
    if (tables.length > 0) {
      tables.each((i, table) => {
        console.log(`\nTable ${i + 1}:`);
        
        // Check headers
        const headers = $(table).find('th, thead td');
        if (headers.length > 0) {
          console.log('  Headers:');
          headers.each((j, header) => {
            console.log(`    - ${$(header).text().trim()}`);
          });
        }
        
        // Count rows
        const rows = $(table).find('tbody tr, tr').length;
        console.log(`  Rows: ${rows}`);
        
        // Show first row data
        const firstRow = $(table).find('tbody tr, tr').first();
        const cells = firstRow.find('td');
        if (cells.length > 0) {
          console.log('  First row data:');
          cells.each((j, cell) => {
            console.log(`    Cell ${j}: ${$(cell).text().trim().substring(0, 50)}...`);
          });
        }
      });
    }
    
    // Check for other possible structures
    console.log('\n🔍 Other structures:');
    console.log(`  Lists (.roadworks-list): ${$('.roadworks-list, ul.roadworks').length}`);
    console.log(`  Cards (.roadwork-card): ${$('.roadwork-card, .card').length}`);
    console.log(`  Divs with roadwork class: ${$('[class*="roadwork"]').length}`);
    
    // Check page title
    console.log(`\n📄 Page title: ${$('title').text()}`);
    console.log(`  H1: ${$('h1').first().text()}`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Headers:`, error.response.headers);
    }
  }
}

debug();