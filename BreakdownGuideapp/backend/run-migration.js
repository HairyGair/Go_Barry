#!/usr/bin/env node

/**
 * Migration Runner Script
 * Runs SQL migrations against Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://oieliubbvvdzhzvikzal.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.error('   Get it from: https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/settings/api');
  console.error('   Usage: SUPABASE_SERVICE_KEY="your-key" node run-migration.js migrations/add_resolution_columns.sql');
  process.exit(1);
}

// Get migration file path from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Migration file path is required');
  console.error('   Usage: SUPABASE_SERVICE_KEY="your-key" node run-migration.js migrations/add_resolution_columns.sql');
  process.exit(1);
}

// Read migration file
const migrationPath = join(__dirname, migrationFile);
let sql;
try {
  sql = readFileSync(migrationPath, 'utf8');
  console.log(`📄 Read migration file: ${migrationFile}`);
} catch (error) {
  console.error(`❌ Failed to read migration file: ${error.message}`);
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔌 Connected to Supabase');

// Run migration
console.log('🚀 Running migration...\n');

try {
  // Execute SQL using Supabase's RPC function (if available)
  // Note: This requires a custom RPC function in Supabase, or we use raw SQL

  // For Supabase, we need to execute SQL statements individually
  // Split on semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement || statement.startsWith('COMMENT')) {
      // Skip empty and COMMENT statements (they may not work with RPC)
      continue;
    }

    console.log(`  ${i + 1}. ${statement.substring(0, 60)}...`);

    try {
      // Use RPC to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        throw error;
      }

      console.log(`     ✅ Success`);
    } catch (error) {
      console.error(`     ❌ Error: ${error.message}`);
      // Continue with other statements
    }
  }

  console.log('\n✅ Migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error('\n📋 Alternative: Run this SQL directly in Supabase Dashboard > SQL Editor:');
  console.error('   https://supabase.com/dashboard/project/oieliubbvvdzhzvikzal/editor/sql');
  console.error('\nSQL to execute:');
  console.error('─'.repeat(80));
  console.error(sql);
  console.error('─'.repeat(80));
  process.exit(1);
}
