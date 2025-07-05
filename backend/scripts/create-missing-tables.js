#!/usr/bin/env node

/**
 * Create missing tables in Supabase database
 * This script creates the manual_roadworks table that is referenced in the code
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createMissingTables() {
  console.log('🚀 Creating missing tables in Supabase...');
  
  try {
    // Read the SQL file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const sqlPath = join(__dirname, '../../create_missing_tables.sql');
    
    console.log('📖 Reading SQL from:', sqlPath);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('🔧 Executing SQL to create manual_roadworks table...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // If the RPC function doesn't exist, try a simpler approach
      console.log('🔄 Trying alternative approach...');
      
      // Create table with basic structure
      const { error: createError } = await supabase
        .from('manual_roadworks')
        .select('*')
        .limit(1);
      
      if (createError && createError.code === '42P01') {
        console.log('✅ Confirmed: manual_roadworks table does not exist');
        console.log('ℹ️  Please run the SQL manually in Supabase SQL Editor:');
        console.log('📋 SQL to run:');
        console.log(sqlContent);
      }
    } else {
      console.log('✅ SQL executed successfully');
      console.log('📊 Result:', data);
    }
    
    // Test if the table now exists
    console.log('🧪 Testing if manual_roadworks table exists...');
    const { data: testData, error: testError } = await supabase
      .from('manual_roadworks')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table still does not exist:', testError.message);
      console.log('');
      console.log('🔧 MANUAL ACTION REQUIRED:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL from: create_missing_tables.sql');
      console.log('');
    } else {
      console.log('✅ manual_roadworks table exists and is accessible');
      console.log('📊 Current row count:', testData);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createMissingTables();