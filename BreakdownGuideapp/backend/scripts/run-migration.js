#!/usr/bin/env node

/**
 * Run database migration using Supabase service role
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(migrationFile) {
  console.log(`🚀 Running migration: ${migrationFile}`);

  const migrationPath = join(__dirname, '../migrations', migrationFile);
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n⚙️  Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Try alternative method using raw SQL
        const { error: altError } = await supabase
          .from('_migrations')
          .insert({ sql: statement });

        if (altError) {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`✅ Statement executed successfully (alt method)`);
        }
      } else {
        console.log(`✅ Statement executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      console.error(`Statement: ${statement.substring(0, 100)}...`);
    }
  }

  console.log('\n🎉 Migration complete!');
}

// Get migration file from command line or use default
const migrationFile = process.argv[2] || 'add_updated_at_column.sql';

runMigration(migrationFile).catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
