// backend/scripts/cleanup-non-ne-roadworks.js
// Script to clean up non-North East roadworks from Supabase

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import unifiedRoadworksManager from '../services/unifiedRoadworksManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function runCleanup() {
  console.log('\n===========================================');
  console.log('🧹 NORTH EAST ROADWORKS CLEANUP SCRIPT');
  console.log('===========================================\n');
  
  try {
    // First get statistics
    console.log('📊 Analyzing current database state...\n');
    const statsResult = await unifiedRoadworksManager.getCleanupStats();
    
    if (!statsResult.success) {
      console.error('❌ Failed to get statistics:', statsResult.error);
      process.exit(1);
    }
    
    const { stats } = statsResult;
    console.log('📈 Current Statistics:');
    console.log(`   Total notifications: ${stats.total}`);
    console.log(`   North East roadworks: ${stats.northEast} (${stats.percentageNE}%)`);
    console.log(`   Non-NE roadworks: ${stats.nonNorthEast} (${100 - stats.percentageNE}%)`);
    
    if (stats.sampleNonNE.length > 0) {
      console.log('\n📍 Sample of non-NE roadworks to be removed:');
      stats.sampleNonNE.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.location} (${item.authority || 'Unknown authority'})`);
      });
    }
    
    if (stats.nonNorthEast === 0) {
      console.log('\n✅ Database is already clean - no non-NE roadworks found!');
      process.exit(0);
    }
    
    // Ask for confirmation
    console.log(`\n⚠️  WARNING: This will delete ${stats.nonNorthEast} roadworks from Supabase!`);
    console.log('Press ENTER to continue or Ctrl+C to cancel...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Run cleanup
    console.log('\n🚀 Starting cleanup...\n');
    const cleanupResult = await unifiedRoadworksManager.cleanupNonNorthEastRoadworks();
    
    if (!cleanupResult.success) {
      console.error('\n❌ Cleanup failed:', cleanupResult.error);
      process.exit(1);
    }
    
    console.log('\n✅ CLEANUP COMPLETE!');
    console.log('===========================================');
    console.log(`📊 Final Results:`);
    console.log(`   Total checked: ${cleanupResult.totalChecked}`);
    console.log(`   North East kept: ${cleanupResult.northEastKept}`);
    console.log(`   Non-NE deleted: ${cleanupResult.deleted}`);
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the cleanup
runCleanup();
