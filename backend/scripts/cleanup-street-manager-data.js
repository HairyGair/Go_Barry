#!/usr/bin/env node

/**
 * Cleanup Script: Remove Street Manager data outside North East England
 * 
 * This script removes all Street Manager webhook notifications and processed
 * roadworks that are outside the Go North East operating area.
 * 
 * North East England bounds:
 * - North: 55.8° (Scottish border)
 * - South: 54.2° (Yorkshire border) 
 * - East: -0.5° (North Sea coast)
 * - West: -3.0° (Cumbrian border)
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
    const coordinates = parseLineStringToBNG(objectData.works_location_coordinates);
    if (coordinates && coordinates.length > 0) {
      return { lat: coordinates[0].lat, lng: coordinates[0].lng };
    }
  }
  
  // Try to parse from works_coordinates
  if (objectData.works_coordinates) {
    const point = parsePointToBNG(objectData.works_coordinates);
    if (point) {
      return { lat: point.lat, lng: point.lng };
    }
  }
  
  // Try direct easting/northing
  if (objectData.easting && objectData.northing) {
    const point = parsePointToBNG(`POINT(${objectData.easting} ${objectData.northing})`);
    if (point) {
      return { lat: point.lat, lng: point.lng };
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

/**
 * Clean up streetmanager_notifications table
 */
async function cleanupStreetManagerNotifications() {
  console.log('🧹 Starting cleanup of streetmanager_notifications...');
  
  try {
    // First, get all notifications to analyze
    const { data: allNotifications, error: fetchError } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data, webhook_received_at');
    
    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }
    
    console.log(`📊 Found ${allNotifications.length} total notifications`);
    
    // Analyze each notification
    const toDelete = [];
    const toKeep = [];
    
    for (const notification of allNotifications) {
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
    
    if (toDelete.length === 0) {
      console.log('✅ No cleanup needed - all notifications are North East relevant');
      return { deleted: 0, kept: toKeep.length };
    }
    
    // Delete non-relevant notifications in batches
    const batchSize = 50;
    let totalDeleted = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('streetmanager_notifications')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
      } else {
        totalDeleted += batch.length;
        console.log(`🗑️  Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} notifications`);
      }
    }
    
    console.log(`✅ Cleanup complete: ${totalDeleted} notifications deleted, ${toKeep.length} kept`);
    return { deleted: totalDeleted, kept: toKeep.length };
    
  } catch (error) {
    console.error('❌ Error cleaning up streetmanager_notifications:', error);
    throw error;
  }
}

/**
 * Clean up streetworks table (V2 supervisor review queue)
 */
async function cleanupStreetworks() {
  console.log('🧹 Starting cleanup of streetworks table...');
  
  try {
    // Get all streetworks with coordinates
    const { data: allStreetworks, error: fetchError } = await supabase
      .from('streetworks')
      .select('id, latitude, longitude, sm_area_name, sm_street_name, sm_highway_authority');
    
    if (fetchError) {
      throw new Error(`Failed to fetch streetworks: ${fetchError.message}`);
    }
    
    console.log(`📊 Found ${allStreetworks.length} total streetworks`);
    
    // Analyze each streetwork
    const toDelete = [];
    const toKeep = [];
    
    for (const streetwork of allStreetworks) {
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
        toKeep.push(streetwork.id);
      } else {
        toDelete.push(streetwork.id);
      }
    }
    
    console.log(`📊 Analysis complete:`);
    console.log(`   ✅ Keep (North East): ${toKeep.length}`);
    console.log(`   🗑️  Delete (Outside NE): ${toDelete.length}`);
    
    if (toDelete.length === 0) {
      console.log('✅ No cleanup needed - all streetworks are North East relevant');
      return { deleted: 0, kept: toKeep.length };
    }
    
    // Delete non-relevant streetworks in batches
    const batchSize = 50;
    let totalDeleted = 0;
    
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('streetworks')
        .delete()
        .in('id', batch);
      
      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
      } else {
        totalDeleted += batch.length;
        console.log(`🗑️  Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} streetworks`);
      }
    }
    
    console.log(`✅ Cleanup complete: ${totalDeleted} streetworks deleted, ${toKeep.length} kept`);
    return { deleted: totalDeleted, kept: toKeep.length };
    
  } catch (error) {
    console.error('❌ Error cleaning up streetworks:', error);
    throw error;
  }
}

/**
 * Main cleanup function
 */
async function main() {
  console.log('🚀 Starting Street Manager data cleanup for North East England...');
  console.log(`📍 North East bounds: ${NORTH_EAST_BOUNDS.south}°N to ${NORTH_EAST_BOUNDS.north}°N, ${NORTH_EAST_BOUNDS.west}°W to ${NORTH_EAST_BOUNDS.east}°E`);
  
  try {
    // Cleanup streetmanager_notifications
    const notificationsResult = await cleanupStreetManagerNotifications();
    
    // Cleanup streetworks
    const streetworksResult = await cleanupStreetworks();
    
    // Summary
    console.log('\n🎯 CLEANUP SUMMARY:');
    console.log(`📧 Street Manager Notifications:`);
    console.log(`   🗑️  Deleted: ${notificationsResult.deleted}`);
    console.log(`   ✅ Kept: ${notificationsResult.kept}`);
    console.log(`🏗️  Streetworks (Review Queue):`);
    console.log(`   🗑️  Deleted: ${streetworksResult.deleted}`);
    console.log(`   ✅ Kept: ${streetworksResult.kept}`);
    
    const totalDeleted = notificationsResult.deleted + streetworksResult.deleted;
    const totalKept = notificationsResult.kept + streetworksResult.kept;
    
    console.log(`\n🏁 TOTAL: ${totalDeleted} records deleted, ${totalKept} records kept`);
    console.log('✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
main();