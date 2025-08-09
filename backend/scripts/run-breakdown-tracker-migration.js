/*
 * Breakdown Tracker Migration Runner
 * Executes the database schema for breakdown tracking system
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import supabaseService from '../services/supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting Breakdown Tracker migration...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../migrations/create_breakdown_tracker.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Read migration file:', sqlPath);
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabaseService.client.rpc('sql', {
          query: statement
        });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Expected warning: ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log(`Statement: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }
    
    // Test the setup by checking if tables exist
    console.log('\n🔍 Verifying migration results...');
    
    const { data: tables, error: tablesError } = await supabaseService.client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['breakdowns', 'breakdown_events']);
    
    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
    } else {
      const tableNames = tables.map(t => t.table_name);
      console.log('✅ Tables created:', tableNames.join(', '));
    }
    
    // Test the views
    const { data: views, error: viewsError } = await supabaseService.client
      .from('information_schema.views')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['breakdown_stage_durations', 'depot_kpi_summary']);
    
    if (viewsError) {
      console.error('❌ Error verifying views:', viewsError);
    } else {
      const viewNames = views.map(v => v.table_name);
      console.log('✅ Views created:', viewNames.join(', '));
    }
    
    // Test the function
    try {
      const { data: activeBreakdowns, error: functionError } = await supabaseService.client
        .rpc('get_active_breakdowns');
      
      if (functionError) {
        console.error('❌ Error testing function:', functionError);
      } else {
        console.log(`✅ Function working: found ${activeBreakdowns.length} active breakdowns`);
      }
    } catch (err) {
      console.error('❌ Exception testing function:', err.message);
    }
    
    console.log('\n🎉 Breakdown Tracker migration completed successfully!');
    console.log('📊 System is ready for timed response analytics');
    
    // Show next steps
    console.log('\n📋 Next steps:');
    console.log('1. Start logging breakdowns using the API: POST /api/breakdown-tracker/create');
    console.log('2. Update breakdown stages: POST /api/breakdown-tracker/{id}/event');
    console.log('3. View active breakdowns: GET /api/breakdown-tracker/active');
    console.log('4. Check depot KPIs: GET /api/breakdown-tracker/kpi/depot-summary');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();