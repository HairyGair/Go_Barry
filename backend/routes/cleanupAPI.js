// Cleanup API Routes
// Provides endpoints for data maintenance and cleanup operations

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { parseLineStringToBNG, parsePointToBNG } from '../utils/bngToLatLng.js';

const router = express.Router();
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
      console.warn('Error parsing works_location_coordinates:', error);
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
      console.warn('Error parsing works_coordinates:', error);
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

// Analyze Street Manager data without deleting
router.get('/analyze-street-manager', async (req, res) => {
  try {
    console.log('🔍 Analyzing Street Manager data...');
    
    // Get sample of notifications
    const { data: notifications, error } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data, webhook_received_at')
      .limit(1000); // Limit for performance
    
    if (error) throw error;
    
    let northEastCount = 0;
    let outsideCount = 0;
    const samples = { northEast: [], outside: [] };
    
    for (const notification of notifications) {
      const isRelevant = isRelevantToNorthEast(notification.raw_webhook_data);
      
      if (isRelevant) {
        northEastCount++;
        if (samples.northEast.length < 3) {
          const coords = parseCoordinates(notification.raw_webhook_data);
          samples.northEast.push({
            id: notification.id,
            location: notification.raw_webhook_data?.object_data?.area_name || 'Unknown',
            coordinates: coords
          });
        }
      } else {
        outsideCount++;
        if (samples.outside.length < 3) {
          const coords = parseCoordinates(notification.raw_webhook_data);
          samples.outside.push({
            id: notification.id,
            location: notification.raw_webhook_data?.object_data?.area_name || 'Unknown',
            coordinates: coords
          });
        }
      }
    }
    
    res.json({
      success: true,
      analysis: {
        total: notifications.length,
        northEast: northEastCount,
        outside: outsideCount,
        percentageOutside: Math.round((outsideCount / notifications.length) * 100),
        samples,
        bounds: NORTH_EAST_BOUNDS
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing Street Manager data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clean up Street Manager data (removes records outside North East)
router.post('/cleanup-street-manager', async (req, res) => {
  try {
    const { dryRun = true } = req.body; // Default to dry run for safety
    
    console.log(`🧹 ${dryRun ? 'DRY RUN' : 'ACTUAL'} cleanup of Street Manager data...`);
    
    // Get all notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('streetmanager_notifications')
      .select('id, raw_webhook_data');
    
    if (fetchError) throw fetchError;
    
    // Analyze notifications
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
    
    let deletedCount = 0;
    
    if (!dryRun && toDelete.length > 0) {
      // Actually delete in batches
      const batchSize = 50;
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('streetmanager_notifications')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting batch:`, deleteError);
        } else {
          deletedCount += batch.length;
        }
      }
    }
    
    res.json({
      success: true,
      result: {
        dryRun,
        total: notifications.length,
        toDelete: toDelete.length,
        toKeep: toKeep.length,
        actuallyDeleted: deletedCount,
        percentageToDelete: Math.round((toDelete.length / notifications.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('❌ Error cleaning up Street Manager data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;