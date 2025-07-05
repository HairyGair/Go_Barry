#!/usr/bin/env node

/**
 * Run Street Manager Database Cleanup
 * This script will actually delete non-North East data from Supabase
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseLineStringToBNG, parsePointToBNG } from '../utils/bngToLatLng.js';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// North East England bounding box
const NORTH_EAST_BOUNDS = {
  north: 55.8,  // Scottish border
  south: 54.2,  // Yorkshire border
  east: -0.5,   // North Sea coast
  west: -3.0    // Cumbrian border
};

/**
 * Check if coordinates are within North East England
 */
function isInNorthEastRegion(lat, lng) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  
  return lat >= NORTH_EAST_BOUNDS.south && 
         lat <= NORTH_EAST_BOUNDS.north && 
         lng >= NORTH_EAST_BOUNDS.west && 
         lng <= NORTH_EAST_BOUNDS.east;
}

/**
 * Parse coordinates from Street Manager webhook data
 */
function parseCoordinates(rawData) {
  if (!rawData || !rawData.object_data) {
    return null;
  }

  const objectData = rawData.object_data;
  
  // Try to parse from works_location_coordinates
  if (objectData.works_location_coordinates) {
    try {
      const coordinates = parseLineStringToBNG(objectData.works_location_coordinates);
      if (coordinates && coordinates.length > 0) {
        return { lat: coordinates[0].lat, lng: coordinates[0].lng };
      }
    } catch (error) {
      // Silently continue
    }
  }
  
  // Try to parse from works_coordinates
  if (objectData.works_coordinates) {
    try {
      const point = parsePointToBNG(objectData.works_coordinates);
      if (point) {
        return { lat: point.lat, lng: point.lng };
      }
    } catch (error) {
      // Silently continue
    }
  }
  
  return null;
}

/**
 * Check if webhook data is relevant to North East England
 */
function isRelevantToNorthEast(webhookData) {
  if (!webhookData) return false;
  
  // Parse coordinates
  const coords = parseCoordinates(webhookData);
  if (coords && isInNorthEastRegion(coords.lat, coords.lng)) {
    return true;
  }
  
  // Check location names for North East areas
  const objectData = webhookData.object_data || {};
  const locationFields = [
    objectData.area_name,
    objectData.town,
    objectData.street_name,
    objectData.location_description,
    objectData.highway_authority
  ].filter(Boolean).join(' ').toLowerCase();
  
  const northEastKeywords = [
    'newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland',
    'north tyneside', 'south tyneside', 'northumberland county council',
    'newcastle city council', 'gateshead council', 'sunderland city council',
    'durham county council', 'north tyneside council', 'south tyneside council'
  ];
  
  return northEastKeywords.some(keyword => locationFields.includes(keyword));
}

async function main() {
  console.log('🚀 ACTUAL Supabase cleanup for North East England...');
  console.log(`📍 North East bounds: ${NORTH_EAST_BOUNDS.south}°N to ${NORTH_EAST_BOUNDS.north}°N, ${NORTH_EAST_BOUNDS.west}°W to ${NORTH_EAST_BOUNDS.east}°E`);
  
  try {
    // 1. Clean up streetmanager_notifications table
    console.log('\n🧹 Cleaning streetmanager_notifications table...');
    
    const { data: notifications, error: fetchError } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data');
    
    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }
    
    console.log(`📊 Found ${notifications.length} total notifications`);
    
    // Analyze which to keep/delete
    const toDelete = [];
    const toKeep = [];
    
    for (const notification of notifications) {
      const isRelevant = isRelevantToNorthEast(notification.raw_webhook_data);
      
      if (isRelevant) {
        toKeep.push(notification.id);
      } else {
        toDelete.push(notification.id);
      }
    }
    
    console.log(`📊 Analysis complete:`);
    console.log(`   ✅ Keep (North East): ${toKeep.length}`);
    console.log(`   🗑️  Delete (Outside NE): ${toDelete.length}`);
    
    // Delete in batches
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} non-North East notifications...`);
      
      const batchSize = 100;
      let deletedCount = 0;
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('streetmanager_notifications')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`🗑️  Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} notifications (${deletedCount}/${toDelete.length})`);
        }
      }
      
      console.log(`✅ streetmanager_notifications cleanup complete: ${deletedCount} deleted, ${toKeep.length} kept`);
    } else {
      console.log('✅ No cleanup needed for streetmanager_notifications');
    }
    
    // 2. Clean up streetworks table (supervisor review queue)
    console.log('\n🧹 Cleaning streetworks table...');
    
    const { data: streetworks, error: streetworksError } = await supabase
      .from('streetworks')
      .select('id, latitude, longitude, sm_area_name, sm_street_name, sm_highway_authority');
    
    if (streetworksError) {
      throw new Error(`Failed to fetch streetworks: ${streetworksError.message}`);
    }
    
    console.log(`📊 Found ${streetworks.length} total streetworks`);
    
    const streetworksToDelete = [];
    const streetworksToKeep = [];
    
    for (const streetwork of streetworks) {
      let isRelevant = false;
      
      // Check coordinates
      if (streetwork.latitude && streetwork.longitude) {
        isRelevant = isInNorthEastRegion(streetwork.latitude, streetwork.longitude);
      }
      
      // Check location names if coordinates don't match
      if (!isRelevant) {
        const locationText = [
          streetwork.sm_area_name,
          streetwork.sm_street_name,
          streetwork.sm_highway_authority
        ].filter(Boolean).join(' ').toLowerCase();
        
        const northEastKeywords = [
          'newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland',
          'north tyneside', 'south tyneside', 'northumberland county council'
        ];
        
        isRelevant = northEastKeywords.some(keyword => locationText.includes(keyword));
      }
      
      if (isRelevant) {
        streetworksToKeep.push(streetwork.id);
      } else {
        streetworksToDelete.push(streetwork.id);
      }
    }
    
    console.log(`📊 Streetworks analysis:`);
    console.log(`   ✅ Keep (North East): ${streetworksToKeep.length}`);
    console.log(`   🗑️  Delete (Outside NE): ${streetworksToDelete.length}`);
    
    // Delete streetworks in batches
    if (streetworksToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${streetworksToDelete.length} non-North East streetworks...`);
      
      const batchSize = 100;
      let streetworksDeletedCount = 0;
      
      for (let i = 0; i < streetworksToDelete.length; i += batchSize) {
        const batch = streetworksToDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('streetworks')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting streetworks batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
        } else {
          streetworksDeletedCount += batch.length;
          console.log(`🗑️  Deleted streetworks batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records (${streetworksDeletedCount}/${streetworksToDelete.length})`);
        }
      }
      
      console.log(`✅ streetworks cleanup complete: ${streetworksDeletedCount} deleted, ${streetworksToKeep.length} kept`);
    } else {
      console.log('✅ No cleanup needed for streetworks table');
    }
    
    // Summary
    const totalDeleted = (toDelete.length) + (streetworksToDelete.length);
    const totalKept = (toKeep.length) + (streetworksToKeep.length);
    
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`📧 Street Manager Notifications: ${toDelete.length} deleted, ${toKeep.length} kept`);
    console.log(`🏗️  Streetworks (Review Queue): ${streetworksToDelete.length} deleted, ${streetworksToKeep.length} kept`);
    console.log(`\n🏁 TOTAL: ${totalDeleted} records deleted, ${totalKept} records kept`);
    
    if (totalDeleted > 0) {
      console.log('\n✨ Database cleanup completed successfully!');
      console.log('🎯 Go BARRY is now optimized for North East England operations');
    } else {
      console.log('\n✅ Database was already clean - no changes needed');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
main();