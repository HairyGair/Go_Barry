import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testQuery() {
  console.log('Testing streetworks query...');
  
  try {
    const { data, error } = await supabase
      .from('streetworks')
      .select(`
        id, sm_reference, sm_permit_reference, sm_promoter_name, 
        sm_works_description, sm_works_category, sm_traffic_sensitive,
        sm_highway_authority, sm_works_state, sm_location_description,
        sm_street_name, sm_area_name, sm_easting, sm_northing,
        sm_start_date, sm_end_date, sm_actual_start_date, sm_actual_end_date,
        sm_traffic_management_type, latitude, longitude, severity, 
        webhook_received_at, raw_webhook_data, status, 
        auto_matched_routes, confirmed_routes, created_at, updated_at
      `)
      .order('webhook_received_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('Query error:', error);
    } else {
      console.log('Query success! Found', data.length, 'records');
      if (data.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

testQuery();