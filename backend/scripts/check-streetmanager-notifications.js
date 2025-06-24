// Check StreetManager notifications in Supabase
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkStreetManagerNotifications() {
  console.log('🔍 Checking StreetManager notifications in Supabase...\n');

  try {
    // 1. Get total count
    const { count: totalCount } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total notifications in database: ${totalCount || 0}`);

    if (totalCount === 0) {
      console.log('\n❌ No StreetManager notifications found in the database.');
      console.log('\n📝 This could mean:');
      console.log('   1. The webhook hasn\'t been registered with DfT yet');
      console.log('   2. The webhook URL isn\'t receiving notifications');
      console.log('   3. There haven\'t been any roadworks in your area');
      console.log('\n🔗 Webhook endpoint: https://go-barry.onrender.com/api/streetmanager/webhook');
      return;
    }

    // 2. Get recent notifications (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: recentNotifications, count: recentCount } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .gte('webhook_received_at', weekAgo.toISOString())
      .order('webhook_received_at', { ascending: false })
      .limit(5);

    console.log(`\n📅 Notifications in last 7 days: ${recentCount || 0}`);

    if (recentNotifications && recentNotifications.length > 0) {
      console.log('\n🔔 Recent notifications:');
      recentNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title || 'No title'}`);
        console.log(`   ID: ${notif.notification_id}`);
        console.log(`   Type: ${notif.webhook_event_type || 'Unknown'}`);
        console.log(`   Street: ${notif.street_name || 'Not specified'}`);
        console.log(`   Area: ${notif.area_name || 'Not specified'}`);
        console.log(`   Status: ${notif.processing_status}`);
        console.log(`   Received: ${new Date(notif.webhook_received_at).toLocaleString()}`);
      });
    }

    // 3. Get processing statistics
    const { data: statusStats } = await supabase
      .from('streetmanager_notifications')
      .select('processing_status');

    const statusCounts = {};
    if (statusStats) {
      statusStats.forEach(row => {
        const status = row.processing_status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    }

    console.log('\n📈 Processing status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // 4. Get last notification
    const { data: lastNotification } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .order('webhook_received_at', { ascending: false })
      .limit(1)
      .single();

    if (lastNotification) {
      console.log('\n⏰ Last notification received:');
      console.log(`   ${new Date(lastNotification.webhook_received_at).toLocaleString()}`);
      console.log(`   ${lastNotification.title || 'No title'}`);
    }

    // 5. Check for notifications with coordinates
    const { count: withCoords } = await supabase
      .from('streetmanager_notifications')
      .select('*', { count: 'exact', head: true })
      .not('coordinates', 'is', null);

    console.log(`\n📍 Notifications with coordinates: ${withCoords || 0} (${totalCount ? Math.round((withCoords / totalCount) * 100) : 0}%)`);

    // 6. Test the webhook endpoint
    console.log('\n🌐 Testing webhook endpoint...');
    try {
      const response = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook/status');
      const status = await response.json();
      console.log('   ✅ Webhook endpoint is accessible');
      console.log(`   Status: ${status.webhook?.ready ? 'Ready' : 'Not ready'}`);
    } catch (error) {
      console.log('   ❌ Could not reach webhook endpoint');
      console.log(`   Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  }
}

// Run the check
checkStreetManagerNotifications();
