#!/usr/bin/env node
/**
 * Test script for the unified activity system
 *
 * This script tests:
 * 1. Activity table creation
 * 2. Activity logging service
 * 3. API endpoints
 * 4. Real-time subscriptions
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { activityLogger } from './services/activityLogger.js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testActivitySystem() {
  console.log('🧪 Testing Activity System');
  console.log('========================\n');

  try {
    // Test 1: Check if activities table exists
    console.log('1. Checking activities table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('activities')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.message.includes('relation "activities" does not exist')) {
        console.log('❌ Activities table does not exist');
        console.log('🔧 Please run the migration: backend/migrations/create_activities_table.sql');
        return;
      } else {
        throw tableError;
      }
    }
    console.log('✅ Activities table exists\n');

    // Test 2: Test activity logging service
    console.log('2. Testing activity logging service...');
    await activityLogger.init();

    const testActivity = await activityLogger.logActivity({
      activityType: 'system_test',
      action: 'testing activity logging system',
      actorType: 'system',
      actorId: 'TEST',
      actorName: 'Test System',
      entityType: 'test',
      entityId: 'test-001',
      entityDetails: { test: true },
      depot: 'TEST_DEPOT',
      severity: 'info',
      source: 'test_script',
      metadata: { testRun: new Date().toISOString() }
    });

    if (testActivity) {
      console.log('✅ Activity logged successfully:', testActivity.id);
    } else {
      console.log('❌ Failed to log activity');
    }

    // Test 3: Test batch logging
    console.log('\n3. Testing batch activity logging...');
    const batchActivities = [
      {
        activity_type: 'breakdown_reported',
        action: 'reported brake issue on 6098',
        actor_type: 'supervisor',
        actor_id: 'TEST001',
        actor_name: 'Test Supervisor',
        entity_type: 'breakdown',
        entity_id: 'BRK-001',
        entity_details: { fleetNo: '6098', issueCategory: 'brakes' },
        depot: 'Washington',
        severity: 'critical',
        source: 'test_script',
        metadata: { test: true },
        icon: '🚨',
        message: 'Test Supervisor reported brake issue on 6098'
      },
      {
        activity_type: 'wizard_completed',
        action: 'completed brakes assessment - STOP',
        actor_type: 'supervisor',
        actor_id: 'TEST001',
        actor_name: 'Test Supervisor',
        entity_type: 'breakdown',
        entity_id: 'BRK-001',
        entity_details: { fleetNo: '6098', decision: 'STOP', wizardType: 'brakes' },
        depot: 'Washington',
        severity: 'critical',
        source: 'breakdown_guide',
        metadata: { wizardType: 'brakes', decision: 'STOP' },
        icon: '📋🚨',
        message: 'Test Supervisor completed brakes assessment - STOP'
      }
    ];

    const batchResult = await activityLogger.logActivities(batchActivities);
    console.log(`✅ Batch logged ${batchResult.length} activities\n`);

    // Test 4: Test fetching activities
    console.log('4. Testing activity retrieval...');
    const recentActivities = await activityLogger.getRecentActivities(10);
    if (recentActivities.success) {
      console.log(`✅ Retrieved ${recentActivities.count} recent activities`);
      if (recentActivities.activities.length > 0) {
        console.log('   Latest activity:', {
          type: recentActivities.activities[0].activity_type,
          actor: recentActivities.activities[0].actor_name,
          action: recentActivities.activities[0].action
        });
      }
    } else {
      console.log('❌ Failed to retrieve activities:', recentActivities.error);
    }

    // Test 5: Test search
    console.log('\n5. Testing activity search...');
    const searchResult = await activityLogger.searchActivities('brake');
    if (searchResult.success) {
      console.log(`✅ Search found ${searchResult.count} activities`);
    } else {
      console.log('❌ Search failed:', searchResult.error);
    }

    // Test 6: Test API endpoints
    console.log('\n6. Testing API endpoints...');
    const apiTests = [
      { endpoint: '/api/activity/feed', method: 'GET' },
      { endpoint: '/api/activity/live', method: 'GET' },
      { endpoint: '/api/activity/stats', method: 'GET' }
    ];

    for (const test of apiTests) {
      try {
        const response = await fetch(`http://localhost:3001${test.endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${test.endpoint} - Status: ${response.status}, Activities: ${data.activities?.length || data.stats ? 'stats' : 0}`);
        } else {
          console.log(`❌ ${test.endpoint} - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${test.endpoint} - Error: Connection failed (is server running?)`);
      }
    }

    // Test 7: Test real-time subscription setup
    console.log('\n7. Testing real-time subscription setup...');
    try {
      const channel = supabase.channel('test-activities');

      let subscriptionWorking = false;

      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities'
      }, (payload) => {
        console.log('📡 Real-time event received:', payload.new.action);
        subscriptionWorking = true;
      });

      await new Promise((resolve) => {
        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription established');

            // Test with a new activity
            activityLogger.logActivity({
              activityType: 'real_time_test',
              action: 'testing real-time subscription',
              actorType: 'system',
              actorId: 'TEST-RT',
              actorName: 'Real-time Test',
              severity: 'info',
              source: 'test_script'
            }).then(() => {
              setTimeout(() => {
                channel.unsubscribe();
                if (subscriptionWorking) {
                  console.log('✅ Real-time events working');
                } else {
                  console.log('⚠️ Real-time subscription established but no events received');
                }
                resolve();
              }, 2000);
            });
          } else if (status === 'CHANNEL_ERROR') {
            console.log('❌ Real-time subscription failed:', err);
            resolve();
          }
        });
      });
    } catch (error) {
      console.log('❌ Real-time test error:', error.message);
    }

    console.log('\n🎉 Activity System Test Complete!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: npm run dev (in frontend directory)');
    console.log('3. Test breakdown guide wizards to see real-time updates');
    console.log('4. Check the Live Activity Feed in the app');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testActivitySystem().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});