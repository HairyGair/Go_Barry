import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugStreetworksData() {
  console.log('🔍 Debugging streetworks data and dates...\n');
  
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
    
    // Get date range analysis
    const { data: dateData, error: dateError } = await supabase
      .from('streetworks')
      .select('sm_start_date, sm_end_date')
      .not('sm_start_date', 'is', null)
      .order('sm_start_date', { ascending: true });
    
    if (dateError) {
      console.log('❌ Error getting date data:', dateError);
      return;
    }
    
    console.log(`\n📅 Date range analysis (${dateData.length} records with start dates):`);
    
    if (dateData.length > 0) {
      const earliest = dateData[0].sm_start_date;
      const latest = dateData[dateData.length - 1].sm_start_date;
      console.log(`   Earliest start: ${earliest}`);
      console.log(`   Latest start: ${latest}`);
    }
    
    // Check what's in next 28 days
    const now = new Date();
    const next28Days = new Date(now.getTime() + (28 * 24 * 60 * 60 * 1000));
    const nowISO = now.toISOString();
    const next28DaysISO = next28Days.toISOString();
    
    console.log(`\n🗓️ Checking for works in next 28 days:`);
    console.log(`   From: ${nowISO}`);
    console.log(`   To: ${next28DaysISO}`);
    
    // Test the current filter
    const { data: filteredData, error: filterError } = await supabase
      .from('streetworks')
      .select('id, sm_start_date, sm_end_date, sm_street_name, sm_works_description')
      .or(`and(sm_start_date.lte.${next28DaysISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null)),and(sm_start_date.lte.${nowISO},or(sm_end_date.gte.${nowISO},sm_end_date.is.null))`)
      .order('sm_start_date', { ascending: true });
    
    if (filterError) {
      console.log('❌ Filter error:', filterError);
      return;
    }
    
    console.log(`\n✅ Current 28-day filter returns: ${filteredData.length} records`);
    
    // Show some examples
    if (filteredData.length > 0) {
      console.log('\n📋 Sample filtered results:');
      filteredData.slice(0, 5).forEach((record, i) => {
        console.log(`   ${i + 1}. ${record.sm_street_name} - ${record.sm_start_date} to ${record.sm_end_date}`);
        console.log(`      ${record.sm_works_description?.substring(0, 60)}...`);
      });
    }
    
    // Check works starting this week
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const { data: weekData, error: weekError } = await supabase
      .from('streetworks')
      .select('id, sm_start_date, sm_street_name')
      .gte('sm_start_date', nowISO)
      .lte('sm_start_date', nextWeek.toISOString());
    
    if (!weekError) {
      console.log(`\n📅 Works starting in next 7 days: ${weekData.length}`);
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

debugStreetworksData();
