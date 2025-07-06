#!/usr/bin/env node

/**
 * Create new hybrid storage tables and check current database state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function createHybridTables() {
  console.log('🚀 Creating Hybrid Storage System\n');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  try {
    // First, let's check if we can access any data
    console.log('🔍 Checking database access...');
    
    // Test basic table access
    const { data: supervisors, error: supError } = await supabase
      .from('supervisors')
      .select('badge')
      .limit(1);
    
    if (supError) {
      console.log('❌ Cannot access supervisors table:', supError.message);
    } else {
      console.log('✅ Database access confirmed');
    }
    
    // Check if the problematic table still exists
    console.log('\n🔍 Checking streetmanager_notifications...');
    
    const { data: notifications, error: notError } = await supabase
      .from('streetmanager_notifications')
      .select('id')
      .limit(1);
    
    if (notError) {
      if (notError.message.includes('does not exist')) {
        console.log('🎉 streetmanager_notifications table does not exist - already dropped!');
        console.log('📉 Database bloat should be resolved');
      } else {
        console.log('❌ Error accessing streetmanager_notifications:', notError.message);
      }
    } else {
      console.log('⚠️ streetmanager_notifications table still exists with data');
      console.log('🔄 Need to drop this table to reclaim 489MB');
    }
    
    // Try to create the new tables
    console.log('\n📦 Creating hybrid storage tables...');
    
    // Create summaries table
    console.log('Creating streetmanager_summaries...');
    const { data: createSummaries, error: summariesError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS streetmanager_summaries (
          id SERIAL PRIMARY KEY,
          notification_id VARCHAR(255) UNIQUE,
          location TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          severity VARCHAR(50),
          contractor TEXT,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          cleanup_date TIMESTAMP,
          file_reference VARCHAR(255)
        );
        
        CREATE INDEX IF NOT EXISTS idx_summaries_cleanup_date ON streetmanager_summaries(cleanup_date);
        CREATE INDEX IF NOT EXISTS idx_summaries_status ON streetmanager_summaries(status);
        CREATE INDEX IF NOT EXISTS idx_summaries_location ON streetmanager_summaries(location);
      `
    });
    
    if (summariesError) {
      console.log('❌ Failed to create summaries table:', summariesError.message);
    } else {
      console.log('✅ streetmanager_summaries table created');
    }
    
    // Create templates table
    console.log('Creating driver_message_templates...');
    const { data: createTemplates, error: templatesError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS driver_message_templates (
          id SERIAL PRIMARY KEY,
          location_key TEXT UNIQUE NOT NULL,
          message_template TEXT NOT NULL,
          last_used TIMESTAMP DEFAULT NOW(),
          times_used INTEGER DEFAULT 1,
          created_by VARCHAR(10)
        );
        
        CREATE INDEX IF NOT EXISTS idx_templates_location_key ON driver_message_templates(location_key);
      `
    });
    
    if (templatesError) {
      console.log('❌ Failed to create templates table:', templatesError.message);
    } else {
      console.log('✅ driver_message_templates table created');
    }
    
    // Create cleanup jobs table
    console.log('Creating cleanup_jobs...');
    const { data: createCleanup, error: cleanupError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS cleanup_jobs (
          id SERIAL PRIMARY KEY,
          job_type VARCHAR(50) NOT NULL,
          run_date TIMESTAMP DEFAULT NOW(),
          records_cleaned INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'completed'
        );
      `
    });
    
    if (cleanupError) {
      console.log('❌ Failed to create cleanup_jobs table:', cleanupError.message);
    } else {
      console.log('✅ cleanup_jobs table created');
    }
    
    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    
    const { data: summariesTest, error: summariesTestError } = await supabase
      .from('streetmanager_summaries')
      .select('*')
      .limit(1);
    
    if (summariesTestError) {
      console.log('❌ Cannot access streetmanager_summaries:', summariesTestError.message);
    } else {
      console.log('✅ streetmanager_summaries table accessible');
    }
    
    const { data: templatesTest, error: templatesTestError } = await supabase
      .from('driver_message_templates')
      .select('*')
      .limit(1);
    
    if (templatesTestError) {
      console.log('❌ Cannot access driver_message_templates:', templatesTestError.message);
    } else {
      console.log('✅ driver_message_templates table accessible');
    }
    
    console.log('\n🎉 Hybrid storage system setup completed!');
    console.log('📋 Next steps:');
    console.log('   1. If streetmanager_notifications still exists, drop it manually');
    console.log('   2. Update Street Manager webhook to use new storage');
    console.log('   3. Deploy to production');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createHybridTables().catch(console.error);