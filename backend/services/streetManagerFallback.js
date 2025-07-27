// backend/services/streetManagerFallback.js
// Fallback data source for StreetManager when webhooks aren't working

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy load Supabase client only when needed
let supabase = null;
async function getSupabaseClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

/**
 * Load fallback StreetManager data when webhooks aren't working
 * This uses a combination of cached JSON data and simulated webhook entries
 */
export async function loadStreetManagerFallback() {
  console.log('🔄 Loading StreetManager fallback data...');
  
  try {
    // 1. Try to load from local fallback file (priority method)
    const fallbackPath = path.join(__dirname, '../data/streetmanager_fallback.json');
    let fallbackData = [];
    
    try {
      const fileContent = await fs.readFile(fallbackPath, 'utf8');
      const parsedContent = JSON.parse(fileContent);
      // Handle different JSON file structures
      if (Array.isArray(parsedContent)) {
        fallbackData = parsedContent;
      } else if (parsedContent.data && Array.isArray(parsedContent.data)) {
        fallbackData = parsedContent.data;
      } else {
        fallbackData = [];
      }
      console.log(`📁 Loaded ${fallbackData.length} fallback records from JSON file`);
      
      // Return immediately if we have data from JSON
      if (fallbackData.length > 0) {
        console.log(`✅ Using ${fallbackData.length} records from JSON fallback file`);
        return {
          success: true,
          count: fallbackData.length,
          source: 'json_fallback',
          lastUpdate: new Date().toISOString(),
          data: fallbackData
        };
      }
      
    } catch (fileError) {
      console.log('📁 No fallback file found, creating sample data...');
      fallbackData = createSampleStreetManagerData();
      
      // Save sample data for future use
      try {
        await fs.writeFile(fallbackPath, JSON.stringify({ 
          data: fallbackData, 
          timestamp: Date.now(), 
          lastUpdate: new Date().toISOString(),
          count: fallbackData.length,
          source: 'generated_sample' 
        }, null, 2));
        console.log(`💾 Saved ${fallbackData.length} sample records to fallback file`);
        
        // Return the generated data
        return {
          success: true,
          count: fallbackData.length,
          source: 'generated_sample',
          lastUpdate: new Date().toISOString(),
          data: fallbackData
        };
      } catch (saveError) {
        console.warn('⚠️ Failed to save sample data:', saveError.message);
        // Still return the generated data even if we can't save it
        return {
          success: true,
          count: fallbackData.length,
          source: 'generated_sample_unsaved',
          lastUpdate: new Date().toISOString(),
          data: fallbackData
        };
      }
    }
    
    // If we reach here, no data was found anywhere
    console.log('❌ No fallback data available from any source');
    return {
      success: false,
      count: 0,
      source: 'none',
      error: 'No fallback data available',
      data: []
    };
    
  } catch (error) {
    console.error('❌ Error loading StreetManager fallback:', error);
    return {
      success: false,
      error: error.message,
      count: 0,
      data: []
    };
  }
}

/**
 * Check webhook health (simplified version)
 */
export async function checkWebhookHealth() {
  // Simplified health check - always return that we should use fallback for now
  return {
    healthy: false,
    recentCount: 0,
    shouldUseFallback: true,
    lastReceived: null
  };
}

/**
 * Create sample StreetManager data for North East England
 */
function createSampleStreetManagerData() {
  const sampleLocations = [
    {
      street: 'Grey Street',
      area: 'Newcastle City Centre',
      town: 'Newcastle upon Tyne',
      coords: { lat: 54.9738, lng: -1.6131 },
      usrn: '25001234',
      routes: ['1', '2', '21', 'Q3']
    },
    {
      street: 'High Street',
      area: 'Gateshead',
      town: 'Gateshead',
      coords: { lat: 54.9590, lng: -1.6030 },
      usrn: '40005678',
      routes: ['56', '57', '58']
    },
    {
      street: 'Fawcett Street',
      area: 'Sunderland City Centre',
      town: 'Sunderland',
      coords: { lat: 54.9069, lng: -1.3838 },
      usrn: '38009012',
      routes: ['99', '700', '39']
    },
    {
      street: 'Northumberland Street',
      area: 'Newcastle City Centre',
      town: 'Newcastle upon Tyne',
      coords: { lat: 54.9752, lng: -1.6142 },
      usrn: '25003456',
      routes: ['1', '2', '21', 'X21', '307']
    },
    {
      street: 'A19 Tyne Tunnel Approach',
      area: 'Howdon',
      town: 'North Shields',
      coords: { lat: 54.9858, lng: -1.5103 },
      usrn: '26007890',
      routes: ['307', '309', '310']
    }
  ];
  
  const workTypes = [
    { type: 'Utility Works', category: 'standard', severity: 'medium', emergency: false },
    { type: 'Road Resurfacing', category: 'major', severity: 'high', emergency: false },
    { type: 'Emergency Gas Repair', category: 'immediate_urgent', severity: 'critical', emergency: true },
    { type: 'Water Main Replacement', category: 'major', severity: 'high', emergency: false },
    { type: 'Traffic Signal Maintenance', category: 'minor', severity: 'low', emergency: false }
  ];
  
  const trafficManagement = [
    'lane_closure',
    'multi_way_signals', 
    'give_and_take',
    'some_carriageway_incursion',
    'contraflow'
  ];
  
  const promoters = [
    'Northumbrian Water',
    'Network Rail',
    'Newcastle City Council',
    'Gateshead Council',
    'Northern Gas Networks'
  ];
  
  const sampleData = [];
  
  sampleLocations.forEach((location, index) => {
    workTypes.forEach((work, workIndex) => {
      if (Math.random() > 0.6) return; // Only create ~40% of possible combinations
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 15); // ±15 days from now
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-14 days duration
      
      const notificationId = `fallback_sm_${index}_${workIndex}_${Date.now()}`;
      const permitRef = `SM${String(index).padStart(2, '0')}${String(workIndex).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      
      const record = {
        notification_id: notificationId,
        title: `${work.type} - ${location.street}`,
        description: `${work.type} affecting ${location.routes.join(', ')} bus routes in ${location.area}`,
        location_description: `${location.street}, ${location.area}, ${location.town}`,
        street_name: location.street,
        area_name: location.area,
        town: location.town,
        usrn: location.usrn,
        coordinates: location.coords,
        work_category_ref: work.category,
        activity_type: work.type,
        is_emergency_works: work.emergency,
        is_traffic_sensitive: location.routes.length > 2 ? 'Yes' : 'No',
        traffic_management_type: trafficManagement[Math.floor(Math.random() * trafficManagement.length)],
        severity: work.severity,
        alert_status: work.severity === 'critical' ? 'red' : work.severity === 'high' ? 'red' : 'amber',
        proposed_start_date: startDate.toISOString(),
        proposed_end_date: endDate.toISOString(),
        permit_reference_number: permitRef,
        highway_authority: `${location.town.split(' ')[0]} Council`,
        promoter_organisation: promoters[Math.floor(Math.random() * promoters.length)],
        webhook_event_type: 'FALLBACK_DATA',
        raw_webhook_data: {
          source: 'fallback',
          object_data: {
            permit_reference_number: permitRef,
            street_name: location.street,
            area_name: location.area,
            town: location.town,
            usrn: location.usrn,
            work_category_ref: work.category,
            activity_type: work.type,
            is_emergency_works: work.emergency,
            is_traffic_sensitive: location.routes.length > 2 ? 'Yes' : 'No',
            traffic_management_type: trafficManagement[Math.floor(Math.random() * trafficManagement.length)],
            proposed_start_date: startDate.toISOString(),
            proposed_end_date: endDate.toISOString(),
            highway_authority: `${location.town.split(' ')[0]} Council`,
            promoter_organisation: promoters[Math.floor(Math.random() * promoters.length)]
          }
        },
        processing_status: 'processed',
        processed_at: new Date().toISOString(),
        webhook_received_at: new Date().toISOString(),
        
        // Additional computed fields for frontend
        affected_routes: location.routes,
        affected_routes_count: location.routes.length,
        auto_matched_routes: location.routes,
        hasRouteImpact: true,
        mlSeverity: work.severity === 'critical' ? 4 : work.severity === 'high' ? 3 : 2,
        enhancedProcessing: true,
        fallbackData: true
      };
      
      sampleData.push(record);
    });
  });
  
  return sampleData;
}


export default {
  loadStreetManagerFallback,
  checkWebhookHealth
};