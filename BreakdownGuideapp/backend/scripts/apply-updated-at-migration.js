#!/usr/bin/env node

/**
 * Apply updated_at column migration
 * This fixes the trigger issue preventing breakdown updates
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Applying updated_at column migration...');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Read the migration SQL file
const migrationPath = join(__dirname, '../migrations/add_updated_at_column.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('\n📄 Migration SQL:');
console.log(migrationSQL);
console.log('\n⚠️  Note: This migration must be run directly in Supabase SQL Editor');
console.log('📋 Steps:');
console.log('1. Go to your Supabase project');
console.log('2. Open the SQL Editor');
console.log('3. Copy and paste the migration SQL above');
console.log('4. Click "Run" to execute');
console.log('\n✅ After running the migration, the /api/sdc/resolve endpoint will work correctly');
