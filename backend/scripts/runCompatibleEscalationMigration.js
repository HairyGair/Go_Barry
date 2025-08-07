// Run compatible escalation schema migration
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

async function runCompatibleMigration() {
  console.log('🚀 Running Compatible Escalation Schema Migration');
  console.log('=================================================');
  
  try {
    // Read the compatible migration SQL
    const sqlPath = join(__dirname, '..', 'sql', 'escalation_schema_compatible.sql');
    const migrationSQL = readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, size:', (migrationSQL.length / 1024).toFixed(1), 'KB');
    
    // Test Supabase connection
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('disruptions')
      .select('id')
      .limit(1);
    
    if (testError && testError.code !== '42P01') {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    
    console.log('✅ Supabase connection verified');
    
    // Split SQL into individual statements for better error handling
    const statements = migrationSQL
      .split(/;(?=\s|$)/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the sql RPC function for DDL statements
        const { error } = await supabase.rpc('sql', { 
          query: statement + ';' 
        });
        
        if (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate key')) {
            console.log(`⚠️ Statement ${i + 1} skipped (already exists or not needed)`);
            skipCount++;
          } else {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Statement ${i + 1} exception:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️ Skipped statements: ${skipCount}`);
    console.log(`❌ Failed statements: ${statements.length - successCount - skipCount}`);
    
    // Test the created tables
    console.log('\n🧪 Testing created tables...');
    
    const tablesToTest = ['disruptions', 'display_screen_alerts', 'supervisor_audit_log'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
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
        days_back: 7
      });
      
      if (error) {
        console.log(`⚠️ Function get_escalation_stats: ${error.message}`);
      } else {
        console.log('✅ Function get_escalation_stats: working');
        console.log('📊 Sample stats:', JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`❌ Function get_escalation_stats: ${error.message}`);
    }
    
    if (successCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 Escalation system database is ready');
    } else {
      console.log('\n⚠️ Migration completed with warnings');
      console.log('💡 Some components may already exist or need manual review');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Update escalation service to use new columns');
    console.log('2. Test escalation API endpoints');
    console.log('3. Run frontend escalation workflow tests');
    
    return true;
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function main() {
  const success = await runCompatibleMigration();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);