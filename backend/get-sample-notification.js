import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function getSampleNotification() {
  try {
    const { data } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .order('webhook_received_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Sample notification structure:');
    console.log('ID:', data.notification_id);
    console.log('Event Type:', data.webhook_event_type);
    console.log('Processing Status:', data.processing_status);
    console.log('Raw Webhook Data Keys:', Object.keys(data.raw_webhook_data || {}));
    console.log('Raw Data Sample:');
    console.log(JSON.stringify(data.raw_webhook_data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

getSampleNotification();
