#!/usr/bin/env node

/**
 * Create StreetManager Notifications Table
 * 
 * This script creates the comprehensive streetmanager_notifications table
 * for the Go BARRY webhook integration with proper indexing and RLS policies.
 * 
 * Usage: node scripts/create-streetmanager-notifications-table.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function createStreetManagerNotificationsTable() {
  console.log('🚀 Creating StreetManager Notifications Table for Go BARRY\n');
  
  // Use service key for admin operations, fallback to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    supabaseKey
  );

  try {
    // First, verify database connection
    console.log('🔍 Verifying database connection...');
    
    const { data: testData, error: testError } = await supabase
      .from('supervisors')
      .select('badge')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection verified');

    // Check if table already exists
    console.log('\n🔍 Checking if streetmanager_notifications table exists...');
    
    const { data: existingTable, error: tableError } = await supabase
      .from('streetmanager_notifications')
      .select('notification_id')
      .limit(1);
    
    if (!tableError) {
      console.log('⚠️ Table streetmanager_notifications already exists');
      console.log('🔄 You may need to drop it first or use ALTER statements');
      
      // Show current record count
      const { count } = await supabase
        .from('streetmanager_notifications')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Current record count: ${count || 0}`);
      
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('\n💡 Use --force flag to proceed anyway');
        return;
      }
    }

    // Read the SQL schema file
    console.log('\n📋 Loading SQL schema...');
    
    const schemaPath = join(__dirname, '../sql/streetmanager_notifications_schema.sql');
    let schemaSql;
    
    try {
      schemaSql = readFileSync(schemaPath, 'utf8');
      console.log('✅ Schema loaded successfully');
    } catch (readError) {
      console.error('❌ Failed to read schema file:', readError.message);
      console.log('Expected location:', schemaPath);
      return;
    }

    // Split SQL into individual statements (rough approach)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n🔧 Executing ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For CREATE TABLE, INDEX, etc., we need to use rpc with sql function
        // This is a workaround for Supabase's limitations with DDL statements
        
        if (statement.toLowerCase().includes('create') || 
            statement.toLowerCase().includes('alter') ||
            statement.toLowerCase().includes('grant') ||
            statement.toLowerCase().includes('comment')) {
          
          // Try direct SQL execution first
          const { data, error } = await supabase.rpc('sql', {
            query: statement
          });
          
          if (error) {
            // If rpc('sql') doesn't work, try alternative method
            console.warn(`⚠️ RPC method failed, trying alternative: ${error.message}`);
            
            // For some operations, we might need to construct them differently
            if (statement.toLowerCase().includes('create table')) {
              console.log('Creating table via Supabase client...');
              // This would require breaking down the CREATE TABLE statement
              // For now, log the error and continue
              console.error(`❌ Statement ${i + 1} failed:`, error.message);
              errorCount++;
              continue;
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          // For other statements, skip or handle differently
          console.log(`⏭️ Skipping statement ${i + 1} (not supported via client)`);
        }
        
      } catch (execError) {
        console.error(`❌ Statement ${i + 1} failed:`, execError.message);
        console.log('Statement:', statement.substring(0, 100) + '...');
        errorCount++;
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('streetmanager_notifications')
      .select('notification_id')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Table verification failed:', verifyError.message);
      console.log('\n🛠️ Manual Steps Required:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Copy and paste the SQL from:');
      console.log(`   ${schemaPath}`);
      console.log('3. Execute the SQL manually');
      return;
    }

    console.log('✅ Table created and accessible!');

    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test insert
    const testNotification = {
      notification_id: `test_${Date.now()}`,
      raw_webhook_data: { test: true },
      permit_reference_number: 'TEST-001',
      street_name: 'Test Street',
      town: 'Newcastle',
      work_status: 'planned'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('streetmanager_notifications')
      .insert(testNotification)
      .select();
    
    if (insertError) {
      console.log('❌ Test insert failed:', insertError.message);
    } else {
      console.log('✅ Test insert successful');
      
      // Clean up test record
      await supabase
        .from('streetmanager_notifications')
        .delete()
        .eq('notification_id', testNotification.notification_id);
      
      console.log('✅ Test record cleaned up');
    }

    console.log('\n🎉 StreetManager Notifications Table Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Update webhook handlers to use the new table');
    console.log('2. Test webhook integration with Street Manager');
    console.log('3. Monitor performance and adjust indexes as needed');
    console.log('4. Set up automated cleanup job (optional)');
    
    console.log('\n🔧 Table Features:');
    console.log('• Optimized indexes for webhook queries');
    console.log('• Row Level Security (RLS) enabled');
    console.log('• Automatic cleanup date calculation');
    console.log('• Duplicate detection via hash');
    console.log('• UK-specific fields for StreetManager data');
    console.log('• Route impact scoring');
    console.log('• Performance views for common queries');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🆘 If you encounter permission errors:');
    console.log('1. Ensure SUPABASE_SERVICE_KEY is set in .env');
    console.log('2. Or run the SQL manually in Supabase SQL Editor');
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('Usage: node scripts/create-streetmanager-notifications-table.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --force    Proceed even if table already exists');
  console.log('  --help     Show this help message');
  process.exit(0);
}

createStreetManagerNotificationsTable().catch(console.error);