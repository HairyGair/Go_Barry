// Check actual Supabase data format
import axios from 'axios';

async function checkSupabaseFormat() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase env vars');
    return;
  }
  
  try {
    console.log('🔍 Fetching sample Supabase record...');
    
    const response = await axios.get(`${supabaseUrl}/rest/v1/streetworks`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      params: {
        limit: 1
      }
    });
    
    const record = response.data[0];
    console.log('\n📋 Sample record structure:');
    console.log('Keys:', Object.keys(record));
    
    console.log('\n🗺️ Coordinate-related fields:');
    console.log('- latitude:', record.latitude);
    console.log('- longitude:', record.longitude);
    console.log('- works_location_coordinates:', record.works_location_coordinates?.substring(0, 100) + '...');
    console.log('- raw_webhook_data exists:', !!record.raw_webhook_data);
    
    if (record.raw_webhook_data) {
      console.log('- raw_webhook_data.object_data exists:', !!record.raw_webhook_data.object_data);
      if (record.raw_webhook_data.object_data) {
        console.log('- webhook works_location_coordinates:', record.raw_webhook_data.object_data.works_location_coordinates?.substring(0, 100) + '...');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSupabaseFormat();
