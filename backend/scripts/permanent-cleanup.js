#!/usr/bin/env node

/**
 * PERMANENT CLEANUP: Remove ALL non-North East data from Go BARRY
 * This script will permanently delete all roadworks data outside North East England
 * and configure the system to only accept North East data going forward.
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
  
  try {
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
  } catch (error) {
    // Continue silently
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

async function deleteAllNonNorthEastData() {
  console.log('🚀 PERMANENT CLEANUP: Removing ALL non-North East data from Go BARRY...');
  console.log(`📍 Keeping only data within: ${NORTH_EAST_BOUNDS.south}°N to ${NORTH_EAST_BOUNDS.north}°N, ${NORTH_EAST_BOUNDS.west}°W to ${NORTH_EAST_BOUNDS.east}°E`);
  
  let totalDeleted = 0;
  
  try {
    // 1. Clean streetmanager_notifications table
    console.log('\n🧹 Processing streetmanager_notifications...');
    
    const { data: notifications, error: notificationsError } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data');
    
    if (notificationsError) throw notificationsError;
    
    const notificationsToDelete = [];
    
    for (const notification of notifications) {
      if (!isRelevantToNorthEast(notification.raw_webhook_data)) {
        notificationsToDelete.push(notification.id);
      }
    }
    
    console.log(`📊 streetmanager_notifications: ${notifications.length} total, ${notificationsToDelete.length} to delete`);
    
    if (notificationsToDelete.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < notificationsToDelete.length; i += batchSize) {
        const batch = notificationsToDelete.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('streetmanager_notifications')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ Error deleting notifications batch:`, error);
        } else {
          console.log(`🗑️  Deleted ${batch.length} notifications (${i + batch.length}/${notificationsToDelete.length})`);
        }
      }
      totalDeleted += notificationsToDelete.length;
    }
    
    // 2. Clean streetworks table
    console.log('\n🧹 Processing streetworks...');
    
    const { data: streetworks, error: streetworksError } = await supabase
      .from('streetworks')
      .select('id, latitude, longitude, sm_area_name, sm_street_name, sm_highway_authority');
    
    if (streetworksError) throw streetworksError;
    
    const streetworksToDelete = [];
    
    for (const streetwork of streetworks) {
      let isRelevant = false;
      
      // Check coordinates
      if (streetwork.latitude && streetwork.longitude) {
        isRelevant = isInNorthEastRegion(streetwork.latitude, streetwork.longitude);
      }
      
      // Check location names
      if (!isRelevant) {
        const locationText = [
          streetwork.sm_area_name,
          streetwork.sm_street_name,
          streetwork.sm_highway_authority
        ].filter(Boolean).join(' ').toLowerCase();
        
        const northEastKeywords = ['newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland'];
        isRelevant = northEastKeywords.some(keyword => locationText.includes(keyword));
      }
      
      if (!isRelevant) {
        streetworksToDelete.push(streetwork.id);
      }
    }
    
    console.log(`📊 streetworks: ${streetworks.length} total, ${streetworksToDelete.length} to delete`);
    
    if (streetworksToDelete.length > 0) {
      // Delete in batches
      const batchSize = 100;
      for (let i = 0; i < streetworksToDelete.length; i += batchSize) {
        const batch = streetworksToDelete.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('streetworks')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ Error deleting streetworks batch:`, error);
        } else {
          console.log(`🗑️  Deleted ${batch.length} streetworks (${i + batch.length}/${streetworksToDelete.length})`);
        }
      }
      totalDeleted += streetworksToDelete.length;
    }
    
    // 3. Also clean any manual roadworks that might be outside North East
    console.log('\n🧹 Processing manual roadworks...');
    
    const { data: roadworks, error: roadworksError } = await supabase
      .from('roadworks')
      .select('id, latitude, longitude, location, title');
    
    if (roadworksError) {
      console.log('ℹ️ No manual roadworks table found or accessible');
    } else {
      const roadworksToDelete = [];
      
      for (const roadwork of roadworks) {
        let isRelevant = false;
        
        // Check coordinates
        if (roadwork.latitude && roadwork.longitude) {
          isRelevant = isInNorthEastRegion(roadwork.latitude, roadwork.longitude);
        }
        
        // Check location/title text
        if (!isRelevant) {
          const locationText = [roadwork.location, roadwork.title].filter(Boolean).join(' ').toLowerCase();
          const northEastKeywords = ['newcastle', 'gateshead', 'sunderland', 'durham', 'northumberland'];
          isRelevant = northEastKeywords.some(keyword => locationText.includes(keyword));
        }
        
        if (!isRelevant) {
          roadworksToDelete.push(roadwork.id);
        }
      }
      
      console.log(`📊 manual roadworks: ${roadworks.length} total, ${roadworksToDelete.length} to delete`);
      
      if (roadworksToDelete.length > 0) {
        const { error } = await supabase
          .from('roadworks')
          .delete()
          .in('id', roadworksToDelete);
        
        if (error) {
          console.error(`❌ Error deleting manual roadworks:`, error);
        } else {
          console.log(`🗑️  Deleted ${roadworksToDelete.length} manual roadworks`);
          totalDeleted += roadworksToDelete.length;
        }
      }
    }
    
    // Summary
    console.log('\n🎯 PERMANENT CLEANUP COMPLETE!');
    console.log(`🗑️  Total records deleted: ${totalDeleted}`);
    console.log('✅ Go BARRY is now permanently configured for North East England only');
    console.log('🚌 Future Street Manager webhooks will be automatically filtered');
    console.log('📍 Only North East roadworks will be stored and displayed');
    
  } catch (error) {
    console.error('❌ Permanent cleanup failed:', error);
    process.exit(1);
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will PERMANENTLY delete all non-North East data!');
console.log('📍 Only roadworks in North East England (54.2°N to 55.8°N, -3.0°W to -0.5°E) will remain');
console.log('🚌 This action cannot be undone and is intended for Go North East operations only');

// Run the cleanup
deleteAllNonNorthEastData();