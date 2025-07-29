import axios from 'axios';
import dotenv from 'dotenv';
import { convertToAlerts } from './services/streetManager.js';

dotenv.config();

async function testIncidentsDirectly() {
  console.log('🔍 Testing incidents endpoint logic directly...');
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('📋 Querying streetworks table with axios...');
    
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      params: { limit: 50 },
      timeout: 10000
    });
    
    const streetworksData = response.data;
    console.log(`✅ Found ${streetworksData.length} records from Supabase`);
    
    // Filter active works
    const activeStreetworks = streetworksData.filter(item => {
      const isCompleted = item.sm_works_state === 'Works completed' || 
                        item.sm_works_state === 'completed' ||
                        item.sm_cancelled === true;
      const isExpired = item.sm_actual_end_date && new Date(item.sm_actual_end_date) < new Date();
      
      return !isCompleted && !isExpired;
    });
    
    console.log(`📋 Filtered to ${activeStreetworks.length} active roadworks`);
    
    // Transform data
    const transformedData = activeStreetworks.map(item => ({
      notification_id: item.sm_reference || item.id,
      title: item.sm_works_description || `${item.sm_works_category} works on ${item.sm_street_name}`,
      location_description: item.sm_location_description || `${item.sm_street_name}, ${item.sm_area_name}`,
      activity_type: item.sm_works_description || item.sm_works_category,
      actual_start_date_time: item.sm_actual_start_date || item.sm_start_date,
      proposed_end_date_time: item.sm_actual_end_date || item.sm_end_date,
      permit_reference_number: item.sm_permit_reference || item.sm_reference,
      activity_location_coordinates: item.works_location_coordinates || 'POINT(0 0)',
      severity: item.severity || 'medium',
      webhook_received_at: item.webhook_received_at || item.created_at,
      status: item.sm_works_state || item.status || 'active',
      authority: item.sm_highway_authority || item.sm_promoter_name,
      works_description: item.sm_works_description,
      works_category: item.sm_works_category,
      street_name: item.sm_street_name,
      traffic_management: item.sm_traffic_management_type
    }));
    
    console.log('📋 Sample transformed data:');
    console.log(JSON.stringify(transformedData[0], null, 2));
    
    // Convert to alerts
    const allAlerts = convertToAlerts(transformedData);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const currentAlerts = allAlerts.filter(alert => {
      const startDate = new Date(alert.timestamp);
      return startDate <= sevenDaysFromNow;
    });
    
    console.log(`✅ Converted to ${allAlerts.length} total alerts, ${currentAlerts.length} current (next 7 days)`);
    
    if (currentAlerts.length > 0) {
      console.log('📋 Sample alert:');
      console.log({
        id: currentAlerts[0].id,
        type: currentAlerts[0].type,
        title: currentAlerts[0].title,
        location: currentAlerts[0].description,
        source: currentAlerts[0].source
      });
    }
    
    console.log('\n✅ SUCCESS: Real Supabase data can be converted to alerts!');
    console.log(`🎯 Result: ${currentAlerts.length} alerts ready for Roadworks Manager`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📊 Details:', error.response?.data || error);
  }
}

testIncidentsDirectly();