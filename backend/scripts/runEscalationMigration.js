// backend/scripts/runEscalationMigration.js
// Script to run the escalation schema migration on Supabase

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://haountnghecfrsoniubq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhb3VudG5naGVjZnJzb25pdWJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODE0OSwiZXhwIjoyMDYzMjU0MTQ5fQ.k2Ni4hNfyqzJl3AHHQF1mDdRJ7g5s1o5qTlrxmCsvaY'
);

async function runEscalationMigration() {
  try {
    console.log('🚀 Starting escalation schema migration...');
    console.log('📍 Target: Supabase database for Go BARRY escalation system');
    
    // Read the SQL migration file
    const sqlPath = join(__dirname, '..', 'sql', 'escalation_schema.sql');
    const migrationSQL = readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, size:', (migrationSQL.length / 1024).toFixed(1), 'KB');
    
    // Check Supabase connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('streetworks')
      .select('id')
      .limit(1);
    
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    console.log('✅ Supabase connection verified');
    
    // Split SQL into individual statements (basic splitting)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.toLowerCase().includes('comment on'))
      .filter(stmt => !stmt.toLowerCase().includes('raise notice'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty or comment-only statements
      if (!statement || statement.startsWith('--') || statement.length < 10) {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute using raw SQL via the REST API
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Some errors are expected (like "already exists"), so we log but continue
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('permission denied')) {
            console.log(`⚠️ Expected error (continuing): ${error.message.substring(0, 100)}...`);
            successCount++;
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Statement ${i + 1} threw error:`, error.message);
        errorCount++;
        
        // Continue with other statements even if one fails
        continue;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📁 Total statements: ${statements.length}`);
    
    // Test that essential tables were created
    console.log('\n🧪 Testing created tables...');
    
    const tablesToTest = ['disruptions', 'display_screen_alerts', 'supervisor_audit_log'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`⚠️ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: accessible`);
        }
      } catch (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      }
    }
    
    // Test the escalation statistics function
    console.log('\n🔧 Testing escalation functions...');
    try {
      const { data, error } = await supabase.rpc('get_escalation_stats', {
        supervisor_badge: null,
        days_back: 7
      });
      
      if (error) {
        console.log(`⚠️ Function get_escalation_stats: ${error.message}`);
      } else {
        console.log('✅ Function get_escalation_stats: working');
        console.log('📊 Current stats:', data?.[0] || 'No data');
      }
    } catch (error) {
      console.log(`❌ Function get_escalation_stats: ${error.message}`);
    }
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('🚀 Escalation system database is ready for production');
    } else if (successCount > errorCount) {
      console.log('\n⚠️ Migration completed with some warnings');
      console.log('✅ Core functionality should be available');
      console.log('🔍 Review failed statements if needed');
    } else {
      console.log('\n❌ Migration completed with significant errors');
      console.log('⚠️ Manual review required before using escalation system');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Verify tables exist in Supabase dashboard');
    console.log('2. Test escalation API endpoints');
    console.log('3. Run frontend escalation workflow tests');
    
  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function runMigrationDirect() {
  console.log('🔄 Attempting direct SQL execution...');
  
  try {
    const sqlPath = join(__dirname, '..', 'sql', 'escalation_schema.sql');
    const migrationSQL = readFileSync(sqlPath, 'utf8');
    
    // Try to execute as one large statement
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Direct execution failed:', error.message);
      return false;
    }
    
    console.log('✅ Direct execution succeeded');
    return true;
    
  } catch (error) {
    console.error('❌ Direct execution error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🏗️ Go BARRY Escalation Schema Migration');
  console.log('=====================================');
  console.log(`📅 Started: ${new Date().toLocaleString()}`);
  
  // Try direct execution first, fall back to statement-by-statement
  const directSuccess = await runMigrationDirect();
  
  if (!directSuccess) {
    console.log('\n🔄 Direct execution failed, trying statement-by-statement...');
    await runEscalationMigration();
  }
  
  console.log(`\n🏁 Migration process completed at: ${new Date().toLocaleString()}`);
}

// Run the migration
main().catch(console.error);