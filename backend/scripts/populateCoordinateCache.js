// backend/scripts/populateCoordinateCache.js
// Script to batch process existing roadworks and populate coordinate cache

import axios from 'axios';
import dotenv from 'dotenv';
import { processStreetManagerCoordinates } from '../utils/coordinateConverterProj4.js';
import { coordinateCacheService } from '../services/coordinateCacheService.js';

dotenv.config();

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

async function populateCoordinateCache() {
  console.log('🚀 Starting coordinate cache population...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  try {
    // Get total count
    const countResponse = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      },
      params: {
        select: 'id',
        'sm_works_state': 'in.(Works planned,Works in progress)',
        'cached_lat': 'is.null', // Only get ones without cached coordinates
        limit: 1
      }
    });
    
    const totalCount = parseInt(countResponse.headers['content-range']?.split('/')[1] || '0');
    console.log(`📊 Found ${totalCount} roadworks without cached coordinates`);
    
    if (totalCount === 0) {
      console.log('✅ All roadworks already have cached coordinates!');
      return;
    }
    
    // Process in batches
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    while (processed < totalCount) {
      console.log(`\n🔄 Processing batch ${Math.floor(processed / BATCH_SIZE) + 1}...`);
      
      // Fetch batch
      const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          'sm_works_state': 'in.(Works planned,Works in progress)',
          'cached_lat': 'is.null',
          limit: BATCH_SIZE,
          offset: processed,
          order: 'created_at.desc'
        }
      });
      
      const roadworks = response.data;
      if (roadworks.length === 0) break;
      
      // Process coordinates for this batch
      const processedBatch = [];
      
      for (const roadwork of roadworks) {
        try {
          const result = await processStreetManagerCoordinates(roadwork);
          
          if (result.coordinates) {
            processedBatch.push({
              id: roadwork.id,
              coordinates: result.coordinates,
              coordinateSource: result.coordinateSource,
              coordinateAccuracy: result.coordinateAccuracy || 'high',
              metadata: {
                originalEasting: roadwork.sm_easting,
                originalNorthing: roadwork.sm_northing,
                processingMethod: result.coordinateSource
              }
            });
            successful++;
          } else {
            failed++;
            console.log(`⚠️ No coordinates for ${roadwork.id}: ${roadwork.sm_street_name}`);
          }
        } catch (error) {
          failed++;
          console.error(`❌ Error processing ${roadwork.id}:`, error.message);
        }
      }
      
      // Batch store to cache
      if (processedBatch.length > 0) {
        await coordinateCacheService.batchStoreCachedCoordinates(processedBatch);
        console.log(`✅ Cached ${processedBatch.length} coordinates`);
      }
      
      processed += roadworks.length;
      console.log(`📈 Progress: ${processed}/${totalCount} (${Math.round(processed/totalCount*100)}%)`);
      console.log(`✅ Successful: ${successful}, ❌ Failed: ${failed}`);
      
      // Delay between batches to avoid overwhelming the system
      if (processed < totalCount) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    console.log('\n🎉 Cache population complete!');
    console.log(`📊 Final stats:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Successfully cached: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Success rate: ${Math.round(successful/processed*100)}%`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
populateCoordinateCache().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
