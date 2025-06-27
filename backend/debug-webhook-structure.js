// Debug webhook data structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugWebhookData() {
  console.log('🔍 Debugging webhook data structure...\n');
  
  const { data: notifications } = await supabase
    .from('streetmanager_notifications')
    .select('*')
    .order('webhook_received_at', { ascending: false })
    .limit(3);

  if (notifications && notifications.length > 0) {
    console.log('📋 Latest notification raw data:');
    const latest = notifications[0];
    
    console.log('Notification ID:', latest.notification_id);
    console.log('Event Type:', latest.webhook_event_type);
    console.log('Raw webhook data keys:', Object.keys(latest.raw_webhook_data || {}));
    
    if (latest.raw_webhook_data) {
      console.log('\n🏗️ Full raw webhook structure:');
      console.log(JSON.stringify(latest.raw_webhook_data, null, 2));
      
      if (latest.raw_webhook_data.object_data) {
        console.log('\n📍 Object data keys:', Object.keys(latest.raw_webhook_data.object_data));
        
        // Look for location fields
        const objectData = latest.raw_webhook_data.object_data;
        console.log('\n🗺️ Location-related fields:');
        Object.keys(objectData).forEach(key => {
          if (key.toLowerCase().includes('location') || 
              key.toLowerCase().includes('street') || 
              key.toLowerCase().includes('area') ||
              key.toLowerCase().includes('address')) {
            console.log(`   ${key}: ${objectData[key]}`);
          }
        });
      }
    }
  }
}

debugWebhookData();
