import dotenv from 'dotenv';
import OneNetworkService from './services/oneNetworkService.js';

// Load environment variables
dotenv.config();

async function runScraper() {
  console.log('🚀 Starting One.Network Scraper...');
  console.log('');
  
  const scraper = new OneNetworkService();
  
  try {
    await scraper.run();
    console.log('');
    console.log('✅ Scraping completed successfully!');
  } catch (error) {
    console.error('');
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

// Run the scraper
runScraper().catch(console.error);
