import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkStreetworksData() {
  console.log('🔍 Checking streetworks table data...\n');
  
  try {
    // Get total count
    const { count, error: countError } = await supabase
      .from('streetworks')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error getting count:', countError);
      return;
    }
    
    console.log(`📊 Total streetworks records: ${count}`);
    
    // Get recent records
    const { data, error } = await supabase
      .from('streetworks')
      .select(`
        id, sm_reference, sm_permit_reference, sm_promoter_name,
        sm_works_description, sm_location_description, sm_street_name,
        sm_start_date, sm_end_date, webhook_received_at, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('❌ Error getting data:', error);
      return;
    }
    
    console.log(`\n📋 Recent ${data.length} streetworks records:`);
    console.log('=' .repeat(80));
    
    data.forEach((record, i) => {
      console.log(`\n${i + 1}. ID: ${record.id}`);
      console.log(`   Reference: ${record.sm_reference}`);
      console.log(`   Promoter: ${record.sm_promoter_name}`);
      console.log(`   Description: ${record.sm_works_description?.substring(0, 80)}...`);
      console.log(`   Location: ${record.sm_location_description}`);
      console.log(`   Street: ${record.sm_street_name}`);
      console.log(`   Dates: ${record.sm_start_date} to ${record.sm_end_date}`);
      console.log(`   Webhook: ${record.webhook_received_at}`);
      console.log(`   Created: ${record.created_at}`);
    });
    
    // Check for any records from today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData, error: todayError } = await supabase
      .from('streetworks')
      .select('id, webhook_received_at')
      .gte('webhook_received_at', `${today}T00:00:00`)
      .order('webhook_received_at', { ascending: false });
    
    if (!todayError) {
      console.log(`\n📅 Records from today (${today}): ${todayData.length}`);
      if (todayData.length > 0) {
        console.log('   Latest:', todayData[0].webhook_received_at);
      }
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

checkStreetworksData();