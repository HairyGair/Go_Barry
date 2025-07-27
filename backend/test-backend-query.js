import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testing the EXACT query that the backend uses...\n');

// Replicate the getSupabaseClient function
let supabase = null;
async function getSupabaseClient() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created via lazy loading');
  }
  return supabase;
}

async function testBackendQuery() {
  try {
    console.log('🔍 Getting Supabase client (like backend does)...');
    const supabaseClient = await getSupabaseClient();
    
    if (!supabaseClient) {
      console.log('❌ Supabase client not available');
      return;
    }
    console.log('✅ Supabase client ready');
    
    console.log('🔍 Running streetworks query (exact same as backend)...');
    
    // This is the EXACT query from the backend
    const streetworksQuery = supabaseClient
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
    
    console.log('🔍 Executing query with timeout...');
    
    // Test with timeout like the backend does
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    );
    
    const result = await Promise.race([streetworksQuery, timeout]);
    
    const { data, error } = result;
    
    if (error) {
      console.log('❌ Query error:', error);
    } else {
      console.log(`✅ Query successful! Found ${data.length} records`);
      console.log('📋 Sample record:');
      if (data[0]) {
        console.log(`   ID: ${data[0].id}`);
        console.log(`   Reference: ${data[0].sm_reference}`);
        console.log(`   Promoter: ${data[0].sm_promoter_name}`);
        console.log(`   Webhook: ${data[0].webhook_received_at}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Exception:', error.message);
    console.log('❌ Stack:', error.stack);
  }
}

testBackendQuery();