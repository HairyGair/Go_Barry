// Test if Street Manager webhook data exists in Supabase
// Run this as: node test-streetmanager-supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testStreetManagerData() {
  console.log('🔍 Testing Street Manager webhook data in Supabase...\n');
  
  try {
    // 1. Check streetmanager_notifications table (where webhooks save data)
    console.log('1️⃣ Checking streetmanager_notifications table...');
    const { data: notifications, error: notifError } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .order('webhook_received_at', { ascending: false })
      .limit(10);
    
    if (notifError) {
      console.error('❌ Error querying streetmanager_notifications:', notifError);
      
      // Check if table exists
      if (notifError.message?.includes('relation') && notifError.message?.includes('does not exist')) {
        console.log('\n💡 TABLE MISSING: streetmanager_notifications table does not exist!');
        console.log('🔧 SOLUTION: Create the table in Supabase:');
        console.log(`
CREATE TABLE streetmanager_notifications (
  notification_id TEXT PRIMARY KEY,
  webhook_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_webhook_data JSONB,
  webhook_event_type TEXT,
  title TEXT,
  description TEXT,
  street_name TEXT,
  area_name TEXT,
  location_description TEXT,
  coordinates JSONB,
  permit_reference_number TEXT,
  activity_reference_number TEXT,
  work_category TEXT,
  highway_authority TEXT,
  promoter_organisation TEXT,
  proposed_start_date TIMESTAMPTZ,
  proposed_end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  permit_status TEXT,
  work_status TEXT,
  activity_status TEXT,
  severity TEXT DEFAULT 'Medium',
  alert_status TEXT DEFAULT 'amber',
  processing_status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ
);
        `);
        return;
      }
    } else {
      console.log(`✅ Found ${notifications.length} Street Manager notifications`);
      
      if (notifications.length > 0) {
        console.log('\n📋 Latest notification details:');
        const latest = notifications[0];
        console.log('   ID:', latest.notification_id);
        console.log('   Event Type:', latest.webhook_event_type);
        console.log('   Received At:', latest.webhook_received_at);
        console.log('   Location:', latest.street_name || latest.area_name || 'Unknown');
        console.log('   Processing Status:', latest.processing_status);
        console.log('   Has Coordinates:', !!latest.coordinates);
        console.log('   Has Raw Data:', !!latest.raw_webhook_data);
        
        // Show a few more for context
        if (notifications.length > 1) {
          console.log(`\n📊 Recent ${Math.min(5, notifications.length)} notifications:`);
          notifications.slice(0, 5).forEach((notif, i) => {
            console.log(`   ${i+1}. ${notif.webhook_event_type} - ${notif.street_name || 'No street'} (${notif.webhook_received_at?.substring(0, 19)})`);
          });
        }
      } else {
        console.log('❌ No notifications found - webhook might not be receiving data or saving incorrectly');
      }
    }
    
    // 2. Check roadworks table (where unified manager looks)
    console.log('\n2️⃣ Checking roadworks table for StreetManager data...');
    const { data: roadworks, error: roadworksError } = await supabase
      .from('roadworks')
      .select('*')
      .eq('source', 'StreetManager')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (roadworksError) {
      console.error('❌ Error querying roadworks table:', roadworksError);
    } else {
      console.log(`✅ Found ${roadworks.length} StreetManager roadworks in roadworks table`);
      
      if (roadworks.length > 0) {
        console.log('\n📋 Latest roadwork:');
        const latest = roadworks[0];
        console.log('   ID:', latest.id);
        console.log('   Title:', latest.title);
        console.log('   Source:', latest.source);
        console.log('   Location:', latest.location);
        console.log('   Coordinates:', latest.coordinates);
      }
    }
    
    // 3. Check traffic_alerts table
    console.log('\n3️⃣ Checking traffic_alerts table for StreetManager data...');
    const { data: alerts, error: alertsError } = await supabase
      .from('traffic_alerts')
      .select('*')
      .eq('source', 'StreetManager')
      .gte('expires_at', new Date().toISOString())
      .order('severity', { ascending: false })
      .limit(5);
    
    if (alertsError) {
      console.error('❌ Error querying traffic_alerts table:', alertsError);
    } else {
      console.log(`✅ Found ${alerts.length} StreetManager alerts in traffic_alerts table`);
    }
    
    // 4. Summary and diagnosis
    console.log('\n📊 DIAGNOSIS:');
    console.log(`   • Webhook notifications: ${notifications?.length || 0}`);
    console.log(`   • Processed roadworks: ${roadworks?.length || 0}`);
    console.log(`   • Traffic alerts: ${alerts?.length || 0}`);
    
    if ((notifications?.length || 0) > 0 && (roadworks?.length || 0) === 0) {
      console.log('\n🔧 ISSUE FOUND:');
      console.log('   ✅ Webhooks are being received and saved');
      console.log('   ❌ But webhook data is NOT being processed into roadworks/alerts');
      console.log('   💡 FIX: The webhook handler needs to process notifications into the roadworks table');
      console.log('   📝 Current: streetmanager_notifications → [missing step] → roadworks table');
      console.log('   🎯 Should be: streetmanager_notifications → process → roadworks table');
    } else if ((notifications?.length || 0) === 0) {
      console.log('\n🔧 ISSUE FOUND:');
      console.log('   ❌ No webhook notifications in database');
      console.log('   💡 Possible causes:');
      console.log('     - Webhook not properly registered with DfT');
      console.log('     - Webhook handler not saving to Supabase');
      console.log('     - Table permission issues');
      console.log('   🎯 Test webhook: POST https://go-barry.onrender.com/api/streetmanager/webhook/test');
    } else if ((notifications?.length || 0) > 0 && (roadworks?.length || 0) > 0) {
      console.log('\n✅ WORKING CORRECTLY:');
      console.log('   ✅ Webhooks being received');
      console.log('   ✅ Data being processed to roadworks');
      console.log('   🤔 Check if unified manager is reading from correct tables');
    }
    
    // 5. Test webhook endpoint
    console.log('\n4️⃣ Testing webhook endpoint...');
    try {
      const response = await fetch('https://go-barry.onrender.com/api/streetmanager/webhook', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Webhook endpoint accessible:', data.status);
      } else {
        console.log('❌ Webhook endpoint error:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Webhook endpoint not reachable:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testStreetManagerData();
