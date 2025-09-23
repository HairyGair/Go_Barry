#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkActualSchema() {
  console.log('🔍 Checking actual database schema by examining existing data...\n');

  try {
    // Get an existing breakdown to see the actual column structure
    const { data: breakdowns, error } = await supabase
      .from('breakdowns')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching breakdown:', error);
      return;
    }

    if (breakdowns.length === 0) {
      console.log('📋 No existing breakdowns found');
      return;
    }

    const breakdown = breakdowns[0];
    console.log('📊 Actual columns in breakdowns table:');
    Object.keys(breakdown).sort().forEach(key => {
      const value = breakdown[key];
      const type = typeof value;
      console.log(`   ${key}: ${type} = ${value === null ? 'NULL' : String(value).substring(0, 50)}`);
    });

    console.log(`\n📝 Total columns: ${Object.keys(breakdown).length}`);

    // Check specifically for fleet-related columns
    console.log('\n🚗 Fleet-related columns:');
    Object.keys(breakdown).filter(key => key.toLowerCase().includes('fleet')).forEach(key => {
      console.log(`   ${key}: ${breakdown[key]}`);
    });

    // Check for other common column variations
    console.log('\n📍 Location-related columns:');
    Object.keys(breakdown).filter(key => key.toLowerCase().includes('location')).forEach(key => {
      console.log(`   ${key}: ${breakdown[key]}`);
    });

    console.log('\n🔧 Issue-related columns:');
    Object.keys(breakdown).filter(key => key.toLowerCase().includes('issue')).forEach(key => {
      console.log(`   ${key}: ${breakdown[key]}`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

async function testMinimalInsert() {
  console.log('\n🧪 Testing minimal insert to find required fields...\n');

  const testData = {
    breakdown_id: `MINIMAL-TEST-${Date.now()}`,
    status: 'received',
    severity: 'AMBER',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log('📋 Minimal insert error (shows required fields):');
      console.log(`   ${error.message}`);

      // Extract column name from error message
      const match = error.message.match(/column "([^"]+)"/);
      if (match) {
        console.log(`\n🔍 Missing required column: ${match[1]}`);
      }
    } else {
      console.log('✅ Minimal insert successful!');
      console.log('📋 Created breakdown:', data.breakdown_id);

      // Clean up
      await supabase.from('breakdowns').delete().eq('id', data.id);
      console.log('🧹 Cleaned up test data');
    }

  } catch (err) {
    console.error('💥 Test error:', err);
  }
}

async function main() {
  await checkActualSchema();
  await testMinimalInsert();
}

main().catch(console.error);