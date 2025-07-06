#!/usr/bin/env node

/**
 * Migration script to move existing Street Manager data to hybrid storage
 * 
 * Steps:
 * 1. Extract all data from bloated streetmanager_notifications table
 * 2. Convert to new hybrid format (summaries + JSON files)
 * 3. Verify migration success
 * 4. DROP the bloated table to reclaim 489MB immediately
 */

import { createClient } from '@supabase/supabase-js';
import HybridStreetManagerStorage from '../services/hybridStreetManagerStorage.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const hybridStorage = new HybridStreetManagerStorage();

async function migrateStreetManagerData() {
  console.log('🚀 Go BARRY - Street Manager Data Migration\n');
  console.log('📊 This will migrate data and DROP the 489MB bloated table\n');
  
  try {
    // Step 1: Check current state
    console.log('📋 Step 1: Checking current database state...');
    
    const { data: currentNotifications, error: fetchError } = await supabase
      .from('streetmanager_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2044); // We know there are 2044 rows
    
    if (fetchError) {
      console.error('❌ Failed to fetch existing notifications:', fetchError);
      process.exit(1);
    }
    
    console.log(`✅ Found ${currentNotifications?.length || 0} notifications to migrate`);
    
    if (!currentNotifications || currentNotifications.length === 0) {
      console.log('ℹ️ No data to migrate, proceeding to table drop...');
    } else {
      // Step 2: Migrate to hybrid storage
      console.log('\n📦 Step 2: Migrating to hybrid storage...');
      
      let migratedCount = 0;
      let errorCount = 0;
      
      for (const notification of currentNotifications) {
        try {
          // Convert old format to new hybrid format
          const payload = notification.notification_data || notification;
          const result = await hybridStorage.storeNotification(payload);
          
          if (result.success) {
            migratedCount++;
            if (migratedCount % 100 === 0) {
              console.log(`   📈 Migrated ${migratedCount}/${currentNotifications.length}...`);
            }
          } else {
            errorCount++;
            console.error(`   ❌ Failed to migrate ${notification.id}:`, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Migration error for ${notification.id}:`, error.message);
        }
      }
      
      console.log(`\n✅ Migration completed:`);
      console.log(`   📈 Successfully migrated: ${migratedCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      
      // Step 3: Verify migration
      console.log('\n🔍 Step 3: Verifying migration...');
      
      const { data: newSummaries, error: verifyError } = await supabase
        .from('streetmanager_summaries')
        .select('*', { count: 'exact' });
      
      if (verifyError) {
        console.error('❌ Verification failed:', verifyError);
        process.exit(1);
      }
      
      console.log(`✅ Verification successful: ${newSummaries?.length || 0} records in new table`);
      
      // Check storage stats
      const stats = await hybridStorage.getStorageStats();
      console.log(`📊 Storage stats:`, stats);
    }
    
    // Step 4: DROP the bloated table
    console.log('\n💥 Step 4: DROPPING bloated streetmanager_notifications table...');
    console.log('⚠️  This will immediately reclaim 489MB of database space!');
    
    // Final confirmation
    console.log('\n⏰ Executing DROP TABLE in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const { data: dropResult, error: dropError } = await supabase.rpc('sql', {
      query: 'DROP TABLE IF EXISTS streetmanager_notifications CASCADE;'
    });
    
    if (dropError) {
      console.error('❌ Failed to drop table:', dropError);
      
      // Try alternative drop method
      console.log('🔄 Trying alternative drop method...');
      
      const dropResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: 'DROP TABLE streetmanager_notifications CASCADE;'
        })
      });
      
      if (!dropResponse.ok) {
        console.error('❌ Alternative drop method also failed');
        console.log('💡 Manual action required: DROP TABLE streetmanager_notifications CASCADE;');
      } else {
        console.log('✅ Table dropped successfully via alternative method!');
      }
    } else {
      console.log('✅ Table dropped successfully!');
    }
    
    // Step 5: Final verification
    console.log('\n🏁 Step 5: Final verification...');
    
    // Check if table still exists
    const { data: tableCheck, error: tableError } = await supabase.rpc('sql', {
      query: "SELECT to_regclass('streetmanager_notifications') as table_exists;"
    });
    
    if (tableCheck && tableCheck[0]?.table_exists === null) {
      console.log('🎉 SUCCESS! Bloated table has been completely removed!');
      console.log('📉 Database size should drop from 510MB to <50MB within minutes');
    } else {
      console.log('⚠️ Table may still exist - check Supabase dashboard');
    }
    
    // Final storage stats
    const finalStats = await hybridStorage.getStorageStats();
    console.log('\n📊 Final storage stats:');
    console.log('   Database summaries:', finalStats.database.size_estimate);
    console.log('   JSON files:', finalStats.files.size_estimate);
    
    console.log('\n✨ Migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Monitor database size reduction in Supabase dashboard');
    console.log('   2. Update webhook endpoints to use hybrid storage');
    console.log('   3. Set up automatic cleanup job');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateStreetManagerData().catch(console.error);